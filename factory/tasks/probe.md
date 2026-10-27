# Probe-Task: Go/No-Go der Videofabrik (Phase 0)

Gespeicherter Prompt des Scheduled Tasks: „Lies factory/tasks/probe.md und führe den Auftrag vollständig aus.“

Dieser Lauf prüft, ob eine Scheduled-Task-Sitzung alles kann, was die Nachtschicht später braucht
(docs/VIDEO-PIPELINE.md §9, Phase 0). Niemand schaut zu. Am Ende stehen ein Bericht im Repo und ein
Urteil „Go“ oder „No-Go“ in deiner letzten Nachricht.

## Regeln für diesen Lauf

1. **Keine Rückfragen.** Ist etwas unklar, nimm die vorsichtigere Möglichkeit und vermerke sie im Bericht unter „Auffälligkeiten“.
2. **Nie abbrechen.** Scheitert ein Schritt, notiere Ergebnis und Fehlermeldung (Kurzfassung) und mach mit dem nächsten Schritt weiter. Den Bericht (Schritt 9) gibt es in jedem Fall.
3. **Nur diese Spuren hinterlassen:** Dateien unter `/tmp/probe/` und `/tmp/probe.mp4`, die Zustands-Arbeitskopie `.fabrik-zustand/` (legt `fabrik.py` selbst an) und genau eine neue Datei `factory/berichte/probe-<DATUM>.md` (bei einer zweiten Probe am selben Tag mit angehängter Uhrzeit, siehe 9a).
   - Gepusht werden nur der Branch `factory-state` (das macht `fabrik.py`) und der neue Branch `claude/probe-<DATUM>`.
   - Nichts löschen, kein `--force`, keine Pull Requests, keine anderen Dateien ändern oder committen.
4. **Datenschutz:** Aus Google Drive kommen nur die in Schritt 4 genannten Messwerte in Protokoll, Bericht und Schlussnachricht. Keine Inhalte, keine Dateititel, keine Namen, keine Datei- oder Ordner-IDs, keine Links. Das Repo ist öffentlich.
5. **Keine Schlüssel:** Nie `env`, `printenv` oder `set` ausgeben, keine HTTP-Header protokollieren. Fehlermeldungen von Git oder dem Proxy nur gekürzt übernehmen, ohne URLs mit Zugangsdaten.
6. **Auto-Modus:** Wird eine Aktion blockiert oder abgelehnt, notiere unter „Auffälligkeiten“, welche Aktion es war und was gemeldet wurde. Keine Umwege, um eine Sperre zu umgehen.
7. **Sparsam bleiben:** Diese Probe misst auch den Verbrauch des Abo-Kontingents. Lies keine Dateien, die hier nicht verlangt sind, und gib lange Ausgaben nicht vollständig aus.
8. **Technik:**
   - Der Shell-Zustand (Variablen, Funktionen, Ordner) überlebt keinen Bash-Aufruf. Deshalb beginnt jeder Block mit `. /tmp/probe/vorspann.sh`.
   - Führe die Blöcke unverändert aus, einen Block pro Bash-Aufruf.
   - Blöcke mit ⏱ brauchen beim Bash-Werkzeug `timeout: 600000` (10 min).

## Go-Regel

Jede Prüfung landet als Zeile im Protokoll `/tmp/probe/protokoll.tsv`. Das Ergebnis ist eines von vier Wörtern: `bestanden`, `nicht bestanden`, `Hinweis` oder `übersprungen`.

| Punkt | Pflicht für Go? | bestanden, wenn |
|---|---|---|
| 1 Start | nein (bei Rückfall: Auflage für Linus) | `.setup-version` stammt aus dem Umgebungs-Cache |
| 2 Werkzeuge | ja | python im PATH ist ein venv, faster-whisper lädt, hyperframes meldet 0.8.206, ffmpeg da |
| 3 Zustand | ja | Exit-Codes wie erwartet, `factory-state` liegt auf origin |
| 4 Drive | ja | Digest gefunden und lesbar |
| 5 Subagenten | ja | beide antworten 8, jeder mit dem richtigen Modell |
| 6 Render | ja | check ohne Fehler, Render unter 600 s, MP4 nicht leer |
| 7 Hör-Check | ja | Messung liegt vor, WER < 0,15, Lautheit zwischen −19 und −13 LUFS |
| 8 Lint | ja | diese Datei ohne Treffer, Testdatei mit Treffer |
| 9 Bericht | ja | Push auf `claude/probe-<DATUM>` klappt |

**Go** heißt: Kein Pflichtpunkt steht auf `nicht bestanden`. Sonst **No-Go**. Dass das G4-Urteil der alten Piper-Tonspur negativ ausfällt, ist erwartet und zählt nicht (22,05 kHz, 85 kbps, Spitzenpegel über −1 dBTP).

---

## 0. Vorbereitung

