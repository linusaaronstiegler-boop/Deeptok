"""Gemeinsame Bausteine der Look-Proben (Wortzeiten, Marker, Messen, Projektrahmen, Credits).

Die Proben selbst stehen je Look in looks_<look>.py; proben.py ruft sie auf.

Die sechs Look-Proben (studio/looks/<look>.md) dauern je 12 s, stumm, 1080 × 1920.

Jede Probe hat zwei Beats:
  Beat 1 (0 bis ≈ 5,7 s) zeigt in allen Looks denselben Inhalt, „Barcelona bietet 45 Millionen
          Euro“ (Ort, Zahl, ein Held, ein Marker); daraus kommt die Vergleichstafel.
  Beat 2 (≈ 5,7 bis 12 s) geht weiter, „Behält Bayern ihn bis Juni 2023, gibt es danach 0 €“,
          und zeigt, wie sich der Look anfühlt: sein typischer Übergang (Fahrt, Schnitt auf eine
          neue Seite, Kamerafahrt auf der Schiene, Stapel, Morph, Klappen), sein Takt und wo er
          den Helden hinstellt.
Die Wortzeiten (CUE) gehören zu einer gedachten Stimme und sind für alle Looks gleich; nur Flach
zeigt vor dem ersten Wort 1,4 s das echte Foto, das sich dann in die Zeichnung verwandelt.

Je Probe entsteht ein HyperFrames-Projekt studio/looks/probe-<look>/ mit
  index.html               Wurzel: hält nur den Host der Szene „beat“
  compositions/beat.html   die Szene: Welt, Held, Text, Marker, Credits
  assets/                  GSAP (lokal), Schriften (werkzeug/schriften.py), Fotos (werkzeug/fotos.py)

    . /opt/deeptok/env.sh
    /home/user/Deeptok/.venv/bin/python studio/looks/werkzeug/proben.py [look …]   # braucht Pillow

Gemessen wird mit den echten Schriften (werkzeug/messen.mjs): Marker liegen auf der gemessenen
Grundlinie, und keine Zeile ist breiter als das Lesefenster (864 px, studio/DESIGN.md §2).
"""
from __future__ import annotations

import html
import json
import math
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HIER = Path(__file__).resolve().parent
LOOKS = HIER.parent
REPO = LOOKS.parent.parent
GSAP = REPO / "studio" / "gold-opportunitaetskosten" / "assets" / "gsap.min.js"

DAUER = 12.0
# Wortzeiten der gedachten Stimme (s): „Barcelona bietet fünfundvierzig Millionen Euro. Behält
# Bayern ihn bis Juni 2023, gibt es danach null Euro.“ (2,2 Wörter/s wie in DESIGN.md §9)
CUE = {"barcelona": 0.50, "bietet": 1.05, "zahl": 1.50, "millionen": 2.30, "euro": 2.85,
       "behaelt": 6.00, "bayern": 6.35, "juni": 7.10, "jahr": 7.50, "gibt": 8.40, "null": 9.30,
       "euro_b": 9.70}
VOR = 2 / 30          # Eintritt beginnt 2 Bilder vor dem Wort (DESIGN.md §5, gemessen)
NBSP = " "
ZAHL = f"45{NBSP}Mio.{NBSP}€"
NULL = f"0{NBSP}€"
DATUM = "30.06.2023"
FENSTER = (108, 168, 972, 1330)     # Lesefenster x0, y0, x1, y1


def t(cue: str, plus: float = 0.0, cues: dict | None = None) -> float:
    """Startzeit eines Eintritts: Cue minus 2 Bilder (gerundet auf 1/1000 s)."""
    return round((cues or CUE)[cue] - VOR + plus, 3)


def dauer_ab(start: float, ende: float = DAUER) -> float:
    return round(ende - start, 3)


# --- Handzeichnung (Port von lib/marker.js des Goldstandards, gleicher Pseudo-Zufall) -----------

def zufall(n: float, seed: int) -> float:
    x = math.sin(n * 127.1 + (seed or 1) * 311.7) * 43758.5453
    return (x - math.floor(x)) * 2 - 1


