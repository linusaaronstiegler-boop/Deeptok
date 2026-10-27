#!/usr/bin/env python3
"""Stimm-Casting: dieselben Testtexte mit allen Anbietern vertonen, messen und blind vergleichen.

Aufrufe (vom Repo aus):
    python factory/casting.py                    alle Anbieter, die erreichbar sind
    python factory/casting.py --nur azure        nur ein Anbieter, dann alle Kandidaten-Stimmen
    python factory/casting.py --trocken          ohne Netz: Fixture-Audio statt API (Seite testen)
    python factory/casting.py --probe            nur Zugang prüfen: Stimmenliste + Restguthaben,
                                                 kostet nichts (mit --probesatz: ein kurzer Satz)
    python factory/casting.py --fortsetzen casting/2026-10-27
                                                 abgebrochenen Lauf weiterführen (fehlende Proben
                                                 vertonen, Seite bauen, Messung nachholen)
    python factory/casting.py --auswerten casting/2026-10-27 "DTC1;..." "DTC1;..."

Ausgabe, zwei Ordner nebeneinander (beide gitignored):
    casting/<datum>/                 DARF geteilt werden: nur die Seite und die Hörproben
        index.html                   blinde Vergleichsseite: paarweise Zwangswahl, Handy zuerst
        s01.mp3 ...                  Hörproben, einheitlich kodiert, zufällig nummeriert
    casting/<datum>-aufloesung/      NICHT teilen, erst nach der Wahl öffnen
        aufloesung.json              welche Probe von welchem Anbieter stammt
        messung.json                 Wortfehlerrate, Lautheit, Sprechtempo, Namens-Treffer je Probe
        roh/r07.* ...                die Originale der Anbieter, eigene Zufallsnummern

Warum blind und paarweise (§4, §6)? Wer weiß, welcher Anbieter spricht, hört, was er erwartet.
Und "A oder B?" ist leichter und zuverlässiger zu beantworten als "Note von 1 bis 5".
Warum werden alle Proben gleich laut gemacht? Lautere Proben wirken besser, auch wenn sie es
nicht sind. Die Lautheit jedes Anbieters steht trotzdem in messung.json (gemessen am Original).
Warum zwei Ordner? Endung, Abtastrate und Bitrate der Originale verraten den Anbieter (nur
Cartesia liefert WAV, nur Azure 48 kHz). Wer den Seiten-Ordner teilt, teilt so nichts davon.
"""
from __future__ import annotations

import argparse
import base64
import itertools
import json
import random
import re
import secrets
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

FABRIK_DIR = Path(__file__).resolve().parent
REPO_WURZEL = FABRIK_DIR.parent
if str(FABRIK_DIR) not in sys.path:          # wie fabrik.py: factory/ ist die Paketwurzel
    sys.path.insert(0, str(FABRIK_DIR))

from werk import stimme as stimm_paket                    # noqa: E402
from werk.stimme import basis                             # noqa: E402

TEXTE_DATEI = FABRIK_DIR / "casting_texte.json"
FIXTURES = FABRIK_DIR / "tests" / "fixtures" / "stimme"
KONFIG = FABRIK_DIR / "config.json"
FORMAT_VERSION = "DTC1"           # Kennung der Ergebnis-Zeichenkette
GEHEIM_ENDUNG = "-aufloesung"     # Nachbarordner mit allem, was den Anbieter verrät
PROBESATZ = "Kurzer Test der Stimme."     # --probesatz: 23 Zeichen je Anbieter


# --------------------------------------------------------------------------------------------
# Teilnehmer: wer tritt an?
# --------------------------------------------------------------------------------------------

def heute_berlin() -> str:
    return datetime.now(ZoneInfo("Europe/Berlin")).strftime("%Y-%m-%d")


def lade_texte(pfad: Path = TEXTE_DATEI) -> list[dict]:
    return json.loads(pfad.read_text(encoding="utf-8"))["texte"]


def stimme_fuer(stimme: dict, kandidat: dict) -> dict:
    """Die gepinnte Stimme mit der Stimm-ID eines Kandidaten (plus seinen Sonderwerten)."""
    return {**stimme, "stimm_id": kandidat["id"], **(kandidat.get("ueberschreibt") or {})}


def _kandidaten_aus_liste(liste: list[dict]) -> list[dict]:
    """Aus einer API-Liste abwechselnd eine männliche und eine weibliche Stimme ziehen."""
    maennlich = [v for v in liste if v.get("geschlecht", "").lower() in ("male", "masculine", "männlich")]
    weiblich = [v for v in liste if v.get("geschlecht", "").lower() in ("female", "feminine", "weiblich")]
    rest = [v for v in liste if v not in maennlich and v not in weiblich]
    gemischt = [v for paar in itertools.zip_longest(maennlich, weiblich) for v in paar if v]
    return (gemischt + rest)[:3]


def _vorgemerkte(stimme: dict) -> list[dict]:
    """Kandidaten aus voices/<anbieter>.json, die gepinnte Stimme zuerst."""
    kandidaten = list(stimme.get("kandidaten") or [])
    gepinnt = stimme.get("stimm_id")
    if gepinnt and gepinnt != basis.PLATZHALTER:
        vorhanden = next((k for k in kandidaten if k["id"] == gepinnt), None)
        if vorhanden:
            kandidaten.remove(vorhanden)
        kandidaten.insert(0, vorhanden or {"id": gepinnt, "name": "gepinnt"})
    return kandidaten


def waehle_teilnehmer(anbieter: str, stimme: dict, trocken: bool, alle: bool,
                      meldungen: list[str]) -> list[dict]:
    """Liste der Stimmen eines Anbieters, die antreten. Leer = Anbieter fällt aus.

    Ohne --trocken fragt jeder Anbieter zuerst seine Stimmenliste ab. Das kostet nichts und
    zeigt, ob ein Schlüssel da ist (Umgebungsvariable oder Network secret im Proxy).
    """
    kandidaten = _vorgemerkte(stimme)
    if trocken:
        if not kandidaten:
            kandidaten = [{"id": f"trocken-{anbieter}", "name": "Trockenlauf"}]
    else:
        try:
            liste = stimm_paket.stimmen(stimme, "de")
        except basis.KeinZugang:
            meldungen.append(f"{anbieter}: übersprungen, kein Schlüssel (weder Umgebungsvariable "
                             "noch Network secret)")
            return []
        except Exception as e:                       # Netz, kaputte Antwort ...: nur dieser fällt aus
            meldungen.append(f"{anbieter}: übersprungen, {basis.schwaerze(str(e))}")
            return []
        if not kandidaten:
            kandidaten = _kandidaten_aus_liste(liste)
            if not kandidaten:
                meldungen.append(f"{anbieter}: übersprungen, keine deutsche Stimme gefunden")
                return []
            meldungen.append(f"{anbieter}: keine Stimme gepinnt, nehme aus der Liste: "
                             + ", ".join(f"{k['name']} ({k['id']})" for k in kandidaten))
    return kandidaten if alle else kandidaten[:1]


