#!/usr/bin/env bash
# Die Teil-Funktionen werden über "messe" aufgerufen; shellcheck sieht das nicht.
# shellcheck disable=SC2329
# =============================================================================
# DeepTok-Fabrik: Setup-Skript der Cloud-Umgebung "deeptok-fabrik"
# =============================================================================
# Wohin damit: Umgebung "deeptok-fabrik" bearbeiten → "Setup script" → den
# GANZEN Inhalt dieser Datei einfügen. Das Skript ist in sich geschlossen:
# Es braucht keine Datei aus dem Repo, alle Versionen stehen hier drin.
#
# Was es einrichtet (alles unter /opt/deeptok, nichts im Repo):
#   venv/      Python mit faster-whisper, numpy, num2words, jsonschema, pytest, Pillow
#   hf/        Whisper-Modell "small" für den Hör-Check (HF_HOME)
#   node/      HyperFrames-CLI, fest auf eine Version gepinnt
#   chrome/    der Chrome, den genau diese HyperFrames-Version zum Rendern will
#   env.sh     PATH und Variablen; der SessionStart-Hook übernimmt sie
#   .setup-version   Kennung; nur geschrieben, wenn der Kern wirklich läuft
#   logs/      ausführliche Logs je Teil
#
# Warum so: Das Setup-Skript läuft als root VOR Claude Code. Ist es in rund
# 5 Minuten fertig, speichert Anthropic das Dateisystem als Schnappschuss.
# Jede neue Sitzung, auch jeder Scheduled Task, startet dann aus diesem
# Schnappschuss, und der SessionStart-Hook muss nur noch prüfen. Das Repo wird
# bei jedem Start frisch geklont, deshalb liegt nichts davon im Repo.
#
# Vier Regeln, nach denen das Skript gebaut ist:
#   1. Es endet immer mit Exit 0, sonst startet gar keine Sitzung.
#   2. Unabhängige Teile laufen parallel (apt | Python+Modell | Node+Chrome).
#   3. Jeder Teil prüft zuerst, ob er schon fertig ist. Ein zweiter Lauf
#      dauert deshalb nur Sekunden.
#   4. Gesamtfrist 270 s: Kein Schritt läuft darüber hinaus. Das Modell startet
#      nur, wenn noch genug Zeit bleibt; sonst lädt der Hook es im Hintergrund.
#
# Nach dem Einfügen das Log der ersten Sitzung ansehen: In der letzten Zeile
# muss "Kern ok" stehen, die Zeile davor zeigt die Zeiten je Teil.
#
# Schalter:
#   --werkstatt    zusätzlich Piper und Manim samt deutscher Stimme
#                  (nur für interaktive Werkstatt-Sitzungen, nicht für die Fabrik)
#   --ohne-modell  Whisper-Modell auslassen (der Hook lädt es im Hintergrund)
#   --nur-modell   nur das Whisper-Modell laden (so ruft der Hook es auf)
# Im eingefügten Setup-Skript gibt es keine Schalter. Für eine eigene,
# gecachte Werkstatt-Umgebung unten bei "Schalter lesen" WERKSTATT=1 setzen.
# =============================================================================

# Bewusst ohne "set -e": Die Teile laufen parallel und melden Fehler selbst.
# Ein Fehler in einem Teil soll die anderen nicht abbrechen.
set -uo pipefail

# Kennung dieses Standes. Der SessionStart-Hook liest genau diese Zeile aus der
# Repo-Kopie und vergleicht sie mit /opt/deeptok/.setup-version.
# Bei jeder Änderung an diesem Skript hochzählen.
SETUP_VERSION="2026-10-28.1"

HYPERFRAMES_VERSION="0.8.206"
WHISPER_MODELL="small"                       # lädt Systran/faster-whisper-small
PIPER_STIMME="de_DE-thorsten-high"
PIPER_QUELLE="https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/high"

# Wurzelordner. Nur zum Testen überschreibbar; in der Umgebung gilt /opt/deeptok,
# weil deren Umgebungsvariablen im Setup-Skript noch nicht gesetzt sind.
DT="${DEEPTOK_HOME:-/opt/deeptok}"
VENV="$DT/venv"
LOGS="$DT/logs"

