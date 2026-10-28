"""Probe „Labor“ (studio/looks/labor.md): Werkbank mit grüner Schneidematte, echte Gegenstände.

Die Welt ist eine Schneidematte mit Zentimeter-Raster, von schräg oben gesehen (CSS-Perspektive,
25° geneigt), bis an alle Ränder. Darauf steht ein echter, freigestellter Gegenstand mit
Kontaktschatten. Beschriftet wird wie in der Werkstatt: Kreppband (gegeben) und orangefarbenes
Markierband (gesucht), Hinweislinien und Maßlinien linealgerade.
Beat 1: Münzstapel (Foto), Band „Barcelona“, Markierband „45 Mio. €“, Hinweislinie, Maßlinie.
Beat 2: Die Kamera fährt auf der Schiene 1100 px nach rechts (0,6 s): Dort ist der Platz leer,
nur vier Klebeband-Ecken markieren ihn. „bis 30.06.2023“, „0 €“, Hinweislinie in Orange.
Takt: ruhig; lange Halte, eine Kamerafahrt, keine Zooms.
"""
from __future__ import annotations

import math

from probe_basis import (DAUER, DATUM, NULL, Q_ABL, Q_FREI, Q_VERTRAG, ZAHL, bildmass, clip,
                         credits_aus, credits_ergaenzen, kurz, messen, pruefe_breiten, riss,
                         schreibe_probe, strich_pfad, t)

LOOK = "labor"
MATTE, RASTER, RASTER_GROSS, WEISS = "#22493E", "#3F6B5D", "#7FA89A", "#EEF3EF"
KREPP, TINTE, ORANGE, GRAU = "#E9DFC4", "#1B1F1C", "#FF7A2F", "#C9DCD3"
# Perspektive: Ebene 25° geneigt, Betrachter 1600 px vor der Bildmitte (540, 960).
NEIGUNG, P = math.radians(25), 1600.0
FUSS = 1140                                   # Bildzeile, auf der die Gegenstände stehen
FAHRT = 1100                                  # Kamerafahrt in Bildpixeln auf der Fußlinie


def ebene_y(sy: float) -> tuple[float, float]:
    """Bildzeile → (Ebenen-Y relativ zur Mitte, Maßstab dort). Umkehrung der Projektion
    sy = 960 + Y·cos θ · P / (P − Y·sin θ)."""
    d = sy - 960
    y = d * P / (math.cos(NEIGUNG) * P + d * math.sin(NEIGUNG))
    return y, P / (P - y * math.sin(NEIGUNG))


