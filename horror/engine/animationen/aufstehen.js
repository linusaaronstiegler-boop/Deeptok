// Aufstehen (stand_up) aus dem Sitzen (Spec 2.1: Hinsetzen/Aufstehen 0,5–1,2 s).
// Von der aktuellen Pose (z. B. "pose": "sitzen") zum Stehen: Oberkörper lehnt in der Mitte vor,
// die Arme stützen ab, die Hüfte wandert über die Füße (Figur steht danach vor dem Stuhl).
// params: vor (m, wie weit die Hüfte nach vorn wandert; Std = Oberschenkellänge)
export default {
  dauer: 0.8,
  ease: 'ease_in_out',
  anwenden(fig, p, params, ctx) {
    const G = fig.gelenke;
    for (const n of ['beinL', 'beinR', 'unterbeinL', 'unterbeinR']) if (G[n]) G[n].rotation.x = ctx.mischen(G[n].rotation.x, 0, p);
    if (fig.huefteHoehe) G.huefte.position.y = ctx.mischen(G.huefte.position.y, fig.huefteHoehe, p);
    const vor = params.vor ?? fig.glieder?.bein?.[0] ?? 0.3;
    G.huefte.position.z += vor * p;
    const bogen = Math.sin(Math.PI * p);
    G.rumpf.rotation.x += 0.5 * bogen;
    if (G.kopf) G.kopf.rotation.x -= 0.25 * bogen;
    for (const n of ['armL', 'armR']) G[n].rotation.x = ctx.mischen(G[n].rotation.x, 0, p) - 0.35 * bogen;
  },
};