Ein Bash-Aufruf im Repo-Ordner (dem Arbeitsordner der Sitzung). Der Block legt Lauf-ID und Datum fest und schreibt den Vorspann für alle weiteren Blöcke.

```bash
mkdir -p /tmp/probe
REPO="$(git rev-parse --show-toplevel)" || { echo "FEHLER: Arbeitsordner ist kein Git-Repo"; exit 1; }
# Lauf-ID mit UTC-Zeitstempel; Datum für Bericht und Branch in Berliner Ortszeit
LAUF="probe-$(date -u +%Y%m%dT%H%M%SZ)"
DATUM="$(TZ=Europe/Berlin date +%F)"
date +%s > /tmp/probe/start_epoch
# Festhalten, was der SessionStart-Hook eingerichtet hat, BEVOR wir selbst etwas laden
{ echo "python=$(command -v python || echo fehlt)"
  echo "hyperframes=$(command -v hyperframes || echo fehlt)"
  echo "DEEPTOK_HOME=${DEEPTOK_HOME:-nicht gesetzt}"; } > /tmp/probe/roh.txt
: > /tmp/probe/protokoll.tsv
{ printf 'cd %q || exit 1\nLAUF=%q\nDATUM=%q\n' "$REPO" "$LAUF" "$DATUM"
  cat <<'EOF'
P=/tmp/probe
# Umgebung des Setup-Skripts laden, falls der Hook das nicht schon getan hat (mehrfach unschädlich).
[ -f /opt/deeptok/env.sh ] && . /opt/deeptok/env.sh
PY="$(command -v python || command -v python3)"

# notiere PUNKT PRÜFUNG ERGEBNIS [MESSWERT]: eine Zeile ins Protokoll
notiere() {
  printf '%s\t%s\t%s\t%s\n' "$1" "$2" "$3" "${4:-}" >> "$P/protokoll.tsv"
  echo "[protokoll] $1 | $2 | $3 | ${4:-}"
}

# laufe NAME SOLL-EXIT BEFEHL...: führt den Befehl aus, legt die Ausgaben unter $P/NAME.out
# und $P/NAME.err ab, vergleicht den Exit-Code mit SOLL-EXIT und notiert das unter Punkt $PUNKT.
# Gibt 0 zurück, wenn der Exit-Code der erwartete war.
laufe() {
  local name="$1" soll="$2" t0 rc dauer
  shift 2
  t0=$(date +%s.%N)
  "$@" > "$P/$name.out" 2> "$P/$name.err"; rc=$?
  dauer=$(awk -v a="$t0" -v b="$(date +%s.%N)" 'BEGIN { printf "%.1f", b - a }')
  echo "== $name: Exit $rc (erwartet $soll) nach $dauer s"
  head -c 1200 "$P/$name.out"; echo
  if [ -s "$P/$name.err" ]; then echo "-- stderr (Ende):"; tail -n 4 "$P/$name.err"; fi
  if [ "$rc" = "$soll" ]; then notiere "${PUNKT:-?}" "$name" bestanden "Exit $rc, $dauer s"; return 0; fi
  notiere "${PUNKT:-?}" "$name" "nicht bestanden" "Exit $rc statt $soll, $dauer s"; return 1
}

# feld DATEI SCHLÜSSEL...: einen Wert aus einer JSON-Datei lesen, z. B. feld $P/x.out messung wer
feld() {
  "$PY" - "$@" 2>/dev/null <<'PYEOF'
import json, sys
d = json.load(open(sys.argv[1], encoding="utf-8"))
for k in sys.argv[2:]:
    d = d.get(k) if isinstance(d, dict) else None
print("" if d is None else d)
PYEOF
}
EOF
} > /tmp/probe/vorspann.sh
. /tmp/probe/vorspann.sh && echo "Vorspann ok. Repo: $(pwd)  Lauf: $LAUF  Datum: $DATUM" && cat "$P/roh.txt"
```

Merke dir den Repo-Pfad aus der Ausgabe; Schritt 5 braucht ihn.

## 1. Start

