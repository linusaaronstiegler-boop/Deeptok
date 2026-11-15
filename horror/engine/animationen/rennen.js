// Rennen (run_cycle): kurze, schnelle Schritte, Oberkörper vorgeneigt, angewinkelte Arme pumpen.
// Spec 2.1: "quer durchs Bild ~1,5 s, geduckt". Schleife über ctx.tLokal, am Ende ruhige Pose.
// params: nach ([x, z] | Anker), von ([x, z]), schritt (s je Schritt, Std 0.17), schwung (Grad, Std 48),
//         drehen (Std true), neigung (Grad Oberkörper, Std 16)
export default {
  dauer: 1.5,
  ease: 'linear',
  anwenden(fig, p, params, ctx) {
    const g = fig.gruppe, G = fig.gelenke;
    if (params.nach !== undefined) {
      const ziel = Array.isArray(params.nach) ? { x: params.nach[0], z: params.nach[params.nach.length - 1] }
        : (() => { const v = ctx.zielPunkt(params.nach); return { x: v.x, z: v.z }; })();
      const von = params.von ? { x: params.von[0], z: params.von[1] } : { x: g.position.x, z: g.position.z };
      g.position.x = ctx.mischen(von.x, ziel.x, p);
      g.position.z = ctx.mischen(von.z, ziel.z, p);
      if (params.drehen !== false && (ziel.x !== von.x || ziel.z !== von.z)) {
        g.rotation.y = ctx.mischeWinkel(g.rotation.y, Math.atan2(ziel.x - von.x, ziel.z - von.z), Math.min(1, ctx.tLokal / 0.1));
      }
    }
    const anteil = Math.min(1, ctx.tLokal / 0.1, Math.max(0, ctx.dauer - ctx.tLokal) / 0.15);
    const amp = anteil * (params.schwung ?? 48) * ctx.GRAD;
    const phase = (ctx.tLokal / (params.schritt ?? 0.17)) * Math.PI;
    const s = Math.sin(phase);
    G.beinL.rotation.x += s * amp;
    G.beinR.rotation.x -= s * amp;
    if (G.unterbeinL) {
      // Knie: hinten stark angewinkelt, vorn fast gestreckt
      G.unterbeinL.rotation.x += (0.35 + Math.max(0, s) * 1.4) * amp;
      G.unterbeinR.rotation.x += (0.35 + Math.max(0, -s) * 1.4) * amp;
    }
    G.armL.rotation.x -= s * amp * 0.9;
    G.armR.rotation.x += s * amp * 0.9;
    if (G.unterarmL) {
      G.unterarmL.rotation.x = ctx.mischen(G.unterarmL.rotation.x, -1.45, anteil);
      G.unterarmR.rotation.x = ctx.mischen(G.unterarmR.rotation.x, -1.45, anteil);
    }
    G.rumpf.rotation.x += (params.neigung ?? 16) * ctx.GRAD * anteil;
    G.rumpf.rotation.y += 0.12 * s * anteil;
    if (G.kopf) G.kopf.rotation.x -= 0.12 * anteil;
    // Flugphase: zweimal je Doppelschritt hoch
    G.huefte.position.y += (Math.abs(Math.cos(phase)) * 0.07 - 0.04) * anteil;
  },
};
