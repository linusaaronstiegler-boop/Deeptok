# Referenz-Destillation: Schnitt, Text, Tempo und Ton der Vorbilder

Stand 27.10.2026. Auftrag aus `docs/VIDEO-PIPELINE.md` §3: Wir messen echte Clips der Vorbilder und machen daraus Zahlen für `studio/DESIGN.md`. Ins Repo kommen nur Zahlen und Regeln. Clips, Einzelbilder und Kontaktbögen lagen ausschließlich im Scratchpad der Sitzung, nie im Repo; nach der Auswertung werden sie gelöscht.

**Kurzfassung**
- Bilder, die etwas erklären, stehen bei vier von fünf Vorbildern ungefähr gleich lang: **im Median 4,7–6,1 s** (Terra X ist eine einzige Kamerafahrt mit 3 Einstellungen). Die schnellen Schnitte (Simpl. China: 32,7 harte Schnitte pro Minute, Median 1,1 s) kommen nur von Fremdbildern, Montagen und Teasern, die nichts erklären.
- **Text erscheint mit dem Wort.** Über alle 39 Text-Einblendungen, die ein gesprochenes Wort benennen, liegt der Median bei −20 ms, die mittlere Hälfte zwischen −290 und +150 ms.
- **Die Kamera bewegt sich zwischen den Lese-Bildern, nicht währenddessen.** Übergangsfahrten dauern 0,4–0,7 s (Median 0,45 s, n = 14). Drei von fünf Vorbildern stehen beim Lesen völlig still.
- **Sprechtempo der Off-Sprecher 2,0–2,2 Wörter/s** nach unserer G4-Rechnung. Das passt zum G4-Fenster 2,0–2,6.
- **Alle fünf Clips haben Musik unter der Sprache**, 10–25 dB leiser als die Stimme. **Keiner stellt die erste Frage vor Sekunde 24.** In beiden Punkten machen wir es bewusst anders.

## 1. Quellen

Alle Seiten wurden am **27.10.2026** abgerufen. Gemessen sind **nur die ersten 180 s** jedes Videos; den Terra-X-Clip (57,8 s) haben wir ganz gemessen.

| Kürzel | Kanal | Titel | Seite | Veröffentlicht, Länge | Abrufbar bis |
|---|---|---|---|---|---|
| Simpl. China | Simplicissimus (funk) | Wie China bald die (halbe) Welt regiert | https://www.zdf.de/video/dokus/funk-collection-funk-12075-582/funk-wie-china-bald-die-halbe-welt-regiert-106 | 06.03.2022, 17:16 min | 06.03.2027 |
| Simpl. Nike | Simplicissimus (funk) | Warum Nike so wenig Steuern zahlt | https://www.zdf.de/video/dokus/funk-collection-funk-12075-582/funk-warum-nike-so-wenig-steuern-zahlt-100 | 09.12.2020, 11:07 min | 09.12.2030 |
| Kurzgesagt | Dinge Erklärt – Kurzgesagt (funk) | Überbevölkerung – Die Bevölkerungsexplosion erklärt | https://www.zdf.de/video/animation/funk-collection-funk-11090-448/funk-ueberbevoelkerung--die-bevoelkerungsexplosion-erklaert-108 | 03.07.2018, 6:44 min | ohne Enddatum |
| maiLab | maiLab (funk) | Wie wir uns mit Zahlen manipulieren lassen | https://www.zdf.de/video/explainer/funk-collection-funk-996-636/funk-wie-wir-uns-mit-zahlen-manipulieren-lassen-108 | 23.07.2020, 16:13 min | ohne Enddatum |
| Terra X | Terra X (ZDF), Creative-Commons-Clip | Ausdehnung und Zerfall des Osmanischen Reichs | https://commons.wikimedia.org/wiki/File:Ausdehnung_und_Zerfall_des_Osmanischen_Reichs.webm | 09.10.2023, 0:58 min | Wikimedia Commons, CC BY 4.0 |

- **Lizenz Terra X:** CC BY 4.0. Urheber laut Commons: ZDF/Terra X/Spiegel TV/Georg Graffe/Heike Schmidt/Maximilian Heß. Wir übernehmen daraus kein Bild, nur Messwerte.
- **maiLab steht als legaler Ersatz für Veritasium.** Veritasium liegt nur auf YouTube. YouTube blockiert Downloads aus der Cloud mit einer Bot-Prüfung, und Umgehungen sind tabu. maiLab ist das nächstliegende Wissenschaftsformat in der ZDF-Mediathek, aber kein gleichwertiger Ersatz: Eine Moderatorin spricht frontal in die Kamera (75 % der Zeit), Veritasium arbeitet viel mit Experimenten. **Für Veritasium haben wir keine eigenen Messwerte.**
- **Warum diese Folgen:** Es sind reguläre Erklärfolgen, keine Trailer oder Meta-Videos. Simplicissimus ist mit zwei Typen vertreten, Geopolitik (China) und Konzernanalyse (Nike). Terra X dient als Referenz für das Timing animierter Karten.
- **Abruf:** Die ZDF-Clips kamen über den ZDF-Extraktor von yt-dlp mit dem Zeitbereich 0–180 s, den Terra-X-Clip haben wir als Datei von Commons geladen. Eine Abfrage der ZDF-Programmschnittstelle mit dem Token aus der Seite wurde als Umgehung abgelehnt und nicht weiter versucht. Die Folgenlisten stammen stattdessen aus der öffentlichen Sitemap. Commons antwortete zuerst mit HTTP 429; wir haben das nicht umgangen, sondern später erneut geladen.

