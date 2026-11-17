// Mrs. Lund (61), Rules of Kindly Folge 1: Sie führt die Kopie ihres Mannes selbst zurück aufs Eis (S21, M6:
// Vertrautes kippt). Ihr Atem dampft, seiner nicht.
// Erkennungsmerkmal (Bibel §10.2): grauer Dutt, dunkelgrüner langer Mantel, cremefarbener Strickschal.
// Gesichter: ernst, gefasst und der Hausstil-Satz.
// params: groesse (Std 1), Atemdampf (src/atemdampf.js)
import { baueKlotzfigur, skaliere, musterTextur } from '../src/klotzfigur.js';
import { knopfleiste } from '../src/kleidung.js';
import { schoesse } from '../src/kindly_kleidung.js';
import { dampfFuerFigur } from '../src/atemdampf.js';

export const FARBEN = { mantel: '#3A5E48', mantelDunkel: '#2E4C3A', haut: '#EBCBAE', haar: '#B9B5AE', schal: '#E2D9C6' };

export default async function baue(ctx, params = {}) {
  const F = FARBEN;
  const fig = baueKlotzfigur(ctx, {
    masse: {
      kopfB: 0.52, kopfH: 0.5, kopfT: 0.47, kopfRund: 0.095,
      rumpfOben: 0.5, rumpfUnten: 0.44, rumpfH: 0.52, rumpfT: 0.27,
      beckenB: 0.44,
      oberarm: 0.24, unterarm: 0.2, armD: 0.13, hand: [0.07, 0.14, 0.11],
      oberschenkel: 0.23, unterschenkel: 0.19, beinD: 0.15, beinAbstand: 0.19,
      schuh: { b: 0.155, h: 0.11, l: 0.29 },
    },
    farben: {
      haut: F.haut, oberteil: F.mantel, buendchen: F.mantelDunkel, hose: '#3b3a3c',
      schuh: '#3a2c26', sohle: '#221a16', iris: '#4a5a4a', brauen: '#a8a39b',
    },
    schuh: { art: 'stiefel', kante: '#2a201b' },
    haltung: { rumpf: 0.04 },
    gesicht: { augenAbstand: 0.19, augenHoehe: 0.5, mundHoehe: 0.78, falten: true, augenGroesse: 0.92, wangen: '#d99a8a' },
    vorne: (g, w, h) => knopfleiste(g, w, h, { farbe: '#16231b', anzahl: 4, von: 0.3, bis: 0.92, x: 0.54 }),
    schmuck: (teile) => {
      const { gelenke, masse: m, mat, rundeKiste } = teile;
      const k = gelenke.kopf;
      const haar = mat(F.haar, { rauheit: 0.85, kante: { farbe: '#ffffff', staerke: 0.3, exponent: 2.5 } });
      // glatt zurückgekämmtes graues Haar und ein runder Dutt am Hinterkopf (Erkennungsmerkmal im Profil)
      const kappe = rundeKiste(m.kopfB + 0.03, 0.11, m.kopfT + 0.03, haar, 0.05);
      kappe.position.set(0, m.kopfH - 0.03, -0.01);
      k.add(kappe);
      const hinten = rundeKiste(m.kopfB + 0.025, m.kopfH * 0.55, 0.09, haar, 0.04);
      hinten.position.set(0, m.kopfH * 0.66, -m.kopfT / 2 + 0.025);
      k.add(hinten);
      for (const sx of [-1, 1]) {
        const seite = rundeKiste(0.045, 0.18, m.kopfT * 0.6, haar, 0.02);
        seite.position.set(sx * (m.kopfB / 2 + 0.006), m.kopfH * 0.74, -0.05);
        k.add(seite);
      }
      const dutt = rundeKiste(0.2, 0.17, 0.15, haar, 0.07);
      dutt.position.set(0, m.kopfH * 0.82, -m.kopfT / 2 - 0.09);
      k.add(dutt);
      // Strickschal, zweimal geschlungen
      const strick = ctx.mat(F.schal, { rauheit: 0.95, karte: musterTextur(ctx, 'strick') });
      const ring = rundeKiste(m.rumpfOben * 0.66, 0.12, m.rumpfT * 1.05, strick, 0.05);
      ring.position.set(0, m.rumpfH + 0.02, 0);
      gelenke.rumpf.add(ring);
      const ende = rundeKiste(0.12, 0.3, 0.05, strick, 0.02);
      ende.position.set(-m.rumpfOben * 0.18, m.rumpfH - 0.18, m.rumpfT / 2 + 0.03);
      gelenke.rumpf.add(ende);
      schoesse(teile, mat(F.mantel, { rauheit: 0.9 }), { laenge: 1.15, dicke: 1.1 });
      return {};
    },
  });
  dampfFuerFigur(ctx, fig, params);
  return skaliere(fig, params.groesse);
}
