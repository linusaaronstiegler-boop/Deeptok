# Hiding Night, Teil 2: Entwurf

Stand 15.11.2026. Entwurf zur Abnahme durch Linus, noch nicht vertont und nicht committet.
Grundlage: `folge-01/skript-teil1.txt` (Cliffhanger: Mister Hundred steht sechs Stunden zu früh im Vorgarten und späht durch die Finger), die Gliederung in `folge-01/serie.md`, `docs/anhang-a-serienformat.md` (A2, A3, A7) und `docs/format-spec.md` (§3, §8).

## Kurz

- **289 Wörter, 42 Sätze, geschätzt 86 s** (84,7–87,9 s). Satz 1 dauert geschätzt 4,2 s. Wörtliche Rede macht 7,6 % aus. Median 7 Wörter je Satz, kein Satz hat 20 Wörter oder mehr. Flesch etwa 98.
- Der Teil steigert sich in **fünf Stufen**. Er hat **drei Wendungen** vor dem Cliffhanger, eine **neue Regel** und eine **Regel-Lücke**. Er spielt an zwei bestehenden Orten und an einem neuen, dem Kriechkeller.
- **Cliffhanger:** June zählt wie jede Nacht, hört aber bei neunundneunzig auf. Eine tiefe Stimme direkt über Eli zählt für sie zu Ende. Dann fragt sie „Ready?“. Die Schonfrist ist weg, der Sucher steht auf dem Versteck, und Eli darf nicht antworten.
- **Rote Spur für Teil 2 und 3:** Eli glaubt, das Ding sei wegen June zurückgekommen, weil sie als Einzige entkam. So bleibt die Wendung in Teil 4 verdeckt: Es kam nicht zurück, es ist nie gegangen.

**Abweichungen von der Gliederung in serie.md:**
- Fußspuren *beginnen* an Junes Fenster.
- Odell spricht die Regel-Lücke aus („So why are you still here?“).
- Neu ist das Omen mit Elis Turnschuhen.
- Elis Entscheidung folgt einer Dreierreihe.
- Der Cliffhanger nimmt die Schonfrist weg, statt das Zählen erst beginnen zu lassen („One.“).

Die Gründe stehen unten bei den Wendungen.

## Skript

Ein Satz pro Zeile, so wie er in `skript-teil2.txt` und an `engine/ton/stimme.py` geht. Erstes Bild ist das letzte Bild von Teil 1 (Auge im Fingerspalt), die Kamera fährt weiter (A2).

```
It hunts you at eighteen, and it came for me early, like it knew where I'd hide.
I yanked the curtain shut.
When I looked again, the yard was empty.
Just footprints in the frost, long and bare.
They didn't come from the street.
They started at June's window.
The one room it never looks in.
June came out of her room, barefoot, half asleep.
Her hands were ice cold.
She said it does that.
It can't touch you before midnight.
At eleven, the town walked me and Tess Lowry to the square.
On every porch, the shoes were kicked apart.
Mr. Odell rings the bell at midnight.
Only the sunrise bell ends it.
Tess grinned.
"Last game of hide and seek, huh?"
Nobody laughed.
Tess picked the bell tower, higher than any window.
Mr. Odell told June it always takes both, hider and helper.
"So why are you still here?"
June didn't answer.
At home, my sneakers were in the hall, side by side.
I hadn't put them there.
I packed for the woods.
If I ran, I'd end up like Owen.
If June hid me, she'd end up like Dad.
And if it wanted her back, I wasn't leaving her alone.
June said it never looks in her room.
"That's why I'm still here, Rabbit."
She rolled back the rug and opened the hatch.
The hatch closed over me, then the rug.
Above me, June lay down and started counting, like every night.
Slow and soft, always to one hundred.
Tonight, she stopped at ninety-nine.
The bell struck midnight.
No counting came from the square.
The boards above my face bent down.
My breath turned white.
Then a much deeper voice finished her count.
"One hundred."
"Ready?"
```

Danach harter Schnitt ≤ 0,2 s nach „Ready?“, Endkarte „PART 3“ 1,0 s ohne Ton.

