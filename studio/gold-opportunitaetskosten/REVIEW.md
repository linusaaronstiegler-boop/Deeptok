# Review: Goldstandard „Was kostet es, Lewandowski zu behalten?“ (27.10.2026, abends)

Phase 1 nach `docs/VIDEO-PIPELINE.md` §9: die Probe „Opportunitätskosten“ von Hand im neuen Look, gebaut nach `drehbuch.md`, `fakten.json`, `build/script.py` und `../DESIGN.md`. Bauweise A+ aus dem Bühnen-Spike. Nichts committet, nichts gepusht.

**Die Stimme ist ein Platzhalter.** Piper „thorsten-high“ liefert nur das Timing. Die echte Stimme kommt aus dem Casting (Entscheidung am 1.11.), getauscht wird mit einer Zeile: `python build/voice.py --anbieter <sieger>`.

## Messwerte

| Wert | Ergebnis | Ziel |
|---|---|---|
| Dauer | 68,6 s (153 Wörter, 12 Szenen) | ≤ 90 s |
| `hyperframes check` | **0 Fehler**, 8 Warnungen (unten begründet) | 0 Fehler |
| `check --caption-zone` (DESIGN.md §2) | bestanden, 0 Fehler | 0 Fehler |
| Hör-Check (`fabrik.py hoercheck`, Whisper `small`) | **WER 2,0 %**, −16,1 LUFS, Spitze −1,3 dBTP, 2 lange Stillen (beide deklariert), 2,43 Wörter/s, 44,1 kHz, 119 kbps, `ok: true` | G4 |
| Bildanteil (`build/messen-bild.mjs`, alle 0,25 s im Player) | **58,9 %** der Zeit Held im Bild und Text ≤ 20 % des Lesefensters (vor Runde 3: 62,2 %; „Tore“ steht jetzt länger) | ≥ 50 % |
| Renderzeit (`--workers 3`, 4 Kerne, Software-GPU) | **103 s** gesamt, davon 93,9 s Bilder (2058 Bilder); 9,1 MB | – |
| Cue: Bild zum Wort | Jedes Bild setzt **2 Bilder (67 ms) vor** dem Wortanfang ein (Wortzeiten aus Pipers eigenem Laut-Alignment) | ±150 ms |
| Cue: Gegenprobe Energie | Nach 26 Pausen beginnt der Ton **max. 99 ms, Median 6 ms** neben der Wortzeit | – |
| Cue: Gegenprobe Whisper | 35 von 37 Cues gehört. Roh: **max. 374 ms**, Median 79 ms. Whisper setzt Wortanfänge systematisch 79 ms zu früh; bereinigt liegen 33 von 35 unter 150 ms | ≤ 150 ms |

**Zur Cue-Abweichung.** Die Wortzeiten kommen nicht aus einer Schätzung, sondern aus der Stimme selbst: Piper gibt mit dem Paket `onnx` an, wie viele Samples jeder Laut bekommt. Daraus sind sie exakt. Zwei unabhängige Prüfungen:
- **Energie** (ohne Whisper): Nach jeder Pause ist der Wortanfang der erste laute Moment. Abweichung höchstens 99 ms.
- **Whisper** liegt bei 5 Cues über 150 ms. Zwei davon sind nachweislich Fehler von Whisper, denn es legt den Wortanfang in die Stille: „Barcelona“ bei 0,0 s (vor dem Vorlauf) und „Naheliegend“ in die Denkpause. Bereinigt um den festen Versatz bleibt „Ablöse“ (−215 ms) an einer Wortfuge ohne Pause. Laut Alignment beginnt das „A“ erst nach „Millionen“.
- **Folgerung:** Gemessen mit Whisper allein ist das Ziel „≤ 150 ms“ nicht erreicht (max. 374 ms). Mit dem Alignment der Stimme und der Energie-Probe ist es erreicht. Whisper misst Wortgrenzen nur auf ±100–200 ms genau (`docs/research/referenz-destillation.md` §2). Darum taugt es als Grob-Tor, nicht als Maßstab für 150 ms.

