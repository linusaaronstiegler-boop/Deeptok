#!/usr/bin/env python3
"""Spannungsfassung: ein Stil, dessen Varianten nach einer JSON-Liste überblendet werden (dünn ->
normal -> voll -> Wegfall vor der Pointe), auf die Länge einer Folge.

    python engine/musik/spannung.py engine/musik/spannung/hiding-night-teil1.json [--vorhoer]

Liest die trockenen Schichten aus horror/build/musik/schichten/<stil>/ (vorher bauen.py laufen
lassen) und schreibt horror/build/musik/spannung-<name>.wav. Mit --vorhoer zusätzlich eine
Hörprobe mit Stimme und Effekten der Folge (12 LU unter der Stimme) als kleine MP3 nach
engine/musik/proben/. Die aufgelösten Zeitpunkte landen in engine/musik/messwerte/spannung-<name>.json.

JSON (alle Zeiten in Sekunden der Folge):
  stil            spieluhr | wiegenlied | klavier | drone
  folge           Ordner der Folge (für Satz-/Wort-Anker und Länge), z. B. "episoden/folge-01"
  dauer_s         Länge; fehlt sie, gilt mischung.json → laenge_s, sonst timing.json + endkarte_s
  endkarte_s      Std 1.0
  start_in_schleife_s   wo in der 3-min-Schleife die Folge beginnt (Std 0)
  uebergang_s     Std-Überblendung zwischen Stufen (Std 1.5)
  einrasten       "takt" | "schlag" | "aus": Stufenwechsel auf die nächste Takt-Eins bzw. den nächsten
                  Schlag schieben (Std "schlag"). Für "weg" gilt immer "aus" (Wegfall sitzt am Wort).
  stufen          Liste von Punkten. Anker genau einer von: ab_s | ab_satz (Nr. ab 1, Satzbeginn)
                  | ab_wort (Index in timing.json, Wortbeginn); dazu versatz_s (Std 0).
                  stufe: duenn | normal | voll | weg. blende_s überschreibt uebergang_s.
                  grund: freier Text (wird nur mitgeschrieben).
  ausblenden_s    Blende am Ende (Std 0.5)
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import numpy as np

HIER = Path(__file__).resolve().parent
sys.path.insert(0, str(HIER))
import bauen  # noqa: E402
import klang  # noqa: E402

HORROR = HIER.parent.parent
SR = klang.SR


def zeitpunkte_aufloesen(cfg: dict, timing: dict | None, stil: dict) -> list[dict]:
    """Anker -> Sekunden, dann ggf. auf Schlag/Takt einrasten. Gibt sortierte Punkte zurück."""
    spb = 60 / stil["bpm"]
    start = cfg.get("start_in_schleife_s", 0.0)
    raster = {"takt": 4 * spb, "schlag": spb, "aus": None}[cfg.get("einrasten", "schlag")]
    aus = []
    for p in cfg["stufen"]:
        if "ab_s" in p:
            t = float(p["ab_s"])
        elif "ab_satz" in p:
            if not timing:
                raise SystemExit(f"Satz-Anker ohne timing.json: {p}")
            t = timing["saetze"][int(p["ab_satz"]) - 1]["start"]
        elif "ab_wort" in p:
            if not timing:
                raise SystemExit(f"Wort-Anker ohne timing.json: {p}")
            t = timing["woerter"][int(p["ab_wort"])]["start"]
        else:
            raise SystemExit(f"Punkt ohne Anker: {p}")
        t += float(p.get("versatz_s", 0.0))
        roh = t
        r = None if p["stufe"] == "weg" else (None if p.get("einrasten") == "aus" else raster)
        if r and t > 0:
            # auf das nächste Raster der Musik (Schleifenzeit = Folgenzeit + start) schieben
            t = math.ceil((t + start) / r - 1e-6) * r - start
        aus.append({**p, "zeit_s": round(max(0.0, t), 3), "anker_s": round(roh, 3)})
    return sorted(aus, key=lambda p: p["zeit_s"])


def verlaeufe(stil: dict, punkte: list[dict], n: int, std_blende: float) -> dict[str, np.ndarray]:
    """Je Schicht ein linearer Pegelverlauf (Amplitude) aus den Stufenpunkten. Zwischen zwei Stufen
    wird linear in der Amplitude überblendet (die Schichten sind in allen Varianten dasselbe Signal,
    also gilt Gleichspannungs-Überblendung). „weg“ = alle Schichten auf 0."""
    def ziel(stufe: str) -> dict[str, float]:
        if stufe == "weg":
            return {s: 0.0 for s in stil["schichten"]}
        pg = stil["varianten"][stufe]
        return {s: (0.0 if pg.get(s) is None else 10 ** (pg[s] / 20)) for s in stil["schichten"]}

    t = np.arange(n) / SR
    kurven = {s: np.zeros(n) for s in stil["schichten"]}
    aktuell = ziel(punkte[0]["stufe"]) if punkte and punkte[0]["zeit_s"] <= 0 else {s: 0.0 for s in stil["schichten"]}
    for s in kurven:
        kurven[s][:] = aktuell[s]
    for p in punkte:
        z = ziel(p["stufe"])
        b = float(p.get("blende_s", std_blende))
        a = p["zeit_s"]
        w = np.clip((t - a) / max(b, 1e-3), 0, 1)
        for s in kurven:
            # ab a von dem bis dahin gültigen Verlauf zum neuen Ziel gleiten
            vorher = kurven[s].copy()
            kurven[s] = np.where(t < a, vorher, vorher[min(n - 1, int(a * SR))] * (1 - w) + z[s] * w)
    return kurven


def rendern(cfg: dict, name: str) -> tuple[np.ndarray, dict]:
    stil = bauen.stil_laden(cfg["stil"], 2)
    info_bau = json.loads((HORROR / "build" / "musik" / f"{cfg['stil']}.json").read_text())
    timing, laenge = None, cfg.get("dauer_s")
    if cfg.get("folge"):
        ordner = HORROR / cfg["folge"]
        tp = ordner / "timing.json"
        timing = json.loads(tp.read_text()) if tp.exists() else None
        mp = ordner / "mischung.json"
        if laenge is None and mp.exists():
            laenge = json.loads(mp.read_text())["laenge_s"]
        if laenge is None and timing:
            laenge = timing["dauer_s"] + cfg.get("endkarte_s", 1.0)
    if laenge is None:
        raise SystemExit("Länge unbekannt: dauer_s oder folge mit timing.json/mischung.json angeben")
    n = klang.sek(laenge)
    nachlauf = klang.sek(stil["hall"]["rt60"] * 1.3 + 0.5)
    punkte = zeitpunkte_aufloesen(cfg, timing, stil)
    kurven = verlaeufe(stil, punkte, n + nachlauf, cfg.get("uebergang_s", 1.5))
    # Schichten der Schleife ab start_in_schleife_s kacheln (zyklisch gerendert -> nahtlos)
    start = klang.sek(cfg.get("start_in_schleife_s", 0.0))
    schichten = {}
    for s in stil["schichten"]:
        x = klang.lade_wav(HORROR / "build" / "musik" / "schichten" / cfg["stil"] / f"{s}.wav")
        idx = (start + np.arange(n + nachlauf)) % len(x)
        schichten[s] = x[idx]
    # Pegelverlauf in dB an mischen() geben: Verlauf 0 -> sehr leise statt -inf
    pegel = {s: 20 * np.log10(np.maximum(kurven[s], 1e-6)) for s in schichten}
    y = bauen.mischen(stil, schichten, pegel, zyklisch=False)
    y = y[:n] * 10 ** (info_bau["verstaerkung_db"] / 20)
    ab = klang.sek(cfg.get("ausblenden_s", 0.5))
    y[-ab:] *= np.linspace(1, 0, ab)[:, None]
    info = {"name": name, "stil": cfg["stil"], "laenge_s": round(laenge, 3), "punkte": punkte,
            "lufs": round(klang.lufs(y), 2), "spitze_dbfs": round(float(20 * np.log10(np.abs(y).max() + 1e-12)), 2)}
    # Kontrolle: Pegel (Kurzzeit 0,4 s) kurz vor und nach jedem Punkt
    for p in punkte:
        a = klang.sek(p["zeit_s"])
        vor = y[max(0, a - klang.sek(0.6)):a]
        nach = y[a + klang.sek(0.6 + float(p.get("blende_s", cfg.get("uebergang_s", 1.5)))):][:klang.sek(0.6)]
        p["rms_vor_db"] = round(float(10 * np.log10(np.mean(vor ** 2) + 1e-20)), 1) if len(vor) else None
        p["rms_nach_db"] = round(float(10 * np.log10(np.mean(nach ** 2) + 1e-20)), 1) if len(nach) else None
    return y, info


def vorhoer(cfg: dict, musik: np.ndarray, name: str) -> Path | None:
    """Hörprobe: Upload-Mischung der Folge (Stimme + Effekte) plus Spannungsfassung 12 LU darunter."""
    basis_pfad = HORROR / "build" / Path(cfg["folge"]).name / "ton" / "mix-upload.wav"
    stimme_pfad = HORROR / "build" / Path(cfg["folge"]).name / "stimme.wav"
    if not basis_pfad.exists() or not stimme_pfad.exists():
        print("Vorhör übersprungen, fehlt:", basis_pfad if not basis_pfad.exists() else stimme_pfad)
        return None
    basis = klang.lade_wav(basis_pfad)
    m = np.zeros_like(basis)
    k = min(len(m), len(musik))
    m[:k] = musik[:k]
    # Stimme in der Upload-Mischung: gleiche Länge, Lautheit der reinen Stimme × Verstärkung der Mischung
    stimme = klang.lade_wav(stimme_pfad)
    stimme_lufs = klang.lufs(stimme)
    # Bezug wie mischen.py: Bett 12 LU unter der Stimme (Stimme in der Basis ≈ Basis-Lautheit).
    # Die Spannungsfassung trägt die Verstärkung aus bauen.py, „normal“ liegt also bei ZIEL_LUFS;
    # so sitzt die Stufe normal genau 12 LU unter der Stimme, dünn darunter, voll darüber.
    ziel = klang.lufs(basis) - 12.0
    m *= 10 ** ((ziel - bauen.ZIEL_LUFS) / 20)
    y = basis + m
    y *= 10 ** ((-14.0 - klang.lufs(y)) / 20)
    sp = np.abs(y).max()
    if sp > 10 ** (-1.5 / 20):
        y *= 10 ** (-1.5 / 20) / sp
    pfad = HIER / "proben" / f"vorhoer-{name}.mp3"
    klang.schreibe_mp3(pfad, y, kbit=80)
    print("Vorhör:", pfad, pfad.stat().st_size, "Bytes; Stimme allein", round(stimme_lufs, 2), "LUFS")
    return pfad


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("json")
    ap.add_argument("--vorhoer", action="store_true")
    a = ap.parse_args()
    cfg_pfad = Path(a.json)
    cfg = json.loads(cfg_pfad.read_text())
    name = cfg_pfad.stem
    y, info = rendern(cfg, name)
    aus = HORROR / "build" / "musik" / f"spannung-{name}.wav"
    klang.schreibe_wav(aus, y)
    info["datei"] = str(aus.relative_to(HORROR))
    for p in info["punkte"]:
        print(f"  {p['zeit_s']:7.2f} s  {p['stufe']:6s}  (Anker {p['anker_s']:.2f} s)  {p.get('rms_vor_db')} -> {p.get('rms_nach_db')} dB  {p.get('grund', '')}")
    print(f"{aus}  {info['lufs']} LUFS  Spitze {info['spitze_dbfs']} dBFS")
    if a.vorhoer and cfg.get("folge"):
        p = vorhoer(cfg, y, name)
        info["vorhoer"] = str(p.relative_to(HORROR)) if p else None
    (HIER / "messwerte" / f"spannung-{name}.json").write_text(json.dumps(info, ensure_ascii=False, indent=1))
