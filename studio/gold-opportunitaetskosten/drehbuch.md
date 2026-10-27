# Drehbuch: Opportunitätskosten – Warum verkauft Bayern seinen besten Stürmer?

Goldstandard, Phase 1 (`docs/VIDEO-PIPELINE.md` §9). Stand 27.10.2026, Chefredaktion.
Sprechtext und Cues stehen maschinenlesbar in `build/script.py`, Belege in `fakten.json`. Gestaltungsregeln: `studio/DESIGN.md`.

## Steckbrief

| Feld | Wert |
|---|---|
| id | `gold-opportunitaetskosten` |
| Serie | `opportunitaetskosten`, Teil 1 |
| Kanal | Wirtschaft & Märkte; für den Bruder WR-Transfer zum Priming „Warum sind Opportunitätskosten Kosten, obwohl man sie nie bezahlt?“ |
| Zielgruppe | `beide`, ein Zielniveau: Jeder Satz ist für Klasse 10 verständlich, keiner ist für Linus durch Vereinfachung falsch (siehe „Genauigkeit“) |
| Bogen | **Irrtum → Widerlegung** |
| Identität | Atlas für den Fall (Beats 1–8), nach einem Schnitt Diagramm für Modell, Transfer und Satz (Beats 9–12) |
| Irrtum der Serie | „Kosten ist nur, was man bezahlt.“ Im Video die Antwort „Nur sein Gehalt“ |
| Länge | 138 Wörter in 11 Szenen (höchstens 19 je Szene); 64,6 s bei 2,3 Wörtern/s (57,6 s bei 2,6; 73,5 s bei 2,0) |
| Pausen aus Code | Denkpause 2,2 s nach der Frage (`pause_for_answer`), Halten 2,0 s am Ende; alle anderen Pausen macht die Stimme |
| Satz fürs Gespräch = Satz für die Stunde | „Was du aufgibst, ist auch ein Preis. Er steht nur auf keiner Rechnung.“ |

## Warum dieser Bogen

- **Das Priming nennt den Irrtum schon.** „Kosten, obwohl man sie nie bezahlt“ heißt: Der Bruder kommt mit der Vorstellung „nur Bezahltes kostet“. Ein Widerlegungstext setzt genau dort an (Muller 2008, d = 0,83).
- **Der Irrtum trägt das ganze Video, statt angehängt zu sein.** In der alten Probe kam „Man denkt: Was nichts kostet, ist gratis“ erst nach der Kurve. Hier zeigt die Waage den Irrtum (sie kippt Richtung Behalten) und widerlegt ihn (sie kippt zurück, als das Geld landet).
- **Reihenfolge** nach §5 mit der Korrektur der Gutachter (Frage zuerst, der Irrtum erst danach):
  Frage → Naheliegend → Gegenbefund → „Das stimmt nicht, weil …“ → Begriff → Auflösung des Falls → Modell → Transfer → Satz.
  Begriff, Auflösung und Satz sind eingeschobene Beats; die Bogen-Prüfung in G0 muss sie hier zulassen.
- **Nicht gewählt:**
  - *Fall → Prinzip* war die alte Probe; der Vergleich soll einen Unterschied zeigen.
  - *Gabelung* zeigt die Wahl, aber die Kosten liegen auf dem Weg, der nicht gegangen wird, also außerhalb des Bildes. Genau das ist der Irrtum.

## Warum eine Waage

| Modell | trägt | fehlt |
|---|---|---|
| Tauschkurve | stetige Abwägung (mehr vom einen, weniger vom anderen) | Hier gibt es nur zwei Möglichkeiten. In der alten Probe stand sie 4,9 s und blieb abstrakt |
| Gabelung | die Entscheidung als Weg | Die aufgegebene Möglichkeit verschwindet aus dem Bild |
| **Waage** | Bezahltes Gehalt und nicht bekommenes Geld liegen **auf derselben Schale**. Das ist wörtlich die Antwort auf die Priming-Frage | – |

