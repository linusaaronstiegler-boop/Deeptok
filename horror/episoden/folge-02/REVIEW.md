# Review Folge 2 „Hiding Night“, Teil 2

Stand 16.11.2026. Grundlage: 36 Befunde aus zwei Kritiken (Bild; Erzählung und Ton) zum Render aus Commit 2a84cb6, dazu Linus' Rückmeldung zu Teil 1: „sehr gute, fesselnde Geschichten“, „mit Teil 2 weitermachen“, „die Musik fand ich gut, kopier die Musik der Vorbildvideos mehr eins zu eins, aber mit eigenem Stil“. Danach kam seine zweite Vorgabe zur Musik: „sehr viel näher an den Vorbildern“. Teil 1 und 2 laufen deshalb jetzt auf dem Bett **r2-eigen** (Abschnitt „Musik“).

Jeden Befund habe ich an Bildern, Schnellbögen, Einzelbildern und Messungen selbst geprüft. Bis auf zwei Zahlenangaben (siehe „Geprüft, anders gesehen“) haben sich alle bestätigt.
Behoben sind der P0, alle P1, die sich ohne neue Aufnahme beheben lassen, und die kleinen, eindeutigen P2. Neue ElevenLabs-Aufnahmen gab es keine: Kein Befund war ein Ton-P0. Die drei Erzähl-P1, die neuen Text brauchen, stehen unten als fertiger Vorschlag zum Vertonen.

Die Arbeit lief in zwei Abschnitten (dazwischen ein Neustart des Containers, Zwischenstand Commit a464b89). Vor dem Weiterarbeiten habe ich geprüft, dass der Render zum aktuellen `episode.json` passt: Shotliste neu übersetzt (bitgleich) und je Einstellung das mittlere Bild neu gerendert und mit dem vorhandenen verglichen (mittlere Abweichung 0,6–1,8 Graustufen, also nur JPEG und Korn).

## Messwerte

| | Teil 2 mit Musik (Hauptfassung) | Teil 2 ohne Musik | Teil 1 mit neuer Musik |
|---|---|---|---|
| Lautheit nach AAC | −14,05 LUFS, −1,82 dBTP, LRA 2,5 LU | −14,06 LUFS, −1,77 dBTP, LRA 2,8 LU | −14,05 LUFS, −1,84 dBTP, LRA 2,7 LU |
| Hör-Check (Whisper `small` auf dem MP4) | 1 Wortfehler: „lay“ als „laid“ (WER 1,4 %) | ebenso | 0 Fehler |
| Untertitel zum Wortbeginn | Median −0,003 s, p90 0,027 s, höchstens 0,053 s | – | Median 0,00 s, p90 0,02 s, höchstens 0,047 s |
| Dauer | Stimme 85,79 s, PART 3 ab 85,93 s (0,14 s nach dem letzten Wort), Video 86,93 s | gleich | Stimme 86,12 s, Video 87,27 s |
| Bild | Helligkeit Median 86,6 ohne Kriechkeller (gesamt 84,9); Keller im Mittel 71,1 mit 36,6 % fast schwarzen Pixeln (vorher 96 und 9,2 %); kleinste Streuung 14,1 (Leerbild-Tor ≥ 12); Kantendichte 14,9 % (vorher 13,8) | gleich | unverändert |
| Musik unter der Stimme | Hook 9,1 LU, normal 11,4–12,1, voll 10,7, dünn etwa 14 (nur 1,7 s lang) | – | Hook 9,4 LU, normal 12,0–12,1, voll 11,1, dünn 13,2 |
| Musik leiser als −50 LUFS am Stück | 0,6 / 0,6 / 0,5 / 0,4 s (vorher 14 s im Finale) | – | 0,4 / 0,5 s (vorher 3,5 s) |
| Stimmen (Grundton, Median) | Erzähler 125 Hz, June 130 / 164 / 154 Hz, Odell 158 Hz (vorher 200), Tess 237 Hz, Mister Hundred 96 Hz | | |
| `pruefen.py` | Exit 1, nur wegen „lay“ | | Exit 0 (`pruefung-musik-neu.json`) |

