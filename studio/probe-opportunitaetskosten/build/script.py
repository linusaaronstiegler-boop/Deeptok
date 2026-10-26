# Skript des Probevideos „Opportunitätskosten“.
# Jede Szene ist eine Liste von Sätzen. Ein Token „Anzeige|Gesprochen“ zeigt in den
# Untertiteln die Anzeige (z. B. Ziffern) und gibt der Stimme die gesprochene Form.
# Fakten geprüft am 26.10.2026: Ablöse 45 Mio. € + bis zu 5 Mio. € Bonus,
# Bayern-Vertrag bis Sommer 2023, 344 Tore in 375 Spielen in acht Spielzeiten.

SCENES = [
    {"id": "hook", "sentences": [
        "Sommer 2022|zweitausendzweiundzwanzig.",
        "Bayern München verkauft Robert Lewandowski.",
        "344|Dreihundertvierundvierzig Tore in acht Jahren.",
    ]},
    {"id": "frage", "pause_after": 2.6, "sentences": [
        "Warum gibt man so einen Stürmer ab?",
        "Und was hätte es gekostet, ihn zu behalten?",
    ]},
    {"id": "vertrag", "sentences": [
        "Die meisten sagen: nichts. Er war ja schon da.",
        "Doch sein Vertrag lief nur noch ein Jahr.",
        "Danach hätte er ablösefrei gehen können. Für null Euro.",
    ]},
    {"id": "angebot", "sentences": [
        "Barcelona|Barsselona zahlte 45|fünfundvierzig Millionen Euro.",
        "Wer behält, verzichtet auf dieses Geld.",
    ]},
    {"id": "begriff", "sentences": [
        "Genau das sind Opportunitätskosten:",
        "der Wert der besten Alternative, die du aufgibst.",
    ]},
    {"id": "kurve", "sentences": [
        "Ökonomen zeichnen das als Kurve.",
        "Mehr vom einen heißt immer weniger vom anderen.",
    ]},
    {"id": "irrtum", "sentences": [
        "Man denkt: Was nichts kostet, ist gratis.",
        "Falsch. Auch Behalten hat einen Preis.",
    ]},
    {"id": "satz", "hold_after": 2.2, "sentences": [
        "Satz fürs Gespräch:",
        "Die wahren Kosten stehen nicht auf der Rechnung,",
        "sondern in der Alternative, die du aufgibst.",
    ]},
]
