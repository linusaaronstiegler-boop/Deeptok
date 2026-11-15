// Requisite: Owens hellblauer Pick-up (Satz 14–16). Als Figur gebaut, damit er fahren kann.
// Ursprung am Boden unter der Fahrzeugmitte, Front zeigt nach +z.
// Farbe aus serie.md: Truck #6FA3C8.
// params: farbe, stiefel (Std false: Owens Stiefel stehen auf dem Fahrersitz), scheinwerfer (Std true)
// Animationen:
//   fahren   { nach ([x, z] | Anker), von ([x, z]) } – Räder drehen sich passend zur Strecke,
//            Karosserie nickt beim Anfahren. Ease Std "ease_in" (rast los).
//   tuer_auf { winkel (Std 62) }, tuer_zu
// Anker: auspuff (für Partikel "atem" = Dampf), sitz, fahrertuer, motorhaube, ladeflaeche, mitte
export default async function baue(ctx, params = {}) {
  const T = ctx.THREE;
  const gruppe = new T.Group();
  const karosse = new T.Group();
  gruppe.add(karosse);
  const lack = ctx.mat(params.farbe ?? '#6FA3C8', { rauheit: 0.45, metall: 0.15 });
  const lackDunkel = ctx.mat('#5a8bb0', { rauheit: 0.5 });
  const chrom = ctx.mat('#c9cdd2', { rauheit: 0.25, metall: 0.9 });
  const glas = ctx.mat('#1d2633', { rauheit: 0.15, metall: 0.2 });
  const schwarz = ctx.mat('#1b1c1f', { rauheit: 0.8 });
  const L = 5.2, B = 1.95;
  const k = (b, h, t, m, x, y, z, r = 0.04) => { const o = ctx.kiste(b, h, t, m, { rund: r }); o.position.set(x, y, z); karosse.add(o); return o; };
  // Fahrgestell, Motorhaube, Kabine, Ladefläche
  k(B, 0.55, L, lack, 0, 0.75, 0, 0.08);
  k(B * 0.98, 0.32, 1.55, lack, 0, 1.18, 1.75, 0.08);
  const kabine = k(B * 0.96, 0.85, 1.65, lack, 0, 1.45, 0.15, 0.1);
  k(B * 0.9, 0.62, 0.05, glas, 0, 1.55, 0.99, 0.01); // Frontscheibe
  k(B * 0.86, 0.5, 0.05, glas, 0, 1.55, -0.68, 0.01); // Heckscheibe
  k(0.05, 0.5, 0.75, glas, B * 0.48 + 0.005, 1.56, -0.2, 0.01); // Seitenfenster rechts (Beifahrer)
  // Ladefläche: Wände
  for (const sx of [-1, 1]) k(0.08, 0.45, 2.0, lack, sx * (B / 2 - 0.04), 1.24, -1.65, 0.02);
  k(B, 0.45, 0.08, lackDunkel, 0, 1.24, -2.62, 0.02);
  k(B * 0.9, 0.04, 1.95, ctx.mat('#3a3d42'), 0, 1.04, -1.65, 0.01);
  // Stoßstangen, Kühlergrill, Scheinwerfer, Rücklichter
  k(B * 1.02, 0.18, 0.16, chrom, 0, 0.62, L / 2 + 0.02, 0.05);
  k(B * 1.02, 0.18, 0.16, chrom, 0, 0.62, -L / 2 - 0.02, 0.05);
  k(B * 0.6, 0.28, 0.04, schwarz, 0, 0.98, L / 2 + 0.01, 0.01);
  const licht = ctx.leuchtMat('#fff3d6', params.scheinwerfer === false ? 0 : 3.5);
  const rot = ctx.leuchtMat('#c0392b', 1.4);
  for (const sx of [-1, 1]) {
    k(0.32, 0.18, 0.04, licht, sx * 0.7, 0.98, L / 2 + 0.01, 0.02);
    k(0.12, 0.25, 0.04, rot, sx * (B / 2 - 0.1), 1.1, -L / 2 - 0.02, 0.01);
  }
  // Räder (drehen sich beim Fahren)
  const raeder = [];
  const reifen = new T.CylinderGeometry(0.42, 0.42, 0.3, 18);
  reifen.rotateZ(Math.PI / 2);
  const felge = new T.CylinderGeometry(0.22, 0.22, 0.32, 10);
  felge.rotateZ(Math.PI / 2);
  for (const [sx, z] of [[-1, 1.65], [1, 1.65], [-1, -1.65], [1, -1.65]]) {
    const rad = new T.Group();
    rad.position.set(sx * (B / 2 - 0.12), 0.42, z);
    const r = new T.Mesh(reifen, schwarz); r.castShadow = true; rad.add(r);
    const f = new T.Mesh(felge, chrom); rad.add(f);
    const speiche = ctx.kiste(0.33, 0.06, 0.36, schwarz); rad.add(speiche); // sichtbares Drehen
    gruppe.add(rad);
    raeder.push(rad);
  }
  // Fahrertür (links, −x) mit Angel vorn
  const tuer = new T.Group();
  tuer.position.set(-B / 2 + 0.01, 0, 0.95);
  gruppe.add(tuer);
  const tb = ctx.kiste(0.07, 0.95, 1.2, lack, { rund: 0.03 }); tb.position.set(-0.02, 1.25, -0.6); tuer.add(tb);
  const tf = ctx.kiste(0.07, 0.48, 0.85, glas, { rund: 0.01 }); tf.position.set(-0.025, 1.6, -0.6); tuer.add(tf);
  const tg = ctx.kiste(0.04, 0.04, 0.16, chrom); tg.position.set(-0.07, 1.3, -1.0); tuer.add(tg);
  // Innenraum: Sitzbank (hinter der offenen Tür sichtbar), Lenkrad
  const sitzMat = ctx.mat('#4a3b30', { rauheit: 0.9 });
  const sitz = ctx.kiste(B * 0.8, 0.18, 0.6, sitzMat, { rund: 0.04 }); sitz.position.set(0, 1.12, -0.25); karosse.add(sitz);
  const lehne = ctx.kiste(B * 0.8, 0.55, 0.15, sitzMat, { rund: 0.04 }); lehne.position.set(0, 1.42, -0.55); karosse.add(lehne);
  const lenk = new T.Mesh(new T.TorusGeometry(0.17, 0.025, 6, 16), schwarz); lenk.position.set(-0.45, 1.5, 0.55); lenk.rotation.x = -0.9; karosse.add(lenk);
  const sitzAnker = new T.Object3D(); sitzAnker.position.set(-0.45, 1.21, -0.25); karosse.add(sitzAnker);
  if (params.stiefel) {
    const stiefel = await (await import('./schuhpaar.js')).default(ctx, { art: 'owen' });
    stiefel.gruppe.position.copy(sitzAnker.position);
    stiefel.gruppe.rotation.y = Math.PI / 2; // quer auf der Sitzbank, Spitzen zur Fahrertür
    karosse.add(stiefel.gruppe);
  }
  const anker = {
    auspuff: (() => { const a = new T.Object3D(); a.position.set(0.6, 0.38, -L / 2 - 0.1); karosse.add(a); return a; })(),
    sitz: sitzAnker,
    fahrertuer: (() => { const a = new T.Object3D(); a.position.set(-0.1, 1.3, -0.6); tuer.add(a); return a; })(),
    motorhaube: (() => { const a = new T.Object3D(); a.position.set(0, 1.4, 1.8); karosse.add(a); return a; })(),
    ladeflaeche: (() => { const a = new T.Object3D(); a.position.set(0, 1.1, -1.65); karosse.add(a); return a; })(),
    mitte: (() => { const a = new T.Object3D(); a.position.set(0, 1.2, 0); karosse.add(a); return a; })(),
  };
  const R = 0.42;
  return {
    gruppe, gelenke: { karosse, tuer, ...Object.fromEntries(raeder.map((r, i) => [`rad${i}`, r])) },
    anker, hoehe: 1.9,
    grundpose() {
      karosse.position.set(0, 0, 0); karosse.rotation.set(0, 0, 0);
      tuer.rotation.set(0, 0, 0);
      for (const r of raeder) r.rotation.set(0, 0, 0);
    },
    animationen: {
      fahren: {
        dauer: 2.0, ease: 'ease_in',
        anwenden(f, p, prm, c) {
          const g = f.gruppe;
          const ziel = Array.isArray(prm.nach) ? { x: prm.nach[0], z: prm.nach[prm.nach.length - 1] }
            : (() => { const v = c.zielPunkt(prm.nach); return { x: v.x, z: v.z }; })();
          const von = prm.von ? { x: prm.von[0], z: prm.von[1] } : { x: g.position.x, z: g.position.z };
          g.position.x = c.mischen(von.x, ziel.x, p);
          g.position.z = c.mischen(von.z, ziel.z, p);
          const strecke = Math.hypot(ziel.x - von.x, ziel.z - von.z) * p;
          for (const r of raeder) r.rotation.x = strecke / R;
          if (prm.drehen !== false && strecke > 0.01) g.rotation.y = c.mischeWinkel(g.rotation.y, Math.atan2(ziel.x - von.x, ziel.z - von.z), Math.min(1, c.roh * 4));
          // Anfahren: Karosserie nickt hinten ein (Gewicht nach hinten), leichtes Schaukeln
          karosse.rotation.x -= 0.035 * Math.sin(Math.PI * Math.min(1, c.roh * 2.5));
          karosse.position.y += 0.01 * Math.sin(c.tLokal * 23) * (c.roh < 1 ? 1 : 0);
        },
      },
      tuer_auf: {
        dauer: 0.5, ease: 'ease_out',
        anwenden(f, p, prm, c) { tuer.rotation.y = c.mischen(tuer.rotation.y, -(prm.winkel ?? 62) * c.GRAD, p); },
      },
      tuer_zu: {
        dauer: 0.3, ease: 'ease_in',
        anwenden(f, p, prm, c) { tuer.rotation.y = c.mischen(tuer.rotation.y, 0, p); },
      },
    },
  };
}
