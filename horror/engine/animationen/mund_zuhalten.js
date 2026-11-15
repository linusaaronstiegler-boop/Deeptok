// Mund zuhalten (cover_mouth): Hand (oder beide) vor den Mund, Handfläche zum Gesicht.
// Spec 2.1: Ducken/Ohren oder Mund zuhalten 0,4 s, danach gehalten. Satz 6: "hält die Hand vor den Mund".
// params: seite ("r" | "l" | "beide", Std "r"), ducken (Std 0.3: Kopf und Schultern ziehen ein)
import { zweiGlied, richteAus, handDrehung, lokalZuWelt, richtungZuWelt } from '../src/ik.js';

export default {
  dauer: 0.4,
  ease: 'ease_out',
  anwenden(fig, p, params, ctx) {
    const G = fig.gelenke;
    const d = params.ducken ?? 0.3;
    G.kopf.rotation.x += 0.12 * d * p;
    G.rumpf.rotation.x += 0.1 * d * p;
    const m = fig.masse ?? {};
    const kh = m.kopfH ?? 0.5, kt = m.kopfT ?? 0.46;
    const seiten = params.seite === 'beide' ? ['L', 'R'] : [(params.seite ?? 'r').toUpperCase()];
    for (const S of seiten) {
      const sx = S === 'L' ? 1 : -1;
      const versatz = seiten.length === 2 ? sx * 0.05 : 0;
      // Handmitte knapp vor dem Mund (Kopf-System)
      const ziel = lokalZuWelt(G.kopf, versatz, kh * 0.24, kt / 2 + 0.07 + (seiten.length === 2 && sx < 0 ? 0.04 : 0));
      zweiGlied(fig, S, ziel, p, { pol: [0.8, -0.6, -0.2] });
      const finger = richtungZuWelt(G.kopf, -sx * 0.55, 0.85, 0);
      const flaeche = richtungZuWelt(G.kopf, 0, 0, -1);
      richteAus(G[`hand${S}`], handDrehung(S, finger, flaeche), p);
    }
  },
};
