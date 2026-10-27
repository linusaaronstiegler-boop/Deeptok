// Bau-Skript des Goldstandards "Opportunitätskosten" (Bauweise A+ aus dem Bühnen-Spike).
//
//   node build/bauen.mjs                 (aus studio/gold-opportunitaetskosten/)
//   node build/bauen.mjs --ohne-messen   (ohne die Textbreiten-Prüfung im Browser)
//
// Was es tut, in dieser Reihenfolge:
//   1. ZEITEN: liest assets/timing.json (geschrieben von build/voice.py). Jeder Cue ist der
//      Anfang eines gesprochenen Worts. Das Bild setzt 2 Bilder (67 ms) davor ein
//      (DESIGN.md §9 "Titel-Timing"). Daraus leitet ableiten() alle weiteren Zeiten ab.
//      pruefeZeiten() bricht ab, wenn eine Haltezeit oder Reihenfolge nicht stimmt.
//   2. DATEIEN: lädt Karte (Natural Earth 1:50m), Schriften und GSAP nach build/cache/, prüft
//      jede per SHA-256 und kopiert Schriften und GSAP nach assets/. Das Video lädt zur
//      Laufzeit nichts aus dem Netz.
//   3. KARTE: projiziert Europa (Lambert konform-konisch) in feste Weltkoordinaten.
//   4. EINSETZEN: setzt Blöcke (Welt, Bibliotheken, Daten, Drehbuch) zwischen Marken wie
//      <!-- @atlas:anfang --> ... <!-- @atlas:ende --> in die Kompositionen ein.
//   5. ZEITEN INS HTML: schreibt data-start/data-duration jedes Clips aus data-cue. Keine
//      Zeit steht von Hand im HTML.
//   6. MESSEN: öffnet jede HUD-Szene im Browser (Schriften geladen) und prüft, dass jede
//      Textzeile ins Lesefenster passt (x 108-972, y 168-1330, DESIGN.md §2).

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { geoConicConformal, geoPath, geoGraticule } from "d3-geo";
import { feature, mesh, merge } from "topojson-client";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const PROJEKT = path.resolve(HIER, "..");
const BREITE = 1080;
const HOEHE = 1920;
const FPS = 30;

// ---------------------------------------------------------------------------
// 1) ZEITEN aus der Stimme
// ---------------------------------------------------------------------------
const TIMING = JSON.parse(fs.readFileSync(path.join(PROJEKT, "assets/timing.json"), "utf8"));
const VORLAUF = 2 / FPS; // Bild kommt 2 Bilder vor dem Wort (DESIGN.md §9, vorläufig)
const bild = (t) => Math.round(t * FPS) / FPS; // auf ganze Bilder runden: Player und Render gleich

// WORTE: Cue-Name -> Sekunde, auf der das Bild einsetzt (Wortanfang minus Vorlauf)
export const WORTE = {};
for (const [name, cue] of Object.entries(TIMING.cues)) WORTE[name] = bild(cue.start - VORLAUF);
// Szenenanfänge: erstes Wort jeder Szene (für HUD-Szenen und den Satz "Nur sein Gehalt?")
const SZENEN_WORT = Object.fromEntries(TIMING.scenes.map((s) => [s.id, bild(s.start - VORLAUF)]));
const SZENEN_ENDE = Object.fromEntries(TIMING.scenes.map((s) => [s.id, s.end]));
const DENKPAUSE = TIMING.pausen.find((p) => p.art === "denkpause");

// Physik der Darsteller (Bildpixel und Sekunden), DESIGN.md §5 "Eintritte je Identität".
// Konstanten des Moduls, nie Felder der Spec.
const PHYSIK = {
  fallhoehe: 560, // aus dieser Höhe fällt ein Darsteller auf seinen Platz
  fallzeit: 0.42,
  flughoehe: 130, // Reiseflughöhe über der Karte
  steigzeit: 0.45,
  sinkzeit: 0.5,
  flugzeit: 1.7, // Abflug bis Landung
  schrittzeit: 0.5, // vom Boden auf die Schale
};
// Kamerafahrt zwischen zwei Lese-Bildern: gemessen an den Vorbildern 0,4-0,7 s, Median 0,45 s
// (DESIGN.md §5/§9, docs/research/referenz-destillation.md §3.10). Der lange Schwenk von
// München nach Barcelona nimmt die Obergrenze.
const FAHRT = 0.6;
const SCHWENK = 0.7;
const HALTEN = 1.2; // nach jeder Landung mindestens so lange ruhen
const MARKER = { kreis: 0.5, linie: 0.35, strich: 0.3, klammer: 0.5 };

