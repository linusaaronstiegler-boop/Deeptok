// Zurückweichen (back_away): kleine Schritte rückwärts, Blick bleibt nach vorn, Hände abwehrend vor
// dem Körper, Oberkörper lehnt zurück. Danach gehalten.
// params: strecke (m nach hinten, Std 1.0) oder nach ([x, z] | Anker), schritt (s, Std 0.3), schwung (Grad, Std 20)
export default {
  dauer: 1.2,
  ease: 'linear',
  anwenden(fig, p, params, ctx) {
    const g = fig.gruppe, G = fig.gelenke;
    const w = p * p * (3 - 2 * p);
    if (params.nach !== undefined) {
      const ziel = Array.isArray(params.nach) ? { x: params.nach[0], z: params.nach[params.nach.length - 1] }
        : (() => { const v = ctx.zielPunkt(params.nach); return { x: v.x, z: v.z }; })();
      const von = { x: g.position.x, z: g.position.z };
      g.position.x = ctx.mischen(von.x, ziel.x, w);
      g.position.z = ctx.mischen(von.z, ziel.z, w);
    } else {
      const s = params.strecke ?? 1.0;
      g.position.x -= Math.sin(g.rotation.y) * s * w;
      g.position.z -= Math.cos(g.rotation.y) * s * w;
    }
    const anteil = Math.min(1, ctx.tLokal / 0.12, Math.max(0, ctx.dauer - ctx.tLokal) / 0.15);
    const amp = anteil * (params.schwung ?? 20) * ctx.GRAD;
    const phase = (ctx.tLokal / (params.schritt ?? 0.3)) * Math.PI;
    const s = Math.sin(phase);
    G.beinL.rotation.x += s * amp;
    G.beinR.rotation.x -= s * amp;
    if (G.unterbeinL) { G.unterbeinL.rotation.x += Math.max(0, s) * amp; G.unterbeinR.rotation.x += Math.max(0, -s) * amp; }
    G.huefte.position.y += (Math.abs(Math.cos(phase)) * 0.025 - 0.012) * anteil;
    // Abwehrhaltung: Arme vor, Unterarme hoch, Oberkörper zurück, Kopf leicht eingezogen
    const a = Math.min(1, ctx.roh / 0.25);
    G.armL.rotation.x = ctx.mischen(G.armL.rotation.x, -0.75, a);
    G.armR.rotation.x = ctx.mischen(G.armR.rotation.x, -0.7, a);
    if (G.unterarmL) { G.unterarmL.rotation.x = ctx.mischen(G.unterarmL.rotation.x, -1.0, a); G.unterarmR.rotation.x = ctx.mischen(G.unterarmR.rotation.x, -1.1, a); }
    G.rumpf.rotation.x -= 0.12 * a;
    if (G.kopf) G.kopf.rotation.x += 0.12 * a;
  },
};
