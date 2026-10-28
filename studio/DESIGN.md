# DeepTok Haus-Design

Stand 28.10.2026 (Phase 1: Goldstandard v2.1 und Look-Katalog eingearbeitet). Gilt für jedes Video in `studio/` und jede Szene der Bibliothek.
Grundlage sind `docs/VIDEO-PIPELINE.md` §3/§5/§6, `studio/spike-buehne/REVIEW.md` (gemessen), die Beat-Blätter von alter Probe und Spike A+, `studio/gold-opportunitaetskosten/REVIEW.md` und `studio/looks/README.md`.

- **Looks:** Farben, Schriftpaar, Material und Takt wählt der Look (`studio/looks/README.md`). Raster, Typo-Mindestgrößen, Bewegung, Marker-Timing und BANNED gelten für jeden Look. §3 (Schriftfamilien) und §4 (Palette) beschreiben den Look Atlas Nacht; die übrigen Looks stehen in ihren Blättern (`studio/looks/<look>.md`).
- Maße in Bildpixeln bei 1080 × 1920, 30 fps. **Handy-Maßstab 0,36:** Auf einem 390-pt-Handy werden 34 px zu 12 pt und 2 px zu 0,7 pt. Was dort verschwindet, gibt es nicht (Korn-Lehre).
- **Prüft:** `Bau` heißt, der Bau bricht ab (`bauen.mjs`). G5 = `check`, G6 = DOM-Layout, G7 = DOM-Bewegung, G8 = Kritiker am Beat-Blatt.
- Werte mit **(v)** sind vorläufig, siehe §9.

## 1. Grundsätze

1. Jedes Bild lehrt etwas: Es zeigt Beziehung, Menge, Ort, Abfolge oder Zustand. Was den Entfern-Test nicht besteht, fliegt.
2. Jede Szene hat einen Helden, der kein Text ist. Text benennt nur Objekt, Zahl oder Schlüsselwort, nie den gesprochenen Satz.
3. Farbe ist Bedeutung: Jeder Look hat genau eine Farbe für die gesuchte Größe und eine für Irrtum oder Verlust (Tabelle in `studio/looks/README.md`; Atlas Nacht: Gold gesucht, Creme gegeben, Rot Irrtum oder Verlust, alles andere Navy). Rot heißt Irrtum oder Verlust. Einzige mögliche Ausnahme ist der Rotstift im Look Zeitungspapier: Er gilt erst, wenn Linus zustimmt, und dann bekommt der Irrtum dort einen schwarzen Zensurbalken. Bis dahin zeichnet Zeitungspapier mit dem Blaustift `#1F4FB5`, und Rot bleibt Irrtum. Der Irrtum hat immer ein zweites Merkmal (Durchstrich, ✗, „−“, Balken).
4. Jede Bewegung hat eine Ursache (ein Wort, ein Fluss, ein Detail). Was gelesen wird, steht still.
5. Nie: Musik, Deko-Bilder, Lob, erfundene Belege, KI-Gesichter echter Menschen.

## 2. Raster und Fläche

| Zone | Maß | Inhalt | Prüft |
|---|---|---|---|
| Kopfzone | y 0–168 | Welt läuft weiter, keine Information | G6 |
| **Lesefenster** | x 108–972, y 168–1330 (864 × 1162 px) | alles Lesbare, Mitte des Helden | G6 |
| Titel-Sicherheitsbreite | 864 px | gemessene Zeilenbreite jeder Zeile ≤ 864 | Bau (Playwright, Schrift geladen) |
| Credit-Ecke | Ort je Look (unten); Atlas Nacht: rechtsbündig an x = 972, Unterkante y = 1304, nach oben gestapelt, ≤ 3 Zeilen | Foto-Zeile, Quelle + Datum, Kurzlink | G6 |
| Untertitel-Zone | y 1350–1490, x 108–972 | nur Schlüsselwörter (§3) | G5, siehe unten |
| App-Zone (v) | y 1520–1920 | Antwort-Tipps der App; Welt läuft weiter, keine Information | Gerätetest |

