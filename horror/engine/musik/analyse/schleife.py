# Genaue Schleifenlänge (Chroma + Onset-Kreuzkorrelation, fein), daraus Tempo; Einsätze modulo Schleife
# gefaltet => Rhythmus-Schablone: welche Achtel/Sechzehntel einer Schleife sind besetzt?
import json, argparse
import numpy as np, soundfile as sf, librosa
ap = argparse.ArgumentParser(); ap.add_argument("datei"); ap.add_argument("--grob", type=float, required=True)
ap.add_argument("--schlaege", type=int, required=True, help="Schläge (Viertel) pro Schleife")
ap.add_argument("--ende", type=float); ap.add_argument("--json")
a = ap.parse_args()
y, sr = sf.read(a.datei, always_2d=True, dtype="float32"); y = y.mean(1)[: int(a.ende * sr) if a.ende else None]
SR = 22050; y = librosa.resample(y, orig_sr=sr, target_sr=SR); hop = 64; fps = SR / hop
env = librosa.onset.onset_strength(y=y, sr=SR, hop_length=hop, lag=2, max_size=3)
env = (env - env.mean()) / env.std()
best = None
for L in np.arange(a.grob - 0.4, a.grob + 0.4, 0.002):
    k = int(round(L * fps)); v = float(np.mean(env[k:] * env[:-k]))
    if best is None or v > best[0]: best = (v, L)
L = best[1]
# Verfeinern mit 3 Schleifen Abstand
best3 = None
for L3 in np.arange(3 * L - 0.1, 3 * L + 0.1, 0.002):
    k = int(round(L3 * fps)); v = float(np.mean(env[k:] * env[:-k]))
    if best3 is None or v > best3[0]: best3 = (v, L3)
L = best3[1] / 3
bpm = 60 * a.schlaege / L
erg = {"schleife_s": round(L, 3), "bpm": round(bpm, 2), "korrelation": round(best3[0], 3)}
# Falten: mittlere Onset-Stärke je Sechzehntel der Schleife
sech = L / (a.schlaege * 4)
n = int(len(env) / fps / L)
pl = a.schlaege * 4
prof = np.zeros(pl); cnt = 0
# Phase: maximale Energie auf dem Sechzehntelraster
best = None
for ph in np.linspace(0, sech, 32, endpoint=False):
    idx = (np.arange(ph, len(env) / fps - 0.05, sech) * fps).astype(int)
    s = env[idx].sum()
    if best is None or s > best[0]: best = (s, ph)
ph = best[1]
idx = (np.arange(ph, n * L, sech) * fps).astype(int)
# Maximum in ±20 ms um den Rasterpunkt
w = int(0.02 * fps)
vals = np.array([env[max(0, i - w):i + w + 1].max() for i in idx])
vals = vals[: (len(vals) // pl) * pl].reshape(-1, pl)
prof = vals.mean(0)
# Schleifenanfang = stärkste Zählzeit
st = int(np.argmax(prof[0::4])) * 4
prof = np.roll(prof, -st)
erg["phase_s"] = round(ph + st * sech, 3)
# Achtel- und Sechzehntelanteil
erg["mittel_achtel_auf"] = round(float(prof[0::2].mean()), 2)
erg["mittel_sechzehntel_zwischen"] = round(float(prof[1::2].mean()), 2)
schw = np.percentile(prof, 50)
erg["schablone_16tel"] = "".join("X" if v > 1.5 else ("x" if v > 0.6 else ("." if v > 0.0 else " ")) for v in prof)
erg["schablone_werte"] = [round(float(v), 2) for v in prof]
# Wiederholungstreue: Korrelation der Schleifen untereinander
erg["schleifen_gesamt"] = int(vals.shape[0])
c = np.corrcoef(vals)
erg["schleifen_aehnlichkeit_mittel"] = round(float(c[np.triu_indices_from(c, 1)].mean()), 2)
t = json.dumps(erg, ensure_ascii=False, indent=1)
if a.json: open(a.json, "w").write(t)
print(t)
