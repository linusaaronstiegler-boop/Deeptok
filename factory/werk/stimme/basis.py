"""Gemeinsame Teile aller Stimm-Adapter (docs/VIDEO-PIPELINE.md §4).

Jeder Adapter (elevenlabs, inworld, cartesia, azure) bietet dieselbe Funktion:

    synthese(text, stimme) -> Ergebnis(audio, format, abtastrate, wortzeiten, zeichen)

`stimme` ist der Inhalt von voices/<anbieter>.json (Modell, Stimm-ID, Format, Tempo ...).
Was hier steht, brauchen alle Adapter:

1. Aussprache: Tokens "Anzeige|Gesprochen" und ein Lexikon je Stimme.
2. Markup aus §4: *betont*, / (Pause), ?↑ (Frage). Jeder Anbieter versteht etwas anderes,
   deshalb übersetzt jeder Adapter mit eigenen Regeln; die Mechanik steckt in uebersetze().
3. HTTP mit Zeitlimit und Wiederholungen bei 429/5xx (sende()).
4. Schlüssel: aus der Umgebung, wenn gesetzt (PC). Sonst geht die Anfrage OHNE Schlüssel
   raus, weil in der Cloud der Agent-Proxy ihn als "Network secret" selbst einsetzt.

Ein Schlüssel steht nie in einer Datei, nie in einem Log und nie in einer Fehlermeldung.
"""
from __future__ import annotations

import base64
import html
import http.client
import io
import itertools
import json
import os
import random
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import wave
from dataclasses import dataclass, field
from typing import Callable

# Steht dieser Wert in voices/<anbieter>.json als Stimm-ID, ist noch keine Stimme gewählt.
PLATZHALTER = "BITTE_IM_CASTING_WAEHLEN"

# Umgebungsvariablen, die einen Schlüssel enthalten können. Nur damit Fehlermeldungen
# sie schwärzen können; gelesen werden sie in den Adaptern über auth_header().
SCHLUESSEL_VARIABLEN = ("ELEVENLABS_API_KEY", "INWORLD_API_KEY", "CARTESIA_API_KEY",
                        "AZURE_SPEECH_KEY")


# --------------------------------------------------------------------------------------------
# Ergebnis und Fehler
# --------------------------------------------------------------------------------------------

@dataclass
class Ergebnis:
    """Was jeder Adapter zurückgibt.

    wortzeiten: Liste {"wort", "start", "ende"} in Sekunden (wie werk.hoercheck),
                oder None, wenn der Anbieter keine liefert. Dann misst faster-whisper.
    zeichen:    abgerechnete Zeichen (für die Kostenkontrolle), ohne Markup-Tags.
    gesendet:   der Text, wie er an den Anbieter ging (zum Nachvollziehen der Übersetzung).
    """
    audio: bytes
    format: str                       # "mp3" oder "wav"
    abtastrate: int                   # Hz
    wortzeiten: list[dict] | None
    zeichen: int
    anbieter: str = ""
    gesendet: str = ""


class StimmFehler(Exception):
    """Fehler eines Stimm-Anbieters. status ist der HTTP-Status, falls es einen gab."""

    def __init__(self, meldung: str, status: int | None = None):
        super().__init__(schwaerze(meldung))
        self.status = status


class TextZuLang(StimmFehler):
    """Der Text überschreitet das Limit des Anbieters für eine Anfrage."""


class KeinZugang(StimmFehler):
    """401/403: Schlüssel fehlt oder ist falsch (weder Umgebungsvariable noch Network secret)."""


def schwaerze(text: str) -> str:
    """Ersetzt jeden Schlüssel aus der Umgebung durch ***, falls er in einem Text auftaucht."""
    for variable in SCHLUESSEL_VARIABLEN:
        wert = os.environ.get(variable, "").strip()
        if len(wert) >= 6:
            text = text.replace(wert, "***")
    return text


# --------------------------------------------------------------------------------------------
# Aussprache: "Anzeige|Gesprochen" und Lexikon
# --------------------------------------------------------------------------------------------