**Hör-Check im Detail.** Whisper hörte zweimal „Obortunitätskosten“ statt „Opportunitätskosten“ und einmal „keine“ statt „keiner“. Das ist eine Schwäche von Piper. Für die Casting-Stimme gehört eine nötige Umschreibung ins Lexikon der Stimme, nicht ins Skript.

## Was gebaut ist

- **Wurzel** (`index.html`): zwei Bühnen, 12 HUD-Szenen, die Tonspur. GSAP lokal (`assets/gsap.min.js`), Schriften lokal (`assets/fonts/`). Beide werden beim Bau per SHA-256 geprüft. Zur Laufzeit lädt nichts aus dem Netz.
- **Bühne „atlas“** (Beats 1–8): Europakarte (Natural Earth 1:50m, Lambert), Deutschland leuchtet. Kamera mit drei benannten Einstellungen (`totale`, `nah:muenchen`, `nah:barcelona`). Waage an München, drei Darsteller (Spielfigur, Gehalt-Beleg, Münzstapel), Etiketten an den Schalen, ein Marker-Kreis, der am Stapel klebt.
- **Bühne „diagramm“** (Beats 9–12): Rasterpapier, dieselbe Waage als Strichzeichnung mit gleichen Maßen und gleichem Fußpunkt. Der harte Schnitt auf „Waage“ ist darum ein Passschnitt. Zwei Fächer, Kinokarte, Lohntüte.
- **HUD je Szene:** nur fester Text, also Schlagzeilen, Zahlen, Schlüsselwörter und Credits. Läuft ein Text über eine Szenengrenze, hat die nächste Szene eine Kopie ohne Eintritt.
- **Zeiten:** `build/voice.py` schreibt `assets/timing.json`, `build/bauen.mjs` leitet daraus alle Zeiten ab und schreibt jedes `data-start` aus `data-cue`. Keine Zeit steht von Hand im HTML. Der Bau bricht ab, wenn eine Haltezeit unter 1,2 s fällt, die Frage nach 8 s endet oder ein Text über das Lesefenster hinausragt (gemessen im Browser mit geladener Schrift).
- **Stimm-Schritt:** `build/voice.py --anbieter piper|elevenlabs|…`. Jeder Anbieter hat dieselbe Schnittstelle `synthese(text, stimme, vorher, nachher)`; für Piper steht der Adapter in `voice.py`, für die anderen in `factory/werk/stimme/`.
  - Pausen kommen nur aus dem Skript (`pause_s` 2,5 s, `hold_s` 2,0 s). Satz- und Absatzpausen sind Eigenschaften der Stimme (`build/stimme-piper.json`).
  - Prüfungen nach jedem Lauf: Whisper-Abgleich der Cues und die Energie-Probe nach Pausen (`--nur-pruefen` misst neu, ohne neu zu vertonen).
  - Mastering: Hochpass 80 Hz, De-Esser, Kompression 2:1, −16 LUFS.
- **Bibliotheken** (aus dem Spike kopiert, keine Abhängigkeit auf `studio/spike-buehne/`):
  - `lib/buehne.js`: neu für mehrere Darsteller, mit Abschnitten (fällt, Schritt, Flug), Plätzen auf Schalen, Größe je Abschnitt, Ankern an Darstellern und einer Kamerafahrt mit Bogen.
  - `lib/marker.js`: dazu Durchstrich und Klammer.

## Runden

**Runde 1** (Beat-, Naht- und Handy-Blätter), Befunde und Änderungen:
- t 4,6 · Schlagzeile · Unterstreichung unter „kostet“ lag mitten im Wort und las sich als Durchstrich → feste Lage unter der Grundlinie.
- t 5,2 · Figur · Kreis um die Figur schnitt „Behalten?“ → München tiefer (Totale 790/700), Kreis enger.
- t 23,8 · Barcelona · linke Waagschale ragte oben rechts ins Bild → Barcelona höher (420/820), München liegt dann über dem Bildrand; „45 Mio. €“ unter den Stapel.
- t 24,4 · Barcelona · Name berührte den Stapel → Stapel steht 50 px rechts vom Punkt.
- t 32,97 · Naht widerlegung/entgangen · Durchstrich fehlte ein Bild lang → statisch gezeichnet.
- t 37,9 · Begriff · Gold-Kreis neben hellem Beleg (Regel „einziges helles Zeichen“) → Beleg tritt auf 40 % zurück, solange der Kreis steht.
- t 54,4 · Kinokarte · „heute Abend“ stieß an die Kerbe → Karte breiter.
- t 60,3 · Gold-Fach · Lohntüte und Kreis lagen auf „aufgegeben“ → Fächer höher, Tüte kleiner; ihr Aufdruck tritt ab (er wäre im Fach 22 px, unter der Lesegrenze).
- t 3,8 · `check` · Fehler `content_overlap` (Name „Lewandowski“ auf der Schlagzeile) → Name tiefer.

