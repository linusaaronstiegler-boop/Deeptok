"""Tests für factory/casting.py: Trockenlauf ohne Netz, Blindheit der Seite, Auswertung, Testtexte.

Der wichtigste Test: Auf der Vergleichsseite und in keinem Dateinamen darf ein Anbieter,
ein Modell oder eine Stimme erkennbar sein. Sonst ist der Blindtest keiner.
"""
from __future__ import annotations

import base64
import http.client
import json
import re
import shutil
import sys
from pathlib import Path

import pytest

FABRIK_DIR = Path(__file__).resolve().parent.parent
if str(FABRIK_DIR) not in sys.path:
    sys.path.insert(0, str(FABRIK_DIR))

import casting                                          # noqa: E402
from werk import stimme as stimm_paket                  # noqa: E402
from werk.stimme import basis                           # noqa: E402

pytestmark = pytest.mark.skipif(shutil.which("ffmpeg") is None, reason="ffmpeg fehlt")


def verbotene_woerter() -> list[str]:
    """Alles, was einen Anbieter verraten würde: Namen, Modelle, Stimm-IDs und -Namen."""
    woerter = {"elevenlabs", "eleven", "inworld", "cartesia", "sonic", "azure", "microsoft",
               "dragonhd", "florian", "seraphina", "conrad", "johannes", "helmut", "piper"}
    for anbieter in stimm_paket.ANBIETER:
        s = stimm_paket.lade_stimme(anbieter)
        woerter |= {anbieter, s["modell"].lower()}
        woerter |= {k["id"].lower() for k in s.get("kandidaten", [])}
        if s["stimm_id"] != basis.PLATZHALTER:      # gepinnte Stimme tritt im Trockenlauf an
            woerter.add(s["stimm_id"].lower())
    return sorted(woerter)


@pytest.fixture(autouse=True)
def kein_netz(monkeypatch):
    for v in ("ELEVENLABS_API_KEY", "INWORLD_API_KEY", "CARTESIA_API_KEY", "AZURE_SPEECH_KEY"):
        monkeypatch.delenv(v, raising=False)

    def verboten(anfrage):
        raise AssertionError(f"Netzzugriff im Trockenlauf: {anfrage.url}")
    monkeypatch.setattr(basis, "TRANSPORT", verboten)


def trockenlauf(tmp_path, *extra) -> tuple[Path, dict]:
    code = casting.main(["--trocken", "--ausgabe", str(tmp_path), "--datum", "2026-10-27",
                         "--seed", "7", "--no-messen", *extra])
    assert code == 0
    return tmp_path / "2026-10-27", aufloesung(tmp_path / "2026-10-27")


def aufloesung(seite: Path) -> dict:
    """Die Auflösung liegt im Nachbarordner <seite>-aufloesung, nie neben der Seite."""
    return json.loads((tmp_geheim(seite) / "aufloesung.json").read_text(encoding="utf-8"))


def tmp_geheim(seite: Path) -> Path:
    return seite.with_name(seite.name + "-aufloesung")


def seitendaten(ordner: Path) -> dict:
    html = (ordner / "index.html").read_text(encoding="utf-8")
    roh = re.search(r"const D = (\{.*?\});\n", html, re.S).group(1)
    return json.loads(roh.replace("<\\/", "</"))


