"""check/render-Hülle. Schnell mit einem gespielten npx (FABRIK_NPX), langsam mit dem echten."""
from __future__ import annotations

import json
import os
import shutil
import sys
import time

import pytest
from conftest import REPO_WURZEL, ein_json, fabrik_cli

from werk import FabrikFehler, hyperframes
from werk.sperre import slot

# Spielt "npx --yes hyperframes@0.8.206 <befehl> ...": protokolliert den Aufruf, gibt ein
# vorbereitetes check-JSON aus oder schreibt eine Render-Datei.
FALSCHES_NPX = r'''
import json, os, subprocess, sys, time
args = sys.argv[1:]
with open(os.environ["FAKE_LOG"], "a") as f:
    f.write(json.dumps({"args": args, "cwd": os.getcwd(), "ci": os.environ.get("CI")}) + "\n")
if os.environ.get("FAKE_KIND"):                      # ein Kindprozess wie Chrome
    kind = subprocess.Popen(["sleep", "30"])
    open(os.environ["FAKE_KIND"], "w").write(str(kind.pid))
time.sleep(float(os.environ.get("FAKE_SCHLAF", "0")))
if "check" in args:
    print(open(os.environ["FAKE_CHECK"]).read())
    sys.exit(int(os.environ.get("FAKE_EXIT", "0")))
if "render" in args:
    open(args[args.index("--output") + 1], "wb").write(b"x" * 2048)
'''

CHECK_OK = {
    "ok": True, "strict": False, "browserSkipped": False,
    "lint": {"ok": True, "errorCount": 0, "warningCount": 0, "infoCount": 0, "findings": []},
    "runtime": {"ok": True, "errorCount": 0, "warningCount": 1, "infoCount": 0,
                "findings": [{"code": "clip_media_fit", "severity": "warning", "message": "m"}]},
    "contrast": {"ok": True, "errorCount": 0, "warningCount": 1, "infoCount": 0, "findings": []},
    "hdr": {"autoPromotion": None}, "saved": {"report": "/x/check.json"},
}
CHECK_FEHLER = {
    "ok": False, "browserSkipped": False,
    "layout": {"ok": False, "errorCount": 1, "warningCount": 1, "findings": [
        {"code": "text_overflow", "severity": "error", "message": "Text ragt heraus",
         "sourceFile": "compositions/hook.html", "selector": "#titel", "time": 1.2},
        {"code": "x", "severity": "warning", "message": "egal"}]},
}


@pytest.fixture
def spielwiese(tmp_path, monkeypatch):
    """Projektordner, gespieltes npx und eigenes Sperrverzeichnis."""
    projekt = tmp_path / "video"
    projekt.mkdir()
    (projekt / "index.html").write_text("<html></html>")
    skript = tmp_path / "npx.py"
    skript.write_text(FALSCHES_NPX)
    log = tmp_path / "aufrufe.jsonl"
    monkeypatch.setenv("FABRIK_NPX", f"{sys.executable} {skript}")
    monkeypatch.setenv("FAKE_LOG", str(log))
    monkeypatch.setenv("FABRIK_SPERREN", str(tmp_path / "sperren"))

    def check_json(daten: dict, exit_code: int = 0):
        datei = tmp_path / "check.json"
        datei.write_text(json.dumps(daten))
        monkeypatch.setenv("FAKE_CHECK", str(datei))
        monkeypatch.setenv("FAKE_EXIT", str(exit_code))

    def aufrufe() -> list[dict]:
        return [json.loads(z) for z in log.read_text().splitlines()]
    return projekt, check_json, aufrufe


def test_check_ok(spielwiese):
    projekt, check_json, aufrufe = spielwiese
    check_json(CHECK_OK)
    e = hyperframes.check(projekt)
    assert e["ok"] and e["fehler"] == 0 and e["warnungen"] == 2
    assert e["abschnitte"]["runtime"] == {"fehler": 0, "warnungen": 1}
    assert e["bericht"] == "/x/check.json"
    (aufruf,) = aufrufe()
    assert aufruf["args"] == ["--yes", "hyperframes@0.8.206", "check", "--json"]
    assert aufruf["cwd"] == str(projekt)
    assert aufruf["ci"] == "1"           # kein Warmhalte-Chrome außerhalb des Slots


def test_check_mit_fehlern(spielwiese):
    projekt, check_json, _ = spielwiese
    check_json(CHECK_FEHLER, exit_code=1)
    e = hyperframes.check(projekt)
    assert not e["ok"] and e["fehler"] == 1 and e["exit"] == 1
    assert e["befunde"] == [{"abschnitt": "layout", "code": "text_overflow", "meldung": "Text ragt heraus",
                             "datei": "compositions/hook.html", "selektor": "#titel", "zeit": 1.2}]


def test_check_ohne_json(spielwiese, tmp_path, monkeypatch):
    projekt, _, _ = spielwiese
    kaputt = tmp_path / "kaputt.txt"
    kaputt.write_text("✗ Chrome nicht gefunden")
    monkeypatch.setenv("FAKE_CHECK", str(kaputt))
    monkeypatch.setenv("FAKE_EXIT", "1")
    e = hyperframes.check(projekt)
    assert not e["ok"] and "keine JSON-Ausgabe" in e["meldung"]


def test_kein_projekt(tmp_path):
    with pytest.raises(FabrikFehler) as e:
        hyperframes.check(tmp_path)
    assert e.value.code == 2


