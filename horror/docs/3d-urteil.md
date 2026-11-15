# Urteil: Kann Claude die 3D-Animation selbst machen?

Stand 14.11.2026. Es wurde nichts produziert, nichts gekauft und kein Konto angelegt. Grundlage sind vier Recherchespuren und ein eigener Messversuch in dieser Cloud-Sitzung (4 CPU-Kerne, 15 GB RAM, keine GPU). Quellen stehen am Ende als [Nummer]. [M] steht für die eigene Messung.

## Die kurze Antwort

Ja, Claude kann echte 3D-Animation selbst bauen. Figuren, Sets, Licht, Kamerafahrten und Schnitte entstehen als Code. In dieser Sitzung, ohne GPU und ohne Blender, rendert eine Klötzchen-Testszene 75 s in 1080 × 1920 in 10 Minuten (einfache Szene mit Schatten) bis 41 Minuten (Volllast) [M].

Der „zu schlechte PC“ ist dabei nicht der Engpass. Der Engpass ist der Abstand zur Referenz: Die Testszene erreicht grob 10–15 % des Referenz-Looks (eigene Schätzung). Es fehlen Sets, Möbel, Gesichter, Schauspiel-Animation und weiches Licht, und ein Teil von 75 s braucht beim Schnitttempo der Referenzen rund 50 eigene Einstellungen.

Für einen Look nahe an den Referenzen ist Linus' PC der beste Ort, entweder mit Blender auf der RTX 5070 Ti oder mit Roblox Studio über dessen eingebauten MCP-Server. Beides kann Claude fernsteuern, aber erst, wenn Linus es einmal einrichtet. „Ohne Blender, ohne PC“ meint bei den Creatorn dagegen fast immer bezahltes KI-Video oder Handy-Aufnahmen, keine echte 3D-Szene.

## Was „kein Blender, kein PC“ bei den Creatorn heißt

Unter diesem Satz laufen drei verschiedene Wege. Nur einer kommt wirklich ohne PC aus, und der liefert keine inszenierte 3D-Animation.

- **KI-Video im Browser oder am Handy** (Google Flow mit Veo, Kling, Seedance in Revid und Anijam, Higgsfield, oVideo). Man braucht keinen PC, aber es entsteht auch keine 3D-Szene: Die KI malt Bilder, die nach Klötzchen aussehen. Die Clips sind 4–10 s lang, abgerechnet wird über bezahlte Credits [26][28].
- **Die „In This Town“-Welle** (ab etwa 31.10.2026). Claude Code steuert Roblox Studio über den eingebauten MCP-Server. „Kein Blender“ stimmt. „Kein PC“ stimmt nicht: Studio läuft nur unter Windows und macOS, und Claude Code muss auf demselben Rechner laufen [1][2][6]. „20 Minuten, 0 Kosten“ ist die Selbstauskunft eines X-Posts [8]. Ovra verschenkt den Prompt und verkauft danach eine bezahlte Community [7].
- **Handy-Weg**: ein Roblox-Spiel aufnehmen, dann in CapCut schneiden und vertonen. Das geht wirklich ohne PC und kostet 0 €. Regie über Kamera und Figuren gibt es aber kaum, und Robloxs eigene Aufnahme ist auf 30 s pro Clip begrenzt [4].

Der Satz stimmt also halb: Er stimmt für einzelne Werkzeuge, aber nicht für das, was die Referenzen zeigen.

## Was der Messversuch gezeigt hat

**Aufbau.** three.js 0.181 lief in Chromium über Playwright, ohne GPU. Die Szene: eine R6-artige Figur aus 6 Boxen mit Gehzyklus, ein Haus mit Veranda und leuchtenden Fenstern, Zaun und Laterne. Dazu Mondlicht mit Schatten, ein flackerndes Punktlicht, Nebel und eine Kamerafahrt. Die Variante „Volllast“ hat zusätzlich 15 Häuser, 7 Figuren, Umgebungsverdeckung (GTAO) und Bloom. Gemessen wurden jeweils 90 Bilder (3 s), die Werte für 75 s sind daraus hochgerechnet [M].

