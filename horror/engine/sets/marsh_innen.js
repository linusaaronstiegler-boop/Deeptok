// Set "marsh_innen": das Haus der Familie Marsh innen (serie.md, Ort 2). Teil 1–4.
// Räume (Haus-System wie src/bauteile.js MARSH; Front zur Straße bei z = 0):
//   kueche      Erdgeschoss vorn links: Tisch mit 3 Stühlen (Dads Stuhl bleibt leer), Herd, Zeile,
//               Kühlschrank, Fenster zur Straße. Optional Kuchen mit Zahlenkerzen 1 und 8.
//   flur        Erdgeschoss vorn rechts: Haustür, Schuhhaufen kreuz und quer, Garderobe, Treppe nach oben
//   eli         Obergeschoss vorn links: Bett, Rucksack, Schreibtisch, Fenster zum Vorgarten mit Vorhang
//   june        Erdgeschoss hinten links: Bett, Nachttisch mit Lampe, Teppich über der Bodenluke mit Eisenring
// Laden wie die anderen Sets mit position [0,0,0], drehung 0. Für Innenaufnahmen "set": ["strasse", "haus"]
// (Straße durch die Fenster sichtbar), das Außenset "marsh" ausblenden.
// Kamerapunkte je Raum: <raum>_totale, _halbtotale, _nah, _detail, _untersicht; dazu eli_fenster_schulter.
//
// params:
//   kuchen (Std false), taschenlampe (Std true: liegt auf Elis Bett), luke ('teppich' | 'zu' | 'offen' | 'figur';
//   Std 'teppich'; 'figur' = Deckel weglassen, Requisite "luke" an Anker "luke_angel" mit blick 90),
//   tueren_als_figur (Liste, z. B. ["haustuer"]: Türblatt weglassen)
// Lichtgruppen: haus.kueche_lampe (Punktlicht), haus.june_lampe (Punktlicht), haus.eli_lampe, haus.flur_lampe, haus.kerzen
import * as THREE from 'three';
import { k, flaeche, zyl, verschmelze, tmat, wand, innenFenster, MARSH, marshWelt, textur } from '../src/bauteile.js';
import { baueSchuh } from '../src/klotzfigur.js';
import baueLuke from '../figuren/luke.js';

