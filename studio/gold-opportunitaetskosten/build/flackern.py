"""Einzelbild-Scan des fertigen Videos: findet Bilder, die für genau EIN Bild anders aussehen.

    python build/flackern.py renders/gold.mp4

Warum: An einer Naht zwischen zwei Szenen kann ein Clip 1 ms zu früh enden; dann fehlt ein Text
für genau ein Bild (Kritik Prüfung 3, Bild 989). Mit neuen Wortzeiten (anderer Stimme) kann das an
anderer Stelle wiederkommen. Darum läuft dieser Scan nach jedem Render.

Verfahren: jedes Bild in Graustufen, 270 x 480. Ein Ausreißer ist Bild n, wenn es sich von n-1 UND
von n+1 deutlich unterscheidet, n-1 und n+1 aber fast gleich sind (das Bild "blitzt").
Ein schnell bewegter kleiner Gegenstand (Stempel, fallende Tüte) blitzt an einem Pixel genauso.
Darum zählt als FEHLER nur ein Ausreißer an einer Naht (+-3 Bilder um den Anfang einer Szene, aus
index.html): Dort enden und beginnen Clips. Alle anderen stehen als Hinweis da (ansehen!).
Ausgabe: Liste der Ausreißer; Exit 1, wenn es an einer Naht einen gibt.
"""
import re
from pathlib import Path
import subprocess
import sys

import numpy as np

B, H, FPS = 270, 480, 30
pfad = sys.argv[1]
roh = subprocess.run(["ffmpeg", "-v", "error", "-i", pfad, "-vf", f"scale={B}:{H},format=gray", "-f", "rawvideo", "-"],
                     capture_output=True, check=True).stdout
bilder = np.frombuffer(roh, dtype=np.uint8).reshape(-1, H, B).astype(np.float32) / 255
# Pro Pixel: "blitzt", wenn es in Bild n deutlich anders ist als in n-1 UND n+1 (gleiche Richtung),
# n-1 und n+1 aber fast gleich sind. Ein fehlender Text (eine Zeile, wenige hundert Pixel bei
# 270 x 480) fällt so auf; ein bewegter Gegenstand nicht, denn an seiner Kante ändert sich nur
# eine Seite. Ein Bild gilt als Ausreißer ab MIN_PIXEL blitzenden Pixeln.
# Dünne Linien, die sich schnell bewegen (Karte bei einer Kamerafahrt, Ketten der Waage), blitzen
# auch so. Darum zählt nur ein Bild, dessen Nachbarn n-1 und n+1 im GANZEN fast gleich sind
# (ruhige Szene): Genau dort fiel das fehlende Bild an der Naht auf.
MIN_PIXEL = 60
RUHIG = 0.004
aus = []
for n in range(1, len(bilder) - 1):
    vor, hier, nach = bilder[n - 1], bilder[n], bilder[n + 1]
    d1, d2, d0 = hier - vor, hier - nach, nach - vor
    if float(np.mean(np.abs(d0))) > RUHIG:
        continue
    blitzt = (np.abs(d1) > 0.12) & (np.abs(d2) > 0.12) & (np.sign(d1) == np.sign(d2)) & (np.abs(d0) < 0.04)
    zahl = int(blitzt.sum())
    if zahl >= MIN_PIXEL:
        ys, xs = np.nonzero(blitzt)
        ort = (int(xs.min() * 1080 / B), int(ys.min() * 1920 / H), int(xs.max() * 1080 / B), int(ys.max() * 1920 / H))
        aus.append((n, round(n / FPS, 3), zahl, ort))
# Nähte: Anfang jeder HUD-Szene (data-start der Hosts in index.html), in Bildern
index = Path(__file__).resolve().parent.parent / "index.html"
naehte = sorted({round(float(s) * FPS) for s in re.findall(r'data-composition-src="[^"]*"\s+data-start="([\d.]+)"', index.read_text())})
an_naht = [a for a in aus if any(abs(a[0] - n) <= 3 for n in naehte)]
print(f"{len(bilder)} Bilder geprüft, {len(naehte)} Nähte, {len(an_naht)} Ausreißer an Nähten, {len(aus) - len(an_naht)} Hinweise sonst")
for a in aus:
    art = "FEHLER (Naht)" if a in an_naht else "Hinweis"
    print("  %s: Bild %d (%.3f s), %d blitzende Pixel, Bereich %s" % ((art,) + a))
sys.exit(1 if an_naht else 0)
