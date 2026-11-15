// Ohren zuhalten: beide Hände flach an die Kopfseiten, Kopf zieht ein (Satz 5: Nachbar presst sich
// die Hände auf die Ohren). Spec 2.1: 0,4 s, danach gehalten.
// params: ducken (Std 0.5)
import { zweiGlied, richteAus, handDrehung, lokalZuWelt, richtungZuWelt } from '../src/ik.js';

export default {
  dauer: 0.4,
  ease: 'ease_out',
  anwenden(fig, p, params, ctx) {
    const G = fig.gelenke;
    const d = params.ducken ?? 0.5;
    G.kopf.rotation.x += 0.2 * d * p;
    G.rumpf.rotation.x += 0.12 * d * p;
    const m = fig.masse ?? {};
    const kb = m.kopfB ?? 0.5, kh = m.kopfH ?? 0.5;
    for (const S of ['L', 'R']) {
      const sx = S === 'L' ? 1 : -1;
      const ziel = lokalZuWelt(G.kopf, sx * (kb / 2 + 0.05), kh * 0.48, 0.02);
      zweiGlied(fig, S, ziel, p, { pol: [1, -0.5, -0.1] });
      richteAus(G[`hand${S}`], handDrehung(S, richtungZuWelt(G.kopf, 0, 1, 0.15), richtungZuWelt(G.kopf, -sx, 0, 0)), p);
    }
  },
};
