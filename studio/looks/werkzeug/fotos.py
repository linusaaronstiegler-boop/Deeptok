"""Echte Fotos und einen echten Clip für die Look-Proben holen und behandeln (über factory/werk/bilder.py).

Jede Fremdquelle steht unten in QUELLEN (Commons-Titel, geprüftes Jahr, Personen-Freigabe), jede
Verwendung in FOTOS (Look, Ziel, Ausschnitt, Behandlung). Das Skript
  1. fragt Commons nach Datei, Lizenz, Urheber und Lizenz-Vorlagen (bilder.hole_datei,
     bilder.vorlagen), langsam und mit User-Agent,
  2. lädt die Datei (Fotos als Vorschau mit höchstens 2000 px, das reicht für 1080 × 1920; den
     Clip als Original mit SHA-1-Prüfung) in werkzeug/cache/ (gitignored),
  3. schneidet aus und behandelt (Graustufen, Duoton, Freistellen, Farbe, Clip kürzen) und
     schreibt nach probe-<look>/assets/fotos/,
  4. trägt Urheber, Lizenz, Link, Fotojahr (geprüft oder „ca.“), Objektdatum, Vorlagen und die
     Bearbeitung in probe-<look>/credits.json ein.

    /home/user/Deeptok/.venv/bin/python studio/looks/werkzeug/fotos.py   (braucht Pillow, numpy, ffmpeg)

Der Cache hält auch die Metadaten (cache/<hash>.json). Ein zweiter Lauf fragt Commons dann gar
nicht mehr; so bleibt die Last auf Wikimedia klein.
"""
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

HIER = Path(__file__).resolve().parent
LOOKS = HIER.parent
REPO = LOOKS.parent.parent
sys.path.insert(0, str(REPO / "factory"))

from PIL import Image  # noqa: E402

from werk import bilder  # noqa: E402

CACHE = HIER / "cache"


@dataclass
class Quelle:
    titel: str
    vorschau_breite: int | None = 2000      # None = Original laden (Clip, kleine Dateien)
    jahr: str | None = None                 # geprüftes Fotojahr, schlägt die Commons-Schätzung
    jahr_quelle: str | None = None
    objekt: str | None = None               # Gegenstand mit eigenem Datum (nie als Fotojahr)
    personen_freigabe: str | None = None    # Pflicht bei Commons „personality“
    inhalt: str = ""                        # was das Bild im Video zeigt (Bilder nur mit Inhalt)


QUELLEN = {
    # Camp Nou mit der Sitz-Schrift „Més que un club“ und dem Spielfeld (Lmbuga, 8. April 2014).
    "camp-nou": Quelle(
        "File:2014. Camp Nou. Més que un club. Barcelona B40.jpg", 1920,
        inhalt="Ort: das Stadion des FC Barcelona, der bietet (Schriftzug „Més que un club“)."),
    # Echter Clip, Live-Situation: Camp Nou beim Zuschauer-Weltrekord im Frauenfußball,
    # FC Barcelona – Real Madrid, Frühjahr 2022 (gleiches Jahr wie die Ablöse). Hochformat 480 × 848.
    "fans-2022": Quelle(
        "File:FCB-RMA 2022 Women UCL football match (WR assistance 31 March).mpg", None,
        jahr="2022", jahr_quelle="Commons-Beschreibung: Spiel im Camp Nou, Frühjahr 2022 (Titel 31.03., Datum 30.03.)",
        inhalt="Ort, lebendig: volles Camp Nou 2022 – der Verein, der bietet."),
    # Echte Person in einer echten Spielszene: Lewandowski für den FC Bayern, 9. März 2019.
    "lewandowski": Quelle(
        "File:2019-03-09 Fußball, Männer, 1. Bundesliga, FC Bayern München - VfL Wolfsburg StP 2672 by Stepro.jpg",
        1600,
        personen_freigabe=("Robert Lewandowski, Person des öffentlichen Lebens, in seiner Rolle als "
                           "Fußballprofi während eines Bundesligaspiels; Abbildung im Lernvideo über "
                           "seinen Wechsel, keine Werbung, keine Privatperson im Mittelpunkt."),
        inhalt="Person: Lewandowski im Trikot des FC Bayern, um den es beim Behalten geht."),
    # Gegenstand: Münzstapel (US-Münzen, als Bundeswerk gemeinfrei), auf hellem Grund fotografiert.
    "muenzen": Quelle(
        "File:Stack of coins 0214(cropped).jpg", 1200,
        inhalt="Gegenstand: Geld als Stapel (Sinnbild für die Ablöse; das Etikett nennt den Betrag)."),
    # Archiv: Arc de Triomf in Barcelona, Photochrom; Library of Congress datiert „[ca. 1890-1906]“.
    "arc": Quelle(
        "File:Barcelona. Arco de Triunfo y Palacio de Justicia LCCN2017660387.jpg", 1920,
        jahr="ca. 1890–1906", jahr_quelle="Library of Congress, LCCN 2017660387: „[ca. 1890-1906]“",
        inhalt="Ort: Barcelona (Archivbild; Probe zeigt bewusst ein altes Bild zu einer neuen Zahl)."),
}