```bash
. /tmp/probe/vorspann.sh; PUNKT=1
berlin() { TZ=Europe/Berlin date -d "@$1" '+%F %T'; }
start=$(cat "$P/start_epoch")
# Container-Start = jetzt minus Laufzeit des Systems
container=$(( $(date +%s) - $(cut -d. -f1 /proc/uptime) ))
# Klon-Zeit: Geburtszeit des .git-Ordners, sonst Änderungszeit von .git/HEAD
klon=$(stat -c %W .git); [ "$klon" -gt 0 ] 2>/dev/null || klon=$(stat -c %Y .git/HEAD)
echo "Container-Start: $(berlin "$container")"
echo "Repo geklont:    $(berlin "$klon")  (+$((klon - container)) s)"
hooklog=/opt/deeptok/logs/hook-setup.log
rueckfall=nein
if [ -f "$hooklog" ] && [ "$(stat -c %Y "$hooklog")" -ge "$container" ]; then
  rueckfall=ja
  echo "Hook-Rückfall:   fertig $(berlin "$(stat -c %Y "$hooklog")")  (+$(( $(stat -c %Y "$hooklog") - container )) s)"
  tail -n 2 "$hooklog"
fi
[ -f /opt/deeptok/logs/hook-modell.log ] && echo "Whisper-Modell lädt/lud im Hintergrund (hook-modell.log vorhanden)"
echo "Probe-Start:     $(berlin "$start")  (+$((start - container)) s)"
echo "Soll-Version im Repo: $(sed -n 's/^SETUP_VERSION="\(.*\)"$/\1/p' tools/setup-umgebung.sh)"
if [ -f /opt/deeptok/.setup-version ]; then
  v=$(cat /opt/deeptok/.setup-version); t=$(stat -c %Y /opt/deeptok/.setup-version)
  echo ".setup-version:  $v, geschrieben $(berlin "$t")"
  if [ "$t" -lt "$container" ]; then
    notiere 1 "Setup aus Umgebungs-Cache" bestanden "Version $v, vor dem Container-Start geschrieben"
  elif [ "$rueckfall" = ja ]; then
    notiere 1 "Setup aus Umgebungs-Cache" "nicht bestanden" "Version $v erst vom Hook-Rückfall geschrieben"
  else
    notiere 1 "Setup aus Umgebungs-Cache" Hinweis "Version $v bei diesem Start geschrieben (Cache war noch nicht da)"
  fi
else
  notiere 1 "Setup aus Umgebungs-Cache" "nicht bestanden" "/opt/deeptok/.setup-version fehlt, Rückfall $rueckfall"
fi
[ -f /opt/deeptok/logs/zeiten.txt ] && { echo "Setup-Zeiten je Teil (s):"; cat /opt/deeptok/logs/zeiten.txt; }
notiere 1 "Startdauer bis Probe-Start" Hinweis "$((start - container)) s ab Container-Start, Klon nach $((klon - container)) s, Hook-Rückfall: $rueckfall"
```

Schau außerdem in deinen Sitzungsbeginn: Der SessionStart-Hook hat eine oder mehrere Zeilen mit „DeepTok“ ausgegeben. Übernimm die erste davon wörtlich in die Auffälligkeiten des Berichts.

## 2. Werkzeuge (⏱)

Fehlt der npm-Cache (Hook-Rückfall), lädt `npx` die HyperFrames-CLI erst herunter (über 100 MB). Deshalb auch hier `timeout: 600000`.

```bash
. /tmp/probe/vorspann.sh; PUNKT=2
venv_von() { "$1" -c 'import sys; print(sys.prefix if sys.prefix != sys.base_prefix else "kein venv")' 2>/dev/null || echo "nicht ausführbar"; }
# a) python: Der Hook muss PATH so gesetzt haben, dass "python" aus dem venv kommt.
roh=$(sed -n 's/^python=//p' "$P/roh.txt")
r=$(venv_von "$roh"); n=$(venv_von "$PY")
echo "python ohne eigenes Laden: $roh -> $r"; echo "python nach env.sh: $PY -> $n"; "$PY" -V
case "$r" in
  kein*|nicht*) notiere 2 "python im PATH ist venv" "nicht bestanden" "ohne env.sh: $r; mit env.sh: $n" ;;
  /opt/deeptok/venv) notiere 2 "python im PATH ist venv" bestanden "$r, $("$PY" -V 2>&1)" ;;
  *) notiere 2 "python im PATH ist venv" bestanden "anderes venv: $r (erwartet /opt/deeptok/venv)" ;;
esac
# b) faster-whisper und das vorgeladene Modell "small"
if fw=$("$PY" -c 'import faster_whisper, numpy; print(faster_whisper.__version__)' 2>"$P/fw.err"); then
  notiere 2 "faster-whisper importierbar" bestanden "Version $fw"
else
  notiere 2 "faster-whisper importierbar" "nicht bestanden" "$(tail -n 1 "$P/fw.err" | cut -c1-150)"
fi
if ls "${HF_HOME:-$HOME/.cache/huggingface}"/hub/models--Systran--faster-whisper-small/snapshots/*/model.bin >/dev/null 2>&1; then
  notiere 2 "Whisper-Modell small im Cache" bestanden "vorhanden"
else
  notiere 2 "Whisper-Modell small im Cache" Hinweis "fehlt (lädt evtl. im Hintergrund nach)"
fi
# c) HyperFrames-CLI in der gepinnten Version, so aufgerufen wie in fabrik.py
t0=$(date +%s)
hv=$(npx --yes hyperframes@0.8.206 --version 2>"$P/npx.err" | tail -n 1)
if [ "$hv" = "0.8.206" ]; then
  notiere 2 "hyperframes 0.8.206" bestanden "npx meldet $hv nach $(( $(date +%s) - t0 )) s"
else
  notiere 2 "hyperframes 0.8.206" "nicht bestanden" "npx meldet '${hv:-nichts}': $(tail -n 1 "$P/npx.err" | cut -c1-150)"
fi
if [ -x "${HYPERFRAMES_BROWSER_PATH:-/nicht/gesetzt}" ]; then
  notiere 2 "Chrome für HyperFrames" bestanden "HYPERFRAMES_BROWSER_PATH gesetzt"
else
  notiere 2 "Chrome für HyperFrames" Hinweis "HYPERFRAMES_BROWSER_PATH fehlt, CLI sucht selbst"
fi
# d) ffmpeg
fv=$(ffmpeg -hide_banner -version 2>/dev/null | head -n 1 | cut -d' ' -f1-3)
[ -n "$fv" ] && notiere 2 "ffmpeg" bestanden "$fv" || notiere 2 "ffmpeg" "nicht bestanden" "fehlt"
# e) Netz-Stichprobe: Codes 000/403 beim CONNECT bedeuten "Host fehlt in der Liste der Umgebung"
for h in huggingface.co cdn.jsdelivr.net fonts.googleapis.com www.tagesschau.de upload.wikimedia.org; do
  c=$(curl -sS -o /dev/null -m 10 -I -w '%{http_code}/%{http_connect}' "https://$h/" 2>/dev/null)
  echo "$h -> ${c:-000/000}"
  case "${c:-000/000}" in
    000/*) notiere 2 "Netz $h" Hinweis "nicht erreichbar (${c:-000/000})" ;;
    *) notiere 2 "Netz $h" bestanden "HTTP ${c%%/*}" ;;
  esac
done
```

