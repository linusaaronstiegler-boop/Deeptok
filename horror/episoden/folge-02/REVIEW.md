# Review Folge 2 „Hiding Night“, Teil 2

Stand 16.11.2026. Grundlage: 36 Befunde aus zwei Kritiken (Bild; Erzählung und Ton) zum Render aus Commit 2a84cb6, dazu Linus' Rückmeldung zu Teil 1: „sehr gute, fesselnde Geschichten“, „mit Teil 2 weitermachen“, „die Musik fand ich gut, kopier die Musik der Vorbildvideos mehr eins zu eins, aber mit eigenem Stil“.

Jeden Befund habe ich an Bildern, Schnellbögen, Einzelbildern und Messungen selbst geprüft. Bis auf zwei Zahlenangaben (siehe „Geprüft, anders gesehen“) haben sich alle bestätigt.
Behoben sind der P0, alle P1, die sich ohne neue Aufnahme beheben lassen, und die kleinen, eindeutigen P2. Neue ElevenLabs-Aufnahmen gab es keine: Kein Befund war ein Ton-P0. Die Erzähl-P1, die neuen Text brauchen, stehen unten als fertiger Vorschlag zum Vertonen.

## Messwerte

{{MESSWERTE}}

## Behoben

### P0

| Befund | Geprüft | Behoben durch |
|---|---|---|
| Elis liegendes Gesicht steht im Höhepunkt auf dem Kopf (E50, E53, E58, E59): Brauen als Lächeln, Schreckmund als Punkt auf der Stirn | bestätigt; die neue Prüfung maß 157–166° Neigung, dazu Junes Gesicht in E51, E52, E54 mit 56–62° | `ROLL_LIEGEN` −90 statt +70. **Neue Kopf-oben-Regel** in der Kompositionsprüfung (`render.mjs --schnellbogen`): Für jedes sichtbare Menschengesicht darf der projizierte Vektor Kopfmitte → `ueber_kopf` höchstens 30° von „oben“ abweichen, sonst bricht der Schnellbogen mit Fehler ab. Junes Nahaufnahmen von der Fußseite des Betts. Alle 62 Einstellungen bestehen |

### P1 Bild

| Befund | Geprüft | Behoben durch |
|---|---|---|
| Kriechkeller warm und gemütlich (Median 96, heller als der Rest) | bestätigt: `innen_warm` mit Himmel-/Bodenlicht 2,4 | Eigenes Preset `kriechkeller` in `src/licht.js`: Füll-Licht 0,55 kühl blaugrau, das warme Hauptlicht steht fast senkrecht und fällt nur durch die Fugen (die Bretter werfen Schatten, warme Streifen liegen auf Elis Gesicht und dem Boden), Taschenlampe als Punktlicht mit sichtbarem Kegel. Fugen 4,2 statt 3 cm, Fugenleuchten 2,0 statt 3,2 (sonst legte Bloom einen Schleier über alles). `pruefen.py`: Keller zählt nicht zum Median, eigene Untergrenze 22 je Einstellung |
| „bent“ und „Ready?“ zeigen keine Bedrohung | bestätigt; zudem standen die Füße längs der Fugen | Monster steht quer zu den Fugen; Sohlen mit vier Zehen, die Schatten werfen. E57 schräg fast längs der Fugen: auf „bent“ sackt die Mitte 10 cm durch (vorher 5,5 cm senkrecht von unten, unsichtbar), feiner Staub. E61: auf „One“ wird es oben dunkel, auf „Ready?“ gleiten vier Fingerschatten quer über die Fugen, die Spitzen glimmen hell in den Fugen, in 0,2 s spreizen sie sich. Kein Finger kommt durch (Teil 3) |
| Junes Atem auf „stopped“ fehlt, Gesicht angeschnitten (E52, E54) | bestätigt | Ganzes, aufrechtes Gesicht von der Fußseite des Betts; weißer Atem ab „she“ über den Lippen (Partikel-Ort jetzt auch als Anker mit Versatz) |
| E40 beginnt 0,85 s in einer Fläche | bestätigt: Die Fahrt startete in der offenen Fahrertür | Kamera aus der Endkadrierung (Owens Stiefel ab dem ersten Bild). **Neues Leerbild-Tor** in `pruefen.py`: kein Bild mit Streuung unter 12 in den ersten 0,5 s einer Einstellung |
| Hook liest sich als Kerzen, Auge eine Sichel | bestätigt | E01 beginnt 0,6 m vor dem offenen Auge (etwa 25 % der Bildbreite, Spalt weiter geöffnet) und zieht in 1 s auf (Ease-out, höchstens 3 m: dahinter steht das Haus). Fingerspitzen gedämpft, Nägel dunkel statt hell (weniger „Docht“) |
| Monster-Pose wirkt wie Strecken/Jubeln, Mantel weiß, Farbe springt | bestätigt | Mantel `#34363f` mit schmaler kalter Kante in jeder Lichtstimmung (neue Parameter `mantel`, `ellbogen_spitze`, `ellbogen_pol`, `spitzen_glut`, `naegel`), kurze Ellbogenspitzen. E03 groß im Vordergrund von vorn (Hände vor dem Gesicht), E04 von der Seite statt steil von unten |
| „June took my bag“ ohne Tasche, Köpfe angeschnitten | bestätigt | Halbnah von der Seite, beide Gesichter und der Rucksack im Bild, Greifen ohne Vorbeugen (`lehnen: false`) |

