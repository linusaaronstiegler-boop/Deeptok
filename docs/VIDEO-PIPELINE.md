# DeepTok-Videofabrik: finaler Plan

Stand: 27.10.2026. Grundlage ist Vorschlag C (Hybrid). Dazu kommen die besten Teile aus A und B, und alle Pflichtkorrekturen der Gutachter sind eingearbeitet.

## 1. Kontext & Ziel

Die Probe „Opportunitätskosten“ ist didaktisch richtig aufgebaut: Fall → Vorhersage → Irrtum → Begriff → Regel. Schwach sind drei Dinge:
- **Ton:** Piper vertont Satz für Satz, die Pausen sind immer genau 0,22 oder 0,40 s, es gibt kein Mastering.
- **Bild:** 5 von 8 Szenen sind nur Text. Harte Schnitte auf leeres Navy, keine Kamera. Das wirkt wie Folien.
- **Bauweise:** etwa 25 min Agentenzeit und etwa 450 Zeilen Handcode pro Video.

**Ziel:** Videos (30–90 s), nachts automatisch gebaut. Bildgrammatik wie bei Simplicissimus, Didaktik wie bei Veritasium. Gemessen wird, wie viel Wissen nach 7 Tagen pro Minute Video hängen bleibt. Das Max-Guthaben allein trägt 5–6 Videos pro Tag, davon 3 Evergreens; 10–20 pro Tag brauchen ca. $150 Zusatzguthaben im Monat oder Max 20x. Messbar wird das Ziel erst mit App und Rückkanal (Phase 2).

| | Probe | Neu |
|---|---|---|
| Bau | Code pro Video | JSON-Spec → feste Szenen-Module |
| Steuerung | interaktive Sitzung | Python auf GitHub Actions + Claude-API |
| Stimme | Piper, satzweise | bezahlte Stimme, Skript am Stück, gemastert |
| Bild | Text auf Navy | Karten, Archivbilder, Darsteller; ab v1.1 Welt mit Kamera |
| Abspielen | MP4 | live im Browser, Teilen per Link |

**Drei Stufen:**
- **L** (Bibliothek, Standard)
- **L+** (eine Sonderszene, ab 14.11., höchstens 2 pro Woche)
- **H** (Hero, 1 pro Monat, $30–60 Zusatzbudget): Forschung für neue Module, kein Feed-Format

Was sich in Heroes bewährt, wird zu einem Modul der Bibliothek. So wird die billige Stufe besser, ohne teurer zu werden.

Ein Opus-Agent, der Sonnet-Agenten überwacht, ist nicht vorgesehen: Multi-Agent ≈ 15× Chat-Tokens, ≈ 4× ein Einzelagent (Anthropic 2025). Die Steuerung übernimmt Python-Code. Opus entscheidet nur dort, wo Geschmack zählt.

## 2. Architektur auf einen Blick

```
EINGÄNGE  Serienpläne + Faktenblätter · Priming-Digest (privat) · News
          · ab Rückkanal: Antworten, Konfidenz, Bewertungen
SLATE     Opus → Briefs: Stufe, Kanal, Identität, Niveau, Serie/Teil, Bogen
PRO VIDEO Skript + Beats (Opus, Batch) → Skript-Kritik → 1 Überarbeitung
          → Faktencheck ∥ Spec füllen (Sonnet, Batch) → Lint
          → Stimme am Stück → Mastering → Wortzeiten + Hör-Check
          → compose → check → DOM-Messung → Kritiker → ≤ 2 Reparaturen
AUSGABE   public/cards/<id>/ (index.html, voice.m4a, timing.json, spec.json)
          + Vorhersage + Abruffragen → report.json → Preview-Branch
```

| Rolle | Modell, Effort | Modus |
|---|---|---|
| Orchestrator `factory/nightly.py` | – | Python auf GitHub Actions |
| Serienplaner: 6–8 Teile, **ein** durchgehendes Beispiel, Irrtumsliste, Faktenblatt mit geprüften Quellen | Opus 5.5 medium + Websuche | 1× pro Serie |
| Chefredaktion (Slate) | Opus 5.5 medium | 1× pro Nacht |
| News-Recherche (≤ 5 Suchen) | Sonnet 5.5 low | Standard |
| Skript + Beats, nur mit Fakt-IDs | Opus 5.5 medium | Batch |
| Skript-Kritik, eigener Kontext | Sonnet 5.5 medium | Standard |
| Faktencheck mit `web_fetch` | Sonnet 5.5 medium, Streitfälle Opus | Batch (News: Standard) |
| Spec-Füller (nur Parameter) | Sonnet 5.5 low | Batch |
| Lint, Aussprache, Didaktik | Code + Haiku 5.5 low (Bruder: Sonnet medium) | Standard |
| L+-Sonderszene | Sonnet 5.5 medium | Agent SDK |
| Kritiker | Sonnet 5.5 low | Standard |
| Hero-Regie, Beförderung | Opus 5.5 high | Agent SDK über API |