## 3. Zustand auf dem Branch `factory-state`

**3a.** Erst nachsehen, was die Fabrik für die aktuelle Nacht meldet:

```bash
. /tmp/probe/vorspann.sh; PUNKT=3
laufe status-vorher 0 "$PY" factory/fabrik.py status --json
echo "naechster_schritt: $(feld "$P/status-vorher.out" naechster_schritt)"
```

Entscheide nach `naechster_schritt`:
- `slate`: weiter mit 3b (Normalfall in Phase 0).
- leer, weil `status` gescheitert ist: Meldung (gekürzt) unter „Auffälligkeiten“ festhalten, trotzdem weiter mit 3b.
- `pause`: Nur `. /tmp/probe/vorspann.sh; PUNKT=3; laufe beginne-bei-pause 4 "$PY" factory/fabrik.py beginne --lauf "$LAUF" --json` ausführen, dann weiter mit 3d. Der Push ist dann nur über 3d prüfbar; erwähne die PAUSE im Bericht.
- `laeuft`, `produktion` oder `fertig`: Eine echte Nacht ist im Gang. Nicht eingreifen. `notiere 3 "Zustandstest" übersprungen "echte Nacht: <Wert>"` (mit Vorspann), dann weiter mit 3d.

**3b.** Lauf übernehmen, Doppellauf-Schutz, Herzschlag, Ende. Dabei pusht `fabrik.py` jede Änderung sofort. Beim ersten Mal legt es den Branch `factory-state` an.

```bash
. /tmp/probe/vorspann.sh; PUNKT=3
# Nur im Rückfall aus 3c steht hier zusätzlich: export FABRIK_OHNE_PUSH=1; S=-lokal
if laufe "beginne${S:-}" 0 "$PY" factory/fabrik.py beginne --lauf "$LAUF" --json; then
  # Ein zweiter Lauf mit anderer ID muss abgewiesen werden (Exit 3), solange unser Herzschlag frisch ist.
  laufe "doppellauf${S:-}" 3 "$PY" factory/fabrik.py beginne --lauf "$LAUF-zwei" --json
  laufe "herzschlag${S:-}" 0 "$PY" factory/fabrik.py herzschlag --lauf "$LAUF" --json
  laufe "herzschlag-fremd${S:-}" 3 "$PY" factory/fabrik.py herzschlag --lauf "$LAUF-zwei" --json
  laufe "ende${S:-}" 0 "$PY" factory/fabrik.py ende --lauf "$LAUF" --notiz "Go/No-Go-Probe" --json
  laufe "status-danach${S:-}" 0 "$PY" factory/fabrik.py status --json
else
  echo "beginne gescheitert. Ursache in $P/beginne${S:-}.out und $P/beginne${S:-}.err (Push?)"
fi
```

