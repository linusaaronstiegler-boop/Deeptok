# Schreibt muster/spieluhr-eigen.json: die Spieluhr im Stil von r2 mit EIGENEN Begleitfiguren in allen
# acht Takten. Aufruf (ohne Analyse-Ordner, liest nur muster/spieluhr.json):
#   python -I analyse/eigene_figuren.py
#
# Warum: muster/spieluhr.json folgt der Vorlage Achtel für Achtel (transkribiert). Der eigene
# Fingerabdruck (analyse/fingerabdruck.py) stuft das daraus gebaute Bett als „dasselbe Stück“ ein
# (0,83 bei z 4,6). Das ist ein Urheberrechts- und Stummschalt-Risiko. Hier bleibt, was den Stil
# trägt und nicht schützbar ist: Akkordfolge I – vi7 – vi – bVI+ (zweimal), Tempo, Takt, Register
# (E4 bis E6 wie in der Vorlage, Glitzer darüber), Klangfarbe, Hall und Verstimmung (die stehen in bauen.py).
# Neu und eigen ist in jedem Takt:
#   - Arpeggio-Reihenfolge: Die Vorlage läuft in jedem Takt aufwärts Grundton – Terz – Quinte in Gruppen
#     3+3+2 und springt dabei zwischen den Oktaven. Hier ändert jeder Takt die Reihenfolge an 1–2 Stellen
#     (Wendung nach oben, fallender Beginn, Bogen 4+4 statt 3+3+2, Rückschwung zum nächsten Takt).
#   - Lage/Umkehrungen: eigene Linien (Takt 1 in einem Zug über zwei Oktaven, Takt 6 beginnt auf der Terz,
#     Takt 4 von oben). Die tiefen Töne (Cis4, E4, Gis4) stehen dort, wo auch die Vorlage in die Tiefe
#     springt, und die Oktav-Verdopplungen liegen in deren Lage: Register und Klangbild bleiben.
#   - Rhythmus: Haltetöne („-“) in Takt 2 und 5.
#   - Eigene Oberstimme: ein Wiegenlied in halben Noten (Takt 1–8), das die Vorlage nicht hat.
#   - Eigene Akzente: Gruppenanfang lauter, Streuung der Anschlagstärke unter 3 dB (die gemessene
#     Lautheitskurve der Vorlage je Achtel, dyn_db, wird NICHT übernommen).
# Wie weit weg? Gemessen in drei Stufen (Versuchsbau mit 4 Schleifen, Werte Fingerabdruck / Chroma fest):
#   ganz fremde Figuren (Alberti, Orgelpunkt, fallende Ketten): 0,575 / 0,58 – so weit weg wie ein
#   fremdes Stück, der Stil geht verloren. 3 Änderungen je Takt: 0,645 / 0,68. Diese Fassung mit 1–2
#   Änderungen je Takt: um 0,72 / 0,76 – kein Treffer (Grenze 0,78 und z 4,5), aber klar im Stil.
#   Endgültige Werte des vollen Baus: musik-v2/messwerte.json und LIZENZEN.md.
#   Nur Lage ändern (ohne neue Reihenfolge) ergäbe wieder 0,83 = „dasselbe Stück“.
import json, os

HIER = os.path.dirname(os.path.abspath(__file__))
MUSTER = os.path.join(HIER, "..", "muster")
GRUND = 64  # E4: Bezug für „rel“ (bauen.py setzt die Tonart über STILE[...]["grund"])

NAMEN = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}


def rel(name):
    """Notenname (z. B. G#5) -> Halbtöne relativ zu E4."""
    ton, okt = name[:-1], int(name[-1])
    return 12 * (okt + 1) + NAMEN[ton] - GRUND


# Begleitfigur je Takt, 8 Achtel. „-“ = kein neuer Anschlag, der Ton davor klingt eine Achtel länger.
# Kommentar: Akkord und Bauart der Figur.
FIGUREN = [
    ("I",    "E4 G#4 B4 E5 G#5 B5 G#5 E5"),     # eine Linie über zwei Oktaven, am Ende Wendung abwärts
    ("vi7",  "C#5 E5 G#5 B5 E5 G#5 B5 -"),      # hinauf zur Septime, letzte Achtel gehalten
    ("vi",   "C#5 E5 G#5 C#6 E6 C#6 C#4 E5"),   # bis E6 und zurück (Wendung), dann Sprung in die Tiefe
    ("bVI+", "C6 G#4 E5 C5 G#4 E5 C5 E5"),      # beginnt fallend von oben
    ("I",    "E5 G#5 E6 E5 G#5 B5 E6 -"),       # Schlussgruppe als gehaltenes E6
    ("vi7",  "E5 C#4 G#5 C#6 E6 G#5 E5 G#5"),   # Umkehrung: von der Terz zum tiefen Grundton, hinauf zu E6
    ("vi",   "C#5 E5 G#5 C#6 G#5 E5 C#5 E5"),   # Bogen 4+4 statt 3+3+2
    ("bVI+", "C5 E4 G#5 C6 G#5 E5 G#5 C6"),     # Bogen, dann Rückschwung zu C6 (führt in Takt 1)
]

