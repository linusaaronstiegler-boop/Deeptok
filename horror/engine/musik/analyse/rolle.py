# Klavierrolle aus einem Stem: je Halbton (CQT, Stimmung berücksichtigt) Anschläge = Anstieg >= 9 dB
# in 60 ms über -28 dB (rel. Maximum), nur wenn lauter als beide Nachbar-Halbtöne. Daraus nur Statistiken:
# Dichte, Mehrstimmigkeit, Tonlänge, Register, Abstände, Rastertreue, Anschlagstärke, Klangfarbe (Teiltöne).
import json, argparse
import numpy as np, soundfile as sf, librosa
from scipy import signal
ap = argparse.ArgumentParser(); ap.add_argument("datei"); ap.add_argument("--stimmung", type=float, default=0)
ap.add_argument("--bpm", type=float, required=True); ap.add_argument("--fmin", type=float, default=130.81)
ap.add_argument("--okt", type=int, default=4); ap.add_argument("--start", type=float, default=0); ap.add_argument("--ende", type=float)
ap.add_argument("--schwelle", type=float, default=-28); ap.add_argument("--anstieg", type=float, default=9); ap.add_argument("--json"); ap.add_argument("--ende_hall", type=float, help="Zeit des letzten Einsatzes für Nachhallmessung")
a = ap.parse_args()
y2, sr = sf.read(a.datei, always_2d=True, dtype="float32")
yfull = y2.mean(1)
y = yfull[int(a.start * sr): int(a.ende * sr) if a.ende else None]
SR = 22050; y = librosa.resample(y, orig_sr=sr, target_sr=SR); hop = 128; fps = SR / hop
fmin = a.fmin * 2 ** (a.stimmung / 1200)
C = np.abs(librosa.cqt(y, sr=SR, hop_length=hop, fmin=fmin, n_bins=12 * a.okt, bins_per_octave=12, filter_scale=1.5))
D = librosa.amplitude_to_db(C, ref=np.max)
from scipy.ndimage import uniform_filter1d
D = uniform_filter1d(D, 5, axis=1)   # gegen Schwebungen und Trennartefakte glätten (29 ms)
spitze = np.zeros_like(D, dtype=bool)  # nur Halbtöne, die lauter als beide Nachbarn sind (keine Übersprecher)
spitze[1:-1] = (D[1:-1] >= D[:-2]) & (D[1:-1] >= D[2:])
m0 = int(round(librosa.hz_to_midi(a.fmin)))
lag = int(0.06 * fps)
noten = []
for k in range(D.shape[0]):
    d = D[k]
    anstieg = d[lag:] - d[:-lag]
    pk, _ = signal.find_peaks(anstieg, height=a.anstieg, distance=int(0.15 * fps))
    for p in pk:
        f = p + lag
        top = f + int(np.argmax(d[f:f + lag + 1]))
        if d[top] < a.schwelle or not spitze[k, top]: continue
        # Tonende: Abfall um 15 dB unter die Spitze
        rest = d[top:top + int(3 * fps)]
        e = np.argmax(rest < d[top] - 15)
        dauer = (e if e > 0 else len(rest)) / fps
        noten.append([top / fps, m0 + k, float(d[top]), dauer])
noten.sort()
# Oktav-/Teilton-Duplikate entfernen: gleichzeitiger Anschlag (±40 ms) 12/19/24 Halbtöne höher und >= 8 dB leiser
rein = []
for i, n in enumerate(noten):
    dup = False
    for m in noten:
        if m is n: continue
        if abs(m[0] - n[0]) < 0.04 and (n[1] - m[1]) in (12, 19, 24, 28, 31, 32) and n[2] < m[2] - 8:
            dup = True; break
    if not dup: rein.append(n)
noten = np.array(rein)
T = len(y) / SR
erg = {"datei": a.datei, "dauer_s": round(T, 1), "anschlaege": len(noten), "anschlaege_pro_s": round(len(noten) / T, 2)}
t, m, v, dur = noten.T
# Gleichzeitigkeit: Anschläge innerhalb 40 ms bilden einen Einsatz
gruppen = []; 
for i in range(len(t)):
    if gruppen and t[i] - gruppen[-1][0] < 0.04: gruppen[-1][1].append(i)
    else: gruppen.append([t[i], [i]])
