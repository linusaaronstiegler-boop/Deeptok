# Anhang B: Stimme und Ton im Detail

Gehört zu `plan-final.md`. Stand 15.11.2026. Quellen-Kürzel stehen in Anhang C.

## B1. Wie gemessen wurde

- 139 Kandidaten-Clips: 36 Proben bei Cartesia und Inworld mit dem Referenzsatz, dazu etwa 90 kostenlose ElevenLabs-Vorschauen mit anderem Text [ST].
- Hauptmaß ist WeSpeaker (Kosinus-Ähnlichkeit der Sprecher-Embeddings) gegen die ganze, per Demucs getrennte Stimmspur der Referenz.
- Maßstab: Dieselbe TTS-Stimme mit anderem Satz ergibt 0,80–0,89 (Median 0,87). Verschiedene Stimmen ergeben im Median 0,22 (P99 0,58). Unterschiede unter 0,05 sind Messrauschen.
- Claude konnte nicht hören. Die Endauswahl trifft Linus per Ohr, auf der Seite „Stimmen anhören“.
- Verbrauch: Cartesia 1.918 Zeichen, Inworld 2.123 Zeichen, ElevenLabs 0 [ST].

## B2. Je Referenz-Stil

### r5 (@yougplat) und ref0 (@concet5612): Empfehlung fürs Hauptkonto

- **Befund:** Dieselbe Stimme auf zwei fremden Kanälen (WeSpeaker 0,75, Resemblyzer 0,96, WavLM 0,98). Beide sind per Resample beschleunigt, also schneller abgespielt, ohne die Tonhöhe zu halten: r5 um ×1,30, ref0 um ×1,40. Zurückgerechnet ist es ein Mann mit etwa 121–128 Hz und 200–224 Wörtern/min [ST]. Gegenbefund: Die Erstanalyse von r5 fand normale Formanten und vermutete Beschleunigen bei gleicher Tonhöhe (1,2–1,4×) [Analyse]. Der Abgleich über 139 Clips spricht für Resample; sicher ist es nicht.
- Dass zwei unabhängige Kanäle sie nutzen, spricht für eine öffentliche Stock-Stimme, nicht für einen persönlichen Klon [ST].

| Rang | Stimme | ID | Ähnlichkeit | Hörprobe |
|---|---|---|---|---|
| 1 | Inworld „Casey“, ×1,3 | `Casey` (inworld-tts-2) | 0,57 mit r5-Satz, 0,73 mit ref0-Satz (×1,4) | `audio/r5-casey.mp3`, `audio/ref0-casey.mp3` |
| 2 | Cartesia „Benji“, ×1,4 | `2d5b8c3a-116c-4741-acaf-ba4fa289eba2` (sonic-3.6) | 0,72 (ref0), 0,51 (r5) | `audio/ref0-benji.mp3` |
| später | ElevenLabs „Adam“ (premade), ×1,45 | `pNInz6obpgDQGcFmaJgB` | 0,73, nur 1,2 s Vorschau, anderer Text | `audio/ref0-el-adam-vorschau.mp3` |
| später | ElevenLabs „Roger“ (premade), ×1,35 | `CwhRBWXzGAHq8TQ4Fs17` | 0,68, nur 2,6 s Vorschau, anderer Text | `audio/r5-el-roger-vorschau.mp3` |

**Nachbearbeitung (Produktion):**
1. TTS bei etwa 220 Wörtern/min erzeugen.
2. `aresample=44100,asetrate=57330,aresample=44100` (×1,30; für ×1,40 `asetrate=61740`). Das hebt Tempo, Tonhöhe und Klangfarbe zusammen an.
3. Pausen auf ≤ 0,23 s kürzen, Lautheit −14,6 LUFS, `alimiter=limit=0.89`. Kein Hall, kein Tiefpass.

### r1 (@horrorrobs)

- **Befund:** trocken, männlich, F0-Median 166 Hz, 200 Wörter/min Sprechzeit, Satzpausen 0,33 s, eher TTS (etwa 70 %). Nicht identifiziert. Der Kanalname könnte auf eine echte Person deuten, deshalb nicht klonen [ST][Analyse].

| Rang | Stimme | ID | Ähnlichkeit | Hörprobe |
|---|---|---|---|---|
| 1 | Inworld „Bryce“ | `Bryce` | 0,66 (0,71 ohne Dehnen) | `audio/r1-bryce.mp3` |
| 2 | Inworld „Chip“ | `Chip` | 0,65 | `audio/r1-chip.mp3` |
| 3 | Cartesia „Benji“ | `2d5b8c3a-…` | 0,61, trifft als einzige die Tonlage (165 Hz) | `audio/r1-benji.mp3` |
| später | ElevenLabs „Titan“ | `dtSEyYGNJqjrtBArPCVZ` | 0,60, Vorschau mit anderem Text | `audio/r1-el-titan-vorschau.mp3` |

**Nachbearbeitung:** +1 Halbton (`rubberband=pitch=1.0595:formant=preserved`), Tempo 1,1 besser über die API (Inworld `speakingRate`), weil Dehnen die Ähnlichkeit senkt (Bryce 0,71 → 0,66). Pausen ≤ 0,35 s, −14,8 LUFS, optional `acompressor=threshold=-20dB:ratio=3`.

### r2 (@jexario)