# Zeichen, die vor einem Token stehen dürfen, ohne zur Anzeige zu gehören: "*45|fünfundvierzig*"
# soll betont "fünfundvierzig" sprechen. Das "*" vorne gehört zum Markup, nicht zur Anzeige.
_VORSATZ = re.compile(r"^[*„\"'‚(\[]*")


def loese_aussprache(text: str) -> str:
    """'Barcelona|Barsselona zahlte 45|fünfundvierzig' -> 'Barsselona zahlte fünfundvierzig'.

    Ein Token "Anzeige|Gesprochen" trennt Untertitel und Aussprache (CLAUDE.md). Die Stimme
    bekommt immer die rechte Seite. Markup-Zeichen davor und Satzzeichen dahinter bleiben.
    """
    teile = re.split(r"(\s+)", text)          # Leerraum behalten, damit Absätze bleiben
    for i, token in enumerate(teile):
        if "|" not in token:
            continue
        vorsatz = _VORSATZ.match(token).group()
        rest = token[len(vorsatz):]
        anzeige, gesprochen = rest.split("|", 1)
        # "*Barcelona*|Barsselona": Das schließende Sternchen hängt an der Anzeige, gehört aber
        # zur Betonung. Fiele es mit der Anzeige weg, würde *Barsselona bis zum nächsten "*"
        # betont. Deshalb wandert es auf die gesprochene Seite (vor ein Satzzeichen am Ende).
        if anzeige.endswith("*") and "*" not in gesprochen:
            kern, satzzeichen = re.fullmatch(r"(.*?)([.,;:!?…\"“”'»)\]]*)", gesprochen).groups()
            gesprochen = f"{kern}*{satzzeichen}"
        teile[i] = vorsatz + gesprochen
    return "".join(teile)


def wende_lexikon_an(text: str, lexikon: dict[str, str] | None) -> str:
    """Ersetzt ganze Wörter laut Lexikon der Stimme, z. B. {"Barcelona": "Barsselona"}.

    Das Lexikon gehört zur Stimme (voices/<anbieter>.json), nicht zum Skript: Eine
    Aussprache-Schreibung, die bei einer Stimme hilft, kann eine andere verschlechtern.
    Groß/Klein zählt, und nur ganze Wörter: "Barcelonas" bleibt unberührt.
    """
    if not lexikon:
        return text
    return _lexikon_muster(lexikon, r"\w").sub(lambda m: lexikon[m.group(0)], text)


def _lexikon_muster(lexikon: dict[str, str], grenze: str) -> re.Pattern:
    """Ein einziges Suchmuster für alle Einträge, längste zuerst ("Bayern München" vor "Bayern").

    Ein Durchgang statt einer Schleife: Sonst würde das Ergebnis einer Ersetzung von der
    nächsten Regel noch einmal ersetzt ("Bayern Münchn" -> "Baijern Münchn").
    """
    alternativen = "|".join(re.escape(w) for w in sorted(lexikon, key=len, reverse=True))
    return re.compile(rf"(?<![{grenze}])(?:{alternativen})(?![{grenze}])")


def lexikon_als_tokens(text: str, lexikon: dict[str, str] | None) -> str:
    """Für den Hör-Check: Lexikon-Ersetzungen als "Anzeige|Gesprochen"-Tokens schreiben.

    werk.hoercheck akzeptiert dann beide Schreibweisen. Mehrwortige Einträge werden normal
    ersetzt, weil ein Token kein Leerzeichen enthalten darf.
    """
    if not lexikon:
        return text

    def ersetze(m: re.Match) -> str:
        wort, ersatz = m.group(0), lexikon[m.group(0)]
        return f"{wort}|{ersatz}" if " " not in wort and " " not in ersatz else ersatz
    return _lexikon_muster(lexikon, r"\w|").sub(ersetze, text)


def sprechfassung(text: str, stimme: dict) -> str:
    """Erst die Tokens auflösen, dann das Lexikon der Stimme. Das Markup bleibt stehen."""
    return wende_lexikon_an(loese_aussprache(text), stimme.get("lexikon"))


