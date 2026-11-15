// Bauteile für die Sets der Serie "Hiding Night": Texturen, Häuser, Fenster, Türen, Veranden,
// Zäune, Laternen, Bäume, Wände mit Öffnungen. Alles im Code gebaut (keine fremden Assets).
//
// Ziel-Look r2 (@jexario): saubere Klötzchen mit abgerundeten Kanten, Holzverkleidung mit
// Schattenfugen, helle Zierleisten, Gehwegplatten mit dunklen Fugen, viele Requisiten.
// Materialien bekommen Texturen in Graustufen, die mit der Materialfarbe multipliziert werden;
// so reicht eine Textur für alle Hausfarben.
//
// Weltmaßstab: 1 Einheit = 1 m. Texturen werden in Metern gekachelt (Welt-UV beim Verschmelzen),
// damit Fugen über zusammengesetzte Wandstücke durchlaufen.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------- Maße, die mehrere Sets teilen ----------
// Das Marsh-Haus steht auf der Westseite der Hauptstraße, die Front schaut nach +x (zur Straße).
// marsh_haus (außen) und marsh_innen (innen) bauen beide in diesem System, damit Innen und Außen
// deckungsgleich sind. Alle drei Sets werden mit position [0,0,0] und drehung 0 geladen.
// Haus-System: Front bei z = 0 (zeigt nach +z), Haus reicht bis z = −tiefe, x = −breite/2 … +breite/2
// (+x liegt von der Straße aus gesehen rechts). Welt = Haus-System um 90° gedreht, an position.
export const MARSH = {
  position: [-12, 0, 0], drehung: 90,
  breite: 10, tiefe: 9, sockel: 0.6, eg: 3.0, decke: 0.2, og: 2.8, dachNeigung: 34,
  farbe: '#9DB5A0', zier: '#F2EFE7', dachFarbe: '#4A3F3C', tuerFarbe: '#7A3B36',
  // Fenster (x im Haus-System, etage 0/1, b, h, unten = Brüstung über dem Etagenboden)
  fenster: {
    kueche: { seite: 'vorn', x: -2.6, etage: 0, b: 1.4, h: 1.5, unten: 0.95 },
    eli: { seite: 'vorn', x: -2.6, etage: 1, b: 1.3, h: 1.45, unten: 0.8 },
    flur_oben: { seite: 'vorn', x: 2.6, etage: 1, b: 1.1, h: 1.3, unten: 0.9 },
    flur: { seite: 'rechts', z: -2.6, etage: 0, b: 0.9, h: 1.3, unten: 1.0 },
    june: { seite: 'hinten', x: -2.6, etage: 0, b: 1.3, h: 1.4, unten: 0.9 },
    june_seite: { seite: 'links', z: -6.6, etage: 0, b: 1.1, h: 1.3, unten: 0.95 },
    kueche_seite: { seite: 'links', z: -2.2, etage: 0, b: 1.1, h: 1.3, unten: 1.0 },
    eli_seite: { seite: 'links', z: -2.2, etage: 1, b: 1.0, h: 1.2, unten: 0.9 },
    hinten_oben: { seite: 'hinten', x: 2.4, etage: 1, b: 1.1, h: 1.2, unten: 0.9 },
  },
  tuer: { x: 1.7, b: 1.05, h: 2.25 },
  veranda: { von: 0.2, bis: 4.8, tiefe: 2.4 },
};

// Punkt im Marsh-Haus-System → Weltkoordinaten (für Anker und Kamerapunkte der Sets)
export function marshWelt(x, y, z) {
  const a = (MARSH.drehung * Math.PI) / 180;
  return [MARSH.position[0] + Math.cos(a) * x + Math.sin(a) * z, MARSH.position[1] + y, MARSH.position[2] - Math.sin(a) * x + Math.cos(a) * z];
}