Fable 5.1 wird nicht eingesetzt. Zwei Begriffe:
- **Batch** ist ein Stapelauftrag: halber Preis, Ergebnis meist in unter einer Stunde, schlimmstenfalls nach 24 h.
- **Cache** heißt: Wiederholte Prompt-Teile kosten beim Lesen 0,05× (Opus) bzw. 0,1× (Sonnet) des Input-Preises.

**Die Nacht läuft auf GitHub Actions**, denn in Claude-Code-Sitzungen enden Befehle nach höchstens 10 min, Hintergrund-Jobs 30 min später. Das Repo ist öffentlich, Standard-Runner sind also kostenlos (Jobs bis 6 h) und kosten kein Claude-Kontingent.

| Workflow | Arbeit |
|---|---|
| `nacht.yml`, 22:07 | Slate, Skript-Batch (Frist 23:45), Skript-Kritik, Faktencheck + Spec (Frist 01:30), CPU-Spur, Kritiker, Reparaturen, Veröffentlichen; Ende spätestens 04:00 |
| `news.yml`, 04:15 | News nur mit Standard-Aufrufen, Stopp 05:50; was um 06:15 fehlt, wird eine Text-Briefingkarte mit Quellen |

- `concurrency: fabrik` verhindert überlappende Läufe. Nach jeder Stufe pusht `nightly.py` `factory/state/<datum>.json` (Batch-IDs, Hashes) auf den Branch `factory-state`; jeder Lauf checkt ihn aus und setzt mit `--resume` dort an.
- Ein Batch, der zur Frist nicht fertig ist, geht als Standard-Aufruf neu raus. Stufen mit Batch-Latenz über 60 min (90. Perzentil) verzichten auf Batch.
- Höchstens 2 Chrome-Jobs, faster-whisper mit `cpu_threads=2`. `actions/cache` hält venv, npm und Whisper-Modell; Piper und Manim entfallen.

**Serien im Feed:** höchstens 2–3 aktive pro Profil, eine endet vor der nächsten; Teil n+1 erst nach Teil n, eröffnet mit einer Abruffrage zum vorigen. Transfer-Videos bilden je Fach eine Serie nach LehrplanPLUS (Jgst. 10); der Digest wählt den nächsten passenden Teil.

**Persönliche Daten:** Die Abend-Routine schreibt den Digest (ohne Namen) in den privaten Speicher (§7), wo auch Antworten und Bewertungen liegen. `nightly.py` liest sie per Token und committet sie nie ins öffentliche Repo.

## 3. Stil: Richtung Veritasium und Simplicissimus

**Identitäten.** Navy-Leere und Creme-Papier mit Serifen stehen auf der BANNED-Liste von HyperFrames. Palette und Schriften bleiben; jede `DESIGN.md` legt messbare Merkmale fest, und was in Renders trotzdem nach Standard aussieht, kommt auf BANNED.

| Identität | Kanäle | Messbare Regeln | ab |
|---|---|---|---|
| Editorial | Rhetorik, Philosophie, Bücher, Style, Disziplin (nur Linus) | Spaltenraster mit 2-px-Haarlinien, Rasterpunkte, 2–3 px Passer-Versatz, Schlagzeilen-Ausschnitte; keine kursiven Akzentwörter, nichts zentriert Schwebendes | v1 |
| Diagramm | Naturwiss., Mathe, Schul-Transfer, Wirtschaftsmodelle | sichtbares Rasterpapier (6×6-Anker), Striche zeichnen sich, alles an Achse oder Raster verankert; kein Schnitt in einer Herleitung | v1 |
| Atlas | Geopolitik & Geschichte, Wirtschaftslage | 3 % Korn, Schlagzeilen mit Quelle + Datum, Kartenrouten, Duoton-Archivfotos | minimal bis 4.11. |

Farben gelten überall gleich: Gold = gesuchte Größe, Creme = gegeben, Rot = Irrtum/Verlust.

**Bühne und Darsteller (ab v1.1).** Szenen-Timelines erreichen nichts außerhalb ihrer Datei. Ein Spike vergleicht eine durchgehende Bühnen-Sub-Komposition (Welt, Kamera, Darsteller) mit einer Wurzel-Spur, in `check`, `snapshot --review` und im Player. Danach schreibt Opus einen **Kamera-Vertrag**: eine Welt, ein Kamerapfad, ein Darsteller, der die Form nur wechselt, solange er dasselbe bedeutet; höchstens ⅓ harte Schnitte; HUD-Text bleibt fest.

