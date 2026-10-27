"""Tor G1: Sperrwörter und persönliche Daten, mit Treffern und Nicht-Treffern."""
from __future__ import annotations

import json

import pytest
from conftest import REPO_WURZEL, ein_json, fabrik_cli

from werk.tore import lade_sperrliste, lint, pruefe_text


@pytest.fixture(scope="module")
def liste():
    return lade_sperrliste()


def arten(text: str, liste) -> list[tuple[str, str]]:
    return [(art, gezeigt) for _, art, gezeigt in pruefe_text(text, liste)]


# --- Sperrwörter und Floskeln -----------------------------------------------------------------

@pytest.mark.parametrize("text, wort", [
    ("Das ist natürlich klar.", "natürlich"),
    ("Natürlich! Und dann?", "Natürlich"),
    ("Offensichtlich stimmt das nicht.", "Offensichtlich"),
    ("Die offensichtliche Lösung", "offensichtliche"),
    ("Das ist einfach.", "einfach"),
    ("Einfach! So geht es.", "Einfach"),
    ("Eine einfache Rechnung", "einfache"),
    ("Das war trivial", "trivial"),
    ("Kein Leichtsinnsfehler, sondern", "Leichtsinnsfehler"),
    ("Super, weiter geht's", "Super"),
    ("Das war klasse!", "klasse"),
    ("Mindset ist alles", "Mindset"),
    ("Mega!", "Mega"),
])
def test_sperrwort_trifft(liste, text, wort):
    assert ("sperrwort", wort) in arten(text, liste)


@pytest.mark.parametrize("text", [
    "Die natürlichen Zahlen sind 1, 2, 3 …",           # Fachbegriff, gebeugt: erlaubt
    "Natürliche Auslese erklärt das.",
    "Die Einfachheit der Regel täuscht.",                # andere Wortart: erlaubt
    "Wir vereinfachen die Gleichung.",
    "Eine Vereinfachung hilft.",
    "Im Supermarkt kostet es 2 Euro.",                   # 'super' nur als ganzes Wort
    "Stoff der Klasse 10 am Gymnasium.",                 # 'Klasse' als Nomen
    "Er steht an der Spitze der Tabelle.",
    "Barcelona|Barsselona zahlte 45|fünfundvierzig Millionen Euro.",
    "Der Wert der besten Alternative, die du aufgibst.",
    # Fachbegriffe aus dem Stoff beider Profile (Schlüssel "ausnahmen"):
    "Für ein Gesetz reicht im Bundestag die einfache Mehrheit.",
    "Beim einfachen Zins wächst das Kapital linear.",
    "Die Funktion hat bei x = 2 eine einfache Nullstelle.",
    "Das System hat nur die triviale Lösung.",
    "Eine nicht-triviale Lösung gibt es nicht.",
    "Prima facie spricht viel dafür.",
    "Der Super Tuesday entscheidet viel.",
    "Natürlich vorkommende Isotope sind stabil.",
    # Komposita mit Bindestrich sind Sachbegriffe, kein Lob:
    "Der Super-GAU von Tschernobyl war 1986.",
    "Bei der Mega-Fusion von Bayer und Monsanto",
    # Adjektiv "spitz", nicht Lob:
    "Ein stumpfwinkliges Dreieck hat genau zwei spitze Winkel.",
    # Anleitung statt Zuspruch (Floskel nur am Satzende):
    "Du kannst das Ergebnis mit einer Probe kontrollieren.",
    "Das kann jeder Taschenrechner.",
])
def test_kein_treffer_bei_normalem_text(liste, text):
    assert arten(text, liste) == []


@pytest.mark.parametrize("text, floskel", [
    ("Toll gemacht!", "Toll gemacht"),
    ("Glaub an dich.", "Glaub an dich"),
    ("Glaub\n  an   dich", "Glaub an dich"),            # über Zeilenumbruch und Leerraum
    ("Du schaffst das!", "Du schaffst das"),
    ("Mit einem Growth Mindset geht alles", "Growth Mindset"),
    ("Gut gemacht, nächste Frage.", "Gut gemacht"),
    ("Ein echtes Growth-Mindset", "Growth-Mindset"),     # Bindestrich statt Leerzeichen
    ("Super-Leistung!", "Super-Leistung"),
    ("Du kannst das!", "Du kannst das"),
    ("Du kannst das.", "Du kannst das"),
    ("Das kann jeder", "Das kann jeder"),                 # am Textende
    ("Das war spitze!", "war spitze"),
])
def test_floskel_trifft(liste, text, floskel):
    assert ("floskel", floskel) in arten(text, liste)


def test_wort_in_floskel_wird_nur_einmal_gemeldet(liste):
    assert arten("Toll gemacht!", liste) == [("floskel", "Toll gemacht")]


def test_ausnahme_gilt_nur_fuer_den_fachbegriff(liste):
    """Neben einer Ausnahme wird dasselbe Sperrwort weiter gemeldet."""
    assert arten("Die einfache Mehrheit reicht, das ist einfach.", liste) == [("sperrwort", "einfach")]
    assert arten("Eine einfache Rechnung", liste) == [("sperrwort", "einfache")]


# --- Persönliche Daten ------------------------------------------------------------------------

