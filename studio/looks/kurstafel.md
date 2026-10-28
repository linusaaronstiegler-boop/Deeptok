# Look 6: Kurstafel

Eine Fallblatt-Anzeige, wie sie früher im Börsensaal und am Bahnhof hing. Das Medium ist die Tafel selbst: dunkles Gehäuse, Klappmodule bis an alle Ränder, jedes Zeichen ein eigenes Modul, das mit zwei Zwischenzeichen umklappt. Werte stehen als Zeilen untereinander, Balken bestehen aus Modulen (1 Feld = ein fester Betrag). Dunkel, neutral, Daten, getaktet.

- **Probe:** `probe-kurstafel/` (Vergleichstafel Nr. 6). Bild 0 zeigt schon den gegebenen Wert: Zeile „Behalten“ mit 0. Beat 1: „Barcelona“ klappt ein, die 45 zählt in großen Modulen, der Balken zählt Feld für Feld bis 9 von 10 (1 Feld = 5 Mio. €), dann kippt die 45 auf Cyan. Beat 2: Zeile 1 tritt auf 50 % zurück, „30.06.2023“ klappt unter „Vertragsende“ ein, die 0 kippt auf Cyan.
- **Warum neu (Kritik 28.10.):** Die erste Fassung war das typische dunkle Dashboard (leerer Anthrazit-Grund, ein heller Akzent, ein einziger Balken ohne Vergleich, Skala in 34 px). Jetzt: ein echtes Medium bis an alle Ränder, zwei Werte (gegeben und gesucht), alle Zeichen ≥ 48 px.

## Wofür

| passt | passt nicht |
|---|---|
| Wirtschaft & Märkte, die Märkte-Karte im Morgen-Briefing (Zahlen, keine Empfehlung), Vergleiche von zwei bis fünf Größen, Ranglisten, Zeitpläne und Fristen (Abfahrtstafel), Daten-News mit Quelle | Geschichten mit Personen, Orte, Gegenstände; fein aufgelöste Kurven (dafür ist ein Modul zu grob) |

## Palette

| Token | Hex | Rolle | Kontrast |
|---|---|---|---|
| `gehaeuse` | `#2A2826` | Gehäuse zwischen den Modulfeldern | – |
| `modul_leer` | `#181716` | leere Klappe (Textur) | – |
| `klappe` | `#141414` | beschriftete Klappe | – |
| `ziffer` | `#F2F0EA` | Zeichen auf der Klappe | 16,2 auf Klappe |
| `druck` | `#B9B4AA` | Aufdruck auf dem Gehäuse (Spaltenkopf, Quellen) | 7,1 auf Gehäuse |
| `cyan` | `#2EC4E6` | **gesuchte Größe**: Klappe kippt auf Cyan, Zeichen darauf in Klappenschwarz | Schwarz darauf 8,9 |
| `rot` | `#D93B42` | **Verlust oder Irrtum**: Klappe kippt auf Rot, Zeichen in Ziffernweiß, immer mit „−“ | Weiß darauf 4,0 (nur ≥ 72 px fett) |

**Rot-Regel:** Rot = Verlust oder Irrtum, wie im Haus; auf der Tafel als rote Klappe mit „−“. Cyan und Rot trennen sich auch bei Rot-Grün-Schwäche (hell gegen dunkel). Nie Grün/Rot für „steigt/fällt“ und nie als Empfehlung.

## Schriften

| Stufe | Familie | Größe | Farbe |
|---|---|---|---|
| Großes Modul (Zahl) | Barlow Condensed 600, `tabular-nums lining-nums` | 156 px in 118 × 182 px | Ziffernweiß |
| Kleines Modul (Wort, Datum) | Barlow Condensed 600 | 72 px in 56 × 88 px | Ziffernweiß |
| Aufdruck (Spaltenkopf) | Barlow 500 | 48 / 58 px | Druckgrau |
| C Quelle | Barlow 400 | 34 / 42 px | Druckgrau |

Lokal als woff2 (`@fontsource/barlow-condensed@5.3.0`, `@fontsource/barlow@5.3.0`, OFL), Namen „KT Barlow Condensed“ und „KT Barlow“. Barlow ist an DIN und Verkehrsschilder angelehnt; Tabellenziffern springen beim Klappen nicht.

## Grund und Textur

Raster: Modul 56 × 88 px, Abstand 6 px (Teilung 62 × 94), Spalte c bei x = 108 + 62 c, von x = −16 bis 1094. Modulfelder oben (Textur), drei Felder für Inhalt, unten bis zum Bildrand; dazwischen Gehäusestreifen mit Aufdruck. Jedes Modul hat eine Naht in der Mitte. Kein Leuchten, kein Korn.

## Held

Die Tafel mit ihren Zeilen: höchstens 5 Werte, untereinander, Zahlen rechtsbündig in großen Modulen (2 × 2 Zellen). Ein Balken ist eine Reihe von Modulen, die auf Cyan kippen; die Einheit je Feld steht im Spaltenkopf. Ein gegebener Wert steht ab Bild 0.

## Kamera und Übergänge

- Die Kamera steht; bewegt wird nur, was klappt. Kommt eine Zeile unterhalb des Bildes dazu, fährt die Tafel um eine ganze Feldhöhe nach oben (0,5 s `power2.inOut`), nie so, dass eine Zeile halb am Rand steht.
- Neues Thema = alle Module klappen auf leer (Welle von links, 0,03 s je Modul), dann die neue Tafel.

## Takt

Getaktet: **Klappen** (jede Hälfte 0,05 s, zwei Zwischenzeichen, 0,11 s je Klappung, Welle 0,03 s je Modul), **Zählen** (Balkenfelder kippen im Abstand von 0,09 s).

## Marker

Mechanisch: Klappe kippt auf Cyan (gesucht) oder Rot mit „−“ (Verlust); **Abdunkeln** der übrigen Zeilen auf 50 % (0,3 s; 35 % wie in DESIGN.md §6 fällt durch die Kontrastprüfung von `check`). Nichts Handgezeichnetes.

## Credits

Als Aufdruck auf dem Gehäuse unter dem letzten Feld, linksbündig an x = 108, Barlow 400 34 px: „Ablöse: FC Barcelona, 19.07.2022“ usw.; erscheinen hart (0,12 s) mit dem Wert, den sie belegen.

## Fotos

Foto-Einlage: Ein echtes Foto darf ein Feld der Tafel füllen (wie das Logo-Feld einer Abfahrtstafel), 4 × 2 Zellen, Duoton Klappe → Ziffer (`bilder.duoton(…, "#141414", "#F2F0EA")`), mit Credit-Aufdruck darunter, wenn ein Wert ein Ereignis ist (Börsengang, Wahl). In der Probe nicht verwendet.

## Drei Verbote

1. Leuchten, Neon-Glow, Bloom, 3D-Balken, Laufband-Ticker.
2. Zwei Maßstäbe auf einer Tafel; Balken ohne „1 Feld = …“; Zahlen ohne Quelle und Datum.
3. Kursfarben als Empfehlung (grün = kaufen, rot = verkaufen).

## Probe gemessen (28.10.2026, Überarbeitung)

Siehe README, Abschnitt „Messwerte“. Angesehen: Bild 0; 0,6; 1,7; 2,6; 6,6; 7,4; 10,0 s.
