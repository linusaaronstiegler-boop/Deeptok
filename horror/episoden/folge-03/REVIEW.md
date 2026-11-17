# Review Folge 3 „Hiding Night“, Teil 3 (Finale)

Stand 16.11.2026. Grundlage: zwei Kritiken (Bild; Erzählung und Ton) zum ersten Render des Finales (Commit 8ce2671), zusammen 33 Befunde zu Teil 2 und 3, kein P0. Jeden Befund habe ich an Streifen, Kontaktbögen, Probebildern und Messungen selbst geprüft; bestätigt haben sich alle. Behoben sind alle P1 und die kleinen, eindeutigen P2. Eine neue ElevenLabs-Aufnahme gab es nicht: Kein Befund war ein Ton-P0, alle Ton-Befunde ließen sich mit der vorhandenen Stimme lösen (Pausen eingefügt, Unterstimme, Effekte, Musik).

Einstellungsnummern stehen wie in der Kritik (erster Render). Ab E47 zählt der neue Render eins höher, weil „Rabbit?“ jetzt ein eigenes Bild hat.

Die Arbeit lief in zwei Abschnitten. Ein Neustart des Containers brach den ersten Lauf ab (Zwischenstand Commit 808c87d, der Render stand bei 1.081 von 4.176 Bildern). Danach habe ich Teil 3 komplett neu gerendert, diesmal in Abschnitten von 600 Bildern, damit ein weiterer Neustart höchstens einen Abschnitt kostet.

## Ergebnis

| | Finale nach dem Review |
|---|---|
| Fassungen | `build/folge-03/folge-03-mit-musik.mp4` (Hauptfassung, 246 MB) und `folge-03-ohne-musik.mp4`, je 139,2 s (2:19); Teilen-Fassungen unten |
| Shotliste (Messtor grün) | 92 Einstellungen ohne Endkarte (vorher 91; „Rabbit?“ hat ein eigenes Bild). Median 1,47 s, 39,7 je Minute, 0,70–2,43 s; 22 Akzentfahrten (im Mittel alle 6,3 s, größte Lücke 9,9 s), 3 Snap-Zooms, 1-mal Wackeln, 3 Lichtereignisse, Monster in 25 % der Einstellungen (vorher 22 %); harter Schnitt 0,15 s nach „It helps.“ |
| Render | 4.176 Bilder in 25,1 min, 7 Abschnitte zu 600 Bildern mit je 2 Prozessen (0,36 s/Bild) |
| Stimme | dieselbe Aufnahme (Adam, ×1,2); zwei Pausen zu je 0,5 s eingefügt (vor „Rabbit?“ und nach „she stopped“), 139,19 s. Keine neue Generierung, keine Credits |
| Ton nach AAC | ohne Musik −14,05 LUFS, −1,90 dBTP, LRA 2,8 LU; mit Musik −14,06 LUFS, −1,82 dBTP, LRA 2,6 LU |
| Effekte | 30 Cues (vorher 14): neu Schaben, drei langsame Klopfer, 14 Zählschläge, zwei Glockenschläge, Sub-Boom auf „my“; dazu die Unterstimme. Abstand zur Stimme 5,2 LU (Glocke) bis 17,3 LU |
| Musik (r2-eigen) unter der Stimme | Hook 9,3 LU, normal im Median 12,6 LU, voll 8,4–10,6 LU (die Stufe liegt jetzt 4 dB über normal: −21,9 gegen −25,9 LUFS), dünn 13,1 LU; nirgends näher als 8,4 LU (vorher 5,2 LU unter „Then it pulled“). Wegfälle: vor „Then it pulled back“, „away“ bis „June's face“, nach „she stopped“ (Glocke), auf „my“, vor „It helps“ |
| Untertitel | 313 Einblendungen, 84 davon bei y 1400 (Gesicht, Mund oder Hauptsache im Streifen); im MP4 gemessen: Median 0,00 s, p90 0,023 s neben dem Wortbeginn |
| Hör-Check (Whisper `small` auf dem MP4) | ohne Musik und mit Musik je 0 Wortfehler |
| Bilder | Helligkeit Median 89,9 ohne Kriechkeller, Keller im Mittel 81,3; kleinste Streuung 17,7, keine Leerbilder, keine Balken außerhalb des Kellers, längster Stillstand 0,13 s; Kantendichte 15,8 % |

