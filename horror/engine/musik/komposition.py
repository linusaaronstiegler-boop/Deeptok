#!/usr/bin/env python3
"""Eigene Kompositionen in vier Stilen, nach der Grammatik in GRAMMATIK.md, als Notenlisten und MIDI.

    python engine/musik/komposition.py            # schreibt engine/musik/midi/<stil>-<variante>.mid (Stufe 2)

Kein Stück übernimmt Melodie, Akkordfolge oder Muster aus den Referenzen. Übernommen sind nur die
Regeln: Instrumentierung, Tempo, Register, Raster, Akkordtypen, Orgelpunkt, Verstimmung, Hall.

Aufbau eines Stils (Funktion stil_<name>() -> dict):
  bpm, takte, schleife_takte, cent (Verstimmung), a4 (Bezugston für FluidSynth),
  schichten: {name: {stimme | programm, noten: [{b, d, ton, vel, pan}], ...}}  (b, d in Schlägen)
  varianten: {duenn|normal|voll: {schicht: dB oder None (aus)}}
  hall: {rt60, vor_ms, breite, hoehen, nass}, sends: {schicht: Anteil}
Die drei Varianten eines Stils teilen Takt und Harmonie. Deshalb lassen sie sich in der
Spannungsfassung (spannung.py) jederzeit ineinander überblenden.
"""

from __future__ import annotations

import json
import math
import zlib
from pathlib import Path

import numpy as np

HIER = Path(__file__).resolve().parent
PC = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7,
      "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11, "H": 11, "Cb": 11}
TYP = {"": [0, 4, 7], "m": [0, 3, 7], "+": [0, 4, 8], "dim": [0, 3, 6], "sus4": [0, 5, 7],
       "maj7": [0, 4, 7, 11], "7": [0, 4, 7, 10], "m7": [0, 3, 7, 10], "mmaj7": [0, 3, 7, 11], "7sus4": [0, 5, 7, 10]}
VARIANTEN = ("duenn", "normal", "voll")


# ---------------------------------------------------------------- Bausteine

def akkord(wurzel: str, typ: str = "") -> list[int]:
    """Tonklassen eines Akkords, z. B. akkord('Eb', '+') -> Es-G-H."""
    return [(PC[wurzel] + i) % 12 for i in TYP[typ]]


def im_register(pcs: list[int], lo: int, hi: int) -> list[int]:
    return [m for m in range(lo, hi + 1) if m % 12 in pcs]


def waehle(toene: list[int], pos: float) -> int:
    """Ton an relativer Stelle pos (0 = tiefster, 1 = höchster Akkordton im Register)."""
    return toene[int(round(pos * (len(toene) - 1)))]


def ohne_sekunde(vorher: int | None, ton: int, toene: list[int], verboten: set[int] = frozenset()) -> int:
    """Grammatik der Spieluhren: zwischen Nachbartönen keine Sekunde (1–2 Halbtöne).
    Liegt der gewählte Ton zu nah am vorigen, nimm den nächsten Akkordton, der weit genug weg ist."""
    if vorher is None or (abs(ton - vorher) > 2 and ton not in verboten) or ton == vorher:
        return ton
    kand = [t for t in toene if abs(t - vorher) >= 3 and t not in verboten]
    return min(kand, key=lambda t: (abs(t - ton), t)) if kand else ton


def note(b: float, d: float, ton: int, vel: int, pan: float = 0.0) -> dict:
    return {"b": round(b, 4), "d": round(d, 4), "ton": int(ton), "vel": int(np.clip(vel, 1, 127)), "pan": round(pan, 3)}


def phrasen_faktor(takt: int, schleife: int, db: float) -> float:
    """Velocity-Faktor für eine sanfte Phrasen-Dynamik: Bogen über eine Schleife, Gipfel in der Mitte.
    db ist der Hub der Amplitude; Stärke = (vel/127)^1,6, also Velocity-Faktor = 10^(db/32)."""
    if not db:
        return 1.0
    return 10 ** (db * math.sin(math.pi * ((takt % schleife) + 0.5) / schleife) / 32) / 10 ** (db / 64)


def pan_nach_hoehe(ton: int, mitte: int, breite: float, spanne: int = 12) -> float:
    """Höhere Töne rechts, tiefere links (wie am Instrument), begrenzt auf ± breite."""
    return float(np.clip((ton - mitte) / spanne, -1, 1) * breite)


