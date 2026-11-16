#!/usr/bin/env python3
"""Untertitel einer Horror-Folge als ASS-Datei (libass) aus den Wortzeiten bauen.

    python engine/untertitel.py episoden/folge-01            -> episoden/folge-01/untertitel.ass
    python engine/untertitel.py episoden/folge-01 --tabelle  (zeigt alle Einblendungen)

Stil (anhang-a-serienformat A5, Aufgabe Render/Zusammenschnitt):
  - 1–2 Wörter je Einblendung: Funktionswort plus nächstes Inhaltswort („THIS TOWN“),
    betonte Wörter allein. Gruppiert wird mit einer kleinen Kostenrechnung (siehe gruppieren()).
  - Versalien, Archivo Black (OFL, liegt in engine/assets/schriften/), 96 px, weiß,
    schwarze Kontur 7 px, Schatten 4 px. Mitte bei x 540, y 1200 (über TikToks Beschreibung,
    unter den Gesichtern). Höchstens 810 px breit (A5); zu breite Paare stehen einzeln.
  - Wechsel auf dem Bild, in dem das erste Wort beginnt (gerundet auf das nächste Bild,
    also höchstens 1/60 s daneben). Lücken bleiben nie leer: Eine Einblendung steht,
    bis die nächste kommt. Über der Endkarte steht nichts.
  - Pop: Bild 1 73 %, Bild 2 92 %, Bild 3 100 % (A5: 0,73 -> 1,0 ohne Überschwingen).
  - Farben: Monstername, Name der Nacht, Regel, „ready“ und das Zählen in der Akzentfarbe
    (kaltes Türkis von Mister Hundred); wörtliche Rede in der Farbe der Figur (serie.md).
  - Zahlen als Ziffern (format-spec §5): eighteen -> 18, one hundred -> 100, six -> 6.

Zeitraster: ffmpeg fragt libass je Bild mit der Zeit int(n · 1000/30) ms ab. ASS kennt nur
Hundertstel. Deshalb liegt der Start einer Einblendung in der Mitte zwischen dem Bild davor
und ihrem ersten Bild (abgerundet auf 10 ms): Sie erscheint dann sicher genau in Bild n.
Die Pop-Stufen sind \\t-Übergänge mit 5 ms Abstand zu den Bildzeiten, damit Rundungen
nicht in die falsche Stufe kippen.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
from pathlib import Path

HIER = Path(__file__).resolve().parent
SCHRIFT = HIER / "assets" / "schriften" / "ArchivoBlack-Regular.ttf"
SCHRIFT_NAME = "Archivo Black"
FPS = 30
BREITE, HOEHE = 1080, 1920
MITTE = (540, 1200)
# Review Teil 3: Liegt die Hauptsache einer Einstellung im Untertitel-Streifen (Junes Pupille, Uhrziffern),
# stehen die Untertitel dieser Einstellung tiefer. 1440 liegt noch über der Beschreibungszeile der App.
STREIFEN_Y = (1040, 1330)
AUSWEICH_Y = 1440
# Wörtliche Rede (Junes Gelb auf ihrem senffarbenen Pulli) bekommt eine dickere Kontur
KONTUR_REDE = 11
GROESSE = 96            # px bei 1080 × 1920 (Review Folge 1: 84 px wirkten in der Handyvorschau dünn)
KONTUR = 7              # px, Vorgabe 6–8
SCHATTEN = 4            # px nach unten rechts
MAX_BREITE = 810        # px bei 100 % (A5); der Pop wächst nur bis 100 %, nie darüber
POP = (73, 92, 100)     # Skalierung in den ersten drei Bildern: 0,73 -> 1,0 ohne Überschwingen (A5)
MAX_PAAR_ABSTAND = 0.55  # s: Das zweite Wort einer Einblendung beginnt höchstens so spät
MIN_GROESSE = 72        # feste Paare (Namen) dürfen bis hierhin kleiner werden (format-spec §5)

# Funktionswörter: allein schwach, als erstes Wort eines Paars gut („THIS TOWN“, „YOU HIDE“)
LEICHT = set("""a an the in on at to of for from by over under with into through and or
but if when so it it's its i i'll you your we my his her our their they them she he me is was
were are be can can't that that's there's this all not both who what only ever every""".split())
# Artikel und Besitzwörter: gehören zum folgenden Wort, nicht zum vorigen („IN“ / „THIS TOWN“)
BEGLEITER = set("a an the this that my your his her our their its".split())
# Objekt-Pronomen hängen am Verb davor („FINDS YOU“, „MADE IT“, „CALLS IT“)
OBJEKT = set("it you them me her him us".split())
# Präpositionen dürfen mäßig gut ans Wort davor („LOOKS IN“, „AWAY FROM“)
PRAEP = set("in on at to of for from by over under with into through".split())
MIN_BILDER = 3          # kürzere Einblendungen blitzen nur auf (Pop braucht 3 Bilder)

