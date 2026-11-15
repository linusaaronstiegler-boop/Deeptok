// Klötzchenfigur im Hausstil der Serie (episoden/folge-01/serie.md, "Hausstil").
// Bewusst KEIN R6/R15-Nachbau:
//   - Kopf groß (etwa 30 % der Körperhöhe, R6 etwa 20 %), Würfel mit runden Kanten
//   - Rumpf schmal und trapezförmig (oben breiter)
//   - Arme aus zwei runden Quadern (Ellbogen), Fäustlingshände mit eigenem Daumenklotz
//   - kurze Beine (etwa 30 % der Höhe) mit Knie, darunter große Schuhklötze
//   - Kleidung als Farbflächen plus Aufkleber (Reißverschluss, Taschen, Nähte)
//   - Gesichter als getauschte Texturen (src/gesichter.js)
//
// Das Gerüst hält sich an die Namen des Standard-Rigs (src/rig.js), damit alle gemeinsamen
// Animationen passen: huefte → rumpf → kopf, armL/armR (+ unterarmL/R, handL/R),
// huefte → beinL/beinR (+ unterbeinL/R, fussL/R). Glieder hängen entlang −y,
// rotation.x negativ = nach vorn, Knie: rotation.x positiv = Unterschenkel nach hinten.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { zeichneGesicht, ausdruck, AUSDRUECKE, ALIAS } from './gesichter.js';

const geoCache = new Map();
function geo(schluessel, bauen) {
  if (!geoCache.has(schluessel)) geoCache.set(schluessel, bauen());
  return geoCache.get(schluessel);
}

// Runde Kiste ohne ctx (Figuren bauen viele kleine Teile; Geometrien werden geteilt).
export function rundeKiste(b, h, t, material, r = 0.02, schatten = true) {
  const rr = Math.min(r, b / 2 - 1e-4, h / 2 - 1e-4, t / 2 - 1e-4);
  const g = geo(`rk|${b}|${h}|${t}|${rr}`, () => (rr > 0.002 ? new RoundedBoxGeometry(b, h, t, 2, rr) : new THREE.BoxGeometry(b, h, t)));
  const m = new THREE.Mesh(g, material);
  m.castShadow = schatten;
  m.receiveShadow = true;
  return m;
}

// Trapez-Kiste: unten schmaler als oben (Rumpf). Die Normalen bleiben die der runden Kiste;
// die Seiten sind nur wenige Grad geneigt, das sieht man nicht.
export function trapezKiste(bOben, bUnten, h, t, material, r = 0.04) {
  const g = geo(`tz|${bOben}|${bUnten}|${h}|${t}|${r}`, () => {
    const k = new RoundedBoxGeometry(bOben, h, t, 2, Math.min(r, bUnten / 2 - 1e-3, h / 2 - 1e-3, t / 2 - 1e-3));
    const pos = k.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const f = THREE.MathUtils.lerp(bUnten / bOben, 1, (pos.getY(i) + h / 2) / h);
      pos.setX(i, pos.getX(i) * f);
    }
    return k;
  });
  const m = new THREE.Mesh(g, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// Aufkleber: flache Fläche mit Zeichnung (Reißverschluss, Taschen, Knöpfe, Nähte).
// Durchsichtige Stellen werden mit alphaToCoverage geglättet (4×MSAA der Engine).
export function aufkleber(ctx, b, h, zeichne, pixelProMeter = 900) {
  const W = Math.max(32, Math.min(1024, Math.round(b * pixelProMeter)));
  const H = Math.max(32, Math.min(1024, Math.round(h * pixelProMeter)));
  const tex = ctx.zeichenTextur((g, w, hh) => { g.clearRect(0, 0, w, hh); zeichne(g, w, hh); }, W, H);
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, alphaTest: 0.5 });
  m.alphaToCoverage = true;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(b, h), m);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  return mesh;
}