- Die Waage zeigt den Irrtum und seine Widerlegung als Bewegung: Sie kippt zum Behalten und dann zurück.
- Sie trägt den Transfer unverändert: Kinokarte gegen Lohn.
- Sie steht in der Welt, in München, wo entschieden wird; das Geld fliegt in Flussrichtung der Ablöse hinein.
- **Neigung zeigt nur die Richtung, nie ein Verhältnis.** Immer derselbe Winkel (Vorschlag 7°), denn weder das Gehalt (nicht belegt) noch der Wert einer Saison in Euro steht im Video.

## Genauigkeit (für Linus geprüft)

- **Kosten des Behaltens = Gehalt (bezahlt) + entgangene Ablöse (aufgegeben).** Darum ist „Gehalt + Ablöse“ richtig und „Nur sein Gehalt“ der Irrtum.
- **Warum die ganze Ablöse zählt:** Nach dem 30.06.2023 hätte Bayern 0 € bekommen. Ohne diese Bedingung wären die Opportunitätskosten eines Jahres nur die Differenz zwischen Ablöse heute und Ablöse später. Darum stehen Vertragsende und „Verlängern will er nicht“ im Video.
- **Keine Alleinursache.** Das Video sagt nicht „Bayern verkaufte nur deshalb“, sondern „Im Juli 2022 nimmt Bayern das Geld“ (offenbarte Präferenz). Lewandowskis Wechselwunsch steckt in „Verlängern will er nicht“.
- **Auch Verkaufen hat Opportunitätskosten:** eine Saison Lewandowski. Das verhindert die falsche Lehre „Verkaufen kostet nichts“.
- **„Entgangenes Geld fehlt genauso wie ausgegebenes“** gilt im Vergleich der Möglichkeiten: Mit Behalten steht Bayern um 45 Mio. € schlechter da als mit Verkaufen, genau wie nach einer Zahlung von 45 Mio. €.
- **Nach der Entscheidung** ist das Geld Einnahme, nicht mehr Opportunitätskosten. Darum verschwindet der Begriff vom Stapel, sobald Bayern das Geld nimmt (Beat 8).
- **Die 344 Tore bleiben draußen.** Sie sind Trivia nach dem Entfern-Test. Außerdem gehören vergangene Tore nicht auf eine Waage, die über die nächste Saison entscheidet (versunkener Nutzen). Belegt sind sie trotzdem (`nv_tore`: 344 Tore in 375 Pflichtspielen, alle Wettbewerbe; davon 238 in der Bundesliga).
- **Definition** nach Gabler (Autor J. Weber, WHU): „entgangene Erträge oder Nutzen im Vergleich zur besten, nicht realisierten Handlungsalternative“.

## Welt, Kamera, Darsteller (Kamera-Vertrag)

**Welt (Beats 1–8):** Europakarte nach DESIGN.md §7 Atlas (Natural Earth, Lambert konform-konisch). Orte München und Barcelona. **Genau eine Region leuchtet: Deutschland**, ab Bild 0 bis Beat 8 (Bayern entscheidet). Spanien leuchtet nie; Barcelona ist durch Punkt, Namen und Münzstapel markiert.

**Welt (Beats 9–12):** Rasterpapier nach DESIGN.md §7 Diagramm. Die Karte kommt nicht zurück; zwei Identitäten stehen nie im selben Bild.

| Einstellung | Bild | Zoom (Vorschlag) | Beats |
|---|---|---|---|
| `totale:europa` | Deutschland bis Iberien. München im oberen Drittel, Barcelona links in der Mitte, unten freies Mittelmeer für die Antwort-Schilder | 1,0 (50m) | 1–3 |
| `nah:muenchen` | München mit Waage im mittleren Drittel, Vertragsband rechts daneben | ≈ 3 (10m) | 3–5 |
| `halbnah:route` | München mit Waage oben rechts, Barcelona unten links, Route diagonal; die Flugbahn bleibt frei von Text | ≈ 1,6 (50m) | 5–8 |
| `diagramm:waage` | Rasterpapier bis an alle Ränder, Waage ≥ 691 px breit in der Mitte des Lesefensters | – | 9–12 |