# --------------------------------------------------------------------------------------------
# Markup aus §4: *betont*, / (Pause), ?↑ (Frage)
# --------------------------------------------------------------------------------------------

# Betont ist "*wort*" oder "*mehrere Wörter*": Direkt nach dem öffnenden und direkt vor dem
# schließenden Sternchen steht kein Leerraum, und außen hängt kein Buchstabe dran.
# Ein Malzeichen wie in "5 * 3" (Leerraum dahinter) öffnet deshalb keine Betonung.
_BETONT = re.compile(r"(?<![\w*])\*(?=\S)([^*\n]*?[^*\s])\*(?![\w*])")
# Eine Pause ist ein "/" mit Leerraum (oder Textende) dahinter und Leerraum, Satzzeichen oder
# Textanfang davor. "km/h" oder "1/2" sind deshalb KEINE Pausen, "Frage?↑/ Weiter" schon.
_PAUSE = re.compile(r"(?:(?<=[\s.,;:!?…])|^)/(?=\s|$)")

# Für Anbieter, die Text zwischen zwei Schrägstrichen als Lautschrift (IPA) lesen
# (ElevenLabs v4, Inworld): Einheiten ausschreiben, statt den "/" stehen zu lassen.
# Physik- und Mathe-Karten (Klasse 10) haben viele Einheiten; "3 m/s und 10 km/h" in einem Satz wäre sonst "/s und 10 km/" als IPA.
EINHEITEN = {
    "km/h": "Kilometer pro Stunde", "km/s": "Kilometer pro Sekunde",
    "m/s²": "Meter pro Quadratsekunde", "m/s": "Meter pro Sekunde",
    "kg/m³": "Kilogramm pro Kubikmeter", "g/cm³": "Gramm pro Kubikzentimeter",
    "mol/l": "Mol pro Liter", "€/kWh": "Euro pro Kilowattstunde",
}
_EINHEIT = re.compile(
    r"(?<![A-Za-zÄÖÜäöüß])(?:" + "|".join(re.escape(e) for e in sorted(EINHEITEN, key=len, reverse=True))
    + r")(?![A-Za-zÄÖÜäöüß0-9²³/])")


def betone_gross(wort: str) -> str:
    """ElevenLabs v4 und Inworld TTS-2: Großbuchstaben verstärken die Betonung (laut Doku)."""
    return wort.upper()


def betone_nicht(wort: str) -> str:
    """Anbieter ohne Betonungs-Steuerung: nur die Sternchen fallen weg."""
    return wort


def betonung_nach_name(name: str) -> Callable[[str], str]:
    """'grossbuchstaben' oder 'entfernen' (Wert "betonung" in voices/<anbieter>.json)."""
    if name == "grossbuchstaben":
        return betone_gross
    if name == "entfernen":
        return betone_nicht
    raise StimmFehler(f"Unbekannte Betonungsart: {name!r} (erlaubt: grossbuchstaben, entfernen)")


def pause_als_komma(vorher: str) -> str:
    """Rückfall ohne Pausen-Tag: ein Komma, außer es steht schon ein Satzzeichen davor."""
    return "" if re.search(r"[.,;:!?…]\s*$", vorher) else ","


def ohne_schraegstrich(text: str) -> str:
    """Ersetzt jeden "/", der KEINE Pause ist, durch gesprochene Wörter.

    Reihenfolge: bekannte Einheiten ("km/h" -> "Kilometer pro Stunde"), Saisons ("2014/15"
    -> "2014 15"), andere Zahl/Zahl als Bruch ("1/2" -> "1 durch 2"), sonst ein Leerzeichen
    ("und/oder" -> "und oder"). Wer es genauer will, schreibt ein Token: "1/2|einhalb".
    """
    text = _EINHEIT.sub(lambda m: EINHEITEN[m.group(0)], text)
    text = re.sub(r"\b(\d{4})/(\d{2})\b", r"\1 \2", text)
    text = re.sub(r"(?<=\d)\s*/\s*(?=\d)", " durch ", text)
    return re.sub(r"\s*/\s*", " ", text)


