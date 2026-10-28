"""Echtbild-Baustein (werk/bilder.py) ohne Netz: Die Commons-API wird gespielt.

Geprüft wird, was rechtlich und gegenüber Wikimedia zählt:
- nur freie Lizenzen (PD, CC0, CC BY, CC BY-SA, ohne bekannte Rechte) kommen durch;
- jede Anfrage trägt den beschreibenden User-Agent und keinen Schlüssel;
- zwischen zwei Abrufen liegt eine Pause, bei 429 wird gewartet und irgendwann aufgegeben;
- Credit-Zeile und credits.json enthalten Urheber, Lizenz, Link und Datum;
  ein nacktes Jahr wird „ca.“, das Datum eines Gegenstands nie zum Fotojahr;
- Videos werden nie still gegen ein Standbild getauscht, Fassungen kommen aus videoinfo;
- Fotos mit erkennbaren Personen (Commons: personality) brauchen eine Freigabe;
- Auflagen außerhalb des Urheberrechts (Non-copyright restriction, User:*/DFL) lösen einen
  Hinweis aus und landen mit der Abwägung in credits.json;
- die Kurzform des Credits hält die Zeile (Urheber, Jahr, Lizenz, Vermerk) und den Link getrennt.
"""
from __future__ import annotations

import email.message
import hashlib
import io
import json
import sys
import urllib.error
import urllib.parse
import warnings

import pytest

from werk import EXIT_EINGABE, bilder

try:
    from PIL import Image
except ImportError:          # pragma: no cover - Pillow fehlt nur in nackten Umgebungen
    Image = None
braucht_pillow = pytest.mark.skipif(Image is None, reason="Pillow nicht installiert")


# --- gespieltes Netz --------------------------------------------------------------------------

class Antwort:
    """Wie die Antwort von urllib.request.urlopen: lesbar, Kopfzeilen, Kontextmanager."""

    def __init__(self, daten: bytes, kopf: dict | None = None):
        self._daten = io.BytesIO(daten)
        self.headers = kopf or {}

    def read(self, n: int = -1) -> bytes:
        return self._daten.read(n)

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


def http_fehler(code: int, retry_after: str | None = None) -> urllib.error.HTTPError:
    kopf = email.message.Message()
    if retry_after is not None:
        kopf["Retry-After"] = retry_after
    return urllib.error.HTTPError("https://commons.wikimedia.org/w/api.php", code, "Too Many",
                                  kopf, io.BytesIO(b""))


class Netz:
    """Spielt eine Folge von Antworten ab und merkt sich jede Anfrage."""

    def __init__(self, *antworten):
        self.antworten = list(antworten)
        self.anfragen = []

    def __call__(self, anfrage, timeout=None):
        self.anfragen.append(anfrage)
        naechste = self.antworten.pop(0)
        if isinstance(naechste, Exception):
            raise naechste
        if isinstance(naechste, (dict, list)):
            return Antwort(json.dumps(naechste).encode())
        return Antwort(naechste)

    def params(self, i: int = 0) -> dict[str, str]:
        url = self.anfragen[i].full_url
        return dict(urllib.parse.parse_qsl(urllib.parse.urlsplit(url).query))


@pytest.fixture
def uhr(monkeypatch):
    """Ersetzt sleep und monotonic: Die Tests warten nie wirklich, wir zählen nur."""
    zustand = {"jetzt": 1000.0, "schlaf": []}

    def schlafe(s):
        zustand["schlaf"].append(round(s, 3))
        zustand["jetzt"] += s

    monkeypatch.setattr(bilder.time, "sleep", schlafe)
    monkeypatch.setattr(bilder.time, "monotonic", lambda: zustand["jetzt"])
    monkeypatch.setattr(bilder, "_letzter_abruf", 0.0)
    return zustand


@pytest.fixture
def netz(monkeypatch):
    def einrichten(*antworten) -> Netz:
        n = Netz(*antworten)
        monkeypatch.setattr(bilder.urllib.request, "urlopen", n)
        return n
    return einrichten


def meta(**felder) -> dict:
    return {k: {"value": v, "source": "commons-desc-page"} for k, v in felder.items()}


def seite(pageid, titel, index, extmetadata, **info):
    return {"pageid": pageid, "ns": 6, "title": titel, "index": index, "imageinfo": [{
        "url": f"https://upload.wikimedia.org/wikipedia/commons/a/ab/{titel[5:].replace(' ', '_')}",
        "descriptionurl": f"https://commons.wikimedia.org/wiki/{titel.replace(' ', '_')}",
        "thumburl": f"https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/x.jpg/1280px-x.jpg",
        "width": 4000, "height": 3000, "size": 2_000_000, "mime": "image/jpeg", "sha1": "0" * 40,
        "extmetadata": extmetadata, **info}]}


