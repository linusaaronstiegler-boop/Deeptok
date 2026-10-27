"""Gemeinsame Test-Helfer der Fabrik.

- factory/ kommt in sys.path, damit "import werk" klappt (wie in fabrik.py).
- Marker "langsam": Tests mit echtem Whisper-Modell oder echtem Chrome.
  Nur die schnellen: pytest factory/tests -m "not langsam"
- Git läuft in den Tests mit eigener, leerer Konfiguration (kein Signieren, Test-Identität),
  damit die Tests nirgends von der Maschine abhängen und nie das echte origin berühren.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

import pytest

FABRIK_DIR = Path(__file__).resolve().parent.parent
REPO_WURZEL = FABRIK_DIR.parent
FABRIK_PY = FABRIK_DIR / "fabrik.py"
if str(FABRIK_DIR) not in sys.path:
    sys.path.insert(0, str(FABRIK_DIR))


def pytest_configure(config):
    config.addinivalue_line("markers", "langsam: echtes Whisper-Modell oder echtes Chrome (dauert)")


def git(*args: str, cwd: Path | str) -> str:
    """git-Aufruf für Testvorbereitungen; bricht bei Fehlern ab."""
    r = subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True,
                       env={**os.environ, "LC_ALL": "C"})
    if r.returncode != 0:
        raise AssertionError(f"git {' '.join(args)}: {r.stderr}")
    return r.stdout.strip()


class Uhr:
    """Eine stellbare Uhr für die Fabrik: uhr() gibt die Zeit, uhr.vor(min) dreht weiter."""

    def __init__(self, iso: str = "2026-10-27T22:07:00Z"):
        from werk.zustand import lies_iso
        self.zeit: datetime = lies_iso(iso)

    def __call__(self) -> datetime:
        return self.zeit

    def vor(self, minuten: float) -> None:
        self.zeit += timedelta(minutes=minuten)


@pytest.fixture
def git_umgebung(tmp_path, monkeypatch):
    """Isolierte Git-Konfiguration und Umgebung für einen Test."""
    konfig = tmp_path / "gitconfig"
    konfig.write_text("[user]\n\tname = Fabrik-Test\n\temail = test@example.invalid\n"
                      "[commit]\n\tgpgsign = false\n[init]\n\tdefaultBranch = main\n")
    monkeypatch.setenv("GIT_CONFIG_GLOBAL", str(konfig))
    monkeypatch.setenv("GIT_CONFIG_NOSYSTEM", "1")
    for name in ("FABRIK_OHNE_PUSH", "FABRIK_JETZT", "FABRIK_NPX", "FABRIK_PRIVATE_SPERRLISTE"):
        monkeypatch.delenv(name, raising=False)
    monkeypatch.setenv("FABRIK_SPERREN", str(tmp_path / "sperren"))
    return tmp_path


@pytest.fixture
def remote(git_umgebung) -> Path:
    """Ein leeres Bare-Repo als 'GitHub' mit einem ersten Commit auf main."""
    bare = git_umgebung / "remote.git"
    git("init", "-q", "--bare", str(bare), cwd=git_umgebung)
    saat = git_umgebung / "saat"
    git("init", "-q", str(saat), cwd=git_umgebung)
    (saat / "README.md").write_text("Test-Repo\n")
    git("add", "README.md", cwd=saat)
    git("commit", "-q", "-m", "init", cwd=saat)
    git("push", "-q", str(bare), "HEAD:refs/heads/main", cwd=saat)
    return bare


@pytest.fixture
def klon(git_umgebung, remote):
    """Fabrik-Funktion: klon('a') legt einen frischen Klon des Remotes an (origin = Bare-Repo)."""
    def mache(name: str) -> Path:
        ziel = git_umgebung / name
        git("clone", "-q", str(remote), str(ziel), cwd=git_umgebung)
        return ziel
    return mache


@pytest.fixture
def fabrik_fuer():
    """Baut eine Fabrik für einen Klon, mit stellbarer Uhr und kurzen Wartezeiten."""
    from werk.konfig import STANDARD
    from werk.zustand import Fabrik, Zustandsspeicher

    def mache(repo: Path, uhr: Uhr, ohne_push: bool = False, **konfig) -> Fabrik:
        speicher = Zustandsspeicher(repo, "origin", ohne_push=ohne_push,
                                    wartezeiten=(0.01, 0.01, 0.01, 0.01))
        return Fabrik(repo, {**STANDARD, **konfig}, uhr=uhr, speicher=speicher)
    return mache


def briefs(*ids: str, **felder) -> list[dict]:
    """Gültige Briefs für Tests."""
    return [{"id": i, "titel": f"Titel {i}", "kanal": "wirtschaft", "niveau": "beide",
             "bogen": "fall-prinzip", "serie": "opp", "teil": n + 1, **felder}
            for n, i in enumerate(ids)]


def fabrik_cli(*args: str, env: dict | None = None, cwd: Path | None = None) -> subprocess.CompletedProcess:
    """Ruft fabrik.py als eigenen Prozess auf, wie es ein Agent tut."""
    return subprocess.run([sys.executable, str(FABRIK_PY), *args], capture_output=True, text=True,
                          env={**os.environ, **(env or {})}, cwd=cwd, timeout=300)


def ein_json(stdout: str) -> dict:
    """Prüft, dass stdout genau EIN JSON-Objekt enthält, und gibt es zurück."""
    text = stdout.strip()
    objekt = json.loads(text)          # wirft, wenn es mehr oder etwas anderes ist
    assert isinstance(objekt, dict)
    assert "\n" not in text
    return objekt
