# Blinde Nachhall-Schätzung (vereinfachtes Verfahren nach dem Prinzip „freie Abklingstrecken"):
# In Oktavbändern 500 Hz - 4 kHz die Energiehüllkurve (10 ms) in dB bilden, alle Abschnitte suchen,
# die >= 200 ms ohne Wiederanstieg um >= 12 dB fallen, Steigung per Regression; die langsamste
# Abklingrate im unteren Quartil der Steilheit gilt als Raumanteil. Gleiches Verfahren für Referenz
# und eigene Fassung, deshalb vergleichbar, auch wenn die absolute Zahl grob ist.
import sys, json, numpy as np, soundfile as sf
from scipy import signal
def schaetzen(pfad, ende=None):
    y, sr = sf.read(pfad, always_2d=True); m = y.mean(1)[: int(ende * sr) if ende else None]
    erg = {}
    for fc in (500, 1000, 2000, 4000):
        b, a = signal.butter(3, [fc / 2 ** 0.5, fc * 2 ** 0.5], btype="band", fs=sr)
        x = signal.lfilter(b, a, m)
        h = int(0.01 * sr)
        e = np.add.reduceat(x[: len(x) // h * h] ** 2, np.arange(0, len(x) // h * h, h)) / h
        d = 10 * np.log10(e + 1e-14)
        d = np.convolve(d, np.ones(3) / 3, mode="same")
        st = []
        i = 0
        while i < len(d) - 20:
            j = i
            while j + 1 < len(d) and d[j + 1] <= d[j] + 0.5 and d[j + 1] <= d[i]:
                j += 1
            if j - i >= 20 and d[i] - d[j] >= 12:
                t = np.arange(j - i + 1) * 0.01
                st.append(np.polyfit(t, d[i:j + 1], 1)[0])
            i = max(j, i + 1)
        if len(st) >= 5:
            st = np.array(st)
            erg[f"{fc}"] = {"abschnitte": len(st), "rt60_median_s": round(float(-60 / np.median(st)), 2),
                            "rt60_langsam_p75_s": round(float(-60 / np.percentile(st, 75)), 2)}
    return erg
if __name__ == "__main__":
    print(json.dumps(schaetzen(sys.argv[1], float(sys.argv[2]) if len(sys.argv) > 2 else None), indent=1))
