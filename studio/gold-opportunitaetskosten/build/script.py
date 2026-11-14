# Skript des Goldstandards „Opportunitätskosten: Was kostet es, Lewandowski zu behalten?“
#
# Gleiche Form wie studio/probe-opportunitaetskosten/build/script.py, damit Stimme (voice.py)
# und Zeitschritte (compose.py) weiterlaufen:
#   - SCENES ist eine Liste von Szenen, jede Szene eine Liste von Sätzen.
#   - Ein Token „Anzeige|Gesprochen“ trennt Untertitel und Aussprache, z. B. „45|fünfundvierzig“.
#
# Neu gegenüber der Probe:
#   - "cues": Cue-Name -> Wort. Auf dieses Wort landet ein Bild (siehe drehbuch.md, Spalte Sprechtext
#     mit {cue}). Die Sätze selbst bleiben ohne {cue}-Marken, weil voice.py jedes Token spricht.
#     Kommt ein Wort in einer Szene mehrfach vor, zählt "Wort#2" das zweite Vorkommen.
#     Cue-Namen sind im ganzen Video eindeutig: Der Bau sammelt sie in EINEM Wörterbuch (WORTE),
#     wie im Bühnen-Spike (studio/spike-buehne/build/bauen.mjs).
#   - "pause_s": deklarierte Denkpause NACH der Szene (Stille, Optionen sichtbar).
#   - "atem_s": deklarierte Atempause NACH der Szene, vor einer Pointe (Stille, Bild steht).
#     Kürzer als die Denkpause (0,6-1,1 s), damit G4 sie nicht als "lange Stille" zählt.
#   - "hold_s": Halten am Ende (Stille, letztes Bild steht).
#   - "interaction": "pause_for_answer" hält in der App an, bis getippt wurde.
#   - "betont": Wörter, die die Stimme betonen soll (Markup *betont* aus VIDEO-PIPELINE §4;
#     der Stimm-Adapter übersetzt es je Anbieter). Gleiche Schreibweise wie bei Cues: Kommt ein
#     Wort mehrfach vor, meint "Wort#1" nur das erste Vorkommen.
#   - "steigt": Fragesätze, deren Stimme am Ende steigt (Markup „?↑“ aus §4). Alle anderen
#     Fragen fallen, wie W-Fragen im Deutschen üblich („Was kostet es, ihn zu behalten?“).
#   - "facts": IDs aus ../fakten.json für jede Zahl und jede Behauptung der Szene.
#   - "luft" (Fassung v2.1): Wort -> Sekunden. Nach diesem Wort steht MINDESTENS so viel Stille
#     (voice.py setzt sie in die Aufnahme ein, auch mitten in einem Block). Für Kernsätze, die
#     sonst ohne Atem aufeinanderfolgen (Kritik 28.10.: „bezahltes.“ -> „Ökonomen“ 0,30 s,
#     „Opportunitätskosten.“ -> „Das ist …“ 0,34 s; Vorbilder: vor einer Wende 1,0-1,5 s).
#
# Fakten geprüft am 27.10.2026 (Quellen, Daten und Zitate in ../fakten.json):
#   Ablöse 45 Mio. € fest + 5 Mio. € variabel (FC Barcelona, 19.07.2022),
#   Bayern-Vertrag bis 30.06.2023 und keine Verlängerung (Salihamidžić, t-online/dpa, 14.05.2022),
#   ablösefrei nach Vertragsende (bpb; Bosman-Urteil des EuGH vom 15.12.1995),
#   Kahn: „eine Summe geboten, bei der ein Verkauf für uns absolut sinnvoll ist“ (sport1, 16.07.2022).
#
# Prüfen:  python build/script.py          (Cues, Betonungen, Wortzahl je Szene, Dauer, Frage in 8 s)
#          python build/script.py --cues   (zusätzlich geschätzte Zeit jedes Cues)

