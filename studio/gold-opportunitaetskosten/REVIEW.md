# Review: Goldstandard „Was kostet es, Lewandowski zu behalten?“ (Runde 2, 27./28.10.2026 nachts)

Phase 1 nach `docs/VIDEO-PIPELINE.md` §9. Gebaut nach `drehbuch.md`, `fakten.json`, `build/script.py` und `../DESIGN.md`, Bauweise A+ aus dem Bühnen-Spike. Diese Fassung arbeitet die drei Prüfungen der Runde 2 ein (Bild, Didaktik, Technik). Ein Teil davon lag schon im Commit 739829c der Parent-Sitzung (Zwischenstand vor dem Container-Neustart); der Rest liegt uncommittet darüber. Nichts committet, nichts gepusht.

**Die Stimme ist weiter ein Platzhalter** (Piper „thorsten-high“, nur für das Timing). Der Tausch ist eine Zeile: `python build/voice.py --anbieter <sieger>`, danach `node build/bauen.mjs`. Alle Bildzeiten folgen den Wortzeiten; die Tore im Bau melden, wenn eine Zeit dabei nicht mehr passt.

## Abnahme (28.10.2026, nach Runde 2)

Eine unabhängige Prüfung des fertigen Renders `renders/gold.mp4`: 70,70 s, 1080 × 1920, 30 fps, H.264, AAC 48 kHz. Die Werte in der Tabelle unten habe ich selbst gemessen. Die übrigen Messwerte weiter unten stammen aus dem Bau und sind nicht wiederholt.

**Urteil:**
- **Bild und Didaktik sind klar besser als die alte Probe.**
- **Der Ton ist es nicht.** Es spricht dieselbe Piper-Stimme, die Linus „richtig kacke“ fand, und das Video ist 18 s länger (70,7 statt 52,6 s).
- **Für die Freigabe reicht der Stand nicht.** „Klar besser“ als Gesamturteil ist erst mit der Casting-Stimme realistisch.

### Belege

| Datei | Inhalt | Größe |
|---|---|---|
| `belege/kontaktbogen.jpg` | 14 Bilder, eins je Beat (Drehbuch-Nummern 1–12; Beat 8 hat zwei Szenen), beschriftet mit Zeit, Beat und Szene | 290 KB |
| `belege/alt-neu.jpg` | oben alt, unten neu, je drei Beats: Frage vor der Auflösung (13,5 s / 7,4 s), Irrtum widerlegt (43,5 s / 36,3 s), Schluss-Satz (51,5 s / 68,6 s) | 197 KB |
| `belege/poster.jpg` | 7,4 s, Mitte der Denkpause: die Frage „Was kostet Behalten?“, die Figur und drei Antwort-Schilder. Die Auflösung ist nicht zu sehen. | 140 KB, 1080 × 1920 |

- Alle drei baut `python build/kontaktbogen.py` neu.
- Jeder Zeitpunkt ist dort als „Cue + Versatz“ aus `assets/timing.json` festgelegt. Nach dem Stimmtausch passen die Bilder also ohne Handarbeit.
- **`alt-neu.jpg` dem Bruder erst nach seinem Blind-Urteil zeigen** (VIDEO-PIPELINE §6: „blind urteilt nur der Bruder“). Das Blatt sagt, welche Fassung neu ist.

### Selbst gemessen

| Prüfung | Ergebnis |
|---|---|
| `npx hyperframes check` | **0 Fehler**, 6 Warnungen, 16 Hinweise. Die Warnungen verteilen sich so: Lint 3, Layout 1, Kontrast 1, Craft 1. Sie sind dieselben wie unter „Warnungen, die bleiben“. |
| `fabrik.py lint` (G1) | **0 Treffer** in `drehbuch.md` und `REVIEW.md`. Ebenfalls 0 im Sprechtext, in `build/script.py` und in `fakten.json`. |
| Hör-Check auf dem MP4 (G4, wiederholt) | **`ok: true`**. WER 1,31 %, −16,1 LUFS, −4,3 dBTP, 2,31 Wörter/s, 2 deklarierte Stillen (2,48 s und 2,05 s). Einzige Abweichung: 2× „Oportunitätskosten“. |
| Externe URLs zur Laufzeit | **keine.** `index.html` und die 14 Kompositionen laden nur aus `assets/` (GSAP, Schriften, Stimme). „http“ kommt nur im SVG-Namensraum und im Lizenzkommentar von `gsap.min.js` vor. |
| `git status` im Ordner | **Keine Renders im Repo.** Gitignored sind `renders/`, `.hyperframes/`, `assets/voice.wav`, `build/cache/`, `build/node_modules/` und `build/__pycache__/`. |
| Dateien über 1 MB | **nur `assets/voice.m4a`** mit 1,16 MB (Stereo, 130 kbit/s). Sie ist seit 739829c im Repo und unverändert. Begründet: Sie ist die Tonspur des Videos. Alle anderen Dateien sind kleiner als 250 KB. |
| Gelöschte Dateien | 3 Belege aus Runde 1 (`drehung-verkaufen.jpg`, `frage-geist.jpg`, `rechnung-schluss.jpg`). Außerhalb des gitignorten `.hyperframes/` verweist nichts mehr auf sie. |
| Fakten | 17 Einträge in `fakten.json`, jeder mit Quelle, Datum und Zitat. Jede Faktenszene hat eine Credit-Zeile mit Quelle und Datum (Sichtprüfung auf dem Kontaktbogen). |
| Cue-Stichprobe im MP4 (Bilddifferenz) | Der Stempel „0 €“ setzt bei 32,60 s ein, „Cent“ beginnt bei 32,63 s. Die Lohntüte setzt bei 60,77 s ein, „Lohn“ beginnt bei 60,80 s. Beide kommen 1 Bild vor dem Wort. |
| Frage in den ersten 8 s | Gesprochen 4,69–6,20 s. Die Schilder stehen ab 5,8 s, darunter der Irrtum „Nur sein Gehalt“. |

