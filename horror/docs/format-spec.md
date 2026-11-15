# Format-Spezifikation: Roblox-Horror-Story (Hochformat)

Stand 14.11.2026. Abgeleitet aus einem Referenzvideo: „Porch Night“, TikTok-Download, 170,9 s, 576 × 1024, 30 fps, englische Ich-Erzählung, Wasserzeichen @concet5612 (`ref.mp4`). Gemessen wurde nur lokal, hochgeladen wurde nichts.

- **Kennzeichnung:** **(g)** heißt am Referenzvideo gemessen, Messweg in §10. **(a)** heißt daraus abgeleitet, also ein Vorschlag. **(u)** heißt unbelegt, Prüfweg in §9.
- **Nur eine Referenz:** Alle Werte stammen aus *einem* Video. Ob sie für das ganze Genre gelten, ist offen. Ab etwa fünf weiteren Referenzen werden sie zu Regeln (§9).
- **Download-Spuren:** Wasserzeichen, 576p, die TikTok-Abspannkarte ab 166,83 s und ein True Peak über 0 dBFS kommen vom TikTok-Download. Der Urheber hat sie nicht gestaltet, deshalb sind sie keine Vorgaben.
- **Abgrenzung zu DeepTok:** Das Format widerspricht `studio/DESIGN.md` §8 BANNED, nämlich Nr. 3 (Untertitel), Nr. 4 (gesprochener Satz als Text) und Nr. 14 (Musik). Es braucht deshalb einen eigenen Ordner und eigene Regeln, nicht `studio/`.
- **Maße:** Bildmaße stehen in Pixeln bei 1080 × 1920. Referenzmaße aus dem 576er Bild sind mit 1,875 multipliziert.

## 1. Grundsätze

1. **Kein Vorspann.** Das erste Wort fällt bei 0,00 s, das Monster ist ab 0,07 s im Bild (g). Es gibt keine Titelkarte, kein „Part 1“, keine Begrüßung und keine Kanal-Einblendung (g).
2. **Dauerton, Dauerbild, Dauertext.** Die Stimme pausiert nie länger als 0,32 s (g), alle 1,4 s kommt ein neues Bild (Median, g), und in 5 004 Bildern fehlt der Untertitel nur 7-mal (g).
3. **Jedes Bild zeigt, was gerade gesagt wird.** In 27 von 29 Stichproben zeigt das Bild das Nomen oder Verb des laufenden Teilsatzes (93 %, g). Die beiden übrigen sind Reaktionsbilder.
4. **Eine Erzählstimme für alles.** Sie spricht auch die Dialogzeilen, dann höher und erregter (Grundton im Dialog 227–262 Hz statt 188 Hz, g).
5. **Alles Gepflanzte wird geerntet.** 9 Setup-Payoff-Paare (g, §8). Die letzte Zeile ist ein Payoff.
6. **Einfache Sprache.** Flesch Reading Ease 90,7, Flesch-Kincaid-Stufe 2,8, 1,26 Silben je Wort (g).

## 2. Länge und Tempo

| Wert | Referenz (g) | Vorgabe (a) | Prüft |
|---|---|---|---|
| Laufzeit (Inhalt ohne TikTok-Abspann) | 166,8 s | 150–180 s; **mindestens 61 s** (Creator Rewards zählt laut Sekundärquellen nur Videos über 1 min, §11) | ffprobe |
| Gesprochene Wörter (Englisch) | 744 | 650–800 | Whisper |
| Silben | 941 (Heuristik) | 850–1 000; Deutsch nach Silben planen, nicht nach Wörtern (u) | Silbenzähler |
| Sprechtempo | 268 Wörter/min (4,46 W/s) über die Sprechzeit; 5,64 Silben/s; Artikulationsrate 4,69 W/s | Englisch 250–285 Wörter/min; Deutsch 5,3–5,9 Silben/s (u: übertragen, nicht gemessen) | Whisper-Wortzeiten |
| Tempo-Konstanz | je 15-s-Fenster 252–288 Wörter/min (±7 %), kein Abbremsen am Höhepunkt | ±8 % je 15-s-Fenster | Whisper |
| Pausen | 0 Pausen > 0,5 s; 6 Pausen von 0,30–0,32 s; längste 0,32 s | keine Pause > 0,35 s, keine „dramatische Pause“ | Whisper |
| Vergleich | Hörbuch-Erzähltempo laut Sekundärquellen etwa 150–160 Wörter/min (§11) | Die Referenz ist rund 1,7-mal so schnell. Vermutlich ist die Stimme beschleunigt (u) | — |