SCENES = [
    # Beat 1+2: Frage in den ersten 8 s, danach Denkpause. Die drei Antworten stehen im Bild
    # (Preisschilder an der Spieler-Figur, keine Pillen-Chips: DESIGN.md BANNED 12). Die Stimme
    # liest sie NICHT vor, sonst liest und hört man denselben Text.
    # Vor der Pause ist KEIN Geld im Bild: Gold bedeutet „gesuchte Größe“, ein goldener
    # Münzstapel würde hier die richtige Antwort verraten.
    # pause_s 2,4 (Runde 2): Im MP4 kommen an den Blockrändern je 0,03 s Rand dazu; mit 2,5 lag die
    # gemessene Stille bei 2,57 s, knapp über der Spanne aus DESIGN.md §9 (1,5-2,5 s, Prüfung 3).
    {"id": "hook", "beat": "frage", "interaction": "pause_for_answer", "pause_s": 2.4,
     "facts": ["will", "datum", "dilemma", "behalten"],
     "sentences": [
         "Barcelona|Barsselona will Lewandowski.",
         "Bayern kann verkaufen oder behalten.",
         "Was kostet es, ihn zu behalten?",
     ],
     # Die drei Antwort-Schilder hängen sich schon auf "kostet" (Cue frage) an die Figur, nicht erst
     # auf das letzte Wort: So stehen sie ca. 4 s lesbar, ohne das Video zu verlängern.
     # "bayern" (Fassung v2.1): Bis hier liegt das echte Foto als Abzug auf der Karte; auf „Bayern“
     # wird es zum Darsteller und steigt nach München (Bayern entscheidet, dort steht die Waage).
     "cues": {"bcn": "Barcelona", "lewa": "Lewandowski", "bayern": "Bayern", "verkaufen": "verkaufen",
              "behalten": "behalten#1", "frage": "kostet", "optionen": "behalten#2"},
     # "behalten#1": Nur das erste „behalten“ wird betont. Im Fragesatz liegt der Ton auf „kostet“.
     # Fassung v3 (Sebastian spricht schneller als die Mischspur): Luft nach dem ersten Satz. Der Abzug
     # braucht >= 2,0 s, bevor er auf „Bayern“ zum Darsteller wird (Bau-Tor in bauen.mjs); ohne
     # Luft kam „Bayern“ nach 0,23 s Pause schon bei 2,16 s.
     # Fassung final (Runde 1): 0,7 statt 0,5 s. Der Morph beginnt jetzt AUF „Bayern“ (nicht 0,4 s davor,
     # Kritik: Bild lief dem Wort voraus); das Tor „Abzug steht >= 2,0 s“ hält damit ohne Vorziehen.
     # "behalten#1" (Runde 1, Ton und Didaktik): Vor der Leitfrage lagen nur 0,18 s. Die Frage löst die
     # Vorhersage aus (Erst tippen, dann sehen) und soll als neuer Gedanke hörbar abgesetzt sein.
     "luft": {"Lewandowski": 0.7, "behalten#1": 0.45},
     "betont": ["verkaufen", "behalten#1", "kostet"]},

    # Beat 3: der Irrtum der Serie als naheliegende Antwort, MIT seinem Grund („nur das bezahlt
    # Bayern“). Ein Widerlegungstext wirkt, wenn der Zuschauer seine eigene Begründung wiedererkennt.
    # „die Antwort“ steht da, weil man einen Doppelpunkt nicht hört: Ohne sie klänge der Satz
    # wie „Naheliegend ist nur sein Gehalt“.
    {"id": "naheliegend", "beat": "naheliegend",
     "sentences": [
         "Naheliegend wäre die Antwort: nur sein Gehalt.",
         "Denn nur das bezahlt Bayern.",
         "Er schießt dafür Tore.",
     ],
     # Fassung final (Runde 1): „wäre“ statt „ist“. Im Indikativ klang der Irrtum wie die Auflösung
     # (Didaktik-Kritik); der Konjunktiv markiert ihn, ohne zu werten. „Er schießt dafür Tore“ statt
     # „Dafür schießt er Tore“: Die Bindung „schießt_er“ klang wie „schießt der“ (Ton-Kritik, Whisper).
     # "nur#1": Die Behauptung erscheint oben links, sobald sie gesprochen wird ("nur sein Gehalt").
     # "schiesst" (Runde 2, Prüfung 2): Erst hier steigt der Spieler auf die Nutzen-Schale, und die
     # Waage neigt sich, WEIL etwas aufsetzt. Vorher stand er schon da, und nichts geschah.
     "cues": {"waage": "Naheliegend", "nur": "nur#1", "gehalt": "Gehalt", "bezahlt": "bezahlt",
              "schiesst": "schießt", "tore": "Tore"},
     "betont": ["Gehalt", "bezahlt"]},

    # Beat 4: Gegenbefund, Teil 1. Warum Behalten hier die GANZE Ablöse kostet: Nach dem
    # 30.06.2023 bekäme Bayern nichts mehr. Im Ton „eine Saison“ statt einer Jahreszahl; das Datum
    # steht im Bild. „Bayern bekommt nichts“ erklärt das Fachwort „ablösefrei“ gleich mit.
    {"id": "vertrag", "beat": "gegenbefund",
     "facts": ["saison", "vertrag", "verlaengern", "frei", "frei_urteil"],
     "sentences": [
         "Doch sein Vertrag läuft nur noch eine Saison.",
         "Verlängern will er nicht.",
         "Er geht danach ablösefrei: Bayern bekommt nichts.",
     ],
     # Fassung final (Runde 1): „Er geht danach“ statt „Danach geht er“ (Bindung „geht_er“ klang wie
     # „geht der“).
     # „0 €“ erscheint schon auf „ablösefrei“ (nicht erst auf „nichts“), damit es 1,2 s steht,
     # bevor die Kamera in Beat 5 losfährt (Kamera steht in der Lesezeit, DESIGN.md §5).
     # Der Vertrag ist ein Gegenstand (Blatt mit Zeitleiste). "verlaengern_an": Die gestrichelte
     # Verlängerung erscheint auf "Verlängern" und erlischt auf "nicht".
     # Runde 2: Die Zeitleiste ist auf das Vertragsblatt gedruckt. "danach" („Danach“): Die Welt fährt
     # näher an das Blatt (Detail: was nach dem Vertrag kommt). "nichts": Stempel „0 €“ auf dem Wort,
     # das ihn nennt („Bayern bekommt nichts“), neben dem Stempel „ablösefrei“.
     "cues": {"vertrag": "Vertrag", "saison": "Saison", "verlaengern_an": "Verlängern",
              "verlaengern": "nicht", "danach": "danach", "frei": "ablösefrei", "nichts": "nichts"},
     # Fassung v3: Luft nach „Saison.“: Die Zeitleiste auf dem Blatt läuft 0,7 s ab „Saison“ und soll
     # stehen, bevor die Verlängerung kommt (Bau-Tor). Sebastian ließ nur 0,27 s Pause.
     "luft": {"Saison": 0.5},
     "betont": ["eine", "nichts"]},

    # Beat 5: Gegenbefund, Teil 2. Erst JETZT fällt das Geld (Münzstapel, Gold) auf Barcelona,
    # auf dem Wort, das es nennt („45“). „Bayern“ im Satz schiebt die Zahl nach hinten, damit die
    # Kamerafahrt (1,4 s ab „Barcelona“) vor dem Fallen endet.
    {"id": "angebot", "beat": "gegenbefund", "facts": ["abl", "abl2"],
     "sentences": [
         "Barcelona|Barsselona bietet Bayern jetzt 45|fünfundvierzig Millionen Euro.",
     ],
     # "bietet": Die Kamera fährt erst hier los und kommt kurz vor "45" in Barcelona an
     # (vorher stand nach der Fahrt ein leeres Bild).
     "cues": {"angebot": "Barcelona", "bietet": "bietet", "zahl": "45"},
     "betont": ["jetzt", "45"]},

    # Beat 6a: Widerlegung. Nur hier ist Rot erlaubt (Durchstrich auf dem Schild „Nur sein Gehalt“).
    # Statt den Lehrsatz zu behaupten, vergleicht der zweite Satz die beiden Ausgänge.
    # Ein GEIST des Stapels (gestrichelter Umriss = nur eine Möglichkeit) fliegt von Barcelona nach
    # München und landet auf der Kosten-Schale. Das echte Geld bleibt in Barcelona: Während
    # „Behalten keinen Cent“ liegt bei Bayern also kein Geld, nur sein Umriss.
    # atem_s: eine Atempause vor dem Schluss „Entgangenes Geld …“ (Pointe, Prüfung 2).
    {"id": "widerlegung", "beat": "widerlegung", "facts": ["abl", "frei"], "atem_s": 0.9,
     "sentences": [
         "Nur sein Gehalt? Das stimmt nicht.",
         "Verkaufen bringt 45|fünfundvierzig Millionen Ablöse.",
         "Behalten: keinen Cent.",
     ],
     # Fassung final (Runde 1, Ton-Kritik P1): Der Kontrast steht jetzt im SATZBAU. Cartesia kennt kein
     # Markup für Betonung („betont“ kommt dort nie an); im alten Satz „…, Behalten keinen Cent“ kam die
     # zweite Hälfte tief und flach wie ein Nachsatz. Als eigener Satz mit Doppelpunkt ist „Behalten“
     # eine eigene Intonationsphrase.
     # Fassung final (Runde 1, Didaktik): Landung auf „Behalten“, nicht mehr auf „Ablöse“. Der Flug
     # Barcelona -> München läuft unter „Verkaufen bringt 45 Millionen Ablöse“ (Geld fließt vom Käufer
     # zum Verkäufer); auf die Kosten-Seite des BEHALTENS fällt er erst, wenn die Stimme vom Behalten
     # spricht. Vorher zeigte das Bild die Umdeutung 3 s vor dem Ton. Die Waage kippt erst auf „fehlt“
     # (Szene entgangen); der alte Grund für die frühe Landung (1,7 s Ausschwingen) gilt nicht mehr.
     # "cent": Auf „keinen Cent“ kommt „0 € Ablöse“ unter die NUTZEN-Schale (Didaktik: am Schild
     # „Behalten“ las es sich wie „Behalten kostet nichts“, Ablenker 3 der Hook-Frage).
     "cues": {"falsch": "nicht", "landung": "Behalten", "cent": "Cent"},
     # Fassung v3: Luft nach „Das stimmt nicht.“, bevor der Vergleich kommt (Wende). Der Durchstrich
     # steht, dann fährt die Kamera >= 0,9 s nach München (Bau-Tor); Sebastian ließ nur 0,20 s Pause.
     # "Behalten" (final): Atem nach dem Doppelpunkt; Landung und „0 € Ablöse“ liegen so nicht in
     # derselben halben Sekunde (höchstens eine Bedeutungsänderung je Sekunde, DESIGN.md §5).
     "luft": {"nicht": 0.5, "Behalten": 0.45},
     "betont": ["nicht", "Verkaufen", "Behalten"],
     "steigt": ["Nur sein Gehalt?"]},

    # Beat 6b: der Schluss aus dem Vergleich. Das Paar „entgangen/bezahlt“ ist der Kern.
    # Fassung final (Runde 1, Didaktik): Auf „fehlt“ bekommt der Geist Gewicht, und die Waage kippt zur
    # KOSTEN-Seite. Vorher schwang sie auf „genauso“ auf waagerecht und stand so 9 s: Das las sich als
    # „Kosten = Nutzen“, und auf „nimmt“ kippte sie später ohne neues Gewicht.
    # Auf „bezahltes“ verwandelt sich das durchgestrichene Schild in die richtige Antwort.
    {"id": "entgangen", "beat": "widerlegung",
     "sentences": [
         "Entgangenes Geld fehlt genauso wie bezahltes.",
     ],
     "cues": {"entgangen": "Entgangenes", "gewicht": "fehlt", "korrektur": "bezahltes"},
     # Fassung v2.1: Vor dem neuen Beat „Begriff“ eine Absatzpause (vorher 0,30 s).
     "luft": {"bezahltes": 0.7},
     "betont": ["genauso"]},

    # Beat 7: Begriff erst jetzt, nach dem Beispiel. „man“ statt „du“: Noch ist es Bayerns Fall.
    # atem_s (Runde 2, Prüfung 2): Die Definition hat 10 Wörter in 2,8 s. Danach eine Atempause,
    # in der Begriff und Kreis abtreten und die Kamera auf die ganze Waage zurückfährt.
    {"id": "begriff", "beat": "begriff", "facts": ["begriff"], "atem_s": 0.6,
     "sentences": [
         "Ökonomen nennen dieses Geld Opportunitätskosten.",
         "Das ist der Wert der besten Alternative, die man aufgibt.",
     ],
     "cues": {"begriff": "Opportunitätskosten", "alternative": "Alternative", "aufgibt": "aufgibt"},
     # Fassung final (Ton-Kritik P1): Die Definition kam mit 5,1 Silben/s, schneller als der Median.
     # Cartesias Tempo-Wert wirkt kaum (0,8 statt 1,05: 3 % langsamer), darum dehnt voice.py den Satz
     # (rubberband, Tonhöhe bleibt). Keine neue Aufnahme; Tor: pruefe_ton (<= 4,5 Silben/s).
     "dehnen": {"Das ist der Wert": 1.16},
     # Fassung v2.1: Der Begriff steht kurz für sich, bevor die Definition kommt (vorher 0,34 s).
     "luft": {"Opportunitätskosten": 0.6},
     "betont": ["Opportunitätskosten", "aufgibt"]},

    # Beat 8: Auflösung des Falls. Der neue Begriff wird sofort angewendet: Auch Verkaufen hat
    # Opportunitätskosten. Die Waage dreht sich um (Schild „Behalten“ -> „Verkaufen“): Jetzt
    # liegt das Geld auf „Nutzen“, der Spieler auf „Kosten“. Er fliegt ab (Richtung Barcelona),
    # sein gestrichelter Umriss bleibt auf der Kosten-Schale: „Opportunitätskosten / 1 Saison“.
    # So liegen Opportunitätskosten in jedem Bild links auf „Kosten“ (Prüfung 1 und 2, P0).
    #
    # Runde 2 (Prüfung 2, P1 „fünf Bedeutungswechsel in 2,3 s“): Beat 8 ist jetzt zwei Szenen.
    # Nach „Im Juli nimmt Bayern das Geld.“ steht eine Atempause (atem_s, Sprechtext unverändert).
    # In ihr beginnt die Drehung bei stehender Kamera; der Geist wird erst echt, wenn er auf der
    # Nutzen-Seite ankommt. Die Atempause braucht eine Szenengrenze, denn voice.py teilt die
    # Stimme nur an deklarierten Pausen nach einer Szene.
    #
    # Fassung v2 (Abnahme 28.10.): atem_s 1,0 statt 0,7. Die Pause ist LUFT: Die Neigung auf "nimmt"
    # ist ausgeschwungen, das Bild steht. Die Drehung beginnt am Ende der Pause; ihre Mitte bleibt
    # auf "Verkaufen" (Vorrang: das Schild ist Text und kippt auf seinem Wort). So liegen Neigung,
    # Drehung mit Echtwerden des Geldes und Etikett je knapp 1 s auseinander statt in 1,1 s.
    {"id": "verkauf", "beat": "aufloesung", "facts": ["datum", "kahn_summe"], "atem_s": 1.0,
     "sentences": [
         "Im Juli nimmt Bayern das Geld.",
     ],
     # "nimmt": Die Waage neigt sich (Bayerns Entscheidung), in der Totale (Kamera steht).
     "cues": {"juli": "Juli", "nimmt": "nimmt", "genommen": "Geld"},
     "betont": ["nimmt"]},

    # "dreh" („Verkaufen“): Die Waage hat sich gedreht; das Schild zeigt „Verkaufen“, sobald das Wort
    # fällt. "abflug_spieler" („eine“): Der Spieler fliegt ab, "ok_saison" („Saison“): „1 Saison“.
    {"id": "aufloesung", "beat": "aufloesung", "facts": ["saison"],
     "sentences": [
         # „Oppor-tunitätskosten“ nur für Piper (Rückfall-Block): Ohne Trennstrich hörte Whisper den
         # einzeln ausgeschnittenen Satz als „Operatunitätskosten“ (0 von 2 Synthesen richtig, mit
         # Trennstrich 3 von 4; 28.10.). Jonas liest die Anzeige-Seite.
         "Auch Verkaufen hat Opportunitätskosten|Oppor-tunitätskosten: eine Saison Lewandowski.",
     ],
     "cues": {"dreh": "Verkaufen", "ok_verkauf": "Opportunitätskosten", "abflug_spieler": "eine",
              "ok_saison": "Saison"},
     # Fassung final (Runde 1): Atem vor der Verallgemeinerung („Jede Entscheidung …“). Vorher lag zwischen
     # dem Aha des Falls und der Brücke nur eine gewöhnliche Satzpause (0,54 s).
     "luft": {"Lewandowski": 0.7},
     "betont": ["Verkaufen", "Saison"]},

    # Beat 9: das Modell wird allgemein. Harter Schnitt auf das Nomen „Waage“ (neues Thema: jede
    # Entscheidung). Ab hier Identität Diagramm statt Atlas; zwei Identitäten nie im selben Bild.
    {"id": "modell", "beat": "modell",
     "sentences": [
         "Jede Entscheidung hat so eine Waage.",
     ],
     "cues": {"modell": "Waage"},
     # Fassung final: der schnellste Satz des Videos (6,8 Silben/s) als Brücke etwas langsamer.
     "dehnen": {"Jede Entscheidung": 1.15},
     # Fassung v3: Luft nach „Waage.“: Nach dem harten Schnitt steht die leere Waage, bevor das Beispiel
     # aus dem Alltag beginnt (Wende vom Fall Bayern zu „du“). Sebastian ging ohne Pause weiter, die
     # HUD-Szene „modell“ war 0,5 s kurz und ihr Beat-Clip lag dahinter (Bau-Fehler).
     "luft": {"Waage": 0.7},
     "betont": ["Jede"]},

    # Beat 10+11: Transfer in den Alltag. Erst ab hier „du“. „für heute Abend“ und „Genau dann“
    # machen den Zeitkonflikt hörbar: Beides zugleich geht nicht, sonst gäbe es nichts aufzugeben.
    # Kein Rat, was man tun soll: „Das kann es wert sein“ lässt die Wahl offen,
    # nur „gratis“ wird widerlegt.
    {"id": "transfer", "beat": "transfer", "facts": ["nachhilfe"],
     "sentences": [
         "Du bekommst für heute Abend eine Kinokarte geschenkt.",
         "Genau dann könntest du mit Nachhilfe Geld verdienen.",
     ],
     # "genau" (Runde 2, Prüfung 2): Das gestrichelte Gold-Fach „aufgegeben“ kommt erst mit seinem
     # Beispiel („Genau dann könntest du …“), die Rechnung mit „geschenkt“. Vorher ist die Waage leer.
     "cues": {"karte": "Kinokarte", "geschenkt": "geschenkt", "genau": "Genau", "nachhilfe": "Nachhilfe",
              "lohn_da": "Geld"},
     # Fassung v2.1: Luft vor der Wende „Genau dann …“ (Vorbilder: vor einer Wende 1,0-1,5 s).
     # Fassung final (Runde 1): „für heute Abend“ vor „eine Kinokarte“: „bekommst_eine“ klang wie
     # „bekommst deine“ (Ton-Kritik, Whisper).
     "luft": {"geschenkt": 0.7},
     # Fassung final, Politur (Abnahme P2): Der erste Satz des Transfers kam mit 6,4 Silben/s, als
     # schnellster des Videos, genau dort, wo ein neues Beispiel beginnt. ×1,16 (wie die Definition)
     # bringt ihn in die Spanne der übrigen Sätze; mehr klänge gezogen (Abnahme: gedehnte Sätze sind
     # schon etwas weniger periodisch).
     "dehnen": {"Du bekommst": 1.16},
     "betont": ["geschenkt", "dann"]},

    # "gleichung" („kostet“): Erst hier erscheint „Kosten = bezahlt + aufgegeben“, wenn es
    # gesprochen wird (vorher stand es ohne Ton im Bild, Prüfung 2).
    # atem_s: Atempause vor dem Satz fürs Gespräch.
    {"id": "transfer_lohn", "beat": "transfer", "atem_s": 0.9,
     "sentences": [
         "Also kostet dich das Kino diesen Lohn: deine Opportunitätskosten.",
         "Das kann es wert sein.",
         "Gratis ist es nicht.",
     ],
     # "gratis_nicht" (Runde 2): Auf „nicht“ zuckt die Lohntüte neben der Rechnung „0 €“. Das Bild
     # sagt „nicht gratis“, statt den Satz als Formel hinzuschreiben (Prüfung 2).
     # Fassung final (Runde 1, Didaktik P1): Der Begriff fällt auch im Transfer. Vorher verband das Video
     # den Fall Bayern (Begriff) und das Kino (Prinzip) nie; „aufgegeben = Opportunitätskosten“ musste
     # der Zuschauer selbst herstellen. "ok_lohn": Das Gold-Fach bekommt sein Fachwort.
     "cues": {"gleichung": "kostet", "lohn": "Lohn", "ok_lohn": "Opportunitätskosten", "gratis": "Gratis",
              "gratis_nicht": "nicht"},
     # Fassung v2.1: Luft nach der Rechnung, bevor sie bewertet wird („Das kann es wert sein“).
     # Fassung v3: dazu Luft nach „Das kann es wert sein.“ vor der Wende „Gratis ist es nicht.“
     # Sebastian verband beide Sätze mit 0,13 s; die Totale soll vor der Nachfahrt stehen (Bau-Tor).
     "luft": {"Opportunitätskosten": 0.7, "sein": 0.5},
     # Fassung final: der Satz mit dem Begriff (5,7 Silben/s) etwas langsamer.
     "dehnen": {"Also kostet dich": 1.12},
     "betont": ["Lohn", "nicht"]},

    # Beat 12: Satz fürs Gespräch (Linus) = Satz für die Stunde (Bruder). Dann Halten.
    # „kostet“ statt „Preis“: Die Priming-Frage fragt nach Kosten, und „Preis“ ist in WR ein
    # eigener Begriff (Markt).
    # hold_s 2,8 statt 2,0 (Fassung v2.1): Im stehenden Schlussbild steht jetzt der Abspann
    # (Bildnachweis mit Kurzlink, Lizenz des Videos); check verlangt für ihn >= 2,63 s.
    {"id": "satz", "beat": "satz", "hold_s": 2.8,
     "sentences": [
         "Das Beste, was du aufgibst, kostet auch.",
         "Es steht auf keiner Rechnung.",
     ],
     # Fassung final (Runde 1, Didaktik P1): Der Merksatz bindet das Wort „beste“ aus der Definition.
     # „Auch was du aufgibst, kostet“ sagte wörtlich: ALLES Aufgegebene kostet. Wer das auf einen Abend
     # mit zwei Alternativen anwendet, zählt beide zusammen (Ablenker „Spiel und Freibad zusammen“ der
     # Transferfrage). Zweite Hälfte ohne „nur“ (Ton-Kritik P1: der letzte Satz kam gehetzt, 5,3 Silben/s).
     "cues": {"beste": "Beste", "aufgeben": "aufgibst", "kosten2": "kostet", "rechnung": "Rechnung"},
     # Fassung v3: Zwischen den beiden Hälften des Merksatzes steht hörbar Luft. Sebastian (Cartesia)
     # zieht „kostet, es steht …“ in der langsameren Aufnahme zusammen (0,17 s Stille).
     "luft": {"auch": 0.6},
     # Fassung final: der letzte Satz (4,9 Silben/s) unter 4,5 (Tor für Kernsätze).
     "dehnen": {"Es steht auf keiner": 1.14},
     "betont": ["Beste", "keiner"]},
]

