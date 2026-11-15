// Atem anhalten (Satz 35: "Eli erstarrt am Fenster und hält den Atem an"): das Leerlauf-Atmen
// stoppt, die Schultern gehen ein wenig hoch und bleiben dort. Danach gehalten.
// params: staerke (Atemrest, Std 0), schultern (m, Std 0.025)
export default {
  dauer: 0.25,
  ease: 'ease_out',
  anwenden(fig, p, params, ctx) {
    if (fig.atemFaktor !== undefined) fig.atemFaktor = ctx.mischen(fig.atemFaktor, params.staerke ?? 0, p);
    const h = (params.schultern ?? 0.025) * p;
    fig.gelenke.armL.position.y += h;
    fig.gelenke.armR.position.y += h;
    fig.gelenke.kopf.position.y -= h * 0.4;
  },
};
