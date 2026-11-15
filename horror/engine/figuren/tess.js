// Tess Lowry (18, Geburtstag in derselben Nacht). Spiegelfigur für Teil 2 und 3.
// Erkennungsmerkmal: kurzer, weiß gebleichter Bob, lila Bomberjacke, lila High-Tops.
// Farben aus serie.md: Jacke #6B4C9A, Haare #EDEDED, Hose #24252A, Schuhe #7E5BB5, Haut #B88462.
// params: groesse
import { baueKlotzfigur, skaliere } from '../src/klotzfigur.js';
import { reissverschluss, saum, tasche } from '../src/kleidung.js';

export default async function baue(ctx, params = {}) {
  const fig = baueKlotzfigur(ctx, {
    masse: {
      kopfB: 0.53, kopfH: 0.5, kopfT: 0.48,
      rumpfOben: 0.52, rumpfUnten: 0.42, rumpfH: 0.5, rumpfT: 0.28,
      oberarm: 0.24, unterarm: 0.21, armD: 0.14, hand: [0.072, 0.14, 0.11],
      oberschenkel: 0.24, unterschenkel: 0.2, beinD: 0.15, beinAbstand: 0.2,
      schuh: { b: 0.16, h: 0.12, l: 0.3 },
    },
    farben: {
      haut: '#B88462', oberteil: '#6B4C9A', buendchen: '#4E3672', hose: '#24252A',
      schuh: '#7E5BB5', sohle: '#F2F0EA', senkel: '#F2F0EA', iris: '#2a1a12', brauen: '#d8d8d4',
    },
    schuh: { art: 'hightop' },
    gesicht: { augenAbstand: 0.19, augenHoehe: 0.5, mundHoehe: 0.78 },
    vorne: (g, w, h, rand) => {
      reissverschluss(g, w, h, { von: 0.1, bis: 0.88, farbe: '#d8c58a' });
      tasche(g, w, h, w * 0.18, h * 0.55, w * 0.16, h * 0.2, { schraeg: true });
      tasche(g, w, h, w * 0.66, h * 0.55, w * 0.16, h * 0.2, { schraeg: true });
      saum(g, w, h, rand, { farbe: 'rgba(30,10,50,0.45)', hoehe: 0.12 });
    },
    hinten: (g, w, h, rand) => saum(g, w, h, rand, { farbe: 'rgba(30,10,50,0.45)', hoehe: 0.12 }),
    schmuck: ({ gelenke, masse: m, mat, rundeKiste }) => {
      const k = gelenke.kopf;
      const haar = mat('#EDEDED', { rauheit: 0.8 });
      // Bob aus zwei Klötzen: Haube und Kinnlänge mit gerader Kante
      const haube = rundeKiste(m.kopfB + 0.06, 0.16, m.kopfT + 0.05, haar, 0.06);
      haube.position.set(0, m.kopfH - 0.04, -0.01);
      k.add(haube);
      const bob = rundeKiste(m.kopfB + 0.07, m.kopfH * 0.62, m.kopfT * 0.72, haar, 0.04);
      bob.position.set(0, m.kopfH * 0.55, -m.kopfT * 0.16);
      k.add(bob);
      const pony = rundeKiste(m.kopfB * 0.8, 0.07, 0.07, haar, 0.03);
      pony.position.set(-0.04, m.kopfH - 0.09, m.kopfT / 2 - 0.01);
      k.add(pony);
      // Rippkragen der Bomberjacke
      const kragen = rundeKiste(m.rumpfOben * 0.62, 0.06, m.rumpfT * 0.9, mat('#4E3672'), 0.02);
      kragen.position.set(0, m.rumpfH + 0.005, 0);
      gelenke.rumpf.add(kragen);
      return {};
    },
  });
  return skaliere(fig, params.groesse);
}