### Befund: Die Waage dreht sich nicht in der Pause

Weiter unten steht, die Waage drehe sich „in der Atempause nach ‚Geld.‘“. Das stimmt nicht.

**Gemessen:** an der Bilddifferenz und in `build/bauen.mjs` (`drehStart = dreh − 0,3 s`).
- Die Pause von 45,26 bis 45,96 s ist ein stehendes Bild.
- Die Drehung läuft von 45,93 bis 46,47 s, also auf „Auch Verkau-“. Ihre Mitte liegt bei 46,2 s auf „Verkaufen“.
- Direkt danach kommen der Morph Geist → echt (etwa 46,3–46,5 s) und das Etikett „Opportunitätskosten“ (46,98 s).

Das sind drei Bedeutungsänderungen in gut einer Sekunde. Die neue Regel in `DESIGN.md` erlaubt höchstens eine je Sekunde; die Stelle liegt an dieser Grenze. Die Regel fordert außerdem zweierlei: die Drehung in einer Atempause und ihre Mitte auf dem Wort der neuen Sicht. Hier geht beides nicht zugleich, weil „Auch“ zwischen Pause und „Verkaufen“ steht.

**Vorschlag** (nicht umgesetzt, er braucht einen neuen Render). Es gibt zwei Wege:
- Die Drehung an den Anfang der Pause legen, so dass sie auf „Auch“ fertig ist, und den Morph auf „Verkaufen“ setzen.
- Oder die Beschreibung unten korrigieren und die Dichte am Handy prüfen (Punkt 1 der Liste unten).

### Klar besser? Die ehrliche Einschätzung

**Besser als die alte Probe:**
- **Bild statt Texttafel.**
  - Die alte Probe besteht aus Satz-Tafeln mit Karaoke-Untertiteln. Bilder gibt es dort nur dreimal: den Vertragsbalken (15–23 s), die Gabel (23–29 s) und die Kurve (34–39 s).
  - Neu hat jeder Beat einen Gegenstand als Helden: Figur, Vertragsblatt, Münzstapel, Waage, Rechnung, Lohntüte. Der Bildanteil liegt bei 62,5 % (Messung aus dem Bau).
- **Didaktik.**
  - Alt kommt die Frage erst ab 8 s. Der Irrtum „Man denkt: Was nichts kostet, ist gratis“ folgt erst bei 39 s, nach der Kurve. Dazu steht „Die meisten sagen: nichts“ ohne Quelle da.
  - Neu kommen Frage und Irrtum als Antwort-Schild in den ersten 6 s. Der Irrtum bringt seinen Grund mit, und die Widerlegung zeigt einen Vergleich (45 Mio. € gegen 0 €). Erst danach kommt der Begriff, zum Schluss der Transfer auf einen eigenen Abend. Das ist der Bogen aus §5.
- **Ein Modell trägt alles.** Die Waage zeigt Irrtum, Widerlegung, Begriff und Transfer. „Bezahlt“ und „aufgegeben“ liegen auf derselben Schale. Die alte Kurve stand 4,9 s und blieb abstrakt.
- **Belege sind sichtbar.** Jede Faktenszene hat eine Credit-Zeile; die alte Probe hatte keine.

**Nicht besser:**
- **Die Stimme ist dieselbe** wie in der alten Probe. Dazu kommt „Oportunitätskosten“ beim Schlüsselbegriff und eine Echo-Frage, die nicht wie eine Frage klingt. Die Stimme war Linus' Hauptkritik.
- **Die Länge:** 70,7 statt 52,6 s, also +34 %. Bei „Wissen nach 7 Tagen pro Minute“ muss der Transfer-Teil das wieder einspielen. Belegt ist das erst mit dem 7-Tage-Quiz.
- **Wenig Wechsel im Bild:** Von 31 bis 50 s bleibt der Ausschnitt fast gleich (Waage über Deutschland, Kontaktbogen 6a–8b). Abwechslung bringen dort nur Etiketten, Stempel und die Drehung.
- **Das Diagramm (51,7–64 s)** wirkt nach dem plastischen Atlas flacher. Es steht 11,5 s ohne Fahrt, und unter der Waage bleibt viel leeres Raster.
- **Die Figur** ist eine Tipp-Kick-Figur ohne Gesicht, nicht Lewandowski.

### Drei Dinge, die Linus beim Ansehen prüfen soll

Am Handy ansehen, einmal mit Ton und einmal ohne.
1. **43–50 s (Auflösung).** In gut 4 s passieren hier: Bayern nimmt das Geld, die Waage dreht sich, das Geld wird echt, „Opportunitätskosten“ erscheint unter der Kosten-Schale, der Spieler hebt ab.
   - Verstehst du beim ersten Ansehen, warum jetzt der Umriss des Spielers auf „Kosten“ steht?
   - Wenn nicht, ist das der erste Umbau (siehe Befund oben).
2. **26–37 s (Widerlegung), ohne Ton.**
   - Liest du die blasse, gestrichelte „45 Mio. €“ als Geld, das Bayern entgeht?
   - Liest du „0 €“ am Schild als „Behalten bringt keine Ablöse“?
   - Liest du „Nur sein Gehalt + Barças Geld“ mit durchgestrichenem „Nur“ als Korrektur deiner Antwort?
3. **51–64 s (Diagramm und Transfer).**
   - Trägt das Kino-Beispiel, oder wirkt das Bild nach der Karte leer und abfallend?
   - Dazu die Gesamtfrage: Wäre das Video mit einer guten Stimme für dich „klar besser“ (1–5)?

### Was nur die echte Stimme lösen kann

