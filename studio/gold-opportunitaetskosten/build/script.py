# Skript des Goldstandards „Opportunitätskosten: Warum verkauft Bayern seinen besten Stürmer?“
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
#     der Stimm-Adapter übersetzt es je Anbieter).
#   - "facts": IDs aus ../fakten.json für jede Zahl und jede Behauptung der Szene.
#
# Fakten geprüft am 27.10.2026 (Quellen, Daten und Zitate in ../fakten.json):
#   Ablöse 45 Mio. € fest + 5 Mio. € variabel (FC Barcelona, 19.07.2022),
#   Bayern-Vertrag bis 30.06.2023 und keine Verlängerung (Salihamidžić, t-online/dpa, 14.05.2022),
#   ablösefrei nach Vertragsende (bpb, Bosman-Urteil).
#
# Prüfen:  python build/script.py   (Cues, Wortzahl je Szene, geschätzte Dauer, Frage in 8 s)

SCENES = [
    # Beat 1+2: Frage in den ersten 8 s, danach Denkpause. Die drei Antworten stehen im Bild
    # (Preisschilder an der Spieler-Figur, keine Pillen-Chips: DESIGN.md BANNED 12). Die Stimme
    # liest sie NICHT vor, sonst liest und hört man denselben Text.
    {"id": "hook", "beat": "frage", "interaction": "pause_for_answer", "pause_s": 2.2,
     "facts": ["datum", "dilemma", "behalten"],
     "sentences": [
         "Barcelona|Barsselona will Lewandowski.",
         "Bayern kann verkaufen oder behalten.",
         "Was kostet es, ihn zu behalten?",
     ],
     "cues": {"bcn": "Barcelona", "lewa": "Lewandowski", "verkaufen": "verkaufen",
              "behalten": "behalten#1", "frage": "kostet", "optionen": "behalten#2"},
     "betont": ["verkaufen", "behalten", "kostet"]},

    # Beat 3: der Irrtum der Serie als naheliegende Antwort, ohne Wertung.
    {"id": "naheliegend", "beat": "naheliegend",
     "sentences": [
         "Naheliegend ist: nur sein Gehalt.",
         "Dafür bekommt Bayern seine Tore.",
     ],
     "cues": {"waage": "Naheliegend", "gehalt": "Gehalt", "tore": "Tore"},
     "betont": ["Gehalt"]},

    # Beat 4: Gegenbefund, Teil 1. Warum Behalten hier die Ablöse endgültig kostet:
    # nach dem 30.06.2023 bekäme Bayern nichts mehr.
    {"id": "vertrag", "beat": "gegenbefund", "facts": ["vertrag", "verlaengern", "frei"],
     "sentences": [
         "Doch sein Vertrag läuft nur bis Juni 2023|zweitausenddreiundzwanzig.",
         "Verlängern will er nicht.",
         "Danach kann er ablösefrei gehen.",
     ],
     "cues": {"vertrag": "Vertrag", "juni": "2023", "verlaengern": "nicht", "frei": "ablösefrei"},
     "betont": ["Juni", "ablösefrei"]},

    # Beat 5: Gegenbefund, Teil 2. Die gesuchte Größe bekommt ihre Zahl.
    {"id": "angebot", "beat": "gegenbefund", "facts": ["abl", "abl2"],
     "sentences": [
         "Barcelona|Barsselona bietet jetzt 45|fünfundvierzig Millionen Euro.",
     ],
     "cues": {"angebot": "Barcelona", "zahl": "45"},
     "betont": ["jetzt", "45"]},

    # Beat 6: Widerlegung. Nur hier ist Rot erlaubt (Durchstrich auf dem Schild „Nur sein Gehalt“).
    # Das Geld fliegt von Barcelona nach München (Richtung der Ablöse) und kippt die Waage.
    {"id": "widerlegung", "beat": "widerlegung", "facts": ["abl"],
     "sentences": [
         "Nur das Gehalt? Das stimmt nicht.",
         "Wer ihn behält, verzichtet auf dieses Geld.",
         "Entgangenes Geld fehlt genauso wie ausgegebenes.",
     ],
     "cues": {"falsch": "nicht", "landung": "Geld#1", "entgangen": "Entgangenes",
              "ausgegeben": "ausgegebenes"},
     "betont": ["nicht", "verzichtet", "genauso"]},

    # Beat 7: Begriff erst jetzt, nach dem Beispiel.
    {"id": "begriff", "beat": "begriff", "facts": ["begriff"],
     "sentences": [
         "Ökonomen nennen das Opportunitätskosten.",
         "Das ist der Wert der besten Alternative, die du aufgibst.",
     ],
     "cues": {"begriff": "Opportunitätskosten", "alternative": "Alternative", "aufgibst": "aufgibst"},
     "betont": ["Opportunitätskosten", "aufgibst"]},

    # Beat 8: Auflösung des Falls. Auch Verkaufen hat Opportunitätskosten: der Spieler fliegt
    # von München nach Barcelona (Richtung des Spielers), zurück bleibt die leere Schale.
    {"id": "verkauf", "beat": "aufloesung", "facts": ["datum", "saison"],
     "sentences": [
         "Im Juli 2022|zweitausendzweiundzwanzig nimmt Bayern das Geld.",
         "Der Preis: eine Saison Lewandowski.",
     ],
     # Nur die Landung ist ein Cue; den Abflug rechnet der Bau zurück (Landung - Flugzeit),
     # wie beim Geld im Spike. So startet der Spieler gegen Ende von "nimmt Bayern das Geld".
     "cues": {"juli": "Juli", "genommen": "Geld", "preis": "Preis", "landung_spieler": "Saison"},
     "betont": ["Preis"]},

    # Beat 9: das Modell wird allgemein. Harter Schnitt auf das Nomen „Waage“ (neues Thema: jede
    # Entscheidung). Ab hier Identität Diagramm statt Atlas; zwei Identitäten nie im selben Bild.
    {"id": "modell", "beat": "modell",
     "sentences": [
         "Jede Entscheidung hat so eine Waage.",
     ],
     "cues": {"modell": "Waage"},
     "betont": ["Jede"]},

    # Beat 10+11: Transfer in den Alltag eines 15-Jährigen. Kein Rat, was er tun soll:
    # „Kann sich lohnen“ lässt die Wahl offen, nur „gratis“ wird widerlegt.
    {"id": "transfer", "beat": "transfer", "facts": ["nachhilfe"],
     "sentences": [
         "Ein Freund schenkt dir eine Kinokarte.",
         "Stattdessen könntest du mit Nachhilfe Geld verdienen.",
     ],
     "cues": {"karte": "Kinokarte", "nachhilfe": "Nachhilfe", "lohn_da": "verdienen"}},

    {"id": "transfer_lohn", "beat": "transfer",
     "sentences": [
         "Dann kostet dich das Kino diesen Lohn.",
         "Kann sich lohnen.",
         "Gratis ist es nicht.",
     ],
     "cues": {"lohn": "Lohn", "lohnen": "lohnen", "gratis": "Gratis"},
     "betont": ["Lohn", "nicht"]},

    # Beat 12: Satz fürs Gespräch (Linus) = Satz für die Stunde (Bruder). Dann Halten.
    {"id": "satz", "beat": "satz", "hold_s": 2.0,
     "sentences": [
         "Was du aufgibst, ist auch ein Preis.",
         "Er steht nur auf keiner Rechnung.",
     ],
     "cues": {"aufgeben": "aufgibst", "preis2": "Preis", "rechnung": "Rechnung"},
     "betont": ["Preis", "keiner"]},
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
SATZZEICHEN = ".,:;?!…"


def tokens(satz):
    """'45|fünfundvierzig Millionen' -> [('45', 'fünfundvierzig'), ('Millionen', 'Millionen')]"""
    paare = []
    for tok in satz.split():
        anzeige, _, gesprochen = tok.partition("|")
        paare.append((anzeige.strip(SATZZEICHEN), (gesprochen or anzeige).strip(SATZZEICHEN)))
    return paare


def finde_cue(szene, wort):
    """Position (Satz, Wort) eines Cue-Worts; 'Wort#2' meint das zweite Vorkommen."""
    wort, raute, nr = wort.partition("#")
    nr = int(nr or 1)
    treffer = [(si, wi) for si, satz in enumerate(szene["sentences"])
               for wi, (anzeige, _) in enumerate(tokens(satz)) if anzeige == wort]
    if len(treffer) < nr:
        raise ValueError(f"Szene {szene['id']}: Cue-Wort {wort!r} (Vorkommen {nr}) fehlt")
    # Ohne "#n" muss das Wort eindeutig sein, sonst landet das Bild womöglich zu früh.
    if not raute and len(treffer) > 1:
        raise ValueError(f"Szene {szene['id']}: {wort!r} kommt {len(treffer)}-mal vor, "
                         f"bitte '{wort}#n' schreiben")
    return treffer[nr - 1]


def pruefe(tempo=2.3):
    fehler, namen, zeilen = [], set(), []
    t = LEAD_IN
    for szene in SCENES:
        woerter = [w for satz in szene["sentences"] for w in tokens(satz)]
        if len(woerter) > MAX_WOERTER:
            fehler.append(f"Szene {szene['id']}: {len(woerter)} Wörter > {MAX_WOERTER}")
        for name, wort in szene.get("cues", {}).items():
            if name in namen:
                fehler.append(f"Cue-Name {name!r} doppelt (muss im Video eindeutig sein)")
            namen.add(name)
            try:
                finde_cue(szene, wort)
            except ValueError as e:
                fehler.append(str(e))
        start = t
        t += len(woerter) / tempo
        if szene.get("interaction") == "pause_for_answer" and t > FRAGE_BIS:
            fehler.append(f"Frage endet bei ca. {t:.1f} s, Ziel <= {FRAGE_BIS} s")
        t += szene.get("pause_s", 0) + szene.get("hold_s", 0)
        zeilen.append((szene["id"], len(woerter), start, t))
    return fehler, zeilen, t


if __name__ == "__main__":
    fehler, zeilen, _ = pruefe()
    print(f"{'Szene':14s} {'Wörter':>6s} {'Start':>7s} {'Ende':>7s}   (Schätzung bei 2,3 Wörtern/s)")
    for sid, n, a, e in zeilen:
        print(f"{sid:14s} {n:6d} {a:7.1f} {e:7.1f}")
    gesamt = sum(n for _, n, _, _ in zeilen)
    pausen = LEAD_IN + sum(s.get("pause_s", 0) + s.get("hold_s", 0) for s in SCENES)
    print(f"gesamt {gesamt} Wörter; Dauer bei 2,0 / 2,3 / 2,6 Wörtern/s: "
          + " / ".join(f"{gesamt / v + pausen:.1f} s" for v in (2.0, 2.3, 2.6)))
    for f in fehler:
        print("FEHLER:", f)
    raise SystemExit(1 if fehler else 0)
