# DeepTok-Videofabrik: finaler Plan

Stand: 27.10.2026, abends. Grundlage ist Vorschlag C (Hybrid). Dazu kommen die besten Teile aus A und B, und alle Pflichtkorrekturen der Gutachter sind eingearbeitet. **Änderung am Abend:** Die Fabrik läuft als Scheduled Tasks über Linus' Abo statt auf GitHub Actions mit API-Guthaben (§1, §2, §7–§10). Neu in §3: was die Vorschaubilder von Simplicissimus und Veritasium zeigen.

## 1. Kontext & Ziel

Die Probe „Opportunitätskosten“ ist didaktisch richtig aufgebaut: Fall → Vorhersage → Irrtum → Begriff → Regel. Schwach sind drei Dinge:
- **Ton:** Piper vertont Satz für Satz, die Pausen sind immer genau 0,22 oder 0,40 s, es gibt kein Mastering.
- **Bild:** 5 von 8 Szenen sind nur Text. Harte Schnitte auf leeres Navy, keine Kamera. Das wirkt wie Folien.
- **Bauweise:** etwa 25 min Agentenzeit und etwa 450 Zeilen Handcode pro Video.

**Ziel:** Videos (30–90 s), nachts automatisch gebaut. Bildgrammatik wie bei Simplicissimus, Didaktik wie bei Veritasium. Gemessen wird, wie viel Wissen nach 7 Tagen pro Minute Video hängen bleibt. Die Fabrik läuft als Scheduled Tasks über Linus' Max-Abo. Wie viele Videos pro Nacht ins Kontingent passen, messen die Kalibriernächte (Start: 3). Messbar wird das Lernziel erst mit App und Rückkanal (Phase 2).

| | Probe | Neu |
|---|---|---|
| Bau | Code pro Video | JSON-Spec → feste Szenen-Module |
| Steuerung | interaktive Sitzung | Scheduled Tasks in der Cloud + Python-Zustandsmaschine |
| Stimme | Piper, satzweise | bezahlte Stimme, Skript am Stück, gemastert |
| Bild | Text auf Navy | Karten, Archivbilder, Darsteller; ab v1.1 Welt mit Kamera |
| Abspielen | MP4 | live im Browser, Teilen per Link |

**Drei Stufen:**
- **L** (Bibliothek, Standard)
- **L+** (eine Sonderszene, ab 14.11., höchstens 2 pro Woche)
- **H** (Hero, 1 pro Monat, eigene Opus-Bau-Sitzung außerhalb der Testwoche): Forschung für neue Module, kein Feed-Format

Was sich in Heroes bewährt, wird zu einem Modul der Bibliothek. So wird die billige Stufe besser, ohne teurer zu werden.

**Wer steuert.** Linus' Idee „Opus überwacht Sonnet-Agenten“ wird übernommen, mit einer Verschiebung: Opus sitzt am Redaktionstisch, nicht auf dem Wachposten.
- Überwachen heißt warten, Status lesen, Schritte anstoßen. Jede dieser Runden kostet Tokens. Das erledigen Python-Code (`factory/fabrik.py`) und ein Sonnet-Lead.
- Opus entscheidet nur dort, wo Geschmack zählt: Serienplan, Slate, Skripte, Eskalationen.
- Multi-Agent kostet ≈ 15× Chat-Tokens, ≈ 4× ein Einzelagent (Anthropic 2025). Deshalb bekommt jeder Subagent einen engen Auftrag und gibt nur einen kurzen Bericht zurück.

## 2. Architektur auf einen Blick

```
EINGÄNGE  Serienpläne + Faktenblätter (Repo) · Digest „Vorlernen morgen“ (Drive-Connector)
          · News · ab Rückkanal: Antworten, Konfidenz, Bewertungen
STEUERUNG Scheduled Task startet → Sonnet-Lead → `fabrik.py status` sagt, was dran ist
SLATE     Opus-Subagent „Chefredaktion“: Briefs + alle Skripte der Nacht in einem Kontext
          (Stufe, Kanal, Identität, Niveau, Serie/Teil, Bogen, Beats nur mit Fakt-IDs)
          → Skript-Kritik (Sonnet, eigener Kontext) → 1 Überarbeitung (Opus)
PRO VIDEO Sonnet-Subagent: Faktencheck → Spec füllen → `fabrik.py build`
          (Lint → Stimme am Stück → Mastering → Wortzeiten + Hör-Check
           → compose → check → DOM-Messung)
          → Kritiker (frischer Sonnet-Subagent) → ≤ 2 Reparaturen → Commit + Zustand
AUSGABE   public/cards/<id>/ (index.html, voice.m4a, timing.json, spec.json)
          + Vorhersage + Abruffragen → report.json
```

| Rolle | Modell | Wo |
|---|---|---|
| Steuerung `factory/fabrik.py`: Zustand, Tore, Bauen, Deckel | – | Python, von jedem Lauf aufgerufen |
| Produktionsleiter (Lead) | Sonnet 5.5 | Scheduled Task „Nachtschicht“ |
| Serienplaner: 6–8 Teile, **ein** durchgehendes Beispiel, Irrtumsliste, Faktenblatt mit geprüften Quellen | Opus 5.5 + Websuche | Scheduled Task, 1× pro Woche |
| Chefredaktion: Slate, Skripte, Beats | Opus 5.5 | Subagent, 1× pro Nacht |
| Skript-Kritik | Sonnet 5.5 | Subagent, eigener Kontext |
| Faktencheck mit WebFetch, Streitfälle an Opus | Sonnet 5.5 | Produktions-Subagent je Video |
| Spec-Füller (nur Parameter) | Sonnet 5.5 | Produktions-Subagent je Video |
| Lint, Aussprache, Didaktik | Code + Haiku 5.5 (Bruder: Sonnet) | in `fabrik.py` bzw. Subagent |
| L+-Sonderszene | Sonnet 5.5 | eigener Subagent mit Grenzen (§5) |
| Kritiker | Sonnet 5.5 | frischer Subagent |
| News-Recherche (≤ 5 Suchen) | Sonnet 5.5 | Scheduled Task „Morgen-Redaktion“ |
| Hero-Regie, Beförderung | Opus 5.5 | interaktive Bau-Sitzung |