| Software-Grafik | Format | Szene | s pro Bild (mit PNG-Export) | 75 s (2250 Bilder) |
|---|---|---|---|---|
| SwiftShader (Chromium-Standard) | 1080 × 1920 | einfach, Schatten | 0,83 | 31 min |
| Mesa llvmpipe | 1080 × 1920 | einfach, ohne Schatten | 0,21 | 7,8 min |
| Mesa llvmpipe | 1080 × 1920 | einfach, Schatten | 0,28 | 10,4 min |
| Mesa llvmpipe | 1080 × 1920 | Volllast | 1,09 | 40,7 min |
| Mesa llvmpipe, 2 Prozesse parallel | 1080 × 1920 | Volllast | 0,72 effektiv | 27 min |
| Mesa llvmpipe | 576 × 1024 | einfach, Schatten | 0,12 | 4,6 min |
| Mesa llvmpipe | 576 × 1024 | Volllast | 0,36 | 13,3 min |

Was daraus folgt:

- **Rechenzeit.** Rendern ist in der Cloud tragbar. Mesa llvmpipe (Xvfb plus `--use-angle=gl`) war in jeder Einstellung 1,6- bis 3,2-mal schneller als SwiftShader, bei praktisch gleichem Bild [M]. Microlink beschreibt denselben Effekt [17].
- **Format.** Die Referenzdateien liegen in 576 × 1024 vor (ffprobe). Entwürfe in dieser Größe kosten etwa ein Drittel der Rechenzeit.
- **Was nicht gemessen ist.** Bühne, Untertitel und Ton (HyperFrames) sind nicht eingerechnet. Echte Sets mit Texturen dürften langsamer sein: Die Volllast-Szene braucht schon das Vierfache der einfachen.
- **Blender** wurde nicht gemessen. Das Programm war heruntergeladen und per sha256 geprüft, aber die Berechtigungsprüfung hat das Entpacken und Ausführen blockiert.

**Abstand zur Referenz** (eigene Sichtung der Kontaktbögen; das ist ein Urteil, keine Messung):

- **ref.mp4** hat 116 Schnitte in 171 s, also etwa 1,5 s pro Einstellung. Es zeigt texturierte Roblox-Avatare mit Kleidung und Haaren, Gesichter, die mit dem Satz wechseln, möblierte Innenräume, Straßen, Veranden und eine Vogelscheuche in Großaufnahme.
- **r2** zeigt weiches indirektes Licht, Bloom, Tiefenunschärfe und dichte Low-Poly-Sets: Bäckerei, Supermarkt, Stadtstraße und ein Monster.
- **Die Messszene** hat untexturierte Boxen, ein einziges Set und einen einzigen Gehzyklus, und die Figur ist meist von hinten zu sehen (Datei `messung/vergleich-einfach-voll.jpg`).
- **Was fehlt, nach Gewicht:** (1) 5–15 Orte pro Teil mit Möbeln und Requisiten, (2) Schauspiel-Animation (sitzen, zeigen, erschrecken, Türen öffnen), (3) weiches Licht, (4) Kamera-Vielfalt über rund 50 Einstellungen pro 75 s.
- **Gesichter** sind bei Klötzchenfiguren flache Texturen. Sie zum Satz zu wechseln, ist deshalb vergleichsweise einfach (Einschätzung).

## Die Wege im Vergleich

Annahmen: Ein Teil hat 75 s und 40–50 Einstellungen, geplant sind 30 Teile im Monat. Preise sind in USD wie auf den Quellen angegeben, Stand 14.11.2026. Mit „Bauzeit“ ist Claudes Arbeit an Sets, Figuren und Einstellungen gemeint. Sie ist bei keinem Weg gemessen und vermutlich der größte Zeitposten.

