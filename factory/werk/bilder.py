"""Echtbild-Baustein: frei lizenzierte Fotos und Clips von Wikimedia Commons holen und behandeln.

Was das Modul macht:
- suche(begriff): fragt die Commons-API (generator=search) nach Dateien und behält nur Treffer
  mit freier Lizenz: Public Domain, CC0, CC BY, CC BY-SA und „ohne bekannte Rechte“ (Library of
  Congress, Flickr Commons). Alles andere fliegt raus: NC, ND, GFDL allein, „fair use“, unklar.
- lade(treffer, ziel): lädt die Datei mit einem beschreibenden User-Agent, langsam (feste Pause
  zwischen zwei Abrufen) und wartet bei HTTP 429/503 so lange, wie der Server sagt (Retry-After).
  Wir umgehen nie eine Sperre: Nach MAX_VERSUCHE Absagen bricht der Abruf mit CommonsBesetzt ab,
  und man versucht es später noch einmal.
- video_fassungen(treffer): die verkleinerten Fassungen eines Videos (480p, 720p …); lade(…,
  fassung=…) holt eine davon. Ein Video wird nie still gegen ein Standbild getauscht.
- Personen: Dateien mit der Commons-Einschränkung „personality“ lösen einen BildHinweis aus und
  lassen sich nur mit personen_freigabe="Grund" laden (keine Privatpersonen im Mittelpunkt).
- vorlagen(titel): die Lizenz-Vorlagen der Dateiseite, um „Public domain“ nachzuprüfen.
- credit_zeile(treffer), credit_zeilen(...), credits_eintrag(...), schreibe_credits(...):
  Namensnennung fürs Bild (Credit-Ecke, DESIGN.md §2) und für credits.json neben dem Video.
  Fotojahr und Objektdatum sind getrennt (jahr=…, objekt=…), ein nacktes Jahr wird „ca.“.
- Behandlungen mit Pillow: graustufen, duoton (je mit Farbfilter-Gewichten), freistellen
  (hyperframes remove-background, sonst rembg) und freistellen_heller_grund (ohne Modell).

Warum Commons? Jede Datei dort hat eine maschinenlesbare Lizenz (extmetadata), einen Urheber und
eine feste Seiten-ID. Damit lässt sich die Lizenz prüfen, bevor ein Bild ins Video kommt.
Agentur- und Pressefotos, Google-Bildersuche und YouTube sind tabu (CLAUDE.md, Bildrechte).

Kommandozeile (für Agenten), aus dem Repo-Wurzelverzeichnis:
    python factory/werk/bilder.py suche "Camp Nou" --anzahl 8
    python factory/werk/bilder.py lade "File:Camp Nou.jpg" studio/x/assets/fotos/ --vorschau
    python factory/werk/bilder.py fassungen "File:Camp Nou.webm"
    python factory/werk/bilder.py vorlagen "File:Ballon.jpg"
    python factory/werk/bilder.py duoton ein.jpg aus.jpg --schatten "#12343B" --licht "#E8C77A"
"""
from __future__ import annotations

import gzip
import hashlib
import html
import json
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import warnings
from dataclasses import asdict, dataclass, field
from datetime import date
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Any, Iterable

if __package__ in (None, ""):          # Aufruf als Skript: factory/ in den Suchpfad
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from werk import EXIT_EINGABE, FabrikFehler  # noqa: E402

__all__ = ["BildFehler", "BildHinweis", "CommonsBesetzt", "FREI", "Treffer", "USER_AGENT",
           "credit_zeile", "credit_zeilen", "credits_eintrag", "duoton", "freistellen",
           "freistellen_heller_grund", "graustufen", "hole_datei", "lade", "lizenz_art",
           "schreibe_credits", "suche", "video_fassungen", "vorlagen"]

COMMONS_API = "https://commons.wikimedia.org/w/api.php"

# Wikimedia verlangt einen User-Agent mit Projektname und Kontakt (User-Agent-Richtlinie,
# meta.wikimedia.org/wiki/User-Agent_policy). Ohne ihn gibt es schneller 403/429.
# „ueber“ statt „über“: HTTP-Kopfzeilen sollen ASCII sein, sonst kommen Umlaute verstümmelt an.
USER_AGENT = ("DeepTok/0.1 (Lernprojekt; kontakt ueber GitHub linusaaronstiegler-boop/Deeptok; "
              "https://github.com/linusaaronstiegler-boop/Deeptok)")

PAUSE_S = 2.0            # Mindestabstand zwischen zwei Abrufen (API und Dateien), seriell
MAX_VERSUCHE = 5         # so oft fragen wir bei 429/503/maxlag, dann geben wir auf
BACKOFF_START_S = 5.0    # erste Wartezeit, wenn der Server keine Retry-After-Zeile schickt
BACKOFF_MAX_S = 120.0    # längste Wartezeit zwischen zwei Versuchen
MAX_DATEI_BYTES = 40_000_000   # größere Originale nur als Vorschau laden
ZEITLIMIT_S = 60

# Die Lizenz-Arten, die wir zulassen (Hausregel „Bildrechte“).
FREI = ("pd", "cc0", "cc-by", "cc-by-sa", "ohne-bekannte-rechte")

# Diese extmetadata-Felder brauchen wir; der Filter macht die Antwort klein.
META_FELDER = ("Artist", "Credit", "LicenseShortName", "License", "LicenseUrl", "UsageTerms",
               "AttributionRequired", "Copyrighted", "NonFree", "Restrictions",
               "DateTimeOriginal", "DateTime", "ImageDescription", "ObjectName")

DATEIARTEN = ("bitmap", "drawing", "video")


class BildFehler(FabrikFehler):
    """Allgemeiner Fehler im Echtbild-Baustein (Netz, Lizenz, Datei)."""


class CommonsBesetzt(BildFehler):
    """Commons hat abgesagt (429/503/maxlag). Später erneut versuchen; warte_s nennt, wie lange
    der Server mindestens Ruhe will (aus Retry-After), sonst None."""

    def __init__(self, nachricht: str, *args, warte_s: float | None = None):
        super().__init__(nachricht, *args)
        self.warte_s = warte_s


class BildHinweis(UserWarning):
    """Kein Fehler, aber etwas fehlt (z. B. rembg nicht installiert)."""


