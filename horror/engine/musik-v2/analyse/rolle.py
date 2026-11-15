# Gemittelte Schleife als Klavierrolle (CQT-Betrag), ausgerichtet über CQT-Korrelation.
# Aufruf: python -I rolle.py <stem.wav> <name> <periode_s> <cent> <bpm> [--ende s] [--fmin C3] [--okt 4]
#         [--start s] [--bpo 36] [--png breite]
# Schreibt <name>-rolle.png (Bild mit Ton-Gitter und Achtel-Gitter) und <name>-rolle.npy (Halbton-Matrix).
import argparse, json
import numpy as np, librosa
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt

ap = argparse.ArgumentParser()
ap.add_argument("wav"); ap.add_argument("name"); ap.add_argument("periode", type=float)
ap.add_argument("cent", type=float); ap.add_argument("bpm", type=float)
ap.add_argument("--ende", type=float, default=0); ap.add_argument("--start", type=float, default=0)
ap.add_argument("--fmin", default="C3"); ap.add_argument("--okt", type=int, default=4)
ap.add_argument("--bpo", type=int, default=36)
ap.add_argument("--teil", type=float, default=0, help="nur die ersten x s der Schleife zeigen")
ap.add_argument("--einzeln", action="store_true", help="statt Mittel jede Wiederholung untereinander")
a = ap.parse_args()

sr = 22050; hop = 128
y, _ = librosa.load(a.wav, sr=sr, mono=True)
if a.ende: y = y[: int(a.ende * sr)]
fmin = librosa.note_to_hz(a.fmin) * 2 ** (a.cent / 1200)
nb = 12 * a.okt
k = a.bpo // 12
C = np.abs(librosa.cqt(y, sr=sr, hop_length=hop, fmin=fmin * 2 ** (-(k // 2) / a.bpo), n_bins=nb * k,
                       bins_per_octave=a.bpo, filter_scale=1.5))
fps = sr / hop
L = int(round(a.periode * fps))
D = np.log1p(30 * C / C.max())
# Wiederholungen ausrichten: Korrelation mit der ersten (±0,25 s)
st0 = int(a.start * fps)
ref = D[:, st0:st0 + L]
segs = []; lagen = []
s = st0
while s + L <= D.shape[1]:
    best, bm = -1, s
    for d in range(-int(0.25 * fps), int(0.25 * fps) + 1):
        j = s + d
        if j < 0 or j + L > D.shape[1]: continue
        v = np.sum(ref * D[:, j:j + L])
        if v > best: best, bm = v, j
    segs.append(D[:, bm:bm + L]); lagen.append(bm / fps)
    s = bm + L
print("Starts", [round(x, 2) for x in lagen])
korr = [float(np.corrcoef(sg.ravel(), np.mean(segs, 0).ravel())[0, 1]) for sg in segs]
print("Korr je Wdh", [round(x, 3) for x in korr])
M = np.median(segs, 0)  # Median ist robuster gegen Stimmreste als Mittel
np.save(f"{a.name}-rolle.npy", M)
json.dump({"starts": lagen, "korr": korr, "fps": fps, "fmin_midi": int(round(librosa.hz_to_midi(librosa.note_to_hz(a.fmin)))),
           "bpo": a.bpo, "cent": a.cent}, open(f"{a.name}-rolle.json", "w"))
zeig = [M] if not a.einzeln else segs
T = L if not a.teil else int(a.teil * fps)
fig, axs = plt.subplots(len(zeig), 1, figsize=(max(14, T / fps * 1.6), 0.09 * nb * k / 3 * len(zeig) + 1), squeeze=False)
m0 = int(round(librosa.hz_to_midi(librosa.note_to_hz(a.fmin))))
for ax, Z in zip(axs[:, 0], zeig):
    ax.imshow(Z[:, :T] ** 1.5, origin="lower", aspect="auto", cmap="magma", extent=[0, T / fps, -(k // 2 + 0.5) / k, nb - (k // 2 + 0.5) / k])
    for i in range(nb):
        mm = m0 + i
        nm = librosa.midi_to_note(mm, unicode=False)
        ax.axhline(i - 0.5, color="w" if nm.startswith("C") and "#" not in nm else "#555", lw=0.4 if "C" in nm else 0.2)
    ax.set_yticks(range(nb)); ax.set_yticklabels([librosa.midi_to_note(m0 + i, unicode=False) for i in range(nb)], fontsize=6)
    achtel = 30 / a.bpm
    for j in range(int(T / fps / achtel) + 1):
        ax.axvline(j * achtel, color="c" if j % 8 == 0 else ("#0aa" if j % 2 == 0 else "#044"), lw=0.8 if j % 8 == 0 else 0.4)
    ax.set_xticks([j * achtel * 2 for j in range(int(T / fps / achtel / 2) + 1)])
    ax.set_xticklabels([f"{j // 4 + 1}.{j % 4 + 1}" for j in range(int(T / fps / achtel / 2) + 1)], fontsize=6)
plt.tight_layout(); plt.savefig(f"{a.name}-rolle.png", dpi=110)
