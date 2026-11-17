// Set "huette_innen": die Fischerhütte von Bear und Gus von innen (Rules of Kindly, Folge 1, S42–63).
// Weit weg von den anderen Sets stellen (z. B. "position": [600, 0, 0]) und allein zeigen: "set": ["huette"].
// Licht "huette" (src/licht_kindly.js): eng und warm, Untergrenze 22 je Einstellung wie im Kriechkeller.
//
// Maße (lokal, 1 m, y oben) passen zur Hütte „BEAR & GUS“ im Set "see" (2,4 × 3,0 m, Tür vorn):
//   Dielenboden y = 0, Innenraum x −1,12 … 1,12, z −1,42 … 1,42, Decke 2,15 (vorn) bis 1,95 (hinten).
//   Tür vorn (z = +1,42, Mitte x = 0) mit Riegel, Fenster mit Frost rechts (x = +1,12, z −0,2, Mitte y 1,33),
//   Ofen hinten links, Bank rechts, Eisloch im Boden (Mitte x −0,25, z 0,35; 0,7 × 0,7 m).
//   Im Loch: Eiswände (0,35 m Eis), Wasser mit einer dünnen neuen Eishaut bei y = −0,15 (Eis wird klar wie
//   auf dem See), darunter Platz für ein Gesicht (Anker "loch_unten").
//   Drinnen dampft niemand (Bibel §2): Atem-Partikel hier nicht einsetzen; nur das Fenster zeigt den Atem.
//
// Set-Ereignisse (params.ereignisse; regie.mjs: { art: "set", set: "huette", was, wort }):
//   klar         { dauer (Std 0,8), radius (Std 0,45), staerke }: die Eishaut im Loch wird klar (S58)
//   zittern      { dauer (Std 1,2), schlaege (Std 3), staerke (Std 1) }: das Wasser im Loch zittert im Takt (S54–55)
//   deckel_drauf { dauer (Std 0,6) }: der Holzdeckel hebt sich vom Boden und legt sich aufs Loch (S63, auf „put“);
//                deckel_weg legt ihn zurück
//   riegel_zu    { dauer (Std 0,25) }: der Türriegel schiebt sich zu (S49); riegel_auf öffnet
//   hauch        { mitte [u, v] (Std [0,5, 0,45]), radius (Std 0,22), dauer (Std 1,6) }: Atem beschlägt die
//                Frostscheibe milchig und vergeht (nur echte Menschen; Bears Kopie haucht ohne Ereignis)
// params: ofen (Std 1, Stärke der Glut), lampe (Std 1), punktlichter (Std true)
// Lichtgruppen: huette.ofen (Glut + Punktlicht), huette.lampe (Petroleumlampe + Punktlicht), huette.fenster
import * as THREE from 'three';
import { k, zyl, verschmelze, tmat } from '../src/bauteile.js';
import { eisMaterial, eisGeometrie, klarStellen, ereignisStand } from '../src/winter.js';

export const HUETTE = {
  x0: -1.12, x1: 1.12, z0: -1.42, z1: 1.42,
  deckeVorn: 2.15, deckeHinten: 1.95,
  loch: { x: -0.25, z: 0.35, b: 0.7 },
  wasser: -0.15,            // Eishaut im Loch (Oberkante des Seeeises liegt bei −0,12)
  fenster: { z: -0.2, y: 1.33, b: 0.46, h: 0.36 },
  tuer: { x: 0, b: 0.82, h: 1.8 },
  deckelRest: [0.32, 0.025, 1.0, 0.25],   // x, y, z, Drehung um y
};
const glatt = (u) => { const x = Math.min(1, Math.max(0, u)); return x * x * (3 - 2 * x); };