# --------------------------------------------------------------------------------------------
# Ordner und Plan
# --------------------------------------------------------------------------------------------

def geheim_ordner(seite: Path) -> Path:
    return seite.with_name(seite.name + GEHEIM_ENDUNG)


def finde_ordner(pfad: Path | str) -> tuple[Path, Path]:
    """Nimmt den Seiten- ODER den Auflösungsordner und gibt beide zurück."""
    p = Path(pfad)
    if p.name.endswith(GEHEIM_ENDUNG):
        return p.with_name(p.name[:-len(GEHEIM_ENDUNG)]), p
    return p, geheim_ordner(p)


def _belegt(ordner: Path) -> bool:
    return ordner.exists() and any(ordner.iterdir())


def neuer_ordner(basis_ordner: Path, datum: str) -> tuple[Path, Path]:
    """casting/<datum>/ und casting/<datum>-aufloesung/; gibt es die schon, dann <datum>-2 ...
    (nichts wird überschrieben)."""
    seite = basis_ordner / datum
    n = 2
    while _belegt(seite) or _belegt(geheim_ordner(seite)):
        seite = basis_ordner / f"{datum}-{n}"
        n += 1
    seite.mkdir(parents=True, exist_ok=True)
    (geheim_ordner(seite) / "roh").mkdir(parents=True, exist_ok=True)
    return seite, geheim_ordner(seite)


def neue_casting_id(seite: Path, rng: random.Random) -> str:
    return f"{seite.name}-{rng.getrandbits(24):06x}"


def plane(teilnehmer: dict, texte: dict, seite: Path, rng: random.Random,
          trocken: bool, seed: int | None) -> dict:
    """Legt VOR dem ersten bezahlten Aufruf fest, welche Probe welche Nummer bekommt.

    Die Nummern sind zufällig gemischt, damit "s01" nicht immer der erste Anbieter ist. Die
    Rohdateien bekommen eine zweite, unabhängige Mischung: r07 gehört nicht zu s07.
    Der Plan wird sofort als aufloesung.json gespeichert und nach jeder Probe ergänzt. So geht
    die Zuordnung bezahlter Proben nie verloren, auch nicht bei Strg-C oder einem Absturz.
    """
    auftraege = [(tid, text_id) for tid in teilnehmer for text_id in texte]
    s_nummern = list(range(1, len(auftraege) + 1))
    r_nummern = list(s_nummern)
    rng.shuffle(s_nummern)
    rng.shuffle(r_nummern)
    clips = {}
    for (tid, text_id), s, r in zip(auftraege, s_nummern, r_nummern):
        clips[f"s{s:02d}"] = {"teilnehmer": tid, "text": text_id,
                              "anbieter": teilnehmer[tid]["anbieter"],
                              "stimm_id": teilnehmer[tid]["stimm_id"],
                              "r": r, "roh": None, "zeichen": 0, "status": "geplant"}
    return {"casting_id": neue_casting_id(seite, rng), "seite": seite.name, "trocken": trocken,
            "seed": seed, "texte": texte, "teilnehmer": teilnehmer, "clips": clips, "paare": []}


def schreibe_aufloesung(geheim: Path, plan: dict) -> None:
    """Erst in eine Hilfsdatei, dann umbenennen: Ein Abbruch mitten im Schreiben hinterlässt
    so nie eine halbe JSON-Datei."""
    ziel = geheim / "aufloesung.json"
    tmp = ziel.with_suffix(".tmp")
    tmp.write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(ziel)


def lies_aufloesung(geheim: Path) -> dict:
    pfad = geheim / "aufloesung.json"
    if not pfad.is_file():
        raise FileNotFoundError(f"Keine Auflösung in {geheim}")
    return json.loads(pfad.read_text(encoding="utf-8"))


# --------------------------------------------------------------------------------------------
# Audio: erzeugen, anonym ablegen, einheitlich kodieren
# --------------------------------------------------------------------------------------------

def transkodiere(roh: Path, ziel: Path) -> None:
    """Alle Proben gleich machen, damit nichts den Anbieter verrät:
    Stille am Rand weg, Lautheit -16 LUFS, mp3 44,1 kHz mono 128 kbps, keine Metadaten."""
    rand = "silenceremove=start_periods=1:start_silence=0.05:start_threshold=-50dB"
    filter_ = f"{rand},areverse,{rand},areverse,loudnorm=I=-16:TP=-1.5:LRA=11"
    befehl = ["ffmpeg", "-nostdin", "-y", "-v", "error", "-i", str(roh), "-map", "0:a:0",
              "-map_metadata", "-1", "-af", filter_, "-ar", "44100", "-ac", "1",
              "-c:a", "libmp3lame", "-b:a", "128k", "-id3v2_version", "0",
              "-fflags", "+bitexact", "-flags:a", "+bitexact", str(ziel)]
    r = subprocess.run(befehl, capture_output=True, text=True, timeout=300)
    if r.returncode != 0:
        raise RuntimeError(f"ffmpeg scheiterte bei {roh.name}: {r.stderr.strip()[:300]}")


def fixture_dateien() -> list[Path]:
    dateien = sorted(p for p in FIXTURES.glob("*") if p.suffix in (".mp3", ".wav"))
    if not dateien:
        raise RuntimeError(f"Keine Fixture-Audios in {FIXTURES}")
    return dateien


