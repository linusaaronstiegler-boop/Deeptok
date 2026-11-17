# Release: Was Claude beim Veröffentlichen übernehmen kann

Stand 16.11.2026, Abschnitt 6 (Takt, Termine, Cross-Posting, Stimm-Tarif) ergänzt am 17.11.2026. Alle Angaben aus offiziellen Entwickler-Dokumentationen, Hilfeseiten der Anbieter und Websuche, gelesen am 16.11.2026. Von tiktok.com selbst wurde nichts abgerufen: TikTok-Hilfeseiten und Creator Academy stehen hier nur als Auszug aus der Websuche. `developers.tiktok.com/robots.txt` antwortete am 16.11.2026 mit HTTP 404, es gibt dort also keine Sperrregeln. Die Doku-Seiten wurden einzeln gelesen.
**(S)** eigene Schätzung, **(u)** unbelegt, **(A)** Arbeitsannahme zum Testen. Quellen-Kürzel am Ende.

## Urteil

Der beste legale Weg ohne dein Passwort führt über **Metricool**, Gratis-Plan, mit dem **offiziellen Metricool-Connector für claude.ai** („Anthropic verified“, seit Juni 2026 im Verzeichnis [M7]). Du verbindest einmal dein TikTok-Konto mit Metricool und Metricool mit claude.ai, beides per Anmeldung bei dir. Danach plant Claude jeden Teil mit Video, Bildunterschrift und Uhrzeit. Metricool veröffentlicht automatisch, auch auf einem **persönlichen** Konto [M3], und Claude kann die Zahlen je Video selbst lesen [M6].

Eine eigene TikTok-App lohnt sich nicht. TikTok lässt Apps für den Eigengebrauch nicht zu, und eine ungeprüfte App darf nur auf ein privat gestelltes Konto posten, sichtbar nur für dich [T5][T6].

YouTube Shorts gehen über denselben Weg. Ein eigenes Google-Projekt wäre seit dem 02.11.2026 nicht mehr auf „privat“ beschränkt [Y3], die Anmeldedaten lassen sich in der Cloud-Sitzung aber schlecht sicher halten.

Für die Statistik bleibt ein Rest an Screenshots aus TikTok Studio. Haltekurve und Zuschauerländer liefert für ein persönliches Konto keine offene Schnittstelle (Abschnitt 4).

**Was sich für dich ändert (S):** Heute kostet dich ein Teil 10–12 min (Plan). Mit Metricool sind es etwa 3–5 min: ansehen, „Ja“ sagen, nach dem Start den Kommentar mit dem Verweis anheften. Dazu kommen einmalig etwa 30–45 min Einrichtung.

---

## 1. TikTok Content Posting API (offiziell)

### Die zwei Wege

| | Direct Post (`video.publish`) | Upload als Entwurf (`video.upload`) |
|---|---|---|
| Was passiert | Video geht direkt aufs Profil | Video landet in deiner TikTok-Inbox. Du tippst die Benachrichtigung an, bearbeitest und postest in der App [T2] |
| Text, Privatsphäre | Bildunterschrift bis 2.200 Zeichen, Privatsphäre Pflicht, Kommentare/Duett/Stitch, Titelbild nur als Bild aus dem Video (`video_cover_timestamp_ms`), Schalter für KI-Inhalt (`is_aigc`) [T4] | Beim Video-Entwurf nur die Datei, kein Text-Feld; Text und Hashtags gibst du in der App ein [T3] |
| Geplante Uhrzeit | Kein Feld dafür [T4]; die App müsste selbst zur Uhrzeit senden | entfällt, du postest selbst |
| Grenzen | 6 Anfragen pro Minute je Nutzer; Tagesgrenze ohne Zahl (`spam_risk_too_many_posts`) [T4] | höchstens 5 offene Entwürfe in 24 h; 6 Anfragen pro Minute [T3] |
| Bibliotheks-Sound | nicht möglich (Buffer: „Trending TikTok sounds cannot be added when auto-publishing“ [B2]) | ja, du fügst ihn in der App hinzu |

Der Entwurfs-Weg wäre genau das gewünschte „Linus tippt nur noch Posten“. Er braucht aber dieselbe eigene App mit Prüfung wie Direct Post (siehe unten).

### Voraussetzungen

1. **Entwickler-Konto** mit E-Mail. Eine Organisation ist „highly recommended but not required“. Ein Einzelner darf eine App besitzen, laut TikTok aber „not recommended for real app integrations“ [T7].
2. **App registrieren:**
   - App-Symbol 1024 × 1024 px, Name, Kategorie und Beschreibung (die Beschreibung erscheint auf der Anmeldeseite) [T7].
   - Für das Web eine **offizielle Website**, die keine Landing- oder Login-Seite ist. **Nutzungsbedingungen und Datenschutzerklärung** müssen dort ohne Menü sichtbar sein [T6].
   - Alle URLs per Domain oder Signaturdatei bestätigen; für Apps mit Content Posting API ist das immer Pflicht [T7].
3. **Produkte und Scopes:**
   - Login Kit und Content Posting API hinzufügen; Direct Post einschalten [T1].
   - `video.publish` (direkt) oder `video.upload` (Entwurf). Für jeden Scope muss die App freigegeben sein, und du musst ihn bei der Anmeldung erlauben [T1][T2].
4. **App-Prüfung (App Review):**
   - Beschreibung je Produkt und Scope, mindestens ein Demo-Video des ganzen Ablaufs (bis 5 Videos à 50 MB) [T6][T7].
   - Dauer: „several days to two weeks“ [T8].
5. **Zweite Prüfung, das Audit der Content Posting API:** Erst sie hebt die Beschränkung auf private Videos auf [T1]. Einen Zeitrahmen nennt TikTok nicht. Drittanbieter berichten 2–6 Wochen und meist eine Nachbesserungsrunde (u) [X1].
6. **Pflicht-Oberfläche beim Posten:**
   - Kontoname anzeigen und Vorschau zeigen.
   - Privatsphäre ohne Voreinstellung.
   - Kommentare, Duett und Stitch nicht vorab angehakt.
   - Erklärung zur Musiknutzung vor dem Knopf.
   - Schalter für Werbe-Inhalte [T5].
7. **Schlüssel:** Der Zugangsschlüssel gilt 2 Stunden, der Erneuerungsschlüssel 180 Tage. Jede Erneuerung liefert einen neuen Erneuerungsschlüssel, den die App sicher speichern muss [T11].

### Einschränkungen ohne Audit

- „Unaudited API Clients can allow up to 5 users to post in a 24 hour window.“ [T5]
- „Unaudited API Clients can only post contents in `SELF_ONLY` viewership.“ [T5]
- „All user accounts using the API client to post must be set to private at the time of posting.“ [T5]
- Fehlercode `unaudited_client_can_only_post_to_private_accounts` [T4].
- Die **Sandbox** (ohne Prüfung) erlaubt bis zu 10 Testkonten. Ein eigenes Konto trägst du dort mit deinen Anmeldedaten ein. Sie bietet „no access to Content Posting API for public videos“ [T9]. Gedacht ist sie zum Ausprobieren, nicht für den Dauerbetrieb.

