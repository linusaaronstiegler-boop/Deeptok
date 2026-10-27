"""Dünne Hülle um die HyperFrames-CLI: check (Tor G5) und render.

Beide starten Chrome. Chrome ist der teuerste Teil der Nacht (CPU und Speicher), deshalb
laufen höchstens chrome_jobs davon gleichzeitig (Slots aus werk/sperre.py). Die CLI-Version
ist gepinnt, damit ein Update von HyperFrames nicht mitten in der Testwoche alles ändert.

Zeitlimits: Ein Befehl in einer Scheduled-Task-Sitzung darf höchstens 10 min laufen.
Deshalb gilt für Warten auf den Slot plus Rendern zusammen ein Limit von 570 s (9,5 min).
Läuft es ab, beenden wir die ganze Prozessgruppe (npx, node und alle Chrome-Kinder),
damit keine verwaisten Chrome-Prozesse die nächsten Jobs ausbremsen.

Dasselbe gilt, wenn fabrik.py selbst beendet wird (SIGTERM, SIGINT, SIGHUP), z. B. weil das
Bash-Werkzeug sein Zeitlimit erreicht. Sonst liefe Chrome als Waise weiter, während flock den
Slot schon freigibt: Dann rendern mehr als chrome_jobs gleichzeitig. Gegen kill -9 hilft das
nicht; deshalb render und check immer mit Bash-timeout 600000 aufrufen.

Warmhalte-Modus: "hyperframes check" startet ohne Terminal einen Hintergrundprozess
(warmCheck.js), der Chrome 5 min lang warm hält, außerhalb unseres Slots. Mit CI=1 schaltet
die CLI 0.8.206 das ab (bin/hyperframes.mjs -> warmCheckEligible prüft env.CI).
"""
from __future__ import annotations

import json
import os
import shlex
import signal
import subprocess
import threading
import time
from pathlib import Path

from werk import EXIT_EINGABE, FabrikFehler
from werk.sperre import SperreZeitlimit, slot

HYPERFRAMES = "hyperframes@0.8.206"
GESAMT_ZEITLIMIT_S = 570.0


def _npx() -> list[str]:
    # FABRIK_NPX ersetzt "npx", z. B. durch ein Test-Skript, das HyperFrames nur spielt.
    return shlex.split(os.environ.get("FABRIK_NPX", "npx"))


def _beende_gruppe(proc: subprocess.Popen, warte_s: float = 10) -> tuple[str, str]:
    """Erst höflich (SIGTERM), dann hart (SIGKILL): die ganze Gruppe, nicht nur npx."""
    for sig in (signal.SIGTERM, signal.SIGKILL):
        try:
            os.killpg(proc.pid, sig)
        except ProcessLookupError:
            pass
        try:
            out, err = proc.communicate(timeout=warte_s)
            return out or "", err or ""
        except subprocess.TimeoutExpired:
            continue
    return "", ""


def _laufe(befehl: list[str], cwd: Path, zeitlimit: float, umgebung: dict | None = None) -> dict:
    """Startet einen Prozess in eigener Prozessgruppe und wartet höchstens `zeitlimit` Sekunden."""
    start = time.monotonic()
    # stdin aus /dev/null: Die CLI soll nie auf eine Eingabe warten, die niemand gibt.
    proc = subprocess.Popen(befehl, cwd=cwd, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE, text=True, start_new_session=True,
                            env=umgebung)

    def bei_signal(signum, _frame):
        # fabrik.py wird gerade beendet: Chrome muss mit. Hier kein communicate() oder wait():
        # Das Hauptprogramm steckt mitten in communicate(), ein zweiter Aufruf könnte hängen.
        # Also: SIGTERM, 1 s Gnadenfrist, dann SIGKILL an die ganze Gruppe.
        # SystemExit läuft danach durch den with-Block von slot(), der den Slot freigibt.
        for sig in (signal.SIGTERM, signal.SIGKILL):
            try:
                os.killpg(proc.pid, sig)
            except ProcessLookupError:
                break
            if sig == signal.SIGTERM:
                time.sleep(1.0)
        raise SystemExit(128 + signum)

    alte_handler = {}
    if threading.current_thread() is threading.main_thread():   # Signale gibt es nur dort
        for sig in (signal.SIGTERM, signal.SIGINT, signal.SIGHUP):
            alte_handler[sig] = signal.signal(sig, bei_signal)
    abgebrochen = False
    try:
        out, err = proc.communicate(timeout=max(1.0, zeitlimit))
    except subprocess.TimeoutExpired:
        abgebrochen = True
        out, err = _beende_gruppe(proc)
    finally:
        for sig, handler in alte_handler.items():
            signal.signal(sig, handler if handler is not None else signal.SIG_DFL)
    return {"exit": proc.returncode, "stdout": out or "", "stderr": err or "",
            "dauer_s": round(time.monotonic() - start, 1), "abgebrochen": abgebrochen}


def _projekt(pfad: Path | str) -> Path:
    projekt = Path(pfad).resolve()
    if not (projekt / "index.html").is_file():
        raise FabrikFehler(f"{projekt} ist kein HyperFrames-Projekt (index.html fehlt)", EXIT_EINGABE)
    return projekt


def _ende(text: str, zeilen: int = 8) -> str:
    return "\n".join(text.strip().splitlines()[-zeilen:])


