# Anhang C: Widersprüche, Kosten, Risiken, Quellen

Gehört zu `plan-final.md`. Stand 15.11.2026.

## C1. Widersprüche zwischen den Recherchen, entschieden

| Frage | Was die Recherchen sagen | Entscheidung | Warum |
|---|---|---|---|
| Herstellungsweg | Plan: Roblox Studio auf dem PC, Regie per Skript, Aufnahme mit OBS. 3D-Urteil: erst kostenlose Cloud-Probe mit eigenem Stil, dann Cloud oder Blender am PC. Bewegungs-Spec: three.js in HyperFrames als Hauptweg. | Cloud mit three.js und HyperFrames; Blender am PC nur als Ausbau | Linus' Vorgabe 6 (kein Roblox Studio, kein PC); Roblox-Avatar-Regel [L1b]; Studio nimmt nur in Echtzeit auf, das Fenster muss offen bleiben [3D]; die Bewegung der Referenzen ist zum größten Teil Kamera und Schnitt, beides entsteht aus Wortzeiten [BEW] |
| Sprache | Plan: Deutsch als Haupt-, Englisch als Zweitkonto (frühe deutsche Welle). | Englisch zuerst, Deutsch in Phase 2 | Vorgaben 1 und 5: Vorbilder und gesuchte Stimmen sind englisch. Die deutsche Welle ist nicht leer: ≥ 6 Konten mit 12–62 Videos pro Woche [N6]. #inthistown hat etwa 23-mal so viele Aufrufe wie #indieserstadt [N2] |
| Serien | Plan: Teil 2 nur bei Treffern (> 100.000 in 72 h). Format-Spec: kein „Teil 2“. Bewegungs-Spec: Cliffhanger und Karte „Teil 2“. | Serien ab dem ersten Video | Vorgabe 3. Geprüft mit zwei Einteilern in Woche 4 |
| Länge | Plan: 150–175 s. Format-Spec: 150–180 s. Bewegungs-Spec: 65–150 s. 3D-Urteil: 75 s je Teil. | 70–90 s je Teil | über 1 min [G1], kurz genug für eine hohe Abschlussrate (u), weniger Einstellungen je Upload. Woche 2 testet 110–130 s |
| Musik | Plan: eigenes Bett, −14 LUFS. Sound-Recherche: Nachbau-Betten je Referenz. | TikTok-Sound in der App; eigene Betten nur als Probemix | Vorgabe 2 |
| Untertitel | vier Stile in vier Referenzen; Format-Spec: Mitte y ≈ 1.360 | r5-Stil, Mitte y ≈ 1.200 | passt zur Stimme; liegt in der sicheren Zone 168–1330 |
| Takt | Plan: 4 Geschichten pro Woche. 3D-Urteil: erst nach der Probe festlegen. | 4 Teile pro Woche in Phase 1 | Bauzeit ungemessen; Phase 2 erhöht |
| Monster | r1 nutzt fremde Figuren (Siren Head, SCP, Slender Man) | nur eigene Monster | fremde Figuren und Plots sind nicht frei [L6]; Siren Head stammt von Trevor Henderson [BEW] §4 |

## C2. Kosten des empfohlenen Wegs

**Rechenweg Stimme:** Der r5-Stil braucht etwa 1.360 Zeichen je Minute fertigem Video, weil die beschleunigte Stimme mehr Wörter pro Minute spricht [ST]. Ein Teil von 75 s hat also etwa 1.700 Zeichen.

| Posten | je Teil (75 s) | je Monat (30 Teile) | Quelle |
|---|---|---|---|
| Stimme Inworld TTS-2 (20–25 $ je 1 Mio. Zeichen) | 0,03–0,04 $, mit einem Neuversuch 0,07–0,09 $ | 1–3 $ | [G5c] |
| Render in der Cloud | 0 € | 0 € | im Claude-Abo |
| 3D-Bausteine (Kenney, Quaternius, CC0) | 0 € | 0 € | [3D] |
| Hintergrundsound aus der TikTok-Bibliothek | 0 € | 0 € | Vorgabe 2 |
| Effekte (selbst synthetisiert) | 0 € | 0 € | [SO] |
| **Summe** | **≈ 0,03–0,09 $** (ohne bzw. mit Neuversuch) | **≈ 1–3 $** | |

**Alternativen:**
- Cartesia Pro: 5 USD/Monat, 100.000 Credits, also etwa 58 Teile, falls 1 Credit 1 Zeichen entspricht (u) [G5b].
- ElevenLabs Starter: 6 USD/Monat (erster Monat 1 USD), 30.000 Credits, also etwa 17 Teile ohne Neuversuch. Creator: 22 USD/Monat (erster Monat 11 USD), 121.000 Credits, also etwa 70 Teile [G5].
- Blender-Ausbau auf dem PC: nur Strom, grob unter 1 € je Teil (u) [3D].

**Phase 0:** 0 €. Probe-Stimmen aus den Gratis-Kontingenten von Inworld und Cartesia, nichts wird veröffentlicht. Für veröffentlichte Videos gilt die Lizenzregel aus Anhang B3.