## Behoben

### P1 Bild

- **Enthüllung (E60/E61, „took its hands away from its face“):** Vorher lag hinter den Händen 1,1 s lang das glatte Gesicht des Monsters, weiß ausgebrannt (17 % der Pixel abgeschnitten), dann ein harter Schnitt auf ein helles, freundliches June-Gesicht. Jetzt öffnen sich die Hände auf „away“, und dahinter liegt sofort Junes gedehntes Gesicht. Licht von unten aus Elis Lampe, wenig Füll-Licht, kaltes Kantenlicht von der Luke; eine Gesichtshälfte liegt im Schatten. Das Gesicht hat neue Züge: fahle Haut, keine Wangen, leere Augen ohne Lichtpunkt, eine Spur zu weit auseinander, und ein Grinsen über fast die ganze Breite mit Zähnen (`src/gesichter.js`, Mund `riss`). Gemessen in den Einzelbildern 85,9–89,5 s: höchstens 0,42 % der Pixel über 250 (vorher 17 % weiß abgeschnitten).
- **Lichtkegel als Glasscherbe:** Ursache war das Material. `MeshStandardMaterial` glänzt auch in Schwarz; das Punktlicht der Lampe spiegelte sich additiv auf der Kegelfläche, mit der harten Silhouette des Kegels. Jetzt sind Kegel und Lichtflecke `MeshLambertMaterial` ohne Glanz, und `weicherKegel` blendet Rand und Linsennähe aus (Taschenlampe, Keller, Turmlampe). Die haarfeinen geraden Linien waren 4 mm dünne Spinnweb-Fäden nah an der Linse (E17 bei y ≈ 1150); sie werden nicht mehr gebaut (`params.faeden`).
- **Hook (E01–E03):** Statt 1,4 s Dielen und einem schwarzen Gesicht schiebt sich ab Bild 1 der weiße Finger durch die Fuge neben Elis Gesicht. Das Gesicht ist von vorn und hell genug, Fugenschatten liegen über den Augen. Auf „sister's voice“ folgt Junes Zimmer: Sie zählt im Bett, ihr Schatten steht viel zu groß an der Wand, mit spitzen Ellbogen und der Raute vor dem Kopf.
- **Main Street (E34/E35):** Das Monster geht in der Totale die Straße hinunter und beugt den Kopf an ein oberes Fenster; auf „window“ fällt sein Schatten hinein.
- **Junes Fenster (E37) und Teil 2 E36:** Von außen lag die helle Schulter als Balken vor der Linse. Jetzt zeigen beide Folgen Junes Zimmer von innen, hinten im Fenster Kopf und Hände, das kalte Licht pulst auf dem Wort.
- **Hände (E70/E71, „the huge hands shook, and June pulled them back“):** Die Kamera liegt auf den Händen vor dem Riesengesicht; ab „shook“ zittern sie deutlich, auf „pulled“ schließen sie sich von vorn gesehen zur Raute über Junes Gesicht. Erst danach kommt Elis Reaktion.
- **Glockenseil (E32):** Der Pfeiler verdeckte das Seil, und es schwang auf die Kamera zu. Jetzt hängt es mit Kantenlicht vor der dunklen Schallluke und schwingt auf „swung“ quer zur Kamera einmal weit aus (`sets/hauptstrasse.js`).

### P1 Ton (ohne neue Aufnahme)

