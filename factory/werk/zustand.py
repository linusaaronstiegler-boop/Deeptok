"""Zustand der Videofabrik: Was ist in dieser Nacht schon erledigt?

Wo liegt der Zustand?
    Auf einem eigenen Git-Branch "factory-state", Datei zustand/<nacht>.json.
    Lokal arbeiten wir in einer zweiten Arbeitskopie (git worktree) unter <repo>/.fabrik-zustand.
    So berührt der Zustand nie den Code-Branch, und jeder neue Container bekommt ihn mit
    einem einzigen fetch zurück.

Warum Git und nicht eine Datenbank?
    Die Nachtläufe sind frische Cloud-Container ohne eigenen Speicher. Git ist das Einzige,
    was jeder Lauf ohnehin hat. Jede Änderung wird sofort committet und gepusht; stirbt der
    Container, ist höchstens der Schritt verloren, der gerade lief.

Was passiert, wenn zwei Läufe gleichzeitig schreiben?
    Dann lehnt der Remote den zweiten Push ab ("non-fast-forward"). Wir holen den neuen Stand,
    wenden dieselbe Aktion noch einmal darauf an und pushen erneut. Deshalb ist jede Aktion
    eine Funktion "alter Zustand -> neuer Zustand": Man kann sie beliebig oft neu anwenden.
    Beispiel: Zwei Läufe rufen gleichzeitig "beginne". Der zweite sieht beim Neu-Anwenden den
    frischen Herzschlag des ersten und bekommt Exit 3.

Was passiert, wenn ein Push scheitert (z. B. kurzer Netzfehler)?
    Der Befehl endet mit Exit 1, der lokale Commit bleibt liegen. Wiederholt der Agent den
    Befehl, hat die Aktion lokal nichts mehr zu tun ("schon erledigt"). Trotzdem pushen wir
    dann die liegengebliebenen Commits, bevor wir "ok" melden. Sonst stünde auf dem Remote
    noch der alte Stand, und der nächste Container sähe die Änderung nie.

Kein lokaler Branch, dafür zwei versteckte Referenzen:
    Die Arbeitskopie steht auf einem "detached HEAD". Ein lokaler Branch wäre nur Ballast in
    "git branch". Was gilt, steht in einer versteckten Referenz:
      refs/fabrik/zustand-lokal      letzter Stand der echten Fabrik (wird gepusht)
      refs/fabrik/zustand-ohne-push  Spielstand für Versuche mit FABRIK_OHNE_PUSH=1
    Getrennt, damit ein lokaler Versuch nie den echten Betrieb verfälscht: Sonst meldete
    "status" danach einen Versuchslauf als "laeuft", und der nächste echte Push nähme die
    Versuchs-Commits mit auf den Remote.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import time
from collections import Counter
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Callable
from zoneinfo import ZoneInfo

from werk import (EXIT_BESETZT, EXIT_DECKEL, EXIT_EINGABE, EXIT_FEHLER, EXIT_PAUSE,
                  FabrikFehler)
from werk.sperre import SperreZeitlimit, exklusiv

BRANCH = "factory-state"
WORKTREE_NAME = ".fabrik-zustand"
REF_REMOTE = "refs/fabrik/zustand-remote"   # Stand des Remotes beim letzten fetch
REF_LOKAL = "refs/fabrik/zustand-lokal"     # letzter lokaler Commit (Sicherung)
REF_OHNE_PUSH = "refs/fabrik/zustand-ohne-push"   # Spielstand für FABRIK_OHNE_PUSH=1
VERSION = 1
BRIEF_FELDER = ("id", "titel", "kanal", "niveau", "bogen", "serie", "teil")

# Reihenfolge der Arbeitsschritte eines Videos. Ein Schritt zurück gilt als Reparatur.
ARBEITS_STATUS = ("geplant", "skript", "spec", "gebaut", "geprueft")
ABSCHLUSS_STATUS = ("veroeffentlicht", "fehler", "mensch")
STATUS = ARBEITS_STATUS + ABSCHLUSS_STATUS
NIVEAUS = ("bruder", "linus", "beide")

_LAUF_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:@+-]{0,127}$")
_VIDEO_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$")
_NACHT = re.compile(r"^\d{4}-\d{2}-\d{2}$")

README_BRANCH = """# factory-state

