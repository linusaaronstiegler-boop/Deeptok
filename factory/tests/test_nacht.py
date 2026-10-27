"""Nachtdatum: vor 12:00 Uhr Berliner Ortszeit gehört ein Zeitpunkt zur Nacht des Vortags.

Am 25.10.2026 um 03:00 Sommerzeit (01:00 UTC) wurde auf Winterzeit umgestellt:
vorher Berlin = UTC+2, danach UTC+1. Ein fester Versatz wäre hier eine Stunde falsch.
"""
from __future__ import annotations

from datetime import datetime

import pytest

from werk.zustand import iso_utc, lies_iso, nacht_datum


def nacht(utc: str) -> str:
    return nacht_datum(lies_iso(utc), "Europe/Berlin", 12)


@pytest.mark.parametrize("utc, erwartet, ortszeit", [
    # Normaler Tag in Winterzeit (UTC+1)
    ("2026-10-27T10:59:00Z", "2026-10-26", "11:59 MEZ"),
    ("2026-10-27T11:00:00Z", "2026-10-27", "12:00 MEZ"),
    # Sommerzeit (UTC+2), Tag vor der Umstellung
    ("2026-10-24T09:59:00Z", "2026-10-23", "11:59 MESZ"),
    ("2026-10-24T10:00:00Z", "2026-10-24", "12:00 MESZ"),
    # Tag der Umstellung, nachmittags gilt schon Winterzeit
    ("2026-10-25T10:59:00Z", "2026-10-24", "11:59 MEZ"),
    ("2026-10-25T11:00:00Z", "2026-10-25", "12:00 MEZ"),
    ("2026-10-25T10:00:00Z", "2026-10-24", "11:00 MEZ (mit festem UTC+2 fälschlich 12:00)"),
    # Die doppelte Stunde 02:00-03:00 in der Umstellungsnacht
    ("2026-10-25T00:30:00Z", "2026-10-24", "02:30 MESZ, erstes Mal"),
    ("2026-10-25T01:30:00Z", "2026-10-24", "02:30 MEZ, zweites Mal"),
    # Umstellung auf Sommerzeit am 29.03.2026
    ("2026-03-29T09:59:00Z", "2026-03-28", "11:59 MESZ"),
    ("2026-03-29T10:00:00Z", "2026-03-29", "12:00 MESZ"),
    # Eine Nacht über Mitternacht: Nachtschicht 23:07, Weiterläufe 01:37 und 03:07
    ("2026-10-27T22:07:00Z", "2026-10-27", "23:07 MEZ"),
    ("2026-10-28T00:37:00Z", "2026-10-27", "01:37 MEZ"),
    ("2026-10-28T02:07:00Z", "2026-10-27", "03:07 MEZ"),
    ("2026-10-28T03:15:00Z", "2026-10-27", "04:15 MEZ, Morgen-Redaktion"),
])
def test_nachtdatum(utc, erwartet, ortszeit):
    assert nacht(utc) == erwartet, ortszeit


def test_wechselstunde_ist_einstellbar():
    zeit = lies_iso("2026-10-27T05:30:00Z")          # 06:30 MEZ
    assert nacht_datum(zeit, "Europe/Berlin", 6) == "2026-10-27"
    assert nacht_datum(zeit, "Europe/Berlin", 7) == "2026-10-26"


def test_zeit_ohne_zone_wird_abgelehnt():
    with pytest.raises(ValueError):
        nacht_datum(datetime(2026, 10, 27, 12, 0), "Europe/Berlin", 12)
    with pytest.raises(ValueError):
        lies_iso("2026-10-27T12:00:00")


def test_iso_utc_immer_mit_z():
    assert iso_utc(lies_iso("2026-10-27T23:07:30+01:00")) == "2026-10-27T22:07:30Z"
    assert iso_utc(lies_iso("2026-07-01T12:00:00.987654Z")) == "2026-07-01T12:00:00Z"
