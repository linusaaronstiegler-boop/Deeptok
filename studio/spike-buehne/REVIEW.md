# Bühnen-Spike: Welt mit Kamera (27.10.2026, nach Prüfung überarbeitet)

**Frage:** Wie lebt ein Darsteller in einer durchgehenden Welt mit Kamera über Szenengrenzen hinweg, wenn Szenen-Timelines nichts außerhalb ihrer Datei erreichen?
Dazu wurde derselbe Beat dreimal gebaut: „Bayern verkauft Lewandowski nach Barcelona“, 15,0 s, 1080 × 1920, 30 fps, ohne Ton.

- **A „Bühne“** (`a-buehne/`): Welt, Kamera, Darsteller und weltverankerte Marker liegen in *einer* Sub-Komposition `buehne` über die volle Länge. Die Szenen sind nur Labels auf ihrer Zeitachse. Fester Text liegt in *einer* Sub-Komposition `hud` darüber.
- **B „Wurzel“** (`b-wurzel/`): Welt, Kamera und Darsteller liegen in `index.html` auf der Wurzel-Zeitachse `main`. Die Szenen `start`, `flug` und `ziel` sind getrennte Sub-Kompositionen darüber, mit festem Text und Markern in Bildschirm-Pixeln.
- **A+ „Empfehlung“** (`c-aplus/`, neu): die Bühne aus A (Datei kopiert der Bau), darüber HUD je Szene wie in B (`start`, `flug`, `ziel`, nur Text).

Alle Varianten nutzen dieselbe Welt, dieselben Zeiten, dasselbe Drehbuch und dieselben Bibliotheken. Die setzt `build/bauen.mjs` zwischen Marken wie `<!-- @welt:anfang -->` ein. Der Vergleich misst also nur die Bauweise.

## Was sich nach der Prüfung geändert hat

- **Flussrichtung korrigiert.** Vorher fiel das Geld auf München und flog nach Barcelona, als zahle Bayern. Jetzt fällt es auf Barcelona (Käufer), fliegt nach München (Verkäufer) und wird dort zu „45 Mio. €“ unter „Ablöse an Bayern“. Regel für den Kamera-Vertrag: **Ein Darsteller fährt in die Richtung dessen, was er bedeutet.**
- **Zeiten aus einer Quelle.** `WORTE` (Wort-Cues, später aus `timing.json`) und abgeleitete Zeiten (`ableiten()`) stehen getrennt. Der Bau schreibt `data-start`/`data-duration` aller Clips (`data-cue="…"`), Szenen-Hosts und der Wurzel. Im HTML steht keine Zeit mehr von Hand. Der Kreis zeichnet sich jetzt genau auf dem Wort „Barcelona“.
- **Haltezeiten geprüft.** Der Bau bricht ab, wenn das Geld nach dem Aufsetzen < 1,2 s ruht (Barcelona und München), der Kreis < 1,2 s fertig steht oder die letzte Zeile < 2 s hält.
- **Bau robust:**
  - Jede Zieldatei hat eine feste Liste von Blöcken; eine fehlende oder verschriebene Marke bricht ab.
  - Downloads werden per SHA-256 geprüft und erst als `.tmp` geschrieben, dann umbenannt.
  - Spuren werden geprüft: leer, rückwärts laufend oder ohne Zahl ergibt einen Fehler mit Spur-Name und Zeitpunkt.
- **Schriften liegen im Repo** (`*/assets/fonts/`, 3 × woff2 + OFL-Lizenz, je Variante 79 KB). Ein frischer Klon besteht `check` ohne Bau.
- **Look:**
  - 10m-Küsten;
  - Hervorhebung als blauer Schein statt grauer Fläche mit weißem Rand;
  - Darsteller 288 px (15 %) mit Licht und Schlagschatten;
  - Ländernamen in gesperrten Versalien;
  - Namen blenden vor dem Aktionsrand aus (kein „Münc“ mehr);
  - Kreis 10 px, einziges helles Zeichen in seinem Umfeld;
  - Flug von 3,05 auf 1,7 s gekürzt;
  - kein Korn.
