// Mr. Odell (74). Glöckner, Hüter der Regel (Hiding Night) und Kultfigur von „Rules of Kindly“.
// Erkennungsmerkmal: runde Brille aus zwei flachen Ringen, langer brauner Mantel, leicht gebeugt.
// Farben aus serie.md: Mantel #5B4433, Haare #E6E3DC, Brille #2A2A2A, Haut #E2C2A4.
//
// params (Hiding Night): groesse
// params (Rules of Kindly, Bibel §3.3, §4; ohne sie sieht Odell aus wie in Hiding Night):
//   glaeser  "weiss": getragene Gläser spiegeln immer weiß (gilt für alle Kindly-Folgen; Odells Augen kommen
//            nie ins Bild). Std: nur Ringe wie in Hiding Night.
//   brille   "auf" (Std, auf der Nase) | "hand" (abgenommen, in der rechten Hand, klar und beschlagbar) |
//            "keine". Bildregel: ohne Brille nie von vorn (Kamera hinter ihm, über der Schulter, auf den Gläsern).
//   links / rechts  "laterne" | "glocke" | null: was er in der Hand trägt (rechts wird von brille "hand" belegt)
//   laterne_an (Std true), Atemdampf: dampf (Std false wie in Hiding Night; in Kindly draußen true), dampf_aus …
//
// Eigene Animationen (Kindly):
//   brille_hoch    0,5 s  rechte Hand hält die Gläser vor sich in Gesichtshöhe hoch (zum Anhauchen; S6, S37)
//                         params: vor (Std 0,32 m vor den Augen), hoehe (Std −0,12 m), zu (Anker: Gläser schauen
//                         dorthin, Std geradeaus)
//   beschlagen     0,35 s Gläser in der Hand beschlagen weiß (staerke Std 1)
//   bleibt_klar    0,8 s  Gläser bleiben klar: Odell kippt sie prüfend, ein Glanz läuft über das Glas (S38)
//   abwischen      1,2 s  Gläser am Mantel abwischen (kreisend vor der Brust), der Beschlag verschwindet; danach
//                         wieder hoch (params.zurueck Std true) (S7)
//   aufsetzen      0,9 s  Brille aus der Hand auf die Nase; ab 75 % spiegeln die Gläser weiß (S40, ohne Abwischen)
//   brille_ab      0,8 s  umgekehrt: von der Nase in die Hand, dann hoch (params.nach "hoch" | "unten")
//   glocke_laeuten 1,6 s  ein Schlag der Handglocke, danach kleines, gedämpftes Pendeln (S5). Schlag bei 0,15 s.
// Anker (zusätzlich): brille (Mitte der Gläser in der Hand), brille_auf (auf der Nase), glocke, laterne.
import * as THREE from 'three';
import { baueKlotzfigur, skaliere } from '../src/klotzfigur.js';
import { knopfleiste, vAusschnitt } from '../src/kleidung.js';
import { dampfFuerFigur } from '../src/atemdampf.js';
import { baueBrille, baueGlocke, baueLaterne, glockenPendel, glasWeissMat, BRILLE } from '../src/kindly_requisiten.js';
import { zweiGlied, huelle, lokalZuWelt, richteAus } from '../src/ik.js';

