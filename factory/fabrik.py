#!/usr/bin/env python3
"""fabrik.py: die Zustandsmaschine der DeepTok-Videofabrik.

Worum geht es?
    Nachts bauen Scheduled Tasks Lernvideos. Jeder Lauf ist eine frische Cloud-Sitzung ohne
    Gedächtnis. Dieses Programm ist das Gedächtnis: Es merkt sich, welcher Lauf gerade
    arbeitet, welche Videos geplant sind und wie weit jedes ist. Und es beantwortet die
    eine Frage, mit der jeder Lauf beginnt: "Was ist als Nächstes dran?"

Warum ist es absichtlich "dumm"?
    Es entscheidet nichts Inhaltliches. Welche Themen, welcher Bogen, ob ein Skript gut ist:
    das entscheiden Modelle. Die Fabrik zählt nur mit und hält die Deckel ein
    (videos_pro_nacht, max_reparaturen, chrome_jobs). Die Arbeitsteilung heißt:

        Opus schreibt, Code und Sonnet überwachen.

    Opus ist das teuerste Modell und sitzt am Redaktionstisch (Slate, Skripte, Eskalationen).
    Überwachen heißt dagegen warten, Status lesen, den nächsten Schritt anstoßen. Würde ein
    Modell das tun, kostete jede Runde Tokens aus Linus' Abo. Dieses Programm macht dieselbe
    Arbeit für null Tokens, und ein günstiger Sonnet-Lead ruft es nur auf.

    Weil es dumm ist, ist es auch verlässlich: Jeder Befehl macht genau eine kleine Änderung
    und pusht sie sofort auf den Branch "factory-state". Stirbt der Container mitten in der
    Nacht, liest der nächste Lauf den Zustand und macht dort weiter.

Ablauf einer Nacht (aus Sicht des Sonnet-Leads):
    status --json                 -> naechster_schritt: pause | laeuft | slate | produktion | fertig
    beginne --lauf ID             -> die Nacht gehört jetzt diesem Lauf
    plan --datei briefs.json --lauf ID      -> Videos "geplant" (höchstens videos_pro_nacht)
    video VID --status skript --lauf ID ... -> nach jedem Arbeitsschritt
    herzschlag --lauf ID          -> "ich lebe noch", spätestens alle herzschlag_frist_min
    ende --lauf ID                -> Nacht freigeben, Bericht schreiben

Herzschlag und Doppellauf:
    Ist der Herzschlag älter als herzschlag_frist_min (15 min), darf ein Weiterlauf die Nacht
    übernehmen. Ein Lead, der lange auf einen Subagenten oder einen Render wartet, kann in
    der Zeit nichts aufrufen. Deshalb den Herzschlag als Hintergrund-Schleife starten (Bash
    mit run_in_background), gleich nach "beginne":
        while :; do python factory/fabrik.py herzschlag --lauf ID; [ $? = 3 ] && break; sleep 300; done
    Die Schleife endet von selbst, wenn der Lauf die Nacht verliert (Exit 3) oder der
    Container stirbt. Genau das soll ein Herzschlag zeigen. Ein kurzer Netzfehler (Exit 1)
    beendet sie nicht; der nächste Schlag kommt 5 min später.
    plan und video mit --lauf ID prüfen zusätzlich, ob die Nacht noch diesem Lauf gehört
    (sonst Exit 3: sofort aufhören), und erneuern dabei den Herzschlag.

Status "fehler" und der Deckel für Reparaturen:
    "fehler", "mensch" und "veroeffentlicht" gelten als abgeschlossen. "fehler" also nur
    setzen, wenn das Video in dieser Nacht nicht mehr repariert wird. Für eine Reparatur
    den Status direkt zurücksetzen (z. B. gebaut -> spec); das zählt als Versuch.
    Nach max_reparaturen Versuchen gibt es Exit 5. Dann ist genau max_eskalationen Mal eine
    Eskalation zu Opus erlaubt: derselbe Befehl mit --eskalation. Danach nur noch "mensch".

Tore und Werkzeuge:
    lint DATEI...                 Tor G1, Teil Sprache und Datenschutz: Sperrwörter, persönliche
                                  Daten. Die übrigen G1-Prüfungen aus docs/VIDEO-PIPELINE.md §6
                                  (jede Zahl in facts[], keine Antwort vor pause_for_answer,
                                  keine Eingabedatei gestaged) fehlen noch; sie kommen mit der
                                  Spec-Prüfung (G0) in Phase 2.
    hoercheck --audio A --text T  Tor G4: Wortfehlerrate, Lautheit, Stillen, Tempo
    check PROJEKT                 Tor G5: npx hyperframes check
    render PROJEKT -o X.mp4       npx hyperframes render, höchstens chrome_jobs gleichzeitig
    render, check und hoercheck können Minuten dauern: beim Bash-Werkzeug immer
    timeout 600000 (10 min) setzen. Sonst beendet das Werkzeug fabrik.py nach 2 min.

Exit-Codes: 0 ok · 1 Tor nicht bestanden / Fehler · 2 falscher Aufruf · 3 Nacht gehört einem
anderen Lauf · 4 PAUSE · 5 Deckel erreicht.
Mit --json gibt jeder Befehl genau EIN JSON-Objekt auf stdout aus, auch bei einem falschen
Aufruf (dann {"ok": false, "fehler": ..., "exit": 2}).

Umgebung: FABRIK_OHNE_PUSH=1 committet den Zustand nur lokal (für Tests, ohne Netz). Solche
Versuche haben einen eigenen Spielstand und berühren den echten Zustand nicht.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

if sys.version_info < (3, 12):
    # Auch hier gilt: Mit --json kommt genau ein JSON-Objekt, damit ein Agent es lesen kann.
    if "--json" in sys.argv[1:]:
        print(json.dumps({"ok": False, "fehler": "fabrik.py braucht Python 3.12 oder neuer",
                          "exit": 1}, ensure_ascii=False))
    sys.exit("fabrik.py braucht Python 3.12 oder neuer")

FABRIK_DIR = Path(__file__).resolve().parent
# factory/ ist die Paketwurzel: So findet "import werk" das Paket neben dieser Datei,
# egal aus welchem Ordner fabrik.py aufgerufen wird.
sys.path.insert(0, str(FABRIK_DIR))

from werk import EXIT_EINGABE, EXIT_FEHLER, EXIT_OK, FabrikFehler  # noqa: E402
from werk.konfig import lade_konfig  # noqa: E402
from werk.zustand import STATUS, Fabrik  # noqa: E402

STANDARD_REPO = FABRIK_DIR.parent


# --------------------------------------------------------------------------------------------
# Befehle. Jeder gibt (exit_code, json_objekt, text) zurück; main() entscheidet, was gedruckt wird.
# --------------------------------------------------------------------------------------------

def _fabrik(args) -> Fabrik:
    return Fabrik(args.repo, lade_konfig(args.repo), remote=args.remote, nacht=args.nacht)


def befehl_status(args):
    bericht = _fabrik(args).status(eigener_lauf=args.lauf)
    zeilen = [f"Nacht {bericht['nacht']}: nächster Schritt '{bericht['naechster_schritt']}'"]
    if bericht["pause"]:
        zeilen.append("PAUSE ist gesetzt (factory/PAUSE)")
    if bericht["lauf"]:
        lauf = bericht["lauf"]
        zeilen.append(f"Lauf {lauf['id']}, Herzschlag vor {lauf['alter_min']:.1f} min")
    for v in bericht["videos"]:
        zeilen.append(f"  {v['id']:30s} {v['status']:16s} Versuche {v['versuche']}")
    return EXIT_OK, bericht, "\n".join(zeilen)


def befehl_beginne(args):
    fabrik = _fabrik(args)
    auskunft = fabrik.beginne(args.lauf)
    text = f"Lauf {args.lauf} hat die Nacht {fabrik.nacht} übernommen"
    if auskunft.get("uebernommen_von"):
        text += f" (abgelaufener Herzschlag von {auskunft['uebernommen_von']})"
    return EXIT_OK, {"ok": True, "nacht": fabrik.nacht, **auskunft}, text


def befehl_herzschlag(args):
    fabrik = _fabrik(args)
    auskunft = fabrik.herzschlag(args.lauf)
    return EXIT_OK, {"ok": True, "nacht": fabrik.nacht, **auskunft}, f"Herzschlag {auskunft['herzschlag']}"


def befehl_plan(args):
    try:
        briefs = json.loads(Path(args.datei).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        raise FabrikFehler(f"Brief-Datei {args.datei} nicht lesbar: {e}", EXIT_EINGABE) from e
    fabrik = _fabrik(args)
    auskunft = fabrik.plan(briefs, args.lauf)
    text = f"Geplant: {', '.join(auskunft['angelegt']) or '-'}"
    if auskunft["schon_geplant"]:
        text += f"\nSchon so geplant (übersprungen): {', '.join(auskunft['schon_geplant'])}"
    if auskunft["verworfen"]:
        # Gemeldet wird auch auf stderr, damit es im Log auffällt, selbst wenn stdout geparst wird.
        meldung = (f"Verworfen (Deckel videos_pro_nacht={fabrik.konfig['videos_pro_nacht']}): "
                   f"{', '.join(auskunft['verworfen'])}")
        print(f"[fabrik] {meldung}", file=sys.stderr)
        text += f"\n{meldung}"
    return EXIT_OK, {"ok": True, "nacht": fabrik.nacht, **auskunft}, text


def befehl_video(args):
    fabrik = _fabrik(args)
    auskunft = fabrik.video(args.id, args.status, args.notiz, args.lauf, args.eskalation)
    text = f"{args.id}: {auskunft.get('von', auskunft.get('status'))} -> {auskunft['status']} " \
           f"(Versuche {auskunft['versuche']}, Eskalationen {auskunft['eskalationen']})"
    return EXIT_OK, {"ok": True, "nacht": fabrik.nacht, **auskunft}, text


def befehl_ende(args):
    fabrik = _fabrik(args)
    bericht = fabrik.ende(args.lauf, args.notiz)
    if bericht.get("schon_beendet"):
        return EXIT_OK, {"ok": True, "nacht": fabrik.nacht, **bericht}, f"Lauf {args.lauf} war schon beendet"
    text = f"Lauf {args.lauf} beendet nach {bericht['dauer_min']} min; Videos: {bericht['videos']}"
    return EXIT_OK, {"ok": True, "nacht": fabrik.nacht, "bericht": bericht}, text


def befehl_lint(args):
    from werk import tore
    ergebnis = tore.lint(args.dateien)
    zeilen = [tore.treffer_als_text(t) for t in ergebnis["treffer"]]
    zeilen += [f"{p}: übersprungen (keine Textdatei)" for p in ergebnis["uebersprungen"]]
    zeilen.append(f"G1: {len(ergebnis['treffer'])} Treffer in {ergebnis['dateien']} Datei(en)")
    return (EXIT_OK if ergebnis["ok"] else EXIT_FEHLER), ergebnis, "\n".join(zeilen)


def befehl_hoercheck(args):
    from werk import hoercheck
    konfig = lade_konfig(args.repo)
    try:
        soll = Path(args.text).read_text(encoding="utf-8")
    except OSError as e:
        raise FabrikFehler(f"Textdatei nicht lesbar: {e}", EXIT_EINGABE) from e
    if not Path(args.audio).is_file():
        raise FabrikFehler(f"Audiodatei nicht gefunden: {args.audio}", EXIT_EINGABE)
    messung = hoercheck.pruefe(args.audio, soll, modell=args.modell or konfig["whisper_modell"],
                               threads=konfig["whisper_threads"], max_stille_s=konfig["max_stille_s"])
    verstoesse = hoercheck.bewerte(messung, konfig, args.erlaubte_stillen)
    ergebnis = {"ok": not verstoesse, "verstoesse": verstoesse, "messung": messung}
    zeilen = [f"WER {messung['wer']:.3f} · {messung['lufs']} LUFS · Peak {messung['true_peak_db']} dBTP · "
              f"{messung['woerter_pro_s']} Wörter/s · {len(messung['lange_stillen'])} lange Stille(n)"]
    zeilen += [f"  ✗ {v}" for v in verstoesse]
    zeilen += [f"  {a['art']}: {a['soll']} -> {a['ist']}" for a in messung["abweichungen"][:20]]
    zeilen.append("G4 bestanden" if not verstoesse else "G4 nicht bestanden")
    return (EXIT_OK if not verstoesse else EXIT_FEHLER), ergebnis, "\n".join(zeilen)


def befehl_check(args):
    from werk import hyperframes
    konfig = lade_konfig(args.repo)
    ergebnis = hyperframes.check(args.projekt, chrome_jobs=konfig["chrome_jobs"])
    zeilen = [f"  {b['abschnitt']}/{b['code']}: {b['meldung']} ({b['datei']})"
              for b in ergebnis.get("befunde", [])]
    if ergebnis.get("meldung"):
        zeilen.append(ergebnis["meldung"])
    zeilen.append(f"G5: {ergebnis.get('fehler')} Fehler, {ergebnis.get('warnungen', '?')} Warnungen "
                  f"in {ergebnis.get('dauer_s')} s")
    return (EXIT_OK if ergebnis["ok"] else EXIT_FEHLER), ergebnis, "\n".join(zeilen)


def befehl_render(args):
    from werk import hyperframes
    konfig = lade_konfig(args.repo)
    ergebnis = hyperframes.render(args.projekt, args.ausgabe, chrome_jobs=konfig["chrome_jobs"],
                                  qualitaet=args.qualitaet, zeitlimit=args.zeitlimit)
    if ergebnis["ok"]:
        text = (f"{ergebnis['ausgabe']}: {ergebnis['groesse_mb']} MB in {ergebnis['dauer_s']} s "
                f"(auf Slot gewartet {ergebnis['gewartet_s']} s)")
    else:
        text = f"Render fehlgeschlagen: {ergebnis.get('meldung')}"
    return (EXIT_OK if ergebnis["ok"] else EXIT_FEHLER), ergebnis, text


# --------------------------------------------------------------------------------------------
# Kommandozeile
# --------------------------------------------------------------------------------------------

class Parser(argparse.ArgumentParser):
    """ArgumentParser, der einen falschen Aufruf mit --json als JSON-Objekt meldet.

    argparse selbst schreibt bei einem Fehler nur Text auf stderr und beendet sich mit 2.
    Ein Agent, der stdout als JSON liest, bekäme dann einen leeren String. Die Unterbefehle
    erben diese Klasse automatisch (add_subparsers nimmt die Klasse des Elternteils).
    """
    json_gewuenscht = False      # setzt main() vor dem Parsen

    def error(self, message: str):
        if Parser.json_gewuenscht:
            print(json.dumps({"ok": False, "fehler": f"falscher Aufruf: {message}",
                              "exit": EXIT_EINGABE}, ensure_ascii=False))
        self.print_usage(sys.stderr)
        self.exit(EXIT_EINGABE, f"{self.prog}: Fehler: {message}\n")


def baue_parser() -> argparse.ArgumentParser:
    # Die globalen Optionen hängen an jedem Unterbefehl, damit beides geht:
    #   fabrik.py --repo X status   und   fabrik.py status --repo X
    # SUPPRESS heißt: Ein Unterbefehl überschreibt einen vorher gesetzten Wert nicht mit None.
    gemeinsam = argparse.ArgumentParser(add_help=False)
    gemeinsam.add_argument("--repo", default=argparse.SUPPRESS,
                           help="Repo-Wurzel (Standard: Ordner über factory/)")
    gemeinsam.add_argument("--remote", default=argparse.SUPPRESS,
                           help="Git-Remote für den Zustand (Name oder Pfad, Standard: origin)")
    gemeinsam.add_argument("--nacht", default=argparse.SUPPRESS,
                           help="Nacht JJJJ-MM-TT statt der aus der Uhrzeit berechneten")
    gemeinsam.add_argument("--json", action="store_true", default=argparse.SUPPRESS,
                           help="genau ein JSON-Objekt auf stdout")

    parser = Parser(prog="fabrik.py", parents=[gemeinsam],
                    description="Zustandsmaschine der DeepTok-Videofabrik")
    unter = parser.add_subparsers(dest="befehl", required=True)

    p = unter.add_parser("status", parents=[gemeinsam], help="Was ist als Nächstes dran?")
    p.add_argument("--lauf", help="eigene Lauf-ID: der eigene Herzschlag zählt nicht als 'laeuft'")
    p.set_defaults(funktion=befehl_status)

    for name, hilfe, funktion in (("beginne", "Nacht übernehmen", befehl_beginne),
                                  ("herzschlag", "Herzschlag erneuern", befehl_herzschlag)):
        p = unter.add_parser(name, parents=[gemeinsam], help=hilfe)
        p.add_argument("--lauf", required=True)
        p.set_defaults(funktion=funktion)

    p = unter.add_parser("ende", parents=[gemeinsam], help="Lauf freigeben, Bericht schreiben")
    p.add_argument("--lauf", required=True)
    p.add_argument("--notiz", help="kurzer Bericht des Leads")
    p.set_defaults(funktion=befehl_ende)

    besitz = "eigene Lauf-ID: Exit 3, wenn die Nacht nicht mehr diesem Lauf gehört; " \
             "erneuert sonst den Herzschlag"
    p = unter.add_parser("plan", parents=[gemeinsam], help="Videos aus Briefs anlegen")
    p.add_argument("--datei", required=True, help="JSON-Liste von Briefs")
    p.add_argument("--lauf", help=besitz)
    p.set_defaults(funktion=befehl_plan)

    p = unter.add_parser("video", parents=[gemeinsam], help="Status eines Videos setzen")
    p.add_argument("id")
    p.add_argument("--status", required=True, choices=STATUS)
    p.add_argument("--notiz")
    p.add_argument("--lauf", help=besitz)
    p.add_argument("--eskalation", action="store_true",
                   help="Versuch über max_reparaturen hinaus, weil Opus übernimmt "
                        "(höchstens max_eskalationen pro Video)")
    p.set_defaults(funktion=befehl_video)

    p = unter.add_parser("lint", parents=[gemeinsam],
                         help="Tor G1, Teil Sprache und Datenschutz (Sperrwörter, persönliche Daten)")
    p.add_argument("dateien", nargs="+")
    p.set_defaults(funktion=befehl_lint)

    p = unter.add_parser("hoercheck", parents=[gemeinsam], help="Tor G4")
    p.add_argument("--audio", required=True)
    p.add_argument("--text", required=True, help="Sprechtext; 'Anzeige|Gesprochen' wird aufgelöst")
    p.add_argument("--erlaubte-stillen", type=int, default=0,
                   help="Zahl deklarierter Denkpausen (Vorhersage-Stopp, Halten am Ende)")
    p.add_argument("--modell", help="Whisper-Modell statt whisper_modell aus config.json")
    p.set_defaults(funktion=befehl_hoercheck)

    p = unter.add_parser("check", parents=[gemeinsam], help="Tor G5 (npx hyperframes check)")
    p.add_argument("projekt")
    p.set_defaults(funktion=befehl_check)

    p = unter.add_parser("render", parents=[gemeinsam], help="MP4 rendern (höchstens chrome_jobs gleichzeitig)")
    p.add_argument("projekt")
    p.add_argument("-o", "--output", dest="ausgabe", required=True)
    p.add_argument("--qualitaet", default="looks", help="draft | looks | delivery (Standard looks)")
    p.add_argument("--zeitlimit", type=float, default=570.0,
                   help="Sekunden für Warten + Rendern zusammen (Standard 570, unter dem 10-min-Limit)")
    p.set_defaults(funktion=befehl_render)
    return parser


def main(argv: list[str] | None = None) -> int:
    Parser.json_gewuenscht = "--json" in (sys.argv[1:] if argv is None else argv)
    args = baue_parser().parse_args(argv)
    args.repo = getattr(args, "repo", str(STANDARD_REPO))
    args.remote = getattr(args, "remote", "origin")
    args.nacht = getattr(args, "nacht", None)
    als_json = getattr(args, "json", False)
    try:
        code, objekt, text = args.funktion(args)
    except FabrikFehler as e:
        code, objekt, text = e.code, {"ok": False, "fehler": str(e), "exit": e.code}, None
        print(f"fabrik: {e}", file=sys.stderr)
    except Exception as e:   # unerwartet: trotzdem genau ein JSON-Objekt, dann Exit 1
        code, objekt, text = EXIT_FEHLER, {"ok": False, "fehler": f"{type(e).__name__}: {e}",
                                           "exit": EXIT_FEHLER}, None
        print(f"fabrik: unerwarteter Fehler: {type(e).__name__}: {e}", file=sys.stderr)
    if als_json:
        print(json.dumps(objekt, ensure_ascii=False))
    elif text:
        print(text)
    return code


if __name__ == "__main__":
    sys.exit(main())