// ---------------------------------------------------------------------------
// ZEITEN, Teil 2: abgeleitet. Kein Wort, sondern Wort + Versatz. Ändern sich die
// Wortzeiten (andere Stimme), wandern diese Zeiten mit.
// ---------------------------------------------------------------------------
function ableiten(w) {
  const z = { anfang: 0, ...w };
  for (const [id, t] of Object.entries(SZENEN_WORT)) z["s_" + id] = t;
  z.ende = bild(TIMING.duration);
  z.pause = DENKPAUSE.start; // Ende der Frage = Anfang der Denkpause
  z.pauseEnde = DENKPAUSE.end;

  // Beat 1-2: Frage
  z.spielerFall = w.lewa;
  z.nameSpieler = w.lewa + PHYSIK.fallzeit;
  z.routeAus = w.verkaufen + 0.8; // Route ist gezeichnet
  z.kreisFigurAus = w.optionen - 0.15; // Kreis macht den Preisschildern Platz
  // Beat 3: Schilder und Titel treten ab, dann Zoom, dann richtet sich die Waage auf
  z.hookAus = w.waage;
  z.zoomIn = w.waage + 0.25;
  z.zoomInEnde = z.zoomIn + FAHRT;
  z.waageAuf = z.zoomInEnde - 0.15; // Nebenbewegung: die Waage wächst, als die Kamera ankommt
  z.spielerHopp = z.waageAuf + 0.45;
  z.belegFall = w.gehalt;
  z.behauptung = w.gehalt + PHYSIK.fallzeit; // "Nur sein Gehalt" erst, wenn der Beleg liegt
  z.stempel = w.bezahlt;
  z.neigungRechts = w.tore;
  z.toreText = w.tore + 0.15;
  // Beat 4: Vertrag
  z.band = w.vertrag + 0.1;
  z.bandEnde = z.band + 1.0;
  // Beat 5: Angebot. Texte treten ab, bevor die Kamera fährt (Kamera steht in der Lesezeit)
  z.vertragAus = w.angebot - 0.3;
  z.fahrtBarcelona = w.angebot;
  z.fahrtBarcelonaEnde = w.angebot + SCHWENK;
  z.geldFall = w.zahl;
  z.geldLandetBcn = w.zahl + PHYSIK.fallzeit;
  z.zahlText = w.zahl + 0.12;
  // Beat 6a: Widerlegung
  z.widerlegung = z.s_widerlegung; // "Nur sein Gehalt?" kommt zurück, wenn es gesprochen wird
  z.abflugGeld = w.landung - PHYSIK.flugzeit; // der Bau rechnet die Flugzeit zurück
  // Die Kamera folgt dem Geld nach München und steht 0,15 s vor der Landung.
  z.fahrtMuenchen = Math.max(z.abflugGeld + 0.25, w.falsch + MARKER.strich + HALTEN);
  z.fahrtMuenchenEnde = w.landung - 0.15;
  z.zahlTextAus = z.abflugGeld;
  z.geldEtikett = w.landung + 0.12;
  // Beat 6b, 7, 8
  z.etikettEntgangen = w.entgangen;
  z.etikettAufgegeben = w.aufgibt;
  z.julAus = w.juli; // Begriff, "beste Alternative", "aufgegeben", Kreis treten ab
  z.datumJuli = w.juli + 0.2;
  z.neigungLinks = w.genommen;
  z.abflugSpieler = w.ok_verkauf; // Abflug auf "Opportunitätskosten" (Landung liegt außerhalb des Bildes)
  z.landungSpieler = w.ok_verkauf + PHYSIK.flugzeit;
  z.okEtikett = w.ok_verkauf + 0.45; // Nebenbewegung: erst, wenn die Schale frei ist
  z.saisonText = w.landung_spieler;
  // Beat 9-12: Diagramm
  z.schnitt = w.modell;
  z.kaesten = w.modell + 0.15;
  z.gleichung = w.modell + 0.6;
  z.karteFall = w.karte;
  z.neigungKarte = w.karte + PHYSIK.fallzeit;
  z.lohnZeichnen = w.lohn_da;
  z.lohnFlug = w.lohn;
  z.lohnFlugEnde = w.lohn + 0.6;
  z.lohnKreis = w.lohn + 0.65;
  z.nachhilfeAus = z.s_satz;
  z.gratisAus = z.s_satz;
  return z;
}
export const ZEIT = ableiten(WORTE);