**Kamerapfad:** `["totale:europa", "nah:muenchen", "halbnah:route", "schnitt:diagramm:waage"]`
- Zoom-in auf „Naheliegend“ (Detail: hier wird entschieden).
- Zoom-out auf „Barcelona“ in Beat 5: Überblick, die Kamera folgt dabei keinem Darsteller.
- Schnitt auf das Nomen „Waage“ in Beat 9: neues Thema, jede Entscheidung.
- Ergebnis: 2 Fahrten, 1 harter Schnitt bei 11 Nähten (Grenze ⅓). Bei beiden Flügen steht die Kamera; so zählt nur der Darsteller als Bewegung.

**Darsteller „geld“** (Münzstapel, Gold, beleuchtet, ≥ 288 px): bedeutet die ganze Zeit **die Ablöse aus Barcelona** und wechselt nie die Form.
- fällt auf Barcelona (`bcn`) und trägt ab `zahl` das Etikett „45 Mio. €“;
- fliegt Barcelona → München (Flussrichtung der Ablöse) und landet auf der Kosten-Schale (`landung`);
- bleibt in der Welt zurück. Nach dem Schnitt tritt er nicht mehr auf: Die Lohntüte im Transfer ist ein anderer Gegenstand.

**Figur „spieler“** (Freisteller-Foto im Duoton aus Wikimedia Commons, mit Credit „Foto: Urheber, Wikimedia Commons, Jahr“; Rückfall: Namensschild „Lewandowski“; nie ein KI-Bild):
- fällt auf München (`lewa`), steigt auf die Nutzen-Schale (`tore`);
- fliegt München → Barcelona (Flussrichtung des Spielers) und landet auf `landung_spieler`.

**Gegenstand „waage“** (Atlas-Objekt, Balkenwaage in Navy-Fläche mit Creme-Lichtkante, Schlagschatten, eigene Zeichnung, kein Icon): steht in München.
- Kosten-Schale links (Richtung Barcelona, dort landet das Geld), Nutzen-Schale rechts.
- Neigung: rechts auf `tore`, links auf `landung`, ganz links auf `genommen`.
- Im Diagramm-Teil dieselbe Form als Strichzeichnung.

**Physik** (Werte aus DESIGN.md §5): Fallen 0,42 s, Flug 1,7 s (Abflug = Landung − 1,7 s, der Bau rechnet zurück), Ruhe nach jedem Aufsetzen ≥ 1,2 s.

Geschätzte Ruhezeiten bei 2,3 Wörtern/s:

| Was | Landung | nächste Bewegung | Ruhe |
|---|---|---|---|
| Geld in Barcelona | 0,3 s | Abflug 26,5 s | 26,2 s |
| Zahl „45 Mio. €“ | 21,7 s | Abflug 26,5 s | 4,8 s |
| Geld auf der Kosten-Schale | 28,2 s | – | bis Schnitt |
| Spieler in Barcelona | 41,7 s | Schnitt 44,7 s | 3,0 s |

## Drehbuch

Sprechtext: `{cue}` steht vor dem Wort, auf das ein Bild landet; `Anzeige|Gesprochen` trennt Bildschirm und Stimme. Zeiten sind Schätzungen bei 2,3 Wörtern/s; die echten Cue-Zeiten kommen aus `assets/timing.json`.

