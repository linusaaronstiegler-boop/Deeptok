"""Stimme des Goldstandards: Skript -> assets/voice.m4a + assets/timing.json (Wortzeiten, Cues).

    python build/voice.py                         # heute: Piper thorsten-high als PLATZHALTER
    python build/voice.py --anbieter elevenlabs   # später: Casting-Sieger über factory/werk/stimme
    python build/voice.py --nur-pruefen           # nur den Whisper-Abgleich der Cues neu messen
                                                  # (dekodiert assets/voice.m4a, braucht keine WAV)
    python build/voice.py --nur-cues              # nur die Cues aus script.py neu zuordnen (gleiche
                                                  # Tonspur, gleiche Wortzeiten; neuer Cue ohne Neuvertonung)
    python build/voice.py --anbieter datei        # fertige Block-Aufnahmen aus build/stimme-jonas.json
                                                  # (ElevenLabs über den claude.ai-Connector, 28.10.)

Anbieter "datei" (Fassung v2): Der Connector liefert pro Aufruf eine mp3 ohne Zeitstempel. Die
gewählte Variante je Block steht in build/stimme-jonas.json (Flow, generation_id, Datei im
gitignorten build/cache/elevenlabs/). Wortzeiten: Piper spricht denselben Block mit exakten
Laut-Zeiten, DTW richtet beide Aufnahmen aneinander aus (dtw_wortzeiten), danach werden Wortanfänge
nach Pausen an die Lautstärke-Hüllkurve gesetzt (an_energie_ausrichten). Whisper lag dafür zu weit
daneben (siehe dtw_wortzeiten). Hat ein Block keine Datei (Aufruf fehlgeschlagen), spricht ihn
Piper; jeder Block wird vorher auf dieselbe Lautheit gebracht, damit der Wechsel nicht auch noch
laut/leise springt. Spricht mehr als eine Stimme, gilt die Tonspur als NICHT bewertbar
(timing.json: "bewertbar"), denn die Brüder sollen eine Stimme beurteilen, keine Mischung.

Fassung v2.1: "luft" aus script.py setzt Stille mitten in einen Block (luft_einfuegen), und drei
Prüfungen kamen dazu: Bitrate und Größe der m4a (waehle_bitrate), Pflichtwörter in einzeln
ausgeschnittenen Sätzen und der Anstieg steigender Fragen (pruefe_saetze).

Der Tausch der Stimme ist EINE Zeile: --anbieter. Alles danach (Pausen, Lautheit, Wortzeiten,
Cues, Whisper-Prüfung) ist für jeden Anbieter gleich. Jeder Anbieter liefert dasselbe:
    synthese(text, stimme, vorher, nachher) -> Ergebnis(audio, format, abtastrate, wortzeiten, ...)
Für Piper steht der Adapter hier unten (PiperAdapter), für die anderen in factory/werk/stimme/.

Ablauf:
  1. Text bauen: Szenen als Absätze, Betonungen als *wort*, steigende Fragen als ?↑ (§4).
  2. Blöcke: Das Skript wird nur an DEKLARIERTEN Pausen geteilt (pause_s = Denkpause nach der
     Frage, atem_s = Atempause vor einer Pointe). Jeder Block geht in einem Stück an die Stimme,
     mit dem Nachbartext als Kontext. Alle anderen Pausen macht die Stimme selbst.
  3. Zusammensetzen: Vorlauf, Block 1, Denkpause (genau pause_s), Block 2, Atempause (atem_s),
     ..., Halten (hold_s).
  4. Mastering: 80-Hz-Hochpass, De-Esser, Kompression 2:1, Lautheit -16 LUFS, Spitze -1 dBTP.
     voice.m4a ist STEREO (beide Kanäle gleich): Der Render mischt ohnehin auf Stereo, und eine
     Mono-Spur mit -16 LUFS wird dabei nach BS.1770 zu -13 LUFS (Prüfung 3). Darum wird die
     Stereo-Fassung selbst auf -16 LUFS gesetzt.
  5. timing.json: Szenen, Sätze, Wörter mit Zeiten, dazu jeder Cue aus script.py ("cues") und die
     SHA-256 von voice.m4a ("audio"): Der Bau prüft damit, dass Wortzeiten und Tonspur
     zusammengehören.
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
from script import PFLICHTWOERTER, SCENES, finde_wort, tokens  # noqa: E402

RATE = 44100          # Arbeits- und Ausgabe-Abtastrate (G4: >= 44,1 kHz)
LEAD_IN = 0.35        # Stille vor dem ersten Wort (Bild 0 ist schon das Hook-Bild)
STILLE_DB = -45.0     # darunter gilt ein 10-ms-Fenster als Stille (Ränder der Blöcke kappen)
RAND_S = 0.03         # so viel Stille bleibt beim Kappen an jedem Blockrand stehen
# AAC-Bitrate der Tonspur (Stereo). G4 verlangt gemessen >= 96 kbit/s, und voice.m4a soll unter
# 1 MB bleiben (v1: 160k, 1,16 MB). Der AAC-Encoder von ffmpeg bleibt bei reiner Sprache unter
# dem Ziel: "96k" ergab gemessen 79,6 kbit/s, "112k" 92,5, "120k" 99,4 kbit/s und 921 KB bei 73 s.
# Fassung v2.1 (Kritik: knapper Spielraum): Ein Ziel allein reicht nicht. waehle_bitrate() probiert
# mehrere Ziele und nimmt das mit dem größten Abstand zu BEIDEN Grenzen; hält keines, Abbruch.
BITRATEN = ("112k", "120k", "128k", "136k")
MIN_KBPS = 96.0
MAX_BYTES = 1_000_000
BLOCK_LUFS = -20.0    # jeder Block vor dem Zusammensetzen auf diese Lautheit (Quellen angleichen)


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


def pause_nach(szene: dict) -> float:
    """Deklarierte Stille nach einer Szene: Denkpause, Atempause oder Halten am Ende."""
    return szene.get("pause_s", 0) + szene.get("atem_s", 0) + szene.get("hold_s", 0)


def bloecke() -> list[dict]:
    """Teilt das Skript an deklarierten Pausen. Ein Block = Szenen bis einschließlich der Pause."""
    liste, aktuell = [], []
    for szene in SCENES:
        aktuell.append(szene)
        if szene.get("pause_s") or szene.get("atem_s"):
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

    def synthese(self, text: str, stimme: dict, vorher=None, nachher=None, neu: bool = False):
        """Fassung v2.1: mit Zwischenspeicher. Piper würfelt (noise_scale): Zwei Läufe desselben
        Texts klingen verschieden, und ein Lauf am 28.10. machte aus „nur sein Gehalt“ „Müsern
        gehalten“. Darum gilt eine einmal gewählte Aufnahme (siehe --piper-takes) für jeden weiteren
        Bau, und auch die Piper-Vorlage für die DTW der Jonas-Blöcke bleibt dieselbe."""
        import hashlib
        from werk.stimme.basis import Ergebnis
        schluessel = hashlib.sha256(json.dumps(
            [text, stimme["modell"], stimme["length_scale"], stimme["noise_scale"], stimme["noise_w_scale"],
             stimme["satzpause_s"], stimme["absatzpause_s"]], ensure_ascii=False).encode()).hexdigest()[:16]
        ordner = CACHE / "piper"
        wav, meta = ordner / f"{schluessel}.wav", ordner / f"{schluessel}.json"
        if not neu and wav.is_file() and meta.is_file():
            m = json.loads(meta.read_text())
            return Ergebnis(audio=wav.read_bytes(), format="wav", abtastrate=m["abtastrate"],
                            wortzeiten=m["wortzeiten"], zeichen=m["zeichen"], anbieter="piper",
                            gesendet=m["gesendet"])
        erg = self._synthese_neu(text, stimme)
        if not neu:
            self.speichere(erg, schluessel)
        erg.schluessel = schluessel
        return erg

    def speichere(self, erg, schluessel: str) -> None:
        ordner = CACHE / "piper"
        ordner.mkdir(parents=True, exist_ok=True)
        (ordner / f"{schluessel}.wav").write_bytes(erg.audio)
        (ordner / f"{schluessel}.json").write_text(json.dumps(
            {"abtastrate": erg.abtastrate, "wortzeiten": erg.wortzeiten, "zeichen": erg.zeichen,
             "gesendet": erg.gesendet}, ensure_ascii=False))

    def _synthese_neu(self, text: str, stimme: dict):
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


class DateiAdapter:
    """Fertige Aufnahmen je Block statt eines API-Aufrufs (Fassung v2, Stimme Jonas).

    Die Aufnahmen kommen aus dem ElevenLabs-Connector auf claude.ai: Ein Aufruf je Block, zwei
    Varianten, die bessere ist in build/stimme-jonas.json eingetragen. Für ElevenLabs gilt die
    ANZEIGE-Seite der Tokens ("Barcelona", "45"): Die Aussprache-Schreibungen waren nur für Piper.
    Fehlt die Datei eines Blocks (Aufruf fehlgeschlagen), spricht Piper diesen Block.
    """

    def __init__(self, konfig: dict):
        self.konfig = konfig
        self.piper = None
        self.quellen = []          # je Block: "elevenlabs-connector" oder "piper", für timing.json

    def synthese(self, text: str, stimme: dict, vorher=None, nachher=None, nr: int = 0):
        from werk.stimme.basis import Ergebnis

        eintrag = self.konfig["bloecke"][nr]
        if not eintrag.get("datei"):
            # Rückfall: Piper mit seiner eigenen Stimm-Datei (Aussprache-Schreibungen gelten dort).
            if self.piper is None:
                self.piper = PiperAdapter()
                self.piper_stimme = json.loads((PROJEKT / self.konfig["rueckfall"]).read_text())
            print(f"Block {nr + 1}: keine Aufnahme ({eintrag.get('grund', 'fehlt')}), Rückfall Piper")
            self.quellen.append("piper")
            return self.piper.synthese(text, self.piper_stimme, vorher, nachher)
        datei = PROJEKT / eintrag["datei"]
        if not datei.is_file():
            raise SystemExit(f"{datei} fehlt (gitignored). Neu laden: Flow {self.konfig['flow_id']}, "
                             f"generation_id {eintrag['generation_id']} (creative_get_generations)")
        roh = datei.read_bytes()
        paare = [p for s in bloecke()[nr]["szenen"] for satz in s["sentences"] for p in tokens(satz)]
        # Wortzeiten: Piper spricht denselben Text mit exakten Zeiten (Laut-Alignment), DTW
        # überträgt sie auf die Jonas-Aufnahme. Whisper dient nur noch zum Vergleich (Ausgabe).
        if self.piper is None:
            self.piper = PiperAdapter()
            self.piper_stimme = json.loads((PROJEKT / self.konfig["rueckfall"]).read_text())
        vorlage = self.piper.synthese(text, self.piper_stimme)
        zeiten = dtw_wortzeiten(dekodiere(roh), dekodiere(vorlage.audio), vorlage.wortzeiten, paare)
        self.quellen.append("elevenlabs-connector")
        return Ergebnis(audio=roh, format="mp3", abtastrate=RATE, wortzeiten=zeiten,
                        zeichen=sum(len(a) + 1 for a, _ in paare), anbieter="elevenlabs-connector",
                        gesendet=eintrag.get("text", ""))


def logmel(audio: np.ndarray, rate: int = RATE) -> np.ndarray:
    """Log-Mel-Spektrum (40 Bänder, 80-7600 Hz) in 10-ms-Schritten, je Band auf Mittel 0 und
    Streuung 1 gebracht (CMVN). So vergleicht DTW Laute, nicht Stimmen: Jonas und Piper klingen
    verschieden, aber ein "a" hat bei beiden seine Formanten an ähnlicher Stelle."""
    n_fft, hop = 1024, rate // 100
    n = 1 + max(0, len(audio) - n_fft) // hop
    fenster = np.hanning(n_fft).astype(np.float32)
    rahmen = np.stack([audio[i * hop: i * hop + n_fft] * fenster for i in range(n)])
    spek = np.abs(np.fft.rfft(rahmen, axis=1)) ** 2
    mel = lambda f: 2595 * np.log10(1 + f / 700)                     # noqa: E731
    hz = lambda m: 700 * (10 ** (m / 2595) - 1)                      # noqa: E731
    grenzen = hz(np.linspace(mel(80), mel(7600), 42))
    bins = np.fft.rfftfreq(n_fft, 1 / rate)
    bank = np.zeros((40, len(bins)), np.float32)
    for b in range(40):
        lo, mi, hi = grenzen[b], grenzen[b + 1], grenzen[b + 2]
        bank[b] = np.clip(np.minimum((bins - lo) / (mi - lo), (hi - bins) / (hi - mi)), 0, None)
    m = np.log(spek @ bank.T + 1e-8)
    return (m - m.mean(axis=0)) / (m.std(axis=0) + 1e-6)


def dtw_pfad(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """DTW zwischen zwei Merkmalsfolgen; liefert den Pfad als Paare (Rahmen in a, Rahmen in b).

    Schritte (1,1), (1,2), (2,1), (1,3), (3,1): Das Tempo darf örtlich bis zum Dreifachen
    abweichen (Pausen sind verschieden lang), aber nie stehen bleiben. Weil jeder Schritt nur
    auf frühere Zeilen zurückgreift, lässt sich jede Zeile auf einmal (numpy) rechnen.
    """
    # Euklidischer Abstand über |a|² + |b|² - 2ab (ohne n x m x 40-Zwischenfeld)
    kosten = np.sqrt(np.maximum(0, (a ** 2).sum(1)[:, None] + (b ** 2).sum(1)[None, :] - 2 * a @ b.T))
    n, m = kosten.shape
    schritte = [(1, 1), (1, 2), (2, 1), (1, 3), (3, 1)]
    D = np.full((n, m), np.inf)
    wahl = np.zeros((n, m), np.int8)
    D[0, 0] = kosten[0, 0]
    for i in range(1, n):
        beste = np.full(m, np.inf)
        for k, (di, dj) in enumerate(schritte):
            if i - di < 0:
                continue
            vorher = np.full(m, np.inf)
            vorher[dj:] = D[i - di, : m - dj]
            # Kosten des Schritts: Zielzelle, bei langen Schritten ein Zuschlag (gegen Abkürzungen)
            kandidat = vorher + kosten[i] * (1 + 0.25 * (max(di, dj) - 1))
            besser = kandidat < beste
            beste[besser] = kandidat[besser]
            wahl[i, besser] = k
        D[i] = beste
    pfad, i, j = [(n - 1, m - 1)], n - 1, m - 1
    while i > 0 and j > 0:
        di, dj = schritte[wahl[i, j]]
        i, j = i - di, j - dj
        pfad.append((max(i, 0), max(j, 0)))
    return np.array(pfad[::-1])


def dtw_wortzeiten(jonas: np.ndarray, piper: np.ndarray, piper_zeiten: list[dict],
                   paare: list[tuple[str, str]]) -> list[dict]:
    """Wortzeiten der Jonas-Aufnahme aus Pipers exakten Wortzeiten für denselben Text.

    Warum nicht Whisper: Whisper lag bei "Opportunitätskosten" 0,24 s zu früh und legte in Lauf 1
    eine Lücke falsch an (das "d" in "oder" statt den Anfang von "behalten"). DTW richtet die
    beiden Aufnahmen Rahmen für Rahmen aneinander aus (10 ms); jede Piper-Wortgrenze wird über
    den Pfad in die Jonas-Zeit umgerechnet. Danach stellt an_energie_ausrichten() Wortanfänge
    nach echten Pausen exakt nach.
    """
    if len(piper_zeiten) != len(paare):
        raise SystemExit(f"Piper-Vorlage hat {len(piper_zeiten)} Wörter, Skript {len(paare)}")
    ja, je = sprechgrenzen(jonas, RATE)
    pa, pe = sprechgrenzen(piper, RATE)
    fa = logmel(jonas[int(ja * RATE): int(je * RATE)])
    fb = logmel(piper[int(pa * RATE): int(pe * RATE)])
    pfad = dtw_pfad(fa, fb)
    # Piper-Rahmen -> Jonas-Rahmen (interpoliert, der Pfad springt bis zu 3 Rahmen)
    ordnung = np.argsort(pfad[:, 1], kind="stable")
    pj, pi = pfad[ordnung, 1].astype(float), pfad[ordnung, 0].astype(float)

    def nach_jonas(t: float) -> float:
        return round(ja + float(np.interp((t - pa) * 100, pj, pi)) / 100, 3)

    zeiten = [{"wort": a, "start": nach_jonas(z["start"]), "ende": nach_jonas(z["ende"])}
              for (a, _), z in zip(paare, piper_zeiten)]
    return an_energie_ausrichten(jonas, RATE, zeiten, versatz_standard=0.0)


def _norm_hoeren(text: str) -> str:
    """Ein Wort so, wie der Hör-Check es vergleicht: Zahlen als Wörter, ohne Satzzeichen, klein."""
    from werk import hoercheck
    return hoercheck.normalisiere(text).replace(" ", "")


def whisper_wortzeiten(roh: bytes, paare: list[tuple[str, str]]) -> list[dict]:
    """Wortzeiten einer fertigen Aufnahme: faster-whisper hört sie ab, dann wird zugeordnet.

    Zuordnung über die Wortfolge (difflib-Opcodes), nicht über die Zeit:
      - gleich:  ein Skript-Wort = ein gehörtes Wort;
      - ersetzt: z. B. "bezahltes" gegen "bezahlt es". Die gehörte Spanne wird nach Buchstaben
                 auf die Skript-Wörter verteilt;
      - fehlt:   bleibt None, fuelle_luecken() setzt es später zwischen die Nachbarn.
    Danach stellt an_energie_ausrichten() die Anfänge an der Lautstärke nach.
    """
    from werk import hoercheck
    r = ffmpeg("-v", "error", "-i", "pipe:0", "-f", "f32le", "-ac", "1", "-ar", "16000", "pipe:1",
               eingabe=roh)
    samples16 = np.frombuffer(r.stdout, dtype=np.float32).copy()
    _, gehoert = hoercheck.transkribiere(samples16, modell="small", sprache="de")
    a = [_norm_hoeren(anzeige) for anzeige, _ in paare]
    b = [_norm_hoeren(w["wort"]) for w in gehoert]
    zeiten: list[dict | None] = [None] * len(paare)
    for op, i1, i2, j1, j2 in SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if op == "equal":
            for k in range(i2 - i1):
                g = gehoert[j1 + k]
                zeiten[i1 + k] = {"wort": paare[i1 + k][0], "start": g["start"], "ende": g["ende"]}
        elif op == "replace":
            von, bis = gehoert[j1]["start"], gehoert[j2 - 1]["ende"]
            laengen = [max(1, len(x)) for x in a[i1:i2]]
            t = von
            for k, n in enumerate(laengen):
                d = (bis - von) * n / sum(laengen)
                zeiten[i1 + k] = {"wort": paare[i1 + k][0], "start": round(t, 3), "ende": round(t + d, 3)}
                t += d
    zeiten = fuelle_luecken(zeiten)
    audio = dekodiere(roh)
    return an_energie_ausrichten(audio, RATE, zeiten)


def an_energie_ausrichten(audio: np.ndarray, rate: int, zeiten: list[dict],
                          versatz_standard: float = 0.07) -> list[dict]:
    """Whisper-Wortanfänge an der Lautstärke-Hüllkurve nachstellen.

    Warum: Whisper setzt Wortanfänge über die Aufmerksamkeit (DTW) und liegt dabei ±100-200 ms
    daneben, im Mittel etwas zu früh (v1 gegen Pipers exakte Zeiten: -82 ms, v2: -61 ms). Ein Bild
    soll aber auf dem Wort landen. Darum:
      1. Das erste Wort beginnt dort, wo die Aufnahme laut wird (immer messbar).
      2. Liegt vor einem Wort eine echte Pause (>= 100 ms unter STILLE_DB: Satzende, Komma), ist
         sein Anfang das Ende der Pause. Kürzere Lücken sind Verschlusslaute (t, d, b) und
         mehrdeutig: In Block 4 lag eine 60-ms-Lücke gleich weit von "Bayern" und "das" entfernt
         und verschob als einzige Messung den ganzen Block um 150 ms (Fehler im ersten Lauf).
      3. Alle übrigen Wörter verschiebt der Median der Korrekturen aus 2, aber nur, wenn es
         mindestens 3 sind; sonst versatz_standard (Whisper: sein gemessener Vorlauf von 70 ms;
         DTW: 0, denn DTW hat keinen systematischen Versatz).
    """
    fenster = max(1, rate // 200)                       # 5-ms-Fenster
    n = len(audio) // fenster
    rms = np.sqrt(np.mean(audio[: n * fenster].reshape(n, fenster) ** 2, axis=1) + 1e-12)
    still = 20 * np.log10(rms) < STILLE_DB
    # Pausen als (Anfang, Ende) in Sekunden; Ende = erster lauter Abschnitt danach
    luecken, k = [], 0
    while k < n:
        if still[k]:
            j = k
            while j < n and still[j]:
                j += 1
            if (j - k) * fenster / rate >= 0.10 and k > 0 and j < n:
                luecken.append((k * fenster / rate, j * fenster / rate))
            k = j
        else:
            k += 1
    neu = [dict(z) for z in zeiten]
    gesetzt, korrekturen = set(), []
    laut = np.nonzero(~still)[0]
    if len(laut) and neu:
        neu[0]["start"] = round(laut[0] * fenster / rate, 3)
        neu[0]["energie"] = True
        gesetzt.add(0)
    for anfang, ende in luecken:
        # das Wort, dessen Whisper-Anfang dem Ende der Pause am nächsten liegt (höchstens 0,25 s)
        i = min(range(len(neu)), key=lambda q: abs(neu[q]["start"] - ende))
        if abs(neu[i]["start"] - ende) > 0.25 or i in gesetzt:
            continue
        korrekturen.append(ende - neu[i]["start"])
        neu[i]["start"] = round(ende, 3)
        neu[i]["energie"] = True
        gesetzt.add(i)
        if i > 0 and neu[i - 1]["ende"] > anfang:
            neu[i - 1]["ende"] = round(max(neu[i - 1]["start"] + 0.05, anfang), 3)
    if len(korrekturen) >= 3:
        versatz = float(np.clip(np.median(korrekturen), -0.15, 0.15))
    else:
        versatz = versatz_standard
    for i, z in enumerate(neu):
        if i not in gesetzt:
            z["start"] = round(z["start"] + versatz, 3)
    # Reihenfolge und Mindestlänge sichern (ein Wort beginnt nach dem vorigen und dauert >= 50 ms)
    for i in range(1, len(neu)):
        neu[i]["start"] = max(neu[i]["start"], round(neu[i - 1]["start"] + 0.05, 3))
    for z in neu:
        z["ende"] = max(z["ende"], round(z["start"] + 0.05, 3))
    print(f"  Wortzeiten: {len(gesetzt)} Anfänge an Pausen gemessen (Korrekturen "
          f"{', '.join(f'{k * 1000:+.0f}' for k in korrekturen) or '-'} ms), Versatz der übrigen "
          f"{versatz * 1000:+.0f} ms")
    return neu


def angleichen(audio: np.ndarray) -> np.ndarray:
    """Einen Block auf BLOCK_LUFS bringen (ebur128 misst, ein fester Faktor setzt).

    Nötig, sobald Blöcke aus verschiedenen Quellen kommen (Jonas und Piper): Sonst springt mit
    der Stimme auch die Lautstärke. Ein fester Faktor verschiebt keine Zeit.
    """
    puffer = io.BytesIO()
    with wave.open(puffer, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes((np.clip(audio, -1, 1) * 32767).astype("<i2").tobytes())
    r = ffmpeg("-i", "pipe:0", "-af", "ebur128", "-f", "null", "-", eingabe=puffer.getvalue())
    lufs = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr.decode())[-1])
    return (audio * 10 ** ((BLOCK_LUFS - lufs) / 20)).astype(np.float32)


def lade_anbieter(name: str, stimme_pfad: str | None):
    """(adapter, stimme): Piper und "datei" aus diesem Ordner, alle anderen aus voices/<name>.json."""
    if name == "piper":
        pfad = Path(stimme_pfad) if stimme_pfad else HIER / "stimme-piper.json"
        return PiperAdapter(), json.loads(pfad.read_text())
    if name == "datei":
        pfad = Path(stimme_pfad) if stimme_pfad else HIER / "stimme-jonas.json"
        konfig = json.loads(pfad.read_text())
        return DateiAdapter(konfig), konfig
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


def luft_einfuegen(audio: np.ndarray, zeiten: list[dict], block: dict) -> tuple[np.ndarray, list[dict], list[dict]]:
    """Setzt "luft" aus script.py in die Aufnahme eines Blocks: Nach dem genannten Wort steht danach
    mindestens so viel Stille. Zeiten sind blockrelativ (nach kappe).

    Geschnitten wird an der leisesten 10-ms-Stelle zwischen den beiden Wörtern (nie in einem Laut),
    eingesetzt wird digitale Stille. Alle späteren Wortzeiten rücken um genau diese Länge nach.
    Warum hier und nicht in der Stimme: Jonas' Blöcke sind fertige Aufnahmen; eine neue Aufnahme
    kostete Credits. Für Piper gilt derselbe Weg, damit beide Stimmen gleich gebaut sind.
    """
    ziele, versatz = [], 0
    for s in block["szenen"]:
        for wort, sek in s.get("luft", {}).items():
            i = versatz + finde_wort(s, wort)
            if i + 1 < len(zeiten):      # am Blockende gilt die deklarierte Pause, nicht "luft"
                ziele.append((i, sek, s["id"], wort))
        versatz += sum(len(tokens(satz)) for satz in s["sentences"])
    zeiten = [dict(z) for z in zeiten]
    protokoll = []
    fenster = RATE // 100
    for i, sek, sid, wort in sorted(ziele, reverse=True):     # von hinten: Indizes bleiben gültig
        a, b = zeiten[i]["ende"], zeiten[i + 1]["start"]
        luecke = b - a
        eintrag = {"szene": sid, "nach": wort, "vorher_s": round(luecke, 3), "soll_s": sek}
        if luecke < sek:
            lo = int(max(0.0, a - 0.03) * RATE)
            hi = max(lo + fenster, int(min(len(audio) / RATE, b + 0.01) * RATE))
            starts = range(lo, hi - fenster + 1, fenster // 2)
            pegel = [float(np.sqrt(np.mean(audio[k:k + fenster] ** 2))) for k in starts]
            schnitt = list(starts)[int(np.argmin(pegel))] + fenster // 2
            zusatz = sek - luecke
            audio = np.concatenate([audio[:schnitt], np.zeros(int(round(zusatz * RATE)), np.float32),
                                    audio[schnitt:]])
            for z in zeiten[i + 1:]:
                z["start"] = round(z["start"] + zusatz, 3)
                z["ende"] = round(z["ende"] + zusatz, 3)
            eintrag["eingesetzt_s"] = round(zusatz, 3)
        eintrag["rel_start"] = zeiten[i]["ende"]
        protokoll.append(eintrag)
    return audio, zeiten, protokoll[::-1]


def sha256(pfad: Path) -> str:
    import hashlib
    return hashlib.sha256(pfad.read_bytes()).hexdigest()


def mastere(roh: Path, ziel_wav: Path, ziel_m4a: Path) -> dict:
    """Mastering nach VIDEO-PIPELINE §3, Lautheit in zwei Durchgängen (erst messen, dann setzen).

    Keiner dieser Filter verschiebt die Zeit: Die Wortzeiten bleiben gültig (geprüft: Länge
    vorher = Länge nachher, siehe Ausgabe).

    Lautheit und Kanäle: ebur128 (BS.1770) zählt die Kanäle zusammen. Dieselbe Spur auf zwei
    Kanälen ist darum 3 LU lauter als in Mono. Die WAV (nur für Prüfungen) bleibt Mono mit
    -16 LUFS; die m4a für das Video wird auf zwei Kanäle verteilt, jeder um 3 dB leiser
    (Faktor 0,7071 = 1/Wurzel 2). So hat die Stereo-Spur wieder genau -16 LUFS, und der
    Render (mischt immer auf Stereo) ändert die Lautheit nicht mehr.
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
    mess = miss(ziel_m4a) if waehle_bitrate(ziel_wav, ziel_m4a) else None
    return mess


