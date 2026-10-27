"""Tor G4, der Hör-Check: Versteht eine Maschine, was die Stimme sagt? Ist der Ton gemastert?

Messungen:
- wer:            Wortfehlerrate zwischen Skript und Whisper-Transkript (0 = perfekt)
- lufs:           integrierte Lautheit (Ziel -16 LUFS) über den ffmpeg-Filter ebur128
- true_peak_db:   höchster echter Spitzenpegel (höchstens -1 dBTP)
- lange_stillen:  Pausen über max_stille_s, über den ffmpeg-Filter silencedetect (-35 dB)
- woerter_pro_s:  Sprechtempo ohne die langen Pausen

Wichtig 1 (PyAV-Falle): faster-whisper darf die Datei NICHT selbst öffnen. Das ist ein
Versionskonflikt, kein Problem einzelner Dateien: faster-whisper 1.2.1 ruft
av.open(..., metadata_errors="ignore") auf, und PyAV ab Version 19 kennt diesen Parameter
nicht mehr. Mit dieser Kombination scheitert JEDE Datei. Statt uns auf den Pin av==18.1.0
(tools/requirements.txt) zu verlassen, dekodiert ffmpeg die Datei selbst zu 16 kHz mono
float32, und Whisper bekommt nur noch das Zahlen-Array.

Wichtig 2: Whisper bekommt das Skript NICHT als Hilfe (initial_prompt). Sonst würde es
hören, was es lesen soll, und verschluckte Wörter fielen nicht mehr auf.
"""
from __future__ import annotations

import re
import subprocess
import sys
import unicodedata
from pathlib import Path

try:   # optional: Zahlen als Wörter ("344" -> "dreihundertvierundvierzig")
    from num2words import num2words as _num2words
except ImportError:      # ohne num2words bleiben Ziffern Ziffern
    _num2words = None

ABTASTRATE = 16000        # Whisper erwartet 16 kHz
_MODELLE: dict = {}       # geladene Whisper-Modelle, damit jedes nur einmal geladen wird

# --------------------------------------------------------------------------------------------
# Normalisierung und Wortfehlerrate (reine Textfunktionen, ohne Whisper testbar)
# --------------------------------------------------------------------------------------------

# Abkürzungen, die gesprochen anders klingen, als sie geschrieben werden.
_ABKUERZUNGEN = [
    (r"(?<!\w)Mio(?:\.|(?!\w))", " millionen "),
    (r"(?<!\w)Mrd(?:\.|(?!\w))", " milliarden "),
    (r"(?<!\w)Tsd(?:\.|(?!\w))", " tausend "),
    (r"(?<!\w)z\.\s?B\.", " zum beispiel "),
    (r"(?<!\w)d\.\s?h\.", " das heißt "),
    (r"(?<!\w)u\.\s?a\.", " unter anderem "),
    (r"(?<!\w)bzw\.", " beziehungsweise "),
    (r"(?<!\w)usw\.", " und so weiter "),
    (r"(?<!\w)ca\.", " circa "),
    (r"(?<!\w)vgl\.", " vergleiche "),
    (r"(?<!\w)Nr\.", " nummer "),
    (r"(?<!\w)Dr\.", " doktor "),
    (r"(?<!\w)Prof\.", " professor "),
    (r"%", " prozent "),
    (r"€", " euro "),
    (r"\$", " dollar "),
    (r"°C", " grad celsius "),
    (r"°", " grad "),
    (r"&", " und "),
    (r"§", " paragraf "),
]
_ABKUERZUNGEN = [(re.compile(m, re.IGNORECASE), ersatz) for m, ersatz in _ABKUERZUNGEN]

# Zahl mit deutschen Tausenderpunkten (45.000.000) oder Dezimalkomma (2,6).
_ZAHL = re.compile(r"\d{1,3}(?:\.\d{3})+(?:,\d+)?(?!\d)|\d+(?:,\d+)?")

# Whisper schreibt "1" für "ein", "eine", "eins" ... Diese Formen fassen wir zu "ein" zusammen,
# sonst zählte "1 Million" gegen "eine Million" als Fehler.
_EIN_FORMEN = {"eins", "eine", "einen", "einem", "einer", "eines"}


def sprechtext(skript: str) -> str:
    """Aus 'Barcelona|Barsselona zahlte 45|fünfundvierzig' wird 'Barsselona zahlte fünfundvierzig'.

    Ein Token "Anzeige|Gesprochen" trennt Untertitel und Aussprache (siehe CLAUDE.md).
    Für den Hör-Check zählt, was gesprochen wird.
    """
    teile = []
    for token in skript.split():
        if "|" in token:
            token = token.split("|", 1)[1]
        teile.append(token)
    return " ".join(teile)