| # | Beat | Sprechtext | Held / Bild | Kamera | Marker | HUD-Text | Ziel-Dauer |
|---|---|---|---|---|---|---|---|
| 1 | Frage | {bcn}Barcelona\|Barsselona will {lewa}Lewandowski. Bayern kann {verkaufen}verkaufen oder {behalten}behalten. Was {frage}kostet es, ihn zu {optionen}behalten? | Karte, Deutschland leuchtet, München-Punkt ab Bild 0. `bcn`: Barcelona-Punkt, Münzstapel fällt auf Barcelona (ohne Zahl). `lewa`: Spieler-Figur fällt auf München. `verkaufen`: Route zeichnet sich München → Barcelona (Weg des Spielers). `optionen`: drei Preisschilder hängen sich nacheinander an die Figur | `totale:europa`, steht | `behalten`: Kreis Creme um die Figur. `frage`: Unterstreichung Creme unter „kostet“ | ab Bild 0: „Was kostet Behalten?“ (D2), „Sommer 2022“ (T). Orte „München“, „Barcelona“. Schilder: „Nur sein Gehalt“ · „Gehalt + Ablöse“ · „Gar nichts extra“. Credit „Karte: Natural Earth“ | 6,4 s (0,0–6,4) |
| 2 | Denkpause | – (2,2 s Stille; `pause_for_answer`: Die App hält an, Tipp und Konfidenz) | wie Beat 1, nichts bewegt sich | steht | – | wie Beat 1 | 2,2 s (6,4–8,6) |
| 3 | Naheliegend | {waage}Naheliegend ist: nur sein {gehalt}Gehalt. Dafür bekommt Bayern seine {tore}Tore. | `waage`: zwei Schilder treten ab, dann Zoom, dann richtet sich die Waage bei München auf. `gehalt`: Gehalt-Beleg (Creme-Papier) fällt auf die Kosten-Schale. `tore`: Figur steigt auf die Nutzen-Schale, die Waage neigt sich nach rechts | Zoom-in → `nah:muenchen` (1,4 s ab `waage`), steht ab `gehalt` | `gehalt`: Unterstreichung Creme unter „Nur sein Gehalt“ | „Nur sein Gehalt“ (T, oben links, ab jetzt die Behauptung); „Kosten“, „Nutzen“ an den Schalen; „Gehalt“ auf dem Beleg; „Tore“ an der Figur | 4,4 s (8,6–13,0) |
| 4 | Gegenbefund: Vertrag | Doch sein {vertrag}Vertrag läuft nur bis Juni {juni}2023\|zweitausenddreiundzwanzig. Verlängern will er {verlaengern}nicht. Danach kann er {frei}ablösefrei gehen. | `vertrag`: Vertragsband (Creme) unter der Waage läuft in 1,0 s gleichmäßig bis zu seinem Ende ab und steht dann. `verlaengern`: gestrichelte Verlängerung hinter dem Ende erlischt. `frei`: am Bandende „0 € Ablöse“ | `nah:muenchen`, steht | `juni`: Kreis Creme um „30.06.2023“ | „Vertrag bis 30.06.2023“, „verlängern“ (gestrichelt), „0 € Ablöse“. Credit „Vertrag: H. Salihamidžić bei Sky, t-online/dpa, 14.05.2022“ · „ablösefrei: bpb, Bosman-Urteil“ | 7,4 s (13,0–20,4) |
| 5 | Gegenbefund: Angebot | {angebot}Barcelona\|Barsselona bietet jetzt {zahl}45\|fünfundvierzig Millionen Euro. | Münzstapel in Barcelona. `zahl`: „45 Mio. €“ setzt sich neben den Stapel; der Stapel behält seine Form | Zoom-out → `halbnah:route` (1,4 s ab `angebot`), steht ab `zahl` | `zahl`: Unterstreichung Gold unter „45 Mio. €“ | „45 Mio. €“ (D1, Gold). Credit „Ablöse: FC Barcelona, 19.07.2022, dazu bis zu 5 Mio. € Bonus“ | 2,6 s (20,4–23,0) |
| 6 | Widerlegung (einziges Rot) | Nur das Gehalt? Das stimmt {falsch}nicht. Wer ihn behält, verzichtet auf dieses {landung}Geld. {entgangen}Entgangenes Geld fehlt genauso wie {ausgegeben}ausgegebenes. | Stapel mit „45 Mio. €“ fliegt Barcelona → München und landet auf `landung` neben dem Gehalt-Beleg. Die Waage kippt nach links und federt aus. `entgangen`: Etikett „entgangen“ (Gold) am Stapel. `ausgegeben`: Etikett „bezahlt“ (Creme) am Beleg | `halbnah:route`, steht (Flug im ruhenden Bild) | `falsch`: Durchstrich **Rot** über „Nur sein Gehalt“ | „Nur sein Gehalt“ durchgestrichen; „entgangen“, „bezahlt“ | 8,3 s (23,0–31,3) |
| 7 | Begriff | Ökonomen nennen das {begriff}Opportunitätskosten. Das ist der Wert der besten {alternative}Alternative, die du {aufgibst}aufgibst. | Behauptung samt Durchstrich tritt ab. `begriff`: Begriff erscheint am Stapel. `aufgibst`: „entgangen“ wird zu „aufgegeben“ (Morph, gleiche Bedeutung) | `halbnah:route`, steht | `begriff`: Kreis Gold um den Stapel | „Opportunitäts-kosten“ (D2, Creme, zweizeilig); „beste Alternative“ (T); „aufgegeben“. Credit „Definition: Gabler Wirtschaftslexikon, 19.02.2018“ | 6,1 s (31,3–37,4) |
| 8 | Auflösung | Im {juli}Juli 2022\|zweitausendzweiundzwanzig nimmt Bayern das {genommen}Geld. Der {preis}Preis: eine {landung_spieler}Saison Lewandowski. | `genommen`: Begriff und Kreis treten ab, die Waage kippt ganz nach links. Figur hebt ab (Landung − 1,7 s), fliegt München → Barcelona, landet auf `landung_spieler`. Die Nutzen-Schale bleibt leer | `halbnah:route`, steht | – (die Bewegung ist das Zeichen) | `juli`: Dateline wird „Juli 2022“. `preis`: „Preis: 1 Saison“ (Creme) an der leeren Schale. Credit „Wechsel: FC Barcelona, 19.07.2022“ | 5,2 s (37,4–42,6) |
| 9 | Modell | Jede Entscheidung hat so eine {modell}Waage. | **Schnitt** auf `modell`: dieselbe Waage als Strichzeichnung auf Rasterpapier, leer und waagerecht. Kosten-Schale mit zwei Fächern: „bezahlt“ (Creme) und „aufgegeben“ (Gold-Rand, leer) | `diagramm:waage`, steht bis zum Ende | – | „Kosten = bezahlt + aufgegeben“ · „Nutzen“ (T; bleiben bis zum Ende stehen) | 2,6 s (42,6–45,2) |
| 10 | Transfer | Ein Freund schenkt dir eine {karte}Kinokarte. Stattdessen könntest du mit {nachhilfe}Nachhilfe Geld {lohn_da}verdienen. | `karte`: Kinokarte (Creme-Strich) fällt auf die Nutzen-Schale; Fach „bezahlt“ bleibt leer; die Waage neigt sich nach rechts. `nachhilfe`: Wort „Nachhilfe“ rastet neben der Waage ein. `lohn_da`: darunter zeichnet sich eine Lohntüte (Gold-Strich) | steht | – | „Kino“, „geschenkt“ (am leeren Fach), „Nachhilfe“, „Lohn“ | 5,7 s (45,2–50,9) |
| 11 | Transfer: Preis | Dann kostet dich das Kino diesen {lohn}Lohn. Kann sich {lohnen}lohnen. {gratis}Gratis ist es nicht. | `lohn`: Lohntüte wandert ins Fach „aufgegeben“, die Waage schwingt zurück. `lohnen`: sie pendelt aus und bleibt **waagerecht** (die Wahl bleibt offen, kein Rat). `gratis`: „geschenkt“ bekommt „≠ gratis“ | steht | `lohn`: Kreis Gold um die Lohntüte | „geschenkt ≠ gratis“ | 6,1 s (50,9–57,0) |
| 12 | Satz | Was du {aufgeben}aufgibst, ist auch ein {preis2}Preis. Er steht nur auf keiner {rechnung}Rechnung. | Waage aus Beat 11 bleibt. `rechnung`: Eine Klammer „Rechnung“ (Creme) umfasst nur das Fach „bezahlt“; das Gold-Fach liegt außerhalb | steht | `aufgeben`: Unterstreichung Gold unter „aufgegeben“ | Etikett „Satz fürs Gespräch“ (Linus) bzw. „Satz für die Stunde“ (Bruder). `preis2`: „Aufgeben = Preis“ (D2). Der ganze Satz steht nur im Info-Blatt der Karte (BANNED 4) | 5,7 s + 2,0 s Halten (57,0–64,6) |