def waehle_bitrate(wav: Path, m4a: Path) -> dict:
    """Kodiert die Stereo-m4a mit jedem Ziel aus BITRATEN und nimmt das mit dem größten Abstand zu
    BEIDEN Grenzen (>= MIN_KBPS, < MAX_BYTES; kleinster relativer Abstand zählt). Gemessen wird die
    Bitrate des Stroms (ffprobe), nicht das Ziel. Längere Stille senkt die gemessene Bitrate (am
    28.10. ergab "120k" je nach Fassung 99,1 bis 96,8 kbit/s)."""
    versuche, gut = [], []
    for ziel in BITRATEN:
        ffmpeg("-y", "-i", str(wav), "-af", "pan=stereo|c0=0.70711*c0|c1=0.70711*c0",
               "-c:a", "aac", "-b:a", ziel, "-ar", str(RATE), str(m4a))
        r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries",
                            "stream=bit_rate", "-of", "csv=p=0", str(m4a)], capture_output=True, text=True)
        kbps = round(int(r.stdout.strip()) / 1000, 1)
        groesse = m4a.stat().st_size
        versuche.append(f"{ziel}: {kbps} kbit/s, {groesse} B")
        if kbps >= MIN_KBPS and groesse < MAX_BYTES:
            gut.append((min(kbps / MIN_KBPS - 1, 1 - groesse / MAX_BYTES), ziel, kbps, groesse))
    if not gut:
        raise SystemExit("Keine AAC-Bitrate hält >= 96 kbit/s UND < 1 MB: " + "; ".join(versuche))
    _, ziel, kbps, groesse = max(gut)
    ffmpeg("-y", "-i", str(wav), "-af", "pan=stereo|c0=0.70711*c0|c1=0.70711*c0",
           "-c:a", "aac", "-b:a", ziel, "-ar", str(RATE), str(m4a))
    waehle_bitrate.ergebnis = {"ziel": ziel, "kbit_s": kbps, "bytes": groesse, "versuche": versuche}
    print(f"AAC {ziel}: {kbps} kbit/s, {groesse / 1000:.0f} KB (Grenzen >= {MIN_KBPS:.0f} kbit/s, < 1 MB; "
          f"geprüft: {'; '.join(versuche)})")
    return waehle_bitrate.ergebnis


