"""Tests der Stimm-Adapter (werk/stimme): Markup, Lexikon, HTTP-Wiederholungen, Request-Aufbau.

Kein Test geht ins Netz. basis.TRANSPORT wird durch eine Attrappe ersetzt, die jede Anfrage
mitschreibt und vorbereitete Antworten zurückgibt. basis.SCHLAFEN schreibt nur mit, statt
zu warten. So prüfen wir genau, was an jeden Anbieter ginge, ohne dass etwas Geld kostet.
"""
from __future__ import annotations

import base64
import http.client
import io
import json
import sys
import urllib.error
import wave
import xml.etree.ElementTree as ET
from pathlib import Path

import pytest

FABRIK_DIR = Path(__file__).resolve().parent.parent
if str(FABRIK_DIR) not in sys.path:
    sys.path.insert(0, str(FABRIK_DIR))

from werk import stimme as stimm_paket                      # noqa: E402
from werk.stimme import azure, basis, cartesia, elevenlabs, inworld   # noqa: E402

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "stimme"
VARIABLEN = ("ELEVENLABS_API_KEY", "INWORLD_API_KEY", "CARTESIA_API_KEY", "AZURE_SPEECH_KEY",
             "AZURE_SPEECH_REGION")
MP3 = (FIXTURES / "probe_a.mp3").read_bytes()


class Attrappe:
    """Ersetzt die Leitung: schreibt Anfragen mit, gibt Antworten der Reihe nach zurück."""

    def __init__(self, *antworten):
        self.antworten = list(antworten)
        self.anfragen: list[basis.Anfrage] = []

    def __call__(self, anfrage: basis.Anfrage) -> basis.Antwort:
        self.anfragen.append(anfrage)
        naechste = self.antworten.pop(0)
        if isinstance(naechste, BaseException):
            raise naechste
        return naechste


def antwort(status: int = 200, daten=None, body: bytes | None = None, header=None) -> basis.Antwort:
    if body is None:
        body = json.dumps(daten if daten is not None else {}).encode()
    return basis.Antwort(status, header or {}, body)


def kopf(anfrage: basis.Anfrage, name: str) -> str | None:
    """Header-Wert ohne Rücksicht auf Groß/Klein (HTTP-Header sind nicht case-sensitiv)."""
    return next((v for k, v in anfrage.header.items() if k.lower() == name.lower()), None)


@pytest.fixture(autouse=True)
def sauber(monkeypatch):
    """Kein Schlüssel aus der echten Umgebung, kein echtes Netz, kein echtes Warten."""
    for v in VARIABLEN:
        monkeypatch.delenv(v, raising=False)

    def kein_netz(anfrage):
        raise AssertionError(f"Unerwarteter Netzzugriff: {anfrage.url}")
    monkeypatch.setattr(basis, "TRANSPORT", kein_netz)
    pausen: list[float] = []
    monkeypatch.setattr(basis, "SCHLAFEN", pausen.append)
    return pausen


@pytest.fixture
def leitung(monkeypatch):
    """Gibt eine Funktion zurück, die die Attrappe mit Antworten installiert."""
    def installiere(*antworten) -> Attrappe:
        a = Attrappe(*antworten)
        monkeypatch.setattr(basis, "TRANSPORT", a)
        return a
    return installiere


def stimme(anbieter: str, **extra) -> dict:
    s = stimm_paket.lade_stimme(anbieter)
    if s["stimm_id"] == basis.PLATZHALTER:
        s["stimm_id"] = "stimme-123"
    return {**s, **extra}


# --------------------------------------------------------------------------------------------
# Aussprache und Lexikon
# --------------------------------------------------------------------------------------------

def test_aussprache_token_spricht_rechte_seite():
    text = "Barcelona|Barsselona zahlte 45|fünfundvierzig Millionen."
    assert basis.loese_aussprache(text) == "Barsselona zahlte fünfundvierzig Millionen."


def test_aussprache_token_mit_markup_und_klammern():
    assert basis.loese_aussprache("*45|fünfundvierzig* Tore") == "*fünfundvierzig* Tore"
    assert basis.loese_aussprache("(Barcelona|Barsselona)") == "(Barsselona)"
    assert basis.loese_aussprache("Zeile 1\nSommer 2022|zweitausendzweiundzwanzig.") == \
        "Zeile 1\nSommer zweitausendzweiundzwanzig."