def test_trockenlauf_baut_blinde_seite(tmp_path):
    ordner, aufl = trockenlauf(tmp_path)
    proben = sorted(ordner.glob("s*.mp3"))
    assert len(proben) == 16                       # 4 Anbieter x 4 Texte
    assert {c["anbieter"] for c in aufl["clips"].values()} == set(stimm_paket.ANBIETER)
    assert len(aufl["paare"]) == 24                # je Text 4 über 2 = 6 Paare

    html = (ordner / "index.html").read_text(encoding="utf-8")
    assert '<meta name="viewport"' in html and "noindex" in html
    for farbe in ("#0E1726", "#1F3864", "#C9A84C", "#F5F0E8"):
        assert farbe in html
    assert "Playfair Display" in html and "Inter" in html
    assert "localStorage" in html and "try" in html

    # Im teilbaren Ordner liegt NUR die Seite mit ihren Proben: keine Auflösung, keine
    # Originale (deren Endung und Abtastrate den Anbieter verraten), keine Messung.
    assert {p.name for p in ordner.iterdir()} == {"index.html"} | {p.name for p in proben}
    assert (tmp_geheim(ordner) / "aufloesung.json").is_file()

    # Blindheit: weder im HTML noch in einem Dateinamen noch in den Audio-Bytes ein Anbieter.
    verboten = verbotene_woerter()
    klein = html.lower()
    for wort in verboten:
        assert wort not in klein, f"'{wort}' steht in index.html"
    for pfad in ordner.rglob("*"):
        for wort in verboten:
            assert wort not in pfad.name.lower(), f"'{wort}' im Dateinamen {pfad.name}"
    for probe in proben:
        inhalt = probe.read_bytes().lower()
        for wort in verboten:
            assert wort.encode() not in inhalt, f"'{wort}' in den Bytes von {probe.name}"


def test_paare_vergleichen_gleichen_text_verschiedene_stimmen(tmp_path):
    ordner, aufl = trockenlauf(tmp_path)
    daten = seitendaten(ordner)
    assert daten["paare"] == [{k: p[k] for k in ("id", "text", "a", "b")} for p in aufl["paare"]]
    for p in aufl["paare"]:
        a, b = aufl["clips"][p["a"]], aufl["clips"][p["b"]]
        assert a["text"] == b["text"] == p["text"]
        assert a["teilnehmer"] != b["teilnehmer"]
        assert (ordner / f"{p['a']}.mp3").is_file() and (ordner / f"{p['b']}.mp3").is_file()
    # Der Zufall verteilt die Anbieter auf beide Seiten.
    seiten = {aufl["clips"][p["a"]]["anbieter"] for p in aufl["paare"]}
    assert len(seiten) >= 3
    # Die Seite zeigt den Text ohne Markup.
    assert all("*" not in t["text"] and "↑" not in t["text"] for t in daten["texte"].values())


def test_proben_sind_einheitlich_kodiert(tmp_path):
    ordner, aufl = trockenlauf(tmp_path)
    from werk import hoercheck                     # nur ffprobe, kein Whisper
    infos = {hoercheck.strom_info(p)["abtastrate_hz"] for p in ordner.glob("s*.mp3")}
    assert infos == {44100}
    # Die Originale sind unterschiedlich (mp3 und wav) und liegen anonym unter roh/ im
    # Auflösungsordner, mit eigener Nummerierung (r07 gehört nicht zwingend zu s07).
    assert {Path(c["roh"]).suffix for c in aufl["clips"].values()} == {".mp3", ".wav"}
    assert all(re.fullmatch(r"r\d\d\.(mp3|wav)", Path(c["roh"]).name) for c in aufl["clips"].values())
    assert all((tmp_geheim(ordner) / c["roh"]).is_file() for c in aufl["clips"].values())
    assert any(Path(c["roh"]).stem[1:] != cid[1:] for cid, c in aufl["clips"].items())


def test_eingebettete_seite_ohne_anbieternamen(tmp_path):
    ordner, _ = trockenlauf(tmp_path, "--einbetten")
    daten = seitendaten(ordner)
    assert all("b64" in c and "src" not in c for c in daten["clips"].values())
    erste = base64.b64decode(next(iter(daten["clips"].values()))["b64"])
    assert erste[0] == 0xFF and (erste[1] & 0xE0) == 0xE0         # beginnt mit einem MP3-Frame
    html = (ordner / "index.html").read_text(encoding="utf-8")
    ohne_audio = re.sub(r'"b64": ?"[A-Za-z0-9+/=]+"', '"b64": ""', html).lower()
    for wort in verbotene_woerter():
        assert wort not in ohne_audio