def miss(pfad: Path) -> dict:
    """Integrierte Lautheit und Spitze einer Datei, so wie G4 sie misst (ebur128)."""
    r = ffmpeg("-i", str(pfad), "-af", "ebur128=peak=true", "-f", "null", "-")
    text = r.stderr.decode()
    lufs = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", text)[-1])
    spitze = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", text)[-1])
    return {"datei": pfad.name, "lufs": lufs, "true_peak_db": spitze}


def pruef_wav(m4a: Path) -> Path:
    """Mono-WAV aus voice.m4a für die Prüfungen (die WAV ist gitignored, die m4a nicht)."""
    ziel = CACHE / "voice-pruefen.wav"
    ffmpeg("-y", "-i", str(m4a), "-ac", "1", "-ar", str(RATE), "-c:a", "pcm_s16le", str(ziel))
    return ziel


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
        if szene.get("atem_s"):
            timing["pausen"].append({"art": "atem", "nach": szene["id"], "start": sc["end"],
                                     "end": round(sc["end"] + szene["atem_s"], 3)})
        if szene.get("hold_s"):
            timing["pausen"].append({"art": "halten", "nach": szene["id"], "start": sc["end"],
                                     "end": round(sc["end"] + szene["hold_s"], 3)})
        timing["scenes"].append(sc)
    return timing


