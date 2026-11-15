# Lizenznachweis für Assets der Horror-Engine

Regel: Nur CC0 (oder gleichwertig gemeinfrei). Keine Konten anlegen, nichts kaufen.
Jedes Paket bekommt hier eine Zeile, bevor es benutzt wird. Dateien über 1 MB nicht committen.

| Paket / Datei | Quelle (URL) | Lizenz | Abgerufen | Benutzt in |
|---|---|---|---|---|
| – | – | – | – | – |

Stand 15.11.2026: Die Engine nutzt keine fremden Assets. Alles ist im Code gebaut:

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