- **Seek-Test als echtes Tor.** Ganze Bilder statt Sekunden, Abgleich DOM gegen `berechne(t)`, PSNR-Schwelle 28 dB im Exit-Code. Gegenprobe mit eingefrorener Kamera: fällt durch.
- **A+ gebaut** und wie A und B geprüft. **GSAP-Gegenprobe** gemessen (siehe unten).

## Ergebnis A, B, A+

| | A Bühne | B Wurzel | A+ Empfehlung |
|---|---|---|---|
| `check` (0.8.206) | **0 Fehler.** Warnungen: Datei zu groß (814 Zeilen, eingesetzte Karte), Spur zu dicht (Beat-Marken, HUD) | **0 Fehler.** Warnung: Datei zu groß (806 Zeilen) | **0 Fehler.** Warnungen: Datei zu groß (Bühne), Spur 3 zu dicht (Beat-Marken) |
| `snapshot --review` | Keine Szenen: Beats gleichmäßig verteilt, **kein Naht-Blatt** am Schnitt. Behelf: unsichtbare `data-beat`-Marken | Naht-Blätter bei 7,5 und 8,75 s automatisch | Naht-Blätter bei 7,5 und 8,75 s automatisch, weil dort HUD-Szenen wechseln |
| Renderzeit, 450 Bilder (`looks`, 3 Worker, 4 Kerne, Last ≈ 8 durch parallele Agenten, ±20 %) | 37,7 s (Wiederholungen 39,5 / 40,4 s) | 37,0 s | 39,9 s |
| Datei | 3,4 MB | 3,4 MB | 3,4 MB |
| Bild für Bild | A gegen B: 344 von 450 bitgleich, Rest ≥ 58,3 dB | ← | A+ gegen A: **byte-gleiche MP4** |
| Seek im Player (6 Bilder: 96, 140, 224, 225, 240, 345) | **bestanden**: Bild, Soll, Pfad, PSNR 32,3–36,3 dB | **bestanden**, dieselben Werte | **bestanden**, dieselben Werte |
| Darsteller überlebt harten Schnitt (7,5 s) | ja, gleiches DOM-Element, gleicher Weltort | ja | ja (`belege/schnitt-darsteller.jpg`) |
| Weltverankerte Marker | ja (`data-anker`) | nein: Kreis in Bildschirm-Pixeln (`DATEN.bild` vorausgerechnet), gilt nur bei stehender Kamera und endet mit der Szene | ja |
| Studio / `timeline` | Welt = ein Block, Szenen nicht einzeln | Szenen als Clips, **Welt fehlt in der Zeitleiste** | Bühne = ein Block plus Szenen-Clips |
| Handgeschriebene Zeilen (ohne eingesetzte Blöcke) | 139 in 3 Dateien | 166 in 4 Dateien | 130 in 4 Dateien (+ Bühne aus A) |
| Neue Szene (Beispiel 4. Szene „Vertrag“) | 1 Wort-Cue in `WORTE`, 1 Kamera-Schlüsselbild im Drehbuch, Clip mit `data-cue` in `hud.html` | wie A+, dazu Marker-Pixel vorausrechnen (`DATEN.bild`) | 1 Wort-Cue, 1 Eintrag in `SZENEN`, neue HUD-Datei mit `data-cue`-Clips, 1 Eintrag in `ZIELE`, Host in `index.html`; Weltmarker in der Bühne |
| Risiken | `buehne.html` und `hud.html` wachsen mit jedem Beat; Review braucht Beat-Marken | Wurzel trägt Inhalt (gegen „Wurzel hält nur Hosts“); Marker rutschen still, wenn sich die Kamera ändert | Wer in Studio eine HUD-Szene verschiebt, trennt HUD und Kamera, **genau wie in B**. Naht-Blätter gibt es nur an HUD-Grenzen, nicht an Schnitten innerhalb der Bühne |

**Alle drei Bauweisen funktionieren technisch** in `check`, Snapshot, Render und Player. Die Unterschiede liegen beim Bauen, Prüfen und Ändern. Im Video sind sie gleich: Der Kreis blendet vor dem Flug aus, darum fällt Bs Schwäche (Marker in Bildschirm-Pixeln) hier nicht auf. Hätte er den Schnitt überdauern sollen, hätte B ihn nicht halten können.

