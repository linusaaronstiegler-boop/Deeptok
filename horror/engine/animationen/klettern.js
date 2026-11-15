// Klettern: die Figur steigt um "hoehe" Meter (aus der Bodenluke, eine Treppe hinauf).
// Spec 2.1: Klettern 0,8 s. Wird mit "gehen" kombiniert (Treppe: gehen bewegt x/z, klettern y).
// params: hoehe (m, Pflicht), arme (Std true: Hände greifen nach oben/vorn, wie aus einer Luke),
//         vor (m, Std 0: gleichzeitig so weit nach vorn, in Blickrichtung der Figur)
export default {
  dauer: 0.8,
  ease: 'ease_in_out',
  anwenden(fig, p, params, ctx) {
    const g = fig.gruppe;
    g.position.y += (params.hoehe ?? 0) * p;
    if (params.vor) {
      g.position.x += Math.sin(g.rotation.y) * params.vor * p;
      g.position.z += Math.cos(g.rotation.y) * params.vor * p;
    }
    if (params.arme === false) return;
    // Bewegung nur während des Steigens: Arme greifen vor und oben, Knie beugen sich in der Mitte
    const mitte = Math.sin(Math.PI * Math.min(1, ctx.roh));
    const G = fig.gelenke;
    for (const S of ['L', 'R']) {
      const arm = G[`arm${S}`];
      if (arm) arm.rotation.x += -1.9 * mitte;
      const ua = G[`unterarm${S}`];
      if (ua) ua.rotation.x += -0.5 * mitte;
    }
    if (G.unterbeinL) G.unterbeinL.rotation.x += 0.9 * mitte;
    if (G.beinL) G.beinL.rotation.x += -0.8 * mitte;
    G.rumpf.rotation.x += 0.25 * mitte;
  },
};