@pytest.mark.parametrize("text, art", [
    ("Schreib an vorname.nachname@example.org bitte", "email"),
    ("Ruf an: 030 23125456.", "telefon"),      # Film-Nummernbereich der BNetzA
    ("Tel. +49 30 23125 456", "telefon"),
    ("Büro 089/99998123", "telefon"),
    ("Fax 030-23125789", "telefon"),
    ("+49 (0)89 99998 456", "telefon"),
    ("Datei 1AbCdEfGhIjKlMnOpQrStUvWxYz012345 im Ordner", "drive_id"),
    ("Doc 1" + ("AbCdEfGh0_" * 5)[:43] + " im Ordner", "drive_id"),   # Docs/Sheets: 44 Zeichen
    ("https://drive.google.com/file/d/abc/view", "drive_link"),
    ("docs.google.com/document/d/xyz/edit", "drive_link"),
    ("siehe https://claude.ai/code/artifact/1234-abcd", "artifact_link"),
    ("claude.ai/public/artifacts/abc-def", "artifact_link"),
    ("Er hatte die Note 1,3 in Mathe.", "note"),
    ("Abiturnote 1,7", "note"),
    ("Note: 2-", "note"),
    ("Note 13 Punkte", "note"),
])
def test_persoenliche_daten_treffen(liste, text, art):
    gefunden = arten(text, liste)
    assert [a for a, _ in gefunden] == [art], gefunden


def test_persoenliche_daten_werden_gekuerzt_ausgegeben(liste):
    (_, gezeigt), = arten("Mail: vorname.nachname@example.org", liste)
    assert "nachname" not in gezeigt and "example" not in gezeigt


@pytest.mark.parametrize("text", [
    "Sommer 2022: 344 Tore in 375 Spielen.",
    "Ablöse 45.000.000 € plus 5 Mio. Bonus",
    "Am 27.10.2026 um 23:07 Uhr",
    "ISBN 978-3-16-148410-0",
    "Koordinate [95.0028203, 29.7657056]",
    "background:#050812 55%",
    "Version 0.8.206 und Anteil 0,0012345",
    # Git-Hashes und Video-IDs der Fabrik sind keine Drive-IDs:
    "Commit 1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
    "Hash 1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",           # 33 Zeichen, aber nur klein/hex
    "Video 1-opportunitaetskosten-teil-2-abc",           # 33 Zeichen, klein mit Bindestrich
    "Video 1-opportunitaetskosten-teil-2-abcdefghijklmn",  # 44 Zeichen, klein mit Bindestrich
    "Hash 1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d", # 48 Zeichen hex
    "UUID 12345678-90ab-4cde-8f01-23456789abcd",
    "Fußnote 1 und Noten lesen",
    "npm install @types/node",
])
def test_keine_falschen_treffer(liste, text):
    assert arten(text, liste) == []


def test_private_sperrliste_aus_der_umgebung(tmp_path, monkeypatch):
    privat = tmp_path / "privat.json"
    privat.write_text(json.dumps({"woerter": ["Mustermann"]}))
    monkeypatch.setenv("FABRIK_PRIVATE_SPERRLISTE", str(privat))
    liste = lade_sperrliste()
    (art, gezeigt), = arten("Herr Mustermann sagt", liste)
    assert art == "privat" and "Mustermann" not in gezeigt


# --- Dateien und Kommandozeile ----------------------------------------------------------------

def test_json_datei_mit_escapes(tmp_path, liste):
    """Specs mit \\u00fc-Escapes: Wir prüfen die dekodierten Texte und melden den JSON-Pfad."""
    spec = tmp_path / "spec.json"
    spec.write_text(json.dumps({"scenes": [{"narration": "Das ist natürlich so."}]}, ensure_ascii=True))
    assert "\\u00fc" in spec.read_text()
    ergebnis = lint([spec], liste)
    assert not ergebnis["ok"]
    (t,) = ergebnis["treffer"]
    assert t["ort"] == "$.scenes[0].narration" and t["zeile"] is None and t["text"] == "natürlich"


def test_zeile_und_spalte(tmp_path, liste):
    datei = tmp_path / "skript.txt"
    datei.write_text("Erste Zeile.\nDas ist einfach so.\n", encoding="utf-8")
    (t,) = lint([datei], liste)["treffer"]
    assert (t["zeile"], t["spalte"]) == (2, 9)


def test_probe_skript_ist_sauber():
    ergebnis = lint([REPO_WURZEL / "studio/probe-opportunitaetskosten/build/script.py"])
    assert ergebnis["ok"], ergebnis["treffer"]


def test_cli_lint(tmp_path):
    sauber = tmp_path / "sauber.txt"
    sauber.write_text("Barcelona zahlte 45 Millionen Euro.\n", encoding="utf-8")
    schmutzig = tmp_path / "schmutzig.txt"
    schmutzig.write_text("Toll gemacht! Das war natürlich einfach.\n", encoding="utf-8")
    binaer = tmp_path / "ton.m4a"
    binaer.write_bytes(bytes(range(256)) * 4)

    r = fabrik_cli("lint", str(sauber), str(binaer), "--json")
    assert r.returncode == 0
    ergebnis = ein_json(r.stdout)
    assert ergebnis["ok"] and ergebnis["uebersprungen"] == [str(binaer)]

    r = fabrik_cli("lint", str(sauber), str(schmutzig), "--json")
    assert r.returncode == 1
    assert [t["text"] for t in ein_json(r.stdout)["treffer"]] == ["Toll gemacht", "natürlich", "einfach"]

    r = fabrik_cli("lint", str(schmutzig))
    assert r.returncode == 1 and "schmutzig.txt:1:23: sperrwort: natürlich" in r.stdout

    r = fabrik_cli("lint", str(tmp_path / "fehlt.txt"), "--json")
    assert r.returncode == 2 and ein_json(r.stdout)["ok"] is False
