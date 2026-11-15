// Licht und Stimmung. Ziel-Look ist r2 (@jexario): weiches Licht, Dunst, violette Dämmerung,
// blaue Nacht mit warmen Fenstern. Es gibt immer dieselben Lichter (Himmel/Boden, Haupt,
// Kante), Presets ändern nur Farben und Stärken. Grund: Ändert sich die Zahl der Lichter,
// kompiliert three.js alle Shader neu, und das kostet mitten im Render Sekunden.
//
// Lichtereignisse (Spec 1.6): "Licht aus" in 0,3–0,5 s, 30–55 % dunkler, als Handlung auf dem
// Verb; gestaffelt über ~1 s (Laternen nacheinander). Ein Ereignis setzt einen Faktor auf einer
// Lichtgruppe; der Faktor wird wie eine Aktion abgespielt und danach gehalten.

import * as THREE from 'three';
import { fortschritt, mischen, easeFunktion } from './ease.js';
import { rauschen, hash } from './zufall.js';

// Richtungen zeigen ZUM Licht (von der Szene aus gesehen).
export const PRESETS = {
  nacht: {
    himmel: { zenit: '#050a1e', horizont: '#1f2d55', scheibe: { richtung: [-0.42, 0.5, -0.76], farbe: '#e6eeff', groesse: 1.6, staerke: 6, glanz: 0.35 }, sterne: 0.7 },
    nebel: { farbe: '#18244a', dichte: 0.03 },
    hemi: { himmel: '#6378c0', boden: '#141826', staerke: 1.05 },
    haupt: { farbe: '#a6bcff', staerke: 1.5, richtung: [-0.42, 0.75, -0.5], weich: 3 },
    kante: { farbe: '#5070ff', staerke: 0.6, richtung: [0.55, 0.45, -0.7] },
    belichtung: 1.2,
    grade: { saettigung: 1.04, kontrast: 1.05, faerbung: [0.97, 1.0, 1.07] },
  },
  daemmerung: {
    himmel: { zenit: '#2a2b62', horizont: '#f0a49c', scheibe: { richtung: [0.72, 0.07, -0.69], farbe: '#ffd7a8', groesse: 2.4, staerke: 5, glanz: 0.6 }, sterne: 0 },
    nebel: { farbe: '#a68aa9', dichte: 0.017 },
    hemi: { himmel: '#c8a8e2', boden: '#3d2b36', staerke: 1.25 },
    haupt: { farbe: '#ffb48a', staerke: 2.1, richtung: [0.7, 0.32, -0.62], weich: 3 },
    kante: { farbe: '#8c7dff', staerke: 0.4, richtung: [-0.6, 0.5, 0.6] },
    belichtung: 1.0,
    grade: { saettigung: 1.06, kontrast: 1.03, faerbung: [1.03, 0.99, 1.0] },
  },
  // Warmes Innenlicht (Familie, Esstisch). Den Raum hellen Lampen aus dem Set auf.
  innen_warm: {
    himmel: { zenit: '#1a1410', horizont: '#2a2018', sterne: 0 },
    nebel: { farbe: '#2a2018', dichte: 0.012 },
    hemi: { himmel: '#ffe2c0', boden: '#4a3628', staerke: 1.1 },
    haupt: { farbe: '#ffd2a0', staerke: 1.3, richtung: [0.3, 0.9, 0.35], weich: 4 },
    kante: { farbe: '#9fb0ff', staerke: 0.25, richtung: [-0.5, 0.4, -0.7] },
    belichtung: 1.05,
    grade: { saettigung: 1.0, kontrast: 1.03, faerbung: [1.04, 1.0, 0.95] },
  },
  // Tag: die "normale" Welt (Regeln erklären, Alltag).
  tag: {
    himmel: { zenit: '#4f86d8', horizont: '#cfe3f5', sterne: 0 },
    nebel: { farbe: '#c4d6e8', dichte: 0.008 },
    hemi: { himmel: '#d8e8ff', boden: '#5a5040', staerke: 1.4 },
    haupt: { farbe: '#fff1dc', staerke: 2.6, richtung: [0.45, 0.8, 0.4], weich: 2.5 },
    kante: { farbe: '#bcd4ff', staerke: 0.3, richtung: [-0.5, 0.4, -0.7] },
    belichtung: 0.95,
    grade: { saettigung: 1.02, kontrast: 1.02, faerbung: [1, 1, 1] },
  },
};

const HIMMEL_VS = /* glsl */`
varying vec3 vRichtung;
void main() {
  vec4 welt = modelMatrix * vec4(position, 1.0);
  vRichtung = welt.xyz - cameraPosition;
  gl_Position = projectionMatrix * viewMatrix * welt;
  gl_Position.z = gl_Position.w; // immer ganz hinten
}`;