def neue_cues(timing: dict) -> dict:
    """Cues aus script.py auf die Wörter in timing.json legen (für --nur-cues).

    Bricht ab, wenn Szenen oder Wörter nicht mehr zum Skript passen: Dann muss neu vertont werden.
    """
    szenen = {s["id"]: s for s in timing["scenes"]}
    cues = {}
    for szene in SCENES:
        if szene["id"] not in szenen:
            raise SystemExit(f"Szene {szene['id']} fehlt in timing.json: neu vertonen")
        woerter = [w for satz in szenen[szene["id"]]["sentences"] for w in satz["words"]]
        skript = [anzeige for satz in szene["sentences"] for anzeige, _ in tokens(satz)]
        if [w["text"] for w in woerter] != skript:
            raise SystemExit(f"Szene {szene['id']}: Sprechtext geändert, neu vertonen")
        for name, wort in szene.get("cues", {}).items():
            w = woerter[finde_wort(szene, wort)]
            cues[name] = {"szene": szene["id"], "wort": wort, "start": w["start"], "end": w["end"]}
    return cues


# ------------------------------------------------------------------------------------------
# 5. Prüfung mit Whisper: Wie weit liegt jedes Cue-Wort neben der gehörten Zeit?
# ------------------------------------------------------------------------------------------

