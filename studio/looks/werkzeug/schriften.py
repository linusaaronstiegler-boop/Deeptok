"""Schriften der Looks holen: woff2 von @fontsource (jsDelivr), gepinnt, mit SHA-256.

Warum lokal? Der Live-Player lädt keine fremden Schriften (Spike, Befund 1), und ein Video soll
zur Laufzeit nichts aus dem Netz holen. Jede Schrift steht unter der SIL Open Font License (OFL);
die Lizenzdatei kommt mit in den Ordner.

    python studio/looks/werkzeug/schriften.py            # alle Looks
    python studio/looks/werkzeug/schriften.py labor      # nur einer

Beim ersten Lauf trägt das Skript die Prüfsummen in schriften.json ein; danach prüft es sie.
"""
from __future__ import annotations

import hashlib
import json
import sys
import time
import urllib.request
from pathlib import Path

HIER = Path(__file__).resolve().parent
LOOKS = HIER.parent
MANIFEST = HIER / "schriften.json"
JSDELIVR = "https://cdn.jsdelivr.net/npm/@fontsource"
UA = "DeepTok/0.1 (Lernprojekt; https://github.com/linusaaronstiegler-boop/Deeptok)"


def hole(url: str) -> bytes:
    anfrage = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(anfrage, timeout=60) as antwort:
        return antwort.read()


def main(nur: list[str]) -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    geaendert = False
    for look, eintrag in manifest["looks"].items():
        if nur and look not in nur:
            continue
        ziel = LOOKS / f"probe-{look}" / "assets" / "fonts"
        ziel.mkdir(parents=True, exist_ok=True)
        for s in eintrag["schriften"]:
            paket, datei = s["paket"], s["datei"]
            pfad = ziel / datei
            if not pfad.exists() or hashlib.sha256(pfad.read_bytes()).hexdigest() != s.get("sha256"):
                daten = hole(f"{JSDELIVR}/{paket}/files/{datei}")
                summe = hashlib.sha256(daten).hexdigest()
                if s.get("sha256") and s["sha256"] != summe:
                    print(f"FEHLER Prüfsumme {datei}: {summe} statt {s['sha256']}", file=sys.stderr)
                    return 1
                s["sha256"] = summe
                geaendert = True
                pfad.write_bytes(daten)
                time.sleep(0.3)
            print(f"{look}: {datei} ok")
        # Lizenz je Paket einmal (OFL)
        for paket in sorted({s["paket"] for s in eintrag["schriften"]}):
            name = paket.split("@")[0]
            lizenz = ziel / f"LICENSE-{name}.txt"
            if not lizenz.exists():
                lizenz.write_bytes(hole(f"{JSDELIVR}/{paket}/LICENSE"))
    if geaendert:
        MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
