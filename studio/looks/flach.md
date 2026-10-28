# Look 5: Flach

Satte, freundliche Flächen in Minze, Tinte und Sonnengelb; eigene flache Vektor-Illustration mit runden Formen, ohne Umrisse und ohne Verläufe. Dinge ploppen, wachsen und verwandeln sich. Hell, frisch, Illustration, lebhaft. Kurzgesagt-nah in der Haltung (flach, rund, freundlich), eigenständig durch den hellen Grund, das gelbe Preisschild und den Verzicht auf Figuren mit Gesichtern.

- **Probe:** `probe-flach/` (Vergleichstafel Nr. 5). Bild 0: das echte Camp Nou in Farbe (Foto-Einlage). Auf „Barcelona“ verwandelt es sich per Morph in das gezeichnete Stadion. Beat 1: Geldbündel mit Banderole und €-Zeichen wachsen aus dem Anstoßkreis, ein gelbes Preisschild schwingt an einer Schnur ein: „45 Mio. €“, darunter ein runder Pinselstrich. Beat 2: „Behalten“, ein Kalenderblatt ploppt auf (30. Juni 2023), das Geld verwandelt sich in seinen gestrichelten Umriss, das Schild in „0 €“.
- **Warum geändert (Kritik 28.10.):** Die Scheine waren nicht als Geld zu erkennen (weiße Kästen mit Punkt), der Gelb-Sticker war ein Kasten mit runden Ecken (Pillen-Chip). Jetzt: Bündel mit Rand, €-Zeichen, Wasserzeichen und Banderole; ein Preisschild mit Loch und Schnur.

## Wofür

| passt | passt nicht |
|---|---|
| Denken & Philosophie (Gedankenexperimente), Disziplin (Geschichten statt Floskeln), Schule-Transfer für den Bruder (Bio, Erdkunde, Wirtschaft), Psychologie des Lernens, Abläufe und Kreisläufe, Modelle („So kann man sich das vorstellen“) | echte Personen als Figur, News mit Belegen (dann Zeitungspapier), genaue Daten (dann Kurstafel) |

## Palette

| Token | Hex | Rolle | Kontrast |
|---|---|---|---|
| `grund` | `#9EDBC6` | Minze, Himmel/Grund | – |
| `wiese` | `#86D0B8` | Boden ab dem Horizont | – |
| `schatten` | `#6FC2A8` | Schattenfläche unter Gegenständen | – |
| `tinte` | `#14243A` | Text, Schnur, Pinselstrich, Umrisse des Geists | 10,0 auf Grund |
| `gelb` | `#FFC93C` | **gesuchte Größe** als Preisschild (Text darauf in Tinte, 10,2) | nur als Fläche |
| `blau` | `#2949D6` | Formen (Tribünen, Banderole) | 4,4 |
| `lagune` | `#1E8A78` | Formen (Rasen, Notendruck, Kalenderkopf; Weiß darauf 4,2) | – |
| `weiss` | `#FFFFFF` | Formen, Scheine, Kalenderblatt | nur als Fläche |
| `hellminze` | `#D9F2E9` | Papierlagen der Bündel, Innenflächen | – |
| `rot` | `#A51C34` | **Irrtum oder Verlust**, mit ✗ oder Durchstrich | 4,8 auf Grund |

**Rot-Regel:** Rot = Irrtum oder Verlust. Gelb ist nie Text, sondern die Fläche, auf der die gesuchte Zahl steht. Neben Atlas (Gold) ist Flach der einzige Look mit einem Gelbton; er ist zitronig und hell, Gold ist dunkel und bräunlich (ΔE 26).

## Schriften

| Stufe | Familie | Größe | Farbe |
|---|---|---|---|
| D1 Zahl auf dem Schild | Rubik 800, Einheit 124 px auf derselben Grundlinie | 173 px | Tinte auf Gelb |
| D2 Ort, Begriff | Rubik 800 | 124 px | Tinte |
| T Text, Kalenderkopf | Rubik 600 | 52 px | Tinte oder Weiß auf Lagune |
| C Credit | Rubik 400 | 34 / 42 px | Tinte |

Lokal als woff2 (`@fontsource/rubik@5.3.0`, OFL), Name „FL Rubik“. „45 Mio. €“ ganz in 173 px Rubik wäre 807 px breit, das Schild breiter als das Lesefenster; darum steht die Einheit in 124 px (keine Ausnahme von der Mindestgröße mehr nötig).

## Grund und Textur

Zwei flache Flächen: Minze oben, Wiese ab einem flach gewölbten Horizont (y ≈ 860–900). Gegenstände stehen auf der Wiese mit einer Schattenfläche. Keine Textur, kein Korn, keine Verläufe.

## Held

Eine eigene flache Illustration (SVG im Szenen-Code), ≥ 40 % des Lesefensters hoch: Gegenstände, Orte, anonyme Figuren ohne Gesichter. Geld ist ein Bündel Scheine mit Rand, €-Zeichen (als Form gezeichnet), Wasserzeichen und blauer Banderole, kein Geldsack.

## Foto-Einlage

Ein echtes Foto darf am Anfang stehen und sich in die Zeichnung verwandeln (Morph): erst der echte Ort oder Gegenstand, dann das Modell. Das Foto steht ≥ 1,7 s mit Credit darunter (Rubik 400 34 px), bevor es sich verwandelt. Damit hat auch der Zeichen-Look echte Bilder, ohne Menschen zu zeichnen.

## Kamera und Übergänge

- **Morph** ist der wichtigste Übergang: dieselbe Sache verwandelt sich (Foto → Zeichnung, Geld → Umriss, 45 → 0), alt 0,18 s unscharf und größer, neu nach +0,06 s aus 72 % Größe in 0,32 s (DESIGN.md §5).
- Nachfahrt in der Illustration (1,08–1,15×, 0,5 s) nach der Lesezeit; Zoom-out-Enthüllung, wenn ein Teil zum Ganzen wird.
- Eintritte: **Ploppen** (Lage und Größe federn mit `back.out(2.2)`, Deckkraft nur 0,08 s linear), **Wachsen** aus dem Boden (`scaleY` 0 → 1, Ursprung unten), **Einschwingen** (Schild dreht um sein Loch, −24° → −3°).

## Takt

Lebhaft: etwa alle 0,6–0,9 s federt etwas; Morph auf dem Wort, das die Verwandlung nennt.

## Marker

Runder, dicker Pinselstrich (12 px Tinte) unter der Zahl auf dem Schild; runder Pfeil (14 px) vom Wort zum Gegenstand; Haken und Kreuz als runde Pinselstriche. Kein Kreis.

## Credits

Unten rechts, rechtsbündig an x = 972, unter dem Stadion (y ≥ 1240), Rubik 400 34 px in Tinte. Eigene Illustrationen brauchen keinen Credit; Zahlen und Foto-Einlagen ihre Quelle.

## Drei Verbote

1. Echte Personen als Figur oder Karikatur; Figuren mit Gesichtern, die jemanden darstellen könnten.
2. Verläufe, Glanzlichter, 3D-Schatten, Umrisslinien.
3. Clipart-Symbole (Geldsack mit €, Glühbirne, Daumen), Emojis, Pillen-Chips, Kästen mit großem Eckradius um Text.

## Probe gemessen (28.10.2026, Überarbeitung)

Siehe README, Abschnitt „Messwerte“. Angesehen: Bild 0; 1,95 (Morph); 2,6; 4,3; 6,4; 7,8; 9,4 (Morph); 11,0 s.