def pruefe_einsaetze(timing: dict, audio_pfad: Path) -> dict:
    """Physikalische Gegenprobe ohne Whisper: Nach jeder Pause (>= 0,25 s) ist der Wortanfang der
    erste Moment, in dem es wieder laut wird. Gesucht wird ab 0,12 s vor dem Wort (dort ist noch
    Stille), in 1-ms-Schritten über Samples (nicht über gezählte Fenster: 44 Samples sind nicht
    genau 1 ms, das gäbe eine Scheindrift von 0,2 %).
    """
    with wave.open(str(audio_pfad)) as w:
        rate = w.getframerate()
        a = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float32) / 32768
    schritt = max(1, rate // 1000)
    woerter = [w for s in timing["scenes"] for satz in s["sentences"] for w in satz["words"]]
    abw = {}
    for i, wd in enumerate(woerter):
        if i == 0 or wd["start"] - woerter[i - 1]["end"] < 0.25:
            continue
        k = int((wd["start"] - 0.12) * rate)
        while k < len(a) - schritt and 20 * np.log10(np.sqrt(np.mean(a[k:k + schritt] ** 2)) + 1e-9) < STILLE_DB:
            k += schritt
        abw[f"{wd['text']}@{wd['start']}"] = round((k / rate - wd["start"]) * 1000)
    werte = [abs(v) for v in abw.values()]
    return {"verfahren": "Energie-Anfang nach Pausen (>= 0,25 s), Schwelle -45 dBFS",
            "n": len(werte), "max_ms": max(werte) if werte else None,
            "median_ms": int(np.median(werte)) if werte else None, "woerter": abw}


def pruefe_cues(timing: dict, audio_pfad: Path, einsaetze: dict | None = None) -> dict:
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
        # Gegenprobe an der Hüllkurve (Wort nach einer Pause): Liegt der Energie-Anfang auf der
        # Zeit in timing.json, irrt Whisper, nicht der Bau (Kritik 28.10.: "nur", "genauso").
        h = (einsaetze or {}).get("woerter", {}).get(f"{skript[i][0]['text']}@{cue['start']}")
        if h is not None:
            eintrag["huellkurve_ms"] = h
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
            # Cues über 150 ms (bereinigt), deren Anfang die Hüllkurve auf <= 30 ms bestätigt:
            # Dort liegt Whisper daneben. Spätere Tore sollen sie nicht für Fehler des Baus halten.
            "whisper_daneben_huellkurve_ok": sorted(
                n for n, d in bereinigt.items()
                if abs(d) > 150 and liste[n].get("huellkurve_ms") is not None and abs(liste[n]["huellkurve_ms"]) <= 30),
            "cues": liste}


