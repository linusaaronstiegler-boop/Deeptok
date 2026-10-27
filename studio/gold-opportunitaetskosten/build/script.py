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
     "cues": {"bcn": "Barcelona", "lewa": "Lewandowski", "verkaufen": "verkaufen",
              "behalten": "behalten#1", "frage": "kostet", "optionen": "behalten#2"},
     # "behalten#1": Nur das erste „behalten“ wird betont. Im Fragesatz liegt der Ton auf „kostet“.
     "betont": ["verkaufen", "behalten#1", "kostet"]},

    # Beat 3: der Irrtum der Serie als naheliegende Antwort, MIT seinem Grund („nur das bezahlt
    # Bayern“). Ein Widerlegungstext wirkt, wenn der Zuschauer seine eigene Begründung wiedererkennt.
    # „die Antwort“ steht da, weil man einen Doppelpunkt nicht hört: Ohne sie klänge der Satz
    # wie „Naheliegend ist nur sein Gehalt“.
    {"id": "naheliegend", "beat": "naheliegend",
     "sentences": [
         "Naheliegend ist die Antwort: nur sein Gehalt.",
         "Denn nur das bezahlt Bayern.",
         "Dafür schießt er Tore.",
     ],
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
         "Danach geht er ablösefrei: Bayern bekommt nichts.",
     ],
     # „0 €“ erscheint schon auf „ablösefrei“ (nicht erst auf „nichts“), damit es 1,2 s steht,
     # bevor die Kamera in Beat 5 losfährt (Kamera steht in der Lesezeit, DESIGN.md §5).
     # Der Vertrag ist ein Gegenstand (Blatt mit Zeitleiste). "verlaengern_an": Die gestrichelte
     # Verlängerung erscheint auf "Verlängern" und erlischt auf "nicht".
     # Runde 2: Die Zeitleiste ist auf das Vertragsblatt gedruckt. "danach" („Danach“): Die Welt fährt
     # näher an das Blatt (Detail: was nach dem Vertrag kommt). "nichts": Stempel „0 €“ auf dem Wort,
     # das ihn nennt („Bayern bekommt nichts“), neben dem Stempel „ablösefrei“.
     "cues": {"vertrag": "Vertrag", "saison": "Saison", "verlaengern_an": "Verlängern",
              "verlaengern": "nicht", "danach": "Danach", "frei": "ablösefrei", "nichts": "nichts"},
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
         "Verkaufen bringt 45|fünfundvierzig Millionen Ablöse, Behalten keinen Cent.",
     ],
     # Landung auf „Ablöse“, nicht auf „Cent“: So hat die Waage 1,7 s Zeit auszuschwingen,
     # bevor in Beat 6b das Etikett „entgangen“ kommt (höchstens 2 Bewegungen zugleich).
     # "cent" (Runde 2, Prüfung 2): Auf "keinen Cent" kommt der Stempel "0 €" an das Schild
     # "Behalten". Der Vergleich der beiden Ausgänge steht damit als Bildpaar da.
     "cues": {"falsch": "nicht", "landung": "Ablöse", "cent": "Cent"},
     "betont": ["nicht", "Verkaufen", "Behalten"],
     "steigt": ["Nur sein Gehalt?"]},

    # Beat 6b: der Schluss aus dem Vergleich. Das Paar „entgangen/bezahlt“ ist der Kern.
    # Auf „genauso“ bekommt der Geist Gewicht: Die Waage schwingt auf waagerecht.
    # Auf „bezahltes“ verwandelt sich das durchgestrichene Schild in die richtige Antwort.
    {"id": "entgangen", "beat": "widerlegung",
     "sentences": [
         "Entgangenes Geld fehlt genauso wie bezahltes.",
     ],
     "cues": {"entgangen": "Entgangenes", "gewicht": "genauso", "korrektur": "bezahltes"},
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
    {"id": "verkauf", "beat": "aufloesung", "facts": ["datum", "kahn_summe"], "atem_s": 0.7,
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
         "Auch Verkaufen hat Opportunitätskosten: eine Saison Lewandowski.",
     ],
     "cues": {"dreh": "Verkaufen", "ok_verkauf": "Opportunitätskosten", "abflug_spieler": "eine",
              "ok_saison": "Saison"},
     "betont": ["Verkaufen", "Saison"]},

    # Beat 9: das Modell wird allgemein. Harter Schnitt auf das Nomen „Waage“ (neues Thema: jede
    # Entscheidung). Ab hier Identität Diagramm statt Atlas; zwei Identitäten nie im selben Bild.
    {"id": "modell", "beat": "modell",
     "sentences": [
         "Jede Entscheidung hat so eine Waage.",
     ],
     "cues": {"modell": "Waage"},
     "betont": ["Jede"]},

    # Beat 10+11: Transfer in den Alltag. Erst ab hier „du“. „für heute Abend“ und „Genau dann“
    # machen den Zeitkonflikt hörbar: Beides zugleich geht nicht, sonst gäbe es nichts aufzugeben.
    # Kein Rat, was man tun soll: „Das kann es wert sein“ lässt die Wahl offen,
    # nur „gratis“ wird widerlegt.
    {"id": "transfer", "beat": "transfer", "facts": ["nachhilfe"],
     "sentences": [
         "Du bekommst eine Kinokarte für heute Abend geschenkt.",
         "Genau dann könntest du mit Nachhilfe Geld verdienen.",
     ],
     # "genau" (Runde 2, Prüfung 2): Das gestrichelte Gold-Fach „aufgegeben“ kommt erst mit seinem
     # Beispiel („Genau dann könntest du …“), die Rechnung mit „geschenkt“. Vorher ist die Waage leer.
     "cues": {"karte": "Kinokarte", "geschenkt": "geschenkt", "genau": "Genau", "nachhilfe": "Nachhilfe",
              "lohn_da": "Geld"},
     "betont": ["geschenkt", "dann"]},

    # "gleichung" („kostet“): Erst hier erscheint „Kosten = bezahlt + aufgegeben“, wenn es
    # gesprochen wird (vorher stand es ohne Ton im Bild, Prüfung 2).
    # atem_s: Atempause vor dem Satz fürs Gespräch.
    {"id": "transfer_lohn", "beat": "transfer", "atem_s": 0.9,
     "sentences": [
         "Also kostet dich das Kino diesen Lohn.",
         "Das kann es wert sein.",
         "Gratis ist es nicht.",
     ],
     # "gratis_nicht" (Runde 2): Auf „nicht“ zuckt die Lohntüte neben der Rechnung „0 €“. Das Bild
     # sagt „nicht gratis“, statt den Satz als Formel hinzuschreiben (Prüfung 2).
     "cues": {"gleichung": "kostet", "lohn": "Lohn", "gratis": "Gratis", "gratis_nicht": "nicht"},
     "betont": ["Lohn", "nicht"]},

    # Beat 12: Satz fürs Gespräch (Linus) = Satz für die Stunde (Bruder). Dann Halten.
    # „kostet“ statt „Preis“: Die Priming-Frage fragt nach Kosten, und „Preis“ ist in WR ein
    # eigener Begriff (Markt).
    {"id": "satz", "beat": "satz", "hold_s": 2.0,
     "sentences": [
         "Auch was du aufgibst, kostet.",
         "Es steht nur auf keiner Rechnung.",
     ],
     "cues": {"aufgeben": "aufgibst", "kosten2": "kostet", "rechnung": "Rechnung"},
     "betont": ["aufgibst", "keiner"]},
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
        t += len(woerter) / tempo
        if szene.get("interaction") == "pause_for_answer" and t > FRAGE_BIS:
            fehler.append(f"Frage endet bei {tempo} Wörtern/s ca. {t:.1f} s, Ziel <= {FRAGE_BIS} s")
        t += pause + atem + szene.get("hold_s", 0)
        zeilen.append((szene["id"], len(woerter), start, t))
    return fehler, zeilen, t, cue_zeiten


