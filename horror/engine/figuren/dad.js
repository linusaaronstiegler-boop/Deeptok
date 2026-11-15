// Tom Marsh, "Dad" (48, nur Rückblende). Versteckte June vor sechs Jahren in der Bodenluke.
// Erkennungsmerkmal: marineblaue Arbeitsjacke mit zwei hellen Reflexstreifen, braune Arbeitsstiefel
// (die Stiefel sind Requisit der Handlung: Satz 25 "Dad's shoes were on the porch").
// Farben aus serie.md: Jacke #2F3E5C, Streifen #C8CCD0, Mütze #6E7277, Stiefel #6B4A2B, Haut #D9B391.
// params: groesse
import { baueKlotzfigur, skaliere, musterTextur } from '../src/klotzfigur.js';
import { reissverschluss, querstreifen, tasche, saum } from '../src/kleidung.js';

export default async function baue(ctx, params = {}) {
  const fig = baueKlotzfigur(ctx, {
    masse: {
      kopfB: 0.58, kopfH: 0.54, kopfT: 0.52,
      rumpfOben: 0.64, rumpfUnten: 0.54, rumpfH: 0.6, rumpfT: 0.33,
      beckenB: 0.52,
      oberarm: 0.27, unterarm: 0.23, armD: 0.155, hand: [0.085, 0.16, 0.13],
      oberschenkel: 0.25, unterschenkel: 0.22, beinD: 0.18, beinAbstand: 0.25,
      schuh: { b: 0.19, h: 0.13, l: 0.34 },
    },
    farben: {
      haut: '#D9B391', oberteil: '#2F3E5C', buendchen: '#253250', hose: '#4A4B4D',
      schuh: '#6B4A2B', sohle: '#3A2A1C', senkel: '#C9A46A', iris: '#3a2a20', brauen: '#4a3424',
    },
    schuh: { art: 'stiefel', kante: '#5A3D22' },
    gesicht: { augenAbstand: 0.19, augenHoehe: 0.47, mundHoehe: 0.68, falten: true, augenGroesse: 0.92 },
    vorne: (g, w, h, rand) => {
      reissverschluss(g, w, h, { von: 0.12, bis: 0.92 });
      querstreifen(g, w, h, rand, 0.38, 0.07, '#C8CCD0');
      querstreifen(g, w, h, rand, 0.62, 0.07, '#C8CCD0');
      tasche(g, w, h, w * 0.14, h * 0.12, w * 0.22, h * 0.16);
      saum(g, w, h, rand, { hoehe: 0.07 });
    },
    hinten: (g, w, h, rand) => { querstreifen(g, w, h, rand, 0.38, 0.07, '#C8CCD0'); querstreifen(g, w, h, rand, 0.62, 0.07, '#C8CCD0'); },
    schmuck: ({ gelenke, masse: m, mat, rundeKiste }) => {
      const k = gelenke.kopf;
      // Graue Strickmütze mit Umschlag
      const mm = ctx.mat('#6E7277', { rauheit: 0.95, karte: musterTextur(ctx, 'strick') });
      const muetze = rundeKiste(m.kopfB + 0.04, 0.2, m.kopfT + 0.04, mm, 0.07);
      muetze.position.set(0, m.kopfH - 0.02, 0);
      k.add(muetze);
      const umschlag = rundeKiste(m.kopfB + 0.06, 0.08, m.kopfT + 0.06, ctx.mat('#62666B', { rauheit: 0.95, karte: musterTextur(ctx, 'rippen') }), 0.03);
      umschlag.position.set(0, m.kopfH - 0.09, 0);
      k.add(umschlag);
      // Eckiger Bartklotz am Kinn (Mund bleibt darüber sichtbar)
      const bart = mat('#5a3e2a', { rauheit: 0.95 });
      const kinn = rundeKiste(m.kopfB * 0.78, 0.13, 0.08, bart, 0.03);
      kinn.position.set(0, 0.075, m.kopfT / 2 + 0.01);
      k.add(kinn);
      for (const sx of [-1, 1]) {
        const backe = rundeKiste(0.08, 0.24, m.kopfT * 0.6, bart, 0.03);
        backe.position.set(sx * (m.kopfB / 2 - 0.01), 0.15, 0.06);
        k.add(backe);
      }
      // Reflexstreifen an den Oberarmen
      for (const arm of [gelenke.armL, gelenke.armR]) {
        const st = rundeKiste(m.armD + 0.012, 0.04, m.armD + 0.012, mat('#C8CCD0', { rauheit: 0.35 }), 0.01);
        st.position.y = -m.oberarm * 0.55;
        arm.add(st);
      }
      return {};
    },
  });
  return skaliere(fig, params.groesse);
}