## Empfehlung für die Szenen-Bibliothek: A+

1. **Eine Bühnen-Sub-Komposition pro Video** über die volle Länge: Welt, Kamera, Darsteller und alles, was an einem Weltort klebt (Punkte, Namen, Kreise über `data-anker`). Die Wurzel hält nur Hosts.
2. **HUD je Szene als eigene Sub-Komposition** darüber, nur Text, der fest auf dem Bildschirm steht. So liefert `snapshot --review` Naht-Blätter an den Szenengrenzen, und Studio zeigt Szenen-Clips. Ein Schnitt *innerhalb* der Bühne bekommt nur dann ein Naht-Blatt, wenn dort auch eine HUD-Szene wechselt; sonst braucht er eine `data-beat`-Marke.
3. **Zeiten nur aus Cues.** Kein `data-start` von Hand: Der Bau schreibt sie aus `data-cue`. Sonst passen HUD und Bühne nach der ersten Änderung an den Wortzeiten still nicht mehr zusammen. Gegenprobe: `juni` 12,1 → 12,5 s verschiebt `h-vertrag` (A), `s3-vertrag` (B, szenen-relativ) und die Länge der Wurzel (15,4 s) in einem Lauf.
4. **Übersetzungsschicht zwischen Spec und Spuren.** Nach §5 schreibt das Modell nie Pixel oder Sekunden. Die Spec nennt deshalb nur benannte Einstellungen und Cue-Namen:
   - `camera.path = ["totale:europa", "nah:barcelona", "schnitt:flug", "nah:muenchen"]`;
   - `moves = [{actor: "geld", slot: "ort:barcelona", at: "zahlt"}, {actor: "geld", slot: "ort:muenchen", at: "muenchen"}, {actor: "geld", slot: "hud:zahl", at: "zahl"}]`.

   Code übersetzt:
   - Einstellungen über `einstellung(ort, bildX, bildY, zoom)`, die Tabelle steht im Kamera-Vertrag;
   - Physik über Modul-Konstanten (`DARSTELLER`: Fallhöhe, Flughöhe, Steig-, Sink-, Flug- und Dockzeit);
   - Zeiten über `ableiten(WORTE)`.

   Das Ergebnis sind die Schlüsselbild-Spuren in `build/drehbuch-welt.js`. Die Spec füllt die Spuren also **nicht** direkt.
5. **Modul-Signatur.** Eine Szene erreicht die Bühne nicht. Ein Szenen-Modul `(params, cues, stage)` liefert darum zwei Teile, die der Bau an zwei Stellen einsetzt:
   - `{ hud: { html, tweens }, buehne: { spuren: [...Abschnitte], marker: [...weltverankert] } }`;
   - der Bau fügt die Bühnen-Teile aller Szenen zu einem Plan zusammen und prüft ihn (`pruefeSpur`, Haltezeiten).
6. **Wer besitzt was:** `render()` besitzt die Hüllen (Kamera-Gruppe, Anker, `.w-rand`, Darsteller-Hülle, Schatten, Regionen). GSAP besitzt nur deren Kinder (Deckkraft, Unschärfe, Stauchen) und den HUD-Text. Zwei Besitzer auf einer Eigenschaft gibt es nicht.
7. **Kamera und Darsteller als Daten-Spuren**, ausgewertet von `render(t)` im `onUpdate`. Begründung nach der Gegenprobe unten: nicht wegen der Seek-Sicherheit, sondern weil `berechne(t)` ohne Zeitachse ein Test-Orakel ist und der Bau Haltezeiten aus den Daten prüfen kann.

**Für den Kamera-Vertrag:**
- Fahrtrichtung = Flussrichtung des Bedeuteten.
- Halten gilt auch für den Darsteller: Er ruht nach jedem Aufsetzen ≥ 1,2 s.
- Ein Marker-Kreis ist das einzige helle Zeichen in seinem Umfeld (Regionsrand leise).
- Er macht Platz, wenn der Darsteller den Ort übernimmt.
- Weltgrößen (Linien, Punkte, Namen, Darsteller) bleiben bildschirmgroß, nur die Karte zoomt.
- Länder-Namen verschwinden ab Zoom 2,4.