- Text steht linksbündig an x = 108. Zentriert ist Text nur, wenn er an einem zentrierten Gegenstand hängt (Name unter einem Punkt).
- Die Welt (Karte, Rasterpapier, Spaltenraster, Foto; in den Looks auch Zeitungspapier, Schneidematte, Graupappe, Wiese, Fallblatt-Tafel) reicht an alle vier Bildränder. Nichts schwebt auf leerem Grund.
- **Held:** Entweder füllt die Welt das Bild und ein Darsteller ist ≥ 288 px (15 % der Bildhöhe) groß, oder ein Gegenstand bzw. Diagramm misst ≥ 465 px hoch (40 % des Lesefensters) bzw. ≥ 691 px breit (80 %).
- **Bild statt Text:** Ein Videobild zählt als „Bild“, wenn der Held kein Text ist und alle Textkästen zusammen ≤ 20 % der Lesefenster-Fläche bedecken (≤ 251 000 px²). Das gilt für ≥ 50 % aller Bilder (G0/G6). Abgedunkelte Texte (§6, „Abdunkeln“) zählen nicht mit. Gemessen wird im Player Bild für Bild (`build/messen-bild.mjs` im Goldstandard), auch Texte in der Welt.
- **Schrift auf Gegenständen** (Etikett, Papier, Tüte, Stempel) misst effektiv ≥ 48 px, also Schriftgröße × Bildschirm-Maßstab (Credits ≥ 34 px). Geprüft im Player Bild für Bild (`build/messen-bild.mjs` im Goldstandard); kurzes Federn beim Stempeln zählt nicht. Ein Zeichen, das nur Prägung ist (€ auf einer Münze), wird als Form gezeichnet, nicht als Text (Goldstandard, Runde 2: 26 px).
- **Nach einer Fahrt** steht kein Text halb am Bildrand: Was eine Nachfahrt (§5) aus dem Lesefenster schiebt, tritt vorher zurück (Goldstandard, Runde 1).
- **Credits, eine Regel für jeden Look** (Goldstandard v2.1, Look-Katalog):
  1. Solange ein fremdes Foto oder ein Clip zu sehen ist, steht seine Zeile „Foto: Urheber, Jahr, Lizenz“ samt Bearbeitung („bearb.“, „freigestellt“) im Bild. Diese Zeile weicht nie. Bricht sie an einem schmalen Ort um, zählt sie als zwei Zeilen. Prüfung im Goldstandard: Tor „Foto ohne Credit“ in `build/messen-bild.mjs`, 0 Proben erlaubt.
  2. Der Kurzlink `commons.wikimedia.org/?curid=<id>` steht darunter, wo Platz ist. Brauchen Etiketten der Welt oder Quellenzeilen den Platz, weicht der Kurzlink. Er steht mindestens einmal im Video, spätestens im Abspann.
  3. Wird es eng, gilt diese Reihenfolge: Foto-Zeile, dann Quelle + Datum der Zahl im Bild („Gegenstand: Quelle, TT.MM.JJJJ“), dann Kurzlink, zuletzt gemeinfreie Grundlagen („Karte: Natural Earth“).
  4. Höchstens 3 Zeilen je Credit-Block. Nur die senkrechte Spalte im Zeitungspapier fasst bis 5, weil dort jede Zeile kurz ist.
  5. Der Ort hängt vom Look ab: Atlas Nacht in der Credit-Ecke rechts; Zeitungspapier senkrecht an der Bildkante; Labor unter der Fußlinie; Archiv-Duoton auf dem Rand des Abzugs; Flach unter der Foto-Einlage; Kurstafel als Aufdruck auf dem Gehäuse. Überall ≥ 34 px und im Lesefenster.
  6. Daneben führt `credits.json` jede Fremddatei (`factory/werk/bilder.py`, `credits_eintrag`). Zeigt ein Video eine Bearbeitung eines CC-BY-SA-Fotos, bekommt es `lizenz_video` in `credits.json` und eine Abspann-Zeile mit seiner Lizenz (Goldstandard: „Video: creativecommons.org/licenses/by-sa/4.0“).
- Tor für die Untertitel-Zone (geprüft am 27.10. an einer Kopie von A+: 0 Fehler; eine Credit-Zeile auf y = 1420 gibt `caption_zone_collision`, Exit 1):
  `npx hyperframes check --caption-zone "x0=0;y0=.693;x1=1;y1=1;severity=error"`. Untertitel tragen `data-layout-allow-caption-zone`.

## 3. Typografie

Größe, Zeilenhöhe und Grenze jeder Stufe gelten für jeden Look. Die Spalten Schrift und Farbe zeigen Atlas Nacht; die übrigen Looks nennen ihre Familien und Farben im Look-Blatt.

| Stufe | Schrift | Größe | Zeilenhöhe | Laufweite | Farbe | Grenze |
|---|---|---|---|---|---|---|
| D1 Display | Playfair Display 900 | 173 px (9 %) | 1,0 | −0,02 em | Gold oder Creme | Zahl oder ≤ 2 kurze Wörter, 1 Zeile ≤ 864 px |
| D2 Display | Playfair Display 900 | 124 px (6,5 %) | 1,0 | −0,02 em | Creme | Namen, Schlagzeilen ≤ 5 Wörter, ≤ 2 Zeilen |
| T Text | Inter 600 | 48–56 px, Standard 52 | 1,2 | 0 | Creme ≥ 78 % | ≤ 7 Wörter je Zeile, ≤ 2 Zeilen je Block |
| O Ort | Inter 600 | 48 px | 62 px | 0 | Creme 100 % | 30 px neben dem Punkt |
| L Land | Inter 600, Versalien | 34 px | 42 px | +0,32 em | Creme 46 % | weg ab Zoom 2,4 |
| C Credit | Inter 400 | 34 px | 42 px | 0 | Creme 62 % | „Gegenstand: Quelle, TT.MM.JJJJ“ |
| U Untertitel | Inter 600 | 52 px | 64 px | 0 | Creme 100 % | ≤ 3 Wörter, nur wenn das Wort nicht schon im Bild steht |

