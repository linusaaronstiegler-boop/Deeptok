// Pose Sitzen (als "pose" in der Figur/Stellung oder als Aktion "hinsetzen" mit 0,5–1,2 s).
// params: sitzhoehe (m, Std: fig.sitzhoehe der Figur, sonst 0.45). Ohne Kniegelenk: Beine waagerecht nach vorn.
export default {
  dauer: 0.8,
  ease: 'ease_in_out',
  anwenden(fig, p, params, ctx) {
    const G = fig.gelenke;
    const knie = !!G.unterbeinL;
    G.beinL.rotation.x = ctx.mischen(G.beinL.rotation.x, -Math.PI / 2, p);
    G.beinR.rotation.x = ctx.mischen(G.beinR.rotation.x, -Math.PI / 2, p);
    if (knie) {
      G.unterbeinL.rotation.x = ctx.mischen(G.unterbeinL.rotation.x, Math.PI / 2, p);
      G.unterbeinR.rotation.x = ctx.mischen(G.unterbeinR.rotation.x, Math.PI / 2, p);
    }
    if (G.huefte && fig.huefteHoehe) {
      const ziel = (params.sitzhoehe ?? fig.sitzhoehe ?? 0.45) + (fig.beinDicke ?? 0.1) / 2;
      G.huefte.position.y = ctx.mischen(G.huefte.position.y, ziel, p);
    }
    G.armL.rotation.x = ctx.mischen(G.armL.rotation.x, -0.35, p);
    G.armR.rotation.x = ctx.mischen(G.armR.rotation.x, -0.35, p);
  },
};
