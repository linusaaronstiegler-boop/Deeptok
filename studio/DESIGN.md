# DeepTok Haus-Design

Stand 27.10.2026 (Phase 1, Goldstandard). Gilt für jedes Video in `studio/` und jede Szene der Bibliothek.
Grundlage sind `docs/VIDEO-PIPELINE.md` §3/§5/§6, `studio/spike-buehne/REVIEW.md` (gemessen) und die Beat-Blätter von alter Probe und Spike A+.

- Maße in Bildpixeln bei 1080 × 1920, 30 fps. **Handy-Maßstab 0,36:** Auf einem 390-pt-Handy werden 34 px zu 12 pt und 2 px zu 0,7 pt. Was dort verschwindet, gibt es nicht (Korn-Lehre).
- **Prüft:** `Bau` heißt, der Bau bricht ab (`bauen.mjs`). G5 = `check`, G6 = DOM-Layout, G7 = DOM-Bewegung, G8 = Kritiker am Beat-Blatt.
- Werte mit **(v)** sind vorläufig, siehe §9.

## 1. Grundsätze

1. Jedes Bild lehrt etwas: Es zeigt Beziehung, Menge, Ort, Abfolge oder Zustand. Was den Entfern-Test nicht besteht, fliegt.
2. Jede Szene hat einen Helden, der kein Text ist. Text benennt nur Objekt, Zahl oder Schlüsselwort, nie den gesprochenen Satz.
3. Farbe ist Bedeutung: Gold ist gesucht, Creme gegeben, Rot Irrtum oder Verlust. Alles andere ist Navy.
4. Jede Bewegung hat eine Ursache (ein Wort, ein Fluss, ein Detail). Was gelesen wird, steht still.
5. Nie: Musik, Deko-Bilder, Lob, erfundene Belege, KI-Gesichter echter Menschen.

## 2. Raster und Fläche

| Zone | Maß | Inhalt | Prüft |
|---|---|---|---|
| Kopfzone | y 0–168 | Welt läuft weiter, keine Information | G6 |
| **Lesefenster** | x 108–972, y 168–1330 (864 × 1162 px) | alles Lesbare, Mitte des Helden | G6 |
| Titel-Sicherheitsbreite | 864 px | gemessene Zeilenbreite jeder Zeile ≤ 864 | Bau (Playwright, Schrift geladen) |
| Credit-Ecke | rechtsbündig an x = 972, Unterkante y = 1304, nach oben gestapelt, ≤ 3 Zeilen | Quelle + Datum | G6 |
| Untertitel-Zone | y 1350–1490, x 108–972 | nur Schlüsselwörter (§3) | G5, siehe unten |
| App-Zone (v) | y 1520–1920 | Antwort-Tipps der App; Welt läuft weiter, keine Information | Gerätetest |

- Text steht linksbündig an x = 108. Zentriert ist Text nur, wenn er an einem zentrierten Gegenstand hängt (Name unter einem Punkt).
- Die Welt (Karte, Rasterpapier, Spaltenraster, Foto) reicht an alle vier Bildränder. Nichts schwebt auf leerem Navy.
- **Held:** Entweder füllt die Welt das Bild und ein Darsteller ist ≥ 288 px (15 % der Bildhöhe) groß, oder ein Gegenstand bzw. Diagramm misst ≥ 465 px hoch (40 % des Lesefensters) bzw. ≥ 691 px breit (80 %).
- **Bild statt Text:** Ein Videobild zählt als „Bild“, wenn der Held kein Text ist und alle Textkästen zusammen ≤ 20 % der Lesefenster-Fläche bedecken (≤ 251 000 px²). Das gilt für ≥ 50 % aller Bilder (G0/G6).
- Tor für die Untertitel-Zone (geprüft am 27.10. an einer Kopie von A+: 0 Fehler; eine Credit-Zeile auf y = 1420 gibt `caption_zone_collision`, Exit 1):
  `npx hyperframes check --caption-zone "x0=0;y0=.693;x1=1;y1=1;severity=error"`. Untertitel tragen `data-layout-allow-caption-zone`.

## 3. Typografie

