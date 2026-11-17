#!/usr/bin/env python3
"""Fertige MP4 einer Folge prüfen: Format, Dauer, Hör-Check, Untertitel-Sync, Bilder, Ton.

    python engine/pruefen.py episoden/folge-01

Prüft build/<folge>/<folge>-upload.mp4 (und -vorhoer.mp4; andere Namen mit --namen, Teil 2:
--namen ohne-musik,mit-musik) und schreibt
episoden/<folge>/pruefung.json sowie episoden/<folge>/render-bogen.jpg (30 Bilder, klein).
Exit 1, wenn eine harte Regel verletzt ist.

Regeln:
  1. Format: H.264 + AAC, 1080 × 1920, 30 fps, Bildzahl = episode.json.
  2. Dauer: Stimme (erstes bis letztes Wort) 70–90 s, nie unter 62 s; Endkarte 1,0 s, beginnt
     höchstens 0,2 s nach dem letzten Wort.
  3. Hör-Check: faster-whisper small auf dem Ton des MP4, gegen das Skript ausgerichtet;
     0 Wortfehler erwartet (Abweichungen werden einzeln gelistet, nicht jede ist ein Tonfehler).
  4. Untertitel-Sync: Die ASS wird allein auf Schwarz gerendert (dieselbe libass wie im MP4),
     Bild für Bild wird geprüft, wann der Streifen wechselt. Jede Einblendung muss genau auf
     ihrem geplanten Bild erscheinen. Der Abstand zum Wortbeginn muss ≤ 0,1 s sein, gemessen
     am Ton des MP4: Versatz MP4-Ton zur Master-WAV per Kreuzkorrelation; nach einer Pause
     zählt der akustische Einsatz (≥ 30 ms unter −40 dBFS, dann über −35 dBFS), mitten im Satz der Wortanfang
     laut Whisper auf dem MP4. Whisper allein taugt nach Pausen nicht: Es legt das erste Wort
     nach einer Stille oft 0,2–0,7 s zu früh, mitten in die Pause.
  5. Bilder: kein schwarzes oder einfarbiges Bild (Mittel < 6 oder Streuung < 2 von 255),
     keine Dekodierfehler, kein Stillstand über 0,33 s außer auf der Endkarte.
     Helligkeits-Tor (Review Folge 1, pruefen.py fing nur „schwarz“ ab, nicht „zu dunkel“):
     Median der Bildhelligkeit ≥ 85 von 255 (r2 102, r5 106), keine Einstellung im Mittel < 35.
     Review Teil 2: Der Kriechkeller (DUNKLE_ORTE) zählt nicht zum Median und darf bis 22 herunter;
     kein Leerbild (Streuung < 12) in den ersten 0,5 s einer Einstellung.
     Blitzer-Tor (Review Kindly F1): kein Einzelbild, das > 12 Stufen von beiden Nachbarn abweicht
     (außer in Flacker-Lichtereignissen). Pixel-Median je Einstellung ≥ 35 (dunkle Orte: eigene Grenze).
     Atem-Tor: build/<folge>/atem-tor.json von render.mjs --atemtor muss ok und jünger als episode.json sein.
     Balken-Tor: Eine Spalte, in der über 85 % der Pixel fast schwarz sind (< 12), gehört zu
     einem Balken; kein Bild darf Balken über 10 % der Bildbreite haben (Objekt vor der Linse).
     Kantendichte (Gradient > 20 bei 108 × 192) wird berichtet: r2 16,5 %, r5 13,3 %.
  6. Ton: −14 LUFS ±0,5, True Peak ≤ −1 dBTP auf der dekodierten AAC-Spur.
"""

from __future__ import annotations

import argparse
import re
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np

HIER = Path(__file__).resolve().parent
sys.path.insert(0, str(HIER))
sys.path.insert(0, str(HIER / "ton"))
import untertitel  # noqa: E402
import stimme  # noqa: E402

FPS = 30
W, H = 1080, 1920
BAND = (1080, 1500)      # y-Bereich der Untertitel (Mitte 1200; Review Teil 3: Ausweichlage 1400)


