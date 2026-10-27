// Seek-Test im Live-Player (<hyperframes-player>).
//
//   npx hyperframes@0.8.206 play a-buehne --port 3103 --no-open   (läuft im Hintergrund)
//   node build/seek-test.mjs 3103 a-buehne/renders/a-buehne.mp4 build/seek-test/a
//
// Frage: Stehen Kamera, Darsteller und Marker nach einem Sprung im Player
// richtig, auch wenn man rückwärts über den harten Schnitt springt?
// Vier Prüfungen je Zeitpunkt, alle fließen in den Exit-Code ein:
//   1. Bild:     Die Bühnenzeit im Player liegt auf dem verlangten Bild n.
//   2. Soll:     Kamera und Darsteller im DOM == buehne.berechne(Bühnenzeit).
//                Ohne diese Prüfung wäre ein eingefrorener Player "gleich mit
//                sich selbst" und der Test grün.
//   3. Pfad:     Zustand nach einer wilden Sprungfolge (vor, zurück, kurz
//                abspielen) == Zustand nach einem einzigen Sprung in frisch
//                geladener Seite.
//   4. Bild-Vergleich: Screenshot des Players gegen Bild n aus dem Render,
//                PSNR >= SCHWELLE_DB. Dazu ein Nebeneinander-Bild zum Ansehen.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright"); // global vorinstalliert

const [port, renderMp4, ausgabe] = process.argv.slice(2);
if (!port || !renderMp4 || !ausgabe) {
  console.error("Aufruf: node build/seek-test.mjs <port> <render.mp4> <ausgabe-ordner>");
  process.exit(2);
}
fs.mkdirSync(ausgabe, { recursive: true });
const BASIS = `http://localhost:${port}`;
const FPS = 30;
// Zeitpunkte als GANZE BILDER, nicht als Sekunden: 7,43 s läge zwischen zwei
// Bildern, und Player und Render würden verschieden runden.
//   96 Kamerafahrt, 140 Kreis steht, 224 letztes Bild vor dem Schnitt,
//   225 erstes Bild nach dem Schnitt, 240 Flug, 345 Zahl mit Unterstreichung
const BILDER = [96, 140, 224, 225, 240, 345];
// Gemessen am 27.10.: intakt >= 31 dB; eingefrorene Kamera 17–21 dB;
// Systemschrift statt DT-Schriften 23,8 dB. 28 dB trennt beides.
const SCHWELLE_DB = 28;

// Eigene Testseite unter derselben Herkunft wie der Player-Server.
const SEITE = `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;background:#000}hyperframes-player{display:block;width:540px;height:960px}</style>
</head><body><hyperframes-player id="p" src="/composition/index.html" muted></hyperframes-player>
<script src="/player.js"></script></body></html>`;

async function oeffne(browser) {
  const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 1 });
  await page.route(`${BASIS}/__seektest`, (r) => r.fulfill({ body: SEITE, contentType: "text/html" }));
  await page.goto(`${BASIS}/__seektest`);
  // warten, bis der Player die Länge kennt und die Bühne gebaut ist
  await page.waitForFunction(() => {
    const p = document.getElementById("p");
    return p && p.duration > 0;
  }, null, { timeout: 60000 });
  const frame = kompositionsFrame(page);
  await frame.waitForFunction(() => !!window.__deeptokBuehne, null, { timeout: 30000 });
  await page.waitForTimeout(800); // Schriften und erstes Bild
  return page;
}

function kompositionsFrame(page) {
  const frame = page.frames().find((f) => f.url().includes("/composition/"));
  if (!frame) throw new Error("Kompositions-iframe nicht gefunden");
  return frame;
}

// Zustand im Kompositions-iframe auslesen: Kamera, Darsteller, Marker, HUD,
// dazu der Soll-Wert aus berechne(t) für dieselbe Bühnenzeit.
async function zustand(page) {
  return kompositionsFrame(page).evaluate(() => {
    const q = (s) => document.querySelector(s);
    const kreis = q("#m-kreis path") || q("#s1-kreis path");
    const linie = q("#m-linie path") || q("#s3-linie path");
    const deck = (el) => (el ? Number(getComputedStyle(el).opacity).toFixed(2) : "-");
    const strich = (el) => (el ? deck(el) + "/" + Number(getComputedStyle(el).strokeDashoffset.replace("px", "")).toFixed(0) : "-");
    const b = window.__deeptokBuehne;
    const t = b.zeit();
    const soll = b.berechne(t);
    const zahlen = (s) => (String(s || "").match(/-?\d+(\.\d+)?/g) || []).map(Number);
    const gleich = (a, c) => {
      const x = zahlen(a);
      const y = zahlen(c);
      return x.length === y.length && x.every((v, i) => Math.abs(v - y[i]) < 0.06);
    };
    const ist = {
      kamera: q("#w-kamera").getAttribute("transform"),
      darsteller: q("#d-huelle").style.transform,
    };
    return {
      t: Number(t.toFixed(4)),
      sollOk: gleich(ist.kamera, soll.kamera) && gleich(ist.darsteller, soll.darsteller),
      soll: { kamera: soll.kamera, darsteller: soll.darsteller },
      zustand: {
        kamera: ist.kamera,
        darsteller: ist.darsteller,
        sichtbar: q("#d-huelle").style.opacity,
        zahl: deck(q("#d-zahl")),
        kreis: deck(q("#m-kreis") || q("#s1-kreis")) + "|" + strich(kreis), // Gruppe (blendet aus) | Strich
        linie: strich(linie),
      },
    };
  });
}

