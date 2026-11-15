# Musikalische Grammatik der Referenz-Betten

Stand 15.11.2026. Gemessen an den Demucs-Stems der hochgeladenen Referenzvideos (Musik ohne Stimme, `bett-getrennt.wav`, `stem-other.wav`, `stem-bass.wav`; liegen nur im Scratchpad, nie im Repo). Werkzeuge: `analyse/*.py` (librosa 0.11, scipy), Ergebnisse als Zahlen in `messwerte/analyse-*.json`.

Behalten wurden nur **Regeln und Statistiken**: Tonart-Typ, Akkordtypen, Grundton-Bewegungen, Intervall-Anteile, Register, Raster, Klangfarbe, Hall, Verstimmung, Lautheit. Die Analyse-Skripte geben Tonfolgen höchstens zur Kontrolle auf stderr aus und speichern sie nicht. Die eigenen Stücke in `komposition.py` übernehmen keine Melodie, keine Akkordfolge und kein Muster aus den Referenzen.

Kürzel: r2, r5, ref0, r1 sind die Referenzvideos aus `docs/anhang-b-stimme-ton.md` (B4).

## Messverfahren in einem Satz je Größe

| Größe | Verfahren |
|---|---|
| Verstimmung | `librosa.estimate_tuning` (Auflösung 1 Cent) und Momentanfrequenz des Orgelpunkts im ±2-%-Band |
| Tempo, Schleife | Autokorrelation des Onset-Flusses (Hop 1,5 ms), über 1 und 3 Schleifenlängen verfeinert; Tempo = Schläge / Schleife |
| Raster | Onset-Stärke auf das Sechzehntelraster der Schleife gefaltet; Autokorrelation der Achtel (3er- oder 4er-Gruppen) |
| Akkorde | Chroma je Takt gegen Dreiklang-Schablonen (Dur, Moll, übermäßig, vermindert, sus4); nur Typ-Anteile und Grundton-Schritte behalten |
| Noten | Klavierrolle aus der CQT: je Halbton Anstieg ≥ 9 dB in 60 ms, ≥ −28 dB, lauter als beide Nachbar-Halbtöne |
| Klangfarbe | Langzeitspektrum: Spitzen über 1,8 kHz als Vielfache der Grundtöne (harmonisch 2×, 3× oder Kammzinke 6,27×, 17,55×); Spektrum 30–150 ms nach Einzelanschlägen |
| Tonlänge | Hüllkurve des Orgelpunkt-Tons nach jedem Anschlag (Median über 150–200 Anschläge) |
| Hall | Seite/Mitte (dekorrelierter Hallanteil) und freie Abklingstrecken in Oktavbändern (`analyse/hallschaetzer.py`) |
| Lautheit | Kurzzeit-Lautheit 3 s (BS.1770), Einbrüche ≥ 9 dB unter dem gleitenden Median, gegen das Transkript gelegt |

## Stil 1: Spieluhr-Arpeggio (nach r2)

| Merkmal | Messwert | Regel für eigene Stücke |
|---|---|---|
| Tonart, Modus | Dur. Akkordtypen: Dur 49 %, Moll 34 %, übermäßig 16 %. Tonika, parallele Molltonika, Subdominante, Moll-Subdominante, übermäßiger Dreiklang mit der Tonika als gemeinsamem Ton | Dur-Wiegenlied, das kippt: Moll-Subdominante und übermäßiger Dreiklang als „falsche“ Farben, je 1–2 pro Schleife |
| Harmonischer Rhythmus | 1 Akkord je Takt, in 75 % der Takte ein Wechsel. Grundton-Schritte: große Terz auf 19 % (ab 6 %), kleine Terz ab 20 %, Halbton ab 14 % | Terz-Verwandtschaften und Halbton-Rückungen statt Quintfall |
| Melodik | Gebrochene Dreiklänge, Oberstimme fast ohne Schritte: Schritte 1 %, Terz/Quarte 38 %, Sexte und größer 51 %, Tonwiederholung 10 %. Richtungswechsel 66 % | Nur Akkordtöne, keine Sekunden zwischen Nachbartönen |
| Orgelpunkt | Ein Ton der oberen Mittellage (E5, Grundton der Tonart) kommt in 99 % der Takte vor und trägt 21 % aller Anschläge; er wird neu angeschlagen, nicht gehalten | Ein wiederkehrender Ton je Takt, etwa jeder vierte Anschlag |
| Rhythmus | Gerade Achtel, Sechzehntel fast nie (Onset-Stärke auf Achteln 1,75, dazwischen 0,16). 97 % der Achtel besetzt, 1,45 Töne je Einsatz (oft Zweiklänge). Betonung: Takt-Eins, schwächer die letzte Achtel als Auftakt | Durchlaufende Achtel, Zweiklang auf Zählzeit 1 und 3, Auftakt-Akzent |
| Tempo, Form | 111,7 BPM, 4/4. Schleife 8 Takte = 17,19 s, Schleifen untereinander 92 % ähnlich (Chroma) | 112 BPM, 8-Takt-Schleife, wörtlich wiederholt, nur Instrumentierung wechselt |
| Register | Anschläge C♯4–H5 (p5–p95, 285–1014 Hz), Median C♯5. Unter 250 Hz nur 0,4 % der Energie: **kein Bass** | E4–H5, kein Bass |
| Klangfarbe | Fast Sinus: 3. Teilton −33 dB, 2. −39 dB, Kammzinken-Teilton 6,27× nur −52 dB. Hüllkurve: Anschlag-Spitze fällt in 50 ms um 7 dB, danach etwa 40 dB/s (mit Raum) | Weiche Spieluhr/Celesta mit schwachem 3. Teilton, kurzer „Ping“ im Anschlag |
| Hall | Seite/Mitte −7,0 dB (Höhen −5 dB, Tiefen −8 dB), freie Abklingstrecken ≈ 0,9–1,1 s | Kleiner Saal, RT60 um 1,2 s, mäßig nass |
| Verstimmung | +46 Cent (Orgelpunkt: +42 ± 6 Cent), stabil, kein Leiern | +46 Cent, kein Wow |
| Lautheit | Sehr flach: LRA 4,3 LU, Kurzzeit-Streuung 2,0 LU. 11,9 LU unter der Stimme | Keine Schwellungen in der Musik selbst |
| Wegfall | Musik setzt 0,25–3 s aus, genau nach Schockzeilen („… the next morning, he was gone“, „Everyone froze.“), danach Effekt-Schlag und Wiedereinsatz | Wegfall vor der Pointe, Wiedereinsatz auf einer Takt-Eins |

