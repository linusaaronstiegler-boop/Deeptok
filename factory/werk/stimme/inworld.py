"""Stimm-Adapter Inworld (Realtime TTS-2), geprüft gegen die offizielle Doku am 27.10.2026.

Endpoint:  POST https://api.inworld.ai/tts/v1/voice
Body:      {"text", "voiceId", "modelId": "inworld-tts-2", "language": "de" (BCP-47; ohne das Feld
           rät Inworld die Sprache aus dem Text, Lehnwörter wie "Cashflow" könnten sie kippen),
           "audioConfig": {"audioEncoding": "MP3", "sampleRateHertz", "bitRate", "speakingRate"},
           "timestampType": "WORD", "deliveryMode": "STABLE"|"BALANCED"|"CREATIVE",
           "synthesisContext": {"previousRequests": [{"text"}]}}
Nachbartext: nur VORHER (synthesisContext.previousRequests, bis 5 Einträge, zusammen höchstens
           2.000 Zeichen, nicht abgerechnet). Einen Platz für den Text DANACH gibt es nicht.
Antwort:   JSON {"audioContent" (Base64), "usage": {"processedCharactersCount"},
           "timestampInfo": {"wordAlignment": {"words", "wordStartTimeSeconds", "wordEndTimeSeconds"}}}
Limits:    höchstens 2.000 UTF-16-Zeichen je Anfrage; Deutsch ist Tier 1.
Markup:    Pausen als SSML <break time="400ms" /> (höchstens 20 je Anfrage, je ≤ 10 s; danach Komma).
           Betonung über Großbuchstaben ("I told you NOT to ..."). Regie-Anweisungen in eckigen
           Klammern ([speak calmly]) nur auf Englisch; sie gelten bis zur nächsten Anweisung.
           Lautschrift (IPA) steht zwischen Schrägstrichen; deshalb wird jeder "/" ersetzt
           (Pausen durch <break>, km/h durch "Kilometer pro Stunde": basis.ohne_schraegstrich).
Kosten:    Kein Kontostand über die API (die Usage-API ist experimentell und erst ab dem
           Builder-Plan). restguthaben() gibt deshalb None zurück.

Schlüssel am PC: Umgebungsvariable INWORLD_API_KEY = die Base64-Zeichenkette aus dem Portal
(platform.inworld.ai -> API Keys). Sie wird NICHT noch einmal kodiert.

Network secret in der Cloud (claude.ai/code -> Umgebung -> Edit -> Network secrets -> Add secret):
    Name:              Inworld
    Secret type:       Bearer (Standard lassen)
    Allowed websites:  api.inworld.ai
    Custom headers:    Name "Authorization", Prefix "Basic" (statt "Bearer"),
                       Value = die Base64-Zeichenkette aus dem Portal
"""
from __future__ import annotations

import urllib.parse

from .basis import (Anfrage, Ergebnis, auth_header, b64, betonung_nach_name, json_anfrage,
                    mp3_abtastrate, ohne_schraegstrich, pause_als_komma, pruefe_antwort,
                    pruefe_laenge, sende, sprechfassung, stimm_id, uebersetze, wav_abtastrate,
                    woerter_aus_listen, zaehle_zeichen)

ANBIETER = "inworld"
HOST = "api.inworld.ai"
VARIABLE = "INWORLD_API_KEY"
MAX_PAUSEN = 20            # Doku: Break-Tags nach dem 20. werden ignoriert
MAX_ZEICHEN = 2000         # Doku: 2.000 UTF-16-Codeeinheiten je Anfrage (Endpoint ohne Streaming)
MAX_KONTEXT = 2000         # Doku: previousRequests zusammen höchstens 2.000 Zeichen
HINWEIS = ("Am PC INWORLD_API_KEY setzen; in der Cloud ein Network secret für api.inworld.ai "
           "mit Header Authorization und Prefix Basic anlegen.")


def _header() -> dict[str, str]:
    return auth_header("Authorization", VARIABLE, prefix="Basic ")


def _pause(stimme: dict):
    ms = min(int(stimme.get("pause_ms", 400)), 10000)

    def pause(nummer: int, vorher: str) -> str:
        # Ab der 21. Pause ignoriert Inworld die Tags; dann lieber ein Komma als gar nichts.
        return f' <break time="{ms}ms" />' if nummer < MAX_PAUSEN else pause_als_komma(vorher)
    return pause


def text_fuer_anbieter(text: str, stimme: dict) -> str:
    gesendet = uebersetze(sprechfassung(text, stimme),
                          betont=betonung_nach_name(stimme.get("betonung", "grossbuchstaben")),
                          pause=_pause(stimme), frage="?", schraegstrich=ohne_schraegstrich)
    anweisung = (stimme.get("anweisung") or "").strip()     # z. B. "[speak calmly]", nur Englisch
    return f"{anweisung} {gesendet}" if anweisung else gesendet