### Kann ein Einzelner das für sein eigenes Konto nutzen?

**Technisch ja, praktisch nein.**
- Die Prüfregeln sagen: „Apps must not be for private or personal use“ und „Apps that are still in development or testing will not be approved“ [T6].
- Die Regeln zum Teilen nennen als unzulässiges Beispiel wörtlich: „A utility tool to help upload contents to the account(s) you or your team manages“ [T5].
- Unser Fall ist genau das. Ohne Audit müsste dein Konto beim Posten privat sein, und jedes Video wäre nur für dich sichtbar. Für einen öffentlichen Kanal ist das wertlos.

**Aufwand, falls man es trotzdem versucht (S):**
- 1–2 Tage Bau: Website mit Datenschutzerklärung und Nutzungsbedingungen, Anmeldung, Upload-Seite mit Pflicht-Oberfläche, Demo-Video.
- Dazu kommen 2–14 Tage App-Prüfung [T8] und ein Audit ohne Frist mit absehbarer Ablehnung.
- **Empfehlung: nicht bauen.** Metricool und Buffer nutzen ihre eigene, bereits geprüfte TikTok-App.

---

## 2. Planungs-Tools mit offizieller TikTok-Anbindung

Alle unten verbinden TikTok per Anmeldung bei TikTok (OAuth). Dein Passwort sieht weder das Tool noch Claude.

| Tool | Preis (ohne MwSt.) | Persönliches TikTok-Konto | Automatisch posten | Zugang für Claude | Connector in claude.ai |
|---|---|---|---|---|---|
| **TikTok Studio** (Web/App) | 0 € | ja | Planen am Rechner: 10 Tage im Voraus laut TikTok-Video vom 30.09.2021, 30 Tage laut Buffer-Video vom 14.10.2026 und einer TikTok-Discover-Seite; widersprüchlich (u) [X4] | **keiner**: keine Schnittstelle, Claude darf sich nicht anmelden | nein |
| **Metricool** | Free 0 € (1 Marke, **20 veröffentlichte Beiträge/Monat, je Netzwerk gezählt**, 30 Tage Statistik). Starter ab 16 €/Monat bei Jahreszahlung, 20 € monatlich (5 Marken, unbegrenzt mit Fair Use) [M1][M2] | **ja**, „both personal and business accounts“ [M3] | ja; ohne Auto-Publish schickt es eine Benachrichtigung, und du postest in der App [M3] | MCP **in allen Plänen inkl. Free** [M4]; eigene API erst ab Advanced (43–54 €/Monat) [M2] | **ja, offiziell**: 7 Werkzeuge, u. a. `createScheduledPost`, `updateScheduledPost`, `getScheduledPosts`, `getAnalyticsDataByMetrics`, `getBestTimeToPostByNetwork` [M7] |
| **Buffer** | Free 0 $ (3 Kanäle, 10 geplante Beiträge je Kanal). Essentials 5 $/Kanal/Monat, Team 10 $/Kanal/Monat; Seite „last updated November 2025“ [B1] | **ja**, „supports both business and personal TikTok accounts“ [B2] | ja, oder Benachrichtigung [B2] | API-Schlüssel ab Free; MCP-Server `https://mcp.buffer.com/mcp` mit OAuth, Werkzeuge `create_post`, `edit_post`, `list_posts`, `get_aggregated_post_metrics` [B1][B3] | nicht im Verzeichnis gefunden (Teilsuche), als eigener Connector per URL eintragbar (A) |
| **Publer** | Professional ab 5 $, Business ab 10 $ je Konto/Monat; Hilfeseite vom 15.09.2026 [P1] | nicht belegt (u) | laut Vergleichsseiten bei TikTok nur per Benachrichtigung (u) [X5] | API ab Business, MCP-Server erst Enterprise [P1] | nein |
| **Later** | Starter etwa 18,75–25 $/Monat (Drittquellen, u) [X6] | nicht belegt (u) | (u) | laut zwei Vergleichsseiten (Juli und September 2026) keine öffentliche API, kein MCP (u) [X6] | nein |

Außerdem steht im claude.ai-Verzeichnis „Windsor.ai for Social Media“ („Analyze and post organic social content … TikTok, YouTube“). Nicht weiter geprüft.

**Was bei allen automatischen Wegen gilt:**
- **Keine Sounds aus der TikTok-Bibliothek** beim automatischen Posten [B2]. Bei Metricool können nur Business-Konten Trend-Songs wählen [M3]. Das passt zum Trend-Bericht: Alle 30 vermessenen Vorbild-Videos laufen auf „original sound“ mit eingemischter Musik [TB]. Hochgeladen wird also die Hauptfassung **mit Musik** (`build/teilen/hiding-night-teil2.mp4`, 53 MB [F2]).
- **Bildunterschrift in einer Zeile:** Laut Metricool unterstützt die TikTok-API keine Zeilenumbrüche [M3].
- **Titelbild:** nur ein Bild aus dem Video [T4][M3]. Ein eigenes `titelbild.jpg` als TikTok-Titelbild geht bei Metricool nicht (Stand der Hilfeseite); Buffer bietet eigene Titelbilder erst ab Essentials [B1].
- **Video als direkter Link:** Der Link muss die Datei selbst öffnen. Google Drive geht, wenn die Datei auf „Jeder mit dem Link“ steht [M5]. Weitere Grenzen: MP4 oder MOV, bis 500 MB, 3 s bis 10 min, ein Video pro Beitrag [M8].
- **Konto bleibt „Persönlich“:** Creator Rewards nimmt nur persönliche Konten. Nach einem Wechsel von Business zurück zu Persönlich kannst du dich erst nach 30 Tagen bewerben [X3]. Metricool zeigt Zuschauer-Demografie nur für Business-Konten [M6]; deswegen **nicht** umstellen.
- Ob TikTok Videos aus Drittanbieter-Tools anders verteilt als App-Uploads, ist unbelegt (u). In den ersten Wochen beobachten.

---

## 3. YouTube Shorts und Instagram Reels

### YouTube Data API v3 (`videos.insert`)

- **Quote:**
  - Seit dem 01.06.2026 hat `videos.insert` einen eigenen Topf: 100 Uploads pro Tag, 1 Einheit je Upload [Y1][Y2][Y3].
  - Alles andere teilt sich 10.000 Einheiten am Tag: `videos.update` 50, `thumbnails.set` 50, `captions.insert` 400, `commentThreads.list` 1, `comments.insert` 50 [Y2].
  - Für 1 Short pro Tag mit Titelbild und Untertiteln reicht das um ein Vielfaches.
- **Kein Privat-Zwang mehr:** „Videos uploaded through the videos.insert method from unverified API projects are no longer restricted to private viewing mode“ (Revisionsliste, 02.11.2026). Das hebt die Regel vom 28.07.2020 auf [Y3].
- **Planen:**
  - `status.publishAt` setzen, das Video dabei auf `private` [Y1][Y3]. Die geplante Uhrzeit setzt YouTube selbst um.
  - Seit dem 03.11.2026 gehen auch **eigene Titelbilder für Shorts** über die API (`thumbnails.set`, nach der Verarbeitung) [Y3].