## 2. Methode

Ein Messdurchgang je Clip, mit ffmpeg/ffprobe, faster-whisper (Modell `small`, `language="de"`, Wortzeiten, offline) und numpy. Tesseract war nicht installiert. Text wurde deshalb durch Ansehen erfasst und zeitlich über Pixelzählung bestimmt.

| Größe | Wie gemessen | Genauigkeit |
|---|---|---|
| Schnitte und Nähte | ffmpeg-Szenenwert für jedes Bild plus eigene Bilddifferenzen. Jeder Kandidat wurde mit Bildern davor und danach angesehen. Eine feste Schwelle funktioniert nicht: Echte Schnitte lagen teils unter 0,2, Handkamera und Wischschwenks teils darüber. Animierte Blenden über 8–20 Bilder (Kurzgesagt) erreichen höchstens 0,16 und wurden über Farbhistogramme gefunden. | Schnitte auf ±1 Bild genau. Auf einer durchgehenden Leinwand (Nike) ist die Grenze einer „Einstellung“ Ermessenssache, etwa ±3 Grenzen. |
| Einstellung | Zeit zwischen zwei Nähten. Eine Naht ist ein harter Schnitt, eine Blende oder eine Kamerafahrt zu einer neuen Komposition. Die letzte Einstellung ist vom Clipende abgeschnitten. | ±0,1 s |
| Text im Bild | Ansehen an jeder Sekunde und an jeder Naht. Den Zeitpunkt des Erscheinens haben wir über den Tinten- oder Farbanteil in der Bildregion bestimmt (bei 25–60 fps), sonst aus Bildreihen mit 10–15 fps. | ±17–100 ms |
| Text-Versatz | Zeit, zu der der Text erscheint, minus Beginn des gesprochenen Worts laut Whisper. Positiv heißt: Der Text kommt nach dem Wort. | Whisper-Wortzeiten ±100–200 ms |
| Schriftgröße | Versalhöhe in Pixelzeilen am Vollbild, in % der Bildhöhe | ±1–3 px |
| Sprechtempo | Whisper-Wörter nur im Erzählertext (ohne O-Töne, Jingles und Lücken), Zahlen als ein Wort. **Netto:** Pausen über 0,7 s abgezogen. **G4:** Pausen über 1,2 s abgezogen, wie in `factory/werk/hoercheck.py` (eigene Nachrechnung aus den Wortzeiten). | ±3 % |
| Pausen | Lücken zwischen Whisper-Wörtern, gegengeprüft über die Energie im Sprachband | ±0,1–0,2 s |
| Musik und Ton | Pegel in Sprechpausen gegenüber Sprache, tonale Spitzen auf Notenfrequenzen, Spektrogramme, EBU R128. Musik und Sprache wurden nicht getrennt, darum ist der Pegel des Musikbetts nur geschätzt. | ±5 dB |
| Bewegung | Phasenkorrelation und Anteil unveränderter Bildpaare je Sekunde; Zooms über Label-Breiten und Bildausschnitt | Zoomraten ±20 % |
| Farbe | k-means über 1–2 Bilder pro Sekunde, HSV-Sättigung | ±1–2 Prozentpunkte |

**Grenzen.** Die ersten 180 s enthalten Teaser, Vorspann und Jingles. Schnittraten dieses Ausschnitts gelten deshalb nicht für das ganze Video (bei Nike treibt allein die Teaser-Montage die Rate). Die Vorbilder sind Langformate von 6–17 min im Querformat, DeepTok-Videos dauern 45–90 s im Hochformat. Alle Zahlen sind Beobachtungen an fünf Clips aus vier Kanälen (zusammen 778 s), keine Normen.

## 3. Messwerte je Größe

### 3.1 Schnitte pro Minute

| Clip | harte Schnitte/min | alle Nähte/min | Anteil harter Schnitte | Bemerkung |
|---|---|---|---|---|
| Simpl. China | 32,7 (98) | ≈ 35 | ≈ 94 % | 2 Abblenden auf Schwarz, 1 Glitch-Montage, 1 Bewegungsblende; Vorspann 31,5/min, Kapitel 1 41,8/min |
| Simpl. Nike | 16,0 (48) | 22,3 (67) | 72 %; **im Erklärteil 21 %** (5 von 24) | 35 der 48 Schnitte in einer Teaser-Montage (≈ 6 Schnitte/s), 8 in einer Foto-Montage. Ohne Teaser 4,5 harte Schnitte/min |
| Kurzgesagt | **0** | 8,7 (26) | **0 %** | alle Nähte animiert: 12 Diagonal-Wischblenden, 6 Schiebeblenden, 3 Reißschwenks, 5 sonstige, je 0,13–0,35 s; mit Teilbild-Einschüben 11,0/min |
| maiLab | 10,0 (30) | 11,7 (35) | 86 % | 8 Jump-Cuts, 4 Snap-Zooms (80–120 ms), 1 Abblende |
| Terra X | **0** | 2,1 (2) | **0 %** | eine virtuelle Kamera über einem Globus, 2 Wischschwenks à 0,4 s |

### 3.2 Einstellungslänge (Sekunden)

