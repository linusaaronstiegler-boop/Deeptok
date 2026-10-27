"""Zustand auf dem Branch factory-state, gegen ein lokales Bare-Repo als Remote."""
from __future__ import annotations

import json
import subprocess

import pytest
from conftest import Uhr, briefs, ein_json, fabrik_cli, git

from werk import EXIT_BESETZT, EXIT_DECKEL, EXIT_EINGABE, EXIT_FEHLER, EXIT_PAUSE, FabrikFehler
from werk.zustand import (BRANCH, REF_LOKAL, REF_OHNE_PUSH, WORKTREE_NAME, leerer_zustand, lies_iso,
                          status_bericht)

NACHT = "2026-10-27"      # 22:07 UTC = 23:07 Berlin am 27.10.


def remote_zustand(remote, nacht=NACHT) -> dict:
    return json.loads(git("show", f"{BRANCH}:zustand/{nacht}.json", cwd=remote))


def remote_hat_branch(remote) -> bool:
    return bool(git("branch", "--list", BRANCH, cwd=remote))


def code(ausnahme_info) -> int:
    return ausnahme_info.value.code


# --- Branch anlegen ---------------------------------------------------------------------------

def test_leerer_remote_status_schreibt_nichts(klon, remote, fabrik_fuer):
    f = fabrik_fuer(klon("a"), Uhr())
    bericht = f.status()
    assert bericht == {"nacht": NACHT, "pause": False, "lauf": None, "videos": [],
                       "naechster_schritt": "slate"}
    assert not remote_hat_branch(remote)          # Lesen pusht nichts


def test_leerer_remote_bekommt_orphan_branch(klon, remote, fabrik_fuer):
    repo = klon("a")
    f = fabrik_fuer(repo, Uhr())
    f.beginne("nacht-1")
    assert remote_hat_branch(remote)
    # Orphan: kein gemeinsamer Vorfahr mit main, die Wurzel hat keine Eltern.
    wurzeln = git("rev-list", "--max-parents=0", BRANCH, cwd=remote).split()
    assert len(wurzeln) == 1
    assert git("log", "--format=%s", wurzeln[0], "-1", cwd=remote) == f"zustand {NACHT}: Branch angelegt"
    r = subprocess.run(["git", "merge-base", "main", BRANCH], cwd=remote, capture_output=True)
    assert r.returncode == 1                       # 1 = kein gemeinsamer Vorfahr
    assert remote_zustand(remote)["lauf"]["id"] == "nacht-1"
    assert git("log", "--format=%s", "-1", BRANCH, cwd=remote) == f"zustand {NACHT}: beginne nacht-1"
    # Lokal: kein Branch angelegt, Arbeitskopie von git status ausgeschlossen.
    assert git("branch", "--list", BRANCH, cwd=repo) == ""
    assert (repo / WORKTREE_NAME / "zustand" / f"{NACHT}.json").is_file()
    assert git("status", "--porcelain", cwd=repo) == ""


# --- Ablauf einer Nacht -----------------------------------------------------------------------

def test_ablauf_einer_nacht(klon, remote, fabrik_fuer):
    uhr = Uhr()
    f = fabrik_fuer(klon("a"), uhr, videos_pro_nacht=3)
    assert f.beginne("nacht-1") == {"lauf": "nacht-1", "neu": True, "uebernommen_von": None}
    assert f.status()["naechster_schritt"] == "laeuft"
    assert f.status(eigener_lauf="nacht-1")["naechster_schritt"] == "slate"

    auskunft = f.plan(briefs("v1", "v2", "v3", "v4"))
    assert auskunft == {"angelegt": ["v1", "v2", "v3"], "verworfen": ["v4"], "schon_geplant": []}

    uhr.vor(5)
    f.video("v1", "skript")
    f.video("v1", "spec", notiz="Spec gefüllt")
    uhr.vor(5)
    assert f.herzschlag("nacht-1")["herzschlag"] == "2026-10-27T22:17:00Z"

    s = f.status(eigener_lauf="nacht-1")
    assert s["naechster_schritt"] == "produktion"
    assert s["lauf"] == {"id": "nacht-1", "herzschlag": "2026-10-27T22:17:00Z", "alter_min": 0.0}
    assert s["videos"] == [{"id": "v1", "status": "spec", "versuche": 0},
                           {"id": "v2", "status": "geplant", "versuche": 0},
                           {"id": "v3", "status": "geplant", "versuche": 0}]

    f.video("v1", "veroeffentlicht")
    f.video("v2", "fehler", notiz="Stimme fehlt")
    f.video("v3", "mensch")
    uhr.vor(20)
    bericht = f.ende("nacht-1", notiz="Kalibriernacht 1")
    assert bericht["dauer_min"] == 30.0
    assert bericht["videos"] == {"veroeffentlicht": 1, "fehler": 1, "mensch": 1}

    z = remote_zustand(remote)
    assert z["lauf"] is None and z["bericht"]["notiz"] == "Kalibriernacht 1"
    assert z["verworfen"][0]["id"] == "v4"
    assert z["laeufe"][0]["ende"] == "2026-10-27T22:37:00Z"
    v1 = z["videos"][0]
    assert [e["nach"] for e in v1["verlauf"]] == ["geplant", "skript", "spec", "veroeffentlicht"]
    assert v1["notiz"] == "Spec gefüllt"
    assert f.status()["naechster_schritt"] == "fertig"
    # Jede Änderung ist ein eigener Commit mit dem vereinbarten Text.
    log = git("log", "--format=%s", BRANCH, cwd=remote).splitlines()
    assert log[0] == f"zustand {NACHT}: ende nacht-1"
    assert f"zustand {NACHT}: video v1 -> skript" in log


