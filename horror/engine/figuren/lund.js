// Mr. Lund (63), Rules of Kindly Folge 1: hat einmal zum Spaß zurückgeklopft (S18–21) und kam als Kopie
// heim; in Bild 1 liegt sein echtes Gesicht unter dem Eis (das trägt Old Knuckles, figuren/old_knuckles.js).
// Erkennungsmerkmal (Bibel §10.2): Glatze mit grauem Haarkranz, grauer Schnurrbart, dunkelblauer Wollmantel.
// Gesichter: neutral, lachend (Rückblende), leer und der Hausstil-Satz.
// params: groesse (Std 1), muetze (Std false: graue Strickmütze, dann ist die Glatze weg), Atemdampf
//         (src/atemdampf.js; die Kopie: "dampf": false oder "dampf_aus_ab")
import { baueKlotzfigur, skaliere, musterTextur } from '../src/klotzfigur.js';
import { knopfleiste, vAusschnitt } from '../src/kleidung.js';
import { schoesse, schal } from '../src/kindly_kleidung.js';
import { dampfFuerFigur } from '../src/atemdampf.js';

export const FARBEN = { mantel: '#34466C', mantelDunkel: '#2A3858', haut: '#E3BFA0', haar: '#C9C5BD', schnurrbart: '#A9A49C', schal: '#7A6A52' };

export default async function baue(ctx, params = {}) {
  const F = FARBEN;
  const fig = baueKlotzfigur(ctx, {
    masse: {
      kopfB: 0.56, kopfH: 0.52, kopfT: 0.5,
      rumpfOben: 0.6, rumpfUnten: 0.54, rumpfH: 0.58, rumpfT: 0.32,
      beckenB: 0.5,
      oberarm: 0.25, unterarm: 0.22, armD: 0.15,
      oberschenkel: 0.24, unterschenkel: 0.2, beinD: 0.165, beinAbstand: 0.22,
      schuh: { b: 0.17, h: 0.12, l: 0.31 },
    },
    farben: {
      haut: F.haut, oberteil: F.mantel, buendchen: F.mantelDunkel, hose: '#45423E',
      schuh: '#3a2e26', sohle: '#221a14', iris: '#3a4a5a', brauen: '#b8b3aa',
    },
    schuh: { art: 'stiefel', kante: '#2a211a' },
    haltung: { rumpf: 0.05 },
    gesicht: { augenAbstand: 0.19, augenHoehe: 0.48, mundHoehe: 0.82, falten: true, augenGroesse: 0.9 },
    vorne: (g, w, h) => {
      vAusschnitt(g, w, h, '#d8d0c0', 0.24);
      knopfleiste(g, w, h, { farbe: '#141a26', anzahl: 4, von: 0.32, bis: 0.92, x: 0.5 });
    },
    schmuck: (teile) => {
      const { gelenke, masse: m, mat, rundeKiste } = teile;
      const k = gelenke.kopf;
      if (params.muetze) {
        const mm = ctx.mat('#6e7277', { rauheit: 0.95, karte: musterTextur(ctx, 'strick') });
        const muetze = rundeKiste(m.kopfB + 0.05, 0.2, m.kopfT + 0.05, mm, 0.07);
        muetze.position.set(0, m.kopfH - 0.01, 0);
        k.add(muetze);
      } else {
        // Glatze mit grauem Haarkranz hinten und an den Seiten (wie bei Odell, aber kürzer)
        const haar = mat(F.haar, { rauheit: 0.9 });
        const hinten = rundeKiste(m.kopfB + 0.025, 0.17, 0.07, haar, 0.03);
        hinten.position.set(0, m.kopfH * 0.5, -m.kopfT / 2 + 0.005);
        k.add(hinten);
        for (const sx of [-1, 1]) {
          const seite = rundeKiste(0.05, 0.13, m.kopfT * 0.5, haar, 0.025);
          seite.position.set(sx * (m.kopfB / 2 + 0.008), m.kopfH * 0.55, -0.09);
          k.add(seite);
        }
      }
      // grauer Schnurrbart: breiter Klotz über dem Mund, an den Enden etwas nach unten
      const bart = mat(F.schnurrbart, { rauheit: 0.95, kante: { farbe: '#ffffff', staerke: 0.25, exponent: 2.5 } });
      const schnurr = rundeKiste(m.kopfB * 0.42, 0.055, 0.045, bart, 0.02);
      schnurr.position.set(0, 0.19, m.kopfT / 2 + 0.015);          // zwischen Augen (Unterkante 0,23) und Mund (0,145)
      k.add(schnurr);
      for (const sx of [-1, 1]) {
        const ende = rundeKiste(0.05, 0.06, 0.04, bart, 0.016);
        ende.position.set(sx * m.kopfB * 0.21, 0.172, m.kopfT / 2 + 0.013);
        ende.rotation.z = sx * 0.35;
        k.add(ende);
      }
      schal(teile, F.schal);
      schoesse(teile, mat(F.mantel, { rauheit: 0.9 }), { laenge: 1.0 });
      return {};
    },
  });
  dampfFuerFigur(ctx, fig, params);
  return skaliere(fig, params.groesse);
}
