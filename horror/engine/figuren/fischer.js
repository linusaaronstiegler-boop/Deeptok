// Eisfischer von Kindly (Rules of Kindly Folge 1: Menge beim ersten Eis S30, die drei Männer am Ufer S3–4,
// der Fischer, der in S6 auf Odells Brille haucht). Nur Erwachsene (Bibel §10.2, Regel 2a).
// Eine Grundfigur in fünf Varianten, jede mit eigenem Merkmal in der Halbtotalen:
//   kapuze   Parka mit hochgezogener Kapuze (Gesicht frei), Std-Farbe oliv
//   muetze   Strickmütze mit Bommel, Jacke ocker
//   schirm   Schirmmütze mit Ohrenschutz, Latzhose (Träger über der Jacke)
//   schapka  hohe Pelzmütze, langer grauer Mantel
//   kappe    flache Wollkappe, Weste über dem Pullover
// params: variante (Std "muetze"), farbe (Jacke), haut, alter ("jung" ≈ 22 | "mittel" | "alt"), bart (Std je
//         Variante), angel (Std false: kurze Eisangel in der rechten Hand), groesse, Atemdampf (src/atemdampf.js)
import * as THREE from 'three';
import { baueKlotzfigur, skaliere, musterTextur } from '../src/klotzfigur.js';
import { reissverschluss, saum, tasche, knopfleiste } from '../src/kleidung.js';
import { fellTextur, schoesse } from '../src/kindly_kleidung.js';
import { dampfFuerFigur } from '../src/atemdampf.js';

const STIL = {
  kapuze: { farbe: '#5E6B3A', haut: '#D8B08C', bart: false, kleidung: 'parka' },
  muetze: { farbe: '#B07A34', haut: '#E3BC98', bart: true, kleidung: 'jacke' },
  schirm: { farbe: '#6A5038', haut: '#C48E68', bart: false, kleidung: 'latz' },
  schapka: { farbe: '#6E7175', haut: '#EBCDB0', bart: true, kleidung: 'mantel' },
  kappe: { farbe: '#7A3B36', haut: '#9C6B4B', bart: false, kleidung: 'weste' },
};

