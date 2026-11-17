// Set "see": der zugefrorene See vor Kindly (Rules of Kindly, Folge 1; F3 am Rand, F7 in der Ferne).
// Weit weg von den anderen Sets stellen (z. B. "position": [0, 0, 1000]) und allein zeigen: "set": ["see"].
//
// Lage (lokal, 1 m, y oben):
//   Eisoberfläche y = 0. Der See ist eine Ellipse (rx 75 m, rz 60 m) mit leicht unregelmäßigem Ufer.
//   Norden (−z): das Ufer der Stadt mit dem Steg (x = 0, Stegende bei z ≈ −47) und dahinter Kindly
//   (Fensterlichter, Kirchturm). Rundum Kiefern mit Schnee. Unter dem Eis 3,6 m dunkles Wasser.
//   Das Wesen (Modul old_knuckles, andere Werkstatt) liegt rücklings unter dem Eis bei Anker "wesen",
//   längs z, Kopf nach −z (Norden): von Kameras im Süden aus steht der Kopf dann oben im Bild.
//   Daneben die Hütte „BEAR & GUS“ (Tür nach Norden, zum Steg).
//
// Eis (src/winter.js): halbdurchsichtig mit Rissen und Schneeflecken, von unten leuchtend. Set-Ereignisse
// (params.ereignisse, vom Shotlisten-Compiler aus regie.mjs: haupt/neben { art: "set", set: "see", was, wort }):
//   klar   { mitte [x, z] (Std Anker "stelle"), radius (Std 1,3), dauer (Std 0,8), staerke (Std 1; 0 = friert
//          wieder zu) }: das Eis wird an dieser Stelle klar (S13, S34; bis zu vier Stellen gleichzeitig)
//   risse  { mitte, radius (Std 1,6), dauer (Std 0,12) }: frische Risse aus einem Schlagpunkt (S1, S31)
//
// params: eis { deckFrost, deckUnten, deckKlar, schnee, durchlicht, … } (an eisMaterial), huetten (Std true),
//   stuhl (Std true: Klappstuhl mit rotem Schal, S23), stadt (Std true), dunst (Std true: Nebelbänke am Ufer),
//   punktlicht (Std true: echtes Punktlicht in der Steglaterne, Gegenlicht für den Atemdampf)
// Lichtgruppen: see.laterne (Steglaterne mit Punktlicht und Lichtfleck), see.huette_bg (Fenster und Türlampe
//   mit Punktlicht der Hütte BEAR & GUS), see.huetten (Fenster der anderen Hütten), see.eislaternen (Laternen auf dem Eis, S30),
//   see.stadt (Fenster und Straßenlampen von Kindly). Alle: "see.*".
// Anker und Kamerapunkte: siehe unten (README §19).
import * as THREE from 'three';
import { k, zyl, verschmelze, tmat, lichtPfuetzeMat, lichtPfuetze, nebelKarte, giebel } from '../src/bauteile.js';
import { schneeMat, schneeHaufen, schneeKiefer, eisMaterial, eisGeometrie, klarStellen, rissStellen } from '../src/winter.js';

// ---------- Maße, die Kamerapunkte und Anker brauchen ----------
export const SEE = {
  rx: 75, rz: 60,
  wasserTiefe: 3.6,
  uferHoehe: 0.5,                 // Schnee am Ufer liegt so hoch über dem Eis
  steg: { breite: 1.8, deck: 0.85, x: 0 },
  wesen: [2, -0.55, -26],         // Mitte des liegenden Wesens (rücklings, längs z)
  kopf: [2, -0.38, -31.5],        // sein Kopf (Nord-Ende)
  bg: { x: 8.5, z: -27, b: 2.4, t: 3.0, h: 2.25 },   // Hütte BEAR & GUS (Tür nach −z)
  stuhl: [-18, 0, -40],
};

// Uferlinie: Ellipse mit zwei leisen Wellen (kein perfekter Kreis)
const uferFaktor = (w) => 1 + 0.035 * Math.sin(3 * w + 0.7) + 0.02 * Math.sin(7 * w + 1.9);
const uferPunkt = (w, plus = 0, f = 1) => {
  const u = uferFaktor(w) * f;
  return [(SEE.rx * u + plus) * Math.cos(w), (SEE.rz * u + plus) * Math.sin(w)];
};
export const NORD_Z = -SEE.rz * uferFaktor(-Math.PI / 2);   // ≈ −61,2: Uferlinie am Steg
const STEG_ENDE = NORD_Z + 14;                              // ≈ −47,2: Stegende über dem Eis
const STEG_LAND = NORD_Z - 8;

