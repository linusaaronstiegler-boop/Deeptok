# Analytisches Hören eines Referenz-Stems: Stimmung, Tempo, Raster, Schleife, Notenstatistik,
# Register, Tonlänge, Hall, Breite, Lautheitsverlauf. Gibt JSON aus.
# Es werden nur Statistiken behalten (Intervall-Histogramm, Register, Tonklassen), keine Tonfolge.
import json, argparse
import numpy as np, soundfile as sf, librosa
from scipy import signal

ap = argparse.ArgumentParser()
ap.add_argument("datei"); ap.add_argument("--start", type=float, default=0); ap.add_argument("--ende", type=float)
ap.add_argument("--fmin", type=float, default=110.0); ap.add_argument("--okt", type=int, default=6)
ap.add_argument("--json")
a = ap.parse_args()

y, sr = sf.read(a.datei, always_2d=True, dtype="float32")
y = y[int(a.start * sr): int(a.ende * sr) if a.ende else None]
mitte = y.mean(1); seite = (y[:, 0] - y[:, 1]) / 2
mono = librosa.resample(mitte, orig_sr=sr, target_sr=22050); SR = 22050
mono /= np.abs(mono).max() + 1e-9
erg = {"datei": a.datei, "dauer_s": round(len(mono) / SR, 2)}

# --- Stimmung: fein (1/100 Halbton), aus Spitzen im Spektrum
tun = librosa.estimate_tuning(y=mono, sr=SR, resolution=0.01, bins_per_octave=12)
erg["stimmung_cent"] = round(100 * float(tun), 1)

# --- Einsätze und Tempo
hop = 256
env = librosa.onset.onset_strength(y=mono, sr=SR, hop_length=hop)
ons = librosa.onset.onset_detect(onset_envelope=env, sr=SR, hop_length=hop, units="time", backtrack=False)
erg["einsaetze_pro_s"] = round(len(ons) / (len(mono) / SR), 2)
tempo, beats = librosa.beat.beat_track(onset_envelope=env, sr=SR, hop_length=hop, units="time")
erg["tempo_bpm"] = round(float(np.atleast_1d(tempo)[0]), 1)
# Tempogramm-Spitze (robuster als beat_track)
ac = librosa.autocorrelate(env - env.mean(), max_size=int(4 * SR / hop))
ac /= ac[0]
lags = np.arange(len(ac)) * hop / SR
kand = []
for lo, hi in ((0.2, 0.45), (0.45, 0.9), (0.9, 1.8)):
    s = (lags >= lo) & (lags < hi)
    k = np.argmax(ac[s]); kand.append((round(float(lags[s][k]), 4), round(float(ac[s][k]), 3)))
erg["autokorr_perioden_s"] = kand
# Einsatzabstände (IOI) -> Raster
ioi = np.diff(ons)
h, kanten = np.histogram(ioi, bins=np.arange(0.05, 1.5, 0.02))
top = np.argsort(h)[::-1][:4]
erg["ioi_haeufigste_s"] = [round(float(kanten[i] + 0.01), 3) for i in top]
erg["ioi_median_s"] = round(float(np.median(ioi)), 3)