def _utf16_laenge(text: str) -> int:
    """Inworld zählt wie JavaScript (text.length): Emojis zählen doppelt."""
    return len(text.encode("utf-16-le")) // 2


def kontext(vorher: str, stimme: dict) -> str:
    """Text davor als Kontext: ohne Tags (Pausen als Komma), höchstens die letzten 2.000 Zeichen,
    an einer Wortgrenze abgeschnitten. Mehr braucht die Stimme nicht, um passend anzuschließen."""
    text = uebersetze(sprechfassung(vorher, stimme),
                      betont=betonung_nach_name(stimme.get("betonung", "grossbuchstaben")),
                      pause=lambda _n, davor: pause_als_komma(davor), frage="?",
                      schraegstrich=ohne_schraegstrich)
    if _utf16_laenge(text) <= MAX_KONTEXT:
        return text
    while _utf16_laenge(text) > MAX_KONTEXT:
        text = text[_utf16_laenge(text) - MAX_KONTEXT:]
    return text.split(" ", 1)[-1]


def anfrage(text: str, stimme: dict, vorher: str | None = None) -> Anfrage:
    sid = stimm_id(stimme)
    gesendet = text_fuer_anbieter(text, stimme)
    pruefe_laenge(gesendet, stimme.get("max_zeichen", MAX_ZEICHEN), ANBIETER,
                  "UTF-16-Zeichen", _utf16_laenge(gesendet))
    audio = {"audioEncoding": stimme.get("format", "MP3"),
             "sampleRateHertz": int(stimme.get("abtastrate", 44100))}
    if audio["audioEncoding"] in ("MP3", "OGG_OPUS"):
        audio["bitRate"] = int(stimme.get("bitrate", 128000))
    if stimme.get("tempo") is not None:
        audio["speakingRate"] = stimme["tempo"]
    daten = {"text": gesendet, "voiceId": sid, "modelId": stimme["modell"],
             "audioConfig": audio, "timestampType": "WORD"}
    if stimme.get("sprache"):
        daten["language"] = stimme["sprache"]                # gepinnt statt geraten
    if vorher:
        daten["synthesisContext"] = {"previousRequests": [{"text": kontext(vorher, stimme)}]}
    if stimme.get("vortrag"):
        daten["deliveryMode"] = stimme["vortrag"]           # STABLE, BALANCED, CREATIVE
    return json_anfrage("POST", f"https://{HOST}/tts/v1/voice", _header(), daten,
                        stimme.get("zeitlimit_s", 120))


def synthese(text: str, stimme: dict, vorher: str | None = None,
             nachher: str | None = None) -> Ergebnis:
    """vorher geht als Kontext mit (nicht abgerechnet); nachher kennt Inworld nicht."""
    a = anfrage(text, stimme, vorher)
    daten = pruefe_antwort(sende(a), ANBIETER, HINWEIS).json()
    audio = b64(daten["audioContent"])
    kodierung = a.json()["audioConfig"]["audioEncoding"]
    art = "mp3" if kodierung == "MP3" else "wav"
    gewuenscht = a.json()["audioConfig"]["sampleRateHertz"]
    # Inworld kappt die Rate auf die native Rate des Modells; also nachmessen.
    gemessen = mp3_abtastrate(audio) if art == "mp3" else wav_abtastrate(audio)
    ausrichtung = (daten.get("timestampInfo") or {}).get("wordAlignment") or {}
    wortzeiten = None
    if ausrichtung.get("words"):
        wortzeiten = woerter_aus_listen(ausrichtung["words"], ausrichtung["wordStartTimeSeconds"],
                                        ausrichtung["wordEndTimeSeconds"])
    gesendet = a.json()["text"]
    zeichen = (daten.get("usage") or {}).get("processedCharactersCount") or zaehle_zeichen(gesendet)
    return Ergebnis(audio=audio, format=art, abtastrate=gemessen or gewuenscht,
                    wortzeiten=wortzeiten, zeichen=int(zeichen), anbieter=ANBIETER,
                    gesendet=gesendet)


def restguthaben(stimme: dict | None = None) -> int | None:
    """Inworld liefert keinen Kontostand über die API. Stand im Portal ablesen."""
    return None


def stimmen(stimme: dict | None = None, sprache: str = "de") -> list[dict]:
    """System- und eigene Stimmen für eine Sprache (GET /voices/v1/voices?languages=de).
    Kostet nichts und dient dem Casting als Zugangsprobe."""
    abfrage = urllib.parse.urlencode({"languages": sprache})
    a = json_anfrage("GET", f"https://{HOST}/voices/v1/voices?{abfrage}", _header(), None, 30)
    daten = pruefe_antwort(sende(a), ANBIETER, HINWEIS).json()
    return [{"id": v["voiceId"], "name": v.get("displayName", ""),
             "geschlecht": str(v.get("gender", "")).lower()}
            for v in daten.get("voices", [])]
