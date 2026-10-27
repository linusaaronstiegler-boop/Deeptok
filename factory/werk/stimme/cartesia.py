"""Stimm-Adapter Cartesia (Sonic 3.6), geprüft gegen die offizielle Doku am 27.10.2026.

Endpoint:  POST https://api.cartesia.ai/tts/sse   (Server-Sent Events, mit Wort-Zeitstempeln)
           Pflicht-Header "Cartesia-Version: 2026-08-14" (einziger erlaubter Wert laut API-Referenz).
Body:      {"model_id", "transcript", "voice": {"id"}, "language": "de",
           "output_format": {"container": "raw", "encoding": "pcm_s16le", "sample_rate": 44100},
           "add_timestamps": true, "generation_config": {"speed"}}
Antwort:   Ereignisse "data: {json}". type "chunk" -> data = Base64-PCM, type "timestamps" ->
           word_timestamps {"words", "start", "end"}, type "done", type "error".
Warum SSE und nicht /tts/bytes? Nur SSE (und WebSocket) liefert Wort-Zeitstempel, und SSE gibt
nur rohes PCM aus. Wir verpacken es hier selbst als WAV (44,1 kHz, 16 bit, mono).
Modell:    "sonic-3.6-2026-08-27" ist der datierte Stand; die Doku empfiehlt datierte Modelle
           für die Produktion, damit sich die Stimme nicht unbemerkt ändert.
Markup:    SSML-artige Tags: <break time="400ms"/>, <speed ratio=".."/>, <volume ratio=".."/>,
           <emotion value=".."/> (Emotionen nur Englisch, experimentell). Betonung kennt Sonic
           nicht; die Sternchen fallen weg. Zu viele Pausen hintereinander können laut Doku
           Halluzinationen auslösen.
Kosten:    ca. 1 Credit je Zeichen; jede Pause zählt als 1 Zeichen. Den Kontostand zeigt nur das
           Portal (die Usage-API braucht einen Admin-Schlüssel) -> restguthaben() gibt None.

Schlüssel am PC: Umgebungsvariable CARTESIA_API_KEY (beginnt mit "sk_car_").

Network secret in der Cloud (claude.ai/code -> Umgebung -> Edit -> Network secrets -> Add secret):
    Name:              Cartesia
    Secret type:       Bearer (Standard lassen)
    Allowed websites:  api.cartesia.ai
    Custom headers:    Name "Authorization", Prefix "Bearer" (so lassen),
                       Value = der API-Schlüssel
Den Header "Cartesia-Version" setzt der Code selbst; er ist kein Geheimnis.
"""
from __future__ import annotations

import json
import urllib.parse

from .basis import (Anfrage, Ergebnis, StimmFehler, auth_header, b64, betonung_nach_name,
                    json_anfrage, pcm_zu_wav, pruefe_antwort, sende, sprechfassung, stimm_id,
                    uebersetze, woerter_aus_listen, zaehle_zeichen)

ANBIETER = "cartesia"
HOST = "api.cartesia.ai"
VARIABLE = "CARTESIA_API_KEY"
API_VERSION = "2026-08-14"
HINWEIS = ("Am PC CARTESIA_API_KEY setzen; in der Cloud ein Network secret für api.cartesia.ai "
           "mit Header Authorization und Prefix Bearer anlegen.")


def _header() -> dict[str, str]:
    return {"Cartesia-Version": API_VERSION, **auth_header("Authorization", VARIABLE, "Bearer ")}


def text_fuer_anbieter(text: str, stimme: dict) -> str:
    ms = int(stimme.get("pause_ms", 400))
    return uebersetze(sprechfassung(text, stimme),
                      betont=betonung_nach_name(stimme.get("betonung", "entfernen")),
                      pause=lambda _n, _vorher: f' <break time="{ms}ms"/>', frage="?")


