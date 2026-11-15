// Greifen: Hand zu einem Punkt oder einer anderen Figur (Satz 28: Junes Hand greift nach Elis Hand;
// Satz 11: Odell packt einen Arm). Spec 2.1: Arm heben/Geste 0,1–0,4 s, danach halten.
// params: zu (Anker | [x,y,z], Pflicht), seite ("r"), lehnen (Std true: beugt sich vor, wenn das Ziel weit ist),
//         form ("offen" | "faust", Std "offen")
import { zweiGlied } from '../src/ik.js';

export default {
  dauer: 0.4,
  ease: 'ease_in_out',
  anwenden(fig, p, params, ctx) {
    if (params.zu === undefined) throw new Error('greifen braucht params.zu');
    const S = (params.seite ?? 'r').toUpperCase();
    const ziel = ctx.zielPunkt(params.zu);
    const schulter = fig.gelenke[`arm${S}`].getWorldPosition(new ctx.THREE.Vector3());
    const [L1, L2] = fig.glieder?.arm ?? [0.3, 0.3];
    const zuWeit = schulter.distanceTo(ziel) - (L1 + L2) * 0.95;
    if (params.lehnen !== false && zuWeit > 0) fig.gelenke.rumpf.rotation.x += Math.min(0.6, zuWeit * 1.4) * p;
    zweiGlied(fig, S, ctx.zielPunkt(params.zu), p);
    if (fig.handForm && params.form === 'faust' && p > 0.6) fig.handForm(S, 'faust');
  },
};
