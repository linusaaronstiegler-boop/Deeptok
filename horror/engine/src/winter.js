// Winter-Bauteile für „Rules of Kindly“ (Kindly im Winter, Folge 1 und später): Schnee als Material,
// verschneite Kiefern, Schneehaufen, Eis mit dem Material-Übergang „das Eis wird klar“ und Rissen.
// Gemeinsam für die Sets see, huette_innen, stadtrand, schnee (Straße) und rathaus.
//
// Eis (eisMaterial): eine halbdurchsichtige Fläche über dunklem Wasser. Von oben ist sie milchig
// (Deckkraft uDeckFrost), mit Schneeflecken (deckend) und Rissen aus einer Textur. Von unten leuchtet sie
// (durchscheinendes Tageslicht, damit Untersichten hell genug bleiben: Helligkeits-Tor). An bis zu vier
// Stellen kann sie gleichzeitig klar werden (Set-Ereignis "klar"): Der Frost weicht von der Mitte nach
// außen, am Rand der klaren Stelle glitzert kurz ein heller Kristallsaum, darunter sieht man das Wasser.
// Alles wird im Shader aus der Lage auf der Fläche gerechnet; aktualisiere(t) setzt nur Zahlen.
import * as THREE from 'three';

const glatt = (u) => { const x = Math.min(1, Math.max(0, u)); return x * x * (3 - 2 * x); };

// ---------- Zwischenspeicher je Werkzeugkasten (ctx) ----------
const speicher = new WeakMap();
function merke(ctx, schluessel, bauen) {
  let m = speicher.get(ctx);
  if (!m) { m = new Map(); speicher.set(ctx, m); }
  if (!m.has(schluessel)) m.set(schluessel, bauen());
  return m.get(schluessel);
}