@dataclass
class Treffer:
    """Ein Commons-Treffer mit allem, was die Namensnennung braucht."""
    titel: str                  # "File:Camp Nou aerial.jpg"
    seiten_id: int              # feste ID, ergibt den Kurzlink commons.wikimedia.org/?curid=…
    seite: str                  # Beschreibungsseite (https://commons.wikimedia.org/wiki/File:…)
    url: str                    # Original-Datei
    vorschau_url: str | None    # verkleinerte Fassung (iiurlwidth)
    breite: int
    hoehe: int
    mime: str
    bytes: int
    sha1: str | None
    urheber: str                # aus „Artist“, HTML entfernt; „unbekannt“, wenn leer
    lizenz: str                 # wie Commons sie kurz nennt: „CC BY-SA 4.0“, „Public domain“
    lizenz_art: str             # eine aus FREI
    lizenz_url: str | None
    datum: str | None           # Aufnahme- oder Werkdatum, wie Commons es angibt (Text)
    beschreibung: str | None
    einschraenkungen: list[str] = field(default_factory=list)   # z. B. personality, trademarked
    abgerufen: str = ""         # ISO-Datum des Abrufs

    @property
    def kurzlink(self) -> str:
        """Fester, kurzer Link auf die Beschreibungsseite (ohne https://, für die Credit-Ecke)."""
        return f"commons.wikimedia.org/?curid={self.seiten_id}"

    @property
    def jahr(self) -> str | None:
        """Jahr aus dem Commons-Datum, vorsichtig gelesen (lieber „ca.“ als ein falsches Jahr).

        „2014-04-08 10:57“ → „2014“ (genaues Datum), „zwischen 1940 und 1949“ → „1940–1949“,
        „1890“ → „ca. 1890“ und „um 1890“ → „ca. 1890“. Warum „ca.“ bei einem nackten Jahr: Bei
        Archivfotos ist das oft nur das Erscheinungsjahr einer Serie (Library of Congress nennt
        für den Arc de Triomf „[ca. 1890-1906]“, Commons nur „1890“). Ein geprüftes Jahr gibt man
        credit_zeilen/credits_eintrag als jahr=… mit; das schlägt diese Schätzung.
        """
        text = self.datum or ""
        jahre = re.findall(r"\b(1[5-9]\d\d|20\d\d)\b", text)
        if not jahre:
            return None
        ungefaehr = bool(re.search(r"\b(ca|circa|um|around|about|vers|c)\b\.?|\?|\[", text,
                                   re.IGNORECASE))
        if len(jahre) >= 2 and jahre[1] != jahre[0]:
            return f"{'ca. ' if ungefaehr else ''}{jahre[0]}–{jahre[1]}"
        # Genaues Datum: Jahr-Monat(-Tag) als Zahl oder ein Monatsname neben dem Jahr.
        genau = re.search(r"\b\d{4}-\d{2}\b|\b\d{1,2}\.\s?\d{1,2}\.\s?\d{4}\b", text) or re.search(
            r"(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember|"
            r"january|february|march|may|june|july|october|december)", text, re.IGNORECASE)
        if genau and not ungefaehr:
            return jahre[0]
        return f"ca. {jahre[0]}"

    @property
    def ist_video(self) -> bool:
        return self.mime.startswith("video/")

    @property
    def zeigt_personen(self) -> bool:
        """Commons-Einschränkung „personality“: erkennbare Personen, Persönlichkeitsrecht beachten."""
        return any("personality" in e.lower() for e in self.einschraenkungen)

    def als_dict(self) -> dict[str, Any]:
        return asdict(self)


# --- Lizenz -----------------------------------------------------------------------------------

def _wert(meta: dict, feld: str) -> str:
    """extmetadata-Felder sind {"value": "...", "source": ...}; leere Felder fehlen ganz."""
    eintrag = meta.get(feld) or {}
    wert = eintrag.get("value", "") if isinstance(eintrag, dict) else eintrag
    return _text(str(wert)) if wert is not None else ""


