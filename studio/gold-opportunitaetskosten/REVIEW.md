# Review: Goldstandard „Was kostet es, Lewandowski zu behalten?“ (Runde 1, 27.10.2026 spät)

Phase 1 nach `docs/VIDEO-PIPELINE.md` §9. Gebaut nach `drehbuch.md`, `fakten.json`, `build/script.py` und `../DESIGN.md`, Bauweise A+ aus dem Bühnen-Spike. Diese Fassung arbeitet die drei Prüfungen der Runde 1 ein (Bild, Didaktik, Technik). Nichts committet, nichts gepusht.

**Die Stimme ist weiter ein Platzhalter** (Piper „thorsten-high“, nur für das Timing). Der Tausch ist eine Zeile: `python build/voice.py --anbieter <sieger>`, danach `node build/bauen.mjs`. Alle Bildzeiten folgen den neuen Wortzeiten; die Tore im Bau melden, wenn eine Zeit dabei nicht mehr passt.

## Messwerte

| Wert | Runde 1 | vorher | Ziel |
|---|---|---|---|
| Dauer | 69,4 s (153 Wörter, 12 Szenen; +0,8 s durch zwei Atempausen) | 68,6 s | ≤ 90 s |
| `hyperframes check` | **0 Fehler**, 7 Warnungen (unten begründet) | 0 / 8 | 0 Fehler |
| `check --caption-zone` (DESIGN.md §2) | 0 Fehler | 0 | 0 Fehler |
| Hör-Check **auf dem gerenderten MP4** | WER **3,3 %**, **−16,1 LUFS**, −4,4 dBTP, 2 lange Stillen (beide deklariert), 2,38 Wörter/s, 48 kHz Stereo, `ok: true` | WER 2,0 %, im MP4 −13,1 LUFS | G4 |
| Bildanteil (`build/messen-bild.mjs`, alle 0,1 s im Player) | **55,5 %** | 58,9 % (alle 0,25 s, andere Zählung) | ≥ 50 % |
| Renderzeit (`--workers 3`) | **111,9 s**, 10,9 MB | 103 s, 9,1 MB | – |
| Cue: Text gegen Wortanfang (Tor im Bau, 28 Texte) | **max. 83 ms** | bis 443 ms | ≤ 150 ms |
| Cue: Energie-Probe (25 Einsätze nach Pausen) | max. 53 ms, Median 4 ms | max. 99 ms | – |
| Cue: Whisper roh | max. 378 ms (siehe unten) | 374 ms | – |
| Einzelbild-Scan (`build/flackern.py`, 2082 Bilder) | **0 Ausreißer an 12 Nähten** | 1 (Bild 989) | 0 |
| Seek-Test (`build/seek-test.mjs`, 15 Bilder) | alle pfadunabhängig und bildgenau | – | alle |
| Ton im Render gegen `voice.m4a` | 0 Samples Versatz | 0 | 0 |
| Längste Einstellung ohne Fahrt/Schnitt | 13,8 s (Beats 3–4), danach 12,3 s (Diagramm); Median ≈ 6 s | 19,7 s, 18,3 s, 12,8 s | p90 12 s |

**Zur Lautheit.** `voice.m4a` ist jetzt Stereo (beide Kanäle gleich) mit −16 LUFS. Vorher war sie Mono mit −16 LUFS, und der Render mischte sie auf Stereo; nach BS.1770 sind das +3 LU, also −13,1 LUFS im fertigen MP4. Der Hör-Check läuft jetzt auf dem MP4 selbst, nicht auf der Zwischenstufe.

**Zur Cue-Abweichung.** Whisper meldet 7 Cues über 150 ms. Zwei Anfänge legt es in Stille („Barcelona“ in den Vorlauf, „Naheliegend“ in die Denkpause). Die beiden größten übrigen habe ich an der Hüllkurve nachgemessen:
- „nur“: Whisper 9,94 s, also mitten in „Antwort“. Laut Hüllkurve ist es dort bis 10,34 s still, die Stimme setzt bei 10,34 s ein. Das Alignment sagt 10,28 s.
- „Ablöse“: Whisper 30,98 s. Die Hüllkurve hat bei 31,16 s eine Delle zwischen „Millionen“ und „Ablöse“, dann folgt der Verschlusslaut von „Ab-“ bei 31,28 s. Das Alignment sagt 31,24 s.

