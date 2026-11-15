// Zeigen (point): Arm gestreckt zum Ziel, Zeigefinger raus, Kopf schaut mit (Spec: 0,1–0,3 s, dann halten).
// params: zu (Anker | [x,y,z] | "kamera", Pflicht), seite ("r" | "l", Std "r"),
//         kopf (Std true: Kopf dreht mit), finger (Std true: Handform "zeigen")
import armHeben from './arm_heben.js';
import kopfDrehen from './kopf_drehen.js';

export default {
  dauer: 0.25,
  ease: 'ease_out',
  anwenden(fig, p, params, ctx) {
    const seite = params.seite ?? 'r';
    const S = seite.toUpperCase();
    armHeben.anwenden(fig, p, { seite, zu: params.zu ?? 'kamera' }, ctx);
    const ua = fig.gelenke[`unterarm${S}`];
    if (ua) ua.rotation.x = ctx.mischen(ua.rotation.x, -0.04, p); // Ellbogen strecken
    if (params.finger !== false && fig.handForm && p > 0.25) fig.handForm(S, 'zeigen');
    if (params.kopf !== false && params.zu !== undefined) kopfDrehen.anwenden(fig, p, { zu: params.zu }, ctx);
    fig.gelenke.rumpf.rotation.x += 0.05 * p; // ins Zeigen lehnen
  },
};
