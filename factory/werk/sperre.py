"""Datei-Sperren: höchstens N Chrome-Jobs gleichzeitig, und nur ein Schreiber am Zustand.

Idee: Für N erlaubte Jobs gibt es N Slot-Dateien (/tmp/deeptok-sperren/chrome-0.sperre,
chrome-1.sperre, ...). Wer rendern will, versucht der Reihe nach, eine davon mit
fcntl.flock exklusiv zu sperren. Gelingt es bei keiner, wartet er kurz und versucht es neu.

Warum flock und nicht z. B. eine Datei "läuft gerade" anlegen und wieder löschen?
Das Betriebssystem gibt eine flock-Sperre automatisch frei, wenn der Prozess endet,
auch bei einem Absturz oder kill -9. Eine vergessene "läuft"-Datei könnte die Fabrik
dagegen für immer blockieren.
"""
from __future__ import annotations

import fcntl
import os
import time
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator

STANDARD_VERZEICHNIS = Path("/tmp/deeptok-sperren")


class SperreZeitlimit(TimeoutError):
    """Innerhalb des Zeitlimits wurde kein Slot frei."""


@dataclass
class Slot:
    nummer: int          # welcher der N Slots
    gewartet_s: float    # wie lange wir warten mussten


def _verzeichnis(verzeichnis: Path | str | None) -> Path:
    # FABRIK_SPERREN erlaubt Tests und Sonderfälle ein eigenes Verzeichnis.
    pfad = Path(verzeichnis or os.environ.get("FABRIK_SPERREN") or STANDARD_VERZEICHNIS)
    pfad.mkdir(parents=True, exist_ok=True)
    return pfad


def _versuche(pfad: Path) -> int | None:
    """Versucht, die Datei sofort exklusiv zu sperren. Gibt den Dateideskriptor zurück oder None."""
    fd = os.open(pfad, os.O_RDWR | os.O_CREAT, 0o666)
    try:
        # LOCK_NB: nicht blockieren, sondern sofort mit BlockingIOError melden, wenn besetzt.
        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        os.close(fd)
        return None
    # Wer die Sperre hält, schreibt seine Prozessnummer hinein. Das hilft nur beim Nachsehen.
    os.ftruncate(fd, 0)
    os.write(fd, f"{os.getpid()}\n".encode())
    return fd


def _freigeben(fd: int) -> None:
    fcntl.flock(fd, fcntl.LOCK_UN)
    os.close(fd)


@contextmanager
def slot(name: str, anzahl: int, zeitlimit: float = 300.0,
         verzeichnis: Path | str | None = None, takt: float = 0.25) -> Iterator[Slot]:
    """Belegt einen von `anzahl` Slots namens `name`; wartet höchstens `zeitlimit` Sekunden.

    Verwendung:
        with slot("chrome", 2) as s:
            ...  # hier laufen höchstens 2 Prozesse gleichzeitig
    """
    if anzahl < 1:
        raise ValueError("anzahl muss mindestens 1 sein")
    ordner = _verzeichnis(verzeichnis)
    start = time.monotonic()
    while True:
        for nummer in range(anzahl):
            fd = _versuche(ordner / f"{name}-{nummer}.sperre")
            if fd is None:
                continue
            try:
                yield Slot(nummer, round(time.monotonic() - start, 3))
            finally:
                _freigeben(fd)
            return
        if time.monotonic() - start >= zeitlimit:
            raise SperreZeitlimit(f"Kein freier Slot für '{name}' nach {zeitlimit:.0f} s "
                                  f"({anzahl} Slots in {ordner})")
        time.sleep(takt)


@contextmanager
def exklusiv(pfad: Path | str, zeitlimit: float = 120.0, takt: float = 0.1) -> Iterator[Slot]:
    """Genau ein Prozess zur Zeit, Sperrdatei an einem festen Pfad (z. B. im .git-Ordner)."""
    pfad = Path(pfad)
    pfad.parent.mkdir(parents=True, exist_ok=True)
    start = time.monotonic()
    while True:
        fd = _versuche(pfad)
        if fd is not None:
            try:
                yield Slot(0, round(time.monotonic() - start, 3))
            finally:
                _freigeben(fd)
            return
        if time.monotonic() - start >= zeitlimit:
            raise SperreZeitlimit(f"{pfad} ist seit {zeitlimit:.0f} s gesperrt")
        time.sleep(takt)