**Antworten im Bild (Beat 1–2):** Vorschlag Preisschilder an der Spieler-Figur, weil die Frage lautet, was etwas kostet. Keine Pillen-Chips, keine Aufzählung, keine „01/02“-Labels (DESIGN.md BANNED 5 und 12). In der App kommen die Antwort-Tipps nativ aus der App-Zone. Reihenfolge im Bild: „Nur sein Gehalt“ (Irrtum der Serie), „Gehalt + Ablöse“ (richtig), „Gar nichts extra“; Längen 15/15/16 Zeichen.

**Kein Vorgriff:** Vor der Denkpause fallen weder „Ablöse“ noch „45“ im Ton oder als Text. Der Münzstapel ist im Hook schon da, aber ohne Zahl: Er zeigt, dass Barcelona Geld hat, nicht was Behalten kostet.

**Abweichung von DESIGN.md §9:** Die Hook-Schlagzeile steht nicht 2,5 s, sondern bis zum Ende der Denkpause (8,6 s), weil sie die Frage ist. Die Kamera steht in dieser Zeit.

## Farben

- **Gold** (gesuchte Größe, ein Gegenstand mit seiner Zahl):
  - Beats 1–8: Münzstapel, „45 Mio. €“, Kreis um den Stapel;
  - Beats 9–12: Fach „aufgegeben“ und Lohntüte.