# Eine Suchantwort mit sieben Dateien, absichtlich nicht nach Rang sortiert.
SUCHE = {"batchcomplete": True, "query": {"pages": [
    seite(3, "File:Nicht kommerziell.jpg", 3,
          meta(LicenseShortName="CC BY-NC-SA 2.0", License="cc-by-nc-sa-2.0", Artist="X")),
    seite(1, "File:Camp Nou aerial.jpg", 1,
          meta(LicenseShortName="CC BY-SA 4.0", License="cc-by-sa-4.0",
               LicenseUrl="https://creativecommons.org/licenses/by-sa/4.0",
               Artist='<a href="//commons.wikimedia.org/wiki/User:Lmbuga">Luis M. Bugallo</a>',
               DateTimeOriginal="2014-04-08 10:57:09", Restrictions="trademarked")),
    seite(5, "File:Les Corts 1923.jpg", 5,
          meta(LicenseShortName="Public domain", License="pd",
               Artist="Autor/-in unbekannt Unknown author",
               DateTimeOriginal='1923 <span style="display:none">date QS:P571,+1923-00-00T00:00:00Z/9</span>')),
    seite(4, "File:Nur GFDL.jpg", 4, meta(LicenseShortName="GFDL", License="gfdl", Artist="Y")),
    seite(2, "File:Ball.jpg", 2, meta(LicenseShortName="CC0", License="cc0", Artist="Z")),
    seite(6, "File:Hafen 1890.jpg", 6,
          meta(LicenseShortName="No restrictions", License="no restrictions",
               Artist="Detroit Publishing Co.", DateTimeOriginal="zwischen 1890 und 1900")),
    seite(7, "File:Unfrei.jpg", 7,
          meta(LicenseShortName="CC BY 4.0", License="cc-by-4.0", NonFree="true", Artist="W")),
]}}


# --- Lizenz -----------------------------------------------------------------------------------

@pytest.mark.parametrize("felder, erwartet", [
    ({"License": "cc-by-sa-4.0", "LicenseShortName": "CC BY-SA 4.0"}, "cc-by-sa"),
    ({"License": "cc-by-sa-3.0-de"}, "cc-by-sa"),
    ({"License": "cc-by-2.0", "LicenseShortName": "CC BY 2.0"}, "cc-by"),
    ({"LicenseShortName": "CC BY 4.0"}, "cc-by"),
    ({"License": "cc0", "LicenseShortName": "CC0"}, "cc0"),
    ({"License": "pd", "LicenseShortName": "Public domain"}, "pd"),
    ({"LicenseShortName": "PD-old-70"}, "pd"),
    ({"LicenseShortName": "No restrictions"}, "ohne-bekannte-rechte"),
    ({"License": "cc-by-nc-sa-2.0"}, None),           # NC schlägt BY-SA
    ({"License": "cc-by-nd-4.0"}, None),
    ({"LicenseShortName": "CC BY-NC 2.0"}, None),
    ({"License": "gfdl", "LicenseShortName": "GFDL"}, None),   # GFDL allein ist nicht erlaubt
    ({"LicenseShortName": "Fair use"}, None),
    ({"License": "cc-by-4.0", "NonFree": "true"}, None),
    ({}, None),                                        # keine Angabe = nicht verwenden
])
def test_lizenz_art(felder, erwartet):
    assert bilder.lizenz_art(meta(**felder)) == erwartet


# --- Suche ------------------------------------------------------------------------------------

def test_suche_filtert_auf_freie_lizenzen_und_ordnet_nach_rang(uhr, netz):
    netz(SUCHE)
    treffer = bilder.suche("Camp Nou")
    assert not any(t.zeigt_personen for t in treffer)
    assert [t.titel for t in treffer] == ["File:Camp Nou aerial.jpg", "File:Ball.jpg",
                                          "File:Les Corts 1923.jpg", "File:Hafen 1890.jpg"]
    assert [t.lizenz_art for t in treffer] == ["cc-by-sa", "cc0", "pd", "ohne-bekannte-rechte"]
    erster = treffer[0]
    assert erster.urheber == "Luis M. Bugallo"                       # HTML-Link entfernt
    assert erster.lizenz == "CC BY-SA 4.0"
    assert erster.lizenz_url == "https://creativecommons.org/licenses/by-sa/4.0"
    assert erster.seite == "https://commons.wikimedia.org/wiki/File:Camp_Nou_aerial.jpg"
    assert erster.kurzlink == "commons.wikimedia.org/?curid=1"
    assert erster.jahr == "2014"
    assert erster.einschraenkungen == ["trademarked"]
    assert erster.abgerufen                                           # ISO-Datum gesetzt
    corts = treffer[2]
    assert corts.urheber == "unbekannt"
    assert corts.datum == "1923"                                      # Wikidata-Marke entfernt
    assert corts.jahr == "ca. 1923"                                   # nacktes Jahr: vorsichtig
    assert treffer[3].jahr == "1890–1900"                             # Zeitraum bleibt Zeitraum