- **Short oder nicht:**
  - Es gibt kein Shorts-Feld. Hochformat bis 3 min gilt als Short (YouTube-Hilfe [G4] im Recherche-Plan). Unsere 70–90 s passen.
  - Einzelne Entwickler berichten von Uploads, die trotzdem nicht als Short einsortiert wurden (u) [X7].
- **Anmeldung durch dich:**
  - OAuth mit Scope `youtube.upload` [Y1].
  - Im Modus „Testing“ läuft der Erneuerungsschlüssel nach 7 Tagen ab [Y4], du müsstest dich dann wöchentlich neu anmelden.
  - „In production“ ohne Google-Prüfung zeigt die Anmeldung einen Warnhinweis und erlaubt 100 neue Nutzer [Y5]. Für dich allein genügt das (A).
- **Haken in der Cloud (S):** Die Cloud-Sitzung kann nur feste Schlüssel als HTTP-Header hinterlegen. YouTube- und TikTok-Zugänge laufen nach 1–2 Stunden ab und müssen mit Client-Geheimnis und Erneuerungsschlüssel neu geholt werden. Beides müsste dann im Container liegen. Auf deinem PC mit Claude Code ginge das sauber (Schlüsseldatei lokal).
- **Urteil:** realistisch, aber über **Metricool** einfacher: YouTube braucht dort Video, Titel und die Angabe zur Zielgruppe [M5]. Ein eigenes Google-Projekt nur für Extras, die Metricool nicht kann, etwa Untertitel-Datei (SRT) oder ein eigenes Shorts-Titelbild, und dann vom PC aus.

### Instagram Reels (Instagram API)

- **Konto:** Nötig ist ein **professionelles Konto** („can represent a business or creator“); ein Creator-Konto reicht. Mit Instagram Login braucht es keine Facebook-Seite [I2].
- **Rechte:**
  - `instagram_business_basic` und `instagram_business_content_publish` [I1].
  - „Standard Access“ ist „intended for apps that will only be used by people who have roles on them“. Für dein eigenes Konto braucht es also keine App-Prüfung und keine Unternehmensprüfung [I2].
- **Grenzen:**
  - 100 API-Beiträge in 24 h; dieselbe Seite nennt an anderer Stelle 50 [I1].
  - Das Video muss öffentlich erreichbar sein, oder es geht per fortsetzbarem Upload.
  - **Keine eingebaute Planung:** Die App muss selbst zur Uhrzeit senden [I1].
- **Urteil:** eigener Weg möglich, über Metricool aber ohne Bauarbeit. Seit dem 17.11.2026 gehört Instagram zum Plan (Abschnitt 6.3); bis zur Einrichtung plant Linus die Reels von Hand in der App.

---

## 4. Statistik: Was Claude legal lesen kann

| Weg | Was | Für uns |
|---|---|---|
| **TikTok Display API** (eigene App) | Follower, Likes gesamt, Zahl der Videos (`user.info.stats`) [T12]. Je Video Aufrufe, Likes, Kommentare, Shares, Länge (`video.list`) [T12]. **Keine** Sehdauer, keine Haltekurve, keine Länder | braucht eigene App, Sandbox oder Prüfung und sich drehende Schlüssel (Abschnitt 1). Lohnt nicht |
| **TikTok Research API** | öffentliche Daten für die Forschung | **nicht zugänglich:** nur Hochschulen und gemeinnützige Forschung, „independent of commercial interests“ [T13] |
| **TikTok Business API** (organische Daten) | Daten für Business-Konten (u) [X8] | nicht für unser persönliches Konto |
| **Metricool** (Connector) | Je Video Aufrufe, Likes, Kommentare, Shares, Reichweite, Länge, Anteil bis zum Ende gesehen, Sehdauer gesamt und im Schnitt; Herkunft der Impressionen (For You, Following, Profil, Suche); Follower [M6] | **ja.** Für persönliche Konten „limited information due to TikTok API restrictions“ [M6]; welche Felder fehlen, zeigt erst der Test (u). Free speichert 30 Tage [M2] |
| **TikTok Studio** (deine Screenshots) | Haltekurve sekundengenau, Zuschauerländer, Anteil über 5 s | **bleibt nötig** für die Phase-1-Ziele „≥ 50 % Zuschauer aus USA und UK“ und Wiedergabezeit, weil Metricool Demografie nur für Business-Konten zeigt [M6] |
| **YouTube Analytics API** | Haltekurve (`audienceWatchRatio`), durchschnittlich gesehener Anteil, Engaged Views, Länder [Y6] | ja, mit deiner Anmeldung (Schlüssel-Haken wie oben); einfacher über Metricool |

Die bisherige Embed-Abfrage ist kein Weg für die eigenen Zahlen. robots.txt sperrt `/embed/@` für Bots [TB].

---

## 5. Empfehlung

### Sofort, ohne Einrichtung

1. **Upload-Paket je Teil** (Erweiterung von Anhang A9):
   - `teil-N.mp4` als Hauptfassung **mit Musik** (Teilen-Fassung, etwa 55 MB).
   - `bildunterschrift.txt` in einer Zeile, höchstens 2.200 Zeichen, mit 3–5 Hashtags nach Trend-Regel 10: Eigenname vor Trend, `#inthistown` nur einer davon, kein „roblox“ [TB].
   - `verweis.txt` mit dem Text für den angehefteten Kommentar.
   - `cover.txt`: die Sekunde für das TikTok-Titelbild.
   - `titelbild.jpg` 1080 × 1920 für YouTube.
   - `youtube.txt` mit Titel, Beschreibung und „nicht für Kinder“.
2. **Untertitel-Dateien** `teil-N.srt` aus `timing.json`. Für TikTok sind die Untertitel schon im Bild; die SRT braucht nur YouTube.
3. **Veröffentlichungsplan je Woche:** Reihenfolge, Datum und Uhrzeit in deutscher und US-Ostküstenzeit, Teil 1 erst, wenn alle Teile fertig sind (Plan). Das US-Publikum guckt abends, das ist bei uns tiefe Nacht. Gerade dafür lohnt das automatische Planen. Die beste Uhrzeit misst Phase 1 (u).
4. **Erinnerungen im Google-Kalender** (Connector ist schon verbunden), z. B. „Teil 2 ist live: Kommentar anheften“ 5 min nach dem Start.
5. **Ablage in Google Drive** über den Drive-Connector. Jede Datei-Übergabe bestätigst du einmal; ob 55 MB in einem Stück durchgehen, ist ungetestet (u).
6. **Antwort-Entwürfe auf Kommentare:** Du schickst Screenshots oder kopierst die Kommentare, Claude schreibt Vorschläge, du sendest selbst. TikTok bietet für persönliche Konten keine Kommentar-Schnittstelle (S).
7. **Wochenbericht** aus deinen TikTok-Studio-Screenshots gegen die Phase-1-Ziele.
8. **Übergangslösung bis zur Einrichtung:** Du lädst einmal pro Woche alle Teile der Woche am Rechner in TikTok Studio hoch und planst sie (etwa 15–20 min, S). Claude hat dafür Pakete und Uhrzeiten fertig.