- **Schriften:** je Look ein Paar aus `studio/looks/werkzeug/schriften.json` (OFL, gepinnte Version, SHA-256), lokal als woff2 unter `assets/fonts/`, mit eigenen `@font-face`-Namen je Look. Atlas Nacht: Playfair Display 900, Inter 400 und Inter 600, Namen „DT Playfair“ bzw. „DT Inter“. Nie über einen Google-Fonts-Link einbinden, denn der Live-Player lädt keine fremden Schriften (Spike, Befund 1).
- **Breite messen, nicht schätzen.** Passt eine Zeile nicht, werden Wörter gestrichen oder es geht eine Stufe tiefer, nie unter 48 px. Beispiel: „Lewandowski“ ist in D1 1072 px breit, also D2 (768 px).
- **Zahl mit Einheit:** Passt die Zahl samt Einheit in D1 nicht ins Lesefenster, steht die Einheit in D2 auf derselben Grundlinie („45“ in 173 px, „Mio. €“ in 124 px; Flach, Archiv-Duoton). Einzige Ausnahme von 173 px: schmale Display-Schriften, deren Versalhöhe bei weniger Pixeln gleich groß wirkt (Anton 150 px im Zeitungspapier).
- **Ziffern:** Playfair immer mit `font-variant-numeric: lining-nums; font-feature-settings: "lnum" 1`. Zählende Zahlen zusätzlich mit `tabular-nums`, damit die Breite beim Zählen nicht springt.
- **Zahlformat:** echtes Minus „−“ (U+2212). Zwischen Zahl und Einheit ein geschütztes Leerzeichen („45 Mio. €“). Tausenderpunkt ab fünf Stellen, Datum als TT.MM.JJJJ. Im Bild steht „Mio.“/„Mrd.“, im Ton das ausgeschriebene Wort; G1 normalisiert beides.
- **Eigennamen:** so geschrieben wie in der Quelle, Vereine mit offizieller Kurzform („FC Bayern“). Die Aussprache-Schreibung (`Barsselona`) steht nie im Bild. Anführungszeichen „…“.
- **Nie:** kursiv, Versalien außerhalb von L und Editorial-Balken, Monospace.
- **Lesbarkeit über Karte oder Foto** nur mit dunklem Schatten `0 2px 18px rgba(14,23,38,.9)`, nie mit hellem Schein. Credits über Linien der Karte (Route) bekommen dazu einen engen zweiten Schatten `0 0 4px rgba(14,23,38,.9)`.
- **D2 zweizeilig mit Unterstreichung:** Zeilenhöhe 1,1 statt 1,0, sonst berührt der Strich die Oberlängen der zweiten Zeile (gemessen am Goldstandard).
- **Daten stehen in der Credit-Zeile,** nicht als eigene Dateline über der Schlagzeile: Sie kostete im Hook eines von elf Textelementen, und Darsteller flogen durch sie hindurch (Goldstandard, Runde 1).

## 4. Farbe

Die Tabelle ist die Palette von Atlas Nacht. Die übrigen Paletten stehen in den Look-Blättern. Für jeden Look gelten: genau eine Farbe für die gesuchte Größe und eine für Irrtum oder Verlust (§1), Kontrast nach WCAG mit Text ≥ 4,5 : 1 (fett ab 48 px ≥ 3 : 1) sowie Marker und Formen ≥ 3 : 1, Verläufe nur radial, kein Korn.

| Rolle | Hex | bedeutet | Anteil je Bild |
|---|---|---|---|
| Navy Grund | `#0E1726` | Grund, Meer | Rest |
| Navy Fläche | `#1F3864` | zweite Ebene: Streifen, Balken, Diagrammflächen | frei |
| Kartentöne (nur Atlas) | Land `#222D40`, Küste `#5A6880`, Grenze `#36435A`, Region `#2A4069`, Schein `#6F8FC4` 55 %, Regionsrand `#9DB2D6` 70 % | Geografie | frei |
| Creme | `#F5F0E8` | gegeben: Bekanntes, Orte, Text | Flächen ≤ 25 % |
| Gold | `#C9A84C` | **gesuchte Größe** | ≤ 10 %; ein Gold-Gegenstand und seine Zahl |
| Rot | `#E07A5F` | **Irrtum oder Verlust** | ≤ 3 %, ≤ 1 Element je Bild, immer mit zweitem Merkmal (Durchstrich, „−“) |

- **Kein Ton außerhalb der Palette des Looks.** Neue Töne kommen nur über eine Änderung des Look-Blatts (bei Atlas Nacht: dieser Datei).
- **Kontrast**, nach WCAG berechnet; G5 meldet 0 Kontrast-Warnungen:

| Text | Minimum | heißt | schwächster Grund |
|---|---|---|---|
| T, O, U, C | 4,5 : 1 | Creme ≥ 62 % Deckkraft | Region `#2A4069`: 4,59 |
| L (Ländernamen) | 3 : 1 | Creme ≥ 46 % | Region 3,25 (gemessen: bei 36 % meldete `check` 2,8–2,9) |
| Gold-Text | 4,5 : 1 | auf allen Navy-Tönen erfüllt | Region 4,51 |
| Rot-Text | 3 : 1, nur ab 48 px | | Region 3,50, `#1F3864` 3,94 |