**Runde 2:** Schlüsselbilder, Kamerafahrten (Zoom, Schwenk nach Barcelona, Flug mit folgender Kamera) und das gerenderte MP4 an 11 Stellen. Ich habe keinen neuen P0 gefunden.

**Runde 3** (nach dem Update von `DESIGN.md` heute Abend: höchstens 1 Kreis je Video, Text steht ≥ 1,7 s):
- Von vier Kreisen bleibt einer, der goldene um den Stapel beim Begriff.
  - Statt des Kreises um die Figur tritt auf „behalten“ der Weg nach Barcelona zurück (Abdunkeln auf 35 %).
  - Statt des Kreises um „30.06.2023“ gibt es eine Unterstreichung.
  - Der Kreis um die Lohntüte entfällt.
- Beim Begriff treten Beleg und Figur auf 35 % zurück (Abdunkeln), bis Bayern das Geld nimmt.
- Zu kurze Texte stehen jetzt länger:
  - „Tore“: 1,2 → 7,8 s;
  - „aufgegeben“: 1,2 → 2,3 s, tritt jetzt auf „Geld“ ab, wenn Bayern es nimmt;
  - „geschenkt ≠ gratis“: 1,4 → 2,6 s, steht bis kurz vor „Aufgeben = Kosten“.
  - Der Bau prüft diese Standzeiten jetzt.
- Klammer 6 px.

## Entscheidungen und Abweichungen vom Drehbuch

1. **Kein `halbnah:route`.** Die Waage ist 860 px breit und das Lesefenster 864 px. Mit beiden Städten und der Route passt sie nicht ins Bild. Ich habe den Rückfall aus dem Drehbuch genommen: Die Kamera schwenkt für das Angebot nach Barcelona und folgt dem Geld zurück nach München, in Flussrichtung. Dauer 0,7 s hin und 1,3 s zurück; der Rückweg ist an den Flug gebunden.
2. **Kamerafahrten 0,6/0,7 s statt 1,4 s.** `DESIGN.md` hat seit heute Abend gemessene Werte (0,4–0,7 s).
3. **Der Spieler fliegt aus dem Bild.** Er hebt auf „Opportunitätskosten“ ab und fliegt Richtung Barcelona; die Landung liegt außerhalb des Bildes. Die Kamera bleibt auf der Waage, denn die leere Schale mit „Opportunitätskosten / 1 Saison“ trägt die Auflösung. Das Drehbuch wollte die Landung in Barcelona zeigen.
4. **Spielfigur statt Foto.** Für Lewandowski steht eine gezeichnete Spielfigur (Creme, beleuchtet, 300 px) mit dem Namen daneben. Kein Foto (Lizenz ungeklärt), kein KI-Bild. Das ist eine offene Frage an dich (unten).
5. **Die Figur steigt auf die Schale, wenn die Waage erscheint,** nicht erst auf „Tore“, denn Figur und Waage stehen beide auf München. Auf „Tore“ kippt die Waage nach rechts.
6. **„bezahlt“ ist ein Stempel auf dem Gehalt-Beleg.** Unter dem Stapel steht eine Zeile, die sich verwandelt: „45 Mio. €“ → „entgangen“ → „aufgegeben“. Zwei Etiketten nebeneinander passten unter die Schale nicht.
7. **„Opportunitätskosten“ steht als Schlagzeile (D2) oben,** verbunden mit dem Stapel über den Gold-Kreis. Es steht also nicht am Stapel und wandert auch nicht von dort zur Schale. Auf „Juli“ tritt die Schlagzeile ab. Nach dem Abflug erscheint das Etikett an der leeren Nutzen-Schale.
8. **Die Dateline steht nur in Beat 1–2 („Sommer 2022“) und Beat 8 („Juli 2022“).** Sonst führe die Kamera unter stehendem Text. Aus demselben Grund tritt „Nur sein Gehalt“ vor dem Schwenk ab und kommt zurück, wenn es gesprochen wird („Nur sein Gehalt?“).
9. **„45 Mio. €“ erscheint mit dem Aufprall** des Stapels (+0,41 s nach dem Wort statt +0,12 s), denn der fallende Stapel liefe sonst durch die Zahl. Gemessene Vorbilder liegen bei Labels im Median +60 bis +180 ms; das hier ist später, aber am Bild verankert.
10. **Die Fächer liegen übereinander, nicht nebeneinander:** „aufgegeben“ (278 px) und „bezahlt“ passen nicht nebeneinander auf eine Schale. „geschenkt ≠ gratis“ steht als HUD-Zeile (466 px passen in kein Fach). Die Klammer „Rechnung“ greift links um das Fach „bezahlt“. Das Wort steht unter der Schale am Ende der Klammer, nicht am Scheitel wie in `DESIGN.md` §6, denn links davon ist kein Platz.
11. **Kein Etikett „Satz fürs Gespräch / für die Stunde“** im MP4: offene Frage, ob der Player es je Profil setzt.
12. **Länder:** kein Schriftzug „DEUTSCHLAND“, er läge unter der Figur; Deutschland ist durch das Leuchten markiert. FRANKREICH und ITALIEN ja.
13. **Karte 50m bei Zoom 2,4** statt 10m bei ≈ 3 (`DESIGN.md` §7: 10m erst ab Zoom 2,5).

