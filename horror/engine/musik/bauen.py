#!/usr/bin/env python3
"""Musik-Werkstatt: eigene Schleifen rendern (je Stil drei Varianten, nahtlos, etwa 3 min).

    . /opt/deeptok/env.sh && pip install mido        # mido fehlt noch im Setup-Skript
    python engine/musik/bauen.py                     # alle Stile, Stufe 2 (nachgebessert)
    python engine/musik/bauen.py --stil wiegenlied --stufe 1

Schreibt (nicht im Repo, horror/build/musik/):
  schichten/<stil>/<schicht>.wav    trockene Einzelschichten, zyklisch (für spannung.py)
  <stil>-<variante>.wav             fertige Schleifen, 24 bit, normal auf −20 LUFS
  <stil>.json                       Pegel, Naht-Prüfung, Parameter
und ins Repo: engine/musik/midi/<stil>-<variante>.mid, engine/musik/messwerte/bau-<stil>.json.

Ablauf je Stil: Komposition (komposition.py) -> Schichten rendern (eigene Synthese oder FluidSynth)
-> Varianten mischen (Pegel je Schicht) -> Hall als zyklische Faltung -> gemeinsamer Pegel.
Alle drei Varianten eines Stils bekommen dieselbe Verstärkung, damit dünn wirklich leiser und
voll wirklich voller ist, wenn spannung.py zwischen ihnen überblendet.
"""

from __future__ import annotations

import argparse
import copy
import json
import sys
import tempfile
import time
from pathlib import Path

import numpy as np

HIER = Path(__file__).resolve().parent
sys.path.insert(0, str(HIER))
import klang  # noqa: E402
import komposition as komp  # noqa: E402

HORROR = HIER.parent.parent
BUILD = HORROR / "build" / "musik"
ZIEL_LUFS = -20.0          # Bezug: Variante „normal“; gemischt wird später 12 LU unter der Stimme
DECKE_DBFS = -1.0