Fable 5.1 wird nicht eingesetzt. Batch und Cache der API entfallen; sie kommen nur mit dem optionalen Turbo zurück (§8).

**Die Nacht läuft als Scheduled Tasks** (claude.ai/code/routines).
- **Weg über einen Starter (27.10.):** Scheduled Tasks, die Claude selbst anlegt, bekommen weder Repo noch Connectors. Deshalb weckt jeder Task eine kleine, dauerhafte Starter-Sitzung (Nachricht `START <auftrag>`). Der Starter startet per `create_session` eine frische Sitzung mit Repo, Modell und Auftrag aus einer festen Tabelle; andere Aufträge lehnt er ab. Er nimmt auch keine Regeländerungen von anderen Sitzungen an (im Test so passiert). Starter und Fabrik-Sitzungen laufen in der Umgebung `deeptok-fabrik`, nie in „Trading“.
- Jeder Lauf ist eine frische Cloud-Sitzung. Sie klont das Repo neu, arbeitet im Auto-Modus und zählt gegen Linus' Abo-Kontingent wie eine interaktive Sitzung.
- Einzelne Befehle enden nach 10 min. Bei ca. 130 s CPU pro Video ist das kein Problem; die Sitzung selbst darf stundenlang laufen.

| Task | Zeit (Europe/Berlin) | Modell | Arbeit |
|---|---|---|---|
| Nachtschicht | täglich 23:07 | Sonnet-Lead, Subagenten wie oben | Slate, Skripte, Produktion aller Videos, Bericht; Ende spätestens 04:00 |
| Weiterlauf | täglich 01:37 und 03:07 | Sonnet | liest den Zustand. Läuft die Nachtschicht noch oder ist alles fertig, endet er nach einer Minute. Sonst baut er die offenen Videos fertig |
| Morgen-Redaktion | täglich 04:15 | Sonnet | News, Briefings, Transfer-Karten aus dem Digest; Stopp 05:50. Was um 06:15 fehlt, wird eine Text-Briefingkarte mit Quellen |
| Serienplaner | sonntags 20:37 | Opus | nächste Serien mit Faktenblatt, Irrtumsliste und durchgehendem Beispiel |

- **Zustand:** Jede Statusänderung schreibt `fabrik.py` sofort nach `zustand/<nacht>.json` auf den Branch `factory-state` (Status, Versuche und Eskalationen je Video, Herzschlag) und pusht sie; Arbeitskopie per git worktree in `.fabrik-zustand/`; der Prompt nennt diesen Branch ausdrücklich, sonst landet alles auf `claude/…`. Jeder Lauf beginnt mit `fabrik.py status`. Ein Container-Neustart kostet so höchstens das Video, das gerade gebaut wurde.
- **Kein Doppellauf:** Ist der Herzschlag jünger als 15 min, endet der Weiterlauf sofort. Der Lead hält den Herzschlag mit einer Hintergrund-Schleife frisch und ruft `plan`/`video` mit `--lauf` auf; verliert er die Nacht, bekommt er Exit 3 und hört auf (Docstring von `factory/fabrik.py`).
- **Umgebung `deeptok-fabrik`:**
  - Das Setup-Skript `tools/setup-umgebung.sh` installiert venv, faster-whisper samt Modell, ffmpeg, die gepinnte HyperFrames-CLI und Chrome, alles unter `/opt/deeptok`. Gemessen: 39 s frisch, 0,8 s beim zweiten Lauf (Grenze für den Cache: ca. 5 min). Der SessionStart-Hook prüft nur noch (0,02 s); `env.sh` setzt HF_HUB_OFFLINE=1.
  - Netz „Custom“ mit Häkchen für die Standardliste; Hosts in `tools/umgebung-hosts.txt` (Hugging Face, Nachrichten, Märkte, Wikimedia, LoC, naciscdn, jsDelivr). TTS-Hosts kommen über Network secrets und brauchen keinen Eintrag.
  - TTS-Keys als Network secrets (Tabelle in §4), nie als Umgebungsvariable der Cloud-Umgebung (die kann jeder lesen, der sie nutzt) und nie im Repo.
- **Connectors:** nur Google Drive (Digest lesen) und GitHub. Alle anderen werden im Task entfernt.
- **CPU:** höchstens 2 Chrome-Jobs gleichzeitig (Datei-Sperre in `fabrik.py`), faster-whisper mit `cpu_threads=2`. Parallel laufen nur die Modell-Schritte.
- **Prompts im Repo:** Die Task-Prompts liegen in `factory/tasks/*.md`. Der gespeicherte Prompt sagt nur „Lies `factory/tasks/nacht.md` und führe sie aus“. Änderungen laufen damit über Git, nicht über die Weboberfläche. Der Go/No-Go-Lauf liest `factory/tasks/probe.md`. Jeder Task-Prompt lädt in seinen Bash-Blöcken zuerst `/opt/deeptok/env.sh`, weil SessionStart-Hooks nicht in jeder Sitzungsart laufen.
- **Veröffentlichen:** Während der Kalibrierung auf `claude/nacht-<datum>` (Vercel-Preview). Ab der Testwoche pusht die Nachtschicht Karten, die alle Tore bestehen, nach `main`.
- **Pause:** Schalter im Task oder Datei `factory/PAUSE`.

