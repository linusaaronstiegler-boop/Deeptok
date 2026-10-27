"""Tor G4: Normalisierung und Wortfehlerrate als Unit-Tests, Audio-Messungen an einem
synthetischen Ton und EIN Integrationstest mit der echten Probe (Marker "langsam")."""
from __future__ import annotations

import importlib.util
import json
import shutil
import subprocess

import pytest
from conftest import REPO_WURZEL

from werk import hoercheck
from werk.hoercheck import (ausrichtung, bewerte, normalisiere, soll_woerter, sprechtext,
                            sprechtempo, wer, wortfehlerrate)
from werk.konfig import STANDARD

hat_num2words = hoercheck._num2words is not None
braucht_num2words = pytest.mark.skipif(not hat_num2words, reason="num2words nicht installiert")
braucht_ffmpeg = pytest.mark.skipif(shutil.which("ffmpeg") is None, reason="ffmpeg fehlt")

PROBE = REPO_WURZEL / "studio" / "probe-opportunitaetskosten"


# --- Normalisierung ---------------------------------------------------------------------------

@pytest.mark.parametrize("roh, erwartet", [
    ("Falsch. Auch Behalten hat einen Preis!", "falsch auch behalten hat ein preis"),
    ("Satz fürs Gespräch: Die wahren Kosten …", "satz fürs gespräch die wahren kosten"),
    ("STRASSE und Straße", "strasse und strasse"),                 # casefold: ß -> ss
    ("Opportunitäts-Kosten", "opportunitätskosten"),               # Bindestrich im Wort
    ("geht's „so“?", "gehts so"),
    ("z. B. bzw. ca.", "zum beispiel beziehungsweise circa"),
    ("eine Million, einen Euro, eins", "ein million ein euro ein"),
])
def test_normalisiere_text(roh, erwartet):
    assert normalisiere(roh) == erwartet


@braucht_num2words
@pytest.mark.parametrize("roh, erwartet", [
    ("Sommer 2022", "sommer zweitausendzweiundzwanzig"),
    ("344 Tore in 8 Jahren", "dreihundertvierundvierzig tore in acht jahren"),
    ("45 Mio. €", "fünfundvierzig millionen euro"),
    ("45.000.000 Euro", "fünfundvierzig millionen euro"),
    ("2,6 Wörter", "zwei komma sechs wörter"),
    ("im Jahr 1989", "im jahr neunzehnhundertneunundachtzig"),     # Jahreszahl
    ("50 % von 0 Euro", "fünfzig prozent von null euro"),
    ("2-3 Mal", "zwei drei mal"),
    ("1 Million", "ein million"),
])
def test_normalisiere_zahlen(roh, erwartet):
    assert normalisiere(roh) == erwartet


def test_ohne_num2words_bleiben_ziffern(monkeypatch):
    monkeypatch.setattr(hoercheck, "_num2words", None)
    assert normalisiere("Barcelona zahlte 45 Mio. €.") == "barcelona zahlte 45 millionen euro"


def test_sprechtext_nimmt_die_gesprochene_seite():
    assert (sprechtext("Barcelona|Barsselona zahlte 45|fünfundvierzig Millionen Euro.")
            == "Barsselona zahlte fünfundvierzig Millionen Euro.")


def test_soll_woerter_mit_alternativen():
    woerter, alternativen = soll_woerter("Barcelona|Barsselona zahlte z. B. viel.")
    assert woerter == ["barsselona", "zahlte", "zum", "beispiel", "viel"]
    assert alternativen[0] == {"barcelona"} and alternativen[1] == frozenset()


# --- Wortfehlerrate ---------------------------------------------------------------------------

