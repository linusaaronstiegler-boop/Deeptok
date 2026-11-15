// Fallen (fall): erst kippen (0,2–0,3 s, Spec 2.1), dann liegen; kurzes Nachfedern beim Aufprall.
// Der Körper kippt starr um die Füße; danach liegt er (Hüfte auf Körperdicke über dem Boden).
// params: richtung ("vorn" | "hinten", Std "vorn"), kippen (Anteil der Dauer, Std 0.45)
export default {
  dauer: 0.6,
  ease: 'linear',
  anwenden(fig, p, params, ctx) {
    const G = fig.gelenke;
    const vorn = (params.richtung ?? 'vorn') !== 'hinten';
    const kipp = params.kippen ?? 0.45;
    const u = Math.min(1, p / kipp);
    const phi = (Math.PI / 2 - 0.06) * u * u; // beschleunigt wie ein fallender Stab
    const h0 = fig.huefteHoehe ?? 0.6;
    const dicke = Math.max(0.16, (fig.masse?.rumpfT ?? 0.28) * 0.7);
    let federn = 0;
    if (p > kipp && p < kipp + 0.25) federn = 0.035 * Math.sin((Math.PI * (p - kipp)) / 0.25);
    G.huefte.position.y = Math.max(h0 * Math.cos(phi), dicke) + federn;
    G.huefte.position.z = (vorn ? 1 : -1) * h0 * Math.sin(phi);
    G.huefte.rotation.x = (vorn ? 1 : -1) * phi;
    // Arme: vorn zum Abfangen nach vorn, hinten nach oben gerissen; Kopf hebt sich vom Boden
    const a = Math.min(1, p / (kipp * 0.7));
    G.armL.rotation.x = ctx.mischen(G.armL.rotation.x, vorn ? -2.6 : -2.2, a);
    G.armR.rotation.x = ctx.mischen(G.armR.rotation.x, vorn ? -2.4 : -2.0, a);
    G.armL.rotation.z = ctx.mischen(G.armL.rotation.z, 0.35, a);
    G.armR.rotation.z = ctx.mischen(G.armR.rotation.z, -0.35, a);
    if (G.kopf) G.kopf.rotation.x = ctx.mischen(G.kopf.rotation.x, vorn ? -0.55 : 0.35, a);
    if (G.unterbeinL) { G.unterbeinL.rotation.x += 0.25 * a; G.unterbeinR.rotation.x += 0.1 * a; }
  },
};
