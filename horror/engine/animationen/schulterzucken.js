// Schulterzucken: Schultern hoch, Unterarme nach außen-vorn, Kopf leicht schief, dann zurück.
// Satz 27: "June zuckt mit den Schultern und lächelt schief". Hin und zurück in der Dauer.
// params: staerke (Std 1)
import { huelle } from '../src/ik.js';

export default {
  dauer: 0.7,
  ease: 'linear',
  anwenden(fig, p, params, ctx) {
    const G = fig.gelenke;
    const e = huelle(ctx.roh, 0.3, 0.4) * (params.staerke ?? 1);
    G.armL.position.y += 0.05 * e;
    G.armR.position.y += 0.05 * e;
    G.armL.rotation.z += 0.22 * e;
    G.armR.rotation.z -= 0.22 * e;
    if (G.unterarmL) { G.unterarmL.rotation.x -= 0.9 * e; G.unterarmR.rotation.x -= 0.9 * e; }
    if (G.unterarmL) { G.unterarmL.rotation.y += 0.5 * e; G.unterarmR.rotation.y -= 0.5 * e; }
    G.kopf.rotation.z += 0.12 * e;
    G.kopf.position.y -= 0.02 * e;
  },
};