def glatt(p: list[tuple[float, float]]) -> str:
    """Punkte → weicher Pfad (quadratische Kurven durch die Mittelpunkte), wie ein Filzstift."""
    d = f"M{p[0][0]:.1f} {p[0][1]:.1f}"
    for i in range(1, len(p) - 1):
        q = p[i + 1]
        d += f" Q{p[i][0]:.1f} {p[i][1]:.1f} {(p[i][0] + q[0]) / 2:.1f} {(p[i][1] + q[1]) / 2:.1f}"
    return d + f" L{p[-1][0]:.1f} {p[-1][1]:.1f}"


def laenge(p) -> float:
    return sum(math.dist(p[i - 1], p[i]) for i in range(1, len(p)))


def kreis(cx, cy, rx, ry, seed, umlauf=1.15, start=-2.2, kipp=-0.12):
    """Handgezeichneter Kreis: 1,15 Umläufe, Radius wächst leicht, gekippt (DESIGN.md §6)."""
    kipp += zufall(3, seed) * 0.05
    pts = []
    for i in range(27):
        f = i / 26
        a = start + f * umlauf * math.tau
        w = (0.94 + f * 0.12) * (1 + zufall(i * 7 + 11, seed) * 0.025)
        x, y = math.cos(a) * rx * w, math.sin(a) * ry * w
        pts.append((cx + x * math.cos(kipp) - y * math.sin(kipp), cy + x * math.sin(kipp) + y * math.cos(kipp)))
    return pts


def unterstrich(x0, y, x1, seed, anstieg=-10, bogen=7):
    return [(x0 + (x1 - x0) * i / 9, y + anstieg * i / 9 + math.sin(i / 9 * math.pi) * bogen
             + zufall(i * 5 + 2, seed) * 1.6) for i in range(10)]


def strich_pfad(pid, punkte, farbe, breite, *, zweite_spur=True, glaetten=True, deckkraft=1.0,
                kappe="round", klasse="strich"):
    """SVG-<path>-Zeilen für einen Marker (Hauptstrich + dünne versetzte Spur, wie trockener Filz)."""
    d = glatt(punkte) if glaetten else "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in punkte)
    lang = laenge(punkte) + 2
    zeilen = [f'<path id="{pid}" class="{klasse}" d="{d}" fill="none" stroke="{farbe}" '
              f'stroke-opacity="{deckkraft}" stroke-width="{breite}" stroke-linecap="{kappe}" '
              f'stroke-linejoin="round" data-laenge="{lang:.1f}" />']
    if zweite_spur:
        zeilen.append(f'<path id="{pid}-spur" class="{klasse}" d="{d}" fill="none" stroke="{farbe}" '
                      f'stroke-opacity="{0.45 * deckkraft:.2f}" stroke-width="{breite * 0.35:.1f}" '
                      f'stroke-linecap="round" transform="translate(1.5 -2)" data-laenge="{lang:.1f}" />')
    return "\n".join(zeilen)


def riss(breite, hoehe, seed, kanten="ou", zacke=9.0, schritt=16):
    """Papierriss als CSS-polygon(): gerissene Kanten oben/unten (o, u) oder links/rechts (l, r)."""
    pts = []
    n = max(2, int(breite / schritt))
    for i in range(n + 1):                                  # oben, links → rechts
        x = breite * i / n
        y = (abs(zufall(i * 3 + 1, seed)) * zacke + 2) if "o" in kanten else 0
        pts.append((x, y))
    m = max(2, int(hoehe / schritt))
    for i in range(1, m):                                   # rechts, oben → unten
        y = hoehe * i / m
        x = breite - ((abs(zufall(i * 5 + 7, seed)) * zacke + 2) if "r" in kanten else 0)
        pts.append((x, y))
    for i in range(n, -1, -1):                              # unten, rechts → links
        x = breite * i / n
        y = hoehe - ((abs(zufall(i * 11 + 3, seed)) * zacke + 2) if "u" in kanten else 0)
        pts.append((x, y))
    for i in range(m - 1, 0, -1):                           # links, unten → oben
        y = hoehe * i / m
        x = (abs(zufall(i * 13 + 5, seed)) * zacke + 2) if "l" in kanten else 0
        pts.append((x, y))
    return "polygon(" + ", ".join(f"{x:.1f}px {y:.1f}px" for x, y in pts) + ")"


