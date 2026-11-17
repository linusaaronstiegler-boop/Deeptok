#!/usr/bin/env python3
"""Eigene Geräusche für die Horror-Folgen, synthetisiert mit numpy (keine fremden Tonspuren).

    python engine/ton/effekte.py --aus build/effekte      # alle Klänge als WAV zum Anhören

Jeder Klang ist eine Funktion klang_<name>(rng, **params) -> Stereo-Array (n, 2), 44,1 kHz,
normiert auf −1 dBFS Spitze. Gemischt wird in mischen.py; dort setzt die Cue-Liste der Folge
(episoden/<folge>/effekte.json) Zeitpunkt und Pegel.

SYNC sagt je Klang, welcher Moment im Klang auf dem Wort liegen soll (s ab Klangbeginn):
beim Whoosh die lauteste Stelle, sonst der Anschlag.

Alles ist deterministisch: gleicher Seed, gleiche Datei. Gefiltert wird im Frequenzbereich
(rfft, Betragsgang wie ein Butterworth-Filter, ohne Phasendrehung), weil scipy hier fehlt.
"""

from __future__ import annotations

import argparse
import subprocess
from pathlib import Path

import numpy as np

SR = 44100


# ---------------------------------------------------------------- Grundbausteine

def sek(s: float) -> int:
    return int(round(s * SR))


def zeit(dauer: float) -> np.ndarray:
    return np.arange(sek(dauer)) / SR