- **Creme** (gegeben): Orte, Gehalt-Beleg, Vertragsband, „0 € Ablöse“, „Preis: 1 Saison“, Kinokarte, Klammer „Rechnung“.
- **Rot** (Irrtum) genau einmal: Durchstrich über „Nur sein Gehalt“ in Beat 6, mit zweitem Merkmal (Durchstrich). „0 € Ablöse“ und „Gratis ist es nicht“ bleiben bewusst Creme.

## Stimme

- Ganzes Skript in einem Request (§4). Code setzt nur die Denkpause (2,2 s) und das Halten (2,0 s).
- **Betonung** (`betont` in `build/script.py`; bei ElevenLabs v4 als Großbuchstaben):
  - Beat 1: „verkaufen“, „behalten“, „kostet“;
  - Beat 6: „nicht“, „verzichtet“, „genauso“;
  - Beat 12: „Preis“, „keiner“.
- **Fragen steigen an:** „Was kostet es, ihn zu behalten?“ und „Nur das Gehalt?“.
- **Tempo:** Ziel 2,3 Wörter/s. Bei 2,0 Wörtern/s wird das Video 73,5 s lang, noch unter 75 s.
- **Aussprache:**
  - `Barcelona|Barsselona` stammt aus dem Piper-Hör-Check der alten Probe. Mit der Siegerstimme zuerst ohne Umschreibung hören; klingt es dann falsch, gehört der Eintrag ins Lexikon der Stimme (`voices/<id>.json`).
  - Hör-Check besonders für „Lewandowski“, „Opportunitätskosten“ und „ablösefrei“.

## Abruffragen und 7-Tage-Messfrage

Ablenker etwa gleich lang, Antwortposition gemischt (0, 2, 1, 0). Keine Frage nach Trivia.

| Art | Frage | Optionen (Zeichen) | richtig |
|---|---|---|---|
| fakt | Was hätte Bayern bekommen, wenn Lewandowski bis zum Vertragsende 2023 geblieben wäre? | „Gar keine Ablöse“ (16) · „45 Mio. € Ablöse“ (16) · „50 Mio. € Ablöse“ (16) | 0 |
| fakt | Was kostete es Bayern, Lewandowski noch eine Saison zu behalten? | „Nur sein Gehalt“ (15) · „Gar nichts extra“ (16) · „Gehalt + 45 Mio. €“ (18) | 2 |
| transfer | Samstag: Du könntest beim Nachbarn für Lohn Rasen mähen. Du gehst stattdessen kicken. Was kostet dich das Kicken? | „Nichts, Kicken ist gratis“ (25) · „Den Lohn fürs Rasenmähen“ (24) · „Die Schuhe, die du hast“ (23) | 1 |
| 7-Tage (nie geübt) | Deiner Familie gehört eine Garage. Ein Nachbar würde sie mieten. Ihr stellt dort eure Fahrräder ab. Was kostet euch das? | „Die Miete, die euch entgeht“ (27) · „Nichts, sie gehört euch ja“ (26) · „Den Wert eurer Fahrräder“ (24) | 0 |

