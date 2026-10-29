# Look 2: Zeitungspapier

Helles, leicht graues Zeitungspapier, Druckschwarz und der Rotstift des Redakteurs (seit 28.10.2026, siehe Stift-Regel). Echte Fotos und echte Clips im Rasterdruck, ausgerissen oder ausgeschnitten und aufgeklebt, Schlagzeilen als Papierstreifen, Zahlen auf schwarzen Balken, der Bildnachweis senkrecht an der Bildkante. Hell, neutral, Foto, dicht. Vorbild ist die Collage von Simplicissimus; eigenständig, weil wir keine Zeitungsköpfe nachbauen und nur echte, frei lizenzierte Bilder kleben.

- **Probe:** `probe-zeitungspapier/` (Vergleichstafel Nr. 2). Seite 1: dasselbe Stadion als Foto (Camp Nou mit Sitz-Schrift und Spielfeld, fast quadratischer Ausschnitt, damit die Bildnachweis-Spalte nicht länger ist als das Bild); vorgesehen ist ein echter Clip vom vollen Camp Nou 2022 (Live-Situation), den Commons am 28.10. noch nicht hergab (429), Streifen „Barcelona“, Balken „45 Mio. €“, Rotstift-Rahmen ganz auf Papier. Seite 2 nach hartem Schnitt auf „Bayern“: Lewandowski als ausgeschnittene Figur aus einem echten Spielfoto (FC Bayern, 2019), Streifen „bis 30.06.2023“ mit roter Unterstreichung, Balken „0 € Ablöse“. Die Probe zeigt die Rotstift-Fassung, und genau die hat Linus in der Blindbewertung am 28.10. als Favoriten gewählt (Klarheit 5 von 5 bei Linus und Bruder). Seitdem gilt der Rotstift (Konstante `ROT` in `werkzeug/looks_zeitung.py`, Kreis und Unterstreichung; Rückfall `BLAUSTIFT`, falls Linus „rückgängig“ sagt).
- **Geändert nach der Kritik (28.10.):** Der Kreis lief über Schwarz und Raster (2,75 : 1 und 1,55 : 1). Die nächste Fassung, eine Ellipse mit 34 px Luft, lief mit den Ecken noch über den Balken (Gegenlese in der Nacht zum 29.10.: im Bild bei 4,0 s lagen rund 4000 von 17 000 roten Pixeln im Balken). Seit 29.10. ist der Kreis um den Balken ein handgezeichneter Rahmen mit flachen Seiten und runden Ecken (`rahmen()` in `werkzeug/probe_basis.py`); er hält 28–31 px Luft zu Balken, Bild, Bildnachweis und Lizenzzeile, und der Bau prüft jeden Punkt des Strichs (≥ 24 px). Die Unterkante des Bildes steht fest (y = 990), damit Foto und Clip denselben Spalt für Balken und Rahmen lassen. Das Camp-Nou-Foto zeigt jetzt Sitz-Schrift und Spielfeld ohne Dachbanner. Das Spielfoto ging im Raster im roten Rang unter; als ausgeschnittene Figur bleibt die Person erkennbar.

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
| `rot` | `#B8161D` | **Rotstift: hier hinsehen** (gesuchte Größe, Fokus); nie Irrtum | 5,0 auf Grund, 5,9 auf Papier |
| `tinte` als Zensurbalken | `#161514` | **Irrtum**: Balken über dem falschen Wort, Aufdruck „FALSCH“ in `papier` | `papier` darauf 16,2 |
| `blau` | `#1F4FB5` | nur Rückfall, falls Linus „rückgängig“ sagt: Blaustift statt Rotstift | 5,5 auf Grund, 6,5 auf Papier |