def vertone(plan: dict, seite: Path, geheim: Path, meldungen: list[str]) -> int:
    """Vertont alle Proben, die noch nicht fertig sind. Gibt die Zahl neu fertiger zurück.

    Jede Probe für sich: Scheitert eine (Netz, Anbieter, ffmpeg), wird das gemeldet und die
    nächste kommt dran. Nach jeder Probe wird die Auflösung gespeichert.
    """
    fixtures = fixture_dateien() if plan["trocken"] else []
    reihenfolge = list(plan["teilnehmer"])
    neu = 0
    for cid, c in plan["clips"].items():
        if c["status"] == "fertig":
            continue
        t = plan["teilnehmer"][c["teilnehmer"]]
        try:
            # Liegt das Original schon da (z. B. ffmpeg scheiterte beim letzten Mal), wird es
            # nicht noch einmal bezahlt.
            if not (c["roh"] and (geheim / c["roh"]).is_file()):
                if plan["trocken"]:
                    quelle = fixtures[reihenfolge.index(c["teilnehmer"]) % len(fixtures)]
                    audio, art = quelle.read_bytes(), quelle.suffix.lstrip(".")
                    zeichen = basis.zaehle_zeichen(basis.reiner_text(plan["texte"][c["text"]]["text"]))
                else:
                    ergebnis = stimm_paket.synthese(plan["texte"][c["text"]]["text"], t["stimme"])
                    audio, art, zeichen = ergebnis.audio, ergebnis.format, ergebnis.zeichen
                c["roh"] = f"roh/r{c['r']:02d}.{art}"
                (geheim / c["roh"]).write_bytes(audio)
                c["zeichen"] += zeichen           # bezahlt ist bezahlt, auch wenn ffmpeg scheitert
                schreibe_aufloesung(geheim, plan)  # Original sofort verbuchen (Strg-C beim Umkodieren)
            transkodiere(geheim / c["roh"], seite / f"{cid}.mp3")
            c["status"] = "fertig"
            c.pop("fehler", None)
            neu += 1
        except Exception as e:                    # eine Probe fällt aus, nicht der ganze Lauf
            c["status"] = "fehler"
            c["fehler"] = basis.schwaerze(str(e))[:300] or type(e).__name__
            meldungen.append(f"{t['anbieter']} / {t['name']} / {c['text']}: {c['fehler']}")
        schreibe_aufloesung(geheim, plan)
    return neu


def bilde_paare(plan: dict, rng: random.Random, max_paare: int, meldungen: list[str]) -> list[dict]:
    """Je Text jede Stimme gegen jede andere; A/B-Seite und Reihenfolge zufällig."""
    fertig = {cid: c for cid, c in plan["clips"].items() if c["status"] == "fertig"}
    paare = []
    for text_id in plan["texte"]:
        je_tid = {c["teilnehmer"]: cid for cid, c in fertig.items() if c["text"] == text_id}
        for x, y in itertools.combinations(sorted(je_tid), 2):
            a, b = (je_tid[x], je_tid[y]) if rng.random() < 0.5 else (je_tid[y], je_tid[x])
            paare.append({"text": text_id, "a": a, "b": b})
    rng.shuffle(paare)
    if max_paare and len(paare) > max_paare:
        paare = paare[:max_paare]
        meldungen.append(f"Nur {max_paare} zufällige Paare (--max-paare)")
    for i, p in enumerate(paare, 1):
        p["id"] = f"p{i:02d}"
    if not paare:
        meldungen.append("Keine Paare: Für einen Vergleich braucht es mindestens zwei Stimmen.")
    return paare


# --------------------------------------------------------------------------------------------
# Messung (Tor G4 als Werkzeug, ohne Urteil)
# --------------------------------------------------------------------------------------------

def miss_alle(plan: dict, geheim: Path, meldungen: list[str]) -> dict | None:
    """WER, Lautheit, Tempo und Namens-Treffer je fertiger Probe, gemessen am Original.

    Fehlt werk.hoercheck oder faster-whisper, oder scheitert die Messung (Modell nicht
    ladbar ...), wird sie abgebrochen und gemeldet; Seite und Auflösung stehen da schon.
    messung.json wird nach jeder Probe geschrieben; --fortsetzen misst nur, was fehlt.
    So passt eine lange Messung auch in mehrere kurze Aufrufe.
    """
    try:
        from werk import hoercheck                         # träge: lädt erst hier
    except ImportError as e:
        meldungen.append(f"Messung übersprungen: werk.hoercheck fehlt ({e})")
        return None
    konfig = json.loads(KONFIG.read_text(encoding="utf-8")) if KONFIG.exists() else {}
    pfad = geheim / "messung.json"
    ergebnisse: dict = json.loads(pfad.read_text(encoding="utf-8")) if pfad.is_file() else {}
    for cid, clip in sorted(plan["clips"].items()):
        if clip["status"] != "fertig" or cid in ergebnisse:
            continue
        text = plan["texte"][clip["text"]]
        stimme = plan["teilnehmer"][clip["teilnehmer"]]["stimme"]
        # Soll-Text: ohne Markup; Lexikon-Ersetzungen als "Anzeige|Gesprochen", damit
        # der Hör-Check beide Schreibweisen gelten lässt.
        soll = basis.lexikon_als_tokens(basis.reiner_text(text["text"]), stimme.get("lexikon"))
        try:
            m = hoercheck.pruefe(geheim / clip["roh"], soll,
                                 modell=konfig.get("whisper_modell", "small"), sprache="de",
                                 threads=konfig.get("whisper_threads", 2),
                                 max_stille_s=konfig.get("max_stille_s", 1.2))
        except Exception as e:
            # Meist trifft es alle Proben gleich (Modell fehlt): beim ersten Fehler aufhören.
            meldungen.append(f"Messung abgebrochen bei {cid}: {basis.schwaerze(str(e))[:200]} "
                             f"(nachholen mit --fortsetzen {geheim.parent / plan['seite']})")
            break
        gehoert = f" {hoercheck.normalisiere(m['transkript'])} "
        namen = {n: f" {hoercheck.normalisiere(n)} " in gehoert for n in text.get("namen", [])}
        ergebnisse[cid] = {k: m.get(k) for k in ("wer", "lufs", "true_peak_db", "woerter_pro_s",
                                                  "dauer_s", "abtastrate_hz", "bitrate_kbps",
                                                  "transkript")}
        ergebnisse[cid]["namens_treffer"] = namen
        pfad.write_text(json.dumps(ergebnisse, ensure_ascii=False, indent=2), encoding="utf-8")
    return ergebnisse or None


def zusammenfassung(plan: dict, messung: dict | None) -> list[dict]:
    zeilen = []
    for tid, t in plan["teilnehmer"].items():
        eigene = [cid for cid, c in plan["clips"].items() if c["teilnehmer"] == tid]
        zeile = {"teilnehmer": tid, "anbieter": t["anbieter"], "stimm_id": t["stimm_id"],
                 "name": t["name"], "zeichen": sum(plan["clips"][c]["zeichen"] for c in eigene),
                 "fertig": sum(plan["clips"][c]["status"] == "fertig" for c in eigene)}
        if messung:
            werte = [messung[c] for c in eigene if c in messung]

            def mittel(feld: str):
                zahlen = [w[feld] for w in werte if w.get(feld) is not None]
                return round(sum(zahlen) / len(zahlen), 3) if zahlen else None
            treffer = [ok for w in werte for ok in w["namens_treffer"].values()]
            zeile |= {"wer": mittel("wer"), "lufs": mittel("lufs"),
                      "woerter_pro_s": mittel("woerter_pro_s"),
                      "namens_treffer": f"{sum(treffer)}/{len(treffer)}"}
        zeilen.append(zeile)
    return zeilen


