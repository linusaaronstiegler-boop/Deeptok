# Review: Goldstandard „Was kostet es, Lewandowski zu behalten?“ (Runde 2, 27./28.10.2026 nachts)

**Nachtrag 28.10.2026 (Blindbewertung der Looks):** Das Protokoll unten bleibt, wie es war, bis auf einen Hinweis bei der Kurstafel. Seit der Blindbewertung am selben Abend gibt es fünf Looks: Die Kurstafel ist verworfen (`studio/looks/verworfen/`), die Märkte-Karte läuft im Look Atlas Nacht (`voices/rotation.json`), und im Zeitungspapier gilt der Rotstift (`studio/looks/README.md`, „Bewertung 28.10.2026“).

Phase 1 nach `docs/VIDEO-PIPELINE.md` §9. Gebaut nach `drehbuch.md`, `fakten.json`, `build/script.py` und `../DESIGN.md`, Bauweise A+ aus dem Bühnen-Spike. Diese Fassung arbeitet die drei Prüfungen der Runde 2 ein (Bild, Didaktik, Technik). Ein Teil davon lag schon im Commit 739829c der Parent-Sitzung (Zwischenstand vor dem Container-Neustart); der Rest liegt uncommittet darüber. Nichts committet, nichts gepusht.

**Stand Runde 2:** Die Stimme war ein Platzhalter (Piper „thorsten-high“). **Stand Fassung v2 (unten):** Jonas aus dem Casting spricht drei der sechs Blöcke, Piper die anderen drei. **Stand Fassung v2.1 (gleich unten):** echter Foto-Moment im Hook, vollständige Credits mit Jahr und Link, Camp Nou entfernt; die Stimme ist weiter gemischt und darum nicht bewertbar. **Abnahme v2 (direkt darunter):** Der Look-Katalog ist reif für die Bewertung durch beide Brüder, das Gold-Video wegen der Stimme noch nicht.

## Abnahme v2 (28.10.2026, spät abends)

**Nachtrag (Code-Spur):** „Lohn“ steht jetzt in `PFLICHTWOERTER`. Das Tor in `build/voice.py` meldet es auf der jetzigen gemischten Spur zu Recht als fehlend („diesen Lung“). `node build/bauen.mjs` liest das Tor nicht und baut unverändert (in einer Kopie geprüft, `timing.json` nicht neu geschrieben).

Unabhängige Prüfung beider Spuren: Gold-Video Fassung v2.1 und Look-Katalog (`studio/looks/`). Alles in der Tabelle habe ich selbst gemessen oder angesehen, nicht aus den Berichten übernommen. Nichts committet, nichts gepusht.

**Urteil:**
- **Look-Katalog: reif für die Bewertung durch beide Brüder.** Es sind sechs Proben à 12 s ohne Ton. `check` meldet 0 Fehler, die Tests sind grün, und jedes Fremdfoto hat eine Zeile im Bild und einen Eintrag in `credits.json`.
- **Gold v2.1: nicht reif.** Bild und Rechte sind fertig, der Ton nicht. Zwei Stimmen wechseln sich dreimal ab, und Piper verschluckt das Schlüsselwort des Transfers. Das Video meldet das selbst: `timing.json` → `bewertbar.ok: false`, dazu der Kopf des Kontaktbogens.
- **Für v2 als Ganzes heißt das: nein.** Die Looks können die Brüder jetzt sehen. Das Gold-Video erst, wenn eine einzige Stimme alle sechs Blöcke spricht. Bis dahin nur ohne Ton und nur für Punkt 3 unten, nicht als Gesamturteil.

### Selbst gemessen

| Prüfung | Ergebnis |
|---|---|
| `renders/gold.mp4` | 74,40 s, 1080 × 1920, 30 fps, H.264, AAC 48 kHz Stereo, 13,5 MB. Neuer als jede Quelldatei (`index.html`, `compositions/`, `lib/`, `assets/`, Bau-Skripte) |
| `npx hyperframes check` (Gold) | **0 Fehler**, 7 Warnungen, dieselben wie im Bericht v2.1: 2× `composition_file_too_large`, `timeline_track_too_dense`, `rotation_pivot_drift`, `contrast_aa_failure` (Stempel „bezahlt“ 2,6 : 1), 2× `line_unread` (Foto-Zeile in „angebot“, „Nur sein Gehalt + Barças Geld“). Mit `--caption-zone` (DESIGN.md §2) ebenfalls bestanden |
| Hör-Check auf dem MP4 (G4, wiederholt) | **`ok: true`**, WER 3,92 %, −16,1 LUFS, −3,8 dBTP, 2,26 Wörter/s, 2 deklarierte Stillen (ab 6,93 s 2,46 s; ab 71,58 s 2,83 s). Abweichungen: „schießt der Tore“, „Verlängen“, „Das Das“, „eines ist Song Lewandowski“, „diesen Lung“ |
| Sätze einzeln ausgeschnitten (Whisper small) | „… Opportunitätskosten, eine Saison Lewandowski.“ richtig („Saison“ p 0,99), wie berichtet. **„Also kostet dich das Kino diesen Lung.“ ist auch einzeln falsch** (p 0,74). „Nur sein Gehalt.“ ohne Fragezeichen. „Opportunitätskosten“ (Jonas) p 0,93 |
| Bilder aus dem MP4 gegen den Kontaktbogen | 12 eigene Bilder (0; 1,4; 2,3; 2,7; 3,2; 20; 31,5; 49; 54,6; 72,0; 73,5; 74,3 s) passen zu `belege/kontaktbogen.jpg`. Bild 0 zeigt den Farbabzug mit Ball, Rasen und weichgezeichnetem Publikum, darunter drei lesbare Credit-Zeilen. Der Abspann in den letzten 2,8 s nennt Foto, Kurzlink und Video-Lizenz |
| `credits.json` (Gold) | Ein Foto (Prößdorf, CC BY-SA 4.0, curid 117528166) in 4 Dateien, alle vorhanden. Die Zeilen im Bild stehen wörtlich so in der Datei. Dazu `lizenz_video` CC BY-SA 4.0, Persönlichkeitsrecht und DFL-Auflage mit Abwägung, `sichtbar` 0–24,9 s und 31,1–54,5 s |
| Looks: `werkzeug/check-alle.sh` (Untertitel-Zone als Fehler) | **alle sechs 0 Fehler.** Warnungen gibt es nur im Zeitungspapier: 5× die Konsolenmeldung „GPU stall“ der WebGL-Rasterbehandlung |
| Looks: Render gegen aktuellen Stand | Bei fünf Proben wurden HTML und Fotos um 21:43/21:44 neu geschrieben, also nach dem Render. Snapshot des aktuellen Stands gegen das MP4 (`--against`, 0,6/3,2/11 s): mittlere Abweichung 1,3–3,1 von 255, höchstens 0,27 % der Pixel über 40. Das ist Kompression; die Renders zeigen den aktuellen Stand |
| Looks: Vergleichstafel und eigene Bilder | `studio/looks/belege/vergleich.jpg` und 48 eigene Bilder (6 Looks × 8 Zeitpunkte) angesehen. Beat 2 hat in jedem Look einen eigenen Übergang und Takt |
| Looks: `credits.json` je Probe | Jede Fremddatei in `assets/` hat einen Eintrag mit Urheber, Lizenz, Kurzlink, Fotojahr, Abrufdatum und den Lizenz-Vorlagen der Dateiseite. Ohne Eintrag sind nur eigene Grafiken (`pappe.jpg`, `stempel-maske.png`) und die Natural-Earth-Regionen (`karte-spanien.svg`, `karte-deutschland.svg`; gemeinfrei, unter `karte.svg` vermerkt) |
| Tests | `factory/tests -m "not langsam"`: 349 bestanden, 3 übersprungen (in `/opt/deeptok/venv` fehlt Pillow). `-m langsam`: 2 bestanden. `test_bilder.py` mit Repo-`.venv`: 58 bestanden |
| `git status` | **Keine Renders im Repo**: Alle MP4 liegen unter `renders/` bzw. `build/cache/` und sind gitignored. **Keine Datei über 1 MB**; die größte ist `assets/voice.m4a` (976 KB, Tonspur). 120 neue Dateien, zusammen 3,6 MB |
| Fremde Clips | **keine.** Im Repo liegt keine Video-Datei, auch nicht gitignored unter `studio/looks/`. Der Commons-Clip für das Zeitungspapier ist nie geladen worden (429). Fremdmaterial sind nur frei lizenzierte Fotos mit `credits.json` |

### Befunde

1. **Ton (P0, bekannt):** Die Stimme ist gemischt. Neu gemessen: „Lohn“ hört Whisper auch im einzeln ausgeschnittenen Satz als „Lung“. Es ist das Schlüsselwort des Transfers, fehlt aber in `PFLICHTWOERTER` (`build/script.py`). Das Tor „6 von 6“ sieht es darum nicht. → „Lohn“ dort aufnehmen. Mit Jonas erledigt es sich vermutlich.
2. **Das Gold-Video ist weiter ganz Navy-Gold.** Nur der Farbabzug in den ersten 2,9 s bricht das. Das ist folgerichtig, denn das Gold-Video ist der Look Atlas Nacht. Linus' Wunsch „nicht alles so goldmäßig“ beantwortet aber nur der Look-Katalog. Darum beides zusammen zeigen, sonst wirkt v2 wie „wieder Gold“.
3. **DFL-Auflage fehlt in den Look-Proben.** Zeitungspapier und Archiv nutzen dasselbe Prößdorf-Foto. Ihre `credits.json` führen „Non-copyright restriction“ nur unter `lizenz_vorlagen`, ohne die Abwägung, die im Gold steht. Für unveröffentlichte Proben ist das harmlos. `bilder.py` sollte die Vorlage aber als Hinweis ausgeben (Wunsch 3 aus v2.1).
4. **Proben ohne Video-Lizenz.** Zeitungspapier, Archiv und Flach enthalten Bearbeitungen von CC-BY-SA-Fotos, haben aber kein `lizenz_video` und keinen Abspann. Für interne Proben genügt das. Vor einer Veröffentlichung wie im Gold nachziehen.
5. **Zeitungspapier ist unvollständig.** Der echte Clip fehlt, auf Seite 1 steht ein Ersatzfoto, und der Rotstift braucht Linus' Ja.
6. **Labor:** Ein Stapel Cent-Münzen für „45 Mio. €“ ist ein schwaches Sinnbild; er ist ehrlich beschriftet, aber kein Beleg. Das leere Fadenkreuz für „0 €“ trägt dagegen.

### Was die Brüder prüfen sollen

Am Handy und ohne Ton. Der Bruder urteilt zuerst und blind: Er sieht die Looks ohne Namen und `belege/alt-neu.jpg` erst nach seinem Urteil.
1. **Looks, 6 × 12 s:** Welche zwei wollt ihr im Feed sehen, welcher fliegt raus? Dazu je Look eine Note von 1 bis 5: Ist nach dem ersten Ansehen klar, dass Verkaufen 45 Mio. € bringt und Behalten 0 € Ablöse?
2. **Echte Fotos:**
   - Szenen: Gold 0–3 s (Farbabzug wird Figur), Flach 0–2 s (Stadionfoto wird Zeichnung), Archiv (Abzüge auf der Akte), Zeitung (ausgeschnittene Figur).
   - Frage: Wirkt das Foto wie eine echte Situation und hilft beim Verstehen, oder ist es Deko?
   - Frage: Stört der Wechsel von Foto zu Figur?
   - Frage: Sind die Credit-Zeilen am Handy lesbar?
3. **Gold 44–53 s ohne Ton (Begriff und Auflösung):** Verstehst du beim ersten Ansehen, warum nach „Im Juli nimmt Bayern das Geld“ der Umriss des Spielers auf „Kosten“ steht? Kein Gesamturteil über das Video, das kommt erst mit einer Stimme.

### Stärkste Looks

1. **Zeitungspapier.**
   - Er ist am weitesten vom Navy-Gold entfernt. Die echten Fotos sind hier selbst der Held: Rasterdruck und eine ausgeschnittene Figur. Die Credits laufen wie in der Zeitung senkrecht an der Bildkante.
   - Er passt zu „Aktuelles“ und zur Simplicissimus-Richtung.
   - Vorbehalte: das Ja zum Rotstift und der fehlende Clip.
2. **Archiv-Duoton.**
   - Die echten Fotos liegen als Abzüge mit Büroklammer auf der Akte, die Herkunft steht auf dem Rand. Dazu kommen getippte Karteikarten und ein violetter Stempel. Das ist die natürlichste Antwort auf „echte Bilder“, denn die Quelle ist Teil des Bildes statt Fußnote.
   - Er passt zu Geschichte und Allgemeinbildung.
   - Vorbehalte: Er ist ruhig und schwer, hat die größte MP4 (1,6 MB für 12 s), und in echten Videos gilt die Datumsregel.