**Stift-Regel (gilt seit 28.10.2026, Linus' Wahl in der Blindbewertung):** Der Rotstift des Redakteurs markiert, worauf es ankommt (Kreis, Pfeil, Unterstreichung). Das ist die einzige Ausnahme von „Rot = Irrtum oder Verlust“ im Haus; in allen anderen Looks bleibt Rot Irrtum oder Verlust. Höchstens ein Stift-Marker je Bild, nie Stift-Flächen, **nie Stift auf Schwarz oder auf Raster** (Rot auf Druckschwarz 2,7 : 1, auf Raster 1,55 : 1): nur auf Papier oder Papierstreifen, ≥ 24 px Luft zu Balken und Bildern (der Bau der Probe prüft das am Kreis).

**Irrtum und Verlust** zeigt dieser Look über die Form statt über eine Farbe (DESIGN.md §1). Der **Irrtum** bekommt einen schwarzen Zensurbalken, der in 0,3 s über das falsche Wort wischt, plus ein zweites Merkmal: den Aufdruck „FALSCH“ in Papierweiß (Anton-Versalien wie beim Editorial-Balken, ≥ 48 px). Der Balken ist mindestens so breit wie der Aufdruck plus 12 px je Seite („FALSCH“ in 48 px: 130 px; „Nur“ in 52 px ist nur 96 px breit). Ist das Wort schmaler, wächst der Balken nur in freies Papier, nie über ein Nachbarwort; sonst steht der Aufdruck als eigener schwarzer Streifen direkt über dem Balken (DESIGN.md §6). Das falsche Wort steht vorher lesbar da (Irrtum benennen), der Balken kommt auf dem widerlegenden Wort; die Korrektur kommt als Ergänzung dazu. Ein **Verlust** steht als Zahl mit echtem Minus „−“ auf dem schwarzen Balken, davor als zweites Merkmal ein Abwärtsdreieck „▼“ in Papierweiß (als Form gezeichnet; Anton hat das Zeichen nicht), wie im Kursteil der Zeitung. So unterscheidet er sich von jeder anderen Zahl auf einem Balken.

**Rückfall bei „rückgängig“:** Blaustift `#1F4FB5` statt Rotstift; Rot ist dann wieder Irrtum oder Verlust, immer mit Durchstrich; kein Zensurbalken.

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

Rotstift, handgezeichnet: Kreis (≤ 1 je Video; um einen Balken als Rahmen mit runden Ecken, damit die Luft auch an den Ecken hält), Pfeil, Unterstreichung; 10 px plus zweite Spur; auf dem Cue-Wort; immer auf Papier. Irrtum: schwarzer Zensurbalken mit Aufdruck „FALSCH“, der in 0,3 s über das falsche Wort wischt (`power2.out`, Ursprung links). Rückfall bei „rückgängig“: Blaustift, Irrtum als roter Durchstrich.

## Credits

Senkrecht an der rechten Kante des Bildes, von unten nach oben zu lesen, wie in der Zeitung: „Foto: Urheber, Jahr,“ / „Lizenz, bearbeitet,“ / Kurzlink / Quelle der Zahl. Source Serif 4 400 34 px in Grau, höchstens 5 Zeilen, Spalte nicht länger als das Bild: Die längste Zeile (meist der Kurzlink, ≈ 675–693 px) ist höchstens so lang wie das Bild hoch ist. Der Bau der Probe bricht sonst ab; Abhilfe ist ein höherer Ausschnitt in `werkzeug/fotos.py`. Die Lizenzzeile des Videos ist ein eigener Block aus einer Zeile: senkrecht am rechten Seitenrand, 28 px neben den Spalten, über beide Seiten.

## Fotos und Clips

`bilder.suche(…)` → `werkzeug/fotos.py` (Graustufen, Ausschnitt, Freistellen für Personen; Clips mit ffmpeg gekürzt, ohne Ton) → im Video Rasterdruck als HyperFrames-Behandlung „Monochrome Screen Print“ auf `<img>` und `<video>` (Palette Tinte/Grund, Zelle 0,16; `werkzeug/zeitung-raster.json`). Die Behandlung ist eine Bearbeitung: bei CC BY-SA wieder CC BY-SA, vermerkt in `credits.json`. Personen mit Commons-Einschränkung „personality“ nur mit Freigabe (Person des öffentlichen Lebens in ihrer Rolle).

## Drei Verbote

1. Nachgebaute Zeitungsköpfe, Logos oder Layouts echter Medien. Eine fremde Schlagzeile steht nur wörtlich da, mit Medium und Datum.
2. Stift als Fläche, Stift auf Schwarz oder Raster, mehr als ein Stift-Marker je Bild, Rot für den Irrtum (der Irrtum ist hier der Zensurbalken).
3. Farbfotos; ein Foto, das ungerissen als rechteckige Kachel auf dem Papier schwebt.

## Probe gemessen (28.10.2026, nach der Bewertung)

Siehe README, Abschnitt „Messwerte“. Angesehen: Bild 0; 0,8; 1,9; 3,0; 6,4 (Schnitt); 7,7; 10,0; 11,6 s und Ausschnitte in voller Größe (Raster, Figur, senkrechte Credits); nach dem neuen Ausschnitt Bild 0,5; 1,8; 3,2; 6,5; 11,5 s und die Sitz-Schrift in voller Größe; nach dem Rahmen (29.10.) Bild 0,5; 1,8; 2,5; 3,2; 6,0 s und der Rahmen in voller Größe (ganz auf Papier; im Bild bei 4,0 s liegt kein rotes Pixel im Balken oder näher als 24 px daran). Trockenlauf mit einem Platzhalter-Clip 480 × 466 in einer Kopie: Bild 711 px hoch ab y = 279, Rahmen mit derselben Luft.
