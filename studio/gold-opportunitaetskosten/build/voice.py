"""Stimme des Goldstandards: Skript -> assets/voice.m4a + assets/timing.json (Wortzeiten, Cues).

    python build/voice.py                         # heute: Piper thorsten-high als PLATZHALTER
    python build/voice.py --anbieter elevenlabs   # später: Casting-Sieger über factory/werk/stimme
    python build/voice.py --nur-pruefen           # nur den Whisper-Abgleich der Cues neu messen
                                                  # (dekodiert assets/voice.m4a, braucht keine WAV)
    python build/voice.py --nur-cues              # nur die Cues aus script.py neu zuordnen (gleiche
                                                  # Tonspur, gleiche Wortzeiten; neuer Cue ohne Neuvertonung)
    python build/voice.py --anbieter datei        # fertige Block-Aufnahmen aus build/stimme-jonas.json
                                                  # (ElevenLabs über den claude.ai-Connector, 28.10.)
    python build/voice.py --anbieter datei --stimme build/stimme-sebastian.json
                                                  # dasselbe mit einer anderen Stimm-Datei (Fassung v3:
                                                  # Cartesia „Sebastian“ spricht alle sechs Blöcke)
    python build/voice.py --vertonen build/stimme-sebastian.json
                                                  # fehlende Blöcke einer Stimm-Datei über den Fabrik-
                                                  # Adapter vertonen, je Block GENAU ein Aufruf

Fassung final, Politur (03.11.2026, Abnahme-Befunde P2, ohne neue Aufnahme):
  - Mundgeräusche: Schmatzer und Knackse bis 30 ms in den Pausen zwischen zwei Wörtern werden auf den
    Pegel ihrer Umgebung gedämpft (mund_daempfen), und zwar VOR dem Ausrichten der Wortanfänge (ein
    Schmatzer vor „Das“ galt sonst als Wortanfang). Ein Laut im Wort (etwa das t am Ende von
    „aufgibt“) bleibt. Tor: mundgeraeusche() auf der fertigen Spur, 0 in Pausen.
  - Mastering wirklich linear: loudnorm schaltete trotz linear=true in den dynamischen Modus, weil die
    Verstärkung (+8,4 dB) die Spitze über -1,5 dBTP gehoben hätte. Der dynamische Modus regelt über
    3-s-Fenster nach; darum lag der erste Satz 2 dB über dem Rest. Jetzt: feste Verstärkung (zweimal
    gemessen) und ein Spitzenbegrenzer mit Laufzeitausgleich (die Zeit verschiebt sich nicht).
  - Satz-Lautheit im Tor auf zwei Arten: nur über die Wörter (wie bisher) und über den ganzen Satz
    vom ersten bis zum letzten Wort (so maß die Kritik). Beide Spannen <= 3 LU.

Fassung final (Runde 1, 03.11.2026): Die Ton-Kritik fand Knackser und digitale Löcher an den
Schnittstellen, uneinheitlichen Atem, eine leise Leitfrage und Kernsätze, die schneller kamen als der
Rest. Darum setzt der Bau jetzt (alles ohne neue Aufnahme, alles in dieser Datei):
  - Raumton statt digitaler Null: Vorlauf, Pausen und Luft bekommen den leisen Grundton der
    Aufnahme (raumton), jede Kante eine 10-ms-Blende (blende). Keine Luft unter 100 ms.
  - Atem: Ein Einatmen vor einem Wort zählt nicht mehr als Wortanfang (an_energie_ausrichten sucht
    den ersten Rahmen mit Stimmpegel). Luft wird VOR dem Einatmen eingesetzt, nicht danach, und
    jedes Einatmen wird um ATEM_DB leiser (nicht entfernt).
  - Lautheit je Satz: Jeder Satz kommt auf ±SATZ_TOLERANZ_LU an die Blocklautheit heran
    (saetze_angleichen, 20-ms-Rampen in der Stille zwischen den Sätzen).
  - Dehnen: "dehnen" in script.py verlangsamt einen Satz um einen festen Faktor (rubberband,
    Tonhöhe bleibt). Für Kernsätze, die der Anbieter trotz Tempo-Wert zu schnell spricht.
  - Tore (pruefe_ton): Satz-Lautheit (Spanne <= 3 LU), Knackser (0), Tempo der Kernsätze
    (<= 4,5 Silben/s und nicht schneller als der Median), Betonung als Warnung (Gipfel des
    betonten Worts >= +3 Halbtöne oder +2 dB über dem Satz).

Fassung v3 (03.11.2026): Eine Stimm-Datei kann statt ElevenLabs auch einen Fabrik-Anbieter nennen
("anbieter": "cartesia"). --vertonen ruft ihn je Block ohne Datei einmal auf (vertone_bloecke) und
speichert Aufnahme und Wort-Zeitstempel des Anbieters in build/cache/<anbieter>/. Diese
Zeitstempel ersetzen dann die DTW gegen Piper; Piper wird dafür nicht mehr gebraucht.

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
from script import KERNSAETZE, PFLICHTWOERTER, SCENES, WARNSAETZE, finde_wort, tokens  # noqa: E402

RATE = 44100          # Arbeits- und Ausgabe-Abtastrate (G4: >= 44,1 kHz)
LEAD_IN = 0.35        # Stille vor dem ersten Wort (Bild 0 ist schon das Hook-Bild)
STILLE_DB = -45.0     # darunter gilt ein 10-ms-Fenster als Stille (Ränder der Blöcke kappen)
RAND_S = 0.03         # so viel Stille bleibt beim Kappen an jedem Blockrand stehen
# AAC-Bitrate der Tonspur (Stereo). G4 verlangt gemessen >= 96 kbit/s, und voice.m4a soll unter
# 1 MB bleiben (v1: 160k, 1,16 MB). Der AAC-Encoder von ffmpeg bleibt bei reiner Sprache unter
# dem Ziel: "96k" ergab gemessen 79,6 kbit/s, "112k" 92,5, "120k" 99,4 kbit/s und 921 KB bei 73 s.
# Fassung v2.1 (Kritik: knapper Spielraum): Ein Ziel allein reicht nicht. waehle_bitrate() probiert
# mehrere Ziele und nimmt das mit dem größten Abstand zu BEIDEN Grenzen; hält keines, Abbruch.
# Fassung final: Mit Raumton statt digitaler Null in den Pausen hält der Encoder sein Ziel genau
# (112k ergab 111,8 kbit/s und 1,07 MB bei 77 s). Darum auch niedrigere Ziele.
BITRATEN = ("98k", "100k", "104k", "112k", "120k")
MIN_KBPS = 96.0
MAX_BYTES = 1_000_000
BLOCK_LUFS = -20.0    # jeder Block vor dem Zusammensetzen auf diese Lautheit (Quellen angleichen)
# Fassung final (Runde 1, Ton-Kritik):
BLENDE_S = 0.010      # jede Schnittkante (Block, Luft, Pause) blendet über 10 ms: kein Knacks
LUFT_MIN_S = 0.10     # kürzer wird keine Luft eingesetzt (41 ms mitten im Atem klangen wie ein Loch)
ATEM_DB = -9.0        # so viel leiser wird ein Einatmen vor einem Wort (einheitlich, nicht entfernt)
ATEM_MIN_S = 0.15     # ein leiser Abschnitt vor dem Stimmeinsatz gilt ab dieser Länge als Atem
STIMME_UNTER_DB = 20.0  # Stimmeinsatz = erster Rahmen höchstens so weit unter dem Sprachmedian
SATZ_TOLERANZ_LU = 0.25  # Sätze näher als das an der Blocklautheit bleiben, wie sie sind
SATZ_MAX_DB = 5.0     # größte Korrektur je Satz
SATZ_SPANNE_LU = 3.0  # Tor: lautester minus leisester Satz (ebur128) auf der fertigen Spur
KERN_SILBEN_S = 4.5   # Tor: Kernsätze (script.KERNSAETZE) höchstens so schnell
# Politur (Abnahme final, P2): Mundgeräusche. Ein Schmatzer oder Knacks ist ein kurzer lauter Abschnitt
# (bis MUND_MAX_S), vor und hinter dem je MUND_RAND_S lang Ruhe ist (unter MUND_UMGEBUNG_DB), und dessen
# Spitze mindestens MUND_ABSTAND_DB über BEIDEN Umgebungen liegt. Ein Wortanfang hat hinter seinem
# Knall sofort den Vokal und fällt so heraus. Gemessen am Befund: Schmatzer vor „Doch“ 36 dB über der
# Umgebung, Knacks vor „Also“ nur 23 dB (dahinter beginnt das Einatmen). Darum 20 dB statt der
# vorgeschlagenen 25 dB im Tor; das Dämpfen sucht empfindlicher (15 dB), aber nur in Pausen.
MUND_MAX_S = 0.030
MUND_RAND_S = 0.020
MUND_UMGEBUNG_DB = -50.0
MUND_ABSTAND_DB = 20.0         # Tor auf der fertigen Spur
MUND_DAEMPFEN_DB = (-48.0, 15.0)   # (Umgebung, Abstand) beim Dämpfen der Rohaufnahme
# Spitzenbegrenzer nach der linearen Verstärkung (Abtastwert, dBFS). Die m4a hat zwei Kanäle zu je
# -3 dB, ihre echte Spitze liegt damit klar unter der Grenze von G4 (-1 dBTP).
GRENZE_DBFS = -2.0


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


def anzeige_text(block: dict) -> str:
    """Sprechtext für Stimmen, die Zahlen und Namen selbst richtig lesen (ElevenLabs, Cartesia).

    Regel wie "text_regel" in build/stimme-jonas.json: Anzeige-Seite der Tokens ("45", "Barcelona",
    "Opportunitätskosten"), keine Betonungs-Sternchen, kein "?↑" (das Fragezeichen bleibt), Szenen
    eines Blocks als Absätze. Die Satzzeichen hängen in script.py an der gesprochenen Seite
    ("Opportunitätskosten|Oppor-tunitätskosten:") und wandern an die Anzeige.
    """
    def wort(token: str) -> str:
        if "|" not in token:
            return token
        anzeige, gesprochen = token.split("|", 1)
        zeichen = re.search(r"[.,:;?!…]*$", gesprochen).group()
        return anzeige.rstrip(".,:;?!…") + zeichen
    return "\n\n".join(" ".join(wort(t) for satz in s["sentences"] for t in satz.split())
                       for s in block["szenen"])


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

    Fassung v3: Steht beim Block "wortzeiten" (JSON des Fabrik-Adapters, z. B. Cartesia), gelten die
    Wort-Zeitstempel des Anbieters; dann braucht es weder Piper noch DTW.
    """

    def __init__(self, konfig: dict):
        self.konfig = konfig
        self.piper = None
        # je Block die Quelle ("elevenlabs-connector", "cartesia" ... oder "piper"), für timing.json
        self.quellen = []
        self.anbieter = konfig.get("anbieter", "elevenlabs-connector")

    def synthese(self, text: str, stimme: dict, vorher=None, nachher=None, nr: int = 0):
        from werk.stimme.basis import Ergebnis

        eintrag = self.konfig["bloecke"][nr]
        if eintrag.get("datei") and eintrag.get("wortzeiten"):
            return self._mit_anbieter_zeiten(eintrag, nr)
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
        self.quellen.append(self.anbieter)
        return Ergebnis(audio=roh, format="mp3", abtastrate=RATE, wortzeiten=zeiten,
                        zeichen=sum(len(a) + 1 for a, _ in paare), anbieter=self.anbieter,
                        gesendet=eintrag.get("text", ""))

    def _mit_anbieter_zeiten(self, eintrag: dict, nr: int):
        """Block mit Aufnahme UND Wort-Zeitstempeln des Anbieters (Fassung v3, Cartesia).

        Der Anbieter hat die Anzeige-Seite gesprochen ("45", "Barcelona"), also werden seine Wörter
        gegen die Anzeige-Seite der Tokens zugeordnet (gleiche Zahl: nach Position, sonst difflib).
        Danach setzt an_energie_ausrichten() die Anfänge nach echten Pausen an die Hüllkurve, so wie
        bei den Jonas-Blöcken: Ein Bild soll auf dem Wort landen, nicht auf einem Rechenwert.
        """
        from werk.stimme.basis import Ergebnis

        datei, meta = PROJEKT / eintrag["datei"], PROJEKT / eintrag["wortzeiten"]
        for pfad in (datei, meta):
            if not pfad.is_file():
                raise SystemExit(f"{pfad} fehlt (gitignored). Neu vertonen kostet Zeichen: "
                                 f"python build/voice.py --vertonen <stimm-datei> (nur dieser Block)")
        roh = datei.read_bytes()
        anbieter_zeiten = json.loads(meta.read_text())["wortzeiten"]
        paare = [p for s in bloecke()[nr]["szenen"] for satz in s["sentences"] for p in tokens(satz)]
        zeiten = fuelle_luecken(ordne_zu([(a, a) for a, _ in paare], anbieter_zeiten))
        zeiten = [{**z, "wort": a} for z, (a, _) in zip(zeiten, paare)]
        # Politur: Mundgeräusche in den Pausen dämpfen, BEVOR die Wortanfänge an die Hüllkurve gehen.
        # Sonst gilt ein Schmatzer 70 ms vor „Das“ als Anfang von „Das“ (so in der Abnahme-Fassung).
        audio, gedaempft = mund_daempfen(dekodiere(roh), anbieter_zeiten)
        for g in gedaempft:
            print(f"  Mundgeräusch gedämpft: {g['t']:.3f} s, {g['dauer_ms']} ms, Spitze {g['spitze_db']} dBFS "
                  f"-> {g['gedaempft_db']:+.1f} dB")
        zeiten = an_energie_ausrichten(audio, RATE, zeiten, versatz_standard=0.0)
        self.quellen.append(self.anbieter)
        erg = Ergebnis(audio=roh, format=datei.suffix.lstrip("."), abtastrate=RATE, wortzeiten=zeiten,
                       zeichen=eintrag.get("zeichen", 0), anbieter=self.anbieter,
                       gesendet=eintrag.get("gesendet", eintrag.get("text", "")))
        erg.bereinigt = audio          # main() baut mit der gedämpften Aufnahme weiter, nicht mit roh
        erg.mund = gedaempft
        return erg


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
    pegel = 20 * np.log10(rms)
    # Fassung final (Ton-Kritik): Ein lautes Einatmen nach einer Pause ist kein Wortanfang. Das zweite
    # „Barcelona“ stand 260 ms zu früh, weil der Atem (-40 dBFS) über STILLE_DB lag. Pegel allein
    # trennt Atem und Wort nicht (Atem bis -30 dBFS, ein s oder f am Wortanfang ebenso leise). Darum:
    # Wortanfang = erster STIMMHAFTER Rahmen (Grundton vorhanden) oder ein lauter Rahmen (Plosiv,
    # höchstens 6 dB unter dem Sprachmedian). Als Atem gilt der Abschnitt davor nur, wenn er
    # mindestens ATEM_MIN_S dauert UND im Mittel mindestens 12 dB unter dem Sprachmedian bleibt.
    # Ein kurzes f oder s am Wortanfang (60-120 ms) bleibt so Teil des Worts.
    median_sprache = float(np.median(pegel[~still])) if np.any(~still) else -20.0
    rahmen, lag_min, lag_max = int(0.03 * rate), int(rate / 350), int(rate / 70)

    def stimmhaft(k: int) -> bool:
        x = audio[k * fenster: k * fenster + rahmen].astype(np.float64)
        if len(x) < rahmen or 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12) < median_sprache - 30:
            return False
        x = x - x.mean()
        ak = np.fft.irfft(np.abs(np.fft.rfft(x, 2 * rahmen)) ** 2)[:rahmen]
        return ak[0] > 0 and float(np.max(ak[lag_min:lag_max]) / ak[0]) >= 0.6

    def stimmeinsatz(ab: int) -> tuple[float, float | None]:
        # Stimmhaft UND mit Stimmpegel (ein stimmhaftes Schmatzen bei -40 dBFS ist kein Wort) oder laut
        k = ab
        bis = min(n, ab + int(0.6 * rate / fenster))
        while k < bis and not (stimmhaft(k) and pegel[k] >= median_sprache - 25) and pegel[k] < median_sprache - 6:
            k += 1
        dauer = (k - ab) * fenster / rate
        if k < bis and dauer >= 0.04 and float(np.mean(pegel[ab:k])) <= median_sprache - STIMME_UNTER_DB:
            # leiser, stimmloser Vorlauf (Atem, Schmatzen): Wortanfang dahinter; ab ATEM_MIN_S ist es Atem
            return k * fenster / rate, (ab * fenster / rate if dauer >= ATEM_MIN_S else None)
        return ab * fenster / rate, None

    if len(laut) and neu:
        t, atem = stimmeinsatz(int(laut[0]))
        neu[0]["start"] = round(t, 3)
        if atem is not None:
            neu[0]["atem_start"] = round(atem, 3)
        neu[0]["energie"] = True
        gesetzt.add(0)
    for anfang, ende in luecken:
        # das Wort, dessen Whisper-Anfang dem Ende der Pause am nächsten liegt (höchstens 0,25 s)
        i = min(range(len(neu)), key=lambda q: abs(neu[q]["start"] - ende))
        if abs(neu[i]["start"] - ende) > 0.25 or i in gesetzt:
            continue
        einsatz, atem = stimmeinsatz(int(round(ende * rate / fenster)))
        # die Korrektur misst weiter den Pausen-Rand (Versatz der übrigen Wörter), der Atem ist Sonderfall
        korrekturen.append(ende - neu[i]["start"])
        neu[i]["start"] = round(einsatz, 3)
        if atem is not None:
            neu[i]["atem_start"] = round(atem, 3)
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
    atemzuege = sum(1 for z in neu if "atem_start" in z)
    print(f"  Atem vor dem Stimmeinsatz: {atemzuege} Wörter (Anfang hinter den Atem gesetzt)")
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
    verschoben = [{**w, "start": round(w["start"] - a, 3), "ende": round(w["ende"] - a, 3),
                   **({"atem_start": round(w["atem_start"] - a, 3)} if "atem_start" in w else {})}
                  for w in wortzeiten]
    # Fassung final: 10-ms-Blende an beiden Rändern (Knacks am Blockanfang, Ton-Kritik 33,1 s)
    return blende(audio[int(a * RATE): int(e * RATE)]), verschoben