def test_lexikon_nur_ganze_woerter_laengste_zuerst():
    lexikon = {"Barcelona": "Barsselona", "Bayern": "Baijern", "Bayern München": "Bayern Münchn"}
    text = "Bayern München, Bayern, Barcelona und Barcelonas"
    assert basis.wende_lexikon_an(text, lexikon) == \
        "Bayern Münchn, Baijern, Barsselona und Barcelonas"


def test_lexikon_als_tokens_fuer_den_hoercheck():
    assert basis.lexikon_als_tokens("Barcelona zahlt.", {"Barcelona": "Barsselona"}) == \
        "Barcelona|Barsselona zahlt."
    # schon vorhandene Tokens bleiben unberührt
    assert basis.lexikon_als_tokens("Barcelona|Barza", {"Barcelona": "Barsselona"}) == "Barcelona|Barza"


def test_sprechfassung_token_dann_lexikon():
    s = {"lexikon": {"Lewandowski": "Lewandoffski"}}
    assert basis.sprechfassung("Lewandowski schoss 344|dreihundertvierundvierzig", s) == \
        "Lewandoffski schoss dreihundertvierundvierzig"


# --------------------------------------------------------------------------------------------
# Markup-Übersetzung je Anbieter
# --------------------------------------------------------------------------------------------

TEXT = "Das stimmt *nicht* / sondern teurer. Warum?↑ / Weil 100 km/h zu schnell sind."


def test_reiner_text_ohne_markup():
    assert basis.reiner_text(TEXT) == \
        "Das stimmt nicht, sondern teurer. Warum? Weil 100 km/h zu schnell sind."


def test_pause_am_anfang_und_ende_faellt_weg():
    assert basis.reiner_text("/ Hallo Welt /") == "Hallo Welt,"
    assert elevenlabs.text_fuer_anbieter("/ Hallo", stimme("elevenlabs")) == "Hallo"


def test_elevenlabs_grossbuchstaben_und_auslassungspunkte():
    t = elevenlabs.text_fuer_anbieter(TEXT, stimme("elevenlabs"))
    assert t == ("Das stimmt NICHT … sondern teurer. Warum? … "
                 "Weil 100 Kilometer pro Stunde zu schnell sind.")


def test_elevenlabs_break_fuer_aeltere_modelle():
    t = elevenlabs.text_fuer_anbieter("A / B", stimme("elevenlabs", pause="break", pause_ms=500))
    assert t == 'A <break time="0.5s" /> B'


def test_inworld_break_tags_und_grossbuchstaben():
    t = inworld.text_fuer_anbieter(TEXT, stimme("inworld"))
    assert t == ('Das stimmt NICHT <break time="400ms" /> sondern teurer. Warum? '
                 '<break time="400ms" /> Weil 100 Kilometer pro Stunde zu schnell sind.')


def test_inworld_hoechstens_20_pausen_danach_komma():
    text = " / ".join(f"w{i}" for i in range(23))
    t = inworld.text_fuer_anbieter(text, stimme("inworld"))
    assert t.count("<break") == 20
    assert t.endswith("w20, w21, w22")


def test_inworld_anweisung_steht_vorn():
    t = inworld.text_fuer_anbieter("Hallo", stimme("inworld", anweisung="[speak calmly]"))
    assert t == "[speak calmly] Hallo"


def test_cartesia_break_ohne_betonung():
    t = cartesia.text_fuer_anbieter(TEXT, stimme("cartesia"))
    assert t == ('Das stimmt nicht <break time="400ms"/> sondern teurer. Warum? '
                 '<break time="400ms"/> Weil 100 km/h zu schnell sind.')


def test_azure_ssml_break_ohne_emphasis_bei_dragonhd_und_escaping():
    s = stimme("azure")
    t = azure.text_fuer_anbieter("Kosten & *Nutzen* / <neu>", s)
    assert t == 'Kosten &amp; Nutzen <break time="400ms"/> &lt;neu&gt;'
    assert "emphasis" not in t


def test_azure_emphasis_nur_wenn_eingestellt():
    t = azure.text_fuer_anbieter("Das stimmt *nicht*", stimme("azure", betonung="ssml"))
    assert t == 'Das stimmt <emphasis level="moderate">nicht</emphasis>'