Die Wortzeiten stimmen also auf etwa 60 ms. Gemessen mit Whisper allein bleibt das 150-ms-Ziel trotzdem unerreicht; Whisper taugt hier nur als Grob-Tor.

## Was in Runde 1 geändert ist

**Beat 8, die Auflösung (Prüfung 2 P0, Prüfung 1 P1).** Vorher lagen Gehalt und 45 Mio. nach dem Verkauf weiter unter „Kosten“, und „Opportunitätskosten“ stand über „Nutzen“. Jetzt:
- An der Säule hängt ein **Schild**, das sagt, welche Entscheidung die Waage wiegt: „Behalten“ ab Beat 3.
- Auf „Im Juli **nimmt** Bayern das Geld“ neigt sich die Waage, auf „Geld“ wird der Geist (siehe nächster Punkt) zu echten Münzen, der Gehalt-Beleg geht (wer verkauft, zahlt kein Gehalt mehr).
- Auf „Auch **Verkaufen** …“ **dreht sich die Waage um** (0,6 s, wie ein Drehteller): Das Schild zeigt „Verkaufen“, das Geld fährt auf „Nutzen“, der Spieler auf „Kosten“. Die Neigung dreht sich mit; die Nutzen-Seite hängt danach unten.
- Auf „Opportunitätskosten“ steht das Etikett in Gold unter der **Kosten**-Schale. Auf „eine Saison“ fliegt der Spieler ab und lässt einen gestrichelten Gold-Umriss zurück, dazu „1 Saison“.
- Damit liegen Opportunitätskosten in jedem Bild links auf „Kosten“. Der Passschnitt reimt jetzt auch inhaltlich: gestrichelter Gold-Umriss auf „Kosten“ → gestricheltes Gold-Fach auf „Kosten“.

**Widerlegung (Prüfung 2 P1).** Nach München fliegt nur ein **Geist** des Stapels: ein gestrichelter Gold-Umriss, das Geld ist nur eine Möglichkeit. Das echte Geld bleibt in Barcelona. Während „Behalten keinen Cent“ liegt bei Bayern also kein Geld, nur sein Umriss. Auf „fehlt **genauso** wie bezahltes“ bekommt der Geist Gewicht: Er drückt die Schale, die Waage schwingt auf waagerecht. Beim Begriff umkreist der Gold-Kreis denselben Geist.

**Spieler (Prüfung 1 und 2).** Statt des Schach-Bauern („Bauernopfer“) eine **Tipp-Kick-Figur**: Sockel, Trikot, Schussbein, Druckknopf auf dem Kopf, Ball am Fuß. Keine Rückennummer, denn jede Zahl im Bild braucht einen Beleg. Der Name steht im Hook neben der Figur und auf der Waage 5 s klein unter ihr. Der Abflug geht erst senkrecht über den Balken, dann im Bogen oben links aus dem Bild. Die Figur kreuzt weder Säule noch Beleg noch Text.

**Vertrag (Prüfung 1 P1, Prüfung 2 P2).** Statt eines Textstapels oben links gibt es jetzt Gegenstände:
- ein Blatt „Vertrag / bis 30.06.2023“, das auf „Vertrag“ fällt;
- daneben eine Zeitleiste, die auf „Saison“ einmal abläuft („1 Saison“);
- eine gestrichelte Verlängerung, die auf „Verlängern“ erscheint und auf „nicht“ erlischt;
- auf „ablösefrei“ der Stempel „ablösefrei“ auf dem Blatt (Reim zum Stempel „bezahlt“) und „0 €“ am Ende der Zeitleiste.

Die doppelte Linie (Unterstreichung plus Band) ist weg.