ZAHLWOERTER = {"eighteen": "18", "eighteenth": "18TH", "six": "6", "eleven": "11",
               "ninety-seven": "97", "ninety-eight": "98", "ninety-nine": "99"}   # Teil 2: Junes Zählen


# ---------------------------------------------------------------- Einheiten

def farbe_ass(hex_farbe: str) -> str:
    """#RRGGBB -> &HBBGGRR& (ASS speichert Farben rückwärts)."""
    h = hex_farbe.lstrip("#")
    return f"&H{h[4:6]}{h[2:4]}{h[0:2]}&".upper()


def anzeige(wort_text: str) -> str:
    """Token aus dem Skript -> Anzeige: Versalien, ohne Satzzeichen, Apostroph im Wort bleibt."""
    t = wort_text.replace("’", "'").replace("“", '"').replace("”", '"')
    t = re.sub(r"^[^A-Za-z0-9]+|[^A-Za-z0-9]+$", "", t)
    return t.upper()


def satzzeichen_danach(wort_text: str) -> bool:
    """Endet das Token mit Komma, Punkt, Frage-/Ausrufezeichen oder Anführung? Dann endet dort eine Phrase."""
    return bool(re.search(r"[,.;:!?\"”]$", wort_text.strip()))


def einheiten(timing: dict, vorgaben: dict) -> list[dict]:
    """Wörter -> Anzeige-Einheiten (Zahlen zusammengezogen, Farbe, Phrasenende)."""
    woerter = timing["woerter"]

    def pruefe(i: int, text: str) -> None:
        if woerter[i]["text"] != text:
            sys.exit(f"untertitel.json passt nicht zu timing.json: Wort {i} ist {woerter[i]['text']!r}, erwartet {text!r}")

    farbe = {}
    for a in vorgaben.get("akzent", []):
        toks = a["text"].split()
        for k, i in enumerate(range(a["von"], a["bis"] + 1)):
            pruefe(i, toks[k])
            farbe[i] = ("akzent", vorgaben["akzent_farbe"])
    for r in vorgaben.get("rede", []):
        toks = r["text"].split()
        for k, i in enumerate(range(r["von"], r["bis"] + 1)):
            pruefe(i, toks[k])
            farbe[i] = (f"rede-{r['wer']}", r["farbe"])
    allein = set()
    for a in vorgaben.get("allein", []):
        pruefe(a["i"], a["text"])
        allein.add(a["i"])
    # Feste Paare aus der Vorgabe (Namen, Begriffe): stehen immer gemeinsam
    paare = {}
    for pr in vorgaben.get("paare", []):
        toks = pr["text"].split()
        pruefe(pr["von"], toks[0])
        pruefe(pr["bis"], toks[-1])
        paare[pr["von"]] = pr["bis"]
    keine_ziffer = set()
    for z in vorgaben.get("ziffern_nicht", []):
        pruefe(z["i"], z["text"])
        keine_ziffer.add(z["i"])

    aus = []
    i = 0
    while i < len(woerter):
        w = woerter[i]
        roh = w["wort"].lower()
        text = anzeige(w["text"])
        bis = i
        # „one hundred“ (klein geschrieben, also nicht der Name) -> „100“
        if roh == "one" and i + 1 < len(woerter) and woerter[i + 1]["text"].strip(",.").startswith("hundred"):
            text, bis = "100", i + 1
        elif roh in ZAHLWOERTER and i not in keine_ziffer and roh != "one":
            text = ZAHLWOERTER[roh]
        letzt = woerter[bis]
        satz_ende = bis + 1 >= len(woerter) or woerter[bis + 1]["satz"] != w["satz"]
        aus.append({
            "von": i, "bis": bis, "text": text, "satz": w["satz"],
            "start": w["start"], "ende": letzt["ende"],
            "phrase_ende": satzzeichen_danach(letzt["text"]) or satz_ende,
            "leicht": roh in LEICHT and text not in ("100",),
            "begleiter": roh in BEGLEITER,
            "objekt": roh in OBJEKT,
            "praep": roh in PRAEP,
            "klasse": farbe.get(i, ("weiss", "#FFFFFF")),
            "allein": i in allein or bis in allein,
            "paar_bis": paare.get(i),
        })
        i = bis + 1
    return aus


