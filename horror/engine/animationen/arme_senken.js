// Arme senken: beide Arme gehen aus jeder Haltung zurück in die Ruhe neben dem Körper
// (Satz 17: die ältere Frau reißt dem jungen Mann die Hände vom Gesicht). Spec 2.1: 0,1–0,4 s.
// Funktioniert nach IK-Posen (augen_zuhalten, mund_zuhalten), weil es die Gelenk-Drehungen als
// Ganzes (Quaternion) zur Ruhe mischt.
// params: seite ("beide" | "l" | "r", Std "beide")
export default {
  dauer: 0.3,
  ease: 'ease_out',
  anwenden(fig, p, params, ctx) {
    const G = fig.gelenke;
    const ruhe = fig.masse?.armRuhe ?? 0.07;
    const seiten = (params.seite ?? 'beide') === 'beide' ? ['L', 'R'] : [params.seite.toUpperCase()];
    const ziel = new ctx.THREE.Quaternion();
    const euler = new ctx.THREE.Euler();
    for (const S of seiten) {
      const arm = G[`arm${S}`];
      if (arm) {
        euler.set(0, 0, S === 'L' ? ruhe : -ruhe);
        arm.quaternion.slerp(ziel.setFromEuler(euler), p);
      }
      for (const n of [`unterarm${S}`, `hand${S}`]) if (G[n]) G[n].quaternion.slerp(ziel.identity(), p);
    }
  },
};
