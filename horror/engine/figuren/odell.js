// Mr. Odell (74). Glöckner, Hüter der Regel.
// Erkennungsmerkmal: runde Brille aus zwei flachen Ringen, langer brauner Mantel, leicht gebeugt.
// Farben aus serie.md: Mantel #5B4433, Haare #E6E3DC, Brille #2A2A2A, Haut #E2C2A4.
// params: groesse
import { baueKlotzfigur, skaliere } from '../src/klotzfigur.js';
import { knopfleiste, vAusschnitt } from '../src/kleidung.js';

export default async function baue(ctx, params = {}) {
  const T = ctx.THREE;
  const fig = baueKlotzfigur(ctx, {
    masse: {
      kopfB: 0.54, kopfH: 0.5, kopfT: 0.49,
      rumpfOben: 0.52, rumpfUnten: 0.46, rumpfH: 0.58, rumpfT: 0.3,
      oberarm: 0.26, unterarm: 0.22, armD: 0.14, hand: [0.075, 0.15, 0.115],
      oberschenkel: 0.24, unterschenkel: 0.21, beinD: 0.155, beinAbstand: 0.2,
      schuh: { b: 0.16, h: 0.1, l: 0.3 },
    },
    farben: {
      haut: '#E2C2A4', oberteil: '#5B4433', buendchen: '#4A372A', hose: '#3A3A3E',
      schuh: '#1E1E20', sohle: '#151516', iris: '#4a5a6a', brauen: '#d9d6cf',
    },
    schuh: { art: 'halbschuh' },
    haltung: { rumpf: 0.14, kopf: -0.06 },
    gesicht: { augenAbstand: 0.19, augenHoehe: 0.5, mundHoehe: 0.77, falten: true, augenGroesse: 0.85 },
    vorne: (g, w, h) => {
      vAusschnitt(g, w, h, '#d9d4c8', 0.3);
      knopfleiste(g, w, h, { farbe: '#2b2018', anzahl: 3, von: 0.42, bis: 0.86, x: 0.52 });
    },
    schmuck: ({ gelenke, masse: m, mat, rundeKiste }) => {
      const k = gelenke.kopf;
      const haar = mat('#E6E3DC', { rauheit: 0.9 });
      // Weißer Haarkranz: hinten und an den Seiten, oben kahl
      const hinten = rundeKiste(m.kopfB + 0.03, 0.2, 0.08, haar, 0.035);
      hinten.position.set(0, m.kopfH * 0.55, -m.kopfT / 2 + 0.01);
      k.add(hinten);
      for (const sx of [-1, 1]) {
        const seite = rundeKiste(0.06, 0.16, m.kopfT * 0.55, haar, 0.03);
        seite.position.set(sx * (m.kopfB / 2 + 0.01), m.kopfH * 0.58, -0.08);
        k.add(seite);
      }
      // Runde Brille: zwei flache Ringe und ein Steg vor den Augen
      const brille = mat('#2A2A2A', { rauheit: 0.4, metall: 0.3 });
      const ring = new T.TorusGeometry(0.058, 0.009, 6, 20);
      for (const sx of [-1, 1]) {
        const r = new T.Mesh(ring, brille);
        r.position.set(sx * (m.kopfB - m.kopfRund * 1.6) * 0.19, m.kopfH * 0.5, m.kopfT / 2 + 0.015);
        k.add(r);
        const buegel = rundeKiste(0.012, 0.012, m.kopfT * 0.5, brille, 0.004, false);
        buegel.position.set(sx * (m.kopfB / 2 + 0.006), m.kopfH * 0.52, m.kopfT * 0.22);
        k.add(buegel);
      }
      const steg = rundeKiste(0.05, 0.012, 0.012, brille, 0.004, false);
      steg.position.set(0, m.kopfH * 0.52, m.kopfT / 2 + 0.015);
      k.add(steg);
      // Langer Mantel: Schöße auf den Oberschenkeln (gehen mit den Beinen mit) und Kragen
      const mantel = mat('#5B4433', { rauheit: 0.9 });
      for (const [bein, sx] of [[gelenke.beinL, 1], [gelenke.beinR, -1]]) {
        const schoss = rundeKiste(m.beinD + 0.1, m.oberschenkel + 0.12, m.rumpfT * 0.96, mantel, 0.03);
        schoss.position.set(sx * 0.03, -m.oberschenkel / 2 - 0.02, 0);
        bein.add(schoss);
      }
      const huefteMantel = rundeKiste(m.beckenB + 0.08, m.beckenH + 0.04, m.rumpfT * 0.98, mantel, 0.03);
      huefteMantel.position.y = m.beckenH / 2 - 0.05;
      gelenke.huefte.add(huefteMantel);
      const kragen = rundeKiste(m.rumpfOben * 0.85, 0.09, m.rumpfT * 0.95, mat('#4A372A'), 0.03);
      kragen.position.set(0, m.rumpfH - 0.01, -0.01);
      gelenke.rumpf.add(kragen);
      return {};
    },
  });
  return skaliere(fig, params.groesse);
}