def matte_svg(b: int, h: int) -> str:
    """Schneidematte: 1-cm-Raster (60 px), alle 5 cm kräftiger, eine 45°-Linie, Zahlen am Rand."""
    teile = [f'<rect width="{b}" height="{h}" fill="{MATTE}" />']
    for k in range(0, b // 60 + 1):
        gross = k % 5 == 0
        teile.append(f'<line x1="{k * 60}" y1="0" x2="{k * 60}" y2="{h}" stroke="{RASTER_GROSS if gross else RASTER}" stroke-width="{3 if gross else 2}" />')
    for k in range(0, h // 60 + 1):
        gross = k % 5 == 0
        teile.append(f'<line x1="0" y1="{k * 60}" x2="{b}" y2="{k * 60}" stroke="{RASTER_GROSS if gross else RASTER}" stroke-width="{3 if gross else 2}" />')
    teile.append(f'<line x1="0" y1="{h - 600}" x2="{h - 600}" y2="0" stroke="{RASTER_GROSS}" stroke-width="2" />')
    zeile = 3300                                   # Zahlenreihe nahe am Betrachter (App-Zone)
    teile += [f'<text x="{k * 300 + 8}" y="{zeile - 10}" fill="{RASTER_GROSS}" font-family="LB Plex Cond" font-weight="600" font-size="40">{k * 5}</text>'
              for k in range(0, b // 300)]
    return "".join(teile)


def band(bid: str, inhalt: str, b: float, h: float, farbe: str, seed: int, drehung: float, stil: str) -> str:
    """Klebeband mit gerissenen Enden (links, rechts), leicht gedreht."""
    return (f'<div id="{bid}" class="lb-band" style="{stil} width: {b:.0f}px; height: {h:.0f}px; transform: rotate({drehung}deg)">'
            f'<div class="lb-band-flaeche" style="background: {farbe}; clip-path: {riss(b, h, seed, "lr", 7, 12)}"></div>'
            f'<div class="lb-band-text">{inhalt}</div></div>')


def ecke(x: float, y: float, dx: int, dy: int, lang: int = 70) -> list[tuple[float, float]]:
    return [(x + dx * lang, y), (x, y), (x, y + dy * lang)]


def labor() -> None:
    cr = credits_aus(LOOK).get("assets/fotos/muenzen.webp")
    if not cr:
        raise SystemExit("labor: credits.json fehlt (erst werkzeug/fotos.py)")
    zeilen_a = [cr["credit_zeile"].split(", commons")[0].replace(", bearbeitet", "") + ", freigestellt,", kurz(cr), Q_ABL]
    m = messen(LOOK, {
        "zahl": (ZAHL, 'font: 700 173px/1 "LB Plex Cond"; font-variant-numeric: lining-nums'),
        "null": (NULL, 'font: 700 173px/1 "LB Plex Cond"; font-variant-numeric: lining-nums'),
        "ort": ("Barcelona", 'font: 600 56px/1 "LB Plex Cond"'),
        "bis": (f"bis {DATUM}", 'font: 600 56px/1 "LB Plex Cond"'),
        **{f"c{i}": (z, 'font: 400 34px/42px "LB Plex Sans"') for i, z in enumerate(zeilen_a + [Q_VERTRAG, Q_FREI])},
    })
    pruefe_breiten(LOOK, m)
    # Gegenstand: Höhe 520 px (≥ 465 px, DESIGN.md §2), steht mittig bei x = 380 auf der Fußlinie.
    gb, gh = bildmass(LOOK, "assets/fotos/muenzen.webp")
    hoehe = 520
    breite = round(hoehe * gb / gh)
    mitte_x = 540
    obj_x, obj_y = mitte_x - breite / 2, FUSS - hoehe
    # Bänder: Kreppband 92 px hoch (Text 56 px), Markierband 220 px (Text 173 px).
    krepp_h, mark_h = 92, 220
    a_ort = (108, 214, m["ort"]["breite"] + 70)
    a_zahl = (108, 330, m["zahl"]["breite"] + 80)
    b_bis = (108, 214, m["bis"]["breite"] + 70)
    b_null = (108, 330, m["null"]["breite"] + 80)
    # Hinweislinie A: vom Markierband zum oberen Rand des Stapels; Maßlinie rechts am Stapel.
    hin_a = strich_pfad("lb-hin-a", [(a_zahl[0] + 220, a_zahl[1] + mark_h + 6), (a_zahl[0] + 220, obj_y - 46), (mitte_x - 20, obj_y + 30)],
                        WEISS, 3, zweite_spur=False, glaetten=False)
    mx = obj_x + breite + 44
    mass = (strich_pfad("lb-mass", [(mx, obj_y + 6), (mx, FUSS)], ORANGE, 6, zweite_spur=False, glaetten=False, kappe="butt")
            + strich_pfad("lb-mass-o", [(mx - 22, obj_y + 6), (mx + 22, obj_y + 6)], ORANGE, 6, zweite_spur=False, glaetten=False, kappe="butt")
            + strich_pfad("lb-mass-u", [(mx - 22, FUSS), (mx + 22, FUSS)], ORANGE, 6, zweite_spur=False, glaetten=False, kappe="butt"))
    # Beat 2: derselbe Platz nach der Fahrt (x wie A), leer; Ecken aus weißem Klebeband.
    x0, x1, y0 = obj_x + 10, obj_x + breite - 10, obj_y + hoehe * 0.35
    ecken = "".join(strich_pfad(f"lb-ecke-{i}", e, WEISS, 9, zweite_spur=False, glaetten=False, kappe="butt")
                    for i, e in enumerate([ecke(x0, y0, 1, 1), ecke(x1, y0, -1, 1), ecke(x0, FUSS, 1, -1), ecke(x1, FUSS, -1, -1)]))
    hin_b = strich_pfad("lb-hin-b", [(b_null[0] + 120, b_null[1] + mark_h + 6), (b_null[0] + 120, y0 - 40), (mitte_x, (y0 + FUSS) / 2)],
                        ORANGE, 5, zweite_spur=False, glaetten=False)
    # Ebene: 4400 × 4000, Mitte im Bild bei (540, 960); verschoben wird sie auf der „Schiene“.
    eb, eh = 4400, 4000
    _, massstab = ebene_y(FUSS)
    schiene = round(FAHRT / massstab, 1)           # Ebenen-Pixel, die 1100 Bildpixel auf der Fußlinie ergeben
    aus_a, fahrt = 5.40, 5.70
    css = f"""    #lb-welt {{ left: 0; top: 0; width: 1080px; height: 1920px; background: {MATTE}; }}
    #lb-buehne {{ position: absolute; inset: 0; perspective: {P:.0f}px; perspective-origin: 540px 960px; overflow: hidden; }}
    #lb-matte {{ position: absolute; left: {540 - 1500}px; top: {960 - eh // 2}px; width: {eb}px; height: {eh}px;
      transform: rotateX({math.degrees(NEIGUNG):.0f}deg); transform-origin: 1500px {eh // 2}px; }}
    #lb-schiene {{ position: absolute; left: 0; top: 0; width: {eb}px; height: {eh}px; }}
    #lb-ding {{ position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; }}
    #lb-schatten {{ position: absolute; left: {mitte_x - breite * 0.62:.0f}px; top: {FUSS - 34}px; width: {breite * 1.24:.0f}px; height: 64px; }}
    #lb-objekt {{ position: absolute; left: {obj_x:.0f}px; top: {obj_y:.0f}px; width: {breite}px; height: {hoehe}px; }}
    .lb-band {{ position: absolute; transform-origin: 30% 50%; filter: drop-shadow(0 4px 5px rgba(10,24,20,.45)); }}
    .lb-band-flaeche {{ position: absolute; inset: 0; }}
    .lb-band-text {{ position: absolute; left: 34px; top: 0; height: 100%; display: flex; align-items: center; color: {TINTE}; white-space: nowrap; }}
    .lb-klein .lb-band-text {{ font: 600 56px/1 "LB Plex Cond"; }}
    .lb-gross .lb-band-text {{ left: 40px; font: 700 173px/1 "LB Plex Cond"; font-variant-numeric: lining-nums; font-feature-settings: "lnum" 1; }}
    .lb-voll {{ left: 0; top: 0; width: 1080px; height: 1920px; }}
    .lb-credit {{ left: 108px; font: 400 34px/42px "LB Plex Sans"; color: {GRAU}; white-space: nowrap;
      text-shadow: 0 0 4px {MATTE}, 0 0 10px {MATTE}; }}   /* dunkler Hof in Mattenfarbe: Rasterlinien laufen nicht durch die Schrift */"""
    schatten = ('<svg width="100%" height="64" viewBox="0 0 100 64" preserveAspectRatio="none"><defs><filter id="lb-weich" x="-20%" y="-80%" width="140%" height="260%">'
                '<feGaussianBlur stdDeviation="5" /></filter></defs><ellipse cx="50" cy="34" rx="44" ry="13" fill="#07140F" fill-opacity="0.55" filter="url(#lb-weich)" /></svg>')
    html_ = f"""    <!-- Welt: Schneidematte in Perspektive bis an alle Ränder; die Kamera fährt auf der Schiene. -->
    <div id="lb-welt" class="clip" data-start="0" data-duration="{DAUER}" data-track-index="0" data-layout-allow-overflow data-hold>
      <div id="lb-buehne"><div id="lb-matte"><div id="lb-schiene"><svg width="{eb}" height="{eh}" viewBox="0 0 {eb} {eh}">{matte_svg(eb, eh)}</svg></div></div></div>
      <div id="lb-ding"><div id="lb-schatten">{schatten}</div>
        <img id="lb-objekt" src="assets/fotos/muenzen.webp" alt="Münzstapel, echtes Foto, freigestellt" /></div>
    </div>
{clip('lb-a-ort', t('barcelona'), aus_a + 0.2, 2, band('lb-a-ort-b', 'Barcelona', a_ort[2], krepp_h, KREPP, 3, -2, f'left: 0; top: 0;'), klasse='lb-klein', stil=f'left: {a_ort[0]}px; top: {a_ort[1]}px')}
{clip('lb-a-zahl', t('zahl'), aus_a + 0.2, 3, band('lb-a-zahl-b', ZAHL, a_zahl[2], mark_h, ORANGE, 5, 1, f'left: 0; top: 0;'), klasse='lb-gross', stil=f'left: {a_zahl[0]}px; top: {a_zahl[1]}px', attr='data-hold')}
{clip('lb-a-linien', t('zahl', 0.2), aus_a + 0.2, 4, f'<svg width="1080" height="1920" viewBox="0 0 1080 1920">{hin_a}{mass}</svg>', klasse='lb-voll', attr='data-layout-ignore')}
{clip('lb-c1', 0, aus_a + 0.2, 5, '<br />'.join(zeilen_a[:2]), klasse='lb-credit', stil='top: 1186px')}
{clip('lb-c2', t('zahl'), aus_a + 0.2, 6, Q_ABL, klasse='lb-credit', stil='top: 1270px')}
{clip('lb-b-ecken', t('bayern'), DAUER, 2, f'<svg width="1080" height="1920" viewBox="0 0 1080 1920">{ecken}</svg>', klasse='lb-voll', attr='data-layout-ignore')}
{clip('lb-b-bis', t('juni'), DAUER, 3, band('lb-b-bis-b', f'bis {DATUM}', b_bis[2], krepp_h, KREPP, 7, -1.5, f'left: 0; top: 0;'), klasse='lb-klein', stil=f'left: {b_bis[0]}px; top: {b_bis[1]}px')}
{clip('lb-b-null', t('null'), DAUER, 4, band('lb-b-null-b', NULL, b_null[2], mark_h, ORANGE, 9, 1.5, f'left: 0; top: 0;'), klasse='lb-gross', stil=f'left: {b_null[0]}px; top: {b_null[1]}px')}
{clip('lb-b-linie', t('euro_b'), DAUER, 5, f'<svg width="1080" height="1920" viewBox="0 0 1080 1920">{hin_b}</svg>', klasse='lb-voll', attr='data-layout-ignore')}
{clip('lb-c3', t('juni'), DAUER, 6, Q_VERTRAG, klasse='lb-credit', stil='top: 1186px')}
{clip('lb-c4', t('null'), DAUER, 7, Q_FREI, klasse='lb-credit', stil='top: 1228px')}"""
    js = f"""      // Kleben: ein Band wird angedrückt – kommt 4 % zu groß und 3° verdreht, sitzt nach 0,2 s.
      const klebe = (sel, t, r) => {{
        tl.fromTo(sel, {{ opacity: 0 }}, {{ opacity: 1, duration: 0.06, ease: "none" }}, t);
        tl.fromTo(sel, {{ scale: 1.04, rotation: r + 3 }}, {{ scale: 1, rotation: r, duration: 0.2, ease: "power3.out" }}, t);
      }};
      klebe("#lb-a-ort-b", {t('barcelona')}, -2);
      klebe("#lb-a-zahl-b", {t('zahl')}, 1);
      rein("#lb-c2", {t('zahl')});
      // Hinweislinie vom Band zum Stapel (0,3 s), dann die Maßlinie entlang der Höhe auf „Millionen“.
      zeichne("#lb-hin-a", {t('zahl', 0.2)}, 0.3, "power2.out");
      zeichne("#lb-mass-o", {t('millionen')}, 0.06, "none");
      zeichne("#lb-mass", {t('millionen', 0.05)}, 0.35, "power1.inOut");
      zeichne("#lb-mass-u", {t('millionen', 0.4)}, 0.06, "none");
      // Übergang: Bänder und Linien treten zurück, dann fährt die Kamera auf der Schiene nach rechts.
      // Die Matte verschiebt sich in ihrer eigenen Ebene (Perspektive bleibt richtig), der
      // Gegenstand um dieselben 1100 px auf seiner Fußlinie, mit derselben Kurve.
      ["#lb-a-ort", "#lb-a-zahl", "#lb-a-linien", "#lb-c1", "#lb-c2"].forEach((s) => raus(s, {aus_a}));
      tl.fromTo("#lb-schiene", {{ x: 0 }}, {{ x: {-schiene}, duration: 0.6, ease: "power2.inOut" }}, {fahrt});
      tl.fromTo("#lb-ding", {{ x: 0 }}, {{ x: {-FAHRT}, duration: 0.6, ease: "power2.inOut" }}, {fahrt});
      // Beat 2: der leere Platz, markiert mit vier Klebeband-Ecken.
      ["#lb-ecke-0", "#lb-ecke-1", "#lb-ecke-2", "#lb-ecke-3"].forEach((s, i) => zeichne(s, {t('bayern')} + 0.08 * i, 0.12, "power2.out"));
      klebe("#lb-b-bis-b", {t('juni')}, -1.5);
      rein("#lb-c3", {t('juni')});
      klebe("#lb-b-null-b", {t('null')}, 1.5);
      rein("#lb-c4", {t('null')});
      zeichne("#lb-hin-b", {t('euro_b')}, 0.35, "power2.out");"""
    schreibe_probe(LOOK, "Labor", MATTE, css, html_, js,
                   "Labor: Schneidematte in Perspektive, echter Gegenstand, Kreppband = gegeben, Markierband Orange = "
                   "gesucht, linealgerade Linien; Beat 2 mit Kamerafahrt auf der Schiene.")
    credits_ergaenzen(LOOK)
