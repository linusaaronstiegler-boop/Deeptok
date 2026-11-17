// Gus (27), Bears älterer Bruder, Schutzfigur in „Rules of Kindly“ Folge 1 (Bibel §10.2).
// Erkennungsmerkmal: rot-schwarz karierte Wolljacke (#9E2B25 / #1E1F22), Mütze mit Ohrenklappen, breit,
// Bartklotz, Eispickel (Stange mit Stahlspitze) in der rechten Hand.
// Gesichter: ernst, warnend, entschlossen, nass (nass-äugig, Hütte), leer (Deckel) und der Hausstil-Satz.
// params: groesse (Std 1), pickel (Std true), Atemdampf (src/atemdampf.js: dampf, dampf_aus, …)
// Eigene Animation:
//   tippen  Std 1,2 s, linear. Der Pickel tippt dreimal aufs Eis vor ihm (S24: „Before every step, he taps
//           the ice three times.“). params: schlaege (Std 3), zu ([x, y, z] | Anker; Std 0,5 m vor Gus auf
//           dem Boden), hoehe (Std 0,13 m Ausholen). Jeder Schlag endet mit der Spitze auf dem Ziel; der
//           k-te Aufprall (k = 0, 1, 2) liegt beim Fortschritt treffer(k) = 0,14 + (k + 0,75) / 3 · 0,72
//           (bei 1,2 s: 0,38 / 0,67 / 0,96 s nach dem Start; für die Effekte „Pickel auf Eis“).
// Anker: zusätzlich "pickel_spitze" (für Kamera, Schnee-Partikel, Effekt-Zeit).
import * as THREE from 'three';
import { baueKlotzfigur, skaliere } from '../src/klotzfigur.js';
import { knopfleiste, naht } from '../src/kleidung.js';
import { karoTextur, ohrenklappenMuetze } from '../src/kindly_kleidung.js';
import { dampfFuerFigur } from '../src/atemdampf.js';
import { zweiGlied, huelle, richteAus } from '../src/ik.js';

export const FARBEN = { rot: '#9E2B25', schwarz: '#1E1F22', bart: '#8A5634', haut: '#DDB592', hose: '#3E3B38', stiefel: '#3A2C22' };

// Zeitplan der Schläge im Fortschritt 0..1: Arm hebt in 0..0,14 (Spitze aufs Ziel), die Schläge füllen
// 0,14..0,86, Arm senkt danach. Ein Schlag = Anheben, Zuschlagen, kurz liegen; Aufprall bei 75 % des Abschnitts.
export function treffer(k, n = 3) { return 0.14 + ((k + 0.75) / n) * 0.72; }