## Gegenproben (gemessen)

- **GSAP statt eigener Spuren-Auswertung** (Kopie von A, Scratch):
  - Dieselben Spuren als `tl.fromTo(zustand, …)` auf ein Zustandsobjekt, der harte Schnitt als `tl.set(zustand, …)`; `render()` liest nur noch das Objekt.
  - Seek-Test: 6/6 bestanden, auch rückwärts über den `set`-Schnitt.
  - Render gegen A: 75 von 450 Bildern bitgleich, Rest ≥ 52,9 dB (Rundung).
  - **Folgerung:** Die Befürchtung aus der ersten Fassung („GSAP-Tweens mit hartem Schnitt springen rückwärts falsch“) trifft hier nicht zu. Der eigene Interpreter (≈ 40 Zeilen) bleibt nur wegen Test-Orakel und Bau-Prüfung.
  - `hyperframes keyframes` sieht keinen der beiden Wege: Bewegung aus `render()` erscheint gar nicht, Tweens mit berechneter Startzeit (`Z.zahl + 0.06`) bleiben „unresolved“.
- **Eingefrorene Kamera** (Kopie von A ohne `onUpdate`): Seek-Test **durchgefallen**, Exit 1. Soll NEIN an 6/6 Bildern, PSNR 20,9–24,2 dB.
- **Frischer Klon ohne Bau** (nur Dateien, die Git sieht): `check` in A und B mit 0 Fehlern.
- **Bau-Fehlerpfade:**
  - `@daten:ende` in `ziel.html` verschrieben: Abbruch mit Datei und Marke.
  - Schrift im Cache auf 4000 Byte abgeschnitten: „Prüfsumme falsch … lade neu“, danach 22372 Byte in Cache und Variante.
  - `muenchen` 7,05 → 6,5 s: „Geld ruht in Barcelona (Halten): 0.68 s < 1.2 s“, Abbruch.
- **Spuren-Prüfung:**
  - `hoehe` mit t = 4 / 4,42 / 4,3: „Spur 'hoehe' läuft rückwärts: t=4.3 nach t=4.42“;
  - leere Spur: „Spur 'u' ist leer“;
  - Kamera ohne `zoom`: Fehler mit Zeitpunkt.

## Marker-Ebene: was ich als Modul übernehmen würde

`lib/marker.js` (Kreis, Unterstreichung, `zeichne`). Übernehmen:
- **Seek-Sicherheit in drei Regeln:**
  - fester Pseudo-Zufall (Hash mit `seed`) statt `Math.random()`;
  - `fromTo` mit beiden Endpunkten. Ein `from` liest seinen Endwert beim Erstellen aus dem DOM. Das ist allein harmlos, aber falsch, sobald mehrere Tweens dieselbe Eigenschaft bewegen; ab dem zweiten zusätzlich `immediateRender: false`;
  - `opacity 0` bis zum Cue, damit die runde Linienkappe vorher keinen Punkt malt. Strich-Muster `L` / `L+20`, Offset `L+10 → 0`.
- **Handform:** Kreis mit 1,15 Umläufen, leicht wachsendem Radius und Kippung. Unterstreichung leicht ansteigend mit kleinem Bogen. Dazu eine dünne zweite Spur (35 % Breite, 45 % Deckkraft).
- **Anker:** Der Kreis hängt in einer `<g data-anker="ort">`, die `render()` jedes Bild an den Weltort schiebt. Die Kamera darf sich auch während des Zeichnens bewegen.
- **Abtritt:** `marker()` gibt die Gruppe zurück; ein `fromTo` auf ihre Deckkraft blendet den Kreis aus, wenn der Darsteller übernimmt.
- **Farbregel:** Ort/Gegebenes Creme, gesuchte Größe Gold, Rot nur für Irrtum/Verlust.