def probe(mp4: Path) -> dict:
    p = subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-count_frames",
                        "-of", "json", str(mp4)], capture_output=True, text=True, check=True)
    js = json.loads(p.stdout)
    v = next(s for s in js["streams"] if s["codec_type"] == "video")
    a = next((s for s in js["streams"] if s["codec_type"] == "audio"), None)
    return {
        "video": {"codec": v["codec_name"], "profil": v.get("profile"), "breite": v["width"], "hoehe": v["height"],
                  "fps": v["r_frame_rate"], "bilder": int(v["nb_read_frames"]), "pix_fmt": v["pix_fmt"],
                  "farbraum": v.get("color_space"), "dauer_s": float(v["duration"])},
        "audio": None if a is None else {"codec": a["codec_name"], "kanaele": a["channels"],
                                          "abtastrate": int(a["sample_rate"]), "dauer_s": float(a["duration"]),
                                          "kbit": round(int(a.get("bit_rate", 0)) / 1000)},
        "megabyte": round(int(js["format"]["size"]) / 1e6, 1),
    }


def ton_aus_mp4(mp4: Path, wav: Path) -> None:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp4), "-vn", "-ac", "1", "-ar", "16000", str(wav)], check=True)


def hoer_check(mp4: Path, skript: Path) -> dict:
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "ton.wav"
        ton_aus_mp4(mp4, wav)
        woerter = stimme.whisper_woerter(wav)
    tokens, _ = stimme.skript_tokens(skript)
    erg = stimme.ausrichten(tokens, woerter)
    # Reine Schreibweisen sind keine Hörfehler (Teil 2: Whisper schreibt „O'Dell“ und „Mr“ statt
    # „Odell“ und „Mister“): ohne Apostrophe und Leerzeichen, mr = mister, gleich -> eigene Liste
    # Gleich klingende Wörter zählen als Schreibweise (Review Teil 2: „helper too“ hörte Whisper nach der
    # Neumischung als „helper to“; das klingt identisch, vorher war es „help or two“)
    gleichklang = [{"too", "to", "two"}]

    def schreibweise(f: dict) -> bool:
        norm = lambda t: re.sub(r"[\s'’.]", "", re.sub(r"\bmr\b", "mister", t.lower()))  # noqa: E731
        a, b = norm(f["skript"]), norm(f["gehoert"])
        return a == b or any(a in g and b in g for g in gleichklang)
    schreib = [f for f in erg["fehler"] if schreibweise(f)]
    erg["fehler"] = [f for f in erg["fehler"] if not schreibweise(f)]
    return {"wer": round(erg["wer"], 4), "fehler": erg["fehler"], "schreibweisen": schreib, "eingefuegt": erg["eingefuegt"],
            "n_skript": erg["n_skript"], "n_gehoert": erg["n_gehoert"],
            "unsicher": [{"wort": w["text"], "p": round(w["p"], 2), "zeit_s": round(w["start"], 2)}
                         for w in erg["woerter"] if w["p"] < 0.5],
            "_woerter": erg["woerter"]}


