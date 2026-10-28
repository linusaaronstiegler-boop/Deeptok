"""Stimm-Adapter ElevenLabs (Eleven v4, Modell eleven_v4), geprüft gegen die offizielle Doku am 27.10.2026.

Endpoint:  POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps
           ?output_format=mp3_44100_128
Body:      {"text", "model_id", "language_code", "voice_settings", "previous_text", "next_text", "seed"}
Antwort:   JSON {"audio_base64", "alignment": {"characters", "character_start_times_seconds",
           "character_end_times_seconds"}} -> Zeichen-Zeitstempel, hier zu Wörtern gebündelt.
Modelle:   "eleven_v4" (höchste Qualität, 10.000 Zeichen je Anfrage), gepinnt in
           voices/elevenlabs.json: Damit lief das Casting (28.10.2026). "eleven_v4_turbo" (geringe
           Latenz) wird nicht genutzt.
Markup:    v4 kennt KEIN SSML (also kein <break>). Laut Doku: Großbuchstaben verstärken die
           Betonung, Auslassungspunkte "…" machen Pausen. Lautschrift (IPA) steht zwischen zwei
           Schrägstrichen; deshalb kommt kein "/" roh beim Anbieter an: Pausen werden zu "…",
           Einheiten wie km/h ausgeschrieben (basis.ohne_schraegstrich).
Tempo:     voice_settings.speed 0.7 bis 1.2 (Standard 1.0). Die Doku nennt dafür keine
           Modell-Ausnahme (best-practices/prompting/controls, gelesen am 27.10.2026). Ob eleven_v4
           den Wert wirklich umsetzt, ist ungetestet: beim ersten echten Aufruf nachhören.
Kosten:    GET /v1/user/subscription liefert character_count und character_limit.

Schlüssel am PC: Umgebungsvariable ELEVENLABS_API_KEY.

Network secret in der Cloud (claude.ai/code -> Umgebung -> Edit -> Network secrets -> Add secret):
    Name:              ElevenLabs
    Secret type:       Bearer (Standard lassen)
    Allowed websites:  api.elevenlabs.io
    Custom headers:    Name "xi-api-key", Prefix LEEREN (das vorgegebene "Bearer" löschen),
                       Value = der API-Schlüssel
Der Schlüssel braucht die Rechte "Text to Speech", "Voices: Read" und für den Restzeichen-Check
"User: Read". Bibliotheksstimmen müssen vorher in "My Voices" übernommen sein.
"""
from __future__ import annotations

import urllib.parse

from .basis import (Anfrage, Ergebnis, StimmFehler, auth_header, b64, betonung_nach_name,
                    json_anfrage, mp3_abtastrate, ohne_schraegstrich, pause_als_komma, pcm_zu_wav,
                    pruefe_antwort, pruefe_laenge, sende, sprechfassung, stimm_id, uebersetze,
                    wav_abtastrate, woerter_aus_zeichen, zaehle_zeichen)

ANBIETER = "elevenlabs"
HOST = "api.elevenlabs.io"
VARIABLE = "ELEVENLABS_API_KEY"
HINWEIS = ("Am PC ELEVENLABS_API_KEY setzen; in der Cloud ein Network secret für "
           "api.elevenlabs.io mit Header xi-api-key (ohne Prefix) anlegen.")


def _header() -> dict[str, str]:
    # Kein Prefix: ElevenLabs erwartet den nackten Schlüssel im Header "xi-api-key".
    return auth_header("xi-api-key", VARIABLE)


def _pause(stimme: dict):
    """v4 versteht kein SSML -> Auslassungspunkte. Ältere Modelle (flash_v2_5,
    multilingual_v2) kennen <break time="x.xs" /> bis 3 s."""
    art = stimme.get("pause", "ellipse")
    sekunden = min(stimme.get("pause_ms", 400), 3000) / 1000
    if art == "ellipse":
        return lambda _n, _vorher: " …"
    if art == "break":
        return lambda _n, _vorher: f' <break time="{sekunden:.1f}s" />'
    if art == "komma":
        return lambda _n, vorher: pause_als_komma(vorher)
    raise StimmFehler(f"{ANBIETER}: unbekannte Pausenart {art!r} (ellipse, break, komma)")


def text_fuer_anbieter(text: str, stimme: dict) -> str:
    return uebersetze(sprechfassung(text, stimme),
                      betont=betonung_nach_name(stimme.get("betonung", "grossbuchstaben")),
                      pause=_pause(stimme), frage="?", schraegstrich=ohne_schraegstrich)


