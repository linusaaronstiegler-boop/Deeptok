"""Echtes Foto statt Tipp-Kick-Figur: Lewandowski im Bundesligaspiel (Fassung v2, überarbeitet v2.1).

    /home/user/Deeptok/.venv/bin/python build/foto.py      (aus studio/gold-opportunitaetskosten/)

EIN Foto, zwei Auftritte (Fassung v2.1, Kritik 28.10.: „aus der Live-Situation wird ein kleiner
grauer Freisteller“, Linus: „echte Bilder von Live-Situationen“, „nicht alles so goldmäßig“):
  A. ABZUG im Hook: die Spielszene selbst, in Farbe (eigener Ton statt Navy-Duoton), mit Ball,
     Rasen und Publikum. Er liegt groß auf der Karte, bis Lewandowski genannt ist.
  B. DARSTELLER im Atlas: derselbe Spieler freigestellt, MIT Ball, im Duoton. Der Hook verwandelt A
     in B („Foto wird Darsteller“): Der Hintergrund des Abzugs blendet aus, die Figur steigt auf
     die Karte nach München und verliert dabei die Farbe.

Schritte (jeder Zwischenstand liegt im gitignorten build/cache/fotos/):
  1. Abruf von Wikimedia Commons über factory/werk/bilder.py (Lizenzprüfung, beschreibender
     User-Agent, langsam, bei 429 warten). Geladen ist die Vorschau (960 x 1440), nicht das
     3,9-MB-Original: Commons hat das Original am 28.10. fünfmal mit 429 abgelehnt.
  2. Freistellen mit `npx hyperframes remove-background` (Modell u2net_human_seg, lokal). Das
     Modell erkennt nur Menschen; den Ball stellt ball_maske() frei (Ellipse, alles außer Rasen).
  3. Aufräumen: Das Modell hatte das halbe Gesicht des Linienrichters unter Lewandowskis Hand
     mitgenommen. Ein Polygon radiert es weg; danach bleibt nur die größte Fläche (plus Ball).
  4. Farbton des Abzugs (farbton): Sättigung 70 %, Schatten Richtung Navy #0E1726, so passt die
     Szene in die Nacht-Karte und bleibt doch ein Farbfoto. Der Hintergrund (Publikum, Bande) wird
     weichgezeichnet und abgedunkelt: Tiefe, und Zuschauer sind nicht mehr erkennbar.
     Abweichung von DESIGN.md §4 („Sättigung 0“), bewusst: Linus' Wunsch vom 28.10.
  5. Duoton für den Darsteller (DESIGN.md §4): Helligkeit -> Navy (Schatten) bis Creme (Lichter),
     kornfrei, Licht- und Schattenkante wie bei den anderen Darstellern. Dazu eine DUNKLE Fassung
     (Kritik: mit 35 % Deckkraft wurde das Foto durchsichtig, Grenzlinien liefen durchs Gesicht).
  6. Umriss: Der Rand des Spielers (ohne Ball) als SVG-Pfad (Randverfolgung + Douglas-Peucker).
     Daraus baut bauen.mjs den GEIST des Spielers, der nach dem Abgang auf der Kosten-Schale bleibt.
  7. credits.json neben dem Video: Urheber, Lizenz, Link, Datum, Bearbeitung, die DFL-Auflage des
     Fotografen und die Lizenz des ganzen Videos (CC BY-SA 4.0, ShareAlike).

Camp Nou (Fassung v2) ist entfernt: Am Handy war der Schriftzug „MÉS QUE UN CLUB“ nicht lesbar,
der Inhalt kam nur über das Etikett „FC Barcelona“ (zwei Kritiken, 28.10.).

Ausgabe: assets/fotos/lewandowski*.{png,jpg,webp}, build/foto-lewandowski.json, credits.json
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HIER = Path(__file__).resolve().parent
PROJEKT = HIER.parent
REPO = PROJEKT.parents[1]
CACHE = HIER / "cache" / "fotos"
FOTOS = PROJEKT / "assets" / "fotos"
sys.path.insert(0, str(REPO / "factory"))

TITEL = ("File:2019-03-09 Fußball, Männer, 1. Bundesliga, FC Bayern München - VfL Wolfsburg "
         "StP 2672 by Stepro.jpg")
HOEHE = 380            # angezeigte Höhe des Darstellers in Bildpixeln (Darsteller >= 288 px, §2)
AUFLOESUNG = 1.3       # Dateien etwas größer als angezeigt: Nachfahrten vergrößern bis 1,12-fach
NAVY = np.array([14, 23, 38], float)
CREME = np.array([245, 240, 232], float)
# Polygon um das Gesicht des Linienrichters, in Pixeln relativ zur oberen linken Ecke der
# freigestellten Person (Rahmen der Alpha-Maske > 40). Rechts endet es vor der Trikotkante.
RADIER = [(0, 330), (55, 321), (86, 327), (91, 345), (93, 455), (0, 455)]
# Ball in der Vorschau (960 x 1440), am Prüfbild abgelesen: Mitte und Halbachsen in Pixeln
BALL = (142.5, 1209.0, 69.0, 66.0)
# Ausschnitt des Abzugs aus der Vorschau: Kopf bis Ball und Schuhe, links etwas Publikum, rechts
# die rote Treppe. Seitenverhältnis 0,78 (hochkant wie ein Abzug).
ABZUG = (20, 120, 940, 1300)
# Angezeigte Bildpixel je Vorschau-Pixel: Abzug 523 x 671 px. Größer geht nicht sauber: Oben steht
# die Schlagzeile (Zeilenrahmen bis y 468), unten beginnt die Credit-Ecke (y 1178). Mit 598 x 811 (erster Versuch)
# lagen die Credit-Zeilen über dem Ball.
ABZUG_SKALA = 0.569
# Linke Hand an der Hüfte in der Vorschau: Dort beginnen die Schnüre der Preisschilder
HAND = (583.0, 755.0)


def treffer_laden() -> dict:
    """Metadaten (Urheber, Lizenz, Link) einmal von der API, dann aus dem Cache."""
    meta = CACHE / "lewandowski-treffer.json"
    if not meta.exists():
        from dataclasses import asdict
        from werk import bilder
        meta.write_text(json.dumps(asdict(bilder.hole_datei(TITEL, vorschau_breite=640)),
                                   ensure_ascii=False, indent=1))
    return json.loads(meta.read_text())


def vorschau(treffer: dict) -> Path:
    ziel = CACHE / "lewandowski-vorschau.jpg"
    if not ziel.exists():
        from werk import bilder
        bilder.lade(bilder.Treffer(**treffer), ziel, vorschau=True)
    return ziel


def freistellen(quelle: Path) -> Path:
    ziel = CACHE / "lewandowski-frei.png"
    if not ziel.exists():
        subprocess.run(["npx", "hyperframes", "remove-background", str(quelle), "-o", str(ziel)],
                       check=True, cwd=PROJEKT)
    return ziel


def person_maske(frei: Path) -> np.ndarray:
    """Alpha der Person in voller Vorschau-Größe (0-255), aufgeräumt (siehe Schritt 3)."""
    from scipy import ndimage
    bild = Image.open(frei).convert("RGBA")
    alpha = np.array(bild.split()[3], float)
    x0, y0 = Image.fromarray((alpha > 40).astype(np.uint8) * 255).getbbox()[:2]
    maske = Image.new("L", bild.size, 255)
    ImageDraw.Draw(maske).polygon([(x0 + x, y0 + y) for x, y in RADIER], fill=0)
    alpha *= np.array(maske.filter(ImageFilter.GaussianBlur(1.5)), float) / 255
    # Nur die größte zusammenhängende Fläche bleibt (keine Inseln aus dem Hintergrund)
    flaechen, n = ndimage.label(alpha > 40)
    groesse = ndimage.sum(np.ones_like(alpha), flaechen, range(1, n + 1))
    haupt = ndimage.binary_dilation(flaechen == 1 + int(np.argmax(groesse)), iterations=3)
    alpha = alpha * haupt
    # Rand 1 px nach innen: Dort hing noch Farbe des Hintergrunds (hellblaues Hemd)
    return np.array(Image.fromarray(alpha.astype(np.uint8)).filter(ImageFilter.MinFilter(3)), float)


def ball_maske(rgb: np.ndarray) -> np.ndarray:
    """Der Ball (0-255): innerhalb der Ellipse BALL alles, was kein Rasen ist.

    Rasen ist deutlich grüner als rot und blau (g - max(r, b) > 18). Löcher (dunkle Flecken des
    Balls, die zufällig grünlich sind) füllt binary_fill_holes; der Rand wird 1 px weich.
    """
    from scipy import ndimage
    cx, cy, rx, ry = BALL
    hh, ww = rgb.shape[:2]
    yy, xx = np.mgrid[0:hh, 0:ww]
    in_ellipse = ((xx - cx) / (rx + 3)) ** 2 + ((yy - cy) / (ry + 3)) ** 2 <= 1
    gruen = (rgb[..., 1] - np.maximum(rgb[..., 0], rgb[..., 2])) > 18
    ball = ndimage.binary_fill_holes(in_ellipse & ~gruen)
    ball = ndimage.binary_opening(ball, iterations=2)
    flaechen, n = ndimage.label(ball)
    if n > 1:
        groesse = ndimage.sum(np.ones_like(ball), flaechen, range(1, n + 1))
        ball = flaechen == 1 + int(np.argmax(groesse))
    weich = Image.fromarray(ball.astype(np.uint8) * 255).filter(ImageFilter.GaussianBlur(0.8))
    return np.array(weich, float)


def farbton(rgb: np.ndarray) -> np.ndarray:
    """Eigener Ton für die Spielszene: Sättigung 70 %, Schatten zum Navy der Karte hin, leicht
    mehr Kontrast. Kein CSS-Filter: gebacken, damit Render und Player dasselbe zeigen."""
    x = rgb / 255.0
    luma = x @ np.array([0.299, 0.587, 0.114])
    x = luma[..., None] + 0.70 * (x - luma[..., None])
    f = (1 - luma) ** 1.6 * 0.5
    x = x * (1 - f[..., None]) + (NAVY / 255)[None, None, :] * f[..., None]
    x = np.clip((x - 0.5) * 1.08 + 0.5, 0, 1)
    return x * 255


def duoton_mit_licht(rgba: Image.Image, dunkel: bool = False) -> Image.Image:
    """Helligkeit auf die Rampe Navy -> Creme, dann Lichtkante oben links, Schatten rechts unten.

    dunkel=True: dieselbe Figur, wie sie mit 35 % Deckkraft über Navy aussähe, aber DECKEND
    (Fassung v2.1: Abdunkeln über Deckkraft machte das Foto durchsichtig)."""
    rgb = np.array(rgba.convert("RGB"), float)
    alpha = np.array(rgba.split()[3], float) / 255
    hell = rgb @ np.array([0.299, 0.587, 0.114]) / 255
    # Kontrast nur über die Figur strecken (1 % oben und unten abschneiden), Mitten leicht heben:
    # Das rote Trikot würde sonst fast so dunkel wie der Grund.
    innen = hell[alpha > 0.5]
    lo, hi = np.percentile(innen, 1), np.percentile(innen, 99)
    t = np.clip((hell - lo) / (hi - lo), 0, 1) ** 0.8
    t = 0.10 + 0.90 * t            # das Dunkelste bleibt einen Hauch heller als der Navy-Grund
    farbe = NAVY[None, None, :] * (1 - t[..., None]) + CREME[None, None, :] * t[..., None]

    def versetzt(a, dx, dy):
        out = np.zeros_like(a)
        hh, ww = a.shape
        out[max(dy, 0):hh + min(dy, 0), max(dx, 0):ww + min(dx, 0)] = \
            a[max(-dy, 0):hh - max(dy, 0), max(-dx, 0):ww - max(dx, 0)]
        return out
    # Lichtkante: Pixel der Figur, deren Nachbar oben links schon Grund ist
    kante = np.clip(alpha - versetzt(alpha, 4, 4), 0, 1)
    kante = np.array(Image.fromarray((kante * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)), float) / 255
    schatten = np.clip(alpha - versetzt(alpha, -6, -6), 0, 1)
    schatten = np.array(Image.fromarray((schatten * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.5)), float) / 255
    farbe = farbe * (1 - 0.75 * kante[..., None]) + CREME * 0.75 * kante[..., None]
    farbe = farbe * (1 - 0.45 * schatten[..., None]) + NAVY * 0.45 * schatten[..., None]
    if dunkel:
        # 35 % über Navy: wie vorher die Deckkraft, nur ohne durchscheinende Karte
        farbe = NAVY + 0.35 * (farbe - NAVY)
    rgba_out = np.dstack([np.clip(farbe, 0, 255), alpha * 255]).astype(np.uint8)
    return Image.fromarray(rgba_out, "RGBA")


def randverfolgung(maske: np.ndarray) -> list[tuple[int, int]]:
    """Äußerer Rand einer Fläche (Moore-Nachbarschaft, im Uhrzeigersinn), als Pixelfolge."""
    hh, ww = maske.shape
    m = np.zeros((hh + 2, ww + 2), bool)
    m[1:-1, 1:-1] = maske
    ys, xs = np.nonzero(m)
    start = (ys[0], xs[0])                       # oberstes, dann linkestes Pixel
    nachbarn = [(-1, 0), (-1, 1), (0, 1), (1, 1), (1, 0), (1, -1), (0, -1), (-1, -1)]
    # Nachbarn im Uhrzeigersinn ab "oben". Nach jedem Schritt in Richtung d beginnt die Suche
    # zwei Stellen gegen den Uhrzeigersinn (d - 2): So läuft man außen am Rand entlang.
    punkte, p, richtung = [start], start, 2      # Start: oberstes Pixel, "nach rechts" unterwegs
    for _ in range(4 * m.size):
        for k in range(8):
            d = (richtung + 6 + k) % 8
            q = (p[0] + nachbarn[d][0], p[1] + nachbarn[d][1])
            if m[q]:
                p, richtung = q, d
                break
        if p == start:
            break
        punkte.append(p)
    return [(x - 1, y - 1) for y, x in punkte]


def vereinfache(punkte: list[tuple[float, float]], eps: float) -> list[tuple[float, float]]:
    """Douglas-Peucker: lässt Punkte weg, die weniger als eps von der Sehne abweichen."""
    if len(punkte) < 3:
        return punkte
    a, b = np.array(punkte[0], float), np.array(punkte[-1], float)
    p = np.array(punkte, float)
    sehne = b - a
    laenge = np.hypot(*sehne) or 1.0
    abstand = np.abs(sehne[0] * (p[:, 1] - a[1]) - sehne[1] * (p[:, 0] - a[0])) / laenge
    i = int(np.argmax(abstand))
    if abstand[i] <= eps:
        return [punkte[0], punkte[-1]]
    return vereinfache(punkte[: i + 1], eps)[:-1] + vereinfache(punkte[i:], eps)


def umriss_pfad(alpha_person: np.ndarray, skala: float, breite: float) -> tuple[str, int]:
    """Rand des Spielers (ohne Ball) als SVG-Pfad in Darsteller-Koordinaten (Fuß bei 0, 0)."""
    rand = randverfolgung(alpha_person > 127)
    # Ein Ring hat Anfang = Ende, die Sehne wäre 0 lang. Darum am Punkt teilen, der vom Anfang
    # am weitesten weg ist, beide Hälften vereinfachen, wieder zusammensetzen.
    p = np.array(rand, float)
    weit = int(np.argmax(np.hypot(p[:, 0] - p[0, 0], p[:, 1] - p[0, 1])))
    pfad = vereinfache(rand[: weit + 1], 1.2)[:-1] + vereinfache(rand[weit:] + [rand[0]], 1.2)[:-1]
    xy = [(round(x * skala - breite / 2, 1), round(y * skala - HOEHE, 1)) for x, y in pfad]
    return "M" + " L".join(f"{x} {y}" for x, y in xy) + " Z", len(xy)


def credits(treffer: dict, kasten: list[int]) -> dict:
    """credits.json: alles, was die Lizenz verlangt, plus die Auflagen außerhalb des Urheberrechts.

    Die Zeilen im Bild stehen hier wörtlich (credit_zeilen_im_bild); die HUD-Szenen zeigen genau
    diese Zeilen (bauen.mjs prüft das). Wann das Foto zu sehen ist, trägt build/messen-bild.mjs
    aus der Messung im Player ein (Feld "sichtbar"), nicht von Hand.
    """
    jahr = (treffer.get("datum") or "")[:4]
    kurz = f"commons.wikimedia.org/?curid={treffer['seiten_id']}"
    zeile1 = f"Foto: {treffer['urheber']}, {jahr}, {treffer['lizenz']}, bearb."
    return {
        "_hinweis": ("Fremdquellen dieses Videos mit Urheber, Lizenz, Link und Datum. Erzeugt von "
                     "build/foto.py; 'sichtbar' trägt build/messen-bild.mjs aus der Messung im Player ein."),
        "video": "studio/gold-opportunitaetskosten",
        "lizenz_video": {
            "lizenz": "CC BY-SA 4.0",
            "url": "https://creativecommons.org/licenses/by-sa/4.0",
            "zeile_im_bild": "Video: creativecommons.org/licenses/by-sa/4.0",
            "grund": ("Das Video enthält Bearbeitungen eines CC-BY-SA-4.0-Fotos (Abzug im eigenen Ton, "
                      "Freisteller im Duoton, der Umriss als Geist ab 'eine Saison'). ShareAlike (Abschnitt 3(b)) "
                      "verlangt für Bearbeitungen dieselbe Lizenz. Statt abzuwägen, ob das Video nur eine "
                      "Sammlung ist, steht das ganze Video unter CC BY-SA 4.0: Für ein öffentliches, "
                      "nichtkommerzielles Lernprojekt kostet das nichts und beendet die Unklarheit (Entscheidung 28.10.2026)."),
        },
        "quellen": [{
            "dateien": ["assets/fotos/lewandowski-szene.jpg", "assets/fotos/lewandowski-farbe.webp",
                        "assets/fotos/lewandowski.png", "assets/fotos/lewandowski-dunkel.png"],
            "titel": treffer["titel"],
            "beschreibung": treffer.get("beschreibung"),
            "urheber": treffer["urheber"],
            "lizenz": treffer["lizenz"],
            "lizenz_url": treffer["lizenz_url"],
            "quelle": treffer["seite"],
            "kurzlink": "https://" + kurz,
            "original": treffer["url"],
            "datum_werk": treffer.get("datum"),
            "abgerufen": treffer.get("abgerufen"),
            "credit_zeilen_im_bild": [zeile1, kurz],
            "credit_regel": ("Zeile 1 (Urheber, Jahr, Lizenz, bearb.) steht in JEDER Szene, in der das Foto oder "
                             "sein Umriss zu sehen ist; der Kurzlink (Zeile 2) überall, wo die Credit-Ecke Platz hat "
                             "(DESIGN.md §2: höchstens 3 Zeilen) und kein Etikett der Welt sie kreuzt: im Hook (Abzug), in "
                             "'naheliegend', 'verkauf' und im Abspann (letzte 2,8 s). In 'begriff' und 'aufloesung' stehen "
                             "links unter der Kosten-Schale Etiketten auf denselben Zeilen; dort nur Zeile 1."),
            "bearbeitung": [
                "Vorschaufassung 960 x 1440 statt Original (Commons lehnte das Original am 28.10.2026 fünfmal mit 429 ab)",
                f"Abzug: Ausschnitt {ABZUG} der Vorschau, Sättigung 70 %, Schatten Richtung #0E1726, Hintergrund weichgezeichnet und abgedunkelt",
                "Freisteller: Person (hyperframes remove-background) und Ball (Ellipse ohne Rasen); Gesicht des Linienrichters wegradiert",
                "Darsteller: Duoton #0E1726 -> #F5F0E8 mit Licht- und Schattenkante; dunkle, deckende Fassung zum Zurücktreten",
                "Umriss des Spielers als gestrichelter Gold-Geist (Randverfolgung der Freistell-Maske)",
            ],
            "lizenz_bearbeitung": "CC BY-SA 4.0 (ShareAlike: Bearbeitungen stehen unter derselben Lizenz)",
            "einschraenkungen": treffer.get("einschraenkungen", []),
            "auflagen_ausserhalb_urheberrecht": {
                "persoenlichkeitsrecht": ("Commons markiert das Foto mit 'personality rights' (Vorlage Personality rights). "
                                          "Abgebildet ist eine Person des öffentlichen Lebens in ihrer Rolle als Fußballprofi; "
                                          "genutzt wird es im Lernvideo über seinen tatsächlichen Wechsel, nicht als Werbung "
                                          "oder Empfehlung."),
                "dfl_hinweis_fotograf": {
                    "vorlage": "User:Stepro/DFL (Commons-Vorlage auf der Dateiseite, dazu 'Template:Non-copyright restriction')",
                    "link": "https://commons.wikimedia.org/wiki/User:Stepro/DFL",
                    "wortlaut_auszug": ("„Die Fotos dürfen aufgrund von Marken- und Persönlichkeitsrechten ausschließlich "
                                        "für redaktionelle Publikationszwecke verwendet werden … Gemäß den Vorgaben der "
                                        "DFL … ist es untersagt, … Fotoaufnahmen in Form von Sequenzbildern und/oder "
                                        "videoähnlichen Fotostrecken zu verwerten.“"),
                    "wortlaut_quelle": ("zitiert nach dem Abruf der Kritik am 28.10.2026 (Commons-API, nach mehreren 429). "
                                        "Eigener Abruf am 28.10.2026 abends: 429, aus Rücksicht nicht wiederholt."),
                    "abwaegung": ("Entscheidung 28.10.2026: (1) Genutzt wird EIN Foto, keine Serie: Es gibt keine "
                                  "Sequenzbilder und keine Fotostrecke, die ein Spiel nachstellt. (2) Die Nutzung ist "
                                  "redaktionell-erklärend: ein nichtkommerzielles Lernvideo über den tatsächlichen Wechsel "
                                  "(Quellen in fakten.json), keine Werbung. (3) Das Foto selbst 'spielt' nicht: Es liegt als "
                                  "Abzug still, wird zum Darsteller (Kamerafahrt auf ein Standbild), steigt auf die Schale "
                                  "und geht am Ende mit einem Unschärfe-Austritt, statt wie in Fassung v2 aus dem Bild zu "
                                  "laufen. (4) Wird DeepTok je kommerziell oder ändert sich die Nutzung, dieses Foto gegen "
                                  "eines ohne DFL-Auflage tauschen (Nationalmannschaft, Pressetermin)."),
                },
            },
            "abgebildete_dritte": ("Publikum und Linienrichter im Hintergrund: weichgezeichnet und abgedunkelt, nicht im "
                                   "Mittelpunkt; das Gesicht des Linienrichters ist aus dem Freisteller entfernt."),
            "werbung_im_bild": ("Bande 'BUNDESLIGA' im Hintergrund weichgezeichnet. Sponsor am Ärmel und Hersteller-Logos "
                                "gehören zur Kleidung des Spielers und bleiben (kein Werbeplatz im Bild)."),
            "verwendung": {
                "abzug": "Hook bis 'Bayern', dann Morph zum Darsteller",
                "darsteller": "Atlas-Beats bis 'eine Saison'",
                "umriss": "Geist auf der Kosten-Schale ab 'eine Saison' bis zum Schnitt",
                "pixel_abzug_figur_kasten": kasten,
            },
        }],
    }


def main() -> None:
    CACHE.mkdir(parents=True, exist_ok=True)
    FOTOS.mkdir(parents=True, exist_ok=True)
    treffer = treffer_laden()
    quelle = vorschau(treffer)
    rgb = np.array(Image.open(quelle).convert("RGB"), float)

    person = person_maske(freistellen(quelle))
    ball = ball_maske(rgb)
    alpha = np.maximum(person, ball)
    getont = farbton(rgb)

    # Kasten von Spieler UND Ball (Vorschau-Pixel). Der Fuß des Darstellers ist die Mitte seiner
    # Unterkante; der Ball liegt links davon auf dem Boden, also auf der Schale bzw. Karte.
    bx0, by0, bx1, by1 = Image.fromarray((alpha > 20).astype(np.uint8) * 255).getbbox()

    # --- A. Abzug: Spielszene in Farbe, Hintergrund weich und dunkler ---
    # Weichzeichnen NUR aus dem Hintergrund (normierte Unschärfe: Pixel des Spielers zählen nicht
    # mit). Sonst bleibt um ihn ein heller Saum aus scharfem Original (erster Versuch, 28.10.).
    from scipy import ndimage
    grund = 1.0 - ndimage.binary_dilation(alpha > 20, iterations=4).astype(float)
    def unschaerfe(x: np.ndarray) -> np.ndarray:
        return np.dstack([ndimage.gaussian_filter(x[..., k], 6) for k in range(x.shape[2])]) \
            if x.ndim == 3 else ndimage.gaussian_filter(x, 6)
    weich = unschaerfe(getont * grund[..., None]) / np.maximum(unschaerfe(grund), 1e-3)[..., None] * 0.75
    vorn = alpha[..., None] / 255
    szene = getont * vorn + weich * (1 - vorn)
    x0, y0, x1, y1 = ABZUG
    abzug = Image.fromarray(np.clip(szene, 0, 255).astype(np.uint8)).crop(ABZUG)
    abzug_px = (round((x1 - x0) * ABZUG_SKALA * AUFLOESUNG), round((y1 - y0) * ABZUG_SKALA * AUFLOESUNG))
    abzug.resize(abzug_px, Image.LANCZOS).save(FOTOS / "lewandowski-szene.jpg", quality=86, optimize=True)

    # --- Freisteller in Farbe (für den Morph): dieselben Pixel wie im Abzug, nur ohne Grund ---
    farbig = Image.fromarray(np.dstack([np.clip(getont, 0, 255), alpha]).astype(np.uint8), "RGBA").crop((bx0, by0, bx1, by1))
    farbig_px = (round((bx1 - bx0) * ABZUG_SKALA * AUFLOESUNG), round((by1 - by0) * ABZUG_SKALA * AUFLOESUNG))
    farbig.resize(farbig_px, Image.LANCZOS).save(FOTOS / "lewandowski-farbe.webp", quality=88, method=6)

    # --- B. Darsteller im Duoton (hell und dunkel), gleiche Kiste ---
    h = round(HOEHE * AUFLOESUNG)
    w = round((bx1 - bx0) * h / (by1 - by0))
    roh = Image.fromarray(np.dstack([rgb, alpha]).astype(np.uint8), "RGBA").crop((bx0, by0, bx1, by1)).resize((w, h), Image.LANCZOS)
    duoton_mit_licht(roh).save(FOTOS / "lewandowski.png", optimize=True)
    duoton_mit_licht(roh, dunkel=True).save(FOTOS / "lewandowski-dunkel.png", optimize=True)

    # Maße in Bildpixeln (angezeigt): Fuß der Hülle bei (0, 0), Kiste waagerecht mittig.
    skala_px = HOEHE / (by1 - by0)               # angezeigte Pixel je Vorschau-Pixel
    breite = (bx1 - bx0) * skala_px
    person_kiste = np.array(Image.fromarray(person.astype(np.uint8)).crop((bx0, by0, bx1, by1)), float)
    d, n_punkte = umriss_pfad(person_kiste, skala_px, breite)
    hand = (round((HAND[0] - bx0) * skala_px - breite / 2, 1), round((HAND[1] - by0) * skala_px - HOEHE, 1))
    kasten = [bx0 - x0, by0 - y0, bx1 - x0, by1 - y0]      # Figur im Abzug (Vorschau-Pixel ab Ausschnitt)
    daten = {"bild": "assets/fotos/lewandowski.png", "dunkel": "assets/fotos/lewandowski-dunkel.png",
             "hoehe": HOEHE, "breite": round(breite, 1), "png": [w, h], "umriss": d, "umriss_punkte": n_punkte,
             "hand": hand, "quelle": treffer["titel"],
             "abzug": {"bild": "assets/fotos/lewandowski-szene.jpg", "figur": "assets/fotos/lewandowski-farbe.webp",
                       "ausschnitt": list(ABZUG), "skala": ABZUG_SKALA,
                       "breite": round((x1 - x0) * ABZUG_SKALA, 1), "hoehe": round((y1 - y0) * ABZUG_SKALA, 1),
                       "figur_kasten": kasten}}
    (HIER / "foto-lewandowski.json").write_text(json.dumps(daten, ensure_ascii=False, indent=1) + "\n")
    (PROJEKT / "credits.json").write_text(json.dumps(credits(treffer, kasten), ensure_ascii=False, indent=2) + "\n")
    for f in sorted(FOTOS.iterdir()):
        print(f"{f.relative_to(PROJEKT)}: {Image.open(f).size}, {f.stat().st_size // 1024} KB")
    print(f"Darsteller {breite:.0f} x {HOEHE} px (mit Ball), Umriss {n_punkte} Punkte, Hand {hand}, Figur im Abzug {kasten}")


if __name__ == "__main__":
    main()
