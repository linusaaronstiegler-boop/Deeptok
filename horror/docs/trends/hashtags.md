# Hashtags und Bildunterschrift, Stand 16.11.2026

**Frage von Linus:** Welche Hashtags nutzen die besten Konten, und was können wir übernehmen?

**Datenstand:**
- Eigene Daten: 170 TikTok-Seiten der Vorrecherche, abgerufen am 14.11.2026 zwischen 22:13 und 22:34 UTC (US-Embeds, Videoseiten). Am 16.11.2026 neu ausgewertet, mit den Parsern aus `horror/tools/trends/radar.py` [D].
- Websuche, Artikel und die TikTok-Entwicklerdoku vom 16.11.2026.

**Bei TikTok wurde nichts abgerufen.** Die Vorrecherche hat die Seiten damals automatisch geladen. Das widerspricht TikToks Nutzungsbedingungen und robots.txt (siehe `bericht-2026-11-15.md`, Abschnitt 1). Aussagen von TikTok selbst stammen deshalb aus Suchauszügen und aus Berichten über TikTok. Ausnahme ist die Entwicklerdoku, siehe [T5].

**Kennzeichen:**
- **(S)** eigene Schätzung oder Deutung, **(u)** unbelegt, **(A)** Arbeitsannahme zum Testen.
- „n“ ist die Zahl der Videos. Werte mit n unter 5 sind Hinweise, keine Belege.
- Größen von Hashtag-Trackern sind Fremdangaben mit unklarem Datum. Sie zeigen nur Größenordnungen.

---

## Kurzfassung

1. **Was die besten Konten tun:**
   - Sie nutzen wenige Hashtags (2–4), meist dieselben bei jedem Video, und fast immer `#roblox` dazu.
   - Das stärkste Horror-Konto, @concet5612, postet ganz ohne Beschreibung: 10 von 10 Videos, Median 139.350.
   - @dogeok setzt bei allen 10 Videos genau `#roblox #robloxshorts`, Median 221.100.
   - Von 68 Story-Videos im Fenster mit mindestens 100.000 Aufrufen (alle Quellen, auch deutsche Konten) tragen 61 einen Roblox-Hashtag, 7 haben gar keinen. Kein einziges hat Hashtags ohne Roblox [D].
2. **Was wir übernehmen:**
   - Die Muster: wenige Tags, ein fester Satz je Serie, die Regel als erster Satz der Beschreibung, `#inthistown` nur, wenn der gesprochene Hook so beginnt, und `#plottwist` nur bei echter Wendung.
   - Die Tags selbst übernehmen wir nicht, denn fast alle sind Roblox-Tags.
3. **Generische Horror-Tags** (`#horror`, `#scary`, `#scarystories`, `#horrortok`, `#horrorstory`, `#creepy`):
   - Im Datensatz stehen sie nur bei schwachen Konten und bei Spielvideos.
   - Ohne @iarise (Horror-Spiele) trägt keine Story mit 100.000 Aufrufen oder mehr einen von ihnen.
   - @townrulestv (4 Follower) nutzt genau den Satz, den man sich ausdenken würde: `#scarystories #horrortok #robloxhorror #townrules #fyp` plus eine „Would you …?“-Frage. Das bringt 25–321 Aufrufe je Video.
   - **Hashtags tragen ein neues Konto nicht.**
4. **Was Hashtags laut TikTok und großen Studien bringen:**
   - TikTok nennt Bildunterschrift, Sounds und Hashtags als ein Signal unter vielen [T1].
   - Gemessen sind +3,7 % bzw. +5 % Aufrufe für Videos mit Hashtags [W1][W2], also wenig.
   - Über Hashtag-Seiten kommen im Schnitt 10 % der Aufrufe, über die Suche 4 % [W1].
   - Die Suche hat einen Zusatzwert: Creator Rewards bewertet „search value“ [T2].
   - Seit 2025 sind laut Nutzerberichten höchstens 5 Hashtags möglich [T4].
5. **Empfehlung: 5 Hashtags je Video.**
   - 3 feste: `#hidingnight` (Serien-Tag, wechselt mit der Serie), `#horrorstory`, `#animation`.
   - 2 wechselnde aus einem kleinen Pool, passend zum Teil.
   - Nie `#fyp`/`#foryou`/`#viral`, nie Roblox-Tags.
   - Das Set ist in der Nische **unbelegt**, weil es dort niemand ohne Roblox-Tag macht. Es ist ehrlich, markenrechtlich sauber und passt zu den Suchbegriffen. Ob es trägt, misst TikTok Studio (Abschnitt 4.4).
6. **Drei fertige Bildunterschriften** für Hiding Night 1, 2 und Finale stehen in Abschnitt 4.3.

---

## 1. Was die eigenen Daten zeigen

Grundlage: alle Videos aus Konto-Quellen, also die neuesten 10–13 je Konto. Videos aus Hashtag-Seiten tragen den Hashtag schon wegen der Auswahl; für den Vergleich mit und ohne sind sie ungeeignet.

„Englische Story-Konten“ heißt hier: @concet5612, @dogeok, @lileggy38, @larpniverse, @cannonanimatess, @shadowtalesroblox, @inthisworldstory, @thistownbiz, @town.rules, @townrulestv. „Fenster“: Upload ab 31.10.2026.

### 1.1 Posten die Top-Konten mit Hashtags?

