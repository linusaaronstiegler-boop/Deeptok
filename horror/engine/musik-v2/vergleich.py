# Misst, wie nah ein Klangbett an der Referenz liegt.
# Aufruf: python -I vergleich.py <referenz.wav> <ref_start> <ref_ende> <schleife_s> <kandidat.wav> [...] [--json out.json]
# Kennzahlen (je Kandidat):
#   chroma_korr   Tonklassen-Verlauf, gleiche Tonart und gleiches Tempo erzwungen: eine Referenz-Schleife
#                 (Median über alle Wiederholungen) wird über den Kandidaten geschoben, beste mittlere
#                 Kosinus-Ähnlichkeit je Rahmen (1 = identischer harmonischer Verlauf).
#   chroma_frei   dasselbe, aber Transposition und Tempo frei (wie analyse/fingerabdruck.py).
#   periode_s     gemessene Schleifenlänge (Chroma-Autokorrelation 8–25 s), bpm (librosa)
#   stimmung      Abweichung von A440 in Cent
#   spektral_db   RMS-Abstand der Terzspektren 160 Hz – 8 kHz (dB, beide auf gleiche Leistung normiert);
#                 spektral_kern_db nur über die Bänder, die in der Referenz höchstens 30 dB unter dem stärksten liegen
#   laut_korr     Korrelation des Lautheitsverlaufs (400 ms, Median-Schleife, an der Chroma-Lage ausgerichtet,
#                 Feinlage ±0,5 s und halbe Schleife geprüft), dazu st_std (Streuung der 3-s-Lautheit, LU)
#   onsets_s, seite_mitte_db
import argparse, json
import numpy as np, librosa, soundfile as sf, pyloudnorm as pyln
from scipy import signal
from scipy.signal import fftconvolve

SR = 22050; HOP = 512
TERZ = [31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600,
        2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500]


def laden(p, a=None, b=None):
    y, sr = sf.read(p, always_2d=True, dtype="float64")
    y = y[int((a or 0) * sr): int(b * sr) if b else len(y)]
    return y, sr


def chroma(y_mono, tun=None):
    # Stimmung: der Kandidat wird mit der Stimmung der Referenz gelesen. Liegt eine Vorlage fast genau
    # einen Viertelton neben A440 (r2/r5: +46 bis +60 Cent), würde eine eigene Schätzung je Datei die
    # Tonklassen sonst zufällig um einen Halbton verschieden benennen.
    if tun is None:
        tun = librosa.estimate_tuning(y=y_mono, sr=SR)
    c = librosa.feature.chroma_cqt(y=y_mono, sr=SR, hop_length=HOP, tuning=tun, bins_per_octave=36)
    return c / (np.linalg.norm(c, axis=0, keepdims=True) + 1e-9), float(tun)


def schleifen_median(c, L):
    """Median-Schleife: alle Wiederholungen (Länge L Rahmen) übereinander, je Rahmen der Median."""
    k = c.shape[1] // L
    if k < 1:
        return c
    st = np.stack([c[:, i * L:(i + 1) * L] for i in range(k)])
    m = np.median(st, 0)
    return m / (np.linalg.norm(m, axis=0, keepdims=True) + 1e-9)


def schieben(ref, kand):
    """Beste Lage (ohne Dehnung/Transposition): mittlere Kosinus-Ähnlichkeit je Lage."""
    L = ref.shape[1]
    if kand.shape[1] < L:
        kand = np.hstack([kand, kand[:, : L - kand.shape[1] + 1]])
    kk = sum(fftconvolve(kand[i], ref[i][::-1], mode="valid") for i in range(12)) / L
    j = int(np.argmax(kk))
    return float(kk[j]), j