| Stufe | Schrift | Größe | Zeilenhöhe | Laufweite | Farbe | Grenze |
|---|---|---|---|---|---|---|
| D1 Display | Playfair Display 900 | 173 px (9 %) | 1,0 | −0,02 em | Gold oder Creme | Zahl oder ≤ 2 kurze Wörter, 1 Zeile ≤ 864 px |
| D2 Display | Playfair Display 900 | 124 px (6,5 %) | 1,0 | −0,02 em | Creme | Namen, Schlagzeilen ≤ 5 Wörter, ≤ 2 Zeilen |
| T Text | Inter 600 | 48–56 px, Standard 52 | 1,2 | 0 | Creme ≥ 78 % | ≤ 7 Wörter je Zeile, ≤ 2 Zeilen je Block |
| O Ort | Inter 600 | 48 px | 62 px | 0 | Creme 100 % | 30 px neben dem Punkt |
| L Land | Inter 600, Versalien | 34 px | 42 px | +0,32 em | Creme 46 % | weg ab Zoom 2,4 |
| C Credit | Inter 400 | 34 px | 42 px | 0 | Creme 62 % | „Gegenstand: Quelle, TT.MM.JJJJ“ |
| U Untertitel | Inter 600 | 52 px | 64 px | 0 | Creme 100 % | ≤ 3 Wörter, nur wenn das Wort nicht schon im Bild steht |

- **Schriften:** nur Playfair Display 900, Inter 400 und Inter 600. Sie liegen lokal als woff2 unter `assets/fonts/` (mit OFL) und heißen „DT Playfair“ bzw. „DT Inter“. Nie über einen Google-Fonts-Link einbinden, denn der Live-Player lädt keine fremden Schriften (Spike, Befund 1).
- **Breite messen, nicht schätzen.** Passt eine Zeile nicht, werden Wörter gestrichen oder es geht eine Stufe tiefer, nie unter 48 px. Beispiel: „Lewandowski“ ist in D1 1072 px breit, also D2 (768 px).
- **Ziffern:** Playfair immer mit `font-variant-numeric: lining-nums; font-feature-settings: "lnum" 1`. Zählende Zahlen zusätzlich mit `tabular-nums`, damit die Breite beim Zählen nicht springt.
- **Zahlformat:** echtes Minus „−“ (U+2212). Zwischen Zahl und Einheit ein geschütztes Leerzeichen („45 Mio. €“). Tausenderpunkt ab fünf Stellen, Datum als TT.MM.JJJJ. Im Bild steht „Mio.“/„Mrd.“, im Ton das ausgeschriebene Wort; G1 normalisiert beides.
- **Eigennamen:** so geschrieben wie in der Quelle, Vereine mit offizieller Kurzform („FC Bayern“). Die Aussprache-Schreibung (`Barsselona`) steht nie im Bild. Anführungszeichen „…“.
- **Nie:** kursiv, Versalien außerhalb von L und Editorial-Balken, Monospace.
- **Lesbarkeit über Karte oder Foto** nur mit dunklem Schatten `0 2px 18px rgba(14,23,38,.9)`, nie mit hellem Schein.

## 4. Farbe

| Rolle | Hex | bedeutet | Anteil je Bild |
|---|---|---|---|
| Navy Grund | `#0E1726` | Grund, Meer | Rest |
| Navy Fläche | `#1F3864` | zweite Ebene: Streifen, Balken, Diagrammflächen | frei |
| Kartentöne (nur Atlas) | Land `#222D40`, Küste `#5A6880`, Grenze `#36435A`, Region `#2A4069`, Schein `#6F8FC4` 55 %, Regionsrand `#9DB2D6` 70 % | Geografie | frei |
| Creme | `#F5F0E8` | gegeben: Bekanntes, Orte, Text | Flächen ≤ 25 % |
| Gold | `#C9A84C` | **gesuchte Größe** | ≤ 10 %; ein Gold-Gegenstand und seine Zahl |
| Rot | `#E07A5F` | **Irrtum oder Verlust** | ≤ 3 %, ≤ 1 Element je Bild, immer mit zweitem Merkmal (Durchstrich, „−“) |

