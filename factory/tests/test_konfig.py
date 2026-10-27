"""config.json und sperrliste.json: Startwerte laut Schnittstellen-Vertrag, Prüfung der Werte."""
from __future__ import annotations

import json

import pytest
from conftest import FABRIK_DIR

from werk import FabrikFehler
from werk.konfig import STANDARD, lade_konfig

VERTRAG = {"videos_pro_nacht": 3, "max_reparaturen": 2, "chrome_jobs": 2, "herzschlag_frist_min": 15,
           "zeitzone": "Europe/Berlin", "nachtwechsel_stunde": 12, "whisper_modell": "small",
           "whisper_threads": 2, "lufs_ziel": -16, "lufs_toleranz": 1, "true_peak_max": -1,
           "max_stille_s": 1.2, "sprechtempo_min": 2.0, "sprechtempo_max": 2.6, "wer_max": 0.08}


def test_startwerte_wie_im_vertrag():
    datei = json.loads((FABRIK_DIR / "config.json").read_text())
    for schluessel, wert in VERTRAG.items():
        assert datei[schluessel] == wert, schluessel
        assert STANDARD[schluessel] == wert, schluessel        # Rückfallwerte im Code ebenso
    assert lade_konfig()["videos_pro_nacht"] == 3


def test_repo_config_hat_vorrang(tmp_path):
    (tmp_path / "factory").mkdir()
    (tmp_path / "factory" / "config.json").write_text('{"videos_pro_nacht": 5, "_kommentar": "x"}')
    konfig = lade_konfig(tmp_path)
    assert konfig["videos_pro_nacht"] == 5 and konfig["chrome_jobs"] == 2
    assert "_kommentar" not in konfig


@pytest.mark.parametrize("inhalt", [
    '{"videos_pro_nacht": -1}', '{"chrome_jobs": 0}', '{"videos_pro_nacht": true}',
    '{"nachtwechsel_stunde": 24}', '{"zeitzone": "Mond/Krater"}', '{kaputt',
])
def test_ungueltige_config(tmp_path, inhalt):
    (tmp_path / "factory").mkdir()
    (tmp_path / "factory" / "config.json").write_text(inhalt)
    with pytest.raises(FabrikFehler) as e:
        lade_konfig(tmp_path)
    assert e.value.code == 2


def test_sperrliste_format():
    liste = json.loads((FABRIK_DIR / "sperrliste.json").read_text(encoding="utf-8"))
    assert {"woerter", "floskeln", "hinweis"} <= set(liste)
    for pflicht in ("natürlich", "offensichtlich", "einfach", "trivial", "Leichtsinnsfehler", "super"):
        assert pflicht in liste["woerter"]
    floskeln = liste["floskeln"] + liste.get("floskeln_am_satzende", [])
    for pflicht in ("gut gemacht", "toll gemacht", "Glaub an dich", "du schaffst das", "Growth Mindset"):
        assert pflicht in floskeln
    assert "klasse" in liste["nur_kleingeschrieben"]
    # Ausnahmen dürfen nur Fachbegriffe aus mindestens zwei Wörtern sein, nie ein Sperrwort allein.
    assert all(len(a.split()) >= 2 for a in liste["ausnahmen"])


def test_eskalation_in_config():
    """§6/§8: nach max_reparaturen genau eine Eskalation zu Opus."""
    datei = json.loads((FABRIK_DIR / "config.json").read_text())
    assert datei["max_eskalationen"] == STANDARD["max_eskalationen"] == 1