def uebersetze(text: str, *, betont: Callable[[str], str],
               pause: Callable[[int, str], str], frage: str = "?",
               schraegstrich: Callable[[str], str] | None = None) -> str:
    """Übersetzt das gemeinsame Markup in die Sprache eines Anbieters.

    betont(wort)          -> Ersatz für *wort*
    pause(nummer, vorher) -> Ersatz für "/", nummer zählt ab 0 (für Obergrenzen wie
                             "höchstens 20 Pausen"), vorher ist der Text bis zur Pause
    frage                 -> Ersatz für "?↑"
    schraegstrich(stueck) -> behandelt die übrigen "/" im Text zwischen zwei Pausen
                             (ohne_schraegstrich für Anbieter mit IPA-Schrägstrichen)

    Am Ende bleibt kein "/" als Pause übrig. Ein "/" in "km/h" oder "1/2" ist keine Pause und
    bleibt stehen, außer `schraegstrich` ersetzt ihn. Das ist wichtig: ElevenLabs v4 und
    Inworld lesen Text zwischen zwei Schrägstrichen als Lautschrift (IPA). Das Netz wirkt
    nur auf den Text zwischen den Pausen, damit die eigenen Tags ("<break ... />") heil bleiben.
    """
    text = text.replace("?↑", frage).replace("↑", "")
    text = _BETONT.sub(lambda m: betont(m.group(1)), text)
    # Übrige Sternchen: zwischen zwei Zahlen ein Malzeichen ("5 * 3" -> "5 mal 3"),
    # sonst ein Tippfehler im Markup. Roh soll keines beim Anbieter ankommen.
    text = re.sub(r"(?<=\d)\s*\*\s*(?=\d)", " mal ", text).replace("*", "")

    zaehler = itertools.count()
    stuecke = _PAUSE.split(text)
    if schraegstrich:
        stuecke = [schraegstrich(s) for s in stuecke]
    ergebnis = stuecke[0]
    for stueck in stuecke[1:]:
        # Eine Pause ganz am Anfang hat nichts, wovon sie trennen könnte: weglassen.
        ersatz = pause(next(zaehler), ergebnis) if ergebnis.strip() else ""
        ergebnis = ergebnis.rstrip() + ersatz + " " + stueck.lstrip()
    # Doppelte Leerzeichen und " ," aufräumen, Zeilenumbrüche behalten.
    ergebnis = re.sub(r"[ \t]{2,}", " ", ergebnis)
    ergebnis = re.sub(r" +([,.;:!?])", r"\1", ergebnis)
    return ergebnis.strip()


def reiner_text(text: str) -> str:
    """Markup entfernen, "Anzeige|Gesprochen" stehen lassen: der Soll-Text für den Hör-Check."""
    return uebersetze(text, betont=betone_nicht, pause=lambda _n, vorher: pause_als_komma(vorher))


_TAG = re.compile(r"<[^>]+>")


def zaehle_zeichen(text: str) -> int:
    """Abrechenbare Zeichen: Text ohne SSML-Tags; jede Pause zählt als 1 Zeichen
    (so rechnet Cartesia, die anderen zählen Tags gar nicht oder ähnlich)."""
    pausen = len(re.findall(r"<break\b", text))
    # html.unescape: "&amp;" im SSML ist für den Anbieter ein einziges Zeichen "&".
    return len(html.unescape(_TAG.sub("", text))) + pausen


# --------------------------------------------------------------------------------------------
# Schlüssel
# --------------------------------------------------------------------------------------------

def schluessel(variable: str) -> str | None:
    wert = os.environ.get(variable, "").strip()
    return wert or None


def auth_header(name: str, variable: str, prefix: str = "") -> dict[str, str]:
    """Header mit Schlüssel, wenn die Umgebungsvariable gesetzt ist (PC), sonst leer.

    Leer heißt: In der Cloud setzt der Agent-Proxy den Header selbst ein, sobald für den
    Host ein Network secret angelegt ist. Der Code sieht den Schlüssel dort nie.
    """
    wert = schluessel(variable)
    if wert and os.environ.get("CLAUDE_CODE_REMOTE") and variable not in _GEWARNT:
        # Eine Umgebungsvariable der Cloud-Umgebung kann jeder lesen, der die Umgebung nutzt.
        # Funktionieren würde es, aber der Schlüssel gehört dort in ein Network secret.
        _GEWARNT.add(variable)
        print(f"Warnung: {variable} ist in der Cloud als Umgebungsvariable gesetzt. Dort sieht "
              "ihn jeder, der die Umgebung nutzt. Besser löschen und als Network secret anlegen "
              "(Docstring des Adapters).", file=sys.stderr)
    return {name: f"{prefix}{wert}"} if wert else {}