@pytest.mark.parametrize("modul", [elevenlabs, inworld, cartesia, azure])
def test_kein_markup_bleibt_roh_stehen(modul):
    """Nach der Übersetzung darf kein Pausen-'/' übrig sein: ElevenLabs und Inworld lesen
    Text zwischen Schrägstrichen als Lautschrift."""
    texte = json.loads((FABRIK_DIR / "casting_texte.json").read_text(encoding="utf-8"))["texte"]
    for t in texte:
        gesendet = modul.text_fuer_anbieter(t["text"], stimme(modul.ANBIETER))
        assert " / " not in gesendet and not gesendet.startswith("/")
        assert "*" not in gesendet and "↑" not in gesendet


@pytest.mark.parametrize("modul", [elevenlabs, inworld])
def test_ipa_anbieter_bekommen_keinen_schraegstrich(modul):
    """ElevenLabs v4 und Inworld lesen Text zwischen zwei "/" als Lautschrift. Einheiten,
    Brüche und Saisons im selben Satz dürfen deshalb kein Schrägstrich-Paar bilden."""
    text = "Mit 3 m/s und 10 km/h, 1/2 Portion, Saison 2014/15 und/oder 9,81 m/s² / danach."
    gesendet = modul.text_fuer_anbieter(text, stimme(modul.ANBIETER))
    rest = gesendet.replace("/>", "")              # die eigenen <break ... />-Tags zählen nicht
    assert "/" not in rest
    assert ("Mit 3 Meter pro Sekunde und 10 Kilometer pro Stunde, 1 durch 2 Portion, "
            "Saison 2014 15 und oder 9,81 Meter pro Quadratsekunde") in gesendet


def test_schraegstrich_netz_laesst_eigene_tags_heil():
    t = elevenlabs.text_fuer_anbieter("A km/h / B", stimme("elevenlabs", pause="break", pause_ms=500))
    assert t == 'A Kilometer pro Stunde <break time="0.5s" /> B'


def test_cartesia_und_azure_behalten_einheiten():
    """Nur ElevenLabs und Inworld haben IPA-Schrägstriche; die anderen lesen km/h selbst."""
    assert "10 km/h" in cartesia.text_fuer_anbieter("Mit 10 km/h.", stimme("cartesia"))
    assert "10 km/h" in azure.text_fuer_anbieter("Mit 10 km/h.", stimme("azure"))


def test_pause_direkt_nach_satzzeichen_und_fragepfeil():
    assert elevenlabs.text_fuer_anbieter("Frage?↑/ Antwort", stimme("elevenlabs")) == "Frage? … Antwort"
    assert basis.reiner_text("Frage?↑/ Antwort") == "Frage? Antwort"
    assert basis.reiner_text("Ende./ Weiter") == "Ende. Weiter"


def test_betonung_mit_token_und_malzeichen():
    s = stimme("elevenlabs")
    assert elevenlabs.text_fuer_anbieter("*Barcelona*|Barsselona zahlt *nicht* viel.", s) == \
        "BARSSELONA zahlt NICHT viel."
    assert elevenlabs.text_fuer_anbieter("*Barcelona*|Barsselona, dann", s) == "BARSSELONA, dann"
    assert elevenlabs.text_fuer_anbieter("Rechne 5 * 3 und dann *genau* hin.", s) == \
        "Rechne 5 mal 3 und dann GENAU hin."
    assert elevenlabs.text_fuer_anbieter("„*nicht*“ und *zwei Wörter*", s) == "„NICHT“ und ZWEI WÖRTER"
    # Ein verwaistes Sternchen kommt nie roh beim Anbieter an.
    assert "*" not in inworld.text_fuer_anbieter("Tippfehler *hier und weiter", stimme("inworld"))


def test_zeichen_zaehlen_ohne_tags():
    assert basis.zaehle_zeichen('Hallo <break time="400ms"/> Welt') == len("Hallo  Welt") + 1
    assert basis.zaehle_zeichen("Hallo … Welt") == 12


# --------------------------------------------------------------------------------------------
# Audio-Hilfen
# --------------------------------------------------------------------------------------------

def test_woerter_aus_zeichen_zeitstempeln():
    zeichen = list("Hi, du …")
    starts = [i * 0.1 for i in range(len(zeichen))]
    enden = [s + 0.1 for s in starts]
    assert basis.woerter_aus_zeichen(zeichen, starts, enden) == [
        {"wort": "Hi", "start": 0.0, "ende": 0.3},
        {"wort": "du", "start": 0.4, "ende": 0.6},
    ]