# ---------------------------------------------------------------- Nachbesserung (Stufe 2)
# Stufe 1 ist der erste Wurf nach der Grammatik. Stufe 2 ändert Parameter nach dem Messvergleich
# mit den Referenz-Stems (messwerte/vergleich-stufe1.json). Jede Änderung trägt ihren Grund.
# Zahlen in den Kommentaren: Stufe 1 gegen Referenz (Terzbänder in dB, normierte Spektren).
NACHBESSERUNG: dict[str, dict] = {
    "spieluhr": {
        # Terz 315 Hz +7 dB, 150–400 Hz +8 dB, aber 1,25 kHz −15 dB und 1,6–2 kHz −7/−8 dB:
        # Register eine große Terz höher (F♯4–D6 statt E4–H5) und Zweiklang nur noch auf der Eins.
        # Seite/Mitte −5,2 statt −6,9 dB: Panorama schmaler. Kurzzeit-Streuung 0,4 statt 2,0 LU:
        # Phrasen-Bogen ±1,5 dB über die Schleife.
        "komposition": {"lo": 66, "hi": 86, "pan": 0.22, "zweiklang_auf": (0,), "dynamik_db": 1.5},
        # Hall-Schätzung 1,24 s statt 1,0 s bei 1 kHz: kürzerer Raum
        "hall": {"rt60": 0.95},
        # Hüllkurve des Orgelpunkts (schmales Band, Median über alle Anschläge): −10 dB nach 0,27 s statt
        # 0,13 s, Boden bei −16 dB statt Abfall bis −23 dB: kräftigerer „Ping“, kürzerer Körper, Glasorgel leiser
        # Teiltöne 30–150 ms nach Einzelanschlägen (analyse/rolle.py auf beiden Seiten): 2× −28 statt −39 dB,
        # 3× −28 statt −33 dB, 6,27× −40 statt −52 dB -> schwächer
        "klang": {"spieluhr_weich": {"ping": 0.68, "tau": 0.13, "a2": 0.010, "a3": 0.028, "a6": 0.003}},
        # Gebrauch, nicht Messung: dünn lag nur 1,9 LU unter normal; für die Spannungsstufen leiser
        "varianten": {"duenn": {"kern": -3, "orgelpunkt": -4}, "normal": {"orgel": -32}, "voll": {"orgel": -22}},
    },
    "wiegenlied": {
        # Seite/Mitte −2,3 statt −7,0 dB: viel zu breit -> schmaleres Panorama, weniger und schmalerer Hall
        # (Hall-Schätzung 1,05 s statt 0,73 s). Kurzzeit-Streuung 0,4 statt 1,1 LU: Phrasen-Bogen.
        # Register (analyse/rolle.py) F♯3–G5 statt H3–A5: zwei Halbtöne höher. Anschlag-Streuung 8,5 statt
        # 2,9 dB: Akzente der 3+3+2-Gruppen schwächer, Phrasen-Bogen kleiner
        # Review Teil 2 (Stufe 2b): Seite/Mitte jetzt −10,1 statt −7,2 dB (zu schmal) und Anschlag-Streuung
        # 8,7 statt 2,9 dB. Panorama 0,12 -> 0,2 und Hall-Breite 0,55 -> 0,75 (Mitte zwischen Stufe 1 und 2);
        # Akzente 80 -> 78 bei Füllern um 76, Phrasen-Bogen 0,6 -> 0,3 dB, tiefer Grundton leiser (s. varianten).
        # Die 3+3+2 trägt dann vor allem das Timing, wie bei einer echten Spieldose.
        "komposition": {"pan": 0.2, "dynamik_db": 0.3, "lo": 62, "hi": 84, "akzent": 78},
        "hall": {"rt60": 1.2, "nass": 0.45, "breite": 0.75},
        # Terz 5 kHz +11 dB, 6,3 kHz +7 dB: Zinken-Teilton 6,27× und Klick leiser; 1,25 kHz −12 dB:
        # 2. Teilton stärker; 12,5 kHz −7 dB: Teilton 17,55× etwas stärker
        # Hüllkurve des Orgelpunkts: −10 dB nach 0,23 s statt 0,12 s -> kräftigerer Ping, kürzerer Körper
        "klang": {"spieluhr_kamm": {"a6": 0.17, "klick": 0.035, "a2": 0.06, "a17": 0.24, "ping": 0.65, "tau": 0.13}},
        # Terz 125–160 Hz +8/+9 dB: tiefer Grundton leiser
        # Gebrauch, nicht Messung: dünn deutlicher leiser; voll lag nur 0,2 LU über normal -> Glitzer und
        # Fläche lauter, damit die Spannungsstufe hörbar steigt (Referenz selbst steigert nie)
        "varianten": {"normal": {"grund": -20}, "voll": {"grund": -14, "glitzer": -5, "flaeche": -13},
                      "duenn": {"kern": -3, "orgelpunkt": -4}},
    },
    "klavier": {
        # 1–6 kHz +10 dB (dünn) bis +20 dB (voll): FluidR3-Flügel und -Streicher viel heller als das
        # gedämpfte Referenzklavier -> Höhen-Regal −11 dB (Klavier) bzw. −14 dB (Streicher) ab 1–1,2 kHz.
        "filter": {"klavier8": {"regal": [1200, -11]}, "klavier16": {"regal": [1200, -11]},
                   "bass": {"regal": [1200, -11]}, "linie": {"regal": [1200, -9]}, "streicher": {"regal": [1000, -14]}},
        # Seite/Mitte +0,2 statt −5,0 dB (dünn): Panorama und Hall schmaler; Hall 1,8 s statt 1,2 s bei 4 kHz
        # 100–250 Hz −6 … −13 dB (voll): Streicher tiefer legen, linke Hand kräftiger
        "komposition": {"pan": 0.3, "streicher_lage": (45, 64), "bass_vel": 74},
        "hall": {"rt60": 1.6, "breite": 0.7},
        # voll war 6,8 LU lauter als normal (Referenz Stufe 2 gegen 1: +3,4 LU): Sub, Streicher, Fall leiser
        "varianten": {"duenn": {"bass": 0}, "voll": {"sub": -15, "streicher": -6, "fall": -13}},
    },
    "drone": {
        # LRA 4,7 statt 15,8 LU, Kurzzeit-Streuung 1,7 statt 5,6 LU: Schwellungen viel tiefer
        "schichten": {"drone": {"schwellen": 11.0}, "cluster": {"schwellen": 14.0}, "tritonus": {"schwellen": 14.0}},
        # über 400 Hz −5 … −19 dB, Schwerpunkt 60 statt 102 Hz: Rausch-Teppich 1,5–9 kHz dazu,
        # Drone stärker gesättigt (mehr Obertöne), Spannungston lauter. PLR 15,4 statt 19,8 dB: Schläge lauter
        "klang": {"drone": {"saettigung": 2.8}},
        "varianten": {"normal": {"zischen": -26}, "voll": {"zischen": -22, "spannung": -15, "einschlag": 0, "puls": -4}},
    },
}