_GEWARNT: set[str] = set()


# --------------------------------------------------------------------------------------------
# HTTP mit Wiederholungen
# --------------------------------------------------------------------------------------------

@dataclass
class Anfrage:
    methode: str
    url: str
    header: dict[str, str] = field(default_factory=dict)
    body: bytes | None = None
    zeitlimit: float = 120.0

    def json(self) -> dict:
        """Body als JSON (für Tests und Fehlersuche)."""
        return json.loads(self.body or b"{}")


@dataclass
class Antwort:
    status: int
    header: dict[str, str]
    body: bytes

    def json(self) -> dict:
        try:
            return json.loads(self.body)
        except ValueError as e:
            raise StimmFehler(f"Antwort ist kein JSON: {self.body[:200]!r}", self.status) from e


def _urllib_transport(anfrage: Anfrage) -> Antwort:
    """Die echte Leitung. urllib folgt HTTPS_PROXY und SSL_CERT_FILE aus der Umgebung,
    in der Cloud also dem Agent-Proxy samt dessen Zertifikat."""
    req = urllib.request.Request(anfrage.url, data=anfrage.body, headers=anfrage.header,
                                 method=anfrage.methode)
    try:
        with urllib.request.urlopen(req, timeout=anfrage.zeitlimit) as r:
            return Antwort(r.status, dict(r.headers.items()), r.read())
    except urllib.error.HTTPError as e:
        return Antwort(e.code, dict(e.headers.items()) if e.headers else {}, e.read() or b"")


# Austauschbar, damit Tests ohne Netz laufen: Sie setzen TRANSPORT auf eine Attrappe
# und SCHLAFEN auf eine Funktion, die nur mitschreibt.
TRANSPORT: Callable[[Anfrage], Antwort] = _urllib_transport
SCHLAFEN: Callable[[float], None] = time.sleep


def _wartezeit(versuch: int, retry_after: str | None, basis_s: float, max_s: float) -> float:
    """Exponentielles Warten mit Zufall (Inworld-Doku empfiehlt genau das): 1, 2, 4 s ...

    Der Zufallsanteil verhindert, dass parallele Läufe im Gleichtakt wiederkommen.
    Nennt der Server "Retry-After" in Sekunden, gilt sein Wert (höchstens 60 s).
    """
    if retry_after:
        try:
            return min(max(float(retry_after), 0.0), 60.0)
        except ValueError:
            pass                                   # Datumsform: ignorieren, selbst rechnen
    return min(basis_s * 2 ** versuch, max_s) + random.uniform(0, basis_s / 2)


