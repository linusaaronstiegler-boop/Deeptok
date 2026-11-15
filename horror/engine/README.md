# Horror-Engine

Deterministischer 3D-Renderer für die Horror-Serien: three.js 0.181.0 (exakt gepinnt) in Chromium, ohne GPU.
Eine Episode ist eine JSON-Datei mit Sets, Figuren und Einstellungen. `render.mjs` rendert sie Bild für Bild in 1080 × 1920 bei 30 fps und baut ein MP4.

Grundlage sind `horror/docs/bewegungs-spec.md` (Kamera, Schnitt, Aktionen), `horror/docs/3d-urteil.md` (Technik, Messung) und `horror/docs/anhang-a-serienformat.md`.

## Inhalt

1. [Schnellstart](#1-schnellstart)
2. [Ordner](#2-ordner)
3. [Zeitregeln](#3-zeitregeln)
4. [Episoden-JSON](#4-episoden-json)
5. [Kamera-Bausteine](#5-kamera-bausteine)
6. [Aktionen und Animationen](#6-aktionen-und-animationen)
7. [Setmodul](#7-setmodul)
8. [Figurenmodul](#8-figurenmodul)
9. [Licht, Lichtereignisse, Partikel](#9-licht-lichtereignisse-partikel)
10. [Look und Nachbearbeitung](#10-look-und-nachbearbeitung)
11. [Rendern](#11-rendern)
12. [Messwerte](#12-messwerte)
13. [Regeln für Modul-Autoren](#13-regeln-für-modul-autoren)
14. [Grenzen und Offenes](#14-grenzen-und-offenes)

## 1. Schnellstart

```bash
cd horror/engine
npm install                       # holt nur three@0.181.0; Playwright kommt aus /opt/node22/lib/node_modules
npm test                          # Kamera- und Zeitplan-Tests, ohne Browser
node render.mjs test/testszene.json --einzelbild 1.0     # ein Probebild als JPG
node render.mjs test/testszene.json --prozesse 2         # alles: Bilder, Kontaktbogen, MP4
node render.mjs test/kamera-probe.json --prozesse 2 --skala 0.5333   # alle Kamera-Bausteine, Entwurf 576×1024
```

Ausgabe nach `horror/build/<episode>/` (nicht im Repo): `bilder/f00000.png …`, `<episode>.mp4`, `<episode>-bogen.jpg` (mittleres Bild jeder Einstellung) und `messung.json`.

Episode gegen das Schema prüfen (Python-venv der Umgebung):

```bash
[ -f /opt/deeptok/env.sh ] && . /opt/deeptok/env.sh
python3 -c "import json,jsonschema; jsonschema.validate(json.load(open('EPISODE.json')), json.load(open('episode.schema.json')))"
```

## 2. Ordner

| Pfad | Inhalt |
|---|---|
| `index.html` | Render-Seite; lädt `src/haupt.js` mit Importmap auf `node_modules/three` |
| `render.mjs` | Startet Xvfb, Chromium (`--use-angle=gl`, Mesa llvmpipe), rendert Bildbereiche, baut MP4 mit ffmpeg |
| `episode.schema.json` | JSON-Schema einer Episode (Draft 2020-12) |
| `src/haupt.js` | Bild-Funktion: Zeit setzen, Einstellung wechseln, Unterbilder, Ausgabe |
| `src/zeitplan.js` | Einstellungen auf Bildgrenzen, Aktionen sammeln, Prüfregeln |
| `src/kamera.js` | Kamera-Bausteine (reine Funktionen, in Node testbar) |
| `src/ease.js` | Ease-Profile |
| `src/welt.js` | Module laden, Figurenzustand je Zeit, Anker, Vordergrund-Objekte |
| `src/licht.js` | Licht-Presets, Himmel, Lichtereignisse |
| `src/nachbearbeitung.js` | MSAA-HDR, Bewegungsunschärfe, Bloom, Tiefenunschärfe, Tonemapping, Vignette, Korn |
| `src/partikel.js` | Partikel ohne Zustand (GPU) |
| `src/rig.js` | Standard-Rig für Klötzchenfiguren (optional für Figurenmodule) |
| `src/werkzeug.js` | Werkzeugkasten `ctx` für Set- und Figurenmodule |
| `src/zufall.js` | Zufall mit Seed |
| `sets/` | Setmodule, eine Datei je Set (`platzhalter_strasse.js`) |
| `figuren/` | Figurenmodule, eine Datei je Figur (`platzhalter.js`, `platzhalter_monster.js`) |
| `animationen/` | Gemeinsame Animationen, eine Datei je Animation |
| `assets/` | CC0-Assets, Lizenz in `assets/LICENSES.md` |
| `test/` | `testszene.json` (6 s, 3 Einstellungen), `kamera-probe.json` (10 Bausteine), `kamera.test.mjs` |

Episoden-eigene Module dürfen auch neben der Episode liegen (`"modul": "./sets/bauernhof.js"`, relativ zur JSON-Datei).

## 3. Zeitregeln

- **Alle Zeiten sind Sekunden der Episode**, wie in `timing.json`: `start`, `ende`, Aktionen, Ankunftszeiten, Lichtereignisse, Partikel. Nichts ist relativ zur Einstellung.
- **Bild i zeigt die Zeit t = i / fps.** Keine Uhr, kein `requestAnimationFrame`. Jedes Bild lässt sich einzeln und in jeder Reihenfolge rendern; zwei Prozesse liefern bitgleiche Bilder (geprüft, siehe Abschnitt 12).
- **Schnitte liegen auf Bildgrenzen:** Einstellung k umfasst die Bilder `round(start·fps)` bis `round(ende·fps) − 1`. Einstellungen müssen lückenlos aneinanderstoßen (`ende` der einen = `start` der nächsten), sonst bricht der Zeitplan mit Fehler ab. Schnitte sind immer hart.
- **Eine Einstellung = eine Kamera + eine Hauptaktion.** Mehr Hauptaktionen ergeben eine Warnung; Nebenher-Bewegungen bekommen `"nebenbei": true`. `gesicht`, `stellung`, `sichtbar` zählen nicht.
- **Aktionen haben Start und Dauer, danach bleibt die Pose stehen.** Technisch: Für jedes Bild wird jede Figur auf ihre Grundpose gesetzt, dann laufen *alle* Aktionen mit `start ≤ t` der Reihe nach. Fertige Aktionen stehen mit Fortschritt 1 da. Jede Aktion mischt vom aktuellen Wert (Ergebnis der vorigen Aktionen) zu ihrem Ziel.
- **Kamerafahrten über eine ganze Einstellung** laufen auf den Bildgrenzen der Einstellung; mit `profil: "ease_in_out"` liegen die Keys 18 % vor bzw. hinter den Schnitten (Spec: „etwa 15 %“; 18 % gibt ein Starttempo von 0,46 der Spitze). So fährt die Kamera am Schnitt schon und läuft nie aus dem Stand an.
- **Prüfregeln** (Warnung, kein Abbruch): Einstellungslänge 0,7–4 s, höchstens eine Hauptaktion je Einstellung, mindestens 90 % der Einstellungen mit Kamerabewegung.

## 4. Episoden-JSON

Formal: `episode.schema.json`. Beispiel: `test/testszene.json`.

```jsonc
{
  "titel": "Folge 1",
  "fps": 30,                       // Std 30
  "aufloesung": [1080, 1920],      // Std 1080 × 1920
  "seed": 7,                       // Grundlage für allen Zufall
  "look": { … },                   // Abschnitt 10
  "sets":    [ { "id": "strasse", "modul": "platzhalter_strasse", "params": {}, "position": [0,0,0], "drehung": 0 } ],
  "figuren": [ { "id": "held", "modul": "platzhalter", "params": {}, "position": [4.2,0.16,0.6], "blick": -90,
                 "gesicht": "neutral", "pose": "sitzen", "blinzeln": true, "atmen": true } ],
  "einstellungen": [ … ],          // unten
  "aktionen": [ … ],               // optional: Aktionen über mehrere Einstellungen
  "licht_ereignisse": [ … ],       // optional, Abschnitt 9
  "partikel": [ … ]                // optional, Abschnitt 9
}
```

**Figur:** `blick` in Grad um y (0 = schaut nach +z). `gesicht` ist der Start-Ausdruck. `pose` ist eine Animation, die mit Fortschritt 1 als Grundpose gilt (z. B. `sitzen`). `blinzeln` (Std an): Tausch alle 1–2 s für 0,1 s, Zeitpunkte aus dem Seed. `atmen` (Std an, `atmen_staerke` Std 1): Leerlauf-Atmen laut Spec 1.8. `sichtbar` (Std true).

**Einstellung:**

```jsonc
{
  "id": "E07",
  "start": 12.43, "ende": 13.90,          // Sekunden; auf Wortbeginn legen (Compiler: Wortbeginn − 1 Bild)
  "set": "strasse",                        // sichtbare Sets ("id" oder ["id", …]); ohne Angabe alle
  "licht": "nacht",                        // Preset dieser Einstellung (sonst look.licht)
  "licht_anpassung": { "nebel": { "dichte": 0.04 } },   // Teil-Überschreibung des Presets
  "kamera": { "baustein": "push_in", "ziel": "held.kopf", "blick": { "azimut": -125, "hoehe": 4, "abstand": 3 },
              "rate": 0.07, "fov": 42, "zusaetze": [ { "baustein": "shake", "start": 13.1 } ] },
  "stellung": { "held": { "position": [4,0.16,0], "blick": -90, "gesicht": "besorgt", "pose": "sitzen" } },
  "aktionen": [ { "wer": "held", "was": "kopf_drehen", "start": 12.9, "dauer": 0.2, "params": { "zu": "monster.kopf" } },
                { "wer": "held", "was": "gesicht", "start": 13.0, "params": { "name": "besorgt" } } ],
  "licht_ereignisse": [ … ], "partikel": [ … ],
  "tiefenunschaerfe": { "fokus": "held.kopf", "staerke": 1.0 },   // true | { fokus: Meter | Anker, staerke }
  "bewegungsunschaerfe": { "immer": false, "unterbilder": 5, "max": 16, "verschluss": 0.5, "aus": false },
  "schatten_bereich": 24, "schatten_mitte": "held",              // Schattenkarte um diesen Punkt, Kantenlänge m
  "text": "the lights went out"                                  // frei, wird nicht gerendert
}
```

- `stellung` setzt Figuren am Einstellungsbeginn sofort (Position, Blick, Gesicht, Pose, Sichtbarkeit). Das ist die Film-„Mogelei“ zwischen Einstellungen. Der Zustand bleibt danach bestehen, bis eine spätere Stellung oder Aktion ihn ändert.
- Sonder-Aktionen ohne Animationsmodul: `gesicht` (`params.name`), `sichtbar` (`params.wert`), `stellung` (wie oben).

**Punkte und Anker** (überall, wo ein Ort gebraucht wird): `[x, y, z]` in Metern, `"figur.anker"` / `"set.anker"`, `"figur"` allein (= Wurzel, Füße), oder `{ "anker": "held.kopf", "versatz": [0, 0.2, 0] }`. Figuren-Anker des Standard-Rigs: `kopf`, `augen`, `mund`, `ueber_kopf`, `brust`, `huefte`, `hand_l`, `hand_r`, `fuss_l`, `fuss_r`, `fuss`; dazu jedes Gelenk (`armR`, …). Anker sind zeitabhängig (sie bewegen sich mit der Figur).

Koordinaten: 1 Einheit = 1 m, y nach oben. Die linke Seite einer Figur mit `blick: 0` liegt bei +x.

## 5. Kamera-Bausteine

Jeder Baustein ist eine Funktion (Parameter, Kontext) → `zustand(t) = { pos, ziel, fov, roll }`. Gemeinsame Parameter:

| Parameter | Bedeutung |
|---|---|
| `ziel` | Blickpunkt (Punkt oder Anker, folgt bewegten Ankern) |
| `pos` | Kameraposition (Punkt) … |
| `blick` | … oder relativ: `{ azimut, hoehe, abstand, bezug }`. azimut 0 = Kamera auf der +z-Seite des Bezugs (sieht eine Figur mit `blick: 0` von vorn), 90 = +x-Seite; `hoehe` = Erhebungswinkel in Grad; `bezug` Std = `ziel` |
| `punkt` | Kamerapunkt eines Sets (`"strasse.totale"`) als Vorgabe für pos/ziel/fov |
| `ziel_versatz` | [x,y,z] auf den Blickpunkt |
| `fov` | vertikaler Bildwinkel in Grad (Std 50; bei 9:16 ist der waagerechte Winkel viel kleiner) |
| `profil` | `linear` (Std für Grundfahrten) oder `ease_in_out`, `ease_in`, `ease_out`, … (siehe `src/ease.js`) |
| `vorlauf` | Key-Abstand vor/hinter den Schnitten bei Ease-Profilen (Std 0,18) |
| `roll` | feste Rollung in Grad |
| `zusaetze` | Liste von Überlagerungen: `shake`, `snap_zoom`, `roll_drift` |

| Baustein | Zweck (Spec 1.3 / 2.3) | Eigene Parameter (Standard) |
|---|---|---|
| `push_in` | Grundzustand, echte Dolly-Fahrt mit Parallaxe | `rate` 0,07 /s (7 %/s Vergrößerung, exponentiell) oder `faktor` (Gesamtvergrößerung); `art` `dolly` \| `zoom`. Sturz-/Tauchfahrt = `profil: "ease_in"`, `faktor` 1,9–5 |
| `dolly_out` | Größe zeigen | `rate` −0,06 /s |
| `statisch` | nur Inserts (≤ 8 %) | optional kleiner `rate` |
| `crane_down_tilt` | Eröffnung: Kran sinkt mit Tilt | `hoehe` 6 m über Endposition, `rueck` 2 m, `start`/`ankunft` (Std Einstellung), `profil` `ease_out`, `ziel_start`, `nachlauf_rate` 0,03 |
| `tilt_up` | Monster enthüllen, Ankunft aufs Nomen | `von_ziel` (Pflicht, z. B. `monster.fuss`), `ziel`, `start`, `ankunft` (Std 80 % der Einstellung), `kran` m (Kamera steigt mit), `profil` `ease_in_out`, `nachlauf_rate` 0,03 |
| `track_follow` | Folgefahrt hinter/neben der Figur | `folge` (Anker, Pflicht), `versatz` [0.5, 0.4, −3] (lokal: hinter der Figur), `ziel_versatz` [0,0,2], `lokal` `start` \| `live` \| false, `rate` 0. Neben der Figur: `versatz` [2.5, 0.2, 0.3] |
| `truck_side` | Ortswechsel, Seitenfahrt mit Vordergrund-Wisch | `pos`/`blick` = Position in der Mitte der Fahrt (aus dem Ziel am Einstellungsbeginn); `richtung` `rechts` \| `links`, `strecke` 1,2 m, `mitschwenken` false; `vordergrund` `{ zeit, abstand 0.9, art pfosten\|baum\|wand\|Set-Prefab, breite 0.32, hoehe 5, farbe }` oder false. Das Objekt kreuzt zur `zeit` genau die Bildmitte |
| `orbit` | Überblick, Bogenfahrt | `grad_pro_s` 20, `richtung` ±1, `hoehe_aenderung` Grad, `abstand_faktor` 1 |
| `whip` | Bewegungswort, Reißschwenk in der Einstellung | `von_ziel`, `ziel`, `pos`/`blick` (Bezug `von_ziel`), `zeit` (Beginn), `dauer` 0,3 (0,2–0,5), `ueber` `kurz` \| `links` \| `rechts` (180° möglich), `rate` 0,05 (digitaler Push), `unschaerfe` true |
| `snap_zoom` | Akzent-Zoom | wie `push_in`, dazu `zeit` (Std Beginn), `faktor` 1,18 (+13–21 %), `bilder` 2. Punch-in: `faktor` 1.5, `bilder` 3–6 |

**Zusätze** (in `kamera.zusaetze`, mehrere möglich):

| Zusatz | Parameter (Standard) |
|---|---|
| `shake` | `start` (Sekunden; Spec: 0–0,13 s nach dem Geräuschwort), `dauer` 0,45, `staerke` 1 (= 1 % der Bildbreite), `frequenz` 15 (Keys alle 2 Bilder), `abklingen` 1,5, `art` `stoss` \| `sinus` (Angst-Großaufnahme: 6 Hz, `staerke_px` 5) |
| `snap_zoom` | `zeit`, `faktor`, `bilder` (nur fov) |
| `roll_drift` | `grad_pro_s` 1 (Kanal-Option, Std aus) |

In schnellen Phasen (Whip, Snap) rendert die Engine automatisch mit Bewegungsunschärfe: so viele Unterbilder, dass sich die Blickrichtung zwischen zweien um höchstens 0,5° dreht (5–16), Verschluss 0,5 Bild, nie über den Schnitt hinaus.

## 6. Aktionen und Animationen

```jsonc
{ "wer": "held", "was": "kopf_drehen", "start": 12.9, "dauer": 0.2, "ease": "ease_in_out", "params": { "winkel": 60 } }
```

`dauer` und `ease` haben Standardwerte im Animationsmodul. Gesucht wird zuerst in `figur.animationen[was]`, dann in `engine/animationen/<was>.js`.

| Animation | Spec-Dauer | params |
|---|---|---|
| `kopf_drehen` | 0,2 s (Monster 0,2–0,7 s, `ease_in`) | `winkel` (Grad, + = zur linken Seite der Figur), `nicken` (+ = nach unten), `zu` (`"kamera"` \| Anker \| [x,y,z], begrenzt ±80°) |
| `umdrehen` | 0,3 s | `winkel` (relativ, auch > 180°) \| `blick` (absolut) \| `zu` |
| `arm_heben` | 0,25 s | `seite` `r`\|`l`, `vorn` 90°, `seitlich` 0°, `zu` (zeigt dorthin) |
| `erschrecken` | 0,25 s, `nachwippen` | `staerke` 1 |
| `gehen` | Std 1,5 s, `linear` | `nach` ([x, z] \| Anker), `von`, `schritt` 0,32 s, `schwung` 28°, `drehen` true. Am Ende stehen die Beine gerade |
| `sitzen` | Pose oder 0,8 s | `sitzhoehe` 0,45 m |
| `vorbeugen` | 1,4 s, `linear` (Monster 60–70°) | `winkel` 65, `kopf_ausgleich` 40 |

`"zu": "kamera"` schaut auf die Kameraposition am Beginn der Einstellung. Ein Anker auf einer anderen Figur wird zur selben Zeit ausgewertet (die andere Figur wird dafür zuerst gesetzt).

**Animationsmodul** (eine Datei je Animation, `animationen/<name>.js`):

```js
export default {
  dauer: 0.2,                 // Standarddauer in s
  ease: 'ease_in_out',        // Standard-Ease (src/ease.js)
  // fig: Figur-Instanz (gelenke, gruppe, anker …), p: Fortschritt 0..1 nach Ease,
  // params: aus dem JSON, ctx: Hilfen
  anwenden(fig, p, params, ctx) {
    fig.gelenke.kopf.rotation.y = ctx.mischen(fig.gelenke.kopf.rotation.y, (params.winkel ?? 0) * ctx.GRAD, p);
  },
};
```

`ctx` enthält: `t` (Sekunden), `roh` (Fortschritt ohne Ease), `tLokal` (s seit Start, begrenzt auf die Dauer), `dauer`, `mischen(a, b, p)`, `mischeWinkel(a, b, p)` (kürzester Weg), `GRAD`, `THREE`, `zielPunkt(spec)` (→ Vector3), `figurId`, `welt`.

Regeln: immer vom aktuellen Wert zum Ziel mischen (`ctx.mischen(aktuell, ziel, p)`), damit Aktionen sich stapeln. Schleifen (Gehen) über `ctx.tLokal` rechnen und am Ende auf eine ruhige Pose auslaufen. Additive Wackler (Hüpfer) nur während der Bewegung (`Math.sin(ctx.roh · π)`), nicht in der gehaltenen Pose.

## 7. Setmodul

Eine Datei je Set unter `sets/<name>.js` (oder neben der Episode). Standard-Export ist eine (async) Funktion:

```js
export default async function baue(ctx, params) {
  const gruppe = new ctx.THREE.Group();
  // … bauen mit ctx.kiste, ctx.mat, ctx.leuchtMat, ctx.ladeModell …
  ctx.verschmelzen(statischeTeile);      // empfohlen: ein Mesh je Material
  return {
    gruppe,                               // Pflicht: Object3D, wird an position/drehung der Episode gesetzt
    anker: { tuer: [x, y, z] /* lokal */, laterne: someObject3D },
    lichter: { laterne: { lichter: [pointLight], materialien: [leuchtMat] } },   // Lichtgruppen für Ereignisse
    kamerapunkte: { totale: { pos: [x,y,z], ziel: [x,y,z], fov: 55 } },          // lokal
    vordergrund: { zaun: (v) => object3D },   // optional: eigene Wisch-Objekte für truck_side (v.art = "zaun")
    aktualisiere(t) {},                   // optional: bewegte Teile, nur von t abhängig
  };
}
```

Lichtgruppen heißen in der Episode `"<setId>.<name>"` (z. B. `strasse.laterne`); `"<setId>.*"` trifft alle Gruppen des Sets. Leuchtmaterialien, die eine Gruppe bilden, dürfen nicht mit anderen geteilt werden (`ctx.leuchtMat` legt standardmäßig ein eigenes an). Objekte mit eigenem Licht-Ereignis-Material mit `obj.userData.einzeln = true` vom Verschmelzen ausnehmen.

Punktlichter kosten in Software-Rendering bei jedem Pixel: höchstens 2–3 echte Punktlichter je Set, der Rest als Leuchtmaterial (Bloom).

**`ctx` (Werkzeugkasten, `src/werkzeug.js`):**

| Funktion | Zweck |
|---|---|
| `THREE` | three.js |
| `zufall(...teile)` | Generator mit Seed aus Episode + Modul-ID + Teilen → `() => [0,1)` |
| `mat(farbe, { rauheit, metall, flach, leuchten, leuchtStaerke, karte, transparent, deckkraft, eigenes })` | geteiltes MeshStandardMaterial |
| `leuchtMat(farbe, staerke, opt)` | selbstleuchtend (Werte > 1 blühen) |
| `kiste(b, h, t, mat, { rund, schatten, empfangen })` | Kiste, optional abgerundet; Ursprung in der Mitte |
| `zylinder(rOben, rUnten, h, mat, { segmente })`, `kugel(r, mat)` | Grundformen |
| `setze(obj, eltern, x, y, z, drehY)` | setzen und anhängen |
| `zeichenTextur(zeichne, b, h)` | CanvasTexture aus `zeichne(g2d, b, h)` |
| `gesichtsSatz({ name: zeichne, … })` | ein Material, Karte je Ausdruck tauschbar (`.setze(name)`) |
| `verschmelzen(gruppe)` | statische Meshes je Material zusammenfassen |
| `ladeModell(pfad)`, `ladeTextur(pfad)` | GLTF/GLB bzw. Bild aus `engine/assets/` (nur CC0, Eintrag in `assets/LICENSES.md`) |

## 8. Figurenmodul

Eine Datei je Figur unter `figuren/<name>.js`. Standard-Export:

```js
import { baueRig } from '../src/rig.js';        // optional, aber empfohlen
export default async function baue(ctx, params) {
  const rig = baueRig(ctx, { /* Maße und Materialien */ });
  return {
    ...rig,                       // gruppe, gelenke, anker, grundpose, atmen
    gesichter: ['neutral', 'besorgt', 'erschrocken', 'schrei'],
    hoehe: 1.73,
    setzeGesicht(name) {},        // Tausch in 1 Bild
    setzeBlinzeln(zu) {},         // optional
    animationen: { maul_auf: { dauer: 0.1, ease: 'sprung', anwenden(fig, p, params, ctx) {} } },   // optional, eigene
  };
}
```

Pflicht: `gruppe` (Wurzel, Füße auf y = 0, schaut nach +z), `gelenke` (Objekt mit Object3D), `grundpose()` (setzt **alles** zurück, was Animationen verändern: Rotationen, Positionen, Skalierungen). Optional: `anker`, `gesichter`, `setzeGesicht`, `setzeBlinzeln`, `atmen(t, staerke, seed)`, `animationen`, `hoehe`.

**Standard-Rig** (`src/rig.js`), damit alle gemeinsamen Animationen passen:

```
gruppe ─ huefte (Höhe = Beinlänge) ─┬ rumpf ─┬ kopf
                                    │        ├ armL (+x, linke Seite der Figur)
                                    │        └ armR (−x)
                                    ├ beinL
                                    └ beinR
```

- Glieder hängen entlang −y; `rotation.x` negativ = nach vorn (+z). `armL.rotation.z` positiv = nach außen (rechter Arm: negativ).
- Kopf: `rotation.y` positiv = zur linken Seite, `rotation.x` positiv = nicken nach unten.
- Optionale Gelenke `unterarmL/R`, `unterbeinL/R` werden von `gehen` und `sitzen` benutzt, wenn vorhanden.
- Proportionen frei, aber **kein R6/R15-Nachbau** (Plan: andere Proportionen, abgerundete Kanten, eigene Gesichter, kein Roblox-Name/Logo). Jede Figur braucht ein Erkennungsmerkmal in Farbe oder Form, das in der Halbtotalen sichtbar ist.
- Gesichter sind getauschte Texturen (6–8 je Figur, Spec), nie ein Gesichts-Rig. Die Platzhalter-Figur zeigt das Muster: je Ausdruck eine offene und eine `_zu`-Fassung, Blinzeln wählt die `_zu`-Fassung.

## 9. Licht, Lichtereignisse, Partikel

**Presets** (`src/licht.js`): `nacht` (blauer Himmel mit Mond und Sternen, Mondlicht von hinten-oben, Nebel), `daemmerung` (violett-rosa Verlauf, tiefe warme Sonne), `innen_warm`, `tag`. Jedes Preset setzt Himmel, Nebel (FogExp2), Himmel-/Bodenlicht, Hauptlicht mit weichen Schatten (PCF, 2048er Karte, `weich` = Radius) und Kantenlicht, dazu Belichtung und Farbstimmung. Die Zahl der Lichter ist immer gleich; ein Preset-Wechsel am Schnitt kostet deshalb keine Shader-Übersetzung. Die Schattenkarte deckt je Einstellung `schatten_bereich` m (Std 24) um das Kameraziel am Einstellungsbeginn ab und bleibt in der Einstellung fest (kein Flimmern).

**Lichtereignisse** (global oder je Einstellung, Zeiten absolut; Spec 1.6: 1–3 je Teil, auf dem Verb):

```jsonc
{ "art": "aus", "ziel": "strasse.laterne", "start": 33.1, "dauer": 0.4, "faktor": 0.05 }
{ "art": "dimmen", "ziel": "umgebung", "start": 33.1, "dauer": 0.45, "faktor": 0.6 }      // 30–55 % dunkler
{ "art": "aus", "ziele": ["strasse.laterne", "strasse.laterne2"], "versatz": 0.3, "start": 40.0 }   // gestaffelt
{ "art": "flackern", "ziel": "strasse.fenster", "start": 41.0, "dauer": 1.0, "ende_faktor": 0 }
```

`art`: `aus` (→ `faktor` Std 0), `an` (→ 1), `dimmen` (→ `faktor`), `flackern` (unregelmäßig während `dauer`, danach `ende_faktor`). `ziel`: `umgebung` (Himmel-, Haupt-, Kantenlicht, Himmel) oder eine Lichtgruppe eines Sets. Ein Ereignis mischt vom aktuellen Faktor zum Ziel und hält ihn danach.

**Partikel** (ohne Zustand, im Vertex-Shader gerechnet):

| Art | Zweck | wichtige Parameter (Standard) |
|---|---|---|
| `schweben` | Staub im Lichtkegel (dauernd) | `ort`, `bereich` [4,3,4], `anzahl` 150 |
| `schnee` | Schnee (dauernd) | `bereich` [16,10,16], `anzahl` 600 |
| `staub` | Ereignis: Wolke auf das Wort | `start`, `dauer` 1,5, `bereich` (Tempo), `anzahl` 80 |
| `atem` | Atemdampf vor dem Mund (Kälte) | `ort` `"held.mund"`, `periode` 3,5 s, Richtung = Blick der Figur |

Gemeinsam: `farbe`, `groesse` (m), `deckkraft`, `seed`, optional `start`/`dauer` als Sichtbarkeitsfenster. Spec: Dauer-Partikel nur, wo die Szene sie hergibt; kein Flackern als Deko.

## 10. Look und Nachbearbeitung

`look` in der Episode (alles optional):

| Feld | Standard | Wirkung |
|---|---|---|
| `licht` | `nacht` | Preset für Einstellungen ohne eigenes `licht` |
| `licht_anpassung` | – | Teil-Überschreibung des Presets |
| `msaa` | 4 | Kantenglättung im HDR-Ziel (0 = aus, deutlich treppig) |
| `schatten` | true | Schatten des Hauptlichts |
| `schatten_bereich` | 24 | Kantenlänge der Schattenkarte in m |
| `bloom` | `{ staerke 0.55, radius 0.55, schwelle 1.0 }` | nur Werte über der Schwelle blühen (Fenster, Laternen, Augen, Mond); `false` = aus |
| `toene` | `aces` | Tonemapping `aces` oder `agx` |
| `belichtung`, `saettigung`, `kontrast` | 1 | Faktoren zusätzlich zum Preset |
| `vignette` | 0.35 | Randabdunklung |
| `korn` | 0.03 | Filmkorn (hängt an der Bildnummer, deterministisch) |
| `tiefenunschaerfe_px` | 14 | stärkster Unschärferadius in px bei 1080 Breite |
| `bewegungsunschaerfe` | `{ unterbilder 5, max 16, verschluss 0.5 }` | siehe Abschnitt 5 |

Kette je Bild: Szene → HDR-Ziel (HalfFloat, 4× MSAA) → Auflösen in ein normales HDR-Ziel (bei Unterbildern gemittelt) → Bloom → optional Tiefenunschärfe (Zerstreuungskreis aus der Tiefe, Unschärfe nach Zerstreuungskreis gewichtet, damit scharfe Figuren keinen Saum in den Hintergrund ziehen) → Farbbalance, Tonemapping, Sättigung/Kontrast, sRGB, Vignette, Korn.

Tiefenunschärfe nur in Nah- und Detailaufnahmen einschalten (`einstellung.tiefenunschaerfe`); Fokus Std = Abstand Kamera–Ziel.

## 11. Rendern

```
node render.mjs <episode.json> [Optionen]
  --von <s> --bis <s>      Zeitbereich (bis exklusiv)       --bilder <a>-<b>   Bildbereich (inklusiv)
  --einzelbild <s>         ein Probebild als JPG            --prozesse <n>     parallele Chromium (2 empfohlen)
  --format png|jpg         Einzelbilder (Std png)           --qualitaet <0..1> JPEG-Qualität (0.92)
  --skala <f>              0.5333 = 576×1024-Entwurf        --aus <ordner>     Std horror/build/<episode>/
  --ton <datei>            Tonspur ins MP4                  --crf <n>          H.264-Qualität (18)
  --nur-bilder             kein MP4                         --kein-bogen       kein Kontaktbogen
  --backend gl|swiftshader gl = Mesa llvmpipe unter Xvfb    --debug            Konsolenmeldungen der Seite zeigen
```

- `render.mjs` startet einen eigenen Xvfb (falls kein `DISPLAY`), Chromium mit `--use-gl=angle --use-angle=gl` und `LIBGL_ALWAYS_SOFTWARE=1`, wie im Messversuch. Playwright kommt aus `/opt/node22/lib/node_modules/playwright` (anderer Pfad: `PLAYWRIGHT_PFAD`).
- Mit `--prozesse 2` bekommt jeder Chromium-Prozess einen zusammenhängenden Bildbereich. Die Bilder sind bitgleich zu einem Lauf mit 1 Prozess.
- MP4: H.264 High, yuv420p, crf 18, BT.709 (Matrix und Kennzeichnung), `+faststart`. Mit `--ton` wird die Tonspur ab dem Bereichsbeginn angelegt.
- Untertitel, Endkarte „PART 2“ und Ton-Mix sind nicht Teil der Engine; sie kommen im nächsten Schritt auf das MP4 (ffmpeg/libass oder HyperFrames).

## 12. Messwerte

Cloud-Rechner: 4 Kerne, keine GPU, Mesa llvmpipe 20.1.2 über ANGLE/OpenGL. Testszene `test/testszene.json` (Platzhalter-Straße mit 14 Häusern, 2 Punktlichtern, 2 Figuren, Partikeln; voller Look), 1080 × 1920, 180 Bilder, 15.11.2026:

| Lauf | s/Bild Rendern | s/Bild effektiv (mit Export) | Rechenzeit je Minute Video |
|---|---|---|---|
| 1 Prozess, PNG | 0,21 | 0,38 | 11,4 min |
| 2 Prozesse, PNG | 0,35 (je Prozess) | 0,29 | 8,7 min |
| 2 Prozesse, JPEG 0,95 | 0,37 | 0,24 | 7,1 min |
| 3 Prozesse, PNG | 0,51 | 0,27 | 8,2 min |
| Entwurf 576 × 1024, 2 Prozesse, PNG (Kamera-Probe, 450 Bilder) | 0,13 | 0,10 | 3,0 min |

Aufwärmen (Shader übersetzen) 0,6–1,1 s je Prozess. Determinismus: alle 180 Bilder mit 1, 2 und 3 Prozessen bitgleich (md5).

Kosten der Look-Stufen (1 Prozess, Bilder 0–89, reine Renderzeit):

| Variante | s/Bild |
|---|---|
| voller Look | 0,242 |
| ohne Tiefenunschärfe (nur in 60 der 90 Bilder aktiv) | 0,218 |
| ohne Bloom | 0,190 |
| ohne MSAA | 0,188 |
| ohne Schatten | 0,204 |
| alles aus | 0,081 |

Der PNG-Export im Browser (toDataURL) kostet etwa 0,17 s je Bild und Prozess; JPEG ist schneller, aber verlustbehaftet. Für Entwürfe `--format jpg --skala 0.5333`, für die Abgabe PNG mit 2 Prozessen. Echte Sets mit mehr Geometrie werden langsamer sein (Volllast im Messversuch: Faktor 4).

## 13. Regeln für Modul-Autoren

1. **Kein `Math.random()`, kein `Date`, kein `performance.now()` für Inhalte.** Zufall nur über `ctx.zufall(...)`. Die Seite ersetzt `Math.random` zwar durch einen Generator mit Seed, verlassen darf man sich darauf nicht.
2. **Zustand nur aus t.** `grundpose()` muss alles zurücksetzen, was Animationen ändern. `aktualisiere(t)` und `atmen(t)` dürfen sich nichts zwischen Bildern merken.
3. **Lichtanzahl fest.** Keine Lichter während des Renderns hinzufügen, entfernen oder sichtbar/unsichtbar schalten (außer über Set-Sichtbarkeit je Einstellung); Stärke ändern ist frei.
4. **Materialien teilen** (`ctx.mat` cacht), statische Teile verschmelzen, Punktlichter sparsam.
5. **Ein Modul, eine Datei**, Standard-Export ist die Bau-Funktion. Kommentare an Schlüsselstellen auf Deutsch.
6. **Assets nur CC0**, mit Zeile in `assets/LICENSES.md`, keine Datei über 1 MB im Repo.
7. **Inhaltsregeln** (Plan): eigene Figuren und Monster, keine Roblox-Avatare oder R6/R15-Nachbauten, kein Roblox-Name/Logo, nichts Drastisches im ersten Bild und in den ersten 7 s.

## 14. Grenzen und Offenes

- **Kein globales Licht.** Der weiche r2-Look entsteht aus Himmel-/Bodenlicht, weichen Schatten, Nebel und Bloom. Umgebungsverdeckung (GTAO) kostete im Messversuch das Vierfache und ist nicht eingebaut; Kontaktschatten unter Figuren sind Sache der Figuren- und Setmodule.
- **Tiefenunschärfe** ist eine schnelle Näherung (zwei Gauß-Durchgänge in halber Auflösung). Vordergrund-Objekte vor einer scharfen Figur bekommen weiche, aber keine echten Bokeh-Kanten.
- **Bewegungsunschärfe** nur in schnellen Phasen (Whip, Snap) oder auf Wunsch je Einstellung; sie vervielfacht die Renderzeit dieser Bilder (bis 16 Unterbilder).
- **Platzhalter:** `platzhalter`, `platzhalter_monster`, `platzhalter_strasse` dienen nur zum Testen der Schnittstelle und werden durch echte Module ersetzt.
- **Noch nicht gebaut:** Shotlisten-Compiler (Wortindex → Sekunden aus `timing.json`), Messtor über die Renders, Untertitel und Endkarte.
