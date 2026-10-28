# Look 4: Archiv-Duoton

Eine Akte auf grauer Pappe. Echte Fotos liegen als Abzüge in warmem Schwarzweiß (Duoton Tinte → Papier) mit weißem Rand und Büroklammer darauf, daneben linierte Karteikarten, auf denen getippt wird. Die gesuchte Größe kommt als violetter Stempel, angestrichen wird mit dem Kopierstift am Rand. Hell-mittel, warm, Foto, ruhig und schwer.

- **Probe:** `probe-archiv-duoton/` (Vergleichstafel Nr. 4). Beat 1: Abzug Arc de Triomf (Library of Congress, ca. 1890–1906), Karte „Barcelona“ getippt, Stempel „45 Mio. €“, Randstrich. Beat 2 (Stapel): ein neuer Abzug legt sich darüber (Lewandowski im Spiel für den FC Bayern, 2019), eine neue Karte gleitet auf die alte, „30.06.2023“ wird getippt, Stempel „0 €“, Randstrich.
- **Warum neu (Kritik 28.10.):** Die erste Fassung (Petrol-dunkel, Ocker, Slab-Serife) war fast eine Umfärbung von Atlas Nacht (Gold gegen Ocker ΔE 10). Jetzt: heller warmer Grund statt dunklem, Violett statt Ocker, Grotesk statt Serife.

## Wofür

| passt | passt nicht |
|---|---|
| Geschichte und Zeitgeschichte, Biografien, Bücher (Autor, Erstausgabe), Rhetorik an historischen Reden (Foto des Redners zur Zeit der Rede), Verträge, Urteile, Dokumente | Naturwissenschaft, Märkte, Themen ohne Dokument oder Archivbild |

**Datumsregel:** Das Foto zeigt Ereignis, Person oder Ort aus der besprochenen Zeit; Jahr und Herkunft stehen auf dem Rand des Abzugs. In der Probe ist das beim ersten Abzug bewusst verletzt (Barcelona um 1900 zu einer Ablöse von 2022), damit alle Looks denselben Inhalt zeigen; das Jahr auf dem Rand macht es sichtbar.

## Palette

| Token | Hex | Rolle | Kontrast |
|---|---|---|---|
| `pappe` | `#BDB2A0` | Graupappe, Grund bis an alle Ränder (mit Faser) | – |
| `papier` | `#F3EFE6` | Abzugsrand, Karteikarten, Lichtfarbe des Duotons | – |
| `tinte` | `#1E1B17` | Schrift, Schattenfarbe des Duotons | 15,0 auf Papier, 8,2 auf Pappe |
| `linie` | `#A9BCCB` | Linien der Karteikarte (2 px, Textur) | – |
| `violett` | `#5B2C94` | **gesuchte Größe**: Stempel; Kopierstift-Randstrich | 8,2 auf Papier, 4,5 auf Pappe |
| `rot` | `#A3221B` | **Irrtum oder Verlust**, nur mit Durchstrich | 6,5 auf Papier |
| `metall` | `#8E9396` | Büroklammer | – |

**Rot-Regel:** Rot = Irrtum oder Verlust, wie im Haus, immer mit Durchstrich (Rotstift auf der Karte). Violett ist die einzige Akzentfarbe; Stempelfarbe und Kopierstift sind im Büro beide violett.

## Schriften

| Stufe | Familie | Größe | Farbe |
|---|---|---|---|
| D1 Zahl im Stempel | Libre Franklin 800, Einheit 124 px auf derselben Grundlinie | 173 px | Violett |
| D2 Getipptes auf der Karte | Libre Franklin 800 | 124 px | Tinte |
| T Text auf der Karte | Libre Franklin 600 | 56 px | Tinte |
| C Herkunft, Quelle | Libre Franklin 400 | 34 / 42 px | Tinte |

Lokal als woff2 (`@fontsource/libre-franklin@5.3.0`, OFL), Name „AD Franklin“. Franklin ist eine Grotesk aus der Zeit um 1900 (Franklin Gothic, 1902); sie trägt den Archiv-Eindruck ohne Serife und ohne Monospace (beides im Haus verboten auf hellem Grund).