export default async function baue(ctx, params = {}) {
  const v = params.variante ?? 'muetze';
  const st = STIL[v];
  if (!st) throw new Error(`fischer: variante "${v}" unbekannt (${Object.keys(STIL).join(', ')})`);
  const alter = params.alter ?? 'mittel';
  const farbe = params.farbe ?? st.farbe;
  const haut = params.haut ?? st.haut;
  const bart = params.bart ?? st.bart;
  const haarFarbe = alter === 'alt' ? '#CFCBC4' : alter === 'jung' ? '#3a2a1e' : '#5a4a3c';
  const breit = v === 'schirm' || v === 'schapka' || v === 'muetze';
  const fig = baueKlotzfigur(ctx, {
    masse: {
      kopfB: 0.56, kopfH: 0.52, kopfT: 0.5,
      rumpfOben: breit ? 0.62 : 0.56, rumpfUnten: breit ? 0.54 : 0.48, rumpfH: 0.58, rumpfT: 0.32,
      beckenB: breit ? 0.5 : 0.45,
      oberarm: 0.26, unterarm: 0.22, armD: 0.155,
      oberschenkel: 0.25, unterschenkel: 0.21, beinD: 0.17, beinAbstand: 0.22,
      schuh: { b: 0.18, h: 0.13, l: 0.33 },
    },
    farben: {
      haut, oberteil: farbe, hose: v === 'latz' || st.kleidung === 'latz' ? '#3F4A5A' : '#4a4743',
      schuh: '#3a2e26', sohle: '#221a14', senkel: '#B08A58', iris: '#2e2016', brauen: alter === 'alt' ? '#bdb8b0' : '#3a2a1e',
    },
    schuh: { art: 'stiefel', kante: '#2a211a' },
    haltung: alter === 'alt' ? { rumpf: 0.08 } : {},
    gesicht: { augenAbstand: 0.19, augenHoehe: 0.48, mundHoehe: bart ? 0.7 : 0.78, falten: alter === 'alt', augenGroesse: alter === 'alt' ? 0.9 : 1 },
    vorne: (g, w, h, rand) => {
      if (st.kleidung === 'parka' || st.kleidung === 'jacke') {
        reissverschluss(g, w, h, { von: 0.05, bis: 0.96 });
        tasche(g, w, h, w * 0.14, h * 0.62, w * 0.22, h * 0.24);
        tasche(g, w, h, w * 0.64, h * 0.62, w * 0.22, h * 0.24);
        saum(g, w, h, rand, { hoehe: 0.06 });
      } else if (st.kleidung === 'mantel') {
        knopfleiste(g, w, h, { farbe: '#1a1a1c', anzahl: 4, von: 0.25, bis: 0.92, x: 0.55 });
      } else if (st.kleidung === 'latz') {
        // Latzhose über der Jacke: Latz und zwei Träger
        g.fillStyle = '#3F4A5A'; g.fillRect(w * 0.28, h * 0.42, w * 0.44, h * 0.58);
        g.fillRect(w * 0.27, 0, w * 0.08, h * 0.45); g.fillRect(w * 0.65, 0, w * 0.08, h * 0.45);
        g.fillStyle = '#c8b27a'; for (const x of [0.31, 0.69]) { g.fillRect(w * x - w * 0.02, h * 0.4, w * 0.04, h * 0.05); }
        tasche(g, w, h, w * 0.38, h * 0.55, w * 0.24, h * 0.16, { farbe: 'rgba(0,0,0,0.22)' });
      } else {
        // Weste über dem Pullover
        g.fillStyle = '#3d3a36'; g.fillRect(w * 0.06, h * 0.08, w * 0.36, h * 0.92); g.fillRect(w * 0.58, h * 0.08, w * 0.36, h * 0.92);
        knopfleiste(g, w, h, { farbe: '#1a1a1c', anzahl: 4, von: 0.3, bis: 0.9, x: 0.42 });
      }
    },
    schmuck: (teile) => {
      const { gelenke, masse: m, mat, rundeKiste } = teile;
      const k = gelenke.kopf;
      const haar = mat(haarFarbe, { rauheit: 0.9 });
      if (v !== 'kapuze' && v !== 'schapka') {
        const hinten = rundeKiste(m.kopfB + 0.02, m.kopfH * 0.5, 0.08, haar, 0.03);
        hinten.position.set(0, m.kopfH * 0.62, -m.kopfT / 2 + 0.02);
        k.add(hinten);
      }
      if (bart) {
        const b = mat(alter === 'alt' ? '#bdb8b0' : '#7a5a40', { rauheit: 0.95, kante: { farbe: '#ffe0c8', staerke: 0.3, exponent: 2.6 } });
        const kinn = rundeKiste(m.kopfB * 0.8, 0.13, 0.08, b, 0.03);
        kinn.position.set(0, 0.075, m.kopfT / 2 + 0.01);
        k.add(kinn);
        for (const sx of [-1, 1]) {
          const backe = rundeKiste(0.07, 0.22, m.kopfT * 0.55, b, 0.03);
          backe.position.set(sx * (m.kopfB / 2 - 0.01), 0.15, 0.06);
          k.add(backe);
        }
      }
      if (v === 'kapuze') {
        // hochgezogene Parka-Kapuze: Rahmen um das Gesicht, Fellrand vorn
        const stoff = mat(farbe, { rauheit: 0.85 });
        const fell = ctx.mat('#ffffff', { rauheit: 1, karte: fellTextur(ctx, '#C9BBA2') });
        const oben = rundeKiste(m.kopfB + 0.12, 0.12, m.kopfT + 0.1, stoff, 0.06);
        oben.position.set(0, m.kopfH + 0.03, -0.02); k.add(oben);
        const hinten = rundeKiste(m.kopfB + 0.12, m.kopfH + 0.08, 0.1, stoff, 0.05);
        hinten.position.set(0, m.kopfH * 0.5, -m.kopfT / 2 - 0.04); k.add(hinten);
        for (const sx of [-1, 1]) {
          const seite = rundeKiste(0.07, m.kopfH + 0.04, m.kopfT + 0.06, stoff, 0.04);
          seite.position.set(sx * (m.kopfB / 2 + 0.035), m.kopfH * 0.48, -0.01); k.add(seite);
          const rand = rundeKiste(0.06, m.kopfH, 0.06, fell, 0.025);
          rand.position.set(sx * (m.kopfB / 2 + 0.02), m.kopfH * 0.48, m.kopfT / 2 + 0.03); k.add(rand);
        }
        const randOben = rundeKiste(m.kopfB + 0.1, 0.06, 0.06, fell, 0.025);
        randOben.position.set(0, m.kopfH + 0.01, m.kopfT / 2 + 0.03); k.add(randOben);
        schoesse(teile, mat(farbe, { rauheit: 0.85 }), { laenge: 0.55 });
      } else if (v === 'muetze') {
        const mm = ctx.mat('#2f5f73', { rauheit: 0.95, karte: musterTextur(ctx, 'strick') });
        const muetze = rundeKiste(m.kopfB + 0.05, 0.2, m.kopfT + 0.05, mm, 0.07);
        muetze.position.set(0, m.kopfH + 0.01, 0); k.add(muetze);
        const umschlag = rundeKiste(m.kopfB + 0.07, 0.08, m.kopfT + 0.07, ctx.mat('#285466', { rauheit: 0.95, karte: musterTextur(ctx, 'rippen') }), 0.03);
        umschlag.position.set(0, m.kopfH - 0.07, 0); k.add(umschlag);
        const bommel = rundeKiste(0.11, 0.09, 0.11, ctx.mat('#e8e2d4', { rauheit: 1 }), 0.045);
        bommel.position.set(0, m.kopfH + 0.14, 0); k.add(bommel);
      } else if (v === 'schirm') {
        const s = mat('#3b4650', { rauheit: 0.9 });
        const kappe = rundeKiste(m.kopfB + 0.04, 0.14, m.kopfT + 0.04, s, 0.05);
        kappe.position.set(0, m.kopfH + 0.0, 0); k.add(kappe);
        const schirm = rundeKiste(m.kopfB * 0.7, 0.03, 0.16, s, 0.012);
        schirm.position.set(0, m.kopfH - 0.06, m.kopfT / 2 + 0.07); k.add(schirm);
        for (const sx of [-1, 1]) {
          const ohr = rundeKiste(0.05, 0.16, 0.18, s, 0.025);
          ohr.position.set(sx * (m.kopfB / 2 + 0.02), m.kopfH * 0.6, -0.02); k.add(ohr);
        }
      } else if (v === 'schapka') {
        const fell = ctx.mat('#ffffff', { rauheit: 1, karte: fellTextur(ctx, '#6b5a48'), kante: { farbe: '#ffe8d0', staerke: 0.3, exponent: 2 } });
        const hut = rundeKiste(m.kopfB + 0.1, 0.26, m.kopfT + 0.1, fell, 0.06);
        hut.position.set(0, m.kopfH + 0.05, 0); k.add(hut);
        for (const sx of [-1, 1]) {
          const ohr = rundeKiste(0.07, 0.24, 0.26, fell, 0.035);
          ohr.position.set(sx * (m.kopfB / 2 + 0.04), m.kopfH * 0.55, -0.02); k.add(ohr);
        }
        schoesse(teile, mat(farbe, { rauheit: 0.9 }), { laenge: 1.05 });
      } else {
        const s = mat('#5b4a3a', { rauheit: 0.95, karte: musterTextur(ctx, 'strick') });
        const kappe = rundeKiste(m.kopfB + 0.05, 0.1, m.kopfT + 0.08, s, 0.04);
        kappe.position.set(0, m.kopfH - 0.005, 0.01); k.add(kappe);
        const schirm = rundeKiste(m.kopfB * 0.74, 0.04, 0.12, s, 0.015);
        schirm.position.set(0, m.kopfH - 0.035, m.kopfT / 2 + 0.05); schirm.rotation.x = 0.15; k.add(schirm);
      }
      return {};
    },
  });
  // Kurze Eisangel in der rechten Hand (Rute mit Rolle, Schnur hängt herab)
  if (params.angel) {
    const hand = fig.gelenke.handR;
    const g = new THREE.Group();
    const rute = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.014, 0.62, 6), ctx.mat('#2b2b2e', { rauheit: 0.5 }));
    rute.rotation.x = Math.PI / 2 - 0.5; rute.position.set(0, -0.02, 0.26); g.add(rute);
    const rolle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 10), ctx.mat('#a33a2a', { rauheit: 0.5 }));
    rolle.rotation.z = Math.PI / 2; rolle.position.set(0.03, -0.04, 0.05); g.add(rolle);
    g.position.set(0, -0.08, 0.04);
    hand.add(g);
    const gp = fig.grundpose;
    fig.grundpose = () => { gp(); fig.handForm('R', 'faust'); };
    fig.grundpose();
  }
  dampfFuerFigur(ctx, fig, params);
  return skaliere(fig, params.groesse);
}
