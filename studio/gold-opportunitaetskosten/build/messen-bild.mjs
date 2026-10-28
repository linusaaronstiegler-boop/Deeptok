// Misst am laufenden Video im Player (DOM, nicht Pixel), Bild für Bild in festen Schritten:
//
//   1. BILDANTEIL (DESIGN.md §2 "Bild statt Text"): Anteil der Zeit, in der ein Held im Bild ist,
//      der kein Text ist, UND alle sichtbaren Texte zusammen <= 20 % des Lesefensters bedecken.
//      Ziel: >= 50 % (G0/G6).
//   2. LESEFENSTER (Runde 1, Kritik Prüfung 3): JEDER sichtbare Text, auch Etiketten in der Welt
//      (an der Waage, auf Papier), liegt in x 108-972, y 168-1330. Der Bau misst nur das HUD;
//      Welt-Texte bewegen sich mit der Kamera und lassen sich nur im laufenden Video prüfen.
//      Ausgenommen: Bilder, in denen die Kamera fährt (dann wandern Namen kurz über den Rand).
//   3. KOLLISIONEN: Ein HUD-Text (fest) und ein Gegenstand oder Etikett der Welt überdecken sich.
//      Gemeldet wird jede Strecke mit Anfang und Ende, damit man sie im Video findet.
//   4. SCHRIFTGRÖSSE (Runde 2, Prüfung 3): effektive Größe jedes sichtbaren Textes = font-size ×
//      Bildschirm-Maßstab (Breite im Bild / Breite im Layout, so stört das Stauchen beim Aufprall
//      nicht). Mindestens 48 px, Credits 34 px (DESIGN.md §3). Ausgenommen sind Bilder während
//      einer Drehung der Waage (dort stauchen Schild und Schalen absichtlich mit cos).
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
const require_ = createRequire(path.join(process.env.NPM_CONFIG_PREFIX || "/opt/deeptok/node", "lib/node_modules/hyperframes/package.json"));
const puppeteer = require_("puppeteer-core");

const port = process.argv[2] || "3115";
const schritt = Number(process.argv[3] || 0.25);
const BASIS = `http://localhost:${port}`;
const HELDEN = ["#w-waage", "#a-spieler", "#a-geld", "#a-geist", "#a-beleg", "#a-vertrag", "#a-umriss", "#d-waage", "#a-karte", "#a-lohn"];
// Gegenstände der Welt, die ein HUD-Text nicht überdecken soll
const DINGE = ["#a-spieler-bild", "#a-geld-bild", "#a-geist-umriss", "#a-geist-echt", "#a-umriss-bild", "#a-beleg-papier",
  "#a-vertrag-papier", "#w-schild", "#w-schale-l", "#w-schale-r", "#a-karte-bild", "#a-lohn-bild", "#d-rechnung", "#d-fach-svg",
  "#a-schild-1", "#a-schild-2", "#a-schild-3"];
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
    (HELDEN, DINGE, LF, t) => {
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
      // Fährt die Kamera oder die Welt gerade? Dann zählen Namen am Rand nicht (sie blenden aus).
      const fahrt = (() => {
        const a = window.__deeptokAtlas;
        const d = window.__deeptokDiagramm;
        const welt = (b, tl) => {
          if (!b) return false;
          const e1 = b.berechne(tl);
          const e2 = b.berechne(tl + 0.04);
          return Math.abs(e1.k.zoom - e2.k.zoom) > 1e-4 || Math.abs(e1.k.kx - e2.k.kx) > 0.05 || Math.abs(e1.nah.r - e2.nah.r) > 1e-4;
        };
        return welt(a, t) || welt(d, t - (window.__diagrammBeginn || 0));
      })();
      // Dreht sich die Waage gerade? (Spur "dreh" zwischen 0 und 1)
      const dreht = (() => {
        const a = window.__deeptokAtlas;
        if (!a) return false;
        const v = a.berechne(t).spuren.dreh || 0;
        return v > 0.001 && v < 0.999;
      })();
      // Text: jedes Element mit eigenem Textknoten (HTML) und jedes SVG-<text>
      const texte = Array.from(document.querySelectorAll("body *")).filter((el) => {
        if (el.tagName === "text") return true;
        return Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());
      });
      // HUD = alles außerhalb der beiden Bühnen
      const inWelt = (el) => !!el.closest("#w-buehne, #d-buehne");
      let flaeche = 0;
      const raus = [];
      const hud = [];
      const klein = [];
      for (const el of texte) {
        // Abgedunkelte Texte (DESIGN.md §6 "Abdunkeln": 35 %) treten zurück und zählen nicht
        // als Lesetext; alles ab 40 % Deckkraft zählt.
        if (deck(el) < 0.4) continue;
        const r = el.getBoundingClientRect();
        if (!imBild(r)) continue;
        const b = Math.max(0, Math.min(r.right, LF.r) - Math.max(r.left, LF.l));
        const h = Math.max(0, Math.min(r.bottom, LF.u) - Math.max(r.top, LF.o));
        flaeche += b * h;
        const name = el.id || (el.closest("[id]") || {}).id || "?";
        if (r.left < LF.l - 1 || r.right > LF.r + 1 || r.top < LF.o - 1 || r.bottom > LF.u + 1) {
          raus.push(`${name} "${el.textContent.trim().slice(0, 14)}" ${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}`);
        }
        // Für Kollisionen zählen die ZEILEN (wo Schrift steht), nicht der Block: Ein Titel-Block
        // ist 864 px breit, auch wenn "Behalten?" nur halb so weit reicht (Runde 2: die Figur neben
        // dem Titel galt sonst als überdeckt). Fläche (Bildanteil) bleibt beim Block: vorsichtiger.
        if (!inWelt(el)) {
          const zeilen = el.tagName === "text" ? [r] : (() => {
            const rg = document.createRange();
            rg.selectNodeContents(el);
            return Array.from(rg.getClientRects()).filter((z) => z.width > 2 && z.height > 2);
          })();
          for (const z of zeilen) hud.push({ name, r: { l: z.left, o: z.top, r: z.right, u: z.bottom } });
        }
        // Effektive Schriftgröße: Layout-Breite (HTML: offsetWidth, SVG: getBBox) gegen Bildbreite.
        if (!dreht && deck(el) >= 0.9) {
          const layout = el.tagName === "text" ? el.getBBox().width : el.offsetWidth;
          if (layout > 0) {
            const groesse = parseFloat(getComputedStyle(el).fontSize) * (r.width / layout);
            const min = el.closest(".credit") ? 34 : 48;
            if (groesse < min - 0.5) klein.push(`${name} "${el.textContent.trim().slice(0, 14)}" ${groesse.toFixed(1)} px < ${min}`);
          }
        }
      }
      // Kollision: HUD-Text gegen Gegenstand der Welt (mindestens 6 px Überdeckung in beide Richtungen)
      const kollision = [];
      for (const s of DINGE) {
        const el = document.querySelector(s);
        if (!el || deck(el) < 0.3) continue;
        const r = el.getBoundingClientRect();
        if (!imBild(r)) continue;
        const schon = new Set();
        for (const h of hud) {
          const b = Math.min(r.right, h.r.r) - Math.max(r.left, h.r.l);
          const hh = Math.min(r.bottom, h.r.u) - Math.max(r.top, h.r.o);
          if (b > 6 && hh > 6 && !schon.has(h.name)) {
            schon.add(h.name);
            kollision.push(`${h.name}×${s}`);
          }
        }
      }
      return { held, flaeche, raus, kollision, fahrt, klein };
    },
    HELDEN,
    DINGE,
    LESEFENSTER,
    t,
  );
}