def filter_fft(x: np.ndarray, tief: float | None = None, hoch: float | None = None, ordnung: int = 2) -> np.ndarray:
    """Hochpass (tief = untere Grenze) und/oder Tiefpass (hoch = obere Grenze) im Frequenzbereich.

    Betragsgang wie Butterworth: 1/sqrt(1 + (f/fg)^(2·ordnung)). Für kurze Klänge genau genug.
    Das Signal wird vorher mit Nullen verlängert, damit nichts vom Ende an den Anfang „umläuft“.
    """
    eindim = x.ndim == 1
    y = x[:, None] if eindim else x
    n = len(y)
    m = 1 << int(np.ceil(np.log2(n + SR // 4)))
    f = np.fft.rfftfreq(m, 1 / SR)
    h = np.ones_like(f)
    if hoch:
        h *= 1 / np.sqrt(1 + (f / hoch) ** (2 * ordnung))
    if tief:
        with np.errstate(divide="ignore"):
            h *= 1 / np.sqrt(1 + (tief / np.maximum(f, 1e-6)) ** (2 * ordnung))
    spek = np.fft.rfft(y, m, axis=0) * h[:, None]
    aus = np.fft.irfft(spek, m, axis=0)[:n]
    return aus[:, 0] if eindim else aus


def huelle(n: int, angriff: float, abkling: float, halten: float = 0.0) -> np.ndarray:
    """Anstieg (s, Sinus-Rampe), Halten (s), dann exponentielles Abklingen (Zeitkonstante s)."""
    t = np.arange(n) / SR
    auf = np.clip(t / max(angriff, 1e-4), 0, 1)
    auf = 0.5 - 0.5 * np.cos(np.pi * auf)
    ab = np.exp(-np.clip(t - angriff - halten, 0, None) / abkling)
    return auf * ab


def gedaempfter_ton(f: float, tau: float, dauer: float, phase: float = 0.0) -> np.ndarray:
    t = zeit(dauer)
    return np.sin(2 * np.pi * f * t + phase) * np.exp(-t / tau)


def stereo(x: np.ndarray, pan: float = 0.0) -> np.ndarray:
    """Mono -> Stereo mit gleicher Leistung; pan −1 links … +1 rechts."""
    w = (pan + 1) * np.pi / 4
    return np.stack([x * np.cos(w), x * np.sin(w)], 1) * np.sqrt(2)


def hall(x: np.ndarray, rt60: float, nass: float, rng: np.random.Generator, dunkel: float = 3500.0) -> np.ndarray:
    """Faltungshall: Impulsantwort aus abklingendem Rauschen, je Kanal eigenes Rauschen (Breite)."""
    if x.ndim == 1:
        x = stereo(x)
    # Das trockene Signal endet nie hart: letztes Viertel (mind. 50 ms) weich ausblenden,
    # sonst knackt es dort, wo der Klang abgeschnitten ist und nur noch der Hall weiterläuft.
    x = x.copy()
    k = max(sek(0.05), len(x) // 4)
    x[-k:] *= (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, k)))[:, None]
    n_ir = sek(rt60 * 1.1)
    t = np.arange(n_ir) / SR
    ir = rng.standard_normal((n_ir, 2)) * np.exp(-6.91 * t / rt60)[:, None]
    ir = filter_fft(ir, tief=120, hoch=dunkel, ordnung=1)
    ir[: sek(0.012)] = 0                      # kurze Vorverzögerung: der Raum antwortet später
    ir /= np.sqrt(np.sum(ir ** 2, axis=0, keepdims=True)) + 1e-12
    n = len(x) + n_ir
    m = 1 << int(np.ceil(np.log2(n)))
    nass_sig = np.fft.irfft(np.fft.rfft(x, m, axis=0) * np.fft.rfft(ir, m, axis=0), m, axis=0)[:n]
    trocken = np.zeros((n, 2))
    trocken[: len(x)] = x
    return trocken * (1 - nass) + nass_sig * nass


def normieren(x: np.ndarray, spitze_db: float = -1.0) -> np.ndarray:
    return x * (10 ** (spitze_db / 20) / (np.max(np.abs(x)) + 1e-12))


def ausblenden(x: np.ndarray, dauer: float = 0.03) -> np.ndarray:
    """Kurzes Ausblenden am Ende gegen Knackser."""
    k = min(len(x), sek(dauer))
    x[-k:] *= np.linspace(1, 0, k)[:, None] if x.ndim == 2 else np.linspace(1, 0, k)
    return x


def bandrauschen_gleitend(n: int, mitten: np.ndarray, breite_okt: float, rng: np.random.Generator) -> np.ndarray:
    """Rauschen durch einen Bandpass, dessen Mitte über die Zeit wandert (Blöcke mit Überlappung).

    mitten: Mittenfrequenz je Abtastwert (Hz). Blöcke zu 2048 mit Hann-Fenster, 75 % Überlappung.
    """
    blk, hop = 2048, 512
    roh = rng.standard_normal(n + blk)
    aus = np.zeros(n + blk)
    norm = np.zeros(n + blk)
    fen = np.hanning(blk)
    f = np.fft.rfftfreq(blk, 1 / SR)
    for s in range(0, n, hop):
        fm = mitten[min(s + blk // 2, n - 1)]
        lo, hi = fm * 2 ** (-breite_okt / 2), fm * 2 ** (breite_okt / 2)
        with np.errstate(divide="ignore"):
            h = 1 / np.sqrt(1 + (f / hi) ** 4) / np.sqrt(1 + (lo / np.maximum(f, 1e-6)) ** 4)
        seg = np.fft.irfft(np.fft.rfft(roh[s:s + blk] * fen) * h, blk)
        aus[s:s + blk] += seg * fen
        norm[s:s + blk] += fen ** 2
    return aus[:n] / np.maximum(norm[:n], 1e-3)


def mitten_schicht(rng, n: int, f: float = 190.0, tau: float = 0.11, klick: float = 1.0) -> np.ndarray:
    """Mitten-Schicht für tiefe Schläge (Review Folge 1): Handy-Lautsprecher geben unter etwa 300 Hz
    kaum etwas wieder, Sub-Boom und Zählschlag fielen dort ganz weg. Dazu kommt ein dumpfer Schlag
    bei 120–600 Hz (gedämpfter Ton mit fallender Tonhöhe plus Bandrauschen) und ein kurzer
    Anschlag bei 1–3 kHz, der den Einsatz auch auf kleinen Lautsprechern hörbar macht."""
    t = np.arange(n) / SR
    fk = f * (1 + 0.35 * np.exp(-t / 0.03))
    ph = 2 * np.pi * np.cumsum(fk) / SR
    # Grundton plus 2. und 3. Teilton: so liegt Energie auch zwischen 300 und 700 Hz
    ton = (np.sin(ph) + 0.6 * np.sin(2 * ph) + 0.3 * np.sin(3 * ph)) * huelle(n, 0.002, tau)
    rausch = filter_fft(rng.standard_normal(n), tief=200, hoch=900, ordnung=2) * huelle(n, 0.001, tau * 0.6) * 1.2
    anschlag = filter_fft(rng.standard_normal(n), tief=1000, hoch=3000, ordnung=2) * huelle(n, 0.0005, 0.009) * 1.4 * klick
    return ton + rausch + anschlag


def rms(x: np.ndarray) -> float:
    return float(np.sqrt(np.mean(np.square(x))) + 1e-12)


# ---------------------------------------------------------------- Klänge

def klang_sub_boom(rng, f_start=52.0, f_ende=29.0, dauer=3.0):
    """Tiefer Schlag für Wendepunkte: Sinus, der von 52 auf 29 Hz fällt, dazu ein dumpfer Stoß.

    Handylautsprecher geben unter 80 Hz kaum etwas wieder. Eine weiche Sättigung (tanh) erzeugt
    Obertöne um 90–150 Hz, damit der Schlag auch dort als Druck ankommt.
    """
    t = zeit(dauer)
    f = f_ende + (f_start - f_ende) * np.exp(-t / 0.35)
    ph = 2 * np.pi * np.cumsum(f) / SR
    ton = np.sin(ph) * huelle(len(t), 0.006, 0.9)
    stoss = filter_fft(rng.standard_normal(len(t)), hoch=140, ordnung=2) * huelle(len(t), 0.002, 0.08) * 0.8
    x = np.tanh(1.8 * (ton + stoss)) / np.tanh(1.8)
    # Review Folge 1: unter 35 Hz hochpassen (vorher 22 Hz) und den Sub-Anteil um 3 dB senken;
    # die Mitten-Schicht liegt 4 dB (RMS) unter dem Boom (gehört: −8 dB reichte am Handy nicht,
    # gemessen −25 dB gegen die Stimme über 300 Hz).
    x = filter_fft(x, tief=35, hoch=900, ordnung=3) * 10 ** (-3 / 20)
    m = mitten_schicht(rng, len(t), f=210.0, tau=0.14)
    x = x + m * (rms(x) / rms(m)) * 10 ** (-4 / 20)
    y = hall(x, 2.2, 0.18, rng, dunkel=1800)
    return normieren(ausblenden(y))


def klang_zaehlschlag(rng, f=62.0, schimmer=1.0, dauer=2.6):
    """Leitgeräusch von Mister Hundred: je Zahl ein dumpfer, leiser Schlag (serie.md), dazu ein
    kaltes, gläsernes Schimmern, das zum türkisen Leuchten hinter seinen Händen gehört."""
    t = zeit(dauer)
    # Körper: Tonhöhe fällt in 40 ms von 1,5·f auf f (wie ein großes, gedämpftes Fell)
    fk = f * (1 + 0.5 * np.exp(-t / 0.04))
    koerper = np.sin(2 * np.pi * np.cumsum(fk) / SR) * huelle(len(t), 0.003, 0.28)
    koerper += 0.35 * np.sin(2 * np.pi * np.cumsum(fk * 2.3) / SR) * huelle(len(t), 0.003, 0.12)
    anschlag = filter_fft(rng.standard_normal(len(t)), tief=80, hoch=900, ordnung=2) * huelle(len(t), 0.001, 0.025) * 0.5
    x = np.tanh(1.5 * (koerper + anschlag))
    # Mitten-Schicht (Review Folge 1): das Leitgeräusch muss auch am Handy hörbar sein
    x = filter_fft(x, tief=35, ordnung=3)
    m = mitten_schicht(rng, len(t), f=2.6 * f, tau=0.12, klick=0.8)
    x = x + m * (rms(x) / rms(m)) * 10 ** (-5 / 20)
    # Schimmern: unharmonische Teiltöne, leicht verstimmt (Schwebung), langsamer Anstieg
    sch = np.zeros(len(t))
    for fs, a in ((2093.0, 1.0), (2911.0, 0.7), (3687.0, 0.5), (5120.0, 0.25)):
        for d in (-1.5, 1.5):
            sch += a * np.sin(2 * np.pi * (fs + d) * t + rng.uniform(0, 2 * np.pi))
    sch *= huelle(len(t), 0.12, 0.7) * 0.022 * schimmer
    y = hall(stereo(x) + np.stack([sch, np.roll(sch, sek(0.011))], 1), 2.4, 0.3, rng, dunkel=6000)
    return normieren(ausblenden(y))


def klang_frost(rng, dauer=1.9):
    """Atem wird weiß: kalter Hauch (Bandrauschen) und Knistern wie Eiskristalle, die wachsen."""
    n = sek(dauer)
    t = np.arange(n) / SR
    hauch = filter_fft(rng.standard_normal(n), tief=700, hoch=4200, ordnung=2)
    hauch *= huelle(n, 0.28, 0.55) * 0.5
    # Knistern: kurze Rauschblitze, anfangs selten, dann dichter (Kristalle wachsen)
    knist = np.zeros((n, 2))
    zeiten = np.sort(0.15 + 1.25 * rng.uniform(0, 1, 70) ** 0.6)
    blitz = filter_fft(rng.standard_normal(sek(0.004)), tief=3500, hoch=11000, ordnung=2)
    for z in zeiten:
        i = sek(z)
        if i + len(blitz) >= n:
            continue
        a = rng.uniform(0.15, 0.6) * np.exp(-(z - 0.9) ** 2 / 0.5)
        p = rng.uniform(-0.8, 0.8)
        knist[i:i + len(blitz)] += stereo(blitz * a * np.hanning(len(blitz)), p)
    y = stereo(hauch, 0.0) * np.stack([1 + 0.15 * np.sin(2 * np.pi * 0.7 * t), 1 - 0.15 * np.sin(2 * np.pi * 0.7 * t)], 1)
    y = hall(y + knist * 0.9, 1.6, 0.35, rng, dunkel=9000)
    return normieren(ausblenden(y))


SYNC_WHOOSH = 0.32


def klang_whoosh(rng, dauer=0.75, richtung=1.0):
    """Luftzug für Snap-Zooms: Band wandert 300 -> 2600 -> 900 Hz, lauteste Stelle bei 0,32 s,
    von links nach rechts (richtung −1 umgekehrt)."""
    n = sek(dauer)
    t = np.arange(n) / SR
    s = SYNC_WHOOSH
    mitte = np.where(t < s, 300 * (2600 / 300) ** (t / s), 2600 * (900 / 2600) ** np.clip((t - s) / (dauer - s), 0, 1))
    x = bandrauschen_gleitend(n, mitte, 1.4, rng)
    env = np.where(t < s, (t / s) ** 2.2, np.exp(-(t - s) / 0.09))
    x *= env
    pan = np.clip(richtung * (t - s) / 0.25, -1, 1)
    w = (pan + 1) * np.pi / 4
    y = np.stack([x * np.cos(w), x * np.sin(w)], 1) * np.sqrt(2)
    y = hall(y, 0.8, 0.15, rng, dunkel=7000)
    return normieren(ausblenden(y))


def klang_klopfen(rng, tonhoehe=1.0, dauer=0.5):
    """Schuh wird auf Holz abgestellt: gedämpfte Holzmoden plus kurzer Anschlag."""
    n = sek(dauer)
    x = np.zeros(n)
    for f, tau, a in ((175.0, 0.045, 1.0), (412.0, 0.026, 0.7), (960.0, 0.012, 0.45), (1830.0, 0.006, 0.25)):
        x += a * gedaempfter_ton(f * tonhoehe, tau, dauer, rng.uniform(0, 1))
    anschlag = filter_fft(rng.standard_normal(n), tief=300, hoch=3200, ordnung=2) * huelle(n, 0.0008, 0.006) * 0.8
    x = (x + anschlag) * huelle(n, 0.0015, 1.0)
    y = hall(x, 0.6, 0.2, rng, dunkel=4000)
    return normieren(ausblenden(y))


def klang_riegel(rng, dauer=0.8):
    """Luke fällt zu und der Riegel rastet ein: dumpfer Holzschlag, 70 ms später metallisches Klacken."""
    n = sek(dauer)
    x = np.zeros(n)
    # Holzschlag (Luke)
    holz = sum(a * gedaempfter_ton(f, tau, dauer) for f, tau, a in ((92.0, 0.11, 1.0), (233.0, 0.05, 0.6), (610.0, 0.02, 0.35)))
    holz += filter_fft(rng.standard_normal(n), hoch=1800, ordnung=2) * huelle(n, 0.001, 0.015) * 0.7
    x += holz
    # Riegel: hohe, kurz klingende Metallmoden
    i = sek(0.07)
    metall = sum(a * gedaempfter_ton(f, tau, dauer - 0.07) for f, tau, a in ((2310.0, 0.03, 1.0), (3720.0, 0.022, 0.7), (5150.0, 0.015, 0.5), (1240.0, 0.04, 0.5)))
    metall += filter_fft(rng.standard_normal(len(metall)), tief=2500, hoch=9000, ordnung=2) * huelle(len(metall), 0.0005, 0.004) * 1.2
    x[i:] += 0.55 * metall
    y = hall(x * huelle(n, 0.001, 1.0), 0.7, 0.22, rng, dunkel=5000)
    return normieren(ausblenden(y))


def klang_knarzen(rng, tonhoehe=1.0, dauer=1.25):
    """Holz knarzt (Treppe, Luke): Haften und Gleiten als unregelmäßige Impulsfolge,
    die eine kleine Resonanzbank anregt. Die Impulsrate gleitet hoch und wieder herunter."""
    n = sek(dauer)
    t = np.arange(n) / SR
    rate = tonhoehe * (95 + 70 * np.sin(np.pi * np.clip(t / dauer, 0, 1)) ** 1.5)
    impulse = np.zeros(n)
    z = 0.05
    while z < dauer - 0.05:
        i = sek(z)
        impulse[i] = rng.uniform(0.5, 1.0)
        z += (1 / rate[i]) * rng.uniform(0.75, 1.3)
    ir_t = np.arange(sek(0.02)) / SR
    ir = sum(a * np.sin(2 * np.pi * f * tonhoehe * ir_t) * np.exp(-ir_t / tau)
             for f, tau, a in ((720.0, 0.004, 1.0), (1380.0, 0.003, 0.7), (2650.0, 0.0018, 0.45), (310.0, 0.006, 0.5)))
    x = np.convolve(impulse, ir)[:n]
    x *= huelle(n, 0.18, 0.35, halten=0.45)
    y = hall(x, 0.9, 0.25, rng, dunkel=4500)
    return normieren(ausblenden(y))


def klang_motor(rng, dauer=2.3):
    """Motor im Leerlauf: Zündstöße um 24 Hz mit leichtem Zittern, dumpf, dazu Klappern."""
    n = sek(dauer)
    t = np.arange(n) / SR
    x = np.zeros(n)
    stoss = filter_fft(rng.standard_normal(sek(0.05)), hoch=260, ordnung=2) * np.exp(-np.arange(sek(0.05)) / SR / 0.012)
    z = 0.0
    while z < dauer - 0.06:
        i = sek(z)
        x[i:i + len(stoss)] += stoss * rng.uniform(0.75, 1.0)
        z += 1 / (24.0 * rng.uniform(0.95, 1.05))
    brumm = 0.35 * np.sin(2 * np.pi * 48 * t) * (1 + 0.3 * np.sin(2 * np.pi * 24 * t))
    klappern = filter_fft(rng.standard_normal(n), tief=1500, hoch=5000, ordnung=2) * (0.5 + 0.5 * np.sin(2 * np.pi * 24 * t)) ** 4 * 0.12
    x = filter_fft(x + brumm, tief=30, hoch=420, ordnung=2) + klappern
    x *= huelle(n, 0.12, 0.6, halten=1.2)
    y = hall(x, 0.5, 0.12, rng, dunkel=3000)
    return normieren(ausblenden(y))


def klang_glocke(rng, f=196.0, dauer=9.0):
    """Turmuhr aus der Ferne: unharmonische Glockenteiltöne (Brumm, Prim, Terz, Quint, Oktave …),
    tiefe klingen länger. Tiefpass und viel Hall für die Entfernung."""
    t = zeit(dauer)
    teil = ((0.5, 1.0, 3.2), (1.0, 0.8, 2.2), (1.19, 0.6, 1.6), (1.5, 0.35, 1.2),
            (2.0, 0.5, 1.0), (2.51, 0.25, 0.6), (3.0, 0.2, 0.45), (4.07, 0.12, 0.3))
    x = np.zeros(len(t))
    for r, a, tau in teil:
        for d in (-0.6, 0.6):          # Schwebung durch leicht verstimmte Paare
            x += a * np.sin(2 * np.pi * (f * r + d) * t + rng.uniform(0, 2 * np.pi)) * np.exp(-t / tau)
    x += filter_fft(rng.standard_normal(len(t)), tief=400, hoch=4000, ordnung=2) * huelle(len(t), 0.0008, 0.01) * 2.0
    x *= huelle(len(t), 0.002, 99.0)
    x = filter_fft(x, tief=60, hoch=2400, ordnung=2)
    y = hall(x, 3.2, 0.45, rng, dunkel=2500)
    return normieren(ausblenden(y, 0.3))


def klang_auspusten(rng, dauer=0.9):
    """Kerzen werden ausgeblasen: kurzer, weicher Luftstoß, dann ein feines Zischen des Dochts."""
    n = sek(dauer)
    stoss = filter_fft(rng.standard_normal(n), tief=150, hoch=1300, ordnung=2) * huelle(n, 0.012, 0.11)
    fff = filter_fft(rng.standard_normal(n), tief=2500, hoch=8000, ordnung=2) * huelle(n, 0.02, 0.16) * 0.45
    zisch = filter_fft(rng.standard_normal(n), tief=5000, hoch=12000, ordnung=2) * huelle(n, 0.15, 0.25, halten=0.1) * 0.05
    y = hall(stoss + fff + zisch, 0.7, 0.2, rng, dunkel=6000)
    return normieren(ausblenden(y))


def klang_schaben(rng, dauer=2.8, naeher=1.0):
    """Review Teil 3 (Satz 25): ein Fingernagel schabt über Erde. Körniges Rauschen (500–4000 Hz) in kurzen,
    unregelmäßigen Zügen; es kommt näher (lauter, von der Seite zur Mitte) und reißt am Ende ab."""
    n = sek(dauer)
    t = zeit(dauer)
    korn = filter_fft(rng.standard_normal(n), tief=500, hoch=4000, ordnung=2)
    # Züge: 3–4 Bewegungen je Sekunde, jede mit eigener Hüllkurve, dazwischen fast Stille
    zuege = np.zeros(n)
    pos = 0.05
    while pos < dauer - 0.15:
        lang = rng.uniform(0.16, 0.3)
        a, b = sek(pos), min(n, sek(pos + lang))
        zuege[a:b] = np.sin(np.linspace(0, np.pi, b - a)) ** 1.5 * rng.uniform(0.7, 1.0)
        pos += lang + rng.uniform(0.04, 0.12)
    # Körnung: kleine Klicks (Steinchen) auf den Zügen
    klicks = (rng.random(n) < 0.004) * rng.standard_normal(n) * 3.0
    x = (korn + filter_fft(klicks, tief=1500, ordnung=2)) * zuege
    lauter = 0.35 + 0.65 * (t / dauer) ** 1.3 * naeher
    x = x * lauter
    # von links zur Mitte
    pan = 0.7 * (1 - t / dauer)
    y = np.stack([x * np.sqrt(0.5 * (1 + pan)), x * np.sqrt(0.5 * (1 - pan))], 1)
    y = hall(y, 0.4, 0.15, rng, dunkel=5000)
    # harter Abriss am Ende (der Finger zieht sich zurück)
    y[-sek(0.02):] *= np.linspace(1, 0, sek(0.02))[:, None]
    return normieren(y)


KLAENGE = {
    "schaben": klang_schaben,
    "sub_boom": klang_sub_boom,
    "zaehlschlag": klang_zaehlschlag,
    "frost": klang_frost,
    "whoosh": klang_whoosh,
    "klopfen": klang_klopfen,
    "riegel": klang_riegel,
    "knarzen": klang_knarzen,
    "motor": klang_motor,
    "glocke": klang_glocke,
    "auspusten": klang_auspusten,
}
# Welcher Moment des Klangs auf dem Wort liegt (s ab Klangbeginn)
SYNC = {"whoosh": SYNC_WHOOSH}


# ---------------------------------------------------------------- Rules of Kindly (Folge 1, Bibel §10.6)

def _eis_tipp_einzel(rng, hohl=1.0, hell=1.0):
    """Ein Tipper auf dünnem Eis: harter Klick, ein kurzes „Singen“ des Eises (fallender hoher Ton, wie ein
    gespanntes Blech) und darunter ein hohler, dumpfer Ton (das Wasser unter dem Eis)."""
    dauer = 0.6
    n = sek(dauer)
    t = np.arange(n) / SR
    klick = filter_fft(rng.standard_normal(n), tief=1500, hoch=7000, ordnung=2) * huelle(n, 0.0004, 0.004) * 1.2
    # singendes Eis: Tonhöhe fällt schnell von 3,2 auf 1,1 kHz
    f = 1100 + 2100 * np.exp(-t / 0.035)
    sing = np.sin(2 * np.pi * np.cumsum(f) / SR) * huelle(n, 0.001, 0.07) * 0.35 * hell
    # hohler Körper: gedämpfte tiefe Moden
    koerper = sum(a * gedaempfter_ton(fk, tau, dauer, rng.uniform(0, 1)) for fk, tau, a in ((146.0, 0.07, 1.0), (311.0, 0.04, 0.55), (622.0, 0.02, 0.3)))
    return klick + sing + koerper * 0.8 * hohl


def klang_eis_tipps(rng, zeiten=(0.0, 0.32, 0.64), hohl=1.0, hell=1.0):
    """Stiefel oder Eispickel tippt aufs Eis, hohl (S1, S24, S30): ein Tipper je Eintrag in zeiten (s ab
    Klangbeginn); der erste Tipper liegt am Klangbeginn, die Cue-Zeit also auf dem ersten Aufprall."""
    dauer = max(zeiten) + 0.9
    x = np.zeros(sek(dauer))
    for k, z in enumerate(zeiten):
        e = _eis_tipp_einzel(rng, hohl, hell) * (1.0 - 0.06 * k)
        i = sek(z)
        x[i:i + len(e)] += e[: len(x) - i]
    y = hall(stereo(x), 1.4, 0.25, rng, dunkel=6000)       # weite Eisfläche: langer, heller Nachhall
    return normieren(ausblenden(y))


def klang_eis_schlag(rng, zeiten=(0.0, 0.4, 0.8), knacken=1.0):
    """Drei dumpfe Schläge von unten gegen das Eis (S1, S31, S51, S54): tiefer, gedämpfter Stoß wie durch
    Wasser, Mitten-Schicht für Handy-Lautsprecher, und nach jedem Schlag knackt das Eis (helle Risse)."""
    dauer = max(zeiten) + 1.6
    n = sek(dauer)
    x = np.zeros(n)
    for k, z in enumerate(zeiten):
        m = sek(0.9)
        tt = np.arange(m) / SR
        fk = 58 * (1 + 0.6 * np.exp(-tt / 0.03))
        stoss = np.sin(2 * np.pi * np.cumsum(fk) / SR) * huelle(m, 0.002, 0.16)
        stoss += filter_fft(rng.standard_normal(m), hoch=260, ordnung=2) * huelle(m, 0.001, 0.05) * 0.9
        stoss = np.tanh(1.6 * stoss)
        mitte = mitten_schicht(rng, m, f=170.0, tau=0.1, klick=0.6)
        stoss = stoss + mitte * (rms(stoss) / rms(mitte)) * 10 ** (-3 / 20)
        i = sek(z)
        x[i:i + m] += stoss[: n - i] * (1.0 + 0.08 * k)
        # Knacken: kurze helle Rauschblitze, die sich 0,05–0,4 s nach dem Schlag ausbreiten
        for _ in range(9):
            zb = z + rng.uniform(0.04, 0.4)
            b = filter_fft(rng.standard_normal(sek(0.006)), tief=2500, hoch=9000, ordnung=2) * np.hanning(sek(0.006))
            j = sek(zb)
            if j + len(b) < n:
                x[j:j + len(b)] += b * rng.uniform(0.2, 0.55) * knacken
    y = hall(stereo(x), 1.6, 0.22, rng, dunkel=3500)
    return normieren(ausblenden(y))


def klang_handglocke(rng, f=880.0, dauer=2.4):
    """Odells Handglocke (S5): kleine Messingglocke, nah, heller als die Turmglocke, kurzer Raum."""
    t = zeit(dauer)
    x = np.zeros(len(t))
    for r, a, tau in ((1.0, 1.0, 0.9), (2.0, 0.45, 0.5), (2.76, 0.35, 0.35), (3.95, 0.2, 0.22), (5.4, 0.12, 0.15)):
        for d in (-1.2, 1.2):
            x += a * np.sin(2 * np.pi * (f * r + d) * t + rng.uniform(0, 2 * np.pi)) * np.exp(-t / tau)
    x += filter_fft(rng.standard_normal(len(t)), tief=1500, hoch=8000, ordnung=2) * huelle(len(t), 0.0005, 0.006) * 1.5
    x = filter_fft(x, tief=300, hoch=7000, ordnung=2)
    y = hall(stereo(x), 1.2, 0.2, rng, dunkel=7000)
    return normieren(ausblenden(y, 0.2))


KLAENGE.update({"eis_tipps": klang_eis_tipps, "eis_schlag": klang_eis_schlag, "handglocke": klang_handglocke})


def erzeuge(name: str, seed: int, **params) -> np.ndarray:
    """Klang mit eigenem Zufallsgenerator (Seed) bauen."""
    rng = np.random.default_rng(seed)
    return KLAENGE[name](rng, **params).astype(np.float64)


def schreibe_wav(pfad: Path, x: np.ndarray) -> None:
    pfad.parent.mkdir(parents=True, exist_ok=True)
    kan = 1 if x.ndim == 1 else x.shape[1]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", str(kan), "-i", "-",
                    "-c:a", "pcm_s16le", str(pfad)], input=x.astype(np.float32).tobytes(), check=True)


def main() -> None:
    ap = argparse.ArgumentParser(description="Alle Klänge als WAV schreiben (zum Anhören)")
    ap.add_argument("--aus", type=Path, required=True)
    ap.add_argument("--seed", type=int, default=1)
    a = ap.parse_args()
    for k, name in enumerate(KLAENGE):
        x = erzeuge(name, a.seed + k)
        schreibe_wav(a.aus / f"{name}.wav", x)
        print(f"{name:12s} {len(x) / SR:5.2f} s")


if __name__ == "__main__":
    main()
