# Musik-Werkstatt

Stand 15.11.2026. Eigene Klangbetten im Stil der Referenzvideos: gleiche Instrumentierung, gleiches Tempo, Register, Hall und Verstimmung, aber eigene Melodien und Harmonien. Je Stil eine nahtlose Schleife von knapp 3 Minuten in drei Varianten (dünn, normal, voll) und für „Hiding Night“ eine Spannungsfassung, die sich über eine JSON-Liste steuern lässt.

Linus' Auftrag (Rückmeldung zu Teil 1): Die Musik war gut, sie soll den hochgeladenen Videos näher kommen, aber ein eigener Stil bleiben.

## Schnellstart

```bash
cd horror && . /opt/deeptok/env.sh
pip install mido==1.3.3                                  # fehlt noch im Setup-Skript
apt-get install -y fluidsynth fluid-soundfont-gm         # nur für Stil 3 (Klavier), fehlt ebenfalls
python engine/musik/bauen.py                             # alle 4 Stile, je 3 Varianten (~7 min)
python engine/musik/bauen.py --proben                    # kleine MP3 nach engine/musik/proben/
python engine/musik/spannung.py engine/musik/spannung/hiding-night-teil1.json --vorhoer
python engine/musik/vergleich.py eigen --stufe 2         # gegen die Referenz-Messwerte
```

Vorhör-MP4 einer Folge mit der Spannungsfassung als Bett (Upload bleibt ohne Musik; noch nicht ausprobiert, weil es `episoden/folge-01/mischung.json` neu schreibt; `mischen.py` normiert das ganze Bett auf 12 LU unter der Stimme, die Hörprobe von `spannung.py --vorhoer` dagegen die Stufe „normal“):

```bash
python engine/fertigen.py episoden/folge-01 --bett build/musik/spannung-hiding-night-teil1.wav
```

## Dateien

| Pfad | Inhalt |
|---|---|
| `GRAMMATIK.md` | Musikalische Grammatik der vier Referenz-Betten: Tonart, Akkordtypen, Intervalle, Raster, Register, Klangfarbe, Hall, Verstimmung, Lautheit, Wegfall |
| `komposition.py` | Die vier eigenen Stücke als Notenlisten (in Schlägen) und MIDI-Export mit mido |
| `klang.py` | Eigene Synthese (zwei Spieluhren, Basszinke, Glasorgel, Fläche, Drone, Herzschlag, Einschlag, Sub-Fall, Spannungston, Wind, Rauschen), FluidSynth-Anbindung, Hall, Filter, Lautheit |
| `bauen.py` | Rendert Schichten zyklisch, mischt Varianten, schreibt WAV, MIDI, Messwerte, Proben. Enthält `NACHBESSERUNG` (Stufe 2) mit Begründung je Änderung |
| `spannung.py` | Spannungsfassung aus einer JSON-Liste (Anker in Sekunden, Satz- oder Wortnummer aus `timing.json`) |
| `vergleich.py` | Gleiches Messverfahren für Referenz und eigene Fassung (numpy): Terzspektrum, Tempo, Einsätze, Lautheitsprofil, Seite/Mitte, Verstimmung, Hall |
| `analyse/` | Werkzeuge der Referenz-Analyse (librosa; liefen im Scratchpad-venv). Speichern nur Statistiken, keine Tonfolgen |
| `midi/<stil>-<variante>.mid` | 12 MIDI-Dateien, je eine Schleife lang, General-MIDI-tauglich (Programm, Verstimmung als Pitch-Bend, Varianten-Pegel als CC7) |
| `spannung/hiding-night-teil1.json`, `-teil2.json` | Spannungsstufen für Teil 1 (fertig) und Teil 2 (Vorlage mit Satz-Ankern, läuft, sobald `folge-02/timing.json` existiert) |
| `messwerte/` | `analyse-*.json` (Referenz-Statistiken), `ref-*.json` (Referenzen im Vergleichsmaß), `bau-*.json`, `vergleich-stufe1/2.json/.md`, `spannung-*.json` |
| `proben/` | `<stil>-stufen.mp3` (je 15 s dünn → normal → voll), `wiegenlied-naht.mp3` (Ende → Anfang der Schleife), `vorhoer-hiding-night-teil1.mp3` (Teil 1 mit Stimme, Effekten und Spannungsfassung) |
| `LIZENZEN.md` | Herkunft und Lizenz jedes Teils |

