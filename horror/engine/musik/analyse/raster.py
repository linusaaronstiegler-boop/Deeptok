# Rhythmus-Raster und Akkordfunktionen eines Stems: Einsätze auf das Sechzehntel-Raster eines Takts
# gefaltet (wo im Takt wird angeschlagen?) und je Takt der passendste Dreiklang (Dur/Moll/übermäßig/vermindert).
# Ausgabe: Belegung der 16 Rasterplätze, Akkordtypen-Anteile und Grundton-Bewegungen (Intervalle zwischen Takten).
import json, argparse
import numpy as np, soundfile as sf, librosa
ap = argparse.ArgumentParser()
ap.add_argument("datei"); ap.add_argument("--bpm", type=float, required=True); ap.add_argument("--schlaege", type=int, default=4)
ap.add_argument("--stimmung", type=float, default=0.0, help="Cent"); ap.add_argument("--json")
ap.add_argument("--start", type=float, default=0); ap.add_argument("--ende", type=float)
a = ap.parse_args()
y, sr = sf.read(a.datei, always_2d=True, dtype="float32")
y = y[int(a.start * sr): int(a.ende * sr) if a.ende else None].mean(1)
SR = 22050; y = librosa.resample(y, orig_sr=sr, target_sr=SR); hop = 128
env = librosa.onset.onset_strength(y=y, sr=SR, hop_length=hop)
fps = SR / hop
schlag = 60 / a.bpm; takt = a.schlaege * schlag; sech = schlag / 4
# Phase: Verschiebung, bei der die Onset-Energie auf den Sechzehnteln maximal ist, dann Taktanfang
# = Sechzehntel-Phase mit der größten Energie auf Zählzeit 1 (über alle Takte gemittelt)
tt = np.arange(len(env)) / fps
best = None
for ph in np.linspace(0, sech, 40, endpoint=False):
    idx = np.round((np.arange(ph, tt[-1], sech)) * fps).astype(int)
    e = env[idx[idx < len(env)]].sum()
    if best is None or e > best[0]: best = (e, ph)
ph = best[1]
n16 = int((tt[-1] - ph) / sech)
g = np.array([env[min(len(env) - 1, int(round((ph + i * sech) * fps)))] for i in range(n16)])
pro = a.schlaege * 4
k = len(g) // pro
G = g[:k * pro].reshape(k, pro)
mittel = G.mean(0)
start = int(np.argmax([mittel[(np.arange(pro) + s) % pro][0::4].sum() for s in range(pro)]))  # stärkste Viertel-Phase
start = int(np.argmax(mittel[[(start + 4 * j) % pro for j in range(a.schlaege)]])) * 4 + start
start %= pro
mittel = np.roll(mittel, -start)
norm = mittel / mittel.max()
erg = {"bpm": a.bpm, "raster_16tel": [round(float(v), 2) for v in norm],
       "belegt_ueber_0.5": "".join("x" if v > 0.5 else ("o" if v > 0.3 else ".") for v in norm)}
# Akkord je Takt (Chroma über den Takt, Dreiklang-Schablonen)
ch = librosa.feature.chroma_cqt(y=y, sr=SR, hop_length=512, tuning=a.stimmung / 100)
cf = SR / 512
NAM = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "H"]
TYP = {"": [0, 4, 7], "m": [0, 3, 7], "+": [0, 4, 8], "dim": [0, 3, 6], "sus4": [0, 5, 7]}
akk = []
t0 = ph + start * sech
while t0 + takt < tt[-1]:
    c = ch[:, int(t0 * cf):int((t0 + takt) * cf)].mean(1); c = c / (np.linalg.norm(c) + 1e-9)
    best = None
    for r in range(12):
        for tn, iv in TYP.items():
            s = np.zeros(12); s[[(r + i) % 12 for i in iv]] = 1; s /= np.linalg.norm(s)
            v = float(c @ s) - (0.02 if tn in ("dim", "sus4", "+") else 0)
            if best is None or v > best[0]: best = (v, r, tn)
    akk.append(best); t0 += takt
typen = {}
for _, r, tn in akk: typen[tn or "Dur"] = typen.get(tn or "Dur", 0) + 1
erg["akkordtypen_anteil"] = {k: round(v / len(akk), 2) for k, v in typen.items()}
bew = {}
wechsel = 0
for (_, r1, _), (_, r2, _) in zip(akk[:-1], akk[1:]):
    d = (r2 - r1) % 12
    if d: wechsel += 1
    bew[d] = bew.get(d, 0) + 1
erg["grundton_bewegung_halbtoene_anteil"] = {int(k): round(v / (len(akk) - 1), 2) for k, v in sorted(bew.items())}
erg["takte_mit_wechsel"] = round(wechsel / (len(akk) - 1), 2)
erg["takte"] = len(akk)
t = json.dumps(erg, ensure_ascii=False, indent=1)
if a.json: open(a.json, "w").write(t)
print(t)
