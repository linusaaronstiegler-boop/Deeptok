# DeepTok — Regelwerk für dieses Repo

TikTok-artiger Lern-Feed (PWA, Handy zuerst, iPad zweitens) für zwei Profile: Linus (18, WHU-Niveau,
Allgemeinbildung, Rhetorik, Aktuelles) und seinen Bruder (15, Klasse 10, Gymnasium Bayern, G9 NTG).
Jede Karte bringt etwas bei und wird später abgefragt. Der Plan mit allen Begründungen und Quellen:
`docs/PLAN.md`. Stand und nächste Schritte: Abschnitt „Phasen“ dort.

## Leitregeln

- **Optimiert wird auf Wissen nach 7 Tagen pro Minute, nicht auf Verweildauer.**
- **Erst tippen, dann sehen.** Jede Lern-Einheit beginnt mit einer Frage oder Vorhersage.
- **Antworten nur per Tippen oder Wischen.** Kein Freitext, Begründungen werden aus einem Menü gewählt.
- **Serien hängen zusammen.** Keine losen Häppchen, denn Zerstückelung schadet dem Behalten.
- **Inhalte für den Bruder:**
  - Beispiel vor Regel, Irrtum benennen und widerlegen.
  - Kein Lob, kein „natürlich/offensichtlich“, kein „Leichtsinnsfehler“, keine Mindset-Floskeln.
  - Rechtschreibung wird nie bewertet.
- **Bilder nur, wenn sie Inhalt tragen** (Diagramme, Karten, Zeitleisten). Keine Deko, keine Musik unter Erklärungen.
- **Fakten und News immer mit Quelle und Datum.** Zahlen vor dem Vertonen prüfen.
- **Keine persönlichen Daten in Inhalten:** keine Mails, Noten, Namen aus dem Vault. Die App ist öffentlich erreichbar (`noindex`).

## Video-Werkstatt (`studio/`)

Jedes Video ist ein HyperFrames-Projekt in `studio/<name>/`. Vorbild ist `studio/probe-opportunitaetskosten/`.

1. `build/script.py`: Skript als Szenen und Sätze. Ein Token `Anzeige|Gesprochen` trennt Untertitel von Aussprache, z. B. `344|Dreihundertvierundvierzig` oder `Barcelona|Barsselona`.
2. `python build/voice.py`: Piper-Stimme satzweise vertonen, schreibt `assets/voice.m4a` und `assets/timing.json` mit Wortzeiten (nur Werkstatt: Piper, siehe unten; die Fabrik nimmt die Casting-Siegerstimme).
3. Manim-Clips (Mathe, Diagramme): `manim -q h -o x.mp4 --media_dir build/manim build/<datei>.py <Szene>`, danach nach `assets/` kopieren (nur Werkstatt: Manim).
4. `python build/compose.py`: baut `index.html` und `compositions/*.html` aus den Wortzeiten. Jedes Element erscheint zu dem Wort, das es nennt.
5. **Hör-Check:** Die Tonspur mit faster-whisper (Modell `small`, `language="de"`) transkribieren und gegen das Skript lesen. Falsch erkannte Wörter bekommen eine Aussprache-Schreibung im Skript.
6. `npx hyperframes check`, dann `npx hyperframes snapshot --review`: Beats, Schnitte und Handy-Ansicht ansehen.
7. `npx hyperframes render -o renders/<name>.mp4` (nicht im Repo).

In der Cloud liegt `hyperframes` 0.8.206 im PATH; `npx hyperframes …` nimmt dank `NPM_CONFIG_PREFIX` dieselbe gepinnte Installation. Am PC `npx hyperframes@0.8.206 …`.

Skills dafür liegen in `.claude/skills/`: hyperframes, hyperframes-cli, hyperframes-registry, media-use, gsap-*, remotion-*, frontend-design. Vor neuen Videos `/hyperframes` lesen.

Die Cloud-Umgebung `deeptok-fabrik` richtet ihr Setup-Skript `tools/setup-umgebung.sh` ein (gecacht, alles unter `/opt/deeptok`): venv mit faster-whisper, numpy, num2words, jsonschema, pytest; Whisper `small` in `/opt/deeptok/hf`; HyperFrames-CLI 0.8.206 samt gepinntem Chrome.
- Der SessionStart-Hook (`.claude/hooks/session-start.sh`) prüft nur `/opt/deeptok/.setup-version` und übernimmt `/opt/deeptok/env.sh` (PATH, HF_HOME, HF_HUB_OFFLINE=1, HYPERFRAMES_BROWSER_PATH).
- In anderen Umgebungen ruft er das Setup-Skript als Rückfall auf (ca. 1 min, nicht gecacht) und sagt, woran es lag.
- Piper, Manim und die deutsche Stimme gibt es nur mit `DEEPTOK_WERKSTATT=1` in der Umgebung.
- Nach jeder Änderung am Setup-Skript `SETUP_VERSION` hochzählen und das Skript neu in die Umgebung einfügen. Erlaubte Hosts: `tools/umgebung-hosts.txt`.
- Hugging Face ist in Sitzungen offline; wer ein weiteres Modell laden will, setzt für diesen Befehl `HF_HUB_OFFLINE=0`.

## Videofabrik (`factory/`)

- `python factory/fabrik.py status --json` sagt, was dran ist. Befehle, Exit-Codes und Regeln (Herzschlag-Schleife, `--lauf`, `--eskalation`) stehen im Docstring von `factory/fabrik.py`.
- Der Zustand liegt auf dem Branch `factory-state` (`zustand/<nacht>.json`), nie von Hand ändern. `FABRIK_OHNE_PUSH=1` für lokale Versuche.
- Task-Prompts liegen in `factory/tasks/*.md`. Jeder Bash-Block lädt zuerst `/opt/deeptok/env.sh`, falls vorhanden (wie der Vorspann in `factory/tasks/probe.md`).
- Tests: `python -m pytest factory/tests -q`; ohne Whisper und Chrome: `-m "not langsam"`.
- Stimm-Casting: `python factory/casting.py`.
  - `--probe` prüft den Zugang kostenlos.
  - `--trocken` testet die Blindseite ohne Netz.
  - `--fortsetzen casting/<datum>` holt Abgebrochenes nach.
  - Geteilt wird nur `casting/<datum>/`, nie `casting/<datum>-aufloesung/`.

## Stil

- Palette: Navy `#0E1726` / `#1F3864`, Gold `#C9A84C`, Creme `#F5F0E8`, Rot nur für Verlust/Irrtum `#E07A5F`.
- Schriften: Playfair Display für Überschriften (mit `lining-nums`), Inter für Text.
- Hochformat 1080 × 1920, 30 fps. Lesbarer Inhalt zwischen y = 168 und 1330.

## Arbeitsweise

- In Phasen bauen. Nach jeder Phase prüfen, committen und pushen, zuerst auf einen Preview-Branch, dann `main`.
- Code-Kommentare an den Schlüsselstellen, auf Deutsch, so dass Linus mitlernt.
- Jede Sitzung trägt ein kurzes Update in `07-Projekte/DeepTok/DeepTok-Stand.md` im Vault ein (Google Drive, neueste zuerst).
