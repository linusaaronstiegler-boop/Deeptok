#!/usr/bin/env python3
"""Messung der Atem-Probe (Rules of Kindly F1, Bibel §10.7): Kompressions-Simulation und Tor.

Aufruf (von test/atem-probe.mjs): python3 test/atem_messung.py <ordner>
Erwartet im Ordner: mit.mp4, ohne.mp4 (Hauptfassung crf 18, gleiche Bilder mit und ohne Atemdampf) und orte.json
(Bildorte der Anker <figur>.dampf und <figur>.mund je dritten Bild, aus der Engine projiziert).

1. Kompression wie eine Plattform im schlechten Fall: H.264, x264 -preset medium, zwei Durchgänge, 30 fps:
   1080x1920 mit 2,5 und 1,5 Mbit/s, 720x1280 mit 1,0 Mbit/s. (TikTok nennt keine Auslieferungs-Bitrate;
   Fremdangaben 2–4 Mbit/s, Websuche 17.11.2026, unbelegt: die Werte liegen absichtlich am unteren Rand.)
2. Messung je Fassung: In einem Kasten um die Stelle, an der die Wolke hängt (Anker dampf), mittlere Helligkeit
   (0–255) mit Dampf minus ohne Dampf, je Bild. Kastengröße folgt dem Abstand Mund–Wolke im Bild.
3. Tor (Bibel §10.7; Schwellen A): Wer dampft, hebt sich im Mittel um >= 12 Stufen ab; wer nicht dampft (Bear),
   bleibt im Mittel unter 3 (nur Kompressionsrauschen). Dazu „fällt in unter 1 s auf“: In JEDEM 1-s-Fenster hebt
   sich mindestens eine dampfende Figur um >= 12 ab (der Vergleich mit Bear ist also jederzeit möglich).
   Erste Probe (17.11.2026): Odell, von hinten gesehen, hat einzelne Sekunden, in denen sein Kopf die eigene Wolke
   verdeckt (1-s-Minimum 3,9); deshalb gilt die Fenster-Regel für die Gruppe, nicht für jede Figur.
4. Kontaktbögen in Feed-Größe 270x480 (6 Bilder) je Fassung zum Ansehen.
Ergebnis: messung.json, bogen-<fassung>.jpg, Exit-Code 0 = bestanden.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

FASSUNGEN = [
    ("1080p-2500k", 1080, 1920, "2500k"),
    ("1080p-1500k", 1080, 1920, "1500k"),
    ("720p-1000k", 720, 1280, "1000k"),
]
MW, MH = 540, 960            # Messauflösung (halbe Breite), Orte aus orte.json sind in 1080x1920
FPS = 30
DAMPF_MITTEL, FENSTER_GRUPPE, OHNE_MITTEL = 12.0, 12.0, 3.0
BOGEN_ZEITEN = [0.5, 2.0, 3.5, 5.5, 7.0, 9.0]


def ffmpeg(*args):
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args], check=True)


def komprimieren(quelle: Path, ziel: Path, w: int, h: int, rate: str, log: Path):
    # zwei Durchgänge wie bei einer Plattform-Kodierung (Bitrate fest, Qualität folgt dem Inhalt)
    vf = f"scale={w}:{h}:flags=bicubic,format=yuv420p"
    gemeinsam = ["-i", str(quelle), "-vf", vf, "-c:v", "libx264", "-preset", "medium", "-b:v", rate, "-r", str(FPS), "-an", "-passlogfile", str(log)]
    ffmpeg(*gemeinsam, "-pass", "1", "-f", "mp4", "/dev/null")
    ffmpeg(*gemeinsam, "-pass", "2", "-maxrate", rate, "-bufsize", str(int(rate[:-1]) * 2) + "k", str(ziel))


def graubilder(datei: Path) -> np.ndarray:
    roh = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(datei), "-vf", f"scale={MW}:{MH}:flags=area,format=gray",
                          "-f", "rawvideo", "-"], check=True, capture_output=True).stdout
    return np.frombuffer(roh, dtype=np.uint8).reshape(-1, MH, MW)


def kaesten(orte: dict):
    """Je Messbild und Figur: (bild, figur, x0, y0, x1, y1) in Messauflösung."""
    s = MW / 1080
    aus = []
    for eintrag in orte["bilder"]:
        p = {pp["anker"]: pp for pp in eintrag["punkte"]}
        for fig in orte["figuren"]:
            d, m = p[f"{fig}.dampf"], p[f"{fig}.mund"]
            if not (d["vorn"] and m["vorn"]):
                continue
            abstand = max(8.0, np.hypot(d["x"] - m["x"], d["y"] - m["y"]) * s)
            halb = max(12, int(round(abstand * 0.6)))
            cx, cy = d["x"] * s, d["y"] * s
            x0, x1, y0, y1 = int(cx - halb), int(cx + halb), int(cy - halb), int(cy + halb)
            if x0 < 0 or y0 < 0 or x1 > MW or y1 > MH:
                continue
            aus.append((eintrag["bild"], fig, x0, y0, x1, y1))
    return aus


def messen(mit: np.ndarray, ohne: np.ndarray, boxen) -> dict:
    je = {}
    for bild, fig, x0, y0, x1, y1 in boxen:
        if bild >= len(mit) or bild >= len(ohne):
            continue
        d = float(mit[bild, y0:y1, x0:x1].mean()) - float(ohne[bild, y0:y1, x0:x1].mean())
        je.setdefault(fig, []).append((bild, d))
    ergebnis = {}
    for fig, werte in je.items():
        werte.sort()
        bilder = np.array([b for b, _ in werte])
        d = np.array([x for _, x in werte])
        # gleitende 1-s-Fenster über die Messbilder (je drittes Bild: 10 Werte je Sekunde)
        fenster = []
        for b0 in range(0, int(bilder.max()) - FPS + 2, 3):
            sel = (bilder >= b0) & (bilder < b0 + FPS)
            if sel.sum() >= 5:
                fenster.append(float(d[sel].mean()))
        ergebnis[fig] = {
            "_fenster": fenster,
            "mittel": round(float(d.mean()), 2), "betrag_mittel": round(float(np.abs(d).mean()), 2),
            "min_1s": round(min(fenster), 2) if fenster else None, "anteil_ab_12": round(float((d >= 12).mean()), 3),
            "messbilder": int(len(d)),
        }
    return ergebnis


def bogen(datei: Path, ziel: Path, w: int):
    teile = []
    for t in BOGEN_ZEITEN:
        teile += ["-ss", str(t), "-i", str(datei)]
    filt = "".join(f"[{i}:v]scale=270:480:flags=area,setsar=1[v{i}];" for i in range(len(BOGEN_ZEITEN)))
    filt += "".join(f"[v{i}]" for i in range(len(BOGEN_ZEITEN))) + f"hstack=inputs={len(BOGEN_ZEITEN)}"
    ffmpeg(*teile, "-filter_complex", filt, "-frames:v", "1", "-q:v", "3", str(ziel))


def main():
    ordner = Path(sys.argv[1])
    orte = json.loads((ordner / "orte.json").read_text())
    boxen = kaesten(orte)
    bericht = {"tor": {"dampf_mittel_min": DAMPF_MITTEL, "gruppe_1s_min": FENSTER_GRUPPE, "ohne_betrag_max": OHNE_MITTEL},
               "dampft": ["gus", "odell"], "dampft_nicht": ["bear"], "fassungen": {}}
    ok = True
    fassungen = [("master-crf18", None, None, None)] + FASSUNGEN
    for name, w, h, rate in fassungen:
        dateien = {}
        for quelle in ("mit", "ohne"):
            src = ordner / f"{quelle}.mp4"
            if rate is None:
                dateien[quelle] = src
                continue
            ziel = ordner / f"{quelle}-{name}.mp4"
            komprimieren(src, ziel, w, h, rate, ordner / f"x264-{quelle}-{name}")
            dateien[quelle] = ziel
        mit, ohne = graubilder(dateien["mit"]), graubilder(dateien["ohne"])
        werte = messen(mit, ohne, boxen)
        del mit, ohne
        f_ok = True
        for fig in bericht["dampft"]:
            v = werte.get(fig)
            gut = bool(v and v["mittel"] >= DAMPF_MITTEL)
            v["bestanden"] = gut
            f_ok &= gut
        for fig in bericht["dampft_nicht"]:
            v = werte.get(fig)
            gut = bool(v and v["betrag_mittel"] < OHNE_MITTEL)
            v["bestanden"] = gut
            f_ok &= gut
        # je 1-s-Fenster die stärkste dampfende Figur
        reihen = [werte[f]["_fenster"] for f in bericht["dampft"] if f in werte]
        n = min(len(r) for r in reihen) if reihen else 0
        gruppe = [max(r[i] for r in reihen) for i in range(n)]
        gruppe_min = round(min(gruppe), 2) if gruppe else None
        f_ok &= bool(gruppe_min is not None and gruppe_min >= FENSTER_GRUPPE)
        for v in werte.values():
            v.pop("_fenster", None)
        groesse = dateien["mit"].stat().st_size
        bericht["fassungen"][name] = {"figuren": werte, "gruppe_min_1s": gruppe_min, "bestanden": f_ok, "datei_mb": round(groesse / 1e6, 2),
                                      "bitrate_kbit": round(groesse * 8 / 10 / 1000)}
        bogen(dateien["mit"], ordner / f"bogen-{name}.jpg", w)
        ok &= f_ok
        zeilen = ", ".join(f"{fig} {v['mittel']:+.1f} (1 s min {v['min_1s']}, |d| {v['betrag_mittel']})" for fig, v in werte.items())
        print(f"{name:12s} {'OK  ' if f_ok else 'FEHL'} {zeilen}; Gruppe 1 s min {gruppe_min}")
    for p in ordner.glob("x264-*"):
        p.unlink()
    bericht["bestanden"] = ok
    (ordner / "messung.json").write_text(json.dumps(bericht, indent=1, ensure_ascii=False))
    print("Atem-Tor:", "bestanden" if ok else "NICHT bestanden")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
