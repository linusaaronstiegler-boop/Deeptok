#!/usr/bin/env node
// Rendert eine Episode Bild für Bild in Chromium (three.js) und baut daraus ein MP4.
//
//   node render.mjs <episode.json> [Optionen]
//
// Optionen:
//   --von <s> --bis <s>      Zeitbereich in Sekunden (bis = exklusiv). Ohne Angabe: alles.
//   --bilder <a>-<b>         Bildbereich (beide inklusiv), statt --von/--bis
//   --einzelbild <s>         nur das Bild zur Zeit s als JPG (schnelle Probe)
//   --prozesse <n>           parallele Chromium-Prozesse mit je einem Bildbereich (Std 1, 2 empfohlen)
//   --format png|jpg         Einzelbilder (Std png, verlustfrei)
//   --qualitaet <0..1>       JPEG-Qualität (Std 0.92)
//   --skala <f>              Auflösung skalieren, z. B. 0.5333 für 576×1024-Entwürfe
//   --aus <ordner>           Ausgabe (Std horror/build/<episode>/), wird nicht committet
//   --ton <datei>            Tonspur ins MP4 legen
//   --crf <n>                H.264-Qualität (Std 18)
//   --nur-bilder             kein MP4 bauen
//   --kein-bogen             keinen Kontaktbogen (ein Bild je Einstellung) bauen
//   --backend gl|swiftshader gl = Mesa llvmpipe unter Xvfb (schnell, Std); swiftshader = Chromium-intern
//   --debug                  alle Konsolenmeldungen der Seite und fehlgeschlagene Anfragen zeigen
//
// Technik (gemessen in horror/docs/3d-urteil.md): Mesa llvmpipe über Xvfb mit --use-angle=gl ist
// 1,6–3,2× schneller als SwiftShader. Zwei Prozesse parallel nutzen die 4 Kerne besser aus.

import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ENGINE = path.dirname(fileURLToPath(import.meta.url));
const PLAYWRIGHT = process.env.PLAYWRIGHT_PFAD || '/opt/node22/lib/node_modules/playwright/index.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';

// ---------- Argumente ----------
function argumente(argv) {
  const o = { prozesse: 1, format: 'png', qualitaet: 0.92, skala: 1, crf: 18, backend: 'gl', bogen: true };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const wert = () => { const v = argv[++i]; if (v === undefined) throw new Error(`${a} braucht einen Wert`); return v; };
    if (a === '--von') o.von = parseFloat(wert());
    else if (a === '--bis') o.bis = parseFloat(wert());
    else if (a === '--bilder') { const [x, y] = wert().split('-').map(Number); o.bildVon = x; o.bildBis = y; }
    else if (a === '--einzelbild') o.einzelbild = parseFloat(wert());
    else if (a === '--prozesse') o.prozesse = Math.max(1, parseInt(wert(), 10));
    else if (a === '--format') o.format = wert();
    else if (a === '--qualitaet') o.qualitaet = parseFloat(wert());
    else if (a === '--skala') o.skala = parseFloat(wert());
    else if (a === '--aus') o.aus = wert();
    else if (a === '--ton') o.ton = wert();
    else if (a === '--crf') o.crf = parseInt(wert(), 10);
    else if (a === '--nur-bilder') o.nurBilder = true;
    else if (a === '--kein-bogen') o.bogen = false;
    else if (a === '--backend') o.backend = wert();
    else if (a === '--debug') o.debug = true;
    else if (a === '-h' || a === '--hilfe') o.hilfe = true;
    else if (a.startsWith('--')) throw new Error(`Unbekannte Option ${a}`);
    else rest.push(a);
  }
  o.episode = rest[0];
  if (!['png', 'jpg'].includes(o.format)) throw new Error('--format png oder jpg');
  return o;
}

// ---------- Dateiserver (ES-Module laufen nicht über file://) ----------
const TYPEN = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream', '.woff2': 'font/woff2' };
function starteServer(wurzeln) {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    const [, praefix, ...teile] = url.split('/');
    const wurzel = wurzeln[praefix];
    const datei = wurzel ? path.resolve(wurzel, teile.join('/')) : null;
    if (!datei || !datei.startsWith(path.resolve(wurzel))) { res.writeHead(404); res.end(); return; }
    fs.readFile(datei, (e, d) => {
      if (e) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': TYPEN[path.extname(datei)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(d);
    });
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)));
}

