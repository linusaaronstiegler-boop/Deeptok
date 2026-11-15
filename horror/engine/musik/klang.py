#!/usr/bin/env python3
"""Klänge, Hall und Hilfen für die Musik-Werkstatt (nur numpy und ffmpeg, scipy fehlt in der venv).

Alle Stimmen sind eigene Synthese, die Klavier- und Streicherschichten von Stil 3 kommen aus
FluidSynth mit der SoundFont FluidR3_GM (MIT-Lizenz, siehe LIZENZEN.md).

Schlüsselidee für nahtlose Schleifen: Jede Schicht wird „zyklisch“ gerendert. Was über das Ende
der Schleife hinausklingt (Ausklang, Hall), wird an den Anfang addiert, und Filter und Hall
rechnen im Frequenzbereich über genau eine Schleifenlänge (zyklische Faltung). Dann passt das
Ende sampelgenau an den Anfang, ohne Blende.
"""

from __future__ import annotations

import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np

SR = 44100
HIER = Path(__file__).resolve().parent
sys.path.insert(0, str(HIER.parent / "ton"))
from mischen import k_gewichtet  # noqa: E402  (K-Filter nach BS.1770, reines numpy)

SOUNDFONT = Path("/usr/share/sounds/sf2/FluidR3_GM.sf2")


# ---------------------------------------------------------------- Grundlagen

def sek(s: float) -> int:
    return int(round(s * SR))


def midi_hz(ton: float, cent: float = 0.0, a4: float = 440.0) -> float:
    """MIDI-Tonnummer -> Hz; cent verstimmt alles (z. B. +46 Cent wie die r2-Spieluhr)."""
    return a4 * 2 ** ((ton - 69) / 12) * 2 ** (cent / 1200)


def schreibe_wav(pfad: Path, x: np.ndarray, bits: int = 24) -> None:
    """Stereo-WAV über ffmpeg (24 bit PCM, 44,1 kHz)."""
    pfad = Path(pfad)
    pfad.parent.mkdir(parents=True, exist_ok=True)
    x = np.atleast_2d(x.T).T if x.ndim == 1 else x
    if x.shape[1] == 1:
        x = np.repeat(x, 2, axis=1)
    codec = {16: "pcm_s16le", 24: "pcm_s24le", 32: "pcm_f32le"}[bits]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                    "-c:a", codec, str(pfad)], input=x.astype(np.float32).tobytes(), check=True)


