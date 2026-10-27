// Bau-Skript für den Bühnen-Spike.
//
//   node build/bauen.mjs        (aus studio/spike-buehne/)
//
// Was es tut:
//   1. Lädt beim BAU die Weltkarte (world-atlas, Natural Earth 1:10m) und die
//      Schriften nach build/cache/ und prüft jede Datei per SHA-256. Das Video
//      selbst lädt nie etwas aus dem Netz.
//   2. Projiziert Europa (Lambert konform-konisch, wie amtliche EU-Karten)
//      in ein festes Weltkoordinaten-System und schreibt SVG-Pfade.
//   3. Rechnet Zeiten, Orte, Route und Kamera-Einstellungen aus und prüft die
//      Haltezeiten.
//   4. Setzt gemeinsame Stücke in beide Varianten ein, jeweils zwischen
//      Marken wie  <!-- @welt:anfang --> ... <!-- @welt:ende -->.
//      So bekommen A und B exakt dieselbe Welt, dieselben Zeiten und dieselbe
//      Marker-Bibliothek, und der Vergleich misst nur die Bauweise.
//   5. Schreibt data-start/data-duration aller Clips (data-cue="...") und
//      Szenen-Hosts aus denselben Zeiten. Keine Zeit steht von Hand im HTML.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { geoConicConformal, geoPath, geoGraticule } from "d3-geo";
import { feature, mesh, merge } from "topojson-client";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const SPIKE = path.resolve(HIER, "..");

// ---------------------------------------------------------------------------
// ZEITEN, Teil 1: WORT-CUES. Jeder Wert ist der Zeitpunkt eines Wortes im
// gedachten Sprechtext. Später kommen sie aus den Wortzeiten der Stimme
// (assets/timing.json); heute sind sie von Hand gesetzt.
// Gedachter Sprechtext: "Sommer 2022. Der FC Bayern verkauft Robert
// Lewandowski nach Barcelona. Barcelona zahlt dafür nach München:
// 45 Millionen Euro Ablöse. Sein Vertrag lief nur noch bis Juni 2023."
// ---------------------------------------------------------------------------
export const WORTE = {
  bayern: 0.3, // "FC Bayern": Deutschland leuchtet auf, München erscheint
  barcelona: 3.9, // "nach Barcelona": Punkt, Name und Kreis genau auf dem Wort
  zahlt: 5.4, // "Barcelona zahlt": das Geld fällt auf Barcelona
  muenchen: 7.05, // "nach München": das Geld hebt ab
  zahl: 10.35, // "45 Millionen": die Münzen werden zur Zahl
  abloese: 10.95, // "Ablöse": Unterstreichung unter der Zahl
  juni: 12.1, // "Juni 2023": roter Akzent (Vertrag läuft aus)
};

// Physik des Darstellers (Bildpixel und Sekunden). Konstanten des Moduls,
// nie Felder der Spec. Das Drehbuch (build/drehbuch-welt.js) baut daraus die Spuren.
const DARSTELLER = {
  fallhoehe: 560, // aus dieser Höhe fällt der Stapel auf den Ort
  fallzeit: 0.42, // bis zum Aufprall
  flughoehe: 110, // Reiseflughöhe über der Karte
  steigzeit: 0.45, // vom Boden auf Flughöhe
  sinkzeit: 0.5, // von Flughöhe auf den Boden
  flugzeit: 1.7, // Abflug bis Landung (kurz: der Flug hat wenig zu lesen)
  dockzeit: 0.6, // vom Kartenort zum Platz der Zahl
};
const KREIS_DAUER = 0.5; // so lange braucht der Stift für den Kreis
const HALTEN = 1.2; // Kit-Regel: nach jeder Landung mindestens so lange ruhen