### Nach einmaliger Einrichtung automatisch (Metricool + Connector)

1. **Beiträge anlegen und planen:**
   - Video per Drive-Link, Bildunterschrift, Uhrzeit, Privatsphäre „Öffentlich“, Kommentare an, Duett/Stitch nach deiner Vorgabe, Schalter „KI-generiert“ nach Anhang A7.5.
   - Claude legt jeden Teil erst nach deinem „Ja“ an, oder als Beitrag „zur Prüfung“, den du in Metricool freigibst. Laut Metricool geht das über den Connector [M4]; ob die Freigabe in der App ein Tipp ist, zeigt der Test (u).
2. **Prüfen und ändern:** geplante Beiträge auflisten, Uhrzeit oder Text ändern (`getScheduledPosts`, `updateScheduledPost`) [M7].
3. **Zahlen lesen:** je Video Aufrufe, Likes, Shares, Kommentare, Reichweite, Sehdauer, Anteil bis zum Ende [M6]. Daraus der Wochenbericht, auf Wunsch jeden Sonntag als geplante Aufgabe, die den Connector nutzen darf (A).
4. **Beste Uhrzeit** aus den eigenen Daten (`getBestTimeToPostByNetwork`), sobald genug Videos online sind [M7].
5. **YouTube Shorts und Instagram Reels** mit demselben Paket (seit 17.11.2026 Pflicht, Abschnitt 6.3). Metricool Free zählt jedes Netzwerk einzeln: 4 Teile pro Woche auf TikTok sind etwa 17 im Monat und passen in die 20. Mit YouTube und Instagram dazu (im Dezember etwa 3 × 10–13 Beiträge) braucht es **Starter für 20 €/Monat** (16 € bei Jahreszahlung) oder Buffer Free als zweiten Kanal-Planer [M2][B1]; sonst YouTube und Instagram von Hand planen.
6. **Aufräumen:** Nach dem Start legt Claude die Drive-Kopie in den Papierkorb, damit der öffentliche Link nicht offen bleibt (A). Das Original bleibt im Repo-Build.

### Was du selbst tun musst

1. Konten und Anmeldungen: Metricool-Konto, TikTok in Metricool verbinden, Metricool in claude.ai verbinden. Das läuft bei dir im Browser; Passwörter gibst du nie an Claude.
2. **Freigabe jedes Teils:** am Handy ansehen und „Ja“ sagen. Es wird in deinem Namen veröffentlicht.
3. **Verweis nach dem Start:** Kommentar anheften, später die Playlist (Anhang A6). Dafür gibt es keine Schnittstelle (S).
4. Bibliotheks-Sound, falls du doch einen willst: Den Teil dann in Metricool auf Benachrichtigung stellen und in der App fertig posten [M3].
5. Kommentare beantworten und absenden (Entwürfe von Claude).
6. Wöchentlich etwa 10 min Screenshots aus TikTok Studio: Haltekurve, Länder, Anteil über 5 s.
7. Konto auf „Persönlich“ lassen; Creator Rewards selbst beantragen [X3]; Gewerbe klären (Plan, Phase 2).
8. Bei Verstößen oder gesperrten Beiträgen selbst Einspruch einlegen. Metricool kann TikToks Spam-Sperren nicht aufheben [M8].

### Einrichtung des besten Wegs, Schritt für Schritt (etwa 30–45 min, S)

1. **Metricool-Konto anlegen** auf metricool.com, Plan „Free“. Eine Marke anlegen, z. B. mit dem Kanalnamen.
2. **TikTok verbinden:** in Metricool unter „Connections“ TikTok wählen und dich bei TikTok anmelden. Die Rechte bestätigst du bei TikTok. Konto bleibt persönlich.
3. **Auto-Publish einschalten:** im Planer unter „Global presets“ Auto-Publish an. Unter „TikTok presets“ Privatsphäre auf Öffentlich, Kommentare an [M3].
4. **Optional YouTube verbinden** (und Instagram, falls gewünscht; Instagram braucht ein Creator-Konto [I2]).
5. **Connector in claude.ai:** Einstellungen → Connectors → „Metricool Social Media Management“ suchen → verbinden und bei Metricool anmelden [M7]. Ob er dann auch in den Cloud-Sitzungen auftaucht wie Kalender und Drive, prüft Schritt 7 (A).
6. **Drive-Ordner** „DeepTok Horror Release“ anlegen. Claude legt dort die Pakete ab und gibt die Video-Datei für den Link frei [M5].
7. **Probelauf:** Claude plant einen kurzen Testclip (mindestens 3 s [M8]) mit Privatsphäre „Nur ich“ in 15 min. Prüfen: Kommt er an? Stimmen Text, Titelbild-Sekunde und Uhrzeit? Welche Zahlen liefert `getAnalyticsDataByMetrics` am nächsten Tag? Danach den Testclip löschen.
8. **Erster echter Teil:** Claude legt den Beitrag an, du gibst frei, und der Kalender erinnert ans Anheften des Kommentars.
9. **Abmelden geht jederzeit:** Verbindung in Metricool trennen oder die App-Berechtigung in den TikTok-Einstellungen entziehen (Menüpfad u).

### Offen, zeigt der Probelauf

- Nimmt der Connector Videos per Drive-Link an, und schafft der Drive-Connector 55 MB (u)?
- Welche TikTok-Zahlen liefert Metricool für ein persönliches Konto genau (u)?
- Lässt sich ein Beitrag „zur Prüfung“ in der Metricool-App mit einem Tipp freigeben (u)?
- Planungsfenster in TikTok Studio: 10 oder 30 Tage (u) [X4].

---

## 6. Takt, Termine und Cross-Posting (Stand 17.11.2026)

Linus am 17.11.2026: „Entscheidest selber, was die meisten Views bringt.“ Die Entscheidungen stehen mit Begründung in `episoden/serie-02/bibel.md` §14; hier geht es um Nr. 13 (Takt) und Nr. 14 (Cross-Posting) und um den Stimm-Tarif. Recherche per Websuche und auf Hilfeseiten am 17.11.2026, Quellen [R1]–[R15] am Ende dieses Abschnitts. Von tiktok.com wurde nichts abgerufen, Anmeldungen gab es keine.

### 6.1 Takt

- **Uhrzeit:** 19:00 Uhr US-Ostküste (EST, UTC−5) = **01:00 Uhr bei uns** (MEZ, UTC+1) am Folgetag. Das gilt bis zur Zeitumstellung im März.
- **Hiding Night:** drei Abende hintereinander, fertig und unverändert.
- **Rules of Kindly:** F1 so früh, wie die Qualität es erlaubt, Ziel Di 24.11. Danach **mindestens Di/Fr**. F7 am 23.12., F8 an Silvester und nur, wenn F1–F7 draußen sind (Bibel §3.1, Plan B).
- **Lücken:** Vorrats-Folgen nur, wenn Credits (6.4) und Rechenzeit reichen. Sonst bleibt der Platz frei: Ein freier Platz kostet weniger als eine schwache Folge (S). Vorrats-Folgen tragen kein Rule-Zero-Wort und ändern die Zahl auf dem Ortsschild nicht (Bibel §8).
- **Je Termin drei Plattformen:** TikTok und YouTube Shorts um 19:00 Uhr US-Ostküste, Instagram Reels eine Stunde später (6.3).