// Prüfungen: Lieber beim Bau abbrechen als ein Video mit zu kurzen Haltezeiten rendern.
// Kommt eine schnellere Stimme (Casting-Sieger), fallen Engpässe hier auf, vor dem Rendern.
function pruefeZeiten(z) {
  const fehler = [];
  const mindestens = (was, ist, soll) => {
    if (ist < soll - 1e-6) fehler.push(`${was}: ${ist.toFixed(2)} s < ${soll} s`);
  };
  mindestens("Frage steht in den ersten 8 s (8 - Ende der Frage)", 8 - z.pause, 0);
  mindestens("Denkpause", z.pauseEnde - z.pause, 1.5);
  mindestens("Kreis um die Figur steht fertig", z.kreisFigurAus - (z.behalten + MARKER.kreis), HALTEN);
  mindestens("Zoom endet, bevor der Beleg fällt", z.belegFall - z.zoomInEnde, 0);
  mindestens("Spieler steht auf der Schale, bevor die Waage kippt", z.neigungRechts - (z.spielerHopp + PHYSIK.schrittzeit), HALTEN);
  mindestens("Band läuft ab, bevor der Kreis um das Datum kommt", z.saison - z.bandEnde, 0);
  mindestens("Kreis um 30.06.2023 steht fertig", z.verlaengern - (z.saison + MARKER.kreis), HALTEN);
  mindestens("'ablösefrei: 0 €' steht vor der Kamerafahrt", z.vertragAus - z.frei, HALTEN);
  mindestens("Kamera steht in Barcelona, bevor das Geld fällt", z.geldFall - z.fahrtBarcelonaEnde, 0);
  mindestens("Geld ruht in Barcelona (Halten)", z.abflugGeld - z.geldLandetBcn, HALTEN);
  mindestens("Durchstrich steht, bevor die Kamera fährt", z.fahrtMuenchen - (z.falsch + MARKER.strich), HALTEN);
  mindestens("Kamerafahrt nach München dauert", z.fahrtMuenchenEnde - z.fahrtMuenchen, 0.9);
  mindestens("Geld ruht auf der Schale, bevor die Waage nach links kippt", z.neigungLinks - z.landung, HALTEN);
  mindestens("'entgangen' steht vor der Korrektur", z.korrektur - z.entgangen, HALTEN);
  mindestens("Korrigiertes Schild steht vor dem Begriff", z.begriff - z.korrektur, HALTEN);
  mindestens("Kreis um den Stapel steht fertig", z.julAus - (z.begriff + MARKER.kreis), HALTEN);
  mindestens("Etikett 'Opportunitätskosten' steht vor dem Schnitt", z.schnitt - z.okEtikett, 2.0);
  mindestens("'1 Saison' steht vor dem Schnitt", z.schnitt - z.saisonText, HALTEN);
  mindestens("Kinokarte ruht vor dem Lohn", z.lohnFlug - (z.karteFall + PHYSIK.fallzeit), HALTEN);
  mindestens("Kreis um die Lohntüte steht fertig", z.gratis - (z.lohnKreis + MARKER.kreis), HALTEN);
  mindestens("Letzte Zeile hält", z.ende - z.rechnung, 2.0);
  if (fehler.length) throw new Error("Zeiten verletzen das Kit:\n  " + fehler.join("\n  "));
}
pruefeZeiten(ZEIT);

// HUD-Szenen: eine Sub-Komposition je Szene des Skripts. Grenze = erstes Wort der Szene
// minus 0,25 s, damit Eintritte mit Vorlauf noch in ihrer Szene liegen. Ausnahme "modell":
// Die Szene beginnt mit dem harten Schnitt auf "Waage", davor ist noch die Karte zu sehen.
const SZENEN_IDS = TIMING.scenes.map((s) => s.id);
const anfangVon = (id, i) => (i === 0 ? 0 : id === "modell" ? ZEIT.schnitt : bild(SZENEN_WORT[id] - 0.25));
export const SZENEN = SZENEN_IDS.map((id, i) => ({ id, beginn: anfangVon(id, i) })).map((s, i, a) => ({
  ...s,
  ende: i + 1 < a.length ? a[i + 1].beginn : ZEIT.ende,
}));
// Die Atlas-Bühne endet mit dem Schnitt, die Diagramm-Bühne beginnt dort.
const BUEHNEN = { atlas: { beginn: 0, ende: ZEIT.schnitt }, diagramm: { beginn: ZEIT.schnitt, ende: ZEIT.ende } };

// ---------------------------------------------------------------------------
// 2) DATEIEN laden (nur beim Bau), mit Prüfsumme.
//    In .tmp schreiben, prüfen, umbenennen: Sonst bliebe eine abgeschnittene Datei
//    (Abbruch beim Schreiben) für immer im Cache.
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
    throw new Error(`Prüfsumme falsch für ${url}\n  erwartet ${soll}\n  bekommen ${ist}\n` +
      `Die Quelle hat sich geändert. Neue Version ansehen und die Prüfsumme in build/bauen.mjs anpassen.`);
  }
  fs.writeFileSync(ziel + ".tmp", buf);
  fs.renameSync(ziel + ".tmp", ziel);
  return ziel;
}

// Kopiert eine geprüfte Datei nach assets/ und prüft die Kopie noch einmal: Liegt dort eine
// veränderte Datei (von Hand bearbeitet, halb geschrieben), fällt es hier auf.
function kopiereNachAssets(quelle, ziel, soll) {
  const z = path.join(PROJEKT, "assets", ziel);
  fs.mkdirSync(path.dirname(z), { recursive: true });
  if (!fs.existsSync(z) || sha256(fs.readFileSync(z)) !== soll) fs.copyFileSync(quelle, z);
  if (sha256(fs.readFileSync(z)) !== soll) throw new Error(`assets/${ziel}: Prüfsumme falsch nach dem Kopieren`);
}

const KARTE_SHA = "04342cdc1e3016bcd7db1630de95684d67b79fe3c8c460321e87aef469502394";
const KARTE_DATEI = await hole("countries-50m.json", `${JSDELIVR}/world-atlas@2.0.2/countries-50m.json`, KARTE_SHA);

// GSAP lokal statt vom CDN: Die App spielt das Video auch offline (VIDEO-PIPELINE §7).
const GSAP = { datei: "gsap.min.js", url: `${JSDELIVR}/gsap@3.14.2/dist/gsap.min.js`,
  sha: "c174bfce53a729418d57a8ad8625e7247c793a22fef8e2851e3cfa3de9cd8280" };
kopiereNachAssets(await hole(GSAP.datei, GSAP.url, GSAP.sha), "gsap.min.js", GSAP.sha);