# --- Python-Pakete: exakt gepinnt ---------------------------------------------
# Auch die indirekten Abhängigkeiten sind fest. Der Cache wird etwa alle 7 Tage
# neu gebaut; ohne feste Versionen könnte dabei still ein anderes numpy oder
# huggingface_hub landen. Muss mit tools/requirements.txt übereinstimmen.
KERN_PAKETE='
# direkt genutzt
faster-whisper==1.2.1          # Hör-Check G4: Transkript und Wortzeiten
numpy==2.5.4                   # Audio-Messungen
num2words==0.5.14              # Zahlen als Wörter für den Wortvergleich
jsonschema==4.26.0             # Video-Spec prüfen (G0)
pytest==9.1.1                  # Tests der Fabrik
Pillow==13.0.0                 # Bild-Behandlungen in factory/werk/bilder.py (Duoton, Graustufen) und ihre Tests
# rembg bewusst nicht: bilder.freistellen nimmt „hyperframes remove-background“ (lokales Modell der CLI)
# Unterbau (indirekte Abhängigkeiten, Stand 27.10.2026)
anyio==4.15.1
attrs==26.1.0
av==18.1.0                     # NICHT 19: dort fehlt metadata_errors, das faster-whisper 1.2.1 beim Dekodieren nutzt
click==8.5.0
ctranslate2==4.8.4
docopt==0.6.2
filelock==4.2.4
flatbuffers==25.12.19
fsspec==2026.9.0
h11==0.16.0
hf-xet==1.7.0
httpcore2==2.16.0
httpx2==2.16.0
huggingface_hub==2.3.0
idna==3.20
iniconfig==2.3.1
jsonschema-specifications==2025.9.1
onnxruntime==1.31.1
packaging==26.3
pluggy==1.7.0
protobuf==7.36.2
Pygments==2.21.0
PyYAML==6.0.3
referencing==0.37.0
rpds-py==2026.9.1
tokenizers==0.23.3
tqdm==4.70.1
truststore==0.10.5
typing_extensions==4.16.0
'

# Werkstatt: nur die beiden Hauptpakete gepinnt; der Kern bleibt dabei fest
# (Installation mit dem Kern als Constraint). Wie tools/requirements-werkstatt.txt.
WERKSTATT_PAKETE='
piper-tts==1.8.0               # alte Probe-Stimme (Piper), nur Werkstatt
manim==0.22.0                  # Mathe-Animationen
'

# --- Schalter lesen -------------------------------------------------------------
# WERKSTATT=1 hier fest eintragen = eigene Werkstatt-Umgebung, die Piper und
# Manim mit in den Cache legt (rund 1 min länger, passt in die Frist).
WERKSTATT=0
OHNE_MODELL=0; NUR_MODELL=0
for arg in "$@"; do
  case "$arg" in
    --werkstatt)   WERKSTATT=1 ;;
    --ohne-modell) OHNE_MODELL=1 ;;
    --nur-modell)  NUR_MODELL=1 ;;
    -h|--hilfe|--help) awk 'NR>1 && !/^#/ {exit} NR>3 {print}' "$0" 2>/dev/null; exit 0 ;;
    *) echo "[setup] unbekannter Schalter: $arg (ignoriert)" ;;
  esac
done

# Sicherheitsnetz: Was auch immer schiefgeht, die Sitzung muss starten.
trap 'exit 0' EXIT

# --- Zeitbudget -----------------------------------------------------------------
# Dauert das Setup länger als etwa 5 Minuten, wird nichts gecacht, und neue
# Sitzungen können sogar mit einem Container-Fehler scheitern. Deshalb gilt eine
# Gesamtfrist ab Skriptstart (SECONDS zählt in Bash die Sekunden seit dem Start,
# auch in den parallelen Teilen). 270 s lassen 30 s Luft.
# Ein Schritt, den die Frist abschneidet, fehlt dann im Cache; der Hook merkt das
# an der fehlenden .setup-version und holt ihn in der Sitzung nach (Rückfall).
# Der Hook ruft das Skript mit DEEPTOK_FRIST=480 auf (sein eigenes Limit: 600 s).
if [ "$NUR_MODELL" = 1 ]; then
  FRIST="${DEEPTOK_FRIST:-900}"   # Hintergrundlauf: Hier wartet niemand.
else
  FRIST="${DEEPTOK_FRIST:-270}"
