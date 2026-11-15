// Umarmen (hug): beide Arme um den Rücken der anderen Figur, leicht vorgelehnt, Kopf zur Seite.
// Spec 2.1: Umarmen/Handschlag 0,4–0,6 s.
// params: zu (Figur-ID oder Anker auf deren Rücken, Pflicht), hoehe (m über dem Anker, Std 0)
import { zweiGlied } from '../src/ik.js';

export default {
  dauer: 0.5,
  ease: 'ease_in_out',
  anwenden(fig, p, params, ctx) {
    if (params.zu === undefined) throw new Error('umarmen braucht params.zu (Figur-ID)');
    const T = ctx.THREE;
    const ruecken = ctx.zielPunkt(String(params.zu).includes('.') ? params.zu : `${params.zu}.ruecken`);
    ruecken.y += params.hoehe ?? 0;
    const G = fig.gelenke;
    G.rumpf.rotation.x += 0.12 * p;
    G.kopf.rotation.z += 0.18 * p;
    G.kopf.rotation.y += 0.25 * p;
    // Seitenvektor der umarmenden Figur: die Hände liegen links und rechts hinter dem Rücken
    const rechts = new T.Vector3(1, 0, 0).applyAxisAngle(new T.Vector3(0, 1, 0), fig.gruppe.rotation.y);
    for (const S of ['L', 'R']) {
      const sx = S === 'L' ? 1 : -1;
      const ziel = ruecken.clone().addScaledVector(rechts, sx * 0.1);
      zweiGlied(fig, S, ziel, p, { pol: [1, -0.4, 0.1] });
    }
  },
};
