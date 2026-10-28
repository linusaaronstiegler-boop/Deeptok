"""Probe „Atlas Nacht“ (studio/looks/atlas-nacht.md): Karte als Welt, beleuchtete Gegenstände.

Beat 1: Ein Münzstapel fällt auf Barcelona, „45 Mio. €“ in Gold, Unterstreichung.
Beat 2: Die Kamera fährt in 0,6 s zurück und nach Nordosten (Zoom-out-Enthüllung): Barcelona und
München stehen im selben Bild, die leuchtende Region wechselt von Spanien zu Deutschland (immer
nur eine). Auf München steht ein Geist-Stapel (gestrichelt, leer): Behalten bringt 0 € Ablöse.
Takt: ruhig, ein neues Element etwa alle 1,5 s, eine einzige Kamerafahrt.
"""
from __future__ import annotations

import json

from probe_basis import (CUE, DAUER, DATUM, HIER, NULL, Q_ABL, Q_FREI, Q_VERTRAG, ZAHL, clip,
                         credits_ergaenzen, dauer_ab, messen, pruefe_breiten, schreibe_probe,
                         strich_pfad, t, unterstrich, zufall)

LOOK = "atlas-nacht"
GOLD, CREME, NAVY = "#C9A84C", "#F5F0E8", "#0E1726"
SCHATTEN = "0 2px 18px rgba(14,23,38,.9), 0 0 4px rgba(14,23,38,.9)"


def muenzstapel(geist: bool = False) -> str:
    """7 Münzen, Fuß bei (180, 330) im eigenen Rahmen. Gold mit Creme-Lichtkante und Navy-Seite;
    als Geist nur gestrichelte Creme-Umrisse (leer: das Geld, das beim Behalten nicht kommt)."""
    teile = []
    for k in range(7):
        cx = 180 + zufall(k + 1, 5) * 9
        cy = 330 - 40 - k * 33
        rx, ry, dick = 150, 36, 30
        seite = (f"M{cx - rx:.1f} {cy:.1f} A{rx} {ry} 0 0 0 {cx + rx:.1f} {cy:.1f} L{cx + rx:.1f} {cy + dick} "
                 f"A{rx} {ry} 0 0 1 {cx - rx:.1f} {cy + dick} Z")
        if geist:
            strich = f'fill="none" stroke="{CREME}" stroke-opacity="0.8" stroke-width="4" stroke-dasharray="14 10"'
            teile.append(f'<path d="{seite}" {strich} /><ellipse cx="{cx:.1f}" cy="{cy}" rx="{rx}" ry="{ry}" {strich} />')
        else:
            teile.append(f'<path d="{seite}" fill="{GOLD}" /><path d="{seite}" fill="{NAVY}" fill-opacity="0.34" />'
                         f'<ellipse cx="{cx:.1f}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{GOLD}" />'
                         f'<path d="M{cx - rx + 8:.1f} {cy + 5} A{rx} {ry} 0 0 1 {cx + 30:.1f} {cy - ry + 1}" '
                         f'fill="none" stroke="{CREME}" stroke-opacity="0.55" stroke-width="3" stroke-linecap="round" />')
    return "".join(teile)


