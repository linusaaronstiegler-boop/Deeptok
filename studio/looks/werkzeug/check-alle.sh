#!/usr/bin/env bash
# Prüft alle Look-Proben mit `npx hyperframes check --json` (mit Untertitel-Zone als Fehler) und
# fasst Fehler und Warnungen zusammen.
# Aufruf: . /opt/deeptok/env.sh && bash studio/looks/werkzeug/check-alle.sh [look …]
set -u
cd "$(dirname "$0")/.."
looks=("$@"); [ ${#looks[@]} -eq 0 ] && looks=(atlas-nacht zeitungspapier labor archiv-duoton flach)   # Kurstafel verworfen (28.10.)
tmp="$(mktemp -d)"
for l in "${looks[@]}"; do
  ( cd "probe-$l" && npx hyperframes check --json --caption-zone "x0=0;y0=.693;x1=1;y1=1;severity=error" \
      > "$tmp/check-$l.json" 2> "$tmp/check-$l.err" )
  python3 - "$l" "$tmp" <<'PY'
import json, sys
l, tmp = sys.argv[1], sys.argv[2]
try:
    d = json.load(open(f"{tmp}/check-{l}.json"))
except Exception as e:
    print(l, "KEIN JSON", open(f"{tmp}/check-{l}.err").read()[-800:]); sys.exit()
fehler, warn = [], []
for teil, v in d.items():
    if isinstance(v, dict) and "findings" in v:
        for f in v["findings"]:
            (fehler if f.get("severity") == "error" else warn if f.get("severity") == "warning" else []).append(
                f"{teil}:{f.get('code')} {f.get('selector') or ''} t={f.get('time','')} {f.get('message','')[:140]}")
print(f"== {l}: ok={d.get('ok')} Fehler={len(fehler)} Warnungen={len(warn)}")
for x in fehler + warn: print("   ", x)
PY
done
rm -rf "$tmp"
