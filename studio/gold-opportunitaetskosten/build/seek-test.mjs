// Seek-Test (Runde 1, Wunsch aus Prüfung 3; Runde 2: Vergleich im Änderungs-Rechteck): Zeigt der
// Player an jeder Stelle dasselbe Bild, egal wie man dorthin springt? Und zeigt er dasselbe wie
// das gerenderte MP4?
//
//   . /opt/deeptok/env.sh
//   npx hyperframes play . --port 3115 --no-open &      (aus studio/gold-opportunitaetskosten/)
//   node build/seek-test.mjs 3115 renders/gold.mp4 [ausgabe-ordner]
//
// Zwei Prüfungen je Bild n:
//   1. PFAD-UNABHÄNGIG: Zustand (Kamera, Welt-Hülle, Darsteller, Deckkraft der HUD-Clips,
//      Marker) nach frischem Laden + Sprung auf n  ==  nach einer wilden Sprungfolge (vor,
//      zurück über den Schnitt, kurz abspielen) + Sprung auf n. Muss exakt gleich sein.
//   2. BILDGENAU: Player-Bildschirmfoto gegen Render-Bild n. NACHBAR-Kriterium: Bild n des
//      Renders muss dem Player-Bild ähnlicher sein als n-1 und n+1 (eine feste dB-Schwelle ließ
//      textreiche Standbilder fälschlich durchfallen, denn Kantenglättung wird im Player anders
//      gerastert).
//      Runde 2 (Prüfung 3): Verglichen wird nur im ÄNDERUNGS-RECHTECK, also dort, wo sich der
//      Render zwischen n-1 und n+1 unterscheidet (plus 16 px Rand). Über das ganze Bild gemittelt
//      ging ein zeichnender Durchstrich (ein paar tausend Pixel) im Rauschen unter, und Bild 856
//      galt als "still". Ist das Rechteck leer, steht das Bild wirklich still: Dann gilt nur die
//      Untergrenze von 22 dB über das ganze Bild.
//
// Die Prüfbilder kommen aus den Zeiten des Baus (const ZEIT in compositions/atlas.html): Marker,
// Stempel, Drehung, Abflug, Schnitt, Nachfahrten. So wandern sie mit, wenn die Stimme wechselt.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const require_ = createRequire(path.join(process.env.NPM_CONFIG_PREFIX || "/opt/deeptok/node", "lib/node_modules/hyperframes/package.json"));
const puppeteer = require_("puppeteer-core");
const [port = "3115", mp4 = "renders/gold.mp4", aus = "build/cache/seek"] = process.argv.slice(2);
fs.mkdirSync(aus, { recursive: true });
const BASIS = `http://localhost:${port}`;
const FPS = 30;
const UNTERGRENZE_DB = 22;
const SEITE = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#000}hyperframes-player{display:block;width:1080px;height:1920px}</style></head><body><hyperframes-player id="p" src="/composition/index.html" muted></hyperframes-player><script src="/player.js"></script></body></html>`;