- **Monsterstimme:** `mischen.py` kann jetzt eine Stimme **unter** einen Redeabschnitt legen (`effekte.json` → `unterstimmen`), statt ihn zu ersetzen. Unter „One hundred. Ready, Rabbit?“ (78,66–80,51 s) zählt Mister Hundred mit: eine Kopie der unbearbeiteten Erzählerstimme, −4,5 Halbtöne, Formanten wandern mit, kurzer Hall, 12 dB unter dem Abschnitt. Das Erkennungsgeräusch aus Teil 2 kehrt damit im Höhepunkt wieder.
- **Gemeinsames Zählen (Satz 49–53):** 14 Zählschläge im Abstand von 0,9 s ab „She“ (107,12 s), je ein Lichtpuls im Bild auf demselben Raster. Ab „faint“ werden sie leiser (−14 → −17 → −19 → −20 dB) und langsamer, der letzte fällt auf „ninety-nine“. Abstand zur Stimme 11,6–12,6 LU, zum Ende 13–17 LU.
- **Sonnenglocke:** `engine/ton/einschub.py` fügt 0,5 s Stille nach „At ninety-nine, she stopped.“ ein (Rauschen der Aufnahme, −77 dBFS). Der erste Glockenschlag liegt 0,17 s nach „stopped“ (120,85 s), also dort, wo „one hundred“ käme. Erst dann sagt die Erzählung „Instead of one hundred, the sunrise bell rang“; der zweite Schlag bleibt auf „rang“.

### P2 (behoben)

- **Finger (E42/E43):** Die Spitze glimmt kalt und kommt schon auf „long“ durch die Fuge; die Einstellung ist heller. Auf „inches from my face“ liegen Fingerspitze und Elis Gesicht von vorn in einem Bild (vorher Hinterkopf).
- **Schaben:** neuer Klang `schaben` (Fingernagel über Erde) von 61,7 s an, er kommt näher und reißt auf „back“ ab; 13,9 LU unter der Stimme.
- **Klopfer:** jetzt 0,75 s auseinander statt 0,45 s (eine weitere Pause von 0,5 s vor „Rabbit?“). Im Bild rieselt bei jedem Klopfer Staub aus der Fuge und das Licht zuckt.
- **Musikstufe „voll“:** an der Luke (Satz 38–39) und bei Finger und Dielen (Satz 24–26) um 3,5 dB angehoben. Gemessen liegt „voll“ jetzt 4 dB über „normal“. Unter „Then it pulled back“ war die volle Stufe nur 5,2 LU unter der Stimme; dort fällt die Musik jetzt weg, und in der Stille schabt der Finger und reißt auf „back“ ab.
- **Rückblenden entsättigt:** Dad an der Luke, June mit 18 und Owens Pick-up (Sättigung 0,3). Dad steht halbnah von vorn an der Luke.
- **„like she was falling asleep“ (E79):** Statt der Menschen-June im Bett (Widerspruch zum Ort) sinken die Lider des Riesengesichts, die Hände halb davor.
- **„It stood up straight“ (E28):** Von hinten lagen die spitz abstehenden Oberarme als waagrechter Balken (T-Pose). Jetzt schaut das Monster zur Kamera; die Raute aus Händen und Ellbogen vor dem Kopf ist lesbar, die Kirche steht dahinter.
- **„The boards above me groaned“ (E41):** Kamera unter den Dielen, Elis Gesicht von vorn, das Durchbiegen über ihm.
- **„and I was alone“ (E84):** der leere Kriechkeller in der Totale im rosa Morgenlicht, die Luke offen.
- **Gegenstände vor der Linse:** Der weiße Ball in E17 war der Atem aus E16, der 0,6 s über den Schnitt lief. Partikel der Hauptaktion enden jetzt mit ihrer Einstellung (`shotliste.mjs`, `ueber_schnitt: true` hebt das auf). In E89 (neu E90) stehen nur noch Elis Schuhe im Bild, die anderen lagen unscharf vor der Linse.
- **Schlussbild:** Der weiße Atem steigt ab „asleep“ aus Elis Mund und steht auf „It helps“ voll vor dem Gesicht, statt 0,5 s vor dem Schnitt oben über der Stirn.
- **„my sneakers“:** leiser Sub-Boom und ein kurzer Musikwegfall auf „my“ (132,5 s).
- **Untertitel:** Liegt die Hauptsache einer Einstellung im Untertitel-Streifen (Junes Pupille in E63, die Uhrziffern in E45, Elis Augen im Hook E01; diese drei von Hand in `untertitel.json` → `ausweichen`, die übrigen 81 Einblendungen über die Kompositionsprüfung), stehen die Untertitel dieser Einstellung bei y 1400 statt 1200 (die Vorbilder setzen sie bei 1355–1370). Wörtliche Rede hat eine dickere Kontur (11 statt 7 px), damit Junes Gelb sich vom senffarbenen Pulli abhebt. Feste Paare halten Präposition und Objekt zusammen: „IN MY“ / „SISTER'S VOICE“, „ABOVE ME“, „HER BED“.

