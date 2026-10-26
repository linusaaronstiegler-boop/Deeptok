#!/bin/bash
# Richtet die Video-Werkstatt in Cloud-Sitzungen ein (auch für die Nachtläufe).
# Idempotent: Was schon da ist, wird übersprungen. Der Container-Zustand wird danach gecacht.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
VENV="$ROOT/.venv"
PIPER_DIR="$HOME/.piper"
PIPER_VOICE="de_DE-thorsten-high"
HF_VOICE="https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/high"

# Manim braucht die Pango-Header zum Bauen von manimpango.
if ! pkg-config --exists pangocairo 2>/dev/null; then
  apt-get update -qq >/dev/null 2>&1 || true
  apt-get install -y -qq libpango1.0-dev pkg-config >/dev/null 2>&1
fi

# Python-Umgebung mit Piper (Stimme), Manim (Mathe-Animationen), faster-whisper (Hör-Check).
if [ ! -x "$VENV/bin/python" ]; then
  python3 -m venv "$VENV"
fi
"$VENV/bin/pip" install -q --upgrade pip >/dev/null
"$VENV/bin/pip" install -q -r "$ROOT/tools/requirements.txt"

# Deutsche Piper-Stimme (ca. 110 MB), nur beim ersten Mal.
mkdir -p "$PIPER_DIR"
for f in "$PIPER_VOICE.onnx" "$PIPER_VOICE.onnx.json"; do
  [ -s "$PIPER_DIR/$f" ] || curl -sSL --retry 3 -o "$PIPER_DIR/$f" "$HF_VOICE/$f"
done

# HyperFrames-CLI in den npm-Cache holen und den gepinnten Chrome für das Rendern sichern.
npx --yes hyperframes@0.8.206 --version >/dev/null 2>&1 || true
npx --yes hyperframes@0.8.206 browser ensure >/dev/null 2>&1 || true

# Für die Sitzung: venv zuerst im PATH, Stimme auffindbar.
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export VIRTUAL_ENV=\"$VENV\"" >> "$CLAUDE_ENV_FILE"
  echo "export PATH=\"$VENV/bin:\$PATH\"" >> "$CLAUDE_ENV_FILE"
  echo "export PIPER_VOICE_MODEL=\"$PIPER_DIR/$PIPER_VOICE.onnx\"" >> "$CLAUDE_ENV_FILE"
fi