def _lies_json(stdout: str) -> dict | None:
    """Die CLI schreibt mit --json genau ein Objekt auf stdout; zur Sicherheit ab der ersten '{'."""
    start = stdout.find("{")
    if start < 0:
        return None
    try:
        return json.loads(stdout[start:])
    except json.JSONDecodeError:
        return None


def fasse_check_zusammen(daten: dict, max_befunde: int = 20) -> dict:
    """Aus dem großen check-JSON das Wichtige: Fehler und Warnungen je Abschnitt, Fehlerbefunde."""
    abschnitte, befunde = {}, []
    for name, teil in daten.items():
        if not isinstance(teil, dict) or "errorCount" not in teil:
            continue
        abschnitte[name] = {"fehler": teil.get("errorCount", 0), "warnungen": teil.get("warningCount", 0)}
        for b in teil.get("findings") or []:
            if b.get("severity") == "error" and len(befunde) < max_befunde:
                befunde.append({"abschnitt": name, "code": b.get("code"), "meldung": b.get("message"),
                                "datei": b.get("sourceFile"), "selektor": b.get("selector"),
                                "zeit": b.get("time")})
    fehler = sum(a["fehler"] for a in abschnitte.values())
    return {"ok": bool(daten.get("ok")) and fehler == 0, "fehler": fehler,
            "warnungen": sum(a["warnungen"] for a in abschnitte.values()),
            "browser_uebersprungen": daten.get("browserSkipped"), "abschnitte": abschnitte,
            "befunde": befunde, "bericht": (daten.get("saved") or {}).get("report")}


def check(projekt: Path | str, chrome_jobs: int = 2, zeitlimit: float = 300.0,
          sperr_verzeichnis: Path | str | None = None) -> dict:
    """npx hyperframes check --json im Projektordner. ok=False bei mindestens einem Fehler."""
    projekt = _projekt(projekt)
    start = time.monotonic()
    try:
        with slot("chrome", chrome_jobs, zeitlimit=zeitlimit, verzeichnis=sperr_verzeichnis) as s:
            # CI=1 schaltet den Warmhalte-Prozess ab (siehe Modul-Docstring).
            lauf = _laufe([*_npx(), "--yes", HYPERFRAMES, "check", "--json"], projekt,
                          zeitlimit - s.gewartet_s, umgebung={**os.environ, "CI": "1"})
    except SperreZeitlimit as e:
        return {"ok": False, "fehler": 1, "meldung": str(e), "dauer_s": round(time.monotonic() - start, 1)}
    daten = _lies_json(lauf["stdout"])
    if daten is None:
        grund = "Zeitlimit" if lauf["abgebrochen"] else "keine JSON-Ausgabe"
        return {"ok": False, "fehler": 1, "meldung": f"{grund}: {_ende(lauf['stderr'] or lauf['stdout'])}",
                "exit": lauf["exit"], "dauer_s": lauf["dauer_s"], "gewartet_s": s.gewartet_s}
    ergebnis = fasse_check_zusammen(daten)
    ergebnis["ok"] = ergebnis["ok"] and lauf["exit"] == 0
    ergebnis.update({"exit": lauf["exit"], "dauer_s": lauf["dauer_s"], "gewartet_s": s.gewartet_s})
    return ergebnis


def render(projekt: Path | str, ausgabe: Path | str, chrome_jobs: int = 2, workers: int = 3,
           qualitaet: str | None = "looks", zeitlimit: float = GESAMT_ZEITLIMIT_S,
           sperr_verzeichnis: Path | str | None = None) -> dict:
    """npx hyperframes render --workers 3 unter der Chrome-Sperre. Gibt Dauer und Größe zurück.

    --workers 3 statt "auto": auf den Cloud-Containern wählt "auto" nur 1 Worker
    (gemessen: 104 s statt 57 s, docs/VIDEO-PIPELINE.md §7).
    """
    projekt = _projekt(projekt)
    ausgabe = Path(ausgabe).resolve()
    ausgabe.parent.mkdir(parents=True, exist_ok=True)
    befehl = [*_npx(), "--yes", HYPERFRAMES, "render", "--output", str(ausgabe),
              "--workers", str(workers)]
    if qualitaet:
        befehl += ["--quality", qualitaet]
    start = time.monotonic()
    try:
        with slot("chrome", chrome_jobs, zeitlimit=zeitlimit, verzeichnis=sperr_verzeichnis) as s:
            lauf = _laufe(befehl, projekt, zeitlimit - s.gewartet_s)
    except SperreZeitlimit as e:
        return {"ok": False, "meldung": str(e), "ausgabe": str(ausgabe),
                "dauer_s": round(time.monotonic() - start, 1)}
    groesse = ausgabe.stat().st_size if ausgabe.is_file() else 0
    ok = lauf["exit"] == 0 and groesse > 0 and not lauf["abgebrochen"]
    ergebnis = {"ok": ok, "ausgabe": str(ausgabe), "dauer_s": lauf["dauer_s"],
                "groesse_bytes": groesse, "groesse_mb": round(groesse / 1e6, 2),
                "gewartet_s": s.gewartet_s, "slot": s.nummer, "exit": lauf["exit"]}
    if not ok:
        grund = "Zeitlimit" if lauf["abgebrochen"] else "Render fehlgeschlagen"
        ergebnis["meldung"] = f"{grund}: {_ende(lauf['stderr'] or lauf['stdout'])}"
    return ergebnis