Die übrigen:
- **Flach** liegt knapp dahinter: hell, freundlich und gut für den Bruder. Das Foto steht aber nur 1,8 s.
- **Kurstafel** taugt für die Märkte-Karte, nicht als allgemeiner Look, denn ihr Held ist Text. (Nachtrag: in der Blindbewertung verworfen, siehe oben.)
- **Labor** trägt nur mit einem echten Gegenstand.

### Offen (Entscheidungen für Linus)

1. **Stimme für das Gold-Video:** Jonas für Block 2, 5 und 6 (723 Credits) oder eine andere Stimme aus dem Pool für das ganze Video (Wunsch „Stimmen variieren“). Je Video immer nur eine Stimme.
2. **Rotstift-Ausnahme im Zeitungspapier:** ja oder nein.
3. **ElevenLabs und der Bruder:** `voices/rotation.json` → `regeln.bruder` sperrt ElevenLabs-Stimmen für sein Profil. Gilt das auch fürs Bewerten? Im Casting hat er die Stimmen schon gehört. Die Looks sind ohne Ton und davon nicht berührt.
4. **Clip für das Zeitungspapier** nachladen, sobald Commons antwortet (`fotos.py zeitungspapier`), danach Render und Vergleichstafel neu.
5. „Lohn“ in die Pflichtwörter aufnehmen. iPhone/Safari ist ungeprüft.

## Fassung v2.1 (28.10.2026, spät): Überarbeitung nach drei Kritiken

Drei Prüfungen (Look, Didaktik und Stimme, Technik und Rechte) haben die Fassung v2 bewertet; Bewertungen 3,5 / 3 / 3,5. Ich habe jeden Befund selbst nachgeprüft: am Render, im Player, an der Hüllkurve und mit einzeln ausgeschnittenen Sätzen. Was bestätigt war, ist unten behoben oder als Entscheidung begründet. Nichts committet, nichts gepusht.

**Kurzurteil:**
- **Bild:** Das echte Foto hat jetzt einen eigenen Auftritt. Bild 0 zeigt die Spielszene in Farbe als Abzug auf der Karte, mit Ball, Rasen und Publikum. Auf „Bayern“ wird daraus der Darsteller („Foto wird Darsteller“). Camp Nou ist entfernt.
- **Rechte:** Jede Foto-Zeile im Bild nennt Urheber, Jahr, Lizenz und „bearb.“; wo Platz ist, steht der Kurzlink darunter. Im Schlussbild steht ein Abspann mit der Lizenz des Videos. Ein neues Tor prüft im Player Bild für Bild, dass zum sichtbaren Foto immer seine Zeile gehört: 0 Lücken.
- **Ton:** weiter **nicht bewertbar**, weil zwei Stimmen sprechen. Das Kontingent ist leer, und beide eingebundenen ElevenLabs-Connectors sind dasselbe Konto (geprüft, nur gelesen). Neue Aufrufe: keine, also 0 Credits. `voice.py` markiert die Spur jetzt selbst als nicht bewertbar; der Kontaktbogen schreibt es in den Kopf.

### 1. Befunde und was damit geschah

| Befund (Schwere, Kritik) | selbst geprüft | Änderung |
|---|---|---|
| Credit-Zeilen im Bild ohne Jahr und Link (P0, alle drei) | ja: „Foto: Steffen Prößdorf, CC BY-SA 4.0, bearb.“, credits.json nannte eine andere Zeile | Zeile 1 „Foto: Steffen Prößdorf, 2019, CC BY-SA 4.0, bearb.“ (822 px gemessen) in **jeder** Foto-Szene. Zeile 2 `commons.wikimedia.org/?curid=117528166` im Hook, in „naheliegend“, „verkauf“ und im Abspann. Abspann in den letzten 2,8 s: Foto, Kurzlink, „Video: creativecommons.org/licenses/by-sa/4.0“. Bau-Tor: Jede Foto-, Link- und Lizenzzeile im Bild steht wörtlich so in credits.json |
| Stimme wechselt dreimal (P0, Didaktik) | ja (gemessen in der Kritik, Jonas/Piper je Block in timing.json) | nicht behebbar ohne Credits (siehe 2). Tor in `voice.py`: `timing.json` → `"bewertbar": {"ok": false, …}`, Warnung im Bau der Stimme und im Kopf des Kontaktbogens |
| Kein echter Foto-Moment, Freisteller 3,5 % der Fläche, alles Navy-Gold (P1, Look) | ja | Abzug der Spielszene in Farbe (523 × 671 px, 17 % der Fläche, Gesicht ca. 57 px), dann Morph zum Darsteller. Ball bleibt im Freisteller (siehe 3) |
| Camp Nou trägt keinen Inhalt, Schriftzug unlesbar (P1 Look, P2 Didaktik) | ja: am Handy ist nur „FC Barcelona“ lesbar | **entfernt** (Foto, Credit, Bau-Tor, credits.json). Damit sind auch erledigt: Foto über Deutschland während der Fahrt (P1), Nike-Tafel (P2), Münzen durchs Foto (P2) |
| Schlüsselbegriff in der Auflösung undeutlich (P1, Didaktik) | ja: einzeln „Operatunitätskosten“ (p 0,78) | Piper-Schreibung „Oppor-tunitätskosten“ (nur Rückfall-Block; einzeln 3 von 4 Synthesen richtig statt 0 von 2) und Takes (siehe 2). Neues Tor: Pflichtwörter im einzeln ausgeschnittenen Satz. Jetzt 6 von 6 |
| „Nur sein Gehalt?“ steigt nicht (P1, Didaktik) | ja: F0 151 → 117 Hz, Whisper einzeln „.“ | nicht behebbar mit Piper (in 5 Takes stieg keiner). Neues Tor (F0 am Ende > 1,05 × erstes Wort UND „?“ im Einzelausschnitt) läuft bei jedem Bau; mit Jonas wiederholen. Den Satzbau habe ich nicht geändert: Block 2 ist für Jonas gedacht, und sein Text steht in stimme-jonas.json |
| Kernsätze ohne Luft, Definition 3,1 W/s (P1, Didaktik) | ja: Pausen 0,33 und 0,36 s | neues Feld `luft` in script.py, `voice.py` setzt die Stille in die fertige Aufnahme (leiseste 10-ms-Stelle): vor „Ökonomen“ 0,70 s, nach „Opportunitätskosten.“ 0,60 s, dazu vor „Genau dann“ und nach „diesen Lohn“ je 0,70 s. Das Tempo der Definition selbst (3,09 W/s, Jonas) bleibt; Zeitdehnung hätte die Stimme verfälscht |
| DFL-Auflage des Fotografen (P1, Rechte) | eigener Abruf: 429, aus Rücksicht nicht wiederholt; Wortlaut nach der Kritik | in credits.json mit Link, Auszug und Abwägung (siehe 4). Das Foto „läuft“ nicht mehr aus dem Bild |
| Foto kurz ohne Credit (P2, Look und Rechte) | ja | Zeilen an die Sichtbarkeit gebunden (angebot bis Ende der Fahrt, widerlegung ab Beginn der Rückfahrt). Neues Tor in `messen-bild.mjs`: **0 von 744 Proben** mit Foto ohne Zeile. Es schreibt auch, WANN das Foto zu sehen ist, in credits.json (`sichtbar`: 0–24,9 s und 31,1–54,5 s, neun Szenen) |
| Abgedunkeltes Foto durchsichtig (P2, Look) | ja | dunkle, **deckende** Fassung (`lewandowski-dunkel.png`, Navy + 35 % des Duotons); Zurücktreten = die helle Fassung blendet aus |
| Umriss über stehendem Foto, Pappaufsteller (P2, Look) | ja | Unschärfe-Austritt am Ort (0,25 s, 40 px nach Südwesten), Umriss erst ab +0,18 s |
| Ortspunkt München sieht aus wie ein Ball (P2, Look) | ja | Punkt entfernt (DESIGN.md §7: auf München steht immer jemand); der echte Ball liegt jetzt im Freisteller |
| Beleg „Gehalt“ verschwindet ohne Ursache (P2, Didaktik) | ja | Beleg bleibt abgedunkelt auf „Kosten“, auch auf „nimmt“; er geht mit der ersten Hälfte der Drehung (in der Sicht „Verkaufen“ zahlt Bayern kein Gehalt) |
| Lizenz des Videos offen (P2, Look und Rechte) | ja | `credits.json` → `lizenz_video`: CC BY-SA 4.0 mit Begründung; Zeile im Abspann |
| credits.json veraltet (P2, Rechte) | ja | neu aus `foto.py` (Bearbeitungsschritte als Liste, Credit-Zeilen wörtlich, Dritte, Werbung) plus `sichtbar` aus der Messung |
| timing.json: falsche Herkunft der Wortzeiten (P2, Didaktik und Rechte) | ja (Zeile 906) | „DTW gegen Piper-Vorlage + Energie-Anfänge nach Pausen“; Docstring angepasst; `stimme` je Block; `pruefung.whisper_daneben_huellkurve_ok` |
| Free-Plan nur nichtkommerziell, Bruder-Regel (P2, Rechte) | Kontingent 10 000 = Free | in `stimme-jonas.json` vermerkt (`plan`, `bruder_regel`, `zweiter_connector`) |
| AAC knapp an beiden Grenzen (P2, Rechte) | ja: 99,1 kbit/s bei 905 KB | `voice.py` kodiert vier Ziele und nimmt das mit dem größten Abstand zu BEIDEN Grenzen, sonst Abbruch: jetzt 128k → 103,5 kbit/s, 976 KB |
| Werbung: Ärmel-Sponsor (P2, Look) | ja | bleibt (Teil der Kleidung, kein Werbeplatz); Bande „BUNDESLIGA“ ist weichgezeichnet; in credits.json begründet |
| Transfer-Teil ohne Foto (P1, Look, Prüfauftrag) | geprüft | kein Foto: Der Transfer ist die Diagramm-Identität, und zwei Identitäten stehen nie im selben Bild (DESIGN.md §7). Ein Kinosaal wäre dort Deko |

### 2. Stimme: was ging und was nicht

- **Kein neuer ElevenLabs-Aufruf, 0 Credits.** Ein Satz ist nachweislich falsch gesprochen („Operatunitätskosten“ in Block 5), aber das spricht Piper, und das Konto hat noch 26 Credits (Block 5 braucht rund 300). Ein Aufruf wäre sicher gescheitert. Der zweite Connector `ElevenLabs-fb85a6fe` zeigt dieselben Flows, ist also dasselbe Konto.
- **Piper-Takes** (`voice.py --piper-takes 2,5,6 --anzahl 5`): Piper würfelt. Ein Lauf machte aus „nur sein Gehalt“ „Müsern gehalten“. Darum werden je Block 5 Takes gehört und bewertet (Wortfehler + Pflichtwörter einzeln + Frage), der beste kommt in `build/cache/piper/`. Jeder weitere Bau nimmt genau diese Aufnahme. Auch die Piper-Vorlage für die DTW der Jonas-Blöcke ist damit fest.
- **Wortzeiten an der Hüllkurve nachgeprüft:** „Opportunitätskosten“ Stille bis 39,734 s, Einsatz 39,739 s, `timing.json` 39,738 s. „genauso“ Einsatz 36,06 s, `timing.json` 36,062 s. „nur“ +20 ms. Whisper liegt bei beiden ersten 270–280 ms zu früh; das Tor `whisper_daneben_huellkurve_ok` erfasst nur Wörter nach Pausen ≥ 0,25 s, darum steht dort nur „nur“.

### 3. Der Foto-Moment

