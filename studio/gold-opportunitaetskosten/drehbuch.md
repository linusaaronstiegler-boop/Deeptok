# Drehbuch: Opportunitätskosten – Was kostet es, Lewandowski zu behalten?

Goldstandard, Phase 1 (`docs/VIDEO-PIPELINE.md` §9). Stand 27.10.2026 abends, Chefredaktion, überarbeitet nach zwei Prüfungen (Didaktik, Fakten).
Sprechtext und Cues stehen maschinenlesbar in `build/script.py`, Belege in `fakten.json`. Gestaltungsregeln: `studio/DESIGN.md`.

## Steckbrief

| Feld | Wert |
|---|---|
| id | `gold-opportunitaetskosten` |
| Kartentitel | „Was kostet es, Lewandowski zu behalten?“ (gleich der Hook-Frage; verspricht keine Ursache, die das Video nicht nennt) |
| Serie | `opportunitaetskosten`, Teil 1 |
| Kanal | Wirtschaft & Märkte; für den Bruder WR-Transfer zum Priming „Warum sind Opportunitätskosten Kosten, obwohl man sie nie bezahlt?“ |
| Zielgruppe | `beide`, ein Zielniveau: Jeder Satz ist für Klasse 10 verständlich, keiner ist für Linus durch Vereinfachung falsch (siehe „Genauigkeit“ und „Info-Blatt“) |
| Bogen | **Irrtum → Widerlegung** |
| Identität | Atlas für den Fall (Beats 1–8), nach einem Schnitt Diagramm für Modell, Transfer und Satz (Beats 9–12) |
| Irrtum der Serie | „Kosten ist nur, was man bezahlt.“ Im Video die Antwort „Nur sein Gehalt“, mit Grund: „Denn nur das bezahlt Bayern.“ |
| Länge | 153 Wörter in 12 Szenen (höchstens 19 je Szene); 71,4 s bei 2,3 Wörtern/s (63,7 s bei 2,6; 81,3 s bei 2,0; Obergrenze 90 s) |
| Pausen aus Code | Denkpause 2,5 s nach der Frage (`pause_for_answer`), Halten 2,0 s am Ende; alle anderen Pausen macht die Stimme |
| Satz fürs Gespräch = Satz für die Stunde | „Auch was du aufgibst, kostet. Es steht nur auf keiner Rechnung.“ |

## Warum dieser Bogen

- **Das Priming nennt den Irrtum schon.** „Kosten, obwohl man sie nie bezahlt“ heißt: Der Bruder kommt mit der Vorstellung „nur Bezahltes kostet“. Ein Widerlegungstext setzt genau dort an (Muller et al. 2008, Widerlegung: d = 0,79; `docs/research/research-style.md`).
- **Der Irrtum trägt das ganze Video, statt angehängt zu sein.** In der alten Probe kam „Man denkt: Was nichts kostet, ist gratis“ erst nach der Kurve. Hier zeigt die Waage den Irrtum (sie neigt sich zum Behalten) und widerlegt ihn (sie schwingt auf waagerecht, als das Geld landet).
- **Die Widerlegung zeigt, statt zu behaupten:** Erst der Vergleich der beiden Ausgänge („Verkaufen bringt 45 Millionen Ablöse, Behalten keinen Cent“), dann der Schluss („Entgangenes Geld fehlt genauso wie bezahltes“).
- **Reihenfolge** nach §5 mit der Korrektur der Gutachter (Frage zuerst, der Irrtum erst danach):
  Frage → Naheliegend (mit Grund) → Gegenbefund → „Das stimmt nicht“ + Vergleich → Begriff → Auflösung des Falls → Modell → Transfer → Satz.
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

- Die Waage zeigt den Irrtum und seine Widerlegung als Bewegung: Sie neigt sich zum Behalten und schwingt dann auf waagerecht.
- Sie trägt den Transfer unverändert: Kinokarte gegen Lohn.
- Sie steht in der Welt, in München, wo entschieden wird; das Geld fliegt in Flussrichtung der Ablöse hinein.
- **Neigung zeigt nur die Richtung, nie ein Verhältnis.** Es gibt genau drei Lagen: rechts (7°), waagerecht, links (7°). Weder das Gehalt (nicht belegt) noch der Wert einer Saison in Euro steht im Video.
- **Die Waage fällt kein Urteil, das das Video nicht begründet.** Beim Landen des Geldes schwingt sie nur bis waagerecht: Behalten ist nicht mehr billig, entschieden ist noch nichts. Nach links neigt sie sich erst, als Bayern das Geld nimmt (Beat 8). Im Transfer bleibt sie waagerecht.

## Genauigkeit (für Linus geprüft)