// ---------- Texturen ----------
const texCache = new WeakMap();
function zufallsQuelle(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Kachelgröße jeder Textur in Metern (eine Kachel = so viele Meter)
const KACHEL = { verkleidung: 2.4, schindeln: 2, pflaster: 2.4, platten: 3, asphalt: 6, dielen: 2.4, tapete: 1.2, tapete_muster: 1.2, fliesen: 1.2, gras: 4, putz: 3, holz: 1.5, stein: 2, erde: 3, teppich: 2 };

export function textur(ctx, name) {
  let cache = texCache.get(ctx);
  if (!cache) { cache = new Map(); texCache.set(ctx, cache); }
  if (cache.has(name)) return cache.get(name);
  const z = zufallsQuelle(name.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
  const zeichne = {
    // Holzverkleidung: waagerechte Bretter mit Schattenfuge unten und leichter Maserung
    verkleidung(g, w, h) {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      const n = 12;
      for (let i = 0; i < n; i++) {
        const y = (i * h) / n;
        g.fillStyle = `rgba(0,0,0,${0.02 + z() * 0.04})`; g.fillRect(0, y, w, h / n);
        g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, y, w, h / n * 0.12);
        g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(0, y + h / n * 0.86, w, h / n * 0.14);
        for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(0,0,0,${z() * 0.04})`; g.fillRect(z() * w, y + z() * h / n * 0.7, w * (0.1 + z() * 0.3), 1.5); }
      }
    },
    // Dachschindeln: versetzte Reihen
    schindeln(g, w, h) {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      const reihen = 10, je = 8;
      for (let r = 0; r < reihen; r++) {
        const y = (r * h) / reihen, off = (r % 2) * (w / je / 2);
        for (let k = -1; k < je; k++) {
          const x = off + (k * w) / je;
          g.fillStyle = `rgba(0,0,0,${0.04 + z() * 0.12})`; g.fillRect(x + 1, y, w / je - 2, h / reihen);
          g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x, y, 1.5, h / reihen);
        }
        g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(0, y + h / reihen - 2.5, w, 2.5);
      }
    },
    // Kopfsteinpflaster: gerundete Steine in Reihen
    pflaster(g, w, h) {
      g.fillStyle = '#3a3a3a'; g.fillRect(0, 0, w, h);
      const reihen = 12;
      for (let r = 0; r < reihen; r++) {
        let x = (r % 2) * 8 - 8;
        while (x < w) {
          const sw = 14 + z() * 12, y = (r * h) / reihen;
          const v = 200 + z() * 55;
          g.fillStyle = `rgb(${v},${v},${v - 6})`;
          g.beginPath(); g.roundRect(x + 2, y + 2, sw - 3, h / reihen - 4, 5); g.fill();
          x += sw;
        }
      }
    },
    // Gehwegplatten wie in r2: große helle Platten mit dunklen Fugen
    platten(g, w, h) {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) {
        g.fillStyle = `rgba(0,0,0,${z() * 0.05})`; g.fillRect((k * w) / 4, (r * h) / 4, w / 4, h / 4);
      }
      g.fillStyle = 'rgba(0,0,0,0.5)';
      for (let i = 0; i <= 4; i++) { g.fillRect((i * w) / 4 - 1.5, 0, 3, h); g.fillRect(0, (i * h) / 4 - 1.5, w, 3); }
    },
    asphalt(g, w, h) {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(0,0,0,${z() * 0.12})`; g.fillRect(z() * w, z() * h, 1.5, 1.5); }
      for (let i = 0; i < 6; i++) { g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 1; g.beginPath(); let x = z() * w, y = z() * h; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (z() - 0.5) * 30; y += (z() - 0.5) * 30; g.lineTo(x, y); } g.stroke(); }
    },
    // Dielen: Bretter in Längsrichtung mit versetzten Stößen
    dielen(g, w, h) {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      const n = 10;
      for (let i = 0; i < n; i++) {
        const x = (i * w) / n;
        g.fillStyle = `rgba(0,0,0,${0.03 + z() * 0.1})`; g.fillRect(x, 0, w / n, h);
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x, 0, 2, h);
        const stoss = z() * h; g.fillRect(x, stoss, w / n, 2);
        for (let k = 0; k < 5; k++) { g.fillStyle = `rgba(0,0,0,${z() * 0.06})`; g.fillRect(x + 3 + z() * (w / n - 6), z() * h, 1.2, h * (0.1 + z() * 0.3)); }
      }
    },
    // Tapete: feine senkrechte Streifen
    tapete(g, w, h) {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'; g.fillRect((i * w) / 16, 0, w / 16, h); }
    },
    // Tapete mit kleinem Rautenmuster
    tapete_muster(g, w, h) {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(0,0,0,0.08)';
      for (let r = 0; r < 8; r++) for (let k = 0; k < 8; k++) {
        const cx = (k + (r % 2) * 0.5) * w / 8, cy = r * h / 8;
        g.beginPath(); g.moveTo(cx, cy - 5); g.lineTo(cx + 4, cy); g.lineTo(cx, cy + 5); g.lineTo(cx - 4, cy); g.closePath(); g.fill();
      }
    },
    fliesen(g, w, h) {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(0,0,0,0.25)';
      for (let i = 0; i <= 8; i++) { g.fillRect((i * w) / 8 - 1, 0, 2, h); g.fillRect(0, (i * h) / 8 - 1, w, 2); }
    },
    gras(g, w, h) {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2200; i++) { const v = z(); g.fillStyle = v < 0.5 ? `rgba(0,0,0,${v * 0.25})` : `rgba(255,255,230,${(v - 0.5) * 0.25})`; g.fillRect(z() * w, z() * h, 2, 3); }
    },
    putz(g, w, h) {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(0,0,0,${z() * 0.06})`; g.fillRect(z() * w, z() * h, 2, 2); }
    },
    holz(g, w, h) {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(0,0,0,${0.03 + z() * 0.08})`; g.lineWidth = 1 + z() * 2; g.beginPath(); const y = z() * h; g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + (z() - 0.5) * 10, w * 0.7, y + (z() - 0.5) * 10, w, y); g.stroke(); }
    },
    // Natursteinmauer (Sockel, Kirchenstufen)
    stein(g, w, h) {
      g.fillStyle = '#555555'; g.fillRect(0, 0, w, h);
      const reihen = 6;
      for (let r = 0; r < reihen; r++) {
        let x = (r % 2) * 18 - 18;
        while (x < w) { const sw = 26 + z() * 22; const v = 185 + z() * 60; g.fillStyle = `rgb(${v},${v - 3},${v - 8})`; g.fillRect(x + 2, (r * h) / reihen + 2, sw - 4, h / reihen - 4); x += sw; }
      }
    },
    erde(g, w, h) {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(0,0,0,${z() * 0.2})`; g.fillRect(z() * w, z() * h, 2 + z() * 3, 2); }
    },
  }[name];
  if (!zeichne) throw new Error(`Textur "${name}" unbekannt`);
  const t = ctx.zeichenTextur(zeichne, 256, 256);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  const k = KACHEL[name] ?? 2;
  t.repeat.set(1 / k, 1 / k);
  cache.set(name, t);
  return t;
}

// Material mit Textur (eigener Zwischenspeicher: ctx.mat würde die Textur bei jedem Aufruf serialisieren).
const matCache = new WeakMap();
export function tmat(ctx, farbe, tex, opt = {}) {
  let cache = matCache.get(ctx);
  if (!cache) { cache = new Map(); matCache.set(ctx, cache); }
  const k = `${farbe}|${tex}|${JSON.stringify(opt)}`;
  if (cache.has(k)) return cache.get(k);
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(farbe), roughness: opt.rauheit ?? 0.88, metalness: opt.metall ?? 0, map: tex ? textur(ctx, tex) : null });
  cache.set(k, m);
  return m;
}

// Leuchtende Fensterscheibe mit Vorhang-Silhouette (warmes Innenlicht). Eigenes Material je Gruppe.
export function fensterLichtMat(ctx, farbe = '#ffc47a', staerke = 2.4) {
  const tex = ctx.zeichenTextur((g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#ffe2b0'); gr.addColorStop(1, '#f2a860');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(120,60,30,0.55)';
    g.fillRect(0, 0, w * 0.18, h); g.fillRect(w * 0.82, 0, w * 0.18, h);
    g.fillStyle = 'rgba(120,60,30,0.3)'; g.fillRect(0, 0, w, h * 0.1);
  }, 64, 64);
  const m = ctx.leuchtMat(farbe, staerke);
  m.emissiveMap = tex;
  m.map = tex;
  return m;
}

// ---------- Geometrie mit Welt-UV ----------
// Meshes mit userData.weltUV bekommen beim Verschmelzen UVs aus ihrer Lage (in Metern):
// Wand-Fugen und Pflaster laufen über Bauteilgrenzen durch.
export function weltUV(geo) {
  const pos = geo.attributes.position, nor = geo.attributes.normal;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i)), nz = Math.abs(nor.getZ(i));
    let u, v;
    if (ny >= nx && ny >= nz) { u = pos.getX(i); v = pos.getZ(i); }
    else if (nx >= nz) { u = pos.getZ(i) * Math.sign(nor.getX(i) || 1); v = pos.getY(i); }
    else { u = pos.getX(i) * -Math.sign(nor.getZ(i) || 1) * -1; v = pos.getY(i); }
    uv[i * 2] = u; uv[i * 2 + 1] = v;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

const geoCache = new Map();
export function kistenGeo(b, h, t, r = 0) {
  const rr = Math.min(r, b / 2 - 1e-4, h / 2 - 1e-4, t / 2 - 1e-4);
  const k = `${b}|${h}|${t}|${rr}`;
  if (!geoCache.has(k)) geoCache.set(k, rr > 0.004 ? new RoundedBoxGeometry(b, h, t, 2, rr) : new THREE.BoxGeometry(b, h, t));
  return geoCache.get(k);
}

// Kiste setzen: k(eltern, b, h, t, material, x, y, z, { rund, dreh: [rx, ry, rz], schatten, welt })
export function k(eltern, b, h, t, material, x, y, z, opt = {}) {
  const m = new THREE.Mesh(kistenGeo(b, h, t, opt.rund ?? 0), material);
  m.position.set(x, y, z);
  if (opt.dreh) m.rotation.set(...opt.dreh);
  m.castShadow = opt.schatten !== false;
  m.receiveShadow = true;
  if (opt.welt !== false && material.map) m.userData.weltUV = true;
  eltern.add(m);
  return m;
}

// Fläche (Plane) setzen, Vorderseite zeigt nach +z der Fläche; dreh wie bei k().
export function flaeche(eltern, b, h, material, x, y, z, dreh = [0, 0, 0], opt = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(b, h), material);
  m.position.set(x, y, z);
  m.rotation.set(...dreh);
  m.castShadow = opt.schatten ?? false;
  m.receiveShadow = true;
  if (opt.welt && material.map) m.userData.weltUV = true;
  eltern.add(m);
  return m;
}

// Zylinder setzen
export function zyl(eltern, rO, rU, h, material, x, y, z, opt = {}) {
  const g = new THREE.CylinderGeometry(rO, rU, h, opt.segmente ?? 10);
  const m = new THREE.Mesh(g, material);
  m.position.set(x, y, z);
  if (opt.dreh) m.rotation.set(...opt.dreh);
  m.castShadow = opt.schatten !== false;
  m.receiveShadow = true;
  eltern.add(m);
  return m;
}

// Dreieck (Giebel), Vorderseite nach +z; Spitze bei (0, hoehe), Basis von −breite/2 bis +breite/2.
export function giebel(eltern, breite, hoehe, material, x, y, z, drehY = 0) {
  const s = new THREE.Shape();
  s.moveTo(-breite / 2, 0); s.lineTo(breite / 2, 0); s.lineTo(0, hoehe); s.closePath();
  const geo = new THREE.ShapeGeometry(s);
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.rotation.y = drehY;
  m.castShadow = true; m.receiveShadow = true;
  if (material.map) m.userData.weltUV = true;
  eltern.add(m);
  return m;
}

// Verschmelzen mit Welt-UV (statt ctx.verschmelzen): ein Mesh je Material. Teile mit
// userData.einzeln bleiben eigene Objekte (Licht-Ereignisse, bewegte Teile).
export function verschmelze(gruppe) {
  gruppe.updateMatrixWorld(true);
  const inverse = gruppe.matrixWorld.clone().invert();
  const toepfe = new Map();
  const weg = [];
  gruppe.traverse((o) => {
    if (!o.isMesh || o.userData.einzeln) return;
    const schluessel = `${o.material.uuid}|${o.castShadow}|${o.receiveShadow}`;
    if (!toepfe.has(schluessel)) toepfe.set(schluessel, { material: o.material, cast: o.castShadow, rec: o.receiveShadow, geos: [] });
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(n)) g.deleteAttribute(n);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, o.matrixWorld));
    if (o.userData.weltUV) weltUV(g);
    toepfe.get(schluessel).geos.push(g);
    weg.push(o);
  });
  for (const o of weg) o.parent.remove(o);
  for (const t of toepfe.values()) {
    const m = new THREE.Mesh(mergeGeometries(t.geos, false), t.material);
    m.castShadow = t.cast; m.receiveShadow = t.rec;
    gruppe.add(m);
  }
  return gruppe;
}

// ---------- Fenster ----------
// Fenster auf einer Fassade, die nach +z zeigt (Wandfläche bei z = 0). Mitte unten bei (x, y).
// o: { b, h, zier (Material), glas (Material), sprossen (true), laeden (Material|null), kasten (Blumenkasten) }
export function fenster(ctx, eltern, x, y, o) {
  const { b, h } = o;
  const zier = o.zier, r = 0.012;
  const tiefe = o.tiefe ?? 0.07;
  // Scheibe leicht zurückgesetzt, Rahmen davor
  const glas = flaeche(eltern, b - 0.06, h - 0.06, o.glas, x, y + h / 2, 0.012);
  k(eltern, b + 0.16, 0.1, tiefe + 0.05, zier, x, y - 0.03, tiefe / 2 + 0.02, { rund: r }); // Fensterbank
  k(eltern, b + 0.22, 0.14, tiefe + 0.03, zier, x, y + h + 0.07, tiefe / 2, { rund: r }); // Sturz
  for (const sx of [-1, 1]) k(eltern, 0.09, h, tiefe, zier, x + sx * (b / 2 + 0.02), y + h / 2, tiefe / 2, { rund: r });
  if (o.sprossen !== false) {
    k(eltern, 0.045, h - 0.06, 0.04, zier, x, y + h / 2, 0.03, { schatten: false });
    k(eltern, b - 0.06, 0.045, 0.04, zier, x, y + h * 0.55, 0.03, { schatten: false });
  }
  if (o.laeden) {
    for (const sx of [-1, 1]) {
      const lx = x + sx * (b / 2 + 0.06 + b * 0.24);
      k(eltern, b * 0.46, h * 1.02, 0.04, o.laeden, lx, y + h / 2, 0.03, { rund: 0.008 });
      for (let i = 0; i < 6; i++) k(eltern, b * 0.4, 0.025, 0.02, o.laedenLeiste ?? o.laeden, lx, y + h * (0.12 + i * 0.15), 0.06, { schatten: false });
    }
  }
  if (o.kasten) {
    k(eltern, b + 0.05, 0.2, 0.22, o.kasten, x, y - 0.17, 0.16, { rund: 0.02 });
    for (let i = 0; i < 5; i++) k(eltern, 0.14, 0.12, 0.14, o.blumen ?? o.kasten, x - b / 2 + 0.1 + i * (b - 0.2) / 4, y - 0.02, 0.17, { rund: 0.05, schatten: false });
  }
  return glas;
}

// ---------- Tür auf einer Fassade (+z) ----------
export function haustuer(ctx, eltern, x, y, o) {
  const { b, h } = o;
  const zier = o.zier;
  k(eltern, b + 0.3, 0.16, 0.12, zier, x, y + h + 0.08, 0.05, { rund: 0.01 });
  for (const sx of [-1, 1]) k(eltern, 0.12, h, 0.1, zier, x + sx * (b / 2 + 0.06), y + h / 2, 0.04, { rund: 0.01 });
  if (o.blatt === false) {
    // Öffnung für die Requisite "tuer": dunkler Flur dahinter
    k(eltern, b, h, 0.02, ctx.mat('#1a1410'), x, y + h / 2, -0.05);
    return null;
  }
  const holz = ctx.mat(o.farbe ?? '#7A3B36', { rauheit: 0.65 });
  const blatt = k(eltern, b, h, 0.06, holz, x, y + h / 2, 0.02, { rund: 0.01 });
  const dunkler = ctx.mat(o.leiste ?? '#5a2a26', { rauheit: 0.65 });
  for (const [fy, fh] of [[0.27, 0.36], [0.7, 0.34]]) for (const fx of [-0.22, 0.22]) {
    if (o.fenster && fy > 0.5) continue;
    k(eltern, b * 0.34, h * fh * 0.82, 0.02, dunkler, x + fx * b, y + h * fy, 0.06, { schatten: false });
  }
  if (o.fenster) flaeche(eltern, b * 0.6, h * 0.22, o.glas ?? ctx.mat('#2a3444', { rauheit: 0.25 }), x, y + h * 0.72, 0.056);
  const messing = ctx.mat('#C9A85A', { rauheit: 0.35, metall: 0.8 });
  k(eltern, 0.05, 0.05, 0.06, messing, x + b * 0.38, y + 1.0, 0.08, { rund: 0.02, schatten: false });
  return blatt;
}

// ---------- Veranda (vor einer Fassade, die nach +z zeigt) ----------
// o: { von, bis (x), tiefe, hoehe (Bodenhöhe = Sockel), dach (Höhe der Dachkante), zier, boden, stufenX, stufenB, gelaender }
export function veranda(ctx, eltern, o) {
  const breite = o.bis - o.von, mx = (o.von + o.bis) / 2;
  const zier = o.zier;
  const boden = o.boden ?? tmat(ctx, '#8a7a6a', 'dielen', { rauheit: 0.85 });
  k(eltern, breite, 0.12, o.tiefe, boden, mx, o.hoehe - 0.06, o.tiefe / 2);
  // Gitter unter der Veranda (Lattenrost) und Sockelblende
  // Lattengitter unter der Veranda: offen, damit die Kamera auch darunter stehen kann (Satz 7)
  for (let i = 0; i < Math.floor(breite / 0.2); i++) k(eltern, 0.035, o.hoehe - 0.14, 0.03, zier, o.von + 0.1 + i * 0.2, (o.hoehe - 0.12) / 2, o.tiefe - 0.02, { schatten: true });
  for (let y = 0.1; y < o.hoehe - 0.15; y += 0.16) k(eltern, breite - 0.1, 0.03, 0.03, zier, mx, y, o.tiefe - 0.04, { schatten: true });
  // Unterseite der Dielen (dunkel), Stützen
  const unter = ctx.mat('#3a3430', { rauheit: 0.9 });
  k(eltern, breite, 0.03, o.tiefe, unter, mx, o.hoehe - 0.135, o.tiefe / 2, { schatten: false });
  // Stufen
  const n = Math.max(2, Math.round(o.hoehe / 0.19));
  const sb = o.stufenB ?? 1.4;
  for (let i = 0; i < n; i++) {
    const hS = o.hoehe - (i + 1) * (o.hoehe / n);
    k(eltern, sb, o.hoehe / n, 0.3, boden, o.stufenX, hS + o.hoehe / n / 2, o.tiefe + 0.15 + i * 0.3);
  }
  // Pfosten, Geländer mit Stäben, Dach
  const pfostenX = [o.von + 0.1, ...(o.pfosten ?? []), o.bis - 0.1];
  const dachY = o.dach ?? o.hoehe + 2.7;
  for (const px of pfostenX) k(eltern, 0.14, dachY - o.hoehe, 0.14, zier, px, o.hoehe + (dachY - o.hoehe) / 2, o.tiefe - 0.1, { rund: 0.02 });
  if (o.gelaender !== false) {
    const abschnitte = [[o.von + 0.1, o.stufenX - sb / 2], [o.stufenX + sb / 2, o.bis - 0.1]];
    for (const [a, e] of abschnitte) {
      if (e - a < 0.2) continue;
      k(eltern, e - a, 0.07, 0.1, zier, (a + e) / 2, o.hoehe + 0.9, o.tiefe - 0.1, { rund: 0.015 });
      k(eltern, e - a, 0.05, 0.08, zier, (a + e) / 2, o.hoehe + 0.12, o.tiefe - 0.1);
      for (let x = a + 0.12; x < e - 0.06; x += 0.14) k(eltern, 0.04, 0.78, 0.04, zier, x, o.hoehe + 0.51, o.tiefe - 0.1, { schatten: true });
    }
    // seitliches Geländer
    for (const sx of [o.von + 0.1, o.bis - 0.1]) {
      k(eltern, 0.1, 0.07, o.tiefe - 0.1, zier, sx, o.hoehe + 0.9, o.tiefe / 2 - 0.05, { rund: 0.015 });
      for (let z = 0.15; z < o.tiefe - 0.15; z += 0.14) k(eltern, 0.04, 0.78, 0.04, zier, sx, o.hoehe + 0.51, z);
    }
  }
  // Vordach: flach geneigt, mit Blende
  const dach = o.dachMat ?? ctx.mat('#4a3f3c');
  k(eltern, breite + 0.4, 0.12, o.tiefe + 0.35, dach, mx, dachY + 0.18, o.tiefe / 2 + 0.05, { dreh: [0.12, 0, 0] });
  k(eltern, breite + 0.3, 0.2, 0.08, zier, mx, dachY + 0.02, o.tiefe + 0.12);
  return { boden: o.hoehe };
}

// ---------- Haus ----------
// Lokales System: Fassade bei z = 0 (zeigt nach +z), Körper z ∈ [−tiefe, 0], Boden y = 0.
// o: { breite, tiefe, sockel, eg, og, decke, dach ('quer' | 'giebel'), dachNeigung, farbe, zier, dachFarbe,
//      fenster: [{ x, etage, b, h, unten, licht (Material) }], seitenFenster, tuer: { x, b, h, blatt }, veranda,
//      laeden (Farbe), schornstein, kaesten }
// Rückgabe: { gruppe, anker: { tuer, veranda, fenster_<i> }, glas: [...] }
export function baueHaus(ctx, o) {
  const g = new THREE.Group();
  const b = o.breite, t = o.tiefe, so = o.sockel ?? 0.6, eg = o.eg ?? 3.0, og = o.og ?? 2.8, de = o.decke ?? 0.2;
  const wandH = so + eg + de + og;
  const wand = tmat(ctx, o.farbe, 'verkleidung', { rauheit: 0.85 });
  const zier = ctx.mat(o.zier ?? '#F2EFE7', { rauheit: 0.6 });
  const sockel = tmat(ctx, '#9a948a', 'stein', { rauheit: 0.95 });
  const dachMat = tmat(ctx, o.dachFarbe ?? '#4a3f3c', 'schindeln', { rauheit: 0.9 });
  const glasDunkel = o.glasDunkel ?? ctx.mat('#1e2836', { rauheit: 0.2, metall: 0.35 });
  k(g, b + 0.08, so, t + 0.08, sockel, 0, so / 2, -t / 2);
  k(g, b, wandH - so, t, wand, 0, so + (wandH - so) / 2, -t / 2);
  // Eckbretter, Gurtgesims, Traufbrett
  for (const sx of [-1, 1]) for (const zz of [0, -t]) k(g, 0.16, wandH - so, 0.16, zier, sx * b / 2, so + (wandH - so) / 2, zz, { rund: 0.01 });
  k(g, b + 0.08, 0.14, t + 0.08, zier, 0, so + eg + de / 2, -t / 2);
  k(g, b + 0.12, 0.22, t + 0.12, zier, 0, wandH - 0.1, -t / 2);

  // Dach
  const a = ((o.dachNeigung ?? 34) * Math.PI) / 180;
  const ueber = 0.45;
  if ((o.dach ?? 'quer') === 'quer') {
    const halb = t / 2, steig = halb * Math.tan(a);
    const lang = (halb + ueber) / Math.cos(a);
    for (const s of [1, -1]) {
      const zM = -halb + s * (halb + ueber) / 2;
      const yM = wandH + steig - ((halb + ueber) / 2) * Math.tan(a) + 0.09 / Math.cos(a);
      k(g, b + 0.7, 0.16, lang, dachMat, 0, yM, zM, { dreh: [s * a, 0, 0] });
    }
    k(g, b + 0.75, 0.16, 0.24, ctx.mat('#3a302d'), 0, wandH + steig + 0.1, -halb, { rund: 0.04 });
    for (const sx of [-1, 1]) giebel(g, t, steig, wand, sx * (b / 2), wandH, -halb, sx * Math.PI / 2);
    if (o.giebelFenster) for (const sx of [-1, 1]) {
      const gg = new THREE.Group(); gg.position.set(sx * b / 2, wandH + 0.25, -halb); gg.rotation.y = sx * Math.PI / 2; g.add(gg);
      fenster(ctx, gg, 0, 0, { b: 0.7, h: 0.8, zier, glas: glasDunkel });
    }
  } else {
    const halb = b / 2, steig = halb * Math.tan(a);
    const lang = (halb + ueber) / Math.cos(a);
    for (const s of [1, -1]) {
      const xM = s * (halb + ueber) / 2;
      const yM = wandH + steig - ((halb + ueber) / 2) * Math.tan(a) + 0.09 / Math.cos(a);
      k(g, lang, 0.16, t + 0.8, dachMat, xM, yM, -t / 2, { dreh: [0, 0, -s * a] });
    }
    k(g, 0.24, 0.16, t + 0.85, ctx.mat('#3a302d'), 0, wandH + steig + 0.1, -t / 2, { rund: 0.04 });
    giebel(g, b, steig, wand, 0, wandH, 0, 0);
    giebel(g, b, steig, wand, 0, wandH, -t, Math.PI);
    // Giebelfenster vorn (rund wirkt als Raute)
    const gf = fenster(ctx, g, 0, wandH + 0.35, { b: 0.75, h: 0.85, zier, glas: o.giebelLicht ?? glasDunkel });
    g.userData.giebelGlas = gf;
  }
  if (o.schornstein) {
    const sh = o.schornstein;
    k(g, 0.7, 2.8, 0.7, tmat(ctx, '#8a4a3a', 'stein'), sh[0], wandH + 1.6, sh[1]);
    k(g, 0.82, 0.14, 0.82, ctx.mat('#5a3a2e'), sh[0], wandH + 3.05, sh[1]);
  }
  // Regenrinne und Fallrohr
  const rinne = ctx.mat('#cfcac0', { rauheit: 0.5, metall: 0.3 });
  if ((o.dach ?? 'quer') === 'quer') k(g, b + 0.6, 0.1, 0.12, rinne, 0, wandH - 0.05, ueber - 0.05, { schatten: false });
  k(g, 0.08, wandH - 0.2, 0.08, rinne, b / 2 - 0.2, (wandH - 0.2) / 2, 0.06);

  // Fenster
  const anker = {};
  const glasListe = [];
  (o.fenster ?? []).forEach((f, i) => {
    const y = so + (f.etage ? eg + de : 0) + (f.unten ?? 0.9);
    const gl = fenster(ctx, g, f.x, y, { b: f.b ?? 1.2, h: f.h ?? 1.4, zier, glas: f.licht ?? glasDunkel, laeden: o.laeden ? ctx.mat(o.laeden, { rauheit: 0.7 }) : null, kasten: o.kaesten && f.etage === 0 ? ctx.mat('#6a4a32') : null, blumen: ctx.mat('#c05a4a'), einzeln: !!f.licht });
    glasListe.push(gl);
    const p = new THREE.Object3D(); p.position.set(f.x, y + (f.h ?? 1.4) / 2, 0.05); g.add(p); anker[`fenster_${i}`] = p;
  });
  // Seitenfenster: { seite: 'links' | 'rechts' | 'hinten', z | x, etage, b, h, unten, licht }
  (o.seitenFenster ?? []).forEach((f) => {
    const y = so + (f.etage ? eg + de : 0) + (f.unten ?? 0.9);
    const sg = new THREE.Group();
    if (f.seite === 'hinten') { sg.position.set(f.x ?? 0, 0, -t); sg.rotation.y = Math.PI; }
    else { const sx = f.seite === 'rechts' ? 1 : -1; sg.position.set(sx * b / 2, 0, f.z ?? -t / 2); sg.rotation.y = sx * Math.PI / 2; }
    g.add(sg);
    glasListe.push(fenster(ctx, sg, 0, y, { b: f.b ?? 1.1, h: f.h ?? 1.3, zier, glas: f.licht ?? glasDunkel, einzeln: !!f.licht }));
  });
  if (o.tuer) {
    haustuer(ctx, g, o.tuer.x, so, { b: o.tuer.b ?? 1.0, h: o.tuer.h ?? 2.2, zier, farbe: o.tuerFarbe, blatt: o.tuer.blatt, fenster: o.tuer.fenster ?? true });
    const p = new THREE.Object3D(); p.position.set(o.tuer.x, so + 1.1, 0.1); g.add(p); anker.tuer = p;
  }
  // Requisiten-Dichte wie in r2: Wandlampe an der Tür, Blumenbeete vor dem Sockel, Möbel auf der Veranda
  if (o.tuer && o.tuerLampe) {
    const lx = o.tuer.x + (o.tuer.b ?? 1.0) / 2 + 0.35;
    k(g, 0.14, 0.22, 0.12, o.tuerLampe, lx, so + 2.0, (o.veranda ? 0 : 0) + 0.1, { rund: 0.03, schatten: false }).userData.einzeln = true;
    k(g, 0.18, 0.05, 0.16, ctx.mat('#24262b', { metall: 0.5, rauheit: 0.5 }), lx, so + 2.13, 0.1);
  }
  if (o.beete) {
    const erde = tmat(ctx, '#4a3a2c', 'erde', { rauheit: 1 });
    const vVon = o.veranda ? o.veranda.von - 0.2 : 99, vBis = o.veranda ? o.veranda.bis + 0.2 : -99;
    const zuf = o.zufall ?? zufallsQuelle(7); // nie Math.random (Regel 1 der Modul-Autoren)
    const bluete = ['#c05a4a', '#e8c06a', '#d88aa0', '#f2efe7', '#8a6ac0'];
    for (const [a0, e0] of [[-b / 2 + 0.2, Math.min(vVon, b / 2 - 0.2)], [Math.max(vBis, -b / 2 + 0.2), b / 2 - 0.2]]) {
      if (e0 - a0 < 0.8) continue;
      k(g, e0 - a0, 0.16, 0.6, erde, (a0 + e0) / 2, 0.08, 0.34, { schatten: false });
      for (let x = a0 + 0.25; x < e0 - 0.15; x += 0.32 + zuf() * 0.2) {
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13 + zuf() * 0.08, 0), ctx.mat(zuf() < 0.5 ? '#4f7a3a' : '#5d8a42', { flach: true, rauheit: 0.9 }));
        m.position.set(x, 0.24, 0.32 + (zuf() - 0.5) * 0.2); m.castShadow = true; m.receiveShadow = true; g.add(m);
        k(g, 0.07, 0.07, 0.07, ctx.mat(bluete[Math.floor(zuf() * bluete.length)], { rauheit: 0.8 }), x + 0.05, 0.36, 0.4, { schatten: false });
      }
    }
  }
  if (o.veranda) {
    const v = o.veranda;
    veranda(ctx, g, { von: v.von, bis: v.bis, tiefe: v.tiefe ?? 2.2, hoehe: so, dach: so + eg - 0.1, zier, stufenX: v.stufenX ?? o.tuer?.x ?? (v.von + v.bis) / 2, stufenB: v.stufenB ?? 1.3, pfosten: v.pfosten, dachMat: ctx.mat(o.dachFarbe ?? '#4a3f3c') });
    const p = new THREE.Object3D(); p.position.set((v.von + v.bis) / 2, so, (v.tiefe ?? 2.2) / 2); g.add(p); anker.veranda = p;
    if (o.verandaMoebel) {
      // Schaukelstuhl-Klotz und Pflanzkübel an der Seite, die nicht vor der Tür liegt
      const mx = (o.tuer?.x ?? 0) > (v.von + v.bis) / 2 ? v.von + 0.7 : v.bis - 0.7;
      const holz = tmat(ctx, '#7a5a3a', 'holz', { rauheit: 0.8 });
      k(g, 0.55, 0.06, 0.5, holz, mx, so + 0.42, 0.9, { rund: 0.01 });
      for (const sx of [-0.22, 0.22]) for (const sz of [-0.2, 0.2]) k(g, 0.05, 0.42, 0.05, holz, mx + sx, so + 0.21, 0.9 + sz);
      k(g, 0.55, 0.55, 0.05, holz, mx, so + 0.72, 0.66, { rund: 0.01, dreh: [-0.15, 0, 0] });
      k(g, 0.36, 0.36, 0.36, ctx.mat('#a0583a', { rauheit: 0.8 }), mx + (mx > 0 ? -0.6 : 0.6), so + 0.18, 1.7, { rund: 0.04 });
      const pfl = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 1), ctx.mat('#4f7a3a', { flach: true, rauheit: 0.9 }));
      pfl.position.set(mx + (mx > 0 ? -0.6 : 0.6), so + 0.55, 1.7); pfl.castShadow = true; g.add(pfl);
    }
  }
  return { gruppe: g, anker, glas: glasListe, wandH };
}

// ---------- Straßenmöbel und Natur ----------
// Lattenzaun entlang x (von a bis e), Höhe h, mit optionaler Lücke (Tor) [von, bis]
export function zaun(ctx, eltern, a, e, z, o = {}) {
  const farbe = ctx.mat(o.farbe ?? '#EDEAE2', { rauheit: 0.7 });
  const h = o.hoehe ?? 0.95;
  const luecke = o.luecke;
  for (let x = a; x <= e; x += 0.16) {
    if (luecke && x > luecke[0] && x < luecke[1]) continue;
    k(eltern, 0.08, h, 0.035, farbe, x, h / 2, z, { schatten: true });
    k(eltern, 0.056, 0.056, 0.035, farbe, x, h + 0.01, z, { dreh: [0, 0, Math.PI / 4], schatten: false });
  }
  const abschnitte = luecke ? [[a, luecke[0]], [luecke[1], e]] : [[a, e]];
  for (const [x0, x1] of abschnitte) for (const yy of [h * 0.25, h * 0.72]) k(eltern, x1 - x0, 0.06, 0.03, farbe, (x0 + x1) / 2, yy, z - 0.03, { schatten: false });
}

// Straßenlaterne: Mast, Arm, Leuchte (eigenes Leuchtmaterial je Gruppe), Lichtpfütze am Boden.
// Gibt { kopf, pfuetze } zurück; beide sind userData.einzeln (für Licht-Ereignisse).
export function laterne(ctx, eltern, x, z, o = {}) {
  const mast = ctx.mat('#24262b', { rauheit: 0.55, metall: 0.4 });
  const richtung = o.richtung ?? 1; // Arm zeigt nach +x (1) oder −x (−1)
  zyl(eltern, 0.06, 0.09, 4.3, mast, x, 2.15, z, { segmente: 8 });
  zyl(eltern, 0.14, 0.16, 0.3, mast, x, 0.15, z, { segmente: 8 });
  k(eltern, 0.7, 0.07, 0.07, mast, x + richtung * 0.32, 4.25, z);
  k(eltern, 0.42, 0.12, 0.42, mast, x + richtung * 0.62, 4.24, z, { rund: 0.03 });
  const leucht = o.material ?? ctx.leuchtMat('#ffd9a0', 5);
  const kopf = k(eltern, 0.3, 0.16, 0.3, leucht, x + richtung * 0.62, 4.12, z, { schatten: false });
  kopf.userData.einzeln = true;
  let pfuetze = null;
  if (o.pfuetze !== false) pfuetze = lichtPfuetze(ctx, eltern, x + richtung * 0.62, z, o.pfuetzeMat, o.radius ?? 3.2);
  return { kopf, pfuetze, leucht };
}

// Lichtpfütze: weicher heller Fleck auf dem Boden (additiv), ersetzt ein teures Punktlicht.
// Material leuchtet über emissive, damit Licht-Ereignisse es mit ausschalten.
export function lichtPfuetzeMat(ctx, farbe = '#ffb874', staerke = 0.55) {
  const tex = ctx.zeichenTextur((g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, '#a0a0a0'); gr.addColorStop(1, '#000000');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }, 128, 128);
  const m = new THREE.MeshStandardMaterial({ color: '#000000', emissive: new THREE.Color(farbe), emissiveIntensity: staerke, emissiveMap: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, roughness: 1 });
  m.fog = false;
  return m;
}
export function lichtPfuetze(ctx, eltern, x, z, material, radius = 3.2, y = 0.03) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), material ?? lichtPfuetzeMat(ctx));
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  m.userData.einzeln = true;
  m.renderOrder = 2;
  eltern.add(m);
  return m;
}

// Laubbaum wie in r2: Stamm plus runde, flach schattierte Kronenklumpen
export function laubbaum(ctx, eltern, x, z, zufall, o = {}) {
  const s = o.groesse ?? 1;
  const stamm = ctx.mat('#5a4030', { rauheit: 0.9 });
  const farben = o.farben ?? ['#4f7a3a', '#5d8a42', '#46703a'];
  zyl(eltern, 0.1 * s, 0.15 * s, 2.2 * s, stamm, x, 1.1 * s, z, { segmente: 7 });
  const n = 4 + Math.floor(zufall() * 3);
  for (let i = 0; i < n; i++) {
    const r = (0.8 + zufall() * 0.6) * s;
    const geo = new THREE.IcosahedronGeometry(r, 1);
    const m = new THREE.Mesh(geo, ctx.mat(farben[i % farben.length], { rauheit: 0.9, flach: true }));
    m.position.set(x + (zufall() - 0.5) * 1.4 * s, (2.6 + zufall() * 1.4) * s, z + (zufall() - 0.5) * 1.4 * s);
    m.castShadow = true; m.receiveShadow = true;
    eltern.add(m);
  }
}

// Kiefer: gestapelte Kegel (Straßenende, Waldrand)
export function kiefer(ctx, eltern, x, z, zufall, o = {}) {
  const s = (o.groesse ?? 1) * (0.8 + zufall() * 0.5);
  const stamm = ctx.mat('#4a3426', { rauheit: 0.9 });
  const nadel = ctx.mat(o.farbe ?? '#2c4632', { rauheit: 0.9, flach: true });
  zyl(eltern, 0.12 * s, 0.2 * s, 2.4 * s, stamm, x, 1.2 * s, z, { segmente: 6 });
  for (let i = 0; i < 4; i++) {
    const r = (2.0 - i * 0.4) * s, h = (2.4 - i * 0.3) * s;
    zyl(eltern, 0, r, h, nadel, x, (2.2 + i * 1.5) * s + h / 2, z, { segmente: 7 });
  }
}

// Busch: drei Kugeln
export function busch(ctx, eltern, x, z, zufall, farbe = '#4a6e3a', s = 1) {
  for (let i = 0; i < 3; i++) {
    const r = (0.35 + zufall() * 0.25) * s;
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), ctx.mat(farbe, { rauheit: 0.95, flach: true }));
    m.position.set(x + (zufall() - 0.5) * 0.7 * s, r * 0.8, z + (zufall() - 0.5) * 0.5 * s);
    m.castShadow = true; m.receiveShadow = true;
    eltern.add(m);
  }
}

export function briefkasten(ctx, eltern, x, z, farbe = '#2f3e5c', drehY = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = drehY; eltern.add(g);
  k(g, 0.08, 1.0, 0.08, ctx.mat('#5a4a3a'), 0, 0.5, 0);
  k(g, 0.24, 0.24, 0.45, ctx.mat(farbe, { rauheit: 0.5, metall: 0.3 }), 0, 1.1, 0, { rund: 0.05 });
  k(g, 0.03, 0.14, 0.05, ctx.mat('#c0392b'), 0.13, 1.18, -0.1);
}

export function bank(ctx, eltern, x, z, drehY = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = drehY; eltern.add(g);
  const holz = tmat(ctx, '#7a5a3a', 'holz', { rauheit: 0.8 });
  const eisen = ctx.mat('#25272b', { rauheit: 0.5, metall: 0.5 });
  for (let i = 0; i < 3; i++) k(g, 1.8, 0.05, 0.12, holz, 0, 0.45, -0.15 + i * 0.15, { rund: 0.01 });
  for (let i = 0; i < 2; i++) k(g, 1.8, 0.12, 0.04, holz, 0, 0.66 + i * 0.16, -0.27, { rund: 0.01, dreh: [-0.15, 0, 0] });
  for (const sx of [-0.75, 0.75]) { k(g, 0.06, 0.45, 0.45, eisen, sx, 0.22, 0); k(g, 0.06, 0.5, 0.06, eisen, sx, 0.7, -0.28); }
}

// Nebelbank: große, weiche, halbtransparente Flächen (vom Himmelslicht beleuchtet, passt zu jedem Preset)
export function nebelKarte(ctx, eltern, x, y, z, b, h, drehY = 0, deckkraft = 0.45) {
  const tex = ctx.zeichenTextur((g, w, hh) => {
    const gr = g.createLinearGradient(0, 0, 0, hh);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,1)');
    g.fillStyle = gr; g.fillRect(0, 0, w, hh);
    const seiten = g.createLinearGradient(0, 0, w, 0);
    seiten.addColorStop(0, 'rgba(0,0,0,1)'); seiten.addColorStop(0.2, 'rgba(0,0,0,0)'); seiten.addColorStop(0.8, 'rgba(0,0,0,0)'); seiten.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = seiten; g.fillRect(0, 0, w, hh);
  }, 64, 64);
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', alphaMap: tex, transparent: true, opacity: deckkraft, depthWrite: false, roughness: 1, side: THREE.DoubleSide });
  m.alphaMap = null; m.map = tex;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(b, h), m);
  mesh.position.set(x, y, z); mesh.rotation.y = drehY;
  mesh.userData.einzeln = true;
  mesh.renderOrder = 3;
  eltern.add(mesh);
  return mesh;
}

// ---------- Innenwände ----------
// Wand von (x0,z0) nach (x1,z1) in der Ebene, Fuß bei y0, Höhe h, Dicke d.
// Öffnungen: [{ pos (m ab Wandanfang, Mitte), b, unten, h }]. Seite A (links der Laufrichtung) bekommt
// matA, Seite B matB: zwei halbe Wanddicken nebeneinander, so hat jedes Zimmer seine eigene Wandfarbe.
export function wand(eltern, x0, z0, x1, z1, y0, h, d, matA, matB, oeffnungen = []) {
  const L = Math.hypot(x1 - x0, z1 - z0);
  const g = new THREE.Group();
  g.position.set(x0, y0, z0);
  g.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
  eltern.add(g);
  // Wand in Stücke zerlegen: Bereiche ohne Öffnung voll, über/unter Öffnungen Teilstücke
  const sortiert = [...oeffnungen].sort((a, b) => a.pos - b.pos);
  const stuecke = [];
  let x = 0;
  for (const o of sortiert) {
    const a = o.pos - o.b / 2, e = o.pos + o.b / 2;
    if (a > x) stuecke.push([x, a, 0, h]);
    if (o.unten > 0) stuecke.push([a, e, 0, o.unten]);
    if (o.unten + o.h < h) stuecke.push([a, e, o.unten + o.h, h]);
    x = e;
  }
  if (x < L) stuecke.push([x, L, 0, h]);
  for (const [a, e, u, o] of stuecke) {
    for (const [mat, off] of [[matA, -d / 4], [matB ?? matA, d / 4]]) {
      k(g, e - a, o - u, d / 2, mat, (a + e) / 2, (u + o) / 2, off, { schatten: true });
    }
  }
  return g;
}

// Fensterlaibung und -rahmen für Innenwände (Fenster in der Außenwand, von innen gesehen).
export function innenFenster(ctx, eltern, x, y, b, h, zier, drehY = 0, dicke = 0.3) {
  const g = new THREE.Group(); g.position.set(x, y, 0); g.rotation.y = drehY; eltern.add(g);
  k(g, b + 0.2, 0.06, dicke * 0.5 + 0.1, zier, 0, -0.03, 0.05);
  for (const sx of [-1, 1]) k(g, 0.06, h, 0.06, zier, sx * (b / 2 + 0.03), h / 2, 0.03);
  k(g, b + 0.12, 0.06, 0.06, zier, 0, h + 0.03, 0.03);
  k(g, 0.04, h, 0.03, zier, 0, h / 2, -0.03, { schatten: false });
  k(g, b, 0.04, 0.03, zier, 0, h * 0.55, -0.03, { schatten: false });
  return g;
}