- **Ablauf:** Bild 0 zeigt Schlagzeile und Abzug. Auf „Lewandowski“ (1,27 s) kommt der Name neben den Abzug. Ab 2,08 s (im Atem vor „Bayern“) blendet der Rahmen samt Rasen und Publikum aus; die Figur in Farbe fährt nach München und schrumpft auf Darstellergröße (0,55 s). Am Ziel liegt der Duoton-Darsteller deckend darunter, die Farbe blendet darüber aus (2,63–2,88 s). Danach kommt die Route auf „verkaufen“ (3,03 s). Drei neue Bau-Tore sichern das: Abzug ≥ 2,0 s, Name ≥ 0,8 s gelesen, Darsteller fertig vor der Route.
- **Ton des Fotos:** Sättigung 70 %, Schatten zum Navy der Karte hin, Hintergrund weichgezeichnet (normierte Unschärfe, also ohne hellen Saum) und auf 75 % abgedunkelt. Das gibt Tiefe, und Zuschauer sind nicht erkennbar. **Abweichung von DESIGN.md §4 („Sättigung 0“), bewusst:** Linus' Wunsch („echte Bilder von Live-Situationen“, „nicht alles so goldmäßig“) und die Look-Kritik. Der Darsteller bleibt Duoton: Im Atlas ist er Teil der Modellwelt, die Farbe geht beim Übergang.
- **Lage:** Der Abzug liegt zwischen Schlagzeile und Credit-Ecke, 0,6° gedreht. Die Schlagzeile steht dafür 30 px höher (184 statt 214; höher geht nicht, der Zeilenrahmen von „kostet“ beginnt 15 px über der Box). Größer als 523 × 671 geht nicht sauber: Mit 598 × 811 (erster Versuch) lagen die Credit-Zeilen über dem Ball.
- **Ball:** Er ist aus der Vorschau freigestellt (Ellipse ohne Rasen). Der Darsteller ist dadurch 275 statt 191 px breit. Die Totale setzt München deshalb 18 px tiefer, und der Name „München“ steht weiter links.
- **Dateien:** `lewandowski-szene.jpg` (Abzug, 73 KB), `lewandowski-farbe.webp` (Figur in Farbe, 60 KB), `lewandowski.png` und `lewandowski-dunkel.png` (Duoton hell/dunkel, 113 und 88 KB). Alle aus einem Foto, alle aus `build/foto.py`.

### 4. DFL-Auflage: Abwägung

Das Foto trägt auf Commons den Hinweis des Fotografen: nur redaktionelle Zwecke, keine „Sequenzbilder und/oder videoähnlichen Fotostrecken“. Mein eigener Abruf am Abend lief zweimal in 429; den Wortlaut habe ich deshalb aus der Kritik übernommen und das in credits.json vermerkt. Entscheidung:
1. Es ist **ein** Foto, keine Serie und keine Fotostrecke, die ein Spiel nachstellt.
2. Die Nutzung ist redaktionell-erklärend: ein nichtkommerzielles Lernvideo über den tatsächlichen Wechsel, mit Quellen. Es ist keine Werbung.
3. Das Foto „spielt“ nicht. Es liegt als Abzug still, wird per Kamerafahrt auf ein Standbild zum Darsteller, steigt auf die Schale und geht mit einem Unschärfe-Austritt. Der Lauf aus dem Bild (v2) ist weg.
4. Wird DeepTok kommerziell, kommt ein Foto ohne DFL-Auflage (Nationalmannschaft, Pressetermin).

### 5. Messwerte Fassung v2.1

| Wert | v2.1 | v2 | Ziel |
|---|---|---|---|
| Dauer | **74,4 s** (Luft 4 × ca. 0,3 s, Halten 2,8 s, andere Piper-Takes) | 71,9 s | ≤ 90 s |
| `hyperframes check` | **0 Fehler**, 7 Warnungen (dieselben wie in v2) | 0 / 7 | 0 Fehler |
| Hör-Check auf dem MP4 (G4) | **`ok: true`**, WER 3,92 %, −16,1 LUFS, −3,8 dBTP, 2,26 W/s, 2 deklarierte Stillen (2,46 s Denkpause, 2,83 s Halten) | WER 1,96 % | G4 |
| Abweichungen im Hör-Check | alle in Piper-Blöcken: „schießt der“, „verlängen“, „eine ist Song“ (Block 5, nur auf der ganzen Spur; einzeln „eine Saison“), „Lung“, 2 Einfügungen | 3, alle Piper | – |
| Pflichtwörter, Satz einzeln | **6 von 6** | „Operatunitätskosten“ in Block 5 | alle |
| „Nur sein Gehalt?“ steigt | **nein** (F0 151 → 117 Hz, „.“), Piper | nein | ja (mit Jonas) |
| Tonspur bewertbar | **nein** (Jonas Block 1, 3, 4; Piper Block 2, 5, 6) | – | ja |
| `voice.m4a` | 128k: 103,5 kbit/s, 976 KB | 99,1 kbit/s, 905 KB | ≥ 96 kbit/s, < 1 MB |
| Bildanteil (`messen-bild.mjs`, 744 Proben) | **58,2 %**, 0 s ohne Held | 56,1 % | ≥ 50 % |
| Foto sichtbar ohne Credit-Zeile | **0 Proben** | ca. 1 s (Kritik) | 0 |
| Cue-Tor im Bau (32 Texte) | max. **83 ms** | 82 ms | ≤ 150 ms |
| Energie-Probe (Wortanfang nach Pausen) | 26 Wörter, max. 53 ms, Median 4 ms | 64 / 3 ms | – |
| Einzelbild-Scan (`flackern.py`, 2232 Bilder) | **0 Ausreißer an 13 Nähten**, 20 Hinweise (Morph, Stempel, Fach, Tüte) | 0 an 13 | 0 |
| Seek-Test | **34 von 34**; neu: Morph (3 Bilder), Austritt, Abdunkeln; Zustand umfasst Abzug und Foto-Hülle | 29 / 29 | alle |
| Render (`--quality looks --workers 3`) | 146 s, 13,5 MB | 128 s, 14,2 MB | – |

**Befunde aus `messen-bild.mjs`, die bleiben** (alle während einer Bewegung, je 1–2 Proben):
- Schlagzeile gegen Abzug bzw. Figur bei 2,3 und 2,4 s: Die Figur fliegt beim Morph an „Behalten?“ vorbei.
- Fallendes Vertragsblatt (16,8 s) und Lohntüte (63,8 s) kurz außerhalb des Lesefensters: wie in v2.
- Münzen unter der Foto-Zeile bei 31,3 s: Die Kamera fährt von Barcelona zurück, der Stapel wandert unter der Zeile durch. Die Zeile muss dort stehen, weil der Spieler schon im Bild ist.

**Warnungen von `check`, die bleiben** (7, wie in v2):
- `composition_file_too_large` 2×; `timeline_track_too_dense` (Atlas);
- `rotation_pivot_drift` (falscher Alarm); `contrast_aa_failure` für den abgedunkelten Stempel „bezahlt“;
- `line_unread` für „Nur sein Gehalt + Barças Geld“;
- `line_unread` für die Foto-Zeile in „angebot“ (1,57 s): Sie setzt dieselbe Zeile an derselben Stelle aus „vertrag“ fort; `check` sieht jede Datei einzeln.
- Neu und behoben: `content_overlap` (Gabler-Zeile über „entgangen“ bei der Nachfahrt). In „begriff“ und „aufloesung“ stehen links unter der Kosten-Schale Etiketten; dort darum nur Zeile 1, ohne Kurzlink. `dead_stretch` im Schluss-Satz (das Bild steht absichtlich, nur die Unterstreichungen zeichnen sich): `data-hold` am Etikett „aufgegeben“.

### 6. Belege

- `belege/kontaktbogen.jpg`: 15 Kacheln, neu „1 Foto (Abzug)“. Der Kopf sagt „NICHT BEWERTBAR (Stimmen gemischt)“.
- `belege/poster.jpg`: weiter die Denkpause (Held, Frage, Antwort-Schilder), `belege/alt-neu.jpg` neu gebaut.
- Morph und Austritt als Bildfolge: im Scratchpad dieser Sitzung (nicht im Repo).

### 7. Offen

1. **Jonas für Block 2, 5 und 6:** 723 Credits (eine Variante je Block). Erst dann ist das Video bewertbar und die Frage „Nur sein Gehalt?“ prüfbar. Der Weg steht in `build/stimme-jonas.json`. Danach: `voice.py --anbieter datei`, bauen, rendern; die neuen Tore (Pflichtwörter, Frage, Bitrate, bewertbar) laufen mit.
2. **Tempo der Definition** (Jonas, 3,09 W/s): Die Luft davor und danach ist da. Langsamer ginge nur mit einer neuen Aufnahme von Block 3 (153 Credits).
3. **DFL-Wortlaut** selbst nachlesen, sobald Commons wieder antwortet (`User:Stepro/DFL`).
4. **Bruder-Regel** für ElevenLabs-Stimmen (voices/rotation.json) klären, bevor der Bruder bewertet.
5. iPhone/Safari ungeprüft (WebP mit Alpha braucht Safari 14+), Kopfhörer ungeprüft, `snapshot --against` weiter nicht gelaufen.

### 8. Wünsche an andere Dateien (nicht geändert)

1. **`studio/DESIGN.md` §4/§6:** Ein Echtfoto-Moment in eigenem Ton (Sättigung ca. 70 %, Schatten Richtung Navy, Hintergrund weich) als erlaubte Ausnahme. Gebackenes Duoton als zweiter Weg. Fotos treten über eine dunkle, deckende Fassung zurück, nicht über Deckkraft.
2. **`studio/DESIGN.md` §2 gegen `studio/looks/README.md`:** Credit-Ecke ≤ 3 Zeilen (DESIGN) oder 2–4 (README)? Dazu die Regel: Etiketten der Welt gehen vor dem Kurzlink; die Zeile mit Urheber, Jahr und Lizenz steht immer.
3. **`factory/werk/bilder.py`:** zusätzlich `prop=templates` abfragen und bei „Non-copyright restriction“ oder `User:*/DFL` einen BildHinweis geben (extmetadata zeigt nur „personality“).
4. **Fabrik (G4/G6):** `luft`, Piper-Takes, Pflichtwörter im Einzelsatz, Anstieg steigender Fragen (`voice.py`) und das Tor „Foto ohne Credit“ (`messen-bild.mjs`) als gemeinsame Werkzeuge.

### Wiederholen (Fassung v2.1)

```bash
. /opt/deeptok/env.sh
cd studio/gold-opportunitaetskosten
/home/user/Deeptok/.venv/bin/python build/foto.py                      # Abzug, Freisteller, Umriss, credits.json
/home/user/Deeptok/.venv/bin/python build/voice.py --piper-takes 2,5,6  # nur wenn sich ein Piper-Block ändert (Takes in build/cache/piper/)
/home/user/Deeptok/.venv/bin/python build/voice.py --anbieter datei     # Jonas-Dateien + Piper-Takes, Luft, Tore
node build/bauen.mjs
npx hyperframes check && npx hyperframes snapshot --review
npx hyperframes render --quality looks --workers 3 -o renders/gold.mp4
/home/user/Deeptok/.venv/bin/python build/flackern.py renders/gold.mp4
npx hyperframes play . --port 3115 --no-open &
node build/messen-bild.mjs 3115 0.1 && node build/seek-test.mjs 3115 renders/gold.mp4   # messen-bild schreibt credits.json "sichtbar"
python ../../factory/fabrik.py hoercheck --audio renders/gold.mp4 --text <sprechtext.txt> --erlaubte-stillen 2 --json
/home/user/Deeptok/.venv/bin/python build/kontaktbogen.py
```

## Fassung v2 (28.10.2026, abends)

Aufträge: Stimme Jonas über den ElevenLabs-Connector, echte Fotos statt Tipp-Kick-Figur, die Fixes aus der Abnahme (Beat 8, Diagramm-Einstellung, Standdauer). Nichts committet, nichts gepusht.

**Kurzurteil:**
- **Bild:** Lewandowski steht als echtes Foto auf der Waage, sein Umriss bleibt als Geist auf „Kosten“, Camp Nou zeigt, wer bietet. Die Einstellungen sind im Median 5,7 s statt 8,1 s lang.
- **Ton:** nur halb gelöst. Das ElevenLabs-Kontingent war nach drei Blöcken leer (10 000 Credits im Monat, Rest 26). Jonas spricht Hook, Begriff und „Im Juli nimmt Bayern das Geld“; Piper spricht Irrtum, Widerlegung, Auflösung, Transfer und Satz.
- **Für Linus' Urteil** taugt das MP4 im Bild. Im Ton wechselt die Stimme dreimal; das ist ein Zwischenstand, keine Fassung zum Bewerten.

### 1. Stimme Jonas (ElevenLabs-Connector)

