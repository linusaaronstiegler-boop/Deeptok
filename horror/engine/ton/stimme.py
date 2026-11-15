#!/usr/bin/env python3
"""Stimmspur einer Horror-Folge fertig machen: beschleunigen, Pausen kürzen, Lautheit, Wortzeiten.

Kette (Linus' Vorgabe für Folge 1, ElevenLabs „Adam“):
  1. Resample ×1,2: aresample=44100,asetrate=52920,aresample=44100.
     Die Spur wird schneller abgespielt, Tonhöhe und Klangfarbe steigen mit,
     so wie bei den Referenzkanälen (Anhang B, B2).
  2. Pausen auf höchstens 0,35 s kürzen. Geschnitten wird nur in echter Stille
     zwischen Wörtern; vom Wortende bleiben 0,15 s, vor dem nächsten Wort 0,20 s.
  2b. Satzpegel angleichen: Sätze, die mehr als 5 dB unter dem Median liegen
     (bei Folge 1 die mit [softly] gesprochenen June-Zeilen), auf Median − 4 dB anheben.
     Sie bleiben hörbar leiser, gehen aber unter dem TikTok-Sound nicht unter.
  3. Lautheit −14 LUFS integriert, True Peak ≤ −1 dBTP: schneller Kompressor auf die
     Silbenspitzen, dann Verstärkung, dann ein Begrenzer mit 4-facher Überabtastung,
     damit er auch Spitzen zwischen den Abtastwerten sieht.
  4. Wortzeiten mit faster-whisper small (word_timestamps) auf der fertigen Spur,
     gegen den Sprechtext ausgerichtet. Die Schreibweise des Skripts bleibt erhalten.
     Ein kurzes Schlusswort, das Whisper in den Block davor zieht (Folge 2: „Ready?“),
     kommt in seinen eigenen Sprechblock (schlusswoerter_verschieben).

Befehle:
  python stimme.py bewerten --skript S.txt ROH1.mp3 [ROH2.mp3 …] [--aus bewertung.json]
  python stimme.py fertig --skript S.txt --roh ROH.mp3 --wav stimme.wav --m4a stimme.m4a \
      --timing timing.json [--bloecke bildideen.json] [--bericht bericht.json]

Vorher in der Cloud: [ -f /opt/deeptok/env.sh ] && . /opt/deeptok/env.sh
(venv mit faster-whisper, numpy, num2words; Whisper-Modell offline in HF_HOME).
"""

from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import math
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

SR = 44100
# ×1,2 per Resample: 44100 · 1,2 = 52920. Das Signal wird so getan, als hätte es
# 52920 Hz, und dann zurück auf 44100 Hz gerechnet; dadurch läuft es 1,2-mal so schnell.
TEMPO_FILTER = "aresample=44100,asetrate=52920,aresample=44100"
FAKTOR = 1.2

# Pausen (Analyse der beiden Adam-Takes: Pausen sind digitale Stille um −87 dBFS,
# Wörter liegen bei −25 bis −12 dB, Verschlusslösungen am Wortende bei −50 bis −30 dB).
STILLE_DB = -50.0        # Rahmen leiser als das gilt als Stille
MIN_STILLE_S = 0.08      # kürzere Lücken sind Verschlüsse im Wort, keine Pause
MAX_PAUSE_S = 0.35       # Obergrenze je Pause (format-spec §1: keine Pause > 0,35 s)
# Was von einer zu langen Stille bleibt: 0,14 + 0,19 = 0,33 s, also etwas Luft unter
# 0,35 s, weil die Messung auf 10-ms-Rahmen nachträglich um ±1 Rahmen schwankt.
NACH_ENDE_S = 0.14       # so viel Stille bleibt nach dem Wortende (Ausklang)
VOR_START_S = 0.19       # so viel bleibt vor dem nächsten Wortanfang (leise Anlaute)
VORLAUF_S = 0.03         # vor dem ersten Wort: Das erste Wort fällt bei ≈ 0 s
NACHLAUF_S = 0.15        # nach dem letzten Wort (Ton endet ≤ 0,2 s nach dem letzten Wort)
UEBERBLEND_S = 0.010     # Überblendung an jeder Schnittstelle gegen Knackser

# Lautheit
ZIEL_LUFS = -14.0
MAX_TP = -1.0
BEGRENZER_DB = -1.6      # Grenze des Begrenzers (4× überabgetastet), etwas unter MAX_TP

WHISPER_MODELL = "small"


# ---------------------------------------------------------------- Audio ein/aus

def lade(pfad: Path, filt: str | None = None) -> np.ndarray:
    """Audiodatei als float32-Mono mit 44,1 kHz laden (über ffmpeg)."""
    cmd = ["ffmpeg", "-v", "error", "-i", str(pfad)]
    if filt:
        cmd += ["-af", filt]
    cmd += ["-ac", "1", "-ar", str(SR), "-f", "f32le", "-"]
    roh = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(roh, np.float32).copy()


def ffmpeg_filter(x: np.ndarray, filt: str) -> np.ndarray:
    """Ein ffmpeg-Filter auf ein Signal im Speicher anwenden."""
    cmd = ["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
           "-af", filt, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"]
    roh = subprocess.run(cmd, input=x.astype(np.float32).tobytes(),
                         capture_output=True, check=True).stdout
    return np.frombuffer(roh, np.float32).copy()


def schreibe_wav(pfad: Path, x: np.ndarray) -> None:
    pfad.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
           "-c:a", "pcm_s16le", str(pfad)]
    subprocess.run(cmd, input=x.astype(np.float32).tobytes(), check=True)