// ---------------------------------------------------------------------------
// ZEITEN, Teil 2: ABGELEITET. Kein Wort, sondern Wort + Versatz oder ein
// Lesefenster. Ändern sich die Wörter, wandern diese Zeiten mit.
// ---------------------------------------------------------------------------
function ableiten(w) {
  const titelAus = 2.35; // Lesefenster der Schlagzeile: 0,5 s + 0,3 s je Wort (5) + Puffer
  const abflug = w.muenchen;
  const landung = abflug + DARSTELLER.flugzeit;
  const geld = w.zahlt;
  return {
    anfang: 0,
    ...w,
    muenchenPunkt: w.bayern + 0.5, // Punkt München kurz nach "Bayern"
    titelAus, // Schlagzeile geht (erst danach darf die Kamera fahren)
    titelWeg: titelAus + 0.25, // Ende des Schlagzeilen-Clips
    fahrt: titelAus + 0.15, // Kamera: Europa -> Barcelona
    kreis: w.barcelona, // Kreis genau auf dem Wort
    kreisAus: geld + DARSTELLER.fallzeit - 0.2, // Kreis macht Platz, kurz bevor das Geld aufsetzt
    geld,
    abflug,
    schnitt: abflug + 0.45, // harter Schnitt im Flug (Testschnitt, siehe REVIEW.md)
    landung,
    kameraSteht: landung + 0.1, // Lesefenster in München beginnt
    andocken: w.zahl - 0.4, // Geld steigt auf und wird zur Zahl, genau zum Wort
    unterstrich: w.abloese,
    quelleAbloese: w.abloese,
    vertrag: w.juni,
    quelleVertrag: w.juni,
    ende: w.juni + 2.9, // letzte Zeile hält >= 2 s (5 Wörter: 0,5 s + 5 x 0,3 s)
  };
}
export const ZEIT = ableiten(WORTE);

// Prüfungen: Lieber beim Bau abbrechen als ein Video mit zu kurzen Haltezeiten
// bauen. Kommen die Wörter später aus der Stimme, fällt ein zu schnelles
// Skript hier auf (vor dem Rendern).
function pruefeZeiten(z) {
  const fehler = [];
  const mindestens = (was, ist, soll) => {
    if (ist < soll - 1e-9) fehler.push(`${was}: ${ist.toFixed(2)} s < ${soll} s`);
  };
  mindestens("Kamera-Fahrt Europa -> Barcelona", z.barcelona - z.fahrt, 1.0);
  mindestens("Kreis steht fertig (Halten)", z.kreisAus - (z.kreis + KREIS_DAUER), HALTEN);
  mindestens("Geld ruht in Barcelona (Halten)", z.abflug - (z.geld + DARSTELLER.fallzeit), HALTEN);
  mindestens("Geld ruht in München (Halten)", z.andocken - z.landung, HALTEN);
  mindestens("Flug: Steigen vor Sinken", z.landung - DARSTELLER.sinkzeit - (z.abflug + DARSTELLER.steigzeit), 0);
  mindestens("Zahl hält vor 'Vertrag'", z.vertrag - (z.zahl + 0.32), HALTEN);
  mindestens("Letzte Zeile hält", z.ende - z.vertrag, 2.0);
  if (fehler.length) throw new Error("Zeiten verletzen das Kit:\n  " + fehler.join("\n  "));
}
pruefeZeiten(ZEIT);

// Szenen-Grenzen (für Variante B: je eine Sub-Komposition; für A: Labels)
export const SZENEN = [
  { id: "start", beginn: 0, ende: ZEIT.schnitt },
  { id: "flug", beginn: ZEIT.schnitt, ende: ZEIT.landung },
  { id: "ziel", beginn: ZEIT.landung, ende: ZEIT.ende },
];

const BREITE = 1080;
const HOEHE = 1920;

// ---------------------------------------------------------------------------
// 1) Dateien laden (nur beim Bau), mit Prüfsumme.
//    Ohne Prüfsumme würde eine abgeschnittene Datei (Abbruch beim Schreiben)
//    für immer im Cache bleiben. Darum: in .tmp schreiben, prüfen, umbenennen.
// ---------------------------------------------------------------------------
const CACHE = path.join(HIER, "cache");
const JSDELIVR = "https://cdn.jsdelivr.net/npm";
const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

