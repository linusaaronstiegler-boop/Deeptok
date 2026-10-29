"""Probe „Flach“ (studio/looks/flach.md): eigene flache Illustration, satte Flächen, runde Formen.

Foto-Einlage: Bild 0 zeigt das echte Camp Nou in Farbe. Auf „Barcelona“ verwandelt es sich in das
gezeichnete Stadion (Morph, DESIGN.md §5): erst der echte Ort, dann das Modell.
Beat 1: Ein Geldstapel aus Bündeln mit Banderole wächst aus dem Anstoßkreis, ein gelbes
Preisschild hängt an einer Schnur daran: „45 Mio. €“, darunter ein runder Pinselstrich.
Beat 2: „Behalten“, ein Kalenderblatt ploppt auf (30. Juni 2023), dann verwandelt sich der Stapel
in seinen Umriss (Morph) und das Schild in „0 €“. Takt: lebhaft, alles federt (nur Lage und Größe).
Lizenz: Das Foto ist eine Bearbeitung (Ausschnitt) eines CC-BY-SA-3.0-Fotos, also steht die ganze
Probe unter CC BY-SA 4.0. Die Lizenzzeile ist ein eigener Block aus einer Zeile (DESIGN.md §2): Sie
steht mit LUFT_LIZENZ Abstand unter dem Credit der Foto-Einlage (der hat höchstens 3 Zeilen) und
geht mit ihm (so lange wie der Foto-Credit). Unten rechts, wo Flach sonst Quellen zeigt, ist danach
kein Platz: Dort stehen die Quellen der Zahlen, darüber das Stadion.
"""
from __future__ import annotations

import math

from probe_basis import (CUE, DAUER, LIZENZ_ZEILE_KURZ, NBSP, Q_ABL, Q_FREI, Q_VERTRAG, bildmass, clip,
                         credits_aus, credits_ergaenzen, kurz, messen, pruefe_breiten, pruefe_credit_block,
                         pruefe_lizenzzeile, schreibe_probe, strich_pfad, t, unterstrich)

LOOK = "flach"
MINZE, WIESE, SCHATTEN, TINTE = "#9EDBC6", "#86D0B8", "#6FC2A8", "#14243A"
GELB, BLAU, LAGUNE, WEISS, HELL = "#FFC93C", "#2949D6", "#1E8A78", "#FFFFFF", "#D9F2E9"
# Flach zeigt vor dem ersten Wort 1,4 s das echte Foto: Beat 1 beginnt hier später.
CUE_F = {**CUE, **{k: CUE[k] + 1.4 for k in ("barcelona", "bietet", "zahl", "millionen", "euro")}}
CX, CY, RX, RY, WAND = 540, 1000, 390, 140, 88          # Stadion von schräg oben
# Abstand zwischen Foto-Credit und Lizenzzeile: so viel Luft, dass sie als eigener Block lesbar
# ist (eine Zeile hat 42 px; 28 px mehr trennen sichtbar, auch im Handy-Blatt).
LUFT_LIZENZ = 28


def tf(cue: str, plus: float = 0.0) -> float:
    return t(cue, plus, CUE_F)


def euro_zeichen(x: float, y: float, h: float, farbe: str) -> str:
    """„€“ als Form (DESIGN.md §2: Prägung wird gezeichnet, nicht gesetzt): Bogen und zwei Striche."""
    r = h / 2
    a0, a1 = math.radians(-50), math.radians(50)      # Bogen offen nach rechts, wie ein C
    return (f'<path d="M{x + r + r * math.cos(a0):.1f} {y + r + r * math.sin(a0):.1f} '
            f'A{r:.1f} {r:.1f} 0 1 0 {x + r + r * math.cos(a1):.1f} {y + r + r * math.sin(a1):.1f}" '
            f'fill="none" stroke="{farbe}" stroke-width="{h * 0.14:.1f}" stroke-linecap="round" />'
            f'<path d="M{x - h * 0.12:.1f} {y + h * 0.42:.1f} L{x + h * 0.62:.1f} {y + h * 0.42:.1f} '
            f'M{x - h * 0.12:.1f} {y + h * 0.6:.1f} L{x + h * 0.56:.1f} {y + h * 0.6:.1f}" '
            f'stroke="{farbe}" stroke-width="{h * 0.11:.1f}" stroke-linecap="round" />')