- **Verboten:** Gold oder Rot auf Creme (2,0 : 1 bzw. 2,6 : 1). Creme als ganzflächiger Grund.
- **Fotos:** Behandlung je Look (`studio/looks/README.md`, Tabelle „Behandlung je Look“), geholt und vermerkt über `factory/werk/bilder.py`. Rasterdruck und Duoton entstehen über HyperFrames-Behandlungen oder `bilder.duoton`/`bilder.graustufen`, nie mit selbstgebauten CSS-Filtern.
  - **Atlas Nacht:** Duoton von `#0E1726` (Schatten) nach `#F5F0E8` (Lichter). Zwei Wege: gerastert über `/media-use` „Monochrome Screen Print“ mit `palette: ["#0E1726", "#F5F0E8"]`, oder kornfrei in die Datei gebacken (`bilder.duoton`; Goldstandard, `build/foto.py`). Sonst kommt Farbe nur über die Marker-Ebene ins Foto.
  - **Echtfoto-Moment** (Goldstandard v2.1, Hook): Ein echtes Foto darf einmal je Video in eigenem Ton auftreten. Sättigung ca. 70 %, Schatten Richtung Grund des Looks (Atlas: Navy), Hintergrund weichgezeichnet und abgedunkelt, damit Zuschauer nicht erkennbar sind. Der Abzug steht ≥ 2,0 s, dann wird er per Morph zum Duoton-Darsteller.
  - **Zurücktreten:** Ein Foto tritt über eine dunkle, deckende Fassung zurück (Goldstandard: `lewandowski-dunkel.png`, Navy plus 35 % des Duotons). Die helle Fassung blendet über der dunklen aus. Nie über Deckkraft, sonst scheint die Welt durch das Foto.
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
| Nachfahrt | Detail derselben Einstellung, wenn der Held nicht von selbst wächst | Welt, Darsteller, Etiketten und Marker zusammen (eine Hülle `data-rig`), Faktor 1,25 bis 2, 0,5 s `power2.inOut`, logarithmisch, um einen festen Bildpunkt. Das HUD bleibt fest. Erst nach der Lesezeit; der Bildpunkt liegt so, dass kein Text aus dem Lesefenster rutscht (am linken Rand: fx = 108); was am anderen Rand halb stünde, tritt vorher zurück |
| Drehung | dieselbe Sache von der anderen Seite (Perspektivwechsel, z. B. Behalten → Verkaufen) | Gegenstand dreht sich um seine Achse, 0,6 s `power2.inOut`: flache Teile stauchen mit cos, die vordere Seite wird 10 % größer und 26 px tiefer, die hintere läuft hinter der Säule. Beschriftungen bleiben auf ihrer Bildseite und sind aus, solange der Betrag von cos unter 0,35 liegt; ein Schild hat Vorder- und Rückseite |
| Zoom-out-Fahrt (Atlas Nacht) | ein zweiter Ort derselben Welt | 0,6 s `power2.inOut`; Orte, Gegenstände und Namen hängen an Ankern und laufen mit derselben Kurve mit. Texte, die aus dem Lesefenster rutschen würden, treten vorher zurück. Die leuchtende Region wechselt: die alte geht während der Fahrt (0,3 s), die neue kommt am Ende (0,3 s) |
| Kamerafahrt auf der Schiene (Labor) | ein zweiter Platz auf derselben Werkbank (Vergleich) | seitlich, 0,6 s `power2.inOut`; die Matte verschiebt sich in ihrer eigenen Ebene, Gegenstände um denselben Weg auf ihrer Fußlinie. Bänder und Linien treten vorher zurück |
| Stapel (Archiv-Duoton) | ein neues Dokument derselben Akte | ein neuer Abzug gleitet über den alten, 0,45 s `expo.out`, Drehung 7° → Endlage; eine neue Karteikarte gleitet von der Seite auf die alte (0,45 s). Die Kamera steht |
| Morph Foto → Zeichnung (Flach) | der echte Ort oder Gegenstand wird zum Modell | wie Morph. Das Foto steht vorher ≥ 1,7 s mit Credit, dann wird es unscharf und größer, die Zeichnung kommt aus 72 % Größe |
| Klappen-Welle (Kurstafel) | neues Thema auf der Tafel | alle Module klappen auf leer, Welle von links mit 0,03 s je Modul, dann die neue Tafel |

- **Neigung eines Modells** (Waage) nur mit sichtbarer Ursache: Etwas setzt auf, etwas bekommt Gewicht, oder es wird entschieden. Ein Darsteller, der schon auf der Schale steht, ohne dass sie sich neigt, lehrt „Neigung folgt nicht dem Gewicht“ (Goldstandard, Runde 2).
- **Drehung** nur bei stehender Kamera, am besten in einer deklarierten Atempause (`atem_s`): Die Mitte der Drehung (Schild auf der Kante) liegt auf dem Wort der neuen Sicht. Fährt die Kamera dabei, sieht man nicht, was wohin wandert.
- **Morph Geist → echt** erst, wenn der Gegenstand auf seiner neuen Seite liegt. Echtes Geld auf der Kosten-Seite unter „Behalten“ widerspricht der Bedeutung des Geists.
- **Höchstens eine Bedeutungsänderung je Sekunde** an einem Modell (Neigung, Morph, Drehung, Etikett). Was dichter liegt, bekommt eine Atempause im Skript statt schnellerer Bewegung.