def test_render(spielwiese, tmp_path):
    projekt, _, aufrufe = spielwiese
    ziel = tmp_path / "renders" / "probe.mp4"
    e = hyperframes.render(projekt, ziel)
    assert e["ok"] and e["groesse_bytes"] == 2048 and e["ausgabe"] == str(ziel)
    assert e["dauer_s"] >= 0 and e["gewartet_s"] < 1
    (aufruf,) = aufrufe()
    assert aufruf["args"] == ["--yes", "hyperframes@0.8.206", "render", "--output", str(ziel),
                              "--workers", "3", "--quality", "looks"]


def test_render_zeitlimit_beendet_die_ganze_prozessgruppe(spielwiese, tmp_path, monkeypatch):
    projekt, _, _ = spielwiese
    kind_datei = tmp_path / "kind.pid"
    monkeypatch.setenv("FAKE_KIND", str(kind_datei))
    monkeypatch.setenv("FAKE_SCHLAF", "30")
    start = time.monotonic()
    e = hyperframes.render(projekt, tmp_path / "x.mp4", zeitlimit=1.5)
    assert time.monotonic() - start < 15
    assert not e["ok"] and e["meldung"].startswith("Zeitlimit")
    kind = int(kind_datei.read_text())
    for _ in range(40):                  # das "Chrome"-Kind muss mit beendet worden sein
        try:
            os.kill(kind, 0)
        except ProcessLookupError:
            break
        time.sleep(0.05)
    else:
        pytest.fail("Kindprozess lebt noch")


def test_sigterm_an_fabrik_beendet_auch_chrome(spielwiese, tmp_path, monkeypatch):
    """Beendet das Bash-Werkzeug fabrik.py, darf kein Chrome als Waise den Slot überleben."""
    import signal
    import subprocess

    from conftest import FABRIK_PY
    from werk.sperre import _freigeben, _versuche
    projekt, check_json, _ = spielwiese
    check_json(CHECK_OK)
    kind_datei = tmp_path / "kind.pid"
    monkeypatch.setenv("FAKE_KIND", str(kind_datei))
    monkeypatch.setenv("FAKE_SCHLAF", "30")
    fabrik = subprocess.Popen([sys.executable, str(FABRIK_PY), "check", str(projekt), "--json"],
                              stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    for _ in range(200):                         # warten, bis das "Chrome"-Kind läuft
        if kind_datei.exists() and kind_datei.read_text():
            break
        time.sleep(0.05)
    else:
        fabrik.kill()
        pytest.fail("Kindprozess wurde nicht gestartet")
    kind = int(kind_datei.read_text())
    fabrik.send_signal(signal.SIGTERM)
    assert fabrik.wait(timeout=15) == 128 + signal.SIGTERM
    for _ in range(60):
        try:
            os.kill(kind, 0)
        except ProcessLookupError:
            break
        time.sleep(0.05)
    else:
        pytest.fail("Chrome-Kind lebt nach SIGTERM an fabrik.py weiter")
    for datei in (tmp_path / "sperren").glob("chrome-*.sperre"):     # alle Slots wieder frei
        fd = _versuche(datei)
        assert fd is not None, datei
        _freigeben(fd)


def test_render_wartet_auf_freien_slot(spielwiese, tmp_path):
    projekt, _, _ = spielwiese
    sperren = tmp_path / "sperren"
    with slot("chrome", 1, verzeichnis=sperren):          # ein anderer Job rendert gerade
        e = hyperframes.render(projekt, tmp_path / "x.mp4", chrome_jobs=1, zeitlimit=0.5,
                               sperr_verzeichnis=sperren)
    assert not e["ok"] and "Kein freier Slot" in e["meldung"]
    assert hyperframes.render(projekt, tmp_path / "x.mp4", chrome_jobs=1,
                              sperr_verzeichnis=sperren)["ok"]


def test_cli_check_und_render(spielwiese, tmp_path):
    projekt, check_json, _ = spielwiese
    check_json(CHECK_FEHLER, exit_code=1)
    r = fabrik_cli("check", str(projekt), "--json")
    assert r.returncode == 1 and ein_json(r.stdout)["fehler"] == 1
    check_json(CHECK_OK)
    r = fabrik_cli("check", str(projekt), "--json")
    assert r.returncode == 0 and ein_json(r.stdout)["ok"] is True
    r = fabrik_cli("render", str(projekt), "-o", str(tmp_path / "a.mp4"))
    assert r.returncode == 0 and "MB in" in r.stdout


@pytest.mark.langsam
def test_echter_check_an_einer_kopie_der_probe(tmp_path, monkeypatch):
    if shutil.which("npx") is None:
        pytest.skip("npx fehlt")
    monkeypatch.setenv("FABRIK_SPERREN", str(tmp_path / "sperren"))
    monkeypatch.delenv("FABRIK_NPX", raising=False)
    # Kopie, damit check nichts in den echten Probe-Ordner schreibt (.hyperframes/).
    kopie = tmp_path / "probe"
    shutil.copytree(REPO_WURZEL / "studio" / "probe-opportunitaetskosten", kopie,
                    ignore=shutil.ignore_patterns("renders", ".hyperframes", "manim", "__pycache__"))
    e = hyperframes.check(kopie, zeitlimit=300)
    assert e.get("browser_uebersprungen") is False, e
    assert e["ok"] and e["fehler"] == 0, e