**3c. Nur wenn `beginne` gescheitert ist:** Steht in der Meldung etwas von `push` (abgelehnt, 403, nicht berechtigt), dann klappt der Push auf `factory-state` nicht. Das ist ein No-Go-Befund, der schon im Protokoll steht. Prüfe danach trotzdem die Logik ohne Netz: Führe den Block aus 3b noch einmal aus und setze dabei direkt hinter die Vorspann-Zeile `export FABRIK_OHNE_PUSH=1; S=-lokal`. Mit `FABRIK_OHNE_PUSH=1` schreibt `fabrik.py` in einen eigenen Spielstand und lässt den echten Zustand in Ruhe. Bei einer anderen Ursache 3c auslassen und die Meldung (gekürzt) unter „Auffälligkeiten“ festhalten.

**3d.** Liegt der Branch auf dem Remote?

```bash
. /tmp/probe/vorspann.sh; PUNKT=3
git ls-remote --heads origin factory-state > "$P/ls-remote.txt" 2> "$P/ls-remote.err"; cat "$P/ls-remote.txt"
if grep -q 'refs/heads/factory-state' "$P/ls-remote.txt"; then
  notiere 3 "factory-state auf origin" bestanden "Commit $(cut -c1-10 "$P/ls-remote.txt")"
else
  notiere 3 "factory-state auf origin" "nicht bestanden" "Branch fehlt: $(tail -n 1 "$P/ls-remote.err" | cut -c1-120)"
fi
[ -d .fabrik-zustand ] && git -C .fabrik-zustand log --oneline -4
# Ist der erste Commit des Branches signiert? Verlangt GitHub signierte Commits, hängt der erste Push davon ab.
wurzel=$(git rev-list --max-parents=0 refs/fabrik/zustand-remote 2>/dev/null | head -n 1)
if [ -n "$wurzel" ]; then
  n=$(git cat-file -p "$wurzel" | grep -c '^gpgsig')
  notiere 3 "Wurzel-Commit von factory-state signiert" Hinweis "$([ "$n" -gt 0 ] && echo ja || echo nein)"
fi
```

## 4. Google-Drive-Connector (Digest)

Nutze die Werkzeuge des Google-Drive-Connectors (Namen ähnlich wie `search_files` und `read_file_content`). Sind sie nur als Namen bekannt, lade sie zuerst über ToolSearch mit dem Suchbegriff `google drive`. Fehlt der Connector ganz, notiere `nicht bestanden` mit „Connector fehlt in der Sitzung“ und mach mit Schritt 5 weiter.

`search_files` sortiert nicht nach Datum. Damit die jüngste Datei sicher dabei ist, grenzt du die Suche auf die letzten 14 Tage ein und blätterst alle Seiten durch. Die Grenze liefert dieser Block:

```bash
date -u -d '14 days ago' +%Y-%m-%dT00:00:00Z
```

`<GRENZE>` ist im Folgenden diese Ausgabe. Liefert eine Antwort ein `next_page_token`, rufst du `search_files` mit derselben `query` und `pageToken: <Token>` erneut auf, bis keine Seite mehr kommt.

1. Ordner suchen: `search_files` mit `query`: `title = 'Digests' and mimeType = 'application/vnd.google-apps.folder'` und `excludeContentSnippets: true`.
2. Gibt es den Ordner: `search_files` mit `query`: `parentId = '<ID des Ordners>' and modifiedTime > '<GRENZE>'`, `excludeContentSnippets: true`, `pageSize: 50`, alle Seiten. Nimm die Datei mit dem jüngsten `modifiedTime`.
3. Gibt es keinen Ordner oder darin nichts aus den letzten 14 Tagen: `search_files` mit `query`: `title contains 'Digest' and mimeType != 'application/vnd.google-apps.folder' and modifiedTime > '<GRENZE>'`, `excludeContentSnippets: true`, `pageSize: 50`, alle Seiten. Nimm wieder die jüngste Datei nach `modifiedTime`. Findet auch das nichts, ist Punkt 4 `nicht bestanden` mit „kein Digest in den letzten 14 Tagen“.
4. Lies diese Datei mit `read_file_content`.
5. Stelle nur fest:
   - War sie lesbar?
   - Wann wurde sie geändert (`modifiedTime`, als Berliner Ortszeit `JJJJ-MM-TT HH:MM`)?
   - Gibt es einen Abschnitt „Vorlernen morgen“ (Überschrift oder Zeile, Groß- und Kleinschreibung egal)?
   - Wie viele verschiedene Fächer nennt dieser Abschnitt? Jedes Fach zählt einmal; ohne Abschnitt ist die Zahl 0.

Dann protokollieren. Die Platzhalter in spitzen Klammern ersetzt du durch deine Befunde, sonst nichts:

```bash
. /tmp/probe/vorspann.sh
notiere 4 "Drive: Digest lesbar" "<bestanden|nicht bestanden>" "geändert <JJJJ-MM-TT HH:MM>"
notiere 4 "Drive: Abschnitt Vorlernen morgen" Hinweis "<vorhanden|fehlt>, <Zahl> Fächer"
```