# --------------------------------------------------------------------------------------------
# Hauptablauf
# --------------------------------------------------------------------------------------------

def _zufall(seed: int | None) -> random.Random:
    return random.Random(seed) if seed is not None else random.Random(secrets.randbits(64))


def erzeuge(args: argparse.Namespace) -> dict:
    rng = _zufall(args.seed)
    meldungen: list[str] = []
    texte = {t["id"]: t for t in lade_texte(Path(args.texte))}
    anbieter_liste = args.nur or list(stimm_paket.ANBIETER)
    alle_kandidaten = args.alle_kandidaten or len(anbieter_liste) == 1

    # 1. Wer tritt an?
    teilnehmer: dict[str, dict] = {}
    for anbieter in anbieter_liste:
        stimme = stimm_paket.lade_stimme(anbieter, args.voices)
        for k in waehle_teilnehmer(anbieter, stimme, args.trocken, alle_kandidaten, meldungen):
            tid = f"t{len(teilnehmer) + 1}"
            # Die ganze Stimme kommt in die Auflösung: --fortsetzen und die Messung brauchen
            # Modell, Lexikon usw. Ein Schlüssel steht nie in voices/*.json.
            teilnehmer[tid] = {"anbieter": anbieter, "stimm_id": k["id"], "name": k.get("name", ""),
                               "modell": stimme.get("modell"), "stimme": stimme_fuer(stimme, k)}
    if not teilnehmer:
        return {"ok": False, "meldungen": meldungen + ["Kein Anbieter erreichbar, nichts erzeugt."]}

    # 2. Plan festlegen und speichern, BEVOR etwas Geld kostet.
    seite, geheim = neuer_ordner(Path(args.ausgabe), args.datum or heute_berlin())
    plan = plane(teilnehmer, texte, seite, rng, args.trocken, args.seed)
    schreibe_aufloesung(geheim, plan)
    return fuehre_aus(plan, seite, geheim, args, rng, meldungen)


def fortsetze(args: argparse.Namespace) -> dict:
    seite, geheim = finde_ordner(args.fortsetzen)
    plan = lies_aufloesung(geheim)
    return fuehre_aus(plan, seite, geheim, args, _zufall(args.seed), [])


def fuehre_aus(plan: dict, seite: Path, geheim: Path, args: argparse.Namespace,
               rng: random.Random, meldungen: list[str]) -> dict:
    """Gemeinsam für neue und fortgesetzte Läufe: vertonen, Seite bauen, dann messen."""
    trocken = plan["trocken"]
    messen = (not trocken) if args.messen is None else args.messen

    # 3. Vertonen (nur, was noch fehlt).
    neu = vertone(plan, seite, geheim, meldungen)

    # 4. Paare und Seite. Neu gebaut wird nur, wenn sich etwas geändert hat; sonst würden
    #    Antworten, die schon auf einem Handy gespeichert sind, auf andere Paare zeigen.
    if neu or not plan["paare"] or not (seite / "index.html").is_file():
        if plan["paare"]:                  # es gab schon eine Seite: neue ID, alte Antworten verfallen
            plan["casting_id"] = neue_casting_id(seite, rng)
        plan["paare"] = bilde_paare(plan, rng, args.max_paare, meldungen)
        schreibe_aufloesung(geheim, plan)
        schreibe_seite(seite, plan, args.einbetten)
    elif args.einbetten:
        schreibe_seite(seite, plan, True)

    # 5. Messen erst NACH Seite und Auflösung: Scheitert sie, ist nichts verloren.
    fertig = sum(c["status"] == "fertig" for c in plan["clips"].values())
    messung = miss_alle(plan, geheim, meldungen) if messen and fertig else None

    restguthaben = {}
    if not trocken:               # §4: Restzeichen prüfen (nur wo die API einen Stand liefert)
        for anbieter in sorted({t["anbieter"] for t in plan["teilnehmer"].values()}):
            try:
                restguthaben[anbieter] = stimm_paket.restguthaben(plan_stimme(plan, anbieter))
            except Exception as e:
                restguthaben[anbieter] = f"unbekannt ({getattr(e, 'status', None) or type(e).__name__})"
    offen = [cid for cid, c in plan["clips"].items() if c["status"] != "fertig"]
    if offen:
        meldungen.append(f"{len(offen)} Proben fehlen ({', '.join(sorted(offen))}); "
                         f"nachholen mit: python factory/casting.py --fortsetzen {seite}")
    return {"ok": bool(fertig), "ordner": str(seite), "aufloesung": str(geheim),
            "casting_id": plan["casting_id"], "trocken": trocken, "clips": fertig,
            "fehlen": len(offen), "paare": len(plan["paare"]),
            "teilnehmer": zusammenfassung(plan, messung), "restguthaben": restguthaben,
            "gemessen": messung is not None, "meldungen": meldungen}


def plan_stimme(plan: dict, anbieter: str) -> dict:
    return next(t["stimme"] for t in plan["teilnehmer"].values() if t["anbieter"] == anbieter)


# --------------------------------------------------------------------------------------------
# Zugangsprobe: kostet nichts (ohne --probesatz)
# --------------------------------------------------------------------------------------------

def probe(anbieter_liste: list[str], voices: str | None, mit_satz: bool) -> dict:
    """Je Anbieter: Stimmenliste (Schlüssel, Header, Region) und Restguthaben.

    Mit --probesatz zusätzlich ein kurzer Satz mit der gepinnten bzw. ersten Stimme. Der kostet
    rund 23 Zeichen und prüft, was die Liste nicht prüft: Modell-ID, Stimm-ID, Format und die
    echte Abtastrate.
    """
    ergebnis: dict[str, dict] = {}
    for anbieter in anbieter_liste:
        zeile: dict = {"zugang": False}
        try:
            stimme = stimm_paket.lade_stimme(anbieter, voices)
            liste = stimm_paket.stimmen(stimme, "de")
            zeile |= {"zugang": True, "deutsche_stimmen": len(liste),
                      "restguthaben": stimm_paket.restguthaben(stimme)}
            if mit_satz:
                kandidat = (_vorgemerkte(stimme) or _kandidaten_aus_liste(liste) or [None])[0]
                if kandidat is None:
                    raise basis.StimmFehler("keine deutsche Stimme für den Probesatz")
                e = stimm_paket.synthese(PROBESATZ, stimme_fuer(stimme, kandidat))
                zeile["probesatz"] = {"stimm_id": kandidat["id"], "format": e.format,
                                      "abtastrate": e.abtastrate, "zeichen": e.zeichen,
                                      "bytes": len(e.audio), "wortzeiten": e.wortzeiten is not None}
        except basis.KeinZugang:
            zeile["fehler"] = "kein Schlüssel (weder Umgebungsvariable noch Network secret)"
        except Exception as e:
            zeile["fehler"] = basis.schwaerze(str(e))[:300] or type(e).__name__
        ergebnis[anbieter] = zeile
    return {"ok": all("fehler" not in z for z in ergebnis.values()), "probe": ergebnis}