# --- Messen ---------------------------------------------------------------------------------

SCHRIFTEN = json.loads((HIER / "schriften.json").read_text(encoding="utf-8"))["looks"]


def schrift_css(look: str) -> str:
    return "\n".join(
        f'@font-face {{ font-family: "{s["familie"]}"; src: url("assets/fonts/{s["datei"]}") '
        f'format("woff2"); font-weight: {s["gewicht"]}; font-style: normal; font-display: block; }}'
        for s in SCHRIFTEN[look]["schriften"])


def messen(look: str, texte: dict[str, tuple[str, str]]) -> dict[str, dict]:
    """texte: {schlüssel: (text, css)} → {schlüssel: {breite, grundlinie, hoehe}} aus Chrome."""
    schriften = [{"familie": s["familie"], "gewicht": s["gewicht"],
                  "datei": str(LOOKS / f"probe-{look}" / "assets" / "fonts" / s["datei"])}
                 for s in SCHRIFTEN[look]["schriften"]]
    auftrag = {"schriften": schriften,
               "texte": [{"schluessel": k, "text": v[0], "css": v[1]} for k, v in texte.items()]}
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        json.dump(auftrag, f)
    r = subprocess.run(["node", str(HIER / "messen.mjs"), f.name], capture_output=True, text=True,
                       timeout=120)
    if r.returncode:
        raise SystemExit(f"messen.mjs: {r.stderr}")
    return json.loads(r.stdout)


def pruefe_breiten(look: str, m: dict, grenze: float = 864) -> None:
    zu_breit = {k: v["breite"] for k, v in m.items() if v["breite"] > grenze}
    if zu_breit:
        raise SystemExit(f"{look}: Zeilen breiter als {grenze} px: {zu_breit}")


def credits_aus(look: str) -> dict[str, dict]:
    """credits.json der Probe (schreibt werkzeug/fotos.py) als {datei: eintrag}."""
    pfad = LOOKS / f"probe-{look}" / "credits.json"
    quellen = json.loads(pfad.read_text(encoding="utf-8"))["quellen"] if pfad.exists() else []
    return {q["datei"]: q for q in quellen}


def kurz(eintrag: dict) -> str:
    return eintrag["kurzlink"].removeprefix("https://")


def bildmass(look: str, datei: str) -> tuple[int, int]:
    from PIL import Image
    with Image.open(LOOKS / f"probe-{look}" / datei) as bild:
        return bild.size


# --- gemeinsamer Rahmen -----------------------------------------------------------------------

JS_ANFANG = """
      const tl = gsap.timeline({ paused: true });
      // Seek-sicher: nur fromTo; ab dem zweiten Tween auf derselben Eigenschaft immediateRender: false.
      const rein = (sel, t, d) => tl.fromTo(sel, { opacity: 0, filter: "blur(8px)" },
        { opacity: 1, filter: "blur(0px)", duration: d || 0.2, ease: "power2.out" }, t);
      // Austritt: 40–50 % der Eintrittsdauer, Unschärfe plus Deckkraft, power2.in (DESIGN.md §5).
      const raus = (sel, t, d) => tl.fromTo(sel, { opacity: 1, filter: "blur(0px)" },
        { opacity: 0, filter: "blur(8px)", duration: d || 0.2, ease: "power2.in", immediateRender: false }, t);
      const hart = (sel, t) => tl.fromTo(sel, { opacity: 0 }, { opacity: 1, duration: 0.001, ease: "none" }, t);
      // Marker zeichnen: Strichmuster L/L+20, Offset L+10 -> 0; bis zum Cue unsichtbar (runde Kappe).
      const zeichne = (sel, t, d, ease) => document.querySelectorAll(sel).forEach((p) => {
        let L = 0;
        try { L = p.getTotalLength(); } catch (e) { L = 0; }
        if (!(L > 0)) L = parseFloat(p.dataset.laenge) || 1000;
        p.setAttribute("stroke-dasharray", L.toFixed(1) + " " + (L + 20).toFixed(1));
        tl.fromTo(p, { opacity: 0 }, { opacity: 1, duration: 0.001, ease: "none" }, t);
        tl.fromTo(p, { strokeDashoffset: L + 10 }, { strokeDashoffset: 0, duration: d, ease: ease || "power1.inOut" }, t);
      });
"""