1. „Opportunitätskosten“ richtig aussprechen. Piper sagt zweimal „Oportunitäts-“, und der Hör-Check hört es so.
2. Die Echo-Frage „Nur sein Gehalt?“ am Ende steigen lassen.
   - Mit Piper klingt sie wie eine Wiederholung der Behauptung; Whisper schreibt „Nur sein Gehalt.“
   - Sonst hilft nur ein anderer Satzbau (Wunsch c an die Chefredaktion).
3. Betonung und Kontrast, etwa „Verkaufen bringt … Behalten keinen Cent“ und „keiner“. Piper setzt `betont` nicht um.
4. Das Tempo der Schlüsselsätze: Laut Prüfung 2 kommen Definition und Schluss-Satz auf bis zu 4,9 Wörter/s. Nachgerechnet: „Es steht nur auf keiner Rechnung“ hat 6 Wörter in 1,46 s, also 4,1 Wörter/s. Dazu fehlen echte Pausen vor der Wende.
5. Klang und Natürlichkeit, also genau das, was Linus „kacke“ fand.

**Folgen des Tauschs:**
- Alle Zeiten wandern mit.
- Bei 2,2 statt 2,31 Wörtern/s wird das Video etwa 3 s länger. Die Diagramm-Totale (jetzt 11,5 s) kann dann über p90 = 12 s kommen.
- Nach `voice.py --anbieter <sieger>`, `node build/bauen.mjs` und dem Render müssen die Tore und diese Abnahme noch einmal laufen: `python build/kontaktbogen.py` und der Hör-Check auf dem MP4.

### Was die Referenz-Clips noch ändern könnten

Die Destillation vom 27.10. (`docs/research/referenz-destillation.md`, 5 Clips) ist überall eingearbeitet, wo sie Zahlen liefert: Fahrten 0,5–0,6 s, Cue −2 Bilder, Tempo 2,2 Wörter/s. Offen ist noch:
1. **`snapshot --against` gegen 2–3 Referenzsequenzen.**
   - Das ist eine Freigabe-Bedingung aus VIDEO-PIPELINE §6 und ist nicht gelaufen.
   - Die Clips wurden nach der Messung gelöscht. Man müsste sie neu holen (ZDF-Mediathek; Terra X von Commons).
2. **Einstellungsdauer.**
   - Die Vorbilder liegen im Median bei 5 s (p90 12 s), der Goldstandard bei 8,1 s.
   - Die Folge wären mehr Nähte, etwa Nachfahrten in Beat 3, in Beat 7 und im Diagramm.
3. **Kreis als Marker.**
   - In 778 s Vorbild-Material gibt es keinen einzigen Kreis. Gemessen sind ✓/✗, Klammer, Textmarker und Abdunkeln.
   - Der Gold-Kreis um den Geist beim Begriff könnte deshalb dem Abdunkeln oder einer Klammer weichen.
4. **Text geht mit der Naht.**
   - Bei den Vorbildern verschwindet Text fast nie einzeln.
   - Hier tritt die Behauptung auf „Doch“ ab und kommt mit „Nur sein Gehalt?“ wieder. Das könnte ruhiger werden.
5. **Veritasium ist nie gemessen worden.** YouTube ist gesperrt, maiLab steht als Ersatz. Die Didaktik stützt sich deshalb auf Literatur (Muller et al. 2008), nicht auf Messung.

## Messwerte

| Wert | Runde 2 | Runde 1 | Ziel |
|---|---|---|---|
| Dauer | **70,7 s** (153 Wörter, 13 Szenen; Atempausen 0,9 + 0,6 + 0,7 + 0,9 s) | 69,4 s | ≤ 90 s |
| `hyperframes check` | **0 Fehler**, 6 Warnungen (unten begründet) | 0 / 7 | 0 Fehler |
| `check --caption-zone` (DESIGN.md §2) | 0 Fehler, 8 Warnungen (die 2 zusätzlichen kommen von der Nachfahrt im Satz) | 0 / 9 (in Runde 1 hier fälschlich als 7 angegeben) | 0 Fehler |
| Hör-Check **auf dem gerenderten MP4** | WER **1,3 %**, **−16,1 LUFS**, −4,3 dBTP, 2 lange Stillen (Denkpause 2,48 s, Halten 2,05 s; beide deklariert), 2,31 Wörter/s, `ok: true` | WER 3,3 % | G4 |
| Bildanteil (`build/messen-bild.mjs`, alle 0,1 s im Player) | **62,5 %**, 0 s ohne Held | 55,5 % | ≥ 50 % |
| Renderzeit (`--quality looks --workers 3`) | **173,3 s**, 11,8 MB | 111,9 s | – |
| Cue: Text gegen Wortanfang (Tor im Bau, 32 Texte) | **max. 80 ms** | 83 ms (28 Texte) | ≤ 150 ms |
| Cue: Energie-Probe (25 Einsätze nach Pausen) | max. 54 ms, Median 7 ms | 53 ms | – |
| Cue: Whisper | roh max. 419 ms, nach Abzug des Whisper-Versatzes (−82 ms) max. 337 ms; 3 Cues über 150 ms, alle widerlegt (unten) | 378 ms | ≤ 150 ms |
| Einzelbild-Scan (`build/flackern.py`, 2121 Bilder) | **0 Ausreißer an 13 Nähten**; 25 Hinweise, alle Stempel oder fallende Gegenstände | 0 an 12 | 0 |
| Seek-Test (`build/seek-test.mjs`, neu mit Änderungs-Rechteck) | **29 Bilder** an Markern, Stempeln, Drehung, Abflug, Schnitt und Nachfahrten: alle pfadunabhängig und bildgenau | 15 Bilder, Kriterium blind für Marker | alle |
| Schriftgröße aller Texte im Player (neu in `messen-bild.mjs`) | 0 Befunde; 3 Hinweise (je 1 Probe, Stempel federt beim Aufsetzen unter Maßstab 1) | nicht gemessen | ≥ 48 px, Credits ≥ 34 px |
| Lesefenster aller Texte im Player | 0 Befunde außer fallenden Gegenständen (Vertrag 15,7–15,8 s, Lohntüte 60,8–60,9 s) | „Lohn“ und Etiketten 2–9 px draußen | x 108–972, y 168–1330 |
| Kollisionen HUD-Text / Gegenstand | **0** | 3 kurze | 0 |
| Längste Einstellung ohne Fahrt oder Schnitt | **11,5 s** (Diagramm 51,7–63,2 s), dann 9,5 s (Beats 3–4); Median 8,1 s | 13,8 s und 12,3 s | p90 12 s |

