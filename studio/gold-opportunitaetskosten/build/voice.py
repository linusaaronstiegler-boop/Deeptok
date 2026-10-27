"""Stimme des Goldstandards: Skript -> assets/voice.m4a + assets/timing.json (Wortzeiten, Cues).

    python build/voice.py                         # heute: Piper thorsten-high als PLATZHALTER
    python build/voice.py --anbieter elevenlabs   # später: Casting-Sieger über factory/werk/stimme
    python build/voice.py --nur-pruefen           # nur den Whisper-Abgleich der Cues neu messen

Der Tausch der Stimme ist EINE Zeile: --anbieter. Alles danach (Pausen, Lautheit, Wortzeiten,
Cues, Whisper-Prüfung) ist für jeden Anbieter gleich. Jeder Anbieter liefert dasselbe:
    synthese(text, stimme, vorher, nachher) -> Ergebnis(audio, format, abtastrate, wortzeiten, ...)
Für Piper steht der Adapter hier unten (PiperAdapter), für die anderen in factory/werk/stimme/.

Ablauf:
  1. Text bauen: Szenen als Absätze, Betonungen als *wort*, steigende Fragen als ?↑ (§4).
  2. Blöcke: Das Skript wird nur an DEKLARIERTEN Pausen geteilt (pause_s = Denkpause nach der
     Frage). Jeder Block geht in einem Stück an die Stimme, mit dem Nachbartext als Kontext.
     Alle anderen Pausen macht die Stimme selbst.
  3. Zusammensetzen: Vorlauf, Block 1, Denkpause (genau pause_s), Block 2, Halten (hold_s).
  4. Mastering: 80-Hz-Hochpass, De-Esser, Kompression 2:1, Lautheit -16 LUFS, Spitze -1 dBTP.
  5. timing.json: Szenen, Sätze, Wörter mit Zeiten, dazu jeder Cue aus script.py ("cues").
  6. Prüfung: faster-whisper hört die fertige Tonspur unabhängig ab. Für jedes Cue-Wort wird
     gemessen, wie weit die Zeit in timing.json von der gehörten Zeit abweicht (Ziel <= 150 ms).

Wortzeiten: Liefert der Anbieter welche (ElevenLabs), gelten die. Piper liefert keine. Dann
verteilt der Adapter jeden Satz nach Lauten: Die Satzgrenzen sind exakt (jeder Satz ist ein
eigenes Stück Audio), innerhalb des Satzes bekommt jedes Wort Zeit nach der Zahl seiner Laute
(espeak-Phoneme). Whisper prüft das danach unabhängig nach.
"""
from __future__ import annotations

import argparse
import io
import json
import os
import re
import subprocess
import sys
import wave
from difflib import SequenceMatcher
from pathlib import Path

import numpy as np

HIER = Path(__file__).resolve().parent
PROJEKT = HIER.parent
REPO = PROJEKT.parents[1]
ASSETS = PROJEKT / "assets"
CACHE = HIER / "cache"

sys.path.insert(0, str(HIER))
sys.path.insert(0, str(REPO / "factory"))
from script import SCENES, finde_wort, tokens  # noqa: E402

RATE = 44100          # Arbeits- und Ausgabe-Abtastrate (G4: >= 44,1 kHz)
LEAD_IN = 0.35        # Stille vor dem ersten Wort (Bild 0 ist schon das Hook-Bild)
STILLE_DB = -45.0     # darunter gilt ein 10-ms-Fenster als Stille (Ränder der Blöcke kappen)
RAND_S = 0.03         # so viel Stille bleibt beim Kappen an jedem Blockrand stehen


# ------------------------------------------------------------------------------------------
# 1. Text: Szenen mit Markup
# ------------------------------------------------------------------------------------------

def szenen_text(szene: dict) -> str:
    """Eine Szene als Absatz: Sätze mit Leerzeichen, *betonte* Wörter, ?↑ bei steigender Frage.

    Betonungen stehen in script.py als Wort mit optionalem "#n" (n-tes Vorkommen). finde_wort
    liefert den Index in der ganzen Szene; genau dieses Token bekommt die Sternchen.
    """
    betont = {finde_wort(szene, w) for w in szene.get("betont", [])}
    saetze, index = [], 0
    for satz in szene["sentences"]:
        teile = []
        for roh in satz.split():
            if index in betont:
                # Satzzeichen bleiben außerhalb der Sternchen: "*behalten*?" statt "*behalten?*"
                kern, zeichen = re.fullmatch(r"(.*?)([.,:;?!…]*)", roh).groups()
                roh = f"*{kern}*{zeichen}"
            teile.append(roh)
            index += 1
        text = " ".join(teile)
        if any(satz.startswith(f) for f in szene.get("steigt", [])):
            text = text.replace("?", "?↑", 1)
        saetze.append(text)
    return " ".join(saetze)