def test_abtastrate_aus_dateien():
    assert basis.mp3_abtastrate(MP3) == 44100
    # Zufallsbytes mit Sync-Muster, aber Layer "reserviert": kein MP3-Kopf
    assert basis.mp3_abtastrate(b"\x00\xff\xf9\x10\x00" * 4) is None
    assert basis.wav_abtastrate((FIXTURES / "probe_b.wav").read_bytes()) == 22050
    assert basis.wav_abtastrate(basis.pcm_zu_wav(b"\0\0" * 10, 44100)) == 44100


# --------------------------------------------------------------------------------------------
# HTTP: Wiederholungen und Fehlermeldungen
# --------------------------------------------------------------------------------------------

def test_wiederholt_bei_429_mit_backoff(leitung, sauber):
    a = leitung(antwort(429), antwort(429), antwort(200, {"ok": 1}))
    r = basis.sende(basis.Anfrage("GET", "https://api.example.org/x"))
    assert r.status == 200 and len(a.anfragen) == 3
    assert len(sauber) == 2 and 1.0 <= sauber[0] <= 1.5 and 2.0 <= sauber[1] <= 2.5


def test_retry_after_des_servers_gilt(leitung, sauber):
    leitung(antwort(429, header={"retry-after": "7"}), antwort(200))
    basis.sende(basis.Anfrage("GET", "https://api.example.org/x"))
    assert sauber == [7.0]


def test_gibt_nach_drei_wiederholungen_auf(leitung, sauber):
    a = leitung(*[antwort(503, body=b"busy")] * 4)
    r = basis.sende(basis.Anfrage("GET", "https://api.example.org/x"))
    assert r.status == 503 and len(a.anfragen) == 4 and len(sauber) == 3
    with pytest.raises(basis.StimmFehler, match="HTTP 503"):
        basis.pruefe_antwort(r, "test", "")


def test_kein_retry_bei_400(leitung, sauber):
    a = leitung(antwort(400, body=b"kaputt"))
    assert basis.sende(basis.Anfrage("GET", "https://api.example.org/x")).status == 400
    assert len(a.anfragen) == 1 and sauber == []


def test_netzfehler_wird_wiederholt(leitung):
    a = leitung(urllib.error.URLError("weg"), TimeoutError(), antwort(200))
    assert basis.sende(basis.Anfrage("GET", "https://api.example.org/x")).status == 200
    assert len(a.anfragen) == 3


def test_abgerissene_uebertragung_wird_wiederholt(leitung):
    """IncompleteRead ist kein OSError; früher flog es ungefangen bis ganz nach oben."""
    a = leitung(http.client.IncompleteRead(b"x" * 10, 990), antwort(200))
    assert basis.sende(basis.Anfrage("GET", "https://api.example.org/x")).status == 200
    assert len(a.anfragen) == 2


def test_post_nach_dem_absenden_nur_ein_weiterer_versuch(leitung):
    """Nach dem Absenden kann der Anbieter schon abgerechnet haben: höchstens 2 Versuche."""
    a = leitung(*[http.client.IncompleteRead(b"", 5)] * 4)
    with pytest.raises(basis.StimmFehler, match="nach 2 Versuchen"):
        basis.sende(basis.Anfrage("POST", "https://api.example.org/x", body=b"{}"))
    assert len(a.anfragen) == 2
    b = leitung(TimeoutError(), ConnectionResetError(), antwort(200))
    with pytest.raises(basis.StimmFehler):
        basis.sende(basis.Anfrage("POST", "https://api.example.org/x", body=b"{}"))
    assert len(b.anfragen) == 2


def test_post_vor_dem_absenden_alle_versuche(leitung):
    """URLError = Verbindung kam nicht zustande, nichts berechnet: volle Wiederholungen."""
    a = leitung(*[urllib.error.URLError("dns")] * 3, antwort(200))
    assert basis.sende(basis.Anfrage("POST", "https://api.example.org/x", body=b"{}")).status == 200
    assert len(a.anfragen) == 4