// Schriften lokal (OFL). Eigene Familiennamen ("DT ..."): Der Live-Player lädt keine
// fremden Schriften (Spike, Befund 1); so ist klar, welche Datei gemeint ist.
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
for (const f of SCHRIFTEN) {
  kopiereNachAssets(await hole(`fonts/${f.datei}`, `${JSDELIVR}/@fontsource/${f.paket}/files/${f.datei}`, f.sha), `fonts/${f.datei}`, f.sha);
}
for (const f of LIZENZEN) {
  kopiereNachAssets(await hole(`fonts/${f.datei}`, `${JSDELIVR}/@fontsource/${f.paket}/LICENSE`, f.sha), `fonts/${f.datei}`, f.sha);
}
const schriftenCss = SCHRIFTEN.map(
  (f) => `@font-face { font-family: "${f.familie}"; src: url("assets/fonts/${f.datei}") format("woff2"); font-weight: ${f.gewicht}; font-style: normal; font-display: block; }`,
).join("\n");

// ---------------------------------------------------------------------------
// 3) KARTE: 1 Welteinheit = 1 Bildpixel bei Zoom 1. Lambert konform-konisch mit
//    Standardparallelen 40° und 56° N, Mitte 9° O / 47° N (wie amtliche EU-Karten).
//    50m-Daten: Der Zoom bleibt <= 2,4 (DESIGN.md §7: 10m erst ab Zoom 2,5).
// ---------------------------------------------------------------------------
const welt = JSON.parse(fs.readFileSync(KARTE_DATEI, "utf8"));
const laender = welt.objects.countries;
const basisProjektion = () => geoConicConformal().parallels([40, 56]).rotate([-9, 0]).center([0, 47]).scale(2800).translate([0, 0]);
// Alles außerhalb dieses Rechtecks sieht die Kamera nie: weg damit (kleinere Datei).
const projektion = basisProjektion().clipExtent([[-900, -1250], [800, 1500]]);

// Eigener "Zeichenkontext" für d3-geo: sammelt die Pfade als SVG-Text, rundet auf 0,1 und
// lässt Punkte weg, die näher als 0,8 Einheiten am vorigen liegen (bei Zoom 2,4 knapp 2 px).
function sammler(minAbstand = 0.8) {
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
      // relative Befehle sind kürzer; gerechnet wird mit gerundeten Absolutwerten
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
const nachId = (id) => {
  const g = laender.geometries.find((x) => x.id === id);
  if (!g) throw new Error("Land fehlt in der Karte: " + id);
  return g;
};
const landPfad = pfad(merge(welt, laender.geometries));
const grenzenPfad = pfad(mesh(welt, laender, (a, b) => a !== b));
const netzPfad = pfad(geoGraticule().step([5, 5])());
const deutschlandPfad = pfad(feature(welt, nachId("276"))); // ISO 3166 numerisch: 276 = DE

// Die Küste ist der Rand der Landfläche: #w-land bekommt Füllung UND Strich.
// data-strich: render() setzt die Strichbreite jedes Bild auf Breite / Zoom (bildschirmkonstant).
const karte = [
  `<path id="w-land" data-strich="1.5" d="${landPfad}"/>`,
  `<path id="w-netz" data-strich="1" d="${netzPfad}"/>`,
  `<path id="w-grenzen" data-strich="1.1" d="${grenzenPfad}"/>`,
  `<g id="w-hl-de" class="w-hl" data-spur="hlDe"><path class="w-hl-flaeche" d="${deutschlandPfad}"/>` +
    `<path class="w-hl-schein" data-strich="14" d="${deutschlandPfad}"/><path class="w-hl-rand" data-strich="2" d="${deutschlandPfad}"/></g>`,
  `<path id="w-route" data-strich="5" data-strich-muster="2 16" d=""/>`,
].join("\n        ");

// ---------------------------------------------------------------------------
// ORTE, ROUTE, KAMERA
// ---------------------------------------------------------------------------
const roh = basisProjektion();
const rund = (p) => p.map((v) => Math.round(v * 10) / 10);
const STAEDTE = { muenchen: [11.576, 48.137], barcelona: [2.17, 41.387] };
// Ländernamen: Ort des Schriftzugs (Länge, Breite), von Hand in freie Kartenteile gelegt
const LAENDER = {
  frankreich: { name: "FRANKREICH", lage: [2.0, 47.6] },
  spanien: { name: "SPANIEN", lage: [-4.2, 40.0] },
  italien: { name: "ITALIEN", lage: [12.8, 42.6] },
};
const orte = {};
for (const [id, lage] of Object.entries(STAEDTE)) orte[id] = rund(roh(lage));
for (const [id, l] of Object.entries(LAENDER)) orte[id] = rund(roh(l.lage));
const laenderHtml = Object.entries(LAENDER)
  .map(([id, l]) => `<div id="w-land-${id}" class="w-anker" data-anker="ort:${id}"><div class="w-rand w-mitte" data-bis-zoom="1.9"><div class="w-land-name">${l.name}</div></div></div>`)
  .join("\n  ");

// Route München -> Barcelona als leichter Bogen (Weg des Spielers; das Geld fliegt sie
// rückwärts). Als Punktliste in Weltkoordinaten, damit render() ein Teilstück zeichnen kann.
function routePunkte(p0, p2, bogen, n) {
  const mitte = [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2];
  const dx = p2[0] - p0[0];
  const dy = p2[1] - p0[1];
  const c = [mitte[0] - dy * bogen, mitte[1] + dx * bogen];
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    pts.push(rund([(1 - s) ** 2 * p0[0] + 2 * (1 - s) * s * c[0] + s * s * p2[0], (1 - s) ** 2 * p0[1] + 2 * (1 - s) * s * c[1] + s * s * p2[1]]));
  }
  return pts;
}
const route = routePunkte(orte.muenchen, orte.barcelona, -0.12, 60);