- **Kein Ton außerhalb dieser Tabelle.** Neue Töne kommen nur über eine Änderung dieser Datei.
- **Kontrast**, nach WCAG berechnet; G5 meldet 0 Kontrast-Warnungen:

| Text | Minimum | heißt | schwächster Grund |
|---|---|---|---|
| T, O, U, C | 4,5 : 1 | Creme ≥ 62 % Deckkraft | Region `#2A4069`: 4,59 |
| L (Ländernamen) | 3 : 1 | Creme ≥ 46 % | Region 3,25 (gemessen: bei 36 % meldete `check` 2,8–2,9) |
| Gold-Text | 4,5 : 1 | auf allen Navy-Tönen erfüllt | Region 4,51 |
| Rot-Text | 3 : 1, nur ab 48 px | | Region 3,50, `#1F3864` 3,94 |

- **Verboten:** Gold oder Rot auf Creme (2,0 : 1 bzw. 2,6 : 1). Creme als ganzflächiger Grund.
- **Fotos:** Sättigung 0. Duoton von `#0E1726` (Schatten) nach `#F5F0E8` (Lichter), über `/media-use` „Monochrome Screen Print“ mit `palette: ["#0E1726", "#F5F0E8"]`, nie mit selbstgebauten CSS-Filtern. Farbe kommt nur über die Marker-Ebene ins Foto.
- **Karten:** nur Kartentöne. Genau eine Region ist hervorgehoben.
- **Verläufe** nur radial (Vignette, Schatten). Lineare Verläufe bilden im H.264-Video Streifen.
- **Kein Korn.** Festes Korn war im Handy-Blatt unsichtbar und verdoppelte die MP4.

## 5. Bewegung

| Regel | Wert | Prüft |
|---|---|---|
| Halten nach jeder Landung (Text, Darsteller, Marker) | ≥ 1,2 s | Bau, G7 |
| Lesezeit eines Textes | ≥ 0,5 s + 0,3 s je Wort; letzte Zeile ≥ 2 s; komplexes Diagramm (≥ 3 neue Elemente) 6–8 s | G6 |
| Standdauer eines Textes | ≥ 1,7 s; im Normalfall steht Text bis zur nächsten Naht (gemessen, docs/research/referenz-destillation.md: kein Vorbild-Element unter 1,7 s, typisch 3–5 s; Entscheidung 27.10.) | G6 |
| Gelandeter Text | 0 px/s bis zum Austritt; keine Atem-, Schwebe- oder Kriechschleifen | G7 |
| Kamera steht in der Lesezeit | Kamera-Spur hat gleiche Schlüsselbilder vom Eintritt bis zum Ende der Lesezeit jedes HUD-Textes | Bau, G7 |
| Gleichzeitige Bewegungen | ≤ 2 bewegte Ziele: eine Hauptbewegung plus ≤ 1 Nebenbewegung (50–70 % des Wegs, 100–200 ms später). Kamera zählt mit, Darsteller samt Schatten zählt als 1, Credits zählen nicht | G7 |
| Cue | Eintritt beginnt am Anfang des Cue-Worts, Startwert −2 Bilder (gemessen, docs/research/referenz-destillation.md); Toleranz ±150 ms | G6 |
| Bildwechsel | nur bei neu genanntem Gegenstand | G8 |
| Austritt | 40–50 % der Eintrittsdauer: Unschärfe 8 px plus Deckkraft, 0,13–0,25 s, `power2.in`; nie gleiten, stoppen, gehen | G7 |
| Eases nach Rolle | Ankunft `expo.out`/`power4.out`, Kamera `power2.inOut`, Austritt `power2.in`/`power3.in`; Federn (`back.out` ≤ 3) nur für Lage und Größe, nie für Deckkraft oder Farbe; `linear` nur für konstantes Tempo | G8 |
| Wiederholung | derselbe Eintritt ≤ 2× in Folge und ≤ 40 % aller Eintritte eines Videos | G7 |
| Fahrtrichtung | gleich der Flussrichtung des Bedeuteten: Das Geld fliegt vom Käufer zum Verkäufer | G8 |

