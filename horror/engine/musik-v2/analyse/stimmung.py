# Genaue Stimmung aus Spektralspitzen: lange FFT, parabolische Interpolation, Abweichung zur
# gleichstufigen Stimmung (A=440) je Spitze, gewichtet nach Pegel.
import sys, numpy as np, librosa
y, sr = librosa.load(sys.argv[1], sr=44100, mono=True, duration=float(sys.argv[2]) if len(sys.argv) > 2 else None)
N = 1 << 17
w = np.hanning(N)
spek = np.zeros(N // 2 + 1)
for i in range(0, len(y) - N, N // 2):
    spek += np.abs(np.fft.rfft(y[i:i + N] * w)) ** 2
db = 10 * np.log10(spek + 1e-20)
f = np.fft.rfftfreq(N, 1 / sr)
from scipy.signal import find_peaks
lo, hi = np.searchsorted(f, 120), np.searchsorted(f, 3000)
pk, pr = find_peaks(db[lo:hi], prominence=12, distance=8)
pk += lo
rows = []
for p in pk:
    a, b, c = db[p - 1], db[p], db[p + 1]
    d = 0.5 * (a - c) / (a - 2 * b + c)
    fr = (p + d) * sr / N
    m = 69 + 12 * np.log2(fr / 440)
    rows.append((db[p], fr, m))
rows.sort(key=lambda r: -r[0])
top = rows[:25]
cents = np.array([(r[2] - round(r[2])) * 100 for r in top]); gew = np.array([10 ** (r[0] / 20) for r in top])
for r in top[:14]:
    print(f"{r[1]:8.1f} Hz  {librosa.midi_to_note(int(round(r[2])), unicode=False):4s} {(r[2]-round(r[2]))*100:+6.1f} c  {r[0]-top[0][0]:6.1f} dB")
# Kreismittel (wegen ±50-Cent-Mehrdeutigkeit)
ang = np.angle(np.sum(gew * np.exp(1j * 2 * np.pi * cents / 100)))
print("Stimmung (Kreismittel) Cent", round(ang / (2 * np.pi) * 100, 1))