| Kit-Konstante | Wert |
|---|---|
| Display | 9 % der Bildhöhe, −2 % Laufweite |
| Fließtext | ≥ 48 px, ≤ 7 Wörter pro Zeile; Credits ≥ 34 px |
| Szene | ≤ 19 Wörter |
| Halten nach Landung | ≥ 1,2 s; komplexe Diagramme 6–8 s |
| Kamera | steht im Lesefenster |
| Bildwechsel | nur bei neu genanntem Gegenstand |
| Übergänge | Zoom-in = Detail, Morph = dasselbe verwandelt, Schnitt = neues Thema |
| Timing | Schlüsselwort spät im Satz, Bild genau auf dem Wort |
| Fläche | Inhalt y = 168–1330; Untertitel darunter, bei Ton nur Schlüsselwörter |
| Eintritte | eigene Familie je Identität und Szenentyp |

Auf den Bildschirm kommen Objekte, Zahlen und Schlüsselwörter, nie der gesprochene Satz.

**Illustrationen.**
- **Starter-Assets bis 2.11.:** 40–60 Stück (Recraft, ca. $0,08 je Bild, oder RTX-PC), damit die `visuals`-Slots in der Kalibrierung gefüllt sind.
- **Hausbibliothek ab 14.11.:** 300–500 Motive mit FLUX.2 [klein] 4B (Apache 2.0) auf dem RTX-PC. Setup vorher testen, Stil über Referenzbilder fixieren, Stil-Blatt mit 20 Bildern freigeben, Ablage in eigenem Asset-Repo.
- **Weitere Quellen:** Open Peeps (CC0), Natural Earth über d3-geo, Wikimedia (mit User-Agent) und Library of Congress als Duoton mit Credit und Datum.
- **Entfern-Test** statt `zeigt:`: Jede Zahl und jedes Bild braucht einen späteren Kausalschritt oder eine Abruffrage; Bilder zeigen Beziehung, Menge, Ort, Abfolge oder Zustand. Hook-Zahlen kommen aus der Kausalkette, nie aus Trivia. KI-Bilder tragen das Label „Illustration“ und zeigen nie echte Personen oder News-Belege.

**Ton.**
- Keine Musik, auch nicht in Pausen; dort soll selbst gedacht werden (Moreno & Mayer 2000). Mit Linus klären, was er mit „Ton“ meinte, und offen sagen: Beide Vorbilder haben Musik, DeepTok nicht. Signal-Geräusche nur auf sichtbaren Ereignissen ohne Sprechtext.
- Mastering: 80-Hz-Hochpass, De-Esser, 2:1-Kompression, −16 LUFS, −1 dBTP; vorher am Handylautsprecher gegen das rohe Signal hören.

**Inspirations-Werkzeuge.**
- **Referenz-Destillation (einmalig):** Linus liefert 2–3 Clips von Simplicissimus und Veritasium; ffmpeg misst Schnittlängen und Titel-Timing. Nur die Zahlen kommen in die `DESIGN.md`, die Clips werden gelöscht.
- **Nutzen:** `npx hyperframes snapshot --against ref.mp4`, `npx hyperframes capture <url> --json`; Registry-Blöcke `count-up`, `before-after-wipe`, `marker-highlight`, `hw-callout-circle`, `chart-story`, `world-map`; UXKIN (`design-md`, `no-ui-slop`) für die App.
- **Weglassen:** Bright-Data design-mirror, WebGPU-Shader.

## 4. Stimme

**Casting.**
- 27.10.: Modelle und Bedingungen prüfen, auch Inworlds Regeln für Minderjährige; Mail an ElevenLabs.
- Test: Hook, Vorhersagefrage, Widerlegung („nicht X, sondern Y“) und ein ganzes 60-s-Skript mit Zahlen, Namen und Lehnwörtern. Paarweise Zwangswahl, blind, beide Brüder, Handy-Lautsprecher; Wortfehlerrate und Namens-Treffer automatisch.
- Volumen: Lean ca. 0,26 Mio. Zeichen pro Monat (inkl. 1,3× Puffer für Neuvertonung), Ziel ca. 0,5 Mio.

| Kandidat | Kosten | Haken | Linus richtet ein |
|---|---|---|---|
| ElevenLabs v4 Turbo, Standard- oder eigene Stimme; AA-Platz 1 | $40/1 Mio. Zeichen; Creator $22 (275k, knapp), Pro $99 | unter 18 nur mit schriftlicher Freigabe | `ELEVENLABS_API_KEY`, Mail |
| Inworld TTS-2; Deutsch #2, Wort-Zeitstempel | $25/1 Mio. | Minderjährigen-Richtlinie ungeprüft | `INWORLD_API_KEY` |
| Cartesia Sonic 3.6; IPA-Wörterbuch | $5 Casting, $49/Monat | Emotions-Tags nur Englisch | `CARTESIA_API_KEY` |
| Azure Florian DragonHD; SSML | $22/1 Mio. | klanglich schwächer | `AZURE_SPEECH_KEY` + Region |