- **Kosten des Behaltens = Gehalt (bezahlt) + entgangene Ablöse (aufgegeben).** Darum ist „Gehalt + Barças Geld“ richtig und „Nur sein Gehalt“ der Irrtum.
- **Warum die ganze Ablöse zählt:** Nach dem 30.06.2023 hätte Bayern 0 € bekommen. Ohne diese Bedingung wären die Opportunitätskosten einer Saison nur die Differenz zwischen Ablöse heute und Ablöse später. Darum stehen „nur noch eine Saison“, „Verlängern will er nicht“ und „Bayern bekommt nichts“ im Video.
- **„Behalten keinen Cent“** meint die Ablöse („Verkaufen bringt 45 Millionen Ablöse, Behalten keinen Cent“). Was eine Saison Lewandowski sonst einbringt, liegt auf der Nutzen-Schale („Dafür schießt er Tore“).
- **„Entgangenes Geld fehlt genauso wie bezahltes“** gilt im Vergleich der Möglichkeiten: Mit Behalten steht Bayern um 45 Mio. € schlechter da als mit Verkaufen, genau wie nach einer Zahlung von 45 Mio. €. Der Satz davor spricht diesen Vergleich aus.
- **Keine Alleinursache.** Das Video sagt nicht „Bayern verkaufte deshalb“, sondern „Im Juli nimmt Bayern das Geld“ (offenbarte Präferenz). Belegt ist: Kahn nannte die gebotene Summe als Grund (`kahn_summe`) und zugleich die Verpflichtung von Sadio Mané (`nv_mane`, nur im Info-Blatt). Lewandowskis Wechselwunsch steckt in „Verlängern will er nicht“.
- **Auch Verkaufen hat Opportunitätskosten:** eine Saison Lewandowski. Der Begriff wird damit sofort angewendet, und die falsche Lehre „Verkaufen kostet nichts“ hat keinen Platz.
- **Nach der Entscheidung** ist das Geld Einnahme, nicht mehr Opportunitätskosten. Darum verlässt das Etikett „Opportunitätskosten“ den Stapel und wandert an die leere Nutzen-Schale, sobald Bayern das Geld nimmt (Beat 8).
- **Brutto statt netto:** Genau genommen sind Opportunitätskosten der Nettowert der besten Alternative (eine Saison Lewandowski minus das gesparte Gehalt; Lohn minus Mühe). Für Klasse 10 ist die Bruttofassung Lehrbuchstandard; der Nettosatz steht im Info-Blatt für Linus.
- **Die 344 Tore bleiben draußen.** Sie sind Trivia nach dem Entfern-Test. Außerdem gehören vergangene Tore nicht auf eine Waage, die über die nächste Saison entscheidet (versunkener Nutzen). Belegt sind sie trotzdem (`nv_tore`: 344 Tore in 375 Pflichtspielen, alle Wettbewerbe; davon 238 in der Bundesliga).
- **Definition** nach Gabler (Autoren J. Weber, WHU, und D. Piekenbrock, DHBW; Revision 19.02.2018): „entgangene Erträge oder Nutzen im Vergleich zur besten, nicht realisierten Handlungsalternative“.

## Welt, Kamera, Darsteller (Kamera-Vertrag)

**Welt (Beats 1–8):** Europakarte nach DESIGN.md §7 Atlas (Natural Earth, Lambert konform-konisch). Orte München und Barcelona. **Genau eine Region leuchtet: Deutschland**, ab Bild 0 bis Beat 8 (Bayern entscheidet). Spanien leuchtet nie; Barcelona ist durch Punkt und Namen markiert, ab Beat 5 auch durch den Münzstapel.

**Welt (Beats 9–12):** Rasterpapier nach DESIGN.md §7 Diagramm. Die Karte kommt nicht zurück; zwei Identitäten stehen nie im selben Bild.

| Einstellung | Bild | Zoom (Vorschlag) | Beats |
|---|---|---|---|
| `totale:europa` | Deutschland bis Iberien. München im oberen Drittel, Barcelona links in der Mitte, unten freies Mittelmeer für die Antwort-Schilder | 1,0 (50m) | 1–3 |
| `nah:muenchen` | München mit Waage im mittleren Drittel, Vertragsband rechts daneben | ≈ 3 (10m) | 3–4 |
| `halbnah:route` | München mit Waage oben rechts, Barcelona unten links, Route diagonal; die Flugbahn bleibt frei von Text | ≈ 1,6 (50m) | 5–8 |
| `diagramm:waage` | Rasterpapier bis an alle Ränder, Waage ≥ 691 px breit in der Mitte des Lesefensters | – | 9–12 |

**Kamerapfad:** `["totale:europa", "nah:muenchen", "halbnah:route", "schnitt:diagramm:waage"]`
- Zoom-in auf „Naheliegend“ (Detail: hier wird entschieden).
- Zoom-out auf „Barcelona“ in Beat 5: Überblick, die Kamera folgt dabei keinem Darsteller. Die Texte von Beat 4 treten vorher ab.
- Schnitt auf das Nomen „Waage“ in Beat 9: neues Thema, jede Entscheidung.
- Ergebnis: 2 Fahrten, 1 harter Schnitt bei 12 Nähten (Grenze ⅓). Bei beiden Flügen und beim Fallen des Geldes steht die Kamera; so zählt nur der Darsteller als Bewegung.

**Darsteller „geld“** (Münzstapel, Gold, beleuchtet, ≥ 288 px): bedeutet die ganze Zeit **die Ablöse aus Barcelona** und wechselt nie die Form. **Vor der Denkpause ist er nicht im Bild**, denn Gold zeigt auf die gesuchte Größe und würde die Antwort verraten.
- fällt auf Barcelona auf dem Wort, das ihn nennt (`zahl`, „45“), und trägt ab dort das Etikett „45 Mio. €“;
- fliegt Barcelona → München (Flussrichtung der Ablöse) und landet auf der Kosten-Schale (`landung`, „Ablöse“);
- bleibt in der Welt zurück. Nach dem Schnitt tritt er nicht mehr auf: Die Lohntüte im Transfer ist ein anderer Gegenstand.

**Figur „spieler“** (Freisteller-Foto im Duoton aus Wikimedia Commons, mit Credit „Foto: Urheber, Wikimedia Commons, Jahr“; Rückfall: Namensschild „Lewandowski“; nie ein KI-Bild):
- fällt auf München (`lewa`), trägt die drei Preisschilder (`optionen`), steigt auf die Nutzen-Schale (`tore`);
- fliegt München → Barcelona (Flussrichtung des Spielers) und landet auf `landung_spieler` („Lewandowski“).

