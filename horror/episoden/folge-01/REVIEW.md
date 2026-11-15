# Review Folge 1 „Hiding Night“, Teil 1

Stand 15.11.2026. Grundlage: 27 Befunde aus zwei Kritiken (Bild und Erzählung/Ton) zum Render vom Commit 7b7dbdf.
Alle Befunde habe ich an Bildern, Schnellbögen und Messungen selbst geprüft.
Behoben sind alle P1 und die kleinen, eindeutigen P2. Neue ElevenLabs-Aufnahmen gab es keine: Kein Befund war ein Ton-P0.

Einstellungsnummern: Die Kritik zählt E01–E57. Weil „I promise“ jetzt eine eigene Einstellung hat, heißen E50–E57 der Kritik im neuen Render E51–E58. Unten stehen die alten Nummern, die neuen in Klammern.

## Messwerte

Gemessen auf dem fertigen `folge-01-upload.mp4` mit `engine/pruefen.py` (alle Tore grün, `pruefung.json`). Die Bildwerte sind dieselben Kennzahlen wie in der Kritik (108 × 192, Graustufen, Inhalt ohne Endkarte).

| Wert | vorher | jetzt | r2 / r5 |
|---|---|---|---|
| Bildhelligkeit, Median | 55 | **87,8** (Tor ≥ 85) | 102 / 106 |
| Bildhelligkeit, dunkelstes Zehntel (P10) | 20 | **65,6** | 48 / 40 |
| fast schwarze Bilder (Mittel < 30) | 26 % | **0 %** | 8 % / 8 % |
| dunkelste Einstellung (Mittel) | 7 (E10) | **58,9** (E56, Elis Reaktion in kalter Dämmerung; Tor ≥ 35) | – |
| schwarzer Balken, größte Breite | 34 % | **0 %** (Tor ≤ 10 %) | – |
| Kantendichte, Median | 9,2 % | **15,6 %** | 16,5 % / 13,3 % |
| Effekte über 300 Hz gegen die Stimme | −34 bis −42 dB | **−24 bis −28 dB** | – |
| Effekt-Cues | 23 | **11** | 4 / 11 |
| Junes Tonhöhe (F0-Median S29/S30/S31) | 140/146/160 Hz | **162/174/185 Hz** | Dialog 227–262 Hz |

- **Dauer:** Stimme 86,12 s (Ziel 70–90 s), Endkarte „PART 2“ ab 86,267 s, also 0,147 s nach dem letzten Wort, 1,0 s ohne Ton. Video 87,267 s, 2.618 Bilder.
- **Format:** beide MP4 H.264 High, 1080 × 1920, 30 fps, yuv420p BT.709, AAC 192 kbit/s Stereo; 154,9 MB (Upload) und 155,0 MB (Vorhör).
- **Ton nach AAC:** Upload −14,05 LUFS, −1,80 dBTP, LRA 3,0 LU. Vorhör −14,05 LUFS, −1,84 dBTP, LRA 2,7 LU. Die Begrenzer-Decke liegt bei −1,8 dBFS für beide Fassungen (vorher −3,23); der Begrenzer regelt höchstens 0,35 dB ab. Effekte K-gewichtet 8,6–11,0 LU unter der Stimme.
- **Hör-Check** (faster-whisper small auf dem MP4): Upload und Vorhör je 0 Wortfehler und 0 Einschübe bei 290 Wörtern (vorher ein eingeschobenes „mister“). Unsicher, aber richtig erkannt: „Nobody“ p 0,11, „ready“ 0,07, „Six“ 0,05.
- **Untertitel:** 179 Einblendungen, 109 mit zwei Wörtern, 96 px, breiteste 807 px. Alle erscheinen auf ihrem geplanten Bild; Abstand zum Wortbeginn im MP4-Ton: Median 0,00 s, p90 0,02 s, höchstens 0,047 s.
- **Messtor** (`shotliste.mjs`): alle Regeln einschließlich der neuen M13 erfüllt. 58 Einstellungen plus Endkarte, Median 1,40 s, 40,3 je Minute, 14 Akzentfahrten, 3 Snap-Zooms, Monster in 24,1 %. Kompositionsprüfung 57 von 57 ohne Verstoß. `npm test`: 19 von 19.
- **Bilder angesehen:** Schnellbögen nach jeder Änderung (59 Bilder, 270 × 480), der Bogen mit 30 Bildern aus dem MP4 (`render-bogen.jpg`) und Vollbilder bei 0,0 / 2,2 / 21,9 / 84,6 / 85,9 / 86,8 s. Keine schwarzen, einfarbigen oder eingefrorenen Bilder, keine Dekodierfehler.

## Behoben

### P1

