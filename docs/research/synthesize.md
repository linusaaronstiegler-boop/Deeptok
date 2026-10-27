# DeepTok-Videofabrik: finaler Plan

Stand: 26.10.2026. Grundlage ist Vorschlag C (Hybrid). Dazu kommen die besten Teile aus A und B, und alle Pflichtkorrekturen der Gutachter sind eingearbeitet.

## 1. Kontext & Ziel

Die Probe „Opportunitätskosten“ ist didaktisch richtig aufgebaut: Fall → Vorhersage → Irrtum → Begriff → Regel. Schwach sind drei Dinge:
- **Ton:** Piper vertont Satz für Satz, die Pausen sind immer genau 0,22 oder 0,40 s, es gibt kein Mastering.
- **Bild:** 5 von 8 Szenen sind nur Text. Harte Schnitte auf leeres Navy, keine Kamera. Das wirkt wie Folien.
- **Bauweise:** etwa 25 min Agentenzeit und etwa 450 Zeilen Handcode pro Video.

**Ziel:** 10–20 Videos (30–90 s) pro Tag plus einige Hundert Evergreens, nachts automatisch gebaut. Bildgrammatik wie bei Simplicissimus, Didaktik wie bei Veritasium. Gemessen wird, wie viel Wissen nach 7 Tagen pro Minute Video hängen bleibt.

| | Probe | Neu |
|---|---|---|
| Bau | Code pro Video | JSON-Spec → feste Szenen-Module |
| Steuerung | interaktive Sitzung | Python-Skript + Claude-API |
| Stimme | Piper, satzweise | bezahlte Stimme, szenenweise, gemastert |
| Bild | Text auf Navy | eine Welt mit Kamera, Darsteller, Illustrationen |
| Abspielen | MP4 | live im Browser, MP4 nur zum Teilen |

**Drei Stufen:**
- **L** (Bibliothek, ca. 85 %)
- **L+** (eine Sonderszene, ca. 12 %)
- **H** (Hero, 1 pro Woche)

Was sich in Heroes bewährt, wird zu einem Modul der Bibliothek. So wird die billige Stufe besser, ohne teurer zu werden.

Ein Opus-Agent, der Sonnet-Agenten überwacht, ist nicht vorgesehen. Solche Multi-Agent-Systeme brauchen etwa 15-mal so viele Tokens. Die Steuerung übernimmt Python-Code. Opus entscheidet nur dort, wo Geschmack zählt.

## 2. Architektur auf einen Blick

```
EINGÄNGE  Serienpläne · Priming-Digest (nur Fach, Kernidee, Fragen) · News
          · FSRS-Vergessensdaten · Bewertungen
SLATE     Opus → Briefs: Stufe, Kanal, Identität, Serie/Teil, Bogen
PRO VIDEO Skript + Beats + Kamera-Vertrag (Opus, Batch)
          → Faktencheck ∥ Spec füllen (Sonnet, Batch) → Lint (Code + Haiku)
          → Stimme pro Szene → Mastering → Wortzeiten + Hör-Check
          → compose → check → DOM-Messung → Kritiker → ≤ 2 Reparaturen
AUSGABE   public/cards/<id>/ (index.html, voice.m4a, timing.json, spec.json)
          + Vorhersage im Video + 0–2 FSRS-Fragen → report.json → Preview-Branch
```