Tore der Shotliste: alle Regeln erfüllt, 62 Einstellungen mit Endkarte, Schema ok. Kopf-oben-Regel im Schnellbogen: alle Gesichter höchstens 30° geneigt.

## Musik: r2-eigen

Linus will die Musik „sehr viel näher an den Vorbildern“. Der Nachbau r2-v2 (Spieluhr aus dem Vorbild mit 7,3 Mio. Aufrufen) ist nah, folgt der Vorlage aber Achtel für Achtel. Unser eigener Fingerabdruck stuft ihn als „dasselbe Stück“ ein, das wäre ein Urheberrechts- und Stummschalt-Risiko. Deshalb habe ich vor dem Einsatz eigene Begleitfiguren in **allen acht Takten** gesetzt (`engine/musik-v2/analyse/eigene_figuren.py`, Noten in `muster/spieluhr-eigen.json`, Stil `r2-eigen` in `bauen.py`):

- **Gleich wie die Vorlage:** Akkordfolge I – vi7 – vi – bVI+ zweimal, 111,7 BPM, Schleife 17,19 s, Register E4–E6, Celesta, Hall, Leiern, Verstimmung +46 Cent, Klang-EQ, Dichte und Lage der Oktav-Verdopplungen.
- **Eigen:** Reihenfolge der Arpeggien an 1–2 Stellen je Takt (Wendungen, fallender Beginn, Bogen 4+4 statt 3+3+2), eigene Linien und Umkehrungen, Haltetöne, eine eigene Oberstimme (Wiegenlied in halben Noten), eigene Akzente mit höchstens 2,6 dB Streuung.

| Fassung | Fingerabdruck gegen die r2-Schleife | Urteil | Chroma fest | Spektrum |
|---|---|---|---|---|
| r2-eigen normal | 0,733 / z 4,1 | kein Treffer | 0,765 | 5,9 dB |
| r2-eigen dünn | 0,724 / z 3,9 | kein Treffer | 0,767 | 5,6 dB |
| r2-eigen voll | 0,636 / z 3,3 | kein Treffer | 0,685 | 7,1 dB |
| r2-v2 (Abschrift, nicht verwenden) | 0,828 / z 4,6 | Treffer | 0,866 | 4,8 dB |

Treffer heißt Ähnlichkeit ≥ 0,78 und z ≥ 4,5. Zum Vergleich: fremde Stücke liegen bei 0,55–0,61, der erste eigene Nachbau v1 bei Chroma 0,57. Gegen die r5-Schleife: 0,625 / z 3,5. Tempo, Schleifenlänge und Stimmung messen gleich wie die Vorlage. Wie weit weg die Figuren sein müssen, habe ich in Stufen gemessen: Nur die Lage zu ändern bleibt ein Treffer (0,83). Ganz fremde Figuren landen bei 0,575, so weit weg wie ein fremdes Stück, und der Stil ist weg. Mehr dazu in `engine/musik-v2/LIZENZEN.md`.

Einsatz in beiden Teilen (`engine/musik/spannung/hiding-night-teil{1,2}.json`, neu `"quelle": "musik-v2"` in `spannung.py`):
- Flach wie r5: normal 12 LU unter der Stimme, Hook 2,5 dB lauter.
- voll erst im Schlussblock (Teil 2 ab der Luke).
- dünn nur kurz nach der Pointe bzw. nach Mitternacht.
- Kurze Wegfälle vor den Pointen (1,1–1,3 s), jeder mit eigenem kurzem Nachhall, damit die Spieluhr nicht abgeschnitten klingt.
- Ganz still wird es erst nach „Ready?“, dort klingt nur der Hall aus.

Nebenbei gefunden und behoben: Die Schleifendateien von musik-v2 hatten an der Naht einen Sprung von einem Abtastwert (auch r2-v2). fluidsynth setzt Noten auf Ticks und 64er-Blöcke, deshalb lagen Vorlauf und letzte Schleife leicht verschoben. `bauen.py` blendet jetzt die letzten 50 ms in den Vorlauf über. Danach: Sprung 0,006 statt 0,075, Hochton an der Naht 7,0-fach statt 24,6-fach (Anschläge bis 10,9).