**Serien im Feed:** höchstens 2–3 aktive pro Profil, eine endet vor der nächsten; Teil n+1 erst nach Teil n, eröffnet mit einer Abruffrage zum vorigen. Transfer-Videos bilden je Fach eine Serie nach LehrplanPLUS (Jgst. 10); der Digest wählt den nächsten passenden Teil.

**Persönliche Daten:** Die Fabrik liest den Digest direkt über den Drive-Connector und übernimmt daraus nur Fach, Thema und Priming-Fragen. Namen, Noten und Mails kommen nie ins Repo (G1 blockiert sie). Antworten und Bewertungen aus der App liegen im privaten Speicher (§7).

## 3. Stil: Richtung Veritasium und Simplicissimus

**Identitäten.** Navy-Leere und Creme-Papier mit Serifen stehen auf der BANNED-Liste von HyperFrames. Palette und Schriften bleiben; jede `DESIGN.md` legt messbare Merkmale fest, und was in Renders trotzdem nach Standard aussieht, kommt auf BANNED.

| Identität | Kanäle | Messbare Regeln | ab |
|---|---|---|---|
| Editorial | Rhetorik, Philosophie, Bücher, Style, Disziplin (nur Linus) | Spaltenraster mit 2-px-Haarlinien, Rasterpunkte, 2–3 px Passer-Versatz, Schlagzeilen-Ausschnitte; keine kursiven Akzentwörter, nichts zentriert Schwebendes | v1 |
| Diagramm | Naturwiss., Mathe, Schul-Transfer, Wirtschaftsmodelle | sichtbares Rasterpapier (6×6-Anker), Striche zeichnen sich, alles an Achse oder Raster verankert; kein Schnitt in einer Herleitung | v1 |
| Atlas | Geopolitik & Geschichte, Wirtschaftslage | Korn nur, wenn es im Handy-Blatt sichtbar ist (Spike 27.10.: festes Korn verdoppelte die MP4 und war unsichtbar), Schlagzeilen mit Quelle + Datum, Kartenrouten, Duoton-Archivfotos | minimal bis 4.11. |

Farben gelten überall gleich: Gold = gesuchte Größe, Creme = gegeben, Rot = Irrtum/Verlust.

**Bühne und Darsteller (ab v1.1).** Szenen-Timelines erreichen nichts außerhalb ihrer Datei. Ein Spike vergleicht eine durchgehende Bühnen-Sub-Komposition (Welt, Kamera, Darsteller) mit einer Wurzel-Spur, in `check`, `snapshot --review` und im Player. Danach schreibt Opus einen **Kamera-Vertrag**: eine Welt, ein Kamerapfad, ein Darsteller, der die Form nur wechselt, solange er dasselbe bedeutet; höchstens ⅓ harte Schnitte; HUD-Text bleibt fest.

**Ergebnis des Spikes (27.10., `studio/spike-buehne/REVIEW.md`).** Alle drei Bauweisen bestehen `check`, Render und Seek im Player. Empfehlung **A+**:
- Die Bühne ist eine Sub-Komposition über die volle Länge: Welt, Kamera, Darsteller und weltverankerte Marker (`data-anker`).
- Darüber liegt je Szene ein HUD als eigene Sub-Komposition, nur fester Text. So gibt es Naht-Blätter im Review und Szenen-Clips im Studio.
- Alle `data-start` schreibt der Bau aus `data-cue`, nie von Hand.
- Die Spec nennt nur benannte Einstellungen und Cue-Namen. Code übersetzt sie in Kamera- und Darsteller-Spuren, die `render(t)` auswertet. Szenen-Module liefern `{ hud, buehne: { spuren, marker } }`.
- Kamera-Vertrag, ergänzt: Fahrtrichtung = Flussrichtung des Bedeuteten (das Geld fliegt vom Käufer zum Verkäufer); der Darsteller ruht nach jedem Aufsetzen ≥ 1,2 s; ein Marker-Kreis ist das einzige helle Zeichen in seinem Umfeld.

| Kit-Konstante | Wert |
|---|---|
| Display | 9 % der Bildhöhe für Zahlen und Schlagzeilen bis 2 kurze Wörter; Namen und längere Schlagzeilen ≈ 6,5 % („Lewandowski“ ist bei 9 % 1072 px breit, Sicherheitsbreite 864 px); −2 % Laufweite |
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
- Keine Musik, auch nicht in Pausen; dort soll selbst gedacht werden (Moreno & Mayer 2000). „Ton“ meinte laut Linus nur die Stimme (27.10.). Beide Vorbilder haben Musik, DeepTok nicht. Signal-Geräusche nur auf sichtbaren Ereignissen ohne Sprechtext.
- Mastering: 80-Hz-Hochpass, De-Esser, 2:1-Kompression, −16 LUFS, −1 dBTP; vorher am Handylautsprecher gegen das rohe Signal hören.