## 3. Hook-Regeln (0–5,5 s)

| Regel | Referenz (g) | Vorgabe (a) |
|---|---|---|
| H1 Monster im ersten Bild | 0,00–0,07 s Wisch-Unschärfe, ab 0,07 s Nahaufnahme der Vogelscheuche (halbes Gesicht im Vordergrund), dahinter das Opfer im Schaukelstuhl auf der Veranda | Bedrohung samt Opfer in einem Bild, sichtbar ab Bild 3 (≤ 0,1 s); Einstieg über einen schnellen Unschärfe-Zoom von ≤ 3 Bildern |
| H2 Erster Satz = Regel + grausame Folge | „In this town, one night a year, every family has to leave one person outside, and in the morning, every porch is empty.“ 23 Wörter, 0,00–5,32 s | ein Satz mit 18–25 Wörtern, ≤ 5,5 s; enthält Ort, Wiederkehr (einmal im Jahr), Pflicht und eine Folge, die Fragen offen lässt |
| H3 Erstes Spannungswort | „outside“ endet bei 3,48 s; das Rätsel „empty“ bei 5,32 s | Pflichtwort der Regel ≤ 3,5 s, Rätselwort ≤ 5,5 s |
| H4 Frage | Im ganzen Video gibt es keine gesprochene Frage (0 „?“ im Transkript) | Spannung über eine Regel oder ein Rätsel aufbauen, nicht über eine rhetorische Frage („Have you ever…?“) |
| H5 Schnitte im Hook | 4 Einstellungen bis 5,47 s (Schnitte bei 0,07 / 0,73 / 1,53 / 3,60 / 5,47 s): Monster mit Opfer, Straße von oben, alte Frau auf der Veranda, leere Straße am Morgen | 4 Einstellungen in 5,5 s, jede bebildert einen Teil des Satzes |
| H6 Zweiter Satz = Monster mit Sinnen | 33 Wörter, 5,56–13,06 s: Herkunft (Maisfeld), Größe („taller than the streetlights“), Material (Stroh), Gesicht (Sack, genähtes Lächeln) | ≥ 3 sinnliche Merkmale bis 13 s, davon eines ein Größenvergleich |
| H7 Ritual bis 23 s | „bends all the way down until its face is right in front of yours… stitches rip open“ (16,24–23,38 s), mit einmaliger direkter Anrede „yours“ | Das Tötungsritual wird bis 23 s Schritt für Schritt beschrieben, denn es kehrt am Ende wörtlich wieder (§8) |

## 4. Takt und Schnitt

| Wert | Referenz (g) | Vorgabe (a) | Prüft |
|---|---|---|---|
| Schnitte / Einstellungen | 116 / 117 in 166,8 s | 1 Schnitt je 1,2–1,6 s | `ffmpeg scdet` oder Szenenliste |
| Einstellungsdauer | Median 1,40 s, Mittel 1,46 s, Streuung 0,58 s; p10 0,83, p25 1,03, p75 1,80, p90 2,07; max 4,23 s | Median 1,3–1,5 s; keine Einstellung > 4,3 s; ≥ 90 % zwischen 0,75 und 3 s (Referenz: 93 %) | Szenenliste |
| Verteilung | < 0,75 s: 6 · 0,75–1 s: 14 · 1–1,5 s: 42 · 1,5–2 s: 36 · 2–3 s: 17 · 3–5 s: 2 | — | — |
| Takt über die Akte | Median je Abschnitt 1,20–1,60 s; Höhepunkt 130–150 s: 1,27 s | Takt bleibt konstant; höchstens 10 % schneller im Höhepunkt | Szenenliste |
| Lange Einstellungen | 2 von 117: 24,50 s (4,23 s, Straße, „Every house in town has one chair“) und die TikTok-Abspannkarte | höchstens eine Einstellung > 3 s, dann als Atem nach dem Ende des Monster-Akts | — |
| Schnitt und Satz | 76 Schnitte (66 %) an einem Satzanfang, 31 (27 %) an einem Teilsatz nach Komma, 9 (8 %) mitten im Satz auf einem Schlüsselwort | ≥ 60 % an Satzgrenzen, ≥ 90 % an Satz- oder Kommagrenzen | Whisper + Szenenliste |
| Schnitt und Wort | Schnitt im Median 74 ms vor dem Wortanfang; 85 von 116 Schnitten ≤ 100 ms vom nächsten Wortanfang entfernt | Schnitt 2–3 Bilder vor dem ersten Wort des neuen Satzes oder Teilsatzes | Whisper + Szenenliste |
| Schnitte je Satz | Sätze mit ≤ 6 Wörtern: 0,91 Schnitte · 7–12 Wörter: 1,26 · > 12 Wörter: 2,44 | Satz mit > 12 Wörtern: 2–3 Bilder; kurzer Satz: 1 Bild | — |
| Wörter je Einstellung | Median 6, Mittel 6,4 | 5–7 | — |
| Übergänge | harte Schnitte; einzige Blende ist der Unschärfe-Wisch bei 0,00–0,07 s | nur harte Schnitte, außer am Start | Sichtprüfung |