**Diagramm (Prüfung 1 P1, Prüfung 2 P1/P2).**
- Die Kosten-Schale trägt dieselben zwei Dinge an denselben Plätzen wie im Atlas: links das gestrichelte Gold-Fach „aufgegeben“, rechts eine Rechnung aus Papier mit dem Stempel „bezahlt“.
- Auf „geschenkt“ steht als Summe **0 €** auf der Rechnung. Damit ist „bezahlt geschenkt“ weg.
- Die Kinokarte ist eine echte Karte mit Abriss und Kerben, das Schild an der Säule sagt „Kino“.
- Die Lohntüte steht 1,4-fach groß neben „Nachhilfe, heute Abend“ und fällt auf „Lohn“ senkrecht ins Fach.
- Striche 8 px, Raster 9 %/18 % (vorher 6/12 %), sichtbar im Handy-Blatt.
- Die Gleichung erscheint erst, wenn sie gesprochen wird („Also **kostet** dich …“).

**Satz und Schlussbild (Prüfung 2 P1, Prüfung 1 P1/P2).** Kein „Aufgeben = Kosten“ mehr: Als Gleichung widersprach es der Zeile darüber, und ohne „auch“ lehrte es den umgekehrten Fehler.
- In der Atempause vor dem Satz fährt die Welt 2-fach an die Kosten-Schale heran: links der Lohn im Gold-Fach, rechts die Rechnung mit 0 €.
- Auf „aufgibst“ kommt die Gold-Unterstreichung in der Gleichung.
- Auf „Rechnung“ wird der Kopf der Rechnung unterstrichen, in Stempel-Navy. Das Bild sagt so den Satz: Der Lohn steht auf keiner Rechnung.
- Klammer und D2 entfallen; das Schild „Kino“ tritt vor der Fahrt zurück.

**Hook (Prüfung 2 P1, Prüfung 1 P2).**
- Die Schilder hängen sich schon auf „kostet“ an und stehen 3,8 s statt 2,6 s. Sie pendeln 0,35 s statt 0,7 s und hängen versetzt und schräg an 3-px-Schnüren.
- Keine Dateline und keine Ländernamen mehr: 9 statt 11 Textelemente.
- Zeilenhöhe der Schlagzeile 1,1; die Unterstreichung sitzt 0,09 × Schriftgröße unter der gemessenen Grundlinie und tritt zusammen mit dem Text ab.

**Rhythmus (Prüfung 1 P1).** Die Waage hängt 80 px tiefer, so ist über ihr Platz und das Schlussbild ist nicht kopflastig. Neu sind:
- eine Nachfahrt auf Geist und Kreis nach der Lesezeit des Begriffs;
- die Rückfahrt zusammen mit der Drehung;
- eine Nachfahrt im Satz;
- die Fahrt nach Barcelona startet erst auf „bietet“ (vorher stand danach ein leeres Bild).

Längste Einstellung jetzt 13,8 s statt 19,7 s.

**Technik (Prüfung 3).**
- Naht-Rundung: Beginn und Ende werden als absolute Zeit auf ms gerundet, die Dauer ist ihre Differenz. Ein Clip endet damit genau mit seinem Host; die Probe über alle Clips ergibt 0 Abweichungen.
- Lautheit: Stereo-m4a mit −16 LUFS.
- `timing.json` trägt die SHA-256 von `voice.m4a`; `bauen.mjs` bricht bei Abweichung ab.
- `voice.py --nur-pruefen` dekodiert die m4a und braucht die (gitignorierte) WAV nicht mehr; geprüft mit weggeräumter WAV.
- Neues Tor im Bau: Jeder Text erscheint höchstens 150 ms neben seinem Wort (28 Texte, max. 83 ms). Neue Ruhe-Prüfung: Der Spieler steht nach der Drehung 1,55 s, bevor er abfliegt.
- `messen-bild.mjs` prüft jetzt auch jeden Welt-Text auf das Lesefenster und meldet HUD-Text über Gegenständen.
- Neu: `flackern.py` (Einzelbild-Scan nach jedem Render) und `seek-test.mjs` (Nachbar-Kriterium statt fester 28 dB).

**Ton (Prüfung 2 P2).** Zwei deklarierte Atempausen (`atem_s` 0,9 s im Skript): nach „Behalten keinen Cent.“ und vor „Auch was du aufgibst“. Sie gelten auch für die Casting-Stimme. Die neue Piper-Aufnahme habe ich zweimal erzeugt und die bessere genommen (WER 3,3 % gegen 7,8 %).

## Abweichungen vom Drehbuch