## Stil 2: Wiegenlied-Spieluhr (nach r5)

| Merkmal | Messwert | Regel für eigene Stücke |
|---|---|---|
| Tonart, Modus | Dur. Akkordtypen: Dur 45 %, Moll 33 %, übermäßig 19 %, vermindert 2 %. Tonika, übermäßige Tonika, parallele Molltonika, Mediante in Moll und Dur | Wie Stil 1, aber mehr übermäßige Klänge und Medianten |
| Harmonischer Rhythmus | 67 % der Takte mit Wechsel. Grundton-Schritte: kleine Terz auf 16 %, kleine Terz ab 14 %, große Terz auf 11 %, Quarte auf 10 % | Medianten-Rückungen, ein Akkord je Takt |
| Melodik | Gebrochene Dreiklänge, Oberstimme ohne Schritte: Schritte 0 %, Terz/Quarte 37 %, ab Sexte 55 %. Richtungswechsel 70 % (wiegend auf-ab) | Wiegende Dreiklangsbrechung, keine Sekunden |
| Orgelpunkt | Die Terz der Tonart (F♯5) in 98 % der Takte, 20 % der Anschläge | Terz als wiederkehrender Ton |
| Rhythmus | Gerade Achtel, keine Sechzehntel. 82 % der Achtel besetzt, 1,22 Töne je Einsatz. Achtel bilden Dreiergruppen (Autokorrelation bei 3 Achteln 0,31, bei 4 Achteln −0,16): wiegende 3+3+2 | Achtel in 3+3+2, gelegentlich eine Achtel Pause |
| Mechanik | Anschlagstärke sehr gleichmäßig (Streuung 2,9 dB), Raster ± 23 ms | Kaum Dynamik, kleine Zeit-Streuung |
| Tempo, Form | 93,8 BPM, 4/4. Schleife 8 Takte = 20,46 s, halbe Schleife 10,23 s abgeschlossen | 94 BPM, 8-Takt-Schleife aus zwei 4-Takt-Hälften |
| Register | H3–A5 (241–860 Hz), Median D5. Unter 250 Hz 4–7 %: einzelne tiefe Grundtöne auf der Takt-Eins | Spieluhr in H3–A5, tiefer Grundton je Takt sehr leise |
| Klangfarbe | Echte Kamm-Spieluhr: Teiltöne bei 6,27× (2,5–6 kHz nur 1 dB unter 1–2,5 kHz) und 17,5× (Spitzen 7–9 kHz) der Grundtöne. Anschlag wie Stil 1 (−7 dB in 50 ms, dann ≈ 40 dB/s) | Additive Kammzinke mit unharmonischen Teiltönen 6,27× und 17,55×, Anschlagklick |
| Hall | Seite/Mitte −7,1 dB, über alle Bänder gleich breit; freie Abklingstrecken 0,6–0,8 s, aber dichter Teppich | Weicher Hall, nässer als Stil 1, mit Vorverzögerung |
| Verstimmung | −40 Cent (gleich +60 Cent über dem Halbton darunter, also „zwischen den Tasten“), Orgelpunkt schwankt ± 10 Cent | −40 Cent, leichtes Leiern ± 6 Cent |
| Lautheit | Am flachsten: LRA 2,2 LU (reine Musik), Kurzzeit-Streuung 1,0 LU; die ersten 12 s 2 dB lauter (Hook). 11,7 LU unter der Stimme | Flach, Hook etwas lauter |
| Wegfall | Einbrüche von 0,25–0,5 s auf Pointen („… now it was wearing …“, nach dem Licht-aus-Moment) | Kurzer Wegfall vor der Pointe |