// Strick- oder Stoffmuster als wiederholte Textur (Mützen, Strickjacken).
export function musterTextur(ctx, art, farbe = '#ffffff') {
  return ctx.zeichenTextur((g, w, h) => {
    g.fillStyle = farbe; g.fillRect(0, 0, w, h);
    if (art === 'strick') {
      // Maschen als kleine V-Reihen
      g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = w / 48;
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
        const cx = (x + 0.5) * w / 8, cy = (y + 0.5) * h / 8;
        g.beginPath(); g.moveTo(cx - w / 20, cy - h / 22); g.lineTo(cx, cy + h / 22); g.lineTo(cx + w / 20, cy - h / 22); g.stroke();
      }
    } else if (art === 'jeans') {
      g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 1;
      for (let i = -h; i < w; i += 3) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); }
    } else if (art === 'rippen') {
      g.fillStyle = 'rgba(0,0,0,0.13)';
      for (let x = 0; x < w; x += w / 10) g.fillRect(x, 0, w / 30, h);
    }
  }, 64, 64);
}

// ---------- Schuhe (auch für die Requisite "schuhpaar") ----------
// stil: { farbe, sohle, senkel, art: 'turnschuh' | 'stiefel' | 'hightop' | 'halbschuh', schleife }
// Ursprung oben am Knöchel, Spitze zeigt nach +z.
export function baueSchuh(ctx, stil, masse = {}) {
  const b = masse.b ?? 0.17, h = masse.h ?? 0.12, l = masse.l ?? 0.32;
  const gruppe = new THREE.Group();
  const matSchuh = ctx.mat(stil.farbe, { rauheit: 0.75 });
  const matSohle = ctx.mat(stil.sohle ?? '#ebe8e1', { rauheit: 0.9 });
  const hoch = stil.art === 'stiefel' || stil.art === 'hightop' ? 0.06 : 0;
  const koerper = rundeKiste(b, h + hoch, l, matSchuh, 0.035);
  koerper.position.set(0, -(h - hoch) / 2, l * 0.17);
  gruppe.add(koerper);
  const sohle = rundeKiste(b * 1.04, h * 0.3, l * 1.03, matSohle, 0.02);
  sohle.position.set(0, -h + h * 0.15, l * 0.17);
  gruppe.add(sohle);
  if (stil.art === 'stiefel') {
    // Absatz und Schaftkante
    const kante = rundeKiste(b * 1.05, 0.03, l * 0.45, ctx.mat(stil.kante ?? stil.farbe, { rauheit: 0.6 }), 0.012);
    kante.position.set(0, hoch + 0.002, -l * 0.08);
    gruppe.add(kante);
  }
  if (stil.senkel) {
    // Schnürung: drei Querbalken auf dem Rist, optional eine Schleife (June: doppelt geknotet)
    const matS = ctx.mat(stil.senkel, { rauheit: 0.8 });
    for (let i = 0; i < 3; i++) {
      const s = rundeKiste(b * 0.62, 0.016, 0.026, matS, 0.006, false);
      s.position.set(0, -(h - hoch) / 2 + (h + hoch) / 2 + 0.004 - i * 0.012, l * 0.22 + i * 0.045);
      s.rotation.x = 0.25;
      gruppe.add(s);
    }
    if (stil.schleife) {
      for (const sx of [-1, 1]) {
        const sch = rundeKiste(0.05, 0.016, 0.035, matS, 0.008, false);
        sch.position.set(sx * 0.028, hoch + 0.012, l * 0.19);
        sch.rotation.y = sx * 0.5;
        gruppe.add(sch);
      }
    }
  }
  if (stil.streifen) {
    // seitlicher Streifen (Turnschuh)
    for (const sx of [-1, 1]) {
      const st = rundeKiste(0.006, 0.03, l * 0.45, ctx.mat(stil.streifen), 0.002, false);
      st.position.set(sx * (b * 0.5 + 0.002), -h * 0.45, l * 0.12);
      gruppe.add(st);
    }
  }
  return gruppe;
}

// ---------- Gesichtssatz mit Textur-Tausch ----------
// Texturen entstehen erst beim ersten Gebrauch (spart Speicher: 512er-Karten, viele Ausdrücke).
export function baueGesichtssatz(ctx, stil, breite, hoehe, aufloesung = 512) {
  const W = aufloesung, H = Math.round(aufloesung * (hoehe / breite));
  const karten = new Map();
  const karte = (name, zu) => {
    const k = `${name}|${zu ? 1 : 0}`;
    if (!karten.has(k)) {
      ausdruck(name); // wirft bei unbekanntem Namen eine verständliche Fehlermeldung
      karten.set(k, ctx.zeichenTextur((g, w, h) => zeichneGesicht(g, w, h, name, stil, zu), W, H));
    }
    return karten.get(k);
  };
  const material = new THREE.MeshStandardMaterial({ map: karte('neutral', false), roughness: 0.72 });
  let aktuell = 'neutral|0';
  return {
    material,
    setze(name, zu = false) {
      const k = `${name}|${zu ? 1 : 0}`;
      if (k === aktuell) return;
      material.map = karte(name, zu);
      aktuell = k;
    },
  };
}

