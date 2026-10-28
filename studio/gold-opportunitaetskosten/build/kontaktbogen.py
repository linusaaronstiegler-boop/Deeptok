"""Abnahme-Bilder aus dem fertigen Render: Kontaktbogen, Gegenüberstellung alt/neu, Poster.

    python build/kontaktbogen.py            (im Ordner studio/gold-opportunitaetskosten)

Schreibt:
    belege/kontaktbogen.jpg   ein Bild je Beat, beschriftet mit Zeit, Beat und Szene (< 300 KB)
    belege/alt-neu.jpg        drei vergleichbare Beats, oben die alte Probe, unten gold.mp4 (< 300 KB)
    belege/poster.jpg         Vorschaubild: die Frage mit Held und Antwort-Schildern (< 150 KB)

Warum die Zeiten aus assets/timing.json kommen: Jeder Beat ist als "Cue + Versatz" festgelegt,
nicht als feste Sekunde. Kommt am 1.11. die Casting-Stimme, wandern alle Wortzeiten; das Bild
"Stempel 0 € am Schild" liegt dann nicht mehr bei 33,2 s, aber immer 0,55 s nach "Cent".
So bleibt der Kontaktbogen nach dem Stimmtausch richtig, ohne dass man Zeiten von Hand sucht.

Braucht ffmpeg und ImageMagick 6 (convert, montage). Nur die Standardbibliothek von Python.
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

HIER = Path(__file__).resolve().parent.parent          # studio/gold-opportunitaetskosten
GOLD = HIER / "renders" / "gold.mp4"
ALT = HIER.parent / "probe-opportunitaetskosten" / "renders" / "deeptok-probe-opportunitaetskosten.mp4"
BELEGE = HIER / "belege"
TIMING = json.loads((HIER / "assets" / "timing.json").read_text(encoding="utf-8"))
CUES = {name: c["start"] for name, c in TIMING["cues"].items()}
DENKPAUSE = next(p for p in TIMING["pausen"] if p["art"] == "denkpause")

# Farben aus CLAUDE.md "Stil"; Inter, wenn installiert, sonst nimmt ImageMagick seine Standardschrift.
NAVY, GOLDTON, CREME = "#0E1726", "#C9A84C", "#F5F0E8"
INTER = Path("/usr/share/fonts/opentype/inter")
FETT = str(INTER / "Inter-SemiBold.otf") if INTER.exists() else "DejaVu-Sans-Bold"
NORMAL = str(INTER / "Inter-Regular.otf") if INTER.exists() else "DejaVu-Sans"



def stimme_text() -> str:
    """Wer spricht: v2 mischt Jonas (ElevenLabs) und Piper je Block (Kontingent erschöpft)."""
    quellen = TIMING.get("quellen_je_block")
    if not quellen:
        return TIMING.get("anbieter", "?") + (" (Platzhalter)" if TIMING.get("platzhalter") else "")
    jonas = [str(q["block"]) for q in quellen if q["quelle"] != "piper"]
    piper = [str(q["block"]) for q in quellen if q["quelle"] == "piper"]
    text = f"Jonas (ElevenLabs) in Block {', '.join(jonas)}"
    text += f", Piper in Block {', '.join(piper)}" if piper else ""
    # Fassung v2.1: Tor aus voice.py. Eine Mischung zweier Stimmen ist nicht zur Bewertung freigegeben.
    if not TIMING.get("bewertbar", {}).get("ok", True):
        text += " · NICHT BEWERTBAR (Stimmen gemischt)"
    return text

def denkpause_mitte():
    return (DENKPAUSE["start"] + DENKPAUSE["end"]) / 2


# Beat (Drehbuch-Nummer), Szene aus index.html, Zeitpunkt. Der Versatz nach dem Cue ist so gewählt,
# dass das Bild des Beats fertig steht (Stempel gelandet, Etikett gesetzt, Fahrt zu Ende).
BEATS = [
    # Fassung v2.1: der Foto-Moment (echte Spielszene als Abzug), bevor sie zum Darsteller wird
    ("1 Foto (Abzug)", "hook", lambda: CUES["lewa"] + 0.5),
    ("1 Frage", "hook", lambda: CUES["optionen"] + 0.3),
    ("2 Denkpause", "hook", denkpause_mitte),
    ("3 Naheliegend", "naheliegend", lambda: CUES["tore"] + 0.7),
    ("4 Gegenbefund: Vertrag", "vertrag", lambda: CUES["nichts"] + 0.3),
    ("5 Gegenbefund: Angebot", "angebot", lambda: CUES["zahl"] + 1.6),
    ("6a Widerlegung", "widerlegung", lambda: CUES["cent"] + 0.55),
    ("6b Widerlegung: Schluss", "entgangen", lambda: CUES["korrektur"] + 0.75),
    ("7 Begriff", "begriff", lambda: CUES["aufgibt"] + 0.25),
    ("8a Auflösung: nimmt", "verkauf", lambda: CUES["genommen"] + 0.35),
    ("8b Auflösung: Drehung", "aufloesung", lambda: CUES["ok_saison"] + 0.2),
    ("9 Modell (Schnitt)", "modell", lambda: CUES["modell"] + 0.5),
    ("10 Transfer", "transfer", lambda: CUES["lohn_da"] + 0.9),
    ("11 Transfer: Kosten", "transfer_lohn", lambda: CUES["lohn"] + 1.0),
    ("12 Satz", "satz", lambda: CUES["rechnung"] + 0.35),
]

# Alt gegen neu: Die alte Probe ändert sich nicht mehr, ihre Zeiten stehen fest (Sekunden).
PAARE = [
    ("Frage vor der Auflösung", 13.5, denkpause_mitte),
    ("Irrtum widerlegt", 43.5, lambda: CUES["korrektur"] + 0.75),
    ("Schluss-Satz", 51.5, lambda: CUES["rechnung"] + 0.35),
]


def lauf(*befehl):
    subprocess.run([str(b) for b in befehl], check=True)


def bild(video, t, ziel):
    # -ss VOR -i springt schnell zum Schlüsselbild und dekodiert dann bildgenau bis t.
    lauf("ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", video, "-frames:v", "1", ziel)


def kachel(quelle, ziel, breite, zeile1, zeile2):
    # Bild verkleinern, darunter ein Navy-Streifen mit zwei Zeilen: Beat in Creme, Zeit in Gold.
    lauf("convert", quelle, "-resize", f"{breite}x", "-background", NAVY, "-gravity", "south",
         "-splice", "0x64",
         "-font", FETT, "-pointsize", "21", "-fill", CREME, "-gravity", "southwest",
         "-annotate", "+10+34", zeile1,
         "-font", NORMAL, "-pointsize", "18", "-fill", GOLDTON, "-gravity", "southwest",
         "-annotate", "+10+10", zeile2, ziel)


def kopf(ziel, breite, titel, unterzeile):
    lauf("convert", "-size", f"{breite}x88", f"xc:{NAVY}",
         "-font", FETT, "-pointsize", "29", "-fill", CREME, "-gravity", "northwest",
         "-annotate", "+18+12", titel,
         "-font", NORMAL, "-pointsize", "19", "-fill", GOLDTON, "-gravity", "northwest",
         "-annotate", "+18+54", unterzeile, ziel)


def als_jpeg(quellen, ziel, grenze_kb, qualitaet=82):
    # Untereinander setzen und als JPEG speichern. Ist die Datei zu groß, sinkt die Qualität in
    # Schritten von 4, bis sie unter die Grenze passt (dunkle Karten mit Rauschen sind teuer).
    while True:
        lauf("convert", *quellen, "-append", "-strip", "-interlace", "JPEG",
             "-sampling-factor", "4:2:0", "-quality", str(qualitaet), ziel)
        kb = ziel.stat().st_size / 1000
        if kb < grenze_kb or qualitaet <= 60:
            print(f"{ziel.relative_to(HIER)}: {kb:.0f} KB (Qualität {qualitaet})")
            return kb < grenze_kb
        qualitaet -= 4


def sekunden(t):
    return f"{t:.1f}".replace(".", ",") + " s"


def main():
    if not GOLD.exists():
        sys.exit(f"Render fehlt: {GOLD} (erst npx hyperframes render ... -o renders/gold.mp4)")
    BELEGE.mkdir(exist_ok=True)
    dauer = TIMING["duration"]
    ok = True
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)

        # 1. Kontaktbogen: 15 Kacheln in zwei Reihen zu acht
        kacheln = []
        for i, (beat, szene, zeit) in enumerate(BEATS, 1):
            t = zeit()
            bild(GOLD, t, tmp / f"k{i:02d}.png")
            kachel(tmp / f"k{i:02d}.png", tmp / f"t{i:02d}.png", 288, beat, f"{sekunden(t)} · {szene}")
            kacheln.append(tmp / f"t{i:02d}.png")
        lauf("montage", *kacheln, "-tile", "8x", "-geometry", "+6+6", "-background", NAVY, tmp / "raster.png")
        breite = int(subprocess.run(["identify", "-format", "%w", tmp / "raster.png"],
                                    capture_output=True, text=True, check=True).stdout)
        kopf(tmp / "kopf.png", breite,
             "Kontaktbogen · Goldstandard „Was kostet es, Lewandowski zu behalten?“",
             f"renders/gold.mp4 · {sekunden(dauer)} · ein Bild je Beat (Drehbuch-Nummern) · "
             f"Stimme: {stimme_text()}")
        ok &= als_jpeg([tmp / "kopf.png", tmp / "raster.png"], BELEGE / "kontaktbogen.jpg", 300)

        # 2. Alt (obere Reihe) gegen neu (untere Reihe)
        if ALT.exists():
            oben, unten = [], []
            for j, (titel, t_alt, zeit) in enumerate(PAARE, 1):
                t_neu = zeit()
                bild(ALT, t_alt, tmp / f"a{j}.png")
                bild(GOLD, t_neu, tmp / f"n{j}.png")
                kachel(tmp / f"a{j}.png", tmp / f"ka{j}.png", 360, f"alt · {titel}",
                       f"{sekunden(t_alt)} · Probe 26.10.2026")
                kachel(tmp / f"n{j}.png", tmp / f"kn{j}.png", 360, f"neu · {titel}",
                       f"{sekunden(t_neu)} · gold.mp4")
                oben.append(tmp / f"ka{j}.png")
                unten.append(tmp / f"kn{j}.png")
            lauf("montage", *oben, *unten, "-tile", "3x", "-geometry", "+8+8", "-background", NAVY,
                 tmp / "vergleich.png")
            breite = int(subprocess.run(["identify", "-format", "%w", tmp / "vergleich.png"],
                                        capture_output=True, text=True, check=True).stdout)
            kopf(tmp / "kopf2.png", breite, "Alt (oben) gegen neu (unten): drei vergleichbare Beats",
                 f"alt: probe-opportunitaetskosten, 52,6 s · neu: gold-opportunitaetskosten, {sekunden(dauer)}")
            ok &= als_jpeg([tmp / "kopf2.png", tmp / "vergleich.png"], BELEGE / "alt-neu.jpg", 300)
        else:
            print(f"Alte Probe fehlt ({ALT.name}), alt-neu.jpg übersprungen")

        # 3. Poster: die Frage in der Denkpause. Es zeigt Held, Frage und Antwort-Schilder, aber nicht
        # die Auflösung; ein Bild aus der zweiten Hälfte würde den Begriff vorwegnehmen.
        bild(GOLD, denkpause_mitte(), tmp / "poster.png")
        ok &= als_jpeg([tmp / "poster.png"], BELEGE / "poster.jpg", 150, qualitaet=80)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
