// Atemdampf einer Figur für eine Einstellung schalten (Rules of Kindly, src/atemdampf.js).
// params: wert (false = ab dem Start sofort kein Dampf, true = wieder an), staerke (Deckkraft-Faktor),
//         hell (Helligkeits-Faktor). Wirkt bis zum nächsten Neuanfang der Figur (stellung.neu am Schnitt).
// Für "ab jetzt für immer aus" (die Kopie) besser figuren[].params.dampf_aus_ab: das überlebt jeden Schnitt.
export default {
  dauer: 0,
  ease: 'linear',
  anwenden(fig, p, params) {
    if (!fig.dampf || p <= 0) return;
    const z = fig.dampf.zustand;
    if (params.wert !== undefined) z.wert = params.wert !== false;
    if (params.staerke !== undefined) z.staerke = params.staerke;
    if (params.hell !== undefined) z.hell = params.hell;
  },
};