**Wörtliche Rede und Untertitelfarben** (serie.md): Alles andere bleibt weiß, auch die indirekte Rede in S10, S20 und S29.

| Satz | Wer | Zeile | Farbe |
|---|---|---|---|
| 17 | Tess | „Last game of hide and seek, huh?“ | `#C9A3F2` |
| 21 | Mr. Odell | „So why are you still here?“ | `#8EC3F4` |
| 30 | June | „That's why I'm still here, Rabbit.“ | `#F2C14E` (+2,5 Halbtöne wie in Teil 1) |
| 41–42 | Mister Hundred | „One hundred.“ „Ready?“ | `#9FD8D2`, Leitgeräusch (−5 Halbtöne, kurzer Hall) |

Drei Dialogzeilen wie in der Gliederung, dazu das Zählen. Mit Junes drei kurzen Sätzen aus Teil 1 sind es sechs Zeilen; serie.md plant etwa neun für die ganze Serie.

## Stufen der Eskalation

Zeiten geschätzt (Methode unten). Jede Stufe macht die Gefahr größer und zeigt sie im Bild.

| Stufe | Sätze | Zeit | Was passiert | Gefahr im Bild | Ort |
|---|---|---|---|---|---|
| 1 Regelbruch | 1–7 | 0,0–15,5 s | Hook. Vorhang zu, Garten leer. Bereifte Fußspuren kommen nicht von der Straße, sie beginnen an Junes Fenster. **Wendung 1** bei 10,8–15,5 s | Auge im Fingerspalt; nackte Riesenfußspuren im Reif; Junes dunkles Fenster | `marsh-innen` (Elis Zimmer, Vorhang), `hauptstrasse` (Vorgarten, Hausecke) |
| 2 Falsche Sicherheit | 8–11 | 15,8–23,0 s | June barfuß und verschlafen, eiskalte Hände. „It does that.“ Neue Regel: vor Mitternacht kann es nichts tun | eiskalte Hand an Elis Handgelenk; Junes nackte Füße auf den Dielen | `marsh-innen` (Flur, Junes Tür) |
| 3 Die Stadt | 12–22 | 23,3–45,8 s | Zug zum Platz, Schuhe auf den Veranden auseinandergetreten. Odells Glockenregel, neue Regel: nur die Sonnenglocke beendet das Spiel. Tess' Witz, Stille, Tess wählt den Turm. **Wendung 2** bei 40,1–45,8 s: Odells Regel-Lücke | Turmuhr 11:00; Menge mit gesenktem Blick; Odell beugt sich zu June | `hauptstrasse` (Häuserzeile, Platz, Kirche außen) |
| 4 Die Entscheidung | 23–32 | 46,1–68,2 s | **Wendung 3** bei 46,1–50,4 s: Elis Turnschuhe stehen im Flur nebeneinander. Er packt für den Wald. Dreierreihe: weglaufen → Owen, verstecken lassen → Dad, und wenn es June will, bleibt er bei ihr. June: „That's why I'm still here, Rabbit.“ Luke zu, Teppich drüber | Schuhpaar nebeneinander inmitten des Schuhhaufens; Eisenring der Luke; Luke schließt sich über der Kamera | `marsh-innen` (Flur, Elis Zimmer, Junes Zimmer), **neu** `kriechkeller` ab S32 |
| 5 Die Zählung | 33–42 | 68,5–86,3 s | June zählt leise, hört bei neunundneunzig auf. Die Glocke schlägt zwölf, vom Platz kommt kein Zählen. Die Dielen biegen sich, Atem wird weiß, eine tiefe Stimme zählt zu Ende. „Ready?“ (**Cliffhanger**, Wendung 4) | Lichtstreifen zwischen den Dielen werden dunkel, Staub rieselt, Dielen wölben sich zur Kamera; Atemdampf im Lampenkegel; die Menge auf dem Platz starrt auf den leeren Fleck, an dem es sonst zählt | `kriechkeller`, `hauptstrasse` (Platz, Turmuhr 12:00) |