async function hole(datei, url, soll) {
  const ziel = path.join(CACHE, datei);
  fs.mkdirSync(path.dirname(ziel), { recursive: true });
  if (fs.existsSync(ziel)) {
    if (sha256(fs.readFileSync(ziel)) === soll) return ziel;
    console.log(`Cache-Datei ${datei}: Prüfsumme falsch (abgeschnitten oder alt), lade neu`);
  }
  console.log("lade", url);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Nicht geladen (${r.status}): ${url}`);
  const buf = Buffer.from(await r.arrayBuffer());
  const ist = sha256(buf);
  if (ist !== soll) {
    throw new Error(
      `Prüfsumme falsch für ${url}\n  erwartet ${soll}\n  bekommen ${ist}\n` +
        `Die Quelle hat sich geändert. Neue Version ansehen und die Prüfsumme in build/bauen.mjs anpassen.`,
    );
  }
  fs.writeFileSync(ziel + ".tmp", buf);
  fs.renameSync(ziel + ".tmp", ziel);
  return ziel;
}

const KARTE_DATEI = await hole(
  "countries-10m.json",
  `${JSDELIVR}/world-atlas@2.0.2/countries-10m.json`,
  "3bc6f1d367a9bcec479841bae0e76092f512838411d0cef124e92eec4db45f79",
);
const welt = JSON.parse(fs.readFileSync(KARTE_DATEI, "utf8"));
const laender = welt.objects.countries;

// Schriften lokal (OFL-Lizenz). Der Render-Compiler bettet Inter/Playfair
// selbst ein, der Live-Player aber NICHT: Ohne eigene @font-face-Regeln zeigt
// er, was das Gerät gerade installiert hat. Eigene Familiennamen ("DT ...")
// machen klar, welche Datei gemeint ist. Die Dateien liegen auch im Repo
// (assets/fonts/), damit check nach einem frischen Klon ohne Bau besteht.
const SCHRIFTEN = [
  { familie: "DT Playfair", gewicht: 900, datei: "playfair-display-latin-900-normal.woff2", paket: "playfair-display@5.1.0",
    sha: "10795faaa4bd86f12f542b9451ed24b2948f7a4117328adcd068fcd8190f48b4" },
  { familie: "DT Inter", gewicht: 400, datei: "inter-latin-400-normal.woff2", paket: "inter@5.1.0",
    sha: "dd05e326cf8eac3b55acecf29c842ed73e6e6dd06491cf47f7e8800680ab3e33" },
  { familie: "DT Inter", gewicht: 600, datei: "inter-latin-600-normal.woff2", paket: "inter@5.1.0",
    sha: "62553d159189834af73c9a6264704be5b2bee9a08da66a14768d8e5c6ffd2cdb" },
];
const LIZENZEN = [
  { datei: "LICENSE-playfair.txt", paket: "playfair-display@5.1.0", sha: "4d4c865ff8d7ebfa445add31a5447e94bc146b63eaaa8cccb0bd3ef3c16229b3" },
  { datei: "LICENSE-inter.txt", paket: "inter@5.1.0", sha: "8c8fa881d9091ee315d2c80d207bb73afd4e90a66c9782ca445c5642f25db6dc" },
];
const fontDateien = [];
for (const f of SCHRIFTEN) fontDateien.push(await hole(`fonts/${f.datei}`, `${JSDELIVR}/@fontsource/${f.paket}/files/${f.datei}`, f.sha));
for (const f of LIZENZEN) fontDateien.push(await hole(`fonts/${f.datei}`, `${JSDELIVR}/@fontsource/${f.paket}/LICENSE`, f.sha));
for (const variante of ["a-buehne", "b-wurzel", "c-aplus"]) {
  const ordner = path.join(SPIKE, variante, "assets", "fonts");
  fs.mkdirSync(ordner, { recursive: true });
  for (const quelle of fontDateien) fs.copyFileSync(quelle, path.join(ordner, path.basename(quelle)));
}
const schriftenCss = SCHRIFTEN.map(
  (f) => `@font-face { font-family: "${f.familie}"; src: url("assets/fonts/${f.datei}") format("woff2"); font-weight: ${f.gewicht}; font-style: normal; font-display: block; }`,
).join("\n");

// ---------------------------------------------------------------------------
// 2) Projektion: 1 Welteinheit = 1 Bildpixel in der Europa-Totale (Zoom 1).
//    Lambert konform-konisch mit Standardparallelen 40° und 56° N, Mitte 9° O / 47° N.
// ---------------------------------------------------------------------------
const projektion = geoConicConformal()
  .parallels([40, 56])
  .rotate([-9, 0])
  .center([0, 47])
  .scale(2800)
  .translate([0, 0])
  // Alles außerhalb dieses Rechtecks sieht die Kamera nie: weg damit.
  .clipExtent([
    [-820, -1180],
    [780, 1220],
  ]);

// Eigener "Zeichenkontext" für d3-geo: sammelt die Pfade als SVG-Text,
// rundet auf 0,1 und lässt Punkte weg, die näher als 1 Einheit am vorigen liegen.
// Bei Zoom 3 sind das 3 Bildpixel: glatt genug, und die 10m-Karte bleibt klein.
function sammler(minAbstand = 1.0) {
  let teile = [];
  let lx = 0;
  let ly = 0;
  const r = (v) => Math.round(v * 10) / 10;
  return {
    moveTo(x, y) {
      x = r(x);
      y = r(y);
      teile.push(`M${x} ${y}`);
      lx = x;
      ly = y;
    },
    lineTo(x, y) {
      x = r(x);
      y = r(y);
      if (Math.hypot(x - lx, y - ly) < minAbstand) return;
      // relative Befehle sind kürzer; gerechnet wird mit gerundeten Absolutwerten,
      // damit sich kein Rundungsfehler aufsummiert
      teile.push(`l${r(x - lx)} ${r(y - ly)}`);
      lx = x;
      ly = y;
    },
    closePath() {
      teile.push("z");
    },
    arc() {},
    nimm() {
      const s = teile.join("").replace(/ -/g, "-");
      teile = [];
      return s;
    },
  };
}
const ctx = sammler();
const zeichner = geoPath(projektion, ctx);
function pfad(geo) {
  zeichner(geo);
  return ctx.nimm();
}

// Die Küste ist der Rand der Landfläche: #w-land bekommt Füllung UND Strich.
// Ein eigener Küsten-Pfad wäre dieselbe Linie noch einmal (doppelte Datenmenge).
const land = pfad(merge(welt, laender.geometries));
const grenzen = pfad(mesh(welt, laender, (a, b) => a !== b));
const netz = pfad(geoGraticule().step([5, 5])());
const nachId = (id) => {
  const g = laender.geometries.find((x) => x.id === id);
  if (!g) throw new Error("Land fehlt in der Karte: " + id);
  return g;
};
const deutschland = pfad(feature(welt, nachId("276"))); // ISO 3166 numerisch: 276 = DE
const spanien = pfad(feature(welt, nachId("724"))); // 724 = ES

function hervorhebung(id, d) {
  return (
    `<g id="${id}" class="w-hl" style="opacity:0">` +
    `<path class="w-hl-flaeche" d="${d}"/><path class="w-hl-schein" d="${d}"/><path class="w-hl-rand" d="${d}"/></g>`
  );
}
const karte = [
  `<path id="w-land" d="${land}"/>`,
  `<path id="w-netz" d="${netz}"/>`,
  `<path id="w-grenzen" d="${grenzen}"/>`,
  hervorhebung("w-hl-de", deutschland),
  hervorhebung("w-hl-es", spanien),
  `<path id="w-spur" d=""/>`,
].join("\n      ");

// ---------------------------------------------------------------------------
// 3) Orte, Route, Kamera
// ---------------------------------------------------------------------------
const roh = geoConicConformal().parallels([40, 56]).rotate([-9, 0]).center([0, 47]).scale(2800).translate([0, 0]);
const rund = (p) => p.map((v) => Math.round(v * 10) / 10);
const STAEDTE = { muenchen: [11.576, 48.137], barcelona: [2.17, 41.387] };
// Ländernamen: Ort des Schriftzugs (Länge, Breite), von Hand in die Landmitte gelegt
const LAENDER = {
  deutschland: { name: "DEUTSCHLAND", lage: [10.2, 51.3] },
  frankreich: { name: "FRANKREICH", lage: [2.4, 46.9] },
  spanien: { name: "SPANIEN", lage: [-3.9, 40.1] },
};
const orte = {};
for (const [id, lage] of Object.entries(STAEDTE)) orte[id] = rund(roh(lage));
for (const [id, l] of Object.entries(LAENDER)) orte[id] = rund(roh(l.lage));

// Ländernamen als Anker. data-bis-zoom: Ab diesem Zoom ist der Name weg
// (nah dran stünde er mitten im Bild, wie auf einer Karte in falschem Maßstab).
const laenderHtml = Object.entries(LAENDER)
  .map(
    ([id, l]) =>
      `<div id="w-land-${id}" class="w-anker" data-anker="${id}"><div class="w-rand w-mitte" data-bis-zoom="2.4"><div class="w-land-name">${l.name}</div></div></div>`,
  )
  .join("\n  ");

// Route als Bogen nach Nordwesten (wie eine Flugbahn über Frankreich).
// Richtung = Geldfluss: von Barcelona (Käufer) nach München (Verkäufer).
const [p0, p2] = [orte.barcelona, orte.muenchen];
const dx = p2[0] - p0[0];
const dy = p2[1] - p0[1];
const lang = Math.hypot(dx, dy);
const mitte = [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2];
const quer = [-dy / lang, dx / lang]; // senkrecht zur Strecke
const bogen = quer[1] < 0 ? 1 : -1; // Richtung "oben" wählen
const route = { p0, c: rund([mitte[0] + quer[0] * bogen * 0.24 * lang, mitte[1] + quer[1] * bogen * 0.24 * lang]), p2 };

// Kamera-Einstellung: "Ort P soll bei Zoom Z an Bildpunkt (bx, by) stehen".
// Daraus folgt der Weltpunkt in der Bildmitte (kx, ky). So spricht auch der
// Kamera-Vertrag: benannte Einstellungen, keine Kamerazahlen in der Spec.
function einstellung(p, bx, by, zoom) {
  return {
    kx: Math.round((p[0] - (bx - BREITE / 2) / zoom) * 10) / 10,
    ky: Math.round((p[1] - (by - HOEHE / 2) / zoom) * 10) / 10,
    zoom,
  };
}
const kamera = {
  europa: einstellung(orte.muenchen, 650, 980, 1.0), // totale:europa
  barcelona: einstellung(orte.barcelona, 420, 1080, 3.2), // nah:barcelona
  // nach dem Schnitt: Barcelona links unten, München rechts oben, beide im Bild
  flug: einstellung(orte.barcelona, 230, 1240, 1.85), // schnitt:flug
  muenchen: einstellung(orte.muenchen, 600, 1000, 3.0), // nah:muenchen
};
// Bildplatz der Zahl "45 Mio. €" (Mitte des Münzstapels = linker Rand der Zahl + 70 px)
const slot = [108 + 70, 500];
// Breite von "45 Mio. €" in DT Playfair 900 / 173 px, von Hand gemessen (Box von
// #d-zahl in check). Offener Punkt: Für ein Bibliotheks-Modul misst der Bau sie.
const ZAHL_BREITE = 726;

// Bildschirmposition eines Ortes bei einer Einstellung (für Variante B:
// Szenen kennen die Kamera nicht und brauchen feste Pixel).
function imBild(p, k) {
  return rund([(p[0] - k.kx) * k.zoom + BREITE / 2, (p[1] - k.ky) * k.zoom + HOEHE / 2]);
}
const bild = { barcelonaImHalt: imBild(orte.barcelona, kamera.barcelona) };

const DATEN = { orte, route, kamera, slot, zahlBreite: ZAHL_BREITE, bild, geld: DARSTELLER, kreisDauer: KREIS_DAUER, breite: BREITE, hoehe: HOEHE };

// ---------------------------------------------------------------------------
// Münzstapel (Darsteller) als SVG: 5 Münzen, leicht versetzt wie von Hand
// gestapelt. Licht von links oben: Verlauf auf Oberseite und Rand, Glanzkante,
// Schlagschatten. Ohne Licht sah der Stapel wie flaches Clip-Art aus.
// ---------------------------------------------------------------------------
function muenzen() {
  const versatz = [0, 4, -3, 5, -1];
  const rx = 62;
  const ry = 21;
  const dicke = 15;
  const teile = [
    `<defs>`,
    `<linearGradient id="d-rand-licht" x1="0" y1="0" x2="1" y2="0">` +
      `<stop offset="0" stop-color="#5E481B"/><stop offset="0.3" stop-color="#A88638"/><stop offset="0.45" stop-color="#C4A24A"/>` +
      `<stop offset="0.75" stop-color="#7C6127"/><stop offset="1" stop-color="#4A3814"/></linearGradient>`,
    `<radialGradient id="d-oben-licht" cx="0.36" cy="0.3" r="0.8">` +
      `<stop offset="0" stop-color="#F6E3A2"/><stop offset="0.45" stop-color="#D6B55A"/><stop offset="1" stop-color="#A9883A"/></radialGradient>`,
    `<filter id="d-schlagschatten" x="-30%" y="-30%" width="160%" height="160%">` +
      `<feDropShadow dx="5" dy="7" stdDeviation="5" flood-color="#03070E" flood-opacity="0.6"/></filter>`,
    `</defs>`,
    `<g filter="url(#d-schlagschatten)">`,
  ];
  for (let i = 0; i < versatz.length; i++) {
    const cx = 76 + versatz[i];
    const cy = 142 - i * 22; // Oberseite der Münze i
    teile.push(
      // Rand (Seitenfläche): von links oben nach unten, Bogen unten, wieder hoch
      `<path d="M${cx - rx} ${cy} v${dicke} a${rx} ${ry} 0 0 0 ${2 * rx} 0 v${-dicke} z" fill="url(#d-rand-licht)"/>`,
      // Riffelung am Rand: kurze senkrechte Striche
      ...Array.from({ length: 9 }, (_, k) => {
        const a = Math.PI * (0.12 + (k / 8) * 0.76);
        const x = cx - Math.cos(a) * rx;
        const y = cy + Math.sin(a) * ry;
        return `<path d="M${x.toFixed(1)} ${(y + 3).toFixed(1)} v${dicke - 5}" stroke="#4F3C15" stroke-opacity="0.7" stroke-width="2.2" stroke-linecap="round"/>`;
      }),
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#d-oben-licht)" stroke="#9C7D33" stroke-width="1.6"/>`,
      // Lichtkante oben links auf jeder Münze
      `<path d="M${cx - rx + 6} ${cy - 4} q ${rx * 0.55} ${-ry * 0.95} ${rx * 1.2} ${-ry * 0.85}" fill="none" stroke="#FFF2C6" stroke-width="2" stroke-linecap="round" opacity="0.75"/>`,
    );
  }
  // oberste Münze: Prägung (Ring + €-Zeichen)
  const cx = 76 + versatz[4];
  const cy = 142 - 4 * 22;
  teile.push(
    `<ellipse cx="${cx}" cy="${cy}" rx="44" ry="14.5" fill="none" stroke="#9C7D33" stroke-width="2.5"/>`,
    `<text x="${cx}" y="${cy + 9}" text-anchor="middle" font-family="DT Playfair, Playfair Display, serif" font-weight="900" font-size="34" fill="#6A5220" transform="translate(0 ${cy}) scale(1 0.62) translate(0 ${-cy})">€</text>`,
    `</g>`,
  );
  return teile.join("");
}