fi
rest() { echo $((FRIST - SECONDS)); }
# hoechstens <n>: n Sekunden, aber nie über die Frist hinaus (mindestens 1).
hoechstens() {
  local n="$1" r; r="$(rest)"
  [ "$r" -lt "$n" ] && n="$r"
  [ "$n" -lt 1 ] && n=1
  echo "$n"
}
# mit_frist <max> <befehl...>: wie "timeout <max> befehl", gekappt auf die Frist.
# Bleiben weniger als 5 s, startet der Befehl gar nicht erst.
mit_frist() {
  local max="$1"; shift
  if [ "$(rest)" -lt 5 ]; then echo "Frist erreicht, übersprungen: $*"; return 124; fi
  timeout "$(hoechstens "$max")" "$@"
}

# --- Netz und Zertifikate im Setup-Kontext ----------------------------------------
# Im Setup-Skript gibt es den Agent-Proxy der Sitzung noch nicht: Claude Code
# startet ihn erst danach. HTTPS geht hier direkt über das Egress-Gateway der
# Cloud, und dessen Zertifikat steckt nur im System-Speicher (/etc/ssl/certs).
# uv und Node bringen eigene Zertifikatslisten mit und lehnen es ab
# (gemessen: "UnknownIssuer" bzw. "SELF_SIGNED_CERT_IN_CHAIN"). In der Sitzung
# setzt Claude Code passende Variablen selbst; deshalb hier nur, wenn sie leer
# sind. So gewinnen beim Hook-Rückfall die Werte der Sitzung.
SYS_CA=/etc/ssl/certs/ca-certificates.crt
if [ -r "$SYS_CA" ]; then
  : "${SSL_CERT_FILE:=$SYS_CA}" "${NODE_EXTRA_CA_CERTS:=$SYS_CA}" \
    "${REQUESTS_CA_BUNDLE:=$SYS_CA}" "${PIP_CERT:=$SYS_CA}"
  export SSL_CERT_FILE NODE_EXTRA_CA_CERTS REQUESTS_CA_BUNDLE PIP_CERT
fi
: "${UV_NATIVE_TLS:=1}"; export UV_NATIVE_TLS   # uv: System-Speicher statt eigener Liste
case " ${NODE_OPTIONS:-} " in
  *" --use-openssl-ca "*) ;;                    # Node/npm: ebenfalls System-Speicher
  *) export NODE_OPTIONS="--use-openssl-ca${NODE_OPTIONS:+ $NODE_OPTIONS}" ;;
esac

# Im Setup-Skript ist PATH evtl. knapper als in der Sitzung. Bekannte Orte der
# vorinstallierten Werkzeuge hinten anhängen (node 22, uv).
export PATH="$PATH:/opt/node22/bin:/root/.local/bin:/usr/local/bin"
# HyperFrames darf sich nicht selbst aktualisieren (sonst wäre der Pin wertlos)
# und soll keine Telemetrie senden. Gilt hier und später über env.sh.
export HYPERFRAMES_NO_UPDATE_CHECK=1 HYPERFRAMES_NO_TELEMETRY=1
export HF_HOME="$DT/hf" HF_HUB_DISABLE_TELEMETRY=1 HF_HUB_DISABLE_PROGRESS_BARS=1
# Dieses Skript LÄDT das Modell, muss also online sein. env.sh schaltet die
# Sitzungen später offline; der Hintergrundlauf des Hooks erbt das sonst.
export HF_HUB_OFFLINE=0
export DEBIAN_FRONTEND=noninteractive PIP_DISABLE_PIP_VERSION_CHECK=1

log() { echo "[setup $(date +%H:%M:%S)] $*"; }

if ! mkdir -p "$DT" "$LOGS" 2>/dev/null || [ ! -w "$DT" ]; then
  log "Kann $DT nicht anlegen (kein root?). Nichts zu tun."
  exit 0
fi

# Zeitmessung: Jeder Teil schreibt "name sekunden status" in diese Datei.
ZEITEN="$LOGS/zeiten.txt"

# messe <name> <funktion>: führt den Teil aus, schreibt sein Log nach
# logs/<name>.log, misst die Dauer und zeigt bei Fehlern die letzten Zeilen.
messe() {
  local name="$1"; shift
  local start=$SECONDS status=ok
  if ! "$@" >"$LOGS/$name.log" 2>&1; then
    status=FEHLER
    log "$name: FEHLER, letzte Zeilen aus $LOGS/$name.log:"
    tail -n 15 "$LOGS/$name.log" | sed 's/^/    /'
  fi
  echo "$name $((SECONDS - start)) $status" >>"$ZEITEN"
  log "$name: $status nach $((SECONDS - start)) s"
  [ "$status" = ok ]
}