def test_nur_ein_anbieter_nimmt_alle_kandidaten(tmp_path):
    _, aufl = trockenlauf(tmp_path, "--nur", "azure")
    stimmen = {t["stimm_id"] for t in aufl["teilnehmer"].values()}
    assert len(stimmen) == 3 and all("DragonHD" in s for s in stimmen)
    assert len(aufl["paare"]) == 12                # 4 Texte x 3 Paare
    conrad = next(t for t in aufl["teilnehmer"].values() if "Omni" in t["stimm_id"])
    assert conrad["anbieter"] == "azure"


def test_unbekannter_anbieter(tmp_path, capsys):
    assert casting.main(["--trocken", "--nur", "piper", "--ausgabe", str(tmp_path)]) == 2
    assert "Unbekannte Anbieter" in capsys.readouterr().out


@pytest.mark.parametrize("leer", [",", "", " , "])
def test_leeres_nur_bricht_ab(tmp_path, capsys, leer):
    """Ein leeres --nur darf nicht still 'alle vier' bedeuten (im echten Lauf: alle zahlen)."""
    assert casting.main(["--trocken", "--nur", leer, "--ausgabe", str(tmp_path)]) == 2
    assert "--nur ohne Anbieter" in capsys.readouterr().out
    assert not any(tmp_path.iterdir())


def test_json_ausgabe_ist_ein_objekt(tmp_path, capsys):
    code = casting.main(["--trocken", "--ausgabe", str(tmp_path), "--datum", "x", "--seed", "1",
                         "--no-messen", "--json"])
    assert code == 0
    bericht = json.loads(capsys.readouterr().out)
    assert bericht["ok"] and bericht["clips"] == 16 and bericht["paare"] == 24
    assert bericht["trocken"] is True and bericht["gemessen"] is False


def test_vorhandener_ordner_wird_nicht_ueberschrieben(tmp_path):
    trockenlauf(tmp_path)
    assert casting.main(["--trocken", "--ausgabe", str(tmp_path), "--datum", "2026-10-27",
                         "--seed", "8", "--no-messen"]) == 0
    assert (tmp_path / "2026-10-27-2" / "index.html").is_file()
    assert (tmp_path / "2026-10-27-2-aufloesung" / "aufloesung.json").is_file()


def test_auswertung_zaehlt_siege(tmp_path):
    ordner, aufl = trockenlauf(tmp_path)
    # Hörer 1 wählt immer A, Hörer 2 immer B: Jede Stimme gewinnt so oft, wie sie auf der
    # gewählten Seite stand.
    h1 = f"DTC1;{aufl['casting_id']};H1;" + ",".join(p["id"] + "A" for p in aufl["paare"])
    h2 = f"DTC1;{aufl['casting_id']};H2;" + ",".join(p["id"] + "B" for p in aufl["paare"])
    bericht = casting.werte_aus(ordner, [h1, h2])
    rang = {z["teilnehmer"]: z for z in bericht["rangliste"]}
    assert sum(z["siege"] for z in rang.values()) == 2 * len(aufl["paare"])
    assert all(z["duelle"] == 4 * 3 * 2 for z in rang.values())  # 4 Texte x 3 Gegner x 2 Hörer
    for tid, z in rang.items():
        links = sum(1 for p in aufl["paare"] if aufl["clips"][p["a"]]["teilnehmer"] == tid)
        assert z["je_hoerer"]["H1"][0] == links
    with pytest.raises(ValueError):
        casting.werte_aus(ordner, ["DTC1;falsche-id;H1;p01A"])
    # Der Auflösungsordner geht genauso.
    assert casting.werte_aus(tmp_geheim(ordner), [h1])["casting_id"] == aufl["casting_id"]