| Clip | alle Einstellungen: Median / p10 / p90 | nur erklärende Bilder: Median / p10 / p90 |
|---|---|---|
| Simpl. China | 1,13 / 0,37 / 3,81 (n = 100) | 4,8 (Spanne 3,7–6,6; n = 7 Karten und Grafiken) |
| Simpl. Nike | 0,33 / 0,15 / 7,69 (n = 68) | **5,05 / 2,29 / 11,33** (n = 25) |
| Kurzgesagt | **6,1 / 3,11 / 11,81** (n = 27) | wie links; mit Teilbildern 4,3 / 1,3 / 8,4 |
| maiLab | **4,72 / 1,19 / 9,62** (n = 35) | Belege und Diagramme 6,0 (Spanne 2,5–8,4) |
| Terra X | 19,6 / 12,1 / 26,3 (n = 3, statistisch schwach) | wie links |
| **Median der Erklärbilder** | | **≈ 5 s**; p10 1,2–3,1 s, p90 9,6–11,8 s |

Fremdaufnahmen (Nachrichten, Stock) stehen bei Simplicissimus etwa 1 s, Karten und Grafiken 4–7 s. Bei uns gibt es keine Fremdbebilderung, darum zählt der Takt der Erklärbilder.

### 3.3 Text-Versatz zum Wort (Text erscheint minus Wortbeginn)

| Clip | Median | Spanne | n | Muster |
|---|---|---|---|---|
| Simpl. China | +180 ms | −80 bis +2010 ms | 6 | Labels meist kurz nach dem Wort, Fremd-Schlagzeile +960 ms, ein Kartenlabel erst einen Satz später |
| Simpl. Nike | −270 ms | −1000 bis +100 ms | 8 | Schlagwort-Labels; **Ankündigungsgrafiken** (Diagrammtitel, Zahlen-Badge, Logo) dagegen **−1500 bis −2700 ms** vor dem Wort (n = 5) |
| Kurzgesagt | +60 ms | −3350 bis +1230 ms | 13 | Zahlen-Labels im Diagramm +90 ms (−440 bis +500; n = 8), Titel weiter vorn (Median −640 ms) |
| maiLab | −135 ms | −460 bis +200 ms | 9 | Wörter auf Titeltafeln im Sprechrhythmus; ganze Belegseiten schon mit dem Satzanfang (−0,8 bis −1,4 s) |
| Terra X | −20 ms | −660 bis +4180 ms | 3 | Beschriftungen kommen alle zugleich; ein Gebiet erscheint 4,2 s nach seinem Namen |
| **alle zusammen** | **−20 ms** | Mitte: −290 bis +150 ms | 39 | 36 % liegen innerhalb von ±150 ms, 51 % innerhalb von ±250 ms, 77 % innerhalb von ±500 ms |

**Bild zum Wort (Schnitt auf das genannte Motiv):** Bei Simpl. China liegt der Median bei −0,2 s (Mitte −0,77 bis +0,07 s, n = 13), bei Kurzgesagt bei +10 ms (Mitte −280 bis +310 ms, n = 19). maiLab schneidet auf einen Beleg 40–240 ms vor dem ersten Wort des Satzes, der ihn nennt. Terra X ist hier das Gegenbeispiel: Das Bild hinkt bei Themenwechseln 2,4–5,1 s hinterher, und der letzte Satz bekommt gar kein Bild.

**Neuer Satz, neues Bild:** Bei Simpl. China haben 73 % der Satzanfänge einen Schnitt innerhalb von ±0,5 s; Zufall wären 46 %. Bei maiLab liegen 26 von 35 Schnitten in einer Wortlücke.

### 3.4 Standdauer von Text

| Clip | Median | Spanne | Wann verschwindet Text? |
|---|---|---|---|
| Simpl. China | ≈ 4,7 s (eigene Labels und Karten) | 2,6–8,2 s | mit der Einstellung; die Kapitelkarte steht 3,5 s; Untertitel nur 0,9–2,0 s |
| Simpl. Nike | 4,2 s (n = 11) | 2,7–10,8 s | **nie einzeln, immer mit dem Szenenwechsel** |
| Kurzgesagt | 2,95 s (n = 23) | 1,7–10,8 s | 17 von 23 Elementen erst mit der nächsten Blende |
| maiLab | Titeltafeln 2,0–2,9 s; Belege 6,0 s | 2,0–8,4 s | Tafel bzw. Beleg endet mit dem Schnitt |
| Terra X | 12,6 s | 6,5–20,2 s | nur mit dem Wischschwenk oder am Clipende |

**Titel- und Kapiteltafeln:** China 3,5 s, maiLab 2,9 s und 2,0 s, Kurzgesagt 3,25 s, 3,4 s, 5,85 s und 6,2 s. Der Median aller 7 liegt bei 3,4 s, der der 3 Vollbild-Tafeln bei 2,9 s. **Das kürzeste eigene Text-Element aller Vorbilder stand 1,7 s.**

### 3.5 Wörter je Text-Element und Textanteil

| Clip | typisch | höchstens | Einstellungen mit Text | Sekunden mit Text |
|---|---|---|---|---|
| Simpl. China | 1–2 | 13 (neu gesetzte Presse-Schlagzeile) | 16 % (ohne Untertitel 6 %) | – |
| Simpl. Nike | 1–3 | 8 | 72 % der Erklärbilder (28 % aller Einstellungen) | 55 % |
| Kurzgesagt | 1–3 | 8 (Fußnote); bis 13 gleichzeitig | 48 % | 36 % |
| maiLab | 1 | 4 | 23 % | ≈ 23 % |
| Terra X | 1–2 | 4; bis 8 gleichzeitig | 100 % | 84 % |