def test_suche_fragt_richtig_und_mit_user_agent(uhr, netz):
    n = netz(SUCHE)
    bilder.suche("Camp Nou", anzahl=7, vorschau_breite=960)
    p = n.params()
    assert p["action"] == "query" and p["generator"] == "search"
    assert p["gsrsearch"] == "Camp Nou filetype:bitmap"
    assert p["gsrnamespace"] == "6" and p["gsrlimit"] == "7"
    assert p["prop"] == "imageinfo" and p["iiurlwidth"] == "960"
    assert {"url", "size", "extmetadata"} <= set(p["iiprop"].split("|"))
    assert {"Artist", "LicenseShortName", "License"} <= set(p["iiextmetadatafilter"].split("|"))
    assert p["format"] == "json" and p["maxlag"] == "5"
    anfrage = n.anfragen[0]
    assert anfrage.full_url.startswith("https://commons.wikimedia.org/w/api.php?")
    ua = anfrage.get_header("User-agent")
    assert ua == bilder.USER_AGENT
    assert ua.startswith("DeepTok/0.1 (Lernprojekt;")
    assert "linusaaronstiegler-boop/Deeptok" in ua
    ua.encode("ascii")                                                # Kopfzeile bleibt ASCII
    assert anfrage.get_header("Authorization") is None and anfrage.get_header("Xi-api-key") is None


def test_suche_mit_lizenz_teilmenge_und_mehreren_arten(uhr, netz):
    n = netz(SUCHE, {"query": {"pages": []}})
    treffer = bilder.suche("Barcelona", lizenzen=("pd", "cc0"), arten=("bitmap", "video"))
    assert {t.lizenz_art for t in treffer} == {"pd", "cc0"}
    assert [n.params(i)["gsrsearch"] for i in range(2)] == ["Barcelona filetype:bitmap",
                                                           "Barcelona filetype:video"]


def test_suche_mindestbreite(uhr, netz):
    antwort = json.loads(json.dumps(SUCHE))
    antwort["query"]["pages"][1]["imageinfo"][0]["width"] = 800      # Camp Nou zu schmal
    netz(antwort)
    assert "File:Camp Nou aerial.jpg" not in [t.titel for t in bilder.suche("x", min_breite=1080)]


@pytest.mark.parametrize("kw", [{"lizenzen": ("cc-by-nc",)}, {"arten": ("audio",)}])
def test_suche_lehnt_unbekanntes_ab(uhr, netz, kw):
    netz()
    with pytest.raises(bilder.BildFehler) as fehler:
        bilder.suche("x", **kw)
    assert fehler.value.code == EXIT_EINGABE


# --- Höflichkeit: Pause, 429, maxlag ----------------------------------------------------------

def test_pause_zwischen_zwei_abrufen(uhr, netz):
    netz(SUCHE, SUCHE)
    bilder.suche("a")
    bilder.suche("b")
    # Die Uhr steht zwischen den Abrufen still, also muss die volle Pause geschlafen werden.
    assert uhr["schlaf"] == [bilder.PAUSE_S]


def test_429_wartet_retry_after_und_versucht_erneut(uhr, netz):
    n = netz(http_fehler(429, retry_after="7"), SUCHE)
    assert len(bilder.suche("Camp Nou")) == 4
    assert len(n.anfragen) == 2
    assert 7.0 in uhr["schlaf"]                         # Retry-After (7 s) > Start-Backoff (5 s)


def test_429_ohne_retry_after_verdoppelt_und_gibt_auf(uhr, netz):
    n = netz(*[http_fehler(429)] * bilder.MAX_VERSUCHE)
    with pytest.raises(bilder.CommonsBesetzt):
        bilder.suche("Camp Nou")
    assert len(n.anfragen) == bilder.MAX_VERSUCHE      # kein Versuch mehr als erlaubt
    gewartet = [s for s in uhr["schlaf"] if s >= bilder.BACKOFF_START_S]
    assert gewartet == [5.0, 10.0, 20.0, 40.0]


def test_langes_retry_after_bricht_ab_statt_frueher_zu_fragen(uhr, netz):
    n = netz(http_fehler(429, retry_after="600"), SUCHE)
    with pytest.raises(bilder.CommonsBesetzt) as fehler:
        bilder.suche("Camp Nou")
    assert fehler.value.warte_s == 600.0
    assert len(n.anfragen) == 1                        # kein zweiter Versuch vor Ablauf
    assert not [s for s in uhr["schlaf"] if s > bilder.PAUSE_S]


def test_503_wird_wie_429_behandelt(uhr, netz):
    netz(http_fehler(503, retry_after="2"), SUCHE)
    assert bilder.suche("x")
    assert 5.0 in uhr["schlaf"]                        # nie kürzer als der Start-Backoff


def test_anderer_http_fehler_bricht_sofort_ab(uhr, netz):
    n = netz(http_fehler(404))
    with pytest.raises(bilder.BildFehler) as fehler:
        bilder.suche("x")
    assert not isinstance(fehler.value, bilder.CommonsBesetzt)
    assert len(n.anfragen) == 1


@pytest.mark.parametrize("code", ["maxlag", "cirrussearch-too-busy-error"])
def test_api_spaeter_fehler_wird_wiederholt(uhr, netz, code):
    n = netz({"error": {"code": code, "info": "später"}}, SUCHE)
    assert bilder.suche("x")
    assert len(n.anfragen) == 2


def test_api_fehler_anderer_art_bricht_ab(uhr, netz):
    netz({"error": {"code": "badvalue", "info": "kaputt"}})
    with pytest.raises(bilder.BildFehler, match="badvalue"):
        bilder.suche("x")