| | |
|---|---|
| Flow | „DeepTok Gold v2 Stimme“, `9v8PYl192MkLFjhcAMIf`; je Block genau ein Aufruf `creative_generate_speech`, `eleven_v4`, voice_id `xlbJQnFFGB01bv7HK5CZ`, 2 Varianten; kein Aufruf wiederholt |
| Text | Anzeige-Seite der Tokens („Barcelona“, „45“), ohne Sternchen und `?↑`, Fragezeichen behalten; Szenen eines Blocks als Absätze (`build/stimme-jonas.json`, Feld `text`) |
| Fertig | Block 1 (Hook, 2 Varianten), Block 3 (Entgangen + Begriff, 1 Variante), Block 4 (Verkauf, 1 Variante) |
| Fehlgeschlagen | Block 2 (Naheliegend bis Widerlegung), Block 5 (Auflösung bis Transfer), Block 6 (Satz), dazu je die zweite Variante von Block 3 und 4. Meldung: „exceeds your quota of 10000. You have 26 credits remaining“ |
| Credits | **375 abgerechnet** (2 × 96 + 153 + 30). Angefordert waren 2004; für die fehlenden Blöcke braucht es 723 Credits für je eine Variante, 1446 für je zwei |
| Wahl Block 1 | Beide Varianten 0 % Wortfehler. Gewählt `xxs8BkxHwbJNMK8TvPOM`: Kontrast „verkaufen“ (195 Hz) gegen „oder“ (106 Hz), Ton der Frage auf „kostet“ (222 Hz), die W-Frage fällt. Die andere legt den Ton auf „kann“ |
| Hör-Check je Take | Block 1, 3, 4: je 0 % Wortfehler (Whisper small). „Opportunitätskosten“ richtig gehört |

**Wie es gebaut ist** (`build/voice.py --anbieter datei`):
- Der Connector liefert eine mp3 ohne Zeitstempel. Die gewählten Dateien liegen im gitignorten `build/cache/elevenlabs/`; Flow und generation_id in `build/stimme-jonas.json` reichen, um sie neu zu laden.
- **Wortzeiten:** Piper spricht denselben Block mit exakten Laut-Zeiten. DTW über Log-Mel-Merkmale (10 ms) richtet beide Aufnahmen aneinander aus und überträgt Pipers Wortgrenzen auf Jonas. Danach werden Wortanfänge nach echten Pausen (≥ 100 ms) an die Lautstärke-Kante gesetzt.
- **Warum nicht Whisper:** Whisper lag bei „Opportunitätskosten“ 0,24 s zu früh (blockrelativ 4,56 s gegen die Energiekante bei 4,80 s). Im ersten Lauf ordnete eine 60-ms-Lücke (das „d“ in „oder“) den Anfang von „behalten“ falsch zu und verschob Block 4 um 150 ms. Beides steht als Kommentar in `an_energie_ausrichten()`.
- **Gegenprobe an der Hüllkurve** (Gesamtspur): „Opportunitätskosten“ setzt nach Stille bei 39,00 s ein, `timing.json` sagt 39,00; Whisper auf der Gesamtspur sagt 39,60, also mitten im Wort. „genauso“: Stille bis 35,67 s, `timing.json` 35,69; Whisper legt es in „fehlt“. In Block 4 trifft DTW „Bayern“ bei 1,050 s auf die Verschlusslücke bei 1,063 s.
- **Rückfall:** Blöcke ohne Datei spricht Piper mit seinen Aussprache-Schreibungen. Jeder Block wird vor dem Zusammensetzen auf −20 LUFS gebracht, damit mit der Stimme nicht auch die Lautstärke springt.
- **Mastering** wie bisher (−16 LUFS Stereo, SHA-256 in `timing.json`), AAC jetzt 120k: Der ffmpeg-Encoder bleibt bei Sprache unter dem Ziel (96k ergab gemessen 79,6 kbit/s, 120k ergibt 99,1). `voice.m4a` hat **905 KB** (v1 1,16 MB).

**Prüfpunkte aus dem Auftrag:**
- **Hör-Check:** WER 1,96 % auf dem MP4. Die drei Abweichungen stammen alle aus Piper-Blöcken: „Na, liegend“ und „der Tore“.
- **„Opportunitätskosten“:** beide Male richtig erkannt, einmal Jonas, einmal Piper.
- **„Nur sein Gehalt?“** liegt in Block 2, spricht also Piper. Whisper schreibt die Frage jetzt mit „?“ (v1: „.“). „Gehalt“ steigt nur von 106 auf 127 Hz. Die Prüfung mit Jonas steht aus.

### 2. Echte Fotos

| Foto | Quelle | Wo, wozu | Behandlung |
|---|---|---|---|
| Lewandowski im Bundesligaspiel (FC Bayern – VfL Wolfsburg, 09.03.2019, allein am Ball, ganze Figur) | Steffen Prößdorf, Wikimedia Commons, CC BY-SA 4.0, commons.wikimedia.org/?curid=117528166 | statt der Tipp-Kick-Figur in allen Atlas-Beats; sein **Umriss** ist der Geist auf „Kosten“ | freigestellt (`hyperframes remove-background`); Gesicht des Linienrichters unter seiner Hand wegradiert; Duoton Navy → Creme; Licht oben links, Schatten rechts unten; 380 px hoch |
| Camp Nou mit „MÉS QUE UN CLUB“ auf den Rängen | Ivan Mlinaric, Wikimedia Commons, CC BY 2.0, commons.wikimedia.org/?curid=15606497 | Beat 5, „Barcelona bietet …“: zeigt, dass der Verein bietet, nicht die Stadt; Beschriftung „FC Barcelona“ | Ausschnitt 3 : 1, Graustufe mit Rotfilter (nur so bleibt der Schriftzug lesbar), Duoton; 864 × 288 px, an Barcelona verankert |

- **Abruf:** über `factory/werk/bilder.py` (Lizenzprüfung über extmetadata, beschreibender User-Agent, 2 s Abstand). Commons lehnte das 3,9-MB-Original von Lewandowski fünfmal mit 429 ab; nicht umgangen. Genommen ist die Vorschau 960 × 1440; die Figur ist darin rund 1100 px hoch, angezeigt werden 380 px.
- **Reproduzierbar:** `build/foto.py` macht alle Schritte, Zwischenstände im gitignorten `build/cache/fotos/`. Es schreibt `assets/fotos/`, `build/foto-lewandowski.json` (Maße, Umriss als SVG-Pfad mit 134 Punkten, Hand für die Fäden der Preisschilder) und `credits.json`.
- **Credits im Bild:** „Foto: Steffen Prößdorf, CC BY-SA 4.0, bearb.“ in jeder Atlas-Szene, in der er zu sehen ist; „Foto: Ivan Mlinaric, CC BY 2.0, bearb.“ in Beat 5.
  - Bei drei Zeilen hat die Lizenzpflicht Vorrang vor der Höflichkeitszeile „Karte: Natural Earth“ (gemeinfrei). Die Kartenzeile fehlt deshalb in vertrag, entgangen, begriff, verkauf und aufloesung.
  - Jahr, Link und der genaue Bearbeitungsvermerk stehen in `credits.json`. Dort steht auch: Die Bearbeitung des CC-BY-SA-Fotos steht wieder unter CC BY-SA 4.0. Außerdem der Hinweis „personality rights“ von Commons (Person des öffentlichen Lebens in ihrer Rolle, keine Werbung).
- **Abweichung von DESIGN.md §4:** Das Duoton ist in die Datei gebacken (Pillow), nicht über den media-use-Shader „Monochrome Screen Print“. Der rastert in Punkte, der Auftrag will das Foto kornfrei. Die Endfarben sind dieselben. Kein CSS-Filter (Wunsch unten).
- **Bewegung:** Ein Mensch auf einem Foto „fliegt“ nicht 300 px hoch wie die Spielfigur. Er springt jetzt 70 px von der Schale und läuft im flachen Bogen nach Südwesten hinaus; das Foto zeigt ihn ohnehin laufend nach links.
- **Am Bild gefundene und behobene Fehler** (snapshot --review):
  - Das Camp-Nou-Foto hing nach der Rückfahrt unten links im Bild: Es ist an Barcelona verankert, bleibt aber bildschirmgroß.
  - Die weiße Behauptung „Nur sein Gehalt?“ stand auf den hellen Rängen. Das Foto geht jetzt 0,25 s vor der Widerlegung und steht 2,25 s ab Ankunft der Kamera.
  - Die dritte Credit-Zeile überdeckte „entgangen“ und „1 Saison“ (`check`: 2 Fehler). Dort steht das Foto-Credit jetzt in der untersten Zeile.

### 3. Fixes aus der Abnahme

**Beat 8, Entscheidung:** Die **Mitte der Drehung bleibt auf „Verkaufen“**, denn das Schild ist Text und muss auf seinem Wort kippen (Cue-Tor ±150 ms). Die Atempause nach „Geld.“ gibt Luft und ist dafür von 0,7 auf 1,0 s verlängert. Gemessen in `assets/timing.json` und den Bau-Zeiten:
- Neigung auf „nimmt“ 45,23 s, ausgeschwungen 46,03 s;
- Atempause 46,54–47,54 s, ein stehendes Bild;
- Drehung 47,53–48,13 s; sie beginnt im letzten Bild der Pause, ihre Mitte bei 47,83 s liegt 2 Bilder vor „Verkaufen“;
- das Geld wird ab der Mitte der Drehung echt (47,83–48,21 s), also auf „Verkaufen“ und erst auf der Nutzen-Seite;
- das Etikett „Opportunitätskosten“ kommt bei 48,63 s, auf seinem Wort.

Statt drei Bedeutungsänderungen in 1,1 s sind es jetzt: Neigung, nach 2,6 s Drehung samt Echtwerden, nach 0,8 s das Etikett. Drei neue Tore im Bau sichern das: Neigung ausgeschwungen vor der Pause; Drehung nicht vor dem Ende der Pause (−0,2 s); Etikett ≥ 0,3 s nach dem Echtwerden. Den Satz in Runde 2 („In ihr dreht sich die Waage“) ersetzt diese Beschreibung.

**Diagramm-Einstellung** (vorher 11,5 s ohne Fahrt):
- Auf „Genau dann …“ fährt die Welt 1,2-fach an die Alternative: Nachhilfe, Lohn, Gold-Fach, Kosten-Schale. Der Brennpunkt (108, 300) steht, die Nutzen-Seite tritt auf 35 % zurück, weil sie rechts hinausragt.
- Auf „Das kann es wert sein“ geht es zurück in die Totale mit beiden Schalen: Ob es das wert ist, wiegt beide Seiten. Auf „Gratis“ folgt die Nachfahrt an die Kosten-Schale wie bisher.
- Einstellungen: 4,85 + 3,96 + 1,38 s. Die 1,38-s-Totale ist kurz, liegt aber in der gemessenen Spanne (p10 1,2–3,1 s).
- Die Fahrten dauern 0,45 s (Median der Vorbilder) und liegen außerhalb der Lesezeiten: Rechnung und „aufgegeben“ sind gelesen, die Gleichung (HUD) steht 2,0 s still. „Nachhilfe“ rastet in den letzten Bildern der Fahrt ein und landet, wenn die Kamera steht. Vier neue Tore im Bau.

**Alle Einstellungen** (Nähte aus den Bau-Zeiten):

| | v2 | v1 | Vorbild |
|---|---|---|---|
| Median | **5,7 s** | 8,1 s | 5 s |
| längste | 9,6 s (Hook mit Denkpause) | 11,5 s | p90 12 s |
| Nähte / harte Schnitte | 10 / 1 | 8 / 1 | ≤ ⅓ hart |

**Text geht mit der Naht** (DESIGN.md §5 Standdauer):
- „Tore“ tritt mit der Waage auf 35 % zurück und geht mit der Fahrt nach Barcelona.
- Das Vertragsblatt geht mit dem Start der Fahrt, nicht 0,15 s davor.
- „45 Mio. €“ geht mit der Fahrt nach München, nicht mit dem Abflug des Geistes 0,25 s davor.
- Das Camp-Nou-Foto geht vor der Widerlegung (siehe 2).
- Bewusst nicht so: Die Behauptung „Nur sein Gehalt“ geht weiter auf „Doch“, weil das fallende Vertragsblatt sie sonst überdeckt. „Nur sein Gehalt + Barças Geld“ geht auf „Opportunitätskosten“, weil der D2-Begriff an derselben Stelle steht. „Nachhilfe, heute Abend“ geht mit der fallenden Tüte.
- **Barcelona-Timing:** Mit der neuen Stimme liegen „nichts“ und „45“ nur 2,4 s auseinander; zwei Tore rissen. Der Schwenk dauert jetzt 0,6 statt 0,7 s (gemessene Spanne 0,4–0,7) und endet spätestens 50 ms vor „45“.

### 4. Messwerte Fassung v2