**Zur Cue-Abweichung mit Whisper.** Whisper legt „Barcelona“ in den Vorlauf (Stille, 0,0 s). Die beiden anderen habe ich an der Lautstärke-Hüllkurve von `voice.m4a` nachgemessen:
- „nur“: Whisper 9,86 s, das ist das Ende von „Antwort“. Von 10,08 bis 10,26 s ist es still (−51 bis −65 dBFS), die Stimme setzt bei 10,28 s ein. Die Wortzeit sagt 10,279 s.
- „Ablöse“: Whisper 30,88 s, mitten in „Millionen“. Die Delle zwischen den Wörtern liegt bei 31,09–31,13 s, der Vokal „A“ bei 31,15 s, der Verschluss von „b“ bei 31,21–31,27 s. Die Wortzeit sagt 31,187 s.

Die Wortzeiten stimmen also auf etwa 50 ms. Whisper taugt hier nur als Grob-Tor (Wunsch an G4 unten).

**Zur Stimme.** Die neue Piper-Aufnahme (mit den Atempausen von Runde 2) spricht „eine Saison“ und „keiner“ jetzt so, dass Whisper sie erkennt. Falsch bleibt nur „Opportunitätskosten“ (2× „Oportunitätskosten“).

## Was in Runde 2 geändert ist

**Waage als Gegenstand (Prüfung 1, P1).** Vorher ein Drahtgestell aus 2-px-Linien, am Handy unsichtbar. Jetzt ist sie beleuchtet wie Figur und Münzen: Balken 18 px mit Lichtkante, Säule und Fuß als Fläche mit Licht links und Schatten rechts, Ketten 4 px Creme 80 %, Schalen 400 px breit mit Lichtkante. Im Handy-Blatt stehen Ketten und Balken jetzt sichtbar da.

**Widerlegung (Prüfung 2, zwei P1).**
- Der rote Durchstrich trifft **nur „Nur“** (Wortbreite gemessen). Auf „bezahltes“ wird die Zeile wieder hell, und „+ Barças Geld“ wächst in Gold hinten an. Das Gehalt steht die ganze Zeit unversehrt da; die Korrektur sieht aus wie eine Ergänzung.
- Der Vergleich hat ein Bild: Unter der Kosten-Schale steht „45 Mio. €“ im **Geist-Stil** (60 % Deckkraft, gestrichelte Gold-Unterkante), solange es nur eine Möglichkeit ist. Auf „keinen **Cent**“ fällt der Stempel „0 €“ an das Schild „Behalten“. Also: Geist mit 45 Mio. € gegen Behalten 0 €. Auf „**genauso**“ bekommt der Geist Gewicht, die Waage geht auf waagerecht, und die Zahl wird fest.
- Das Etikett ist zweizeilig: der Betrag, darunter sein Wort („entgangen“, auf „Alternative“ per Morph „beste Alternative“). Beim Begriff umkreist der Gold-Kreis also wirklich 45 Mio. €, und „beste Alternative“ hängt am Geist statt als Unterzeile unter dem D2.
- Die widerlegte Zeile tritt auf 35 % zurück, bevor der Geist beim Rückschwenk durch ihr Ende fliegt.

**Auflösung, Beat 8 (Prüfung 2 P1, Prüfung 1 P1/P2).** Vorher: fünf Bedeutungswechsel in 2,3 s, die Drehung lief gleichzeitig mit der Rückfahrt, und echtes Geld lag kurz auf „Kosten“ unter „Behalten“. Jetzt:
- In der Atempause nach der Definition (`atem_s` 0,6 s) treten Begriff, Kreis, Etikett und Beleg ab, und die Welt fährt zurück. „Im Juli **nimmt** Bayern das Geld“ steht damit in der Totale, die ganze Waage ist im Bild.
- Nach „Geld.“ folgt eine Atempause (`atem_s` 0,7 s; dafür ist Beat 8 jetzt zwei Szenen, `verkauf` und `aufloesung`). In ihr dreht sich die Waage bei stehender Kamera. Die Mitte der Drehung, also das Schild auf der Kante, liegt genau auf „Verkaufen“.
- Der Geist wird erst echt, wenn er auf der Nutzen-Seite ankommt. Echtes Geld liegt nie auf „Kosten“.
- Auf „Opportunitätskosten“ tritt das Geld auf 35 % zurück: Der gestrichelte Gold-Umriss auf „Kosten“ ist dann der einzige helle Gold-Gegenstand.
- Der Spieler fliegt nach **Südwesten** hinaus (erst senkrecht, dann im Bogen nach links unten, Austritt am linken Rand bei y ≈ 700), also Richtung Barcelona wie die Route. Vorher ging es nach Nordwesten.

