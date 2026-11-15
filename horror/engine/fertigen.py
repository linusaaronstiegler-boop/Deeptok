#!/usr/bin/env python3
"""Fertige MP4 einer Folge bauen: gerenderte Einzelbilder + Untertitel (ASS) + Tonmischungen.

    python engine/fertigen.py episoden/folge-01 [--nur-ton] [--bett PFAD.wav]

Ablauf:
  1. engine/untertitel.py   -> episoden/<folge>/untertitel.ass
  2. engine/ton/mischen.py  -> build/<folge>/ton/mix-upload.wav, mix-vorhoer.wav
  3. Bild einmal kodieren: build/<folge>/bilder/f%05d.(jpg|png) + Untertitel (libass)
     -> build/<folge>/<folge>-bild.mp4 (H.264 High, yuv420p, BT.709, 30 fps, ohne Ton)
  4. Zwei Fassungen ohne neues Kodieren des Bildes, nur der Ton wird AAC:
     <folge>-upload.mp4  (Stimme + Effekte; so lädt Linus hoch und wählt den Sound in der App)
     <folge>-vorhoer.mp4 (zusätzlich leises eigenes Klangbett)
  5. True Peak nach AAC nachmessen. AAC hebt Spitzen etwas an; liegt eine Fassung über
     −1 dBTP, wird die Mischung mit tieferer Begrenzer-Decke neu gebaut (höchstens 3 Runden).

Vorher: Einzelbilder mit render.mjs --nur-bilder (siehe README Abschnitt 11/17).
In der Cloud: [ -f /opt/deeptok/env.sh ] && . /opt/deeptok/env.sh
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

HIER = Path(__file__).resolve().parent
sys.path.insert(0, str(HIER))
sys.path.insert(0, str(HIER / "ton"))
import untertitel  # noqa: E402
import mischen  # noqa: E402

FPS = 30
AAC_KBIT = 192
STD_BETT = "ton/klangbett-r2-a.wav"   # relativ zu build/<folge>/


def ff(args: list[str]) -> None:
    r = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args])
    if r.returncode:
        sys.exit(f"ffmpeg fehlgeschlagen: ffmpeg {' '.join(args)}")


def true_peak_mp4(mp4: Path) -> dict:
    """Lautheit und True Peak der dekodierten AAC-Spur (so, wie sie das Handy abspielt)."""
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(mp4), "-vn", "-af",
                        "loudnorm=print_format=json", "-f", "null", "-"], capture_output=True, text=True)
    js = json.loads(p.stderr[p.stderr.rindex("{"):p.stderr.rindex("}") + 1])
    return {"lufs": float(js["input_i"]), "true_peak_dbtp": float(js["input_tp"]), "lra_lu": float(js["input_lra"])}


def kodiere_bild(build: Path, ass: Path, ziel: Path, bilder: int) -> float:
    """Einzelbilder + Untertitel -> H.264. JPEG-Bilder sind YCbCr nach BT.601 im Vollbereich (JFIF):
    erst nach RGB, dann brennt libass die Untertitel ein, dann BT.709 im TV-Bereich."""
    ordner = build / "bilder"
    endung = "jpg" if (ordner / "f00000.jpg").exists() else "png"
    vorhanden = len(list(ordner.glob(f"f*.{endung}")))
    if vorhanden != bilder:
        sys.exit(f"{ordner}: {vorhanden} Bilder, erwartet {bilder}")
    schriften = HIER / "assets" / "schriften"
    vf = (f"format=rgb24,subtitles=filename={ass}:fontsdir={schriften},"
          "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p")
    t0 = time.time()
    ff(["-framerate", str(FPS), "-i", str(ordner / f"f%05d.{endung}"), "-vf", vf,
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-maxrate", "14M", "-bufsize", "28M",
        "-profile:v", "high", "-level:v", "4.2", "-g", "60", "-r", str(FPS),
        "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
        "-movflags", "+faststart", "-an", str(ziel)])
    return time.time() - t0


def muxe(bild: Path, ton: Path, ziel: Path) -> None:
    ff(["-i", str(bild), "-i", str(ton), "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy",
        "-c:a", "aac", "-b:a", f"{AAC_KBIT}k", "-ar", "44100", "-ac", "2", "-shortest",
        "-movflags", "+faststart", str(ziel)])


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("ordner", type=Path)
    ap.add_argument("--nur-ton", action="store_true", help="Bild-MP4 nicht neu kodieren (nur Ton neu mischen)")
    ap.add_argument("--bett", type=Path, help=f"Klangbett für die Vorhör-Fassung (Std build/<folge>/{STD_BETT})")
    a = ap.parse_args()
    ordner = a.ordner.resolve()
    name = ordner.name
    build = ordner.parent.parent / "build" / name
    bett = (a.bett or build / STD_BETT).resolve()
    episode = json.loads((ordner / "episode.json").read_text(encoding="utf-8"))
    bilder = round(episode["einstellungen"][-1]["ende"] * FPS)

    print("1/4 Untertitel")
    werte_ut = untertitel.baue(ordner)
    print(f"    {werte_ut['einblendungen']} Einblendungen, größte Abweichung {werte_ut['max_abweichung_ms']} ms")

    bild = build / f"{name}-bild.mp4"
    if not a.nur_ton or not bild.exists():
        print("2/4 Bild kodieren (Einzelbilder + Untertitel)")
        s = kodiere_bild(build, ordner / "untertitel.ass", bild, bilder)
        print(f"    {bild} in {s:.0f} s")

    decke = mischen.DECKE_DB
    for runde in range(3):
        print(f"3/4 Ton mischen (Begrenzer-Decke {decke} dBFS)")
        bericht = mischen.mische(ordner, bett if bett.exists() else None, decke)
        print("4/4 Fassungen bauen")
        fassungen = {"upload": build / "ton" / "mix-upload.wav"}
        if bericht["vorhoer"]:
            fassungen["vorhoer"] = build / "ton" / "mix-vorhoer.wav"
        messung = {}
        for art, wav in fassungen.items():
            ziel = build / f"{name}-{art}.mp4"
            muxe(bild, wav, ziel)
            messung[art] = true_peak_mp4(ziel)
            print(f"    {ziel.name}: {messung[art]}")
        schlimmste = max(m["true_peak_dbtp"] for m in messung.values())
        if schlimmste <= mischen.MAX_TP:
            break
        decke -= schlimmste - mischen.MAX_TP + 0.2
    bericht["nach_aac"] = {"kbit": AAC_KBIT, **messung, "decke_dbfs": decke}
    (ordner / "mischung.json").write_text(json.dumps(bericht, ensure_ascii=False, indent=1), encoding="utf-8")
    if schlimmste > mischen.MAX_TP:
        sys.exit(f"True Peak nach AAC {schlimmste} dBTP liegt über {mischen.MAX_TP}")
    print("fertig")


if __name__ == "__main__":
    main()