# Das Werkstatt-voice.py der Probe liest "pause_after" und "hold_after". Damit es ohne Änderung
# weiterläuft, spiegeln wir die neuen Felder dorthin (eine Quelle, zwei Namen).
for _szene in SCENES:
    if "pause_s" in _szene:
        _szene["pause_after"] = _szene["pause_s"]
    if "hold_s" in _szene:
        _szene["hold_after"] = _szene["hold_s"]


# ------------------------------------------------------------------------------------------
# Selbstprüfung. Läuft nur bei "python build/script.py", nicht beim Import durch voice.py.
# ------------------------------------------------------------------------------------------
LEAD_IN = 0.35          # Stille vor dem ersten Wort (wie voice.py)
LUFT_SPANNE = (0.4, 1.0)    # "luft": hörbar länger als eine Satzpause, kürzer als eine Atempause+
# Pflichtwörter (Kritik 28.10.): Der Hör-Check prüft sie auch an EINZELN ausgeschnittenen Sätzen
# ohne Vorkontext. Auf der ganzen Spur rät Whisper ein undeutliches Wort aus dem Zusammenhang.
# „Lohn“ (Abnahme v2, 28.10.): Schlüsselwort des Transfers; Whisper hörte im Piper-Satz „Lung“ (p 0,74).
# Das Tor läuft in build/voice.py (pruefe_saetze: beim Vertonen und mit --nur-pruefen), nicht in bauen.mjs.
PFLICHTWOERTER = ["Opportunitätskosten", "Saison", "keiner", "Ablöse", "Lohn"]
# Kernsätze (Fassung final, Ton-Kritik P1): Definition und Merksatz kamen schneller als der Rest
# (5,1 bis 5,3 Silben/s bei einem Mittel von 5,5; Vorbilder sprechen Kernsätze langsamer). Das Tor in
# build/voice.py (pruefe_ton) verlangt <= 4,5 Silben/s und nicht schneller als der Median aller Sätze.
# WARNSAETZE: dieselbe Prüfung, nur als Warnung (Brücke und Schluss des Transfers).
KERNSAETZE = ["Das ist der Wert der besten Alternative", "Das Beste, was du aufgibst", "Es steht auf keiner Rechnung"]
WARNSAETZE = ["Jede Entscheidung hat so eine Waage", "Also kostet dich das Kino",
              "Du bekommst für heute Abend"]     # Politur: Eröffnung des Transfers (war 6,4 Silben/s)
