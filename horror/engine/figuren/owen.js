// Owen Pike (18, nur Rückblende). Gescheiterte Flucht im hellblauen Pick-up.
// Erkennungsmerkmal: orange Jägermütze mit Schirm; schwarze Stiefel mit orangen Senkeln (Requisit:
// "His shoes were on the seat, side by side").
// Farben aus serie.md: Mütze #E07A2E, Shirt #1E1F22, Stiefel #1E1F22 / Senkel #E07A2E, Haut #C99A73.
// params: groesse
import { baueKlotzfigur, skaliere, musterTextur } from '../src/klotzfigur.js';
import { naht, guertel } from '../src/kleidung.js';

export default async function baue(ctx, params = {}) {
  const jeans = ctx.mat('#3D5A80', { rauheit: 0.9, karte: musterTextur(ctx, 'jeans') });
  const fig = baueKlotzfigur(ctx, {
    masse: {
      kopfB: 0.57, kopfH: 0.52, kopfT: 0.5,
      rumpfOben: 0.62, rumpfUnten: 0.55, rumpfH: 0.54, rumpfT: 0.32,
      beckenB: 0.52,
      oberarm: 0.25, unterarm: 0.22, armD: 0.155, hand: [0.082, 0.15, 0.125],
      oberschenkel: 0.24, unterschenkel: 0.2, beinD: 0.18, beinAbstand: 0.25,
      schuh: { b: 0.185, h: 0.13, l: 0.33 },
    },
    farben: {
      haut: '#C99A73', oberteil: '#1E1F22', hose: '#3D5A80',
      schuh: '#1E1F22', sohle: '#2b2b2e', senkel: '#E07A2E', iris: '#2a1c12', brauen: '#2a1c12',
    },
    matHose: jeans,
    kurzeAermel: true,
    schuh: { art: 'stiefel', kante: '#2a2a2e' },
    gesicht: { augenAbstand: 0.19, augenHoehe: 0.5, mundHoehe: 0.78, sommersprossen: true },
    vorne: (g, w, h) => {
      // Rundhals und ein ausgeblichener Brustaufdruck (abstraktes Zeichen, kein Logo)
      g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = w * 0.02;
      g.beginPath(); g.arc(w * 0.5, -h * 0.02, w * 0.14, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke();
      g.fillStyle = 'rgba(224,122,46,0.55)';
      g.beginPath(); g.moveTo(w * 0.42, h * 0.48); g.lineTo(w * 0.5, h * 0.3); g.lineTo(w * 0.58, h * 0.48); g.closePath(); g.fill();
      g.fillRect(w * 0.4, h * 0.5, w * 0.2, h * 0.04);
    },
    becken: (g, w, h) => guertel(g, w, h, { farbe: '#2b1d14', schnalle: '#b9a37a' }),
    schmuck: ({ gelenke, masse: m, mat, rundeKiste }) => {
      const k = gelenke.kopf;
      const orange = mat('#E07A2E', { rauheit: 0.9 });
      const muetze = rundeKiste(m.kopfB + 0.04, 0.17, m.kopfT + 0.04, orange, 0.06);
      muetze.position.set(0, m.kopfH, 0);
      k.add(muetze);
      const schirm = rundeKiste(m.kopfB * 0.9, 0.035, 0.2, orange, 0.015);
      schirm.position.set(0, m.kopfH - 0.06, m.kopfT / 2 + 0.08);
      schirm.rotation.x = 0.12;
      k.add(schirm);
      // Ohrenklappen der Jägermütze
      for (const sx of [-1, 1]) {
        const klappe = rundeKiste(0.04, 0.14, 0.18, orange, 0.015);
        klappe.position.set(sx * (m.kopfB / 2 + 0.02), m.kopfH - 0.1, -0.02);
        k.add(klappe);
      }
      const haar = rundeKiste(m.kopfB + 0.02, 0.12, 0.08, mat('#4a3020'), 0.03);
      haar.position.set(0, m.kopfH - 0.13, -m.kopfT / 2 + 0.02);
      k.add(haar);
      return {};
    },
  });
  return skaliere(fig, params.groesse);
}