## 5. Untertitel

| Merkmal | Referenz (g) | Vorgabe (a) |
|---|---|---|
| Einheit | ein Wort je Einblendung, 744 Wörter = 744 Einblendungen | genau ein Wort; Zahlen als Ziffern („3 times“, „2 houses“) |
| Sync | Wechsel im Median 0 ms zum Whisper-Wortanfang (p10 −40 ms, p90 +47 ms) | ±1 Bild zum Wortanfang aus erzwungener Ausrichtung |
| Standzeit | bis zum nächsten Wort: Median 180 ms, p10 80 ms, p90 440 ms; 207 Wörter stehen < 133 ms (unter 4 Bildern) | wie gesprochen, keine Mindeststandzeit, Lücken nie leer |
| Animation | keine: Das Wort steht vom ersten Bild an in voller Größe (Breite in Bild 1–5 nach dem Wechsel konstant) | harter Wechsel, kein Pop, kein Hüpfen, kein Karaoke |
| Lage | waagerecht zentriert (Mitte x = 287–289 von 576); Mitte senkrecht bei 70,6–71,2 % der Bildhöhe | Mitte x = 540, Mitte y = 1 355–1 370 px; liegt über der TikTok-Beschreibungszone (u: Gerätetest) |
| Schrift | fette, runde geometrische Groteske in Kleinbuchstaben, ähnlich Montserrat ExtraBold oder Black (u: Familie nicht bestimmbar) | Montserrat 800 oder 900 (OFL), lokal eingebunden |
| Größe | Oberlänge 36 px, Ober- bis Unterlänge 46–47 px im 576er Bild, also ≈ 68 bzw. ≈ 88 px bei 1080 | Schriftgröße 90–95 px; Wortbreite ≤ 864 px (80 %), sonst ein Stück kleiner (≥ 72 px) oder das Wort trennen. „cornfields“ misst 232/576 = 40 % der Breite |
| Farbe | Füllung Weiß; schwarze Kontur 2–3 px im 576er Bild, also ≈ 4–6 px; weicher Schlagschatten | Weiß `#FFFFFF`, Kontur Schwarz 5 px, Schatten 0 3px 6px rgba(0,0,0,.6) (a) |
| Schreibung | ohne Satzzeichen; klein, außer Eigennamen und Familienrollen („Mom“, „Dad“, „Grandpa“, „Mr“, „Mrs“, „Porch Night“, „Harpers“); ein Ruf in VERSALIEN („OPEN THE DOOR“) | genauso; Versalien nur für Schreien |
| **Farbe = Sprecher** | Nur wörtliche Rede ist farbig, eine Farbe je Figur: Opa Gelb ≈ `#F2D364`, Vater Hellblau ≈ `#8EC3F4`, Mutter Rosa ≈ `#EF9FBA`, die Stimme der Leute („one for the porch“) Orange ≈ `#F3AF66`; Werte aus komprimierten Bildern | Erzähltext Weiß, Dialog in einer festen Farbe je Figur über das ganze Video; ≤ 4 Farben |
| Dialoganteil | 6 Sprecherwechsel, 57 von 744 Wörtern farbig (7,7 %) | 5–10 % der Wörter |
| Weitere Texte | keine (kein Titel, keine Kapitel, kein Hinweis auf Folge 2) | keine |

## 6. Bildregeln

**Welt und Figuren**