def _zahl_als_wort(treffer: re.Match) -> str:
    roh = treffer.group()
    ziffern = roh.replace(".", "").replace(",", ".")
    try:
        if "." in ziffern:
            return " " + _num2words(float(ziffern), lang="de") + " "
        zahl = int(ziffern)
        # Vierstellige Zahlen von 1100 bis 1999 sind gesprochen fast immer Jahre:
        # "1989" -> "neunzehnhundertneunundachtzig", nicht "eintausendneunhundert...".
        if 1100 <= zahl <= 1999 and roh.isdigit():
            return " " + _num2words(zahl, lang="de", to="year") + " "
        return " " + _num2words(zahl, lang="de") + " "
    except (ValueError, OverflowError, NotImplementedError):
        return " " + roh + " "


def normalisiere(text: str) -> str:
    """Bringt Skript und Transkript in dieselbe Form, damit nur echte Hörfehler zählen.

    Schritte: Abkürzungen ausschreiben -> Zahlen als Wörter (wenn num2words da ist)
    -> Bindestriche in Wörtern entfernen -> Satzzeichen weg -> klein -> ein-Formen zusammenfassen.
    """
    text = unicodedata.normalize("NFC", text)
    for muster, ersatz in _ABKUERZUNGEN:
        text = muster.sub(ersatz, text)
    if _num2words is not None:
        text = _ZAHL.sub(_zahl_als_wort, text)
    # "Opportunitäts-Kosten" == "Opportunitätskosten": Bindestriche zwischen Buchstaben weg.
    text = re.sub(r"(?<=[^\W\d_])-(?=[^\W\d_])", "", text)
    text = re.sub(r"['’`´]", "", text)            # "geht's" -> "gehts"
    text = re.sub(r"[^\w\s]|_", " ", text)        # alle übrigen Satzzeichen
    text = text.casefold()                          # casefold macht auch aus ß ein ss
    woerter = ["ein" if w in _EIN_FORMEN else w for w in text.split()]
    return " ".join(woerter)


def soll_woerter(skript: str) -> tuple[list[str], list[frozenset]]:
    """Normalisierte Soll-Wörter plus erlaubte Alternativen je Wort.

    Bei "Barcelona|Barsselona" ist "barsselona" das Soll-Wort (das spricht die Stimme), aber
    "barcelona" gilt auch als richtig: Whisper schreibt Namen richtig, wenn es sie richtig
    gehört hat. Genau das will der Hör-Check wissen. Text ohne "|" wird am Stück normalisiert,
    damit Abkürzungen über mehrere Tokens ("z. B.") erhalten bleiben.
    """
    woerter: list[str] = []
    alternativen: list[frozenset] = []
    puffer: list[str] = []

    def leere_puffer() -> None:
        for w in normalisiere(" ".join(puffer)).split():
            woerter.append(w)
            alternativen.append(frozenset())
        puffer.clear()

    for token in skript.split():
        if "|" not in token:
            puffer.append(token)
            continue
        leere_puffer()
        anzeige, gesprochen = token.split("|", 1)
        g, a = normalisiere(gesprochen).split(), normalisiere(anzeige).split()
        for w in g:
            woerter.append(w)
            # Nur bei einem Wort auf beiden Seiten ist klar, welches Wort welchem entspricht.
            alternativen.append(frozenset(a) if len(g) == 1 and len(a) == 1 else frozenset())
    leere_puffer()
    return woerter, alternativen


