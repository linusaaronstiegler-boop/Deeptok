# Musik v2: Klangbetten sehr nah an den Vorbildern

Stand 15.11.2026. Linus' Wunsch: „Musik sehr viel näher an den Vorbildern.“ v1 (`betten.py` im Scratchpad) war im selben Stil komponiert, aber mit eigener Akkordfolge. v2 übernimmt von den Vorlagen, was nicht schützbar ist:
- Akkordfolge, Arpeggio- und Rhythmusmuster, Register
- Tempo, Schleifenlänge, Stimmung
- Klangfarbe, über einen EQ auf das Referenzspektrum

Nur die Oberstimme ist eigen. Rechte, Quellen und Restrisiko stehen in `LIZENZEN.md`, auch die Suche nach freien Originalen (Weg A).

## Für Videos: r2-eigen (Stand 16.11.2026)

Teil 1 und 2 von „Hiding Night“ laufen auf **r2-eigen**: Klang, Tempo, Verstimmung, Hall und Akkordfolge wie r2, aber eigene Begleitfiguren in allen acht Takten und eine eigene Oberstimme (`analyse/eigene_figuren.py`, Noten in `muster/spieluhr-eigen.json`). r2-v2 und r5-v2 folgen der Vorlage Achtel für Achtel und gelten im eigenen Fingerabdruck als „dasselbe Stück“; sie bleiben nur zum Vergleich. Werte und Begründung: `LIZENZEN.md`, Abschnitt r2-eigen.

```bash
python -I analyse/eigene_figuren.py      # Noten schreiben
python -I bauen.py r2-eigen              # build/musik-v2/r2-eigen-v2-{schleife,duenn,voll}.wav
python -I analyse/fingerabdruck.py <r2-ref-schleife.wav> ../../build/musik-v2/r2-eigen-v2-schleife.wav
```

Die Spannungsfassung je Folge baut `engine/musik/spannung.py` mit `"quelle": "musik-v2"` (Stufen = die drei Dateien, kurzer Nachhall an jedem Wegfall).

Naht: `bauen.py` blendet jetzt die letzten 50 ms jeder Datei in das Ende des Vorlaufs über. Vorher sprang der Pegel an der Naht um einen Abtastwert (Hochton-Energie 30–50-fach in 1-ms-Fenstern, auch bei r2-v2), weil fluidsynth Noten auf Ticks und 64er-Blöcke setzt und Vorlauf und letzte Schleife dadurch leicht verschoben lagen. Die Prüfung misst zusätzlich in 1-ms-Fenstern (`naht_hf_faktor_1ms`, `naht_sprung`).

## Die drei Stile

| Stil | Vorlage | Tonart, Stimmung | Tempo, Takt | Schleife | Folge |
|---|---|---|---|---|---|
| `r2` | Spieluhr (@jexario, „In this town …“, 7,3 Mio.) | E, +46 Cent | 111,7 BPM, 4/4, Achtel | 17,19 s (8 Takte) | I – vi7 – vi – bVI+ (E – C♯m7 – C♯m – C+), zweimal |
| `r5` | dasselbe Stück wie r2, 3 Halbtöne tiefer, 1,19× langsamer, mehr Hall (@yougplat) | C♯, +55 Cent | 93,8 BPM | 20,46 s | wie r2 |
| `ref0` | Klavier, ab Schleife 3 Synth-Bass und Fläche (@concet5612) | F-Dur, A = 432 Hz (−32 Cent) | 66 BPM, 3/4, Achtel | 21,80 s (8 Takte) | Fmaj7 – Fmaj7 – D9 – D/A – B♭maj7 – B♭/D♭+ – D♭+ – C |

Klang: Celesta (r2/r5) bzw. Flügel, Synth-Bass und Warm Pad (ref0) aus der Soundfont FluidR3_GM (MIT). Danach kommen eigener Faltungshall, leichtes Leiern (nur Spieluhr) und ein Terz-EQ auf das gemessene Langzeitspektrum der Vorlage. Die Lautheit je Achtel ist an die Vorlage angeglichen (`analyse/dynamik.py`).

## Dateien

- `bauen.py`: MIDI erzeugen, fluidsynth rendern, mischen, nahtlose Schleife schreiben. Aufruf mit dem Audio-venv:
  `python -I bauen.py r2|r5|ref0|alle`. Er braucht `fluidsynth` und `/usr/share/sounds/sf2/FluidR3_GM.sf2`; ein anderer Pfad geht über `MUSIK_SF2`.