def test_herzschlag_ist_utc_mit_z(klon, fabrik_fuer):
    f = fabrik_fuer(klon("a"), Uhr("2026-10-27T23:07:00+01:00"))
    f.beginne("nacht-1")
    assert f.status()["lauf"]["herzschlag"] == "2026-10-27T22:07:00Z"


# --- Zwei Läufe -------------------------------------------------------------------------------

def test_zweiter_lauf_mit_frischem_herzschlag_bekommt_exit_3(klon, fabrik_fuer):
    uhr = Uhr()
    a, b = fabrik_fuer(klon("a"), uhr), fabrik_fuer(klon("b"), uhr)
    a.beginne("nacht-1")
    uhr.vor(10)
    with pytest.raises(FabrikFehler) as e:
        b.beginne("weiterlauf-1")
    assert code(e) == EXIT_BESETZT
    assert b.status()["naechster_schritt"] == "laeuft"


def test_herzschlag_haelt_den_lauf_am_leben(klon, fabrik_fuer):
    uhr = Uhr()
    a, b = fabrik_fuer(klon("a"), uhr), fabrik_fuer(klon("b"), uhr)
    a.beginne("nacht-1")
    uhr.vor(12)
    a.herzschlag("nacht-1")
    uhr.vor(12)                          # 24 min nach Beginn, aber nur 12 nach dem Herzschlag
    with pytest.raises(FabrikFehler) as e:
        b.beginne("weiterlauf-1")
    assert code(e) == EXIT_BESETZT


def test_abgelaufener_herzschlag_wird_uebernommen(klon, remote, fabrik_fuer):
    uhr = Uhr()
    a, b = fabrik_fuer(klon("a"), uhr), fabrik_fuer(klon("b"), uhr)
    a.beginne("nacht-1")
    a.plan(briefs("v1"))
    uhr.vor(16)                          # Container von nacht-1 ist "abgestürzt"
    assert b.status()["naechster_schritt"] == "produktion"
    assert b.beginne("weiterlauf-1")["uebernommen_von"] == "nacht-1"
    # Der alte Lauf ist nicht mehr Besitzer.
    with pytest.raises(FabrikFehler) as e:
        a.herzschlag("nacht-1")
    assert code(e) == EXIT_BESETZT
    with pytest.raises(FabrikFehler) as e:
        a.ende("nacht-1")
    assert code(e) == EXIT_BESETZT
    z = remote_zustand(remote)
    assert z["lauf"]["id"] == "weiterlauf-1"
    assert z["laeufe"][0]["abgeloest_von"] == "weiterlauf-1"
    assert z["videos"][0]["id"] == "v1"            # Arbeit des alten Laufs ist noch da


def test_derselbe_lauf_darf_erneut_beginnen(klon, fabrik_fuer):
    uhr = Uhr()
    f = fabrik_fuer(klon("a"), uhr)
    f.beginne("nacht-1")
    uhr.vor(3)
    assert f.beginne("nacht-1")["neu"] is False


