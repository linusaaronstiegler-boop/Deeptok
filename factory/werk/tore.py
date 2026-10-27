"""Tor G1, Teil Sprache und Datenschutz: Sperrwörter und persönliche Daten in Skripten,
Specs und App-Texten.

Das ist nicht das ganze Tor G1 aus docs/VIDEO-PIPELINE.md §6. Es fehlen noch: jede Zahl in
Bild und Ton steht normalisiert in facts[], keine Antwort vor pause_for_answer, keine
Eingabedatei gestaged. Diese Prüfungen brauchen die Video-Spec und kommen mit G0 (Phase 2).

Zwei Arten von Treffern:
1. Sperrwörter und Floskeln aus factory/sperrliste.json (Lob, "natürlich", "einfach",
   Mindset-Sprüche ...). Die Regeln dazu stehen in CLAUDE.md.
2. Muster persönlicher Daten (Mailadressen, Telefonnummern, Google-Drive-IDs,
   claude.ai-Artifact-Links, Schulnoten). Das Repo ist öffentlich; so etwas darf nie
   hineingeraten. Diese Treffer werden in der Ausgabe gekürzt, damit die Daten nicht
   über das Log weiterwandern.

Optional: FABRIK_PRIVATE_SPERRLISTE zeigt auf eine JSON-Datei AUSSERHALB des Repos
({"woerter": [...]}, z. B. Namen aus dem Vault). Diese Namen stehen so nie im Repo selbst.
"""
from __future__ import annotations

import json
import os
import re
import unicodedata
from dataclasses import asdict, dataclass
from pathlib import Path

from werk import EXIT_EINGABE, FabrikFehler
from werk.konfig import FABRIK_DIR

STANDARD_SPERRLISTE = FABRIK_DIR / "sperrliste.json"

# (?<!\w) und (?!\w) sind "Wortgrenzen", die auch Umlaute und ß als Buchstaben kennen.
# Ein einfaches \b täte es meist auch; die ausgeschriebene Form ist aber leichter zu lesen.
_VOR, _NACH = r"(?<!\w)", r"(?!\w)"
# Sperrwörter treffen nicht vor einem Bindestrich-Kompositum: "Super-GAU", "Mega-Fusion" sind
# Sachbegriffe, kein Lob. "Growth-Mindset" trifft trotzdem, weil dort "Mindset" am Ende steht.
_NACH_WORT = r"(?!\w|-\w)"
# Für Floskeln, die mit einem Objekt enden ("du kannst das"): nur am Satzende oder vor einem
# Satzzeichen. "Du kannst das!" ist Zuspruch, "Du kannst das Ergebnis prüfen" eine Anleitung.
_SATZENDE = r"(?=\s*(?:[.!?…,;:)\]\"'»«“”]|$))"

# --- Muster persönlicher Daten -----------------------------------------------------------------

_EMAIL = re.compile(r"(?<![\w.+-])[\w.+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}(?![\w-])")

# Telefonnummern: international (+49 30 ..., 0049 ...) oder national mit führender 0
# (030 23125456, 089/99998123, 030-23125456). Danach zählen wir die Ziffern (7 bis 15),
# damit Jahreszahlen, Beträge und Datumsangaben nicht anschlagen.
# Davor darf kein Punkt, Komma, # oder / stehen (Koordinaten wie 95.0028203, Farben wie
# #050812, Pfade); danach kein Buchstabe, keine Nachkommastelle und kein Prozentzeichen.
# Ein Satzpunkt direkt hinter der Nummer ist erlaubt.
_TEL_VOR = r"(?<![\w+.,#/-])"
_TEL_NACH = r"(?!\w|[.,]\d|\s?%)"
_TELEFON = re.compile(
    _TEL_VOR + r"(?:\+|00)[1-9]\d{0,2}[\s./-]?(?:\(0\)[\s./-]?)?\d{2,5}(?:[\s./-]?\d{2,}){1,4}" + _TEL_NACH
    + "|" + _TEL_VOR + r"0[1-9]\d{1,4}(?:\s?/\s?|[\s-])?\d{3,}(?:[\s-]?\d{2,})*" + _TEL_NACH)

# Google-Drive-IDs: 33 Zeichen (Dateien, Ordner) oder 44 Zeichen (Google Docs, Sheets) aus
# [A-Za-z0-9_-], beginnend mit 1. Zusätzlich verlangen wir Groß- UND Kleinbuchstaben:
# Git-Hashes (nur 0-9a-f) und Video-IDs der Fabrik (klein-mit-bindestrich) fallen damit
# sicher heraus.
_DRIVE_ID = re.compile(
    r"(?<![A-Za-z0-9_-])1[A-Za-z0-9_-]{32}(?:[A-Za-z0-9_-]{11})?(?![A-Za-z0-9_-])")