**Gegenstand „waage“** (Atlas-Objekt, Balkenwaage in Navy-Fläche mit Creme-Lichtkante, Schlagschatten, eigene Zeichnung, kein Icon): steht in München.
- Kosten-Schale links (Richtung Barcelona, dort landet das Geld), Nutzen-Schale rechts.
- Neigung: rechts auf `tore`, waagerecht auf `landung`, links auf `genommen`; immer 7°.
- Im Diagramm-Teil dieselbe Form als Strichzeichnung.

**Etikett „Opportunitätskosten“** (Creme, D2): erscheint am Stapel (`begriff`) und wandert in Beat 8 an die leere Nutzen-Schale (`ok_verkauf`, Morph: gleiche Bedeutung, andere Seite).

**Physik** (Werte aus DESIGN.md §5): Fallen 0,42 s, Flug 1,7 s (Abflug = Landung − 1,7 s, der Bau rechnet zurück), Ruhe nach jedem Aufsetzen ≥ 1,2 s.

Geschätzte Ruhezeiten bei 2,3 Wörtern/s (`python build/script.py --cues`):

| Was | Landung | nächste Bewegung | Ruhe |
|---|---|---|---|
| Spieler auf München | 1,6 s | Schritt auf die Nutzen-Schale 15,5 s | 13,9 s |
| Spieler auf der Nutzen-Schale | 15,5 s | Abflug 45,9 s | 30,4 s |
| Geld in Barcelona (fällt ab 25,9 s) | 26,3 s | Abflug 29,8 s | 3,5 s |
| Geld auf der Kosten-Schale | 31,5 s | neigt sich mit der Schale auf `genommen` 44,6 s | 13,1 s |
| Spieler in Barcelona | 47,6 s | Schnitt 50,2 s | 2,6 s |

## Drehbuch

Sprechtext: `{cue}` steht vor dem Wort, auf das ein Bild landet; `Anzeige|Gesprochen` trennt Bildschirm und Stimme. Zeiten sind Schätzungen bei 2,3 Wörtern/s; die echten Cue-Zeiten kommen aus `assets/timing.json`.

