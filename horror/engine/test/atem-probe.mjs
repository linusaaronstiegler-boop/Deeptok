#!/usr/bin/env node
// Atem-Probe für „Rules of Kindly“ Folge 1 (Tor, Bibel §10.7; entschieden am 17.11.2026, §14 Nr. 15).
// Das Suchbild der Folge (wer nicht dampft, ist die Kopie) muss auch nach der Kompression der Plattformen in unter
// 1 s auffallen. Die Probe: 10 s nachts am Stegende im Set see, Gegenlicht der Steglaterne, leichter Schneefall,
// drei Figuren: Gus und Odell dampfen, Bear nicht.
//
//   node test/atem-probe.mjs                 Episode bauen, rendern (mit und ohne Dampf), Wolkenorte messen,
//                                            dann test/atem_messung.py (Kompression, Messung, Bögen)
//   node test/atem-probe.mjs --nur-messung   nur den Python-Teil erneut (Renders liegen schon da)
//
// Ergebnis: horror/build/kindly-01/atem-probe.mp4 (Hauptfassung, crf 18) und horror/build/kindly-01/atem-probe/
// (Kompressions-Fassungen, messung.json, Kontaktbögen in Feed-Größe 270×480). Einzelbilder werden nach dem Bau
// gelöscht (Plattenplatz).
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ENGINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUS = path.resolve(ENGINE, '..', 'build', 'kindly-01');
const ORDNER = path.join(AUS, 'atem-probe');
const FPS = 30, DAUER = 10;
const SEE = [0, 0, 1000];
const plus = (a, b) => a.map((v, i) => +(v + b[i]).toFixed(4));
export const FIGUREN = ['gus', 'odell', 'bear'];

// ---------- Episode ----------
// Stegende (Set see, lokal): Deck y 0,85, Ende bei z ≈ −47,2; Steglaterne bei [0,28, 2,82, −47,55].
// Wie S37 (Kamerapunkt see.steg_seite): Kamera neben dem Steg im Nordwesten, Odell von hinten am Stegende, Bear
// und Gus im Dreiviertelprofil zur Kamera. Hinter den Köpfen liegt der dunkle Südrand des Sees (Kiefern,
// Nachthimmel), die Laterne steht schräg dahinter: Gegenlicht für die Wolken, aber nicht hinter einem Kopf.
export function probeEpisode(mitDampf) {
  const dampf = (an) => ({ dampf: mitDampf && an });
  const figuren = [
    { id: 'gus', modul: 'gus', params: dampf(true), position: plus(SEE, [-0.62, 0.85, -47.05]), blick: 203, gesicht: 'ernst' },
    { id: 'odell', modul: 'odell', params: { glaeser: 'weiss', links: 'laterne', ...dampf(true) }, position: plus(SEE, [0.25, 0.85, -48.5]), blick: 0, gesicht: 'streng' },
    { id: 'bear', modul: 'bear', params: { dampf: false }, position: plus(SEE, [0.22, 0.85, -47.3]), blick: 212, gesicht: 'besorgt' },
  ];
  const kamera = (pos, ziel, fov, rate) => ({ baustein: 'push_in', pos: plus(SEE, pos), ziel: plus(SEE, ziel), fov, rate });
  return {
    titel: `Atem-Probe Kindly F1 (${mitDampf ? 'mit' : 'ohne'} Dampf)`,
    fps: FPS, aufloesung: [1080, 1920], seed: 17,
    look: { licht: 'see_nacht', bloom: { staerke: 0.55, radius: 0.55, schwelle: 1.0 }, vignette: 0.32, korn: 0.03, toene: 'aces' },
    sets: [{ id: 'see', modul: 'see', position: SEE }],
    figuren: figuren.map((f) => ({ blinzeln: true, atmen: true, ...f })),
    einstellungen: [
      // 0–5 s: alle drei, langsamer Push-in
      { id: 'A', start: 0, ende: 5, set: ['see'], licht: 'see_nacht', kamera: kamera([-3.31, 2.65, -51.45], [-0.08, 2.15, -47.64], 44, 0.035) },
      // 5–10 s: näher an Bear und Gus, Odells Schulter links im Bild
      { id: 'B', start: 5, ende: 10, set: ['see'], licht: 'see_nacht', kamera: kamera([-2.0, 2.5, -49.85], [-0.1, 2.25, -47.3], 38, 0.03) },
    ],
    licht_ereignisse: [{ art: 'an', ziel: 'see.*', start: 0, dauer: 0 }],
    partikel: [{ art: 'schnee', ort: plus(SEE, [-0.5, 3.5, -47.5]), bereich: [8, 7, 8], anzahl: 420, groesse: 0.035 }],
  };
}