def _format(stimme: dict) -> tuple[str, int]:
    """'mp3_44100_128' -> ('mp3', 44100); 'wav_44100' -> ('wav', 44100); 'pcm_44100' -> ('pcm', ...)."""
    teile = stimme.get("format", "mp3_44100_128").split("_")
    return teile[0], int(teile[1])


def anfrage(text: str, stimme: dict, vorher: str | None = None,
            nachher: str | None = None) -> Anfrage:
    sid = stimm_id(stimme)
    gesendet = text_fuer_anbieter(text, stimme)
    pruefe_laenge(gesendet, stimme.get("max_zeichen"), ANBIETER)
    daten: dict = {"text": gesendet, "model_id": stimme["modell"]}
    if stimme.get("sprache"):
        daten["language_code"] = stimme["sprache"]
    einstellungen = dict(stimme.get("einstellungen") or {})
    if stimme.get("tempo") is not None:
        einstellungen["speed"] = stimme["tempo"]
    if einstellungen:
        daten["voice_settings"] = einstellungen
    if stimme.get("seed") is not None:
        daten["seed"] = stimme["seed"]
    if stimme.get("text_normalisierung"):
        daten["apply_text_normalization"] = stimme["text_normalisierung"]
    # Nachbartext: Die Stimme hört, was davor und danach kommt, und betont passend (§4).
    if vorher:
        daten["previous_text"] = text_fuer_anbieter(vorher, stimme)
    if nachher:
        daten["next_text"] = text_fuer_anbieter(nachher, stimme)
    abfrage = urllib.parse.urlencode({"output_format": stimme.get("format", "mp3_44100_128")})
    url = f"https://{HOST}/v1/text-to-speech/{urllib.parse.quote(sid, safe='')}/with-timestamps?{abfrage}"
    return json_anfrage("POST", url, _header(), daten, stimme.get("zeitlimit_s", 120))


def synthese(text: str, stimme: dict, vorher: str | None = None,
             nachher: str | None = None) -> Ergebnis:
    a = anfrage(text, stimme, vorher, nachher)
    daten = pruefe_antwort(sende(a), ANBIETER, HINWEIS).json()
    audio = b64(daten["audio_base64"])
    art, rate = _format(stimme)
    if art == "pcm":                                   # rohes PCM -> WAV, damit es abspielbar ist
        audio, art = pcm_zu_wav(audio, rate), "wav"
    gemessen = mp3_abtastrate(audio) if art == "mp3" else wav_abtastrate(audio)
    ausrichtung = daten.get("alignment") or {}
    wortzeiten = None
    if ausrichtung.get("characters"):
        wortzeiten = woerter_aus_zeichen(ausrichtung["characters"],
                                         ausrichtung["character_start_times_seconds"],
                                         ausrichtung["character_end_times_seconds"])
    gesendet = a.json()["text"]
    return Ergebnis(audio=audio, format=art, abtastrate=gemessen or rate, wortzeiten=wortzeiten,
                    zeichen=zaehle_zeichen(gesendet), anbieter=ANBIETER, gesendet=gesendet)


def restguthaben(stimme: dict | None = None) -> int | None:
    """Restzeichen im Abrechnungszeitraum: character_limit - character_count."""
    a = json_anfrage("GET", f"https://{HOST}/v1/user/subscription", _header(), None, 30)
    daten = pruefe_antwort(sende(a), ANBIETER, HINWEIS).json()
    return int(daten["character_limit"]) - int(daten["character_count"])


def stimmen(stimme: dict | None = None, sprache: str = "de") -> list[dict]:
    """Stimmen des Kontos mit Sprach-Label (GET /v2/voices). Kostet keine Zeichen.
    Dient dem Casting auch als Zugangsprobe: 401/403 -> KeinZugang."""
    abfrage = urllib.parse.urlencode({"language": sprache, "page_size": 50})
    a = json_anfrage("GET", f"https://{HOST}/v2/voices?{abfrage}", _header(), None, 30)
    daten = pruefe_antwort(sende(a), ANBIETER, HINWEIS).json()
    return [{"id": v["voice_id"], "name": v.get("name", ""),
             "geschlecht": (v.get("labels") or {}).get("gender", "")}
            for v in daten.get("voices", [])]