**Was die Vorbilder zeigen** (je 12 Vorschaubilder, 27.10.; Bewegung, Schnitt und Tempo sind noch ungemessen).
- **Simplicissimus:**
  - entsättigte, körnige Doku-Fotos und Karten mit einer einzigen Signalfarbe Rot;
  - handgezeichnete rote Marker: Kreise, Fadenkreuze, Pfeile;
  - Collage mit Papierriss, Zensurbalken mit fetten Versalien;
  - Karten mit einer leuchtend hervorgehobenen Region; Schlagzeilen schmal, fett, weiß und rot.
- **Veritasium:**
  - ein einziger Gegenstand, dunkel und filmisch ausgeleuchtet;
  - Serifen-Schlagzeile aus 2–3 Wörtern mit roter Unterstreichung, dazu ein handgezeichneter Pfeil;
  - echte Hände beim Experiment, gemalte Porträts;
  - Shorts sind Straßeninterviews mit Serifen-Untertiteln.
- **Gemeinsam:** dunkler Grund, eine Akzentfarbe, 2–4 Wörter, ein echter Held (Gegenstand, Foto oder Karte), darüber eine Ebene aus Handmarkierungen.
- **Für DeepTok:**
  - Die Marker-Ebene wird ein eigenes Modul (Registry `marker-highlight`, `hw-callout-circle`). Kreis, Pfeil oder Unterstreichung zeichnen sich genau auf dem Wort.
  - Jede Szene hat einen Helden, der kein Text ist.
  - Editorial bekommt die Playfair-Schlagzeile mit Unterstreichung; Atlas bekommt Archivfotos in Graustufen plus eine Farbe und die hervorgehobene Kartenregion.
  - Gold bleibt die gesuchte Größe, Rot bleibt Irrtum und Verlust. Beide Vorbilder nutzen Rot als Signal, das passt.

**Inspirations-Werkzeuge.**
- **Referenz-Destillation (einmalig):** YouTube blockiert Downloads aus der Cloud (Bot-Prüfung), Umgehungen sind tabu. Legal und aus der Cloud erreichbar ist die ZDF-Mediathek: Sie hostet die funk-Folgen von Simplicissimus (2019–2022), Kurzgesagt (deutsch) und maiLab. Gemessen werden je die ersten 180 s; maiLab steht als legaler Ersatz für Veritasium. Ergebnis: `docs/research/referenz-destillation.md`. ffmpeg misst Schnittlängen und Titel-Timing. Nur die Zahlen kommen in die `DESIGN.md`, die Clips werden gelöscht.
- **Nutzen:** `npx hyperframes snapshot --against ref.mp4`, `npx hyperframes capture <url> --json`; Registry-Blöcke `count-up`, `before-after-wipe`, `marker-highlight`, `hw-callout-circle`, `chart-story`, `world-map`; UXKIN (`design-md`, `no-ui-slop`) für die App.
- **Weglassen:** Bright-Data design-mirror, WebGPU-Shader.

## 4. Stimme

**Casting.**
- Seit 27.10. über den ElevenLabs-Connector mit Linus' vorhandenen Credits (Freigabe von Linus): Runde 1 mit sechs deutschen Stimmen auf v4 (Thomas, Hans, Konrad Fichte, Jonas, Lea Voss, Victoria), blind auf der Werkstatt-Seite; Runde 2 mit den zwei besten am ganzen Skript. Kosten Runde 1: 12 Proben à 326 Credits, zusammen etwa 1,40 $. Gemessen: Wortfehlerrate 0–8 %, 44,1 kHz, 128 kbps.
- 27.10.: Modelle und Bedingungen prüfen, auch Inworlds Regeln für Minderjährige; Mail an ElevenLabs.
- Test: Hook, Vorhersagefrage, Widerlegung („nicht X, sondern Y“) und ein ganzes 60-s-Skript mit Zahlen, Namen und Lehnwörtern. Paarweise Zwangswahl, blind, beide Brüder, Handy-Lautsprecher; Wortfehlerrate und Namens-Treffer automatisch.
- Volumen: bei ca. 6 Videos pro Tag ca. 0,26 Mio. Zeichen pro Monat (inkl. 1,3× Puffer für Neuvertonung), Ziel ca. 0,5 Mio.

| Kandidat | Kosten | Haken | Linus richtet ein |
|---|---|---|---|
| ElevenLabs v4 Turbo, Standard- oder eigene Stimme; AA-Platz 1 | $40/1 Mio. Zeichen; Creator $22 (275k, knapp), Pro $99 | unter 18 nur mit schriftlicher Freigabe; kein SSML, IPA zwischen /…/ | Network secret, Mail |
| Inworld TTS-2; Deutsch #2, Wort-Zeitstempel | $25/1 Mio. | Minderjährigen-Richtlinie ungeprüft; 2 000 Zeichen je Anfrage | Network secret |
| Cartesia Sonic 3.6; IPA-Wörterbuch | $5 Casting, $49/Monat | Emotions-Tags nur Englisch; Wort-Zeitstempel nur per SSE | Network secret |
| Azure Florian DragonHD; SSML | $22/1 Mio. | klanglich schwächer; DragonHD ohne Betonungs-SSML, HD nur in westeurope u. a. | Network secret (Region westeurope) |

Gemini-TTS fällt weg, weil die Bedingungen Nutzer unter 18 ausschließen; Piper wird nicht mehr genutzt. Chirp 3 HD bleibt nur Gratis-Basis, wenn die Google-Cloud-Bedingungen es erlauben; das wird separat geprüft.