const browser = await puppeteer.launch({ executablePath: process.env.HYPERFRAMES_BROWSER_PATH, args: ["--no-sandbox"] });
async function oeffne() {
  const p = await browser.newPage();
  await p.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  await p.setRequestInterception(true);
  p.on("request", (r) => (r.url() === `${BASIS}/__seek` ? r.respond({ body: SEITE, contentType: "text/html" }) : r.continue()));
  await p.goto(`${BASIS}/__seek`);
  await p.waitForFunction(() => document.getElementById("p")?.duration > 0, { timeout: 90000 });
  const f = p.frames().find((x) => x.url().includes("/composition/"));
  await f.waitForFunction(() => !!window.__deeptokAtlas && !!window.__deeptokDiagramm, { timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1000));
  return p;
}
const komp = (p) => p.frames().find((x) => x.url().includes("/composition/"));
// Mitte des Bildes n (nicht die Kante): So landen Player und Render sicher im selben Bild.
async function springe(p, n) {
  await p.evaluate((t) => document.getElementById("p").seek(t), (n + 0.5) / FPS);
  await new Promise((r) => setTimeout(r, 350));
}
async function zustand(p) {
  return komp(p).evaluate(() => {
    const tr = (e) => (e.getAttribute("transform") || "") + (e.style.transform || "");
    const teile = [];
    for (const sel of ["#w-kamera", "#w-welt", "#d-welt", "#w-balken", "#d-balken", "#w-schild"]) {
      const e = document.querySelector(sel);
      if (e) teile.push(sel + "=" + tr(e));
    }
    for (const e of document.querySelectorAll(".a-huelle")) teile.push(e.id + "=" + tr(e) + "|" + e.style.opacity);
    for (const e of document.querySelectorAll(".clip")) teile.push(e.id + ":" + Number(getComputedStyle(e).opacity).toFixed(2));
    for (const e of document.querySelectorAll("svg path")) {
      const o = getComputedStyle(e).strokeDashoffset;
      if (e.closest("[id$=marker], #m-ebene, #d-marker") && o) teile.push(Number(o.replace("px", "")).toFixed(0));
    }
    return teile.join(";");
  });
}
const renderBild = (n, z) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", mp4, "-vf", `select=eq(n\\,${n})`, "-vsync", "0", "-frames:v", "1", z]);
// Graustufen-Rohbild (1080 × 1920 Bytes) über ffmpeg: kein PNG-Decoder nötig.
const grau = (datei) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", datei, "-f", "rawvideo", "-pix_fmt", "gray", "-"], { maxBuffer: 1 << 26 });
const B = 1080;
const H = 1920;
// Änderungs-Rechteck: wo sich a und b um mehr als 24 Graustufen unterscheiden (mind. 40 Pixel)
function rechteck(a, b) {
  let x0 = B, y0 = H, x1 = -1, y1 = -1, n = 0;
  for (let y = 0; y < H; y++) {
    const z = y * B;
    for (let x = 0; x < B; x++) {
      if (Math.abs(a[z + x] - b[z + x]) > 24) {
        n++;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (n < 40) return null;
  return { x0: Math.max(0, x0 - 16), y0: Math.max(0, y0 - 16), x1: Math.min(B - 1, x1 + 16), y1: Math.min(H - 1, y1 + 16), n };
}
// PSNR (dB) im Rechteck r (ohne r: ganzes Bild)
function psnr(a, b, r) {
  const q = r || { x0: 0, y0: 0, x1: B - 1, y1: H - 1 };
  let s = 0, n = 0;
  for (let y = q.y0; y <= q.y1; y++) {
    const z = y * B;
    for (let x = q.x0; x <= q.x1; x++) {
      const d = a[z + x] - b[z + x];
      s += d * d;
      n++;
    }
  }
  const mse = s / n;
  return mse === 0 ? 99 : 10 * Math.log10((255 * 255) / mse);
}

const dauer = await (async () => { const p = await oeffne(); const d = await p.evaluate(() => document.getElementById("p").duration); await p.close(); return d; })();
const N = Math.floor(dauer * FPS) - 1;
const ZEIT = JSON.parse(fs.readFileSync("compositions/atlas.html", "utf8").match(/const ZEIT = (\{[^\n]*?\});/)[1]);
const schnitt = Math.round(ZEIT.schnitt * FPS);
// [Zeitpunkt, Versatz in s]: mitten in einer Bewegung oder einem Marker, der gerade zeichnet
const MOMENTE = [
  ["anfang", 0.5], ["frage", 0.15], ["pause", 1.2], ["vertragFall", 0.25], ["band", 0.35], ["nahVertrag", 0.25],
  ["frei", 0.1], ["geldFall", 0.2], ["falsch", 0.15], ["falsch", 0.35], ["abflugGeist", 0.9], ["nullBehalten", 0.1],
  ["korrektur", 0.1], ["begriff", 0.25], ["nahRein", 0.25], ["drehStart", 0.2], ["drehStart", 0.45],
  ["abflugSpieler", 0.3], ["abflugSpieler", 0.8], ["fach", 0.1], ["lohnZeichnen", 0.2], ["lohnFall", 0.3],
  ["nahSatz", 0.3], ["puls", 0.1], ["aufgeben", 0.15], ["rechnung", 0.15],
];
const BILDER = [...new Set([
  ...MOMENTE.map(([k, d]) => Math.round((ZEIT[k] + d) * FPS)),
  schnitt - 1, schnitt, N - 5,
])].filter((n) => n > 0 && n < N).sort((a, b) => a - b);

const ref = {};
for (const n of BILDER) {
  const p = await oeffne();
  await springe(p, n);
  ref[n] = await zustand(p);
  await p.close();
}
const p = await oeffne();
for (const n of [N - 5, 300, schnitt, schnitt - 1, 15, 1900, 700, 1300]) await springe(p, n);
await p.evaluate(() => document.getElementById("p").play());
await new Promise((r) => setTimeout(r, 1500));
await p.evaluate(() => document.getElementById("p").pause());

const erg = [];
for (const n of [...BILDER].reverse()) {
  await springe(p, n);
  const gleich = (await zustand(p)) === ref[n];
  const shot = path.join(aus, `player-${n}.png`);
  await p.screenshot({ path: shot, clip: { x: 0, y: 0, width: 1080, height: 1920 } });
  const r = [-1, 0, 1].map((d) => {
    const z = path.join(aus, `render-${n + d}.png`);
    renderBild(n + d, z);
    return grau(z);
  });
  const pl = grau(shot);
  const feld = rechteck(r[0], r[2]);
  const werte = r.map((x) => psnr(pl, x, feld));
  const ganz = psnr(pl, r[1]);
  const [vor, hier, nach] = werte;
  const still = !feld;
  const genau = ganz >= UNTERGRENZE_DB && (still || hier >= Math.max(vor, nach) - 0.2);
  erg.push({ bild: n, t: Math.round((n / FPS) * 100) / 100, pfadUnabhaengig: gleich, feld: feld ? [feld.x0, feld.y0, feld.x1 - feld.x0, feld.y1 - feld.y0] : null,
    psnr: werte.map((w) => Math.round(w * 10) / 10), ganz: Math.round(ganz * 10) / 10, still, bildgenau: genau });
}
await browser.close();
const fehler = erg.filter((e) => !e.pfadUnabhaengig || !e.bildgenau);
fs.writeFileSync(path.join(aus, "ergebnis.json"), JSON.stringify(erg, null, 1));
for (const e of erg.sort((a, b) => a.bild - b.bild)) {
  const wo = e.feld ? ` im Feld ${e.feld[2]}×${e.feld[3]} bei (${e.feld[0]}, ${e.feld[1]})` : " (still, ganzes Bild)";
  console.log(`Bild ${String(e.bild).padStart(4)} (${e.t.toFixed(2)} s): Pfad ${e.pfadUnabhaengig ? "gleich" : "VERSCHIEDEN"}, PSNR n-1/n/n+1 ${e.psnr.join(" / ")} dB${wo}, ganz ${e.ganz} dB -> ${e.bildgenau ? "ok" : "NICHT BILDGENAU"}`);
}
console.log(fehler.length ? `${fehler.length} Fehler` : `alle ${erg.length} Bilder seek-sicher und bildgenau`);
process.exit(fehler.length ? 1 : 0);