Verboten sind Kreuzblenden zwischen Welten, Wischblenden und Deko-Übergänge.

**Eintritte je Identität und Look** (die Look-Zeilen stammen aus den Proben, `studio/looks/werkzeug/looks_<look>.py`):

| Identität / Look | Name | Was | Dauer | Ease |
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
| Zeitungspapier | Ausschnitt | Papierstreifen kommt von außerhalb des Bildes, Drehung 6° → 2° | 0,55 s | `expo.out` |
| Zeitungspapier | Balken | wie Editorial: Balken wischt von links, Zahl hart am Ende | 0,3 s | `power3.inOut` |
| Zeitungspapier | Aufkleben | ausgeschnittene Figur kommt 3 % zu groß und 2° verdreht und sitzt | 0,2 s | `power3.out` |
| Labor | Kleben | Band kommt 4 % zu groß und 3° verdreht und sitzt; Deckkraft 0,06 s | 0,2 s | `power3.out` |
| Labor | Linie ziehen | Hinweislinie zeichnet sich; Maßlinie mit Endstrichen | 0,3 s / 0,35 s | `power2.out` / `power1.inOut` |
| Archiv-Duoton | Tippen | Zeichen für Zeichen, 22 Zeichen/s | je nach Länge | hart |
| Archiv-Duoton | Stempeln | Stempel kommt 1,6-fach und −6° gedreht und sitzt | 0,28 s | `back.out(2.2)` |
| Flach | Ploppen | Lage und Größe federn; Deckkraft nur 0,08 s linear | 0,4 s | `back.out(2.2)` |
| Flach | Wachsen | aus dem Boden, `scaleY` 0 → 1, Ursprung unten | 0,5 s | `back.out(1.6)` |
| Flach | Einschwingen | Schild dreht um sein Loch, −24° → −3° | 0,55 s | `back.out(2.2)` |
| Kurstafel | Klappen | jede Hälfte 0,05 s (oben `power1.in`, unten `power1.out`), zwei Zwischenzeichen; Welle 0,03 s je Modul | 0,11 s je Klappung | siehe Was |
| Kurstafel | Zählen | Balkenfelder kippen nacheinander auf die gesuchte Farbe, Abstand 0,09 s | je nach Länge | wie Klappen |

## 6. Marker-Ebene

Welche Marker ein Look nutzt (Hand, Lineal, Stempel, Pinsel, Mechanik), steht im Look-Blatt. Die Tabelle nennt oben die Haus-Marker (Atlas Nacht, Diagramm), darunter die Marker der übrigen Looks. Timing, Menge, Ruhe und Seek-Sicherheit (unten) gelten für alle.