Etwa die Hälfte des Texts bei Kurzgesagt wird nie gesprochen (Sprechblasen, Aufkleber, Fußnote). Simplicissimus setzt in jede eigene Grafik eine dauerhafte Quellenzeile („Quelle: …“), bei China in 88 von 100 Einstellungen.

### 3.6 Schriftgröße (Versalhöhe in % der Bildhöhe)

| Clip | Standard-Label | Schlüsselzahl, Betonung | klein (Quelle, Achse, Legende) | Schrift |
|---|---|---|---|---|
| Simpl. China | 3,5 % („Silicon Valley“) bis 6,2–6,9 % (Namen, große Kartenlabels) | Kapiteltitel 6,5 % | Untertitel 3,2 %, Quelle 1,5 % | geometrische Grotesk, halbfett bis fett, gemischte Schreibung |
| Simpl. Nike | 2,8–2,9 % | 4,6–4,7 % (≈ 1,6–2,3 × Label) | Diagrammtitel 1,8–2,1 %, Balkenwerte 1,4 %, Quelle 1,7 % | Futura-artige Grotesk, Regular bis Medium |
| Kurzgesagt | **4,6–4,7 %** für fast alles | 6,4 / 8,2 / 9,9 % | 2,5–3,3 % | runde Grotesk, Titel in Versalien auf dunklem Balken |
| maiLab | – (keine Labels auf der Person) | Vollbild-Tafel **23 %**, kleine Wörter 14,9 % | Fremdbelege 2,5–4,5 % | runde, fette Display-Grotesk, Weiß auf Navy-Verlauf |
| Terra X | 2,4–3,5 % | Logo 10,6 % | – | Grotesk, Regionen in gesperrten Versalien, Städte gemischt |

**Umrechnung auf DeepTok.** Ein Querformat-Video im Vollbild füllt mit seiner Höhe die kurze Seite des Handys. Genau dort liegt bei uns die Bildbreite von 1080 px. Gleiche Größe auf demselben Handy heißt also: **x % der Vorbild-Höhe ≙ x % × 1080 px Versalhöhe bei uns.** Die Versalhöhe unserer Schriften haben wir aus den Font-Dateien gelesen: Inter 0,7275 em, Playfair Display 0,708 em.

| Vorbild-Wert | ≙ Versalhöhe bei uns | unsere Stufe (Versalhöhe) |
|---|---|---|
| Standard-Label, Median der vier Clips mit eigenen Labels ≈ 3,4 % | ≈ 37 px | **T 52 px → 37,8 px** |
| Kurzgesagt-Standard 4,7 % | 51 px | T 56 px → 40,7 px (Obergrenze) |
| Schlüsselzahl Nike 4,7 %, Betonung Kurzgesagt 6,4–9,9 % | 51 px, 69–107 px | D2 124 px → 87,8 px; D1 173 px → 122,5 px |
| maiLab-Vollbildtafel 23 % | 248 px | – (über unserem D1) |
| Kleinste Elemente (Quelle 1,5–1,7 %, Kartenlabels Terra X 2,4 %) | 16–18 px, 26 px | C und L 34 px → 24,7 px |

### 3.7 Sprechtempo (Wörter pro Sekunde)

| Clip | netto (Pausen > 0,7 s ab) | G4-Rechnung (Pausen > 1,2 s ab) | brutto | grob Silben/s | Sprecher |
|---|---|---|---|---|---|
| Simpl. China | 2,09 | 2,06 | 2,06 | ≈ 4,3 | aus dem Off, sehr gleichmäßig (Blöcke 1,97–2,30) |
| Simpl. Nike | 2,23 | 2,24 | 2,15 | ≈ 4,4 | aus dem Off; Teaser 1,5–1,9, Pointen bis 3,6 |
| Kurzgesagt | 2,37 | 2,19 | 2,04 | ≈ 4,7 | aus dem Off |
| maiLab | 3,05 | 3,02 | 2,93 | ≈ 5,0 | im Bild; Pausen per Jump-Cut entfernt |
| Terra X | 2,22 | 2,04 | 1,95 | – | aus dem Off; Sätze 1,81–3,07 |
| **Off-Sprecher (4 Clips)** | **2,09–2,37, Median 2,23** | **2,04–2,24, Median 2,13** | 1,95–2,15 | | |

### 3.8 Pausen

| Clip | Satzpause (Median) | Pausen > 0,7 s im Erzählertext | längste Sprechpause und Lage |
|---|---|---|---|
| Simpl. China | 0,43 s | 2 | 1,04 s direkt vor der ersten Wende |
| Simpl. Nike | 0,46 s (0,32–0,65) | 1 (ohne Intro) | 1,04 s vor einer Jahreszahl; **Musik-Stopps von 0,35–0,5 s vor Pointen** statt Sprechpausen |
| Kurzgesagt | 0,70 s (Lücken > 0,3 s) | 18 = 6,3 pro Minute, Median 0,80 s, alle an Satzenden | 1,46 s am Wendepunkt zur Auflösung |
| maiLab | 0,21 s | 4, alle an Formatbrüchen, keine in einer Erklärung | 2,0 s nach einer Pointe (Schnitt in einen Einschub) |
| Terra X | 0,5–1,0 s an jedem Satzende | 5, Median 0,96 s | **2,54 s Lesepause**, 2,3 s nachdem drei Beschriftungen erschienen sind |