**Schlüsselbilder je Satz (Auswahl für die Bildideen):**
- S1: Das Auge im Fingerspalt, die Kamera fährt weiter. Auf „hide“ gleitet sie zu Junes dunklem Seitenfenster im Erdgeschoss (`june_seite`).
- S4–S6: Detail der Spur im Reif, dann ein Kranschwenk an der Spur entlang. Die Straße bleibt unberührt, die Spur führt um die Hausecke zu Junes Fenster.
- S8: June mit `barfuss`, Gesicht „verschlafen“.
- S19: Tess steigt die Kirchenstufen hinauf. Ein Tilt zeigt den Turm, der über alle oberen Fenster ragt (Größenvergleich).
- S23: Im Flur liegt ein Schuhhaufen kreuz und quer. Mitten darin steht `schuhpaar` eli, `ordnung: nebeneinander`. Dazu ein Snap-Zoom.
- S26–S27: Kurzer Rückgriff auf Teil-1-Bilder: Owens Pick-up mit laufendem Motor, Dads Stiefel auf der Veranda (entsättigt).
- S31–S32: Teppich, Eisenring, `luke` öffnen. Danach aus dem Kriechkeller nach oben: Die Luke schließt sich, Schwarz, nur noch die Taschenlampe.
- S37: Platz von oben. Die Menge hält Abstand zum leeren Fleck bei `monster_platz`.
- S40–S42: Die Stimme auf „One hundred.“ mit Snap-Zoom auf Elis Gesicht. Auf „Ready?“ hält Eli sich den Mund zu (`mund_zuhalten`). Der Atemdampf quillt durch die Finger, dann harter Schnitt.

## Wendungen und warum sie tragen

