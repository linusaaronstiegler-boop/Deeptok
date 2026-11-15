// Gehen von der aktuellen Position nach "nach" (Spec: Schritt ~0,3 s, mit Armschwung).
// params: nach ([x, z] oder Anker), von ([x, z], optional), schritt (s je Schritt, Std 0.32),
//         schwung (Grad Bein-Ausschlag, Std 28), drehen (Std true: Figur schaut in Laufrichtung).
// Empfohlenes Ease: linear (gleichmäßiges Tempo). Am Ende stehen die Beine wieder gerade.
export default {
  dauer: 1.5,
  ease: 'linear',
  anwenden(fig, p, params, ctx) {
    const g = fig.gruppe, G = fig.gelenke;
    const ziel = Array.isArray(params.nach)
      ? { x: params.nach[0], z: params.nach[params.nach.length - 1] }
      : (() => { const v = ctx.zielPunkt(params.nach); return { x: v.x, z: v.z }; })();
    const von = params.von ? { x: params.von[0], z: params.von[1] } : { x: g.position.x, z: g.position.z };
    // weiches Anfahren und Anhalten in den ersten/letzten 8 % des Weges
    const q = p < 0.08 ? (p * p) / 0.16 : p > 0.92 ? 1 - ((1 - p) * (1 - p)) / 0.16 : p - 0.04;
    const w = Math.min(1, Math.max(0, q / 0.92));
    g.position.x = ctx.mischen(von.x, ziel.x, w);
    g.position.z = ctx.mischen(von.z, ziel.z, w);
    if (params.drehen !== false && (ziel.x !== von.x || ziel.z !== von.z)) {
      const richtung = Math.atan2(ziel.x - von.x, ziel.z - von.z);
      g.rotation.y = ctx.mischeWinkel(g.rotation.y, richtung, Math.min(1, ctx.tLokal / 0.15));
    }
    // Schrittzyklus: Amplitude blendet am Anfang und Ende aus, damit die Pose sauber endet.
    const anteil = Math.min(1, ctx.tLokal / 0.12, Math.max(0, ctx.dauer - ctx.tLokal) / 0.15);
    const amp = anteil * (params.schwung ?? 28) * ctx.GRAD;
    const phase = (ctx.tLokal / (params.schritt ?? 0.32)) * Math.PI;
    const s = Math.sin(phase);
    G.beinL.rotation.x += s * amp;
    G.beinR.rotation.x -= s * amp;
    G.armL.rotation.x -= s * amp * 0.8;
    G.armR.rotation.x += s * amp * 0.8;
    if (G.huefte) G.huefte.position.y += (Math.abs(Math.cos(phase)) * 0.035 - 0.017) * anteil; // Wippen
    if (G.unterbeinL) G.unterbeinL.rotation.x += Math.max(0, -s) * amp * 1.2;
    if (G.unterbeinR) G.unterbeinR.rotation.x += Math.max(0, s) * amp * 1.2;
    // Ellbogen schwingen mit (nur Figuren mit Unterarm-Gelenk)
    if (G.unterarmL) { G.unterarmL.rotation.x -= (0.15 + Math.max(0, -s) * 0.5) * amp; G.unterarmR.rotation.x -= (0.15 + Math.max(0, s) * 0.5) * amp; }
  },
};