| Rolle | Modell, Effort | Modus |
|---|---|---|
| Orchestrator `factory/nightly.py` | – | Python |
| Starter: nur starten, committen | Sonnet 5.5 low | geplante Aufgabe |
| Serienplaner: 6–8 Teile, **ein** durchgehendes Beispiel, Irrtumsliste, Abrufziele → `topics/<kanal>/<serie>.yaml` | Opus 5.5 medium | 1× pro Serie |
| Chefredaktion (Slate) | Opus 5.5 medium | 1× pro Nacht |
| News-Recherche (≤ 5 Suchen) | Sonnet 5.5 low | Standard |
| Skript + Beats + Kamera-Vertrag | Opus 5.5 medium | Batch |
| Faktencheck, eigener Kontext | Sonnet 5.5 medium, Streitfälle Opus | Batch (News: Standard) |
| Spec-Füller (nur Parameter) | Sonnet 5.5 low | Batch |
| Lint, Aussprache | Code + Haiku 5.5 low | Standard |
| L+-Sonderszene | Sonnet 5.5 medium | Agent SDK |
| Kritiker | Sonnet 5.5 low | Standard |
| Hero-Regie, Beförderung | Opus 5.5 high | Agent SDK über API |

Fable 5.1 wird nicht eingesetzt. Zwei Begriffe:
- **Batch** ist ein Stapelauftrag: halber Preis, das Ergebnis kommt meist in unter einer Stunde.
- **Cache** heißt: Prompt-Teile, die sich wiederholen, kosten ab dem zweiten Mal nur etwa ein Zehntel.

**Die Nacht läuft in Stücken von höchstens 2 h**, weil Hintergrundbefehle in Cloud-Sitzungen nach 2 h enden:

| Slot | Arbeit |
|---|---|
| 22:07 | Slate, Skript-Batch abschicken |
| 00:07 | Faktencheck + Spec, CPU-Spur, Kritiker |
| 02:07 | Reparaturen, Veröffentlichen; Hero-Slot mit eigenem Budget |
| 04:15 | News nur mit Standard-Aufrufen, Stopp 05:50; was um 06:15 fehlt, wird eine Text-Briefingkarte mit Quellen |

So greifen die Slots ineinander:
- Jeder Slot ist eine eigene geplante Aufgabe und startet `nightly.py --resume`.
- Jede Stufe speichert ihr Ergebnis mit einem Inhalts-Hash. Deshalb macht ein Slot genau dort weiter, wo der vorige aufgehört hat.
- `factory/.lock` verhindert, dass sich zwei Läufe überschneiden.
- Ein CPU-Semaphor erlaubt höchstens 2 Chrome-Jobs (`--workers 2`) und faster-whisper mit `cpu_threads=2`.

## 3. Stil: Richtung Veritasium und Simplicissimus

**Identitäten.** Der jetzige Look (Navy-Leere, Creme-Papier mit Serifen) steht zweimal auf der BANNED-Liste von HyperFrames. Palette und Schriften bleiben. Jede Identität folgt den Regeln eines Druckmediums, festgehalten als Zahlen in einer `DESIGN.md`.

| Identität | Kanäle | Regeln | ab |
|---|---|---|---|
| Editorial | Rhetorik, Philosophie, Bücher, Disziplin, Style | Zeitung: Creme-Papier, Navy-Tinte, Gold als zweite Druckfarbe, Typo als Objekt | v1 |
| Diagramm | Naturwiss., Mathe, Schul-Transfer | Plotter: Navy-Grund, 6×6-Ankerraster; Gold = gesuchte Größe, Creme = gegeben, Rot = Irrtum; kein Schnitt in einer Herleitung | v1 |
| Atlas | Geopolitik & Geschichte, Wirtschaft | Gedruckter Atlas: 3 % Korn, Schlagzeilen-Ausschnitte mit Quelle + Datum, Kartenflüge | nach 16.11. |

**Bühne und Darsteller.** In HyperFrames hat jede Szene ihre eigene, pausierte Timeline. GSAP Flip misst das DOM, während es läuft. Deshalb kann es kein Element über eine Szenengrenze tragen, wenn der Renderer beliebige Frames ansteuert.

Die Lösung:
- Welt-Ebene (3 × 3 Bildschirme), Kamera und Darsteller liegen auf einer **durchgehenden Spur in der Wurzel-Komposition**.
- Die Positionen werden beim Bauen aus dem Slot-Raster berechnet.
- Szenen sagen nur: „Darsteller X geht bei Cue Z auf Slot Y.“