| Wert | v2 | Runde 2 | Ziel |
|---|---|---|---|
| Dauer | **71,9 s** (Atempausen 0,9 + 0,6 + 1,0 + 0,9 s) | 70,7 s | ≤ 90 s |
| `hyperframes check` | **0 Fehler**, 7 Warnungen (unten) | 0 / 6 | 0 Fehler |
| Hör-Check auf dem MP4 (G4) | **`ok: true`**, WER 1,96 %, −16,1 LUFS, −4,1 dBTP, 2,32 Wörter/s, 2 deklarierte Stillen (2,47 s, 2,04 s), 48 kHz / 161 kbit/s | WER 1,31 % (nur Piper) | G4 |
| `voice.m4a` | 905 KB, 99,1 kbit/s, 44,1 kHz Stereo | 1,16 MB, 130 kbit/s | < 1 MB, ≥ 96 kbit/s |
| Bildanteil (`messen-bild.mjs`, 719 Proben) | **56,1 %**, 0 s ohne Held | 62,5 % | ≥ 50 % |
| Lesefenster, Kollisionen, Schriftgröße im Player | 0 Befunde außer fallenden Gegenständen (Vertrag 16,4 s, Lohntüte 62,0 s, je eine Probe); 2 Hinweise Stempel | ebenso | 0 |
| Cue-Tor im Bau (32 Texte) | max. **82 ms** | 80 ms | ≤ 150 ms |
| Energie-Probe (Wortanfang nach Pausen, 26 Wörter) | max. 64 ms, Median 3 ms | 54 / 7 ms | – |
| Einzelbild-Scan (`flackern.py`, 2157 Bilder) | **0 Ausreißer an 13 Nähten**; 33 Hinweise (Stempel, Foto beim Aufsteigen und Absprung, Fach, Nachhilfe, Tüte) | 0 an 13; 25 | 0 |
| Seek-Test (`seek-test.mjs`) | **29 von 29** pfadunabhängig und bildgenau | 29 | alle |
| Render (`--quality looks --workers 3`) | 128,2 s, 14,2 MB | 173,3 s, 11,8 MB | – |

**Warum der Bildanteil sinkt** (−6,4 Punkte, etwa 5 s): Die Foto-Credits und „FC Barcelona“ sind Text. Die 1,2-fache Fahrt vergrößert die Etiketten im Diagramm. „45 Mio. €“ steht 0,25 s länger. Die Credits sind dafür schon auf Urheber, Lizenz und „bearb.“ gekürzt.

**Warnungen, die bleiben** (7):
- **Bekannt aus Runde 2 (5):**
  - `composition_file_too_large` 2×;
  - `timeline_track_too_dense` (Beat-Marken der Atlas-Bühne);
  - `contrast_aa_failure` für den abgedunkelten Stempel „bezahlt“;
  - `rotation_pivot_drift` (falscher Alarm);
  - `line_unread` für „Nur sein Gehalt + Barças Geld“.
- **Neu (1):** `line_unread` für die Prößdorf-Zeile in „angebot“ (1,0 s). Sie setzt dieselbe Zeile an derselben Stelle aus „vertrag“ fort und steht sichtbar 8,2 s am Stück. `check` sieht jede Datei einzeln.

### 5. Belege (neu gebaut mit `python build/kontaktbogen.py`)

- `belege/kontaktbogen.jpg`: 14 Beats mit Foto, Camp Nou und der Diagramm-Fahrt (Bild 10). Der Kopf nennt die Stimmen je Block.
- `belege/alt-neu.jpg`, `belege/poster.jpg`: wie in Runde 2. Das Poster zeigt jetzt das Foto in der Denkpause.
- Die drei Einzelbelege aus Runde 2 (`vertrag-blatt.jpg`, `vergleich-null-euro.jpg`, `abflug-suedwest.jpg`) zeigen noch die Tipp-Kick-Figur und die alten Zeiten.

### 6. Offen und Wünsche (nicht geändert, nicht meine Dateien)