// ---------- Xvfb (virtueller Bildschirm für Chromium mit System-OpenGL) ----------
async function starteXvfb() {
  for (let n = 90; n < 200; n++) {
    if (fs.existsSync(`/tmp/.X${n}-lock`) || fs.existsSync(`/tmp/.X11-unix/X${n}`)) continue;
    const proz = spawn('Xvfb', [`:${n}`, '-screen', '0', '1280x1280x24', '-nolisten', 'tcp'], { stdio: 'ignore' });
    for (let i = 0; i < 100; i++) {
      if (fs.existsSync(`/tmp/.X11-unix/X${n}`)) return { anzeige: `:${n}`, proz };
      if (proz.exitCode !== null) break;
      await new Promise((r) => setTimeout(r, 50));
    }
    proz.kill();
  }
  throw new Error('Xvfb ließ sich nicht starten (ist xvfb installiert?)');
}

// ---------- Ein Render-Prozess ----------
async function starteBrowser(chromium, o, anzeige) {
  const gl = o.backend === 'gl';
  const args = gl
    ? ['--use-gl=angle', '--use-angle=gl', '--ignore-gpu-blocklist', '--enable-gpu', '--disable-gpu-vsync', '--disable-frame-rate-limit']
    : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
  return chromium.launch({
    headless: !gl,
    args,
    env: { ...process.env, ...(gl ? { DISPLAY: anzeige, LIBGL_ALWAYS_SOFTWARE: '1' } : {}) },
  });
}