| # | Beat | Sprechtext | Held / Bild | Kamera | Marker | HUD-Text | Ziel-Dauer |
|---|---|---|---|---|---|---|---|
| 1 | Frage | {bcn}Barcelona\|Barsselona will {lewa}Lewandowski. Bayern kann {verkaufen}verkaufen oder {behalten}behalten. Was {frage}kostet es, ihn zu {optionen}behalten? | Karte, Deutschland leuchtet, München-Punkt ab Bild 0. `bcn`: Barcelona-Punkt setzt sich (Ort setzen), **kein Geld im Bild**. `lewa`: Spieler-Figur fällt auf München. `verkaufen`: Route zeichnet sich München → Barcelona (Weg des Spielers, Creme gepunktet). `optionen`: drei Preisschilder hängen sich nacheinander an die Figur | `totale:europa`, steht | `behalten`: Kreis Creme um die Figur. `frage`: Unterstreichung Creme unter „kostet“ | ab Bild 0: „Was kostet Behalten?“ (D2), „Sommer 2022“ (T). Orte „München“, „Barcelona“. Schilder: „Nur sein Gehalt“ · „Gehalt + Barças Geld“ · „Nichts, er ist ja da“. Credits „Karte: Natural Earth“ · „Lage: t-online/dpa, 14.05.2022“ | 6,4 s (0,0–6,4) |
| 2 | Denkpause | – (2,5 s Stille; `pause_for_answer`: Die App hält an, Tipp und Konfidenz) | wie Beat 1, nichts bewegt sich | steht | – | wie Beat 1 | 2,5 s (6,4–8,9) |
| 3 | Naheliegend | {waage}Naheliegend ist die Antwort: nur sein {gehalt}Gehalt. Denn nur das {bezahlt}bezahlt Bayern. Dafür schießt er {tore}Tore. | `waage`: alle drei Schilder treten ab, dann Zoom, dann richtet sich die Waage bei München auf. `gehalt`: Gehalt-Beleg (Creme-Papier) fällt auf die Kosten-Schale. `bezahlt`: Etikett „bezahlt“ am Beleg. `tore`: Figur steigt auf die Nutzen-Schale, die Waage neigt sich nach rechts | Zoom-in → `nah:muenchen` (1,4 s ab `waage`), steht ab 10,3 s | – | `gehalt`: „Nur sein Gehalt“ (T, oben links, ab jetzt die Behauptung, wortgleich mit dem Schild). „Kosten“, „Nutzen“ an den Schalen; „Gehalt“ auf dem Beleg; „bezahlt“; „Tore“ an der Figur (tritt auf `vertrag` ab) | 7,0 s (8,9–15,9) |
| 4 | Gegenbefund: Vertrag | Doch sein {vertrag}Vertrag läuft nur noch eine {saison}Saison. Verlängern will er {verlaengern}nicht. Danach geht er {frei}ablösefrei: Bayern bekommt nichts. | `vertrag`: Vertragsband (Creme) unter der Waage läuft in 1,0 s gleichmäßig bis zu seinem Ende ab und steht dann. `verlaengern`: gestrichelte Verlängerung hinter dem Ende erlischt. `frei`: am Bandende „ablösefrei: 0 €“ | `nah:muenchen`, steht | `saison`: Kreis Creme um „30.06.2023“ | „Vertrag bis 30.06.2023“, „verlängern“ (gestrichelt), „ablösefrei: 0 €“. Credits „Vertrag: H. Salihamidžić bei Sky, t-online/dpa, 14.05.2022“ · „ablösefrei: EuGH, Bosman-Urteil, 15.12.1995“ | 8,3 s (15,9–24,2) |
| 5 | Gegenbefund: Angebot | {angebot}Barcelona\|Barsselona bietet Bayern jetzt {zahl}45\|fünfundvierzig Millionen Euro. | `angebot`: Texte von Beat 4 treten ab, Zoom-out. `zahl`: Münzstapel (Gold, beleuchtet) fällt auf Barcelona, „45 Mio. €“ setzt sich +0,12 s daneben. Erst ab hier ist Gold im Bild | Zoom-out → `halbnah:route` (1,4 s ab `angebot`), steht ab 25,6 s | – | „45 Mio. €“ (D1, Gold). Credit „Ablöse: FC Barcelona, 19.07.2022 (+ 5 Mio. € variabel)“ | 3,0 s (24,2–27,2) |
| 6a | Widerlegung (einziges Rot) | Nur sein Gehalt? Das stimmt {falsch}nicht. Verkaufen bringt 45\|fünfundvierzig Millionen {landung}Ablöse, Behalten keinen Cent. | Stapel mit „45 Mio. €“ hebt ab (Landung − 1,7 s), fliegt Barcelona → München (Richtung der Ablöse) und landet auf `landung` auf der Kosten-Schale neben dem Beleg. Die Waage schwingt von rechts auf **waagerecht** und federt aus | `halbnah:route`, steht (Flug im ruhenden Bild) | `falsch`: Durchstrich **Rot** über „Nur sein Gehalt“ | „Nur sein Gehalt“ durchgestrichen | 6,1 s (27,2–33,3) |
| 6b | Widerlegung: Schluss | {entgangen}Entgangenes Geld fehlt genauso wie {korrektur}bezahltes. | `entgangen`: Etikett „entgangen“ (Gold) am Stapel, neben „bezahlt“ (Creme) am Beleg. `korrektur`: Das durchgestrichene Schild verwandelt sich in die richtige Antwort „Gehalt + Barças Geld“ (Morph: dasselbe Schild, korrigiert; der Durchstrich geht mit) | steht | – | „entgangen“ · „bezahlt“; oben links „Gehalt + Barças Geld“ | 2,6 s (33,3–35,9) |
| 7 | Begriff | Ökonomen nennen dieses Geld {begriff}Opportunitätskosten. Das ist der Wert der besten {alternative}Alternative, die man {aufgibt}aufgibt. | `begriff`: Schild oben links tritt ab, der Begriff erscheint am Stapel. `alternative`: „beste Alternative“ setzt sich darunter. `aufgibt`: „entgangen“ wird zu „aufgegeben“ (Morph, gleiche Bedeutung) | `halbnah:route`, steht | `begriff`: Kreis Gold um den Stapel | „Opportunitäts-kosten“ (D2, Creme, zweizeilig); „beste Alternative“ (T); „aufgegeben“. Credit „Definition: Gabler Wirtschaftslexikon, 19.02.2018“ | 6,5 s (35,9–42,4) |
| 8 | Auflösung | Im {juli}Juli nimmt Bayern das {genommen}Geld. Auch Verkaufen hat {ok_verkauf}Opportunitätskosten: eine Saison {landung_spieler}Lewandowski. | `genommen`: Kreis, „beste Alternative“ und „aufgegeben“ treten ab; die Waage neigt sich nach links (Bayerns Entscheidung). Die Figur hebt ab (Landung − 1,7 s, etwa auf `ok_verkauf`), fliegt München → Barcelona und landet auf `landung_spieler`. `ok_verkauf`: Das Etikett „Opportunitätskosten“ wandert vom Stapel an die leere Nutzen-Schale (Morph, Nebenbewegung zum Abflug) | `halbnah:route`, steht | – (die Bewegung ist das Zeichen) | `juli`: Dateline wird „Juli 2022“. `landung_spieler`: „1 Saison“ (Creme) unter dem Etikett. Credit „Wechsel: FC Barcelona, 19.07.2022“ | 5,7 s (42,4–48,1) |
| 9 | Modell | Jede Entscheidung hat so eine {modell}Waage. | **Schnitt** auf `modell`: dieselbe Waage als Strichzeichnung auf Rasterpapier, leer und waagerecht. Kosten-Schale mit zwei Fächern: „bezahlt“ (Creme) und „aufgegeben“ (Gold-Rand, leer) | `diagramm:waage`, steht bis zum Ende | – | „Kosten = bezahlt + aufgegeben“ · „Nutzen“ (T; bleiben bis zum Ende stehen) | 2,6 s (48,1–50,7) |
| 10 | Transfer | Du bekommst eine {karte}Kinokarte für heute Abend {geschenkt}geschenkt. Genau dann könntest du mit {nachhilfe}Nachhilfe {lohn_da}Geld verdienen. | `karte`: Kinokarte (Creme-Strich, Aufdruck „heute Abend“) fällt auf die Nutzen-Schale; die Waage neigt sich nach rechts. `geschenkt`: „geschenkt“ am leeren Fach „bezahlt“. `nachhilfe`: „Nachhilfe“ rastet neben der Kosten-Schale ein, mit derselben Zeitmarke „heute Abend“ (beides zugleich geht nicht). `lohn_da`: darunter zeichnet sich eine Lohntüte (Gold-Strich) | steht | – | „heute Abend“ (an Karte und Nachhilfe), „geschenkt“, „Nachhilfe“, „Lohn“ | 6,9 s (50,7–57,6) |
| 11 | Transfer: Kosten | Also kostet dich das Kino diesen {lohn}Lohn. Das kann es wert sein. {gratis}Gratis ist es nicht. | `lohn`: Lohntüte wandert ins Fach „aufgegeben“, die Waage schwingt zurück auf **waagerecht** und bleibt so (die Wahl bleibt offen, kein Rat). `gratis`: „geschenkt“ bekommt „≠ gratis“ | steht | `lohn`: Kreis Gold um die Lohntüte, sobald sie im Fach liegt | „geschenkt ≠ gratis“ | 7,0 s (57,6–64,6) |
| 12 | Satz | Auch was du {aufgeben}aufgibst, {kosten2}kostet. Es steht nur auf keiner {rechnung}Rechnung. | Waage aus Beat 11 bleibt. `rechnung`: Eine Klammer „Rechnung“ (Creme) umfasst nur das Fach „bezahlt“; das Gold-Fach liegt außerhalb | steht | `aufgeben`: Unterstreichung Gold unter „aufgegeben“ | Etikett „Satz fürs Gespräch“ (Linus) bzw. „Satz für die Stunde“ (Bruder). `kosten2`: „Aufgeben = Kosten“ (D2). Der ganze Satz steht nur im Info-Blatt der Karte (BANNED 4) | 4,8 s + 2,0 s Halten (64,6–71,4) |