### 6.2 Termine

| US-Ostküste, 19:00 | bei uns, 01:00 | Video | Hinweis |
|---|---|---|---|
| Do 19.11. | Fr 20.11. | Hiding Night, Teil 1 | Paket `paket-hiding-night-part-1` |
| Fr 20.11. | Sa 21.11. | Hiding Night, Teil 2 | |
| Sa 21.11. | So 22.11. | Hiding Night, Teil 3 (Finale) | Endkarte MORE TOWNS SOON bleibt |
| **Di 24.11.** | **Mi 25.11.** | **Kindly F1 *His Breath Didn't Fog*** | danach den angehefteten Kommentar unter dem Finale auf Rules of Kindly umstellen (Paket Teil 3) |
| Fr 27.11. | Sa 28.11. | F2 *Made Bed* | |
| Mo 30.11. | – | – | Schwelle prüfen: F1 + F2 zusammen ≥ 400 Kommentare? Wenn ja, Festscheune bauen und Abstimmung unter F3 anheften |
| Di 01.12. | Mi 02.12. | F3 *Too Far Apart* | ggf. Abstimmungs-Kommentar *„Next rule: 41 or 12? You pick.“* |
| Fr 04.12. | Sa 05.12. | Vorrats-Platz | Abstimmung zählen, gewertet ab 200 Stimmen |
| Di 08.12. | Mi 09.12. | Vorrats-Platz oder F4B | F4B darf hierher vorrücken (keine Abstimmung oder B gewinnt) |
| Fr 11.12. | Sa 12.12. | F4 (*Last Song* oder *Wrong Wrist*) | wird zum Vorrats-Platz, wenn F4B schon am 08.12. kam |
| Di 15.12. | Mi 16.12. | F5 *Two Fireflies* | Sommer-Erinnerung |
| Fr 18.12. | Sa 19.12. | F6 *Wrong Name Tag* | schwarzer Humor, Test |
| Di 22.12. | – | entfällt | F7 kommt am Tag darauf |
| **Mi 23.12.** | **Do 24.12.** | **F7 *Mouth Shut*** | Heiligabend-Folge |
| Fr 25.12. | Sa 26.12. | Vorrats-Platz | |
| Di 29.12. | Mi 30.12. | Vorrats-Platz | |
| **Do 31.12.** | **Fr 01.01.** | **F8 *Ink Finger*** | nur wenn F1–F7 draußen sind |

Instagram jeweils eine Stunde später (20:00 Uhr US-Ostküste = 02:00 Uhr bei uns). Die Uhrzeiten trägt jedes Paket in sein `LIESMICH.txt` ein (`episoden/<folge>/paket.json`).

### 6.3 Cross-Posting: YouTube Shorts und Instagram Reels

Entscheidung Nr. 14: jedes Video zusätzlich als YouTube Short und Instagram Reel, **gleiche Datei, eigene Texte**. Das kostet keine Credits und keine Rechenzeit. Laut einer Metricool-Auswertung (26.08.2026, über 6 Mio. Videos) bringt TikTok im Schnitt die meisten Aufrufe, Instagram Reels aber die meisten Kommentare und Shares je Video [R14].

**Die Datei**
- Immer die eigene Teilen-Fassung mit Musik aus `build/teilen/`, **nie ein Download aus TikTok**. Instagram stuft Reels mit Logos oder Wasserzeichen anderer Apps herunter und ersetzt Reposts in den Empfehlungen durch das Original [R8][R9]. Unsere Renders haben kein Wasserzeichen.
- Länge: YouTube zählt Hochformat bis 3 min als Short (Uploads ab 15.10.2024) [R3]. Instagram nimmt in der App bis 20 min an, zeigt aber: *„Reels over 3 minutes won't be recommended to new audiences“* [R6]; Reels über 90 s sind seit Januar 2025 im Reels-Tab auffindbar [R5]. Unsere Videos dauern 87–145 s, Kindly-Folgen sind auf 2:00–2:30 angelegt. **Unter 3:00 bleiben.**
- Musik: nur eigene Musik (Bett r2-eigen). Bei Shorts über 1 min sperrt schon ein einziger Urheberrechtsanspruch das Video weltweit [R3].

**Die Texte** (`paket.json`, Schlüssel `youtube` und `instagram`; `tools/paket/paket.py` schreibt `youtube.txt` und `instagram.txt` und prüft sie)
- **YouTube:** Titel mit Serie und Regel bzw. Teil, Beschreibung mit der Prämisse, Untertitel als SRT. Kein Titel-A/B-Test: *„A/B testing is not available for Shorts“* [R4].
- **Instagram:** Der erste Satz ist ein eigener Hook (Instagram kürzt lange Bildunterschriften im Feed, S), dann Serie und Teil, die Gattung, die Streitfrage und **4 Hashtags**. Seit Dezember 2025 erlaubt Instagram höchstens 5 Hashtags je Beitrag; Mosseri: Hashtags helfen der Suche, nicht der Reichweite [R7]. Kein Roblox-Tag.
- **KI-Kennzeichnung:** Bei Instagram „KI-Info“ an, weil Meta die Kennzeichnung für realistisch klingende, digital erzeugte Stimmen verlangt [R10]. Bei TikTok bleibt „KI-generierter Inhalt“ an. Die YouTube-Angabe aus den Paketen ist hier nicht neu geprüft.
- **Angehefteter Kommentar:** auf allen drei Plattformen derselbe Text, zur selben Zeit getauscht.

**Planen**
- TikTok in TikTok Studio, YouTube in YouTube Studio, Instagram in der App (nur mit Profikonto, bis 75 Tage voraus [R12]). Mit Metricool ginge alles an einer Stelle, Free reicht für drei Plattformen aber nicht (Abschnitt 5).
- **Abstand (A):** Eine unabhängige Studie zum Abstand zwischen den Plattformen gibt es nicht. Anbieter von Planungs-Tools raten zu 15 min bis 8 h, einer behauptet ohne Beleg eine Abwertung bei gleichzeitigem Posten [R11]. Arbeitsannahme: TikTok und YouTube 19:00 Uhr, Instagram 20:00 Uhr US-Ostküste. Nach vier Folgen anhand der Zahlen prüfen.
- **Probe-Reels** (Instagram „Trial Reels“) zeigen ein Reel zuerst nur Nicht-Followern [R13]. Für die Folgen selbst aus, weil Follower sie sehen sollen; später vielleicht für einen Hook-Test.

### 6.4 Stimme: ElevenLabs-Tarif (Geld entscheidet Linus)

**Tarife laut Preisseite, gelesen am 17.11.2026 [R1]:**