let DEBUG = false;
async function oeffneSeite(browser, seitenUrl, kennung) {
  const page = await browser.newPage({ viewport: { width: 360, height: 640 } });
  page.on('console', (m) => { if (DEBUG || ['error', 'warning'].includes(m.type())) console.error(`[${kennung}] ${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => console.error(`[${kennung}] Seitenfehler: ${e.message}`));
  page.on('response', (r) => { if (r.status() >= 400) console.error(`[${kennung}] HTTP ${r.status()}: ${r.url()}`); });
  page.on('requestfailed', (r) => console.error(`[${kennung}] Anfrage fehlgeschlagen: ${r.url()}`));
  await page.goto(seitenUrl);
  // Fehler beim Laden der Module selbst (z. B. falscher Import) melden sich nicht über engineFehler,
  // deshalb zusätzlich auf Seitenfehler achten und nicht ewig warten.
  await page.waitForFunction(() => window.engineBereit || window.engineFehler, null, { timeout: 180000 });
  const fehler = await page.evaluate(() => window.engineFehler);
  if (fehler) throw new Error(`Engine-Fehler beim Laden:\n${fehler}`);
  return page;
}

async function renderBereich({ browser, seitenUrl, von, bis, o, ordner, kennung, fortschritt }) {
  const page = await oeffneSeite(browser, seitenUrl, kennung);
  const tAuf = Date.now();
  await page.evaluate(([a, b]) => window.engine.aufwaermen(a, b), [von, bis]);
  const aufwaermen = (Date.now() - tAuf) / 1000;
  const mime = o.format === 'jpg' ? 'image/jpeg' : 'image/png';
  const msRender = [];
  let unterbilderBilder = 0;
  const schreiben = [];
  const t0 = Date.now();
  for (let i = von; i <= bis; i++) {
    const r = await page.evaluate(([i, m, q]) => window.engine.bildDaten(i, m, q), [i, mime, o.qualitaet]);
    msRender.push(r.ms);
    if (r.unterbilder > 1) unterbilderBilder++;
    const daten = Buffer.from(r.url.slice(r.url.indexOf(',') + 1), 'base64');
    schreiben.push(fsp.writeFile(path.join(ordner, `f${String(i).padStart(5, '0')}.${o.format}`), daten));
    fortschritt();
  }
  await Promise.all(schreiben);
  const wand = (Date.now() - t0) / 1000;
  await page.close();
  return { kennung, von, bis, bilder: bis - von + 1, wand, aufwaermen, msRender, unterbilderBilder };
}

// ---------- ffmpeg ----------
function ffmpeg(args) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
  if (r.status !== 0) throw new Error(`ffmpeg fehlgeschlagen (${r.status}): ffmpeg ${args.join(' ')}`);
}

function baueMp4(o, ordner, fps, von, ziel) {
  const args = ['-framerate', String(fps), '-start_number', String(von), '-i', path.join(ordner, `f%05d.${o.format}`)];
  if (o.ton) args.push('-ss', String(von / fps), '-i', o.ton);
  // RGB -> YUV mit BT.709-Matrix und so gekennzeichnet (sonst wirken Farben am Handy verschoben).
  args.push('-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', String(o.crf), '-profile:v', 'high',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart');
  if (o.ton) args.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
  args.push(ziel);
  ffmpeg(args);
}

// Kontaktbogen: das mittlere Bild jeder Einstellung im Bereich, 6 pro Zeile.
async function baueBogen(o, ordner, einstellungen, von, bis, ziel) {
  const tmp = path.join(ordner, '_bogen');
  await fsp.rm(tmp, { recursive: true, force: true });
  await fsp.mkdir(tmp, { recursive: true });
  let n = 0;
  for (const e of einstellungen) {
    const a = Math.max(e.startBild, von), b = Math.min(e.endeBild - 1, bis);
    if (a > b) continue;
    const mitte = Math.floor((a + b) / 2);
    await fsp.copyFile(path.join(ordner, `f${String(mitte).padStart(5, '0')}.${o.format}`), path.join(tmp, `b${String(n++).padStart(3, '0')}.${o.format}`));
  }
  if (!n) return null;
  const spalten = Math.min(6, n), zeilen = Math.ceil(n / spalten);
  ffmpeg(['-i', path.join(tmp, `b%03d.${o.format}`), '-vf', `scale=270:-2,tile=${spalten}x${zeilen}:padding=4:color=white`, '-frames:v', '1', '-q:v', '3', ziel]);
  await fsp.rm(tmp, { recursive: true, force: true });
  return ziel;
}

// ---------- Ablauf ----------
async function main() {
  const o = argumente(process.argv.slice(2));
  DEBUG = !!o.debug;
  const schritt = (text) => { if (DEBUG) console.log(`- ${text}`); };
  if (o.hilfe || !o.episode) {
    console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 22).map((z) => z.replace(/^\/\/ ?/, '')).join('\n'));
    process.exit(o.hilfe ? 0 : 1);
  }
  const episodePfad = path.resolve(o.episode);
  const episode = JSON.parse(await fsp.readFile(episodePfad, 'utf8'));
  const name = path.basename(episodePfad, '.json');
  const fps = episode.fps ?? 30;
  const ordner = path.resolve(o.aus ?? path.join(ENGINE, '..', 'build', name));
  const bilderOrdner = path.join(ordner, 'bilder');
  await fsp.mkdir(bilderOrdner, { recursive: true });

  schritt("Starte Dateiserver");
  const server = await starteServer({ engine: ENGINE, episode: path.dirname(episodePfad) });
  const port = server.address().port;
  const seitenUrl = `http://127.0.0.1:${port}/engine/index.html?episode=${encodeURIComponent(`/episode/${path.basename(episodePfad)}`)}&skala=${o.skala}`;

  let xvfb = null;
  const aufraeumen = () => { try { xvfb?.proz.kill(); } catch { /* schon beendet */ } };
  process.on('exit', aufraeumen);
  process.on('SIGINT', () => { aufraeumen(); process.exit(130); });
  process.on('SIGTERM', () => { aufraeumen(); process.exit(143); });
  let anzeige = process.env.DISPLAY;
  if (o.backend === "gl" && !anzeige) { schritt("Starte Xvfb"); xvfb = await starteXvfb(); anzeige = xvfb.anzeige; }
  schritt(`Anzeige ${anzeige ?? '(headless)'}, Seite ${seitenUrl}`);

  const { chromium } = await import(PLAYWRIGHT);

  // Erst eine Seite öffnen, um Bildzahl, Schnitte und Warnungen der Episode zu erfahren.
  const browser0 = await starteBrowser(chromium, o, anzeige);
  schritt('Chromium gestartet');
  const probe = await oeffneSeite(browser0, seitenUrl, 'p1');
  schritt('Engine geladen');
  const meta = await probe.evaluate(() => ({ ...window.engine, renderer: window.engine.info() }));
  await probe.close();
  for (const w of meta.warnungen) console.warn(`Warnung: ${w}`);
  console.log(`Episode ${name}: ${meta.bilder - meta.startBild} Bilder (${((meta.bilder - meta.startBild) / fps).toFixed(2)} s), ${meta.einstellungen.length} Einstellungen, ${meta.W}×${meta.H}, ${meta.renderer}`);

  // Einzelbild-Probe
  if (o.einzelbild !== undefined) {
    const page = await oeffneSeite(browser0, seitenUrl, 'p1');
    const i = Math.round(o.einzelbild * fps);
    const r = await page.evaluate(([i]) => window.engine.bildDaten(i, 'image/jpeg', 0.92), [i]);
    const ziel = path.join(ordner, `probe-${String(i).padStart(5, '0')}.jpg`);
    await fsp.writeFile(ziel, Buffer.from(r.url.slice(r.url.indexOf(',') + 1), 'base64'));
    console.log(`Einzelbild ${i} (${o.einzelbild} s): ${(r.ms / 1000).toFixed(2)} s Render (inkl. Shader-Übersetzung) -> ${ziel}`);
    await browser0.close(); server.close(); aufraeumen(); return;
  }

  let von = meta.startBild, bis = meta.bilder - 1;
  if (o.bildVon !== undefined) { von = o.bildVon; bis = o.bildBis; }
  if (o.von !== undefined) von = Math.round(o.von * fps);
  if (o.bis !== undefined) bis = Math.round(o.bis * fps) - 1;
  von = Math.max(meta.startBild, von); bis = Math.min(meta.bilder - 1, bis);
  if (bis < von) throw new Error(`Leerer Bereich ${von}–${bis}`);
  const gesamt = bis - von + 1;

  // Bildbereich auf Prozesse aufteilen (zusammenhängende Blöcke).
  const n = Math.min(o.prozesse, gesamt);
  const bereiche = [];
  for (let k = 0; k < n; k++) {
    const a = von + Math.floor((gesamt * k) / n), b = von + Math.floor((gesamt * (k + 1)) / n) - 1;
    bereiche.push([a, b]);
  }
  const browser = [browser0];
  for (let k = 1; k < n; k++) browser.push(await starteBrowser(chromium, o, anzeige));

  let fertig = 0, letzte = Date.now();
  const tStart = Date.now();
  const fortschritt = () => {
    fertig++;
    if (Date.now() - letzte > 5000 || fertig === gesamt) {
      letzte = Date.now();
      const s = (Date.now() - tStart) / 1000;
      process.stdout.write(`  ${fertig}/${gesamt} Bilder, ${(s / fertig).toFixed(2)} s/Bild, Rest ~${Math.round(((gesamt - fertig) * s) / fertig)} s\n`);
    }
  };
  const ergebnisse = await Promise.all(bereiche.map(([a, b], k) => renderBereich({ browser: browser[k], seitenUrl, von: a, bis: b, o, ordner: bilderOrdner, kennung: `p${k + 1}`, fortschritt })));
  const wand = (Date.now() - tStart) / 1000;
  for (const b of browser) await b.close();
  server.close();

  const alleMs = ergebnisse.flatMap((e) => e.msRender);
  const mittel = alleMs.reduce((s, x) => s + x, 0) / alleMs.length / 1000;
  const sortiert = [...alleMs].sort((a, b) => a - b);
  const messung = {
    episode: name, aufloesung: [meta.W, meta.H], fps, bilder: gesamt, bereich: [von, bis], prozesse: n,
    backend: o.backend, renderer: meta.renderer, format: o.format,
    s_pro_bild_render_mittel: +mittel.toFixed(3),
    s_pro_bild_render_median: +(sortiert[Math.floor(sortiert.length / 2)] / 1000).toFixed(3),
    s_pro_bild_render_max: +(sortiert.at(-1) / 1000).toFixed(3),
    s_pro_bild_effektiv: +(wand / gesamt).toFixed(3),
    wandzeit_s: +wand.toFixed(1),
    aufwaermen_s: ergebnisse.map((e) => +e.aufwaermen.toFixed(1)),
    bilder_mit_bewegungsunschaerfe: ergebnisse.reduce((s, e) => s + e.unterbilderBilder, 0),
    hochrechnung_min_pro_minute_video: +(((wand / gesamt) * fps * 60) / 60).toFixed(1),
    datum: new Date().toISOString(),
  };
  await fsp.writeFile(path.join(ordner, 'messung.json'), JSON.stringify(messung, null, 2));
  console.log(`Fertig: ${gesamt} Bilder in ${wand.toFixed(1)} s (${messung.s_pro_bild_effektiv} s/Bild effektiv, Render allein ${messung.s_pro_bild_render_mittel} s/Bild), ~${messung.hochrechnung_min_pro_minute_video} min Rechenzeit je Minute Video`);

  if (o.bogen) {
    const bogen = await baueBogen(o, bilderOrdner, meta.einstellungen, von, bis, path.join(ordner, `${name}-bogen.jpg`));
    if (bogen) console.log(`Kontaktbogen: ${bogen}`);
  }
  if (!o.nurBilder) {
    const ziel = path.join(ordner, `${name}.mp4`);
    baueMp4(o, bilderOrdner, fps, von, ziel);
    console.log(`MP4: ${ziel}`);
  }
}

// Am Ende hart beenden: der Xvfb-Kindprozess hielte Node sonst am Leben.
main().then(() => process.exit(0)).catch((e) => { console.error(e.stack || String(e)); process.exit(1); });
