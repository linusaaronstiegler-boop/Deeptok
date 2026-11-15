# Musik v2: Klangbetten sehr nah an den Vorbildern (r2, r5, ref0), aus eigenen Noten gebaut.
#
# Aufruf (Audio-venv mit numpy, scipy, soundfile, pyloudnorm, mido; fluidsynth im PATH):
#   python -I bauen.py r2|r5|ref0|alle [--aus ../../build/musik-v2] [--instrument N] [--test]
#
# Ablauf je Stil:
#   1. Muster lesen (muster/spieluhr.json oder muster/klavier.json): Akkordfolge, Achtel-Slots, Bass.
#   2. Je Klangschicht eine MIDI-Datei schreiben (midi/<stil>-<schicht>.mid), N+1 Schleifen lang
#      (die erste Schleife ist Vorlauf, damit Hall und Ausklang am Dateianfang schon da sind).
#   3. Mit fluidsynth und der Soundfont FluidR3_GM (MIT-Lizenz) trocken rendern, ohne dessen Hall/Chorus.
#      Die Verstimmung der Vorlage (z. B. +46 Cent) kommt als Pitch-Bend in die MIDI-Datei.
#   4. Schichten je Fassung mischen (dünn / kern / voll, Hauptfassung), Leiern, eigener Faltungshall.
#   5. Terz-EQ auf das Langzeitspektrum der Referenz (nur Zahlen aus muster/*.json, höchstens ±9 dB).
#   6. Ausschnitt genau N Schleifen ab dem Ende des Vorlaufs: Ende geht nahtlos in den Anfang über.
#   7. Lautheit: Hauptfassung auf -20 LUFS, dünn/voll mit derselben Verstärkung (Pegel bleiben vergleichbar),
#      True Peak <= -1 dBTP.
# Nichts hier liest Ton aus den Referenzvideos; aus der Analyse kommen nur Noten und Messzahlen.
import argparse, json, os, subprocess, tempfile
import numpy as np, soundfile as sf, pyloudnorm as pyln, mido
from scipy import signal

HIER = os.path.dirname(os.path.abspath(__file__))
SF2 = os.environ.get("MUSIK_SF2", "/usr/share/sounds/sf2/FluidR3_GM.sf2")
SR = 44100
TPB = 960  # MIDI-Ticks je Viertel
TERZ = [31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600,
        2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500]

# Klangfarbe: Celesta (GM 8) lag im Test am nächsten an r2 (Chroma 0,873, Spektralabstand 5,8 dB vor EQ;
# Spieluhr GM 10: 0,856 / 6,3 dB; Vibraphon GM 11: 0,850 / 4,9 dB, aber zu breit im Stereobild).
# GM-Programme (0-basiert): 0 Flügel, 8 Celesta, 9 Glockenspiel, 10 Spieluhr, 33 E-Bass (Finger),
# 38 Synth-Bass 1, 48 Streicher, 49 langsame Streicher, 89 Warm Pad, 91 Choir Pad
STILE = {
    # r2: Spieluhr 111,7 BPM in E (+46 Cent), Schleife 17,19 s, wenig Hall, trocken-klar
    "r2": dict(muster="spieluhr", grund=64, bpm=111.72, cent=46, schleifen=11, seed=2,
               instr=dict(haupt=8, doppel=8, glitzer=9, tief=8, flaeche=49),
               hall=dict(rt=1.3, nass=0.30, vor=0.015, breite=0.85, daempf=4500), wow=(5.0, 0.37),
               ziel="r2", haupt_folge=["kern"] * 11),
    # r5: dasselbe Stück wie r2, 3 Halbtöne tiefer und 1,19x langsamer (Cis, +55 Cent: Spitzen +49, librosa +60), mehr Hall
    "r5": dict(muster="spieluhr", grund=61, bpm=93.83, cent=55, schleifen=9, seed=5,
               instr=dict(haupt=8, doppel=8, glitzer=9, tief=8, flaeche=49),
               hall=dict(rt=2.4, nass=0.42, vor=0.025, breite=0.9, daempf=3800), wow=(6.0, 0.3),
               ziel="r5", haupt_folge=["kern"] * 9),
    # ref0: Klavier im 3/4-Takt, 66 BPM, A = 432 Hz (-32 Cent), Schleife 21,8 s;
    # wie die Vorlage: 2 Schleifen nur Klavier, 4 mit Bass und Fläche, dann wieder nur Klavier
    "ref0": dict(muster="klavier", bpm=66.05, cent=-32, schleifen=9, seed=10,
                 instr=dict(klavier=0, melodie=0, bass=38, flaeche=89),
                 hall=dict(rt=2.0, nass=0.30, vor=0.020, breite=1.0, daempf=5000), wow=None,
                 ziel=None, haupt_folge=["duenn"] * 2 + ["voll"] * 4 + ["duenn"] * 3),
}
# Schichtpegel je Stufe (linear)
STUFEN = {
    "spieluhr": {"duenn": dict(haupt=0.85), "kern": dict(haupt=1.0, doppel=1.0, glitzer=1.0),
                 "voll": dict(haupt=1.0, doppel=1.0, glitzer=1.0, tief=1.0, flaeche=1.0)},
    "klavier": {"duenn": dict(klavier=1.0, melodie=1.0),
                "voll": dict(klavier=1.0, melodie=1.0, bass=1.0, flaeche=1.0)},
}


