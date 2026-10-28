// Karte für die Probe „Atlas Nacht“: Natural Earth 50m (world-atlas@2.0.2), Lambert
// konform-konisch. Genau eine Region leuchtet (studio/DESIGN.md §7 Atlas): erst Spanien, nach der
// Kamerafahrt Deutschland; darum zwei Schein-Ebenen (spanien.svg, deutschland.svg) über der Karte.
// Die Karte ist größer als das Bild (WELT unten): Die Kamera fährt von Barcelona nach München.
// Schreibt probe-atlas-nacht/assets/karte*.svg und karte.json (Bildpunkte in Welt-Koordinaten).
// Aufruf: npm ci --prefix studio/looks/werkzeug && node studio/looks/werkzeug/karte.mjs
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { geoConicConformal, geoPath } from "d3-geo";
import { feature, mesh, merge } from "topojson-client";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const ZIEL = path.join(HIER, "..", "probe-atlas-nacht", "assets");
const CACHE = path.join(HIER, "cache");
const QUELLE = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json";
const SHA = "04342cdc1e3016bcd7db1630de95684d67b79fe3c8c460321e87aef469502394"; // wie im Goldstandard

fs.mkdirSync(CACHE, { recursive: true });
const datei = path.join(CACHE, "countries-50m.json");
if (!fs.existsSync(datei)) fs.writeFileSync(datei, Buffer.from(await (await fetch(QUELLE)).arrayBuffer()));
const roh = fs.readFileSync(datei);
if (crypto.createHash("sha256").update(roh).digest("hex") !== SHA) throw new Error("countries-50m.json: Prüfsumme falsch");
const welt = JSON.parse(roh);
const laender = welt.objects.countries;

// Barcelona liegt bei x = 520, y = 880 (Startbild; so liegen die Balearen nicht unter der Credit-Ecke): links davon Spanien bis über den Bildrand,
// rechts das Mittelmeer. Die Welt reicht nach oben und rechts bis über München hinaus.
const BARCELONA = [2.17, 41.39];
const MUENCHEN = [11.58, 48.14];
const WELT = { x0: -360, y0: -1100, x1: 1980, y1: 2420 };       // Bildpunkte des Startbilds
const projektion = geoConicConformal().parallels([36, 46]).rotate([-3, 0]).center([0, 42]).scale(6000).translate([0, 0]);
const [bx, by] = projektion(BARCELONA);
projektion.translate([520 - bx, 880 - by]).clipExtent([[WELT.x0 - 60, WELT.y0 - 60], [WELT.x1 + 60, WELT.y1 + 60]]);

// Pfade auf 0,1 px gerundet; Punkte, die näher als 1 px am vorigen liegen, fallen weg.
function sammler() {
  let teile = [], lx = 0, ly = 0;
  const r = (v) => Math.round(v * 10) / 10;
  return {
    moveTo(x, y) { x = r(x); y = r(y); teile.push(`M${x} ${y}`); lx = x; ly = y; },
    lineTo(x, y) { x = r(x); y = r(y); if (Math.hypot(x - lx, y - ly) < 1) return; teile.push(`l${r(x - lx)} ${r(y - ly)}`); lx = x; ly = y; },
    closePath() { teile.push("z"); },
    arc() {},
    nimm() { const s = teile.join("").replace(/ -/g, "-"); teile = []; return s; },
  };
}
const ctx = sammler();
const zeichner = geoPath(projektion, ctx);
const pfad = (geo) => { zeichner(geo); return ctx.nimm(); };

const land = pfad(merge(welt, laender.geometries));
const grenzen = pfad(mesh(welt, laender, (a, b) => a !== b));
const spanien = pfad(feature(welt, laender.geometries.find((g) => g.id === "724")));
const deutschland = pfad(feature(welt, laender.geometries.find((g) => g.id === "276")));
// Balearen (für die Credit-Ecke: Credits nie über leuchtenden Küsten, DESIGN.md §3/§6).
const inseln = geoPath(projektion).bounds({ type: "Polygon", coordinates: [[[1.1, 38.6], [1.1, 40.1], [4.4, 40.1], [4.4, 38.6], [1.1, 38.6]]] });

// Farben und Linien aus studio/DESIGN.md §4 (Kartentöne) und §7 (eine Region leuchtet).
const B = WELT.x1 - WELT.x0, H = WELT.y1 - WELT.y0;
const kopf = `<svg xmlns="http://www.w3.org/2000/svg" width="${B}" height="${H}" viewBox="${WELT.x0} ${WELT.y0} ${B} ${H}">`;
const svg = `${kopf}
<rect x="${WELT.x0}" y="${WELT.y0}" width="${B}" height="${H}" fill="#0E1726"/>
<path d="${land}" fill="#222D40" stroke="#5A6880" stroke-width="1.5" stroke-linejoin="round"/>
<path d="${grenzen}" fill="none" stroke="#36435A" stroke-width="1.1" stroke-linejoin="round"/>
</svg>
`;
// Eine Region: Fläche, Schein (unscharf) und Rand. Als eigene Ebene, damit sie ein- und ausgehen kann.
const region = (d) => `${kopf}
<defs><filter id="weich" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter></defs>
<path d="${d}" fill="#2A4069"/>
<path d="${d}" fill="none" stroke="#6F8FC4" stroke-opacity="0.55" stroke-width="14" filter="url(#weich)"/>
<path d="${d}" fill="none" stroke="#9DB2D6" stroke-opacity="0.7" stroke-width="2" stroke-linejoin="round"/>
</svg>
`;
fs.mkdirSync(ZIEL, { recursive: true });
fs.writeFileSync(path.join(ZIEL, "karte.svg"), svg);
fs.writeFileSync(path.join(ZIEL, "karte-spanien.svg"), region(spanien));
fs.writeFileSync(path.join(ZIEL, "karte-deutschland.svg"), region(deutschland));
const r1 = (p) => p.map((v) => Math.round(v * 10) / 10);
fs.writeFileSync(path.join(HIER, "karte.json"), JSON.stringify({
  welt: WELT, barcelona: r1(projektion(BARCELONA)), muenchen: r1(projektion(MUENCHEN)),
  balearen: inseln.map(r1), quelle: QUELLE }, null, 1) + "\n");
console.log("karte.svg", (svg.length / 1024).toFixed(0), "KB, Barcelona bei", projektion(BARCELONA).map(Math.round),
  "München bei", projektion(MUENCHEN).map(Math.round), "Balearen", inseln.map((p) => p.map(Math.round)));
