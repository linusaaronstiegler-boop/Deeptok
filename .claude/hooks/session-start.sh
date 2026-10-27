#!/bin/bash
# SessionStart-Hook (nur Cloud): macht die Werkzeuge aus /opt/deeptok nutzbar.
#
# Normalfall, Umgebung "deeptok-fabrik": Das Setup-Skript der Umgebung
# (tools/setup-umgebung.sh) hat alles nach /opt/deeptok gelegt, und der
# Schnappschuss der Umgebung enthält es schon. Der Hook vergleicht nur die
# Versionskennung und hängt /opt/deeptok/env.sh an $CLAUDE_ENV_FILE an.
# Das dauert Sekundenbruchteile, auch bei jedem Scheduled Task.
#
# Rückfall, Umgebung ohne dieses Setup-Skript (oder mit veraltetem bzw.
# unvollständigem): Der Hook ruft tools/setup-umgebung.sh selbst auf
# (rund 1 min, wird nicht gecacht) und sagt, woran es lag.
#
# Fehlt nur das Whisper-Modell: Es lädt im Hintergrund nach, der Start wartet nicht.
# Werkstatt (Piper, Manim): Umgebungsvariable DEEPTOK_WERKSTATT=1 setzen.
#
# Alles, was der Hook auf stdout schreibt, liest Claude als Kontext. Deshalb knapp.
set -euo pipefail

# Am eigenen PC nichts tun.
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0

# Der Hook darf eine Sitzung nie scheitern lassen: Auch ein unerwarteter Abbruch
# durch "set -e" endet über diese Falle mit Exit 0.
trap 'exit 0' EXIT

# Wurzel wie im Setup-Skript; DEEPTOK_HOME nur zum Testen überschreiben.
DT="${DEEPTOK_HOME:-/opt/deeptok}"
ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
SETUP="$ROOT/tools/setup-umgebung.sh"
MODELL="$DT/hf/hub/models--Systran--faster-whisper-small"
# Hat das Setup-Skript der Umgebung hier schon gearbeitet? Dann gibt es sein
# Zeit-Log aus dem Schnappschuss. Nur für einen treffenden Hinweis unten.
setup_lief=0
[ -f "$DT/logs/zeiten.txt" ] && setup_lief=1
mkdir -p "$DT/logs" 2>/dev/null || true

# Soll-Version steht nur an einer Stelle: im Setup-Skript im Repo.
# "|| true" in der Befehlsersetzung: Fehlt die Datei, scheitert sed, und mit
# "set -e" + pipefail bräche der Hook sonst hier still ab (dann fehlten die Exports).
soll="$(sed -n 's/^SETUP_VERSION="\(.*\)"$/\1/p' "$SETUP" 2>/dev/null | head -n 1 || true)"
ist="$(cat "$DT/.setup-version" 2>/dev/null || true)"

# Aktuell heißt: Kennung da, mindestens so neu wie im Repo (sort -V ordnet
# 2026-10-27.1 < 2026-10-27.2 < 2026-10-28.1), und die Programme existieren.
aktuell() {
  [ -n "$ist" ] && [ -x "$DT/venv/bin/python" ] && [ -x "$DT/node/bin/hyperframes" ] && [ -f "$DT/env.sh" ] \
    && { [ -z "$soll" ] || [ "$(printf '%s\n%s\n' "$soll" "$ist" | sort -V | head -n 1)" = "$soll" ]; }
}

modell_da() {
  [ -f "$MODELL/refs/main" ] && compgen -G "$MODELL/snapshots/*/model.bin" >/dev/null
}

# Das Modell kommt im Rückfall nie im Vordergrund, sondern immer über den
# Hintergrundlauf weiter unten. So bleibt auch der Rückfall kurz.
flags=(--ohne-modell)
werkstatt_fehlt=0
if [ "${DEEPTOK_WERKSTATT:-}" = 1 ] && [ "$(cat "$DT/.werkstatt-version" 2>/dev/null || true)" != "$soll" ]; then
  flags+=(--werkstatt)
  werkstatt_fehlt=1
fi