def test_retry_after_als_http_datum(monkeypatch):
    monkeypatch.setattr(bilder.time, "time", lambda: 1_700_000_000.0)
    # 1_700_000_030 s = Tue, 14 Nov 2023 22:13:50 GMT
    assert bilder._retry_after("Tue, 14 Nov 2023 22:13:50 GMT") == pytest.approx(30.0)
    assert bilder._retry_after("12") == 12.0
    assert bilder._retry_after("quatsch") is None


# --- Laden ------------------------------------------------------------------------------------

def _treffer(**anders) -> bilder.Treffer:
    werte = dict(titel="File:Camp Nou – Tribüne (2014).JPG", seiten_id=34595480,
                 seite="https://commons.wikimedia.org/wiki/File:Camp_Nou.jpg",
                 url="https://upload.wikimedia.org/wikipedia/commons/a/ab/Camp_Nou.JPG",
                 vorschau_url="https://upload.wikimedia.org/x/1280px-Camp_Nou.JPG.jpg",
                 breite=5240, hoehe=2732, mime="image/jpeg", bytes=1000, sha1=None,
                 urheber="Luis Miguel Bugallo Sánchez (Lmbuga)", lizenz="CC BY-SA 3.0",
                 lizenz_art="cc-by-sa", lizenz_url="https://creativecommons.org/licenses/by-sa/3.0",
                 datum="2014-04-08 10:57:09", beschreibung=None, abgerufen="2026-10-28")
    werte.update(anders)
    return bilder.Treffer(**werte)


def test_lade_original_prueft_sha1_und_schreibt_in_ordner(uhr, netz, tmp_path):
    daten = b"\xff\xd8 echtes jpeg"
    n = netz(daten)
    t = _treffer(sha1=hashlib.sha1(daten).hexdigest())
    pfad = bilder.lade(t, f"{tmp_path}/fotos/")
    assert pfad == tmp_path / "fotos" / "camp-nou-tribuene-2014.jpg"
    assert pfad.read_bytes() == daten
    assert n.anfragen[0].full_url == t.url
    assert n.anfragen[0].get_header("User-agent") == bilder.USER_AGENT
    assert not list((tmp_path / "fotos").glob("*.teil"))


def test_lade_falsche_pruefsumme_schreibt_nichts(uhr, netz, tmp_path):
    netz(b"kaputt")
    with pytest.raises(bilder.BildFehler, match="Prüfsumme"):
        bilder.lade(_treffer(sha1="0" * 40), tmp_path / "foto.jpg")
    assert not list(tmp_path.iterdir())


def test_lade_vorschau_und_zu_grosses_original(uhr, netz, tmp_path):
    n = netz(b"a", b"b")
    bilder.lade(_treffer(), tmp_path / "a.jpg", vorschau=True)
    bilder.lade(_treffer(bytes=bilder.MAX_DATEI_BYTES + 1, sha1="f" * 40), tmp_path / "b.jpg")
    assert [a.full_url for a in n.anfragen] == [_treffer().vorschau_url] * 2


def _video(**anders) -> bilder.Treffer:
    werte = dict(titel="File:Camp Nou Fans 2015.webm", mime="video/webm", bytes=90_000_000,
                 url="https://upload.wikimedia.org/wikipedia/commons/c/cd/Camp_Nou_Fans_2015.webm",
                 vorschau_url="https://upload.wikimedia.org/x/640px--Camp_Nou_Fans_2015.webm.jpg",
                 lizenz="CC BY 4.0", lizenz_art="cc-by")
    werte.update(anders)
    return _treffer(**werte)


def test_grosses_video_wird_nie_still_zum_standbild(uhr, netz, tmp_path):
    n = netz()
    with pytest.raises(bilder.BildFehler, match="video_fassungen"):
        bilder.lade(_video(), tmp_path)                               # 90 MB > 40 MB
    with pytest.raises(bilder.BildFehler, match="Standbild"):
        bilder.lade(_video(bytes=1000), tmp_path, vorschau=True)      # Vorschau = JPG
    assert n.anfragen == []                                           # nichts geladen


VIDEOINFO = {"query": {"pages": [{"pageid": 9, "title": "File:Camp Nou Fans 2015.webm", "videoinfo": [{
    "derivatives": [
        {"src": "https://upload.wikimedia.org/wikipedia/commons/c/cd/Camp_Nou_Fans_2015.webm",
         "type": "video/webm", "width": 1920, "height": 1080, "bandwidth": 9_000_000},
        {"src": "https://upload.wikimedia.org/wikipedia/commons/transcoded/c/cd/Camp_Nou_Fans_2015.webm/"
                "Camp_Nou_Fans_2015.webm.720p.vp9.webm", "type": "video/webm; codecs=\"vp9\"",
         "width": 1280, "height": 720, "bandwidth": 1_500_000, "transcodekey": "720p.vp9.webm"},
        {"src": "https://upload.wikimedia.org/wikipedia/commons/transcoded/c/cd/Camp_Nou_Fans_2015.webm/"
                "Camp_Nou_Fans_2015.webm.480p.vp9.webm", "type": "video/webm; codecs=\"vp9\"",
         "width": 854, "height": 480, "bandwidth": 700_000, "transcodekey": "480p.vp9.webm"},
    ]}]}]}}