# --- Teil apt: ffmpeg und Schriften, nur was fehlt --------------------------------
apt_installiere() {
  # Zwei Schritte: Herunterladen (Netz) darf die Frist abbrechen. Das eigentliche
  # Installieren (dpkg, nur lokal und schnell) läuft ohne Frist, denn ein mitten
  # drin abgebrochenes dpkg hinterlässt ein kaputtes Paketsystem.
  # Erst ohne "apt-get update" versuchen (spart 10–30 s), bei Fehler mit.
  local opt=(-y -qq --no-install-recommends -o DPkg::Lock::Timeout=60)
  if ! mit_frist 120 apt-get install "${opt[@]}" --download-only "$@"; then
    mit_frist 90 apt-get update -qq -o DPkg::Lock::Timeout=60 || return 1
    mit_frist 120 apt-get install "${opt[@]}" --download-only "$@" || return 1
  fi
  apt-get install "${opt[@]}" "$@"
}

teil_apt() {
  local fehlt=() p
  command -v ffmpeg >/dev/null && command -v ffprobe >/dev/null || fehlt+=(ffmpeg)
  # Schriften nur als Rückfall für Chrome; die Kompositionen laden ihre
  # Webfonts (Playfair Display, Inter) selbst. Playfair gibt es nicht per apt,
  # deshalb EB Garamond als Serifen-Ersatz.
  for p in fonts-inter fonts-ebgaramond; do
    dpkg -s "$p" >/dev/null 2>&1 || fehlt+=("$p")
  done
  if [ "$WERKSTATT" = 1 ]; then
    # Manim braucht die Pango/Cairo-Header, um pycairo und manimpango zu bauen.
    for p in libpango1.0-dev pkg-config; do
      dpkg -s "$p" >/dev/null 2>&1 || fehlt+=("$p")
    done
  fi
  if [ ${#fehlt[@]} -eq 0 ]; then echo "apt: alles da"; return 0; fi
  echo "apt: installiere ${fehlt[*]}"
  apt_installiere "${fehlt[@]}"
}

# --- Teil python: venv mit gepinntem Kern ---------------------------------------
installiere_pakete() {
  # uv ist im Basis-Image vorinstalliert und lädt parallel: gemessen 10–50 s
  # statt 86 s mit pip. Scheitert uv (oder fehlt es), versucht es pip, das den
  # System-Zertifikatsspeicher von sich aus nutzt. Ohne Cache, damit der
  # Schnappschuss nicht 200 MB doppelte Wheels mitschleppt.
  if command -v uv >/dev/null; then
    mit_frist 240 uv pip install --python "$VENV/bin/python" --no-cache --quiet "$@" && return 0
    echo "uv gescheitert (Exit $?), zweiter Versuch mit pip"
  fi
  mit_frist 280 "$VENV/bin/python" -m pip install --no-cache-dir --quiet "$@"
}

# System-Python, nicht das "python3" aus PATH: In einer Sitzung zeigt PATH
# vielleicht schon auf ein venv, und ein venv aus einem venv ist wackelig.
PY=/usr/bin/python3
[ -x "$PY" ] || PY="$(command -v python3 || echo python3)"
py_version() { "$1" -c 'import sys; print("%d.%d" % sys.version_info[:2])' 2>/dev/null; }

teil_python() {
  printf '%s\n' "$KERN_PAKETE" >"$DT/requirements-kern.txt"
  local pyv; pyv="$(py_version "$PY")"
  # Fingerabdruck aus Paketliste + Python-Version: Stimmt er, ist nichts zu tun.
  local soll
  soll="$( (cat "$DT/requirements-kern.txt"; echo "$pyv") | sha256sum | cut -c1-16)"
  if [ "$(cat "$VENV/.kern-stempel" 2>/dev/null)" = "$soll" ] \
     && "$VENV/bin/python" -c "import faster_whisper, numpy, num2words, jsonschema, pytest, PIL" 2>/dev/null; then
    echo "venv: schon aktuell"; return 0
  fi
  # Kaputtes venv oder eines mit anderer Python-Version: neu anlegen.
  if [ "$(py_version "$VENV/bin/python")" != "$pyv" ]; then
    rm -rf "$VENV"
    if ! "$PY" -m venv "$VENV"; then
      # Auf einem nackten Ubuntu fehlt evtl. das venv-Modul der Python-Version.
      apt_installiere "python$pyv-venv" || apt_installiere python3-venv
      rm -rf "$VENV"; "$PY" -m venv "$VENV" || return 1
    fi
  fi
  installiere_pakete -r "$DT/requirements-kern.txt" || return 1
  "$VENV/bin/python" -c "import faster_whisper, numpy, num2words, jsonschema, pytest, PIL" || return 1
  echo "$soll" >"$VENV/.kern-stempel"
}

# --- Teil modell: Whisper "small" vorladen ----------------------------------------
# Liegt im Standard-Cache von HF_HOME (hf/hub/...). Genau dort sucht später auch
# WhisperModel("small"), wenn HF_HOME gesetzt ist. (Mit download_root=... würde
# es in einem anderen Ordner landen und dort nicht wiedergefunden.)
MODELL_ORDNER="$DT/hf/hub/models--Systran--faster-whisper-$WHISPER_MODELL"
modell_da() {
  [ -f "$MODELL_ORDNER/refs/main" ] \
    && [ -n "$(find -L "$MODELL_ORDNER/snapshots" -name model.bin -size +100M 2>/dev/null | head -1)" ]
}

teil_modell() {
  if modell_da; then echo "Whisper $WHISPER_MODELL: schon da"; return 0; fi
  # Eigene Sperre, damit Hook-Hintergrundlauf und Setup nicht doppelt laden.
  exec 8>"$DT/.modell.lock"
  flock -w "$(hoechstens 300)" 8 || { echo "Modell-Sperre belegt"; return 1; }
  modell_da && return 0
  mit_frist 240 "$VENV/bin/python" -c "
from faster_whisper.utils import download_model
print(download_model('$WHISPER_MODELL'))
" || return 1
  modell_da
}

# Das Modell ist der größte Einzel-Download. Es startet nur, wenn bis zur Frist
# noch mindestens 90 s bleiben. Sonst bleibt es weg, und der SessionStart-Hook
# lädt es im Hintergrund nach (so empfiehlt es die Doku für große Downloads).
MODELL_MINDESTZEIT=90
strang_python() {
  messe python teil_python || return 1
  [ "$OHNE_MODELL" = 1 ] && return 0
  if [ "$(rest)" -lt "$MODELL_MINDESTZEIT" ]; then
    log "modell: übersprungen, nur noch $(rest) s bis zur Frist (der Hook lädt es im Hintergrund)"
    echo "modell 0 übersprungen" >>"$ZEITEN"
    return 0
  fi
  messe modell teil_modell
}

# --- Teil node: HyperFrames-CLI in festen Ordner ----------------------------------
HF_CLI="$DT/node/bin/hyperframes"
teil_node() {
  if [ -x "$HF_CLI" ] && [ "$("$HF_CLI" --version 2>/dev/null)" = "$HYPERFRAMES_VERSION" ]; then
    echo "hyperframes $HYPERFRAMES_VERSION: schon da"; return 0
  fi
  # --prefix legt die CLI nach node/bin/hyperframes. Eigener Wegwerf-Cache:
  # npm-Cache gehört nicht in den Schnappschuss.
  local cache; cache="$(mktemp -d)"
  mit_frist 240 npm install -g --prefix "$DT/node" --cache "$cache" \
    --no-audit --no-fund --update-notifier=false --loglevel=error "hyperframes@$HYPERFRAMES_VERSION"
  local rc=$?
  rm -rf "$cache"
  [ "$rc" -eq 0 ] && [ "$("$HF_CLI" --version 2>/dev/null)" = "$HYPERFRAMES_VERSION" ]
}

# --- Teil chrome: der zur CLI gepinnte chrome-headless-shell -----------------------
# HyperFrames lädt Chrome nach $HOME/.cache/hyperframes/chrome. Mit HOME=$DT/chrome
# landet er unter /opt/deeptok statt in /root/.cache, und env.sh nennt den Pfad
# über HYPERFRAMES_BROWSER_PATH. So hängt das Rendern nicht vom HOME der
# Sitzung ab, und ein System-Chrome kann nicht versehentlich übernehmen.
teil_chrome() {
  [ -x "$HF_CLI" ] || { echo "hyperframes fehlt, Chrome übersprungen"; return 1; }
  mkdir -p "$DT/chrome"
  local hf=(env -u HYPERFRAMES_BROWSER_PATH -u PRODUCER_HEADLESS_SHELL_PATH HOME="$DT/chrome" "$HF_CLI")
  mit_frist 240 "${hf[@]}" browser ensure || return 1
  local pfad; pfad="$("${hf[@]}" browser path 2>/dev/null | tail -n 1)"
  case "$pfad" in
    "$DT/chrome/"*) ;;
    *) echo "Chrome liegt nicht unter $DT/chrome: '$pfad'"; return 1 ;;
  esac
  [ -x "$pfad" ] || return 1
  echo "$pfad" >"$DT/chrome/PFAD"
  echo "Chrome: $pfad"
}