// Kamera-Einstellung: "Ort P soll bei Zoom Z an Bildpunkt (bx, by) stehen". Daraus folgt der
// Weltpunkt in der Bildmitte. So spricht der Kamera-Vertrag: benannte Einstellungen.
function einstellung(p, bx, by, zoom) {
  return { kx: Math.round((p[0] - (bx - BREITE / 2) / zoom) * 10) / 10, ky: Math.round((p[1] - (by - HOEHE / 2) / zoom) * 10) / 10, zoom };
}
const FUSS = [540, 1080]; // Fußpunkt der Waage im Bild (Atlas: dort steht München; Diagramm: fest)
const kamera = {
  // totale:europa: München oben rechts (Figur neben der Schlagzeile), Barcelona links unten
  totale: einstellung(orte.muenchen, 780, 640, 1.15),
  // nah:muenchen: Fuß der Waage auf München, Waage füllt das Lesefenster
  muenchen: einstellung(orte.muenchen, FUSS[0], FUSS[1], 2.4),
  // nah:barcelona: der Stapel fällt auf Barcelona, darüber Platz für "45 Mio. €"
  barcelona: einstellung(orte.barcelona, 420, 1080, 2.4),
};

// Waage: Maße in Bildpixeln relativ zum Fuß. Gleiche Maße in Atlas und Diagramm, damit der
// harte Schnitt (Beat 9) ein Passschnitt ist: dieselbe Waage, andere Zeichnung.
const WAAGE = {
  saeule: 500, // Fuß bis Drehpunkt
  arm: 270, // Drehpunkt bis Haken
  kette: 360, // Haken bis Schalenrand
  schale: 340, // Breite der Schale
  front: 66, // Höhe der Schalen-Vorderseite (trägt "Kosten" / "Nutzen")
  neigung: 7, // Grad: es gibt nur rechts, waagerecht, links (drehbuch.md "Warum eine Waage")
};

const DATEN_ATLAS = { orte, route, kamera, breite: BREITE, hoehe: HOEHE, physik: PHYSIK, marker: MARKER,
  waage: { ...WAAGE, ort: "muenchen" } };
const DATEN_DIAGRAMM = { orte: {}, breite: BREITE, hoehe: HOEHE, physik: PHYSIK, marker: MARKER,
  waage: { ...WAAGE, fuss: FUSS } };

// ---------------------------------------------------------------------------
// Darsteller-Grafiken (SVG). Licht nur über Deckkraft von Palettenfarben: Grundton,
// darüber Navy als Schatten und Creme als Licht. So entsteht kein Ton außerhalb von
// DESIGN.md §4, und die Gegenstände sehen trotzdem beleuchtet aus.
// ---------------------------------------------------------------------------
function muenzen() {
  // 10 Münzen, leicht versetzt wie von Hand gestapelt; Fuß bei (0,0), 288 px hoch.
  const versatz = [0, 3, -2, 4, -3, 2, -1, 3, -2, 1];
  const rx = 64;
  const ry = 20;
  const dicke = 24.8;
  const teile = [
    `<defs>`,
    `<linearGradient id="g-rand" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0E1726" stop-opacity="0.55"/>` +
      `<stop offset="0.35" stop-color="#0E1726" stop-opacity="0"/><stop offset="0.5" stop-color="#F5F0E8" stop-opacity="0.18"/>` +
      `<stop offset="0.8" stop-color="#0E1726" stop-opacity="0.3"/><stop offset="1" stop-color="#0E1726" stop-opacity="0.65"/></linearGradient>`,
    `<radialGradient id="g-oben" cx="0.35" cy="0.3" r="0.85"><stop offset="0" stop-color="#F5F0E8" stop-opacity="0.55"/>` +
      `<stop offset="0.5" stop-color="#F5F0E8" stop-opacity="0.08"/><stop offset="1" stop-color="#0E1726" stop-opacity="0.25"/></radialGradient>`,
    `</defs>`,
  ];
  for (let i = 0; i < versatz.length; i++) {
    const cx = versatz[i];
    const cy = -ry - dicke - i * dicke; // Oberseite der Münze i
    const randPfad = `M${cx - rx} ${cy} v${dicke} a${rx} ${ry} 0 0 0 ${2 * rx} 0 v${-dicke} z`;
    teile.push(
      `<path d="${randPfad}" fill="#C9A84C"/><path d="${randPfad}" fill="url(#g-rand)"/>`,
      // Riffelung am Rand: kurze senkrechte Striche (Navy, halb durchsichtig)
      ...Array.from({ length: 11 }, (_, k) => {
        const a = Math.PI * (0.1 + (k / 10) * 0.8);
        const x = cx - Math.cos(a) * rx;
        const y = cy + Math.sin(a) * ry;
        return `<path d="M${x.toFixed(1)} ${(y + 3).toFixed(1)} v${(dicke - 6).toFixed(1)}" stroke="#0E1726" stroke-opacity="0.32" stroke-width="2" stroke-linecap="round"/>`;
      }),
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#C9A84C"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#g-oben)"/>`,
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#0E1726" stroke-opacity="0.35" stroke-width="1.5"/>`,
      // Lichtkante oben links auf jeder Münze
      `<path d="M${cx - rx + 7} ${cy - 3} q ${rx * 0.5} ${-ry * 0.95} ${rx * 1.15} ${-ry * 0.9}" fill="none" stroke="#F5F0E8" stroke-opacity="0.7" stroke-width="2" stroke-linecap="round"/>`,
    );
  }
  // oberste Münze: Prägung (Ring + €-Zeichen, Navy halb durchsichtig)
  const cx = versatz[versatz.length - 1];
  const cy = -ry - dicke - (versatz.length - 1) * dicke;
  teile.push(
    `<ellipse cx="${cx}" cy="${cy}" rx="46" ry="14" fill="none" stroke="#0E1726" stroke-opacity="0.35" stroke-width="2.5"/>`,
    `<text x="${cx}" y="${cy + 9}" text-anchor="middle" font-family="DT Playfair, serif" font-weight="900" font-size="34" fill="#0E1726" fill-opacity="0.4" transform="translate(0 ${cy}) scale(1 0.6) translate(0 ${-cy})">€</text>`,
  );
  return teile.join("");
}

