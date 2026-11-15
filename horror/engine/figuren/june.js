// June Marsh (24, in Rückblenden 18). Schwester, Schutzfigur, Twist.
// Erkennungsmerkmal: senfgelbe Strickjacke mit zwei großen Knopfklötzen, dunkelroter Zopf,
// bernsteinfarbene Augen (Hinweis für Teil 4: das Auge zwischen den Fingern hat dieselbe Farbe).
// Farben aus serie.md: Jacke #D9A437, Haare #7A2E22, Hose #2C3550, Schuhe #B83A32 (Senkel weiß,
// doppelt geknotet), Haut #EFD3B5, Augen #E3A33B.
// params: rueckblende (true: offene Haare statt Zopf, June mit 18), barfuss (Teil 2), groesse
import { baueKlotzfigur, skaliere, musterTextur } from '../src/klotzfigur.js';
import { vAusschnitt, saum, naht } from '../src/kleidung.js';

export default async function baue(ctx, params = {}) {
  const strick = musterTextur(ctx, 'strick');
  const jacke = ctx.mat('#D9A437', { rauheit: 0.95, karte: strick });
  const fig = baueKlotzfigur(ctx, {
    masse: {
      kopfB: 0.52, kopfH: 0.5, kopfT: 0.47, kopfRund: 0.095,
      rumpfOben: 0.47, rumpfUnten: 0.39, rumpfH: 0.5, rumpfT: 0.25,
      oberarm: 0.24, unterarm: 0.2, armD: 0.125, hand: [0.07, 0.14, 0.11],
      oberschenkel: 0.23, unterschenkel: 0.19, beinD: 0.15, beinAbstand: 0.19,
      schuh: { b: 0.155, h: 0.11, l: 0.29 },
    },
    farben: {
      haut: '#EFD3B5', oberteil: '#D9A437', buendchen: '#C08F2C', hose: '#2C3550',
      schuh: params.barfuss ? '#EFD3B5' : '#B83A32', sohle: params.barfuss ? '#EFD3B5' : '#F0EDE6',
      senkel: params.barfuss ? null : '#F4F2EC', iris: '#E3A33B', brauen: '#5E2219',
    },
    matOben: jacke, matAermel: jacke,
    schuh: { art: 'turnschuh', schleife: !params.barfuss },
    gesicht: { augenAbstand: 0.19, augenHoehe: 0.5, mundHoehe: 0.78, wangen: '#e8968a', augenGroesse: 1.05 },
    vorne: (g, w, h, rand) => {
      vAusschnitt(g, w, h, '#F1E9DA', 0.4);
      naht(g, w, w * 0.5, h * 0.4, w * 0.5, h * 0.95, 'rgba(0,0,0,0.3)');
      saum(g, w, h, rand, { hoehe: 0.1 });
    },
    hinten: (g, w, h, rand) => saum(g, w, h, rand, { hoehe: 0.1 }),
    schmuck: ({ gelenke, masse: m, mat, rundeKiste }) => {
      const haar = mat('#7A2E22', { rauheit: 0.85 });
      const haarHell = mat('#8E3A2B', { rauheit: 0.85 });
      const k = gelenke.kopf;
      const kappe = rundeKiste(m.kopfB + 0.035, 0.12, m.kopfT + 0.035, haar, 0.05);
      kappe.position.set(0, m.kopfH - 0.025, -0.005);
      k.add(kappe);
      // Scheitel: zwei Pony-Hälften, links etwas länger
      for (const sx of [-1, 1]) {
        const pony = rundeKiste(m.kopfB * 0.47, sx > 0 ? 0.12 : 0.09, 0.07, sx > 0 ? haar : haarHell, 0.03);
        pony.position.set(sx * m.kopfB * 0.25, m.kopfH - (sx > 0 ? 0.1 : 0.085), m.kopfT / 2 - 0.01);
        pony.rotation.z = sx * 0.12;
        k.add(pony);
        const seite = rundeKiste(0.06, params.rueckblende ? 0.5 : 0.3, m.kopfT * 0.75, haar, 0.025);
        seite.position.set(sx * (m.kopfB / 2 + 0.01), params.rueckblende ? m.kopfH * 0.5 : m.kopfH * 0.7, -0.05);
        k.add(seite);
      }
      // einzelne Strähnen über dem Pony brechen die Kante (sonst wirkt die Frisur wie ein Helm)
      for (const [x, rz, l] of [[-0.17, 0.25, 0.1], [-0.05, -0.1, 0.13], [0.09, 0.15, 0.11], [0.19, -0.3, 0.09]]) {
        const st = rundeKiste(0.09, l, 0.06, haarHell, 0.025);
        st.position.set(x, m.kopfH - 0.04 - l / 2 + 0.06, m.kopfT / 2 + 0.015);
        st.rotation.z = rz;
        k.add(st);
      }
      const hinten = rundeKiste(m.kopfB + 0.03, params.rueckblende ? 0.72 : m.kopfH * 0.7, 0.1, haar, 0.04);
      hinten.position.set(0, params.rueckblende ? m.kopfH * 0.45 : m.kopfH * 0.63, -m.kopfT / 2 + 0.02);
      k.add(hinten);
      // Zwei große Knopfklötze auf der Strickjacke
      for (const y of [0.55, 0.72]) {
        const knopf = rundeKiste(0.06, 0.06, 0.03, mat('#6B4A2B', { rauheit: 0.5 }), 0.014);
        knopf.position.set(0.035, m.rumpfH * (1 - y), m.rumpfT / 2 + 0.01);
        gelenke.rumpf.add(knopf);
      }
      if (params.rueckblende) return {};
      // Zopf als eigenes Gelenk: hängt hinten vom Kopf und pendelt leicht (siehe atmen)
      const zopf = new ctx.THREE.Group();
      zopf.position.set(0, m.kopfH * 0.42, -m.kopfT / 2 - 0.02);
      k.add(zopf);
      const glieder = [[0.13, 0.15], [0.12, 0.15], [0.105, 0.14], [0.09, 0.12]];
      let y = 0;
      glieder.forEach(([b, l], i) => {
        const seg = rundeKiste(b, l, b * 0.85, i % 2 ? haarHell : haar, 0.035);
        seg.position.set(0, y - l / 2, -0.01 - i * 0.012);
        seg.rotation.x = 0.06;
        zopf.add(seg);
        y -= l * 0.88;
      });
      const band = rundeKiste(0.1, 0.035, 0.09, mat('#F2C14E'), 0.012);
      band.position.set(0, y - 0.005, -0.06);
      zopf.add(band);
      const ende = rundeKiste(0.075, 0.07, 0.065, haar, 0.025);
      ende.position.set(0, y - 0.05, -0.065);
      zopf.add(ende);
      return {
        gelenke: { zopf },
        // Zopf hängt nach unten, auch wenn Kopf oder Rumpf geneigt sind, und pendelt sanft.
        atmen(t) {
          zopf.rotation.x = -(gelenke.kopf.rotation.x + gelenke.rumpf.rotation.x) * 0.8 + 0.12 + 0.03 * Math.sin(t * 1.7);
          zopf.rotation.z = 0.04 * Math.sin(t * 1.3 + 0.5) - gelenke.huefte.rotation.z;
        },
      };
    },
  });
  return skaliere(fig, params.groesse);
}