def test_auswertung_robust_gegen_umbrueche_und_doppelte(tmp_path):
    ordner, aufl = trockenlauf(tmp_path)
    alle_a = ",".join(p["id"] + "A" for p in aufl["paare"])
    einmal = casting.werte_aus(ordner, [f"DTC1;{aufl['casting_id']};H1;{alle_a}"])
    # Aus dem Messenger: Zeilenumbrüche mitten drin, und zweimal eingefügt.
    zerbrochen = f"DTC1;{aufl['casting_id']};\nH1;" + alle_a.replace(",p0", ",\np0").replace("A,", "A, ", 3)
    doppelt = casting.werte_aus(ordner, [zerbrochen, zerbrochen])
    assert [z["siege"] for z in doppelt["rangliste"]] == [z["siege"] for z in einmal["rangliste"]]
    assert any("nur die letzte" in m for m in doppelt["meldungen"])
    with pytest.raises(ValueError, match="Unbekannte Paare p99"):
        casting.werte_aus(ordner, [f"DTC1;{aufl['casting_id']};H1;p01A,p99B"])
    with pytest.raises(ValueError, match="Unlesbarer Eintrag"):
        casting.werte_aus(ordner, [f"DTC1;{aufl['casting_id']};H1;p01A,p0"])
    # Noch nicht gewählte Paare ("p05-") zählen nicht.
    teilweise = casting.werte_aus(ordner, [f"DTC1;{aufl['casting_id']};H2;p01A,p02-"])
    assert sum(z["duelle"] for z in teilweise["rangliste"]) == 2


def test_messung_fehlt_wird_gemeldet(tmp_path, monkeypatch):
    import werk
    # Modul "verstecken": ohne Attribut am Paket und mit None in sys.modules wirft der Import.
    monkeypatch.delattr(werk, "hoercheck", raising=False)
    monkeypatch.setitem(sys.modules, "werk.hoercheck", None)
    meldungen: list[str] = []
    assert casting.miss_alle({"clips": {"s01": {}}}, tmp_path, meldungen) is None
    assert "Messung übersprungen" in meldungen[0]


def test_messfehler_kostet_weder_seite_noch_aufloesung(tmp_path, monkeypatch, capsys):
    """Whisper-Modell nicht ladbar o. Ä.: Lauf endet normal, Seite und Auflösung sind da,
    die Messung lässt sich mit --fortsetzen nachholen."""
    from werk import hoercheck

    def kaputt(*_a, **_k):
        raise RuntimeError("Cannot find an appropriate cached snapshot folder")
    monkeypatch.setattr(hoercheck, "pruefe", kaputt)
    code = casting.main(["--trocken", "--messen", "--nur", "azure", "--ausgabe", str(tmp_path),
                         "--datum", "d", "--seed", "1", "--json"])
    bericht = json.loads(capsys.readouterr().out)
    assert code == 0 and bericht["clips"] == 12 and bericht["gemessen"] is False
    assert any(m.startswith("Messung abgebrochen bei s") and "--fortsetzen" in m
               for m in bericht["meldungen"])
    assert (tmp_path / "d" / "index.html").is_file()
    assert len(aufloesung(tmp_path / "d")["clips"]) == 12

    # Nachholen: misst nur, was fehlt, und schreibt messung.json.
    gemessen: list[str] = []

    def heil(pfad, soll, **_k):
        gemessen.append(Path(pfad).name)
        return {"wer": 0.0, "transkript": soll, "lufs": -16.0, "woerter_pro_s": 2.3}
    monkeypatch.setattr(hoercheck, "pruefe", heil)
    assert casting.main(["--fortsetzen", str(tmp_path / "d"), "--messen", "--json"]) == 0
    bericht = json.loads(capsys.readouterr().out)
    assert bericht["gemessen"] and len(gemessen) == 12
    messung = json.loads((tmp_path / "d-aufloesung" / "messung.json").read_text(encoding="utf-8"))
    assert len(messung) == 12 and all(m["namens_treffer"] for m in messung.values())
    assert casting.main(["--fortsetzen", str(tmp_path / "d"), "--messen", "--json"]) == 0
    assert len(gemessen) == 12                     # nichts doppelt gemessen
    capsys.readouterr()