def ausrichtung(soll: list[str], ist: list[str],
                alternativen: list[frozenset] | None = None) -> tuple[int, list[dict]]:
    """Levenshtein-Distanz auf Wortebene plus die Liste der Abweichungen.

    Tabelle d[i][j] = kleinste Zahl von Änderungen, um die ersten i Soll-Wörter in die ersten
    j Ist-Wörter zu verwandeln. Erlaubt sind: ersetzen, weglassen, einfügen (je 1).
    Kostenlos ist dagegen eine andere Zusammenschreibung: "bayern münchen" gegen
    "bayernmünchen" oder "ablösefrei gehen" gegen "ablöse freigehen". Gleiche Buchstaben,
    andere Wortgrenze; das ist ein Schreibproblem von Whisper, kein Fehler der Stimme.
    """
    alternativen = alternativen or [frozenset()] * len(soll)
    n, m = len(soll), len(ist)
    unendlich = n + m + 1
    d = [[unendlich] * (m + 1) for _ in range(n + 1)]
    zurueck: list[list[tuple | None]] = [[None] * (m + 1) for _ in range(n + 1)]
    d[0][0] = 0
    for i in range(n + 1):
        for j in range(m + 1):
            if i == j == 0:
                continue
            wege = []        # (Kosten, vorheriges i, vorheriges j, Art)
            if i > 0 and j > 0:
                gleich = soll[i - 1] == ist[j - 1] or ist[j - 1] in alternativen[i - 1]
                wege.append((d[i - 1][j - 1] + (0 if gleich else 1), i - 1, j - 1,
                             "gleich" if gleich else "ersetzt"))
            if i > 0:
                wege.append((d[i - 1][j] + 1, i - 1, j, "fehlt"))     # Soll-Wort nicht gehört
            if j > 0:
                wege.append((d[i][j - 1] + 1, i, j - 1, "extra"))     # Wort zu viel gehört
            for a, b in ((2, 1), (1, 2), (2, 2)):                     # andere Zusammenschreibung
                if i >= a and j >= b and "".join(soll[i - a:i]) == "".join(ist[j - b:j]):
                    wege.append((d[i - a][j - b], i - a, j - b, "zusammen"))
            bester = min(wege, key=lambda w: w[0])
            d[i][j], zurueck[i][j] = bester[0], bester[1:]
    # Rückwärts den besten Weg entlang: Welche Wörter weichen ab?
    abweichungen = []
    i, j = n, m
    while i > 0 or j > 0:
        vi, vj, art = zurueck[i][j]
        if art == "ersetzt":
            abweichungen.append({"art": art, "soll": soll[i - 1], "ist": ist[j - 1]})
        elif art == "fehlt":
            abweichungen.append({"art": art, "soll": soll[i - 1], "ist": None})
        elif art == "extra":
            abweichungen.append({"art": art, "soll": None, "ist": ist[j - 1]})
        i, j = vi, vj
    abweichungen.reverse()
    return d[n][m], abweichungen


def wortfehlerrate(soll: list[str], ist: list[str],
                   alternativen: list[frozenset] | None = None) -> float:
    """(Ersetzungen + Auslassungen + Einfügungen) / Zahl der Soll-Wörter, gekappt auf 0..1."""
    if not soll:
        return 0.0 if not ist else 1.0
    fehler, _ = ausrichtung(soll, ist, alternativen)
    return min(1.0, fehler / len(soll))


def wer(soll_text: str, ist_text: str) -> float:
    """Wortfehlerrate zweier Texte nach Normalisierung. soll_text darf "Anzeige|Gesprochen" enthalten."""
    soll, alternativen = soll_woerter(soll_text)
    return wortfehlerrate(soll, normalisiere(ist_text).split(), alternativen)


# --------------------------------------------------------------------------------------------
# Audio-Messungen über ffmpeg
# --------------------------------------------------------------------------------------------

def _ffmpeg(*args: str, zeitlimit: float = 300.0) -> subprocess.CompletedProcess:
    return subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-nostats", *args],
                          capture_output=True, timeout=zeitlimit)


def dekodiere(audio_pfad: Path | str):
    """Audiodatei -> numpy-Array (float32, mono, 16 kHz). Umgeht PyAV, siehe Modul-Text."""
    import numpy as np
    r = _ffmpeg("-v", "error", "-i", str(audio_pfad), "-f", "f32le", "-acodec", "pcm_f32le",
                "-ac", "1", "-ar", str(ABTASTRATE), "-")
    if r.returncode != 0:
        raise RuntimeError(f"ffmpeg konnte {audio_pfad} nicht dekodieren: "
                           f"{r.stderr.decode(errors='replace').strip()}")
    return np.frombuffer(r.stdout, dtype=np.float32)


def _zahl_oder_none(text: str) -> float | None:
    return None if "inf" in text else float(text)


def miss_lautheit(audio_pfad: Path | str) -> tuple[float | None, float | None]:
    """(integrierte Lautheit in LUFS, True Peak in dBTP) laut ebur128-Zusammenfassung."""
    r = _ffmpeg("-i", str(audio_pfad), "-filter_complex", "ebur128=peak=true", "-f", "null", "-")
    log = r.stderr.decode(errors="replace")
    zusammenfassung = log[log.rfind("Summary:"):] if "Summary:" in log else ""
    lufs = re.search(r"I:\s+(-?[\d.]+|-?inf)\s+LUFS", zusammenfassung)
    peak = re.search(r"Peak:\s+(-?[\d.]+|-?inf)\s+dBFS", zusammenfassung)
    return (_zahl_oder_none(lufs.group(1)) if lufs else None,
            _zahl_oder_none(peak.group(1)) if peak else None)