// ---------------------------------------------------------------------------
// 4) Einsetzen. Für jede Zieldatei steht fest, welche Blöcke sie braucht.
//    Fehlt eine Marke (oder ist sie verschrieben), bricht der Bau ab: sonst
//    liefen A und B still auseinander, genau das soll der Bau verhindern.
// ---------------------------------------------------------------------------
const lies = (p) => fs.readFileSync(path.join(SPIKE, p), "utf8");
function ersetzePlatzhalter(text, marke, inhalt) {
  if (!text.includes(marke)) throw new Error(`Platzhalter ${marke} fehlt in lib/welt.html`);
  return text.replace(marke, () => inhalt);
}
let weltFragment = lies("lib/welt.html").replace(/^<!--[\s\S]*?-->\n/, ""); // Erklär-Kommentar nicht in jede Datei kopieren
weltFragment = ersetzePlatzhalter(weltFragment, "<!-- @karte -->", karte);
weltFragment = ersetzePlatzhalter(weltFragment, "<!-- @laender -->", laenderHtml);
weltFragment = ersetzePlatzhalter(weltFragment, "<!-- @muenzen -->", muenzen());

const BLOECKE = {
  welt: { art: "html", inhalt: weltFragment },
  schriften: { art: "js", inhalt: schriftenCss }, // CSS-Kommentar /* */ wie bei JS
  marker: { art: "js", inhalt: lies("lib/marker.js") },
  buehne: { art: "js", inhalt: lies("lib/buehne.js") },
  daten: {
    art: "js",
    inhalt:
      "// eingesetzt von build/bauen.mjs (nicht von Hand ändern)\n" +
      "// WORTE: Wort-Cues (später aus den Wortzeiten der Stimme). ZEIT: Wort-Cues plus abgeleitete Zeiten.\n" +
      `const WORTE = ${JSON.stringify(WORTE)};\n` +
      `const ZEIT = ${JSON.stringify(ZEIT)};\n` +
      `const SZENEN = ${JSON.stringify(SZENEN)};\n` +
      `const DATEN = ${JSON.stringify(DATEN)};\n`,
  },
  drehbuch: { art: "js", inhalt: lies("build/drehbuch-welt.js") },
};