Ändern, bevor es ein Bibliotheks-Modul wird:
- **Textbreite messen statt Konstante.** `DATEN.zahlBreite = 726` ist noch von Hand gemessen. Der Bau sollte sie messen (Playwright mit geladener Schrift).
- Pfeil (Registry `hw-arrow`) fehlt; Stift-Tempo nach Krümmung (`hwPenEase`) und „Boil“-Zittern wären nächste Schritte.
- Registry-Bausteine selbst nicht übernommen:
  - `marker-highlight` arbeitet mit Laufzeit-Variablen, die nach §5 bei doppelt eingebundenen Szenen versagen;
  - `world-map` lädt die Karte zur Laufzeit per `fetch` und ist 16:9.

## Befunde über die Frage hinaus

1. **Der Live-Player lädt keine Schriften.** `hyperframes play` liefert die Komposition ohne `@font-face` aus (`document.fonts` leer); nur der Render-Compiler bettet Inter und Playfair ein. Im Test stand „45 Mio. €“ schmaler da (23,8 dB statt ≥ 31 dB). Lösung: eigene woff2 mit eigenen Familiennamen („DT …“) in jeder Datei, **im Repo**.
2. **GSAP kommt zur Laufzeit von jsDelivr** (`<script src>` in jeder `index.html`, wie bei der Probe). §7 verlangt GSAP lokal und einen CI-Test, der offline lädt. Offen: GSAP beim Bau nach `assets/` kopieren, gepinnt und mit Prüfsumme wie die Schriften.
3. **Die Karte ist der Engpass der Renderzeit** (450 Bilder, verrauscht durch parallele Last, je 2–3 Läufe):

   | Variante | Renderzeit | Datei |
   |---|---|---|
   | ohne Karte | 12,7–15,9 s | 1,0 MB |
   | 50m-Karte | 24,4–32,0 s | 3,0 MB |
   | 10m-Karte (jetzt) | 37,7–40,4 s | 3,4 MB |

   Der Papier-Schattenfilter zeigt keinen messbaren Effekt (10m ohne Filter: 33,7–43,0 s). 10m kostet gegenüber 50m etwa +10 s je 15 s Video, glättet aber die Küsten bei Zoom 3 (vorher sichtbare Polygonzüge an Kataloniens Küste). Die Aussage der ersten Fassung „die Karte ist kein Engpass“ war ungemessen und falsch. Für die Fabrik: 10m nur für Ausschnitte mit Zoom > 2,5, sonst 50m.
4. **Korn entfernt.**
   - Festes Korn mit 6 % verdoppelte die MP4 gegenüber keinem Korn (3,2 → 6,4 MB) und kostete etwa ein Drittel mehr Renderzeit, war im Handy-Blatt aber nicht zu sehen.
   - Bewegtes Korn gleicher Stärke (4×/s) kostete noch einmal das 2,8-Fache (18,2 MB).
   - Der Wert „57 MB“ der ersten Fassung vermischte Stärke (12 %) und Bewegung (12×/s) und taugt nicht als Vergleich.
5. **Messen im `onUpdate` meldet `check`** als `gsap_callback_dom_measurement`. Die Breiten der Namen (für die Randblende) misst die Bühne darum einmal in `erstelle()`, nachdem `document.fonts.load()` die Schriften geladen hat; die Zeitachse wird erst danach registriert (`DeepTokBuehne.nachSchriften`).
6. **`data-layout-ignore` auf der Welt** blendet sie auch aus der Bewegungsprüfung aus (falsches `dead_stretch`). Nur Deko-Ebenen ignorieren.
7. **Eine Vignette über Text gilt als Verdeckung** (`text_occluded`); sie liegt unter Namen und Darsteller.
8. **Display 9 % passt nicht zu jedem Titel.** Die Schlagzeile hat 124 px (6,5 %), nicht 173 px (9 %): „Lewandowski“ in Playfair 900 ist bei 173 px 1072 px breit (gemessen im Player), bei 124 px 768 px; die Titel-Sicherheitsbreite ist 864 px. Die Kit-Konstante gilt also für Zahlen und Schlagzeilen bis zwei kurze Wörter; Namen und längere Schlagzeilen brauchen eine zweite Stufe (≈ 6,5 %). Die Zahl „45 Mio. €“ hat 173 px.
9. **Der harte Schnitt bei 7,5 s ist ein Testschnitt.** Der Auftrag verlangte, dass der Darsteller einen Schnitt überlebt. Er fällt mitten in den Flug und springt von Zoom 3,2 auf 1,85. Das Kit sagt „Schnitt = neues Thema“; hier wird kein neuer Gegenstand genannt. **Kein Vorbild für den Kamera-Vertrag:** Im Goldstandard bleibt die Fahrt eine Fahrt, oder der Schnitt liegt dort, wo ein neuer Gegenstand genannt wird.
10. **Ländernamen-Kontrast:** Bei 36 % Deckkraft meldete `check` 2,8–2,9:1. Mit 46 % ist die Warnung weg (≥ 3:1).

