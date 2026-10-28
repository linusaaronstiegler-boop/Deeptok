"""Probe „Zeitungspapier“ (studio/looks/zeitungspapier.md): Collage auf Zeitungspapier.

Das Medium ist die Zeitungsseite: graues Papier bis an alle Ränder, echte Bilder im Rasterdruck,
ausgerissen und aufgeklebt, Schlagzeilen als Papierstreifen, Zahlen auf schwarzen Balken, ein
Rotstift. Der Bildnachweis läuft senkrecht an der Kante des Bildes, wie in der Zeitung.
Seite 1: ein echter Clip (volles Camp Nou 2022, Live-Situation) läuft im Rasterdruck, Streifen
„Barcelona“, Balken „45 Mio. €“, Rotstift-Kreis ganz auf Papier.
Seite 2 (harter Schnitt auf „Bayern“): echtes Spielfoto von Lewandowski (FC Bayern, 2019),
Streifen „bis 30.06.2023“ mit roter Unterstreichung, Balken „0 € Ablöse“.
Takt: dicht; alle 0,5–0,7 s klebt ein neues Stück, Seitenwechsel als harter Schnitt.
Lizenz: Beide Seiten zeigen Bearbeitungen von CC-BY-SA-Fotos, also steht die ganze Probe unter
CC BY-SA 4.0. Die Lizenzzeile läuft wie ein Rechte-Vermerk senkrecht am rechten Seitenrand, in der
Schrift des Bildnachweises und über beide Seiten (0–12 s). In die Bildnachweis-Spalten passt sie
nicht: Sie ist 988 px lang, das Bild auf Seite 1 ist deutlich kürzer, und die Spalten fassen höchstens
5 Zeilen.
"""
from __future__ import annotations

import json
import subprocess

from probe_basis import (DAUER, DATUM, HIER, LIZENZ_ZEILE, LOOKS, Q_ABL, Q_FREI, Q_VERTRAG, ZAHL, bildmass,
                         clip, credits_aus, credits_ergaenzen, html_attr, kreis, kurz, messen,
                         pruefe_breiten, riss, schreibe_probe, strich_pfad, t, unterstrich)

LOOK = "zeitungspapier"
GRUND, PAPIER, TINTE, GRAU, ROT = "#E4DFD1", "#F4F1E8", "#161514", "#5E5A52", "#B8161D"
# Rechter Seitenrand für die Lizenzzeile (eine Zeile, 42 px breit, bis x = 972). Alles andere bleibt
# links von RAND_X − RAND_LUFT, auch der Rotstift-Kreis; die Luft trennt sie sichtbar vom Bildnachweis.
RAND_X, RAND_LUFT, LIZENZ_UNTEN = 930, 28, 1316


def videomass(look: str, datei: str) -> tuple[int, int]:
    """Breite und Höhe eines Clips (ffprobe)."""
    aus = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                          "-of", "csv=p=0", str(LOOKS / f"probe-{look}" / datei)], capture_output=True, text=True, check=True)
    b, h = aus.stdout.strip().split(",")[:2]
    return int(b), int(h)


def senkrecht(sid: str, zeilen: list[str], x: float, unten: float, laenge: float, start: float,
              ende: float, spur: int, *, pruefen: bool = False) -> str:
    """Bildnachweis senkrecht an der Bildkante (liest sich von unten nach oben, wie in der Zeitung).
    Der Block ist waagerecht gesetzt und um −90° um seine linke obere Ecke gedreht.
    pruefen=True lässt die Layout-Prüfung von check an den Block (die Lizenzzeile steht 12 s)."""
    inhalt = "<br />".join(zeilen)
    # Credits, die kürzer stehen als die Lesezeit für Lesetext: von line_unread ausgenommen.
    ignorieren = "" if pruefen else " data-layout-ignore"
    return (f'    <div id="{sid}" class="clip zp-senkrecht" data-start="{start}" data-duration="{round(ende - start, 3)}" '
            f'data-track-index="{spur}" style="left: {x}px; top: {unten}px; width: {laenge:.0f}px"'
            f'{ignorieren}>{inhalt}</div>')


