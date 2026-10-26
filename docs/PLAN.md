# DeepTok — Plan (Fassung 2, 26.10.2026)

## Context

Linus will einen TikTok-Feed, der fesselt („2 Stunden dranhängen“) und dabei wirklich bildet: nur
„die Besten“ posten (Philosophen, Wissenschaft, Disziplin à la Goggins, Rhetorik/Charisma, Geopolitik,
Wirtschaft, Bücher), immer aktuell, Ziel: in jedem Gespräch gebildet und eloquent auftreten.
Zwei gleichwertige Profile (Linus, Bruder), sofort umschaltbar. Handy zuerst, iPad zweitens.

Einbettung in das bestehende System des Bruders (Klasse 10A, G9 NTG):
Abendlauf 21:00 schreibt Lernheft-Einträge + Digest mit „Vorlernen morgen“ (Priming je Fach: Kernidee,
2 Fragen, Verbindung) → Morgenlauf 05:00 macht daraus Audio + Seite → Morgenblock 05:15 Priming am Blatt.
**Auswendiglernen bleibt beim Blatt.** DeepTok setzt *nach* dem Priming an: vertiefen, in die echte Welt
übertragen, aktuelle Nachrichten, Abfrage. Beispiel WR-Priming 21.10. „Warum sind Opportunitätskosten
Kosten, obwohl man sie nie bezahlt?“ → DeepTok: echte Fälle (Transferentscheidungen im Fußball, Buffetts
Lesezeit, Staatshaushalt), dazu ein „Satz für die Stunde“ für die mündliche Mitarbeit.

Bestand: Refrakt (`linusaaronstiegler-boop/Refrakt`, Vanilla-JS-PWA, 407 Karten, 226 Quiz, 3 Bücher,
`formel.js`), Lernhefte (Artifact `BVZyJaT7M6tNZH1eYLSHG4`, `src/<Fach>.md` mit Kernidee, Irrtum,
Sofort-Check, Denkfragen), Digests (Drive-Ordner `117vwk4yRncUwAHQ23Pwu3pNZdigReMzx`),
Denk-Regeln im `Morgenplan-Override.md`. Repo `deeptok` ist leer, diese Session darf pushen.

## Leitidee (aus drei Recherchen, Quellen im Chatverlauf)

TikTok-Mechanik übernehmen, aber **auf Wissen-nach-7-Tagen pro Minute optimieren statt auf Verweildauer.**
- Dopamin feuert auf Überraschung → **erst tippen, dann sehen** (Pretesting g≈.5, auch bei falscher Antwort;
  Hyperkorrektur bei sicheren Fehlern; Neugier-Zustand verbessert Behalten, Gruber 2014).
- Abruf schlägt Wiederlesen (d≈.8 nach 1 Woche); **Antwort per Tipp wirkt so gut wie Freitext** (Yang 2021);
  **Begründung aus Menü wählen d=1,2, eintippen ≈0** — passt zur Rechtschreibschwäche.
- Größtes Risiko ist **Zerstückelung**, nicht Kürze (Wei 2026): Serien müssen zusammenhängen.
- Verführerische Details schaden (g≈−.33): jede Pointe muss den Kern tragen. Keine Musik unter Erklärungen.
- Kein Lob, keine Bestenliste, keine Mindset-Floskeln (Effekte ≈0); Rückmeldung nennt den Fehlertyp.

## Aufbau der App

**Zwei Bereiche, zwei Profile** (Avatar oben links = Sofortwechsel, Stand lokal je Profil).

1. **Heute** (Morgen-Briefing, ab Tag 1):
   - *Linus:* Weltlage 8–12 Karten (Geopolitik, Wirtschaft, Tech, Kultur) · Märkte-Karte (Zahlen,
     keine Empfehlung) · eine Gesprächs-Karte · Abfrage zu gestern.
   - *Bruder:* Transfer je Fach des Tages (1–3 Karten aus dem Priming, mit „Satz für die Stunde“) ·
     Weltlage 5–8 Karten auf seinem Niveau · Abfrage zu gestern.