- **Befund:** hell, männlich, etwa 18–25 Jahre, 170 Hz, 200 Wörter/min Sprechzeit, Satzpausen 0,42 s, −19,3 LUFS. Nicht gefunden: Der beste Wert liegt bei 0,59 [ST].

| Rang | Stimme | ID | Ähnlichkeit | Hörprobe |
|---|---|---|---|---|
| 1 | Cartesia „Garrett“ | `c58bda25-abd5-4c72-97a2-4dbe049b368d` | 0,56 | `audio/r2-garrett.mp3` |
| 2 | Inworld „Casey“ | `Casey` | 0,48 | `audio/r2-casey.mp3` |
| 3 | Cartesia „Kyle“ (+2 Halbtöne) | `c961b81c-a935-4c17-bfb3-ba2239de8c2f` | 0,44 | `audio/r2-kyle.mp3` |
| später | ElevenLabs „Drew – Casual, Curious, Fun“ | `q0IMILNRPxOgtBTS4taI` | 0,48, Vorschau mit anderem Text | `audio/r2-el-drew-vorschau.mp3` |

Eine frühere Messung mit Resemblyzer (anderes Maß) sah ElevenLabs „James – Conversational, Energetic, Punchy“ (`QhpsGjDKZmM9qRYdMhBD`) mit 0,815 vorn [Analyse]. Für Phase 2 mit ElevenLabs beide anhören.

**Nachbearbeitung:** +1 Halbton, Tempo 0,97, Pausen ≤ 0,45 s, kein Nachverdichten.

## B3. Regeln

- Stock-Stimme, die gleich oder ähnlich klingt: ja. Klon einer echten Person: nein (Linus' Vorgabe 5).
- Eine Stimme je Konto, über alle Serien gleich. Sie spricht auch die Dialoge, dann höher und erregter [FS] §1.
- Lizenz: Inworld On-Demand enthält die kommerzielle Lizenz ohne Grundgebühr [G5c]. Cartesia Free hat keine kommerzielle Lizenz, fürs Konto braucht es Pro für 5 USD/Monat [G5b]. ElevenLabs Free ebenso nicht, ab Starter ja [G5].
- Tempo besser über die API setzen als nachträglich dehnen [ST].
- Wartung: `CARTESIA_API_KEY` und `INWORLD_API_KEY` liegen in der Cloud als normale Umgebungsvariablen statt als Network Secret [ST]. Vor Phase 1 umstellen.

## B4. Ton

**Linus' Vorgabe 2:** Der Hintergrundsound kommt aus der TikTok-Bibliothek und wird beim Hochladen in der App gewählt; er steht dann unten im Video. Der Render enthält nur Stimme und Effekte.

**Was die Referenzen unterlegen** [SO]:

| Referenz | Bett | Abstand zur Stimme | Bibliothekssound? |
|---|---|---|---|
| r1 | kein Song: tiefer Drone um G1 plus bildgenaue Effekte | 9,7 LU | nein, eigenes Sounddesign |
| r2 | Spieluhr-Loop, 112 BPM, 17,2 s, +46 Cent verstimmt | 11,9 LU | vermutlich, in der App ablesen |
| r5 | Wiegenlied-Glocken, 93 BPM, +50–60 Cent verstimmt | 11,7 LU | vermutlich, in der App ablesen |
| ref | Klavier-Arpeggien in drei Stufen, A = 432 Hz | 5,1 LU | vermutlich „Sad Piano“, in der App ablesen |

**Vorgehen in der App:**
1. Bei r2 und r5 unten links den Soundnamen ablesen oder auf die drehende Scheibe tippen. Steht dort ein Titel und nicht „Originalton – …“, diesen oder einen ähnlichen Spieluhr-Sound wählen.
2. Lautstärke des hinzugefügten Sounds deutlich unter die Stimme ziehen, Ziel etwa 12 LU Abstand. Die App zeigt keine LU; die Probemixe auf der Seite (`audio/mix-*.mp3`) sind die Hörvorlage (A).
3. Ob TikTok einen Bibliothekssound später stummschaltet und ob er die Creator-Rewards-Berechtigung berührt, ist ungeprüft (u).

**Was wir liefern:**
- Stimmspur −14,5 LUFS integriert, True Peak ≤ −1 dBTP, mono, mittig.
- Etwa 1 Effekt je 15 s, nur auf Schlüsselwörtern (r5: rund 11 Effekte in 161 s; r2: 4 in 147 s) [SO]. Vorrat (selbst synthetisiert, keine fremde Tonspur) in `horror-analyse/sound/sfx/`:
  - `r5-sub-boom.wav` auf Wendepunkten, `r5-rumpeln-hook.wav` im Hook,
  - `r5-riegel.wav` als wiederkehrendes Motiv für einen Hinweis (r5: dreimal „bolt the door“),
  - `r2-metall-schlag.wav` und `r2-stampfer.wav` für den Höhepunkt,
  - `r1-impact-*.wav`, `r1-whoosh.wav`, `r1-knistern-pfeifen.wav` für Enthüllungen.
- Die eigenen Betten (`*-bett-a/b.wav`) nur als Probemix zum Anhören, nicht im Upload.

**Probemixe** [SO] (Stimme Rang 1 über eigenem Bett, nur zur Orientierung):
- `r1-mix.wav`: Bryce über Drone, 9,7 LU Abstand.
- `r2-mix.wav`: Garrett über Spieluhr, 11,9 LU.
- `r5-mix.wav`: Casey über Glocken, 11,7 LU.