def lade_muster(name):
    return json.load(open(os.path.join(HIER, "muster", f"{name}.json")))


# ------------------------------------------------------------------ Noten je Schicht

def schleifen_rng(st, k):
    """Zufall (Velocity, Zeitstreuung) je Schleife. Der Vorlauf (k = 0) bekommt denselben Zufall wie die
    letzte behaltene Schleife: Dann klingt am Dateianfang exakt das aus, was am Dateiende ausklingt,
    und die Naht beim Kreis-Abspielen ist sauber (kein Phasensprung eines ausklingenden Tons)."""
    k_eff = st["schleifen"] if k == 0 else k
    return np.random.default_rng([st["seed"], k_eff])


def noten_spieluhr(st, m, rng, n_schleifen):
    """Liefert {schicht: [(start_s, dauer_s, midi, velocity)]} für n_schleifen Schleifen."""
    achtel = 30.0 / st["bpm"]
    L = m["takte"] * m["achtel_je_takt"] * achtel
    g = st["grund"]
    # Lautheit je Achtel an die Referenz angeglichen (analyse/dynamik.py); Velocity ~ 40·log10 in fluidsynth
    dyn = m.get("dyn_db", {}).get(st["name"], [0.0] * len(m["slots"]))
    aus = {k: [] for k in ("haupt", "doppel", "glitzer", "tief", "flaeche")}
    for k in range(n_schleifen):
        t0 = k * L
        rng = schleifen_rng(st, k)
        for s in m["slots"]:
            t = t0 + s["q"] * achtel
            jit = lambda: rng.normal(0, 0.003)  # Spieluhr-Walze: kaum Zeitstreuung
            fak = 10 ** (dyn[s["q"]] / 40)
            # Notenlänge 1,2 Achtel: In der Referenz-Klavierrolle klingen die Töne nur etwa eine Achtel
            # deutlich (kurze Punkte), die Celesta würde sonst lange Linien ziehen
            for rel, v in s["noten"]:
                aus["haupt"].append((t + jit(), 1.2 * achtel, g + rel, min(1.0, v * fak) * rng.uniform(0.93, 1.0)))
            for rel, v in s.get("doppel", []):
                aus["doppel"].append((t + jit(), 1.2 * achtel, g + rel, min(1.0, v * fak) * rng.uniform(0.93, 1.0)))
            for rel, v in s.get("glitzer", []):
                aus["glitzer"].append((t, 3 * achtel, g + rel, v))
        # voll: tiefe Spieluhr-Zinke (Grundton eine Oktave unter dem Arpeggio) auf 1 und 3,
        # und eine leise Streicherfläche aus den Akkordtönen (E3–H3-Lage), je Takt neu
        for takt, tone in enumerate(m["akkord_toene_rel"]):
            tt = t0 + takt * m["achtel_je_takt"] * achtel
            wurzel = g - 12 + tone[0] - (12 if tone[0] > 7 else 0)
            for b in (0, 4):
                aus["tief"].append((tt + b * achtel, 4 * achtel, wurzel, 0.55))
            for rel in sorted(set(r % 12 for r in tone)):
                aus["flaeche"].append((tt, m["achtel_je_takt"] * achtel * 1.02, g - 12 + rel, 0.32))
    return aus, L