Dieser Branch gehört der DeepTok-Videofabrik (factory/fabrik.py) und enthält keinen Code.
Pro Nacht gibt es eine Datei zustand/<nacht>.json: welcher Lauf gerade arbeitet (Herzschlag),
welche Videos geplant sind und wie weit jedes ist. Bitte nicht von Hand ändern, sondern über
`python factory/fabrik.py ...`.
"""


# --------------------------------------------------------------------------------------------
# Zeit
# --------------------------------------------------------------------------------------------

def jetzt_utc() -> datetime:
    """Aktuelle Zeit in UTC. FABRIK_JETZT (ISO 8601) setzt eine feste Zeit, nur für Tests."""
    fest = os.environ.get("FABRIK_JETZT")
    if fest:
        return lies_iso(fest)
    return datetime.now(timezone.utc)


def iso_utc(zeit: datetime) -> str:
    """Immer UTC mit 'Z', auf Sekunden gerundet. Ortszeit hätte im Herbst eine Stunde doppelt."""
    return zeit.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def lies_iso(text: str) -> datetime:
    zeit = datetime.fromisoformat(text.replace("Z", "+00:00"))
    if zeit.tzinfo is None:
        raise ValueError(f"Zeitangabe ohne Zeitzone: {text!r}")
    return zeit.astimezone(timezone.utc)


def nacht_datum(zeit: datetime, zeitzone: str = "Europe/Berlin", wechsel_stunde: int = 12) -> str:
    """Zu welcher Nacht gehört dieser Zeitpunkt?

    Eine Nacht beginnt am Abend und endet am nächsten Vormittag. Deshalb zählt alles vor
    12:00 Uhr Ortszeit noch zur Nacht des Vortags: 23:07 am 27.10. und 03:07 am 28.10.
    gehören beide zur Nacht "2026-10-27".
    Wir rechnen in Ortszeit über zoneinfo, nicht mit einem festen Versatz zu UTC. Nur so
    stimmt die Grenze auch nach der Zeitumstellung (Sommerzeit UTC+2, Winterzeit UTC+1).
    """
    if zeit.tzinfo is None:
        raise ValueError("nacht_datum braucht eine Zeit mit Zeitzone")
    ortszeit = zeit.astimezone(ZoneInfo(zeitzone))
    tag = ortszeit.date()
    if ortszeit.hour < wechsel_stunde:
        tag -= timedelta(days=1)
    return tag.isoformat()


def pruefe_nacht(text: str) -> str:
    if not _NACHT.match(text):
        raise FabrikFehler(f"Nacht muss JJJJ-MM-TT sein, nicht {text!r}", EXIT_EINGABE)
    try:
        date.fromisoformat(text)
    except ValueError as e:
        raise FabrikFehler(f"Ungültiges Datum {text!r}", EXIT_EINGABE) from e
    return text


def _alter_min(herzschlag: str, jetzt: datetime) -> float:
    return round((jetzt - lies_iso(herzschlag)).total_seconds() / 60.0, 2)


# --------------------------------------------------------------------------------------------
# Aktionen: reine Funktionen "Zustand -> neuer Zustand"
# Sie ändern das übergebene dict und geben eine kurze Auskunft zurück. Sie dürfen nichts
# anderes tun (kein Git, keine Dateien), denn bei einem Push-Konflikt laufen sie erneut.
# --------------------------------------------------------------------------------------------

def leerer_zustand(nacht: str) -> dict:
    return {"version": VERSION, "nacht": nacht, "lauf": None, "videos": [],
            "verworfen": [], "laeufe": [], "bericht": None, "aktualisiert": None}


class KeineAenderung(Exception):
    """Die Aktion hat nichts geändert; es wird nichts committet. Trägt die Auskunft mit."""

    def __init__(self, auskunft: dict):
        super().__init__("keine Änderung")
        self.auskunft = auskunft


def aktion_beginne(z: dict, lauf_id: str, jetzt: datetime, frist_min: float) -> dict:
    if not _LAUF_ID.match(lauf_id):
        raise FabrikFehler(f"Ungültige Lauf-ID {lauf_id!r} (erlaubt: Buchstaben, Ziffern, ._:@+-)",
                           EXIT_EINGABE)
    lauf = z.get("lauf")
    zeit = iso_utc(jetzt)
    if lauf and lauf["id"] == lauf_id:
        # Derselbe Lauf ruft noch einmal "beginne" (z. B. nach einem Kontextverlust): nur Herzschlag.
        lauf["herzschlag"] = zeit
        return {"lauf": lauf_id, "neu": False, "uebernommen_von": None}
    uebernommen_von = None
    if lauf:
        alter = _alter_min(lauf["herzschlag"], jetzt)
        if alter < frist_min:
            raise FabrikFehler(f"Lauf {lauf['id']} arbeitet noch (Herzschlag vor {alter:.1f} min, "
                               f"Frist {frist_min} min)", EXIT_BESETZT)
        # Herzschlag abgelaufen: Der alte Lauf ist vermutlich abgestürzt. Wir übernehmen.
        uebernommen_von = lauf["id"]
        for eintrag in reversed(z["laeufe"]):
            if eintrag["id"] == lauf["id"] and eintrag.get("ende") is None:
                eintrag["abgeloest"] = zeit
                eintrag["abgeloest_von"] = lauf_id
                break
    z["lauf"] = {"id": lauf_id, "beginn": zeit, "herzschlag": zeit}
    z["laeufe"].append({"id": lauf_id, "beginn": zeit, "ende": None,
                        "uebernommen_von": uebernommen_von, "bericht": None})
    return {"lauf": lauf_id, "neu": True, "uebernommen_von": uebernommen_von}


def pruefe_besitzer(z: dict, lauf_id: str | None, jetzt: datetime) -> None:
    """Gehört die Nacht noch diesem Lauf? Wenn ja, zählt das gleich als Herzschlag.

    Hat ein Weiterlauf übernommen (weil unser Herzschlag zu alt war), muss der alte Lauf
    sofort aufhören. Sonst bauen zwei Leads dieselben Videos. lauf_id=None heißt: nicht prüfen
    (für Aufrufe ohne --lauf, z. B. von Hand).
    """
    if lauf_id is None:
        return
    lauf = z.get("lauf")
    if not lauf or lauf["id"] != lauf_id:
        besitzer = lauf["id"] if lauf else "niemand"
        raise FabrikFehler(f"Lauf {lauf_id} besitzt die Nacht nicht mehr (Besitzer: {besitzer}). "
                           f"Nicht weiterarbeiten.", EXIT_BESETZT)
    lauf["herzschlag"] = iso_utc(jetzt)


def aktion_herzschlag(z: dict, lauf_id: str, jetzt: datetime) -> dict:
    pruefe_besitzer(z, lauf_id, jetzt)
    return {"lauf": lauf_id, "herzschlag": z["lauf"]["herzschlag"]}


def pruefe_briefs(briefs: object) -> list[dict]:
    """Prüft die Briefs aus plan --datei. Wirft FabrikFehler(EXIT_EINGABE) bei Formfehlern."""
    if not isinstance(briefs, list) or not briefs:
        raise FabrikFehler("Die Brief-Datei muss eine nicht-leere JSON-Liste sein", EXIT_EINGABE)
    fehler = []
    sauber = []
    for nr, brief in enumerate(briefs):
        if not isinstance(brief, dict):
            fehler.append(f"Brief {nr}: kein Objekt")
            continue
        vid = brief.get("id")
        if not isinstance(vid, str) or not _VIDEO_ID.match(vid):
            fehler.append(f"Brief {nr}: id fehlt oder ist ungültig ({vid!r})")
        for feld in ("titel", "kanal", "bogen"):
            if not isinstance(brief.get(feld), str) or not brief[feld].strip():
                fehler.append(f"Brief {nr} ({vid}): Feld '{feld}' fehlt")
        if brief.get("niveau") not in NIVEAUS:
            fehler.append(f"Brief {nr} ({vid}): niveau muss {'|'.join(NIVEAUS)} sein")
        # Serie und Teil dürfen fehlen (z. B. eine News-Karte), sonst Text bzw. Zahl >= 1.
        if brief.get("serie") is not None and not isinstance(brief["serie"], str):
            fehler.append(f"Brief {nr} ({vid}): serie muss Text sein")
        teil = brief.get("teil")
        if teil is not None and (isinstance(teil, bool) or not isinstance(teil, int) or teil < 1):
            fehler.append(f"Brief {nr} ({vid}): teil muss eine ganze Zahl >= 1 sein")
        sauber.append({k: brief.get(k) for k in BRIEF_FELDER})
    if fehler:
        raise FabrikFehler("Briefs ungültig:\n  " + "\n  ".join(fehler), EXIT_EINGABE)
    return sauber


def aktion_plan(z: dict, briefs: list[dict], videos_pro_nacht: int, jetzt: datetime,
                lauf_id: str | None = None) -> dict:
    pruefe_besitzer(z, lauf_id, jetzt)
    vorhanden = {v["id"]: v for v in z["videos"]}
    # Ein Brief, der schon GENAU SO geplant ist, ist eine Wiederholung (z. B. derselbe Befehl
    # nach einem gescheiterten Push) und wird übersprungen. Dieselbe ID mit anderem Inhalt
    # ist dagegen ein Fehler: Dann meinen zwei Briefs verschiedene Videos.
    schon = [b for b in briefs if b["id"] in vorhanden
             and all(vorhanden[b["id"]].get(k) == b.get(k) for k in BRIEF_FELDER)]
    schon_ids = {b["id"] for b in schon}
    zaehler = Counter(b["id"] for b in briefs)
    doppelt = sorted({i for i, n in zaehler.items() if n > 1}
                     | ((set(zaehler) & set(vorhanden)) - schon_ids))
    if doppelt:
        raise FabrikFehler("Doppelte Video-IDs: " + ", ".join(doppelt), EXIT_EINGABE)
    neu = [b for b in briefs if b["id"] not in schon_ids]
    # Deckel: Es zählen auch die Videos, die schon geplant sind.
    frei = max(0, videos_pro_nacht - len(z["videos"]))
    zeit = iso_utc(jetzt)
    angelegt, verworfen = neu[:frei], neu[frei:]
    auskunft = {"angelegt": [b["id"] for b in angelegt], "verworfen": [b["id"] for b in verworfen],
                "schon_geplant": [b["id"] for b in schon]}
    # Schon einmal verworfene IDs nicht doppelt eintragen; ist sonst nichts neu, gibt es
    # nichts zu committen (wichtig für die Wiederholung nach einem gescheiterten Push).
    schon_verworfen = {e["id"] for e in z["verworfen"]}
    verworfen = [b for b in verworfen if b["id"] not in schon_verworfen]
    if not angelegt and not verworfen:
        raise KeineAenderung(auskunft)
    for brief in angelegt:
        z["videos"].append({**brief, "status": "geplant", "versuche": 0, "eskalationen": 0,
                            "notiz": None,
                            "verlauf": [{"zeit": zeit, "von": None, "nach": "geplant"}]})
    for brief in verworfen:
        z["verworfen"].append({"id": brief["id"], "titel": brief["titel"], "zeit": zeit,
                               "grund": f"videos_pro_nacht={videos_pro_nacht}"})
    return auskunft


def aktion_video(z: dict, video_id: str, status: str, notiz: str | None, jetzt: datetime,
                 max_reparaturen: int, lauf_id: str | None = None, eskalation: bool = False,
                 max_eskalationen: int = 1) -> dict:
    if status not in STATUS:
        raise FabrikFehler(f"Unbekannter Status {status!r}; erlaubt: {', '.join(STATUS)}",
                           EXIT_EINGABE)
    pruefe_besitzer(z, lauf_id, jetzt)
    video = next((v for v in z["videos"] if v["id"] == video_id), None)
    if video is None:
        raise FabrikFehler(f"Video {video_id!r} ist in dieser Nacht nicht geplant", EXIT_EINGABE)
    alt = video["status"]
    eskalationen = video.get("eskalationen", 0)     # ältere Zustandsdateien kennen das Feld nicht
    if status == alt and not notiz:
        raise KeineAenderung({"id": video_id, "status": alt, "versuche": video["versuche"],
                              "eskalationen": eskalationen})

    # "versuche" zählt, wie oft ein Video gescheitert ist bzw. repariert wurde:
    #   - jeder Wechsel nach "fehler" zählt 1;
    #   - ein Schritt zurück ohne Umweg über "fehler" (z. B. gebaut -> spec) zählt auch 1;
    #   - der Weg von "fehler" zurück in die Arbeit zählt nicht noch einmal;
    #   - der Weg von "mensch" zurück in die Arbeit zählt 1. Sonst ließe sich der Deckel
    #     umgehen: fehler -> mensch -> skript wäre eine Reparatur zum Nulltarif.
    versuche = video["versuche"]
    reparatur = False
    if status == "fehler" and alt != "fehler":
        versuche += 1
    elif alt == "fehler" and status in ARBEITS_STATUS:
        reparatur = True
    elif alt == "mensch" and status in ARBEITS_STATUS:
        versuche += 1
        reparatur = True
    elif (alt in ARBEITS_STATUS and status in ARBEITS_STATUS
          and ARBEITS_STATUS.index(status) < ARBEITS_STATUS.index(alt)):
        versuche += 1
        reparatur = True

    # Deckel laut docs/VIDEO-PIPELINE.md §6: erst max_reparaturen Reparaturen, dann genau
    # max_eskalationen Eskalation(en) zu Opus, danach "mensch". Die Eskalation muss der Lead
    # ausdrücklich ansagen (--eskalation); so steht im Verlauf, dass Opus übernommen hat.
    eskaliert = False
    if reparatur and versuche > max_reparaturen:
        if not eskalation:
            frei = "Eine Eskalation zu Opus ist noch frei (--eskalation), sonst" \
                if eskalationen < max_eskalationen else "Auch die Eskalation ist verbraucht:"
            raise FabrikFehler(f"Deckel erreicht: {video_id} hätte {versuche} Versuche, "
                               f"max_reparaturen ist {max_reparaturen}. {frei} "
                               f"Status 'mensch' setzen.", EXIT_DECKEL)
        if eskalationen >= max_eskalationen:
            raise FabrikFehler(f"Deckel erreicht: Für {video_id} ist auch die Eskalation "
                               f"verbraucht ({eskalationen} von {max_eskalationen}). "
                               f"Status 'mensch' setzen.", EXIT_DECKEL)
        eskalationen += 1
        eskaliert = True

    video["status"] = status
    video["versuche"] = versuche
    video["eskalationen"] = eskalationen
    if notiz:
        video["notiz"] = notiz
    eintrag = {"zeit": iso_utc(jetzt), "von": alt, "nach": status}
    if eskaliert:
        eintrag["eskalation"] = True
    if notiz:
        eintrag["notiz"] = notiz
    video["verlauf"].append(eintrag)
    return {"id": video_id, "von": alt, "status": status, "versuche": versuche,
            "eskalationen": eskalationen}


def aktion_ende(z: dict, lauf_id: str, jetzt: datetime, notiz: str | None) -> dict:
    lauf = z.get("lauf")
    if not lauf or lauf["id"] != lauf_id:
        # Schon beendet? Dann ist ein zweites "ende" harmlos (z. B. nach einem Netzfehler).
        if any(e["id"] == lauf_id and e.get("ende") for e in z["laeufe"]):
            raise KeineAenderung({"lauf": lauf_id, "schon_beendet": True})
        besitzer = lauf["id"] if lauf else "niemand"
        raise FabrikFehler(f"Lauf {lauf_id} besitzt die Nacht nicht (Besitzer: {besitzer})",
                           EXIT_BESETZT)
    zeit = iso_utc(jetzt)
    zaehlung = Counter(v["status"] for v in z["videos"])
    bericht = {
        "lauf": lauf_id,
        "beginn": lauf["beginn"],
        "ende": zeit,
        "dauer_min": round((jetzt - lies_iso(lauf["beginn"])).total_seconds() / 60.0, 1),
        "videos": {s: zaehlung[s] for s in STATUS if zaehlung[s]},
        "verworfen": len(z["verworfen"]),
        "notiz": notiz,
    }
    for eintrag in reversed(z["laeufe"]):
        if eintrag["id"] == lauf_id and eintrag.get("ende") is None:
            eintrag["ende"] = zeit
            eintrag["bericht"] = bericht
            break
    z["lauf"] = None
    z["bericht"] = bericht
    return bericht


def status_bericht(z: dict, pause: bool, jetzt: datetime, frist_min: float,
                   eigener_lauf: str | None = None) -> dict:
    """Die Antwort auf "Was ist dran?". Genau das Format aus dem Schnittstellen-Vertrag."""
    lauf = z.get("lauf")
    lauf_info = None
    laeuft = False
    if lauf:
        alter = _alter_min(lauf["herzschlag"], jetzt)
        lauf_info = {"id": lauf["id"], "herzschlag": lauf["herzschlag"], "alter_min": alter}
        # Mit --lauf ID fragt der Besitzer selbst; sein eigener Herzschlag hält ihn nicht auf.
        laeuft = alter < frist_min and lauf["id"] != eigener_lauf
    videos = [{"id": v["id"], "status": v["status"], "versuche": v["versuche"]} for v in z["videos"]]
    if pause:
        schritt = "pause"
    elif laeuft:
        schritt = "laeuft"
    elif not videos:
        schritt = "slate"
    elif any(v["status"] not in ABSCHLUSS_STATUS for v in videos):
        schritt = "produktion"
    else:
        schritt = "fertig"
    return {"nacht": z["nacht"], "pause": pause, "lauf": lauf_info, "videos": videos,
            "naechster_schritt": schritt}


# --------------------------------------------------------------------------------------------
# Git-Speicher
# --------------------------------------------------------------------------------------------

class GitFehler(FabrikFehler):
    pass


class Zustandsspeicher:
    """Liest und schreibt zustand/<nacht>.json auf dem Branch factory-state."""

    def __init__(self, repo: Path | str, remote: str = "origin", ohne_push: bool | None = None,
                 wartezeiten: tuple[float, ...] = (2, 4, 8, 16), max_neuanwendungen: int = 8,
                 sperr_zeitlimit: float = 300.0):
        self.repo = Path(repo).resolve()
        # Ein lokaler Pfad als Remote (z. B. ein Bare-Repo für Tests) wird absolut gemacht:
        # fetch läuft im Repo, push in der Arbeitskopie; relativ hieße das zwei verschiedene Orte.
        if ("/" in remote or remote.endswith(".git")) and Path(remote).exists():
            remote = str(Path(remote).resolve())
        self.remote = remote
        if ohne_push is None:
            ohne_push = os.environ.get("FABRIK_OHNE_PUSH", "") not in ("", "0")
        self.ohne_push = ohne_push
        # Echter Betrieb und Versuche ohne Push führen getrennt Buch (siehe Modul-Docstring).
        self.ref_lokal = REF_OHNE_PUSH if ohne_push else REF_LOKAL
        self.wartezeiten = wartezeiten
        self.max_neuanwendungen = max_neuanwendungen
        self.sperr_zeitlimit = sperr_zeitlimit
        self.wt = self.repo / WORKTREE_NAME
        # Nur für Tests: wird vor jedem Push aufgerufen, um einen Wettlauf nachzustellen.
        self.testhaken_vor_push: Callable[[], None] | None = None
        if not (self.repo / ".git").exists():
            raise FabrikFehler(f"{self.repo} ist kein Git-Repo", EXIT_EINGABE)

    # ---- Git-Aufrufe ------------------------------------------------------------------------

    def _git(self, *args: str, cwd: Path | None = None, pruefen: bool = True,
             eingabe: str | None = None, zeitlimit: float = 120.0) -> subprocess.CompletedProcess:
        umgebung = dict(os.environ)
        # Englische Meldungen, damit wir "non-fast-forward" sicher erkennen; nie nach Passwort fragen.
        umgebung.update({"LC_ALL": "C", "LANG": "C", "GIT_TERMINAL_PROMPT": "0"})
        try:
            ergebnis = subprocess.run(["git", *args], cwd=cwd or self.repo, env=umgebung,
                                      input=eingabe, capture_output=True, text=True,
                                      timeout=zeitlimit)
        except subprocess.TimeoutExpired as e:
            raise GitFehler(f"git {' '.join(args)}: Zeitlimit {zeitlimit:.0f} s") from e
        if pruefen and ergebnis.returncode != 0:
            raise GitFehler(f"git {' '.join(args)} scheiterte: {ergebnis.stderr.strip()}")
        return ergebnis

    def _ref(self, name: str) -> str | None:
        r = self._git("rev-parse", "-q", "--verify", f"{name}^{{commit}}", pruefen=False)
        return r.stdout.strip() if r.returncode == 0 else None

    def _ist_vorfahr(self, a: str, b: str) -> bool:
        r = self._git("merge-base", "--is-ancestor", a, b, pruefen=False)
        if r.returncode not in (0, 1):
            raise GitFehler(f"merge-base scheiterte: {r.stderr.strip()}")
        return r.returncode == 0

    def _git_common_dir(self) -> Path:
        pfad = Path(self._git("rev-parse", "--git-common-dir").stdout.strip())
        return pfad if pfad.is_absolute() else (self.repo / pfad).resolve()

    def _mit_wiederholung(self, beschreibung: str, aufruf: Callable[[], subprocess.CompletedProcess],
                          ist_endgueltig: Callable[[subprocess.CompletedProcess], bool]):
        """Netzwerk-Aufruf mit 4 Wiederholungen nach 2, 4, 8, 16 s (Werte aus self.wartezeiten)."""
        letzter = ""
        for warte in (0, *self.wartezeiten):
            if warte:
                print(f"[fabrik] {beschreibung} fehlgeschlagen, neuer Versuch in {warte} s",
                      file=sys.stderr)
                time.sleep(warte)
            try:
                ergebnis = aufruf()
            except GitFehler as e:      # Zeitlimit
                letzter = str(e)
                continue
            if ergebnis.returncode == 0 or ist_endgueltig(ergebnis):
                return ergebnis
            letzter = ergebnis.stderr.strip()
        raise GitFehler(f"{beschreibung} nach {len(self.wartezeiten) + 1} Versuchen gescheitert: "
                        f"{letzter}")

    # ---- Remote -----------------------------------------------------------------------------

    def _hole(self) -> str | None:
        """fetch des Remote-Branches. Gibt dessen Commit zurück oder None, wenn es ihn nicht gibt."""
        fehlt = "couldn't find remote ref"
        # Ein falscher Remote-Name wird durch Warten nicht besser: sofort abbrechen.
        falscher_remote = ("does not appear to be a git repository", "No such remote")
        ergebnis = self._mit_wiederholung(
            "fetch",
            lambda: self._git("fetch", "--quiet", "--no-tags", self.remote,
                              f"+refs/heads/{BRANCH}:{REF_REMOTE}", pruefen=False),
            lambda r: fehlt in r.stderr or any(s in r.stderr for s in falscher_remote))
        if ergebnis.returncode == 0:
            return self._ref(REF_REMOTE)
        if fehlt not in ergebnis.stderr:
            raise GitFehler(f"Remote {self.remote!r} nicht erreichbar: {ergebnis.stderr.strip()}")
        self._git("update-ref", "-d", REF_REMOTE, pruefen=False)     # Branch fehlt auf dem Remote
        return None

    def _push(self) -> bool:
        """True = gepusht. False = abgelehnt, weil der Remote inzwischen weiter ist."""
        # --porcelain schreibt pro Ref eine maschinenlesbare Zeile auf stdout, z. B.
        # "!  HEAD:refs/heads/factory-state  [rejected] (fetch first)". Das ist stabiler als
        # die Hinweistexte, die man per Konfiguration abschalten kann.
        # "[remote rejected]" (z. B. fehlende Rechte) ist KEIN Wettlauf und wird wiederholt.
        abgelehnt = lambda r: any(s in r.stdout + r.stderr for s in  # noqa: E731
                                  ("[rejected]", "non-fast-forward", "fetch first"))
        ergebnis = self._mit_wiederholung(
            "push",
            lambda: self._git("push", "--porcelain", self.remote,
                              f"HEAD:refs/heads/{BRANCH}", cwd=self.wt, pruefen=False),
            abgelehnt)
        if ergebnis.returncode != 0:
            return False
        kopf = self._ref_im_wt("HEAD")
        self._git("update-ref", REF_REMOTE, kopf)
        return True

    # ---- Arbeitskopie -----------------------------------------------------------------------

    def _ref_im_wt(self, name: str) -> str:
        return self._git("rev-parse", name, cwd=self.wt).stdout.strip()

    def _worktree_ok(self) -> bool:
        self._git("worktree", "prune", pruefen=False)
        if not (self.wt / ".git").is_file():
            return False
        liste = self._git("worktree", "list", "--porcelain").stdout
        pfade = {Path(z[len("worktree "):]).resolve() for z in liste.splitlines()
                 if z.startswith("worktree ")}
        return self.wt.resolve() in pfade

    def _wurzel_commit(self, nacht: str) -> str:
        """Erster Commit eines neuen, verwaisten (orphan) Branches: ohne Vorgänger, nur ein README.

        Gebaut mit Git-"Klempner"-Befehlen (hash-object, mktree, commit-tree), damit dafür
        weder ein lokaler Branch noch ein Checkout nötig ist.
        """
        blob = self._git("hash-object", "-w", "--stdin", eingabe=README_BRANCH).stdout.strip()
        baum = self._git("mktree", eingabe=f"100644 blob {blob}\tREADME.md\n").stdout.strip()
        # commit-tree beachtet commit.gpgsign nicht von selbst (anders als "git commit").
        # Verlangt GitHub signierte Commits, scheiterte sonst gerade der allererste Push.
        signiert = self._git("config", "--bool", "commit.gpgsign",
                             pruefen=False).stdout.strip() == "true"
        return self._git(*self._identitaet(), "commit-tree", *(["-S"] if signiert else []), baum,
                         "-m", f"zustand {nacht}: Branch angelegt").stdout.strip()

    def _identitaet(self) -> list[str]:
        """Fehlt eine Git-Identität (frischer Container), committet die Fabrik unter eigenem Namen."""
        if self._git("config", "user.email", pruefen=False).returncode == 0:
            return []
        return ["-c", "user.name=DeepTok-Fabrik", "-c", "user.email=fabrik@deeptok.invalid"]

    def _schliesse_aus(self) -> None:
        """Trägt .fabrik-zustand in .git/info/exclude ein: lokal, ohne .gitignore anzufassen.

        Sonst sähe "git status" im Haupt-Repo die Arbeitskopie als neuen Ordner, und ein
        "git add -A" würde sie als eingebettetes Repo mitnehmen.
        """
        exclude = self._git_common_dir() / "info" / "exclude"
        zeile = f"/{WORKTREE_NAME}/"
        inhalt = exclude.read_text(encoding="utf-8") if exclude.exists() else ""
        if zeile not in inhalt.splitlines():
            exclude.parent.mkdir(parents=True, exist_ok=True)
            with exclude.open("a", encoding="utf-8") as f:
                if inhalt and not inhalt.endswith("\n"):
                    f.write("\n")
                f.write(f"# Arbeitskopie des Fabrik-Zustands (factory/werk/zustand.py)\n{zeile}\n")

    def _richte_worktree_ein(self, commit: str) -> None:
        if self.wt.exists():
            shutil.rmtree(self.wt)     # kaputte oder fremde Reste; der Zustand liegt in Git
        self._schliesse_aus()
        self._git("worktree", "add", "--force", "--detach", "--quiet", str(self.wt), commit)

    def _setze_auf(self, commit: str) -> None:
        self._git("reset", "--hard", "--quiet", commit, cwd=self.wt)
        self._git("clean", "-fdq", cwd=self.wt)

    def abgleichen(self, nacht: str) -> None:
        """Bringt die Arbeitskopie auf den neuesten Stand (fetch + vorspulen).

        Fälle, wenn der Remote den Branch hat:
          lokal == remote             -> nichts zu tun
          lokal ist älter             -> vorspulen
          lokal ist weiter            -> behalten, der nächste Push nimmt es mit
          beide haben Neues (Konflikt) -> der Remote gewinnt; die Aktion wird neu angewandt
        """
        remote = None if self.ohne_push else self._hole()
        start = self._startpunkt(remote, nacht)
        if not self._worktree_ok():
            self._richte_worktree_ein(start)
        elif self._ref_im_wt("HEAD") != start:
            # Die Arbeitskopie ist nur eine Arbeitsfläche. Was gilt, steht in der Referenz
            # des Modus; z. B. nach einem Versuch mit FABRIK_OHNE_PUSH zurück zum echten Stand.
            self._setze_auf(start)
        if remote:
            kopf = self._ref_im_wt("HEAD")
            if kopf != remote:
                if self._ist_vorfahr(kopf, remote):
                    self._setze_auf(remote)
                elif not self._ist_vorfahr(remote, kopf):
                    print(f"[fabrik] Lokaler Zustand {kopf[:10]} weicht vom Remote ab; "
                          f"übernehme {remote[:10]}", file=sys.stderr)
                    self._setze_auf(remote)
        self._git("update-ref", self.ref_lokal, self._ref_im_wt("HEAD"))

    def _startpunkt(self, remote: str | None, nacht: str) -> str:
        """Von welchem Commit geht dieser Aufruf aus?"""
        if self.ohne_push:
            # Ein Versuch macht beim eigenen Spielstand weiter. Gibt es keinen, beginnt er
            # beim letzten echten Stand, den dieser Klon kennt (eine Kopie, kein Eingriff).
            return (self._ref(REF_OHNE_PUSH) or self._ref(REF_LOKAL) or self._ref(REF_REMOTE)
                    or self._wurzel_commit(nacht))
        return self._ref(REF_LOKAL) or remote or self._wurzel_commit(nacht)

    def _ungepusht(self) -> bool:
        """Liegt die Arbeitskopie vor dem Remote, z. B. nach einem gescheiterten Push?"""
        return self._ref_im_wt("HEAD") != self._ref(REF_REMOTE)

    # ---- Lesen und Schreiben ----------------------------------------------------------------

    def _datei(self, nacht: str) -> Path:
        return self.wt / "zustand" / f"{nacht}.json"

    def _lies_datei(self, nacht: str) -> dict:
        pfad = self._datei(nacht)
        if not pfad.exists():
            return leerer_zustand(nacht)
        try:
            return json.loads(pfad.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            raise FabrikFehler(f"Zustandsdatei {pfad.name} ist kaputt: {e}", EXIT_FEHLER) from e

    def _sperre(self):
        # Eine Sperre pro Repo: Parallele Subagenten im selben Container dürfen nicht
        # gleichzeitig in derselben Arbeitskopie committen.
        return exklusiv(self._git_common_dir() / "fabrik-zustand.sperre", self.sperr_zeitlimit)

    def lies(self, nacht: str) -> dict:
        try:
            with self._sperre():
                self.abgleichen(nacht)
                return self._lies_datei(nacht)
        except SperreZeitlimit as e:
            raise FabrikFehler(str(e), EXIT_FEHLER) from e

    def aendere(self, nacht: str, aktion: str, funktion: Callable[[dict], dict],
                jetzt: Callable[[], datetime] = jetzt_utc) -> dict:
        """Wendet `funktion` auf den Zustand an, committet und pusht.

        Lehnt der Remote den Push ab, wird alles ab dem fetch wiederholt, also auch die
        Funktion selbst auf dem neuen Stand.
        """
        try:
            with self._sperre():
                for _ in range(self.max_neuanwendungen):
                    self.abgleichen(nacht)
                    zustand = self._lies_datei(nacht)
                    try:
                        auskunft = funktion(zustand)
                    except KeineAenderung as k:
                        # Lokal ist schon alles erledigt. Hängt aber noch ein Commit aus einem
                        # gescheiterten Push fest, muss er jetzt hinaus, bevor wir "ok" melden.
                        if self.ohne_push or not self._ungepusht():
                            return k.auskunft
                        auskunft = k.auskunft
                    else:
                        zustand["aktualisiert"] = iso_utc(jetzt())
                        self._schreibe(nacht, zustand, aktion)
                        if self.ohne_push:
                            return auskunft
                    if self.testhaken_vor_push:
                        self.testhaken_vor_push()
                    if self._push():
                        return auskunft
                    print("[fabrik] Push abgelehnt (Remote ist weiter), wende Aktion neu an",
                          file=sys.stderr)
        except SperreZeitlimit as e:
            raise FabrikFehler(str(e), EXIT_FEHLER) from e
        raise FabrikFehler(f"Zustand nach {self.max_neuanwendungen} Versuchen nicht gepusht",
                           EXIT_FEHLER)

    def _schreibe(self, nacht: str, zustand: dict, aktion: str) -> None:
        pfad = self._datei(nacht)
        pfad.parent.mkdir(parents=True, exist_ok=True)
        pfad.write_text(json.dumps(zustand, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        self._git("add", "--", str(pfad.relative_to(self.wt)), cwd=self.wt)
        if self._git("diff", "--cached", "--quiet", cwd=self.wt, pruefen=False).returncode == 0:
            return      # nichts geändert (z. B. zweimal derselbe Herzschlag in einer Sekunde)
        self._git(*self._identitaet(), "commit", "--quiet", "--no-verify", "-m",
                  f"zustand {nacht}: {aktion}", cwd=self.wt)
        self._git("update-ref", self.ref_lokal, self._ref_im_wt("HEAD"))


# --------------------------------------------------------------------------------------------
# Fassade für fabrik.py
# --------------------------------------------------------------------------------------------

class Fabrik:
    """Verbindet Konfiguration, Uhr, PAUSE-Schalter und Speicher zu den Befehlen der CLI."""

    def __init__(self, repo: Path | str, konfig: dict, remote: str = "origin",
                 nacht: str | None = None, uhr: Callable[[], datetime] = jetzt_utc,
                 speicher: Zustandsspeicher | None = None):
        self.repo = Path(repo).resolve()
        self.konfig = konfig
        self.uhr = uhr
        self.speicher = speicher or Zustandsspeicher(self.repo, remote)
        self.nacht = pruefe_nacht(nacht) if nacht else nacht_datum(
            uhr(), konfig["zeitzone"], konfig["nachtwechsel_stunde"])

    @property
    def pause(self) -> bool:
        return (self.repo / "factory" / "PAUSE").exists()

    def status(self, eigener_lauf: str | None = None) -> dict:
        zustand = self.speicher.lies(self.nacht)
        return status_bericht(zustand, self.pause, self.uhr(), self.konfig["herzschlag_frist_min"],
                              eigener_lauf)

    def beginne(self, lauf_id: str) -> dict:
        if self.pause:
            raise FabrikFehler("factory/PAUSE existiert: Die Fabrik pausiert.", EXIT_PAUSE)
        frist = self.konfig["herzschlag_frist_min"]
        return self.speicher.aendere(
            self.nacht, f"beginne {lauf_id}",
            lambda z: aktion_beginne(z, lauf_id, self.uhr(), frist), self.uhr)

    def herzschlag(self, lauf_id: str) -> dict:
        return self.speicher.aendere(
            self.nacht, f"herzschlag {lauf_id}",
            lambda z: aktion_herzschlag(z, lauf_id, self.uhr()), self.uhr)

    def plan(self, briefs: object, lauf_id: str | None = None) -> dict:
        sauber = pruefe_briefs(briefs)
        anzahl = self.konfig["videos_pro_nacht"]
        return self.speicher.aendere(
            self.nacht, f"plan {len(sauber)} Brief(s)",
            lambda z: aktion_plan(z, sauber, anzahl, self.uhr(), lauf_id), self.uhr)

    def video(self, video_id: str, status: str, notiz: str | None = None,
              lauf_id: str | None = None, eskalation: bool = False) -> dict:
        maximum = self.konfig["max_reparaturen"]
        eskalationen = self.konfig.get("max_eskalationen", 1)
        aktion = f"video {video_id} -> {status}" + (" (Eskalation)" if eskalation else "")
        return self.speicher.aendere(
            self.nacht, aktion,
            lambda z: aktion_video(z, video_id, status, notiz, self.uhr(), maximum,
                                   lauf_id, eskalation, eskalationen), self.uhr)

    def ende(self, lauf_id: str, notiz: str | None = None) -> dict:
        return self.speicher.aendere(
            self.nacht, f"ende {lauf_id}",
            lambda z: aktion_ende(z, lauf_id, self.uhr(), notiz), self.uhr)