| Befund (Kritik) | Geprüft | Behoben durch |
|---|---|---|
| Schwarze Pfosten vor der Linse (E03, E12, E21, E31, bis 34 % Breite) | bestätigt: Wisch-Objekt der Seitenfahrt, `#101318`, 1,3–1,5 m vor der Kamera | `vordergrund: false` in allen vier Seitenfahrten. Neue Messtor-Regel M13 (kein Wisch-Objekt unter 1,5 m; der Standardpfosten von `truck_side` zählt mit) mit Test. Mindest-Grundhelligkeit 0,02 linear in `ctx.mat`. Balken-Tor in `pruefen.py`. Dazu E14 (Verandapfosten unter der Kamera) in den Vorgarten verlegt |
| Nacht viel zu dunkel (Median 55, 26 % fast schwarz) | bestätigt: Mond-Key von hinten, Füll-Licht schwach | Preset `nacht` etwa +1 Blende (Himmel/Boden 1,3 → 2,3, Mond 1,5 → 2,6, Kante 0,6 → 1,4, Belichtung 1,2 → 1,4, hellerer Horizont und Nebel), 80 % statt 55 % warme Fenster. E40/E41 (Rückblende, Luke) eigens aufgehellt. Helligkeits-Tor in `pruefen.py`: Median ≥ 85, keine Einstellung < 35 |
| Monster flach, schwarze Strichfigur, Hände wie Krone | bestätigt | Mantel `#5B5E6C` mit Stofftextur statt fast schwarz, Kantenlicht im Shader (Fresnel, türkis), Arme 0,15 → 0,24 m, Hände 0,30 → 0,42 m mit Daumen, gekrümmte und gefächerte Finger, glimmende Fingerspitzen, Grundglut zwischen den Fingern. E16 von schräg vorn unten: Die Hände lösen sich, kaltes Licht bricht hervor (neue Animation `leuchten`), das Gesicht bleibt verborgen |
| Hook-Bild schwach (dunkel, Monster 25 % hoch, Kuchen 1,2 s) | bestätigt | E01: Untersicht, Monster etwa 60 % der Bildhöhe, vom Mond angestrahlt vor Uhrturm, Push-in 12 %/s, kein Eli-Klumpen mehr. E01 läuft jetzt bis „turn“ (1,27 s), der Kuchen nur noch auf „eighteen“ (0,8 s, Push 12 %/s). Impact mit Mitten-Anteil auf „eighteen“ |
| Hook greift erst bei 3,84 s, kein Effekt bis 5,9 s | bestätigt | Bild und Impact wie oben. Das Bedrohungswort lässt sich ohne neue Aufnahme nicht vorziehen (siehe Verworfen) |
| Schuhe lesen sich nicht als Schuhe; E23 unscharf; E30 schwarz auf dunkelrot | bestätigt; E23-Ursache gefunden: Der Compiler gab bei einem Punkt als Hauptsache dessen x-Koordinate (−11,25) als Fokusabstand | Eigenes Schuhmodell `baueSchuhDetail` (Sohle, flache Zehenkappe, höhere Ferse, Rist mit Schnürung, dunkle Öffnung mit Polsterrand, Fersenkappe, Streifen), schlank, kontrastreiche Farben. Fokus auf Punkte in Compiler, Engine und Schema. E30 helle Sitzbank, mehr Licht, glänzende Stiefel mit Kantenlicht. E18 und E43 im Dreiviertelprofil statt von oben |
| Gegenstands-Bilder ohne Information (E24, E29, E41, E42) | bestätigt | E24: Schranke, Schild „DEAD END“, ein junger Mann rennt hin und bleibt stehen. E29: Pick-up von vorn, Scheinwerfer an, Dampf steigt hinter dem Führerhaus auf. E41 aufgehellt. E42 Kamera vom Lukendeckel weg |
| Gesichter fehlen an Schlüsselstellen (E55, E50, E38, E40) | bestätigt; E38: Die Kamera stand im Hängeschrank | E55 (E56) Dreiviertel von vorn, E50 (E51) schräg von vorn auf der Treppe, E38 von der Tischseite mit June im Dreiviertelprofil, E40 weiterer Winkel, Dads Kopf ganz im Bild |
| E35 Untertitel auf Mund und Finger, Geste zu spät | bestätigt | Odell höher und weiter kadriert, die Geste endet jetzt auf „ready“ (Anker Ende). Kompositionsprüfung: Mund nicht in y 1080–1320 (vorher 1150–1300) |
| Effekte am Handy unhörbar (unter 2 % über 300 Hz) | bestätigt | Mitten-Schicht in `sub_boom` und `zaehlschlag` (Teiltöne 200–700 Hz, Anschlag 1–3 kHz), Hochpass 35 Hz, Sub −3 dB. Über 300 Hz liegen sie jetzt 24–28 dB unter der Stimme (vorher 34–42 dB), im 0,85-s-Fenster 1–4 % ihrer Energie über 300 Hz (vorher 0,0–0,1 %), im Klang allein 6–7 %. K-gewichtet 8,6–11,0 LU unter der Stimme (Median 11,0), sie verdecken also weiter nichts |
| Kuchen zeigt in E37 „81“ | bestätigt (Kamera von der anderen Tischseite) | Zahlenkerzen quer gestellt und von der Weltseite +z lesbar; Kamerapunkt `kueche_detail`, E37 und E47 schauen alle von dieser Seite. Am Kontaktbogen für E02, E37 und E47 geprüft |
| Junes Zeilen klingen wie die Erzählung | bestätigt | Rede-Abschnitt aus `untertitel.json` formant-erhaltend +2,5 Halbtöne (ffmpeg `rubberband`), −2 dB gegenüber vorher; „I promise“ hat eine eigene Einstellung mit Junes Gesicht und Mundformen. Gemessen (Autokorrelation, F0-Median): S29 140 → 162 Hz, S30 146 → 174 Hz, S31 160 → 185 Hz; die Erzählung daneben bleibt bei 137 und 164 Hz. Lautheit S29/S30 −2,7 dB, S31 −4,5 dB gegenüber vorher |

