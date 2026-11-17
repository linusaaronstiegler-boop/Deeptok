# Review „Rules of Kindly“, Folge 1 „His Breath Didn't Fog“

Stand 17.11.2026. Grundlage: zwei Kritiken zum ersten fertigen Render (Commit 28afeec): eine Bildkritik (1 P0, 8 P1, 7 P2) und eine Reichweiten-Kritik (6 P1, 9 P2). Jeden Befund habe ich an den Belegbildern der Kritik, an eigenen Probebildern (`render.mjs --einzelbild`, `--skala 0.5`) und mit Messungen nachgeprüft. Bestätigt haben sich alle; drei Ursachen waren andere als vermutet (siehe „Ursachen“). Behoben sind der P0, alle P1-Befunde im Bild und in den Texten und die kleinen, eindeutigen P2. Die Stimme ist unverändert (Adam, Take 1, 141,14 s); es gab keine neue Generierung und keine Credits.

Einstellungsnummern wie in der Kritik; die Schnitte sind gleich geblieben (100 Einstellungen plus Endkarte, 142,67 s).

## Ergebnis

| | nach dem Review |
|---|---|
| Fassungen | `build/kindly-01/kindly-01-mit-musik.mp4` (Hauptfassung) und `-ohne-musik.mp4`, je 142,67 s; Teilen-Fassungen `build/teilen/rules-of-kindly-01.mp4` und `rules-of-kindly-01-ohne-musik.mp4` (crf 21, maxrate 6M, Ton kopiert, je 80 MB, Bild 4,3 Mbit/s); Paket `build/teilen/paket-rules-of-kindly-01/` neu gebaut |
| Shotliste (Messtor grün) | 100 Einstellungen plus Endkarte; Median 1,43 s, 42,5 je Minute, 0,70–2,30 s; 23 Akzentfahrten (im Mittel alle 6,1 s, größte Lücke 9 s), 3 Snap-Zooms, 3-mal Wackeln, 2 Lichtereignisse, Monster in 25 %, Endkarte 0,147 s nach dem letzten Wort, 1,5 s. Hiding Night Teil 2 und 3 kompilieren mit dem geänderten Compiler bitgleich (`cmp`) |
| Render | 4.280 JPEG (q 0,95), 2 Prozesse, 8 Abschnitte (7 × 600 + 80): 30,3 min, 0,42 s/Bild; Einzelbilder danach gelöscht |
| Stimme | unverändert (Adam, Take 1, 141,14 s); keine Generierung, keine Credits |
| Effekte | 26 Cues (vorher 23): neu Faustschlag bei 0,12 s mit Sub-Boom, Faust auf „Knuckles“, Faust auf „press“; Stampfer und Hook-Schläge auf die neuen Treffer gelegt. 7,0–16,1 LU unter der Stimme, Median 11,8 LU |
| Ton nach AAC (192 kbit/s, ohne PNS) | ohne Musik −14,05 LUFS, −2,00 dBTP, LRA 2,7 LU; mit Musik −14,05 LUFS, −2,03 dBTP, LRA 2,5 LU; Begrenzer-Decke −1,8 dBFS für beide, eine Runde |
| Untertitel | 328 Einblendungen, höchstens 17 ms neben `timing.json`; 105 weichen aus, jetzt bei y 1320 (vorher 90 bei 1400); im MP4 gemessen Median 0,00 s, p90 0,027 s |
| Hör-Check (Whisper `small` auf dem MP4) | je 3 Wortfehler wie vorher (siehe Prüfung), WER 2,6 % bzw. 1,7 % |
| Bilder | Helligkeit Median 105,4 ohne dunkle Orte (vorher 102,9), Hütte im Mittel 75,4; dunkelstes Bild 34,1; **keine Einzelbild-Blitzer** (vorher 5); kleinster Pixel-Median je Einstellung außerhalb der Hütte 37,1 (E38, Rathaus; vorher E26 1,0 und E59 2,1); **keine Balken** mehr (vorher bis 33 % in E26, E59, E62); keine Leerbilder, kein Stillstand; Kantendichte 14,2 % |
| Atem-Tor | 325 Bilder ab 82,76 s geprüft, 0 Verstöße, knappstes Verhältnis 1,16 halbe Kopfbreiten (E100); vorher 10 Verstöße in E99 (0,35) |
| Kompressions-Simulation (720 × 1280, 1 Mbit/s, 2 Durchgänge) | in Feed-Größe lesbar: Faustschlag mit Sternriss in Bild 1, matter Beschlag gegen klare Gläser, Gus' Atem im Gegenlicht und Bears fehlender Atem in E99, „0 IF“, 1,204 → 1,203 |

