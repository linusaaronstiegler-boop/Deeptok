# Musik v2: Rechte, Quellen, Restrisiko

Stand 16.11.2026 (r2-eigen ergänzt). Alle Abrufdaten in UTC.

## Was von uns ist

- **Noten:** `muster/spieluhr.json`, `muster/klavier.json` und die daraus erzeugten `midi/*.mid`. Sie sind aus den Demucs-Musikspuren der Vorlagen transkribiert (`analyse/`) und an den markierten Stellen neu gesetzt.
- **Code:** `bauen.py`, `vergleich.py`, `analyse/*.py`.
- **Klang:** Gerendert mit der Soundfont **FluidR3_GM** (Frank Wen, MIT-Lizenz, Debian-Paket `fluid-soundfont-gm`, Datei `/usr/share/sounds/sf2/FluidR3_GM.sf2`). Die MIT-Lizenz erlaubt kommerzielle Nutzung. Hall, EQ und Leiern sind eigener Code. `fluidsynth` ist nur das Werkzeug.

## Was aus den Vorlagen übernommen ist

Übernommen ist, was als nicht schützbar gilt:
- Tempo, Taktart, Schleifenlänge und Stimmung
- Akkordfolge, Register und durchgehender Achtel-Rhythmus
- Arpeggio-Grammatik (Grundton, Terz, Quinte in 3+3+2)
- Basslinie aus Grundtönen

Eigenständig gesetzt ist die Oberstimme:
- **Spieluhr (r2/r5):** Die Spitzentöne in Takt 5–8 sind neu: E6 statt H5, E6 statt Cis6, Cis6 statt H5, Gis5 statt H5. Dazu kommt ein eigener Glitzerton Gis6 am Schleifenende statt des A6 der Vorlage.
- **Klavier (ref0):** Die Viertel-Melodie auf den Zählzeiten ist ganz neu, in 8 Takten aus Akkordtönen (`melodie_eigen`). Die Melodietöne der Vorlage sind entfernt.

## r2-eigen: das Bett der Serie (Stand 16.11.2026)

Linus wollte die Musik „sehr viel näher an den Vorbildern“. r2-v2 ist nah, aber zu nah: Die Begleitung folgt der Vorlage Achtel für Achtel, und unser Fingerabdruck stuft sie als „dasselbe Stück“ ein (0,828 bei z 4,6). Für Teil 1 und 2 läuft deshalb **r2-eigen**:

- **Bleibt wie r2 (Stil, nicht Werk):** Akkordfolge I – vi7 – vi – bVI+ zweimal, 111,7 BPM, 4/4 in Achteln, Schleife 17,19 s, Register E4–E6, Celesta aus FluidR3_GM, derselbe Hall, dasselbe Leiern, +46 Cent, Terz-EQ auf das Langzeitspektrum, Dichte und Lage der Oktav-Verdopplungen.
- **Eigen in allen acht Takten** (`analyse/eigene_figuren.py` → `muster/spieluhr-eigen.json`):
  - Arpeggio-Reihenfolge an 1–2 Stellen je Takt anders (Wendung nach oben, fallender Beginn, Bogen 4+4 statt 3+3+2, Rückschwung in den nächsten Takt).
  - Eigene Linien und Umkehrungen: Takt 1 in einem Zug über zwei Oktaven, Takt 4 von oben, Takt 6 von der Terz.
  - Haltetöne in Takt 2 und 5.
  - Eine eigene Oberstimme in halben Noten (Wiegenlied), die die Vorlage nicht hat.
  - Eigene Akzente (Streuung unter 3 dB); die Lautheitskurve der Vorlage je Achtel ist nicht übernommen.

**Gemessen** (Referenz: Demucs-Musikspur von r2, nur im Scratchpad):

