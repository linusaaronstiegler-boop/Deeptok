# Look 2: Zeitungspapier

Helles, leicht graues Zeitungspapier, Druckschwarz und ein Stift des Redakteurs (Blaustift; Rotstift nur mit Linus' Ja, siehe unten). Echte Fotos und echte Clips im Rasterdruck, ausgerissen oder ausgeschnitten und aufgeklebt, Schlagzeilen als Papierstreifen, Zahlen auf schwarzen Balken, der Bildnachweis senkrecht an der Bildkante. Hell, neutral, Foto, dicht. Vorbild ist die Collage von Simplicissimus; eigenständig, weil wir keine Zeitungsköpfe nachbauen und nur echte, frei lizenzierte Bilder kleben.

- **Probe:** `probe-zeitungspapier/` (Vergleichstafel Nr. 2). Seite 1: dasselbe Stadion als Foto (Camp Nou mit Sitz-Schrift und Spielfeld); vorgesehen ist ein echter Clip vom vollen Camp Nou 2022 (Live-Situation), den Commons am 28.10. noch nicht hergab (429), Streifen „Barcelona“, Balken „45 Mio. €“, Rotstift-Kreis ganz auf Papier. Seite 2 nach hartem Schnitt auf „Bayern“: Lewandowski als ausgeschnittene Figur aus einem echten Spielfoto (FC Bayern, 2019), Streifen „bis 30.06.2023“ mit roter Unterstreichung, Balken „0 € Ablöse“. **Die Probe zeigt absichtlich die Rotstift-Fassung**, damit Linus entscheiden kann; gültig ist bis zu seinem Ja der Blaustift (Konstante `ROT` in `werkzeug/looks_zeitung.py`, Kreis und Unterstreichung).
- **Geändert nach der Kritik (28.10.):** Der Kreis lief über Schwarz und Raster (2,75 : 1 und 1,55 : 1); jetzt liegt er ganz auf Papier mit 34 px Luft. Das Camp-Nou-Foto zeigt jetzt Sitz-Schrift und Spielfeld ohne Dachbanner. Das Spielfoto ging im Raster im roten Rang unter; als ausgeschnittene Figur bleibt die Person erkennbar.

## Wofür

| passt | passt nicht |
|---|---|
| Weltlage und News-Erklärer mit Belegen (das Morgen-Briefing), Ereignisse mit echten Fotos und Clips, Disziplin an echten Geschichten, Rhetorik an einer echten Rede (Foto des Redners, Zitat als Streifen) | Mathe und Naturwissenschaft (Raster frisst feine Linien); Themen ohne echtes Bild; reine Zahlenreihen |

## Palette

| Token | Hex | Rolle | Kontrast |
|---|---|---|---|
| `grund` | `#E4DFD1` | Zeitungspapier, Grund bis an alle Ränder | – |
| `papier` | `#F4F1E8` | ausgeschnittene Streifen (heller als der Grund) | 1,18 zum Grund |
| `tinte` | `#161514` | Druckschwarz: Text, Balken, Rasterpunkte | 13,7 auf Grund, 16,2 auf Papier |
| `grau` | `#5E5A52` | Bildnachweis, Quelle | 5,2 auf Grund |
| `blau` | `#1F4FB5` | **Blaustift: hier hinsehen** (gesuchte Größe, Fokus) | 5,5 auf Grund, 6,5 auf Papier |
| `rot` | `#B8161D` | Irrtum, Verlust (immer mit Durchstrich); nur mit Linus' Ja: Rotstift als Signal statt `blau` | 5,0 auf Grund, 5,9 auf Papier |

**Stift-Regel (gilt jetzt):** Der Blaustift des Redakteurs markiert, worauf es ankommt (Kreis, Pfeil, Unterstreichung). Rot bleibt Irrtum oder Verlust wie in allen Looks, immer mit Durchstrich. Höchstens ein Stift-Marker je Bild, nie Stift- oder Rot-Flächen, **nie Stift oder Rot auf Schwarz oder auf Raster** (Blau auf Druckschwarz 2,5 : 1, Rot 2,7 : 1): nur auf Papier oder Papierstreifen, ≥ 24 px Luft zu Balken und Bildern.

**Nur mit Linus' Ja (Ausnahme im Haus, noch nicht entschieden):** Rot wird der Rotstift und markiert, worauf es ankommt, nie den Irrtum. Der **Irrtum** bekommt dann einen schwarzen Zensurbalken über dem falschen Wort. Alle übrigen Stift-Regeln gelten unverändert.

## Schriften

| Stufe | Familie | Größe | Farbe |
|---|---|---|---|
| D1 Zahl im Balken | Anton 400 (schmale, fette Grotesk) | 150 / 190 px | Papier auf Druckschwarz |
| D2 Schlagzeile auf Streifen | Anton 400 | 124 px | Tinte auf Papier |
| T Text | Source Serif 4 600 | 52 / 62 px | Tinte |
| C Bildnachweis | Source Serif 4 400 | 34 / 42 px | Grau |

Lokal als woff2 (`@fontsource/anton@5.3.0`, `@fontsource/source-serif-4@5.3.1`, OFL), Namen „ZP Anton“ und „ZP Source Serif“. Anton ist schmal: Bei 150 px ist die Versalhöhe fast so groß wie bei D1 einer breiten Schrift. „bis 30.06.2023“ wäre in 150 px 877 px breit; als Schlagzeile steht es in 124 px (D2).

## Grund und Textur

Glattes Zeitungspapier ohne Korn. Die Textur kommt aus dem Material: Rasterpunkte in Bild und Clip, Papierriss-Kanten, Schlagschatten unter jedem aufgeklebten Stück (`drop-shadow(0 6–10px 10–16px rgba(22,21,20,.35))`).

## Held

Ein echtes Bild des Ortes, der Person oder des Ereignisses im Rasterdruck: als ausgerissenes Stück (oben und unten gerissen, −1 bis −2° gedreht) oder als ausgeschnittene Figur (Personen, damit sie sich vom Hintergrund lösen). Ein kurzer Clip ist das stärkste Stück: Er läuft im Rasterdruck weiter wie eine „lebende Zeitung“.

## Kamera und Übergänge

- Die Kamera steht. Neues Element = ein neues Stück wird aufgeklebt.
- **Neue Seite = harter Schnitt** auf das Nomen der neuen Sache (Probe: „Bayern“). Keine Blättern-Animation, keine Wischblende.
- Nachfahrt nur innerhalb eines ausgerissenen Fotos (Ausschnitt bleibt, Bild wächst 1,15×, 0,5 s), nach der Lesezeit.
- Eintritte: **Ausschnitt** (Streifen kommt von außerhalb des Bildes, Drehung 6° → 2°, 0,55 s `expo.out`), **Balken** (wischt von links, 0,3 s `power3.inOut`, Zahl hart am Ende), **Aufkleben** (Figur 3 % zu groß, 2° verdreht, sitzt nach 0,2 s).

## Takt

Dicht: alle 0,5–0,7 s klebt ein neues Stück; nach dem Schnitt folgen Streifen, Unterstreichung und Balken in schneller Folge. Halten ≥ 1,2 s nach jeder Landung bleibt.

## Marker

Blaustift, handgezeichnet: Kreis (≤ 1 je Video), Pfeil, Unterstreichung; 10 px plus zweite Spur; auf dem Cue-Wort; immer auf Papier. Irrtum: roter Durchstrich über dem falschen Wort. Nur mit Linus' Ja: Rotstift statt Blaustift, der Irrtum als schwarzer Zensurbalken, der in 0,3 s über das falsche Wort wischt.

## Credits

Senkrecht an der rechten Kante des Bildes, von unten nach oben zu lesen, wie in der Zeitung: „Foto: Urheber, Jahr,“ / „Lizenz, bearbeitet,“ / Kurzlink / Quelle der Zahl. Source Serif 4 400 34 px in Grau, höchstens 5 Zeilen, Spalte nicht länger als das Bild.

## Fotos und Clips

`bilder.suche(…)` → `werkzeug/fotos.py` (Graustufen, Ausschnitt, Freistellen für Personen; Clips mit ffmpeg gekürzt, ohne Ton) → im Video Rasterdruck als HyperFrames-Behandlung „Monochrome Screen Print“ auf `<img>` und `<video>` (Palette Tinte/Grund, Zelle 0,16; `werkzeug/zeitung-raster.json`). Die Behandlung ist eine Bearbeitung: bei CC BY-SA wieder CC BY-SA, vermerkt in `credits.json`. Personen mit Commons-Einschränkung „personality“ nur mit Freigabe (Person des öffentlichen Lebens in ihrer Rolle).

## Drei Verbote

1. Nachgebaute Zeitungsköpfe, Logos oder Layouts echter Medien. Eine fremde Schlagzeile steht nur wörtlich da, mit Medium und Datum.
2. Stift oder Rot als Fläche, Stift oder Rot auf Schwarz oder Raster, mehr als ein Stift-Marker je Bild. Mit Linus' Ja zusätzlich: Rot für den Irrtum.
3. Farbfotos; ein Foto, das ungerissen als rechteckige Kachel auf dem Papier schwebt.

## Probe gemessen (28.10.2026, Überarbeitung)

Siehe README, Abschnitt „Messwerte“. Angesehen: Bild 0; 0,8; 1,9; 3,0; 6,4 (Schnitt); 7,7; 10,0; 11,6 s und Ausschnitte in voller Größe (Raster, Figur, senkrechte Credits).
