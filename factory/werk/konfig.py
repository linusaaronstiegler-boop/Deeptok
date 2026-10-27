"""Liest factory/config.json: die Deckel und Schwellen der Fabrik.

Warum eine Datei statt Konstanten im Code? Die Kalibriernächte verstellen diese Zahlen
(z. B. videos_pro_nacht 3 -> 5 -> 7). Eine Änderung soll ein Ein-Zeilen-Commit in einer
JSON-Datei sein, nicht ein Eingriff in die Logik.
"""
from __future__ import annotations

import json
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from werk import EXIT_EINGABE, FabrikFehler

FABRIK_DIR = Path(__file__).resolve().parent.parent    # .../factory
REPO_WURZEL = FABRIK_DIR.parent                         # .../Deeptok

# Rückfallwerte, falls config.json fehlt oder einen Schlüssel nicht hat.
# Sie entsprechen den Startwerten aus docs/VIDEO-PIPELINE.md.
STANDARD: dict = {
    "videos_pro_nacht": 3,
    "max_reparaturen": 2,
    "max_eskalationen": 1,      # nach den Reparaturen genau ein Versuch durch Opus (§6, §8)
    "chrome_jobs": 2,
    "herzschlag_frist_min": 15,
    "zeitzone": "Europe/Berlin",
    "nachtwechsel_stunde": 12,
    "whisper_modell": "small",
    "whisper_threads": 2,
    "lufs_ziel": -16,
    "lufs_toleranz": 1,
    "true_peak_max": -1,
    "max_stille_s": 1.2,
    "sprechtempo_min": 2.0,
    "sprechtempo_max": 2.6,
    "wer_max": 0.08,
    "min_abtastrate_hz": 44100,
    "min_bitrate_kbps": 96,
}

# Diese Werte müssen ganze Zahlen >= Untergrenze sein, sonst ist die Datei kaputt.
_GANZZAHLEN = {"videos_pro_nacht": 0, "max_reparaturen": 0, "max_eskalationen": 0,
               "chrome_jobs": 1,
               "herzschlag_frist_min": 1, "whisper_threads": 1, "nachtwechsel_stunde": 0}


def konfig_pfad(repo: Path | str | None = None) -> Path | None:
    """Erst <repo>/factory/config.json, sonst die Datei neben fabrik.py."""
    kandidaten = []
    if repo is not None:
        kandidaten.append(Path(repo) / "factory" / "config.json")
    kandidaten.append(FABRIK_DIR / "config.json")
    for pfad in kandidaten:
        if pfad.is_file():
            return pfad
    return None


def lade_konfig(repo: Path | str | None = None) -> dict:
    pfad = konfig_pfad(repo)
    daten: dict = {}
    if pfad is not None:
        try:
            daten = json.loads(pfad.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            raise FabrikFehler(f"{pfad} ist kein gültiges JSON: {e}", EXIT_EINGABE) from e
    konfig = dict(STANDARD)
    # Schlüssel mit "_" am Anfang sind Kommentare in der JSON-Datei.
    konfig.update({k: v for k, v in daten.items() if not k.startswith("_")})
    _pruefe(konfig, pfad)
    return konfig


def _pruefe(konfig: dict, pfad: Path | None) -> None:
    quelle = str(pfad) if pfad else "Standardwerte"
    for schluessel, minimum in _GANZZAHLEN.items():
        wert = konfig[schluessel]
        # bool ist in Python eine Unterklasse von int; true als Videozahl wäre aber Unsinn.
        if isinstance(wert, bool) or not isinstance(wert, int) or wert < minimum:
            raise FabrikFehler(f"{quelle}: {schluessel} muss eine ganze Zahl >= {minimum} sein, "
                               f"ist {wert!r}", EXIT_EINGABE)
    if konfig["nachtwechsel_stunde"] > 23:
        raise FabrikFehler(f"{quelle}: nachtwechsel_stunde muss 0..23 sein", EXIT_EINGABE)
    try:
        ZoneInfo(konfig["zeitzone"])
    except (ZoneInfoNotFoundError, ValueError) as e:
        raise FabrikFehler(f"{quelle}: unbekannte Zeitzone {konfig['zeitzone']!r}", EXIT_EINGABE) from e