## Behoben

### P0

| Befund | Geprüft | Behoben durch |
|---|---|---|
| Elis liegendes Gesicht steht im Höhepunkt auf dem Kopf (E50, E53, E58, E59): Brauen als Lächeln, Schreckmund als Punkt auf der Stirn | bestätigt; die neue Prüfung maß 157–166° Neigung, dazu Junes Gesicht in E51, E52, E54 mit 56–62° | `ROLL_LIEGEN` −90 statt +70. **Neue Kopf-oben-Regel** in der Kompositionsprüfung (`render.mjs --schnellbogen`): Für jedes sichtbare Menschengesicht darf der projizierte Vektor Kopfmitte → `ueber_kopf` höchstens 30° von „oben“ abweichen, sonst bricht der Schnellbogen mit Fehler ab. Junes Nahaufnahmen von der Fußseite des Betts. Alle 62 Einstellungen bestehen; in den fertigen Bildern bei 72,0 / 80,2 / 82,0 s liegen die Haare oben, das Kinn unten |

### P1 Bild

| Befund | Geprüft | Behoben durch |
|---|---|---|
| Kriechkeller warm und gemütlich (Median 96, heller als der Rest) | bestätigt: `innen_warm` mit Himmel-/Bodenlicht 2,4 | Eigenes Preset `kriechkeller` in `src/licht.js`: Füll-Licht 0,55 kühl blaugrau, das warme Hauptlicht fällt nur durch die Fugen, Taschenlampe als Punktlicht mit Kegel. Fugen 4,2 statt 3 cm. `pruefen.py`: Keller zählt nicht zum Median, Untergrenze 22 je Einstellung. Ergebnis: Mittel 71 statt 96, fast schwarz 37 % statt 9 %. Die dunkle Strecke in r2 (25–30) ist das noch nicht, siehe offen |
| „bent“ und „Ready?“ zeigen keine Bedrohung | bestätigt; zudem standen die Füße längs der Fugen | Monster steht quer zu den Fugen; Sohlen mit vier Zehen. E57: Auf „bent“ biegt sich die Mitte sichtbar 10 cm durch, dazu feiner Staub. E61: Auf „One“ wird es oben dunkel, auf „Ready?“ gleiten vier Fingerschatten quer über die Fugen, die Spitzen glimmen kalt, in 0,2 s spreizen sie sich. Kein Finger kommt durch (bleibt für Teil 3) |
| Junes Atem auf „stopped“ fehlt, Gesicht angeschnitten (E52, E54) | bestätigt | Ganzes, aufrechtes Gesicht von der Fußseite des Betts; weißer Atem über den Lippen (bei 73,9 s im Bild) |
| E40 beginnt 0,85 s in einer Fläche | bestätigt: Die Fahrt startete in der offenen Fahrertür | Kamera aus der Endkadrierung (Owens Stiefel ab dem ersten Bild). **Neues Leerbild-Tor** in `pruefen.py`: kein Bild mit Streuung unter 12 in den ersten 0,5 s einer Einstellung |
| Hook liest sich als Kerzen, Auge eine Sichel | bestätigt | E01 beginnt 0,6 m vor dem offenen Auge (etwa 25 % der Bildbreite) und zieht in 1 s auf. Fingerspitzen gedämpft, Nägel dunkel. Die Zahlenkerzen auf dem Kuchen brennen nicht |
| Monster-Pose wirkt wie Strecken/Jubeln, Mantel weiß, Farbe springt | bestätigt | Mantel `#34363f` mit schmaler kalter Kante in jeder Lichtstimmung, kurze Ellbogenspitzen. E03 groß von vorn (Hände vor dem Gesicht), E04 von der Seite |
| „June took my bag“ ohne Tasche, Köpfe angeschnitten | bestätigt | Halbnah von der Seite, beide Gesichter und der Rucksack im Bild, Greifen ohne Vorbeugen |

### P1 Ton und Musik

