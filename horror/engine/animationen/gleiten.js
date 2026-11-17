// Gleiten: die ganze Figur rutscht ohne Schrittbewegung von ihrer Position (oder "von") nach "nach".
// Rules of Kindly F1, S12 („it follows you under the ice“): Old Knuckles liegt rücklings und gleitet unter dem
// Eis dem Fischer nach. Gehen ginge nicht: das Wesen hat keine Beingelenke, und es soll nicht laufen, sondern ziehen.
// params: nach ([x, z] | [x, y, z] | Anker, Pflicht), von ([x, z], optional; Std die aktuelle Position)
// Std-Ease ease_in_out: es zieht an und kommt weich zum Stehen (genau unter dem, dem es folgt).
export default {
  dauer: 1.5,
  ease: 'ease_in_out',
  anwenden(fig, p, params, ctx) {
    if (params.nach === undefined) throw new Error('gleiten braucht params.nach');
    const g = fig.gruppe;
    // Ziel: [x, z] wie bei "gehen" oder ein Punkt/Anker (dann zählen nur x und z, die Höhe bleibt)
    const ziel = Array.isArray(params.nach)
      ? { x: params.nach[0], z: params.nach[params.nach.length - 1] }
      : (() => { const v = ctx.zielPunkt(params.nach); return { x: v.x, z: v.z }; })();
    const von = params.von ? { x: params.von[0], z: params.von[1] } : { x: g.position.x, z: g.position.z };
    g.position.x = ctx.mischen(von.x, ziel.x, p);
    g.position.z = ctx.mischen(von.z, ziel.z, p);
  },
};