| Tarif | Preis je Monat | Credits je Monat | kommerzielle Nutzung | Kindly-Folgen je Monat (4.800 / 5.000 Credits je Folge) |
|---|---|---|---|---|
| Free | 0 $ | 10.000 | **nein**; wer veröffentlicht, muss „elevenlabs.io“ oder „11.ai“ in den Titel schreiben [R2] | 2 / 2 |
| Starter | 6 $ | 30.000 | ja | 6 / 6 |
| Creator | 22 $ (erster Monat 11 $) | 121.000 | ja | 25 / 24 |
| Pro | 99 $ | 600.000 | ja | 125 / 120 |

- Jahreszahlung: 10 Monatspreise für 12 Monate (Starter 5 $, Creator 18,33 $ je Monat).
- Ungenutzte Credits gehen bis zu zwei Monate mit, höchstens das Doppelte des Monatskontingents, solange das Abo läuft. Zusatz-Credits gibt es; ihr Preis ist nicht geprüft.
- Die Preisseite nennt ein Black-Friday-Angebot „bis 55 %“ bis 01.12., ohne die Tarife zu nennen.
- **Je Folge:** etwa 2.400 Zeichen, 2 Takes. eleven_v4 rechnet 1 Credit je Zeichen samt Ton-Tags (gemessen an Hiding Night Teil 3: 2.624 Credits je Take); die Preisseite nennt für v4 keinen eigenen Satz. Also etwa 4.800, mit Tags eher 5.000 Credits je Folge.
- Der Abrechnungsmonat beginnt am Tag des Abschlusses, nicht am Monatsersten.

**Bedarf (S):**

| Zeitraum | Folgen | Credits (4.800 je Folge) |
|---|---|---|
| bis 30.11.: Stimmen für F1, F2, F3 | 3 | 14.400 |
| Dezember: F4–F8 | 5 | 24.000 |
| Dezember: F4–F8 und 4 Vorrats-Plätze | 9 | 43.200 |
| Einschub einzelner Sätze (`engine/ton/einschub.py`) | je Fall | etwa 500–1.300 |

**Was Linus heute hat:** Hiding Night hat im November zusammen etwa 14.900 Credits verbraucht (Teil 1: 3.146; Teil 2: etwa 3.200 und 3.282; Teil 3: 5.248; aus den `stimme.json`). Das ist mehr, als Free hergibt; das Konto hat also sehr wahrscheinlich mindestens Starter (S). Den Kontostand kann Claude nicht lesen, `account_get_usage` verlangt beim Connector zusätzliche Rechte. **Wichtig, falls es Starter ist:** Läuft der aktuelle Abrechnungsmonat noch bis in den Dezember, bleiben etwa 15.000 Credits. Das reicht knapp für F1–F3 und für keinen Einschub.

**Gemessen am 17.11.2026 (`account_get_usage` ging diesmal):** Tarif **Starter**, aktiv, 22.884 von 30.000 Credits verbraucht, also 7.116 frei; nächste Gutschrift am **13.12.2026, 00:12 Uhr MEZ**. Die Stimme für Kindly F1 hat 5.120 Credits gekostet (2 Takes zu je 2.560, `episoden/kindly-01/stimme.json`). **Bis zum 13.12. bleiben rechnerisch 1.996 Credits:** genug für 1–3 Einschübe, aber für keine weitere Folge. F2 (27.11.) und F3 (01.12.) brauchen je etwa 5.000 Credits und gehen nur mit einem größeren Tarif oder Zusatz-Credits. Ohne eine dieser Lösungen fällt der Di/Fr-Takt bis Mitte Dezember aus.

**Empfehlung (S):**
- **Free** kommt nicht in Frage: keine kommerzielle Nutzung, und „elevenlabs.io“ müsste in jedem Titel stehen.
- **Starter (6 $)** trägt F1–F8 im Pflichttakt, aber ohne Vorrats-Folgen und fast ohne Puffer.
- **Creator (22 $, erster Monat 11 $) ist die Empfehlung für Reichweite.** Damit gehen alle Vorrats-Plätze (Dezember 43.200 von 121.000), Einschübe und ab Januar 2–3 Folgen pro Woche. Gegenüber Starter kostet das 16 $ im Monat mehr, bei vier zusätzlichen Folgen also 4 $ je Folge. Wenn Creator, dann vor dem 01.12. das Black-Friday-Angebot ansehen.
- **Pro** lohnt sich erst bei mehr als 25 Folgen im Monat.

### Quellen zu Abschnitt 6 (Websuche und Seiten, gelesen am 17.11.2026)

