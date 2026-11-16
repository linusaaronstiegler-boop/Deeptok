// Set "kriechkeller": der Kriechkeller unter Junes Zimmer (serie.md, Ort 3). Teil 2 (Schluss), Teil 3, Teil 4.
// Ein eigener Raum, weit weg von den anderen Sets stellen (z. B. "position": [300, 0, 0]) und in seinen
// Einstellungen allein zeigen: "set": ["keller"]. Alle Maße lokal (1 m, y oben):
//   Erdboden bei y = 0, Balken (Unterzüge) laufen entlang z bei x = −2,7 … 2,7 (alle 0,9 m),
//   Dielen laufen entlang x (schmale Bretter, 8,5 cm), Unterkante y = 1,0, Oberkante y = 1,016, Fugen 3 cm. Dünne Bretter und breite
//   Fugen, damit man auch schräg von unten noch durch die Fugen sieht (sonst verdeckt die Brettkante das Licht).
//   Bodenluke: Öffnung x 0,04 … 0,86, z −0,41 … 0,41 (Requisite "luke" mit groesse [0.8, 0.8] an Anker
//   "luke_angel", blick 0; sie öffnet nach oben).
//
// Wie die Lichtspalten entstehen (kein Trick im Shader): Über den Dielen liegt eine warm leuchtende
// Fläche (Junes Zimmer im Lampenlicht). Durch die Fugen sieht man sie als dünne Lichtstreifen. Was oben
// steht, verdeckt die Fläche wirklich: Mister Hundreds Füße (die echte Figur, auf die Dielen gestellt)
// und der Fingerschatten (eine flache Hand mit kaltem Saum zwischen Dielen und Fläche).
//
// params:
//   ereignisse: Liste von { was, start, dauer, … } (Sekunden der Folge; der Shotlisten-Compiler füllt sie
//               aus regie.mjs, haupt/neben { art: "set", set: "keller", was, wort }):
//     biegen  { tiefe (m, Std 0.045), mitte [x, z] (Std Mitte der Füße), radius (Std 0.75) }: die Dielen
//             biegen sich unter großem Gewicht nach unten (Satz 42) und bleiben gebogen
//     finger  { von [x, z], nach [x, z], drehung (Grad), spreizen (Grad, Std 22) }: der Schatten von vier
//             langen Fingern gleitet über die Fugen und spreizt sich (Satz 46, Ready?)
//     glut    { staerke (Std 1) }: der kalte Saum um die Finger leuchtet auf
//     fuesse  { mitte [x, z], drehung }: dunkle Sohlen unter Mister Hundreds Füßen (verdecken die Fugen)
//   taschenlampe (Std true): Elis Taschenlampe liegt an, Lichtkegel nach oben
// Lichtgruppen: keller.oben (Lichtstreifen der Dielen), keller.lukenrand (Fugen um die Luke; aus, wenn der
//   Teppich darüberfällt), keller.lampe (Elis Taschenlampe: Punktlicht, Kegel, Lichtfleck), keller.gitter
//   (Mondlicht am Lüftungsgitter, für Teil 3)
import * as THREE from 'three';
import { k, zyl, verschmelze, tmat, lichtPfuetzeMat } from '../src/bauteile.js';

// Maße (lokal)
export const KELLER = {
  x0: -3.2, x1: 3.2, z0: -2.6, z1: 2.6,
  dielenUnten: 1.0, dielenDicke: 0.016, brett: 0.085, fuge: 0.03,
  luke: { x0: 0.04, x1: 0.86, z0: -0.41, z1: 0.41 },
};

const glatt = (u) => { const x = Math.min(1, Math.max(0, u)); return x * x * (3 - 2 * x); };