function setzeEin(text, datei, name) {
  const { art, inhalt } = BLOECKE[name];
  const [a, e] = art === "html" ? [`<!-- @${name}:anfang -->`, `<!-- @${name}:ende -->`] : [`/* @${name}:anfang */`, `/* @${name}:ende */`];
  const zaehle = (s) => text.split(s).length - 1;
  if (zaehle(a) !== 1 || zaehle(e) !== 1) {
    throw new Error(`${datei}: Marke ${a} oder ${e} fehlt oder steht mehrfach (gefunden: ${zaehle(a)}x / ${zaehle(e)}x)`);
  }
  const i = text.indexOf(a);
  const j = text.indexOf(e);
  if (j < i) throw new Error(`${datei}: ${e} steht vor ${a}`);
  return text.slice(0, i + a.length) + "\n" + inhalt + "\n" + text.slice(j);
}

// ---------------------------------------------------------------------------
// 5) Zeiten ins HTML schreiben. Ein Clip trägt statt fester Zahlen
//      data-cue="vertrag"            Beginn = ZEIT.vertrag
//      data-cue-versatz="0.6"        (optional) Sekunden dazu
//      data-cue-bis="titelWeg"       (optional) Ende; sonst Ende der Szene
//    und der Bau schreibt data-start/data-duration (relativ zur Szene) dazu.
//    Szenen-Hosts bekommen ihre Zeiten aus SZENEN, die Wurzel ihre Länge aus ZEIT.ende.
// ---------------------------------------------------------------------------
const r3 = (v) => String(Math.round(v * 1000) / 1000);
function setzeAttr(tag, name, wert, datei) {
  const re = new RegExp(`\\s${name}="[^"]*"`);
  if (!re.test(tag)) throw new Error(`${datei}: ${name} fehlt in ${tag.slice(0, 80)}…`);
  return tag.replace(re, ` ${name}="${wert}"`);
}
const attr = (tag, name) => (tag.match(new RegExp(`\\s${name}="([^"]*)"`)) || [])[1];
const zeitVon = (name, datei) => {
  if (!(name in ZEIT)) throw new Error(`${datei}: unbekannter Cue "${name}"`);
  return ZEIT[name];
};