// ---------- Die Figur ----------
// o.masse: siehe STANDARD unten (Meter). o.farben: haut, oberteil, aermel, buendchen, hose, schuh,
// sohle, senkel, iris, brauen. o.schuh: Stil für baueSchuh. o.gesicht: Stil für zeichneGesicht.
// o.vorne / o.hinten / o.becken: Zeichenfunktionen (g, w, h) für Aufkleber auf Rumpf und Becken.
// o.schmuck(teile): Haare, Mützen, Brillen, Kapuzen … anhängen. o.haltung: { rumpf, kopf } (rad).
const STANDARD = {
  kopfB: 0.56, kopfH: 0.53, kopfT: 0.5, kopfRund: 0.1, hals: 0.05,
  rumpfOben: 0.54, rumpfUnten: 0.42, rumpfH: 0.56, rumpfT: 0.28, rumpfRund: 0.05,
  beckenH: 0.12, beckenB: 0.42,
  oberarm: 0.26, unterarm: 0.22, armD: 0.14, hand: [0.075, 0.15, 0.12],
  oberschenkel: 0.25, unterschenkel: 0.21, beinD: 0.165, beinAbstand: 0.21,
  schuh: { b: 0.17, h: 0.12, l: 0.32 },
  armRuhe: 0.07, rund: 0.035,
};