## Grund und Textur

Graupappe als eigene Grafik (`assets/pappe.jpg`, fester Zufall): Grundton, weiche Wolken, kurze dunkle und helle Fasern, im Handy-Blatt sichtbar. Darauf: Abzüge mit 22 px Papierrand und 152 px Rand unten für die getippte Herkunft, Schlagschatten `drop-shadow(0 10px 14px rgba(30,27,23,.38))`; Karteikarten mit Linien alle 56 px.

## Held

Der Abzug, ≥ 691 px breit. Mehrere Abzüge liegen als Stapel; der neue legt sich über den alten. Darunter die Karteikarte mit dem Wort und dem Stempel.

## Kamera und Übergänge

- Die Kamera steht. Bewegung kommt vom Papier: **Stapel** (ein neuer Abzug gleitet herein, 0,45 s `expo.out`, Drehung 7° → 2,5°), **Karte** (gleitet von der Seite auf die alte, 0,45 s).
- Zoom-in in einen Abzug (Fenster bleibt, Bild wächst 1,2×) nur auf ein Detail, über das gesprochen wird.
- Neues Thema = harter Schnitt auf eine neue Akte.

## Takt

Ruhig und schwer: **Tippen** (22 Zeichen/s, Simplicissimus/Nike tippen 10–26 Zeichen/s), **Stempeln** (kommt 1,6-fach und −6° gedreht, sitzt nach 0,28 s `back.out(2.2)`), lange Halte.

## Marker

Stempel in Violett mit doppeltem Rahmen und Fehlstellen (Maske `assets/stempel-maske.png`) für die gesuchte Größe; **Randstrich** mit dem Kopierstift (zwei senkrechte Striche, 7 px, 0,3 s) neben dem, worauf es ankommt; Irrtum: roter Durchstrich.

## Credits

Die Herkunft eines Fotos steht getippt auf dem unteren Rand des Abzugs (3 Zeilen, nicht breiter als das Foto); die Quelle einer Zahl unten auf der Karteikarte (keine Unterzeile unter dem getippten Wort, BANNED 21). Zeigt das Video eine Bearbeitung eines CC-BY-SA-Fotos, sind die letzten zwei Zeilen jeder Karte das Rechte-Feld mit der Lizenz des Videos („Video: CC BY-SA 4.0 ·“ / „creativecommons.org/licenses/by-sa/4.0“); weil eine Karte die andere ablöst, steht es in der Probe 0–12 s. Auf dem Rand des Abzugs stünde es wie die Lizenz des einzelnen Fotos.

## Fotos

Gemeinfreie oder frei lizenzierte Fotos, nie Agentur- oder Pressefotos: Library of Congress (ohne bekannte Rechte), Bundesarchiv auf Commons (CC BY-SA 3.0 DE), Nationaal Archief (CC0), Sammlungen, Spielfotos von Commons-Fotografen unter CC BY-SA. Behandlung `bilder.duoton(…, "#1E1B17", "#F3EFE6")`, Autokontrast 1 %. Archivfilm als kurzer Clip (≤ 4 s) in einem Abzug-Rahmen, dieselbe Behandlung.

## Drei Verbote

1. Alter-Film-Kitsch: Kratzer, Staub, Flackern, Sepia-Brand, eingebrannte Vignette.
2. Nachkolorierte oder per KI „restaurierte“ Fotos; Farbfotos im selben Bild wie Duoton.
3. Ein Abzug ohne Jahr und Herkunft auf dem Rand, oder eines aus einer anderen Zeit als der besprochenen (außer in dieser Probe).

## Probe gemessen (28.10.2026, Überarbeitung)

Siehe README, Abschnitt „Messwerte“. Angesehen: Bild 0; 1,0; 2,8; 6,5; 7,9; 10,2 s und Ausschnitte in voller Größe (Stempel, Randstrich, Herkunft lesbar).