**Rechenzeit:** gemessen 0,28–1,09 s je Bild in 1080 × 1920 ohne GPU [3D], in HyperFrames 0,36 s je Bild [BEW]. Ein Teil von 75 s hat 2.250 Bilder, also etwa 10–41 min. Mit Bewegungsunschärfe etwa das Vierfache (hochgerechnet) [BEW].

**Claude-Zeit:** Einmalig 40–80 h für Rig, Gesichter, Animationen, Kamera-Bausteine, Sets, Shotlisten-Compiler und Messtor (S) [BEW] 3c. Je Teil ungemessen; Phase 0 misst. Ob das Abo-Kontingent neben der DeepTok-Fabrik reicht, ist offen (u).

**Geld:** Creator Rewards erst ab 10.000 Followern und 100.000 Aufrufen in 30 Tagen [G1]. Satz unbekannt; eine Drittquelle nennt 0,40–1,00 $ je 1.000 qualifizierte Aufrufe, ohne Methode [G2]. In den ersten Monaten realistisch 0 €. Steuern, Gewerbe und Familienversicherung vor der ersten Auszahlung klären [G7] (Details in `plan.md` § 6).

## C3. Risiken im Detail

1. **Roblox-Avatar-Regel.** Laut Roblox gehören die „Classic Roblox Avatars“ samt Ableitungen Roblox, sind „solely for on-platform use“ und in kommerziellen Inhalten ohne Lizenz verboten [L1b]. Ob eigene Klötzchenfiguren als Ableitung gelten, entscheidet Roblox nach eigenem Ermessen (u). Gegenmittel: andere Proportionen, eigene Gesichter, kein Roblox-Name, -Logo oder -Hashtag. Das betrifft auch r2, das R6-artige Figuren in Blender nachbaut.
2. **Trend-Sättigung.** Die Welle „In this town“ ist jung: alle 10 Top-Videos des Hashtags vom 27.10.–13.11.2026 [N2]. Nachahmer-Konten liegen im Median bei 114–9.941 Aufrufen [N3]. Englisch ist stark gesättigt: allein 22 YouTube-Kanäle mit Vogelscheuchen-Shorts (plan.md [N5]). Gegenmittel: Handwerk, eigene Welten und Monster, Serie, Stoppregeln.
3. **Bauzeit ungemessen.** 30 Teile im Monat heißen rund 1.400–1.700 Einstellungen (75 s bei 38–45 je Minute [BEW], also etwa 48–56 je Teil; eigene Rechnung). Weder Claudes Zeit je Einstellung noch das Abo-Kontingent sind bekannt. Phase 0 misst beides.
4. **Look-Decke.** Die Messszene erreichte grob 10–15 % des Referenz-Looks; mit CC0-Bausteinen geschätzt 50–65 % (S) [3D]. Rückfall: Blender auf Linus' PC (RTX 5070 Ti, einmalig 30–60 min Einrichtung) [3D].
5. **Creator-Rewards-Bedingungen** [G1]:
   - Konto: Wohnsitz in einem von 8 Ländern (USA, UK, DE, FR, JP, KR, MX, BR), ab 18, persönliches Konto, 10.000 Follower, 100.000 Aufrufe in 30 Tagen.
   - Video: original, über 1 min, mindestens 1.000 Aufrufe im For-You-Feed; kein Duet, Stitch oder Photo Mode.
   - Aufruf zählt ab 5 s, über die Suche ab 30 s, nur aus den 8 Ländern.
   - Ab 5 Video-Verstößen in 30 Tagen ist das Konto nicht mehr berechtigt; bei Horror ein echtes Risiko.
6. **Englisches Konto aus Deutschland.** Ob TikTok es an US- und UK-Zuschauer verteilt, ist offen (u). Phase 1 misst den Länderanteil in TikTok Studio.
7. **Verweis auf den nächsten Teil.** Playlists laut Drittquellen erst ab 5.000–10.000 Followern, widersprüchlich [PL] (u). Rückfall in Anhang A6.
8. **Scratchpad.** Alle Recherche-Dateien liegen im Scratchpad und können gelöscht werden. Phase 0 kopiert Spezifikationen, Mess-Skripte und Effekte in ein eigenes Repo (nicht unter `studio/`, weil das Format DeepToks `DESIGN.md` §8 widerspricht).

## C4. Quellen

Abrufe am 14.11.2026, sofern nicht anders angegeben.