**Übergänge**, höchstens ⅓ der Nähte sind harte Schnitte:

| Übergang | bedeutet | Ausführung |
|---|---|---|
| Zoom-in | Detail derselben Welt | Kamerafahrt 0,5 s, Spanne 0,4–0,7 s (gemessen, docs/research/referenz-destillation.md), `power2.inOut`, Zoom logarithmisch; erst nach der Lesezeit |
| Morph | derselbe Gegenstand verwandelt | alt: Unschärfe 0 → 10 px, Maßstab 1 → 1,3, 0,18 s `power2.in`; neu nach +0,06 s: Unschärfe 10 → 0 px, Maßstab 0,72 → 1, 0,32 s `expo.out` |
| Schnitt | neues Thema | hart, 0 Bilder, auf dem Nomen des neuen Gegenstands |

Verboten sind Kreuzblenden zwischen Welten, Wischblenden und Deko-Übergänge.

**Eintritte je Identität:**

| Identität | Name | Was | Dauer | Ease |
|---|---|---|---|---|
| Editorial | Setzen | Schlagzeile Wort für Wort: Unschärfe 6 → 0 px, Deckkraft 0 → 1, kein Versatz | 0,13 s je Wort, Abstand 0,067 s | `power2.out` |
| Editorial | Ausschnitt | Streifen kommt seitlich von außerhalb des Bildes an seinen Spaltenplatz, Drehung 6° → 1,5° | 0,55 s | `expo.out` |
| Editorial | Balken | Balken wischt von links (scaleX 0 → 1, Ursprung links); die Versalien darauf stehen hart am Ende | 0,3 s | `power3.inOut` |
| Diagramm | Zeichnen | Strich-Offset L → 0 (Achsen, Kurven) | 900–1200 px/s | `power1.inOut` |
| Diagramm | Einrasten | Punkt Maßstab 0 → 1; Beschriftung +0,12 s, Unschärfe 8 → 0 px in 0,2 s `power2.out` | 0,35 s | `back.out(2.2)` |
| Diagramm | Zählen | Zahl zählt vom gegebenen zum gesuchten Wert, ganze Schritte, `tabular-nums` | 0,8–1,2 s | `power2.out` |
| Atlas | Fallen | Darsteller fällt 560 px auf den Ort; Aufprall staucht scaleY auf 0,84 (0,07 s), federt zurück (0,3 s `back.out(3)`) | 0,42 s | `power2.in` |
| Atlas | Ort setzen | Punkt wie bei „Einrasten“, Name +0,12 s mit Unschärfe 8 → 0 px | 0,35 + 0,2 s | `back.out(2.2)` / `power2.out` |
| Atlas | Flug | steigen 0,45 s `power2.out`, reisen `power1.inOut`, sinken 0,5 s `power2.in`; Schatten am Boden | 1,7 s (v) | siehe Was |

## 6. Marker-Ebene

| Marker | Strich | Dauer, Ease | Form | Abtritt |
|---|---|---|---|---|
| Kreis | 10 px plus zweite Spur (3,5 px, 45 %, versetzt um +1,5/−2 px) | 0,5 s, `power1.inOut` | 1,15 Umläufe, Radius wächst 12 %, gekippt; 24 px Luft um das Ziel | Deckkraft 0,2 s `power1.in`, wenn der Darsteller den Ort übernimmt |
| Unterstreichung | wie Kreis | 0,35 s, `power1.inOut` | Textbreite −6/+14 px, steigt 10 px an, Bogen 7 px; Abstand unter der Grundlinie 0,08–0,12 × Schriftgröße (v) | steht mit dem Text |
| Pfeil (v, noch nicht gebaut) | 8 px | Schaft 0,4 s, Spitze 0,12 s danach | Bogen 8–15 % der Länge, Spitze aus 2 Strichen à 28 px mit 35°; zeigt vom Wort auf den Helden | mit der Szene |
| Durchstrich | 10 px, nur Rot | 0,3 s, `power2.out` | ein Strich, −4°, 12 px Überstand je Seite | steht bis zur Widerlegung |
| Haken / Kreuz | 10 px; Haken Creme oder Gold, Kreuz nur Rot | 0,15–0,2 s auf dem bewertenden Wort (gemessen) | Pinselstrich, zwei Züge | mit der Szene |
| Klammer | 6 px | 0,4–0,7 s (gemessen) | geschweift oder eckig, fasst Teile zum Ganzen; Beschriftung am Scheitel | mit der Szene |
| Flusspfeil | 8 px | 0,4–0,6 s, kommt auf dem Wort an (gemessen) | folgt der Flussrichtung des Bedeuteten (Geld, Ware, Person) | mit der Szene |
| Textmarker | Fläche 35 % Gold unter dem Wort | 0,4 s von links (gemessen) | 1,15 × Zeilenhöhe | steht mit dem Text |
| Abdunkeln | alles außer dem Gemeinten auf 35 % Deckkraft | 0,3 s | kein Strich | bis zum nächsten Beat |

