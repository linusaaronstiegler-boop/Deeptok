# Schreibt die Muster-Dateien muster/spieluhr.json und muster/klavier.json aus den Analyse-Ergebnissen
# (konsens.py -> spieluhr-konsens.json, ref0_muster.py -> ref0-slots-muster.json, Zielspektren ziele.json).
# Aufruf: python -I muster_schreiben.py <analyse-ordner>
#
# Was übernommen wird (nicht schützbar): Tempo, Taktart, Schleifenlänge, Stimmung, Akkordfolge, Register,
# Begleitrhythmus (durchgehende Achtel), Arpeggio-Grammatik und Basslinie aus Grundtönen.
# Was eigenständig ist: jede Oberstimme. Spieluhr: eigene Spitzentöne in Takt 5–8 und ein eigener
# Glitzerton am Schleifenende. Klavier: die Viertel-Melodie auf den Zählzeiten ist komplett neu gesetzt.
import json, os, sys

A = sys.argv[1]
HIER = os.path.dirname(os.path.abspath(__file__))
MUSTER = os.path.join(HIER, "..", "muster")
ziele = json.load(open(os.path.join(A, "ziele.json")))

# ------------------------------------------------------------------ Spieluhr (r2 / r5)
kons = json.load(open(os.path.join(A, "spieluhr-konsens.json")))
slots = []
for s in kons:
    q = s["q"]; noten = s["noten"]
    if not noten:
        noten = [(12, 1.0)]  # T5.1: vom ausklingenden E5 verdeckt, wie T1.1 der Grundton (rel +12)
    haupt_rel, haupt_z = noten[0]
    erst = [(haupt_rel, round(0.6 + 0.4 * min(1.0, haupt_z / 1.6), 2))]
    dopp = []
    for rel, z in noten[1:]:
        # Oktav-Verdopplung nur, wenn sie in beiden Referenzen zusammen deutlich messbar ist
        if (rel - haupt_rel) % 12 == 0 and z >= 0.6 * haupt_z:
            dopp.append((rel, round(0.45 + 0.35 * min(1.0, z / 1.6), 2)))
    slots.append({"q": q, "noten": erst, "doppel": dopp})
if slots[32]["noten"][0][0] != 12:
    slots[32]["noten"] = [(12, 0.85)]

# Eigene Oberstimme in Takt 5–8 (Spitzentöne ab rel +19 werden anders gesetzt, alles Akkordtöne):
#   T5.3 H5 -> E6, T6.1 Cis6 -> E6, T6.4 H5 -> Cis6, T6.7 H5 -> Gis5
VARIATION = {34: 24, 40: 24, 43: 21, 46: 16}
for q, neu in VARIATION.items():
    rel, v = slots[q]["noten"][0]
    slots[q]["noten"] = [(neu, v)]
    slots[q]["doppel"] = [(d, dv) for d, dv in slots[q]["doppel"] if d < 19]
# eigener Glitzerton am Schleifenende (Gis6 statt des A6 der Referenz), leise
slots[62]["glitzer"] = [(28, 0.35)]

spieluhr = {
    "beschreibung": "Spieluhr-Arpeggio, 8 Takte 4/4 in Achteln, Folge I – vi7 – vi – bVI+ (zweimal). "
                    "Töne relativ zum Grundton der Tonart (0 = Grundton in der 4. Oktave).",
    "takte": 8, "achtel_je_takt": 8,
    "akkorde": ["I", "vi7", "vi", "bVI+", "I", "vi7", "vi", "bVI+"],
    "akkord_toene_rel": [[0, 4, 7], [9, 0, 4, 7], [9, 0, 4], [8, 0, 4], [0, 4, 7], [9, 0, 4, 7], [9, 0, 4], [8, 0, 4]],
    "slots": slots,
    "variation": {"oberstimme_takt_5_8": VARIATION, "glitzer": "q62 rel +28"},
    "ziele": {"r2": ziele["r2"], "r5": ziele["r5"]},
}
json.dump(spieluhr, open(os.path.join(MUSTER, "spieluhr.json"), "w"), indent=1)

# ------------------------------------------------------------------ Klavier (ref0)
k = json.load(open(os.path.join(A, "ref0-slots-muster.json")))
# Eigene Melodie auf den Zählzeiten 1/2/3 (Slots 1, 3, 5 je Takt), Akkordtöne, Register E4–D5
MELODIE = [[72, 69, 65], [64, 69, 72], [69, 66, 64], [62, 64, 66],
           [65, 69, 74], [65, 69, 73], [73, 69, 65], [64, 67, 72]]
kslots = []
for s in k:
    q = s["q"]; takt, pos = divmod(q, 6)
    noten = [(m, v) for m, v in s["noten"]]
    if pos % 2 == 0:
        # Zählzeit: die Melodienote der Referenz (höchster Ton ab D4) fällt weg, tiefe Begleittöne bleiben
        tief = [(m, v) for m, v in noten if m < 62]
        if len(tief) == len(noten) and noten:
            tief = [(m, v) for m, v in noten if m != max(n for n, _ in noten)] if max(n for n, _ in noten) >= 62 else tief
        mel = MELODIE[takt][pos // 2]
        kslots.append({"q": q, "begleitung": tief, "melodie": [(mel, 0.6)]})
    else:
        kslots.append({"q": q, "begleitung": noten, "melodie": []})
# Bass je Achtel im vollen Teil (aus dem Bass-Stem, Grundtöne), MIDI-Nummern 1. Oktave
BASS = (["F1"] * 6 + ["C1"] * 4 + ["E1"] * 2 + ["D1"] * 6 + ["A1"] * 6 + ["A#1"] * 2 + ["F1"] * 7 +
        ["C#1"] * 8 + ["C1"] * 7)
import librosa
bass = [int(librosa.note_to_midi(n)) for n in BASS][:48]
FLAECHE = [["F3", "A3", "C4", "E4"], ["F3", "A3", "C4", "E4"], ["D3", "F#3", "A3", "C4"], ["D3", "F#3", "A3", "E4"],
           ["A#2", "D3", "F3", "A3"], ["A#2", "C#3", "F3", "A3"], ["C#3", "F3", "A3", "C4"], ["C3", "E3", "G3", "C4"]]
klavier = {
    "beschreibung": "Klavier-Arpeggio, 8 Takte 3/4 in Achteln (48 Slots). Folge Fmaj7 – Fmaj7 – D9 – D/A – "
                    "Bbmaj7 – Bb/Db+ – Db+ – C. Begleitung aus der Referenz, Melodie auf den Zählzeiten eigen.",
    "takte": 8, "achtel_je_takt": 6,
    "akkorde": ["Fmaj7", "Fmaj7", "D9", "D/A", "Bbmaj7", "Bb/Db+", "Db+", "C"],
    "slots": kslots, "bass": bass,
    "flaeche": [[int(librosa.note_to_midi(n)) for n in t] for t in FLAECHE],
    "melodie_eigen": MELODIE,
    "ziele": {"duenn": ziele["ref0_duenn"], "voll": ziele["ref0_voll"]},
}
json.dump(klavier, open(os.path.join(MUSTER, "klavier.json"), "w"), indent=1)
print("geschrieben:", os.listdir(MUSTER))
