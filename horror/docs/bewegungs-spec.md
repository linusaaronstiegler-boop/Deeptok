# Bewegungs-Spezifikation: Horror-Story-Serien

Stand: 14.11.2026. Grundlage sind die Bewegungsanalysen von vier Referenzen: r1-horrorrobs, r2-jexario, r5-yougplat und ref-concet (Ordner `horror-analyse/bewegung/`). Dazu kommt ein eigener Render-Test mit three.js in dieser Cloud (Abschnitt 3c). Zahlen ohne Zusatz sind gemessen. Wo „Schätzung“ steht, wurde nichts gemessen.

Gemessen wurde nicht mit Kontaktbögen. Die Grundlage waren optischer Fluss für jedes Bildpaar, ein Kameramodell pro Bild (Verschiebung, Zoom, Drehung), Parallaxe-Tests, Streifen mit 10 fps und Einzelbilder mit 30 fps.

---

## 0. Kurz: Was sich bewegt und was nicht

Linus hat recht: Welt und Kamera sind echtes 3D. Die Kamera steht fast nie still: 88–95 % der Einstellungen bewegen sich ab dem ersten Bild. Das „Leben“ ist aber billiger gemacht, als es wirkt:

- **Kamera:** In jeder Einstellung fährt sie, meist als ruhiger Push-in (51–76 % der Einstellungen). Dazu kommt an Schlüsselstellen alle paar Sekunden eine auffällige Fahrt.
- **Figuren:** Eine kurze Aktion pro Einstellung (0,2–1,2 s), genau auf das Schlüsselwort. Danach halten sie die Pose. In 37–61 % der Figuren-Einstellungen bewegt sich der Körper gar nicht; es bleiben nur Pose, Gesichtstausch und Kamera.
- **Mimik:** Immer getauschte Gesichter (Decal oder Zeichnung), nie ein Gesichts-Rig.
- **Schnitt:** Alle 1,4–1,9 s ein harter Schnitt, fast immer auf einen Wortbeginn.

Den Eindruck „alles lebt“ erzeugen also Kamera, Schnitt-Takt und Einzelaktionen genau auf dem Wort. Für uns ist das günstig: Genau diese drei Dinge lassen sich aus Wortzeiten automatisch erzeugen.

### Die vier Referenzen im Überblick

| | r1-horrorrobs | r2-jexario | r5-yougplat | ref-concet |
|---|---|---|---|---|
| Inhalt ohne TikTok-Endkarte | 61,6 s (davon Geschichte 53,3 s) | 147,0 s | 161,5 s | 166,8 s |
| Werkzeug (Urteil der Analyse) | 3D-Software (Blender o. ä.) mit 2D-Cutout-Figuren | Blender mit Roblox-R6-Figuren | Roblox Studio + Schnittprogramm | Roblox Studio (wohl Moon Animator 2) |
| Figuren | 2D-Puppen, 4 Ansichten, drehen sich zur Kamera | R6-Blockfiguren | R6/R15-Avatare | R15-Avatare |
| Einstellungen pro Minute | 44 | 29 | 40 | 42 |
| Einstellungslänge (Median) | 1,33 s | 1,93 s | 1,50 s | 1,37 s |
| Kamera bewegt sich | 90 % | 88 % | 95 % | 92 % |
| Grundbewegung | Push-in 9,5 %/s, mit Ease | Push-in 3,3 %/s, mit Ease | Zoom-in 7,2 %/s, linear, digital | Dolly-Push 8 %/s, linear |
| Leerlauf-Atmen | nein | ja | ja | nein |
| Besonderheit | 2D-Overlays in 56 % der Einstellungen, Roulette-Intro, Follow-Outro | Bewegungs- und Tiefenunschärfe, Physik, Ende mitten in der Spannung | Snap-Zooms, Atemdampf als Dauer-Partikel | Dutch-Drift, Whip-Hook |

---

## 1. Gemeinsame Bewegungs-Spezifikation (messbar)

### 1.1 Rahmen

- **Format:** 1080 × 1920, 30 fps nativ. In bewegten Einstellungen keine doppelten Bilder (bei r1 und r2 geprüft).
- **Länge:**
  - Jeder Teil hat mindestens 61 s Inhalt, ohne die TikTok-Endkarte. Laut Linus ist das Voraussetzung für das Creator-Programm.
  - Empfohlen sind 65–150 s.
  - r1 kommt auf 61,6 s nur mit Intro (5,8 s) und Outro (2,4 s); die Geschichte allein wäre zu kurz.
- **Serie:**
  - Ein Teil endet mit einem harten Schnitt auf das stärkste Spannungsbild, ohne Outro. Vorbild ist r2: Das Monster drückt das Maul an die Scheibe.
  - Unten wird auf den nächsten Teil verlinkt.
  - Ein Ende mit Pointe (wie bei r5 und ref) gehört in den letzten Teil.
- **Hook in der ersten Sekunde:** Ab Bild 1 Bewegung auf das stärkste Motiv. So machen es die Referenzen:
  - ref: unscharfer Whip in 0,2 s auf das Höhepunkt-Bild.
  - r5: seitliche Fahrt durch die Menge, die bei 1,5 s genau auf „skinwalker“ beim Täter endet.
  - r2: Monster stapfen ab Bild 1.
  - Das 4,5-s-Roulette von r1 ist ein Markenzeichen dieses Kanals, kein Muss.