### 3.9 Musik und Ton

| Clip | Musik unter Sprache | Abstand Bett zu Stimme | Lautheit | Geräusche |
|---|---|---|---|---|
| Simpl. China | **ja**, durchgehend (zwei Stücke) | ≈ 11–23 dB | −17,5 LUFS, LRA 3,9 LU | Riser und Jingle am Logo; an Schnitten nicht häufiger als zufällig |
| Simpl. Nike | **ja**, durchgehend | ≈ 15–25 dB | −14,1 LUFS, LRA 2,9 LU | nicht sicher nachweisbar; Montagen im Takt (≈ 94 BPM, nicht gegen die Musik geprüft) |
| Kurzgesagt | **ja**, Klangteppich | ≈ 10–20 dB | nicht gemessen | Hinweise auf Whoosh bei 2 Blenden |
| maiLab | **wahrscheinlich**, zeitweise | ≈ 15–20 dB | −16,1 LUFS, LRA 4,0 LU | derselbe Klick auf jedem Schnitt zu einer Grafik |
| Terra X | **ja**, durchgehend | ≈ 10–13 dB | −23,0 LUFS (Sendenorm), LRA 6,6 LU | keine gefunden |

### 3.10 Bewegung und Übergänge

| Clip | Kamera beim Lesen | Übergangsfahrten zwischen Lese-Bildern | lange Fahrten |
|---|---|---|---|
| Simpl. China | langsamer Push-in von 0,9–3,3 % pro Sekunde, nie eine schnelle Fahrt | Karten-Zoom 0,45 s (USA → Kalifornien), Zoom-out 0,6 s; danach steht die Karte | Drohne, Handkamera (Fremdmaterial) |
| Simpl. Nike | **steht**: In 70 % der Grafik-Sekunden ändert sich das Bild global nicht | 6 Schwenks und Pushes à 0,4–0,5 s, 3 Karten-Zooms à 0,5–0,7 s; innerhalb einer Erklärung fährt die Kamera, statt zu schneiden | ein Karten-Schwenk 2,4 s |
| Kurzgesagt | **steht** in 12 von 13 Text-Einstellungen | Blenden 0,13–0,35 s, Zoom-out-Enthüllung 0,5 s | Neigungen und Schwenks von 1,2–13 s, fast nur in Szenen ohne Text |
| maiLab | **steht** (Stativ; Belege 4–8 s völlig still) | Snap-Zoom auf eine Pointe: Sprung um das 1,2- bis 1,45-Fache in 80–120 ms | keine |
| Terra X | driftet (≈ 0,6 % Bildbreite/s plus ≈ 1 % Zoom/s) | Wischschwenk 0,4 s | Rückzoom um das ≈ 4,5-Fache über 18 s, Spitze 14 %/s, sanft auslaufend |

**Übergangsfahrten zusammen (China, Nike, Terra X, n = 14): Median 0,45 s, Spanne 0,4–0,7 s.** Elemente erscheinen meist in 0,1–0,25 s. Zahl-Badges und Sprechblasen ploppen in ≤ 0,2 s auf, teils mit Überschwinger. Bei Nike tippen sich Titel als Schreibmaschine mit 10–26 Zeichen pro Sekunde ein.

### 3.11 Markierungen

| Clip | Anzahl in 180 s | Art | Zeichendauer | Lage zum Wort |
|---|---|---|---|---|
| Simpl. China | 3 | Textmarker über einer Schlagzeile, Lupenkegel, gestrichelte Routenlinien | Routen 0,4–0,6 s, Textmarker 1,3 s (≈ 20 Zeichen/s) | Routen starten ≈ 0,5 s vor dem Ortsnamen und **kommen auf dem Wort an**; der Textmarker läuft 3,9 s zu früh |
| Simpl. Nike | 9 (≈ 3/min) | Haken ✓ und Kreuz ✗ als Pinselstrich, geschweifte Klammern für Teil und Ganzes, Bogenpfeile für Geldflüsse | ✓/✗ 0,15–0,2 s, Klammern und Pfeile 0,4–0,7 s | innerhalb von ±0,4 s am bewertenden Wort |
| Kurzgesagt | 0 gezeichnete | Hervorheben durch Abdunkeln der anderen, ein „FALSCH“-Aufkleber, Datenpunkt-Ringe | Aufkleber 0,35 s | Ringe mit dem Zahlwort (−440 bis +410 ms) |
| maiLab | 2 | Textmarker-Sweep im Browser | 0,4 s, danach 1,2–1,4 s gehalten | +20 ms und −300 ms |
| Terra X | 0 | Kartensprache: Ortspunkte, Grenzlinien, Gebietsflächen, die wachsen | Flächen 2,8–5,6 s | ±0,8 s bei 5 von 8 Ereignissen |

**In 778 s Vorbild-Material kommt kein einziger handgezeichneter Kreis vor.** Die Kreise, Fadenkreuze und Pfeile aus §3 der Pipeline stammen von Vorschaubildern, nicht aus den Videos.

### 3.12 Farbe und Held