- **Häufigkeit (gemessen):** In 778 s Vorbild-Material kommt kein handgezeichneter Kreis vor; Kreise gibt es dort nur in Vorschaubildern. Häufig sind Haken/Kreuz, Klammern, Flusspfeile, Textmarker und Abdunkeln. Deshalb: höchstens 1 Kreis je Video, sonst die übrigen Marker.
- **Farbe:** Creme für Ort oder Gegebenes, Gold für die gesuchte Größe, Rot nur für den Irrtum.
- **Timing:** Das Zeichnen beginnt am Anfang des Cue-Worts (±150 ms). Danach steht der Marker ≥ 1,2 s fertig (Bau prüft).
- **Ruhe im Umfeld:** Im Umkreis von 200 px ist der Marker das einzige helle Zeichen. Regionsrand ≤ 70 %, Schein ≤ 55 %; der Ortsname darf stehen.
- **Menge:** ≤ 1 Marker zeichnet gleichzeitig, ≤ 2 sind je Bild sichtbar. Markiert wird nur, was gerade gesprochen wird.
- **Anker:** Auf Karte und Diagramm hängen Marker weltverankert in `<g data-anker>`. Marker im HUD gibt es nur bei stehender Kamera.
- **Seek-sicher** (`lib/marker.js`): fester `seed` statt `Math.random()`, nur `fromTo`, Deckkraft 0 bis zum Cue, Strichmuster L/L+20 mit Offset L+10 → 0.

## 7. Identitäten

Jedes Video hat eine Hauptidentität. Eine zweite kommt nur per Schnitt (neues Thema) oder per Morph eines Darstellers, der dasselbe bedeutet. Zwei Identitäten stehen nie im selben Bild. Beispiel: Den Fall erzählt Atlas, das Modell zeigt Diagramm.

### Editorial (Rhetorik, Philosophie, Bücher, Style, Disziplin; nur Linus)

- **Spaltenraster:** 6 Spalten à 124 px mit 24 px Steg, zusammen 864 px ab x = 108. Haarlinien 2 px, Creme 24 %, zwischen Spalten oder über der Schlagzeile.
- **Schlagzeile:** D1 oder D2, linksbündig an einer Spaltenkante. Betont wird mit einer Unterstreichung (§6), nie mit Kursiv oder einem Farbwort.
- **Ausschnitt:** Streifen in `#1F3864` mit Papierriss-Kante, 1–3° gedreht, Schatten `0 6px 18px rgba(3,7,14,.7)`.
- **Balken:** Creme-Fläche ≤ 864 × 140 px mit Navy-Versalien (Inter 600, 15,8 : 1).
- **Foto als Held:** Duoton mit Rasterpunkten (§4). Die Zellgröße muss im Handy-Blatt (360 px) sichtbar sein (v).
- **Passer-Versatz** der Zweitfarbe: 4 px (v). Die 2–3 px aus §3 der Pipeline werden am Handy zu < 1 px, nur Flächen und Fotos, nie Text unter 124 px.
- **Verbote:**
  1. kursive Akzentwörter;
  2. zentrierter Text auf leerem Grund;
  3. nachgebaute Logos oder Layouts echter Medien. Eine fremde Schlagzeile steht nur wörtlich da, mit Medium und Datum im Credit.