def schreibe_m4a(wav: Path, m4a: Path, kbit: int = 96, max_bytes: int | None = None) -> dict:
    """AAC-LC mono; +faststart, damit der Browser sofort abspielen kann.

    Mit max_bytes wird die Rate in 2-kbit-Schritten gesenkt, bis die Datei passt
    (Repo-Regel: keine Datei über 1 MB). Achtung: ffmpegs AAC-Encoder liegt etwa
    5 % über der Nennrate, und 96 kbit/s passen erst bis rund 80 s Länge in 1 MB.
    """
    m4a.parent.mkdir(parents=True, exist_ok=True)
    nenn = kbit
    while True:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-c:a", "aac",
                        "-b:a", f"{nenn}k", "-ac", "1", "-ar", str(SR), "-movflags", "+faststart",
                        str(m4a)], check=True)
        groesse = m4a.stat().st_size
        if max_bytes is None or groesse < max_bytes or nenn <= 48:
            break
        nenn -= 2
    rate = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries",
                           "stream=bit_rate", "-of", "default=nw=1:nk=1", str(m4a)],
                          capture_output=True, text=True, check=True).stdout.strip()
    return {"kbit_nenn": nenn, "kbit_gewuenscht": kbit, "stream_bit_rate": int(rate),
            "bytes": groesse, "max_bytes": max_bytes}


def sha256(pfad: Path) -> str:
    return hashlib.sha256(Path(pfad).read_bytes()).hexdigest()


# ---------------------------------------------------------------- Messen

def rahmen_db(x: np.ndarray, hop: int = 441, fenster: int = 882) -> np.ndarray:
    """Pegel je 10-ms-Rahmen (20-ms-Fenster) in dBFS."""
    if len(x) < fenster:
        return np.array([-120.0])
    n = (len(x) - fenster) // hop + 1
    fr = np.lib.stride_tricks.sliding_window_view(x, fenster)[::hop][:n]
    return 10 * np.log10(np.mean(fr.astype(np.float64) ** 2, axis=1) + 1e-12)


def stille_laeufe(x: np.ndarray, schwelle: float = STILLE_DB,
                  min_s: float = MIN_STILLE_S) -> list[tuple[float, float]]:
    """Zusammenhängende Stille (Sekunden von–bis), mindestens min_s lang.

    Der Rahmen bei Index i deckt i·10 ms … i·10 ms + 20 ms ab; als Grenze nehmen
    wir die Rahmenmitte, das ist auf ±5 ms genau.
    """
    db = rahmen_db(x)
    still = db < schwelle
    laeufe = []
    i, n = 0, len(still)
    while i < n:
        if still[i]:
            j = i
            while j < n and still[j]:
                j += 1
            a = i * 0.01 + (0.0 if i == 0 else 0.01)
            b = j * 0.01 + (len(x) / SR - j * 0.01 if j == n else 0.01)
            if b - a >= min_s:
                laeufe.append((a, b))
            i = j
        else:
            i += 1
    return laeufe


def lautheit(x: np.ndarray) -> dict:
    """Integrierte Lautheit, True Peak und LRA über ffmpeg loudnorm (Messdurchgang)."""
    cmd = ["ffmpeg", "-hide_banner", "-nostats", "-f", "f32le", "-ar", str(SR), "-ac", "1",
           "-i", "-", "-af", "loudnorm=print_format=json", "-f", "null", "-"]
    p = subprocess.run(cmd, input=x.astype(np.float32).tobytes(), capture_output=True, check=True)
    txt = p.stderr.decode("utf-8", "replace")
    js = json.loads(txt[txt.rindex("{"):txt.rindex("}") + 1])
    return {"lufs": float(js["input_i"]), "true_peak_dbtp": float(js["input_tp"]),
            "lra_lu": float(js["input_lra"])}