| Clip | Grund | Akzent | Held je Einstellung |
|---|---|---|---|
| Simpl. China | dunkel, entsättigt (Luma-Median 0,19, Sättigung 0,22) | Signalrot für China, 2,7 % der Pixel | 93 % Fremdaufnahmen und Dokumente; Karten und Grafiken nur 7 % der Einstellungen, aber 20 % der Zeit |
| Simpl. Nike | 98 % unbunte Pixel (Hellgrau, Dunkelgrau) | Nike-Orangerot, nur auf dem Nike-Balken; ✓ grün, ✗ rot | Karte 35 %, Gegenstand 21 %, Fremd-Webseite 12 %, Diagramm 9 % der Zeit |
| Kurzgesagt | dunkles Indigo, sehr gesättigt (Sättigung 0,72) | Pink, dann Gelb, dann Cyan | Figuren 52 %, Gegenstände 26 %, Diagramme 11 %, Karten 7 % |
| maiLab | Senfgelb hinter der Person; Titeltafeln in einem Navy-Verlauf, der unserem Navy fast gleicht | eigenes Akzentsystem fehlt; in gezeigten Herstellergrafiken steht Rot nur für eine Abnahme | Person 75 % der Zeit |
| Terra X | Erdtöne eines Satellitenglobus | Gebietsfarbe je Akteur, immer nur eine Akzentfamilie zugleich | Karte 100 % |

### 3.13 Einstieg

| Clip | erste Spannung | erste ausdrückliche Frage |
|---|---|---|
| Simpl. China | 20,2 s (Wende mit „Doch …“) | 100,0 s, danach 4 Fragen in 12 s |
| Simpl. Nike | 43,5 s (Paradox) | keine in 180 s |
| Kurzgesagt | 1,0 s (Superlativ) | 24,4 s, danach 6 Fragen in 27 s |
| maiLab | 11,4 s | 27,1 s |
| Terra X | 8,5 s (Superlativ) | keine |

## 4. Was wir übernehmen

Zahlen für DeepTok im Hochformat 1080 × 1920. Die mit ★ markierten stehen jetzt in `studio/DESIGN.md` §9.