## Stil 3: Klavier-Fläche (nach ref0)

| Merkmal | Messwert | Regel für eigene Stücke |
|---|---|---|
| Tonart, Modus | Moll. Akkordtypen: Moll 46 %, Dur 37 %, sus4 13 %, übermäßig 4 %; chromatisch fallende Mittelstimme | Moll mit chromatisch fallendem Bass (Lamento-Bass) |
| Harmonischer Rhythmus | 80 % der Takte mit Wechsel. Grundton-Schritte: Quarte 18 %, Quinte 16 %, große Sexte 11 %, kleine Septime 9 %, Halbton ab 9 % | Jeder Takt ein neuer Klang, Quintverwandtschaft und Halbton |
| Melodik | Klavier-Arpeggien, Oberstimme Schritte 10 %, Terz/Quarte 22 %, ab Sexte 66 % | Weite Arpeggien, darüber eine sparsame eigene Linie |
| Rhythmus | Achtel mit Sechzehntel-Füllung in der vollen Stufe | Stufe 1 Achtel, Stufe 2 Sechzehntel |
| Tempo, Form | 66 BPM, 4/4. Schleife 6 Takte = 21,8 s | 66 BPM, 6-Takt-Schleife |
| Register | Klavier G2–C♯5 (96–544 Hz), Median C4; Synth-Bass 40–80 Hz (Spitze 64,6 Hz), nur in der vollen Stufe | Klavier G2–C♯5, Sub-Bass 40–80 Hz nur voll |
| Klangfarbe | Klavier mit Pedal: Töne 0,35 s (Median) bis 0,7 s, 2. Teilton −11 dB. Dazu Streicher-Fläche und tiefe Gleit-Schläge (Sub-Drops) an Übergängen | Flügel (FluidR3), Streicher-Fläche, eigener Sub-Drop |
| Hall | Seite/Mitte −3,4 dB: deutlich breiter als die Spieluhren | Breiter Saal, Klavier nach Tonhöhe verteilt |
| Verstimmung | −32 bis −34 Cent = A 432 Hz | A = 432 Hz |
| Lautheit | Drei Stufen: bis 26 % leise, bis 79 % voller (+6 dB im Seitensignal), im Höhepunkt wieder leise. LRA 5,1 LU. Nur 5,1 LU unter der Stimme | Varianten dünn/normal/voll entsprechen den Stufen |

## Stil 4: Sub-Drone (nach r1)

| Merkmal | Messwert | Regel für eigene Stücke |
|---|---|---|
| Tonhöhe | Kein Lied. Drone um G1/G♯1 (Spitze 51,1 Hz) mit Tritonus (C♯) und Halbton-Cluster (Chroma C♯ 1,00, G 0,97, G♯ 0,81); Teiltöne bis 670 Hz | Eigener Drone auf F1 mit Halbton-Nachbarn und Tritonus H |
| Spektrum | 96 % der Energie unter 250 Hz, Schwerpunkt 95–102 Hz, Seite/Mitte −6,3 dB | Fast alles unter 250 Hz |
| Zeitstruktur | Schwacher Puls bei 112 BPM (Stärke 0,21), Schläge alle 2–3 s, steigender Spannungston im Intro, Einschläge auf Enthüllungen | Herzschlag im 112er-Raster, Spannungston, Einschläge |
| Lautheit | Größter Umfang: LRA 15,7 LU, Kurzzeit p10–p95 −36 bis −20 LUFS; PLR 19,8 dB. 9,7 LU unter der Stimme | Schwellungen über 12 Takte, ±6–8 dB |
| Verstimmung | −23 Cent (wenig aussagekräftig beim Drone) | −23 Cent |

## Was alle tonalen Betten gemeinsam haben

1. **Eine Figur, die nie aufhört.** Gleichmäßige Achtel, kaum Dynamik, die Schleife wiederholt sich fast wörtlich (Ähnlichkeit 0,9). Die Musik erzählt nicht, sie ist ein Zustand.
2. **Ein Ton, der immer wiederkommt** (Orgelpunkt in der oberen Mittellage). Er reibt sich mit den „falschen“ Akkorden.
3. **Dur, das kippt:** Dur-Tonika mit Moll-Subdominante, übermäßigem Dreiklang und Medianten. Kinderlied-Material, das falsch abbiegt.
4. **Zwischen den Tasten gestimmt** (+46 / −40 / −32 Cent). Nichts klingt wie ein Klavier im Wohnzimmer.
5. **Kein Bass** bei den Spieluhren, Energie zwischen 250 und 1100 Hz. Die Stimme liegt darunter (Grundton) und darüber (Formanten ab 2 kHz).
6. **Wegfall statt Steigerung:** Die Musik wird nie lauter, sie hört an Schockstellen auf.
