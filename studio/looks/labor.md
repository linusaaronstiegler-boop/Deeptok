# Look 3: Labor

Eine Werkbank mit grüner Schneidematte, von schräg oben gesehen. Auf der Matte steht ein echter Gegenstand, freigestellt, mit Kontaktschatten. Beschriftet wird wie in der Werkstatt: Kreppband für Gegebenes, orangefarbenes Markierband für die gesuchte Größe, Hinweis- und Maßlinien mit dem Lineal. Mittelhell, grün, Foto, ruhig. Vorbild ist der Gegenstand auf dem Tisch bei Veritasium; eigenständig durch die Matte mit Zentimeter-Raster, die zugleich Maßstab ist.

- **Probe:** `probe-labor/` (Vergleichstafel Nr. 3). Beat 1: Münzstapel (echtes Foto, CC0), Kreppband „Barcelona“, Markierband „45 Mio. €“, Hinweislinie, Maßlinie entlang der Höhe. Beat 2: Die Kamera fährt auf der Schiene 1100 px nach rechts; dort ist der Platz leer, vier Klebeband-Ecken markieren ihn, „bis 30.06.2023“, „0 €“.
- **Warum neu (Kritik 28.10.):** Die erste Fassung (fast weißer Grund, Serifen-Zahl, ein Kobalt-Akzent) traf die Standard-KI-Vorlage „cream paper, cobalt ink, serif“ und BANNED 12. Jetzt: echtes Material als Grund, Grotesk statt Serife, Orange statt Kobalt.

## Wofür

| passt | passt nicht |
|---|---|
| Wissenschaft (Physik, Chemie, Bio), Schule-Transfer in den Naturwissenschaften, Technik und Alltagsgegenstände, Stil & Auftreten (ein Kleidungsstück, freigestellt), Experimente mit echten Händen (Clip), Mengen anschaulich machen (wie hoch ist ein Stapel?) | Orte (dann Atlas), Ereignisse und Personen (dann Zeitungspapier oder Archiv), lange Zahlenreihen (dann Kurstafel) |

## Palette

| Token | Hex | Rolle | Kontrast auf Matte |
|---|---|---|---|
| `matte` | `#22493E` | Schneidematte, Grund bis an alle Ränder | – |
| `raster` | `#3F6B5D` | 1-cm-Linien, 2 px (Textur) | 1,66 |
| `raster_gross` | `#7FA89A` | 5-cm-Linien 3 px, 45°-Linie, Zahlen der Matte | 3,8 |
| `weiss` | `#EEF3EF` | Hinweislinien, Klebeband-Ecken | 8,95 |
| `grau` | `#C9DCD3` | Credits | 7,0 |
| `krepp` | `#E9DFC4` | Kreppband (gegeben), Text darauf in Tinte | Tinte darauf 12,6 |
| `tinte` | `#1B1F1C` | Schrift auf Bändern | – |
| `orange` | `#FF7A2F` | **gesuchte Größe**: Markierband, Maßlinie, Hinweislinie im Fokus | 3,86 (Linie, Fläche); Tinte darauf 6,4 |
| `rot` | `#FF8F8F` | **Irrtum oder Verlust**, nur mit ✗ oder Durchstrich | 4,6 |

**Rot-Regel:** Rot = Irrtum oder Verlust, wie im Haus. Weil Rot auf Grün bei Rot-Grün-Schwäche schwach trennt, steht es nie ohne zweites Merkmal (✗, Durchstrich) und ist heller als die Matte. Orange ist die einzige Akzentfarbe; der Gegenstand bringt seine eigene Farbe mit.

## Schriften

| Stufe | Familie | Größe | Farbe |
|---|---|---|---|
| D1 Zahl auf Markierband | IBM Plex Sans Condensed 700, `lining-nums` | 173 px | Tinte auf Orange |
| T Etikett auf Kreppband | IBM Plex Sans Condensed 600 | 56 px | Tinte auf Krepp |
| C Credit | IBM Plex Sans 400 | 34 / 42 px | Grau |