2. **Für dich** (endloser Feed aus **Kanälen** mit eigenem Stil, keine Kopien echter Creator):
   Denken & Philosophie · Wissenschaft · Disziplin (bei Linus roh, beim Bruder Geschichten und Belege
   statt Floskeln) · Geopolitik & Geschichte · Wirtschaft & Märkte · Rhetorik & Charisma · Stil &
   Auftreten · Bücher · Schule-Transfer (nur Bruder). Wischen nach oben = nächstes Thema,
   zur Seite = tiefer in die Serie.

**Kartentypen:**
- Video-Karte: animierte Szene + Stimme + Karaoke-Untertitel, 30–90 s, mit eingebauter Vorhersage-Pause.
- Hook/Vorhersage: Frage zuerst, Tipp + Konfidenz.
- Erklär-Karte, ohne Stimme und selbst getaktet: Beispiel zuerst, dann die Regel.
- Irrtum-Karte: „Man denkt X. Falsch, weil Y.“
- Quizformen: Multiple Choice mit Konfidenz, Wahr/Falsch per Wisch, Warum-Menü, Vergleichen/Sortieren,
  Zeitleiste, Karten-Tap.
- Gesprächs-Karte „Wie würdest du antworten?“: drei Antworten, die beste wählen, dann das Warum.
- Redefigur an einer großen Rede · Wort des Tages · Zitat → Anwendung heute.
- Briefing-Karte: was, warum wichtig, was als Nächstes, Quelle mit Datum.
- **Satz fürs Gespräch** am Ende jeder Serie, landet im eigenen Spickzettel „Sammlung“.
- Episoden-Ende: Mischquiz und ein echter Haltepunkt.

## Feed-Algorithmus (client-seitig, ohne Server)

- **Kartenwert** = 0,4·Interesse + 0,4·Lernwert + 0,2·Neuheit.
  - Lernwert am höchsten bei vorhergesagt ~80 % Erfolg.
  - Interesse je Thema als gleitender Mittelwert (α 0,3).
  - Signale dafür: Verweildauer *relativ zur Lesezeit*, Tiefe-Wischer, Speichern, „an Bruder/Linus
    schicken“, Quizergebnis, Knöpfe „zu leicht / zu schwer / kenn ich / mehr / weniger“.
  - Wegwischen unter 1,5 s = negativ.
- **Mischung je 10 Karten:** 5 neu · 3 Abruf · 2 Erkundung (Thompson-Sampling).
  - Erkundung nie unter 15–20 %.
  - Nie zwei Karten desselben Unterthemas oder Formats hintereinander.
  - Höchstens 8 neue Karten pro Unterthema und Tag.
  - Gesehenes kommt nur als Quiz zurück.
- **Abruf:**
  - Erster Abruf 2–5 Karten später, zweiter nach 10–20 min.
  - Mini-Quiz alle 4–6 Karten, Mischblock alle 15–20 min.
  - Über die Tage plant **FSRS** (`ts-fsrs`): Zielquote 0,90, News 0,85, Stoff vor Schulaufgaben 0,92–0,95.
  - Nur Kernaussagen werden Abruf-Items: 0–2 je Karte.
  - Lastbremse: Sind viele Abrufe fällig, kommen weniger neue Items (Bruder ~20–30 neue Items/Tag).
- **Frust-Schutz:** Nach 2 Fehlern in Folge kommt eine leichtere Karte. Rückmeldung nennt den Fehlertyp.
- **Episoden à ~20 min:** Endet mit Mischquiz und Haltepunkt. 2 h = bis zu 6 Episoden, kurze Pause nach ~60 min.
- **Kaltstart:** Interessenwahl + ~30 ausgewogene Startkarten.

## Medien-Pipeline (kostenlos)

- **Video ohne MP4:** Szenen als JSON-Zeitleiste, abgespielt im Browser mit GSAP (komplett frei).
  - Das Audio ist die Uhr: Die Zeitleiste folgt `audio.currentTime`, Untertitel Wort für Wort.
  - ~0,3–0,4 MB pro Minute, offline-fähig, unterbrechbar für Fragen.
  - Eigener kleiner Player statt HyperFrames (v0.8, noch instabil), HyperFrames bleibt Option für MP4-Export.