def test_wer_grundfaelle():
    assert wortfehlerrate([], []) == 0.0
    assert wortfehlerrate([], ["a"]) == 1.0
    assert wortfehlerrate("a b c d".split(), "a b c d".split()) == 0.0
    assert wortfehlerrate("a b c d".split(), "a x c d".split()) == 0.25     # ersetzt
    assert wortfehlerrate("a b c d".split(), "a c d".split()) == 0.25       # fehlt
    assert wortfehlerrate("a b c d".split(), "a b y c d".split()) == 0.25   # extra
    assert wortfehlerrate("a b".split(), "x y z w v".split()) == 1.0        # gekappt auf 1


def test_ausrichtung_nennt_die_abweichungen():
    fehler, abweichungen = ausrichtung("der wert der besten alternative".split(),
                                       "der wert besten alternativen".split())
    assert fehler == 2
    assert abweichungen == [{"art": "fehlt", "soll": "der", "ist": None},
                            {"art": "ersetzt", "soll": "alternative", "ist": "alternativen"}]


def test_andere_zusammenschreibung_ist_kein_fehler():
    assert wer("Bayern München verkauft", "Bayern-München verkauft") == 0.0
    assert wer("ablösefrei gehen können", "Ablöse freigehen können") == 0.0
    assert wer("Opportunitätskosten", "Oport-Unitätskosten") == 1.0          # echter Hörfehler


def test_anzeige_form_gilt_als_richtig():
    assert wer("Barcelona|Barsselona zahlte", "Barcelona zahlte") == 0.0
    assert wer("Barsselona zahlte", "Barcelona zahlte") == 0.5              # ohne Anzeige-Form


@braucht_num2words
def test_wer_mit_zahlen_und_satzzeichen():
    soll = "344|Dreihundertvierundvierzig Tore in acht Jahren. Für null Euro."
    ist = "344 Tore in 8 Jahren für 0 Euro"
    assert wer(soll, ist) == 0.0


# --- Bewertung und Tempo ----------------------------------------------------------------------

def test_sprechtempo_ohne_lange_pausen():
    woerter = [{"wort": "a", "start": 0.0, "ende": 0.5}, {"wort": "b", "start": 0.5, "ende": 1.0},
               {"wort": "c", "start": 3.0, "ende": 3.5}, {"wort": "d", "start": 3.5, "ende": 4.0}]
    assert sprechtempo(woerter, []) == 1.0                      # 4 Wörter in 4 s
    assert sprechtempo(woerter, [[1.0, 2.0]]) == 2.0            # ohne die 2-s-Denkpause
    assert sprechtempo([], []) == 0.0


def messung(**ueberschrieben) -> dict:
    gut = {"wer": 0.03, "lufs": -16.2, "true_peak_db": -1.5, "lange_stillen": [],
           "woerter_pro_s": 2.3, "abtastrate_hz": 44100, "bitrate_kbps": 128.0}
    return {**gut, **ueberschrieben}


def test_bewerte():
    assert bewerte(messung(), STANDARD) == []
    assert len(bewerte(messung(wer=0.2, lufs=-20.0, true_peak_db=0.1, woerter_pro_s=3.0,
                               abtastrate_hz=22050, bitrate_kbps=85.0), STANDARD)) == 6
    zwei_pausen = messung(lange_stillen=[[12.1, 3.2], [50.2, 2.3]])
    assert len(bewerte(zwei_pausen, STANDARD)) == 1
    assert bewerte(zwei_pausen, STANDARD, erlaubte_stillen=2) == []
    assert bewerte(messung(lufs=None), STANDARD)                 # nicht messbar = nicht bestanden


# --- Audio-Messungen an einem synthetischen Ton ------------------------------------------------

@pytest.fixture(scope="module")
def ton(tmp_path_factory):
    """4 s: Ton 0–1 s, Stille 1–3 s, Ton 3–4 s, als AAC mit 44,1 kHz und 128 kbps."""
    pfad = tmp_path_factory.mktemp("ton") / "ton.m4a"
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-f", "lavfi", "-i",
                    "aevalsrc='if(between(t,1,3),0,0.3*sin(2*PI*440*t))':s=44100:d=4",
                    "-c:a", "aac", "-b:a", "128k", str(pfad)], check=True)
    return pfad