## Warnungen, die bleiben

- `composition_file_too_large` (3×): `atlas.html` (1051 Zeilen) und `diagramm.html` (902) enthalten die eingesetzten Bibliotheken und die Karte, `vertrag.html` (314) den Marker. Wie im Spike: Der Bau setzt Blöcke ein, von Hand bearbeitet wird nur der Teil außerhalb der Marken.
- `timeline_track_too_dense` (2×): Beat-Marken in der Bühne und die 7 Elemente des Vertragsbands.
- `line_unread` (3×): Credit „Ablöse“, Credit „Gabler“ und die Gleichung stehen in ihrer Szene kurz, laufen aber als Kopie in der nächsten weiter. `check` sieht jede Datei einzeln. Tatsächlich stehen sie 11,9 s, 5,4 s und 17,7 s.

## Schwächste Stelle

**Die Denkpause (6,1–8,6 s) ist das textlastigste Bild:** Schlagzeile, Dateline, drei Preisschilder, zwei Namen und zwei Credits. Nach der 20-%-Regel ist sie kein „Bild“; knapp ein Drittel der 24,8 s mit zu viel Text liegt hier (1,3–8,8 s). Die Schilder sind die Antworten und müssen stehen. Mit mehr Zeit würde ich die Dateline in die Credit-Zeile legen („Lage: t-online/dpa, 14.05.2022“ trägt das Datum schon) und den Namen „Lewandowski“ in die Schlagzeile ziehen.

Danach kommen diese Stellen:
- **Klammer „Rechnung“:** Das Wort steht direkt unter „Kosten“ und liest sich kurz als „Kosten / Rechnung“.
- **Diagramm-Teil:** Er ist dünn gezeichnet (6-px-Striche auf 6-%-Raster). Im Handy-Blatt ist das Raster kaum zu sehen; nach `DESIGN.md` gilt: „Was dort verschwindet, gibt es nicht“.
- **Kein Relief:** Die Karte ist eine flache Fläche, wie im Spike.

## Gemessen, nur angesehen, ungeprüft

- **Gemessen:**
  - `check` (auch mit Untertitel-Zone), Lesefenster aller HUD-Texte im Bau, Haltezeiten im Bau;
  - Hör-Check, Lautheit, Bildanteil, Renderzeit;
  - Cue-Abweichung (Alignment, Energie, Whisper).
