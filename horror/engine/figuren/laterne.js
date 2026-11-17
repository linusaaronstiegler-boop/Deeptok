// Requisite „laterne“ (Rules of Kindly F1: Odell mit Laterne am Stegende S5, Laternen auf dem Eis S30):
// Sturmlaterne mit warm leuchtendem Glas und weichem Schein (kein echtes Punktlicht: die Zahl der Lichter
// bleibt fest; Gegenlicht für den Atemdampf liefert die Steglaterne des Sets see). In Odells Hand ist sie
// Teil von figuren/odell.js (params.links/rechts "laterne").
// Ursprung = Boden (die Laterne steht) oder mit params.haengend = Bügel oben (hängt an einem Haken).
// params: an (Std true), staerke (Std 2.4), haengend (Std false)
// Animationen: aus (0,3 s: Licht geht aus), an (0,3 s), pendeln (Std 2 s: hängende Laterne schwingt aus; winkel 10°)
// Anker: glas (Mitte des Glases), mitte
import { baueLaterne } from '../src/kindly_requisiten.js';

export default async function baue(ctx, params = {}) {
  const T = ctx.THREE;
  const gruppe = new T.Group();
  const halter = new T.Group();
  gruppe.add(halter);
  const l = baueLaterne(ctx, { an: true, staerke: params.staerke });
  halter.add(l.gruppe);
  if (!params.haengend) l.gruppe.position.y = 0.315;     // steht auf der Wanne
  const grund = params.an === false ? 0 : 1;
  let licht = grund;
  return {
    gruppe, gelenke: { halter }, anker: { glas: l.anker.glas, mitte: l.anker.glas }, hoehe: 0.32,
    grundpose() { halter.rotation.set(0, 0, 0); licht = grund; },
    aktualisiere() { l.setzeLicht(licht); },
    animationen: {
      aus: { dauer: 0.3, ease: 'ease_in', anwenden(f, p) { licht *= 1 - p; } },
      an: { dauer: 0.3, ease: 'ease_out', anwenden(f, p) { licht = licht + (1 - licht) * p; } },
      pendeln: {
        dauer: 2, ease: 'linear',
        anwenden(f, p, prm, c) { halter.rotation.z += ((prm.winkel ?? 10) * c.GRAD) * Math.exp(-c.tLokal * 1.8) * Math.sin(c.tLokal * Math.PI * 2 * 0.9); },
      },
    },
  };
}