def untertitel_wechsel(ass: Path, bilder: int) -> tuple[list[int], np.ndarray]:
    """ASS allein auf Schwarz rendern (gleiche libass wie im MP4) und die Bilder finden,
    in denen sich der Untertitel-Streifen ändert."""
    schriften = HIER / "assets" / "schriften"
    hoehe = BAND[1] - BAND[0]
    vf = (f"subtitles=filename={ass}:fontsdir={schriften},crop={W}:{hoehe}:0:{BAND[0]},"
          f"scale={W // 4}:{hoehe // 4},format=gray")
    p = subprocess.run(["ffmpeg", "-v", "error", "-f", "lavfi", "-i", f"color=c=black:s={W}x{H}:r={FPS}",
                        "-frames:v", str(bilder), "-vf", vf, "-f", "rawvideo", "-"], capture_output=True, check=True)
    f = np.frombuffer(p.stdout, np.uint8).reshape(bilder, hoehe // 4, W // 4).astype(np.int16)
    diff = np.abs(np.diff(f, axis=0)).mean(axis=(1, 2))
    return [i + 1 for i, d in enumerate(diff) if d > 0.05], f


def versatz_mp4_zu_wav(mp4: Path, wav: Path, sekunden: float = 30.0, max_lag_s: float = 0.25) -> float:
    """Versatz der MP4-Tonspur gegen die Master-WAV (s, positiv = MP4 später), Kreuzkorrelation."""
    def lade(pfad):
        roh = subprocess.run(["ffmpeg", "-v", "error", "-i", str(pfad), "-t", str(sekunden), "-vn", "-ac", "1",
                              "-ar", "44100", "-f", "f32le", "-"], capture_output=True, check=True).stdout
        return np.frombuffer(roh, np.float32).astype(np.float64)
    a, b = lade(mp4), lade(wav)
    n = min(len(a), len(b))
    a, b = a[:n], b[:n]
    m = 1 << int(np.ceil(np.log2(2 * n)))
    kor = np.fft.irfft(np.fft.rfft(a, m) * np.conj(np.fft.rfft(b, m)), m)
    lag = int(max_lag_s * 44100)
    kand = np.concatenate([kor[-lag:], kor[:lag + 1]])
    return (int(np.argmax(kand)) - lag) / 44100


def einsaetze(wav: Path) -> np.ndarray:
    """Zeiten (s), an denen die Stimme nach einer Lücke einsetzt: mindestens 30 ms unter −40 dBFS,
    dann der erste Rahmen über −35 dBFS. −40 statt echter Stille (−50), weil nach manchen Wörtern
    ein Atemhauch liegt (z. B. nach „sunset,“ in Folge 1)."""
    x = stimme.lade(wav)
    db = stimme.rahmen_db(x)                       # 10-ms-Rahmen, 20-ms-Fenster
    aus, leise = [], 3
    for i, d in enumerate(db):
        if d > -35 and leise >= 3:
            aus.append(i * 0.01 + 0.01)             # Fenstermitte des ersten lauten Rahmens
        if d < -40:
            leise += 1
        elif d > -35:
            leise = 0
    return np.array(aus)


HELL_MEDIAN_MIN = 85.0    # Median der Bildhelligkeit (0–255)
HELL_EINSTELLUNG_MIN = 35.0
# Review Teil 2: Der Kriechkeller soll fast dunkel sein (r2, dunkle Strecke: Mittel 25–30). Er zählt
# nicht zum Median und hat eine eigene Untergrenze je Einstellung; sonst hellt das Tor ihn wieder auf.
DUNKLE_ORTE = {"kriechkeller": 22.0, "huette-innen": 22.0}   # Rules of Kindly: Fischerhütte nachts (Preset "huette")
# Review Teil 2: E40 begann 0,8 s in einer Fläche (einfarbig blauviolett). Ein Bild mit Streuung unter 12
# in den ersten 0,5 s einer Einstellung gilt als Leerbild (sonst überall > 12).
LEERBILD_STREUUNG = 12.0
LEERBILD_FENSTER_S = 0.5
# Review Teil 3: Teil 2 E15 zeigte 0,63 s eine leere, unscharfe Wand mit Streuung 12,5–16,8 – knapp über
# dem Tor. Zusätzlich gilt: Streuung unter 20 UND fast keine Kanten (außerhalb des Untertitel-Streifens).
LEERBILD_STREUUNG_WEICH = 20.0
LEERBILD_KANTEN = 0.01
BALKEN_MAX = 0.10         # Anteil der Bildbreite
# Review Kindly F1: drei Einzelbild-Blitzer am Schnitt (Lampe der vorigen Einstellung brannte noch im ersten Bild,
# Mittelhelligkeit 116 → 211 → 134). Ein Bild, das um mehr als 12 Stufen über (oder unter) BEIDEN Nachbarn liegt,
# ist ein Fehler, außer in einem Flacker-Lichtereignis.
SPITZE_MIN = 12.0
# Review Kindly F1: Gesichter unter dem Eis „in schwarzer Leere“ (Bildmedian 3–4, der Mittelwert 61–77 ließ sie durch).
# Zusätzlich zum Mittel: Median der Pixel je Einstellung im Mittel ≥ 35 (dunkle Orte: ihre eigene Untergrenze).
HELL_PIXELMEDIAN_MIN = 35.0


def bilder_pruefen(mp4: Path, endkarte_bild: int, einstellungen: list | None = None, flackern: list | None = None) -> dict:
    """Ganzes MP4 klein dekodieren: Helligkeit (je Bild und je Einstellung), schwarze Balken,
    Kantendichte, Streuung, Stillstand, Dekodierfehler. einstellungen: [(id, erstes, letztes Bild)]."""
    w, h = 108, 192
    p = subprocess.run(["ffmpeg", "-v", "error", "-i", str(mp4), "-vf", f"scale={w}:{h},format=gray",
                        "-f", "rawvideo", "-"], capture_output=True)
    fehler = p.stderr.decode("utf-8", "replace").strip()
    f = np.frombuffer(p.stdout, np.uint8)
    n = len(f) // (w * h)
    f = f[: n * w * h].reshape(n, h, w).astype(np.float32)
    mittel = f.mean(axis=(1, 2))
    streu = f.std(axis=(1, 2))
    pixelmedian = np.median(f.reshape(n, -1), axis=1)
    # Einzelbild-Spitzen (Blitzer): Bild i weicht von BEIDEN Nachbarn in dieselbe Richtung um > SPITZE_MIN ab
    hoch = (mittel[1:-1] - mittel[:-2] > SPITZE_MIN) & (mittel[1:-1] - mittel[2:] > SPITZE_MIN)
    tief = (mittel[:-2] - mittel[1:-1] > SPITZE_MIN) & (mittel[2:] - mittel[1:-1] > SPITZE_MIN)
    spitzen = []
    for i in np.where(hoch | tief)[0] + 1:
        if i >= endkarte_bild or any(a <= i / FPS <= b for a, b in flackern or []):
            continue
        spitzen.append({"bild": int(i), "zeit_s": round(float(i) / FPS, 3), "vorher": round(float(mittel[i - 1]), 1), "bild_mittel": round(float(mittel[i]), 1), "nachher": round(float(mittel[i + 1]), 1)})
    # Stillstand: mittlere Änderung zum Vorbild unter 0,15 Graustufen (Korn ist deterministisch,
    # ändert sich aber mit der Bildnummer, ein stehendes Bild ist also wirklich eingefroren)
    d = np.abs(np.diff(f, axis=0)).mean(axis=(1, 2))
    still = d < 0.15
    laengste, lauf, ende_lauf = 0, 0, 0
    for i, s in enumerate(still[: endkarte_bild - 1]):
        lauf = lauf + 1 if s else 0
        if lauf > laengste:
            laengste, ende_lauf = lauf, i + 1
    schwarz = [int(i) for i in np.where((mittel < 6) | (streu < 2))[0]]
    # Balken: Spalten, die fast ganz schwarz sind (Pfosten vor der Linse, Review Folge 1)
    balken = ((f < 12).mean(axis=1) > 0.85).mean(axis=1)
    gx = np.abs(np.diff(f, axis=2))[:, :-1, :]
    gy = np.abs(np.diff(f, axis=1))[:, :, :-1]
    kanten_karte = np.hypot(gx, gy) > 20
    kanten = kanten_karte.mean(axis=(1, 2))
    # ohne den Untertitel-Streifen (y 1040–1520 bei 1920, hier Zeilen 104–152): eingebrannte Schrift hat Kanten
    zeilen = np.r_[0:104, 152:kanten_karte.shape[1]]
    kanten_ohne_ut = kanten_karte[:, zeilen, :].mean(axis=(1, 2))
    inhalt = slice(0, endkarte_bild)
    je_einstellung = []
    median_maske = np.zeros(n, bool)
    median_maske[:endkarte_bild] = True
    leerbilder = []
    for eid, a, b, *ort in einstellungen or []:
        if a >= endkarte_bild:
            continue
        ort = ort[0] if ort else None
        if ort in DUNKLE_ORTE:
            median_maske[a:b + 1] = False
        k = min(b + 1, a + int(round(LEERBILD_FENSTER_S * FPS)))
        weich = (streu[a:k] < LEERBILD_STREUUNG_WEICH) & (kanten_ohne_ut[a:k] < LEERBILD_KANTEN)
        if ort in DUNKLE_ORTE:
            weich[:] = False      # im fast dunklen Keller sind wenige Kanten gewollt
        leer = (streu[a:k] < LEERBILD_STREUUNG) | weich
        if leer.any():
            i = int(a + np.argmax(leer))
            leerbilder.append({"id": eid, "bild": i, "streuung": round(float(streu[i]), 1), "kanten": round(float(kanten_ohne_ut[i]), 4)})
        je_einstellung.append({"id": eid, "ort": ort, "mittel": round(float(mittel[a:b + 1].mean()), 1),
                               "pixelmedian": round(float(pixelmedian[a:b + 1].mean()), 1),
                               "streuung_anfang_min": round(float(streu[a:k].min()), 1),
                               "balken_max": round(float(balken[a:b + 1].max()), 3)})
    dunkel_mittel = mittel[:endkarte_bild][~median_maske[:endkarte_bild]]
    return {"bilder": int(n), "dekodierfehler": fehler or None,
            "helligkeit_median_ohne_dunkle_orte": round(float(np.median(mittel[median_maske])), 1),
            "dunkle_orte_mittel": round(float(dunkel_mittel.mean()), 1) if len(dunkel_mittel) else None,
            "dunkle_orte_fast_schwarz_anteil": round(float((f[:endkarte_bild][~median_maske[:endkarte_bild]] < 20).mean()), 3) if len(dunkel_mittel) else None,
            "leerbilder_am_anfang": leerbilder,
            "einzelbild_spitzen": spitzen,
            "balken_max_ohne_dunkle_orte": round(float(balken[:endkarte_bild][median_maske[:endkarte_bild]].max()), 3),
            "balken_bild_ohne_dunkle_orte": int(np.where(median_maske[:endkarte_bild])[0][balken[:endkarte_bild][median_maske[:endkarte_bild]].argmax()]),
            "helligkeit_p10": round(float(np.percentile(mittel[inhalt], 10)), 1),
            "fast_schwarz_anteil": round(float((mittel[inhalt] < 30).mean()), 3),
            "balken_max": round(float(balken[inhalt].max()), 3), "balken_bild": int(balken[inhalt].argmax()),
            "kantendichte_median": round(float(np.median(kanten[inhalt])), 3),
            "einstellungen": je_einstellung,
            "helligkeit_min": round(float(mittel.min()), 1), "helligkeit_median": round(float(np.median(mittel)), 1),
            "dunkelstes_bild": int(mittel.argmin()), "streuung_min": round(float(streu.min()), 1),
            "schwarz_oder_einfarbig": schwarz,
            "laengster_stillstand_s": round((laengste + 1) / FPS, 3) if laengste else 0.0,
            "stillstand_endet_bild": ende_lauf if laengste else None,
            "aenderung_median": round(float(np.median(d)), 2)}


def bogen(mp4: Path, ziel: Path, dauer: float, n: int = 30) -> list[float]:
    """n Bilder gleichmäßig über das Video (Mitte jedes n-tels), 6 × 5, je 216 × 384."""
    zeiten = [round((k + 0.5) * dauer / n, 3) for k in range(n)]
    with tempfile.TemporaryDirectory() as tmp:
        for k, t in enumerate(zeiten):
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", str(mp4), "-frames:v", "1",
                            "-vf", f"scale=216:384,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:"
                                   f"text='{t:.1f}s':x=4:y=4:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.5",
                            str(Path(tmp) / f"b{k:02d}.png")], check=True)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(Path(tmp) / "b%02d.png"), "-vf",
                        "tile=6x5:padding=4:color=white", "-frames:v", "1", "-q:v", "4", str(ziel)], check=True)
    return zeiten


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("ordner", type=Path)
    ap.add_argument("--ohne-whisper", action="store_true")
    ap.add_argument("--namen", default="upload,vorhoer", help="Dateinamen der Fassungen ohne/mit Bett (Teil 2: ohne-musik,mit-musik)")
    # Teil 1 mit neuer Musik prüfen, ohne den abgenommenen Bericht von Teil 1 zu überschreiben
    ap.add_argument("--bericht", default="pruefung.json", help="Berichtsdatei im Folgenordner (Std pruefung.json)")
    ap.add_argument("--bogen", default="render-bogen.jpg", help="Bogen mit 30 Bildern im Folgenordner (Std render-bogen.jpg)")
    # Teil 3 (Finale): Stimme 125–155 s statt 70–90 s
    ap.add_argument("--dauer", default="70,90", help="erlaubte Länge der Stimme in s, von,bis (Std 70,90; Finale 125,155)")
    # Rules of Kindly: das Skript liegt bei der Serienbibel (episoden/serie-02/folge-01-skript.txt), nicht im Folgenordner
    ap.add_argument("--skript", type=Path, help="Skriptdatei (ein Satz pro Zeile); Std skript-teil*.txt bzw. skript.txt im Folgenordner")
    a = ap.parse_args()
    ordner = a.ordner.resolve()
    name = ordner.name
    namen = dict(zip(["upload", "vorhoer"], a.namen.split(",")))
    mp4_von = lambda art: build / f"{name}-{namen[art]}.mp4"   # noqa: E731
    # Skript der Folge (skript-teil1.txt, skript-teil2.txt, …)
    # Finale: skript.txt (ein Satz pro Zeile)
    skript = a.skript.resolve() if a.skript else (sorted(ordner.glob("skript-teil*.txt")) or [ordner / "skript.txt"])[0]
    build = ordner.parent.parent / "build" / name
    episode = json.loads((ordner / "episode.json").read_text(encoding="utf-8"))
    timing = json.loads((ordner / "timing.json").read_text(encoding="utf-8"))
    bilder_soll = round(episode["einstellungen"][-1]["ende"] * FPS)
    end = [e for e in episode["einstellungen"] if e.get("plan", {}).get("endkarte")]
    # ohne Endkarte (Finale): „Endkarte“ beginnt hinter dem letzten Bild, die Regeln für den Inhalt gelten bis zum Ende
    karte_bild = round(end[0]["start"] * FPS) if end else bilder_soll
    verstoesse = []
    erg = {"folge": name}

    # 1. Format
    fassungen = {}
    for art in ("upload", "vorhoer"):
        mp4 = mp4_von(art)
        if mp4.exists():
            fassungen[art] = probe(mp4)
    erg["format"] = fassungen
    for art, pr in fassungen.items():
        v = pr["video"]
        if (v["codec"], v["breite"], v["hoehe"], v["fps"], v["bilder"]) != ("h264", W, H, "30/1", bilder_soll):
            verstoesse.append(f"{art}: Format {v}")
        if not pr["audio"] or pr["audio"]["codec"] != "aac":
            verstoesse.append(f"{art}: kein AAC-Ton")

    # 2. Dauer
    w0, w1 = timing["woerter"][0]["start"], timing["woerter"][-1]["ende"]
    stimme_s = w1 - w0
    erg["dauer"] = {"stimme_s": round(stimme_s, 2), "letztes_wort_ende_s": w1, "endkarte_ab_s": round(karte_bild / FPS, 3),
                    "endkarte_s": round((bilder_soll - karte_bild) / FPS, 3), "video_s": round(bilder_soll / FPS, 3),
                    "abstand_letztes_wort_endkarte_s": round(karte_bild / FPS - w1, 3)}
    d0, d1 = (float(x) for x in a.dauer.split(","))
    if not d0 <= stimme_s <= d1:
        verstoesse.append(f"Stimme {stimme_s:.1f} s nicht in {d0:g}–{d1:g} s")
    if not end:
        erg["dauer"]["endkarte"] = "keine"
    if not 0 <= karte_bild / FPS - w1 <= 0.2:
        verstoesse.append("Endkarte (bzw. Ende ohne Endkarte) nicht ≤ 0,2 s nach dem letzten Wort")

    # 3. Hör-Check
    ut = json.loads((build / "untertitel-liste.json").read_text(encoding="utf-8"))
    whisper_start = None
    if not a.ohne_whisper:
        erg["hoer_check"] = {}
        for art in fassungen:
            hc = hoer_check(mp4_von(art), skript)
            woerter = hc.pop("_woerter")
            if art == "upload":
                whisper_start = [w["start"] for w in woerter]
                # Versatz Ton im MP4 gegen timing.json (Whisper-Wortanfänge, nur sicher erkannte Wörter)
                d = [w["start"] - t["start"] for w, t in zip(woerter, timing["woerter"]) if w["quelle"] == "whisper" and w["p"] > 0.8]
                hc["versatz_zu_timing_median_ms"] = round(float(np.median(d)) * 1000, 1)
                hc["versatz_zu_timing_p90_ms"] = round(float(np.percentile(np.abs(d), 90)) * 1000, 1)
            erg["hoer_check"][art] = hc
            if hc["fehler"]:
                verstoesse.append(f"Hör-Check {art}: {len(hc['fehler'])} Wortfehler")

    # 4. Untertitel-Sync: auf Schwarz gerendert, Wechselbilder gegen Plan und Whisper
    wechsel, band = untertitel_wechsel(ordner / "untertitel.ass", bilder_soll)
    wechsel = list(wechsel)
    plan = [e["bild"] for e in ut["einblendungen"]]
    if plan and plan[0] == 0 and band[0].mean() > 1:
        wechsel = [0] + wechsel                     # erste Einblendung steht ab Bild 0 (kein Vorbild)
    erwartet = set()
    for n in plan:
        erwartet.update({n, n + 1, n + 2})          # Pop: drei Stufen
    erwartet.add(ut["werte"]["letztes_bild"] + 1)   # Ausblenden vor der Endkarte
    gefunden = set(wechsel)
    fehlt = sorted(n for n in plan if n not in gefunden)
    unerwartet = sorted(gefunden - erwartet - {0})
    abw_plan = [abs(e["bild"] / FPS - e["wort_start"]) for e in ut["einblendungen"]]
    sync = {"einblendungen": len(plan), "wechsel_gefunden": len(gefunden),
            "einblendung_nicht_auf_plan_bild": fehlt, "wechsel_ausserhalb_plan": unerwartet[:20],
            "abstand_zu_timing_max_s": round(max(abw_plan), 3)}
    # Wortbeginn im MP4: nach Pausen akustischer Einsatz, sonst Whisper (siehe Regel 4)
    wav = build / "stimme.wav"
    versatz = versatz_mp4_zu_wav(mp4_von("upload"), wav)
    sync["versatz_mp4_ton_zu_master_ms"] = round(versatz * 1000, 2)
    ein = einsaetze(wav) + versatz
    woerter_t = timing["woerter"]
    abw, nach_pause, mitten, ohne = [], 0, 0, []
    for e in ut["einblendungen"]:
        i = e["woerter"][0]
        luecke = woerter_t[i]["start"] - woerter_t[i - 1]["ende"] if i > 0 else 1.0
        t_bild = e["bild"] / FPS
        nah = ein[np.abs(ein - woerter_t[i]["start"]) < 0.25] if len(ein) else np.array([])
        if luecke >= 0.08 and len(nah):
            ref, art = float(nah[np.argmin(np.abs(nah - woerter_t[i]["start"]))]), "einsatz"
            nach_pause += 1
        elif whisper_start:
            ref, art = whisper_start[i], "whisper"   # Whisper lief schon auf dem MP4-Ton
            mitten += 1
        else:
            ohne.append(e["text"])
            continue
        abw.append((e, t_bild - ref, art))
    werte = np.array([x for _, x, _ in abw])
    sync["gemessen_nach_pause_einsatz"] = nach_pause
    sync["gemessen_mitten_im_satz_whisper"] = mitten
    sync["abstand_zum_wortbeginn_median_s"] = round(float(np.median(werte)), 3)
    sync["abstand_zum_wortbeginn_p90_abs_s"] = round(float(np.percentile(np.abs(werte), 90)), 3)
    sync["abstand_zum_wortbeginn_max_abs_s"] = round(float(np.max(np.abs(werte))), 3)
    sync["ueber_0_1_s"] = [{"text": e["text"], "abstand_s": round(x, 3), "gemessen": art} for e, x, art in abw if abs(x) > 0.1]
    if sync["ueber_0_1_s"]:
        verstoesse.append(f"{len(sync['ueber_0_1_s'])} Einblendungen > 0,1 s neben dem Wortbeginn")
    erg["untertitel_sync"] = sync
    if fehlt or unerwartet:
        verstoesse.append("Untertitel wechseln nicht genau auf den geplanten Bildern")

    # 5. Bilder
    grenzen = [(e["id"], round(e["start"] * FPS), round(e["ende"] * FPS) - 1, e.get("plan", {}).get("ort")) for e in episode["einstellungen"]]
    flackern = [(l["start"], l["start"] + (l.get("dauer") or 1.0)) for l in episode.get("licht_ereignisse", []) if l.get("art") == "flackern"]
    erg["bilder"] = bilder_pruefen(mp4_von("upload"), karte_bild, grenzen, flackern)
    b = erg["bilder"]
    if b["einzelbild_spitzen"]:
        verstoesse.append("Einzelbild-Blitzer: " + ", ".join(f"Bild {x['bild']} ({x['vorher']} → {x['bild_mittel']} → {x['nachher']})" for x in b["einzelbild_spitzen"][:8]))
    zu_dunkel_median = [f"{e['id']} {e['pixelmedian']}" for e in b["einstellungen"]
                        if e["pixelmedian"] < DUNKLE_ORTE.get(e.get("ort"), HELL_PIXELMEDIAN_MIN)]
    if zu_dunkel_median:
        verstoesse.append(f"Einstellungen mit Pixel-Median < {HELL_PIXELMEDIAN_MIN} (schwarze Leere): {', '.join(zu_dunkel_median)}")
    # Atem-Tor (Review Kindly F1, P0): Ergebnis von render.mjs --atemtor (build/<folge>/atem-tor.json). Es muss zur
    # aktuellen episode.json passen (jünger sein), sonst gilt es als nicht geprüft.
    at = ordner.parent.parent / "build" / ordner.name / "atem-tor.json"
    if at.exists():
        atd = json.loads(at.read_text(encoding="utf-8"))
        erg["atem_tor"] = {k: atd[k] for k in ("kopie", "ab_s", "bilder_geprueft", "knappster", "ok")} | {"verstoesse": len(atd["verstoesse"])}
        if at.stat().st_mtime < (ordner / "episode.json").stat().st_mtime:
            verstoesse.append("Atem-Tor veraltet: atem-tor.json ist älter als episode.json (render.mjs --atemtor neu laufen lassen)")
        elif not atd["ok"]:
            verstoesse.append(f"Atem-Tor: {len(atd['verstoesse'])} Bilder mit fremder Dampfwolke am Mund der Kopie")
    if b["helligkeit_median_ohne_dunkle_orte"] < HELL_MEDIAN_MIN:
        verstoesse.append(f"Bilder zu dunkel: Median ohne Kriechkeller {b['helligkeit_median_ohne_dunkle_orte']} < {HELL_MEDIAN_MIN}")
    dunkel = [f"{e['id']} {e['mittel']}" for e in b["einstellungen"]
              if e["mittel"] < DUNKLE_ORTE.get(e.get("ort"), HELL_EINSTELLUNG_MIN)]
    if b["leerbilder_am_anfang"]:
        verstoesse.append("Leerbild in den ersten 0,5 s: " + ", ".join(f"{x['id']} (Bild {x['bild']}, Streuung {x['streuung']})" for x in b["leerbilder_am_anfang"]))
    if dunkel:
        verstoesse.append(f"Einstellungen zu dunkel (< {HELL_EINSTELLUNG_MIN}): {', '.join(dunkel)}")
    # Balken-Tor (Pfosten vor der Linse) gilt nicht für dunkle Orte: Im Kriechkeller sind fast schwarze
    # Spalten gewollt (r2, dunkle Strecke: 48–75 % fast schwarze Pixel); dort gilt die Untergrenze je Einstellung
    if b["balken_max_ohne_dunkle_orte"] > BALKEN_MAX:
        verstoesse.append(f"Schwarzer Balken über {b['balken_max_ohne_dunkle_orte'] * 100:.0f} % der Breite (Bild {b['balken_bild_ohne_dunkle_orte']})")
    if b["dekodierfehler"] or b["schwarz_oder_einfarbig"] or b["bilder"] != bilder_soll:
        verstoesse.append(f"Bilder: {b['dekodierfehler']}, schwarz {b['schwarz_oder_einfarbig'][:5]}, {b['bilder']} Bilder")
    if b["laengster_stillstand_s"] > 0.33:
        verstoesse.append(f"Stillstand {b['laengster_stillstand_s']} s (bis Bild {b['stillstand_endet_bild']})")
    erg["bogen_zeiten_s"] = bogen(mp4_von("upload"), ordner / a.bogen, bilder_soll / FPS)

    # 6. Ton (aus mischung.json, gemessen auf der dekodierten AAC-Spur)
    mi = json.loads((ordner / "mischung.json").read_text(encoding="utf-8"))
    erg["ton"] = mi.get("nach_aac")
    for art in fassungen:
        m = mi["nach_aac"][art]
        if abs(m["lufs"] + 14) > 0.5 or m["true_peak_dbtp"] > -1.0:
            verstoesse.append(f"Ton {art}: {m}")

    erg["verstoesse"] = verstoesse
    erg["ok"] = not verstoesse
    (ordner / a.bericht).write_text(json.dumps(erg, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps({k: erg[k] for k in ("dauer", "untertitel_sync", "verstoesse", "ok")}, ensure_ascii=False, indent=1))
    sys.exit(0 if erg["ok"] else 1)


if __name__ == "__main__":
    main()
