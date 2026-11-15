// Partikel ohne Zustand: Die Position jedes Teilchens ist eine Formel aus (Zufallswerten, Zeit).
// Der Vertex-Shader rechnet sie aus, die CPU tut pro Bild nichts außer eine Zahl zu setzen.
// Dadurch sind Partikel deterministisch und kosten fast keine Renderzeit.
//
// Arten (Spec 1.6: Dauer-Partikel nur, wo die Szene sie hergibt; Ereignis-Partikel auf das Wort):
//   schweben  Schwebeteilchen/Staub im Lichtkegel (dauernd)
//   schnee    fallender Schnee (dauernd)
//   staub     Ereignis: Wolke fliegt aus einem Punkt auf (Aufprall, Tür, Monster steigt auf)
//   atem      Atemdampf vor dem Mund einer Figur, Wölkchen alle ~3,5 s (dauernd, Anker bewegt sich mit)

import * as THREE from 'three';
import { generator, hash } from './zufall.js';

const ARTEN = { schweben: 0, schnee: 1, staub: 2, atem: 3 };

const VS = /* glsl */`
uniform float uZeit, uStart, uDauer, uGroesse, uHoehe, uArt, uPeriode;
uniform vec3 uUrsprung, uBereich, uRichtung;
attribute vec4 aZufall;
varying float vAlpha;
void main() {
  vec3 p = uUrsprung;
  float t = uZeit - uStart;
  float alpha = 1.0;
  float groesse = uGroesse * (0.6 + 0.8 * aZufall.w);
  if (uArt < 0.5) {            // schweben
    p += (aZufall.xyz - 0.5) * uBereich;
    p += vec3(sin(t * 0.4 + aZufall.x * 40.0), sin(t * 0.3 + aZufall.y * 30.0) * 0.6, cos(t * 0.35 + aZufall.z * 50.0)) * 0.18;
    alpha = 0.55 + 0.45 * sin(t * 1.3 + aZufall.w * 60.0);
  } else if (uArt < 1.5) {     // schnee
    float fall = mod(t * (0.6 + 0.5 * aZufall.w) + aZufall.y * uBereich.y, uBereich.y);
    p += vec3((aZufall.x - 0.5) * uBereich.x, uBereich.y * 0.5 - fall, (aZufall.z - 0.5) * uBereich.z);
    p.x += sin(t * 1.1 + aZufall.z * 20.0) * 0.12;
  } else if (uArt < 2.5) {     // staub (Ereignis)
    if (t < 0.0 || t > uDauer) { alpha = 0.0; }
    float u = clamp(t / uDauer, 0.0, 1.0);
    vec3 r = normalize(aZufall.xyz - 0.5 + vec3(0.0, 0.35, 0.0));
    float tempo = (0.6 + aZufall.w) * length(uBereich);
    float weg = tempo * (1.0 - exp(-3.0 * max(t, 0.0))) / 3.0;  // bremst durch Luftwiderstand
    p += r * weg + vec3(0.0, -0.15 * max(t, 0.0) * max(t, 0.0), 0.0);
    alpha *= (1.0 - u) * (1.0 - u);
    groesse *= 1.0 + 2.5 * u;
  } else {                      // atem
    float phase = mod(t + aZufall.x * 0.25, uPeriode);
    float leben = 1.1;
    if (phase > leben) { alpha = 0.0; }
    float u = clamp(phase / leben, 0.0, 1.0);
    vec3 streu = (aZufall.xyz - 0.5) * vec3(0.12, 0.08, 0.12) * (0.3 + 2.0 * u);
    p += uRichtung * (0.05 + 0.45 * u) + streu + vec3(0.0, 0.08 * u, 0.0);
    alpha *= sin(u * 3.14159) * 0.8;
    groesse *= 1.0 + 2.2 * u;
  }
  vAlpha = alpha;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  // Größe in Metern, perspektivisch: Pixel = Größe · Bildhöhe / (2 · tan(fov/2) · Abstand)
  gl_PointSize = groesse * uHoehe / max(0.05, -mv.z);
}`;