**Entscheidung am 1.11.:** die bestbewertete Stimme, die heute für **beide** Profile nutzbar ist; ohne Freigabe für den Bruder scheidet ein Anbieter aus. Kosten entscheiden nur, wenn Linus „gleich gut“ sagt. Keine getrennten Stimmen pro Profil.

**Regeln:**
- Ganzes Skript in einem Request, sonst 2–3 Absätze mit Nachbartext; Szenen an den Wortzeiten schneiden. Pausen kommen aus der Stimme; Code setzt nur Vorhersage-Stopp und deklarierte Denkpausen (1,5–2,5 s).
- Markup `*betont*`, `/` (Pause), `?↑` (Frage), je Anbieter übersetzt. Skripte fürs Sprechen: kurze Hauptsätze, Schlüsselwort am Satzende.
- Wortzeiten vom Anbieter, sonst faster-whisper. Aussprache über Lexikon plus `Anzeige|Gesprochen`; Haiku schlägt Einträge vor.
- Modell, Stimm-ID und Einstellungen gepinnt in `voices/<id>.json`, Restzeichen vor jeder Nacht prüfen. Ein Sprecher pro Serie; fällt der Anbieter aus, wechselt nur bei News die Stimme, Evergreens warten höchstens 48 h.
- Adapter (`factory/werk/stimme/`): In der Cloud schickt der Code die Anfrage OHNE Key; der Agent-Proxy setzt ihn als Network secret selbst in den Header. Am PC kommt der Key aus einer Umgebungsvariable (`ELEVENLABS_API_KEY`, `INWORLD_API_KEY`, `CARTESIA_API_KEY`, `AZURE_SPEECH_KEY`). Eine Key-Variable in der Cloud-Umgebung löst eine Warnung aus.
- Brüche und Einheiten, die anders gesprochen werden sollen, als Token schreiben, z. B. `1/2|einhalb`; sonst wird aus 1/2 „1 durch 2“.

**Network secrets je Anbieter** (claude.ai/code → Umgebung `deeptok-fabrik` → Edit → Network secrets → Add secret; Prüfung kostenlos mit `python factory/casting.py --probe --nur <anbieter>`):

| Anbieter | Allowed websites | Header-Name | Prefix | Value |
|---|---|---|---|---|
| ElevenLabs | `api.elevenlabs.io` | `xi-api-key` | leer („Bearer“ löschen) | API-Schlüssel (Rechte: Text to Speech, Voices Read, User Read) |
| Inworld | `api.inworld.ai` | `Authorization` | `Basic` | Base64-Zeichenkette aus dem Portal, nicht neu kodieren |
| Cartesia | `api.cartesia.ai` | `Authorization` | `Bearer` | API-Schlüssel `sk_car_…` |
| Azure Speech | `westeurope.tts.speech.microsoft.com` | `Ocp-Apim-Subscription-Key` | leer („Bearer“ löschen) | Key 1 der Speech-Ressource |

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
- Läuft als eigener Sonnet-Subagent der Nachtschicht. Grenzen: 6 Werkzeug-Runden, 15 min; sonst kommt der nächstpassende Bibliothekstyp.

**Beförderung zum Modul**, wenn (a) der Kritiker keine P0/P1 findet, keine negative Bewertung vorliegt und ≥ 3 Themen sie brauchen, oder (b) derselbe L+-Bedarf 3-mal pro Woche auftaucht. Opus baut das Modul in einer Bau-Sitzung mit zwei Demo-Specs, die beide die Tore bestehen. Jede Karte pinnt `lib@x.y`, also gehen alte Karten nie kaputt.

## 6. Qualitäts-Tore (billigste zuerst)

| Tor | Prüft |
|---|---|
| G0 Schema | Slot-Grenzen, Cues, Beat-Reihenfolge, Frage ≤ 8 s, Ablenker ähnlich lang, ≥ 1 Transferfrage, ≥ 50 % der Zeit Bild statt Text, keine gleiche Typfolge am selben Tag |
| G1 Code | Sperrwörter in Sprechtext und App-Texten (Lob, „natürlich“, „offensichtlich“, „einfach“, „Leichtsinnsfehler“, Mindset u. a.); **jede Zahl in Bild und Ton steht normalisiert in `facts[]`** (Mio. = Millionen); Fakt mit Quelle, Datum, Zitat; keine Antwort vor `pause_for_answer`; keine Eingabedatei gestaged; Vault-Namen, Mails, Noten blockiert |
| Skript-Kritik | Irrtum echt und belegt, ein durchgehendes Beispiel, Beispiel vor Regel, jeder Satz trägt die Kernidee, gut sprechbar → eine Überarbeitung |
| G2 Didaktik | Entfern-Test, Motivationsfloskeln |
| G3 Faktencheck | WebFetch auf jede `src`; fehlt die Behauptung → unbelegt; News mit offener Behauptung → Textkarte. Offen: Erreicht WebFetch Hosts außerhalb der Liste? Danach entweder Network access „Full“ oder jede `src` muss auf einem Listen-Host liegen |
| G4 Hör-Check | Wortfehlerrate nach Normalisierung (num2words, Lexikon), Schwelle aus der Kalibrierung; Namen per large-v3-turbo oder Parakeet (bis Phase 3 nur `small` plus Alignment des Anbieters), Fehler nur bei Widerspruch zum Anbieter-Alignment; −16 ± 1 LUFS; ≥ 44,1 kHz, ≥ 96 kbps; Stille > 1,2 s nur in deklarierten Pausen; Sprechtempo 2,0–2,6 Wörter/s, Tonhöhe nicht flach |
| G5 `check --json` | 0 Fehler; `data-layout-ignore` nur auf Deko-Ebenen, Layout nie im `onUpdate` messen |
| G6 DOM-Layout | ±150 ms am Cue, Lesezeit, y = 168–1330, Schriftgrößen wie im Kit |
| G7 DOM-Bewegung (ab 14.11.) | Tempo im Lesefenster ≈ 0, Halten ≥ 1,2 s, gleichzeitige Tweens, wiederholte Eintritte, Darsteller überlebt Schnitt |
| G8 Kritiker | Beat-Blatt + ≤ 3 Nahtstreifen (540 px) + Messwerte; Ja/Nein-Fragen: BANNED-Treffer? Entfern-Test? Schnitt mit Ursache? Diashow? Stimmt die Richtung jedes Flusses (Geld, Ware, Person)?; Notizen „t · wo · Problem → Änderung“ |
| G9 bei Bibliotheks-Änderung | Referenz-Snapshots, WebKit-Test |