Die Datei-ID verwendest du nur in den Drive-Werkzeugaufrufen, nie in Bash-Befehlen, Dateien oder Nachrichten. Den Inhalt gibst du nirgends wieder.

## 5. Subagenten mit Sonnet und Opus

Du startest nacheinander zwei Subagenten mit dem Agent-Werkzeug (in manchen Versionen heißt es „Task“): Typ `general-purpose`, einmal mit `model: "sonnet"`, einmal mit `model: "opus"`. Vor, zwischen und nach den beiden Aufrufen setzt du eine Zeitmarke:

```bash
. /tmp/probe/vorspann.sh; date +%s.%N >> "$P/subagent-zeiten.txt"; wc -l < "$P/subagent-zeiten.txt"
```

Ablauf: Zeitmarke, Subagent `sonnet`, Zeitmarke, Subagent `opus`, Zeitmarke. Beide bekommen denselben Auftrag; `<REPO>` ist der Pfad aus Schritt 0:

> Lies mit dem Read-Werkzeug die Datei `<REPO>/studio/probe-opportunitaetskosten/build/script.py`. Zähle die Einträge der Liste `SCENES`. Antworte in genau einer Zeile im Format `<Zahl> | <dein Modellname laut Systemprompt>`, ohne weiteren Text. Benutze keine anderen Werkzeuge.

Die richtige Zahl ist 8. Dauer aus den Zeitmarken:

```bash
. /tmp/probe/vorspann.sh
awk 'NR > 1 { printf "Abschnitt %d: %.1f s\n", NR - 1, $1 - vor } { vor = $1 }' "$P/subagent-zeiten.txt"
```

Protokolliere beide. `bestanden` gilt nur, wenn die Zahl 8 ist und der gemeldete Modellname zum verlangten Modell passt (Sonnet bzw. Opus). Kam ein Fehler zurück, z. B. weil das Modell im Abo nicht verfügbar ist, notiere `nicht bestanden` mit der Meldung (gekürzt).

```bash
. /tmp/probe/vorspann.sh
notiere 5 "Subagent sonnet" "<bestanden|nicht bestanden>" "Antwort <Zahl>, Modell <Name>, <Sekunden> s"
notiere 5 "Subagent opus" "<bestanden|nicht bestanden>" "Antwort <Zahl>, Modell <Name>, <Sekunden> s"
```

## 6. Check und Render (je ⏱)

`check` und `render` belegen je einen Chrome-Platz (höchstens zwei gleichzeitig). `render` bricht nach 570 s von selbst ab.

```bash
. /tmp/probe/vorspann.sh; PUNKT=6
laufe check 0 "$PY" factory/fabrik.py check studio/probe-opportunitaetskosten --json
```

```bash
. /tmp/probe/vorspann.sh; PUNKT=6
laufe render 0 "$PY" factory/fabrik.py render studio/probe-opportunitaetskosten -o /tmp/probe.mp4 --json
d=$(feld "$P/render.out" dauer_s); mb=$(feld "$P/render.out" groesse_mb)
lang=$(ffprobe -v error -show_entries format=duration -of csv=p=0 /tmp/probe.mp4 2>/dev/null)
echo "Renderdauer ${d:-?} s, ${mb:-?} MB, Videolänge ${lang:-?} s"
# Bestanden: Render-Dauer unter 600 s und eine nicht leere MP4-Datei
if [ -n "$d" ] && [ -s /tmp/probe.mp4 ] && awk -v d="$d" 'BEGIN { exit !(d < 600) }'; then
  notiere 6 "Render unter 10 min" bestanden "$d s, $mb MB, Video ${lang%.*} s"
else
  notiere 6 "Render unter 10 min" "nicht bestanden" "Dauer ${d:-?} s, ${mb:-0} MB"
fi
```

## 7. Hör-Check (⏱)