Zusammen mit dem Skript schreibt Opus einen **Kamera-Vertrag**:
- eine Welt und ein Kamerapfad;
- ein Darsteller, der seine Rolle wechselt (Geld-Chip → Balken → Karten-Token);
- 3–5 Übergangsarten, jede mit sichtbarer Ursache;
- höchstens ⅓ harte Schnitte.

| Kit-Konstante | Wert |
|---|---|
| Display | 9 % der Bildhöhe, −2 % Laufweite |
| Fließtext | ≥ 48 px, ≤ 7 Wörter pro Zeile |
| Szene | ≤ 19 Wörter |
| Halten nach Landung | ≥ 1,2 s |
| Kamera-Push | 2–4 % pro Beat |
| Bildwechsel | alle 2–4 s, nur mit Inhalt |
| Timing | auf dem Wort, das es nennt, hintere Szenenhälfte |
| Fläche | Inhalt y = 168–1330, Untertitel darunter |
| Eintritte | eigene Familie je Identität und Szenentyp |

Auf den Bildschirm kommen Objekte, Zahlen und Schlüsselwörter, nie der gesprochene Satz.

**Illustrationen.**
- **Hausbibliothek** (der größte Schritt Richtung Simplicissimus): Der RTX-PC erzeugt an einem Wochenende mit FLUX.2 [klein] 4B (Apache 2.0) 300–500 Requisiten, Figuren und Orte. Alle im festen Tuschestil, freigestellt und nach Substantiv getaggt. Jedes Modul hat ab v1 einen `visuals`-Slot, damit auch L-Szenen echte Dinge zeigen.
- **Weitere Quellen:**
  - Open Peeps (CC0) als Figuren-Rigs.
  - Karten aus Natural Earth über d3-geo; den Europa-Block bauen wir selbst.
  - Archivbilder von Wikimedia oder der Library of Congress als Duoton, mit Credit und Datum.
- **Regeln:**
  - Jedes Bild braucht ein `zeigt:` auf einen Satz, sonst wird es verworfen.
  - KI-Bilder tragen das Label „Illustration“ und zeigen nie echte Personen oder News-Belege.

**Ton.**
- Keine Musik, auch nicht in Idents oder Vorhersage-Pausen. In der Pause soll selbst gedacht werden (Moreno & Mayer 2000).
- Geräusche sind standardmäßig aus. Sie kommen erst nach einem A/B-Test, der keinen Verlust beim 7-Tage-Behalten zeigt.
- Mastering: 80-Hz-Hochpass, De-Esser, 2:1-Kompression, −16 LUFS, −1 dBTP.

**Inspirations-Werkzeuge.**
- **Referenz-Destillation (einmalig):** ffmpeg-Szenenerkennung auf 2–3 Sequenzen von Simplicissimus und Veritasium. Schnittlängen und Titel-Timing kommen als Zahlen in die `DESIGN.md`, keine Frames ins Repo.
- **CLI-Befehle:** `npx hyperframes snapshot --against ref.mp4` und `npx hyperframes capture <url> --json`.
- **Registry-Blöcke:** `count-up`, `before-after-wipe`, `marker-highlight`, `hw-callout-circle`, `chart-story`, `world-map`.
- **Installieren:** UXKIN (`design-md`, `no-ui-slop`) für die App-Oberfläche.
- **Weglassen:** Bright-Data design-mirror und die WebGPU-Shader-Blöcke.

## 4. Stimme

**Casting.**
- Am 27.10. prüfen, ob die Modelle existieren und was ihre Bedingungen sagen.
- Testtext ist ein ganzes 60-s-Skript mit Zahlen, Namen (Lewandowski, Barcelona) und Lehnwörtern.
- 2 Takes pro Stimme. Beide Brüder bewerten blind über einen Handy-Lautsprecher.
- Dazu werden Wortfehlerrate und Namens-Treffer automatisch gemessen.
- Volumen: Lean ca. 0,2 Mio., Ziel ca. 0,4 Mio. Zeichen pro Monat.