| Merkmal | Referenz (g) | Vorgabe (a) |
|---|---|---|
| Schauplatz | eine US-Kleinstadt-Map: Holzhäuser mit Veranda und Geländer, Straßenlaternen, Straße mit Mittellinie, Maisfeld; Innenräume (Esszimmer, Flur, Haustür, Fenster) | eine Map je Geschichte, 4–6 wiederkehrende Orte; die Gegenstände der Regel (Veranda, Stuhl, Tür, Schloss) stehen im Mittelpunkt |
| Figuren | Roblox-Blockavatare; Kostüm = Identität, über das ganze Video gleich: Erzähler (blond, gelb-schwarz gestreiftes Shirt), Vater (rot karierte Flanell, Bart), Mutter (grüne Strickjacke, Dutt), Opa (grau, Hosenträger), Mr. Wendell (Zylinder, schwarzer Anzug), Mrs. Pell (weißes Haar, rote Strickjacke, Decke), Fisher-Junge (blau, gefesselt), Danny; Monster: Vogelscheuche mit Sackgesicht | ≤ 8 Figuren, jede mit einem Erkennungsmerkmal in Farbe oder Form, das in der Halbtotalen sichtbar ist |
| Mimik | Gesicht als Aufkleber, je Gefühl getauscht: ruhiges Lächeln (Opa), Angst, Weinen, Schreien mit rotem Mund, Wut mit Bart (Vater im Höhepunkt) | Gesicht je Beat passend zum Satz; Schreigesicht nur ab dem zweiten Wendepunkt |
| Spiel | Animationen statt Standposen: gehen, umarmen, packen, gestikulieren, sich vorbeugen (Monster) | Jede Einstellung mit einer Figur hat eine Bewegung |
| Monster-Anteil | in 6 von 29 Stichproben (21 %): Akt 1 (0–23 s), einmal im POV (66 s), Schluss (162 s); Monster im ersten und im vorletzten Inhaltsbild | 15–25 % der Einstellungen; erstes Bild und Schlussbeat |

**Kamera und Einstellungsgrößen** (29 Stichproben, Einstellungsmitten, ohne Abspannkarte, g)

| Größe | Anteil | Beispiel |
|---|---|---|
| Nah (Kopf und Oberkörper) | 9 (31 %) | Mutter weint, Mrs. Pell, Fisher-Junge |
| Halbnah | 6 (21 %) | Vater im Fenster, Erzähler an der Tür |
| Halbtotale (Gruppe, ganze Figur) | 7 (24 %) | Wendell zahlt, Umarmung, Vogelscheuche im Feld |
| Groß / Detail | 4 (14 %) | Sackgesicht, Tür beim Klopfen |
| Totale ohne Figur | 2 (7 %) | Straße, Hausfassade |
| POV durchs Fenster | 1 (3 %) | Vogelscheuche beugt sich zum Opa |

- **Kamera bewegt sich langsam:** In 8 von 10 geprüften Einstellungen gibt es ein Heranfahren, eine Fahrt oder einen Schwenk; 2 stehen und die Figur bewegt sich (g). Schnelle Bewegung gibt es nur im Start-Wisch. Vorgabe: ≥ 75 % der Einstellungen mit langsamer Fahrt, Zoom ≤ 10 % je Einstellung (a; Zoom-Betrag nicht gemessen, u).
- **Augenhöhe** der Figur als Standard; Untersicht für das Monster; Luftbild für Orientierung (0,9 s); Über-die-Schulter-Blicke und Blick durch Fenster für den Erzähler (g).
- **Wörtlich bebildern:** Das Bild zeigt das genannte Ding („rocking“ zeigt den Schaukelstuhl, „smashed“ das zerbrochene Fenster, „knocking“ die Tür). Vorgabe ≥ 90 % (Referenz 93 %, g).

**Licht** (29 Stichproben, g)

| Phase | Licht | Anteil |
|---|---|---|
| Monster-Akt und Nacht ab 97 s | Nacht außen: Sternenhimmel, Laternen, kühles Mondlicht | 12 (41 %) |
| Familie, Esstisch, Abschied, Wendung | warmes Innenlicht (Deckenlampe, beige Wände) | 9 (31 %) |
| Welt und Regeln (24–60 s) | Tag oder Dämmerung außen | 6 (21 %) |
| übrige | beleuchtete Veranda, Fenster von außen | 2 (7 %) |

Vorgabe (a): Das Licht folgt der Erzählzeit. Das Monster erscheint nur nachts. Der Tag zeigt die „normale“ Welt, warmes Innenlicht die Familie. Die Referenz hält das nicht streng ein: Bei „We call it porch night“ (24 s) ist Tag.

**Technik und Wasserzeichen**

- **Referenz** (g): 576 × 1024, 30 fps, H.264 mit 0,94 Mbit/s. TikTok-Wasserzeichen mit Logo und „@concet5612“ wechselt zwischen links Mitte und rechts unten. Ab 166,83 s folgt eine 3,97 s lange TikTok-Abspannkarte. Alles davon sind Download-Spuren.
- **Vorgabe** (a): 1080 × 1920, 30 fps, eigenes Original hochladen. Nie ein heruntergeladenes Video mit Wasserzeichen neu hochladen: Laut Sekundärquelle schließt Creator Rewards Videos mit Wasserzeichen aus (§11).