def sende(anfrage: Anfrage, wiederholungen: int = 3, basis_s: float = 1.0,
          max_s: float = 20.0) -> Antwort:
    """Schickt eine Anfrage; bei 429, 5xx oder Netzfehler bis zu `wiederholungen` weitere Male.

    Andere Fehler (400, 401, 422 ...) werden nicht wiederholt: Dieselbe Anfrage scheitert
    dort jedes Mal gleich, und jeder Versuch kann Zeichen kosten.
    Gibt die letzte Antwort zurück; ob sie gut ist, prüft pruefe_antwort().

    Netzfehler gibt es in zwei Sorten:
    - VOR dem Absenden (DNS, Verbindung abgelehnt): urllib meldet URLError. Der Anbieter hat
      nichts gesehen, also auch nichts berechnet -> wiederholen ist gratis.
    - NACH dem Absenden (Lese-Timeout, abgerissene Übertragung = IncompleteRead, Verbindung
      zurückgesetzt): Bei einer Vertonung (POST) kann der Anbieter schon gerechnet und
      abgerechnet haben. Dann gibt es nur EINEN weiteren Versuch, damit ein wackeliger Proxy
      nicht viermal kostet. Abfragen (GET) kosten nichts und dürfen alle Versuche nutzen.
    """
    host = urllib.parse.urlsplit(anfrage.url).hostname or anfrage.url
    nach_senden_erlaubt = wiederholungen if anfrage.methode == "GET" else 1
    nach_senden = 0
    for versuch in range(wiederholungen + 1):
        letzter = versuch == wiederholungen
        try:
            antwort = TRANSPORT(anfrage)
        except urllib.error.URLError as e:                 # vor dem Absenden (siehe oben)
            fehler, gesendet = e, False
        except (TimeoutError, OSError, http.client.HTTPException) as e:   # nach dem Absenden
            fehler, gesendet = e, True
        else:
            fehler = None
        if fehler is not None:
            nach_senden += gesendet
            if letzter or nach_senden > nach_senden_erlaubt:
                grund = getattr(fehler, "reason", None) or repr(fehler)
                raise StimmFehler(f"Netzfehler bei {host} nach {versuch + 1} Versuchen: {grund}") from fehler
            SCHLAFEN(_wartezeit(versuch, None, basis_s, max_s))
            continue
        if (antwort.status == 429 or antwort.status >= 500) and not letzter:
            SCHLAFEN(_wartezeit(versuch, _kopf(antwort.header, "Retry-After"), basis_s, max_s))
            continue
        return antwort
    raise AssertionError("unerreichbar")          # die Schleife endet immer mit return/raise


def _kopf(header: dict[str, str], name: str) -> str | None:
    """Header-Namen sind nicht case-sensitiv."""
    for k, v in header.items():
        if k.lower() == name.lower():
            return v
    return None


def pruefe_antwort(antwort: Antwort, anbieter: str, hinweis_schluessel: str) -> Antwort:
    """Wirft einen verständlichen Fehler, wenn der Status nicht 2xx ist."""
    if 200 <= antwort.status < 300:
        return antwort
    auszug = antwort.body[:300].decode("utf-8", "replace")
    if antwort.status in (401, 403):
        raise KeinZugang(f"{anbieter}: HTTP {antwort.status}, kein gültiger Schlüssel. "
                         f"{hinweis_schluessel} Antwort: {auszug}", antwort.status)
    raise StimmFehler(f"{anbieter}: HTTP {antwort.status}: {auszug}", antwort.status)


def json_anfrage(methode: str, url: str, header: dict[str, str], daten: dict | None,
                 zeitlimit: float) -> Anfrage:
    body = None if daten is None else json.dumps(daten, ensure_ascii=False).encode("utf-8")
    kopf = {"Accept": "application/json", **header}
    if body is not None:
        kopf["Content-Type"] = "application/json"
    return Anfrage(methode, url, kopf, body, zeitlimit)


# --------------------------------------------------------------------------------------------
# Hilfen für Stimmen und Audio
# --------------------------------------------------------------------------------------------

def stimm_id(stimme: dict) -> str:
    """Die gepinnte Stimm-ID. Mit dem Platzhalter wird nicht synthetisiert: Das Casting
    muss erst eine Stimme wählen (sonst würde der Anbieter irgendeine Standardstimme nehmen)."""
    sid = (stimme.get("stimm_id") or "").strip()
    if not sid or sid == PLATZHALTER:
        raise StimmFehler(f"{stimme.get('anbieter', '?')}: keine Stimm-ID gewählt "
                          f"(voices/{stimme.get('anbieter', '?')}.json: stimm_id = {PLATZHALTER}). "
                          "Erst casten, dann pinnen.")
    return sid


def pruefe_laenge(text: str, grenze: int | None, anbieter: str, einheit: str = "Zeichen",
                  laenge: int | None = None) -> None:
    laenge = len(text) if laenge is None else laenge
    if grenze and laenge > grenze:
        raise TextZuLang(f"{anbieter}: Text hat {laenge} {einheit}, erlaubt sind {grenze} je "
                         "Anfrage. In 2–3 Absätze teilen und mit Nachbartext vertonen (§4).")