function spielfigur() {
  // Spielfigur (Halma/Mensch-ärgere-dich-nicht): Creme, Licht von links oben. Fuß bei (0,0),
  // 300 px hoch. Kein Porträt eines echten Menschen (kein Foto, kein KI-Bild).
  const koerper = "M-74 -14 C-74 -40 -44 -52 -38 -78 C-30 -120 -22 -160 -20 -196 L20 -196 C22 -160 30 -120 38 -78 C44 -52 74 -40 74 -14 Z";
  const kragen = "M-46 -196 C-46 -210 46 -210 46 -196 C46 -184 -46 -184 -46 -196 Z";
  return [
    `<defs>`,
    `<linearGradient id="g-figur" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0E1726" stop-opacity="0.05"/>` +
      `<stop offset="0.38" stop-color="#F5F0E8" stop-opacity="0.35"/><stop offset="0.7" stop-color="#0E1726" stop-opacity="0.28"/>` +
      `<stop offset="1" stop-color="#0E1726" stop-opacity="0.6"/></linearGradient>`,
    `<radialGradient id="g-kopf" cx="0.35" cy="0.32" r="0.75"><stop offset="0" stop-color="#F5F0E8" stop-opacity="0.6"/>` +
      `<stop offset="0.55" stop-color="#0E1726" stop-opacity="0.05"/><stop offset="1" stop-color="#0E1726" stop-opacity="0.55"/></radialGradient>`,
    `</defs>`,
    `<ellipse cx="0" cy="-14" rx="76" ry="16" fill="#F5F0E8"/><ellipse cx="0" cy="-14" rx="76" ry="16" fill="#0E1726" fill-opacity="0.35"/>`,
    `<path d="${koerper}" fill="#F5F0E8"/><path d="${koerper}" fill="url(#g-figur)"/>`,
    `<path d="${kragen}" fill="#F5F0E8"/><path d="${kragen}" fill="url(#g-figur)"/>`,
    `<circle cx="0" cy="-246" r="52" fill="#F5F0E8"/><circle cx="0" cy="-246" r="52" fill="url(#g-kopf)"/>`,
    // Lichtkanten links (Creme, voll) und Konturen rechts (Navy): plastisch statt flach
    `<path d="M-62 -36 C-52 -56 -38 -64 -34 -86 C-28 -122 -22 -160 -18 -192" fill="none" stroke="#F5F0E8" stroke-width="3" stroke-linecap="round"/>`,
    `<path d="M-30 -268 A 40 40 0 0 1 10 -290" fill="none" stroke="#F5F0E8" stroke-width="4" stroke-linecap="round"/>`,
  ].join("");
}

// ---------------------------------------------------------------------------
// 4) EINSETZEN. Für jede Zieldatei steht fest, welche Blöcke sie braucht. Fehlt eine
//    Marke (oder ist sie verschrieben), bricht der Bau ab.
// ---------------------------------------------------------------------------
const lies = (p) => fs.readFileSync(path.join(PROJEKT, p), "utf8");
function ersetzePlatzhalter(text, marke, inhalt, datei) {
  if (!text.includes(marke)) throw new Error(`Platzhalter ${marke} fehlt in ${datei}`);
  return text.replace(marke, () => inhalt);
}
const ohneKopfKommentar = (t) => t.replace(/^<!--[\s\S]*?-->\n/, ""); // Erklär-Kommentar nicht in jede Datei kopieren
let atlasFragment = ohneKopfKommentar(lies("lib/atlas.html"));
atlasFragment = ersetzePlatzhalter(atlasFragment, "<!-- @karte -->", karte, "lib/atlas.html");
atlasFragment = ersetzePlatzhalter(atlasFragment, "<!-- @laender -->", laenderHtml, "lib/atlas.html");
atlasFragment = ersetzePlatzhalter(atlasFragment, "<!-- @muenzen -->", muenzen(), "lib/atlas.html");
atlasFragment = ersetzePlatzhalter(atlasFragment, "<!-- @spielfigur -->", spielfigur(), "lib/atlas.html");
const diagrammFragment = ohneKopfKommentar(lies("lib/diagramm.html"));

