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

**Presets** (`src/licht.js`): `nacht` (blauer Himmel mit Mond und Sternen, Mondlicht von hinten-oben, Nebel), `daemmerung` (violett-rosa Verlauf, tiefe warme Sonne), `innen_warm`, `tag`. Jedes Preset setzt Himmel, Nebel (FogExp2), Himmel-/Bodenlicht, Hauptlicht mit weichen Schatten (PCF, 2048er Karte, `weich` = Radius) und Kantenlicht, dazu Belichtung und Farbstimmung. Die Zahl der Lichter ist immer gleich; ein Preset-Wechsel am Schnitt kostet deshalb keine Shader-Übersetzung. Die Schattenkarte deckt je Einstellung `schatten_bereich` m (Std 24) um das Kameraziel am Einstellungsbeginn ab und bleibt in der Einstellung fest (kein Flimmern).

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
  --einzelbild <s>         ein Probebild als JPG            --prozesse <n>     parallele Chromium (2 empfohlen)
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
| `june` | June Marsh, 24 | senfgelbe Strickjacke mit Knopfklötzen, roter Zopf (eigenes Gelenk `zopf`), bernsteinfarbene Augen | `rueckblende` (offene Haare), `barfuss`, `groesse` |
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
- **Anker:** `kopf`, `augen`, `mund` (vor den Händen, für Atemdampf), `auge`, `haende`, `ueber_kopf`, `brust`, `ruecken`, `huefte`, `knie`, `hand_l/r`, `fuss_l/r`, `fuss`.

### 15.3 Requisiten (als Figuren, damit die Episode sie stellt und bewegt)

| Modul | Zweck | params | Animationen / Anker |
|---|---|---|---|
| `schuhpaar` | „your shoes, side by side“: eigenes, genaueres Modell (`baueSchuhDetail`: Sohle, flache Zehenkappe, höhere Ferse, Rist mit Schnürung, dunkle Öffnung mit Polsterrand, Fersenkappe, Streifen), schlank wie ein echter Schuh; „grau“ ist hell mit Navy-Akzent | `art` eli/june/dad/owen/tess/grau/nachbar, `ordnung` nebeneinander/schief | Anker `mitte` |
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

### 16.5 Folge 1 in Zahlen (Messtor)

Nach dem Review (REVIEW.md im Episoden-Ordner): 58 Einstellungen plus Endkarte, 87,27 s. Median 1,40 s, 40,3 Einstellungen/min, kürzeste 0,77 s, längste 2,50 s. 14 Akzentfahrten (im Mittel alle 6,2 s, größte Lücke 8,9 s), 3 Snap-Zooms, 2-mal Wackeln, 3 Lichtereignisse, Monster in 24,1 % der Einstellungen, Körperaktion in 64 % (Spec 35–55 %: etwas viel, kein Abbruch). Endkarte 0,147 s nach dem letzten Wort. Kompositionsprüfung: 57 von 57 Einstellungen ohne Verstoß.

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
- Helligkeits-Tor (Review Folge 1): Median der Bildhelligkeit ≥ 85 von 255, keine Einstellung im Mittel unter 35. Balken-Tor: kein Bild mit fast schwarzen Spalten über 10 % der Breite. Kantendichte wird berichtet (r2 16,5 %, r5 13,3 %).

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

## 18. Musik-Werkstatt

Stand 15.11.2026. Eigene Klangbetten im Stil der Referenzvideos, Einzelheiten in `musik/README.md`, Regeln in `musik/GRAMMATIK.md`, Lizenzen in `musik/LIZENZEN.md`.

- Vier Stile (Spieluhr-Arpeggio nach r2, Wiegenlied-Spieluhr nach r5, Klavier-Fläche nach ref0, Sub-Drone nach r1), je eine nahtlose Schleife von 171–184 s in den Varianten dünn, normal, voll; MIDI in `musik/midi/`, WAV in `build/musik/`.
- Für „Hiding Night“ empfohlen: Wiegenlied-Spieluhr. Die Spannungsfassung (`musik/spannung.py`, Steuerung über `musik/spannung/hiding-night-teil1.json`) kann als `--bett` von `fertigen.py` das bisherige Bett `klangbett-r2-a.wav` in der Vorhör-Fassung ersetzen (noch nicht eingebaut; `mischen.py` normiert dann das ganze Bett auf 12 LU unter der Stimme, `spannung.py --vorhoer` dagegen die Stufe „normal“). Der Upload bleibt ohne Musik.