def schreibe_probe(look: str, titel: str, grund: str, css: str, html_: str, js: str,
                   kommentar: str, dauer: float = DAUER) -> Path:
    probe = LOOKS / f"probe-{look}"
    (probe / "compositions").mkdir(parents=True, exist_ok=True)
    (probe / "assets").mkdir(exist_ok=True)
    # GSAP lokal aus dem Goldstandard (gleiche Version 3.14.2, Prüfsumme bleibt gleich)
    ziel = probe / "assets" / "gsap.min.js"
    if not ziel.exists() or ziel.read_bytes() != GSAP.read_bytes():
        shutil.copyfile(GSAP, ziel)
    index = f"""<!doctype html>
<!--
  Look-Probe „{titel}“ (studio/looks/{look}.md): stummer Test, zwei Beats.
  Beat 1: „Barcelona bietet 45 Millionen Euro“ (gleicher Inhalt in allen Looks).
  Beat 2: „Behält Bayern ihn bis Juni 2023, gibt es danach 0 €“ (Übergang und Takt des Looks).
  Erzeugt von studio/looks/werkzeug/proben.py; nicht von Hand ändern, sondern dort.
-->
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="assets/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: 1080px; height: 1920px; overflow: hidden; background: {grund}; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{dauer}" data-width="1080" data-height="1920">
      <div id="beat" data-composition-id="beat" data-composition-src="compositions/beat.html"
        data-start="0" data-duration="{dauer}" data-track-index="1" data-track-kind="graphics"
        data-width="1080" data-height="1920" style="z-index:1"></div>
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
"""
    beat = f"""<template>
  <!-- {kommentar} -->
  <style>
{schrift_css(look)}
    #root {{ position: absolute; inset: 0; overflow: hidden; background: {grund}; }}
    #root .clip {{ position: absolute; }}
    #root .frei {{ position: absolute; left: 0; top: 0; }}
{css}
  </style>
  <div id="root" data-composition-id="beat" data-width="1080" data-height="1920">
{html_}
  </div>
  <script>
    (function () {{
{JS_ANFANG}
{js}
      tl.to({{}}, {{ duration: {dauer} }}, 0);
      window.__timelines["beat"] = tl;
    }})();
  </script>
</template>
"""
    (probe / "index.html").write_text(index, encoding="utf-8")
    (probe / "compositions" / "beat.html").write_text(beat, encoding="utf-8")
    (probe / "hyperframes.json").write_text(json.dumps({
        "$schema": "https://hyperframes.heygen.com/schema/hyperframes.json",
        "registry": "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry",
        "paths": {"blocks": "compositions", "components": "compositions/components", "assets": "assets"},
        "media": {"autoProxy": True}, "registryItems": []}, indent=2) + "\n", encoding="utf-8")
    (probe / "meta.json").write_text(json.dumps({"id": f"probe-{look}", "name": f"probe-{look}",
                                                 "createdAt": "2026-10-28T19:00:00.000Z"}, indent=2) + "\n",
                                     encoding="utf-8")
    (probe / "package.json").write_text(json.dumps({
        "name": f"probe-{look}", "private": True, "type": "module",
        "scripts": {"check": "npx --yes hyperframes@0.8.206 check",
                    "render": f"npx --yes hyperframes@0.8.206 render --quality looks --workers 3 -o renders/probe-{look}.mp4"}},
        indent=2) + "\n", encoding="utf-8")
    return probe


