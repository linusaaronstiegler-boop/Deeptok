"""Stimm-Adapter Azure Speech (Florian DragonHD), geprüft gegen die offizielle Doku am 27.10.2026.

Endpoint:  POST https://<region>.tts.speech.microsoft.com/cognitiveservices/v1
Header:    Content-Type: application/ssml+xml, X-Microsoft-OutputFormat: audio-48khz-192kbitrate-mono-mp3,
           User-Agent (Pflicht), Ocp-Apim-Subscription-Key (der Schlüssel, ohne Prefix)
Body:      SSML  <speak ...><voice name="de-DE-Florian:DragonHDLatestNeural">…</voice></speak>
Antwort:   die Audiodatei selbst (keine Wortzeiten über REST -> faster-whisper misst sie).
Region:    HD-Stimmen gibt es in Europa nur in westeurope, swedencentral und francecentral,
           NICHT in germanywestcentral. Standard hier: westeurope. Ein Schlüssel gilt nur in
           der Region seiner Speech-Ressource.
Markup:    DragonHD-Stimmen können <break> (ja), <phoneme>, <sub>, <lexicon> (nur Alias),
           aber KEIN <emphasis> und KEIN <prosody>. Betonung fällt deshalb weg (betonung
           "entfernen"); nur für normale Neural-Stimmen ist betonung "ssml" sinnvoll.
           Ausgabe: HD-Stimmen liefern 8/16/24/48 kHz; 48 kHz erfüllt G4 (≥ 44,1 kHz).
           Ein Audio darf höchstens 10 min lang sein, sonst schneidet Azure ab.
Kosten:    Azure liefert keinen Kontostand über diese API -> restguthaben() gibt None.

Schlüssel am PC: AZURE_SPEECH_KEY und AZURE_SPEECH_REGION (z. B. westeurope).

Network secret in der Cloud (claude.ai/code -> Umgebung -> Edit -> Network secrets -> Add secret):
    Name:              Azure Speech
    Secret type:       Bearer (Standard lassen)
    Allowed websites:  westeurope.tts.speech.microsoft.com   (die Region der Speech-Ressource)
    Custom headers:    Name "Ocp-Apim-Subscription-Key", Prefix LEEREN (das "Bearer" löschen),
                       Value = Key 1 der Speech-Ressource
Die Region ist kein Geheimnis: Sie steht in voices/azure.json ("region"); AZURE_SPEECH_REGION
überschreibt sie am PC.
"""
from __future__ import annotations

import os
import re
from xml.sax.saxutils import escape, quoteattr

from .basis import (Anfrage, Ergebnis, StimmFehler, auth_header, json_anfrage, mp3_abtastrate,
                    pause_als_komma, pruefe_antwort, sende, sprechfassung, stimm_id, uebersetze,
                    wav_abtastrate, zaehle_zeichen)

ANBIETER = "azure"
VARIABLE = "AZURE_SPEECH_KEY"
HINWEIS = ("Am PC AZURE_SPEECH_KEY und AZURE_SPEECH_REGION setzen; in der Cloud ein Network "
           "secret für <region>.tts.speech.microsoft.com mit Header Ocp-Apim-Subscription-Key "
           "(ohne Prefix) anlegen.")


def region(stimme: dict) -> str:
    wert = os.environ.get("AZURE_SPEECH_REGION", "").strip() or stimme.get("region", "westeurope")
    if not re.fullmatch(r"[a-z0-9]+", wert):
        raise StimmFehler(f"{ANBIETER}: ungültige Region {wert!r}")
    return wert


def host(stimme: dict) -> str:
    return f"{region(stimme)}.tts.speech.microsoft.com"


def _header(stimme: dict) -> dict[str, str]:
    return {"Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": stimme.get("format", "audio-48khz-192kbitrate-mono-mp3"),
            "User-Agent": "deeptok-fabrik",
            **auth_header("Ocp-Apim-Subscription-Key", VARIABLE)}


def _betonung(stimme: dict):
    art = stimme.get("betonung", "entfernen")
    if art == "ssml":        # nur für Neural-Stimmen ohne "DragonHD" im Namen
        return lambda wort: f'<emphasis level="moderate">{wort}</emphasis>'
    if art == "entfernen":
        return lambda wort: wort
    raise StimmFehler(f"{ANBIETER}: unbekannte Betonungsart {art!r} (ssml, entfernen)")


