"""Upload-Paket für einen Teil bauen.

Liest `horror/episoden/<folge>/paket.json` und schreibt nach
`horror/build/teilen/paket-<slug>/` (gitignored):

- das Video (Teilen-Fassung mit Musik), sprechend umbenannt
- titelbild.jpg 1080×1920: sauberes Bild aus dem Render ohne Untertitel, darauf Serienname und Teil;
  optional darüber eine kleine Kopfzeile in Akzentfarbe (`titelbild.kopfzeile`, z. B. „RULES OF KINDLY“)
- bildunterschrift.txt: eine Zeile zum Kopieren (TikTok)
- youtube.txt: Titel, Beschreibung, Einstellungen
- instagram.txt: Bildunterschrift und Einstellungen für Instagram Reels (Schlüssel `instagram`;
  steht er in paket.json, ist er Pflicht und wird geprüft)
- untertitel.srt: aus den Satzzeiten (nur YouTube; bei TikTok sind die Untertitel im Bild)
- LIESMICH.txt: wann posten, welche Schalter, welcher Kommentar angeheftet wird

Aufruf:
  python horror/tools/paket/paket.py folge-01
  python horror/tools/paket/paket.py kindly-01 --entwurf

Was es noch nicht gibt, steht in paket.json als "OFFEN" (Video, Titelbild-Bild, Sekunde).
Ohne `--entwurf` bricht das Werkzeug dann ab. Mit `--entwurf` baut es nur Texte und eine
Titelbild-Probe auf neutralem Grund nach `paket-<slug>-entwurf/`, damit nichts Halbfertiges
mit einem fertigen Paket verwechselt wird.
"""
import filecmp
import json
import re
import shutil
import sys
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

WURZEL = Path(__file__).resolve().parents[2]  # .../horror
SCHRIFT = WURZEL / "engine/assets/schriften/ArchivoBlack-Regular.ttf"
AKZENT = "#9FD8D2"  # kaltes Leuchten von Mister Hundred, wie im Untertitel-Akzent
OFFEN = "OFFEN"  # Platzhalter in paket.json für Dinge, die es noch nicht gibt

# Unter dieser Schriftgröße wird ein einzeiliger Titel in zwei Zeilen umbrochen.
# „HIDING NIGHT“ passt einzeilig darüber, bleibt also pixelgleich wie bisher.
MIN_EINZEILIG = 110


def offen(wert) -> bool:
    return wert is None or (isinstance(wert, str) and wert.strip().upper() == OFFEN)


def passende_groesse(zeichne, texte, start, rand=960):
    """Größte Schriftgröße (in 4er-Schritten ab `start`), bei der jede Zeile höchstens `rand` px breit ist."""
    groesse = start
    while True:
        f = ImageFont.truetype(str(SCHRIFT), groesse)
        if max(zeichne.textlength(t, font=f) for t in texte) <= rand or groesse < 40:
            return groesse
        groesse -= 4


def zwei_zeilen(text):
    """Teilt einen Titel an der Wortgrenze, die die längere Zeile am kürzesten macht."""
    woerter = text.split()
    teilungen = [(" ".join(woerter[:i]), " ".join(woerter[i:])) for i in range(1, len(woerter))]
    return list(min(teilungen, key=lambda z: max(len(z[0]), len(z[1]))))


