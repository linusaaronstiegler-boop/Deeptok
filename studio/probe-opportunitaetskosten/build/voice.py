"""Vertont das Skript satzweise mit Piper und schreibt exakte Zeitmarken.

Warum satzweise: Piper liefert keine Wortzeiten. Wird jeder Satz einzeln erzeugt,
kennen wir Anfang und Ende jedes Satzes aufs Sample genau. Innerhalb eines Satzes
werden die Wörter nach der Länge ihrer gesprochenen Form verteilt; das reicht für
Karaoke-Untertitel, ohne eine Spracherkennung nachzuschalten.

Ausgabe: assets/voice.wav, assets/voice.m4a, assets/timing.json
"""
import json
import os
import subprocess
import sys
import wave
from pathlib import Path

from piper import PiperVoice, SynthesisConfig

sys.path.insert(0, str(Path(__file__).parent))
from script import SCENES  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
VOICE_MODEL = os.environ.get("PIPER_VOICE_MODEL", str(Path.home() / ".piper" / "de_DE-thorsten-high.onnx"))
GAP_SENTENCE = 0.22   # Atempause zwischen Sätzen einer Szene
GAP_SCENE = 0.40      # Pause beim Szenenwechsel
LEAD_IN = 0.35        # Stille vor dem ersten Wort (Bild 0 ist schon das Hook-Bild)


def split_tokens(sentence):
    """'344|Dreihundertvierundvierzig Tore' -> [('344', 'Dreihundertvierundvierzig'), ('Tore', 'Tore')]"""
    pairs = []
    for tok in sentence.split():
        shown, _, spoken = tok.partition("|")
        spoken = spoken or shown
        # Satzzeichen hinter dem gesprochenen Teil gehören auch an die Anzeige.
        trail = ""
        while spoken and spoken[-1] in ".,:;?!" and not shown.endswith(spoken[-1]):
            trail = spoken[-1] + trail
            spoken = spoken[:-1]
        pairs.append((shown + trail, spoken + trail))
    return pairs


def main():
    ASSETS.mkdir(exist_ok=True)
    voice = PiperVoice.load(VOICE_MODEL)
    cfg = SynthesisConfig(length_scale=0.9, noise_scale=0.6, noise_w_scale=0.8)
    rate = voice.config.sample_rate

    pcm = bytearray()
    t = 0.0

    def add_silence(sec):
        nonlocal t
        pcm.extend(b"\x00\x00" * int(round(sec * rate)))
        t += sec

    timing = {"scenes": []}
    add_silence(LEAD_IN)
    tmp = ASSETS / "_satz.wav"
    for si, scene in enumerate(SCENES):
        if si > 0:
            add_silence(GAP_SCENE)
        sc = {"id": scene["id"], "start": round(t, 3), "sentences": []}
        for i, sentence in enumerate(scene["sentences"]):
            if i > 0:
                add_silence(GAP_SENTENCE)
            pairs = split_tokens(sentence)
            spoken = " ".join(sp for _, sp in pairs)
            with wave.open(str(tmp), "wb") as w:
                voice.synthesize_wav(spoken, w, syn_config=cfg)
            with wave.open(str(tmp)) as w:
                frames = w.readframes(w.getnframes())
            dur = len(frames) / 2 / rate
            start = t
            pcm.extend(frames)
            t += dur
            # Wörter proportional zur Länge der gesprochenen Form verteilen.
            # Piper lässt am Satzende ~0,15 s ausklingen; das zählt nicht zum letzten Wort.
            speech = max(dur - 0.15, 0.3)
            weights = [len(sp.strip(".,:;?!")) + 2 for _, sp in pairs]
            total = sum(weights)
            words, cursor = [], start
            for (shown, _), wgt in zip(pairs, weights):
                d = speech * wgt / total
                words.append({"text": shown, "start": round(cursor, 3), "end": round(cursor + d, 3)})
                cursor += d
            sc["sentences"].append({"text": " ".join(s for s, _ in pairs), "start": round(start, 3),
                                    "end": round(t, 3), "words": words})
        if scene.get("pause_after"):
            add_silence(scene["pause_after"])
        if scene.get("hold_after"):
            add_silence(scene["hold_after"])
        sc["end"] = round(t, 3)
        timing["scenes"].append(sc)
    tmp.unlink(missing_ok=True)

    timing["duration"] = round(t, 3)
    wav = ASSETS / "voice.wav"
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(bytes(pcm))
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-ac", "1", "-c:a", "aac",
                    "-b:a", "96k", str(ASSETS / "voice.m4a")], check=True)
    (ASSETS / "timing.json").write_text(json.dumps(timing, ensure_ascii=False, indent=1))
    for sc in timing["scenes"]:
        print(f'{sc["id"]:8s} {sc["start"]:6.2f} → {sc["end"]:6.2f}  ({sc["end"] - sc["start"]:.1f} s)')
    print("gesamt", timing["duration"], "s")


if __name__ == "__main__":
    main()