| Kandidat | Kosten | Haken | Linus richtet ein |
|---|---|---|---|
| ElevenLabs v4 Turbo (Johannes, Helmut, Christian Plasa); AA-Platz 1 | $40/1 Mio. Zeichen; Creator $22, Pro $99 | Apps für unter 18 nur mit schriftlicher Freigabe | Key, `ELEVENLABS_API_KEY`, Mail an ElevenLabs |
| Inworld TTS-2; Deutsch #2, Wort-Zeitstempel | $25/1 Mio. | Minderjährigen-Richtlinie ungeprüft | `INWORLD_API_KEY` |
| Cartesia Sonic 3.6; IPA-Wörterbuch | $5 Casting, $49/Monat | Emotions-Tags nur Englisch | `CARTESIA_API_KEY` |
| Azure Florian DragonHD; SSML | $22/1 Mio. | klanglich schwächer | `AZURE_SPEECH_KEY` + Region |

Was nicht in Frage kommt:
- Gemini-TTS fällt weg, weil die Bedingungen Nutzer unter 18 ausschließen.
- Chirp 3 HD bleibt nur dann Gratis-Basis, wenn die Google-Cloud-Bedingungen es erlauben. Das wird separat geprüft.
- Piper wird nicht mehr genutzt.

**Empfehlung:** Inworld TTS-2, wenn es höchstens 0,5 Punkte (auf einer 5er-Skala) hinter dem Sieger liegt. Sonst ElevenLabs v4 Turbo; für Inhalte des Bruders aber erst nach schriftlicher Freigabe. Rückfall: Azure.

**Regeln:**
- Pro Szene vertonen, mit `previous_text`.
- Wortzeiten kommen vom Anbieter, sonst von faster-whisper.
- Aussprache über ein Lexikon plus `Anzeige|Gesprochen`. Haiku schlägt neue Einträge aus dem ASR-Vergleich vor.
- Ein Sprecher pro Serie. Fällt der Anbieter aus, wechselt nur bei News die Stimme. Evergreens warten höchstens 48 h, danach kommt eine Quizkarte.
- Vor jeder Nacht das Zeichenbudget prüfen.
- A/B-Test: Dialog Schüler/Tutor mit einer zweiten Stimme (Muller 2008: d = 0,83), gemessen am 7-Tage-Behalten.

## 5. Szenen-Bibliothek + Video-Spec

Jeder Szenentyp ist ein Modul `(params, cues, stage) → DOM + GSAP-Timeline`. Dazu gehören ein Zod-Schema, Slots, Zeichengrenzen, zwei Demo-Specs und ein Referenz-Snapshot. Dasselbe Modul läuft live in der App. Beim Bauen wird es in HyperFrames-HTML kopiert, weil Laufzeit-Variablen versagten, wenn eine Szene doppelt eingebunden war.

| Version | Typen |
|---|---|
| v1 | hook-number, prediction-reveal, misconception-strike, fork-compare, plot (SVG) |
| v1.1 | map-route, timeline, term-definition, quote-card, briefing-card, archival-photo |
| v2 | process-steps, equation-build, character-beat, rhetoric-device |

**Fünf Bögen statt einer Formel.** Die Chefredaktion wählt einen Bogen; das Schema prüft die Reihenfolge der Beats.

| Bogen | Beat-Folge |
|---|---|
| Irrtum → Widerlegung | Irrtum → Vorhersage → Gegenbefund → „Das stimmt nicht, weil…“ → Modell → Transfer |
| Fall → Prinzip | Fall → Vorhersage → Auflösung → Regel → Transfer |
| Kausalkette | Lage → Vorhersage „was folgt?“ → Glieder → Folge heute |
| Gabelung | Entscheidung → Vorhersage → A/B mit Kosten → Kriterium |
| Technik-Drill (Rhetorik) | Beispiel → Vorhersage „welches Mittel?“ → Mechanik → zweites Beispiel |