- `vergleich.py`: Ähnlichkeitsmessung gegen eine Referenz (Chroma-Verlauf, Periode, Tempo, Stimmung, Spektrum, Lautheitsverlauf).
- `muster/spieluhr.json`, `muster/klavier.json`: Noten (Achtel-Slots), Akkorde, Bass, eigene Oberstimme, Zielspektren (nur Zahlen) und Lautheitskorrektur je Slot.
- `midi/<stil>-<schicht>.mid`: die gerenderten Schichten (Vorlauf plus N+1 Schleifen).
- `analyse/`: Werkzeuge der Transkription. `rolle.py` erzeugt die gemittelte Klavierrolle, `slots.py` die neuen Töne je Achtel, `konsens.py` führt r2 und r5 zusammen. Außerdem `ref0_muster.py`, `muster_schreiben.py`, `dynamik.py`, `fingerabdruck.py` und `stimmung.py`. Sie lesen die Demucs-Spuren im Scratchpad, die nicht im Repo liegen.
- `messwerte.json`: alle Messungen unten, maschinenlesbar.
- `proben/`: Hörproben, MP3 128 kbit/s, je unter 0,5 MB, alle auf −20 LUFS:
  - `<stil>-1-referenz-10s.mp3`: Musikspur der Vorlage, nur lokal (`.gitignore`), nie verwenden
  - `<stil>-2-alt-10s.mp3`: Nachbau v1
  - `<stil>-3-neu-20s.mp3`: Nachbau v2, Hauptfassung
  - `<stil>-4-neu-stufen-duenn-normal-voll-30s.mp3`: je 10 s dünn, normal, voll an derselben Stelle
- Audio in `horror/build/musik-v2/` (nicht im Repo), je Stil `<stil>-v2-schleife.wav`, `-duenn.wav` und `-voll.wav`. Das sind 24 bit, 44,1 kHz, Stereo, 3:04–3:16 lang, plus `<stil>-v2.json` mit den Baudaten.

## Fassungen und Stufen

Alle drei Dateien eines Stils sind **abtastgenau gleich lang und gleich getaktet**. Man kann also an jeder Taktgrenze zwischen ihnen überblenden: r2 alle 2,148 s, r5 alle 2,558 s, ref0 alle 2,725 s. Jede Datei läuft im Kreis ohne Naht: Das Ende geht in den Anfang über.

- **Hauptfassung** (`schleife`)
  - Spieluhr: durchgehend „normal“ wie die Vorlage. Die Vorlage hat keinen Aufbau.
  - ref0: wie die Vorlage zwei Schleifen nur Klavier, vier mit Bass und Fläche, dann wieder nur Klavier.
- **dünn**: nur die Haupttöne, ohne Oktavverdopplungen, 1,9–2,4 LU leiser. Bei ref0 nur Klavier.
- **voll**
  - Spieluhr: dazu eine tiefe Celesta-Zinke auf 1 und 3 und eine leise Streicherfläche, +0,8 LU.
  - ref0: Klavier, Bass und Fläche durchgehend, +1,7 LU.

Pegel: Die Hauptfassung liegt bei −20,0 LUFS. dünn und voll haben dieselbe Verstärkung, damit die Stufen ihren Pegelunterschied behalten. Der True Peak liegt bei höchstens −1,3 dBTP.

## Messwerte: neu gegen Referenz und gegen v1

Referenz ist die Demucs-Musikspur der Vorlage. „Chroma“ ist der harmonische Verlauf bei gleicher Tonart und gleichem Tempo, beste Lage; 1 heißt identisch. „Spektrum“ ist der RMS-Abstand der Terzspektren von 160 Hz bis 8 kHz. „Laut-Korr“ ist die Korrelation des Lautheitsverlaufs innerhalb einer Schleife.

| Stil | Fassung | Chroma | Periode (Ref) | Stimmung (Ref) | Spektrum | Laut-Korr |
|---|---|---|---|---|---|---|
| r2 | **neu** | **0,866** | 17,183 s (17,183) | +43 c (+46) | **4,8 dB** | **0,62** |
| r2 | alt a / b | 0,568 / 0,570 | 17,136 / 12,864 s | −1 / +2 c | 7,4 / 4,9 dB | 0,21 / 0,22 |
| r5 | **neu** | **0,864** | 20,457 s (20,457) | +49 c (+60*) | 5,6 dB | **0,54** |
| r5 | alt a / b | 0,540 / 0,530 | 20,643 / 20,643 s | 0 / 0 c | 5,5 / 5,7 dB | 0,23 / 0,22 |
| ref0 | **neu** | **0,862** | 21,804 s (21,804) | −31 c (−34) | **2,1 dB** | 0,10 |
| ref0 | alt a / b | 0,624 / 0,685 | 21,827 / 14,536 s | −29 / −30 c | 3,6 / 4,5 dB | 0,10 / 0,25 |