| Befund | Geprüft | Behoben durch |
|---|---|---|
| Musik näher an den Vorbildern (Linus) | – | Bett r2-eigen (Abschnitt „Musik“) für Teil 1 und 2 |
| Musik fehlt 14 s im Finale, 1,6 s vor dem Omen | bestätigt | Vier Wegfälle von 1,2–1,3 s (vor „side by side“, nach „Ninety-nine“, auf „No counting came from the square“, nach „Ready?“), jeder mit Nachhall. Unter −50 LUFS höchstens 0,6 s am Stück |
| Stufenpegel weichen ab (dünn 15–16 LU unter der Stimme, Hook nicht lauter) | bestätigt | Flach wie r5: normal 12 LU, voll 10,7–11,1, dünn 13–14, Hook 9,1–9,4 LU. Die Stufen unterscheiden sich über die Instrumente (dünn ohne Oberstimme und Verdopplung, voll mit tiefer Zinke und Streichern) |
| Odell klingt höher als June | bestätigt (200 Hz) | −5,5 statt −1,5 Halbtöne: 158 Hz, June 130–164 Hz |
| Erzähl-P1 ohne neue Aufnahme | – | siehe „Nicht behoben“ |

### P2 (behoben)

| Befund | Behoben durch |
|---|---|
| Musik wechselt neunmal die Stufe, voll unter Odell und Tess | drei Zustände (normal, voll ab der Luke, dünn nach Mitternacht) plus kurze Wegfälle |
| Spieldose schmal, Anschlag streut | Die Wiegenlied-Spieldose ist durch r2-eigen ersetzt: Anschlagstärke 0,78–0,88 (höchstens 2,6 dB), die Akzente sitzen auf den Gruppenanfängen. Das Stereobild ist enger als in der Vorlage (siehe offen) |
| Teil 1 neu ersetzt das gelobte Bett | Teil 1 ist nur im Ton mit r2-eigen neu gemischt (`mischung-musik-neu.json`, `pruefung-musik-neu.json`). Die alte Fassung mit `klangbett-r2-a` bleibt unverändert für Linus' A/B-Vergleich (`build/folge-01/teilen/hiding-night-teil1-vorhoer.mp4`) |
| „helper too“ wird als „help or two“ gehört | Seit Odell tiefer liegt, hört Whisper „helper to“ (zählt als Schreibweise). Eine neue Aufnahme ist dafür nicht nötig |
| Regel-Glocke bei 29,7 s nimmt dem echten Schlag die Wirkung | leise (−22 dB) und dumpf (Tiefpass 900 Hz), Zählschlag dort ebenso; E23 entsättigt wie eine Rückblende |
| Fake-out nach dem Vorhang | ein langsames Klopfen ans Glas direkt nach „shut“: Das Monster tut etwas, bevor der Garten leer ist |
| Untertitel auf dem Gesicht in Nahaufnahmen | Kompositionsprüfung prüft jetzt auch die Augen; E58 zielt auf die Augen |
| Schuhe „kicked apart“ zu ordentlich | neue Ordnung `getreten`: ein Schuh auf der Seite, etwa 120° gedreht, 0,75 m auseinander |
| E05 nur Vorhang | hinter Elis Schulter: erst die Hände draußen im Fenster, nach dem Zuziehen Elis Kopf und Hand am Vorhang |
| E15 Händeschütteln, Zucken aus dem Bild | Zucken auf 35 %, Kamera auf Kopfhöhe, weißer Atem auf „cold“ |
| Junes Füße wie Hausschuhe | Schuhart `barfuss`: flacher Fuß in Hautfarbe mit fünf Zehen |
| Elis Jacke schwarz auf der Treppe | Füll-Licht vom Treppenfenster in E12 |
| E26 June nur Schulter, E37 Hinterkopf | E26 über Odells Seite auf Junes Gesicht; E37 Eli am Bett mit Taschenlampe, Dreiviertel |
| Glocke nie zu sehen | offene Schallluke zur Straße; E55 zeigt Uhr und schwingende Glocke |
| E34 Schild vor der Linse | Kamera vom Schild weg |
| Menge dünn | fünf weitere Erwachsene, „Nobody laughed“ mit zwölf Figuren in drei Reihen |
| Monster seltener als berichtet | Schnellbogen zählt nur Einstellungen, in denen ein Monster-Anker im Bildfeld liegt |
| **Eigener Fund:** „IT NEVER“ (Junes Zeile) und „NO“ erschienen 0,36 bzw. 0,47 s vor dem Wort | Whisper hatte beide Wortanfänge nach einer Pause in die Stille gelegt (Energiekurve: June beginnt bei 58,52 s, „No“ bei 75,91 s). `pruefen.py` sah das nicht, weil es mitten im Satz ebenfalls mit Whisper misst. Wortzeiten in `timing.json` korrigiert (`korrekturen`), Shotliste neu: E42/E43 und E55/E56 schneiden jetzt aufs Wort und sind neu gerendert (196 Bilder). Jetzt höchstens 0,053 s Abstand |

