// Seek-Test (Runde 1, Wunsch aus Prüfung 3): Zeigt der Player an jeder Stelle dasselbe Bild,
// egal wie man dorthin springt? Und zeigt er dasselbe wie das gerenderte MP4?
//
//   . /opt/deeptok/env.sh
//   npx hyperframes play . --port 3115 --no-open &      (aus studio/gold-opportunitaetskosten/)
//   node build/seek-test.mjs 3115 renders/gold.mp4 [ausgabe-ordner]
//
// Zwei Prüfungen je Bild n:
//   1. PFAD-UNABHÄNGIG: Zustand (Kamera, Welt-Hülle, Darsteller, Deckkraft der HUD-Clips,
//      Marker) nach frischem Laden + Sprung auf n  ==  nach einer wilden Sprungfolge (vor,
//      zurück über den Schnitt, kurz abspielen) + Sprung auf n. Muss exakt gleich sein.
//   2. BILDGENAU: Player-Bildschirmfoto gegen Render-Bild n (PSNR). Eine feste Schwelle
//      (Spike: 28 dB) ließ textreiche Standbilder fälschlich durchfallen (Kantenglättung und
//      Schein werden im Player anders gerastert). Darum zählt das NACHBAR-Kriterium: Bild n des
//      Renders muss dem Player-Bild ähnlicher sein als n-1 und n+1. Steht das Bild still (alle
//      drei gleich), gilt nur die Untergrenze von 22 dB.
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
function psnr(a, b) {
  const st = path.join(aus, "psnr.txt");
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", a, "-i", b, "-lavfi", "psnr=stats_file=" + st, "-f", "null", "-"]);
  const z = fs.readFileSync(st, "utf8");
  const w = (z.match(/psnr_avg:([\d.]+|inf)/) || [])[1];
  return w === "inf" ? 99 : Number(w);
}

// Bilder: Anfang, Denkpause, Vertrag, Geld fällt, Flug, Geist, Begriff (Nachfahrt), Drehung,
// Abflug, Schnitt (beidseits), Transfer, Lohn, Nachfahrt im Satz, Ende
const dauer = await (async () => { const p = await oeffne(); const d = await p.evaluate(() => document.getElementById("p").duration); await p.close(); return d; })();
const N = Math.floor(dauer * FPS) - 1;
const schnitt = Math.round(Number(fs.readFileSync("index.html", "utf8").match(/id="diagramm"[^>]*data-start="([\d.]+)"/)[1]) * FPS);
const BILDER = [15, 220, 600, 735, 905, 1000, 1190, 1380, 1450, schnitt - 1, schnitt, 1700, 1795, 1910, N - 5];

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
  const werte = [-1, 0, 1].map((d) => {
    const z = path.join(aus, `render-${n + d}.png`);
    renderBild(n + d, z);
    return psnr(shot, z);
  });
  const [vor, hier, nach] = werte;
  const still = Math.abs(vor - hier) < 0.5 && Math.abs(nach - hier) < 0.5;
  const genau = still ? hier >= UNTERGRENZE_DB : hier >= Math.max(vor, nach) - 0.2 && hier >= UNTERGRENZE_DB;
  erg.push({ bild: n, pfadUnabhaengig: gleich, psnr: werte.map((w) => Math.round(w * 10) / 10), still, bildgenau: genau });
}
await browser.close();
const fehler = erg.filter((e) => !e.pfadUnabhaengig || !e.bildgenau);
fs.writeFileSync(path.join(aus, "ergebnis.json"), JSON.stringify(erg, null, 1));
for (const e of erg.sort((a, b) => a.bild - b.bild)) {
  console.log(`Bild ${String(e.bild).padStart(4)}: Pfad ${e.pfadUnabhaengig ? "gleich" : "VERSCHIEDEN"}, PSNR n-1/n/n+1 ${e.psnr.join(" / ")} dB${e.still ? " (still)" : ""} -> ${e.bildgenau ? "ok" : "NICHT BILDGENAU"}`);
}
console.log(fehler.length ? `${fehler.length} Fehler` : `alle ${erg.length} Bilder seek-sicher und bildgenau`);
process.exit(fehler.length ? 1 : 0);