const FS = /* glsl */`
uniform vec3 uFarbe;
uniform float uDeckkraft;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  if (r > 0.5 || vAlpha <= 0.001) discard;
  float weich = smoothstep(0.5, 0.0, r);
  gl_FragColor = vec4(uFarbe, weich * vAlpha * uDeckkraft);
}`;

export class Partikel {
  // spec: { art, start, dauer, ort (Punkt oder Anker), bereich [x,y,z], anzahl, farbe, groesse,
  //         deckkraft, seed, periode (atem), richtung [x,y,z] (atem, sonst Blickrichtung der Figur) }
  constructor(spec, seed) {
    if (!(spec.art in ARTEN)) throw new Error(`Unbekannte Partikel-Art "${spec.art}". Erlaubt: ${Object.keys(ARTEN).join(', ')}`);
    this.spec = spec;
    const anzahl = spec.anzahl ?? { schweben: 150, schnee: 600, staub: 80, atem: 40 }[spec.art];
    const z = generator(hash(`${seed}|partikel|${spec.seed ?? ''}|${spec.art}|${spec.start ?? 0}`));
    const zufall = new Float32Array(anzahl * 4);
    for (let i = 0; i < zufall.length; i++) zufall[i] = z();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(anzahl * 3), 3));
    geo.setAttribute('aZufall', new THREE.BufferAttribute(zufall, 4));
    const standardFarbe = { schweben: '#ffe2b0', schnee: '#eef3ff', staub: '#b8aa98', atem: '#dfe6f0' }[spec.art];
    this.material = new THREE.ShaderMaterial({
      vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false,
      uniforms: {
        uZeit: { value: 0 }, uStart: { value: spec.start ?? 0 }, uDauer: { value: spec.dauer ?? 1.5 },
        uGroesse: { value: spec.groesse ?? { schweben: 0.025, schnee: 0.04, staub: 0.12, atem: 0.05 }[spec.art] },
        uHoehe: { value: 1000 }, uArt: { value: ARTEN[spec.art] }, uPeriode: { value: spec.periode ?? 3.5 },
        uUrsprung: { value: new THREE.Vector3() },
        uBereich: { value: new THREE.Vector3(...(spec.bereich ?? { schweben: [4, 3, 4], schnee: [16, 10, 16], staub: [0.8, 0.8, 0.8], atem: [0, 0, 0] }[spec.art])) },
        uRichtung: { value: new THREE.Vector3(...(spec.richtung ?? [0, 0, 1])).normalize() },
        uFarbe: { value: new THREE.Color(spec.farbe ?? standardFarbe) },
        uDeckkraft: { value: spec.deckkraft ?? { schweben: 0.7, schnee: 0.9, staub: 0.55, atem: 0.22 }[spec.art] },
      },
    });
    this.punkte = new THREE.Points(geo, this.material);
    this.punkte.frustumCulled = false;
  }

  // ortBei(t) -> Vector3, richtungBei(t) -> Vector3 (für atem), kamera für die Punktgröße.
  aktualisiere(t, ortBei, richtungBei, kamera, hoehePx) {
    const u = this.material.uniforms;
    u.uZeit.value = t;
    u.uUrsprung.value.copy(ortBei(t));
    if (this.spec.art === 'atem' && !this.spec.richtung && richtungBei) u.uRichtung.value.copy(richtungBei(t));
    u.uHoehe.value = hoehePx / (2 * Math.tan((kamera.fov * Math.PI) / 360));
    // Ereignis-Partikel nur in ihrem Zeitfenster zeichnen.
    if (this.spec.art === 'staub') {
      const s = this.spec.start ?? 0;
      this.punkte.visible = t >= s && t <= s + (this.spec.dauer ?? 1.5);
    } else if (this.spec.dauer !== undefined) {
      const s = this.spec.start ?? 0;
      this.punkte.visible = t >= s && t <= s + this.spec.dauer;
    }
  }
}
