"""Stimm-Adapter der Fabrik: ein Aufruf, vier Anbieter (docs/VIDEO-PIPELINE.md §4).

    from werk import stimme
    s = stimme.lade_stimme("elevenlabs")            # liest voices/elevenlabs.json
    ergebnis = stimme.synthese("Sommer 2022. *Bayern* verkauft ...", s)
    open("voice.mp3", "wb").write(ergebnis.audio)

Jeder Anbieter ist ein eigenes Modul mit denselben Funktionen:
    synthese(text, stimme, vorher=None, nachher=None) -> Ergebnis
    restguthaben(stimme) -> int | None      (Restzeichen, falls die API einen Stand liefert)
    stimmen(stimme, sprache) -> [{"id", "name", "geschlecht"}]   (kostenlos, auch Zugangsprobe)

Die gepinnten Einstellungen (Modell, Stimm-ID, Format, Tempo, Lexikon) stehen in
voices/<anbieter>.json. So ändert sich eine Stimme nur mit einem Commit, nie nebenbei.
"""
from __future__ import annotations

import json
from pathlib import Path
from types import ModuleType

from . import azure, cartesia, elevenlabs, inworld
from .basis import PLATZHALTER, Ergebnis, KeinZugang, StimmFehler, TextZuLang

ADAPTER: dict[str, ModuleType] = {
    "elevenlabs": elevenlabs,
    "inworld": inworld,
    "cartesia": cartesia,
    "azure": azure,
}
ANBIETER = tuple(ADAPTER)

# .../factory/werk/stimme/__init__.py -> parents[3] ist die Repo-Wurzel
VOICES_DIR = Path(__file__).resolve().parents[3] / "voices"

__all__ = ["ADAPTER", "ANBIETER", "PLATZHALTER", "Ergebnis", "KeinZugang", "StimmFehler",
           "TextZuLang", "VOICES_DIR", "adapter", "lade_stimme", "restguthaben", "stimmen",
           "synthese"]


def adapter(anbieter: str) -> ModuleType:
    try:
        return ADAPTER[anbieter]
    except KeyError:
        raise StimmFehler(f"Unbekannter Anbieter {anbieter!r}; bekannt: {', '.join(ANBIETER)}") from None


def lade_stimme(anbieter: str, verzeichnis: Path | str | None = None) -> dict:
    """Liest voices/<anbieter>.json. Schlüssel mit "_" am Anfang sind Kommentare."""
    pfad = Path(verzeichnis or VOICES_DIR) / f"{anbieter}.json"
    try:
        daten = json.loads(pfad.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise StimmFehler(f"Stimme fehlt: {pfad}") from None
    daten.setdefault("anbieter", anbieter)
    if daten["anbieter"] != anbieter:
        raise StimmFehler(f"{pfad}: anbieter ist {daten['anbieter']!r}, erwartet {anbieter!r}")
    return daten


def synthese(text: str, stimme: dict, vorher: str | None = None,
             nachher: str | None = None) -> Ergebnis:
    return adapter(stimme["anbieter"]).synthese(text, stimme, vorher=vorher, nachher=nachher)


def restguthaben(stimme: dict) -> int | None:
    return adapter(stimme["anbieter"]).restguthaben(stimme)


def stimmen(stimme: dict, sprache: str = "de") -> list[dict]:
    return adapter(stimme["anbieter"]).stimmen(stimme, sprache)