def finde_stillen(audio_pfad: Path | str, mindestdauer: float, dauer_s: float,
                  schwelle_db: float = -35.0) -> list[list[float]]:
    """Alle Stillen (leiser als schwelle_db) über mindestdauer, als [start, dauer] in Sekunden."""
    r = _ffmpeg("-i", str(audio_pfad), "-af",
                f"silencedetect=noise={schwelle_db}dB:d={mindestdauer}", "-f", "null", "-")
    stillen, anfang = [], None
    for zeile in r.stderr.decode(errors="replace").splitlines():
        if (m := re.search(r"silence_start:\s*(-?[\d.]+)", zeile)):
            anfang = max(0.0, float(m.group(1)))
        elif (m := re.search(r"silence_end:\s*([\d.]+)", zeile)) and anfang is not None:
            stillen.append([anfang, float(m.group(1)) - anfang])
            anfang = None
    if anfang is not None:                 # Stille bis zum Dateiende ohne "silence_end"
        stillen.append([anfang, dauer_s - anfang])
    return [[round(s, 3), round(d, 3)] for s, d in stillen if d > mindestdauer]


def strom_info(audio_pfad: Path | str) -> dict:
    """Abtastrate und Bitrate laut ffprobe (für die Mindestwerte aus G4)."""
    import json
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a:0",
                        "-show_entries", "stream=sample_rate,bit_rate:format=bit_rate",
                        "-of", "json", str(audio_pfad)], capture_output=True, text=True, timeout=60)
    try:
        daten = json.loads(r.stdout or "{}")
    except json.JSONDecodeError:
        daten = {}
    strom = (daten.get("streams") or [{}])[0]
    bitrate = strom.get("bit_rate") or daten.get("format", {}).get("bit_rate")
    return {"abtastrate_hz": int(strom["sample_rate"]) if strom.get("sample_rate") else None,
            "bitrate_kbps": round(int(bitrate) / 1000, 1) if bitrate else None}


def sprechtempo(woerter: list[dict], lange_stillen: list[list[float]]) -> float:
    """Wörter pro Sekunde zwischen erstem und letztem Wort, ohne die langen (geplanten) Pausen."""
    if not woerter:
        return 0.0
    anfang, ende = woerter[0]["start"], woerter[-1]["ende"]
    pausen = sum(max(0.0, min(s + d, ende) - max(s, anfang)) for s, d in lange_stillen)
    zeit = ende - anfang - pausen
    return round(len(woerter) / zeit, 3) if zeit > 0 else 0.0


# --------------------------------------------------------------------------------------------
# Whisper
# --------------------------------------------------------------------------------------------

def lade_modell(modell: str = "small", threads: int = 2):
    """Lädt ein faster-whisper-Modell erst, wenn es gebraucht wird (das dauert Sekunden).

    Den Speicherort bestimmt huggingface_hub: $HF_HOME, sonst ~/.cache/huggingface.
    int8 auf der CPU ist schnell genug und braucht wenig Speicher.
    """
    schluessel = (modell, threads)
    if schluessel not in _MODELLE:
        try:
            from faster_whisper import WhisperModel
        except ImportError as e:
            # Häufigste Ursache: "python" kommt nicht aus dem Fabrik-venv, weil die Sitzung
            # /opt/deeptok/env.sh nicht geladen hat (z. B. lief der SessionStart-Hook nicht).
            # Gleicher Fehlertyp, aber mit Hinweis, was zu tun ist.
            raise ImportError(f"faster-whisper fehlt in {sys.executable} ({e}). In der Cloud "
                              "zuerst '. /opt/deeptok/env.sh' laden, dann läuft python aus "
                              "/opt/deeptok/venv.") from e
        _MODELLE[schluessel] = WhisperModel(modell, device="cpu", compute_type="int8",
                                            cpu_threads=threads)
    return _MODELLE[schluessel]


def transkribiere(samples, modell: str = "small", sprache: str = "de",
                  threads: int = 2) -> tuple[str, list[dict]]:
    whisper = lade_modell(modell, threads)
    # condition_on_previous_text=False: verhindert, dass sich Whisper in Wiederholungen verfängt.
    segmente, _info = whisper.transcribe(samples, language=sprache, word_timestamps=True,
                                         beam_size=5, condition_on_previous_text=False)
    texte, woerter = [], []
    for segment in segmente:          # ein Generator: erst hier wird wirklich gerechnet
        texte.append(segment.text.strip())
        for w in segment.words or []:
            # float(): faster-whisper liefert numpy-Zahlen; json soll echte Python-Zahlen sehen.
            woerter.append({"wort": w.word.strip(), "start": round(float(w.start), 3),
                            "ende": round(float(w.end), 3)})
    return " ".join(t for t in texte if t), woerter