| Fassung | Fingerabdruck gegen r2-Schleife (Ähnl. / z) | Urteil | Chroma fest (`vergleich.py`) | Spektrum |
|---|---|---|---|---|
| r2-eigen normal (`schleife`) | 0,733 / 4,1 | kein Treffer | 0,765 | 5,9 dB |
| r2-eigen dünn | 0,724 / 3,9 | kein Treffer | 0,767 | 5,6 dB |
| r2-eigen voll | 0,636 / 3,3 | kein Treffer | 0,685 | 7,1 dB |
| zum Vergleich: r2-v2 (Abschrift) | 0,828 / 4,6 | **Treffer** | 0,866 | 4,8 dB |
| zum Vergleich: v1 / fremde Stücke | – / 0,55–0,61, z 2,4–3,1 | nein | 0,57 | – |

Gegen die r5-Schleife (dasselbe Stück, tiefer und langsamer): r2-eigen 0,625 / z 3,5, kein Treffer. Treffer heißt Ähnlichkeit ≥ 0,78 **und** z ≥ 4,5.

Wie weit die Figuren weg sein müssen, habe ich in Stufen gemessen (Versuchsbau mit 4 Schleifen, Fingerabdruck / Chroma fest): nur die Lage ändern 0,831 / 0,866 (Treffer), 1–2 Änderungen je Takt 0,72 / 0,76, drei Änderungen 0,645 / 0,684, ganz fremde Figuren 0,575 / 0,58 (so weit weg wie ein fremdes Stück, der Stil ist dann weg). r2-eigen liegt in der Mitte: kein Treffer, aber deutlich näher an der Vorlage als v1.

Was das nicht leistet: Es ist eine Messung mit unserem eigenen Chroma-Fingerabdruck, keine Rechtsberatung. Content ID und die TikTok-Erkennung vergleichen Aufnahmen; Klang, Hall und Mischung sind ohnehin eigen. Eine Cover- oder Melodie-Erkennung ist nicht ausgeschlossen, aber die Begleitfiguren sind jetzt nicht mehr die der Vorlage. `r2-v2` und `r5-v2` (Abschrift) bitte nicht in Videos verwenden.

## Restrisiko (ehrlich)

- **Spieluhr:** Die Spieluhr-Vorlage hat keine eigene Melodie. Das Arpeggio ist fast das ganze Stück, und unsere Begleitung folgt ihm Achtel für Achtel. Nur die Oberstimme in Takt 5–8 und der Glitzerton weichen ab.
  - Unser eigener Chroma-Fingerabdruck (`analyse/fingerabdruck.py`) stuft die neuen Schleifen deshalb als „dasselbe Stück“ ein: r2 0,83 bei z 4,6, ref0 0,82 bei z 6,1.
  - Plattform-Erkennung (Content ID, TikTok) vergleicht Aufnahmen, keine Noten. Weil Instrument-Samples, Hall und Mischung andere sind, ist ein Treffer unwahrscheinlich. Eine Melodie- oder Cover-Erkennung ist aber nicht ausgeschlossen. Das ist eine Einschätzung, keine Rechtsberatung.
  - Wer mehr Abstand will, variiert die Oberstimme auch in Takt 1–4 (`VARIATION` in `analyse/muster_schreiben.py`). Dann `python -I analyse/muster_schreiben.py <analyse-ordner>` und `bauen.py` neu laufen lassen.
- **Referenz-Ausschnitte** `proben/*-referenz-*.mp3` sind fremdes Material: Musik aus TikToks von @jexario, @yougplat und @concet5612. Sie sind nur zum Vergleichshören da, über `proben/.gitignore` vom Repo ausgeschlossen und kommen nie in ein Video.

## Weg A: Ist die Vorlage ein freier Bibliothekstitel?

**Ergebnis: nicht gefunden.** Mit den erlaubten Mitteln war kein Original zu identifizieren. Belegt ist Folgendes:

1. **r2 und r5 sind dasselbe Stück.** r5 ist 3 Halbtöne tiefer und 1,19× langsamer, wie eine Tempo- und Tonhöhenänderung im Schnittprogramm. Der Fingerabdruck liegt bei 0,82 und z 5,2, Dehnung 1,20, Transposition −3. Fremde Stücke liegen bei 0,55–0,61 und z 2,4–3,1.
   - Folge: I – vi7 – vi – bVI+, zweimal, 8 Takte in Achtel-Arpeggien.
   - r2: E, +46 Cent, 111,7 BPM, Schleife 17,19 s.
   - r5: Cis, +55 Cent, 93,8 BPM, Schleife 20,46 s.
   - Das Originaltempo ist unbekannt.