def woerter_aus_zeichen(zeichen: list[str], starts: list[float], enden: list[float]) -> list[dict]:
    """Zeichen-Zeitstempel (ElevenLabs) zu Wort-Zeitstempeln zusammenfassen.

    Ein Wort endet am Leerzeichen. Satzzeichen am Rand gehören nicht zum Wort; ein Wort
    nur aus Satzzeichen ("…") fällt weg.
    """
    woerter: list[dict] = []
    puffer: list[tuple[str, float, float]] = []

    def schliessen() -> None:
        if not puffer:
            return
        wort = "".join(z for z, _, _ in puffer)
        kern = wort.strip(".,;:!?…\"'„“‚‘()[]-–—")
        if kern:
            woerter.append({"wort": kern, "start": round(puffer[0][1], 3),
                            "ende": round(puffer[-1][2], 3)})
        puffer.clear()

    for z, s, e in zip(zeichen, starts, enden):
        if z.isspace():
            schliessen()
        else:
            puffer.append((z, float(s), float(e)))
    schliessen()
    return woerter


def woerter_aus_listen(woerter: list[str], starts: list[float], enden: list[float]) -> list[dict]:
    """Parallele Listen (Inworld, Cartesia) in {"wort","start","ende"} umbauen.
    Tags wie <break .../> tauchen bei manchen Anbietern als "Wort" auf; die fallen weg."""
    ergebnis = []
    for w, s, e in zip(woerter, starts, enden):
        kern = w.strip().strip(".,;:!?…\"'„“‚‘()[]-–—")
        if kern and not kern.startswith("<"):
            ergebnis.append({"wort": kern, "start": round(float(s), 3), "ende": round(float(e), 3)})
    return ergebnis


def b64(text: str) -> bytes:
    return base64.b64decode(text)


def pcm_zu_wav(pcm: bytes, abtastrate: int, kanaele: int = 1, breite: int = 2) -> bytes:
    """Rohes 16-bit-PCM in eine WAV-Datei verpacken (Cartesia liefert mit Zeitstempeln nur PCM)."""
    puffer = io.BytesIO()
    with wave.open(puffer, "wb") as w:
        w.setnchannels(kanaele)
        w.setsampwidth(breite)
        w.setframerate(abtastrate)
        w.writeframes(pcm)
    return puffer.getvalue()


# MPEG-1/2/2.5 Layer III: Abtastraten-Tabelle je Version (Index aus dem Frame-Kopf).
_MP3_RATEN = {3: (44100, 48000, 32000), 2: (22050, 24000, 16000), 0: (11025, 12000, 8000)}


def mp3_abtastrate(daten: bytes) -> int | None:
    """Liest die echte Abtastrate aus dem ersten MP3-Frame. Anbieter dürfen eine gewünschte
    Rate auf ihre native Rate kappen (Inworld schreibt das so); G4 will ≥ 44,1 kHz sehen."""
    pos = 0
    if daten[:3] == b"ID3" and len(daten) >= 10:            # ID3v2-Kopf überspringen
        groesse = (daten[6] << 21) | (daten[7] << 14) | (daten[8] << 7) | daten[9]
        pos = 10 + groesse
    for i in range(pos, min(len(daten) - 3, pos + 64 * 1024)):
        if daten[i] == 0xFF and (daten[i + 1] & 0xE0) == 0xE0:
            version = (daten[i + 1] >> 3) & 0x3
            layer = (daten[i + 1] >> 1) & 0x3            # 0 ist "reserviert": kein echter Kopf
            bitrate = daten[i + 2] >> 4                  # 0xF ist ungültig
            index = (daten[i + 2] >> 2) & 0x3
            if version in _MP3_RATEN and layer and bitrate != 0xF and index < 3:
                return _MP3_RATEN[version][index]
    return None


def wav_abtastrate(daten: bytes) -> int | None:
    try:
        with wave.open(io.BytesIO(daten), "rb") as w:
            return w.getframerate()
    except (wave.Error, EOFError):
        return None