def test_abbruch_mitten_im_lauf_verliert_keine_zuordnung(tmp_path, monkeypatch):
    """Strg-C nach der 5. Probe: Die Auflösung kennt trotzdem jede Probe; --fortsetzen
    vertont nur die fehlenden und baut erst dann die Seite."""
    echt = casting.transkodiere
    aufrufe = []

    def bricht_ab(roh, ziel):
        aufrufe.append(ziel.name)
        if len(aufrufe) == 6:
            raise KeyboardInterrupt
        echt(roh, ziel)
    monkeypatch.setattr(casting, "transkodiere", bricht_ab)
    with pytest.raises(KeyboardInterrupt):
        casting.main(["--trocken", "--ausgabe", str(tmp_path), "--datum", "d", "--seed", "2",
                      "--no-messen"])
    plan = aufloesung(tmp_path / "d")
    status = [c["status"] for c in plan["clips"].values()]
    assert len(status) == 16 and status.count("fertig") == 5
    # Die 6. Probe war schon bezahlt und gespeichert, nur nicht umkodiert: Sie ist verbucht.
    assert sum(1 for c in plan["clips"].values() if c["roh"]) == 6
    assert all(c["anbieter"] for c in plan["clips"].values())       # Zuordnung steht schon
    assert not (tmp_path / "d" / "index.html").exists()

    monkeypatch.setattr(casting, "transkodiere", echt)
    assert casting.main(["--fortsetzen", str(tmp_path / "d-aufloesung"), "--no-messen"]) == 0
    plan = aufloesung(tmp_path / "d")
    assert all(c["status"] == "fertig" for c in plan["clips"].values())
    assert len(plan["paare"]) == 24 and (tmp_path / "d" / "index.html").is_file()


def test_eine_kaputte_probe_faellt_allein_aus(tmp_path, monkeypatch, capsys):
    echt = casting.transkodiere

    def eine_kaputt(roh, ziel):
        if ziel.name == "s03.mp3":
            raise RuntimeError("ffmpeg scheiterte")
        echt(roh, ziel)
    monkeypatch.setattr(casting, "transkodiere", eine_kaputt)
    code = casting.main(["--trocken", "--ausgabe", str(tmp_path), "--datum", "d", "--seed", "2",
                         "--no-messen", "--json"])
    bericht = json.loads(capsys.readouterr().out)
    assert code == 0 and bericht["clips"] == 15 and bericht["fehlen"] == 1
    assert any("--fortsetzen" in m for m in bericht["meldungen"])
    plan = aufloesung(tmp_path / "d")
    assert plan["clips"]["s03"]["status"] == "fehler"
    assert all("s03" not in (p["a"], p["b"]) for p in plan["paare"])
    alte_id = plan["casting_id"]
    # Nachholen: Das Original liegt schon da und wird NICHT neu bezahlt; die Seite bekommt
    # eine neue ID, damit gespeicherte Antworten nicht auf neue Paare zeigen.
    monkeypatch.setattr(casting, "transkodiere", echt)
    assert casting.main(["--fortsetzen", str(tmp_path / "d"), "--no-messen", "--json"]) == 0
    bericht = json.loads(capsys.readouterr().out)
    assert bericht["clips"] == 16 and bericht["fehlen"] == 0
    assert bericht["casting_id"] != alte_id


