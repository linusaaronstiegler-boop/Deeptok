"""Vergleichstafel der sechs Look-Proben: je Look zwei Bilder aus dem gerenderten MP4, oben Beat 1
(gleicher Inhalt in allen Looks: „Barcelona bietet 45 Mio. €“), unten Beat 2 (Übergang und Takt
des Looks: „Behält Bayern ihn bis Juni 2023: 0 €“). Ziel < 300 KB.

    /home/user/Deeptok/.venv/bin/python studio/looks/werkzeug/vergleich.py
"""
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

LOOKS_DIR = Path(__file__).resolve().parent.parent
# (Ordner, Name, Zeitpunkt Beat 1, Zeitpunkt Beat 2): Beat 1 steht fertig, Beat 2 ebenfalls.
LOOKS = [("atlas-nacht", "Atlas Nacht", 3.2, 11.0), ("zeitungspapier", "Zeitungspapier", 3.2, 11.0),
         ("labor", "Labor", 3.2, 11.0), ("archiv-duoton", "Archiv-Duoton", 3.2, 11.0),
         ("flach", "Flach", 4.6, 11.0), ("kurstafel", "Kurstafel", 3.2, 11.0)]
B, H, RAND, LEISTE = 300, 533, 12, 44


def bild(look: str, zeit: float, ordner: Path) -> Image.Image:
    ziel = ordner / f"{look}-{zeit}.png"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(zeit), "-i",
                    str(LOOKS_DIR / f"probe-{look}" / "renders" / f"probe-{look}.mp4"), "-frames:v", "1", str(ziel)],
                   check=True)
    return Image.open(ziel).convert("RGB").resize((B, H), Image.LANCZOS)


def main(ziel: Path) -> None:
    tafel = Image.new("RGB", (len(LOOKS) * B + (len(LOOKS) + 1) * RAND, 2 * H + LEISTE + 3 * RAND), (40, 40, 40))
    zeichner = ImageDraw.Draw(tafel)
    schrift = ImageFont.load_default(size=24)
    with tempfile.TemporaryDirectory() as tmp:
        for i, (look, name, t1, t2) in enumerate(LOOKS):
            x = RAND + i * (B + RAND)
            tafel.paste(bild(look, t1, Path(tmp)), (x, RAND))
            tafel.paste(bild(look, t2, Path(tmp)), (x, 2 * RAND + H))
            zeichner.text((x + 4, 2 * RAND + 2 * H + 10), f"{i + 1}  {name}", fill=(235, 235, 235), font=schrift)
    for q in (80, 72, 64, 56):
        tafel.save(ziel, quality=q, optimize=True, progressive=True)
        if ziel.stat().st_size < 300_000:
            break
    print(ziel, tafel.size, ziel.stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main(Path(sys.argv[1]) if len(sys.argv) > 1 else LOOKS_DIR / "belege" / "vergleich.jpg")
