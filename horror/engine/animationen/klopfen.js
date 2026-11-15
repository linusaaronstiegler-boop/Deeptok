// Klopfen (knock): Faust an die Tür, 2–3 Schläge pro Sekunde (Spec 2.1), danach Arm senken.
// params: zu (Anker | [x,y,z]: Klopfstelle; Std 0,5 m vor der Figur in Kopfhöhe), seite ("r"),
//         schlaege (pro Sekunde, Std 2.5), senken (Std true: Arm geht am Ende zurück)
import { zweiGlied, huelle, lokalZuWelt } from '../src/ik.js';

export default {
  dauer: 1.2,
  ease: 'linear',
  anwenden(fig, p, params, ctx) {
    const S = (params.seite ?? 'r').toUpperCase();
    const sx = S === 'L' ? 1 : -1;
    const kopfY = fig.anker?.kopf ? fig.anker.kopf.getWorldPosition(new ctx.THREE.Vector3()).y - fig.gruppe.position.y : 1.4;
    const ziel = params.zu !== undefined ? ctx.zielPunkt(params.zu) : lokalZuWelt(fig.gruppe, sx * 0.12, kopfY - 0.15, 0.5);
    // Richtung Schulter -> Ziel: die Faust pendelt auf dieser Linie vor und zurück
    const schulter = fig.gelenke[`arm${S}`].getWorldPosition(new ctx.THREE.Vector3());
    const richtung = ziel.clone().sub(schulter).normalize();
    const f = params.schlaege ?? 2.5;
    const pendel = 0.5 - 0.5 * Math.cos(2 * Math.PI * f * ctx.tLokal);
    const e = huelle(ctx.roh, 0.18, params.senken === false ? 0 : 0.22);
    const takt = ctx.roh > 0.15 && ctx.roh < (params.senken === false ? 1 : 0.8) ? 1 : 0;
    const punkt = ziel.clone().addScaledVector(richtung, -0.04 - 0.07 * pendel * takt);
    zweiGlied(fig, S, punkt, e);
    if (fig.handForm && e > 0.3) fig.handForm(S, 'faust');
    fig.gelenke.rumpf.rotation.x += 0.04 * e;
  },
};