const HIMMEL_FS = /* glsl */`
uniform vec3 uZenit, uHorizont, uScheibeFarbe, uScheibeRichtung;
uniform float uScheibeGroesse, uScheibeStaerke, uGlanz, uSterne, uHelligkeit;
varying vec3 vRichtung;
float hash3(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
void main() {
  vec3 d = normalize(vRichtung);
  float h = clamp(d.y, -1.0, 1.0);
  // Verlauf: Horizont unten, Zenit oben; unter dem Horizont bleibt Dunst-Farbe.
  vec3 farbe = mix(uHorizont, uZenit, pow(max(h, 0.0), 0.55));
  float c = dot(d, normalize(uScheibeRichtung));
  float rad = radians(uScheibeGroesse);
  float scheibe = smoothstep(cos(rad), cos(rad * 0.82), c);
  // Hof um Mond/Sonne: eng und hell plus ein schwacher weiter Schein.
  float glanz = pow(max(c, 0.0), 96.0) * uGlanz + pow(max(c, 0.0), 12.0) * uGlanz * 0.06;
  farbe += uScheibeFarbe * (scheibe * uScheibeStaerke + glanz);
  // Sterne: feines Raster auf der Himmelskugel, nur hoch am Himmel.
  if (uSterne > 0.0) {
    vec3 zelle = floor(d * 700.0);
    float s = step(0.9993, hash3(zelle)) * smoothstep(0.15, 0.5, h);
    farbe += vec3(s * uSterne * 1.5);
  }
  gl_FragColor = vec4(farbe * uHelligkeit, 1.0);
}`;

export class Licht {
  constructor(szene) {
    this.szene = szene;
    // Feste Lichter: Anzahl ändert sich nie (siehe oben).
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 1);
    this.haupt = new THREE.DirectionalLight(0xffffff, 1);
    this.haupt.castShadow = true;
    this.haupt.shadow.mapSize.set(2048, 2048);
    this.haupt.shadow.bias = -0.0004;
    this.haupt.shadow.normalBias = 0.02;
    this.kante = new THREE.DirectionalLight(0xffffff, 0.5);
    szene.add(this.hemi, this.haupt, this.haupt.target, this.kante, this.kante.target);

    szene.fog = new THREE.FogExp2(0x000000, 0.02);