# ---------------------------------------------------------------- Breite messen

_FONT = None


def breite_px(text: str) -> float:
    """Breite in px bei 100 % (Pillow mit derselben TTF), plus Kontur links und rechts."""
    global _FONT
    if _FONT is None:
        from PIL import ImageFont
        _FONT = ImageFont.truetype(str(SCHRIFT), GROESSE)
    return _FONT.getlength(text) + 2 * KONTUR


# ---------------------------------------------------------------- Gruppieren

def kosten_einzeln(u: dict) -> float:
    if u["allein"]:
        return 0.0
    if u["leicht"]:
        # Ein Funktionswort allein ist schwach; am Satzende („FINDS“ / „YOU.“) etwas weniger
        return 1.0 if u["phrase_ende"] else 1.8
    return 0.6


def kosten_paar(u: dict, v: dict) -> float | None:
    """Kosten, u und v gemeinsam zu zeigen; None = verboten."""
    if u["satz"] != v["satz"] or u["klasse"][0] != v["klasse"][0]:
        return None
    if u["paar_bis"] is not None and u["paar_bis"] in (v["von"], v["bis"]):
        return -5.0                       # festes Paar aus der Vorgabe („MISTER HUNDRED“)
    if u["phrase_ende"] or u["allein"] or v["allein"]:
        return None
    if v["start"] - u["start"] > MAX_PAAR_ABSTAND:
        return None
    if breite_px(f"{u['text']} {v['text']}") > MAX_BREITE:
        return None
    if u["leicht"] and not v["leicht"]:
        return 0.2                        # „THIS TOWN“, „YOU HIDE“
    if u["leicht"] and v["leicht"]:
        # „WHEN YOU“ ist gut, „IN THIS“ nicht: Der Begleiter gehört zum Wort danach
        return 1.6 if (v["begleiter"] and not v["phrase_ende"]) else 0.9
    if v["leicht"]:
        if v["phrase_ende"] or v["objekt"]:
            return 0.6                    # „FINDS YOU.“, „MADE IT“
        if v["praep"]:
            return 1.6                    # „LOOKS IN“
        return 2.6                        # „WHITE WHEN“, „LEFT ARE“ schlecht
    return 1.4                            # zwei Inhaltswörter: nur wenn es sonst schlechter wird


def gruppieren(einh: list[dict]) -> list[list[dict]]:
    """Kürzeste Zerlegung in Einblendungen zu 1 oder 2 Einheiten (dynamische Programmierung).

    Die Standzeit einer Einblendung steht schon beim Zerlegen fest: Sie endet, wo die nächste
    Einheit beginnt. Unter MIN_BILDER Bildern kostet eine Einblendung 3 Punkte extra.
    """
    n = len(einh)

    def kurz(a: int, b: int) -> float:
        """Strafe für Einheiten a..b (einschließlich), wenn sie zu kurz stehen."""
        if b + 1 >= n:
            return 0.0
        bilder = round(einh[b + 1]["start"] * FPS) - round(einh[a]["start"] * FPS)
        return 3.0 if bilder < MIN_BILDER else 0.0

    beste = [0.0] + [math.inf] * n
    zurueck = [0] * (n + 1)
    for i in range(1, n + 1):
        k1 = beste[i - 1] + kosten_einzeln(einh[i - 1]) + kurz(i - 1, i - 1)
        if k1 < beste[i]:
            beste[i], zurueck[i] = k1, 1
        if i >= 2:
            kp = kosten_paar(einh[i - 2], einh[i - 1])
            if kp is not None and beste[i - 2] + kp + kurz(i - 2, i - 1) < beste[i]:
                beste[i], zurueck[i] = beste[i - 2] + kp + kurz(i - 2, i - 1), 2
    gruppen = []
    i = n
    while i > 0:
        gruppen.append(einh[i - zurueck[i]:i])
        i -= zurueck[i]
    return gruppen[::-1]


