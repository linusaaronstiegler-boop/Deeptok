// Misst am laufenden Video im Player (DOM, nicht Pixel) den Bildanteil (DESIGN.md §2
// "Bild statt Text"): Anteil der Zeit, in der ein Held im Bild ist, der kein Text ist, UND alle
// sichtbaren Texte zusammen <= 20 % des Lesefensters bedecken. Ziel: >= 50 % (G0/G6).
//
//   . /opt/deeptok/env.sh
//   npx hyperframes play . --port 3115 --no-open &      (aus studio/gold-opportunitaetskosten/)
//   node build/messen-bild.mjs 3115 [schritt_s]
//
// Held = eines der Elemente in HELDEN ist sichtbar (Deckkraft > 0,5) und liegt im Bild. Die Karte
// allein ist kein Held (sie ist die Welt), ein Darsteller oder die Waage schon.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const PROJEKT = path.resolve(HIER, "..");
const require_ = createRequire(path.join(process.env.NPM_CONFIG_PREFIX || "/opt/deeptok/node", "lib/node_modules/hyperframes/package.json"));
const puppeteer = require_("puppeteer-core");

const port = process.argv[2] || "3115";
const schritt = Number(process.argv[3] || 0.25);
const BASIS = `http://localhost:${port}`;
const HELDEN = ["#w-waage", "#a-spieler", "#a-geld", "#a-beleg", "#d-waage", "#a-karte", "#a-lohn"];
const LESEFENSTER = { l: 108, r: 972, o: 168, u: 1330 };
const GRENZE = 0.2 * (LESEFENSTER.r - LESEFENSTER.l) * (LESEFENSTER.u - LESEFENSTER.o);

const SEITE = `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;background:#000}hyperframes-player{display:block;width:1080px;height:1920px}</style>
</head><body><hyperframes-player id="p" src="/composition/index.html" muted></hyperframes-player>
<script src="/player.js"></script></body></html>`;

const browser = await puppeteer.launch({ executablePath: process.env.HYPERFRAMES_BROWSER_PATH, args: ["--no-sandbox"] });
const seite = await browser.newPage();
await seite.setViewport({ width: 1080, height: 1920 });
await seite.setRequestInterception(true);
seite.on("request", (r) => (r.url() === `${BASIS}/__messen` ? r.respond({ body: SEITE, contentType: "text/html" }) : r.continue()));
await seite.goto(`${BASIS}/__messen`);
await seite.waitForFunction(() => document.getElementById("p")?.duration > 0, { timeout: 90000 });
const komp = () => seite.frames().find((f) => f.url().includes("/composition/"));
await komp().waitForFunction(() => !!window.__deeptokAtlas && !!window.__deeptokDiagramm, { timeout: 60000 });
await new Promise((r) => setTimeout(r, 1000));
const dauer = await seite.evaluate(() => document.getElementById("p").duration);

async function messe(t) {
  await seite.evaluate((t) => document.getElementById("p").seek(t), t);
  await new Promise((r) => setTimeout(r, 60));
  return komp().evaluate(
    (HELDEN, LF) => {
      // Sichtbarkeit = Produkt der Deckkraft aller Vorfahren (CSS-Deckkraft multipliziert sich)
      const deck = (el) => {
        let d = 1;
        for (let e = el; e && e.nodeType === 1; e = e.parentElement || e.parentNode) {
          const s = getComputedStyle(e);
          if (s.display === "none" || s.visibility === "hidden") return 0;
          d *= Number(s.opacity);
        }
        return d;
      };
      const imBild = (r) => r.right > 0 && r.left < 1080 && r.bottom > 0 && r.top < 1920 && r.width > 0;
      const held = HELDEN.filter((s) => {
        const el = document.querySelector(s);
        if (!el) return false;
        const kinder = el.querySelectorAll("svg, div");
        const r = Array.from(kinder).map((k) => k.getBoundingClientRect()).filter(imBild);
        return deck(el) > 0.5 && r.length > 0;
      });
      // Text: jedes Element mit eigenem Textknoten (HTML) und jedes SVG-<text>
      const texte = Array.from(document.querySelectorAll("body *")).filter((el) => {
        if (el.tagName === "text") return true;
        return Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());
      });
      let flaeche = 0;
      const sichtbar = [];
      for (const el of texte) {
        if (deck(el) < 0.1) continue;
        const r = el.getBoundingClientRect();
        const b = Math.max(0, Math.min(r.right, LF.r) - Math.max(r.left, LF.l));
        const h = Math.max(0, Math.min(r.bottom, LF.u) - Math.max(r.top, LF.o));
        if (b * h > 0) {
          flaeche += b * h;
          sichtbar.push(el.id || el.textContent.trim().slice(0, 16));
        }
      }
      return { held, flaeche, sichtbar };
    },
    HELDEN,
    LESEFENSTER,
  );
}

let bild = 0;
let n = 0;
const zeilen = [];
for (let t = 0; t < dauer; t += schritt) {
  const m = await messe(t);
  const istBild = m.held.length > 0 && m.flaeche <= GRENZE;
  if (istBild) bild++;
  n++;
  zeilen.push({ t: Math.round(t * 100) / 100, bild: istBild, held: m.held, textanteil: Math.round((m.flaeche / ((LESEFENSTER.r - LESEFENSTER.l) * (LESEFENSTER.u - LESEFENSTER.o))) * 1000) / 10 });
}
const ergebnis = {
  schritt_s: schritt,
  proben: n,
  bildanteil_prozent: Math.round((bild / n) * 1000) / 10,
  ohne_held_s: Math.round(zeilen.filter((z) => !z.held.length).length * schritt * 10) / 10,
  zu_viel_text_s: Math.round(zeilen.filter((z) => z.held.length && !z.bild).length * schritt * 10) / 10,
  max_textanteil_prozent: Math.max(...zeilen.map((z) => z.textanteil)),
  zeilen,
};
fs.mkdirSync(path.join(HIER, "cache"), { recursive: true });
fs.writeFileSync(path.join(HIER, "cache/bildanteil.json"), JSON.stringify(ergebnis, null, 1));
console.log(JSON.stringify({ ...ergebnis, zeilen: undefined }));
const luecken = zeilen.filter((z) => !z.bild).map((z) => `${z.t}${z.held.length ? "T" : "-"}`);
console.log("kein Bild bei (T = zu viel Text, - = kein Held):", luecken.join(" "));
await browser.close();