Immer gilt: Die Vorhersage kommt vor der Auflösung. Für den Bruder zusätzlich: Beispiel vor Regel, und der Irrtum wird benannt und widerlegt.

```ts
type VideoSpec = {
  id: string; channel: string; profiles: ("linus"|"bruder")[];
  series: { id: string; part: number }; arc: Arc; voice: string; lib: string;
  facts: { id: string; claim: string; src: string; date: string }[];
  camera: { world: string; path: string[]; actor: { id: string; roles: string[] } };
  scenes: { type: SceneType; beat: string;
            narration: string;            // "{cue}" vor einem Wort = Zeitpunkt
            params: object;               // Zod-Schema des Typs
            moves?: { actor: string; slot: string; at: string }[];
            visuals?: { asset: string; zeigt: string }[];
            interaction?: "pause_for_answer" }[];
  retrieval: { q: string; options: string[]; answer: number }[];
};
```

```json
{"type":"fork-compare","beat":"befund","facts":["abl"],
 "narration":"Wer {keep}behält, verzichtet auf {lost}45 Millionen.",
 "moves":[{"actor":"geld","slot":"split-left","at":"lost"}],
 "params":{"left":{"label":"Behalten","value":"−45 Mio. €","tone":"loss"},
           "right":{"label":"Verkaufen","value":"+45 Mio. €"}}}
```

Das Modell schreibt nie Pixel oder Sekunden, nur Slot-Inhalte und Cue-Namen.

**L+-Sonderszene.**
- Der Brief enthält: Bildschirmtext wörtlich, Blickpunkt, Darsteller, Cue-Wörter und eine Verbotsliste.
- Grenzen: 6 Werkzeug-Runden, 40k Output-Tokens, 15 min. Werden sie überschritten, kommt der nächstpassende Bibliothekstyp.

**Beförderung zum Modul.** Eine Sonderszene wird Modul, wenn eine von zwei Bedingungen erfüllt ist:
- (a) Kritiker ≥ 0,85, keine negative Bewertung und mindestens 3 erwartete Themen; oder
- (b) derselbe L+-Bedarf taucht 3-mal pro Woche auf.

Opus baut das Modul über die API, mit zwei verschiedenen Demo-Specs; beide müssen die Tore bestehen. Jede Karte pinnt `lib@x.y`, also gehen alte Karten nie kaputt.

## 6. Qualitäts-Tore (billigste zuerst)

| Tor | Prüft |
|---|---|
| G0 Schema | Slot-Grenzen, Cues, Beat-Reihenfolge, Ablenker ähnlich lang |
| G1 Code | Sperrwörter (Lob, „natürlich“, „offensichtlich“, „Leichtsinnsfehler“, Mindset); Fakt mit Quelle + Datum; **jede Zahl im Bild steht in `facts[]`**; jedes Bild mit `zeigt:`; Vault-Namen, Mails, Noten blockiert |
| G2 Haiku | Didaktik |
| G3 Faktencheck | eigener Kontext; News mit offener Behauptung → Textkarte |
| G4 Hör-Check | Wortfehlerrate < 5 %, alle Namen richtig, −16 ± 1 LUFS, keine Stille > 1,2 s |
| G5 `check --json` | 0 Fehler |
| G6 DOM-Layout | ±150 ms am Cue, Lesezeit, y = 168–1330, Schrift ≥ 34 px |
| G7 DOM-Bewegung | Tempo im Lesefenster ≈ 0, Halten ≥ 1,2 s, gleichzeitige Tweens, wiederholte Eintritte, Darsteller überlebt Schnitt |
| G8 Kritiker | 6-Frame-Bogen + 2-s-Filmstreifen um jede Naht; Rubrik inkl. „Diashow?“ und „Schnitt verursacht?“; Notizen „t · wo · Problem → Änderung“ (P0/P1); Schwelle 0,8 |
| G9 bei Bibliotheks-Änderung | Referenz-Snapshots, WebKit-Test |