### P1 Ton und Musik

| Befund | Geprüft | Behoben durch |
|---|---|---|
| Musik fehlt 14 s im Finale, 1,6 s vor dem Omen | bestätigt | Wegfälle 1,2–1,4 s: vor „side by side“, nach „Ninety-nine“ bis „The bell struck midnight“, auf „No counting came from the square“. Dazwischen läuft das Bett; ganz still erst nach „Ready?“ |
| Stufenpegel weichen ab (dünn 15–16 LU unter der Stimme, Hook nicht lauter) | bestätigt | Flaches Bett wie r5: normal 12 LU unter der Stimme, voll etwa 11, dünn mit +4,2 dB etwa 13, Hook +2,5 dB (neues `pegel_db` je Punkt in `spannung.py`). Stufen unterscheiden sich über die Instrumente |
| Odell klingt höher als June | bestätigt (Messung der Kritik) | −4,5 statt −1,5 Halbtöne |
| Erzähl-P1 ohne neue Aufnahme | – | siehe „Nicht behoben“ |

### P2 (behoben)

| Befund | Behoben durch |
|---|---|
| Musik wechselt neunmal die Stufe, voll unter Odell und Tess | drei Zustände (normal, voll ab der Luke, dünn nach Mitternacht) plus kurze Wegfälle |
| Spieldose schmal, Anschlag streut | Wiegenlied Stufe 2b: Panorama 0,2, Hall-Breite 0,75 (Seite/Mitte −7,4 dB, r5 −7,2), Akzente 78 bei Füllern um 76, Phrasen-Bogen 0,3 dB, tiefer Grundton leiser |
| Teil 1 neu ersetzt das gelobte Bett | Teil 1 ist mit derselben flachen Regel neu gemischt; die alte Fassung mit `klangbett-r2-a` bleibt unverändert (`build/folge-01/folge-01-vorhoer.mp4`, `build/folge-01/teilen/hiding-night-teil1-vorhoer.mp4`) für Linus' A/B-Vergleich |
| Regel-Glocke bei 29,7 s nimmt dem echten Schlag die Wirkung | leise (−22 dB) und dumpf (Tiefpass 900 Hz, neues Cue-Feld `tiefpass_hz`), Zählschlag dort ebenso; E23 entsättigt wie eine Rückblende |
| Fake-out nach dem Vorhang | ein langsames Klopfen ans Glas direkt nach „shut“ (5,69 s): das Monster tut etwas, bevor der Garten leer ist |
| Untertitel auf dem Gesicht in Nahaufnahmen | Kompositionsprüfung prüft jetzt auch die Augen; E58 zielt auf die Augen |
| Schuhe „kicked apart“ zu ordentlich | neue Ordnung `getreten`: ein Schuh auf der Seite, ~120° gedreht, 0,75 m auseinander |
| E05 nur Vorhang | hinter Elis Schulter: erst die Hände draußen im Fenster, nach dem Zuziehen Elis Kopf und Hand am Vorhang |
| E15 Händeschütteln, Zucken aus dem Bild | Zucken auf 35 %, Kamera auf Kopfhöhe (der Boden liegt bei 0,6 m), weißer Atem auf „cold“; das Greifen liest sich weiter eher als Faust an Hand (siehe offen) |
| Junes Füße wie Hausschuhe | Schuhart `barfuss`: flacher Fuß in Hautfarbe mit fünf Zehen |
| Elis Jacke schwarz auf der Treppe | Füll-Licht vom Treppenfenster in E12 |
| E26 June nur Schulter, E37 Hinterkopf | E26 über Odells Seite auf Junes Gesicht; E37 Eli am Bett mit Taschenlampe, Dreiviertel |
| Glocke nie zu sehen | `hauptstrasse` `glocke.offen`: offene Schallluke zur Straße; E55 zeigt Uhr und schwingende Glocke |
| E34 Schild vor der Linse | Kamera vom Schild weg (Gehweg links) |
| Menge dünn | fünf weitere Erwachsene, „Nobody laughed“ mit zwölf Figuren in drei Reihen |
| Monster seltener als berichtet | Schnellbogen zählt jetzt nur Einstellungen, in denen ein Monster-Anker im Bildfeld liegt |

## Nicht behoben

### Erzählung (P1, braucht neuen Text und damit eine neue Aufnahme)

Die Aufgabe erlaubt neue Aufnahmen nur bei einem Ton-P0. Ohne Aufnahme lassen sich diese drei P1 nicht ehrlich beheben: Wörter aus der Aufnahme zu schneiden hätte die Mitte nur um etwa 2,5 s gekürzt und an den Schnitten die Satzmelodie gebrochen. Ich habe deshalb nichts an der Stimme geändert und den Text fertig vorbereitet.

