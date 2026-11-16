#!/usr/bin/env python3
"""Stille in eine fertige Stimme einfügen, ohne neue Aufnahme (Pausen für Klopfer, Glocke, Luft).

    python engine/ton/einschub.py episoden/folge-03 --bei 67.1:0.5 --bei 120.3:0.5 --grund "…"

Für jedes Paar ZEIT:DAUER (Sekunden der aktuellen Spur) wird an ZEIT eine Pause eingefügt. ZEIT muss
in einer echten Sprechpause liegen (zwischen zwei Wörtern, mindestens 40 ms Abstand zu beiden).
Gefüllt wird mit dem Grundrauschen genau dieser Pause (gekachelt, mit 10 ms Überblendung), damit
kein „Loch“ aus digitaler Stille entsteht, das man hört.

Schreibt:
  build/<folge>/stimme.wav             neue Spur (die alte wird vorher als stimme-vor-einschub-N.wav gesichert)
  build/<folge>/stimme.m4a             neu kodiert (AAC 192 kbit/s, wie die Stimm-Kette)
  episoden/<folge>/timing.json         Wort- und Satzzeiten verschoben, dauer_s, sha256, Liste 'einschuebe'
Danach müssen Shotliste, Render (ab der ersten Einfügung), Untertitel und Mischung neu laufen.

Warum nicht neu vertonen? Eine Pause von 0,5 s ändert nichts an Tonfall und Satzmelodie; eine neue
Aufnahme kostet Credits und klingt nie genau gleich (Dauerregel: Generierungen nie wiederholen).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np


def lade_wav(pfad: Path) -> tuple[np.ndarray, int]:
    with wave.open(str(pfad)) as w:
        sr, n, kan, breite = w.getframerate(), w.getnframes(), w.getnchannels(), w.getsampwidth()
        roh = w.readframes(n)
    if breite != 2:
        sys.exit(f"{pfad}: nur 16-bit-WAV wird unterstützt")
    x = np.frombuffer(roh, np.int16).reshape(-1, kan).astype(np.float64) / 32768
    return x, sr


def schreibe_wav(pfad: Path, x: np.ndarray, sr: int) -> None:
    y = np.clip(np.round(x * 32768), -32768, 32767).astype(np.int16)
    with wave.open(str(pfad), "wb") as w:
        w.setnchannels(y.shape[1]); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes(y.tobytes())


def fuellung(x: np.ndarray, sr: int, i: int, dauer_s: float, pause: tuple[int, int]) -> np.ndarray:
    """Grundrauschen der umgebenden Pause, gekachelt auf dauer_s. Kacheln mit 10 ms Überblendung."""
    a, b = pause
    # nur der ruhige Kern der Pause (je 30 ms Abstand zu den Wörtern)
    rand = int(0.03 * sr)
    kern = x[a + rand: b - rand]
    if len(kern) < int(0.05 * sr):
        kern = x[a:b]
    n = int(round(dauer_s * sr))
    k = min(int(0.01 * sr), len(kern) // 4)
    rampe = np.linspace(0, 1, k)[:, None] if k else None
    aus = np.zeros((0, x.shape[1]))
    while len(aus) < n:
        stueck = kern.copy()
        if len(aus) and k:
            stueck[:k] = aus[-k:] * (1 - rampe) + stueck[:k] * rampe
            aus = np.concatenate([aus[:-k], stueck])
        else:
            aus = np.concatenate([aus, stueck])
    return aus[:n]


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("ordner", type=Path)
    ap.add_argument("--bei", action="append", required=True, help="ZEIT:DAUER in Sekunden (mehrfach möglich)")
    ap.add_argument("--grund", default="", help="Begründung, landet in timing.json")
    a = ap.parse_args()
    ordner = a.ordner.resolve()
    build = ordner.parent.parent / "build" / ordner.name
    wav = build / "stimme.wav"
    tpfad = ordner / "timing.json"
    timing = json.loads(tpfad.read_text(encoding="utf-8"))
    x, sr = lade_wav(wav)
    alt_sha = hashlib.sha256(wav.read_bytes()).hexdigest()
    if timing.get("sha256") and timing["sha256"] != alt_sha:
        sys.exit("timing.json passt nicht zu build/…/stimme.wav (sha256)")

    # Von hinten nach vorn einfügen: dann gelten alle Zeiten der Aufrufzeile in der alten Spur
    paare = sorted((tuple(float(v) for v in p.split(":")) for p in a.bei), reverse=True)
    woerter = timing["woerter"]
    protokoll = []
    for zeit, dauer in paare:
        vor = [w for w in woerter if w["ende"] <= zeit]
        nach = [w for w in woerter if w["start"] >= zeit]
        if not vor or not nach or vor[-1]["i"] + 1 != nach[0]["i"]:
            sys.exit(f"{zeit} s liegt nicht in einer Pause zwischen zwei Wörtern")
        if zeit - vor[-1]["ende"] < 0.04 or nach[0]["start"] - zeit < 0.04:
            sys.exit(f"{zeit} s liegt zu nah an einem Wort ({vor[-1]['text']} / {nach[0]['text']})")
        i = int(round(zeit * sr))
        f = fuellung(x, sr, i, dauer, (int(vor[-1]["ende"] * sr), int(nach[0]["start"] * sr)))
        # 10 ms Überblendung an beiden Nähten, damit kein Knacken entsteht
        k = int(0.01 * sr)
        r = np.linspace(0, 1, k)[:, None]
        f[:k] = x[i - k:i] * (1 - r) + f[:k] * r
        f[-k:] = f[-k:] * (1 - r) + x[i:i + k] * r
        x = np.concatenate([x[:i], f, x[i:]])
        for w in woerter:
            if w["start"] >= zeit:
                w["start"] = round(w["start"] + dauer, 3)
                w["ende"] = round(w["ende"] + dauer, 3)
        for s in timing.get("saetze", []):
            if s["start"] >= zeit:
                s["start"] = round(s["start"] + dauer, 3)
                s["ende"] = round(s["ende"] + dauer, 3)
        protokoll.append({"ab_s": zeit, "dauer_s": dauer, "zwischen": [vor[-1]["text"], nach[0]["text"]],
                          "rauschen_dbfs": round(20 * np.log10(np.sqrt(np.mean(f ** 2)) + 1e-12), 1)})

    # alte Spur sichern (fortlaufend nummeriert), neue schreiben
    nr = 1
    while (build / f"stimme-vor-einschub-{nr}.wav").exists():
        nr += 1
    shutil.copy2(wav, build / f"stimme-vor-einschub-{nr}.wav")
    shutil.copy2(tpfad, build / f"timing-vor-einschub-{nr}.json")
    schreibe_wav(wav, x, sr)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-c:a", "aac", "-b:a", "192k", str(build / "stimme.m4a")], check=True)

    timing["sha256"] = hashlib.sha256(wav.read_bytes()).hexdigest()
    timing["dauer_s"] = round(len(x) / sr, 3)
    liste = timing.get("einschuebe") or ([timing.pop("einschub")] if "einschub" in timing else [])
    for p in sorted(protokoll, key=lambda p: p["ab_s"]):
        liste.append({**p, "grund": a.grund, "sha256_vorher": alt_sha,
                      "vorher": f"build/{ordner.name}/stimme-vor-einschub-{nr}.wav, timing-vor-einschub-{nr}.json"})
    timing["einschuebe"] = liste
    timing.pop("einschub", None)
    tpfad.write_text(json.dumps(timing, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps({"dauer_s": timing["dauer_s"], "eingefuegt": protokoll}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