export default async function baue(ctx, params = {}) {
  const T = THREE;
  const z = ctx.zufall('huette_innen');
  const H = HUETTE;
  const gruppe = new T.Group();
  const statisch = new T.Group(); gruppe.add(statisch);
  const ereignisse = params.ereignisse ?? [];

  // ---------- Materialien: warmes Sperrholz, dunkle Dielen, Eisen ----------
  const wandMat = tmat(ctx, '#b48c64', 'holz', { rauheit: 0.85 });
  const leiste = tmat(ctx, '#7a5a3e', 'holz', { rauheit: 0.85 });
  const dielen = tmat(ctx, '#8a6a4c', 'dielen', { rauheit: 0.85 });
  const eisen = ctx.mat('#2c2b2a', { rauheit: 0.6, metall: 0.4 });
  const B = H.x1 - H.x0, Tt = H.z1 - H.z0;

  // ---------- Boden mit Loch (Dielen um die Öffnung herum) ----------
  const L = H.loch, lh = L.b / 2;
  const lx0 = L.x - lh, lx1 = L.x + lh, lz0 = L.z - lh, lz1 = L.z + lh;
  const boden = (x0, x1, z0, z1) => { if (x1 - x0 > 0.01 && z1 - z0 > 0.01) k(statisch, x1 - x0, 0.05, z1 - z0, dielen, (x0 + x1) / 2, -0.025, (z0 + z1) / 2); };
  boden(H.x0, H.x1, H.z0, lz0);
  boden(H.x0, H.x1, lz1, H.z1);
  boden(H.x0, lx0, lz0, lz1);
  boden(lx1, H.x1, lz0, lz1);
  // Rahmen ums Loch (Leisten), damit die Kante sauber aussieht
  for (const [b, t, x, zz] of [[L.b + 0.12, 0.06, L.x, lz0 - 0.03], [L.b + 0.12, 0.06, L.x, lz1 + 0.03], [0.06, L.b, lx0 - 0.03, L.z], [0.06, L.b, lx1 + 0.03, L.z]]) k(statisch, b, 0.03, t, leiste, x, 0.012, zz);
  // Eiswände im Loch (das Seeeis, 0,35 m dick, bläulich durchscheinend) und dunkler Schacht darunter
  const eisWand = ctx.mat('#9cc3d6', { rauheit: 0.25, leuchten: '#4d8aa0', leuchtStaerke: 0.35 });
  const schacht = ctx.mat('#12313b', { rauheit: 0.6 });
  for (const [b, t, x, zz] of [[L.b, 0.02, L.x, lz0 + 0.01], [L.b, 0.02, L.x, lz1 - 0.01], [0.02, L.b, lx0 + 0.01, L.z], [0.02, L.b, lx1 - 0.01, L.z]]) {
    k(statisch, b, 0.35, t, eisWand, x, -0.12 - 0.175 - 0.05, zz, { schatten: false });
    k(statisch, b, 1.2, t, schacht, x, -0.47 - 0.6 - 0.05, zz, { schatten: false });
  }
  k(statisch, L.b, 0.02, L.b, schacht, L.x, -1.6, L.z, { schatten: false });      // Grund des Schachts

  // Wasser mit dünner neuer Eishaut: eisMaterial wie auf dem See, ohne Schnee, Ereignis "klar"
  // klarRauheit 0,45: die Lampe direkt darüber spiegelte sich sonst als greller Fleck im klaren Eis
  const haut = eisMaterial(ctx, { farbe: '#a9c6d6', deckFrost: 0.78, deckUnten: 0.85, deckKlar: 0.08, schnee: 0, durchlicht: 0.6, klarFarbe: '#0f2a33', rauheit: 0.4, klarRauheit: 0.45 });
  const hautMesh = new T.Mesh(eisGeometrie({ b: L.b - 0.04, t: L.b - 0.04, mitte: [L.x, L.z], y: H.wasser, kachel: 1.2 }), haut);
  hautMesh.receiveShadow = true; hautMesh.renderOrder = 1; hautMesh.userData.einzeln = true;
  gruppe.add(hautMesh);
  // Wasser darunter: dunkle Fläche, die beim Ereignis "zittern" Ringe zeigt (bewegte Geometrie, nur aus t)
  const wasserGeo = new T.PlaneGeometry(L.b - 0.04, L.b - 0.04, 24, 24); wasserGeo.rotateX(-Math.PI / 2);
  const wasserBasis = wasserGeo.attributes.position.array.slice();
  // durchsichtig: ein Gesicht direkt unter der Haut bleibt sichtbar; die Ringe zeigen sich als Glanz
  const wasser = new T.Mesh(wasserGeo, new T.MeshStandardMaterial({ color: '#1b4250', roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.28, depthWrite: false }));
  wasser.position.set(L.x, H.wasser - 0.006, L.z); wasser.userData.einzeln = true; wasser.renderOrder = 0;
  gruppe.add(wasser);

  // ---------- Wände, Decke (Pultdach), Eckleisten ----------
  const wandStueck = (b, h, t, x, y, zz) => k(statisch, b, h, t, wandMat, x, y, zz);
  const F = H.fenster, Tu = H.tuer;
  // hinten (z0) und links (x0): ganz
  wandStueck(B + 0.16, 2.3, 0.08, 0, 1.15, H.z0 - 0.04);
  wandStueck(0.08, 2.3, Tt + 0.16, H.x0 - 0.04, 1.15, 0);
  // rechts (x1) mit Fensteröffnung
  const fz0 = F.z - F.b / 2, fz1 = F.z + F.b / 2, fy0 = F.y - F.h / 2, fy1 = F.y + F.h / 2;
  wandStueck(0.08, 2.3, fz0 - H.z0, H.x1 + 0.04, 1.15, (H.z0 + fz0) / 2);
  wandStueck(0.08, 2.3, H.z1 - fz1, H.x1 + 0.04, 1.15, (fz1 + H.z1) / 2);
  wandStueck(0.08, fy0, F.b, H.x1 + 0.04, fy0 / 2, F.z);
  wandStueck(0.08, 2.3 - fy1, F.b, H.x1 + 0.04, (fy1 + 2.3) / 2, F.z);
  // vorn (z1) mit Tür
  const tx0 = Tu.x - Tu.b / 2, tx1 = Tu.x + Tu.b / 2;
  wandStueck(tx0 - H.x0 + 0.08, 2.3, 0.08, (H.x0 - 0.08 + tx0) / 2, 1.15, H.z1 + 0.04);
  wandStueck(H.x1 + 0.08 - tx1, 2.3, 0.08, (tx1 + H.x1 + 0.08) / 2, 1.15, H.z1 + 0.04);
  wandStueck(Tu.b, 2.3 - Tu.h, 0.08, Tu.x, (Tu.h + 2.3) / 2, H.z1 + 0.04);
  // Decke: Pultdach, fällt nach hinten ab; ein Querbalken
  const neig = Math.atan2(H.deckeVorn - H.deckeHinten, Tt);
  k(statisch, B + 0.2, 0.05, Tt / Math.cos(neig) + 0.1, wandMat, 0, (H.deckeVorn + H.deckeHinten) / 2 + 0.025, 0, { dreh: [-neig, 0, 0] });
  k(statisch, B, 0.1, 0.1, leiste, 0, (H.deckeVorn + H.deckeHinten) / 2 - 0.05, 0);
  for (const sx of [H.x0 + 0.03, H.x1 - 0.03]) for (const sz of [H.z0 + 0.03, H.z1 - 0.03]) k(statisch, 0.06, 2.1, 0.06, leiste, sx, 1.05, sz);
  for (const sz of [H.z0 + 0.02, H.z1 - 0.02]) k(statisch, B, 0.08, 0.04, leiste, 0, 0.04, sz);
  for (const sx of [H.x0 + 0.02, H.x1 - 0.02]) k(statisch, 0.04, 0.08, Tt, leiste, sx, 0.04, 0);

  // ---------- Tür mit Riegel (innen) ----------
  const tuerMat = tmat(ctx, '#6f5236', 'holz', { rauheit: 0.8 });
  k(statisch, Tu.b, Tu.h, 0.04, tuerMat, Tu.x, Tu.h / 2, H.z1 - 0.01);
  for (const y of [0.35, 0.95, 1.55]) k(statisch, Tu.b - 0.1, 0.12, 0.03, leiste, Tu.x, y, H.z1 - 0.045);
  k(statisch, 0.08, 1.45, 0.03, leiste, Tu.x, 0.95, H.z1 - 0.045, { dreh: [0, 0, 0.62] });
  for (const sx of [-1, 1]) k(statisch, 0.06, Tu.h + 0.06, 0.05, leiste, Tu.x + sx * (Tu.b / 2 + 0.03), Tu.h / 2, H.z1 - 0.03);
  const messing = ctx.mat('#a88b52', { rauheit: 0.35, metall: 0.7 });
  // Riegel: Gehäuse auf der Tür (Seite −x, die Schlossseite), Schließblech am Rahmen, bewegter Bolzen mit Knauf
  const riegelY = 1.12, riegelZ = H.z1 - 0.06;
  k(statisch, 0.2, 0.07, 0.025, messing, Tu.x - Tu.b / 2 + 0.16, riegelY, riegelZ);
  k(statisch, 0.07, 0.09, 0.03, messing, Tu.x - Tu.b / 2 - 0.05, riegelY, riegelZ + 0.005);
  const bolzen = new T.Group(); gruppe.add(bolzen);
  k(bolzen, 0.2, 0.026, 0.026, messing, 0, 0, 0, { rund: 0.01 });
  k(bolzen, 0.026, 0.07, 0.026, messing, 0.02, 0.04, -0.01, { rund: 0.01 });
  const bolzenAuf = Tu.x - Tu.b / 2 + 0.17, bolzenZu = Tu.x - Tu.b / 2 + 0.02;
  bolzen.position.set(bolzenAuf, riegelY, riegelZ - 0.02);
  bolzen.traverse((o) => { o.userData.einzeln = true; });
  // Griff
  k(statisch, 0.03, 0.14, 0.05, eisen, Tu.x - Tu.b / 2 + 0.12, 0.98, H.z1 - 0.07);

  // ---------- Fenster mit Frost (Eisblumen), Ereignis "hauch" ----------
  const frostTex = ctx.zeichenTextur((g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, w * 0.15, w / 2, h / 2, w * 0.75);
    // fast weiß vor Frost (Bibel S42), zur Mitte etwas dunkler und bläulich (Nacht draußen)
    gr.addColorStop(0, '#9aaac4'); gr.addColorStop(1, '#e4ecf5');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    // Eisblumen: verzweigte weiße Farnwedel von den Rändern zur Mitte
    const zz = ctx.zufall('frost');
    const ast = (x, y, a, l, tiefe) => {
      if (tiefe <= 0 || l < 3) return;
      const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l;
      g.strokeStyle = `rgba(240,248,255,${0.35 + tiefe * 0.12})`; g.lineWidth = tiefe * 0.8;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
      const n = 3 + Math.floor(zz() * 3);
      for (let i = 1; i <= n; i++) {
        const t = i / (n + 1), px = x + (x2 - x) * t, py = y + (y2 - y) * t;
        ast(px, py, a + 0.9 + (zz() - 0.5) * 0.3, l * 0.38, tiefe - 1);
        ast(px, py, a - 0.9 + (zz() - 0.5) * 0.3, l * 0.38, tiefe - 1);
      }
    };
    for (let i = 0; i < 26; i++) {
      const seite = i % 4, u = zz();
      const [x, y] = [[u * w, 0], [w, u * h], [u * w, h], [0, u * h]][seite];
      const a = Math.atan2(h / 2 - y, w / 2 - x) + (zz() - 0.5) * 0.9;
      ast(x, y, a, 40 + zz() * 70, 4);
    }
    g.fillStyle = 'rgba(235,244,255,0.18)'; g.fillRect(0, 0, w, h);
  }, 512, 400);
  const frostMat = new T.MeshStandardMaterial({ map: frostTex, emissive: new T.Color('#8fa8d0'), emissiveMap: frostTex, emissiveIntensity: 0.45, roughness: 0.4 });
  const hauchU = { uHauch: { value: new T.Vector4(0.5, 0.45, 0.22, 0) } };
  frostMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, hauchU);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec4 uHauch;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  {
    // Warmer Atem auf der Frostscheibe: der Frost taut zu einem dunklen, nassen Fleck mit hellem
    // Beschlag-Rand, der wieder zufriert (uHauch.w = Stärke). Auf weißem Frost liest sich nur dunkel.
    vec2 d = (vMapUv - uHauch.xy) * vec2(1.28, 1.0);
    float r = length(d);
    float innen = (1.0 - smoothstep(uHauch.z * 0.45, uHauch.z * 0.85, r)) * uHauch.w;
    float rand = (1.0 - smoothstep(0.0, uHauch.z * 0.22, abs(r - uHauch.z * 0.9))) * uHauch.w;
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.16, 0.22, 0.32), innen * 0.85);
    totalEmissiveRadiance *= 1.0 - innen * 0.75;
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.97, 0.98, 1.0), rand * 0.7);
  }`);
  };
  frostMat.customProgramCacheKey = () => 'kindly-frostfenster';
  const scheibe = new T.Mesh(new T.PlaneGeometry(F.b, F.h), frostMat);
  scheibe.position.set(H.x1 + 0.035, F.y, F.z); scheibe.rotation.y = -Math.PI / 2;
  scheibe.userData.einzeln = true;
  gruppe.add(scheibe);
  // Rahmen: oben, unten, links, rechts, Mittelsprosse (b = Ausdehnung längs der Wand, h = Höhe)
  for (const [b, h, dy, dz] of [[F.b + 0.08, 0.05, F.h / 2 + 0.02, 0], [F.b + 0.08, 0.06, -F.h / 2 - 0.03, 0], [0.04, F.h, 0, F.b / 2 + 0.02], [0.04, F.h, 0, -F.b / 2 - 0.02], [0.025, F.h, 0, 0]]) k(statisch, 0.05, h, b, leiste, H.x1 - 0.005, F.y + dy, F.z + dz);
  k(statisch, 0.12, 0.03, F.b + 0.1, leiste, H.x1 - 0.06, F.y - F.h / 2 - 0.05, F.z);   // Fensterbrett

  // ---------- Ofen mit Glut, Ofenrohr ----------
  const ofenX = -0.72, ofenZ = -1.02;
  const og = new T.Group(); og.position.set(ofenX, 0, ofenZ); og.rotation.y = 0.35; statisch.add(og);
  for (const sx of [-0.18, 0.18]) for (const sz of [-0.18, 0.18]) k(og, 0.05, 0.2, 0.05, eisen, sx, 0.1, sz);
  k(og, 0.48, 0.46, 0.46, eisen, 0, 0.43, 0, { rund: 0.02 });
  k(og, 0.52, 0.04, 0.5, eisen, 0, 0.68, 0, { rund: 0.01 });
  k(og, 0.3, 0.22, 0.03, ctx.mat('#3a3633', { rauheit: 0.5, metall: 0.5 }), 0, 0.42, 0.235);
  zyl(og, 0.065, 0.065, H.deckeHinten + 0.2 - 0.7, eisen, -0.08, 0.7 + (H.deckeHinten + 0.2 - 0.7) / 2, -0.08, { segmente: 10 });
  // Glut hinter dem Sichtfenster der Ofentür (Lichtgruppe "ofen")
  const glutMat = ctx.leuchtMat('#ff8a3a', 2.6 * (params.ofen ?? 1));
  const glut = k(gruppe, 0.22, 0.13, 0.02, glutMat, 0, 0, 0, { schatten: false });
  glut.position.set(ofenX + Math.sin(0.35) * 0.255, 0.42, ofenZ + Math.cos(0.35) * 0.255); glut.rotation.y = 0.35;
  glut.userData.einzeln = true;
  // Holzscheite neben dem Ofen, Wasserkessel obendrauf
  for (let i = 0; i < 5; i++) zyl(statisch, 0.05, 0.05, 0.38, tmat(ctx, '#7a5638', 'holz'), -0.98 + (i % 3) * 0.1, 0.05 + Math.floor(i / 3) * 0.09, -0.4 + (i % 2) * 0.03, { dreh: [Math.PI / 2, 0, 0], segmente: 7 });
  zyl(og, 0.1, 0.12, 0.16, ctx.mat('#4a5560', { metall: 0.5, rauheit: 0.4 }), 0.08, 0.78, 0.04, { segmente: 12 });

  // ---------- Bank rechts, Regal mit Thermoskanne, Angelruten, Eimer ----------
  const bankMat = tmat(ctx, '#8a6240', 'holz', { rauheit: 0.8 });
  k(statisch, 0.4, 0.05, 1.7, bankMat, H.x1 - 0.22, 0.45, -0.3);
  for (const sz of [-1.05, 0.45]) k(statisch, 0.36, 0.43, 0.05, bankMat, H.x1 - 0.22, 0.215, sz);
  k(statisch, 0.5, 0.03, 0.22, bankMat, -0.55, 1.45, H.z0 + 0.12);   // Regal an der Rückwand
  zyl(statisch, 0.045, 0.045, 0.28, ctx.mat('#2f5d4a', { rauheit: 0.4, metall: 0.3 }), -0.68, 1.6, H.z0 + 0.12, { segmente: 10 });
  zyl(statisch, 0.04, 0.035, 0.09, ctx.mat('#c9c2b0', { rauheit: 0.5 }), -0.52, 1.51, H.z0 + 0.12, { segmente: 10 });
  for (let i = 0; i < 3; i++) {
    k(statisch, 0.015, 0.75, 0.015, ctx.mat('#3a3a3a', { rauheit: 0.4 }), 0.25 + i * 0.12, 1.15, H.z0 + 0.04, { dreh: [0.05, 0, 0.04 * (i - 1)] });
    zyl(statisch, 0.035, 0.035, 0.06, ctx.mat('#c05030'), 0.25 + i * 0.12, 0.85, H.z0 + 0.06, { dreh: [0, 0, Math.PI / 2], segmente: 8 });
  }
  zyl(statisch, 0.15, 0.13, 0.3, ctx.mat('#b8b0a0', { rauheit: 0.5, metall: 0.3 }), 0.35, 0.15, 0.1, { segmente: 12 });
  // Haken mit Seil und Eisschöpfer an der linken Wand
  k(statisch, 0.04, 0.4, 0.04, leiste, H.x0 + 0.03, 1.55, 0.6);
  zyl(statisch, 0.11, 0.11, 0.02, eisen, H.x0 + 0.12, 1.2, 0.6, { dreh: [0, 0, Math.PI / 2], segmente: 12 });
  k(statisch, 0.03, 0.55, 0.03, leiste, H.x0 + 0.12, 1.48, 0.6);

  // ---------- Petroleumlampe an der Decke (Lichtgruppe "lampe") ----------
  const lampeX = 0.15, lampeZ = -0.35, lampeY = 1.72;
  k(statisch, 0.01, (H.deckeVorn + H.deckeHinten) / 2 - lampeY - 0.18, 0.01, eisen, lampeX, (lampeY + 0.18 + (H.deckeVorn + H.deckeHinten) / 2) / 2, lampeZ, { schatten: false });
  zyl(statisch, 0.09, 0.07, 0.06, ctx.mat('#7a6a40', { metall: 0.6, rauheit: 0.4 }), lampeX, lampeY - 0.12, lampeZ, { segmente: 10 });
  zyl(statisch, 0.07, 0.07, 0.02, eisen, lampeX, lampeY + 0.13, lampeZ, { segmente: 10 });
  const lampeMat = ctx.leuchtMat('#ffd08a', 2.2 * (params.lampe ?? 1));
  const zylinder = zyl(gruppe, 0.045, 0.06, 0.2, lampeMat, lampeX, lampeY, lampeZ, { segmente: 10, schatten: false });
  zylinder.userData.einzeln = true;

  // ---------- Holzdeckel fürs Loch (bewegt sich beim Ereignis deckel_drauf) ----------
  const deckel = new T.Group(); gruppe.add(deckel);
  const deckelHolz = tmat(ctx, '#9a7650', 'holz', { rauheit: 0.85 });
  for (let i = 0; i < 5; i++) k(deckel, 0.155, 0.035, L.b + 0.12, deckelHolz, -0.33 + i * 0.165, 0, 0, { rund: 0.006 });
  for (const sz of [-0.25, 0.25]) k(deckel, L.b + 0.08, 0.03, 0.08, leiste, 0, 0.03, sz);
  k(deckel, 0.18, 0.04, 0.05, eisen, 0, 0.065, 0, { rund: 0.015 });   // Griff
  deckel.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.userData.einzeln = true; } });
  const [rx, ry, rz, rdreh] = H.deckelRest;
  const deckelPose = (p) => {
    // Bogen: vom Boden heben, übers Loch, absetzen; dreht sich dabei gerade
    const x = rx + (L.x - rx) * p, zz = rz + (L.z - rz) * p;
    const y = ry + 0.02 * p + Math.sin(Math.PI * p) * 0.28;
    deckel.position.set(x, y + 0.0175, zz);
    deckel.rotation.set(Math.sin(Math.PI * p) * 0.35, rdreh * (1 - p), 0);
  };
  deckelPose(0);

  verschmelze(statisch);

  // ---------- Punktlichter: Ofen (flackert) und Lampe ----------
  const ofenLichter = [], lampeLichter = [];
  let ofenLicht = null;
  if (params.punktlichter !== false) {
    ofenLicht = new T.PointLight('#ff9a4a', 2.6 * (params.ofen ?? 1), 4.5, 2);
    ofenLicht.position.set(ofenX + 0.25, 0.5, ofenZ + 0.45);
    gruppe.add(ofenLicht); ofenLichter.push(ofenLicht);
    const l = new T.PointLight('#ffc888', 3.0 * (params.lampe ?? 1), 6, 2);
    l.position.set(lampeX, lampeY - 0.05, lampeZ);
    gruppe.add(l); lampeLichter.push(l);
  }
  const ofenFarbe = new T.Color('#ff9a4a'), glutFarbe = new T.Color('#ff8a3a');

  return {
    gruppe,
    lichter: {
      ofen: { lichter: ofenLichter, materialien: [glutMat] },
      lampe: { lichter: lampeLichter, materialien: [lampeMat] },
      fenster: { lichter: [], materialien: [frostMat] },
    },
    anker: {
      loch: [L.x, H.wasser, L.z],                 // Eishaut im Loch (Mitte)
      loch_unten: [L.x, H.wasser - 0.12, L.z],    // hier drückt ein Gesicht von unten gegen die Haut (Kopf nach −z)
      deckel: [rx, ry, rz],
      fenster: [H.x1, F.y, F.z],
      riegel: [Tu.x - Tu.b / 2 + 0.08, riegelY, H.z1 - 0.06],
      tuer: [Tu.x, 1.0, H.z1],
      ofen: [ofenX, 0.45, ofenZ],
      lampe: [lampeX, lampeY, lampeZ],
      // Stellplätze für Figuren (position, blick in Klammern)
      stand_fenster: [0.3, 0, F.z],               // Bear am Fenster (blick 90), Gesicht gut 0,5 m vor dem Glas
      stand_ofen: [-0.2, 0, -0.4],                // Gus am Ofen (blick −145: schaut in die Glut)
      stand_tuer: [0.05, 0, 1.0],                 // am Riegel (blick 180)
      knien_loch: [L.x, 0, L.z + 0.62],           // vor dem Loch (blick 180: schaut hinein)
      bank: [H.x1 - 0.22, 0.45, -0.3],            // Sitzplatz (blick −90)
    },
    kamerapunkte: {
      totale: { pos: [0.9, 1.9, 1.3], ziel: [-0.35, 0.5, -0.75], fov: 66 },
      ofen: { pos: [-0.34, 1.55, -1.33], ziel: [-0.3, 1.42, -0.45], fov: 50 },                         // Gus (stand_ofen) von vorn, Glut von der Seite; Ofenrohr außerhalb des Bildes
      loch: { pos: [L.x, 1.35, L.z + 0.72], ziel: [L.x, H.wasser - 0.05, L.z - 0.02], fov: 46 },      // Kopf oben: Gesicht mit dem Kopf nach −z
      loch_nah: { pos: [L.x, 0.62, L.z + 0.36], ziel: [L.x, H.wasser - 0.05, L.z - 0.02], fov: 40 },
      tuer: { pos: [-0.05, 1.4, 0.55], ziel: [Tu.x - Tu.b / 2 + 0.08, 1.12, H.z1], fov: 40 },
      fenster: { pos: [0.0, 1.62, 0.6], ziel: [H.x1, F.y, F.z], fov: 38 },                             // das Glas (Bear steht links davon am Bildrand)
      fenster_gesicht: { pos: [1.05, 1.56, 0.38], ziel: [0.42, 1.5, F.z], fov: 50 },                     // Großaufnahme Bear (stand_fenster), Dreiviertelprofil von vorn
      bank: { pos: [-0.85, 1.3, 1.2], ziel: [0.8, 0.8, -0.45], fov: 52 },
    },
    aktualisiere(t) {
      // Eishaut klar
      haut.eis.setze({ klar: klarStellen(ereignisse, t, { mitte: [L.x, L.z], radius: 0.45 }) });
      // Deckel und Riegel
      deckelPose(ereignisStand(ereignisse, t, { deckel_drauf: 1, deckel_weg: 0 }, 0.6));
      bolzen.position.x = bolzenAuf + (bolzenZu - bolzenAuf) * ereignisStand(ereignisse, t, { riegel_zu: 1, riegel_auf: 0 }, 0.25);
      // Hauch auf dem Fenster: kommt in 0,25 s, vergeht über die Dauer
      let hw = 0;
      for (const e of ereignisse) if (e.was === 'hauch' && t >= e.start) {
        const d = t - e.start, dauer = e.dauer ?? 1.6;
        const w = d < 0.25 ? glatt(d / 0.25) : 1 - glatt((d - 0.25) / Math.max(0.1, dauer - 0.25));
        if (w > hw) { hw = w; hauchU.uHauch.value.set(...(e.mitte ?? [0.5, 0.45]), e.radius ?? 0.22, w); }
      }
      if (hw <= 0) hauchU.uHauch.value.w = 0;
      // Wasser zittert im Takt der Schläge: Ringe aus der Mitte, nach jedem Schlag abklingend
      const pos = wasserGeo.attributes.position.array;
      let bewegt = false;
      for (const e of ereignisse) if (e.was === 'zittern' && t >= e.start && t < e.start + (e.dauer ?? 1.2) + 0.8) bewegt = true;
      if (bewegt || wasser.userData.bewegt) {
        for (let i = 0; i < pos.length; i += 3) {
          const x = wasserBasis[i], zz = wasserBasis[i + 2], r = Math.hypot(x, zz);
          let y = 0;
          for (const e of ereignisse) if (e.was === 'zittern' && t >= e.start) {
            const n = e.schlaege ?? 3, takt = (e.dauer ?? 1.2) / n;
            for (let s = 0; s < n; s++) {
              const d = t - e.start - s * takt;
              if (d > 0 && d < 1.2) y += 0.012 * (e.staerke ?? 1) * Math.sin(r * 38 - d * 24) * Math.exp(-d * 3.5) * Math.exp(-r * 2);
            }
          }
          pos[i + 1] = wasserBasis[i + 1] + y;
        }
        wasserGeo.attributes.position.needsUpdate = true;
        wasserGeo.computeVertexNormals();
        wasser.userData.bewegt = bewegt;
      }
      // Ofen flackert leise (nur aus t, Farbe statt Stärke: die Stärke gehört den Lichtereignissen)
      const fl = 0.86 + 0.08 * Math.sin(t * 7.3) + 0.06 * Math.sin(t * 13.1 + 1.7) + 0.04 * Math.sin(t * 23.7 + 0.4);
      if (ofenLicht) ofenLicht.color.copy(ofenFarbe).multiplyScalar(fl);
      glutMat.emissive.copy(glutFarbe).multiplyScalar(0.9 + (fl - 0.86) * 1.2);
    },
  };
}