```bash
. /tmp/probe/vorspann.sh; PUNKT=7
# Hilfsdatei mit dem Sprechtext: alle Sätze aller Szenen. Tokens "Anzeige|Gesprochen" bleiben
# stehen; hoercheck löst sie selbst auf und lässt beide Formen gelten.
"$PY" - <<'EOF'
import importlib.util
spec = importlib.util.spec_from_file_location("skript", "studio/probe-opportunitaetskosten/build/script.py")
modul = importlib.util.module_from_spec(spec)
spec.loader.exec_module(modul)
text = " ".join(satz for szene in modul.SCENES for satz in szene["sentences"])
open("/tmp/probe/sprechtext.txt", "w", encoding="utf-8").write(text + "\n")
print(len(text.split()), "Wörter im Sprechtext")
EOF
# Lädt der Hook das Whisper-Modell noch im Hintergrund, auf dessen Sperre warten (höchstens 4 min).
[ -f /opt/deeptok/.modell.lock ] && flock -w 240 /opt/deeptok/.modell.lock true
t0=$(date +%s)
# --erlaubte-stillen 2: Das Skript hat zwei geplante Pausen (Denkpause nach der Frage, Halten am Ende).
"$PY" factory/fabrik.py hoercheck --audio studio/probe-opportunitaetskosten/assets/voice.m4a \
  --text "$P/sprechtext.txt" --erlaubte-stillen 2 --json > "$P/hoercheck.out" 2> "$P/hoercheck.err"; rc=$?
echo "Exit $rc nach $(( $(date +%s) - t0 )) s (0 = G4 bestanden, 1 = G4 nicht bestanden; beide liefern Messwerte)"
"$PY" - <<'EOF'
import json
d = json.load(open("/tmp/probe/hoercheck.out", encoding="utf-8"))
m = d.get("messung") or {}
for k in ("wer", "lufs", "true_peak_db", "dauer_s", "woerter_pro_s", "abtastrate_hz", "bitrate_kbps"):
    print(f"{k}: {m.get(k)}")
print("lange_stillen:", m.get("lange_stillen"))
print("verstoesse:", d.get("verstoesse"), d.get("fehler", ""))
EOF
tail -n 3 "$P/hoercheck.err"
wer=$(feld "$P/hoercheck.out" messung wer); lufs=$(feld "$P/hoercheck.out" messung lufs)
if [ -n "$wer" ] && [ -n "$lufs" ] && awk -v w="$wer" -v l="$lufs" 'BEGIN { exit !(w < 0.15 && l > -19 && l < -13) }'; then
  notiere 7 "Hör-Check misst" bestanden "WER $wer, $lufs LUFS, $(( $(date +%s) - t0 )) s"
else
  notiere 7 "Hör-Check misst" "nicht bestanden" "WER ${wer:-?}, LUFS ${lufs:-?}, Exit $rc"
fi
if [ "$rc" = 0 ]; then notiere 7 "G4-Urteil alte Piper-Spur" Hinweis "bestanden"
else notiere 7 "G4-Urteil alte Piper-Spur" Hinweis "nicht bestanden (erwartet): $(feld "$P/hoercheck.out" verstoesse | cut -c1-160)"; fi
```

## 8. Lint (Tor G1)

```bash
. /tmp/probe/vorspann.sh; PUNKT=8
# Diese Auftragsdatei selbst darf keine Sperrwörter und keine persönlichen Daten enthalten.
laufe lint-auftrag 0 "$PY" factory/fabrik.py lint factory/tasks/probe.md --json
# Gegenprobe: eine Datei mit absichtlichem Sperrwort. Das Wort wird aus zwei Hälften
# zusammengesetzt, damit es nicht wörtlich in dieser Auftragsdatei steht. Erwartet: Exit 1.
printf 'Das ist doch %s%s.\n' 'ein' 'fach' > "$P/sperrwort.txt"
laufe lint-gegenprobe 1 "$PY" factory/fabrik.py lint "$P/sperrwort.txt" --json
```

Schreib das Sperrwort selbst nicht in den Bericht. Dort steht nur, ob es erkannt wurde.

## 9. Bericht

**9a.** Ziel festlegen, Protokoll als Tabelle ausgeben, Pflichtpunkte prüfen:

```bash
. /tmp/probe/vorspann.sh
ZWEIG="claude/probe-$DATUM"; BERICHT="factory/berichte/probe-$DATUM.md"
# Gibt es Branch oder Datei schon (zweite Probe am selben Tag), kommt die Uhrzeit dazu.
if git ls-remote --exit-code --heads origin "$ZWEIG" >/dev/null 2>&1 || [ -e "$BERICHT" ]; then
  s=$(TZ=Europe/Berlin date +%H%M); ZWEIG="$ZWEIG-$s"; BERICHT="factory/berichte/probe-$DATUM-$s.md"
fi
printf 'ZWEIG=%q\nBERICHT=%q\n' "$ZWEIG" "$BERICHT" > "$P/ziel.sh"
g=$(( $(date +%s) - $(cat "$P/start_epoch") ))
echo "Bericht: $BERICHT   Branch: $ZWEIG   Lauf: $LAUF   Dauer bisher: $((g / 60)) min $((g % 60)) s"
echo "Nacht laut fabrik.py: $(feld "$P/status-vorher.out" nacht)"
# Protokoll -> Markdown-Tabelle (senkrechte Striche in Werten werden maskiert)
"$PY" - > "$P/tabelle.md" <<'EOF'
zeilen = [z.rstrip("\n").split("\t") for z in open("/tmp/probe/protokoll.tsv", encoding="utf-8") if z.strip()]
print("| Punkt | Prüfung | Ergebnis | Messwert |")
print("|---|---|---|---|")
for z in zeilen:
    z = (z + ["", "", "", ""])[:4]
    print("| " + " | ".join(w.replace("|", "\\|") for w in z) + " |")
EOF
cat "$P/tabelle.md"
echo "--- Pflichtpunkte (2 bis 8) mit 'nicht bestanden':"
awk -F'\t' '$1 >= 2 && $1 <= 8 && $3 == "nicht bestanden" { print "  " $1 " " $2 ": " $4; n++ } END { if (!n) print "  keine" }' "$P/protokoll.tsv"
echo "--- Geänderte Dateien im Repo (nur zur Info, werden NICHT committet):"
git status --short | head -n 20
```

