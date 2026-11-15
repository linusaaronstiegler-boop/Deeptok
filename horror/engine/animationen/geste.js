// Gesten mit einer Hand (Spec 2.1: Zeigen/Geste 0,1–0,4 s, dann halten).
// params: art:
//   "finger_heben"      Zeigefinger vor der Schulter nach oben (Satz 10: Odell hebt einen Finger)
//   "finger_auf_lippen" Zeigefinger senkrecht vor den Mund (Satz 19: Odell legt den Finger auf die Lippen)
//   "stopp"             flache Hand nach vorn
//   "winken"            Hand neben dem Kopf, winkt (Schleife während der Dauer)
// seite ("r" | "l", Std "r")
import { zweiGlied, richteAus, handDrehung, lokalZuWelt, richtungZuWelt } from '../src/ik.js';

export default {
  dauer: 0.3,
  ease: 'ease_out',
  anwenden(fig, p, params, ctx) {
    const G = fig.gelenke;
    const S = (params.seite ?? 'r').toUpperCase();
    const sx = S === 'L' ? 1 : -1;
    const art = params.art ?? 'finger_heben';
    const m = fig.masse ?? {};
    const kh = m.kopfH ?? 0.5, kt = m.kopfT ?? 0.46;
    let ziel, finger, flaeche, form = 'offen';
    if (art === 'finger_heben') {
      ziel = lokalZuWelt(G.rumpf, sx * 0.22, (m.rumpfH ?? 0.55) + 0.12, 0.32);
      finger = richtungZuWelt(fig.gruppe, 0, 1, 0);
      flaeche = richtungZuWelt(fig.gruppe, -sx * 0.3, 0, -1);
      form = 'zeigen';
    } else if (art === 'finger_auf_lippen') {
      ziel = lokalZuWelt(G.kopf, 0, kh * 0.15, kt / 2 + 0.1);
      finger = richtungZuWelt(G.kopf, 0, 1, 0);
      flaeche = richtungZuWelt(G.kopf, -sx, 0, -0.2);
      form = 'zeigen';
    } else if (art === 'stopp') {
      ziel = lokalZuWelt(G.rumpf, sx * 0.15, (m.rumpfH ?? 0.55) * 0.85, 0.45);
      finger = richtungZuWelt(fig.gruppe, 0, 1, 0.1);
      flaeche = richtungZuWelt(fig.gruppe, 0, 0, 1);
    } else if (art === 'winken') {
      const w = Math.sin(2 * Math.PI * 2.2 * ctx.tLokal) * (ctx.tLokal < ctx.dauer ? 1 : 0);
      ziel = lokalZuWelt(G.rumpf, sx * 0.42 + sx * 0.06 * w, (m.rumpfH ?? 0.55) + 0.3, 0.12);
      finger = richtungZuWelt(fig.gruppe, sx * 0.35 * w, 1, 0);
      flaeche = richtungZuWelt(fig.gruppe, 0, 0, 1);
    } else throw new Error(`geste: art "${art}" unbekannt (finger_heben, finger_auf_lippen, stopp, winken)`);
    zweiGlied(fig, S, ziel, p, { pol: [0.9, -0.8, -0.2] });
    richteAus(G[`hand${S}`], handDrehung(S, finger, flaeche), p);
    if (fig.handForm && p > 0.4) fig.handForm(S, form);
  },
};