const datenBlock = (name, daten) =>
  "// eingesetzt von build/bauen.mjs (nicht von Hand ändern)\n" +
  "// WORTE: Wort-Cues aus assets/timing.json (Bild 2 Bilder vor dem Wort). ZEIT: Cues plus abgeleitete Zeiten.\n" +
  `const WORTE = ${JSON.stringify(WORTE)};\n` +
  `const ZEIT = ${JSON.stringify(ZEIT)};\n` +
  `const SZENEN = ${JSON.stringify(SZENEN)};\n` +
  `const BUEHNEN = ${JSON.stringify(BUEHNEN)};\n` +
  (daten ? `const DATEN = ${JSON.stringify(daten)};\n` : "");

const BLOECKE = {
  atlas: { art: "html", inhalt: atlasFragment },
  diagramm: { art: "html", inhalt: diagrammFragment },
  schriften: { art: "js", inhalt: schriftenCss }, // CSS-Kommentar /* */ wie bei JS
  marker: { art: "js", inhalt: lies("lib/marker.js") },
  buehne: { art: "js", inhalt: lies("lib/buehne.js") },
  daten: { art: "js", inhalt: datenBlock("hud", null) },
  datenAtlas: { art: "js", inhalt: datenBlock("atlas", DATEN_ATLAS) },
  datenDiagramm: { art: "js", inhalt: datenBlock("diagramm", DATEN_DIAGRAMM) },
  drehbuchAtlas: { art: "js", inhalt: lies("build/drehbuch-atlas.js") },
  drehbuchDiagramm: { art: "js", inhalt: lies("build/drehbuch-diagramm.js") },
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
// 5) ZEITEN INS HTML. Ein Clip trägt statt fester Zahlen
//      data-cue="vertrag"            Beginn = ZEIT.vertrag
//      data-cue-versatz="0.6"        (optional) Sekunden dazu
//      data-cue-bis="vertragAus"     (optional) Ende; sonst Ende der Szene
//    und der Bau schreibt data-start/data-duration (relativ zur Szene) dazu.
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
  text = text.replace(/<[a-z][^>]*\sdata-cue="[^"]*"[^>]*>/g, (tag) => {
    const beginn = Math.max(basis.beginn, zeitVon(attr(tag, "data-cue"), datei) + Number(attr(tag, "data-cue-versatz") || 0));
    const bis = attr(tag, "data-cue-bis");
    const ende = Math.min(bis ? zeitVon(bis, datei) + Number(attr(tag, "data-cue-bis-versatz") || 0) : basis.ende, basis.ende);
    if (ende - beginn <= 0) {
      throw new Error(`${datei}: Clip ${attr(tag, "id")} liegt außerhalb der Szene (${beginn.toFixed(2)}–${ende.toFixed(2)} s, Szene ${basis.beginn.toFixed(2)}–${basis.ende.toFixed(2)})`);
    }
    anzahl++;
    tag = setzeAttr(tag, "data-start", r3(beginn - basis.beginn), datei);
    return setzeAttr(tag, "data-duration", r3(ende - beginn), datei);
  });
  // Hosts (nur in index.html): HUD-Szenen aus SZENEN, Bühnen aus BUEHNEN
  text = text.replace(/<div[^>]*\sdata-composition-src="[^"]*"[^>]*>/g, (tag) => {
    const id = attr(tag, "data-composition-id");
    const s = SZENEN.find((x) => x.id === id) || BUEHNEN[id];
    if (!s) throw new Error(`${datei}: Host ${id} hat keine Zeiten`);
    anzahl++;
    tag = setzeAttr(tag, "data-start", r3(s.beginn), datei);
    return setzeAttr(tag, "data-duration", r3(s.ende - s.beginn), datei);
  });
  text = text.replace(/<div[^>]*\sdata-composition-id="main"[^>]*>/, (tag) => {
    anzahl++;
    return setzeAttr(tag, "data-duration", r3(ZEIT.ende), datei);
  });
  // Die Tonspur läuft über die ganze Länge
  text = text.replace(/<audio[^>]*\sid="stimme"[^>]*>/, (tag) => {
    anzahl++;
    return setzeAttr(tag, "data-duration", r3(ZEIT.ende), datei);
  });
  return { text, anzahl };
}