def titelbild(bild, titel: str, teil: str, ziel: Path, kopfzeile: str = "", akzent: str = AKZENT, versatz_y: int = 0) -> None:
    """Sauberes Renderbild + Titel. Text bleibt im mittleren 3:4-Ausschnitt
    (y 240–1680), weil TikTok und Instagram im Profilraster nur diesen Teil zeigen.
    Ist `bild` None (Entwurf), steht der Text auf neutralem Nachtblau."""
    if bild is None:
        # Platzhalter: senkrechter Verlauf, unten deutlich als Entwurf beschriftet (außerhalb des 3:4-Ausschnitts).
        img = Image.new("RGB", (1080, 1920))
        z = ImageDraw.Draw(img)
        for y in range(1920):
            a = y / 1919
            z.line([(0, y), (1079, y)], fill=(int(14 + 20 * a), int(18 + 22 * a), int(38 + 40 * a)))
    else:
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
        return groesse

    def gesperrt(text, groesse, y, farbe, sperrung=0.12):
        # Kopfzeile mit Buchstabenabstand (Sperrung in Bruchteilen der Schriftgröße), wie ein Serien-Etikett.
        f = ImageFont.truetype(str(SCHRIFT), groesse)
        abstand = groesse * sperrung
        breiten = [zeichne.textlength(c, font=f) for c in text]
        gesamt = sum(breiten) + abstand * (len(text) - 1)
        x = (1080 - gesamt) / 2
        for c, b in zip(text, breiten):
            zeichne.text((x, y), c, font=f, fill=farbe, stroke_width=max(4, groesse // 16), stroke_fill=(0, 0, 0))
            x += b + abstand

    titel = titel.upper()
    if not kopfzeile and passende_groesse(zeichne, [titel], 150) >= MIN_EINZEILIG:
        # Bisheriges Layout (Hiding Night), unverändert, damit alte Titelbilder pixelgleich bleiben.
        zeile(titel, 150, 290, "white")
        zeile(teil.upper(), 104, 470, akzent)
    else:
        # versatz_y (paket.json → titelbild.text_versatz_y): Textblock tiefer setzen. Review Kindly F1: im 3:4-Ausschnitt
        # des Profilrasters (y 240–1680) klebte die Kopfzeile bei 262 an der Oberkante.
        y = 290 + versatz_y
        if kopfzeile:
            # Kopfzeile klein über dem Titel: rund halb so groß wie der Titel, in Akzentfarbe.
            k = kopfzeile.upper()
            kg = min(72, passende_groesse(zeichne, [k], 72, rand=900))
            gesperrt(k, kg, 262 + versatz_y, akzent)
            y = 262 + versatz_y + int(kg * 1.55)
        zeilen = [titel]
        if passende_groesse(zeichne, zeilen, 150) < MIN_EINZEILIG and " " in titel:
            zeilen = zwei_zeilen(titel)
        g = passende_groesse(zeichne, zeilen, 150)
        for z in zeilen:
            zeile(z, g, y, "white")
            y += int(g * 1.08)
        if teil:
            zeile(teil.upper(), min(104, int(g * 0.7)), y + 24, akzent)
    if bild is None:
        f = ImageFont.truetype(str(SCHRIFT), 44)
        hinweis = "ENTWURF · BILD OFFEN"
        zeichne.text(((1080 - zeichne.textlength(hinweis, font=f)) / 2, 1760), hinweis, font=f, fill=(150, 150, 170))
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


def pruefe_text(name: str, text: str, min_tags: int = 0, max_tags: int = 5) -> list:
    """Hausregeln für Texte, die öffentlich werden: höchstens 5 Hashtags (TikTok und Instagram
    erlauben nicht mehr), kein Roblox-Bezug (eigener Klötzchen-Stil, keine fremde Marke)."""
    fehler = []
    if not isinstance(text, str) or not text.strip():
        return [f"{name}: fehlt oder ist leer"]
    tags = re.findall(r"#\w+", text)
    if not min_tags <= len(tags) <= max_tags:
        fehler.append(f"{name}: {len(tags)} Hashtags, erlaubt {min_tags}–{max_tags}")
    if re.search(r"roblox|blox", text, re.IGNORECASE):
        fehler.append(f"{name}: enthält „roblox“")
    if len(text) > 2200:
        fehler.append(f"{name}: {len(text)} Zeichen, höchstens 2.200")
    return fehler


def pruefe_instagram(ig) -> list:
    """Der Schlüssel `instagram` ist freiwillig; steht er da, muss er vollständig sein."""
    if not isinstance(ig, dict):
        return ["instagram: muss ein Objekt mit bildunterschrift und einstellungen sein"]
    fehler = pruefe_text("instagram.bildunterschrift", ig.get("bildunterschrift"), min_tags=3)
    if not ig.get("einstellungen") or not all(isinstance(e, str) and e for e in ig["einstellungen"]):
        fehler.append("instagram.einstellungen: Liste mit mindestens einem Eintrag fehlt")
    return fehler


def main(folge: str, entwurf: bool = False) -> None:
    ordner = WURZEL / "episoden" / folge
    p = json.loads((ordner / "paket.json").read_text())
    tb = p["titelbild"]

    # Erst alles prüfen, dann schreiben: Ein halbes Paket soll es nicht geben.
    fehler = pruefe_text("bildunterschrift", p.get("bildunterschrift"))
    fehler += pruefe_text("youtube.titel", p["youtube"].get("titel"), max_tags=0)
    if "instagram" in p:
        fehler += pruefe_instagram(p["instagram"])
    offene = [k for k, w in (("video", p.get("video")), ("titelbild.bild", tb.get("bild")),
                             ("titelbild.sekunde", tb.get("sekunde"))) if offen(w)]
    if offene and not entwurf:
        fehler.append("noch OFFEN: " + ", ".join(offene) + " (Probe ohne Video: --entwurf)")
    if fehler:
        sys.exit("Paket nicht gebaut:\n- " + "\n- ".join(fehler))

    ziel = WURZEL / "build/teilen" / (f"paket-{p['slug']}" + ("-entwurf" if entwurf else ""))
    ziel.mkdir(parents=True, exist_ok=True)

    if not offen(p.get("video")):
        video, kopie = WURZEL / p["video"], ziel / f"{p['slug']}.mp4"
        # Fertige Videos nur kopieren, nie neu schreiben, wenn die Kopie schon gleich ist.
        if not (kopie.exists() and filecmp.cmp(video, kopie, shallow=False)):
            shutil.copyfile(video, kopie)

    rohbild = None if offen(tb.get("bild")) else WURZEL / tb["bild"]
    if rohbild is not None and not rohbild.exists():
        # Einzelbilder werden nach dem Bau gelöscht (Plattenplatz). Ein schon gebautes Titelbild bleibt dann stehen.
        if (ziel / "titelbild.jpg").exists():
            print(f"Hinweis: {tb['bild']} fehlt, vorhandenes titelbild.jpg bleibt unverändert")
        else:
            sys.exit(f"Rohbild fehlt: {tb['bild']} (sauberes Bild aus der Bildspur ohne Untertitel ziehen)")
    else:
        titelbild(rohbild, tb["titel"], tb.get("teil", ""), ziel / "titelbild.jpg",
                  kopfzeile=tb.get("kopfzeile", ""), akzent=tb.get("akzent", AKZENT), versatz_y=tb.get("text_versatz_y", 0))

    (ziel / "bildunterschrift.txt").write_text(p["bildunterschrift"] + "\n", encoding="utf-8")
    yt = p["youtube"]
    (ziel / "youtube.txt").write_text(
        f"TITEL\n{yt['titel']}\n\nBESCHREIBUNG\n{yt['beschreibung']}\n\nEINSTELLUNGEN\n"
        + "\n".join(f"- {e}" for e in yt["einstellungen"]) + "\n", encoding="utf-8")
    if "instagram" in p:
        ig = p["instagram"]
        (ziel / "instagram.txt").write_text(
            f"BILDUNTERSCHRIFT\n{ig['bildunterschrift']}\n\nEINSTELLUNGEN\n"
            + "\n".join(f"- {e}" for e in ig["einstellungen"]) + "\n", encoding="utf-8")

    timing = ordner / p.get("timing", "timing.json")
    if timing.exists():
        srt(timing, ziel / "untertitel.srt")
    elif not entwurf:
        sys.exit(f"Satzzeiten fehlen: {timing}")

    s = tb.get("sekunde")
    sekunde = OFFEN if offen(s) else f"{s:.1f}".replace(".", ",")  # deutsche Schreibweise
    (ziel / "LIESMICH.txt").write_text("\n".join(p["liesmich"]).replace("{sekunde}", sekunde) + "\n",
                                       encoding="utf-8")
    print(ziel)


if __name__ == "__main__":
    argumente = [a for a in sys.argv[1:] if not a.startswith("--")]
    main(argumente[0], entwurf="--entwurf" in sys.argv[1:])