if __name__ == "__main__":
    import sys

    fehler, zeilen, _, cue_zeiten = pruefe()
    # Die Frage muss auch bei langsamer Stimme (2,0 Wörter/s, Untergrenze von G4) in 8 s stehen.
    fehler += [f for f in pruefe(tempo=2.0)[0] if f.startswith("Frage endet")]

    print(f"{'Szene':14s} {'Wörter':>6s} {'Start':>7s} {'Ende':>7s}   (Schätzung bei 2,3 Wörtern/s)")
    for sid, n, a, e in zeilen:
        print(f"{sid:14s} {n:6d} {a:7.1f} {e:7.1f}")
    gesamt = sum(n for _, n, _, _ in zeilen)
    pausen = LEAD_IN + sum(s.get("pause_s", 0) + s.get("atem_s", 0) + s.get("hold_s", 0) for s in SCENES)
    print(f"gesamt {gesamt} Wörter; Dauer bei 2,0 / 2,3 / 2,6 Wörtern/s: "
          + " / ".join(f"{gesamt / v + pausen:.1f} s" for v in (2.0, 2.3, 2.6)))
    if "--cues" in sys.argv:
        print(f"\n{'Cue':16s} {'Szene':14s} {'Wort':20s} {'t (s)':>6s}")
        for name, (sid, wort, zeit) in cue_zeiten.items():
            print(f"{name:16s} {sid:14s} {wort:20s} {zeit:6.1f}")
    for f in fehler:
        print("FEHLER:", f)
    raise SystemExit(1 if fehler else 0)