def test_echter_ablauf_mit_attrappe(tmp_path, monkeypatch, capsys):
    """Ohne --trocken, aber gegen eine Attrappe: ElevenLabs antwortet 401 (kein Schlüssel)
    und fällt aus; die anderen drei listen Stimmen, vertonen und landen auf der Seite."""
    import wave
    with wave.open(str(casting.FIXTURES / "probe_b.wav")) as w:
        pcm = w.readframes(w.getnframes())
    mp3 = (casting.FIXTURES / "probe_a.mp3").read_bytes()
    gesehen: list[str] = []

    def router(a: basis.Anfrage) -> basis.Antwort:
        gesehen.append(f"{a.methode} {a.url}")
        def j(daten):
            return basis.Antwort(200, {}, json.dumps(daten).encode())
        if "elevenlabs" in a.url:
            return basis.Antwort(401, {}, b'{"detail":"missing api key"}')
        if a.url.endswith("/voices/v1/voices?languages=de"):
            return j({"voices": [{"voiceId": "iw-m", "displayName": "M", "gender": "MALE"},
                                 {"voiceId": "iw-w", "displayName": "W", "gender": "FEMALE"}]})
        if a.url.endswith("/tts/v1/voice"):
            assert a.json()["voiceId"] == "iw-m"
            return j({"audioContent": base64.b64encode(mp3).decode()})
        if "api.cartesia.ai/voices" in a.url:
            return j({"data": [{"id": "ca-w", "name": "W", "gender": "feminine"}]})
        if a.url.endswith("/tts/sse"):
            ereignis = {"type": "chunk", "data": base64.b64encode(pcm).decode()}
            return basis.Antwort(200, {}, f"data: {json.dumps(ereignis)}\n\ndata: {{\"type\":\"done\"}}\n\n".encode())
        if a.url.endswith("/cognitiveservices/voices/list"):
            return j([{"ShortName": "de-DE-Florian:DragonHDLatestNeural", "Locale": "de-DE", "Gender": "Male"}])
        if a.url.endswith("/cognitiveservices/v1"):
            return basis.Antwort(200, {}, mp3)
        raise AssertionError(f"unerwartet: {a.url}")
    monkeypatch.setattr(basis, "TRANSPORT", router)

    code = casting.main(["--ausgabe", str(tmp_path), "--datum", "echt", "--seed", "3",
                         "--no-messen", "--json"])
    bericht = json.loads(capsys.readouterr().out)
    assert code == 0, bericht
    assert bericht["clips"] == 12 and bericht["paare"] == 12          # 3 Stimmen x 4 Texte
    assert {z["anbieter"] for z in bericht["teilnehmer"]} == {"inworld", "cartesia", "azure"}
    assert any(m.startswith("elevenlabs: übersprungen, kein Schlüssel") for m in bericht["meldungen"])
    assert bericht["restguthaben"] == {"inworld": None, "cartesia": None, "azure": None}
    assert sum(1 for g in gesehen if g.startswith("POST")) == 12      # genau eine Synthese je Probe
    aufl = aufloesung(tmp_path / "echt")
    assert {Path(c["roh"]).suffix for c in aufl["clips"].values()} == {".mp3", ".wav"}
    html = (tmp_path / "echt" / "index.html").read_text(encoding="utf-8").lower()
    for wort in verbotene_woerter() + ["iw-m", "ca-w"]:
        assert wort not in html


def _router_ohne_elevenlabs(gesehen: list[str], cartesia_reisst_ab: bool = False):
    mp3 = (casting.FIXTURES / "probe_a.mp3").read_bytes()

    def router(a: basis.Anfrage) -> basis.Antwort:
        gesehen.append(f"{a.methode} {a.url}")

        def j(daten):
            return basis.Antwort(200, {}, json.dumps(daten).encode())
        if "elevenlabs" in a.url:
            return basis.Antwort(401, {}, b'{"detail":"missing api key"}')
        if "/voices/v1/voices" in a.url:
            return j({"voices": [{"voiceId": "iw-m", "displayName": "M", "gender": "MALE"}]})
        if a.url.endswith("/tts/v1/voice"):
            return j({"audioContent": base64.b64encode(mp3).decode()})
        if "api.cartesia.ai/voices" in a.url:
            return j({"data": [{"id": "ca-w", "name": "W", "gender": "feminine"}]})
        if a.url.endswith("/tts/sse"):
            if cartesia_reisst_ab:
                raise http.client.IncompleteRead(b"data: {", 4000)
            ereignis = {"type": "chunk", "data": base64.b64encode(b"\0\0" * 4410).decode()}
            return basis.Antwort(200, {}, f"data: {json.dumps(ereignis)}\n\n".encode())
        if a.url.endswith("/cognitiveservices/voices/list"):
            return j([{"ShortName": "de-DE-Florian:DragonHDLatestNeural", "Locale": "de-DE", "Gender": "Male"}])
        if a.url.endswith("/cognitiveservices/v1"):
            return basis.Antwort(200, {}, mp3)
        raise AssertionError(f"unerwartet: {a.url}")
    return router