WAV-Dateien liegen in `horror/build/musik/` (nicht im Repo): `<stil>-<variante>.wav` (24 bit), `schichten/<stil>/*.wav` (trocken, zyklisch), `spannung-*.wav`, `<stil>-stufe1-*.wav` (erster Wurf zum Vergleich).

## Die vier Stile

| Stil | nach | Tonart, Verstimmung | Tempo, Schleife | Länge | Klang | dünn → normal → voll |
|---|---|---|---|---|---|---|
| `spieluhr` Spieluhr-Arpeggio | r2 | G-Dur, +46 Cent | 112 BPM, 8 Takte = 17,14 s | 80 Takte = 171,4 s | weiche Spieluhr (fast Sinus, schwacher 3. Teilton, Ping), Orgelpunkt D5 | Akkordtöne auf 1/3 + Orgelpunkt → durchlaufende Achtel, Zweiklang, Glasorgel leise → + hohe Gegenstimme, tiefe Zinken |
| `wiegenlied` Wiegenlied-Spieluhr | r5 | Es-Dur, −40 Cent | 94 BPM, 8 Takte = 20,43 s (2 × 4) | 72 Takte = 183,8 s | Kamm-Spieluhr mit Zinken-Teiltönen 6,27× und 17,55×, Orgelpunkt G5, Leiern ± 6 Cent | Gruppenanfänge der 3+3+2 + Orgelpunkt → alle Achtel, tiefer Grundton → + hohe Linie, Chorfläche |
| `klavier` Klavier-Fläche | ref0 | d-Moll, A = 432 Hz | 66 BPM, 6 Takte = 21,82 s | 48 Takte = 174,5 s | Flügel und Streicher (FluidR3), Sub-Bass, Sub-Fall | Achtel-Arpeggien + linke Hand → + eigene Linie, leise Streicher → Sechzehntel, Streicher, Sub-Bass, Sub-Fall je Schleife |
| `drone` Sub-Drone | r1 | F1 mit E1/F♯1 und H, −23 Cent | 112er-Raster, Zyklus 12 Takte | 84 Takte = 180,0 s | gesättigter Drone, Wind, Rauschen, Herzschlag, Spannungston, Einschlag | Drone + Wind → + Cluster, Tritonus, seltener Herzschlag, Rauschen → + Herzschlag, Spannungston, Einschläge |

Alle drei Varianten eines Stils teilen Takt und Harmonie und dieselbe Verstärkung: „normal“ steht auf −20 LUFS, „dünn“ 4–5,5 LU darunter (Klavier, Spieluhren) bzw. knapp 1 LU (Drone), „voll“ 0,7–3 LU darüber. Die Schleifen sind zyklisch gerendert: Ausklang und Hall über das Ende liegen am Anfang, Filter und Hall rechnen über genau eine Schleifenlänge. Der Sprung an der Naht ist kleiner als die typische Sample-Differenz (0,01–0,4 × p99); der Pegelsprung an der Naht entspricht dem an einer inneren Schleifengrenze (Pause vor der Eins).

## Wie nah an den Referenzen (Messung)

Beide Seiten laufen durch `vergleich.py` (Terzspektrum normiert, „Musikbereich“ 150 Hz–8 kHz, weil die Stems darunter und darüber vor allem Trennreste und Rauschen tragen). Stufe 1 = erster Wurf nach der Grammatik, Stufe 2 = einmal nachgebessert (`bauen.py` → `NACHBESSERUNG`, jede Änderung mit Messgrund).

