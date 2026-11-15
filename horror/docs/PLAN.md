# Horror-Kanal: Gesamtplan

Stand 15.11.2026, aus vier Recherchen vom 14.11.2026 und dem ElevenLabs-Abgleich vom 15.11.2026. Deine Vorgaben gehen vor. Produziert wird erst nach deinem Ja.
**(S)** Schätzung, **(u)** unbelegt, **(A)** Arbeitsannahme. Quellen-Kürzel in [Anhang C](anhang-c-kosten-quellen.md#c4-quellen).

## Urteil

Es geht ohne PC, ohne Blender und ohne Roblox Studio: Claude baut die 3D-Szenen als Code (three.js), rendert sie in der Cloud und legt Schnitt, Bewegung und Untertitel auf die Wortzeiten der Stimme. Gemessen sind 10–41 min Rechenzeit für einen Teil von 75 s, an Testszenen; echte Sets mit Texturen dürften langsamer sein [3D][BEW]. Ungemessen sind Claudes Bauzeit pro Einstellung und wie nah der Look an die Referenzen kommt (mit CC0-Bausteinen geschätzt 50–65 %, S) [3D], deshalb kommt zuerst eine Probe ohne Zusatzkosten. Das Hauptkonto wird englisch, mit eigenen Klötzchenfiguren, Serien aus 3–4 Teilen à 70–90 s und der Erzählstimme von r5: ElevenLabs „Adam“, ×1,3 beschleunigt. Geld gibt es frühestens ab 10.000 Followern [G1], in den ersten Monaten also realistisch 0 €.

## Deine 5 Entscheidungen

1. **Look: eigener Klötzchen-Stil** (Low-Poly-Stadt wie r2, eigene Figuren und Monster). *Grund:* Echte Roblox-Avatare gäbe es nur über Roblox Studio (deine Vorgabe 6: nein), und Nachbauten von R6/R15 außerhalb von Roblox sind kommerziell nicht erlaubt [L1][L1b].
2. **Herstellung: in der Cloud, ohne deinen PC.** Blender auf dem PC nur, falls die Probe sichtbar Qualität vermissen lässt. *Grund:* Das „ohne PC“ anderer Creator ist meist bezahltes KI-Video mit wechselnden Figuren [3D]; unser Weg kostet außer der Stimme (ElevenLabs-Credits, etwa 0,31–0,68 $ je Teil) nichts.
3. **Sprache: Englisch fürs Hauptkonto, Deutsch als zweites Konto in Phase 2.** *Grund:* Vorbilder und Stimmen sind englisch, und Creator Rewards zählt Aufrufe aus USA und UK [G1].
4. **Stimme: ElevenLabs „Adam“ (Modell eleven_v4), beschleunigt ×1,3 (Stil r5).** Die deutsche Stimme castet Phase 2. *Grund:* Adam ist sehr wahrscheinlich genau die Stimme von r5 und ref0 (0,91 bzw. 0,92; dieselbe Stimme ab 0,80), eine öffentliche Stock-Stimme, kein Klon (ElevenLabs-Abgleich vom 15.11.2026). *Haken:* r2, r5 und ref0 nutzen alle Adam, dein Kanal klänge praktisch gleich; ein Mittelweg wäre ein eigener Faktor wie ×1,2, dein Ohr entscheidet. Kommerziell erlaubt erst ab einem bezahlten ElevenLabs-Plan (Starter) [G5]. Rückfall ohne Credits: Inworld „Casey“ (0,57–0,73), kommerzielle Lizenz inklusive [G5c].
5. **Probe: Ja zu Phase 0** (0 € extra, nichts wird veröffentlicht; die Stimme des Probe-Teils braucht etwa 1.700–3.400 deiner ElevenLabs-Credits). *Grund:* Ohne gemessene Bauzeit lässt sich kein Takt planen.

Die Widersprüche der Recherchen (Roblox Studio, Deutsch zuerst, Teil 2 nur bei Treffern, 150 s Länge, eigenes Musikbett) sind in [Anhang C1](anhang-c-kosten-quellen.md#c1-widersprüche-zwischen-den-recherchen-entschieden) mit Grund entschieden.

## Herstellung: Ablauf

1. **Geschichte:** Claude schlägt 3 Prämissen vor, du wählst und passt den Twist an. Das macht den Stoff menschlich geprägt [L6].
2. **Serie in Teilen:** Claude teilt sie in 3–4 Teile mit Cliffhanger.
3. **Stimme mit Wortzeiten:** Claude vertont mit ElevenLabs Adam (eleven_v4), beschleunigt ×1,3, macht den Hör-Check und schreibt `timing.json`.
4. **Shotliste:** Claude plant aus den Wortzeiten rund 50 Einstellungen je Teil von 75 s (38–45 pro Minute [BEW]); ein Messtor prüft.
5. **3D-Bausteine:** Claude baut einmalig Rig und Gesichter, 25–35 Animationen, 12 Kamera-Bausteine, 3–5 Sets, Shotlisten-Compiler und Messtor (40–80 h, S) [BEW]. Phase 0 baut davon nur die 18 Grundbausteine.
6. **Render:** nachts in der Cloud, 1080 × 1920, 30 fps.
7. **Untertitel:** im selben Render, wortgenau, 1–2 Wörter je Einblendung.
8. **Upload-Paket:** Claude legt Video, Titelbild, Text und Sound-Vorschlag in Drive. Du lädst hoch, wählst den Sound und setzt den Verweis.

**Deine Zeit pro Teil: etwa 10–12 min (S)**, plus wöchentlich 10 min Screenshots aus TikTok Studio. Das gilt nur, wenn Claude Shotliste und Kontaktbogen selbst prüft; die Bewegungs-Recherche schätzt 0,5–1,5 h Prüfarbeit je Minute Video [BEW]. Phase 0 misst das.

## Serienformat

- **Länge:** 70–90 s je Teil, nie unter 62 s, weil Creator Rewards nur Videos über 1 min zählt [G1]. Eine Geschichte ist fertig, bevor Teil 1 online geht; dann 1 Teil pro Tag.
- **Cliffhanger:** Jeder Teil außer dem letzten endet im Moment höchster Gefahr wie bei r2, harter Schnitt höchstens 0,2 s nach dem letzten Wort [FS]. Der letzte Teil endet mit Pointe (r5).
- **Verweis:** 1 s Endkarte „PART 2“ und der Verweis in der App: Playlist, falls dein Konto sie hat, sonst angehefteter Kommentar. Playlists gibt es laut Drittquellen erst ab 5.000–10.000 Followern (u) [PL].
- **Takt:** Phase 1 vier Teile pro Woche, Phase 2 einer pro Tag. Im Bild 38–45 Einstellungen pro Minute, Schnitt auf den Wortbeginn, fast immer fährt die Kamera [BEW].
- **Hook:** erstes Wort bei 0,00 s, Bedrohung im ersten Bild. Ein Satz mit Ort, Regel und tödlicher Folge, höchstens 4,5 s (A; r2 3,5 s, r5 3,9 s), keine Frage. Ab Teil 2 fasst ein Satz Regel und Cliffhanger zusammen.
- **Bauplan:** Teil 1 bringt Regel, Monster und Ritual, eine gescheiterte Umgehung und eine Schutzfigur mit Versprechen. Teil 2 bringt falsche Sicherheit und die Nacht. Teil 3 bringt Wendung und Ritual-Wiederkehr, die Schlusszeile erntet eine frühe Gewohnheit. Mindestens 6 Paare aus Setup und Payoff.
- **Inhaltsregeln:**
  - Erzähler und Opfer sind volljährig, Kinder nie in Gefahr und nie Opfer ihrer Eltern. TikTok verbietet „endangerment … of young people“ ohne erkennbare Ausnahme für Fiktion [L3]; die Plots von r5 und ref (Eltern gegen Kind) fallen darunter, wohl auch r2 (Teenager mit kleinem Bruder in Gefahr, u).
  - Gewalt nur andeuten, nichts Drastisches im Titelbild und in den ersten 7 s [L3][L5].
  - Nur eigene Monster und Stoffe, kein Siren Head, keine SCP-Figuren [L6]. Kein „Roblox“ im Kontonamen [L1], keine Roblox-Hashtags, weil die Figuren keine Roblox-Avatare sind (A).

Untertitel, Kamera, Figuren, Messtor: [Anhang A](anhang-a-serienformat.md).

## Stimme je Referenz-Stil

Alle Kandidaten sprechen genau den Satz der Referenz und gehen durch dieselbe Nachbearbeitung (Resample, Pausen, Tempo, Lautheit). Wert: WeSpeaker-Ähnlichkeit zur Originalstimme, dieselbe Stimme ab 0,80.

| Stil | Befund | Beste Stimme | ElevenLabs vorn? | Rangliste dahinter | Nachbearbeitung |
|---|---|---|---|---|---|
| r5 | Adam, ×1,30 beschleunigt | ElevenLabs Adam, v4 (0,91) | ja, gleiche Stimme | Adam multilingual v2 0,83 · Russell 0,59 · Roger 0,58 · Inworld Casey 0,57 · Cartesia Benji 0,51 | ×1,30 schneller abspielen, dazu Tempo ×1,18 oder kürzere Pausen, Pausen ≤ 0,23 s |
| ref0 | Adam, ×1,40 beschleunigt | ElevenLabs Adam, v4 (0,92) | ja, gleiche Stimme | Adam multilingual v2 0,82 · Inworld Casey 0,73 · Cartesia Benji 0,72 · Roger 0,66 · Russell 0,65 | ×1,40, Pausen ≤ 0,32 s, kein weiteres Tempo |
| r2 | sehr wahrscheinlich Adam, ×1,08; Befund schwächer | ElevenLabs Adam, v4 (0,84) | ja, wohl gleiche Stimme | Cartesia Garrett 0,56 · ElevenLabs Skylar 0,51 · Inworld Casey 0,48 · ElevenLabs Drew 0,47 · Cartesia Kyle 0,44 | ×1,08, sonst weder Tonhöhe noch Tempo ändern, Pausen ≤ 0,45 s |
| r1 | trocken, männlich, 166 Hz, nicht identifiziert | Inworld Bryce +1 Halbton (0,66–0,71) | nein | Inworld Chip 0,65 · Cartesia Benji 0,61 · ElevenLabs Titan 0,54 · Mark Normal 0,45 | +1 Halbton, Tempo ≈ 1,1; höhere Tonlage: Cartesia Benji |

- **Befund:** r2, r5 und ref0 sind dieselbe Grundstimme, die ElevenLabs-Stock-Stimme „Adam – Dominant, Firm“ (`pNInz6obpgDQGcFmaJgB`), beschleunigt um ×1,08, ×1,30 und ×1,40. Für r5 und ref0 ist das deutlich, für r2 schwächer: Dort passt die gemessene Tonhöhe der Vorlage (164–175 Hz) nicht ganz zu Adam ×1,08 (143–146 Hz), weil Reste der Spieluhr die Messung stören.
- **Gegenproben:** Roger und Russell mit gleichem Modell und gleicher Kette kommen nur auf 0,55–0,69, die hohen Werte kommen also nicht vom Modell. Die Referenzen selbst, auf denselben Faktor umgerechnet, decken sich (0,88–0,96). Adam gegen r1: 0,16–0,32. Der Resample-Sweep hat seinen Gipfel genau bei ×1,30 (r5) bzw. ×1,40 (ref0); die Tonhöhe steigt mit (120 Hz × 1,3 ≈ 157 Hz). Damit ist die Vermutung der Erstanalyse (gleiche Tonhöhe) für r5 vom Tisch.
- **Modell:** eleven_v4 statt multilingual_v2 (0,91/0,92 gegen 0,83/0,82). Die übrigen ElevenLabs-Stimmen liefen nur mit v4, eleven_v3 ist nicht getestet.
- **r2-Kette:** Die frühere Kette mit +1 Halbton passte nicht zu r2; damit käme Adam nur auf 0,64–0,67.
- **Vorschauen:** Die früheren ElevenLabs-Vorschauen mit anderem Text haben getäuscht (Adam 0,65–0,73 statt 0,91, Titan 0,60 statt 0,54, Roger 0,68 statt 0,58) und sind von der Seite entfernt.
- **Hör-Check:** In der ref0-Probe (×1,40) versteht Whisper „in at“ statt „in it“; der rohe Take war fehlerfrei. Bei hohen Faktoren genau prüfen.
- **Maßstab und Grenzen:** Dieselbe TTS-Stimme mit anderem Satz ergibt 0,80–0,89 (Median 0,87), fremde Stimmen 0,22 im Median. Zwei Takes derselben Stimme streuen um bis zu 0,05–0,10. Claude konnte nicht hören, dein Ohr entscheidet.
- **Regel und Lizenz:** Stock-Stimme gleich oder ähnlich ja, Klon einer echten Person nein. ElevenLabs erlaubt kommerzielle Nutzung erst ab Starter, Credits aus dem Free-Plan decken Creator Rewards nicht [G5]. Inworld enthält die Lizenz [G5c], Cartesia erst ab Pro für 5 USD/Monat [G5b].
- **Verbrauch des Abgleichs:** 2.838 ElevenLabs-Credits (13 Aufrufe mit je 2 Takes), anteilig etwa 0,57 $.

Details zur ersten Runde (Inworld, Cartesia, ElevenLabs-Vorschauen): [Anhang B](anhang-b-stimme-ton.md), Stand vor dem ElevenLabs-Abgleich.

## Ton

Den Hintergrundsound wählst du beim Hochladen aus der TikTok-Bibliothek, etwa eine Spieluhr wie bei r2 und r5, deutlich leiser als die Stimme (dort etwa 12 LU) [SO]. Wir liefern die Stimme und etwa einen Effekt je 15 s auf Schlüsselwörtern (Sub-Boom, Riegel-Klick; r5: rund 11 in 161 s) [SO]. Unsere Klangbetten dienen nur als Probemix für die Lautstärke.

## Kosten

- **Stimme ElevenLabs Adam (eleven_v4):** 1.700 Credits je Teil mit einem Take je Satz, also anteilig 0,31–0,34 $; mit 2 Takes (Standard des Connectors) 3.400 Credits, 0,62–0,68 $. 30 Teile im Monat brauchen 51.000 bzw. 102.000 Credits; das passt in Creator (22 USD, 121.000 Credits), Starter (6 USD, 30.000 Credits) reicht für etwa 17 bzw. 8 Teile [G5].
- **Rechenweg:** 1 Credit je Zeichen und Take, gemessen am r5-Satz (114 Zeichen, 2 Takes = 228 Credits). Ein Teil von 75 s im r5-Stil hat etwa 1.700 Zeichen (1.360 je Minute) [Anhang C2]. 1.000 Credits kosten anteilig 0,18 $ (Creator: 22 $ / 121.000) bis 0,20 $ (Starter: 6 $ / 30.000). Der ref0-Stil liegt gleichauf (≈ 1.650 Zeichen); der r2-Stil spricht langsamer (109 Zeichen in 7,4 s), also etwa 1.100 Zeichen und 0,20–0,22 $ je Teil mit einem Take.
- **Kontostand:** konnte Claude nicht abfragen (der Connector erlaubt das nicht); er steht in deinem ElevenLabs-Konto.
- **Rückfall Inworld Casey:** etwa 1.700 Zeichen zu 20–25 $ je 1 Mio. [G5c], also 0,03–0,04 $ je Teil, mit einem Neuversuch 0,07–0,09 $, und 1–3 $ im Monat bei 30 Teilen.
- **Render, CC0-Bausteine, Sound, Effekte:** 0 €. Claude läuft im Abo, ob das Kontingent reicht, ist offen (u).
- **Phase 0:** 0 € extra; die Stimme des Probe-Teils braucht etwa 1.700–3.400 deiner Credits. Weitere Alternative: Cartesia Pro 5 USD im Monat [G5b]. Rechenweg der übrigen Posten: [Anhang C2](anhang-c-kosten-quellen.md#c2-kosten-des-empfohlenen-wegs) (dort noch mit Inworld als Stimme).

## Risiken

1. **Roblox-Regel:** Ob eigene Klötzchenfiguren als Ableitung gelten, entscheidet Roblox (u). Deshalb deutlich andere Proportionen, kein Roblox-Name, kein Logo.
2. **Trend-Sättigung:** „In this town“ ist erst seit Ende Oktober groß [N2]; Nachahmer liegen im Median bei 114–9.941 Aufrufen [N3].
3. **Bauzeit ungemessen:** 30 Teile im Monat sind rund 1.400–1.700 Einstellungen (75 s bei 38–45 je Minute, eigene Rechnung).
4. **Look-Decke:** Rückfall ist Blender auf deinem PC [3D].
5. **Creator Rewards:** ab 18, 10.000 Follower, 100.000 Aufrufe in 30 Tagen, Video über 1 min; ab 5 Verstößen in 30 Tagen ist das Konto raus [G1].
6. **Konto aus Deutschland:** Ob TikTok englische Videos an US-Zuschauer verteilt, ist offen (u).

## Phasen

**Phase 0: Probe ohne Zusatzkosten, nur nach deinem Ja (etwa 1 Woche, S)**
- 0a: 15 s Look-Probe neben r2 und r5. 0b: Probe-Teil von 75 s mit 18 Grundbausteinen, nicht veröffentlicht.
- Du hörst die Stimmen an (Adam mit ×1,3 oder mit eigenem Faktor), liest die Soundnamen von r2 und r5 ab und prüfst die Verweis-Funktion deines Kontos.
- **Go**, wenn der Look am Handy besteht (dein Urteil), die Bauzeit hochgerechnet höchstens 4 h je Teil beträgt (A), Messtor und Hör-Check grün sind und du unter 15 min bleibst. **Sonst:** Fehlt nur der Look, Blender auf deinem PC, falls du willst; ist die Bauzeit zu hoch, weniger Teile oder Abbruch.

**Phase 1: erste Serien (4 Wochen ab dem ersten Upload)**
- Englisches Konto, 4 Teile pro Woche, je Woche eine Variable: Grundwert, Teile mit 110–130 s, ohne Endkarte, zwei Einteiler als Gegenprobe zu deiner Serien-These.
- **Ziele (A):** Teil 1 im Median ≥ 5.000 Aufrufe nach 72 h; Teil 2 erreicht ≥ 30 % davon; Wiedergabezeit ≥ 40 %; ≥ 50 % Zuschauer aus USA und UK; 0 Verstöße; du ≤ 15 min, Claude ≤ 4 h je Teil.
- **Tag 30:** weiter bei Median ≥ 5.000 oder einem Teil über 100.000. Stopp bei Median unter 1.000 nach 12 Teilen ohne Teil über 10.000, oder wenn du über 30 min je Teil brauchst.

**Phase 2: Takt erhöhen, zweites Konto (ab Tag 31, nur bei „weiter“)**
- Hauptkonto 1 Teil pro Tag, sofern Bauzeit und Kontingent reichen.
- Zweites Konto auf Deutsch mit denselben Geschichten, deutscher Stimme und neuem Render.
- Reichen deine ElevenLabs-Credits für 1 Teil pro Tag nicht (51.000–102.000 im Monat), dann Creator für 22 USD/Monat oder Rückfall auf Inworld Casey, nur mit deinem Ja [G5]. Vor Creator Rewards das Gewerbe klären [G7].
- **Messgrößen:** Follower pro Woche, Aufrufe in 30 Tagen (Schwelle 100.000), Weiter-Quote je Konto, Kosten, deine Minuten.

Anhänge: [A Serienformat](anhang-a-serienformat.md) · [B Stimme und Ton](anhang-b-stimme-ton.md) · [C Widersprüche, Kosten, Risiken, Quellen](anhang-c-kosten-quellen.md). Hörproben in `audio/`. Anhang B und die Stimmkosten in Anhang C zeigen den Stand vor dem ElevenLabs-Abgleich; wo sie abweichen, gilt dieser Plan.