def buendel(x: float, fuss: float, b: float = 260, geist: bool = False) -> str:
    """Ein Bündel Scheine von schräg vorn: Oberseite = Schein mit Rand, €-Zeichen und Wasserzeichen,
    Vorderkante = Papierlagen, quer darüber die blaue Banderole. Als Geist nur gestrichelt."""
    vorn, oben = 54, 100
    if geist:
        s = f'fill="none" stroke="{TINTE}" stroke-width="5" stroke-dasharray="16 12" stroke-linejoin="round"'
        return (f'<rect x="{x}" y="{fuss - vorn - oben}" width="{b}" height="{oben}" rx="8" {s} />'
                f'<rect x="{x}" y="{fuss - vorn}" width="{b}" height="{vorn}" rx="6" {s} />')
    lagen = "".join(f'<line x1="{x + 6}" y1="{fuss - vorn + 10 * k}" x2="{x + b - 6}" y2="{fuss - vorn + 10 * k}" '
                    f'stroke="{MINZE}" stroke-width="3" />' for k in range(1, 5))
    mitte = x + b / 2
    return (f'<rect x="{x}" y="{fuss - vorn}" width="{b}" height="{vorn}" rx="6" fill="{HELL}" />{lagen}'
            f'<rect x="{x}" y="{fuss - vorn - oben}" width="{b}" height="{oben}" rx="8" fill="{WEISS}" />'
            f'<rect x="{x + 10}" y="{fuss - vorn - oben + 10}" width="{b - 20}" height="{oben - 20}" rx="5" '
            f'fill="none" stroke="{LAGUNE}" stroke-width="4" />'
            + euro_zeichen(x + 34, fuss - vorn - oben + 24, 52, LAGUNE)
            + f'<circle cx="{x + b - 46}" cy="{fuss - vorn - oben / 2}" r="20" fill="none" stroke="{LAGUNE}" stroke-width="4" />'
            f'<rect x="{mitte - 18}" y="{fuss - vorn - oben}" width="36" height="{oben + vorn}" fill="{BLAU}" />')