# Fakten hinter den Zahlen im Bild (studio/gold-opportunitaetskosten/fakten.json, gleiche IDs).
FAKTEN = {
    "abl": {"id": "abl", "claim": "Barcelona zahlt für Lewandowski eine Ablöse von 45 Mio. € fest, dazu 5 Mio. € variabel.",
            "src": "https://www.fcbarcelona.com/en/news/2683853/agreement-with-bayern-munich-for-the-transfer-of-robert-lewandowski",
            "date": "2022-07-19", "quote": "for a total of €45 million + €5 million in variables."},
    "vertrag": {"id": "vertrag", "claim": "Lewandowskis Vertrag beim FC Bayern läuft bis zum 30.06.2023.",
                "src": "https://www.t-online.de/sport/fussball/bundesliga/id_92186698/fc-bayern-muenchen-salihamidzic-bestaetigt-lewandowski-will-bayern-verlassen.html",
                "date": "2022-05-14", "quote": "Lewa hat einen Vertrag bis zum 30. Juni 2023. Das ist Fakt."},
    "frei": {"id": "frei", "claim": "Nach Vertragsende darf ein Fußballprofi ablösefrei wechseln; der alte Verein bekommt dann 0 € Ablöse (Bosman-Urteil des EuGH, 15.12.1995).",
             "src": "https://www.bpb.de/kurz-knapp/lexika/das-europalexikon/176722/bosman-urteil/",
             "date": "2020", "quote": "Danach dürfen Fußballer nach Beendigung ihres Vertrages ablösefrei den Verein wechseln."},
    "frei_urteil": {"id": "frei_urteil", "claim": "Das Bosman-Urteil des EuGH (Rs. C-415/93) fiel am 15.12.1995.",
                    "src": "https://de.wikipedia.org/w/index.php?title=Bosman-Entscheidung&oldid=271664610",
                    "date": "1995-12-15", "quote": "Der EuGH fällte am 15. Dezember 1995 (EuGH RS C-415/93"},
}
# Credit-Zeilen für die Fakten (Gegenstand: Quelle, TT.MM.JJJJ; DESIGN.md §3)
Q_ABL = "Ablöse: FC Barcelona, 19.07.2022"
Q_VERTRAG = "Vertrag: t-online, 14.05.2022"
Q_FREI = "Ablösefrei: EuGH, 15.12.1995"


# Lizenz des ganzen Videos. Enthält eine Probe Bearbeitungen von CC-BY-SA-Werken (Ausschnitt,
# Duoton, Raster, Freisteller), verlangt ShareAlike für diese Bearbeitungen dieselbe Lizenz. Wie
# beim Gold-Video steht dann die ganze Probe unter CC BY-SA 4.0 (studio/gold-opportunitaetskosten/
# credits.json, lizenz_video), und eine Lizenzzeile steht im Bild, dort wo der Look seine Credits
# zeigt. In 34 px ist die Zeile ≈ 990 px lang, breiter als das Lesefenster (864 px): Waagerecht
# steht sie darum in zwei Zeilen, senkrecht (Zeitungspapier) in einer.
LIZENZ_VIDEO = "CC BY-SA 4.0"
LIZENZ_URL = "https://creativecommons.org/licenses/by-sa/4.0"
LIZENZ_ZEILE = "Video: CC BY-SA 4.0 · creativecommons.org/licenses/by-sa/4.0"
LIZENZ_ZEILEN = ("Video: CC BY-SA 4.0 ·", "creativecommons.org/licenses/by-sa/4.0")
# Diese Fassungen erlauben für Bearbeitungen CC BY-SA 4.0: 4.0 selbst (Abschnitt 3(b)) und 3.0
# über „eine spätere Version mit denselben Lizenzelementen“ (Abschnitt 4(b)). Andere erst prüfen.
LIZENZ_PASST = {"CC BY-SA 4.0": "Abschnitt 3(b)", "CC BY-SA 3.0": "Abschnitt 4(b), spätere Version"}


def by_sa_bearbeitungen(quellen: list[dict]) -> list[dict]:
    """Die Quellen, deren Bearbeitung unter ShareAlike fällt (CC BY-SA und bearbeitet)."""
    return [q for q in quellen if q.get("lizenz_art") == "cc-by-sa" and q.get("bearbeitung")]