## Nicht behoben

### Erzählung (P1, braucht neuen Text und damit eine neue Aufnahme)

Die Aufgabe erlaubt neue Aufnahmen nur bei einem Ton-P0. Ohne Aufnahme lassen sich diese drei P1 nicht ehrlich beheben. Wörter aus der Aufnahme zu schneiden hätte die Mitte nur um etwa 2,5 s gekürzt und an den Schnitten die Satzmelodie gebrochen. Ich habe deshalb nichts an der Stimme geändert und den Text fertig vorbereitet.

| Befund | Bestätigt | Vorschlag (Linus entscheidet) |
|---|---|---|
| Mitte 20,6–46,6 s ist Erklärung ohne Ereignis (26 s) | ja: neun Sätze Regeln und Figuren, keine Steigerung | Auf etwa 15 s straffen und die gewonnene Zeit für eine Steigerung im Haus nutzen (Text unten) |
| Ohne Teil 1 versteht man die Entscheidung nicht (Owen, Dad, Versteckregel) | ja: „hide until sunrise“ fällt nie, Owen und Dad werden nicht erklärt | je ein Halbsatz Kontext (unten) |
| „I climbed in anyway“ kostet Eli Sympathie | ja | June erzwingt die Entscheidung (unten) |

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

Aufwand: Den ganzen Teil in einem Take neu aufnehmen kostet etwa 1.600 Zeichen, mit zwei Takes ≈ 3.200 Credits wie beim ersten Mal. Nur die geänderten Sätze einzusetzen (≈ 650 Zeichen, ≈ 1.300 Credits für zwei Takes) wäre billiger. Tonfall und Raum der einzelnen Takes passen aber selten nahtlos. Danach müssen Wortzeiten, Shotliste und Render neu laufen (etwa 25 min Rechenzeit). „It takes whoever helps.“ ist nicht mehr wegen Whisper nötig, aber als Kernregel klarer.

### Umgesetzt am 16.11.2026: Neuaufnahme

Linus hat den Vorschlag freigegeben („Ja, mach alles“). Der ganze Teil ist in einem Aufruf neu vertont (2 Takes, 3.282 Credits). Gewählt ist Take 1, die Gründe stehen in `stimme.json`. Das Ergebnis: 291 Wörter, 44 Sätze, Stimme 89,62 s, Hook 4,90 s. Die Mitte (jetzt Sätze 11–20) dauert 22,0 s statt 25,5 s. Neue Satznummern stehen in `bildideen.json` unter `neuer_text`.

**Drei Abweichungen vom Vorschlag oben:**
- **Länge:** Der Vorschlag hätte nach Zeichen gerechnet etwa 93 s gedauert. Deshalb sind gestrichen: „Everyone knows“, „, like every birthday“, „Then“ vor „Odell looked at June“, „Nobody laughed.“, „in the hall“ und „for the woods“. „I packed“ und „While I packed, …“ sind zu einem Satz verbunden.
- **Luke:** Satz 33 des Vorschlags („She closed the hatch before I could say no.“) hätte die Luke zweimal schließen lassen, denn direkt danach kommt unverändert „The hatch closed over me, then the rug.“ Eli wäre dabei nie hineingekommen. Jetzt steht dort *She pushed me in before I could say no.*
- **Mitte:** Die Mitte ist nur um 3,5 s kürzer, nicht um 11 s. Die gewonnene Zeit steckt im Kontext (Owen, Dad, sechs Stunden) und im Klopfen.