- **Stimme:** Google Cloud TTS **Chirp 3 HD** (deutsch, 1 Mio. Zeichen/Monat gratis ≈ 30 min/Tag).
  - Satzweise erzeugen → exakte Satzzeiten, Wörter darin anteilig verteilt (keine schwere Alignment-Software).
  - Rückfall: Piper (offline).
  - ElevenLabs nicht als Basis (Guthaben war 21.–23.10. leer).
  - Stimme nur für Video-Karten und Briefings, Selbsttakt-Karten bleiben stumm (Modalitätseffekt dort schwach).
- **Bilder:** nur inhaltstragend (Diagramme, Karten, Zeitleisten, gemeinfreie historische Fotos), keine Deko.
- **Nachrichtenquellen:**
  - tagesschau-API, Dlf, DW, BBC, Guardian (Entwicklerschlüssel), GDELT.
  - Märkte: EZB/Frankfurter, CoinGecko, Twelve-Data-Connector.
  - Immer eigene Worte + Link + Datum. Kein Kopieren, privat, `noindex`.
- **Später optional (PC-GPU):** eigene Erzählerstimme (Chatterbox/Qwen3-TTS) und B-Roll (LTX-2/Wan 2.2) über eine Job-Warteschlange im Repo.

## Woher DeepTok weiß, was beim Bruder heute drankommt

Die Morgen-Redaktion liest jeden Morgen, in dieser Rangfolge:

1. **`06-Bruder/Morgenplan-Override.md`**: Steht dort `krank` oder `Pause`, gibt es keine Transfer-Karten, nur die Weltlage.
2. **Jüngster Tagesdigest**, Abschnitt „Vorlernen morgen“ (Drive `117vwk4yRncUwAHQ23Pwu3pNZdigReMzx`).
   - Der Abendlauf schreibt ihn schon *je Fach des nächsten Schultags* nach WebUntis-Stundenplan.
   - Inhalt je Fach: Eintrag, Kernidee der kommenden Stunde, 2 Priming-Fragen, Verbindung. Freitags gilt er für Montag.
   - Das ist die Hauptquelle: DeepTok vertieft genau das, was im Priming stand.
3. **Google Kalender des Tages**: Tests, Fälligkeiten, Ausfälle, Ferien, Wandertage. Ein Test morgen hebt den Stoff in der Abfrage nach vorn (Zielquote 0,92–0,95).
4. **Lernheft-Einträge** `src/<Fach>.md`: was in der letzten Stunde wirklich drankam, als Faktenbasis für die Transfer-Karten.
5. **Stundenplan als Rückfall** (`content/bruder/stundenplan.json`, aus WebUntis): nur wenn der Digest fehlt. Ändert sich der Stundenplan, wird diese Datei mit den beiden Lauf-Prompts zusammen nachgezogen.

Kein Schultag (Wochenende, Ferien): „Heute“ zeigt nur Weltlage und Abfrage.

## Video-Werkstatt (Claude baut die Videos selbst)

Ich schreibe die Szenen als Code (HTML/GSAP bzw. Manim), vertone sie und baue daraus die Video-Karten. Das ist dasselbe Prinzip wie Anthropics „Claude Motion“, das allerdings nur in Team- und Enterprise-Plänen verfügbar ist. Die nächtliche Redaktion erzeugt neue Videos automatisch.

**Skills, die installiert werden** (im Repo unter `.claude/`, damit auch jeder Nachtlauf sie hat):

| Skill | Wofür | Quelle |
|---|---|---|
| **HyperFrames** (Apache-2.0) | Hauptmotor: Erklärvideos 30–90 s im Hochformat aus HTML + GSAP. `<hyperframes-player>` spielt sie live in der App, MP4-Export auf Wunsch. | `heygen-com/hyperframes` (Plugin bzw. `npx hyperframes skills update`) |
| **GSAP** (offiziell, GreenSock) | Saubere Animationen in Szenen und App (Wischgefühl, Übergänge) | `greensock/gsap-skills` |
| **Remotion** (offiziell, Anthropic-Verzeichnis) | Karten-Animationen für Geopolitik (Routen, Marker, GeoJSON) und Untertitel. Für Privatpersonen frei. | `remotion-dev/skills` |
| **Manim** (3Blue1Brown-Engine, MIT) | Mathe- und Physik-Animationen (Funktionen, Vektoren, Logarithmus) | Python-Paket; Community-Skill ungeprüft, daher direkt die Bibliothek |
| **frontend-design** (Anthropic) | Hochwertige App-Oberfläche statt KI-Einheitslook | `anthropics/claude-plugins-official` |

