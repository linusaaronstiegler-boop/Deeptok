// Erschrecken (Spec: 0,2–0,3 s, leichtes Nachwippen): Arme hoch vor die Brust, Oberkörper zurück,
// kleiner Hüpfer. Danach bleibt die Schreckhaltung stehen.
// params: staerke (0–1.5, Std 1)
export default {
  dauer: 0.25,
  ease: 'nachwippen',
  anwenden(fig, p, params, ctx) {
    const s = params.staerke ?? 1;
    const G = fig.gelenke;
    G.armL.rotation.x = ctx.mischen(G.armL.rotation.x, -1.9 * s, p);
    G.armR.rotation.x = ctx.mischen(G.armR.rotation.x, -1.9 * s, p);
    G.armL.rotation.z = ctx.mischen(G.armL.rotation.z, -0.35 * s, p);
    G.armR.rotation.z = ctx.mischen(G.armR.rotation.z, 0.35 * s, p);
    if (G.rumpf) G.rumpf.rotation.x = ctx.mischen(G.rumpf.rotation.x, -0.18 * s, p);
    if (G.kopf) G.kopf.rotation.x = ctx.mischen(G.kopf.rotation.x, -0.12 * s, p);
    // Hüpfer nur während der Bewegung (Sinus-Bogen), nicht in der gehaltenen Pose.
    if (G.huefte) G.huefte.position.y += Math.sin(Math.min(1, ctx.roh) * Math.PI) * 0.06 * s;
  },
};