```json
{"retrieval": [
  {"q": "Was hätte Bayern bekommen, wenn Lewandowski bis zum Vertragsende 2023 geblieben wäre?", "kind": "fakt",
   "options": ["Gar keine Ablöse", "45 Mio. € Ablöse", "50 Mio. € Ablöse"], "answer": 0},
  {"q": "Was kostete es Bayern, Lewandowski noch eine Saison zu behalten?", "kind": "fakt",
   "options": ["Nur sein Gehalt", "Gar nichts extra", "Gehalt + 45 Mio. €"], "answer": 2},
  {"q": "Samstag: Du könntest beim Nachbarn für Lohn Rasen mähen. Du gehst stattdessen kicken. Was kostet dich das Kicken?", "kind": "transfer",
   "options": ["Nichts, Kicken ist gratis", "Den Lohn fürs Rasenmähen", "Die Schuhe, die du hast"], "answer": 1}],
 "probe": [
  {"q": "Deiner Familie gehört eine Garage. Ein Nachbar würde sie mieten. Ihr stellt dort eure Fahrräder ab. Was kostet euch das?",
   "options": ["Die Miete, die euch entgeht", "Nichts, sie gehört euch ja", "Den Wert eurer Fahrräder"], "answer": 0}]}
```

- Die zweite Frage ist die Hook-Frage mit Zahl: Vortest im Video, Abruf danach.
- „50 Mio. €“ ist ein Ablenker aus der Bonus-Angabe (45 + 5). Die Abruffrage zeigt die Zahl nur als falsche Option; sie steht als Beleg in `abl`.
- Die Messfrage wechselt den Gegenstand (Besitz statt Zeit) und wird nie geübt.
- **Konfidenz:** Die App fragt nach dem Antwort-Tipp in Beat 2 „sicher / unsicher“, bevor das Video weiterläuft (Hyperkorrektur braucht die Sicherheit vor der Auflösung).

## Fakten im Video

Jede Zahl in Bild und Ton steht in `fakten.json` (geprüft am 27.10.2026 per WebFetch, Zitat aus der Quelle).

| Fakt-ID | Beat | im Ton | im Bild |
|---|---|---|---|
| `datum` | 1, 8 | „Juli 2022“ | „Sommer 2022“, „Juli 2022“, Credit 19.07.2022 |
| `dilemma`, `behalten` | 1 | „Bayern kann verkaufen oder behalten“ | – |
| `vertrag` | 4 | „Juni 2023“ | „30.06.2023“, Credit 14.05.2022 |
| `verlaengern` | 4 | „Verlängern will er nicht“ | „verlängern“ (erlischt) |
| `frei` | 4 | „ablösefrei“ | „0 € Ablöse“ |
| `abl`, `abl2` | 5, 6 | „45 Millionen Euro“ | „45 Mio. €“, Credit „dazu bis zu 5 Mio. € Bonus“ |
| `begriff` | 7 | Definition | „beste Alternative“, „aufgegeben“ |
| `saison` | 8 | „eine Saison“ | „Preis: 1 Saison“ |
| `nachhilfe` | 10 | Nachhilfe als Verdienst eines 15-Jährigen | – |
| `nv_tore`, `nv_tore_bl` | – | **nicht im Video** (Trivia, versunkener Nutzen) | – |