function setzeZeiten(text, datei, basis) {
  let anzahl = 0;
  // Clips mit data-cue
  text = text.replace(/<[a-z][^>]*\sdata-cue="[^"]*"[^>]*>/g, (tag) => {
    const beginn = zeitVon(attr(tag, "data-cue"), datei) + Number(attr(tag, "data-cue-versatz") || 0);
    const bis = attr(tag, "data-cue-bis");
    const ende = Math.min(bis ? zeitVon(bis, datei) : basis.ende, basis.ende);
    if (beginn < basis.beginn - 1e-9 || ende - beginn <= 0) {
      throw new Error(`${datei}: Clip ${attr(tag, "id")} liegt außerhalb der Szene (${beginn.toFixed(2)}–${ende.toFixed(2)} s)`);
    }
    anzahl++;
    tag = setzeAttr(tag, "data-start", r3(beginn - basis.beginn), datei);
    return setzeAttr(tag, "data-duration", r3(ende - beginn), datei);
  });
  // Szenen-Hosts (nur in index.html)
  text = text.replace(/<div[^>]*\sdata-composition-src="[^"]*"[^>]*>/g, (tag) => {
    const id = attr(tag, "data-composition-id");
    const szene = SZENEN.find((s) => s.id === id) || { beginn: 0, ende: ZEIT.ende }; // A: Hosts über die volle Länge
    anzahl++;
    tag = setzeAttr(tag, "data-start", r3(szene.beginn), datei);
    return setzeAttr(tag, "data-duration", r3(szene.ende - szene.beginn), datei);
  });
  // Wurzel: Länge des Videos
  text = text.replace(/<div[^>]*\sdata-composition-id="main"[^>]*>/, (tag) => {
    anzahl++;
    return setzeAttr(tag, "data-duration", r3(ZEIT.ende), datei);
  });
  return { text, anzahl };
}