def stueck(sid: str, b: float, h: float, x: float, y: float, drehung: float, seed: int, inhalt: str) -> str:
    """Ein ausgerissenes, aufgeklebtes Bildstück (oben und unten gerissen, Schlagschatten)."""
    # Stücke dürfen über den Bildrand hinausragen (randabfallend geklebt).
    return (f'<div id="{sid}" class="zp-stueck" style="left: {x}px; top: {y}px; width: {b:.0f}px; height: {h:.0f}px; transform: rotate({drehung}deg)" data-layout-allow-overflow>'
            f'<div class="zp-riss" style="clip-path: {riss(b, h, seed, "ou", 10, 18)}"><div id="{sid}-kamera" class="zp-kamera">{inhalt}</div></div></div>')


def streifen(sid: str, text: str, b: float, h: float, x: float, y: float, seed: int) -> str:
    return (f'<div id="{sid}" class="zp-streifen" style="left: {x}px; top: {y}px; width: {b:.0f}px; height: {h}px">'
            f'<div id="{sid}-innen" class="zp-streifen-innen"><div class="zp-papier" style="clip-path: {riss(b, h, seed, "lr", 9, 14)}"></div>'
            f'<div class="zp-schlagzeile">{text}</div></div></div>')


def zeitungspapier() -> None:
    cr = credits_aus(LOOK)
    fans, lew = cr.get("assets/fotos/fans-2022.mp4"), cr.get("assets/fotos/lewandowski.png")
    ersatz = cr.get("assets/fotos/camp-nou.jpg")
    if not lew or not (fans or ersatz):
        raise SystemExit("zeitungspapier: credits.json fehlt (erst werkzeug/fotos.py)")
    clip_da = bool(fans) and (LOOKS / f"probe-{LOOK}" / "assets/fotos/fans-2022.mp4").exists()
    if clip_da:
        zeilen_a = ["Video: Jove, 2022,", "CC BY-SA 4.0, bearbeitet,", kurz(fans), Q_ABL]
    else:                                         # Ersatz: dasselbe Stadion als Foto
        zeilen_a = ["Foto: Luis Miguel Bugallo Sánchez,", "2014, CC BY-SA 3.0, bearbeitet,", kurz(ersatz), Q_ABL]
    zeilen_b = ["Foto: Steffen Prößdorf, 2019,", "CC BY-SA 4.0, bearbeitet,", kurz(lew), Q_VERTRAG, Q_FREI]
    balken_b_text = "0 € Ablöse"
    m = messen(LOOK, {"kopf": ("Barcelona", 'font: 400 124px/1 "ZP Anton"'),
                      "bis": (f"bis {DATUM}", 'font: 400 124px/1 "ZP Anton"'),
                      "datum": (DATUM, 'font: 400 124px/1 "ZP Anton"'),
                      "bis_wort": ("bis ", 'font: 400 124px/1 "ZP Anton"'),
                      "zahl": (ZAHL, 'font: 400 150px/1 "ZP Anton"'),
                      "null": (balken_b_text, 'font: 400 150px/1 "ZP Anton"'),
                      **{f"c{i}": (z, 'font: 400 34px/42px "ZP Source Serif"') for i, z in enumerate(zeilen_a + zeilen_b)}})
    pruefe_breiten(LOOK, m)
    # Die Lizenzzeile steht senkrecht: Sie muss nur in die Höhe des Lesefensters passen (168–1330).
    lizenz_lang = messen(LOOK, {"l": (LIZENZ_ZEILE, 'font: 400 34px/42px "ZP Source Serif"')})["l"]["breite"]
    if LIZENZ_UNTEN - lizenz_lang < 168:
        raise SystemExit(f"zeitungspapier: Lizenzzeile {lizenz_lang:.0f} px zu lang für den Seitenrand")
    # Rasterdruck (HyperFrames „Monochrome Screen Print“). Zelle 0,16 statt 0,3: Bei 0,3 war das
    # Spielfoto nur noch Punktmuster (Gesicht, Trikot, Ball nicht zu erkennen); 0,16 ist im
    # Handy-Blatt noch als Raster sichtbar und lässt die Person erkennen.
    behandlung = json.loads((HIER / "zeitung-raster.json").read_text(encoding="utf-8"))["data-color-grading"]
    behandlung["effects"]["monoScreenSize"] = 0.16
    raster = html_attr(behandlung)
    schnitt = t("bayern")                      # harter Schnitt auf das Nomen der neuen Sache
    # --- Seite 1: Clip als Held, links; Bildnachweis senkrecht rechts daneben ---------------------
    vb, vh = (videomass(LOOK, "assets/fotos/fans-2022.mp4") if clip_da
              else bildmass(LOOK, "assets/fotos/camp-nou.jpg"))
    # Bild so breit, dass Bildnachweis-Spalte und Lizenzzeile rechts daneben Platz haben (höchstens 800).
    v_b = min(800, RAND_X - RAND_LUFT - 22 - 42 * len(zeilen_a) + 20)
    v_h = round(v_b * vh / vb)
    v_x, v_y = -20, 330
    spalte_a = v_x + v_b + 22                  # senkrechte Credits: 4 Zeilen à 42 px
    kopf_b, kopf_h = round(m["kopf"]["breite"] + 80), 160
    bal_b, bal_h = round(m["zahl"]["breite"] + 60), 190
    bal_y = min(v_y + v_h + 80, 1300 - 190 - 34)
    # Der Rotstift-Kreis ragt rechts über den Balken hinaus; er endet vor der Lizenzzeile (10 px Strich).
    ring_dx = max(x for x, _ in kreis(0, 0, bal_b / 2 + 34, bal_h / 2 + 34, 4)) + 5
    bal_x = round(RAND_X - RAND_LUFT - ring_dx - bal_b / 2)
    ring = strich_pfad("zp-ring", kreis(bal_x + bal_b / 2, bal_y + bal_h / 2 + 2, bal_b / 2 + 34, bal_h / 2 + 34, 4), ROT, 10)
    # --- Seite 2: Spielfoto links, Streifen oben, Balken unten rechts -------------------------------
    # Seite 2: der Spieler als ausgeschnittene Figur (Collage), 880 px hoch, links.
    lb, lh = bildmass(LOOK, "assets/fotos/lewandowski.png")
    l_h = 820
    l_b = round(l_h * lb / lh)
    l_x, l_y = 70, 372
    spalte_b = l_x + l_b + 30                   # Credit-Spalte rechts der Figur, endet über dem Balken
    bis_b = round(m["bis"]["breite"] + 80)
    bis_x, bis_y = 64, 196
    gl = bis_y + 18 + 0.82 * 124               # Anton: Grundlinie ≈ 0,82 em unter der Oberkante
    dat_x0 = bis_x + 40 + m["bis_wort"]["breite"]
    unter = strich_pfad("zp-unter", unterstrich(dat_x0 - 6, gl + 20, dat_x0 + m["datum"]["breite"] + 10, 6), ROT, 10)
    nul_b = round(m["null"]["breite"] + 60)
    nul_x, nul_y = RAND_X - RAND_LUFT - 8 - nul_b, 1112      # 8 px für die Drehung (1,2°)
    spalte_b_laenge = 680
    css = f"""    #zp-grund {{ left: 0; top: 0; width: 1080px; height: 1920px; background: {GRUND}; }}
    .zp-stueck {{ position: absolute; filter: drop-shadow(0 10px 16px rgba(22,21,20,.35)); }}
    .zp-riss {{ position: absolute; inset: 0; overflow: hidden; }}
    .zp-kamera {{ position: absolute; inset: 0; }}
    .zp-kamera video, .zp-kamera img {{ position: absolute; left: 0; top: 0; width: 100%; height: 100%; object-fit: cover; }}
    .zp-streifen {{ position: absolute; filter: drop-shadow(0 6px 10px rgba(22,21,20,.35)); }}
    .zp-streifen-innen {{ position: absolute; inset: 0; }}
    .zp-papier {{ position: absolute; inset: 0; background: {PAPIER}; }}
    .zp-schlagzeile {{ position: absolute; left: 40px; top: 18px; font: 400 124px/1 "ZP Anton"; color: {TINTE}; white-space: nowrap; }}
    .zp-balken {{ height: {bal_h}px; filter: drop-shadow(0 6px 10px rgba(22,21,20,.4)); }}
    .zp-balken-flaeche {{ position: absolute; inset: 0; background: {TINTE}; }}
    .zp-balken-text {{ position: absolute; left: 30px; top: 0; font: 400 150px/{bal_h}px "ZP Anton"; color: {PAPIER}; white-space: nowrap; }}
    .zp-senkrecht {{ height: auto; transform: rotate(-90deg); transform-origin: 0 0; font: 400 34px/42px "ZP Source Serif"; color: {GRAU}; white-space: nowrap; }}
    .zp-voll {{ left: 0; top: 0; width: 1080px; height: 1920px; }}
    .zp-figur {{ filter: drop-shadow(0 10px 14px rgba(22,21,20,.35)); }}
    .zp-figur img {{ width: 100%; height: 100%; display: block; }}"""
    if clip_da:
        video = (f'<video id="zp-clip" class="clip" data-start="0" data-duration="{schnitt}" data-track-index="1" muted playsinline '
                 f'src="assets/fotos/fans-2022.mp4" data-color-grading="{raster}"></video>')
    else:
        video = (f'<img id="zp-clip" class="clip" data-start="0" data-duration="{schnitt}" data-track-index="1" '
                 f'src="assets/fotos/camp-nou.jpg" data-color-grading="{raster}" alt="Camp Nou: Ränge mit Més que un club, Spielfeld" />')
    foto = (f'<img id="zp-figur-bild" src="assets/fotos/lewandowski.png" data-color-grading="{raster}" '
            f'alt="Robert Lewandowski im Spiel für den FC Bayern, 2019, ausgeschnitten" />')
    html_ = f"""    <!-- Welt: Zeitungspapier bis an alle Ränder. Jede Seite ist eine eigene Collage. -->
{clip('zp-grund', 0, DAUER, 0, '', attr='data-layout-allow-overflow')}
    {stueck('zp-v', v_b, v_h, v_x, v_y, -1.5, 3, video)}
{senkrecht('zp-c-a', zeilen_a, spalte_a, v_y + v_h, v_h, 0, schnitt, 6)}
{clip('zp-kopf', t('barcelona'), schnitt, 2, streifen('zp-kopf-s', 'Barcelona', kopf_b, kopf_h, 0, 0, 9), stil=f'left: 64px; top: 196px; width: {kopf_b}px; height: {kopf_h}px', attr='data-layout-allow-overflow')}
{clip('zp-balken-a', t('zahl'), schnitt, 3, f'<div id="zp-bal-a-fl" class="zp-balken-flaeche"></div><div id="zp-bal-a-tx" class="zp-balken-text">{ZAHL}</div>', klasse='zp-balken', stil=f'left: {bal_x}px; top: {bal_y}px; width: {bal_b}px; transform: rotate(-1.5deg)', attr='data-hold')}
{clip('zp-marker-a', t('millionen'), schnitt, 4, f'<svg width="1080" height="1920" viewBox="0 0 1080 1920">{ring}</svg>', klasse='zp-voll', attr='data-layout-ignore')}
{clip('zp-figur', schnitt, DAUER, 1, foto, klasse='zp-figur', stil=f'left: {l_x}px; top: {l_y}px; width: {l_b}px; height: {l_h}px')}
{senkrecht('zp-c-b', zeilen_b, spalte_b, l_y + spalte_b_laenge, spalte_b_laenge, schnitt, DAUER, 6)}
    <!-- Lizenz der ganzen Probe: Rechte-Vermerk am Seitenrand, über beide Seiten. -->
{senkrecht('zp-lizenz', [LIZENZ_ZEILE], RAND_X, LIZENZ_UNTEN, lizenz_lang + 2, 0, DAUER, 7, pruefen=True)}
{clip('zp-bis', t('juni'), DAUER, 2, streifen('zp-bis-s', f'bis {DATUM}', bis_b, kopf_h, 0, 0, 11), stil=f'left: {bis_x}px; top: {bis_y}px; width: {bis_b}px; height: {kopf_h}px', attr='data-layout-allow-overflow')}
{clip('zp-marker-b', t('jahr'), DAUER, 4, f'<svg width="1080" height="1920" viewBox="0 0 1080 1920">{unter}</svg>', klasse='zp-voll', attr='data-layout-ignore')}
{clip('zp-balken-b', t('null'), DAUER, 3, f'<div id="zp-bal-b-fl" class="zp-balken-flaeche"></div><div id="zp-bal-b-tx" class="zp-balken-text">{balken_b_text}</div>', klasse='zp-balken', stil=f'left: {nul_x}px; top: {nul_y}px; width: {nul_b}px; transform: rotate(1.2deg)')}"""
    js = f"""      // Ausschnitt: ein Zeitungsstreifen kommt von außerhalb an seinen Platz (6° → 2°, 0,55 s).
      tl.fromTo("#zp-kopf-s-innen", {{ x: -760, rotation: 6 }}, {{ x: 0, rotation: 2, duration: 0.55, ease: "expo.out" }}, {t('barcelona')});
      // Balken: wischt von links, die Zahl steht hart am Ende (Editorial-Balken, DESIGN.md §5).
      tl.fromTo("#zp-bal-a-fl", {{ scaleX: 0, transformOrigin: "0% 50%" }}, {{ scaleX: 1, duration: 0.3, ease: "power3.inOut" }}, {t('zahl')});
      hart("#zp-bal-a-tx", {t('zahl', 0.3)});
      // Rotstift: ein Kreis um den Balken, ganz auf Papier, 34 px Luft (Signalfarbe dieses Looks).
      zeichne("#zp-marker-a .strich", {t('millionen')}, 0.5);
      // Seite 2 nach hartem Schnitt: Streifen von rechts, Unterstreichung, Balken.
      tl.fromTo("#zp-bis-s-innen", {{ x: 900, rotation: -6 }}, {{ x: 0, rotation: -1.5, duration: 0.55, ease: "expo.out" }}, {t('juni')});
      zeichne("#zp-marker-b .strich", {t('jahr')}, 0.35);
      tl.fromTo("#zp-bal-b-fl", {{ scaleX: 0, transformOrigin: "0% 50%" }}, {{ scaleX: 1, duration: 0.3, ease: "power3.inOut" }}, {t('null')});
      hart("#zp-bal-b-tx", {t('null', 0.3)});
      // Die Figur wird aufgeklebt: kommt 3 % zu groß und 2° verdreht, sitzt nach 0,2 s (harter Schnitt davor).
      tl.fromTo("#zp-figur-bild", {{ scale: 1.03, rotation: -2 }}, {{ scale: 1, rotation: 0, duration: 0.2, ease: "power3.out" }}, {schnitt});"""
    schreibe_probe(LOOK, "Zeitungspapier", GRUND, css, html_, js,
                   "Zeitungspapier: Collage, echter Clip und echtes Foto im Rasterdruck, Streifen, Balken, Rotstift; "
                   "Seite 2 nach hartem Schnitt.")
    credits_ergaenzen(LOOK, lizenz_im_bild={
        "ort": (f"senkrecht am rechten Seitenrand (x {RAND_X}–{RAND_X + 42}, y {LIZENZ_UNTEN - lizenz_lang:.0f}–"
                f"{LIZENZ_UNTEN}), von unten nach oben, über beide Seiten"),
        "schrift": f"Source Serif 4 400, 34/42 px, Grau {GRAU}",
        "von_s": 0, "bis_s": DAUER,
        "foto_credits_s": [[0, schnitt], [schnitt, DAUER]]})