1. ★ **Ein Bildzustand steht im Median 5 s, Spanne 2–12 s (p10–p90).** Grund: Die erklärenden Bilder aller Vorbilder liegen im Median bei 4,7–6,1 s, p10 bei 1,2–3,1 s und p90 bei 9,6–11,8 s. Die kurzen Einstellungen von Simplicissimus (Median 1,1 s) sind Fremdbebilderung ohne Erklärwert, die wir nicht haben.
2. ★ **Etwas Neues im Bild alle 3–4 s, nie mehr als 8 s ohne neues Element.** Grund: Terra X zeigt im Median alle 4,1 s eine neue Bildinformation, Kurzgesagt mit Teilbildern alle 4,3 s, maiLab alle 4,7 s. Innerhalb einer Einstellung kommen Labels, Marker und Zahlen hinzu; bei Kurzgesagt und Nike ergibt die Zählung grob ein Ereignis alle 3 s (Überschneidungen nicht abgezogen). Das p90 der Bildwechsel liegt bei 8,4–9,6 s. Die 14,7-s-Lücke im letzten Satz von Terra X lässt eine Aussage ohne Bild.
3. ★ **Höchstens ⅓ der Nähte sind harte Schnitte.** Grund: Die Grafik-Erklärer kommen auf 0 % (Kurzgesagt, Terra X) bzw. 21 % (Nike im Erklärteil); 86–94 % gibt es nur bei Fremdbebilderung und Talking Head. Nike zeigt, wie das ohne Blenden geht: eine durchgehende Leinwand, und die Kamera fährt zur nächsten Komposition. Im Hochformat fährt sie bevorzugt nach oben, in Wischrichtung des Feeds.
4. ★ **Eine Kamerafahrt zwischen zwei Lese-Bildern dauert 0,5 s (0,4–0,7 s).** Danach steht die Kamera, solange Text steht. Grund: 14 gemessene Übergangsfahrten liegen bei 0,4–0,7 s (Median 0,45 s), auch Karten-Zooms von einem Land auf eine Region (China: USA → Kalifornien in 0,45 s). Lange Fahrten von 1–18 s gibt es nur in Szenen ohne Text oder in Stimmungsbildern. Kürzere Fahrten sparen Lernzeit. Für den Flug eines Darstellers gibt es kein Vorbild, die 1,7 s bleiben vorläufig.
5. ★ **Text tritt mit dem Wortbeginn ein; der Startwert −2 Bilder (−67 ms) ist bestätigt.** Grund: Über alle 39 wortbezogenen Einblendungen liegt der Median bei −20 ms, die Mediane der einzelnen Clips liegen zwischen −270 und +180 ms. Genauer als ±100–200 ms lässt sich das mit Whisper-Wortzeiten nicht festlegen. Spätestens 0,5 s nach Wortbeginn ist der Text voll lesbar (China: Namens-Label bei +500 ms).
6. **Bild und Schnitt sitzen auf dem Nomen, 0–200 ms davor.** Grund: Kurzgesagt +10 ms, China −0,2 s, maiLab 40–240 ms vor dem Satz, der den Beleg nennt. Das deckt sich mit §5 („Schnitt auf dem Nomen des neuen Gegenstands“).
7. **Linien, Pfeile und Routen zeichnen sich in 0,4–0,6 s und kommen auf dem Wort an.** Der Start liegt also etwa eine Zeichendauer vor dem Wort (China: Routenlinien starten ≈ 0,5 s vor dem Ortsnamen). Für Pfeile (§6, noch nicht gebaut) passt der vorläufige Schaft von 0,4 s dazu.
8. **Text bleibt bis zur nächsten Naht stehen.** Grund: Bei Nike verschwindet Text nie einzeln, bei Kurzgesagt 17 von 23 Elementen erst mit der Blende. Die Standdauer liegt im Median bei 3–5 s, das kürzeste Element stand 1,7 s.
9. ★ **Die Hook-Schlagzeile steht 3 s.** Grund: Titel- und Kapiteltafeln stehen 2,0–3,5 s, die Vollbild-Tafeln im Median 2,9 s. Dass die Schlagzeile ab Bild 0 sichtbar sein soll (Vorschaubild), lässt sich an Langformaten nicht messen; das bleibt vorläufig.
10. **1–3 Wörter je Text-Element, höchstens 8.** Grund: Typisch sind bei allen 1–3 Wörter, das Maximum eigener Elemente liegt bei 4–8. Das stützt T (≤ 7 Wörter je Zeile) und D2 (≤ 5 Wörter).
11. **Die Schriftstufen passen.** Das Standard-Label der Vorbilder entspricht im Median 37 px Versalhöhe bei uns, und T mit 52 px hat 37,8 px. Schlüsselzahlen sind bei den Vorbildern 1,4- bis 2,3-mal so hoch wie ein Label, bei uns D2 2,3-mal und D1 3,2-mal. Unsere Credits (24,7 px Versalhöhe) sind größer als die Quellenzeilen der Vorbilder (16–18 px). Untertitel ganz unten (China: Mitte bei 93 % der Bildhöhe) gibt es bei uns nicht; die App-Zone deckt diesen Bereich ab.
12. ★ **Sprechtempo 2,2 Wörter pro Sekunde** (G4-Fenster 2,0–2,6 bleibt). Grund: Die Off-Sprecher liegen nach der G4-Rechnung bei 2,04–2,24 Wörtern/s, netto bei 2,09–2,37. maiLab mit 3,0 kommt nur so schnell, weil Pausen weggeschnitten sind.
13. **Satzpausen 0,4–0,5 s, vor einer Wende 1,0–1,5 s.** Grund: Satzpausen messen bei Simplicissimus 0,43–0,46 s, bei Kurzgesagt und Terra X 0,5–1,0 s. Die längste Pause liegt jeweils vor der Wende (Kurzgesagt 1,46 s, China 1,04 s). Nike setzt vor Pointen einen Musik-Stopp von 0,35–0,5 s; bei uns ist das echte Stille.
14. **Nach einer dichten Beschriftung folgt eine Lesepause.** Terra X lässt 2,5 s Stille, nachdem drei Beschriftungen erschienen sind. Das stützt unsere Denkpause von 1,5–2,5 s, die nach §9 die Kalibrierung festlegt.
15. **Markierungen sind Urteile oder Beziehungen, keine Deko.** Grund: Bei den Vorbildern sind das ✓ und ✗ als Pinselstrich in 0,15–0,2 s auf dem bewertenden Wort, eine Klammer für Teil und Ganzes in 0,4–0,7 s, ein Textmarker in 0,4 s und Abdunkeln aller anderen Elemente. Höchstens etwa 3 pro Minute (Nike) und nur auf dem Wort, das gerade fällt.
16. **Eine Akzentfamilie je Bild, an die Hauptsache gebunden.** Bei Nike ist nur der Nike-Balken farbig, bei Terra X immer nur eine Gebietsfarbe. Bei uns ist das Gold mit ≤ 10 % der Fläche. Rot steht in den Belegen bei maiLab nur für eine Abnahme und bei Nike für das ✗, wie unser Rot für Irrtum und Verlust.
17. **Jede Faktengrafik bekommt eine dauerhafte Quellenzeile.** Bei Simplicissimus steht sie in fast jeder Einstellung. Das entspricht unserer Credit-Ecke.
18. **Einen Irrtum zeigen, dann widerlegen.** Kurzgesagt stellt zwei Stereotype nebeneinander und klebt dann einen „FALSCH“-Aufkleber darauf, auf das verneinende Wort. Das entspricht unserem roten Durchstrich.
19. **Hochformat:** Teilbilder und Vergleiche oben und unten statt nebeneinander, Diagramme mit ≤ 5–6 Werten. Die Querformat-Diagramme von Nike mit 9–13 Balken und 1,4 % hohen Achsenwerten wären bei uns unlesbar.

## 5. Was wir bewusst anders machen