// Beginn der Diagramm-Bühne (ihre Zeitachse zählt ab dem Schnitt)
await komp().evaluate(() => {
  const host = document.getElementById("diagramm");
  window.__diagrammBeginn = host ? Number(host.getAttribute("data-start")) : 0;
});

let bild = 0;
let n = 0;
const zeilen = [];
const strecken = {}; // Befund -> [[von, bis], ...]
const merke = (art, was, t) => {
  const k = `${art}: ${was}`;
  const s = (strecken[k] ||= []);
  const letzte = s[s.length - 1];
  if (letzte && t - letzte[1] <= schritt * 1.5) letzte[1] = t;
  else s.push([t, t]);
};
for (let t = 0; t < dauer; t += schritt) {
  const m = await messe(t);
  const istBild = m.held.length > 0 && m.flaeche <= GRENZE;
  if (istBild) bild++;
  n++;
  const tt = Math.round(t * 1000) / 1000;
  zeilen.push({ t: tt, bild: istBild, held: m.held, textanteil: Math.round((m.flaeche / ((LESEFENSTER.r - LESEFENSTER.l) * (LESEFENSTER.u - LESEFENSTER.o))) * 1000) / 10 });
  if (!m.fahrt) for (const r of m.raus) merke("außerhalb Lesefenster", r.replace(/ [\d,-]+$/, ""), tt);
  for (const k of m.kollision) merke("HUD über Gegenstand", k, tt);
  if (!m.fahrt) for (const k of m.klein) merke("Schrift zu klein", k.replace(/ [\d.]+ px < \d+$/, ""), tt);
}
// "Schrift zu klein" in genau EINER Probe ist das Federn eines Stempels (Maßstab 1,6 -> 1 mit
// back.out schwingt kurz unter 1): ein Hinweis, kein Befund. Ab zwei Proben (0,2 s) zählt es.
const kurz = (k, s) => k.startsWith("Schrift zu klein") && s.every(([a, b]) => a === b);
const zeile = ([k, s]) => `${k} @ ${s.map(([a, b]) => (a === b ? `${a}` : `${a}-${b}`)).join(", ")}`;
const befunde = Object.entries(strecken).filter(([k, s]) => !kurz(k, s)).map(zeile);
const hinweise = Object.entries(strecken).filter(([k, s]) => kurz(k, s)).map(zeile);
const ergebnis = {
  schritt_s: schritt,
  proben: n,
  bildanteil_prozent: Math.round((bild / n) * 1000) / 10,
  ohne_held_s: Math.round(zeilen.filter((z) => !z.held.length).length * schritt * 10) / 10,
  zu_viel_text_s: Math.round(zeilen.filter((z) => z.held.length && !z.bild).length * schritt * 10) / 10,
  max_textanteil_prozent: Math.max(...zeilen.map((z) => z.textanteil)),
  befunde,
  hinweise,
  zeilen,
};
fs.mkdirSync(path.join(HIER, "cache"), { recursive: true });
fs.writeFileSync(path.join(HIER, "cache/bildanteil.json"), JSON.stringify(ergebnis, null, 1));
console.log(JSON.stringify({ ...ergebnis, zeilen: undefined, befunde: undefined, hinweise: undefined }));
const luecken = zeilen.filter((z) => !z.bild).map((z) => `${z.t}${z.held.length ? "T" : "-"}`);
console.log("kein Bild bei (T = zu viel Text, - = kein Held):", luecken.join(" "));
console.log(befunde.length ? "Befunde:\n  " + befunde.join("\n  ") : "Befunde: keine (Lesefenster, Kollisionen, Schriftgröße)");
if (hinweise.length) console.log("Hinweise (Federn beim Stempeln, eine Probe):\n  " + hinweise.join("\n  "));
await browser.close();