kern_aktuell=0
aktuell && kern_aktuell=1

if [ "$kern_aktuell" = 0 ] || [ "$werkstatt_fehlt" = 1 ]; then
  if [ -f "$SETUP" ]; then
    vorher="${ist:-keins}"
    echo "DeepTok: Umgebung hat Setup '$vorher', Repo erwartet '${soll:-?}'. Rückfall: richte jetzt ein."
    start=$SECONDS
    # Frist 480 s statt 270 s: Hier zählt nicht der Cache, sondern das Hook-Limit (600 s).
    DEEPTOK_FRIST=480 bash "$SETUP" "${flags[@]}" >"$DT/logs/hook-setup.log" 2>&1 || true
    ist="$(cat "$DT/.setup-version" 2>/dev/null || true)"
    echo "DeepTok: Rückfall-Setup nach $((SECONDS - start)) s: $(tail -n 1 "$DT/logs/hook-setup.log" 2>/dev/null || true)"
    # Der Hinweis hängt davon ab, warum der Rückfall nötig war.
    if [ "$kern_aktuell" = 1 ]; then
      echo "DeepTok: Werkstatt (DEEPTOK_WERKSTATT=1) wird nicht gecacht. Für eine eigene Werkstatt-Umgebung im eingefügten Setup-Skript WERKSTATT=1 setzen."
    elif [ "$vorher" != keins ]; then
      echo "DeepTok: Setup-Skript der Umgebung ist veraltet. tools/setup-umgebung.sh neu in die Umgebung einfügen."
    elif [ "$setup_lief" = 1 ]; then
      echo "DeepTok: Setup-Skript der Umgebung lief, blieb aber unvollständig. Setup-Log der Umgebung bzw. $DT/logs/ prüfen."
    else
      echo "DeepTok: Für schnelle Starts tools/setup-umgebung.sh als Setup-Skript der Umgebung eintragen."
    fi
  else
    echo "DeepTok: tools/setup-umgebung.sh fehlt im Repo, nichts eingerichtet."
  fi
fi

# Whisper-Modell fehlt: im Hintergrund nachladen. setsid + nohup lösen den Lauf
# vom Hook; stdin/stdout umlenken, sonst wartet Claude Code auf offene Pipes.
# Läuft schon ein Download (Sperre belegt), keinen zweiten starten.
if [ -x "$DT/venv/bin/python" ] && [ -f "$SETUP" ] && ! modell_da; then
  if flock -n "$DT/.modell.lock" true 2>/dev/null; then
    setsid nohup bash "$SETUP" --nur-modell </dev/null >>"$DT/logs/hook-modell.log" 2>&1 &
    echo "DeepTok: Whisper-Modell fehlt, lädt im Hintergrund (Log: $DT/logs/hook-modell.log)."
  fi
fi

# Exports für alle Befehle dieser Sitzung übernehmen, aber nur einmal pro Datei.
if [ -f "$DT/env.sh" ]; then
  if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
    grep -qs 'DEEPTOK_HOME' "$CLAUDE_ENV_FILE" || cat "$DT/env.sh" >>"$CLAUDE_ENV_FILE"
    hfv="$(sed -n 's/^HYPERFRAMES_VERSION="\(.*\)"$/\1/p' "$SETUP" 2>/dev/null | head -n 1 || true)"
    # Agenten sollen wissen, dass Hugging Face offline ist (Whisper liegt lokal).
    offline=""
    if grep -qs 'HF_HUB_OFFLINE=1' "$DT/env.sh"; then
      offline=" HF_HUB_OFFLINE=1 (Whisper small lokal; für andere Modelle HF_HUB_OFFLINE=0 setzen)."
    fi
    echo "DeepTok-Umgebung ${ist:-?}: python (venv mit faster-whisper, pytest), hyperframes ${hfv:-?} + Chrome aus $DT im PATH; HF_HOME=$DT/hf.$offline"
  else
    echo "DeepTok: CLAUDE_ENV_FILE fehlt. Vor Befehlen '. $DT/env.sh' ausführen."
  fi
fi
exit 0