def bloecke() -> list[dict]:
    """Teilt das Skript an deklarierten Pausen. Ein Block = Szenen bis einschließlich pause_s."""
    liste, aktuell = [], []
    for szene in SCENES:
        aktuell.append(szene)
        if szene.get("pause_s"):
            liste.append(aktuell)
            aktuell = []
    if aktuell:
        liste.append(aktuell)
    return [{"szenen": b, "text": "\n\n".join(szenen_text(s) for s in b)} for b in liste]


# ------------------------------------------------------------------------------------------
# 2. Anbieter. Piper hier, alle anderen über factory/werk/stimme (gleiche Schnittstelle).
# ------------------------------------------------------------------------------------------

class PiperAdapter:
    """Platzhalter-Stimme mit der Schnittstelle der Fabrik-Adapter: synthese(text, stimme)."""

    def __init__(self):
        self._stimme = None

    def _lade(self, stimme: dict):
        if self._stimme is None:
            from piper import PiperVoice
            pfad = os.environ.get("PIPER_VOICE_MODEL") or os.path.expanduser(stimme["modell"])
            # Mit dem Paket "onnx" kann Piper sagen, wie viele Samples jeder Laut bekommt
            # (piper-tts[alignment]). Das sind exakte Wortzeiten aus der Stimme selbst, wie bei
            # ElevenLabs. Ohne onnx bleibt die Schätzung nach Lauten (verteile_nach_lauten).
            try:
                import onnx  # noqa: F401
                self.exakt = True
            except ImportError:
                self.exakt = False
                print("Hinweis: Paket 'onnx' fehlt, Wortzeiten nur geschätzt (pip install onnx)")
            self._stimme = PiperVoice.load(pfad, include_alignments=self.exakt)
        return self._stimme

    def synthese(self, text: str, stimme: dict, vorher=None, nachher=None):
        from piper import SynthesisConfig
        from werk.stimme.basis import Ergebnis, betone_nicht, sprechfassung, uebersetze

        voice = self._lade(stimme)
        cfg = SynthesisConfig(length_scale=stimme["length_scale"], noise_scale=stimme["noise_scale"],
                              noise_w_scale=stimme["noise_w_scale"])
        rate = voice.config.sample_rate
        # Piper kann nicht betonen: Sternchen fallen weg, "?↑" wird "?". vorher/nachher
        # (Kontext für die Satzmelodie) versteht Piper nicht; die Parameter gibt es nur,
        # damit alle Anbieter gleich aufgerufen werden.
        gesprochen = uebersetze(sprechfassung(text, stimme), betont=betone_nicht,
                                pause=lambda _n, _v: ",")
        stuecke, wortzeiten, t = [], [], 0.0
        for a, absatz in enumerate(gesprochen.split("\n\n")):
            if a > 0:
                stuecke.append(np.zeros(int(stimme["absatzpause_s"] * rate), np.float32))
                t += stimme["absatzpause_s"]
            for s, satz in enumerate(re.split(r"(?<=[.!?…])\s+", absatz.strip())):
                if s > 0:
                    stuecke.append(np.zeros(int(stimme["satzpause_s"] * rate), np.float32))
                    t += stimme["satzpause_s"]
                chunks = list(voice.synthesize(satz, syn_config=cfg, include_alignments=self.exakt))
                audio = np.concatenate([c.audio_float_array for c in chunks]).astype(np.float32)
                exakt = woerter_aus_alignment(satz, chunks, rate, t) if self.exakt else None
                if exakt is None:
                    laute = " ".join("".join(c.phonemes) for c in chunks)
                    exakt = verteile_nach_lauten(satz, laute, audio, rate, t)
                wortzeiten += exakt
                stuecke.append(audio)
                t += len(audio) / rate
        puffer = io.BytesIO()
        with wave.open(puffer, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(rate)
            w.writeframes((np.clip(np.concatenate(stuecke), -1, 1) * 32767).astype("<i2").tobytes())
        return Ergebnis(audio=puffer.getvalue(), format="wav", abtastrate=rate, wortzeiten=wortzeiten,
                        zeichen=len(gesprochen), anbieter="piper", gesendet=gesprochen)


def sprechgrenzen(audio: np.ndarray, rate: int) -> tuple[float, float]:
    """Anfang und Ende der Sprache in einem Stück Audio (10-ms-Fenster über STILLE_DB)."""
    fenster = max(1, rate // 100)
    n = len(audio) // fenster
    if n == 0:
        return 0.0, len(audio) / rate
    rms = np.sqrt(np.mean(audio[: n * fenster].reshape(n, fenster) ** 2, axis=1) + 1e-12)
    laut = np.nonzero(20 * np.log10(rms) > STILLE_DB)[0]
    if len(laut) == 0:
        return 0.0, len(audio) / rate
    return laut[0] * fenster / rate, (laut[-1] + 1) * fenster / rate


def woerter_aus_alignment(satz: str, chunks: list, rate: int, t0: float) -> list[dict] | None:
    """Exakte Wortzeiten aus Pipers Laut-Alignment: Jeder Laut hat eine Zahl von Samples.

    Die Laute eines Satzes sehen so aus: ^ f ɛ ɾ k ˈ a ʊ f ə n ␠ b r ˈ ɪ ŋ t ␠ ... . $
    "␠" trennt Wörter. Ein Wort beginnt mit seinem ersten echten Laut (Betonungszeichen ˈ ˌ
    und der Wortabstand selbst haben auch Samples, gehören aber nicht zum hörbaren Anfang).
    """
    woerter = satz.split()
    gruppen, t = [], t0
    for c in chunks:
        if not c.phoneme_alignments:
            return None
        aktuell = None
        for a in c.phoneme_alignments:
            dauer = a.num_samples / rate
            if a.phoneme == " " or a.phoneme in "^$_":
                aktuell = None
            elif a.phoneme in ".,:;?!…":
                aktuell = None          # Pause nach dem Wort, zählt nicht mehr zum Wort
            elif a.phoneme not in "ˈˌ" or aktuell is not None:
                if aktuell is None:
                    aktuell = {"start": t, "ende": t + dauer}
                    gruppen.append(aktuell)
                aktuell["ende"] = t + dauer
            t += dauer
    if len(gruppen) != len(woerter):
        return None
    return [{"wort": w, "start": round(g["start"], 3), "ende": round(g["ende"], 3)}
            for w, g in zip(woerter, gruppen)]


# Gewicht eines Lauts: Langvokale (ː) dauern länger, Betonungszeichen sind keine Laute.
# Satzzeichen im Satzinneren (",", ":") sind kurze Pausen: Sie zählen zum Abstand NACH dem Wort.
_PAUSEN_LAUTE = {",": 3.0, ":": 3.5, ";": 3.5}


def verteile_nach_lauten(satz: str, laute: str, audio: np.ndarray, rate: int, t0: float) -> list[dict]:
    """Wortzeiten eines Satzes aus der Zahl der Laute je Wort (Piper liefert keine Zeiten)."""
    woerter = satz.split()
    gruppen = laute.split()
    anfang, ende = sprechgrenzen(audio, rate)
    if len(gruppen) == len(woerter):
        gewichte, pausen = [], []
        for g in gruppen:
            kern = g.rstrip(".,:;?!…")
            gewichte.append(sum(0.6 if z == "ː" else 1.0 for z in kern if z not in "ˈˌ") or 1.0)
            pausen.append(sum(_PAUSEN_LAUTE.get(z, 0.0) for z in g[len(kern):]))
        pausen[-1] = 0.0          # das Satzende ist schon durch "ende" erfasst
    else:
        # Rückfall: espeak hat Wörter anders getrennt als das Skript. Dann nach Buchstaben.
        gewichte = [len(w.strip(".,:;?!…")) + 2.0 for w in woerter]
        pausen = [0.0] * len(woerter)
    gesamt = sum(gewichte) + sum(pausen)
    sek = (ende - anfang) / gesamt
    t, liste = anfang, []
    for wort, g, p in zip(woerter, gewichte, pausen):
        liste.append({"wort": wort, "start": round(t0 + t, 3), "ende": round(t0 + t + g * sek, 3)})
        t += (g + p) * sek
    return liste


def lade_anbieter(name: str, stimme_pfad: str | None):
    """(adapter, stimme): Piper aus diesem Ordner, alle anderen aus voices/<name>.json."""
    if name == "piper":
        pfad = Path(stimme_pfad) if stimme_pfad else HIER / "stimme-piper.json"
        return PiperAdapter(), json.loads(pfad.read_text())
    from werk import stimme as fabrik_stimme
    s = fabrik_stimme.lade_stimme(name, Path(stimme_pfad).parent if stimme_pfad else None)
    return fabrik_stimme, s


# ------------------------------------------------------------------------------------------
# 3. Audio: dekodieren, kappen, zusammensetzen, mastern
# ------------------------------------------------------------------------------------------

def ffmpeg(*args, eingabe: bytes | None = None) -> subprocess.CompletedProcess:
    r = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-nostats", *args], input=eingabe,
                       capture_output=True)
    if r.returncode != 0:
        raise RuntimeError("ffmpeg: " + r.stderr.decode(errors="replace")[-800:])
    return r


def dekodiere(audio: bytes) -> np.ndarray:
    """Beliebiges Format (wav, mp3) -> float32 mono mit RATE Hz."""
    r = ffmpeg("-v", "error", "-i", "pipe:0", "-f", "f32le", "-acodec", "pcm_f32le", "-ac", "1",
               "-ar", str(RATE), "pipe:1", eingabe=audio)
    return np.frombuffer(r.stdout, dtype=np.float32).copy()


def kappe(audio: np.ndarray, wortzeiten: list[dict]) -> tuple[np.ndarray, list[dict]]:
    """Schneidet Stille an den Blockrändern weg, damit die deklarierten Pausen exakt stimmen.

    Ohne das hinge an jeder Pause noch die Ausklang-Stille der Stimme dran (bei Piper ca.
    0,1 s, bei anderen mehr), und die Denkpause wäre nicht 2,5 s, sondern zufällig länger.
    """
    anfang, ende = sprechgrenzen(audio, RATE)
    a = max(0.0, anfang - RAND_S)
    e = min(len(audio) / RATE, ende + RAND_S)
    verschoben = [{**w, "start": round(w["start"] - a, 3), "ende": round(w["ende"] - a, 3)}
                  for w in wortzeiten]
    return audio[int(a * RATE): int(e * RATE)], verschoben


def mastere(roh: Path, ziel_wav: Path, ziel_m4a: Path) -> dict:
    """Mastering nach VIDEO-PIPELINE §3, Lautheit in zwei Durchgängen (erst messen, dann setzen).

    Keiner dieser Filter verschiebt die Zeit: Die Wortzeiten bleiben gültig (geprüft: Länge
    vorher = Länge nachher, siehe Ausgabe).
    """
    kette = "highpass=f=80,deesser=i=0.4,acompressor=ratio=2:threshold=-20dB:attack=8:release=120"
    r = ffmpeg("-i", str(roh), "-af", kette + ",loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json",
               "-f", "null", "-")
    mess = json.loads(re.findall(r"\{[^{}]*\}", r.stderr.decode())[-1])
    norm = (f"loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={mess['input_i']}:measured_TP={mess['input_tp']}"
            f":measured_LRA={mess['input_lra']}:measured_thresh={mess['input_thresh']}"
            f":offset={mess['target_offset']}:linear=true")
    ffmpeg("-y", "-i", str(roh), "-af", f"{kette},{norm}", "-ar", str(RATE), "-ac", "1",
           "-c:a", "pcm_s16le", str(ziel_wav))
    ffmpeg("-y", "-i", str(ziel_wav), "-c:a", "aac", "-b:a", "128k", "-ar", str(RATE), str(ziel_m4a))
    r = ffmpeg("-i", str(ziel_wav), "-af", "ebur128=peak=true", "-f", "null", "-")
    text = r.stderr.decode()
    lufs = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", text)[-1])
    spitze = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", text)[-1])
    return {"lufs": lufs, "true_peak_db": spitze}


# ------------------------------------------------------------------------------------------
# 4. Wortzeiten den Skript-Wörtern zuordnen, timing.json schreiben
# ------------------------------------------------------------------------------------------

def norm(wort: str) -> str:
    return re.sub(r"[^\w]", "", wort.casefold())


def ordne_zu(skript_woerter: list[tuple[str, str]], gehoert: list[dict]) -> list[dict | None]:
    """Ordnet Anbieter-Wörter den Skript-Tokens zu (gleiche Zahl: nach Position, sonst difflib)."""
    if len(gehoert) == len(skript_woerter):
        return list(gehoert)
    zuordnung: list[dict | None] = [None] * len(skript_woerter)
    a = [norm(g) for _, g in skript_woerter]
    b = [norm(w["wort"]) for w in gehoert]
    for blk in SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            zuordnung[blk.a + k] = gehoert[blk.b + k]
    return zuordnung


def fuelle_luecken(zeiten: list[dict | None]) -> list[dict]:
    """Nicht zugeordnete Wörter bekommen eine Zeit zwischen ihren Nachbarn (gleichmäßig)."""
    n = len(zeiten)
    i = 0
    while i < n:
        if zeiten[i] is not None:
            i += 1
            continue
        j = i
        while j < n and zeiten[j] is None:
            j += 1
        von = zeiten[i - 1]["ende"] if i > 0 else (zeiten[j]["start"] - 0.3 * (j - i))
        bis = zeiten[j]["start"] if j < n else von + 0.4 * (j - i)
        schritt = (bis - von) / (j - i)
        for k in range(i, j):
            zeiten[k] = {"wort": "?", "start": round(von + (k - i) * schritt, 3),
                         "ende": round(von + (k - i + 1) * schritt, 3), "geschaetzt": True}
        i = j
    return zeiten


def baue_timing(teile: list[dict], dauer: float, anbieter: str, stimme: dict) -> dict:
    """teile: je Szene die Wortzeiten (absolut) in Skript-Reihenfolge."""
    timing = {"anbieter": anbieter, "stimme": stimme.get("modell") or stimme.get("stimm_id"),
              "platzhalter": anbieter == "piper", "lead_in": LEAD_IN, "duration": round(dauer, 3),
              "scenes": [], "pausen": [], "cues": {}}
    for szene, zeiten in teile:
        sc = {"id": szene["id"], "beat": szene.get("beat"), "sentences": []}
        i = 0
        for satz in szene["sentences"]:
            paare = tokens(satz)
            woerter = []
            for anzeige, gesprochen in paare:
                z = zeiten[i]
                woerter.append({"text": anzeige, "spoken": gesprochen, "start": z["start"],
                                "end": z["ende"], **({"geschaetzt": True} if z.get("geschaetzt") else {})})
                i += 1
            sc["sentences"].append({"text": " ".join(a for a, _ in paare), "start": woerter[0]["start"],
                                    "end": woerter[-1]["end"], "words": woerter})
        sc["start"] = sc["sentences"][0]["start"]
        sc["end"] = sc["sentences"][-1]["end"]
        alle = [w for s in sc["sentences"] for w in s["words"]]
        for name, wort in szene.get("cues", {}).items():
            w = alle[finde_wort(szene, wort)]
            timing["cues"][name] = {"szene": szene["id"], "wort": wort, "start": w["start"], "end": w["end"]}
        if szene.get("pause_s"):
            timing["pausen"].append({"art": "denkpause", "nach": szene["id"], "start": sc["end"],
                                     "end": round(sc["end"] + szene["pause_s"], 3)})
        if szene.get("hold_s"):
            timing["pausen"].append({"art": "halten", "nach": szene["id"], "start": sc["end"],
                                     "end": round(sc["end"] + szene["hold_s"], 3)})
        timing["scenes"].append(sc)
    return timing


# ------------------------------------------------------------------------------------------
# 5. Prüfung mit Whisper: Wie weit liegt jedes Cue-Wort neben der gehörten Zeit?
# ------------------------------------------------------------------------------------------

def pruefe_cues(timing: dict, audio_pfad: Path) -> dict:
    """faster-whisper (small, de) hört die Tonspur unabhängig ab und liefert Wortanfänge.

    Zuordnung über die Wortfolge (difflib), nicht über die Zeit, sonst würde die Prüfung
    sich selbst bestätigen. Verglichen wird der Wortanfang: Auf ihn landet jedes Bild.
    """
    from werk import hoercheck
    _, gehoert = hoercheck.transkribiere(hoercheck.dekodiere(audio_pfad), modell="small", sprache="de")
    skript = [(w, s["id"]) for s in timing["scenes"] for satz in s["sentences"] for w in satz["words"]]

    def schluessel(text: str) -> str:
        return hoercheck.normalisiere(text).replace(" ", "")

    a = [schluessel(w["text"]) for w, _ in skript]
    a2 = [schluessel(w["spoken"]) for w, _ in skript]
    b = [schluessel(w["wort"]) for w in gehoert]
    # Anzeige ("Barcelona") oder Aussprache ("Barsselona") gilt, je nachdem was Whisper schrieb.
    a = [x if x in b else y for x, y in zip(a, a2)]
    paare = {}
    for blk in SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            paare[blk.a + k] = gehoert[blk.b + k]
    # Bekannte Stille: Vorlauf und deklarierte Pausen. Legt Whisper einen Wortanfang dort
    # hinein, ist das nachweislich ein Fehler von Whisper (dort ist kein Ton).
    stillen = [(0.0, timing["lead_in"])] + [(p["start"] + 0.05, p["end"]) for p in timing["pausen"]]
    roh, liste = [], {}
    for name, cue in timing["cues"].items():
        # Das Cue-Wort im Skript wiederfinden (gleiche Szene, gleiche Startzeit)
        i = next(i for i, (w, sid) in enumerate(skript) if sid == cue["szene"] and w["start"] == cue["start"])
        eintrag = {"wort": cue["wort"], "timing_s": cue["start"], "whisper_s": None, "ms": None}
        if i in paare:
            ws = paare[i]["start"]
            eintrag.update(whisper_s=ws, ms=round((ws - cue["start"]) * 1000))
            eintrag["whisper_in_stille"] = any(a <= ws < b for a, b in stillen)
            roh.append(eintrag["ms"])
        liste[name] = eintrag
    # Whisper setzt Wortanfänge systematisch früher (DTW über die Aufmerksamkeit). Der Median
    # dieser Verschiebung ist der Versatz von Whisper selbst, nicht der Stimme; die Streuung
    # um ihn herum ist das, was die Prüfung wissen will.
    versatz = int(np.median(roh)) if roh else 0
    bereinigt = {n: v["ms"] - versatz for n, v in liste.items() if v["ms"] is not None}
    return {"modell": "faster-whisper small (de), word_timestamps", "quelle": timing.get("wortzeiten_quelle"),
            "cues_gefunden": len(roh), "cues_gesamt": len(timing["cues"]),
            "max_ms": max(map(abs, roh)) if roh else None,
            "median_abs_ms": int(np.median(np.abs(roh))) if roh else None,
            "whisper_versatz_ms": versatz,
            "max_bereinigt_ms": max(map(abs, bereinigt.values())) if bereinigt else None,
            "ueber_150ms": sorted(n for n, v in liste.items() if v["ms"] is not None and abs(v["ms"]) > 150),
            "ueber_150ms_bereinigt": sorted(n for n, d in bereinigt.items() if abs(d) > 150),
            "whisper_in_stille": sorted(n for n, v in liste.items() if v.get("whisper_in_stille")),
            "cues": liste}


# ------------------------------------------------------------------------------------------
# Hauptprogramm
# ------------------------------------------------------------------------------------------

def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--anbieter", default="piper", help="piper (Platzhalter) oder ein Fabrik-Anbieter")
    ap.add_argument("--stimme", help="Pfad zur Stimm-Datei (Standard: build/stimme-piper.json bzw. voices/)")
    ap.add_argument("--nur-pruefen", action="store_true", help="nur den Whisper-Abgleich neu messen")
    args = ap.parse_args()

    ASSETS.mkdir(exist_ok=True)
    CACHE.mkdir(exist_ok=True)
    timing_pfad = ASSETS / "timing.json"
    if args.nur_pruefen:
        timing = json.loads(timing_pfad.read_text())
        timing["pruefung"] = pruefe_cues(timing, ASSETS / "voice.wav")
        timing_pfad.write_text(json.dumps(timing, ensure_ascii=False, indent=1))
        zeige_pruefung(timing["pruefung"])
        return

    adapter, stimme = lade_anbieter(args.anbieter, args.stimme)
    teile_audio = [np.zeros(int(LEAD_IN * RATE), np.float32)]
    t = LEAD_IN
    szenen_zeiten = []
    bl = bloecke()
    for k, block in enumerate(bl):
        vorher = bl[k - 1]["text"] if k > 0 else None
        nachher = bl[k + 1]["text"] if k + 1 < len(bl) else None
        ergebnis = adapter.synthese(block["text"], stimme, vorher=vorher, nachher=nachher)
        audio = dekodiere(ergebnis.audio)
        wortzeiten = ergebnis.wortzeiten
        if wortzeiten is None:
            raise SystemExit("Anbieter liefert keine Wortzeiten: hier Whisper-Alignment ergänzen")
        audio, wortzeiten = kappe(audio, wortzeiten)
        skript = [p for s in block["szenen"] for satz in s["sentences"] for p in tokens(satz)]
        zeiten = fuelle_luecken(ordne_zu(skript, wortzeiten))
        zeiten = [{**z, "start": round(z["start"] + t, 3), "ende": round(z["ende"] + t, 3)} for z in zeiten]
        i = 0
        for s in block["szenen"]:
            n = sum(len(tokens(satz)) for satz in s["sentences"])
            szenen_zeiten.append((s, zeiten[i:i + n]))
            i += n
        teile_audio.append(audio)
        t += len(audio) / RATE
        # Deklarierte Pausen: nur aus dem Skript (pause_s nach der Frage, hold_s am Ende).
        letzte = block["szenen"][-1]
        pause = letzte.get("pause_s", 0) + letzte.get("hold_s", 0)
        if pause:
            teile_audio.append(np.zeros(int(round(pause * RATE)), np.float32))
            t += pause
        print(f"Block {k + 1}: {len(skript)} Wörter, {len(audio) / RATE:.2f} s Sprache, {ergebnis.zeichen} Zeichen")
    # hold_s steht an der letzten Szene; liegt sie nicht am Blockende, fehlt hier nichts,
    # denn der letzte Block endet immer mit der letzten Szene.
    roh = CACHE / "voice-roh.wav"
    pcm = (np.clip(np.concatenate(teile_audio), -1, 1) * 32767).astype("<i2")
    with wave.open(str(roh), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(pcm.tobytes())
    dauer = len(pcm) / RATE
    mess = mastere(roh, ASSETS / "voice.wav", ASSETS / "voice.m4a")
    with wave.open(str(ASSETS / "voice.wav")) as w:
        dauer_nach = w.getnframes() / w.getframerate()
    print(f"Mastering: {mess['lufs']:.1f} LUFS, Spitze {mess['true_peak_db']:.1f} dBFS, "
          f"Länge {dauer:.3f} s -> {dauer_nach:.3f} s")

    timing = baue_timing(szenen_zeiten, dauer, args.anbieter, stimme)
    timing["mastering"] = mess
    if args.anbieter == "piper":
        timing["wortzeiten_quelle"] = "piper-alignment" if adapter.exakt else "geschaetzt-nach-lauten"
    else:
        timing["wortzeiten_quelle"] = args.anbieter
    woerter = sum(len(s["words"]) for sc in timing["scenes"] for s in sc["sentences"])
    sprechzeit = dauer - LEAD_IN - sum(p["end"] - p["start"] for p in timing["pausen"])
    timing["woerter"] = woerter
    timing["woerter_pro_s"] = round(woerter / sprechzeit, 2)
    timing["pruefung"] = pruefe_cues(timing, ASSETS / "voice.wav")
    timing_pfad.write_text(json.dumps(timing, ensure_ascii=False, indent=1))

    for sc in timing["scenes"]:
        print(f"{sc['id']:14s} {sc['start']:6.2f} -> {sc['end']:6.2f}")
    print(f"gesamt {dauer:.2f} s, {woerter} Wörter, {timing['woerter_pro_s']} Wörter/s (ohne Pausen)")
    zeige_pruefung(timing["pruefung"])


def zeige_pruefung(p: dict) -> None:
    print(f"Cue-Abweichung (Whisper): {p['cues_gefunden']}/{p['cues_gesamt']} Cues gehört, "
          f"max {p['max_ms']} ms, Median |d| {p['median_abs_ms']} ms; über 150 ms: {p['ueber_150ms'] or 'keine'}")
    print(f"  Whisper-Versatz (Median) {p['whisper_versatz_ms']} ms; bereinigt max {p['max_bereinigt_ms']} ms, "
          f"über 150 ms: {p['ueber_150ms_bereinigt'] or 'keine'}; Whisper-Anfang in Stille: {p['whisper_in_stille'] or 'keiner'}")
    for name, v in p["cues"].items():
        print(f"  {name:16s} {v['wort']:22s} {v['timing_s']:7.2f}  {v['ms'] if v['ms'] is not None else '-':>5}")


if __name__ == "__main__":
    main()