Scheitert ein Tor:
1. 2 Reparaturen mit dem genauen Befund.
2. Eine Eskalation zu Opus.
3. Danach kommt die Spec nach `needs-human/`; der Slot bekommt so lange eine Quizkarte.

**Menschliche Freigaben:**
- **Goldstandard:** Beide Brüder geben der neu gebauten Probe ≥ 4/5, Linus nennt sie „klar besser“; blind urteilt nur der Bruder. Dazu `snapshot --against` gegen 2–3 Referenzsequenzen. Erst danach werden Module daraus gezogen.
- Stimm-Casting: beide Brüder, blind.
- Linus bewertet alle 15 Kalibriervideos; daran werden G4 und G8 eingestellt. Danach jedes 10. Video über ein Menü mit Gründen, auch zur Stimme.

Bei n = 2 sind Vergleiche qualitativ, zumal beide die alte Probe kennen: Blind-Präferenz plus 7-Tage-Quiz an frischen, gematchten Themenpaaren. Gemessen wird nur innerhalb der Person auf Item-Ebene (≥ 20 Items pro Bedingung, Regel vorab notiert); sonst entscheiden Literatur und Präferenz, auch beim Dialog-Test (Muller 2008: d = 0,83).

## 7. Tempo, Kapazität & App

| | L | L+ | H |
|---|---|---|---|
| Modellzeit | ca. 15 min, Videos parallel | +10–15 min | Stunden |
| CPU (60 s) | ca. 130 s | +30 s | 5–10 min |
| Tokens (Schätzung, §8) | ca. 140k + Grundbedarf der Subagenten | ca. 1,5× L | eigene Bau-Sitzung |

- **Kapazität:** Die Grenze ist das Kontingent, nicht die Zeit. Eine Nacht mit 5 Videos braucht ca. 1–1,5 h. Parallelisiert wird über Videos, nicht über Szenen: Fünf Szenen brauchten in einem Kontext 9 min, mit Sub-Agenten 21 min. Vektorkarten sind der Render-Engpass (Spike, 15 s): ohne Karte ≈ 14 s, 50m ≈ 28 s, 10m ≈ 39 s; 10m nur für Ausschnitte mit Zoom > 2,5.
- **App und Rückkanal (Phase 2):** Feed-Seite in `public/` mit Player und Chips für Antwort, Konfidenz und Bewertung. Sie schreibt in einen privaten Speicher (Cloudflare Worker + D1), den die Nachtschicht per Token liest (Network secret). Vorher fehlen 7-Tage-Werte und FSRS-Daten. Rückmeldung bleibt neutral („Auflösung: …“); „Irrtum“ trifft die Behauptung, nie die Antwort.
- **Live-Player:** `<hyperframes-player>` als mitgelieferter, gepinnter Tarball; Laufzeit über das undokumentierte `runtime-src`, GSAP und Schriften lokal. Ein CI-Test lädt eine Karte offline: keine externen Anfragen, „ready“ unter 1 s. Ca. 1–2 MB pro Video. Die Vorhersage stoppt bei `range-end`; Antwort-Chips sind nativ. Tipp links wiederholt die Szene, langes Drücken pausiert. Der Player bettet keine Schriften ein: Jede Karte bringt ihre woff2-Dateien mit eigenem `@font-face`-Namen mit, GSAP ebenso lokal mit Prüfsumme.
- **iOS-Test auf echten Geräten:** Ton-Freigabe per Tipp, Drift über 90 s, Drosselung. Rückfall: ein eigener Player, der den Ton als Uhr nutzt; sonst MP4.
- **Teilen:** per Link. MP4 nur nachts für markierte Videos, `--quality looks --workers 3` (`auto` wählt hier nur 1 Worker: 104 s statt 57 s).

## 8. Nutzung & Kontingent

Scheduled Tasks verbrauchen Linus' Abo-Kontingent (5-Stunden-Fenster und Wochenlimit) genau wie seine eigenen Sitzungen. Es entstehen keine API-Kosten. Dafür nimmt jedes Video Linus etwas Spielraum für die eigene Arbeit.

| Rolle pro L-Video (Schätzung) | Input | Output |
|---|---|---|
| Skript + Beats, Opus | 12k | 6k |
| Skript-Kritik + 1 Überarbeitung | 20k | 6,5k |
| Faktencheck mit WebFetch, Sonnet | 34k | 2k |
| Spec-Füller, Sonnet | 15k | 4k |
| Lint + Didaktik | 8k | 1,5k |
| Kritiker, 2 Runden | 2 × 12k | 2 × 1k |

