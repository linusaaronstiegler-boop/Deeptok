// Ganzen Körper drehen (Spec: 0,2–0,4 s). Kurzer Federweg in den Knien wirkt lebendiger.
// params: winkel (Grad relativ zur aktuellen Richtung) | blick (absolute Richtung in Grad) |
//         zu ("kamera" | Anker | [x,y,z]).
export default {
  dauer: 0.3,
  ease: 'ease_in_out',
  anwenden(fig, p, params, ctx) {
    const g = fig.gruppe;
    let ziel;
    if (params.zu !== undefined) {
      const z = ctx.zielPunkt(params.zu);
      ziel = Math.atan2(z.x - g.position.x, z.z - g.position.z);
    } else if (params.blick !== undefined) ziel = params.blick * ctx.GRAD;
    else ziel = g.rotation.y + (params.winkel ?? 180) * ctx.GRAD;
    // Relativer Winkel: genau so weit drehen (auch > 180°). Absolutes Ziel: über den kürzeren Weg.
    g.rotation.y = params.zu === undefined && params.blick === undefined
      ? ctx.mischen(g.rotation.y, ziel, p)
      : ctx.mischeWinkel(g.rotation.y, ziel, p);
    const federn = Math.sin(p * Math.PI) * 0.03;
    if (fig.gelenke.huefte) fig.gelenke.huefte.position.y -= federn;
  },
};
