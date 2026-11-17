// Set "rathaus": kleiner Raum im Rathaus von Kindly mit dem Pult, auf dem Odell das Stadtbuch aufschlägt
// (Rules of Kindly F1: S22 Stadtbuch, S25–26 Gus am Pult; F8: Archiv mit Regalen; Bibel §2, §7).
// Weit weg von den anderen Sets stellen (z. B. "position": [900, 0, 0]) und allein zeigen: "set": ["rathaus"].
//
// Lage (lokal): Raum x −4 … 4, z −3,5 … 3,5, Höhe 3,6. Hinten (−z) Regale mit Akten (das Archiv), links
// (−x) zwei hohe Fenster mit Schneelicht, in der Mitte das Pult mit ebener Platte in 1,05 m Höhe (eben,
// damit die Requisite "stadtbuch" ohne Neigung aufliegt). Wer liest, steht auf der +z-Seite und schaut
// nach −z. Darüber eine Pendellampe mit grünem Schirm: ein warmer Lichtkegel auf dem Buch.
// Licht: "innen_warm" (Lampen an) oder "tag" mit Lampen an (Schneelicht durch die Fenster).
// Lichtgruppen: rathaus.lampe (Pendellampe mit Punktlicht), rathaus.fenster (Schneelicht der Fenster)
import * as THREE from 'three';
import { k, zyl, verschmelze, tmat, wand, weicherKegel } from '../src/bauteile.js';

export const RATHAUS = { pultHoehe: 1.05, pult: [0, 0, 0], platte: [0.95, 0.66] };

