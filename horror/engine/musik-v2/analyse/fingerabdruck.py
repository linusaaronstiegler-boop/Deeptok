# Prüft, ob eine Audiodatei dasselbe Stück enthält wie eine Referenz-Schleife – unabhängig von
# Tonart (Transposition), Verstimmung (Cent) und Tempo (Dehnung 0,70–1,45).
# Aufruf: python -I fingerabdruck.py <schleife.wav> <kandidat1> [kandidat2 ...]
# Verfahren: Chroma (12 Tonklassen) mit eigener Stimmungsschätzung je Datei; die Referenz-Schleife
# wird für jede Dehnung neu abgetastet und per FFT-Kreuzkorrelation über den Kandidaten geschoben,
# für alle 12 Transpositionen. Ergebnis: beste mittlere Kosinus-Ähnlichkeit und ihr Abstand zum
# Rauschen (z-Wert gegenüber allen anderen Lagen). Treffer: Ähnlichkeit >= 0,78 UND z >= 4,5 (geeicht: r2 gegen r5, dasselbe Stück
# 3 Halbtöne tiefer und 1,2x langsamer: 0,82 / z 5,2; fremde Stücke 0,55–0,61 / z 2,4–3,1).
import sys, numpy as np, librosa
from scipy.signal import fftconvolve

SR = 22050; HOP = 1024


def chroma(pfad, max_s=240):
    y, _ = librosa.load(pfad, sr=SR, mono=True, duration=max_s)
    y = librosa.effects.harmonic(y, margin=2.0)
    tun = librosa.estimate_tuning(y=y, sr=SR)
    c = librosa.feature.chroma_cqt(y=y, sr=SR, hop_length=HOP, tuning=tun, bins_per_octave=36)
    c = c / (np.linalg.norm(c, axis=0, keepdims=True) + 1e-9)
    return c, tun * 100, len(y) / SR


def vergleich(ref, kand):
    best = (-1, None, None, None)
    alle = []
    n = kand.shape[1]
    for s in np.arange(0.70, 1.46, 0.02):
        L = int(round(ref.shape[1] * s))
        if L >= n - 2: continue
        # Referenz auf L Rahmen dehnen (lineare Interpolation je Tonklasse)
        x0 = np.linspace(0, ref.shape[1] - 1, L)
        r = np.stack([np.interp(x0, np.arange(ref.shape[1]), ref[i]) for i in range(12)])
        r = r / (np.linalg.norm(r, axis=0, keepdims=True) + 1e-9)
        for rot in range(12):
            rr = np.roll(r, rot, axis=0)
            # Summe über Tonklassen der Kreuzkorrelationen = Summe der Skalarprodukte je Lage
            kk = sum(fftconvolve(kand[i], rr[i][::-1], mode="valid") for i in range(12)) / L
            alle.append(kk)
            j = int(np.argmax(kk))
            if kk[j] > best[0]:
                best = (float(kk[j]), s, rot, j)
    werte = np.concatenate(alle)
    z = (best[0] - werte.mean()) / (werte.std() + 1e-9)
    return best, float(z)


if __name__ == "__main__":
    ref, tref, dref = chroma(sys.argv[1])
    print(f"Referenz {sys.argv[1]}: {dref:.1f} s, Stimmung {tref:+.0f} Cent")
    for k in sys.argv[2:]:
        c, t, d = chroma(k)
        (sim, s, rot, j), z = vergleich(ref, c)
        urteil = "TREFFER" if sim >= 0.78 and z >= 4.5 else ("ähnlich" if sim >= 0.70 else "nein")
        print(f"{k.split('/')[-1][:60]:60s} {d:6.1f} s  Ähnl. {sim:.3f}  z {z:5.1f}  Dehnung {s:.2f}  "
              f"Transp. {rot:+d} HT  bei {j * HOP / SR:6.1f} s  -> {urteil}")