def f0_kontur(audio: np.ndarray, rate: int, t0: float, t1: float) -> list[tuple[float, float]]:
    """Grundfrequenz (Hz) in 10-ms-Schritten über [t0, t1]: normierte Autokorrelation je 40-ms-Rahmen,
    Suchbereich 70-350 Hz. Stimmlose oder leise Rahmen fallen weg (Gipfel < 0,5 oder Pegel zu klein)."""
    rahmen, hop = int(0.04 * rate), int(0.01 * rate)
    lag_min, lag_max = int(rate / 350), int(rate / 70)
    werte = []
    for k in range(int(t0 * rate), int(t1 * rate) - rahmen, hop):
        x = audio[k:k + rahmen].astype(np.float64)
        if np.sqrt(np.mean(x ** 2)) < 10 ** (-40 / 20):
            continue
        x = x - x.mean()
        ak = np.fft.irfft(np.abs(np.fft.rfft(x, 2 * rahmen)) ** 2)[:rahmen]
        if ak[0] <= 0:
            continue
        ak = ak / ak[0]
        lag = lag_min + int(np.argmax(ak[lag_min:lag_max]))
        if ak[lag] >= 0.5:
            werte.append((round(k / rate, 3), round(rate / lag, 1)))
    return werte


def pruefe_saetze(timing: dict, wav: Path) -> dict:
    """Einzeln ausgeschnittene Sätze (Kritik 28.10.): Auf der ganzen Spur errät Whisper Wörter aus dem
    Zusammenhang; ein Satz allein zeigt, was wirklich zu hören ist.

      1. Pflichtwörter (script.PFLICHTWOERTER): Jeder Satz, der eines enthält, wird mit 0,15 s Rand
         ausgeschnitten und ohne Vorkontext transkribiert. Das Wort muss genau so gehört werden.
      2. Steigende Fragen ("steigt" in script.py): Whisper muss "?" schreiben, UND die Tonhöhe am Ende
         des letzten Worts muss über der des ersten Worts liegen (Median, +5 %).
    """
    from werk import hoercheck
    with wave.open(str(wav)) as w:
        rate = w.getframerate()
        a = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float32) / 32768
    a16 = hoercheck.dekodiere(wav)
    pflicht = {_norm_hoeren(p) for p in PFLICHTWOERTER}
    steigend = {sid: s.get("steigt", []) for sid, s in ((s["id"], s) for s in SCENES)}
    ergebnis = {"verfahren": "Satz einzeln ausgeschnitten (0,15 s Rand), faster-whisper small, beam 5, ohne Vorkontext",
                "pflichtwoerter": [], "fragen": []}
    for sc in timing["scenes"]:
        for satz in sc["sentences"]:
            soll = [_norm_hoeren(w["text"]) for w in satz["words"]]
            treffer = [w["text"] for w, n in zip(satz["words"], soll) if n in pflicht]
            frage = any(satz["text"].startswith(f.rstrip("?")) for f in steigend.get(sc["id"], []))
            if not treffer and not frage:
                continue
            # Fragen: nur der Fragesatz selbst (bis zum Wort mit "?"), nicht der ganze Satz-Eintrag
            woerter = satz["words"]
            if frage:
                n_frage = len(steigend[sc["id"]][0].split())
                woerter = woerter[:n_frage]
            von, bis = max(0.0, woerter[0]["start"] - 0.15), woerter[-1]["end"] + 0.15
            text, gehoert = hoercheck.transkribiere(a16[int(von * 16000):int(bis * 16000)])
            gehoert_n = [_norm_hoeren(g["wort"]) for g in gehoert]
            for wort in treffer:
                ok = _norm_hoeren(wort) in gehoert_n
                ergebnis["pflichtwoerter"].append({"szene": sc["id"], "wort": wort, "satz_s": [round(von, 2), round(bis, 2)],
                                                   "gehoert": text, "ok": ok})
            if frage:
                erstes = [f for _, f in f0_kontur(a, rate, woerter[0]["start"], woerter[0]["end"])]
                letztes = woerter[-1]
                mitte = letztes["start"] + 0.5 * (letztes["end"] - letztes["start"])
                ende = [f for _, f in f0_kontur(a, rate, mitte, letztes["end"] + 0.05)]
                f_a = float(np.median(erstes)) if erstes else None
                f_e = float(np.median(ende)) if ende else None
                steigt = bool(f_a and f_e and f_e > 1.05 * f_a)
                ergebnis["fragen"].append({"szene": sc["id"], "frage": " ".join(w["text"] for w in woerter) + "?",
                                           "gehoert": text, "fragezeichen": "?" in text,
                                           "f0_erstes_wort_hz": f_a, "f0_ende_hz": f_e, "steigt": steigt,
                                           "ok": steigt and "?" in text})
    ergebnis["ok"] = all(e["ok"] for e in ergebnis["pflichtwoerter"] + ergebnis["fragen"])
    for e in ergebnis["pflichtwoerter"]:
        print(f"  Pflichtwort {e['wort']:20s} {'ok' if e['ok'] else 'FEHLT'}: {e['gehoert']}")
    for e in ergebnis["fragen"]:
        print(f"  Frage {e['frage']}: {'ok' if e['ok'] else 'NICHT steigend'} (F0 {e['f0_erstes_wort_hz']} -> "
              f"{e['f0_ende_hz']} Hz, Whisper: {e['gehoert']})")
    return ergebnis


# ------------------------------------------------------------------------------------------
# Piper-Takes: mehrere Aufnahmen eines Rückfall-Blocks, die beste kommt in den Zwischenspeicher
# ------------------------------------------------------------------------------------------