def test_abriss_an_echter_leitung_wird_stimmfehler(monkeypatch):
    """Lokaler Server kündigt 1000 Bytes an und schickt 10: _urllib_transport + sende."""
    import socket
    import threading
    monkeypatch.setattr(basis, "TRANSPORT", basis._urllib_transport)
    server = socket.socket()
    server.bind(("127.0.0.1", 0))
    server.listen(4)

    def bediene():
        for _ in range(2):
            verbindung, _ = server.accept()
            # Die GANZE Anfrage lesen (Kopf und Body "{}"). Bleibt ungelesene Eingabe liegen,
            # schickt close() ein RST statt FIN; der Client sähe dann unter Last
            # "Connection reset" statt IncompleteRead, und der Test flackert.
            anfrage = b""
            while not anfrage.endswith(b"{}"):
                stueck = verbindung.recv(65536)
                if not stueck:
                    break
                anfrage += stueck
            verbindung.sendall(b"HTTP/1.1 200 OK\r\nContent-Length: 1000\r\n\r\n0123456789")
            verbindung.close()
    threading.Thread(target=bediene, daemon=True).start()
    url = f"http://127.0.0.1:{server.getsockname()[1]}/x"
    with pytest.raises(basis.StimmFehler, match="IncompleteRead"):
        basis.sende(basis.Anfrage("POST", url, body=b"{}", zeitlimit=5))
    server.close()


def test_netzfehler_am_ende_ist_stimmfehler(leitung):
    leitung(*[urllib.error.URLError("weg")] * 4)
    with pytest.raises(basis.StimmFehler, match="Netzfehler bei api.example.org"):
        basis.sende(basis.Anfrage("GET", "https://api.example.org/x"))


def test_401_ist_kein_zugang_mit_hinweis(leitung):
    leitung(antwort(401, body=b"invalid"))
    with pytest.raises(basis.KeinZugang, match="Network secret"):
        elevenlabs.synthese("Hallo", stimme("elevenlabs"))


def test_warnung_bei_schluessel_als_umgebungsvariable_in_der_cloud(monkeypatch, capsys):
    monkeypatch.setenv("CLAUDE_CODE_REMOTE", "true")
    monkeypatch.setenv("CARTESIA_API_KEY", "sk_car_attrappe_geheim")
    monkeypatch.setattr(basis, "_GEWARNT", set())
    assert basis.auth_header("Authorization", "CARTESIA_API_KEY", "Bearer ") == \
        {"Authorization": "Bearer sk_car_attrappe_geheim"}
    basis.auth_header("Authorization", "CARTESIA_API_KEY", "Bearer ")
    fehler = capsys.readouterr().err
    assert fehler.count("Network secret") == 1 and "geheim" not in fehler


def test_schluessel_steht_nie_in_der_fehlermeldung(leitung, monkeypatch):
    monkeypatch.setenv("ELEVENLABS_API_KEY", "geheim-1234567890")
    leitung(antwort(400, body=b"bad key geheim-1234567890"))
    with pytest.raises(basis.StimmFehler) as fehler:
        elevenlabs.synthese("Hallo", stimme("elevenlabs"))
    assert "geheim" not in str(fehler.value) and "***" in str(fehler.value)


# --------------------------------------------------------------------------------------------
# ElevenLabs
# --------------------------------------------------------------------------------------------

def _elevenlabs_antwort(text: str) -> basis.Antwort:
    zeichen = list(text)
    return antwort(200, {"audio_base64": base64.b64encode(MP3).decode(),
                         "alignment": {"characters": zeichen,
                                       "character_start_times_seconds": [i * 0.05 for i in range(len(zeichen))],
                                       "character_end_times_seconds": [i * 0.05 + 0.05 for i in range(len(zeichen))]}})