def stil_laden(name: str, stufe: int) -> dict:
    aend = NACHBESSERUNG.get(name, {}) if stufe >= 2 else {}
    stil = komp.STILE[name](**aend.get("komposition", {}))
    stil["filter"] = {}
    if aend:
        for sch, werte in aend.get("schichten", {}).items():
            stil["schichten"][sch].update(werte)
        stil["filter"] = aend.get("filter", {})
        for v, pegel in aend.get("varianten", {}).items():
            stil["varianten"][v].update(pegel)
        stil["hall"].update(aend.get("hall", {}))
        stil["sends"].update(aend.get("sends", {}))
        stil["klang"] = aend.get("klang", {})
        stil["nachbesserung"] = {k: v for k, v in aend.items()}
    stil.setdefault("klang", {})
    stil["stufe"] = stufe
    return stil


# ---------------------------------------------------------------- Schichten

def schwell_kurve(stil: dict, n: int, tiefe_db: float) -> np.ndarray:
    """Periodische Schwellung (Stil Drone): tief am Zyklusanfang, Gipfel bei 75 %, Fall bis zum Ende."""
    per = stil["schwellen_takte"] * 4 * 60 / stil["bpm"]
    ph = (np.arange(n) / klang.SR % per) / per
    form = np.where(ph < 0.75, 0.5 - 0.5 * np.cos(np.pi * ph / 0.75), 0.5 + 0.5 * np.cos(np.pi * (ph - 0.75) / 0.25))
    return 10 ** ((tiefe_db * (form - 1)) / 20)


def schicht_rendern(stil: dict, name: str, laenge: int) -> np.ndarray:
    sch = stil["schichten"][name]
    rng = np.random.default_rng(sum(map(ord, stil["name"] + name)))           # deterministisch
    if "programm" in sch:
        # Zeit-Streuung auch für FluidSynth: Kopie mit leicht verschobenen Noten (in Schlägen) schreiben
        st = copy.deepcopy(stil)
        js = st["jitter_ms"] / 1000 * st["bpm"] / 60
        for n in st["schichten"][name]["noten"]:
            n["b"] = max(0.0, n["b"] + float(rng.normal(0, js)))
        with tempfile.TemporaryDirectory() as tmp:
            mid = komp.midi_schreiben(st, Path(tmp) / f"{name}.mid", nur=[name], volle_lautstaerke=True)
            x = klang.render_fluidsynth(mid, laenge, zyklisch=True, gain=0.6)
        return x
    if sch["stimme"] == "luft":
        return klang.luft(laenge, rng, zyklisch=True)
    if sch["stimme"] == "zischen":
        return klang.zischen(laenge, rng, zyklisch=True)
    noten = komp.noten_in_sekunden(stil, name)
    wow = stil.get("wow") if sch["stimme"].startswith("spieluhr") or sch["stimme"] == "glocke_tief" else None
    # Klang-Nachbesserung je Stimme (Stufe 2), z. B. andere Abklingzeit
    stimme = sch["stimme"]
    k = stil["klang"].get(stimme)
    if k:
        alt = klang.STIMMEN[stimme]
        klang.STIMMEN[stimme] = lambda f, s, d, r, _a=alt, _k=k: _a(f, s, d, r, **_k)
    try:
        x = klang.render_noten(noten, stimme, laenge, stil["cent"], rng, zyklisch=True,
                               abdaempfen=sch.get("abdaempfen", True), wow=tuple(wow) if wow else None)
    finally:
        if k:
            klang.STIMMEN[stimme] = alt
    if sch.get("schwellen"):
        x *= schwell_kurve(stil, laenge, sch["schwellen"])[:, None]
    return x