MAX_WOERTER = 19        # Kit-Konstante: höchstens 19 Wörter pro Szene (VIDEO-PIPELINE §3)
FRAGE_BIS = 8.0         # Frage muss in den ersten 8 s stehen (§5 „Immer gilt“)
PAUSE_SPANNE = (1.5, 2.5)   # deklarierte Denkpausen (§4 Regeln, DESIGN.md §9)
ATEM_SPANNE = (0.6, 1.1)    # Atempausen: hörbar länger als eine Satzpause, kürzer als G4s 1,2 s
SATZZEICHEN = ".,:;?!…"


def tokens(satz):
    """'45|fünfundvierzig Millionen' -> [('45', 'fünfundvierzig'), ('Millionen', 'Millionen')]"""
    paare = []
    for tok in satz.split():
        anzeige, _, gesprochen = tok.partition("|")
        paare.append((anzeige.strip(SATZZEICHEN), (gesprochen or anzeige).strip(SATZZEICHEN)))
    return paare


def finde_wort(szene, wort):
    """Index des Worts in der ganzen Szene; 'Wort#2' meint das zweite Vorkommen.

    Gilt für Cues UND Betonungen: Ohne '#n' muss das Wort eindeutig sein, sonst landet das Bild
    (oder die Betonung) womöglich auf dem falschen Vorkommen.
    """
    wort, raute, nr = wort.partition("#")
    nr = int(nr or 1)
    woerter = [anzeige for satz in szene["sentences"] for anzeige, _ in tokens(satz)]
    treffer = [i for i, anzeige in enumerate(woerter) if anzeige == wort]
    if len(treffer) < nr:
        raise ValueError(f"Szene {szene['id']}: Wort {wort!r} (Vorkommen {nr}) fehlt")
    if not raute and len(treffer) > 1:
        raise ValueError(f"Szene {szene['id']}: {wort!r} kommt {len(treffer)}-mal vor, "
                         f"bitte '{wort}#n' schreiben")
    return treffer[nr - 1]


