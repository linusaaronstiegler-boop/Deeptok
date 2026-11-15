# Gleicht die Lautheit je Achtel-Slot an die Referenz an (Lautheitsverlauf innerhalb der Schleife).
# Aufruf: python -I dynamik.py <stil> <referenz-stem.wav> <ref_ende_s> <phase_s> [--runden 2]
# Misst in der Referenz die Momentan-Lautheit (400 ms) je Slot als Median über alle Wiederholungen,
# rendert eine Testschleife (bauen.py --test), misst dort dasselbe und schreibt die Differenz
# (auf ±6 dB begrenzt, aufaddiert über die Runden) als muster/<muster>.json["dyn_db"][stil].
import argparse, json, os, sys, tempfile
import numpy as np

HIER = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HIER, ".."))
import bauen  # noqa: E402
import vergleich as v  # noqa: E402


def je_slot(m, L, n_slots, phase, wdh):
    e = L / n_slots
    R = []
    for k in range(wdh):
        R.append([m[int((phase + k * L + q * e) / 0.05): int((phase + k * L + (q + 1) * e) / 0.05)].max() for q in range(n_slots)])
    return np.median(np.array(R), 0)


ap = argparse.ArgumentParser()
ap.add_argument("stil"); ap.add_argument("ref"); ap.add_argument("ende", type=float); ap.add_argument("phase", type=float)
ap.add_argument("--runden", type=int, default=2)
a = ap.parse_args()
st = bauen.STILE[a.stil]
mpfad = os.path.join(HIER, "..", "muster", f"{st['muster']}.json")
mu = json.load(open(mpfad))
n = len(mu["slots"])
L = n * 30.0 / st["bpm"]
y, sr = v.laden(a.ref, 0, a.ende)
R = je_slot(v.momentan(y, sr, 0.4, 0.05), L, n, a.phase, int((a.ende - a.phase - 0.5) // L))
R -= R.mean()
for runde in range(a.runden):
    with tempfile.TemporaryDirectory() as tmp:
        bauen.bauen(a.stil, tmp, test=True)
        y2, sr2 = v.laden(os.path.join(tmp, f"{a.stil}-v2-test-schleife.wav"))
    C = je_slot(v.momentan(np.vstack([y2, y2]), sr2, 0.4, 0.05), L, n, 0.0, 1)
    C -= C.mean()
    k = float(np.corrcoef(R, C)[0, 1])
    print(f"Runde {runde + 1}: Korrelation je Slot {k:.3f}, Streuung Ref {R.std():.2f} dB, Nachbau {C.std():.2f} dB")
    alt = np.array(mu.get("dyn_db", {}).get(a.stil, [0.0] * n))
    neu = np.clip(alt + 0.8 * (R - C), -6, 6)
    mu.setdefault("dyn_db", {})[a.stil] = [round(float(x), 2) for x in neu]
    json.dump(mu, open(mpfad, "w"), indent=1)