def noten_klavier(st, m, rng, n_schleifen):
    achtel = 30.0 / st["bpm"]
    L = m["takte"] * m["achtel_je_takt"] * achtel
    aus = {k: [] for k in ("klavier", "melodie", "bass", "flaeche")}
    dyn = m.get("dyn_db", {}).get(st["name"], [0.0] * len(m["slots"]))
    for k in range(n_schleifen):
        t0 = k * L
        rng = schleifen_rng(st, k)
        for s in m["slots"]:
            t = t0 + s["q"] * achtel
            fak = 10 ** (dyn[s["q"]] / 40)
            for mi, z in s["begleitung"]:
                v = 0.35 + 0.55 * min(1.0, z / 0.55)
                aus["klavier"].append((t + rng.normal(0, 0.006), 3 * achtel, mi, min(1.0, v * fak) * rng.uniform(0.9, 1.0)))
            for mi, v in s["melodie"]:
                aus["melodie"].append((t + rng.normal(0, 0.006), 2 * achtel, mi, min(1.0, v * fak) * rng.uniform(0.92, 1.0)))
        # Bass: neuer Ton, wenn sich der Grundton ändert, sonst liegen lassen (Synth-Bass)
        q = 0
        while q < 48:
            r = q
            while r < 48 and m["bass"][r] == m["bass"][q]:
                r += 1
            aus["bass"].append((t0 + q * achtel, (r - q) * achtel * 0.98, m["bass"][q], 0.8))
            q = r
        for takt, akk in enumerate(m["flaeche"]):
            tt = t0 + takt * m["achtel_je_takt"] * achtel
            for mi in akk:
                aus["flaeche"].append((tt, m["achtel_je_takt"] * achtel * 1.02, mi, 0.45))
    return aus, L


# ------------------------------------------------------------------ MIDI + fluidsynth

def schreibe_midi(pfad, noten, programm, bpm, cent, pedal_takt_s=None, dauer_s=None):
    """Eine Spur, Kanal 0 (bzw. 1, damit nie der Schlagzeugkanal 9 entsteht). Pitch-Bend für die Verstimmung
    (Bend-Bereich ±2 Halbtöne => 8192 Einheiten = 200 Cent)."""
    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack(); mid.tracks.append(tr)
    tempo = mido.bpm2tempo(bpm)
    tr.append(mido.MetaMessage("set_tempo", tempo=tempo, time=0))
    ch = 0
    tr.append(mido.Message("program_change", program=programm, channel=ch, time=0))
    tr.append(mido.Message("pitchwheel", pitch=int(round(cent / 200 * 8192)), channel=ch, time=0))
    ev = []
    s2t = lambda s: int(round(mido.second2tick(max(0.0, s), TPB, tempo)))
    for t, d, mi, v in noten:
        vel = int(np.clip(round(v * 127), 1, 127))
        ev.append((s2t(t), 1, mido.Message("note_on", note=int(mi), velocity=vel, channel=ch)))
        ev.append((s2t(t + d), 0, mido.Message("note_off", note=int(mi), velocity=0, channel=ch)))
    if pedal_takt_s and dauer_s:
        # Klavierpedal: zu jedem Takt kurz lösen (40 ms) und wieder treten
        t = 0.0
        while t < dauer_s:
            if t > 0:
                ev.append((s2t(t - 0.04), 0, mido.Message("control_change", control=64, value=0, channel=ch)))
            ev.append((s2t(t + 0.01), 2, mido.Message("control_change", control=64, value=100, channel=ch)))
            t += pedal_takt_s
    ev.sort(key=lambda e: (e[0], e[1]))
    jetzt = 0
    for tick, _, msg in ev:
        tr.append(msg.copy(time=tick - jetzt)); jetzt = tick
    mid.save(pfad)