# --------------------------------------------------------------------------------------------
# Auswertung der Ergebnis-Zeichenketten
# --------------------------------------------------------------------------------------------

def lies_ergebnis(zeichenkette: str) -> tuple[str, str, dict[str, str]]:
    """'DTC1;2026-10-27-a1b2c3;H1;p01A,p02B' -> (casting_id, hoerer, {"p01": "A", ...}).

    Leerraum fliegt überall raus: Messenger brechen lange Zeichenketten gern um, und das
    Format selbst enthält nie ein Leerzeichen.
    """
    zk = re.sub(r"\s+", "", zeichenkette)
    teile = zk.split(";")
    if len(teile) != 4 or teile[0] != FORMAT_VERSION:
        raise ValueError(f"Keine Ergebnis-Zeichenkette ({FORMAT_VERSION};id;hörer;paare): {zk[:60]}")
    wahl = {}
    for eintrag in filter(None, teile[3].split(",")):
        if not re.fullmatch(r"p\d+[AB-]", eintrag):
            raise ValueError(f"Unlesbarer Eintrag {eintrag!r}: erwartet z. B. p01A, p02B oder p03-")
        if eintrag[-1] != "-":                      # "-" = noch nicht gewählt
            wahl[eintrag[:-1]] = eintrag[-1]
    return teile[1], teile[2], wahl


def werte_aus(ordner: Path, zeichenketten: list[str]) -> dict:
    """Zählt Siege je Stimme: gesamt, je Text und je Hörer. Wer öfter gewinnt, liegt vorn.

    Je Hörer zählt nur die LETZTE Zeichenkette: Doppelt eingefügt oder nach einer Pause neu
    kopiert, würde sonst jede Wahl zweimal zählen.
    """
    _seite, geheim = finde_ordner(ordner)
    aufl = lies_aufloesung(geheim)
    paare = {p["id"]: p for p in aufl["paare"]}
    meldungen: list[str] = []
    je_hoerer: dict[str, dict[str, str]] = {}
    for zk in zeichenketten:
        cid, hoerer, wahl = lies_ergebnis(zk)
        if cid != aufl["casting_id"]:
            raise ValueError(f"Ergebnis gehört zu {cid}, Ordner ist {aufl['casting_id']}")
        unbekannt = sorted(set(wahl) - set(paare))
        if unbekannt:
            raise ValueError(f"Unbekannte Paare {', '.join(unbekannt)} (Zeichenkette unvollständig kopiert?)")
        if hoerer in je_hoerer:
            meldungen.append(f"{hoerer}: mehrere Zeichenketten, gezählt wird nur die letzte")
        je_hoerer[hoerer] = wahl

    stand: dict[str, dict] = {tid: {"siege": 0, "duelle": 0, "je_text": {}, "je_hoerer": {}}
                              for tid in aufl["teilnehmer"]}
    for hoerer, wahl in je_hoerer.items():
        for pid, seite in wahl.items():
            p = paare[pid]
            sieger = aufl["clips"][p["a"] if seite == "A" else p["b"]]["teilnehmer"]
            for clip in (p["a"], p["b"]):
                tid = aufl["clips"][clip]["teilnehmer"]
                s = stand[tid]
                s["duelle"] += 1
                gewonnen = int(tid == sieger)
                s["siege"] += gewonnen
                for feld, wert in (("je_text", p["text"]), ("je_hoerer", hoerer)):
                    s[feld].setdefault(wert, [0, 0])
                    s[feld][wert][0] += gewonnen
                    s[feld][wert][1] += 1
    rangliste = sorted(
        ({"teilnehmer": tid, **{k: v for k, v in aufl["teilnehmer"][tid].items() if k != "stimme"},
          **s, "quote": round(s["siege"] / s["duelle"], 3) if s["duelle"] else None}
         for tid, s in stand.items()),
        key=lambda z: (z["quote"] or 0, z["siege"]), reverse=True)
    return {"ok": True, "casting_id": aufl["casting_id"], "hoerer": sorted(je_hoerer),
            "rangliste": rangliste, "meldungen": meldungen}


# --------------------------------------------------------------------------------------------
# Die Vergleichsseite
# --------------------------------------------------------------------------------------------

def schreibe_seite(seite: Path, plan: dict, einbetten: bool) -> None:
    """Eine einzelne HTML-Datei. Sie kennt nur Probe-Nummern, nie Anbieter oder Stimmen."""
    quellen = {}
    for cid in sorted(c for c, v in plan["clips"].items() if v["status"] == "fertig"):
        datei = seite / f"{cid}.mp3"
        quellen[cid] = ({"b64": base64.b64encode(datei.read_bytes()).decode("ascii")}
                        if einbetten else {"src": datei.name})
    daten = {
        "id": plan["casting_id"],
        "texte": {tid: {"titel": t["titel"], "text": basis.reiner_text(t["text"])}
                  for tid, t in plan["texte"].items()},
        "clips": quellen,
        "paare": [{"id": p["id"], "text": p["text"], "a": p["a"], "b": p["b"]} for p in plan["paare"]],
    }
    # "</" im JSON würde ein </script> vorzeitig schließen; "<\/" ist in JSON dasselbe Zeichen.
    json_text = json.dumps(daten, ensure_ascii=False).replace("</", "<\\/")
    (seite / "index.html").write_text(SEITE.replace("__DATEN__", json_text), encoding="utf-8")