## Ursachen, die anders lagen als vermutet

- **Einzelbild-Blitzer (E44, E68, E80):** kein Renderer-Zustand, der sich „erst ab dem zweiten Bild einstellt“, sondern Rundung. Der Compiler schreibt Zeiten auf 4 Stellen; der Schnitt bei Bild 1889 lag bei 62,9667 s, das Bild selbst bei 62,96666… s. Die Lampen-Ereignisse am Schnitt galten deshalb erst ab dem zweiten Bild: In E44 brannte im ersten Bild noch die Rathauslampe (116 → 211 → 134), in E68 die Steglaterne über Odell. In E80 stand die Hand mit „ab start, Dauer 0,01 s“ im ersten Bild bei Fortschritt 0 und sprang im zweiten ins Bild. Behoben im Kern, nicht mit Aufwärmbildern: `regie.bildgenau` (siehe README §21.1). Die Gegenprobe am alten Video fand mit dem neuen Blitzer-Tor zwei weitere Fälle derselben Art (Bild 1214 am Beginn von E29, Bild 3978 am Beginn von E96).
- **„Knock back“ nie zu sehen (E21, E31):** Ein Hinknien mit Faustschlag aufs Eis (`ducken` + `klopfen`) habe ich gebaut und verworfen: Die Figur schwebte, der Arm erreichte das Eis nicht. Geklopft wird jetzt mit dem Stiefel, hoch aus dem Knie, mit Riss-Stern und Schnee, die ganze Figur samt Kopf im Bild.
- **Fenster (E71–E74):** Mit Klötzchenköpfen gibt es kein Profil-Zweierbild: Das Gesicht ist nur vorn aufgeklebt, von der Seite sieht man einen leeren Würfel. Gelöst ist es mit einer Kamera **draußen vor der Scheibe**: Man sieht Bears Gesicht von vorn durchs klare Glas, er haucht, das Glas bleibt klar; daneben Gus' alter, milchiger Hauchfleck als Vergleich.

## Behoben

### P0

- **E99, letztes Suchbild „we walked home across the ice“:** Gus drehte den Kopf zu Bear, seine Wolke stand 1,2 s an Bears Kinn. Neu: Die beiden verlassen die Hütte BEAR & GUS und gehen auf die Kamera zu, Richtung Stadt. Gus geht außen, 1,2 m neben Bear, Gesicht nach vorn; die Türlampe der Hütte steht hinter ihm und lässt seinen Atem im Gegenlicht aufleuchten. Bear dampft nicht.
- **Neues Atem-Tor** (`render.mjs --atemtor bear 82.76`, Ergebnis `build/kindly-01/atem-tor.json`, `pruefen.py` liest es): In jedem zweiten Bild ab 82,76 s, in dem Bears Mund im Bild ist, darf keine sichtbare Dampfwolke einer anderen Figur näher als eine halbe Kopfbreite an seinem Mund liegen. Gegenprobe am alten Stand: 10 Verstöße, alle in E99 (knappstes Verhältnis 0,35). Beim Umbau fand das Tor zwei neue Stellen, die ich ebenfalls gelöst habe: E61 (Gus zieht Bear jetzt von der Seite gesehen 1,2 m vor ihm) und E66 (im Reißschwenk lag Odells Wolke vor Bears Mund; Odell hält beim Prüfen den Atem an). Ergebnis nach dem Render: 325 Bilder, 0 Verstöße, knappstes Verhältnis 1,16 (E100).

### P1 Bild