Erreichbarkeit aus der Cloud ist geprüft: git-Klon von GitHub, npm (`hyperframes` 0.8.206) und jsDelivr funktionieren. `libcairo` für Manim ist vorhanden.

Ein **SessionStart-Hook** (Skill `session-start-hook`) installiert bei jedem Cloud-Start die Abhängigkeiten. So läuft auch die Redaktion um 04:15 ohne Handarbeit.

## Redaktion (Cloud-Routinen)

- **Morgen-Redaktion, täglich ~04:15** (Sonnet, ≤ 20 min): Ausgabe muss vor dem Morgenblock des Bruders fertig sein.
  1. Nachrichten holen.
  2. Briefings für beide Profile schreiben.
  3. Aus dem jüngsten Digest „Vorlernen morgen“ die Transfer-Karten für die heutigen Fächer bauen.
  4. TTS erzeugen.
  5. Validieren.
  6. `content/daily/<Datum>/` committen, pushen, Vercel deployt.
- **Kanal-Redaktion (Batches nach Budget):** Serien je Kanal schreiben, zweiter Agent prüft Fakten. Refrakt-Bücher und -Inhalte werden importiert.
- **Qualitätstor (Lehre aus dem Refrakt-Audit), Build bricht sonst ab:**
  - Zod-Schema für jede Karte.
  - Antwortposition zufällig, Distraktoren gleich lang.
  - Quelle + Datum bei Fakten und News.
  - Sperrliste: Lob, „natürlich“, „offensichtlich“, „Leichtsinnsfehler“, Mindset-Floskeln.
  - Beim Bruder: Beispiel vor Regel, Irrtum widerlegt, keine Rechtschreibwertung.
- **Datenschutz:** Keine Mails, Noten, Namen oder Vault-Inhalte in DeepTok, die Adresse ist öffentlich erreichbar.

## Technik

- PWA, **Vite + TypeScript ohne UI-Framework**.
  - Feed: CSS Scroll-Snap (native Wischphysik), Serien horizontal über Pointer-Events.
  - Bibliotheken: GSAP, `ts-fsrs`, IndexedDB (`idb-keyval`).
  - Eigener Service Worker mit Build-Hash wie in Refrakt, Audio mit Range-Requests.
- Inhalte als JSON-Packs in `content/` (evergreen, `daily/`), Index wird beim Öffnen geladen.
- Deploy: Vercel per Push, Preview-Branch vor `main`.
- Tests: Playwright, Chromium mit Handy- und iPad-Viewport. WebKit nur am PC oder echten Gerät.
- Geplante Struktur:
  - Code: `src/feed/`, `src/cards/`, `src/player/`, `src/ranker/`, `src/srs/`, `src/profile/`.
  - Inhalt und Pipeline: `content/`, `pipeline/` (news, tts, validate, import-refrakt), `test/`.
  - Doku: `CLAUDE.md`, `HANDOVER.md`, `ROADMAP.md`, `docs/REDAKTION.md` (Stilregeln je Profil und Kanal).
- Wiederverwenden:
  - Refrakt: `formel.js`, Inhalte, Build-Hash-Service-Worker. Lesezugriff per `add_repo` in Phase 1.
  - Lernheft-Format `src/<Fach>.md`.
  - Digest-Format „Vorlernen morgen“.
- Vault-Protokoll `07-Projekte/DeepTok/DeepTok-Stand.md`, je Sitzung ein Eintrag, neueste zuerst.

## Phasen