- [R1] ElevenLabs, Preisseite (ohne Datum): Free 10.000; Starter 6 $, 30.000, erster Monat 1 $ (Angebot bis 30.09.); Creator 22 $, 121.000, erster Monat 11 $; Pro 99 $, 600.000; Scale 299 $, 1,8 Mio.; Business 990 $, 6 Mio.; Mitnahme bis zwei Monate, höchstens das Doppelte; Zusatz-Credits; Jahreszahlung 10 für 12; Black Friday „bis 55 %“ bis 01.12.; Sprachausgabe 1 Credit je Zeichen, für v3/v4 kein eigener Satz. https://elevenlabs.io/pricing . Drittquellen nennen teils ältere Preise (Starter 5 $, Creator 100.000), z. B. https://smallest.ai/blog/elevenlabs-pricing-plans-cost-what-you-get-in-2026
- [R2] ElevenLabs-Hilfe „Can I publish the content I generate on the platform?“ (ohne Datum): Free „does not include a commercial license and cannot be used for any commercial purpose“; Namensnennung „elevenlabs.io“ oder „11.ai“ im Titel; „All paid plans include a commercial license“. https://elevenlabs.io/docs/help-center/legal/can-i-publish-the-content-i-generate-on-the-platform
- [R3] YouTube-Hilfe „Understand three-minute YouTube Shorts“ (ohne Datum): quadratisch oder hochkant bis 3 min ab Upload 15.10.2024; Urheberrechtsanspruch sperrt Shorts über 1 min weltweit. https://support.google.com/youtube/answer/15424877
- [R4] YouTube-Hilfe „A/B test titles & thumbnails“ (ohne Datum): „A/B testing is not available for Shorts.“, nur YouTube Studio am Computer. https://support.google.com/youtube/answer/16391400 . Titel-Tests seit Juli 2025: https://www.tubefilter.com/2025/07/16/youtube-feature-test-and-compare-titles-thumbnails/
- [R5] Reels bis 3 min, Instagram @creators auf Threads („90 seconds isn't always enough time to tell a story“), Bericht vom 22.01.2025: https://www.netinfluencer.com/instagram-give-equal-recommendation-to-reels-3-minutes-in-length/ ; Auffindbarkeit über 90 s im Reels-Tab laut Mosseri (Suchauszug): https://lindseygamble.com/blog/instagram-three-minute-reels ; zuvor galt: über 90 s keine Empfehlung in Explore und Reels-Tab: https://www.socialmediatoday.com/news/instagram-says-posting-longer-reels-can-hurt-your-performance/715867/
- [R6] Buffer, „How Long Should Instagram Reels Be?“, 12.11.2026 (2,73 Mio. Reels, 01.01.–15.08.2026): Upload bis 20 min, schrittweise; Hinweis in der App „Reels over 3 minutes won't be recommended to new audiences“. https://buffer.com/resources/instagram-reels-length
- [R7] Höchstens 5 Hashtags je Beitrag und Reel, angekündigt von Adam Mosseri am 19.12.2025, schrittweise eingeführt: https://www.businesstoday.in/technology/news/story/no-more-hashtag-stuffing-instagram-limits-hashtag-usage-to-just-5-per-reel-and-post-507444-2025-12-19 , https://www.socialmediatoday.com/news/instagram-implements-new-limits-on-hashtag-use/808309/
- [R8] Instagram bevorzugt Originale, Reposts werden in Empfehlungen durch das Original ersetzt (30.04.2024): https://www.tubefilter.com/2024/04/30/instagram-meta-threads-original-content-algorithm-bonus-program-monetization/amp/ ; Ausweitung 2026: https://petapixel.com/2026/04/30/new-instagram-policies-target-reposted-content/
- [R9] Wasserzeichen anderer Apps mindern die Auffindbarkeit von Reels (Mosseri, Fast Company): https://www.fastcompany.com/90744109/instagram-tiktok-algorithm-adam-mosseri ; https://tecnoblog.net/noticias/2022/04/21/instagram-reforca-combate-a-reposts-do-tiktok-e-de-outros-videos-no-reels/
- [R10] Meta, 06.02.2024: Kennzeichnung nötig für „photorealistic video or realistic-sounding audio that was digitally created or altered“. https://about.fb.com/news/2024/02/labeling-ai-generated-images-on-facebook-instagram-and-threads/ ; Meta-Hilfe mit Beispielen (KI-Sprecherstimme im Reel: ja; Cartoon-Video allein: nein), nur Suchauszug: https://www.meta.com/en-gb/help/artificial-intelligence/1783222608822690/
- [R11] Abstand beim Cross-Posting, nur Anbieter-Blogs ohne Daten: https://posteverywhere.ai/blog/how-to-cross-post-reels-shorts-and-tiktok-at-the-same-time , https://buffer.com/library/cross-posting/ , https://autoclip.dev/blog/how-to-cross-post-the-same-clip-without-shadowban
- [R12] Instagram-Hilfe „How to create and manage scheduled posts and Reels“: Profikonto, bis 75 Tage voraus. https://help.instagram.com/iphone-app/439971288310029 ; TechCrunch, 08.11.2022: https://techcrunch.com/2022/11/08/instagram-scheduling-tool-all-professional-accounts/
- [R13] Instagram Trial Reels (Drittquelle): https://lindseygamble.com/blog/instagram-launches-trial-reels-to-help-creators-test-content-with-non-followers-first
- [R14] Metricool, „The State of Short-Form Social Media in 2026“, 26.08.2026 (über 6 Mio. Videos von 375.000 Konten). https://metricool.com/the-state-of-short-form-social-media/
- [R15] TikTok-Bitrate für die Kompressions-Simulation (Bibel §10.7): keine Angabe von TikTok; Fremdangaben 2–4 Mbit/s in der Auslieferung, unbelegt, z. B. https://convertintomp4.com/blog/best-video-format-social-media-2026

---

## Quellen (gelesen am 16.11.2026)

**TikTok for Developers** (Doku, einzeln gelesen; robots.txt der Domain: HTTP 404)
- [T1] Content Posting API, Get Started (Direct Post), zuletzt aktualisiert 04.08.2026: `video.publish`, „All content posted by unaudited clients will be restricted to private viewing mode“. https://developers.tiktok.com/doc/content-posting-api-get-started
- [T2] Get Started, Upload, 04.08.2026: `video.upload`, „inform users that they must click on inbox notifications to continue the editing flow in TikTok“. https://developers.tiktok.com/doc/content-posting-api-get-started-upload-content
- [T3] API-Referenz Upload (Inbox), 04.08.2026: „at most 5 pending shares within any 24-hour period“, 6 Anfragen/min, kein Textfeld. https://developers.tiktok.com/doc/content-posting-api-reference-upload-video
- [T4] API-Referenz Direct Post, 27.10.2026: Titel bis 2.200 UTF-16-Zeichen, `privacy_level`, `video_cover_timestamp_ms`, `is_aigc`, 6 Anfragen/min, Fehlercodes. https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
- [T5] Content Sharing Guidelines, 04.08.2026: Pflicht-Oberfläche, „should be intended for a wide audience“, unzulässiges Beispiel Upload-Werkzeug für eigene Konten, Grenzen ohne Audit. https://developers.tiktok.com/doc/content-sharing-guidelines
- [T6] App Review Guidelines, 04.08.2026: Website, Datenschutz und Nutzungsbedingungen ohne Menü sichtbar, Demo-Video, „Apps must not be for private or personal use“. https://developers.tiktok.com/doc/app-review-guidelines
- [T7] Create an app, 04.08.2026: Einzelkonto „not recommended for real app integrations“, URL-Bestätigung, Symbol 1024 px. https://developers.tiktok.com/doc/getting-started-create-an-app
- [T8] Getting Started FAQ, 04.08.2026: „App review may take several days to two weeks after submission.“ https://developers.tiktok.com/doc/getting-started-faq
- [T9] Sandbox, 04.08.2026: 10 Konten, 5 Sandboxes, kein Posten öffentlicher Videos. https://developers.tiktok.com/doc/add-a-sandbox
- [T10] Scopes-Übersicht (ohne Datum): `video.upload` „as a draft“, `video.publish` „Directly post“, `user.info.stats`. https://developers.tiktok.com/doc/tiktok-api-scopes
- [T11] Token-Verwaltung, 05.11.2026: Zugang 2 h, Erneuerung 180 Tage, neuer Erneuerungsschlüssel bei jeder Erneuerung. https://developers.tiktok.com/doc/oauth-user-access-token-management
- [T12] Display API: Übersicht 04.08.2026 https://developers.tiktok.com/doc/display-api-overview ; User Info 04.11.2026 (follower_count, likes_count, video_count unter `user.info.stats`) https://developers.tiktok.com/doc/tiktok-api-v2-get-user-info ; Video-Objekt 24.08.2026 (view_count, like_count, comment_count, share_count) https://developers.tiktok.com/doc/tiktok-api-v2-video-object
- [T13] Research API, Teilnahmebedingungen (ohne Datum). https://developers.tiktok.com/products/research-api/

**Metricool**
- [M1] Preisseite (ohne Datum, Preise ohne MwSt.): Free 0 €, Starter ab 16 €/20 €, Advanced ab 43 €/54 €, „Metricool MCP“ im Free-Plan. https://metricool.com/pricing/
- [M2] Hilfe „Main differences between Free and paid plans“ („Updated last month“): 20 veröffentlichte Beiträge/Monat, je Netzwerk gezählt, 30 Tage Statistik, API nur Advanced/Custom. https://help.metricool.com/main-differences-between-free-and-paid-plans-bl0v9
- [M3] Hilfe „Schedule and Post on TikTok“ („Updated 2 weeks ago“): persönliche und Business-Konten, Auto-Publish oder Benachrichtigung, keine Zeilenumbrüche, Voreinstellungen, Trend-Songs nur Business. https://help.metricool.com/schedule-and-post-on-tiktok-bkepi
- [M4] Hilfe „FAQs about the Metricool MCP“ („Updated 4 weeks ago“): „MCP works with any Metricool plan, including Free“, Beiträge planen, zur Prüfung anlegen, ändern; Inbox nicht über MCP. https://help.metricool.com/faqs-about-the-metricool-mcp-1i3w0
- [M5] Hilfe zum Planen über MCP: Link muss die Datei öffnen, Drive mit „Anyone with the link“, YouTube braucht Video, Zielgruppe, Titel (laut Suchauszug und Werkzeugbeschreibung auf glama.ai). https://help.metricool.com/how-to-schedule-a-post-at-different-times-on-each-network-using-metricools-mcp-8tmhd , https://glama.ai/mcp/servers/@metricool/mcp-metricool/tools/post_Schedule_Post
- [M6] Hilfe „TikTok Metrics“ („Updated 2 months ago“): Kennzahlen je Video, Demografie nur Business ab 100 Followern, persönliche Konten eingeschränkt. https://help.metricool.com/tiktok-metrics-fe7io
- [M7] claude.ai-Verzeichnis: „Metricool Social Media Management“, 7 Werkzeuge, „Anthropic verified“, hinzugefügt Juni 2026. https://claude.com/connectors/metricool-social-media-management
- [M8] Hilfe „TikTok Publishing and Upload Troubleshooting“ (Suchauszug): MP4/MOV, 500 MB, 3 s bis 10 min, ein Video je Beitrag, Spam-Sperren kommen von TikTok. https://help.metricool.com/tiktok-publishing-and-upload-troubleshooting-guide-3ywdt

**Buffer, Publer**
- [B1] Buffer-Preisseite („last updated November 2025“): Free 3 Kanäle, 10 Beiträge je Kanal, API-Schlüssel; Essentials 5 $, Team 10 $ je Kanal; eigene TikTok-Titelbilder nicht im Free-Plan. https://buffer.com/pricing
- [B2] Buffer TikTok-Seite (ohne Datum): persönliche und Business-Konten, Benachrichtigung, „Trending TikTok sounds cannot be added when auto-publishing through Buffer“. https://buffer.com/tiktok
- [B3] Buffer MCP-Doku (ohne Datum): `https://mcp.buffer.com/mcp`, OAuth, Werkzeugliste, TikTok „an image or a video“. https://developers.buffer.com/guides/integrations/mcp.html
- [P1] Publer-Hilfe „Plans and Pricing“, 15.09.2026: Professional ab 5 $, Business ab 10 $, API ab Business, MCP-Server im Enterprise-Plan. https://publer.com/help/en/article/what-are-publers-plans-and-pricing-15h4yqh/

**Google, YouTube**
- [Y1] `videos.insert`, zuletzt aktualisiert 12.11.2026: 1 Einheit im Upload-Topf, 100 Aufrufe/Tag, Scopes, `status.publishAt`. https://developers.google.com/youtube/v3/docs/videos/insert
- [Y2] Quota Calculator, 12.11.2026. https://developers.google.com/youtube/v3/determine_quota_cost
- [Y3] Revisionsliste: 01.06.2026 (eigene Töpfe für Upload und Suche), 02.11.2026 (kein Privat-Zwang für ungeprüfte Projekte), 03.11.2026 (Shorts-Titelbilder über `thumbnails.set`). https://developers.google.com/youtube/v3/revision_history
- [Y4] OAuth 2.0: Erneuerungsschlüssel im Status „Testing“ „expiring in 7 days“. https://developers.google.com/identity/protocols/oauth2
- [Y5] Google-Cloud-Hilfe „Unverified apps“: Warnbildschirm, 100 neue Nutzer. https://support.google.com/cloud/answer/7454865
- [Y6] YouTube Analytics, Kennzahlen, 16.11.2026: `audienceWatchRatio`, `averageViewPercentage`, `engagedViews`. https://developers.google.com/youtube/analytics/metrics

**Meta, Instagram**
- [I1] Instagram Platform, Content Publishing (ohne Datum): Rechte, „limited to 100 API-published posts within a 24-hour moving period“ (an anderer Stelle 50), öffentlicher Link, `media_type=REELS`. https://developers.facebook.com/docs/instagram-platform/content-publishing
- [I2] Instagram Platform, Overview (ohne Datum): Professional-Konto „business or creator“, Instagram Login ohne Facebook-Seite, Standard Access für Personen mit Rolle in der App. https://developers.facebook.com/docs/instagram-platform/overview

**Weitere (Drittquellen und Websuche-Auszüge, schwächer)**
- [X1] Zeitrahmen des Audits, Ablehnungsgründe: bundle.social (02.08.2026) https://bundle.social/blog/tiktok-api-approval , timetopost.co https://timetopost.co/blog/how-to-post-to-tiktok-api/ , indiehackers https://www.indiehackers.com/post/we-got-approved-for-tiktok-s-direct-content-posting-api-here-s-what-we-learned-xJwmsd75Yq5uRQ95wdw2
- [X3] Creator Rewards nur für persönliche Konten, Bewerbung erst 30 Tage nach dem Wechsel: TikTok Creator Academy „TikTok Business vs Personal“ und Creator-Academy-Video vom 22.06.2026 („Switch to a Personal account first so you stay eligible for Creator Rewards“); nur als Suchauszug, nicht abgerufen. https://www.tiktok.com/creator-academy/en/article/TikTok-Business-vs-Personal
- [X4] Planen in TikTok Studio: TikTok-for-Business-Video vom 30.09.2021 („up to 10 days in advance“), Buffer-Video vom 14.10.2026 („up to 30 days ahead“), TikTok-Discover-Seite (30 Tage); nur als Suchauszug, nicht abgerufen.
- [X5] Publer und TikTok-Benachrichtigung: Vergleichsartikel, z. B. https://adaptlypost.com/en/blog/best-tiktok-scheduling-tools
- [X6] Later ohne öffentliche API und MCP, Preise: https://www.post-bridge.com/best-social-media-scheduling-api (Juli 2026), https://www.blotato.com/blog/later-pricing (September 2026)
- [X7] Shorts-Einordnung per API: https://bundle.social/blog/youtube-shorts-api-secrets (17.08.2026)
- [X8] Organische TikTok-Daten nur für Business-Konten: Connector-Dokus, z. B. https://help.coupler.io/article/528-tiktok-organic-supported-metrics-dimensions

**Aus dem Repo**
- [TB] `docs/trends/bericht-2026-11-15.md`: 30 von 30 Vorbild-Videos auf „original sound“, Regel 10 zu Hashtags, robots.txt-Sperre der Embeds.
- [F2] `episoden/folge-02/REVIEW.md`, Abschnitt Teilen-Fassungen: Hauptfassung mit Musik 53 MB, 86,93 s.
- [G4] YouTube Shorts bis 3 Minuten, siehe Quellen in `docs/recherche-plan-v0.md`.