Gemini-TTS fällt weg, weil die Bedingungen Nutzer unter 18 ausschließen; Piper wird nicht mehr genutzt. Chirp 3 HD bleibt nur Gratis-Basis, wenn die Google-Cloud-Bedingungen es erlauben; das wird separat geprüft.

**Entscheidung am 1.11.:** die bestbewertete Stimme, die heute für **beide** Profile nutzbar ist; ohne Freigabe für den Bruder scheidet ein Anbieter aus. Kosten entscheiden nur, wenn Linus „gleich gut“ sagt. Keine getrennten Stimmen pro Profil.

**Regeln:**
- Ganzes Skript in einem Request, sonst 2–3 Absätze mit Nachbartext; Szenen an den Wortzeiten schneiden. Pausen kommen aus der Stimme; Code setzt nur Vorhersage-Stopp und deklarierte Denkpausen (1,5–2,5 s).
- Markup `*betont*`, `/` (Pause), `?↑` (Frage), je Anbieter übersetzt. Skripte fürs Sprechen: kurze Hauptsätze, Schlüsselwort am Satzende.
- Wortzeiten vom Anbieter, sonst faster-whisper. Aussprache über Lexikon plus `Anzeige|Gesprochen`; Haiku schlägt Einträge vor.
- Modell, Stimm-ID und Einstellungen gepinnt in `voices/<id>.json`, Restzeichen vor jeder Nacht prüfen. Ein Sprecher pro Serie; fällt der Anbieter aus, wechselt nur bei News die Stimme, Evergreens warten höchstens 48 h.
- Adapter nehmen den Key aus der Umgebung (Actions, PC) oder als Proxy-Platzhalter im passenden Header (Cloud-Sitzung).

## 5. Szenen-Bibliothek + Video-Spec

Jeder Szenentyp ist ein Modul `(params, cues, stage) → DOM + GSAP-Timeline` mit Zod-Schema, Slots, Zeichengrenzen, zwei Demo-Specs und Referenz-Snapshot. Beim Bauen wird es in HyperFrames-HTML kopiert, weil Laufzeit-Variablen bei doppelt eingebundenen Szenen versagten; die App spielt nur dieses HTML.

| Version | Typen |
|---|---|
| v1-Kern (aus dem Goldstandard) | prediction-reveal, fork-compare, map-route, archival-photo, actor-beat |
| v1-Rest (bis 4.11., sonst ab 14.11.) | hook-number, misconception-strike, plot, quote-card, rhetoric-device, headline-cutout |
| v1.1 | Bühne mit Kamera, timeline, term-definition, briefing-card |
| v2 | process-steps, equation-build, character-beat |

Vortragstechnik zeigen lizenzierte Redeausschnitte mit Quelle, nicht die TTS-Stimme.

**Fünf Bögen statt einer Formel.** Die Chefredaktion wählt einen Bogen; das Schema prüft die Reihenfolge der Beats.

| Bogen | Beat-Folge |
|---|---|
| Irrtum → Widerlegung | Frage/Vorhersage → „Naheliegend ist X“ → Gegenbefund → „Das stimmt nicht, weil…“ → Modell → Transfer |
| Fall → Prinzip | kurzer Fall mit Vorhersage → Auflösung → Regel → Transfer |
| Kausalkette | Lage mit Frage „was folgt?“ → Glieder → Folge heute |
| Gabelung | Entscheidung als Frage → A/B mit Kosten → Kriterium |
| Technik-Drill (Rhetorik) | Beispiel mit Frage „welches Mittel?“ → Mechanik → zweites Beispiel |

Immer gilt:
- Frage oder Vorhersage in den ersten 8 s, der Irrtum der Serie als eine Option; Auflösung erst nach der Pause, dann ein Konfidenz-Tipp.
- „Die meisten denken …“ nur mit Quelle, sonst „Naheliegend ist: …“. Quelle und Datum stehen in einer Credit-Zeile oder im Info-Blatt der Karte.
- Ein Zielniveau pro Video. Bruder (LehrplanPLUS Jgst. 10): Beispiel vor Regel, Irrtum benennen und widerlegen. Linus: Vertiefung und ein „Satz fürs Gespräch“ am Ende.