def test_zwei_klone_schreiben_nacheinander(klon, remote, fabrik_fuer):
    uhr = Uhr()
    a, b = fabrik_fuer(klon("a"), uhr), fabrik_fuer(klon("b"), uhr)
    a.plan(briefs("v1", "v2"))
    b.video("v1", "skript")              # b holt vorher den Stand von a
    a.video("v2", "skript")              # und a den von b
    z = remote_zustand(remote)
    assert [v["status"] for v in z["videos"]] == ["skript", "skript"]


def test_non_fast_forward_wird_geloest(klon, remote, fabrik_fuer):
    """Wettlauf: a pusht genau zwischen fetch und push von b. b muss neu anwenden."""
    uhr = Uhr()
    a, b = fabrik_fuer(klon("a"), uhr), fabrik_fuer(klon("b"), uhr)
    a.plan(briefs("v1", "v2"))
    b.status()                           # b kennt jetzt den Stand mit v1, v2

    def a_kommt_dazwischen():
        b.speicher.testhaken_vor_push = None          # nur beim ersten Push-Versuch
        a.video("v2", "spec")
    b.speicher.testhaken_vor_push = a_kommt_dazwischen
    b.video("v1", "skript")

    z = remote_zustand(remote)
    assert {v["id"]: v["status"] for v in z["videos"]} == {"v1": "skript", "v2": "spec"}
    # Die Geschichte ist linear: Der abgelehnte Commit von b ist verschwunden.
    log = git("log", "--format=%s", BRANCH, cwd=remote).splitlines()
    assert log[:2] == [f"zustand {NACHT}: video v1 -> skript", f"zustand {NACHT}: video v2 -> spec"]
    assert git("rev-list", "--merges", "--count", BRANCH, cwd=remote) == "0"


def test_wettlauf_beim_beginnen(klon, remote, fabrik_fuer):
    """Beide rufen gleichzeitig 'beginne': Der Zweite sieht beim Neu-Anwenden den Ersten."""
    uhr = Uhr()
    a, b = fabrik_fuer(klon("a"), uhr), fabrik_fuer(klon("b"), uhr)

    def a_beginnt_zuerst():
        b.speicher.testhaken_vor_push = None
        a.beginne("nacht-1")
    b.speicher.testhaken_vor_push = a_beginnt_zuerst
    with pytest.raises(FabrikFehler) as e:
        b.beginne("weiterlauf-1")
    assert code(e) == EXIT_BESETZT
    assert remote_zustand(remote)["lauf"]["id"] == "nacht-1"


def test_zwei_klone_legen_gleichzeitig_den_branch_an(klon, remote, fabrik_fuer):
    """Beide haben lokal eine eigene Orphan-Wurzel; der Zweite übernimmt die des Ersten."""
    uhr = Uhr()
    a, b = fabrik_fuer(klon("a"), uhr), fabrik_fuer(klon("b"), uhr)
    a.status()
    b.status()                           # beide Wurzeln existieren nur lokal

    def a_zuerst():
        b.speicher.testhaken_vor_push = None
        a.plan(briefs("v1"))
    b.speicher.testhaken_vor_push = a_zuerst
    b.plan(briefs("v2"))
    assert [v["id"] for v in remote_zustand(remote)["videos"]] == ["v1", "v2"]
    assert len(git("rev-list", "--max-parents=0", BRANCH, cwd=remote).split()) == 1


# --- PAUSE, Plan, Deckel ----------------------------------------------------------------------

def test_pause_datei(klon, fabrik_fuer):
    repo = klon("a")
    f = fabrik_fuer(repo, Uhr())
    (repo / "factory").mkdir()
    (repo / "factory" / "PAUSE").write_text("Kalibrierung abwarten\n")
    assert f.status()["naechster_schritt"] == "pause"
    assert f.status()["pause"] is True
    with pytest.raises(FabrikFehler) as e:
        f.beginne("nacht-1")
    assert code(e) == EXIT_PAUSE
    (repo / "factory" / "PAUSE").unlink()
    f.beginne("nacht-1")
    assert f.status()["naechster_schritt"] == "laeuft"


def test_plan_weist_doppelte_ids_ab(klon, remote, fabrik_fuer):
    f = fabrik_fuer(klon("a"), Uhr())
    with pytest.raises(FabrikFehler) as e:
        f.plan(briefs("v1", "v1"))
    assert code(e) == EXIT_EINGABE
    f.plan(briefs("v1"))
    with pytest.raises(FabrikFehler) as e:
        f.plan(briefs("v2", "v1"))
    assert code(e) == EXIT_EINGABE and "v1" in str(e.value)
    assert [v["id"] for v in remote_zustand(remote)["videos"]] == ["v1"]


