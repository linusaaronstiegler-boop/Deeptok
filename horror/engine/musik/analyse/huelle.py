# Hüllkurve des Orgelpunkt-Tons nach jedem Anschlag (schmales Band ±1,5 %), Median über alle Anschläge
import sys, numpy as np, soundfile as sf
from scipy import signal
f, f0 = sys.argv[1], float(sys.argv[2]); ende = float(sys.argv[3]) if len(sys.argv) > 3 else 140
y, sr = sf.read(f, always_2d=True); m = y.mean(1)[:int(ende * sr)]
b, a = signal.butter(2, [f0 * 0.985, f0 * 1.015], btype="band", fs=sr); x = signal.filtfilt(b, a, m)
env = np.abs(signal.hilbert(x)); h = int(0.01 * sr)
d = 20 * np.log10(env[:len(env) // h * h].reshape(-1, h).mean(1) + 1e-9); d -= np.percentile(d, 99)
pk, _ = signal.find_peaks(d, height=-10, distance=15, prominence=8)
pr = np.median(np.array([d[p:p + 120] - d[p] for p in pk if p + 120 < len(d)]), axis=0)
i10 = np.argmax(pr < -10); i20 = np.argmax(pr < -20)
print(f"Anschläge {len(pk)}; -10 dB nach {i10*0.01:.2f} s, -20 dB nach {i20*0.01 if i20 else float('nan'):.2f} s;", [round(float(pr[i]), 1) for i in range(0, 60, 5)])
