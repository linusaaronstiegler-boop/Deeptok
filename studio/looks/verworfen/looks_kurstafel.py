"""VERWORFEN am 28.10.2026 (Blindbewertung: Klarheit 1 und 2 von 5, studio/looks/verworfen/kurstafel.md).
Liegt nur noch als Beleg hier; proben.py kennt diesen Look nicht mehr. Läuft nur, wenn diese Datei
wieder in studio/looks/werkzeug/ liegt (sie braucht probe_basis.py) und probe-kurstafel/ wieder in
studio/looks/.

Probe „Kurstafel“ (studio/looks/verworfen/kurstafel.md): eine Fallblatt-Anzeige wie früher im Börsensaal
oder am Bahnhof. Das Medium ist die Tafel selbst: Gehäuse, Klappmodule bis an alle Ränder,
jedes Zeichen ein eigenes Modul, das umklappt.

Bild 0 zeigt schon den gegebenen Wert (Behalten: 0). Beat 1: „Barcelona“ klappt ein, die 45 zählt
über zwei Zwischenziffern, der Balken aus Modulen zählt Feld für Feld bis 45 (1 Feld = 5 Mio. €),
dann kippt die 45 auf Cyan (gesucht). Beat 2: Zeile 1 wird abgedunkelt, das Vertragsende klappt
ein, die 0 kippt auf Cyan. Die Kamera steht; Bewegung kommt nur aus den Klappen (Takt: getaktet).
"""
from __future__ import annotations

from probe_basis import (CUE, DAUER, DATUM, Q_ABL, Q_FREI, Q_VERTRAG, clip, credits_ergaenzen,
                         messen, pruefe_breiten, schreibe_probe, t, zufall)

LOOK = "kurstafel"
GEHAEUSE, KLAPPE, ZIFFER, CYAN, DRUCK = "#2A2826", "#141414", "#F2F0EA", "#2EC4E6", "#B9B4AA"
LEER_FLAECHE, NAHT = "#181716", "#2A2826"
# Raster: Modul 56 × 88, Abstand 6 → Teilung 62 × 94. Spalte c liegt bei x = 108 + 62 c.
MB, MH, TX, TY = 56, 88, 62, 94
GB, GH = MB + TX, MH + TY                    # großes Modul = 2 × 2 Zellen: 118 × 182
SPALTEN = range(-2, 16)                      # füllt den Rand links und rechts (x −16 … 1094)
# Modulzeilen (Oberkante) der Blöcke; dazwischen Gehäuse mit Aufdruck.
OBEN = [-30, 64]
BLOCK1 = [250, 344, 438]
BLOCK2 = [610, 704, 798]
BLOCK3 = [990]
UNTEN = [1236 + TY * k for k in range(8)]
KLAPP = 0.05                                 # eine Hälfte klappt in 0,05 s (1,5 Bilder)
SCHRITT = 0.11                               # Abstand zweier Klappungen desselben Moduls


def x(c: int) -> int:
    return 108 + TX * c


def leere_tafel() -> str:
    """Alle Module als SVG (leer): Fläche, Naht in der Mitte, zwei Scharnierstifte."""
    teile = []
    for y in OBEN + BLOCK1 + BLOCK2 + BLOCK3 + UNTEN:
        for c in SPALTEN:
            teile.append(f'<rect x="{x(c)}" y="{y}" width="{MB}" height="{MH}" rx="3" fill="{LEER_FLAECHE}" />'
                         f'<rect x="{x(c)}" y="{y + MH / 2 - 1}" width="{MB}" height="2" fill="{NAHT}" />')
    return "".join(teile)