export default async function baue(ctx, params = {}) {
  const F = FARBEN;
  const M = {
    kopfB: 0.58, kopfH: 0.54, kopfT: 0.52,
    rumpfOben: 0.66, rumpfUnten: 0.56, rumpfH: 0.6, rumpfT: 0.34,
    beckenB: 0.52,
    oberarm: 0.27, unterarm: 0.23, armD: 0.16, hand: [0.085, 0.16, 0.13],
    oberschenkel: 0.25, unterschenkel: 0.22, beinD: 0.18, beinAbstand: 0.25,
    schuh: { b: 0.19, h: 0.13, l: 0.34 },
  };
  // Karo in gleicher Größe auf Rumpf und Ärmeln (eigene Textur-Kopie je Flächengröße)
  const jacke = ctx.mat('#ffffff', { rauheit: 0.95, karte: karoTextur(ctx, F.rot, F.schwarz, M.rumpfOben, M.rumpfH), kante: { farbe: '#ffd6c8', staerke: 0.22, exponent: 3 } });
  const aermel = ctx.mat('#ffffff', { rauheit: 0.95, karte: karoTextur(ctx, F.rot, F.schwarz, M.armD * 2, M.oberarm), kante: { farbe: '#ffd6c8', staerke: 0.22, exponent: 3 } });
  const fig = baueKlotzfigur(ctx, {
    masse: M,
    farben: {
      haut: F.haut, oberteil: F.rot, buendchen: '#2a2224', hose: F.hose,
      schuh: F.stiefel, sohle: '#1c1612', senkel: '#B08A58', iris: '#2c1d14', brauen: '#4a3020',
    },
    matOben: jacke, matAermel: aermel,
    schuh: { art: 'stiefel', kante: '#2a1f18' },
    gesicht: { augenAbstand: 0.19, augenHoehe: 0.46, mundHoehe: 0.68, augenGroesse: 0.94 },
    vorne: (g, w, h) => {
      // Knopfleiste und zwei Brusttaschen mit Patte (dunkle Aufkleber über dem Karo)
      knopfleiste(g, w, h, { farbe: '#141416', anzahl: 5, von: 0.1, bis: 0.9, x: 0.5 });
      for (const x of [0.16, 0.6]) {
        g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(w * x, h * 0.18, w * 0.24, h * 0.07);
        naht(g, w, w * x, h * 0.36, w * (x + 0.24), h * 0.36, 'rgba(0,0,0,0.35)');
        g.fillStyle = '#141416'; g.beginPath(); g.arc(w * (x + 0.12), h * 0.235, w * 0.016, 0, 2 * Math.PI); g.fill();
      }
    },
    schmuck: (teile) => {
      const { gelenke, masse: m, mat, rundeKiste } = teile;
      const k = gelenke.kopf;
      ohrenklappenMuetze(teile, { farbe: '#7A5A3C' });
      // Vollbart als Klotz (Mund bleibt darüber frei), Koteletten bis unter die Ohrenklappen
      const bart = mat(F.bart, { rauheit: 0.95, kante: { farbe: '#ffd8c0', staerke: 0.3, exponent: 2.6 } });
      const kinn = rundeKiste(m.kopfB * 0.86, 0.15, 0.09, bart, 0.035);
      kinn.position.set(0, 0.07, m.kopfT / 2 + 0.012);
      k.add(kinn);
      for (const sx of [-1, 1]) {
        const backe = rundeKiste(0.08, 0.26, m.kopfT * 0.62, bart, 0.03);
        backe.position.set(sx * (m.kopfB / 2 - 0.012), 0.16, 0.06);
        k.add(backe);
      }
      // Kragen der Wolljacke (dunkel, hochgestellt)
      const kragen = rundeKiste(m.rumpfOben * 0.86, 0.1, m.rumpfT * 1.02, mat('#2a2224', { rauheit: 0.95 }), 0.035);
      kragen.position.set(0, m.rumpfH - 0.005, -0.01);
      gelenke.rumpf.add(kragen);
      return {};
    },
  });

  // ---------- Eispickel: Holzgriff oben, Stahlstange, Meißelspitze unten ----------
  // Er hängt in der rechten Faust; die Stange läuft vor den Fingern (lokal +z der Hand), sonst stäke sie
  // im Unterarm. Länge unten so, dass die Spitze in der Grundpose knapp über dem Boden schwebt.
  const handR = fig.gelenke.handR;
  const pickel = new THREE.Group();
  pickel.name = 'pickel';
  fig.grundpose();
  fig.gruppe.updateMatrixWorld(true);
  const handY = handR.getWorldPosition(new THREE.Vector3()).y - M.hand[1] * 0.45;
  const unten = Math.max(0.3, handY - 0.04);           // von der Faust bis zur Spitze
  const oben = 0.42;                                   // Griff über der Faust
  const holz = ctx.mat('#7A5634', { rauheit: 0.75, kante: { farbe: '#ffe2c0', staerke: 0.25 } });
  const stahl = ctx.mat('#9aa3ad', { rauheit: 0.35, metall: 0.6, kante: { farbe: '#e8f2ff', staerke: 0.4, exponent: 2 } });
  const griff = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, oben + 0.1, 10), holz);
  griff.position.y = (oben + 0.1) / 2 - 0.1;
  griff.castShadow = true;
  pickel.add(griff);
  const knauf = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.03, 0.04, 10), holz);
  knauf.position.y = oben;
  pickel.add(knauf);
  const stange = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, unten - 0.12, 8), stahl);
  stange.position.y = -0.1 - (unten - 0.22) / 2;
  stange.castShadow = true;
  pickel.add(stange);
  const spitze = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 4), stahl);
  spitze.rotation.x = Math.PI;
  spitze.position.y = -unten + 0.06;
  spitze.castShadow = true;
  pickel.add(spitze);
  const spitzenAnker = new THREE.Object3D();
  spitzenAnker.position.y = -unten;
  pickel.add(spitzenAnker);
  pickel.position.set(0, -M.hand[1] * 0.45, M.hand[2] * 0.5 + 0.022);
  handR.add(pickel);
  pickel.visible = params.pickel !== false;
  fig.anker.pickel_spitze = spitzenAnker;

  const gp = fig.grundpose;
  fig.grundpose = () => { gp(); fig.handForm('R', params.pickel !== false ? 'faust' : 'offen'); };
  fig.grundpose();

  // ---------- tippen: dreimal mit der Spitze aufs Eis ----------
  const _hoch = new THREE.Vector3(0, 1, 0);
  fig.animationen = {
    tippen: {
      dauer: 1.2,
      ease: 'linear',
      anwenden(f, p, prm, c) {
        const n = prm.schlaege ?? 3;
        const g = f.gruppe;
        const vor = new THREE.Vector3(Math.sin(g.rotation.y), 0, Math.cos(g.rotation.y));
        const rechts = new THREE.Vector3(-vor.z, 0, vor.x);
        const ziel = prm.zu !== undefined ? c.zielPunkt(prm.zu)
          : g.position.clone().addScaledVector(vor, 0.5).addScaledVector(rechts, 0.2).setY(g.position.y);
        const u = c.roh;
        const arm = huelle(u, 0.14, 0.14);
        // Höhe der Spitze: je Schlag hoch und wieder herunter, Aufprall am Ende des Abschnitts
        let h = prm.hoehe ?? 0.13;
        if (u > 0.14 && u < 0.86) {
          const x = ((u - 0.14) / 0.72) * n;
          const f1 = x - Math.floor(x);
          // anheben (0–60 %), zuschlagen (60–75 %), auf dem Eis liegen (75–100 %): drei Aufpralle
          h *= f1 < 0.6 ? Math.sin((Math.PI / 2) * (f1 / 0.6)) : f1 < 0.75 ? Math.cos((Math.PI / 2) * ((f1 - 0.6) / 0.15)) : 0;
        }
        const spitzeZiel = ziel.clone().add(new THREE.Vector3(0, h, 0));
        // Stange leicht zur Figur geneigt (oben näher am Körper), Hand am Griff
        const achse = _hoch.clone().addScaledVector(vor, -0.22).normalize();
        // Faust so drehen, dass ihre −y-Achse entlang der Stange nach unten zeigt (Stange vor den Fingern):
        // lokal y = Stangenachse, lokal z = nach vorn (dort liegt die Stange), x = y × z
        const y = achse.clone();
        const x = new THREE.Vector3().crossVectors(y, vor).normalize();
        const z = new THREE.Vector3().crossVectors(x, y).normalize();
        const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
        // Handmitte (Ziel der IK) = Spitze + Stange bis zur Faust − Versatz der Stange vor den Fingern
        const hand = spitzeZiel.clone().addScaledVector(achse, unten).addScaledVector(z, -pickel.position.z);
        zweiGlied(f, 'R', hand, arm, { pol: [0.7, -0.2, -0.7] });
        richteAus(f.gelenke.handR, q, arm);
        f.gelenke.rumpf.rotation.x += 0.1 * arm;
        f.gelenke.kopf.rotation.x += 0.18 * arm;      // er schaut aufs Eis
      },
    },
  };
  dampfFuerFigur(ctx, fig, params);
  return skaliere(fig, params.groesse);
}
