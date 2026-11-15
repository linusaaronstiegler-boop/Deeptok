// Augen zuhalten: beide Hände flach vors Gesicht, wie Mister Hundred (Satz 17: ein junger Mann macht
// das Monster zum Spaß nach, als würde er zählen). Spec 2.1: Geste 0,1–0,4 s, danach gehalten.
// Auch als Pose nutzbar ("pose": "augen_zuhalten"), z. B. am Beginn der nächsten Einstellung.
// params: senken (Std 0.15: Kopf nickt leicht nach vorn)
import { zweiGlied, richteAus, handDrehung, lokalZuWelt, richtungZuWelt } from '../src/ik.js';

export default {
  dauer: 0.35,
  ease: 'ease_out',
  anwenden(fig, p, params) {
    const G = fig.gelenke;
    G.kopf.rotation.x += (params.senken ?? 0.15) * p;
    const m = fig.masse ?? {};
    const kh = m.kopfH ?? 0.5, kt = m.kopfT ?? 0.46;
    for (const S of ['L', 'R']) {
      const sx = S === 'L' ? 1 : -1;
      // Handmitte vor dem Auge der jeweiligen Seite (Kopf-System), Finger nach oben
      const ziel = lokalZuWelt(G.kopf, sx * 0.1, kh * 0.55, kt / 2 + 0.06);
      zweiGlied(fig, S, ziel, p, { pol: [sx * 0.9, -0.5, -0.2] });
      const finger = richtungZuWelt(G.kopf, -sx * 0.15, 1, 0);
      const flaeche = richtungZuWelt(G.kopf, 0, 0, -1);
      richteAus(G[`hand${S}`], handDrehung(S, finger, flaeche), p);
    }
  },
};