@braucht_ffmpeg
def test_dekodiere_ohne_pyav(ton):
    samples = hoercheck.dekodiere(ton)
    assert str(samples.dtype) == "float32"
    assert abs(len(samples) / hoercheck.ABTASTRATE - 4.0) < 0.1


@braucht_ffmpeg
def test_stillen_lautheit_strom(ton):
    stillen = hoercheck.finde_stillen(ton, 1.2, 4.0)
    assert len(stillen) == 1
    start, dauer = stillen[0]
    assert abs(start - 1.0) < 0.1 and abs(dauer - 2.0) < 0.15
    assert hoercheck.finde_stillen(ton, 2.5, 4.0) == []
    lufs, peak = hoercheck.miss_lautheit(ton)
    assert -30 < lufs < -5
    # Amplitude 0,3 sind -10,5 dBFS; die harten Kanten des Tons überschwingen nach der
    # AAC-Kodierung, deshalb liegt der echte Spitzenpegel (True Peak) etwas höher.
    assert -12 < peak < -3
    info = hoercheck.strom_info(ton)
    assert info["abtastrate_hz"] == 44100 and info["bitrate_kbps"] > 20   # Stille drückt die Rate


# --- Kommandozeile (mit gespieltem Whisper, damit es schnell bleibt) ----------------------------

def test_cli_hoercheck_ein_json(tmp_path, monkeypatch, capsys):
    import fabrik
    text = tmp_path / "text.txt"
    text.write_text("Barcelona|Barsselona zahlte 45|fünfundvierzig Millionen Euro.", encoding="utf-8")
    audio = tmp_path / "a.m4a"
    audio.write_bytes(b"\0")
    aufrufe = {}

    def falsch_pruefe(audio_pfad, soll_text, **kw):
        aufrufe.update(kw)
        return {**messung(true_peak_db=0.1), "transkript": "", "woerter": [], "dauer_s": 1.0,
                "abweichungen": [], "zahlen_als_woerter": True}
    monkeypatch.setattr(hoercheck, "pruefe", falsch_pruefe)
    code = fabrik.main(["hoercheck", "--audio", str(audio), "--text", str(text), "--json"])
    ausgabe = json.loads(capsys.readouterr().out)
    assert code == 1 and ausgabe["ok"] is False
    assert ausgabe["verstoesse"] == ["True Peak 0.1 dBTP > -1"]
    assert aufrufe == {"modell": "small", "threads": 2, "max_stille_s": 1.2}


# --- Integrationstest mit der echten Probe ------------------------------------------------------

def probe_sprechtext() -> str:
    """Sprechtext der Probe aus build/script.py: pro Token die GESPROCHENE Seite."""
    spec = importlib.util.spec_from_file_location("probe_skript", PROBE / "build" / "script.py")
    modul = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modul)
    return sprechtext(" ".join(satz for szene in modul.SCENES for satz in szene["sentences"]))


@pytest.mark.langsam
@braucht_ffmpeg
def test_probe_hoercheck():
    pytest.importorskip("faster_whisper")
    text = probe_sprechtext()
    assert "Barsselona" in text and "|" not in text
    m = hoercheck.pruefe(PROBE / "assets" / "voice.m4a", text, modell="small", threads=2)
    assert m["wer"] < 0.15, m["abweichungen"]
    assert -19 < m["lufs"] < -13                # gemessen: -16,7 LUFS (Piper, ungemastert)
    assert abs(m["dauer_s"] - 52.55) < 0.2
    assert len(m["woerter"]) > 100 and all(w["ende"] >= w["start"] for w in m["woerter"])
    assert len(m["lange_stillen"]) == 2         # Vorhersage-Pause 2,6 s und Halten am Ende
    assert 1.8 < m["woerter_pro_s"] < 3.0
    json.dumps(m)                                # alles muss als JSON ausgebbar sein