- **Ton** (Linus' Hinweis, nicht gemessen): Die Musik als TikTok-Sound in der App dazulegen, dann steht sie automatisch unten. Der Render enthält nur Stimme und Geräusche. Die Wortzeiten der Stimme steuern alles Weitere.

### 1.2 Schnitt

| Kennzahl | Ziel | r1 | r2 | r5 | ref |
|---|---|---|---|---|---|
| Anteil harter Schnitte | ≥ 95 % | 90 % (3 Weißblitze, 1 Abblende) | 100 % | 100 % | 100 % |
| Einstellungen pro Minute | 38–45 (ruhiger Kanal: ~30) | 44 | 29 | 40 | 42 |
| Länge Median | 1,4–1,6 s | 1,33 s | 1,93 s | 1,50 s | 1,37 s |
| Länge P10 / P90 | ≥ 0,7 s / ≤ 2,5 s | P25 1,00 / P75 1,68 | 1,14 / 3,13 | 0,73 / 2,39 | 0,83 / 2,07 |
| Längste Einstellung | ≤ 4,0 s | 2,60 s | 3,90 s | 3,83 s | 2,43 s |
| Schnitt zum Wortbeginn (Median) | −0,07 bis +0,05 s | −0,03 s | +0,03 s | +0,05 s | −0,07 s |
| Schnitte nahe einem Wortbeginn | ≥ 85 % innerhalb ±0,15 s | 88 % | 80 % schon in ±0,1 s | 77 an Satzanfängen + 20 an Kommas, von 106 | 97 % |
| Einheit einer Einstellung | ein Teilsatz (2–8 Wörter) | 2–6 Wörter | 1,31 Einstellungen pro Satz | 7 Wörter | ein Teilsatz |

Regeln:
1. Geschnitten wird auf das Bild des Wortbeginns, höchstens 2 Bilder davor. Satzanfänge bekommen fast immer einen Schnitt (r5: 74 von 80), Kommas etwa jedes zweite.
2. Keine Kreuzblenden und keine Whip-Pans als Übergang. Erlaubte Sonderformen:
   - Weißblitz an 2–3 Wendepunkten: 1 Bild weiß, dann etwa 0,25 s ausblenden (r1).
   - Blitz-Einstellung von 0,2–0,3 s als Rückblende (r5).
   - Harter Schnitt am Ende.
3. Im Höhepunkt darf ein fester Takt laufen (r1: 4 Einstellungen zu je 1,00 s).
4. Der Takt bleibt über das ganze Video gleich. r2 hat in jedem 30-s-Block 14–16 Schnitte, r5 in jedem 20-s-Block 10–16, zum Ende hin etwas mehr.

### 1.3 Kamera

| Kennzahl | Ziel | r1 | r2 | r5 | ref |
|---|---|---|---|---|---|
| Einstellungen mit Bewegung ab Bild 1 | ≥ 90 % | 90 % | 88 % | 95 % | 92 % |
| Statisch | ≤ 8 %, nur bei Inserts oder großer Figurenaktion | 10 % | 11 % der Zeit | 4 % | 5 % |
| Anteil Push-in | 55–75 % | 51 % | 65 % der Zeit | 76 % | 72 % |
| Push-in-Tempo | 4–12 %/s, Standard 7 %/s | 9,5 (P25 6, P75 11,5) | 3,3 (P25 1,7, P75 5,0) | 7,2 (P10 3,9, P90 12,3) | 8,0 (P25 4,2, P75 13,2) |
| Vergrößerung je Einstellung | ×1,07 bis ×1,12 | ~×1,105 | ~×1,07 bei 2 s | ×1,10 | ×1,11 |
| Starttempo im Verhältnis zur Spitze | ≥ 0,4, nie aus dem Stand | 0,40–0,55 | ~0,56 | ~1,0 (linear) | 0,74 |
| Spitze im Verhältnis zum Mittel | 1,0–1,5 | 1,2–1,5 | ~1,24 | ~1,0 | 1,17 |
| Langsame Fahrt oder Schwenk | 20–120 px/s (bezogen auf 1080 Breite) | 15–110 | 11–76 (1–7 % der Breite pro s) | – | Median 24, P90 122 |
| Abstand zwischen Akzentfahrten | Ziel alle 6–10 s, nur an Schlüsselstellen | alle ~4 s (14 in 53 s) | alle ~8 s | alle ~10 s | alle ~20 s schnell, dazu Pull-outs |
| Tempo der Akzentfahrten | 500–3250 px/s, Ease-in-out, Ankunft aufs Nomen ±0,1 s | 990 und 3000 px/s | max. 13,4 % der Breite pro s | Truck ~1,5 Bildbreiten/s | 560–1140, Whip 3250 |
| Wackeln | nur bei Ereignissen, ≤ 4 pro Teil | 2 (Sinus 6 Hz ±5 px; Zufall ±3 px) | 2 Einstellungen, 4 Stöße | 0 | 3 + Hook |
| Rollen | 0 (als Kanal-Option: Drift 0,5–2 °/s) | 1× | – | nur in Orbits | 32 % der Einstellungen über 1 °/s |

Regeln:
1. **Jede Einstellung ist aus einer laufenden Bewegung geschnitten.** Für das Tempoprofil gibt es zwei Lager. Welches gilt, entscheidet der Kanal (siehe 1.8):
   - **Linear** (r5, ref): gleiches Tempo vom Schnitt bis zum Schnitt, Schwankung höchstens 10 %.
   - **Ease-in-out** (r1, r2): Die Keys liegen etwa 15 % der Einstellungsdauer vor bzw. hinter den Schnittgrenzen. Dann liegt die Spitze bei 40–60 % der Dauer, und das Starttempo beträgt 40–70 % der Spitze.
2. **Push-in ist der Grundzustand.**
   - Er darf ein digitaler Zoom sein (r5, r1 ohne Parallaxe). Eine echte Dolly-Fahrt mit Parallaxe ist besser (ref) und kostet in 3D nichts extra.
   - Der Fixpunkt liegt waagerecht in der Bildmitte (±4 %) und senkrecht bei 46–50 % der Bildhöhe, also auf Gesicht oder Oberkörper (r5).
3. **Akzentfahrten nur an Schlüsselstellen, jede mit einem Zweck:**
   - Eröffnung: Kranabstieg mit Tilt oder Drohnenflug (r1 S2, r2 E1).
   - Größe zeigen: Dolly-out bzw. Pull-out (r1 S5 bei „40 miles“, r2 E29, ref in 11 % der Einstellungen).
   - Monster enthüllen: Tilt oder Kran am Körper hoch, Ankunft genau auf dem Nomen (r1 S12 bei „40“ und S38 bei „Head“, r2 E69).
   - Fortbewegung: Folgefahrt hinter der gehenden Figur (r1 S34/S36, r5 S102), Mitfahrt an den Monster-Füßen (ref S010/S110), Mitfahrt neben dem Radfahrer (r2 E19).
   - Ortswechsel: Seitenfahrt, bei der ein Vordergrund-Objekt durchs Bild wischt (r2 E5, ref S018/S070, r5 S000), oder ein Flug durch die Tür (r2 E15).
   - Ziel ansteuern: Sturz- oder Tauchfahrt mit Ease-in auf das 1,9- bis 5-Fache (r5 S034, S087, S094).
   - Überblick: Orbit aus der Aufsicht mit 20–25 °/s (r5 S030, S079; ref S053).
   - Bewegungswort: Whip innerhalb der Einstellung, von 0,2 s (r5 S020 bei „walking“) bis 0,5 s für 180° (ref S084).
4. **Akzent-Zooms:** insgesamt 2–4 pro Teil.
   - Snap-Zoom am Einstellungsanfang: +13–21 % in 1–2 Bildern (r5, 3×).
   - Punch-in zur Geste: auf das 1,5-Fache in 3–6 Bildern (r5 S071).
   - Schneller Push mit 15–19 %/s bei Enthüllungs-Inserts (r2, 2×).
5. **Wackeln nie als Dauer-Handkamera.** Nur als Ereignis:
   - Einsatz 0–0,13 s nach dem Geräuschwort, Dauer 0,4–0,5 s, abklingend.
   - Ausschlag etwa 1 % der Bildbreite (r2, Keys alle 2 Bilder), bei einem Monster-Angriff bis etwa 20 px pro Bild (ref).
   - Sonderform für Angst-Großaufnahmen: waagerechter Sinus mit 6 Hz und ±5 px (r1 S32).

### 1.4 Figuren

| Kennzahl | Ziel | r1 | r2 | r5 | ref |
|---|---|---|---|---|---|
| Einstellungen mit Körperaktion | 35–55 % | ~40 % der Figuren-Einstellungen | fast jede (30–35 Einzelaktionen + Schleifen) | 33–37 % | 53 % |
| Einstellungen, in denen nur eine Pose gehalten wird | 35–60 % | 61 % der Figuren-Einstellungen | gering | Mehrheit | 37 % |
| Einstellungen ohne Figur | ≤ 10 % | wenige | wenige | wenige | 10 % |
| Einzelaktionen pro Minute | 12–20 | ~11 | ~13 | ~14 | ~23 |
| Aktionsbeginn zum Schlüsselwort | Median 0 s, Fenster −0,2 bis +0,2 s (höchstens ±0,3 s) | +0,00 bis +0,19 s | 7 von 9 innerhalb ±0,2 s | Median −0,06 s (−0,30 bis +0,30) | Median +0,03 s (−0,07 bis +0,14) |
| Leerlauf-Atmen | Kanal-Option; Empfehlung: an, 0,15–0,5 % der Bildbreite | nein | ja | ja | nein (unter 1,5 px) |
| Gesichter pro Figur | 3–6, Tausch in 1 Bild | ~5 | 2–3 | mehrere + Mundformen | mehrere + Blinzeln |

Regeln:
1. **Eine Hauptaktion pro Einstellung, von einer Figur.** Alle anderen Figuren halten ihre Pose.
2. **Zeitpunkt:**
   - Kurze Aktionen beginnen auf dem Schlüsselverb (−0,2 bis +0,2 s).
   - Lange Aktionen (über 1 s) laufen über den Satz und sind auf dem Schlüsselwort fertig. Beispiele: Bei r2 steigt das Monster aus dem Boden und ist auf „giant“ voll groß. Bei r1 sind die Lautsprecher genau auf „pointed“ zur Kamera gedreht.
3. **Dauern** (gemessen):

   | Aktion | Dauer |
   |---|---|
   | Kopfdrehung | 0,2 s |
   | Arm heben, Zeigen | 0,1–0,3 s |
   | Warngeste, Ducken | 0,4 s |
   | Fallen | 0,2–0,3 s |
   | Klettern | 0,8 s |
   | Rennen quer durchs Bild | ~1,5 s |
   | Ansichtswechsel einer 2D-Puppe | 1–3 Bilder |

4. **Danach wird die Pose gehalten, die Kamera fährt weiter.**
   - Kein Abschnitt über 0,33 s ganz ohne Bewegung. Bei r2 gibt es genau eine Ausnahme, die Zeitlupe.
   - Einfrieren am Ende einer Einstellung höchstens in 2 % der Einstellungen (ref).
5. **Mimik nur als Tausch:**
   - Reaktionsgesicht auf das Reaktionswort, Abstand höchstens ±0,3 s (r5: 0,3 s vor „screaming“, 0,3 s nach „name“).
   - Blinzeln als Tausch alle 1–2 s (ref).
   - Mundformen bei wörtlicher Rede, Wechsel alle 0,1–0,3 s (r5, 8 Einstellungen). Kein Lippen-Sync.
6. **Wörtlich bebildern:** Mindestens 85 % der Handlungsverben werden gezeigt (ref 90 %, r5 fast alle). Ausnahmen sind eine Reaktions-Einstellung oder ein Ergebnis-Bild (r5 S050 bei „turned“: Die Menge schaut schon zur Kamera).
7. **Hintergrund:** Figuren in Totalen gehen im Zyklus (r2). Mengen stehen meist in festen Posen (r5).

### 1.5 Monster

- **Ruhe:** Es steht still, bis sein Wort kommt. Bei r1 ist es in 67 % seiner Einstellungen still, bei ref in 9 von 21 Auftritten (Großaufnahmen).
- **Hauptaktionen:**
  - Kopf zur Geräuschquelle oder zur Kamera drehen, 0,2–0,7 s, Beginn mit dem Verb. r2 E2: 0,2 s auf „sound“. r1 S17: Die Drehung deckt „turns“ genau ab. r1 S40: 0,7 s mit Ease-in.
  - Stapfen (r2 ~8 Einstellungen, ref 7).
  - Vorbeugen um 60–70° über die ganze Einstellung (ref 4).
  - Maul aufreißen als Gesichtstausch, 0–0,14 s nach „open“ (ref 3).
  - Greifen (r1 1, ref 1).
- **Angriff über die Kamera:** Ruck auf dem Wort (−0,07 bis +0,03 s), danach 0,5 s Wackeln (ref).
- **Glühen:** pulsiert mit etwa 5 Hz bei Geräuschwörtern (r1).
- **Häufigkeit:** Animiert ist das Monster in etwa einem Drittel bis der Hälfte seiner Auftritte.

### 1.6 Umgebung und Effekte

- **Lichtereignisse:** 1–3 pro Teil, immer als Handlung auf dem Verb.
  - Schnell: Licht aus in 0,3–0,5 s, 30–55 % dunkler. r1: 0,47 s, endet 0–0,05 s vor dem Wort. r2: 0,3 s, −33 %.
  - Gestaffelt: über etwa 1 s von vorn nach hinten, Start 0,4 s vor dem Wort (r5; ref mit Laternen nacheinander).
- **Ereignis-Partikel** auf das Wort: Staub, Mehl, Spritzer, Glas (r2 2×, r5 1×, ref 1×).
- **Dauer-Partikel** nur, wo die Szene sie hergibt: Atemdampf in der Kälte, Schnee, Blätter, Schwebeteilchen unter Wasser. r5 und r1 haben sie, r2 und ref nicht. Flackern als Deko hat keine der vier Referenzen.
- **Physik-Objekte** bei Fall-Momenten (r2: Tablett, Topf mit Zeitlupe und Nachwackeln).
- **Nachbearbeitung:**
  - Tiefenunschärfe in Nah- und Detailaufnahmen (r2, r5).
  - Bewegungsunschärfe bei schnellen Bewegungen (r2).
  - Korn, Vignette und Dunst (r1).

### 1.7 Untertitel (nur der Bewegungsteil)

- **Umfang:** 1–3 Wörter, Wechsel genau auf jedes Wort. r2 zeigt 1 Wort, r5 1–2 Wörter, r1 Phrasen mit 2–6 Wörtern und rotem Schlüsselwort.
- **Einsatz:** höchstens 0,1 s nach Wortbeginn.
- **Pop in 2–4 Bildern:** von 0 auf etwa 134 % (2. Bild), dann etwa 88 % (4. Bild), nach etwa 0,2 s 100 % (r2).
- **Lage:**
  - r5 setzt die Untertitel oben (14 % der Bildhöhe), r2 bei 73 %. Das liegt schon im Bereich der TikTok-Bedienleiste.
  - Bei uns gilt die Hausregel: zwischen y = 168 und 1330.

### 1.8 Unterschiede je Kanal: die Stellschrauben

| Stellschraube | r1 | r2 | r5 | ref | Vorschlag für uns |
|---|---|---|---|---|---|
| Kamera-Profil | Ease-in-out | Ease-in-out | linear | linear | Push-in linear, Akzentfahrten mit Ease-in-out |
| Push-in-Tempo | 9,5 %/s | 3,3 %/s | 7,2 %/s | 8 %/s | 7 %/s |
| Art des Push-in | Zoom ohne Parallaxe | Dolly | digital im Schnittprogramm | Dolly | Dolly (kostet in 3D nichts) |
| Takt | 44 pro min | 29 pro min | 40 pro min | 42 pro min | 40 pro min |
| Leerlauf-Atmen | aus | an | an | aus | an (billig, nimmt das Risiko „eingefroren“) |
| 2D-Overlays (Schallringe, UI-Karten, Sprechblasen) | in 56 % der Einstellungen | nein | nein | nein | sparsam, für Regeln und Orte (HyperFrames kann das gut) |
| Dauer-Partikel | Blätter, Dunst | nein | Atemdampf, Schnee | nein | je nach Szene |
| Wackeln | Sinus oder Zufall als Wort-Effekt | Ereignis-Stöße | keins | Angriffs-Wackeln | Ereignis-Stöße und Angriffs-Wackeln |
| Rollen | kaum | nein | nein | Dutch-Drift in 32 % | aus |
| Akzent-Zooms | nein | 2 schnelle Pushes | Snap-Zooms, Punch-in | nein | 2–3 Snap-Zooms pro Teil |
| Rahmen | Roulette-Intro, Titelkarte, Follow-Outro, Kopfzeile mit Uhr | kein Intro, kein Outro, Cliffhanger | keine Blenden, Pointe | Whip-Hook, Pointe | Hook ohne Intro, Cliffhanger, 1 s Karte „Teil 2“ |
| Figurenstil | 2D-Cutout in 3D | R6-Block | R6/R15 | R15 | Blockfigur im R6-Stil, eigene Gestaltung |
| Look-Technik | Low-Poly, flach, Dunst | Blender-Render (Tiefen- und Bewegungsunschärfe) | Roblox-Licht, Tiefenunschärfe | Roblox-Licht | Low-Poly, Nebel, Tiefenunschärfe |

### 1.9 Abnahme: So prüfen wir unsere Renders

Wir lassen dieselben Skripte über unsere Renders laufen und vergleichen mit den Zielwerten oben. Bei eigenen Videos stehen Schnitte und Wortzeiten schon in der Shotliste und in `timing.json`. Die Messung prüft dann, ob der Render auch zeigt, was geplant war.

| Prüfung | Skript (vorhanden, nicht im Repo) | Grenzwert |
|---|---|---|
| Schnitte und Längen | `horror-skripte/einstellungen.py` bzw. `skripte-bewegung-r5/einstellungen.py` (ffmpeg scene 0,3 und 0,08 plus Bilddifferenz) | Median 1,4–1,6 s, höchstens 4 s, 38–45 pro Minute |
| Schnitt zum Wort | `skripte-bewegung-r5/woerter.py`, gegen `timing.json` statt Whisper | ≥ 85 % innerhalb ±0,15 s |
| Kamerabewegung, Push-Tempo, Profil | `horror-skripte/fluss.py` + `auswertung.py` (oder die r5-Fassungen) | ≥ 90 % bewegt, Push 4–12 %/s, Starttempo ≥ 0,4 der Spitze |
| Parallaxe der Akzentfahrten | `horror-skripte/parallaxe2.py` | Zoom oben und unten verschieden |
| Stillstand | `skripte-bewegung/fluss.py` (Anteil starrer Bilder) | kein Abschnitt über 0,33 s |
| Aktion zum Wort | Sollwerte aus der Shotliste; Stichprobe mit Streifen in 10 fps | −0,2 bis +0,2 s |

Für die Fabrik sollten die Skripte später zu einem einzigen Messskript zusammengeführt werden.

---

## 2. Animations-Bibliothek (Mindestvorrat)

Legende:
- **Art:**
  - S = Schleife.
  - E = Einmal-Aktion, danach wird die Pose gehalten.
  - T = Tausch in 1 Bild.
  - P = prozedural mit Parametern.
- **Priorität:**
  - P0 = für Teil 1 nötig.
  - P1 = bald.
  - P2 = bei Bedarf.
- **Häufigkeit:** Zahl der Einstellungen in der jeweiligen Referenz; „–“ heißt nicht vorhanden.

### 2.1 Figur

| Baustein | Art | Dauer / Parameter | r1 | r2 | r5 | ref | Prio |
|---|---|---|---|---|---|---|---|
| Pose halten (stehen), optional Leerlauf | S | Atmen 0,15–0,5 % der Bildbreite, Periode 3–4 s (Schätzung) | 11 Halteposen | ~10 mit Leerlauf | ~95 | 31 | P0 |
| Gehen (vorn, seitlich, hinten) | S | Schritt ~0,3 s, mit Armschwung | 7 (inkl. Klettern) | ~12 | 12 | 6 (+1 mit Hinsetzen) | P0 |
| Kopf drehen / umdrehen | E | Kopf 0,2 s, ganzer Körper 0,2–0,4 s | 3 Ansichtswechsel | 4 | 4 | 4 | P0 |
| Zeigen / Arm heben / Geste | E | 0,1–0,4 s, dann halten | – | 4 (Warngeste, 2× Gebärden, Lichtschalter) | 12 | 5 (4× Reden mit Geste, Geld geben) | P0 |
| Erschrecken (Arme hoch, zurückzucken) | E | 0,2–0,3 s, leichtes Nachwippen | (nur Gesichtstausch S6) | 2 | (Schrei-Gesicht) | 2 (Weinen, Hand vor dem Mund) | P0 |
| Sitzen / Liegen (Posen) | Pose | – | – | – | ~25 (Sitzen, Liegen, Kauern) | 8 (4× sitzt, 4× gefesselt) | P0 |
| Gesicht tauschen (Ausdruck) | T | 6–8 Gesichter: neutral, erschrocken, besorgt, Augen zu, Lächeln, Schrei | ~5 Gesichter | ≥ 7 | ~18 | ≥ 8 | P0 |
| Laufen / Rennen | S | quer durchs Bild ~1,5 s, geduckt | – | 1 (+3× Radfahren) | – | 3 | P1 |
| Ducken / Kauern / Ohren oder Mund zuhalten | E + Pose | 0,4 s | Kauern, Ärmel beißen (als Posen) | 3 | (in den Kauer-Posen) | – | P1 |
| Hinsetzen / Aufstehen | E | 0,5–1,2 s | – | – | – | 4 | P1 |
| Klopfen / Hämmern | S | 2–3 Schläge/s (Schätzung) | – | – | – | 7 | P1 |
| Tür öffnen oder schließen, Schloss drehen | E | 0,3–0,6 s (Schätzung) | – | 2 | – | 6 | P1 |
| Klettern (Treppe, Luke, Fenster) | S/E | 0,8 s | 1 | – | 1 | 1 | P1 |
| Fallen / Sinken / Stürzen | E | 0,2–0,3 s kippen, dann sinken | – | – | 2 (+ liegt am Grund) | 1 | P1 |
| Blinzeln | T | alle 1–2 s | – | – | – | ja | P1 |
| Mundformen bei wörtlicher Rede | T | Wechsel alle 0,1–0,3 s, 3–4 Formen | – | – | 8 | (4× Reden) | P1 |
| Zittern | P | Rauschen am Kopf, Gesicht im Takt | (Schweißtropfen) | 1 | – | – | P2 |
| Umarmen / Handschlag (zu zweit) | E | 0,4–0,6 s (Schätzung) | – | – | 1 | 3 | P2 |
| Packen / Mitschleifen / Stoßen (mit Monster) | E/S | – | – | – | – | 4 | P2 |
| Radfahren | S | Tretzyklus | – | 3 | – | – | P2 |
| Weinen (Träne als Schleife) | S | Periode 0,6 s | 1 | – | – | 1 | P2 |

### 2.2 Monster

| Baustein | Art | Dauer / Parameter | r1 | r2 | r5 | ref | Prio |
|---|---|---|---|---|---|---|---|
| Stehen, still (oft Großaufnahme) | Pose | – | 10 von 15 Auftritten | – | – | 9 von 21 | P0 |
| Stapfen / Gehen / Schleichen | S | langsam, schwer | – | ~8 | 1 | 7 | P0 |
| Kopf bzw. Lautsprecher zur Kamera drehen | E | 0,2–0,7 s, Ease-in | 2 | ~5 | – | (senkt den Kopf auf die Kamera, 1) | P0 |
| Vorbeugen 60–70° | E | über die Einstellung, gleichmäßig (~1,4 s) | – | (Kopf senken, 1) | – | 4 | P1 |
| Maul aufreißen | T | 0–0,14 s nach „open“ | – | 1 | – | 3 | P1 |
| Greifen / Arm heben | E | 0,4–0,8 s (Schätzung) | 1 | – | – | 1 | P1 |
| Glühen / Pulsieren | P | 5 Hz | 4 | – | – | – | P2 |
| Aus dem Boden steigen | E | ~1 s, mit Staub | – | 1 | – | – | P2 |
| Maul an die Scheibe drücken, Kiefer bewegen | E | – | – | 1 | – | – | P2 |
| Leerlauf-Wiegen (Arme, Krallen) | S | – | – | – | 1 | – | P2 |

### 2.3 Kamera-Bausteine

| Baustein | Parameter | r1 | r2 | r5 | ref | Prio |
|---|---|---|---|---|---|---|
| Push-in (Dolly oder Zoom) | 4–12 %/s, linear oder mit Ease | 20 | 46 | 81 | ~85 | P0 |
| Pull-out / Dolly-out | −4 bis −8 %/s | 1 | 3 | 2 | ~13 | P0 |
| Seitenfahrt (Truck) mit Vordergrund-Wischer | langsam 20–120 px/s, schnell 560–1600 px/s | 2 | ~10 (Seitenfahrt oder Schwenk) | 2 | ~8 | P0 |
| Kran- oder Tilt-Enthüllung, Ankunft aufs Nomen | Ease-in-out, Spitze 360–3000 px/s | 5 | 6 | 2 | – | P0 |
| Folgefahrt hinter oder neben der Figur | gleicher Abstand | 2 | 2 | 1 | 3 | P0 |
| Statisch | nur bei Inserts | 4 | 9 | 4 | ~6 | P0 |
| Wackeln als Ereignis | 0,4–0,5 s, abklingend | 2 | 2 | – | 3 | P0 |
| Kranabstieg oder Drohnenflug zur Eröffnung | Ease-out | 1 | 1 (+3 Drohnenblicke) | 1 (Luftbild) | – | P1 |
| Orbit / Bogenfahrt | 5–25 °/s | – | 1 | 2 | 1 | P1 |
| Whip innerhalb der Einstellung | 0,2–0,5 s, bis 180° | – | – | 1 | 2 (mit Hook) | P1 |
| Sturz- oder Tauchfahrt, Flug durch die Tür | Ease-in, auf das 1,9- bis 5-Fache | – | 1 | 3 | – | P1 |
| Snap-Zoom / Punch-in | +13–21 % in 1–2 Bildern; auf das 1,5-Fache in 3–6 Bildern | – | (2 schnelle Pushes) | 4 | – | P1 |
| Dutch-Drift / Rollen | 0,5–2 °/s | 1 | – | – | 32 % | P2 |
| Zeitlupe | – | – | 1 | – | – | P2 |

### 2.4 Umgebung und Effekte

| Baustein | Parameter | r1 | r2 | r5 | ref | Prio |
|---|---|---|---|---|---|---|
| Licht aus oder an | 0,3–1 s | 1 | 1 | 3 | 1 | P0 |
| Ereignis-Partikel (Staub, Spritzer, Glas) | auf das Wort | – | 2 | 1 | 1 | P1 |
| Dauer-Partikel (Atemdampf, Schnee, Blätter) | je nach Szene | 1 | – | ≥ 25 | – | P1 |
| 2D-Overlays (Schallringe, UI-Karte, Sprechblase, Karten-Insert) | Karte springt in 0,27 s ein | 22 | – | – | – | P1 |
| Nachbearbeitung: Tiefenunschärfe, Bewegungsunschärfe, Korn, Vignette, Nebel | – | Korn, Vignette, Dunst | Tiefen- und Bewegungsunschärfe | Tiefenunschärfe | – | P1 |
| Farbstimmung kippen (Rot) | 0,3–0,5 s | 2 | – | – | – | P2 |
| Physik-Objekt fällt oder springt | – | – | 4 | – | – | P2 |

### 2.5 Wie weit reicht der Vorrat?

Die P0-Bausteine sind 18 Stück:
- 7 für die Figur,
- 3 für das Monster,
- 7 für die Kamera,
- 1 Lichteffekt.

Ausgezählt an ref-concet, das als einzige Referenz eine vollständige Etikettenliste hat:
- Die P0-Bausteine decken etwa 79 von 118 Einstellungen ab, also zwei Drittel.
- Mit P1 (gut 35 Bausteine insgesamt) sind es etwa 107 von 118, gut 90 %.
- Die übrigen Einstellungen sind einmalige Aktionen der jeweiligen Geschichte, zum Beispiel Geld geben, Tisch schlagen oder Werfen.

---

## 3. Folgen für die Herstellung

### 3.0 Wo der Aufwand steckt (unabhängig vom Weg)

Pro Minute fertiges Video verlangen die Referenzen etwa:
- 29–44 Einstellungen, jede mit eigener Kamerafahrt (2–3 Keys) und eigenem Bildausschnitt,
- 11–23 Einzelaktionen von Figuren oder Monster, jeweils genau auf ein Wort,
- etwa 7 Gesichtstausche (r5) plus Blinzeln,
- 4–10 Akzentfahrten und 1–2 Licht- oder Partikelereignisse,
- 1–3 Schauplätze (Sets), die über den Teil und die ganze Serie wiederverwendet werden.

Der Kostentreiber ist die Handarbeit pro Einstellung: 40-mal „Kamera setzen, Aktion setzen, auf das Wort legen“. Wer das von Hand macht (Roblox mit Moon Animator, Blender mit der Maus), zahlt es in jeder Minute neu. Wer es aus Wortzeiten und einer Shotliste erzeugt, zahlt es einmal beim Bau der Bausteine.

### 3a) Roblox Studio mit Moon Animator 2 (Linus' PC, Windows, RTX 5070 Ti)

**Was passt:**
- r5 und ref sind sehr wahrscheinlich genau so gemacht. Das ist das Urteil der Analysen; einen Beweis wie ein Wasserzeichen gibt es nicht. Der Roblox-Look ist auf TikTok ein Genre-Signal.
- Die Standard-Animationen jedes Roblox-Avatars (Animate-Skript) liefern schon:
  - Idle, Gehen, Laufen, Springen, Fallen, Klettern, Sitzen,
  - dazu die Emotes Winken, Zeigen, Jubeln, Lachen und Tanzen.
  - Damit sind aus Abschnitt 2 abgedeckt: Pose mit Leerlauf, Gehen, Laufen, Klettern, Fallen, Sitzen und Zeigen.
- Gesichter sind Decals, ein Tausch ist also nur eine Eigenschaft.
- Eingebaut sind Gelände, Wasser, Atmosphere, Bloom, SunRays, DepthOfField und ParticleEmitter (Atemdampf, Schnee). Die Toolbox liefert Häuser, Bäume und Möbel.
- Die RTX 5070 Ti spielt solche Szenen locker in Echtzeit ab.

**Was fehlt oder kostet:**
- **Eigene Animationen:** Erschrecken, Klopfen, Ducken, Schloss drehen, Hinsetzen und die Monster-Aktionen müssen in Moon Animator von Hand gekeyt werden. Bei R6 mit wenigen Gelenken dauert das etwa 10–30 min pro Animation (Schätzung). Das ist einmalig, danach lassen sie sich als Animation speichern.
- **Kein Offline-Render:**
  - Studio spielt in Echtzeit ab, aufgenommen wird mit OBS. Dabei können Bilder doppelt sein oder fehlen. Abhilfe: mit 60 fps aufnehmen und auf 30 fps herunterrechnen.
  - Bewegungsunschärfe gibt es nicht. r2 hat sie, r5 und ref nicht.
- **Nacharbeit:** Schnitt, Zoom und Untertitel kommen danach im Schnittprogramm dazu. r5 macht auch den Dauer-Zoom digital.
- **Nur am PC:** Studio läuft nur mit Bedienoberfläche auf Windows oder Mac, nicht in der Cloud. Linus muss also für jedes Video am PC sitzen.
- **Halbautomatik ist möglich**, Bauaufwand etwa 30–60 h (Schätzung), und es bleibt eine Echtzeit-Aufnahme am PC:
  1. Ein eigenes Studio-Plugin (Luau) liest eine Shotliste, die als JSON in ein ModuleScript eingefügt wird.
  2. Es setzt pro Einstellung die Kamera-CFrames mit Ease, spielt die Animationen ab und tauscht die Decals zu den Wortzeiten.
  3. OBS nimmt den ganzen Durchlauf auf.
  4. Ein ffmpeg-Skript setzt danach die Schnitte aus der Shotliste.
- **Rechte:** Videos aus Roblox sind grundsätzlich erlaubt. Vorher nachlesen sollte man die Bedingungen für Monetarisierung, für fremde Toolbox-Modelle und für das Plugin (ob und was es kostet, steht im Creator Store). Das ist nicht geprüft.

**Aufwand pro Minute (Schätzung):**
- Von Hand 6–10 h: 40 Einstellungen zu je 5–10 min, dazu Aufnahme und 1–2 h Schnitt.
- Pro Geschichte zusätzlich 2–5 h für das Set.
- Mit eigenem Plugin 2–3 h pro Minute; der PC muss dabei laufen.

### 3b) Blender (auf Linus' PC mit GPU oder in der Cloud ohne GPU)

**Was passt:**
- r2 ist sehr wahrscheinlich so gemacht: Eevee mit Bewegungsunschärfe, Bokeh, weichen Schatten und Rigid-Body-Physik. Von den vier Wegen hat Blender die höchste Qualität.
- **Komplett skriptbar:**
  - Aufruf: `blender -b -P baue.py -- shotliste.json`.
  - Das Skript setzt Kamera-Keys mit Bézier-Ease, legt Aktionen als NLA-Strips auf die Wortzeiten, tauscht Gesichtstexturen und rendert mit 30 fps.
  - Die Shotliste ist dieselbe wie bei Weg 3c.
- **Animationen:**
  - Eine eigene Blockfigur (6 Quader, 5 Gelenke) ist in bpy schnell gebaut.
  - Mixamo (kostenlos mit Adobe-Konto) oder CC0-Pakete (Quaternius, KayKit) liefern Gehen, Laufen, Sitzen, Fallen und mehr für humanoide Rigs.
  - Diese auf eigene Figuren zu übertragen (Retargeting), kostet Zeit.

**Rechnen:**
- **Auf Linus' PC (RTX 5070 Ti):** Eevee braucht bei 1080 × 1920 für Low-Poly-Szenen etwa 0,2–1 s pro Bild (Schätzung). Das sind 6–30 min pro Minute Video. Cycles mit Entrauschen dauert deutlich länger.
- **In der Cloud:**
  - Geprüft: keine GPU (`nvidia-smi` fehlt), 4 CPU-Kerne, Blender ist nicht installiert.
  - Eevee bräuchte dort Software-OpenGL, Cycles liefe auf der CPU. Beides dürfte Stunden pro Minute Video kosten (Schätzung, nicht getestet).
  - Praktisch heißt das: Blender läuft auf dem PC oder auf einer gemieteten GPU.
- **Brücke zwischen Cloud und PC:**
  - Shotliste und bpy-Skripte entstehen in der Cloud (Claude).
  - Gerendert wird auf dem PC, über eine Ordner-Freigabe per Remote Control oder per Git-Pull.
  - Linus muss den PC anlassen, aber nicht selbst animieren.

**Aufwand:**
- Einmalig etwa 50–100 h (Schätzung): Figuren, 25–35 Animationen, Kamera-Bausteine, 3–5 Sets, Licht und Look, Compiler.
- Danach pro Minute 1–2 h Arbeit von Menschen: Shotliste prüfen, Probebilder ansehen, nachbessern. Dazu kommt die Rechenzeit auf dem PC.

### 3c) three.js im Browser, gerendert mit HyperFrames

**Gemessen in diesem Lauf:**
- **Testszene** (`/tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/scratchpad/bench3d/index.html`):
  - Low-Poly-Wald mit 400 Bäumen (instanziert) und Nebel,
  - Blockfigur im R6-Stil mit prozeduralem Gehzyklus und Kopfdrehung in 0,2 s,
  - Monster, dessen Lautsprecher sich in 0,6 s mit Ease zur Kamera drehen,
  - Folgefahrt mit Ease,
  - Richtungslicht mit 2048er-Schattenkarte (PCF soft), Kantenglättung, 1080 × 1920.
- **Render:** `npx hyperframes render`, Version 0.8.206, Software-GPU, 1 Worker, Aufnahme per beginframe.
  - 90 Bilder in 32,1 s, also 0,36 s pro Bild.
  - Das sind etwa 11 min Rechenzeit pro Minute Video, in der Cloud ohne GPU.
  - Das Bild stimmt: Bäume, Schatten, Nebel, Figur und Monster sind zu sehen (`bench-tafel.jpg`).
- **Hochgerechnet, nicht gemessen:**
  - Bewegungsunschärfe aus 4 Unterbildern kostet etwa das Vierfache, rund 45 min pro Minute Video.
  - Mehr als 1 Worker wurde nicht getestet.
  - Auf einem PC mit GPU läuft es nahe Echtzeit.

**Was passt:**
- **Passt direkt in die Fabrik:**
  - `voice.py` liefert die Wortzeiten (`timing.json`).
  - `compose.py` legt heute schon jedes Element auf sein Wort.
  - Schnitt auf den Wortbeginn, Aktion auf das Schlüsselwort und Untertitel-Pop ergeben sich exakt aus diesen Zeiten, ohne Handarbeit.
- **Deterministisch:** Über `hf-seek` ist jedes Bild eine Funktion der Zeit. Das läuft nachts in der Cloud, ohne Linus' PC.
- **Kamera:** Die vorherrschende Bewegung ist im Code trivial.
- **Figuren:** Die Figurenbewegung der Referenzen ist sparsam (eine Aktion, dann halten, R6 mit 5 Gelenken) und lässt sich prozedural schreiben:
  - Gehen ist ein Sinus an Hüften und Schultern (im Test 4 Zeilen).
  - Zeigen ist eine Schulterdrehung mit Ease.
  - Die Kopfdrehung ist eine Halsdrehung.
- **2D-Ebenen** sind die Kernkompetenz von HyperFrames: Untertitel, UI-Karten, Schallringe, Sprechblasen, Karten-Inserts und die Karte „Teil 2“. Der Overlay-Stil von r1 kostet hier fast nichts.
- **Prüfbar** mit `hyperframes check` und `snapshot` sowie mit denselben Mess-Skripten wie die Referenzen.

**Was fehlt oder kostet:**
- **Qualitätsdecke unter Blender:**
  - Es gibt keine globale Beleuchtung.
  - Tiefen- und Bewegungsunschärfe gibt es nur als Nachbearbeitung, und die kostet Rechenzeit.
  - Der Look von r1, r5 und ref (flach, Low-Poly, Nebel) ist erreichbar, die Render-Qualität von r2 nur annähernd.
- **Figuren:**
  - Detaillierte Figuren sind im Code schwer, Blockfiguren leicht.
  - Fremde Animationen (Mixamo, FBX) müssten nach GLB umgewandelt und auf das Rig übertragen werden. Mit eigener R6-Blockfigur und prozeduralen Animationen entfällt das.
- **Sets:**
  - Gebaut werden sie aus CC0-Paketen (Kenney, Quaternius, KayKit; Lizenz je Paket prüfen) oder prozedural.
  - Pro Schauplatz einmalig etwa 2–6 h (Schätzung), danach für die ganze Serie nutzbar.

**Aufwand:**
- Einmalig etwa 40–80 h (Schätzung), überwiegend in Claude-Sitzungen; Linus schaut Proben an. Gebaut werden Rig und Gesichtsatlas, 25–35 Animationen, 12 Kamera-Bausteine, 3–5 Sets, der Shotlisten-Compiler und das Messtor.
- Danach pro Minute 0,5–1,5 h für Menschen: Shotliste und Kontaktbogen prüfen.
- Rechenzeit nachts etwa 11–45 min pro Minute Video.

### 3d) KI-Video

**Was passt:** ein reicher Look ohne eigenen Asset-Bau. Zugang wäre da: Der ElevenLabs-Connector kann Videos generieren, HeyGen ist über media-use erreichbar.

**Was gegen die Spezifikation steht:**
- **Keine bildgenaue Steuerung:** Aktion auf ±0,2 s zum Wort, Tempoprofil der Kamera und Ankunft genau aufs Nomen lassen sich nicht vorgeben, nur erbitten.
- **Menge:** 29–44 Einstellungen pro Minute ergeben mit Ausschuss (Schätzung: Faktor 2–3) etwa 80–130 Generierungen pro Minute Video, bezahlt pro Sekunde.
- **Konsistenz:** Dieselbe Figur, dasselbe Monster und derselbe Ort über 40 Einstellungen und mehrere Teile hinweg sind die Schwachstelle von KI-Video. Genau das verlangt aber das Serienformat.
- **Kennzeichnung:** KI-Inhalte müssen auf TikTok gekennzeichnet werden. Wie das mit dem Creator-Programm zusammengeht, ist nicht geprüft.

**Aufwand pro Minute (Schätzung):** 2–4 h für Auswahl und Schnitt plus Generierungskosten; wenig Einmalaufwand. Taugt höchstens für einzelne Inserts (Eröffnungsflug, Monster-Enthüllung), nicht als Hauptweg.

### 3e) Vergleich

| | (a) Roblox mit Moon Animator | (b) Blender | (c) three.js mit HyperFrames | (d) KI-Video |
|---|---|---|---|---|
| Einmalaufwand (Schätzung) | 10–20 h (+30–60 h für ein eigenes Plugin) | 50–100 h | 40–80 h | 5–10 h |
| Menschliche Arbeit pro Minute Video (Schätzung) | 6–10 h (2–3 h mit Plugin) | 1–2 h | 0,5–1,5 h | 2–4 h + Kosten |
| Rechenzeit pro Minute Video | Echtzeit-Aufnahme | PC: 6–30 min (Schätzung); Cloud: Stunden | Cloud: 11 min gemessen (ohne Bewegungsunschärfe) | extern |
| Läuft ohne Linus' PC | nein | praktisch nein | ja | ja |
| Wortgenau und automatisch | nur mit eigenem Plugin | ja | ja (Pipeline vorhanden) | nein |
| Qualitätsdecke | Original-Roblox-Look | am höchsten | mittel (Low-Poly + Nachbearbeitung) | hoch, aber inkonsistent |
| Konsistenz über eine Serie | gut | gut | gut | schwach |

### 3f) Bausteine einmal bauen, per Shotliste zusammensetzen

Für die Wege (b) und (c) ist der Aufbau gleich gedacht, für (a) als Plugin. Einmal gebaut werden:
1. **Figuren-Rig:**
   - Blockfigur mit Root, Hals, 2 Schultern und 2 Hüften, darunter ein Kleckschatten.
   - Ein Gesichtsatlas mit 6–8 Gesichtern, 3–4 Mundformen und Blinzeln.
2. **Animationsvorrat** aus Abschnitt 2 (P0 + P1, gut 35 Bausteine):
   - Jeder Baustein hat Parameter (Dauer, Richtung, Ziel).
   - Dazu einen Anker: Er legt fest, ob der Beginn oder das Ende der Aktion auf das Wort fällt.
3. **Monster-Kits** für 2–3 Monster: Stehen, Stapfen, Kopf drehen, Vorbeugen, Maul aufreißen, Greifen.
4. **Kamera-Bausteine** (12) als Funktionen mit den Parametern Typ, Ziel, Tempo und Profil. Die Keys liegen außerhalb der Schnittgrenzen.
5. **Sets** mit benannten Kamerapunkten und Ankern (z. B. `turm.fenster`, `markt.gang`) und mit Lichtzuständen: Tag, Abend, Nacht, Licht aus.
6. **Effekte:** Licht aus, Ereignis-Partikel, Wackeln, Rotfärbung, Schallringe, UI-Karte, Untertitel-Pop, Karte „Teil 2“, Hook-Whip.
7. **Messtor:** ein Skript, das den Render gegen die Abschnitte 1.2 bis 1.6 prüft.

Pro Video neu sind nur:
- Skript und Stimme (daraus die Wortzeiten),
- die Shotliste: Claude schreibt sie aus Skript und Wortzeiten, Linus prüft sie,
- selten ein neues Set oder Monster.

Eine Einstellung in der Shotliste (Beispiel):

```json
{
  "id": "S07",
  "schnitt_auf_wort": 41,
  "set": "turm.innen", "licht": "abend",
  "kamera": {"typ": "push_in", "ziel": "held.kopf", "rate": 0.07, "profil": "linear"},
  "figuren": [{"wer": "held", "pose": "gelaender_halten", "gesicht": "besorgt"}],
  "aktionen": [{"wer": "monster", "was": "kopf_zur_kamera", "wort": 44, "anker": "ende", "dauer": 0.5}],
  "effekte": [{"was": "schallringe", "ab_wort": 44}],
  "untertitel": "pop"
}
```

**Was der Compiler tut:**
- Er setzt Wortindex in Zeit um, mit den Werten aus `timing.json`.
- Schnittzeit = Wortbeginn minus 1 Bild.
- Die Kamera-Keys liegen bei −15 % und 115 % der Einstellungsdauer.
- Jede Aktion wird so gelegt, dass ihr Anker auf das Wort fällt.

**Prüfregeln vor dem Render:**
- Einstellungslänge 0,7–4 s.
- Mindestens 90 % der Einstellungen mit Kamerabewegung.
- Höchstens eine Hauptaktion pro Einstellung.
- Eine Akzentfahrt alle 6–10 s.

---

## 4. Empfehlung

**Hauptweg (c): three.js in HyperFrames.** Dazu eigene Blockfiguren im R6-Stil (eigene Gestaltung, keine Roblox-Marken), Low-Poly-Sets und eine Shotliste aus den Wortzeiten.

Begründung:
1. **Kamera und Schnitt tragen die Bewegung.** Die gemessene Bewegung besteht zum größten Teil aus Kamera und Schnitt-Takt. Beides lässt sich aus Wortzeiten exakt erzeugen, und die Fabrik hat die Wortzeiten schon.
2. **Die Figurenanimation ist sparsam.** Pro Einstellung gibt es eine Aktion, danach wird gehalten, bei 5 Gelenken. Das ist prozedural machbar. Der Test hat Gehzyklus, Kopfdrehung und Monsterdrehung in wenigen Zeilen gezeigt.
3. **Es rendert in der Cloud ohne GPU.** Gemessen sind 0,36 s pro Bild, also etwa 11 min pro Minute Video. Das läuft nachts ohne Linus' PC.
4. **Am wenigsten Handarbeit.** Pro Minute bleiben etwa 0,5–1,5 h (Schätzung), und das Ergebnis ist gegen die Spezifikation messbar.
5. **Blockfiguren reichen.** Drei der vier Referenzen nutzen sie. r1 zeigt, dass auch einfache Figuren 44 Schnitte pro Minute tragen.

**Ausbau (b): Blender auf Linus' PC.** Nur, wenn nach dem ersten Probe-Teil sichtbar Bildqualität fehlt (Licht, Unschärfen, Physik wie bei r2). Die Shotliste bleibt gleich, der Compiler bekommt nur ein zweites Ziel (bpy). Gerendert wird dann auf der RTX 5070 Ti.

**(a) Roblox Studio** lohnt sich, wenn Linus selbst gern von Hand animiert und den echten Roblox-Look will. Das ist Handwerk, keine Fabrik: 6–10 h pro Minute, und für jedes Video muss der PC laufen.

**(d) KI-Video** kommt als Hauptweg nicht in Frage, weil Timing und Serien-Konsistenz fehlen. Höchstens einzelne, gekennzeichnete Inserts.

**Eigene Monster statt fremder Figuren.** Siren Head stammt von Trevor Henderson. Für ein monetarisiertes Format sind eigene Monster der sichere Weg.

**Nächster Schritt (Vorschlag):**
1. Einen Probe-Teil von 65 s in (c) bauen: 2 Sets (Wald, Turm innen), 1 Held, 1 Monster, die 18 P0-Bausteine.
2. Mit den Mess-Skripten gegen die Abschnitte 1.2 bis 1.6 prüfen und neben r5 und ref legen.
3. Linus schaut es an und entscheidet: bei (c) bleiben oder auf (b) ausbauen.

---

### Dateien

- Diese Spezifikation: `/tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/scratchpad/horror-analyse/bewegung/bewegungs-spec.md`
- Kanal-Spezifikationen als JSON:
  - `/tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/scratchpad/horror-analyse/bewegung/r1-horrorrobs/bewegungs-spec.json`
  - `/tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/scratchpad/horror-analyse/bewegung/r2-jexario/bewegung-kennzahlen.json`
  - `/tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/scratchpad/horror-analyse/bewegung/r5-yougplat/bewegungs-spec.json`
  - `/tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/scratchpad/horror-analyse/bewegung/ref-concet/bewegungs-spec.json`
- Render-Test three.js:
  - `/tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/scratchpad/bench3d/index.html`
  - `/tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/scratchpad/bench3d/bench.mp4`
  - `/tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/scratchpad/bench3d/bench-tafel.jpg`
- Mess-Skripte:
  - `/tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/scratchpad/horror-skripte/` (r1)
  - `/tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/scratchpad/skripte-bewegung/` (r2)
  - `/tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/scratchpad/skripte-bewegung-r5/` (r5)
  - `/tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/scratchpad/skripte-bewegung-concet/` (ref)
- Im Repo wurde nichts geändert.