| Marker | Strich | Dauer, Ease | Form | Abtritt |
|---|---|---|---|---|
| Kreis | 10 px plus zweite Spur (3,5 px, 45 %, versetzt um +1,5/−2 px) | 0,5 s, `power1.inOut` | 1,15 Umläufe, Radius wächst 12 %, gekippt; 24 px Luft um das Ziel | Deckkraft 0,2 s `power1.in`, wenn der Darsteller den Ort übernimmt |
| Unterstreichung | wie Kreis | 0,35 s, `power1.inOut` | Textbreite −6/+14 px, steigt 10 px an, Bogen 7 px; Abstand unter der Grundlinie 0,08–0,12 × Schriftgröße (v) | steht mit dem Text |
| Pfeil (v, noch nicht gebaut) | 8 px | Schaft 0,4 s, Spitze 0,12 s danach | Bogen 8–15 % der Länge, Spitze aus 2 Strichen à 28 px mit 35°; zeigt vom Wort auf den Helden | mit der Szene |
| Durchstrich | 10 px, nur in der Irrtum-Farbe des Looks | 0,3 s, `power2.out` | ein Strich, −4°, 12 px Überstand je Seite; trifft nur das falsche Wort („Nur“), nie ein Wort, das richtig bleibt („Gehalt“); Wortbreite gemessen | steht bis zur Widerlegung; die Korrektur kommt als Ergänzung dazu („+ Barças Geld“ wächst an), nicht als Austausch |
| Haken / Kreuz | 10 px; Haken in der Farbe des Gegebenen oder Gesuchten (Atlas: Creme oder Gold), Kreuz nur in der Irrtum-Farbe | 0,15–0,2 s auf dem bewertenden Wort (gemessen) | Pinselstrich, zwei Züge | mit der Szene |
| Klammer | 6 px | 0,4–0,7 s (gemessen) | geschweift oder eckig, fasst Teile zum Ganzen; Beschriftung am Scheitel | mit der Szene |
| Flusspfeil | 8 px | 0,4–0,6 s, kommt auf dem Wort an (gemessen) | folgt der Flussrichtung des Bedeuteten (Geld, Ware, Person) | mit der Szene |
| Textmarker | Fläche 35 % der gesuchten Farbe (Atlas: Gold) unter dem Wort | 0,4 s von links (gemessen) | 1,15 × Zeilenhöhe | steht mit dem Text |
| Abdunkeln | alles außer dem Gemeinten tritt zurück, aber nur so weit, dass Abgedunkeltes noch ≥ 3 : 1 gegen seinen Grund hält; Wert je Look gemessen, nicht geschätzt. 35 % reicht nicht: Creme auf Navy ergibt 2,97 : 1, in der Kurstafel fiel 35 % durch `check`, im Goldstandard meldet `check` am abgedunkelten Stempel „bezahlt“ `contrast_aa_failure`. Die Kurstafel nutzt 50 %. Fotos treten über eine dunkle, deckende Fassung zurück (§4), nie über Deckkraft | 0,3 s | kein Strich | bis zum nächsten Beat |
| Stempel | Rahmen 4 px, Navy `#1F3864` auf Papier | 0,28 s, `back.out(2.2)`, Maßstab 1,6 → 1, Drehung −6° → Endlage | Wort in Inter 600, ±8° gedreht | steht mit dem Papier |
| Maßlinie (Labor) | 6 px in der gesuchten Farbe (Orange), Endstriche 44 px | 0,35 s, `power1.inOut`, Endstriche je 0,06 s | linealgerade entlang der Größe, um die es geht; nichts Handgezeichnetes | mit der Szene |
| Hinweislinie (Labor) | 3 px Weiß, im Fokus 5 px Orange | 0,3 s, `power2.out` | gerade vom Band zum Gegenstand | mit der Szene |
| Klebeband-Ecken (Labor) | vier Klebeband-Ecken in Weiß `#EEF3EF` | wie Eintritt „Kleben“ (§5) | markieren einen leeren Platz auf der Fußlinie | mit der Szene |
| Stempel (Archiv-Duoton) | Violett `#5B2C94`, doppelter Rahmen mit Fehlstellen (Maske) | wie Stempel oben | trägt die gesuchte Zahl | steht mit der Karteikarte |
| Kopierstift-Randstrich (Archiv-Duoton) | zwei senkrechte Striche, 7 px, Violett | 0,3 s | am Rand neben dem, worauf es ankommt | steht mit der Karteikarte |
| Klappe kippt (Kurstafel) | ganze Klappe in der gesuchten Farbe (Cyan) oder Rot mit „−“ (Verlust, Irrtum) | wie Eintritt „Klappen“ (§5) | mechanisch, nichts Handgezeichnetes | steht mit der Zeile |

- **Häufigkeit (gemessen):** In 778 s Vorbild-Material kommt kein handgezeichneter Kreis vor; Kreise gibt es dort nur in Vorschaubildern. Häufig sind Haken/Kreuz, Klammern, Flusspfeile, Textmarker und Abdunkeln. Deshalb: höchstens 1 Kreis je Video, sonst die übrigen Marker.
- **Farbe:** die gesuchte Farbe des Looks für die gesuchte Größe, Irrtum nur in der Irrtum-Farbe des Looks, Gegebenes in der Textfarbe des Looks (Atlas Nacht: Gold, Rot, Creme). **Auf Papier** (Beleg, Rechnung, Vertrag, Creme-Fläche) zeichnet der Marker in Stempel-Navy `#1F3864`: Creme auf Creme ist unsichtbar (Goldstandard, Runde 1).
- **Timing:** Das Zeichnen beginnt am Anfang des Cue-Worts (±150 ms). Danach steht der Marker ≥ 1,2 s fertig (Bau prüft).
- **Ruhe im Umfeld:** Im Umkreis von 200 px ist der Marker das einzige helle Zeichen. Regionsrand ≤ 70 %, Schein ≤ 55 %; der Ortsname darf stehen.
- **Menge:** ≤ 1 Marker zeichnet gleichzeitig, ≤ 2 sind je Bild sichtbar. Markiert wird nur, was gerade gesprochen wird.
- **Anker:** Auf Karte und Diagramm hängen Marker weltverankert in `<g data-anker>`. Marker im HUD gibt es nur bei stehender Kamera.
- **Gebaut** (`lib/marker.js` im Goldstandard): Kreis, Unterstreichung, Durchstrich, Klammer. Abstand der Unterstreichung: 0,09 × Schriftgröße unter der GEMESSENEN Grundlinie (ein leerer Inline-Block im Text liefert sie), nicht unter der geschätzten Zeilenhöhe.
- **Seek-sicher** (`lib/marker.js`): fester `seed` statt `Math.random()`, nur `fromTo`, Deckkraft 0 bis zum Cue, Strichmuster L/L+20 mit Offset L+10 → 0.

## 7. Identitäten

Identitäten sind Szenen-Grammatiken: wie ein Diagramm sich aufbaut, wie eine Karte zoomt. Der Look (`studio/looks/`) gibt ihnen Material, Farbe und Takt; Farbangaben in diesem Abschnitt gelten für Atlas Nacht, andere Looks übersetzen sie (Look-Blatt).

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