1. **Geist statt fliegendem Geld.** Der Stapel in Barcelona bleibt; nach München fliegt sein Umriss und wird erst auf „Geld“ (Beat 8) echt. Das Drehbuch sagt „Darsteller geld … wechselt nie die Form“.
2. **Die Waage dreht sich in Beat 8** und hat ein Schild („Behalten“ → „Verkaufen“; im Diagramm „Kino“). Neigung links schon auf „nimmt“ (vorher „Geld“), damit der Spieler nach der Bewegung lange genug steht.
3. **„Opportunitätskosten“ und „1 Saison“** stehen in Gold unter der Kosten-Schale, nicht am Stapel und nicht über der Nutzen-Schale. Der Begriff in Beat 7 bleibt D2 oben.
4. **Der Spieler landet nicht in Barcelona**, er fliegt oben links aus dem Bild. Die Kamera bleibt auf der Waage, denn der Umriss auf „Kosten“ trägt die Auflösung.
5. **Tipp-Kick-Figur** statt Foto (Lizenz offen, KI-Bild verboten).
6. **Vertrag als Blatt mit Zeitleiste** statt HUD-Text; keine Unterstreichung unter „30.06.2023“.
7. **Keine Datelines** („Sommer 2022“, „Juli 2022“): Die Daten stehen in den Credits („Lage: … 14.05.2022“, „Wechsel: FC Barcelona, 19.07.2022“). Grund: Text-Last im Hook (Prüfung 1), und der abfliegende Spieler kreuzte „Juli 2022“.
8. **Keine Ländernamen.**
9. **Diagramm:** Rechnung und Gold-Fach statt zweier Textkästen; „geschenkt“ zeigt sich als „0 €“ auf der Rechnung; keine Klammer „Rechnung“; kein „Aufgeben = Kosten“.
10. **Gleichung erst in Beat 11** (auf „kostet“), nicht ab dem Schnitt.
11. **Skript (`build/script.py`)**, Sprechtext unverändert:
    - neue Cues `nur`, `verlaengern_an`, `bietet`, `gewicht`, `nimmt`, `dreh`, `abflug_spieler`, `ok_saison`, `gleichung`; `landung_spieler` entfällt;
    - neues Feld `atem_s`.
    - Die Tabelle in `drehbuch.md` kennt diese Cues noch nicht (Wunsch unten).
12. **Waage 80 px tiefer** (Fuß y = 1160), zwei Nachfahrten. Kamerafahrten 0,6/0,7 s wie zuvor.

## Warnungen, die bleiben

- `composition_file_too_large` (3×): `atlas.html` (1317 Zeilen), `diagramm.html` (1071) und `satz.html` (302) enthalten die eingesetzten Bibliotheken und die Karte. Von Hand bearbeitet wird nur der Teil außerhalb der Marken.
- `timeline_track_too_dense` (1×): die Beat-Marken der Atlas-Bühne. Sie sind unsichtbar und dienen nur `snapshot --review`.
- `line_unread` (3×): „Opportunitätskosten“ und der Gabler-Credit in `verkauf`, „geschenkt ≠ gratis“ in `satz`. Alle drei sind Fortsetzungen aus der Szene davor. Tatsächlich stehen sie 5,4 s, 5,4 s und 1,9 s; `check` sieht jede Datei einzeln.
- `dead_stretch` ist weg: Die Denkpause trägt `data-hold`, die Stille ist gewollt.

## Schwächste Stelle

**Beats 3–4 (9,6–23,4 s).** Das ist die längste Einstellung (13,8 s) und das textreichste Bild nach dem Hook. Dort stehen Behauptung, Vertrag, Zeitleiste, „0 €“, Beleg mit Stempel, Schild und Credits zugleich. Alle 1–2 s kommt etwas Neues, aber eine Kamerafahrt geht hier nicht: Vertrag und Zeitleiste reichen von x 125 bis 960, und jede Nachfahrt schöbe Text aus dem Lesefenster. Mit mehr Zeit würde ich die Zeitleiste auf das Vertragsblatt drucken. Dann wäre rechts Platz für eine kurze Fahrt auf den Vertrag.