def piper_takes(nummern: list[int], anzahl: int) -> None:
    """Wie bei Jonas (zwei Varianten, die bessere zählt): Piper spricht einen Block `anzahl`-mal,
    jede Aufnahme wird gehört und bewertet, die beste ersetzt den Zwischenspeicher.

    Bewertung (kleiner ist besser): Wortfehlerrate des Blocks (Whisper auf dem Block allein)
    + 0,2 je Pflichtwort, das im einzeln ausgeschnittenen Satz fehlt + 0,1, wenn eine steigende
    Frage nicht steigt (F0 am Ende <= 1,05 x F0 des ersten Worts).
    """
    from werk import hoercheck
    konfig = json.loads((HIER / "stimme-jonas.json").read_text())
    stimme = json.loads((PROJEKT / konfig["rueckfall"]).read_text())
    piper = PiperAdapter()
    pflicht = {_norm_hoeren(p) for p in PFLICHTWOERTER}
    for nr in nummern:
        block = bloecke()[nr - 1]
        soll = " ".join(satz for s in block["szenen"] for satz in s["sentences"])
        fragen = [f for s in block["szenen"] for f in s.get("steigt", [])]
        beste = None
        for k in range(anzahl):
            erg = piper.synthese(block["text"], stimme, neu=True)
            a = dekodiere(erg.audio)
            r16 = ffmpeg("-v", "error", "-i", "pipe:0", "-f", "f32le", "-ac", "1", "-ar", "16000", "pipe:1",
                         eingabe=erg.audio)
            a16 = np.frombuffer(r16.stdout, dtype=np.float32).copy()
            text, _ = hoercheck.transkribiere(a16)
            wer = hoercheck.wer(soll, text)
            # Sätze dieses Blocks mit ihren Wortzeiten (Piper-Alignment, blockrelativ)
            paare = [(sz, satz, tokens(satz)) for sz in block["szenen"] for satz in sz["sentences"]]
            i, fehlt, frage_ok, notizen = 0, 0, True, []
            for sz, satz, tk in paare:
                w = erg.wortzeiten[i:i + len(tk)]
                i += len(tk)
                soll_n = [_norm_hoeren(x) for x, _ in tk]
                if pflicht & set(soll_n):
                    von, bis = max(0, w[0]["start"] - 0.15), w[-1]["ende"] + 0.15
                    t2, g = hoercheck.transkribiere(a16[int(von * 16000):int(bis * 16000)])
                    gn = {_norm_hoeren(x["wort"]) for x in g}
                    for x in pflicht & set(soll_n):
                        if x not in gn:
                            fehlt += 1
                            notizen.append(f"fehlt {x}: {t2}")
                for f in fragen:
                    if satz.startswith(f.rstrip("?")):
                        n = len(f.split())
                        fa = [v for _, v in f0_kontur(a, RATE, w[0]["start"], w[0]["ende"])]
                        mitte = w[n - 1]["start"] + 0.5 * (w[n - 1]["ende"] - w[n - 1]["start"])
                        fe = [v for _, v in f0_kontur(a, RATE, mitte, w[n - 1]["ende"] + 0.05)]
                        steigt = bool(fa and fe and np.median(fe) > 1.05 * np.median(fa))
                        frage_ok = frage_ok and steigt
                        notizen.append(f"Frage F0 {np.median(fa) if fa else 0:.0f} -> {np.median(fe) if fe else 0:.0f} Hz")
            punkte = wer + 0.2 * fehlt + (0 if frage_ok else 0.1)
            print(f"Block {nr}, Take {k + 1}: WER {wer:.3f}, Pflicht fehlt {fehlt}, Frage "
                  f"{'steigt' if frage_ok else 'steigt nicht'} -> {punkte:.3f}  {'; '.join(notizen)}  | {text}")
            if beste is None or punkte < beste[0]:
                beste = (punkte, erg, k + 1)
        piper.speichere(beste[1], beste[1].schluessel)
        print(f"Block {nr}: Take {beste[2]} gewählt ({beste[0]:.3f}), Zwischenspeicher {beste[1].schluessel}")


# ------------------------------------------------------------------------------------------
# Hauptprogramm
# ------------------------------------------------------------------------------------------

