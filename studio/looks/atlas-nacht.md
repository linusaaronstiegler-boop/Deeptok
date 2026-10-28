# Look 1: Atlas Nacht

Die bestehende Hausidentität, jetzt ein Look unter sechs. Dunkle Seekarte, eine leuchtende Region, beleuchtete Gegenstände, die auf Orte fallen. Ruhig, kalt, Illustration.

- **Probe:** `probe-atlas-nacht/` (Vergleichstafel Nr. 1). Karte aus `werkzeug/karte.mjs`. Beat 1: Münzstapel fällt auf Barcelona, „45 Mio. €“ in Gold, Unterstreichung. Beat 2: Kamerafahrt zurück und nach Nordosten (0,6 s), Barcelona und München im selben Bild, die leuchtende Region wechselt von Spanien zu Deutschland, auf München ein gestrichelter Geist-Stapel, „bis 30.06.2023“, „0 €“ in Creme.
- **Voller Regelsatz:** `studio/DESIGN.md` §2–§8 (Identität Atlas). Dieses Blatt fasst zusammen und ergänzt die Rot-Regel.

## Wofür

| passt | passt nicht |
|---|---|
| Geopolitik & Geschichte mit Ort (Grenzen, Routen, Bündnisse), Weltlage-Briefings, Wirtschaftslage mit Handelswegen, Transfers zwischen Städten | alles ohne Ort; Zahlenreihen (dann Kurstafel); Gegenstände ohne Geografie (dann Labor) |

## Palette

| Token | Hex | Rolle | Kontrast auf Grund |
|---|---|---|---|
| `grund` | `#0E1726` | Meer, Grund | – |
| `flaeche` | `#1F3864` | zweite Ebene | 1,55 |
| Kartentöne | Land `#222D40`, Küste `#5A6880`, Grenze `#36435A`, Region `#2A4069`, Schein `#6F8FC4` 55 %, Rand `#9DB2D6` 70 % | Geografie | – |
| `creme` | `#F5F0E8` | gegeben, Orte, Text | 15,8 |
| `gold` | `#C9A84C` | **gesuchte Größe** (≤ 10 % der Fläche) | 7,9 (auf Region 4,5) |
| `rot` | `#E07A5F` | **Irrtum oder Verlust**, nur mit Durchstrich oder „−“ | 6,1 (auf Region 3,5, nur ab 48 px) |

**Rot-Regel:** Rot = Irrtum oder Verlust. Höchstens ein rotes Element je Bild.

## Schriften

| Stufe | Familie | Größe / Zeile | Farbe |
|---|---|---|---|
| D1 Zahl | Playfair Display 900, `lining-nums`, −0,02 em | 173 / 173 px | Gold |
| D2 Name | Playfair Display 900 | 124 / 124 px | Creme |
| T Text, O Ort | Inter 600 | 48–56 px / 62 px | Creme |
| C Credit | Inter 400 | 34 / 42 px | Creme 62 % |

Lokal als woff2 (`@fontsource/playfair-display@5.1.0`, `@fontsource/inter@5.1.0`, OFL), Namen „DT Playfair“ und „DT Inter“.

## Grund und Textur

Natural-Earth-Karte (50m) in Lambert konform-konisch bis an alle Ränder. Genau eine Region leuchtet. Kein Korn.

## Held

Die Karte mit einem beleuchteten Gegenstand oder Darsteller (≥ 288 px) auf dem Ort. In der Probe: ein Münzstapel fällt auf Barcelona, der Fuß markiert den Ort, der Punkt geht.

## Kamera und Übergänge

- Zoom-in (Detail derselben Welt) 0,5 s `power2.inOut`, erst nach der Lesezeit; nur die Karte wächst, Namen und Gegenstände bleiben bildschirmgroß.
- **Zoom-out-Fahrt** zu einem zweiten Ort (Probe, Beat 2): 0,6 s `power2.inOut`; Orte, Stapel und Namen hängen an Ankern und wandern mit derselben Kurve mit. Vorher treten Texte zurück, die sonst aus dem Lesefenster rutschen. Genau eine Region leuchtet: die alte geht während der Fahrt (0,3 s), die neue kommt am Ende (0,3 s).
- Flug eines Darstellers entlang der Route (1,7 s, vorläufig), Nachfahrt mit `data-rig`.
- Harter Schnitt nur bei neuem Thema. Eintritte: Fallen, Ort setzen, Flug (DESIGN.md §5).

## Marker

Unterstreichung, Kreis (≤ 1 je Video), Flusspfeil in Gold oder Creme; handgezeichnet, 10 px plus zweite Spur, gezeichnet auf dem Cue-Wort.

## Credits

Credit-Ecke rechtsbündig an x = 972, Unterkante y = 1304, nach oben gestapelt, Inter 400 34 px, zwei dunkle Schatten über der Karte. Die Karte ist so gelegt, dass keine leuchtende Küste unter der Credit-Ecke liegt (Barcelona bei x 520, y 880; die Balearen enden bei y 1171, die Credits beginnen bei 1220). „Ablöse: FC Barcelona, 19.07.2022“, „Karte: Natural Earth, gemeinfrei“; in Beat 2 „Vertrag: t-online, 14.05.2022“, „Ablösefrei: EuGH, 15.12.1995“.

## Fotos

Archivfotos im Duoton Navy → Creme (`bilder.duoton(…, "#0E1726", "#F5F0E8")` oder HyperFrames „Monochrome Screen Print“), mit Credit-Zeile. **Echtfoto-Moment:** höchstens einmal je Video darf ein echtes Foto in eigenem Ton stehen (Sättigung ca. 70 %, Schatten Richtung Navy, Hintergrund weich und abgedunkelt), ≥ 2,0 s, dann wird es per Morph zum Duoton-Darsteller (DESIGN.md §4, Goldstandard v2.1). Sonst kommt Farbe nur über die Marker-Ebene ins Foto.

## Takt

Ruhig: etwa alle 1,5 s ein neues Element, eine Kamerafahrt je Beat, lange Halte.

## Drei Verbote

1. Karten-Pins, Tropfen- und Flaggen-Icons statt Punkt und Name.
2. Globus-Dreh oder Weltraum-Flug als Einstieg.
3. Mehr als eine leuchtende Region gleichzeitig.

## Probe gemessen (28.10.2026, Überarbeitung)

Siehe README, Abschnitt „Messwerte“. Eindruck: vertraut und ruhig, der einzige Look mit Gold. Bleibt der Standard für Ort-Themen, nicht mehr für alles. Angesehen: Bild 0,2; 1,2; 3,0; 5,8; 6,6; 8,0; 11,0 s.
