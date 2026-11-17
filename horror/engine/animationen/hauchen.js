// Hauchen: ein gezielter, kräftiger Atemzug, z. B. auf Odells hochgehaltene Brille (Rules of Kindly F1: S6, S37).
// Die Figur beugt Kopf und Oberkörper etwas vor; ihr Atemdampf (src/atemdampf.js) bläst eine dichte Wolke
// zum Ziel. Eine Kopie (dampf aus) haucht genauso, aber es kommt nichts: genau das ist das Suchbild.
// params: zu (Anker oder [x, y, z], Ziel der Wolke, z. B. "odell.brille"), staerke (Std 1), vor (Std 1: Vorbeugen)
// dauer: Std 3 s (so lange lebt die Wolke; die Bewegung selbst ist nach 0,6 s fertig und hält dann)
import { huelle } from '../src/ik.js';

export default {
  dauer: 3.0,
  ease: 'linear',
  anwenden(fig, p, params, ctx) {
    const G = fig.gelenke;
    // vorbeugen in 0,25 s, halten bis 1,2 s, zurück bis 1,6 s
    const u = Math.min(1, ctx.tLokal / 1.6);
    const e = huelle(u, 0.16, 0.25) * (params.vor ?? 1);
    G.rumpf.rotation.x += 0.12 * e;
    G.kopf.rotation.x += 0.1 * e;
    if (!fig.dampf || ctx.roh <= 0) return;
    const start = ctx.t - ctx.tLokal;   // gültig, solange t in der Dauer liegt (danach ist die Wolke weg)
    if (ctx.t - start > (ctx.dauer || 3) + 1e-6) return;
    fig.dampf.zustand.hauch = { start, ziel: params.zu !== undefined ? ctx.zielPunkt(params.zu) : null, staerke: params.staerke ?? 1 };
  },
};