def luft_einfuegen(audio: np.ndarray, zeiten: list[dict], block: dict) -> tuple[np.ndarray, list[dict], list[dict]]:
    """Setzt "luft" aus script.py in die Aufnahme eines Blocks: Nach dem genannten Wort steht danach
    mindestens so viel Stille. Zeiten sind blockrelativ (nach kappe).

    Geschnitten wird an der leisesten 10-ms-Stelle zwischen den beiden Wörtern (nie in einem Laut),
    eingesetzt wird Raumton (Fassung final; vorher digitale Stille, die mit Kopfhörern wie ein Loch
    klang). Alle späteren Wortzeiten rücken um genau diese Länge nach.
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
        if luecke < sek and sek - luecke < LUFT_MIN_S:
            # Fassung final: unter 100 ms bleibt die Lücke, wie sie ist (vorher 41 ms Null im Atem)
            eintrag["eingesetzt_s"] = 0.0
            eintrag["grund"] = f"fehlen nur {sek - luecke:.3f} s (< {LUFT_MIN_S} s)"
        elif luecke < sek:
            # Fassung final: Geschnitten wird VOR dem Einatmen des nächsten Worts (atem_start), sonst
            # atmete der Sprecher ein und schwieg danach noch (Ton-Kritik „geschenkt | Genau“).
            atem = atem_im_spalt(audio, a, b, sprach_median(audio))
            obergrenze = min(zeiten[i + 1].get("atem_start", b + 0.01), atem[0] if atem else b + 0.01)
            lo = int(max(0.0, a - 0.03) * RATE)
            hi = max(lo + fenster, int(min(len(audio) / RATE, obergrenze) * RATE))
            starts = range(lo, hi - fenster + 1, fenster // 2)
            pegel = [float(np.sqrt(np.mean(audio[k:k + fenster] ** 2))) for k in starts]
            schnitt = list(starts)[int(np.argmin(pegel))] + fenster // 2
            zusatz = sek - luecke
            audio = setze_ein(audio, schnitt, int(round(zusatz * RATE)))
            for z in zeiten[i + 1:]:
                z["start"] = round(z["start"] + zusatz, 3)
                z["ende"] = round(z["ende"] + zusatz, 3)
                if "atem_start" in z:
                    z["atem_start"] = round(z["atem_start"] + zusatz, 3)
            eintrag["eingesetzt_s"] = round(zusatz, 3)
        protokoll.append((i, eintrag))
    # Fassung v3: rel_start erst NACH allen Einfügungen ablesen. Die Schleife läuft von hinten; eine
    # frühere Luft im selben Block (später eingesetzt) schiebt das Wort noch nach hinten. Vorher stand
    # darum z. B. "nach Lohn" 0,93 s zu früh in timing.json (Luft nach "Waage" und "geschenkt").
    for i, eintrag in protokoll:
        eintrag["rel_start"] = zeiten[i]["ende"]
    return audio, zeiten, [e for _, e in protokoll[::-1]]


# ------------------------------------------------------------------------------------------
# Fassung final (Runde 1, Ton-Kritik): Raumton, Blenden, Atem, Lautheit je Satz, Dehnen, Tore
# ------------------------------------------------------------------------------------------
RAUM: dict = {}     # Quelle des Raumtons (leisester Abschnitt der ersten Aufnahme), siehe raumton()


def merke_raumton(audio: np.ndarray) -> None:
    """Sucht in einer Aufnahme die leiseste Viertelsekunde, die NICHT digitale Null ist (Grundrauschen
    des Anbieters, bei Cartesia etwa -70 dBFS). Daraus wird jede eingesetzte Stille gebaut. main()
    ruft das vorab für ALLE Aufnahmen auf: Der leiseste Abschnitt aller Blöcke gewinnt (Block 1 allein
    hat keine ruhige Viertelsekunde; sein leisester Abschnitt war ein Atemzug bei -53 dBFS)."""
    n = int(0.25 * RATE)
    schritt = RATE // 100
    beste, wert = None, RAUM.get("db", -55.0)     # nur leiser als das Bisherige (und als -55 dBFS)
    for k in range(0, max(1, len(audio) - n), schritt):
        stueck = audio[k:k + n]
        r = 20 * np.log10(np.sqrt(np.mean(stueck ** 2)) + 1e-12)
        if -85 < r < wert and np.mean(stueck == 0) < 0.05:
            beste, wert = stueck.copy(), r
    if beste is None:
        return                        # raumton() nimmt sonst leises Rauschen (-72 dBFS, fester Startwert)
    RAUM["quelle"], RAUM["db"] = beste.astype(np.float32), round(float(wert), 1)


def raumton(laenge: int) -> np.ndarray:
    """Raumton beliebiger Länge: Stücke der Quelle, je um 20 ms überblendet (kein hörbares Muster)."""
    if laenge <= 0:
        return np.zeros(0, np.float32)
    q = RAUM.get("quelle")
    if q is None:
        RAUM["quelle"] = (np.random.default_rng(7).standard_normal(int(0.25 * RATE)) * 10 ** (-72 / 20)).astype(np.float32)
        RAUM["db"] = -72.0
        q = RAUM["quelle"]
    ueber = int(0.02 * RATE)
    rampe = np.linspace(0, 1, ueber, dtype=np.float32)
    aus = q[: min(len(q), laenge)].copy()
    rng = np.random.default_rng(laenge)       # fester Startwert: gleiche Länge, gleicher Raumton
    while len(aus) < laenge:
        start = int(rng.integers(0, max(1, len(q) - ueber - 1)))
        stueck = q[start:]
        aus[-ueber:] = aus[-ueber:] * (1 - rampe) + stueck[:ueber] * rampe
        aus = np.concatenate([aus, stueck[ueber:]])
    # Auch das leiseste Stück einer Aufnahme kann einen Knacks tragen; gekachelt käme er wieder.
    return entklicke(aus[:laenge].astype(np.float32))[0]


def blende(audio: np.ndarray, sek: float = BLENDE_S) -> np.ndarray:
    """10-ms-Blende am Anfang und am Ende (ein Stück Audio beginnt und endet bei null)."""
    n = min(int(sek * RATE), len(audio) // 2)
    if n <= 0:
        return audio
    aus = audio.copy()
    rampe = np.linspace(0, 1, n, dtype=np.float32)
    aus[:n] *= rampe
    aus[-n:] *= rampe[::-1]
    return aus


def setze_ein(audio: np.ndarray, schnitt: int, laenge: int) -> np.ndarray:
    """Setzt bei Sample `schnitt` Raumton der Länge `laenge` ein. Beide Kanten werden über BLENDE_S
    überblendet (Aufnahme aus, Raumton ein und umgekehrt); der Raumton ist dafür um 2 x BLENDE_S
    länger, so wächst die Aufnahme um genau `laenge` Samples."""
    n = int(BLENDE_S * RATE)
    links, rechts = audio[:schnitt].astype(np.float32), audio[schnitt:].astype(np.float32)
    if len(links) < n or len(rechts) < n:
        return np.concatenate([links, raumton(laenge), rechts]).astype(np.float32)
    mitte = raumton(laenge + 2 * n)
    r = np.linspace(0, 1, n, dtype=np.float32)
    mitte[:n] = mitte[:n] * r + links[-n:] * r[::-1]
    mitte[-n:] = mitte[-n:] * r[::-1] + rechts[:n] * r
    return np.concatenate([links[:-n], mitte, rechts[n:]]).astype(np.float32)


def stille(sek: float) -> np.ndarray:
    """Deklarierte Pause (Vorlauf, Denkpause, Atempause, Halten) als Raumton mit weichen Kanten."""
    return blende(raumton(int(round(sek * RATE))))


def atem_im_spalt(audio: np.ndarray, t0: float, t1: float, median_db: float) -> tuple[float, float] | None:
    """Ein Einatmen zwischen dem Ende eines Worts (t0) und dem Anfang des nächsten (t1): leise
    (15 bis 40 dB unter dem Sprachmedian), stimmlos, zusammen >= 80 ms, VOR dem ersten Rahmen mit
    Sprachpegel. Gibt (Anfang, Ende) zurück oder None."""
    f = RATE // 200
    k0, k1 = int((t0 + 0.03) * 200), int((t1 + 0.05) * 200)
    rahmen, lag_min, lag_max = int(0.03 * RATE), int(RATE / 350), int(RATE / 70)
    treffer = []
    for k in range(k0, min(k1, len(audio) // f - 1)):
        x = audio[k * f:(k + 1) * f].astype(np.float64)
        pegel = 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
        if pegel >= median_db - 12:
            break                                    # hier beginnt das Wort
        if median_db - 40 <= pegel <= median_db - 15:
            y = audio[k * f:k * f + rahmen].astype(np.float64)
            y = y - y.mean()
            ak = np.fft.irfft(np.abs(np.fft.rfft(y, 2 * rahmen)) ** 2)[:rahmen]
            if ak[0] > 0 and np.max(ak[lag_min:lag_max]) / ak[0] < 0.5:
                treffer.append(k)
    if len(treffer) * 0.005 < 0.08:
        return None
    return treffer[0] / 200, (treffer[-1] + 1) / 200


def sprach_median(audio: np.ndarray) -> float:
    """Median des 5-ms-Pegels über allen Rahmen mit Sprache (über STILLE_DB)."""
    f = RATE // 200
    n = len(audio) // f
    pegel = 20 * np.log10(np.sqrt(np.mean(audio[: n * f].reshape(n, f) ** 2, axis=1)) + 1e-12)
    laut = pegel[pegel > STILLE_DB]
    return float(np.median(laut)) if len(laut) else -20.0


def atem_daempfen(audio: np.ndarray, zeiten: list[dict]) -> tuple[np.ndarray, int]:
    """Jedes Einatmen zwischen zwei Wörtern wird um ATEM_DB leiser, mit 10-ms-Rampen (nicht entfernt).
    Vorher standen laute Atemzüge neben toter Stille (Ton-Kritik); jetzt klingt jeder gleich."""
    aus = audio.copy()
    n_r = int(BLENDE_S * RATE)
    faktor = np.float32(10 ** (ATEM_DB / 20))
    med = sprach_median(audio)
    zahl = 0
    for z0, z1 in zip(zeiten, zeiten[1:]):
        if z1["start"] - z0["ende"] < 0.2:
            continue
        atem = atem_im_spalt(audio, z0["ende"], z1["start"], med)
        if not atem:
            continue
        a, b = int((atem[0] - 0.01) * RATE), int((atem[1] + 0.01) * RATE)
        if b - a < 2 * n_r:
            continue
        huelle = np.full(b - a, faktor, np.float32)
        huelle[:n_r] = np.linspace(1, faktor, n_r)
        huelle[-n_r:] = np.linspace(faktor, 1, n_r)
        aus[a:b] *= huelle
        zahl += 1
    return aus, zahl


def lufs(audio: np.ndarray) -> float | None:
    """Integrierte Lautheit (ebur128) eines Stücks; None, wenn es zu kurz oder zu leise ist."""
    puffer = io.BytesIO()
    with wave.open(puffer, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes((np.clip(audio, -1, 1) * 32767).astype("<i2").tobytes())
    r = ffmpeg("-i", "pipe:0", "-af", "ebur128", "-f", "null", "-", eingabe=puffer.getvalue())
    werte = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr.decode())
    wert = float(werte[-1]) if werte else None
    return wert if wert is not None and wert > -70 else None


def nur_sprache(audio: np.ndarray, woerter: list[dict], rate: int = RATE) -> np.ndarray:
    """Die Wörter eines Satzes aneinander, ohne die Pausen dazwischen (Luft, Komma): Gemessen wird
    die Lautheit der Stimme, nicht die der Stille. Mit Pause las sich „Behalten: keinen Cent“ leise."""
    teile = [audio[int(max(0, w["start"] - 0.01) * rate):int((w["ende"] if "ende" in w else w["end"]) * rate + 0.01 * rate)]
             for w in woerter]
    return np.concatenate(teile) if teile else np.zeros(0, np.float32)


def entklicke(audio: np.ndarray) -> tuple[np.ndarray, int]:
    """Knackser in der Aufnahme selbst (Cartesia: einzelne 1-ms-Spitzen in leiser Umgebung, z. B. vor
    „Du“ und „Also“): Die Spitze wird über 6 ms mit einer Hann-förmigen Senke auf den Pegel ihrer
    Umgebung gedrückt. Plosive zählt klicks() nicht mit, sie bleiben unberührt."""
    aus = audio.copy()
    # vor dem Mastering liegt alles rund 4-8 dB tiefer: hier auch leisere Spitzen suchen
    gefunden = klicks(aus, RATE, min_spitze_db=-68.0)
    breite = int(0.006 * RATE)
    for k in gefunden:
        mitte = int(k["t"] * RATE) + (RATE // 1000) // 2
        a, b = max(0, mitte - breite // 2), min(len(aus), mitte + breite // 2)
        ziel = 10 ** ((k["umgebung_db"] + 3 - k["spitze_db"]) / 20)
        senke = 1 - (1 - ziel) * np.hanning(b - a)
        aus[a:b] *= senke.astype(np.float32)
    return aus, len(gefunden)


def satz_grenzen(block: dict, zeiten: list[dict]) -> list[tuple[int, int, str]]:
    """(erstes Wort, letztes Wort, Text) je Satz eines Blocks, Indizes in zeiten."""
    aus, i = [], 0
    for s in block["szenen"]:
        for satz in s["sentences"]:
            n = len(tokens(satz))
            aus.append((i, i + n - 1, satz))
            i += n
    return aus


def saetze_angleichen(audio: np.ndarray, zeiten: list[dict], block: dict) -> tuple[np.ndarray, list[dict]]:
    """Lautheit je Satz (Ton-Kritik P1: die Leitfrage war 5 LU leiser als der erste Satz, „Das stimmt
    nicht“ ebenso leise). Jeder Satz kommt bis auf SATZ_TOLERANZ_LU an BLOCK_LUFS heran; die Grenze
    zwischen zwei Sätzen liegt in der Mitte der Pause, dort wechselt die Verstärkung über 20 ms."""
    grenzen = satz_grenzen(block, zeiten)
    huelle = np.ones(len(audio), np.float32)
    protokoll = []
    rampe = int(0.02 * RATE)
    for k, (i0, i1, text) in enumerate(grenzen):
        a, b = zeiten[i0]["start"], zeiten[i1]["ende"]
        wert = lufs(nur_sprache(audio, zeiten[i0:i1 + 1]))
        if wert is None:
            continue
        d = BLOCK_LUFS - wert
        korrektur = 0.0 if abs(d) <= SATZ_TOLERANZ_LU else float(np.clip(np.sign(d) * (abs(d) - SATZ_TOLERANZ_LU),
                                                                         -SATZ_MAX_DB, SATZ_MAX_DB))
        protokoll.append({"satz": text, "lufs_vorher": round(wert, 1), "korrektur_db": round(korrektur, 1)})
        if not korrektur:
            continue
        links = 0.0 if k == 0 else (zeiten[grenzen[k - 1][1]]["ende"] + a) / 2
        rechts = len(audio) / RATE if k == len(grenzen) - 1 else (b + zeiten[grenzen[k + 1][0]].get("atem_start", zeiten[grenzen[k + 1][0]]["start"])) / 2
        x0, x1 = int(links * RATE), int(rechts * RATE)
        g = np.float32(10 ** (korrektur / 20))
        stueck = np.full(x1 - x0, g, np.float32)
        if k > 0 and len(stueck) > 2 * rampe:
            stueck[:rampe] = np.linspace(1, g, rampe)
        if k < len(grenzen) - 1 and len(stueck) > 2 * rampe:
            stueck[-rampe:] = np.linspace(g, 1, rampe)
        huelle[x0:x1] = stueck
    return (audio * huelle).astype(np.float32), protokoll


def dehne_saetze(audio: np.ndarray, zeiten: list[dict], block: dict) -> tuple[np.ndarray, list[dict], list[dict]]:
    """"dehnen" aus script.py: {Satzanfang: Faktor}. Der Satz wird um den Faktor länger (rubberband,
    Tonhöhe und Formanten bleiben). Wortzeiten im Satz werden mitgestreckt, alle späteren rücken nach.
    Für Kernsätze, die der Anbieter trotz Tempo-Wert zu schnell spricht (Cartesia: 0,8 statt 1,05
    machte die Definition nur 3 % langsamer)."""
    ziele = []
    grenzen = satz_grenzen(block, zeiten)
    for s in block["szenen"]:
        for anfang, faktor in s.get("dehnen", {}).items():
            treffer = [g for g in grenzen if satzkern(g[2]).startswith(satzkern(anfang))]
            if len(treffer) != 1:
                raise SystemExit(f"dehnen: Satz „{anfang}“ in Szene {s['id']} nicht eindeutig gefunden")
            ziele.append((treffer[0], float(faktor)))
    zeiten = [dict(z) for z in zeiten]
    protokoll = []
    for (i0, i1, text), faktor in sorted(ziele, key=lambda x: -x[0][0]):     # von hinten
        a = max(0.0, zeiten[i0]["start"] - 0.02)
        b = min(len(audio) / RATE, zeiten[i1]["ende"] + 0.02)
        x0, x1 = int(a * RATE), int(b * RATE)
        puffer = io.BytesIO()
        with wave.open(puffer, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(RATE)
            w.writeframes((np.clip(audio[x0:x1], -1, 1) * 32767).astype("<i2").tobytes())
        r = ffmpeg("-i", "pipe:0", "-af", f"rubberband=tempo={1 / faktor:.5f}:formant=preserved:pitchq=quality",
                   "-f", "f32le", "-acodec", "pcm_f32le", "-ac", "1", "-ar", str(RATE), "pipe:1",
                   eingabe=puffer.getvalue())
        neu = np.frombuffer(r.stdout, dtype=np.float32).copy()
        echt = len(neu) / (x1 - x0)
        audio = np.concatenate([audio[:x0], blende(neu, 0.005), audio[x1:]]).astype(np.float32)
        delta = len(neu) / RATE - (b - a)
        for j, z in enumerate(zeiten):
            for feld in ("start", "ende", "atem_start"):
                if feld not in z:
                    continue
                t = z[feld]
                if j < i0 and feld != "atem_start":
                    continue
                if a <= t <= b:
                    z[feld] = round(a + (t - a) * echt, 3)
                elif t > b:
                    z[feld] = round(t + delta, 3)
        protokoll.append({"satz": text, "faktor": faktor, "gemessen": round(echt, 3), "plus_s": round(delta, 3)})
        print(f"  gedehnt ×{echt:.3f}: {text}")
    return audio, zeiten, protokoll[::-1]


def satzkern(text: str) -> str:
    """Satz ohne Aussprache-Seite und Satzzeichen, zum Vergleichen ("Das Beste, was …" = "Das Beste was …")."""
    return " ".join(re.sub(r"[^\w\s]", "", re.sub(r"\|\S+", "", text)).split())


def silben(wort: str) -> int:
    """Silben eines deutschen Worts, grob: Gruppen von Vokalen (Diphthonge zählen einmal)."""
    return max(1, len(re.findall(r"[aeiouäöüy]+", wort.casefold())))


def klicks(a: np.ndarray, rate: int, umgebung_db: float = -45.0, abstand_db: float = 15.0,
           min_spitze_db: float = -55.0) -> list[dict]:
    """Knackser: eine 1-ms-Spitze, mehr als abstand_db über ihrer leisen Umgebung (je 25 ms davor und
    danach unter umgebung_db), und schon 2 ms daneben wieder leise. Ein Plosiv (t, k) ist länger und
    hat Sprache neben sich; ihn zählt das Tor nicht."""
    f = rate // 1000
    n = len(a) // f
    blk = a[: n * f].reshape(n, f).astype(np.float64)
    spitze = 20 * np.log10(np.abs(blk).max(1) + 1e-9)
    rms1 = 10 * np.log10((blk ** 2).mean(1) + 1e-12)
    c = np.concatenate([[0], np.cumsum((blk ** 2).sum(1))])
    k, aus = 25, []
    for i in range(k, n - k):
        if spitze[i] < min_spitze_db:
            continue
        vor = 10 * np.log10((c[i - 2] - c[i - k]) / ((k - 2) * f) + 1e-12)
        nach = 10 * np.log10((c[i + k + 1] - c[i + 3]) / ((k - 2) * f) + 1e-12)
        u = max(vor, nach)
        if u >= umgebung_db or spitze[i] < u + abstand_db + 3:
            continue
        if np.r_[rms1[i - 5:i - 1], rms1[i + 2:i + 6]].max() > u + 10:
            continue
        t = i * f / rate          # Blöcke sind f = rate // 1000 Samples lang (44 bei 44,1 kHz, nicht genau 1 ms)
        if aus and t - aus[-1]["t"] < 0.02:
            continue
        aus.append({"t": round(t, 4), "spitze_db": round(float(spitze[i]), 1), "umgebung_db": round(float(u), 1)})
    return aus


def mundgeraeusche(a: np.ndarray, rate: int, umgebung_db: float = MUND_UMGEBUNG_DB,
                   abstand_db: float = MUND_ABSTAND_DB) -> list[dict]:
    """Mundgeräusche (Politur, Abnahme final): Schmatzer und Knackse bis MUND_MAX_S.

    klicks() sieht nur 1-ms-Spitzen, die 2 ms daneben wieder leise sind. Ein Schmatzer dauert aber
    10-30 ms (Befund: 15,93 s vor „Doch“, 20 ms; 60,60 s vor „Also“, 11 ms). Hier:
      1. Läufe lauter 1-ms-Blöcke (über umgebung_db); Lücken bis 4 ms gehören zum Lauf.
      2. Ein Lauf bis MUND_MAX_S zählt, wenn je MUND_RAND_S davor und dahinter leise sind (unter
         umgebung_db) und seine Spitze mehr als abstand_db über BEIDEN Umgebungen liegt.
    Ein Wortanfang fällt heraus (hinter dem Knall kommt sofort der Vokal), ebenso jedes längere
    Geräusch (Atem). Ein Plosiv am Wortende (das t von „aufgibt“) kann die Bedingung erfüllen; darum
    trennen Dämpfen und Tor danach, ob der Lauf in einer Pause oder in einem Wort liegt.
    """
    f = rate // 1000
    n = len(a) // f
    blk = a[: n * f].reshape(n, f).astype(np.float64)
    rms1 = 10 * np.log10((blk ** 2).mean(1) + 1e-12)
    laut = rms1 > umgebung_db
    laeufe, k = [], 0
    while k < n:
        if laut[k]:
            j = k
            while j < n and laut[j]:
                j += 1
            if laeufe and k - laeufe[-1][1] <= 4:
                laeufe[-1][1] = j                 # kurze Lücke: derselbe Lauf
            else:
                laeufe.append([k, j])
            k = j
        else:
            k += 1
    rand = int(round(MUND_RAND_S * rate / f))
    aus = []
    for k0, k1 in laeufe:
        if (k1 - k0) * f / rate > MUND_MAX_S or k0 < rand or k1 + rand > n:
            continue
        vor = 10 * np.log10((blk[k0 - rand:k0] ** 2).mean() + 1e-12)
        nach = 10 * np.log10((blk[k1:k1 + rand] ** 2).mean() + 1e-12)
        spitze = 20 * np.log10(np.abs(blk[k0:k1]).max() + 1e-12)
        if vor < umgebung_db and nach < umgebung_db and spitze > max(vor, nach) + abstand_db:
            aus.append({"t": round(k0 * f / rate, 3), "ende": round(k1 * f / rate, 3),
                        "spitze_db": round(float(spitze), 1), "vor_db": round(float(vor), 1),
                        "nach_db": round(float(nach), 1), "lauf_db": round(float(rms1[k0:k1].max()), 1),
                        "bloecke": [int(k0), int(k1)]})          # Blöcke zu f Samples (für mund_daempfen)
    return aus


def im_wort(geraeusch: dict, woerter: list[dict]) -> str | None:
    """Das Wort, in dem ein Geräusch liegt, sonst None (= Pause). Die ersten 30 ms eines Worts zählen
    nicht: Ein Knall mit 20 ms Ruhe dahinter ist kein Laut des Worts, auch wenn der Zeitstempel des
    Anbieters (oder die Hüllkurve) das Wort schon dort beginnen lässt."""
    for w in woerter:
        ende = w["ende"] if "ende" in w else w["end"]
        if geraeusch["ende"] > w["start"] + 0.03 and geraeusch["t"] < ende:
            return w.get("wort") or w.get("text")
    return None


def mund_daempfen(audio: np.ndarray, woerter: list[dict]) -> tuple[np.ndarray, list[dict]]:
    """Mundgeräusche in Pausen auf den Pegel ihrer Umgebung (+3 dB) dämpfen, weich über 5 ms.
    Wie der Atem nicht entfernt, sondern leiser. Gedämpft wird je 1-ms-Block nur so weit, wie er über
    der Umgebung liegt: Ein fester Faktor für den ganzen Lauf drückte die leisen Stellen darin (den
    Raumton) auf -90 dBFS, ein kleines Loch. Läuft auf der Rohaufnahme mit den Wortzeiten des
    Anbieters, vor an_energie_ausrichten()."""
    aus = audio.copy()
    umgebung, abstand = MUND_DAEMPFEN_DB
    f = RATE // 1000
    rand = 10                              # 10 ms Platz für die weichen Kanten
    kern = np.hanning(int(0.005 * RATE))
    kern /= kern.sum()
    protokoll = []
    for g in mundgeraeusche(audio, RATE, umgebung, abstand):
        wort = im_wort(g, woerter)
        if wort:
            continue                       # Laut im Wort (Plosiv am Wortende): bleibt
        ziel = max(g["vor_db"], g["nach_db"]) + 3
        k0, k1 = g["bloecke"]                  # 1-ms-Blöcke (f Samples) wie in mundgeraeusche()
        kx = max(0, k0 - rand)
        x0, x1 = kx * f, min(len(aus), (k1 + rand) * f)
        stueck = aus[x0:x1].astype(np.float64)
        n = len(stueck) // f
        pegel = 10 * np.log10((stueck[: n * f].reshape(n, f) ** 2).mean(1) + 1e-12)
        dbs = np.zeros(n)
        innen = slice(k0 - kx, k1 - kx)
        dbs[innen] = np.minimum(0.0, ziel - pegel[innen])
        # Minimum über ±2 ms (kein Rest einer Spitze an der Blockkante), dann weich glätten
        dbs = np.array([dbs[max(0, i - 2):i + 3].min() for i in range(n)])
        verlauf = np.convolve(np.repeat(dbs, f), kern, mode="same")
        verlauf = np.concatenate([verlauf, np.zeros(len(stueck) - len(verlauf))])
        if verlauf.min() > -1:
            continue
        aus[x0:x1] = (stueck * 10 ** (verlauf / 20)).astype(np.float32)
        protokoll.append({"t": g["t"], "dauer_ms": round((g["ende"] - g["t"]) * 1000),
                          "spitze_db": g["spitze_db"], "umgebung_db": max(g["vor_db"], g["nach_db"]),
                          "gedaempft_db": round(float(verlauf.min()), 1)})
    return aus, protokoll


def pruefe_ton(timing: dict, wav: Path) -> dict:
    """Tore der Ton-Kritik (Fassung final) auf der FERTIGEN Spur (voice.wav, gemastert):
      1. Satz-Lautheit: lautester minus leisester Satz <= SATZ_SPANNE_LU (ebur128 je Satz), auf zwei
         Arten (Politur): nur über die Wörter ("lufs") und über den ganzen Satz vom ersten bis zum
         letzten Wort, Pausen im Satz inklusive ("lufs_satz", so maß die Abnahme). Beide müssen halten.
      2. Knackser: 0 (klicks()), und 0 Mundgeräusche in Pausen (mundgeraeusche(), Politur). Ein
         Geräusch im Wort (Plosiv am Wortende) steht als Hinweis da, ohne das Tor zu sperren.
      3. Tempo: Kernsätze (script.KERNSAETZE) <= KERN_SILBEN_S und nicht schneller als der Median
         aller Sätze; WARNSAETZE nur als Warnung.
      4. Betonung (nur Warnung): Das betonte Wort ("betont" in script.py) hat seinen Gipfel >= +3
         Halbtöne oder >= +2 dB über dem Median seines Satzes. Cartesia kennt kein Betonungs-Markup;
         das Tor zeigt, wo der Satzbau die Betonung nicht trägt.
    """
    with wave.open(str(wav)) as w:
        rate = w.getframerate()
        a = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float32) / 32768
    saetze = []
    for sc in timing["scenes"]:
        for satz in sc["sentences"]:
            w0, w1 = satz["words"][0], satz["words"][-1]
            dauer = w1["end"] - w0["start"]
            sil = sum(silben(w.get("spoken") or w["text"]) for w in satz["words"])
            saetze.append({"szene": sc["id"], "satz": satz["text"], "start": w0["start"], "ende": w1["end"],
                           "lufs": lufs(nur_sprache(a, satz["words"], rate)),
                           "lufs_satz": lufs(a[int(w0["start"] * rate):int(w1["end"] * rate)]),
                           "silben_s": round(sil / dauer, 2)})
    werte = [s["lufs"] for s in saetze if s["lufs"] is not None]
    spanne = round(max(werte) - min(werte), 1)
    werte_satz = [s["lufs_satz"] for s in saetze if s["lufs_satz"] is not None]
    spanne_satz = round(max(werte_satz) - min(werte_satz), 1)
    # Mundgeräusche: in einer Pause sperrt das Tor, in einem Wort ist es ein Hinweis (Plosiv am Ende)
    alle_woerter = [w for sc in timing["scenes"] for st in sc["sentences"] for w in st["words"]]
    mund = [{**{k: v for k, v in g.items() if k != "bloecke"}, "wort": im_wort(g, alle_woerter)}
            for g in mundgeraeusche(a, rate)]
    mund_pause = [g for g in mund if not g["wort"]]
    median_tempo = float(np.median([s["silben_s"] for s in saetze]))
    kern, warn = [], []
    for s in saetze:
        if any(satzkern(s["satz"]).startswith(satzkern(k)) for k in KERNSAETZE):
            kern.append({**s, "ok": bool(s["silben_s"] <= KERN_SILBEN_S and s["silben_s"] <= median_tempo)})
        if any(satzkern(s["satz"]).startswith(satzkern(k)) for k in WARNSAETZE):
            warn.append({**s, "ok": bool(s["silben_s"] <= median_tempo)})
    # Betonung
    betonung = []
    betont = {sc["id"]: sc.get("betont", []) for sc in SCENES}
    for sc in timing["scenes"]:
        alle = [w for satz in sc["sentences"] for w in satz["words"]]
        szene = next(x for x in SCENES if x["id"] == sc["id"])
        for wort in betont.get(sc["id"], []):
            idx = finde_wort(szene, wort)
            w = alle[idx]
            satz = next(st for st in sc["sentences"] if w in st["words"])
            f_satz = [f for _, f in f0_kontur(a, rate, satz["start"], satz["end"])]
            f_wort = [f for _, f in f0_kontur(a, rate, w["start"], w["end"])]
            r = lambda t0, t1: 20 * np.log10(np.sqrt(np.mean(a[int(t0 * rate):int(t1 * rate)] ** 2)) + 1e-9)
            ht = float(round(12 * np.log2(max(f_wort) / np.median(f_satz)), 1)) if f_wort and f_satz else None
            db = round(float(r(w["start"], w["end"]) - r(satz["start"], satz["end"])), 1)
            betonung.append({"szene": sc["id"], "wort": w["text"], "halbtoene": ht, "db": db,
                             "ok": bool((ht is not None and ht >= 3) or db >= 2)})
    schnellster = max(saetze, key=lambda s: s["silben_s"])
    ergebnis = {
        "lautheit": {"spanne_lu": float(spanne), "spanne_satz_lu": float(spanne_satz), "grenze_lu": SATZ_SPANNE_LU,
                     "ok": bool(spanne <= SATZ_SPANNE_LU and spanne_satz <= SATZ_SPANNE_LU),
                     "leisester": min(saetze, key=lambda s: s["lufs"] or 0)["satz"],
                     "lautester": max(saetze, key=lambda s: s["lufs"] or -99)["satz"],
                     "leisester_satz": min(saetze, key=lambda s: s["lufs_satz"] or 0)["satz"],
                     "lautester_satz": max(saetze, key=lambda s: s["lufs_satz"] or -99)["satz"]},
        "klicks": klicks(a, rate),
        "mundgeraeusche": {"in_pausen": mund_pause, "in_woertern": [g for g in mund if g["wort"]],
                           "abstand_db": MUND_ABSTAND_DB, "umgebung_db": MUND_UMGEBUNG_DB, "ok": not mund_pause},
        "tempo": {"median_silben_s": round(median_tempo, 2), "grenze_kern": KERN_SILBEN_S,
                  "kernsaetze": kern, "warnsaetze": warn, "ok": all(k["ok"] for k in kern),
                  "schnellster": {"satz": schnellster["satz"], "silben_s": schnellster["silben_s"]}},
        "betonung": {"woerter": betonung, "getragen": sum(b["ok"] for b in betonung), "von": len(betonung),
                     "hinweis": "nur Warnung: Cartesia kennt keine Betonung, der Satzbau muss sie tragen"},
        "saetze": [{k: v for k, v in s.items() if k in ("satz", "lufs", "lufs_satz", "silben_s")} for s in saetze],
    }
    ergebnis["ok"] = bool(ergebnis["lautheit"]["ok"] and not ergebnis["klicks"] and ergebnis["tempo"]["ok"]
                          and ergebnis["mundgeraeusche"]["ok"])
    print(f"Tor Satz-Lautheit: Spanne {spanne} LU über die Wörter, {spanne_satz} LU über den ganzen Satz "
          f"({'ok' if ergebnis['lautheit']['ok'] else 'ZU GROSS'}; leisester: {ergebnis['lautheit']['leisester']} / "
          f"{ergebnis['lautheit']['leisester_satz']})")
    print(f"Tor Knackser: {len(ergebnis['klicks'])} " + " ".join(f"{k['t']} s" for k in ergebnis["klicks"]))
    print(f"Tor Mundgeräusche in Pausen: {len(mund_pause)} " + " ".join(f"{g['t']} s" for g in mund_pause)
          + (f"; im Wort (Hinweis): " + ", ".join(f"{g['t']} s {g['wort']}" for g in mund if g["wort"])
             if any(g["wort"] for g in mund) else ""))
    print(f"Tempo: schnellster Satz {schnellster['silben_s']} Silben/s: {schnellster['satz']}")
    for k in kern + warn:
        art = "Kernsatz" if k in kern else "Warnsatz"
        print(f"Tor Tempo {art}: {k['silben_s']} Silben/s (Median {median_tempo:.2f}) {'ok' if k['ok'] else 'ZU SCHNELL'}: {k['satz']}")
    print(f"Betonung (Warnung): {ergebnis['betonung']['getragen']} von {len(betonung)} betonten Wörtern tragen den Gipfel; "
          "nicht: " + ", ".join(b["wort"] for b in betonung if not b["ok"]))
    return ergebnis


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
    # Politur (Abnahme final, Satz-Lautheit): Bis hier stand loudnorm mit linear=true. Das gilt nur, wenn
    # die Verstärkung die Spitze unter TP lässt; sonst schaltet loudnorm STILL in den dynamischen Modus
    # ("normalization_type": "dynamic"). So war es: +8,4 dB hätten -7,9 dBTP auf +0,5 gehoben. Der
    # dynamische Modus regelt über 3-s-Fenster nach, und der erste Satz kam 2 dB lauter als der Rest.
    # Jetzt: feste Verstärkung, danach ein Spitzenbegrenzer. latency=true gleicht seine Vorschau aus,
    # die Zeit verschiebt sich nicht (geprüft per Kreuzkorrelation: gleicher Versatz wie vorher).
    begrenzer = (f"alimiter=limit={10 ** (GRENZE_DBFS / 20):.4f}:attack=5:release=50"
                 ":level=false:latency=true")

    def integriert(filter_: str) -> float:
        r = ffmpeg("-i", str(roh), "-af", filter_ + ",ebur128", "-f", "null", "-")
        return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr.decode())[-1])

    roh_lufs = integriert(kette)
    verstaerkung = -16.0 - roh_lufs
    # Der Begrenzer nimmt ein wenig Lautheit weg: einmal nachmessen und die Verstärkung nachstellen.
    verstaerkung += -16.0 - integriert(f"{kette},volume={verstaerkung:.3f}dB,{begrenzer}")
    ffmpeg("-y", "-i", str(roh), "-af", f"{kette},volume={verstaerkung:.3f}dB,{begrenzer}",
           "-ar", str(RATE), "-ac", "1", "-c:a", "pcm_s16le", str(ziel_wav))
    mastere.protokoll = {"normalisierung": "linear (feste Verstärkung + Begrenzer)",
                         "lufs_vor_verstaerkung": roh_lufs, "verstaerkung_db": round(verstaerkung, 2),
                         "begrenzer_dbfs": GRENZE_DBFS}
    # Fassung final: Der 80-Hz-Hochpass nimmt dem leisen Atem seinen tiefen Anteil; ein kleiner Knacks
    # darin steht danach frei (vorher 14 dB, danach 23 dB über der Umgebung). Darum ein letzter
    # Durchgang auf der gemasterten Spur. Er ändert die Länge nicht und die Lautheit nicht messbar.
    with wave.open(str(ziel_wav)) as w:
        roh_pcm = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float32) / 32768
    sauber, zahl = entklicke(roh_pcm)
    if zahl:
        with wave.open(str(ziel_wav), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(RATE)
            w.writeframes((np.clip(sauber, -1, 1) * 32767).astype("<i2").tobytes())
    mastere.entklickt = zahl
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
    # Fassung final (Ton-Kritik): Schwelle relativ zum Sprachpegel (Median minus STIMME_UNTER_DB), nicht
    # fest bei -45 dBFS. Ein Einatmen (bis -30 dBFS) zählte sonst als Wortanfang.
    schwelle = sprach_median(a) - STIMME_UNTER_DB
    abw = {}
    for i, wd in enumerate(woerter):
        if i == 0 or wd["start"] - woerter[i - 1]["end"] < 0.25:
            continue
        k = int((wd["start"] - 0.12) * rate)
        while k < len(a) - schritt and 20 * np.log10(np.sqrt(np.mean(a[k:k + schritt] ** 2)) + 1e-9) < schwelle:
            k += schritt
        abw[f"{wd['text']}@{wd['start']}"] = round((k / rate - wd["start"]) * 1000)
    werte = [abs(v) for v in abw.values()]
    return {"verfahren": f"Stimmeinsatz nach Pausen (>= 0,25 s), Schwelle Sprachmedian - {STIMME_UNTER_DB:.0f} dB "
                         f"({schwelle:.1f} dBFS)",
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
# Fassung v3: Blöcke einer Stimm-Datei über einen Fabrik-Adapter vertonen (Cartesia)
# ------------------------------------------------------------------------------------------

def vertone_bloecke(stimm_pfad: Path, nummern: list[int] | None = None, neu_grund: str | None = None) -> None:
    """Vertont jeden Block der Stimm-Datei, der noch keine Aufnahme hat, mit GENAU einem Aufruf.

    Kostenregel (jeder Aufruf kostet Zeichen):
      - Liegt die Aufnahme schon da, wird nichts gesendet.
      - Eine Wache um basis.TRANSPORT lässt je Block nur EINEN POST durch. sende() würde bei 429/5xx
        oder einem abgerissenen Download sonst selbst wiederholen.
      - Eine zweite Aufnahme desselben Blocks gibt es nur mit --neu-grund (die erste ist nachweislich
        fehlerhaft, z. B. ein Tor in pruefe_saetze ist rot); die alte Datei bleibt unter "verworfen"
        vermerkt. Mehr als zwei Aufrufe je Block verweigert die Funktion.
    Der Schlüssel kommt aus der Umgebung (CARTESIA_API_KEY) oder in der Cloud vom Agent-Proxy. Er
    steht nie in einer Datei; gespeichert werden nur Aufnahme, Wortzeiten und gesendeter Text.
    """
    import datetime
    import hashlib
    from zoneinfo import ZoneInfo

    from werk import stimme as fabrik_stimme
    from werk.stimme import basis

    heute = str(datetime.datetime.now(ZoneInfo("Europe/Berlin")).date())   # Datum wie in factory/config.json
    konfig = json.loads(stimm_pfad.read_text())
    s = {**fabrik_stimme.lade_stimme(konfig["anbieter"]), "stimm_id": konfig["voice_id"],
         "modell": konfig["modell"], "tempo": konfig.get("tempo")}
    ordner = CACHE / konfig["anbieter"]
    ordner.mkdir(parents=True, exist_ok=True)
    echt, posts = basis.TRANSPORT, {"n": 0}

    def wache(anfrage):
        if anfrage.methode == "POST":
            posts["n"] += 1
            if posts["n"] > 1:
                raise RuntimeError("Wache: zweiter POST für denselben Block verweigert (kostet Zeichen)")
        return echt(anfrage)

    basis.TRANSPORT = wache
    try:
        for eintrag in konfig["bloecke"]:
            nr = eintrag["nr"]
            if nummern and nr not in nummern:
                continue
            # Der Text in der Stimm-Datei muss zum Skript passen, sonst stimmen Wortzeiten und Cues nicht.
            soll = anzeige_text(bloecke()[nr - 1])
            if eintrag["text"] != soll:
                raise SystemExit(f"Block {nr}: Text in {stimm_pfad.name} passt nicht zum Skript:\n{soll}")
            vorhanden = eintrag.get("datei") and (PROJEKT / eintrag["datei"]).is_file()
            if vorhanden and not neu_grund:
                print(f"Block {nr}: Aufnahme liegt schon da ({eintrag['datei']}), nichts gesendet")
                continue
            if eintrag.get("aufrufe", 0) >= 2:
                raise SystemExit(f"Block {nr}: schon {eintrag['aufrufe']} Aufrufe, kein weiterer")
            if vorhanden:
                alt = json.loads((PROJEKT / eintrag["wortzeiten"]).read_text()) if eintrag.get("wortzeiten") else {}
                eintrag.setdefault("verworfen", []).append(
                    {"datei": eintrag["datei"], "wortzeiten": eintrag.get("wortzeiten"),
                     "zeichen": eintrag.get("zeichen", 0), "tempo": alt.get("tempo"), "grund": neu_grund})
            posts["n"] = 0
            eintrag["aufrufe"] = eintrag.get("aufrufe", 0) + 1
            # Tempo je Block (z. B. langsamer für eine Definition), sonst das der Stimm-Datei
            s_block = {**s, "tempo": eintrag.get("tempo", s["tempo"])}
            try:
                erg = fabrik_stimme.synthese(eintrag["text"], s_block)
            # Bewusst JEDER Fehler: Der Aufruf ist schon gezählt ("aufrufe") und muss in der Datei landen,
            # sonst könnte ein späterer Lauf denselben Block noch einmal bezahlen. Kein zweiter Versuch.
            except Exception as fehler:  # noqa: BLE001
                grund = basis.schwaerze(str(fehler))[:300]
                eintrag.setdefault("fehlgeschlagen", []).append({"datum": heute, "grund": grund})
                print(f"Block {nr}: FEHLER {grund} (POSTs {posts['n']})")
                stimm_pfad.write_text(json.dumps(konfig, ensure_ascii=False, indent=1) + "\n")
                continue
            kennung = hashlib.sha256(erg.audio).hexdigest()[:12]
            datei = ordner / f"b{nr}-{kennung}.{erg.format}"
            meta = ordner / f"b{nr}-{kennung}.json"
            datei.write_bytes(erg.audio)
            meta.write_text(json.dumps({"anbieter": konfig["anbieter"], "stimm_id": s["stimm_id"],
                                        "modell": s["modell"], "tempo": s_block["tempo"], "abtastrate": erg.abtastrate,
                                        "zeichen": erg.zeichen, "gesendet": erg.gesendet,
                                        "wortzeiten": erg.wortzeiten}, ensure_ascii=False, indent=1))
            eintrag.update({"datei": str(datei.relative_to(PROJEKT)), "wortzeiten": str(meta.relative_to(PROJEKT)),
                            "zeichen": erg.zeichen, "gesendet": erg.gesendet, "datum": heute})
            konfig["zeichen_gesamt"] = sum(e.get("zeichen", 0) for e in konfig["bloecke"]) + sum(
                v.get("zeichen", 0) for e in konfig["bloecke"] for v in e.get("verworfen", []))
            stimm_pfad.write_text(json.dumps(konfig, ensure_ascii=False, indent=1) + "\n")
            print(f"Block {nr}: ok, {len(erg.wortzeiten or [])} Wortzeiten, {erg.zeichen} Zeichen, "
                  f"POSTs {posts['n']} -> {datei.relative_to(PROJEKT)}")
    finally:
        basis.TRANSPORT = echt


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
    ap.add_argument("--vertonen", help="Stimm-Datei (z. B. build/stimme-sebastian.json): fehlende Blöcke "
                                       "über den Fabrik-Adapter vertonen, je Block genau ein Aufruf")
    ap.add_argument("--bloecke", help="mit --vertonen: nur diese Blöcke (z. B. 2,5)")
    ap.add_argument("--neu-grund", help="mit --vertonen und --bloecke: vorhandene Aufnahme ersetzen, "
                                        "nur wenn sie nachweislich fehlerhaft ist (Grund wird vermerkt)")
    args = ap.parse_args()
    if args.vertonen:
        nummern = [int(x) for x in args.bloecke.split(",")] if args.bloecke else None
        if args.neu_grund and not nummern:
            raise SystemExit("--neu-grund nur zusammen mit --bloecke (welcher Block ist fehlerhaft?)")
        vertone_bloecke(Path(args.vertonen), nummern, args.neu_grund)
        return
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
        timing["pruefung_ton"] = pruefe_ton(timing, wav)
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
    teile_audio = []      # Vorlauf kommt nach der ersten Aufnahme (Raumton braucht ihre Quelle)
    if args.anbieter == "datei":
        # Raumton vorab aus ALLEN Aufnahmen (der leiseste Abschnitt gewinnt), nicht erst aus Block 1
        for e in stimme["bloecke"]:
            if e.get("datei") and (PROJEKT / e["datei"]).is_file():
                merke_raumton(dekodiere((PROJEKT / e["datei"]).read_bytes()))
        print(f"Raumton: {RAUM.get('db')} dBFS (leisester Abschnitt aller Aufnahmen)")
    t = LEAD_IN
    szenen_zeiten = []
    luft_liste = []
    dehn_liste, satz_liste, klick_liste, mund_liste = [], [], [], []
    bl = bloecke()
    for k, block in enumerate(bl):
        vorher = bl[k - 1]["text"] if k > 0 else None
        nachher = bl[k + 1]["text"] if k + 1 < len(bl) else None
        extra = {"nr": k} if args.anbieter == "datei" else {}
        ergebnis = adapter.synthese(block["text"], stimme, vorher=vorher, nachher=nachher, **extra)
        # Politur: Der Datei-Adapter liefert die Aufnahme mit gedämpften Mundgeräuschen mit (bereinigt).
        audio = getattr(ergebnis, "bereinigt", None)
        if audio is None:
            audio = dekodiere(ergebnis.audio)
        mund_liste.append(getattr(ergebnis, "mund", []))
        audio, klickzahl = entklicke(audio)
        klick_liste.append(klickzahl)
        wortzeiten = ergebnis.wortzeiten
        if wortzeiten is None:
            raise SystemExit("Anbieter liefert keine Wortzeiten: hier Whisper-Alignment ergänzen")
        merke_raumton(audio)
        if not teile_audio:
            teile_audio.append(stille(LEAD_IN))
        audio, wortzeiten = kappe(audio, wortzeiten)
        audio = angleichen(audio)
        skript = [p for s in block["szenen"] for satz in s["sentences"] for p in tokens(satz)]
        zeiten = fuelle_luecken(ordne_zu(skript, wortzeiten))
        audio, zeiten, gedehnt = dehne_saetze(audio, zeiten, block)
        dehn_liste += gedehnt
        audio, zeiten, luft = luft_einfuegen(audio, zeiten, block)
        audio, atemzahl = atem_daempfen(audio, zeiten)
        audio, satz_lautheit = saetze_angleichen(audio, zeiten, block)
        satz_liste += satz_lautheit
        # zweiter Durchgang: Knackser, die erst durch Schnitt oder Verstärkung frei stehen
        audio, nachher = entklicke(audio)
        klick_liste[-1] += nachher
        print(f"  Atem gedämpft ({ATEM_DB:.0f} dB): {atemzahl}; Sätze angeglichen: "
              + ", ".join(f"{e['korrektur_db']:+.1f}" for e in satz_lautheit if e["korrektur_db"]))
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
            teile_audio.append(stille(pause))
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
    timing["gedehnt"] = dehn_liste
    timing["satz_lautheit_vorher"] = satz_liste
    timing["raumton_db"] = RAUM.get("db")
    timing["entklickt_je_block"] = klick_liste
    timing["entklickt_nach_mastering"] = getattr(mastere, "entklickt", 0)
    # Politur: je Block die gedämpften Mundgeräusche (Zeit in der Rohaufnahme des Blocks)
    timing["mund_gedaempft_je_block"] = mund_liste
    timing["mastering"] = {**mess, **getattr(mastere, "protokoll", {})}
    # Fingerabdruck der Tonspur: bauen.mjs bricht ab, wenn timing.json zu einer anderen m4a gehört.
    timing["audio"] = {"datei": "assets/voice.m4a", "sha256": sha256(ASSETS / "voice.m4a"), "kanaele": 2,
                       **waehle_bitrate.ergebnis}
    if args.anbieter == "piper":
        timing["wortzeiten_quelle"] = "piper-alignment" if adapter.exakt else "geschaetzt-nach-lauten"
    elif args.anbieter == "datei":
        # Je Block steht fest, wer spricht. Bei Blöcken der Stimm-Datei ist "spoken" die Anzeige-Seite
        # (ElevenLabs und Cartesia lesen "Barcelona" und "45" richtig, die Piper-Schreibung gilt dort nicht).
        stimm_name = f"{stimme['name'].split(' - ')[0]} ({stimme['voice_id']}, {stimme['modell']})"
        piper_name = "Piper thorsten-high (Platzhalter)"
        timing["quellen_je_block"] = [{"block": k + 1, "szenen": [s["id"] for s in b["szenen"]],
                                       "quelle": q, "stimme": piper_name if q == "piper" else stimm_name}
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
        eigen = {sid for e in timing["quellen_je_block"] if e["quelle"] != "piper" for sid in e["szenen"]}
        for sc in timing["scenes"]:
            if sc["id"] in eigen:
                for satz in sc["sentences"]:
                    for w in satz["words"]:
                        w["spoken"] = w["text"]
        mit_zeiten = [b for b in stimme["bloecke"] if b.get("datei") and b.get("wortzeiten")]
        if len(mit_zeiten) == len(bl):
            timing["wortzeiten_quelle"] = (f"Wort-Zeitstempel des Anbieters ({adapter.anbieter}) + "
                                           "Energie-Anfänge nach Pausen")
        else:
            timing["wortzeiten_quelle"] = ("DTW gegen Piper-Vorlage + Energie-Anfänge nach Pausen (Blöcke der "
                                           "Stimm-Datei); piper-alignment (Rückfall-Blöcke)")
    else:
        timing["wortzeiten_quelle"] = args.anbieter
    woerter = sum(len(s["words"]) for sc in timing["scenes"] for s in sc["sentences"])
    sprechzeit = dauer - LEAD_IN - sum(p["end"] - p["start"] for p in timing["pausen"])
    timing["woerter"] = woerter
    timing["woerter_pro_s"] = round(woerter / sprechzeit, 2)
    timing["pruefung_einsaetze"] = pruefe_einsaetze(timing, ASSETS / "voice.wav")
    timing["pruefung"] = pruefe_cues(timing, ASSETS / "voice.wav", timing["pruefung_einsaetze"])
    timing["pruefung_saetze"] = pruefe_saetze(timing, ASSETS / "voice.wav")
    timing["pruefung_ton"] = pruefe_ton(timing, ASSETS / "voice.wav")
    timing_pfad.write_text(json.dumps(timing, ensure_ascii=False, indent=1))
    if not timing["pruefung_ton"]["ok"]:
        print("ACHTUNG: Ton-Tor rot (Satz-Lautheit, Knackser, Mundgeräusche oder Tempo der Kernsätze), siehe oben")
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