    this.himmelMat = new THREE.ShaderMaterial({
      vertexShader: HIMMEL_VS,
      fragmentShader: HIMMEL_FS,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uZenit: { value: new THREE.Color() }, uHorizont: { value: new THREE.Color() },
        uScheibeFarbe: { value: new THREE.Color() }, uScheibeRichtung: { value: new THREE.Vector3(0, 1, 0) },
        uScheibeGroesse: { value: 2 }, uScheibeStaerke: { value: 0 }, uGlanz: { value: 0 },
        uSterne: { value: 0 }, uHelligkeit: { value: 1 },
      },
    });
    this.himmel = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), this.himmelMat);
    this.himmel.frustumCulled = false;
    this.himmel.renderOrder = -1;
    szene.add(this.himmel);

    this.gruppen = new Map(); // Lichtgruppen für Ereignisse: id -> { lichter, materialien, basis }
    this.ereignisse = [];
    this.preset = null;
    this.basis = {};
  }

  // Preset anwenden (bei jedem Schnitt, falls die Einstellung ein anderes "licht" hat).
  // aenderungen: Teil-Überschreibungen aus episode.look.licht oder einstellung.licht_anpassung.
  setzePreset(name, aenderungen = {}) {
    const basis = PRESETS[name];
    if (!basis) throw new Error(`Unbekanntes Licht-Preset "${name}". Erlaubt: ${Object.keys(PRESETS).join(', ')}`);
    const p = tiefMischen(basis, aenderungen);
    const schluessel = name + JSON.stringify(aenderungen);
    if (this.presetSchluessel === schluessel) return p;
    this.presetSchluessel = schluessel;
    this.preset = p;
    const u = this.himmelMat.uniforms;
    u.uZenit.value.set(p.himmel.zenit);
    u.uHorizont.value.set(p.himmel.horizont);
    const sch = p.himmel.scheibe;
    u.uScheibeStaerke.value = sch ? sch.staerke : 0;
    u.uGlanz.value = sch ? sch.glanz : 0;
    if (sch) {
      u.uScheibeFarbe.value.set(sch.farbe);
      u.uScheibeRichtung.value.set(...sch.richtung).normalize();
      u.uScheibeGroesse.value = sch.groesse;
    }
    u.uSterne.value = p.himmel.sterne ?? 0;
    this.szene.fog.color.set(p.nebel.farbe ?? p.himmel.horizont);
    this.szene.fog.density = p.nebel.dichte;
    this.hemi.color.set(p.hemi.himmel);
    this.hemi.groundColor.set(p.hemi.boden);
    this.haupt.color.set(p.haupt.farbe);
    this.haupt.shadow.radius = p.haupt.weich ?? 3;
    this.kante.color.set(p.kante.farbe);
    this.basis = { hemi: p.hemi.staerke, haupt: p.haupt.staerke, kante: p.kante.staerke };
    return p;
  }

  // Schattenbereich auf den Bildinhalt legen: Mitte = Kameraziel der Einstellung, Kantenlänge in m.
  // Pro Einstellung fest, damit die Schatten innerhalb einer Einstellung nicht flimmern.
  setzeSchattenbereich(mitte, groesse = 24) {
    const r = new THREE.Vector3(...this.preset.haupt.richtung).normalize();
    const texel = groesse / this.haupt.shadow.mapSize.x;
    const m = mitte.clone();
    m.x = Math.round(m.x / texel) * texel;
    m.z = Math.round(m.z / texel) * texel;
    this.haupt.position.copy(m).addScaledVector(r, 40);
    this.haupt.target.position.copy(m);
    const k = this.haupt.shadow.camera;
    k.left = -groesse / 2; k.right = groesse / 2; k.top = groesse / 2; k.bottom = -groesse / 2;
    k.near = 1; k.far = 90;
    k.updateProjectionMatrix();
    const rk = new THREE.Vector3(...this.preset.kante.richtung).normalize();
    this.kante.position.copy(m).addScaledVector(rk, 40);
    this.kante.target.position.copy(m);
  }

  // Lichtgruppe anmelden (z. B. aus einem Set: "strasse.laterne").
  meldeGruppe(id, { lichter = [], materialien = [] }) {
    this.gruppen.set(id, {
      lichter, materialien,
      basisLicht: lichter.map((l) => l.intensity),
      basisMat: materialien.map((m) => m.emissiveIntensity ?? 1),
    });
  }

  setzeEreignisse(liste) {
    // "gestaffelt": ein Ereignis mit mehreren Zielen wird zu Einzel-Ereignissen mit Versatz.
    const flach = [];
    for (const e of liste) {
      const ziele = e.ziele ?? [e.ziel ?? 'umgebung'];
      ziele.forEach((z, i) => flach.push({ ...e, ziel: z, start: e.start + i * (e.versatz ?? 0) }));
    }
    for (const e of flach) {
      if (e.ziel !== 'umgebung' && !this.gruppen.has(e.ziel) && !String(e.ziel).endsWith('.*')) {
        throw new Error(`Licht-Ereignis: Lichtgruppe "${e.ziel}" unbekannt. Vorhanden: umgebung, ${[...this.gruppen.keys()].join(', ')}`);
      }
    }
    this.ereignisse = flach.sort((a, b) => a.start - b.start);
  }

  // Faktor einer Gruppe zur Zeit t: alle Ereignisse bis t nacheinander abspielen.
  faktor(id, t) {
    let f = 1;
    const setId = id.split('.')[0];
    for (const e of this.ereignisse) {
      if (e.start > t) break;
      if (e.ziel !== id && e.ziel !== `${setId}.*`) continue;
      const dauer = e.dauer ?? (e.art === 'flackern' ? 1.0 : 0.4);
      const p = easeFunktion(e.ease ?? 'ease_in_out')(fortschritt(t, e.start, dauer));
      if (e.art === 'aus') f = mischen(f, e.faktor ?? 0, p);
      else if (e.art === 'an') f = mischen(f, e.faktor ?? 1, p);
      else if (e.art === 'dimmen') f = mischen(f, e.faktor ?? 0.5, p);
      else if (e.art === 'flackern') {
        // Unregelmäßiges An/Aus während der Dauer, danach ende_faktor (Std: wie vorher).
        const ende = e.ende_faktor ?? f;
        if (t < e.start + dauer) {
          const n = rauschen(hash(`${e.ziel}|${e.start}`), (t - e.start) * (e.tempo ?? 14));
          f = n > (e.schwelle ?? -0.1) ? f : f * (e.tief ?? 0.15);
        } else f = ende;
      } else throw new Error(`Unbekannte Licht-Ereignis-Art "${e.art}" (aus, an, dimmen, flackern)`);
    }
    return f;
  }

  // Pro Bild: Stärken aus Preset × Ereignis-Faktor setzen.
  aktualisiere(t) {
    const fu = this.faktor('umgebung', t);
    this.hemi.intensity = this.basis.hemi * fu;
    this.haupt.intensity = this.basis.haupt * fu;
    this.kante.intensity = this.basis.kante * fu;
    this.himmelMat.uniforms.uHelligkeit.value = 0.45 + 0.55 * fu;
    for (const [id, g] of this.gruppen) {
      const f = this.faktor(id, t);
      g.lichter.forEach((l, i) => { l.intensity = g.basisLicht[i] * f; });
      g.materialien.forEach((m, i) => { m.emissiveIntensity = g.basisMat[i] * f; });
    }
  }

  folgeKamera(kamera) {
    this.himmel.position.copy(kamera.position);
  }
}

function tiefMischen(a, b) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) return b === undefined ? a : b;
  const r = Array.isArray(a) ? [...a] : { ...a };
  for (const [k, v] of Object.entries(b)) r[k] = v && typeof v === 'object' && !Array.isArray(v) && a?.[k] ? tiefMischen(a[k], v) : v;
  return r;
}
