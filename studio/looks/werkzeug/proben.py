"""Schreibt die fünf Look-Proben studio/looks/probe-<look>/ (Aufbau: probe_basis.py).

Die Kurstafel ist seit 28.10.2026 verworfen (studio/looks/verworfen/) und hier nicht mehr angemeldet.

    . /opt/deeptok/env.sh
    /home/user/Deeptok/.venv/bin/python studio/looks/werkzeug/proben.py [look …]   # braucht Pillow

Vorher: werkzeug/schriften.py (Schriften), werkzeug/karte.mjs (Karte), werkzeug/fotos.py (Fotos).
Danach: werkzeug/check-alle.sh, snapshot, render, werkzeug/vergleich.py (README, „Werkzeuge“).
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from looks_archiv import archiv_duoton          # noqa: E402  (je Look eine Datei)
from looks_atlas import atlas_nacht              # noqa: E402
from looks_flach import flach                    # noqa: E402
from looks_labor import labor                    # noqa: E402
from looks_zeitung import zeitungspapier         # noqa: E402

LOOKS_BAU = {"atlas-nacht": atlas_nacht, "zeitungspapier": zeitungspapier, "labor": labor,
             "archiv-duoton": archiv_duoton, "flach": flach}

if __name__ == "__main__":
    for name in (sys.argv[1:] or LOOKS_BAU):
        if name not in LOOKS_BAU:          # z. B. ein verworfener Look: klar abbrechen statt KeyError
            raise SystemExit(f"Unbekannter Look {name!r}; wählbar: {', '.join(LOOKS_BAU)}")
        LOOKS_BAU[name]()
        print(f"probe-{name} geschrieben")
