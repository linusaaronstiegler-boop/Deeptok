// Platzhalter-Set zum Testen: Kleinstadtstraße aus Klötzchen (Straße entlang z, Häuser links
// und rechts, Laternen, Bäume). Wird durch echte Sets ersetzt; zeigt die Set-Schnittstelle.
// params: haeuser (je Seite, Std 7), laternen_licht (Std true)
//
// Lage: Straße x −3,5…3,5; Gehwege bis ±5,5; Häuserfronten bei x = ±7. Held-Bühne bei z ≈ 0.

export default async function baue(ctx, params = {}) {
  const T = ctx.THREE;
  const z = ctx.zufall('strasse');
  const gruppe = new T.Group();
  const statisch = new T.Group(); // wird am Ende verschmolzen
  gruppe.add(statisch);

  // Boden, Straße, Mittellinie, Gehwege
  const boden = new T.Mesh(new T.PlaneGeometry(220, 220), ctx.mat('#2c3529'));
  boden.rotation.x = -Math.PI / 2;
  boden.receiveShadow = true;
  boden.userData.einzeln = true;
  gruppe.add(boden);
  ctx.setze(ctx.kiste(7, 0.04, 140, ctx.mat('#2b2d33', { rauheit: 0.95 }), { schatten: false }), statisch, 0, 0.02, -20);
  for (let i = -16; i < 12; i++) ctx.setze(ctx.kiste(0.14, 0.05, 1.6, ctx.mat('#cfc8b4'), { schatten: false }), statisch, 0, 0.03, i * 4.2);
  for (const sx of [-1, 1]) {
    ctx.setze(ctx.kiste(2.0, 0.16, 140, ctx.mat('#77736d')), statisch, sx * 4.5, 0.08, -20);
    ctx.setze(ctx.kiste(0.16, 0.2, 140, ctx.mat('#8d8a84')), statisch, sx * 3.55, 0.1, -20);
  }

  // Häuser: Wand, Satteldach, Tür, Fenster (ein Teil davon leuchtet warm).
  const wandFarben = ['#c9b8a3', '#9fb0c4', '#c49d9a', '#a8b697', '#d5c7ac', '#b7a3c2'];
  const dachMat = ctx.mat('#3b2b29');
  const glasDunkel = ctx.mat('#1a2230', { rauheit: 0.4 });
  // Fenster-Leuchtmaterial ist eine eigene Lichtgruppe ("strasse.fenster") für Licht-Ereignisse.
  const fensterMat = ctx.leuchtMat('#ffc47a', 2.6);
  const tuerMat = ctx.mat('#4b3024');
  const n = params.haeuser ?? 7;
  let tuerAnker = null;
  for (const sx of [-1, 1]) {
    for (let i = 0; i < n; i++) {
      const breite = 7 + z() * 2;
      const hoehe = z() < 0.5 ? 3.4 : 6.2;
      const zMitte = 12 - i * 10.5 + (sx > 0 ? 0 : 4);
      const haus = new T.Group();
      haus.position.set(sx * 10.5, 0, zMitte);
      haus.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2; // Front zeigt zur Straße
      statisch.add(haus);
      const wand = ctx.mat(wandFarben[Math.floor(z() * wandFarben.length)]);
      ctx.setze(ctx.kiste(breite, hoehe, 7, wand), haus, 0, hoehe / 2, 0);
      for (const s of [-1, 1]) {
        const d = ctx.kiste(breite + 0.6, 0.18, 4.4, dachMat);
        d.rotation.x = s * 0.62;
        ctx.setze(d, haus, 0, hoehe + 1.15, s * 1.75);
      }
      ctx.setze(ctx.kiste(1.1, 2.1, 0.12, tuerMat), haus, -breite * 0.18, 1.05, 3.52);
      const etagen = hoehe > 4 ? 2 : 1;
      for (let e = 0; e < etagen; e++) {
        for (const fx of [-0.38, 0.12, 0.36]) {
          if (e === 0 && fx === -0.38) continue; // Platz für die Tür
          const an = z() < 0.45;
          ctx.setze(ctx.kiste(1.0, 1.1, 0.1, an ? fensterMat : glasDunkel, { schatten: false }), haus, fx * breite, 1.7 + e * 2.8, 3.52);
        }
      }
      if (sx > 0 && i === 1) {
        tuerAnker = new T.Object3D();
        tuerAnker.position.set(-breite * 0.18, 1.2, 3.7);
        haus.add(tuerAnker);
      }
    }
  }

  // Bäume (Low-Poly-Kegel) zwischen Gehweg und Häusern
  const stamm = ctx.mat('#4a3727'), krone = ctx.mat('#2f4a32', { flach: true });
  for (let i = 0; i < 12; i++) {
    const sx = i % 2 ? 1 : -1;
    const bz = 8 - i * 6 + z() * 2;
    ctx.setze(ctx.zylinder(0.12, 0.16, 1.4, stamm, { segmente: 6 }), statisch, sx * 6.3, 0.7, bz);
    ctx.setze(ctx.zylinder(0, 1.1, 2.6, krone, { segmente: 7 }), statisch, sx * 6.3, 2.6, bz);
  }

  // Laternen: Mast, Arm, Leuchte. Die zwei vordersten haben ein echtes Punktlicht.
  const mast = ctx.mat('#25272c', { rauheit: 0.6 });
  const lichter = {};
  const laternen = [[4.9, 1], [-4.9, -12], [4.9, -26], [-4.9, -40]];
  laternen.forEach(([lx, lz], i) => {
    ctx.setze(ctx.zylinder(0.07, 0.09, 4.4, mast), statisch, lx, 2.2, lz);
    ctx.setze(ctx.kiste(0.9, 0.08, 0.08, mast), statisch, lx - Math.sign(lx) * 0.4, 4.35, lz);
    const leuchtMat = ctx.leuchtMat('#ffd9a0', 5);
    const kopf = ctx.kiste(0.36, 0.14, 0.36, leuchtMat, { schatten: false });
    kopf.userData.einzeln = true; // eigenes Material: bleibt einzeln (Licht-Ereignisse)
    ctx.setze(kopf, gruppe, lx - Math.sign(lx) * 0.75, 4.25, lz);
    const gr = { lichter: [], materialien: [leuchtMat] };
    if (i < 2 && params.laternen_licht !== false) {
      const pl = new T.PointLight('#ffb36b', 22, 16, 1.6);
      pl.position.set(lx - Math.sign(lx) * 0.75, 4.0, lz);
      gruppe.add(pl);
      gr.lichter.push(pl);
    }
    lichter[i === 0 ? 'laterne' : `laterne${i + 1}`] = gr;
  });
  lichter.fenster = { lichter: [], materialien: [fensterMat] };

  // Zaun vor dem Haus mit der Tür (Vordergrund-Material für Nahaufnahmen)
  const zaun = ctx.mat('#ddd6c6');
  for (let i = 0; i < 9; i++) ctx.setze(ctx.kiste(0.08, 0.9, 0.08, zaun, { rund: 0.01 }), statisch, 6.1, 0.45, -1.5 - i * 0.7);
  ctx.setze(ctx.kiste(0.05, 0.08, 6, zaun), statisch, 6.1, 0.75, -4.3);

  ctx.verschmelzen(statisch);

  return {
    gruppe,
    anker: {
      mitte: [0, 0, 0],
      laterne: [4.15, 4.2, 1],
      gehweg: [4.4, 0.16, 0],
      tuer: tuerAnker,
      fern: [0, 1.5, -40],
    },
    lichter,
    kamerapunkte: {
      totale: { pos: [1.5, 7.5, 16], ziel: [0, 1.2, -8], fov: 55 },
      gehweg: { pos: [2.4, 1.5, 5.5], ziel: [4.4, 1.4, -2], fov: 45 },
    },
  };
}