**Beats 3–4 (Prüfung 1 P1, Prüfung 2 P2).**
- Die Waage neigt sich nur, wenn etwas aufsetzt: Der Beleg landet → links; der Spieler steigt erst auf „**schießt**“ auf die Nutzen-Schale → rechts. Vorher stand er schon da, und nichts geschah.
- Die Zeitleiste ist auf das Vertragsblatt gedruckt (720 × 370 px). „0 €“ ist ein zweiter Stempel auf „Bayern bekommt **nichts**“. Die Verlängerung tritt auf „nicht“ auf 35 % zurück, statt zu verschwinden (sie stand nur 1,0 s).
- Die Waage tritt im Vertrag auf 35 % zurück; Held ist das Blatt. Auf „**Danach**“ fährt die Welt 1,12-fach an das Blatt heran.
- Die Behauptung „Nur sein Gehalt“ tritt auf „Doch“ ab und kommt mit „Nur sein Gehalt?“ zurück.
- Ergebnis: längste Einstellung 9,5 s statt 13,8 s. Bei 21,9 s stehen 5 lesbare Texte auf dem Blatt und 3 Credit-Zeilen; die Texte an der Waage und „verlängern“ sind auf 35 % abgedunkelt (vorher 13 Textelemente in voller Deckkraft).

**Route und Ortspunkt (Prüfung 1 P2, neu in dieser Sitzung).** Die Route hat keine Aufgabe, solange die Waage in München steht. Abgedunkelt stach sie trotzdem durch „Vertrag: Salihamidžić …“, „Ablöse: …“ und „Wechsel: …“. Jetzt geht sie mit dem Zoom ganz weg. Sie kommt nur für die Fahrt nach Barcelona und den Flug des Geistes zurück. Der Punkt „München“ geht, sobald die Waage steht; er saß in Beat 4 mitten in „ablösefrei: EuGH, • Bosman-Urteil“.

**Hook (Prüfung 1 und 3, P2).** Die Figur steht schon in Bild 0 (Vorschaubild mit Held). Auf „behalten“ treten Route und „Barcelona“ zurück; „Barcelona •“ liest sich in der Denkpause nicht mehr als Teil des Schilds „Nichts, er ist ja da“. Die Denkpause ist im MP4 2,48 s lang (vorher 2,57 s, über der Spanne aus DESIGN.md §9).

**Diagramm (Prüfung 1 P1, Prüfung 2 P2, Prüfung 3 P2).**
- Nach dem Schnitt steht nur die leere Waage. Jede Kategorie kommt mit ihrem Beispiel: Die Rechnung **fällt** auf „geschenkt“, schon mit „0 €“. Das gestrichelte Gold-Fach „aufgegeben“ rastet auf „**Genau** dann“ ein.
- Schrift auf Gegenständen 48 px („Rechnung“, „Lohn“, Schalen); die Rechnung ist 254 px breit, die Tüte 140 px.
- Fach und Tüte sind deckend, also scheint keine Kette mehr durch. Ihre Fläche kommt mit dem Strich und steht nicht mehr vorher als dunkles Loch im Raster.
- „Nachhilfe, heute Abend“ gehen mit der Tüte auf „Lohn“, statt danach ohne Gegenstand zu schweben.
- Auf „**Gratis**“ treten die Gleichung, die Nutzen-Seite und die Kinokarte zurück. Fuß, Säule und Schild gehen ganz, und die Welt fährt 1,9-fach an die Kosten-Schale; diese steht danach in der Bildmitte. Auf „nicht“ zuckt die Lohntüte neben der Rechnung „0 €“. Das Bild sagt „nicht gratis“, statt „geschenkt ≠ gratis“ hinzuschreiben.
- Im Satz zieht die Gold-Unterstreichung unter „aufgegeben“ am Gold-Fach, nicht unter der kleinen Gleichung. Die Navy-Unterstreichung liegt unter dem Kopf der Rechnung.
- Neu in dieser Sitzung: Fach und Tüte sitzen 10 px weiter rechts, die Rechnung 6 px. So steht „Lohn“ ganz im Lesefenster (vorher bei x = 99).

**Etiketten an der Kosten-Schale (neu in dieser Sitzung).** Bei waagerechter Waage begannen „45 Mio. €“, „entgangen“, „beste Alternative“ und „aufgegeben“ 2 px links vom Lesefenster (gemessen). Der Versatz ist jetzt −162 statt −164 px.

**Prüfwerkzeuge (Prüfung 3, P2).**
- `build/messen-bild.mjs` misst jetzt die effektive Schriftgröße jedes Textes (Schriftgröße × Bildschirm-Maßstab, ≥ 48 px, Credits ≥ 34 px). Kollisionen prüft es an den Textzeilen statt am Block; vorher galt die Figur neben „Behalten?“ als überdeckt, weil der Titel-Block 864 px breit ist. Federt ein Stempel für eine einzige Probe unter Maßstab 1, ist das ein Hinweis, kein Befund.
- `build/seek-test.mjs` vergleicht im **Änderungs-Rechteck**, also dort, wo sich der Render zwischen n−1 und n+1 unterscheidet. Über das ganze Bild gemittelt ging ein zeichnender Durchstrich im Rauschen unter. Die Prüfbilder kommen aus den Zeiten des Baus und wandern mit, wenn die Stimme wechselt. Beleg: Bild 849 (Durchstrich zeichnet) misst 27,0 dB gegen 19,4/22,3 dB der Nachbarn.
- `build/bauen.mjs`:
  - `hole()` nimmt GSAP und Schriften aus `assets/`, wenn die SHA-256 stimmt; aus einem frischen Klon braucht nur noch die Karte das Netz.
  - Das Skript `bauen` in `package.json` ruft vorher `npm ci --prefix build` auf.
  - Die Marker-Bibliothek wird ohne ihren langen Kopf-Kommentar eingesetzt; er steht in `lib/marker.js`. So bleiben `hook`, `widerlegung` und `entgangen` unter 300 Zeilen, und drei Warnungen sind weg.
- `render` in `package.json` setzt `--quality looks` ausdrücklich.