def text_fuer_anbieter(text: str, stimme: dict) -> str:
    """Erst XML-sicher machen (&, <, >), DANN das Markup in Tags übersetzen.
    Andersherum würde escape() unsere eigenen <break>-Tags zerstören."""
    ms = int(stimme.get("pause_ms", 400))
    sicher = escape(sprechfassung(text, stimme))
    pause = ((lambda _n, _vorher: f' <break time="{ms}ms"/>') if stimme.get("pause", "break") == "break"
             else (lambda _n, vorher: pause_als_komma(vorher)))
    return uebersetze(sicher, betont=_betonung(stimme), pause=pause, frage="?")


def ssml(text: str, stimme: dict) -> str:
    sid = stimm_id(stimme)
    inhalt = text_fuer_anbieter(text, stimme)
    sprache = stimme.get("sprache", "de-DE")
    # parameters="temperature=0.8": weniger Zufall = gleichmäßigere Stimme (Doku: 0 bis 1, Standard 1).
    parameter = f" parameters={quoteattr(stimme['parameter'])}" if stimme.get("parameter") else ""
    return (f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" '
            f'xml:lang={quoteattr(sprache)}><voice name={quoteattr(sid)}{parameter}>'
            f"{inhalt}</voice></speak>")


def _format(stimme: dict) -> tuple[str, int]:
    """'audio-48khz-192kbitrate-mono-mp3' -> ('mp3', 48000); 'riff-44100hz-16bit-mono-pcm' -> ('wav', 44100)."""
    name = stimme.get("format", "audio-48khz-192kbitrate-mono-mp3")
    art = "mp3" if name.endswith("mp3") else "wav" if name.startswith("riff") else name
    treffer = re.search(r"(\d+)khz", name) or re.search(r"(\d+)hz", name)
    rate = int(treffer.group(1)) * (1000 if "khz" in treffer.group(0) else 1) if treffer else 0
    return art, rate


def anfrage(text: str, stimme: dict) -> Anfrage:
    body = ssml(text, stimme).encode("utf-8")
    return Anfrage("POST", f"https://{host(stimme)}/cognitiveservices/v1", _header(stimme), body,
                   stimme.get("zeitlimit_s", 120))


def synthese(text: str, stimme: dict, vorher: str | None = None,
             nachher: str | None = None) -> Ergebnis:
    """vorher/nachher kennt Azure nicht; sie werden ignoriert."""
    a = anfrage(text, stimme)
    antwort = pruefe_antwort(sende(a), ANBIETER, HINWEIS)
    art, rate = _format(stimme)
    gemessen = mp3_abtastrate(antwort.body) if art == "mp3" else wav_abtastrate(antwort.body)
    inhalt = text_fuer_anbieter(text, stimme)
    return Ergebnis(audio=antwort.body, format=art, abtastrate=gemessen or rate, wortzeiten=None,
                    zeichen=zaehle_zeichen(inhalt), anbieter=ANBIETER, gesendet=inhalt)


def restguthaben(stimme: dict | None = None) -> int | None:
    """Kein Kontostand über die Speech-API; Verbrauch steht im Azure-Portal (Cost Management)."""
    return None


def stimmen(stimme: dict | None = None, sprache: str = "de") -> list[dict]:
    """Alle Stimmen der Region mit passender Sprache (GET .../cognitiveservices/voices/list).
    Kostet nichts und dient dem Casting als Zugangsprobe."""
    stimme = stimme or {}
    kopf = {"User-Agent": "deeptok-fabrik", **auth_header("Ocp-Apim-Subscription-Key", VARIABLE)}
    a = json_anfrage("GET", f"https://{host(stimme)}/cognitiveservices/voices/list", kopf, None, 30)
    daten = pruefe_antwort(sende(a), ANBIETER, HINWEIS).json()
    return [{"id": v["ShortName"], "name": v.get("DisplayName", ""),
             "geschlecht": str(v.get("Gender", "")).lower()}
            for v in daten if str(v.get("Locale", "")).lower().startswith(sprache.lower())]
