"""Tests für voices/rotation.json: Pool, Anteile, Bruder-Regel, Stammformate, Kanäle.

Noch wählt kein Code die Stimme selbst aus der Rotation; die Datei ist Regelwerk für die
Nachtschicht. Darum hält dieser Test sie in sich stimmig und passend zu voices/<anbieter>.json:
Kein Commit soll eine Stimme in den Pool bringen, die der Anbieter nicht kennt, Anteile, die
nicht 100 % ergeben, oder dem Profil des Bruders eine gesperrte Stimme geben.
"""
from __future__ import annotations

import itertools
import json
import sys
from pathlib import Path

import pytest

FABRIK_DIR = Path(__file__).resolve().parent.parent
if str(FABRIK_DIR) not in sys.path:
    sys.path.insert(0, str(FABRIK_DIR))

from werk import stimme as stimm_paket                  # noqa: E402
from werk.stimme import basis                           # noqa: E402

REPO = FABRIK_DIR.parent
ROTATION = stimm_paket.VOICES_DIR / "rotation.json"
LOOKS_DIR = REPO / "studio" / "looks"


@pytest.fixture(scope="module")
def rot() -> dict:
    return json.loads(ROTATION.read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def pool(rot) -> dict[str, dict]:
    return {s["id"]: s for s in rot["pool"]}


def waehlbare_looks() -> set[str]:
    """Die Looks aus dem Katalog (studio/looks/<look>.md); verworfene liegen in verworfen/."""
    return {p.stem for p in LOOKS_DIR.glob("*.md")} - {"README"}


def test_pool_passt_zu_den_anbietern(rot, pool):
    assert len(pool) == len(rot["pool"]), "doppelte id im Pool"
    assert len({s["voice_id"] for s in rot["pool"]}) == len(pool), "doppelte voice_id im Pool"
    for sid, s in pool.items():
        anbieter = s["anbieter"]
        assert anbieter in stimm_paket.ANBIETER and anbieter in rot["anbieter"], sid
        assert s["voice_id"] and s["voice_id"] != basis.PLATZHALTER, sid
        assert s["geschlecht"] in ("m", "w"), sid
        einstellungen = stimm_paket.lade_stimme(anbieter)
        # Das Modell in der Rotation ist nur eine Lesehilfe; gepinnt ist es in voices/<anbieter>.json.
        assert rot["anbieter"][anbieter]["modell"] == einstellungen["modell"], anbieter
        assert (REPO / rot["anbieter"][anbieter]["einstellungen"]).is_file()
        kandidaten = {k["id"]: k for k in einstellungen.get("kandidaten", [])}
        if kandidaten:                       # Cartesia und Inworld: nur Stimmen aus dem Casting
            assert s["voice_id"] in kandidaten, f"{sid}: {s['voice_id']} fehlt in voices/{anbieter}.json"
            assert kandidaten[s["voice_id"]]["name"] == s["name"], sid
    # Jede gepinnte Stimme der drei Pool-Anbieter steht auch im Pool.
    for anbieter in rot["anbieter"]:
        gepinnt = stimm_paket.lade_stimme(anbieter)["stimm_id"]
        assert any(s["voice_id"] == gepinnt and s["anbieter"] == anbieter for s in pool.values()), anbieter


def test_finalisten_der_runde_2_im_pool(pool):
    erwartet = {"sebastian": ("cartesia", "b7187e84-fe22-4344-ba4a-bc013fcb533e"),
                "lena": ("cartesia", "4ab1ff51-476d-42bb-8019-4d315f7c0c05"),
                "bastian": ("inworld", "Bastian"),
                "sabine": ("inworld", "Sabine")}
    for sid, (anbieter, voice_id) in erwartet.items():
        assert (pool[sid]["anbieter"], pool[sid]["voice_id"]) == (anbieter, voice_id)
    assert pool["sebastian"]["rolle"] == "goldstimme"
    assert stimm_paket.lade_stimme("cartesia")["stimm_id"] == pool["sebastian"]["voice_id"]


def test_mitten_ergeben_100_prozent(rot, pool):
    anteil = rot["anteil"]
    schwelle = anteil["schwelle_pp"] / 100
    bruder = set(rot["regeln"]["bruder"]["erlaubte_anbieter"])
    profile = {"linus": set(pool),
               "bruder": {sid for sid, s in pool.items() if s["anbieter"] in bruder}}
    assert set(anteil["mitte"]) == set(profile)
    for profil, stimmen in profile.items():
        mitte = anteil["mitte"][profil]
        assert set(mitte) == stimmen, profil          # jede hörbare Stimme hat eine Mitte
        assert sum(mitte.values()) == pytest.approx(1.0), profil
        # Jede Mitte liegt über der Schwelle, sonst käme die Stimme über Regel 2 nie dran.
        assert all(m > schwelle for m in mitte.values()), profil


def test_jonas_dominiert_nicht_und_sebastian_hat_festen_platz(rot):
    linus = rot["anteil"]["mitte"]["linus"]
    hoechste = max(linus.values())
    assert linus["jonas"] < 0.25
    assert linus["sebastian"] == hoechste                       # fester Platz (Goldstandard)
    assert [s for s, m in linus.items() if m == hoechste] != ["jonas"]
    assert rot["anteil"]["mitte"]["bruder"]["sebastian"] == max(rot["anteil"]["mitte"]["bruder"].values())
    # Kein Vorrang für Jonas bei Kanälen ohne Vorschlag.
    assert "Jonas, wenn" not in " ".join(rot["regeln"]["stimme_fuer_neue_serie"])


def test_bruder_hoert_keine_elevenlabs_stimme(rot, pool):
    regel = rot["regeln"]["bruder"]
    erlaubt, gesperrt = set(regel["erlaubte_anbieter"]), set(regel["gesperrte_anbieter"])
    assert "elevenlabs" in gesperrt and not (erlaubt & gesperrt)
    assert erlaubt <= set(rot["anbieter"])
    assert set(regel["warum"]) == erlaubt | gesperrt          # Abwägung je Anbieter vermerkt

    def darf(sid: str) -> bool:
        return pool[sid]["anbieter"] in erlaubt

    assert regel["rueckfall"] and all(darf(s) for s in regel["rueckfall"])
    # Der Rückfall streut über verschiedene Anbieter, sonst trifft ein Ausfall alle.
    assert len({pool[s]["anbieter"] for s in regel["rueckfall"]}) == len(regel["rueckfall"])
    for name, f in rot["stammformate"].items():
        if name.startswith("_") or f["profil"] != "bruder":
            continue
        assert darf(f["stimme"]) and darf(f["rueckfall"]["stimme"]), name
    for name, k in rot["kanal_start"].items():
        if name.startswith("_") or k.get("profil") != "bruder":
            continue
        assert darf(k["stimme"]) and darf(k["stimme_alternative"]), name
    assert any(f.get("profil") == "bruder" for n, f in rot["stammformate"].items()
               if not n.startswith("_"))                # sein Weltlage-Briefing hat eine Stimme


def test_stammformate_nachbarregel_und_rueckfall(rot, pool):
    formate = {n: f for n, f in rot["stammformate"].items() if not n.startswith("_")}
    looks = waehlbare_looks()
    for name, f in formate.items():
        assert f["stimme"] in pool and f["rueckfall"]["stimme"] in pool, name
        assert {f["look"], f["rueckfall"]["look"]} <= looks, name
        # Rückfall bei einem anderen Anbieter: ein leeres Kontingent trifft nie beide.
        assert pool[f["stimme"]]["anbieter"] != pool[f["rueckfall"]["stimme"]]["anbieter"], name

    def stimmen(x):
        return {x["stimme"], x.get("rueckfall", {}).get("stimme") or x.get("stimme_alternative")}

    def looks_von(x):
        return {x["look"], x.get("rueckfall", {}).get("look") or x.get("look_alternative")}

    # Karten eines Profils in „Heute“: Haupt- und Rückfallwerte nie gemeinsam (regeln.heute_nachbarn).
    for (na, a), (nb, b) in itertools.combinations(formate.items(), 2):
        if a["profil"] == b["profil"]:
            assert not stimmen(a) & stimmen(b), (na, nb)
            assert not looks_von(a) & looks_von(b), (na, nb)
    # Bruder: Transfer-Karten (Kanal Schule-Transfer) stehen direkt vor seiner Weltlage.
    transfer = rot["kanal_start"]["schule_transfer"]
    for name, f in formate.items():
        if f["profil"] == "bruder":
            assert not stimmen(f) & stimmen(transfer), name
            assert not looks_von(f) & looks_von(transfer), name


def test_kanal_start_nur_mit_pool_stimmen_und_katalog_looks(rot, pool):
    looks = waehlbare_looks()
    assert looks and "kurstafel" not in looks
    for name, k in rot["kanal_start"].items():
        if name.startswith("_"):
            continue
        assert k["stimme"] in pool and k["stimme_alternative"] in pool, name
        assert k["stimme"] != k["stimme_alternative"], name
        assert k["look"] in looks and k["look_alternative"] in looks and k["look"] != k["look_alternative"], name