Scheitert ein Tor:
1. 2 Reparaturen mit dem genauen Befund.
2. Eine Eskalation zu Opus.
3. Danach kommt das Video nach `needs-human/`; der Slot bekommt so lange eine Quizkarte.

**Menschliche Freigaben:**
- Stimm-Casting: beide Brüder, blind.
- Neubau der Probe: Blindbewertung beider Brüder plus Vergleich des 7-Tage-Behaltens mit der alten Probe.
- Linus bewertet die ersten 20 Videos der Kalibriernächte. Daran wird die Schwelle von 0,8 eingestellt.
- Danach bewertet er jedes 10. Video über ein Menü mit Gründen.
- Stil-Blatt der Hausbibliothek.

## 7. Tempo & Kapazität

| | L | L+ | H |
|---|---|---|---|
| Modellzeit | 3–6 min + Batch-Wartezeit | +10–15 min | 60–120 min |
| CPU (60 s) | ca. 130 s | +30 s | 5–10 min |
| API-Kosten | ca. $0,20–0,30 | ca. $0,50 | $3–6 |

- **Container:** etwa 110 Videos in 4 h mit einer Spur, etwa 150 mit zwei. Die Grenzen setzen Batch-Wartezeit und Budget. Parallelisiert wird über Videos, nicht über Szenen: Fünf Szenen brauchten in einem Kontext 9 min, mit Sub-Agenten 21 min.
- **Live-Player:** `<hyperframes-player>` in einer exakt festgelegten Version, die mitgeliefert wird. Die Laufzeit kommt über `runtime-src`, GSAP und die woff2-Schriften liegen lokal. Das macht 0,4–0,7 MB pro Video statt 3,5–5,2 MB. Die Vorhersage stoppt bei `range-end`; die Antwort-Chips sind native Elemente der App.
- **iOS-Test auf echten Geräten:** Ton-Freigabe per Tipp, Drift über 90 s, Drosselung. Rückfall: ein eigener Player, der den Ton als Uhr nutzt; sonst MP4.
- **MP4 nur beim Teilen:** Qualität draft, `--workers 3`. (`auto` wählt hier nur 1 Worker: 104 s statt 57 s.)

## 8. Nutzung & Kosten

| Rolle pro L-Video (Schätzung) | Input | Output |
|---|---|---|
| Skript + Kamera-Vertrag, Opus Batch (ca. $0,05) | 12k (8k Cache) | 4k |
| Faktencheck, Sonnet | 10k | 1,5k |
| Spec-Füller, Sonnet | 15k (10k Cache) | 4k |
| Lint, Haiku | 6k | 0,8k |
| Kritiker, 2 Runden | 2 × 9k | 2 × 0,8k |

Preise pro Mio. Tokens (Input/Output): Opus 5.5 $4/$20, Sonnet 5.5 $2/$10, Haiku 5.5 $0,10/$0,50. Batch kostet die Hälfte.

| Modus | Umfang | API/Monat |
|---|---|---|
| **Lean (Standard)** | 6 L + 1 L+ pro Tag, 1 Hero/Woche, News als Textkarten | ca. $80–90 |
| Ziel | 12 L + 3 L+ pro Tag, 2 Heroes/Woche | ca. $180 |

- Den Ziel-Modus gibt es erst, wenn das Guthaben bestätigt und der Preis pro Video gemessen ist.
- Der Evergreen-Vorrat entsteht im Lean-Modus nebenbei: etwa 300 Videos in sechs Wochen.
- Die Stimme kostet extra: $5–99.