_DRIVE_LINK = re.compile(r"(?:drive|docs)\.google\.com/[^\s\"'<>)\]]+")
_ARTIFACT_LINK = re.compile(r"claude\.ai/[^\s\"'<>)\]]*artifacts?/[A-Za-z0-9_-]+")

# Schulnoten: "Note 1,3", "Note: 2-", "Abiturnote 1,7", "Note 13" (Oberstufen-Punkte).
# Groß geschrieben, damit "Fußnote 1" nicht anschlägt.
_NOTE = re.compile(
    r"(?<!\w)(?:Note|Noten|Schulnote|Abiturnote|Abinote|Zeugnisnote|Durchschnittsnote|"
    r"Notenschnitt|Notendurchschnitt)\s*:?\s*(?:1[0-5]|[0-9](?:[,.]\d{1,2})?(?:\s?[+-](?!\d))?)(?!\d)")


@dataclass
class Treffer:
    datei: str
    zeile: int | None       # bei JSON-Dateien None, dafür "ort"
    spalte: int | None
    ort: str | None         # Pfad im JSON, z. B. $.scenes[2].narration
    art: str                # sperrwort | floskel | email | telefon | drive_id | drive_link | artifact_link | note | privat
    text: str


@dataclass
class Sperrliste:
    woerter: re.Pattern | None
    klein: re.Pattern | None
    floskeln: re.Pattern | None
    privat: re.Pattern | None
    satzende: re.Pattern | None = None      # Floskeln, die nur am Satzende zählen
    ausnahmen: re.Pattern | None = None     # Fachbegriffe, z. B. "einfache Mehrheit"


def _wort_muster(wort: str) -> str:
    """Ein Wort als Regex. Ein '*' am Ende steht für eine beliebige Endung ("einfache*")."""
    if wort.endswith("*"):
        return re.escape(wort[:-1]) + r"\w*"
    return re.escape(wort)


def _alternation(eintraege: list[str], als_floskel: bool = False, nach: str = _NACH) -> str | None:
    teile = []
    # Längste zuerst, damit "einfachsten" nicht schon bei "einfach" hängen bleibt.
    for eintrag in sorted({e.strip() for e in eintraege if e.strip()}, key=len, reverse=True):
        eintrag = unicodedata.normalize("NFC", eintrag)
        if als_floskel:
            # Zwischen den Wörtern einer Floskel darf beliebiger Leerraum stehen, auch ein
            # Zeilenumbruch, oder ein Bindestrich: "super Leistung" trifft auch "Super-Leistung".
            teile.append(r"[\s-]+".join(_wort_muster(w) for w in eintrag.split()))
        else:
            teile.append(re.escape(eintrag))
    if not teile:
        return None
    return _VOR + "(?:" + "|".join(teile) + ")" + nach