## 7. Tonregeln

| Merkmal | Referenz (g) | Vorgabe (a) |
|---|---|---|
| Stimme | eine Erzählstimme, mono in der Mitte (Seitensignal in Wörtern −27,8 dB, in Lücken −27,4 dB, also ohne Stimme) | eine Stimme, mono, mittig |
| Tonhöhe | Grundton im Median 191 Hz (p10 133, p90 252); Formant-Schätzung F1 ≈ 606 Hz, F2 ≈ 2 389 Hz (grob, Musik stört) | Hohe Lage passt zum kindlichen Ich-Erzähler. Typisch sind 90–155 Hz für Männer, 165–255 Hz für Frauen (§11). Die Referenz liegt im Frauen- bzw. Jungenbereich. Ob Frau, Junge oder hochgepitchte Männerstimme: u |
| Dialog | dieselbe Stimme, im Dialog höher: Opa 244 Hz, Vater 262 Hz, Mutter 227 Hz gegen 188 Hz Erzählung; Wortdauer gleich (0,179 gegen 0,186 s) | Dialog mit derselben Stimme, erregter und höher; keine eigene Stimme je Figur |
| TTS oder echt | Hinweise auf TTS mit gekürzten Pausen: Tempo konstant (±7 %), keine Pause > 0,32 s, sehr hohe Whisper-Sicherheit | u: nicht hörend geprüft. Eigene Produktion: TTS mit ausdrucksstarker Stimme, danach tonhöhenerhaltend auf das Zieltempo (§2) |
| Musik | durchgehendes Musikbett, stereo, tonal: Seitensignal-Spitzen bei 64, 81, 129, 161, 216, 257, 322 und 432 Hz, passend zu A = 432 Hz | Musikbett von 0 s bis zum letzten Wort, stereo, ohne Gesang |
| Musikdramaturgie | Bett im Seitensignal: 0–43 s ≈ −30,6 dB; 43–131,5 s ≈ −24 dB (+6 dB, ab „Mr. Wendell pays a kid“); 131,5–166,7 s ≈ −31 dB (dünn, ab „Mom covered her mouth… Open the door!“) | drei Stufen: leise bis 26 %, voller (+6 dB) bis 79 %, im Höhepunkt zurück auf leise |
| Abstand Musik zu Stimme | RMS der Mitte in Wortlücken −21,3 dB gegen −16,8 dB in Wörtern; Musik also ≥ 4,5 dB unter der Stimme, geschätzt 4–7 dB | Musik 6–9 dB unter der Stimme (a: etwas mehr Abstand als die Referenz, wegen der Verständlichkeit) |
| Geräusche | keine nachweisbar: Seitensignal ohne Spitze > 8 dB über dem Bett; an Tisch (88,8 s), Klopfen (118,9 s), Glas (136,9 s) und Tür (150,8 s) kein Ausschlag über p99. Klopfen, Glas und Knarzen werden nur erzählt. Der laute Tiefton bei 166,9–167,2 s fällt in die Abspannkarte (vermutlich TikToks Abspann-Ton, u) | Option, nicht Pflicht: höchstens 1 Geräusch je 20 s auf Schlüsselwörtern. Die Referenz kommt ohne aus (u: mono gemischte Geräusche wären im Mittelsignal versteckt) |
| Lautheit | integriert −13,7 LUFS (0–166,8 s), LRA 2,1 LU, Kurzzeit −15,8 bis −11,7 LUFS, True Peak +0,4 dBFS (Übersteuerung nach Umkodierung) | −14 LUFS integriert, LRA ≤ 4 LU, True Peak ≤ −1 dBTP. TikTok normalisiert, nennt aber keinen Zielwert. −14 LUFS ist eine Arbeitsannahme nach dem Wert von YouTube und Spotify (§11) |
| Ende | letztes Wort endet 166,68 s, Schnitt 166,83 s (0,15 s danach), kein Nachklang | Ton und Bild enden ≤ 0,2 s nach dem letzten Wort |

## 8. Geschichtenbauplan

**Akte der Referenz** (Zeiten aus den Whisper-Wortzeiten, g; Anteil an 166,8 s)

