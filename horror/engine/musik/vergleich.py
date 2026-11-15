#!/usr/bin/env python3
"""Eigene Schleifen gegen die Referenz-Betten messen (Spektrum, Tempo, Lautheitsprofil, Breite, Hall).

    python engine/musik/vergleich.py referenz r2 PFAD/bett-getrennt.wav [--start 0 --ende 146]
        -> engine/musik/messwerte/ref-r2.json   (nur Zahlen; der Stem selbst bleibt im Scratchpad)
    python engine/musik/vergleich.py eigen --stufe 1
        -> engine/musik/messwerte/vergleich-stufe1.json und .md

Beide Seiten laufen durch dieselbe Funktion messen() (numpy, ohne scipy/librosa). Damit sind auch
grobe Größen wie die Hall-Schätzung vergleichbar: Gleiche Methode, gleiche Fehler.

Paare (eigene Variante <-> Referenz-Ausschnitt):
  spieluhr normal  <-> r2 (0–146 s)          wiegenlied normal <-> r5 rein (12–161 s, ohne Hook)
  klavier duenn    <-> ref0 Stufe 1 (0–43 s)  klavier voll      <-> ref0 Stufe 2 (43–131 s)
  drone voll       <-> r1 (0–61,5 s, mit Effekten)
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np

HIER = Path(__file__).resolve().parent
sys.path.insert(0, str(HIER))
import klang  # noqa: E402

SR = klang.SR
TERZ = [31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600,
        2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500]
BAENDER = [(20, 60), (60, 150), (150, 400), (400, 1000), (1000, 2500), (2500, 6000), (6000, 16000)]
PAARE = [("spieluhr", "normal", "r2"), ("wiegenlied", "normal", "r5-rein"), ("klavier", "duenn", "ref0-stufe1"),
         ("klavier", "voll", "ref0-stufe2"), ("drone", "voll", "r1")]


def welch(x: np.ndarray, n: int = 16384) -> tuple[np.ndarray, np.ndarray]:
    """Mittleres Leistungsspektrum (Hann, 50 % Überlappung)."""
    w = np.hanning(n)
    starts = range(0, len(x) - n, n // 2)
    P = np.zeros(n // 2 + 1)
    k = 0
    for s in starts:
        P += np.abs(np.fft.rfft(x[s:s + n] * w)) ** 2
        k += 1
    return np.fft.rfftfreq(n, 1 / SR), P / max(1, k)


def fluss(mono: np.ndarray, n: int = 2048, hop: int = 441) -> np.ndarray:
    """Spektraler Fluss nach dem SuperFlux-Prinzip, ein Wert je 10 ms: 48 log-Bänder 150 Hz – 8 kHz,
    log-Leistung, Anstieg gegen das Maximum der Nachbarbänder zwei Rahmen vorher. Das Maximum über
    die Nachbarbänder unterdrückt Leiern und Vibrato, die sonst als Einsätze zählen würden."""
    from numpy.lib.stride_tricks import sliding_window_view as swv
    S = np.abs(np.fft.rfft(swv(mono, n)[::hop] * np.hanning(n), axis=1)) ** 2
    f = np.fft.rfftfreq(n, 1 / SR)
    kanten = np.geomspace(150, 8000, 49)
    L = np.log10(1e-10 + np.stack([S[:, (f >= a) & (f < b)].sum(axis=1) for a, b in zip(kanten[:-1], kanten[1:])], axis=1))
    Lmax = np.maximum(np.maximum(L, np.roll(L, 1, axis=1)), np.roll(L, -1, axis=1))
    return np.concatenate([[0.0, 0.0], np.maximum(L[2:] - Lmax[:-2], 0).sum(axis=1)])


def achtel_periode(fl: np.ndarray) -> tuple[float, float]:
    """Periode der Achtel aus der Autokorrelation des Flusses (0,20–0,55 s). Gewertet wird die Summe
    bei p, 2p, 4p und 8p (Achtel, Viertel, Halbe, Takt), damit nicht eine Nebenspitze gewinnt."""
    e = fl - np.convolve(fl, np.ones(101) / 101, mode="same")
    ac = np.correlate(e, e, mode="full")[len(e) - 1:]
    ac /= ac[0] + 1e-12

    def a(lag: float) -> float:
        i = int(lag)
        return float(ac[i] * (1 - (lag - i)) + ac[i + 1] * (lag - i)) if i + 1 < len(ac) else 0.0
    wert, p = max((a(p) + 0.5 * a(2 * p) + 0.5 * a(4 * p) + 0.5 * a(8 * p), p) for p in np.arange(20.0, 56.0, 0.05))
    return round(p * 0.01, 4), round(wert, 3)


def einsaetze(fl: np.ndarray) -> np.ndarray:
    """Spitzen im Fluss: lokales Maximum in ±50 ms und über gleitendem Median + 1,5 MAD."""
    from numpy.lib.stride_tricks import sliding_window_view as swv
    pad = np.pad(fl, 50, mode="edge")
    med = np.median(swv(pad, 101), axis=1)
    mad = np.median(np.abs(swv(pad, 101) - med[:, None]), axis=1)
    lok = np.pad(fl, 5, mode="edge")
    maxi = swv(lok, 11).max(axis=1)
    return np.where((fl >= maxi) & (fl > med + 1.5 * mad + 1e-9))[0]


def hall_schaetzung(mono: np.ndarray) -> dict:
    """Freie Abklingstrecken in Oktavbändern (wie analyse/hallschaetzer.py, hier ohne scipy)."""
    erg = {}
    for fc in (500, 1000, 2000, 4000):
        x = klang.filtern(mono, tief=fc / 2 ** 0.5, hoch=fc * 2 ** 0.5, ordnung=3)
        h = klang.sek(0.01)
        e = (x[: len(x) // h * h] ** 2).reshape(-1, h).mean(axis=1)
        d = np.convolve(10 * np.log10(e + 1e-14), np.ones(3) / 3, mode="same")
        st, i = [], 0
        while i < len(d) - 20:
            j = i
            while j + 1 < len(d) and d[j + 1] <= d[j] + 0.5 and d[j + 1] <= d[i]:
                j += 1
            if j - i >= 20 and d[i] - d[j] >= 12:
                st.append(np.polyfit(np.arange(j - i + 1) * 0.01, d[i:j + 1], 1)[0])
            i = max(j, i + 1)
        if len(st) >= 5:
            erg[str(fc)] = round(float(-60 / np.median(st)), 2)
    return erg


def stimmung(f: np.ndarray, P: np.ndarray) -> float:
    """Verstimmung gegen A 440 in Cent (−50 … +50): Leistung über dem Umfeld im Bereich 150–2000 Hz,
    kreisförmig gemittelt. Vorher 9 Bins glätten, sonst zählen Seitenbänder (Leiern, Schwebung) als
    eigene Spitzen. Achtung: Werte nahe ±50 sind gleichbedeutend (Viertelton), deshalb wird im
    Vergleich die Differenz kreisförmig gebildet."""
    from numpy.lib.stride_tricks import sliding_window_view as swv
    k = np.hanning(9)
    Ps = np.convolve(P, k / k.sum(), mode="same")
    sel = (f > 150) & (f < 2000)
    d = 10 * np.log10(Ps[sel] + 1e-20)
    umfeld = np.median(swv(np.pad(d, 40, mode="edge"), 81), axis=1)
    w = np.maximum(0, d - umfeld - 6) ** 2
    c = 1200 * np.log2(f[sel] / 440.0)
    return float(100 * np.angle(np.sum(w * np.exp(2j * np.pi * c / 100))) / (2 * np.pi))


def messen(x: np.ndarray) -> dict:
    mitte = x.mean(axis=1)
    seite = (x[:, 0] - x[:, 1]) / 2
    erg = {"dauer_s": round(len(x) / SR, 2), "lufs": round(klang.lufs(x), 2)}
    st = klang.kurzzeit_lufs(x)
    g = st[(st > -70) & (st > erg["lufs"] - 20)]
    erg.update({"st_p10": round(float(np.percentile(g, 10)), 2), "st_p50": round(float(np.percentile(g, 50)), 2),
                "st_p95": round(float(np.percentile(g, 95)), 2), "st_streuung": round(float(np.std(g)), 2),
                "lra": round(float(np.percentile(g, 95) - np.percentile(g, 10)), 2)})
    spitze = 20 * np.log10(np.abs(x).max() + 1e-12)
    erg["plr_db"] = round(float(spitze - erg["lufs"]), 2)
    erg["seite_mitte_db"] = round(float(10 * np.log10(np.mean(seite ** 2) / (np.mean(mitte ** 2) + 1e-20) + 1e-20)), 2)
    f, P = welch(mitte)
    nutz = (f >= 20) & (f <= 16000)
    ges = P[nutz].sum()
    erg["schwerpunkt_hz"] = round(float((f[nutz] * P[nutz]).sum() / ges), 1)
    erg["baender_db"] = {f"{a}-{b}": round(float(10 * np.log10(P[(f >= a) & (f < b)].sum() / ges + 1e-20)), 2) for a, b in BAENDER}
    erg["terz_db"] = [round(float(10 * np.log10(P[(f >= fc / 2 ** (1 / 6)) & (f < fc * 2 ** (1 / 6))].sum() / ges + 1e-20)), 2) for fc in TERZ]
    f2, P2 = welch(mitte, 32768)
    erg["stimmung_cent"] = round(stimmung(f2, P2), 1)
    mono = mitte[: len(mitte) // 2 * 2]
    fl = fluss(mono)
    ons = einsaetze(fl)
    erg["einsaetze_pro_s"] = round(len(ons) / (len(mono) / SR), 2)
    erg["achtel_periode_s"], erg["achtel_puls"] = achtel_periode(fl)
    erg["bpm_aus_achtel"] = round(30 / erg["achtel_periode_s"], 2)
    erg["hall_rt60_s"] = hall_schaetzung(mitte)
    return erg


def spektralabstand(a: dict, b: dict, ab_hz: float = 0.0, bis_hz: float = 1e9) -> float:
    ta, tb = np.array(a["terz_db"]), np.array(b["terz_db"])
    ok = ((ta > -60) | (tb > -60)) & (np.array(TERZ) >= ab_hz) & (np.array(TERZ) <= bis_hz)
    return round(float(np.sqrt(np.mean((np.maximum(ta, -60) - np.maximum(tb, -60))[ok] ** 2))), 2)


def _falten(v: float) -> float:
    while v >= 1.5:
        v /= 2
    while v < 0.75:
        v *= 2
    return v


def vergleichen(eigen: dict, ref: dict) -> dict:
    hall = {k: round(eigen["hall_rt60_s"][k] / ref["hall_rt60_s"][k], 2)
            for k in ref["hall_rt60_s"] if k in eigen["hall_rt60_s"]}
    return {
        "spektralabstand_terz_db": spektralabstand(eigen, ref),
        "spektralabstand_ab_150hz_db": spektralabstand(eigen, ref, 150),
        # Musikbereich: unter 150 Hz und über 8 kHz liegen in den Stems vor allem Trennreste und Rauschen
        "spektralabstand_150_8000hz_db": spektralabstand(eigen, ref, 150, 8000),
        "baender_differenz_db": {k: round(eigen["baender_db"][k] - ref["baender_db"][k], 1) for k in ref["baender_db"]},
        "schwerpunkt_verhaeltnis": round(eigen["schwerpunkt_hz"] / ref["schwerpunkt_hz"], 2),
        # Tempo-Verhältnis oktav-gefaltet: die Autokorrelation kann Achtel oder Viertel als Puls wählen
        "tempo_verhaeltnis": round(_falten(ref["achtel_periode_s"] / eigen["achtel_periode_s"]), 3),
        "einsaetze_verhaeltnis": round(eigen["einsaetze_pro_s"] / max(1e-6, ref["einsaetze_pro_s"]), 2),
        "st_streuung_differenz_lu": round(eigen["st_streuung"] - ref["st_streuung"], 2),
        "lra_differenz_lu": round(eigen["lra"] - ref["lra"], 2),
        "plr_differenz_db": round(eigen["plr_db"] - ref["plr_db"], 2),
        "seite_mitte_differenz_db": round(eigen["seite_mitte_db"] - ref["seite_mitte_db"], 2),
        "stimmung_differenz_cent": round(((eigen["stimmung_cent"] - ref["stimmung_cent"] + 50) % 100) - 50, 1),
        "hall_verhaeltnis_je_band": hall,
    }


def tabelle(ergebnisse: list[dict]) -> str:
    z = ["| Paar | Spektrum Terz-RMS dB: alles / 150 Hz–8 kHz | Tempo eigen/ref (oktav-gefaltet) | Einsätze/s eigen/ref | Kurzzeit-Streuung LU eigen/ref | LRA eigen/ref | Seite/Mitte dB eigen/ref | Stimmung Cent eigen/ref | Hall 1 kHz s eigen/ref |",
         "|---|---|---|---|---|---|---|---|---|"]
    for e in ergebnisse:
        a, r, v = e["eigen"], e["ref"], e["vergleich"]
        h = lambda d: d.get("1000", d.get("500", "–"))
        z.append(f"| {e['stil']} {e['variante']} ↔ {e['referenz']} | {v['spektralabstand_terz_db']} / {v['spektralabstand_150_8000hz_db']} | "
                 f"{v['tempo_verhaeltnis']} | {a['einsaetze_pro_s']} / {r['einsaetze_pro_s']} | "
                 f"{a['st_streuung']} / {r['st_streuung']} | {a['lra']} / {r['lra']} | {a['seite_mitte_db']} / {r['seite_mitte_db']} | "
                 f"{a['stimmung_cent']} / {r['stimmung_cent']} | {h(a['hall_rt60_s'])} / {h(r['hall_rt60_s'])} |")
    return "\n".join(z)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("referenz")
    r.add_argument("name"); r.add_argument("wav"); r.add_argument("--start", type=float, default=0); r.add_argument("--ende", type=float)
    e = sub.add_parser("eigen")
    e.add_argument("--stufe", type=int, default=2)
    a = ap.parse_args()
    if a.cmd == "referenz":
        x = klang.lade_wav(Path(a.wav))
        x = x[klang.sek(a.start): klang.sek(a.ende) if a.ende else None]
        m = messen(x)
        m["quelle"] = f"Demucs-Stem {Path(a.wav).name}, {a.start}–{a.ende or round(len(x) / SR + a.start, 1)} s (Scratchpad, nicht im Repo)"
        (HIER / "messwerte" / f"ref-{a.name}.json").write_text(json.dumps(m, ensure_ascii=False, indent=1))
        print(json.dumps({k: v for k, v in m.items() if k != "terz_db"}, ensure_ascii=False))
    else:
        endung = "" if a.stufe >= 2 else f"-stufe{a.stufe}"
        erg = []
        for stil, var, ref in PAARE:
            pfad = HIER.parent.parent / "build" / "musik" / f"{stil}{endung}-{var}.wav"
            if not pfad.exists():
                print("fehlt:", pfad)
                continue
            eig = messen(klang.lade_wav(pfad))
            rf = json.loads((HIER / "messwerte" / f"ref-{ref}.json").read_text())
            erg.append({"stil": stil, "variante": var, "referenz": ref, "eigen": eig, "ref": rf, "vergleich": vergleichen(eig, rf)})
            print(stil, var, ref, json.dumps(erg[-1]["vergleich"], ensure_ascii=False))
        (HIER / "messwerte" / f"vergleich-stufe{a.stufe}.json").write_text(json.dumps(erg, ensure_ascii=False, indent=1))
        (HIER / "messwerte" / f"vergleich-stufe{a.stufe}.md").write_text(
            f"# Vergleich Stufe {a.stufe}\n\nErzeugt mit `vergleich.py eigen --stufe {a.stufe}`.\n\n" + tabelle(erg) + "\n")
        print(tabelle(erg))