def test_plan_deckel_zaehlt_vorhandene_videos(klon, fabrik_fuer):
    f = fabrik_fuer(klon("a"), Uhr(), videos_pro_nacht=3)
    f.plan(briefs("v1", "v2"))
    assert f.plan(briefs("v3", "v4")) == {"angelegt": ["v3"], "verworfen": ["v4"], "schon_geplant": []}
    assert f.plan(briefs("v5")) == {"angelegt": [], "verworfen": ["v5"], "schon_geplant": []}


@pytest.mark.parametrize("kaputt", [
    {"niveau": "alle"}, {"titel": ""}, {"teil": 0}, {"teil": "1"}, {"id": "mit leerzeichen"},
])
def test_plan_prueft_briefs(klon, fabrik_fuer, kaputt):
    f = fabrik_fuer(klon("a"), Uhr())
    with pytest.raises(FabrikFehler) as e:
        f.plan(briefs("v1", **kaputt))
    assert code(e) == EXIT_EINGABE


def test_plan_ohne_serie_ist_erlaubt(klon, fabrik_fuer):
    f = fabrik_fuer(klon("a"), Uhr())
    assert f.plan(briefs("news-1", serie=None, teil=None))["angelegt"] == ["news-1"]


def test_reparatur_deckel(klon, fabrik_fuer):
    f = fabrik_fuer(klon("a"), Uhr(), max_reparaturen=2)
    f.plan(briefs("v1"))
    for s in ("skript", "spec", "gebaut"):
        f.video("v1", s)
    assert f.video("v1", "fehler")["versuche"] == 1
    assert f.video("v1", "spec")["versuche"] == 1          # Reparatur 1, zählt nicht doppelt
    assert f.video("v1", "gebaut")["versuche"] == 1
    assert f.video("v1", "spec")["versuche"] == 2          # Schritt zurück = Reparatur 2
    assert f.video("v1", "fehler")["versuche"] == 3
    with pytest.raises(FabrikFehler) as e:                  # Reparatur 3 wäre zu viel
        f.video("v1", "skript")
    assert code(e) == EXIT_DECKEL
    assert f.video("v1", "mensch")["status"] == "mensch"
    assert f.status()["videos"][0] == {"id": "v1", "status": "mensch", "versuche": 3}


def test_video_unbekannt_oder_unveraendert(klon, remote, fabrik_fuer):
    f = fabrik_fuer(klon("a"), Uhr())
    f.plan(briefs("v1"))
    with pytest.raises(FabrikFehler) as e:
        f.video("v9", "skript")
    assert code(e) == EXIT_EINGABE
    vorher = git("rev-parse", BRANCH, cwd=remote)
    f.video("v1", "geplant")                               # keine Änderung, kein Commit
    assert git("rev-parse", BRANCH, cwd=remote) == vorher


def test_ende_fremder_lauf_und_doppeltes_ende(klon, fabrik_fuer):
    f = fabrik_fuer(klon("a"), Uhr())
    f.beginne("nacht-1")
    with pytest.raises(FabrikFehler) as e:
        f.ende("jemand-anders")
    assert code(e) == EXIT_BESETZT
    f.ende("nacht-1")
    assert f.ende("nacht-1") == {"lauf": "nacht-1", "schon_beendet": True}
    assert f.status()["lauf"] is None


# --- Robustheit -------------------------------------------------------------------------------

def test_ohne_push_bleibt_alles_lokal(klon, remote, fabrik_fuer):
    repo = klon("a")
    f = fabrik_fuer(repo, Uhr(), ohne_push=True)
    f.beginne("nacht-1")
    f.plan(briefs("v1"))
    assert not remote_hat_branch(remote)
    assert f.status()["videos"] == [{"id": "v1", "status": "geplant", "versuche": 0}]


def test_verlorene_arbeitskopie_wird_wiederhergestellt(klon, fabrik_fuer):
    import shutil
    repo = klon("a")
    f = fabrik_fuer(repo, Uhr(), ohne_push=True)
    f.plan(briefs("v1"))
    assert git("rev-parse", REF_OHNE_PUSH, cwd=repo)
    shutil.rmtree(repo / WORKTREE_NAME)                    # z. B. durch "git clean -fdx"
    assert f.status()["videos"][0]["id"] == "v1"