def schichten_alle(stil: dict, ordner: Path) -> dict[str, np.ndarray]:
    laenge = klang.sek(komp.laenge_s(stil))
    aus = {}
    for name in stil["schichten"]:
        t0 = time.time()
        x = schicht_rendern(stil, name, laenge)
        x = klang.filtern(x, tief=18, ordnung=2, zyklisch=True)   # Gleichanteil/Unhörbares weg
        fl = stil["filter"].get(name, {})
        if "regal" in fl:
            x = klang.regal(x, fl["regal"][0], fl["regal"][1], zyklisch=True)
        if "hoch" in fl or "tief" in fl:
            x = klang.filtern(x, tief=fl.get("tief"), hoch=fl.get("hoch"), zyklisch=True)
        aus[name] = x
        klang.schreibe_wav(ordner / f"{name}.wav", x, bits=32)
        print(f"  Schicht {name:11s} {time.time() - t0:5.1f} s  Spitze {20 * np.log10(np.abs(x).max() + 1e-12):6.1f} dBFS")
    return aus


# ---------------------------------------------------------------- Mischen

def mischen(stil: dict, schichten: dict[str, np.ndarray], pegel: dict[str, np.ndarray | float | None],
            zyklisch: bool = True) -> np.ndarray:
    """Schichten mit Pegeln (dB, None = aus, oder Array je Sample = Verlauf) mischen und verhallen.

    Der Hall bekommt die Schichten nach dem Pegel. Fällt eine Schicht weg, klingt ihr Hall natürlich
    aus (wichtig für den Wegfall vor der Pointe in spannung.py).
    """
    h = stil["hall"]
    ir = klang.hall_ir(h["rt60"], h["vor_ms"], h["breite"], h["hoehen"], seed=len(stil["name"]))
    n = len(next(iter(schichten.values())))
    trocken = np.zeros((n, 2))
    send = np.zeros((n, 2))
    for name, x in schichten.items():
        g = pegel.get(name)
        if g is None:
            continue
        lin = 10 ** (np.asarray(g, dtype=float) / 20)
        y = x * (lin[:, None] if np.ndim(lin) else lin)
        trocken += y
        send += stil["sends"].get(name, 1.0) * y
    nass = klang.falten(send, ir, zyklisch=zyklisch)
    return trocken + h["nass"] * nass


