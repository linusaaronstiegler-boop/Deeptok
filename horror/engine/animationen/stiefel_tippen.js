// Stiefel tippt dreimal aufs Eis (Rules of Kindly F1: S1 der Fischer, S30 Bear „I tapped three times, like Gus“).
// Der Fuß hebt sich etwas nach vorn (Knie beugt) und stößt wieder auf, n-mal; am Ende steht er wie vorher.
// params: seite ("r" | "l", Std "r"), schlaege (Std 3), hoehe (Std 1 = etwa 7 cm Fußhub)
// Aufprall k (0, 1, 2) beim Fortschritt (k + 0,75) / schlaege (bei 1,2 s: 0,30 / 0,70 / 1,10 s nach dem Start).
export default {
  dauer: 1.2,
  ease: 'linear',
  anwenden(fig, p, params, ctx) {
    const G = fig.gelenke;
    const S = (params.seite ?? 'r').toUpperCase();
    const n = params.schlaege ?? 3;
    const x = Math.min(0.9999, ctx.roh) * n;
    const f = x - Math.floor(x);
    // anheben (0–60 %), aufstoßen (60–75 %), stehen (75–100 %)
    const h = (params.hoehe ?? 1) * (f < 0.6 ? Math.sin((Math.PI / 2) * (f / 0.6)) : f < 0.75 ? Math.cos((Math.PI / 2) * ((f - 0.6) / 0.15)) : 0);
    G[`bein${S}`].rotation.x -= 0.2 * h;
    if (G[`unterbein${S}`]) G[`unterbein${S}`].rotation.x += 0.42 * h;
    if (G[`fuss${S}`]) G[`fuss${S}`].rotation.x -= 0.12 * h;
    G.rumpf.rotation.x += 0.03 * h;
    G.kopf.rotation.x += 0.12;            // schaut dabei aufs Eis
  },
};
