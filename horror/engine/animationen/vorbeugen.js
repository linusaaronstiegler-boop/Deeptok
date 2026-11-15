// Vorbeugen (Monster, Spec: 60–70° gleichmäßig über die Einstellung, ~1,4 s).
// params: winkel (Grad, Std 65), kopf_ausgleich (Grad, Kopf hebt sich gegen, Std 40).
export default {
  dauer: 1.4,
  ease: 'linear',
  anwenden(fig, p, params, ctx) {
    const G = fig.gelenke;
    const rumpf = G.rumpf ?? G.huefte;
    rumpf.rotation.x = ctx.mischen(rumpf.rotation.x, (params.winkel ?? 65) * ctx.GRAD, p);
    if (G.kopf) G.kopf.rotation.x = ctx.mischen(G.kopf.rotation.x, -(params.kopf_ausgleich ?? 40) * ctx.GRAD, p);
    G.armL.rotation.x = ctx.mischen(G.armL.rotation.x, -0.5, p);
    G.armR.rotation.x = ctx.mischen(G.armR.rotation.x, -0.5, p);
  },
};