# --- Schleife: Chroma-Selbstähnlichkeit über lange Verzögerungen
ch = librosa.feature.chroma_cqt(y=mono, sr=SR, hop_length=2048, tuning=tun)
ch = ch / (np.linalg.norm(ch, axis=0, keepdims=True) + 1e-9)
fps = SR / 2048
beste = []
for lag in range(int(4 * fps), min(int(45 * fps), ch.shape[1] // 2)):
    beste.append((float(np.mean(np.sum(ch[:, lag:] * ch[:, :-lag], axis=0))), lag / fps))
beste.sort(reverse=True)
# nur lokale Maxima mit Mindestabstand 1 s
sch = []
for wert, lag in beste:
    if all(abs(lag - l) > 1.0 for _, l in sch):
        sch.append((round(wert, 3), round(lag, 2)))
    if len(sch) >= 5: break
erg["schleife_kandidaten"] = [{"lag_s": l, "aehnlichkeit": w} for w, l in sch]

# --- Noten: CQT mit Stimmung, an jedem Einsatz der stärkste neu angeschlagene Halbton
C = np.abs(librosa.cqt(mono, sr=SR, hop_length=hop, fmin=a.fmin * 2 ** (tun / 12), n_bins=12 * a.okt, bins_per_octave=12, tuning=0.0))
Cdb = librosa.amplitude_to_db(C, ref=np.max)
midi0 = librosa.hz_to_midi(a.fmin)
noten = []
for t in ons:
    f = int(t * SR / hop)
    if f < 3 or f + 4 >= C.shape[1]: continue
    vor = C[:, f - 3:f].mean(1); nach = C[:, f + 1:f + 4].max(1)
    zuwachs = nach - vor
    k = int(np.argmax(zuwachs))
    if Cdb[k, f + 2] < -45: continue
    noten.append((float(t), int(round(midi0 + k)), float(Cdb[k, f + 2])))
mid = np.array([n[1] for n in noten])
erg["noten_gezaehlt"] = len(noten)
if len(mid):
    erg["register_midi_p5_p50_p95"] = [int(np.percentile(mid, q)) for q in (5, 50, 95)]
    erg["register_namen"] = [librosa.midi_to_note(int(np.percentile(mid, q))) for q in (5, 50, 95)]
    pc = np.bincount(mid % 12, minlength=12) / len(mid)
    erg["tonklassen_anteil"] = {librosa.midi_to_note(60 + i, octave=False): round(float(pc[i]), 3) for i in np.argsort(pc)[::-1][:8]}
    iv = np.diff(mid)
    iv = iv[np.abs(iv) <= 24]
    hi_, _ = np.histogram(iv, bins=np.arange(-12.5, 13.5, 1))
    erg["intervall_histogramm"] = {int(k): round(float(v) / len(iv), 3) for k, v in zip(range(-12, 13), hi_) if v / len(iv) >= 0.02}
    erg["anteil_schritt_1_2"] = round(float(np.mean(np.isin(np.abs(iv), [1, 2]))), 3)
    erg["anteil_sprung_3_5"] = round(float(np.mean(np.isin(np.abs(iv), [3, 4, 5]))), 3)
    erg["anteil_gross_ab_6"] = round(float(np.mean(np.abs(iv) >= 6)), 3)
    erg["anteil_wiederholung"] = round(float(np.mean(iv == 0)), 3)
    # Kontur: wie oft wechselt die Richtung?
    r = np.sign(iv[iv != 0])
    erg["richtungswechsel_anteil"] = round(float(np.mean(r[1:] != r[:-1])), 3) if len(r) > 2 else None

# --- Tonlänge: Abklingen des angeschlagenen Halbtons (dB/s zwischen -3 und -20 dB nach Spitze)
tau = []
for t, m, _ in noten:
    f = int(t * SR / hop); k = int(round(m - midi0))
    seg = Cdb[k, f:f + int(1.5 * SR / hop)]
    if len(seg) < 10: continue
    p = int(np.argmax(seg[:6])); s = seg[p:] - seg[p]
    i3 = np.argmax(s < -3); i20 = np.argmax(s < -20)
    if i3 > 0 and i20 > i3:
        tau.append(17.0 / ((i20 - i3) * hop / SR))
if tau:
    erg["abklang_db_pro_s_median"] = round(float(np.median(tau)), 1)
    erg["ton_t20_s_median"] = round(20.0 / float(np.median(tau)), 2)

# --- Hall: Abklingen der Breitbandenergie in Lücken (>= 0,5 s ohne Einsatz) und Seitenanteil
e = librosa.feature.rms(y=mono, frame_length=1024, hop_length=hop)[0]
edb = 20 * np.log10(e + 1e-9)
luecken = []
for t0, t1 in zip(ons[:-1], ons[1:]):
    if t1 - t0 >= 0.55:
        f0 = int(t0 * SR / hop) + 3; f1 = int(t1 * SR / hop) - 1
        seg = edb[f0:f1]
        if len(seg) > 8:
            tt = np.arange(len(seg)) * hop / SR
            # Steigung der zweiten Hälfte = Nachhall (Ton schon weg)
            hlf = len(seg) // 2
            sl = np.polyfit(tt[hlf:], seg[hlf:], 1)[0]
            luecken.append(sl)
if luecken:
    erg["luecken_n"] = len(luecken)
    erg["hall_steigung_db_pro_s_median"] = round(float(np.median(luecken)), 1)
    erg["hall_rt60_schaetzung_s"] = round(60.0 / max(1e-3, -float(np.median(luecken))), 2)
erg["seite_mitte_db"] = round(float(10 * np.log10((seite ** 2).mean() / ((mitte ** 2).mean() + 1e-20))), 1)
# Breite je Band
fr, Pm = signal.welch(mitte, sr, nperseg=8192); _, Ps = signal.welch(seite, sr, nperseg=8192)
erg["seite_mitte_baender_db"] = {f"{lo}-{hi}": round(float(10 * np.log10(Ps[(fr >= lo) & (fr < hi)].sum() / (Pm[(fr >= lo) & (fr < hi)].sum() + 1e-20) + 1e-20)), 1)
                                 for lo, hi in ((60, 250), (250, 1000), (1000, 4000), (4000, 12000))}

# --- Lautheitsverlauf: RMS in 1-s-Schritten (dB rel. Median), große Einbrüche
rms1 = np.array([np.sqrt(np.mean(mono[i:i + SR] ** 2)) for i in range(0, len(mono) - SR, SR)])
db1 = 20 * np.log10(rms1 + 1e-9); db1 -= np.median(db1)
erg["pegel_1s_p10_p90"] = [round(float(np.percentile(db1, 10)), 1), round(float(np.percentile(db1, 90)), 1)]
erg["einbrueche_unter_-10dB_s"] = [int(i) for i in np.where(db1 < -10)[0]]
erg["pegel_verlauf_10s"] = [round(float(np.mean(db1[i:i + 10])), 1) for i in range(0, len(db1), 10)]
# Spektrale Hülle des Klangs: Obertonanteile über dem Grundton (Mittel der Noten)
t = json.dumps(erg, ensure_ascii=False, indent=1)
if a.json: open(a.json, "w").write(t)
print(t)