**9b.** Schreib den Bericht mit dem Write-Werkzeug nach `<REPO>/<BERICHT>` (Pfad aus 9a). Gliederung:

```markdown
# Probe Go/No-Go, <DATUM>

- Lauf `<LAUF>`, Start <HH:MM> Uhr (Europe/Berlin), Dauer bis zum Bericht <M> min
- Nacht laut fabrik.py: <JJJJ-MM-TT>
- Umgebung: Setup-Version <Version oder „fehlt“>, Hook-Rückfall <ja/nein>, Startdauer <S> s ab Container-Start
- Ergebnis: **Go** oder **No-Go**: <ein Satz Begründung>
  (Der Push dieses Berichts, Punkt 9, steht in der Schlussnachricht der Sitzung.)

## Prüfpunkte

<Tabelle aus /tmp/probe/tabelle.md, unverändert eingefügt>

## Laufzeiten

| Schritt | Dauer |
|---|---|
| Container-Start bis Probe-Start | … |
| npx hyperframes --version | … |
| Zustand (beginne bis ende) | … |
| Subagent sonnet / opus | … / … |
| check / render | … / … |
| Hör-Check | … |
| Probe gesamt | … |

## Auffälligkeiten

- Meldung des SessionStart-Hooks: „…“
- Im Auto-Modus blockierte oder abgelehnte Aktionen: … (oder „keine“)
- Nicht erreichbare Hosts: … (oder „keine“)
- Geänderte Dateien nach check/render (aus 9a): … (oder „keine“)
- Sonstiges: Rückfall auf FABRIK_OHNE_PUSH, nachgeladenes Whisper-Modell, Abweichungen von dieser Anleitung …

## Für Linus

- Verbrauch: Stand auf claude.ai/settings/usage notieren (5-Stunden-Fenster und Woche) und mit dem Wert vor dem Start vergleichen.
- Auflagen: <z. B. „tools/setup-umgebung.sh als Setup-Skript der Umgebung eintragen“> (oder „keine“)
```

Die Zeiten stehen im Protokoll (Spalte Messwert) und in den Ausgaben der Schritte. Nichts erfinden: Fehlt ein Wert, schreib „nicht gemessen“.

**9c.** Der Bericht muss G1 bestehen (keine Sperrwörter, keine persönlichen Daten). Bei Treffern umformulieren oder entfernen, dann erneut prüfen:

```bash
. /tmp/probe/vorspann.sh; . "$P/ziel.sh"
"$PY" factory/fabrik.py lint "$BERICHT"; echo "lint Exit $?"
```

**9d.** Nur den Bericht committen und auf den neuen Branch pushen:

```bash
. /tmp/probe/vorspann.sh; . "$P/ziel.sh"
git switch -c "$ZWEIG"
git add -- "$BERICHT"
# Mit Pfadangabe committet git nur diese eine Datei, auch wenn sonst etwas geändert ist.
git commit -m "Probe $DATUM: Go/No-Go-Bericht" -- "$BERICHT"
git show --stat --oneline HEAD | head -n 4
git push -u origin "HEAD:$ZWEIG"; echo "push Exit $?"
git ls-remote --heads origin "$ZWEIG"
```

Scheitert der Push, wiederhole nur die Zeile `git push -u origin "HEAD:$ZWEIG"` (mit Vorspann und `. "$P/ziel.sh"`) bis zu dreimal. Klappt es dann immer noch nicht, ist Punkt 9 nicht bestanden. Der Bericht bleibt lokal und kommt vollständig in deine Schlussnachricht.

## 10. Schlussnachricht

Deine letzte Nachricht in der Sitzung, kurz, nach diesem Muster:

```
Probe <DATUM>: Go. Alle Pflichtpunkte bestanden. Auflagen: <…> (oder: keine)
  oder
Probe <DATUM>: No-Go. Nicht bestanden: <Punkt und Prüfung>, <Grund in einem Halbsatz>.
Bericht: <BERICHT> auf Branch <ZWEIG> (oder: Push gescheitert, Bericht folgt unten)
Linus: Bitte jetzt claude.ai/settings/usage öffnen und den Stand notieren (5-Stunden-Fenster und Woche).
```

Punkt 9 zählt hier mit: Ist der Push des Berichts gescheitert, lautet das Urteil No-Go. Drive-Inhalte, Datei-IDs und Namen kommen auch hier nicht vor.
