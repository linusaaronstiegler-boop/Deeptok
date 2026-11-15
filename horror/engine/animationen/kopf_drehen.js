// Kopf drehen (Spec: 0,2 s, Beginn auf dem Verb). Monster: 0,2–0,7 s mit ease_in.
// params: winkel (Grad, + = zur linken Seite der Figur), nicken (Grad, + = nach unten),
//         zu ("kamera" | Anker | [x,y,z]) – dreht den Kopf zu diesem Punkt (begrenzt auf ±80°).
export default {
  dauer: 0.2,
  ease: 'ease_in_out',
  anwenden(fig, p, params, ctx) {
    const kopf = fig.gelenke.kopf;
    let gier = (params.winkel ?? 0) * ctx.GRAD;
    let nick = (params.nicken ?? 0) * ctx.GRAD;
    if (params.zu !== undefined) {
      // Zielrichtung im Koordinatensystem der Figur (Wurzel): atan2(x, z), da die Figur nach +z schaut.
      const ziel = ctx.zielPunkt(params.zu);
      const kopfPos = kopf.getWorldPosition(new ctx.THREE.Vector3());
      const d = ziel.clone().sub(kopfPos);
      gier = Math.atan2(d.x, d.z) - fig.gruppe.rotation.y;
      while (gier > Math.PI) gier -= 2 * Math.PI;
      while (gier < -Math.PI) gier += 2 * Math.PI;
      gier = Math.max(-80 * ctx.GRAD, Math.min(80 * ctx.GRAD, gier));
      if (params.nicken === undefined) nick = -Math.atan2(d.y, Math.hypot(d.x, d.z));
    }
    kopf.rotation.y = ctx.mischen(kopf.rotation.y, gier, p);
    kopf.rotation.x = ctx.mischen(kopf.rotation.x, nick, p);
  },
};
