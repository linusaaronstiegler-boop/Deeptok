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
15. [Bausteine der Serie „Hiding Night“](#15-bausteine-der-serie-hiding-night)
16. [Shotliste, Messtor, Kontaktbogen](#16-shotliste-messtor-kontaktbogen)
17. [Untertitel, Effekte, Mischung, fertige MP4](#17-untertitel-effekte-mischung-fertige-mp4)
18. [Musik-Werkstatt](#18-musik-werkstatt)
19. [Orte der Serie „Rules of Kindly“](#19-orte-der-serie-rules-of-kindly)
20. [Figuren, Monster, Requisiten und Atemdampf von „Rules of Kindly“](#20-figuren-monster-requisiten-und-atemdampf-von-rules-of-kindly)

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
| `render.mjs` | Startet Xvfb, Chromium (`--use-angle=gl`, Mesa llvmpipe), rendert Bildbereiche, baut MP4 mit ffmpeg; Schnell-Kontaktbogen mit Kompositionsprüfung |
| `shotliste.mjs` | Shotlisten-Compiler mit Messtor: `timing.json` + `bildideen.json` + `regie.mjs` → `episode.json` (Abschnitt 16) |
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
| `src/klotzfigur.js` | Hausstil-Figur der Serie (großer Kopf, Trapez-Rumpf, Ellbogen, Knie, Fäustlinge, Schuhklötze), Schuhe, Aufkleber |
| `src/gesichter.js` | Gesichter als Texturen: Ausdrucks-Bibliothek, zusammengesetzte Namen („laecheln/reden_b“) |
| `src/kleidung.js` | Zeichenhilfen für Kleidungs-Aufkleber (Reißverschluss, Taschen, Säume, Knopfleisten) |
| `src/ik.js` | Zwei-Glied-IK, Handausrichtung, Keyframe-Kurve, Hüllkurve |
| `src/bauteile.js` | Set-Bauteile: Texturen, Haus, Fenster, Tür, Veranda, Zaun, Laterne, Bäume, Innenwände, Maße `MARSH` |
| `src/werkzeug.js` | Werkzeugkasten `ctx` für Set- und Figurenmodule |
| `src/zufall.js` | Zufall mit Seed |
| `sets/` | Setmodule, eine Datei je Set (`hauptstrasse.js`, `marsh_haus.js`, `marsh_innen.js`; `platzhalter_strasse.js` zum Testen) |
| `figuren/` | Figurenmodule: Eli, June, Dad, Owen, Tess, Odell, Nachbar, Mister Hundred, Requisiten (Schuhpaar, Tür, Luke, Pick-up); Platzhalter zum Testen |
| `animationen/` | Gemeinsame Animationen, eine Datei je Animation |
| `assets/` | CC0-Assets, Lizenz in `assets/LICENSES.md` |
| `test/` | `testszene.json` (6 s, 3 Einstellungen), `kamera-probe.json` (10 Bausteine), `kamera.test.mjs`, `shotliste.test.mjs` (Messtor), `belege.mjs` + `belege-sets.mjs` (Kontaktbögen) |
| `belege/` | Kontaktbögen der Bausteine als kleine JPGs (je Figur, Monster, Requisiten, Animationen, Set) |

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
- `stellung.neu: true` ist ein Neuanfang am Schnitt: Die Figur geht erst auf ihre Vorgabe aus `figuren[]` zurück (Grundpose, Position, Blick, Gesicht, Sichtbarkeit), dann gilt die Stellung. Posen früherer Aktionen (geduckt, Arm oben) wirken danach nicht mehr. Die Engine rechnet je Bild ab der letzten solchen Stellung. Der Shotlisten-Compiler setzt `neu` für jede sichtbare Figur jeder Einstellung.
- `plan` (frei) trägt die Planungsdaten des Compilers (Satz, Wörter, Hauptaktion, Akzent, Monster). Die Engine liest davon nur `plan.bogen_zeit` (Bild für den Kontaktbogen) und `plan.hauptsache` (Anker oder Punkt für die Kompositionsprüfung).
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
| `mat(farbe, { rauheit, metall, flach, leuchten, leuchtStaerke, karte, transparent, deckkraft, eigenes, kante })` | geteiltes MeshStandardMaterial. Grundfarben werden auf mindestens 0,02 lineare Helligkeit angehoben (nichts rendert als Loch). `kante: { farbe, staerke, exponent }` = Kantenlicht (Fresnel im Shader, kein zusätzliches Licht) |
| `kantenlicht(material, { farbe, staerke, exponent })` | Kantenlicht auf ein fertiges MeshStandardMaterial |
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

**Presets** (`src/licht.js`): `nacht` (blauer Himmel mit Mond und Sternen, Mondlicht von hinten-oben, Nebel), `daemmerung` (violett-rosa Verlauf, tiefe warme Sonne), `innen_warm`, `tag`, `kriechkeller` (Review Teil 2: fast dunkel und kühl, Himmel-/Bodenlicht 0,55; das warme Hauptlicht steht fast senkrecht und fällt nur durch die Dielenfugen, dazu die Taschenlampe des Sets). Jedes Preset setzt Himmel, Nebel (FogExp2), Himmel-/Bodenlicht, Hauptlicht mit weichen Schatten (PCF, 2048er Karte, `weich` = Radius) und Kantenlicht, dazu Belichtung und Farbstimmung. Die Zahl der Lichter ist immer gleich; ein Preset-Wechsel am Schnitt kostet deshalb keine Shader-Übersetzung. Die Schattenkarte deckt je Einstellung `schatten_bereich` m (Std 24) um das Kameraziel am Einstellungsbeginn ab und bleibt in der Einstellung fest (kein Flimmern).

Review Folge 1: `nacht` ist um etwa eine Blende heller (Himmel/Boden 1,3 → 2,3, Mond 1,5 → 2,6, Kante 0,6 → 1,4, Belichtung 1,2 → 1,4, hellerer Horizont), weil die Folge mit Bild-Median 55 von 255 weit dunkler war als r2 (102) und r5 (106). Figurenteile aus `src/klotzfigur.js` haben ein schwaches Kantenlicht.

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
  --einzelbild <s>[,<s>…]  Probebilder als JPG (Liste)     --prozesse <n>     parallele Chromium (2 empfohlen)
  --format png|jpg         Einzelbilder (Std png)           --qualitaet <0..1> JPEG-Qualität (0.92)
  --skala <f>              0.5333 = 576×1024-Entwurf        --aus <ordner>     Std horror/build/<episode>/
  --ton <datei>            Tonspur ins MP4                  --crf <n>          H.264-Qualität (18)
  --nur-bilder             kein MP4                         --kein-bogen       kein Kontaktbogen
  --backend gl|swiftshader gl = Mesa llvmpipe unter Xvfb    --debug            Konsolenmeldungen der Seite zeigen
  --schnellbogen           nur 1 Bild je Einstellung + beschriftete Kontaktbögen + Kompositionsprüfung
  --bogenbild plan|anfang|ende   welches Bild der Schnellbogen nimmt (Std plan = plan.bogen_zeit)
```

- `render.mjs` startet einen eigenen Xvfb (falls kein `DISPLAY`), Chromium mit `--use-gl=angle --use-angle=gl` und `LIBGL_ALWAYS_SOFTWARE=1`, wie im Messversuch. Playwright kommt aus `/opt/node22/lib/node_modules/playwright` (anderer Pfad: `PLAYWRIGHT_PFAD`).
- Mit `--prozesse 2` bekommt jeder Chromium-Prozess einen zusammenhängenden Bildbereich. Die Bilder sind bitgleich zu einem Lauf mit 1 Prozess.
- MP4: H.264 High, yuv420p, crf 18, BT.709 (Matrix und Kennzeichnung), `+faststart`. Mit `--ton` wird die Tonspur ab dem Bereichsbeginn angelegt und mit Stille bis zum Bildende aufgefüllt (die Endkarte hat keinen Ton und wird nicht abgeschnitten).
- Heißt die Datei `episode.json`, ist der Ausgabeordner nach ihrem Ordner benannt: `episoden/folge-01/episode.json` → `horror/build/folge-01/`.
- Untertitel und Ton-Mix sind nicht Teil des Renderers: `fertigen.py` legt sie auf die Einzelbilder (Abschnitt 17). Die Endkarte „PART 2“ ist ein Set (Abschnitt 16).

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
- **Platzhalter:** `platzhalter`, `platzhalter_monster`, `platzhalter_strasse` dienen nur zum Testen der Schnittstelle; die echten Module stehen in Abschnitt 15.
- **Noch nicht gebaut:** Schnitterkennung und optischer Fluss über die fertigen Renders. Shotlisten-Compiler, Messtor vor dem Render und Endkarte: Abschnitt 16. Untertitel, Effekte, Mischung und Prüfung der MP4: Abschnitt 17.

## 15. Bausteine der Serie „Hiding Night“

Stand 15.11.2026. Alles ist im Code gebaut, ohne fremde Assets (`assets/LICENSES.md`). Prüfbilder: `node test/belege.mjs` legt je Baustein einen Kontaktbogen nach `belege/` (Episoden und Einzelbilder bleiben in `horror/build/belege/`).

### 15.1 Figuren (Hausstil, `src/klotzfigur.js`)

Kein R6/R15-Nachbau: Kopf ≈ 30 % der Höhe (R6 ≈ 20 %), Würfel mit runden Kanten; Rumpf trapezförmig; Arme mit Ellbogen und Fäustlingshand mit eigenem Daumenklotz; kurze Beine mit Knie; große Schuhklötze in der Farbe der Figur. Kleidung als Farbflächen plus Aufkleber (Reißverschluss, Taschen, Nähte, Strickmuster).

| Modul | Figur | Erkennungsmerkmal | params |
|---|---|---|---|
| `eli` | Eli Marsh, 18, Erzähler | grüne Kapuzenjacke, Kapuze im Nacken, abstehende Strähne | `groesse` |
| `june` | June Marsh, 24 | senfgelbe Strickjacke mit Knopfklötzen, roter Zopf (eigenes Gelenk `zopf`), bernsteinfarbene Augen | `rueckblende` (offene Haare), `barfuss` (nackte Füße mit fünf Zehen, Schuhart `barfuss` in `src/klotzfigur.js`), `groesse` |
| `dad` | Tom Marsh, 48 (Rückblende) | Arbeitsjacke mit Reflexstreifen, Strickmütze, Bartklotz, braune Stiefel | `groesse` |
| `owen` | Owen Pike, 18 (Rückblende) | orange Jägermütze, schwarzes T-Shirt (kurze Ärmel), Stiefel mit orangen Senkeln | `groesse` |
| `tess` | Tess Lowry, 18 (Teil 2/3) | weißer Bob, lila Bomberjacke, lila High-Tops | `groesse` |
| `odell` | Mr. Odell, 74 | runde Brille, langer brauner Mantel (Schöße an den Oberschenkeln), gebeugt | `groesse` |
| `nachbar` | Nachbarn (nur Erwachsene) | 4 Varianten | `variante` muetze/kopftuch/brille/glatze, `alter` jung/mittel/alt, `farbe`, `haut`, `kleidung` jacke/pullover/mantel |

- **Gelenke** wie das Standard-Rig plus `unterarmL/R`, `handL/R`, `unterbeinL/R`, `fussL/R` (June zusätzlich `zopf`). **Anker:** `kopf`, `augen`, `mund`, `ueber_kopf`, `hinterkopf`, `brust`, `ruecken`, `schulter_l/r`, `huefte`, `hand_l/r` (Handmitte), `fuss_l/r` (Sohle), `fuss`.
- **Gesichter** (Tausch in 1 Bild, `src/gesichter.js`): Pflichtsatz `neutral`, `angst`, `schock` (offener Mund), `laecheln`, `ernst`, `augen_zu`, `blinzeln`; dazu `besorgt`, `schrei`, `grinsen`, `entschlossen`, `verschlafen`, `muede`, `streng`, `warnend`, `nervoes`, `blick_gesenkt`, `leer`, `zu_breit`, `zaehlt_a/b/c` (Augen zu, 3 Mundformen), `reden_a/b/c`. Aliasse aus serie.md: `erschrocken`, `froh`, `trotzig`, `frech`, `angespannt`, `zaehlt`, `leerer_blick`. **Zusammengesetzt:** `"laecheln/reden_b"` = Miene „laecheln“ mit Mundform „reden_b“ (wörtliche Rede: Mundformen alle 0,1–0,3 s tauschen). Blinzeln nimmt automatisch dieselbe Miene mit geschlossenen Augen. Texturen (512 px) entstehen erst beim ersten Gebrauch.
- **Leerlauf-Atmen** ist an (0,15–0,5 % der Bildbreite). Abschalten: Figur `"atmen": false`, ab einem Zeitpunkt Aktion `idle_atmen` mit `staerke: 0` (wieder an: `1`), mit Schultern `atem_anhalten`.
- **Handform** `fig.handForm(seite, 'offen' | 'faust' | 'zeigen')`: Animationen schalten sie (Zeigefinger erscheint bei `zeigen`, `geste`); `grundpose()` setzt zurück.
- **Sitzhöhe:** `sitzen` nimmt ohne `sitzhoehe` die natürliche Sitzhöhe der Figur (`fig.sitzhoehe`, Füße auf dem Boden; Stühle in `marsh_innen` passen dazu).

### 15.2 Monster `mister_hundred`

Etwa 7 m, dünn, langer dunkelgrauer Mantel mit A-Linie und stufig ausgefranstem Saum (Saumzungen wehen im Wind), barfuß mit langen weißen Füßen, übergroße knochige Hände mit je 4 Fingern zu 3 Gliedern **immer vor dem glatten Würfelkopf**, Ellbogen spitz nach außen: Hände, Unterarme, Oberarme bilden eine Raute (auch als Schattenriss lesbar).

- **Review Folge 1:** Mantel dunkelgrau `#5B5E6C` mit Stofftextur und kalt-türkisem Kantenlicht statt fast schwarz, Glieder kräftiger (Arme 0,24 m), Hände 0,42 m breit mit gekrümmten, gefächerten Fingern und Daumen, glimmende Fingerspitzen und eine Grundglut zwischen den Fingern (`params.grundglut`, Std 0,55). Neue Animation `leuchten` (Licht bricht hinter den Händen hervor und bleibt). Das Auge bleibt bernsteinfarben: Es ist Junes Auge (serie.md, Twist in Teil 4).
- **Technik:** Die Hände sitzen per IK vor dem Gesicht, gerechnet im System des Kopfes; der Nachlauf läuft in `setzeGesicht`/`atmen` nach allen Aktionen. Kopf drehen, schief legen, Vorbeugen: die Hände bleiben vor dem Gesicht. Eigene Animationen schreiben nur in `fig.zustand` (`weg`, `spreizL/R`, `druck`, `auge`, `glut`).
- **Gesichter:** `glatt` (Std), `auge` (bernsteinfarbenes Auge hinter dem Fingerspalt offen), `june_gross`, `june_mund` (Teil 4).
- **Animationen (eigene, Vorrang vor `animationen/`):**

| Animation | Dauer | params | Zweck |
|---|---|---|---|
| `zaehlen` | Std 4 s, linear | `takt` 0,85 s je Zahl, `staerke` | je Zahl ein Puls: Kopf nickt, Finger drücken, kaltes Leuchten (#9FD8D2) durch die Fingerspalten = Leitgeräusch-Effekt |
| `glimmen` | 0,8 s | `frequenz` 5, `staerke` | Pulsieren mit 5 Hz auf Geräuschwörtern (Spec 1.5) |
| `spaehen` | 0,3 s | `seite` r, `staerke` | Mittel- und Ringfinger öffnen einen Spalt, dahinter das Auge (Satz 36) |
| `finger_spreizen` | 0,3 s | `seite` r/l/beide | Spalt ohne Auge |
| `finger_schliessen` | 0,4 s | `staerke` | Finger fester geschlossen (Satz 3) |
| `kopf_schief` | 0,4 s | `winkel` 24 | fragend „Ready?“ (Satz 20) |
| `haende_weg` / `haende_vor` | 0,6 s | `staerke` | Hände vom Gesicht (findet jemanden; nur von hinten zeigen) |
| `vorbeugen` | 1,4 s, linear | `winkel` 65, `kopf_ausgleich` 20, `knie` 8 | 60–70° über die Einstellung (Satz 7) |
| `stapfen` (auch `gehen`) | 3,6 s, linear | `nach`, `von`, `schritt` 0,9, `schwung` 13, `halt_im_schritt` | schwer, Hüfte sackt beim Auftreten (Satz 7: bleibt mitten im Schritt stehen) |

  Gemeinsame Animationen wie `kopf_drehen` (0,2–0,7 s, `ease_in`) funktionieren ebenfalls.
- **params (Review Teil 2):** `ellbogen_pol` [x, y, z] (Pol der Arm-IK, Std [1, 0.32, −0.25]), `ellbogen_spitze` (Länge der Ellbogenspitze, Std 1), `spitzen_glut` (Leuchten der Fingerspitzen, Std 1,6), `naegel` (Farbe), `mantel` { farbe, saum, kante, exponent }. Teil 2 nimmt dunklen Mantel `#34363f` mit schmaler Kante, kurze Spitzen, gedämpfte dunkle Nägel: In Dämmerung und Untersicht las sich die Figur sonst weiß, „jubelnd“ und mit Kerzen statt Fingern.
- **Anker:** `kopf`, `augen`, `mund` (vor den Händen, für Atemdampf), `auge`, `haende`, `ueber_kopf`, `brust`, `ruecken`, `huefte`, `knie`, `hand_l/r`, `fuss_l/r`, `fuss`.

### 15.3 Requisiten (als Figuren, damit die Episode sie stellt und bewegt)

| Modul | Zweck | params | Animationen / Anker |
|---|---|---|---|
| `schuhpaar` | „your shoes, side by side“: eigenes, genaueres Modell (`baueSchuhDetail`: Sohle, flache Zehenkappe, höhere Ferse, Rist mit Schnürung, dunkle Öffnung mit Polsterrand, Fersenkappe, Streifen), schlank wie ein echter Schuh; „grau“ ist hell mit Navy-Akzent | `art` eli/june/dad/owen/tess/grau/nachbar, `ordnung` nebeneinander/schief/getreten (einer auf der Seite, ~120° gedreht, 0,75 m auseinander) | Anker `mitte` |
| `tuer` | Tür, die aufgeht (Set lässt dann das feste Blatt weg) | `breite`, `hoehe`, `farbe`, `anschlag` links/rechts, `fenster`, `offen` | `oeffnen` {`winkel` 85; negativ = nach vorn}, `schliessen`; Anker `griff_vorn/hinten` (bewegen sich mit), `mitte`, `angel` |
| `luke` | Bodenluke in Junes Zimmer | `teppich` (Ring zeichnet sich ab) | `oeffnen` {`winkel` 105}, `schliessen`; Anker `ring`, `mitte`, `schacht` |
| `pickup` | Owens hellblauer Pick-up | `farbe`, `stiefel` (Owens Stiefel auf dem Sitz), `scheinwerfer` | `fahren` {`nach`, `von`; Räder drehen passend, Std `ease_in`}, `tuer_auf` {`winkel` 62}, `tuer_zu`; Anker `auspuff` (Partikel `atem` = Dampf), `sitz`, `fahrertuer`, `motorhaube`, `ladeflaeche`, `mitte` |

### 15.4 Animationen (`animationen/`, eine Datei je Animation)

Dauern nach bewegungs-spec.md 1.4 und 2.1. Englische Namen aus der Aufgabenliste sind Dateien, die dieselbe Animation weiterreichen.

| Animation | englisch | Dauer (Std) | params |
|---|---|---|---|
| Atmen der Figur, `idle_atmen`, `atem_anhalten` | idle_atmen | 0,3 / 0,25 s | `staerke` (0 = aus), `schultern` |
| `gehen` | walk_cycle | 1,5 s, Schritt 0,32 s | `nach`, `von`, `schritt`, `schwung`, `drehen` |
| `rennen` | run_cycle | 1,5 s, Schritt 0,17 s | `nach`, `von`, `schritt`, `schwung` 48, `neigung` 16 |
| `kopf_drehen` | turn_head | 0,2 s | `winkel`, `nicken`, `zu` |
| `umdrehen` | turn_body | 0,3 s | `winkel` / `blick` / `zu` |
| `zeigen` | point | 0,25 s | `zu`, `seite`, `kopf`, `finger` |
| `erschrecken` | flinch | 0,25 s, Nachwippen | `staerke` |
| `umsehen` | look_around | 1,4 s (Drehungen je ≈ 0,2 s) | `winkel` 55, `zurueck`, `nicken` |
| `sitzen` | sit | Pose oder 0,8 s | `sitzhoehe` |
| `aufstehen` | stand_up | 0,8 s | `vor` |
| `klopfen` | knock | 1,2 s, 2,5 Schläge/s | `zu`, `seite`, `schlaege`, `senken` |
| `tuer_oeffnen` | open_door | 0,7 s (Greifen 35 %) | `zu` (Klinke, z. B. `"tuer1.griff_vorn"`), `seite`, `art` ziehen/druecken, `loslassen` |
| `fallen` | fall | 0,6 s (Kippen 0,27 s) | `richtung` vorn/hinten, `kippen` |
| `mund_zuhalten` | cover_mouth | 0,4 s | `seite` r/l/beide, `ducken` |
| `umarmen` | hug | 0,5 s | `zu` (Figur-ID), `hoehe` |
| `zurueckweichen` | back_away | 1,2 s | `strecke` 1 m oder `nach`, `schritt`, `schwung` |
| `ducken` | – | 0,4 s | `tiefe`, `arme` knie/kopf |
| `ohren_zuhalten` | – | 0,4 s | `ducken` (Satz 5) |
| `greifen` | – | 0,4 s | `zu`, `seite`, `lehnen`, `form` (Satz 11, 28) |
| `schulterzucken` | – | 0,7 s (hin und zurück) | `staerke` (Satz 27) |
| `kicken` | – | 0,4 s | `seite`, `staerke` (Satz 18) |
| `geste` | – | 0,3 s | `art` finger_heben / finger_auf_lippen / stopp / winken (Satz 10, 19) |
| `arm_heben`, `vorbeugen` | – | wie bisher | |
| `augen_zuhalten` | – | 0,35 s | `senken`; beide Hände flach vors Gesicht (Satz 17), auch als Pose |
| `arme_senken` | – | 0,3 s | `seite`; Arme aus jeder IK-Haltung zurück in die Ruhe (Satz 17) |
| `liegen` | – | Pose oder 0,6 s | `anheben`, `kopf`; auf dem Rücken, Kopf zeigt nach lokal −z, Position = Füße (Satz 26) |
| `klettern` | – | 0,8 s | `hoehe` (Pflicht), `vor`, `arme`; steigt aus der Luke oder (mit `gehen`, `arme: false`) die Treppe hinauf |

IK-Hilfen für eigene Animationen: `src/ik.js` (`zweiGlied(fig, 'L'|'R', zielWelt, p, { pol, glied })`, `richteAus`, `handDrehung`, `kurve`, `huelle`, `beinGeometrie`).

### 15.5 Sets

Alle drei Sets mit `position [0,0,0]`, `drehung 0` laden; Empfehlung für die IDs: `strasse`, `marsh`, `haus`.

```jsonc
"sets": [ { "id": "strasse", "modul": "hauptstrasse", "params": { "uhr": { "zeit": "11:58", "spruenge": [ { "start": 33.2, "zeit": "12:00" } ] } } },
          { "id": "marsh", "modul": "marsh_haus" },
          { "id": "haus", "modul": "marsh_innen", "params": { "kuchen": true } } ]
```

- **Außen:** `"set": ["strasse", "marsh"]`. **Innen:** `"set": ["strasse", "haus"]` (die Straße ist durch die Fenster zu sehen, die Außenhülle muss aus sein).
- **Tag und Nacht:** Laternen und Fenster leuchten, bis ein Lichtereignis sie ausschaltet. Für Tag-Einstellungen am Einstellungsbeginn `{ "art": "aus", "ziel": "strasse.*", "dauer": 0 }` (ebenso `marsh.*`), für die nächste Nacht-Einstellung `"an"`. Der Shotlisten-Compiler sollte das automatisch setzen.
- **Punktlichter:** hauptstrasse 2, marsh_haus 1, marsh_innen 2; Laternen sonst als Leuchtmaterial mit additiver Lichtpfütze am Boden.

**`hauptstrasse`** (Lage: Fahrbahn x −3,5…3,5 entlang z, Hausfronten bei x = ±12, Platz bei z < −42, Straßenende bei z > 44)

| Modul | Kamerapunkte | wichtige Anker |
|---|---|---|
| platz | `platz_totale/_halbtotale/_nah/_detail` (Turmuhr)`/_untersicht` | `platz_mitte`, `monster_platz` [2.5, 0, −54], `kirche_tuer`, `kirche_stufen`, `kirche_uhr`, `glocke`, `turm_spitze`, `bank` |
| haeuser | `haeuser_*` (detail = Verandaboden für Schuhe) | `haus_<id>_tuer`, `haus_<id>_veranda` (Häuser w1, w2, w4, w5, o1–o5, pike) |
| marsh (Vorgarten) | `marsh_*` | `marsh_garten` [−8.2, 0, 1.6], `marsh_tor`, `marsh_weg`, `marsh_briefkasten`, `laterne_marsh` |
| pike | `pike_*` | `pike_einfahrt` [8.6, 0, −12.6] (Pick-up mit `blick` −90), `pike_tuer`, `pike_veranda` |
| ende | `ende_*` | `ende_nebel`, `ende_schranke` |

Lichtgruppen: `laterne_marsh`, `laterne_platz` (mit Punktlicht), `platz_2…6`, `strasse_2…7`, `fenster_<haus>_oben/_unten` (unten inkl. Türlampe), `kirche`. Gestaffeltes Licht-aus (Satz 5): `{ "art": "aus", "ziele": ["strasse.fenster_o1_oben", "strasse.fenster_o2_oben", "strasse.fenster_pike_oben"], "versatz": 0.3 }`. Vordergrund-Prefab für `truck_side`: `"art": "zaun"`. params: `uhr`, `licht_an` (Anteil erleuchteter Fenster, 0.55), `punktlichter`.

**`marsh_haus`** (außen): Kamerapunkte `totale`, `halbtotale`, `nah` (Haustür), `detail` (Verandaboden: Dads Stiefel), `untersicht` (Elis Fenster), `daemmerung` (Haus mit Riese im Vorgarten, Satz 34). Anker `tuer`, `tuer_angel`, `veranda`, `veranda_schuhe` [−10.9, 0.6, −2.8], `stufen`, `eli_fenster`, `kueche_fenster`, `garten`, `dachfirst`. Lichtgruppen `veranda` (Punktlicht), `eli_fenster`, `kueche_fenster`, `fenster`. params `verandalicht`, `tuer_als_figur`.

**`marsh_innen`**: Räume Küche, Flur mit Treppe, Elis Zimmer (oben), Junes Zimmer mit Bodenluke. Kamerapunkte `<raum>_totale/_halbtotale/_nah/_detail/_untersicht` für `kueche`, `flur`, `eli`, `june`, dazu `eli_fenster_schulter` (über Elis Schulter in den Vorgarten). Lichtgruppen `kueche_lampe`, `june_lampe` (Punktlichter), `eli_lampe`, `flur_lampe`, `kerzen` (Kerzen ausblasen = `aus`). params `kuchen`, `taschenlampe`, `luke` (teppich/zu/offen/figur), `tueren_als_figur`.

Figuren-Positionen sind Zahlen (Anker gelten nur für Kamera und Aktionen). Häufige Stellen in Weltkoordinaten (Haus-System → Welt: `[−12 + z, y, −x]`, `marshWelt` in `src/bauteile.js`):

| Stelle | position | blick |
|---|---|---|
| Eli am Fenster (innen, Satz 33–35) | [−12.75, 3.8, 2.6] | 90 |
| Mister Hundred im Vorgarten vor Elis Fenster | [−8.0, 0, 2.5] | 90 |
| June auf ihrem Küchenstuhl (`pose: "sitzen"`) | [−14.5, 0.6, 3.75] | 180 |
| Eli auf seinem Küchenstuhl | [−13.65, 0.6, 2.6] | −90 |
| Dads leerer Stuhl | [−14.5, 0.6, 1.45] | 0 |
| Junes Bett (liegen: Figur drehen) | [−19.6, 0.6, 4.2] | – |
| Requisite `luke` (mit `luke: "figur"`) | [−19.25, 0.6, 2.0] | 90 |
| Requisite `tuer` als Haustür (mit `tuer_als_figur`) | [−11.98, 0.6, −1.175] | 90 |
| Dads Stiefel auf der Veranda (`schuhpaar` dad) | [−10.9, 0.6, −2.8] | 90 |
| Mister Hundred am Platzende | [2.5, 0, −54] | 0 |
| Owens Pick-up in der Einfahrt | [8.6, 0, −12.6] | −90 |

### 15.6 Änderungen am Kern (klein, rückwärtskompatibel)

- `src/welt.js`: Posen (`"pose"` einer Figur und in `stellung`) werden jetzt vorab geladen; vorher brach `"pose": "sitzen"` mit „Animation fehlt“ ab, wenn `sitzen` nicht auch als Aktion vorkam.
- `src/licht.js`: Himmel-/Bodenlicht aller Presets angehoben (Vergleich mit r2: Figuren im Hausschatten waren fast schwarz).
- `animationen/sitzen.js` (natürliche Sitzhöhe der Figur), `erschrecken.js` und `gehen.js` (Ellbogen, wenn die Figur Unterarme hat).
- `src/zeitplan.js` (16.11.2026): Aktionen mit derselben Startzeit wie eine Stellung (bis auf 0,1 ms) kommen nach der Stellung. Der Compiler rundet Zeiten auf 4 Stellen (58,2333), die Stellung liegt exakt auf dem Schnittbild (58,23333…). Ohne Toleranz sortierte etwa jede dritte Nebenaktion mit `ab: "start"` vor die Stellung, deren Neuanfang verwarf sie (beim Neubau von Teil 2 gefunden: die Luke blieb in der Rückblende zu, Elis Griff zum Vorhang in Satz 3 fiel weg; welche Einstellungen es trifft, hängt von der Rundung der Schnittzeit ab). Test in `test/kamera.test.mjs`.

### 15.7 Messwerte der Belege

Gemessen am 15.11.2026 mit den Beleg-Episoden (2 Prozesse). Achtung: In den Belegen wechseln Kamera, Licht, Sets und Figuren alle 3 Bilder; das ist der ungünstigste Fall (Schattenkarte, Texturen und Shader werden oft neu aufgebaut). Echte Einstellungen von 1–2 s werden etwas billiger sein.

| Lauf | s/Bild effektiv | Render allein | Rechenzeit je Minute Video |
|---|---|---|---|
| Entwurf 576 × 1024, JPEG, Figuren-Bögen | 0,14 | 0,18 | 4,1 min |
| Entwurf 576 × 1024, JPEG, Set marsh_innen | 0,19 | 0,29 | 5,8 min |
| 1080 × 1920, PNG, Set marsh_haus (30 Bilder) | 0,47 | 0,53 | 14,1 min |
| 1080 × 1920, PNG, Set hauptstrasse (87 Bilder) | 0,40 | 0,51 | 12,0 min |
| 1080 × 1920, PNG, Set marsh_innen (69 Bilder) | 0,52 | 0,70 | 15,7 min |

Gegenüber der Testszene (0,29 s/Bild) kosten die echten Sets etwa das 1,4- bis 1,8-Fache. Ein Teil von 80 s braucht damit grob 16–21 min Rechenzeit in voller Auflösung.

### 15.8 Bausteine für Teil 2 (Stand 15.11.2026)

| Baustein | Datei | Zweck, Schnittstelle |
|---|---|---|
| Set `kriechkeller` | `sets/kriechkeller.js` | Kriechkeller unter Junes Zimmer als eigener Raum (in Teil 2 bei `position [300, 0, 0]`, allein gezeigt). Erdboden, Grundmauern mit Lüftungsgitter, Balken, Ziegelpfeiler, schmale Dielen (7,5 cm) mit 4,2-cm-Fugen (Review Teil 2, vorher 8,5/3 cm), biegsam. Über den Dielen leuchtet eine Fläche (Junes Zimmer); die Lichtstreifen entstehen, weil man durch die Fugen wirklich auf diese Fläche sieht. Was oben steht, verdeckt sie und wirft Schatten: Sohlen mit vier Zehen unter Mister Hundred (die echte Figur steht bei Dielen-Oberkante + 1,6 cm, quer zu den Fugen) und eine flache Hand mit schmalem kaltem Saum und hell glimmenden Spitzen. Ereignisse über `params.ereignisse`: `biegen` {tiefe, mitte, radius}, `fuesse` {mitte = Standpunkt, drehung = blick}, `finger` {von, nach, drehung, spreizen, skala, spreiz_dauer}, `glut`. params `oben` (Leuchten der Fugen, Std 2,0), `kegel` (Std 0,22), `lampe_staerke` (Std 2,4). Lichtgruppen `keller.oben`, `keller.lukenrand`, `keller.lampe` (Taschenlampe: Punktlicht, Kegel, Lichtfleck), `keller.gitter`. Anker `luke_angel` (Requisite `luke` mit `groesse [0.8, 0.8]`), `dielen_mitte`, `fuesse`, `lampe`. Kamerapunkte `pov` (fast senkrecht nach oben, sonst verdeckt die Brettkante die Fugen), `luke_unten`, `totale`, `halbnah` |
| Set `reifspur` | `sets/reifspur.js` | Reif auf dem Rasen der Marshs mit der Spur von Mister Hundred: von Junes Seitenfenster an der Hauswand entlang in den Vorgarten, Zehen VOM Fenster WEG (Hinweis fürs Wiederansehen). Eine Leinwand-Textur auf einer Fläche, Abdrücke 0,95 m mit vier Zehen. Anker `spur_fenster`, `spur_ecke`, `spur_garten`, `june_fenster`, `abdruck_<n>`; Kamerapunkte `draufsicht`, `entlang`, `fenster` |
| Requisite `vorhang` | `figuren/vorhang.js` | Elis Vorhang: zwei Stoffbahnen mit Falten. Animationen `zuziehen` (0,25 s, ein Ruck), `aufziehen` {spalt, seite}. Anker `griff_r/l` (wandern mit der Bahn, die Hand folgt per IK), `mitte`. Mit `marsh_innen` `vorhang_als_figur: true` an Anker `haus.vorhang_stange`, `blick −90` |
| `marsh_innen` | `sets/marsh_innen.js` | `vorhang_als_figur`, `tueren_als_figur: ["june"]` (Junes Tür als Requisite `tuer` an `haus.june_tuer_angel`, `blick 180`; negativer Winkel öffnet in Junes Zimmer). Achtung: Neben Junes Tür steht im Flur eine Konsole mit Lampe; Kameras dort mit `lampen_einzeln: { "haus.flur_lampe": false }` |
| `marsh_haus` | `sets/marsh_haus.js` | Anker `june_fenster` (Junes Seitenfenster außen) |
| `hauptstrasse` | `sets/hauptstrasse.js` | Die Glocke hängt an einem Drehpunkt und pendelt gedämpft nach jedem Schlag: `params.glocke.schlaege` oder Set-Ereignis `glocke`. `params.glocke.offen` (Review Teil 2): Glockenstube mit offener Schallluke zur Straße und dunkler Innenwand, die Glocke ist von der Straße aus zu sehen |
| `luke` | `figuren/luke.js` | Animation `teppich_rollen` {rest}: der Teppich rollt sich zur fernen Kante auf |
| `eli` | `figuren/eli.js` | `params.rucksack`: Rucksack auf dem Rücken, Anker `rucksack` am rechten Träger |

### 15.9 Bausteine für Teil 3, das Finale (Stand 16.11.2026)

| Baustein | Datei | Zweck, Schnittstelle |
|---|---|---|
| Finger durch die Fuge | `sets/kriechkeller.js` | Echter Finger mit drei Gliedern (0,55/0,45/0,35 m), kalte Kante, dunkler Nagel. Set-Ereignisse `finger_durch` {stelle [x, z], drehung (Std −90 = Spitze nach +x), dauer}, `finger_tasten` {dauer, weite}, `finger_zurueck` {dauer} (Satz 25–26) |
| Lukenlicht | `sets/kriechkeller.js` | `params.lukenlicht`: Lichtgruppe `keller.lukenlicht` (kalter additiver Keil aus der Luke, Fläche in der Öffnung, ein Punktlicht). Startet an: im ersten Kellerbild mit `lampen_einzeln` ausschalten, auf „opened“ mit einem Lichtereignis an (Satz 38) |
| Morgen im Keller | `sets/kriechkeller.js`, `shotliste.mjs` | `params.morgen`: Lichtgruppe `keller.gitter_morgen` (rosa Gitter, Lichtbahn). Licht `kriechkeller-morgen` im Compiler (rosa Hauptlicht flach durchs Gitter) |
| Puls, Liegen | `sets/kriechkeller.js` | Ereignisse `puls` {dauer, takt, staerke} (die Fugen pulsieren je Zahl) und `liegen` {mitte, laenge, breite, drehung} (etwas legt sich der Länge nach auf die Dielen). `fuesse`, `finger`, `liegen` nehmen `aus: true` (ab dann weg); `biegen` mischt vom aktuellen Stand (tiefe 0 = Dielen richten sich auf) |
| kopfüber | `figuren/mister_hundred.js` | Pose/Aktion `kopfueber` {neigung (180 = senkrecht kopfüber), nicken, senken}: die Figur kippt um ihre Füße (Füße hoch über dem Zimmer, Kopf im Keller). Mit `blick 90` schaut das Gesicht nach −x zu Eli; Großaufnahmen mit `roll: 180` |
| Junes Gesicht | `figuren/mister_hundred.js` | Gesichter `june_gedehnt` (Junes Brauen, Wangen, Sommersprossen, bernsteinfarbene Augen, Lächeln zu breit, roter Haaransatz) und `june_bricht`; Mundformen zusammengesetzt (`june_gedehnt/reden_a`). Animation `zittern` {staerke} |
| Wandschatten | `figuren/wandschatten.js` | Requisite: dunkle Fläche mit weicher Kante, `form` raute (zu großer Schatten mit spitzen Ellbogen), eingerollt, fenster (mit Fensterkreuz); `liegend`, `deckkraft`, Animation `einblenden`. Vor die Wand stellen, nicht in sie (Innenseite der Wände 0,2 m) |
| Taschenlampe | `figuren/taschenlampe.js` | Requisite: Dads Lampe mit Kegel (`an`, `kegel`), `staubig`; Animationen `kippen`, `aus` |
| Armbanduhr | `figuren/armbanduhr.js` | Requisite: Digitaluhr am Handgelenk, Anzeige als Gesicht (`2_59` → `3_00`) |
| Glockenstube | `sets/hauptstrasse.js` | `params.glocke.seil` (Glockenseil, Ereignis `seil` schwingt einmal), `params.glocke.lampe` {pos, richtung, kegel, laenge}: Lichtgruppe `strasse.turm_lampe`. Achtung: der Compiler schaltet `strasse.*` an jedem Nacht-Schnitt an; danach mit `lampen_einzeln` aus lassen |
| ohne Endkarte | `shotliste.mjs`, `untertitel.py`, `pruefen.py` | `export const endkarte = false`: harter Schnitt nach dem letzten Wort (M11 prüft ≤ 0,2 s), Untertitel bis zum letzten Bild. `pruefen.py --dauer 125,155` für die Länge des Finales; Skript `skript.txt` |

Additive Lichtkegel des Finales sind `MeshLambertMaterial` (ohne Glanz): ausgeschaltet bleibt nichts übrig (mit `MeshStandardMaterial` blieb im Probebild ein heller Kegel stehen).

Liegende Figuren (`pose: "liegen"`) schauen nach oben, der Kopf zeigt nach lokal −z. Für Nahaufnahmen den Kopf mit `pose_params.kopf` zur Kamera drehen und die Kamera rollen (`kamera.roll`, Teil 2: −90°; die ersten +70° stellten das Gesicht auf den Kopf), sonst steht das Gesicht quer im Bild. Die Kopf-oben-Regel des Schnellbogens (16.4) misst das nach. Atemdampf liegender Figuren braucht `richtung: [0, 1, 0]`.

### 15.10 Nachbesserungen nach dem Review von Teil 2 und 3 (Stand 16.11.2026)

| Baustein | Datei | Zweck, Schnittstelle |
|---|---|---|
| Weicher Lichtkegel | `src/bauteile.js` (`weicherKegel(mat, {exponent})`) | Additive Kegel (Taschenlampe, Keller, Turmlampe) blenden zum Rand und nahe der Linse aus. Vorher schnitten sie als halbtransparente Fläche mit harter Kante durch Gesichter. `lichtPfuetzeMat(…, { ohneGlanz: true })` für Lichtflecken |
| Fäden im Keller | `sets/kriechkeller.js` | `params.faeden` (Std aus): 4 mm dünne Spinnweb-Fäden lagen nah an der Linse als haarfeine Linien im Bild |
| Fingerschatten ohne Saum | `sets/kriechkeller.js` | Finger-Ereignis `saum: false`: nur dunkle Finger und glimmende Spitzen; die Säume füllten die Lücken zwischen den Fingern (türkises Gitter) |
| Glockenseil quer | `sets/hauptstrasse.js` | Ereignis `seil` schwingt quer zur Straße (z-Achse), von vorn ein weiter Ausschlag |
| Junes gedehntes Gesicht | `src/gesichter.js`, `figuren/mister_hundred.js` | Ausdrücke `gedehnt`, `gedehnt_bricht`, `gedehnt_muede`, `gedehnt_schlaeft`; Mund `riss` (Grinsen über fast die ganze Breite mit Zähnen) und `riss_bricht`; Monster-Gesichter `june_muede`, `june_schlaeft` |
| Partikel enden mit der Einstellung | `shotliste.mjs` | `haupt.art: 'partikel'` wird auf das Ende der Einstellung gekürzt (der Atem aus E16 lag in E17 als weißer Ball vor der Linse); `ueber_schnitt: true` hebt das auf |
| Pausen ohne neue Aufnahme | `ton/einschub.py` | `python engine/ton/einschub.py episoden/folge-03 --bei 67.6:0.5 --bei 120.33:0.5 --grund "…"`: fügt Stille (Rauschen der Aufnahme) in `build/<folge>/stimme.wav` ein und verschiebt alle Wortzeiten danach; Protokoll in `stimme.json` → `einschub_bau` |
| Unterstimme | `ton/mischen.py`, `effekte.json` → `unterstimmen` | `[{von, bis, halbtoene (Std −4,5), formant, hall, db (Std −13)}]`: eine tiefe Kopie der unbearbeiteten Stimme UNTER einem Redeabschnitt (Mister Hundred zählt unter June mit), statt ihn zu ersetzen wie `rede` |
| Schaben | `ton/effekte.py` | Klang `schaben` {dauer, naeher}: Fingernagel über Erde, kommt näher, reißt am Ende ab |
| Untertitel weichen aus | `untertitel.py` | Liegt die Hauptsache einer Einstellung im Streifen y 1040–1330 (laut `build/<folge>/komposition.json` aus dem Schnellbogen), stehen ihre Untertitel bei y 1400 (die Vorbilder: 1355–1370); `untertitel.json` → `ausweichen` (Regie-Schlüssel) erzwingt das, wo ein Ankerpunkt die Sache nicht trifft. Wörtliche Rede hat 11 px Kontur (Junes Gelb auf ihrem senffarbenen Pulli). Den Schnellbogen also vor `fertigen.py` bauen |
| Leerbild-Tor | `pruefen.py` | zusätzlich: Streuung unter 20 und kaum Kanten (unter 1 % außerhalb des Untertitel-Streifens) in den ersten 0,5 s einer Einstellung; im Keller nur das alte Tor. Untertitel-Messband y 1080–1500 |

Render in Abschnitten, damit ein Neustart des Containers höchstens einen Abschnitt kostet: `node render.mjs <episode.json> --bilder a-b --prozesse 2 --format jpg --qualitaet 0.95 --nur-bilder --kein-bogen` je 600 Bilder, danach `fertigen.py` wie gewohnt (es nimmt alle Einzelbilder in `build/<folge>/bilder/`).

## 16. Shotliste, Messtor, Kontaktbogen

Stand 15.11.2026. Aus Wortzeiten wird ohne Handarbeit an Sekunden eine renderfertige Episode.

```bash
cd horror/engine
node shotliste.mjs ../episoden/folge-01 [--tabelle] [--entwurf]       # baut episoden/folge-01/episode.json oder bricht ab
node render.mjs ../episoden/folge-01/episode.json --schnellbogen --skala 0.25            # 1 Bild je Einstellung, 270×480, ~15 s
node render.mjs ../episoden/folge-01/episode.json --schnellbogen --skala 0.25 --bogenbild anfang   # erste Bilder nach den Schnitten
```

### 16.1 Eingaben (im Episoden-Ordner)

| Datei | Inhalt | Wer |
|---|---|---|
| `timing.json` | Wortzeiten der fertigen Stimme (Abschnitt „Stimme“) | Stimm-Werkzeug `ton/stimme.py` |
| `bildideen.json` | WAS jede Einstellung zeigt: Satz = Schnitt (außer `"neuer_schnitt": false`), Teilbilder schneiden ab `ab_wort`; je Einstellung Ort, Licht, Schlüsselwort, Reaktionsgesicht, Monster | Geschichte, im Kontaktbogen nachgebessert |
| `regie.mjs` | WIE es gezeigt wird: je Einstellung (Schlüssel `"<satz>"` oder `"<satz>:<ab_wort>"`) Figuren-Stellung, Kamera, genau eine Hauptaktion, Nebenbewegungen, Gesichter, Mundformen, Lichtereignisse, Partikel, Hauptsache. Zeiten nur als Wörter | Regie (JS-Modul, damit Hilfsfunktionen und Kommentare gehen) |

Wortbezüge: `"town"` (erstes Vorkommen in der Einstellung), `"side#2"` (zweites), oder globaler Wortindex. In der Kamera: `ankunft_wort` (Kran, Tilt), `zeit_wort` (Snap, Whip), `vordergrund.wort` (Wisch), `zusaetze[].wort` (Wackeln 0,05 s nach dem Wort). Hauptaktion `{ wer, was, wort, dauer?, anker: "start" | "ende" }` oder `{ art: "gesicht" | "licht" | "set" | "partikel" | "kamera", … }`; `art: "kamera"` heißt: die Kamera (Insert, Enthüllung, Snap) ist die Hauptaktion, ihre Schlüsselzeit liegt auf dem Wort.

### 16.2 Was der Compiler setzt

- **Schnitte:** Bild des Wortbeginns minus 1 (erste Einstellung ab Bild 0). Ende des letzten Bildes: letztes Wort + `nachlauf` (0,14 s), dann **Endkarte** `PART 2` (Set `endkarte`, 1,0 s, ohne Ton, Push-in).
- **Kamera:** ohne Angabe Push-in 7 %/s linear. Kran und Tilt starten 0,25 s vor dem Schnitt, damit sie im ersten Bild schon fahren.
- **Figuren:** jede sichtbare Figur bekommt am Schnitt `stellung.neu`, alle anderen werden ausgeblendet.
- **Licht:** Bildideen-Licht → Preset (`tag`, `morgen` = Tag mit tiefer Ostsonne, `sonnenaufgang`, `daemmerung`, `nacht`, `innen-nacht` = innen_warm, `rueckblende-nacht`). Rückblenden sind entsättigt. Lampen und Fenster (`strasse.*`, `marsh.*`, Innenlampen, nicht die Kerzen) und die Umgebung werden an jedem Schnitt auf an/aus gesetzt.
- **Mund:** wörtliche Rede tauscht Mundformen je Wort (lange Wörter zweimal, Pausen geschlossen); `art: "zaehlen"` zählt stumm im Takt.
- **Tiefenunschärfe** in Nah, Groß, Detail und Über-Schulter auf die Hauptsache.
- **Turmuhr:** Hauptaktion `{ art: "set", was: "uhr" }` oder `uhr: "10:20"` je Einstellung.

### 16.3 Messtor (bricht ab, schreibt dann keine episode.json)

| Nr. | Regel | Grenze |
|---|---|---|
| M1 | Schnitt auf Wortbeginn | 0–2 Bilder davor |
| M2 | Länge je Einstellung, Median, Takt | 0,7–2,5 s; 1,4–1,6 s; 38–45 /min |
| M3 | Kamera fährt ab Bild 1; Push-in-Tempo | ≥ 90 %; 4–12 %/s; Kran/Tilt vor dem Schnitt gestartet |
| M4 | Akzentfahrten (Tilt, Kran, Seitenfahrt, Folgefahrt, Orbit, Whip, Dolly-out, Sturzfahrt) | im Mittel alle 6–10 s, nie über 10 s Lücke; Ankunft ±0,1 s aufs Wort |
| M5 | genau eine Hauptaktion, auf ihrem Schlüsselwort; Wort = Schlüsselwort der Bildidee | ±0,2 s (lange Aktionen: Ende) |
| M6 | Reaktionsgesichter auf ihrem Wort; Gesichter der Bildideen zu sehen; Mundformen bei wörtlicher Rede | ±0,3 s; Takt 0,1–0,3 s |
| M7 | Lichtereignisse auf Wörtern ihrer Einstellung | 1–3 je Teil; Start bis 0,5 s vor dem Verb |
| M8 | Hook: Monster im ersten Bild, Hauptsache, Kamera fährt ab Bild 1 | Push ≥ 7 %/s |
| M9 | Snap-Zooms, Wackeln | 2–3; höchstens 4 |
| M10 | Monster-Anteil | 15–25 % der Einstellungen |
| M11 | Endkarte | ≤ 0,2 s nach dem letzten Wort, 1,0 s |
| M12 | Kamera, Hauptsache und Aktionen nur auf sichtbare Figuren | – |
| M13 | Kein Wisch-Objekt der Seitenfahrt direkt vor der Linse (ohne `vordergrund: false` stellt `truck_side` einen Pfosten 0,9 m vor die Kamera) | ≥ 1,5 m |

Danach prüft der Compiler die Datei gegen `episode.schema.json` (Python-jsonschema der Umgebung). Tests: `npm test` (`test/shotliste.test.mjs` baut absichtlich Fehler ein und erwartet, dass das Messtor sie findet).

### 16.4 Kontaktbogen und Kompositionsprüfung

`render.mjs --schnellbogen` rendert nur das Bild `plan.bogen_zeit` jeder Einstellung (nach der Hauptaktion bzw. Ankunft der Fahrt), beschriftet mit Nummer, Zeit und Text, und legt Bögen zu je 18 Bildern plus einen Gesamtbogen nach `horror/build/<folge>/`. Für jede Einstellung wird `plan.hauptsache` ins Bild projiziert: Sie muss im mittleren Drittel liegen (x 360–720, y 640–1150 bei 1080 × 1920), und ist sie ein Kopf, darf der Mund nicht im Untertitel-Streifen mit Rand (y 1080–1320) liegen. Verstöße stehen rot im Bogen und in `komposition.json`.

Review Teil 2:
- **Kopf-oben-Regel (Tor, bricht mit Fehler ab):** Für jede sichtbare Figur mit Menschengesicht (`plan.sichtbar`, Module eli, june, dad, owen, tess, odell, nachbar), deren Kopf im Bild liegt, wird der Vektor Kopfmitte → `ueber_kopf` projiziert. Er darf höchstens 30° von „oben im Bild“ abweichen (Draufsichten unter 12 px zählen nicht). Anlass: Elis liegendes Gesicht stand im Höhepunkt auf dem Kopf und las sich als Grinsen.
- **Augen:** Ist die Hauptsache ein Kopf, dürfen weder Mund noch Augen im Untertitel-Streifen liegen.

### 16.5 Folge 1 in Zahlen (Messtor)

Nach dem Review (REVIEW.md im Episoden-Ordner): 58 Einstellungen plus Endkarte, 87,27 s. Median 1,40 s, 40,3 Einstellungen/min, kürzeste 0,77 s, längste 2,50 s. 14 Akzentfahrten (im Mittel alle 6,2 s, größte Lücke 8,9 s), 3 Snap-Zooms, 2-mal Wackeln, 3 Lichtereignisse, Monster in 24,1 % der Einstellungen, Körperaktion in 64 % (Spec 35–55 %: etwas viel, kein Abbruch). Endkarte 0,147 s nach dem letzten Wort. Kompositionsprüfung: 57 von 57 Einstellungen ohne Verstoß.

### 16.6 Erweiterungen für Teil 2

- **Set-Ereignisse:** `haupt: { art: "set", set: "keller", was: "biegen", wort, dauer, params }` (Anker `ende` wie bei Aktionen) und `set_ereignisse: [{ set, was, wort, versatz, dauer, … }]` für Nebenbei-Ereignisse. Der Compiler legt sie mit Sekunden nach `sets[].params.ereignisse`; das Set rechnet daraus in `aktualisiere(t)`. `was: "uhr"` bleibt wie bisher.
- **Ort `kriechkeller`** → Set `keller`; **Licht `kriechkeller`** = eigenes Preset `kriechkeller` (Review Teil 2; vorher `innen_warm` mit Hemisphäre 2,4, Median 96, las sich gemütlich), Lampen der anderen Sets aus, Schattenbereich 10 m.
- Endkarte: Text aus `regie.endkarte.text` („PART 3“), Zahl als Set-Parameter `karte.params.zahl`.
- Folge 2 in Zahlen (Messtor), Neuaufnahme vom 16.11.2026 (44 Sätze, Stimme 89,62 s): 62 Einstellungen plus Endkarte, 90,63 s. Median 1,40 s, 41,5 je Minute, kürzeste 0,73 s, längste 2,30 s. 14 Akzentfahrten (im Mittel alle 6,4 s, größte Lücke 8,6 s), 2 Snap-Zooms, 3-mal Wackeln, 3 Lichtereignisse, Monster in 19,4 % der Einstellungen, Endkarte 0,143 s nach dem letzten Wort. Damit der Median die 1,4 s erreicht, sind die Sätze 30 („She rolled back the rug and opened the hatch.“) und 32 („The hatch closed over me, then the rug.“) je ein Bild; Satz 31 schneidet auf „could“ statt „before“ (sonst 0,63 s). Vorher (alte Aufnahme): 61 Einstellungen, 86,93 s, 42,6 je Minute, Monster 16,4 %.

## 17. Untertitel, Effekte, Mischung, fertige MP4

Stand 15.11.2026. Aus den gerenderten Einzelbildern und der Stimme werden die zwei Fassungen zum Hochladen.

```bash
cd horror && . /opt/deeptok/env.sh                     # venv mit numpy, Pillow, faster-whisper
(cd engine && node render.mjs ../episoden/folge-01/episode.json --prozesse 2 --format jpg --qualitaet 0.95 --nur-bilder)
python engine/fertigen.py episoden/folge-01           # Untertitel + Mischung + MP4 (Std-Klangbett build/folge-01/ton/klangbett-r2-a.wav)
python engine/pruefen.py episoden/folge-01            # Prüfung, schreibt pruefung.json und render-bogen.jpg, Exit 1 bei Verstoß
```

Einzeln: `python engine/untertitel.py episoden/folge-01 --tabelle`, `python engine/ton/mischen.py episoden/folge-01 --bett …`, `python engine/ton/effekte.py --aus build/klaenge` (alle Klänge zum Anhören). JPEG statt PNG, weil 2.618 PNG-Bilder mit Filmkorn mehr Platz brauchen, als die Cloud-Platte frei hat (JPEG 0,95: 1,1 GB).

### 17.1 Dateien

| Datei | Inhalt |
|---|---|
| `engine/untertitel.py` | ASS aus `timing.json` + `untertitel.json`: Gruppierung, Zeitraster, Pop, Farben |
| `engine/ton/effekte.py` | 10 eigene Klänge (numpy): `sub_boom`, `zaehlschlag` (Leitgeräusch: ein Schlag je Zahl + kaltes Schimmern), `frost`, `whoosh`, `klopfen`, `riegel`, `knarzen`, `motor`, `glocke`, `auspusten` |
| `engine/ton/mischen.py` | Cue-Liste setzen, Effekt-Abstand messen (K-gewichtete Momentan-Lautheit), Upload- und Vorhör-Mischung auf −14 LUFS mit Begrenzer (4× überabgetastet) |
| `engine/fertigen.py` | Bild einmal kodieren (Einzelbilder + libass), zwei Tonfassungen dazulegen, True Peak nach AAC nachmessen und bei Bedarf die Decke senken |
| `engine/pruefen.py` | Format, Dauer, Hör-Check (Whisper auf dem MP4), Untertitel-Sync, schwarze/einfarbige/eingefrorene Bilder, Ton, Bogen mit 30 Bildern |
| `episoden/<folge>/untertitel.json` | Akzentwörter, wörtliche Rede je Figur, feste Paare, Wörter, die allein stehen (Wortindizes, gegen `timing.json` geprüft) |
| `episoden/<folge>/effekte.json` | Cues: Klang, Wort, Versatz, Pegel, Grund |
| `episoden/<folge>/untertitel.ass`, `mischung.json`, `pruefung.json`, `render-bogen.jpg` | Ergebnisse (klein, im Repo); MP4 und WAV liegen in `build/<folge>/` |

### 17.2 Untertitel

- Archivo Black (OFL, `assets/schriften/`), 96 px (Review Folge 1, vorher 84 px), Versalien, weiß, Kontur 7 px schwarz, Schatten 4 px. Mitte x 540, y 1200, höchstens 810 px breit (A5). Zu breite feste Paare werden bis 72 px kleiner gesetzt, zu breite freie Paare stehen einzeln.
- 1–2 Wörter je Einblendung. Die Gruppierung ist eine kleinste-Kosten-Zerlegung: Funktionswort + Inhaltswort („THIS TOWN“) ist billig, Verb + Objekt-Pronomen („MADE IT“) ebenso, Inhaltswort + Bindewort („WHITE WHEN“) teuer, ein Funktionswort allein teuer, eine Einblendung unter 3 Bildern teuer. Feste Paare (Namen, „CRAWL SPACE“, „6 YEARS“) und Wörter, die allein stehen (Snap-Zooms, „READY“), stehen in `untertitel.json`.
- Zahlen als Ziffern (18, 18TH, 100, 6), „ONE RULE“ bleibt ausgeschrieben.
- Zeit: Einblendung ab dem Bild, das dem Wortbeginn am nächsten liegt (≤ 1/60 s). Der ASS-Start liegt mitten zwischen dem Bild davor und dem ersten Bild, weil libass nur Hundertstel kennt und ffmpeg die Bildzeit abrundet. Pop als zwei `\t`-Stufen mit 5 ms Abstand zu den Bildzeiten: Bild 1 73 %, Bild 2 92 %, Bild 3 100 % (A5: ohne Überschwingen; vorher 134/88/100). Lücken bleiben nie leer, über der Endkarte steht nichts.
- Farben (serie.md): Akzent `#9FD8D2` (kaltes Leuchten von Mister Hundred) für Monstername, „HIDING NIGHT“, die Regel, „READY“ und „100“; June `#F2C14E`; Erzählung weiß.

### 17.3 Ton

- Upload = Stimme + Effekte. Vorhör = zusätzlich ein eigenes Klangbett (Spieluhr aus der Ton-Analyse, `betten.py r2 a`), 12 LU unter der Stimme, läuft über die Endkarte und blendet in den letzten 0,5 s aus. Im Upload ist die Endkarte stumm (Effekte enden mit dem Schnitt, 30 ms Blende).
- Review Folge 1: 11 statt 23 Cues (Akzente, nicht jede Bewegung), Hook-Impact auf „eighteen“. `sub_boom` und `zaehlschlag` haben eine Mitten-Schicht (`mitten_schicht`: dumpfer Schlag mit Teiltönen bei 200–700 Hz, Anschlag 1–3 kHz) und sind unter 35 Hz hochgepasst: über 300 Hz lagen sie 34–42 dB unter der Stimme, jetzt 24–28 dB. Wörtliche Rede (`effekte.json` → `rede`) wird formant-erhaltend höher gesetzt (June +2,5 Halbtöne, −2 dB, ffmpeg `rubberband`), die Wortzeiten bleiben.
- Effekte: Pegel je Cue relativ zur auf −1 dBFS normierten Klangdatei; gemessen wird die lauteste Momentan-Lautheit der Effekte in den 1,5 s ab dem Cue gegen die integrierte Lautheit der Stimme. Ziel ≥ 5 LU darunter.
- AAC hebt Spitzen an: Die Spieluhr-Anschläge überschwingen beim Kodieren bis 2 dB. `fertigen.py` misst deshalb den True Peak der dekodierten AAC-Spur und senkt die Begrenzer-Decke je Fassung getrennt, bis beide ≤ −1 dBTP liegen (Folge 1 vor dem Review: gemeinsame Decke −3,23 dBFS wegen der Spieluhr; nach dem Review reicht −1,8 dBFS für beide Fassungen, der Begrenzer regelt höchstens 0,35 dB ab).

### 17.4 Prüfung

- Untertitel-Sync wird nicht aus der ASS abgeleitet, sondern gemessen: Die ASS wird allein auf Schwarz gerendert (dieselbe libass), jede Einblendung muss genau auf ihrem Bild wechseln. Der Wortbeginn kommt aus dem Ton des MP4: Versatz zur Master-WAV per Kreuzkorrelation; nach Lücken der akustische Einsatz (≥ 30 ms unter −40 dBFS, dann über −35 dBFS), mitten im Satz Whisper. Whisper allein legt das erste Wort nach einer Pause oft 0,2–0,7 s zu früh in die Stille, das ist kein Sync-Fehler.
- Stillstand: mittlere Änderung zum Vorbild < 0,15 Graustufen (bei 108 × 192), länger als 0,33 s außerhalb der Endkarte ist ein Verstoß.
- Helligkeits-Tor (Review Folge 1): Median der Bildhelligkeit ≥ 85 von 255, keine Einstellung im Mittel unter 35. Review Teil 2: Der Kriechkeller (`DUNKLE_ORTE`) zählt nicht zum Median und darf je Einstellung bis 22 herunter (r2, dunkle Strecke: 25–30). Leerbild-Tor: kein Bild mit Streuung unter 12 in den ersten 0,5 s einer Einstellung (E40 begann 0,8 s in einer Fläche; der Schnellbogen zeigt nur das Planbild). Balken-Tor: kein Bild mit fast schwarzen Spalten über 10 % der Breite. Kantendichte wird berichtet (r2 16,5 %, r5 13,3 %).

### 17.5 Folge 1 in Zahlen

Stand nach dem Review (Einzelheiten und Vorher-Werte: `episoden/folge-01/REVIEW.md`).

| | Wert |
|---|---|
| Render 1080 × 1920, 2 Prozesse, JPEG 0,95 | 2.618 Bilder in 933,3 s (15,6 min), 0,357 s/Bild effektiv, 0,608 s/Bild je Prozess, 10,7 min Rechenzeit je Minute Video. Teil-Render einzelner Einstellungen mit `--bilder a-b --nur-bilder --kein-bogen` |
| Bild kodieren (libx264 medium, crf 18, maxrate 14 Mbit/s) | 126–131 s; MP4 155 MB |
| `fertigen.py` gesamt | 164–172 s (eine Mischrunde: beide Fassungen nach AAC ≤ −1,8 dBTP) |
| Untertitel | 179 Einblendungen, 109 mit zwei Wörtern, 96 px, breiteste 807 px; Abstand zum Wortbeginn gemessen: Median 0,00 s, p90 0,02 s, höchstens 0,047 s |
| Effekte | 10 Klänge, 11 Cues, K-gewichtet 8,6–11,0 LU unter der Stimme; über 300 Hz 24–28 dB unter der Stimme |
| Ton nach AAC (192 kbit/s, Stereo) | Upload −14,05 LUFS, −1,80 dBTP, LRA 3,0 LU; Vorhör −14,05 LUFS, −1,84 dBTP, LRA 2,7 LU |
| Hör-Check Whisper auf dem MP4 | Upload und Vorhör je 0 Wortfehler, 0 Einschübe |
| Dauer | Stimme 86,12 s, Endkarte ab 86,267 s (0,147 s nach dem letzten Wort), Video 87,267 s |
| Bilder | Helligkeit Median 87,8, P10 65,6, kein Bild unter 30, dunkelste Einstellung 58,9; keine Balken; Kantendichte 15,6 %; keine schwarzen, einfarbigen oder eingefrorenen Bilder |

### 17.6 Folge 2 in Zahlen

Stand 16.11.2026, Neubau nach der Neuaufnahme (Einzelheiten und alte Werte: `episoden/folge-02/REVIEW.md`). Aufrufe:

```bash
python engine/musik/spannung.py engine/musik/spannung/hiding-night-teil2.json     # Bett r2-eigen (musik-v2)
python engine/fertigen.py episoden/folge-02 --bett build/musik/spannung-hiding-night-teil2.wav --bett-bezug -20 --abstand 12 --namen ohne-musik,mit-musik
python engine/pruefen.py episoden/folge-02 --namen ohne-musik,mit-musik
```

| | Wert |
|---|---|
| Render 1080 × 1920, 2 Prozesse, JPEG 0,95 | 2.719 Bilder in 1.411,5 s (23,5 min), 0,52 s/Bild effektiv, 15,6 min Rechenzeit je Minute Video (die Rechner-Last war höher als beim ersten Bau: 0,37 s/Bild); danach 103 Bilder neu (Luke) |
| Fassungen | `build/folge-02/folge-02-mit-musik.mp4` (Hauptfassung) und `folge-02-ohne-musik.mp4`, je 158,5 MB; Teilen-Fassungen in `build/teilen/` (crf 21, je 55 MB) |
| Untertitel | 204 Einblendungen, breiteste 807 px; Abstand zum Wortbeginn im MP4: Median 0,00 s, p90 0,023 s, höchstens 0,067 s. Feste Paare neu: „Mr. Odell“, „end up“ (vorher flackerten „I'd“, „end“, „up“ je 3–5 Bilder einzeln); allein: „Three“, „slow“, „knocks“ |
| Effekte | 17 Cues, 6,6–17,6 LU unter der Stimme (Median 11,6); neu vier Klopfer an Junes Fenster (Bild: je ein Lichtpuls); wörtliche Rede June +2,0, Tess +3,0, Odell −5,5, Mister Hundred −4 Halbtöne |
| Musik | r2-eigen, normal 12 LU unter der Stimme, Hook +2,5 dB, voll ab Satz 30, vier Wegfälle von 1,23–1,40 s mit Nachhall |
| Ton nach AAC | ohne Musik −14,05 LUFS, −1,80 dBTP, LRA 3,0 LU; mit Musik −14,07 LUFS, −1,81 dBTP, LRA 3,0 LU |
| Dauer | Stimme 89,62 s (letztes Wort endet 89,49 s), Endkarte PART 3 ab 89,633 s (0,143 s danach), Video 90,633 s |
| Bilder | Helligkeit Median 86,4 ohne Kriechkeller (gesamt 84,9), Keller im Mittel 69,9; Streuung mindestens 14,1; keine Balken außerhalb des Kellers, keine schwarzen oder eingefrorenen Bilder; Kantendichte 15 % |
| Hör-Check (Whisper auf dem MP4) | ohne Musik 1 Fehler („lay“ als „laid“), mit Musik „It“ als „he“ und „Ninety-seven, Ninety-eight“ ausgelassen; abschnittsweise nachgehört sind alle richtig (Whisper-Fenster, siehe REVIEW.md) |
| Kompositionsprüfung | 17 von 62 Einstellungen mit der Hauptsache außerhalb des mittleren Drittels (Untersichten im Keller, Beine des Monsters, Laternenzug; nur Warnung); Mund im Untertitel-Streifen in E43 (June sinkt in der Rückblende in die Luke, letzte 0,4 s) und E59 (wie bisher); Kopf-oben-Regel: alle Gesichter höchstens 30° geneigt |

### 17.7 Folge 3 (Finale) in Zahlen

Stand 17.11.2026, nach dem Review (Einzelheiten: `episoden/folge-03/REVIEW.md`). Aufrufe:

```bash
python engine/musik/spannung.py engine/musik/spannung/hiding-night-teil3.json
python engine/fertigen.py episoden/folge-03 --bett build/musik/spannung-hiding-night-teil3.wav --bett-bezug -20 --abstand 12 --namen ohne-musik,mit-musik
python engine/pruefen.py episoden/folge-03 --namen ohne-musik,mit-musik --dauer 125,155
```

| | Wert |
|---|---|
| Messtor | 92 Einstellungen, ohne Endkarte, 139,2 s; Median 1,47 s, 39,7 je Minute, 0,70–2,43 s; 22 Akzentfahrten (im Mittel alle 6,3 s, größte Lücke 9,9 s), 3 Snap-Zooms, 1-mal Wackeln, 3 Lichtereignisse, Monster in 25 % der Einstellungen; Ende 0,15 s nach dem letzten Wort |
| Render 1080 × 1920, 2 Prozesse, JPEG 0,95 | 4.176 Bilder in 25,1 min (7 Abschnitte zu 600 Bildern, 0,36 s/Bild effektiv) |
| Fassungen | `build/folge-03/folge-03-mit-musik.mp4` (Hauptfassung, 246 MB), `folge-03-ohne-musik.mp4` (246 MB); Teilen-Fassungen `build/teilen/hiding-night-teil3-finale*.mp4` (je 79 MB) |
| Stimme | Pausen ohne neue Aufnahme (`ton/einschub.py`): 1,1 + 0,5 s vor „Rabbit?“ (drei Klopfer, 0,75 s auseinander), 0,5 s nach „she stopped“ (Sonnenglocke), 139,19 s; Junes Rede +2,0 Halbtöne, Satz 43 +1,5; Mister Hundred als Unterstimme unter „One hundred. Ready, Rabbit?“ (−4,5 Halbtöne, −12 dB) |
| Ton nach AAC | ohne Musik −14,05 LUFS, −1,90 dBTP, LRA 2,8 LU; mit Musik −14,06 LUFS, −1,82 dBTP, LRA 2,6 LU; 30 Cues |
| Musik | Hook 9,3 LU unter der Stimme, normal 12,6, voll 8,4–10,6 (4 dB über normal), dünn 13,1 |
| Untertitel | 313 Einblendungen (84 bei y 1400), breiteste 808 px; Abstand zum Wortbeginn im MP4: Median 0,00 s, p90 0,023 s, höchstens 0,107 s (Whisper-Schätzung mitten im Satz) |
| Hör-Check (Whisper auf dem MP4) | ohne Musik 0 Wortfehler, mit Musik 0 Wortfehler |
| Bilder | Helligkeit Median 89,9 ohne Kriechkeller, Keller im Mittel 81,3; keine Leerbilder, keine Balken außerhalb des Kellers; Kantendichte 15,8 %; Enthüllung höchstens 0,42 % der Pixel über 250 |

## 18. Musik-Werkstatt

Stand 15.11.2026. Eigene Klangbetten im Stil der Referenzvideos, Einzelheiten in `musik/README.md`, Regeln in `musik/GRAMMATIK.md`, Lizenzen in `musik/LIZENZEN.md`.

- Vier Stile (Spieluhr-Arpeggio nach r2, Wiegenlied-Spieluhr nach r5, Klavier-Fläche nach ref0, Sub-Drone nach r1), je eine nahtlose Schleife von 171–184 s in den Varianten dünn, normal, voll; MIDI in `musik/midi/`, WAV in `build/musik/`.
- Stand 16.11.2026: In „Hiding Night“ Teil 1 und 2 läuft **r2-eigen** aus `musik-v2/` (Spieluhr wie r2 mit eigenen Begleitfiguren; Werte in `musik-v2/LIZENZEN.md`). `musik/spannung.py` liest es mit `"quelle": "musik-v2"` und setzt an jeden Wegfall einen kurzen Nachhall. Das Wiegenlied unten bleibt als Werkzeug.
- Früher für „Hiding Night“ empfohlen: Wiegenlied-Spieluhr. Die Spannungsfassung (`musik/spannung.py`, Steuerung über `musik/spannung/hiding-night-teil1.json`) kann als `--bett` von `fertigen.py` das bisherige Bett `klangbett-r2-a.wav` in der Vorhör-Fassung ersetzen (noch nicht eingebaut; `mischen.py` normiert dann das ganze Bett auf 12 LU unter der Stimme, `spannung.py --vorhoer` dagegen die Stufe „normal“). Der Upload bleibt ohne Musik.

## 19. Orte der Serie „Rules of Kindly“

Stand 17.11.2026, Folge 1 (Bibel `episoden/serie-02/bibel.md` §10.3, §10.7). Alles im Code gebaut, keine fremden Assets. Prüfbilder: `node test/belege.mjs set-see set-huette set-stadtrand set-rathaus set-schnee` (Episoden in `test/belege-kindly.mjs`, Bögen in `belege/`). Einzelne Einstellungen in voller Auflösung: `node render.mjs ../build/belege/beleg-set-see.json --einzelbild 0.3333` (Einstellung i beginnt bei i · 0,1 s).

### 19.1 Übersicht

| Set (Modul) | Datei | Set-ID in `regie.sets` | Position (Vorschlag) | Ort in `bildideen.json` | Licht in `bildideen.json` |
|---|---|---|---|---|---|
| Zugefrorener See | `sets/see.js` | `see` | `[0, 0, 1000]` | `see` | `see-morgengrauen`, `see-daemmerung`, `see-nacht`, unter dem Eis `see-unter` |
| Fischerhütte innen | `sets/huette_innen.js` | `huette` | `[600, 0, 0]` | `huette-innen` (dunkler Ort, Untergrenze 22) | `huette` |
| Stadtrand mit Ortsschild | `sets/stadtrand.js` | `rand` | `[-600, 0, 0]` | `stadtrand` | `tag`, `nacht`, `see-morgengrauen` |
| Rathaus mit Pult | `sets/rathaus.js` | `rathaus` | `[900, 0, 0]` | `rathaus` | `rathaus` (innen_warm, heller, Lampen an) |
| Schnee über der Hauptstraße | `sets/schnee.js` | `schnee` | `[0, 0, 0]` | `hauptstrasse-schnee` (= strasse, marsh, schnee) | `nacht`, `tag`, `daemmerung` |

Gemeinsame Bauteile: `src/winter.js`. Licht-Presets: `src/licht_kindly.js` (in `src/licht.js` zu `PRESETS` gelegt). Registriert in `shotliste.mjs` (`LICHT`, `ORTE`, Lampenliste, Schattenbereich Hütte 6 m, Rathaus 12 m) und `pruefen.py` (`DUNKLE_ORTE["huette-innen"] = 22`). Die Lampenliste des Compilers zählt jetzt nur Gruppen geladener Sets (`lampenFuer`): Vorher brach jede Folge ohne `marsh_innen` an `haus.kueche_lampe` ab. Hiding Night Teil 2 und 3 kompilieren bitgleich zur eingecheckten `episode.json` (Teil 1 weicht nur in einer Partikeldauer ab: Regel „Partikel enden mit der Einstellung“ aus 15.10, älter als diese Änderung).

### 19.2 `src/winter.js`

| Funktion | Zweck |
|---|---|
| `schneeMat(ctx, farbe, { flach, rauheit })`, `schneeTextur` | bläulich-weißer Schnee (Kachel 3 m, Welt-UV beim Verschmelzen) |
| `schneeFlaeche(ctx, eltern, b, t, x, y, z)` | flache Schneedecke mit UV in Metern |
| `schneeStrasse(ctx, eltern, b, z0, z1, x, y)`, `spurTextur` | festgefahrener Schnee mit zwei Spurenpaaren, längs z |
| `schneeHaufen(ctx, eltern, x, y, z, rx, ry, rz, zufall)` | Verwehung, Pflugwall, Haube (gestauchte Kugel) |
| `schneeKiefer(ctx, eltern, x, z, zufall, { groesse, y, schnee })` | Kiefer im Hausstil mit Schneehauben, grüner Saum bleibt |
| `eisMaterial(ctx, opt)`, `eisGeometrie({ radius \| b, t, mitte, y, kachel })` | Eis: Frost mit Rissen und Schneeflecken (halbdurchsichtig), klare Stellen, frische Risse, schneefreie Ellipsen, von unten leuchtend; `material.eis.setze({ klar, risse })` je Bild |
| `klarStellen(ereignisse, t, std)`, `rissStellen(…)`, `ereignisStand(ereignisse, t, ziele, dauer)` | Set-Ereignisse → Zustand zur Zeit t (nur aus t) |

Eis-Optionen: `farbe` `#bccfdd`, `deckFrost` 0,55 (von oben), `deckUnten` 0,72, `deckKlar` 0,1, `klarFarbe`, `schnee` 1, `schneeMassstab`, `schneefrei [[x, z, rx, rz]]`, `durchlicht` 0,9 und `durchFarbe` (Leuchten der Unterseite), `spiegelFarbe` (Totalreflexion von unten), `rauheit` 0,5, `klarRauheit` 0,12, `rissGlut`.

- **Klar werden:** Der Frost weicht von der Mitte nach außen (Radius wächst mit dem Fortschritt), am Rand glitzert kurz ein Kristallsaum, darunter sieht man das Wasser und was darin liegt. Bis zu vier Stellen gleichzeitig; ein Ereignis mit `staerke: 0` friert die Stelle wieder zu.
- **Von unten:** Die Unterseite leuchtet (Untersicht hell genug). Flach gesehen (außerhalb des Snellius-Fensters, etwa 49° zur Senkrechten) spiegelt sie das Wasser und wird undurchsichtig: Ufer, Hütten und Stadt sind von unten nicht mehr wie durch Glas zu sehen, eine Figur auf dem Eis verschwindet, wenn sie aus dem Fenster über der Kamera geht (S16).
- **Technik-Befund:** `gl_FrontFacing` lieferte unter ANGLE/llvmpipe für die Unterseite `true` (Rot-Test: keine Wirkung). „Von unten“ wird darum aus der Kamerahöhe gegenüber der Fläche entschieden (`cameraPosition.y < Weltposition.y`). Gilt für jede waagerechte Fläche.

### 19.3 Set `see`

Lokal: Eisoberfläche y = 0, See als Ellipse (rx 75 m, rz 60 m), 3,6 m Wasser über einem schüsselförmigen Grund (von unten nirgends Himmel durch eine Lücke). Norden (−z): Uferplatz (eben, y 0,5), Steg bei x = 0 (Deck y 0,85, Ende bei z ≈ −47,2, Stufen aufs Eis, Pfosten 0,32 m über dem Deck, Laterne am Ende mit Punktlicht), dahinter Kindly (16 Häuser mit Fensterlicht ohne Nebel, Kirchturm mit erleuchteter Schallluke, Uferlampen). Rundum verschneite Kiefern, vor der Stadt eine Lücke. Fünf Eishütten, die blaue „BEAR & GUS“ bei `[8,5, 0, −27]` mit Tür nach Norden, Fenster, Türlampe (zweites Punktlicht) und Aufschrift in Archivo Black. Vier Eislöcher mit Fähnchen, Eimer, fünf Laternen auf dem Eis, Klappstuhl mit rotem Schal (S23), Nebelbänke am Ufer.

- **Ereignisse** (`params.ereignisse`, regie: `{ art: "set", set: "see", was, wort }`): `klar` { mitte [x, z] (Std Anker `stelle`), radius (Std 1,3), dauer (Std 0,8), staerke } für S13, S34; `risse` { mitte, radius (Std 1,6), dauer (Std 0,12) } für S1, S31 (Schnee springt: Partikel `staub`, weiß).
- **params:** `eis` { … an eisMaterial }, `huetten`, `stuhl`, `stadt`, `dunst`, `punktlicht` (alle Std true).
- **Lichtgruppen:** `see.laterne`, `see.huette_bg` (Fenster, Türlampe, Punktlicht), `see.huetten`, `see.eislaternen`, `see.stadt`.
- **Anker:** `wesen` [2, −0,55, −26] (Mitte des liegenden Wesens, längs z, Kopf nach −z), `wesen_kopf`, `stelle` (auf dem Eis über dem Kopf: hier steht Bear S30–35, hier wird es klar), `steg_ende` (Odell, blick 0; steht 0,35 m zur Laternenseite), `steg_kante` (wer vom Eis kommt und haucht, blick 180), `steg_stufen`, `steg_mitte`, `ufer` (S3–4, blick 0), `weg_start`, `huette_bg`, `huette_bg_tuer`, `huette_<id>`, `loch_<n>`, `stuhl`, `schal`, `laterne`, `stadt`, `see_mitte`.
- **Kamerapunkte:** `totale`, `see_weit` (S29), `draufsicht` (S2: Körper in der schneefreien Zone, Hütte daneben), `gesicht_oben` (S13–15, S34–35: durchs klare Eis, Kopf oben), `eis_detail` (Stiefel/Pickel tippt), `unter_eis` (S1, S31), `unter_seite` (S10–11, für `truck_side` längs z), `unter_gegenschuss` (S16), `steg_totale`, `steg_ende`, `steg_seite` (S37: Bear von vorn, Odell außerhalb, sein Arm ragt ins Bild; Mund über dem Untertitel-Streifen), `ufer` (S3–4), `weg_totale` (S21 und S41, dieselbe Kamera), `huette_tuer` (Aufschrift lesbar), `huetten` (S30), `stuhl` (S23, gegen die tiefe Sonne), `heimweg` (S64).
- **Kopf oben:** Alle Kameras über dem Eis schauen nach Norden; Figuren und das Wesen liegen mit dem Kopf nach −z (Pose `liegen` mit blick 0). So steht der Kopf oben im Bild (Schnellbogen-Regel 16.4).
- **Atemdampf:** Dampf liest sich nur vor dunklem Grund. Darum stehen dunkle Kiefern hinter dem Uferplatz, der Nachthimmel ist am Horizont nicht zu hell, und die Steglaterne steht seitlich (Gegenlicht, nicht im Bild der Kamera `steg_seite`).

### 19.4 Set `huette_innen`

Innenraum x −1,12 … 1,12, z −1,42 … 1,42 (passt zur Hütte im See), Dielen y = 0, Pultdach 2,15 → 1,95 m. Ofen hinten links (Glut flackert über die Lichtfarbe, die Stärke bleibt den Lichtereignissen), Petroleumlampe, Bank rechts, Regal mit Thermoskanne, Angeln, Eimer. Eisloch (Mitte x −0,25, z 0,35; 0,7 m) mit Eiswänden, durchsichtigem Wasser und einer Eishaut bei y −0,15 (`eisMaterial` ohne Schnee). Frostfenster rechts (fast weiß, Eisblumen), Tür vorn mit Messingriegel. Drinnen keine Atem-Partikel (Bibel §2).

- **Ereignisse:** `klar` (Eishaut, S58), `zittern` { dauer 1,2, schlaege 3, staerke } (Ringe im Wasser im Takt, S54–55), `deckel_drauf` / `deckel_weg` { dauer 0,6 } (Holzdeckel hebt sich im Bogen vom Boden aufs Loch, S63), `riegel_zu` / `riegel_auf` { dauer 0,25 } (S49), `hauch` { mitte [u, v], radius, dauer 1,6 } (warmer Atem taut einen dunklen nassen Fleck mit hellem Rand in den Frost; für Bears Kopie kein Ereignis: „nichts“).
- **Lichtgruppen:** `huette.ofen` (Glut + Punktlicht), `huette.lampe` (Punktlicht), `huette.fenster`.
- **Anker:** `loch`, `loch_unten` (Gesicht unter der Haut, Kopf nach −z), `deckel`, `fenster`, `riegel`, `tuer`, `ofen`, `lampe`; Stellplätze `stand_fenster` (Bear, blick 90, Gesicht gut 0,5 m vor dem Glas), `stand_ofen` (Gus, blick −145), `stand_tuer` (blick 180), `knien_loch` (blick 180), `bank` (Sitzhöhe 0,45, blick −90).
- **Kamerapunkte:** `totale`, `ofen` (Gus von vorn, Ofenrohr außerhalb des Bildes), `loch`, `loch_nah` (Lippen, S61–62), `tuer` (Riegel), `fenster` (das Glas), `fenster_gesicht` (Großaufnahme Bear, Dreiviertel), `bank`. Ein Gesicht im Dreiviertelprofil und das Glas passen in diesem engen Raum nicht in ein 9:16-Bild: zwei Einstellungen.

### 19.5 Set `stadtrand`

Die verschneite Landstraße kommt aus der Stadt (−z) und endet bei z = 0 an einer rot-weißen Schranke mit Schneewall; dahinter Kiefernwald. Rechts das DEAD-END-Schild (Schnee auf den oberen Kanten) und der Platz für die Requisite `ortsschild` (Figuren-Werkstatt) bei Anker `ortsschild` [5,7, 0, −4,6], blick 180 (Schrift zur Straße). Eine Laterne leuchtet die Tafel von vorn an (Punktlicht): Auf der Endkarte bei Nacht ist die Zahl lesbar. `rand.*` steht absichtlich nicht in der Lampenliste des Compilers, die Endkarte schaltet die Laterne also nicht aus; bei Tag `{ art: "aus", ziel: "rand.laterne", dauer: 0 }` oder `lampen_einzeln`.

- **params:** `platzhalter_schild` (Std false: schlichte Tafel nur für Prüfbilder, solange die Requisite fehlt; die Belege nehmen `figuren/ortsschild.js`, sobald es sie gibt), `punktlicht`.
- **Anker:** `ortsschild`, `ortsschild_mitte` (geschätzt y 1,75), `dead_end`, `schranke`, `strasse_ende`, `laterne`.
- **Kamerapunkte:** `totale`, `strasse`, `schild` (Tafel etwa 70 % der Bildbreite), `zahl` (Push-in auf die Einwohnerzahl), `endkarte` (Schild und DEAD END, Nacht), `dead_end`. Die Ziele rechnen mit der Tafelmitte 1,75 m; mit der echten Requisite nachmessen.
- Schneefall aus der Episode (`schnee`-Partikel), um das Schild herum und nicht bis an die Linse (Probe: ein Flocken-Fleck vor der Zahl, als das Feld die Kamera einschloss).

### 19.6 Set `rathaus`

Raum 8 × 7 × 3,6 m: dunkle Vertäfelung, warmer Putz, Balkendecke, zwei hohe Fenster mit Schneelicht (Punktlicht), offene Regale mit Akten an der Rückwand (Archiv für F8), Bank, Aushang „Kindly mind the rules.“ über der Tür. In der Mitte das Pult mit **ebener** Platte in 1,05 m (die Requisite `stadtbuch` liegt ohne Neigung auf), Leiste hinten, Tintenfass mit Feder; darüber eine Pendellampe mit grünem Schirm, Punktlicht und weichem Lichtkegel (`weicherKegel`).

- **Lichtgruppen:** `rathaus.lampe`, `rathaus.fenster`. Compiler-Licht `rathaus` = `innen_warm` mit Himmel-/Bodenlicht 1,8 und Belichtung 1,15 (Probe vorher: Totale Median 38).
- **Anker:** `pult` (Mitte der Platte: Stadtbuch, Lesesicht von +z), `lesen` (Stellplatz des Lesers, blick 180), `lampe`, `regal`, `fenster`.
- **Kamerapunkte:** `totale`, `pult_detail` (Draufsicht aufs Buch, oben im Bild = −z), `pult_nah` (schräg auf den Falz), `pult_halbnah` (Leser von vorn, Pult im Vordergrund), `seite`.

### 19.7 Set `schnee`

Überlagerung in Weltkoordinaten, ändert `hauptstrasse` nicht (Hiding Night bleibt): Schneedecke über Wiesen und Vorgärten, Fahrbahn und Feldweg mit Reifenspuren, Gehwege, Pflugwälle; Schneedecken auf allen Dächern und Verandadächern (Maße wie `baueHaus`, Hausliste aus `hauptstrasse.js` kopiert: bei Änderungen dort mitziehen), Hauben auf Zäunen, Büschen, Blumenkästen, Vorgartenbäumen, geparkten Autos und dem Briefkasten der Marshs. Die Plattenwege bleiben frei (geräumt; Alltagsregel F3).

- **Haustür der Lunds (S17):** das Haus der Marshs mit `marsh_haus { tuer_als_figur: true }` (Requisite `tuer` wie in 15.5). Anker `lund_tuer`, `lund_veranda` (Mann, blick −90), `lund_flur` (Frau, blick 90; für Kameras von der Seite auf die Schwelle stellen, sonst verdeckt die Wand), `lund_weg`. Kamerapunkte `lund_halbnah` (durch die Lücke über den Stufen, kein Verandapfosten im Bild), `lund_gegen` (von der Schwelle auf den Mann), `lund_totale`, `strasse_schnee`.
- **Grenzen:** Platz vor der Kirche, Feldweg-Kiefern der Hauptstraße und Hintergrundbäume bleiben ohne Schnee; Laubbäume tragen nur Schneehauben über grünem Laub. Für weite Totalen (F3, F7) braucht `hauptstrasse` noch einen Winter-Parameter (kahle Bäume).

### 19.8 Licht-Presets (`src/licht_kindly.js`)

| Preset | Compiler-Licht | Zweck |
|---|---|---|
| `see_morgengrauen` | `see-morgengrauen` | vor Sonnenaufgang, rosa Saum, flaches warmes Licht, Dunst (S5–7, S21) |
| `see_daemmerung` | `see-daemmerung` | violett-rosa, Sonne hinter dem Südufer (S23) |
| `see_nacht` | `see-nacht` | Mond von hinten-oben, Schnee leuchtet blau, wenig Nebel (Stadtlichter sichtbar) |
| `see_unter` | `see-unter` (Lampen aus) | türkises Wasser, Licht von oben, dichter Wasser-Nebel, kaltes Kantenlicht fürs Wesen; absichtlich hell |
| `huette` | `huette` | eng und warm, wenig Füll-Licht, kaltes Mondlicht nur durchs Fenster; Ofen und Lampe zeichnen den Raum |

### 19.9 Prüfbilder und Messwerte

Probebilder 1080 × 1920 (`--einzelbild`), Mittel der Bildhelligkeit (0–255, ganzes Bild):

| Set | Einstellung (Licht) | Mittel |
|---|---|---|
| see | totale (Morgengrauen) 170 · steg_seite (Nacht) 114 · ufer (Morgengrauen) 112 · draufsicht 138 · gesicht_oben durchs klare Eis (Nacht) 57 · unter_eis 109 · unter_gegenschuss 106 · huette_tuer (Nacht) 101 · weg_totale (Nacht) 122 · stuhl (Dämmerung) 164 · see_weit (Nacht) 103 | alle ≥ 35 |
| huette_innen | totale 81 · ofen 57 · loch (klar, Gesicht) 80 · fenster 134 · fenster_gesicht 65 | Untergrenze 22 |
| stadtrand | schild (Tag) 92 · zahl (Tag, Stellvertreter-Tafel) 68 · endkarte (Nacht, Schneefall) 152 | |
| rathaus | totale 76 · pult_halbnah 110 | |
| schnee | lund_halbnah (Nacht) 104 · lund_gegen 76 · lund_totale 133 | |

Renderzeit der Belege (576 × 1024, 2 Prozesse): 0,18–0,21 s je Bild. Nachgebessert nach den Prüfbildern: Laternen-Glut und Morgensonne auf dem Eis gedämpft (Eis rauer), Untersicht ohne „Glas“-Blick aufs Ufer (Spiegelung), Eisplatte über dem Hüttenloch entfernt, Spiegelung der Lampe im klaren Eis des Lochs gedämpft (`klarRauheit`), Steg-Gegenschuss ohne Verdeckung durch Odells Kopf, Türlampe an „BEAR & GUS“ (Mittel 41 → 101), Regale offen (ein voller Klotz verdeckte die Bücher), Rathaus heller.

Offen: Ortsschild und Stadtbuch mit den echten Requisiten nachmessen (Kamerapunkte `rand.schild/zahl/endkarte`, Blickrichtung des Buchs auf `rathaus.pult`); `see.wesen` an die Maße von `old_knuckles` anpassen (schneefreie Zone ist 6,4 × 18 m); Atem-Lesbarkeit nach Kompression (Kompressions-Tor der Figuren-Werkstatt) in `steg_seite` und `ufer` prüfen.

## 20. Figuren, Monster, Requisiten und Atemdampf von „Rules of Kindly“

Stand 17.11.2026, Folge 1 (Bibel `episoden/serie-02/bibel.md` §3.3, §10.2, §10.4, §10.7). Alles im Code gebaut, im Hausstil von 15.1 (`src/klotzfigur.js`). Prüfbilder: `node test/belege.mjs kindly-bear kindly-gus kindly-lunds kindly-fischer kindly-odell kindly-requisiten kindly-monster` (Episoden in `test/belege-kindly-figuren.mjs`, Bögen in `belege/kindly-*.jpg`). Das Tor für den Atemdampf: `node test/atem-probe.mjs` (20.6).

### 20.1 Figuren

| Modul | Figur | Erkennungsmerkmal (Halbtotale) | params | Gesichter (Bibel §10.2) |
|---|---|---|---|---|
| `bear` | Bear, 19, Erzähler, ab S34 die Kopie | petrolblauer Parka `#2E6E7E` mit Fellrand an der Kapuze im Nacken, Parka über die Hüfte, zerzauste dunkelbraune Haare, braune Winterstiefel | `groesse`, Atemdampf (20.2) | neutral, angespannt (= besorgt), augen_zu, erschrocken (= schock), leer, **ruhig** |
| `gus` | Gus, 27, Schutzfigur | rot-schwarz karierte Wolljacke (Karo als Textur, gleiche Größe auf Rumpf und Ärmeln), Mütze mit Ohrenklappen und Fellrand, Vollbart, Eispickel rechts | `groesse`, `pickel` (Std true), Atemdampf | ernst, warnend, entschlossen, **nass** (nass-äugig), leer |
| `lund` | Mr. Lund, 63 | Glatze mit grauem Haarkranz, grauer Schnurrbart, dunkelblauer Wollmantel mit Schal | `groesse`, `muetze`, Atemdampf (die Kopie: `dampf: false`) | neutral, **lachend** (Rückblende), leer |
| `mrs_lund` | Mrs. Lund, 61 | grauer Dutt, dunkelgrüner langer Mantel, cremefarbener Strickschal | `groesse`, Atemdampf | ernst, **gefasst** |
| `fischer` | Eisfischer (nur Erwachsene) | `variante` kapuze (Parka mit Kapuze auf) / muetze (Bommelmütze) / schirm (Latzhose, Schirmmütze) / schapka (Pelzmütze, Mantel) / kappe (Weste) | `variante`, `farbe`, `haut`, `alter` jung/mittel/alt, `bart`, `angel` (kurze Eisangel), `groesse`, Atemdampf | Hausstil-Satz |

- **Eispickel und `tippen`** (`gus`, 1,2 s, linear): Die Spitze tippt dreimal aufs Eis vor Gus (`zu` Anker oder Punkt, Std 0,5 m vor ihm; `schlaege` 3; `hoehe` 0,13 m). Die Faust folgt per IK, die Stange bleibt fast senkrecht. Aufprall k bei Fortschritt `0,14 + (k + 0,75) / 3 · 0,72` (bei 1,2 s: 0,38 / 0,67 / 0,96 s nach dem Start, für die Effekte). Anker `gus.pickel_spitze`.
- **Neue gemeinsame Animationen:** `stiefel_tippen` (1,2 s, der Stiefel tippt dreimal: S1, S30; `seite`, `schlaege`, `hoehe`; Aufprall bei (k + 0,75)/3), `hauchen` (gezielter Atemzug, 20.2), `dampf` (Dampf je Einstellung schalten, 20.2).
- **Neue Gesichter in `src/gesichter.js`** (nur Zusätze, Hiding Night unverändert): Ausdrücke `ruhig`, `nass` (Auge mit Wasserrand und zwei Lichtpunkten), `pruefend`, `gefasst`, `lachend` (zugekniffene Augen, offener Mund), `lippen_g`/`lippen_u`/`lippen_s`/`lippen_zu` (sichtbare Lippen in normaler Farbe, für „Gus“ unter dem Eis); Mundformen `lachen`, `lippen_*` (zusammengesetzt: `"neutral/lippen_u"`); Aliasse `nass_aeugig`, `streng_pruefend`.
- **Kopf-oben-Regel und Monster-Anteil:** `src/haupt.js` zählt `bear`, `gus`, `lund`, `mrs_lund`, `fischer` und `old_knuckles` (Gesicht unter dem Eis) zu den Gesichtern, `old_knuckles` zu den Monstern.
- Befund aus den Prüfbildern: In Dämmerlicht lesen sich dunkle Kleiderfarben schnell als Schwarz. Mäntel von Lund (`#34466C`) und Mrs. Lund (`#3A5E48`), Bärte und Gus' Mütze sind deshalb heller als die erste Fassung; Bears Haare haben ein Kantenlicht, die seitlichen Haarklötze sind klein (sie lasen sich als Kopfhörer).

### 20.2 Atemdampf je Figur (`src/atemdampf.js`)

Bibel §2: Draußen dampft jeder Atem, immer und bei allen; wer nicht dampft, ist die Kopie. Dampf setzt nie plötzlich ein, drinnen dampft niemand.

- **Bild:** Jeder Atemzug ist eine dichte, stehende Wolke aus 7 weichen Flecken (Sprites): aus dem Mund schräg nach unten, nach 0,35 s etwa 0,3 m vor dem Mund stehend, dann langsam steigend, aufgelöst nach 3,4 s. Alle 2,9 s (± 0,25 s, Takt je Figur aus dem Seed) beginnt der nächste: Es hängt fast immer eine Wolke vor dem Mund. Die Wolke liegt unter Mundhöhe (vor Kinn und Kragen), damit Augen und Mund in Vorderansichten frei bleiben.
- **Licht:** Grundhelligkeit aus Himmel-, Boden- und Hauptlicht des Presets (wie ein heller, matter Stoff), dazu **Gegenlicht**: Punktlichter in Reichweite (Steglaterne) streuen stark nach vorn, wenn sie hinter der Wolke stehen. Unter 0,9 m vor der Linse blendet die Wolke aus.
- **Schalten** in `figuren[].params` aller Kindly-Figuren (Odell: Std aus, wie in Hiding Night):
  - `dampf` true/false; `dampf_aus_ab` (s): ab hier keine neuen Atemzüge, die letzte Wolke löst sich natürlich auf (die Kopie, S34: überlebt jeden Schnitt); `dampf_aus` [[von, bis], …]: in diesen Fenstern gar kein Dampf (drinnen).
  - `dampf_staerke`, `dampf_groesse`, `dampf_periode`, `dampf_hell`, `dampf_farbe`.
  - Aktion `dampf` { `wert` false/true, `staerke`, `hell` } schaltet für die Einstellung (bis zum nächsten `stellung.neu`), z. B. Gesichter von vorn mit Dialog: `staerke` 0,5.
  - `atem_anhalten` / `idle_atmen staerke 0` (S33): kein neuer Atemzug, solange angehalten.
- **`hauchen`** (Std 3 s; die Bewegung ist nach 0,6 s fertig): gezielter, kräftiger Atemzug zum Ziel `zu` (z. B. `"odell.brille"`), die Figur beugt sich leicht vor; rund um den Hauch kein normaler Zug. Bei einer Kopie (Dampf aus) kommt nichts: genau das ist das Suchbild in S37. Odells `beschlagen` etwa 0,3 s nach dem Hauch-Start legen.
- **Anker `<figur>.dampf`:** wo die Wolke hängt (0,25 m vor dem Mund, 8 cm tiefer, dreht mit dem Kopf). Für Kameras und die Messung.
- **Kern:** `src/welt.js` ruft nach allen Aktionen `inst.aktualisiere?.(t)` jeder Figur auf (eine Zeile; Figuren ohne diese Funktion sind unberührt). Daran hängen Dampf, Odells Requisiten und die Arme von Old Knuckles. Die alten Partikel `atem` bleiben für Hiding Night.

### 20.3 Mr. Odell in Kindly (`figuren/odell.js`)

Ohne die neuen params ist Odell bitgleich wie in Hiding Night (das Modul kehrt vor allen Zusätzen zurück).

- `glaeser: "weiss"`: Die getragenen Gläser spiegeln immer weiß (weiß, leicht selbstleuchtend, Verlauf von oben nach unten, schräger Glanzstreifen; unter der Bloom-Schwelle). Die Augen dahinter sind ganz verdeckt, die Brauen bleiben sichtbar (streng, pruefend, muede). Gilt für alle Kindly-Folgen.
- `brille: "auf"` (Std) | `"hand"` (abgenommen, klare Gläser in der rechten Hand) | `"keine"`. Bildregel §3.3: ohne Brille nie von vorn.
- `links` / `rechts`: `"laterne"` (Sturmlaterne, warm leuchtend mit weichem Schein, hängt senkrecht) oder `"glocke"` (Handglocke). `laterne_an` (Std true). `dampf: true` draußen.
- **Animationen:** `brille_hoch` (0,5 s; Gläser mit ausgestrecktem Arm vor dem Gesicht, `vor` 0,32 m vor den Augen, `hoehe` −0,12 m, `zu`), `beschlagen` (0,35 s, weiß), `bleibt_klar` (0,8 s: Odell kippt die Gläser prüfend, ein Glanz läuft über das klare Glas, er schaut darauf), `abwischen` (1,2 s, kreisend am Mantel vor der Brust, der Beschlag verschwindet, danach wieder hoch; `zurueck`), `aufsetzen` (0,9 s; ab 75 % spiegeln die Gläser weiß; S40 ohne Abwischen), `brille_ab` (0,8 s, `nach` hoch/unten), `glocke_laeuten` (1,6 s; Schlag bei 0,15 s, dann gedämpftes Pendeln).
- **Pose am Schnitt:** `stellung: { odell: { pose: "brille_hoch" } }` hält die Gläser ab dem ersten Bild hoch.
- **Anker:** `brille` (Mitte der Gläser in der Hand), `brille_auf`, `glocke`, `laterne`, `dampf`.

### 20.4 Requisiten

| Modul | Zweck | params | Animationen / Anker |
|---|---|---|---|
| `brille_hand` | Odells Brille allein für Inserts (S38-Detail); Ursprung = Mitte der Gläser, Gläser nach +z | `beschlag` (0..1), `hand` (Std true: Fäustling und Ärmel am Bügel) | `beschlagen`, `bleibt_klar`, `abwischen`, `aufsetzen` (hebt sich aus dem Bild); Anker `mitte`, `glas_l`, `glas_r` |
| `handglocke` | Messingglocke mit Holzgriff (Ursprung Griffmitte, Glocke nach −y) | `hand` | `laeuten` (1,6 s); Anker `mitte`, `griff` |
| `laterne` | Sturmlaterne, kein echtes Punktlicht | `an`, `staerke` (2,4), `haengend` | `aus`, `an`, `pendeln`; Anker `glas` |
| `stadtbuch` | Odells Buch der Regeln auf `rathaus.pult` (Ursprung unter dem Buch, Leser bei +z, Seite 0,30 × 0,42 m) | `neigung`, `blatt` ("links" Std / "rechts" / false), `nachtrag` (ab F2: „3b. NOR FIRST.“), `groesse` | `blaettern` (0,55 s, RULE 18 blitzt auf; `zurueck`); Anker `stummel` („0 IF“), `regel`, `zeile`, `zeile_ende`, `namen`, `lund`, `falz`, `mitte`, `blatt` |
| `ortsschild` | Ortsschild bei `rand.ortsschild` (blick 180), Tafel 2,4 × 1,7 m, Mitte 1,75 m | `zahl` ("1,204"), `neu` ("1,203"), `schichten` (alte Zahlen), `hand`, `schnee` | `umschreiben` (1,0 s), `pinsel_sinken` (1,2 s); Anker `mitte`, `zahl`, `neu`, `pinsel`, `pop` |

- **Stadtbuch:** Aufgeschlagen ganz vorn: links Vorsatzpapier mit Exlibris („TOWN OF KINDLY · BOOK OF RULES · KEPT BY MR. ODELL“), rechts RULE 3 in Odells Federschrift (EB Garamond, Buchstabe für Buchstabe leicht gedreht) mit den gestrichenen Namen OTTER, SLIM, DUCK, BIRCH und zuletzt LUND (frischer Strich). Am Falz liegt der gerissene Stummel der ersten Seite mit „0 IF“, ein Punkt unter der 0; Versalhöhe 2,3 cm: für ≥ 72 px im fertigen Bild höchstens 0,34 m Buch in der Bildbreite (Kamera nah auf Anker `stummel`, z. B. Draufsicht 0,32 m Abstand, fov 40). Das lose Blatt trägt vorn RULE 18 („WHEN YOU TURN EIGHTEEN, YOU HIDE UNTIL SUNRISE.“). **Achtung Rathaus:** Der additive Lichtkegel der Pendellampe liegt in Draufsichten zwischen Kamera und Buch und überstrahlt die Seiten; für Buch-Einstellungen die Gruppe `rathaus.lampe` dimmen oder ausschalten (die Belege tun das).
- **Ortsschild:** emaillegrün `#2F4A3A`, Schrift creme `#EDE6D3` in Archivo Black (WELCOME TO / KINDLY / KINDLY MIND THE RULES / POP.), darunter zwei Zahlenzeilen mit 0,32 m hohen, von Hand weiß gemalten Ziffern (Pinselstruktur, alte Zahlen schwach darunter). `umschreiben`: Odells Hand mit Pinsel kommt von links unten (bis 0,38 s bleibt die alte Zahl frei), ein dunkler Federstrich durch Zeile 1 (0,40–0,52 s, Odells Tinte wie im Stadtbuch), die neue Zahl entsteht in Zeile 2 von links nach rechts (0,55–0,78 s), die Hand geht nach unten weg. Mit Start auf dem ersten Bild der Endkarte (1,5 s) steht die neue Zahl 0,72 s fertig (Bibel §3.2: ≥ 0,7 s). Für Ziffern ≥ 120 px darf das Bild an der Tafel höchstens 2,9 m breit sein: Der Kamerapunkt `rand.endkarte` ist dafür zu weit (dort etwa 89 px), `rand.schild` oder näher nehmen.

### 20.5 Monster `old_knuckles`

Gestreckte, bleiche Gestalt (grau-grünliches Hautgrau `#b9beb5`, schwach selbstleuchtend, Kantenlicht `#9FD8D2`), etwa 6,5 m vom Scheitel bis zu den Füßen (die Hütte BEAR & GUS ist 3 m lang), liegt fertig rücklings: Ursprung = Körpermitte, Gesicht nach +y, Kopf nach −z, mit blick 0 steht der Kopf für Kameras aus Süden oben im Bild.

- **Fäuste:** zwei Faustklötze (0,46 m) mit je vier Knöchelwürfeln. Die Unterarme werden je Bild so lang, dass die Knöchel an der Eis-Unterseite liegen (`eis_y`, Weltkoordinate, Std −0,02), egal wie tief der Körper liegt. So legt eine Einstellung das Wesen tief (Untersicht: Körper, lange Arme nach oben, Fäuste am Eis; S1, S10–11, z. B. Mitte y −1,15) und eine andere flach (Gesicht dicht unter dem Eis; S13–15, S34–35, y −0,55), per `stellung.position` am Schnitt. Im Eisloch der Hütte (Eishaut bei −0,15) `eis_y: -0.17`.
- **Lage im Set see:** Kopf unter `see.stelle` (z −31,5) heißt Mitte bei z −31,5 + 3,15 · groesse (Std: −28,35), x 2. Der Anker `see.wesen` (z −26) passt dazu nicht genau; die schneefreie Zone (6,4 × 18 m) ist größer als das Wesen.
- **Gesichter** (Aufkleber auf der flachen Oberseite des Kopfes, schwach selbstleuchtend, `leuchten` Std 0,35, damit es durch klares Eis bei Nacht zu sehen ist): `glatt` (sein eigenes, fast leer), `lund` (Schnurrbart, Haarkranz gemalt), `bear` (Pony gemalt), `gus` (Bart gemalt), `fischer`; neutral mit offenen Augen, normale Hautfarbe (keine Wasserleiche). Zusammengesetzt mit Lippenformen: `"bear/lippen_u"`.
- **Animationen:** `klopfen_unten` (1,2 s, drei Schläge von unten, `seite`, `tiefe` 0,22 m; Aufprall k bei (k + 0,75)/3), `andruecken` (0,8 s: Hals hebt und kippt, der Kopf bleibt waagerecht, das Gesicht liegt 1 cm unter dem Eis und wird leicht flach gedrückt; `hoehe`, `halten`), `sinken` (1,0 s), `lippen_gus` (0,8 s: g – u – s – zu, mit Gesicht `bear`; S61–62).
- **Anker:** `kopf`, `gesicht`, `mund`, `augen`, `ueber_kopf` (über dem Scheitel nach −z, für die Kopf-oben-Regel), `brust`, `huefte`, `knie`, `haende`, `hand_l/r`, `faust_l/r`, `fuss_l/r`, `fuss`, `mitte`.
- Befund: Die Kamerapunkte `see.unter_eis` und `see.unter_seite` sehen das liegende Wesen fast genau von der Seite, dort wirkt es wie ein Brett. Für den Hook (S1) besser schräg von unten-seitlich auf den tief liegenden Körper mit den langen Armen (Beleg `kindly-monster`, letzte Einstellung).

### 20.6 Atem-Probe mit Kompressions-Simulation (Tor, Bibel §10.7, §14 Nr. 15)

```bash
cd horror/engine && . /opt/deeptok/env.sh
node test/atem-probe.mjs                 # rendert mit und ohne Dampf, misst; Ergebnis: build/kindly-01/atem-probe.mp4
node test/atem-probe.mjs --nur-messung   # nur Kompression und Messung erneut (test/atem_messung.py)
```

- **Probe:** 10 s nachts am Stegende (Set see, Licht `see_nacht`, Gegenlicht der Steglaterne, leichter Schneefall), wie S37: Kamera neben dem Steg, Odell (weiße Gläser, Laterne) von hinten, Bear und Gus im Dreiviertelprofil. Gus und Odell dampfen, Bear nicht. Zwei Einstellungen (0–5 s alle drei, 5–10 s näher an Bear und Gus).
- **Simulation:** Die Hauptfassung (crf 18) wird wie von einer Plattform im schlechten Fall neu kodiert: H.264, x264 `-preset medium`, zwei Durchgänge, 1080 × 1920 mit 2,5 und 1,5 Mbit/s, 720 × 1280 mit 1,0 Mbit/s.
- **Messung:** je Fassung und Figur mittlere Helligkeit in einem Kasten um den Anker `dampf` (Größe nach dem Abstand Mund–Wolke im Bild), mit Dampf minus ohne Dampf (dieselbe Episode mit `dampf: false`, gleich kodiert). Tor (Bibel §10.7, Schwellen A): wer dampft, im Mittel ≥ 12 Stufen; Bear im Mittel unter 3; „fällt in unter 1 s auf“: in jedem 1-s-Fenster hebt sich mindestens eine dampfende Figur um ≥ 12 ab. Dazu Kontaktbögen in Feed-Größe 270 × 480 (`build/kindly-01/atem-probe/bogen-<fassung>.jpg`) zum Ansehen.
- **Ergebnis 17.11.2026: bestanden** (`build/kindly-01/atem-probe/messung.json`). Die Kompression ändert an der Wolke praktisch nichts:

| Fassung | Bitrate (gemessen) | Gus | Odell (von hinten) | Bear (ohne Dampf) | schwächstes 1-s-Fenster der Gruppe |
|---|---|---|---|---|---|
| Hauptfassung crf 18 | 20,3 Mbit/s | +138,6 | +23,9 (1-s-Minimum 5,6) | 0,10 | 64,1 |
| 1080 × 1920, 2,5 Mbit/s | 2,49 | +138,7 | +23,9 (5,6) | 0,13 | 64,2 |
| 1080 × 1920, 1,5 Mbit/s | 1,53 | +138,7 | +23,9 (5,6) | 0,14 | 64,4 |
| 720 × 1280, 1,0 Mbit/s | 1,02 | +138,7 | +23,9 (5,6) | 0,15 | 64,2 |

- **Nachgeschärft nach der ersten Probe:** Wolkenflecken 20 % größer und im Kern dichter (erste Probe: Gus +122, in Feed-Größe war die Wolke in der Halbtotalen nur gut 25 px breit). Die Fenster-Regel gilt für die Gruppe: Odell, von hinten gesehen, verdeckt mit dem eigenen Kopf in einzelnen Sekunden seine Wolke (1-s-Minimum 3,9 → 5,6).
- **Sicht (Bögen angesehen):** In jedem Bild der Bögen hängt vor Gus' Kinn eine weiße Wolke, Odells Wolke steht neben seinem Kopf; Bear hat keine. In der Halbtotalen ist die Wolke in Feed-Größe klein (etwa 30 px): Für die Suchbild-Einstellungen (S3–4, S41, S64) Halbnah oder näher und die Wolke vor dunklem Grund im Gegenlicht (Laterne seitlich hinter der Figur, nicht hinter einem Kopf). In Großaufnahmen von vorn deckt die Wolke Kinn und Kragen; bei Dialog `dampf { staerke: 0.5 }`.
- **Endkarte** (`node test/atem-probe.mjs --endkarte`, 1,5 s, Set stadtrand, Nacht, Schneefall, Kamera 6,6 m vor der Tafel, Blick auf 1,15 m): Nach derselben Kompression (720 × 1280, 1 Mbit/s) sind „1,204“, der Strich und „1,203“ in Feed-Größe lesbar (`build/kindly-01/atem-probe/bogen-endkarte.jpg`, `build/kindly-01/endkarte-probe.mp4`); die Zahlenzeilen liegen bei y ≈ 800 und 960 (sichere Zone). Die alte Zahl bleibt bis 0,4 s frei (der Pinsel kommt von links unten), die neue steht ab 0,78 s.
- Linus' Blick am Handy ist optional: `build/kindly-01/atem-probe.mp4` (crf 18) und die komprimierten Fassungen `build/kindly-01/atem-probe/mit-*.mp4`.

### 20.7 Offen

- Der Shotlisten-Test „Set-Ereignisse landen mit Wortzeit in params.ereignisse (Kriechkeller, Glocke)“ (`npm test`) schlägt fehl („Fingerschatten auf Ready“); er betrifft `shotliste.mjs` (zuletzt geändert mit den Orten, ce04830), nicht die Bausteine dieses Abschnitts.
- Kamerapunkte des Sets see für Old Knuckles nachstellen (Untersicht schräg von unten-seitlich, Kopf unter `stelle`), `rand.endkarte` näher an die Tafel, `rathaus.lampe` bei Buch-Einstellungen dimmen (20.4, 20.5).