**Eigene Messungen und Recherchen (Scratchpad)**
- [FS] Format-Spezifikation, Messung an `ref.mp4` (@concet5612), 14.11.2026: `/tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/scratchpad/horror-ref/format-spec.md`
- [3D] Urteil „3D ohne PC“ mit Messversuch (three.js, Mesa llvmpipe, 4 CPU-Kerne, keine GPU), 14.11.2026: `/tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/scratchpad/horror-3d/urteil.md`, Messdaten in `horror-3d/messung/`
- [BEW] Bewegungs-Spezifikation (optischer Fluss je Bildpaar an r1, r2, r5, ref; Render-Test in HyperFrames 0.8.206), 14.11.2026: `/tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/scratchpad/horror-analyse/bewegung/bewegungs-spec.md`
- [Analyse] Analysen von r1, r2, r5 (Format, Herstellung, Stimme, Bett, Untertitel, Bauplan), 14.11.2026: `/tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/tasks/wg4q8bv8p.output` (`result.analysen`)
- [ST] Stimmen-Abgleich (WeSpeaker, Resemblyzer, WavLM; 139 Clips), 14./15.11.2026: dieselbe Datei (`result.stimme`), Hörproben und `messwerte-hoerproben.json` in `/tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/scratchpad/horror-analyse/stimme/`
- [SO] Klangbett-Analyse und Nachbau, 14./15.11.2026: dieselbe Datei (`result.sound`), Dateien in `/tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/scratchpad/horror-analyse/sound/`
- Erster Plan mit allen Quellen zu Nische, Geld und Recht: `/tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/scratchpad/horror-ref/plan.md`

**Plattformen und Geld**
- [G1] TikTok Creator Academy: Creator Rewards Program, veröffentlicht 10.09.2026. https://www.tiktok.com/creator-academy/en/article/creator-rewards-program; Additional Reward (1080p). https://www.tiktok.com/creator-academy/en/article/crp-unlock-additional-reward
- [G2] Influencer Marketing Hub: How Much Does TikTok Pay in 2026, aktualisiert 01.10.2026. https://influencermarketinghub.com/how-much-does-TikTok-pay/
- [G5] ElevenLabs Pricing (Free ohne kommerzielle Lizenz; Starter 6 USD, 30.000 Credits; Creator 22 USD, 121.000 Credits). https://elevenlabs.io/pricing
- [G5b] Cartesia Pricing (Free ohne kommerzielle Lizenz; Pro 5 USD/Monat, 100.000 Credits). https://cartesia.ai/pricing
- [G5c] Inworld Pricing (On-Demand 0 $ Grundgebühr, kommerzielle Lizenz, TTS-2 25 $ je 1 Mio. Zeichen). https://inworld.ai/pricing; Spanne 20–25 $ aus `docs/research/research-voice.md` im Repo (26./27.10.2026)
- [G7] § 14 GewO, § 11 GewStG, IHK München (3/2026); Details in `plan.md` § 6
- [PL] Drittquellen zu TikTok-Playlists (Schwelle 5.000–10.000 Follower, widersprüchlich), abgerufen 15.11.2026: https://publer.com/blog/tiktok-playlists/, https://socialk.it/en/blog/tiktok-playlists-guide, https://topqlearn.com/what-are-tiktok-playlists

**Recht und Regeln**
- [L1] Roblox DevForum: Update to Roblox Licensing Program & Brand Guidelines, 23.06.2022 (älter). https://devforum.roblox.com/t/update-to-roblox-licensing-program-brand-guidelines/1843674
- [L1b] Roblox Name and Logo Community Usage Guidelines, abgerufen 14.11.2026 (Zitat „solely for on-platform use“ laut 3D-Recherche; eine andere Spur kam nur an einen Suchauszug). https://en.help.roblox.com/hc/en-us/articles/115001708126-Roblox-Name-and-Logo-Community-Usage-Guidelines
- [L3] TikTok Community Guidelines, in Kraft 24.09.2026: Safety and Civility, Youth Safety, Sensitive and Mature Themes. https://www.tiktok.com/community-guidelines/en/safety-civility, https://www.tiktok.com/community-guidelines/en/youth-safety, https://www.tiktok.com/community-guidelines/en/sensitive-mature-themes
- [L4] TikTok Creator Academy: AI-generated content label und Originality policy, 26.09.2026. https://www.tiktok.com/creator-academy/en/article/ai-generated-content-label, https://www.tiktok.com/creator-academy/en/article/tiktok-originality-policy
- [L5] YouTube: Werbetauglichkeit (drastische Spielgewalt im Vorschaubild oder in den ersten 7 s), „inauthentic content“. https://support.google.com/youtube/answer/6162278, https://support.google.com/youtube/answer/1311392
- [L6] § 23 UrhG https://dejure.org/gesetze/UrhG/23.html; Reddit User Agreement, gültig ab 01.07.2026; AG München 13.02.2026, 142 C 9786/25 (KI-Inhalte)

**Markt**
- [N2] TikTok-Hashtag-Embeds: #robloxstory 49,9 Mrd., #inthistown 378,9 Mio., #indieserstadt 16,7 Mio. Aufrufe; Top-Videos von #inthistown vom 27.10.–13.11.2026. https://www.tiktok.com/embed/tag/inthistown
- [N3] Creator-Embeds der Nachahmer (@townrulestv Median 114, @thistownbiz 9.941, @inthisworldstory 7.972). https://www.tiktok.com/embed/@thistownbiz
- [N6] Deutsche Kanäle (@agentsudais1 ≈ 31 Videos/Woche, @shazyedits60 ≈ 48/Woche u. a.). https://www.tiktok.com/embed/@agentsudais1