**Neu im Werkzeug:** `phrasenanfaenge_nachziehen` in `engine/ton/stimme.py`. Whisper legte das erste Wort nach einem Satzzeichen oft in den Block davor, etwa „Then“ in den Block von „Ninety-nine.“. Untertitel und Schnitte wären so 0,3–0,5 s zu früh gekommen. In der neuen Spur sind 11 Wörter korrigiert. Auch die alte Spur hatte 7 solche Fälle trotz der Hand-Korrekturen; sie ist mit dem neuen Ton ohnehin ersetzt.

**Prüfbogen** (`docs/trends/geschichten-regeln.md`) für den neuen Text:

| # | ja / nein | Wert |
|---|---|---|
| 1 | ja | Auslöser „at eighteen“, Preis „takes you“, Regel „hide“. 18 Wörter in 4,90 s (A2 für Teil 2: ≤ 5 s) |
| 2a | ja | Eli 18, Tess 18, June 24 (Rückblende 18), Odell 74, Menge 20–70 |
| 2b | ja | 18. Geburtstag |
| 3 | ja | Hände immer vor dem Gesicht. Groß im Bild: Auge im Fingerspalt (Satz 1), Knöchel an Junes Scheibe (Satz 22), Fingerschatten (Sätze 23, 43–44) |
| 4 | nein, begründet | Linus: Hiding Night bleibt drei Videos, Teil 2 hat 89,62 s. Die 120–170 s gelten für die neuen Einzelgeschichten |
| 5 | teilweise | Regel (Sätze 1, 10, 12–14, 16), Antwort auf den Hook (es weiß, wo er liegt: Satz 40), Pointe: etwas anderes zählt Junes Zählen zu Ende (Satz 42). Dazu ein Cliffhanger, weil es ein Serienteil ist |
| 6a | für Teil 2 nicht anwendbar | Die Wendung liegt im Finale (A3). Echos im Teil: 1 → 40, 33 → 42 |
| 6b | ja | Der Schutz (Junes Zimmer, ihr Zählen) wird zur Gefahr |
| 7 | ja | *Would you hide under June's room?* (6 Wörter, Bildunterschrift) |
| 8 | ja | r2-eigen im Render. Anker in `bildideen.json`, Sekunden in `stimme.json` (`timing.musik_anker_s`) |
| 9 | ja | keine Minderjährigen, kein Blut, „pushed me in“ ohne Gewalt, nur eigene Figuren |
| 9b | ja | Dad schützt June |
| 10 | ja | Mister Hundred, Hiding Night (Websuche 15.11.2026, `folge-01/praemissen.md`) |

**Offen für den Neubau:** Diese Dateien gehören noch zur alten Aufnahme und müssen neu gebaut werden:
- `regie.mjs` hat noch die alten 46 Satzschlüssel. Neue Einstellungen fehlen: 22:something, 23, 25:his shoes, 26:who hid her, 31, 31:before.
- `episode.json`, `untertitel.*`, `effekte.json`, `mischung.json` und `pruefung.json` stammen ebenfalls aus der alten Aufnahme.
- `engine/musik/spannung/hiding-night-teil2.json` muss auf die neuen Satznummern und Sekunden umgestellt werden.

Bis dahin schlagen die beiden Folge-2-Tests in `engine/test/shotliste.test.mjs` fehl, weil `regie.mjs` Schlüssel nennt, die es nicht mehr gibt.

### Bild (P2, offen)

