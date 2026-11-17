// Requisite „handglocke“ (Rules of Kindly, Bibel §4: Odells Erkennungslaut, F1 S5): Messingglocke mit Holzgriff
// für Inserts ohne Odell; in Odells Hand ist sie Teil von figuren/odell.js (params.links/rechts "glocke").
// Ursprung = Mitte des Griffs, Glocke hängt nach −y. params: hand (Std false: Fäustling und Ärmel am Griff)
// Animation: laeuten 1,6 s – ein Schlag (Ruck nach oben bei 0,15 s), danach kleines, gedämpftes Pendeln.
// Anker: mitte (Glocke), griff
import { baueGlocke, glockenPendel } from '../src/kindly_requisiten.js';
import { rundeKiste } from '../src/klotzfigur.js';

export default async function baue(ctx, params = {}) {
  const T = ctx.THREE;
  const gruppe = new T.Group();
  const halter = new T.Group();
  gruppe.add(halter);
  const g = baueGlocke(ctx);
  halter.add(g.gruppe);
  if (params.hand) {
    const haut = ctx.mat('#E2C2A4', { rauheit: 0.68 });
    const faust = rundeKiste(0.09, 0.11, 0.115, haut, 0.03);
    faust.position.set(0, 0.0, 0);
    halter.add(faust);
    const aermel = rundeKiste(0.15, 0.3, 0.15, ctx.mat('#5B4433', { rauheit: 0.9 }), 0.035);
    aermel.position.set(0, 0.2, -0.02);
    halter.add(aermel);
  }
  const griff = new T.Object3D(); halter.add(griff);
  let schlag = null;
  return {
    gruppe, gelenke: { halter }, anker: { mitte: g.anker, griff }, hoehe: 0.2,
    grundpose() { halter.position.set(0, 0, 0); halter.rotation.set(0, 0, 0); g.pendel.rotation.set(0, 0, 0); g.kloeppel.rotation.set(0, 0, 0); schlag = null; },
    aktualisiere(t) {
      if (schlag === null) return;
      const p = glockenPendel(t - schlag);
      g.pendel.rotation.x = p.glocke;
      g.kloeppel.rotation.x = p.kloeppel;
    },
    animationen: {
      laeuten: {
        dauer: 1.6, ease: 'linear',
        anwenden(f, p, prm, c) {
          const u = c.tLokal;
          const ruck = u > 0.05 && u < 0.25 ? Math.sin(Math.PI * (u - 0.05) / 0.2) : 0;
          halter.position.y += 0.05 * ruck;
          if (u >= 0.15) schlag = c.t - (u - 0.15);
        },
      },
    },
  };
}