def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--anbieter", default="piper", help="piper (Platzhalter) oder ein Fabrik-Anbieter")
    ap.add_argument("--stimme", help="Pfad zur Stimm-Datei (Standard: build/stimme-piper.json bzw. voices/)")
    ap.add_argument("--nur-pruefen", action="store_true", help="nur den Whisper-Abgleich neu messen")
    ap.add_argument("--nur-cues", action="store_true", help="nur die Cues aus script.py neu zuordnen")
    ap.add_argument("--piper-takes", help="Blöcke (z. B. 2,5,6): Piper mehrfach sprechen lassen, beste Aufnahme merken")
    ap.add_argument("--anzahl", type=int, default=4, help="Zahl der Takes je Block (mit --piper-takes)")
    args = ap.parse_args()
    if args.piper_takes:
        CACHE.mkdir(exist_ok=True)
        piper_takes([int(x) for x in args.piper_takes.split(",")], args.anzahl)
        return

    ASSETS.mkdir(exist_ok=True)
    CACHE.mkdir(exist_ok=True)
    timing_pfad = ASSETS / "timing.json"
    if args.nur_pruefen:
        timing = json.loads(timing_pfad.read_text())
        m4a = ASSETS / "voice.m4a"
        if timing.get("audio", {}).get("sha256") != sha256(m4a):
            raise SystemExit("timing.json gehört nicht zu assets/voice.m4a (SHA-256 verschieden): neu vertonen")
        wav = pruef_wav(m4a)
        timing["pruefung_einsaetze"] = pruefe_einsaetze(timing, wav)
        timing["pruefung"] = pruefe_cues(timing, wav, timing["pruefung_einsaetze"])
        timing["pruefung_saetze"] = pruefe_saetze(timing, wav)
        timing_pfad.write_text(json.dumps(timing, ensure_ascii=False, indent=1))
        zeige_pruefung(timing["pruefung"], timing["pruefung_einsaetze"])
        return

    if args.nur_cues:
        # Ein neuer Cue im Skript (z. B. "nichts") braucht keine neue Aufnahme: Die Wörter und ihre
        # Zeiten stehen schon in timing.json. Neu ist nur, welches Wort welchen Namen trägt.
        # Der Sprechtext muss dafür gleich geblieben sein; sonst passt die Zuordnung nicht.
        timing = json.loads(timing_pfad.read_text())
        timing["cues"] = neue_cues(timing)
        timing_pfad.write_text(json.dumps(timing, ensure_ascii=False, indent=1))
        print(f"{len(timing['cues'])} Cues neu zugeordnet (Tonspur und Wortzeiten unverändert)")
        return

    adapter, stimme = lade_anbieter(args.anbieter, args.stimme)
    teile_audio = [np.zeros(int(LEAD_IN * RATE), np.float32)]
    t = LEAD_IN
    szenen_zeiten = []
    luft_liste = []
    bl = bloecke()
    for k, block in enumerate(bl):
        vorher = bl[k - 1]["text"] if k > 0 else None
        nachher = bl[k + 1]["text"] if k + 1 < len(bl) else None
        extra = {"nr": k} if args.anbieter == "datei" else {}
        ergebnis = adapter.synthese(block["text"], stimme, vorher=vorher, nachher=nachher, **extra)
        audio = dekodiere(ergebnis.audio)
        wortzeiten = ergebnis.wortzeiten
        if wortzeiten is None:
            raise SystemExit("Anbieter liefert keine Wortzeiten: hier Whisper-Alignment ergänzen")
        audio, wortzeiten = kappe(audio, wortzeiten)
        audio = angleichen(audio)
        skript = [p for s in block["szenen"] for satz in s["sentences"] for p in tokens(satz)]
        zeiten = fuelle_luecken(ordne_zu(skript, wortzeiten))
        audio, zeiten, luft = luft_einfuegen(audio, zeiten, block)
        for e in luft:
            start = round(e.pop("rel_start") + t, 3)
            luft_liste.append({**e, "start": start, "end": round(start + max(e["soll_s"], e["vorher_s"]), 3)})
            print(f"  Luft nach „{e['nach']}“: {e['vorher_s']:.2f} s -> {max(e['soll_s'], e['vorher_s']):.2f} s")
        zeiten = [{**z, "start": round(z["start"] + t, 3), "ende": round(z["ende"] + t, 3)} for z in zeiten]
        i = 0
        for s in block["szenen"]:
            n = sum(len(tokens(satz)) for satz in s["sentences"])
            szenen_zeiten.append((s, zeiten[i:i + n]))
            i += n
        teile_audio.append(audio)
        t += len(audio) / RATE
        # Deklarierte Pausen: nur aus dem Skript (pause_s nach der Frage, atem_s vor einer
        # Pointe, hold_s am Ende).
        pause = pause_nach(block["szenen"][-1])
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
    print(f"Mastering (voice.m4a, stereo): {mess['lufs']:.1f} LUFS, Spitze {mess['true_peak_db']:.1f} dBFS, "
          f"Länge {dauer:.3f} s -> {dauer_nach:.3f} s")

    timing = baue_timing(szenen_zeiten, dauer, args.anbieter, stimme)
    timing["luft"] = luft_liste
    timing["mastering"] = mess
    # Fingerabdruck der Tonspur: bauen.mjs bricht ab, wenn timing.json zu einer anderen m4a gehört.
    timing["audio"] = {"datei": "assets/voice.m4a", "sha256": sha256(ASSETS / "voice.m4a"), "kanaele": 2,
                       **waehle_bitrate.ergebnis}
    if args.anbieter == "piper":
        timing["wortzeiten_quelle"] = "piper-alignment" if adapter.exakt else "geschaetzt-nach-lauten"
    elif args.anbieter == "datei":
        # Je Block steht fest, wer spricht. Bei Jonas-Blöcken ist "spoken" die Anzeige-Seite
        # (ElevenLabs liest "Barcelona" und "45" richtig, die Piper-Schreibung gilt dort nicht).
        jonas_name = f"{stimme['name'].split(' - ')[0]} ({stimme['voice_id']}, {stimme['modell']})"
        piper_name = "Piper thorsten-high (Platzhalter)"
        timing["quellen_je_block"] = [{"block": k + 1, "szenen": [s["id"] for s in b["szenen"]],
                                       "quelle": q, "stimme": piper_name if q == "piper" else jonas_name}
                                      for k, (b, q) in enumerate(zip(bl, adapter.quellen))]
        # "stimme" je Block statt eines Namens für alles (Kritik 28.10.: drei von sechs Blöcken
        # sprach Piper, timing.json nannte nur Jonas).
        timing["stimme"] = [f"Block {e['block']}: {e['stimme']}" for e in timing["quellen_je_block"]]
        timing["platzhalter"] = "piper" in adapter.quellen
        # Tor: Eine Tonspur aus zwei Stimmen ist ein Zwischenstand. Die Brüder bewerten EINE Stimme;
        # ein Wechsel mitten im Video (hier sogar an der Pointe von Beat 8) verfälscht das Urteil.
        stimmen = sorted({e["stimme"] for e in timing["quellen_je_block"]})
        timing["bewertbar"] = {"ok": len(stimmen) == 1, "stimmen": stimmen,
                               "grund": "eine Stimme" if len(stimmen) == 1 else
                               "Stimmen gemischt: Video nicht zur Bewertung freigeben"}
        jonas = {sid for e in timing["quellen_je_block"] if e["quelle"] != "piper" for sid in e["szenen"]}
        for sc in timing["scenes"]:
            if sc["id"] in jonas:
                for satz in sc["sentences"]:
                    for w in satz["words"]:
                        w["spoken"] = w["text"]
        timing["wortzeiten_quelle"] = ("DTW gegen Piper-Vorlage + Energie-Anfänge nach Pausen (Jonas-Blöcke); "
                                       "piper-alignment (Rückfall-Blöcke)")
    else:
        timing["wortzeiten_quelle"] = args.anbieter
    woerter = sum(len(s["words"]) for sc in timing["scenes"] for s in sc["sentences"])
    sprechzeit = dauer - LEAD_IN - sum(p["end"] - p["start"] for p in timing["pausen"])
    timing["woerter"] = woerter
    timing["woerter_pro_s"] = round(woerter / sprechzeit, 2)
    timing["pruefung_einsaetze"] = pruefe_einsaetze(timing, ASSETS / "voice.wav")
    timing["pruefung"] = pruefe_cues(timing, ASSETS / "voice.wav", timing["pruefung_einsaetze"])
    timing["pruefung_saetze"] = pruefe_saetze(timing, ASSETS / "voice.wav")
    timing_pfad.write_text(json.dumps(timing, ensure_ascii=False, indent=1))
    if timing.get("bewertbar") and not timing["bewertbar"]["ok"]:
        print("ACHTUNG: " + timing["bewertbar"]["grund"] + " (" + "; ".join(timing["stimme"]) + ")")

    for sc in timing["scenes"]:
        print(f"{sc['id']:14s} {sc['start']:6.2f} -> {sc['end']:6.2f}")
    print(f"gesamt {dauer:.2f} s, {woerter} Wörter, {timing['woerter_pro_s']} Wörter/s (ohne Pausen)")
    zeige_pruefung(timing["pruefung"], timing["pruefung_einsaetze"])


def zeige_pruefung(p: dict, e: dict | None = None) -> None:
    if e:
        print(f"Wortanfang nach Pausen (Energie, ohne Whisper): {e['n']} Wörter, max {e['max_ms']} ms, Median {e['median_ms']} ms")
    print(f"Cue-Abweichung (Whisper): {p['cues_gefunden']}/{p['cues_gesamt']} Cues gehört, "
          f"max {p['max_ms']} ms, Median |d| {p['median_abs_ms']} ms; über 150 ms: {p['ueber_150ms'] or 'keine'}")
    print(f"  Whisper-Versatz (Median) {p['whisper_versatz_ms']} ms; bereinigt max {p['max_bereinigt_ms']} ms, "
          f"über 150 ms: {p['ueber_150ms_bereinigt'] or 'keine'}; Whisper-Anfang in Stille: {p['whisper_in_stille'] or 'keiner'}")
    for name, v in p["cues"].items():
        print(f"  {name:16s} {v['wort']:22s} {v['timing_s']:7.2f}  {v['ms'] if v['ms'] is not None else '-':>5}")


if __name__ == "__main__":
    main()