## Abweichungen vom Drehbuch

1. **Geist statt fliegendem Geld.** Nach München fliegt der Umriss des Stapels; echt wird er erst nach der Drehung auf „Nutzen“. Das Drehbuch sagt „Darsteller geld … wechselt nie die Form“.
2. **Beat 8 ist zwei Szenen** (`verkauf`, `aufloesung`) mit `atem_s` 0,7 s dazwischen. Dazu kommt `atem_s` 0,6 s nach der Definition. Der Sprechtext ist unverändert.
3. **Die Waage dreht sich in Beat 8** und hat ein Schild („Behalten“ → „Verkaufen“; im Diagramm „Kino“).
4. **„Opportunitätskosten“ und „1 Saison“** stehen in Gold unter der Kosten-Schale, nicht an der leeren Nutzen-Schale.
5. **Der Spieler landet nicht in Barcelona**, er fliegt nach Südwesten aus dem Bild. Der Umriss auf „Kosten“ trägt die Auflösung.
6. **Tipp-Kick-Figur** statt Foto (Lizenz offen, KI-Bild verboten). Sie steht ab Bild 0 und steigt erst auf „schießt“ auf die Schale (Drehbuch: auf „Tore“).
7. **Vertrag als Blatt** mit aufgedruckter Zeitleiste und zwei Stempeln; kein Kreis um „30.06.2023“. Nachfahrt auf „Danach“.
8. **Keine Datelines und keine Ländernamen**: Die Daten stehen in den Credits.
9. **Widerlegung:** Durchstrich nur auf „Nur“, Korrektur durch Anwachsen von „+ Barças Geld“ (Drehbuch: Morph des ganzen Schilds). Zusätzlich der Stempel „0 €“ am Schild „Behalten“ und „45 Mio. €“ im Geist-Stil.
10. **„beste Alternative“** hängt als zweite Etikett-Zeile am Geist (Morph aus „entgangen“); kein „aufgegeben“ im Atlas.
11. **Diagramm:** Rechnung und Gold-Fach kommen erst mit ihren Beispielen; keine Klammer „Rechnung“, kein „geschenkt ≠ gratis“, kein „Aufgeben = Kosten“. Die Gleichung erscheint auf „kostet“ und geht auf „Gratis“. Die Nachfahrt kommt auf „Gratis“ (Drehbuch: Kamera steht bis zum Ende).
12. **Kein Etikett „Satz fürs Gespräch“ / „Satz für die Stunde“** im MP4. Das Etikett hängt vom Profil ab, und ein Video gilt für beide; es gehört in den Player (offene Frage im Drehbuch, BANNED 2: kein Label in der Ecke).
13. **Route und Ortspunkt München** sind weg, solange die Waage steht.
14. **Neue Cues** in `build/script.py`: `nur`, `schiesst`, `verlaengern_an`, `danach`, `nichts`, `bietet`, `cent`, `gewicht`, `nimmt`, `dreh`, `abflug_spieler`, `ok_saison`, `genau`, `gleichung`, `gratis_nicht`. `landung_spieler` entfällt. Die Tabelle in `drehbuch.md` kennt sie noch nicht (Wunsch unten).

## Warnungen, die bleiben

- `composition_file_too_large` (2×): `atlas.html` (Karte, 107 KB Pfade, und die Bühnen-Bibliothek) und `diagramm.html`. Von Hand bearbeitet wird nur der Teil außerhalb der Marken; die Quellen sind `lib/atlas.html`, `lib/diagramm.html`, `lib/buehne.js` und `build/drehbuch-*.js`.
- `timeline_track_too_dense` (1×): die Beat-Marken der Atlas-Bühne. Sie sind unsichtbar und dienen nur `snapshot --review`.
- `line_unread` (1×): „Nur sein Gehalt + Barças Geld“ in `entgangen` (1,2 s). Die Zeile läuft in `begriff` weiter und steht insgesamt 3,1 s (35,5–38,6 s); `check` sieht jede Datei einzeln.
- `contrast_aa_failure` (1×): der Stempel „bezahlt“ auf dem Beleg bei 19,6 s. In Beat 4 ist die ganze Waage auf 35 % abgedunkelt. Abgedunkelte Texte sollen nicht gelesen werden (DESIGN.md §6) und zählen nicht als Text.
- `rotation_pivot_drift` (1×, `#w-balken`): Falscher Alarm. Der Balken dreht um die Säulenspitze (`translate · scale · rotate · translate` in `lib/buehne.js`). `check` sammelt die Mitte seines Rahmens über das ganze Video, und dabei fährt die Kamera München → Barcelona → München; daher die 1290 px.
- Mit `--caption-zone` zusätzlich `container_overflow` und `escaped_container` für `#d-welt` bei 66,8 s: Die Welt-Hülle ist in der Nachfahrt 1,9-fach größer als die Bühne. Das ist gewollt.

## Schwächste Stelle

**Das Diagramm, 51,7–63,2 s.** Die Kamera steht 11,5 s; neue Elemente kommen alle 0,6–2,3 s (Karte, Rechnung, Fach, Nachhilfe, Tüte, Gleichung, Lohn). Die Waage ist eine Strichzeichnung von 940 × 500 px auf Rasterpapier. Nach dem plastischen Atlas wirkt das flacher und leerer, besonders unter dem Fuß (y 1130–1330).
- Eine 1,25-fache Waage, wie Prüfung 1 vorschlägt, passt nicht ins Bild: 940 px × 1,25 = 1175 px > 1080 px. „aufgegeben“ und „Lohn“ fielen dann links aus dem Lesefenster.
- Eine Nachfahrt schon auf „Lohn“ schnitte die Nutzen-Schale mit der Kinokarte ab, gerade wenn die Stimme „Das kann es wert sein“ sagt. Dafür muss die waagerechte Waage mit beiden Schalen zu sehen sein.