Danach kommen diese Stellen:
- **Die Stimme.** Piper liest „Opportunitätskosten“ als „Oportunitätskosten“ und „eine Saison“ undeutlich. Die Echo-Frage „Nur sein Gehalt?“ steigt nicht.
- **Kurze Überdeckungen.** Der Geist streift beim Mitschwenken für etwa 0,1 s das Ende der durchgestrichenen Behauptung, und fallende Gegenstände (Beleg, Vertrag) kreuzen sie für 1–2 Bilder. `messen-bild.mjs` meldet alle Stellen mit Zeit.
- **Die Lohntüte im Fach** ist vor der Nachfahrt nur 120 px breit; groß ist sie beim Zeichnen (1,4-fach) und in der Nachfahrt (2-fach).

## Nicht behoben (mit Grund)

- **Platzhalter-Stimme (Prüfung 3 P0):** Die Casting-Entscheidung fällt am 1.11. Bis dahin taugt eine Bewertung durch die Brüder nicht als Freigabe.
- **Echo-Frage „Nur sein Gehalt? Das stimmt nicht.“ (Prüfung 2 P2):** Der Text ist von der Chefredaktion geprüft und bleibt. Beim Casting-Hör-Check auf den Anstieg achten (`steigt` steht im Skript).
- **Bildpaar „Verkaufen 45 Mio. € · Behalten 0 €“ (Prüfung 2 P1, Zusatz):** Den Widerspruch löst der Geist. Ein zweites Textpaar hätte die Widerlegung zur Folie gemacht (Bildanteil).
- **Rotes Kreuz für „Nichts, er ist ja da“ (Prüfung 2 P2):** Rot gibt es genau einmal (Durchstrich). Der Ablenker wird widerlegt, wenn der Gehalt-Beleg auf die Kosten-Schale fällt; im Info-Blatt steht es ausdrücklich.
- **Schild per Morph nach oben links (Prüfung 2 P2):** Nach dem Zoom hinge das Schild unterhalb des Lesefensters. Die Behauptung erscheint jetzt auf „nur sein Gehalt“, 1,4 s nach den Schildern (vorher 2,2 s).
- **Rückennummer 9 (Prüfung 1):** Sie wäre eine Zahl ohne Beleg im Faktenblatt.
- **Einstellungen über 12 s:** Beats 3–4 mit 13,8 s (siehe „Schwächste Stelle“) und das Diagramm bis zur Nachfahrt mit 12,3 s. Im Diagramm ist die Waage 880 px breit, jede Fahrt schneidet eine Schale ab, darum erst im Satz.
- **Tempo 2,38 statt 2,2 Wörter/s:** Das Tempo ist eine Eigenschaft der Stimme und kommt mit dem Casting.

## Gemessen, nur angesehen, ungeprüft

- **Gemessen:**
  - `check` (auch mit Untertitel-Zone);
  - Lesefenster aller HUD-Texte im Bau; Lesefenster aller Welt-Texte im Player;
  - Kollisionen HUD/Welt, Bildanteil;
  - Cue-Tor, Haltezeiten, Hör-Check auf dem MP4, Lautheit, Ton-Versatz;
  - Einzelbild-Scan, Seek-Test, Renderzeit.
- **Angesehen:**
  - Beat-, Naht- und Handy-Blätter aus `snapshot --review` (zwei Durchgänge);
  - 28 Einzelbilder und die Drehung (6 Bilder) aus dem MP4.
  - Belege in `belege/`: `frage-geist.jpg`, `drehung-verkaufen.jpg`, `rechnung-schluss.jpg`.
- **Ungeprüft:** iPhone/Safari; wie die Drehung auf einem echten Handy wirkt; Ton am Kopfhörer; Bewertung durch die Brüder.

## Wiederholen

```bash
. /opt/deeptok/env.sh
cd studio/gold-opportunitaetskosten
# Stimme (nur bei neuem Skript oder neuer Stimme). Ohne das Paket onnx fällt voice.py auf
# geschätzte Wortzeiten zurück; heute lag onnx nur im Scratchpad (PYTHONPATH, Wunsch unten).
/home/user/Deeptok/.venv/bin/python build/voice.py --anbieter piper
python build/script.py --cues                       # Selbstprüfung des Skripts
node build/bauen.mjs                                # Prüfsummen, Zeiten, Cue-Tor, Messen
npx hyperframes check && npx hyperframes snapshot --review
npx hyperframes render --workers 3 -o renders/gold.mp4
/home/user/Deeptok/.venv/bin/python build/flackern.py renders/gold.mp4   # Nähte, Exit 1 bei Ausreißer
python ../../factory/fabrik.py hoercheck --audio renders/gold.mp4 --text <sprechtext.txt> --erlaubte-stillen 2 --json
npx hyperframes play . --port 3115 --no-open &      # Player im Hintergrund, dann:
node build/messen-bild.mjs 3115 0.1                   # Bildanteil, Lesefenster, Kollisionen
node build/seek-test.mjs 3115 renders/gold.mp4      # Seek-Test gegen den Render
```