# --- Teil werkstatt (nur mit --werkstatt) -------------------------------------
teil_werkstatt() {
  printf '%s\n' "$WERKSTATT_PAKETE" >"$DT/requirements-werkstatt.txt"
  if ! "$VENV/bin/python" -c "import piper, manim" 2>/dev/null; then
    installiere_pakete -r "$DT/requirements-werkstatt.txt" -c "$DT/requirements-kern.txt" || return 1
  fi
  # Deutsche Piper-Stimme (ca. 110 MB), nur wenn sie fehlt.
  mkdir -p "$DT/piper"
  local f
  for f in "$PIPER_STIMME.onnx" "$PIPER_STIMME.onnx.json"; do
    [ -s "$DT/piper/$f" ] && continue
    curl -fsSL --retry 3 --max-time "$(hoechstens 120)" -o "$DT/piper/$f.teil" "$PIPER_QUELLE/$f" \
      && mv "$DT/piper/$f.teil" "$DT/piper/$f" || return 1
  done
  "$VENV/bin/python" -c "import piper, manim" || return 1
  echo "$SETUP_VERSION" >"$DT/.werkstatt-version"
}

# --- env.sh: was jede Sitzung braucht --------------------------------------------
schreibe_env() {
  local chrome="" stimme="" node_dir=""
  [ -f "$DT/chrome/PFAD" ] && chrome="$(cat "$DT/chrome/PFAD")"
  command -v node >/dev/null && node_dir="$(dirname "$(readlink -f "$(command -v node)")")"
  [ -s "$DT/piper/$PIPER_STIMME.onnx" ] && stimme="$DT/piper/$PIPER_STIMME.onnx"
  # Erst in eine Hilfsdatei, dann umbenennen: Der Hook liest nie eine halbe Datei.
  {
    echo "# DeepTok: Umgebung für Sitzungen (aus tools/setup-umgebung.sh, Version $SETUP_VERSION)"
    echo "export DEEPTOK_HOME=\"$DT\""
    echo "export DEEPTOK_VENV=\"$VENV\""
    echo "export DEEPTOK_SETUP_VERSION=\"$SETUP_VERSION\""
    echo "export VIRTUAL_ENV=\"$VENV\""
    echo "export HF_HOME=\"$DT/hf\""
    echo "export HF_HUB_DISABLE_TELEMETRY=1"
    # Fortschrittsbalken fluten sonst die Werkzeug-Ausgaben der Agenten (Tokens).
    echo "export HF_HUB_DISABLE_PROGRESS_BARS=1"
    # Modell liegt lokal, also nie im Netz nachsehen. Sonst fragt jede Ladung
    # die HF-API, und eine Netzsperre (403 vom Proxy) ließe WhisperModel("small")
    # abstürzen, obwohl das Modell da ist. Wer bewusst ein weiteres Modell
    # herunterladen will, setzt für diesen Befehl HF_HUB_OFFLINE=0.
    if modell_da; then echo "export HF_HUB_OFFLINE=1"; fi
    echo "export HYPERFRAMES_NO_UPDATE_CHECK=1"
    echo "export HYPERFRAMES_NO_TELEMETRY=1"
    if [ -n "$chrome" ]; then echo "export HYPERFRAMES_BROWSER_PATH=\"$chrome\""; fi
    # "npx hyperframes@0.8.206" (so steht es in CLAUDE.md und den Skills) findet
    # über das globale Präfix die gepinnte CLI in node/, statt 117 MB neu zu laden.
    echo "export NPM_CONFIG_PREFIX=\"$DT/node\""
    echo "export NPM_CONFIG_UPDATE_NOTIFIER=false"
    if [ -n "$stimme" ]; then echo "export PIPER_VOICE_MODEL=\"$stimme\""; fi
    # PATH nur einmal erweitern, auch wenn die Datei mehrfach geladen wird.
    echo "case \":\$PATH:\" in *\":$VENV/bin:\"*) ;; *) export PATH=\"$VENV/bin:$DT/node/bin:\$PATH\" ;; esac"
    # Die CLI startet mit "node" aus PATH. Fehlt node dort, das vom Setup nehmen.
    if [ -n "$node_dir" ]; then echo "command -v node >/dev/null 2>&1 || export PATH=\"\$PATH:$node_dir\""; fi
  } >"$DT/env.sh.neu"
  mv "$DT/env.sh.neu" "$DT/env.sh"
}