| Weg | Qualität vs. Referenzen | Serien-Konsistenz | Kosten je Teil / Monat (30 Teile) | Zeit je Teil | Arbeit für Linus | Risiken |
|---|---|---|---|---|---|---|
| **1. KI-Video per API** (Gemini Omni 1.2, Kling 3.0/4.0, Seedance 2.5) | Einzelbilder können gut aussehen. Ob der Klötzchen- oder Low-Poly-Stil über viele Clips hält, hat niemand unabhängig getestet. Der Stil kann Richtung Realismus driften [15]. | Schwach. Das Modell hat kein Gedächtnis zwischen den Clips. In einer Herstellerprüfung über 16 Folgen waren die Haare in 53 % und das Outfit in 43 % der Bilder falsch [15]. Omni nimmt höchstens 2 Figuren [10]. Orte haben keinen festen Grundriss. | ca. 20–110 USD / ca. 600–3.300 USD; über ElevenLabs bis ca. 7.800 USD. Gerechnet mit dreifachem Ausschuss (Annahme) [10][11][12][16]. | 69–240 s pro Clip, ca. 40–115 Clips pro Teil. Grob 1–5 h, je nach Parallelität (Schätzung). | Konto, Zahlung, Budget freigeben, danach prüfen. | Kosten, Figurendrift, wegfallende Modelle: Die Sora-API ist seit 24.09.2026 abgeschaltet, die Veo-Preview seit 22.10.2026 [13][14]. Der Roblox-Look fällt unter die Roblox-Regel [3]. KI-Label auf TikTok [27]. |
| **2. Cloud-3D ohne GPU** (three.js in dieser Sitzung, **gemessen**) | Messszene grob 10–15 % des Looks. Mit freien CC0-Bausteinen (Kenney, Quaternius) geschätzt 50–65 %, ungetestet [18]. Kein weiches indirektes Licht wie in r2. | Sehr gut. Jeder Teil nutzt dieselben Modelle und Sets, jedes Bild ist reproduzierbar. | 0 € / 0 €. three.js, Mesa, ffmpeg und CC0-Assets sind frei. Die Arbeit zählt gegen Linus' Claude-Plan. | Rendern gemessen: 7,8–40,7 min pro 75 s in 1080 × 1920; Volllast mit 2 Prozessen 27 min [M]. Dazu die Bauzeit, nicht gemessen. | Keine Einrichtung. Ergebnis ansehen und Rückmeldung geben. | Der Look stößt an eine Grenze. Schauspiel-Animation ist aufwendig. Die Sitzungen werden lang. |
| **3. Mietrechner mit GPU** (RunPod, Vast, Modal, jeweils mit Blender) | Wie Blender. Ob Eevee ohne Bildschirm läuft, ist unsicher: Auf RunPod ist ein Fehlschlag belegt [21]. Deshalb mit Cycles planen. | Sehr gut (echte 3D-Szene). | RunPod ca. 0,20–3,60 USD / ca. 6–110 USD. Modal L40S ca. 3–8 USD / ca. 90–240 USD, abzüglich 30 USD Gratisguthaben. Alles Schätzungen [20]. | Rendern 20–75 min mit Eevee bzw. 1,5–4 h mit Cycles (Schätzung). Dazu die Bauzeit. | Einmalig Konto, 5–10 USD Guthaben und API-Schlüssel (ca. 15 min), danach nichts mehr. | Vergessene Maschinen kosten weiter. Eevee ist ungeklärt. Konto und Zahlung sind nötig. |
| **4. Linus' PC mit Blender** (RTX 5070 Ti, Remote Control) | Das höchste Potenzial für den r2-Look: Eevee oder Cycles, weiches Licht, Bloom, Tiefenunschärfe. Der ref.mp4-Look geht nur, wenn man ihn mit eigenen Assets nachbaut. | Sehr gut. | Nur Strom, grob unter 1 € pro Teil und unter 30 € im Monat (unbelegt). | Rendern 0,5–2 h pro 75 s (Schätzung; die 5070 Ti ist in Cycles etwa 1,5-mal langsamer als eine 4090 [22]). Dazu die Bauzeit. | Einmalig 30–60 min. Pro Teil 2–5 min: PC an, App offen, freigeben. Den Rest rechnet der PC. | Der PC muss an und wach bleiben. Natives Windows hat keine Sandbox [24]. Die Ordnerfreigabe für diese Cloud-Sitzung ist eventuell noch nicht freigeschaltet. |
| **5. Roblox Studio** (eingebauter MCP-Server auf Linus' PC) | Am nächsten an ref.mp4: echte Roblox-Avatare und Sets aus dem Creator Store (Sichturteil). Das Licht ist Echtzeit-Licht, weniger weich als in r2. | Gut. Der Place ist gespeichert und die Avatare bleiben gleich, aber die Aufnahmen schwanken von Take zu Take. | 0 € / 0 €: Studio, MCP und OBS sind kostenlos. Optional Moon Animator 2 für einmalig 19,99 USD [5]. | Bau „20 min“ bzw. Rohbau „ca. 5 min“, beides Selbstauskünfte [7][8]. Aufgenommen wird in Echtzeit, jede Einstellung also mindestens in ihrer Länge plus Wiederholungen. | Einmalig 60–90 min. Pro Teil 5–15 min, denn Studio muss offen und sichtbar sein. | Es gibt keinen Offline-Renderer, Ruckler sind möglich [25]. Claude Code muss auf dem PC laufen [6]. Laut Roblox sind R6/R15 nur für die Nutzung auf der Plattform gedacht, kommerziell ohne Lizenz verboten [3]. |
| **6. Aufnahme in Roblox-Spielen** (z. B. Brookhaven plus CapCut) | Roblox-Look, aber kaum Regie über Kamera und Figuren. Weit weg vom Schnitt- und Kamerastil der Referenzen. | Der eigene Avatar bleibt gleich, alles andere hängt vom Spiel ab. | 0 € / 0 € | Hängt an Linus' Spielzeit. Robloxs eigene Aufnahme ist auf 30 s pro Clip begrenzt [4]. | Hoch: Jede Einstellung selbst spielen und aufnehmen, für weitere Figuren braucht es Mitspieler. | Claude kann nur Skript, Stimme, Untertitel und Schnitt übernehmen. Roblox-Regel [3]. |

Was auf allen Wegen gleich bleibt: Stimme, Wort-für-Wort-Untertitel und den Schnitt auf die Wortzeiten kann Claude mit der vorhandenen Werkstatt (HyperFrames) bauen. Welche englische Stimme es wird, war nicht Teil dieser Recherche.

## Empfehlung

Jetzt wird nichts produziert, wie Linus es will. Wenn er loslegt, schlage ich diese Reihenfolge vor.

**0. Erst den Figuren-Stil festlegen.** Die Figuren sollten R6/R15 nicht nachbauen: andere Proportionen, eigene Gesichter, kein Roblox-Logo und kein Roblox-Name im Bild.
- Grund: Laut Roblox gehören die „Classic Roblox Avatars“ samt Ableitungen Roblox. Sie sind „solely for on-platform use“ gedacht und in kommerziellen Inhalten ohne Lizenz verboten [3].
- Ob Creator Rewards auf TikTok als kommerziell gelten, ist offen und entscheidet Roblox selbst. Das ist keine Rechtsberatung.
- Das betrifft auch Code-3D: Die Messfigur ist R6-artig gebaut.

**1. Probe in der Cloud: 0 €, keine Einrichtung, nur mit Linus' Zustimmung.** Claude baut 10–15 s (6–10 Einstellungen) in three.js mit CC0-Bausteinen von Kenney und Quaternius [18] und rendert sie hier. Die Probe soll zwei Fragen klären, ohne die sich nichts seriös planen lässt:
- Wie nah kommt Code-3D an r2 heran? Die 50–65 % sind bisher nur geschätzt.
- Wie lange braucht Claude pro Einstellung? 30 Teile im Monat heißen 1.200–1.500 Einstellungen im Monat. Ob das schaffbar ist, weiß gerade niemand.

**2a. Reicht der Look der Probe, bleibt die Serie in der Cloud.**
- Kein Geld, keine Einrichtung, der PC kann aus bleiben.
- Gemessene Renderzeit 8–41 min pro Teil [M].
- Sets und Figuren werden von Teil zu Teil wiederverwendet. Das macht ab Teil 2 die Bauzeit kleiner und die Serien-Konsistenz kostenlos.

**2b. Reicht er nicht, wird Blender auf Linus' PC der Hauptweg.**
- Gratis, und die stärkste verfügbare GPU.
- Eevee läuft am Windows-Desktop ohne das Headless-Problem der Mietrechner [21].
- Blender unterstützt RTX-50-Karten seit Version 4.4 [23].
- Das Rendern geht Bild für Bild genau auf die Wortzeiten der Stimme.
- Gesteuert wird am sichersten über eine Claude-Code-Sitzung direkt auf dem PC, per Remote Control vom Handy aus [24]. Dass diese Cloud-Sitzung sich an einen PC-Ordner hängt, ist laut Tool noch nicht für alle Konten freigeschaltet, und auf Linus' PC ist derzeit kein Ordner freigegeben.
- Einen Blender-MCP braucht es nicht. `blender -b -P szene.py` reicht.
- Bewegung per Text: NVIDIA Kimodo (höchstens 10 s pro Clip) liefe nur auf der NVIDIA-GPU des PCs. HY-Motion scheidet aus, weil die Lizenz nicht in der EU gilt [19]. Für Klötzchenfiguren aus wenigen starren Teilen reichen vermutlich Posen aus Code plus CC0-Animationen (Einschätzung).

**Roblox Studio** nur, wenn Linus genau den Look von ref.mp4 will und das Roblox-Risiko aus Punkt 0 bewusst trägt.
- „Zu kompliziert“ ist kein guter Grund dagegen: Den Bau mit Luau, Avataren, Animation und Kamera-Skript übernimmt Claude über den MCP-Server [1].
- Die echten Gründe dagegen: Aufgenommen wird in Echtzeit mit OBS, das Studio-Fenster muss sichtbar sein [25], und die Avatar-Regel gilt [3].

**KI-Video** nicht als Hauptweg.
- 600–3.300 USD im Monat für 30 Teile, und Figuren und Orte driften [15].
- Höchstens später einzelne Einstellungen, etwa ein Monster-Moment. Vorher ein Probelauf unter 1 USD (10 Entwürfe mit Omni in 360p) und nur mit Linus' Freigabe.

**Mietrechner** nur als Ersatz, wenn der PC aus ist und die Cloud-CPU zu langsam wird. Dann mit Cycles planen.

**Aufnahme in Roblox-Spielen** nein. Claude kann dabei kaum etwas beitragen, und die Regie fehlt.

## Was Linus entscheiden oder einrichten müsste

**Entscheiden**

1. **Look:** Roblox-Original wie ref.mp4 oder eigener Klötzchen- bzw. Low-Poly-Stil wie r2. Meine Empfehlung ist der eigene Stil.
2. **Geld verdienen:** Soll die Serie Geld bringen (Creator Rewards)? Wenn ja, spricht noch mehr für den eigenen Stil.
3. **Probe:** Ein Ja zur Probe in Stufe 1. Sie kostet nichts.
4. **Takt:** Erst nach der Probe festlegen. 30 Teile im Monat sind bei 40–50 Einstellungen pro Teil viel, und belastbare Zahlen gibt es erst danach.

**Einrichten, nur für Stufe 2b** (einmalig ca. 30–60 min) [24]:

1. Claude Code auf Windows installieren (Desktop-App oder `irm https://claude.ai/install.ps1 | iex`) und mit dem Abo anmelden. Dazu Git for Windows.
2. Einen Arbeitsordner anlegen, z. B. `D:\DeepTok3D`. Er darf nicht der Home-Ordner und nicht versteckt sein.
3. Blender 5.2 LTS (mindestens 4.4), ffmpeg und einen aktuellen NVIDIA-Treiber installieren. Das kann Claude nach Freigabe auch selbst machen.
4. Remote Control einschalten: in der Desktop-App unter Settings > Claude Code > „Use this computer from your phone and claude.ai“ den Ordner hinzufügen, oder im Ordner `claude remote-control` starten. „Keep this computer awake“ an, Energiesparen beim Rendern aus.
5. Rechte-Regeln für Claude setzen, weil natives Windows keine Sandbox hat.

**Zusätzlich nur für Roblox** (ca. 30 min) [1][25]:
- Roblox Studio installieren und anmelden.
- „Enable Studio as MCP server“ einschalten, dann Quick connect > Claude Code.
- OBS mit einer Leinwand von 1080 × 1920 und WebSocket-Server einrichten.

**Nicht nötig:** Blender- oder Roblox-Kenntnisse, GPU-Miete, Konten bei KI-Video-Anbietern. Mixamo würde eine Adobe-ID brauchen, die CC0-Bausteine brauchen kein Konto.

**Aufräumen:** Die kostenlose Preisabfrage im ElevenLabs-Connector hat einen leeren Flow hinterlassen (https://elevenlabs.io/app/flows/G6AzXmqrLZ6C8aUOGumK). Generiert wurde darin nichts. Linus kann ihn löschen.

## Unbelegt oder offen

- **Bauzeit:** Claudes Bauzeit pro Einstellung ist auf keinem Weg gemessen. Davon hängt ab, ob 30 Teile im Monat überhaupt gehen.
- **Qualität:** Die Werte (Messszene 10–15 %, mit CC0-Bausteinen 50–65 %) und die Einordnung, ref.mp4 sei in Roblox aufgenommen und r2 in Blender gerendert, sind Sichturteile.
- **Renderzeiten außerhalb der Cloud:** Die Zahlen für Blender, für Linus' PC und für Mietrechner sind Schätzungen. Blender wurde nicht gemessen, und für Eevee auf einer 4090 oder 5070 Ti fehlt ein sauberer Benchmark [29].
- **Eevee auf Mietrechnern:** Ob Eevee dort ohne Bildschirm läuft, ist offen [21].
- **Roblox-Regel:** Ob sie für monetarisierte TikToks greift und ob eigene Klötzchenfiguren als „derivatives“ von R6/R15 gelten, entscheidet Roblox nach eigenem Ermessen [3].
- **KI-Video:** Die Kosten beruhen auf einem angenommenen dreifachen Ausschuss und auf teils widersprüchlichen Drittquellen zu Kling und Seedance [11][12].
- **Creator-Zeitangaben** („20 Minuten“, „5 Minuten Rohbau“) sind Selbstauskünfte [7][8]. Die einzige nachprüfbare Angabe eines Creator-Werkzeugs: NoCodeHack nennt etwa 1 h (Vorschau) bzw. 2 h (posting-fähig) Rendern pro 60 s mit Laptop-GPU [9]. Reddit und Discord ließen sich nicht auswerten.
- **Ein Widerspruch zwischen den Spuren:** Eine Spur schrieb, für die Cloud fehle „eine GPU zum Rendern“. Die Messung widerlegt das für three.js. Für Blender Eevee gilt es dagegen weiter: Eevee braucht OpenGL oder Vulkan, Cycles auf 4 Kernen wäre sehr langsam (Schätzung).

## Quellen

- [M] Eigene Messung, 14.11.2026: `/tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/scratchpad/horror-3d/messung/` (ergebnisse.jsonl, ergebnisse-gl.jsonl, ergebnisse-voll.jsonl, par-1.json, par-2.json, vergleich-*.jpg); Schnittliste und Formate der Referenzen per ffprobe.
- [1] Roblox Creator Docs: Connect to the Roblox Studio MCP server, https://create.roblox.com/docs/studio/mcp (abgerufen 14.11.2026)
- [2] Roblox Studio Setup (nur Windows und Mac), https://create.roblox.com/docs/studio/setting-up-roblox-studio (abgerufen 14.11.2026)
- [3] Roblox Name and Logo Community Usage Guidelines, https://en.help.roblox.com/hc/en-us/articles/115001708126-Roblox-Name-and-Logo-Community-Usage-Guidelines (abgerufen 14.11.2026)
- [4] Roblox Newsroom: Roblox Moments, Video Captures bis 30 s, https://about.roblox.com/newsroom/2025/09/roblox-moments-user-generated-discovery (05.09.2025)
- [5] Roblox-Toolbox-Schnittstelle, Moon Animator 2 (19,99 USD, 33 % Rabatt), https://apis.roblox.com/toolbox-service/v1/items/details?assetIds=4725618216 (abgerufen 14.11.2026)
- [6] Space-node: Connect Claude to Roblox Studio (2026), https://www.space-node.net/blog/connect-claude-to-roblox-studio-2026 (31.10.2026)
- [7] Ovra / SimplyAzan: The free „In This Town“ Roblox prompt, https://ovra.pro/roblox/ (undatiert, abgerufen 14.11.2026)
- [8] Finn (@finnardley) auf X, https://x.com/finnardley/status/2116504270199554078 (31.10.2026, aus Post-ID errechnet; nur Suchauszug, Post selbst nicht abrufbar)
- [9] NoCodeHack Roblox Engine (Blender-Render, ca. 1–2 h pro 60 s mit Laptop-GPU), https://github.com/nocodehack/nocodehack-roblox-engine (abgerufen 14.11.2026)
- [10] Google Gemini API Pricing und Omni-Doku, https://aistudio.google.com/docs/pricing und https://aistudio.google.com/docs/omni (abgerufen 14.11.2026)
- [11] fal: Kling 3.0 Pro, https://fal.ai/models/fal-ai/kling-video/v3/pro/text-to-video (abgerufen 14.11.2026); Kling-4.0-Preisvergleich, https://dev.to/bitbooz/where-is-kling-40-cheapest-every-platform-compared-prices-checked-nov-14-2026-o7a (14.11.2026)
- [12] UGC Copilot: AI Video Model Price Index, https://ugccopilot.ai/research/ai-video-model-price-index/ (01.10.2026)
- [13] OpenAI Deprecations (Sora-API am 24.09.2026 abgeschaltet), https://developers.openai.com/api/docs/deprecations (abgerufen 14.11.2026)
- [14] Gemini API Video (Veo-3.1-Previews am 22.10.2026 abgeschaltet), https://aistudio.google.com/docs/video (abgerufen 14.11.2026)
- [15] TWno1: AI Series Character Consistency (Herstellerprüfung, 16 Folgen, 244 Bilder), https://twno1.ai/blog/seedance-character-consistency-series-en (05.10.2026)
- [16] ElevenLabs Pricing, https://elevenlabs.io/pricing, und eigene estimate_only-Abfragen im Connector (14.11.2026)
- [17] Microlink: WebGL without a GPU, https://microlink.io/blog/webgl-without-a-gpu (undatiert, abgerufen 14.11.2026)
- [18] Kenney Blocky Characters (CC0), https://kenney.nl/assets/blocky-characters; Quaternius Universal Animation Library (CC0), https://quaternius.com/packs/universalanimationlibrary.html (abgerufen 14.11.2026)
- [19] NVIDIA Kimodo v1.2 (Text zu Bewegung, kommerziell, braucht NVIDIA-GPU), https://huggingface.co/nvidia/Kimodo-SOMA-RP-v1.2 (15.10.2026); HY-Motion-Lizenz (gilt nicht in der EU), https://huggingface.co/tencent/HY-Motion-1.0/resolve/main/LICENSE.txt (abgerufen 14.11.2026)
- [20] RunPod Pricing, https://www.runpod.io/pricing; Vast.ai-Marktpreise, https://computeprices.com/providers/vast/gpus/rtx4090; Modal Pricing, https://modal.com/pricing; Modal-Beispiel Blender, https://modal.com/docs/examples/blender_video (alle abgerufen 14.11.2026)
- [21] egldockertest (EGL auf RunPod fällt auf Software-Rendering zurück), https://github.com/rewbs/egldockertest (Logs 22.03.2024)
- [22] Renderjuice: RTX 5070 Ti für Blender, https://www.renderjuice.com/gpus/rtx-5070-ti-for-blender (abgerufen 14.11.2026)
- [23] Blender 4.4 Release Notes Cycles (RTX 50), https://developer.blender.org/docs/release_notes/4.4/cycles/ (abgerufen 14.11.2026)
- [24] Claude Code Docs: Remote Control, https://code.claude.com/docs/en/remote-control; Projects, https://code.claude.com/docs/en/claude-projects; Setup (Windows, keine Sandbox), https://code.claude.com/docs/en/setup (abgerufen 14.11.2026)
- [25] Roblox DevForum (Staff): Videoaufnahmen in Studio mit OBS, https://devforum.roblox.com/t/tips-for-capturing-high-quality-screenshots-and-videos-in-studio/2723897 (13.02.2024)
- [26] Google Flow Hilfe: Credits, https://support.google.com/flow/answer/16526234?hl=en (abgerufen 14.11.2026)
- [27] TikTok Support: About AI-generated content, https://www.tiktok.com/support/faq_detail?id=7636670084747893268 (abgerufen 14.11.2026)
- [28] Anbieterseiten (Werbung): Anijam, https://www.anijam.ai/tools/roblox-story-video-maker/; Revid, https://www.revid.ai/tools/roblox-animation-maker; oVideo, https://ovideo.io/resources/roblox-story-video-generator (13.11.2026) (sonst abgerufen 14.11.2026)
- [29] Blenderartists: Cycles vs EEVEE Next (Eevee ca. 6 s pro Bild bei 1080p, GPU nicht genannt), https://blenderartists.org/t/cycles-vs-eevee-next-comparison/1540799 (26.07.2024)