def test_neuer_container_holt_den_zustand(klon, fabrik_fuer):
    """Ein frischer Klon (neuer Container) sieht alles, was der alte gepusht hat."""
    uhr = Uhr()
    fabrik_fuer(klon("alt"), uhr).plan(briefs("v1", "v2"))
    neu = fabrik_fuer(klon("neu"), uhr)
    assert [v["id"] for v in neu.status()["videos"]] == ["v1", "v2"]


def test_status_bericht_reihenfolge():
    jetzt = lies_iso("2026-10-27T22:30:00Z")
    z = leerer_zustand(NACHT)
    assert status_bericht(z, False, jetzt, 15)["naechster_schritt"] == "slate"
    z["lauf"] = {"id": "x", "beginn": "2026-10-27T22:00:00Z", "herzschlag": "2026-10-27T22:20:00Z"}
    assert status_bericht(z, False, jetzt, 15)["naechster_schritt"] == "laeuft"
    assert status_bericht(z, True, jetzt, 15)["naechster_schritt"] == "pause"
    assert status_bericht(z, False, jetzt, 10)["naechster_schritt"] == "slate"   # Herzschlag 10 min alt
    z["videos"] = [{"id": "v", "status": "fehler", "versuche": 1}]
    assert status_bericht(z, False, jetzt, 5)["naechster_schritt"] == "fertig"


# --- Kommandozeile ----------------------------------------------------------------------------

def test_cli_ablauf_mit_remote_als_pfad(klon, remote, git_umgebung):
    """Wie ein Agent: fabrik.py als Prozess, --remote zeigt direkt auf ein Bare-Repo."""
    repo = klon("a")
    git("remote", "remove", "origin", cwd=repo)            # origin darf nie berührt werden
    basis = ["--repo", str(repo), "--remote", str(remote)]
    zeit = {"FABRIK_JETZT": "2026-10-27T22:07:00Z"}

    r = fabrik_cli("status", "--json", *basis, env=zeit)
    assert r.returncode == 0, r.stderr
    assert ein_json(r.stdout) == {"nacht": NACHT, "pause": False, "lauf": None, "videos": [],
                                  "naechster_schritt": "slate"}

    r = fabrik_cli(*basis, "beginne", "--lauf", "nacht-1", "--json", env=zeit)
    assert r.returncode == 0 and ein_json(r.stdout)["neu"] is True

    r = fabrik_cli(*basis, "beginne", "--lauf", "weiterlauf-1", "--json",
                   env={"FABRIK_JETZT": "2026-10-28T00:37:00Z"})   # 01:37 Berlin, 150 min später
    assert r.returncode == 0 and ein_json(r.stdout)["uebernommen_von"] == "nacht-1"

    r = fabrik_cli(*basis, "herzschlag", "--lauf", "nacht-1", "--json",
                   env={"FABRIK_JETZT": "2026-10-28T00:38:00Z"})
    assert r.returncode == EXIT_BESETZT
    fehler = ein_json(r.stdout)
    assert fehler["ok"] is False and fehler["exit"] == EXIT_BESETZT

    spaeter = {"FABRIK_JETZT": "2026-10-28T00:40:00Z"}
    datei = git_umgebung / "briefs.json"
    datei.write_text(json.dumps(briefs("v1", "v2", "v3", "v4")), encoding="utf-8")
    r = fabrik_cli(*basis, "plan", "--datei", str(datei), env=spaeter)
    assert r.returncode == 0 and "v4" in r.stderr                 # Verworfenes wird gemeldet

    r = fabrik_cli(*basis, "video", "v1", "--status", "unsinn", env=spaeter)
    assert r.returncode == 2                                       # argparse lehnt ab

    r = fabrik_cli(*basis, "status", "--json", env=spaeter)
    assert ein_json(r.stdout)["naechster_schritt"] == "laeuft"   # weiterlauf-1 lebt
    r = fabrik_cli(*basis, "status", "--lauf", "weiterlauf-1", "--json", env=spaeter)
    s = ein_json(r.stdout)
    assert s["naechster_schritt"] == "produktion" and len(s["videos"]) == 3
    assert remote_zustand(remote)["lauf"]["id"] == "weiterlauf-1"


def test_cli_pause_exit_4(klon, git_umgebung):
    repo = klon("a")
    (repo / "factory").mkdir()
    (repo / "factory" / "PAUSE").write_text("")
    r = fabrik_cli("--repo", str(repo), "beginne", "--lauf", "x", env={"FABRIK_OHNE_PUSH": "1"})
    assert r.returncode == EXIT_PAUSE