def test_video_fassungen_ohne_original_kleinste_zuerst(uhr, netz, tmp_path):
    n = netz(VIDEOINFO, b"webm-daten")
    fassungen = bilder.video_fassungen(_video())
    p = n.params()
    assert p["prop"] == "videoinfo" and p["viprop"] == "derivatives"
    assert [f["schluessel"] for f in fassungen] == ["480p.vp9.webm", "720p.vp9.webm"]
    pfad = bilder.lade(_video(sha1="0" * 40), tmp_path, fassung=fassungen[0])
    assert n.anfragen[1].full_url == fassungen[0]["url"]
    assert pfad.suffix == ".webm" and pfad.read_bytes() == b"webm-daten"   # keine SHA-1-Prüfung
    with pytest.raises(bilder.BildFehler):
        bilder.video_fassungen(_treffer())                            # ein Foto hat keine Fassungen


def test_personen_brauchen_freigabe(uhr, netz, tmp_path):
    antwort = json.loads(json.dumps(SUCHE))
    antwort["query"]["pages"][4]["imageinfo"][0]["extmetadata"]["Restrictions"] = {"value": "personality"}
    netz(antwort)
    with pytest.warns(bilder.BildHinweis, match="personality"):
        treffer = bilder.suche("Ball")
    ball = next(t for t in treffer if t.titel == "File:Ball.jpg")
    assert ball.zeigt_personen
    n = netz(b"jpeg")
    with pytest.raises(bilder.BildFehler, match="personen_freigabe"):
        bilder.lade(ball, tmp_path / "a.jpg", vorschau=True)
    assert n.anfragen == []
    bilder.lade(ball, tmp_path / "a.jpg", vorschau=True,
                personen_freigabe="Fußballprofi in seiner Rolle, Spielszene")
    e = bilder.credits_eintrag(ball, "a.jpg", personen_freigabe="Fußballprofi in seiner Rolle")
    assert e["personen_freigabe"] and e["einschraenkungen"] == ["personality"]


def test_vorlagen_der_dateiseite(uhr, netz):
    n = netz({"query": {"pages": [{"pageid": 5, "title": "File:Ball.jpg", "templates": [
        {"ns": 10, "title": "Template:PD-old-100-expired"}, {"ns": 10, "title": "Template:Information"}]}]}})
    assert bilder.vorlagen("Ball.jpg") == ["Information", "PD-old-100-expired"]
    assert n.params()["prop"] == "templates" and n.params()["titles"] == "File:Ball.jpg"


# Vorlagen eines Fotos wie dem Prößdorf-Foto im Gold-Video (gekürzt): Lizenz frei, aber zwei
# Auflagen außerhalb des Urheberrechts. Die DFL-Seite ist eine Benutzerseite (Namensraum 2).
VORLAGEN_DFL = {"query": {"pages": [{"pageid": 117528166, "title": "File:Lewandowski StP.jpg", "templates": [
    {"ns": 10, "title": "Template:Cc-by-sa-4.0"}, {"ns": 10, "title": "Template:Non-copyright restriction"},
    {"ns": 10, "title": "Template:Personality rights"}, {"ns": 2, "title": "User:Stepro/DFL"}]}]}}


def test_vorlagen_melden_auflagen_ausserhalb_des_urheberrechts(uhr, netz):
    n = netz(VORLAGEN_DFL)
    with pytest.warns(bilder.BildHinweis, match="User:Stepro/DFL"):
        liste = bilder.vorlagen("Lewandowski StP.jpg")
    assert n.params()["tlnamespace"] == "10|2"                       # Benutzerseiten mit abfragen
    assert liste == ["Cc-by-sa-4.0", "Non-copyright restriction", "Personality rights",
                     "User:Stepro/DFL"]                               # Benutzerseite behält Präfix
    assert bilder.auflagen(liste) == ["Non-copyright restriction", "User:Stepro/DFL"]


def test_vorlagen_ohne_auflage_bleiben_still(uhr, netz):
    netz({"query": {"pages": [{"pageid": 5, "title": "File:Ball.jpg", "templates": [
        {"ns": 10, "title": "Template:Cc-zero"}, {"ns": 2, "title": "User:Fotograf/Credit"}]}]}})
    with warnings.catch_warnings():
        warnings.simplefilter("error", bilder.BildHinweis)            # jeder Hinweis wäre ein Fehler
        assert bilder.vorlagen("Ball.jpg") == ["Cc-zero", "User:Fotograf/Credit"]


@pytest.mark.parametrize("vorlage, ist_auflage", [
    ("Non-copyright restriction", True),
    ("Non-copyright restriction/en", True),
    ("non-copyright restrictions", True),
    ("User:Stepro/DFL", True),
    ("User:Anderer Fotograf/DFL/de", True),
    ("User:Stepro/Credit", False),
    ("Personality rights", False),               # steht in Treffer.einschraenkungen, nicht hier
    ("Cc-by-sa-4.0", False),
    ("DFL-Logo", False),
])
def test_auflagen_muster(vorlage, ist_auflage):
    assert bilder.auflagen([vorlage]) == ([vorlage] if ist_auflage else [])