// Zufall für Texturen (fester Seed je Name, nie Math.random: Regel 1 der Modul-Autoren)
function quelle(name) {
  let s = name.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 11);
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---------- Schnee ----------
// Textur in Graustufen (wird mit der Materialfarbe multipliziert): fast weiß, weiche bläuliche Mulden,
// ein paar Glitzerpunkte. Eine Kachel = 3 m (Welt-UV beim Verschmelzen, siehe bauteile.verschmelze).
export function schneeTextur(ctx) {
  return merke(ctx, 'textur:schnee', () => {
    const z = quelle('schnee');
    const t = ctx.zeichenTextur((g, w, h) => {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      // Mulden und Verwehungen: große weiche Flecken, über die Kanten wiederholt (nahtlos)
      for (let i = 0; i < 70; i++) {
        const x = z() * w, y = z() * h, r = 10 + z() * 34;
        for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) {
          const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
          gr.addColorStop(0, `rgba(120,140,175,${0.05 + z() * 0.05})`); gr.addColorStop(1, 'rgba(120,140,175,0)');
          g.fillStyle = gr; g.fillRect(x + dx - r, y + dy - r, r * 2, r * 2);
        }
      }
      for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(110,125,150,${z() * 0.08})`; g.fillRect(z() * w, z() * h, 1.5, 1.5); }
      for (let i = 0; i < 160; i++) { g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(z() * w, z() * h, 1, 1); }
    }, 256, 256);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / 3, 1 / 3);
    return t;
  });
}

// Schnee-Material (geteilt). farbe: bläuliches Weiß (Bibel §6: Schnee bläulich-weiß).
// opt.flach: flach schattiert (Schneehauben auf Kiefern, Klötzchen-Stil)
export function schneeMat(ctx, farbe = '#e9eff7', opt = {}) {
  return merke(ctx, `mat:schnee|${farbe}|${opt.flach ? 1 : 0}|${opt.rauheit ?? 0.92}`, () => new THREE.MeshStandardMaterial({
    color: new THREE.Color(farbe), roughness: opt.rauheit ?? 0.92, metalness: 0, map: schneeTextur(ctx), flatShading: !!opt.flach,
  }));
}

// Flache Schneefläche (Plane in der xz-Ebene) mit UV in Metern (Kachel 3 m über schneeTextur.repeat).
export function schneeFlaeche(ctx, eltern, b, t, x, y, z, material) {
  const geo = new THREE.PlaneGeometry(b, t);
  geo.rotateX(-Math.PI / 2);
  const uv = geo.attributes.uv, pos = geo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) + x, pos.getZ(i) + z);
  const m = new THREE.Mesh(geo, material ?? schneeMat(ctx));
  m.position.set(x, y, z);
  m.receiveShadow = true;
  eltern.add(m);
  return m;
}

// Schneehaufen: gestauchte, leicht verbeulte Kugel (Verwehung, Schneewall, Haube auf Pfosten).
// rx, ry, rz = Halbachsen in m. Liegt mit der Unterseite etwa auf y.
export function schneeHaufen(ctx, eltern, x, y, z, rx, ry, rz, zufall, material) {
  const geo = merke(ctx, 'geo:haufen', () => {
    const g = new THREE.IcosahedronGeometry(1, 2);
    const p = g.attributes.position;
    const zz = quelle('haufen');
    for (let i = 0; i < p.count; i++) {
      const f = 1 + (zz() - 0.5) * 0.12;
      p.setXYZ(i, p.getX(i) * f, Math.max(p.getY(i), -0.15) * f, p.getZ(i) * f);
    }
    g.computeVertexNormals();
    return g;
  });
  const m = new THREE.Mesh(geo, material ?? schneeMat(ctx));
  m.scale.set(rx, ry, rz);
  m.position.set(x, y + ry * 0.12, z);
  m.rotation.y = (zufall ? zufall() : 0.3) * Math.PI;
  m.castShadow = true; m.receiveShadow = true;
  eltern.add(m);
  return m;
}

// Verschneite Kiefer im Hausstil: Stamm plus vier flach schattierte Kegel (wie bauteile.kiefer), auf
// jedem eine etwas gedrehte Schneehaube, unten bleibt ein grüner Saum stehen (Kontur gegen den Schnee).
export function schneeKiefer(ctx, eltern, x, z, zufall, o = {}) {
  const s = (o.groesse ?? 1) * (0.8 + zufall() * 0.5);
  const y0 = o.y ?? 0;
  const stamm = ctx.mat('#4a3426', { rauheit: 0.9 });
  const nadel = ctx.mat(o.farbe ?? '#2a4434', { rauheit: 0.9, flach: true });
  const haube = schneeMat(ctx, '#e6edf6', { flach: true });
  const mk = (rO, rU, h, mat, yy, dreh) => {
    const g = new THREE.CylinderGeometry(rO, rU, h, 7);
    const m = new THREE.Mesh(g, mat);
    m.position.set(x, yy, z); m.rotation.y = dreh;
    m.castShadow = true; m.receiveShadow = true;
    eltern.add(m);
    return m;
  };
  mk(0.12 * s, 0.2 * s, 2.4 * s, stamm, y0 + 1.2 * s, 0);
  const schnee = o.schnee ?? 1;
  for (let i = 0; i < 4; i++) {
    const r = (2.0 - i * 0.4) * s, h = (2.4 - i * 0.3) * s;
    const yy = y0 + (2.2 + i * 1.5) * s + h / 2;
    const dreh = zufall() * Math.PI;
    mk(0, r, h, nadel, yy, dreh);
    if (schnee > 0) {
      const hh = h * (0.5 + 0.12 * schnee);
      mk(0, r * (hh / h) * 1.1, hh, haube, yy + h / 2 - hh / 2 + 0.05 * s, dreh + Math.PI / 7);
    }
  }
}

// ---------- Eis ----------
// Graustufen-Textur (Kachel = opt.kachel m): Frostflecken, feine Risse (weiß mit dunklem Schatten),
// eingeschlossene Luftblasen. Risse laufen nahtlos über die Kachelgrenzen.
function eisTextur(ctx) {
  return merke(ctx, 'textur:eis', () => {
    const z = quelle('eis');
    const t = ctx.zeichenTextur((g, w, h) => {
      g.fillStyle = '#e8eef2'; g.fillRect(0, 0, w, h);
      const wieder = (f) => { for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) { g.save(); g.translate(dx, dy); f(); g.restore(); } };
      for (let i = 0; i < 90; i++) {
        const x = z() * w, y = z() * h, r = 20 + z() * 90, hell = z() < 0.5;
        wieder(() => {
          const gr = g.createRadialGradient(x, y, 0, x, y, r);
          gr.addColorStop(0, hell ? `rgba(255,255,255,${0.25 + z() * 0.2})` : `rgba(150,175,195,${0.12 + z() * 0.12})`);
          gr.addColorStop(1, 'rgba(255,255,255,0)');
          g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
        });
      }
      // Risse: Zufallswege mit Abzweigen, erst ein dunkler Schatten, darüber die weiße Bruchkante
      const wege = [];
      for (let i = 0; i < 34; i++) {
        let x = z() * w, y = z() * h, a = z() * Math.PI * 2;
        const pkt = [[x, y]];
        const n = 6 + Math.floor(z() * 14);
        for (let k = 0; k < n; k++) { a += (z() - 0.5) * 0.9; const l = 10 + z() * 26; x += Math.cos(a) * l; y += Math.sin(a) * l; pkt.push([x, y]); }
        wege.push({ pkt, breite: 0.8 + z() * 1.8 });
      }
      for (const [farbe, dx, dy, plus] of [['rgba(70,95,115,0.35)', 1.2, 1.2, 0.6], ['rgba(255,255,255,0.85)', 0, 0, 0]]) {
        for (const wg of wege) wieder(() => {
          g.strokeStyle = farbe; g.lineWidth = wg.breite + plus; g.lineJoin = 'round';
          g.beginPath(); wg.pkt.forEach(([x, y], k) => (k ? g.lineTo(x + dx, y + dy) : g.moveTo(x + dx, y + dy))); g.stroke();
        });
      }
      for (let i = 0; i < 260; i++) { const x = z() * w, y = z() * h, r = 0.8 + z() * 2.4; g.fillStyle = `rgba(255,255,255,${0.35 + z() * 0.4})`; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    }, 1024, 1024);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    return t;
  });
}

// Fläche in der xz-Ebene (Kreis oder Rechteck), Normale nach oben, UV in Metern / kachel. Die Lage-
// Koordinaten (position) sind die Koordinaten der Ereignisse: Fläche nicht verschieben, sondern die
// Geometrie (mitte) – so stimmen "mitte" der Klar-Ereignisse und der Shader überein.
export function eisGeometrie({ radius, b, t, mitte = [0, 0], y = 0, kachel = 14, segmente = 96 }) {
  const geo = radius ? new THREE.CircleGeometry(radius, segmente) : new THREE.PlaneGeometry(b, t);
  geo.rotateX(-Math.PI / 2);
  geo.translate(mitte[0], y, mitte[1]);
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / kachel, p.getZ(i) / kachel);
  return geo;
}

// Eis-Material. opt (alles optional):
//   farbe '#bccfdd' (Frost), deckFrost 0.55 (Deckkraft von oben), deckUnten 0.72 (von unten), deckKlar 0.1,
//   klarFarbe '#14303c' (klares Eis über tiefem Wasser), schnee 1 (Menge der Schneeflecken, 0 = keine),
//   schneeFarbe '#eef3f9', durchlicht 0.9 und durchFarbe '#bfe6f0' (Leuchten der Unterseite),
//   rissGlut 0.25 (Leuchten frischer Risse), schneeMassstab 1 (größer = kleinere Flecken),
//   rauheit 0.5, klarRauheit 0.12 (glänzt mehr, wo es klar ist),
//   schneefrei [[x, z, rx, rz], …] (bis zu 2 Ellipsen ohne Schneeflecken), spiegelFarbe '#1d4a54' (von unten flach)
// Rückgabe: Material mit .eis.setze({ klar: [{x,z,r,w}], risse: [{x,z,r,w}] }) für aktualisiere(t).
export function eisMaterial(ctx, opt = {}) {
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(opt.farbe ?? '#bccfdd'), roughness: opt.rauheit ?? 0.5, metalness: 0, map: eisTextur(ctx),
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const leer = () => [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, 1, 0));
  const u = {
    uEisKlar: { value: leer() }, uEisRiss: { value: leer() },
    uEisFrei: { value: [0, 1].map((i) => new THREE.Vector4(...(opt.schneefrei?.[i] ?? [0, 0, 0, 0]))) },
    uEisSpiegelFarbe: { value: new THREE.Color(opt.spiegelFarbe ?? '#1d4a54') },
    uEisDeckFrost: { value: opt.deckFrost ?? 0.55 }, uEisDeckUnten: { value: opt.deckUnten ?? 0.72 }, uEisDeckKlar: { value: opt.deckKlar ?? 0.1 },
    uEisKlarRauheit: { value: opt.klarRauheit ?? 0.12 },
    uEisSchnee: { value: opt.schnee ?? 1 }, uEisSchneeMass: { value: opt.schneeMassstab ?? 1 },
    uEisDurchlicht: { value: opt.durchlicht ?? 0.9 }, uEisRissGlut: { value: opt.rissGlut ?? 0.25 },
    uEisKlarFarbe: { value: new THREE.Color(opt.klarFarbe ?? '#14303c') },
    uEisSchneeFarbe: { value: new THREE.Color(opt.schneeFarbe ?? '#eef3f9') },
    uEisDurchFarbe: { value: new THREE.Color(opt.durchFarbe ?? '#bfe6f0') },
  };
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vEisPos;\nvarying vec3 vEisWelt;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvEisPos = position;\nvEisWelt = (modelMatrix * vec4(position, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
uniform vec4 uEisKlar[4];
uniform vec4 uEisRiss[4];
uniform vec4 uEisFrei[2];
uniform vec3 uEisSpiegelFarbe;
varying vec3 vEisWelt;
float eisSpiegel = 0.0; float eisUnten = 0.0;
uniform float uEisKlarRauheit, uEisDeckFrost, uEisDeckUnten, uEisDeckKlar, uEisSchnee, uEisSchneeMass, uEisDurchlicht, uEisRissGlut;
uniform vec3 uEisKlarFarbe, uEisSchneeFarbe, uEisDurchFarbe;
varying vec3 vEisPos;
float eis_h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float eis_n(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 w = f * f * (3.0 - 2.0 * f);
  return mix(mix(eis_h(i), eis_h(i + vec2(1.0, 0.0)), w.x), mix(eis_h(i + vec2(0.0, 1.0)), eis_h(i + vec2(1.0, 1.0)), w.x), w.y); }
float eis_fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * eis_n(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }
float eisK = 0.0; float eisS = 0.0; float eisR = 0.0; float eisRand = 0.0;`)
      .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 eP = vEisPos.xz;
  // von unten gesehen? (aus der Kamerahöhe: gl_FrontFacing war unter ANGLE/llvmpipe hier nicht verlässlich)
  eisUnten = step(cameraPosition.y, vEisWelt.y - 0.001);
  // klare Stellen: x, z, Radius, Fortschritt w (0..1). Der Frost weicht von innen nach außen.
  for (int i = 0; i < 4; i++) {
    vec4 s = uEisKlar[i];
    if (s.w > 0.001) {
      float d = length(eP - s.xy);
      float r = s.z * mix(0.3, 1.0, s.w);
      eisK = max(eisK, (1.0 - smoothstep(r * 0.7, r, d)) * smoothstep(0.0, 0.3, s.w));
      eisRand = max(eisRand, (1.0 - smoothstep(0.0, r * 0.1 + 0.03, abs(d - r * 0.9))) * (1.0 - s.w) * step(0.002, 1.0 - s.w));
    }
  }
  // frische Risse: Strahlen aus dem Schlagpunkt plus Ringstücke (Spinnennetz), wachsen mit w
  for (int i = 0; i < 4; i++) {
    vec4 s = uEisRiss[i];
    if (s.w > 0.001) {
      vec2 dv = eP - s.xy; float d = length(dv);
      if (d < s.z) {
        float a = atan(dv.y, dv.x) / 6.28318 * 11.0;
        float k = floor(a + 0.5);
        float wackel = (eis_n(vec2(d * 2.2, k * 3.1)) - 0.5) * 0.35;
        float da = (a - k - (eis_h(vec2(k, 4.2)) - 0.5) * 0.5 - wackel) * 6.28318 / 11.0;
        float strahl = 1.0 - smoothstep(0.006, 0.024, d * abs(sin(da)));
        float ringR = s.z * (0.28 + 0.3 * eis_h(vec2(k, 9.0)));
        float ring = (1.0 - smoothstep(0.006, 0.02, abs(d - ringR))) * step(0.45, eis_h(vec2(floor(a * 1.7), 2.0)));
        float aus = 1.0 - smoothstep(s.z * mix(0.1, 0.6, s.w), s.z * mix(0.15, 1.0, s.w), d);
        eisR = max(eisR, max(strahl, ring) * aus * s.w);
      }
    }
  }
  // Schneeflecken und Verwehungen (deckend), nicht auf klaren Stellen
  eisS = smoothstep(0.52, 0.64, eis_fbm(eP * 0.085 * uEisSchneeMass + 3.7));
  eisS = max(eisS, smoothstep(0.6, 0.72, eis_fbm(vec2(eP.x * 0.32, eP.y * 0.05) * uEisSchneeMass + 11.0)) * 0.8);
  // schneefreie Ellipsen (x, z, rx, rz): dort liegt das Wesen, sein Umriss bleibt durch den Frost lesbar
  for (int i = 0; i < 2; i++) {
    vec4 f = uEisFrei[i];
    if (f.z > 0.0) { vec2 q = (eP - f.xy) / f.zw; eisS *= smoothstep(0.7, 1.05, length(q) + (eis_fbm(eP * 0.35 + 5.0) - 0.5) * 0.45); }
  }
  eisS *= uEisSchnee * (1.0 - eisK);
  // Von unten, flach gesehen: Totalreflexion (außerhalb des Snellius-Fensters, ~49° zur Senkrechten) spiegelt
  // das dunkle Wasser. Ohne das sah man von unten das Ufer und die Stadt wie durch Glas.
  if (eisUnten > 0.5) {
    float eisC = abs(normalize(cameraPosition - vEisWelt).y);
    eisSpiegel = 1.0 - smoothstep(0.5, 0.74, eisC);
  }
  diffuseColor.rgb = mix(diffuseColor.rgb, uEisKlarFarbe, eisK * 0.85);
  diffuseColor.rgb = mix(diffuseColor.rgb, uEisSchneeFarbe, eisS);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.96, 0.99, 1.0), max(eisR * 0.85, eisRand * 0.7));
  float eisDeck = mix(uEisDeckFrost, uEisDeckUnten, eisUnten);
  float eisA = mix(eisDeck, uEisDeckKlar, eisK);
  eisA = mix(eisA, 1.0, eisS);
  eisA = max(eisA, max(eisR * 0.92, eisRand * 0.8));
  diffuseColor.rgb = mix(diffuseColor.rgb, uEisSpiegelFarbe, eisSpiegel);
  eisA = mix(eisA, 1.0, eisSpiegel);
  diffuseColor.a = eisA;
}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
roughnessFactor = mix(roughnessFactor, uEisKlarRauheit, eisK);
roughnessFactor = mix(roughnessFactor, 0.95, eisS);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
// Unterseite: durchscheinendes Licht (Untersicht hell genug), Schnee und klare Stellen lassen weniger durch
totalEmissiveRadiance += eisUnten * uEisDurchFarbe * uEisDurchlicht * (1.0 - 0.7 * eisK) * (1.0 - 0.55 * eisS) * (1.0 - 0.8 * eisSpiegel);
totalEmissiveRadiance += vec3(0.62, 0.8, 0.9) * uEisRissGlut * max(eisR, eisRand);`);
  };
  m.customProgramCacheKey = () => 'kindly-eis';
  m.eis = {
    uniforms: u,
    setze({ klar = [], risse = [] } = {}) {
      for (let i = 0; i < 4; i++) {
        const k = klar[i], r = risse[i];
        u.uEisKlar.value[i].set(k?.x ?? 0, k?.z ?? 0, k?.r ?? 1, k?.w ?? 0);
        u.uEisRiss.value[i].set(r?.x ?? 0, r?.z ?? 0, r?.r ?? 1, r?.w ?? 0);
      }
    },
  };
  return m;
}

// Klare Stellen zur Zeit t aus Set-Ereignissen { was: "klar", start, dauer (Std 0,8), mitte [x, z],
// radius (Std std.radius), staerke (Std 1; 0 = friert wieder zu) }. Ereignisse an derselben Stelle
// mischen vom aktuellen Stand zum neuen Ziel. Höchstens vier Stellen gleichzeitig (die stärksten).
export function klarStellen(ereignisse, t, std = {}) {
  const stellen = new Map();
  for (const e of [...ereignisse].filter((x) => x.was === 'klar').sort((a, b) => a.start - b.start)) {
    if (t < e.start) break;
    const m = e.mitte ?? std.mitte ?? [0, 0];
    const key = `${m[0].toFixed(2)},${m[1].toFixed(2)}`;
    const s = stellen.get(key) ?? { x: m[0], z: m[1], r: std.radius ?? 1.2, w: 0 };
    if (e.radius !== undefined) s.r = e.radius;
    s.w += ((e.staerke ?? 1) - s.w) * glatt((t - e.start) / Math.max(1e-3, e.dauer ?? 0.8));
    stellen.set(key, s);
  }
  return [...stellen.values()].filter((s) => s.w > 0.002).sort((a, b) => b.w - a.w).slice(0, 4);
}

// Risse zur Zeit t aus Ereignissen { was: "risse", start, dauer (Std 0,12), mitte, radius (Std 1,6),
// staerke (Std 1) }: wachsen in dauer auf und bleiben. Die letzten vier zählen.
export function rissStellen(ereignisse, t, std = {}) {
  return [...ereignisse].filter((e) => e.was === 'risse' && t >= e.start).sort((a, b) => a.start - b.start).slice(-4).map((e) => {
    const m = e.mitte ?? std.mitte ?? [0, 0];
    return { x: m[0], z: m[1], r: e.radius ?? std.radius ?? 1.6, w: (e.staerke ?? 1) * glatt((t - e.start) / Math.max(1e-3, e.dauer ?? 0.12)) };
  });
}

// Fortschritt eines einmaligen Ereignisses (deckel_drauf, riegel_zu …): 0 vor dem ersten, dann je
// Ereignis vom aktuellen Stand zum Ziel (ziel 1 = zu/drauf, 0 = auf/weg).
export function ereignisStand(ereignisse, t, ziele, stdDauer = 0.5) {
  let s = 0;
  for (const e of [...ereignisse].filter((x) => x.was in ziele).sort((a, b) => a.start - b.start)) {
    if (t < e.start) break;
    s += (ziele[e.was] - s) * glatt((t - e.start) / Math.max(1e-3, e.dauer ?? stdDauer));
  }
  return s;
}