**Wendung 1: Die Fußspuren beginnen an Junes Fenster (S5–S7).**
- *Vorbereitet:* „It never looks in my room“ (T1, S29). „Your breath turns white when it's close“ (T1, S6) erklärt den Reif. Mister Hundred ist barfuß (serie.md).
- *Überraschend:* Man erwartet Spuren von der Straße her. Die Spur kommt aus der Richtung des einzigen sicheren Zimmers. Damit wackelt Junes Versprechen schon bei 13 s.
- *Funktion:* Sie löst den Hook ein („like it knew where I'd hide“) und hängt die rote Spur auf: Es war bei June.
- *Beim Wiederansehen:* Die Zehen zeigen vom Fenster weg. Es kam aus ihrem Zimmer, nicht zu ihm. Das Bild hält diesen Hinweis, die Erzählung sagt nur „started at“.

**Wendung 2: Odell spricht die Regel-Lücke aus (S20–S22).**
- *Vorbereitet:* „If they try, it takes them too“ (T1, S11–12). Dad versteckte June und verschwand, June überlebte (T1, S22–25). Das steht seit Teil 1 im Raum, aber niemand hat es ausgesprochen.
- *Überraschend:* Der Hüter der Regel stellt die Überlebende öffentlich in Frage. Ausgerechnet die Schutzfigur wird zum Rätsel.
- *Regel-Lücke:* Die Regel nimmt immer beide. Ein einziges Mal hat sie versagt, nämlich unter Junes Zimmer. Genau das macht das Zimmer für Eli glaubwürdig („That's why I'm still here“).
- *Beim Wiederansehen:* Es ließ June nicht gehen, es blieb in ihr. Teil 4 beantwortet Odells Frage wörtlich: „Dad had hidden me, so it took both.“

**Wendung 3: Elis Turnschuhe stehen nebeneinander (S23–S24).**
- *Vorbereitet:* „Nobody leaves their shoes side by side“ (T1, S18). S13 zeigt Neueinsteigern zehn Sekunden vorher, dass die ganze Stadt Schuhe auseinandertritt.
- *Überraschend:* Die Gefahr ist im Haus, obwohl „it can't touch you before midnight“. Außer June war niemand da.
- *Funktion:* Sie treibt die Entscheidung an: Eli will fliehen, und die Dreierreihe zeigt, dass jeder Ausweg tödlich ist. So wird das Versteck unter Junes Zimmer eine Wahl aus Liebe statt eine bequeme Lösung.
- *Für Teil 4:* Die Schuhe markieren den, den es behält. Vorschlag für das Schlussbild von Teil 4: Elis Turnschuhe stehen im Morgenlicht noch nebeneinander im Flur.

**Wendung 4 und Cliffhanger: Junes Zählen ist sein Zählen (S33–S42).**
- *Vorbereitet:* „June counts to one hundred before she falls asleep“ (T1, S26). „At midnight, it counts to one hundred … the whole town hears it“ (T1, S5). „Ready … that's what it asks when it's done counting“ (T1, S19–20). „My breath turned white“ (T1, S33). Die Glockenregel stammt aus S14.
- *Überraschend:* Die Zählung, auf die die Stadt um Mitternacht wartet, ist schon vorbei. Sie kam in Junes Stimme aus Junes Zimmer, und Eli hat sie selbst mitgehört.
- *Schwerer als in Teil 1:* In Teil 1 stand die Bedrohung draußen, vor Mitternacht und hinter Glas. Jetzt ist sie eine Handbreit über ihm. Das Spiel läuft ohne Schonfrist, die Frage gilt ihm, die Luke ist zu und der Teppich darüber. Antworten verbietet die Regel. Wo June ist, bleibt offen. Nichts davon löst sich ohne Teil 3.
- *Letzter Satz:* ein Wort.

**Rote Spur:** S28 („And if it wanted her back“) gibt der Spur am Fenster und Odells Frage eine zweite, harmlose Lesart: June als Opfer, nicht als Täterin. Teil 3 stützt das mit Junes leerem Bett und ihren Schuhen nebeneinander.

**Hinweise beim Wiederansehen:**
- June ist barfuß wie das Ding.
- Ihre Hände sind kalt.
- „It does that“: Sie kennt seine Gewohnheiten.
- „Slow and soft“ (June) gegen „slow and deep“ (es, T1).
- „That's why I'm still here“ hat einen doppelten Sinn.
- Nur June war im Haus, als die Schuhe nebeneinander gestellt wurden.

## Hook-Varianten

Alle drei enthalten die Regel, die Lage aus dem Cliffhanger und einen neuen Haken. Sie bleiben unter 4,5 s. Hinweis: Satz 1 von Teil 1 lag real 0,22 s über der Schätzung.

| | Satz 1 | Wörter, Silben | geschätzt | Neuer Haken |
|---|---|---|---|---|
| **A, im Skript, empfohlen** | *It hunts you at eighteen, and it came for me early, like it knew where I'd hide.* | 17 W, 19 S | 4,2 s (ohne „for me“: 3,8 s) | „knew where I'd hide“: Das Versteck ist verraten. Wer Teil 1 kennt, denkt sofort an Junes Zimmer, Neue wissen: Es geht ums Verstecken, und das Versteck ist nicht sicher. Die Spur in S6 löst das ein, ohne es vorwegzunehmen. Der Satz ist auch nach Teil 4 wahr. |
| B | *It hunts you at eighteen, and it came early, then walked to my sister's window.* | 15 W, 19 S | 4,2 s | Konkret und sofort ein Bild. Aber Wendung 1 wird damit zur Bestätigung statt zur Überraschung. Bei Wahl S5–S6 ersetzen durch „They went around the house, to June's window.“ Sonst widerspricht „started at“ dem „walked to“ im Hook. Der Hinweis fürs Wiederansehen liegt dann nur noch im Bild. |
| C | *It hunts you at eighteen, it came early, and my sister wasn't even scared.* | 14 W, 18 S | 4,0 s | Richtet den Verdacht sofort auf June und lädt zu Kommentaren ein („June is it“). Risiko: Zusammen mit den Hinweisen in Teil 2 ist die Wendung von Teil 4 dann zu leicht zu erraten. |

## Cliffhanger-Varianten

| | Schluss ab S36 | geschätzt gesamt | Was offen bleibt | Folgen |
|---|---|---|---|---|
| **A, im Skript, empfohlen** | *The bell struck midnight. / No counting came from the square. / The boards above my face bent down. / My breath turned white. / Then a much deeper voice finished her count. / "One hundred." / "Ready?"* | 289 W, 86,3 s | Antwortet er? Was steht auf den Dielen? Wo ist June? | „Ready?“ fällt schon hier, über Eli statt über der Stadt. Teil 3 beginnt im Schweigen danach (siehe unten). |
| B, „Leeres Bett“ | *The bell struck midnight. / Through a crack in the boards, I saw her red sneakers by the bed. / Side by side. / Then something right above me finished her count. / "One hundred."* | 288 W, 85,5 s | Ist June tot? Was steht über ihm? „Ready?“ steht noch aus. | Zieht Beat 2 aus Teil 3 (Junes Schuhe nebeneinander) nach vorn. Die rote Spur wird stärker, der Atem-Payoff fällt weg. Hook Teil 3 dann etwa: *On Hiding Night, my sister's shoes were side by side, and it was standing right above me.* |

Verworfen: *"Ready, Rabbit?"* in Junes Stimme. Der Schluss wäre maximal hart, verbraucht aber den Cliffhanger von Teil 3 („Rabbit? You can come out now.“) und verrät die Wendung von Teil 4 schon nach Teil 2.

## Orte und Bauaufwand

| Ort | Wofür in Teil 2 | Was schon da ist | Was fehlt |
|---|---|---|---|
| `hauptstrasse` (mit Vorgarten Marsh) | S1, S4–S7, S12–S22, S36–S37 | Vorgarten, Häuserzeile mit Veranden (`haeuser_detail` für Schuhe), Platz, Kirche mit Turm, Uhr und Glocke, `monster_platz`, Nachbarn, Odell, Tess, Laternenzug mit Lichtgruppen | Reif-Fußspuren als Bodenaufkleber (Zehen vom Fenster weg). Anker an Junes Seitenfenster außen (`june_seite`, Erdgeschoss links). Turmuhr 11:00 und 12:00 |
| `marsh-innen` | S2–S3, S8–S11, S23–S31 | Vorhang an Elis Fenster (im Set schon für Teil 2 vorbereitet), `eli_fenster_schulter`, Flur mit Schuhhaufen, Rucksack, Junes Zimmer mit `luke` (Teppich, Eisenring), June `barfuss`, `schuhpaar` eli `nebeneinander` | nichts |
| **neu:** `kriechkeller` | S32–S35, S38–S42 | in serie.md beschrieben, wird in Teil 3 und 4 weiterverwendet | Balken, Erdboden, Dielen mit Lichtspalten. Die Dielen müssen sich wölben können (eigener Baustein, Hauptaktion auf „bent“). Atemdampf, Elis Taschenlampe. Lüftungsgitter und Dads Lampe erst ab Teil 3 |

Die Glockenstube braucht Teil 2 nicht: Tess wird nur von außen gezeigt. Licht: Dämmerung kippt in Blau (S1–S11), Nacht mit Laternen (S12–S22), innen warm (S23–S31), Kriechkeller fast dunkel mit Lampenkegel (ab S32).

## Folgen für Teil 3 und 4

Bitte erst nach der Abnahme in serie.md übernehmen.

- **Hook Teil 3, Vorschlag zu Cliffhanger A:** *On Hiding Night, my sister counted to ninety-nine, and something right above me said one hundred.* Die Länge muss noch geprüft werden, sie liegt wahrscheinlich über 4,5 s. Kürzer: *My sister stopped counting at ninety-nine, and the thing above me finished.*
- **Teil 3, Beats 2–3:** Eli antwortet nicht auf „Ready?“. Das Gewicht hebt sich von den Dielen, durch den Spalt sieht er Junes leeres Bett mit ihren Turnschuhen nebeneinander, wie geplant. Das Zählen, das durch die Stadt wandert, entfällt, weil die Zählung schon vorbei ist. Dafür hört Eli, wie es durch Junes Fenster hinausgeht (Spiegel zur Spur in Teil 2). Die Beats 4–8 bleiben (Tess im Turm, Fensterkontrolle, Finger im Spalt, drei Uhr, Junes Stimme).
- **Teil 4:** Odells Frage aus Teil 2 wird wörtlich beantwortet. Teil 4 zeigt, dass es in Junes Zimmer beginnt, wenn sie zählt, und erklärt so die Spur. Schlussbild-Vorschlag: Elis Schuhe stehen noch nebeneinander.

**Neue Paare aus Setup und Payoff** (Setups alle in der ersten Hälfte von Teil 2 oder früher; Nummern schließen an die Tabelle in serie.md an):

| # | Setup (Teil 2) | Payoff |
|---|---|---|
| 14 | Spur beginnt an Junes Fenster (S6) | geht durch ihr Fenster hinaus (T3); es fängt in ihrem Zimmer an (T4) |
| 15 | „it always takes both … So why are you still here?“ (S20–21) | „Dad had hidden me, so it took both“ (T4) |
| 16 | „That's why I'm still here, Rabbit.“ (S30) | doppelter Sinn wird klar (T4) |
| 17 | Elis Turnschuhe nebeneinander (S23) | Schlussbild (T4, Vorschlag) |
| 18 | „Tess picked the bell tower, higher than any window“ (S19) | Tess wird im Turm gefunden (T3) |
| 19 | June zählt „slow and soft“ (S34), es „slow and deep“ (T1) | beide zählen zusammen (T4) |

Erfüllt sind in Teil 2: #5 (Helfer-Regel), #7 (Zählen über ihm), #9 (kalte Hände, weißer Atem), #11 (Tess' Witz) und #12 (Sonnenglocke). „Ready?“ (#4) kommt mit Cliffhanger A schon hier.

## Prüfwerte und Reserve

- **Methode:** Dauer = 0,176 s je Silbe + 0,348 s je Komma + 0,125 s, dazu 0,30 s Pause je Satzgrenze. Geeicht an den 36 Sätzen von Teil 1 (`timing.json`): Schätzung 86,4 s, gemessen 86,12 s, Streuung je Satz 0,25 s. Das Zählen mit Effekt kann etwas länger werden.
- **Regeln:**
  - 260–300 Wörter: ja.
  - 70–90 s, nie unter 62 s: ja.
  - Zahlen ausgeschrieben.
  - Alle Gefährdeten volljährig: Eli 18, Tess 18, June 24.
  - Keine Kinder, auch nicht in der Menge.
  - Keine Gewalt im Bild.
  - In den ersten 7 s nur Auge, Vorhang, leerer Garten und Spur.
- **Kürzungsreserve,** falls die Aufnahme über 88 s läuft:
  - S18 „Nobody laughed.“ (−1,1 s).
  - S10 „She said it does that.“ (−1,3 s, nimmt einen Hinweis auf June weg).
  - Nur im Notfall S13 (−2,5 s): Dann fehlt Neueinsteigern die Bedeutung der Schuhe in S23.
- **Hör-Check-Risiken:**
  - „Odell“ (Whisper schreibt evtl. „O'Dell“).
  - „Lowry“ (evtl. „Laurie“).
  - „yanked“ und „hider“.
  - Aus Teil 1 bekannt: „ready“ wird nur mit niedriger Sicherheit erkannt. Bei Bedarf Aussprache-Schreibung nach Werkstatt-Regel.

## Offen für Linus

1. **Hook:** A, B oder C?
2. **Cliffhanger:** A („Ready?“ über ihm) oder B („Leeres Bett“)?
3. **Hinweise auf June:** Sind es zu viele? Wer die Wendung in Teil 4 schwerer erraten soll, streicht S10 oder „half asleep“ in S8.
4. **Turnschuh-Omen (S23–S24):** behalten? Es ist die einzige Szene, die über die Gliederung hinaus neu ist. Sie verpflichtet Teil 4 zu einem Payoff.
5. **Für den Musik-Schritt:**
   - Das Bett sollte ab S33 (Junes Zählen) dünner werden.
   - Ab „stopped at ninety-nine“ (S35) kommt nur noch der Glockenschlag.
   - Unter „One hundred.“ und „Ready?“ Stille, nur das Leitgeräusch (vgl. format-spec §7, drei Stufen).