// Ringfläche um den See: Radien (Faktor auf die Uferlinie, Zusatz in m) und Höhen je Ring.
function ringGeometrie(ringe, segmente = 128, uvMeter = true) {
  const pos = [], uv = [], idx = [];
  for (let s = 0; s <= segmente; s++) {
    const w = (s / segmente) * Math.PI * 2;
    for (const [f, plus, y] of ringe) {
      const [x, z] = uferPunkt(w, plus, f);
      pos.push(x, y, z);
      uv.push(uvMeter ? x : 0, uvMeter ? z : 0);
    }
  }
  const n = ringe.length;
  for (let s = 0; s < segmente; s++) for (let r = 0; r < n - 1; r++) {
    const a = s * n + r, b = (s + 1) * n + r;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export default async function baue(ctx, params = {}) {
  const T = THREE;
  const z = ctx.zufall('see');
  const gruppe = new T.Group();
  const statisch = new T.Group(); gruppe.add(statisch);
  const lichter = {};
  const anker = {};
  const schnee = schneeMat(ctx);
  const schneeHell = schneeMat(ctx, '#f1f5fa');

  // ---------- Eis, Wasser, Seegrund ----------
  // Um das Wesen keine Schneeflecken: sein Umriss bleibt in der Draufsicht (S2) durch den Frost lesbar
  const eisMat = eisMaterial(ctx, { schneefrei: [[SEE.wesen[0], SEE.wesen[2], 3.2, 9]], ...(params.eis ?? {}) });
  const eis = new T.Mesh(eisGeometrie({ radius: 135, segmente: 128, kachel: 14 }), eisMat);
  eis.receiveShadow = true; eis.castShadow = false;
  eis.renderOrder = 1;
  eis.userData.einzeln = true;
  gruppe.add(eis);
  // Seegrund als Schüssel: tief und dunkel in der Mitte, am Ufer steigt er unter das Eis hinauf. So sieht
  // eine Kamera unter dem Eis nirgends den Himmel durch eine Lücke am Rand.
  const grundMat = ctx.mat('#10303a', { rauheit: 0.95 });
  const grund = new T.Mesh(ringGeometrie([[0.0, 0, -SEE.wasserTiefe], [0.6, 0, -SEE.wasserTiefe + 0.2], [0.92, 0, -2.3], [0.99, 0, -0.7], [1.0, 1.5, 0.2]], 96, false), grundMat);
  grund.receiveShadow = true;
  statisch.add(grund);
  // Steine und Wasserpflanzen am Grund (Maßstab für die Untersicht)
  const steinMat = ctx.mat('#3c5458', { rauheit: 0.9, flach: true });
  const krautMat = ctx.mat('#2f5a4a', { rauheit: 0.9, flach: true });
  for (let i = 0; i < 60; i++) {
    const w = z() * Math.PI * 2, r = 4 + z() * 40;
    const x = Math.cos(w) * r, zz = Math.sin(w) * r * 0.8 - 18;
    const st = new T.Mesh(new T.IcosahedronGeometry(0.2 + z() * 0.5, 0), steinMat);
    st.position.set(x, -SEE.wasserTiefe + 0.15, zz); st.scale.y = 0.6; st.rotation.y = z() * 3;
    statisch.add(st);
    if (z() < 0.5) zyl(statisch, 0.02, 0.05, 0.8 + z() * 1.2, krautMat, x + 0.4, -SEE.wasserTiefe + 0.5, zz + 0.3, { segmente: 4, schatten: false });
  }

  // ---------- Ufer: Schneebank rund um den See ----------
  // innerer Rand liegt knapp unter dem Eis (keine Naht), dann steigt der Schnee auf die Uferhöhe
  const ufer = new T.Mesh(ringGeometrie([[0.985, 0, -0.25], [1.0, 0, 0.06], [1.02, 0.8, 0.32], [1.06, 3, SEE.uferHoehe], [1.0, 220, SEE.uferHoehe]], 160), schnee);
  ufer.receiveShadow = true;
  statisch.add(ufer);
  // Uferplatz am Steg: eben, damit Figuren am Ufer gerade stehen (S3–4); Anker "ufer"
  k(statisch, 28, SEE.uferHoehe + 0.005, 12, schnee, 0, (SEE.uferHoehe + 0.005) / 2, NORD_Z - 7.2, { rund: 0.2 });
  for (let i = 0; i < 18; i++) schneeHaufen(ctx, statisch, -13 + i * 1.55 + (z() - 0.5), 0.1, NORD_Z - 1.0 + (z() - 0.5) * 0.6, 0.9 + z() * 0.6, 0.35 + z() * 0.2, 0.7, z);

  // ---------- Steg mit Pfosten, Laterne am Stegende, Stufen aufs Eis ----------
  const S = SEE.steg;
  const holz = tmat(ctx, '#7d6a58', 'holz', { rauheit: 0.85 });
  const holzDunkel = tmat(ctx, '#5a4a3c', 'holz', { rauheit: 0.9 });
  const laenge = STEG_ENDE - STEG_LAND;
  for (let zz = STEG_LAND + 0.1; zz < STEG_ENDE; zz += 0.2) k(statisch, S.breite, 0.06, 0.18, holz, S.x, S.deck - 0.03, zz + 0.09, { rund: 0.01 });
  for (const sx of [-0.7, 0, 0.7]) k(statisch, 0.14, 0.2, laenge, holzDunkel, S.x + sx, S.deck - 0.16, (STEG_LAND + STEG_ENDE) / 2);
  // Pfosten paarweise alle 2,4 m: ragen 0,32 m über das Deck (Bibel: „Steg mit Pfosten“). Kameras auf dem
  // Steg stehen 1,5 m über dem Deck, damit kein Pfosten vor der Linse liegt (Review F1, M13).
  for (let zz = STEG_LAND + 1.2; zz <= STEG_ENDE + 0.05; zz += 2.4) for (const sx of [-1, 1]) {
    const px = S.x + sx * (S.breite / 2 + 0.06);
    zyl(statisch, 0.1, 0.11, S.deck + 1.3, holzDunkel, px, (S.deck + 1.3) / 2 - 1.0, zz, { segmente: 8 });
    schneeHaufen(ctx, statisch, px, S.deck + 0.3, zz, 0.13, 0.07, 0.13, z, schneeHell);
  }
  // Schnee auf dem Deck: an den Rändern liegen geblieben, in der Mitte ein festgetretener Weg
  for (const sx of [-1, 1]) k(statisch, 0.42, 0.04, laenge, schnee, S.x + sx * (S.breite / 2 - 0.21), S.deck + 0.02, (STEG_LAND + STEG_ENDE) / 2, { rund: 0.02, schatten: false });
  // Stufen vom Stegende hinunter aufs Eis (nach +z)
  const stufen = 4;
  for (let i = 0; i < stufen; i++) {
    const hS = S.deck - (i + 1) * (S.deck / stufen);
    k(statisch, 1.3, S.deck / stufen, 0.32, holz, S.x, hS + S.deck / stufen / 2, STEG_ENDE + 0.16 + i * 0.32);
    k(statisch, 0.3, 0.03, 0.3, schnee, S.x - 0.48, hS + S.deck / stufen + 0.015, STEG_ENDE + 0.16 + i * 0.32, { schatten: false });
  }
  // Laterne am Stegende: Pfahl mit Arm, Laterne mit warmem Glas, echtes Punktlicht (Gegenlicht für den Atem)
  const eisen = ctx.mat('#2a2c31', { rauheit: 0.55, metall: 0.4 });
  const lx = S.x + S.breite / 2 - 0.1, lz = STEG_ENDE - 0.35, lTop = S.deck + 2.35;
  zyl(statisch, 0.07, 0.08, lTop, eisen, lx, lTop / 2, lz, { segmente: 8 });
  k(statisch, 0.6, 0.05, 0.05, eisen, lx - 0.28, lTop - 0.05, lz);
  k(statisch, 0.3, 0.06, 0.3, eisen, lx - 0.52, lTop - 0.18, lz, { rund: 0.02 });
  for (const [dx, dz] of [[-0.13, -0.13], [0.13, -0.13], [-0.13, 0.13], [0.13, 0.13]]) k(statisch, 0.025, 0.36, 0.025, eisen, lx - 0.52 + dx, lTop - 0.38, lz + dz, { schatten: false });
  k(statisch, 0.32, 0.05, 0.32, eisen, lx - 0.52, lTop - 0.58, lz);
  schneeHaufen(ctx, statisch, lx - 0.52, lTop - 0.17, lz, 0.16, 0.06, 0.16, z, schneeHell);
  const laternGlas = ctx.leuchtMat('#ffcf8a', 1.7);
  const glas = k(gruppe, 0.24, 0.32, 0.24, laternGlas, lx - 0.52, lTop - 0.38, lz, { schatten: false });
  glas.userData.einzeln = true;
  const laternPfuetze = lichtPfuetzeMat(ctx, '#ffb874', 0.35, { ohneGlanz: true });
  lichtPfuetze(ctx, gruppe, lx - 0.52, lz, laternPfuetze, 2.4, S.deck + 0.05);
  const laternLichter = [];
  if (params.punktlicht !== false) {
    const pl = new T.PointLight('#ffc080', 4.5, 11, 2);
    pl.position.set(lx - 0.52, lTop - 0.45, lz);
    pl.castShadow = false;
    gruppe.add(pl);
    laternLichter.push(pl);
  }
  lichter.laterne = { lichter: laternLichter, materialien: [laternGlas, laternPfuetze] };
  anker.laterne = [lx - 0.52, lTop - 0.38, lz];

  // ---------- Eishütten (Quader mit Pultdach, Ofenrohr, Kufen; eine mit Tür „BEAR & GUS“) ----------
  const schrift = new FontFace('Archivo Black', `url(${ctx.engineUrl}assets/schriften/ArchivoBlack-Regular.ttf)`);
  await schrift.load();
  document.fonts.add(schrift);
  const huettenFenster = ctx.leuchtMat('#ffc47a', 2.2);
  const bgFenster = ctx.leuchtMat('#ffc47a', 2.4);
  const bgLampe = ctx.leuchtMat('#ffd9a0', 2.2);
  const huette = (h) => {
    const g = new T.Group(); g.position.set(h.x, 0, h.z); g.rotation.y = h.dreh ?? 0; statisch.add(g);
    const wand = tmat(ctx, h.farbe, 'verkleidung', { rauheit: 0.85 });
    const kante = ctx.mat('#e8e2d6', { rauheit: 0.7 });
    // Kufen, Körper, Eckleisten
    for (const sx of [-1, 1]) k(g, 0.12, 0.12, h.t + 0.3, holzDunkel, sx * (h.b / 2 - 0.25), 0.06, 0);
    k(g, h.b, h.h, h.t, wand, 0, 0.12 + h.h / 2, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k(g, 0.08, h.h, 0.08, kante, sx * h.b / 2, 0.12 + h.h / 2, sz * h.t / 2, { rund: 0.01 });
    // Pultdach (fällt nach hinten ab) mit Schneedecke
    const neig = 0.16;
    k(g, h.b + 0.3, 0.1, h.t + 0.4, holzDunkel, 0, 0.12 + h.h + 0.12, 0, { dreh: [-neig, 0, 0] });
    k(g, h.b + 0.22, 0.12, h.t + 0.3, schneeHell, 0, 0.12 + h.h + 0.23, -0.02, { dreh: [-neig, 0, 0], rund: 0.05 });
    // Tür vorn (+z lokal): Blatt, Rahmen, Griff
    const tuerFarbe = ctx.mat(h.tuer ?? '#3a3a40', { rauheit: 0.7 });
    k(g, 0.82, 1.8, 0.05, tuerFarbe, h.tuerX ?? 0, 0.12 + 0.95, h.t / 2 + 0.02);
    for (const sx of [-1, 1]) k(g, 0.06, 1.86, 0.06, kante, (h.tuerX ?? 0) + sx * 0.44, 0.12 + 0.95, h.t / 2 + 0.03);
    k(g, 0.94, 0.06, 0.06, kante, h.tuerX ?? 0, 0.12 + 1.88, h.t / 2 + 0.03);
    k(g, 0.04, 0.12, 0.05, ctx.mat('#b8a070', { metall: 0.6, rauheit: 0.4 }), (h.tuerX ?? 0) + 0.3, 0.12 + 0.95, h.t / 2 + 0.07, { schatten: false });
    // Fenster an der Seite (+x lokal), warm von innen
    const fm = h.fensterMat ?? huettenFenster;
    const f = k(g, 0.04, 0.36, 0.46, fm, h.b / 2 + 0.01, 0.12 + 1.45, -0.2, { schatten: false });
    f.userData.einzeln = true;
    for (const [dy, dz, hh, tt] of [[0.21, 0, 0.05, 0.56], [-0.21, 0, 0.05, 0.56], [0, 0.26, 0.42, 0.05], [0, -0.26, 0.42, 0.05]]) k(g, 0.05, hh, tt, kante, h.b / 2 + 0.02, 0.12 + 1.45 + dy, -0.2 + dz, { schatten: false });
    // Ofenrohr mit Hut
    const rohr = ctx.mat('#3a3b3f', { metall: 0.5, rauheit: 0.5 });
    zyl(g, 0.07, 0.07, 0.9, rohr, -h.b * 0.25, 0.12 + h.h + 0.6, -h.t * 0.2, { segmente: 8 });
    k(g, 0.24, 0.04, 0.24, rohr, -h.b * 0.25, 0.12 + h.h + 1.08, -h.t * 0.2);
    // Schnee an den Wänden angeweht
    // an der Rückwand und den Seiten (nicht vor der Tür)
    for (let i = 0; i < 3; i++) schneeHaufen(ctx, g, (i - 1) * h.b * 0.36, 0, -h.t / 2 - 0.12, 0.5 + z() * 0.3, 0.2 + z() * 0.12, 0.32, z);
    for (const sx of [-1, 1]) schneeHaufen(ctx, g, sx * (h.b / 2 + 0.12), 0, (z() - 0.5) * h.t * 0.5, 0.3, 0.18 + z() * 0.1, 0.8, z);
    return g;
  };
  const HUETTEN = [
    { id: 'bg', x: SEE.bg.x, z: SEE.bg.z, b: SEE.bg.b, t: SEE.bg.t, h: SEE.bg.h, farbe: '#6a87a4', tuer: '#3c5672', dreh: Math.PI, fensterMat: bgFenster },
    { id: 'h2', x: -7.5, z: -33.5, b: 2.2, t: 2.6, h: 2.1, farbe: '#9a3d33', tuer: '#5a2420', dreh: Math.PI * 0.92 },
    { id: 'h3', x: 15.5, z: -38.5, b: 2.0, t: 2.4, h: 2.0, farbe: '#4e7350', tuer: '#2f4a32', dreh: Math.PI * 1.1 },
    { id: 'h4', x: -15, z: -22, b: 2.3, t: 2.8, h: 2.15, farbe: '#c49a45', tuer: '#6a4e22', dreh: Math.PI * 0.8 },
    { id: 'h5', x: -2.5, z: -15.5, b: 2.1, t: 2.5, h: 2.05, farbe: '#7a6a8e', tuer: '#463c56', dreh: Math.PI * 1.05 },
  ];
  if (params.huetten !== false) {
    for (const h of HUETTEN) huette(h);
    // Tür-Aufschrift „BEAR & GUS“ (Spitznamen-Klammer, Bibel §2): weiß von Hand gemalt, leicht schief
    const B = SEE.bg;
    const tex = ctx.zeichenTextur((g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = '#f4efe2'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const zeile = (text, y, gr, dreh) => { g.save(); g.translate(w / 2, y); g.rotate(dreh); g.font = `${gr}px "Archivo Black"`; g.fillText(text, 0, 0); g.restore(); };
      zeile('BEAR', h * 0.3, h * 0.3, -0.035);
      zeile('& GUS', h * 0.7, h * 0.3, 0.025);
      // Pinselränder: ein paar Farbspritzer
      for (let i = 0; i < 26; i++) { g.globalAlpha = 0.5; g.beginPath(); g.arc(w * (0.12 + 0.76 * ((i * 37) % 100) / 100), h * (0.12 + 0.76 * ((i * 61) % 100) / 100), 1.5, 0, 7); g.fill(); }
      g.globalAlpha = 1;
    }, 512, 384);
    const aufschrift = new T.Mesh(new T.PlaneGeometry(0.74, 0.555), new T.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.3, roughness: 0.75 }));
    // Tür liegt lokal bei +z; die Hütte ist um 180° gedreht, die Tür zeigt also nach −z (Welt)
    aufschrift.position.set(B.x, 0.12 + 1.38, B.z - B.t / 2 - 0.06);
    aufschrift.rotation.y = Math.PI;
    aufschrift.userData.einzeln = true;
    gruppe.add(aufschrift);
    // Türlampe über der Tür: Die Tür liegt nachts im Mondschatten (Prüfbild: Mittel 41 von 255); die Lampe
    // macht die Aufschrift auch in der Totalen S41 lesbar. Zweites Punktlicht des Sets.
    const lampe = k(gruppe, 0.16, 0.2, 0.14, bgLampe, B.x + 0.62, 0.12 + 2.05, B.z - B.t / 2 - 0.1, { schatten: false });
    lampe.userData.einzeln = true;
    k(statisch, 0.2, 0.05, 0.18, eisen, B.x + 0.62, 0.12 + 2.17, B.z - B.t / 2 - 0.1);
    const bgLichter = [];
    if (params.punktlicht !== false) {
      const pl = new T.PointLight('#ffcf98', 2.2, 6, 2);
      pl.position.set(B.x + 0.5, 0.12 + 2.0, B.z - B.t / 2 - 0.55);
      gruppe.add(pl); bgLichter.push(pl);
    }
    lichter.huette_bg = { lichter: bgLichter, materialien: [bgFenster, bgLampe] };
    lichter.huetten = { lichter: [], materialien: [huettenFenster] };
    anker.huette_bg = [B.x, 0, B.z];
    anker.huette_bg_tuer = [B.x, 1.07, B.z - B.t / 2 - 0.05];
    HUETTEN.forEach((h) => { anker[`huette_${h.id}`] = [h.x, 0, h.z]; });
  }

  // ---------- Fischen auf dem Eis: Löcher mit Matschrand, Fähnchen, Eimer, Laternen (S30) ----------
  const lochMat = ctx.mat('#0e2228', { rauheit: 0.25 });
  const matsch = ctx.mat('#c9d6df', { rauheit: 0.6 });
  const fahne = ctx.mat('#e06a2a', { rauheit: 0.7 });
  const LOECHER = [[5.2, -24.5], [-4.8, -30.5], [12.5, -34.5], [-11.5, -25.5]];
  LOECHER.forEach(([x, zz], i) => {
    const l = new T.Mesh(new T.CircleGeometry(0.16, 16), lochMat); l.rotation.x = -Math.PI / 2; l.position.set(x, 0.012, zz); statisch.add(l);
    const r = new T.Mesh(new T.RingGeometry(0.16, 0.36, 16), matsch); r.rotation.x = -Math.PI / 2; r.position.set(x, 0.01, zz); statisch.add(r);
    // Fähnchen (Tip-up): Holzkreuz, Draht, orange Fahne
    k(statisch, 0.6, 0.03, 0.04, holz, x + 0.05, 0.03, zz, { schatten: false });
    k(statisch, 0.02, 0.5, 0.02, eisen, x + 0.25, 0.28, zz, { schatten: false });
    k(statisch, 0.01, 0.16, 0.2, fahne, x + 0.25, 0.46, zz + 0.1, { schatten: false });
    anker[`loch_${i}`] = [x, 0, zz];
  });
  const eimer = ctx.mat('#c9c2b0', { rauheit: 0.5, metall: 0.3 });
  for (const [x, zz] of [[6.0, -23.6], [-10.6, -26.2]]) zyl(statisch, 0.17, 0.14, 0.34, eimer, x, 0.17, zz, { segmente: 10 });
  const eisLaternMats = [];
  for (const [x, zz] of [[4.6, -23.2], [-6.2, -30.9], [11.6, -33.4], [-12.4, -24.6], [1.2, -17.0]]) {
    zyl(statisch, 0.09, 0.1, 0.06, eisen, x, 0.03, zz, { segmente: 8 });
    const m = ctx.leuchtMat('#ffcf8a', 3.2);
    const gl = zyl(gruppe, 0.07, 0.07, 0.18, m, x, 0.15, zz, { segmente: 8, schatten: false });
    gl.userData.einzeln = true;
    zyl(statisch, 0.1, 0.1, 0.04, eisen, x, 0.26, zz, { segmente: 8 });
    const p = lichtPfuetzeMat(ctx, '#ffb874', 0.4, { ohneGlanz: true });
    lichtPfuetze(ctx, gruppe, x, zz, p, 1.6, 0.03);
    eisLaternMats.push(m, p);
  }
  lichter.eislaternen = { lichter: [], materialien: eisLaternMats };

  // ---------- Klappstuhl mit rotem Schal (S23: Mom, nur als Gegenstand) ----------
  if (params.stuhl !== false) {
    const [cx, , cz] = SEE.stuhl;
    const c = new T.Group(); c.position.set(cx, 0, cz); c.rotation.y = 2.25; statisch.add(c);   // Sitz schaut nach Nordost (zur Kamera)
    const rohr = ctx.mat('#8a9096', { metall: 0.6, rauheit: 0.4 });
    const stoff = ctx.mat('#3f5a6a', { rauheit: 0.85 });
    // X-Gestell, Sitz, Lehne
    for (const sx of [-0.22, 0.22]) {
      k(c, 0.03, 0.62, 0.03, rohr, sx, 0.3, 0, { dreh: [0.62, 0, 0] });
      k(c, 0.03, 0.62, 0.03, rohr, sx, 0.3, 0, { dreh: [-0.62, 0, 0] });
      k(c, 0.03, 0.55, 0.03, rohr, sx, 0.74, -0.2, { dreh: [-0.12, 0, 0] });
    }
    k(c, 0.48, 0.03, 0.4, stoff, 0, 0.47, 0, { rund: 0.01 });
    k(c, 0.48, 0.3, 0.025, stoff, 0, 0.82, -0.22, { dreh: [-0.12, 0, 0] });
    // Schal: über die Lehne gelegt, ein Ende hängt bis fast aufs Eis (eigene, kräftige Farbe)
    const schal = ctx.mat('#b8282a', { rauheit: 0.85 });
    // über die Lehne gelegt (oben quer), ein Teil liegt auf dem Sitz, ein Ende hängt vorn bis fast aufs Eis
    k(c, 0.52, 0.06, 0.15, schal, 0.0, 0.985, -0.235, { rund: 0.025, dreh: [-0.12, 0, 0.05] });
    k(c, 0.15, 0.32, 0.05, schal, -0.13, 0.84, -0.25, { rund: 0.02, dreh: [-0.12, 0, -0.04] });
    k(c, 0.16, 0.05, 0.36, schal, -0.11, 0.505, -0.02, { rund: 0.02, dreh: [0, 0.18, 0] });
    k(c, 0.16, 0.42, 0.05, schal, -0.07, 0.29, 0.18, { rund: 0.02, dreh: [0.08, 0.12, 0.03] });
    for (let i = 0; i < 4; i++) k(c, 0.025, 0.07, 0.02, schal, -0.12 + i * 0.035, 0.05, 0.2, { schatten: false });
    k(c, 0.2, 0.025, 0.3, schnee, 0.12, 0.5, 0.03, { rund: 0.012, schatten: false });
    anker.stuhl = [cx, 0, cz];
    anker.schal = [cx, 0.9, cz - 0.2];
  }

  // ---------- Kiefernufer rundum, Lücke vor der Stadt ----------
  for (let reihe = 0; reihe < 3; reihe++) {
    const n = 70 - reihe * 6;
    for (let i = 0; i < n; i++) {
      const w = (i / n) * Math.PI * 2 + reihe * 0.03 + (z() - 0.5) * 0.04;
      const [x, zz] = uferPunkt(w, 5 + reihe * 6 + z() * 3);
      if (zz < 0 && Math.abs(x) < 34) continue;   // vor der Stadt frei (Blick auf Kindly)
      schneeKiefer(ctx, statisch, x, zz, z, { y: SEE.uferHoehe, groesse: 1.25 + reihe * 0.12 });
    }
  }
  // dunkle Kiefern hinter dem Uferplatz: Grund, vor dem sich der Atemdampf abhebt (S3–4)
  for (let i = 0; i < 9; i++) schneeKiefer(ctx, statisch, -30 + i * 7.5 + (z() - 0.5) * 2, NORD_Z - 16 - z() * 3, z, { y: SEE.uferHoehe, groesse: 1.1, schnee: 0.6 });

  // ---------- Kindly am Nordufer: Häuser mit Fensterlicht, Kirchturm, Lampen (S29, S64) ----------
  const stadtMats = [];
  if (params.stadt !== false) {
    // Fenster ohne Nebel: Die Lichter bleiben auf 80 m als warme Punkte sichtbar
    const fensterStadt = ctx.leuchtMat('#ffc06a', 2.6);
    fensterStadt.fog = false;
    stadtMats.push(fensterStadt);
    const farben = ['#7f8c99', '#8a7f72', '#6f7d72', '#8a7480', '#9a8f7a'];
    const dach = tmat(ctx, '#3d4048', 'schindeln', { rauheit: 0.9 });
    for (let i = 0; i < 16; i++) {
      const x = -38 + i * 5.2 + (z() - 0.5) * 1.5, zz = NORD_Z - 22 - (i % 3) * 7 - z() * 3;
      const b = 4 + z() * 1.6, h = 3.2 + z() * 2.6, tt = 5;
      const hg = new T.Group(); hg.position.set(x, SEE.uferHoehe, zz); statisch.add(hg);
      k(hg, b, h, tt, tmat(ctx, farben[i % farben.length], 'verkleidung'), 0, h / 2, 0);
      giebel(hg, b, b * 0.42, tmat(ctx, farben[i % farben.length], 'verkleidung'), 0, h, tt / 2, 0);
      for (const s of [1, -1]) k(hg, b / 2 / Math.cos(0.7) + 0.3, 0.14, tt + 0.4, dach, s * b / 4, h + b * 0.21, 0, { dreh: [0, 0, -s * 0.7] });
      for (const s of [1, -1]) k(hg, b / 2 / Math.cos(0.7) + 0.2, 0.08, tt + 0.3, schneeHell, s * b / 4, h + b * 0.21 + 0.1, 0, { dreh: [0, 0, -s * 0.7] });
      for (let f = 0; f < 3; f++) if (z() < 0.65) {
        const m = k(hg, 0.7, 0.8, 0.05, fensterStadt, -b / 3 + f * (b / 3), h * (z() < 0.5 ? 0.35 : 0.68), tt / 2 + 0.03, { schatten: false });
        m.userData.einzeln = true;
      }
    }
    // Kirchturm (wie der Glockenturm der Main Street, nur als Umriss) mit erleuchteter Schallluke
    const tg = new T.Group(); tg.position.set(-9, SEE.uferHoehe, NORD_Z - 40); statisch.add(tg);
    const turm = tmat(ctx, '#d8d4ca', 'verkleidung');
    k(tg, 3.2, 13, 3.2, turm, 0, 6.5, 0);
    const spitze = new T.Mesh(new T.ConeGeometry(2.4, 6, 4), ctx.mat('#3b3f48', { flach: true })); spitze.position.set(0, 16, 0); spitze.rotation.y = Math.PI / 4; tg.add(spitze);
    const luke = k(tg, 1.2, 1.6, 0.05, fensterStadt, 0, 11, 1.63, { schatten: false }); luke.userData.einzeln = true;
    // Uferstraße mit Lampen (Punkte über dem Uferplatz)
    for (let i = 0; i < 7; i++) {
      const x = -27 + i * 9;
      zyl(statisch, 0.06, 0.08, 3.6, eisen, x, SEE.uferHoehe + 1.8, NORD_Z - 13.5, { segmente: 6 });
      const m = k(gruppe, 0.26, 0.18, 0.26, fensterStadt, x, SEE.uferHoehe + 3.55, NORD_Z - 13.5, { schatten: false });
      m.userData.einzeln = true;
    }
  }
  lichter.stadt = { lichter: [], materialien: stadtMats };

  // ---------- Dunst über dem Eis (Morgengrauen; die Karten liegen weit weg, nie vor der Linse) ----------
  if (params.dunst !== false) {
    for (let i = 0; i < 4; i++) nebelKarte(ctx, gruppe, (i - 1.5) * 30, 2.0, 46 + (i % 2) * 6, 34, 5, Math.PI, 0.12);
    for (const x of [-58, 52]) nebelKarte(ctx, gruppe, x, 2.4, NORD_Z - 4, 30, 5, 0, 0.16);
  }

  verschmelze(statisch);

  // ---------- Anker ----------
  Object.assign(anker, {
    see_mitte: [0, 0, 0],
    wesen: SEE.wesen,                       // Mitte des Wesens unter dem Eis (liegt längs z, Kopf nach −z)
    wesen_kopf: SEE.kopf,
    stelle: [SEE.kopf[0], 0, SEE.kopf[2]],  // auf dem Eis über dem Kopf: hier steht Bear (S30–35), hier wird es klar
    // Odell steht etwas zur Laternenseite (+x), wer vom Eis kommt, etwas links davon: So sieht die Kamera
    // "steg_seite" links an Odells Kopf vorbei auf das Gesicht des Hauchenden (Prüfbild: sonst verdeckt)
    steg_ende: [S.x + 0.35, S.deck, STEG_ENDE - 1.0],   // Odell (blick 0: schaut aufs Eis, zu dem, der heraufkommt)
    steg_kante: [S.x - 0.2, S.deck, STEG_ENDE - 0.15],  // wer vom Eis kommt und haucht (blick 180: schaut zu Odell)
    steg_stufen: [S.x, 0, STEG_ENDE + 1.55],            // Fuß der Stufen auf dem Eis
    steg_mitte: [S.x, S.deck, (STEG_LAND + STEG_ENDE) / 2],
    ufer: [-6, SEE.uferHoehe, NORD_Z - 3.2],            // Uferplatz (S3–4: drei Männer, blick 0 = zum See)
    weg_start: [3.2, 0, NORD_Z + 4],                     // vom Ufer aufs Eis (S21, S41)
    stadt: [0, 4, NORD_Z - 30],
  });

  // ---------- Kamerapunkte (lokal) ----------
  // Untersichten liegen unter dem Eis (y < 0) und brauchen licht "see-unter". Kopf oben: Kameras schauen
  // nach Norden (−z), Figuren und das Wesen liegen mit dem Kopf nach −z.
  const [kx, , kz] = SEE.kopf;
  const kamerapunkte = {
    totale: { pos: [-24, 8, NORD_Z - 2], ziel: [3, 0, -28], fov: 50 },
    see_weit: { pos: [5, 1.7, 2], ziel: [2, 1.4, -40], fov: 46 },                        // S29: zwei Figuren, hinten Kindly
    draufsicht: { pos: [kx + 2.5, 19, kz + 18], ziel: [kx + 2.5, 0, kz + 5.5], fov: 50 }, // S2: Körper, daneben die Hütte
    gesicht_oben: { pos: [kx, 1.55, kz + 1.95], ziel: [kx, -0.35, kz - 0.05], fov: 40 },  // S13–15, S34–35 durchs klare Eis
    eis_detail: { pos: [kx + 1.0, 0.55, kz + 1.25], ziel: [kx, 0.04, kz], fov: 40 },       // Stiefel/Pickel tippt (S1, S24, S30)
    unter_eis: { pos: [kx - 3.2, -2.7, kz + 9.5], ziel: [kx, -0.25, kz + 2], fov: 58 },    // S1, S31: von unten auf Körper und Fäuste
    unter_seite: { pos: [kx - 4.2, -1.5, SEE.wesen[2]], ziel: [kx, -0.55, SEE.wesen[2] - 0.5], fov: 54 },   // S10–11 Seitenfahrt (truck_side längs z)
    unter_gegenschuss: { pos: [kx, -2.0, kz + 1.5], ziel: [kx, 1.2, kz - 3.5], fov: 60 },  // S16: der Mann oben geht weg (steht bei stelle − 3 m)
    steg_totale: { pos: [-7.5, 2.4, STEG_ENDE + 11], ziel: [0, 1.6, STEG_ENDE - 3], fov: 46 },
    steg_ende: { pos: [S.x - 1.3, S.deck + 1.6, STEG_ENDE - 5.2], ziel: [S.x - 0.1, S.deck + 1.3, STEG_ENDE - 1.0], fov: 38 },   // Odell am Stegende, Laterne, dahinter das Eis
    steg_seite: { pos: [S.x - 1.0, S.deck + 1.75, STEG_ENDE - 2.4], ziel: [S.x - 0.2, S.deck + 1.18, STEG_ENDE - 0.4], fov: 36 },   // Ziel unter dem Gesicht: Mund über dem Untertitel-Streifen   // Odell außerhalb, sein Arm mit der Brille ragt ins Bild    // S37: über Odells rechte Schulter auf Bear (von vorn); Kamera neben dem Steg, über den Pfosten
    ufer: { pos: [-6, SEE.uferHoehe + 1.45, NORD_Z + 1.1], ziel: [-6, SEE.uferHoehe + 1.45, NORD_Z - 3.2], fov: 44 },  // S3–4
    weg_totale: { pos: [3.0, 2.8, NORD_Z + 6.5], ziel: [SEE.bg.x - 1, 0.8, SEE.bg.z - 2], fov: 42 },   // S21 und S41 (gleiche Kamera)
    huette_tuer: { pos: [SEE.bg.x - 0.6, 1.6, SEE.bg.z - SEE.bg.t / 2 - 3.3], ziel: [SEE.bg.x, 1.25, SEE.bg.z - SEE.bg.t / 2], fov: 42 },
    huetten: { pos: [-1.5, 2.1, -43], ziel: [5, 0.8, -27], fov: 48 },                   // S30: erstes Eis, Hütten, Laternen
    stuhl: { pos: [SEE.stuhl[0] + 2.3, 0.95, SEE.stuhl[2] - 2.6], ziel: [SEE.stuhl[0], 0.6, SEE.stuhl[2]], fov: 40 },   // S23: gegen die tiefe Sonne (Südwest)
    heimweg: { pos: [6, 1.8, -12], ziel: [1, 1.2, NORD_Z + 2], fov: 44 },               // S64: zwei Figuren gehen zur Stadt
  };

  const ereignisse = params.ereignisse ?? [];
  const std = { mitte: [kx, kz], radius: 1.3 };
  return {
    gruppe, anker, lichter, kamerapunkte,
    aktualisiere(t) {
      eisMat.eis.setze({ klar: klarStellen(ereignisse, t, std), risse: rissStellen(ereignisse, t, { mitte: [kx, kz] }) });
    },
  };
}
