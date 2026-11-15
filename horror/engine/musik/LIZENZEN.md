# Lizenzen der Musik-Werkstatt

Stand 15.11.2026.

## Was hier entsteht und woraus

| Teil | Herkunft | Lizenz |
|---|---|---|
| Kompositionen (`komposition.py`, `midi/*.mid`) | eigene Arbeit in diesem Repo: eigene Melodien, eigene Akkordfolgen, eigene Muster | gehört dem Projekt; frei verwendbar für den Kanal |
| Spieluhren, Glasorgel, Fläche, Drone, Herzschlag, Einschlag, Sub-Fall, Spannungston, Wind, Rauschen (`klang.py`) | eigene Synthese mit numpy (additive Teiltöne, gefiltertes Rauschen), keine Samples | gehört dem Projekt |
| Hall (`klang.hall_ir`) | eigener Algorithmus: synthetische Impulsantwort aus gefiltertem, abklingendem Rauschen plus acht frühe Echos; keine aufgenommene Impulsantwort | gehört dem Projekt |
| Klavier und Streicher in Stil 3 (Klavier-Fläche) | FluidSynth 2.3.4 mit der SoundFont **FluidR3_GM** (Ubuntu-Paket `fluid-soundfont-gm` 3.1-5.3, Datei `/usr/share/sounds/sf2/FluidR3_GM.sf2`, SHA-256 `74594e8f4250680adf590507a306655a299935343583256f3b722c48a1bc1cb0`) | **MIT-Lizenz**, Copyright © 2000–2002, 2008 Frank Wen, © 2008 Toby Smithe. Aus der README: „I hereby release Fluid under the MIT license, as described in COPYING.“ Die MIT-Lizenz erlaubt kommerzielle Nutzung der damit erzeugten Aufnahmen ohne Namensnennung im Werk; die SoundFont selbst liegt nicht im Repo |
| FluidSynth (Programm) | Ubuntu-Paket `fluidsynth` 2.3.4 | LGPL-2.1; nur als Werkzeug benutzt, nicht weitergegeben. Die gerenderte Musik fällt nicht unter die LGPL |
| mido 1.3.3 (MIDI schreiben) | PyPI | MIT; nur Werkzeug |
| Hörproben `proben/*.mp3` | aus den eigenen Renders; `vorhoer-*.mp3` enthält zusätzlich Stimme und Effekte der Folge (ElevenLabs-Stimme nach den Kanalregeln, Effekte aus `engine/ton/effekte.py`) | wie die Teile, aus denen sie bestehen |

## Was ausdrücklich nicht drin ist

- **Kein Ton aus den Referenzvideos.** Die Demucs-Stems von r1, r2, r5 und ref0 liegen nur im Scratchpad der Sitzung. Ins Repo kamen nur Zahlen (`messwerte/analyse-*.json`, `messwerte/ref-*.json`: Terzspektrum, Tempo, Lautheit, Statistiken).
- **Keine Tonfolge aus den Referenzen.** Die Analyse-Skripte (`analyse/`) speichern keine Notenfolgen und keine Akkordfolgen, nur Anteile (Akkordtypen, Grundton-Schritte, Intervalle, Register). Die eigenen Stücke folgen der Grammatik in `GRAMMATIK.md`, nicht den Stücken.
- **Kein Sample aus einer Bibliothek** außer FluidR3_GM (MIT) für Stil 3.

## Abgleich der Harmonik (Stufenfunktionen relativ zur Tonika)

Damit nachprüfbar ist, dass nur die Grammatik übernommen wurde: Die Referenz-Folgen wurden per Chroma geschätzt und nur zum Vergleich in Stufen umgerechnet (nicht gespeichert).

| Stil | Referenz (Stufen, grob) | eigene Folge (Stufen) |
|---|---|---|
| 1 Spieluhr | I – vi – I – IV – I+ – … (Zeilen-Klischee 5–♯5–6 über der Tonika) | I – iii – IV – iv – I – I+ – vi – V, zweite Runde mit vi, IV, Vsus4 |
| 2 Wiegenlied | I – vi – I+ – iii – III – … (wie oben, mit Mediante) | I – iii – IV – iv – I – I+ – ♭VI (Ces-Dur) – V |
| 3 Klavier | i – IV – iv – … mit chromatisch fallender Mittelstimme | i – i(maj7)/7 – III/5 – V7/V – VImaj7 – V7sus4–V7 über dem fallenden Lamento-Bass (Barock-Gemeingut) |
| 4 Drone | Drone G1 mit Halbton-Cluster und Tritonus | Drone F1 mit E1/F♯1 und Tritonus H, eigene Zyklen |