SEITE = r"""<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#0E1726">
<title>Stimm-Casting</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
<style>
:root{--navy:#0E1726;--navy2:#1F3864;--gold:#C9A84C;--creme:#F5F0E8;--rot:#E07A5F;
  --gedimmt:rgba(245,240,232,.66);--linie:rgba(245,240,232,.14);--gold-hauch:rgba(201,168,76,.14)}
*{box-sizing:border-box}
html,body{margin:0;background:var(--navy);color:var(--creme)}
body{font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-text-size-adjust:100%;
  min-height:100dvh}
main{max-width:560px;margin:0 auto;padding:20px 16px calc(150px + env(safe-area-inset-bottom))}
.kopf{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.kicker{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);font-weight:600}
.zaehler{font-size:13px;color:var(--gedimmt);font-variant-numeric:tabular-nums}
h1{font-family:"Playfair Display",Georgia,serif;font-variant-numeric:lining-nums;font-weight:700;
  font-size:30px;line-height:1.12;margin:10px 0 6px}
p{line-height:1.5}
.leiste{height:3px;background:var(--linie);border-radius:2px;overflow:hidden;margin:14px 0 18px}
.leiste>i{display:block;height:100%;width:0;background:var(--gold);transition:width .3s}
.skript{font-size:15px;line-height:1.55;color:var(--gedimmt);border-left:2px solid var(--gold);
  padding:2px 0 2px 12px;margin:0 0 18px}
.skript.zu{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.mehr{background:none;border:0;color:var(--gold);font:500 14px Inter,system-ui,sans-serif;
  padding:0 0 16px;margin-top:-10px;cursor:pointer}
.karte{display:flex;align-items:center;gap:14px;background:var(--navy2);border:1px solid var(--linie);
  border-radius:14px;padding:14px;margin-bottom:12px;transition:border-color .2s}
.karte.gehoert{border-color:rgba(201,168,76,.6)}
.marke{font-family:"Playfair Display",Georgia,serif;font-size:36px;font-weight:700;width:36px;
  text-align:center;color:var(--gold);flex:none}
.spiel{width:56px;height:56px;border-radius:50%;border:0;background:var(--creme);color:var(--navy);
  display:grid;place-items:center;flex:none;cursor:pointer}
.spiel svg{width:22px;height:22px}
.spur{flex:1;min-width:0}
.zeit{font-size:13px;color:var(--gedimmt);font-variant-numeric:tabular-nums}
.balken{height:4px;background:var(--linie);border-radius:2px;margin-top:8px;overflow:hidden}
.balken>i{display:block;height:100%;width:0;background:var(--gold)}
.wahl{position:fixed;left:0;right:0;bottom:0;padding:28px 16px calc(14px + env(safe-area-inset-bottom));
  background:linear-gradient(rgba(14,23,38,0),var(--navy) 26%)}
.wahl-innen{max-width:560px;margin:0 auto}
.zwei{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.knopf{min-height:56px;border-radius:12px;border:1px solid var(--gold);background:transparent;
  color:var(--creme);font:600 17px Inter,system-ui,sans-serif;cursor:pointer;width:100%}
.knopf.voll{background:var(--gold);color:var(--navy)}
.knopf:disabled{opacity:.32;cursor:default}
.hinweis{text-align:center;font-size:13px;color:var(--gedimmt);margin:10px 0 0;min-height:1.2em}
.zurueck{background:none;border:0;color:var(--gedimmt);font:500 14px Inter,system-ui,sans-serif;
  padding:8px 0;cursor:pointer}
.chips{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0 22px}
.chip{border:1px solid var(--linie);border-radius:999px;padding:12px 20px;background:transparent;
  color:var(--creme);font:500 16px Inter,system-ui,sans-serif;cursor:pointer}
.chip[aria-pressed="true"]{border-color:var(--gold);background:var(--gold-hauch)}
ol.regeln{padding-left:20px;margin:0 0 8px;line-height:1.55;color:var(--gedimmt)}
ol.regeln li{margin-bottom:6px}
textarea{width:100%;min-height:110px;background:var(--navy2);color:var(--creme);border:1px solid var(--linie);
  border-radius:12px;padding:12px;font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;resize:vertical}
[hidden]{display:none!important}
</style>
</head>
<body>
<main>
  <section id="start">
    <div class="kicker">DeepTok · Blindtest</div>
    <h1>Welche Stimme hörst du lieber?</h1>
    <ol class="regeln">
      <li>Handy-Lautsprecher, keine Kopfhörer.</li>
      <li>Je Paar beide Proben bis zum Ende anhören, A und B.</li>
      <li>Tippe auf die, die du lieber hörst. Ein „gleich gut“ gibt es nicht.</li>
    </ol>
    <p class="zaehler" id="umfang"></p>
    <div class="kicker">Wer hört?</div>
    <div class="chips" role="group" aria-label="Hörer">
      <button class="chip" data-hoerer="H1" aria-pressed="false">Hörer 1</button>
      <button class="chip" data-hoerer="H2" aria-pressed="false">Hörer 2</button>
    </div>
    <p class="zaehler">Die Antworten bleiben auf diesem Gerät gespeichert. Du kannst jederzeit
       unterbrechen und später weitermachen.</p>
  </section>

  <section id="paar" hidden>
    <div class="kopf">
      <div class="kicker" id="teil"></div>
      <div class="zaehler" id="stand"></div>
    </div>
    <div class="leiste"><i id="fortschritt"></i></div>
    <p class="skript zu" id="skript"></p>
    <button class="mehr" id="mehr" type="button">Ganzen Text zeigen</button>
    <div id="karten"></div>
    <button class="zurueck" id="zurueck" type="button">← Voriges Paar</button>
  </section>

  <section id="ende" hidden>
    <div class="kicker">Fertig</div>
    <h1>Danke. Jetzt das Ergebnis kopieren.</h1>
    <p>Die Zeichenkette enthält nur Paar-Nummern und deine Wahl. Wer welche Stimme ist, steht
       erst in der Auflösung.</p>
    <textarea id="ergebnis" readonly></textarea>
    <div class="zwei" style="margin-top:12px">
      <button class="knopf voll" id="kopieren" type="button">Kopieren</button>
      <button class="knopf" id="neu" type="button">Neu beginnen</button>
    </div>
    <p class="hinweis" id="kopiert"></p>
  </section>
</main>

<div class="wahl" id="wahl" hidden>
  <div class="wahl-innen">
    <div class="zwei">
      <button class="knopf" id="waehleA" type="button" disabled>Lieber A</button>
      <button class="knopf" id="waehleB" type="button" disabled>Lieber B</button>
    </div>
    <p class="hinweis" id="wahlhinweis">Erst beide Proben bis zum Ende anhören.</p>
  </div>
</div>

<script>
const D = __DATEN__;
const $ = (id) => document.getElementById(id);
const PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>';
const PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
// Gewählt wird erst, wenn von JEDER Probe 90 % gelaufen sind. Beim 60-s-Skript kommen
// "Opportunity Cost", "Trade-off" und "Cashflow" erst spät; genau die sollen mitzählen (§4).
const ANTEIL = 0.9;
let zustand = {hoerer: null, i: 0, wahl: {}};
let gehoert = {A: false, B: false};
let spieler = {};

// localStorage kann fehlen (privater Modus) oder werfen: dann läuft die Seite ohne Speicher.
function schluessel(h) { return "deeptok-casting:" + D.id + ":" + h; }
function lies(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function schreib(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
function sichern() { if (zustand.hoerer) schreib(schluessel(zustand.hoerer), JSON.stringify(zustand)); }

const blobUrls = {};
function quelle(cid) {
  const c = D.clips[cid];
  if (c.src) return c.src;
  if (!blobUrls[cid]) {             // eingebettet: Base64 -> Blob, klappt auch auf iOS
    const bin = atob(c.b64), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    blobUrls[cid] = URL.createObjectURL(new Blob([bytes], {type: "audio/mpeg"}));
  }
  return blobUrls[cid];
}

function zeit(s) {
  if (!isFinite(s)) s = 0;
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return m + ":" + String(r).padStart(2, "0");
}

function stoppeAlle() { Object.values(spieler).forEach(a => { a.pause(); }); }

function karte(seite, cid) {
  const el = document.createElement("div");
  el.className = "karte";
  el.innerHTML = '<div class="marke">' + seite + '</div>' +
    '<button class="spiel" type="button" aria-label="Probe ' + seite + ' abspielen">' + PLAY + '</button>' +
    '<div class="spur"><div class="zeit">0:00</div><div class="balken"><i></i></div></div>';
  const audio = new Audio();
  audio.preload = "auto";
  audio.src = quelle(cid);
  spieler[seite] = audio;
  const knopf = el.querySelector(".spiel"), anzeige = el.querySelector(".zeit"),
        balken = el.querySelector(".balken > i");
  const zeichne = () => {
    anzeige.textContent = zeit(audio.currentTime) + " / " + zeit(audio.duration);
    balken.style.width = (audio.duration ? 100 * audio.currentTime / audio.duration : 0) + "%";
    knopf.innerHTML = audio.paused ? PLAY : PAUSE;
  };
  const markiere = () => {
    const genug = audio.ended || (audio.duration > 0 && audio.currentTime >= audio.duration * ANTEIL);
    if (genug && !gehoert[seite]) { gehoert[seite] = true; el.classList.add("gehoert"); pruefeWahl(); }
  };
  knopf.addEventListener("click", () => {
    if (audio.paused) { stoppeAlle(); audio.play().catch(() => {}); } else { audio.pause(); }
  });
  ["timeupdate", "play", "pause", "loadedmetadata"].forEach(e => audio.addEventListener(e, zeichne));
  audio.addEventListener("timeupdate", markiere);
  audio.addEventListener("ended", () => { markiere(); zeichne(); });
  return el;
}

function pruefeWahl() {
  const p = D.paare[zustand.i];
  const frei = (gehoert.A && gehoert.B) || (p && zustand.wahl[p.id]);
  $("waehleA").disabled = $("waehleB").disabled = !frei;
  $("wahlhinweis").textContent = frei ? "" : "Erst beide Proben bis zum Ende anhören.";
  const alt = p && zustand.wahl[p.id];
  $("waehleA").classList.toggle("voll", alt === "A");
  $("waehleB").classList.toggle("voll", alt === "B");
}

function zeige(name) {
  ["start", "paar", "ende"].forEach(s => { $(s).hidden = s !== name; });
  $("wahl").hidden = name !== "paar";
  window.scrollTo(0, 0);
}

function ergebnisText() {
  return "DTC1;" + D.id + ";" + zustand.hoerer + ";" +
    D.paare.map(p => p.id + (zustand.wahl[p.id] || "-")).join(",");
}

function zeichnePaar() {
  stoppeAlle();
  spieler = {};
  if (zustand.i >= D.paare.length) {
    $("ergebnis").value = ergebnisText();
    zeige("ende");
    return;
  }
  const p = D.paare[zustand.i], t = D.texte[p.text];
  $("teil").textContent = t.titel;
  $("stand").textContent = "Paar " + (zustand.i + 1) + " von " + D.paare.length;
  $("fortschritt").style.width = (100 * zustand.i / D.paare.length) + "%";
  $("skript").textContent = t.text;
  $("skript").classList.add("zu");
  $("mehr").textContent = "Ganzen Text zeigen";
  gehoert = {A: false, B: false};
  const karten = $("karten");
  karten.innerHTML = "";
  karten.appendChild(karte("A", p.a));
  karten.appendChild(karte("B", p.b));
  $("zurueck").hidden = zustand.i === 0;
  zeige("paar");
  // Erst jetzt ist die Höhe messbar: Knopf nur zeigen, wenn der Text wirklich abgeschnitten ist.
  $("mehr").hidden = $("skript").scrollHeight <= $("skript").clientHeight + 2;
  pruefeWahl();
}

function waehle(seite) {
  const p = D.paare[zustand.i];
  zustand.wahl[p.id] = seite;
  zustand.i += 1;
  sichern();
  zeichnePaar();
}

function starte(hoerer) {
  const alt = lies(schluessel(hoerer));
  zustand = {hoerer: hoerer, i: 0, wahl: {}};
  if (alt) { try { Object.assign(zustand, JSON.parse(alt), {hoerer: hoerer}); } catch (e) {} }
  document.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", String(c.dataset.hoerer === hoerer)));
  if (!D.paare.length) {
    $("umfang").textContent = "Keine Paare: Für einen Vergleich braucht es mindestens zwei Stimmen.";
    return;
  }
  zeichnePaar();
}

$("umfang").textContent = D.paare.length + " Paare, je Paar zwei Proben.";
document.querySelectorAll(".chip").forEach(c => c.addEventListener("click", () => starte(c.dataset.hoerer)));
$("waehleA").addEventListener("click", () => waehle("A"));
$("waehleB").addEventListener("click", () => waehle("B"));
$("zurueck").addEventListener("click", () => { if (zustand.i > 0) { zustand.i -= 1; sichern(); zeichnePaar(); } });
$("mehr").addEventListener("click", () => {
  const zu = $("skript").classList.toggle("zu");
  $("mehr").textContent = zu ? "Ganzen Text zeigen" : "Weniger zeigen";
});
$("kopieren").addEventListener("click", async () => {
  const text = $("ergebnis").value;
  try { await navigator.clipboard.writeText(text); }
  catch (e) { $("ergebnis").select(); try { document.execCommand("copy"); } catch (e2) {} }
  $("kopiert").textContent = "Kopiert.";
});
$("neu").addEventListener("click", () => {
  if (!confirm("Alle Antworten dieses Hörers löschen und von vorn beginnen?")) return;
  zustand = {hoerer: zustand.hoerer, i: 0, wahl: {}};
  sichern();
  zeichnePaar();
});
</script>
</body>
</html>
"""