def atlas_nacht() -> None:
    karte = json.loads((HIER / "karte.json").read_text(encoding="utf-8"))
    w = karte["welt"]
    wb, wh = w["x1"] - w["x0"], w["y1"] - w["y0"]
    bx, by = karte["barcelona"]
    mx, my = karte["muenchen"]
    # Kamera 2 (Überblick): Maßstab 0,62, München landet bei (760, 700). Bildpunkt = s · Welt + t.
    s2 = 0.62
    m2 = (760, 700)
    t2 = (round(m2[0] - s2 * mx, 2), round(m2[1] - s2 * my, 2))
    b2 = (round(s2 * bx + t2[0], 1), round(s2 * by + t2[1], 1))

    m = messen(LOOK, {
        "zahl": (ZAHL, 'font: 900 173px/1 "DT Playfair"; letter-spacing: -0.02em; font-variant-numeric: lining-nums'),
        "null": (NULL, 'font: 900 173px/1 "DT Playfair"; letter-spacing: -0.02em; font-variant-numeric: lining-nums'),
        "ort": ("Barcelona", 'font: 600 48px/62px "DT Inter"'),
        "muc": ("München", 'font: 600 48px/62px "DT Inter"'),
        "bis": (f"bis {DATUM}", 'font: 600 48px/62px "DT Inter"'),
        "c1": (Q_ABL, 'font: 400 34px/42px "DT Inter"'),
        "c2": ("Karte: Natural Earth, gemeinfrei", 'font: 400 34px/42px "DT Inter"'),
        "c3": (Q_VERTRAG, 'font: 400 34px/42px "DT Inter"'),
        "c4": (Q_FREI, 'font: 400 34px/42px "DT Inter"'),
    })
    pruefe_breiten(LOOK, m)
    zt = 250                                               # Oberkante der Zahl
    gl = zt + m["zahl"]["grundlinie"]
    unter_a = strich_pfad("an-unter-a", unterstrich(102, gl + 0.09 * 173, 108 + m["zahl"]["breite"] + 14, 7), GOLD, 10)
    unter_b = strich_pfad("an-unter-b", unterstrich(102, gl + 0.09 * 173, 108 + m["null"]["breite"] + 14, 11), CREME, 10)

    fall, ort_a = t("bietet"), t("barcelona")
    aus_a = 5.40                                           # Beat 1 tritt zurück, bevor die Kamera fährt
    kamera = 5.65
    css = f"""    #an-welt {{ left: 0; top: 0; width: 1080px; height: 1920px; }}
    #an-kamera {{ position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; transform-origin: 0 0; }}
    .an-ebene {{ position: absolute; left: {w['x0']}px; top: {w['y0']}px; width: {wb}px; height: {wh}px; }}
    #an-deutschland {{ opacity: 0; }}
    .an-anker {{ position: absolute; width: 0; height: 0; }}
    #an-bcn {{ left: {bx}px; top: {by}px; }}
    #an-muc {{ left: {m2[0]}px; top: {m2[1]}px; }}
    .an-punkt {{ left: -18px; top: -18px; width: 36px; height: 36px; }}
    .an-punkt i {{ display: block; width: 36px; height: 36px; border-radius: 50%; background: {CREME}; border: 6px solid {NAVY}; }}
    .an-name {{ top: 30px; font: 600 48px/62px "DT Inter"; color: {CREME}; white-space: nowrap; text-shadow: {SCHATTEN}; }}
    #an-ort {{ left: {-m['ort']['breite'] / 2:.1f}px; }}
    #an-muc-name {{ left: {-m['muc']['breite'] / 2:.1f}px; }}
    #an-bis {{ left: {-m['bis']['breite'] / 2:.1f}px; top: 96px; }}
    .an-schatten {{ left: -200px; top: -34px; width: 400px; height: 68px; }}
    .an-stapel {{ left: -180px; top: -330px; width: 360px; height: 340px; }}
    .an-d1 {{ left: 108px; top: {zt}px; font: 900 173px/1 "DT Playfair"; letter-spacing: -0.02em; white-space: nowrap;
      font-variant-numeric: lining-nums; font-feature-settings: "lnum" 1; text-shadow: {SCHATTEN}; }}
    #an-zahl {{ color: {GOLD}; }}
    #an-null {{ color: {CREME}; }}
    .an-marker {{ left: 0; top: 0; width: 1080px; height: 1920px; }}
    .an-credit {{ right: 108px; text-align: right; font: 400 34px/42px "DT Inter"; color: rgba(245,240,232,.62); white-space: nowrap;
      text-shadow: {SCHATTEN}; }}"""
    weich = ('<defs><filter id="an-weich" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="7" /></filter></defs>'
             f'<ellipse cx="200" cy="34" rx="185" ry="22" fill="{NAVY}" fill-opacity="0.85" filter="url(#an-weich)" />')
    html_ = f"""    <!-- Welt: Karte bis an alle Ränder. Die Kamera bewegt nur die Karte; Orte, Stapel und Namen bleiben
         bildschirmgroß und wandern mit ihrem Ort mit (Anker). -->
    <div id="an-welt" class="clip" data-start="0" data-duration="{DAUER}" data-track-index="0" data-layout-allow-overflow>
      <div id="an-kamera">
        <img class="an-ebene" src="assets/karte.svg" alt="Karte Westeuropa" />
        <img id="an-spanien" class="an-ebene" src="assets/karte-spanien.svg" alt="Spanien leuchtet" />
        <img id="an-deutschland" class="an-ebene" src="assets/karte-deutschland.svg" alt="Deutschland leuchtet" />
      </div>
    </div>
    <div id="an-bcn" class="an-anker">
{clip('an-punkt', ort_a, fall + 0.55, 1, '<i></i>', klasse='an-punkt')}
{clip('an-schatten', fall, DAUER, 1, f'<svg width="400" height="68" viewBox="0 0 400 68">{weich}</svg>', klasse='an-schatten', attr='data-layout-allow-overflow')}
{clip('an-stapel', fall, DAUER, 3, f'<svg id="an-stapel-k" width="360" height="340" viewBox="0 0 360 340">{muenzstapel()}</svg>', klasse='an-stapel', attr='data-layout-allow-overflow')}
{clip('an-ort', t('barcelona', 0.12), DAUER, 2, 'Barcelona', klasse='an-name')}
    </div>
    <div id="an-muc" class="an-anker">
{clip('an-muc-punkt', t('bayern'), DAUER, 1, '<i></i>', klasse='an-punkt')}
{clip('an-geist', 6.80, DAUER, 3, f'<svg width="360" height="340" viewBox="0 0 360 340">{muenzstapel(geist=True)}</svg>', klasse='an-stapel', attr='data-layout-allow-overflow')}
{clip('an-muc-name', t('bayern', 0.12), DAUER, 2, 'München', klasse='an-name')}
{clip('an-bis', t('juni'), DAUER, 2, f'bis {DATUM}', klasse='an-name')}
    </div>
{clip('an-zahl', t('zahl'), aus_a + 0.2, 4, ZAHL, klasse='an-d1', attr='data-hold')}
{clip('an-null', t('null'), DAUER, 4, NULL, klasse='an-d1')}
{clip('an-marker-a', t('millionen'), aus_a + 0.2, 5, f'<svg width="1080" height="1920" viewBox="0 0 1080 1920">{unter_a}</svg>', klasse='an-marker', attr='data-layout-ignore')}
{clip('an-marker-b', t('euro_b'), DAUER, 5, f'<svg width="1080" height="1920" viewBox="0 0 1080 1920">{unter_b}</svg>', klasse='an-marker', attr='data-layout-ignore')}
{clip('an-c-karte', 0, DAUER, 6, 'Karte: Natural Earth, gemeinfrei', klasse='an-credit', stil='bottom: 616px')}
{clip('an-c-abl', t('zahl'), aus_a + 0.2, 7, Q_ABL, klasse='an-credit', stil='bottom: 658px')}
{clip('an-c-vertrag', t('juni'), DAUER, 6, Q_VERTRAG, klasse='an-credit', stil='bottom: 658px')}
{clip('an-c-frei', t('null'), DAUER, 8, Q_FREI, klasse='an-credit', stil='bottom: 700px')}"""
    js = f"""      // Beat 1 – Ort setzen: Punkt rastet ein, Name +0,12 s aus der Unschärfe (DESIGN.md §5, Atlas).
      tl.fromTo("#an-punkt i", {{ scale: 0 }}, {{ scale: 1, duration: 0.35, ease: "back.out(2.2)" }}, {ort_a});
      rein("#an-ort", {t('barcelona', 0.12)});
      // Fallen: Der Stapel fällt 560 px auf Barcelona, staucht beim Aufprall und federt zurück.
      tl.fromTo("#an-stapel-k", {{ y: -560 }}, {{ y: 0, duration: 0.42, ease: "power2.in" }}, {fall});
      tl.fromTo("#an-stapel-k", {{ scaleY: 1, transformOrigin: "50% 100%" }}, {{ scaleY: 0.84, duration: 0.07, ease: "power2.out", immediateRender: false }}, {fall + 0.42:.3f});
      tl.fromTo("#an-stapel-k", {{ scaleY: 0.84 }}, {{ scaleY: 1, duration: 0.3, ease: "back.out(3)", immediateRender: false }}, {fall + 0.49:.3f});
      tl.fromTo("#an-schatten svg", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.42, ease: "power2.in" }}, {fall});
      // Der Punkt geht, sobald ein Gegenstand auf dem Ort steht (der Fuß markiert den Ort).
      tl.fromTo("#an-punkt", {{ opacity: 1 }}, {{ opacity: 0, duration: 0.15, ease: "power2.in", immediateRender: false }}, {fall + 0.4:.3f});
      rein("#an-zahl", {t('zahl')});
      rein("#an-c-abl", {t('zahl')});
      zeichne("#an-marker-a .strich", {t('millionen')}, 0.35);
      // Übergang: Beat-1-Texte treten zurück, dann fährt die Kamera (0,6 s, power2.inOut) zum
      // Überblick Barcelona–München. Die Anker laufen mit derselben Kurve mit, so bleiben Stapel und
      // Namen auf ihrem Ort, obwohl sie bildschirmgroß bleiben.
      raus("#an-zahl", {aus_a});
      raus("#an-marker-a", {aus_a});
      raus("#an-c-abl", {aus_a});
      tl.fromTo("#an-kamera", {{ scale: 1, x: 0, y: 0 }}, {{ scale: {s2}, x: {t2[0]}, y: {t2[1]}, duration: 0.6, ease: "power2.inOut" }}, {kamera});
      tl.fromTo("#an-bcn", {{ x: 0, y: 0 }}, {{ x: {b2[0] - bx:.1f}, y: {b2[1] - by:.1f}, duration: 0.6, ease: "power2.inOut" }}, {kamera});
      // Genau eine Region leuchtet: Spanien geht während der Fahrt, Deutschland kommt am Ende.
      tl.fromTo("#an-spanien", {{ opacity: 1 }}, {{ opacity: 0, duration: 0.3, ease: "power1.inOut" }}, {kamera});
      tl.fromTo("#an-deutschland", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.3, ease: "power1.inOut" }}, {kamera + 0.3:.2f});
      // Beat 2: München setzen, Geist-Stapel (leer), Datum, „0 €“ in Creme mit Unterstreichung.
      tl.fromTo("#an-muc-punkt i", {{ scale: 0 }}, {{ scale: 1, duration: 0.35, ease: "back.out(2.2)" }}, {t('bayern')});
      rein("#an-muc-name", {t('bayern', 0.12)});
      rein("#an-geist", 6.80, 0.3);
      rein("#an-bis", {t('juni')});
      rein("#an-c-vertrag", {t('juni')});
      rein("#an-null", {t('null')});
      rein("#an-c-frei", {t('null')});
      zeichne("#an-marker-b .strich", {t('euro_b')}, 0.35);"""
    schreibe_probe(LOOK, "Atlas Nacht", NAVY, css, html_, js,
                   "Atlas Nacht: Karte als Welt, Münzstapel als Held, Gold = gesucht, Creme = gegeben; "
                   "Beat 2 mit Kamerafahrt Barcelona → München.")
    credits_ergaenzen(LOOK, [{
        "datei": "assets/karte.svg",
        "titel": "Natural Earth 1:50m Admin 0 – Countries (als TopoJSON: world-atlas@2.0.2)",
        "urheber": "Natural Earth (naturalearthdata.com)",
        "lizenz": "gemeinfrei (Public Domain)", "lizenz_art": "pd",
        "lizenz_url": "https://www.naturalearthdata.com/about/terms-of-use/",
        "quelle": karte["quelle"], "kurzlink": None, "original": karte["quelle"],
        "datum_commons": None, "datum_foto": None, "datum_objekt": None, "abgerufen": "2026-10-28",
        "einschraenkungen": [],
        "bearbeitung": "Lambert konform-konisch, Ausschnitt Westeuropa, Kartentöne und Regionen Spanien/"
                       "Deutschland aus studio/DESIGN.md (werkzeug/karte.mjs)",
        "lizenz_bearbeitung": "frei (Original ohne Lizenzauflage)",
        "credit_zeile": "Karte: Natural Earth, gemeinfrei",
        "inhalt": "Ort: Barcelona und München, die Strecke des Wechsels."}])