## Nicht behoben

- **Größenbezug der Enthüllung (E62, „far too big“):** Das Gesicht ist jetzt unheimlich (gedehnt, Zahngrinsen, leere Augen, Licht von unten), die Kamera fährt zurück. Ein Gegenstand, der die Größe klar zeigt, fehlt aber weiter. Probiert habe ich sechs Kamerastellungen: Über Elis Schulter liegt sein Kopf im Vordergrund und wirkt dann größer als das Riesengesicht; von der Seite steht das Gesicht kopfüber und ist nicht mehr lesbar. Besser wäre eine eigene Einstellung mit Elis kleinem Gesicht im Vordergrund unten und dem gebeugten Kopf darüber, dafür bräuchte der Kopf eine andere Stellung in der Luke.
- **Rückblick 15,3 s (Sätze 2–8):** Das bräuchte eine neue Aufnahme. Als Regel für die abgeschlossenen Geschichten festgehalten (`docs/trends/geschichten-regeln.md`, Regel 5): Rückblick höchstens 12 s.
- **Abwechslung:** Elis gestreiftes Gesicht ist weiter das häufigste Bild im Keller. Ersetzt sind der Hook, E03 (Junes Zimmer), E41, E44 und E79; die übrigen Gesichtsbilder wechseln nur in Größe und Winkel.
- **Prüfungen, die die Kritik vorschlägt:** eine Prüfung auf lange, gerade Kanten mit wenig Kontrast über Gesichtern und eine Kompositionsregel „keine Geometrie näher als 0,4 m mit mehr als 10 % Bildanteil“. Beides fehlt noch; die Ursachen (Kegelglanz, Fäden, Partikel über den Schnitt) sind behoben.
- **Satz 58 („my sneakers still stood side by side“):** klingt für Kenner der Serie fast wie Satz 57. Ohne neue Aufnahme tragen Sub-Boom und Musikwegfall die Stelle; bei einer neuen Aufnahme „…stood side by side too.“

## Prüfung

`pruefen.py` endet mit Exit 1, aus einem einzigen Grund: „SHE COUNTS“ (12,9 s) liegt laut Whisper 0,107 s neben dem Wortbeginn, die Grenze ist 0,1 s. Gemessen ist das mitten im Satz, wo nur Whisper die Wortgrenze schätzt; gegen `timing.json` liegt die Einblendung 17 ms neben dem Wort. Das ist kein Sync-Fehler.

Selbst angesehen habe ich je 18 Bilder aus der fertigen Fassung (Hook, Seil, Main Street, Fenster, Finger, Klopfer, Enthüllung, Auge, Rückblende, Hände, Zählen, Glocke, Keller allein, Schuhe, Schluss). Die 30 Bilder von `pruefen.py` liegen in `render-bogen.jpg`.

## Teilen-Fassungen

H.264 crf 21, höchstens 6 Mbit/s, 1080 × 1920, 30 fps, Ton unverändert kopiert (AAC 192 kbit/s):

- `build/teilen/hiding-night-teil3-finale.mp4`: Hauptfassung mit Musik, 79 MB, 139,2 s, −14,0 LUFS, −1,8 dBFS Spitze
- `build/teilen/hiding-night-teil3-finale-ohne-musik.mp4`: für einen Sound aus der TikTok-Bibliothek, 79 MB, −14,0 LUFS, −1,9 dBFS Spitze