| Paar | Spektrum 150 Hz–8 kHz, Terz-RMS dB: Stufe 1 → 2 | Tempo eigen/ref | Seite/Mitte dB eigen (ref) | Hall-Schätzung 1 kHz eigen (ref) | Stimmung Cent eigen (ref) |
|---|---|---|---|---|---|
| spieluhr normal ↔ r2 | 6,0 → 6,5 | 1,004 | −5,8 (−6,9) | 0,97 s (1,0 s) | +46,9 (−47,9 ≙ +52) |
| wiegenlied normal ↔ r5 ohne Hook | 5,3 → 5,2 | 1,000 | −9,7 (−7,0) | 0,90 s (0,73 s) | −42,4 (+49,6 ≙ −50) |
| klavier dünn ↔ ref0 Stufe 1 | 7,7 → 3,9 | 0,998 | −2,0 (−5,0) | – | −30,9 (−33,3) |
| klavier voll ↔ ref0 Stufe 2 | 13,6 → 7,4 | 0,997 | −4,0 (−2,9) | – | −32,8 (−34,3) |
| drone voll ↔ r1 | 10,8 → 5,0 | 0,969 | −6,2 (−6,3) | – | −39,5 (−22,9) |

Verstimmungen nahe ±50 Cent sind gleichbedeutend (Viertelton zwischen den Tasten); die kreisförmige Differenz liegt bei den Spieluhren unter 9 Cent.

Gleiche Analyse (librosa, `analyse/rolle.py`, `analyse/schleife.py`) auf eigener Fassung und Referenz:

| Kennzahl | spieluhr | r2 | wiegenlied | r5 |
|---|---|---|---|---|
| Schleife, Tempo | 17,14 s, 112,0 BPM | 17,19 s, 111,7 BPM | 20,43 s, 94,0 BPM | 20,46 s, 93,8 BPM |
| Oberstimme Schritte / Terz-Quarte / ab Sexte | 0 / 39 / 51 % | 1 / 38 / 51 % | 3 / 30 / 53 % | 0 / 37 / 55 % |
| Orgelpunkt: Anteil Anschläge, Takte | 20 %, 100 % | 21 %, 99 % | 23 %, 100 % | 20 %, 98 % |
| Töne je Einsatz | 1,11 | 1,45 | 1,19 | 1,22 |
| Register p5–p95 | E4–D6 (339–1206 Hz) | C♯4–H5 (285–1014 Hz) | F♯3–H5 (181–965 Hz) | H3–A5 (241–860 Hz) |
| Teiltöne 2× / 3× / 6,27× (dB unter Grundton) | −36 / −33 / −51 | −39 / −33 / −52 | −26 / – / −16 (17,55×: −48) | (Spektrum: 6,27× und 17,55× deutlich) |
| Hüllkurve Orgelpunkt: −20 dB nach | 0,40 s | 0,40 s | 0,45 s | 0,47 s |

Was die Nachbesserung gebracht hat: Klavier und Drone deutlich näher (Höhen-Regal gegen den hellen FluidR3-Flügel, tiefere Schwellungen und Rausch-Teppich beim Drone), Spieluhren in Tonlänge, Teiltönen, Hall und Breite näher. Bei der Spieluhr kostet die Angleichung der Teiltöne etwas Band-Ähnlichkeit (1,6–2 kHz jetzt 11–14 dB zu schwach); das ist der bewusste Tausch „Klangfarbe des Einzeltons vor Summenspektrum“.

## Empfehlung für „Hiding Night“: Wiegenlied-Spieluhr

1. **Das Wiegenlied ist schon in der Geschichte.** June zählt jede Nacht bis hundert, um einzuschlafen. Mister Hundred zählt „slow and deep“. Eine Spieldose, die zum Einschlafen spielt und dabei falsch abbiegt (übermäßige Tonika, Ces-Dur gegen den Orgelpunkt G), ist genau dieser Widerspruch.
2. **Geburtstag und Kinderspiel.** Die Spieldose ist das Geschenk-Geräusch schlechthin, Verstecken das Kinderspiel. Der Stil trägt beides, ohne dass ein Bild es zeigen muss.
3. **Das Tempo passt zum Zählen.** 94 BPM mit wiegenden 3+3+2-Gruppen sind langsamer und ruhiger als die nervösen Achtel der Spieluhr (112 BPM). Unter dem Zählschlag-Effekt wirkt es wie ein Uhrwerk.
4. **Es lässt der Stimme Platz.** Energie 250–900 Hz, kein Bass, flacher Pegel (LRA 1 LU), 12 LU unter der Stimme wie in r5.

