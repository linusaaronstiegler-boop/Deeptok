// Arm heben / Zeigen / Geste (Spec: 0,1–0,4 s, dann halten).
// params: seite ("r" | "l", Std "r"), vorn (Grad nach vorn, Std 90 = waagerecht),
//         seitlich (Grad nach außen, Std 0), zu (Anker/[x,y,z]/"kamera": zeigt dorthin).
// Konvention Standard-Rig: Arm hängt entlang −y; rotation.x negativ = nach vorn,
// rotation.z positiv = linker Arm nach außen (rechter Arm: negativ).
export default {
  dauer: 0.25,
  ease: 'ease_out',
  anwenden(fig, p, params, ctx) {
    const rechts = (params.seite ?? 'r') === 'r';
    const arm = rechts ? fig.gelenke.armR : fig.gelenke.armL;
    let zielX = -(params.vorn ?? 90) * ctx.GRAD;
    let zielZ = (rechts ? -1 : 1) * (params.seitlich ?? 0) * ctx.GRAD;
    if (params.zu !== undefined) {
      // Richtung Schulter -> Ziel in Figur-Koordinaten. Für Euler XYZ gilt:
      // Arm (0,-1,0) -> (sin z, -cos z·cos x, -cos z·sin x), also z = asin(d.x), x = atan2(-d.z, -d.y).
      const ziel = ctx.zielPunkt(params.zu);
      const schulter = arm.getWorldPosition(new ctx.THREE.Vector3());
      const d = ziel.sub(schulter).applyAxisAngle(new ctx.THREE.Vector3(0, 1, 0), -fig.gruppe.rotation.y).normalize();
      zielZ = Math.asin(Math.max(-1, Math.min(1, d.x)));
      zielX = Math.atan2(-d.z, -d.y);
    }
    arm.rotation.x = ctx.mischen(arm.rotation.x, zielX, p);
    arm.rotation.z = ctx.mischen(arm.rotation.z, zielZ, p);
  },
};