Dazu kommen der Grundbedarf jedes Subagenten (Systemprompt und Werkzeuge, ca. 15–25k Tokens, großteils gecacht) sowie Reparaturen, Slate, News und Serienplaner. Opus belastet das Kontingent stärker als Sonnet; deshalb schreibt Opus nur.

**Kalibrieren statt schätzen.** Wie viel Prozent des Wochenlimits ein Video kostet, zeigt nur die Messung.
- In den Kalibriernächten notiert Linus den Stand auf claude.ai/settings/usage um 23:00 und am Morgen. `report.json` zählt Videos, Subagenten und Laufzeit.
- Start mit 3 Videos pro Nacht, dann 5 und 7. Obergrenze: Die Fabrik verbraucht höchstens ein Drittel des Wochenlimits.

**Deckel:**
- Videos pro Nacht als feste Zahl in `factory/config.json` (Start 3).
- Pro Video ≤ 2 Reparaturen und eine Opus-Eskalation; L+ ≤ 2 pro Woche.
- Erreicht ein Lauf das Nutzungslimit, bricht er ab. Der Zustand ist gesichert, der nächste Lauf macht weiter.
- Overage („usage credits“) bleibt aus. Dann kann die Fabrik nie Geld kosten, sie stoppt nur.

Die Stimme kostet extra: $5–99 im Monat.

**API-Guthaben als optionaler Turbo.** Max 5x enthält zusätzlich $100 API-Guthaben pro Monat, das ungenutzt verfällt. Es gilt nicht für Claude Code, also auch nicht für Scheduled Tasks.
- Wird das Kontingent knapp, kann `fabrik.py` Skript-Entwürfe und Faktenchecks als Batch über die API schicken: halber Preis, ca. $0,40–0,50 pro Video, also rund 200 Videos im Monat aus dem Guthaben.
- Dafür müsste Linus einmal eine Console-Organisation verknüpfen und einen Key als Network secret hinterlegen. Der Key bekommt einen eigenen Namen, nie `ANTHROPIC_API_KEY`, sonst überstimmt er den claude.ai-Login.
- Regeln dafür: kein erzwungenes `tool_choice` (400 bei Opus und Sonnet 5.5), JSON über `output_config.format`, keine Sampling-Parameter, Batch ohne `fallbacks`; Ablehnungen und Fehler gehen als Standard-Aufruf mit `fallbacks:"default"` neu raus. Preise: Opus 5.5 $4/$20, Sonnet 5.5 $2/$10, Haiku 5.5 $0,10/$0,50 pro Mio. Tokens, Batch die Hälfte.

**Pro-Testwoche 6.–13.11. (unter 20 % Kontingent):**
- Sie fällt mit der Testwoche der Fabrik zusammen. Die Fabrik läuft nur nachts, ihr Anteil am Wochenlimit ist aus den Kalibriernächten bekannt und wird von der Wochensumme abgezogen.
- Der Rest ist Linus' eigene Nutzung samt Morgen-Briefing und Abend-Priming. Er soll unter 20 % liegen.
- In dieser Woche gibt es keine Opus-Bausitzungen und keine Heroes.

**Entscheidung am 16.11.:** Pro hat etwa ein Fünftel des Max-5x-Kontingents und kein API-Guthaben. Eine nächtliche Fabrik passt dort kaum hinein.
- Solange der Grundstock wächst (ca. 1 500 Karten laut App-Plan), bleibt Max.
- Danach reicht vielleicht Pro mit wenigen neuen Videos pro Woche plus News. Das entscheidet der gemessene Verbrauch pro Video.

**RTX-PC (optional, nie auf dem kritischen Pfad):** Hero-Stills, NVENC-MP4s, Notstimme (Chatterbox), ab 14.11. die Hausbibliothek. Fällt die Cloud aus, holt eine Desktop-Sitzung am PC die Nacht nach.

## 9. Rollout in Phasen

| Phase | Datum | Inhalt |
|---|---|---|
| 0 Go/No-Go | Mi 28.10. | Umgebung `deeptok-fabrik` steht. Probe-Task per „Run now“ (Auftrag `factory/tasks/probe.md`, Bericht auf Branch `claude/probe-<datum>`): Setup-Skript gecacht, Drive-Connector liest den Digest, je ein Sonnet- und Opus-Subagent, ein Render unter 10 min, Push auf `factory-state` und `claude/…` klappt, der Auto-Modus blockiert nichts Nötiges; Verbrauch notieren. Zugang je TTS-Anbieter kostenlos mit `casting.py --probe`, sobald die Network secrets stehen; Bedingungen. PyAV: av 18.1.0 gepinnt, `hoercheck` dekodiert selbst per ffmpeg |
| 1 Goldstandard | 28.10.–1.11. | Probe von Hand neu: Siegerstimme, Welt mit Kamera, illustrierter Darsteller, Karte: Spieler München → Barcelona, Ablöse Barcelona → München als Objekt, Marker-Ebene; `DESIGN.md`, Referenz-Destillation, Casting, Starter-Assets. 1.11.: Stimme und Goldstandard entschieden |
| 2 Skelett | 30.10.–2.11. | parallel: `fabrik.py` mit Zustand, Herzschlag, Deckeln; die vier Task-Prompts; G0, G1, G4, G5; Feed-Seite, Rückkanal. Nach dem Go: v1-Kern ziehen |
| 3 Kalibrierung | 2.–5.11. | Kalibriernächte 2.–4.11. mit 3, 5 und 7 Videos, Linus bewertet alle 15 und notiert den Verbrauch; v1-Rest, Atlas-Minimal, übrige Tore außer G7; News-Textkarten; Transfer-Videos; Gerätetest. Freeze 5.–14.11. |
| 4 Testwoche | 6.–13.11. | Läuft ohne Eingriffe mit der kalibrierten Videozahl, v1-Typen und Open Peeps |
| 5 Ausbau | ab 14.11. | Opus-Review; 16.11. Max oder Pro; G7, L+, Bühne mit Kamera, Hausbibliothek, voller Atlas, Beförderung, Hero, Dialog-Test |