# ---------------------------------------------------------------- Stil 1: Spieluhr-Arpeggio (Grammatik r2)

def stil_spieluhr(lo: int = 64, hi: int = 83, pan: float = 0.35, zweiklang_auf: tuple = (0, 4),
                  dynamik_db: float = 0.0) -> dict:
    """G-Dur, 112 BPM, 8-Takt-Schleife, +46 Cent. Durchlaufende Achtel aus Akkordtönen, Orgelpunkt D5
    auf den Achteln 3 und 7 (Grammatik: ein wiederkehrender Ton, etwa jeder vierte Anschlag).
    Eigene Folge: Tonika, Mediante in Moll, Subdominante, Moll-Subdominante, übermäßige Tonika."""
    rng = np.random.default_rng(112)
    bpm, schleife, runden = 112, 8, 10
    orgelpunkt = 74                                      # Orgelpunkt D5; Register Std E4..H5
    folge_a = [("G", ""), ("B", "m"), ("C", ""), ("C", "m"), ("G", ""), ("G", "+"), ("E", "m"), ("D", "")]
    folge_b = [("G", ""), ("B", "m"), ("C", ""), ("C", "m"), ("E", "m"), ("G", "+"), ("C", ""), ("D", "sus4")]
    # Muster je Takt: relative Lage im Akkord; 'P' = Orgelpunkt. Takt-Eins tief, Auftakt (Achtel 8) hoch.
    muster = [[0.0, 0.45, "P", 0.9, 1.0, 0.55, "P", 0.75],
              [0.15, 0.7, "P", 0.35, 0.95, 0.6, "P", 0.85]]
    kern, fuell, pedal, zweik = [], [], [], []
    vorher = None
    for takt in range(schleife * runden):
        folge = folge_a if (takt // schleife) % 2 == 0 else folge_b
        w, typ = folge[takt % schleife]
        toene = [t for t in im_register(akkord(w, typ), lo, hi) if t != orgelpunkt]
        for j, pos in enumerate(muster[takt % 2]):
            b = takt * 4 + j * 0.5
            if pos == "P":
                pedal.append(note(b, 0.5, orgelpunkt, 72 + rng.integers(-3, 4), 0.05))
                vorher = orgelpunkt
                continue
            # vor dem Orgelpunkt keine Nachbartöne des Orgelpunkts (sonst entstünde dort eine Sekunde)
            vor_p = j + 1 < 8 and muster[takt % 2][j + 1] == "P"
            verboten = {t for t in toene if abs(t - orgelpunkt) <= 2} if vor_p else set()
            ton = ohne_sekunde(vorher, waehle(toene, pos), toene, verboten)
            vel = 100 if j == 0 else (90 if j == 7 else 78 + rng.integers(-5, 6))
            vel = int(vel * phrasen_faktor(takt, schleife, dynamik_db))
            n = note(b, 0.5, ton, vel, pan_nach_hoehe(ton, 73, pan))
            (kern if j in (0, 4) else fuell).append(n)
            if j in zweiklang_auf:
                # Zweiklang auf 1 und 3: ein Akkordton eine Terz bis Sexte darunter (r2: 1,45 Töne je Einsatz)
                unten = [t for t in im_register(akkord(w, typ), 60, hi) if 3 <= ton - t <= 9]
                if unten:
                    zweik.append(note(b, 0.5, unten[-1], vel - 22, pan_nach_hoehe(unten[-1], 73, pan)))
            vorher = ton
    # Glitzer (nur voll): eigene langsame Gegenstimme in der 6. Oktave, chromatisch fallend/steigend
    glitzer_a = [(91, 4), (90, 2), (86, 2), (88, 4), (87, 2), (84, 2), (86, 4), (87, 4), (88, 2), (83, 2), (90, 4)]
    glitzer_b = [(91, 4), (90, 2), (86, 2), (88, 4), (87, 2), (84, 2), (88, 2), (83, 2), (87, 4), (88, 4), (86, 2), (90, 2)]
    glitzer, tief, orgel = [], [], []
    for runde in range(runden):
        b0 = runde * schleife * 4
        b = b0
        for ton, d in (glitzer_a if runde % 2 == 0 else glitzer_b):
            glitzer.append(note(b, d, ton, 58, 0.25))
            b += d
        orgel.append(note(b0, schleife * 4, orgelpunkt, 60, 0.0))
        folge = folge_a if runde % 2 == 0 else folge_b
        for k, (w, typ) in enumerate(folge):
            pcs = akkord(w, typ)
            grund = [t for t in range(55, 67) if t % 12 == pcs[0]][0]   # G3..F#4
            tief.append(note(b0 + 4 * k, 2, grund, 70, -0.15))
            quinte = [t for t in im_register(pcs, grund + 3, grund + 9)]
            if quinte:
                tief.append(note(b0 + 4 * k + 2, 2, quinte[-1], 58, -0.1))
    return {
        "name": "spieluhr", "titel": "Spieluhr-Arpeggio", "referenz": "r2",
        "bpm": bpm, "takte": schleife * runden, "schleife_takte": schleife, "cent": 46.0, "a4": 440.0,
        "jitter_ms": 4, "wow": None,
        "schichten": {
            "kern": {"stimme": "spieluhr_weich", "gm": 8, "noten": kern},
            "fuell": {"stimme": "spieluhr_weich", "gm": 8, "noten": fuell},
            "orgelpunkt": {"stimme": "spieluhr_weich", "gm": 8, "noten": pedal},
            "zweiklang": {"stimme": "spieluhr_weich", "gm": 8, "noten": zweik},
            "orgel": {"stimme": "sinus_orgel", "gm": 16, "noten": orgel, "abdaempfen": False},
            "glitzer": {"stimme": "spieluhr_weich", "gm": 8, "noten": glitzer},
            "tief": {"stimme": "glocke_tief", "gm": 10, "noten": tief},
        },
        "varianten": {
            "duenn": {"kern": 0, "orgelpunkt": -1, "fuell": None, "zweiklang": None, "orgel": None, "glitzer": None, "tief": None},
            "normal": {"kern": 0, "orgelpunkt": -2, "fuell": -1, "zweiklang": -5, "orgel": -24, "glitzer": None, "tief": None},
            "voll": {"kern": 0, "orgelpunkt": -2, "fuell": -1, "zweiklang": -3, "orgel": -16, "glitzer": -7, "tief": -9},
        },
        "hall": {"rt60": 1.2, "vor_ms": 12, "breite": 0.8, "hoehen": 0.5, "nass": 0.55},
        "sends": {"orgel": 0.6, "tief": 0.8},
    }


# ---------------------------------------------------------------- Stil 2: Wiegenlied-Spieluhr (Grammatik r5)

def stil_wiegenlied(pan: float = 0.3, grund_lage: tuple = (46, 58), dynamik_db: float = 0.0,
                    lo: int = 60, hi: int = 82, akzent: int = 84) -> dict:
    """Es-Dur, 94 BPM, 8-Takt-Schleife aus zwei Hälften, −40 Cent. Achtel in 3+3+2 (wiegend),
    Orgelpunkt G5 (Terz der Tonart) auf den Achteln 2 und 6, Kamm-Spieluhr mit Hall und leichtem Leiern.
    Eigene Folge: Es, g, As, as, Es, Es+, Ces, B (zweite Runde: Es, g, As, as, c, Es+, Ces, B-sus4/B)."""
    rng = np.random.default_rng(94)
    bpm, schleife, runden = 94, 8, 9
    orgelpunkt = 79                                      # Orgelpunkt G5; Register Std C4..B♭5
    folge_a = [[("Eb", "")], [("G", "m")], [("Ab", "")], [("Ab", "m")], [("Eb", "")], [("Eb", "+")], [("Cb", "")], [("Bb", "")]]
    folge_b = [[("Eb", "")], [("G", "m")], [("Ab", "")], [("Ab", "m")], [("C", "m")], [("Eb", "+")], [("Cb", "")],
               [("Bb", "sus4"), ("Bb", "")]]
    # 3+3+2: Gruppen beginnen auf den Achteln 1, 4, 7 (Index 0, 3, 6); 'P' = Orgelpunkt
    muster = [[0.0, "P", 0.55, 0.25, 0.9, "P", 0.7, 0.4],
              [0.1, "P", 0.65, 0.35, 1.0, "P", 0.8, 0.5]]
    kern, fuell, pedal = [], [], []
    vorher = None
    for takt in range(schleife * runden):
        folge = folge_a if (takt // schleife) % 2 == 0 else folge_b
        segmente = folge[takt % schleife]
        for j, pos in enumerate(muster[takt % 2]):
            w, typ = segmente[0] if (len(segmente) == 1 or j < 4) else segmente[1]
            toene = [t for t in im_register(akkord(w, typ), lo, hi) if t != orgelpunkt]
            b = takt * 4 + j * 0.5
            # Grammatik r5: 82 % der Achtel besetzt -> in jedem zweiten Takt die letzte Achtel als Pause,
            # in den Takten 4 und 8 jeder Schleife zusätzlich die dritte
            if (j == 7 and takt % 2 == 1) or (j == 2 and takt % 4 == 3):
                continue
            if pos == "P":
                pedal.append(note(b, 0.5, orgelpunkt, 74 + rng.integers(-2, 3), 0.1))
                vorher = orgelpunkt
                continue
            vor_p = j + 1 < 8 and muster[takt % 2][j + 1] == "P"
            verboten = {t for t in toene if abs(t - orgelpunkt) <= 2} if vor_p else set()
            ton = ohne_sekunde(vorher, waehle(toene, pos), toene, verboten)
            vel = akzent if j in (0, 3, 6) else 76 + rng.integers(-2, 3)
            vel = int(vel * phrasen_faktor(takt, schleife, dynamik_db))
            n = note(b, 0.5, ton, vel, pan_nach_hoehe(ton, 72, pan))
            (kern if j in (0, 3, 6) else fuell).append(n)
            vorher = ton
    grund, glitzer, flaech = [], [], []
    # Glitzer (voll): eigene hohe Linie im 3+3+2-Rhythmus, nur in ungeraden Takten dicht
    gl_a = {0: [91, 94, 91], 1: [86], 2: [96, 92, 87], 3: [83], 4: [91, 87, 82], 5: [83], 6: [90, 87, 83], 7: [86]}
    gl_b = {0: [91, 94, 91], 1: [86], 2: [96, 92, 87], 3: [83], 4: [91, 87, 84], 5: [83], 6: [90, 87, 83], 7: [89, 86]}
    for runde in range(runden):
        b0 = runde * schleife * 4
        folge = folge_a if runde % 2 == 0 else folge_b
        gl = gl_a if runde % 2 == 0 else gl_b
        for k, segmente in enumerate(folge):
            w, typ = segmente[0]
            pcs = akkord(w, typ)
            g = [t for t in range(*grund_lage) if t % 12 == pcs[0]][0]   # Std B♭2..A3: tiefer Grundton auf der Eins
            grund.append(note(b0 + 4 * k, 4, g, 66, -0.05))
            toene = gl[k]
            stellen = [0, 1.5, 3.0] if len(toene) == 3 else ([0, 2.0] if len(toene) == 2 else [0])
            for ton, s in zip(toene, stellen):
                glitzer.append(note(b0 + 4 * k + s, 1.5, ton, 54, 0.3))
            for t in im_register(pcs, 63, 72)[:3]:
                flaech.append(note(b0 + 4 * k, 4, t, 50, pan_nach_hoehe(t, 67, 0.5)))
    return {
        "name": "wiegenlied", "titel": "Wiegenlied-Spieluhr", "referenz": "r5",
        "bpm": bpm, "takte": schleife * runden, "schleife_takte": schleife, "cent": -40.0, "a4": 440.0,
        "jitter_ms": 8, "wow": [6.0, 0.4],
        "schichten": {
            "kern": {"stimme": "spieluhr_kamm", "gm": 10, "noten": kern},
            "fuell": {"stimme": "spieluhr_kamm", "gm": 10, "noten": fuell},
            "orgelpunkt": {"stimme": "spieluhr_kamm", "gm": 10, "noten": pedal},
            "grund": {"stimme": "glocke_tief", "gm": 10, "noten": grund},
            "glitzer": {"stimme": "spieluhr_kamm", "gm": 10, "noten": glitzer},
            "flaeche": {"stimme": "flaeche", "gm": 52, "noten": flaech, "abdaempfen": False},
        },
        "varianten": {
            "duenn": {"kern": 0, "orgelpunkt": -1, "fuell": None, "grund": None, "glitzer": None, "flaeche": None},
            "normal": {"kern": 0, "orgelpunkt": -1, "fuell": -1, "grund": -10, "glitzer": None, "flaeche": None},
            "voll": {"kern": 0, "orgelpunkt": -1, "fuell": -1, "grund": -6, "glitzer": -9, "flaeche": -20},
        },
        "hall": {"rt60": 1.7, "vor_ms": 22, "breite": 0.9, "hoehen": 0.45, "nass": 0.75},
        "sends": {"grund": 0.7, "flaeche": 0.8},
    }


# ---------------------------------------------------------------- Stil 3: Klavier-Fläche (Grammatik ref0)

def stil_klavier(pan: float = 0.6, streicher_lage: tuple = (50, 69), bass_vel: int = 62) -> dict:
    """d-Moll, 66 BPM, 6-Takt-Schleife, A = 432 Hz. Chromatisch fallender Bass D–C♯–C–H–B–A
    (Lamento-Bass, Barock-Gemeingut), darüber eigene Arpeggien und eine sparsame eigene Linie.
    Stufen wie ref0: dünn = Achtel, normal = Achtel + Linie + leise Streicher, voll = Sechzehntel +
    Streicher + Sub-Bass + gleitender Sub-Schlag am Schleifenanfang."""
    rng = np.random.default_rng(66)
    bpm, schleife, runden = 66, 6, 8
    lo, hi = 50, 72                                       # D3..C5 (rechte Hand)
    # Takte als Segmente (Akkord, Schläge); Bass je Takt
    takte_def = [([("D", "m", 4)], 38), ([("D", "mmaj7", 4)], 37), ([("F", "", 4)], 36),
                 ([("E", "7", 4)], 35), ([("Bb", "maj7", 4)], 34), ([("A", "7sus4", 2), ("A", "7", 2)], 33)]
    m8 = [0.0, 0.35, 0.65, 1.0, 0.8, 0.5, 0.7, 0.3]
    m16 = [0.0, 0.15, 0.3, 0.5, 0.7, 0.85, 1.0, 0.85, 0.7, 0.5, 0.3, 0.5, 0.7, 0.85, 0.6, 0.3]
    linie = [(69, 2), (74, 2), (73, 4), (72, 2), (69, 2), (68, 3), (71, 1), (69, 2), (65, 2), (62, 2), (61, 2)]
    k8, k16, bass, mel, streich, sub, fall, pedal = [], [], [], [], [], [], [], []
    for runde in range(runden):
        b0 = runde * schleife * 4
        b = b0
        for ton, d in linie:
            mel.append(note(b, d, ton, 66 + rng.integers(-4, 5), 0.15))
            b += d
        fall.append(note(b0, 4, 33, 90, 0.0))
        for k, (segmente, bton) in enumerate(takte_def):
            tb = b0 + 4 * k
            bass.append(note(tb, 4, bton, bass_vel, -0.5 * pan))
            bass.append(note(tb, 4, bton + 12, bass_vel - 12, -0.4 * pan))
            sub.append(note(tb, 4, bton, 80, 0.0))
            pedal.append((tb, 4.0) if len(segmente) == 1 else (tb, 2.0))
            if len(segmente) > 1:
                pedal.append((tb + 2, 2.0))
            s0 = tb
            for w, typ, n_schl in segmente:
                pcs = akkord(w, typ)
                toene = im_register(pcs, lo, hi)
                for j in range(int(n_schl * 2)):
                    ton = waehle(toene, m8[(int((s0 - tb) * 2) + j) % 8])
                    k8.append(note(s0 + j * 0.5, 0.5, ton, 56 + rng.integers(-6, 5), pan_nach_hoehe(ton, 61, pan)))
                for j in range(int(n_schl * 4)):
                    ton = waehle(toene, m16[(int((s0 - tb) * 4) + j) % 16])
                    k16.append(note(s0 + j * 0.25, 0.25, ton, 50 + rng.integers(-6, 5), pan_nach_hoehe(ton, 61, pan)))
                for t in im_register(pcs, *streicher_lage)[::2][:4]:
                    streich.append(note(s0, n_schl, t, 64, pan_nach_hoehe(t, 60, min(1.0, pan + 0.1))))
                s0 += n_schl
    return {
        "name": "klavier", "titel": "Klavier-Fläche", "referenz": "ref0",
        "bpm": bpm, "takte": schleife * runden, "schleife_takte": schleife, "cent": 1200 * math.log2(432 / 440), "a4": 432.0,
        "jitter_ms": 10, "wow": None, "pedal": pedal,
        "schichten": {
            "klavier8": {"programm": 0, "gm": 0, "noten": k8},
            "klavier16": {"programm": 0, "gm": 0, "noten": k16},
            "bass": {"programm": 0, "gm": 0, "noten": bass},
            "linie": {"programm": 0, "gm": 0, "noten": mel},
            "streicher": {"programm": 49, "gm": 49, "noten": streich},
            "sub": {"stimme": "sinus_orgel", "gm": 38, "noten": sub, "abdaempfen": False},
            "fall": {"stimme": "sub_fall", "gm": 117, "noten": fall},
        },
        "varianten": {
            "duenn": {"klavier8": -1, "bass": -4, "klavier16": None, "linie": None, "streicher": None, "sub": None, "fall": None},
            "normal": {"klavier8": 0, "bass": -1, "klavier16": None, "linie": -1, "streicher": -9, "sub": None, "fall": None},
            "voll": {"klavier8": None, "klavier16": 0, "bass": 0, "linie": 0, "streicher": -2, "sub": -8, "fall": -8},
        },
        "hall": {"rt60": 2.0, "vor_ms": 15, "breite": 1.0, "hoehen": 0.55, "nass": 0.5},
        "sends": {"sub": 0.0, "fall": 0.3, "bass": 0.6},
    }


# ---------------------------------------------------------------- Stil 4: Sub-Drone (Grammatik r1)

def stil_drone() -> dict:
    """Drone auf F1 mit Halbton-Nachbarn E1/F♯1 und Tritonus H, Schwellungen über 12 Takte im
    112er-Raster, Herzschlag, Spannungston, Einschläge. 84 Takte = genau 180 s."""
    bpm, zyklus, runden = 112, 12, 7
    drone, cluster, tritonus, puls, spann, schlag = [], [], [], [], [], []
    for r in range(runden):
        b0 = r * zyklus * 4
        drone.append(note(b0, zyklus * 4 + 2, 29, 100, -0.1))          # F1, überlappt in die nächste Runde
        drone.append(note(b0, zyklus * 4 + 2, 41, 45, 0.1))            # F2 leise
        cluster.append(note(b0 + 16, 28, 28, 70, -0.3))                # E1 ab Takt 5
        cluster.append(note(b0 + 20, 24, 30, 64, 0.3))                 # F♯1 ab Takt 6
        tritonus.append(note(b0 + 24, 16, 35, 70, -0.2))               # H1 im Schwellen-Gipfel
        tritonus.append(note(b0 + 28, 12, 47, 46, 0.25))               # H2
        for takt in range(zyklus):
            puls.append(note(b0 + 4 * takt, 1, 36, 100 if 5 <= takt <= 10 else 70, 0.0))
        spann.append(note(b0 + 16, 24, 84, 50, 0.2))                   # C6, steigt um einen Halbton
        if r % 2 == 1:
            schlag.append(note(b0, 4, 35, 110, 0.0))
    return {
        "name": "drone", "titel": "Sub-Drone", "referenz": "r1",
        "bpm": bpm, "takte": zyklus * runden, "schleife_takte": zyklus, "cent": -23.0, "a4": 440.0,
        "jitter_ms": 0, "wow": None, "schwellen_takte": zyklus,
        "schichten": {
            "drone": {"stimme": "drone", "gm": 89, "noten": drone, "abdaempfen": False, "schwellen": 4.0},
            "cluster": {"stimme": "drone", "gm": 89, "noten": cluster, "abdaempfen": False, "schwellen": 6.0},
            "tritonus": {"stimme": "drone", "gm": 89, "noten": tritonus, "abdaempfen": False, "schwellen": 6.0},
            "luft": {"stimme": "luft", "gm": 122, "noten": []},
            "zischen": {"stimme": "zischen", "gm": 122, "noten": []},
            "puls": {"stimme": "herzschlag", "gm": 0, "kanal": 9, "noten": puls},
            "spannung": {"stimme": "spannung", "gm": 92, "noten": spann, "abdaempfen": False},
            "einschlag": {"stimme": "einschlag", "gm": 0, "kanal": 9, "noten": schlag},
        },
        "varianten": {
            "duenn": {"drone": 0, "luft": -6, "zischen": None, "cluster": None, "tritonus": None, "puls": None, "spannung": None, "einschlag": None},
            "normal": {"drone": 0, "luft": -5, "zischen": None, "cluster": -4, "tritonus": -8, "puls": -14, "spannung": None, "einschlag": None},
            "voll": {"drone": 0, "luft": -4, "zischen": None, "cluster": -2, "tritonus": -5, "puls": -7, "spannung": -24, "einschlag": -3},
        },
        "hall": {"rt60": 3.2, "vor_ms": 30, "breite": 0.7, "hoehen": 0.4, "nass": 0.35},
        "sends": {"drone": 0.4, "puls": 0.6, "einschlag": 0.8, "spannung": 1.0},
    }


STILE = {"spieluhr": stil_spieluhr, "wiegenlied": stil_wiegenlied, "klavier": stil_klavier, "drone": stil_drone}


# ---------------------------------------------------------------- Zeitumrechnung

def laenge_s(stil: dict) -> float:
    return stil["takte"] * 4 * 60 / stil["bpm"]


def noten_in_sekunden(stil: dict, schicht: str, seed: int = 0) -> list[dict]:
    """Schläge -> Sekunden, mit kleiner Zeit-Streuung (jitter_ms) und Stärke 0..1 aus der Velocity.
    Negative Zeiten wandern ans Ende (Schleife)."""
    rng = np.random.default_rng(zlib.crc32(f"{stil['name']}/{schicht}/{seed}".encode()))
    spb = 60 / stil["bpm"]
    L = laenge_s(stil)
    aus = []
    for n in stil["schichten"][schicht]["noten"]:
        t = n["b"] * spb + (rng.normal(0, stil["jitter_ms"] / 1000) if stil["jitter_ms"] else 0.0)
        aus.append({"t": t % L, "dauer": n["d"] * spb, "ton": n["ton"], "staerke": (n["vel"] / 127) ** 1.6, "pan": n["pan"]})
    return aus


# ---------------------------------------------------------------- MIDI (mido)

def _pitchbend_fuer_cent(cent: float) -> int:
    """Pitch-Bend-Wert für eine Verstimmung bei ± 2 Halbtönen Biegebereich (mido: −8192..8191)."""
    return int(round(np.clip(cent / 200 * 8192, -8192, 8191)))


def midi_schreiben(stil: dict, pfad: Path, variante: str | None = None, nur: list[str] | None = None,
                   volle_lautstaerke: bool = False) -> Path:
    """Eine MIDI-Datei (Typ 1) schreiben: je Schicht eine Spur mit Name, Programm, Biegebereich,
    Pitch-Bend für die Verstimmung, CC7 aus dem Varianten-Pegel und den Noten.

    variante: nur Schichten, die dort an sind (CC7 = Pegel). nur: Liste von Schichten (für FluidSynth).
    """
    import mido

    tpb = 480
    mid = mido.MidiFile(type=1, ticks_per_beat=tpb)
    kopf = mido.MidiTrack()
    kopf.append(mido.MetaMessage("track_name", name=f"{stil['titel']} ({variante or 'alle'})", time=0))
    kopf.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(stil["bpm"]), time=0))
    kopf.append(mido.MetaMessage("time_signature", numerator=4, denominator=4, time=0))
    letzte = 0
    for r in range(stil["takte"] // stil["schleife_takte"]):
        tick = r * stil["schleife_takte"] * 4 * tpb
        kopf.append(mido.MetaMessage("marker", text=f"Schleife {r + 1}", time=tick - letzte))
        letzte = tick
    ende = stil["takte"] * 4 * tpb
    kopf.append(mido.MetaMessage("end_of_track", time=ende - letzte))
    mid.tracks.append(kopf)
    pegel = stil["varianten"][variante] if variante else {}
    kanal_frei = [c for c in range(16) if c != 9]
    for i, (name, sch) in enumerate(stil["schichten"].items()):
        if nur is not None and name not in nur:
            continue
        if variante and pegel.get(name) is None:
            continue
        if not sch["noten"]:
            continue
        kanal = sch.get("kanal", kanal_frei[i % len(kanal_frei)])
        spur = mido.MidiTrack()
        spur.append(mido.MetaMessage("track_name", name=name, time=0))
        ereig = []   # (tick, reihenfolge, Nachricht)
        if kanal != 9:
            ereig.append((0, 0, mido.Message("program_change", channel=kanal, program=sch.get("programm", sch.get("gm", 0)))))
            # RPN 0 = Pitch-Bend-Bereich auf ± 2 Halbtöne, dann Biegung für die Verstimmung
            for cc, v in ((101, 0), (100, 0), (6, 2), (38, 0), (101, 127), (100, 127)):
                ereig.append((0, 1, mido.Message("control_change", channel=kanal, control=cc, value=v)))
            ereig.append((0, 2, mido.Message("pitchwheel", channel=kanal, pitch=_pitchbend_fuer_cent(stil["cent"]))))
        db = 0.0 if (volle_lautstaerke or not variante) else pegel[name]
        cc7 = int(np.clip(round(127 * 10 ** (db / 40)), 1, 127))
        ereig.append((0, 3, mido.Message("control_change", channel=kanal, control=7, value=cc7)))
        if name.startswith("klavier") or name in ("bass", "linie"):
            # Haltepedal je Takt bzw. Akkordwechsel (ref0: Klavier mit Pedal)
            for b, d in stil.get("pedal", []):
                ereig.append((int(b * tpb) + 5, 4, mido.Message("control_change", channel=kanal, control=64, value=127)))
                ereig.append((int((b + d) * tpb) - 10, 4, mido.Message("control_change", channel=kanal, control=64, value=0)))
        for n in sch["noten"]:
            a = int(round(n["b"] * tpb))
            # Noten, die über das Schleifenende klingen (Drone), am Ende kappen: die MIDI-Datei ist genau
            # eine Schleife lang; im Audio legt render_noten den Überhang an den Anfang
            e = min(ende, max(a + 1, int(round((n["b"] + n["d"]) * tpb)) - 2))
            ereig.append((a, 6, mido.Message("note_on", channel=kanal, note=n["ton"], velocity=n["vel"])))
            ereig.append((e, 5, mido.Message("note_off", channel=kanal, note=n["ton"], velocity=0)))
        ereig.sort(key=lambda x: (x[0], x[1]))
        jetzt = 0
        for tick, _, msg in ereig:
            spur.append(msg.copy(time=tick - jetzt))
            jetzt = tick
        spur.append(mido.MetaMessage("end_of_track", time=max(0, ende - jetzt)))
        mid.tracks.append(spur)
    pfad = Path(pfad)
    pfad.parent.mkdir(parents=True, exist_ok=True)
    mid.save(pfad)
    return pfad


def statistik(stil: dict, variante: str = "normal") -> dict:
    """Kennzahlen der eigenen Komposition zum Abgleich mit der Grammatik (Anschläge, Register, Schritte)."""
    an = [s for s, g in stil["varianten"][variante].items() if g is not None]
    noten = sorted([n for s in an for n in stil["schichten"][s]["noten"]], key=lambda n: (n["b"], -n["ton"]))
    if not noten:
        return {}
    spb = 60 / stil["bpm"]
    toene = np.array([n["ton"] for n in noten])
    # Einsätze: gleichzeitige Noten zusammenfassen, Oberstimme = höchster Ton je Einsatz
    einsaetze = {}
    for n in noten:
        einsaetze.setdefault(round(n["b"], 3), []).append(n["ton"])
    ober = np.array([max(v) for _, v in sorted(einsaetze.items())])
    iv = np.abs(np.diff(ober))
    pcs = np.bincount(toene % 12, minlength=12)
    haeufig = int(np.bincount(toene).argmax())
    return {
        "anschlaege_pro_s": round(len(noten) / laenge_s(stil), 2),
        "einsaetze_pro_s": round(len(einsaetze) / laenge_s(stil), 2),
        "toene_je_einsatz": round(len(noten) / len(einsaetze), 2),
        "register_midi_p5_p50_p95": [int(np.percentile(toene, q)) for q in (5, 50, 95)],
        "oberstimme_schritt_1_2": round(float(np.mean(np.isin(iv, [1, 2]))), 3),
        "oberstimme_terz_quarte_3_5": round(float(np.mean(np.isin(iv, [3, 4, 5]))), 3),
        "oberstimme_ab_6": round(float(np.mean(iv >= 6)), 3),
        "haeufigster_ton": haeufig,
        "haeufigster_ton_anteil": round(float(np.mean(toene == haeufig)), 3),
        "tonklassen_top3": [int(i) for i in np.argsort(pcs)[::-1][:3]],
        "achtel_s": round(spb / 2, 4),
    }


if __name__ == "__main__":
    import argparse

    import bauen  # erst hier: bauen importiert dieses Modul; dort steht die Nachbesserung (Stufe 2)

    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--aus", default=str(HIER / "midi"))
    ap.add_argument("--stufe", type=int, default=2)
    a = ap.parse_args()
    for name in STILE:
        s = bauen.stil_laden(name, a.stufe)
        for v in VARIANTEN:
            p = midi_schreiben(s, Path(a.aus) / f"{name}-{v}.mid", variante=v)
            print(p, p.stat().st_size, "Bytes")
        print(name, json.dumps(statistik(s), ensure_ascii=False))
