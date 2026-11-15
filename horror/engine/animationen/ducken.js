// Ducken / Kauern: in die Knie, Oberkörper vor, Kopf eingezogen (Spec 2.1: 0,4 s, dann Pose).
// Satz 1: "Eli duckt sich hinter das Verandageländer". Die Füße bleiben stehen (Hüfte wandert zurück).
// params: tiefe (0..1, Std 1 = tief kauern), arme ("knie" | "kopf", Std "knie")
import { beinGeometrie } from '../src/ik.js';

export default {
  dauer: 0.4,
  ease: 'ease_out',
  anwenden(fig, p, params, ctx) {
    const G = fig.gelenke;
    const t = params.tiefe ?? 1;
    const alpha = 1.15 * t, beta = 2.1 * t;
    const knie = !!G.unterbeinL;
    const geo = knie ? beinGeometrie(fig, alpha, beta) : { hoehe: (fig.huefteHoehe ?? 0.6) * (1 - 0.4 * t), vor: 0 };
    G.beinL.rotation.x = ctx.mischen(G.beinL.rotation.x, -alpha, p);
    G.beinR.rotation.x = ctx.mischen(G.beinR.rotation.x, -alpha * 0.92, p);
    if (knie) {
      G.unterbeinL.rotation.x = ctx.mischen(G.unterbeinL.rotation.x, beta, p);
      G.unterbeinR.rotation.x = ctx.mischen(G.unterbeinR.rotation.x, beta * 0.92, p);
      if (G.fussL) { G.fussL.rotation.x = ctx.mischen(G.fussL.rotation.x, alpha - beta, p); G.fussR.rotation.x = ctx.mischen(G.fussR.rotation.x, (alpha - beta) * 0.92, p); }
    }
    if (fig.huefteHoehe) G.huefte.position.y = ctx.mischen(G.huefte.position.y, geo.hoehe, p);
    G.huefte.position.z -= geo.vor * p;
    G.rumpf.rotation.x = ctx.mischen(G.rumpf.rotation.x, 0.5 * t, p);
    if (G.kopf) G.kopf.rotation.x = ctx.mischen(G.kopf.rotation.x, -0.3 * t, p);
    if (params.arme === 'kopf') {
      G.armL.rotation.x = ctx.mischen(G.armL.rotation.x, -2.4, p);
      G.armR.rotation.x = ctx.mischen(G.armR.rotation.x, -2.4, p);
      if (G.unterarmL) { G.unterarmL.rotation.x = ctx.mischen(G.unterarmL.rotation.x, -1.6, p); G.unterarmR.rotation.x = ctx.mischen(G.unterarmR.rotation.x, -1.6, p); }
    } else {
      G.armL.rotation.x = ctx.mischen(G.armL.rotation.x, -0.9 * t, p);
      G.armR.rotation.x = ctx.mischen(G.armR.rotation.x, -0.9 * t, p);
    }
  },
};
