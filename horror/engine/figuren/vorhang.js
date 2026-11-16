// Requisite: Vorhang an Elis Fenster (Teil 2, Satz 2 „I yanked the curtain shut“, Satz 3 Spalt).
// Zwei Stoffbahnen mit Falten an einer Stange. Ursprung = Mitte der Stange; die Bahnen hängen nach −y,
// die Stange läuft entlang lokal x, die Zimmerseite ist +z. Für Elis Fenster (marsh_innen mit
// "vorhang_als_figur": true, dann fehlen die festen Bahnen) an Welt [−12.28, 6.43, 2.6] mit blick −90.
// params: breite (Fensterbreite, Std 1.3), hoehe (Bahnlänge, Std 1.95), farbe (Std #5a6e8a), zu (Std 0)
// Animationen: zuziehen (0,25 s, ease_out: ein Ruck), aufziehen { spalt (m, Std 0.3), seite r|l|beide }
// Anker: mitte (Fenstermitte vor dem Stoff), griff_r / griff_l (Innenkante der Bahn auf Handhöhe)
export default async function baue(ctx, params = {}) {
  const T = ctx.THREE;
  const b = params.breite ?? 1.3, h = params.hoehe ?? 1.95;
  const gruppe = new T.Group();
  const stoffTex = ctx.zeichenTextur((g, w, hh) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, hh);
    // feines Webmuster und eine Borte unten
    for (let y = 0; y < hh; y += 4) { g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(0, y, w, 1); }
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, hh * 0.93, w, hh * 0.03);
  }, 64, 256);
  const stoff = ctx.mat(params.farbe ?? '#5a6e8a', { rauheit: 1, karte: stoffTex, kante: { farbe: '#d8e0ff', staerke: 0.25, exponent: 2.4 }, eigenes: true });
  stoff.side = T.DoubleSide;
  const stange = ctx.mat('#2a2a2a', { rauheit: 0.5, metall: 0.5 });
  const s = ctx.kiste(b + 1.0, 0.04, 0.04, stange, { schatten: false });
  gruppe.add(s);
  // Stoffbahn: Fläche mit Falten (Wellen in z), Breite 1, wird über scale.x gerafft
  const bahnGeo = () => {
    const geo = new T.PlaneGeometry(1, h, 28, 1);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, 0.04 * Math.sin((p.getX(i) + 0.5) * Math.PI * 9));
    geo.computeVertexNormals();
    geo.translate(0, -h / 2 - 0.02, 0);
    return geo;
  };
  const bahnen = [-1, 1].map((seite) => {
    const g = new T.Group();
    const m = new T.Mesh(bahnGeo(), stoff);
    m.castShadow = true; m.receiveShadow = true;
    g.add(m);
    gruppe.add(g);
    return { g, seite };
  });
  // Lage der Bahnen aus "zu" (0 = offen, gerafft am Rand; 1 = geschlossen) und einem Spalt in der Mitte
  const offenB = 0.34, aussen = b / 2 + 0.5;
  const zustand = { zu: params.zu ?? 0, spaltL: 0, spaltR: 0 };
  const anwendenLage = () => {
    for (const { g, seite } of bahnen) {
      const spalt = seite < 0 ? zustand.spaltL : zustand.spaltR;
      const innenZu = 0.004 + spalt;                      // Innenkante bei geschlossenem Vorhang
      const innenOffen = aussen - offenB;
      const innen = innenOffen + (innenZu - innenOffen) * zustand.zu;
      const breite = Math.max(0.12, aussen - innen);
      g.position.set(seite * (innen + breite / 2), 0, 0);
      g.scale.set(breite, 1, 1);
    }
  };
  anwendenLage();
  const mitte = new T.Object3D(); mitte.position.set(0, -h * 0.45, 0.08); gruppe.add(mitte);
  const griffR = new T.Object3D(), griffL = new T.Object3D();
  gruppe.add(griffR, griffL);
  const griffeSetzen = () => {
    const [l, r] = bahnen;
    griffL.position.set(l.g.position.x + l.g.scale.x / 2 - 0.05, -1.15, 0.06);
    griffR.position.set(r.g.position.x - r.g.scale.x / 2 + 0.05, -1.15, 0.06);
  };
  griffeSetzen();
  return {
    gruppe,
    gelenke: { stange: s },
    grundpose() { zustand.zu = params.zu ?? 0; zustand.spaltL = 0; zustand.spaltR = 0; anwendenLage(); griffeSetzen(); },
    anker: { mitte, griff_r: griffR, griff_l: griffL },
    hoehe: h,
    animationen: {
      zuziehen: {
        dauer: 0.25, ease: 'ease_out',
        anwenden(f, p, prm, c) { zustand.zu = c.mischen(zustand.zu, 1, p); zustand.spaltL = c.mischen(zustand.spaltL, 0, p); zustand.spaltR = c.mischen(zustand.spaltR, 0, p); anwendenLage(); griffeSetzen(); },
      },
      aufziehen: {
        dauer: 0.6, ease: 'ease_in_out',
        anwenden(f, p, prm, c) {
          const sp = prm.spalt ?? 0.3, seite = prm.seite ?? 'r';
          if (seite !== 'l') zustand.spaltR = c.mischen(zustand.spaltR, seite === 'beide' ? sp / 2 : sp, p);
          if (seite !== 'r') zustand.spaltL = c.mischen(zustand.spaltL, seite === 'beide' ? sp / 2 : sp, p);
          anwendenLage(); griffeSetzen();
        },
      },
    },
  };
}