## Kreative Entscheidungen

- **Darsteller Geld:**
  - Fünf beleuchtete Goldmünzen (Verlauf auf Oberseite und Rand, Lichtkante, Schlagschatten), 288 px hoch.
  - Er fällt auf das Wort „zahlt“ auf Barcelona, ruht 1,23 s, hebt auf „München“ ab, fliegt 1,7 s mit Schatten am Boden, ruht 1,2 s in München und dockt dann an den Platz der Zahl an.
  - Dort **verwandelt er sich in „45 Mio. €“**: dieselbe Größe in neuer Form (Morph).
- **Kamera:**
  - steht 0–2,5 s (Schlagzeile), fährt 2,5–3,9 s auf Barcelona, steht 3,9–7,5 s;
  - harter Testschnitt auf eine weite Einstellung, folgt dem Geld 7,5–8,85 s;
  - steht ab 8,85 s.
- **Region:** Es leuchtet immer nur eine: Deutschland (Verkäufer), dann Spanien (Käufer), am Ende Deutschland angedeutet (50 %), damit die Fläche nicht das halbe Bild füllt.
- **Typo:**
  - Playfair 900 für Schlagzeile (124 px) und Zahl (173 px), Inter 600 ab 48 px, Quellen und Ländernamen 34 px.
  - Alles links bündig auf x = 108; Quellen rechts unten über dem Meer.
  - Inhalt zwischen y = 214 und 1304.
- **Rot nur einmal:** „Juni 2023“ (Vertrag läuft aus = Verlust für Bayern).

## Schwächste Stelle: was zum Simplicissimus-Look noch fehlt

- **Kein Relief.** Bei Simplicissimus hat die Karte Struktur (Gebirge, Papier). Hier ist das Land eine flache dunkle Fläche mit Papierschatten. Nächster Schritt: Natural Earth Shaded Relief (gemeinfrei) als entsättigtes Duoton-Raster unter den Vektoren. Nicht umgesetzt: Die Raster liegen als ZIP bei Natural Earth, nicht auf jsDelivr, und müssen erst in die Lambert-Projektion gebracht werden. Das ist ein eigener Bau-Schritt.
- **Darsteller als SVG.** Beleuchtet, aber noch kein fotografischer Gegenstand wie bei Veritasium.
- **Kein Vergleich mit Vorbild-Bildern.** `snapshot --against` braucht 2–3 Referenzsequenzen, die es noch nicht gibt.

## Gemessen, nur angesehen, ungeprüft

- **Gemessen:**
  - `check` (0 Fehler, alle drei, auch im frischen Klon);
  - Renderzeit und Dateigröße (verrauscht durch parallele Last);
  - Bildvergleich A/B/A+;
  - Seek-Test mit Soll-Abgleich und PSNR;
  - Gegenproben (GSAP, eingefroren, Klon, Bau-Fehler, Spuren-Prüfung);
  - Kosten von Karte und Korn.