@dataclass
class Foto:
    look: str
    quelle: str                      # Schlüssel in QUELLEN
    datei: str                       # Pfad in der Probe, z. B. assets/fotos/camp-nou.jpg
    ausschnitt: tuple[float, float, float, float]   # links, oben, rechts, unten (Anteile 0–1)
    behandlung: str                  # graustufen | duoton | freistellen | farbe | clip-grau
    beschreibung: str                # was die Bearbeitung macht (für credits.json)
    max_kante: int = 1600
    farben: tuple[str, str] | None = None
    gewichte: tuple[float, float, float] | None = None
    clip: tuple[float, float] = (0.0, 4.0)    # Start und Dauer in Sekunden (nur Clips)
    zusatz: dict = field(default_factory=dict)



FOTOS = [
    # Zeitungspapier: zwei echte Stücke, je eines pro Seite: ein Clip (Live-Situation im Stadion)
    # und ein Spielfoto (Graustufen; der Rasterdruck kommt im Video als HyperFrames-Behandlung dazu).
    Foto("zeitungspapier", "fans-2022", "assets/fotos/fans-2022.mp4", (0.0, 0.25, 1.0, 0.72), "clip-grau",
         "6,4 s aus dem Original, Ausschnitt, Graustufen, ohne Ton, H.264; im Video Rasterdruck "
         "Druckschwarz #161514 auf Zeitungspapier #E4DFD1 (HyperFrames „Monochrome Screen Print“)",
         clip=(2.0, 6.4)),
    # Ersatz, falls Commons den Clip gerade nicht hergibt (429): dasselbe Stadion als Foto.
    Foto("zeitungspapier", "camp-nou", "assets/fotos/camp-nou.jpg", (0.22, 0.19, 0.78, 0.96), "graustufen",
         "Ausschnitt ohne Dachbanner (Sitz-Schrift, Spielfeld), Graustufen wie mit Rotfilter; im Video "
         "Rasterdruck Druckschwarz #161514 auf Zeitungspapier #E4DFD1", max_kante=1300, gewichte=(0.85, 0.15, 0.0),
         zusatz={"nur_ohne_clip": True}),
    # Spielfoto als ausgeschnittene Figur (Collage wie bei Simplicissimus): Im Rasterdruck verschwamm
    # der Spieler im roten Rang dahinter; ausgeschnitten bleibt er erkennbar.
    Foto("zeitungspapier", "lewandowski", "assets/fotos/lewandowski.png", (0.08, 0.06, 1.0, 0.92), "freistellen-grau",
         "Ausschnitt, freigestellt (hyperframes remove-background), Graustufen; im Video Rasterdruck", max_kante=1300),
    # Labor: der Münzstapel, freigestellt, in echter Farbe.
    Foto("labor", "muenzen", "assets/fotos/muenzen.webp", (0.0, 0.0, 1.0, 1.0), "freistellen",
         "freigestellt (hyperframes remove-background, Modell auf der CPU), WebP mit Alpha", max_kante=1200),
    # Archiv: Abzüge in warmem Schwarzweiß (Tinte → Papier) für die Akte.
    Foto("archiv-duoton", "arc", "assets/fotos/arc.jpg", (0.025, 0.03, 0.975, 0.97), "duoton",
         "Ausschnitt ohne Karton, Duoton Tinte #1E1B17 → Papier #F3EFE6", max_kante=1300,
         farben=("#1E1B17", "#F3EFE6")),
    Foto("archiv-duoton", "lewandowski", "assets/fotos/lewandowski.jpg", (0.0, 0.05, 1.0, 0.55), "duoton",
         "Ausschnitt, Duoton Tinte #1E1B17 → Papier #F3EFE6", max_kante=1100,
         farben=("#1E1B17", "#F3EFE6")),
    # Flach: das echte Stadion in Farbe; es verwandelt sich im Video in die Illustration (Morph).
    Foto("flach", "camp-nou", "assets/fotos/camp-nou.jpg", (0.10, 0.19, 0.90, 0.96), "farbe",
         "Ausschnitt ohne Dachbanner, sonst unverändert (Farbe)", max_kante=1400),
]