def frei(ref, kand):
    best = (-1, 1.0, 0)
    for s in np.arange(0.70, 1.46, 0.02):
        L = int(round(ref.shape[1] * s))
        if L >= kand.shape[1] - 2:
            continue
        x0 = np.linspace(0, ref.shape[1] - 1, L)
        r = np.stack([np.interp(x0, np.arange(ref.shape[1]), ref[i]) for i in range(12)])
        r /= np.linalg.norm(r, axis=0, keepdims=True) + 1e-9
        for rot in range(12):
            v, _ = schieben(np.roll(r, rot, 0), kand)
            if v > best[0]:
                best = (v, float(s), rot)
    return best


def periode(c, lo_s=8, hi_s=25):
    fps = SR / HOP
    n = c.shape[1]
    lo, hi = int(lo_s * fps), min(int(hi_s * fps), n // 2)
    w = [np.mean(np.sum(c[:, :n - L] * c[:, L:], 0)) for L in range(lo, hi)]
    return (lo + int(np.argmax(w))) / fps


def terz_db(y, sr):
    f, P = signal.welch(y.mean(1), sr, nperseg=16384, noverlap=8192)
    nutz = (f >= 20) & (f <= 16000); ges = P[nutz].sum()
    return np.array([10 * np.log10(P[(f >= fc / 2 ** (1 / 6)) & (f < fc * 2 ** (1 / 6))].sum() / ges + 1e-20) for fc in TERZ])


def momentan(y, sr, fenster=0.4, schritt=0.1):
    m = pyln.Meter(sr)
    yk = y.copy()
    for f in m._filters.values():
        yk = f.passband_gain * signal.lfilter(f.b, f.a, yk, axis=0)
    p = (yk ** 2).sum(1)
    n = int(fenster * sr); h = int(schritt * sr)
    c = np.concatenate([[0], np.cumsum(p)])
    idx = np.arange(0, len(p) - n, h)
    return -0.691 + 10 * np.log10((c[idx + n] - c[idx]) / n + 1e-20)


def kennzahlen(y, sr, tun=None):
    mono = librosa.resample(y.mean(1).astype(np.float32), orig_sr=sr, target_sr=SR)
    eigen = float(librosa.estimate_tuning(y=mono, sr=SR) * 100)
    c, tun = chroma(mono, tun)
    mitte = y.mean(1); seite = (y[:, 0] - y[:, 1]) / 2
    st = momentan(y, sr, 3.0, 0.1)
    st = st[st > st.max() - 30]
    ons = librosa.onset.onset_detect(y=mono, sr=SR, hop_length=HOP)
    return dict(c=c, stimmung=eigen, tun=tun, terz=terz_db(y, sr), mom=momentan(y, sr), st_std=float(np.std(st)),
                seite_mitte_db=float(10 * np.log10((seite ** 2).mean() / ((mitte ** 2).mean() + 1e-20) + 1e-20)),
                onsets_s=float(len(ons) / (len(mono) / SR)),
                bpm=float(np.atleast_1d(librosa.feature.tempo(y=mono, sr=SR))[0]),
                lufs=float(pyln.Meter(sr).integrated_loudness(y)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ref"); ap.add_argument("ref_a", type=float); ap.add_argument("ref_b", type=float)
    ap.add_argument("schleife", type=float); ap.add_argument("kand", nargs="+"); ap.add_argument("--json")
    a = ap.parse_args()
    yr, sr = laden(a.ref, a.ref_a, a.ref_b)
    R = kennzahlen(yr, sr)
    fps = SR / HOP
    L = int(round(a.schleife * fps))
    ref_loop = schleifen_median(R["c"], L)
    R["periode_s"] = periode(R["c"])
    band = (np.array(TERZ) >= 160) & (np.array(TERZ) <= 8000)
    erg = {"referenz": {"datei": a.ref, "abschnitt": [a.ref_a, a.ref_b], "periode_s": round(R["periode_s"], 3),
                        "bpm": round(R["bpm"], 2), "stimmung_cent": round(R["stimmung"], 1), "st_std_lu": round(R["st_std"], 2),
                        "onsets_s": round(R["onsets_s"], 2), "seite_mitte_db": round(R["seite_mitte_db"], 1)},
           "kandidaten": []}
    # Lautheitsverlauf der Referenz über eine Schleife (Median über Wiederholungen, 0,1-s-Raster)
    Lm = int(round(a.schleife / 0.1))
    km = len(R["mom"]) // Lm
    ref_mom = np.median(np.stack([R["mom"][i * Lm:(i + 1) * Lm] for i in range(km)]), 0)
    for k in a.kand:
        y, srk = laden(k)
        K = kennzahlen(y, srk, tun=R["tun"])
        sim, j = schieben(ref_loop, K["c"])
        fr = frei(ref_loop, K["c"])
        # Lautheitsverlauf: Schleife des Kandidaten ab der Chroma-Lage, gegen die Referenz-Schleife.
        # Die Akkordfolge läuft je Schleife zweimal (Takt 1–4 = 5–8), die Chroma-Lage ist deshalb nur bis
        # auf eine halbe Schleife eindeutig: beide Lagen werden geprüft, die bessere zählt.
        kmom = K["mom"]
        km_loop = np.median(np.stack([kmom[i * Lm:(i + 1) * Lm] for i in range(max(1, len(kmom) // Lm))]), 0)
        lk = -1.0
        for versatz in (0.0, a.schleife / 2):
            i0 = int(round((j * HOP / SR + versatz) / 0.1))
            for fein in range(-5, 6):  # ±0,5 s: die Chroma-Lage ist auf etwa eine Achtel genau
                kl = np.roll(km_loop, -(i0 + fein))
                lk = max(lk, float(np.corrcoef(kl[:len(ref_mom)], ref_mom[:len(kl)])[0, 1]))
        d = np.maximum(K["terz"], -60) - np.maximum(R["terz"], -60)
        d = d - np.mean(d[band])
        erg["kandidaten"].append({
            "datei": k, "chroma_korr": round(sim, 3),
            "chroma_frei": {"wert": round(fr[0], 3), "dehnung": round(fr[1], 2), "transp_ht": fr[2]},
            "periode_s": round(periode(K["c"]), 3), "bpm": round(K["bpm"], 2), "stimmung_cent": round(K["stimmung"], 1),
            "spektral_db": round(float(np.sqrt(np.mean(d[band] ** 2))), 2),
            # nur Bänder, in denen die Referenz wirklich Energie hat (höchstens 30 dB unter ihrem stärksten Band)
            "spektral_kern_db": round(float(np.sqrt(np.mean(d[band & (R["terz"] > R["terz"].max() - 30)] ** 2))), 2),
            "laut_korr": round(lk, 3), "st_std_lu": round(K["st_std"], 2),
            "onsets_s": round(K["onsets_s"], 2), "seite_mitte_db": round(K["seite_mitte_db"], 1)})
    t = json.dumps(erg, ensure_ascii=False, indent=1)
    if a.json:
        open(a.json, "w").write(t)
    r = erg["referenz"]
    print(f"Referenz: Periode {r['periode_s']} s, {r['bpm']} BPM, {r['stimmung_cent']:+} Cent, st_std {r['st_std_lu']} LU, "
          f"{r['onsets_s']} Einsätze/s, S/M {r['seite_mitte_db']} dB")
    for c in erg["kandidaten"]:
        print(f"{c['datei'].split('/')[-1][:34]:34s} Chroma {c['chroma_korr']:.3f} (frei {c['chroma_frei']['wert']:.3f}, "
              f"x{c['chroma_frei']['dehnung']}, {c['chroma_frei']['transp_ht']:+d} HT)  Periode {c['periode_s']} s  "
              f"{c['bpm']} BPM  {c['stimmung_cent']:+} c  Spektrum {c['spektral_db']} dB (Kern {c['spektral_kern_db']})  Laut-Korr {c['laut_korr']:.2f}  "
              f"st_std {c['st_std_lu']}  {c['onsets_s']}/s  S/M {c['seite_mitte_db']}")


if __name__ == "__main__":
    main()