def test_abgerissene_uebertragung_kostet_nur_einen_anbieter(tmp_path, monkeypatch, capsys):
    """Cartesias SSE-Strom reißt jedes Mal ab: Cartesia fällt aus (je Probe höchstens zwei
    Versuche), die anderen laufen durch, und es gibt genau ein JSON-Objekt."""
    gesehen: list[str] = []
    monkeypatch.setattr(basis, "TRANSPORT", _router_ohne_elevenlabs(gesehen, cartesia_reisst_ab=True))
    monkeypatch.setattr(basis, "SCHLAFEN", lambda _s: None)
    code = casting.main(["--ausgabe", str(tmp_path), "--datum", "abriss", "--seed", "3",
                         "--no-messen", "--json"])
    bericht = json.loads(capsys.readouterr().out)
    assert code == 0 and bericht["clips"] == 8 and bericht["fehlen"] == 4
    assert sum(1 for g in gesehen if g.endswith("/tts/sse")) == 4 * 2
    assert sum(1 for m in bericht["meldungen"] if m.startswith("cartesia /") and "IncompleteRead" in m) == 4


def test_probe_kostet_nichts(tmp_path, monkeypatch, capsys):
    gesehen: list[str] = []
    monkeypatch.setattr(basis, "TRANSPORT", _router_ohne_elevenlabs(gesehen))
    assert casting.main(["--probe", "--json"]) == 1                 # ElevenLabs fehlt
    bericht = json.loads(capsys.readouterr().out)
    assert bericht["probe"]["elevenlabs"]["fehler"].startswith("kein Schlüssel")
    assert bericht["probe"]["azure"] == {"zugang": True, "deutsche_stimmen": 1, "restguthaben": None}
    assert not any(g.startswith("POST") for g in gesehen)             # nichts vertont

    gesehen.clear()
    assert casting.main(["--probe", "--probesatz", "--nur", "inworld,azure", "--json"]) == 0
    bericht = json.loads(capsys.readouterr().out)
    assert [g for g in gesehen if g.startswith("POST")] == [
        "POST https://api.inworld.ai/tts/v1/voice",
        "POST https://westeurope.tts.speech.microsoft.com/cognitiveservices/v1"]
    satz = bericht["probe"]["azure"]["probesatz"]
    assert satz["stimm_id"] == "de-DE-Florian:DragonHDLatestNeural" and satz["format"] == "mp3"
    assert bericht["probe"]["inworld"]["probesatz"]["stimm_id"] == "iw-m"


def test_seite_verlangt_fast_ganze_probe():
    """Wählen erst nach 90 % JEDER Probe; beim 60-s-Skript sonst nach 4 s möglich."""
    assert "const ANTEIL = 0.9;" in casting.SEITE
    assert "MIN_GEHOERT_S" not in casting.SEITE


# --------------------------------------------------------------------------------------------
# Die Testtexte selbst
# --------------------------------------------------------------------------------------------

def test_casting_texte_vollstaendig():
    daten = json.loads(casting.TEXTE_DATEI.read_text(encoding="utf-8"))
    texte = {t["id"]: t for t in daten["texte"]}
    assert list(texte) == ["hook", "frage", "widerlegung", "skript"]
    assert "?↑" in texte["frage"]["text"]
    assert "*nicht*" in texte["widerlegung"]["text"] and "*sondern*" in texte["widerlegung"]["text"]
    skript = texte["skript"]["text"]
    for muss in ("Lewandowski", "Barcelona", "Opportunitätskosten", "Opportunity Cost",
                 "Trade-off", "Cashflow", "344", "375", "45 Millionen", "5 Millionen", "2023"):
        assert muss in skript
    woerter = len(basis.reiner_text(skript).split())
    assert 110 <= woerter <= 160                   # etwa 60 s bei 2,0 bis 2,6 Wörtern/s
    for t in texte.values():
        for name in t["namen"]:
            assert name in t["text"]
    # CLAUDE.md: Fakten immer mit Quelle und Datum; hier mit URL der Primärquelle.
    assert all(f["quelle"] and f["datum"] and f["url"].startswith("https://") for f in daten["fakten"])
    assert "nennt das" not in texte["hook"]["text"]   # keine unbelegte Aussage des Vereins


def test_casting_texte_ohne_sperrwoerter():
    tore = pytest.importorskip("werk.tore")
    ergebnis = tore.lint([casting.TEXTE_DATEI])
    assert ergebnis["ok"], ergebnis["treffer"]