def lade_wav(pfad: Path) -> np.ndarray:
    roh = subprocess.run(["ffmpeg", "-v", "error", "-i", str(pfad), "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(roh, np.float32).reshape(-1, 2).astype(np.float64)


def schreibe_mp3(pfad: Path, x: np.ndarray, kbit: int = 96, mono: bool = False) -> None:
    pfad = Path(pfad)
    pfad.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-"]
    if mono:
        cmd += ["-ac", "1"]
    cmd += ["-c:a", "libmp3lame", "-b:a", f"{kbit}k", str(pfad)]
    subprocess.run(cmd, input=x.astype(np.float32).tobytes(), check=True)


# ---------------------------------------------------------------- Filter im Frequenzbereich

def _butter_betrag(f: np.ndarray, tief: float | None, hoch: float | None, ordnung: int) -> np.ndarray:
    h = np.ones_like(f)
    if hoch:
        h = h / np.sqrt(1 + (f / hoch) ** (2 * ordnung))
    if tief:
        with np.errstate(divide="ignore"):
            h = h / np.sqrt(1 + (tief / np.maximum(f, 1e-6)) ** (2 * ordnung))
    return h


def filtern(x: np.ndarray, tief: float | None = None, hoch: float | None = None, ordnung: int = 2,
            zyklisch: bool = False) -> np.ndarray:
    """Hoch-/Tiefpass mit Butterworth-Betragsgang, ohne Phasendrehung.

    zyklisch=True rechnet über genau len(x) Samples: Das Ende wirkt auf den Anfang, wie es sich
    für eine Schleife gehört. Sonst wird mit Nullen verlängert (kein Umlaufen).
    """
    eindim = x.ndim == 1
    y = x[:, None] if eindim else x
    n = len(y)
    m = n if zyklisch else 1 << int(np.ceil(np.log2(n + SR // 2)))
    f = np.fft.rfftfreq(m, 1 / SR)
    spek = np.fft.rfft(y, m, axis=0) * _butter_betrag(f, tief, hoch, ordnung)[:, None]
    aus = np.fft.irfft(spek, m, axis=0)[:n]
    return aus[:, 0] if eindim else aus


def regal(x: np.ndarray, f_ecke: float, db: float, zyklisch: bool = False) -> np.ndarray:
    """Höhen-Kuhschwanz (Shelf): oberhalb f_ecke um db anheben/absenken, weicher Übergang über
    etwa eine Oktave (logistisch im Log-Frequenzmaß). Ohne Phasendrehung."""
    eindim = x.ndim == 1
    y = x[:, None] if eindim else x
    n = len(y)
    m = n if zyklisch else 1 << int(np.ceil(np.log2(n + SR // 2)))
    f = np.fft.rfftfreq(m, 1 / SR)
    s = 1 / (1 + np.exp(-4 * np.log2(np.maximum(f, 1.0) / f_ecke)))
    g = 10 ** (db * s / 20)
    aus = np.fft.irfft(np.fft.rfft(y, m, axis=0) * g[:, None], m, axis=0)[:n]
    return aus[:, 0] if eindim else aus


# ---------------------------------------------------------------- Lautheit (BS.1770, mit Gating)

def lufs(x: np.ndarray) -> float:
    """Integrierte Lautheit in LUFS: 400-ms-Blöcke mit 75 % Überlappung, Gates −70 LUFS und −10 LU."""
    y = k_gewichtet(x if x.ndim == 2 else np.repeat(x[:, None], 2, axis=1))
    p = np.sum(y ** 2, axis=1)
    blk, hop = sek(0.4), sek(0.1)
    kum = np.concatenate([[0.0], np.cumsum(p)])
    st = np.arange(0, max(1, len(p) - blk), hop)
    ms = (kum[st + blk] - kum[st]) / blk
    l = -0.691 + 10 * np.log10(ms + 1e-20)
    ms = ms[l > -70]
    if len(ms) == 0:
        return -99.0
    rel = -0.691 + 10 * np.log10(ms.mean()) - 10
    l = -0.691 + 10 * np.log10(ms + 1e-20)
    return float(-0.691 + 10 * np.log10(ms[l > rel].mean()))


def kurzzeit_lufs(x: np.ndarray, fenster: float = 3.0, schritt: float = 0.1) -> np.ndarray:
    y = k_gewichtet(x)
    p = np.sum(y ** 2, axis=1)
    n, h = sek(fenster), sek(schritt)
    kum = np.concatenate([[0.0], np.cumsum(p)])
    st = np.arange(0, max(1, len(p) - n), h)
    return -0.691 + 10 * np.log10((kum[st + n] - kum[st]) / n + 1e-20)


# ---------------------------------------------------------------- Hall

def hall_ir(rt60: float, vor_ms: float = 15.0, breite: float = 1.0, hoehen: float = 0.5, seed: int = 7) -> np.ndarray:
    """Synthetische Stereo-Impulsantwort (eigener Algorithmus, keine fremde Aufnahme).

    Frühe Reflexionen: 8 Einzelechos zwischen 7 und 45 ms. Nachhall: Rauschen in drei Bändern mit
    eigener Abklingzeit (Tiefen rt60, Mitten 0,8·rt60, Höhen hoehen·rt60, wie ein Raum mit Vorhängen).
    L und R sind unabhängiges Rauschen -> Breite; breite < 1 zieht beide zur Mitte.
    Normiert auf Energie 1 je Kanal, damit 'nass' im Mischverhältnis direkt ablesbar ist.
    """
    rng = np.random.default_rng(seed)
    n = sek(rt60 * 1.3) + sek(vor_ms / 1000)
    t = np.arange(n) / SR
    ir = np.zeros((n, 2))
    for k in range(2):
        w = rng.standard_normal(n)
        tief = filtern(w, hoch=500)
        mitte = filtern(w, tief=500, hoch=3500)
        hoch = filtern(w, tief=3500)
        late = (tief * np.exp(-6.91 * t / rt60) + mitte * np.exp(-6.91 * t / (0.8 * rt60))
                + 0.7 * hoch * np.exp(-6.91 * t / (hoehen * rt60)))
        einblend = np.clip((t - vor_ms / 1000) / 0.03, 0, 1)  # Nachhall setzt nach der Vorverzögerung weich ein
        ir[:, k] = late * einblend
        for _ in range(8):
            d = sek(rng.uniform(0.007, 0.045))
            ir[d, k] += rng.uniform(0.4, 1.0) * rng.choice([-1, 1]) * 3.0
    mitte = ir.mean(1, keepdims=True)
    ir = mitte + breite * (ir - mitte)
    ir /= np.sqrt(np.mean(np.sum(ir ** 2, axis=0)))
    return ir


def falten(x: np.ndarray, ir: np.ndarray, zyklisch: bool) -> np.ndarray:
    """Stereo-Faltung kanalweise (L->L, R->R) über FFT; zyklisch = über genau len(x)."""
    n = len(x)
    m = n if zyklisch else 1 << int(np.ceil(np.log2(n + len(ir))))
    if zyklisch and len(ir) > n:
        raise ValueError("Impulsantwort länger als die Schleife")
    X = np.fft.rfft(x, m, axis=0)
    H = np.fft.rfft(ir, m, axis=0)
    return np.fft.irfft(X * H, m, axis=0)[:n]


# ---------------------------------------------------------------- Hüllkurven und Stereo

def _anschlag(t: np.ndarray, angriff: float) -> np.ndarray:
    return np.where(t < angriff, 0.5 - 0.5 * np.cos(np.pi * t / angriff), 1.0)


def panorama(sig: np.ndarray, pan: float) -> np.ndarray:
    """Mono -> Stereo mit konstanter Leistung; pan −1 links … +1 rechts."""
    w = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    return np.stack([sig * np.cos(w), sig * np.sin(w)], axis=1)


# ---------------------------------------------------------------- Stimmen (eigene Synthese)
# Jede Stimme: (f Hz, Stärke 0..1, Dauer s, rng) -> Mono-Array. Die Dauer ist die höchstens
# hörbare Länge; der Renderer kürzt, wenn dieselbe Zinke neu angeschlagen wird.

def _teiltoene(f: float, t: np.ndarray, liste, rng, streu: float = 0.0) -> np.ndarray:
    s = np.zeros_like(t)
    for faktor, amp, tau in liste:
        ff = f * faktor * (1 + rng.normal(0, streu) if streu else 1)
        if ff >= 16000 or amp <= 0:
            continue
        s += amp * np.sin(2 * np.pi * ff * t + rng.uniform(0, 2 * np.pi)) * np.exp(-t / tau)
    return s


def _klick(n: int, rng, lo: float, hi: float, dauer: float = 0.003) -> np.ndarray:
    k = np.zeros(n)
    m = min(n, sek(dauer))
    w = rng.standard_normal(m) * np.hanning(2 * m)[m:]
    k[:m] = w
    return filtern(k, tief=lo, hoch=hi, ordnung=2)


def spieluhr_weich(f: float, staerke: float, dauer: float, rng, tau: float = 0.16, angriff: float = 0.005,
                   klick: float = 0.015, ping: float = 0.55, a2: float = 0.030, a3: float = 0.050,
                   a6: float = 0.012) -> np.ndarray:
    """Stil 1: weiche Spieluhr/Celesta. Gemessen an r2: fast Sinus, 3. Teilton −33 dB,
    2. Teilton −39 dB, Anschlag-„Ping“ (−7 dB nach 50 ms), danach exponentielles Abklingen."""
    t = np.arange(sek(dauer)) / SR
    # Grundton mit zweistufiger Hüllkurve: kurzer Ping + Körper
    grund = np.sin(2 * np.pi * f * t + rng.uniform(0, 2 * np.pi)) * (ping * np.exp(-t / 0.025) + (1 - ping) * np.exp(-t / tau))
    ober = _teiltoene(f, t, [(2.0, a2, tau / 2), (3.0, a3, tau / 2.5), (4.0, 0.010, tau / 3),
                             (5.0, 0.012, tau / 3.5), (6.27, a6, 0.05)], rng)
    s = grund + ober + klick * _klick(len(t), rng, 2000, 8000)
    return staerke * s * _anschlag(t, angriff)   # weicher Einsatz: r2 zeigt keine breitbandigen Anschlag-Schlieren


def spieluhr_kamm(f: float, staerke: float, dauer: float, rng, tau: float = 0.2, angriff: float = 0.002,
                  klick: float = 0.06, a2: float = 0.02, a6: float = 0.28, a17: float = 0.20, ping: float = 0.5) -> np.ndarray:
    """Stil 2: echte Kamm-Spieluhr. Gemessen an r5: unharmonische Zinken-Teiltöne bei 6,27× und
    17,55× des Grundtons (Biegeschwingung eines einseitig eingespannten Stabs), heller Anschlag."""
    t = np.arange(sek(dauer)) / SR
    grund = np.sin(2 * np.pi * f * t + rng.uniform(0, 2 * np.pi)) * (ping * np.exp(-t / 0.03) + (1 - ping) * np.exp(-t / tau))
    ober = _teiltoene(f, t, [(2.0, a2, tau / 2.5), (6.27, a6, 0.07), (17.55, a17, 0.022)], rng, streu=0.002)
    s = grund + ober + klick * _klick(len(t), rng, 2500, 11000, 0.002)
    return staerke * s * _anschlag(t, angriff)


def glocke_tief(f: float, staerke: float, dauer: float, rng) -> np.ndarray:
    """Tiefer, weicher Grundton (Spieluhr-Basszinke): lange Abklingzeit, wenig Obertöne."""
    t = np.arange(sek(dauer)) / SR
    s = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.7) + _teiltoene(f, t, [(2.0, 0.15, 0.3), (3.0, 0.05, 0.2), (6.27, 0.06, 0.08)], rng)
    return staerke * s * _anschlag(t, 0.004)


def sinus_orgel(f: float, staerke: float, dauer: float, rng, angriff: float = 0.4, abklang: float = 0.6) -> np.ndarray:
    """Gehaltener Glasorgel-Ton (Orgelpunkt): Sinus + etwas Oktave, Vibrato 4,5 Hz ± 3 Cent."""
    t = np.arange(sek(dauer + abklang)) / SR
    vib = 1 + (3 / 1200 * np.log(2)) * np.sin(2 * np.pi * 4.5 * t + rng.uniform(0, 6))
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    s = np.sin(ph) + 0.08 * np.sin(2 * ph)
    hk = np.clip(t / angriff, 0, 1) * np.clip((dauer + abklang - t) / abklang, 0, 1)
    return staerke * s * hk


def flaeche(f: float, staerke: float, dauer: float, rng, angriff: float = 1.2, abklang: float = 1.5) -> np.ndarray:
    """Weiche Fläche (Chor-ähnlich): drei leicht verstimmte Sinus-Stimmen mit Dreieck-Anteil, tiefpassgefiltert."""
    t = np.arange(sek(dauer + abklang)) / SR
    s = np.zeros_like(t)
    for c in (-6, 0, 6):
        ff = f * 2 ** (c / 1200)
        ph = 2 * np.pi * ff * t + rng.uniform(0, 6)
        s += np.sin(ph) + 0.12 * np.sin(3 * ph) + 0.05 * np.sin(5 * ph)
    hk = np.clip(t / angriff, 0, 1) ** 2 * np.clip((dauer + abklang - t) / abklang, 0, 1)
    return staerke * s / 3 * hk


def drone_ton(f: float, staerke: float, dauer: float, rng, saettigung: float = 1.8, angriff: float = 3.0,
              abklang: float = 3.0) -> np.ndarray:
    """Tiefer Drone-Ton mit langsamer Drift und Sättigung (Obertöne bis einige 100 Hz)."""
    t = np.arange(sek(dauer + abklang)) / SR
    drift = 1 + 0.002 * np.sin(2 * np.pi * t / rng.uniform(7, 13) + rng.uniform(0, 6))
    ph = 2 * np.pi * np.cumsum(f * drift) / SR
    s = np.sin(ph) + 0.35 * np.sin(2 * ph + 0.5)
    s = np.tanh(saettigung * s) / np.tanh(saettigung)
    am = 1 + 0.25 * np.sin(2 * np.pi * t / rng.uniform(4, 7) + rng.uniform(0, 6))
    hk = np.clip(t / angriff, 0, 1) * np.clip((dauer + abklang - t) / abklang, 0, 1)
    return staerke * s * am * hk


def herzschlag(staerke: float, rng) -> np.ndarray:
    """Zwei dumpfe Schläge (lub-dub) mit Tonhöhenfall 60 -> 38 Hz, zweiter 0,28 s später und leiser."""
    n = sek(0.9)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for t0, g in ((0.0, 1.0), (0.28, 0.6)):
        tt = np.clip(t - t0, 0, None)
        f = 38 + 22 * np.exp(-tt / 0.05)
        ph = 2 * np.pi * np.cumsum(f) / SR
        s += g * np.sin(ph) * np.exp(-tt / 0.09) * (t >= t0)
    s += 0.05 * filtern(rng.standard_normal(n) * np.exp(-t / 0.02), hoch=600)
    return staerke * np.tanh(1.5 * s)


def einschlag(staerke: float, rng, dauer: float = 3.0) -> np.ndarray:
    """Tiefer Einschlag mit Sub-Fall 80 -> 30 Hz und gefiltertem Rauschstoß (eigene Synthese)."""
    n = sek(dauer)
    t = np.arange(n) / SR
    f = 30 + 50 * np.exp(-t / 0.35)
    ph = 2 * np.pi * np.cumsum(f) / SR
    sub = np.sin(ph) * np.exp(-t / 0.9)
    stoss = filtern(rng.standard_normal(n), hoch=900) * np.exp(-t / 0.08)
    s = sub + 0.5 * stoss / (np.abs(stoss).max() + 1e-9)
    return staerke * np.tanh(1.6 * s) * _anschlag(t, 0.002)


def sub_fall(staerke: float, rng, f0: float = 70.0, f1: float = 32.0, dauer: float = 2.6) -> np.ndarray:
    """Gleitender Sub-Schlag (wie die gebogenen Linien im ref0-Spektrogramm an Übergängen)."""
    n = sek(dauer)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t / 0.6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return staerke * np.sin(ph) * np.exp(-t / 0.9) * _anschlag(t, 0.01)


def spannungston(f: float, staerke: float, dauer: float, rng, steigung_halbtoene: float = 1.0) -> np.ndarray:
    """Hoher, leiser Sinus, der über die Dauer langsam steigt, mit Tremolo (Spannungston wie r1-Intro)."""
    t = np.arange(sek(dauer)) / SR
    ff = f * 2 ** (steigung_halbtoene * t / dauer / 12)
    ph = 2 * np.pi * np.cumsum(ff) / SR
    trem = 1 + 0.3 * np.sin(2 * np.pi * 5.5 * t)
    hk = np.clip(t / (0.4 * dauer), 0, 1) ** 2 * np.clip((dauer - t) / 0.3, 0, 1)
    return staerke * (np.sin(ph) + 0.1 * np.sin(2 * ph)) * trem * hk


def luft(laenge: int, rng, zyklisch: bool = True) -> np.ndarray:
    """Wind/Raumton: braunes Rauschen unter 300 Hz plus wenig Mitten, langsam moduliert (stereo)."""
    out = np.zeros((laenge, 2))
    t = np.arange(laenge) / SR
    for k in range(2):
        w = rng.standard_normal(laenge)
        tief = filtern(np.cumsum(w - w.mean()) / 300, tief=25, hoch=300, zyklisch=zyklisch)
        mitte = filtern(w, tief=150, hoch=1000, zyklisch=zyklisch) * 0.08
        # Modulationsperiode teilt die Schleifenlänge, damit die Naht nicht hörbar ist
        per = laenge / SR / max(1, round(laenge / SR / 9))
        mod = 0.65 + 0.35 * np.sin(2 * np.pi * t / per + k)
        out[:, k] = (tief / (np.std(tief) + 1e-9) * 0.5 + mitte / (np.std(mitte) + 1e-9) * 0.08) * mod
    return out


def zischen(laenge: int, rng, zyklisch: bool = True) -> np.ndarray:
    """Heller Rausch-Teppich 1,5–9 kHz (Knistern, Luft im Raum), langsam schwankend, stereo."""
    out = np.zeros((laenge, 2))
    t = np.arange(laenge) / SR
    per = laenge / SR / max(1, round(laenge / SR / 13))
    for k in range(2):
        w = filtern(rng.standard_normal(laenge), tief=1500, hoch=9000, zyklisch=zyklisch)
        out[:, k] = w / (np.std(w) + 1e-9) * (0.6 + 0.4 * np.sin(2 * np.pi * t / per + 2 * k)) * 0.3
    return out


STIMMEN = {
    # Einheitliche Signatur (f, staerke, dauer, rng); Geräusch-Stimmen ignorieren f bzw. dauer
    "sub_fall": lambda f, s, d, rng: sub_fall(s, rng, f0=1.3 * f, f1=0.6 * f),
    "herzschlag": lambda f, s, d, rng: herzschlag(s, rng),
    "einschlag": lambda f, s, d, rng: einschlag(s, rng),
    "spieluhr_weich": spieluhr_weich,
    "spieluhr_kamm": spieluhr_kamm,
    "glocke_tief": glocke_tief,
    "sinus_orgel": sinus_orgel,
    "flaeche": flaeche,
    "drone": drone_ton,
    "spannung": spannungston,
}


# ---------------------------------------------------------------- Schichten rendern

def render_noten(noten: list[dict], stimme: str, laenge: int, cent: float, rng, zyklisch: bool = True,
                 abdaempfen: bool = True, ausklang: float = 2.5, wow: tuple[float, float] | None = None) -> np.ndarray:
    """Eine Schicht aus Noten (Sekunden) mit einer eigenen Stimme rendern.

    noten: [{t, dauer, ton, staerke (0..1), pan}]. abdaempfen: dieselbe Zinke wird beim neuen
    Anschlag abgedämpft (15 ms), wie bei einer Spieluhr. zyklisch: Ausklang über das Ende wird an
    den Anfang addiert. wow: (Tiefe in Cent, Rate in Hz) für leichtes Leiern; die Rate wird so
    gerundet, dass eine ganze Zahl von Perioden in die Schleife passt (sonst knackt die Naht).
    """
    fn = STIMMEN[stimme]
    buf = np.zeros((laenge + sek(ausklang + 8), 2))
    # Nächster Anschlag derselben Zinke (für das Abdämpfen). In einer Schleife dämpft der erste
    # Anschlag der nächsten Runde den letzten dieser Runde.
    naechster, erster = {}, {}
    for n in sorted(noten, key=lambda n: n["t"], reverse=True):
        naechster_t = naechster.get(n["ton"])
        naechster[n["ton"]] = n["t"]
        n["_bis"] = naechster_t
    for ton, t0 in naechster.items():
        erster[ton] = t0
    if zyklisch:
        for n in noten:
            if n["_bis"] is None:
                n["_bis"] = erster[n["ton"]] + laenge / SR
    for n in noten:
        f = midi_hz(n["ton"], cent)
        gehalten = stimme in ("sinus_orgel", "flaeche", "drone", "spannung")   # Hüllkurve kommt aus der Stimme
        hoerbar = n["dauer"] if gehalten else n["dauer"] + ausklang
        if abdaempfen and n.get("_bis") is not None:
            hoerbar = min(hoerbar, n["_bis"] - n["t"] + 0.015)
        s = fn(f, n["staerke"], max(0.05, hoerbar), rng)
        if abdaempfen and n.get("_bis") is not None:
            m = min(len(s), sek(0.015))
            s[-m:] *= np.linspace(1, 0, m)
        a = sek(n["t"])
        st = panorama(s, n.get("pan", 0.0))
        e = min(len(buf), a + len(st))
        buf[a:e] += st[: e - a]
    if zyklisch:
        rest = buf[laenge:]
        for k in range(0, len(rest), laenge):
            teil = rest[k:k + laenge]
            buf[: len(teil)] += teil
        buf = buf[:laenge]
    else:
        buf = buf[:laenge]
    if wow:
        buf = leiern(buf, wow[0], wow[1], zyklisch)
    return buf


def leiern(x: np.ndarray, cent: float, rate: float, zyklisch: bool) -> np.ndarray:
    """Zeitvariable Verzögerung -> Tonhöhe schwankt um ± cent (wie eine alte Spieldose)."""
    n = len(x)
    if zyklisch:
        rate = max(1, round(rate * n / SR)) * SR / n
    t = np.arange(n) / SR
    d = (cent / 1200 * np.log(2)) / (2 * np.pi * rate) * np.sin(2 * np.pi * rate * t) * SR
    idx = np.arange(n) - d
    if zyklisch:
        idx = np.mod(idx, n)
        xp = np.arange(n + 1)
        return np.stack([np.interp(idx, xp, np.append(x[:, c], x[0, c])) for c in range(2)], 1)
    return np.stack([np.interp(idx, np.arange(n), x[:, c]) for c in range(2)], 1)


def render_fluidsynth(midi_pfad: Path, laenge: int, zyklisch: bool = True, gain: float = 0.5) -> np.ndarray:
    """MIDI-Datei mit FluidSynth (FluidR3_GM) rendern, ohne dessen Hall/Chorus; Ausklang wie oben umlegen."""
    if not SOUNDFONT.exists():
        raise SystemExit(f"SoundFont fehlt: {SOUNDFONT} (apt-get install fluidsynth fluid-soundfont-gm)")
    with tempfile.TemporaryDirectory() as tmp:
        aus = Path(tmp) / "fs.wav"
        subprocess.run(["fluidsynth", "-ni", "-q", "-R", "0", "-C", "0", "-g", str(gain), "-r", str(SR),
                        "-F", str(aus), str(SOUNDFONT), str(midi_pfad)], check=True, capture_output=True)
        y = lade_wav(aus)
    buf = np.zeros((max(laenge, len(y)), 2))
    buf[: len(y)] = y
    if zyklisch:
        rest = buf[laenge:]
        for k in range(0, len(rest), laenge):
            teil = rest[k:k + laenge]
            buf[: len(teil)] += teil
    return buf[:laenge]


# ---------------------------------------------------------------- Prüfen

def naht_pruefen(x: np.ndarray, innen: int | None = None) -> dict:
    """Prüft die Schleifennaht: Sprung zwischen letztem und erstem Sample im Vergleich zur typischen
    Sample-Differenz (p99), und Pegel 0,5 s nach gegen 0,5 s vor der Naht. Zum Einordnen dieselbe
    Pegel-Differenz an einer inneren Schleifengrenze (innen = Sample): Ist sie ähnlich, ist der
    Pegelsprung an der Naht Musik (Pause vor der Eins), kein Fehler."""
    d_naht = np.abs(x[0] - x[-1]).max()
    d_typ = np.percentile(np.abs(np.diff(x[: sek(5)], axis=0)).max(axis=1), 99)

    def db(a: np.ndarray) -> float:
        return 10 * np.log10(np.mean(a ** 2) + 1e-20)
    erg = {"sprung_rel_p99": round(float(d_naht / (d_typ + 1e-12)), 2),
           "pegel_nach_minus_vor_db": round(float(db(x[: sek(0.5)]) - db(x[-sek(0.5):])), 2)}
    if innen:
        erg["innen_pegel_nach_minus_vor_db"] = round(float(db(x[innen:innen + sek(0.5)]) - db(x[innen - sek(0.5):innen])), 2)
    return erg
