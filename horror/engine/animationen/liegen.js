// Liegen (Pose): Figur liegt auf dem Rücken, Gesicht nach oben (Satz 26: June im Bett).
// Die Figur dreht sich um ihre Füße um −90° um die x-Achse: der Kopf zeigt danach in die Richtung,
// in die sie vorher mit dem Rücken stand (lokal −z), das Gesicht nach oben. Die Position der Figur
// ist also die Stelle der Füße; y = Matratzenhöhe + halbe Rumpftiefe (params.anheben).
// params: anheben (m, Std 0.16), kopf (Grad, Kopf zur Seite drehen, Std 0)
export default {
  dauer: 0.6,
  ease: 'ease_in_out',
  anwenden(fig, p, params, ctx) {
    const g = fig.gruppe;
    // Erst um die eigene Querachse kippen, dann gieren (Reihenfolge YXZ), sonst kippt die Figur
    // bei blick ≠ 0 um die Welt-x-Achse und liegt schief.
    g.rotation.order = 'YXZ';
    g.rotation.x = ctx.mischen(g.rotation.x, -Math.PI / 2, p);
    g.position.y += (params.anheben ?? 0.16) * p;
    const G = fig.gelenke;
    // Arme liegen neben dem Körper, Kopf entspannt
    if (G.armL) G.armL.rotation.z = ctx.mischen(G.armL.rotation.z, 0.12, p);
    if (G.armR) G.armR.rotation.z = ctx.mischen(G.armR.rotation.z, -0.12, p);
    if (params.kopf) G.kopf.rotation.y += params.kopf * ctx.GRAD * p;
  },
};