- **Angesehen:** Beat-Blätter, Naht-Blätter (B, A+), Handy-Blätter (360 px), Player-gegen-Render-Bilder. Zwei Verbesserungsrunden in dieser Überarbeitung:
  - „FRANKREICH“ fehlte, weil die 600-px-Box des Namens am Rand ausgeblendet wurde; jetzt zentriert eine 0-px-Flex-Hülle;
  - „ITALIEN“ stieß an die Kartenquelle und entfiel;
  - Deutschland am Ende auf 50 % zurückgenommen;
  - „München“ 16 px tiefer, damit der ruhende Stapel den Namen nicht verdeckt.
- **Ungeprüft:**
  - echtes iPhone/Safari (WebKit);
  - Player-Abspielen über die volle Länge (nur 1,2 s);
  - Bearbeiten in der HyperFrames-Desktop-App;
  - Laufzeit-Motion-Blur mit `render(t)` (bräuchte vermutlich `data-motion-blur-events="on"`);
  - G7-Bewegungsmessung;
  - kein Ton, wie gewollt.

## Bilder

Im Repo:
- `belege/schnitt-darsteller.jpg`: Naht 7,3–7,7 s (A+), der Stapel überlebt den Schnitt am selben Weltort;
- `belege/player-gegen-render.jpg`: Player | Render bei Bild 225 (erstes Bild nach dem Schnitt) und Bild 345 (Zahl mit Unterstreichung).

Nicht im Repo (gitignored, mit den Befehlen unten neu erzeugbar; die Ordner-IDs ändern sich je Lauf):
- `c-aplus/.hyperframes/artifacts/snapshots/cfd634a3-1015-46d3-ab29-33c4c9a206ad/review-beats.jpg`: alle Beats im Endstand;
- `c-aplus/.hyperframes/artifacts/snapshots/cfd634a3-1015-46d3-ab29-33c4c9a206ad/review-phone.jpg`: Handy-Breite;
- `b-wurzel/.hyperframes/artifacts/snapshots/4782510d-8ab6-4183-a2d8-59b8ac5338cd/review-seam-01.jpg`: Naht am harten Schnitt;
- `build/seek-test/c/vergleich-345.png`: Player gegen Render mit Zahl und Unterstreichung.

## Fakten

- **Ablöse:** 45 Mio. € fest plus 5 Mio. € variabel. Quelle: FC Barcelona, Pressemitteilung vom 19.07.2022 (fcbarcelona.com, Meldung 2683853, „Agreement with Bayern Munich for the transfer of Robert Lewandowski“). Im Bild steht nur der feste Betrag.
- **Vertrag beim FC Bayern bis Juni 2023.** Quelle: Oliver Kahn (Vorstandschef FC Bayern) bei Prime Video, zitiert in t-online, Stand 13.05.2022: „Er hat einen Vertrag bis Juni 2023 und wir werden ihn auf jeden Fall für eine weitere Saison bei uns haben.“ Eine Pressemitteilung des FC Bayern selbst war nicht abrufbar (fcbayern.com antwortet mit 403). Im Bild: „Vertrag: O. Kahn in t-online, 13.05.2022“.
- **Karte:** Natural Earth 1:10m über world-atlas 2.0.2 (gemeinfrei).

## Wiederholen

```bash
cd studio/spike-buehne/build && npm install && node bauen.mjs     # Karte + Schriften prüfen/laden, Blöcke und Zeiten einsetzen
cd ../a-buehne && npx hyperframes@0.8.206 check && npx hyperframes@0.8.206 snapshot --review
npx hyperframes@0.8.206 render --quality looks --workers 3 -o renders/a-buehne.mp4
# Seek-Test: Player im Hintergrund, dann (aus studio/spike-buehne/)
npx hyperframes@0.8.206 play a-buehne --port 3103 --no-open
node build/seek-test.mjs 3103 a-buehne/renders/a-buehne.mp4 build/seek-test/a   # Exit 0 = bestanden
```
B genauso mit `b-wurzel` und Port 3104, A+ mit `c-aplus` und Port 3107. Für `check`, Snapshot und Render reicht ein frischer Klon. Der Bau ist nur nötig, wenn sich Zeiten, Karte oder Bibliotheken ändern; er braucht Netz für den ersten Download und prüft jede Datei per SHA-256.