def treffer_mit_cache(q: Quelle) -> tuple[bilder.Treffer, Path, list[str]]:
    """Metadaten, Vorlagen und Datei aus dem Cache, sonst von Commons (langsam, höflich)."""
    CACHE.mkdir(exist_ok=True)
    meta_pfad = CACHE / f"{hashlib.sha1(q.titel.encode()).hexdigest()[:12]}.json"
    daten = json.loads(meta_pfad.read_text(encoding="utf-8")) if meta_pfad.exists() else {}
    if "treffer" in daten:
        treffer = bilder.Treffer(**daten["treffer"])
    else:
        treffer = bilder.hole_datei(q.titel, vorschau_breite=q.vorschau_breite or 1280)
    if "vorlagen" not in daten:
        daten["vorlagen"] = bilder.vorlagen(q.titel)
    # Metadaten sofort sichern: Bricht der Download ab (429), fragt der nächste Lauf die API nicht neu.
    daten["treffer"] = treffer.als_dict()
    meta_pfad.write_text(json.dumps(daten, ensure_ascii=False, indent=1), encoding="utf-8")
    datei = CACHE / daten["datei"] if daten.get("datei") else None
    if datei is None or not datei.exists():
        vorschau = q.vorschau_breite is not None and treffer.breite > q.vorschau_breite
        datei = bilder.lade(treffer, f"{CACHE}/", vorschau=vorschau,
                            personen_freigabe=q.personen_freigabe)
    daten.update({"treffer": treffer.als_dict(), "datei": datei.name})
    meta_pfad.write_text(json.dumps(daten, ensure_ascii=False, indent=1), encoding="utf-8")
    return treffer, datei, daten["vorlagen"]


def ausschneiden(quelle: Path, ausschnitt: tuple[float, float, float, float], ziel: Path) -> Path:
    bild = Image.open(quelle).convert("RGB")
    b, h = bild.size
    l, o, r, u = ausschnitt
    bild.crop((round(l * b), round(o * h), round(r * b), round(u * h))).save(ziel, quality=95)
    return ziel


def freistellen_rand(quelle: Path, max_kante: int) -> Image.Image:
    """Heller Grund weg: Flutfüllung von jedem hellen, unbunten Randpunkt aus (alle 12 px), nicht
    nur von den vier Ecken. So verschwindet auch der weiße Tisch unter den Münzen, der von den
    grauen Ecken aus nicht erreichbar war. Die Kante wird um 1 px weichgezeichnet."""
    import numpy as np
    from PIL import ImageChops, ImageDraw, ImageFilter
    rgb = Image.open(quelle).convert("RGB")
    rgb.thumbnail((max_kante, max_kante), Image.LANCZOS)
    marke = (255, 0, 255)
    feld = rgb.copy()
    b, h = feld.size
    rand = [(x, 0) for x in range(0, b, 12)] + [(x, h - 1) for x in range(0, b, 12)] + \
           [(0, y) for y in range(0, h, 12)] + [(b - 1, y) for y in range(0, h, 12)]
    for punkt in rand:
        r, g, bl = feld.getpixel(punkt)
        if (r, g, bl) != marke and min(r, g, bl) > 170 and max(r, g, bl) - min(r, g, bl) < 30:
            ImageDraw.floodfill(feld, punkt, marke, thresh=40)
    abstand = np.asarray(ImageChops.difference(feld, Image.new("RGB", (b, h), marke)))
    maske = abstand.max(axis=2) > 0
    # Reste des Tisches unter dem Gegenstand (hell, unbunt, im untersten Sechstel) ebenfalls weg.
    farbe = np.asarray(rgb).astype(int)
    tisch = (farbe.min(axis=2) > 175) & (farbe.max(axis=2) - farbe.min(axis=2) < 28)
    tisch[: int(h * 5 / 6)] = False
    maske &= ~tisch
    alpha = Image.fromarray((maske * 255).astype("uint8"))
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1))
    rgba = rgb.copy()
    rgba.putalpha(alpha)
    return rgba


def clip_grau(quelle: Path, foto: Foto, ziel: Path) -> None:
    """Clip kürzen, ausschneiden, Graustufen, ohne Ton, H.264 mit Schlüsselbild alle 6 Bilder
    (HyperFrames springt beim Rendern an beliebige Stellen; kurze Abstände machen das genau)."""
    l, o, r, u = foto.ausschnitt
    start, dauer = foto.clip
    filter_ = (f"crop=iw*{r - l:.3f}:ih*{u - o:.3f}:iw*{l:.3f}:ih*{o:.3f},"
               "format=gray,format=yuv420p,fps=30,scale=trunc(iw/2)*2:trunc(ih/2)*2")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{start}", "-t", f"{dauer}", "-i", str(quelle),
                    "-vf", filter_, "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "24",
                    "-g", "6", "-movflags", "+faststart", str(ziel)], check=True)