export default async function baue(ctx, params = {}) {
  const T = THREE;
  const z = ctx.zufall('rathaus');
  const gruppe = new T.Group();
  const statisch = new T.Group(); gruppe.add(statisch);
  const X0 = -4, X1 = 4, Z0 = -3.5, Z1 = 3.5, H = 3.6;

  // ---------- Boden, Decke, Wände (Holzvertäfelung unten, warmer Putz oben) ----------
  const boden = tmat(ctx, '#5e4430', 'dielen', { rauheit: 0.8 });
  k(statisch, X1 - X0 + 0.4, 0.1, Z1 - Z0 + 0.4, boden, 0, -0.05, 0);
  k(statisch, X1 - X0 + 0.4, 0.1, Z1 - Z0 + 0.4, ctx.mat('#d8cfbc', { rauheit: 0.9 }), 0, H + 0.05, 0);
  for (let x = X0 + 1; x < X1; x += 2) k(statisch, 0.18, 0.22, Z1 - Z0, tmat(ctx, '#6a4e36', 'holz'), x, H - 0.11, 0);
  const putz = tmat(ctx, '#cdbf9f', 'putz', { rauheit: 0.9 });
  const holz = tmat(ctx, '#6e4f36', 'holz', { rauheit: 0.75 });
  const fenster = [{ pos: 2.0, b: 1.2, unten: 1.12, h: 1.95 }, { pos: 5.0, b: 1.2, unten: 1.12, h: 1.95 }];
  // links (x = X0, von hinten nach vorn) mit zwei Fenstern; die anderen Wände geschlossen
  wand(statisch, X0, Z0, X0, Z1, 0, H, 0.24, putz, putz, fenster);
  wand(statisch, X0, Z0, X1, Z0, 0, H, 0.24, putz, putz);
  wand(statisch, X1, Z0, X1, Z1, 0, H, 0.24, putz, putz);
  wand(statisch, X1, Z1, X0, Z1, 0, H, 0.24, putz, putz, [{ pos: 1.8, b: 1.1, unten: 0, h: 2.3 }]);   // Türöffnung bei x = 2,2
  // Vertäfelung (bis 1,1 m) und Leisten, nur wo keine Fensteröffnung ist
  const vt = (b, t, x, zz, dreh = 0) => { k(statisch, b, 1.1, t, holz, x, 0.55, zz, { dreh: [0, dreh, 0] }); k(statisch, b + 0.02, 0.06, t + 0.04, ctx.mat('#4e3626'), x, 1.12, zz, { dreh: [0, dreh, 0] }); };
  vt(X1 - X0 - 0.3, 0.04, 0, Z0 + 0.14);
  vt(0.04, Z1 - Z0 - 0.3, X1 - 0.14, 0);
  vt(0.04, Z1 - Z0 - 0.3, X0 + 0.14, 0);
  vt(1.6 - (X0 + 0.15), 0.04, (X0 + 0.15 + 1.6) / 2, Z1 - 0.14);
  // Fenster: Schneelicht (Leuchtfläche mit Sprossen), Fensterbrett
  const fensterMat = ctx.leuchtMat('#dfe8f2', 1.15);
  const scheiben = [];
  for (const f of fenster) {
    const zz = Z0 + f.pos;
    const s = k(gruppe, 0.03, f.h, f.b, fensterMat, X0 - 0.06, f.unten + f.h / 2, zz, { schatten: false });
    s.userData.einzeln = true; scheiben.push(s);
    const rahmen = ctx.mat('#ece6d8', { rauheit: 0.6 });
    k(statisch, 0.08, f.h, 0.05, rahmen, X0 - 0.03, f.unten + f.h / 2, zz);
    for (const y of [0.33, 0.66]) k(statisch, 0.08, 0.05, f.b, rahmen, X0 - 0.03, f.unten + f.h * y, zz);
    k(statisch, 0.3, 0.05, f.b + 0.2, rahmen, X0 + 0.1, f.unten - 0.02, zz);
  }
  // Tür (geschlossen) vorn rechts
  k(statisch, 1.05, 2.25, 0.05, tmat(ctx, '#5a3e2a', 'holz'), X1 - 0.6 - 1.2, 1.125, Z1 - 0.1);
  k(statisch, 0.05, 0.05, 0.1, ctx.mat('#b89a5a', { metall: 0.7, rauheit: 0.35 }), X1 - 0.6 - 1.2 - 0.38, 1.05, Z1 - 0.16);

  // ---------- Archiv: Regale mit Akten und Büchern an der Rückwand ----------
  const regalHolz = tmat(ctx, '#5a4030', 'holz', { rauheit: 0.8 });
  const ruecken = ['#6a2a26', '#2f4a3a', '#3a3a52', '#7a5a32', '#4a3a2e', '#8a7a5a'].map((f) => ctx.mat(f, { rauheit: 0.75 }));
  for (const rx of [-2.6, -0.9, 0.8, 2.5]) {
    // offenes Regal: Rückwand, Seiten, Deckel (ein voller Klotz verdeckte die Bücher)
    k(statisch, 1.6, 2.9, 0.03, regalHolz, rx, 1.45, Z0 + 0.15);
    for (const sx of [-0.78, 0.78]) k(statisch, 0.04, 2.9, 0.42, regalHolz, rx + sx, 1.45, Z0 + 0.35);
    k(statisch, 1.6, 0.05, 0.44, regalHolz, rx, 2.9, Z0 + 0.35);
    for (let b = 0; b < 5; b++) {
      const y = 0.25 + b * 0.55;
      k(statisch, 1.5, 0.04, 0.38, regalHolz, rx, y, Z0 + 0.38);
      let x = rx - 0.7;
      while (x < rx + 0.66) {
        const w = 0.05 + z() * 0.07, h = 0.3 + z() * 0.15;
        if (z() < 0.08) { x += 0.12; continue; }
        k(statisch, w, h, 0.28, ruecken[Math.floor(z() * ruecken.length)], x + w / 2, y + 0.02 + h / 2, Z0 + 0.4, { schatten: false });
        x += w + 0.008;
      }
    }
  }
  // gerahmter Aushang über der Tür: KINDLY MIND THE RULES (Odells Handschrift, Kulisse)
  const aushang = ctx.zeichenTextur((g, w, h) => {
    g.fillStyle = '#EFE6CF'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1E1C1A'; g.textAlign = 'center'; g.font = 'italic 64px serif';
    g.fillText('Kindly mind the rules.', w / 2, h * 0.6);
  }, 1024, 256);
  const tafel = new T.Mesh(new T.PlaneGeometry(1.6, 0.4), new T.MeshStandardMaterial({ map: aushang, roughness: 0.8 }));
  tafel.position.set(X1 - 1.8, 2.75, Z1 - 0.13); tafel.rotation.y = Math.PI; tafel.userData.einzeln = true;
  gruppe.add(tafel);
  k(statisch, 1.72, 0.52, 0.04, ctx.mat('#3a2a1e'), X1 - 1.8, 2.75, Z1 - 0.11);
  // Bank an der rechten Wand, Kleiderhaken
  k(statisch, 0.45, 0.06, 2.2, regalHolz, X1 - 0.4, 0.46, 0.4);
  for (const zz of [-0.55, 1.35]) k(statisch, 0.4, 0.44, 0.06, regalHolz, X1 - 0.4, 0.22, zz);
  for (let i = 0; i < 4; i++) k(statisch, 0.05, 0.05, 0.12, ctx.mat('#2a2a2a', { metall: 0.5 }), X1 - 0.18, 1.8, -0.4 + i * 0.4);

  // ---------- Pult: kräftiger Holzkörper, ebene Platte mit Leiste (Stadtbuch-Requisite liegt darauf) ----------
  const [pb, pt] = RATHAUS.platte, ph = RATHAUS.pultHoehe;
  const pultHolz = tmat(ctx, '#6a4a32', 'holz', { rauheit: 0.7 });
  k(statisch, pb, 0.05, pt, pultHolz, 0, ph - 0.025, 0, { rund: 0.01 });
  k(statisch, pb + 0.04, 0.03, 0.05, pultHolz, 0, ph + 0.01, -pt / 2 + 0.01);    // Leiste hinten (fern vom Leser)
  k(statisch, pb - 0.16, ph - 0.12, pt - 0.2, pultHolz, 0, (ph - 0.12) / 2 + 0.06, 0);
  k(statisch, pb + 0.06, 0.08, pt + 0.06, ctx.mat('#4e3626'), 0, 0.04, 0);
  for (const sx of [-1, 1]) k(statisch, 0.04, ph - 0.3, 0.02, ctx.mat('#4e3626'), sx * (pb / 2 - 0.15), ph / 2, -pt / 2 + 0.09);
  // Teppich unter dem Pult (dunkelrot), Tintenfass und Feder (Odells Nachträge)
  k(statisch, 2.6, 0.012, 1.8, ctx.mat('#5a2826', { rauheit: 0.95 }), 0, 0.006, 0.3, { schatten: false });
  zyl(statisch, 0.035, 0.04, 0.05, ctx.mat('#1e1c1a', { rauheit: 0.3 }), pb / 2 - 0.08, ph + 0.025, -pt / 2 + 0.1, { segmente: 10 });
  k(statisch, 0.008, 0.008, 0.22, ctx.mat('#e8e2d4'), pb / 2 - 0.08, ph + 0.09, -pt / 2 + 0.1, { dreh: [0.9, 0.2, 0] });

  // ---------- Pendellampe mit grünem Schirm über dem Pult (warmer Kegel auf dem Buch) ----------
  const lampeY = 2.35;
  k(statisch, 0.012, H - lampeY - 0.12, 0.012, ctx.mat('#222'), 0, (H + lampeY + 0.12) / 2, 0);
  const schirm = new T.Mesh(new T.CylinderGeometry(0.1, 0.3, 0.22, 16, 1, true), ctx.mat('#2f5a3a', { rauheit: 0.4, metall: 0.2 }));
  schirm.material.side = T.DoubleSide;
  schirm.position.set(0, lampeY, 0); schirm.castShadow = true; statisch.add(schirm);
  const birne = ctx.leuchtMat('#ffe2b0', 3.0);
  const bm = new T.Mesh(new T.SphereGeometry(0.06, 12, 8), birne); bm.position.set(0, lampeY - 0.06, 0); bm.userData.einzeln = true; gruppe.add(bm);
  // weicher Lichtkegel nach unten (additiv, blendet zum Rand und vor der Linse aus: Review Teil 3)
  const kegelMat = weicherKegel(new T.MeshLambertMaterial({ color: '#000000', emissive: new T.Color('#ffe2b0'), emissiveIntensity: 0.06, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }));
  const kegel = new T.Mesh(new T.CylinderGeometry(0.28, 0.75, lampeY - ph - 0.12, 20, 1, true), kegelMat);
  kegel.position.set(0, (lampeY + ph) / 2 - 0.06, 0); kegel.userData.einzeln = true; kegel.renderOrder = 3;
  gruppe.add(kegel);
  const lichter = [];
  if (params.punktlicht !== false) {
    const pl = new T.PointLight('#ffd6a0', 6, 8, 2);
    pl.position.set(0, lampeY - 0.12, 0);
    gruppe.add(pl); lichter.push(pl);
  }
  // kühles Schneelicht durch die Fenster (zweites Punktlicht, gehört zur Gruppe "fenster")
  const fensterLichter = [];
  if (params.punktlicht !== false) {
    const fl = new T.PointLight('#d8e4ff', 7, 10, 1.6);
    fl.position.set(X0 + 0.8, 2.2, 0);
    gruppe.add(fl); fensterLichter.push(fl);
  }

  verschmelze(statisch);

  return {
    gruppe,
    lichter: {
      lampe: { lichter, materialien: [birne, kegelMat] },
      fenster: { lichter: fensterLichter, materialien: [fensterMat] },
    },
    anker: {
      pult: [0, ph, 0],                // Mitte der Pultplatte: hier liegt das Stadtbuch (Requisite, Lesesicht von +z)
      lesen: [0, 0, 0.62],             // Stellplatz für den Leser (Gus, Odell): blick 180
      lampe: [0, lampeY, 0],
      regal: [0.8, 1.5, Z0 + 0.4],
      fenster: [X0, 1.9, Z0 + 2.0],
    },
    kamerapunkte: {
      totale: { pos: [3.1, 2.3, 3.0], ziel: [-0.4, 1.0, -0.8], fov: 56 },
      pult_detail: { pos: [0, ph + 1.15, 0.32], ziel: [0, ph, -0.02], fov: 46 },   // Draufsicht aufs Buch, Leserichtung oben = −z
      pult_nah: { pos: [0.28, ph + 0.42, 0.42], ziel: [0, ph + 0.02, -0.04], fov: 36 },   // schräg auf den Falz
      pult_halbnah: { pos: [-0.95, 1.65, -1.75], ziel: [0, 1.35, 0.55], fov: 42 },   // Leser (Anker lesen) von vorn, Pult im Vordergrund
      seite: { pos: [-2.4, 1.6, 1.4], ziel: [0, 1.2, 0.1], fov: 46 },
    },
  };
}
