// Requisite „brille_hand“ (Rules of Kindly F1, Bibel §3.3, §10.7): Odells Brille für Inserts und Details, ohne
// Odell. Klare Gläser, die weiß beschlagen oder klar bleiben. In Odells Hand ist dieselbe Brille Teil von
// figuren/odell.js (params.brille "hand"); diese Requisite ist für Einstellungen, in denen nur die Gläser im
// Bild sind (S38: Detail, die Gläser bleiben klar), oder für eine Hand-Attrappe am Bildrand.
// Ursprung = Mitte zwischen den Gläsern, Gläser schauen nach +z (Kamera davor stellen), Bügel nach −z.
// params: beschlag (Std 0: Anfangszustand 0..1), hand (Std true: Fäustlings-Hand und Mantelärmel halten die
//         Brille am rechten Bügel, wie bei Odell), aufrecht (Std true)
// Animationen:
//   beschlagen  0,35 s  Gläser beschlagen weiß (staerke Std 1)
//   bleibt_klar 0,8 s   klar bleiben: leichtes Kippen, ein Glanz läuft über das Glas
//   abwischen   1,2 s   Beschlag verschwindet mit kleinen Kreisen (die Brille wackelt mit)
//   aufsetzen   0,6 s   Brille hebt sich nach oben aus dem Bild (für Inserts: sie geht zur Nase)
// Anker: mitte, glas_l, glas_r
import { baueBrille, BRILLE } from '../src/kindly_requisiten.js';
import { rundeKiste } from '../src/klotzfigur.js';

export default async function baue(ctx, params = {}) {
  const T = ctx.THREE;
  const gruppe = new T.Group();
  const halter = new T.Group();
  gruppe.add(halter);
  const b = baueBrille(ctx, { glas: 'klar', buegel: 'offen' });
  halter.add(b.gruppe);
  if (params.hand !== false) {
    // Odells Hand: Fäustling in Hautfarbe am rechten Bügel, darüber der braune Mantelärmel
    const haut = ctx.mat('#E2C2A4', { rauheit: 0.68, kante: { farbe: '#d6deff', staerke: 0.2, exponent: 3 } });
    const mantel = ctx.mat('#5B4433', { rauheit: 0.9, kante: { farbe: '#d6deff', staerke: 0.2, exponent: 3 } });
    const hand = rundeKiste(0.075, 0.15, 0.115, haut, 0.03);
    hand.position.set(-(BRILLE.abstand / 2 + BRILLE.r + 0.04), -0.05, -0.05);
    hand.rotation.z = -0.25;
    halter.add(hand);
    const daumen = rundeKiste(0.054, 0.08, 0.054, haut, 0.02);
    daumen.position.set(-(BRILLE.abstand / 2 + BRILLE.r + 0.005), -0.02, 0.0);
    halter.add(daumen);
    const aermel = rundeKiste(0.15, 0.3, 0.15, mantel, 0.035);
    aermel.position.set(-(BRILLE.abstand / 2 + BRILLE.r + 0.1), -0.25, -0.1);
    aermel.rotation.z = -0.35;
    halter.add(aermel);
  }
  const anker = { mitte: new T.Object3D(), glas_l: new T.Object3D(), glas_r: new T.Object3D() };
  anker.glas_l.position.x = BRILLE.abstand / 2;
  anker.glas_r.position.x = -BRILLE.abstand / 2;
  for (const a of Object.values(anker)) halter.add(a);
  const z = { beschlag: params.beschlag ?? 0, glanz: 0.35 };
  const anwendenZustand = () => { b.setzeBeschlag(z.beschlag); b.setzeGlanz(z.glanz); };
  return {
    gruppe, gelenke: { halter }, anker, hoehe: 0.15,
    grundpose() {
      halter.position.set(0, 0, 0); halter.rotation.set(0, 0, 0);
      z.beschlag = params.beschlag ?? 0; z.glanz = 0.35;
    },
    aktualisiere() { anwendenZustand(); },
    animationen: {
      beschlagen: { dauer: 0.35, ease: 'ease_out', anwenden(f, p, prm, c) { z.beschlag = c.mischen(z.beschlag, prm.staerke ?? 1, p); } },
      bleibt_klar: {
        dauer: 0.8, ease: 'linear',
        anwenden(f, p, prm, c) {
          z.beschlag = 0;
          halter.rotation.x += 0.28 * Math.sin(Math.PI * Math.min(1, c.roh * 1.25));
          // glanz (Std 0,65): Höhe des Glanzes, der übers Glas läuft. Review Kindly F1: klein halten, sonst lesen sich
          // klare Gläser in Feed-Größe wie beschlagene
          z.glanz = (prm.glanz !== undefined ? prm.glanz * 0.5 : 0.35) + (prm.glanz ?? 0.65) * Math.sin(Math.PI * c.roh);
        },
      },
      abwischen: {
        dauer: 1.2, ease: 'linear',
        anwenden(f, p, prm, c) {
          const w = c.tLokal * Math.PI * 2 * 3, an = c.roh > 0.1 && c.roh < 0.85 ? 1 : 0;
          halter.position.x += Math.cos(w) * 0.012 * an;
          halter.position.y += Math.sin(w) * 0.012 * an;
          z.beschlag *= 1 - Math.min(1, Math.max(0, (c.roh - 0.1) / 0.6));
        },
      },
      aufsetzen: { dauer: 0.6, ease: 'ease_in', anwenden(f, p) { halter.position.y += 0.5 * p; halter.rotation.x -= 0.4 * p; } },
    },
  };
}