### P2

| Befund | Behoben durch |
|---|---|
| Untertitel zu klein | 96 px statt 84 px, höchstens 810 px breit (A5), Kontur 7 px |
| Pop schwingt über (134 → 88 → 100 %) | 73 → 92 → 100 % ohne Überschwingen (A5) |
| Sets zu leer | 4 weitere geparkte Autos mit Rücklichtern, Schild am Straßenende, 80 % erleuchtete Fenster. Kantendichte im MP4 15,6 % statt 9,2 % (Ziel ≥ 13 %) |
| Elis Haar schwarzer Klotz | Haar heller mit Glanz und Kantenlicht, schwaches Kantenlicht für alle Figurenteile |
| E52 Atem am Bildrand | Eli links der Mitte mit Blickraum, Dampf größer und auf „white“ |
| E36 Laternen-Bloom wie Augen | Platzlaternen in dieser Einstellung aus |
| Endkarte mit dritter Schrift | „PART 2“ in Archivo Black, türkis |
| Effekte zu dicht (23 Cues) | 11 Cues: eighteen (neu), Hundred, peeks, midnight, hundred, side by side (erstes Mal), ready, Dad's shoes, Hundred, fingers. Motor, Knarzen, Riegel, Frost, Auspusten, zweites Klopfpaar und zwei Whooshes gestrichen |
| Uhr-Blitzer bei 81,77 s | Uhrsprung ein halbes Bild vor dem Schnitt (Compiler) |
| READY verdeckt Odells Geste | siehe P1 E35 |
| Cliffhanger pastell, ohne Opfer | Ab „Mister Hundred was standing“ kalte Dämmerung (dunkleres Abendrot, hartes Gegenlicht, blaues Füll- und Kantenlicht, Kontrast 1,14). E56 (E57) über Elis Schulter durch den Fensterrahmen. In E57 (E58) spreizen sich die Finger auf „fingers“ |
| Slender-Man-Nähe | Kräftigere Glieder, grauer Mantel mit ausgefranstem Saum, große Hände mit Glut; der glatte Hinterkopf wird nicht mehr freigestellt (E16 von vorn) |
| Gemeinsame Begrenzer-Decke (Render-Bericht) | Decke je Fassung getrennt in `fertigen.py`/`mischen.py` |

## Verworfen

| Vorschlag | Grund |
|---|---|
| Auge und Fingerglut in Türkis statt Bernstein | Das bernsteinfarbene Auge ist Junes Auge (serie.md: Twist in Teil 4, „Junes Gesicht … mit dem bernsteinfarbenen Auge aus Teil 1“). Die Fingerspitzen und die Glut leuchten jetzt türkis, das Auge bleibt |
| Hook neu vertonen, Bedrohungswort vor 2,5 s | Neue ElevenLabs-Aufnahme nur bei Ton-P0. Das Skript ist von Linus abgenommen; das Bild greift jetzt ab Bild 1 (Monster groß, Impact bei 1,27 s) |
| Satz 11 und 19 neu erzeugen („Nobody“, „ready“) | kein P0; der Hör-Check auf dem MP4 hat 0 Wortfehler. Bleibt als Ohr-Prüfung offen |
| Satzpausen auf 0,25 s kürzen | liegt in der format-spec (0,35 s) und nahe r2 (0,42 s); spart 2 s, verlangt aber neue Wortzeiten und Schnitte |
| Nur betroffene Bereiche neu rendern | Licht, Materialien, Monster und Schuhe ändern fast jede Einstellung. Die Engine kann Bereiche (`--von/--bis`), hier war ein voller Render sinnvoller |