Mit mehr Zeit würde ich eine eigene Diagramm-Geometrie bauen: höhere Säule, längere Ketten, schmalerer Balken. Der Passschnitt wäre dann ein Schnitt mit Größenwechsel. Danach kommen:
- **Die Stimme.** Piper sagt „Oportunitätskosten“. Der Anstieg bei „Nur sein Gehalt?“ fehlt.
- **Fallende Gegenstände** (Vertrag, Lohntüte) liegen 0,1–0,2 s über dem Rand des Lesefensters, während sie fallen.

## Nicht behoben (mit Grund)

- **Platzhalter-Stimme (Prüfung 3, P0):** Die Casting-Entscheidung fällt am 1.11. Bis dahin taugt eine Bewertung durch die Brüder nicht als Freigabe.
- **Diagramm als lange Totale (Prüfung 1, P1, teilweise):** siehe „Schwächste Stelle“. Behoben sind die Schrift (≥ 48 px), die Kategorien mit Beispiel, deckende Fächer und die Nachfahrt auf „Gratis“ ohne Säulenreste. Die Einstellung ist 11,5 statt 13 s lang und liegt damit unter p90 = 12 s (DESIGN.md §9).
- **„beste Alternative“ ohne Beispiel (Prüfung 2, P2):** Das braucht neuen Sprechtext oder eine andere Abruffrage 3. Das entscheidet die Chefredaktion (Wunsch unten).
- **Antwort-Schilder an der Form erratbar (Prüfung 2, P2):** „Barcelona will Lewandowski kaufen“ wäre Sprechtext und braucht einen Beleg. Das entscheidet die Chefredaktion (Wunsch unten).
- **Echo-Frage hängt an der Tonhöhe (Prüfung 2, P2):** Satzbau-Vorschlag „Ist es nur sein Gehalt? Nein.“ geht an die Chefredaktion. Mit der Piper-Stimme erkennt Whisper die Frage nicht („Nur sein Gehalt.“).
- **Tempo der Schlüsselsätze (Prüfung 2, P2, teilweise):** Die Atempause nach der Definition ist eingebaut. Der Rest ist eine Eigenschaft der Stimme und kommt als Abnahme in den Casting-Hör-Check (Wunsch unten).
- **Render-Qualität (Prüfung 3, P2), widerlegt:** `--quality looks` ist die Voreinstellung und erscheint im Render-Log als `"quality":"standard"` (CRF 16). Auch der Render aus Runde 1 war also schon „looks“. Jetzt steht es ausdrücklich im Aufruf.
- **Rotes Kreuz für „Nichts, er ist ja da“ (Runde 1):** Rot gibt es genau einmal. Der Ablenker wird widerlegt, wenn der Gehalt-Beleg auf die Kosten-Schale fällt.
- **Rückennummer auf der Figur (Runde 1):** Jede Zahl im Bild braucht einen Beleg im Faktenblatt.

## Gemessen, nur angesehen, ungeprüft

- **Gemessen:**
  - `check` mit und ohne Untertitel-Zone;
  - Lesefenster, Schriftgröße und Kollisionen aller Texte im Player (707 Proben);
  - Bildanteil, Cue-Tor, Haltezeiten;
  - Hör-Check auf dem MP4, Lautheit;
  - Einzelbild-Scan, Seek-Test (29 Bilder), Renderzeit;
  - die Hüllkurve an „nur“, „Ablöse“ und „Cent“.
- **Angesehen:**
  - Beat-, Naht- und Handy-Blätter aus zwei `snapshot --review`-Durchgängen;
  - Einzelbilder zu Begriff, Drehung und Abflug (18 Bilder), Credits bei 21,9, 32,2 und 47,5 s;
  - Belege in `belege/`:
    - `vertrag-blatt.jpg`: 21,9 s, Blatt mit Zeitleiste und zwei Stempeln, Waage zurückgetreten, Credits frei;
    - `vergleich-null-euro.jpg`: 33,2 s, „Nur“ durchgestrichen, Geist mit „45 Mio. €“ im Geist-Stil, „0 €“ am Schild „Behalten“;
    - `abflug-suedwest.jpg`: 49,3 s, Spieler verlässt das Bild nach links unten, Umriss mit „Opportunitätskosten / 1 Saison“ auf „Kosten“, Geld abgedunkelt.
- **Ungeprüft:** iPhone/Safari, Ton am Kopfhörer, wie die Drehung auf einem echten Handy wirkt, Bewertung durch die Brüder.

## Wiederholen

```bash
. /opt/deeptok/env.sh
cd studio/gold-opportunitaetskosten
npm ci --prefix build                               # d3-geo, topojson-client (node_modules ist gitignored)
# Stimme (nur bei neuem Skript oder neuer Stimme). Ohne das Paket onnx fällt voice.py auf
# geschätzte Wortzeiten zurück (Wunsch unten).
/home/user/Deeptok/.venv/bin/python build/voice.py --anbieter piper
python build/script.py --cues                       # Selbstprüfung des Skripts
node build/bauen.mjs                                # Prüfsummen, Zeiten, Cue-Tor, Messen (Netz nur für die Karte)
npx hyperframes check && npx hyperframes snapshot --review
npx hyperframes render --quality looks --workers 3 -o renders/gold.mp4
/home/user/Deeptok/.venv/bin/python build/flackern.py renders/gold.mp4   # Nähte, Exit 1 bei Ausreißer
python ../../factory/fabrik.py hoercheck --audio renders/gold.mp4 --text <sprechtext.txt> --erlaubte-stillen 2 --json
npx hyperframes play . --port 3115 --no-open &      # Player im Hintergrund, dann:
node build/messen-bild.mjs 3115 0.1                 # Bildanteil, Lesefenster, Schriftgröße, Kollisionen
node build/seek-test.mjs 3115 renders/gold.mp4      # Seek-Test gegen den Render (Änderungs-Rechteck)
python build/kontaktbogen.py                        # Abnahme-Bilder: Kontaktbogen, alt/neu, Poster (Zeiten aus timing.json)
```