# --------------------------------------------------------------------------------------------
# Kommandozeile
# --------------------------------------------------------------------------------------------

def baue_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Stimm-Casting mit blinder Vergleichsseite (§4).")
    p.add_argument("--nur", action="append", metavar="ANBIETER",
                   help="nur diese Anbieter (mehrfach oder mit Komma): " + ", ".join(stimm_paket.ANBIETER))
    p.add_argument("--trocken", action="store_true",
                   help="ohne Netz: Fixture-Audio statt API (zum Testen der Seite)")
    p.add_argument("--probe", action="store_true",
                   help="nur Zugang prüfen (Stimmenliste, Restguthaben); kostet nichts")
    p.add_argument("--probesatz", action="store_true",
                   help=f"mit --probe: je Anbieter einen kurzen Satz vertonen ({len(PROBESATZ)} Zeichen)")
    p.add_argument("--fortsetzen", metavar="ORDNER",
                   help="abgebrochenen Lauf weiterführen: fehlende Proben, Seite, Messung")
    p.add_argument("--messen", action=argparse.BooleanOptionalAction, default=None,
                   help="Hör-Check je Probe (Standard: an, bei --trocken aus)")
    p.add_argument("--alle-kandidaten", action="store_true",
                   help="alle Kandidaten-Stimmen je Anbieter statt nur der ersten")
    p.add_argument("--max-paare", type=int, default=0, help="höchstens so viele Paare (0 = alle)")
    p.add_argument("--einbetten", action="store_true",
                   help="Audio in die HTML-Datei einbetten (eine Datei zum Verschicken)")
    p.add_argument("--ausgabe", default=str(REPO_WURZEL / "casting"), help="Basisordner")
    p.add_argument("--datum", help="Ordnername (Standard: heute, Europe/Berlin)")
    p.add_argument("--seed", type=int, help="Zufall festlegen (für Tests)")
    p.add_argument("--texte", default=str(TEXTE_DATEI), help=argparse.SUPPRESS)
    p.add_argument("--voices", default=None, help=argparse.SUPPRESS)
    p.add_argument("--auswerten", metavar="ORDNER",
                   help="Ergebnis-Zeichenketten (Positionsargumente) für diesen Ordner auswerten")
    p.add_argument("ergebnisse", nargs="*", help=argparse.SUPPRESS)
    p.add_argument("--json", action="store_true", help="genau ein JSON-Objekt auf stdout")
    return p