2. **TikTok-Angaben (öffentliche Seiten und offizielle Embeds):**
   - r2 ist das Video `7707644009296039200` von @jexario (147 s, 7,3 Mio. Aufrufe). Als Ton steht dort „original sound – Jexario“, die Musik ist also eingebacken und nicht als Bibliothekssound verlinkt (Abruf 15.11.2026, 20:59).
   - ref0 (@concet5612, Video `7707748313222630686`) zeigt „original sound – concet5612“ (Abruf 14.11.2026, frühere Recherche).
   - r5 ist nicht unter den 10 neuesten Videos im Creator-Embed von @yougplat (Abruf 15.11.2026).
3. **Pixabay Music:**
   - Die Nutzungsbedingungen §8 (Stand 20.10.2026) verbieten „the use of programs or robots for automatic data collection“ und „Bulk, large-scale or systematic copying“. Automatisierte Abrufe bekommen außerdem HTTP 403. Deshalb habe ich keine Audiodatei geladen.
   - Die Lizenz-Zusammenfassung erlaubt kostenlose Nutzung ohne Namensnennung. Verboten ist der Weiterverkauf als eigenständige Datei. Content ID ist dort nicht geregelt.
   - Kandidaten von der Suchseite „creepy music box“ (Abruf 15.11.2026) zum Selbstanhören: Universfield „Creepy Music Box“ (`/music/beats-creepy-music-box-509259/`), „Horror Music Box“ (`/music/mystery-horror-music-box-145144/`), „Creepy Music Box Horror“ (`/music/mystery-creepy-music-box-horror-175957/`), „Spooky Music Box“ (`/music/suspense-spooky-music-box-513554/`), „Haunting Music Box“ (`/music/mystery-haunting-music-box-289437/`); leberch „Horror Music Box“ (`/music/suspense-horror-music-box-511181/`); Lilliben „Creeping Music Box – Horror Lullaby“ (`/music/mystery-creeping-music-box-horror-lullaby-365186/`). Alle unter `https://pixabay.com`.
4. **Incompetech (Kevin MacLeod, CC BY 4.0):**
   - Laut FAQ ist Monetarisierung auf YouTube erlaubt, der Credit ist Pflicht. TikTok wird nicht genannt. Eine Regel gegen automatisierte Abrufe stand dort nicht (Abruf 15.11.2026).
   - Den Katalog `pieces.json` habe ich gefiltert, die zwei passendsten Stücke geladen und geprüft: „Gone Beyond“ 0,55 und „Darkest Child“ 0,58, kein Treffer.
5. **Nicht geprüft:**
   - Freemusicarchive: Regeln zu automatisiertem Zugriff nicht gefunden, deshalb nichts geladen.
   - Freesound und OpenGameArt: HTTP 403, nicht umgangen.
   - YouTube Audio Library und Uppbeat: nur mit Login.
   - CapCut- und TikTok-Bibliothek: nur in der App.

**So prüft Linus selbst:** Kandidaten von Hand im Browser laden (das erlauben die Bedingungen), dann
`python -I analyse/fingerabdruck.py <referenz-schleife.wav> kandidat1.mp3 kandidat2.mp3`.
Treffer heißt: Ähnlichkeit ≥ 0,78 und z ≥ 4,5. Tonart und Tempo dürfen abweichen.
Die Referenz-Schleife entsteht aus der Demucs-Spur, z. B. `ffmpeg -ss 68.75 -t 17.188 -i <r2-stem-other.wav> r2-ref-schleife.wav`. Sie liegt im Scratchpad und nicht im Repo.

Erfolgversprechend ist auch die **CapCut-Bibliothek**, weil die Untertitel von r5 wie CapCut-Auto-Untertitel aussehen. Dort in der App „music box“ durchhören.

Wird ein Original gefunden, Lizenz und Content-ID-Hinweis der Trackseite prüfen und hier eintragen. Erst dann das Original statt v2 nehmen.