def test_cli_nimmt_config_aus_dem_repo(klon, git_umgebung):
    repo = klon("a")
    (repo / "factory").mkdir()
    (repo / "factory" / "config.json").write_text('{"videos_pro_nacht": 1}')
    datei = git_umgebung / "briefs.json"
    datei.write_text(json.dumps(briefs("v1", "v2")))
    r = fabrik_cli("--repo", str(repo), "plan", "--datei", str(datei), "--json",
                   env={"FABRIK_OHNE_PUSH": "1"})
    assert ein_json(r.stdout)["verworfen"] == ["v2"]


def test_falscher_remote_bricht_sofort_ab(klon, git_umgebung):
    repo = klon("a")
    r = fabrik_cli("--repo", str(repo), "--remote", "gibtsnicht", "status", "--json")
    assert r.returncode == 1 and "nicht erreichbar" in ein_json(r.stdout)["fehler"]
    assert "neuer Versuch" not in r.stderr                  # kein 30-s-Warten


def test_relativer_remote_pfad(klon, remote, git_umgebung):
    repo = klon("a")
    r = fabrik_cli("--repo", str(repo), "--remote", "remote.git", "beginne", "--lauf", "x",
                   cwd=git_umgebung)
    assert r.returncode == 0, r.stderr
    assert remote_hat_branch(remote)


# --- Befunde der Gegenprüfung -----------------------------------------------------------------

def sperre_pushes(remote, an: bool) -> None:
    """Spielt einen Proxy, der Pushes ablehnt (z. B. kurzer Netzfehler)."""
    haken = remote / "hooks" / "pre-receive"
    if an:
        haken.write_text("#!/bin/sh\necho 'simulierter Proxy-Fehler' >&2\nexit 1\n")
        haken.chmod(0o755)
    elif haken.exists():
        haken.unlink()


def test_wiederholung_nach_gescheitertem_push_pusht_nach(klon, remote, fabrik_fuer):
    """Push scheitert, der Agent wiederholt den Befehl: Erst wenn der Remote stimmt, ist es ok."""
    uhr = Uhr()
    a = fabrik_fuer(klon("a"), uhr)
    a.beginne("nacht-1")
    a.plan(briefs("v1", "v2"))

    sperre_pushes(remote, True)
    with pytest.raises(FabrikFehler) as e:
        a.video("v1", "skript")
    assert code(e) == EXIT_FEHLER
    assert remote_zustand(remote)["videos"][0]["status"] == "geplant"
    sperre_pushes(remote, False)
    assert a.video("v1", "skript")["status"] == "skript"          # lokal schon erledigt ...
    assert remote_zustand(remote)["videos"][0]["status"] == "skript"   # ... und jetzt gepusht

    # plan: dieselben Briefs noch einmal sind eine Wiederholung, kein Fehler "doppelte ID".
    sperre_pushes(remote, True)
    with pytest.raises(FabrikFehler):
        a.plan(briefs("v3"))
    sperre_pushes(remote, False)
    assert a.plan(briefs("v3")) == {"angelegt": [], "verworfen": [], "schon_geplant": ["v3"]}
    assert [v["id"] for v in remote_zustand(remote)["videos"]] == ["v1", "v2", "v3"]

    # ende: "schon beendet" darf erst gemeldet werden, wenn der Remote es auch weiß.
    sperre_pushes(remote, True)
    with pytest.raises(FabrikFehler):
        a.ende("nacht-1")
    sperre_pushes(remote, False)
    assert a.ende("nacht-1") == {"lauf": "nacht-1", "schon_beendet": True}
    assert remote_zustand(remote)["lauf"] is None

    # Ein anderer Container sieht alles und kann sofort beginnen.
    b = fabrik_fuer(klon("b"), uhr)
    assert b.beginne("weiterlauf-1")["uebernommen_von"] is None
    assert [v["status"] for v in remote_zustand(remote)["videos"]] == ["skript", "geplant", "geplant"]


def test_plan_wiederholung_aendert_nichts(klon, remote, fabrik_fuer):
    f = fabrik_fuer(klon("a"), Uhr(), videos_pro_nacht=3)
    f.plan(briefs("v1", "v2", "v3", "v4"))
    vorher = git("rev-parse", BRANCH, cwd=remote)
    assert f.plan(briefs("v1", "v2", "v3", "v4")) == {
        "angelegt": [], "verworfen": ["v4"], "schon_geplant": ["v1", "v2", "v3"]}
    assert git("rev-parse", BRANCH, cwd=remote) == vorher       # kein neuer Commit
    assert len(remote_zustand(remote)["verworfen"]) == 1
    with pytest.raises(FabrikFehler) as e:                       # gleiche ID, anderer Inhalt
        f.plan(briefs("v1", titel="anders"))
    assert code(e) == EXIT_EINGABE