erg["einsaetze_pro_s"] = round(len(gruppen) / T, 2)
erg["toene_je_einsatz_mittel"] = round(float(np.mean([len(g[1]) for g in gruppen])), 2)
# Rastertreue zum Achtel
ach = 30 / a.bpm
gt = np.array([g[0] for g in gruppen])
best = min(((np.mean(np.abs((gt - ph) / ach - np.round((gt - ph) / ach))), ph) for ph in np.linspace(0, ach, 60, endpoint=False)))
ph = best[1]; abw = ((gt - ph) / ach - np.round((gt - ph) / ach)) * ach * 1000
erg["achtel_s"] = round(ach, 4)
erg["raster_abweichung_ms_median_abs"] = round(float(np.median(np.abs(abw))), 1)
erg["anteil_einsaetze_auf_achtel_pm35ms"] = round(float(np.mean(np.abs(abw) < 35)), 2)
belegt = len(set(np.round((gt - ph) / ach).astype(int)))
erg["belegte_achtel_anteil"] = round(belegt / (T / ach), 2)
# Sechzehntel zwischen den Achteln?
sech = ((gt - ph) / (ach / 2)); erg["anteil_auf_sechzehntel_zwischen"] = round(float(np.mean(np.abs(sech - np.round(sech)) < 0.25) - np.mean(np.abs(abw) < ach * 250)), 2)
erg["register_p5_p50_p95"] = [librosa.midi_to_note(int(np.percentile(m, q))) for q in (5, 50, 95)]
erg["register_hz_p5_p95"] = [round(float(librosa.midi_to_hz(np.percentile(m, q)) * 2 ** (a.stimmung / 1200)), 0) for q in (5, 95)]
erg["tonlaenge_s_p25_p50_p75"] = [round(float(np.percentile(dur, q)), 2) for q in (25, 50, 75)]
erg["anschlag_db_streuung"] = round(float(np.std(v)), 1)
# Melodische Abstände zwischen aufeinanderfolgenden Einsätzen (höchster Ton je Einsatz)
hoch = np.array([m[g[1]].max() for g in gruppen]); iv = np.diff(hoch); iv = iv[np.abs(iv) <= 24]
erg["oberstimme_schritt_1_2"] = round(float(np.mean(np.isin(np.abs(iv), [1, 2]))), 2)
erg["oberstimme_terz_quarte_3_5"] = round(float(np.mean(np.isin(np.abs(iv), [3, 4, 5]))), 2)
erg["oberstimme_ab_6"] = round(float(np.mean(np.abs(iv) >= 6)), 2)
erg["oberstimme_gleich"] = round(float(np.mean(iv == 0)), 2)
# Wiederkehrender Ton (Orgelpunkt): Anteil der Takte, in denen der häufigste Ton vorkommt
takt = 8 * ach
pcs = np.bincount(m.astype(int), minlength=128)
haeufig = int(np.argmax(pcs))
nt = int(T / takt)
erg["haeufigster_ton"] = librosa.midi_to_note(haeufig)
erg["haeufigster_ton_anteil_anschlaege"] = round(float(pcs[haeufig] / len(m)), 2)
erg["haeufigster_ton_in_takten_anteil"] = round(float(np.mean([np.any((m == haeufig) & (t >= i * takt) & (t < (i + 1) * takt)) for i in range(nt)])), 2)
# Klangfarbe: mittleres Spektrum 30-150 ms nach starken Einzelanschlägen, Teiltöne relativ zum Grundton
Y = np.abs(np.fft.rfft(np.zeros(8192)))
spektren = []
ff = np.fft.rfftfreq(4096, 1 / SR)
for g in gruppen:
    if len(g[1]) != 1: continue
    i = g[1][0]
    if v[i] < -12: continue
    s0 = int((t[i] + 0.03) * SR); seg = y[s0:s0 + 4096]
    if len(seg) < 4096: continue
    F = np.abs(np.fft.rfft(seg * np.hanning(4096)))
    f0 = librosa.midi_to_hz(m[i]) * 2 ** (a.stimmung / 1200)
    def amp(r):
        sel = (ff > f0 * r * 0.97) & (ff < f0 * r * 1.03)
        return F[sel].max() if sel.any() else 0
    a1 = amp(1.0)
    if a1 <= 0: continue
    spektren.append([20 * np.log10(amp(r) / a1 + 1e-6) for r in (2.0, 3.0, 4.0, 5.0, 5.4, 6.27, 8.0, 17.55)])
if spektren:
    sp = np.median(np.array(spektren), axis=0)
    erg["teiltoene_db_rel_grundton"] = dict(zip(["2x", "3x", "4x", "5x", "5.4x", "6.27x", "8x", "17.55x"], [round(float(x), 1) for x in sp]))
    erg["teiltoene_n"] = len(spektren)
# Nachhall am Ende: nach dem letzten Einsatz Abfall der Breitbandenergie (Schroeder-artig)
if a.ende_hall:
    s0 = int(a.ende_hall * sr); seg = yfull[s0:s0 + int(6 * sr)]
    e = np.convolve(seg ** 2, np.ones(int(0.02 * sr)) / int(0.02 * sr), mode="same")
    edb = 10 * np.log10(e + 1e-12); edb -= edb[:int(0.3 * sr)].max()
    tt = np.arange(len(edb)) / sr
    i5 = np.argmax(edb < -5); i25 = np.argmax(edb < -25)
    if i25 > i5 > 0:
        erg["nachhall_ende_rt60_s"] = round(float(3 * (tt[i25] - tt[i5])), 2)
        erg["nachhall_ende_t_minus5_minus25_s"] = [round(float(tt[i5]), 2), round(float(tt[i25]), 2)]
t2 = json.dumps(erg, ensure_ascii=False, indent=1)
if a.json: open(a.json, "w").write(t2)
print(t2)