## Was Linus jetzt tun und prüfen soll

1. **Das MP4 am Handy ansehen** (`renders/gold.mp4`, gitignored: nur in dieser Sitzung oder nach neuem Render). Die Stimme bitte wegdenken. Achte auf:
   - 44–51 s: Drehung der Waage, Abflug, Umriss;
   - 29–36 s: Geist;
   - 63–69 s: Nachfahrt auf die Rechnung.
2. **Die drei Belegbilder in `belege/`** ansehen; sie zeigen die drei großen Änderungen.
3. **Entscheiden:** Tipp-Kick-Figur oder Wikimedia-Foto (Duoton, Lizenz prüfen)?
4. **Noch keine Freigabe-Bewertung durch die Brüder:** Erst nach dem Stimmtausch am 1.11. Dann `voice.py --anbieter <sieger>`, `node build/bauen.mjs`, neu rendern und die Tore oben laufen lassen. Für den Bruder bei etwa 6,5 s von Hand anhalten (Denkpause): Einen Player mit Halt gibt es noch nicht.
5. **Beim Casting-Hör-Check** auf „Opportunitätskosten“, „eine Saison“ und den Anstieg bei „Nur sein Gehalt?“ achten.

## Wünsche an andere Dateien (nicht geändert)

1. **`drehbuch.md` (Chefredaktion):** Tabelle und Kamera-Vertrag an Runde 1 anpassen. Gemeint sind Geist, Drehung mit Schild, Vertrag als Blatt, Rechnung und Gold-Fach im Diagramm, keine Datelines, kein „Aufgeben = Kosten“, neue Cues und `atem_s`.
2. **`factory/` (G0, Bogen-Prüfung):** eingeschobene Beats Begriff, Auflösung und Satz zulassen, dazu zwei Widerlegungs-Szenen hintereinander; das Feld `atem_s` kennen (0,6–1,1 s, keine „lange Stille“).
3. **`factory/werk/hoercheck.py` und der Ablauf der Fabrik:**
   - G4 nach dem Render auf dem MP4 laufen lassen, nicht auf der Zwischenstufe.
   - `--text` auch direkt als Text annehmen.
   - Für Cue-Prüfungen die Energie-Probe `pruefe_einsaetze` aus `build/voice.py` übernehmen, Whisper nur als Grob-Tor.
4. **`docs/VIDEO-PIPELINE.md` §6:** als Kandidaten für die Tore aufnehmen:
   - für G6: `build/messen-bild.mjs` (Bildanteil, Lesefenster aller Texte, Kollisionen) und das Cue-Tor in `build/bauen.mjs`;
   - für G7: `build/flackern.py` und `build/seek-test.mjs`.
5. **`tools/setup-umgebung.sh`:** das Paket `onnx` (bzw. `piper-tts[alignment]`) in die Werkstatt-venv aufnehmen und danach `SETUP_VERSION` hochzählen. Ohne `onnx` gibt es nur geschätzte Wortzeiten.

`studio/DESIGN.md` habe ich selbst ergänzt (erlaubt):
- Raster 9/18 %, Gegenstände im Diagramm dürfen gefüllt sein, Ketten 4 px;
- Geist, Schild, Papier-Gegenstände;
- Nachfahrt und Drehung als Übergänge, Stempel als Marker, Marker auf Papier in Navy, Unterstreichung 0,09 × Schriftgröße unter der gemessenen Grundlinie;
- D2 zweizeilig mit Zeilenhöhe 1,1, Daten in die Credit-Zeile, abgedunkelte Texte zählen nicht als Text;
- BANNED 17–19.