def test_ohne_push_beruehrt_den_echten_zustand_nicht(klon, remote, fabrik_fuer):
    """Ein lokaler Versuch darf weder 'laeuft' vortäuschen noch mit auf den Remote wandern."""
    uhr = Uhr()
    repo = klon("c")
    echt, versuch = fabrik_fuer(repo, uhr), fabrik_fuer(repo, uhr, ohne_push=True)
    echt.plan(briefs("v1"))
    versuch.beginne("lokaler-versuch")
    versuch.video("v1", "skript")                    # der Versuch startet beim echten Stand
    assert versuch.status()["lauf"]["id"] == "lokaler-versuch"

    s = echt.status()
    assert s["lauf"] is None and s["videos"] == [{"id": "v1", "status": "geplant", "versuche": 0}]
    assert echt.beginne("nacht-echt")["neu"] is True               # kein Exit 3
    z = remote_zustand(remote)
    assert z["lauf"]["id"] == "nacht-echt" and z["videos"][0]["status"] == "geplant"
    assert "lokaler-versuch" not in git("log", "--format=%s", BRANCH, cwd=remote)
    # Der Spielstand bleibt für weitere Versuche erhalten.
    assert versuch.status()["videos"][0]["status"] == "skript"
    assert git("rev-parse", REF_LOKAL, cwd=repo) != git("rev-parse", REF_OHNE_PUSH, cwd=repo)


def test_video_und_plan_mit_lauf_pruefen_den_besitzer(klon, remote, fabrik_fuer):
    uhr = Uhr()
    a, b = fabrik_fuer(klon("a"), uhr), fabrik_fuer(klon("b"), uhr)
    a.beginne("nacht-1")
    a.plan(briefs("v1"), lauf_id="nacht-1")
    uhr.vor(5)
    a.video("v1", "skript", lauf_id="nacht-1")
    assert remote_zustand(remote)["lauf"]["herzschlag"] == "2026-10-27T22:12:00Z"   # miterneuert
    uhr.vor(16)                                  # nacht-1 wartet zu lange auf einen Subagenten
    b.beginne("weiter-1")
    with pytest.raises(FabrikFehler) as e:
        a.video("v1", "spec", lauf_id="nacht-1")
    assert code(e) == EXIT_BESETZT
    with pytest.raises(FabrikFehler) as e:
        a.plan(briefs("v2"), lauf_id="nacht-1")
    assert code(e) == EXIT_BESETZT
    assert remote_zustand(remote)["videos"][0]["status"] == "skript"
    assert b.video("v1", "spec", lauf_id="weiter-1")["status"] == "spec"


def test_eskalation_nach_den_reparaturen(klon, remote, fabrik_fuer):
    """§6: 2 Reparaturen, dann genau eine Eskalation zu Opus, danach nur noch 'mensch'."""
    f = fabrik_fuer(klon("a"), Uhr(), max_reparaturen=2, max_eskalationen=1)
    f.plan(briefs("v1"))
    for s in ("skript", "fehler", "skript", "fehler", "skript", "fehler"):
        f.video("v1", s)
    with pytest.raises(FabrikFehler) as e:
        f.video("v1", "skript")
    assert code(e) == EXIT_DECKEL and "--eskalation" in str(e.value)
    auskunft = f.video("v1", "skript", eskalation=True)
    assert auskunft["versuche"] == 3 and auskunft["eskalationen"] == 1
    assert f.video("v1", "fehler")["versuche"] == 4
    with pytest.raises(FabrikFehler) as e:
        f.video("v1", "skript", eskalation=True)
    assert code(e) == EXIT_DECKEL and "verbraucht" in str(e.value)
    f.video("v1", "mensch")
    verlauf = remote_zustand(remote)["videos"][0]["verlauf"]
    assert [x for x in verlauf if x.get("eskalation")] == [
        {"zeit": "2026-10-27T22:07:00Z", "von": "fehler", "nach": "skript", "eskalation": True}]