1. **Credits für Jonas:** 723 Credits (eine Variante je Block) oder 1446 (zwei) für Block 2, 5 und 6. Dann je ein Aufruf mit dem `text` aus `build/stimme-jonas.json`, die Datei nach `build/cache/elevenlabs/` legen, eintragen, `voice.py --anbieter datei`, `node build/bauen.mjs`, neu rendern. Erst dann lässt sich prüfen, ob „Nur sein Gehalt?“ mit Jonas steigt.
2. **`studio/DESIGN.md` §4:** ein gebackenes Duoton (Pillow, Endfarben #0E1726/#F5F0E8) als zweiten erlaubten Weg aufnehmen, wenn das Foto kornfrei sein soll. Dazu eine Regel: Foto-Credit (Lizenzpflicht) vor „Karte: Natural Earth“, wenn die Credit-Ecke voll ist.
3. **`factory/werk/bilder.py`:** `credit_zeilen()` liefert „Foto: Urheber, Jahr, Lizenz“ plus Kurzlink. Die Zeile im Bild musste kürzer sein; eine Kurzform „Foto: Urheber, Lizenz, bearb.“ wäre nützlich. Außerdem: Bei 429 auf das Original von selbst die Vorschau versuchen (Commons-Thumbnails sind gecacht).
4. **`factory/werk/stimme/`:** ein Adapter „connector“, der wie `--anbieter datei` fertige Block-Dateien liest. Dazu die DTW-Ausrichtung als gemeinsames Werkzeug, denn der Connector liefert keine Zeitstempel.
5. **`snapshot --against` gegen Referenzsequenzen** ist weiter nicht gelaufen (Clips gelöscht).

### Wiederholen (Fassung v2)

```bash
. /opt/deeptok/env.sh
cd studio/gold-opportunitaetskosten
/home/user/Deeptok/.venv/bin/python build/foto.py                 # Fotos, Umriss, credits.json (Cache in build/cache/fotos/)
/home/user/Deeptok/.venv/bin/python build/voice.py --anbieter datei   # braucht build/cache/elevenlabs/*.mp3 und das Paket onnx
node build/bauen.mjs
npx hyperframes check && npx hyperframes snapshot --review
npx hyperframes render --quality looks --workers 3 -o renders/gold.mp4
/home/user/Deeptok/.venv/bin/python build/flackern.py renders/gold.mp4
npx hyperframes play . --port 3115 --no-open &
node build/messen-bild.mjs 3115 0.1 && node build/seek-test.mjs 3115 renders/gold.mp4
python ../../factory/fabrik.py hoercheck --audio renders/gold.mp4 --text <sprechtext.txt> --erlaubte-stillen 2 --json
/home/user/Deeptok/.venv/bin/python build/kontaktbogen.py
```

## Abnahme (28.10.2026, nach Runde 2)

Eine unabhängige Prüfung des fertigen Renders `renders/gold.mp4`: 70,70 s, 1080 × 1920, 30 fps, H.264, AAC 48 kHz. Die Werte in der Tabelle unten habe ich selbst gemessen. Die übrigen Messwerte weiter unten stammen aus dem Bau und sind nicht wiederholt.

**Urteil:**
- **Bild und Didaktik sind klar besser als die alte Probe.**
- **Der Ton ist es nicht.** Es spricht dieselbe Piper-Stimme, die Linus „richtig kacke“ fand, und das Video ist 18 s länger (70,7 statt 52,6 s).
- **Für die Freigabe reicht der Stand nicht.** „Klar besser“ als Gesamturteil ist erst mit der Casting-Stimme realistisch.

### Belege

| Datei | Inhalt | Größe |
|---|---|---|
| `belege/kontaktbogen.jpg` | 14 Bilder, eins je Beat (Drehbuch-Nummern 1–12; Beat 8 hat zwei Szenen), beschriftet mit Zeit, Beat und Szene | 290 KB |
| `belege/alt-neu.jpg` | oben alt, unten neu, je drei Beats: Frage vor der Auflösung (13,5 s / 7,4 s), Irrtum widerlegt (43,5 s / 36,3 s), Schluss-Satz (51,5 s / 68,6 s) | 197 KB |
| `belege/poster.jpg` | 7,4 s, Mitte der Denkpause: die Frage „Was kostet Behalten?“, die Figur und drei Antwort-Schilder. Die Auflösung ist nicht zu sehen. | 140 KB, 1080 × 1920 |

- Alle drei baut `python build/kontaktbogen.py` neu.
- Jeder Zeitpunkt ist dort als „Cue + Versatz“ aus `assets/timing.json` festgelegt. Nach dem Stimmtausch passen die Bilder also ohne Handarbeit.
- **`alt-neu.jpg` dem Bruder erst nach seinem Blind-Urteil zeigen** (VIDEO-PIPELINE §6: „blind urteilt nur der Bruder“). Das Blatt sagt, welche Fassung neu ist.

### Selbst gemessen

| Prüfung | Ergebnis |
|---|---|
| `npx hyperframes check` | **0 Fehler**, 6 Warnungen, 16 Hinweise. Die Warnungen verteilen sich so: Lint 3, Layout 1, Kontrast 1, Craft 1. Sie sind dieselben wie unter „Warnungen, die bleiben“. |
| `fabrik.py lint` (G1) | **0 Treffer** in `drehbuch.md` und `REVIEW.md`. Ebenfalls 0 im Sprechtext, in `build/script.py` und in `fakten.json`. |
| Hör-Check auf dem MP4 (G4, wiederholt) | **`ok: true`**. WER 1,31 %, −16,1 LUFS, −4,3 dBTP, 2,31 Wörter/s, 2 deklarierte Stillen (2,48 s und 2,05 s). Einzige Abweichung: 2× „Oportunitätskosten“. |
| Externe URLs zur Laufzeit | **keine.** `index.html` und die 14 Kompositionen laden nur aus `assets/` (GSAP, Schriften, Stimme). „http“ kommt nur im SVG-Namensraum und im Lizenzkommentar von `gsap.min.js` vor. |
| `git status` im Ordner | **Keine Renders im Repo.** Gitignored sind `renders/`, `.hyperframes/`, `assets/voice.wav`, `build/cache/`, `build/node_modules/` und `build/__pycache__/`. |
| Dateien über 1 MB | **nur `assets/voice.m4a`** mit 1,16 MB (Stereo, 130 kbit/s). Sie ist seit 739829c im Repo und unverändert. Begründet: Sie ist die Tonspur des Videos. Alle anderen Dateien sind kleiner als 250 KB. |
| Gelöschte Dateien | 3 Belege aus Runde 1 (`drehung-verkaufen.jpg`, `frage-geist.jpg`, `rechnung-schluss.jpg`). Außerhalb des gitignorten `.hyperframes/` verweist nichts mehr auf sie. |
| Fakten | 17 Einträge in `fakten.json`, jeder mit Quelle, Datum und Zitat. Jede Faktenszene hat eine Credit-Zeile mit Quelle und Datum (Sichtprüfung auf dem Kontaktbogen). |
| Cue-Stichprobe im MP4 (Bilddifferenz) | Der Stempel „0 €“ setzt bei 32,60 s ein, „Cent“ beginnt bei 32,63 s. Die Lohntüte setzt bei 60,77 s ein, „Lohn“ beginnt bei 60,80 s. Beide kommen 1 Bild vor dem Wort. |
| Frage in den ersten 8 s | Gesprochen 4,69–6,20 s. Die Schilder stehen ab 5,8 s, darunter der Irrtum „Nur sein Gehalt“. |

### Befund: Die Waage dreht sich nicht in der Pause

Weiter unten steht, die Waage drehe sich „in der Atempause nach ‚Geld.‘“. Das stimmt nicht.

**Gemessen:** an der Bilddifferenz und in `build/bauen.mjs` (`drehStart = dreh − 0,3 s`).
- Die Pause von 45,26 bis 45,96 s ist ein stehendes Bild.
- Die Drehung läuft von 45,93 bis 46,47 s, also auf „Auch Verkau-“. Ihre Mitte liegt bei 46,2 s auf „Verkaufen“.
- Direkt danach kommen der Morph Geist → echt (etwa 46,3–46,5 s) und das Etikett „Opportunitätskosten“ (46,98 s).

Das sind drei Bedeutungsänderungen in gut einer Sekunde. Die neue Regel in `DESIGN.md` erlaubt höchstens eine je Sekunde; die Stelle liegt an dieser Grenze. Die Regel fordert außerdem zweierlei: die Drehung in einer Atempause und ihre Mitte auf dem Wort der neuen Sicht. Hier geht beides nicht zugleich, weil „Auch“ zwischen Pause und „Verkaufen“ steht.

**Vorschlag** (nicht umgesetzt, er braucht einen neuen Render). Es gibt zwei Wege:
- Die Drehung an den Anfang der Pause legen, so dass sie auf „Auch“ fertig ist, und den Morph auf „Verkaufen“ setzen.
- Oder die Beschreibung unten korrigieren und die Dichte am Handy prüfen (Punkt 1 der Liste unten).

### Klar besser? Die ehrliche Einschätzung

**Besser als die alte Probe:**
- **Bild statt Texttafel.**
  - Die alte Probe besteht aus Satz-Tafeln mit Karaoke-Untertiteln. Bilder gibt es dort nur dreimal: den Vertragsbalken (15–23 s), die Gabel (23–29 s) und die Kurve (34–39 s).
  - Neu hat jeder Beat einen Gegenstand als Helden: Figur, Vertragsblatt, Münzstapel, Waage, Rechnung, Lohntüte. Der Bildanteil liegt bei 62,5 % (Messung aus dem Bau).
- **Didaktik.**
  - Alt kommt die Frage erst ab 8 s. Der Irrtum „Man denkt: Was nichts kostet, ist gratis“ folgt erst bei 39 s, nach der Kurve. Dazu steht „Die meisten sagen: nichts“ ohne Quelle da.
  - Neu kommen Frage und Irrtum als Antwort-Schild in den ersten 6 s. Der Irrtum bringt seinen Grund mit, und die Widerlegung zeigt einen Vergleich (45 Mio. € gegen 0 €). Erst danach kommt der Begriff, zum Schluss der Transfer auf einen eigenen Abend. Das ist der Bogen aus §5.
- **Ein Modell trägt alles.** Die Waage zeigt Irrtum, Widerlegung, Begriff und Transfer. „Bezahlt“ und „aufgegeben“ liegen auf derselben Schale. Die alte Kurve stand 4,9 s und blieb abstrakt.
- **Belege sind sichtbar.** Jede Faktenszene hat eine Credit-Zeile; die alte Probe hatte keine.

**Nicht besser:**
- **Die Stimme ist dieselbe** wie in der alten Probe. Dazu kommt „Oportunitätskosten“ beim Schlüsselbegriff und eine Echo-Frage, die nicht wie eine Frage klingt. Die Stimme war Linus' Hauptkritik.
- **Die Länge:** 70,7 statt 52,6 s, also +34 %. Bei „Wissen nach 7 Tagen pro Minute“ muss der Transfer-Teil das wieder einspielen. Belegt ist das erst mit dem 7-Tage-Quiz.
- **Wenig Wechsel im Bild:** Von 31 bis 50 s bleibt der Ausschnitt fast gleich (Waage über Deutschland, Kontaktbogen 6a–8b). Abwechslung bringen dort nur Etiketten, Stempel und die Drehung.
- **Das Diagramm (51,7–64 s)** wirkt nach dem plastischen Atlas flacher. Es steht 11,5 s ohne Fahrt, und unter der Waage bleibt viel leeres Raster.
- **Die Figur** ist eine Tipp-Kick-Figur ohne Gesicht, nicht Lewandowski.

### Drei Dinge, die Linus beim Ansehen prüfen soll

Am Handy ansehen, einmal mit Ton und einmal ohne.
1. **43–50 s (Auflösung).** In gut 4 s passieren hier: Bayern nimmt das Geld, die Waage dreht sich, das Geld wird echt, „Opportunitätskosten“ erscheint unter der Kosten-Schale, der Spieler hebt ab.
   - Verstehst du beim ersten Ansehen, warum jetzt der Umriss des Spielers auf „Kosten“ steht?
   - Wenn nicht, ist das der erste Umbau (siehe Befund oben).
2. **26–37 s (Widerlegung), ohne Ton.**
   - Liest du die blasse, gestrichelte „45 Mio. €“ als Geld, das Bayern entgeht?
   - Liest du „0 €“ am Schild als „Behalten bringt keine Ablöse“?
   - Liest du „Nur sein Gehalt + Barças Geld“ mit durchgestrichenem „Nur“ als Korrektur deiner Antwort?
3. **51–64 s (Diagramm und Transfer).**
   - Trägt das Kino-Beispiel, oder wirkt das Bild nach der Karte leer und abfallend?
   - Dazu die Gesamtfrage: Wäre das Video mit einer guten Stimme für dich „klar besser“ (1–5)?

### Was nur die echte Stimme lösen kann

1. „Opportunitätskosten“ richtig aussprechen. Piper sagt zweimal „Oportunitäts-“, und der Hör-Check hört es so.
2. Die Echo-Frage „Nur sein Gehalt?“ am Ende steigen lassen.
   - Mit Piper klingt sie wie eine Wiederholung der Behauptung; Whisper schreibt „Nur sein Gehalt.“
   - Sonst hilft nur ein anderer Satzbau (Wunsch c an die Chefredaktion).
3. Betonung und Kontrast, etwa „Verkaufen bringt … Behalten keinen Cent“ und „keiner“. Piper setzt `betont` nicht um.
4. Das Tempo der Schlüsselsätze: Laut Prüfung 2 kommen Definition und Schluss-Satz auf bis zu 4,9 Wörter/s. Nachgerechnet: „Es steht nur auf keiner Rechnung“ hat 6 Wörter in 1,46 s, also 4,1 Wörter/s. Dazu fehlen echte Pausen vor der Wende.
5. Klang und Natürlichkeit, also genau das, was Linus „kacke“ fand.

**Folgen des Tauschs:**
- Alle Zeiten wandern mit.
- Bei 2,2 statt 2,31 Wörtern/s wird das Video etwa 3 s länger. Die Diagramm-Totale (jetzt 11,5 s) kann dann über p90 = 12 s kommen.
- Nach `voice.py --anbieter <sieger>`, `node build/bauen.mjs` und dem Render müssen die Tore und diese Abnahme noch einmal laufen: `python build/kontaktbogen.py` und der Hör-Check auf dem MP4.

### Was die Referenz-Clips noch ändern könnten

Die Destillation vom 27.10. (`docs/research/referenz-destillation.md`, 5 Clips) ist überall eingearbeitet, wo sie Zahlen liefert: Fahrten 0,5–0,6 s, Cue −2 Bilder, Tempo 2,2 Wörter/s. Offen ist noch:
1. **`snapshot --against` gegen 2–3 Referenzsequenzen.**
   - Das ist eine Freigabe-Bedingung aus VIDEO-PIPELINE §6 und ist nicht gelaufen.
   - Die Clips wurden nach der Messung gelöscht. Man müsste sie neu holen (ZDF-Mediathek; Terra X von Commons).
2. **Einstellungsdauer.**
   - Die Vorbilder liegen im Median bei 5 s (p90 12 s), der Goldstandard bei 8,1 s.
   - Die Folge wären mehr Nähte, etwa Nachfahrten in Beat 3, in Beat 7 und im Diagramm.
3. **Kreis als Marker.**
   - In 778 s Vorbild-Material gibt es keinen einzigen Kreis. Gemessen sind ✓/✗, Klammer, Textmarker und Abdunkeln.
   - Der Gold-Kreis um den Geist beim Begriff könnte deshalb dem Abdunkeln oder einer Klammer weichen.
4. **Text geht mit der Naht.**
   - Bei den Vorbildern verschwindet Text fast nie einzeln.
   - Hier tritt die Behauptung auf „Doch“ ab und kommt mit „Nur sein Gehalt?“ wieder. Das könnte ruhiger werden.
5. **Veritasium ist nie gemessen worden.** YouTube ist gesperrt, maiLab steht als Ersatz. Die Didaktik stützt sich deshalb auf Literatur (Muller et al. 2008), nicht auf Messung.

## Messwerte

| Wert | Runde 2 | Runde 1 | Ziel |
|---|---|---|---|
| Dauer | **70,7 s** (153 Wörter, 13 Szenen; Atempausen 0,9 + 0,6 + 0,7 + 0,9 s) | 69,4 s | ≤ 90 s |
| `hyperframes check` | **0 Fehler**, 6 Warnungen (unten begründet) | 0 / 7 | 0 Fehler |
| `check --caption-zone` (DESIGN.md §2) | 0 Fehler, 8 Warnungen (die 2 zusätzlichen kommen von der Nachfahrt im Satz) | 0 / 9 (in Runde 1 hier fälschlich als 7 angegeben) | 0 Fehler |
| Hör-Check **auf dem gerenderten MP4** | WER **1,3 %**, **−16,1 LUFS**, −4,3 dBTP, 2 lange Stillen (Denkpause 2,48 s, Halten 2,05 s; beide deklariert), 2,31 Wörter/s, `ok: true` | WER 3,3 % | G4 |
| Bildanteil (`build/messen-bild.mjs`, alle 0,1 s im Player) | **62,5 %**, 0 s ohne Held | 55,5 % | ≥ 50 % |
| Renderzeit (`--quality looks --workers 3`) | **173,3 s**, 11,8 MB | 111,9 s | – |
| Cue: Text gegen Wortanfang (Tor im Bau, 32 Texte) | **max. 80 ms** | 83 ms (28 Texte) | ≤ 150 ms |
| Cue: Energie-Probe (25 Einsätze nach Pausen) | max. 54 ms, Median 7 ms | 53 ms | – |
| Cue: Whisper | roh max. 419 ms, nach Abzug des Whisper-Versatzes (−82 ms) max. 337 ms; 3 Cues über 150 ms, alle widerlegt (unten) | 378 ms | ≤ 150 ms |
| Einzelbild-Scan (`build/flackern.py`, 2121 Bilder) | **0 Ausreißer an 13 Nähten**; 25 Hinweise, alle Stempel oder fallende Gegenstände | 0 an 12 | 0 |
| Seek-Test (`build/seek-test.mjs`, neu mit Änderungs-Rechteck) | **29 Bilder** an Markern, Stempeln, Drehung, Abflug, Schnitt und Nachfahrten: alle pfadunabhängig und bildgenau | 15 Bilder, Kriterium blind für Marker | alle |
| Schriftgröße aller Texte im Player (neu in `messen-bild.mjs`) | 0 Befunde; 3 Hinweise (je 1 Probe, Stempel federt beim Aufsetzen unter Maßstab 1) | nicht gemessen | ≥ 48 px, Credits ≥ 34 px |
| Lesefenster aller Texte im Player | 0 Befunde außer fallenden Gegenständen (Vertrag 15,7–15,8 s, Lohntüte 60,8–60,9 s) | „Lohn“ und Etiketten 2–9 px draußen | x 108–972, y 168–1330 |
| Kollisionen HUD-Text / Gegenstand | **0** | 3 kurze | 0 |
| Längste Einstellung ohne Fahrt oder Schnitt | **11,5 s** (Diagramm 51,7–63,2 s), dann 9,5 s (Beats 3–4); Median 8,1 s | 13,8 s und 12,3 s | p90 12 s |

**Zur Cue-Abweichung mit Whisper.** Whisper legt „Barcelona“ in den Vorlauf (Stille, 0,0 s). Die beiden anderen habe ich an der Lautstärke-Hüllkurve von `voice.m4a` nachgemessen:
- „nur“: Whisper 9,86 s, das ist das Ende von „Antwort“. Von 10,08 bis 10,26 s ist es still (−51 bis −65 dBFS), die Stimme setzt bei 10,28 s ein. Die Wortzeit sagt 10,279 s.
- „Ablöse“: Whisper 30,88 s, mitten in „Millionen“. Die Delle zwischen den Wörtern liegt bei 31,09–31,13 s, der Vokal „A“ bei 31,15 s, der Verschluss von „b“ bei 31,21–31,27 s. Die Wortzeit sagt 31,187 s.

Die Wortzeiten stimmen also auf etwa 50 ms. Whisper taugt hier nur als Grob-Tor (Wunsch an G4 unten).

**Zur Stimme.** Die neue Piper-Aufnahme (mit den Atempausen von Runde 2) spricht „eine Saison“ und „keiner“ jetzt so, dass Whisper sie erkennt. Falsch bleibt nur „Opportunitätskosten“ (2× „Oportunitätskosten“).

## Was in Runde 2 geändert ist

**Waage als Gegenstand (Prüfung 1, P1).** Vorher ein Drahtgestell aus 2-px-Linien, am Handy unsichtbar. Jetzt ist sie beleuchtet wie Figur und Münzen: Balken 18 px mit Lichtkante, Säule und Fuß als Fläche mit Licht links und Schatten rechts, Ketten 4 px Creme 80 %, Schalen 400 px breit mit Lichtkante. Im Handy-Blatt stehen Ketten und Balken jetzt sichtbar da.

**Widerlegung (Prüfung 2, zwei P1).**
- Der rote Durchstrich trifft **nur „Nur“** (Wortbreite gemessen). Auf „bezahltes“ wird die Zeile wieder hell, und „+ Barças Geld“ wächst in Gold hinten an. Das Gehalt steht die ganze Zeit unversehrt da; die Korrektur sieht aus wie eine Ergänzung.
- Der Vergleich hat ein Bild: Unter der Kosten-Schale steht „45 Mio. €“ im **Geist-Stil** (60 % Deckkraft, gestrichelte Gold-Unterkante), solange es nur eine Möglichkeit ist. Auf „keinen **Cent**“ fällt der Stempel „0 €“ an das Schild „Behalten“. Also: Geist mit 45 Mio. € gegen Behalten 0 €. Auf „**genauso**“ bekommt der Geist Gewicht, die Waage geht auf waagerecht, und die Zahl wird fest.
- Das Etikett ist zweizeilig: der Betrag, darunter sein Wort („entgangen“, auf „Alternative“ per Morph „beste Alternative“). Beim Begriff umkreist der Gold-Kreis also wirklich 45 Mio. €, und „beste Alternative“ hängt am Geist statt als Unterzeile unter dem D2.
- Die widerlegte Zeile tritt auf 35 % zurück, bevor der Geist beim Rückschwenk durch ihr Ende fliegt.

**Auflösung, Beat 8 (Prüfung 2 P1, Prüfung 1 P1/P2).** Vorher: fünf Bedeutungswechsel in 2,3 s, die Drehung lief gleichzeitig mit der Rückfahrt, und echtes Geld lag kurz auf „Kosten“ unter „Behalten“. Jetzt:
- In der Atempause nach der Definition (`atem_s` 0,6 s) treten Begriff, Kreis, Etikett und Beleg ab, und die Welt fährt zurück. „Im Juli **nimmt** Bayern das Geld“ steht damit in der Totale, die ganze Waage ist im Bild.
- Nach „Geld.“ folgt eine Atempause (`atem_s` 0,7 s; dafür ist Beat 8 jetzt zwei Szenen, `verkauf` und `aufloesung`). In ihr dreht sich die Waage bei stehender Kamera. Die Mitte der Drehung, also das Schild auf der Kante, liegt genau auf „Verkaufen“.
- Der Geist wird erst echt, wenn er auf der Nutzen-Seite ankommt. Echtes Geld liegt nie auf „Kosten“.
- Auf „Opportunitätskosten“ tritt das Geld auf 35 % zurück: Der gestrichelte Gold-Umriss auf „Kosten“ ist dann der einzige helle Gold-Gegenstand.
- Der Spieler fliegt nach **Südwesten** hinaus (erst senkrecht, dann im Bogen nach links unten, Austritt am linken Rand bei y ≈ 700), also Richtung Barcelona wie die Route. Vorher ging es nach Nordwesten.

**Beats 3–4 (Prüfung 1 P1, Prüfung 2 P2).**
- Die Waage neigt sich nur, wenn etwas aufsetzt: Der Beleg landet → links; der Spieler steigt erst auf „**schießt**“ auf die Nutzen-Schale → rechts. Vorher stand er schon da, und nichts geschah.
- Die Zeitleiste ist auf das Vertragsblatt gedruckt (720 × 370 px). „0 €“ ist ein zweiter Stempel auf „Bayern bekommt **nichts**“. Die Verlängerung tritt auf „nicht“ auf 35 % zurück, statt zu verschwinden (sie stand nur 1,0 s).
- Die Waage tritt im Vertrag auf 35 % zurück; Held ist das Blatt. Auf „**Danach**“ fährt die Welt 1,12-fach an das Blatt heran.
- Die Behauptung „Nur sein Gehalt“ tritt auf „Doch“ ab und kommt mit „Nur sein Gehalt?“ zurück.
- Ergebnis: längste Einstellung 9,5 s statt 13,8 s. Bei 21,9 s stehen 5 lesbare Texte auf dem Blatt und 3 Credit-Zeilen; die Texte an der Waage und „verlängern“ sind auf 35 % abgedunkelt (vorher 13 Textelemente in voller Deckkraft).

**Route und Ortspunkt (Prüfung 1 P2, neu in dieser Sitzung).** Die Route hat keine Aufgabe, solange die Waage in München steht. Abgedunkelt stach sie trotzdem durch „Vertrag: Salihamidžić …“, „Ablöse: …“ und „Wechsel: …“. Jetzt geht sie mit dem Zoom ganz weg. Sie kommt nur für die Fahrt nach Barcelona und den Flug des Geistes zurück. Der Punkt „München“ geht, sobald die Waage steht; er saß in Beat 4 mitten in „ablösefrei: EuGH, • Bosman-Urteil“.

**Hook (Prüfung 1 und 3, P2).** Die Figur steht schon in Bild 0 (Vorschaubild mit Held). Auf „behalten“ treten Route und „Barcelona“ zurück; „Barcelona •“ liest sich in der Denkpause nicht mehr als Teil des Schilds „Nichts, er ist ja da“. Die Denkpause ist im MP4 2,48 s lang (vorher 2,57 s, über der Spanne aus DESIGN.md §9).

**Diagramm (Prüfung 1 P1, Prüfung 2 P2, Prüfung 3 P2).**
- Nach dem Schnitt steht nur die leere Waage. Jede Kategorie kommt mit ihrem Beispiel: Die Rechnung **fällt** auf „geschenkt“, schon mit „0 €“. Das gestrichelte Gold-Fach „aufgegeben“ rastet auf „**Genau** dann“ ein.
- Schrift auf Gegenständen 48 px („Rechnung“, „Lohn“, Schalen); die Rechnung ist 254 px breit, die Tüte 140 px.
- Fach und Tüte sind deckend, also scheint keine Kette mehr durch. Ihre Fläche kommt mit dem Strich und steht nicht mehr vorher als dunkles Loch im Raster.
- „Nachhilfe, heute Abend“ gehen mit der Tüte auf „Lohn“, statt danach ohne Gegenstand zu schweben.
- Auf „**Gratis**“ treten die Gleichung, die Nutzen-Seite und die Kinokarte zurück. Fuß, Säule und Schild gehen ganz, und die Welt fährt 1,9-fach an die Kosten-Schale; diese steht danach in der Bildmitte. Auf „nicht“ zuckt die Lohntüte neben der Rechnung „0 €“. Das Bild sagt „nicht gratis“, statt „geschenkt ≠ gratis“ hinzuschreiben.
- Im Satz zieht die Gold-Unterstreichung unter „aufgegeben“ am Gold-Fach, nicht unter der kleinen Gleichung. Die Navy-Unterstreichung liegt unter dem Kopf der Rechnung.
- Neu in dieser Sitzung: Fach und Tüte sitzen 10 px weiter rechts, die Rechnung 6 px. So steht „Lohn“ ganz im Lesefenster (vorher bei x = 99).

**Etiketten an der Kosten-Schale (neu in dieser Sitzung).** Bei waagerechter Waage begannen „45 Mio. €“, „entgangen“, „beste Alternative“ und „aufgegeben“ 2 px links vom Lesefenster (gemessen). Der Versatz ist jetzt −162 statt −164 px.

**Prüfwerkzeuge (Prüfung 3, P2).**
- `build/messen-bild.mjs` misst jetzt die effektive Schriftgröße jedes Textes (Schriftgröße × Bildschirm-Maßstab, ≥ 48 px, Credits ≥ 34 px). Kollisionen prüft es an den Textzeilen statt am Block; vorher galt die Figur neben „Behalten?“ als überdeckt, weil der Titel-Block 864 px breit ist. Federt ein Stempel für eine einzige Probe unter Maßstab 1, ist das ein Hinweis, kein Befund.
- `build/seek-test.mjs` vergleicht im **Änderungs-Rechteck**, also dort, wo sich der Render zwischen n−1 und n+1 unterscheidet. Über das ganze Bild gemittelt ging ein zeichnender Durchstrich im Rauschen unter. Die Prüfbilder kommen aus den Zeiten des Baus und wandern mit, wenn die Stimme wechselt. Beleg: Bild 849 (Durchstrich zeichnet) misst 27,0 dB gegen 19,4/22,3 dB der Nachbarn.
- `build/bauen.mjs`:
  - `hole()` nimmt GSAP und Schriften aus `assets/`, wenn die SHA-256 stimmt; aus einem frischen Klon braucht nur noch die Karte das Netz.
  - Das Skript `bauen` in `package.json` ruft vorher `npm ci --prefix build` auf.
  - Die Marker-Bibliothek wird ohne ihren langen Kopf-Kommentar eingesetzt; er steht in `lib/marker.js`. So bleiben `hook`, `widerlegung` und `entgangen` unter 300 Zeilen, und drei Warnungen sind weg.
- `render` in `package.json` setzt `--quality looks` ausdrücklich.

## Abweichungen vom Drehbuch

1. **Geist statt fliegendem Geld.** Nach München fliegt der Umriss des Stapels; echt wird er erst nach der Drehung auf „Nutzen“. Das Drehbuch sagt „Darsteller geld … wechselt nie die Form“.
2. **Beat 8 ist zwei Szenen** (`verkauf`, `aufloesung`) mit `atem_s` 0,7 s dazwischen. Dazu kommt `atem_s` 0,6 s nach der Definition. Der Sprechtext ist unverändert.
3. **Die Waage dreht sich in Beat 8** und hat ein Schild („Behalten“ → „Verkaufen“; im Diagramm „Kino“).
4. **„Opportunitätskosten“ und „1 Saison“** stehen in Gold unter der Kosten-Schale, nicht an der leeren Nutzen-Schale.
5. **Der Spieler landet nicht in Barcelona**, er fliegt nach Südwesten aus dem Bild. Der Umriss auf „Kosten“ trägt die Auflösung.
6. **Tipp-Kick-Figur** statt Foto (Lizenz offen, KI-Bild verboten). Sie steht ab Bild 0 und steigt erst auf „schießt“ auf die Schale (Drehbuch: auf „Tore“).
7. **Vertrag als Blatt** mit aufgedruckter Zeitleiste und zwei Stempeln; kein Kreis um „30.06.2023“. Nachfahrt auf „Danach“.
8. **Keine Datelines und keine Ländernamen**: Die Daten stehen in den Credits.
9. **Widerlegung:** Durchstrich nur auf „Nur“, Korrektur durch Anwachsen von „+ Barças Geld“ (Drehbuch: Morph des ganzen Schilds). Zusätzlich der Stempel „0 €“ am Schild „Behalten“ und „45 Mio. €“ im Geist-Stil.
10. **„beste Alternative“** hängt als zweite Etikett-Zeile am Geist (Morph aus „entgangen“); kein „aufgegeben“ im Atlas.
11. **Diagramm:** Rechnung und Gold-Fach kommen erst mit ihren Beispielen; keine Klammer „Rechnung“, kein „geschenkt ≠ gratis“, kein „Aufgeben = Kosten“. Die Gleichung erscheint auf „kostet“ und geht auf „Gratis“. Die Nachfahrt kommt auf „Gratis“ (Drehbuch: Kamera steht bis zum Ende).
12. **Kein Etikett „Satz fürs Gespräch“ / „Satz für die Stunde“** im MP4. Das Etikett hängt vom Profil ab, und ein Video gilt für beide; es gehört in den Player (offene Frage im Drehbuch, BANNED 2: kein Label in der Ecke).
13. **Route und Ortspunkt München** sind weg, solange die Waage steht.
14. **Neue Cues** in `build/script.py`: `nur`, `schiesst`, `verlaengern_an`, `danach`, `nichts`, `bietet`, `cent`, `gewicht`, `nimmt`, `dreh`, `abflug_spieler`, `ok_saison`, `genau`, `gleichung`, `gratis_nicht`. `landung_spieler` entfällt. Die Tabelle in `drehbuch.md` kennt sie noch nicht (Wunsch unten).

## Warnungen, die bleiben

- `composition_file_too_large` (2×): `atlas.html` (Karte, 107 KB Pfade, und die Bühnen-Bibliothek) und `diagramm.html`. Von Hand bearbeitet wird nur der Teil außerhalb der Marken; die Quellen sind `lib/atlas.html`, `lib/diagramm.html`, `lib/buehne.js` und `build/drehbuch-*.js`.
- `timeline_track_too_dense` (1×): die Beat-Marken der Atlas-Bühne. Sie sind unsichtbar und dienen nur `snapshot --review`.
- `line_unread` (1×): „Nur sein Gehalt + Barças Geld“ in `entgangen` (1,2 s). Die Zeile läuft in `begriff` weiter und steht insgesamt 3,1 s (35,5–38,6 s); `check` sieht jede Datei einzeln.
- `contrast_aa_failure` (1×): der Stempel „bezahlt“ auf dem Beleg bei 19,6 s. In Beat 4 ist die ganze Waage auf 35 % abgedunkelt. Abgedunkelte Texte sollen nicht gelesen werden (DESIGN.md §6) und zählen nicht als Text.
- `rotation_pivot_drift` (1×, `#w-balken`): Falscher Alarm. Der Balken dreht um die Säulenspitze (`translate · scale · rotate · translate` in `lib/buehne.js`). `check` sammelt die Mitte seines Rahmens über das ganze Video, und dabei fährt die Kamera München → Barcelona → München; daher die 1290 px.
- Mit `--caption-zone` zusätzlich `container_overflow` und `escaped_container` für `#d-welt` bei 66,8 s: Die Welt-Hülle ist in der Nachfahrt 1,9-fach größer als die Bühne. Das ist gewollt.

## Schwächste Stelle

**Das Diagramm, 51,7–63,2 s.** Die Kamera steht 11,5 s; neue Elemente kommen alle 0,6–2,3 s (Karte, Rechnung, Fach, Nachhilfe, Tüte, Gleichung, Lohn). Die Waage ist eine Strichzeichnung von 940 × 500 px auf Rasterpapier. Nach dem plastischen Atlas wirkt das flacher und leerer, besonders unter dem Fuß (y 1130–1330).
- Eine 1,25-fache Waage, wie Prüfung 1 vorschlägt, passt nicht ins Bild: 940 px × 1,25 = 1175 px > 1080 px. „aufgegeben“ und „Lohn“ fielen dann links aus dem Lesefenster.
- Eine Nachfahrt schon auf „Lohn“ schnitte die Nutzen-Schale mit der Kinokarte ab, gerade wenn die Stimme „Das kann es wert sein“ sagt. Dafür muss die waagerechte Waage mit beiden Schalen zu sehen sein.

Mit mehr Zeit würde ich eine eigene Diagramm-Geometrie bauen: höhere Säule, längere Ketten, schmalerer Balken. Der Passschnitt wäre dann ein Schnitt mit Größenwechsel. Danach kommen:
- **Die Stimme.** Piper sagt „Oportunitätskosten“. Der Anstieg bei „Nur sein Gehalt?“ fehlt.
- **Fallende Gegenstände** (Vertrag, Lohntüte) liegen 0,1–0,2 s über dem Rand des Lesefensters, während sie fallen.

## Nicht behoben (mit Grund)

- **Platzhalter-Stimme (Prüfung 3, P0):** Die Casting-Entscheidung fällt am 1.11. Bis dahin taugt eine Bewertung durch die Brüder nicht als Freigabe.
- **Diagramm als lange Totale (Prüfung 1, P1, teilweise):** siehe „Schwächste Stelle“. Behoben sind die Schrift (≥ 48 px), die Kategorien mit Beispiel, deckende Fächer und die Nachfahrt auf „Gratis“ ohne Säulenreste. Die Einstellung ist 11,5 statt 13 s lang und liegt damit unter p90 = 12 s (DESIGN.md §9).
- **„beste Alternative“ ohne Beispiel (Prüfung 2, P2):** Das braucht neuen Sprechtext oder eine andere Abruffrage 3. Das entscheidet die Chefredaktion (Wunsch unten).
- **Antwort-Schilder an der Form erratbar (Prüfung 2, P2):** „Barcelona will Lewandowski kaufen“ wäre Sprechtext und braucht einen Beleg. Das entscheidet die Chefredaktion (Wunsch unten).
- **Echo-Frage hängt an der Tonhöhe (Prüfung 2, P2):** Satzbau-Vorschlag „Ist es nur sein Gehalt? Nein.“ geht an die Chefredaktion. Mit der Piper-Stimme erkennt Whisper die Frage nicht („Nur sein Gehalt.“).
- **Tempo der Schlüsselsätze (Prüfung 2, P2, teilweise):** Die Atempause nach der Definition ist eingebaut. Der Rest ist eine Eigenschaft der Stimme und kommt als Abnahme in den Casting-Hör-Check (Wunsch unten).
- **Render-Qualität (Prüfung 3, P2), widerlegt:** `--quality looks` ist die Voreinstellung und erscheint im Render-Log als `"quality":"standard"` (CRF 16). Auch der Render aus Runde 1 war also schon „looks“. Jetzt steht es ausdrücklich im Aufruf.
- **Rotes Kreuz für „Nichts, er ist ja da“ (Runde 1):** Rot gibt es genau einmal. Der Ablenker wird widerlegt, wenn der Gehalt-Beleg auf die Kosten-Schale fällt.
- **Rückennummer auf der Figur (Runde 1):** Jede Zahl im Bild braucht einen Beleg im Faktenblatt.

## Gemessen, nur angesehen, ungeprüft

- **Gemessen:**
  - `check` mit und ohne Untertitel-Zone;
  - Lesefenster, Schriftgröße und Kollisionen aller Texte im Player (707 Proben);
  - Bildanteil, Cue-Tor, Haltezeiten;
  - Hör-Check auf dem MP4, Lautheit;
  - Einzelbild-Scan, Seek-Test (29 Bilder), Renderzeit;
  - die Hüllkurve an „nur“, „Ablöse“ und „Cent“.
- **Angesehen:**
  - Beat-, Naht- und Handy-Blätter aus zwei `snapshot --review`-Durchgängen;
  - Einzelbilder zu Begriff, Drehung und Abflug (18 Bilder), Credits bei 21,9, 32,2 und 47,5 s;
  - Belege in `belege/`:
    - `vertrag-blatt.jpg`: 21,9 s, Blatt mit Zeitleiste und zwei Stempeln, Waage zurückgetreten, Credits frei;
    - `vergleich-null-euro.jpg`: 33,2 s, „Nur“ durchgestrichen, Geist mit „45 Mio. €“ im Geist-Stil, „0 €“ am Schild „Behalten“;
    - `abflug-suedwest.jpg`: 49,3 s, Spieler verlässt das Bild nach links unten, Umriss mit „Opportunitätskosten / 1 Saison“ auf „Kosten“, Geld abgedunkelt.
- **Ungeprüft:** iPhone/Safari, Ton am Kopfhörer, wie die Drehung auf einem echten Handy wirkt, Bewertung durch die Brüder.

## Wiederholen

```bash
. /opt/deeptok/env.sh
cd studio/gold-opportunitaetskosten
npm ci --prefix build                               # d3-geo, topojson-client (node_modules ist gitignored)
# Stimme (nur bei neuem Skript oder neuer Stimme). Ohne das Paket onnx fällt voice.py auf
# geschätzte Wortzeiten zurück (Wunsch unten).
/home/user/Deeptok/.venv/bin/python build/voice.py --anbieter piper
python build/script.py --cues                       # Selbstprüfung des Skripts
node build/bauen.mjs                                # Prüfsummen, Zeiten, Cue-Tor, Messen (Netz nur für die Karte)
npx hyperframes check && npx hyperframes snapshot --review
npx hyperframes render --quality looks --workers 3 -o renders/gold.mp4
/home/user/Deeptok/.venv/bin/python build/flackern.py renders/gold.mp4   # Nähte, Exit 1 bei Ausreißer
python ../../factory/fabrik.py hoercheck --audio renders/gold.mp4 --text <sprechtext.txt> --erlaubte-stillen 2 --json
npx hyperframes play . --port 3115 --no-open &      # Player im Hintergrund, dann:
node build/messen-bild.mjs 3115 0.1                 # Bildanteil, Lesefenster, Schriftgröße, Kollisionen
node build/seek-test.mjs 3115 renders/gold.mp4      # Seek-Test gegen den Render (Änderungs-Rechteck)
python build/kontaktbogen.py                        # Abnahme-Bilder: Kontaktbogen, alt/neu, Poster (Zeiten aus timing.json)
```

## Was Linus jetzt tun und prüfen soll

1. **Das MP4 am Handy ansehen** (`renders/gold.mp4`, gitignored: nur in dieser Sitzung oder nach neuem Render). Die Stimme bitte wegdenken. Achte auf:
   - 29–36 s: Liest du „45 Mio. €“ als Möglichkeit (blass, gestrichelt) und „0 €“ am Schild als „Behalten bringt nichts“?
   - 43–49 s: Siehst du die ganze Waage, wenn Bayern das Geld nimmt? Ist die Drehung in der Pause verständlich?
   - 51–63 s: Ist das Diagramm zu leer? Das ist die schwächste Stelle.
2. **Mit deinem Bruder 29–36 s und 44–49 s ohne Ton ansehen** und fragen, was der gestrichelte Stapel bedeutet und warum sich die Waage dreht. Persönliches dazu bitte nicht ins Repo.
3. **Entscheiden:** Tipp-Kick-Figur oder Wikimedia-Foto (Duoton, Lizenz prüfen)?
4. **Noch keine Freigabe-Bewertung:** erst nach dem Stimmtausch am 1.11. Dann `voice.py --anbieter <sieger>`, `node build/bauen.mjs`, neu rendern und die Tore oben laufen lassen. Den Bruder bei etwa 6,5 s von Hand anhalten lassen (Denkpause); einen Player mit Halt gibt es noch nicht.
5. **Beim Casting-Hör-Check** auf „Opportunitätskosten“, „eine Saison“, „keiner“ und den Anstieg bei „Nur sein Gehalt?“ achten. Definition und Schluss-Satz sollen höchstens 2,6 Wörter/s haben.

## Wünsche an andere Dateien (nicht geändert)

1. **`drehbuch.md` (Chefredaktion):**
   - Tabelle und Kamera-Vertrag an Runde 2 anpassen: die neuen Cues; Beat 8 als zwei Szenen; `atem_s` 0,6/0,7; Durchstrich nur auf „Nur“ mit „+ Barças Geld“; „45 Mio. €“ im Geist-Stil und Stempel „0 €“; Zeitleiste auf dem Blatt; Abflug nach Südwesten; Kategorien mit Beispiel; kein „geschenkt ≠ gratis“; Satz-Etikett im Player.
   - Entscheiden: „beste“ mit Beispiel (Variante a: kurz eine zweite, schwächere Alternative im Transfer, ein Halbsatz) oder Abruffrage 3 auf eine Alternative umstellen und „beste“ im Info-Blatt erklären (Variante b).
   - Entscheiden: „Barcelona will Lewandowski **kaufen**.“ (bereitet „Barças Geld“ vor; Beleg im Faktenblatt nötig). Dann könnte das Irrtums-Schild „Sein Gehalt“ heißen, weil der Durchstrich der Behauptung „Nur“ trifft.
   - Entscheiden: Echo-Frage als „Ist es nur sein Gehalt? Nein.“ (trägt die Frage ohne Tonhöhe; Cue `falsch` auf „Nein“).
2. **`factory/` (G0, Bogen-Prüfung):** eingeschobene Beats Begriff, Auflösung und Satz zulassen, dazu zwei Widerlegungs-Szenen und zwei Auflösungs-Szenen hintereinander; das Feld `atem_s` kennen (0,6–1,1 s, keine „lange Stille“).
3. **`factory/werk/hoercheck.py` (G4):**
   - eine Pflichtwortliste (Opportunitätskosten, Saison, keiner, Ablöse): Jede Ersetzung lässt das Tor scheitern, auch unter der WER-Schwelle;
   - Tempo je Satz für Schlüsselsätze (≤ 2,6 Wörter/s);
   - auf dem MP4 laufen, `--text` auch direkt annehmen;
   - Whisper nur als Grob-Tor, für Cues die Energie-Probe `pruefe_einsaetze` aus `build/voice.py`.
4. **`docs/VIDEO-PIPELINE.md` §6:**
   - G6-Kandidaten: `build/messen-bild.mjs` (Bildanteil, Lesefenster, effektive Schriftgröße, Kollisionen an Textzeilen) und das Cue-Tor in `build/bauen.mjs`;
   - G7-Kandidaten: `build/flackern.py` und `build/seek-test.mjs` (Änderungs-Rechteck).
5. **`tools/setup-umgebung.sh`:** das Paket `onnx` (bzw. `piper-tts[alignment]`) in die Werkstatt-venv aufnehmen und `SETUP_VERSION` hochzählen.
6. **`CLAUDE.md` „Stil“:** auf `studio/DESIGN.md` verweisen (Kartentöne, Geist, beleuchtete Gegenstände).

`studio/DESIGN.md` habe ich selbst ergänzt (erlaubt):
- Schrift auf Gegenständen ≥ 48 px effektiv; € auf Münzen als Form;
- Neigung nur mit Ursache; Drehung bei stehender Kamera in einer Atempause; Morph Geist → echt erst auf der neuen Seite; höchstens eine Bedeutungsänderung je Sekunde;
- Durchstrich nur auf das falsche Wort, Korrektur als Ergänzung;
- Kategorie mit Beispiel und deckende Gegenstände im Diagramm;
- beleuchtete Gegenstände im Atlas; Route nur, solange etwas fließt, in der Farbe dessen, was fließt; Ortspunkt geht unter einem Gegenstand; Zahl im Geist-Stil und zweizeiliges Etikett;
- BANNED 20–23.