**Antworten im Bild (Beat 1–2):** Preisschilder an der Spieler-Figur, weil die Frage lautet, was etwas kostet. Keine Pillen-Chips, keine Aufzählung, keine „01/02“-Labels (DESIGN.md BANNED 5 und 12). In der App kommen die Antwort-Tipps nativ aus der App-Zone.

| Schild | Zeichen | Rolle |
|---|---|---|
| „Nur sein Gehalt“ | 15 | Irrtum der Serie: nur Bezahltes kostet |
| „Gehalt + Barças Geld“ | 20 | richtig |
| „Nichts, er ist ja da“ | 20 | eigener zweiter Irrtum: Was man schon hat, kostet nichts (der Irrtum der alten Probe) |

- Die beiden Ablenker sind verschiedene Fehler. „Gar nichts extra“ aus dem ersten Entwurf las sich wie „Nur sein Gehalt“.
- Die richtige Option ist nicht mehr die längste. „Barças Geld“ statt „Ablöse“, weil das Fachwort ohne Fußball-Vorwissen unklar ist und dann so klingt, als zahle Bayern die Ablöse; „Barça“ schreibt auch die dpa-Quelle.
- „Nur“ bleibt im Irrtums-Schild: Der rote Durchstrich muss „nur“ treffen. Ein durchgestrichenes „Sein Gehalt“ würde lehren, das Gehalt sei keine Kosten.
- Wer „Nichts, er ist ja da“ tippt, sieht seine Antwort in Beat 3 widerlegt: Der Gehalt-Beleg fällt auf die Kosten-Schale („Denn nur das bezahlt Bayern“).
- Rückmeldung zur richtigen Antwort: In Beat 6b verwandelt sich das durchgestrichene Schild in „Gehalt + Barças Geld“.

**Vorgriff vor der Denkpause:** Im Ton fällt weder „Ablöse“ noch eine Zahl. Im Bild steht keine Zahl außer „Sommer 2022“, und es ist kein Geld und kein Gold zu sehen. Das Geld steht nur als Wort auf einem der drei Schilder, so wie jede richtige Antwort auf ihrem Schild steht. Der Münzstapel fällt erst in Beat 5.

**Abweichungen von DESIGN.md:**
1. §9: Die Hook-Schlagzeile steht nicht 2,5 s, sondern bis zum Ende der Denkpause (8,9 s), weil sie die Frage ist. Die Kamera steht in dieser Zeit.
2. §7 Atlas („Route gepunktet in Gold“): Die Route des Spielers ist Creme gepunktet. Gold vor der Denkpause zeigt auf die gesuchte Größe, und der Spieler ist hier nicht die gesuchte Größe. Vorschlag für DESIGN.md: Eine Route trägt die Farbe dessen, was auf ihr fließt.

## Farben

- **Gold** (gesuchte Größe, ein Gegenstand mit seiner Zahl), **erst ab Beat 5**:
  - Beats 5–8: Münzstapel, „45 Mio. €“, Etikett „entgangen“, Kreis um den Stapel;
  - Beats 9–12: Fach „aufgegeben“, Lohntüte, Kreis um die Lohntüte, Unterstreichung unter „aufgegeben“.
- **Creme** (gegeben): Orte, Route des Spielers, Preisschilder, Gehalt-Beleg, „bezahlt“, Vertragsband, „ablösefrei: 0 €“, „Opportunitätskosten“, „1 Saison“, Kinokarte, „heute Abend“, Klammer „Rechnung“.
- **Rot** (Irrtum) genau einmal: Durchstrich über „Nur sein Gehalt“ in Beat 6a, mit zweitem Merkmal (Durchstrich). „0 €“ und „Gratis ist es nicht“ bleiben bewusst Creme.

## Stimme

