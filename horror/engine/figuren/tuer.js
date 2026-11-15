// Requisite: Tür, die sich öffnen lässt (Haustür, Zimmertür). Für Einstellungen, in denen eine Tür
// aufgeht; das Set lässt das feste Türblatt dann weg (Set-Parameter "tueren_als_figur").
// Ursprung = Angel unten (Drehachse), Blatt liegt in +x, Vorderseite zeigt nach +z.
// params: breite (0.95), hoehe (2.1), farbe ('#7A4A32'), anschlag ('links' | 'rechts': Angel links/rechts
//         von vorn gesehen), fenster (Std false: kleines Fenster oben), offen (Grad, Ausgangsstellung, Std 0)
// Animationen: oeffnen { winkel (Std 85; + = nach hinten auf, − = nach vorn) }, schliessen.
// Anker: griff_vorn, griff_hinten (bewegen sich mit dem Blatt), mitte, angel.
export default async function baue(ctx, params = {}) {
  const T = ctx.THREE;
  const b = params.breite ?? 0.95, h = params.hoehe ?? 2.1, d = 0.06;
  const links = (params.anschlag ?? 'links') === 'links';
  const sx = links ? 1 : -1;
  const gruppe = new T.Group();
  const blatt = new T.Group();
  gruppe.add(blatt);
  const holz = ctx.mat(params.farbe ?? '#7A4A32', { rauheit: 0.7 });
  const dunkler = ctx.mat(params.rahmenFarbe ?? '#5E3826', { rauheit: 0.7 });
  const flaeche = ctx.kiste(b, h, d, holz, { rund: 0.012 });
  flaeche.position.set(sx * b / 2, h / 2, 0);
  blatt.add(flaeche);
  // Kassetten (je Seite vier vertiefte Felder als aufgesetzte Leisten)
  for (const seite of [1, -1]) {
    for (const [fy, fh] of [[0.28, 0.42], [0.72, 0.4]]) {
      for (const fx of [0.27, 0.73]) {
        if (params.fenster && fy > 0.5) continue;
        const k = ctx.kiste(b * 0.34, h * fh * 0.8, 0.015, dunkler, { rund: 0.005, schatten: false });
        k.position.set(sx * b * fx, h * fy, seite * (d / 2 + 0.004));
        blatt.add(k);
      }
    }
  }
  if (params.fenster) {
    const glas = ctx.kiste(b * 0.62, h * 0.24, d + 0.01, ctx.mat('#2a3444', { rauheit: 0.25 }), { schatten: false });
    glas.position.set(sx * b / 2, h * 0.74, 0);
    blatt.add(glas);
  }
  const messing = ctx.mat('#C9A85A', { rauheit: 0.35, metall: 0.8 });
  const griffe = {};
  for (const seite of [1, -1]) {
    const knauf = ctx.kugel(0.035, messing, { segmente: 10 });
    knauf.position.set(sx * (b - 0.09), 1.0, seite * (d / 2 + 0.035));
    blatt.add(knauf);
    const g = new T.Object3D();
    g.position.copy(knauf.position);
    blatt.add(g);
    griffe[seite > 0 ? 'griff_vorn' : 'griff_hinten'] = g;
  }
  const offen0 = (params.offen ?? 0) * Math.PI / 180;
  const mitte = new T.Object3D(); mitte.position.set(sx * b / 2, h / 2, 0); blatt.add(mitte);
  const angel = new T.Object3D(); gruppe.add(angel);
  const drehe = (g, winkel) => { blatt.rotation.y = -sx * winkel; };
  return {
    gruppe, gelenke: { blatt },
    grundpose() { blatt.rotation.set(0, -sx * offen0, 0); },
    anker: { ...griffe, mitte, angel },
    hoehe: h,
    animationen: {
      oeffnen: {
        dauer: 0.5, ease: 'ease_in_out',
        anwenden(f, p, prm, c) {
          const ziel = (prm.winkel ?? 85) * c.GRAD;
          const jetzt = -blatt.rotation.y * sx;
          drehe(f, c.mischen(jetzt, ziel, p));
        },
      },
      schliessen: {
        dauer: 0.4, ease: 'ease_in',
        anwenden(f, p, prm, c) { const jetzt = -blatt.rotation.y * sx; drehe(f, c.mischen(jetzt, 0, p)); },
      },
    },
  };
}