# ---------------------------------------------------------------- Zeiten

def bild_ms(n: int) -> float:
    """Zeit, mit der ffmpeg libass für Bild n abfragt (ms)."""
    return n * 1000.0 / FPS


def start_cs(n: int) -> int:
    """ASS-Startzeit (Hundertstel) für eine Einblendung, die genau ab Bild n stehen soll."""
    if n <= 0:
        return 0
    return int(math.floor((bild_ms(n) - 1000.0 / FPS / 2) / 10.0))


def ass_zeit(cs: int) -> str:
    h, rest = divmod(cs, 360000)
    m, rest = divmod(rest, 6000)
    s, c = divmod(rest, 100)
    return f"{h}:{m:02d}:{s:02d}.{c:02d}"


def pop_tags(n: int, cs: int) -> str:
    """\\t-Übergänge: Bild n 73 %, Bild n+1 92 %, ab Bild n+2 100 % (Werte aus POP)."""
    d = bild_ms(n) - cs * 10            # Abstand Ereignisbeginn -> erstes Bild (ms)
    t = [round(d + x) for x in (5, 28, 38, 61)]
    a, b, c = POP
    return (f"\\fscx{a}\\fscy{a}\\t({t[0]},{t[1]},\\fscx{b}\\fscy{b})"
            f"\\t({t[2]},{t[3]},\\fscx{c}\\fscy{c})")


# ---------------------------------------------------------------- ASS schreiben

def ausweich_zeiten(ordner: Path, episode: dict) -> list[tuple[float, float]]:
    """Zeiträume der Einstellungen, deren Hauptsache im Untertitel-Streifen liegt. Grundlage ist die
    Kompositionsprüfung des Schnellbogens (build/<folge>/komposition.json, projizierte Punkte bei 1080 × 1920).
    Fehlt die Datei, bleibt alles auf der Mitte."""
    k = ordner.parent.parent / "build" / ordner.name / "komposition.json"
    if not k.exists():
        return []
    zeiten = {e["id"]: (e["start"], e["ende"]) for e in episode["einstellungen"]}
    aus = []
    for e in json.loads(k.read_text(encoding="utf-8")).get("einstellungen", []):
        punkte = (e.get("komposition") or {}).get("punkte", [])
        if any(0 <= pt["x"] <= BREITE and STREIFEN_Y[0] <= pt["y"] <= STREIFEN_Y[1] for pt in punkte) and e["id"] in zeiten:
            aus.append(zeiten[e["id"]])
    return aus


