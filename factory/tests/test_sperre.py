"""Datei-Sperren: zwei Slots, drei gleichzeitige Prozesse -> höchstens zwei gleichzeitig."""
from __future__ import annotations

import json
import subprocess
import sys
import time

import pytest
from conftest import FABRIK_DIR

from werk.sperre import SperreZeitlimit, exklusiv, slot

# Ein Arbeiter-Prozess: Slot holen, Start und Ende protokollieren, 0,6 s "rendern".
ARBEITER = """
import json, sys, time
sys.path.insert(0, {fabrik!r})
from werk.sperre import slot
with slot("chrome", 2, zeitlimit=30, verzeichnis={ordner!r}, takt=0.02) as s:
    start = time.time()
    time.sleep(0.6)
    print(json.dumps({{"start": start, "ende": time.time(), "slot": s.nummer}}))
"""


def max_gleichzeitig(intervalle: list[tuple[float, float]]) -> int:
    ereignisse = sorted([(a, 1) for a, _ in intervalle] + [(e, -1) for _, e in intervalle])
    jetzt = hoechst = 0
    for _, schritt in ereignisse:       # bei gleicher Zeit zuerst das Ende (-1) zählen
        jetzt += schritt
        hoechst = max(hoechst, jetzt)
    return hoechst


def test_drei_prozesse_zwei_slots(tmp_path):
    code = ARBEITER.format(fabrik=str(FABRIK_DIR), ordner=str(tmp_path))
    prozesse = [subprocess.Popen([sys.executable, "-c", code], stdout=subprocess.PIPE, text=True)
                for _ in range(3)]
    ergebnisse = [json.loads(p.communicate(timeout=60)[0]) for p in prozesse]
    assert all(p.returncode == 0 for p in prozesse)
    intervalle = [(e["start"], e["ende"]) for e in ergebnisse]
    assert max_gleichzeitig(intervalle) == 2          # nie drei, aber zwei parallel
    assert {e["slot"] for e in ergebnisse} == {0, 1}
    # Der dritte musste warten, bis einer der ersten beiden fertig war.
    erster, zweiter, dritter = sorted(intervalle)
    assert dritter[0] >= min(erster[1], zweiter[1]) - 0.01


def test_zeitlimit_wenn_alle_slots_belegt(tmp_path):
    # flock gilt pro geöffneter Datei: Auch im selben Prozess blockieren sich zwei Öffnungen.
    with slot("chrome", 2, verzeichnis=tmp_path), slot("chrome", 2, verzeichnis=tmp_path):
        start = time.monotonic()
        with pytest.raises(SperreZeitlimit):
            with slot("chrome", 2, zeitlimit=0.3, verzeichnis=tmp_path, takt=0.05):
                pass
        assert 0.25 < time.monotonic() - start < 2
    with slot("chrome", 2, zeitlimit=0.3, verzeichnis=tmp_path) as s:   # wieder frei
        assert s.nummer == 0 and s.gewartet_s < 0.1


def test_abgestuerzter_prozess_gibt_den_slot_frei(tmp_path):
    """kill -9 mitten im Rendern: Das Betriebssystem löst die Sperre selbst."""
    code = (f"import sys, time; sys.path.insert(0, {str(FABRIK_DIR)!r})\n"
            f"from werk.sperre import slot\n"
            f"with slot('chrome', 1, verzeichnis={str(tmp_path)!r}):\n"
            f"    print('drin', flush=True); time.sleep(60)\n")
    p = subprocess.Popen([sys.executable, "-c", code], stdout=subprocess.PIPE, text=True)
    assert p.stdout.readline().strip() == "drin"
    with pytest.raises(SperreZeitlimit):
        with slot("chrome", 1, zeitlimit=0.2, verzeichnis=tmp_path):
            pass
    p.kill()
    p.wait()
    with slot("chrome", 1, zeitlimit=2, verzeichnis=tmp_path) as s:
        assert s.nummer == 0


def test_exklusiv(tmp_path):
    datei = tmp_path / "sub" / "zustand.sperre"
    with exklusiv(datei):
        with pytest.raises(SperreZeitlimit):
            with exklusiv(datei, zeitlimit=0.2):
                pass
    with exklusiv(datei, zeitlimit=0.2):
        pass


def test_ungueltige_slotzahl(tmp_path):
    with pytest.raises(ValueError):
        with slot("chrome", 0, verzeichnis=tmp_path):
            pass