// ---------- Wolkenorte im Bild (Engine-Projektion der Anker "<figur>.dampf" und "<figur>.mund") ----------
async function projizieren(episodeDatei, ziel) {
  const PW = process.env.PLAYWRIGHT_PFAD || '/opt/node22/lib/node_modules/playwright/index.mjs';
  process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
  const { chromium } = await import(PW);
  // Xvfb wie render.mjs (Chromium mit System-OpenGL)
  let xvfb = null, anzeige = process.env.DISPLAY;
  if (!anzeige) {
    for (let n = 140; n < 200 && !anzeige; n++) {
      if (fs.existsSync(`/tmp/.X${n}-lock`) || fs.existsSync(`/tmp/.X11-unix/X${n}`)) continue;
      xvfb = spawn('Xvfb', [`:${n}`, '-screen', '0', '1280x1280x24', '-nolisten', 'tcp'], { stdio: 'ignore' });
      for (let i = 0; i < 100 && !fs.existsSync(`/tmp/.X11-unix/X${n}`); i++) await new Promise((r) => setTimeout(r, 50));
      anzeige = `:${n}`;
    }
  }
  const wurzeln = { engine: ENGINE, episode: path.dirname(episodeDatei) };
  const server = http.createServer((req, res) => {
    const [, p, ...t] = decodeURIComponent(req.url.split('?')[0]).split('/');
    const d = wurzeln[p] ? path.resolve(wurzeln[p], t.join('/')) : null;
    if (!d) { res.writeHead(404); res.end(); return; }
    fs.readFile(d, (e, b) => {
      if (e) { res.writeHead(404); res.end(); return; }
      const typ = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf' }[path.extname(d)] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': typ }); res.end(b);
    });
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  const browser = await chromium.launch({ headless: false, args: ['--use-gl=angle', '--use-angle=gl', '--ignore-gpu-blocklist', '--enable-gpu'], env: { ...process.env, DISPLAY: anzeige, LIBGL_ALWAYS_SOFTWARE: '1' } });
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/engine/index.html?episode=${encodeURIComponent(`/episode/${path.basename(episodeDatei)}`)}&skala=0.25`);
  await page.waitForFunction(() => window.engineBereit || window.engineFehler, null, { timeout: 180000 });
  const fehler = await page.evaluate(() => window.engineFehler);
  if (fehler) throw new Error(fehler);
  const anker = FIGUREN.flatMap((f) => [`${f}.dampf`, `${f}.mund`]);
  const bilder = [];
  for (let i = 0; i < FPS * DAUER; i += 3) bilder.push({ bild: i, punkte: await page.evaluate(([b, a]) => window.engine.projiziere(b, a), [i, anker]) });
  await browser.close();
  server.close();
  xvfb?.kill();
  fs.writeFileSync(ziel, JSON.stringify({ figuren: FIGUREN, anker, bilder }, null, 1));
}

function renderVariante(name, mitDampf) {
  const datei = path.join(ORDNER, `${name}.json`);
  fs.writeFileSync(datei, JSON.stringify(probeEpisode(mitDampf), null, 1));
  const aus = path.join(ORDNER, name);
  fs.rmSync(path.join(aus, 'bilder'), { recursive: true, force: true });
  // in zwei Abschnitten (Container-Neustarts kosten dann höchstens einen), danach MP4 aus allen Bildern
  for (const [von, bis] of [[0, 149], [150, 299]]) {
    const r = spawnSync('node', [path.join(ENGINE, 'render.mjs'), datei, '--bilder', `${von}-${bis}`, '--prozesse', '2', '--format', 'jpg', '--qualitaet', '0.95', '--nur-bilder', '--kein-bogen', '--aus', aus], { stdio: 'inherit' });
    if (r.status !== 0) throw new Error(`Render ${name} ${von}-${bis} fehlgeschlagen`);
  }
  const mp4 = path.join(ORDNER, `${name}.mp4`);
  const f = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(aus, 'bilder', 'f%05d.jpg'),
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-profile:v', 'high',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart', mp4], { stdio: 'inherit' });
  if (f.status !== 0) throw new Error('ffmpeg fehlgeschlagen');
  fs.rmSync(path.join(aus, 'bilder'), { recursive: true, force: true });   // Plattenplatz
  return { datei, mp4 };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  fs.mkdirSync(ORDNER, { recursive: true });
  if (!process.argv.includes('--nur-messung')) {
    const mit = renderVariante('mit', true);
    renderVariante('ohne', false);
    await projizieren(mit.datei, path.join(ORDNER, 'orte.json'));
    fs.copyFileSync(mit.mp4, path.join(AUS, 'atem-probe.mp4'));
  }
  const py = spawnSync('python3', [path.join(ENGINE, 'test', 'atem_messung.py'), ORDNER], { stdio: 'inherit' });
  process.exit(py.status ?? 1);
}