const GANZ = { beginn: 0, ende: ZEIT.ende };
const ZIELE = {
  "index.html": { bloecke: [], basis: GANZ },
  "compositions/atlas.html": { bloecke: ["atlas", "schriften", "marker", "buehne", "datenAtlas", "drehbuchAtlas"], basis: BUEHNEN.atlas },
  "compositions/diagramm.html": { bloecke: ["diagramm", "schriften", "marker", "buehne", "datenDiagramm", "drehbuchDiagramm"], basis: BUEHNEN.diagramm },
};
for (const s of SZENEN) {
  const datei = `compositions/${s.id}.html`;
  const text = lies(datei);
  const bloecke = ["schriften", "daten"];
  if (text.includes("/* @marker:anfang */")) bloecke.push("marker");
  ZIELE[datei] = { bloecke, basis: s };
}
for (const [ziel, { bloecke, basis }] of Object.entries(ZIELE)) {
  const datei = path.join(PROJEKT, ziel);
  if (!fs.existsSync(datei)) throw new Error("Zieldatei fehlt: " + ziel);
  let t = fs.readFileSync(datei, "utf8");
  for (const name of bloecke) t = setzeEin(t, ziel, name); // Reihenfolge: Welt vor Schriften (die Welt bringt die Schrift-Marke mit)
  const z = setzeZeiten(t, ziel, basis);
  fs.writeFileSync(datei, z.text);
  console.log("geschrieben:", ziel.padEnd(32), String(Math.round(z.text.length / 1024)).padStart(4) + " KB,", bloecke.length, "Blöcke,", z.anzahl, "Zeiten");
}

console.log("Szenen:", SZENEN.map((s) => `${s.id} ${s.beginn.toFixed(2)}-${s.ende.toFixed(2)}`).join(" | "));
console.log("Karte:", Math.round(karte.length / 1024) + " KB SVG-Pfade; Orte:", JSON.stringify(orte));
console.log("Kamera:", JSON.stringify(kamera));

// ---------------------------------------------------------------------------
// 6) MESSEN: Passt jede Textzeile der HUD-Szenen ins Lesefenster? Gemessen im Browser mit
//    geladenen Schriften (DESIGN.md §3 "Breite messen, nicht schätzen").
// ---------------------------------------------------------------------------
if (!process.argv.includes("--ohne-messen")) await messeHud();

async function messeHud() {
  // puppeteer-core liegt in der HyperFrames-Installation (kein eigener Download nötig).
  let puppeteer;
  const orte_ = [path.join(HIER, "node_modules"), path.join(process.env.NPM_CONFIG_PREFIX || "/opt/deeptok/node", "lib/node_modules/hyperframes")];
  for (const o of orte_) {
    try {
      puppeteer = createRequire(path.join(o, "package.json"))("puppeteer-core");
      break;
    } catch {
      /* nächster Ort */
    }
  }
  const chrome = process.env.HYPERFRAMES_BROWSER_PATH;
  if (!puppeteer || !chrome) {
    console.log("MESSEN übersprungen: puppeteer-core oder HYPERFRAMES_BROWSER_PATH fehlt (vorher . /opt/deeptok/env.sh)");
    return;
  }
  const browser = await puppeteer.launch({ executablePath: chrome, args: ["--no-sandbox", "--allow-file-access-from-files"] });
  const fehler = [];
  try {
    const seite = await browser.newPage();
    await seite.setViewport({ width: BREITE, height: HOEHE });
    for (const s of SZENEN) {
      const vorlage = lies(`compositions/${s.id}.html`);
      const inhalt = vorlage.replace(/^[\s\S]*?<template>/, "").replace(/<\/template>[\s\S]*$/, "").replace(/<script>[\s\S]*?<\/script>/g, "");
      const html = `<!doctype html><html><head><meta charset="utf-8"><base href="file://${PROJEKT}/"><style>body{margin:0;width:1080px;height:1920px;position:relative;background:#0E1726}</style></head><body>${inhalt}</body></html>`;
      const tmp = path.join(CACHE, "messen.html");
      fs.writeFileSync(tmp, html);
      await seite.goto("file://" + tmp);
      const boxen = await seite.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(['900 124px "DT Playfair"', '600 52px "DT Inter"', '400 34px "DT Inter"'].map((f) => document.fonts.load(f)));
        // Jedes Element mit Text, das selbst ein Clip ist oder in einem Clip liegt
        return Array.from(document.querySelectorAll(".clip, .clip *"))
          .filter((el) => el.childNodes.length && Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim()))
          .filter((el) => !el.closest("[data-mess-frei]"))
          .map((el) => {
            const r = el.getBoundingClientRect();
            return { id: el.id || el.closest("[id]")?.id, text: el.textContent.trim().slice(0, 40), l: r.left, r: r.right, o: r.top, u: r.bottom };
          });
      });
      for (const b of boxen) {
        const fehlt = [];
        if (b.l < 108 - 0.5) fehlt.push(`links ${b.l.toFixed(0)} < 108`);
        if (b.r > 972 + 0.5) fehlt.push(`rechts ${b.r.toFixed(0)} > 972`);
        if (b.o < 168 - 0.5) fehlt.push(`oben ${b.o.toFixed(0)} < 168`);
        if (b.u > 1330 + 0.5) fehlt.push(`unten ${b.u.toFixed(0)} > 1330`);
        if (fehlt.length) fehler.push(`${s.id} #${b.id} "${b.text}": ${fehlt.join(", ")}`);
      }
    }
  } finally {
    await browser.close();
  }
  if (fehler.length) throw new Error("Text außerhalb des Lesefensters (DESIGN.md §2):\n  " + fehler.join("\n  "));
  console.log("Messen: alle HUD-Texte im Lesefenster (x 108-972, y 168-1330)");
}