export default async function baue(ctx, params = {}) {
  const T = THREE;
  const z = ctx.zufall('marsh_innen');
  const gruppe = new T.Group();
  const haus = new T.Group();
  haus.position.set(...MARSH.position);
  haus.rotation.y = (MARSH.drehung * Math.PI) / 180;
  gruppe.add(haus);
  const statisch = new T.Group(); haus.add(statisch);
  const so = MARSH.sockel, eg = MARSH.eg, de = MARSH.decke, og = MARSH.og;
  const y1 = so + eg + de; // Boden Obergeschoss
  const B = MARSH.breite / 2, Tt = MARSH.tiefe;
  const tueren = new Set(params.tueren_als_figur ?? []);

  // ---------- Materialien je Raum ----------
  const M = {
    kueche: tmat(ctx, '#E9D8A6', 'tapete', { rauheit: 0.9 }),
    flur: tmat(ctx, '#E6DCCB', 'tapete_muster', { rauheit: 0.9 }),
    eli: tmat(ctx, '#A9BFA8', 'tapete', { rauheit: 0.9 }),
    june: tmat(ctx, '#D8B4AC', 'tapete_muster', { rauheit: 0.9 }),
    bad: tmat(ctx, '#CFD8DC', 'fliesen', { rauheit: 0.6 }),
    aussen: tmat(ctx, MARSH.farbe, 'verkleidung', { rauheit: 0.85 }),
    decke: tmat(ctx, '#F2EEE6', 'putz', { rauheit: 0.95 }),
    dielen: tmat(ctx, '#9a7656', 'dielen', { rauheit: 0.8 }),
    dielenDunkel: tmat(ctx, '#7e5e42', 'dielen', { rauheit: 0.8 }),
    fliesen: tmat(ctx, '#d9d2c4', 'fliesen', { rauheit: 0.5 }),
    holz: tmat(ctx, '#8a6446', 'holz', { rauheit: 0.75 }),
    holzHell: tmat(ctx, '#b89470', 'holz', { rauheit: 0.75 }),
  };
  const weiss = ctx.mat('#F4F1EA', { rauheit: 0.55 });
  const zier = ctx.mat(MARSH.zier, { rauheit: 0.6 });
  const D = 0.2; // Wanddicke

  // ---------- Außenwände (je Etage, mit Fenster- und Türöffnungen aus MARSH) ----------
  const F = MARSH.fenster;
  const oeff = (f) => ({ b: f.b, unten: f.unten, h: f.h });
  // vorn (läuft +x, innen links)
  wand(statisch, -B, -D / 2, 0, -D / 2, so, eg + de, D, M.kueche, M.aussen, [{ pos: F.kueche.x + B, ...oeff(F.kueche) }]);
  wand(statisch, 0, -D / 2, B, -D / 2, so, eg + de, D, M.flur, M.aussen, [{ pos: MARSH.tuer.x, b: MARSH.tuer.b, unten: 0, h: MARSH.tuer.h }]);
  wand(statisch, -B, -D / 2, 0, -D / 2, y1, og, D, M.eli, M.aussen, [{ pos: F.eli.x + B, ...oeff(F.eli) }]);
  wand(statisch, 0, -D / 2, B, -D / 2, y1, og, D, M.flur, M.aussen, [{ pos: F.flur_oben.x, ...oeff(F.flur_oben) }]);
  // rechts (x = +B, läuft −z)
  wand(statisch, B - D / 2, 0, B - D / 2, -Tt, so, eg + de, D, M.flur, M.aussen, [{ pos: -F.flur.z, ...oeff(F.flur) }]);
  wand(statisch, B - D / 2, 0, B - D / 2, -Tt, y1, og, D, M.flur, M.aussen, []);
  // hinten (z = −Tt, läuft −x)
  wand(statisch, B, -Tt + D / 2, 0, -Tt + D / 2, so, eg + de, D, M.bad, M.aussen, []);
  wand(statisch, 0, -Tt + D / 2, -B, -Tt + D / 2, so, eg + de, D, M.june, M.aussen, [{ pos: -F.june.x, ...oeff(F.june) }]);
  wand(statisch, B, -Tt + D / 2, -B, -Tt + D / 2, y1, og, D, M.flur, M.aussen, [{ pos: B - F.hinten_oben.x, ...oeff(F.hinten_oben) }]);
  // links (x = −B, läuft +z)
  wand(statisch, -B + D / 2, -Tt, -B + D / 2, -4.4, so, eg + de, D, M.june, M.aussen, [{ pos: F.june_seite.z + Tt, ...oeff(F.june_seite) }]);
  wand(statisch, -B + D / 2, -4.4, -B + D / 2, 0, so, eg + de, D, M.kueche, M.aussen, [{ pos: F.kueche_seite.z + 4.4, ...oeff(F.kueche_seite) }]);
  wand(statisch, -B + D / 2, -Tt, -B + D / 2, -4.4, y1, og, D, M.flur, M.aussen, []);
  wand(statisch, -B + D / 2, -4.4, -B + D / 2, 0, y1, og, D, M.eli, M.aussen, [{ pos: F.eli_seite.z + 4.4, ...oeff(F.eli_seite) }]);

  // ---------- Innenwände ----------
  const d = 0.14;
  wand(statisch, 0, 0, 0, -4.4, so, eg, d, M.kueche, M.flur, [{ pos: 3.4, b: 1.0, unten: 0, h: 2.2 }]);
  wand(statisch, -B, -4.4, 0, -4.4, so, eg, d, M.june, M.kueche, []);
  wand(statisch, 0, -4.4, 0, -Tt, so, eg, d, M.june, M.flur, [{ pos: 1.2, b: 0.95, unten: 0, h: 2.2 }]);
  wand(statisch, 0, -6.2, B, -6.2, so, eg, d, M.bad, M.flur, [{ pos: 1.0, b: 0.9, unten: 0, h: 2.15 }]);
  wand(statisch, 0, 0, 0, -4.4, y1, og, d, M.eli, M.flur, [{ pos: 3.6, b: 0.95, unten: 0, h: 2.15 }]);
  wand(statisch, -B, -4.4, 0, -4.4, y1, og, d, M.flur, M.eli, []);
  wand(statisch, 0, -4.4, 0, -Tt, y1, og, d, M.flur, M.flur, [{ pos: 2.1, b: 0.9, unten: 0, h: 2.15 }]);

  // Fußleisten und Deckenleisten an den Außenwänden (r2-Look: helle Leisten)
  for (const [yy, hh] of [[so, 0.1], [y1, 0.1]]) {
    k(statisch, MARSH.breite - 0.4, hh, 0.03, weiss, 0, yy + hh / 2, -D - 0.015, { schatten: false });
    k(statisch, MARSH.breite - 0.4, hh, 0.03, weiss, 0, yy + hh / 2, -Tt + D + 0.015, { schatten: false });
    k(statisch, 0.03, hh, Tt - 0.4, weiss, -B + D + 0.015, yy + hh / 2, -Tt / 2, { schatten: false });
    k(statisch, 0.03, hh, Tt - 0.4, weiss, B - D - 0.015, yy + hh / 2, -Tt / 2, { schatten: false });
  }

  // ---------- Böden, Zwischendecke mit Treppenloch, Decke ----------
  const boden = (x0, x1, z0, z1, mat, y = so) => k(statisch, x1 - x0, 0.1, z0 - z1, mat, (x0 + x1) / 2, y - 0.05, (z0 + z1) / 2);
  boden(-B, 0, 0, -4.4, M.fliesen);
  boden(0, B, 0, -6.2, M.dielen);
  boden(0, B, -6.2, -Tt, M.bad);
  // Junes Zimmer: Boden mit Loch für die Luke (Mitte −2.0 / −6.8, 0.9 × 0.9)
  const lx0 = -2.45, lx1 = -1.55, lz0 = -6.35, lz1 = -7.25;
  boden(-B, lx0, -4.4, -Tt, M.dielenDunkel);
  boden(lx1, 0, -4.4, -Tt, M.dielenDunkel);
  boden(lx0, lx1, -4.4, lz0, M.dielenDunkel);
  boden(lx0, lx1, lz1, -Tt, M.dielenDunkel);
  // Schacht unter der Luke (dunkel, Erdboden unten)
  const schacht = ctx.mat('#1c1612', { rauheit: 1 });
  for (const [b, t, x, zz] of [[0.9, 0.04, -2.0, lz0 + 0.02], [0.9, 0.04, -2.0, lz1 - 0.02], [0.04, 0.9, lx0 - 0.02, -6.8], [0.04, 0.9, lx1 + 0.02, -6.8]]) k(statisch, b, 1.0, t, schacht, x, so - 0.5, zz, { schatten: false });
  k(statisch, 0.9, 0.04, 0.9, tmat(ctx, '#3a2c20', 'erde'), -2.0, so - 1.0, -6.8, { schatten: false });
  // Zwischendecke: unten Putz, oben Dielen, Loch über der Treppe (x 3.6…B, z −0.5…−4.6)
  const zwischen = (x0, x1, z0, z1) => {
    k(statisch, x1 - x0, 0.1, z0 - z1, M.decke, (x0 + x1) / 2, so + eg + 0.05, (z0 + z1) / 2);
    k(statisch, x1 - x0, 0.1, z0 - z1, M.dielen, (x0 + x1) / 2, so + eg + 0.15, (z0 + z1) / 2);
  };
  zwischen(-B, 3.6, 0, -Tt);
  zwischen(3.6, B, 0, -0.5);
  zwischen(3.6, B, -4.6, -Tt);
  k(statisch, MARSH.breite, 0.1, Tt, M.decke, 0, y1 + og + 0.05, -Tt / 2);

  // ---------- Treppe (rechts im Flur, steigt nach hinten) ----------
  for (let i = 0; i < 16; i++) {
    const hS = 0.2 * (i + 1);
    k(statisch, 1.05, hS, 0.24, M.holz, 4.32, so + hS / 2, -0.6 - 0.24 * i - 0.12);
    k(statisch, 1.07, 0.03, 0.26, M.holzHell, 4.32, so + hS + 0.015, -0.6 - 0.24 * i - 0.12, { schatten: false });
  }
  // Geländer: Pfosten unten und oben, Stäbe, schräger Handlauf
  const steig = Math.atan2(3.2, 3.84);
  k(statisch, 0.1, 1.1, 0.1, weiss, 3.75, so + 0.55, -0.62);
  k(statisch, 0.1, 1.0, 0.1, weiss, 3.75, y1 + 0.5, -4.5);
  k(statisch, 0.07, 0.07, 3.84 / Math.cos(steig) + 0.1, M.holz, 3.75, so + 1.0 + 1.6, -0.6 - 1.92, { dreh: [steig, 0, 0] });
  for (let i = 0; i < 16; i++) k(statisch, 0.035, 0.9, 0.035, weiss, 3.75, so + 0.2 * (i + 1) + 0.45, -0.6 - 0.24 * i - 0.12, { schatten: true });
  // Brüstung oben um das Treppenloch
  k(statisch, 0.07, 0.07, 4.1, M.holz, 3.6, y1 + 0.95, -2.55);
  for (let zz = -0.6; zz > -4.6; zz -= 0.16) k(statisch, 0.035, 0.9, 0.035, weiss, 3.6, y1 + 0.47, zz);

  // ---------- Fensterrahmen innen, Heizkörper, Vorhänge ----------
  const fRahmen = (f, etage) => {
    const y = (etage ? y1 : so) + f.unten;
    if (f.seite === 'vorn') innenFenster(ctx, statisch, f.x, y, f.b, f.h, weiss, Math.PI, D).position.z = -D - 0.01;
    else if (f.seite === 'hinten') { const g = innenFenster(ctx, statisch, f.x, y, f.b, f.h, weiss, 0, D); g.position.z = -Tt + D + 0.01; }
    else if (f.seite === 'links') { const g = innenFenster(ctx, statisch, 0, y, f.b, f.h, weiss, Math.PI / 2, D); g.position.set(-B + D + 0.01, y, f.z); }
    else { const g = innenFenster(ctx, statisch, 0, y, f.b, f.h, weiss, -Math.PI / 2, D); g.position.set(B - D - 0.01, y, f.z); }
  };
  for (const f of Object.values(F)) fRahmen(f, f.etage);
  const heizung = (x, yy, zz, dreh = 0) => {
    const g = new T.Group(); g.position.set(x, yy, zz); g.rotation.y = dreh; statisch.add(g);
    for (let i = 0; i < 8; i++) k(g, 0.07, 0.55, 0.1, weiss, -0.3 + i * 0.085, 0.42, 0, { rund: 0.02 });
  };
  heizung(F.kueche.x, so, -D - 0.12);
  heizung(F.eli.x, y1, -D - 0.12);
  // Vorhänge an Elis Fenster (Satz 33–35, Teil 2 reißt Eli ihn zu)
  const stoff = tmat(ctx, '#5a6e8a', 'tapete', { rauheit: 1 });
  for (const sx of [-1, 1]) k(statisch, 0.32, F.eli.h + 0.5, 0.06, stoff, F.eli.x + sx * (F.eli.b / 2 + 0.2), y1 + F.eli.unten + F.eli.h / 2 + 0.1, -D - 0.08, { rund: 0.02 });
  k(statisch, F.eli.b + 1.0, 0.04, 0.04, ctx.mat('#2a2a2a'), F.eli.x, y1 + F.eli.unten + F.eli.h + 0.38, -D - 0.08);
  for (const sx of [-1, 1]) k(statisch, 0.26, F.kueche.h * 0.5, 0.05, tmat(ctx, '#c0583e', 'tapete'), F.kueche.x + sx * (F.kueche.b / 2 - 0.05), so + F.kueche.unten + F.kueche.h * 0.75, -D - 0.06);
  k(statisch, F.kueche.b + 0.2, 0.25, 0.05, tmat(ctx, '#c0583e', 'tapete'), F.kueche.x, so + F.kueche.unten + F.kueche.h - 0.1, -D - 0.06);

  // ---------- Küche ----------
  const tischX = -2.6, tischZ = -2.5, tischH = 0.66;
  k(statisch, 1.7, 0.06, 1.0, M.holzHell, tischX, so + tischH, tischZ, { rund: 0.015 });
  for (const sx of [-0.75, 0.75]) for (const sz of [-0.4, 0.4]) k(statisch, 0.07, tischH - 0.03, 0.07, M.holz, tischX + sx, so + (tischH - 0.03) / 2, tischZ + sz);
  const stuhl = (x, zz, dreh) => {
    const g = new T.Group(); g.position.set(x, so, zz); g.rotation.y = dreh; statisch.add(g);
    k(g, 0.48, 0.05, 0.46, M.holz, 0, 0.38, 0, { rund: 0.01 });
    for (const sx of [-0.2, 0.2]) for (const sz of [-0.19, 0.19]) k(g, 0.045, 0.38, 0.045, M.holz, sx, 0.19, sz);
    for (const sx of [-0.2, 0.2]) k(g, 0.045, 0.6, 0.045, M.holz, sx, 0.68, -0.21);
    for (let i = 0; i < 3; i++) k(g, 0.42, 0.06, 0.03, M.holz, 0, 0.62 + i * 0.13, -0.21);
  };
  stuhl(tischX, tischZ + 0.85, Math.PI);      // Eli (Rücken zur Straße)
  stuhl(tischX - 1.15, tischZ, Math.PI / 2);  // June
  stuhl(tischX + 1.15, tischZ, -Math.PI / 2); // Dads Stuhl, bleibt leer
  // Gedeckter Tisch: Teller, Becher, Saftkrug, Obstschale
  const porzellan = ctx.mat('#f4f1ea', { rauheit: 0.35 });
  for (const [px, pz] of [[0, 0.3], [-0.55, 0], [0.55, 0]]) {
    zyl(statisch, 0.13, 0.11, 0.02, porzellan, tischX + px, so + tischH + 0.04, tischZ + pz, { segmente: 16, schatten: false });
    zyl(statisch, 0.045, 0.04, 0.1, ctx.mat(['#2f6b45', '#d9a437', '#2f3e5c'][Math.abs(Math.round(px * 2)) % 3], { rauheit: 0.4 }), tischX + px + 0.18, so + tischH + 0.08, tischZ + pz - 0.1, { segmente: 10 });
  }
  zyl(statisch, 0.07, 0.07, 0.24, ctx.mat('#f0a030', { rauheit: 0.3 }), tischX - 0.2, so + tischH + 0.15, tischZ - 0.3, { segmente: 10 });
  zyl(statisch, 0.16, 0.11, 0.08, porzellan, tischX + 0.3, so + tischH + 0.07, tischZ - 0.3, { segmente: 14 });
  for (let i = 0; i < 4; i++) { const o = new T.Mesh(new T.IcosahedronGeometry(0.045, 1), ctx.mat(['#c0392b', '#e8a030', '#7aa040', '#c0392b'][i], { rauheit: 0.5 })); o.position.set(tischX + 0.27 + (i % 2) * 0.07, so + tischH + 0.13 + Math.floor(i / 2) * 0.04, tischZ - 0.3 + (i % 2 ? 0.04 : -0.03)); o.castShadow = true; statisch.add(o); }
  // Herd mit Topf, Küchenzeile mit Spüle, Hängeschränke, Kühlschrank, Wanduhr
  k(statisch, 0.65, 0.92, 0.7, weiss, -B + D + 0.36, so + 0.46, -3.3, { rund: 0.02 });
  k(statisch, 0.66, 0.03, 0.71, ctx.mat('#1e1e20', { rauheit: 0.4 }), -B + D + 0.36, so + 0.935, -3.3);
  k(statisch, 0.02, 0.4, 0.5, ctx.mat('#1e1e20', { rauheit: 0.3 }), -B + D + 0.69, so + 0.45, -3.3);
  for (const [bx, bz] of [[-0.15, -0.17], [-0.15, 0.17], [0.15, -0.17], [0.15, 0.17]]) zyl(statisch, 0.09, 0.09, 0.012, ctx.mat('#2a2a2c'), -B + D + 0.36 + bx, so + 0.955, -3.3 + bz, { segmente: 12, schatten: false });
  zyl(statisch, 0.15, 0.14, 0.18, ctx.mat('#9aa0a6', { metall: 0.7, rauheit: 0.35 }), -B + D + 0.21, so + 1.04, -3.13, { segmente: 14 });
  const front = tmat(ctx, '#6f8a74', 'holz', { rauheit: 0.6 });
  k(statisch, 3.0, 0.88, 0.62, front, -3.2, so + 0.44, -4.4 + d / 2 + 0.32);
  k(statisch, 3.05, 0.05, 0.66, ctx.mat('#d8d0bc', { rauheit: 0.4 }), -3.2, so + 0.905, -4.4 + d / 2 + 0.33);
  for (let i = 0; i < 5; i++) { k(statisch, 0.5, 0.7, 0.02, front, -4.4 + i * 0.6, so + 0.44, -4.4 + d / 2 + 0.64, { schatten: false }); k(statisch, 0.12, 0.03, 0.03, ctx.mat('#c9a85a', { metall: 0.7, rauheit: 0.3 }), -4.4 + i * 0.6, so + 0.72, -4.4 + d / 2 + 0.66, { schatten: false }); }
  k(statisch, 0.55, 0.03, 0.4, ctx.mat('#9aa0a6', { metall: 0.6, rauheit: 0.3 }), -2.6, so + 0.93, -4.4 + d / 2 + 0.33, { schatten: false });
  k(statisch, 3.0, 0.7, 0.36, front, -3.2, so + 1.95, -4.4 + d / 2 + 0.18);
  for (let i = 0; i < 5; i++) k(statisch, 0.52, 0.62, 0.02, front, -4.4 + i * 0.6, so + 1.95, -4.4 + d / 2 + 0.37, { schatten: false });
  k(statisch, 0.75, 1.85, 0.68, ctx.mat('#e8e4da', { rauheit: 0.35 }), -B + D + 0.4, so + 0.925, -0.65, { rund: 0.05 });
  k(statisch, 0.03, 0.5, 0.04, ctx.mat('#9aa0a6', { metall: 0.6 }), -B + D + 0.76, so + 1.2, -0.35);
  const uhrTex = ctx.zeichenTextur((g, w, h) => { g.fillStyle = '#f4efe2'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 2, 0, 7); g.fill(); g.strokeStyle = '#222'; g.lineWidth = 6; g.stroke(); g.lineWidth = 5; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2, h * 0.2); g.moveTo(w / 2, h / 2); g.lineTo(w * 0.72, h / 2); g.stroke(); }, 64, 64);
  flaeche(statisch, 0.32, 0.32, new T.MeshStandardMaterial({ map: uhrTex, roughness: 0.6, transparent: true, alphaTest: 0.5 }), -0.08, so + 2.3, -1.5, [0, -Math.PI / 2, 0]);
  // Küchenlampe (Pendel) mit Punktlicht
  const kuecheLampe = ctx.leuchtMat('#ffe0b0', 3.5);
  zyl(statisch, 0.01, 0.01, 0.8, ctx.mat('#222'), tischX, so + eg - 0.4, tischZ, { segmente: 4 });
  const schirm = zyl(statisch, 0.12, 0.3, 0.22, ctx.mat('#3f5a3c', { rauheit: 0.6 }), tischX, so + eg - 0.9, tischZ, { segmente: 16 });
  void schirm;
  const birne = k(statisch, 0.14, 0.06, 0.14, kuecheLampe, tischX, so + eg - 1.02, tischZ, { rund: 0.03, schatten: false });
  birne.userData.einzeln = true;
  const lichtKueche = new T.PointLight('#ffcf98', 6, 9, 1.6);
  lichtKueche.position.set(tischX, so + eg - 1.15, tischZ);
  haus.add(lichtKueche);

  // Kuchen mit Zahlenkerzen 1 und 8 (Satz 1, 21); Flammen = Lichtgruppe "kerzen"
  const kerzenMat = ctx.leuchtMat('#ffd27a', 9);
  const flammen = [];
  if (params.kuchen) {
    const kx = tischX, kzz = tischZ + 0.02;
    zyl(statisch, 0.2, 0.2, 0.13, ctx.mat('#f2e6d8', { rauheit: 0.6 }), kx, so + tischH + 0.095, kzz, { segmente: 20 });
    zyl(statisch, 0.205, 0.205, 0.03, ctx.mat('#d87a8a', { rauheit: 0.6 }), kx, so + tischH + 0.12, kzz, { segmente: 20 });
    zyl(statisch, 0.24, 0.24, 0.015, porzellan, kx, so + tischH + 0.035, kzz, { segmente: 20 });
    const kerze = ctx.mat('#4fa36a', { rauheit: 0.5 });
    // "1"
    k(statisch, 0.03, 0.14, 0.03, kerze, kx - 0.07, so + tischH + 0.23, kzz, { schatten: false });
    k(statisch, 0.035, 0.02, 0.03, kerze, kx - 0.08, so + tischH + 0.29, kzz, { schatten: false, dreh: [0, 0, 0.6] });
    // "8" aus zwei Ringen
    for (const yy of [0.2, 0.27]) { const r = new T.Mesh(new T.TorusGeometry(0.03, 0.011, 6, 14), kerze); r.position.set(kx + 0.07, so + tischH + yy, kzz); statisch.add(r); }
    for (const [fx, fy] of [[kx - 0.07, 0.33], [kx + 0.07, 0.34]]) {
      // Flamme als Tropfen (gestreckte Kugel), hell genug für Bloom
      const fl = new T.Mesh(new T.SphereGeometry(0.014, 10, 8), kerzenMat);
      fl.scale.set(1, 2.2, 1);
      fl.position.set(fx, so + tischH + fy, kzz);
      fl.userData.einzeln = true;
      haus.add(fl);
      flammen.push(fl);
    }
  }

  // ---------- Flur ----------
  // Schuhhaufen an der Haustür, kreuz und quer (Satz 18: niemand stellt Schuhe nebeneinander)
  const schuhStile = [
    { farbe: '#F2F2EE', senkel: '#4FA36A', streifen: '#4FA36A' }, { farbe: '#B83A32', senkel: '#F4F2EC' }, { farbe: '#3a2e26', art: 'halbschuh' },
    { farbe: '#8E9196', senkel: '#D8D6D0' }, { farbe: '#B83A32', senkel: '#F4F2EC' }, { farbe: '#F2F2EE', senkel: '#4FA36A' }, { farbe: '#5a4a3a', art: 'stiefel' },
  ];
  schuhStile.forEach((st, i) => {
    const s = baueSchuh(ctx, { sohle: '#ebe8e1', art: 'turnschuh', ...st });
    const liegt = z() < 0.35;
    s.position.set(2.6 + (z() - 0.5) * 1.2, so + (liegt ? 0.085 : 0.12), -0.75 - z() * 0.7);
    s.rotation.set(0, z() * Math.PI * 2, liegt ? Math.PI / 2 : 0);
    statisch.add(s);
  });
  // Garderobe mit Jacken an der Flurwand (x = 0, Flurseite)
  k(statisch, 0.06, 0.08, 1.6, M.holz, 0.1, so + 1.95, -1.6);
  [['#2F6B45', -1.0], ['#D9A437', -1.5], ['#2F3E5C', -2.0]].forEach(([fb, zz]) => {
    k(statisch, 0.22, 0.85, 0.42, ctx.mat(fb, { rauheit: 0.9 }), 0.2, so + 1.45, zz, { rund: 0.06 });
    k(statisch, 0.05, 0.08, 0.05, ctx.mat('#c9a85a', { metall: 0.7 }), 0.12, so + 1.95, zz);
  });
  // Läufer, Konsole mit Lampe, Bilder an der Wand über der Treppe
  k(statisch, 1.0, 0.012, 3.6, tmat(ctx, '#7a3b36', 'tapete', { rauheit: 1 }), 1.9, so + 0.006, -2.6, { schatten: false });
  k(statisch, 0.4, 0.8, 1.0, M.holz, 0.35, so + 0.4, -5.2);
  const flurLampe = ctx.leuchtMat('#ffe0b0', 2.5);
  zyl(statisch, 0.12, 0.16, 0.25, flurLampe, 0.35, so + 1.0, -5.0, { segmente: 12 }).userData.einzeln = true;
  zyl(statisch, 0.1, 0.12, 0.08, flurLampe, 2.5, so + eg - 0.06, -2.5, { segmente: 14 }).userData.einzeln = true;
  const bild = (x, yy, zz, dreh, malen) => {
    const tex = ctx.zeichenTextur(malen, 128, 96);
    const g = new T.Group(); g.position.set(x, yy, zz); g.rotation.y = dreh; statisch.add(g);
    k(g, 0.62, 0.48, 0.04, ctx.mat('#3a2a1e'), 0, 0, 0);
    flaeche(g, 0.52, 0.38, new T.MeshStandardMaterial({ map: tex, roughness: 0.7 }), 0, 0, 0.022);
  };
  const landschaft = (himmel, berg) => (g, w, h) => { g.fillStyle = himmel; g.fillRect(0, 0, w, h); g.fillStyle = berg; g.beginPath(); g.moveTo(0, h); g.lineTo(w * 0.3, h * 0.4); g.lineTo(w * 0.55, h * 0.7); g.lineTo(w * 0.8, h * 0.35); g.lineTo(w, h); g.fill(); g.fillStyle = '#f2e6c8'; g.beginPath(); g.arc(w * 0.78, h * 0.2, 8, 0, 7); g.fill(); };
  bild(B - D - 0.03, so + 1.9, -1.6, -Math.PI / 2, landschaft('#9fb8d0', '#4f6e5a'));
  bild(B - D - 0.03, so + 2.5, -3.2, -Math.PI / 2, landschaft('#e8c0a0', '#6a5a7a'));
  bild(0.08, so + 1.7, -5.6, Math.PI / 2, landschaft('#c8d8c0', '#7a6a4a'));
  // Haustür innen (Satz: Schuhe an der Haustür)
  if (!tueren.has('haustuer')) {
    k(statisch, MARSH.tuer.b, MARSH.tuer.h, 0.06, ctx.mat(MARSH.tuerFarbe, { rauheit: 0.6 }), MARSH.tuer.x, so + MARSH.tuer.h / 2, -D / 2, { rund: 0.01 });
    k(statisch, 0.05, 0.05, 0.08, ctx.mat('#C9A85A', { metall: 0.8, rauheit: 0.35 }), MARSH.tuer.x - MARSH.tuer.b * 0.38, so + 1.0, -D / 2 - 0.06, { rund: 0.02 });
  }
  // Badtür (zu), Tür zum hinteren Zimmer oben (zu), Junes Tür (offen), Elis Tür (offen)
  const tuerBlatt = (x, yy, zz, drehY, farbe = '#ece6da') => { const g = new T.Group(); g.position.set(x, yy, zz); g.rotation.y = drehY; statisch.add(g); k(g, 0.9, 2.12, 0.05, ctx.mat(farbe, { rauheit: 0.6 }), 0.45, 1.06, 0); k(g, 0.05, 0.05, 0.06, ctx.mat('#C9A85A', { metall: 0.8 }), 0.8, 1.0, 0.05, { rund: 0.02 }); };
  tuerBlatt(0.55, so, -6.2, 0);
  tuerBlatt(-0.02, y1, -6.95, -Math.PI / 2);
  tuerBlatt(0, so, -5.6 + 0.47, Math.PI / 2 + 1.25);
  tuerBlatt(0, y1, -3.6 + 0.47, Math.PI / 2 + 1.3);

  // ---------- Elis Zimmer (oben) ----------
  // Bett an der Rückwand, Decke grün-grau, Kissen; Taschenlampe darauf (Satz 32)
  k(statisch, 2.05, 0.3, 1.05, M.holz, -3.85, y1 + 0.15, -3.75);
  k(statisch, 0.08, 0.8, 1.05, M.holz, -4.85, y1 + 0.4, -3.75);
  k(statisch, 1.95, 0.16, 1.0, ctx.mat('#ece6da', { rauheit: 0.9 }), -3.85, y1 + 0.38, -3.75, { rund: 0.04 });
  k(statisch, 1.4, 0.1, 1.04, tmat(ctx, '#4e6a5a', 'tapete_muster', { rauheit: 1 }), -3.55, y1 + 0.49, -3.75, { rund: 0.04 });
  k(statisch, 0.4, 0.14, 0.62, ctx.mat('#f4f1ea', { rauheit: 0.9 }), -4.55, y1 + 0.52, -3.75, { rund: 0.06 });
  if (params.taschenlampe !== false) {
    zyl(statisch, 0.035, 0.035, 0.26, ctx.mat('#1e1f22', { rauheit: 0.4 }), -3.4, y1 + 0.58, -3.6, { dreh: [0, 0.4, Math.PI / 2], segmente: 10 });
    zyl(statisch, 0.05, 0.04, 0.07, ctx.mat('#d9a437', { metall: 0.5, rauheit: 0.4 }), -3.27, y1 + 0.58, -3.55, { dreh: [0, 0.4, Math.PI / 2], segmente: 10 });
  }
  // Rucksack, Schreibtisch mit Lampe und Stuhl, Regal mit Büchern, Poster, Teppich
  k(statisch, 0.4, 0.5, 0.25, ctx.mat('#2f3e5c', { rauheit: 0.9 }), -2.4, y1 + 0.25, -4.05, { rund: 0.08 });
  k(statisch, 0.3, 0.2, 0.06, ctx.mat('#c0392b', { rauheit: 0.9 }), -2.4, y1 + 0.2, -3.9, { rund: 0.03 });
  k(statisch, 0.6, 0.05, 1.2, M.holzHell, -B + D + 0.32, y1 + 0.7, -1.6);
  for (const sz of [-0.55, 0.55]) k(statisch, 0.55, 0.68, 0.04, M.holzHell, -B + D + 0.32, y1 + 0.34, -1.6 + sz);
  const eliLampe = ctx.leuchtMat('#ffe8c0', 3);
  zyl(statisch, 0.02, 0.02, 0.4, ctx.mat('#2a2a2c'), -B + D + 0.2, y1 + 0.92, -1.15, { segmente: 6 });
  const el = zyl(statisch, 0.04, 0.11, 0.12, eliLampe, -B + D + 0.27, y1 + 1.1, -1.15, { segmente: 12 });
  el.userData.einzeln = true;
  for (let i = 0; i < 3; i++) k(statisch, 0.3, 0.04, 0.22, ctx.mat(['#e8e0c8', '#9fb0c4', '#c49d9a'][i]), -B + D + 0.32, y1 + 0.74 + i * 0.04, -1.9, { schatten: false });
  k(statisch, 0.5, 0.05, 0.9, M.holz, -0.25, y1 + 1.5, -1.2);
  for (let i = 0; i < 9; i++) k(statisch, 0.2, 0.22 + (i % 3) * 0.03, 0.06, ctx.mat(['#7a3b36', '#2f3e5c', '#d9a437', '#4f7a3a', '#6b4c9a'][i % 5]), -0.25, y1 + 1.64 + (i % 3) * 0.015, -1.6 + i * 0.085, { schatten: false });
  const poster = (x, yy, zz, dreh, malen) => { const tex = ctx.zeichenTextur(malen, 96, 128); flaeche(statisch, 0.6, 0.8, new T.MeshStandardMaterial({ map: tex, roughness: 0.8 }), x, yy, zz, [0, dreh, 0]); };
  poster(-0.08, y1 + 1.6, -3.0, -Math.PI / 2, (g, w, h) => { g.fillStyle = '#1f2848'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8c06a'; g.beginPath(); g.arc(w * 0.5, h * 0.4, w * 0.25, 0, 7); g.fill(); g.strokeStyle = '#e8c06a'; g.lineWidth = 3; g.beginPath(); g.ellipse(w * 0.5, h * 0.4, w * 0.42, w * 0.1, -0.3, 0, 7); g.stroke(); for (let i = 0; i < 20; i++) g.fillRect((i * 37) % w, (i * 53) % h, 2, 2); });
  poster(-B + D + 0.01, y1 + 1.7, -3.1, Math.PI / 2, (g, w, h) => { g.fillStyle = '#d8e0d0'; g.fillRect(0, 0, w, h); g.fillStyle = '#4f6e5a'; g.beginPath(); g.moveTo(0, h); g.lineTo(w * 0.4, h * 0.3); g.lineTo(w, h); g.fill(); g.fillStyle = '#2f3e3a'; g.beginPath(); g.moveTo(w * 0.3, h); g.lineTo(w * 0.7, h * 0.45); g.lineTo(w, h * 0.8); g.lineTo(w, h); g.fill(); });
  k(statisch, 1.6, 0.012, 1.2, tmat(ctx, '#c9b07a', 'tapete_muster', { rauheit: 1 }), -2.6, y1 + 0.006, -2.0, { schatten: false });
  zyl(statisch, 0.1, 0.1, 0.06, eliLampe, -2.6, y1 + og - 0.04, -2.2, { segmente: 14 }).userData.einzeln = true;

  // ---------- Junes Zimmer (unten hinten) ----------
  k(statisch, 1.25, 0.3, 2.05, M.holzHell, -4.2, so + 0.15, -7.9);
  k(statisch, 1.25, 0.9, 0.08, M.holzHell, -4.2, so + 0.45, -8.88);
  k(statisch, 1.2, 0.16, 1.95, ctx.mat('#f4f1ea', { rauheit: 0.9 }), -4.2, so + 0.38, -7.9, { rund: 0.04 });
  k(statisch, 1.24, 0.1, 1.4, tmat(ctx, '#d9a437', 'tapete_muster', { rauheit: 1 }), -4.2, so + 0.49, -7.55, { rund: 0.04 });
  k(statisch, 0.7, 0.14, 0.38, ctx.mat('#f4f1ea', { rauheit: 0.9 }), -4.2, so + 0.53, -8.6, { rund: 0.06 });
  k(statisch, 0.45, 0.5, 0.4, M.holz, -3.25, so + 0.25, -8.6);
  const juneLampe = ctx.leuchtMat('#ffd8a0', 3);
  zyl(statisch, 0.05, 0.07, 0.25, ctx.mat('#c9a85a', { metall: 0.5 }), -3.25, so + 0.62, -8.6, { segmente: 10 });
  const jl = zyl(statisch, 0.1, 0.16, 0.18, juneLampe, -3.25, so + 0.83, -8.6, { segmente: 14 });
  jl.userData.einzeln = true;
  const lichtJune = new T.PointLight('#ffc47a', 3.5, 6, 1.7);
  lichtJune.position.set(-3.25, so + 0.95, -8.35);
  haus.add(lichtJune);
  // Kleiderschrank, Pflanze, kleiner Spiegel-Tisch
  k(statisch, 1.0, 2.0, 0.6, tmat(ctx, '#e8dccb', 'holz', { rauheit: 0.6 }), -0.7, so + 1.0, -8.45);
  k(statisch, 0.02, 1.8, 0.02, ctx.mat('#8a7a6a'), -0.7, so + 1.0, -8.14, { schatten: false });
  zyl(statisch, 0.18, 0.14, 0.32, ctx.mat('#a0583a', { rauheit: 0.8 }), -4.5, so + 0.16, -5.0, { segmente: 12 });
  for (let i = 0; i < 4; i++) { const b = new T.Mesh(new T.IcosahedronGeometry(0.2, 1), ctx.mat('#4f7a3a', { flach: true, rauheit: 0.9 })); b.position.set(-4.5 + (z() - 0.5) * 0.2, so + 0.5 + i * 0.12, -5.0 + (z() - 0.5) * 0.2); b.castShadow = true; statisch.add(b); }

  // Bodenluke mit Teppich (Satz 23, 24, 30): Deckel aus dem Requisitenmodul, damit Set und Requisite gleich aussehen
  const lukeArt = params.luke ?? 'teppich';
  let lukeInst = null;
  if (lukeArt !== 'figur') {
    lukeInst = await baueLuke(ctx, { teppich: lukeArt === 'teppich' });
    lukeInst.gruppe.position.set(-2.0, so + 0.001, lz1);
    lukeInst.grundpose();
    if (lukeArt === 'offen') lukeInst.gelenke.deckel.rotation.x = -105 * Math.PI / 180;
    haus.add(lukeInst.gruppe);
  }

  verschmelze(statisch);

  const W = (x, y, zz) => marshWelt(x, y, zz);
  return {
    gruppe,
    lichter: {
      kueche_lampe: { lichter: [lichtKueche], materialien: [kuecheLampe] },
      june_lampe: { lichter: [lichtJune], materialien: [juneLampe] },
      eli_lampe: { lichter: [], materialien: [eliLampe] },
      flur_lampe: { lichter: [], materialien: [flurLampe] },
      kerzen: { lichter: [], materialien: [kerzenMat] },
    },
    anker: {
      kueche_tisch: W(tischX, so + tischH, tischZ),
      kuchen: W(tischX, so + tischH + 0.2, tischZ + 0.02),
      herd: W(-B + D + 0.36, so + 0.95, -3.3),
      stuhl_eli: W(tischX, so, tischZ + 0.85),     // Figur dorthin mit blick 90 + 180 (schaut zum Tisch)
      stuhl_june: W(tischX - 1.15, so, tischZ),
      stuhl_dad: W(tischX + 1.15, so, tischZ),
      flur_schuhe: W(2.6, so, -1.1),
      haustuer_innen: W(MARSH.tuer.x, so + 1.1, -0.3),
      treppe_unten: W(4.32, so, -0.3),
      treppe_oben: W(4.32, y1, -4.7),
      eli_bett: W(-3.6, y1 + 0.5, -3.75),
      taschenlampe: W(-3.35, y1 + 0.58, -3.58),
      eli_fenster_innen: W(F.eli.x, y1, -0.75),    // hier steht Eli am Fenster (blick 90 = schaut hinaus)
      eli_fenster: W(F.eli.x, y1 + F.eli.unten + F.eli.h / 2, -0.1),
      june_bett: W(-4.2, so + 0.5, -7.6),
      june_kissen: W(-4.2, so + 0.6, -8.55),
      nachttisch: W(-3.25, so + 0.5, -8.6),
      luke: W(-2.0, so, -6.8),
      luke_angel: W(-2.0, so, lz1),                // Requisite "luke": position hier, blick 90
      june_tuer: W(0, so + 1.1, -5.6),
      eli_tuer: W(0, y1 + 1.1, -3.6),
    },
    kamerapunkte: {
      kueche_totale: { pos: W(-0.6, so + 2.5, -0.6), ziel: W(-3.4, so + 0.8, -3.4), fov: 62 },
      kueche_halbtotale: { pos: W(-0.9, so + 1.5, -0.8), ziel: W(-2.8, so + 0.9, -2.8), fov: 50 },
      kueche_nah: { pos: W(-1.5, so + 1.35, -1.5), ziel: W(-2.6, so + 1.0, -2.6), fov: 44 },
      kueche_detail: { pos: W(-2.1, so + 1.35, -1.55), ziel: W(-2.6, so + 0.82, -2.48), fov: 36 },
      kueche_untersicht: { pos: W(-1.0, so + 0.5, -0.9), ziel: W(-2.8, so + 2.6, -3.2), fov: 58 },
      flur_totale: { pos: W(1.2, so + 2.6, -5.6), ziel: W(2.4, so + 1.0, -0.6), fov: 60 },
      flur_halbtotale: { pos: W(2.2, so + 1.5, -5.0), ziel: W(2.6, so + 1.4, -1.0), fov: 48 },
      flur_nah: { pos: W(1.4, so + 1.3, -2.6), ziel: W(2.6, so + 0.4, -1.0), fov: 44 },
      flur_detail: { pos: W(2.1, so + 0.6, -2.1), ziel: W(2.6, so + 0.1, -1.0), fov: 36 },
      flur_untersicht: { pos: W(3.0, so + 0.4, -0.4), ziel: W(4.3, y1 + 1.0, -4.4), fov: 60 },
      eli_totale: { pos: W(-0.5, y1 + 2.3, -4.0), ziel: W(-3.2, y1 + 0.8, -1.0), fov: 62 },
      eli_halbtotale: { pos: W(-0.8, y1 + 1.5, -3.6), ziel: W(-2.6, y1 + 1.3, -0.8), fov: 50 },
      eli_nah: { pos: W(-1.25, y1 + 1.6, -0.5), ziel: W(-2.6, y1 + 1.45, -0.85), fov: 42 },
      eli_detail: { pos: W(-3.0, y1 + 0.95, -3.0), ziel: W(-3.35, y1 + 0.55, -3.58), fov: 34 },
      eli_untersicht: { pos: W(-2.2, y1 + 0.4, -2.2), ziel: W(-2.6, y1 + 2.0, -0.4), fov: 58 },
      eli_fenster_schulter: { pos: W(-1.85, y1 + 1.8, -2.1), ziel: W(-2.9, y1 + 2.0, 3.5), fov: 46 },
      june_totale: { pos: W(-0.5, so + 2.4, -4.9), ziel: W(-3.2, so + 0.5, -7.6), fov: 62 },
      june_halbtotale: { pos: W(-0.9, so + 1.5, -5.2), ziel: W(-3.0, so + 0.8, -7.4), fov: 50 },
      june_nah: { pos: W(-2.6, so + 1.2, -6.2), ziel: W(-4.0, so + 0.6, -8.0), fov: 44 },
      june_detail: { pos: W(-1.6, so + 1.1, -5.9), ziel: W(-2.0, so + 0.02, -6.75), fov: 38 },
      june_untersicht: { pos: W(-1.4, so + 0.35, -5.6), ziel: W(-3.4, so + 1.8, -8.4), fov: 58 },
    },
    // Kerzenflammen flackern leicht (nur aus t gerechnet)
    aktualisiere(t) {
      flammen.forEach((f, i) => {
        const s = 1 + 0.18 * Math.sin(t * 17 + i * 2.1) + 0.1 * Math.sin(t * 29 + i);
        f.scale.set(1, 2.2 * s, 1);
      });
    },
  };
}