### Diagramm (Naturwissenschaft, Mathe, Schul-Transfer, Wirtschaftsmodelle)

- **Rasterpapier bis an die Bildränder:** Kleinkaro 24 px (1 px, Creme 6 %), Großkaro 144 px = 6 × 6 Kleinkaro (2 px, Creme 12 %), ausgerichtet an x = 108 und y = 168.
- **Anker:** Jeder Punkt, jede Achse und jede Beschriftung sitzt auf einem Großkaro-Knoten oder an einer Achse; der Bau rundet auf 24 px.
- **Achsen:** 4 px, Creme 80 %, Pfeilspitze 20 px. Beschriftung in Stufe T, ≤ 2 Wörter, direkt an der Achse.
- **Kurven und Linien** 8 px, Punkte 24 px. Gold für die gesuchte Größe, Creme für das Gegebene.
- **Herleitung:** ein Diagramm, eine Kamera, kein Schnitt. Neue Elemente kommen ins bestehende Diagramm, Details per Zoom-in.
- **Verbote:**
  1. ein Diagramm in einer Karte oder Box mit runden Ecken (wie die „Tauschkurve“ der alten Probe);
  2. Legenden, 3D, Schlagschatten oder Verläufe im Diagramm;
  3. eine Achse ohne Bedeutung oder eine Zahl ohne Fakt in `facts[]`.

### Atlas (Geopolitik und Geschichte, Wirtschaftslage)

- **Karte:** Natural Earth in Lambert konform-konisch. 50m-Daten; 10m nur bei Zoom > 2,5, denn 10m kostet etwa +10 s Renderzeit je 15 s Video. Linien bleiben bildschirmkonstant (Küste 1,5 px, Grenze 1,1 px, Netz 1 px, jeweils geteilt durch den Zoom).
- **Eine Region leuchtet:** Fläche, 14-px-Schein und 2-px-Rand (§4). Füllt sie mehr als 50 % des Bildes, hat sie 50 % Deckkraft. Das ist der einzige erlaubte Schein im ganzen Haus.
- **Orte:** Punkt 24 px Creme mit 6-px-Navy-Ring, Name in Stufe O. Namen blenden aus, bevor sie den Rand bei 108 px erreichen. Ländernamen in Stufe L.
- **Darsteller:** ≥ 288 px, beleuchtet (Verlauf und Lichtkante), mit Schlagschatten am Boden. Nur die Karte zoomt, Darsteller und Namen bleiben bildschirmgroß.
- **Route:** gepunktet in Gold, 5 px, Strich 2 px, Lücke 16 px, in Flussrichtung.
- **Fotos und Belege:** Archivfotos (Wikimedia, Library of Congress) im Duoton mit „Foto: Urheber, Archiv, Jahr“. Schlagzeilen-Belege mit Quelle und Datum.
- **Vignette:** radial, unter Text und Darsteller (sonst meldet `check` eine Verdeckung).
- **Verbote:**
  1. Karten-Pins, Tropfen-Icons und Flaggen-Icons statt Punkt und Name;
  2. ein Globus-Dreh oder Weltraum-Flug als Einstieg;
  3. mehr als eine leuchtende Region gleichzeitig.

## 8. BANNED

Was nach Folie oder Standard-KI aussieht. G8 fragt an jedem Beat-Blatt: „Trifft ein Punkt zu?“ Jeder Treffer wird notiert als „t · wo · Problem → Änderung“. Nach jedem Render kommt jeder neu bemerkte Standard dazu, die Liste wächst.