Die anderen Stile bleiben als Werkzeug: **Spieluhr-Arpeggio** für Fluchten und schnelle Teile (Teil 3, die Nacht), **Sub-Drone** unter dem Zählen des Monsters oder als Wechsel in Teil 3, **Klavier-Fläche** für den traurigen Schluss (Teil 4, Dads Schuhe).

### Spannungsfassung Teil 1

`spannung/hiding-night-teil1.json` legt zehn Punkte auf die Sätze von Teil 1 (aufgelöst in `messwerte/spannung-hiding-night-teil1.json`, Hörprobe `proben/vorhoer-hiding-night-teil1.mp3`):

| Zeit | Stufe | Grund |
|---|---|---|
| 0,00 s | normal | Hook: die Spieldose läuft sofort (wie r5) |
| 5,11 s | dünn | Mister Hundred wird beschrieben |
| 26,81 s | normal | Hiding Night, die eine Regel |
| 50,46 s | **weg** | 0,25 s vor „ready“: der Zählschlag-Effekt fällt in die Stille |
| 51,70 s | normal | Wiedereinsatz auf dem nächsten Schlag |
| 53,62 s | dünn | persönlicher Teil: Eli und June |
| 70,85 s | normal | Junes Versprechen |
| 75,96 s | voll | Cliffhanger-Block |
| 82,81 s | **weg** | 0,3 s vor „It wasn't counting.“; der Sub-Boom auf „fingers“ trifft in die Stille |
| 86,27 s | dünn | Endkarte: die Spieldose spielt allein weiter |

Gemessen (RMS 0,6 s vor/nach dem Punkt): dünn liegt 2–6 dB unter normal, „weg“ fällt um 22–51 dB, der Hall klingt dabei natürlich aus (Pegel wirkt vor dem Hall).

**JSON-Regeln** (vollständig im Docstring von `spannung.py`): Anker `ab_s`, `ab_satz` oder `ab_wort` plus `versatz_s`; `stufe` = `duenn | normal | voll | weg`; `blende_s` je Punkt; Wechsel rasten auf den nächsten Schlag ein (`einrasten`: `schlag`, `takt` oder `aus`), ein „weg“ sitzt immer genau am Wort. `start_in_schleife_s` wählt die Stelle in der 3-min-Schleife (Teil 2 beginnt in der zweiten Runde, damit es nach Fortsetzung klingt).

## Offen

- `mido` und `fluidsynth` + `fluid-soundfont-gm` fehlen im Setup-Skript (`tools/setup-umgebung.sh`, danach `SETUP_VERSION` hochzählen). Ohne FluidSynth lässt sich nur Stil 3 nicht bauen.
- Klavier-Fläche klingt länger nach als ref0 (Pedal über den ganzen Takt; Referenz: Töne 0,35 s Median). Nächster Schritt: Pedal je halben Takt.
- Wiegenlied ist jetzt etwas schmaler als r5 (Seite/Mitte −9,7 statt −7,0 dB) und streut in der Anschlagstärke mehr (8,7 statt 2,9 dB; Akzente der 3+3+2 und tiefe Grundtöne). Drone schwillt weniger als r1 (LRA 7,7 statt 15,8 LU).
- r2 zählt mehr Einsätze (7,1/s) als Achtel (3,7/s); vermutlich Trennartefakte oder ein Echo im Original. Nicht nachgebaut.
- Die Spannungsfassung für Teil 2 braucht `episoden/folge-02/timing.json` (nach dem Vertonen). Den Wegfall bei „ninety-nine“ dann per `ab_wort` aufs Wort legen.
- Ob TikTok ein eigenes Bett im Upload duldet oder Linus weiter einen Bibliothekssound wählt, entscheidet Linus (anhang-b B4: Upload ohne Musik).