kern_ok() {
  "$VENV/bin/python" -c "import faster_whisper, numpy, num2words, jsonschema, pytest, PIL" 2>/dev/null \
    && [ "$("$HF_CLI" --version 2>/dev/null)" = "$HYPERFRAMES_VERSION" ] \
    && [ -x "$(cat "$DT/chrome/PFAD" 2>/dev/null)" ]
}

# =============================================================================
# Ablauf
# =============================================================================
if [ "$NUR_MODELL" = 1 ]; then
  # Hintergrundlauf aus dem Hook: Nur das Modell, kein Setup-Lock nötig.
  if [ ! -x "$VENV/bin/python" ]; then log "venv fehlt, Modell übersprungen"; exit 0; fi
  : >"$ZEITEN.modell"; ZEITEN="$ZEITEN.modell"
  # Danach env.sh neu schreiben, damit ab der nächsten Sitzung HF_HUB_OFFLINE=1
  # gilt. Nur wenn die installierte Version zu diesem Skript passt.
  if messe modell teil_modell \
     && [ "$(cat "$DT/.setup-version" 2>/dev/null)" = "$SETUP_VERSION" ]; then
    schreibe_env
  fi
  exit 0
fi

# Nur ein Setup gleichzeitig (z. B. Hook-Rückfall und Handaufruf).
exec 9>"$DT/.setup.lock"
flock -w "$(hoechstens 600)" 9 || log "Setup-Sperre noch belegt, mache trotzdem weiter"