def test_credits_eintrag_vermerkt_auflagen_und_abwaegung():
    vl = ["Cc-by-sa-4.0", "Non-copyright restriction", "User:Stepro/DFL"]
    with pytest.warns(bilder.BildHinweis, match="auflagen_abwaegung"):
        e = bilder.credits_eintrag(_treffer(), "a.jpg", lizenz_vorlagen=vl)
    assert e["auflagen"] == ["Non-copyright restriction", "User:Stepro/DFL"]
    assert e["auflagen_abwaegung"] is None
    with warnings.catch_warnings():
        warnings.simplefilter("error", bilder.BildHinweis)
        e = bilder.credits_eintrag(_treffer(), "a.jpg", lizenz_vorlagen=vl,
                                   auflagen_abwaegung="Ein Foto, keine Serie; redaktionell-erklärend")
        assert e["auflagen_abwaegung"].startswith("Ein Foto")
        assert bilder.credits_eintrag(_treffer(), "b.jpg")["auflagen"] is None          # nicht abgefragt
        assert bilder.credits_eintrag(_treffer(), "c.jpg", lizenz_vorlagen=["Cc-zero"])["auflagen"] == []


def test_kommandozeile_lade_schreibt_credits_mit_auflagen(uhr, netz, tmp_path, capsys):
    daten = b"\xff\xd8 jpeg"
    datei = seite(117528166, "File:Lewandowski StP.jpg", 1,
                  meta(LicenseShortName="CC BY-SA 4.0", License="cc-by-sa-4.0", Artist="Steffen Prößdorf",
                       DateTimeOriginal="2019-03-09", Restrictions="personality"),
                  size=len(daten), sha1=hashlib.sha1(daten).hexdigest())
    n = netz({"query": {"pages": [datei]}}, daten, VORLAGEN_DFL)     # Datei-Info, Datei, Vorlagen
    credits = tmp_path / "credits.json"
    with pytest.warns(bilder.BildHinweis) as hinweise:
        code = bilder._main(["lade", "File:Lewandowski StP.jpg", f"{tmp_path}/fotos/", "--credits",
                             str(credits), "--personen-freigabe", "Fußballprofi in seiner Rolle"])
    assert code == 0 and len(n.anfragen) == 3
    texte = [str(h.message) for h in hinweise]
    assert sum("personality" in t for t in texte) == 1                # Persönlichkeitsrecht
    assert sum("User:Stepro/DFL" in t for t in texte) == 1            # Auflage genau einmal
    eintrag = json.loads(credits.read_text(encoding="utf-8"))["quellen"][0]
    assert eintrag["auflagen"] == ["Non-copyright restriction", "User:Stepro/DFL"]
    assert eintrag["personen_freigabe"] == "Fußballprofi in seiner Rolle"
    ausgabe = json.loads(capsys.readouterr().out)
    assert ausgabe["datei"].endswith("fotos/lewandowski-stp.jpg")


# --- Namensnennung ----------------------------------------------------------------------------

@pytest.mark.parametrize("datum, jahr", [
    ("2014-04-08 10:57:09", "2014"),
    ("8. April 2014", "2014"),
    ("1890", "ca. 1890"),                                 # nackte Jahreszahl: vorsichtig
    ("[ca. 1890-1906]", "ca. 1890–1906"),                 # Library of Congress
    ("zwischen 1940 und 1949", "1940–1949"),
    ("um 1890", "ca. 1890"),
    ("circa 1920-05", "ca. 1920"),
    (None, None),
    ("unbekannt", None),
])
def test_jahr_wird_vorsichtig_gelesen(datum, jahr):
    assert _treffer(datum=datum).jahr == jahr


def test_objektdatum_ist_kein_fotojahr():
    ball = _treffer(urheber="Musée national du sport", lizenz="Public domain", lizenz_art="pd",
                    datum="zwischen 1940 und 1949")
    assert bilder.credit_zeilen(ball, objekt="Ball 1940er")[0] == (
        "Foto: Musée national du sport (Ball 1940er), gemeinfrei")
    e = bilder.credits_eintrag(ball, "ball.webp", objekt="Ball 1940er", bearbeitung="freigestellt")
    assert e["datum_foto"] is None and e["datum_objekt"] == "zwischen 1940 und 1949"
    assert e["datum_commons"] == "zwischen 1940 und 1949"
    # Ein geprüftes Jahr schlägt die Schätzung und wird mit Quelle vermerkt.
    arc = _treffer(urheber="Photoglob Co.", lizenz="Public domain", lizenz_art="pd", datum="1890")
    e = bilder.credits_eintrag(arc, "arc.jpg", jahr="ca. 1890–1906", jahr_quelle="LoC 2017660387")
    assert e["datum_foto"] == "ca. 1890–1906" and e["datum_foto_quelle"] == "LoC 2017660387"
    assert e["credit_zeile"].startswith("Foto: Photoglob Co., ca. 1890–1906, gemeinfrei")
    assert bilder.credit_zeilen(arc, jahr="")[0] == "Foto: Photoglob Co., gemeinfrei"