# Eigene Oberstimme (Celesta-Schicht „doppel“, nur in den Stufen normal und voll): halbe Noten auf
# Zählzeit 1 und 3. (Achtel-Position im Takt, Note, Länge in Achteln). Nur Akkordtöne.
OBERSTIMME = [
    [(0, "E6", 3.6), (4, "B5", 3.6)],
    [(0, "C#6", 3.6), (4, "B5", 3.6)],
    [(0, "C#6", 3.6), (4, "E6", 3.6)],
    [(0, "C6", 7.2)],
    [(0, "B5", 3.6), (4, "E6", 3.6)],
    [(0, "E6", 3.6), (4, "C#6", 3.6)],
    [(0, "C#6", 3.6), (4, "G#5", 3.6)],
    [(0, "C6", 3.6), (4, "G#5", 3.6)],
]
# Oktav-Verdopplung (ebenfalls Schicht „doppel“): eine Oktave unter dem Figurton (über Cis5) bzw.
# darüber. Sie macht „normal“ voller als „dünn“, ohne die Figur zu ändern. "wie_vorlage": auf den Achteln,
# auf denen auch die Vorlage verdoppelt (wie dicht verdoppelt wird, ist Klangfarbe und Register: ohne das
# lag das Spektrum 7,9 dB neben der Vorlage, weil die tiefe Oktave fehlte). Sonst ein Tupel von Positionen.
VERDOPPELN_AUF = "wie_vorlage"
V_DOPPEL = 0.6
V_OBER = 0.55   # Oberstimme
GLITZER = (62, "G#6", 0.35)   # eigener Glitzerton am Schleifenende (Glockenspiel), leise

V_TAKT, V_GRUPPE, V_SONST = 0.88, 0.84, 0.78   # Akzente: Takt-Eins, Gruppenanfang, Rest (≤ 2,6 dB)
# Gruppenanfänge je Takt (Achtel-Positionen), passend zur Bauart der Figur
GRUPPEN = [(0, 4), (0, 4), (0, 3, 6), (0, 3, 6), (0, 3, 6), (0, 4), (0, 4), (0, 4)]


def bauen():
    basis = json.load(open(os.path.join(MUSTER, "spieluhr.json")))
    slots = []
    for takt, (akkord, figur) in enumerate(FIGUREN):
        toene = figur.split()
        assert len(toene) == 8, (takt, figur)
        assert akkord == basis["akkorde"][takt], (takt, akkord)
        erlaubt = {r % 12 for r in basis["akkord_toene_rel"][takt]}
        for pos, ton in enumerate(toene):
            q = takt * 8 + pos
            slot = {"q": q, "noten": [], "doppel": []}
            if ton != "-":
                r = rel(ton)
                assert r % 12 in erlaubt, f"Takt {takt + 1}: {ton} ist kein Akkordton"
                # Länge: 1,2 Achtel (wie die Vorlage: kurze Punkte), plus 1 Achtel je folgendem „-“
                halte = 0
                while pos + 1 + halte < 8 and toene[pos + 1 + halte] == "-":
                    halte += 1
                v = V_TAKT if pos == 0 else (V_GRUPPE if pos in GRUPPEN[takt] else V_SONST)
                slot["noten"] = [[r, v, round(1.2 + halte, 2)]]
                if VERDOPPELN_AUF == "wie_vorlage":
                    # Auf den Achteln, auf denen die Vorlage verdoppelt, und in deren Lage: unser Ton in der
                    # Oktave, die der Verdopplung der Vorlage am nächsten liegt (nie im Einklang mit der Figur)
                    for d_ref, _ in basis["slots"][q]["doppel"]:
                        kand = [r + 12 * k for k in (-2, -1, 1, 2)]
                        slot["doppel"].append([min(kand, key=lambda x: abs(x - d_ref)), V_DOPPEL])
                elif pos in VERDOPPELN_AUF:
                    slot["doppel"].append([r - 12 if r > rel("C#5") else r + 12, V_DOPPEL])
            for p, ton_o, laenge in OBERSTIMME[takt]:
                if p == pos:
                    r = rel(ton_o)
                    assert r % 12 in erlaubt, f"Oberstimme Takt {takt + 1}: {ton_o}"
                    slot["doppel"].append([r, V_OBER, laenge])
            slots.append(slot)
    q, ton, v = GLITZER
    slots[q]["glitzer"] = [[rel(ton), v]]
    aus = {
        "beschreibung": "Spieluhr im Stil r2 mit eigenen Begleitfiguren in allen 8 Takten (analyse/eigene_figuren.py). "
                        "Gleich wie die Vorlage: Akkordfolge, Tempo, Takt, Register. Eigen: Reihenfolge, Umkehrungen, "
                        "Rhythmus, Oberstimme, Akzente. Töne relativ zu E4, [rel, velocity, Länge in Achteln].",
        "takte": 8, "achtel_je_takt": 8,
        "akkorde": basis["akkorde"], "akkord_toene_rel": basis["akkord_toene_rel"],
        "slots": slots,
        "figuren": [{"takt": i + 1, "akkord": a, "figur": f} for i, (a, f) in enumerate(FIGUREN)],
        "oberstimme": [[(p, t, l) for p, t, l in o] for o in OBERSTIMME],
        # Klangziel (Terzspektrum) wie r2: Die Klangfarbe bleibt Stil, nicht Werk
        "ziele": {"r2": basis["ziele"]["r2"]},
    }
    pfad = os.path.join(MUSTER, "spieluhr-eigen.json")
    json.dump(aus, open(pfad, "w"), indent=1)
    print("geschrieben:", pfad, len(slots), "Achtel")


if __name__ == "__main__":
    bauen()
