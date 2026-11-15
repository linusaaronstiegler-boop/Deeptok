# Lizenznachweis für Assets der Horror-Engine

Regel: Nur CC0 (oder gleichwertig gemeinfrei). Keine Konten anlegen, nichts kaufen.
Ausnahme Schriften: Die Untertitel-Schrift steht unter der SIL Open Font License 1.1 (OFL).
Die OFL erlaubt Einbetten und Einbrennen in Videos und Weitergabe mit dem Lizenztext; verboten
ist nur der Verkauf der Schrift allein. Der Lizenztext liegt neben der Datei.
Jedes Paket bekommt hier eine Zeile, bevor es benutzt wird. Dateien über 1 MB nicht committen.

| Paket / Datei | Quelle (URL) | Lizenz | Abgerufen | Benutzt in |
|---|---|---|---|---|
| `schriften/ArchivoBlack-Regular.ttf` (Archivo Black 400, sha256 355b89d4…) | https://fonts.gstatic.com/s/archivoblack/v23/HTxqL289NzCGg4MzN6KJ7eW6OYs.ttf (über fonts.googleapis.com/css2?family=Archivo+Black) | SIL Open Font License 1.1, Text in `schriften/OFL-ArchivoBlack.txt` (aus @fontsource/archivo-black 5.3.0) | 15.11.2026 | Untertitel (`engine/untertitel.py`, ASS über libass) |

Stand 15.11.2026: Außer der Untertitel-Schrift nutzt die Engine keine fremden Assets. Alles andere ist im Code gebaut:

- **Figuren** (Eli, June, Dad, Owen, Tess, Mr. Odell, Nachbarn, Mister Hundred) und **Requisiten**
  (Schuhpaar, Tür, Bodenluke, Pick-up): Klötze aus three.js-Grundformen (`src/klotzfigur.js`,
  `figuren/*.js`).
- **Gesichter, Kleidungs-Aufkleber, Poster, Bilder, Uhr-Zifferblatt**: zur Laufzeit auf eine
  Canvas gezeichnet (`src/gesichter.js`, `src/kleidung.js`, Set-Module).
- **Texturen** (Holzverkleidung, Schindeln, Kopfsteinpflaster, Gehwegplatten, Asphalt, Dielen,
  Tapeten, Fliesen, Gras, Putz, Holz, Stein, Erde, Strick, Jeans): prozedural mit festem Seed
  (`src/bauteile.js`, `src/klotzfigur.js`).
- **Sets** (hauptstrasse, marsh_haus, marsh_innen): aus Bauteilen in `src/bauteile.js`.

Kenney Blocky Characters (CC0) wären erlaubt, wurden aber nicht benutzt: Eigene Proportionen
(großer Kopf, Trapez-Rumpf, Fäustlinge, Schuhklötze) grenzen die Figuren klarer vom bekannten
Klötzchen-Spiel-Look ab als ein angepasstes Fremdmodell.

three.js selbst steht unter MIT-Lizenz (node_modules/three/LICENSE) und wird nicht mitgeliefert,
sondern per `npm install` geholt.

**Ton:** Alle Effekte sind in `engine/ton/effekte.py` mit numpy synthetisiert (keine Aufnahmen,
keine Bibliotheksklänge). Das Klangbett der Vorhör-Fassung ist ebenfalls eigene Synthese
(Spieluhr aus der Ton-Analyse, `betten.py r2 a`, Seed 202; aus den Referenzen kamen nur Messzahlen)
und geht nicht in den Upload.