- **Ablöse:** fest 45 Mio. €, variabel bis zu 5 Mio. €. Im Ton nur der feste Betrag, der Bonus steht im Credit.
- **Tore:** 344 Tore in 375 Spielen gelten für **alle Wettbewerbe**; in der Bundesliga waren es 238 Tore für Bayern (bundesliga.com).
- **Quellen-Zugang:** fcbayern.com antwortet mit 403, transfermarkt.de ist für WebFetch gesperrt. Deshalb tragen Pressemitteilung FC Barcelona, t-online/dpa und sport1 den Fall.
- **KindArbSchV:** `gesetze-im-internet.de` antwortete am 27.10. mit 503. Der Wortlaut „d) Nachhilfeunterricht,“ ist über die Spiegelung lxgesetze.de/kindarbschv/2 geprüft; G3 sollte die amtliche Seite erneut abrufen.

## Entfern-Test

| Zahl oder Bild | späterer Kausalschritt oder Abruffrage |
|---|---|
| Karte mit München und Barcelona | trägt beide Flüsse (Spieler, Ablöse) und ihre Richtung |
| Münzstapel | landet auf der Kosten-Schale und kippt die Waage (Beat 6) |
| Spieler-Figur | Nutzen-Schale; ihr Abflug ist der Preis des Verkaufens (Beat 8) |
| Vertragsband, „30.06.2023“, „0 € Ablöse“ | Grund, warum die ganze Ablöse zählt; Abruffrage 1 |
| „45 Mio. €“ | die Opportunitätskosten selbst; Abruffrage 2 |
| „Sommer 2022“, „Juli 2022“ | Zeitpunkt „jetzt 45 Mio., 2023 nichts“; Credit-Pflicht |
| „Preis: 1 Saison“ | Opportunitätskosten des Verkaufens; führt zum Satz |
| Diagramm-Waage, Kinokarte, Lohntüte | Transfer; Abruffrage 3 und Messfrage |
| 344 Tore | **gestrichen** |

## Was gegenüber der alten Probe anders ist

1. Der Irrtum steht vorne und wird als Bild widerlegt (Waage kippt), statt als Textkarte nach der Kurve.
2. Die Antwort auf die Priming-Frage steht im Bild: Gehalt und entgangenes Geld liegen auf derselben Schale.
3. Eine Welt, ein Darsteller: Das Geld ist ein Gegenstand und fliegt in die richtige Richtung, Barcelona → München.
4. Keine Trivia-Zahl im Hook. Die Frage steht ab Bild 0.
5. Auch Verkaufen hat einen Preis. Damit stimmt das Video auch auf Linus' Niveau.
6. Der Transfer lässt die Wahl offen („Kann sich lohnen“), statt zu predigen.
7. Kein Satz steht wortgleich im Bild; die alte Probe zeigte 4 von 8 Szenen als Sprechtext.

## Offen für Regie und Bau

- **Neue Teile ohne Vorbild im Spike:** Atlas-Waage mit Neigung, Preisschilder, Vertragsband und Diagramm-Waage. Alle vier sind Kandidaten für Module (fork-compare bzw. eine neue „waage“).
- **Platz in `halbnah:route`:** Die Waage samt 288-px-Stapel ist groß. Sie darf die Route und Barcelona nicht verdecken. Falls es nicht passt, steht die Waage in `nah:muenchen` und die Kamera folgt dem Geld per Fahrt (Barcelona → München, also in Flussrichtung).
- **Beat 5 ist knapp:** Der Zoom-out (1,4 s ab „Barcelona“) endet bei der geschätzten Zeit gerade auf „45“. Notfalls beginnt die Fahrt schon am Ende von Beat 4.
- **Dichteste Stelle:** Beat 6 hat 19 Wörter, den Flug und zwei Etiketten. Wird er im Bild zu voll, entfällt das Etikett „bezahlt“; „entgangen“ bleibt.
- **Satz-Etikett je Profil:** Entweder zwei MP4 mit verschiedenem Etikett, oder der Live-Player setzt es nach Profil.
- **Spieler-Foto:** Lizenz und Urheber aus Wikimedia Commons prüfen; ohne klare Lizenz das Namensschild.
