# Log-Frequenz-Spektrogramm (CQT) eines Ausschnitts als PNG, Notennamen auf der y-Achse.
import sys, numpy as np, soundfile as sf, librosa, matplotlib
matplotlib.use("Agg"); import matplotlib.pyplot as plt
datei, t0, t1, aus = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
fmin = float(sys.argv[5]) if len(sys.argv) > 5 else 65.4
cent = float(sys.argv[6]) if len(sys.argv) > 6 else 0.0
y, sr = sf.read(datei, always_2d=True, dtype="float32"); y = y[int(t0 * sr):int(t1 * sr)].mean(1)
y = librosa.resample(y, orig_sr=sr, target_sr=22050)
C = librosa.amplitude_to_db(np.abs(librosa.cqt(y, sr=22050, hop_length=128, fmin=fmin * 2 ** (cent / 1200), n_bins=72 * 3, bins_per_octave=36)), ref=np.max)
fig, ax = plt.subplots(figsize=(18, 7))
ax.imshow(C, origin="lower", aspect="auto", cmap="magma", vmin=-60, vmax=0, extent=[t0, t1, 0, C.shape[0]])
m0 = librosa.hz_to_midi(fmin)
ticks = [i for i in range(0, C.shape[0], 3) if int(round(m0 + i / 3)) % 12 in (0, 4, 7)]
ax.set_yticks(ticks); ax.set_yticklabels([librosa.midi_to_note(int(round(m0 + i / 3))) for i in ticks], fontsize=7)
ax.grid(axis="y", alpha=0.2); ax.set_xlabel("s")
fig.tight_layout(); fig.savefig(aus, dpi=80)
