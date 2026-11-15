# Trend-Radar

Wöchentlicher Blick auf die Konkurrenz: Welche Horror-Storys laufen gerade, mit welchem Hook, welcher Länge, als Serie oder einzeln, mit welchem Sound? `radar.py` wertet eine feste Liste von Hashtags und Konten aus (`quellen.json`) und schreibt nach `horror/docs/trends/`:

- `radar-JJJJ-MM-TT.json`: alle Rohwerte je Video (Aufrufe, Likes, Kommentare, Shares, Länge, Datum, Sound, erkannte Muster),
- `radar-JJJJ-MM-TT.md`: der automatische Wochenbericht mit Tabellen.

Den Bericht mit Deutung und Regeln (z. B. `bericht-2026-11-15.md`) schreibt Claude daraus von Hand.

## Warum TikTok nicht automatisch abgerufen wird

Stand der Prüfung: 15.11.2026.

- **TikToks Nutzungsbedingungen** verbieten, Daten „using any automated system or software“ auszulesen, außer mit schriftlicher Erlaubnis (laut Vergleich der Fassungen vom März und Juli 2026 unverändert, Quelle: conductatlas.com).
- **tiktok.com/robots.txt** sperrt KI-Agenten wie `Claude-User`, `ClaudeBot` und `GPTBot` für die ganze Seite. Für alle anderen Bots sind `/embed/@`, `/embed/v2` und `/search?` gesperrt.
- **Das TikTok Creative Center** (heute `ads.tiktok.com/creative/creativeCenter/trends`) erlaubt laut robots.txt alles. Ein Headless-Browser bekommt dort aber HTTP 403, und die Daten kommen nur über signierte Abfragen der Seite. Es ist also nur für die Hand gedacht.

Deshalb macht das Skript **keinen einzigen Netzabruf bei TikTok**. Linus öffnet die öffentlichen Seiten im eigenen Browser und speichert sie. Das Skript liest die Dateien nur aus.

## Ablauf pro Woche (etwa 15 Minuten von Hand)

1. **Ordner anlegen:** `horror/tools/trends/eingang/JJJJ-MM-TT/`. Er steht in `.gitignore`, denn gespeicherte Seiten sind fremde Inhalte.
2. **Profile speichern:** Im Desktop-Browser jedes Konto aus `quellen.json` öffnen, z. B. `https://www.tiktok.com/@dogeok`.
   - Einmal scrollen, bis das Raster geladen ist.
   - Mit Strg+S als **„Webseite, vollständig“** speichern.
   - Das Skript liest daraus Follower und für jedes Video im Raster die Aufrufe.
3. **Hashtags speichern:** jeden Hashtag öffnen, z. B. `https://www.tiktok.com/tag/inthistown`, und genauso speichern.
4. **Videoseiten speichern:** die 3–5 auffälligsten Videos der Woche öffnen (Klick aufs Video, dann Adresse `…/video/…`) und speichern. Nur die Videoseite liefert Likes, Shares, Kommentare, Länge und den **Sound-Namen**.
5. **Skript starten:**
   ```bash
   [ -f /opt/deeptok/env.sh ] && . /opt/deeptok/env.sh
   python horror/tools/trends/radar.py --eingang horror/tools/trends/eingang/2026-11-22
   ```
   - Der Lauf vergleicht automatisch mit dem letzten `radar-*.json` im Zielordner. Damit füllt sich der Abschnitt „Was steigt, was fällt“.
   - Ohne Liste aus `quellen.json`, also alle gespeicherten Videos: `--alle`.

Das Skript liest auch Embed-Seiten (`/embed/@konto`, `/embed/tag/…`), wie sie die Vorrecherche vom 14.11.2026 gesammelt hat.

## YouTube Shorts (automatisch, offiziell)

Über die **YouTube Data API v3** sucht das Skript je Suchbegriff die meistgesehenen kurzen Videos der letzten 14 Tage und liest die letzten Uploads der Kanäle aus `quellen.json`.

- **Kosten:** 0 €.
  - Laut YouTube-Doku (abgerufen 15.11.2026) hat die Suche einen eigenen Topf mit 100 Aufrufen pro Tag. Alle anderen Abfragen kosten je 1 Einheit von 10.000 pro Tag.
  - Ein Lauf mit der jetzigen Liste braucht 4 Suchen und höchstens 10 weitere Einheiten.
  - `--youtube-trocken` zeigt den Plan, ohne etwas abzurufen.
- **Schlüssel anlegen** (einmalig, Linus): Google Cloud Console → „APIs & Services“ → „YouTube Data API v3“ aktivieren → „Credentials“ → „API key“. Den Schlüssel auf die YouTube Data API beschränken.
- **Am PC:** `export YOUTUBE_API_KEY=…`, dann `python radar.py --eingang … --youtube`.
- **In der Cloud:**
  - Den Schlüssel als Network Secret für den Host `www.googleapis.com` mit dem Header `X-Goog-Api-Key` hinterlegen.
  - Dann mit `YOUTUBE_API_KEY=platzhalter python radar.py … --youtube` starten. Der Proxy setzt den echten Schlüssel ein; deshalb schickt das Skript ihn im Header und nicht in der URL.
  - Der Host muss in der Umgebung erlaubt sein.
- **Was YouTube liefert:** Aufrufe, Likes, Kommentare, Länge und Datum. Shares und Sounds liefert es nicht.
- **Was das Skript dort nicht abruft:** YouTube-Seiten selbst. Die YouTube-AGB verbieten Scraping, robots.txt sperrt `/results` und `/feeds/videos.xml`.

## Was das Skript erkennt

| Feld | Woher | Grenzen |
|---|---|---|
| Datum | aus der TikTok-Video-ID (obere 32 Bit = Sekunden seit 1970) | exakt |
| Aufrufe pro Tag | Aufrufe ÷ Alter in Tagen, mindestens 1 Tag | benachteiligt alte Videos |
| Format | Beschreibung: Zusammenschnitt/Edit, Spiel-Werbung, Gameplay, sonst Story | nur Stichwörter |
| Teil | „Part 2“, „pt 3“, „(2/3)“, „3 of 3“; „Part 2?“ und „Folge für Part 2“ zählen als Teil 1 mit Köder | unbeschriftete Serien bleiben „einzel“ |
| Hook-Muster | erster Satz der Beschreibung ohne Hashtags | viele Konten posten ohne Text (z. B. concet5612) |
| Motive, Genre | Stichwortlisten im Skript; Rückfall für Konten ohne Text: `konto_genre` in `quellen.json` | grob, für Deutungen immer die Videos ansehen |
| Sound | nur von Videoseiten (`music.title`, `music.authorName`, `original`) | „original sound“ heißt: Ton im Video eingebacken, kein Bibliothekstitel |

Für Länge, Serie, Hook, Motiv und Genre zählen nur Videos im Format „Story“. Spiel-Werbung und Zusammenschnitte würden die Werte sonst verzerren.

## Prüfen

```bash
python horror/tools/trends/radar.py --selbsttest       # Parser an eingebauten Mini-Beispielen
python horror/tools/trends/radar.py --youtube-trocken  # geplante YouTube-Abfragen und Kontingent
```

Nur Python-Standardbibliothek, ab Python 3.10. Die Bewertung der Werkzeuge (Creative Center, Google Trends, Exolyt, Tokchart, Social Blade …) steht in `horror/docs/trends/bericht-2026-11-15.md`, Abschnitt 1.
