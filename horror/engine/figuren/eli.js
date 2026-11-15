// Eli Marsh (18, Erzähler). Größte Menschenfigur, schlaksig.
// Erkennungsmerkmal: flaschengrüne Kapuzenjacke mit Kapuzen-Klotz im Nacken, abstehende Strähne.
// Farben aus serie.md: Jacke #2F6B45, Haare #3B2A20, Hose #5A5F66, Schuhe #F2F2EE / Senkel #4FA36A,
// Haut #E8C9A8, Augen #3A2618.
// params: groesse (Std 1)
import { baueKlotzfigur, skaliere } from '../src/klotzfigur.js';
import { reissverschluss, tasche, saum, kordeln, naht } from '../src/kleidung.js';

export default async function baue(ctx, params = {}) {
  const fig = baueKlotzfigur(ctx, {
    masse: {
      kopfB: 0.56, kopfH: 0.53, kopfT: 0.5,
      rumpfOben: 0.52, rumpfUnten: 0.41, rumpfH: 0.6, rumpfT: 0.27,
      oberarm: 0.28, unterarm: 0.24, armD: 0.135,
      oberschenkel: 0.26, unterschenkel: 0.23, beinD: 0.16,
      schuh: { b: 0.17, h: 0.12, l: 0.33 },
    },
    farben: {
      haut: '#E8C9A8', oberteil: '#2F6B45', buendchen: '#24563A', hose: '#5A5F66',
      schuh: '#F2F2EE', sohle: '#E2DFD6', senkel: '#4FA36A', iris: '#3A2618', brauen: '#3B2A20',
    },
    schuh: { art: 'turnschuh', streifen: '#4FA36A' },
    gesicht: { augenAbstand: 0.19, augenHoehe: 0.5, mundHoehe: 0.78 },
    vorne: (g, w, h, rand) => {
      reissverschluss(g, w, h, { von: 0.06, bis: 0.9 });
      tasche(g, w, h, w * 0.27, h * 0.6, w * 0.46, h * 0.24, { schraeg: true });
      kordeln(g, w, h);
      saum(g, w, h, rand);
    },
    hinten: (g, w, h, rand) => { saum(g, w, h, rand); naht(g, w, w * 0.2, h * 0.3, w * 0.8, h * 0.3); },
    becken: (g, w, h) => { naht(g, w, w * 0.15, h * 0.4, w * 0.32, h * 0.95); naht(g, w, w * 0.85, h * 0.4, w * 0.68, h * 0.95); },
    schmuck: ({ gelenke, masse: m, mat, rundeKiste }) => {
      const haar = mat('#3B2A20', { rauheit: 0.9 });
      const k = gelenke.kopf;
      // Haare aus drei Klötzen: Kappe, Hinterkopf, Pony – dazu eine Strähne, die absteht
      const kappe = rundeKiste(m.kopfB + 0.03, 0.13, m.kopfT + 0.03, haar, 0.05);
      kappe.position.set(0, m.kopfH - 0.03, -0.005);
      k.add(kappe);
      const hinten = rundeKiste(m.kopfB + 0.025, m.kopfH * 0.62, 0.1, haar, 0.04);
      hinten.position.set(0, m.kopfH * 0.66, -m.kopfT / 2 + 0.03);
      k.add(hinten);
      const pony = rundeKiste(m.kopfB * 0.86, 0.085, 0.09, haar, 0.035);
      pony.position.set(0.03, m.kopfH - 0.085, m.kopfT / 2 - 0.02);
      pony.rotation.z = -0.06;
      k.add(pony);
      // hellere Oberseite und Büschel: Frisur liest sich auch im Schatten als Haar
      const haarHell = mat('#5a4232', { rauheit: 0.85 });
      for (const [x, z, rx, rz] of [[-0.14, 0.02, -0.2, 0.15], [0.0, -0.06, -0.1, -0.1], [-0.04, 0.12, -0.35, 0.05], [0.16, -0.1, 0.1, -0.2]]) {
        const b = rundeKiste(0.16, 0.08, 0.18, haarHell, 0.035);
        b.position.set(x, m.kopfH + 0.06, z);
        b.rotation.set(rx, 0, rz);
        k.add(b);
      }
      const straehne = rundeKiste(0.1, 0.07, 0.2, haar, 0.03);
      straehne.position.set(0.12, m.kopfH + 0.05, 0.05);
      straehne.rotation.set(-0.5, 0.3, 0.35);
      k.add(straehne);
      for (const sx of [-1, 1]) {
        const seite = rundeKiste(0.05, 0.2, m.kopfT * 0.7, haar, 0.02);
        seite.position.set(sx * (m.kopfB / 2 + 0.005), m.kopfH * 0.78, -0.04);
        k.add(seite);
      }
      // Kapuze als Klotz im Nacken (Erkennungsmerkmal von hinten und in der Halbtotalen)
      const kapuze = rundeKiste(m.rumpfOben * 0.8, 0.16, 0.17, mat('#2A6040'), 0.06);
      kapuze.position.set(0, m.rumpfH + 0.02, -m.rumpfT / 2 - 0.02);
      kapuze.rotation.x = 0.25;
      gelenke.rumpf.add(kapuze);
      return {};
    },
  });
  return skaliere(fig, params.groesse);
}