log "DeepTok-Setup $SETUP_VERSION startet (werkstatt=$WERKSTATT, ohne-modell=$OHNE_MODELL, frist=${FRIST}s)"
: >"$ZEITEN"

# Drei unabhängige Stränge parallel. Innerhalb eines Strangs ist die Reihenfolge
# nötig: Das Modell braucht das venv, Chrome braucht die CLI.
messe apt teil_apt &
PID_APT=$!
strang_python &
PID_PY=$!
( messe node teil_node && messe chrome teil_chrome ) &
PID_NODE=$!
wait "$PID_APT" "$PID_PY" "$PID_NODE"

# Werkstatt erst danach: braucht die Pango-Header aus apt und das fertige venv.
if [ "$WERKSTATT" = 1 ]; then
  messe werkstatt teil_werkstatt
fi

schreibe_env
if kern_ok; then
  echo "$SETUP_VERSION" >"$DT/.setup-version"
  ERGEBNIS="Kern ok, $DT/.setup-version = $SETUP_VERSION"
else
  # Ohne Versionsdatei richtet der Hook beim nächsten Start alles im Rückfall ein.
  rm -f "$DT/.setup-version"
  ERGEBNIS="Kern UNVOLLSTÄNDIG, keine .setup-version (der Hook versucht es erneut; Logs in $LOGS)"
fi
modell_da || ERGEBNIS="$ERGEBNIS; Whisper-Modell fehlt (Hook lädt es im Hintergrund)"

# Zeitmessung je Teil, damit man sieht, ob die 5 Minuten reichen.
log "Zeiten in Sekunden: $(awk '{printf "%s %s%s | ", $1, $2, ($3=="ok"?"":" ("$3")")}' "$ZEITEN")gesamt $SECONDS (Frist $FRIST)"
log "$ERGEBNIS"
exit 0
