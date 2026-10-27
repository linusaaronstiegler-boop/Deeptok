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
    {"id": "hook", "beat": "frage", "interaction": "pause_for_answer", "pause_s": 2.5,
     "facts": ["will", "datum", "dilemma", "behalten"],
     "sentences": [
         "Barcelona|Barsselona will Lewandowski.",
         "Bayern kann verkaufen oder behalten.",
         "Was kostet es, ihn zu behalten?",
     ],
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
     "cues": {"waage": "Naheliegend", "gehalt": "Gehalt", "bezahlt": "bezahlt", "tore": "Tore"},
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
     "cues": {"vertrag": "Vertrag", "saison": "Saison", "verlaengern": "nicht",
              "frei": "ablösefrei"},
     "betont": ["eine", "nichts"]},

    # Beat 5: Gegenbefund, Teil 2. Erst JETZT fällt das Geld (Münzstapel, Gold) auf Barcelona,
    # auf dem Wort, das es nennt („45“). „Bayern“ im Satz schiebt die Zahl nach hinten, damit die
    # Kamerafahrt (1,4 s ab „Barcelona“) vor dem Fallen endet.
    {"id": "angebot", "beat": "gegenbefund", "facts": ["abl", "abl2"],
     "sentences": [
         "Barcelona|Barsselona bietet Bayern jetzt 45|fünfundvierzig Millionen Euro.",
     ],
     "cues": {"angebot": "Barcelona", "zahl": "45"},
     "betont": ["jetzt", "45"]},

    # Beat 6a: Widerlegung. Nur hier ist Rot erlaubt (Durchstrich auf dem Schild „Nur sein Gehalt“).
    # Statt den Lehrsatz zu behaupten, vergleicht der zweite Satz die beiden Ausgänge.
    # Das Geld fliegt dabei von Barcelona nach München (Richtung der Ablöse) und landet auf der
    # Kosten-Schale des Behaltens; die Waage schwingt von „Behalten“ auf waagerecht.
    {"id": "widerlegung", "beat": "widerlegung", "facts": ["abl", "frei"],
     "sentences": [
         "Nur sein Gehalt? Das stimmt nicht.",
         "Verkaufen bringt 45|fünfundvierzig Millionen Ablöse, Behalten keinen Cent.",
     ],
     # Landung auf „Ablöse“, nicht auf „Cent“: So hat die Waage 1,7 s Zeit auszuschwingen,
     # bevor in Beat 6b das Etikett „entgangen“ kommt (höchstens 2 Bewegungen zugleich).
     "cues": {"falsch": "nicht", "landung": "Ablöse"},
     "betont": ["nicht", "Verkaufen", "Behalten"],
     "steigt": ["Nur sein Gehalt?"]},

    # Beat 6b: der Schluss aus dem Vergleich. Das Paar „entgangen/bezahlt“ ist der Kern.
    # Auf „bezahltes“ verwandelt sich das durchgestrichene Schild in die richtige Antwort.
    {"id": "entgangen", "beat": "widerlegung",
     "sentences": [
         "Entgangenes Geld fehlt genauso wie bezahltes.",
     ],
     "cues": {"entgangen": "Entgangenes", "korrektur": "bezahltes"},
     "betont": ["genauso"]},

    # Beat 7: Begriff erst jetzt, nach dem Beispiel. „man“ statt „du“: Noch ist es Bayerns Fall.
    {"id": "begriff", "beat": "begriff", "facts": ["begriff"],
     "sentences": [
         "Ökonomen nennen dieses Geld Opportunitätskosten.",
         "Das ist der Wert der besten Alternative, die man aufgibt.",
     ],
     "cues": {"begriff": "Opportunitätskosten", "alternative": "Alternative", "aufgibt": "aufgibt"},
     "betont": ["Opportunitätskosten", "aufgibt"]},

    # Beat 8: Auflösung des Falls. Der neue Begriff wird sofort angewendet: Auch Verkaufen hat
    # Opportunitätskosten. Der Spieler fliegt von München nach Barcelona (Richtung des Spielers),
    # das Etikett „Opportunitätskosten“ wandert vom Geld an die leere Nutzen-Schale.
    {"id": "verkauf", "beat": "aufloesung", "facts": ["datum", "kahn_summe", "saison"],
     "sentences": [
         "Im Juli nimmt Bayern das Geld.",
         "Auch Verkaufen hat Opportunitätskosten: eine Saison Lewandowski.",
     ],
     # Nur die Landung ist ein Cue; den Abflug rechnet der Bau zurück (Landung - Flugzeit),
     # wie beim Geld im Spike. So hebt der Spieler etwa auf „Opportunitätskosten“ ab.
     "cues": {"juli": "Juli", "genommen": "Geld", "ok_verkauf": "Opportunitätskosten",
              "landung_spieler": "Lewandowski"},
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
     "cues": {"karte": "Kinokarte", "geschenkt": "geschenkt", "nachhilfe": "Nachhilfe",
              "lohn_da": "Geld"},
     "betont": ["geschenkt", "dann"]},

    {"id": "transfer_lohn", "beat": "transfer",
     "sentences": [
         "Also kostet dich das Kino diesen Lohn.",
         "Das kann es wert sein.",
         "Gratis ist es nicht.",
     ],
     "cues": {"lohn": "Lohn", "gratis": "Gratis"},
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
        t += len(woerter) / tempo
        if szene.get("interaction") == "pause_for_answer" and t > FRAGE_BIS:
            fehler.append(f"Frage endet bei {tempo} Wörtern/s ca. {t:.1f} s, Ziel <= {FRAGE_BIS} s")
        t += pause + szene.get("hold_s", 0)
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
    pausen = LEAD_IN + sum(s.get("pause_s", 0) + s.get("hold_s", 0) for s in SCENES)
    print(f"gesamt {gesamt} Wörter; Dauer bei 2,0 / 2,3 / 2,6 Wörtern/s: "
          + " / ".join(f"{gesamt / v + pausen:.1f} s" for v in (2.0, 2.3, 2.6)))
    if "--cues" in sys.argv:
        print(f"\n{'Cue':16s} {'Szene':14s} {'Wort':20s} {'t (s)':>6s}")
        for name, (sid, wort, zeit) in cue_zeiten.items():
            print(f"{name:16s} {sid:14s} {wort:20s} {zeit:6.1f}")
    for f in fehler:
        print("FEHLER:", f)
    raise SystemExit(1 if fehler else 0)