class Tafel:
    """Sammelt aktive Module (HTML) und ihre Klappungen (GSAP-Zeilen)."""

    def __init__(self):
        self.html: list[str] = []
        self.js: list[str] = []

    def modul(self, mid: str, links: int, oben: int, zustaende: list[tuple[str, str, str]],
              zeiten: list[float], gross: bool = False) -> None:
        """zustaende: [(zeichen, fläche, schrift)], zeiten: Beginn jeder Klappung i → i+1.

        Jeder Zustand hat eine obere und eine untere Hälfte. Klappen heißt: die obere Hälfte des
        alten Zustands fällt um 90° nach vorn (Scharnier unten), danach fällt die untere Hälfte des
        neuen Zustands von 90° auf 0° (Scharnier oben) und deckt die alte untere Hälfte zu.
        Reihenfolge der Ebenen: alte obere Hälften liegen oben, neue untere Hälften oben.
        """
        assert len(zeiten) == len(zustaende) - 1
        klasse = "kt-m kt-gross" if gross else "kt-m"
        # Die Zustände liegen absichtlich übereinander (Fallblatt): für die Layout-Prüfung freigeben.
        teile = [f'<div id="{mid}" class="{klasse}" style="left: {links}px; top: {oben}px" '
                 f'data-layout-allow-overlap data-layout-allow-occlusion>']
        for i, (zeichen, flaeche, schrift) in enumerate(zustaende):
            z = zeichen if zeichen.strip() else "&nbsp;"
            kipp = "" if i == 0 else " transform: rotateX(90deg);"
            frei = "data-layout-allow-overlap data-layout-allow-occlusion"
            teile.append(f'<div id="{mid}-o{i}" class="kt-o" style="z-index: {60 - i}; background: {flaeche}; color: {schrift}" {frei}><span {frei}>{z}</span></div>'
                         f'<div id="{mid}-u{i}" class="kt-u" style="z-index: {i + 1}; background: {flaeche}; color: {schrift};{kipp}" {frei}><span {frei}>{z}</span></div>')
        teile.append('<i class="kt-naht"></i></div>')
        self.html.append("".join(teile))
        for i, zeit in enumerate(zeiten):
            self.js.append(f'tl.fromTo("#{mid}-o{i}", {{ rotationX: 0 }}, {{ rotationX: -90, duration: {KLAPP}, ease: "power1.in" }}, {zeit:.3f});')
            self.js.append(f'tl.fromTo("#{mid}-u{i + 1}", {{ rotationX: 90 }}, {{ rotationX: 0, duration: {KLAPP}, ease: "power1.out" }}, {zeit + KLAPP:.3f});')

    def wort(self, praefix: str, text: str, spalte: int, oben: int, start: float, seed: int,
             zwischen: int = 2) -> None:
        """Ein Wort, Zeichen für Zeichen in Modulen; die Welle läuft von links nach rechts
        (30 ms je Modul), jedes Modul zeigt vorher `zwischen` zufällige Zeichen."""
        zeichensatz = "ABCDEFGHKLMNOPRSTUVZ0123456789"
        for k, ch in enumerate(text):
            if ch == " ":
                continue
            beginn = start + 0.03 * k
            zufaellig = [zeichensatz[int((zufall(k * 7 + j, seed) + 1) / 2 * len(zeichensatz)) % len(zeichensatz)]
                         for j in range(zwischen)]
            zustaende = [(" ", KLAPPE, ZIFFER)] + [(z, KLAPPE, ZIFFER) for z in zufaellig] + [(ch, KLAPPE, ZIFFER)]
            self.modul(f"{praefix}{k}", x(spalte + k), oben, zustaende,
                       [beginn + SCHRITT * i for i in range(len(zustaende) - 1)])

    def fest(self, praefix: str, text: str, spalte: int, oben: int) -> None:
        """Ein Wort, das schon steht (gegebener Wert ab Bild 0)."""
        for k, ch in enumerate(text):
            if ch != " ":
                self.modul(f"{praefix}{k}", x(spalte + k), oben, [(ch, KLAPPE, ZIFFER)], [])


