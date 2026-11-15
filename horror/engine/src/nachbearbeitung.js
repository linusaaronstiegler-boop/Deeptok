// Nachbearbeitung: aus dem 3D-Bild wird der r2-Look.
// Reihenfolge pro Bild:
//   1. Szene in ein HDR-Ziel (HalfFloat, 4× MSAA = glatte Kanten) rendern.
//   2. Optional Bewegungsunschärfe: mehrere Unterbilder (Zwischenzeiten) mitteln (Whip, Snap).
//   3. Bloom (leuchtende Fenster, Laternen, Mond, Monster-Augen).
//   4. Optional Tiefenunschärfe (Nah- und Detailaufnahmen): Hintergrund weich.
//   5. Endstufe: Farbbalance, Tonemapping (ACES oder AgX), Sättigung/Kontrast, sRGB,
//      Vignette, Korn (Korn hängt an der Bildnummer, ist also deterministisch).

import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

const QUAD_VS = /* glsl */`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const KOPIE_FS = /* glsl */`
uniform sampler2D tQuelle;
uniform float uGewicht;
varying vec2 vUv;
void main() { gl_FragColor = vec4(texture2D(tQuelle, vUv).rgb * uGewicht, 1.0); }`;

// 9 Abtastungen entlang einer Richtung (getrennte Gauß-Unschärfe: erst waagerecht, dann senkrecht).
const UNSCHAERFE_FS = /* glsl */`
uniform sampler2D tQuelle;
uniform vec2 uSchritt;
varying vec2 vUv;
void main() {
  vec4 s = texture2D(tQuelle, vUv) * 0.2270270270;
  s += texture2D(tQuelle, vUv + uSchritt * 1.3846153846) * 0.3162162162;
  s += texture2D(tQuelle, vUv - uSchritt * 1.3846153846) * 0.3162162162;
  s += texture2D(tQuelle, vUv + uSchritt * 3.2307692308) * 0.0702702703;
  s += texture2D(tQuelle, vUv - uSchritt * 3.2307692308) * 0.0702702703;
  gl_FragColor = s;
}`;

// Tiefenunschärfe in drei Schritten:
//  a) COC_FS: halbe Auflösung, Farbe × Zerstreuungskreis (coc), coc im Alpha-Kanal.
//  b) Gauß-Unschärfe auf diesem Bild.
//  c) TIEFE_FS: weiche Farbe = rgb / alpha. Scharfe Bildteile (coc ≈ 0) tragen so nichts zur
//     Unschärfe bei – sonst bluten Figuren als Saum in den unscharfen Hintergrund.
const TIEFE_GEMEINSAM = /* glsl */`
uniform float uNah, uFern, uFokus, uBlende;
float sichtTiefe(float z) {
  float ndc = z * 2.0 - 1.0;
  return (2.0 * uNah * uFern) / (uFern + uNah - ndc * (uFern - uNah));
}
float zerstreuung(float z) {
  float d = sichtTiefe(z);
  return clamp(uBlende * abs(d - uFokus) / max(d, 0.001), 0.0, 1.0);
}`;
const COC_FS = /* glsl */`
uniform sampler2D tFarbe, tTiefe;
varying vec2 vUv;
${TIEFE_GEMEINSAM}
void main() {
  float coc = zerstreuung(texture2D(tTiefe, vUv).x);
  gl_FragColor = vec4(texture2D(tFarbe, vUv).rgb * coc, coc);
}`;
const TIEFE_FS = /* glsl */`
uniform sampler2D tScharf, tWeich, tTiefe;
varying vec2 vUv;
${TIEFE_GEMEINSAM}
void main() {
  float coc = zerstreuung(texture2D(tTiefe, vUv).x);
  vec4 scharf = texture2D(tScharf, vUv);
  vec4 w = texture2D(tWeich, vUv);
  vec3 weich = w.a > 0.002 ? w.rgb / w.a : scharf.rgb;
  gl_FragColor = vec4(mix(scharf.rgb, weich, smoothstep(0.0, 1.0, coc)), 1.0);
}`;

const ENDE_FS = /* glsl */`
uniform sampler2D tQuelle;
uniform vec3 uFaerbung;
uniform float uSaettigung, uKontrast, uVignette, uKorn, uBild;
uniform vec2 uAufloesung;
#include <tonemapping_pars_fragment>
varying vec2 vUv;
float rausch(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
void main() {
  vec3 c = texture2D(tQuelle, vUv).rgb * uFaerbung;
  #ifdef AGX
    c = AgXToneMapping(c);
  #else
    c = ACESFilmicToneMapping(c);
  #endif
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, uSaettigung);
  c = clamp((c - 0.18) * uKontrast + 0.18, 0.0, 1.0);
  vec4 o = sRGBTransferOETF(vec4(c, 1.0));
  // Vignette: elliptisch, folgt dem Hochformat; dunkelt nur die Ränder ab.
  vec2 q = (vUv - 0.5) * vec2(1.0, 0.82);
  float v = smoothstep(0.78, 0.22, length(q));
  o.rgb *= mix(1.0, v, uVignette);
  o.rgb += (rausch(vUv * uAufloesung + uBild * 37.0) - 0.5) * uKorn;
  gl_FragColor = vec4(o.rgb, 1.0);
}`;

export class Nachbearbeitung {
  // look: { msaa, bloom: {staerke, radius, schwelle} | false, toene: "aces"|"agx",
  //         vignette, korn, tiefenunschaerfe_px }
  constructor(renderer, W, H, look = {}) {
    this.r = renderer;
    this.W = W; this.H = H;
    this.look = look;
    const halb = { type: THREE.HalfFloatType, depthBuffer: false };
    this.rtSzene = new THREE.WebGLRenderTarget(W, H, {
      type: THREE.HalfFloatType,
      samples: look.msaa ?? 4,
      depthTexture: new THREE.DepthTexture(W, H),
    });
    // HDR-Bild ohne MSAA: hierhin wird das Szenenbild aufgelöst (bei Unterbildern gemittelt).
    // Bloom und Tiefenunschärfe arbeiten nur hier, nie im MSAA-Ziel: three.js gibt den
    // MSAA-Puffer nach dem Auflösen frei (invalidateFramebuffer); ein zweiter Durchgang hinein
    // hängt dann vom Treiberzustand ab und das Bild wäre nicht mehr deterministisch.
    this.rtAkku = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthBuffer: false });
    this.rtHalbA = new THREE.WebGLRenderTarget(Math.round(W / 2), Math.round(H / 2), halb);
    this.rtHalbB = new THREE.WebGLRenderTarget(Math.round(W / 2), Math.round(H / 2), halb);
    this.rtTiefe = null;
    const b = look.bloom === false ? null : { staerke: 0.55, radius: 0.55, schwelle: 1.0, ...(look.bloom || {}) };
    this.bloom = b ? new UnrealBloomPass(new THREE.Vector2(W, H), b.staerke, b.radius, b.schwelle) : null;

    const quadMat = (fs, uniforms, extra = {}) => new THREE.ShaderMaterial({ vertexShader: QUAD_VS, fragmentShader: fs, uniforms, depthTest: false, depthWrite: false, toneMapped: false, ...extra });
    this.kopieMat = quadMat(KOPIE_FS, { tQuelle: { value: null }, uGewicht: { value: 1 } }, { blending: THREE.AdditiveBlending });
    this.einfachMat = quadMat(KOPIE_FS, { tQuelle: { value: null }, uGewicht: { value: 1 } });
    this.unschaerfeMat = quadMat(UNSCHAERFE_FS, { tQuelle: { value: null }, uSchritt: { value: new THREE.Vector2() } });
    const linse = () => ({ uNah: { value: 0.1 }, uFern: { value: 500 }, uFokus: { value: 3 }, uBlende: { value: 1 } });
    this.cocMat = quadMat(COC_FS, { tFarbe: { value: null }, tTiefe: { value: null }, ...linse() });
    this.tiefeMat = quadMat(TIEFE_FS, { tScharf: { value: null }, tWeich: { value: null }, tTiefe: { value: null }, ...linse() });
    this.endeMat = quadMat(ENDE_FS, {
      tQuelle: { value: null }, toneMappingExposure: { value: 1 }, uFaerbung: { value: new THREE.Vector3(1, 1, 1) },
      uSaettigung: { value: 1 }, uKontrast: { value: 1 }, uVignette: { value: look.vignette ?? 0.35 },
      uKorn: { value: look.korn ?? 0.03 }, uBild: { value: 0 }, uAufloesung: { value: new THREE.Vector2(W, H) },
    });
    if (look.toene === 'agx') this.endeMat.defines.AGX = '';
    this.quad = new FullScreenQuad();
    renderer.autoClear = false; // wir löschen selbst, sonst löscht jeder Quad-Durchgang das Ziel
  }

  _quad(material, ziel) {
    this.quad.material = material;
    this.r.setRenderTarget(ziel);
    this.quad.render(this.r);
  }

  beginne(unterbilder) {
    this.n = Math.max(1, unterbilder | 0);
    this.k = 0;
  }

  // Ein (Unter-)Bild rendern. Bei mehreren Unterbildern wird gemittelt.
  szene(szene, kamera) {
    this.r.setRenderTarget(this.rtSzene);
    this.r.setClearColor(0x000000, 1);
    this.r.clear(true, true, false);
    this.r.render(szene, kamera);
    // Erstes Unterbild ersetzt den Inhalt, weitere werden addiert (jedes mit Gewicht 1/n).
    const m = this.k === 0 ? this.einfachMat : this.kopieMat;
    m.uniforms.tQuelle.value = this.rtSzene.texture;
    m.uniforms.uGewicht.value = 1 / this.n;
    this._quad(m, this.rtAkku);
    this.k++;
  }

  // opt: { bild, kamera, preset (für Belichtung und Farbe), tiefe: {fokus, blende} | null }
  abschliessen(opt) {
    let quelle = this.rtAkku;
    if (this.bloom) this.bloom.render(this.r, null, quelle);

    if (opt.tiefe) {
      if (!this.rtTiefe) this.rtTiefe = new THREE.WebGLRenderTarget(this.W, this.H, { type: THREE.HalfFloatType, depthBuffer: false });
      for (const m of [this.cocMat, this.tiefeMat]) {
        m.uniforms.uNah.value = opt.kamera.near;
        m.uniforms.uFern.value = opt.kamera.far;
        m.uniforms.uFokus.value = opt.tiefe.fokus;
        m.uniforms.uBlende.value = opt.tiefe.blende ?? 1.0;
      }
      this.cocMat.uniforms.tFarbe.value = quelle.texture;
      this.cocMat.uniforms.tTiefe.value = this.rtSzene.depthTexture;
      this._quad(this.cocMat, this.rtHalbA);
      // Radius in Pixeln bezogen auf 1080 Breite; zweimal weichzeichnen ergibt eine rundere Unschärfe.
      const px = ((this.look.tiefenunschaerfe_px ?? 14) * (this.W / 1080)) / 2 / 3.2;
      for (let i = 0; i < 2; i++) {
        this.unschaerfeMat.uniforms.tQuelle.value = this.rtHalbA.texture;
        this.unschaerfeMat.uniforms.uSchritt.value.set(px / this.rtHalbA.width, 0);
        this._quad(this.unschaerfeMat, this.rtHalbB);
        this.unschaerfeMat.uniforms.tQuelle.value = this.rtHalbB.texture;
        this.unschaerfeMat.uniforms.uSchritt.value.set(0, px / this.rtHalbA.height);
        this._quad(this.unschaerfeMat, this.rtHalbA);
      }
      const u = this.tiefeMat.uniforms;
      u.tScharf.value = quelle.texture;
      u.tWeich.value = this.rtHalbA.texture;
      u.tTiefe.value = this.rtSzene.depthTexture;
      this._quad(this.tiefeMat, this.rtTiefe);
      quelle = this.rtTiefe;
    }

    const p = opt.preset;
    const u = this.endeMat.uniforms;
    u.tQuelle.value = quelle.texture;
    u.toneMappingExposure.value = (p.belichtung ?? 1) * (this.look.belichtung ?? 1);
    u.uFaerbung.value.set(...(p.grade?.faerbung ?? [1, 1, 1]));
    u.uSaettigung.value = (p.grade?.saettigung ?? 1) * (this.look.saettigung ?? 1);
    u.uKontrast.value = (p.grade?.kontrast ?? 1) * (this.look.kontrast ?? 1);
    u.uBild.value = opt.bild % 997;
    this.r.setRenderTarget(null);
    this.r.setClearColor(0x000000, 1);
    this.r.clear(true, true, false);
    this._quad(this.endeMat, null);
  }
}
