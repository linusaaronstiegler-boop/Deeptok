// Kicken: ein Bein schwingt schnell nach vorn und zurück (Satz 18: Eli kickt seine Turnschuhe schief).
// params: seite ("r" | "l", Std "r"), staerke (Std 1)
import { huelle } from '../src/ik.js';

export default {
  dauer: 0.4,
  ease: 'linear',
  anwenden(fig, p, params, ctx) {
    const G = fig.gelenke;
    const S = (params.seite ?? 'r').toUpperCase();
    const st = params.staerke ?? 1;
    const u = ctx.roh;
    // Ausholen (Knie beugt), Schwung nach vorn (gestreckt), zurück
    const aus = huelle(u, 0.25, 0.75) * (u < 0.35 ? 1 : 0);
    const vor = Math.sin(Math.PI * Math.min(1, Math.max(0, (u - 0.2) / 0.6))) * st;
    G[`bein${S}`].rotation.x += 0.35 * aus - 0.95 * vor;
    if (G[`unterbein${S}`]) G[`unterbein${S}`].rotation.x += 0.9 * aus + 0.15 * vor;
    const andere = S === 'R' ? 'L' : 'R';
    G[`arm${andere}`].rotation.x -= 0.4 * vor;
    G[`arm${S}`].rotation.x += 0.3 * vor;
    G.rumpf.rotation.x -= 0.08 * vor;
  },
};