def f0_kontur(x: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Grobe Grundton-Kontur (Autokorrelation, 70–400 Hz) je 10 ms; NaN = stimmlos."""
    fenster, hop = 1764, 441
    if len(x) < fenster:
        return np.array([]), np.array([])
    fr = np.lib.stride_tricks.sliding_window_view(x, fenster)[::hop].astype(np.float64)
    fr = fr - fr.mean(axis=1, keepdims=True)
    db = 10 * np.log10(np.mean(fr ** 2, axis=1) + 1e-12)
    spek = np.fft.rfft(fr * np.hanning(fenster), n=2 * fenster, axis=1)
    ak = np.fft.irfft(np.abs(spek) ** 2, axis=1)[:, :fenster]
    ak = ak / (ak[:, :1] + 1e-12)
    lo, hi = int(SR / 400), int(SR / 70)
    lag = lo + np.argmax(ak[:, lo:hi], axis=1)
    staerke = ak[np.arange(len(lag)), lag]
    f0 = SR / lag
    f0[(staerke < 0.45) | (db < -35)] = np.nan
    t = (np.arange(len(f0)) * hop + fenster / 2) / SR
    return t, f0


def knackser(x: np.ndarray) -> int:
    """Zählt Sprünge von Abtastwert zu Abtastwert, die weit über dem lokalen Pegel liegen."""
    d = np.abs(np.diff(x.astype(np.float64)))
    lokal = np.convolve(np.abs(x.astype(np.float64)), np.ones(441) / 441, mode="same")[1:]
    return int(np.sum((d > 0.25) & (d > 8 * (lokal + 1e-4))))


# ---------------------------------------------------------------- Pausen kürzen

def pausen_kuerzen(x: np.ndarray) -> tuple[np.ndarray, list[dict]]:
    """Stille zwischen Wörtern auf ≤ MAX_PAUSE_S kürzen, Anfang und Ende trimmen.

    Geschnitten wird immer aus der Mitte einer Stille: Der Ausklang des vorigen
    Worts (NACH_ENDE_S) und die Luft vor dem nächsten Anlaut (VOR_START_S) bleiben.
    Rückgabe: neues Signal und Liste der Schnitte (Zeiten der Eingangsspur).
    """
    dauer = len(x) / SR
    laeufe = stille_laeufe(x)
    behalten = []          # Abschnitte der Eingangsspur, die bleiben (Sekunden)
    schnitte = []
    pos = 0.0
    for a, b in laeufe:
        if a <= 1e-6:                       # Stille am Anfang
            pos = max(0.0, b - VORLAUF_S)
            if pos > 0:
                schnitte.append({"von": 0.0, "bis": round(pos, 3), "art": "vorlauf"})
            continue
        if b >= dauer - 1e-6:               # Stille am Ende
            ende = min(dauer, a + NACHLAUF_S)
            behalten.append((pos, ende))
            schnitte.append({"von": round(ende, 3), "bis": round(dauer, 3), "art": "nachlauf"})
            pos = None
            break
        if b - a > MAX_PAUSE_S:
            c0, c1 = a + NACH_ENDE_S, b - VOR_START_S
            behalten.append((pos, c0))
            schnitte.append({"von": round(c0, 3), "bis": round(c1, 3), "art": "pause",
                             "pause_vorher_s": round(b - a, 3),
                             "pause_nachher_s": round(NACH_ENDE_S + VOR_START_S, 3)})
            pos = c1
    if pos is not None:
        behalten.append((pos, dauer))

    # Abschnitte mit kurzer Überblendung zusammensetzen
    n_ub = int(UEBERBLEND_S * SR)
    rampe = np.linspace(0.0, 1.0, n_ub, dtype=np.float32)
    teile = [x[int(round(s * SR)):int(round(e * SR))] for s, e in behalten]
    y = teile[0].copy()
    for t in teile[1:]:
        if len(y) >= n_ub and len(t) >= n_ub:
            y[-n_ub:] = y[-n_ub:] * (1 - rampe) + t[:n_ub] * rampe
            y = np.concatenate([y, t[n_ub:]])
        else:
            y = np.concatenate([y, t])
    return y, schnitte


# ---------------------------------------------------------------- Satzpegel

LEISE_AB_DB = 5.0        # so weit unter dem Median gilt ein Satz als zu leise
LEISE_ZIEL_DB = 4.0      # zu leise Sätze werden auf Median − 4 dB angehoben


def sprachpegel(x: np.ndarray, a: float, b: float) -> float:
    """Pegel eines Abschnitts nur über Sprachrahmen (Pausen zählen nicht mit)."""
    db = rahmen_db(x[int(a * SR):int(b * SR)])
    p = db[db > STILLE_DB]
    if not len(p):
        return -120.0
    return float(10 * np.log10(np.mean(10 ** (p / 10))))


def satzpegel_angleichen(x: np.ndarray, saetze: list[dict]) -> tuple[np.ndarray, list[dict]]:
    """Zu leise Sätze mit weicher Hüllkurve anheben (Rampen von 30 ms in den Pausen)."""
    pegel = {s["nr"]: sprachpegel(x, s["start"], s["ende"]) for s in saetze}
    median = float(np.median(list(pegel.values())))
    huelle_db = np.zeros(len(x), dtype=np.float64)
    rampe = int(0.03 * SR)
    angehoben = []
    for i, s in enumerate(saetze):
        abstand = median - pegel[s["nr"]]
        if abstand <= LEISE_AB_DB:
            continue
        g = abstand - LEISE_ZIEL_DB
        # Grenzen in die Mitte der Pausen zu den Nachbarsätzen legen
        a = s["start"] - 0.05 if i == 0 else (saetze[i - 1]["ende"] + s["start"]) / 2
        b = s["ende"] + 0.05 if i + 1 == len(saetze) else (s["ende"] + saetze[i + 1]["start"]) / 2
        ia, ib = max(0, int(a * SR)), min(len(x), int(b * SR))
        form = np.ones(ib - ia)
        r = min(rampe, (ib - ia) // 2)
        form[:r] = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, r))
        form[-r:] = form[:r][::-1]
        huelle_db[ia:ib] = np.maximum(huelle_db[ia:ib], g * form)
        angehoben.append({"satz": s["nr"], "pegel_db": round(pegel[s["nr"]], 1),
                          "median_db": round(median, 1), "anhebung_db": round(g, 1)})
    y = (x.astype(np.float64) * 10 ** (huelle_db / 20)).astype(np.float32)
    return y, angehoben


# ---------------------------------------------------------------- Lautheit

# Adam roh hat etwa 18 dB Abstand Spitze zu Lautheit; bei −14 LUFS und −1 dBTP sind
# höchstens 13 dB möglich. Nur mit dem Begrenzer müsste er in jedem dritten 10-ms-Rahmen
# eingreifen (gemessen: 35 %, bis 9,7 dB) und die Stimme platt drücken. Darum zuerst ein
# schneller Kompressor auf die Silbenspitzen (Spitzenerkennung, über −14 dBFS 4:1),
# danach fängt der Begrenzer nur noch Reste ab (gemessen: höchstens etwa 3 dB).
KOMPRESSOR = ("acompressor=threshold={thr:.5f}:ratio=4:attack=0.5:release=50:knee=4:"
              "detection=peak").format(thr=10 ** (-14 / 20))


def lautheit_setzen(x: np.ndarray) -> tuple[np.ndarray, dict]:
    """Kompressor, Verstärkung auf ZIEL_LUFS, überabgetasteter Begrenzer für den True Peak.

    Nachgemessen wird jede Runde; die Verstärkung wird nachgeführt, bis die Lautheit auf
    ±0,1 LU stimmt und der True Peak ≤ MAX_TP liegt (höchstens 8 Runden).
    """
    m0 = lautheit(x)
    k = ffmpeg_filter(x, KOMPRESSOR)
    mk = lautheit(k)
    gain = ZIEL_LUFS - mk["lufs"]
    grenze = BEGRENZER_DB
    for runde in range(8):
        lim = 10 ** (grenze / 20)
        filt = (f"volume={gain:.3f}dB,aresample={4 * SR},"
                f"alimiter=limit={lim:.5f}:attack=2:release=60:level=false:latency=true,"
                f"aresample={SR}")
        y = ffmpeg_filter(k, filt)
        m = lautheit(y)
        if abs(m["lufs"] - ZIEL_LUFS) <= 0.1 and m["true_peak_dbtp"] <= MAX_TP:
            break
        if m["true_peak_dbtp"] > MAX_TP:
            grenze -= (m["true_peak_dbtp"] - MAX_TP) + 0.1
        gain += ZIEL_LUFS - m["lufs"]
    # Wie stark hat der Begrenzer eingegriffen? Spitzen je 10-ms-Rahmen vor/nach Begrenzer
    vor = k * 10 ** (gain / 20)
    hop = 441
    n = min(len(vor), len(y)) // hop
    pv = np.abs(vor[:n * hop]).reshape(n, hop).max(1)
    pn = np.abs(y[:n * hop]).reshape(n, hop).max(1)
    gr = 20 * np.log10(np.maximum(pv, 1e-9) / np.maximum(pn, 1e-9))
    gr[pv < 10 ** (-40 / 20)] = 0.0
    info = {"eingang": m0, "kompressor": KOMPRESSOR, "nach_kompressor": mk,
            "verstaerkung_db": round(gain, 2), "begrenzer_dbfs": round(grenze, 2),
            "begrenzer_rahmen_ueber_1db_prozent": round(float(np.mean(gr > 1) * 100), 2),
            "begrenzer_rahmen_ueber_3db_prozent": round(float(np.mean(gr > 3) * 100), 2),
            "begrenzer_max_abregelung_db": round(float(gr.max()), 2),
            "runden": runde + 1, "ausgang": m}
    return y, info


# ---------------------------------------------------------------- Text und Whisper

ZAHL = re.compile(r"^\d+(st|nd|rd|th)?$")


def norm_woerter(token: str) -> list[str]:
    """Ein Token in Vergleichswörter zerlegen: klein, ohne Satzzeichen, Zahlen ausgeschrieben."""
    from num2words import num2words

    t = token.lower().replace("’", "'").replace("‘", "'")
    if t in ("mr", "mr."):
        return ["mister"]
    teile = re.split(r"[\s\-–—/]+", t)
    aus = []
    for p in teile:
        p = re.sub(r"[^a-z0-9']", "", p).strip("'")
        if not p:
            continue
        if ZAHL.match(p):
            zahl = int(re.sub(r"\D", "", p))
            art = "ordinal" if re.search(r"(st|nd|rd|th)$", p) else "cardinal"
            for w in re.split(r"[\s\-,]+", num2words(zahl, to=art)):
                if w and w != "and":
                    aus.append(w)
        else:
            aus.append(p)
    return aus


def skript_tokens(skript: Path) -> tuple[list[dict], list[str]]:
    """Sprechtext (ein Satz pro Zeile) in Wörter mit Satznummer zerlegen."""
    saetze = [z.strip() for z in skript.read_text(encoding="utf-8").splitlines() if z.strip()]
    tokens = []
    for nr, satz in enumerate(saetze, start=1):
        for tok in satz.split():
            tokens.append({"text": tok, "satz": nr, "norm": norm_woerter(tok)})
    return tokens, saetze


def whisper_woerter(wav: Path) -> list[dict]:
    """faster-whisper small, Englisch, Wortzeiten. Liefert Wörter mit Start/Ende/Sicherheit."""
    from faster_whisper import WhisperModel

    modell = WhisperModel(WHISPER_MODELL, device="cpu", compute_type="int8", cpu_threads=4)
    segmente, _ = modell.transcribe(str(wav), language="en", word_timestamps=True, beam_size=5,
                                    vad_filter=False, condition_on_previous_text=False)
    woerter = []
    for seg in segmente:
        for w in seg.words or []:
            woerter.append({"wort": w.word.strip(), "start": float(w.start), "ende": float(w.end),
                            "p": float(w.probability)})
    return woerter


def levenshtein(a: list[str], b: list[str]) -> int:
    vor = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        akt = [i] + [0] * len(b)
        for j, y in enumerate(b, 1):
            akt[j] = min(vor[j] + 1, akt[j - 1] + 1, vor[j - 1] + (x != y))
        vor = akt
    return vor[-1]


def ausrichten(tokens: list[dict], woerter: list[dict]) -> dict:
    """Skriptwörter auf Whisper-Wörter abbilden (difflib über die Vergleichswörter).

    Gleich erkannte Wörter bekommen Whisper-Zeiten. Falsch erkannte Wörter bekommen
    die Zeiten der Whisper-Wörter an ihrer Stelle; fehlende werden zwischen den
    Nachbarn eingepasst. Ein Skript-Token kann mehrere Vergleichswörter haben
    („eighteenth“ ↔ „18th“ geht über num2words auf beiden Seiten).
    """
    # Flache Listen von Vergleichswörtern mit Rückverweis
    s_flach, s_idx = [], []
    for i, t in enumerate(tokens):
        for w in t["norm"]:
            s_flach.append(w)
            s_idx.append(i)
    h_flach, h_zeit = [], []
    for w in woerter:
        teile = norm_woerter(w["wort"])
        if not teile:
            continue
        d = (w["ende"] - w["start"]) / len(teile)
        for k, p in enumerate(teile):
            h_flach.append(p)
            h_zeit.append((w["start"] + k * d, w["start"] + (k + 1) * d, w["p"], w["wort"]))

    sm = difflib.SequenceMatcher(None, s_flach, h_flach, autojunk=False)
    zeit = [None] * len(s_flach)          # (start, ende, p, erkannt, quelle)
    fehler, eingefuegt = [], []
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            for k in range(i2 - i1):
                st, en, p, roh = h_zeit[j1 + k]
                zeit[i1 + k] = (st, en, p, roh, "whisper")
        elif op == "replace":
            st0, en0 = h_zeit[j1][0], h_zeit[j2 - 1][1]
            n = i2 - i1
            for k in range(n):
                if n == j2 - j1:
                    st, en, p, roh = h_zeit[j1 + k]
                else:
                    st, en = st0 + (en0 - st0) * k / n, st0 + (en0 - st0) * (k + 1) / n
                    p, roh = min(h[2] for h in h_zeit[j1:j2]), " ".join(h[3] for h in h_zeit[j1:j2])
                zeit[i1 + k] = (st, en, p, roh, "ersetzt")
            fehler.append({"skript": " ".join(s_flach[i1:i2]), "gehoert": " ".join(h_flach[j1:j2]),
                           "zeit_s": round(st0, 2)})
        elif op == "delete":
            fehler.append({"skript": " ".join(s_flach[i1:i2]), "gehoert": "", "zeit_s": None})
        elif op == "insert":
            eingefuegt.append({"gehoert": " ".join(h_flach[j1:j2]), "zeit_s": round(h_zeit[j1][0], 2)})

    # Fehlende Wörter zwischen den Nachbarn einpassen
    for k in range(len(zeit)):
        if zeit[k] is None:
            vor = next((zeit[j][1] for j in range(k - 1, -1, -1) if zeit[j]), 0.0)
            nach = next((zeit[j][0] for j in range(k + 1, len(zeit)) if zeit[j]), vor)
            zeit[k] = (vor, max(vor, nach), 0.0, "", "eingepasst")

    # Vergleichswörter zurück auf Skript-Tokens
    erg = []
    for i, t in enumerate(tokens):
        ks = [k for k, ti in enumerate(s_idx) if ti == i]
        if not ks:      # Token ohne Wortinhalt (sollte im Skript nicht vorkommen)
            erg.append({**t, "start": None, "ende": None, "p": 0.0, "quelle": "leer", "erkannt": ""})
            continue
        quellen = {zeit[k][4] for k in ks}
        erg.append({**t, "start": zeit[ks[0]][0], "ende": zeit[ks[-1]][1],
                    "p": min(zeit[k][2] for k in ks),
                    "erkannt": " ".join(dict.fromkeys(zeit[k][3] for k in ks if zeit[k][3])),
                    "quelle": "whisper" if quellen == {"whisper"} else sorted(quellen - {"whisper"})[0]})
    wer = levenshtein(s_flach, h_flach) / max(1, len(s_flach))
    return {"woerter": erg, "fehler": fehler, "eingefuegt": eingefuegt, "wer": wer,
            "n_skript": len(s_flach), "n_gehoert": len(h_flach)}


PAUSE_FUER_KANTE_S = 0.12   # Stille ab dieser Länge trennt Sprechblöcke (Verschlüsse sind < 0,08 s)


def sprechbloecke(x: np.ndarray) -> list[tuple[float, float]]:
    """Abschnitte mit Sprache zwischen Stillen ≥ PAUSE_FUER_KANTE_S."""
    dauer = len(x) / SR
    stillen = [(a, b) for a, b in stille_laeufe(x) if b - a >= PAUSE_FUER_KANTE_S
               or a <= 1e-6 or b >= dauer - 1e-6]
    bloecke, pos = [], 0.0
    for a, b in stillen:
        if a > pos + 1e-6:
            bloecke.append((pos, a))
        pos = b
    if pos < dauer - 1e-6:
        bloecke.append((pos, dauer))
    return bloecke


SCHLUSS_MIN_S = 0.12        # so lang muss ein Block nach dem letzten Wort sein, um als Sprache zu zählen
SCHLUSS_MIN_DB = -35.0      # und so laut (Sprachrahmen), damit Atem oder Rauschen nicht zählen


def schlussbloecke(x: np.ndarray, bloecke: list[tuple[float, float]], ab: float) -> list[int]:
    """Indizes der Sprechblöcke, die erst nach der Zeit `ab` beginnen und nach Sprache klingen."""
    return [k for k, (ba, bb) in enumerate(bloecke)
            if ba > ab + 0.02 and bb - ba >= SCHLUSS_MIN_S and sprachpegel(x, ba, bb) >= SCHLUSS_MIN_DB]


def schlusswoerter_verschieben(woerter: list[dict], zuordnung: list[int],
                               bloecke: list[tuple[float, float]], x: np.ndarray) -> int:
    """Letzten Satz in Sprechblöcke legen, die Whisper ohne Wort gelassen hat.

    Whisper zieht ein kurzes Schlusswort nach einer Pause oft in den Block davor:
    In Folge 2 lag „Ready?“ (eigener Block 0,34 s hinter „One hundred.“) im Block von
    „hundred“, der echte Block blieb leer. Folgen: Das letzte Wort endet in timing.json
    zu früh (der Schnitt ≤ 0,2 s danach würde es abschneiden), und die Satzpegel-
    Anhebung landet mitten in einem Wort. Regel: Bleiben am Ende Sprechblöcke ohne
    Wort, und teilt sich der letzte Satz seinen Block mit dem Satz davor, dann bekommt
    der letzte Satz die leeren Blöcke. Seine Wörter werden der Reihe nach verteilt und
    in ihrem Block nach Buchstabenzahl aufgeteilt. Rückgabe: Zahl der verschobenen Wörter.
    """
    if not woerter:
        return 0
    k0 = zuordnung[-1]
    rest = [k for k in schlussbloecke(x, bloecke, bloecke[k0][1]) if k > k0]
    if not rest:
        return 0
    satz = woerter[-1]["satz"]
    idx = [i for i, w in enumerate(woerter) if w["satz"] == satz]
    teilt_block = idx[0] > 0 and zuordnung[idx[0] - 1] == k0
    if not teilt_block or any(zuordnung[i] != k0 for i in idx):
        print(f"Warnung: {len(rest)} Sprechblock/-blöcke nach dem letzten Wort ohne Wort, "
              f"nicht zugeordnet (ab {bloecke[rest[0]][0]:.2f} s)", file=sys.stderr)
        return 0
    for j, i in enumerate(idx):
        zuordnung[i] = rest[min(j * len(rest) // len(idx), len(rest) - 1)]
    # In jedem Zielblock die Zeit nach Buchstaben aufteilen (Whisper-Zeiten liegen daneben)
    for k in sorted(set(zuordnung[i] for i in idx)):
        ba, bb = bloecke[k]
        drin = [i for i in idx if zuordnung[i] == k]
        gew = [max(1, len(re.sub(r"[^\w]", "", woerter[i]["text"]))) for i in drin]
        pos = ba
        for i, g in zip(drin, gew):
            woerter[i]["start"] = pos
            pos += (bb - ba) * g / sum(gew)
            woerter[i]["ende"] = pos
            woerter[i]["schluss_verschoben"] = True
    print(f"Schlusswörter: Satz {satz} ({len(idx)} Wort/Wörter) in Block "
          f"{bloecke[rest[0]][0]:.2f}–{bloecke[rest[-1]][1]:.2f} s gelegt", file=sys.stderr)
    return len(idx)


def an_kanten_einrasten(woerter: list[dict], x: np.ndarray) -> int:
    """Wortkanten an Pausen auf die Energiekanten setzen.

    Whisper legt Wortgrenzen an Pausen oft 0,1–0,3 s daneben (Wortenden zu früh, oder
    die Pause landet im nächsten Wort). Die Pegelkurve ist dort genauer: Die Spur wird
    an jeder Stille ≥ 0,12 s in Sprechblöcke geteilt, jedes Wort kommt in den Block,
    in dem seine Whisper-Mitte liegt (sonst den nächstgelegenen), und das erste und
    letzte Wort eines Blocks bekommen dessen Anfang und Ende. Wörter im Inneren eines
    Blocks behalten die Whisper-Zeiten. Rückgabe: Zahl der verschobenen Kanten.
    """
    bloecke = sprechbloecke(x)
    if not bloecke:
        return 0

    def block_von(w):
        mitte = (w["start"] + w["ende"]) / 2
        return min(range(len(bloecke)), key=lambda k: 0.0 if bloecke[k][0] <= mitte <= bloecke[k][1]
                   else min(abs(mitte - bloecke[k][0]), abs(mitte - bloecke[k][1])))

    zuordnung = [block_von(w) for w in woerter]
    # Reihenfolge erzwingen: Blocknummern dürfen nicht rückwärts laufen
    for i in range(1, len(zuordnung)):
        zuordnung[i] = max(zuordnung[i], zuordnung[i - 1])
    n = schlusswoerter_verschieben(woerter, zuordnung, bloecke, x)
    for k, (ba, bb) in enumerate(bloecke):
        idx = [i for i, z in enumerate(zuordnung) if z == k]
        if not idx:
            continue
        erst, letzt = woerter[idx[0]], woerter[idx[-1]]
        n += abs(erst["start"] - ba) > 0.005
        n += abs(letzt["ende"] - bb) > 0.005
        erst["start"], letzt["ende"] = ba, bb
        # Innere Kanten in den Block klemmen und Überlappungen auflösen
        for j in idx:
            w = woerter[j]
            w["start"] = min(max(w["start"], ba), bb)
            w["ende"] = min(max(w["ende"], ba), bb)
        for a, b in zip(idx, idx[1:]):
            wa, wb = woerter[a], woerter[b]
            if wb["start"] < wa["start"] + 0.03:
                wb["start"] = min(wa["start"] + 0.03, bb)
            if wa["ende"] > wb["start"] or wa["ende"] < wa["start"] + 0.03:
                wa["ende"] = wb["start"]
        if letzt["ende"] < letzt["start"] + 0.03:
            letzt["start"] = max(ba, letzt["ende"] - 0.03)

    # Lücken im Inneren eines Blocks: Whisper beendet das Wort oft zu früh, obwohl es
    # noch klingt. Das Wortende rückt bis zum letzten Rahmen über −35 dBFS vor dem
    # nächsten Wort (Ausklang, Endkonsonant); was danach kommt, ist echte Pause/Hauch.
    db = rahmen_db(x)
    for i in range(len(woerter) - 1):
        wa, wb = woerter[i], woerter[i + 1]
        if zuordnung[i] != zuordnung[i + 1] or wb["start"] - wa["ende"] <= 0.05:
            continue
        # Nur der zusammenhängende Ausklang ab dem Whisper-Ende zählt, damit ein früher
        # Anlaut des nächsten Worts nicht dem vorigen zugeschlagen wird.
        r, r1 = max(int(wa["ende"] * 100), 0), min(int(wb["start"] * 100) - 1, len(db))
        while r < r1 and db[r] > -35.0:
            r += 1
        neu = min(wb["start"], r * 0.01 + 0.01)
        if neu > wa["ende"] + 0.005:
            wa["ende"] = neu
            n += 1
    return n


def saetze_aus(woerter: list[dict], saetze: list[str], bloecke: dict | None) -> list[dict]:
    aus = []
    for nr, text in enumerate(saetze, start=1):
        idx = [i for i, w in enumerate(woerter) if w["satz"] == nr]
        s = {"nr": nr, "text": text, "start": round(woerter[idx[0]]["start"], 3),
             "ende": round(woerter[idx[-1]]["ende"], 3), "wort_von": idx[0], "wort_bis": idx[-1]}
        if bloecke and str(nr) in bloecke:
            s["block"] = bloecke[str(nr)]
        aus.append(s)
    return aus


def satz_masse(x: np.ndarray, saetze: list[dict]) -> list[dict]:
    """Je Satz: Dauer, Pegel, Grundton-Median und -Spanne (p10–p90 in Halbtönen)."""
    t, f0 = f0_kontur(x)
    aus = []
    for s in saetze:
        a, b = int(s["start"] * SR), int(s["ende"] * SR)
        seg = x[a:b]
        rms = 20 * math.log10(float(np.sqrt(np.mean(seg.astype(np.float64) ** 2))) + 1e-12) if len(seg) else -120
        m = (t >= s["start"]) & (t <= s["ende"]) & ~np.isnan(f0)
        f = f0[m]
        if len(f) >= 5:
            med = float(np.median(f))
            spanne = 12 * math.log2(float(np.percentile(f, 90)) / float(np.percentile(f, 10)))
        else:
            med, spanne = float("nan"), float("nan")
        aus.append({"nr": s["nr"], "dauer_s": round(s["ende"] - s["start"], 2),
                    "pegel_db": round(rms, 1), "f0_median_hz": round(med, 1),
                    "f0_spanne_ht": round(spanne, 1)})
    return aus


def pausen_zwischen(woerter: list[dict]) -> list[float]:
    return [max(0.0, woerter[i + 1]["start"] - woerter[i]["ende"]) for i in range(len(woerter) - 1)]


# ---------------------------------------------------------------- Befehle

def cmd_bewerten(args) -> None:
    tokens, saetze = skript_tokens(Path(args.skript))
    ergebnis = []
    for roh in args.roh:
        roh = Path(roh)
        x = ffmpeg_filter(lade(roh), TEMPO_FILTER)
        tmp = Path(args.arbeit) / (roh.stem + "-x1.2.wav")
        schreibe_wav(tmp, x)
        y, schnitte = pausen_kuerzen(x)
        hw = whisper_woerter(tmp)
        al = ausrichten([dict(t) for t in tokens], hw)
        st = saetze_aus(al["woerter"], saetze, None)
        masse = satz_masse(x, st)
        roh_x = lade(roh)
        unsicher = [{"wort": w["text"], "p": round(w["p"], 2), "zeit_s": round(w["start"], 2)}
                    for w in al["woerter"] if w["p"] < 0.5]
        e = {"datei": str(roh), "sha256": sha256(roh), "dauer_roh_s": round(len(roh_x) / SR, 2),
             "dauer_x1_2_s": round(len(x) / SR, 2),
             "dauer_nach_pausen_s": round(len(y) / SR, 2),
             "pausen_gekuerzt": sum(1 for s in schnitte if s["art"] == "pause"),
             "wer": round(al["wer"], 4), "fehler": al["fehler"], "eingefuegt": al["eingefuegt"],
             "unsicher": unsicher,
             "uebersteuert": int(np.sum(np.abs(roh_x) >= 0.999)), "knackser": knackser(roh_x),
             "lautheit_roh": lautheit(roh_x),
             "hook": {**masse[0], "ende_s": st[0]["ende"]},
             "saetze": masse}
        ergebnis.append(e)
        print(json.dumps({k: v for k, v in e.items() if k != "saetze"}, ensure_ascii=False, indent=1))
    if args.aus:
        Path(args.aus).write_text(json.dumps(ergebnis, ensure_ascii=False, indent=1), encoding="utf-8")


def cmd_fertig(args) -> None:
    tokens, saetze = skript_tokens(Path(args.skript))
    bloecke = None
    if args.bloecke:
        bi = json.loads(Path(args.bloecke).read_text(encoding="utf-8"))
        bloecke = {k: v.get("block") for k, v in bi.get("saetze", {}).items()}

    roh = Path(args.roh)
    wav = Path(args.wav)
    arbeit = Path(args.arbeit) if args.arbeit else wav.parent
    x = ffmpeg_filter(lade(roh), TEMPO_FILTER)           # 1. ×1,2
    y, schnitte = pausen_kuerzen(x)                       # 2. Pausen
    # 2b. Satzgrenzen auf der gekürzten Spur bestimmen, zu leise Sätze anheben
    zw = arbeit / (wav.stem + "-gekuerzt.wav")
    schreibe_wav(zw, y)
    al0 = ausrichten([dict(t) for t in tokens], whisper_woerter(zw))
    an_kanten_einrasten(al0["woerter"], y)
    y, angehoben = satzpegel_angleichen(y, saetze_aus(al0["woerter"], saetze, None))
    z, laut = lautheit_setzen(y)                          # 3. Lautheit
    laut["satzpegel_angehoben"] = angehoben
    schreibe_wav(wav, z)
    z = lade(wav)                                         # genau das, was auf der Platte liegt
    laut["ausgang_datei"] = lautheit(z)

    hw = whisper_woerter(wav)                             # 4. Wortzeiten
    al = ausrichten([dict(t) for t in tokens], hw)
    woerter = al["woerter"]
    eingerastet = an_kanten_einrasten(woerter, z)
    st = saetze_aus(woerter, saetze, bloecke)
    dauer = len(z) / SR
    pausen = pausen_zwischen(woerter)
    stille = [b - a for a, b in stille_laeufe(z) if a > 0.001 and b < dauer - 0.001]
    # Strenger: alles unter −35 dBFS gilt als Pause, also auch Atem und Hauchlaute
    leise = [b - a for a, b in stille_laeufe(z, schwelle=-35.0)
             if a > 0.001 and b < dauer - 0.001]

    timing = {
        "quelle": wav.name, "sha256": sha256(wav), "dauer_s": round(dauer, 3),
        "abtastrate": SR, "kanaele": 1,
        "methode": (f"faster-whisper {WHISPER_MODELL} int8, language=en, word_timestamps, beam 5; "
                    "ausgerichtet auf den Sprechtext (difflib); Wortanfänge/-enden an Pausen "
                    f"auf Energiekanten ({STILLE_DB:.0f} dBFS) eingerastet"),
        "woerter": [{"i": i, "satz": w["satz"], "text": w["text"],
                     "wort": re.sub(r"^[^\w']+|[^\w']+$", "", w["text"]),
                     "start": round(w["start"], 3), "ende": round(w["ende"], 3),
                     "p": round(w["p"], 3), "quelle": w["quelle"],
                     **({"erkannt": w["erkannt"]} if w["quelle"] != "whisper" else {}),
                     **({"schluss_verschoben": True} if w.get("schluss_verschoben") else {})}
                    for i, w in enumerate(woerter)],
        "saetze": st,
        "pruefung": {
            "wer": round(al["wer"], 4), "fehler": al["fehler"], "eingefuegt": al["eingefuegt"],
            "erstes_wort_s": round(woerter[0]["start"], 3),
            "nach_letztem_wort_s": round(dauer - woerter[-1]["ende"], 3),
            # Tor: Sprache nach dem letzten Wort heißt, ein Schlusswort sitzt zu früh (soll 0 sein)
            "sprache_nach_letztem_wort_s": round(sum(
                bb - ba for ba, bb in (sprechbloecke(z)[k] for k in
                                       schlussbloecke(z, sprechbloecke(z), woerter[-1]["ende"]))), 3),
            "laengste_stille_s": round(max(stille) if stille else 0.0, 3),
            "laengste_leise_strecke_unter_35db_s": round(max(leise) if leise else 0.0, 3),
            "laengste_wortluecke_s": round(max(pausen), 3),
            "wortluecken_ueber_0_35": sum(1 for p in pausen if p > MAX_PAUSE_S + 1e-3),
            "eingerastet": eingerastet,
            "dauer_im_ziel_70_90": 70.0 <= dauer <= 90.0,
        },
    }
    Path(args.timing).write_text(json.dumps(timing, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    m4a = Path(args.m4a)
    m4a_info = schreibe_m4a(wav, m4a, args.kbit, args.max_bytes or None)

    bericht = {
        "roh": {"datei": str(roh), "sha256": sha256(roh), "dauer_s": round(len(lade(roh)) / SR, 3)},
        "x1_2_dauer_s": round(len(x) / SR, 3), "nach_pausen_dauer_s": round(len(y) / SR, 3),
        "schnitte": schnitte, "lautheit": laut,
        "wav": {"datei": str(wav), "sha256": sha256(wav), "dauer_s": round(dauer, 3)},
        "m4a": {"datei": str(m4a), "sha256": sha256(m4a), **m4a_info},
        "pruefung": timing["pruefung"],
    }
    if args.bericht:
        Path(args.bericht).write_text(json.dumps(bericht, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps({k: v for k, v in bericht.items() if k != "schnitte"}, ensure_ascii=False, indent=1))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="befehl", required=True)
    b = sub.add_parser("bewerten", help="Takes vergleichen (Whisper-Fehler, Längen, Pegel)")
    b.add_argument("--skript", required=True)
    b.add_argument("--arbeit", required=True, help="Ordner für Zwischendateien (gitignored)")
    b.add_argument("--aus")
    b.add_argument("roh", nargs="+")
    b.set_defaults(f=cmd_bewerten)
    f = sub.add_parser("fertig", help="gewählten Take fertig machen")
    f.add_argument("--skript", required=True)
    f.add_argument("--roh", required=True)
    f.add_argument("--wav", required=True)
    f.add_argument("--m4a", required=True)
    f.add_argument("--kbit", type=int, default=96)
    f.add_argument("--max-bytes", type=int, default=1_000_000,
                   help="Obergrenze für die m4a (Repo-Regel 1 MB); 0 = keine")
    f.add_argument("--timing", required=True)
    f.add_argument("--bloecke")
    f.add_argument("--bericht")
    f.add_argument("--arbeit", help="Ordner für Zwischendateien (Standard: neben der WAV)")
    f.set_defaults(f=cmd_fertig)
    args = ap.parse_args()
    args.f(args)


if __name__ == "__main__":
    sys.exit(main())
