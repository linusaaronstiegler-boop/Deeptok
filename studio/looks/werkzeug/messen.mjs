// Misst Textbreite und Grundlinie mit den echten Schriften in Chrome (puppeteer-core aus der
// HyperFrames-Installation). Schätzen reicht nicht: Marker müssen genau unter der Zahl liegen,
// und keine Zeile darf breiter als 864 px sein (studio/DESIGN.md §2).
// Eingabe (JSON-Datei): {"schriften":[{familie,gewicht,datei}], "texte":[{schluessel,text,css}]}
//   css = "font-family/-weight/-size/line-height" als CSS-Text, z. B. 'font: 900 173px/1 "DT Playfair"'
// Ausgabe (stdout, JSON): {schluessel: {breite, grundlinie, hoehe}}; grundlinie ab Oberkante der Zeile.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const auftrag = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const require_ = createRequire(path.join(process.env.NPM_CONFIG_PREFIX || "/opt/deeptok/node", "lib/node_modules/hyperframes/package.json"));
const puppeteer = require_("puppeteer-core");
const browser = await puppeteer.launch({ executablePath: process.env.HYPERFRAMES_BROWSER_PATH, args: ["--no-sandbox", "--allow-file-access-from-files"] });
const seite = await browser.newPage();
await seite.setContent("<!doctype html><html><body></body></html>");
const ergebnis = await seite.evaluate(async (auftrag) => {
  for (const s of auftrag.schriften) {
    const daten = s.daten;   // base64, damit file:// nicht nötig ist
    const ff = new FontFace(s.familie, `url(data:font/woff2;base64,${daten})`, { weight: String(s.gewicht) });
    await ff.load();
    document.fonts.add(ff);
  }
  const out = {};
  for (const t of auftrag.texte) {
    const zeile = document.createElement("div");
    zeile.style.cssText = `${t.css}; white-space: nowrap; position: absolute; left: 0; top: 0;`;
    zeile.textContent = t.text;
    // Ein leerer Inline-Block sitzt auf der Grundlinie: seine Oberkante IST die Grundlinie.
    const marke = document.createElement("span");
    marke.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
    zeile.appendChild(marke);
    document.body.appendChild(zeile);
    const r = zeile.getBoundingClientRect();
    out[t.schluessel] = { breite: Math.round(r.width * 10) / 10, grundlinie: Math.round((marke.getBoundingClientRect().top - r.top) * 10) / 10, hoehe: Math.round(r.height * 10) / 10 };
    zeile.remove();
  }
  return out;
}, { ...auftrag, schriften: auftrag.schriften.map((s) => ({ ...s, daten: fs.readFileSync(s.datei).toString("base64") })) });
console.log(JSON.stringify(ergebnis));
await browser.close();