- **Hook, Bild 1 (E01, E02, E05):** Der stärkste Moment steht jetzt im ersten Bild: von oben auf den Stiefel, darunter durch halb klares Eis die bleiche Faust; bei 0,12 s kracht sie von unten gegen das Eis (Sternriss, Schnee springt, Sub-Boom), danach tippt der Stiefel dreimal zurück. Auf „knocks“ folgt die Untersicht vom Kopfende: der ganze Körper, die Fäuste schlagen dreimal (erster Treffer 1,52 s, vorher 1,67 s) mit Wackeln und neuem Riss. Kantenlicht des Wesens kräftiger (`kante` 1,25 statt 0,75). E05 „Knuckles“: Die Faust drückt sichtbar gegen das Eis, ein Riss-Ring springt.
- **„Knock back“ (E21, E31):** siehe oben. Der Fischer stampft auf „Knock“ dreimal (Treffer 0,19/0,44/0,69 s), Lund lachend auf „knocked“ (0,23/0,53/0,83 s); Riss-Stern und Schnee je Figur, die Effekte sitzen auf den Treffern.
- **„Yours.“ (E26, E27):** Der Gesichtsaufkleber `fischer` hat jetzt Strickmütze mit Umschlag und Bommel und den braunen Vollbart des Fischers oben; der Mund sitzt wie bei ihm. Es ist erkennbar dasselbe Gesicht.
- **Gläser: beschlagen gegen klar (E13, E65, E77) und die Serienmarke:** Beschlag ist ein eigenes Material: matt grau-weiß, Tröpfchen, zwei Laufspuren, kein Glanz. Odells getragene Gläser bleiben weiß spiegelnd. E13, E65 und E77 haben denselben Bildaufbau aus Odells Blick: Die Gläser in seiner Hand auf **Mundhöhe** des Gegenübers (auf Augenhöhe las sich die gehaltene Brille als getragen). In E13 beschlagen sie über dem Mund des Fischers, in E65 und E77 sieht man durch das klare Glas Bears Mund, kein Glanzstreifen, kein Laternenkasten.
- **Bear haucht (E64):** Bear im Dreiviertelprofil von vorn, Odells Hand hält die Gläser vor seinen Mund; auf „breathed“ beugt er sich vor und haucht mit offenem Mund („besorgt/o“), es kommt nichts. Die Steggruppe steht bei Nacht 1,8 m landwärts und an der linken Stegseite: Die Laterne hängt jetzt hinter den Figuren statt 0,4 m über Bears Kopf. Gus steht hier bewusst nicht im Bild (seine Wolke lag neben Bears Kinn), sein Dampf kommt in E66–E67 groß.
- **Fenster (E71–E74):** siehe oben. Neues am Set `huette_innen`: klare, durchsichtige Mitte mit Frost am Rand, Fenster höher (Mitte 1,50 m), keine Mittelsprosse, alter Hauchfleck.
- **Deckel (E97):** schräg von oben auf das Loch: Im klaren Eis liegt Bears Gesicht, dahinter kniet Gus (ohne Pickel); auf „put“ schwenkt der dunkle Deckel mit Eisenbändern herüber und deckt es zu, danach 0,6 s der geschlossene Deckel.
- **Retentionsloch 21–30 s (E18–E20):** E18 seitlich unter dem Eis auf Körperhöhe (das Wesen liegt, Fäuste am Eis, darunter dunkeltürkises Wasser, nichts vor der Linse). E19 senkrechte Draufsicht mit der ganzen Hütte daneben und einem Fischer als Maßstab; das Eis über dem Körper wird klar. E20: Auf „press“ stemmt sich die Faust gegen das Eis, ein Riss springt (vorher 2,1 s reglos).
- **Blitzer (E44, E68, E80):** siehe „Ursachen“. Neues Tor in `pruefen.py`.

### P1 Texte und Paket (Reichweite)

- **TikTok-Beschreibung:** nennt jetzt Titel und Regel zuerst: „His Breath Didn't Fog. In Kindly, if the ice knocks, never knock back. Would you have walked him back? #kindlytown …“ (eigene Daten: Beschreibungen mit Regel im Median 30.900 gegen 8.453 mit Etikett).
- **„Rule 3“ nie allein:** YouTube-Titel „His Breath Didn't Fog | Rules of Kindly, Rule 3: Never Knock Back“, Instagram „Rule 3: Never knock back.“, Titelbild „RULE 3 · NEVER KNOCK BACK“.
- **Streitfrage (verworfen am 17.11., Abnahme):** Die Frage „Which Bear would you take home?“ verrät die Wendung, weil die Bildunterschrift beim Ansehen mitläuft; überall gilt jetzt „Would you have walked him back?“. Ursprünglicher Plan: **Streitfrage als Test über die Plattformen** (TikTok hat keinen A/B-Test): TikTok und YouTube fragen nach der frischen Entscheidung am Schluss („Which Bear would you take home?“), Instagram bleibt bei „Would you have walked him back?“. Nach 72 h Kommentare je 1.000 Aufrufe vergleichen (steht im LIESMICH). Der angeheftete Kommentar bleibt „Breathe on your screen. Did it fog?“.

### P2 (behoben)