export function baueKlotzfigur(ctx, o = {}) {
  const m = { ...STANDARD, ...(o.masse ?? {}) };
  m.schuh = { ...STANDARD.schuh, ...(o.masse?.schuh ?? {}) };
  const f = { haut: '#e8c9a8', oberteil: '#888888', hose: '#555a60', schuh: '#f2f2ee', ...(o.farben ?? {}) };
  const mat = (farbe, opt = {}) => ctx.mat(farbe, { rauheit: 0.82, ...opt });
  const matHaut = mat(f.haut, { rauheit: 0.68 });
  const matOben = o.matOben ?? mat(f.oberteil);
  const matAermel = o.matAermel ?? mat(f.aermel ?? f.oberteil);
  const matHose = o.matHose ?? mat(f.hose);

  const gruppe = new THREE.Group();
  const huefteHoehe = m.oberschenkel + m.unterschenkel + m.schuh.h;
  const huefte = new THREE.Group();
  huefte.position.y = huefteHoehe;
  gruppe.add(huefte);

  // Becken in Hosenfarbe, verbindet Beine und Rumpf
  const becken = rundeKiste(m.beckenB, m.beckenH, m.rumpfT * 0.92, matHose, m.rund);
  becken.position.y = m.beckenH / 2 - 0.05;
  huefte.add(becken);

  const rumpf = new THREE.Group();
  rumpf.position.y = m.beckenH - 0.06;
  huefte.add(rumpf);
  const rumpfMesh = trapezKiste(m.rumpfOben, m.rumpfUnten, m.rumpfH, m.rumpfT, matOben, m.rumpfRund);
  rumpfMesh.position.y = m.rumpfH / 2;
  rumpf.add(rumpfMesh);
  const randBreite = (yNorm) => THREE.MathUtils.lerp(m.rumpfUnten, m.rumpfOben, yNorm); // yNorm 0 unten .. 1 oben
  const rumpfAufkleber = (zeichne, seite) => {
    if (!zeichne) return null;
    const a = aufkleber(ctx, m.rumpfOben, m.rumpfH, (g, w, h) => zeichne(g, w, h, (y) => randBreite(1 - y) / m.rumpfOben));
    a.position.set(0, m.rumpfH / 2, seite * (m.rumpfT / 2 + 0.003));
    if (seite < 0) a.rotation.y = Math.PI;
    rumpf.add(a);
    return a;
  };
  rumpfAufkleber(o.vorne, 1);
  rumpfAufkleber(o.hinten, -1);
  if (o.becken) {
    const a = aufkleber(ctx, m.beckenB, m.beckenH, o.becken);
    a.position.set(0, m.beckenH / 2 - 0.05, m.rumpfT * 0.46 + 0.003);
    huefte.add(a);
  }

  // Hals und Kopf
  const hals = rundeKiste(0.14, m.hals + 0.06, 0.14, matHaut, 0.03, false);
  hals.position.y = m.rumpfH + m.hals / 2 - 0.01;
  rumpf.add(hals);
  const kopf = new THREE.Group();
  kopf.position.y = m.rumpfH + m.hals;
  rumpf.add(kopf);
  const kopfMesh = rundeKiste(m.kopfB, m.kopfH, m.kopfT, matHaut, m.kopfRund);
  kopfMesh.position.y = m.kopfH / 2;
  kopf.add(kopfMesh);

  // Gesicht: Fläche auf der flachen Vorderseite des Kopfes
  const gb = m.kopfB - m.kopfRund * 1.6, gh = m.kopfH - m.kopfRund * 1.6;
  const satz = baueGesichtssatz(ctx, { haut: f.haut, iris: f.iris ?? '#2b1d14', brauen: f.brauen, ...(o.gesicht ?? {}) }, gb, gh, o.gesichtAufloesung ?? 512);
  const gesichtMesh = new THREE.Mesh(new THREE.PlaneGeometry(gb, gh), satz.material);
  gesichtMesh.position.set(0, m.kopfH / 2, m.kopfT / 2 + 0.002);
  gesichtMesh.receiveShadow = true;
  kopf.add(gesichtMesh);

  // Arme: Oberarm, Unterarm, Fäustlingshand mit Daumen (+ versteckter Zeigefinger für Gesten)
  const haende = {};
  const baueArm = (seite) => {
    const s = seite === 'L' ? 1 : -1;
    const arm = new THREE.Group();
    arm.position.set(s * (m.rumpfOben / 2 + m.armD * 0.32), m.rumpfH - m.armD * 0.55, 0);
    rumpf.add(arm);
    const ober = rundeKiste(m.armD, m.oberarm + m.armD * 0.35, m.armD, matAermel, m.rund);
    ober.position.y = -m.oberarm / 2 + m.armD * 0.17;
    arm.add(ober);
    if (o.kurzeAermel) {
      // kurzer Ärmel endet über dem Ellbogen, darunter Haut
      ober.scale.y = 0.62; ober.position.y = -m.oberarm * 0.25 + m.armD * 0.17;
      const haut = rundeKiste(m.armD * 0.9, m.oberarm * 0.5, m.armD * 0.9, matHaut, m.rund);
      haut.position.y = -m.oberarm * 0.72;
      arm.add(haut);
    }
    const unter = new THREE.Group();
    unter.position.y = -m.oberarm;
    arm.add(unter);
    // Unterarm: Ärmelfarbe oder Haut (kurze Ärmel: o.matUnterarm = Hautmaterial)
    const unterMesh = rundeKiste(m.armD * 0.94, m.unterarm + 0.04, m.armD * 0.94, o.kurzeAermel ? matHaut : matAermel, m.rund);
    unterMesh.position.y = -m.unterarm / 2 + 0.02;
    unter.add(unterMesh);
    if (f.buendchen && !o.kurzeAermel) {
      const b = rundeKiste(m.armD * 1.0, 0.045, m.armD * 1.0, mat(f.buendchen), 0.012);
      b.position.y = -m.unterarm + 0.03;
      unter.add(b);
    }
    const hand = new THREE.Group();
    hand.position.y = -m.unterarm;
    unter.add(hand);
    const [hb, hl, ht] = m.hand;
    const faeustling = rundeKiste(hb, hl, ht, matHaut, 0.03);
    faeustling.position.y = -hl / 2 + 0.01;
    hand.add(faeustling);
    const daumen = rundeKiste(hb * 0.72, hl * 0.52, hb * 0.72, matHaut, 0.022);
    daumen.position.set(-s * hb * 0.32, -hl * 0.36, ht * 0.5);
    daumen.rotation.x = -0.35;
    hand.add(daumen);
    const finger = rundeKiste(hb * 0.62, hl * 0.62, hb * 0.62, matHaut, 0.02);
    finger.position.set(0, -hl - hl * 0.22, ht * 0.28);
    finger.visible = false;
    hand.add(finger);
    const spitze = new THREE.Object3D();
    spitze.position.set(0, -hl * 0.55, 0);
    hand.add(spitze);
    haende[seite] = { faeustling, finger, hl };
    return { arm, unter, hand, spitze };
  };
  const aL = baueArm('L'), aR = baueArm('R');

  // Beine mit Knie, Schuhe als große Klötze
  const baueBein = (seite) => {
    const s = seite === 'L' ? 1 : -1;
    const bein = new THREE.Group();
    bein.position.set(s * m.beinAbstand / 2, 0, 0);
    huefte.add(bein);
    const ober = rundeKiste(m.beinD, m.oberschenkel + 0.07, m.beinD, matHose, m.rund);
    ober.position.y = -m.oberschenkel / 2 + 0.035;
    bein.add(ober);
    const unter = new THREE.Group();
    unter.position.y = -m.oberschenkel;
    bein.add(unter);
    const unterMesh = rundeKiste(m.beinD * 0.96, m.unterschenkel + 0.04, m.beinD * 0.96, matHose, m.rund);
    unterMesh.position.y = -m.unterschenkel / 2 + 0.02;
    unter.add(unterMesh);
    const fuss = new THREE.Group();
    fuss.position.y = -m.unterschenkel;
    unter.add(fuss);
    fuss.add(baueSchuh(ctx, { farbe: f.schuh, sohle: f.sohle, senkel: f.senkel, ...(o.schuh ?? {}) }, m.schuh));
    const sohle = new THREE.Object3D();
    sohle.position.set(0, -m.schuh.h, m.schuh.l * 0.17);
    fuss.add(sohle);
    return { bein, unter, fuss, sohle };
  };
  const bL = baueBein('L'), bR = baueBein('R');

  const punkt = (eltern, x, y, z) => { const p = new THREE.Object3D(); p.position.set(x, y, z); eltern.add(p); return p; };
  const anker = {
    kopf: punkt(kopf, 0, m.kopfH * 0.5, 0),
    augen: punkt(kopf, 0, m.kopfH * 0.5, m.kopfT / 2),
    mund: punkt(kopf, 0, m.kopfH * 0.22, m.kopfT / 2 + 0.02),
    ueber_kopf: punkt(kopf, 0, m.kopfH + 0.15, 0),
    hinterkopf: punkt(kopf, 0, m.kopfH * 0.55, -m.kopfT / 2 - 0.02),
    brust: punkt(rumpf, 0, m.rumpfH * 0.6, m.rumpfT / 2),
    ruecken: punkt(rumpf, 0, m.rumpfH * 0.6, -m.rumpfT / 2),
    schulter_l: punkt(rumpf, m.rumpfOben / 2, m.rumpfH - 0.05, 0),
    schulter_r: punkt(rumpf, -m.rumpfOben / 2, m.rumpfH - 0.05, 0),
    huefte: punkt(huefte, 0, 0, 0),
    hand_l: aL.spitze, hand_r: aR.spitze,
    fuss_l: bL.sohle, fuss_r: bR.sohle,
    fuss: punkt(gruppe, 0, 0, 0),
  };

  const gelenke = {
    huefte, rumpf, kopf,
    armL: aL.arm, armR: aR.arm, unterarmL: aL.unter, unterarmR: aR.unter, handL: aL.hand, handR: aR.hand,
    beinL: bL.bein, beinR: bR.bein, unterbeinL: bL.unter, unterbeinR: bR.unter, fussL: bL.fuss, fussR: bR.fuss,
  };

  const fig = {
    gruppe, gelenke, anker, kopfMesh, rumpfMesh,
    huefteHoehe, beinDicke: m.beinD, masse: m,
    // natürliche Sitzhöhe: Unterschenkel + Schuh (Füße stehen auf dem Boden)
    sitzhoehe: m.unterschenkel + m.schuh.h + 0.02,
    // Gliedlängen für die IK (src/ik.js): Arm bis Handmitte, Bein bis Knöchel
    glieder: { arm: [m.oberarm, m.unterarm + m.hand[1] * 0.5], bein: [m.oberschenkel, m.unterschenkel] },
    atemFaktor: 1,
  };

  // Zusätze der einzelnen Figur (Haare, Mützen, Kapuze, Brille, Bart, Zopf …)
  const extra = o.schmuck?.({ ctx, fig, gelenke, anker, masse: m, mat, rundeKiste, trapezKiste, aufkleber: (b, h, z, ppm) => aufkleber(ctx, b, h, z, ppm) }) ?? {};
  Object.assign(gelenke, extra.gelenke ?? {});

  // Ausgangswerte merken: grundpose() stellt sie vor jedem Bild wieder her.
  const ausgang = Object.values(gelenke).map((g) => [g, g.position.clone(), g.quaternion.clone(), g.scale.clone()]);
  const meshes = [rumpfMesh, kopfMesh];
  const meshScale = meshes.map((x) => x.scale.clone());
  const haltung = o.haltung ?? {};

  // Handform: 'offen' (Fäustling), 'faust' (kürzer), 'zeigen' (Faust + Zeigefinger). Tausch in 1 Bild.
  fig.handForm = (seite, form) => {
    for (const s of seite === 'beide' ? ['L', 'R'] : [seite.toUpperCase()]) {
      const h = haende[s];
      h.faeustling.scale.y = form === 'offen' ? 1 : 0.72;
      h.faeustling.position.y = form === 'offen' ? -h.hl / 2 + 0.01 : -h.hl * 0.36 + 0.01;
      h.finger.visible = form === 'zeigen';
    }
  };

  fig.grundpose = () => {
    for (const [g, p, q, s] of ausgang) { g.position.copy(p); g.quaternion.copy(q); g.scale.copy(s); }
    meshes.forEach((x, i) => x.scale.copy(meshScale[i]));
    gelenke.armL.rotation.z = m.armRuhe;
    gelenke.armR.rotation.z = -m.armRuhe;
    // leicht gebeugte Ellbogen wirken lebendiger als ganz gerade Arme
    gelenke.unterarmL.rotation.x = -0.12;
    gelenke.unterarmR.rotation.x = -0.12;
    if (haltung.rumpf) gelenke.rumpf.rotation.x = haltung.rumpf;
    if (haltung.kopf) gelenke.kopf.rotation.x = haltung.kopf;
    fig.handForm('beide', 'offen');
    fig.atemFaktor = 1;
    extra.grundpose?.();
  };

  // Leerlauf-Atmen (Spec 1.8: an, 0,15–0,5 % der Bildbreite, Periode 3–4 s).
  // Abschaltbar: in der Episode "atmen": false, in einer Einstellung per Aktion "atem_anhalten".
  fig.atmen = (t, staerke = 1, seed = 0) => {
    const phase = (seed % 1000) / 159.2;
    const s = Math.sin((2 * Math.PI * t) / 3.6 + phase) * staerke * fig.atemFaktor;
    rumpfMesh.scale.y *= 1 + 0.011 * s;
    rumpfMesh.scale.x *= 1 + 0.004 * s;
    const hub = m.rumpfH * 0.011 * s;
    gelenke.kopf.position.y += hub;
    gelenke.armL.position.y += hub * 0.8;
    gelenke.armR.position.y += hub * 0.8;
    gelenke.armL.rotation.z += 0.01 * s;
    gelenke.armR.rotation.z -= 0.01 * s;
    gelenke.kopf.rotation.x -= 0.008 * s;
    gelenke.huefte.rotation.z += 0.005 * Math.sin((2 * Math.PI * t) / 5.3 + phase) * staerke * fig.atemFaktor;
    extra.atmen?.(t, s);
  };

  // Gesichter: Tausch der Textur in 1 Bild; Blinzeln nimmt dieselbe Miene mit geschlossenen Augen.
  let miene = 'neutral', zu = false;
  fig.gesichter = [...Object.keys(AUSDRUECKE), ...Object.keys(ALIAS)];
  fig.setzeGesicht = (name) => { miene = name; satz.setze(miene, zu); };
  fig.setzeBlinzeln = (z) => { zu = z; satz.setze(miene, zu); };
  fig.hoehe = huefteHoehe + (m.beckenH - 0.06) + m.rumpfH + m.hals + m.kopfH;

  fig.grundpose();
  return fig;
}

// Größe einer fertigen Figur skalieren (params.groesse), ohne die Schnittstelle zu ändern.
export function skaliere(fig, s) {
  if (!s || s === 1) return fig;
  fig.gruppe.scale.setScalar(s);
  fig.hoehe *= s;
  return fig;
}
