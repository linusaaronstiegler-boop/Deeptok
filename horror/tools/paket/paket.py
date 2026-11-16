"""Upload-Paket für einen Teil bauen.

Liest `horror/episoden/<folge>/paket.json` und schreibt nach
`horror/build/teilen/paket-<slug>/` (gitignored):

- das Video (Teilen-Fassung mit Musik), sprechend umbenannt
- titelbild.jpg 1080×1920: sauberes Bild aus dem Render ohne Untertitel, darauf Serienname und Teil
- bildunterschrift.txt: eine Zeile zum Kopieren (TikTok, Reels)
- youtube.txt: Titel, Beschreibung, Einstellungen
- untertitel.srt: aus den Satzzeiten (nur YouTube; bei TikTok sind die Untertitel im Bild)
- LIESMICH.txt: wann posten, welche Schalter, welcher Kommentar angeheftet wird

Aufruf: python horror/tools/paket/paket.py folge-01
"""
import json
import shutil
import sys
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

WURZEL = Path(__file__).resolve().parents[2]  # .../horror
SCHRIFT = WURZEL / "engine/assets/schriften/ArchivoBlack-Regular.ttf"
AKZENT = "#9FD8D2"  # kaltes Leuchten von Mister Hundred, wie im Untertitel-Akzent


def titelbild(bild: Path, titel: str, teil: str, ziel: Path) -> None:
    """Sauberes Renderbild + Titel. Text bleibt im mittleren 3:4-Ausschnitt
    (y 240–1680), weil TikTok im Profilraster nur diesen Teil zeigt."""
    img = Image.open(bild).convert("RGB").resize((1080, 1920))
    # Dunkler Verlauf oben, damit der Titel auf jedem Himmel lesbar bleibt.
    verlauf = Image.new("L", (1, 900))
    for y in range(900):
        verlauf.putpixel((0, y), int(190 * (1 - y / 900) ** 1.6))
    schwarz = Image.new("RGB", img.size, (6, 8, 16))
    maske = Image.new("L", img.size, 0)
    maske.paste(verlauf.resize((1080, 900)), (0, 0))
    img = Image.composite(schwarz, img, maske)

    zeichne = ImageDraw.Draw(img)

    def zeile(text, groesse, y, farbe):
        # Schrift so lange verkleinern, bis die Zeile mit Rand (60 px je Seite) passt.
        while True:
            f = ImageFont.truetype(str(SCHRIFT), groesse)
            breite = zeichne.textlength(text, font=f)
            if breite <= 960 or groesse < 40:
                break
            groesse -= 4
        zeichne.text(((1080 - breite) / 2, y), text, font=f, fill=farbe,
                     stroke_width=max(6, groesse // 18), stroke_fill=(0, 0, 0))

    zeile(titel.upper(), 150, 290, "white")
    zeile(teil.upper(), 104, 470, AKZENT)
    img.save(ziel, quality=92)


def srt(timing: Path, ziel: Path) -> None:
    """Satzweise Untertitel, höchstens 2 Zeilen à 42 Zeichen; lange Sätze werden
    an Wortgrenzen nach den echten Wortzeiten geteilt."""
    t = json.loads(timing.read_text())
    woerter = t["woerter"]

    def zeit(s):
        ms = int(round(s * 1000))
        return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"

    bloecke = []
    for satz in t["saetze"]:
        ws = woerter[satz["wort_von"]: satz["wort_bis"] + 1]
        stueck = []
        for w in ws:
            probe = " ".join(x["text"] for x in stueck + [w])
            if stueck and len(probe) > 72:
                bloecke.append(stueck)
                stueck = []
            stueck.append(w)
        if stueck:
            bloecke.append(stueck)
    zeilen = []
    for n, b in enumerate(bloecke, 1):
        text = "\n".join(textwrap.wrap(" ".join(w["text"] for w in b), 42))
        zeilen.append(f"{n}\n{zeit(b[0]['start'])} --> {zeit(b[-1]['ende'])}\n{text}\n")
    ziel.write_text("\n".join(zeilen), encoding="utf-8")


def main(folge: str) -> None:
    ordner = WURZEL / "episoden" / folge
    p = json.loads((ordner / "paket.json").read_text())
    ziel = WURZEL / "build/teilen" / f"paket-{p['slug']}"
    ziel.mkdir(parents=True, exist_ok=True)

    video = WURZEL / p["video"]
    shutil.copyfile(video, ziel / f"{p['slug']}.mp4")
    titelbild(WURZEL / p["titelbild"]["bild"], p["titelbild"]["titel"], p["titelbild"]["teil"],
              ziel / "titelbild.jpg")
    (ziel / "bildunterschrift.txt").write_text(p["bildunterschrift"] + "\n", encoding="utf-8")
    yt = p["youtube"]
    (ziel / "youtube.txt").write_text(
        f"TITEL\n{yt['titel']}\n\nBESCHREIBUNG\n{yt['beschreibung']}\n\nEINSTELLUNGEN\n"
        + "\n".join(f"- {e}" for e in yt["einstellungen"]) + "\n", encoding="utf-8")
    srt(ordner / p.get("timing", "timing.json"), ziel / "untertitel.srt")
    sekunde = f'{p["titelbild"]["sekunde"]:.1f}'.replace(".", ",")  # deutsche Schreibweise
    (ziel / "LIESMICH.txt").write_text("\n".join(p["liesmich"]).replace("{sekunde}", sekunde) + "\n",
                                       encoding="utf-8")
    print(ziel)


if __name__ == "__main__":
    main(sys.argv[1])