export default async function baue(ctx, params = {}) {
  const T = ctx.THREE;
  const getragen = [];       // Teile der Brille auf der Nase (Kindly: in der Hand unsichtbar)
  let brilleMitte = null;
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
        getragen.push(r);
        // Kindly: weiß spiegelnde Gläser in den Ringen (die Augen dahinter sind ganz verdeckt)
        if (params.glaeser === 'weiss') {
          const glas = new T.Mesh(new T.CircleGeometry(BRILLE.glas, 24), glasWeissMat(ctx));
          glas.position.set(r.position.x, r.position.y, m.kopfT / 2 + 0.013);
          k.add(glas);
          getragen.push(glas);
        }
        const buegel = rundeKiste(0.012, 0.012, m.kopfT * 0.5, brille, 0.004, false);
        buegel.position.set(sx * (m.kopfB / 2 + 0.006), m.kopfH * 0.52, m.kopfT * 0.22);
        k.add(buegel);
        getragen.push(buegel);
      }
      const steg = rundeKiste(0.05, 0.012, 0.012, brille, 0.004, false);
      steg.position.set(0, m.kopfH * 0.52, m.kopfT / 2 + 0.015);
      k.add(steg);
      getragen.push(steg);
      brilleMitte = new T.Object3D();
      brilleMitte.position.set(0, m.kopfH * 0.5, m.kopfT / 2 + 0.02);
      k.add(brilleMitte);
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
  fig.anker.brille_auf = brilleMitte;

  // ---------- Kindly: Requisiten in den Händen ----------
  // Ohne die neuen params bleibt Odell genau wie in Hiding Night (keine Zusätze, kein Nachlauf).
  const kindly = params.glaeser || params.brille || params.links || params.rechts || params.dampf;
  if (!kindly) return skaliere(fig, params.groesse);

  const M = fig.masse;
  const modus = params.brille ?? 'auf';
  const haende = { L: params.links ?? null, R: modus === 'hand' ? 'brille' : (params.rechts ?? null) };
  // Brille in der Hand (klar, kann beschlagen). Hängt an der rechten Hand; der Nachlauf stellt sie aufrecht.
  const handBrille = baueBrille(ctx, { glas: 'klar', buegel: 'offen' });
  fig.gelenke.handR.add(handBrille.gruppe);
  const brilleAnker = new T.Object3D();
  handBrille.gruppe.add(brilleAnker);
  fig.anker.brille = brilleAnker;
  // Glocke und Laterne je Hand (nur die angeforderten sind sichtbar)
  const glocke = baueGlocke(ctx);
  const laterne = baueLaterne(ctx, { an: params.laterne_an !== false });
  const glockeSeite = haende.L === 'glocke' ? 'L' : haende.R === 'glocke' ? 'R' : null;
  const laterneSeite = haende.L === 'laterne' ? 'L' : haende.R === 'laterne' ? 'R' : null;
  // Ursprung von Glocke (Griffmitte) und Laterne (Bügel) liegt in der Faust, nicht am Handgelenk
  if (glockeSeite) { fig.gelenke[`hand${glockeSeite}`].add(glocke.gruppe); glocke.gruppe.position.set(0, -M.hand[1] * 0.55, 0.02); }
  if (laterneSeite) { fig.gelenke[`hand${laterneSeite}`].add(laterne.gruppe); laterne.gruppe.position.set(0, -M.hand[1] * 0.55, 0); }
  fig.anker.glocke = glocke.anker;
  fig.anker.laterne = laterne.anker.glas;

  // Zustand je Bild (grundpose setzt zurück, Aktionen ändern, Nachlauf wendet an)
  const z = { auf: modus === 'auf', hand: modus === 'hand', beschlag: 0, glanz: 0.35, kipp: 0, blick: null, wischen: false, schlag: null };
  const gp = fig.grundpose;
  fig.grundpose = () => {
    gp();
    z.auf = modus === 'auf'; z.hand = modus === 'hand'; z.beschlag = 0; z.glanz = 0.35; z.kipp = 0; z.blick = null; z.wischen = false; z.schlag = null;
    for (const s of ['L', 'R']) if (haende[s]) fig.handForm(s, 'faust');
    glocke.pendel.rotation.set(0, 0, 0); glocke.kloeppel.rotation.set(0, 0, 0);
  };
  fig.grundpose();

  // Nachlauf nach allen Aktionen (welt.js ruft fig.aktualisiere(t)): Sichtbarkeit, Gläser aufrecht halten,
  // Laterne hängt senkrecht, Glocke pendelt nach dem Schlag.
  fig.aktualisiere = (t) => {
    for (const o of getragen) o.visible = z.auf && modus !== 'keine';
    handBrille.gruppe.visible = z.hand;
    handBrille.setzeBeschlag(z.beschlag);
    handBrille.setzeGlanz(z.glanz);
    fig.gruppe.updateMatrixWorld(true);
    // Hand-Brille: zwischen Daumen und Zeigefinger, 9 cm zur Körpermitte versetzt, Gläser aufrecht
    const hand = fig.anker.hand_r.getWorldPosition(new T.Vector3());
    const gq = fig.gruppe.getWorldQuaternion(new T.Quaternion());
    const vor = new T.Vector3(0, 0, 1).applyQuaternion(gq);
    const links = new T.Vector3(1, 0, 0).applyQuaternion(gq);
    let blick = vor.clone();
    if (z.blick) blick = z.blick.clone().setY(0).normalize();
    if (z.wischen) blick = vor.clone().negate();
    const pos = hand.clone().addScaledVector(links, 0.085).add(new T.Vector3(0, 0.03, 0));
    const ziel = new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(new T.Vector3(), blick.clone().negate(), new T.Vector3(0, 1, 0)));
    ziel.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), z.kipp));
    handBrille.gruppe.parent.updateWorldMatrix(true, false);
    handBrille.gruppe.position.copy(handBrille.gruppe.parent.worldToLocal(pos));
    richteAus(handBrille.gruppe, ziel, 1);
    // Laterne hängt senkrecht am Bügel (nur Drehung um y wie die Figur)
    if (laterneSeite) richteAus(laterne.gruppe, gq, 1);
    if (glockeSeite) {
      richteAus(glocke.gruppe, gq, 1);
      if (z.schlag !== null) {
        const p = glockenPendel(t - z.schlag);
        glocke.pendel.rotation.x = p.glocke;
        glocke.kloeppel.rotation.x = p.kloeppel;
      }
    }
  };

  // ---------- Animationen ----------
  // Punkt vor dem Gesicht: von den Augen aus vorM Meter in Blickrichtung der Figur, etwas nach rechts und unten
  // (Odell ist gebeugt: das Gesicht liegt schon gut 0,3 m vor den Füßen). Liegt er außer Reichweite, streckt die
  // IK den Arm ganz aus: die Brille wird „mit ausgestrecktem Arm“ hingehalten.
  const vorPunkt = (vorM, hoeheRel) => {
    const augen = fig.anker.augen.getWorldPosition(new T.Vector3());
    const q = fig.gruppe.getWorldQuaternion(new T.Quaternion());
    return augen.add(new T.Vector3(-0.1, hoeheRel, vorM).applyQuaternion(q));
  };
  fig.animationen = {
    brille_hoch: {
      dauer: 0.5, ease: 'ease_out',
      anwenden(f, p, prm, c) {
        z.hand = true; z.auf = false;
        zweiGlied(f, 'R', vorPunkt(prm.vor ?? 0.32, prm.hoehe ?? -0.12), p);
        if (prm.zu !== undefined) z.blick = c.zielPunkt(prm.zu).sub(fig.gruppe.position);
      },
    },
    beschlagen: {
      dauer: 0.35, ease: 'ease_out',
      anwenden(f, p, prm, c) { z.beschlag = c.mischen(z.beschlag, prm.staerke ?? 1, p); },
    },
    bleibt_klar: {
      dauer: 0.8, ease: 'linear',
      anwenden(f, p, prm, c) {
        const u = c.roh;
        z.beschlag = 0;
        z.kipp = 0.32 * Math.sin(Math.PI * Math.min(1, u * 1.25));
        z.glanz = 0.35 + 0.65 * Math.sin(Math.PI * u);
        f.gelenke.kopf.rotation.x += 0.12 * huelle(u, 0.2, 0);      // er schaut auf die Gläser
      },
    },
    abwischen: {
      dauer: 1.2, ease: 'linear',
      anwenden(f, p, prm, c) {
        const u = c.roh;
        const zurueck = prm.zurueck !== false;
        const hin = huelle(u, 0.2, zurueck ? 0 : 0.2);
        const reiben = u > 0.2 && u < (zurueck ? 0.75 : 0.8);
        // vor der Brust kreisen (3 Kreise/s, Radius 3 cm), danach zurück in die Haltung vor dem Gesicht
        const w = c.tLokal * Math.PI * 2 * 3;
        const brust = lokalZuWelt(f.gelenke.rumpf, 0.02 + (reiben ? Math.cos(w) * 0.03 : 0), M.rumpfH * 0.62 + (reiben ? Math.sin(w) * 0.03 : 0), M.rumpfT / 2 + 0.14);
        const hoch = vorPunkt(prm.vor ?? 0.32, prm.hoehe ?? -0.12);
        const zurueckAnteil = zurueck ? huelle(Math.max(0, (u - 0.75) / 0.25), 1, 0) : 0;
        const ziel = brust.clone().lerp(hoch, zurueckAnteil);
        zweiGlied(f, 'R', ziel, Math.max(hin, zurueckAnteil));
        z.wischen = u < 0.8;
        if (u > 0.2) z.beschlag = z.beschlag * (1 - Math.min(1, (u - 0.2) / 0.5));
        f.gelenke.kopf.rotation.x += 0.15 * hin * (1 - zurueckAnteil);
      },
    },
    aufsetzen: {
      dauer: 0.9, ease: 'linear',
      anwenden(f, p, prm, c) {
        const u = c.roh;
        const gesicht = lokalZuWelt(f.gelenke.kopf, -0.08, M.kopfH * 0.42, M.kopfT / 2 + 0.16);
        const hin = huelle(u, 0.5, 0.25);
        zweiGlied(f, 'R', gesicht, hin);
        if (u >= 0.75) { z.hand = false; z.auf = true; }
        else { z.hand = true; z.auf = false; }
      },
    },
    brille_ab: {
      dauer: 0.8, ease: 'linear',
      anwenden(f, p, prm, c) {
        const u = c.roh;
        const gesicht = lokalZuWelt(f.gelenke.kopf, -0.08, M.kopfH * 0.42, M.kopfT / 2 + 0.16);
        const nachHoch = (prm.nach ?? 'hoch') === 'hoch';
        const zum = huelle(u, 0.35, 0);
        const weg = Math.max(0, (u - 0.4) / 0.6);
        const ziel = gesicht.clone().lerp(nachHoch ? vorPunkt(0.32, -0.12) : lokalZuWelt(f.gruppe, -0.22, 0.75, 0.08), weg * weg * (3 - 2 * weg));
        zweiGlied(f, 'R', ziel, nachHoch ? zum : zum * (1 - weg));
        if (u >= 0.35) { z.hand = true; z.auf = false; } else { z.hand = false; z.auf = true; }
      },
    },
    glocke_laeuten: {
      dauer: 1.6, ease: 'linear',
      anwenden(f, p, prm, c) {
        if (!glockeSeite) return;
        const u = c.tLokal;
        const S = glockeSeite;
        // Unterarm hebt sich, kurzer Ruck nach oben und zurück (Schlag bei 0,15 s), dann ruhig halten und senken
        const heben = huelle(c.roh, 0.08, 0.3);
        const ruck = u > 0.08 && u < 0.26 ? Math.sin(Math.PI * (u - 0.08) / 0.18) : 0;
        f.gelenke[`arm${S}`].rotation.x -= (0.35 + 0.12 * ruck) * heben;
        f.gelenke[`unterarm${S}`].rotation.x -= (0.75 + 0.3 * ruck) * heben;
        if (u >= 0.15) z.schlag = c.t - (u - 0.15);
      },
    },
  };
  // Atemdampf (Kindly: draußen dampft Odells Atem, S38 zieht er von oben ins Bild); Std aus wie in Hiding Night
  dampfFuerFigur(ctx, fig, params, { an: false });
  return skaliere(fig, params.groesse);
}