def kurstafel() -> None:
    m = messen(LOOK, {
        "kopf": ("Ablöse in Mio. €", 'font: 500 48px/58px "KT Barlow"'),
        "feld": ("1 Feld = 5 Mio. €", 'font: 500 48px/58px "KT Barlow"'),
        "ende": ("Vertragsende", 'font: 500 48px/58px "KT Barlow"'),
        "c1": (Q_ABL, 'font: 400 34px/42px "KT Barlow"'),
        "c2": (Q_VERTRAG, 'font: 400 34px/42px "KT Barlow"'),
        "c3": (Q_FREI, 'font: 400 34px/42px "KT Barlow"'),
    })
    pruefe_breiten(LOOK, m)
    if m["kopf"]["breite"] + m["feld"]["breite"] > 864 - 40:
        raise SystemExit("Kurstafel: Kopfzeile zu breit")
    tafel = Tafel()
    # Zeile 1 (gesucht): „Barcelona“ klappt auf „Barcelona“, die 45 zählt in großen Modulen.
    tafel.wort("r1-", "Barcelona", 0, BLOCK1[1], t("barcelona"), 3)
    z0 = t("zahl")
    zehner = [(" ", KLAPPE, ZIFFER), ("1", KLAPPE, ZIFFER), ("3", KLAPPE, ZIFFER), ("4", KLAPPE, ZIFFER), ("4", CYAN, KLAPPE)]
    einer = [(" ", KLAPPE, ZIFFER), ("7", KLAPPE, ZIFFER), ("2", KLAPPE, ZIFFER), ("5", KLAPPE, ZIFFER), ("5", CYAN, KLAPPE)]
    marker = t("millionen")
    tafel.modul("r1-z", x(10), BLOCK1[0], zehner, [z0, z0 + SCHRITT, z0 + 2 * SCHRITT, marker], gross=True)
    tafel.modul("r1-e", x(12), BLOCK1[0], einer, [z0 + 0.03, z0 + 0.03 + SCHRITT, z0 + 0.03 + 2 * SCHRITT, marker + 0.03], gross=True)
    # Balken aus Modulen: 9 von 10 Feldern kippen nacheinander auf Cyan (Zählen, 0,09 s je Feld).
    for k in range(9):
        tafel.modul(f"b1-{k}", x(k), BLOCK1[2], [(" ", KLAPPE, ZIFFER), (" ", CYAN, KLAPPE)], [z0 + 0.09 * k])
    # Zeile 2 (gegeben, ab Bild 0): „Behalten“ und 0; der Balken bleibt leer.
    tafel.fest("r2-", "Behalten", 0, BLOCK2[1])
    tafel.modul("r2-e", x(12), BLOCK2[0], [("0", KLAPPE, ZIFFER), ("0", CYAN, KLAPPE)], [t("null")], gross=True)
    # Zeile 3: das Vertragsende klappt auf „Juni“ ein.
    tafel.wort("r3-", DATUM, 0, BLOCK3[0], t("juni"), 9)

    reihe1 = [h for h in tafel.html if 'id="r1-' in h or 'id="b1-' in h]
    rest = [h for h in tafel.html if h not in reihe1]
    css = f"""    #kt-tafel {{ left: 0; top: 0; width: 1080px; height: 1920px; background: {GEHAEUSE}; }}
    #kt-reihe1 {{ position: absolute; inset: 0; }}
    .kt-m {{ position: absolute; width: {MB}px; height: {MH}px; perspective: 400px; }}
    .kt-gross {{ width: {GB}px; height: {GH}px; perspective: 700px; }}
    .kt-o, .kt-u {{ position: absolute; left: 0; width: 100%; height: 50%; overflow: hidden; backface-visibility: hidden; }}
    .kt-o {{ top: 0; transform-origin: 50% 100%; border-radius: 3px 3px 0 0; }}
    .kt-u {{ top: 50%; transform-origin: 50% 0%; border-radius: 0 0 3px 3px; }}
    .kt-o span, .kt-u span {{ position: absolute; left: 0; width: 100%; height: 200%; display: flex; align-items: center;
      justify-content: center; font: 600 72px/1 "KT Barlow Condensed"; font-variant-numeric: tabular-nums lining-nums; }}
    .kt-gross .kt-o span, .kt-gross .kt-u span {{ font-size: 156px; }}
    .kt-u span {{ top: -100%; }}
    .kt-naht {{ position: absolute; left: 0; right: 0; top: calc(50% - 1px); height: 2px; background: {NAHT}; z-index: 200; }}
    .kt-druck {{ font: 500 48px/58px "KT Barlow"; color: {DRUCK}; white-space: nowrap; }}
    #kt-kopf {{ left: 108px; top: 176px; }}
    #kt-feld {{ right: 108px; top: 176px; }}
    #kt-ende {{ left: 108px; top: 912px; }}
    .kt-credit {{ left: 108px; font: 400 34px/42px "KT Barlow"; color: {DRUCK}; white-space: nowrap; }}"""
    html_ = f"""    <!-- Welt: das Gehäuse mit leeren Klappmodulen bis an alle Ränder; aktive Module liegen genau darauf. -->
    <div id="kt-tafel" class="clip" data-start="0" data-duration="{DAUER}" data-track-index="0" data-layout-allow-overflow>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style="position:absolute;left:0;top:0">{leere_tafel()}</svg>
      <div id="kt-reihe1">{''.join(reihe1)}</div>
      {''.join(rest)}
    </div>
{clip('kt-kopf', 0, DAUER, 1, 'Ablöse in Mio.&nbsp;€', klasse='kt-druck')}
{clip('kt-feld', 0, DAUER, 2, '1 Feld = 5 Mio.&nbsp;€', klasse='kt-druck')}
{clip('kt-ende', 0, DAUER, 1, 'Vertragsende', klasse='kt-druck')}
{clip('kt-c1', t('zahl'), DAUER, 3, Q_ABL, klasse='kt-credit', stil='top: 1100px', attr='data-hold')}
{clip('kt-c2', t('juni'), DAUER, 4, Q_VERTRAG, klasse='kt-credit', stil='top: 1142px')}
{clip('kt-c3', t('null'), DAUER, 5, Q_FREI, klasse='kt-credit', stil='top: 1184px')}"""
    js = ("      // Klappen: jede Hälfte 0,05 s; ein Modul zeigt 2 Zwischenzeichen (Fallblatt-Mechanik).\n      "
          + "\n      ".join(tafel.js) + f"""
      // Quellen werden wie Aufdruck gesetzt: kurz und hart, ohne Unschärfe (Einrasten, 0,12 s).
      tl.fromTo("#kt-c1", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.12, ease: "power1.out" }}, {t('zahl')});
      tl.fromTo("#kt-c2", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.12, ease: "power1.out" }}, {t('juni')});
      tl.fromTo("#kt-c3", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.12, ease: "power1.out" }}, {t('null')});
      // Beat 2: Abdunkeln – Zeile 1 tritt auf 50 % zurück, gemeint ist jetzt Behalten (DESIGN.md §6 sagt
      // 35 %; dann fallen die Ziffern unter 3 : 1, und `check` meldet einen Kontrastfehler).
      tl.fromTo("#kt-reihe1", {{ opacity: 1 }}, {{ opacity: 0.5, duration: 0.3, ease: "power1.inOut" }}, {t('bayern')});""")
    schreibe_probe(LOOK, "Kurstafel", GEHAEUSE, css, html_, js,
                   "Kurstafel: Fallblatt-Anzeige, Klappmodule bis an alle Ränder, Cyan = gesucht, "
                   "Abdunkeln als Marker. Kein Leuchten.")
    credits_ergaenzen(LOOK)
