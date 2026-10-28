"""Probe „Archiv-Duoton“ (studio/looks/archiv-duoton.md): eine Akte auf grauer Pappe.

Das Medium ist das Archiv selbst: Graupappe als Grund (mit sichtbarer Faser), Fotoabzüge in warmem
Schwarzweiß (Duoton Tinte → Papier) mit weißem Rand und Büroklammer, linierte Karteikarten, auf
denen getippt wird, ein Stempel in Violett für die gesuchte Größe und Anstreichungen am Rand mit
dem Kopierstift (schreibt ebenfalls violett). Kein Gold, keine Serife auf hellem Grund.
Beat 1: Abzug „Arc de Triomf“ (Library of Congress, ca. 1890–1906), Karte „Barcelona“ getippt,
Stempel „45 Mio. €“, Randstrich.
Beat 2 (Stapel): ein neuer Abzug legt sich darüber (Lewandowski 2019, echtes Spielfoto), eine neue
Karte gleitet auf die alte, „30.06.2023“ wird getippt, Stempel „0 €“, Randstrich.
Takt: ruhig, schwer; Tippen 22 Zeichen/s, Stempel 0,28 s, Abzüge 0,45 s.
"""
from __future__ import annotations

from probe_basis import (DAUER, DATUM, LOOKS, Q_ABL, Q_FREI, Q_VERTRAG, bildmass, clip,
                         credits_aus, credits_ergaenzen, kurz, messen, pruefe_breiten,
                         schreibe_probe, strich_pfad, t, zufall)

LOOK = "archiv-duoton"
PAPPE, PAPIER, TINTE, VIOLETT, LINIE, METALL = "#BDB2A0", "#F3EFE6", "#1E1B17", "#5B2C94", "#A9BCCB", "#8E9396"
TIPP = 1 / 22                                  # 22 Zeichen/s (docs/research/referenz-destillation.md)