- **Rasterpapier bis an die Bildränder:** Kleinkaro 24 px (1 px, Creme 9 %), Großkaro 144 px = 6 × 6 Kleinkaro (2 px, Creme 18 %), ausgerichtet an x = 108 und y = 168. (Bis 27.10.: 6 % / 12 %; im Handy-Blatt war das Raster dabei praktisch weg, Kritik am Goldstandard.)
- **Anker:** Jeder Punkt, jede Achse und jede Beschriftung sitzt auf einem Großkaro-Knoten oder an einer Achse; der Bau rundet auf 24 px.
- **Achsen:** 4 px, Creme 80 %, Pfeilspitze 20 px. Beschriftung in Stufe T, ≤ 2 Wörter, direkt an der Achse.
- **Kurven und Linien** 8 px, Punkte 24 px. Gold für die gesuchte Größe, Creme für das Gegebene. Ketten und Hilfslinien 4 px.
- **Gegenstände im Diagramm** (Kinokarte, Rechnung) dürfen gefüllt sein (Creme-Papier, Navy-Druck), ohne Schatten. Was die gesuchte Größe trägt (Lohntüte), bleibt Gold-Strich.
- **Herleitung:** ein Diagramm, eine Kamera, kein Schnitt. Neue Elemente kommen ins bestehende Diagramm, Details per Zoom-in.
- **Jede Kategorie eines Modells kommt mit ihrem Beispiel** (Beispiel vor Regel): die Rechnung auf „geschenkt“, das Gold-Fach auf „Genau dann“. Nach dem Schnitt steht nur das leere Modell. Die Formel („Kosten = bezahlt + aufgegeben“) erst, wenn sie gesprochen wird, und sie tritt vor der Nachfahrt ab.
- **Gegenstände auf einer Schale sind deckend** (Fach, Tüte, Papier), damit keine Kette hindurchscheint; ihre Fläche kommt mit dem Strich, nie vorher als dunkles Loch.
- **Verbote:**
  1. ein Diagramm in einer Karte oder Box mit runden Ecken (wie die „Tauschkurve“ der alten Probe);
  2. Legenden, 3D, Schlagschatten oder Verläufe im Diagramm;
  3. eine Achse ohne Bedeutung oder eine Zahl ohne Fakt in `facts[]`.

### Atlas (Geopolitik und Geschichte, Wirtschaftslage)