def test_eskalation_nur_wenn_noetig(klon, fabrik_fuer):
    f = fabrik_fuer(klon("a"), Uhr(), max_reparaturen=2)
    f.plan(briefs("v1"))
    f.video("v1", "fehler")
    assert f.video("v1", "skript", eskalation=True)["eskalationen"] == 0   # Reparatur 1, frei


def test_zurueck_aus_mensch_zaehlt_als_versuch(klon, fabrik_fuer):
    """Sonst ginge fehler -> mensch -> skript beliebig oft am Deckel vorbei."""
    f = fabrik_fuer(klon("a"), Uhr(), max_reparaturen=1, max_eskalationen=0)
    f.plan(briefs("v1"))
    f.video("v1", "mensch")
    assert f.video("v1", "skript")["versuche"] == 1
    f.video("v1", "mensch")
    with pytest.raises(FabrikFehler) as e:
        f.video("v1", "skript")
    assert code(e) == EXIT_DECKEL


def test_wurzel_commit_wird_signiert_wenn_verlangt(klon, remote, fabrik_fuer, git_umgebung):
    """commit-tree signiert nicht von selbst; mit commit.gpgsign muss auch die Wurzel signiert sein."""
    falsches_gpg = git_umgebung / "gpg.sh"
    falsches_gpg.write_text("#!/bin/sh\ncat >/dev/null\necho '[GNUPG:] SIG_CREATED D 1 8 00 0 0' >&2\n"
                            "printf -- '-----BEGIN PGP SIGNATURE-----\\n\\nZmFrZQ==\\n"
                            "-----END PGP SIGNATURE-----\\n'\n")
    falsches_gpg.chmod(0o755)
    with (git_umgebung / "gitconfig").open("a") as f:
        f.write(f"[user]\n\tsigningkey = TEST\n[commit]\n\tgpgsign = true\n[gpg]\n\tprogram = {falsches_gpg}\n")
    fabrik_fuer(klon("a"), Uhr()).beginne("nacht-1")
    commits = git("rev-list", BRANCH, cwd=remote).split()
    assert len(commits) == 2
    for c in commits:
        assert "gpgsig " in git("cat-file", "-p", c, cwd=remote), c


def test_cli_aufruffehler_mit_json(klon, git_umgebung):
    repo = klon("a")
    for argumente in (("video", "v1", "--status", "fertig"), ("beginne",), ()):
        r = fabrik_cli("--repo", str(repo), *argumente, "--json", env={"FABRIK_OHNE_PUSH": "1"})
        assert r.returncode == EXIT_EINGABE, argumente
        fehler = ein_json(r.stdout)
        assert fehler["ok"] is False and fehler["exit"] == EXIT_EINGABE
        assert "usage" in r.stderr
    r = fabrik_cli("--repo", str(repo), "beginne")              # ohne --json: nur Text
    assert r.returncode == EXIT_EINGABE and r.stdout == ""


def test_cli_altes_python_mit_json(klon):
    import shutil
    alt = shutil.which("python3.11")
    if alt is None:
        pytest.skip("python3.11 fehlt")
    from conftest import FABRIK_PY
    r = subprocess.run([alt, str(FABRIK_PY), "status", "--json"], capture_output=True, text=True)
    assert r.returncode == 1 and "3.12" in ein_json(r.stdout)["fehler"]


def test_cli_video_mit_lauf_und_eskalation(klon, git_umgebung):
    repo = klon("a")
    basis = ["--repo", str(repo)]
    umgebung = {"FABRIK_OHNE_PUSH": "1", "FABRIK_JETZT": "2026-10-27T22:07:00Z"}
    datei = git_umgebung / "briefs.json"
    datei.write_text(json.dumps(briefs("v1")), encoding="utf-8")
    assert fabrik_cli(*basis, "beginne", "--lauf", "n1", env=umgebung).returncode == 0
    r = fabrik_cli(*basis, "plan", "--datei", str(datei), "--lauf", "n1", "--json", env=umgebung)
    assert ein_json(r.stdout)["angelegt"] == ["v1"]
    r = fabrik_cli(*basis, "video", "v1", "--status", "skript", "--lauf", "fremd", "--json", env=umgebung)
    assert r.returncode == EXIT_BESETZT and ein_json(r.stdout)["exit"] == EXIT_BESETZT
    r = fabrik_cli(*basis, "video", "v1", "--status", "fehler", "--lauf", "n1", "--eskalation",
                   "--json", env=umgebung)
    assert r.returncode == 0 and ein_json(r.stdout)["eskalationen"] == 0