def credits_ergaenzen(look: str, extra: list[dict] | None = None, lizenz_im_bild: dict | None = None) -> None:
    """credits.json neben dem Video: Fotos (schreibt werkzeug/fotos.py), weitere Fremdquellen
    (z. B. Kartendaten), die Fakten hinter den Zahlen im Bild und, falls nötig, lizenz_video.

    lizenz_im_bild: wo und wie lange die Lizenzzeile im Bild steht ({"ort", "von_s", "bis_s", …}).
    Pflicht, sobald die Probe eine CC-BY-SA-Bearbeitung zeigt: Ohne Zeile im Bild bricht der Bau ab.
    """
    sys.path.insert(0, str(REPO / "factory"))
    from werk import bilder
    pfad = LOOKS / f"probe-{look}" / "credits.json"
    for eintrag in extra or []:
        bilder.schreibe_credits(pfad, eintrag, video=f"probe-{look}")
    if not pfad.exists():
        pfad.write_text(json.dumps({"_hinweis": "Fremdquellen dieses Videos mit Urheber, Lizenz, Link "
                                    "und Datum. Erzeugt von factory/werk/bilder.py.",
                                    "video": f"probe-{look}", "quellen": []}, ensure_ascii=False, indent=2) + "\n",
                        encoding="utf-8")
    inhalt = json.loads(pfad.read_text(encoding="utf-8"))
    inhalt.pop("lizenz_video", None)
    inhalt["fakten"] = list(FAKTEN.values())
    bearbeitet = by_sa_bearbeitungen(inhalt.get("quellen", []))
    if bearbeitet:
        if not lizenz_im_bild:
            raise SystemExit(f"{look}: zeigt Bearbeitungen von CC BY-SA "
                             f"({', '.join(q['datei'] for q in bearbeitet)}), aber keine Lizenzzeile im Bild")
        fremd = [q["lizenz"] for q in bearbeitet if q.get("lizenz") not in LIZENZ_PASST]
        if fremd:
            raise SystemExit(f"{look}: Lizenz {fremd} erst prüfen: erlaubt sie Bearbeitungen unter {LIZENZ_VIDEO}?")
        liste = ", ".join(f"{q['datei']} ({q['lizenz']}, {LIZENZ_PASST[q['lizenz']]})" for q in bearbeitet)
        drei = (" CC BY-SA 3.0 erlaubt dafür auch eine spätere Version mit denselben Lizenzelementen."
                if any(q["lizenz"] == "CC BY-SA 3.0" for q in bearbeitet) else "")
        lizenz = {
            "lizenz": LIZENZ_VIDEO,
            "url": LIZENZ_URL,
            "zeile_im_bild": LIZENZ_ZEILE,
            "im_bild": lizenz_im_bild,
            "grund": (f"Die Probe enthält Bearbeitungen von CC-BY-SA-Werken: {liste}. ShareAlike verlangt für "
                      f"Bearbeitungen dieselbe Lizenz.{drei} Statt abzuwägen, ob die Probe nur eine Sammlung "
                      f"ist, steht die ganze Probe unter {LIZENZ_VIDEO}, wie das Gold-Video "
                      f"(Entscheidung 28.10.2026)."),
        }
        # Reihenfolge wie im Gold-Video: Hinweis, Video, Lizenz, Quellen, Fakten.
        inhalt = {"_hinweis": inhalt.get("_hinweis"), "video": inhalt.get("video"), "lizenz_video": lizenz,
                  **{k: v for k, v in inhalt.items() if k not in ("_hinweis", "video")}}
    pfad.write_text(json.dumps(inhalt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def html_attr(wert) -> str:
    """JSON als HTML-Attributwert (für data-color-grading)."""
    return html.escape(json.dumps(wert, separators=(",", ":")), quote=True)


def clip(cid: str, start: float, ende: float, spur: int, inhalt: str = "", *, klasse: str = "",
         stil: str = "", attr: str = "") -> str:
    """Ein zeitlich gesetztes Element (HyperFrames-Clip) von start bis ende."""
    k = f"clip {klasse}".strip()
    s = f' style="{stil}"' if stil else ""
    return (f'    <div id="{cid}" class="{k}" data-start="{start}" data-duration="{dauer_ab(start, ende)}" '
            f'data-track-index="{spur}"{s}{(" " + attr) if attr else ""}>{inhalt}</div>')