def test_credit_zeilen_enthalten_urheber_jahr_lizenz_und_link():
    zeilen = bilder.credit_zeilen(_treffer())
    assert zeilen == ["Foto: Luis Miguel Bugallo Sánchez (Lmbuga), 2014, CC BY-SA 3.0",
                      "commons.wikimedia.org/?curid=34595480"]
    assert bilder.credit_zeile(_treffer(), bearbeitet=True) == (
        "Foto: Luis Miguel Bugallo Sánchez (Lmbuga), 2014, CC BY-SA 3.0, "
        "commons.wikimedia.org/?curid=34595480, bearbeitet")


def test_credit_kurz_trennt_zeile_und_link():
    # Form wie im Gold-Video: Zeile mit Urheber, Jahr, Lizenz und Vermerk; der Link für sich.
    foto = _treffer(urheber="Steffen Prößdorf", lizenz="CC BY-SA 4.0", datum="2019-03-09",
                    seiten_id=117528166)
    zeile, link = bilder.credit_kurz(foto, bearbeitet=True)
    assert zeile == "Foto: Steffen Prößdorf, 2019, CC BY-SA 4.0, bearb."
    assert link == "commons.wikimedia.org/?curid=117528166"           # ohne Vermerk, darf weichen
    assert bilder.credit_kurz(foto) == (bilder.credit_zeilen(foto)[0], link)
    ball = _treffer(urheber="Musée national du sport", lizenz="Public domain", lizenz_art="pd",
                    datum="zwischen 1940 und 1949")
    assert bilder.credit_kurz(ball, objekt="Ball 1940er")[0] == (
        "Foto: Musée national du sport (Ball 1940er), gemeinfrei")


def test_credit_zeilen_gemeinfrei_video_ohne_jahr():
    pd = _treffer(lizenz="Public domain", lizenz_art="pd", datum=None, urheber="Carles Fargas")
    assert bilder.credit_zeilen(pd)[0] == "Foto: Carles Fargas, gemeinfrei"
    video = _treffer(mime="video/webm", lizenz="CC0", lizenz_art="cc0")
    assert bilder.credit_zeilen(video)[0].startswith("Video: ")
    loc = _treffer(lizenz="No restrictions", lizenz_art="ohne-bekannte-rechte", datum="um 1890")
    assert bilder.credit_zeilen(loc)[0].endswith("ca. 1890, ohne bekannte Rechte")


def test_credits_eintrag_vermerkt_sharealike_bei_bearbeitung():
    e = bilder.credits_eintrag(_treffer(), "assets/fotos/camp-nou.jpg",
                               bearbeitung="Duoton #12343B → #E8C77A, Ausschnitt 9:16")
    for feld in ("urheber", "lizenz", "lizenz_url", "quelle", "kurzlink", "abgerufen",
                 "datum_commons", "datum_foto"):
        assert e[feld]
    assert e["datum_foto"] == "2014" and e["datum_objekt"] is None
    assert e["datum_foto_quelle"].startswith("Commons-Datum")
    assert bilder.credits_eintrag(_treffer(datum="1923"), "x.jpg")["datum_foto_quelle"].startswith("Schätzung")
    assert "ShareAlike" in e["lizenz_bearbeitung"] and "CC BY-SA 3.0" in e["lizenz_bearbeitung"]
    assert e["credit_zeile"].endswith(", bearbeitet")
    assert e["kurzlink"] == "https://commons.wikimedia.org/?curid=34595480"
    by = bilder.credits_eintrag(_treffer(lizenz="CC BY 2.0", lizenz_art="cc-by"), "a.jpg",
                                bearbeitung="Graustufen")
    assert "ShareAlike" not in by["lizenz_bearbeitung"]
    assert bilder.credits_eintrag(_treffer(), "a.jpg")["lizenz_bearbeitung"] is None


def test_schreibe_credits_ersetzt_gleiche_datei(tmp_path):
    pfad = tmp_path / "credits.json"
    bilder.schreibe_credits(pfad, bilder.credits_eintrag(_treffer(), "b.jpg"), video="probe")
    bilder.schreibe_credits(pfad, bilder.credits_eintrag(_treffer(urheber="Neu"), "b.jpg"))
    bilder.schreibe_credits(pfad, bilder.credits_eintrag(_treffer(), "a.jpg"))
    inhalt = json.loads(pfad.read_text(encoding="utf-8"))
    assert inhalt["video"] == "probe"
    assert [q["datei"] for q in inhalt["quellen"]] == ["a.jpg", "b.jpg"]
    assert inhalt["quellen"][1]["urheber"] == "Neu"