\* librosa liest r5 als −40 Cent, das entspricht +60 Cent. Die Spektralspitzen ergeben +49 Cent. Gebaut ist mit +55 Cent.

Lesart:
- Der harmonische Verlauf ist von 0,53–0,69 auf **0,86** gestiegen.
- Schleifenlänge und Tempo stimmen jetzt aufs Raster genau.
- Der Lautheitsverlauf der Spieluhr folgt der Vorlage, Korrelation 0,62 und 0,54 statt 0,2.
- Beim Spektrum liegt ref0 deutlich näher. Bei der Spieluhr ist es etwa gleich wie v1. Die Vorlage ist über 2,5 kHz sehr dunkel und in der Demucs-Spur verwaschen; dort stoßen Celesta und EQ an Grenzen.
- Bei ref0 schwankt die Lautheit innerhalb der Schleife kaum (0,45 dB je Achtel). Die Laut-Korrelation ist dort deshalb kein gutes Maß.

Gegenprobe mit dem Fingerabdruck bei freier Tonart und freiem Tempo: Neu r2 erreicht 0,83 (z 4,6), neu ref0 0,82 (z 6,1). Beide gelten damit als „dasselbe Stück“. Das zeigt, wie nah v2 ist; zum Risiko siehe `LIZENZEN.md`.

Prüfung der Schleifennaht (aus `<stil>-v2.json`):
- Pegel ±50 ms um die Naht: höchstens 0,7 dB Abweichung zu einer inneren Schleifengrenze.
- Hochton-Energie (über 6 kHz) an der Naht: r2 11,9, r5 5,3, ref0 2,0 (Vielfaches des Medians). Das liegt unter dem, was normale Notenanschläge in derselben Datei erzeugen (15,3 / 10,8 / 4,5). Es gibt also keinen Klick.

Grenzen: Ich kann nicht hören. Alles oben ist gemessen. Vor dem Einsatz bitte die Proben `*-3-neu-20s.mp3` gegen `*-1-referenz-10s.mp3` anhören.

## Empfehlung für „Hiding Night“

**r2-v2** als Bett für die Serie, **r5-v2** als ruhigere Alternative für Teil 3 (die Nacht). *Stand 16.11.2026: Im Video läuft statt r2-v2 die abgegrenzte Fassung r2-eigen (Abschnitt oben); für Teil 3 bräuchte r5 dieselbe Behandlung (`STILE["r5-eigen"]` mit `muster="spieluhr-eigen"`, grund 61, 93,83 BPM, +55 Cent).*

Begründung:
- r2 ist genau die Musik, die das Erfolgsvideo im selben Format trägt. @jexario erzählt „In this town, the monsters hear every sound …“ mit 7,3 Mio. Aufrufen, und Hiding Night beginnt ebenfalls mit „In this town …“. Wer das Format kennt, erkennt den Klang sofort.
- Die Spieluhr passt zum Stoff: Wiegenlied, Kinderspiel und June, die jede Nacht bis hundert zählt.
- Mit 111,7 BPM hält r2 das Erzähltempo hoch. r5 ist dasselbe Stück langsamer und halliger: gut, wenn die Nacht stillsteht (Teil 3, Finger durch die Dielen).

Einsatz:
- Teil 1 und 2: **dünn** unter Regel-Hook und Regeln. **normal** ab der Geschichte (Owen, June, Versprechen). **voll** in den letzten etwa 15 s vor dem Cliffhanger. Überblendet wird auf einer Taktgrenze, Vielfache von 2,148 s ab Dateianfang.
- Pointe („It wasn't counting“ / „One.“): Das Bett für 1–2 Takte wegnehmen, wie r1 es macht („So you don't make a sound“). Stille ist dort das stärkste Mittel.
- Mischung (im Ordner `horror/`): `python engine/ton/mischen.py episoden/folge-0X --bett build/musik-v2/r2-v2-schleife.wav`. Der Mischer legt das Bett 12 LU unter die Stimme, wie bei r2 (11,9 LU) und r5 (11,7 LU). Die Datei ist 189 s lang und damit länger als jede Folge.
- Hinweis zu Linus' Vorgabe 2: Den Hintergrundsound wählt er in der TikTok-App. Die Betten sind deshalb für die Vorhör-Fassung gedacht oder für den Fall, dass er die Musik bewusst einbacken will.
- Für Teil 2 baut parallel ein anderer Lauf Musik unter `engine/musik/`. Welche Fassung in die Folge kommt, entscheidet die Hauptsitzung.