- **Karte:** Natural Earth in Lambert konform-konisch. 50m-Daten; 10m nur bei Zoom > 2,5, denn 10m kostet etwa +10 s Renderzeit je 15 s Video. Linien bleiben bildschirmkonstant (Küste 1,5 px, Grenze 1,1 px, Netz 1 px, jeweils geteilt durch den Zoom).
- **Eine Region leuchtet:** Fläche, 14-px-Schein und 2-px-Rand (§4). Füllt sie mehr als 50 % des Bildes, hat sie 50 % Deckkraft. Das ist der einzige erlaubte Schein im ganzen Haus.
- **Orte:** Punkt 24 px Creme mit 6-px-Navy-Ring, Name in Stufe O. Namen blenden aus, bevor sie den Rand bei 108 px erreichen. Ländernamen in Stufe L.
- **Darsteller:** ≥ 288 px, beleuchtet (Verlauf und Lichtkante), mit Schlagschatten am Boden. Nur die Karte zoomt, Darsteller und Namen bleiben bildschirmgroß.
- **Gegenstände** (Waage, Papier) sind beleuchtet wie die Darsteller: Navy-Fläche, Creme-Lichtkante oben und links, Navy-Schatten rechts und unten, Schlagschatten am Boden; Balken ≥ 18 px, Ketten 4 px Creme 80 %. Ein Drahtgestell aus 2-px-Linien wird am Handy zu 0,7 pt und steht neben plastischen Figuren wie aus einer anderen Welt (Goldstandard, Runde 2).
- **Route:** gepunktet, 5 px, Strich 2 px, Lücke 16 px, in Flussrichtung. Sie trägt die Farbe dessen, was auf ihr fließt: Gold für das Geld (die gesuchte Größe), Creme für einen Spieler (drehbuch.md des Goldstandards, Abweichung 2). Sichtbar ist sie nur, solange etwas auf ihr fließt oder die Kamera ihr folgt; sonst ist sie ganz weg, auch nicht abgedunkelt (sie stach durch die Credit-Zeilen, Runde 2).
- **Ortspunkt:** Steht ein Gegenstand auf dem Ort (die Waage in München), geht der Punkt; der Fuß markiert den Ort.
- **Fotos und Belege:** Archivfotos (Wikimedia Commons, Library of Congress, über `factory/werk/bilder.py`) im Duoton, dazu höchstens ein Echtfoto-Moment (§4). Credit nach §2: „Foto: Urheber, Jahr, Lizenz, bearb.“. Schlagzeilen-Belege mit Quelle und Datum.
- **Geist** (Goldstandard, Runde 1): gestrichelter Gold-Umriss eines Darstellers, sichtbarer Strich 5 px, Muster 16/11, Fläche Gold 14 %. Bedeutet **Möglichkeit oder Aufgegebenes** (Geld, das man nicht bekommt; der Spieler, den man abgibt), also Opportunitätskosten. Wird er echt, verwandelt er sich per Morph in den gefüllten Darsteller. Im Diagramm reimt er auf das gestrichelte Gold-Fach. **Seine Zahl im Geist-Stil:** 60 % Deckkraft mit gestrichelter Gold-Unterkante; fest wird sie, wenn der Geist Gewicht bekommt. Etikett zweizeilig unter der Schale: Betrag („45 Mio. €“), darunter sein Wort („entgangen“ → „beste Alternative“, Morph). So hängt das Fachwort am Gegenstand, nicht als Unterzeile unter einer Schlagzeile.
- **Gegenstände tragen Bedeutung, nicht Text:** Ein Vertrag ist ein Blatt mit Stempel, eine Rechnung ein Beleg, eine Laufzeit eine Zeitleiste. Darsteller dürfen auf Gegenständen der Welt stehen (Schalen als Plätze).
- **Schild an einem Modell-Gegenstand** (Waage): nennt, welche Entscheidung gewogen wird („Behalten“, „Verkaufen“, „Kino“), Inter 600 48 px auf Navy-Fläche. Es wechselt nur per Drehung (§5).
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
12. Kursive Akzentwörter, Creme- oder fast weißer Papiergrund mit Serifen-Display (erste Fassung von Labor), Monospace-Labels, Pillen-Chips.
13. Rahmen, Eckwinkel oder Boxen mit runden Ecken um Diagramme und Inhalte.
14. Musik, Soundeffekte unter Sprache, Whoosh auf Übergängen.
15. KI-Bilder echter Personen oder als Beleg; KI-Bilder ohne das Label „Illustration“.
16. Kreuzblende zwischen zwei Welten; ein harter Schnitt ohne neu genannten Gegenstand (Testschnitt des Spikes bei 7,5 s).
17. Symbolfiguren mit falscher Nebenbedeutung: ein Schach-Bauer für den besten Stürmer („Bauernopfer“). Eine Figur muss auf den ersten Blick sagen, wer oder was sie ist (Goldstandard, Kritik).
18. Ein Etikett wechselt die Seite eines Modells, ohne dass das Bild den Grund zeigt („Opportunitätskosten“ plötzlich über „Nutzen“). Wechselt die Sicht, dann per Drehung mit Schild (§5).
19. Eine Formel als Merksatz, die einer anderen Formel im selben Bild widerspricht („Aufgeben = Kosten“ unter „Kosten = bezahlt + aufgegeben“).
20. Ein Durchstrich über ein Wort, das richtig bleibt: „Nur sein Gehalt“ ganz durchgestrichen lehrt „Gehalt zählt nicht“ (Goldstandard, Runde 2).
21. Ein Etikett, das sich als Unterzeile eines anderen Textes liest („beste Alternative“ auf der Grundlinie unter dem D2-Begriff), statt am Gegenstand zu hängen.
22. Ein Bild, das dem gesprochenen Satz widerspricht: volle Gold-Zahl „45 Mio. €“ unter „Behalten“, während die Stimme „Behalten keinen Cent“ sagt.
23. Ein Darsteller, der das Bild gegen die Richtung der Karte verlässt (Spieler nach Nordwesten, während die Route nach Barcelona nach Südwesten zeigt).
24. Ein Look, der eine Umfärbung eines anderen ist: Petrol/Ocker gegen Navy/Gold, ΔE 10–14 (erste Fassung von Archiv, Kritik 28.10.).
25. Dunkler leerer Grund mit einem einzelnen Wert (Dashboard; erste Fassung der Kurstafel).
26. Ein Gegenstand, beschriftet als etwas, das er nicht ist (Museumsball als „Angebot aus Barcelona“).
27. Rotstift (oder Blaustift) auf Schwarz oder Raster: Der Kreis im Zeitungspapier lief über Balken und Foto und hatte dort 2,75 : 1 und 1,55 : 1. Stift-Marker nur auf Papier.
28. Eine Person im Rasterdruck, die im Hintergrund verschwindet (Spielfoto im roten Rang). Dann wird die Person ausgeschnitten.

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
| Abstand der Unterstreichung, Pfeil-Maße | Unterstreichung 0,09 × Schriftgröße unter der gemessenen Grundlinie (Goldstandard, Runde 1); Pfeil siehe §6 | Goldstandard |
| Passer-Versatz / Rasterpunkt-Zelle | 4 px / im Handy-Blatt sichtbar | Goldstandard (Handy-Blatt 360 px) |
| Untertitel- und App-Zone | y 1350–1490 / ab 1520 | Gerätetest |
| Text-Standard | 52 px (Grenze 48–56); Vorbild-Labels entsprechen im Median 51 px (gemessen, docs/research/referenz-destillation.md) | Goldstandard |
| Signal im Zeitungspapier | Blaustift `#1F4FB5`, Rot bleibt Irrtum; Rotstift `#B8161D` als Signal erst mit Linus' Ja (§1) | Linus |
| Abdunkeln je Look | Kurstafel 50 %; übrige Looks am Kontrast messen (§6, ≥ 3 : 1) | `check`, Look-Proben |