def pruefe(tempo=2.3):
    """Gibt (fehler, zeilen je Szene, Gesamtdauer, geschätzte Cue-Zeiten) zurück.

    Die Zeiten sind grobe Schätzungen: jedes Wort gleich lang (1/tempo Sekunden).
    Die echten Zeiten kommen später aus assets/timing.json der Stimme.
    """
    fehler, namen, zeilen, cue_zeiten = [], set(), [], {}
    # Ein Pflichtwort, das in keinem Satz steht (Tippfehler, Beugung), würde das Tor still bestehen.
    alle = {anzeige for s in SCENES for satz in s["sentences"] for anzeige, _ in tokens(satz)}
    fehler += [f"Pflichtwort {p!r} steht in keinem Satz" for p in PFLICHTWOERTER if p not in alle]
    t = LEAD_IN
    for szene in SCENES:
        woerter = [w for satz in szene["sentences"] for w in tokens(satz)]
        if len(woerter) > MAX_WOERTER:
            fehler.append(f"Szene {szene['id']}: {len(woerter)} Wörter > {MAX_WOERTER}")
        start = t
        for name, wort in szene.get("cues", {}).items():
            if name in namen:
                fehler.append(f"Cue-Name {name!r} doppelt (muss im Video eindeutig sein)")
            namen.add(name)
            try:
                cue_zeiten[name] = (szene["id"], wort, start + finde_wort(szene, wort) / tempo)
            except ValueError as e:
                fehler.append(str(e))
        for wort in szene.get("betont", []):
            try:
                finde_wort(szene, wort)
            except ValueError as e:
                fehler.append("betont: " + str(e))
        for frage in szene.get("steigt", []):
            if not any(satz.startswith(frage) for satz in szene["sentences"]):
                fehler.append(f"Szene {szene['id']}: steigende Frage {frage!r} steht nicht im Text")
        pause = szene.get("pause_s", 0)
        if pause and not PAUSE_SPANNE[0] <= pause <= PAUSE_SPANNE[1]:
            fehler.append(f"Szene {szene['id']}: Denkpause {pause} s außerhalb {PAUSE_SPANNE}")
        atem = szene.get("atem_s", 0)
        if atem and not ATEM_SPANNE[0] <= atem <= ATEM_SPANNE[1]:
            fehler.append(f"Szene {szene['id']}: Atempause {atem} s außerhalb {ATEM_SPANNE}")
        for wort, sek in szene.get("luft", {}).items():
            try:
                finde_wort(szene, wort)
            except ValueError as e:
                fehler.append("luft: " + str(e))
            if not LUFT_SPANNE[0] <= sek <= LUFT_SPANNE[1]:
                fehler.append(f"Szene {szene['id']}: luft {sek} s außerhalb {LUFT_SPANNE}")
        t += len(woerter) / tempo + sum(szene.get("luft", {}).values())
        if szene.get("interaction") == "pause_for_answer" and t > FRAGE_BIS:
            fehler.append(f"Frage endet bei {tempo} Wörtern/s ca. {t:.1f} s, Ziel <= {FRAGE_BIS} s")
        t += pause + atem + szene.get("hold_s", 0)
        zeilen.append((szene["id"], len(woerter), start, t))
    return fehler, zeilen, t, cue_zeiten