| Akt | Zeit | Anteil | Inhalt |
|---|---|---|---|
| 0 Hook | 0,00–5,32 s | 3 % | Regel + Folge in einem Satz |
| 1 Monster & Ritual | 5,56–23,38 s | 11 % | Herkunft, Größe, Material, Gesicht; Gang mit Leitgeräusch (Stroh knarzt); Ritual (beugt sich herab, Nähte reißen auf) |
| 2 System | 23,54–58,14 s | 21 % | Name („porch night“), ein Stuhl, „only one rule“; Beweis, dass Verstecken scheitert (die Harpers); Gesellschaft: Alte zuerst, Reiche zahlen ein armes Kind, „one for the porch“, Fesseln, alle klopfen und niemand öffnet |
| 3 Persönlich | 58,44–80,62 s | 13 % | Opa letztes Jahr (freiwillig, würdevoll, „It's me. I've had a good run.“), erste gezeigte Tötung; Vater als bester Vater: „buddy“, prüft jedes Schloss dreimal, „Not on my watch“ |
| 4 Entscheidung | 80,73–97,08 s | 10 % | nur noch zu dritt; Mutter: „whoever we need the least“ und sieht den Erzähler an; Vater schlägt auf den Tisch und meldet sich (falsche Sicherheit) |
| 5 Die Nacht | 97,28–136,68 s | 24 % | Nachbarn auf den Veranden (Payoffs); Abschied; Laternen gehen aus; Knarzen; Schreie; Klopfen; Danny rennt, Wendell hält die Tür zu, Danny ist weg; Vater klopft leise, dann laut, dann Stille; „he's okay“ |
| 6 Wendung | 136,92–150,82 s | 8 % | Glas zerbricht; Vater kommt durchs Fenster, stößt die Mutter, packt den Sohn: „I'm sorry, buddy“ und wirft ihn hinaus |
| 7 Höhepunkt | 150,98–161,78 s | 6 % | Sohn draußen, Knarzen auf dem Weg; das Monster beugt sich herab, bis sein Gesicht vor seinem ist |
| 8 Schluss | 161,78–166,68 s | 3 % | Nähte platzen; „behind the door, I heard dad check the lock, three times.“ |

**Wendepunkte** (g): W1 23,5 s vom Monster zum System · W2 58,4 s vom Allgemeinen zum Persönlichen · W3 85,3 s Bedrohung des Erzählers · W4 88,8 s Schutzversprechen · W5 123–130 s Spiegelszene (ein anderes Kind wird ausgesperrt) · **W6 136,9 s Wendung bei 82 %** · W7 150,8 s Erzähler draußen · W8 164–166,7 s letzte Zeile.

**Setup und Payoff** (g; alle 9 Setups liegen vor 81 s, also in der ersten Hälfte, alle Payoffs danach):

| # | Setup | Payoff |
|---|---|---|
| 1 | „bends all the way down until its face is right in front of yours“ (16–21 s) | „until its face was right in front of mine“ (157–161,8 s), fast wörtlich |
| 2 | „the stitches rip open“ (21–23 s) | „The stitches started to pop, one by one“ (161,8–164 s) |
| 3 | „he checks every lock in the house, three times“ (77–79,4 s) + „Nothing gets in here, buddy. Not on my watch.“ | letzte Zeile „I heard dad check the lock, three times“ (164–166,7 s) |
| 4 | „Mr. Wendell pays a kid… A new kid every year“ (42,5–46 s) | Danny auf Wendells Veranda (102–106 s); Wendell hält die Tür zu (123,5–126 s) |
| 5 | „some families tie the person to the chair“ (49–51,9 s) | „The Fisher Boy, tied to his chair“ (100,9 s) |
| 6 | „everyone knocks… and nobody opens“ (51,9–58 s) | Vater klopft: „Honey, open the door… Open the door!“ (128,7–134,2 s) |
| 7 | „straw creak with every step“ (13–16 s) | „we heard the straw creaking“ (114 s), „the creaking on our path“ (153–155 s) |
| 8 | „Old people go first“ (38,7 s) | Opa (58,4 s), Mrs. Pell (99,5 s) |
| 9 | Harpers sperren sich ein, das Haus ist trotzdem leer (31,8–37,5 s) | erklärt stumm, warum der Vater jemanden hinauswerfen *muss* |

**Sprache** (g):

