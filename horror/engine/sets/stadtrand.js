// Set "stadtrand": das Ende der Landstraße am Stadtrand von Kindly, Standort des Ortsschilds
// (Rules of Kindly: F1 S9 „Ortsschild neben DEAD END“, Endkarte jeder Folge; Bibel §2, §3.2, §6).
// Weit weg von den anderen Sets stellen (z. B. "position": [-600, 0, 0]) und allein zeigen: "set": ["rand"].
//
// Lage (lokal, 1 m, y oben): Die verschneite Landstraße kommt aus der Stadt (−z) und endet bei z = 0 an
// einer Schranke; dahinter Kiefernwald. Rechts am Straßenende das gelbe DEAD-END-Schild (Schnee auf der
// Oberkante), daneben der Platz für das Ortsschild (Requisite "ortsschild" der Figuren-Werkstatt, Anker
// "ortsschild", blick 180: die Schrift zeigt zur Straße nach −z). Eine alte Straßenlaterne leuchtet das
// Schild von vorn an (Endkarte bei Nacht: Zahl lesbar). Schneefall kommt aus der Episode (Partikel "schnee").
//
// Tag und Nacht: Laterne an/aus über die Lichtgruppe rand.laterne (bei Tag am Einstellungsbeginn
// { art: "aus", ziel: "rand.laterne", dauer: 0 }). Achtung: Die Endkarte des Compilers schaltet seine
// Lampenliste aus; "rand.*" steht absichtlich NICHT in dieser Liste, die Laterne bleibt also an.
// params: platzhalter_schild (Std false): ein schlichtes Stellvertreter-Schild für Prüfbilder, solange die
//   Requisite fehlt; punktlicht (Std true)
// Lichtgruppen: rand.laterne (Laterne mit Punktlicht und Lichtfleck)
import * as THREE from 'three';
import { k, zyl, verschmelze, tmat, lichtPfuetzeMat, lichtPfuetze } from '../src/bauteile.js';
import { schneeMat, schneeHaufen, schneeKiefer, schneeFlaeche, schneeStrasse } from '../src/winter.js';

export const RAND = {
  strasse: { breite: 6.5, von: -90, bis: 0 },
  ortsschild: [5.7, 0, -4.6],      // Fußpunkt der Requisite (Mitte zwischen den Pfosten), blick 180
  schildMitte: [5.7, 1.75, -4.6],  // ungefähre Mitte der Tafel (für Kameras)
  deadEnd: [4.1, 2.25, -2.2],
  laterne: [7.4, 0, -7.6],
};

