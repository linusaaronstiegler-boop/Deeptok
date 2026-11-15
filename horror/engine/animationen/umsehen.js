// Umsehen (look_around): Kopf nach links, halten, nach rechts, halten, zurück. Oberkörper dreht leicht mit.
// Kopfdrehungen selbst dauern je etwa 0,2 s (Spec), dazwischen wird gehalten.
// params: winkel (Grad, Std 55), zurueck (Std true: endet geradeaus), nicken (Grad, Std 0)
import { kurve } from '../src/ik.js';

export default {
  dauer: 1.4,
  ease: 'linear',
  anwenden(fig, p, params, ctx) {
    const w = (params.winkel ?? 55) * ctx.GRAD;
    const ende = params.zurueck === false ? -1 : 0;
    const u = ctx.roh;
    // Keys so gelegt, dass jede Drehung bei 1,4 s Dauer etwa 0,2–0,25 s braucht
    const k = kurve(u, [[0, 0], [0.16, 1], [0.42, 1], [0.6, -1], [0.84, -1], [1, ende]]);
    const G = fig.gelenke;
    G.kopf.rotation.y += k * w;
    G.kopf.rotation.x += ((params.nicken ?? 0) * ctx.GRAD) * Math.abs(k);
    G.rumpf.rotation.y += k * w * 0.25;
  },
};