## Offen

1. **Ohr-Prüfung durch Linus.** Ich kann nichts anhören, alles ist gemessen:
   - ob die Mitten-Schicht von Sub-Boom und Zählschlag am Handy hörbar ist (über 300 Hz jetzt 24–28 dB unter der Stimme) und ob sie auf Ohrhörern zu dumpf klingt;
   - ob Junes Zeilen mit +2,5 Halbtönen natürlich klingen; die Referenz-Dialoge liegen noch höher, mehr als 3 Halbtöne klingen nach Effekt;
   - „Nobody“, „ready“ und „Six“ werden sicher, aber mit niedriger Wahrscheinlichkeit erkannt. Wenn sie undeutlich klingen, Satz 11 und 19 einzeln neu erzeugen („ready“ ohne Anführungszeichen).
2. **Hook-Satz:** Das Bedrohungswort fällt weiter erst bei 3,84 s. Ändern lässt sich das nur mit einer neuen Aufnahme des ersten Satzes.
3. **Nicht im Repo, weil sie aus früheren Schritten stammen:** `engine/ton/stimme.py`, `timing.json`, `skript-teil1.txt`, `stimme.json`, `stimme.m4a`, `serie.md`, `praemissen.md`. Ohne `timing.json` laufen Shotliste, Untertitel, Mischung und Prüfung nicht. Das sollte jemand bewusst committen (ohne `stimme.m4a`, das ist Audio).
4. **Messtor-Lücken:**
   - Geprüft werden nur Wisch-Objekte der Seitenfahrten (M13), keine anderen Gegenstände nahe der Kamera.
   - Ob Gesichter verdeckt sind, wird nicht geprüft; nur der Mund darf nicht unter dem Untertitel liegen.
   - Ob die Schärfe auf dem Zielanker liegt, wird nicht geprüft. Die Ursache der Unschärfe in E23 ist behoben.
   - Am Bild gesehen: In E50 (E51) verdeckt das Treppengeländer Elis Gesicht teilweise.
5. **Look:** Das Monster bleibt schlank, weil serie.md „dünn wie ein Zaunpfahl“ verlangt. Die Abgrenzung zu Slender Man kommt aus Händen, Glut, Mantelsaum und weißen Füßen. In Bildunterschrift und Hashtags „faceless“ und „slender“ vermeiden.
6. **Klangbett der Vorhör-Fassung:** Der Generator (`betten.py`) liegt weiter nur im Scratchpad; `mischung.json` hält die sha256 fest.
7. **Größe:** Die MP4 sind 155 MB groß, weil das Filmkorn Bitrate braucht. Hakt der Upload vom Handy, in `fertigen.py` crf erhöhen oder maxrate senken.

## Renderzeiten und Kosten

| Schritt | Zeit |
|---|---|
| Schnellbögen 270 × 480 (Kontrolle nach jeder Änderung, 11 Läufe) | je etwa 10 s |
| Vollrender 1 (neues Licht, Monster, Schuhe, Regie) | 959,6 s |
| Vollrender 2 (Nacht nochmals heller, Median erst 77,3) | 944,4 s |
| Teil-Render von 9 Einstellungen mit `--bilder` (419 Bilder; Median 82,7 → 83,6) | 176 s |
| Vollrender 3 (Belichtung 1,08 im Look; Median 87,8) | 933,3 s |
| Teil-Render E42 (54 Bilder, Kamera auf die andere Seite der Luke) | 25 s |
| `fertigen.py` je Lauf (Bild kodieren 126–131 s) | 164–172 s |
| `pruefen.py` je Lauf (Whisper auf zwei MP4) | 116–125 s |

- Der letzte Vollrender lief mit 2.618 Bildern bei 1080 × 1920, 2 Prozessen und JPEG 0,95: 0,357 s je Bild effektiv, 0,608 s je Bild und Prozess. Das sind 10,7 min Rechenzeit je Minute Video, so viel wie vor dem Review.
- Insgesamt liefen etwa 51 min Render, 11 min Fertigen und 8 min Prüfen.

**Kosten:**
- ElevenLabs: 0 Credits, es gab keine neue Aufnahme.
- Keine Käufe, keine Konten.
- Keine neuen fremden Assets: Schuhe, Autos, Schild und Endkarte sind im Code gebaut, die Schrift Archivo Black lag schon bei. `assets/LICENSES.md` ist unverändert.

**Dateien:**
- `horror/build/folge-01/folge-01-upload.mp4` und `folge-01-vorhoer.mp4` (nicht im Repo).
- Prüfung: `pruefung.json`, `render-bogen.jpg` (30 Bilder aus dem MP4), `kontaktbogen.jpg` (Schnellbogen des Endstands), `mischung.json`.