- **Satzlänge:** Median 7 Wörter, Mittel 9,0, p10 4, p90 16, min 2, max 33; 28 % der Sätze haben ≤ 5 Wörter, 71 % ≤ 10. Die 3 Sätze mit ≥ 20 Wörtern stehen alle in den ersten 23 s.
- **Satzlänge über die Zeit** (Median je Abschnitt): 0–30 s 14 Wörter, 30–60 s 10, 60–90 s 6, 90–120 s 7, 120–150 s 6,5, 150–167 s 8.
- **Satzdauer:** Median 1,54 s, p10 0,68 s, p90 2,85 s; der Schnitt (Median 1,40 s) folgt dem Satztakt.
- **Leitwörter:** „porch“ 13×, „door“ 10×, „chair“ 6×, „every“ 12×, „then“ 12× (Abfolge „Then…“).
- **Muster:** Dreierreihen („knocking, begging, and nobody opens“; „the table, the chairs, the door frame“) und Wiederholung im Dialog („I'm sorry, buddy, I'm sorry, I'm sorry“; „he's okay, he's okay“; „Open the door! Open the door!“).
- **Erzählform:** Ich-Erzähler, ein Kind („Danny from my class“, „He coaches my team“), Präteritum, Allgemeines im Präsens („In this town… every family has to…“).

**Bauplan für neue Folgen** (a; Prozent der Laufzeit, Sekunden bei 165 s):

| Block | Anteil | bei 165 s | Pflichtinhalt |
|---|---|---|---|
| 0 Regel-Hook | 0–3 % | 0–5 s | Ort, Wiederkehr, Pflicht, rätselhafte Folge in einem Satz; Monster im ersten Bild |
| 1 Monster | 3–14 % | 5–23 s | ≥ 3 sinnliche Merkmale, ein Leitgeräusch, das Tötungsritual Schritt für Schritt |
| 2 System | 14–35 % | 23–58 s | Name des Rituals, *eine* Regel, ein gescheiterter Umgehungsversuch, ≥ 3 grausame Alltagsregeln der Gesellschaft (jede wird später geerntet) |
| 3 Persönlich | 35–49 % | 58–81 s | letztes Opfer aus der eigenen Familie (ruhig); Schutzfigur mit Kosenamen, einer Gewohnheit (Zahl!) und einem Versprechen |
| 4 Entscheidung | 49–58 % | 81–96 s | Erzähler wird bedroht, die Schutzfigur opfert sich, also falsche Sicherheit |
| 5 Nacht | 58–82 % | 96–135 s | Payoffs der Welt; Ankunft mit Leitgeräusch; Spiegelszene mit einer Nebenfigur; Schutzfigur klopft leise, dann laut, dann still |
| 6 Wendung | 82–91 % | 135–150 s | Die Schutzfigur bricht das Versprechen und opfert den Erzähler; Entschuldigung mit dem Kosenamen |
| 7 Höhepunkt | 91–97 % | 150–160 s | Ritual aus Block 1 fast wörtlich am Erzähler |
| 8 Schlusszeile | 97–100 % | 160–165 s | Payoff der Gewohnheit aus Block 3; Tod nur angedeutet; Schnitt ≤ 0,2 s nach dem letzten Wort; kein Aufruf, keine Moral, kein „Teil 2“ |

Prüfbare Regeln (a):

- Wendung bei 78–86 % der Laufzeit.
- ≥ 6 Setup-Payoff-Paare, Setups vor 50 %, Payoffs danach.
- Die Schlusszeile wiederholt eine Formulierung aus der ersten Hälfte.
- Die Hook-Formulierung des Rituals kehrt im Höhepunkt wieder.
- Dialog: 4–7 Zeilen, 5–10 % der Wörter.
- Satzlänge: Median 6–8 Wörter, ≥ 20 Wörter nur in den ersten 15 %.
- Lesbarkeit Englisch: Flesch ≥ 85. Für Deutsch gibt es noch keinen Zielwert (u).

## 9. BANNED und offene Werte

**Kommt in der Referenz nicht vor (a, als Verbot übernommen):**

1. Titelkarte, Intro, Begrüßung, „Part 1“, Kanal-Logo im Bild.
2. Aufruf zum Folgen, Abspann, Moral oder „Teil 2“ am Ende.
3. Pausen > 0,35 s, Tempowechsel für Dramatik, Bilder ohne Untertitel.
4. Untertitel-Kästen, Karaoke-Grau, Pop- oder Hüpfanimation, mehrere Wörter je Einblendung.
5. Farbige Wörter außerhalb der wörtlichen Rede; Farbe ohne feste Figur.
6. Einstellungen > 4,3 s; Kreuzblenden zwischen Szenen.
7. Ein Bild, das etwas anderes zeigt als den laufenden Teilsatz (mehr als 10 %).
8. Eine zweite Erzählstimme; Figuren mit wechselndem Kostüm.
9. Fremde Videos neu hochladen; Wasserzeichen im Bild.

**Offen (u), mit Prüfweg:**

| Frage | Prüfweg |
|---|---|
| Gilt der Takt (1,4 s, 268 Wörter/min, Wendung bei 82 %) für das Genre oder nur für diesen Kanal? | ≥ 5 weitere Referenzen gleich messen (Skripte in §10) |
| Stimme: Frau, Junge oder hochgepitcht? TTS-Anbieter? | anhören; Vergleich mit Stimmproben gängiger TTS-Stimmen |
| Funktioniert das Tempo auf Deutsch (5,6 Silben/s)? | Probe-Folge in zwei Tempi, Hör-Check mit faster-whisper (Wortfehlerrate) und Abbruchrate in TikTok-Analytics |
| Schriftfamilie der Untertitel | Ausschnitt mit Montserrat 800 und 900 übereinanderlegen |
| Zoom-Betrag der Kamerafahrten | optischer Fluss je Einstellung (ffmpeg `mestimate` oder OpenCV) |
| Monogemischte Geräusche | Ton trennen (z. B. Demucs) und das Geräuschband prüfen |
| Herkunft von Map und Avataren (Lizenz, Roblox-Nutzungsbedingungen) | eigene Spur |

## 10. Messprotokoll (Referenz)

Alle Arbeitsdateien liegen in `scratchpad/horror-work/`, das Original in `scratchpad/horror-ref/`.

| Messung | Werkzeug | Datei |
|---|---|---|
| Transkript mit Wortzeiten | faster-whisper `small`, int8, `language="en"`, `word_timestamps=True`, beam 5 | `horror-work/transkript.json`, `transkriere.py` |
| Wortzahl, Tempo, Pausen | Wortzeiten (erstes Wort 0,00 s, letztes Ende 166,68 s) | `stats.py` |
| Sätze (Mr./Mrs. nicht als Satzende) | Wortzeiten | `saetze.py`, `saetze.json` |
| Schnitte | `schnitte.txt` (116 Zeiten) gegen Wortzeiten | `schnitte.py` |
| 30 Bilder | ffmpeg, Einstellungsmitten gleichmäßig verteilt | `bilder30/`, `raster1–3.png` |
| Untertitel-Farbe, Sync, Größe | Rohband y 695–765 im 576er Bild, Konturerkennung | `capgrid_0–2.png`, `farbe.py`, `capsync.py`, `capmass2.py`, `pop.py` |
| Lautheit | `ffmpeg ebur128=peak=true`, nur 0–166,8 s | — |
| Mitte und Seite, Musikbett, Geräusche | numpy, Mitte = (L+R)/2, Seite = (L−R)/2, 44,1 kHz | `tonanalyse.py`, `musik.py`, `sfx.py`, `sfx2.py`, `spek_*.png` |
| Grundton, Formanten | Autokorrelation (60–400 Hz, Korrelation ≥ 0,5), LPC 12. Ordnung; grob, Musik stört | `stimme.py`, `formanten.py`, `dialogf0.py` |

## 11. Quellen

- Referenzvideo `ref.mp4` (TikTok-Download, Kommentar-Tag `vid:v15025gf0000dbmfov7og65i0jeshfm0`), lokal gemessen am 14.11.2026.
- Grundton Männer 90–155 Hz, Frauen 165–255 Hz: Wikipedia, „Voice frequency“, https://en.wikipedia.org/wiki/Voice_frequency (abgerufen 14.11.2026; stützt sich auf Fitch & Holbrook 1970).
- Hörbuch-Erzähltempo 150–160 Wörter/min (Sekundärquelle, Blog): https://virtualspeech.com/blog/average-speaking-rate-words-per-minute (abgerufen 14.11.2026, Datum der Seite nicht geprüft).
- Creator Rewards: Videos über 1 min, keine Wasserzeichen, Deutschland teilnahmeberechtigt, ab 18 Jahren, 10 000 Follower, 100 000 Aufrufe in 30 Tagen. Metricool, „TikTok Creator Rewards Program“, 17.03.2025, https://metricool.com/tiktok-creator-fund/ (Sekundärquelle, älter als ein Jahr; die offizielle TikTok-Seite lädt nur mit JavaScript und wurde nicht gelesen).
- Lautheit: OpenClip, „Audio Normalization“, https://openclip.app/learn/audio-normalization (abgerufen 14.11.2026, Datum der Seite nicht geprüft). Dort steht: YouTube und Spotify zielen auf etwa −14 LUFS, TikTok und Instagram „apply their own normalization passes“; einen TikTok-Wert nennt die Seite nicht.