- Ganzes Skript in einem Request (§4). Code setzt nur die Denkpause (2,5 s) und das Halten (2,0 s).
- **Betonung** (`betont` in `build/script.py`; bei ElevenLabs v4 als Großbuchstaben). Kommt ein Wort mehrfach vor, gilt dieselbe Schreibweise wie bei Cues (`behalten#1`); die Selbstprüfung lehnt mehrdeutige Einträge ab.
  - Beat 1: „verkaufen“, das erste „behalten“, „kostet“;
  - Beat 3: „Gehalt“, „bezahlt“;
  - Beat 4: „eine“ (Saison), „nichts“;
  - Beat 6a: „nicht“, „Verkaufen“, „Behalten“ (Kontrast);
  - Beat 12: „aufgibst“, „keiner“.
- **Intonation:** „Was kostet es, ihn zu behalten?“ fällt am Ende, wie W-Fragen im Deutschen. Nur die Echo-Frage „Nur sein Gehalt?“ steigt (`steigt` in `build/script.py`). Ein Anstieg bei der W-Frage klänge nach Rückfrage oder Kinderansprache.
- **Tempo:** Ziel 2,3 Wörter/s. Bei 2,0 Wörtern/s wird das Video 81,3 s lang, unter der Obergrenze von 90 s.
- **Aussprache:**
  - `Barcelona|Barsselona` stammt aus dem Piper-Hör-Check der alten Probe. Mit der Siegerstimme zuerst ohne Umschreibung hören; klingt es dann falsch, gehört der Eintrag ins Lexikon der Stimme (`voices/<id>.json`).
  - Hör-Check besonders für „Lewandowski“, „Opportunitätskosten“, „ablösefrei“ und „Ökonomen“.

## Abruffragen und 7-Tage-Messfrage

Ablenker etwa gleich lang, Antwortposition gemischt (0, 2, 1, 2). Keine Frage nach Trivia. Die richtige Option wiederholt kein Schlüsselwort des Videos („entgangen“, „aufgegeben“), und jeder Ablenker ist ein Fehler, den man mit einem echten Irrtum wählt.

| Art | Frage | Optionen (Zeichen) | richtig |
|---|---|---|---|
| fakt | Welche Ablöse hätte Bayern bekommen, wenn Lewandowski bis zum Vertragsende 2023 geblieben wäre? | „Gar keine Ablöse“ (16) · „45 Mio. € Ablöse“ (16) · „50 Mio. € Ablöse“ (16) | 0 |
| fakt | Was hätte es Bayern gekostet, Lewandowski noch eine Saison zu behalten? | „Nichts, er war ja da“ (20) · „Nur sein Gehalt“ (15) · „Gehalt + Barças Geld“ (20) | 2 |
| transfer | Samstagnachmittag: Geburtstag, Spiel deines Vereins oder Freibad. Das Spiel wäre dir lieber als das Freibad. Du gehst zum Geburtstag. Was kostet dich das? | „Nichts, er ist ja gratis“ (24) · „Das Spiel deines Vereins“ (24) · „Spiel und Freibad zusammen“ (26) | 1 |
| 7-Tage (nie geübt) | Deiner Familie gehört eine Garage. Ein Nachbar würde sie für Geld mieten. Ihr stellt dort eure Fahrräder ab. Was kostet euch das? | „Nichts, sie gehört euch ja“ (26) · „Den Platz für eure Räder“ (24) · „Das Geld vom Nachbarn“ (21) | 2 |

```json
{"retrieval": [
  {"q": "Welche Ablöse hätte Bayern bekommen, wenn Lewandowski bis zum Vertragsende 2023 geblieben wäre?", "kind": "fakt",
   "options": ["Gar keine Ablöse", "45 Mio. € Ablöse", "50 Mio. € Ablöse"], "answer": 0},
  {"q": "Was hätte es Bayern gekostet, Lewandowski noch eine Saison zu behalten?", "kind": "fakt",
   "options": ["Nichts, er war ja da", "Nur sein Gehalt", "Gehalt + Barças Geld"], "answer": 2},
  {"q": "Samstagnachmittag: Geburtstag, Spiel deines Vereins oder Freibad. Das Spiel wäre dir lieber als das Freibad. Du gehst zum Geburtstag. Was kostet dich das?", "kind": "transfer",
   "options": ["Nichts, er ist ja gratis", "Das Spiel deines Vereins", "Spiel und Freibad zusammen"], "answer": 1}],
 "probe": [
  {"q": "Deiner Familie gehört eine Garage. Ein Nachbar würde sie für Geld mieten. Ihr stellt dort eure Fahrräder ab. Was kostet euch das?",
   "options": ["Nichts, sie gehört euch ja", "Den Platz für eure Räder", "Das Geld vom Nachbarn"], "answer": 2}]}
```

- Frage 1 fragt ausdrücklich nach der Ablöse; „eine Saison Lewandowski“ ist damit keine zweite richtige Antwort. „50 Mio. €“ ist ein Ablenker aus der Bonus-Angabe (45 + 5) und steht als Beleg in `abl`.
- Frage 2 ist die Hook-Frage im Konjunktiv (Bayern hat verkauft). Keine Option nennt eine Zahl, sonst wäre die einzige Zahl der Hinweis.
- Frage 3 prüft zwei Dinge, die die Lewandowski-Fälle nicht prüfen: eine Alternative, die kein Geld ist, und das Wort „beste“ aus der Definition. „Spiel und Freibad zusammen“ ist der bekannte Fehler, alle Alternativen zu addieren.
- Die Messfrage wechselt den Gegenstand (Besitz statt Zeit) und wird nie geübt. Kein Ablenker ist etwas Bezahltes (Kaufpreis, Versicherung), denn nach dem Modell „bezahlt + aufgegeben“ wäre er halb richtig.
- **Konfidenz:** Die App fragt nach dem Antwort-Tipp in Beat 2 „sicher / unsicher“, bevor das Video weiterläuft (Hyperkorrektur braucht die Sicherheit vor der Auflösung).
- **Freigabe:** Die Bewertung durch die Brüder läuft im Player mit Halt bei `pause_for_answer`, damit der Bruder einen echten Vortest hat. Das MP4 hat dafür die längste erlaubte Pause (2,5 s).