def pruefe(audio_pfad: Path | str, soll_text: str, modell: str = "small", sprache: str = "de",
           threads: int = 2, max_stille_s: float = 1.2) -> dict:
    """Misst alles für Tor G4. Bewertet nichts; die Schwellen prüft bewerte().

    soll_text ist der Sprechtext. Enthält er Tokens "Anzeige|Gesprochen", zählt die
    gesprochene Seite, die Anzeige gilt aber auch als richtig erkannt (siehe soll_woerter).
    """
    audio_pfad = Path(audio_pfad)
    if not audio_pfad.is_file():
        raise FileNotFoundError(audio_pfad)
    samples = dekodiere(audio_pfad)
    dauer_s = round(len(samples) / ABTASTRATE, 3)
    transkript, woerter = transkribiere(samples, modell, sprache, threads)
    soll, alternativen = soll_woerter(soll_text)
    ist = normalisiere(transkript).split()
    _, abweichungen = ausrichtung(soll, ist, alternativen)
    lufs, peak = miss_lautheit(audio_pfad)
    stillen = finde_stillen(audio_pfad, max_stille_s, dauer_s)
    return {
        "wer": round(wortfehlerrate(soll, ist, alternativen), 4),
        "transkript": transkript,
        "woerter": woerter,
        "dauer_s": dauer_s,
        "lufs": lufs,
        "true_peak_db": peak,
        "lange_stillen": stillen,
        "woerter_pro_s": sprechtempo(woerter, stillen),
        "abweichungen": abweichungen,
        "zahlen_als_woerter": _num2words is not None,
        **strom_info(audio_pfad),
    }


def bewerte(messung: dict, konfig: dict, erlaubte_stillen: int = 0) -> list[str]:
    """Vergleicht eine Messung mit den Schwellen aus config.json. Leere Liste = bestanden.

    Bekannter Kompromiss bei den Stillen: §6 erlaubt lange Stillen nur in deklarierten Pausen.
    Hier zählen wir nur, WIE VIELE es sind, nicht WO sie liegen. Fehlt eine geplante Denkpause
    und steht dafür eine Stille mitten im Satz, besteht die Tonspur trotzdem. Besser wäre,
    die Pausen als Wortanker zu übergeben (Pause nach dem n-ten Wort laut timing.json) und
    jede lange Stille gegen ein Fenster um diese Anker zu prüfen. Das kommt mit der Spec.
    """
    v = []
    if messung["wer"] > konfig["wer_max"]:
        v.append(f"Wortfehlerrate {messung['wer']:.3f} > {konfig['wer_max']}")
    lufs = messung["lufs"]
    if lufs is None or abs(lufs - konfig["lufs_ziel"]) > konfig["lufs_toleranz"]:
        v.append(f"Lautheit {lufs} LUFS, Ziel {konfig['lufs_ziel']} ± {konfig['lufs_toleranz']}")
    if messung["true_peak_db"] is not None and messung["true_peak_db"] > konfig["true_peak_max"]:
        v.append(f"True Peak {messung['true_peak_db']} dBTP > {konfig['true_peak_max']}")
    if len(messung["lange_stillen"]) > erlaubte_stillen:
        v.append(f"{len(messung['lange_stillen'])} Stille(n) über {konfig['max_stille_s']} s, "
                 f"erlaubt {erlaubte_stillen}: {messung['lange_stillen']}")
    tempo = messung["woerter_pro_s"]
    if not konfig["sprechtempo_min"] <= tempo <= konfig["sprechtempo_max"]:
        v.append(f"Sprechtempo {tempo} Wörter/s außerhalb "
                 f"{konfig['sprechtempo_min']}–{konfig['sprechtempo_max']}")
    rate, bitrate = messung.get("abtastrate_hz"), messung.get("bitrate_kbps")
    if rate is not None and rate < konfig.get("min_abtastrate_hz", 0):
        v.append(f"Abtastrate {rate} Hz < {konfig['min_abtastrate_hz']}")
    if bitrate is not None and bitrate < konfig.get("min_bitrate_kbps", 0):
        v.append(f"Bitrate {bitrate} kbps < {konfig['min_bitrate_kbps']}")
    return v