Lokal als woff2 (`@fontsource/ibm-plex-sans-condensed@5.3.0`, `@fontsource/ibm-plex-sans@5.3.0`, OFL), Namen „LB Plex Cond“ und „LB Plex Sans“. Plex wurde für technische Dokumentation gezeichnet; die schmale Fassung passt auf Klebeband.

## Grund und Textur

Schneidematte als SVG (4400 × 4000 px), CSS-Perspektive: `perspective: 1600px`, Ebene `rotateX(25deg)`, Mitte bei (540, 960). Raster 60 px (1 cm), jede fünfte Linie kräftiger, eine 45°-Linie, Zahlen 5, 10, 15 … in der App-Zone. Die Linien laufen nach hinten zusammen; so liest man Tiefe und Maßstab zugleich.

## Held

Ein echter Gegenstand, freigestellt (`bilder.freistellen`: `hyperframes remove-background` lokal, sonst rembg), ≥ 465 px hoch, steht auf der Fußlinie (y = 1140) mit weichem Kontaktschatten. Beim Vergleich zwei Plätze auf derselben Fußlinie; ein leerer Platz bekommt vier Klebeband-Ecken.

## Kamera und Übergänge

- **Kamerafahrt auf der Schiene** (Slider): 0,6 s `power2.inOut` seitlich. Die Matte verschiebt sich in ihrer eigenen Ebene (die Perspektive bleibt richtig), Gegenstände um denselben Weg auf ihrer Fußlinie. Vorher treten Bänder und Linien zurück.
- Makro-Zoom 1,3–1,6× in 0,5 s auf ein Detail, nur wenn danach kein Band halb am Rand steht.
- Neuer Gegenstand ohne räumlichen Bezug = harter Schnitt auf dem Nomen.
- Eintritte: **Kleben** (Band kommt 4 % zu groß und 3° verdreht, sitzt nach 0,2 s `power3.out`), Hinweislinie zeichnet sich in 0,3 s, Maßlinie mit Endstrichen in 0,35 s.

## Takt

Ruhig: ein Element etwa alle 1,5 s, lange Halte, höchstens eine Kamerafahrt je Beat.

## Marker

Linealgerade: **Maßlinie** (6 px Orange, Endstriche 44 px) entlang der Größe, um die es geht; Hinweislinie (3 px Weiß, im Fokus 5 px Orange); Klebeband-Ecken für einen leeren Platz. Kein Kreis, nichts Handgezeichnetes.

## Credits

Linksbündig an x = 108 unter der Fußlinie, IBM Plex Sans 400 34 px in Grau, höchstens 3 Zeilen: „Foto: Urheber, Jahr, Lizenz, freigestellt,“ / Kurzlink / Quelle der Zahl.

## Fotos

Echte Gegenstände in echter Farbe (der einzige Look mit Farbfotos neben der Foto-Einlage in Flach und dem einen Echtfoto-Moment in Atlas Nacht). Bevorzugt Sammlungs- und Produktfotos auf glattem Grund (CC0, gemeinfrei). Kurze echte Clips von Experimenten (Hände ohne Gesicht) passen hierher, stumm, höchstens 4 s.

## Drei Verbote

1. Ein Gegenstand, der etwas anderes behauptet, als er ist (ein Museumsball als „Angebot aus Barcelona“). Geld darf als Sinnbild stehen, wenn das Band den Betrag nennt.
2. Handgezeichnete oder zitternde Marker, Kreise, Schatten unter Text.
3. Ein schwebender Gegenstand ohne Fußlinie und Kontaktschatten; weiße oder cremefarbene Fläche als Grund.

## Probe gemessen (28.10.2026, Überarbeitung)

Siehe README, Abschnitt „Messwerte“. Angesehen: Bild 0; 0,8; 2,8; 5,6; 6,0 (Fahrt); 7,6; 10,4 s.