## Info-Blatt der Karte

Text unter dem Video, je Profil. Alle Angaben mit Beleg in `fakten.json`.

- **Satz für die Stunde, mit Fachwort (Bruder):** „Opportunitätskosten bezahlt man nicht, man gibt sie auf.“
- **Vertiefung (Linus):**
  1. Die ganze Ablöse zählt nur, weil der Vertrag 2023 endet. Ohne dieses Ende wären die Opportunitätskosten einer Saison nur die Differenz zwischen der Ablöse heute und der Ablöse ein Jahr später.
  2. Genau genommen zählt der Nettowert der besten Alternative: eine Saison Lewandowski minus das gesparte Gehalt, der Nachhilfe-Lohn minus die Mühe.
  3. Die Summe war ein Grund, nicht der einzige: Kahn nannte sie und die Verpflichtung von Sadio Mané (sport1, 16.07.2022).
- **Quellen:** FC Barcelona, 19.07.2022 · t-online/dpa, 14. und 15.05.2022 · sport1, 16.07.2022 · bpb Europalexikon (2020) · EuGH, Bosman-Urteil, 15.12.1995 · Gabler Wirtschaftslexikon, Revision 19.02.2018.

## Fakten im Video

Jede Zahl in Bild und Ton steht in `fakten.json` (geprüft am 27.10.2026 per WebFetch und curl, Zitat wörtlich aus der Quelle).

| Fakt-ID | Beat | im Ton | im Bild |
|---|---|---|---|
| `will`, `dilemma`, `behalten` | 1 | „Barcelona will Lewandowski“, „Bayern kann verkaufen oder behalten“ | Credit „Lage: t-online/dpa, 14.05.2022“ |
| `datum` | 1, 8 | „Juli“ | „Sommer 2022“, „Juli 2022“, Credit 19.07.2022 |
| `saison`, `vertrag` | 4, 8 | „nur noch eine Saison“, „eine Saison Lewandowski“ | „30.06.2023“, „1 Saison“, Credit 14.05.2022 |
| `verlaengern` | 4 | „Verlängern will er nicht“ | „verlängern“ (erlischt) |
| `frei`, `frei_urteil` | 4, 6a | „ablösefrei: Bayern bekommt nichts“, „Behalten keinen Cent“ | „ablösefrei: 0 €“, Credit „EuGH, Bosman-Urteil, 15.12.1995“ |
| `abl`, `abl2` | 5, 6a | „45 Millionen Euro“, „45 Millionen Ablöse“ | „45 Mio. €“, Credit „+ 5 Mio. € variabel“ |
| `begriff` | 7 | Definition | „beste Alternative“, „aufgegeben“, Credit 19.02.2018 |
| `kahn_summe` | 8 | „Im Juli nimmt Bayern das Geld“ | – (Info-Blatt) |
| `nachhilfe` | 10 | Nachhilfe gegen Geld (der Transfer-Fall ist realistisch) | – |
| `nv_mane` | – | **nicht im Video**, nur Info-Blatt | – |
| `nv_tore`, `nv_tore_bl` | – | **nicht im Video** (Trivia, versunkener Nutzen) | – |

- **Ablöse:** fest 45 Mio. €, variabel 5 Mio. € („€5 million in variables“); „bis zu“ steht erst in der Zweitquelle (Wikipedia). Im Ton nur der feste Betrag, der variable Teil steht im Credit, ohne „bis zu“.
- **Zweitquelle `abl2`:** Wikipedia als dauerhafter Link auf eine Fassung (oldid), weil der Host auf der Hostliste steht. Der frühere sport1-Vorab-Bericht nannte eine falsche Vertragslaufzeit und ist entfernt. Wikimedia antwortet ohne User-Agent mit einer Fehlerseite.
- **Tore:** 344 Tore in 375 Spielen gelten für **alle Wettbewerbe**; in der Bundesliga waren es 238 Tore für Bayern (bundesliga.com).
- **Quellen-Zugang:** fcbayern.com antwortet mit 403, transfermarkt.de ist für WebFetch gesperrt. Deshalb tragen Pressemitteilung FC Barcelona, t-online/dpa, sport1 und Wikipedia den Fall.
- **KindArbSchV:** Die amtliche Seite antwortete am 27.10. abends wieder (HTTP 200); der Wortlaut ist dort bestätigt. Der Fakt nennt die Bedingungen („in privaten Haushalten“, „leicht und für sie geeignet“). Das Video macht keine Rechtsaussage; der Fakt belegt nur, dass der Fall realistisch ist.

## Entfern-Test

