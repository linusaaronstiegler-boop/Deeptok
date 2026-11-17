// Bear (19), Erzähler von „Rules of Kindly“ Folge 1, ab S34 die Kopie (Bibel §10.2).
// Erkennungsmerkmal: petrolblauer Parka #2E6E7E mit Fellrand an der Kapuze (Kapuze im Nacken), schlaksig,
// dunkelbraune, zerzauste Haare, graue Hose, braune Winterstiefel. Ab S34 kein Atemdampf (params.dampf_aus_ab).
// Gesichter: neutral, angespannt (= besorgt), augen_zu (Atem anhalten), erschrocken (= schock), leer (Fenster),
// ruhig (Schluss) und der ganze Hausstil-Satz (src/gesichter.js).
// params: groesse (Std 1), Atemdampf: dampf, dampf_aus_ab, dampf_aus, dampf_staerke …
//         (src/atemdampf.js). Aktion "dampf" schaltet ihn je Einstellung.
import { baueKlotzfigur, skaliere } from '../src/klotzfigur.js';
import { reissverschluss, tasche, saum, naht } from '../src/kleidung.js';
import { kapuzeMitFell, schoesse } from '../src/kindly_kleidung.js';
import { dampfFuerFigur } from '../src/atemdampf.js';

export const FARBEN = { parka: '#2E6E7E', parkaDunkel: '#285F6C', haar: '#4E3726', haut: '#E6C3A0', hose: '#6B6E73', stiefel: '#6E4A2E' };

export default async function baue(ctx, params = {}) {
  const F = FARBEN;
  const fig = baueKlotzfigur(ctx, {
    masse: {
      kopfB: 0.55, kopfH: 0.53, kopfT: 0.5,
      // schlaksig: schmaler Rumpf, lange Glieder; der Parka trägt etwas auf
      rumpfOben: 0.55, rumpfUnten: 0.47, rumpfH: 0.62, rumpfT: 0.3,
      oberarm: 0.29, unterarm: 0.25, armD: 0.15, hand: [0.075, 0.15, 0.12],
      oberschenkel: 0.27, unterschenkel: 0.24, beinD: 0.155, beinAbstand: 0.2,
      schuh: { b: 0.18, h: 0.13, l: 0.33 },
    },
    farben: {
      haut: F.haut, oberteil: F.parka, buendchen: F.parkaDunkel, hose: F.hose,
      schuh: F.stiefel, sohle: '#2E241C', senkel: '#C9A46A', iris: '#3A2618', brauen: '#2E2018',
    },
    schuh: { art: 'stiefel', kante: '#5A3B24' },
    gesicht: { augenAbstand: 0.19, augenHoehe: 0.5, mundHoehe: 0.78 },
    vorne: (g, w, h, rand) => {
      reissverschluss(g, w, h, { von: 0.06, bis: 0.98, farbe: '#b9c6c8' });
      // Sturmleiste mit Druckknöpfen neben dem Reißverschluss
      g.fillStyle = 'rgba(0,0,0,0.14)'; g.fillRect(w * 0.53, h * 0.04, w * 0.06, h * 0.94);
      g.fillStyle = '#c8d2d4';
      for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(w * 0.56, h * (0.14 + i * 0.18), w * 0.012, 0, 2 * Math.PI); g.fill(); }
      // zwei große Pattentaschen unten, eine Brusttasche
      tasche(g, w, h, w * 0.14, h * 0.64, w * 0.24, h * 0.26);
      tasche(g, w, h, w * 0.64, h * 0.64, w * 0.22, h * 0.26);
      tasche(g, w, h, w * 0.2, h * 0.18, w * 0.17, h * 0.16);
      naht(g, w, w * 0.08, h * 0.42, w * 0.92, h * 0.42, 'rgba(0,0,0,0.22)');
    },
    hinten: (g, w, h, rand) => { naht(g, w, w * 0.12, h * 0.42, w * 0.88, h * 0.42, 'rgba(0,0,0,0.22)'); saum(g, w, h, rand, { hoehe: 0.05 }); },
    schmuck: (teile) => {
      const { gelenke, masse: m, mat, rundeKiste } = teile;
      const k = gelenke.kopf;
      // Haare: zerzauster Schopf mit Kantenlicht (liest sich vor dunklem Grund nicht als schwarzer Klotz)
      const haar = mat(F.haar, { rauheit: 0.6, kante: { farbe: '#e0d2ff', staerke: 0.45, exponent: 2.6 } });
      const haarHell = mat('#6a4f3a', { rauheit: 0.65, kante: { farbe: '#e0d2ff', staerke: 0.45, exponent: 2.6 } });
      const kappe = rundeKiste(m.kopfB + 0.03, 0.12, m.kopfT + 0.03, haar, 0.05);
      kappe.position.set(0, m.kopfH - 0.02, -0.005);
      k.add(kappe);
      const hinten = rundeKiste(m.kopfB + 0.025, m.kopfH * 0.6, 0.1, haar, 0.04);
      hinten.position.set(0, m.kopfH * 0.68, -m.kopfT / 2 + 0.03);
      k.add(hinten);
      // Pony schräg in die Stirn, nach links gekämmt (anders als Elis Strähne)
      const pony = rundeKiste(m.kopfB * 0.55, 0.065, 0.08, haarHell, 0.03);
      pony.position.set(0.1, m.kopfH - 0.075, m.kopfT / 2 - 0.02);
      pony.rotation.z = 0.16;
      k.add(pony);
      for (const [x, z, rx, rz, b] of [[-0.16, 0.05, -0.3, 0.25, 0.14], [-0.02, -0.08, 0.15, -0.15, 0.16], [0.13, 0.08, -0.3, -0.25, 0.14], [0.06, 0.16, -0.5, 0.1, 0.12], [-0.12, -0.17, 0.3, 0.2, 0.13]]) {
        const b2 = rundeKiste(b, 0.08, b + 0.03, haarHell, 0.03);
        b2.position.set(x, m.kopfH + 0.055, z);
        b2.rotation.set(rx, 0, rz);
        k.add(b2);
      }
      for (const sx of [-1, 1]) {
        const seite = rundeKiste(0.04, 0.13, m.kopfT * 0.5, haar, 0.02);
        seite.position.set(sx * (m.kopfB / 2 + 0.004), m.kopfH * 0.83, -0.08);
        k.add(seite);
      }
      kapuzeMitFell(teile, { farbe: F.parkaDunkel });
      // Parka reicht über die Hüfte
      schoesse(teile, mat(F.parka, { rauheit: 0.82 }), { laenge: 0.5 });
      return {};
    },
  });
  dampfFuerFigur(ctx, fig, params);
  return skaliere(fig, params.groesse);
}