def _text(roh: str) -> str:
    """HTML-Reste aus Commons-Feldern entfernen: Tags weg, Entities auflösen, Leerraum glätten.

    Dazu drei Commons-Eigenheiten: versteckte Wikidata-Marken („date QS:P571,+1923-00-00T…“),
    nicht aufgelöste Vorlagen („{{ARK-BNF{{|}}ark:/…}}“) und Signaturen mit Zeitstempel
    („Mutari 21:43, 20 September 2007 (UTC)“).
    """
    ohne_tags = re.sub(r"<[^>]+>", " ", roh)
    text = html.unescape(ohne_tags)
    text = re.sub(r"\bdate\s+QS:\S+", " ", text)
    text = re.sub(r"\{\{.*\}\}", " ", text)                  # nicht aufgelöste Vorlagen
    text = re.sub(r"\s\d{1,2}:\d{2},\s\d{1,2}\s\w+\s\d{4}\s\(UTC\)", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def lizenz_art(meta: dict) -> str | None:
    """Ordnet die Lizenz einer Datei einer Art aus FREI zu, sonst None (= nicht verwenden).

    Geprüft wird das Kürzel „License“ (z. B. "cc-by-sa-4.0") und der Kurzname
    „LicenseShortName“ (z. B. "CC BY-SA 4.0"). Zuerst die Ausschlüsse: Ein NC oder ND im Namen
    schlägt jede andere Angabe, „NonFree“ ebenso. Die Reihenfolge ist wichtig, denn
    „cc-by-nc-sa“ fängt wie „cc-by“ an.
    """
    if _wert(meta, "NonFree").lower() in ("true", "1", "yes"):
        return None
    for roh in (_wert(meta, "License"), _wert(meta, "LicenseShortName")):
        t = re.sub(r"[\s_]+", "-", roh.lower())
        if not t:
            continue
        if re.search(r"(^|-)(nc|nd)(-|$)|noncommercial|non-commercial|noderiv|fair-use|non-free", t):
            return None
        if "cc0" in t or t in ("cc-zero", "cc-pd-mark"):
            return "cc0"
        if t.startswith("pd") or "public-domain" in t or t == "gemeinfrei":
            return "pd"
        if "no-known-copyright" in t or t in ("no-restrictions", "no-known-restrictions"):
            return "ohne-bekannte-rechte"
        if t.startswith("cc-by-sa"):
            return "cc-by-sa"
        if re.match(r"cc-by(-\d|$)", t):
            return "cc-by"
    return None


# --- Netz -------------------------------------------------------------------------------------

_letzter_abruf = 0.0     # monotone Uhrzeit des letzten Abrufs (für die feste Pause)


def _warte_auf_slot(pause_s: float = PAUSE_S) -> None:
    """Hält PAUSE_S Abstand zum letzten Abruf. Alle Abrufe laufen nacheinander, nie parallel."""
    global _letzter_abruf
    vergangen = time.monotonic() - _letzter_abruf
    if vergangen < pause_s:
        time.sleep(pause_s - vergangen)
    _letzter_abruf = time.monotonic()


def _retry_after(kopf: str | None) -> float | None:
    """Retry-After ist entweder eine Zahl (Sekunden) oder ein HTTP-Datum."""
    if not kopf:
        return None
    kopf = kopf.strip()
    if re.fullmatch(r"\d+(\.\d+)?", kopf):
        return float(kopf)
    try:
        bis = parsedate_to_datetime(kopf)
    except (TypeError, ValueError):
        return None
    return max(0.0, bis.timestamp() - time.time())


def _abruf(url: str, params: dict[str, str] | None = None, *, zeitlimit: float = ZEITLIMIT_S,
           max_bytes: int = MAX_DATEI_BYTES) -> bytes:
    """Ein GET mit User-Agent, Pause und höflichem Warten bei 429/503.

    Bei 429/503 wartet die Funktion mindestens so lange, wie Retry-After sagt, und verdoppelt
    die eigene Wartezeit nach jedem weiteren Nein (5, 10, 20 … höchstens 120 s). Verlangt der
    Server mehr als BACKOFF_MAX_S, kommt sofort CommonsBesetzt mit warte_s (nie früher fragen).
    Nach MAX_VERSUCHE Absagen kommt CommonsBesetzt. Andere HTTP-Fehler brechen sofort ab.
    """
    if params:
        url = f"{url}?{urllib.parse.urlencode(params)}"
    backoff = BACKOFF_START_S
    for versuch in range(1, MAX_VERSUCHE + 1):
        _warte_auf_slot()
        anfrage = urllib.request.Request(url, headers={"User-Agent": USER_AGENT,
                                                       "Accept-Encoding": "gzip"})
        try:
            with urllib.request.urlopen(anfrage, timeout=zeitlimit) as antwort:
                daten = antwort.read(max_bytes + 1)
                if len(daten) > max_bytes:
                    raise BildFehler(f"Datei größer als {max_bytes} Bytes: {url}")
                if (antwort.headers.get("Content-Encoding") or "").lower() == "gzip":
                    daten = gzip.decompress(daten)
                return daten
        except urllib.error.HTTPError as fehler:
            if fehler.code not in (429, 503):
                raise BildFehler(f"HTTP {fehler.code} von {urllib.parse.urlsplit(url).netloc}: "
                                 f"{fehler.reason}") from fehler
            if versuch == MAX_VERSUCHE:
                break
            server = _retry_after(fehler.headers.get("Retry-After")) or 0.0
            if server > BACKOFF_MAX_S:
                # Der Server will länger Ruhe, als wir hier warten. Nie früher fragen, als er sagt:
                # abbrechen und die Wartezeit nennen (am 28.10. sagte upload.wikimedia.org 600 s).
                raise CommonsBesetzt(f"Commons bittet um {server:.0f} s Pause (Retry-After). "
                                     "Nicht umgehen, frühestens dann erneut versuchen.",
                                     warte_s=server) from fehler
            time.sleep(max(server, backoff))
            backoff = min(backoff * 2, BACKOFF_MAX_S)
        except urllib.error.URLError as fehler:
            raise BildFehler(f"Netzfehler: {fehler.reason}") from fehler
    raise CommonsBesetzt(f"Commons sagt nach {MAX_VERSUCHE} Versuchen weiter „zu viele Anfragen“. "
                         "Nicht umgehen, später erneut versuchen.")


# API-Fehler, die „später noch einmal“ bedeuten: Server überlastet, Suche ausgelastet, gedrosselt.
API_SPAETER = ("maxlag", "ratelimited", "cirrussearch-too-busy-error")


def _api(params: dict[str, str]) -> dict:
    """Commons-API-Aufruf. Fehler aus API_SPAETER werden wie ein 429 behandelt: warten, wieder."""
    params = {"format": "json", "formatversion": "2", "maxlag": "5", **params}
    backoff = BACKOFF_START_S
    for versuch in range(1, MAX_VERSUCHE + 1):
        antwort = json.loads(_abruf(COMMONS_API, params).decode("utf-8"))
        fehler = antwort.get("error")
        if not fehler:
            return antwort
        if fehler.get("code") not in API_SPAETER:
            raise BildFehler(f"Commons-API: {fehler.get('code')}: {fehler.get('info')}")
        if versuch < MAX_VERSUCHE:
            time.sleep(backoff)
            backoff = min(backoff * 2, BACKOFF_MAX_S)
    raise CommonsBesetzt(f"Commons meldet weiter „{fehler.get('code')}“. Später erneut versuchen.")


# --- Suche ------------------------------------------------------------------------------------

def _urheber(meta: dict) -> str:
    """Urheber aus „Artist“ (sonst „Credit“); „Unknown author“ u. Ä. wird „unbekannt“."""
    name = _wert(meta, "Artist") or _wert(meta, "Credit")
    if not name or re.search(r"unknown author|unknown photographer|^unknown|unbekannt|^anonym",
                             name.lower()):
        return "unbekannt"
    return name


def _treffer_aus_seite(seite: dict, heute: str) -> Treffer | None:
    infos = seite.get("imageinfo") or []
    if not infos:
        return None
    info = infos[0]
    meta = info.get("extmetadata") or {}
    art = lizenz_art(meta)
    if art is None:
        return None
    einschraenkungen = [e for e in _wert(meta, "Restrictions").split("|") if e]
    return Treffer(
        titel=seite["title"],
        seiten_id=int(seite["pageid"]),
        seite=info.get("descriptionurl") or
        f"https://commons.wikimedia.org/wiki/{urllib.parse.quote(seite['title'].replace(' ', '_'))}",
        url=info["url"],
        vorschau_url=info.get("thumburl"),
        breite=int(info.get("width") or 0),
        hoehe=int(info.get("height") or 0),
        mime=info.get("mime") or "",
        bytes=int(info.get("size") or 0),
        sha1=info.get("sha1"),
        urheber=_urheber(meta),
        lizenz=_wert(meta, "LicenseShortName") or _wert(meta, "License"),
        lizenz_art=art,
        lizenz_url=_wert(meta, "LicenseUrl") or None,
        datum=_wert(meta, "DateTimeOriginal") or None,
        beschreibung=_wert(meta, "ImageDescription") or _wert(meta, "ObjectName") or None,
        einschraenkungen=einschraenkungen,
        abgerufen=heute,
    )


def suche(begriff: str, lizenzen: Iterable[str] = FREI, *, arten: Iterable[str] = ("bitmap",),
          anzahl: int = 12, vorschau_breite: int = 1280, min_breite: int = 0) -> list[Treffer]:
    """Sucht Dateien auf Commons und gibt nur frei lizenzierte Treffer zurück (beste zuerst).

    begriff:  Suchwörter wie in der Commons-Suche, z. B. "Camp Nou aerial".
    lizenzen: Teilmenge von FREI, z. B. ("pd", "cc0") für Fälle ohne ShareAlike.
    arten:    "bitmap" (Fotos), "drawing" (SVG), "video"; je Art eine Anfrage.
    """
    erlaubt = set(lizenzen)
    unbekannt = erlaubt - set(FREI)
    if unbekannt:
        raise BildFehler(f"Nicht erlaubte Lizenz-Art(en): {sorted(unbekannt)}; erlaubt: {FREI}",
                         EXIT_EINGABE)
    heute = date.today().isoformat()
    ergebnis: list[Treffer] = []
    for art in arten:
        if art not in DATEIARTEN:
            raise BildFehler(f"Unbekannte Dateiart {art!r}; erlaubt: {DATEIARTEN}", EXIT_EINGABE)
        antwort = _api({
            "action": "query",
            "generator": "search",
            "gsrsearch": f"{begriff} filetype:{art}",
            "gsrnamespace": "6",                 # Namensraum 6 = Dateien
            "gsrlimit": str(anzahl),
            "prop": "imageinfo",
            "iiprop": "url|size|mime|sha1|extmetadata",
            "iiurlwidth": str(vorschau_breite),
            "iiextmetadatafilter": "|".join(META_FELDER),
            "iiextmetadatalanguage": "de",
        })
        seiten = sorted((antwort.get("query") or {}).get("pages") or [],
                        key=lambda s: s.get("index", 0))
        for seite in seiten:
            treffer = _treffer_aus_seite(seite, heute)
            if treffer and treffer.lizenz_art in erlaubt and treffer.breite >= min_breite:
                ergebnis.append(treffer)
    personen = [t.titel for t in ergebnis if t.zeigt_personen]
    if personen:
        _warne_personen(personen)
    return ergebnis


def _warne_personen(titel: list[str]) -> None:
    """Commons markiert erkennbare Personen mit „personality“. Kein Fehler, aber ein Mensch muss
    vor dem Laden entscheiden (lade(…, personen_freigabe="Grund")): nur Personen des öffentlichen
    Lebens in ihrer Rolle, keine Privatpersonen im Mittelpunkt (CLAUDE.md, Bildrechte)."""
    warnings.warn("Persönlichkeitsrecht (Commons: personality) bei: " + "; ".join(titel)
                  + ". Laden nur mit personen_freigabe='<Grund>'.", BildHinweis, stacklevel=3)


def hole_datei(titel: str, *, vorschau_breite: int = 1280) -> Treffer:
    """Ein bestimmter Titel ("File:…"), mit derselben Lizenzprüfung wie suche()."""
    if not titel.startswith("File:"):
        titel = f"File:{titel}"
    antwort = _api({
        "action": "query", "titles": titel, "prop": "imageinfo",
        "iiprop": "url|size|mime|sha1|extmetadata", "iiurlwidth": str(vorschau_breite),
        "iiextmetadatafilter": "|".join(META_FELDER), "iiextmetadatalanguage": "de",
    })
    seiten = (antwort.get("query") or {}).get("pages") or []
    if not seiten or seiten[0].get("missing"):
        raise BildFehler(f"Datei nicht gefunden: {titel}", EXIT_EINGABE)
    treffer = _treffer_aus_seite(seiten[0], date.today().isoformat())
    if treffer is None:
        raise BildFehler(f"Keine freie Lizenz (PD, CC0, CC BY, CC BY-SA): {titel}")
    if treffer.zeigt_personen:
        _warne_personen([treffer.titel])
    return treffer


def vorlagen(titel: str) -> list[str]:
    """Die Vorlagen der Dateiseite (z. B. „PD-old-100-expired“, „Cc-by-sa-4.0“, „LOC-image“).

    extmetadata fasst die Lizenz nur zusammen („Public domain“). Ob das für das Foto selbst gilt
    oder nur für den abgebildeten Gegenstand, steht in den Vorlagen der Seite. Ein Abruf je Datei;
    das Ergebnis gehört als „lizenz_vorlagen“ in credits.json.
    """
    if not titel.startswith("File:"):
        titel = f"File:{titel}"
    antwort = _api({"action": "query", "titles": titel, "prop": "templates",
                    "tlnamespace": "10", "tllimit": "max"})
    seiten = (antwort.get("query") or {}).get("pages") or []
    if not seiten or seiten[0].get("missing"):
        raise BildFehler(f"Datei nicht gefunden: {titel}", EXIT_EINGABE)
    return sorted(v["title"].removeprefix("Template:") for v in seiten[0].get("templates") or [])


def video_fassungen(treffer: Treffer) -> list[dict[str, Any]]:
    """Die verkleinerten Fassungen eines Commons-Videos (Transcodes), kleinste zuerst.

    Commons rechnet jedes Video in mehrere Größen um (z. B. 480p VP9 als WebM). Für ein
    Hochformat-Video reicht fast immer eine davon; das Original kann Hunderte MB groß sein.
    Jede Fassung: {"url", "typ", "breite", "hoehe", "bitrate", "schluessel"}.
    """
    if not treffer.ist_video:
        raise BildFehler(f"Kein Video: {treffer.titel}", EXIT_EINGABE)
    antwort = _api({"action": "query", "titles": treffer.titel, "prop": "videoinfo",
                    "viprop": "derivatives"})
    seiten = (antwort.get("query") or {}).get("pages") or []
    infos = (seiten[0].get("videoinfo") if seiten else None) or []
    fassungen = []
    for d in (infos[0].get("derivatives") if infos else None) or []:
        if not d.get("transcodekey"):          # das Original steht auch in der Liste
            continue
        fassungen.append({"url": d["src"], "typ": d.get("type", ""), "breite": int(d.get("width") or 0),
                          "hoehe": int(d.get("height") or 0), "bitrate": int(d.get("bandwidth") or 0),
                          "schluessel": d["transcodekey"]})
    return sorted(fassungen, key=lambda f: (f["hoehe"], f["bitrate"]))


# --- Laden ------------------------------------------------------------------------------------

def dateiname(treffer: Treffer, vorschau: bool = False, url: str | None = None) -> str:
    """Sicherer Dateiname aus dem Titel: nur Kleinbuchstaben, Ziffern, Bindestriche.

    url: die tatsächlich geladene Adresse (z. B. eine Video-Fassung); die Endung kommt von dort.
    """
    stamm, _, endung = treffer.titel.removeprefix("File:").rpartition(".")
    # Umlaute ausschreiben, andere Akzente abstreifen (é → e), Rest zu Bindestrichen.
    klein = stamm.lower().translate(str.maketrans({"ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss"}))
    klein = unicodedata.normalize("NFKD", klein).encode("ascii", "ignore").decode()
    stamm = re.sub(r"[^a-z0-9]+", "-", klein).strip("-")
    if len(stamm) > 60:
        # Lange Titel einer Sammlung beginnen oft gleich: kürzen und eine Prüfsumme des
        # Titels anhängen, damit sich zwei Dateien nie gegenseitig überschreiben.
        stamm = f"{stamm[:48].rstrip('-')}-{hashlib.sha1(treffer.titel.encode()).hexdigest()[:8]}"
    if url is None:
        url = treffer.vorschau_url if vorschau and treffer.vorschau_url else treffer.url
    # Commons hängt seit 2025 utm-Parameter an die Datei-URLs; die Endung steht im Pfad davor.
    letzter = urllib.parse.urlsplit(url).path.rsplit("/", 1)[-1]
    endung = letzter.rsplit(".", 1)[-1].lower() if "." in letzter else endung.lower()
    return f"{stamm or 'datei'}.{endung}"


def lade(treffer: Treffer, ziel: Path | str, *, vorschau: bool = False,
         fassung: dict[str, Any] | None = None, personen_freigabe: str | None = None) -> Path:
    """Lädt die Datei nach ziel (Datei oder Ordner) und gibt den Pfad zurück.

    vorschau=True lädt die verkleinerte Fassung (iiurlwidth aus suche), sonst das Original.
    Beim Original prüfen wir die SHA-1 aus der API. Zu große Foto-Originale (> MAX_DATEI_BYTES)
    werden automatisch als Vorschau geladen, damit wir Commons nicht unnötig belasten.

    Videos: Die „Vorschau“ eines Videos ist nur ein JPG-Standbild. Darum gibt es für Videos nie
    einen stillen Tausch: Ein zu großes Original oder vorschau=True bricht mit BildFehler ab, und
    man lädt eine Fassung aus video_fassungen(treffer) (fassung=…).

    personen_freigabe: Pflicht bei Commons-Einschränkung „personality“. Ein Satz, warum das Foto
    passt (Person des öffentlichen Lebens in ihrer Rolle, keine Privatperson im Mittelpunkt).
    """
    if treffer.zeigt_personen and not (personen_freigabe or "").strip():
        raise BildFehler(f"{treffer.titel}: Commons markiert erkennbare Personen (personality). "
                         "Nur laden, wenn ein Mensch es begründet: personen_freigabe='…' "
                         "(Person des öffentlichen Lebens in ihrer Rolle, keine Privatperson).")
    ist_ordner = str(ziel).endswith(("/", "\\")) or Path(ziel).is_dir()
    ziel = Path(ziel)
    if fassung is not None:
        if not treffer.ist_video:
            raise BildFehler(f"Fassungen gibt es nur für Videos: {treffer.titel}", EXIT_EINGABE)
        url = fassung["url"]
    elif treffer.ist_video and (vorschau or treffer.bytes > MAX_DATEI_BYTES):
        grund = "vorschau=True wäre nur ein Standbild" if vorschau else (
            f"Original {treffer.bytes / 1e6:.0f} MB > {MAX_DATEI_BYTES / 1e6:.0f} MB")
        raise BildFehler(f"{treffer.titel}: {grund}. Eine Fassung aus video_fassungen() laden "
                         "(lade(…, fassung=…)).")
    else:
        if treffer.bytes > MAX_DATEI_BYTES and treffer.vorschau_url:
            vorschau = True
        url = treffer.vorschau_url if vorschau and treffer.vorschau_url else treffer.url
    if ist_ordner:
        ziel.mkdir(parents=True, exist_ok=True)
        ziel = ziel / dateiname(treffer, vorschau, url)
    ziel.parent.mkdir(parents=True, exist_ok=True)
    daten = _abruf(url)
    # Die SHA-1 der API gilt nur fürs Original, nicht für Vorschau oder Fassung.
    original = url == treffer.url
    if original and treffer.sha1 and hashlib.sha1(daten).hexdigest() != treffer.sha1:
        raise BildFehler(f"Prüfsumme stimmt nicht: {treffer.titel}")
    zwischen = ziel.with_name(ziel.name + ".teil")
    zwischen.write_bytes(daten)
    zwischen.replace(ziel)            # erst ganz geladen, dann umbenennen: nie halbe Dateien
    return ziel


# --- Namensnennung ----------------------------------------------------------------------------

def _lizenz_kurz(treffer: Treffer) -> str:
    if treffer.lizenz_art == "pd":
        return "gemeinfrei"
    if treffer.lizenz_art == "ohne-bekannte-rechte":
        return "ohne bekannte Rechte"
    return treffer.lizenz or treffer.lizenz_art.upper()


def _fotojahr(treffer: Treffer, jahr: str | None, objekt: str | None) -> str | None:
    """Welches Jahr im Credit steht: ein geprüftes (jahr=…), sonst die vorsichtige Schätzung.

    Ist objekt gesetzt, beschreibt das Commons-Datum den Gegenstand (Museumsstück, Gemälde,
    Buch), nicht das Foto; dann steht ohne geprüftes Jahr gar keins da.
    """
    if jahr is not None:
        return jahr or None             # jahr="" heißt: bewusst ohne Jahr
    return None if objekt else treffer.jahr


def _jahr_herkunft(fotojahr: str | None) -> str | None:
    """Woher das Jahr im Credit kommt, für credits.json."""
    if not fotojahr:
        return None
    if fotojahr.startswith("ca."):
        return "Schätzung aus dem Commons-Datum (ungenau, bitte prüfen)"
    return "Commons-Datum (Aufnahme- oder Werkdatum der Dateiseite)"


def credit_zeilen(treffer: Treffer, *, art: str | None = None, bearbeitet: bool = False,
                  jahr: str | None = None, objekt: str | None = None) -> list[str]:
    """Credit für die Credit-Ecke, in zwei kurzen Zeilen (je ≤ 864 px bei 34 px Schrift).

    Zeile 1: „Foto: Urheber, Jahr, Lizenz“; Zeile 2: Kurzlink, bei Bearbeitung mit Vermerk.
    Ein Video heißt „Video:“, eine Zeichnung „Grafik:“.
    jahr:   geprüftes Fotojahr, z. B. „ca. 1890–1906“ aus dem Katalog der Library of Congress.
    objekt: was der Gegenstand ist und wann er entstand, z. B. „Ball 1940er“: Dann steht
            „Foto: Musée national du sport (Ball 1940er), gemeinfrei“, und das Objektdatum wird
            nie als Fotojahr ausgegeben.
    """
    art = art or ("Video" if treffer.ist_video else
                  "Grafik" if treffer.mime == "image/svg+xml" else "Foto")
    teile = [f"{treffer.urheber} ({objekt})" if objekt else treffer.urheber]
    fotojahr = _fotojahr(treffer, jahr, objekt)
    if fotojahr:
        teile.append(fotojahr)
    teile.append(_lizenz_kurz(treffer))
    zeile2 = treffer.kurzlink + (", bearbeitet" if bearbeitet else "")
    return [f"{art}: {', '.join(teile)}", zeile2]


def credit_zeile(treffer: Treffer, *, art: str | None = None, bearbeitet: bool = False,
                 jahr: str | None = None, objekt: str | None = None) -> str:
    """Dieselbe Namensnennung in einer Zeile (für credits.json, Info-Blatt, Bildunterschrift)."""
    return ", ".join(credit_zeilen(treffer, art=art, bearbeitet=bearbeitet, jahr=jahr,
                                   objekt=objekt))


def credits_eintrag(treffer: Treffer, datei: str, *, bearbeitung: str | None = None,
                    art: str | None = None, jahr: str | None = None, objekt: str | None = None,
                    jahr_quelle: str | None = None, personen_freigabe: str | None = None,
                    lizenz_vorlagen: list[str] | None = None) -> dict[str, Any]:
    """Ein Eintrag für credits.json: alles, was die Lizenz verlangt, plus Abrufdatum.

    Bei CC BY-SA steht eine Bearbeitung (Duoton, Ausschnitt, Raster) wieder unter CC BY-SA
    (ShareAlike). Das vermerken wir ausdrücklich in „lizenz_bearbeitung“.

    Daten getrennt: „datum_commons“ ist der Rohtext von Commons, „datum_foto“ das Jahr im
    Credit (geprüft, wenn jahr_quelle gesetzt ist), „datum_objekt“ das Datum des abgebildeten
    Gegenstands (nur mit objekt=…).
    """
    if bearbeitung and treffer.lizenz_art == "cc-by-sa":
        lizenz_bearbeitung = (f"{treffer.lizenz} (ShareAlike: die Bearbeitung steht unter "
                              "derselben Lizenz)")
    elif bearbeitung and treffer.lizenz_art == "cc-by":
        lizenz_bearbeitung = f"Original {treffer.lizenz}; Bearbeitung durch DeepTok, Namensnennung bleibt"
    elif bearbeitung:
        lizenz_bearbeitung = "frei (Original ohne Lizenzauflage)"
    else:
        lizenz_bearbeitung = None
    return {
        "datei": datei,
        "titel": treffer.titel,
        "urheber": treffer.urheber,
        "lizenz": treffer.lizenz,
        "lizenz_art": treffer.lizenz_art,
        "lizenz_url": treffer.lizenz_url,
        "quelle": treffer.seite,
        "kurzlink": f"https://{treffer.kurzlink}",
        "original": treffer.url,
        "datum_commons": treffer.datum,
        "datum_foto": _fotojahr(treffer, jahr, objekt),
        "datum_foto_quelle": jahr_quelle or _jahr_herkunft(_fotojahr(treffer, jahr, objekt)),
        "datum_objekt": treffer.datum if objekt else None,
        "objekt": objekt,
        "abgerufen": treffer.abgerufen,
        "einschraenkungen": treffer.einschraenkungen,
        "personen_freigabe": personen_freigabe,
        "lizenz_vorlagen": lizenz_vorlagen,
        "bearbeitung": bearbeitung,
        "lizenz_bearbeitung": lizenz_bearbeitung,
        "credit_zeile": credit_zeile(treffer, art=art, bearbeitet=bool(bearbeitung), jahr=jahr,
                                     objekt=objekt),
    }


def schreibe_credits(pfad: Path | str, eintrag: dict[str, Any], *, video: str | None = None) -> Path:
    """Trägt einen Eintrag in credits.json ein (ersetzt einen alten mit derselben „datei“)."""
    pfad = Path(pfad)
    inhalt: dict[str, Any] = {"_hinweis": "Fremdquellen dieses Videos mit Urheber, Lizenz, Link "
                              "und Datum. Erzeugt von factory/werk/bilder.py.",
                              "video": video, "quellen": []}
    if pfad.exists():
        inhalt = json.loads(pfad.read_text(encoding="utf-8"))
    if video:
        inhalt["video"] = video
    quellen = [q for q in inhalt.get("quellen", []) if q.get("datei") != eintrag["datei"]]
    quellen.append(eintrag)
    inhalt["quellen"] = sorted(quellen, key=lambda q: q["datei"])
    pfad.write_text(json.dumps(inhalt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return pfad


# --- Behandlungen (Pillow) --------------------------------------------------------------------

def _pillow():
    try:
        from PIL import Image, ImageOps
    except ImportError as fehler:      # pragma: no cover - hängt von der Umgebung ab
        raise BildFehler("Pillow fehlt. In der Werkstatt-venv: pip install Pillow") from fehler
    return Image, ImageOps


def _hex(farbe: str) -> tuple[int, int, int]:
    wert = farbe.lstrip("#")
    if not re.fullmatch(r"[0-9a-fA-F]{6}", wert):
        raise BildFehler(f"Farbe bitte als #RRGGBB, nicht {farbe!r}", EXIT_EINGABE)
    return int(wert[0:2], 16), int(wert[2:4], 16), int(wert[4:6], 16)


def _oeffne(bild: Path | str, max_kante: int | None):
    Image, ImageOps = _pillow()
    roh = Image.open(bild)
    roh = ImageOps.exif_transpose(roh)           # Handyfotos: Drehung aus EXIF übernehmen
    if max_kante and max(roh.size) > max_kante:
        roh.thumbnail((max_kante, max_kante), Image.LANCZOS)
    return roh


def _speichere(bild, ziel: Path, qualitaet: int) -> Path:
    ziel.parent.mkdir(parents=True, exist_ok=True)
    if ziel.suffix.lower() in (".jpg", ".jpeg"):
        bild.convert("RGB").save(ziel, "JPEG", quality=qualitaet, optimize=True, progressive=True)
    else:
        bild.save(ziel)
    return ziel


def _ziel(bild: Path | str, ziel: Path | str | None, zusatz: str, endung: str = ".jpg") -> Path:
    if ziel:
        return Path(ziel)
    quelle = Path(bild)
    return quelle.with_name(f"{quelle.stem}-{zusatz}{endung}")


def _grau(roh, gewichte: tuple[float, float, float] | None):
    """Graustufe; gewichte=(r, g, b) wirkt wie ein Farbfilter vor dem Schwarzweißfilm.

    Beispiel Camp Nou: Mit den üblichen Gewichten (0,299/0,587/0,114) verschwindet die gelbe
    Sitz-Schrift „Més que un club“ in den blauen Rängen; mit (0,85, 0,15, 0) wie hinter einem
    Rotfilter werden die Ränge dunkel und die Schrift bleibt hell (Goldstandard, 28.10.).
    """
    _, ImageOps = _pillow()
    if gewichte is None:
        return ImageOps.grayscale(roh)
    r, g, b = gewichte
    return roh.convert("RGB").convert("L", (r, g, b, 0))


def graustufen(bild: Path | str, ziel: Path | str | None = None, *, autokontrast: float = 1.0,
               max_kante: int | None = 2160, qualitaet: int = 86,
               gewichte: tuple[float, float, float] | None = None) -> Path:
    """Sättigung 0 mit leichtem Autokontrast (cutoff in Prozent der hellsten/dunkelsten Pixel)."""
    _, ImageOps = _pillow()
    grau = _grau(_oeffne(bild, max_kante), gewichte)
    if autokontrast:
        grau = ImageOps.autocontrast(grau, cutoff=autokontrast)
    return _speichere(grau, _ziel(bild, ziel, "grau"), qualitaet)


def duoton(bild: Path | str, schatten_hex: str, licht_hex: str, ziel: Path | str | None = None, *,
           mitte_hex: str | None = None, autokontrast: float = 1.0, max_kante: int | None = 2160,
           qualitaet: int = 86, gewichte: tuple[float, float, float] | None = None) -> Path:
    """Duoton: Helligkeit des Fotos auf eine Farbrampe Schatten → (Mitte →) Licht abbilden.

    Das ist das Archiv-Prinzip „Graustufen plus eine Farbe“: Schwarz wird schatten_hex, Weiß
    wird licht_hex, alles dazwischen eine Mischung. Das Ergebnis ist eine Bearbeitung im Sinn
    der Lizenz (bei CC BY-SA wieder CC BY-SA, siehe credits_eintrag).
    """
    _, ImageOps = _pillow()
    grau = _grau(_oeffne(bild, max_kante), gewichte)
    if autokontrast:
        grau = ImageOps.autocontrast(grau, cutoff=autokontrast)
    farbig = ImageOps.colorize(grau, black=_hex(schatten_hex), white=_hex(licht_hex),
                               mid=_hex(mitte_hex) if mitte_hex else None)
    return _speichere(farbig, _ziel(bild, ziel, "duoton"), qualitaet)


def freistellen(bild: Path | str, ziel: Path | str | None = None) -> Path | None:
    """Hintergrund entfernen. Gibt den Pfad einer PNG mit Alpha zurück oder None mit Hinweis.

    Reihenfolge: 1) die HyperFrames-CLI (`hyperframes remove-background`, lokales Modell auf der
    CPU, in der Cloud-Umgebung vorhanden; am 28.10. für den Münzstapel sauberer als die
    Flutfüllung), 2) rembg, falls installiert. Fehlt beides oder scheitert es, kommt ein
    BildHinweis mit dem Ausweg (freistellen_heller_grund für Gegenstände auf hellem Grund).
    """
    import shutil
    import subprocess
    ausgabe = _ziel(bild, ziel, "frei", ".png")
    ausgabe.parent.mkdir(parents=True, exist_ok=True)
    befehl = shutil.which("hyperframes")
    if befehl:
        try:
            subprocess.run([befehl, "remove-background", str(bild), "-o", str(ausgabe)], check=True,
                           capture_output=True, timeout=600)
            if ausgabe.exists():
                return ausgabe
        except (subprocess.SubprocessError, OSError) as fehler:
            warnings.warn(f"hyperframes remove-background ist gescheitert ({fehler}); versuche rembg.",
                          BildHinweis, stacklevel=2)
    try:
        from rembg import remove          # type: ignore[import-not-found]
    except ImportError:
        warnings.warn("Weder hyperframes (remove-background) noch rembg verfügbar; nichts freigestellt. "
                      "Für Gegenstände auf hellem Grund: freistellen_heller_grund().", BildHinweis,
                      stacklevel=2)
        return None
    Image, _ = _pillow()
    try:
        ergebnis = remove(Image.open(bild))
    except Exception as fehler:           # Modell-Download oder Laufzeit; nie die Fabrik stoppen
        warnings.warn(f"rembg ist gescheitert ({fehler}); nichts freigestellt.", BildHinweis,
                      stacklevel=2)
        return None
    return _speichere(ergebnis, ausgabe, 0)


def freistellen_heller_grund(bild: Path | str, ziel: Path | str | None = None, *,
                             toleranz: int = 30, weich_px: int = 2,
                             max_kante: int | None = 2160) -> Path:
    """Freistellen ohne Modell: füllt den hellen Grund von allen vier Ecken aus (Flutfüllung).

    Taugt für Gegenstände, die auf weißem oder hellgrauem Grund fotografiert sind (Produktfoto,
    Sammlungsfoto). Alles, was von den Ecken aus erreichbar und höchstens „toleranz“ vom
    Eckton entfernt ist, wird durchsichtig; der Rand wird um weich_px weichgezeichnet.
    """
    Image, _ = _pillow()
    from PIL import ImageChops, ImageDraw, ImageFilter
    rgb = _oeffne(bild, max_kante).convert("RGB")
    maske_bild = rgb.copy()
    marke = (255, 0, 255)                 # Füllfarbe, die im Foto praktisch nicht vorkommt
    b, h = rgb.size
    for ecke in ((0, 0), (b - 1, 0), (0, h - 1), (b - 1, h - 1)):
        if maske_bild.getpixel(ecke) != marke:
            ImageDraw.floodfill(maske_bild, ecke, marke, thresh=toleranz)
    # Maske: 0 = Grund (durchsichtig), 255 = Gegenstand. Je Kanal: Abstand zur Marke > 0
    # heißt „gehört zum Gegenstand“; die drei Kanäle werden mit „heller von beiden“ vereint.
    abstand = ImageChops.difference(maske_bild, Image.new("RGB", (b, h), marke))
    kanaele = [k.point(lambda v: 255 if v else 0) for k in abstand.split()]
    alpha = ImageChops.lighter(ImageChops.lighter(kanaele[0], kanaele[1]), kanaele[2])
    if weich_px:
        alpha = alpha.filter(ImageFilter.GaussianBlur(weich_px))
    rgba = rgb.copy()
    rgba.putalpha(alpha)
    return _speichere(rgba, _ziel(bild, ziel, "frei", ".png"), 0)


# --- Kommandozeile ----------------------------------------------------------------------------

def _main(argv: list[str] | None = None) -> int:
    import argparse
    p = argparse.ArgumentParser(description="Frei lizenzierte Bilder von Wikimedia Commons")
    unter = p.add_subparsers(dest="befehl", required=True)
    s = unter.add_parser("suche", help="frei lizenzierte Treffer als JSON-Zeilen")
    s.add_argument("begriff")
    s.add_argument("--anzahl", type=int, default=10)
    s.add_argument("--art", action="append", choices=DATEIARTEN)
    s.add_argument("--lizenz", action="append", choices=FREI)
    s.add_argument("--min-breite", type=int, default=0)
    lad = unter.add_parser("lade", help="eine Datei laden und credits.json ergänzen")
    lad.add_argument("titel")
    lad.add_argument("ziel")
    lad.add_argument("--vorschau", action="store_true")
    lad.add_argument("--fassung", help="Video: Schlüssel einer Fassung, z. B. 480p.vp9.webm")
    lad.add_argument("--personen-freigabe", help="Pflicht bei Commons-Einschränkung personality")
    lad.add_argument("--credits", help="Pfad zu credits.json (wird ergänzt)")
    fa = unter.add_parser("fassungen", help="verkleinerte Fassungen eines Videos")
    fa.add_argument("titel")
    vo = unter.add_parser("vorlagen", help="Lizenz-Vorlagen der Dateiseite")
    vo.add_argument("titel")
    d = unter.add_parser("duoton", help="Duoton aus einem Foto")
    d.add_argument("bild")
    d.add_argument("ziel")
    d.add_argument("--schatten", required=True)
    d.add_argument("--licht", required=True)
    d.add_argument("--mitte")
    a = p.parse_args(argv)
    try:
        if a.befehl == "suche":
            for t in suche(a.begriff, a.lizenz or FREI, arten=a.art or ("bitmap",),
                           anzahl=a.anzahl, min_breite=a.min_breite):
                print(json.dumps({**t.als_dict(), "credit": credit_zeile(t)}, ensure_ascii=False))
        elif a.befehl == "lade":
            t = hole_datei(a.titel)
            fassung = None
            if a.fassung:
                fassung = next((f for f in video_fassungen(t) if f["schluessel"] == a.fassung), None)
                if fassung is None:
                    raise BildFehler(f"Keine Fassung {a.fassung!r}; siehe Befehl fassungen",
                                     EXIT_EINGABE)
            pfad = lade(t, a.ziel, vorschau=a.vorschau, fassung=fassung,
                        personen_freigabe=a.personen_freigabe)
            if a.credits:
                schreibe_credits(a.credits, credits_eintrag(t, str(pfad),
                                                            personen_freigabe=a.personen_freigabe))
            print(json.dumps({"datei": str(pfad), "credit": credit_zeile(t)}, ensure_ascii=False))
        elif a.befehl == "fassungen":
            for f in video_fassungen(hole_datei(a.titel)):
                print(json.dumps(f, ensure_ascii=False))
        elif a.befehl == "vorlagen":
            print(json.dumps(vorlagen(a.titel), ensure_ascii=False))
        elif a.befehl == "duoton":
            print(duoton(a.bild, a.schatten, a.licht, a.ziel, mitte_hex=a.mitte))
    except BildFehler as fehler:
        print(f"Fehler: {fehler}", file=sys.stderr)
        return fehler.code
    return 0


if __name__ == "__main__":
    sys.exit(_main())