def main(nur: list[str]) -> int:
    """nur: Looks (zeitungspapier) oder einzelne Dateien (zeitungspapier/assets/fotos/x.png)."""
    for foto in FOTOS:
        if nur and foto.look not in nur and f"{foto.look}/{foto.datei}" not in nur:
            continue
        q = QUELLEN[foto.quelle]
        probe = LOOKS / f"probe-{foto.look}"
        if foto.zusatz.get("nur_ohne_clip") and (probe / "assets/fotos/fans-2022.mp4").exists():
            continue                                  # der Clip ist da, das Ersatzfoto wird nicht gebraucht
        ziel = probe / foto.datei
        ziel.parent.mkdir(parents=True, exist_ok=True)
        try:
            treffer, roh, vorlagen = treffer_mit_cache(q)
        except bilder.CommonsBesetzt as fehler:
            # Nie drängeln: dieses Stück auslassen, die übrigen machen, später erneut laufen lassen.
            warte = f" (frühestens in {fehler.warte_s:.0f} s)" if fehler.warte_s else ""
            print(f"{foto.look}: {foto.datei} AUSGELASSEN, Commons besetzt{warte}")
            continue
        if foto.behandlung == "clip-grau":
            clip_grau(roh, foto, ziel)
        else:
            zwischen = ausschneiden(roh, foto.ausschnitt, CACHE / f"_ausschnitt-{foto.look}-{foto.quelle}.jpg")
            if foto.behandlung == "graustufen":
                bilder.graustufen(zwischen, ziel, max_kante=foto.max_kante, qualitaet=80,
                                  gewichte=foto.gewichte)
            elif foto.behandlung == "duoton":
                schatten, licht = foto.farben
                bilder.duoton(zwischen, schatten, licht, ziel, max_kante=foto.max_kante, qualitaet=80,
                              gewichte=foto.gewichte)
            elif foto.behandlung == "farbe":
                bild = Image.open(zwischen)
                bild.thumbnail((foto.max_kante, foto.max_kante), Image.LANCZOS)
                bild.save(ziel, "JPEG", quality=80, optimize=True, progressive=True)
            elif foto.behandlung == "freistellen-grau":
                frei = bilder.freistellen(zwischen, CACHE / f"_frei-{foto.look}-{foto.quelle}.png")
                if not frei:
                    raise SystemExit("freistellen-grau braucht hyperframes remove-background oder rembg")
                rgba = Image.open(frei).convert("RGBA")
                rgba = rgba.crop(rgba.getbbox())
                rgba.thumbnail((foto.max_kante, foto.max_kante), Image.LANCZOS)
                from PIL import ImageOps
                grau = ImageOps.autocontrast(ImageOps.grayscale(rgba.convert("RGB")), cutoff=1)
                ergebnis = Image.merge("RGBA", (grau, grau, grau, rgba.getchannel("A")))
                ergebnis.save(ziel, optimize=True)
            elif foto.behandlung == "freistellen":
                # Ohne Modell (heller Grund); rembg wäre genauer, ist aber optional.
                # Erst das Modell (hyperframes remove-background über bilder.freistellen); nur ohne
                # Modell die Flutfüllung vom Rand (gut für Sammlungsfotos auf glattem Weiß).
                frei = bilder.freistellen(zwischen, CACHE / f"_frei-{foto.look}-{foto.quelle}.png")
                if frei:
                    rgba = Image.open(frei).convert("RGBA")
                    rgba.thumbnail((foto.max_kante, foto.max_kante), Image.LANCZOS)
                else:
                    rgba = freistellen_rand(zwischen, foto.max_kante)
                rgba = rgba.crop(rgba.getbbox())             # durchsichtigen Rand abschneiden
                rgba.save(ziel, "WEBP", quality=86, method=6)
            else:
                raise SystemExit(f"Unbekannte Behandlung {foto.behandlung}")
        eintrag = bilder.credits_eintrag(
            treffer, foto.datei, bearbeitung=foto.beschreibung, jahr=q.jahr, jahr_quelle=q.jahr_quelle,
            objekt=q.objekt, personen_freigabe=q.personen_freigabe, lizenz_vorlagen=vorlagen)
        eintrag["inhalt"] = q.inhalt
        bilder.schreibe_credits(probe / "credits.json", eintrag, video=f"probe-{foto.look}")
        print(f"{foto.look}: {ziel.relative_to(REPO)} ({ziel.stat().st_size // 1024} KB)")
        print("   ", " | ".join(bilder.credit_zeilen(treffer, bearbeitet=True, jahr=q.jahr, objekt=q.objekt)),
              "| Vorlagen:", ", ".join(v for v in vorlagen if v.lower().startswith(("pd", "cc", "loc", "flickr", "licen", "self", "no "))))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