def rendern(midi_pfad, dauer_s):
    """fluidsynth ohne eigenen Hall/Chorus, 44,1 kHz, Fließkomma. Gibt Stereo-Array fester Länge zurück."""
    with tempfile.TemporaryDirectory() as tmp:
        wav = os.path.join(tmp, "x.wav")
        subprocess.run(["fluidsynth", "-ni", "-q", "-R", "0", "-C", "0", "-g", "0.5", "-r", str(SR),
                        "-o", "audio.file.format=float", "-F", wav, SF2, midi_pfad],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        x, sr = sf.read(wav, always_2d=True, dtype="float64")
    assert sr == SR
    n = int(round(dauer_s * SR))
    if len(x) < n:
        x = np.vstack([x, np.zeros((n - len(x), 2))])
    return x[:n]


# ------------------------------------------------------------------ Nachbearbeitung

def hall_ir(rt, vor, breite, daempf, seed):
    """Synthetische Raumantwort: frühe Reflexionen + exponentiell abklingendes Rauschen, das mit der
    Zeit dunkler wird (Luftdämpfung). rt = Nachhallzeit RT60 in s."""
    rng = np.random.default_rng(seed)
    n = int((rt * 1.2 + vor) * SR)
    t = np.arange(n) / SR
    ir = np.zeros((n, 2))
    hull = np.exp(-6.91 * t / rt)
    for c in range(2):
        r = rng.standard_normal(n) * hull
        # zeitabhängiger Tiefpass: zwei Fassungen (hell/dunkel) überblenden
        dunkel = signal.sosfilt(signal.butter(2, daempf * 0.35, fs=SR, output="sos"), r)
        hell = signal.sosfilt(signal.butter(2, daempf, fs=SR, output="sos"), r)
        w = np.clip(t / rt, 0, 1)
        ir[:, c] = (1 - w) * hell + w * dunkel
    k = int(vor * SR)
    ir = np.vstack([np.zeros((k, 2)), ir])[:n]
    for d, a in ((0.007, 0.5), (0.011, 0.4), (0.017, 0.3), (0.023, 0.25)):  # frühe Reflexionen
        i = k + int(d * SR)
        ir[i, 0] += a * rng.choice([-1, 1]); ir[i + int(0.0013 * SR), 1] += a * rng.choice([-1, 1])
    m = ir.mean(1, keepdims=True); s = ir - m
    ir = m + breite * s
    return ir / np.sqrt((ir ** 2).sum() / 2)


def hall(x, p, seed):
    ir = hall_ir(p["rt"], p["vor"], p["breite"], p["daempf"], seed)
    nass = np.stack([signal.oaconvolve(x[:, 0], ir[:, 0])[:len(x)] + 0.15 * signal.oaconvolve(x[:, 1], ir[:, 0])[:len(x)],
                     signal.oaconvolve(x[:, 1], ir[:, 1])[:len(x)] + 0.15 * signal.oaconvolve(x[:, 0], ir[:, 1])[:len(x)]], 1)
    nass *= np.sqrt((x ** 2).mean() / ((nass ** 2).mean() + 1e-20))
    return np.sqrt(1 - p["nass"]) * x + np.sqrt(p["nass"]) * nass


def leiern(x, cent, rate, periode_s):
    """Leichtes Leiern einer alten Spieluhr (zeitvariable Verzögerung). Die Rate wird auf eine ganze
    Zahl von Perioden je Schleife gerundet, damit die Schleifennaht nicht springt."""
    rate = max(1, round(rate * periode_s)) / periode_s
    n = len(x); t = np.arange(n) / SR
    d = (cent / 1200 * np.log(2)) / (2 * np.pi * rate) * np.sin(2 * np.pi * rate * t) * SR
    idx = np.arange(n) - d - np.abs(d).max()
    return np.stack([np.interp(idx, np.arange(n), x[:, c]) for c in range(2)], 1)


def terz_db(x):
    mitte = x.mean(1)
    f, P = signal.welch(mitte, SR, nperseg=16384, noverlap=8192)
    nutz = (f >= 20) & (f <= 16000)
    ges = P[nutz].sum()
    return np.array([10 * np.log10(P[(f >= fc / 2 ** (1 / 6)) & (f < fc * 2 ** (1 / 6))].sum() / ges + 1e-20) for fc in TERZ])


def eq_fir(ist, ziel, max_db=9.0, max_absenk_db=24.0):
    """Terz-EQ: Differenz Ziel minus Ist, über 3 Bänder geglättet, begrenzt (anheben höchstens max_db,
    absenken höchstens max_absenk_db: die Vorlagen sind über 2,5 kHz sehr dunkel); Bänder, in denen beide
    kaum Energie haben (< -50 dB), bleiben unverändert. Linearphasiges FIR."""
    diff = np.array(ziel) - np.array(ist)
    diff[(np.array(ziel) < -50) & (np.array(ist) < -50)] = 0
    diff = np.convolve(np.pad(diff, 1, mode="edge"), np.ones(3) / 3, mode="valid")
    diff = np.clip(diff, -max_absenk_db, max_db)
    fr = np.array([0.0] + TERZ + [SR / 2]) / (SR / 2)
    g = 10 ** (np.array([diff[0]] + list(diff) + [diff[-1]]) / 20)
    return signal.firwin2(8191, fr, g, nfreqs=32769), diff


def fir(x, h):
    return np.stack([signal.oaconvolve(x[:, c], h)[4095:4095 + len(x)] for c in range(2)], 1)


def lufs(x):
    return float(pyln.Meter(SR).integrated_loudness(x))


def true_peak_db(x):
    y = signal.resample_poly(x, 4, 1, axis=0)
    return float(20 * np.log10(np.abs(y).max() + 1e-12))


def begrenzen(x, decke_db=-1.0):
    """Sanfter Begrenzer: Spitzen über der Decke weich abrunden (tanh-Knie), sonst unverändert."""
    d = 10 ** (decke_db / 20) * 0.97
    k = 0.8 * d
    a = np.abs(x)
    y = np.where(a <= k, x, np.sign(x) * (k + (d - k) * np.tanh((a - k) / (d - k))))
    return y


def stufen_kurve(folge, L, n_vor, schicht, tabelle, n):
    """Pegelkurve einer Schicht über die ganze Renderdauer: je Schleife der Stufenwert, Übergänge
    über 1 s (Gleichleistung). Der Vorlauf bekommt den Wert der letzten Schleife (Naht!)."""
    werte = [tabelle[folge[-1]].get(schicht, 0.0)] * n_vor + [tabelle[s].get(schicht, 0.0) for s in folge]
    t = np.arange(n) / SR
    k = np.clip((t / L).astype(int), 0, len(werte) - 1)
    roh = np.array(werte)[k]
    from scipy.ndimage import uniform_filter1d
    return uniform_filter1d(roh, int(1.0 * SR))


# ------------------------------------------------------------------ Bauen

def bauen(name, aus_dir, instrument=None, test=False):
    st = dict(STILE[name], name=name)
    m = lade_muster(st["muster"])
    rng = np.random.default_rng(st["seed"])
    n_vor = 1
    n_ges = st["schleifen"] + n_vor + (0 if not test else -st["schleifen"] + 1)
    if st["muster"] == "spieluhr":
        noten, L = noten_spieluhr(st, m, rng, n_ges + 1)
    else:
        noten, L = noten_klavier(st, m, rng, n_ges + 1)
    dauer = (n_ges + 1) * L  # eine Schleife Reserve für den Ausklang
    midi_dir = os.path.join(HIER, "midi"); os.makedirs(midi_dir, exist_ok=True)
    os.makedirs(aus_dir, exist_ok=True)
    schichten = {}
    for schicht, nl in noten.items():
        if not nl:
            continue
        prog = st["instr"][schicht] if instrument is None else (instrument if schicht in ("haupt", "doppel", "klavier") else st["instr"][schicht])
        pfad = os.path.join(midi_dir, f"{name}-{schicht}.mid")
        pedal = m["achtel_je_takt"] * 30.0 / st["bpm"] if schicht in ("klavier", "melodie") else None
        schreibe_midi(pfad, nl, prog, st["bpm"], st["cent"], pedal_takt_s=pedal, dauer_s=dauer)
        schichten[schicht] = rendern(pfad, dauer)
    n = len(next(iter(schichten.values())))
    tabelle = STUFEN[st["muster"]]
    a = int(round(n_vor * L * SR)); b = int(round((n_vor + st["schleifen"]) * L * SR))
    if test:
        b = a + int(round(L * SR))

    def mischen(folge, eq=None):
        x = np.zeros((n, 2))
        for schicht, sig in schichten.items():
            x += sig * stufen_kurve(folge, L, n_vor, schicht, tabelle, n)[:, None]
        if st["wow"]:
            x = leiern(x, st["wow"][0], st["wow"][1], L)
        x = hall(x, st["hall"], seed=st["seed"])
        x = signal.sosfilt(signal.butter(2, 25, "high", fs=SR, output="sos"), x, axis=0)
        if eq is not None:
            x = fir(x, eq)
        return x

    folgen = {"schleife": st["haupt_folge"], "duenn": ["duenn"] * st["schleifen"], "voll": ["voll"] * st["schleifen"]}
    if st["muster"] == "spieluhr":
        folgen["schleife"] = ["kern"] * st["schleifen"]
    info = {"stil": name, "bpm": st["bpm"], "cent": st["cent"], "schleife_s": L, "schleifen": st["schleifen"],
            "dauer_s": (b - a) / SR, "soundfont": os.path.basename(SF2)}
    # EQ einmal bestimmen: Spieluhr am Kern, Klavier an der dünnen Fassung (Klavier allein)
    if st["muster"] == "spieluhr":
        roh = mischen(folgen["schleife"])[a:b]
        h, diff = eq_fir(terz_db(roh), m["ziele"][st["ziel"]]["terz_db"])
    else:
        roh = mischen(folgen["duenn"])[a:b]
        h, diff = eq_fir(terz_db(roh), m["ziele"]["duenn"]["terz_db"])
    info["eq_db"] = [round(float(d), 1) for d in diff]
    fertig = {k: mischen(f, h)[a:b] for k, f in folgen.items()}
    if st["muster"] == "klavier":
        # voll: Bass und Fläche gegen das Spektrum des vollen Referenzteils nachregeln (nur deren Summe)
        tief_sig = {k: v for k, v in schichten.items() if k in ("bass", "flaeche")}
        ist = terz_db(fertig["voll"]); ziel = np.array(m["ziele"]["voll"]["terz_db"])
        h2, d2 = eq_fir(ist, ziel)
        info["eq_voll_tief_db"] = [round(float(d), 1) for d in d2]
        for k, folge in folgen.items():
            x_kl = np.zeros((n, 2)); x_tf = np.zeros((n, 2))
            for schicht, sig in schichten.items():
                kurve = stufen_kurve(folge, L, n_vor, schicht, tabelle, n)[:, None]
                (x_tf if schicht in tief_sig else x_kl).__iadd__(sig * kurve)
            x_kl = fir(hall(x_kl, st["hall"], seed=st["seed"]), h)
            x_tf = fir(fir(hall(x_tf, st["hall"], seed=st["seed"] + 1), h), h2)
            x = signal.sosfilt(signal.butter(2, 25, "high", fs=SR, output="sos"), x_kl + x_tf, axis=0)
            fertig[k] = x[a:b]
    # Lautheit: Hauptfassung -20 LUFS, die anderen mit derselben Verstärkung
    gain = 10 ** ((-20.0 - lufs(fertig["schleife"])) / 20)
    pfade = {}
    for k, x in fertig.items():
        y = begrenzen(x * gain, -1.0)
        tp = true_peak_db(y)
        if tp > -1.0:
            y *= 10 ** ((-1.0 - tp - 0.05) / 20)
        p = os.path.join(aus_dir, f"{name}-v2-{k}.wav" if not test else f"{name}-v2-test-{k}.wav")
        sf.write(p, y.astype(np.float32), SR, subtype="PCM_24")
        pfade[k] = p
        info[f"{k}_lufs"] = round(lufs(y), 2); info[f"{k}_true_peak_db"] = round(true_peak_db(y), 2)
    # Naht prüfen: Die Datei wird im Kreis gelesen (Ende -> Anfang). Verglichen wird die Umgebung der Naht
    # (±50 ms) mit derselben Umgebung an einer inneren Schleifengrenze; dazu der Sprung zwischen
    # letztem und erstem Abtastwert im Verhältnis zum typischen Abstand benachbarter Werte.
    y = sf.read(pfade["schleife"], dtype="float64")[0]
    w = int(0.05 * SR)
    um = lambda z: float(np.sqrt((z ** 2).mean()) + 1e-12)
    rund = np.vstack([y[-w:], y[:w]])
    if not test:
        ki = int(round(min(1, st["schleifen"] - 1) * L * SR))
        innen = y[ki - w:ki + w]
        info["naht_db"] = round(20 * np.log10(um(rund) / um(innen)), 2)
    # Klick-Test: Hochpass über 6 kHz, Energie in 5-ms-Fenstern; an der Naht darf sie nicht über dem
    # liegen, was Notenanschläge sonst in der Datei erzeugen
    h = signal.sosfilt(signal.butter(4, 6000, "high", fs=SR, output="sos"), np.vstack([y[-SR:], y[:SR]]), axis=0)
    w5 = int(0.005 * SR)
    e = np.array([np.sqrt((h[i:i + w5] ** 2).mean()) for i in range(0, len(h) - w5, w5)])
    info["naht_hf_faktor"] = round(float(e[len(e) // 2 - 1:len(e) // 2 + 1].max() / np.median(e)), 2)
    info["anschlag_hf_faktor_max"] = round(float(np.sort(e)[-3] / np.median(e)), 2)
    info["dateien"] = {k: os.path.relpath(p, HIER) for k, p in pfade.items()}
    json.dump(info, open(os.path.join(aus_dir, f"{name}-v2{'-test' if test else ''}.json"), "w"), indent=1)
    return info


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("stil")
    ap.add_argument("--aus", default=os.path.join(HIER, "..", "..", "build", "musik-v2"))
    ap.add_argument("--instrument", type=int)
    ap.add_argument("--test", action="store_true", help="nur eine Schleife (schnell, für Klangvergleiche)")
    a = ap.parse_args()
    for s in (STILE if a.stil == "alle" else [a.stil]):
        print(json.dumps(bauen(s, os.path.abspath(a.aus), a.instrument, a.test), ensure_ascii=False))