Wird es knapp, rückt der Freeze nach hinten und die Testwoche läuft mit weniger Videos; der Goldstandard wird nicht abgekürzt.

**Stand 27.10. abends:**
- Erledigt: Setup-Skript und Hostliste; Hook prüft nur noch; `fabrik.py` mit Zustand, Herzschlag, Deckeln, `PAUSE`, Lint (G1), Hör-Check (G4), `check`/`render` mit Sperre; `factory/tasks/probe.md`; Stimm-Adapter und Blind-Casting (`factory/casting.py`); Bühnen-Spike. 296 Tests grün.
- Offen: `build` und `publish` in `fabrik.py`; Task-Prompts für Nachtschicht, Weiterlauf, Morgen-Redaktion, Serienplaner; Goldstandard.

**Linus erledigt:**
- Repo auf privat stellen (§12). Seit es keine GitHub Actions mehr gibt, hat das keinen Nachteil.
- Cloud-Umgebung `deeptok-fabrik` anlegen (Umgebungsmenü in der Titelleiste einer Sitzung, dann Edit):
  - Inhalt von `tools/setup-umgebung.sh` als Setup-Skript einfügen;
  - Network access „Custom“, Häkchen für die Standardliste, Hosts aus `tools/umgebung-hosts.txt` (ohne #-Zeilen);
  - TTS-Keys als Network secrets nach der Tabelle in §4.
- Overage auf claude.ai/settings/usage ausgeschaltet lassen.
- Kein Console-Link und kein API-Key nötig, solange der Turbo nicht gebraucht wird; TTS-Keys erst, falls ein anderer Anbieter als ElevenLabs ins Casting soll.
- Mail an ElevenLabs wegen Nutzung für unter 18 (der Bruder hört die Videos).
- Casting und Goldstandard mit dem Bruder auf der Werkstatt-Seite bewerten. Die Referenz-Clips holt Claude selbst aus der ZDF-Mediathek.
- Starter-Assets: Recraft-Key oder am 31.10./1.11. den PC laufen lassen.

## 10. Risiken & Gegenmaßnahmen

| Risiko | Gegenmaßnahme |
|---|---|
| Sieht weiter nach Folien aus | Goldstandard zuerst, ≥ 50 % Bild, messbare `DESIGN.md`, Entfern-Test |
| Neue Formel | fünf Bögen, keine gleiche Typfolge am selben Tag |
| Kontingent reicht nicht | Kalibrierung, feste Videozahl pro Nacht, Opus nur fürs Schreiben, Turbo über API-Guthaben |
| Fabrik verdrängt Linus' eigene Arbeit | Läufe nur nachts, höchstens ein Drittel des Wochenlimits, Schalter und `factory/PAUSE` |
| Nachtlauf bricht ab (Container-Neustart, Limit) | Zustand nach jedem Video auf `factory-state`, zwei Weiterläufe, 06:15-Textkarte |
| Lauf hängt an einer Rückfrage | Auto-Modus im Go/No-Go testen, Prompts ohne riskante Aktionen, Bericht im Lauf-Verlauf |
| Stimme fällt aus oder klingt flach | zweitbeste freigegebene Stimme, Restzeichen-Check, Prosodie-Prüfung |
| iOS-Wiedergabe | Gerätetest, Ton-als-Uhr-Player, MP4 |
| Faktenfehler | geprüftes Faktenblatt, WebFetch mit Zitat, Zahlen-Normalisierer |
| Verbrauch steigt schleichend | Deckel, ≤ 2 Reparaturen, gemessener Verbrauch pro Video |
| Wartungsschuld | L+ selten, `lib`-Pin samt Player, Regressions-Snapshots |
| Persönliche Daten | Eingaben nur privat, Staging-Check, Vault-Lint, `noindex` |

## 11. Quellen

- API-Guthaben: https://platform.claude.com/docs/en/about-claude/api-credits-for-subscribers
- Preise, Batch: https://platform.claude.com/docs/en/about-claude/pricing · https://platform.claude.com/docs/en/build-with-claude/batch-processing
- Multi-Agent-Kosten: https://www.anthropic.com/engineering/multi-agent-research-system
- Scheduled Tasks: https://code.claude.com/docs/en/routines
- Cloud-Umgebungen (Setup-Skript, Netz, Secrets): https://code.claude.com/docs/en/cloud-environments
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

Empfehlung: **das Repo auf privat stellen.** Das ist ein Klick unter GitHub › Settings › Danger Zone und versteckt auch die Historie. Seit der Umstellung auf Scheduled Tasks hat das keine Folgen mehr für diesen Plan: Es laufen keine GitHub-Actions-Minuten an, und Vercel deployt auch private Repos.

Die Alternative wäre, das Repo öffentlich zu lassen, die Angaben zu entfernen und die Historie neu zu schreiben (Force-Push). Das ist aufwendiger und fehleranfälliger.
