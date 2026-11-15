// Nachbarn (Stadt, Menge): nur Erwachsene, 20–70. Eine Grundfigur in vier Varianten.
// Farben gedeckt laut serie.md: Braun #6A5038, Oliv #5E6B3A, Grau #7A7D80, Dunkelrot #7A3B36.
// params:
//   variante: 'muetze' | 'kopftuch' | 'brille' | 'glatze' (Std 'muetze')
//   farbe:    Jackenfarbe (Std aus der Palette nach Variante)
//   alter:    'jung' (etwa 20) | 'mittel' | 'alt' (Std 'mittel'); alt = graue Haare, Falten, gebeugt
//   haut:     Hautton (Std je Variante)
//   kleidung: 'jacke' | 'pullover' | 'mantel' (Std je Variante)
//   groesse:  Skalierung (Std 1)
import { baueKlotzfigur, skaliere, musterTextur } from '../src/klotzfigur.js';
import { reissverschluss, saum, knopfleiste, vAusschnitt } from '../src/kleidung.js';

const PALETTE = { muetze: '#6A5038', kopftuch: '#5E6B3A', brille: '#7A7D80', glatze: '#7A3B36' };
const HAUT = { muetze: '#D8B08C', kopftuch: '#C48E68', brille: '#EBCDB0', glatze: '#9C6B4B' };
const KLEIDUNG = { muetze: 'jacke', kopftuch: 'mantel', brille: 'pullover', glatze: 'jacke' };

export default async function baue(ctx, params = {}) {
  const T = ctx.THREE;
  const variante = params.variante ?? 'muetze';
  if (!PALETTE[variante]) throw new Error(`nachbar: variante "${variante}" unbekannt (muetze, kopftuch, brille, glatze)`);
  const alter = params.alter ?? 'mittel';
  const farbe = params.farbe ?? PALETTE[variante];
  const haut = params.haut ?? HAUT[variante];
  const kleidung = params.kleidung ?? KLEIDUNG[variante];
  const haarFarbe = alter === 'alt' ? '#CFCBC4' : alter === 'jung' ? '#3a2a1e' : '#5a4a3c';
  const breit = variante === 'glatze' || variante === 'muetze';
  const fig = baueKlotzfigur(ctx, {
    masse: {
      kopfB: 0.55, kopfH: 0.51, kopfT: 0.49,
      rumpfOben: breit ? 0.58 : 0.5, rumpfUnten: breit ? 0.5 : 0.42, rumpfH: 0.56, rumpfT: 0.29,
      beckenB: breit ? 0.48 : 0.42,
      oberarm: 0.25, unterarm: 0.22, armD: 0.145,
      oberschenkel: 0.24, unterschenkel: 0.2, beinD: 0.16, beinAbstand: 0.21,
    },
    farben: {
      haut, oberteil: farbe, hose: alter === 'jung' ? '#34405a' : '#4a4743',
      schuh: alter === 'jung' ? '#e6e3dc' : '#3a2e26', sohle: alter === 'jung' ? '#f2f0ea' : '#2a221c',
      iris: '#2e2016', brauen: alter === 'alt' ? '#bdb8b0' : '#3a2a1e',
    },
    schuh: { art: alter === 'jung' ? 'turnschuh' : 'halbschuh' },
    haltung: alter === 'alt' ? { rumpf: 0.1 } : {},
    gesicht: { augenAbstand: 0.19, augenHoehe: 0.5, mundHoehe: 0.77, falten: alter === 'alt', augenGroesse: alter === 'alt' ? 0.88 : 1 },
    vorne: (g, w, h, rand) => {
      if (kleidung === 'jacke') { reissverschluss(g, w, h, { von: 0.08, bis: 0.92 }); saum(g, w, h, rand); }
      else if (kleidung === 'mantel') { vAusschnitt(g, w, h, '#cfc7b8', 0.28); knopfleiste(g, w, h, { anzahl: 3, von: 0.4, bis: 0.85 }); }
      else { saum(g, w, h, rand, { hoehe: 0.1 }); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = w * 0.02; g.beginPath(); g.arc(w * 0.5, 0, w * 0.13, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke(); }
    },
    schmuck: ({ gelenke, masse: m, mat, rundeKiste }) => {
      const k = gelenke.kopf;
      const haar = mat(haarFarbe, { rauheit: 0.9 });
      if (variante !== 'glatze' && variante !== 'kopftuch') {
        const hinten = rundeKiste(m.kopfB + 0.02, m.kopfH * 0.55, 0.08, haar, 0.03);
        hinten.position.set(0, m.kopfH * 0.65, -m.kopfT / 2 + 0.02);
        k.add(hinten);
        const kappe = rundeKiste(m.kopfB + 0.025, 0.1, m.kopfT + 0.02, haar, 0.04);
        kappe.position.set(0, m.kopfH - 0.02, 0);
        k.add(kappe);
      }
      if (variante === 'muetze') {
        const mm = ctx.mat(farbe === '#6A5038' ? '#8A4A36' : '#6a6a6e', { rauheit: 0.95, karte: musterTextur(ctx, 'strick') });
        const muetze = rundeKiste(m.kopfB + 0.05, 0.19, m.kopfT + 0.05, mm, 0.07);
        muetze.position.set(0, m.kopfH + 0.01, 0);
        k.add(muetze);
        const bommel = rundeKiste(0.1, 0.08, 0.1, mm, 0.04);
        bommel.position.set(0, m.kopfH + 0.13, 0);
        k.add(bommel);
      } else if (variante === 'kopftuch') {
        const tuch = mat('#8C6A4A', { rauheit: 0.9 });
        const haube = rundeKiste(m.kopfB + 0.05, m.kopfH * 0.5, m.kopfT + 0.04, tuch, 0.08);
        haube.position.set(0, m.kopfH * 0.82, -0.02);
        k.add(haube);
        const nacken = rundeKiste(m.kopfB * 0.9, m.kopfH * 0.5, 0.08, tuch, 0.03);
        nacken.position.set(0, m.kopfH * 0.42, -m.kopfT / 2);
        k.add(nacken);
        const knoten = rundeKiste(0.12, 0.08, 0.08, tuch, 0.03);
        knoten.position.set(0, m.kopfH * 0.18, -m.kopfT / 2 - 0.05);
        k.add(knoten);
      } else if (variante === 'brille') {
        const brille = mat('#2a2a2a', { rauheit: 0.4 });
        for (const sx of [-1, 1]) {
          const glas = new T.Mesh(new T.TorusGeometry(0.06, 0.01, 4, 4), brille); // eckige Brille
          glas.rotation.z = Math.PI / 4;
          glas.position.set(sx * (m.kopfB - m.kopfRund * 1.6) * 0.19, m.kopfH * 0.5, m.kopfT / 2 + 0.015);
          k.add(glas);
        }
        const steg = rundeKiste(0.05, 0.012, 0.012, brille, 0.004, false);
        steg.position.set(0, m.kopfH * 0.52, m.kopfT / 2 + 0.015);
        k.add(steg);
      } else if (variante === 'glatze') {
        for (const sx of [-1, 1]) {
          const seite = rundeKiste(0.05, 0.12, m.kopfT * 0.5, mat('#2a2018'), 0.02);
          seite.position.set(sx * (m.kopfB / 2 + 0.005), m.kopfH * 0.55, -0.1);
          k.add(seite);
        }
      }
      return {};
    },
  });
  return skaliere(fig, params.groesse);
}