// Welche Datei braucht welche Blöcke, und auf welcher Zeitachse liegt sie?
const GANZ = { beginn: 0, ende: ZEIT.ende };
const szene = (id) => SZENEN.find((s) => s.id === id);
const ZIELE = {
  "a-buehne/index.html": { bloecke: [], basis: GANZ },
  "a-buehne/compositions/buehne.html": { bloecke: ["welt", "schriften", "marker", "buehne", "daten", "drehbuch"], basis: GANZ },
  "a-buehne/compositions/hud.html": { bloecke: ["schriften", "daten"], basis: GANZ },
  "b-wurzel/index.html": { bloecke: ["welt", "schriften", "marker", "buehne", "daten", "drehbuch"], basis: GANZ },
  "b-wurzel/compositions/start.html": { bloecke: ["schriften", "marker", "daten"], basis: szene("start") },
  "b-wurzel/compositions/flug.html": { bloecke: ["schriften", "daten"], basis: szene("flug") },
  "b-wurzel/compositions/ziel.html": { bloecke: ["schriften", "marker", "daten"], basis: szene("ziel") },
  // A+ (Empfehlung): Bühne wie A, HUD je Szene wie B
  "c-aplus/index.html": { bloecke: [], basis: GANZ },
  "c-aplus/compositions/start.html": { bloecke: ["schriften", "daten"], basis: szene("start") },
  "c-aplus/compositions/flug.html": { bloecke: ["schriften", "daten"], basis: szene("flug") },
  "c-aplus/compositions/ziel.html": { bloecke: ["schriften", "daten"], basis: szene("ziel") },
};
for (const [ziel, { bloecke, basis }] of Object.entries(ZIELE)) {
  const datei = path.join(SPIKE, ziel);
  if (!fs.existsSync(datei)) throw new Error("Zieldatei fehlt: " + ziel);
  let t = fs.readFileSync(datei, "utf8");
  for (const name of bloecke) t = setzeEin(t, ziel, name); // Reihenfolge: welt vor schriften (welt bringt die Schrift-Marke mit)
  const z = setzeZeiten(t, ziel, basis);
  fs.writeFileSync(datei, z.text);
  console.log("geschrieben:", ziel, Math.round(z.text.length / 1024) + " KB,", bloecke.length, "Blöcke,", z.anzahl, "Zeiten");
}
// A+ nutzt dieselbe Bühne wie A: kopieren statt doppelt pflegen.
fs.copyFileSync(path.join(SPIKE, "a-buehne/compositions/buehne.html"), path.join(SPIKE, "c-aplus/compositions/buehne.html"));
console.log("kopiert: a-buehne/compositions/buehne.html -> c-aplus/compositions/buehne.html");

console.log("Karte:", Math.round(karte.length / 1024) + " KB SVG-Pfade");
console.log("Zeiten:", JSON.stringify(ZEIT));
console.log("Orte:", JSON.stringify(orte), "Route-Kontrollpunkt:", route.c);
console.log("Kamera:", JSON.stringify(kamera));
console.log("Bild:", JSON.stringify(bild));
