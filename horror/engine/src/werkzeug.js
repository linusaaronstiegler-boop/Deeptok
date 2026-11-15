// Werkzeugkasten für Set- und Figurenmodule (das "ctx"-Objekt).
// Module sollen damit bauen statt three.js direkt zu verdrahten: So bleiben Materialien geteilt
// (weniger Shader-Programme, schnelleres Rendern) und Schatten einheitlich eingestellt.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { zufallFuer } from './zufall.js';

export function baueWerkzeug({ seed, engineUrl, basisUrl, renderer }) {
  const materialCache = new Map();
  const geoCache = new Map();
  const gltfLader = new GLTFLoader();

  // Matt-Material im Low-Poly-Stil. Gleiche Parameter -> dasselbe Material (geteilt).
  function mat(farbe, opt = {}) {
    const schluessel = JSON.stringify([farbe, opt]);
    if (opt.eigenes !== true && materialCache.has(schluessel)) return materialCache.get(schluessel);
    const m = new THREE.MeshStandardMaterial({
      color: new THREE.Color(farbe),
      roughness: opt.rauheit ?? 0.88,
      metalness: opt.metall ?? 0,
      flatShading: opt.flach ?? false,
    });
    if (opt.leuchten) {
      m.emissive = new THREE.Color(opt.leuchten);
      m.emissiveIntensity = opt.leuchtStaerke ?? 1;
    }
    if (opt.karte) m.map = opt.karte;
    if (opt.transparent) { m.transparent = true; m.opacity = opt.deckkraft ?? 1; }
    if (opt.eigenes !== true) materialCache.set(schluessel, m);
    return m;
  }

  // Selbstleuchtendes Material (Fenster, Laternen, Monster-Augen). Werte > 1 erzeugen Bloom.
  function leuchtMat(farbe, staerke = 2, opt = {}) {
    return mat(farbe, { ...opt, leuchten: farbe, leuchtStaerke: staerke, eigenes: opt.eigenes ?? true });
  }

  function geometrie(schluessel, bauen) {
    if (!geoCache.has(schluessel)) geoCache.set(schluessel, bauen());
    return geoCache.get(schluessel);
  }

  // Kiste mit optional abgerundeten Kanten. Der Ursprung liegt in der Mitte der Kiste.
  // opt.rund = Radius der Rundung in m (0 = scharfe Kanten), opt.schatten = false schaltet Schatten ab.
  function kiste(b, h, t, material, opt = {}) {
    const r = Math.min(opt.rund ?? 0, b / 2, h / 2, t / 2);
    const geo = geometrie(`kiste|${b}|${h}|${t}|${r}`, () => (r > 0 ? new RoundedBoxGeometry(b, h, t, 2, r) : new THREE.BoxGeometry(b, h, t)));
    const m = new THREE.Mesh(geo, material);
    m.castShadow = opt.schatten !== false;
    m.receiveShadow = opt.empfangen !== false;
    return m;
  }

  function zylinder(rOben, rUnten, h, material, opt = {}) {
    const seg = opt.segmente ?? 8;
    const geo = geometrie(`zyl|${rOben}|${rUnten}|${h}|${seg}`, () => new THREE.CylinderGeometry(rOben, rUnten, h, seg));
    const m = new THREE.Mesh(geo, material);
    m.castShadow = opt.schatten !== false;
    m.receiveShadow = opt.empfangen !== false;
    return m;
  }

  function kugel(r, material, opt = {}) {
    const geo = geometrie(`kugel|${r}|${opt.segmente ?? 12}`, () => new THREE.SphereGeometry(r, opt.segmente ?? 12, Math.max(6, (opt.segmente ?? 12) >> 1)));
    const m = new THREE.Mesh(geo, material);
    m.castShadow = opt.schatten !== false;
    m.receiveShadow = opt.empfangen !== false;
    return m;
  }

  // Objekt an eine Stelle setzen und an ein Elternobjekt hängen (spart Zeilen in Modulen).
  function setze(obj, eltern, x = 0, y = 0, z = 0, drehY = 0) {
    obj.position.set(x, y, z);
    obj.rotation.y = drehY;
    if (eltern) eltern.add(obj);
    return obj;
  }

  // Textur aus einer Zeichenfunktion (Gesichter, Schilder). zeichne(g2d, breite, hoehe).
  function zeichenTextur(zeichne, breite = 256, hoehe = breite) {
    const c = document.createElement('canvas');
    c.width = breite; c.height = hoehe;
    zeichne(c.getContext('2d'), breite, hoehe);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  // Gesichter tauschen: ein Material, dessen Karte je Ausdruck ausgetauscht wird (Tausch in 1 Bild).
  // ausdruecke = { neutral: (g, w, h) => {...}, erschrocken: ... }
  function gesichtsSatz(ausdruecke, opt = {}) {
    const karten = {};
    for (const [name, zeichne] of Object.entries(ausdruecke)) karten[name] = zeichenTextur(zeichne, opt.groesse ?? 256);
    const material = new THREE.MeshStandardMaterial({ map: karten[opt.start ?? Object.keys(karten)[0]], roughness: 0.8 });
    let aktuell = null;
    return {
      material,
      namen: Object.keys(karten),
      setze(name) {
        if (name === aktuell) return;
        const k = karten[name];
        if (!k) throw new Error(`Gesicht "${name}" fehlt. Vorhanden: ${Object.keys(karten).join(', ')}`);
        material.map = k;
        aktuell = name;
      },
    };
  }

  // CC0-Modelle laden (Kenney, Quaternius …). Pfad relativ zu engine/assets/ oder volle URL.
  // Lizenz jedes Pakets in engine/assets/LICENSES.md eintragen.
  async function ladeModell(pfad) {
    const url = /^(https?:|\/)/.test(pfad) ? pfad : `${engineUrl}assets/${pfad}`;
    const gltf = await gltfLader.loadAsync(url);
    gltf.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return gltf;
  }

  async function ladeTextur(pfad) {
    const url = /^(https?:|\/)/.test(pfad) ? pfad : `${engineUrl}assets/${pfad}`;
    const t = await new THREE.TextureLoader().loadAsync(url);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  // Statische Teile eines Sets zusammenfassen: ein Mesh je Material statt hunderter Kisten.
  // Software-Rendering zahlt pro Zeichenaufruf; ein Straßenzug wird so deutlich schneller.
  // Nur für Teile, die sich nie bewegen und kein eigenes Licht-Ereignis brauchen.
  function verschmelzen(gruppe) {
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
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, o.matrixWorld));
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

  return {
    THREE,
    seed,
    engineUrl,
    basisUrl,
    renderer,
    // Jedes Modul bekommt seinen eigenen Zufall: ctx.zufall("strasse") -> () => Zahl in [0,1)
    zufall: (...teile) => zufallFuer(seed, ...teile),
    mat, leuchtMat, kiste, zylinder, kugel, setze, zeichenTextur, gesichtsSatz, ladeModell, ladeTextur, verschmelzen,
  };
}