def _drucke(bericht: dict) -> None:
    for m in bericht.get("meldungen", []):
        print(f"- {m}")
    if "rangliste" in bericht:
        print(f"Casting {bericht['casting_id']}: Rangliste nach Siegquote")
        for z in bericht["rangliste"]:
            print(f"  {z['anbieter']:<11} {z['name'][:32]:<32} {z['siege']:>3}/{z['duelle']:<3} "
                  f"Quote {z['quote']}")
        return
    if "probe" in bericht:
        for anbieter, z in bericht["probe"].items():
            if "fehler" in z:
                print(f"  {anbieter:<11} NEIN  {z['fehler']}")
                continue
            rest = z["restguthaben"] if z["restguthaben"] is not None else "API liefert keinen Stand"
            satz = z.get("probesatz")
            extra = (f", Probesatz {satz['format']} {satz['abtastrate']} Hz, {satz['zeichen']} Zeichen"
                     if satz else "")
            print(f"  {anbieter:<11} ok    {z['deutsche_stimmen']} deutsche Stimmen, "
                  f"Restguthaben: {rest}{extra}")
        return
    if not bericht.get("ok"):
        return
    print(f"Casting {bericht['casting_id']}: {bericht['clips']} Proben, {bericht['paare']} Paare")
    print(f"Seite (teilbar):  {bericht['ordner']}/index.html")
    print(f"Auflösung (NICHT teilen): {bericht['aufloesung']}/aufloesung.json")
    for z in bericht["teilnehmer"]:
        werte = (f"  WER {z.get('wer')}  LUFS {z.get('lufs')}  Tempo {z.get('woerter_pro_s')} W/s  "
                 f"Namen {z.get('namens_treffer')}") if bericht["gemessen"] else ""
        print(f"  {z['anbieter']:<11} {z['name'][:32]:<32} {z['zeichen']:>5} Zeichen{werte}")
    for anbieter, rest in bericht.get("restguthaben", {}).items():
        print(f"  Restguthaben {anbieter}: {rest if rest is not None else 'API liefert keinen Stand'}")


def _anbieter_aus_nur(nur: list[str] | None) -> list[str] | None:
    """'--nur azure,cartesia --nur inworld' -> ['azure', 'cartesia', 'inworld'].

    Ein leeres --nur ("" oder ",") ist ein Fehler. Würde es still "alle" bedeuten, rechneten
    im echten Lauf alle vier Anbieter ab, obwohl einer gemeint war.
    """
    if nur is None:
        return None
    liste = [a.strip() for eintrag in nur for a in eintrag.split(",") if a.strip()]
    if not liste:
        raise ValueError("--nur ohne Anbieter; erlaubt: " + ", ".join(stimm_paket.ANBIETER))
    unbekannt = [a for a in liste if a not in stimm_paket.ANBIETER]
    if unbekannt:
        raise ValueError(f"Unbekannte Anbieter: {', '.join(unbekannt)}")
    return list(dict.fromkeys(liste))           # doppelte weg, Reihenfolge bleibt


def main(argv: list[str] | None = None) -> int:
    args = baue_parser().parse_args(argv)
    try:
        args.nur = _anbieter_aus_nur(args.nur)
        if args.auswerten:
            bericht = werte_aus(Path(args.auswerten), args.ergebnisse)
        elif args.probe:
            bericht = probe(args.nur or list(stimm_paket.ANBIETER), args.voices, args.probesatz)
        else:
            if shutil.which("ffmpeg") is None:
                raise RuntimeError("ffmpeg fehlt")
            bericht = fortsetze(args) if args.fortsetzen else erzeuge(args)
    except (ValueError, KeyError, FileNotFoundError) as e:
        bericht = {"ok": False, "fehler": basis.schwaerze(str(e))}
        print(json.dumps(bericht, ensure_ascii=False) if args.json else f"Fehler: {bericht['fehler']}")
        return 2
    except Exception as e:
        # Letztes Netz: auch ein unerwarteter Fehler gibt mit --json genau EIN JSON-Objekt aus.
        # Bezahlte Proben sind dann schon in der Auflösung verbucht (nach jeder Probe gespeichert).
        bericht = {"ok": False, "fehler": basis.schwaerze(f"{type(e).__name__}: {e}")}
        print(json.dumps(bericht, ensure_ascii=False) if args.json else f"Fehler: {bericht['fehler']}")
        return 1
    if args.json:
        print(json.dumps(bericht, ensure_ascii=False))
    else:
        _drucke(bericht)
    return 0 if bericht.get("ok") else 1


if __name__ == "__main__":
    sys.exit(main())