1. Zentrierter Text auf leerem Navy; kleine Dinge, die in der Bildmitte schweben (alte Probe, 0–45 s).
2. Kategorie-Kopfzeile in gesperrten Gold-Versalien („WIRTSCHAFT & MÄRKTE · DEEPTOK“); ein Logo oder Label in der Ecke.
3. Untertitel als Pillen oder Boxen; Karaoke-Grau für noch nicht gesprochene Wörter.
4. Der gesprochene Satz als Bildschirmtext (Voll-Untertitel, Zitatkarte des Sprechtexts).
5. Bullet-Listen, nummerierte „01 / 02“-Labels, drei Karten nebeneinander, KPI-Raster, ein Titel über einem abgedunkelten Screenshot.
6. Stock-Icons, Emoji, Clipart, Flaggen-Icons.
7. Glow, Bloom, Neon, Lens-Flares, leuchtende Kugeln oder Ringe (einzige Ausnahme: der Regionsschein im Atlas).
8. Lila oder blaue Verläufe, Mesh-Gradients, Glas-Karten, lineare Verläufe als Grund.
9. Zufällige oder schwebende Partikel; Korn, das im Handy-Blatt nicht zu sehen ist.
10. Alles blendet zugleich ein; jedes Element gleitet von unten herein; überall dieselbe Ease (`power2.out`, 0,5 s).
11. Text, der sich bewegt, während er gelesen wird; Kamerafahrt unter Lesetext; atmende Titel.
12. Kursive Akzentwörter, Creme-Papier-Grund mit Serife, Monospace-Labels, Pillen-Chips.
13. Rahmen, Eckwinkel oder Boxen mit runden Ecken um Diagramme und Inhalte.
14. Musik, Soundeffekte unter Sprache, Whoosh auf Übergängen.
15. KI-Bilder echter Personen oder als Beleg; KI-Bilder ohne das Label „Illustration“.
16. Kreuzblende zwischen zwei Welten; ein harter Schnitt ohne neu genannten Gegenstand (Testschnitt des Spikes bei 7,5 s).

## 9. Offene Werte (vorläufig)

Die Referenz-Destillation vom 27.10.2026 hat Schnitt, Titel-Timing und Tempo an fünf Vorbild-Clips gemessen (ZDF-Mediathek und Wikimedia Commons, je die ersten 180 s); nur die Zahlen stehen hier. Werte mit „gemessen“ gelten ab jetzt. Die übrigen Startwerte bleiben vorläufig, bis das Verfahren in der rechten Spalte sie festlegt:

| Wert | Stand | legt fest |
|---|---|---|
| Mittlere Einstellungsdauer (Schnittlänge) | 5 s (Median), Spanne 2–12 s (p10–p90) (gemessen, docs/research/referenz-destillation.md) | Destillation |
| Takt: etwas Neues im Bild | alle 3–4 s, nie länger als 8 s ohne neues Element (gemessen, docs/research/referenz-destillation.md) | Destillation |
| Titel-Timing: Hook-Schlagzeile | ab Bild 0 sichtbar (Vorschaubild; nicht messbar, bleibt vorläufig), steht 3 s (gemessen, docs/research/referenz-destillation.md) | Destillation |
| Titel-Timing: Eintritt relativ zum Wort | −2 Bilder (−67 ms), bestätigt: Vorbilder im Median −20 ms (gemessen, docs/research/referenz-destillation.md) | Destillation, G6 |
| Anteil harter Schnitte | ≤ ⅓ der Nähte, bestätigt: Grafik-Erklärer 0–21 % (gemessen, docs/research/referenz-destillation.md) | Destillation |
| Sprechtempo | 2,2 Wörter/s (G4: 2,0–2,6) (gemessen, docs/research/referenz-destillation.md) | Casting, Destillation |
| Kamerafahrt / Flug | 0,5 s, Spanne 0,4–0,7 s (gemessen, docs/research/referenz-destillation.md) / 1,7 s (vorläufig, kein Vorbild) | Destillation |
| Denkpause vor der Auflösung (im MP4) | 2,0 s (1,5–2,5) | Kalibrierung |
| Abstand der Unterstreichung, Pfeil-Maße | siehe §6 | Goldstandard |
| Passer-Versatz / Rasterpunkt-Zelle | 4 px / im Handy-Blatt sichtbar | Goldstandard (Handy-Blatt 360 px) |
| Untertitel- und App-Zone | y 1350–1490 / ab 1520 | Gerätetest |
| Text-Standard | 52 px (Grenze 48–56); Vorbild-Labels entsprechen im Median 51 px (gemessen, docs/research/referenz-destillation.md) | Goldstandard |