def baue(ordner: Path, tabelle: bool = False) -> dict:
    timing = json.loads((ordner / "timing.json").read_text(encoding="utf-8"))
    vorgaben = json.loads((ordner / "untertitel.json").read_text(encoding="utf-8"))
    episode = json.loads((ordner / "episode.json").read_text(encoding="utf-8"))
    # Endkarte: dort stehen keine Untertitel
    end = [e for e in episode["einstellungen"] if e.get("plan", {}).get("endkarte")]
    # ohne Endkarte (Finale): bis zum letzten Bild der Folge
    ende_bild = round(end[0]["start"] * FPS) if end else round(episode["einstellungen"][-1]["ende"] * FPS)

    gruppen = gruppieren(einheiten(timing, vorgaben))
    ausweichen = ausweich_zeiten(ordner, episode)
    zeilen = []
    eintraege = []
    starts = [round(g[0]["start"] * FPS) for g in gruppen]
    for k, g in enumerate(gruppen):
        n = starts[k]
        n_ende = starts[k + 1] if k + 1 < len(gruppen) else ende_bild
        if n_ende <= n:
            sys.exit(f"Einblendung {k} ({g[0]['text']}) hätte keine Standzeit")
        text = " ".join(u["text"] for u in g)
        cs, cs_ende = start_cs(n), start_cs(n_ende)
        farbe = g[0]["klasse"][1]
        y = AUSWEICH_Y if any(a <= n / FPS < b for a, b in ausweichen) else MITTE[1]
        tags = f"\\an5\\pos({MITTE[0]},{y})" + pop_tags(n, cs)
        if g[0]["klasse"][0].startswith("rede-"):
            tags += f"\\bord{KONTUR_REDE}"
        # Zu breite feste Paare werden kleiner gesetzt (nicht unter MIN_GROESSE)
        groesse = GROESSE
        if breite_px(text) > MAX_BREITE:
            groesse = math.floor(GROESSE * (MAX_BREITE - 2 * KONTUR) / (breite_px(text) - 2 * KONTUR))
            if groesse < MIN_GROESSE:
                sys.exit(f"{text!r} ist auch mit {MIN_GROESSE} px zu breit")
            tags += f"\\fs{groesse}"

        if farbe.upper() != "#FFFFFF":
            tags += f"\\1c{farbe_ass(farbe)}"
        zeilen.append(f"Dialogue: 0,{ass_zeit(cs)},{ass_zeit(cs_ende)},Wort,,0,0,0,,{{{tags}}}{text}")
        eintraege.append({
            "text": text, "bild": n, "bild_ende": n_ende, "wort_start": g[0]["start"],
            "abweichung_ms": round((n / FPS - g[0]["start"]) * 1000, 1),
            "standzeit_s": round((n_ende - n) / FPS, 3), "farbe": g[0]["klasse"][0],
            "breite_px": round((breite_px(text) - 2 * KONTUR) * groesse / GROESSE + 2 * KONTUR),
            "groesse_px": groesse, "y": y,
            "woerter": [g[0]["von"], g[-1]["bis"]],
        })

    kopf = f"""[Script Info]
; Gebaut von engine/untertitel.py aus timing.json und untertitel.json. Nicht von Hand ändern.
Title: {episode.get('titel', ordner.name)} – Untertitel
ScriptType: v4.00+
PlayResX: {BREITE}
PlayResY: {HOEHE}
WrapStyle: 2
ScaledBorderAndShadow: yes
YCbCr Matrix: None

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Wort,{SCHRIFT_NAME},{GROESSE},&H00FFFFFF,&H00FFFFFF,&H00000000,&H59000000,0,0,0,0,100,100,0,0,1,{KONTUR},{SCHATTEN},5,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ziel = ordner / "untertitel.ass"
    ziel.write_text(kopf + "\n".join(zeilen) + "\n", encoding="utf-8")

    abw = [abs(e["abweichung_ms"]) for e in eintraege]
    stand = sorted(e["standzeit_s"] for e in eintraege)
    werte = {
        "datei": str(ziel), "einblendungen": len(eintraege),
        "zwei_woerter": sum(1 for e in eintraege if " " in e["text"]),
        "max_abweichung_ms": max(abw), "standzeit_median_s": stand[len(stand) // 2],
        "standzeit_min_s": stand[0], "max_breite_px": max(e["breite_px"] for e in eintraege),
        "letztes_bild": ende_bild - 1, "ausgewichen": sum(1 for e in eintraege if e["y"] != MITTE[1]),
        "farbig": {k: sum(1 for e in eintraege if e["farbe"] == k) for k in {e["farbe"] for e in eintraege}},
    }
    (ordner.parent.parent / "build" / ordner.name).mkdir(parents=True, exist_ok=True)
    (ordner.parent.parent / "build" / ordner.name / "untertitel-liste.json").write_text(
        json.dumps({"werte": werte, "einblendungen": eintraege}, ensure_ascii=False, indent=1), encoding="utf-8")
    if tabelle:
        for e in eintraege:
            print(f"{e['bild']:5d} {e['wort_start']:6.2f}s {e['standzeit_s']:5.2f}s {e['farbe'][:6]:6s} {e['breite_px']:4d}px  {e['text']}")
    return werte


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("ordner", type=Path, help="Episoden-Ordner mit timing.json, untertitel.json, episode.json")
    ap.add_argument("--tabelle", action="store_true", help="alle Einblendungen zeigen")
    a = ap.parse_args()
    werte = baue(a.ordner.resolve(), a.tabelle)
    print(json.dumps(werte, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