- **Kriechkeller-Helligkeit:** Der Keller hat im Mittel 71 statt 96, die dunkle Strecke in r2 liegt aber bei 25–30. Das Licht sitzt noch warm auf den Dielen-Unterseiten. Ein weiterer Schritt wäre, die Unterseiten nur von der Taschenlampe beleuchten zu lassen.
- **Sohlen auf „bent“ (E57):** Die Dielen biegen sich sichtbar, aber die Sohlen lesen sich als regelmäßige dunkle Unterbrechungen der Lichtstreifen, nicht klar als Füße mit Zehen.
- **Fingerschatten auf „Ready?“:** Man sieht vier kalt glimmende Punkte in einer Reihe in den Fugen und ein kaltes Leuchten, aber keine scharf umrissene Hand. Mehr geht kaum, ohne dass ein Finger durchkommt (bleibt für Teil 3).
- **E04 (Monster von der Seite):** Im Ganzbild wirkt die schmale dunkle Gestalt mit hellem Kopf fast wie eine Laterne.
- **Monster im Mittelteil:** Der Schnellbogen zählt 9 von 62 Einstellungen (14,5 %), darunter E57 und E61, in denen nur Sohlen bzw. Fingerspitzen durch die Fugen zu sehen sind. Die Lücke zwischen 34 und 77 s bleibt. Mit der Neuaufnahme oben passt das Klopfen an Junes Fenster als echter Monster-Beat.
- **E15:** Das Greifen liest sich eher als Faust an Hand als ein Griff ums Handgelenk.
- **E34:** Das Schild ist weg, die oberen Fenster der Häuserzeile stehen aber nicht im Bild.
- **Kompositionsprüfung:** 16 von 62 Einstellungen haben die Hauptsache außerhalb des mittleren Drittels, meist Untersichten im Keller. Das ist nur eine Warnung. Kein Gesicht, kein Mund und kein Auge liegt im Untertitel-Streifen.

### Ton (offen)

- **Hören:** Linus' Ohr entscheidet über r2-eigen gegen das alte Bett (A/B mit Teil 1), über Odell mit −5,5 Halbtönen (klingt er noch natürlich?) und über die kurzen Wegfälle. Ich habe gemessen, nicht gehört.
- **„lay“:** Whisper hört „lay“ in beiden Fassungen als „laid“. Das ist der einzige Grund für Exit 1 in `pruefen.py`, laut Kritik unkritisch.
- **Stereobild:** r2-eigen ist enger als die Vorlage (Seite/Mitte −9,4 dB, Vorlage −6,8). Der Hall ist unverändert, die Figuren selbst klingen schmaler.
- **Teil 3:** Für Teil 3 bräuchte r5 dieselbe Behandlung wie r2-eigen.

## Geprüft, anders gesehen

- **„Monster in 7 von 61 Einstellungen“:** Die neue Zählung im Schnellbogen ergab für den alten Stand auch E57 und E61, weil die Füße oben im Bildfeld liegen, aber hinter den Dielen verdeckt waren. Die Kritik hat recht: Sichtbar waren sie nicht. Die Zählung prüft keine Verdeckung.
- **„Odell 200 Hz“:** Jetzt selbst nachgemessen (pyin auf der Mischung). Mit −4,5 Halbtönen waren es 166 Hz, also nicht mehr höher als June, aber auch nicht tiefer. Deshalb jetzt −5,5 Halbtöne: 158 Hz.
- **„helper too liegt an der Aufnahme“:** Stimmt nur zum Teil. Mit der tieferen Odell-Stimme hört Whisper das Wort richtig.

## Teilen-Fassungen

H.264 crf 21, höchstens 6 Mbit/s, 1080 × 1920, 30 fps, Ton unverändert kopiert (AAC 192 kbit/s):

- `build/teilen/hiding-night-teil2.mp4`: Hauptfassung mit Musik, 53 MB, 86,93 s, −14,05 LUFS, −1,82 dBTP
- `build/teilen/hiding-night-teil2-ohne-musik.mp4`: für einen Sound aus der TikTok-Bibliothek, 53 MB, −14,06 LUFS, −1,77 dBTP
- `build/teilen/hiding-night-teil1-musik-neu.mp4`: Teil 1 mit r2-eigen, Bild unverändert, 55 MB, 87,27 s, −14,05 LUFS, −1,95 dBTP

Zum A/B-Vergleich liegt die alte Musik von Teil 1 unverändert in `build/folge-01/teilen/hiding-night-teil1-vorhoer.mp4`. Ist Teil 1 schon online, dort bitte nichts tauschen.