export default async function baue(ctx, params = {}) {
  const T = THREE;
  const z = ctx.zufall('stadtrand');
  const R = RAND, S = R.strasse;
  const gruppe = new T.Group();
  const statisch = new T.Group(); gruppe.add(statisch);
  const schnee = schneeMat(ctx);
  const schneeHell = schneeMat(ctx, '#f1f5fa');

  // ---------- Boden: Schneefeld, Straße mit Reifenspuren, Schneewälle ----------
  schneeFlaeche(ctx, statisch, 260, 260, 0, 0, -40);
  // Straße: festgefahrener Schnee mit Reifenspuren (src/winter.js)
  schneeStrasse(ctx, gruppe, S.breite, S.von, S.bis, 0, 0.02);
  // Schneewälle am Rand (vom Pflug), am Ende quer ein großer Wall
  for (let zz = S.von; zz < S.bis - 1; zz += 2.2) for (const sx of [-1, 1]) {
    schneeHaufen(ctx, statisch, sx * (S.breite / 2 + 0.6 + z() * 0.3), 0, zz + z(), 1.0 + z() * 0.4, 0.45 + z() * 0.2, 1.5, z);
  }
  for (let i = 0; i < 6; i++) schneeHaufen(ctx, statisch, -4 + i * 1.6, 0, 1.6 + z() * 0.4, 1.2, 0.8 + z() * 0.3, 1.0, z);

  // ---------- Schranke: rot-weiße Bretter mit Schnee obendrauf ----------
  const weiss = ctx.mat('#ECE8DE', { rauheit: 0.6 }), rot = ctx.mat('#b8392f', { rauheit: 0.6 });
  for (const sx of [-2.4, 2.4]) { k(statisch, 0.16, 1.15, 0.16, weiss, sx, 0.575, 0.2); schneeHaufen(ctx, statisch, sx, 1.15, 0.2, 0.12, 0.06, 0.12, z, schneeHell); }
  k(statisch, 5.2, 0.32, 0.08, weiss, 0, 0.9, 0.12);
  for (let i = 0; i < 10; i++) if (i % 2 === 0) k(statisch, 0.52, 0.3, 0.02, rot, -2.34 + i * 0.52 + 0.26, 0.9, 0.07, { schatten: false });
  k(statisch, 5.1, 0.06, 0.12, schneeHell, 0, 1.08, 0.12, { rund: 0.03 });

  // ---------- DEAD-END-Schild: gelbe Raute, Schnee auf den oberen Kanten ----------
  const schildTex = ctx.zeichenTextur((g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#e8b830'; g.beginPath(); g.moveTo(w / 2, 4); g.lineTo(w - 4, h / 2); g.lineTo(w / 2, h - 4); g.lineTo(4, h / 2); g.closePath(); g.fill();
    g.strokeStyle = '#141414'; g.lineWidth = 10; g.beginPath(); g.moveTo(w / 2, 22); g.lineTo(w - 22, h / 2); g.lineTo(w / 2, h - 22); g.lineTo(22, h / 2); g.closePath(); g.stroke();
    g.fillStyle = '#141414'; g.textAlign = 'center'; g.font = 'bold 54px sans-serif';
    g.fillText('DEAD', w / 2, h / 2 - 6); g.fillText('END', w / 2, h / 2 + 50);
    // Schnee: weiße Kappe auf den beiden oberen Kanten, an der Spitze dicker
    g.fillStyle = '#f2f6fb';
    g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w - 2, h / 2 - 2); g.lineTo(w - 26, h / 2 - 8); g.lineTo(w / 2 + 6, 30); g.lineTo(w / 2, 36); g.lineTo(w / 2 - 8, 26); g.lineTo(30, h / 2 - 12); g.lineTo(2, h / 2 - 2); g.closePath(); g.fill();
  }, 256, 256);
  const [dx, dy, dz] = R.deadEnd;
  const raute = new T.Mesh(new T.PlaneGeometry(1.0, 1.0), new T.MeshStandardMaterial({ map: schildTex, transparent: true, alphaTest: 0.5, roughness: 0.5 }));
  raute.position.set(dx, dy, dz); raute.rotation.y = Math.PI - 0.12; raute.castShadow = true; raute.userData.einzeln = true;
  gruppe.add(raute);
  zyl(statisch, 0.04, 0.04, dy, ctx.mat('#8a8e94', { metall: 0.6, rauheit: 0.4 }), dx, dy / 2, dz + 0.03, { segmente: 8 });
  schneeHaufen(ctx, statisch, dx, dy + 0.5, dz, 0.11, 0.05, 0.05, z, schneeHell);
  schneeHaufen(ctx, statisch, dx, 0, dz, 0.5, 0.35, 0.5, z);

  // ---------- Platz für das Ortsschild: Schneehügel um die Pfosten ----------
  const [ox, , oz] = R.ortsschild;
  for (const sx of [-1.1, 0, 1.1]) schneeHaufen(ctx, statisch, ox + sx, 0, oz + (z() - 0.5) * 0.3, 0.7, 0.3 + z() * 0.12, 0.55, z);
  if (params.platzhalter_schild) {
    // Stellvertreter (nur für Prüfbilder): emaillegrüne Tafel mit cremefarbener Schrift (Bibel §6)
    const tex = ctx.zeichenTextur((g, w, h) => {
      g.fillStyle = '#2F4A3A'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#EDE6D3'; g.lineWidth = 10; g.strokeRect(18, 18, w - 36, h - 36);
      g.fillStyle = '#EDE6D3'; g.textAlign = 'center';
      g.font = 'bold 92px serif'; g.fillText('WELCOME TO KINDLY', w / 2, h * 0.3);
      g.font = 'italic 58px serif'; g.fillText('Kindly mind the rules', w / 2, h * 0.5);
      g.font = 'bold 110px serif'; g.fillText('POP. 1,204', w / 2, h * 0.82);
    }, 1024, 640);
    const tafel = new T.Mesh(new T.PlaneGeometry(2.4, 1.5), new T.MeshStandardMaterial({ map: tex, roughness: 0.55 }));
    tafel.position.set(ox, 1.75, oz); tafel.rotation.y = Math.PI; tafel.userData.einzeln = true;
    gruppe.add(tafel);
    k(statisch, 2.5, 1.6, 0.06, ctx.mat('#2a3a30'), ox, 1.75, oz + 0.04);
    for (const sx of [-0.95, 0.95]) k(statisch, 0.1, 2.6, 0.1, ctx.mat('#5a4636'), ox + sx, 1.3, oz + 0.1);
    k(statisch, 2.5, 0.08, 0.14, schneeHell, ox, 2.54, oz + 0.04, { rund: 0.03 });
  }

  // ---------- Laterne: leuchtet das Schild von vorn an (Endkarte bei Nacht) ----------
  const [lx, , lz] = R.laterne;
  const eisen = ctx.mat('#26282d', { rauheit: 0.55, metall: 0.4 });
  zyl(statisch, 0.07, 0.1, 4.6, eisen, lx, 2.3, lz, { segmente: 8 });
  k(statisch, 1.3, 0.07, 0.07, eisen, lx - 0.6, 4.55, lz, { dreh: [0, -0.35, 0] });
  const kopfX = lx - 1.15, kopfZ = lz + 0.42;
  k(statisch, 0.46, 0.14, 0.46, eisen, kopfX, 4.5, kopfZ, { rund: 0.04 });
  schneeHaufen(ctx, statisch, kopfX, 4.57, kopfZ, 0.24, 0.08, 0.24, z, schneeHell);
  const glas = ctx.leuchtMat('#ffd9a0', 3.2);
  const kopf = k(gruppe, 0.32, 0.12, 0.32, glas, kopfX, 4.38, kopfZ, { schatten: false });
  kopf.userData.einzeln = true;
  const pfuetze = lichtPfuetzeMat(ctx, '#ffb874', 0.45, { ohneGlanz: true });
  lichtPfuetze(ctx, gruppe, kopfX, kopfZ + 0.8, pfuetze, 3.6, 0.05);
  const lichter = [];
  if (params.punktlicht !== false) {
    const pl = new T.PointLight('#ffcf98', 16, 14, 2);
    pl.position.set(kopfX, 4.25, kopfZ);
    gruppe.add(pl); lichter.push(pl);
  }

  // ---------- Kiefernwald hinter der Schranke und an beiden Seiten ----------
  for (let r = 0; r < 6; r++) for (let i = 0; i < 18; i++) {
    const x = -34 + i * 4 + (z() - 0.5) * 2.5 + (r % 2) * 2;
    schneeKiefer(ctx, statisch, x, 4.5 + r * 4.5 + (z() - 0.5) * 2, z, { groesse: 1.15 + r * 0.06 });
  }
  for (const sx of [-1, 1]) for (let i = 0; i < 16; i++) {
    const zz = -6 - i * 5.5 + (z() - 0.5) * 2;
    if (sx > 0 && zz > -12) continue;   // rechts vorn frei: Schilder und Laterne stehen vor dunklem Wald weiter hinten
    schneeKiefer(ctx, statisch, sx * (9 + z() * 5), zz, z, { groesse: 1.1 });
    if (z() < 0.6) schneeKiefer(ctx, statisch, sx * (16 + z() * 6), zz + 2, z, { groesse: 1.25 });
  }
  // dunkle Kiefern direkt hinter den Schildern: Grund, vor dem sich die helle Tafel abhebt
  for (const [x, zz] of [[8.5, -1.5], [10.5, -3.8], [7.2, 1.8], [11.5, 0.8]]) schneeKiefer(ctx, statisch, x, zz, z, { groesse: 1.2, schnee: 0.7 });

  verschmelze(statisch);

  return {
    gruppe,
    lichter: { laterne: { lichter, materialien: [glas, pfuetze] } },
    anker: {
      ortsschild: R.ortsschild,          // Fußpunkt der Requisite "ortsschild" (blick 180)
      ortsschild_mitte: R.schildMitte,
      dead_end: R.deadEnd,
      schranke: [0, 0.9, 0.12],
      strasse_ende: [0, 0, -1.2],
      laterne: [kopfX, 4.38, kopfZ],
    },
    kamerapunkte: {
      totale: { pos: [-1.6, 1.8, -24], ziel: [3.2, 1.5, -3], fov: 46 },
      strasse: { pos: [0.4, 1.6, -34], ziel: [1.5, 1.4, 0], fov: 42 },
      schild: { pos: [4.75, 1.8, -13.2], ziel: [R.schildMitte[0], R.schildMitte[1], R.schildMitte[2]], fov: 40 },   // Tafel etwa 70 % der Bildbreite
      zahl: { pos: [5.45, 1.45, -8.6], ziel: [R.schildMitte[0], R.schildMitte[1] - 0.4, R.schildMitte[2]], fov: 34 },  // Push-in auf die Einwohnerzahl
      endkarte: { pos: [4.85, 1.85, -14.2], ziel: [R.schildMitte[0] - 0.25, R.schildMitte[1] + 0.05, R.schildMitte[2]], fov: 40 },  // Schild und DEAD END, Nacht, Schneefall
      dead_end: { pos: [2.6, 1.9, -9.0], ziel: [R.deadEnd[0], R.deadEnd[1] - 0.2, R.deadEnd[2]], fov: 36 },
    },
  };
}