| Befund | Bestätigt | Vorschlag (Linus entscheidet) |
|---|---|---|
| Mitte 20,6–46,6 s ist Erklärung ohne Ereignis (26 s) | ja: neun Sätze Regeln und Figuren, keine Steigerung | Auf etwa 15 s straffen und die gewonnene Zeit für eine Steigerung im Haus nutzen (Text unten) |
| Ohne Teil 1 versteht man die Entscheidung nicht (Owen, Dad, Versteckregel) | ja: „hide until sunrise“ fällt nie, Owen und Dad werden nicht erklärt | je ein Halbsatz Kontext (unten) |
| „I climbed in anyway“ kostet Eli Sympathie | ja | June erzwingt die Entscheidung (unten) |
| „helper too“ wird als „help or two“ gehört (P2) | ja, in beiden Fassungen | „It takes whoever helps.“ (unten) |

Vorschlag für die Neuaufnahme (Änderungen gegenüber `skript-teil2.txt`):

1. Satz 1: *Mister Hundred takes you at eighteen, and it came six hours early, like it knew where I'd hide.*
2. Satz 10 (June): *"Everyone knows it can't touch you before midnight."*
3. Sätze 11–23 (bisher 26 s) als sechs Sätze:
   *At eleven, Mr. Odell walked me and Tess Lowry to the square, like every birthday.*
   *On every porch, the shoes were kicked apart, because side by side is all it leaves.*
   *At midnight, his bell starts the count. Only the sunrise bell ends it.*
   *Then Odell looked at June. "It takes whoever helps." "So why are you still here?"*
   *Tess grinned. "Last game of hide and seek, huh?" Nobody laughed.*
   *She'd hide in the bell tower, higher than any window.*
4. Neu nach Satz 25 (Steigerung im Haus, etwa 4 s): *While I packed, something tapped on June's window. Three slow knocks.*
5. Sätze 27–28: *If I ran, I'd end up like Owen Pike, his shoes on his truck seat. If June hid me, she'd end up like Dad, who hid her six years ago.*
6. Satz 33: *She closed the hatch before I could say no.*

Aufwand: Den ganzen Teil in einem Take neu aufnehmen (etwa 1.600 Zeichen, zwei Takes ≈ 3.200 Credits wie beim ersten Mal). Nur die geänderten Sätze einzusetzen (≈ 650 Zeichen, ≈ 1.300 Credits für zwei Takes) wäre billiger, aber Tonfall und Raum der einzelnen Takes passen selten nahtlos. Danach Wortzeiten, Shotliste und Render neu (etwa 25 min Rechenzeit).

### Bild (P2, offen)

- **Monster im Mittelteil:** Sichtbar ist es jetzt in 9 von 62 Einstellungen (14,5 %, Zählung im Schnellbogen); die Lücke zwischen 34 und 77 s bleibt. Einen Versuch mit Beinen vor Junes Seitenfenster bei „The one room it never looks in“ (E11) habe ich verworfen: Durch das kleine Fenster war es nur ein dunkler Fleck. Mit der Neuaufnahme oben passt das Klopfen an Junes Fenster als echter Monster-Beat.
- **E15:** Das Greifen liest sich weiter eher als Faust an Hand als ein Griff ums Handgelenk; Zucken und Atem sind jetzt im Bild.
- **E34:** Das Schild ist weg, die oberen Fenster der Häuserzeile stehen aber nicht im Bild (kein Größenvergleich).
- **Kompositionsprüfung:** 16 von 62 Einstellungen haben die Hauptsache außerhalb des mittleren Drittels (vorher 14), meist Untersichten im Keller und Nahaufnahmen mit Ziel auf den Augen; nur Warnung. Kein Gesicht und kein Mund oder Auge im Untertitel-Streifen.
- **Fingerschatten:** Durch die Fugen liest sich die Hand als vier dunkle Bahnen mit kalt glimmenden Spitzen, nicht als scharf umrissene Hand. Mehr geht, ohne dass ein Finger durchkommt, kaum; das bleibt für Teil 3.

### Ton (offen)

- Linus' Ohr: Odell mit −4,5 Halbtönen, Musikpegel und die kurzen Wegfälle. Ich habe gemessen, nicht gehört.
- Die Streuung der Anschlagstärke der Spieldose habe ich nach der Änderung nicht neu gemessen (die Analyse braucht das librosa-venv).

## Geprüft, anders gesehen

- „Monster in 7 von 61 Einstellungen“: Die neue Zählung im Schnellbogen (Anker im Bild) ergab für den alten Stand auch E57 und E61, weil die Füße oben im Bildfeld liegen, aber hinter den Dielen verdeckt waren. Die Kritik hat recht: Sichtbar waren sie nicht. Die Zählung prüft keine Verdeckung, das steht im Bericht dazu.
- „Odell 200 Hz“ habe ich nicht nachgemessen, nur die Tonhöhe gesenkt; der Hör-Check läuft auf dem Ergebnis.

## Teilen-Fassungen

{{TEILEN}}