def textur_erzeugen() -> None:
    """Graupappe (eigene Grafik): Grundton, weiche Wolken und kurze Fasern, fester Zufall.
    Die Faser ist im Handy-Blatt sichtbar (BANNED 9 verbietet nur unsichtbares Korn)."""
    import numpy as np
    from PIL import Image, ImageFilter
    ziel = LOOKS / f"probe-{LOOK}" / "assets" / "pappe.jpg"
    if ziel.exists():
        return
    rng = np.random.default_rng(1928)
    h, b = 960, 540
    wolke = Image.fromarray((rng.random((h // 24, b // 24)) * 255).astype("uint8")).resize((b, h), Image.BICUBIC)
    wolke = np.asarray(wolke.filter(ImageFilter.GaussianBlur(18)), float) / 255 - 0.5
    grund = np.array([0xBD, 0xB2, 0xA0], float)[None, None, :] + wolke[..., None] * 14
    flecken = rng.random((h, b))
    grund[flecken > 0.985] -= 26                    # dunkle Fasern
    grund[flecken < 0.012] += 20                    # helle Fasern
    bild = Image.fromarray(np.clip(grund, 0, 255).astype("uint8")).resize((1080, 1920), Image.BICUBIC)
    bild = bild.filter(ImageFilter.GaussianBlur(0.6))
    bild.save(ziel, quality=82, optimize=True, progressive=True)


def stempel_maske() -> None:
    """Maske für Stempelfarbe: fast deckend, mit kleinen Fehlstellen wie bei echtem Gummistempel."""
    import numpy as np
    from PIL import Image, ImageFilter
    ziel = LOOKS / f"probe-{LOOK}" / "assets" / "stempel-maske.png"
    if ziel.exists():
        return
    rng = np.random.default_rng(1995)
    a = rng.random((120, 400))
    a = np.asarray(Image.fromarray((a * 255).astype("uint8")).resize((800, 240), Image.BICUBIC)
                   .filter(ImageFilter.GaussianBlur(1.2)), float) / 255
    alpha = np.where(a < 0.33, 0.25, 1.0)
    bild = np.zeros((240, 800, 4), "uint8")
    bild[..., 3] = (alpha * 255).astype("uint8")
    Image.fromarray(bild, "RGBA").save(ziel, optimize=True)


def klammer(x: float, y: float, drehung: float) -> str:
    """Büroklammer als Drahtschleife (eigene Zeichnung)."""
    d = "M18 150 L18 30 Q18 6 40 6 Q62 6 62 30 L62 130 Q62 146 48 146 Q34 146 34 130 L34 40"
    return (f'<svg class="ad-klammer" style="left:{x}px;top:{y}px;transform:rotate({drehung}deg)" width="80" height="160" viewBox="0 0 80 160">'
            f'<path d="{d}" fill="none" stroke="{METALL}" stroke-width="7" stroke-linecap="round" />'
            f'<path d="{d}" fill="none" stroke="#D6D9DB" stroke-width="2" stroke-linecap="round" transform="translate(-1.5 -1.5)" /></svg>')


def tippen(text: str, klasse: str) -> str:
    return "".join(f'<span class="{klasse}">{z if z != " " else "&nbsp;"}</span>' for z in text)


def randstrich(pid: str, x: float, y0: float, y1: float, seed: int) -> str:
    """Anstreichung am Rand mit dem Kopierstift: zwei senkrechte Striche, von Hand."""
    zug = lambda dx, s: [(x + dx + zufall(i + s, seed) * 2.5, y0 + (y1 - y0) * i / 6) for i in range(7)]
    return (strich_pfad(pid, zug(0, 1), VIOLETT, 7, zweite_spur=False)
            + strich_pfad(f"{pid}-2", zug(14, 9), VIOLETT, 7, zweite_spur=False))


def archiv_duoton() -> None:
    textur_erzeugen()
    stempel_maske()
    cr = credits_aus(LOOK)
    arc, lew = cr.get("assets/fotos/arc.jpg"), cr.get("assets/fotos/lewandowski.jpg")
    if not arc or not lew:
        raise SystemExit("archiv-duoton: credits.json fehlt (erst werkzeug/fotos.py)")
    arc_zeilen = ["Foto: Photoglob Co., ca. 1890–1906,", "gemeinfrei, bearbeitet,", kurz(arc)]
    lew_zeilen = ["Foto: Steffen Prößdorf, 2019,", "CC BY-SA 4.0, bearbeitet,", kurz(lew)]
    m = messen(LOOK, {
        "ort": ("Barcelona", 'font: 800 124px/1 "AD Franklin"'),
        "datum": (DATUM, 'font: 800 124px/1 "AD Franklin"; font-variant-numeric: lining-nums'),
        "bis": ("Vertrag bis", 'font: 600 56px/1 "AD Franklin"'),
        # Im Stempel: Zahl 173 px, Einheit 124 px auf derselben Grundlinie (ganz in 173 px wäre
        # „45 Mio. €“ in Franklin 800 breiter als die Karte).
        "z45": ("45", 'font: 800 173px/1 "AD Franklin"; font-variant-numeric: lining-nums'),
        "z0": ("0", 'font: 800 173px/1 "AD Franklin"; font-variant-numeric: lining-nums'),
        "mio": ("\u00a0Mio.\u00a0€", 'font: 800 124px/1 "AD Franklin"'),
        "eur": ("\u00a0€", 'font: 800 124px/1 "AD Franklin"'),
        **{f"c{i}": (z, 'font: 400 34px/42px "AD Franklin"') for i, z in enumerate(arc_zeilen + lew_zeilen + [Q_ABL, Q_VERTRAG, Q_FREI])},
    })
    m["zahl"] = {"breite": m["z45"]["breite"] + m["mio"]["breite"]}
    m["null"] = {"breite": m["z0"]["breite"] + m["eur"]["breite"]}
    pruefe_breiten(LOOK, m)
    # Die Herkunft steht auf dem Rand des Abzugs: Zeilen nicht breiter als das Foto.
    pruefe_breiten(LOOK, {k: m[k] for k in ("c0", "c1", "c2", "c3", "c4", "c5")}, 700)
    if m["zahl"]["breite"] + 2 * 34 > 864 - 40:
        raise SystemExit("archiv-duoton: Stempel zu breit für die Karte")
    # Abzüge: Foto mit 22 px Papierrand und 110 px Rand unten für die getippte Herkunft.
    ab, ah = bildmass(LOOK, "assets/fotos/arc.jpg")
    a1_b = 720
    a1_h = round(a1_b * ah / ab)
    lb, lh = bildmass(LOOK, "assets/fotos/lewandowski.jpg")
    # Abzug 2 bekommt dasselbe Bildfeld wie Abzug 1 (object-fit: cover) und landet genau darauf:
    # Der untere Abzug ist dann ganz verdeckt und endet beim Landen (keine halb sichtbaren Credits).
    a2_b, a2_h = a1_b, a1_h
    karte_y, karte_h = 860, 450
    stempel_b = round(m["zahl"]["breite"] + 2 * 34)
    null_b = round(m["null"]["breite"] + 2 * 34)
    rand_a = randstrich("ad-rand-a", 14, 168, 380, 3)
    rand_b = randstrich("ad-rand-b", 836, 226, 430, 7)
    css = f"""    #ad-grund {{ left: 0; top: 0; width: 1080px; height: 1920px; background: {PAPPE} url(assets/pappe.jpg) 0 0 / 1080px 1920px; }}
    .ad-abzug {{ background: {PAPIER}; padding: 22px 22px 0 22px; filter: drop-shadow(0 10px 14px rgba(30,27,23,.38)); }}
    .ad-abzug img {{ display: block; }}
    .ad-herkunft {{ height: 152px; padding-top: 16px; font: 400 34px/42px "AD Franklin"; color: {TINTE}; white-space: nowrap; }}
    #ad-a1 {{ left: 150px; top: 158px; width: {a1_b + 44}px; transform: rotate(-2.2deg); }}
    #ad-a1 img {{ width: {a1_b}px; height: {a1_h}px; }}
    #ad-a2 {{ left: 150px; top: 158px; width: {a2_b + 44}px; }}
    #ad-a2-innen {{ transform: rotate(-1.2deg); }}
    #ad-a2 img {{ width: {a2_b}px; height: {a2_h}px; object-fit: cover; }}
    .ad-klammer {{ position: absolute; }}
    .ad-karte {{ left: 108px; top: {karte_y}px; width: 864px; height: {karte_h}px; }}
    .ad-karte-papier {{ position: absolute; inset: 0; background: {PAPIER};
      background-image: repeating-linear-gradient(to bottom, transparent 0 54px, {LINIE} 54px 56px);
      background-position: 0 92px; filter: drop-shadow(0 6px 9px rgba(30,27,23,.35)); }}
    .ad-gross {{ position: absolute; left: 30px; font: 800 124px/1 "AD Franklin"; color: {TINTE}; white-space: nowrap;
      font-variant-numeric: lining-nums; }}
    .ad-klein {{ position: absolute; left: 30px; font: 600 56px/1 "AD Franklin"; color: {TINTE}; white-space: nowrap; }}
    .ad-quelle {{ position: absolute; left: 30px; font: 400 34px/42px "AD Franklin"; color: {TINTE}; white-space: nowrap; }}
    .ad-stempel {{ position: absolute; color: {VIOLETT}; border: 6px solid {VIOLETT}; outline: 2px solid {VIOLETT}; outline-offset: -16px;
      padding: 14px 28px; font: 800 173px/1 "AD Franklin"; white-space: nowrap; font-variant-numeric: lining-nums;
      -webkit-mask-image: url(assets/stempel-maske.png); mask-image: url(assets/stempel-maske.png);
      -webkit-mask-size: 100% 100%; mask-size: 100% 100%; }}
    .ad-einheit {{ font-size: 124px; }}
    .ad-marker {{ position: absolute; left: 0; top: 0; width: 864px; height: {karte_h}px; overflow: visible; }}"""
    html_ = f"""    <!-- Welt: Graupappe bis an alle Ränder; darauf liegen Abzüge und Karteikarten wie in einer Akte. -->
{clip('ad-grund', 0, DAUER, 0, '', attr='data-layout-allow-overflow data-hold')}
    <div id="ad-a1" class="clip ad-abzug" data-start="0" data-duration="{t('bayern', 0.45)}" data-track-index="1">
      <img src="assets/fotos/arc.jpg" alt="Arc de Triomf in Barcelona, Photochrom ca. 1890–1906, als Schwarzweiß-Abzug" />
      <div class="ad-herkunft">{'<br />'.join(arc_zeilen)}</div>
    </div>
    <div id="ad-k1" class="clip ad-karte" data-start="0" data-duration="{t('juni', 0.45)}" data-track-index="2" data-layout-allow-overflow>
      <div class="ad-karte-papier"></div>
      <div class="ad-gross" style="top: 26px">{tippen("Barcelona", "ad-z1")}</div>
      <div id="ad-s1" class="ad-stempel" style="left: 34px; top: 160px; transform: rotate(-4deg)">45<span class="ad-einheit">\u00a0Mio.\u00a0€</span></div>
      <div id="ad-q1" class="ad-quelle" style="top: {karte_h - 54}px">{Q_ABL}</div>
      <svg class="ad-marker" viewBox="0 0 864 {karte_h}">{rand_a}</svg>
    </div>
    <div id="ad-a2" class="clip ad-abzug" data-start="{t('bayern')}" data-duration="{DAUER - t('bayern'):.3f}" data-track-index="3" data-layout-allow-overflow data-layout-allow-overlap data-layout-allow-occlusion>
      <div id="ad-a2-innen">
        <img src="assets/fotos/lewandowski.jpg" alt="Robert Lewandowski im Spiel für den FC Bayern, 2019, Schwarzweiß-Abzug" />
        <div class="ad-herkunft">{'<br />'.join(lew_zeilen)}</div>
      </div>
    </div>
    <div id="ad-k2" class="clip ad-karte" data-start="{t('juni')}" data-duration="{DAUER - t('juni'):.3f}" data-track-index="4" data-layout-allow-overflow data-layout-allow-overlap data-layout-allow-occlusion>
      <div id="ad-k2-innen" style="position:absolute;inset:0">
        <div class="ad-karte-papier"></div>
        <div class="ad-klein" style="top: 22px">Vertrag bis</div>
        <div class="ad-gross" style="top: 88px">{tippen(DATUM, "ad-z2")}</div>
        <div id="ad-s2" class="ad-stempel" style="left: {800 - null_b}px; top: 226px; transform: rotate(5deg)">0<span class="ad-einheit">\u00a0€</span></div>
        <div class="ad-quelle" style="top: {karte_h - 96}px">{Q_VERTRAG}<br />{Q_FREI}</div>
        <svg class="ad-marker" viewBox="0 0 864 {karte_h}">{rand_b}</svg>
      </div>
    </div>
{clip('ad-klammern', 0, DAUER, 5, klammer(205, 142, -8), stil='left:0;top:0;width:1080px;height:1920px', attr='data-layout-ignore')}"""
    js = f"""      // Tippen: Zeichen für Zeichen, 22 Zeichen/s (Simplicissimus/Nike tippen 10–26 Zeichen/s).
      tl.fromTo(".ad-z1", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.001, ease: "none", stagger: {TIPP:.4f} }}, {t('barcelona')});
      // Stempel: kommt 1,6-fach groß und −6° gedreht, sitzt nach 0,28 s (DESIGN.md §6, Stempel).
      const stemple = (sel, t, r) => {{
        tl.fromTo(sel, {{ opacity: 0 }}, {{ opacity: 1, duration: 0.001, ease: "none" }}, t);
        tl.fromTo(sel, {{ scale: 1.6, rotation: r - 6 }}, {{ scale: 1, rotation: r, duration: 0.28, ease: "back.out(2.2)" }}, t);
      }};
      stemple("#ad-s1", {t('zahl')}, -4);
      hart("#ad-q1", {t('zahl')});
      zeichne("#ad-rand-a, #ad-rand-a-2", {t('millionen')}, 0.3, "power1.inOut");
      // Stapel: ein neuer Abzug gleitet von rechts auf die Akte (0,45 s expo.out, Drehung 7° → 2,5°).
      tl.fromTo("#ad-a2-innen", {{ x: 900, rotation: 7 }}, {{ x: 0, rotation: -1.2, duration: 0.45, ease: "expo.out" }}, {t('bayern')});
      // Eine neue Karte gleitet von links auf die alte; dann wird das Datum getippt.
      tl.fromTo("#ad-k2-innen", {{ x: -1000, rotation: -4 }}, {{ x: 0, rotation: 0.4, duration: 0.45, ease: "expo.out" }}, {t('juni')});
      tl.fromTo(".ad-z2", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.001, ease: "none", stagger: {TIPP:.4f} }}, {t('juni', 0.42)});
      stemple("#ad-s2", {t('null')}, 5);
      zeichne("#ad-rand-b, #ad-rand-b-2", {t('euro_b')}, 0.3, "power1.inOut");"""
    schreibe_probe(LOOK, "Archiv-Duoton", PAPPE, css, html_, js,
                   "Archiv: Akte auf Graupappe, Abzüge Tinte → Papier, getippte Karteikarten, Stempel Violett = gesucht, "
                   "Kopierstift-Randstrich als Marker; Beat 2 als Stapel.")
    credits_ergaenzen(LOOK)          # Pappe, Klammer und Stempelmaske sind eigene Grafik (kein Credit)