**Schritt A — Werkzeuge + Probevideo, dann zurück zu Linus** (vor allem anderen):
1. Repo-Grundgerüst anlegen: `CLAUDE.md`, `.claude/settings.json`.
2. Die fünf Skills installieren und den SessionStart-Hook einrichten. Committen, auf `claude/`-Branch pushen.
3. Ein Probevideo bauen, 45–60 s im Hochformat: „Opportunitätskosten: Warum Vereine ihren besten Stürmer verkaufen“.
   - HyperFrames, dazu eine kurze Manim-Sequenz.
   - Stimme vorläufig Piper (offline und gratis), später Chirp 3 HD.
4. Als MP4 rendern und als private Artifact-Seite zum Ansehen am Handy veröffentlichen.
5. **Stopp:** Linus bewertet Look, Tempo und Stimme. Erst danach geht es mit Phase 0 weiter.

0. **Klick-Dummy** (1 Sitzung):
   - Gerüst, Feed, Profilwechsel, Video-Player.
   - 5 Kartentypen: Video, Vorhersage, MC + Konfidenz, Warum-Menü, Satz fürs Gespräch.
   - ~40 handgebaute Karten:
     - je Profil ein echtes Briefing des Tages
     - WR-Transfer „Opportunitätskosten“ aus dem echten Priming
     - je eine Serie Philosophie, Rhetorik, Wissenschaft
   - Preview auf Vercel, 2–3 Tage Test durch beide.
   - Messlatte: freiwillig geöffnet? weitergewischt? Quiz am nächsten Tag gewusst?
1. **Engine:**
   - Alle Kartentypen, Ranker, FSRS, Serien, Episoden, Sammlung, Regler, Offline, iPad-Layout.
   - Tests, Refrakt-Import.
2. **Morgen-Redaktion** live: TTS, Validator. Erst Probenächte, dann scharf.
3. **Kanäle:** 8 Kanäle, ~1500 Karten Grundstock für dauerhafte 2-Stunden-Nutzung, Faktenprüfer.
4. **Sync & Lernschleife:**
   - Kleiner Gratis-Server (Cloudflare Worker + D1 oder Supabase): Geräteabgleich, gemeinsame „Duo-Serie“ (kooperativ statt Bestenliste).
   - Rückkanal: Die Redaktion schreibt mehr von dem, was nach 7 Tagen sitzt.
5. Optional: GPU-Stufe am PC, MP4-Export der besten Clips.

## Cloud vs. PC

Cloud reicht und ist besser für Nachtarbeit.
- Was hier geht: Push, Node 22, Chromium, ffmpeg, npm und Hugging Face erreichbar. Nachts laufen Routinen in frischen Sessions.
- PC nur für: Safari-Engine-Tests, optionale GPU-Stufe, In-place-Änderungen im Vault.

## Was Linus tun muss

1. `deeptok` einmal bei Vercel importieren.
2. Bis Phase 2: Google-Cloud-Konto mit Abrechnung für Chirp 3 HD.
   - Bleibt im Freikontingent, ist aber ein Vertrag, also deine Entscheidung.
   - Schlüssel kommt als Umgebungs-Secret.
3. Später: Guardian-Entwicklerschlüssel (gratis).

## Budget-Hinweis

Pro-Testwoche 06.–13.11. (≤ 20 % Wochenkontingent), Abo-Entscheid bis 15.11.
- Bau-Sitzungen (Phase 0–1) vor dem 06.11. oder nach dem 13.11. legen, sonst verfälschen sie den Test.
- Nachtläufe auf Sonnet, Kanal-Batches nur nach Budget.

## Verifikation

Je Phase:
- `npm run build` + Validator grün.
- Playwright: Feed wischen, Vorhersage → Auflösung, Quiz falsch → kommt nach 2–5 Karten wieder, Profilwechsel behält Stände, offline neu laden, Video-Player synchron (Untertitel-Index folgt `currentTime`), Handy 390×844 und iPad 1180×820.
- Preview-Deploy prüfen, dann `main`.
- Morgen-Redaktion: drei Probenächte, jede Ausgabe gegen Schema, Quellenpflicht und Sperrliste geprüft, Laufzeit < 20 min.
- Phase 0 zusätzlich: echter Test beim Bruder und bei Linus.