def bauen(name: str, stufe: int = 2, nur_midi: bool = False) -> dict:
    stil = stil_laden(name, stufe)
    print(f"== {stil['titel']} ({name}), Stufe {stufe}: {stil['bpm']} BPM, {stil['takte']} Takte = {komp.laenge_s(stil):.2f} s")
    for v in komp.VARIANTEN:
        komp.midi_schreiben(stil, HIER / "midi" / f"{name}-{v}.mid", variante=v)
    if nur_midi:
        return {}
    endung = "" if stufe >= 2 else f"-stufe{stufe}"
    ordner = BUILD / "schichten" / f"{name}{endung}"
    schichten = schichten_alle(stil, ordner)
    mixe = {v: mischen(stil, schichten, stil["varianten"][v]) for v in komp.VARIANTEN}
    # Gemeinsame Verstärkung: „normal“ auf −20 LUFS; falls eine Variante die Decke reißt, alle leiser
    g = 10 ** ((ZIEL_LUFS - klang.lufs(mixe["normal"])) / 20)
    spitze = max(np.abs(m).max() for m in mixe.values()) * g
    if spitze > 10 ** (DECKE_DBFS / 20):
        g *= 10 ** (DECKE_DBFS / 20) / spitze
    info = {"stil": name, "titel": stil["titel"], "referenz": stil["referenz"], "stufe": stufe,
            "bpm": stil["bpm"], "takte": stil["takte"], "schleife_takte": stil["schleife_takte"],
            "laenge_s": round(komp.laenge_s(stil), 3), "cent": round(stil["cent"], 2), "a4": stil["a4"],
            "verstaerkung_db": round(20 * np.log10(g), 2), "hall": stil["hall"], "varianten": {},
            "nachbesserung": stil.get("nachbesserung", {}),
            "komposition": komp.statistik(stil)}
    for v, m in mixe.items():
        y = m * g
        pfad = BUILD / f"{name}{endung}-{v}.wav"
        klang.schreibe_wav(pfad, y)
        info["varianten"][v] = {"datei": str(pfad.relative_to(HORROR)), "lufs": round(klang.lufs(y), 2),
                                "spitze_dbfs": round(float(20 * np.log10(np.abs(y).max())), 2),
                                "naht": klang.naht_pruefen(y, klang.sek(2 * stil["schleife_takte"] * 240 / stil["bpm"])),
                                "pegel": stil["varianten"][v]}
        print(f"  {v:6s} {info['varianten'][v]['lufs']:6.2f} LUFS  Spitze {info['varianten'][v]['spitze_dbfs']:6.2f} dBFS  Naht {info['varianten'][v]['naht']}")
    (BUILD / f"{name}{endung}.json").write_text(json.dumps(info, ensure_ascii=False, indent=1))
    (HIER / "messwerte" / f"bau-{name}{endung}.json").write_text(json.dumps(info, ensure_ascii=False, indent=1))
    return info


def proben(name: str, abschnitt_s: float = 15.0, naht: bool = False) -> list[Path]:
    """Kleine Hörproben (< 1 MB) fürs Repo: dünn -> normal -> voll je abschnitt_s Sekunden auf
    derselben Zeitachse, 1 s überblendet (zeigt, dass die Varianten zusammenpassen). naht=True:
    zusätzlich die letzten 8 s und die ersten 8 s der Schleife hintereinander (Naht hörbar prüfen)."""
    v = {k: klang.lade_wav(BUILD / f"{name}-{k}.wav") for k in komp.VARIANTEN}
    n = klang.sek(3 * abschnitt_s)
    t = np.arange(n) / klang.SR
    w = [np.clip((t - a) / 1.0, 0, 1) for a in (abschnitt_s, 2 * abschnitt_s)]
    y = v["duenn"][:n] * (1 - w[0])[:, None] + v["normal"][:n] * (w[0] - w[1])[:, None] + v["voll"][:n] * w[1][:, None]
    k = klang.sek(0.5)
    y[-k:] *= np.linspace(1, 0, k)[:, None]
    aus = [HIER / "proben" / f"{name}-stufen.mp3"]
    klang.schreibe_mp3(aus[0], y, kbit=96)
    if naht:
        x = v["normal"]
        z = np.concatenate([x[-klang.sek(8):], x[: klang.sek(8)]])
        aus.append(HIER / "proben" / f"{name}-naht.mp3")
        klang.schreibe_mp3(aus[-1], z, kbit=96)
    for p in aus:
        print(" Probe", p.relative_to(HORROR), p.stat().st_size, "Bytes")
    return aus


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--stil", nargs="*", default=list(komp.STILE))
    ap.add_argument("--stufe", type=int, default=2)
    ap.add_argument("--nur-midi", action="store_true")
    ap.add_argument("--proben", action="store_true", help="nur Hörproben aus vorhandenen WAVs schreiben")
    a = ap.parse_args()
    for s in a.stil:
        if a.proben:
            proben(s, naht=(s == "wiegenlied"))
        else:
            bauen(s, a.stufe, a.nur_midi)