if __name__ == "__main__":
    import sys

    fehler, zeilen, _, cue_zeiten = pruefe()
    # Die Frage muss auch bei langsamer Stimme (2,0 Wörter/s, Untergrenze von G4) in 8 s stehen.
    # Fassung final (Runde 1): Bei 2,0 Wörtern/s ist das nur noch eine WARNUNG. Seit die Luft vor der
    # Leitfrage steht (Kritik: 0,18 s waren zu knapp), reicht die Schätzung für eine sehr langsame
    # Stimme nicht mehr. Für die echte Stimme prüft bauen.mjs das Tor „Frage steht in den ersten 8 s“
    # an den gemessenen Wortzeiten und bricht dort ab. Wer die Stimme wechselt, sieht die Warnung hier.
    warnungen = [f for f in pruefe(tempo=2.0)[0] if f.startswith("Frage endet")]

    print(f"{'Szene':14s} {'Wörter':>6s} {'Start':>7s} {'Ende':>7s}   (Schätzung bei 2,3 Wörtern/s)")
    for sid, n, a, e in zeilen:
        print(f"{sid:14s} {n:6d} {a:7.1f} {e:7.1f}")
    gesamt = sum(n for _, n, _, _ in zeilen)
    pausen = LEAD_IN + sum(s.get("pause_s", 0) + s.get("atem_s", 0) + s.get("hold_s", 0)
                           + sum(s.get("luft", {}).values()) for s in SCENES)
    print(f"gesamt {gesamt} Wörter; Dauer bei 2,0 / 2,3 / 2,6 Wörtern/s: "
          + " / ".join(f"{gesamt / v + pausen:.1f} s" for v in (2.0, 2.3, 2.6)))
    if "--cues" in sys.argv:
        print(f"\n{'Cue':16s} {'Szene':14s} {'Wort':20s} {'t (s)':>6s}")
        for name, (sid, wort, zeit) in cue_zeiten.items():
            print(f"{name:16s} {sid:14s} {wort:20s} {zeit:6.1f}")
    for f in warnungen:
        print("WARNUNG (gilt erst für eine Stimme unter 2,1 Wörtern/s; Tor in bauen.mjs):", f)
    for f in fehler:
        print("FEHLER:", f)
    raise SystemExit(1 if fehler else 0)