**Deckel:**
- $1,50 pro Video und $3,50 pro Nacht.
- Hero-Slot getrennt: $6 pro Woche.
- $95 pro Monat, dazu ein Limit in der Console.
- Die Zahl der Videos pro Nacht ergibt sich aus dem Budget; die Hochrechnung steht in `report.json`.

**API-Regeln:**
- Batch-Aufträge gehen ohne `fallbacks` raus, weil die Batches-API den Parameter ablehnt.
- Ablehnungen (`stop_reason:"refusal"`), Fehler und abgelaufene Aufträge werden als Standard-Aufruf neu geschickt. Für Opus und Sonnet dann mit `fallbacks:"default"` und dem Beta-Header `server-side-fallback-2026-07-01`.
- Haiku 5.5 hat keinen Server-Fallback. Dann gilt der Code-Lint, ergänzt um Sonnet.
- News laufen nie über Batch.

**Pro-Testwoche 6.–13.11. (unter 20 % Kontingent):**
- Die Fabrik läuft auf dem API-Guthaben von Max 5x ($100/Monat). Laut Doku gilt es nicht für Claude Code.
- Kontingent kosten nur die Starter-Sitzungen, realistisch 20–40k Tokens je Sitzung. Gemessen wird in den Kalibriernächten über claude.ai/settings/usage.
- Der Starter macht einen Bash-Aufruf, committet und liest nie Logs.
- Liegt der Verbrauch über etwa 1,5 % pro Nacht: Slots zusammenlegen oder den Start verlegen, entweder auf GitHub Actions (bei privatem Repo reichen die Freiminuten nicht) oder auf den RTX-PC.
- In dieser Woche gibt es keine Opus-Bausitzungen und keine Heroes.

**Entscheidung am 16.11.:** Max kostet $100 und enthält $100 Guthaben. Pro kostet $20 plus alle API-Kosten. Pro lohnt sich also nur unter etwa $80 API-Kosten pro Monat, das heißt höchstens im Lean-Modus.

**RTX-PC (optional, nie auf dem kritischen Pfad):**
- Er arbeitet über einen `jobs/`-Branch: Hausbibliothek, Hero-Stills, NVENC-MP4s, Notstimme (Chatterbox).
- Ist die API aus der Cloud nicht erreichbar, kann `nightly.py` dort unter WSL laufen.
- Fehlen um 03:30 Assets, nimmt der Hero die Bibliotheksszene.

## 9. Rollout in Phasen

| Phase | Datum | Inhalt |
|---|---|---|
| 0 Go/No-Go | Di 27.10. | Guthaben in der Console? Key als Cloud-Secret; `api.anthropic.com` und TTS-Hosts erreichbar? Stimmen und Bedingungen prüfen; Repo-Sichtbarkeit; PyAV-Absturz beheben (ffmpeg → float32) |
| 1 Fundament | 28.–30.10. | Zuerst Wurzel-Spur mit Slot-Raster; Player härten; Editorial- und Diagramm-`DESIGN.md`, BANNED-Liste, Referenz-Destillation; 5 v1-Typen; Casting-Takes |
| 2 Fabrik | 30.10.–1.11. | `nightly.py` mit Hashes, Sperre, Deckeln, Batch-Logik, 4 Slots; Tore G0–G8; drei Kalibriernächte à 5 Videos; Stimm-Entscheidung |
| 3 Abnahme | 2.–5.11. | Probe als Spec (Blindbewertung, 7-Tage-Vergleich ab 2.11.); L+; News als Textkarten; Transfer-Videos; Gerätetest. Letzte Bibliotheks-Änderung 2.11., Freeze 5.11. |
| 4 Testwoche | 6.–13.11. | Läuft ohne Eingriffe im Lean-Modus. 7./8.11. Hausbibliothek auf dem PC |
| 5 Ausbau | ab 14.11. | Opus-Review; 16.11. Max oder Pro; Atlas, Karten, erster Hero, erste Beförderung, Dialog-A/B |