| Zahl oder Bild | späterer Kausalschritt oder Abruffrage |
|---|---|
| Karte mit München und Barcelona | trägt beide Flüsse (Spieler, Ablöse) und ihre Richtung |
| Münzstapel | landet auf der Kosten-Schale und bringt die Waage auf waagerecht (Beat 6a) |
| Spieler-Figur | Nutzen-Schale; ihr Abflug sind die Opportunitätskosten des Verkaufens (Beat 8) |
| Vertragsband, „30.06.2023“, „ablösefrei: 0 €“ | Grund, warum die ganze Ablöse zählt; Abruffrage 1 |
| „45 Mio. €“ | die Opportunitätskosten selbst; Abruffrage 1 (Ablenker) |
| „Sommer 2022“, „Juli 2022“ | Zeitpunkt „jetzt 45 Mio., 2023 nichts“; Credit-Pflicht |
| „1 Saison“ | Opportunitätskosten des Verkaufens; führt zum Satz |
| Diagramm-Waage, Kinokarte, Lohntüte | Transfer; Abruffrage 3 und Messfrage |
| „heute Abend“ an Karte und Nachhilfe | Zeitkonflikt: Ohne ihn gäbe es nichts aufzugeben |
| 344 Tore | **gestrichen** |

## Was gegenüber der alten Probe anders ist

1. Der Irrtum steht vorne, mit seinem Grund, und wird als Bild widerlegt (die Waage schwingt), statt als Textkarte nach der Kurve.
2. Die Antwort auf die Priming-Frage steht im Bild: Gehalt und entgangenes Geld liegen auf derselben Schale.
3. Eine Welt, ein Darsteller: Das Geld ist ein Gegenstand und fliegt in die richtige Richtung, Barcelona → München.
4. Keine Trivia-Zahl im Hook. Die Frage steht ab Bild 0, und vor der Denkpause verrät kein Bild die Antwort.
5. Auch Verkaufen hat Opportunitätskosten. Damit stimmt das Video auch auf Linus' Niveau, und der Begriff wird sofort angewendet.
6. Der Transfer lässt die Wahl offen („Das kann es wert sein“), statt zu predigen.
7. Kein Satz steht wortgleich im Bild; die alte Probe zeigte 4 von 8 Szenen als Sprechtext.

## Änderungen nach der Prüfung (27.10.2026 abends)

- **Vortest:** kein Münzstapel vor der Pause (er fällt erst auf „45“); neuer zweiter Ablenker „Nichts, er ist ja da“; „Barças Geld“ statt „Ablöse“; Denkpause 2,5 s; Rückmeldung per Morph in Beat 6b.
- **Widerlegung:** Vergleich der Ausgänge statt Behauptung; Beat 6 in zwei Szenen geteilt; Paar „entgangen/bezahlt“.
- **Naheliegend** mit Grund („Denn nur das bezahlt Bayern“) und hörbar ohne Doppelpunkt („Naheliegend ist die Antwort: …“).
- **Zahlen im Ton:** „nur noch eine Saison“ statt „bis Juni 2023“, „Im Juli“ ohne Jahreszahl.
- **Begriff:** „dieses Geld“, „die man aufgibt“ (das „du“ erst im Transfer).
- **Auflösung:** „Auch Verkaufen hat Opportunitätskosten: eine Saison Lewandowski“, das Etikett wandert an die leere Schale; Neigung nur 7°, waagerecht beim Landen, links erst auf `genommen`.
- **Transfer:** Zeitkonflikt hörbar („für heute Abend“, „Genau dann“); „Das kann es wert sein“ statt „Kann sich lohnen“.
- **Satz:** „kostet“ statt „Preis“.
- **Abruffragen:** Frage 1 eindeutig, Frage 2 im Konjunktiv und ohne Zahl, Frage 3 ohne Geld und mit drei Alternativen, Messfrage ohne Stichwort-Hinweis.
- **Fakten:** neue Fakten `will`, `kahn_summe`, `frei_urteil`, `nv_mane`; `abl2` auf Wikipedia; `dilemma` und `saison` wörtlich; `nachhilfe` mit Bedingungen; Bosman-Credit mit Datum; Gabler mit beiden Autoren; Muller d = 0,79.
- **Titel:** „Was kostet es, Lewandowski zu behalten?“ statt „Warum verkauft Bayern seinen besten Stürmer?“.

## Offen für Regie und Bau

- **Neue Teile ohne Vorbild im Spike:** Atlas-Waage mit Neigung, Preisschilder, Vertragsband, Schild-Morph (falsch → richtig) und Diagramm-Waage. Alle sind Kandidaten für Module (fork-compare bzw. eine neue „waage“).
- **Platz in `halbnah:route`:** Die Waage samt 288-px-Stapel ist groß. Sie darf die Route und Barcelona nicht verdecken. Falls es nicht passt, steht die Waage in `nah:muenchen` und die Kamera folgt dem Geld per Fahrt (Barcelona → München, also in Flussrichtung).
- **Beat 5:** Die Kamera steht etwa 0,3 s, bevor der Stapel fällt („Bayern“ im Satz schiebt die Zahl nach hinten). Ist die echte Stimme schneller, fällt der Stapel auf „Millionen“.
- **Dichteste Stelle:** Beat 8 hat Abflug, Etikett-Morph, Landung und die Dateline in 3 s. Wird es im Bild zu voll, wechselt die Dateline schon auf `juli` allein und „1 Saison“ entfällt; das Etikett bleibt.
- **Textmenge um die Kosten-Schale** (Beat 6b): „Gehalt“, „bezahlt“, „45 Mio. €“, „entgangen“. Die Bild-statt-Text-Regel (≤ 20 % Textfläche) am Beat-Blatt messen.
- **Satz-Etikett je Profil:** Entweder zwei MP4 mit verschiedenem Etikett, oder der Live-Player setzt es nach Profil.
- **Spieler-Foto:** Lizenz und Urheber aus Wikimedia Commons prüfen; ohne klare Lizenz das Namensschild.