def test_dateiname_und_textbereinigung():
    assert bilder.dateiname(_treffer(), vorschau=True) == "camp-nou-tribuene-2014.jpg"
    # Commons hängt utm-Parameter an; die Endung kommt trotzdem aus dem Pfad.
    mit_utm = _treffer(url="https://upload.wikimedia.org/a/ab/X.tif?utm_source=commons.wikimedia.org"
                           "&utm_content=original")
    assert bilder.dateiname(mit_utm) == "camp-nou-tribuene-2014.tif"
    assert bilder._text("Mutari 21:43, 20 September 2007 (UTC)") == "Mutari"
    assert bilder._text("Musée national du sport. 2006.26.1 {{ARK-BNF{{|}}ark:/12148/x}}") == (
        "Musée national du sport. 2006.26.1")
    # Akzente fallen weg; lange, gleich beginnende Titel bekommen eine Prüfsumme und kollidieren nicht.
    assert bilder.dateiname(_treffer(titel="File:Més que un club.jpg")) == "mes-que-un-club.jpg"
    lang = "File:Collections Musée National du Sport. Collections Instruments et matériels. Ballon - {}.jpg"
    a, b = (bilder.dateiname(_treffer(titel=lang.format(x))) for x in ("btv1", "btv2"))
    assert a != b and len(a) <= 61 and a.startswith("collections-musee-national-du-sport")
    assert bilder._text("A &amp; B <b>fett</b>\n  C") == "A & B fett C"


# --- Behandlungen -----------------------------------------------------------------------------

def _verlauf(tmp_path):
    """Bild 256 × 4: links schwarz, rechts weiß."""
    bild = Image.new("L", (256, 4))
    bild.putdata([x for _ in range(4) for x in range(256)])
    pfad = tmp_path / "verlauf.png"
    bild.save(pfad)
    return pfad


@braucht_pillow
def test_duoton_bildet_schwarz_und_weiss_auf_die_farben_ab(tmp_path):
    aus = bilder.duoton(_verlauf(tmp_path), "#12343B", "#E8C77A", tmp_path / "d.png",
                        autokontrast=0)
    bild = Image.open(aus).convert("RGB")
    assert bild.getpixel((0, 1)) == (0x12, 0x34, 0x3B)
    assert bild.getpixel((255, 1)) == (0xE8, 0xC7, 0x7A)
    with pytest.raises(bilder.BildFehler):
        bilder.duoton(_verlauf(tmp_path), "petrol", "#E8C77A", tmp_path / "x.png")


@braucht_pillow
def test_graustufen_hat_keine_saettigung(tmp_path):
    farbig = Image.new("RGB", (8, 8), (200, 30, 40))
    pfad = tmp_path / "rot.png"
    farbig.save(pfad)
    aus = Image.open(bilder.graustufen(pfad, tmp_path / "g.png", autokontrast=0)).convert("RGB")
    r, g, b = aus.getpixel((3, 3))
    assert r == g == b
    # Rotfilter: Rot wird hell, Blau dunkel (Camp Nou: gelbe Schrift auf blauen Rängen).
    blau = tmp_path / "blau.png"
    Image.new("RGB", (8, 8), (30, 60, 200)).save(blau)
    hell = Image.open(bilder.graustufen(pfad, tmp_path / "r.png", autokontrast=0,
                                        gewichte=(0.85, 0.15, 0))).getpixel((3, 3))
    dunkel = Image.open(bilder.graustufen(blau, tmp_path / "b.png", autokontrast=0,
                                          gewichte=(0.85, 0.15, 0))).getpixel((3, 3))
    assert abs(hell - (0.85 * 200 + 0.15 * 30)) <= 1 and dunkel < 40


def test_freistellen_ohne_werkzeug_gibt_none_mit_hinweis(monkeypatch, tmp_path):
    import shutil
    monkeypatch.setattr(shutil, "which", lambda name: None)    # kein hyperframes im PATH
    monkeypatch.setitem(sys.modules, "rembg", None)          # import rembg -> ImportError
    with pytest.warns(bilder.BildHinweis, match="rembg"):
        assert bilder.freistellen(tmp_path / "egal.jpg") is None


def test_freistellen_nimmt_hyperframes_cli(monkeypatch, tmp_path):
    import shutil
    import subprocess
    aufrufe = []

    def laufe(befehl, **kw):
        aufrufe.append(befehl)
        (tmp_path / "ding-frei.png").write_bytes(b"png")
        return subprocess.CompletedProcess(befehl, 0)

    monkeypatch.setattr(shutil, "which", lambda name: "/usr/bin/hyperframes")
    monkeypatch.setattr(subprocess, "run", laufe)
    assert bilder.freistellen(tmp_path / "ding.jpg") == tmp_path / "ding-frei.png"
    assert aufrufe == [["/usr/bin/hyperframes", "remove-background", str(tmp_path / "ding.jpg"),
                        "-o", str(tmp_path / "ding-frei.png")]]


@braucht_pillow
def test_freistellen_heller_grund(tmp_path):
    bild = Image.new("RGB", (60, 40), (250, 250, 248))
    bild.paste((20, 20, 20), (20, 10, 40, 30))              # dunkler Gegenstand in der Mitte
    pfad = tmp_path / "gegenstand.jpg"
    bild.save(pfad, quality=95)
    frei = Image.open(bilder.freistellen_heller_grund(pfad, weich_px=0))
    assert frei.mode == "RGBA"
    assert frei.getpixel((1, 1))[3] == 0                    # Grund durchsichtig
    assert frei.getpixel((30, 20))[3] == 255                # Gegenstand deckend