def flach() -> None:
    fb, fh = bildmass(LOOK, "assets/fotos/camp-nou.jpg")
    foto_h = round(1080 * fh / fb)
    # Unter dem Foto: 20 px Luft, 3 Zeilen Credit, LUFT_LIZENZ, 1 Zeile Lizenz; alles endet im
    # Lesefenster (≤ 1330). Darum steht das Foto so hoch wie nötig, höchstens bei y = 560.
    foto_y = min(560, 1324 - foto_h - (20 + 3 * 42 + LUFT_LIZENZ + 42))
    lizenz_top = foto_y + foto_h + 20 + 3 * 42 + LUFT_LIZENZ
    c = credits_aus(LOOK).get("assets/fotos/camp-nou.jpg")
    if not c:
        raise SystemExit("flach: credits.json fehlt (erst werkzeug/fotos.py)")
    foto_zeilen = ["Foto: Luis Miguel Bugallo Sánchez (Lmbuga),", "2014, CC BY-SA 3.0, Ausschnitt,", kurz(c)]
    pruefe_credit_block(LOOK, "Foto-Einlage", foto_zeilen)
    texte = {"ort": ("Barcelona", 'font: 800 124px/1 "FL Rubik"'),
             "beh": ("Behalten", 'font: 800 124px/1 "FL Rubik"'),
             # Zahl in 173 px, Einheit in 124 px auf derselben Grundlinie: „45 Mio. €“ ganz in 173 px
             # wäre 807 px breit, das Schild damit breiter als das Lesefenster.
             "z45": ("45", 'font: 800 173px/1 "FL Rubik"; font-variant-numeric: lining-nums'),
             "z0": ("0", 'font: 800 173px/1 "FL Rubik"; font-variant-numeric: lining-nums'),
             "mio": (f"{NBSP}Mio.{NBSP}€", 'font: 800 124px/1 "FL Rubik"'),
             "eur": (f"{NBSP}€", 'font: 800 124px/1 "FL Rubik"'),
             "monat": ("Juni 2023", 'font: 600 52px/1 "FL Rubik"'),
             "tag": ("30", 'font: 800 150px/1 "FL Rubik"')}
    texte.update({f"c{i}": (z, 'font: 400 34px/42px "FL Rubik"') for i, z in enumerate(foto_zeilen + [Q_ABL, Q_VERTRAG, Q_FREI])})
    texte["lizenz"] = (LIZENZ_ZEILE_KURZ, 'font: 400 34px/42px "FL Rubik"')
    m = messen(LOOK, texte)
    pruefe_lizenzzeile(LOOK, m["lizenz"]["breite"], 864)        # eine Zeile, linksbündig an x = 108
    m["zahl"] = {"breite": m["z45"]["breite"] + m["mio"]["breite"], "grundlinie": m["z45"]["grundlinie"]}
    m["null"] = {"breite": m["z0"]["breite"] + m["eur"]["breite"], "grundlinie": m["z0"]["grundlinie"]}
    # Preisschild: Loch links (110 px), Zahl in 173 px, 40 px Rand rechts. Muss ins Lesefenster.
    schild_b, schild_h = round(110 + m["zahl"]["breite"] + 40), 236
    if schild_b > 864:
        raise SystemExit(f"flach: Preisschild {schild_b} px breiter als das Lesefenster")
    pruefe_breiten(LOOK, m)
    schild_x, schild_y = 108, 430
    loch = (schild_x + 52, schild_y + schild_h / 2)
    # Geldstapel auf dem Anstoßpunkt: zwei Bündel unten, eines oben drauf.
    fuss = CY + 30
    stapel = (buendel(CX - 266, fuss) + buendel(CX + 6, fuss) + buendel(CX - 130, fuss - 80))
    geist = (buendel(CX - 266, fuss, geist=True) + buendel(CX + 6, fuss, geist=True)
             + buendel(CX - 130, fuss - 80, geist=True))
    stapel_oben = (CX + 5, fuss - 80 - 54 - 100 + 6)
    schnur = strich_pfad("fl-schnur", [loch, ((loch[0] + stapel_oben[0]) / 2, loch[1] + 170), stapel_oben],
                         TINTE, 5, zweite_spur=False)
    gl = schild_y + 30 + m["zahl"]["grundlinie"]          # Text 30 px unter Schildoberkante
    tx = schild_x + 110
    pinsel_a = strich_pfad("fl-pinsel-a", unterstrich(tx - 4, gl + 22, tx + m["zahl"]["breite"] + 8, 4, anstieg=-6, bogen=5), TINTE, 12, zweite_spur=False)
    pinsel_b = strich_pfad("fl-pinsel-b", unterstrich(tx - 4, gl + 22, tx + m["null"]["breite"] + 8, 8, anstieg=-6, bogen=5), TINTE, 12, zweite_spur=False)
    schild = (f'<svg width="{schild_b}" height="{schild_h}" viewBox="0 0 {schild_b} {schild_h}">'
              f'<path d="M0 {schild_h / 2} L44 4 Q46 0 52 0 L{schild_b - 8} 0 Q{schild_b} 0 {schild_b} 8 L{schild_b} {schild_h - 8} '
              f'Q{schild_b} {schild_h} {schild_b - 8} {schild_h} L52 {schild_h} Q46 {schild_h} 44 {schild_h - 4} Z" fill="{GELB}" />'
              f'<circle cx="52" cy="{schild_h / 2}" r="17" fill="{MINZE}" stroke="{TINTE}" stroke-width="4" /></svg>')
    # Kalenderblatt (Beat 2): Ringe, Kopf in Lagune mit Monat, groß der Tag.
    kal_x, kal_y, kal_b, kal_h = 108, 1010, 290, 300
    kalender = (f'<svg width="{kal_b}" height="{kal_h + 20}" viewBox="0 -20 {kal_b} {kal_h + 20}">'
                f'<rect x="0" y="0" width="{kal_b}" height="{kal_h}" rx="14" fill="{WEISS}" />'
                f'<path d="M0 14 Q0 0 14 0 L{kal_b - 14} 0 Q{kal_b} 0 {kal_b} 14 L{kal_b} 86 L0 86 Z" fill="{LAGUNE}" />'
                f'<rect x="60" y="-20" width="16" height="44" rx="8" fill="{TINTE}" /><rect x="{kal_b - 76}" y="-20" width="16" height="44" rx="8" fill="{TINTE}" /></svg>')
    welt = (f'<path d="M{CX - RX} {CY} A{RX} {RY} 0 0 0 {CX + RX} {CY} L{CX + RX} {CY + WAND} A{RX} {RY} 0 0 1 {CX - RX} {CY + WAND} Z" fill="{BLAU}" />'
            f'<ellipse cx="{CX}" cy="{CY}" rx="{RX}" ry="{RY}" fill="{WEISS}" />'
            f'<ellipse cx="{CX}" cy="{CY + 4}" rx="{RX - 52}" ry="{RY - 26}" fill="none" stroke="{HELL}" stroke-width="10" />'
            f'<ellipse cx="{CX}" cy="{CY + 8}" rx="{RX - 110}" ry="{RY - 52}" fill="{LAGUNE}" />'
            f'<line x1="{CX}" y1="{CY + 8 - (RY - 52) + 8}" x2="{CX}" y2="{CY + 8 + (RY - 52) - 8}" stroke="{WEISS}" stroke-width="5" stroke-opacity="0.85" />'
            f'<ellipse cx="{CX}" cy="{CY + 8}" rx="56" ry="19" fill="none" stroke="{WEISS}" stroke-width="5" stroke-opacity="0.85" />')
    boden = (f'<path d="M-40 900 Q540 800 1120 900 L1120 1960 L-40 1960 Z" fill="{WIESE}" />'
             f'<ellipse cx="{CX}" cy="{CY + WAND + 40}" rx="{RX + 30}" ry="60" fill="{SCHATTEN}" />')
    morph_aus, morph_ein = tf("barcelona"), tf("barcelona", 0.06)
    # Der Credit der Foto-Einlage steht so lange wie das Foto (1,8 s) und geht mit ihm; ein Credit
    # ist kein Lesetext. Für die Lesezeit-Prüfung (line_unread) ist er darum ausgenommen
    # (data-layout-ignore); vollständig steht er in credits.json.
    css = f"""    .fl-voll {{ left: 0; top: 0; width: 1080px; height: 1920px; }}
    #fl-foto {{ left: 0; top: {foto_y}px; width: 1080px; height: {foto_h}px; }}
    #fl-foto img {{ width: 100%; height: 100%; display: block; }}
    #fl-foto-credit {{ left: 108px; top: {foto_y + foto_h + 20}px; font: 400 34px/42px "FL Rubik"; color: {TINTE}; white-space: nowrap; }}
    #fl-foto-lizenz {{ left: 108px; top: {lizenz_top}px; font: 400 34px/42px "FL Rubik"; color: {TINTE}; white-space: nowrap; }}
    .fl-titel {{ left: 108px; top: 250px; font: 800 124px/1 "FL Rubik"; color: {TINTE}; white-space: nowrap; }}
    .fl-titel span {{ display: inline-block; }}
    #fl-schild {{ left: {schild_x}px; top: {schild_y}px; width: {schild_b}px; height: {schild_h}px; }}
    #fl-schild-dreh {{ position: absolute; inset: 0; transform-origin: 52px 50%; }}
    .fl-zahl {{ position: absolute; left: 110px; top: 30px; font: 800 173px/1 "FL Rubik"; color: {TINTE}; white-space: nowrap;
      font-variant-numeric: lining-nums; font-feature-settings: "lnum" 1; }}
    .fl-einheit {{ font-size: 124px; }}
    #fl-kalender {{ left: {kal_x}px; top: {kal_y - 20}px; width: {kal_b}px; height: {kal_h + 20}px; }}
    #fl-kalender-dreh {{ position: absolute; inset: 0; transform-origin: 50% 100%; }}
    #fl-monat {{ position: absolute; left: 0; width: {kal_b}px; top: {20 + 17}px; text-align: center; font: 600 52px/1 "FL Rubik"; color: {WEISS}; }}
    #fl-tag {{ position: absolute; left: 0; width: {kal_b}px; top: {20 + 112}px; text-align: center; font: 800 150px/1 "FL Rubik"; color: {TINTE}; font-variant-numeric: lining-nums; }}
    .fl-credit {{ right: 108px; text-align: right; font: 400 34px/42px "FL Rubik"; color: {TINTE}; white-space: nowrap; }}"""
    html_ = f"""    <!-- Welt: flache Flächen, runde Formen, keine Umrisse, keine Verläufe. Der Boden steht immer;
         das Stadion entsteht per Morph aus dem echten Foto. -->
    <div id="fl-boden" class="clip fl-voll" data-start="0" data-duration="{DAUER}" data-track-index="0" data-layout-allow-overflow>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920">{boden}</svg>
    </div>
{clip('fl-foto', 0, morph_aus + 0.2, 1, f'<img src="assets/fotos/camp-nou.jpg" alt="Camp Nou, echtes Foto: Ränge mit der Schrift Més que un club, Spielfeld" />')}
{clip('fl-foto-credit', 0, morph_aus + 0.2, 6, '<br />'.join(foto_zeilen), attr='data-layout-ignore')}
{clip('fl-foto-lizenz', 0, morph_aus + 0.2, 7, LIZENZ_ZEILE_KURZ, attr='data-layout-ignore')}
    <div id="fl-welt" class="clip fl-voll" data-start="{morph_ein}" data-duration="{DAUER - morph_ein:.3f}" data-track-index="2" data-layout-allow-overflow>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920"><g id="fl-stadion">{welt}</g>
        <g id="fl-geld">{stapel}</g><g id="fl-geist" opacity="0">{geist}</g>{schnur}</svg>
    </div>
{clip('fl-ort', tf('barcelona'), 5.9, 3, '<span id="fl-ort-text">Barcelona</span>', klasse='fl-titel')}
{clip('fl-beh', t('behaelt'), DAUER, 3, '<span id="fl-beh-text">Behalten</span>', klasse='fl-titel')}
    <div id="fl-schild" class="clip" data-start="{tf('zahl')}" data-duration="{DAUER - tf('zahl'):.3f}" data-track-index="4">
      <div id="fl-schild-dreh">{schild}<div id="fl-zahl" class="fl-zahl">45<span class="fl-einheit">{NBSP}Mio.{NBSP}€</span></div><div id="fl-null" class="fl-zahl" style="opacity:0">0<span class="fl-einheit">{NBSP}€</span></div></div>
    </div>
{clip('fl-marker-a', tf('millionen'), t('null'), 5, f'<svg width="1080" height="1920" viewBox="0 0 1080 1920">{pinsel_a}</svg>', klasse='fl-voll', attr='data-layout-ignore')}
{clip('fl-marker-b', t('euro_b'), DAUER, 5, f'<svg width="1080" height="1920" viewBox="0 0 1080 1920">{pinsel_b}</svg>', klasse='fl-voll', attr='data-layout-ignore')}
    <div id="fl-kalender" class="clip" data-start="{t('juni')}" data-duration="{DAUER - t('juni'):.3f}" data-track-index="4">
      <div id="fl-kalender-dreh">{kalender}<div id="fl-monat">Juni 2023</div><div id="fl-tag">30</div></div>
    </div>
{clip('fl-c-abl', tf('zahl'), t('null'), 6, Q_ABL, klasse='fl-credit', stil='top: 1240px', attr='data-hold')}
{clip('fl-c-vertrag', t('juni'), DAUER, 7, Q_VERTRAG, klasse='fl-credit', stil='top: 1282px')}
{clip('fl-c-frei', t('null', 0.12), DAUER, 8, Q_FREI, klasse='fl-credit', stil='top: 1240px')}"""
    js = f"""      // Morph Foto → Zeichnung (DESIGN.md §5): das Foto wird unscharf und größer, die Zeichnung
      // kommt 0,06 s später aus der Unschärfe und aus 72 % Größe. Derselbe Ort, jetzt als Modell.
      tl.fromTo("#fl-foto", {{ opacity: 1, scale: 1, filter: "blur(0px)" }}, {{ opacity: 0, scale: 1.3, filter: "blur(10px)", duration: 0.18, ease: "power2.in" }}, {morph_aus});
      raus("#fl-foto-credit, #fl-foto-lizenz", {morph_aus}, 0.18);
      // svgOrigin statt transformOrigin: Bei SVG-Elementen rechnet GSAP px-Angaben in transformOrigin
      // ab der eigenen Bounding-Box, nicht im SVG. Mit transformOrigin "540px 1000px" wuchs das
      // Stadion von y ≈ 1860 aus und lag beim Morph über dem Foto-Credit (Gegenlese 28.10.).
      tl.fromTo("#fl-stadion", {{ opacity: 0, scale: 0.72, filter: "blur(10px)", svgOrigin: "{CX} {CY}" }}, {{ opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.32, ease: "expo.out" }}, {morph_ein});
      // Ploppen: Lage und Größe federn (back.out), Deckkraft nur 0,08 s linear (DESIGN.md §5).
      const ploppe = (sel, t, von, ursprung) => {{
        tl.fromTo(sel, {{ opacity: 0 }}, {{ opacity: 1, duration: 0.08, ease: "none" }}, t);
        tl.fromTo(sel, {{ scale: von, transformOrigin: ursprung }}, {{ scale: 1, duration: 0.4, ease: "back.out(2.2)" }}, t);
      }};
      ploppe("#fl-ort-text", {tf('barcelona')}, 0.7, "0% 70%");
      // Wachsen: der Geldstapel wächst aus dem Anstoßpunkt (svgOrigin in SVG-Koordinaten, siehe oben;
      // vorher wuchs er von y ≈ 1826 aus durch die Untertitel-Zone).
      tl.fromTo("#fl-geld", {{ scaleY: 0, svgOrigin: "{CX} {CY + 30}" }}, {{ scaleY: 1, duration: 0.5, ease: "back.out(1.6)" }}, {tf('bietet')});
      // Das Preisschild schwingt an seiner Schnur ein (Drehung federt um das Loch).
      tl.fromTo("#fl-schild-dreh", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.08, ease: "none" }}, {tf('zahl')});
      tl.fromTo("#fl-schild-dreh", {{ rotation: -24, scale: 0.7 }}, {{ rotation: -3, scale: 1, duration: 0.55, ease: "back.out(2.2)" }}, {tf('zahl')});
      zeichne("#fl-schnur", {tf('zahl', 0.1)}, 0.25, "power2.out");
      zeichne("#fl-pinsel-a", {tf('millionen')}, 0.35, "power2.inOut");
      // Beat 2: Titel wechselt, das Kalenderblatt ploppt auf den Boden.
      raus("#fl-ort", 5.70);
      ploppe("#fl-beh-text", {t('behaelt')}, 0.7, "0% 70%");
      tl.fromTo("#fl-kalender-dreh", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.08, ease: "none" }}, {t('juni')});
      tl.fromTo("#fl-kalender-dreh", {{ scale: 0.55, rotation: -12 }}, {{ scale: 1, rotation: -3, duration: 0.45, ease: "back.out(2.2)" }}, {t('juni')});
      // Morph: aus dem Geld wird sein Umriss (es kommt nicht), aus „45 Mio. €“ wird „0 €“.
      raus("#fl-pinsel-a", {t('null')}, 0.15);
      tl.fromTo("#fl-geld", {{ opacity: 1, filter: "blur(0px)" }}, {{ opacity: 0, filter: "blur(10px)", duration: 0.18, ease: "power2.in", immediateRender: false }}, {t('null')});
      tl.fromTo("#fl-geist", {{ opacity: 0, filter: "blur(10px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.32, ease: "expo.out" }}, {t('null', 0.06)});
      tl.fromTo("#fl-zahl", {{ opacity: 1, scale: 1, filter: "blur(0px)", transformOrigin: "0% 60%" }}, {{ opacity: 0, scale: 1.3, filter: "blur(10px)", duration: 0.18, ease: "power2.in" }}, {t('null')});
      tl.fromTo("#fl-null", {{ opacity: 0, scale: 0.72, filter: "blur(10px)", transformOrigin: "0% 60%" }}, {{ opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.32, ease: "expo.out" }}, {t('null', 0.06)});
      zeichne("#fl-pinsel-b", {t('euro_b')}, 0.3, "power2.inOut");
      rein("#fl-c-abl", {tf('zahl')});
      rein("#fl-c-vertrag", {t('juni')});
      raus("#fl-c-abl", {t('null') - 0.13:.3f}, 0.12);     // die Ablöse ist weg, ihre Quelle geht mit
      rein("#fl-c-frei", {t('null', 0.12)});"""
    schreibe_probe(LOOK, "Flach", MINZE, css, html_, js,
                   "Flach: echtes Foto verwandelt sich in die eigene Zeichnung; Geldbündel, gelbes Preisschild = "
                   "gesucht, runder Pinselstrich als Marker; Beat 2 mit Morph.")
    credits_ergaenzen(LOOK, lizenz_im_bild={
        "ort": (f"eigene Zeile {LUFT_LIZENZ} px unter dem Credit der Foto-Einlage, linksbündig an x = 108 "
                f"(y {lizenz_top}–{lizenz_top + 42}), geht mit dem Foto"),
        "schrift": f"Rubik 400, 34/42 px, Tinte {TINTE}",
        "von_s": 0, "bis_s": round(morph_aus + 0.2, 3),
        "foto_credits_s": [[0, round(morph_aus + 0.2, 3)]]},
        zeile_im_bild=LIZENZ_ZEILE_KURZ)