1. **Keine Musik, kein Klangteppich, keine Geräusche unter der Sprache.** Alle fünf Vorbilder legen Musik unter die Stimme, 10–25 dB leiser; maiLab setzt zusätzlich einen Klick auf jeden Grafikschnitt. Moreno & Mayer (2000) fanden bei einer erzählten Animation: Hintergrundmusik und Geräusche verschlechtern Behalten und Transfer. Bei uns besteht der Ton nur aus der Stimme (Linus, 27.10.).
2. **Die Frage kommt zuerst.** Die Vorbilder stellen ihre erste ausdrückliche Frage nach 24–100 s oder gar nicht. Bei uns beginnt jede Einheit in den ersten Sekunden mit einer Frage oder Vorhersage zum Antippen („Erst tippen, dann sehen“).
3. **Lernpausen statt durchgehendem Fluss.** maiLab schneidet Pausen auf 0,21 s herunter, Nike füllt sie mit Musik. Wir lassen vor der Auflösung eine stille Denkpause von 1,5–2,5 s.
4. **Kein Vorspann, kein Logo, kein Jingle.** Bei den Vorbildern kosten Logo, Jingle und Glitch-Rückspulung je Video 3–12 s ohne Inhalt.
5. **Keine Fremdbebilderung, keine Montagen.** Simpl. China schneidet 32,7-mal pro Minute auf Nachrichten- und Stockbilder, Nike hat eine Teaser-Montage mit ≈ 6 Schnitten pro Sekunde. Solche Bilder tragen keinen Inhalt und sind urheberrechtlich nicht nutzbar.
6. **Die Kamera steht beim Lesen ganz still (0 px/s).** Simpl. China (Push-in ≤ 3,3 %/s) und Terra X (Drift ≈ 1 %/s) bewegen sich auch beim Lesen. Wir folgen Nike, Kurzgesagt und maiLab, die in diesem Moment stillstehen.
7. **Keine Wischblenden und keine Zierübergänge.** Kurzgesagt erreicht 0 % harte Schnitte nur mit Diagonal-Wischblenden und Schiebeblenden. Wir lösen Nähte mit Kamerafahrt, Morph oder einem harten Schnitt auf dem Nomen.
8. **Zahlen und Lösungen laufen nie vor.** Nike blendet Diagrammtitel und Zahlen 1,5–2,7 s vor dem Wort ein. Bei uns darf neutraler Kontext vorlaufen (Achse, Titel ohne Antwort), eine Antwort nicht.
9. **Hochformat statt Querformat.** Lesbares liegt bei uns im Lesefenster y 168–1330, nicht am unteren Rand. Wir verwenden keine breiten Weltkarten-Schwenks und keine Beschriftungen, die über die seitlichen Ränder hereinkommen.
10. **Neutrale Bildsprache.** Kein dunkles Bedrohungs-Grading mit Vignette (China: 31,5 % fast schwarze Pixel), keine wertende Metapher, kein Neon-Pink (Kurzgesagt). Rot bleibt Irrtum und Verlust.
11. **Serife für Zahlen und Schlagzeilen.** Alle gemessenen Vorbilder setzen eigene Grafik in einer Grotesk; Serifen kommen nur in zitierten Presse-Schlagzeilen vor. Playfair Display für die Display-Stufen bleibt trotzdem unsere Hausregel (CLAUDE.md).
12. **Lautheit −16 LUFS, −1 dBTP.** Die Vorbilder liegen zwischen −14,1 LUFS (Nike) und −23,0 LUFS (Terra X, Sendenorm).

## 6. Übertrag in `studio/DESIGN.md`

| Stelle | vorher (vorläufig) | jetzt |
|---|---|---|
| §9 Mittlere Einstellungsdauer | 3,5 s, Spanne 2–8 s | 5 s (Median), Spanne 2–12 s |
| §9 Takt | alle 2–4 s | alle 3–4 s, nie länger als 8 s ohne neues Element |
| §9 Hook-Schlagzeile | steht 2,5 s | steht 3 s; „ab Bild 0“ bleibt vorläufig |
| §9 und §5 Eintritt relativ zum Wort | −2 Bilder (v) | −2 Bilder, bestätigt |
| §9 Anteil harter Schnitte | ≤ ⅓ | ≤ ⅓, bestätigt |
| §9 Sprechtempo | 2,3 Wörter/s | 2,2 Wörter/s (G4 2,0–2,6 bleibt) |
| §9 und §5 Kamerafahrt | 1,4 s | 0,5 s (0,4–0,7 s); Flug 1,7 s bleibt vorläufig |
| §9 Text-Standard | 52 px | unverändert, Messung ergänzt (Vorbild-Median ≙ 51 px) |

Nicht gemessen, darum unverändert: Denkpause (Kalibrierung), Abstand der Unterstreichung und Pfeil-Maße, Passer-Versatz und Rasterpunkt, Untertitel- und App-Zone.

## 7. Offene Punkte aus der Messung

- **Mindeststanddauer von Text:** Nach §5 darf ein Label mit 1–3 Wörtern nach 1,2–1,4 s gehen. Bei den Vorbildern stand kein eigenes Text-Element kürzer als 1,7 s, typisch sind 3–5 s, und Text geht fast immer erst mit der nächsten Naht.
- **Kreis als Haupt-Marker:** In den Videos gibt es keine Kreise (siehe 3.11). Gemessen sind ✓ und ✗, Klammern, Flusspfeile, Textmarker und Abdunkeln.
- **Toleranz am Cue:** G6 erlaubt ±150 ms. Bei den Vorbildern liegen nur 36 % der Einblendungen in diesem Fenster. Unser Bau setzt die Zeiten aber direkt aus den Wortzeiten, darum ist die strengere Grenze erreichbar.

## 8. Verweise

- Moreno, R. & Mayer, R. E. (2000): A coherence effect in multimedia learning. Journal of Educational Psychology 92(1), 117–125. https://tecfa.unige.ch/tecfa/teaching/methodo/Moreno_Mayer00.pdf
- Seiten der Clips: siehe Tabelle in §1 (abgerufen am 27.10.2026).
- Rohdaten, Kontaktbögen und Skripte lagen nur im Scratchpad dieser Sitzung und kommen nicht ins Repo.