```ts
type VideoSpec = {
  id: string; channel: string; level: "bruder"|"linus"|"beide";
  series: { id: string; part: number }; arc: Arc; voice: string;
  lib: string;                          // pinnt Module, Player, Laufzeit, GSAP
  facts: { id: string; claim: string; src: string; date: string; quote: string }[];
  camera?: { world: string; path: string[]; actor: string };  // ab v1.1
  scenes: { type: SceneType; beat: string;
            narration: string;            // "{cue}" vor einem Wort = Zeitpunkt
            params: object;               // Zod-Schema des Typs
            facts?: string[];
            moves?: { actor: string; slot: string; at: string }[];
            visuals?: { asset: string; traegt: string }[];
            hold?: number;
            interaction?: "pause_for_answer" }[];
  retrieval: { q: string; kind: "fakt"|"transfer"; options: string[]; answer: number }[];
  probe: { q: string; options: string[]; answer: number }[];  // nie geübt, nur 7-Tage-Messung
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

**L+-Sonderszene (ab 14.11.).**
- Der Brief enthält: Bildschirmtext wörtlich, Blickpunkt, Darsteller, Cue-Wörter und eine Verbotsliste.
- Grenzen: 6 Werkzeug-Runden, 40k Output-Tokens, 15 min; sonst kommt der nächstpassende Bibliothekstyp.
- Das Agent SDK startet mit minimalem env (`ANTHROPIC_API_KEY`, `PATH`, `HOME`, kein `CLAUDE_CODE_*`).

**Beförderung zum Modul**, wenn (a) der Kritiker keine P0/P1 findet, keine negative Bewertung vorliegt und ≥ 3 Themen sie brauchen, oder (b) derselbe L+-Bedarf 3-mal pro Woche auftaucht. Opus baut das Modul über die API mit zwei Demo-Specs, die beide die Tore bestehen. Jede Karte pinnt `lib@x.y`, also gehen alte Karten nie kaputt.

## 6. Qualitäts-Tore (billigste zuerst)

| Tor | Prüft |
|---|---|
| G0 Schema | Slot-Grenzen, Cues, Beat-Reihenfolge, Frage ≤ 8 s, Ablenker ähnlich lang, ≥ 1 Transferfrage, ≥ 50 % der Zeit Bild statt Text, keine gleiche Typfolge am selben Tag |
| G1 Code | Sperrwörter in Sprechtext und App-Texten (Lob, „natürlich“, „offensichtlich“, „einfach“, „Leichtsinnsfehler“, Mindset u. a.); **jede Zahl in Bild und Ton steht normalisiert in `facts[]`** (Mio. = Millionen); Fakt mit Quelle, Datum, Zitat; keine Antwort vor `pause_for_answer`; keine Eingabedatei gestaged; Vault-Namen, Mails, Noten blockiert |
| Skript-Kritik | Irrtum echt und belegt, ein durchgehendes Beispiel, Beispiel vor Regel, jeder Satz trägt die Kernidee, gut sprechbar → eine Überarbeitung |
| G2 Didaktik | Entfern-Test, Motivationsfloskeln |
| G3 Faktencheck | `web_fetch` auf jede `src` (`max_content_tokens` ≈ 8k); fehlt die Behauptung → unbelegt; News mit offener Behauptung → Textkarte |
| G4 Hör-Check | Wortfehlerrate nach Normalisierung (num2words, Lexikon), Schwelle aus der Kalibrierung; Namen per large-v3-turbo oder Parakeet, Fehler nur bei Widerspruch zum Anbieter-Alignment; −16 ± 1 LUFS; ≥ 44,1 kHz, ≥ 96 kbps; Stille > 1,2 s nur in deklarierten Pausen; Sprechtempo 2,0–2,6 Wörter/s, Tonhöhe nicht flach |
| G5 `check --json` | 0 Fehler |
| G6 DOM-Layout | ±150 ms am Cue, Lesezeit, y = 168–1330, Schriftgrößen wie im Kit |
| G7 DOM-Bewegung (ab 14.11.) | Tempo im Lesefenster ≈ 0, Halten ≥ 1,2 s, gleichzeitige Tweens, wiederholte Eintritte, Darsteller überlebt Schnitt |
| G8 Kritiker | Beat-Blatt + ≤ 3 Nahtstreifen (540 px) + Messwerte; Ja/Nein-Fragen: BANNED-Treffer? Entfern-Test? Schnitt mit Ursache? Diashow?; Notizen „t · wo · Problem → Änderung“ |
| G9 bei Bibliotheks-Änderung | Referenz-Snapshots, WebKit-Test |

Scheitert ein Tor:
1. 2 Reparaturen mit dem genauen Befund (Standard-Aufrufe).
2. Eine Eskalation zu Opus.
3. Danach kommt die Spec nach `needs-human/`; der Slot bekommt so lange eine Quizkarte.

**Menschliche Freigaben:**
- **Goldstandard:** Beide Brüder geben der neu gebauten Probe ≥ 4/5, Linus nennt sie „klar besser“; blind urteilt nur der Bruder. Dazu `snapshot --against` gegen 2–3 Referenzsequenzen. Erst danach werden Module daraus gezogen.
- Stimm-Casting: beide Brüder, blind.
- Linus bewertet alle 21 Kalibriervideos; daran werden G4 und G8 eingestellt. Danach jedes 10. Video über ein Menü mit Gründen, auch zur Stimme.

Bei n = 2 sind Vergleiche qualitativ, zumal beide die alte Probe kennen: Blind-Präferenz plus 7-Tage-Quiz an frischen, gematchten Themenpaaren. Gemessen wird nur innerhalb der Person auf Item-Ebene (≥ 20 Items pro Bedingung, Regel vorab notiert); sonst entscheiden Literatur und Präferenz, auch beim Dialog-Test (Muller 2008: d = 0,83).

## 7. Tempo, Kapazität & App

| | L | L+ | H |
|---|---|---|---|
| Modellzeit | 4–8 min + Batch-Wartezeit | +10–15 min | Stunden |
| CPU (60 s) | ca. 130 s | +30 s | 5–10 min |
| API-Kosten | ca. $0,40–0,50 | ca. $0,80 | $30–60 |

- **Kapazität:** Grenzen setzen Batch-Wartezeit und Budget. Parallelisiert wird über Videos, nicht über Szenen: Fünf Szenen brauchten in einem Kontext 9 min, mit Sub-Agenten 21 min.
- **App und Rückkanal (Phase 2):** Feed-Seite in `public/` mit Player und Chips für Antwort, Konfidenz und Bewertung; sie schreibt in einen privaten Speicher (Cloudflare Worker + D1), den `nightly.py` per Token liest. Vorher fehlen 7-Tage-Werte und FSRS-Daten. Rückmeldung bleibt neutral („Auflösung: …“); „Irrtum“ trifft die Behauptung, nie die Antwort.
- **Live-Player:** `<hyperframes-player>` als mitgelieferter, gepinnter Tarball; Laufzeit über das undokumentierte `runtime-src`, GSAP und Schriften lokal. Ein CI-Test lädt eine Karte offline: keine externen Anfragen, „ready“ unter 1 s. Ca. 1–2 MB pro Video. Die Vorhersage stoppt bei `range-end`; Antwort-Chips sind nativ. Tipp links wiederholt die Szene, langes Drücken pausiert.
- **iOS-Test auf echten Geräten:** Ton-Freigabe per Tipp, Drift über 90 s, Drosselung. Rückfall: ein eigener Player, der den Ton als Uhr nutzt; sonst MP4.
- **Teilen:** per Link. MP4 nur nachts für markierte Videos, `--quality looks --workers 3` (`auto` wählt hier nur 1 Worker: 104 s statt 57 s).

## 8. Nutzung & Kosten

| Rolle pro L-Video (Schätzung) | Input | Output |
|---|---|---|
| Skript + Beats, Opus Batch (Denken nicht abschaltbar) | 12k | 6k |
| Skript-Kritik + 1 Überarbeitung | 20k | 6,5k |
| Faktencheck mit `web_fetch`, Sonnet Batch | 34k | 2k |
| Spec-Füller, Sonnet Batch | 15k | 4k |
| Lint + Didaktik | 8k | 1,5k |
| Kritiker, 2 Runden | 2 × 12k | 2 × 1k |

Preise pro Mio. Tokens (Input/Output): Opus 5.5 $4/$20, Sonnet 5.5 $2/$10, Haiku 5.5 $0,10/$0,50. Batch kostet die Hälfte, Websuche $10 pro 1 000. Dazu kommen Reparaturen, Slate, News und Serienplaner. Den echten Preis misst `report.json` an den ersten 15 Videos.

| Modus | Umfang | API/Monat |
|---|---|---|
| **Lean (Standard)** | 6 L pro Tag (3 Evergreen, 3 Transfer/Serie), ab 14.11. ≤ 2 L+ pro Woche, News als Textkarten | ca. $90–110; der Deckel drückt das auf etwa 5 pro Tag |
| Ziel | 12 L + 3 L+ pro Tag | ca. $230–260; nur mit ca. $150 Zusatzguthaben oder Max 20x |

Die Stimme kostet extra: $5–99.

**Deckel:**
- $1,50 pro Video und $3,50 pro Nacht.
- $95 pro Monat nach Kalendermonat, wie das Console-Limit im eigenen Workspace `deeptok-factory`; Guthaben verfällt pro Abrechnungszyklus.
- Vor jeder Nacht schreibt `nightly.py` Restguthaben und Rate-Limit-Header in `report.json`; daraus ergibt sich die Zahl der Videos.

**API-Regeln:**
- Key als Actions-Secret `DEEPTOK_ANTHROPIC_API_KEY`, explizit übergeben; in Cloud-Sitzungen nie unter dem Standardnamen, sonst überstimmt er den claude.ai-Login. `anthropic` und `claude-agent-sdk` in `tools/requirements.txt`.
- Kein erzwungenes `tool_choice` (400 bei Opus und Sonnet 5.5); JSON über `output_config.format` mit Schemas aus Zod. Keine Sampling-Parameter, Effort immer setzen, `max_tokens` mit Reserve fürs Denken.
- `cache_read_input_tokens` messen; bringt der Cache nichts, entfällt er.
- Batch-Aufträge gehen ohne `fallbacks` raus, weil die Batches-API den Parameter ablehnt. Ablehnungen (`stop_reason:"refusal"`), Fehler und verpasste Fristen werden als Standard-Aufruf neu geschickt, für Opus und Sonnet mit `fallbacks:"default"` und dem Beta-Header `server-side-fallback-2026-07-01`.
- Haiku 5.5 hat keinen Server-Fallback. Dann gilt der Code-Lint, ergänzt um Sonnet.
- Reparaturen, Kritiker und News laufen nie über Batch.

**Pro-Testwoche 6.–13.11. (unter 20 % Kontingent):**
- Die Fabrik läuft auf dem API-Guthaben von Max 5x ($100/Monat, gilt nicht für Claude Code) und kostet 0 % Kontingent.
- Gemessen wird über claude.ai/settings/usage, ob Linus' eigene Nutzung samt Morgen-Briefing und Abend-Priming unter 20 % bleibt.
- In dieser Woche gibt es keine Opus-Bausitzungen und keine Heroes.

**Entscheidung am 16.11.:** Max kostet $100 und enthält $100 Guthaben. Pro kostet $20 plus alle API-Kosten. Rein nach API-Kosten gewinnt Pro nur, wenn die Fabrik unter Lean läuft (etwa 5 Videos pro Tag oder weniger). Entscheidend ist, ob Linus' eigene Claude-Code-Nutzung ins Pro-Kontingent passt. Bei Wechsel vor Ende des Max-Zyklus Zahlungsmittel und Auto-Aufladung mit niedrigem Deckel einrichten.

**RTX-PC (optional, nie auf dem kritischen Pfad):** Hero-Stills, NVENC-MP4s, Notstimme (Chatterbox), ab 14.11. die Hausbibliothek. Ist die API aus Actions nicht erreichbar, kann `nightly.py` dort unter WSL laufen.

## 9. Rollout in Phasen

| Phase | Datum | Inhalt |
|---|---|---|
| 0 Go/No-Go | Di 27.10. | Guthaben; je ein Sonnet- und Agent-SDK-Aufruf aus Actions landen in Console › Cost, nicht in claude.ai/settings/usage; ein curl pro TTS-Anbieter; Bedingungen; PyAV-Fix (ffmpeg → float32) |
| 1 Goldstandard | 28.10.–1.11. | Probe von Hand neu: Siegerstimme, Welt mit Kamera, illustrierter Darsteller, Karte München → Barcelona, Geld als Objekt; `DESIGN.md`, Referenz-Destillation, Casting, Starter-Assets. 1.11.: Stimme und Goldstandard entschieden |
| 2 Skelett | 30.10.–2.11. | parallel: `nightly.py` auf Actions mit Zustand, Fristen, Deckeln; G0, G1, G4, G5; Feed-Seite, Rückkanal. Nach dem Go: v1-Kern ziehen |
| 3 Kalibrierung | 2.–5.11. | Kalibriernächte 2.–4.11. à 7 Videos, Linus bewertet alle 21; v1-Rest, Atlas-Minimal, übrige Tore außer G7; News-Textkarten; Transfer-Videos; Gerätetest. Freeze 5.–14.11. |
| 4 Testwoche | 6.–13.11. | Läuft ohne Eingriffe im Lean-Modus mit v1-Typen und Open Peeps |
| 5 Ausbau | ab 14.11. | Opus-Review; 16.11. Max oder Pro; G7, L+, Bühne mit Kamera, Hausbibliothek, voller Atlas, Beförderung, Hero, Dialog-Test |

Wird es knapp, rückt der Freeze nach hinten und die Testwoche läuft mit weniger Videos; der Goldstandard wird nicht abgekürzt.

**Nächste Sitzung:**
1. `nacht.yml` als Skelett mit `concurrency`, `factory-state` und Cache; Key-Nachweis.
2. PyAV-Workaround einbauen, `--workers 3` setzen.
3. Casting-Skript und `voice.py`-Adapter für die vier Anbieter; Netzzugang der Cloud-Umgebung auf „Custom“ mit TTS-Hosts, Wikimedia, LoC, naciscdn, jsDelivr.
4. Goldstandard beginnen; Bühnen-Spike.
5. Installationen aus dem SessionStart-Hook ins Setup-Skript der Umgebung verlegen (venv außerhalb des Repos, Whisper-Modell vorgeladen); der Hook prüft nur noch. `docs/PLAN.md` und Vault-Stand aktualisieren.

**Linus erledigt:**
- Console mit der richtigen Org verknüpfen (später nur über den Support änderbar), Workspace `deeptok-factory` mit Limit, Websuche aktivieren.
- Actions-Secrets anlegen: `DEEPTOK_ANTHROPIC_API_KEY` und die TTS-Keys.
- Mail an ElevenLabs schicken; sagen, was er mit „Ton“ meinte.
- 2–3 Referenzclips liefern; Casting und Goldstandard mit dem Bruder bewerten.
- Starter-Assets: Recraft-Key oder am 31.10./1.11. den PC laufen lassen.

## 10. Risiken & Gegenmaßnahmen

| Risiko | Gegenmaßnahme |
|---|---|
| Sieht weiter nach Folien aus | Goldstandard zuerst, ≥ 50 % Bild, messbare `DESIGN.md`, Entfern-Test |
| Neue Formel | fünf Bögen, keine gleiche Typfolge am selben Tag |
| Kein Guthaben oder API unerreichbar | Go/No-Go, Lean, RTX-PC unter WSL |
| Falsche Abrechnung | Key unter eigenem Namen, minimales env, Nachweis in Console › Cost |
| Nachtlauf bricht ab | Actions-Job ≤ 6 h, Zustand auf `factory-state`, Batch-Fristen, 06:15-Textkarte |
| Stimme fällt aus oder klingt flach | zweitbeste freigegebene Stimme, Restzeichen-Check, Prosodie-Prüfung |
| iOS-Wiedergabe | Gerätetest, Ton-als-Uhr-Player, MP4 |
| Faktenfehler | geprüftes Faktenblatt, `web_fetch` mit Zitat, Zahlen-Normalisierer |
| Kosten steigen schleichend | Deckel, ≤ 2 Reparaturen, gemessener Preis pro Video |
| Wartungsschuld | L+ selten, `lib`-Pin samt Player, Regressions-Snapshots |
| Persönliche Daten | Eingaben nur privat, Staging-Check, Vault-Lint, `noindex` |

## 11. Quellen

- API-Guthaben: https://platform.claude.com/docs/en/about-claude/api-credits-for-subscribers
- Preise, Batch: https://platform.claude.com/docs/en/about-claude/pricing · https://platform.claude.com/docs/en/build-with-claude/batch-processing
- Multi-Agent-Kosten: https://www.anthropic.com/engineering/multi-agent-research-system
- Geplante Aufgaben: https://code.claude.com/docs/en/routines
- GitHub Actions: https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions
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

## 12. Nachtrag nach eigener Prüfung (27.10.2026, 02:00)

**Geprüft und bestätigt:**
- **API-Guthaben:** Max 5x enthält 100 $ API-Guthaben pro Monat. Es gilt für die Claude API und das Agent SDK, nicht für Claude Code. Es verfällt am Ende jedes Abrechnungszyklus. Die Console-Organisation lässt sich nach dem Verknüpfen nur über den Support ändern. Quelle: platform.claude.com/docs/en/about-claude/api-credits-for-subscribers.
- **Preise pro Mio. Tokens (Eingabe/Ausgabe):** Opus 5.5 4/20 $, Sonnet 5.5 2/10 $, Haiku 5.5 0,10/0,50 $ (bis 100k Prompt). Batch kostet 50 % weniger, Cache-Treffer bei Opus und Sonnet 0,05× des Eingabepreises. Quelle: platform.claude.com/docs/en/about-claude/pricing.
- **Das Repo `linusaaronstiegler-boop/Deeptok` ist öffentlich.**

**Offene Entscheidung: Datenschutz (vor allem anderen).** Das öffentliche Repo enthält Angaben über den Bruder, und die stehen auch in der Git-Historie:
- in `docs/PLAN.md`, `CLAUDE.md` und `docs/research/`: Alter, Klassenstufe, Schulart, Rechtschreibschwäche;
- dazu Drive- und Artifact-IDs.

Das widerspricht der eigenen Regel „keine persönlichen Daten“.

Empfehlung: **das Repo auf privat stellen.** Das ist ein Klick unter GitHub › Settings › Danger Zone und versteckt auch die Historie. Folgen für diesen Plan:
- **Minuten:** Auf GitHub Actions sind Läufe für private Repos nicht mehr unbegrenzt gratis. GitHub Free hat ein Monatskontingent, laut Doku 2 000 Minuten; vor der Umstellung auf der Abrechnungsseite prüfen.
- **Schlanker Nachtlauf:** Die Batch-Wartezeit wird nicht im Runner abgesessen. Stattdessen prüfen kurze geplante Jobs (je 1–2 min, alle 30 min) den Batch-Status. Nur der CPU-Teil läuft lang: ca. 130 s pro Video, also bei 6 Videos rund 15–25 min pro Nacht, etwa 600–900 Minuten im Monat.
- **Vercel** kann private Repos weiterhin deployen.

Die Alternative wäre, das Repo öffentlich zu lassen, die Angaben zu entfernen und die Historie neu zu schreiben (Force-Push). Das ist aufwendiger und fehleranfälliger.
