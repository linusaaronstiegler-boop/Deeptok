// Leerlauf-Atmen einstellen (idle_atmen). Das Atmen selbst macht die Figur in jedem Bild
// (Spec 1.8: an, 0,15–0,5 % der Bildbreite). Abschaltbar auf drei Wegen:
//   - für eine Figur in der ganzen Episode: "atmen": false (Stärke: "atmen_staerke")
//   - ab einem Zeitpunkt: Aktion { "was": "idle_atmen", "params": { "staerke": 0 } } (wieder an: staerke 1)
//   - Atem anhalten mit Schultern: Aktion "atem_anhalten"
// params: staerke (0 = aus, 1 = normal, 2 = schwer atmen; Std 1)
export default {
  dauer: 0.3,
  ease: 'ease_in_out',
  anwenden(fig, p, params, ctx) {
    if (fig.atemFaktor === undefined) return; // Figuren ohne einstellbares Atmen
    fig.atemFaktor = ctx.mischen(fig.atemFaktor, params.staerke ?? 1, p);
  },
};