export default async function baue(ctx, params = {}) {
  const T = THREE;
  const z = ctx.zufall('kriechkeller');
  const gruppe = new T.Group();
  const statisch = new T.Group(); gruppe.add(statisch);
  const K = KELLER;
  const yU = K.dielenUnten, yO = K.dielenUnten + K.dielenDicke;
  const L = K.luke;

  // ---------- Materialien ----------
  // Review Folge 1: nichts unter 0,02 linear; der Keller ist dunkel, aber die Flächen haben mittlere Albedo,
  // damit Lampe und Lichtstreifen sie zeichnen (Helligkeits-Tor: keine Einstellung im Mittel unter 35).
  const erde = tmat(ctx, '#7a6250', 'erde', { rauheit: 1 });
  const erdeDunkel = tmat(ctx, '#5e4a3c', 'erde', { rauheit: 1 });
  const stein = tmat(ctx, '#8d8478', 'stein', { rauheit: 0.95 });
  const balken = tmat(ctx, '#7c5c40', 'holz', { rauheit: 0.85 });
  const brettMats = ['#94714f', '#8a6748', '#9c7a58'].map((f) => tmat(ctx, f, 'holz', { rauheit: 0.85 }));
  const ziegel = tmat(ctx, '#9a5a44', 'stein', { rauheit: 0.95 });

  // ---------- Erdboden mit Mulden, Steinen, Brettresten ----------
  k(statisch, K.x1 - K.x0 + 0.4, 0.1, K.z1 - K.z0 + 0.4, erde, 0, -0.05, 0, { schatten: false });
  for (let i = 0; i < 9; i++) {
    const m = new T.Mesh(new T.SphereGeometry(0.5 + z() * 0.5, 12, 6), i % 2 ? erde : erdeDunkel);
    m.scale.set(1, 0.12 + z() * 0.08, 0.7 + z() * 0.5);
    m.position.set(K.x0 + 0.4 + z() * (K.x1 - K.x0 - 0.8), -0.02, K.z0 + 0.4 + z() * (K.z1 - K.z0 - 0.8));
    // nicht unter Eli (liegt bei x −0,6 … 1,3, z ≈ −0,35)
    if (Math.abs(m.position.z + 0.35) < 0.7 && m.position.x > -1.2 && m.position.x < 1.8) m.position.z += 1.4;
    m.receiveShadow = true;
    statisch.add(m);
  }
  for (let i = 0; i < 26; i++) {
    const s = new T.Mesh(new T.IcosahedronGeometry(0.03 + z() * 0.07, 0), ctx.mat(['#7d7a74', '#8f8a80', '#6a6660'][i % 3], { rauheit: 0.9, flach: true }));
    s.position.set(K.x0 + 0.2 + z() * (K.x1 - K.x0 - 0.4), 0.01, K.z0 + 0.2 + z() * (K.z1 - K.z0 - 0.4));
    if (Math.abs(s.position.z + 0.35) < 0.45 && s.position.x > -1.0 && s.position.x < 1.6) s.position.z -= 0.9;
    s.rotation.set(z() * 3, z() * 3, z() * 3);
    s.castShadow = true;
    statisch.add(s);
  }
  // alte Bretter und Ziegel im Staub (dichtere Ecken, Review Folge 1: „Sets zu leer“)
  k(statisch, 1.4, 0.03, 0.16, brettMats[1], -2.2, 0.02, 1.6, { dreh: [0, 0.3, 0.04] });
  k(statisch, 0.9, 0.03, 0.14, brettMats[2], 2.1, 0.02, -1.8, { dreh: [0, -0.5, 0] });
  for (let i = 0; i < 5; i++) k(statisch, 0.22, 0.07, 0.11, ziegel, 2.4 + (i % 3) * 0.24, 0.035 + Math.floor(i / 3) * 0.07, 1.7 + (i % 2) * 0.05, { dreh: [0, 0.1 * i, 0] });
  // Spinnweben-Fäden an den Balken: dünne helle Schnüre
  const faden = ctx.mat('#d8d4cc', { rauheit: 1 });
  for (let i = 0; i < 7; i++) {
    const fx = -2.7 + Math.floor(z() * 7) * 0.9;
    k(statisch, 0.004, 0.18 + z() * 0.2, 0.004, faden, fx + 0.05, yU - 0.3, K.z0 + 0.3 + z() * (K.z1 - K.z0 - 0.6), { schatten: false, dreh: [0, 0, 0.3 * (z() - 0.5)] });
  }

  // ---------- Grundmauern (Naturstein) mit Lüftungsgitter ----------
  const hM = yO + 0.05;
  k(statisch, K.x1 - K.x0 + 0.4, hM, 0.3, stein, 0, hM / 2, K.z0 - 0.15);
  k(statisch, 0.3, hM, K.z1 - K.z0 + 0.6, stein, K.x0 - 0.15, hM / 2, 0);
  k(statisch, 0.3, hM, K.z1 - K.z0 + 0.6, stein, K.x1 + 0.15, hM / 2, 0);
  // Rückwand mit Öffnung für das Gitter (x −2,25 … −1,75, y 0,55 … 0,8)
  const gx0 = -2.25, gx1 = -1.75, gy0 = 0.55, gy1 = 0.8;
  k(statisch, gx0 - K.x0 + 0.2, hM, 0.3, stein, (K.x0 - 0.2 + gx0) / 2, hM / 2, K.z1 + 0.15);
  k(statisch, K.x1 + 0.2 - gx1, hM, 0.3, stein, (gx1 + K.x1 + 0.2) / 2, hM / 2, K.z1 + 0.15);
  k(statisch, gx1 - gx0, gy0, 0.3, stein, (gx0 + gx1) / 2, gy0 / 2, K.z1 + 0.15);
  k(statisch, gx1 - gx0, hM - gy1, 0.3, stein, (gx0 + gx1) / 2, (gy1 + hM) / 2, K.z1 + 0.15);
  const eisen = ctx.mat('#3a3a3c', { rauheit: 0.5, metall: 0.6 });
  for (let i = 0; i < 6; i++) k(statisch, 0.015, gy1 - gy0, 0.015, eisen, gx0 + 0.04 + i * 0.084, (gy0 + gy1) / 2, K.z1 + 0.05, { schatten: false });
  const gitterMat = ctx.leuchtMat('#7f9cd8', 0.9);
  const gitter = new T.Mesh(new T.PlaneGeometry(gx1 - gx0, gy1 - gy0), gitterMat);
  gitter.position.set((gx0 + gx1) / 2, (gy0 + gy1) / 2, K.z1 + 0.28);
  gitter.rotation.y = Math.PI;
  gitter.userData.einzeln = true;
  statisch.add(gitter);

  // ---------- Balken (Unterzüge) und Ziegelpfeiler ----------
  const balkenX = [];
  for (let x = -2.7; x <= 2.71; x += 0.9) balkenX.push(+x.toFixed(2));
  for (const x of balkenX) k(statisch, 0.09, 0.2, K.z1 - K.z0, balken, x, yU - 0.1, 0, { rund: 0.01 });
  // Wechsel um die Luke (Querbalken bei z = ±0,45 zwischen x 0 und 0,9)
  for (const zz of [L.z0 - 0.045, L.z1 + 0.045]) k(statisch, 0.9, 0.16, 0.08, balken, 0.45, yU - 0.08, zz);
  for (const [px, pz] of [[-1.8, -1.6], [1.8, 1.5], [-0.9, 1.9], [2.7, -1.2]]) k(statisch, 0.32, yU - 0.2, 0.32, ziegel, px, (yU - 0.2) / 2, pz);

  // ---------- Dielen: einzelne Bretter mit Fugen; biegsam (Satz 42) ----------
  // Jedes Brett ist ein eigenes Mesh mit 64 Teilen entlang x. aktualisiere(t) senkt die Eckpunkte nach
  // dem Biege-Profil ab (nur aus t gerechnet, kein Zustand zwischen Bildern).
  const bretter = [];
  const teilung = K.brett + K.fuge;
  const brettNeu = (x0, x1, zz, mat) => {
    const geo = new T.BoxGeometry(x1 - x0, K.dielenDicke, K.brett, Math.max(2, Math.round((x1 - x0) * 10)), 1, 1);
    const m = new T.Mesh(geo, mat);
    m.position.set((x0 + x1) / 2, yU + K.dielenDicke / 2, zz);
    m.castShadow = true; m.receiveShadow = true;
    gruppe.add(m);
    bretter.push({ m, basis: geo.attributes.position.array.slice() });
  };
  for (let i = 0, zz = K.z0 + K.brett / 2 + 0.01; zz < K.z1; i++, zz += teilung) {
    const mat = brettMats[i % brettMats.length];
    const imLukenBereich = zz + K.brett / 2 > L.z0 && zz - K.brett / 2 < L.z1;
    if (imLukenBereich) { brettNeu(K.x0, L.x0, zz, mat); brettNeu(L.x1, K.x1, zz, mat); } else brettNeu(K.x0, K.x1, zz, mat);
  }

  // ---------- Junes Zimmer darüber: leuchtende Flächen (Lichtgruppen) ----------
  const obenMat = new T.MeshStandardMaterial({ color: '#000000', emissive: new T.Color('#ffc98a'), emissiveIntensity: 3.2, roughness: 1, side: T.DoubleSide });
  const oben = new T.Mesh(new T.PlaneGeometry(K.x1 - K.x0, K.z1 - K.z0), obenMat);
  oben.rotation.x = Math.PI / 2;
  oben.position.set(0, yO + 0.32, 0);
  oben.userData.einzeln = true;
  gruppe.add(oben);
  // über der Luke ein eigenes Stück: geht aus, wenn der Teppich darüberfällt (Satz 34)
  const randMat = new T.MeshStandardMaterial({ color: '#000000', emissive: new T.Color('#ffc98a'), emissiveIntensity: 1.5, roughness: 1, side: T.DoubleSide });
  const rand = new T.Mesh(new T.PlaneGeometry(L.x1 - L.x0 + 0.16, L.z1 - L.z0 + 0.16), randMat);
  rand.rotation.x = Math.PI / 2;
  rand.position.set((L.x0 + L.x1) / 2, yO + 0.09, (L.z0 + L.z1) / 2);
  rand.userData.einzeln = true;
  gruppe.add(rand);
  // Lukenrahmen (dunkle Kante, damit die Fuge um den Deckel sichtbar bleibt)
  const rahmen = ctx.mat('#5a3f2b', { rauheit: 0.9 });
  k(statisch, 0.03, 0.12, L.z1 - L.z0 + 0.06, rahmen, L.x0 - 0.015, yU - 0.04, 0);
  k(statisch, 0.03, 0.12, L.z1 - L.z0 + 0.06, rahmen, L.x1 + 0.015, yU - 0.04, 0);

  const schwarz = new T.MeshBasicMaterial({ color: '#0a0b0d', side: T.DoubleSide });
  // ---------- Fingerschatten (Satz 46): flache Hand mit kaltem Saum zwischen Dielen und Licht ----------
  // Von unten sieht man nur, welche Fugen dunkel werden: vier lange Finger, an den Rändern türkis.
  const hand = new T.Group();
  hand.position.set(0, yO + 0.012, 0);
  hand.scale.set(1.3, 1, 1.3);   // der Schatten ist größer als die Hand (Lampe oben im Zimmer)
  hand.visible = false;
  gruppe.add(hand);
  const saumMat = new T.MeshStandardMaterial({ color: '#000000', emissive: new T.Color('#9FD8D2'), emissiveIntensity: 0, roughness: 1, side: T.DoubleSide });
  const flach = (b, l, mat, y) => {
    // Fläche in der xz-Ebene, liegt flach; Finger zeigen nach −x
    const m = new T.Mesh(new T.PlaneGeometry(l, b), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(-l / 2, y, 0);
    return m;
  };
  const handflaeche = new T.Group(); hand.add(handflaeche);
  handflaeche.add(flach(0.44, 0.4, schwarz, 0));
  handflaeche.add(flach(0.58, 0.52, saumMat, 0.008));
  handflaeche.children[0].position.x = 0.2; handflaeche.children[1].position.x = 0.23;
  const finger = [];
  for (let i = 0; i < 4; i++) {
    const g = new T.Group();
    g.position.set(-0.18, 0, -0.16 + i * 0.107);
    handflaeche.add(g);
    const laenge = [0.76, 0.84, 0.82, 0.7][i];
    const f = flach(0.07, laenge, schwarz, 0);
    // spitz zulaufend: Spitze etwas schmaler
    f.scale.set(1, 1, 1);
    g.add(f);
    const s = flach(0.12, laenge + 0.04, saumMat, 0.008);
    g.add(s);
    // glimmende Fingerspitze (wie die Nägel des Monsters): kaltes Licht, das durch die Fuge sickert
    const spitze = new T.Mesh(new T.PlaneGeometry(0.14, 0.11), saumMat);
    spitze.rotation.x = -Math.PI / 2;
    spitze.position.set(-laenge - 0.05, -0.004, 0);
    g.add(spitze);
    finger.push(g);
  }

  // ---------- Schatten unter den Füßen (Sätze 42–46) ----------
  // Mister Hundred steht als echte Figur oben auf den Dielen. Seine hellen Sohlen würden aber von Elis
  // Lampe durch die Fugen angestrahlt und sähen aus wie Licht; deshalb liegen dunkle Sohlenflächen knapp
  // über den Dielen, unter den Füßen. Von unten werden die Lichtstreifen dort dunkel (Ereignis "fuesse").
  const fuesse = new T.Group();
  fuesse.position.set(0, yO + 0.004, 0);
  fuesse.visible = false;
  gruppe.add(fuesse);
  for (const fz of [0, 0.3]) {
    const sohle = new T.Mesh(new T.PlaneGeometry(0.98, 0.3), schwarz);
    sohle.rotation.x = -Math.PI / 2;
    sohle.position.set(-0.02, 0, fz);
    fuesse.add(sohle);
  }

  // ---------- Elis Taschenlampe: liegt neben ihm, Kegel schräg nach oben ----------
  const lampe = new T.Group();
  const lampePos = new T.Vector3(0.55, 0.09, -0.85);   // neben Elis rechter Hüfte (er liegt bei z ≈ −0,35)
  lampe.position.copy(lampePos);
  gruppe.add(lampe);
  const lampeKoerper = new T.Group(); lampe.add(lampeKoerper);
  // zeigt zur Dielenmitte über Elis Gesicht
  const kegelZiel = new T.Vector3(-0.45, yU, -0.1);
  const richtung = kegelZiel.clone().sub(lampePos).normalize();
  lampeKoerper.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), richtung);
  zyl(lampeKoerper, 0.035, 0.035, 0.24, ctx.mat('#1e1f22', { rauheit: 0.4 }), 0, -0.12, 0, { segmente: 10 });
  zyl(lampeKoerper, 0.05, 0.04, 0.07, ctx.mat('#d9a437', { metall: 0.5, rauheit: 0.4 }), 0, 0.02, 0, { segmente: 12 });
  const linseMat = ctx.leuchtMat('#fff1d0', 3.2);
  const linse = zyl(lampeKoerper, 0.045, 0.045, 0.01, linseMat, 0, 0.06, 0, { segmente: 12, schatten: false });
  linse.userData.einzeln = true;
  // Lichtkegel: additiv, verläuft von hell (Lampe) nach dunkel (Dielen)
  const kegelTex = ctx.zeichenTextur((g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    // oben auf der Leinwand = breites Ende an den Dielen (dunkel), unten = an der Lampe (hell)
    gr.addColorStop(0, '#000000'); gr.addColorStop(0.5, '#5a5a5a'); gr.addColorStop(1, '#ffffff');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }, 8, 128);
  const kegelLaenge = kegelZiel.distanceTo(lampePos);
  const kegelMat = new T.MeshStandardMaterial({ color: '#000000', emissive: new T.Color('#ffd9a0'), emissiveIntensity: 0.1, emissiveMap: kegelTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, roughness: 1 });
  kegelMat.fog = false;
  const kegel = new T.Mesh(new T.CylinderGeometry(0.42, 0.05, kegelLaenge, 24, 1, true), kegelMat);
  kegel.position.set(0, 0.06 + kegelLaenge / 2, 0);
  kegel.userData.einzeln = true;
  lampeKoerper.add(kegel);
  // Lichtfleck unter den Dielen
  const fleckMat = lichtPfuetzeMat(ctx, '#ffd9a0', 0.32);
  const fleck = new T.Mesh(new T.PlaneGeometry(1.4, 1.4), fleckMat);
  fleck.rotation.x = Math.PI / 2;
  fleck.position.set(kegelZiel.x, yU - 0.004, kegelZiel.z);
  fleck.userData.einzeln = true;
  gruppe.add(fleck);
  const lampeLicht = new T.PointLight('#ffd6a0', params.taschenlampe === false ? 0 : 1.6, 4.5, 1.6);
  lampeLicht.position.copy(lampePos.clone().add(richtung.clone().multiplyScalar(0.25)));
  gruppe.add(lampeLicht);
  if (params.taschenlampe === false) { lampe.visible = false; kegel.visible = false; fleck.visible = false; }

  verschmelze(statisch);

  // ---------- Ereignisse aus params (Biegen, Finger, Glut): nur aus t ----------
  const ev = (was) => (params.ereignisse ?? []).filter((e) => e.was === was).sort((a, b) => a.start - b.start);
  const biegen = ev('biegen'), fingerEv = ev('finger'), glutEv = ev('glut'), fuesseEv = ev('fuesse');
  const anteil = (e, t) => glatt((t - e.start) / Math.max(1e-3, e.dauer ?? 0.6));
  let biegeAlt = -1;

  return {
    gruppe,
    lichter: {
      oben: { lichter: [], materialien: [obenMat] },
      lukenrand: { lichter: [], materialien: [randMat] },
      lampe: { lichter: [lampeLicht], materialien: [linseMat, kegelMat, fleckMat] },
      gitter: { lichter: [], materialien: [gitterMat] },
    },
    anker: {
      luke: [(L.x0 + L.x1) / 2, yU, 0],
      luke_angel: [(L.x0 + L.x1) / 2, yO, L.z0 + 0.01],   // Requisite "luke" (groesse [0.8, 0.8]) hier, blick 0
      dielen_mitte: [-0.45, yU, 0.1],                     // über Elis Gesicht
      fuesse: [-0.35, yO, 0.15],                          // hier steht Mister Hundred oben (Satz 42–46)
      lampe: lampePos.toArray(),
      eli_kopf: [-0.55, 0.42, -0.35],                    // ungefähr Elis Kopf, wenn er bei kellerEli liegt
      gitter: [(gx0 + gx1) / 2, (gy0 + gy1) / 2, K.z1],
      boden: [0, 0, 0],
    },
    kamerapunkte: {
      // Untersicht aus Elis Augen: Dielen über dem Gesicht
      // fast senkrecht nach oben: schräg gesehen verdeckt die Brettkante die Fugen
      pov: { pos: [-0.42, 0.3, 0.02], ziel: [-0.33, yU, 0.3], fov: 62 },
      // von unten auf die offene Luke
      luke_unten: { pos: [0.2, 0.32, -0.75], ziel: [0.45, yU + 0.2, 0.05], fov: 58 },
      totale: { pos: [2.6, 0.62, 1.9], ziel: [-0.3, 0.25, -0.35], fov: 60 },
      halbnah: { pos: [0.9, 0.55, 0.75], ziel: [-0.5, 0.2, -0.35], fov: 50 },
    },
    aktualisiere(t) {
      // Dielen biegen: Profil um die Mitte, Brett-Enden an den Balken bleiben fast stehen
      let b = 0;
      let mitte = [-0.35, 0.15], radius = 0.75, tiefe = 0.045;
      for (const e of biegen) if (t >= e.start) { b = anteil(e, t); mitte = e.mitte ?? mitte; radius = e.radius ?? radius; tiefe = e.tiefe ?? tiefe; }
      const schluessel = Math.round(b * 1000);
      if (schluessel !== biegeAlt) {
        biegeAlt = schluessel;
        for (const { m, basis } of bretter) {
          const pos = m.geometry.attributes.position;
          const a = pos.array;
          const bz = m.position.z - mitte[1];
          if (b === 0 || Math.abs(bz) > radius * 1.6) {
            if (m.userData.gebogen) { a.set(basis); pos.needsUpdate = true; m.userData.gebogen = false; }
            continue;
          }
          for (let i = 0; i < a.length; i += 3) {
            const wx = m.position.x + basis[i] - mitte[0];
            const r2 = (wx * wx + bz * bz) / (radius * radius);
            a[i + 1] = basis[i + 1] - tiefe * b * Math.exp(-r2 * 1.6);
          }
          pos.needsUpdate = true;
          m.userData.gebogen = true;
        }
      }
      // Sohlenschatten ab dem Ereignis "fuesse" (Lage optional: mitte [x, z], drehung in Grad)
      const fe = fuesseEv.filter((e) => t >= e.start).at(-1);
      fuesse.visible = !!fe;
      if (fe) {
        const m = fe.mitte ?? [-0.35, 0.15];
        fuesse.position.x = m[0] + 0.33; fuesse.position.z = m[1] - 0.15;
        fuesse.rotation.y = ((fe.drehung ?? 0) * Math.PI) / 180;
      }
      // Fingerschatten: gleitet herein, dann spreizen sich die Finger
      const f = fingerEv.filter((e) => t >= e.start).at(-1);
      hand.visible = !!f;
      if (f) {
        const u = glatt((t - f.start) / Math.max(1e-3, f.dauer ?? 0.35));
        const von = f.von ?? [0.3, 0.45], nach = f.nach ?? [-0.05, 0.2];
        hand.position.x = von[0] + (nach[0] - von[0]) * Math.min(1, u * 1.6);
        hand.position.z = von[1] + (nach[1] - von[1]) * Math.min(1, u * 1.6);
        hand.rotation.y = ((f.drehung ?? 0) * Math.PI) / 180;
        const sp = ((f.spreizen ?? 22) * Math.PI) / 180 * glatt((u - 0.35) / 0.65);
        finger.forEach((g, i) => { g.rotation.y = (i - 1.5) * sp * 0.66; });
      }
      // kalter Saum: leuchtet mit dem Finger-Ereignis oder einem eigenen Glut-Ereignis auf
      let glut = f ? 0.9 * glatt((t - f.start) / 0.25) : 0;
      for (const e of glutEv) if (t >= e.start) glut = Math.max(glut, (e.staerke ?? 1) * anteil(e, t));
      saumMat.emissiveIntensity = 3.6 * glut;
    },
  };
}
