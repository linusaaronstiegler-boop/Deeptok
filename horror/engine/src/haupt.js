// Einstieg der Render-Seite. index.html?episode=<url>&skala=<faktor>
// Stellt window.engine bereit; render.mjs ruft engine.bildDaten(i) für jedes Bild auf.
// Die Zeit kommt ausschließlich aus der Bildnummer: t = i / fps. Keine Uhr, kein requestAnimationFrame.

import * as THREE from 'three';
import { Zeitplan } from './zeitplan.js';
import { Welt } from './welt.js';
import { Licht } from './licht.js';
import { Nachbearbeitung } from './nachbearbeitung.js';
import { Partikel } from './partikel.js';
import { baueFahrt, kameraSetzen } from './kamera.js';
import { baueWerkzeug } from './werkzeug.js';
import { generator, hash } from './zufall.js';

const parameter = new URLSearchParams(location.search);

async function starten() {
  const episodeUrl = new URL(parameter.get('episode'), location.href).href;
  const antwort = await fetch(episodeUrl);
  if (!antwort.ok) throw new Error(`Episode nicht ladbar: ${episodeUrl} (${antwort.status})`);
  const episode = await antwort.json();
  const seed = episode.seed ?? 1;
  // three.js nutzt Math.random nur für interne IDs; trotzdem auf einen Seed festlegen,
  // damit auch Fremdcode in Modulen nichts Zufälliges ins Bild bringt.
  Math.random = generator(hash(`${seed}|math.random`));

  const look = episode.look ?? {};
  const fps = episode.fps ?? 30;
  const skala = parseFloat(parameter.get('skala') || '1');
  const [W0, H0] = episode.aufloesung ?? [1080, 1920];
  const W = Math.round((W0 * skala) / 2) * 2, H = Math.round((H0 * skala) / 2) * 2;
  const engineUrl = new URL('../', import.meta.url).href;

  // Leinwand hängt NICHT im Dokument: kein Compositor, keine Bildschirmausgabe nötig.
  const leinwand = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas: leinwand, antialias: false, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = look.schatten !== false;
  renderer.shadowMap.type = THREE.PCFShadowMap; // PCF mit shadow.radius = weiche Kanten
  renderer.shadowMap.autoUpdate = true;
  renderer.toneMapping = THREE.NoToneMapping; // Tonemapping macht die Endstufe der Nachbearbeitung
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const szene = new THREE.Scene();
  const kamera = new THREE.PerspectiveCamera(50, W / H, look.nah ?? 0.05, 1000);
  const zeitplan = new Zeitplan(episode);
  const licht = new Licht(szene);
  const werkzeug = baueWerkzeug({ seed, engineUrl, basisUrl: episodeUrl, renderer });
  const welt = new Welt({ szene, episode, zeitplan, werkzeug, engineUrl, basisUrl: episodeUrl, seed });
  await welt.laden();

  for (const [id, s] of welt.sets) {
    for (const [name, gruppe] of Object.entries(s.inst.lichter ?? {})) licht.meldeGruppe(`${id}.${name}`, gruppe);
  }
  licht.setzeEreignisse(zeitplan.lichtEreignisse);

  // Partikel: Ort ist ein Punkt [x,y,z] oder ein Anker ("held.mund"), der sich mitbewegt.
  const vek = (a) => new THREE.Vector3(...a);
  const partikel = zeitplan.partikel.map((spec) => {
    const p = new Partikel(spec, seed);
    szene.add(p.punkte);
    const ort = spec.ort ?? [0, 1, 0];
    p.ortBei = typeof ort === 'string' ? (t) => welt.anker(ort, t) : () => vek(ort);
    p.richtungBei = typeof ort === 'string' ? (t) => { const y = welt.ausrichtung(ort, t); return new THREE.Vector3(Math.sin(y), 0, Math.cos(y)); } : null;
    return p;
  });

  // Kamera-Fahrten aller Einstellungen vorab bauen. Start/Ende auf Bildgrenzen, damit die
  // Profile genau zu den Schnittbildern passen.
  welt.zustandSetzen(zeitplan.startBild / fps);
  const kontextFuer = (e) => ({
    start: e.startBild / fps, ende: e.endeBild / fps, fps, seitenverhaeltnis: W / H,
    anker: (n, t) => welt.anker(n, t), ausrichtung: (n, t) => welt.ausrichtung(n, t),
    kamerapunkt: (n) => welt.kamerapunkt(n), seed: hash(`${seed}|${e.id}`),
  });
  const fahrten = zeitplan.einstellungen.map((e) => {
    try { return baueFahrt(e.kamera, kontextFuer(e)); } catch (err) { throw new Error(`Einstellung ${e.id}: ${err.message}`); }
  });
  // Vordergrund-Objekte der Seitenfahrten (nur in ihrer Einstellung sichtbar).
  const vordergrund = fahrten.map((f) => f.vordergrund.map((v) => {
    const o = welt.baueVordergrund(v);
    o.position.set(...v.position);
    o.rotation.y = v.drehung;
    o.visible = false;
    szene.add(o);
    return o;
  }));

  // Kameraposition am Beginn jeder Einstellung, einmal beim Laden berechnet. Animationen mit
  // "zu": "kamera" schauen dorthin. Fest pro Einstellung, damit parallele Prozesse gleich rechnen.
  const kameraStart = fahrten.map((f, i) => f.zustand(zeitplan.einstellungen[i].startBild / fps).pos.clone());

  const post = new Nachbearbeitung(renderer, W, H, look);
  let aktiv = -1;

  function einstellungAktivieren(e) {
    if (aktiv === e.index) return;
    // Anker-Merkliste je Einstellung leeren: Ergebnisse hängen nur von der Einstellung ab,
    // nicht davon, welche Bilder dieser Prozess vorher gerendert hat.
    welt.ankerCache.clear();
    welt.kameraPos.copy(kameraStart[e.index]);
    for (const liste of vordergrund) for (const o of liste) o.visible = false;
    for (const o of vordergrund[e.index]) o.visible = true;
    welt.setzeSichtbareSets(e);
    licht.setzePreset(e.licht ?? look.licht ?? 'nacht', { ...(look.licht_anpassung ?? {}), ...(e.licht_anpassung ?? {}) });
    const z0 = fahrten[e.index].zustand(e.startBild / fps);
    const mitte = e.schatten_mitte ? (typeof e.schatten_mitte === 'string' ? welt.anker(e.schatten_mitte, e.startBild / fps) : vek(e.schatten_mitte)) : z0.ziel;
    licht.setzeSchattenbereich(mitte, e.schatten_bereich ?? look.schatten_bereich ?? 24);
    aktiv = e.index;
  }

  function zeitSetzen(t, e) {
    welt.zustandSetzen(t);
    licht.aktualisiere(t);
    const z = fahrten[e.index].zustand(t);
    kameraSetzen(kamera, z);
    licht.folgeKamera(kamera);
    for (const p of partikel) p.aktualisiere(t, p.ortBei, p.richtungBei, kamera, H);
    return z;
  }

  // Tiefenunschärfe einer Einstellung: true | { fokus: Meter | Anker, staerke }.
  function tiefeFuer(e, z) {
    const td = e.tiefenunschaerfe;
    if (!td) return null;
    const o = td === true ? {} : td;
    let fokus = z.pos.distanceTo(z.ziel);
    if (typeof o.fokus === 'number') fokus = o.fokus;
    else if (typeof o.fokus === 'string') fokus = kamera.position.distanceTo(welt.anker(o.fokus, welt.tAktuell));
    return { fokus, blende: o.staerke ?? 1.0 };
  }

  function bild(i) {
    const e = zeitplan.einstellungFuer(i);
    einstellungAktivieren(e);
    const t = i / fps;
    const fahrt = fahrten[e.index];
    // Bewegungsunschärfe: automatisch in schnellen Phasen (Whip, Snap), sonst nur auf Wunsch.
    const mb = { unterbilder: 5, max: 16, verschluss: 0.5, ...(look.bewegungsunschaerfe ?? {}), ...(e.bewegungsunschaerfe ?? {}) };
    const t0 = e.startBild / fps, t1 = e.endeBild / fps - 1e-4;
    let n = 1;
    if (!mb.aus && (mb.immer || fahrt.schnell(t))) {
      // So viele Unterbilder, dass sich die Blickrichtung zwischen zweien um höchstens 0,5° dreht
      // (sonst sieht man einzelne Geisterbilder statt eines Wischers).
      const halb = (0.5 * mb.verschluss) / fps;
      const a = fahrt.zustand(Math.max(t0, t - halb)), b = fahrt.zustand(Math.min(t1, t + halb));
      const ra = a.ziel.clone().sub(a.pos).normalize(), rb = b.ziel.clone().sub(b.pos).normalize();
      const grad = (Math.acos(Math.min(1, ra.dot(rb))) * 180) / Math.PI + Math.abs(a.fov - b.fov);
      n = Math.min(mb.max, Math.max(mb.unterbilder, Math.ceil(grad / 0.5)));
    }
    post.beginne(n);
    let z;
    for (let k = 0; k < n; k++) {
      // Unterbilder um t herum (Verschluss in Bildanteilen), nie über den Schnitt hinaus.
      const ts = n === 1 ? t : Math.min(t1, Math.max(t0, t + (((k + 0.5) / n - 0.5) * mb.verschluss) / fps));
      z = zeitSetzen(ts, e);
      post.szene(szene, kamera);
    }
    post.abschliessen({ bild: i, kamera, preset: licht.preset, tiefe: tiefeFuer(e, z) });
    return n;
  }

  const gl = renderer.getContext();
  const pixel = new Uint8Array(4);
  const fertig = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel); // wartet, bis die (Software-)GPU fertig ist

  window.engine = {
    fps, W, H,
    startBild: zeitplan.startBild,
    bilder: zeitplan.gesamtBilder,
    warnungen: zeitplan.warnungen,
    einstellungen: zeitplan.einstellungen.map((e) => ({ id: e.id, startBild: e.startBild, endeBild: e.endeBild })),
    info() {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    },
    // Shader vorab übersetzen: je Einstellung mit anderer Set-/Licht-Kombination ein Bild.
    aufwaermen(von = zeitplan.startBild, bis = zeitplan.gesamtBilder - 1) {
      const gesehen = new Set();
      for (const e of zeitplan.einstellungen) {
        if (e.endeBild <= von || e.startBild > bis) continue;
        const schluessel = JSON.stringify([e.set ?? null, e.licht ?? null, !!e.tiefenunschaerfe]);
        if (gesehen.has(schluessel)) continue;
        gesehen.add(schluessel);
        bild(Math.max(e.startBild, von));
      }
      fertig();
      aktiv = -1;
      return gesehen.size;
    },
    bild(i) {
      const t0 = performance.now();
      const n = bild(i);
      fertig();
      return { ms: performance.now() - t0, unterbilder: n };
    },
    // Rendern und als Daten-URL zurückgeben (im selben Aufruf, sonst ist der Puffer leer).
    bildDaten(i, format = 'image/png', qualitaet = 0.92) {
      const t0 = performance.now();
      const n = bild(i);
      fertig();
      const ms = performance.now() - t0;
      const url = leinwand.toDataURL(format, qualitaet);
      return { ms, msGesamt: performance.now() - t0, unterbilder: n, url };
    },
  };
  window.engineBereit = true;
}

starten().catch((e) => {
  window.engineFehler = String(e && e.stack ? e.stack : e);
  console.error(window.engineFehler);
});