- **Schwarze Leere unter dem Eis (E03, E26, E59, E62):** Wasserschein 2,4 m unter dem Eis, nur von oben sichtbar (dunkeltürkis mit weicher Kaustik); von unten bleibt das Wasser dunkel. In E59 steht die Kamera fest, das Gesicht steigt sichtbar 0,34 m herauf (vorher folgte die Kamera dem Gesicht). Neues Tor: Pixel-Median je Einstellung ≥ 35 (am alten Video: E26 1,0, E59 2,1).
- **Sohlen als schwarze Vierecke (E01, E28, E53, E86):** Wer in einer Untersicht auf dem Eis steht, steht 1,5 cm darüber; die Sohlen lagen in der Eisebene vor dem Frost.
- **Rule Zero „0“:** hochovale Ziffer in Versalhöhe mit Querstrich, der Punkt größer. Vorlage für F2–F8.
- **Endkarte:** 1,203 steht jetzt 0,80 s fertig (vorher etwa 0,6 s frei vom Pinsel); der Pinsel geht danach senkrecht weg. Der Glockenschlag bleibt auf dem Strich (0,40 s).
- **Bears Fellrand:** dunkel-bräunlich und kleiner; weiß am Mund ist nur noch Atem.
- **Untertitel:** ausweichen nur noch bis y 1320 (vorher 1400; `untertitel.json` → `ausweich_y`).
- **Wörtlicher Regeltext (E44) und Rückblende (E80):** Gus fährt ohne Pickel mit der Hand unter der Zeile entlang, „NEVER KNOCK BACK“ bleibt frei; E80 zeigt nur die Zeile (die Hand lag unscharf über 40 % des Bildes).
- **Eisloch „came three taps“ (E88):** je Schlag springt ein Riss in der Eishaut.
- **„Gus didn't look up“ (E75):** Gus im Dreiviertelprofil, Blick gesenkt in die Glut.
- **Schlussbild (E100):** tief von der Seite in Kniehöhe, Gus' Stiefel und der hängende Pickel gleiten neben Bears Stiefeln, kein Tippen.
- **Titelbild:** Textblock 70 px tiefer, damit die Kopfzeile im 3:4-Ausschnitt Luft hat.

## Bewusst nicht geändert

- **S40, klare Gläser vor dem Aufsetzen zeigen:** Das hieße Odells Gesicht ohne Brille von vorn (Bibel §3.3, entschieden: nie). Das Aufsetzen beginnt weiter 0,7 s vor dem Schnitt.
- **Hauptfiguren früher säen (Stiefel im Hook als Bears):** Im Hook taucht Lunds Gesicht unter dem Stiefel auf; wäre es Bears Stiefel, widerspräche das Bild der Pflanzung von Lund. Offen für eine spätere Fassung: Gus und Bear klein in der Steg-Schlange von S6.
- **Gruselsignal im Titelbild** (Lunds Augen, Eisblau): offen, kein Neubau des Titelbilds.
- **E11, E12, E14 (Laterne und Mast im Vordergrund), E30 (Lund angeschnitten), E36 und E69 (Hinterköpfe im Untertitelbereich):** nicht angefasst; keine dieser Stellen trägt einen Story-Beat.
- **E61 „dragged“:** jetzt von der Seite und schneller, ein sichtbares Reißen am Kragen gibt es weiter nicht (Gus greift auf 1,2 m Abstand ins Leere).

## Offen für Linus

- **Takt und Credits (P1 der Reichweiten-Kritik):** Bis zur nächsten Gutschrift am 13.12. sind 1.996 Credits frei, F2 (27.11.) und F3 (01.12.) brauchen je etwa 5.000. Ohne größeren Tarif oder Zusatz-Credits (Black-Friday-Angebot bis 01.12., `docs/release/automatisierung.md` §6.4) folgt auf F1 etwa 18 Tage nichts. Empfehlung: F1 trotzdem am 24.11. bringen (sie steht für sich) und vor dem 24.11. über den Tarif entscheiden.
- **Freigabe:** Fassung am Handy ansehen (`build/teilen/rules-of-kindly-01.mp4`), dann einplanen.
- **#kindlytown** in den Apps prüfen (LIESMICH).

## Prüfung (`pruefung.json`)

`pruefen.py` steht weiter auf „ok“: false, wegen derselben zwei bekannten Punkte wie vor dem Review; alle Bild-, Ton- und Atem-Tore sind grün:
- **Hör-Check, 3 Wortfehler je Fassung:** „Here in“ → „hearing“ (4,5 s), „town“ → „town's“ (21,7 s), „Bear“ → „bare“ (118,5 s). Bindungen und Gleichklang, schon bei der Stimmprüfung bekannt (`stimme.json`); die Aufnahme wird nicht neu generiert.
- **6 Einblendungen > 0,1 s neben dem Wortbeginn** (vorher 7, größte 0,18 s): alle mitten im Satz und nur über Whisper-Wortanfänge gemessen; am Pegel der Stimme sitzen sie (wie in README §21 beschrieben).

Belege: `render-bogen.jpg` (30 Bilder aus dem fertigen Video), Probe- und Kompressionsbögen der Nachbesserung lagen im Arbeitsordner der Sitzung.