def anfrage(text: str, stimme: dict) -> Anfrage:
    sid = stimm_id(stimme)
    gesendet = text_fuer_anbieter(text, stimme)
    daten: dict = {
        "model_id": stimme["modell"],
        "transcript": gesendet,
        "voice": {"id": sid},
        "output_format": {"container": "raw", "encoding": "pcm_s16le",
                          "sample_rate": int(stimme.get("abtastrate", 44100))},
        "add_timestamps": True,
    }
    if stimme.get("sprache"):
        daten["language"] = stimme["sprache"]       # "language" ODER "locale", nie beide (400)
    if stimme.get("tempo") is not None:
        daten["generation_config"] = {"speed": stimme["tempo"]}     # 0.6 bis 1.5
    a = json_anfrage("POST", f"https://{HOST}/tts/sse", _header(), daten,
                     stimme.get("zeitlimit_s", 120))
    a.header["Accept"] = "text/event-stream"
    return a


def lies_sse(body: bytes) -> tuple[bytes, list[dict]]:
    """Zerlegt den Ereignis-Strom: Audio-Stücke aneinanderhängen, Zeitstempel sammeln.

    Jedes Ereignis ist eine Zeile "data: {json}", Ereignisse trennt eine Leerzeile.
    """
    pcm = bytearray()
    woerter: list[str] = []
    starts: list[float] = []
    enden: list[float] = []
    for block in body.decode("utf-8").replace("\r\n", "\n").split("\n\n"):
        zeilen = [z[5:].lstrip() for z in block.split("\n") if z.startswith("data:")]
        if not zeilen:
            continue
        ereignis = json.loads("\n".join(zeilen))
        art = ereignis.get("type")
        if art == "chunk" and ereignis.get("data"):
            pcm += b64(ereignis["data"])
        elif art == "timestamps" and ereignis.get("word_timestamps"):
            wt = ereignis["word_timestamps"]
            woerter += wt.get("words", [])
            starts += wt.get("start", [])
            enden += wt.get("end", [])
        elif art == "error":
            raise StimmFehler(f"{ANBIETER}: {ereignis.get('title', '')}: "
                              f"{ereignis.get('message', '')}", ereignis.get("status_code"))
        elif art == "done":
            break
    return bytes(pcm), woerter_aus_listen(woerter, starts, enden)


def synthese(text: str, stimme: dict, vorher: str | None = None,
             nachher: str | None = None) -> Ergebnis:
    """vorher/nachher: Der SSE-Endpoint kennt keine Fortsetzungen; sie werden ignoriert."""
    a = anfrage(text, stimme)
    antwort = pruefe_antwort(sende(a), ANBIETER, HINWEIS)
    pcm, wortzeiten = lies_sse(antwort.body)
    if not pcm:
        raise StimmFehler(f"{ANBIETER}: Antwort ohne Audio")
    rate = a.json()["output_format"]["sample_rate"]
    gesendet = a.json()["transcript"]
    return Ergebnis(audio=pcm_zu_wav(pcm, rate), format="wav", abtastrate=rate,
                    wortzeiten=wortzeiten or None, zeichen=zaehle_zeichen(gesendet),
                    anbieter=ANBIETER, gesendet=gesendet)


def restguthaben(stimme: dict | None = None) -> int | None:
    """Kein Kontostand mit normalem API-Schlüssel abrufbar; Stand auf play.cartesia.ai ablesen."""
    return None


def stimmen(stimme: dict | None = None, sprache: str = "de") -> list[dict]:
    """Stimmen für eine Sprache (GET /voices?language=de). Kostet nichts; Zugangsprobe."""
    abfrage = urllib.parse.urlencode({"language": sprache, "limit": 100})
    a = json_anfrage("GET", f"https://{HOST}/voices?{abfrage}", _header(), None, 30)
    daten = pruefe_antwort(sende(a), ANBIETER, HINWEIS).json()
    return [{"id": v["id"], "name": v.get("name", ""), "geschlecht": v.get("gender") or ""}
            for v in daten.get("data", [])]