## Was Linus jetzt tun und prüfen soll

1. **Das MP4 am Handy ansehen** (`renders/gold.mp4`, gitignored: nur in dieser Sitzung oder nach neuem Render). Die Stimme bitte wegdenken. Achte auf:
   - 29–36 s: Liest du „45 Mio. €“ als Möglichkeit (blass, gestrichelt) und „0 €“ am Schild als „Behalten bringt nichts“?
   - 43–49 s: Siehst du die ganze Waage, wenn Bayern das Geld nimmt? Ist die Drehung in der Pause verständlich?
   - 51–63 s: Ist das Diagramm zu leer? Das ist die schwächste Stelle.
2. **Mit deinem Bruder 29–36 s und 44–49 s ohne Ton ansehen** und fragen, was der gestrichelte Stapel bedeutet und warum sich die Waage dreht. Persönliches dazu bitte nicht ins Repo.
3. **Entscheiden:** Tipp-Kick-Figur oder Wikimedia-Foto (Duoton, Lizenz prüfen)?
4. **Noch keine Freigabe-Bewertung:** erst nach dem Stimmtausch am 1.11. Dann `voice.py --anbieter <sieger>`, `node build/bauen.mjs`, neu rendern und die Tore oben laufen lassen. Den Bruder bei etwa 6,5 s von Hand anhalten lassen (Denkpause); einen Player mit Halt gibt es noch nicht.
5. **Beim Casting-Hör-Check** auf „Opportunitätskosten“, „eine Saison“, „keiner“ und den Anstieg bei „Nur sein Gehalt?“ achten. Definition und Schluss-Satz sollen höchstens 2,6 Wörter/s haben.

## Wünsche an andere Dateien (nicht geändert)

1. **`drehbuch.md` (Chefredaktion):**
   - Tabelle und Kamera-Vertrag an Runde 2 anpassen: die neuen Cues; Beat 8 als zwei Szenen; `atem_s` 0,6/0,7; Durchstrich nur auf „Nur“ mit „+ Barças Geld“; „45 Mio. €“ im Geist-Stil und Stempel „0 €“; Zeitleiste auf dem Blatt; Abflug nach Südwesten; Kategorien mit Beispiel; kein „geschenkt ≠ gratis“; Satz-Etikett im Player.
   - Entscheiden: „beste“ mit Beispiel (Variante a: kurz eine zweite, schwächere Alternative im Transfer, ein Halbsatz) oder Abruffrage 3 auf eine Alternative umstellen und „beste“ im Info-Blatt erklären (Variante b).
   - Entscheiden: „Barcelona will Lewandowski **kaufen**.“ (bereitet „Barças Geld“ vor; Beleg im Faktenblatt nötig). Dann könnte das Irrtums-Schild „Sein Gehalt“ heißen, weil der Durchstrich der Behauptung „Nur“ trifft.
   - Entscheiden: Echo-Frage als „Ist es nur sein Gehalt? Nein.“ (trägt die Frage ohne Tonhöhe; Cue `falsch` auf „Nein“).
2. **`factory/` (G0, Bogen-Prüfung):** eingeschobene Beats Begriff, Auflösung und Satz zulassen, dazu zwei Widerlegungs-Szenen und zwei Auflösungs-Szenen hintereinander; das Feld `atem_s` kennen (0,6–1,1 s, keine „lange Stille“).
3. **`factory/werk/hoercheck.py` (G4):**
   - eine Pflichtwortliste (Opportunitätskosten, Saison, keiner, Ablöse): Jede Ersetzung lässt das Tor scheitern, auch unter der WER-Schwelle;
   - Tempo je Satz für Schlüsselsätze (≤ 2,6 Wörter/s);
   - auf dem MP4 laufen, `--text` auch direkt annehmen;
   - Whisper nur als Grob-Tor, für Cues die Energie-Probe `pruefe_einsaetze` aus `build/voice.py`.
4. **`docs/VIDEO-PIPELINE.md` §6:**
   - G6-Kandidaten: `build/messen-bild.mjs` (Bildanteil, Lesefenster, effektive Schriftgröße, Kollisionen an Textzeilen) und das Cue-Tor in `build/bauen.mjs`;
   - G7-Kandidaten: `build/flackern.py` und `build/seek-test.mjs` (Änderungs-Rechteck).
5. **`tools/setup-umgebung.sh`:** das Paket `onnx` (bzw. `piper-tts[alignment]`) in die Werkstatt-venv aufnehmen und `SETUP_VERSION` hochzählen.
6. **`CLAUDE.md` „Stil“:** auf `studio/DESIGN.md` verweisen (Kartentöne, Geist, beleuchtete Gegenstände).

`studio/DESIGN.md` habe ich selbst ergänzt (erlaubt):
- Schrift auf Gegenständen ≥ 48 px effektiv; € auf Münzen als Form;
- Neigung nur mit Ursache; Drehung bei stehender Kamera in einer Atempause; Morph Geist → echt erst auf der neuen Seite; höchstens eine Bedeutungsänderung je Sekunde;
- Durchstrich nur auf das falsche Wort, Korrektur als Ergänzung;
- Kategorie mit Beispiel und deckende Gegenstände im Diagramm;
- beleuchtete Gegenstände im Atlas; Route nur, solange etwas fließt, in der Farbe dessen, was fließt; Ortspunkt geht unter einem Gegenstand; Zahl im Geist-Stil und zweizeiliges Etikett;
- BANNED 20–23.