**Nächste Sitzung:**
1. PyAV-Workaround einbauen, `--workers 3` setzen.
2. Netztest gegen API und TTS-Hosts.
3. Casting-Skript und `voice.py`-Adapter für die vier Anbieter.
4. Spike: Ein Darsteller überlebt zwei Szenen, geprüft im Player und in `snapshot`.
5. `docs/PLAN.md` und den Stand im Vault aktualisieren.

**Linus erledigt:**
- Console verknüpfen und das Guthaben prüfen.
- API-Keys als Cloud-Secrets hinterlegen.
- Mail an ElevenLabs schicken.
- Das Casting zusammen mit dem Bruder bewerten.
- Am 7./8.11. den PC laufen lassen.

## 10. Risiken & Gegenmaßnahmen

| Risiko | Gegenmaßnahme |
|---|---|
| Sieht weiter nach Folien aus | Wurzel-Spur, Kamera-Vertrag, Hausbibliothek, G7, „Diashow?“-Frage |
| Neue Formel | fünf Bögen, wechselnde Eintritte, kein Typ zweimal hintereinander |
| Kein Guthaben oder API unerreichbar | Go/No-Go, Lean, RTX-PC unter WSL; keine Claude-Code-Workflows (fressen Kontingent) |
| Nachtsitzung bricht ab | Slots ≤ 2 h, Hashes, Sperre, 06:15-Textkarte |
| Stimme fällt aus | Inworld/Azure, Budget-Check, 48-h-Grenze |
| iOS-Wiedergabe | Gerätetest, Ton-als-Uhr-Player, MP4 |
| Faktenfehler | `facts[]`-Pflicht, Prüfer in eigenem Kontext, Zahlenregel |
| Kosten steigen schleichend | Deckel, ≤ 2 Reparaturen, minimaler Starter |
| Wartungsschuld | L+ ≤ 12 %, Deckel, `lib`-Pin, Regressions-Snapshots |
| Persönliche Daten | Vault-Lint, Digest nur als Eingabe, `noindex` |

## 11. Quellen

- API-Guthaben: https://platform.claude.com/docs/en/about-claude/api-credits-for-subscribers
- Preise, Batch: https://platform.claude.com/docs/en/about-claude/pricing · https://platform.claude.com/docs/en/build-with-claude/batch-processing
- Multi-Agent-Kosten: https://www.anthropic.com/engineering/multi-agent-research-system
- Geplante Aufgaben: https://code.claude.com/docs/en/routines
- HyperFrames: https://hyperframes.heygen.com/prompting/capstone.md · https://hyperframes.heygen.com/prompting/motion.md · https://hyperframes.heygen.com/prompting/recreating-references.md · https://hyperframes.heygen.com/packages/player
- Templates statt freiem Code (ALGOGEN): https://arxiv.org/abs/2605.12159 · Code2Video: https://arxiv.org/abs/2510.01174 · Kritiker-Grenzen: https://arxiv.org/abs/2603.14724
- Muller et al. 2008: DOI 10.1111/j.1365-2729.2007.00248.x
- Moreno & Mayer 2000: https://tecfa.unige.ch/tecfa/teaching/methodo/Moreno_Mayer00.pdf
- TTS-Ranking: https://artificialanalysis.ai/text-to-speech/leaderboard
- ElevenLabs: https://elevenlabs.io/pricing/api · https://elevenlabs.io/use-policy
- Inworld: https://inworld.ai/pricing · https://inworld.ai/terms
- Cartesia: https://docs.cartesia.ai/llms-full.txt
- Azure: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/high-definition-voices
- Google: https://ai.google.dev/gemini-api/terms · https://cloud.google.com/terms/service-terms
- FLUX.2 klein: https://huggingface.co/black-forest-labs/FLUX.2-klein-4B
- Natural Earth: https://www.naturalearthdata.com/about/terms-of-use/
- UXKIN: https://github.com/uxkin/agent