def lade_sperrliste(pfad: Path | str | None = None) -> Sperrliste:
    pfad = Path(pfad) if pfad else STANDARD_SPERRLISTE
    try:
        daten = json.loads(pfad.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        raise FabrikFehler(f"Sperrliste {pfad} nicht lesbar: {e}", EXIT_EINGABE) from e

    def baue(muster: str | None, flags: int = 0) -> re.Pattern | None:
        return re.compile(muster, flags) if muster else None

    privat = None
    privat_pfad = os.environ.get("FABRIK_PRIVATE_SPERRLISTE")
    if privat_pfad and Path(privat_pfad).is_file():
        privat_daten = json.loads(Path(privat_pfad).read_text(encoding="utf-8"))
        privat = baue(_alternation(privat_daten.get("woerter", [])), re.IGNORECASE)

    return Sperrliste(
        woerter=baue(_alternation(daten.get("woerter", []), nach=_NACH_WORT), re.IGNORECASE),
        # Ohne IGNORECASE: "klasse" (Lob) trifft, "Klasse 10" (Nomen) nicht.
        klein=baue(_alternation(daten.get("nur_kleingeschrieben", []), nach=_NACH_WORT)),
        floskeln=baue(_alternation(daten.get("floskeln", []), als_floskel=True), re.IGNORECASE),
        privat=privat,
        satzende=baue(_alternation(daten.get("floskeln_am_satzende", []), als_floskel=True,
                                   nach=_SATZENDE), re.IGNORECASE),
        ausnahmen=baue(_alternation(daten.get("ausnahmen", []), als_floskel=True), re.IGNORECASE),
    )


def _kuerze(text: str) -> str:
    """Persönliche Daten nur angedeutet ausgeben: 'li…(22 Zeichen)'."""
    return f"{text[:2]}…({len(text)} Zeichen)"


def _drive_id_echt(kandidat: str) -> bool:
    return any(c.isupper() for c in kandidat) and any(c.islower() for c in kandidat)


def pruefe_text(text: str, sperrliste: Sperrliste) -> list[tuple[int, str, str]]:
    """Gibt (Position, Art, angezeigter Text) für jeden Treffer zurück, nach Position sortiert."""
    text = unicodedata.normalize("NFC", text)
    roh: list[tuple[int, int, str, str]] = []      # (Anfang, Ende, Art, Anzeige)

    def sammle(art: str, muster: re.Pattern | None, anzeige=lambda s: " ".join(s.split()),
               bedingung=lambda s: True) -> None:
        if muster:
            roh.extend((m.start(), m.end(), art, anzeige(m.group()))
                       for m in muster.finditer(text) if bedingung(m.group()))

    sammle("sperrwort", sperrliste.woerter)
    sammle("sperrwort", sperrliste.klein)
    sammle("floskel", sperrliste.floskeln)
    sammle("floskel", sperrliste.satzende)
    # Fachbegriffe wie "einfache Mehrheit" oder "triviale Lösung": Ein Sperrwort, das ganz in
    # so einer Ausnahme liegt, ist sachlich gemeint und fällt weg. Persönliche Daten nie.
    if sperrliste.ausnahmen:
        frei = [(m.start(), m.end()) for m in sperrliste.ausnahmen.finditer(text)]
        roh[:] = [t for t in roh if t[2] not in ("sperrwort", "floskel")
                  or not any(a <= t[0] and t[1] <= e for a, e in frei)]
    sammle("privat", sperrliste.privat, _kuerze)
    sammle("email", _EMAIL, _kuerze)
    sammle("telefon", _TELEFON, _kuerze, lambda s: 7 <= sum(c.isdigit() for c in s) <= 15)
    sammle("drive_id", _DRIVE_ID, _kuerze, _drive_id_echt)
    sammle("drive_link", _DRIVE_LINK, _kuerze)
    sammle("artifact_link", _ARTIFACT_LINK, _kuerze)
    sammle("note", _NOTE, _kuerze)
    # "toll" in "toll gemacht" nur einmal melden: Treffer, die ganz in einem längeren
    # Treffer liegen, fallen weg.
    eindeutig = [t for t in roh
                 if not any(a <= t[0] and t[1] <= e and (e - a) > (t[1] - t[0]) for a, e, _, _ in roh)]
    return sorted({(a, art, anzeige) for a, _, art, anzeige in eindeutig})


def _zeile_spalte(text: str, pos: int) -> tuple[int, int]:
    zeile = text.count("\n", 0, pos) + 1
    spalte = pos - (text.rfind("\n", 0, pos) + 1) + 1
    return zeile, spalte


def _json_texte(wert: object, pfad: str = "$"):
    """Alle Texte in einem JSON-Baum, mit Pfad. So stören \\u00fc-Escapes nicht."""
    if isinstance(wert, str):
        yield pfad, wert
    elif isinstance(wert, list):
        for i, x in enumerate(wert):
            yield from _json_texte(x, f"{pfad}[{i}]")
    elif isinstance(wert, dict):
        for k, x in wert.items():
            yield from _json_texte(x, f"{pfad}.{k}")


def lint_datei(pfad: Path | str, sperrliste: Sperrliste) -> list[Treffer]:
    pfad = Path(pfad)
    text = pfad.read_text(encoding="utf-8")       # UnicodeDecodeError -> Aufrufer meldet "binär"
    if pfad.suffix.lower() == ".json":
        try:
            daten = json.loads(text)
        except json.JSONDecodeError:
            daten = None
        if daten is not None:
            return [Treffer(str(pfad), None, None, ort, art, gezeigt)
                    for ort, wert in _json_texte(daten)
                    for _, art, gezeigt in pruefe_text(wert, sperrliste)]
    text = unicodedata.normalize("NFC", text)
    ergebnis = []
    for pos, art, gezeigt in pruefe_text(text, sperrliste):
        zeile, spalte = _zeile_spalte(text, pos)
        ergebnis.append(Treffer(str(pfad), zeile, spalte, None, art, gezeigt))
    return ergebnis


def lint(pfade: list[Path | str], sperrliste: Sperrliste | None = None) -> dict:
    """Prüft alle Dateien. Ergebnis: {"ok", "dateien", "treffer": [...], "uebersprungen": [...]}."""
    sperrliste = sperrliste or lade_sperrliste()
    treffer: list[Treffer] = []
    uebersprungen = []
    for pfad in pfade:
        pfad = Path(pfad)
        if not pfad.is_file():
            raise FabrikFehler(f"Datei nicht gefunden: {pfad}", EXIT_EINGABE)
        try:
            treffer += lint_datei(pfad, sperrliste)
        except UnicodeDecodeError:
            uebersprungen.append(str(pfad))     # Audio, Bilder: kein Text zu prüfen
    return {"ok": not treffer, "dateien": len(pfade), "treffer": [asdict(t) for t in treffer],
            "uebersprungen": uebersprungen}


def treffer_als_text(t: dict) -> str:
    ort = f"{t['zeile']}:{t['spalte']}" if t["zeile"] is not None else t["ort"]
    return f"{t['datei']}:{ort}: {t['art']}: {t['text']}"