// Auf Bild n springen: (n + 0,25) / 30 landet auf Bild n, egal ob die
// Laufzeit abrundet oder rundet.
async function springe(page, n) {
  await page.evaluate((t) => document.getElementById("p").seek(t), (n + 0.25) / FPS);
  await page.waitForTimeout(350);
}

function renderBild(n, ziel) {
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", renderMp4,
    "-vf", `select=eq(n\\,${n}),scale=540:960`, "-frames:v", "1", ziel]);
}
function psnrWert(a, b) {
  try {
    execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", a, "-i", b, "-lavfi", "psnr=stats_file=" + path.join(ausgabe, "psnr.txt"), "-f", "null", "-"]);
    const zeile = fs.readFileSync(path.join(ausgabe, "psnr.txt"), "utf8");
    return Number((zeile.match(/psnr_avg:([\d.]+|inf)/) || [])[1]);
  } catch {
    return NaN;
  }
}

const browser = await chromium.launch();
const ergebnis = [];
try {
  // (1) Referenz: pro Zeitpunkt frisch laden und genau einmal springen
  const referenz = {};
  for (const n of BILDER) {
    const page = await oeffne(browser);
    await springe(page, n);
    referenz[n] = (await zustand(page)).zustand;
    await page.close();
  }

  // (2) Wilde Folge in EINER Seite: vor, zurück über den Schnitt, kurz abspielen, ...
  const page = await oeffne(browser);
  for (const n of [345, 96, 400, 225, 224, 15, 240]) await springe(page, n);
  // kurz echt abspielen und dann wieder springen
  await page.evaluate(() => document.getElementById("p").play());
  await page.waitForTimeout(1200);
  await page.evaluate(() => document.getElementById("p").pause());
  for (const n of [...BILDER].reverse()) {
    await springe(page, n);
    const z = await zustand(page);
    const shot = path.join(ausgabe, `player-${n}.png`);
    const ref = path.join(ausgabe, `render-${n}.png`);
    await page.screenshot({ path: shot, clip: { x: 0, y: 0, width: 540, height: 960 } });
    renderBild(n, ref);
    execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", shot, "-i", ref, "-filter_complex", "hstack=2", path.join(ausgabe, `vergleich-${n}.png`)]);
    const pfadGleich = JSON.stringify(z.zustand) === JSON.stringify(referenz[n]);
    const bildOk = Math.floor(z.t * FPS + 1e-6) === n;
    const psnr = psnrWert(shot, ref);
    ergebnis.push({
      n, t: z.t, bildOk, sollOk: z.sollOk, pfadUnabhaengig: pfadGleich, psnr,
      ok: bildOk && z.sollOk && pfadGleich && psnr >= SCHWELLE_DB,
      ist: z.zustand, soll: z.sollOk ? undefined : z.soll, referenz: pfadGleich ? undefined : referenz[n],
    });
  }
  await page.close();
} finally {
  await browser.close();
}

ergebnis.sort((a, b) => a.n - b.n);
const ja = (b) => (b ? "ja" : "NEIN");
for (const e of ergebnis) {
  console.log(
    `Bild ${e.n} (t=${e.t}s)  Bild richtig: ${ja(e.bildOk)}  Soll: ${ja(e.sollOk)}  pfad-unabhängig: ${ja(e.pfadUnabhaengig)}  ` +
      `PSNR Player/Render: ${e.psnr.toFixed(1)} dB${e.psnr >= SCHWELLE_DB ? "" : " (< " + SCHWELLE_DB + ")"}`,
  );
  console.log("   ist:", JSON.stringify(e.ist));
  if (e.soll) console.log("   soll:", JSON.stringify(e.soll));
  if (e.referenz) console.log("   ref:", JSON.stringify(e.referenz));
}
fs.writeFileSync(path.join(ausgabe, "ergebnis.json"), JSON.stringify(ergebnis, null, 2));
const alleOk = ergebnis.length === BILDER.length && ergebnis.every((e) => e.ok);
console.log(alleOk ? "BESTANDEN" : "DURCHGEFALLEN");
process.exit(alleOk ? 0 : 1);
