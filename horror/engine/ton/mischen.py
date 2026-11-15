#!/usr/bin/env python3
"""Tonspur einer Folge mischen: Stimme + eigene Effekte (Upload) und zusätzlich ein leises
Klangbett (Vorhör-Fassung).

    python engine/ton/mischen.py episoden/folge-01 [--bett PFAD.wav] [--decke -1.8]

Liest  episoden/<folge>/timing.json, effekte.json, episode.json und build/<folge>/stimme.wav.
Schreibt build/<folge>/ton/effekte.wav, mix-upload.wav, mix-vorhoer.wav (nicht im Repo)
und episoden/<folge>/mischung.json (Messwerte, klein, im Repo).

Regeln (anhang-b B4, format-spec §11, Aufgabe Render/Zusammenschnitt):
  - Upload = Stimme + Effekte, ohne Musik: Den Hintergrundsound wählt Linus in der TikTok-App.
  - Vorhör = zusätzlich ein eigenes Klangbett, 12 LU unter der Stimme (wie r2/r5).
  - Beide Fassungen −14 LUFS integriert, True Peak ≤ −1 dBTP (Begrenzer 4× überabgetastet,
    Decke etwas tiefer, weil AAC beim Kodieren Spitzen um einige Zehntel dB anhebt).
  - Effekte liegen unter der Stimme: Gemessen wird je Cue die lauteste Momentan-Lautheit (400 ms)
    des Effekts allein gegen die integrierte Lautheit der Stimme.
  - Endkarte ohne Ton: Effekte enden mit dem Schnitt auf die Endkarte (30 ms Blende).

Stereo: Die Stimme steht mono in der Mitte (L = R). Achtung beim Messen: Zwei gleiche Kanäle
zählen nach BS.1770 doppelt, die −14-LUFS-Stimme misst in Stereo also −11 LUFS. Die Mischung
wird deshalb am Ende als Ganzes auf −14 LUFS gebracht.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

HIER = Path(__file__).resolve().parent
sys.path.insert(0, str(HIER))
import effekte  # noqa: E402

SR = 44100
FPS = 30
ZIEL_LUFS = -14.0
MAX_TP = -1.0
DECKE_DB = -1.8          # Begrenzer-Decke (4× überabgetastet); Rest Luft für AAC
BETT_ABSTAND_LU = 12.0   # Vorhör: Bett so weit unter der Stimme (r2 11,9 LU, r5 11,7 LU)


# ---------------------------------------------------------------- Ein/Aus

def lade_stereo(pfad: Path) -> np.ndarray:
    roh = subprocess.run(["ffmpeg", "-v", "error", "-i", str(pfad), "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(roh, np.float32).reshape(-1, 2).astype(np.float64)


def ffmpeg_filter(x: np.ndarray, filt: str) -> np.ndarray:
    cmd = ["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
           "-af", filt, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"]
    roh = subprocess.run(cmd, input=x.astype(np.float32).tobytes(), capture_output=True, check=True).stdout
    return np.frombuffer(roh, np.float32).reshape(-1, 2).astype(np.float64)


def lautheit(x: np.ndarray) -> dict:
    """Integrierte Lautheit, True Peak, LRA (ffmpeg loudnorm, nur Messung), Stereo."""
    cmd = ["ffmpeg", "-hide_banner", "-nostats", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
           "-af", "loudnorm=print_format=json", "-f", "null", "-"]
    p = subprocess.run(cmd, input=x.astype(np.float32).tobytes(), capture_output=True, check=True)
    txt = p.stderr.decode("utf-8", "replace")
    js = json.loads(txt[txt.rindex("{"):txt.rindex("}") + 1])
    return {"lufs": round(float(js["input_i"]), 2), "true_peak_dbtp": round(float(js["input_tp"]), 2),
            "lra_lu": round(float(js["input_lra"]), 2)}


def schreibe_wav(pfad: Path, x: np.ndarray) -> None:
    effekte.schreibe_wav(pfad, x)


# ---------------------------------------------------------------- K-Gewichtung (BS.1770)

def _biquad_betrag(b, a, f):
    z = np.exp(-1j * 2 * np.pi * f / SR)
    return np.abs((b[0] + b[1] * z + b[2] * z * z) / (1 + a[0] * z + a[1] * z * z))


def k_gewichtet(x: np.ndarray) -> np.ndarray:
    """K-Filter (Höhenanhebung + Hochpass um 38 Hz) als Betragsgang im Frequenzbereich.

    Koeffizienten wie libebur128 für beliebige Abtastraten. Die Phase fehlt, für die
    Lautheit (mittlere Leistung) spielt sie keine Rolle.
    """
    f0, g, q = 1681.974450955533, 3.999843853973347, 0.7071752369554196
    k = np.tan(np.pi * f0 / SR)
    vh, vb = 10 ** (g / 20), (10 ** (g / 20)) ** 0.4996667741545416
    a0 = 1 + k / q + k * k
    b1 = ((vh + vb * k / q + k * k) / a0, 2 * (k * k - vh) / a0, (vh - vb * k / q + k * k) / a0)
    a1 = (2 * (k * k - 1) / a0, (1 - k / q + k * k) / a0)
    f0, q = 38.13547087602444, 0.5003270373238773
    k = np.tan(np.pi * f0 / SR)
    a0 = 1 + k / q + k * k
    b2 = (1.0, -2.0, 1.0)
    a2 = (2 * (k * k - 1) / a0, (1 - k / q + k * k) / a0)
    n = len(x)
    m = 1 << int(np.ceil(np.log2(n)))
    f = np.fft.rfftfreq(m, 1 / SR)
    h = _biquad_betrag(b1, a1, f) * _biquad_betrag(b2, a2, f)
    return np.fft.irfft(np.fft.rfft(x, m, axis=0) * h[:, None], m, axis=0)[:n]


def momentan(x: np.ndarray) -> np.ndarray:
    """Momentan-Lautheit (400-ms-Fenster, alle 100 ms) in LUFS."""
    y = k_gewichtet(x)
    leistung = np.sum(y ** 2, axis=1)
    fen, hop = int(0.4 * SR), int(0.1 * SR)
    kum = np.concatenate([[0.0], np.cumsum(leistung)])
    starts = np.arange(0, max(1, len(leistung) - fen), hop)
    ms = (kum[starts + fen] - kum[starts]) / fen
    return -0.691 + 10 * np.log10(ms + 1e-12)


# ---------------------------------------------------------------- Mischen

def begrenzen(x: np.ndarray, decke_db: float) -> tuple[np.ndarray, dict]:
    """Auf ZIEL_LUFS bringen, dann Begrenzer mit 4-facher Überabtastung (sieht Spitzen zwischen
    den Abtastwerten). Verstärkung wird nachgeführt, bis Lautheit ±0,1 LU und TP passen."""
    m0 = lautheit(x)
    gain = ZIEL_LUFS - m0["lufs"]
    decke = decke_db
    for runde in range(8):
        lim = 10 ** (decke / 20)
        filt = (f"volume={gain:.3f}dB,aresample={4 * SR},"
                f"alimiter=limit={lim:.5f}:attack=1:release=50:level=false:latency=true,aresample={SR}")
        y = ffmpeg_filter(x, filt)[: len(x)]
        m = lautheit(y)
        if abs(m["lufs"] - ZIEL_LUFS) <= 0.1 and m["true_peak_dbtp"] <= decke_db + 0.3:
            break
        if m["true_peak_dbtp"] > decke_db + 0.3:
            decke -= m["true_peak_dbtp"] - decke_db
        gain += ZIEL_LUFS - m["lufs"]
    vor = x * 10 ** (gain / 20)
    hop = 441
    n = len(y) // hop
    pv = np.abs(vor[: n * hop]).reshape(n, hop * 2).max(1)
    pn = np.abs(y[: n * hop]).reshape(n, hop * 2).max(1)
    gr = 20 * np.log10(np.maximum(pv, 1e-9) / np.maximum(pn, 1e-9))
    gr[pv < 10 ** (-40 / 20)] = 0
    return y, {"eingang": m0, "verstaerkung_db": round(gain, 2), "decke_dbfs": round(decke, 2), "runden": runde + 1,
               "begrenzer_max_db": round(float(gr.max()), 2),
               "begrenzer_rahmen_ueber_1db_prozent": round(float(np.mean(gr > 1) * 100), 2), "ausgang": m}


def setze_cue(spur: np.ndarray, klang: np.ndarray, t: float, db: float) -> None:
    i = int(round(t * SR))
    if i < 0:
        klang, i = klang[-i:], 0
    j = min(len(spur), i + len(klang))
    spur[i:j] += klang[: j - i] * 10 ** (db / 20)


def mische(ordner: Path, bett_pfad: Path | None, decke_db: float) -> dict:
    name = ordner.name
    build = ordner.parent.parent / "build" / name
    ton = build / "ton"
    timing = json.loads((ordner / "timing.json").read_text(encoding="utf-8"))
    cues = json.loads((ordner / "effekte.json").read_text(encoding="utf-8"))
    episode = json.loads((ordner / "episode.json").read_text(encoding="utf-8"))
    woerter = timing["woerter"]

    # Länge = Bildlänge der Folge (Endkarte eingeschlossen)
    letzte = episode["einstellungen"][-1]
    t_ende = letzte.get("ende")
    if t_ende is None:
        sys.exit("episode.json: letzte Einstellung ohne ende")
    bilder = round(t_ende * FPS)
    n = round(bilder / FPS * SR)
    end = [e for e in episode["einstellungen"] if e.get("plan", {}).get("endkarte")]
    t_karte = round(end[0]["start"] * FPS) / FPS if end else t_ende

    # Stimme: mono -> L = R, auf Bildlänge mit Stille auffüllen
    stimme_pfad = build / "stimme.wav"
    st = lade_stereo(stimme_pfad)
    stimme = np.zeros((n, 2))
    stimme[: min(n, len(st))] = st[:n]

    # Effekte nach Cue-Liste
    fx = np.zeros((n, 2))
    protokoll = []
    for k, c in enumerate(cues["cues"]):
        w = woerter[c["wort"]]
        if w["text"] != c["text"]:
            sys.exit(f"effekte.json Cue {k}: Wort {c['wort']} ist {w['text']!r}, erwartet {c['text']!r}")
        klang = effekte.erzeuge(c["klang"], seed=100 + k, **c.get("params", {}))
        t = w["start"] + c.get("versatz", 0.0) - effekte.SYNC.get(c["klang"], 0.0)
        setze_cue(fx, klang, t, c["db"])
        protokoll.append({"nr": k, "klang": c["klang"], "wort": c["text"], "zeit_s": round(w["start"] + c.get("versatz", 0.0), 3),
                          "db": c["db"]})
    # Endkarte stumm: Effekte enden mit dem Schnitt (30 ms Blende)
    if cues.get("endkarte_stumm", True):
        i = int(round(t_karte * SR))
        b = int(0.03 * SR)
        fx[i - b:i] *= np.linspace(1, 0, b)[:, None]
        fx[i:] = 0

    # Wie laut sind die Effekte gegen die Stimme? Je Cue die lauteste Momentan-Lautheit des
    # Effekts allein in den 1,5 s ab dem Cue, verglichen mit der Stimme (integriert, Stereo).
    st_lufs = lautheit(stimme)["lufs"]
    m_fx = momentan(fx)
    m_st = momentan(stimme)
    for p in protokoll:
        a = int(p["zeit_s"] * 10)
        b = a + 15
        p["fx_max_lufs"] = round(float(m_fx[a:b].max()), 1)
        p["abstand_zur_stimme_lu"] = round(st_lufs - p["fx_max_lufs"], 1)
        p["stimme_dort_lufs"] = round(float(m_st[a:b].max()), 1)

    upload_roh = stimme + fx
    upload, info_up = begrenzen(upload_roh, decke_db)

    # Vorhör: Klangbett 12 LU unter der Stimme
    info_vh = None
    if bett_pfad:
        bett_roh = lade_stereo(bett_pfad)
        if len(bett_roh) < n:
            sys.exit("Klangbett ist kürzer als die Folge")
        bett = bett_roh[:n].copy()
        b_lufs = lautheit(bett)["lufs"]
        bett *= 10 ** ((st_lufs - BETT_ABSTAND_LU - b_lufs) / 20)
        # über die Endkarte weiter, in den letzten 0,5 s ausblenden (in der App liefe der Sound weiter)
        k = int(0.5 * SR)
        bett[-k:] *= np.linspace(1, 0, k)[:, None]
        vorhoer, info_vh = begrenzen(upload_roh + bett, decke_db)
        info_vh["bett"] = {"datei": str(bett_pfad), "sha256": hashlib.sha256(bett_pfad.read_bytes()).hexdigest(),
                           "lufs_roh": b_lufs, "abstand_zur_stimme_lu": BETT_ABSTAND_LU,
                           "lufs_im_mix_vor_norm": round(lautheit(bett)["lufs"], 2)}
        schreibe_wav(ton / "mix-vorhoer.wav", vorhoer)
        schreibe_wav(ton / "bett.wav", bett)

    schreibe_wav(ton / "effekte.wav", fx)
    schreibe_wav(ton / "mix-upload.wav", upload)

    abst = [p["abstand_zur_stimme_lu"] for p in protokoll]
    bericht = {
        "folge": name, "laenge_s": round(n / SR, 3), "bilder": bilder, "endkarte_ab_s": round(t_karte, 3),
        "stimme": {"datei": str(stimme_pfad.relative_to(ordner.parent.parent)), "lufs_stereo": st_lufs,
                   "sha256": hashlib.sha256(stimme_pfad.read_bytes()).hexdigest()},
        "effekte": {"klaenge": sorted({c["klang"] for c in cues["cues"]}), "cues": len(protokoll),
                    "abstand_min_lu": min(abst), "abstand_median_lu": float(np.median(abst)),
                    "lufs_integriert_allein": lautheit(fx)["lufs"], "liste": protokoll},
        "upload": info_up,
        "vorhoer": info_vh,
        "regel": {"ziel_lufs": ZIEL_LUFS, "max_tp_dbtp": MAX_TP, "decke_dbfs": decke_db},
    }
    (ordner / "mischung.json").write_text(json.dumps(bericht, ensure_ascii=False, indent=1), encoding="utf-8")
    return bericht


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("ordner", type=Path)
    ap.add_argument("--bett", type=Path, help="Klangbett (WAV) für die Vorhör-Fassung")
    ap.add_argument("--decke", type=float, default=DECKE_DB, help="Begrenzer-Decke in dBFS (Std −1,8)")
    a = ap.parse_args()
    b = mische(a.ordner.resolve(), a.bett.resolve() if a.bett else None, a.decke)
    kurz = {k: b[k] for k in ("laenge_s", "endkarte_ab_s")}
    kurz["upload"] = b["upload"]["ausgang"]
    kurz["vorhoer"] = b["vorhoer"]["ausgang"] if b["vorhoer"] else None
    kurz["effekte_abstand"] = (b["effekte"]["abstand_min_lu"], b["effekte"]["abstand_median_lu"])
    print(json.dumps(kurz, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
