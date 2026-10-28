"""Werkzeuge der DeepTok-Videofabrik.

Jedes Modul macht genau eine Sache und kennt die anderen kaum:

- konfig:      liest factory/config.json (Deckel und Schwellen)
- zustand:     merkt sich auf dem Git-Branch "factory-state", was in einer Nacht erledigt ist
- sperre:      Datei-Sperren, damit nie mehr als N Chrome-Jobs gleichzeitig laufen
- tore:        Tor G1 (Sperrwörter, persönliche Daten)
- hoercheck:   Tor G4 (Wortfehlerrate, Lautheit, Stillen, Sprechtempo)
- hyperframes: dünne Hülle um "npx hyperframes check/render"
- stimme:      Stimm-Adapter (ElevenLabs, Inworld, Cartesia, Azure), Markup und Lexikon
- bilder:      frei lizenzierte Fotos und Clips von Wikimedia Commons: Lizenz und Lizenz-Vorlagen
               prüfen, Credits, Duoton/Graustufen/Freistellen

fabrik.py ist nur die Kommandozeile davor.
"""

# Exit-Codes der Kommandozeile. Sie stehen hier, damit jedes Modul dieselben Zahlen benutzt.
# Der Agent, der fabrik.py aufruft, liest nur den Exit-Code und eine kurze Meldung.
EXIT_OK = 0
EXIT_FEHLER = 1          # Tor nicht bestanden oder allgemeiner Fehler
EXIT_EINGABE = 2         # falscher Aufruf, kaputte Datei, doppelte ID
EXIT_BESETZT = 3         # ein anderer Lauf hat die Nacht (oder wir haben sie verloren)
EXIT_PAUSE = 4           # factory/PAUSE existiert
EXIT_DECKEL = 5          # ein Deckel aus config.json ist erreicht (z. B. max_reparaturen)


class FabrikFehler(Exception):
    """Fehler mit Exit-Code. fabrik.py fängt ihn ab und beendet sich mit genau diesem Code."""

    def __init__(self, meldung: str, code: int = EXIT_FEHLER):
        super().__init__(meldung)
        self.code = code