def test_elevenlabs_request_ohne_schluessel(leitung):
    a = leitung(_elevenlabs_antwort("Das stimmt NICHT"))
    e = elevenlabs.synthese("Das stimmt *nicht* / sondern teurer.", stimme("elevenlabs"))
    r = a.anfragen[0]
    assert r.methode == "POST"
    assert r.url == ("https://api.elevenlabs.io/v1/text-to-speech/stimme-123/with-timestamps"
                     "?output_format=mp3_44100_128")
    assert kopf(r, "xi-api-key") is None and kopf(r, "Authorization") is None
    assert kopf(r, "Content-Type") == "application/json"
    body = r.json()
    assert body == {"text": "Das stimmt NICHT … sondern teurer.", "model_id": "eleven_v4_turbo",
                    "language_code": "de",
                    "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}}
    assert e.audio == MP3 and e.format == "mp3" and e.abtastrate == 44100
    assert [w["wort"] for w in e.wortzeiten] == ["Das", "stimmt", "NICHT"]
    assert e.zeichen == len(body["text"]) and e.anbieter == "elevenlabs"


def test_elevenlabs_schluessel_aus_umgebung_ohne_prefix(leitung, monkeypatch):
    monkeypatch.setenv("ELEVENLABS_API_KEY", "el-test-key")
    a = leitung(_elevenlabs_antwort("x"))
    elevenlabs.synthese("x", stimme("elevenlabs"))
    assert kopf(a.anfragen[0], "xi-api-key") == "el-test-key"


def test_elevenlabs_nachbartext_und_tempo(leitung):
    a = leitung(_elevenlabs_antwort("x"))
    elevenlabs.synthese("Mitte", stimme("elevenlabs", modell="eleven_flash_v2_5", tempo=0.9),
                        vorher="Davor *jetzt*", nachher="Danach")
    body = a.anfragen[0].json()
    assert body["previous_text"] == "Davor JETZT" and body["next_text"] == "Danach"
    assert body["voice_settings"]["speed"] == 0.9 and body["model_id"] == "eleven_flash_v2_5"


def test_elevenlabs_platzhalter_wird_nicht_gesendet(leitung):
    a = leitung()
    s = stimm_paket.lade_stimme("elevenlabs")
    assert s["stimm_id"] == basis.PLATZHALTER
    with pytest.raises(basis.StimmFehler, match="Erst casten"):
        elevenlabs.synthese("Hallo", s)
    assert a.anfragen == []


def test_elevenlabs_restguthaben(leitung):
    a = leitung(antwort(200, {"tier": "creator", "character_count": 1000, "character_limit": 275000}))
    assert elevenlabs.restguthaben() == 274000
    assert a.anfragen[0].methode == "GET"
    assert a.anfragen[0].url == "https://api.elevenlabs.io/v1/user/subscription"


# --------------------------------------------------------------------------------------------
# Inworld
# --------------------------------------------------------------------------------------------

def _inworld_antwort() -> basis.Antwort:
    return antwort(200, {"audioContent": base64.b64encode(MP3).decode(),
                         "usage": {"processedCharactersCount": 42, "modelId": "inworld-tts-2"},
                         "timestampInfo": {"wordAlignment": {
                             "words": ["Das", "stimmt", "NICHT."],
                             "wordStartTimeSeconds": [0.0, 0.3, 0.7],
                             "wordEndTimeSeconds": [0.25, 0.65, 1.1]}}})


def test_inworld_request_ohne_schluessel(leitung):
    a = leitung(_inworld_antwort())
    e = inworld.synthese("Das stimmt *nicht* / klar?↑", stimme("inworld"))
    r = a.anfragen[0]
    assert r.methode == "POST" and r.url == "https://api.inworld.ai/tts/v1/voice"
    assert kopf(r, "Authorization") is None
    assert r.json() == {
        "text": 'Das stimmt NICHT <break time="400ms" /> klar?',
        "voiceId": "stimme-123", "modelId": "inworld-tts-2",
        "audioConfig": {"audioEncoding": "MP3", "sampleRateHertz": 44100, "bitRate": 128000},
        "timestampType": "WORD", "deliveryMode": "BALANCED", "language": "de"}
    assert e.format == "mp3" and e.abtastrate == 44100 and e.zeichen == 42
    assert e.wortzeiten[-1] == {"wort": "NICHT", "start": 0.7, "ende": 1.1}


def test_inworld_schluessel_mit_basic_prefix(leitung, monkeypatch):
    monkeypatch.setenv("INWORLD_API_KEY", "QmFzZTY0LWF1cw==")
    a = leitung(_inworld_antwort())
    inworld.synthese("x", stimme("inworld"))
    assert kopf(a.anfragen[0], "Authorization") == "Basic QmFzZTY0LWF1cw=="


def test_inworld_nachbartext_davor_als_kontext(leitung):
    a = leitung(_inworld_antwort())
    inworld.synthese("Mitte", stimme("inworld"), vorher="Davor *jetzt* / mit 3 km/h", nachher="Danach")
    body = a.anfragen[0].json()
    assert body["synthesisContext"] == {"previousRequests": [{"text": "Davor JETZT, mit 3 Kilometer pro Stunde"}]}
    assert "Danach" not in json.dumps(body)        # einen Platz für "danach" gibt es nicht
    lang = inworld.kontext("wort " * 900, stimme("inworld"))
    assert len(lang) <= inworld.MAX_KONTEXT and lang.startswith("wort")


def test_inworld_zu_langer_text(leitung):
    a = leitung()
    with pytest.raises(basis.TextZuLang, match="2000"):
        inworld.synthese("a" * 2001, stimme("inworld"))
    assert a.anfragen == []


# --------------------------------------------------------------------------------------------
# Cartesia
# --------------------------------------------------------------------------------------------

def _sse(*ereignisse) -> bytes:
    return "".join(f"data: {json.dumps(e)}\n\n" for e in ereignisse).encode()


PCM = b"\x01\x00\x02\x00" * 50


def test_cartesia_request_ohne_schluessel(leitung):
    a = leitung(antwort(200, body=_sse(
        {"type": "chunk", "done": False, "data": base64.b64encode(PCM[:100]).decode()},
        {"type": "timestamps", "word_timestamps": {"words": ["Das", "stimmt"], "start": [0.0, 0.3], "end": [0.25, 0.6]}},
        {"type": "chunk", "done": False, "data": base64.b64encode(PCM[100:]).decode()},
        {"type": "timestamps", "word_timestamps": {"words": ["nicht."], "start": [0.7], "end": [1.0]}},
        {"type": "done", "done": True})))
    e = cartesia.synthese("Das stimmt *nicht* / sondern", stimme("cartesia"))
    r = a.anfragen[0]
    assert r.methode == "POST" and r.url == "https://api.cartesia.ai/tts/sse"
    assert kopf(r, "Cartesia-Version") == "2026-08-14"
    assert kopf(r, "Authorization") is None
    assert r.json() == {
        "model_id": "sonic-3.6-2026-08-27", "transcript": 'Das stimmt nicht <break time="400ms"/> sondern',
        "voice": {"id": "stimme-123"},
        "output_format": {"container": "raw", "encoding": "pcm_s16le", "sample_rate": 44100},
        "add_timestamps": True, "language": "de"}
    assert e.format == "wav" and e.abtastrate == 44100 and e.audio[:4] == b"RIFF"
    with wave.open(io.BytesIO(e.audio)) as w:
        assert w.readframes(w.getnframes()) == PCM
    assert [w["wort"] for w in e.wortzeiten] == ["Das", "stimmt", "nicht"]


def test_cartesia_schluessel_als_bearer(leitung, monkeypatch):
    monkeypatch.setenv("CARTESIA_API_KEY", "sk_car_test")
    a = leitung(antwort(200, body=_sse({"type": "chunk", "data": base64.b64encode(PCM).decode()},
                                       {"type": "done"})))
    cartesia.synthese("x", stimme("cartesia", tempo=0.9))
    assert kopf(a.anfragen[0], "Authorization") == "Bearer sk_car_test"
    assert a.anfragen[0].json()["generation_config"] == {"speed": 0.9}


def test_cartesia_fehler_im_strom(leitung):
    leitung(antwort(200, body=_sse({"type": "error", "title": "Bad voice", "message": "unknown id",
                                    "status_code": 400})))
    with pytest.raises(basis.StimmFehler, match="unknown id"):
        cartesia.synthese("x", stimme("cartesia"))


# --------------------------------------------------------------------------------------------
# Azure
# --------------------------------------------------------------------------------------------

def test_azure_request_ohne_schluessel(leitung):
    a = leitung(antwort(200, body=MP3))
    e = azure.synthese("Kosten & *Nutzen* / weiter", stimme("azure"))
    r = a.anfragen[0]
    assert r.methode == "POST"
    assert r.url == "https://westeurope.tts.speech.microsoft.com/cognitiveservices/v1"
    assert kopf(r, "Ocp-Apim-Subscription-Key") is None and kopf(r, "Authorization") is None
    assert kopf(r, "Content-Type") == "application/ssml+xml"
    assert kopf(r, "X-Microsoft-OutputFormat") == "audio-48khz-192kbitrate-mono-mp3"
    assert kopf(r, "User-Agent")
    wurzel = ET.fromstring(r.body.decode("utf-8"))          # gültiges XML?
    ns = "{http://www.w3.org/2001/10/synthesis}"
    stimme_el = wurzel.find(f"{ns}voice")
    assert stimme_el.get("name") == "de-DE-Florian:DragonHDLatestNeural"
    assert stimme_el.get("parameters") == "temperature=0.8"
    assert stimme_el.find(f"{ns}break").get("time") == "400ms"
    assert "Kosten & Nutzen" in "".join(stimme_el.itertext())
    assert e.format == "mp3" and e.wortzeiten is None and e.zeichen == len("Kosten & Nutzen  weiter") + 1


def test_azure_region_und_schluessel_aus_umgebung(leitung, monkeypatch):
    monkeypatch.setenv("AZURE_SPEECH_KEY", "az-test")
    monkeypatch.setenv("AZURE_SPEECH_REGION", "swedencentral")
    a = leitung(antwort(200, body=MP3))
    azure.synthese("x", stimme("azure"))
    assert a.anfragen[0].url.startswith("https://swedencentral.tts.speech.microsoft.com/")
    assert kopf(a.anfragen[0], "Ocp-Apim-Subscription-Key") == "az-test"


def test_azure_ungueltige_region(monkeypatch):
    monkeypatch.setenv("AZURE_SPEECH_REGION", "evil.example.org/x")
    with pytest.raises(basis.StimmFehler, match="Region"):
        azure.anfrage("x", stimme("azure"))


# --------------------------------------------------------------------------------------------
# Stimmenlisten, Restguthaben, Dispatch, gepinnte Dateien
# --------------------------------------------------------------------------------------------

@pytest.mark.parametrize("modul, daten, url", [
    (elevenlabs, {"voices": [{"voice_id": "v1", "name": "A", "labels": {"gender": "male"}}]},
     "https://api.elevenlabs.io/v2/voices?language=de&page_size=50"),
    (inworld, {"voices": [{"voiceId": "v1", "displayName": "A", "gender": "MALE"}]},
     "https://api.inworld.ai/voices/v1/voices?languages=de"),
    (cartesia, {"data": [{"id": "v1", "name": "A", "gender": "masculine"}]},
     "https://api.cartesia.ai/voices?language=de&limit=100"),
    (azure, [{"ShortName": "v1", "DisplayName": "A", "Gender": "Male", "Locale": "de-DE"},
             {"ShortName": "en", "DisplayName": "B", "Gender": "Female", "Locale": "en-US"}],
     "https://westeurope.tts.speech.microsoft.com/cognitiveservices/voices/list"),
])
def test_stimmenliste_je_anbieter(leitung, modul, daten, url):
    a = leitung(antwort(200, daten))
    liste = modul.stimmen(stimme(modul.ANBIETER), "de")
    assert a.anfragen[0].methode == "GET" and a.anfragen[0].url == url
    assert liste == [{"id": "v1", "name": "A", "geschlecht": liste[0]["geschlecht"]}]
    assert liste[0]["geschlecht"] in ("male", "masculine")
    for name in ("xi-api-key", "Authorization", "Ocp-Apim-Subscription-Key"):
        assert kopf(a.anfragen[0], name) is None


@pytest.mark.parametrize("modul", [inworld, cartesia, azure])
def test_restguthaben_ohne_api_ist_none(modul):
    assert modul.restguthaben(stimme(modul.ANBIETER)) is None      # und kein Netzzugriff


def test_dispatch_ueber_das_paket(leitung):
    a = leitung(antwort(200, body=MP3))
    e = stimm_paket.synthese("Hallo", stimme("azure"))
    assert e.anbieter == "azure" and "microsoft.com" in a.anfragen[0].url
    with pytest.raises(basis.StimmFehler, match="Unbekannter Anbieter"):
        stimm_paket.adapter("piper")


@pytest.mark.parametrize("anbieter", stimm_paket.ANBIETER)
def test_gepinnte_stimmen_sind_vollstaendig(anbieter):
    s = stimm_paket.lade_stimme(anbieter)
    assert s["anbieter"] == anbieter and s["modell"] and s["stimm_id"]
    for k in s.get("kandidaten", []):
        assert k["id"] and k["geschlecht"] in ("male", "female")
    roh = (stimm_paket.VOICES_DIR / f"{anbieter}.json").read_text(encoding="utf-8").lower()
    for verboten in ("api_key", "apikey", "sk_car_", "secret\":", "ocp-apim-subscription-key\":"):
        assert verboten not in roh


def test_platzhalter_nur_wo_noetig():
    assert stimm_paket.lade_stimme("azure")["stimm_id"] == "de-DE-Florian:DragonHDLatestNeural"
    for anbieter in ("elevenlabs", "inworld", "cartesia"):
        assert stimm_paket.lade_stimme(anbieter)["stimm_id"] == basis.PLATZHALTER