- **Angesehen:** Beat-, Naht- und Handy-Blätter, Kamerafahrten (je 6–8 Bilder), 11 Bilder aus dem MP4. Belege in `belege/` (je 3 Bilder aus dem MP4, 360 px breit).
- **Ungeprüft:**
  - Ton gehört hat niemand: Whisper prüft Verständlichkeit, nicht Klang.
  - Seek-Test im Player (wie im Spike) nicht wiederholt.
  - iPhone/Safari.
  - `snapshot --against` gegen Vorbild-Clips: Die Clips sind gelöscht, nur die Zahlen der Destillation gibt es.
  - Bewertung durch die Brüder.

## Wiederholen

```bash
. /opt/deeptok/env.sh
cd studio/gold-opportunitaetskosten
# Stimme (nur bei neuem Skript oder neuer Stimme). Ohne das Paket onnx fällt voice.py auf
# geschätzte Wortzeiten zurück; heute lag onnx nur im Scratchpad (Wunsch unten).
/home/user/Deeptok/.venv/bin/python build/voice.py --anbieter piper
python build/script.py --cues                     # Selbstprüfung des Skripts
node build/bauen.mjs                              # Karte, Schriften, GSAP, Zeiten, Messen
npx hyperframes check && npx hyperframes snapshot --review
npx hyperframes render --workers 3 -o renders/gold.mp4
python ../../factory/fabrik.py hoercheck --audio assets/voice.m4a --text <sprechtext.txt> --erlaubte-stillen 2 --json
npx hyperframes play . --port 3115 --no-open &   # Player im Hintergrund, dann:
node build/messen-bild.mjs 3115                    # Bildanteil
```

Piper rechnet mit Zufallsrauschen: Ein neuer Lauf von `voice.py` gibt leicht andere Wortzeiten. Der Bau übernimmt sie selbst, weil jede Zeit aus `data-cue` kommt.

## Offene Fragen an Linus

1. **Spielfigur oder Foto?** Statt eines Fotos steht eine Spielfigur mit Namen da. Passt dir das, oder soll ich ein Wikimedia-Foto mit geprüfter Lizenz als Duoton einsetzen?
2. **Schilder-Bild zu voll?** In der Denkpause stehen Schlagzeile, Schilder und Namen zugleich. Darf die Dateline dort weg?
3. **Etikett am Satz:** zwei MP4 oder setzt der Player es je Profil?

## Wünsche an andere Dateien (nicht geändert)

1. **`tools/setup-umgebung.sh`:**
   - `onnx` (bzw. `piper-tts[alignment]`) in die Werkstatt-venv aufnehmen. Ohne das Paket gibt es nur geschätzte Wortzeiten.
   - Danach `SETUP_VERSION` hochzählen.
2. **`factory/werk/hoercheck.py`:**
   - `--text` sollte auch Text direkt annehmen, nicht nur einen Dateipfad.
   - Für Cue-Prüfungen die Energie-Probe aus `build/voice.py` (`pruefe_einsaetze`) übernehmen. Whisper bleibt das Grob-Tor.
3. **`studio/DESIGN.md`:**
   - §6: Durchstrich und Klammer sind gebaut (`lib/marker.js`).
   - §6: Abdunkeln als Werkzeug für „Ruhe im Umfeld“ ausdrücklich nennen. Hier wurde es zweimal genutzt: Weg auf „behalten“, Beleg und Figur beim Begriff.
   - §7 Atlas: Darsteller dürfen auf Gegenständen der Welt stehen (Schalen als Plätze).
   - §9: Beim Hook gilt das Schild-Bild als Ausnahme der 20-%-Regel.
   - Abstand Unterstreichung: Grundlinie + 8 px bei 124 px gemessen (offener Wert in §9).
4. **`docs/VIDEO-PIPELINE.md` §6, G6:** `build/messen-bild.mjs` ist ein Kandidat für die Bildanteil-Messung (DOM im Player).
5. **Bogen-Prüfung G0:** eingeschobene Beats Begriff, Auflösung und Satz zulassen (wie im Drehbuch-Bericht).
