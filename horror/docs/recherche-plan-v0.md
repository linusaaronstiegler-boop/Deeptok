# Plan: Roblox-Horror-Storys auf TikTok

Stand 14.11.2026. Grundlage sind fünf Recherche-Spuren (Nische, Herstellung, Recht, Herstellungswege, Referenz-Analyse), die Messung am Referenzvideo „Porch Night“ von @concet5612 und eine Nachprüfung der Quellen am selben Tag. Quellen stehen als Kürzel in eckigen Klammern, die Liste steht am Ende. **(S)** heißt eigene Schätzung, **(u)** heißt unbelegt, **(A)** heißt Arbeitsannahme für den Test. Aufrufzahlen auf TikTok ändern sich stündlich; wo zwei Abrufe vom 14.11.2026 abweichen, steht die Spanne. Keine Rechtsberatung.

---

## 1. Urteil

**Ja, als befristetes 30-Tage-Experiment, und nur auf einem Weg:** Roblox Studio läuft auf deinem PC, Claude inszeniert dort die Szenen per Skript und nimmt sie mit OBS auf, während Geschichte, Stimme, Untertitel, Schnitt und Auswertung automatisch laufen. Viele Aufrufe bringt das Format nicht von selbst: @concet5612 liegt im Median der 10 neuesten Videos bei 139.000–190.000 (zwei Abrufe am 14.11.2026 [N1]), neue Nachahmer-Konten bei 114 bis 9.941 [N3]. Der Trend „In this town“ ist jung (alle 10 Top-Videos des Hashtags vom 27.10. bis 13.11.2026 [N2]) und kann so schnell abflauen, wie er kam (u). Wir setzen deshalb auf Handwerk und auf das dauerhafte Format Roblox-Story (#robloxstory: 49,9 Mrd. Aufrufe, Top-Videos von 2022 bis 2024 [N2]), nicht auf den Hashtag. Die Referenzqualität geht nicht aus der Cloud allein, weil Roblox Studio nur unter Windows und Mac läuft [P3]. Dass dich ein Video nur 15–30 Minuten kostet, ist ungetestet (S): Läuft es auf Handanimation hinaus (8–20 h je Video, S), lohnt es sich nicht. Den Plot der Referenz übernehmen wir nicht, denn er ist fremder Stoff (§ 23 UrhG [L6]), und ein Vater, der sein Kind opfert, trifft TikToks Verbot von „Neglect, endangerment, or physical or emotional abuse of young people“, für das ich keine Ausnahme für Fiktion gefunden habe [L3]. Deutsch wird der Hauptkanal, weil die deutsche Welle etwa 2 Wochen alt ist [N6] und ein düsterer 2,5-Minuten-Kanal dort fehlt (u). Leer ist sie aber nicht: Mindestens sechs deutsche Konten posten dort schon 12–62 Videos pro Woche [N6]. Englisch läuft als Zweitkonto aus denselben Aufnahmen. Geld gibt es frühestens ab 10.000 Followern [G1], in den ersten Monaten also realistisch 0 €. Offen ist außerdem, ob Roblox monetarisierte Videos mit klassischen Avataren heute noch ohne Freigabe duldet (§ 7).

---

## 2. Empfohlener Herstellungsweg: Studio auf dem PC, Regie per Skript

### Aufbau

| Wo | Was | Werkzeug |
|---|---|---|
| Cloud (Claude) | Geschichte, Hook-Varianten, Shotliste, Stimme, Wortzeiten, Hör-Check | bestehende DeepTok-Pipeline: Stimmen-Anbieter (`voices/`), faster-whisper, Python |
| PC (Claude Code lokal) | Set bauen, Figuren setzen, Regie-Skript abspielen, Aufnahme, Endschnitt mit Untertiteln | Roblox Studio mit eingebautem MCP-Server [P1], OBS ≥ 28 mit obs-websocket [P6], ffmpeg |
| Austausch | Skript, Shotliste, `timing.json`, Tonspur (wenige MB) | eigenes Git-Repo |
| Auslieferung | fertige MP4 plus Text für Titel und Hashtags | Google-Drive-Ordner, von dort lädst du hoch (Handy oder TikTok-Web) |

- **Warum Claude Code direkt auf dem PC?** Der Studio-MCP läuft lokal über stdio. Er verbindet sich mit Claude Code oder Claude Desktop, nicht mit claude.ai im Web [P1][P2]. Roblox bietet dafür ein offizielles Claude-Code-Plugin „Roblox Studio“ an [P2]. Ob eine Cloud-Sitzung über Remote Control an den MCP-Server herankommt, ist ungeklärt (u). Die sichere Variante ist deshalb eine eigene Claude-Code-Sitzung auf dem PC.
- **Endschnitt auf dem PC:** So müssen keine Rohaufnahmen hochgeladen werden (3 min bei 20.000 kbit/s sind etwa 450 MB, eigene Rechnung; mit Vor- und Nachlauf je Einstellung eher das Doppelte, S).

### Regie per Skript (Konzept, auf dem PC ungetestet)

1. **Figuren:** `HumanoidDescription` mit Katalog-IDs (Kleidung, Gesicht, Farben), dann `Players:CreateHumanoidModelFromDescriptionAsync` als R6 [P1a]. Jede Figur ist ein festes Modell und sieht deshalb in allen Einstellungen gleich aus. Dass Katalog-Kleidung auch ohne Kauf lädt, ist eine Annahme (u), die Phase 0 prüft.
2. **Posen und Bewegung:** über Motor6D-Winkel, Standardanimationen oder eigene KeyframeSequences [P1a]. Gesichter wechseln je Einstellung per Face-ID.
   - Eigene KeyframeSequences bekommen über `KeyframeSequenceProvider` nur eine temporäre ID, die außerhalb von Studio nicht gilt [P1a]. Für die Aufnahme in Studio reicht das.
   - Im Bearbeitungsmodus laufen Animationen nicht von selbst. `Animator:StepAnimations` geht nur aus der Befehlszeile oder einem Plugin [P1a]. Ob `execute_luau` im Edit-Modus diese Rechte hat, ist offen (u). Sonst wird im Testlauf aufgenommen (`start_stop_play` [P1]).
   - Die MCP-Werkzeuge `generate_animation` (Text zu Animation, bis 10 s) und `generate_avatar` erzeugen nur R15 [P1]. Für R6-Figuren helfen sie nicht; ob R15 für den Look reicht, entscheidet der Kontaktbogen.
3. **Kamera und Licht:** Kamera auf `Scriptable` mit Start- und End-CFrame für die langsame Fahrt. Nacht, Nebel und Laternen werden ebenfalls per Skript gesetzt. Studio-Rendering vorher auf Editor Quality 21 und Mesh Detail Level00 stellen [P4].
4. **Aufnahme:** Jede Einstellung läuft mit Vor- und Nachlauf, dazwischen kommt ein kurzer Farbblitz als Trennmarke. So lässt sich eine Aufnahme auf die Wortzeiten beider Sprachen schneiden. Die zweite Sprache kostet damit nur Stimme, Untertitel und Neuschnitt (Konzept, ungetestet). Aufgenommen wird in Echtzeit: jede Einstellung mindestens in ihrer Länge, dazu Wiederholungen.
5. **Kontrolle vor der Aufnahme:** Claude holt mit `screen_capture` [P1] ein Startbild jeder Einstellung als Kontaktbogen. Das Werkzeug nimmt auch eine eigene Kameraposition und einen Blickpunkt an [P1].
6. **Aufnahme-Einstellungen:** OBS mit NVENC H.264, CBR, mindestens 20.000 kbit/s, Preset P4, MKV mit automatischem Remux [P4, Stand 2024]. Ziel ist eine native Aufnahme im Hochformat 1080 × 1920 über die Geräte-Emulation von Studio (Konzept, u). Dafür muss der Studio-Viewport wirklich 1.920 Pixel hoch sein: Auf einem Monitor mit 1.440 Pixeln Höhe passt das nicht. Lösungen sind ein hochkant gedrehter Monitor, ein 4K-Monitor oder ein virtuelles Display (u, Phase 0 prüft). Rückfall: ein Ausschnitt aus 1440p ergibt nur 810 × 1440 und muss hochskaliert werden. TikTok nennt 1080p oder mehr als Kriterium für den Additional Reward [G1]. Für die Grundteilnahme ist es keine Pflicht, und auch concet lädt laut Embed nur in 1280 × 720 hoch [N1].
7. **Sicherheit:**
   - Creator-Store-Modelle können Skripte enthalten, die zur Laufzeit weitere Assets nachladen [P11]. Deshalb vor Gebrauch alle Skripte entfernen oder per „Disable Scripts“ abschalten [P11].
   - Für das Projekt einen eigenen Ort anlegen, weil MCP-Clients den geöffneten Ort verändern dürfen [P1][P2].
   - Claude Code läuft unter nativem Windows ohne Sandbox [P10]. Deshalb Berechtigungsabfragen anlassen und nur im Projektordner arbeiten lassen.

### Risiken von Weg A, die Phase 0 klären muss

- **Bildgröße:** native 1080 × 1920 nur mit passendem Monitor oder virtuellem Display (Punkt 6, u).
- **Roblox-Logo im Bild:** Im Testlauf blendet Roblox oben links ein Symbol ein, das ein Nutzer im Mai 2024 als Wasserzeichen-artig beschrieb [P4, älter]. Lösung: im Bearbeitungsmodus aufnehmen, die Oberfläche ausblenden oder den Rand wegschneiden (u).
- **Animation im Bearbeitungsmodus:** Punkt 2 (u).
- **PC belegt:** Während Claude baut und aufnimmt, muss Studio offen und sichtbar sein. Das sind die 2–4 Claude-Stunden je Video (S), also bei 4 Geschichten pro Woche etwa 8–16 Stunden, in denen du den PC nicht frei nutzen kannst (S).
- **Werkzeuge im Umbruch:** Der MCP-Server ist neu, seine Werkzeugliste und Menüpfade ändern sich (die Doku nennt „… → Manage MCP Servers“, das Plugin-README schon „… → Settings → MCP Servers“ [P1][P2]).
- **Avatar-Regel:** ob Roblox klassische Avatare in monetarisierten Videos weiter ohne Freigabe duldet (§ 7, u).

### Arbeitsteilung

**Claude, automatisch:**
- **Stoff:** Je Geschichte 3 Prämissen zur Wahl, die gewählte als Skript nach Bauplan (§ 4) auf Deutsch und Englisch, dazu 3 Hook-Varianten für den ersten Satz.
- **Shotliste:** als JSON mit Satz, Ort, Figuren, Pose, Gesicht und Kamerafahrt; rund 110–120 Einstellungen je Video.
- **Ton:**
  - Stimme per API, danach tonhöhenerhaltend beschleunigt und Pausen über 0,35 s gekürzt.
  - Hör-Check mit faster-whisper.
  - Musikbett in drei Stufen, Lautheit −14 LUFS (A, siehe § 4).
- **Bühne und Aufnahme:** Set und Figuren in Studio, Regie-Skript, Kontaktbogen, OBS-Aufnahme per Websocket.
- **Fertigstellung:** Schnitt nach Wortzeiten, Untertitel Wort für Wort, Render 1080 × 1920, Upload-Paket mit MP4, Bildunterschrift und Hashtags im Drive.
- **Auswertung:**
  - Täglich die öffentlichen Aufrufzahlen über das offizielle Creator-Embed, ohne Login [N1]. Das Embed zeigt nur die 10 neuesten Videos und nur Aufrufe; Likes und Shares stehen auf der öffentlichen Videoseite. Ob tägliches automatisches Abrufen mit TikToks Nutzungsbedingungen vereinbar ist, habe ich nicht geprüft (u). Der sichere Weg sind deine Zahlen aus TikTok Studio.
  - Wöchentlich ein Bericht mit dem Vergleich zu den Zielen aus § 5.

**Du:**
- **Einmalig:**
  - Roblox Studio, OBS und Claude Code installieren, in Studio anmelden.
  - MCP einschalten: Assistant → … → Manage MCP Servers (in neueren Versionen … → Settings → MCP Servers) → „Enable Studio as MCP server“ [P1][P2].
  - In OBS das Websocket-Passwort setzen und den Projektordner klonen.
  - TikTok-Konten anlegen.
  - Geschätzt etwa 1 h (S).
- **Je Video:**
  - Prämisse wählen und den Twist kurz anpassen: 2–5 min. Das macht den Stoff menschlich geprägt, siehe § 7.
  - PC mit Studio offen lassen, solange Claude baut und aufnimmt: 2 min Handgriff, der PC ist aber 2–4 h belegt (S).
  - Kontaktbogen und fertiges Video ansehen: 5–8 min.
  - Hochladen: 3–5 min je Konto.
- **Wöchentlich:** Screenshots der Zuschauerbindung aus TikTok Studio schicken (etwa 10 min). Diese Werte sind nicht öffentlich.

**Deine Zeit je Video: etwa 15–25 Minuten bei einer Sprache, plus etwa 5 Minuten für jedes weitere Konto (S).** Nicht eingerechnet sind Nachaufnahmen, wenn der Kontaktbogen Fehler zeigt. Dazu kommen einmalig etwa 1 h Einrichtung und der Pilot über 2–4 Abende, an denen du nur zeitweise dabei sein musst (S, [P-a]).

**Claude-Zeit je Video:** 2–4 h, sobald Sets wiederverwendet werden. Ein neues Set kostet zusätzlich 1–3 h (S, [P-a]). Das geht vom Kontingent deines Claude-Abos ab. Ob es neben der DeepTok-Fabrik reicht, ist offen (u).

---

## 3. Vergleich der Wege

| Weg | Qualität ggü. Referenz | Kosten je Video | Zeit je Video | Deine Handarbeit | Hauptrisiko |
|---|---|---|---|---|---|
| **A: Studio + MCP + OBS, Regie per Skript (empfohlen)** | gleich, weil dieselbe Engine; Bewegungen evtl. steifer (S) | ≈ 0 € plus Stimme: Inworld ≈ 0,20 $ je Geschichte in zwei Sprachen [G5c] oder ElevenLabs 6–22 USD/Monat [G5] | Claude 2–4 h; Pilot 2–4 Abende (S) | 15–25 min (S) | Skript-Regie ungetestet; native 1080 × 1920 hängt am Monitor; der PC ist belegt; MCP-Werkzeuge sind neu und können sich ändern; Avatar-Regel von Roblox unklar |
| A′: Studio + Moon Animator von Hand | gleich bis besser | 19,99 USD einmalig im Sale (−33 %, regulär also etwa 30 USD) [P5] oder Apex Animator gratis [P5] | anfangs 8–20 h (S) | über 80 % | dein Zeitaufwand |
| B: Aufnahme in öffentlichen Spielen (Brookhaven) | schlechter: heller, moderner Look; freie Kamera gibt es laut Sekundärquelle (Shift+P) [P7b], aber keine Regie über Figuren und fremde Spieler | 0 € | 6–15 h (S) | über 80 %, dazu Mitspieler für jede Rolle | fremde Spieler im Bild; ob fremde Spiele monetarisiert gefilmt werden dürfen, ist unbelegt [L2] |
| C: nur Cloud, eigener Klötzchen-Stil (three.js) | deutlich schlechter: Testszene grob 10–15 % des Looks, „Programmierer-Grafik“ [P8] | ≈ 0 € | Render etwa 20–90 min je Video (Testszene gemessen und hochgerechnet [P8]); Aufbau 2–6 Wochen (S) | 0 % | Look; Roblox-IP: Ableitungen klassischer Avatare sind außerhalb von Roblox kommerziell nicht erlaubt [L1][L2] |
| D: KI-Videogeneratoren | ähnlich bis instabil, Figuren über 100 Einstellungen nicht konstant (S) | etwa 20–100 $ (S; 0,05–0,20 $/s [P9]) | 1–3 h (S) | 0–5 % | Figurenkonstanz, KI-Kennzeichnung, Roblox-IP, wirkt schnell wie Ausschuss |

**Folgerung:** A ist der einzige Weg, der Qualität und geringe Handarbeit verbindet. A′ ist der Rückfall, falls die Skript-Regie scheitert, aber nur, wenn du die Zeit wirklich hast. C scheitert am Look, nicht an der Renderzeit. C und D kommen höchstens als Notlösung oder für einzelne Einschübe in Frage.

---

## 4. Format und Geschichten-Bauplan

Die volle Spezifikation mit Messweg steht in `format-spec.md` (derzeit im Scratchpad unter `/tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/scratchpad/horror-ref/format-spec.md`; der Scratchpad kann gelöscht werden, deshalb in Phase 0 ins neue Repo übernehmen). Alle Werte stammen aus *einer* Referenz [R]. Ob sie fürs ganze Genre gelten, ist offen.

### Kernwerte (gemessen an der Referenz [R], Vorgabe für uns)

| Merkmal | Referenz | Vorgabe |
|---|---|---|
| Länge | 166,8 s | 150–175 s; über 60 s wegen Creator Rewards [G1], höchstens 180 s für YouTube Shorts [G4] |
| Tempo | 268 Wörter/min, keine Pause über 0,32 s | Englisch 250–285 Wörter/min; Deutsch 5,3–5,9 Silben/s (u, Probe nötig) |
| Hook | ein Satz mit Regel und Folge, 23 Wörter in 5,32 s; Monster ab 0,07 s im Bild | ein Satz mit 18–25 Wörtern in höchstens 5,5 s; Bedrohung im ersten Bild; kein Titel, keine Frage |
| Schnitt | 116 Schnitte, Median 1,40 s, 93 % an Satz- oder Kommagrenzen | Median 1,3–1,5 s, keine Einstellung über 4,3 s |
| Bild | 27 von 29 Bildern zeigen wörtlich das Gesagte; 8 von 10 Einstellungen mit langsamer Fahrt | mindestens 90 % wörtlich bebildert, mindestens 75 % mit langsamer Fahrt |
| Untertitel | ein Wort je Einblendung, Wechsel im Median 0 ms zum Wortanfang, Mitte bei 71 % der Bildhöhe, weiß mit schwarzer Kontur | wie Referenz: Montserrat 800/900, 90–95 px, Mitte y ≈ 1.360 px (u: am Handy prüfen, ob TikToks Beschreibung das Wort verdeckt); Farbe nur für wörtliche Rede, eine feste Farbe je Figur |
| Ton | eine Stimme für alles; Musik 4–7 dB unter der Stimme, in drei Stufen; −13,7 LUFS | Musik 6–9 dB unter der Stimme, −14 LUFS (A: TikTok normalisiert, nennt aber keinen Zielwert; −14 ist der Wert von YouTube und Spotify, siehe `format-spec.md` § 11), True Peak ≤ −1 dBTP; keine Roblox-Musik [L7] |
| Ende | Schnitt 0,15 s nach dem letzten Wort, kein Aufruf | kein „Folge für Teil 2“, keine Moral |

**Abweichungen von der Referenz, mit Absicht:**
- Wir rendern nativ in 1080 × 1920, falls Phase 0 das schafft (§ 2, Punkt 6). Die Referenz liegt nur als TikTok-Download in 576 × 1024 vor [R].
- Der Erzähler ist mindestens 18, und Kinder sind nie das Ziel einer Tat ihrer Eltern [L3].
- Horror wird angedeutet, nicht gezeigt: kein Blut im Vorschaubild oder in den ersten 7 s (YouTube-Werberegel für Spielgewalt [L5]), keine Schock-Großaufnahmen von Verletzungen. Drastische fiktive Gewalt und viel Blut kann TikTok auf 18+ beschränken oder aus dem For-You-Feed nehmen [L3], und „Disturbing“-Inhalte schließt TikTok vom Programm aus [G1].

### Bauplan (9 Blöcke, Anteil an der Laufzeit, aus der Referenz abgeleitet [R])

| Block | Anteil | Pflichtinhalt |
|---|---|---|
| 0 Regel-Hook | 0–3 % | Ort, Wiederkehr, Pflicht und eine rätselhafte Folge in einem Satz: „In dieser Stadt …“ |
| 1 Bedrohung | 3–14 % | mindestens 3 sinnliche Merkmale, ein Leitgeräusch, das Ritual Schritt für Schritt |
| 2 System | 14–35 % | Name des Rituals, *eine* Regel, ein gescheiterter Umgehungsversuch, 3 grausame Alltagsregeln, die später alle geerntet werden |
| 3 Persönlich | 35–49 % | ein früheres Opfer aus der Familie; eine Schutzfigur mit Kosenamen, einer Gewohnheit mit Zahl und einem Versprechen |
| 4 Entscheidung | 49–58 % | Der Erzähler wird bedroht, die Schutzfigur springt ein: falsche Sicherheit |
| 5 Die Nacht | 58–82 % | Payoffs der Welt, Ankunft mit Leitgeräusch, Spiegelszene mit einer Nebenfigur |
| 6 Wendung | 82–91 % (Beginn zwischen 78 und 86 % erlaubt; Referenz 82 %) | Das Versprechen bricht oder etwas wird enthüllt |
| 7 Höhepunkt | 91–97 % | Das Ritual aus Block 1 kehrt fast wörtlich wieder |
| 8 Schlusszeile | 97–100 % | Payoff der Gewohnheit aus Block 3, Tod nur angedeutet, Schnitt höchstens 0,2 s nach dem letzten Wort |

**Prüfregeln:**
- Mindestens 6 Paare aus Setup und Payoff; die Setups stehen vor 50 % der Laufzeit.
- Satzlänge im Median 6–8 Wörter.
- 4–7 Dialogzeilen.

**Ausgang variieren:** Nicht jede Folge endet mit dem Tod des Erzählers. Möglich sind Flucht, Enthüllung, Opfer einer anderen Figur oder eine Schleife. Sonst greift auf YouTube die Regel gegen „same situation … same outcome“ [L5].

### Themen mit belegten Spitzenwerten (Startpool für die Prämissen)

Die größten Treffer des Formats sind oft keine Horror-Storys, sondern Fantasy- oder Comedy-Regeln. Für uns zählt das Motiv, umgedeutet in Horror.

| Motiv | Beleg | Eignung für uns |
|---|---|---|
| Volljährigkeits-Regel | „In this town, when you turn 18, you get CRACKED“, 3,4–3,5 Mio. (10.11.2026); „… you get a magical book“, 1,5 Mio. (03.11.2026) [N4], beides kein Horror | sehr gut, der Erzähler ist automatisch 18 |
| Alltag oder Spiel wird tödlich | „In This Town, A Game Of Tag Is Deadly“, 5,1 Mio. (20.10.2026) [N4] | gut, wenn Jugendliche und Erwachsene mitspielen statt Kinder als Opfer |
| Falsche Eltern oder Doppelgänger | „That's Not My Mom“, 1,4 Mio. (YouTube) [N5]; „There Were TWO Moms In The KITCHEN“, 921.000 [N5]; auf TikTok „WAIT THAT WASN'T MY MOM?!“ nur 64.900 [N4] | gut: Das Monster ist die Gefahr, nicht der echte Elternteil |
| Etwas Fremdes im Haus | „He Didn't Blink“, 906.300–907.000 (11.11.2026) [N3] | gut |
| Nächtliches Ritual oder Auslosung | „In this town, every night at midnight, the radio reads three names“, 1,2 Mio. (30.10.2026) [N4] | gut, das ist die Struktur der Referenz |

Ideen und Tropen sind frei, fremde konkrete Plots nicht [L6]. Claude schreibt eigene Geschichten, die Prämisse wählst du.

---

## 5. Kanal-Strategie

### Sprache: Deutsch als Haupt-, Englisch als Zweitkonto

| | Deutsch | Englisch |
|---|---|---|
| Markt | #indieserstadt: 16,7 Mio. Aufrufe, 771 Videos, Top-Videos vom 04.–14.11.2026; #gruselgeschichte: 839 Mio., aber Top-Videos von 2019, also über Jahre gesammelt [N2] | #robloxstory: 49,9 Mrd., #robloxhorror: 11,3 Mrd., #inthistown: 379 Mio. [N2] |
| Konkurrenz | @agentsudais1: ≈ 58.800 Follower, Median der 10 neuesten Videos 52.200–56.700 bei ≈ 31 Videos/Woche; @roblxstadt: Median 23.100, 10 Videos binnen 24 h; @shazyedits60: Median 25.400 bei ≈ 48/Woche; @storytime17091: Median 24.550 bei 5.020 Followern; @miaerklaert: Median 44.300, bester Wert 538.000 [N6]. Meist leichte „In dieser Stadt“-Fantasy; düsterer 2,5-min-Horror nicht gefunden (u) | extrem gesättigt: 22 Kanäle allein mit Vogelscheuchen-Shorts, meist unter 40.000 [N5]; Nachahmer-Median 114–9.941 [N3] |
| Geld | Es zählen nur Aufrufe aus den 8 Programmländern [G1]. Für ein deutschsprachiges Konto heißt das praktisch nur Deutschland; Österreich und die Schweiz zählen nicht | Aufrufe aus den USA und Großbritannien zählen, aus Kanada, Australien oder Indien nicht [G1] |
| Unbekannt | Ob das Tempo auf Deutsch trägt (u) | Ob TikTok ein in Deutschland registriertes Konto mit englischen Videos an US-Zuschauer verteilt (u) |

**Begründung:** Auf Deutsch sind wir früh in einer Welle. Sie wird aber schon von mehreren Konten mit hohem Takt bespielt, nur ein düsterer Horror-Kanal fehlt (u). Auf Englisch ist der Markt um Größenordnungen größer, dafür sind wir dort spät: #inthistown hat etwa 23-mal so viele Aufrufe wie #indieserstadt, #robloxstory etwa 550-mal so viele wie #robloxgermany (91,0 Mio.) [N2]. Weil die Aufnahmen sprachneutral sind (§ 2, Punkt 4), kostet das Zweitkonto nur Stimme, Neuschnitt und 5 Minuten Upload. Den Sprachstreit entscheiden deshalb Daten statt Vermutungen.

Ob zwei Konten mit gleichem Bild und anderer Sprache als „unoriginell“ gelten, ist unbelegt (u). TikToks Regel zielt auf Inhalte „from another source“ [L4]; zur Vorsicht bekommt jede Fassung trotzdem eigene erste Einstellungen.

### Länge, Takt, Serien

- **Länge 150–175 s.** Gemessen bei 21 Story-Videos: meist 104–191 s [N1]. Creator Rewards zahlt nur für Videos über 1 Minute [G1].
- **Takt im Test: 4 Geschichten pro Woche je Konto (A).**
  - Ein klarer Zusammenhang zwischen Takt und Aufrufen ist in den Daten nicht zu sehen: @cannonanimatess kommt bei etwa 2 Videos pro Woche auf einen Median von 190.050 [N4], concet bei ≈ 20 pro Woche auf 139.000–190.000 [N1], @inthisworldstory bei etwa 50 pro Woche (109 Videos seit 30.10.2026) nur auf 7.972 [N3].
  - 4 pro Woche ist, was Weg A neben deinem Alltag schafft (S). Ab Phase 2 steigt der Takt auf 1 pro Tag, falls die Zuschauerbindung hält.
- **Serie: eine wiederkehrende Stadt mit vielen Regeln.** Die Sets werden wiederverwendet, das ist der größte Hebel für die Herstellungszeit (S). Jede Folge hat eine eigene Regel, eine eigene Handlung und ein eigenes Ende [L5].
- **Teil 2 nur für Treffer.** Bei mehr als 100.000 Aufrufen innerhalb von 72 h folgt binnen 48 h eine Fortsetzung (A).
- **Veröffentlichen:** Bildunterschrift und 3–5 Hashtags liefert Claude. concet postet ohne beides [N1], deshalb kommt in Woche 3 ein Vergleich mit und ohne. TikTok-Web erlaubt Massen-Upload und geplantes Veröffentlichen [G1]; ob das für zwei Konten bequem genug ist, prüfst du beim Einrichten.

### Test-Plan für die ersten 30 Tage

Der 30-Tage-Zähler beginnt mit dem ersten vollen Upload, nicht mit Phase 0.

| Woche | Inhalt | Eine Variable je Woche |
|---|---|---|
| 1 | Phase 0 und erste volle Folge | Grundwert |
| 2 | 4 Geschichten je Konto | Hook-Motiv: Volljährigkeit / falsche Eltern / Spiel / Ritual |
| 3 | 4 Geschichten je Konto | mit gegen ohne Bildunterschrift und Hashtags |
| 4 | 4 Geschichten je Konto | Länge 110–120 s gegen 160–170 s |
| Tag 30 | Entscheidung | siehe Regeln unten |

Mit etwa 13 Videos je Konto sind das Hinweise, keine Beweise.

| Messgröße | Woher | Ziel bis Tag 30 (A) | Vergleich |
|---|---|---|---|
| Aufrufe nach 72 h, Median | Embed, Claude täglich | ≥ 5.000 | Nachahmer 114–9.941 [N3]; concet 139.000–190.000 [N1] |
| Bester Einzelwert | Embed | ≥ 1 Video über 50.000 | @town.rules: bestes der 10 neuesten Videos 30.700, danach Abfall auf ≈ 1.200 binnen 9 Tagen [N3] |
| Durchschnittliche Wiedergabezeit | TikTok Studio, dein Screenshot | ≥ 40 % der Laufzeit (A, ohne Vergleichswert) | unbelegt |
| Anteil über 5 s (zählt für Creator Rewards) | TikTok Studio | ≥ 60 % (A) | Schwelle 5 s laut [G1] |
| Shares je 1.000 Aufrufe | Videoseite | ≥ 3 (A) | concet 1,2 und 5,1; @cannonanimatess 2,9 (5,1 Mio.); @lileggy38 39; @larpniverse 44 (eigene Rechnung aus Shares und Aufrufen [N1][N4]) |
| Follower | Profil | ≥ 1.000 je Konto (A) | Creator Rewards braucht 10.000 [G1] |
| Deine Minuten je Video | Stoppuhr | ≤ 30 | Ziel aus § 2 |
| Claude-Stunden je Video | Protokoll | ≤ 4 | [P-a] |

**Entscheidungsregeln an Tag 30 (A):**
- **Weiter und ausbauen:** Median ≥ 5.000 oder ein Video über 100.000.
- **Auf eine Sprache setzen:** wenn ein Konto im Median mindestens dreimal so gut läuft wie das andere.
- **Stoppen:**
  - Median unter 1.000 nach mindestens 12 Videos und kein Video über 10.000, oder
  - deine Zeit liegt über 60 Minuten je Video.

---

## 6. Geld

### TikTok Creator Rewards (offiziell [G1], veröffentlicht 10.09.2026)

- **Konto:**
  - Wohnsitz und Kontoregistrierung in einem von 8 Ländern: USA, Großbritannien, Deutschland, Frankreich, Japan, Südkorea, Mexiko, Brasilien.
  - Mindestalter 18, persönliches Konto (kein Business-Konto, kein Konto von Politik oder Behörden).
  - 10.000 Follower und 100.000 Aufrufe in den letzten 30 Tagen.
  - Ab 5 Video-Verstößen in 30 Tagen ist das Konto nicht mehr berechtigt [G1]. Bei Horror ist das ein echtes Risiko.
- **Video:**
  - original und über 1 Minute lang.
  - mindestens 1.000 Aufrufe im For-You-Feed; was nicht in den Feed darf, zählt auch hier nicht.
  - kein Duet, kein Stitch, kein Photo Mode, keine Werbung.
  - Für den Additional Reward zusätzlich „well-crafted, engaging, specialized“ und 1080p oder mehr [G1].
- **Qualifizierter Aufruf:**
  - mindestens 5 s angesehen, einmal je Konto gezählt, ohne „Nicht interessiert“.
  - Aufrufe über die Suche zählen erst ab 30 s.
  - nur Aufrufe aus den 8 Ländern.
- **Satz:** TikTok nennt keinen.
  - Der Standard Reward hängt von der Herkunft der Zuschauer und der Sprache ab [G1].
  - Der Additional Reward hängt von Sehzeit, Bindung (wer nach 30, 40, 50, 60 oder 90 s noch schaut), Abschlussrate und Suchwert ab [G1].
  - Drittquelle: 0,40–1,00 $ je 1.000 qualifizierte Aufrufe, ohne Methode [G2, aktualisiert 01.10.2026].
  - Für Deutschland kursieren 0,40–0,80 € bzw. etwa 0,62 $, nur aus Suchauszügen [G3].

| Szenario ab Monat 2–3 (S) | Aufrufe/Monat (30 Videos) | qualifiziert (A: 50 %, u) | Ertrag bei 0,40–1,00 $ |
|---|---|---|---|
| Nachahmer-Niveau, Median 2.000 | 60.000 | – | 0 $, Schwellen nicht erreicht |
| solide, Median 20.000 | 600.000 | 300.000 | 120–300 $, falls 10.000 Follower erreicht sind |
| stark, Median 150.000 (etwa concet-Niveau) | 4,5 Mio. | 2,25 Mio. | 900–2.250 $ |

Obergrenze zum Vergleich: concet erreicht etwa 20 Videos × 140.000–190.000 ≈ 2,8–3,8 Mio. Aufrufe pro Woche (eigene Rechnung aus [N1]). Wären alle qualifiziert, ergäbe das etwa 5.000–16.500 $ im Monat. Das ist nicht unser Erwartungswert, und der qualifizierte Anteil ist unbekannt.

### YouTube

- **Partnerprogramm:**
  - Bis 31.01.2027 gilt: 1.000 Abonnenten plus 4.000 Stunden Sehzeit in 12 Monaten oder 10 Mio. Shorts-Aufrufe in 90 Tagen [G4]. Sehzeit aus dem Shorts-Feed zählt nicht für die Stunden [G4].
  - Ab 01.02.2027 brauchen neue Kanäle 1.000 Abonnenten plus 8.000 Stunden Sehzeit in 365 Tagen oder 20 Mio. Shorts-Aufrufe in 90 Tagen [G4]. Ein neuer Kanal erreicht die alte Schwelle bis Ende Januar realistisch nicht (S), also gilt für uns die neue.
- **Shorts-Geld:** gibt es ab 01.02.2027 nur bei laufend 10 Mio. qualifizierten Shorts-Aufrufen in 90 Tagen [G4]. Shorts bringen uns also zuerst Reichweite.
- **Sehzeit für die Schwelle:** Kompilationen eigener Geschichten als lange Videos. Unlucky Guy erreicht mit Kompilationen von 21–22 min in wenigen Tagen 326.000–443.000 Aufrufe [N5]. Ob eigene Kompilationen unter „inauthentic content“ fallen, ist unbelegt (u). Laut YouTube ist eine Serie mit eigener Handlung je Folge erlaubt [L5].

### Kosten

| Posten | Kosten | Quelle |
|---|---|---|
| Roblox Studio, OBS | 0 € | [P3][P6] |
| Moon Animator 2 (optional) | 19,99 USD im Sale (−33 %), Stand 14.11.2026 | [P5] |
| Apex Animator (optional) | 0 € | [P5] |
| Stimme: Inworld On-Demand | 0 € Grundgebühr, kommerzielle Lizenz enthalten; TTS-2 25 $ je 1 Mio. Zeichen, also ≈ 0,21 $ je Geschichte in zwei Sprachen (eigene Rechnung) | [G5c] |
| Stimme: Cartesia | Free (20.000 Credits) **ohne kommerzielle Lizenz**; Pro 5 USD/Monat mit Lizenz und 100.000 Credits | [G5b] |
| Stimme: ElevenLabs Starter | 6 USD/Monat (erster Monat 1 USD), 30.000 Credits, kommerzielle Lizenz | [G5] |
| Stimme: ElevenLabs Creator | 22 USD/Monat (erster Monat 11 USD), 121.000 Credits | [G5] |
| ElevenLabs Free | 0 €, **keine kommerzielle Lizenz**, also für einen monetarisierten Kanal ungeeignet | [G5] |
| Musik: Pixabay | 0 €, Nutzung auf Social Media erlaubt; automatische Copyright-Treffer sind trotzdem möglich | [G6] |
| Kostüme aus dem Katalog | vermutlich 0 Robux (u, Phase 0 prüft) | [P-a] |
| Claude | aus deinem bestehenden Abo, Kontingent offen (u) | – |

**Rechnung zur Stimme:** Die englische Referenz hat 744 Wörter und 3.845 Zeichen (gezählt am Whisper-Transkript [R]). Eine deutsche Fassung ist geschätzt 4.400–4.800 Zeichen lang (S), zusammen also ≈ 8.500 Zeichen je Geschichte. Bei ElevenLabs kostet ein Zeichen einen Credit [G5].
- Starter (30.000) reicht damit für etwa 3 Geschichten in zwei Sprachen, Creator (121.000) für etwa 14, jeweils ohne Neuversuche.
- Der 30-Tage-Test mit 13 Geschichten braucht ≈ 110.000 Credits plus Neuversuche, also mindestens Creator. Ab 16 Geschichten im Monat reicht auch Creator nicht.
- Inworld kostet für denselben Test etwa 3 $ [G5c]. Cartesia Pro reicht für etwa 11 Geschichten, falls ein Credit einem Zeichen entspricht (u) [G5b].
- Entscheidend ist deshalb nicht der Preis, sondern welche Stimme auf Deutsch ausdrucksstark genug klingt (Casting in Phase 0).

### Steuern (kurz, keine Beratung)

- **Gewerbeanmeldung:** „gleichzeitig“ mit Beginn einer selbständigen, auf Gewinn angelegten Tätigkeit, ohne Betragsgrenze [G7: § 14 GewO]. Für Influencer ist sie laut IHK München „in der Regel“ erforderlich [G7, 3/2026].
- **Freibeträge und Grenzen:**
  - Grundfreibetrag 2026: 12.348 € [G7, IHK München].
  - Gewerbesteuer erst ab 24.500 € Gewerbeertrag [G7: § 11 GewStG].
  - Kleinunternehmer bis 25.000 € Vorjahresumsatz und 100.000 € im laufenden Jahr [G7].
- **Rechnungen:** TikTok stellt für Creator-Rewards-Auszahlungen keine Rechnungen aus; in der App gibt es nur einen Abrechnungsbeleg je Transaktion [G1].
- **Nicht recherchiert (u):** die Einkommensgrenze der Familienversicherung bei der Krankenkasse und die Umsatzsteuer bei Auszahlungen aus dem Ausland. Beides vor der ersten Auszahlung klären.

---

## 7. Recht und Regeln

**Erlaubt, mit Vorbehalt:**
- **Videos mit Roblox-Avataren in sozialen Medien, auch monetarisiert.** Ausdrücklich steht das nur im offiziellen Roblox-FAQ vom 23.06.2022: „You are free to continue using all avatar types in your social media content and you may continue monetizing that content“ [L1, älter]. Die aktuelle Fassung der Name-and-Logo-Guidelines war wegen Cloudflare nicht lesbar. Laut Suchauszug untersagt sie klassische R6- und R15-Avatare „on physical products or commercial content“ und bietet ein Formular für Freigaben an [L1b, u]. Ob ein monetarisiertes TikTok darunter fällt, ist offen (u). Deshalb vor dem Antrag auf Creator Rewards über das Roblox-Formular anfragen (Phase 2).
- **Einen eigenen Ort in Roblox Studio bauen, auch mit Creator-Store-Modellen, und ihn filmen.** Das ist eine Ableitung aus „on the Services“ in den AGB, Stand 04.03.2026 [L2], also nicht ausdrücklich belegt.
- **Fiktion mit Gewalt.** TikTok erlaubt „Fiction or art, unless it's intended to promote real-world violence“ [L3]. Drastische fiktive Gewalt und „Excessive blood“ können aber auf 18+ beschränkt oder vom For-You-Feed ausgeschlossen werden [L3], und was nicht in den Feed darf, zählt auch nicht für Creator Rewards [G1].
- **Eine generische TTS-Stimme ohne KI-Label**, solange sie nicht wie eine bekannte Person klingt [L4, 26.09.2026]. Für künstlerische Stile wie Cartoons braucht es laut TikTok kein Label [L4]; Roblox-Optik zähle ich dazu (eigene Ableitung).

**Vermeiden:**
- **Rund um die Marke Roblox:**
  - „Roblox“ oder „Blox“ im Kontonamen. Wer das will, braucht einen Hinweis „nicht mit Roblox verbunden“ in der Bio [L1].
  - Das Roblox-Logo, auch im Vorschaubild und als Symbol oben links in Aufnahmen aus dem Testlauf [L1][P4].
  - „Roblox“ als Hashtag oder im Titel zur Beschreibung ist vertretbar (§ 23 MarkenG [L6], eigene Ableitung).
- **Spielmusik und Lizenzmusik aus Roblox:** Sie ist nur „on the Services“ lizenziert. Bei der Aufnahme stumm schalten [L2][L7].
- **Modelle aus Roblox exportieren** und in Blender oder three.js nachbauen, ebenso eigene R6-Klone außerhalb von Roblox [L1][L2].
- **Kinder als Opfer einer Tat ihrer Eltern**, Folter-Details, Suizid-Details [L3]. Die Referenz hat mit genau diesem Plot 1,1 Mio. Aufrufe [N1]; die Regel wird also nicht lückenlos durchgesetzt, das Risiko für Konto und Creator Rewards bleibt trotzdem bei uns. „Disturbing“-Bilder kosten FYF und Creator Rewards [G1].
- **Fremde Videos neu hochladen** oder fremde Wasserzeichen zeigen [L4].
- **Fremde Geschichten:**
  - Reddit-Autoren behalten ihre Rechte, eine Vertonung braucht ihre Erlaubnis [L6].
  - Bekannte Figuren wie Slender Man meiden.
  - Konkrete fremde Plots, auch den der Referenz [L6].
- **Reine KI-Texte ohne menschliche Prägung:** Sie sind voraussichtlich nicht urheberrechtlich geschützt [L6]. Deshalb wählst du die Prämisse und formst den Twist mit.

**Kennzeichnung:**
- **TikTok:** Weg A braucht kein KI-Label [L4]. Nur Weg D, also realistisch wirkende KI-Szenen, bräuchte eins. Laut TikTok schadet das Label der Verbreitung nicht [L4].
- **YouTube:** Ein Label ist nur bei realistischen Inhalten Pflicht, Gameplay ist ausdrücklich ausgenommen [L5]. Die Einstufung „made for kids“ ehrlich setzen: Avatare sprechen dafür, Gewalt und reife Themen dagegen [L5].
- **Monetarisierung:** Konto und Auszahlung laufen nur auf dich, ab 18 [G1][L3]. Dein Bruder (15) kann kein monetarisiertes Konto führen.

---

## 8. Phasen

### Phase 0: ein Probevideo (Woche 1, etwa 3 Abende, S)

1. **Du, einmalig (≈ 1 h, S):**
   - Roblox Studio installieren und anmelden, MCP einschalten [P1].
   - OBS ≥ 28 installieren, Websocket mit Passwort [P6].
   - Claude Code auf dem PC installieren und mit dem Studio-MCP verbinden („Quick connect“ [P1] oder das offizielle Plugin „Roblox Studio“ über `/plugin` [P2]). Berechtigungsabfragen anlassen, weil Claude Code unter Windows ohne Sandbox läuft [P10].
   - Das neue Repo klonen und einen eigenen, leeren Ort fürs Projekt anlegen.
2. **Claude in der Cloud:**
   - Neues Repo mit `format-spec.md` und diesem Plan anlegen.
   - Erste eigene Geschichte, auf Deutsch und Englisch, mit 3 Hook-Varianten.
   - Shotliste, Stimme, `timing.json`, Hör-Check.
   - Kurzes Casting: deutsche Stimmen bei Inworld, Cartesia und ElevenLabs gegeneinander, dazu englische Stimmen, denn der DeepTok-Pool ist deutsch.
3. **Claude auf dem PC, Technik-Test:**
   - Ein Set mit Straße, Veranda und Innenraum, 3 Figuren, 20 Einstellungen, etwa 40 s.
   - Kontaktbogen per `screen_capture`.
   - OBS-Aufnahme in 1080 × 1920, Schnitt, Untertitel.
   - Vergleichstafel neben der Referenz.
4. **Go/No-Go (du entscheidest):**
   - Wirkt der Kontaktbogen neben der Referenz gleichwertig?
   - Deine Zeit ≤ 30 min?
   - Claude-Zeit hochgerechnet ≤ 4 h je volles Video?
   - Kostüme ohne Kauf ladbar?
   - Bewegen sich die Figuren in der Aufnahme (Animation im Edit- oder Testmodus)?
   - Liefert der Viewport echte 1080 × 1920 ohne Ruckler, und ist kein Roblox-Symbol im Bild? Sonst Rückfall auf 810 × 1440, hochskaliert (§ 2, Punkt 6).
5. **Bei Go:** die volle Folge mit 150–175 s fertig bauen und auf beiden neuen Konten posten. Dauert Phase 0 länger als eine Woche, verschiebt sich der Test entsprechend.
   **Bei No-Go:** zurück zu dir mit zwei Optionen: Weg A′ (Handanimation, mit ehrlicher Zeitangabe) oder Abbruch.

### Phase 1: 30-Tage-Test (Wochen 2–4, Entscheidung an Tag 30)

- 4 Geschichten pro Woche auf beiden Konten, je Woche eine Variable (§ 5).
- Claude misst täglich die öffentlichen Zahlen und schickt sonntags einen Bericht. Du schickst sonntags die Screenshots aus TikTok Studio.
- Ab Woche 2 gibt es eine Set-Bibliothek: Stadt, Haus innen, Wald oder Feld, Schule. Jede neue Folge nutzt mindestens 2 vorhandene Sets.
- Vor dem ersten Upload steht die Stimme fest, mit kommerzieller Lizenz (§ 6).
- Gewerbe: Die Anzeigepflicht gilt ab Beginn einer auf Gewinn angelegten Tätigkeit [G7]. Vor dem ersten Upload beim Gewerbeamt oder bei der IHK nachfragen, ob das für den Test schon zutrifft.

### Phase 2: Ausbau oder Abbruch (ab Tag 31)

- **Bei „weiter“:**
  - Takt auf 1 pro Tag erhöhen und auf die stärkere Sprache konzentrieren.
  - Teil 2 für Treffer.
  - Dieselben Master als YouTube Shorts, dazu monatlich eine Kompilation als langes Video.
  - Gewerbe ist angemeldet, bevor Creator Rewards beantragt wird (§ 6).
  - Vor dem Antrag auf Creator Rewards die Nutzung der Avatare über das Freigabe-Formular von Roblox anfragen (§ 7).
- **Bei „stoppen“:** Repo archivieren, Konten ruhen lassen, Abschlussbericht mit den Zahlen.

### Phase 3: Fabrik (nur wenn Phase 2 trägt)

- Redaktion und Ton laufen nachts über eine eigene Zustandsmaschine nach dem Vorbild von `factory/fabrik.py`.
- Der PC nimmt nach Zeitplan auf, du prüfst nur noch und lädst hoch.

---

## 9. Offene Entscheidungen für dich

1. **Sprache:** Deutsch plus englisches Zweitkonto, wie empfohlen, oder nur eine Sprache?
2. **PC-Einsatz:** Richtest du Studio, OBS und Claude Code auf dem PC ein (≈ 1 h) und lässt den PC für Aufnahmen laufen, etwa 2–4 h je Video (S)? Ohne das gibt es keine Referenzqualität (§ 3). Hast du einen Monitor, der hochkant gedreht werden kann, oder einen 4K-Monitor (§ 2, Punkt 6)?
3. **Stimme und Budget:** Inworld (Lizenz enthalten, ≈ 0,21 $ je Geschichte), Cartesia Pro (5 USD/Monat) oder ElevenLabs Creator (22 USD/Monat)? Entscheiden soll das Casting in Phase 0, nicht der Preis.
4. **Härtegrad:** Erzähler ab 18 und Horror nur angedeutet, wie empfohlen und sicher für FYF und Creator Rewards? Oder ein Kind als Erzähler wie in der Referenz, mit dem Risiko aus § 7?
5. **DeepTok:** Die Nacht-Fabrik pausieren, damit das Claude-Kontingent für den Test reicht, oder parallel weiterlaufen lassen? Das Horror-Projekt kommt in ein eigenes Repo und nicht unter `studio/`. Es widerspricht `studio/DESIGN.md` §8 (Untertitel, Musik) und dem Ziel von DeepTok (Wissen statt Verweildauer).

---

## Quellen

Alle Abrufe am 14.11.2026, sofern nicht anders angegeben. TikTok-Zahlen stammen aus zwei Abrufen am selben Tag (nachmittags und gegen 23 Uhr UTC).

**Nische**
- [N1] TikTok-Profil und Creator-Embed @concet5612: ≈ 107.300 Follower (gerundete Anzeige; spätere Anzeige 107.600), 66 Videos, Median der 10 neuesten Videos 139.100 bzw. 189.550, die 10 neuesten in 3 Tagen gepostet (≈ 20/Woche), Upload in 1280 × 720, ohne Bildunterschrift. Referenz-Video 170 s mit 1,1 Mio. Aufrufen und 1.298 Shares, zweites Video 145 s mit 756.800–771.700 Aufrufen und 3.932 Shares. https://www.tiktok.com/@concet5612, https://www.tiktok.com/embed/@concet5612, https://www.tiktok.com/@concet5612/video/7707748313222630686, https://www.tiktok.com/@concet5612/video/7707759204500639007. Die 21 gemessenen Story-Längen (104–191 s) stammen aus der Spur Nische.
- [N2] TikTok-Hashtag-Embeds (Gesamtaufrufe/Videos, US-Embed): #robloxstory 49,9 Mrd./1.557.465, #robloxhorror 11,3 Mrd./223.340, #inthistown 378,9 Mio./19.120, #indieserstadt 16,7 Mio./771, #robloxgermany 91,0 Mio./3.629, #gruselgeschichte 839 Mio./27.566 (Top-Videos von 2019). https://www.tiktok.com/embed/tag/robloxstory (Muster für alle). Die Top-Videos von #inthistown sind vom 27.10.–13.11.2026.
- [N3] Creator-Embeds der Nachahmer und Nachbarn: @townrulestv (Median 114, 4 Follower), @town.rules (10 neueste Videos 1.189–30.700, Median ≈ 6.500, fallend), @thistownbiz (Median 9.941), @inthisworldstory (Median 7.972, 109 Videos seit 30.10.2026), @dogeok („He Didn't Blink“ 906.300–907.000, 11.11.2026). https://www.tiktok.com/embed/@townrulestv, …/@town.rules, …/@thistownbiz, …/@inthisworldstory, …/@dogeok
- [N4] Treffer-Videos und Embeds: https://www.tiktok.com/@cannonanimatess/video/7698583754603793678 (5,1 Mio., 14.900 Shares, 142 s, 20.10.2026; Kanal-Median der 10 neuesten ohne angehefteten Clip 190.050, ≈ 2 Videos/Woche), https://www.tiktok.com/@lileggy38/video/7706667212848811294 (3,4–3,5 Mio., 135.700–136.400 Shares, 151 s, 10.11.2026), https://www.tiktok.com/@lileggy38/video/7702250665216593182 (Radio-Ritual, 1,2 Mio., 30.10.2026), https://www.tiktok.com/@lileggy38/video/7703746163652054303 („magical book“, 1,5 Mio., 03.11.2026), https://www.tiktok.com/@lileggy38/video/7704858934200339743 („WAIT THAT WASN'T MY MOM?!“, 64.900), https://www.tiktok.com/@larpniverse/video/7707635922652630285 (5,9–6,1 Mio., 265.500–270.300 Shares, 75 s, 13.11.2026)
- [N5] YouTube-Kanalseiten und RSS: https://www.youtube.com/@fluppzzyy/shorts (Flupzzy, „That's Not My Mom“ 1,4 Mio.), https://www.youtube.com/@AuraaRobloxx/shorts („TWO Moms“ 921.000), https://www.youtube.com/@UnluckyGuyStories/shorts (Kompilationen 326.000–443.000), YouTube-Suche „roblox scarecrow“ (22 Kanäle). https://www.youtube.com/results?search_query=roblox+horror+story+scarecrow+every+year
- [N6] Deutsche Kanäle (Creator-Embeds): https://www.tiktok.com/embed/@agentsudais1 (≈ 58.800 Follower, Median 52.200–56.700, ≈ 31/Woche), https://www.tiktok.com/embed/@roblxstadt (30.300 Follower, Median 23.100), https://www.tiktok.com/embed/@shazyedits60 (27.400 Follower, Median 25.400), https://www.tiktok.com/embed/@storytime17091 (5.020 Follower, Median 24.550), https://www.tiktok.com/embed/@miaerklaert (2.583 Follower, Median 44.300, bester 538.000 am 04.11.2026), https://www.tiktok.com/embed/@kinostory09 (17.800 Follower, Median 4.685); #indieserstadt (Top-Videos ab 04.11.2026)

**Referenz**
- [R] Eigene Messung am Referenzvideo `ref.mp4` (TikTok-Download @concet5612), 14.11.2026, Spezifikation unter /tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/scratchpad/horror-ref/format-spec.md; Zeichenzahl aus `horror-work/saetze.json`

**Herstellung**
- [P1] Roblox Creator Hub: Connect to the Roblox Studio MCP server (lokaler Prozess über stdio; Werkzeuge u. a. execute_luau, insert_asset, screen_capture mit Kameraposition, start_stop_play, generate_avatar und generate_animation nur R15; Quick connect für Claude Code/Desktop). https://create.roblox.com/docs/studio/mcp
- [P1a] Roblox API: Players:CreateHumanoidModelFromDescriptionAsync (R6 oder R15), KeyframeSequenceProvider (temporäre ID nur in Studio), Animator:StepAnimations (nur Befehlszeile oder Plugin). https://create.roblox.com/docs/reference/engine/classes/Players, https://create.roblox.com/docs/reference/engine/classes/KeyframeSequenceProvider, https://create.roblox.com/docs/reference/engine/classes/Animator
- [P2] Roblox/roblox-studio-agent-plugin, README (offizielles Plugin für Claude Code und Cowork; MCP läuft lokal, claude.ai im Web kann sich nicht verbinden; Menüpfad „… → Settings → MCP Servers“). https://github.com/Roblox/roblox-studio-agent-plugin
- [P3] Roblox Studio Setup (nur Windows und Mac). https://create.roblox.com/docs/studio/setup
- [P4] DevForum, Roblox-Mitarbeiter: Tips for Capturing High Quality Screenshots and Videos in Studio (Studio-Qualität 21, OBS NVENC, CBR ≥ 20.000 kbit/s, P4), 13.02.2024 (älter); Antworten: MKV-Hinweis 29.02.2024, sichtbares Roblox-Symbol oben links 08.05.2024. https://devforum.roblox.com/t/tips-for-capturing-high-quality-screenshots-and-videos-in-studio/2723897
- [P5] Roblox Toolbox-API: Moon Animator 2 „[sale!]“, „On sale for 33% off“, 19,99 USD (Eintrag aktualisiert 30.10.2026). https://apis.roblox.com/toolbox-service/v1/items/details?assetIds=4725618216; Apex Animator, kostenlos, 06.10.2026. https://devforum.roblox.com/t/plugin-free-apex-animator-physicslive-recording-dynamic-rigparenting-face-animation-ikfk-many-more/4918289
- [P6] obs-websocket, ab OBS 28 eingebaut. https://github.com/obsproject/obs-websocket
- [P7] Roblox-Doku: Free camera mode (im Live-Client nur für Besitzer und Editoren, laut DevForum vom 03.09.2026 auch per Spielcode freischaltbar). https://create.roblox.com/docs/workspace/camera/free-camera, https://devforum.roblox.com/t/full-release-enhanced-freecam-capabilities/4848482
- [P7b] AllThingsHow: Brookhaven Free Camera (Shift+P), aktualisiert 04.08.2026 (Sekundärquelle). https://allthings.how/brookhaven-free-camera-shift-p-how-the-hide-and-seek-camera-trick-works/
- [P8] Eigene three.js-Tests, 14.11.2026, 4 vCPU ohne GPU: Mesa llvmpipe 0,21–1,09 s je Bild in 1080 × 1920 (einfache Szene bis Volllast, `scratchpad/horror-3d/messung/`), hochgerechnet auf 5.010 Bilder etwa 20–90 min; ein früherer Test mit anderem Aufbau lag bei 1,9–4,9 s je Bild (`scratchpad/blocktest/`). Look grob 10–15 % der Referenz (Sichturteil). Vergleichstafel: /tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/scratchpad/blocktest/vergleich.jpg
- [P9] Preise KI-Video: https://ai.google.dev/gemini-api/docs/pricing (Gemini Omni 1.2 Flash ≈ 0,07–0,104 $/s), https://fal.ai/pricing (Kling v3 Pro 0,14 $/s), https://fal.ai/wan-3 (0,05–0,20 $/s)
- [P10] Claude Code Docs: Sandboxing („On native Windows, Claude Code runs commands unsandboxed“). https://code.claude.com/docs/en/sandboxing
- [P11] Roblox Creator Hub: Creator Store (Skripte in Assets, „Disable Scripts“, nachgeladene „virus“-Assets). https://create.roblox.com/docs/production/creator-store
- [P-a] Spur Herstellungswege: Aufwandsschätzungen für Weg A (Pilot 2–4 Abende, 2–4 h je Video, Einrichtung ≈ 1 h), eigene Schätzungen ohne Messung, 14.11.2026

**Geld**
- [G1] TikTok Creator Academy: Creator Rewards Program, 10.09.2026 (Bedingungen, qualifizierte Aufrufe, Länder, Ausschlussgründe, keine Rechnungen, Massen-Upload und Planung im Web). https://www.tiktok.com/creator-academy/en/article/creator-rewards-program; Finding Creator Rewards Program success (Standard und Additional Reward). https://www.tiktok.com/creator-academy/en/article/RPM-understanding-the-four-key-factors; Additional Reward (1080p oder mehr). https://www.tiktok.com/creator-academy/en/article/crp-unlock-additional-reward; FYF-Standards (in Kraft 24.09.2026). https://www.tiktok.com/community-guidelines/en/fyf-standards
- [G2] Influencer Marketing Hub: How Much Does TikTok Pay in 2026, aktualisiert 01.10.2026. https://influencermarketinghub.com/how-much-does-TikTok-pay/
- [G3] Elev8or (DE ≈ 0,62 $) und go-viral.app (0,40–0,80 €), nur Suchauszüge, 2026, Seiten ungeprüft. https://www.elev8or.io/blog/tiktok-creator-rewards-rpm-2026, https://www.go-viral.app/de/blog/tiktok-geld-verdienen/
- [G4] YouTube-Hilfe: Changes to the YouTube Partner Program (ab 01.02.2027). https://support.google.com/youtube/answer/12843009; YouTube-Blog, 10.08.2026. https://blog.youtube/news-and-events/youtube-partner-program-updates-2027-new-opportunities-earn/; YPP-Übersicht mit den bis dahin geltenden Schwellen. https://support.google.com/youtube/answer/72851; Shorts bis 3 Minuten. https://support.google.com/youtube/answer/10059070
- [G5] ElevenLabs Pricing (Free ohne kommerzielle Lizenz; Starter 6 USD, 30.000 Credits; Creator 22 USD, erster Monat 11 USD, 121.000 Credits; TTS 1 Credit je Zeichen). https://elevenlabs.io/pricing
- [G5b] Cartesia Pricing (Free 20.000 Credits ohne kommerzielle Lizenz; Pro 5 USD/Monat, 100.000 Credits, „Commercial use license“). https://cartesia.ai/pricing
- [G5c] Inworld Pricing (On-Demand 0 $, „Commercial license“, TTS-2 25 $ je 1 Mio. Zeichen). https://inworld.ai/pricing
- [G6] Pixabay FAQ (Social Media erlaubt), undatiert. https://pixabay.com/service/faq/
- [G7] § 14 GewO https://dejure.org/gesetze/GewO/14.html; § 11 GewStG https://dejure.org/gesetze/GewStG/11.html; IHK München: Klare Ansage für Influencer (u. a. Grundfreibetrag 12.348 € für 2026), 3/2026. https://www.ihk-muenchen.de/magazin/solo-selbststaendige/unternehmen-in-oberbayern/klare-ansage-fuer-influencer.html; IHK München: Kleinunternehmerregelung. https://www.ihk-muenchen.de/ratgeber/steuern/steuerarten/umsatzsteuer/kleinunternehmerregelung/

**Recht**
- [L1] Roblox DevForum: Update to Roblox Licensing Program & Brand Guidelines, FAQ zu Social-Media-Videos und Monetarisierung sowie zu Ableitungen klassischer Avatare außerhalb von Roblox, 23.06.2022 (älter). https://devforum.roblox.com/t/update-to-roblox-licensing-program-brand-guidelines/1843674
- [L1b] Roblox Name and Logo Community Usage Guidelines: Seite wegen Cloudflare nicht lesbar; Inhalt nur aus einem Suchauszug vom 14.11.2026 (Verbot klassischer Avatare „on physical products or commercial content“, Freigabe-Formular), daher unbelegt. https://en.help.roblox.com/hc/en-us/articles/115001708126-Roblox-Name-and-Logo-Community-Usage-Guidelines
- [L2] Roblox-AGB (gültig ab 19.12.2025, Stand 04.03.2026) im Anhang des kalifornischen AB-587-Berichts, Ausdruck 13.03.2026. https://oag.ca.gov/sites/default/files/Roblox%202025%20H2%20California%20AB587%20Terms%20of%20Service%20Report.pdf/Roblox%202025%20H2%20California%20AB587%20Terms%20of%20Service%20Report.pdf. Eine mögliche neuere Fassung vom 19.05.2026 war nicht lesbar (u).
- [L3] TikTok Community Guidelines, veröffentlicht 25.08.2026, in Kraft 24.09.2026: Youth Safety https://www.tiktok.com/community-guidelines/en/youth-safety, Sensitive and Mature Themes (Excessive blood, Graphic fictional violence: 18+ oder nicht im FYF) https://www.tiktok.com/community-guidelines/en/sensitive-mature-themes, Safety and Civility (Fiktion erlaubt; Liste „Neglect, endangerment, or physical or emotional abuse of young people“) https://www.tiktok.com/community-guidelines/en/safety-civility, Accounts and Features (Monetarisierung ab 18) https://www.tiktok.com/community-guidelines/en/accounts-features
- [L4] TikTok Creator Academy: AI-generated content label, 26.09.2026. https://www.tiktok.com/creator-academy/en/article/ai-generated-content-label; Originality policy, 26.09.2026. https://www.tiktok.com/creator-academy/en/article/tiktok-originality-policy
- [L5] YouTube: Monetarisierungsrichtlinien, „inauthentic content“ (Update 15.07.2025) https://support.google.com/youtube/answer/1311392; Kennzeichnung synthetischer Inhalte https://support.google.com/youtube/answer/14328491; Werbetauglichkeit (drastische Spielgewalt im Vorschaubild oder in den ersten 7 s) https://support.google.com/youtube/answer/6162278; Made for Kids https://support.google.com/youtube/answer/9528076
- [L6] § 23 UrhG https://dejure.org/gesetze/UrhG/23.html; § 23 MarkenG https://dejure.org/gesetze/MarkenG/23.html; Reddit User Agreement, gültig ab 01.07.2026 https://redditinc.com/policies/user-agreement; AG München 13.02.2026, 142 C 9786/25, zu KI-Inhalten https://www.ra-plutte.de/ag-muenchen-urheberrechtsschutz-ki-content/
- [L7] Roblox DevForum: Amplify Your Experiences with New Music (Copyright beim Upload auf TikTok), 19.09.2024, aktualisiert 13.02.2025. https://devforum.roblox.com/t/amplify-your-experiences-with-new-music/3164792