| Konto | Follower | n | Median Aufrufe | Ø Tags | Ohne Tag | Fester Satz (Häufigkeit) |
|---|---|---|---|---|---|---|
| @larpniverse | 15.251 | 5 | 1.000.000 | 3,8 | 0 | `#roblox #inthistown` (5/5), `#fyp` (4/5) |
| @cannonanimatess | 32.049 | 11 | 227.600 | 3,3 | 0 | `#roblox #robloxanimation` (11/11), `#robloxstory` (10/11) |
| @dogeok | 124.247 | 10 | 221.100 | 2,0 | 0 | `#roblox #robloxshorts` (10/10) |
| @lileggy38 | 19.422 | 12 | 189.450 | 8,3 | 0 | `#roblox #inthistown` (12/12), `#fyp`, `#animation` (je 11), `#inthisworld` (10), `#robloxanimation` (9), `#plottwist` (8) |
| @shadowtalesroblox (Komik) | 108.269 | 10 | 166.950 | 3,0 | 0 | `#roblox #robloxfyp #robloxstories` (10/10) |
| **@concet5612** | 107.325 | 10 | 139.350 | **0** | **10** | **keine Beschreibung, kein Tag** |
| @thistownbiz | 724 | 10 | 9.941 | 2,3 | 0 | `#roblox` (10), `#robloxstories` (5), `#horror` (3), `#scary` (2) |
| @inthisworldstory | 63.224 | 10 | 7.967 | 4,0 | 0 | `#roblox #robloxstory #robloxanimation #inthisworld` (10/10), Text nur „story“ |
| @town.rules | 762 | 10 | 6.465 | 4,8 | 0 | `#fyp #robloxstory` (10), `#roblox` (9), `#inthistown` (8), `#viral` (6) |
| @townrulestv | 4 | 10 | 114 | 6,0 | 0 | `#fyp #roblox #robloxhorror` (10), `#townrules #scarystories #horrortok` (9) |

Zum Vergleich: Der Spielekanal @iarise (1,9 Mio. Follower, Median 1,6 Mio., n = 13) nutzt bei 10 von 13 Videos `#roblox #robloxhorror #horror #horrorgame`. Unter `#horror` und `#robloxhorror` stehen also vor allem Spielvideos.

**Folgerung:**
- Erfolgreiche Konten nutzen einen kleinen, festen Satz und wechseln kaum. Daraus folgt Regel 4.1.
- Erfolg ohne jede Beschreibung geht: @concet5612. Das Konto hat aber 107.000 Follower; ein neues Konto hat diese Signale nicht (S).

### 1.2 Häufigkeit und Median mit oder ohne Hashtag

Englische Story-Konten, Fenster, n = 90, Median 23.950 [D].

| Hashtag | n | Anteil | Konten | Median mit | Median ohne |
|---|---|---|---|---|---|
| `#roblox` | 79 | 88 % | 9 | 14.200 | 127.600 |
| `#fyp` | 34 | 38 % | 4 | 10.070 | 62.000 |
| `#robloxstory` | 29 | 32 % | 6 | 8.418 | 106.000 |
| `#inthistown` | 24 | 27 % | 3 | 41.900 | 13.600 |
| `#robloxanimation` | 22 | 24 % | 3 | 13.900 | 30.750 |
| `#inthisworld` | 21 | 23 % | 3 | 30.900 | 17.100 |
| `#robloxstories` | 15 | 17 % | 2 | 110.000 | 13.200 |
| `#townrules` | 13 | 14 % | 2 | 258 | 52.900 |
| `#robloxhorror` | 11 | 12 % | 2 | 120 | 33.900 |
| `#viral` | 11 | 12 % | 3 | 10.600 | 30.600 |
| `#animation` | 10 | 11 % | 1 | 94.150 | 13.600 |
| `#robloxshorts` | 10 | 11 % | 1 | 221.100 | 13.400 |
| `#robloxfyp` | 10 | 11 % | 1 | 166.950 | 13.000 |
| `#scarystories` | 9 | 10 % | 1 | 108 | 33.900 |
| `#horrortok` | 9 | 10 % | 1 | 108 | 33.900 |
| `#plottwist` | 8 | 9 % | 1 | 264.150 | 13.600 |
| `#horror` | 3 | 3 % | 1 | 8.082 | 30.900 |
| `#scary` | 3 | 3 % | 2 | 462 | 30.900 |
| `#horrorstory` | 1 | 1 % | 1 | 260 | – |

**So lesen:** Die Spalten „mit“ und „ohne“ messen fast nur das **Konto**, nicht den Hashtag.
- „Ohne `#roblox`“ heißt praktisch @concet5612.
- „Mit `#scarystories`“ heißt praktisch @townrulestv mit 4 Followern.
- `#robloxshorts` steht nur bei @dogeok, `#plottwist` nur bei @lileggy38.

Ein Hashtag-Effekt ist aus dieser Tabelle nicht ablesbar (S).

**Anzahl Hashtags** (gleiche Gruppe):

| Tags je Video | n | Median | Konten |
|---|---|---|---|
| 0 | 10 | 139.350 | 1 (@concet5612) |
| 1–3 | 34 | 93.100 | 5 |
| 4–5 | 26 | 8.611 | 6 |
| 6 und mehr | 20 | 5.410 | 2 (@lileggy38, @townrulestv) |

Auch das spiegelt die Konten. Die großen Studien finden für die Anzahl nur kleine oder widersprüchliche Unterschiede (Abschnitt 3).

### 1.3 Welche Tags tragen die erfolgreichsten Horror-Storys?

Horror-Storys im Fenster, englische Story-Konten, n = 31:

| Datum | Konto | Aufrufe | Hashtags |
|---|---|---|---|
| 13.11. | @concet5612 | 1.100.000 | keine |
| 11.11. | @dogeok („He Didn't Blink 👀“) | 906.300 | `#roblox #robloxshorts` |
| 13.11. | @concet5612 | 756.800 | keine |
| 11.11. | @concet5612 | 715.600 | keine |
| 09.11. | @dogeok („Extra Chair“) | 547.700 | `#roblox #robloxshorts` |
| 08.11. | @dogeok („The Hotel 🏨“) | 472.400 | `#roblox #robloxshorts` |
| 10.11. | @dogeok („Whispher 🗣️“) | 466.200 | `#roblox #robloxshorts` |
| 31.10. | @cannonanimatess („The Boy Whose Shadow Was Alive“) | 227.600 | `#roblox #robloxanimation #robloxstory` |
| … | | | |
| 09.11. | @thistownbiz („The Stilt Men 😨“) | 12.200 | `#roblox #horror` |
| 10.11. | @thistownbiz („The Room“) | 462 | `#roblox #scary #horror` |
| 03.11. | @townrulestv | 25–321 (9 Videos) | `#fyp #horrortok #roblox #robloxhorror #scarystories #townrules` |

Knapp vor dem Fenster liegt „In This Town, A Game Of Tag Is Deadly💀“ von @cannonanimatess (20.10., 5,1 Mio.) mit `#roblox #robloxanimation #robloxstory`.

**Über alle Quellen:**
- Im Fenster gibt es 191 Story-Videos, davon 68 mit mindestens 100.000 Aufrufen.
- 61 dieser 68 tragen einen Roblox-Tag, 7 keinen Tag (6 × @concet5612, 1 × @agentsudais1). Keins hat Hashtags ohne Roblox.
- Ein generischer Horror-Tag steht nur bei @iarise (`#horror`, 7 Spielvideos).
- Alle 20 Story-Videos mit generischem Horror-Tag kommen von 4 Konten (@iarise, @thistownbiz, @townrulestv, @zerobraincellstudio). Ihr Median liegt bei 2.195.

**Innerhalb eines Kontos** (n klein, nur Hinweise):
- @lileggy38 `#plottwist`: mit 264.150 (n = 8), ohne 47.900 (n = 4). Der Tag steht vor allem bei den Fantasy-Regeln, die ohnehin besser laufen (S).
- @thistownbiz `#horror`: mit 8.082 (n = 3), ohne 11.800 (n = 7).
- @town.rules `#inthistown`: mit 9.029 (n = 8), ohne 1.754 (n = 2). Die Videos ohne den Tag sind die jüngsten (S).

### 1.4 Gesamtgrößen laut gespeicherten Hashtag-Embeds

US-Embeds, Stand 14.11.2026 um 22:24–22:28 UTC [D]. „Top im Fenster“ zählt, wie viele der gezeigten Top-Videos ab dem 31.10.2026 hochgeladen wurden.

| Hashtag | Aufrufe gesamt | Videos | Top im Fenster | Median-Datum der Top-Videos | Was oben steht |
|---|---|---|---|---|---|
| `#scarystories` | 57.988.744.512 | 1.825.351 | 0/10 | 01.10.2020 | Halloween-Kostüme, Make-up, wahre Storytimes von 2020 |
| `#robloxstory` | 49.828.489.669 | 1.557.400 | 0/7 | 11.07.2023 | Spiel-Clips, Memes |
| `#robloxstories` | 18.393.785.861 | 452.363 | 0/9 | 26.08.2023 | |
| `#robloxanimation` | 13.189.757.486 | 234.544 | 0/10 | 09.01.2026 | Memes, Edits |
| `#robloxhorror` | 11.281.442.259 | 223.299 | 0/9 | 24.07.2025 | Spielvideos, Spiel-Werbung („ECHO coming soon on ROBLOX“) |
| `#robloxstorytime` | 3.823.795.439 | 124.345 | 0/4 | 31.05.2022 | |
| `#robloxscary` | 930.387.347 | 21.274 | 0/10 | 20.11.2024 | |
| `#inthistown` | 377.228.045 | 19.043 | 7/10 | 05.11.2026 | Spiel-Werbung „In This Town“ (12,7 Mio.), Zusammenschnitte; eigene Storys 2 |
| `#inthisworld` | 183.083.903 | 11.102 | 8/10 | 06.11.2026 | dieselben Spiele, Zusammenschnitte |
| `#robloxcreepypasta` | 99.074.160 | 2.124 | 0/9 | 30.10.2025 | |
| `#robloxhorrorstory` | 84.512.226 | 1.485 | 0/7 | 05.07.2023 | Spielvideos 2022–2024 |
| `#robloxhorrorstories` | 77.489.659 | 1.489 | 0/7 | 24.06.2023 | |
| `#townrules` | 402.196 | 36 | 8/10 | 01.11.2026 | Nachahmer |

Deutsche Tags zum Vergleich, falls Phase 2 kommt:

| Hashtag | Aufrufe gesamt | Videos | Median-Datum der Top-Videos |
|---|---|---|---|
| `#gruselgeschichte` | 836,9 Mio. | 27.560 | 2019 |
| `#horrorgeschichte` | 546,3 Mio. | 9.316 | 2021 |
| `#indieserstadt` | 16,5 Mio. | 768 | 10/10 aus dem Fenster |
| `#indieserwelt` | 8,2 Mio. | 193 | 10/10 aus dem Fenster |

**Nicht im Datensatz:** `#horrorstory`, `#scarystory`, `#horror`, `#scary`, `#creepy`, `#horrortok`, `#animation`, `#3danimation`, `#animatedstory`, `#storytime`. Größen dazu stehen in Abschnitt 2, aus Fremdquellen.

**Folgerung:**
- Die großen Dauer-Tags (`#scarystories`, `#robloxstory`) haben oben nur alte Videos. Ein neues Video landet dort nicht in der Top-Auswahl (S).
- Frisch sind nur die Trend-Tags `#inthistown` und `#inthisworld`, und dort oben stehen Werbung und Zusammenschnitte.

---

## 2. Kandidaten: Größe und Einschätzung

Websuche am 16.11.2026. Die Tracker-Seiten (hashtagradar.com, tiktokhashtags.com) wurden nicht geöffnet: Ihre robots.txt sperrt `ClaudeBot` und `Claude-Web`. tokranks.com antwortete mit 403. Die Werte stammen aus Suchauszügen [G1][G2]. Sie widersprechen sich und sind teils Jahre alt.

Beispiel für das Datenalter: `#scarystories` steht bei tiktokhashtags mit 25,6 Mrd. Aufrufen, laut Seite etwa 3 Jahre alt; unser Embed vom 14.11.2026 zeigt 58,0 Mrd. Tracker-Zahlen sind also nur grobe Untergrenzen (S).

| Hashtag | Größe (Quelle, Datum) | Was dort läuft, Passung | Urteil |
|---|---|---|---|
| `#horrorstory` | ≈ 352.200 Posts, Ø 53.707 Aufrufe je Post [G1, Seite „2026“]; daraus ≈ 18,9 Mrd. Aufrufe (eigene Rechnung, S) | Benennt genau unseren Inhalt und den Suchbegriff „horror story“. Im Datensatz nur 1 Video (@townrulestv). Mittlere Größe, mehr Aufrufe je Post als `#horror` (34.322) | **Kern** |
| `#scarystories` | 58,0 Mrd. Aufrufe, 1.825.351 Videos [D, 14.11.2026] | Größte Horror-Story-Ablage, oben aber 2020er Halloween- und Echt-Storytimes. Beschreibt uns richtig | **Wechsel**, Standard |
| `#scarystory` | 4,2 Mrd. (TikTok-Tagseite im Suchauszug, ohne Datum); 97.900 Posts, 6 Mrd. [G2, ≈ 1.060 Tage alt] | Dublette von `#scarystories`, kleiner | nein |
| `#horrortok` | ≈ 1,6 Mio. Posts, Ø ≈ 35.000 [G1]. Aufrufe: 2,5 Mrd. (Business Insider, etwa 2020/21), 80 Mrd. (clippie.ai, „mid-2025“), > 50 Mrd. (Hola, 31.10.2025) [G4] | Gemeinschaftstag für alles mit Horror: Filme, Make-up, Echtes. Bei @townrulestv ohne Wirkung | nein, höchstens Ersatz |
| `#horror` | 6,7 Mio. Posts, 228,5 Mrd. Aufrufe, Ø 34.322 [G1, „2026“] | Im Datensatz vor allem Horror-Spielvideos (@iarise) und Filmschnipsel: falsche Nachbarschaft (S) | nein |
| `#scary` | ≈ 6,8 Mio. Posts, Ø ≈ 30.850, 210–229 Mrd. [G2, älter] | Streiche, Jumpscares, Spiele (S) | nein |
| `#creepy` | 2,8–2,9 Mio. Posts, 116–123 Mrd. [G2, ≈ 2,5 Jahre alt]; Ø 41.212 [G1, „2026“] | Stimmungswort, passt zu Spuren, Klopfen, Fingern | **Wechsel** |
| `#animation` | ≈ 6,3 Mio. Posts, 243,2 Mrd. [G2, Daten etwa 2023] | Benennt die Form. Das nächste Vorbild ohne festen Roblox-Takt, @lileggy38, nutzt es bei 11 von 12 Videos | **Kern** |
| `#3danimation` | 228.600 Posts, 8,6 Mrd. [G2, ≈ 1.088 Tage alt]; 896.361 Posts laut best-hashtags | Publikum eher 3D-Künstler (Blender, Render) als Story-Zuschauer (S) | Testplatz |
| `#animatedstory` / `#animatedstories` | 33.800 Posts, 2,7 Mrd. bzw. 100.300 Posts, 8,8 Mrd.; Ø ≈ 80.000–87.000 [G2, ≈ 3 Jahre alt] | Genau unser Format, klein. Im Datensatz nur bei Spielvideos (@zerobraincellstudio) | Testplatz |
| `#storytime` | 17,1 Mio. Posts, 520,6 Mrd. [G2, ≈ 3 Jahre alt] | Überwiegend Leute, die vor der Kamera Erlebtes erzählen (S); falsche Erwartung | nein |
| `#shortstory` | keine Zahl gefunden (u) | auch Schreib-Community und BookTok (S) | nein |
| `#horroranimation` | keine Zahl gefunden (u) | würde passen; Größe in der App prüfen | prüfen, sonst nein |
| `#inthistown` | 377,2 Mio., 19.043 Videos, 7/10 Top-Videos frisch [D] | Unser Hook beginnt wörtlich mit „In this town“. Trend im Spätstadium, oben Roblox-Spiel-Werbung (Bericht §3) | **Wechsel, nur Teil 1, als Test** |
| `#inthisworld` | 183,1 Mio., 11.102 Videos [D] | Unser Hook sagt nicht „In this world“ | nein |
| `#plottwist` | keine Gesamtzahl gesucht | Benennt die Wendung. Bei @lileggy38 innerhalb des Kontos 264.150 mit gegen 47.900 ohne (n = 8/4) | **Wechsel, nur Finale** |
| `#fyp` / `#foryou` | `#fyp` ≈ 49–80 Bio. Aufrufe, `#foryou` ≈ 27–32 Bio. (verschiedene Tracker) [G3] | Beschreibt nichts. Eigene Daten: mit 10.070, ohne 62.000 (verzerrt durch Konten). Socialcrawl: +16,7 % gegen den Konto-Median, laut Autor wohl Auswahleffekt [W2]. Metricool rät zu Themen-Tags statt `#fyp`/`#viral` [W1]. TikTok hat sich nie dazu geäußert [W2] | **nein**: kostet einen der 5 Plätze |

### 2.1 Roblox-Tags: warum wir sie nicht nutzen

`#roblox` steht bei 88 % der Videos englischer Story-Konten, `#robloxstory` hat 49,8 Mrd. Aufrufe [D]. Es ist der Träger-Tag der ganzen Nische. Trotzdem nicht, aus fünf Gründen:

1. **Es stimmt nicht.**
   - Unsere Figuren sind eigene Klötzchenfiguren, keine Roblox-Avatare, und nichts davon spielt in Roblox (PLAN, Entscheidung 1).
   - Die Vorrecherche hielt „Roblox“ als Hashtag für vertretbar, als beschreibende Angabe nach § 23 MarkenG (`recherche-plan-v0.md`). Damals ging es um Aufnahmen aus Roblox Studio. Ohne Roblox-Material beschreibt der Tag nichts Wahres mehr (S, keine Rechtsberatung).
2. **Markenrichtlinie.**
   - Roblox verbietet in seinen Name-and-Logo-Richtlinien, eine offizielle Partnerschaft oder Billigung anzudeuten [R1].
   - Die klassischen Avatare und ihre Ableitungen sind laut Roblox „solely for on-platform use“ [L1b].
   - Ein `#roblox` unter Klötzchenfiguren lädt genau zu dem Vergleich ein, den wir mit eigenen Proportionen und Gesichtern vermeiden wollen (S).
3. **Getäuschte Zuschauer.**
   - Wer über `#roblox` kommt, erwartet Roblox und sieht etwas anderes.
   - Das bedeutet schnelles Wegwischen, „Nicht interessiert“ und Kommentare wie „this isn't roblox“ (S).
   - Wiedergabezeit und solche Rückmeldungen wiegen bei TikTok schwerer als Hashtags [T1][W5].
4. **Dort läuft keine Story-Bühne.** Die Top-Videos von `#robloxhorror`, `#robloxhorrorstory` und `#robloxstory` sind Spielvideos, Spiel-Werbung und Memes von 2022–2025 (Tabelle 1.4).
5. **Eigene Regel:** PLAN.md (Serienformat, Inhaltsregeln), Anhang A7.4, Upload-Paket A9: „3–5 Hashtags ohne ‚roblox‘“.

**Preis (S):** Wir verzichten auf den Tag, den 61 der 68 Story-Treffer tragen. Das gleichen wir nicht mit anderen Tags aus, sondern mit Hook, Stil und Serie.

**Dasselbe gilt für fremde Marken und Figuren:** `#fnaf`, `#scp`, `#sirenhead`, `#fortnite` und Ähnliches nicht. Die Figuren sind auch inhaltlich tabu (Regel 9).

---

## 3. Was TikTok selbst und seriöse Quellen sagen (2025–2026)

### 3.1 TikTok selbst

1. **Empfehlung:**
   - TikTok listet unter „video information“ ausdrücklich „captions, sounds, and hashtags“ als einen Faktor unter mehreren.
   - Nutzer-Interaktionen wie Ansehen, Teilen und Folgen kommen zuerst [T1] (Newsroom 18.06.2020, Neufassung 01.11.2023; nur Suchauszug).
2. **Suche zählt fürs Geld:**
   - Creator Rewards bewertet vier Größen: Originality, Play Duration, Search Value und Audience Engagement.
   - „Search value“ ist laut TikTok „a metric assigned to content based on popular search terms“ [T2] (Newsroom 18.03.2024).
   - Dazu kam das Werkzeug Creator Search Insights. Linus findet es, indem er in der App „Creator Search Insights“ in die Suche tippt.
3. **Keywords verwalten (seit Ende April 2026):**
   - TikTok vergibt Such-Keywords selbst. Die Meldung in der App lautet: „This post displays keywords automatically added by TikTok based on popular searches. You can manage them at any time.“
   - Creator können Keywords sperren und neue vorschlagen; TikTok prüft die Vorschläge [T3] (Social Media Today, 26.04.2026, nach Screenshots; wie weit ausgerollt, ist unklar).
4. **Höchstens 5 Hashtags:**
   - Seit August 2025 melden Nutzer beim sechsten Tag den Hinweis „Maximum 5 hashtags“.
   - TikTok hat das nicht offiziell erklärt, und ob es für alle Konten gilt, ist offen [T4].
5. **Entwicklerdoku** [T5], Content Posting API, Stand 27.10.2026:
   - Das Feld für die Bildunterschrift heißt `title`. „Hashtags (#) and mentions (@) will be matched, or deliminated by spaces or new lines.“
   - Maximal 2.200 UTF-16-Zeichen; in der App laut Drittquellen 4.000.
   - Zu Ranking oder Wirkung sagt die Doku nichts.

### 3.2 Studien und Fachpresse

| Quelle | Daten | Befund zu Hashtags |
|---|---|---|
| Metricool [W1] (NetInfluencer, 16.06.2026) | 2,31 Mio. Posts, über 92.000 Konten, Jan.–Feb. 2025 und 2026 | Herkunft der Aufrufe: For You 73 %, Profil 11 %, **Hashtags 10 %**, **Suche 4 %**, Following 2 %, Sound unter 1 %. Hashtag-Traffic +114 % gegen 2025. Mit mindestens einem Hashtag +5 % Aufrufe, +10 % Interaktionen. Empfehlung: wenige Themen-Tags, nicht `#fyp`/`#viral` |
| Socialcrawl [W2] (10.08.2026) | 1.569 Videos, 40 Konten, je Video gegen den eigenen Konto-Median | Mit Hashtag 1,012, ohne 0,975 (+3,7 %). 7 und mehr Tags +9,5 %, getragen von 5 Dauer-Taggern. `#fyp` +16,7 %, laut Autor wohl Auswahleffekt. Beobachtung, keine Ursache |
| Quso.ai [W3] (29.06.2026) | „60K+“ bzw. etwa 508.000 Posts (Seite widersprüchlich), mindestens 14 Tage alt | Median-Aufrufe TikTok: 0 Tags 304, 7–10 Tags 140, 11+ Tags 272. Rät zu 1–3 genauen Tags |
| SocialPilot [W4] (Pressemitteilung 24.06.2025) | 1,5 Mio. Posts, Q1 2025 | 1–5 Hashtags mit der besten Reichweite (nur Suchauszug) |
| Sprout Social, Hootsuite [W5] (2026) | Ratgeber | Hashtags und Bildunterschrift dienen der Einordnung, nicht als Reichweiten-Hebel. Hashtags sollen zu den gesprochenen und geschriebenen Keywords passen. Kein Keyword-Stopfen |

**Gesprochene und eingeblendete Keywords:**
- Fast alle SEO-Ratgeber schreiben, TikTok werte Sprache (Spracherkennung) und Bildtext (Texterkennung) für die Suche aus. Sie gewichten das aber widersprüchlich, und keiner zitiert TikTok (u).
- Plausibel ist es, weil TikTok Keywords „automatically … based on popular searches“ vergibt [T3] (S).
- Für uns kostet es nichts: Monster- und Seriennamen stehen ohnehin im Hook und im Titelbild.

### 3.3 Einordnung

- Hashtags sind **Etiketten, kein Hebel.** Die zwei großen Datensätze finden +3,7 % bzw. +5 % [W1][W2].
- Zwischen unseren Vorbildkonten liegt dagegen mehr als Faktor 1.000 im Median (114 bis 1.000.000, Tabelle 1.1). Die Unterschiede machen Inhalt und Konto.
- Die Hashtag-Seiten bringen im Schnitt 10 % der Aufrufe [W1]. Das ist der realistische Rahmen für gute Tags.
- **Suche** bringt nur 4 % der Aufrufe [W1], zählt aber doppelt:
  - für Creator Rewards („search value“) [T2],
  - für Serien, weil Zuschauer „hiding night part 2“ suchen (S).

  Deshalb gehört Arbeit in die Bildunterschrift, nicht in lange Tag-Listen.

---

## 4. Empfehlung

### 4.1 Hashtag-Set: 5 je Video

| Platz | Tag | Regel |
|---|---|---|
| 1, fest | `#hidingnight` | Serien-Tag; jede Serie bekommt ihren eigenen (`#straightface`, `#onemorevoice` …). Vor dem ersten Upload in der App eintippen: Ist der Tag schon groß und fremd belegt, `#hidingnightstory` nehmen. Die Websuche fand am 16.11.2026 für „Hiding Night“ und „Mister Hundred“ nichts Bekanntes [N] |
| 2, fest | `#horrorstory` | Gattung und Suchbegriff |
| 3, fest | `#animation` | Form |
| 4–5, wechselnd | aus dem Pool unten | genau beschreiben, was in **diesem** Teil passiert |

**Pool für die Plätze 4 und 5:**
- `#scarystories`: Standard, wenn nichts Besseres passt.
- `#inthistown`: nur wenn der gesprochene Hook wörtlich mit „In this town“ beginnt. Als Test, nach Teil 1 auswerten (4.4).
- `#creepy`: Stimmungs-Teile (Spur, Klopfen, Finger).
- `#plottwist`: nur im Finale mit echter Wendung.
- Testplatz für spätere Serien, je Video nur eine Änderung: `#3danimation`, `#animatedstory`, `#horroranimation` (Größe vorher in der App prüfen).

**Nie:**
- `#fyp`, `#foryou`, `#foryoupage`, `#viral`, `#trending`, `#fy`,
- alles mit `roblox` oder `blox`, fremde Marken und Figuren,
- `#storytime`, `#truestory` (es ist erfunden), Tags ohne Bezug zum Video.

**Monstername:** „Mister Hundred“ steht als Text in der Bildunterschrift, nicht als Tag. Die Suche liest den Text mit [T1], und der Platz bleibt frei (S).

### 4.2 Keyword-Regeln für die Bildunterschrift

1. **Erste Zeile: Serie und Teil.** „Hiding Night, Part 1 of 3.“
   - Steht vorn, weil TikTok lange Texte kürzt (S).
   - Hilft der Suche nach Serie und Teil (S).
2. **Ein Satz Prämisse mit den Wörtern des gesprochenen Hooks:** Ort, Regel, Monster, Preis (Mister Hundred, 18, hide, sunrise).
   - Dieselben Wörter stehen im Titelbild und fallen in den ersten 15 s (Regel 10).
   - Gesprochenes, Geschriebenes und Hashtags sagen dasselbe [W5].
3. **Die Gattung einmal im Klartext:** „An animated horror story.“
   - Das ist der natürliche Suchbegriff; dazu kommt `#horrorstory`.
   - Mehr Wiederholung ist Stopfen [W5].
4. **Dann die Streitfrage, höchstens 8 Wörter.** Sie wird nie gesprochen (Regel 7, A6).
5. **Die Hashtags ans Ende,** genau 5, kleingeschrieben, ohne Füllwörter. Im Upload-Paket steht alles in einer Zeile; Zeilenumbrüche in der App sind erlaubt, aber nicht nötig.
6. **Länge:** 200–300 Zeichen gesamt, die erste Zeile höchstens etwa 150 (A).
7. **Englisch, US-Schreibweise.** Zahlen als Ziffern („18“), wie man sucht (S). Höchstens ein Emoji, keins nötig.
8. **Nur versprechen, was das Video hält.** Kein „true story“, kein „you won't believe“, kein „Roblox“.
9. **Verweise in den angehefteten Kommentar,** nicht in die Bildunterschrift. Bei Teil 1 gibt es Teil 2 noch nicht.
10. **Nach dem Upload „Keywords verwalten“ prüfen** (drei Punkte am Video), falls das Konto die Funktion hat [T3]:
    - **„roblox“ sperren, falls TikTok es vergibt.** Das liegt bei Klötzchen-Optik nahe (S).
    - Vorschlagen: „horror story“, „animated horror story“, „hiding night“, „mister hundred“.
11. **Gesprochen und eingeblendet** (für die Suche, u):
    - Der Monstername fällt früh: in Teil 1 bei 5,9 s („We call it Mister Hundred.“, Satz 2), ab Teil 2 im Hook.
    - **Befund:** Der Serienname „Hiding Night“ fällt in Teil 1 erst bei 27,3 s (Satz 9, `folge-01/timing.json`). Regel 10 verlangt die ersten 15 s. Titelbild und Bildunterschrift gleichen das aus; wenn Teil 1 neu vertont wird, den Satz nach vorn ziehen (A).
    - Das Titelbild trägt groß „HIDING NIGHT · PART 1“.
    - Die Endkarte „PART 2“ bleibt.
    - Kein zusätzliches gesprochenes „horror story“, das wäre ein Etikett im Text.

### 4.3 Fertige Bildunterschriften

Jede Bildunterschrift steht in einer Zeile, so wie `bildunterschrift.txt` im Upload-Paket (`horror/docs/release/automatisierung.md` §5). Die Prämisse übernimmt jeweils den gesprochenen Hook.

**Teil 1** (242 Zeichen; Hook aus `folge-01/skript-teil1.txt`, Frage aus `abgleich-2026-11-15.md`):

```
Hiding Night, Part 1 of 3. In this town, when you turn 18, you hide until sunrise, or Mister Hundred finds you. An animated horror story. Where would you hide from Mister Hundred? #hidingnight #horrorstory #animation #scarystories #inthistown
```

**Teil 2** (247 Zeichen; Hook aus `folge-02/skript-teil2.txt`, Frage aus `folge-01/serie.md`, Review Teil 2):

```
Hiding Night, Part 2 of 3. Mister Hundred takes you at 18, and it came six hours early. The footprints stopped at June's window. An animated horror story. Would you hide under June's room? #hidingnight #horrorstory #animation #scarystories #creepy
```

**Teil 3, Finale** (235 Zeichen; Hook A aus `folge-03/entwurf.md`, Stand 16.11.2026; Frage aus demselben Entwurf und `abgleich-2026-11-15.md` §5):

```
Hiding Night, Part 3 of 3: the finale. Mister Hundred takes you at 18 if you answer, and it asked me in my sister's voice. An animated horror story. Would you have come out? #hidingnight #horrorstory #animation #plottwist #scarystories
```

`#plottwist` kündigt nur an, dass es eine Wendung gibt, nicht welche. Die Enthüllung (Junes Gesicht) bleibt aus Bildunterschrift und Titelbild heraus (A7.2).

**Angehefteter Kommentar:**
- Teil 2: „Part 1: [Link]“.
- Finale: „Part 1: [Link] · Part 2: [Link]“.
- Sobald Teil 2 online ist, bei Teil 1 nachtragen: „Part 2 is up: [Link]“.

**Wenn sich die Skripte ändern:**
- Bei vier Teilen „of 4“ setzen.
- Wird beim Finale Hook B statt A gewählt, die Prämisse anpassen: „Mister Hundred takes you at 18 unless you hide, and it finished counting right above my face.“
- Allgemein: Prämisse und Frage aus dem endgültigen Skript übernehmen. Die Prämisse muss die Wörter des gesprochenen Hooks enthalten.

### 4.4 Messen statt glauben

1. **Je Teil nach 7 Tagen in TikTok Studio** die Herkunft der Aufrufe notieren, besonders „Hashtag“ und „Suche“. Falls angezeigt, auch die Suchbegriffe. Das gehört zu den wöchentlichen Screenshots aus dem Plan.
2. **Richtwert:** Hashtags bringen im Schnitt etwa 10 % der Aufrufe [W1].
   - Bleibt ein Wechsel-Tag über 3 Videos deutlich darunter (unter 2 %), fliegt er raus (A).
   - Die festen Tags bleiben, bis eine ganze Serie vorliegt.
3. **Je Video ändert sich nur ein Platz,** sonst ist nichts zuzuordnen. Teil 1 gegen Teil 2 ist kein sauberer Test (anderer Inhalt, n = 1). Erst über mehrere Serien wird ein Muster daraus (S).
4. **Der Test aus dem Plan bleibt:** mit gegen ohne Bildunterschrift und Hashtags (Phase 1, Woche 3; `recherche-plan-v0.md`). Hiding Night bekommt beides, weil es die erste Serie ist (A).
5. **Radar:** Nach dem Start `#hidingnight`, `#horrorstory` und `#scarystory` in `horror/tools/trends/quellen.json` aufnehmen; die letzten beiden fehlen schon jetzt. Linus speichert die Seiten von Hand (README). Diese Datei wurde hier nicht geändert.

---

## Quellen

Alle Abrufe und Suchen am 16.11.2026, sofern nicht anders angegeben.

- **[D]** Datensatz der Vorrecherche, 170 Seiten, abgerufen am 14.11.2026, 22:13–22:34 UTC.
  - Ausgewertet mit `horror/tools/trends/radar.py` (Parser) und dem Skript `/tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/scratchpad/hashtags/auswertung.py`.
  - Zwischenergebnisse: `/tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/scratchpad/hashtags/ausgabe.txt`, `…/hashtags/story-konten.txt`, `…/hashtags/videos.json`.
  - Konto-Embeds `https://www.tiktok.com/embed/@<konto>`, Hashtag-Embeds `…/embed/tag/<hashtag>`, Videoseiten. Follower aus `trends-radar/alle/radar-2026-11-15.md`.
- **[T1]** TikTok Newsroom, „How TikTok recommends videos #ForYou“, 18.06.2020, und Neufassung 01.11.2023 („video information, which might include details like captions, sounds, and hashtags“). Nur Suchauszug, tiktok.com nicht abgerufen. https://newsroom.tiktok.com/how-tiktok-recommends-videos-for-you, https://newsroom.tiktok.com/how-tik-tok-recommends-video-for-you
- **[T2]** TikTok Newsroom, „Introducing the new Creator Rewards Program“, 18.03.2024 („search value … a metric assigned to content based on popular search terms“). Nur Suchauszug. https://newsroom.tiktok.com/introducing-the-new-creator-rewards-program; dazu Search Engine Journal: https://searchenginejournal.com/tiktoks-new-creator-rewards-program-prioritizes-search-value/511376
- **[T3]** Social Media Today, „TikTok lets users add relevant keywords to metadata“, 26.04.2026. https://www.socialmediatoday.com/news/tiktok-lets-users-add-relevant-keywords-to-metadata/818507/; ergänzend Uppbeat: https://uppbeat.io/blog/creator-news/tiktok-now-lets-you-control-the-search-keywords-on-your-videos
- **[T4]** Fünf-Hashtag-Grenze:
  - Social Media Today, 17.08.2025: https://www.socialmediatoday.com/news/tiktok-implements-five-hashtag-limit-per-post/757857/
  - Planoly, 04.09.2025, aktualisiert 11.11.2025: https://www.planoly.com/blog/tiktok-5-hashtag-limit
  - Search Engine Land, nur Suchauszug (403): https://searchengineland.com/tiktok-limits-hashtags-460894
- **[T5]** TikTok for Developers, Content Posting API, Direct Post Reference, Stand 27.10.2026. https://developers.tiktok.com/doc/content-posting-api-reference-direct-post. Vorher geprüft: `https://developers.tiktok.com/robots.txt` liefert keine robots-Datei, sondern eine HTML-Seite, also keine Sperre.
- **[W1]** Metricool-Studie über NetInfluencer, 16.06.2026 (2,31 Mio. Posts, Jan.–Feb. 2025/2026). https://www.netinfluencer.com/tiktok-content-volume-up-nearly-80-percent-in-early-2026-as-per-post-performance-declined-report-finds/
- **[W2]** Socialcrawl, „Do hashtags work on TikTok“, Daten vom 10.08.2026. https://www.socialcrawl.dev/blog/do-hashtags-work-on-tiktok
- **[W3]** Quso.ai, „Do Hashtags Actually Help?“, 29.06.2026. https://quso.ai/research/do-hashtags-help
- **[W4]** SocialPilot, TikTok Strategy Guide (1,5 Mio. Posts, Q1 2025), Pressemitteilung 24.06.2025. Nur Suchauszug. https://www.24-7pressrelease.com/press-release/524064/socialpilot-unveils-tiktok-strategy-guide-backed-by-15-million-posts
- **[W5]** Ratgeber 2026, nur Suchauszüge:
  - Sprout Social: https://sproutsocial.com/insights/tiktok-hashtags/
  - Hootsuite: https://blog.hootsuite.com/tiktok-algorithm/ und https://blog.hootsuite.com/tiktok-seo/
- **[G1]** hashtagradar.com, `#horror`-Seite („2026“: `#horror` 6,7 Mio. Posts, 228,5 Mrd.; verwandte Tags `#horrorstory`, `#horrortok`, `#creepy`). Nur Suchauszug, robots.txt sperrt Claude-Web. https://hashtagradar.com/hashtag/horror/
- **[G2]** tiktokhashtags.com, Seiten zu `#scary`, `#creepy`, `#animation`, `#3danimation`, `#storytime`, `#animatedstory`, `#scarystory`/`#scarystories`; Datenalter laut Seiten etwa 1–3 Jahre. Nur Suchauszug, robots.txt sperrt Claude-Web. https://tiktokhashtags.com/hashtag/creepy/ (Muster); best-hashtags.com für `#3danimation`.
- **[G3]** `#fyp`/`#foryou`-Summen aus mehreren Trackern und Statista (Suchauszug, widersprüchlich). https://www.statista.com/statistics/1299851
- **[G4]** `#horrortok`-Schätzungen:
  - Business Insider India, ohne Datum: https://businessinsider.in/thelife/news/these-13-horror-tiktoks-are-the-most-genuinely-terrifying-videos-on-the-app/amp_slidelist/78897673.cms
  - clippie.ai: https://clippie.ai/blog/monetizing-tiktok-horror-stories-ai
  - Hola, 31.10.2025: https://www.hola.com/al-dia/20251031864682/tiktok-historias-terror-masacre-halloween/
- **[R1]** Roblox Name and Logo Community Usage Guidelines, Liste der DON'Ts („implying official Roblox partnership or endorsement“). Direkt abgerufen: 403; Inhalt aus Suchauszug. https://en.help.roblox.com/hc/articles/115001708126
- **[L1b]** wie in `horror/docs/anhang-c-kosten-quellen.md` („solely for on-platform use“, abgerufen 14.11.2026).
- **[N]** Websuche nach „Hiding Night“ und „Mister Hundred“ (Spiel, Film, Buch, Creepypasta, TikTok-Horror): keine bekannten Treffer, nur der Roman „Hide“ von Kiersten White (2022), ein anderer Titel.
- **Eigene Unterlagen:**
  - `horror/docs/trends/bericht-2026-11-15.md`, `geschichten-regeln.md` (Regeln 7, 9, 10), `abgleich-2026-11-15.md`,
  - `horror/docs/PLAN.md`, `anhang-a-serienformat.md` (A6, A7, A9), `recherche-plan-v0.md`,
  - `horror/episoden/folge-01/serie.md`, `skript-teil1.txt`, `timing.json`, `horror/episoden/folge-02/skript-teil2.txt`, `horror/episoden/folge-03/entwurf.md` (Stand 16.11.2026),
  - `horror/docs/release/automatisierung.md` (Upload-Paket).
