// Set "kriechkeller": der Kriechkeller unter Junes Zimmer (serie.md, Ort 3). Teil 2 (Schluss), Teil 3, Teil 4.
// Ein eigener Raum, weit weg von den anderen Sets stellen (z. B. "position": [300, 0, 0]) und in seinen
// Einstellungen allein zeigen: "set": ["keller"]. Alle Maße lokal (1 m, y oben):
//   Erdboden bei y = 0, Balken (Unterzüge) laufen entlang z bei x = −2,7 … 2,7 (alle 0,9 m),
//   Dielen laufen entlang x (schmale Bretter, 7,5 cm), Unterkante y = 1,0, Oberkante y = 1,016, Fugen 4,2 cm. Dünne Bretter und breite
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
//     finger  { von [x, z], nach [x, z], drehung (Grad), spreizen (Grad, Std 22), skala (Std 1.3),
//             spreiz_dauer (Std 0.2) }: der Schatten von vier
//             langen Fingern gleitet über die Fugen und spreizt sich (Satz 46, Ready?)
//     glut    { staerke (Std 1) }: der kalte Saum um die Finger leuchtet auf
//     fuesse  { mitte [x, z] = Standpunkt des Monsters, drehung = sein blick }: dunkle Sohlen mit Zehen unter
//             seinen Füßen (verdecken die Fugen und werfen Schatten)
//   taschenlampe (Std true): Elis Taschenlampe liegt an, Lichtkegel nach oben; kegel (Std 0.22) Sichtbarkeit
//   des Kegels, lampe_staerke (Std 2.4) Punktlicht, oben (Std 2.0) Leuchten der Fugen
// Lichtgruppen: keller.oben (Lichtstreifen der Dielen), keller.lukenrand (Fugen um die Luke; aus, wenn der
//   Teppich darüberfällt), keller.lampe (Elis Taschenlampe: Punktlicht, Kegel, Lichtfleck), keller.gitter
//   (Mondlicht am Lüftungsgitter, für Teil 3)
import * as THREE from 'three';
import { k, zyl, verschmelze, tmat, lichtPfuetzeMat, weicherKegel } from '../src/bauteile.js';

// Maße (lokal)
export const KELLER = {
  x0: -3.2, x1: 3.2, z0: -2.6, z1: 2.6,
  // Review Teil 2: Fugen 3 -> 4,2 cm, Bretter 8,5 -> 7,5 cm, damit Sohlen und Finger oben als Form lesbar werden
  dielenUnten: 1.0, dielenDicke: 0.016, brett: 0.075, fuge: 0.042,
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
  // Review Teil 3: Die 4 mm dünnen Fäden lagen nah an der Linse als haarfeine, gerade Linien quer durchs Bild
  // (E17: waagrechte Linie bei y ≈ 1150, las sich wie ein Renderfehler). Sie werden nicht mehr gebaut; die
  // Zufallszahlen werden trotzdem gezogen, damit alles danach an seinem Platz bleibt.
  for (let i = 0; i < 7; i++) {
    const fx = -2.7 + Math.floor(z() * 7) * 0.9;
    const fh = 0.18 + z() * 0.2, fz = K.z0 + 0.3 + z() * (K.z1 - K.z0 - 0.6), fd = 0.3 * (z() - 0.5);
    if (params.faeden) k(statisch, 0.004, fh, 0.004, faden, fx + 0.05, yU - 0.3, fz, { schatten: false, dreh: [0, 0, fd] });
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
  // Review Teil 2: mit den breiteren Fugen legte das Leuchten (3,2) über Bloom einen hellen Schleier über
  // den ganzen Keller; 2,0 bleibt über der Bloom-Schwelle, die Streifen blühen nur noch schmal
  const obenMat = new T.MeshStandardMaterial({ color: '#000000', emissive: new T.Color('#ffc98a'), emissiveIntensity: params.oben ?? 2.0, roughness: 1, side: T.DoubleSide });
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
  // Was oben steht, wirft auch Schatten: Das warme Licht aus Junes Zimmer (Hauptlicht des Presets
  // „kriechkeller“, fast senkrecht von oben) fällt durch die Fugen auf Eli und den Boden.
  const schattenWerfen = (g) => g.traverse((o) => { if (o.isMesh && o.material === schwarz) o.castShadow = true; });
  // ---------- Fingerschatten (Satz 46): flache Hand mit kaltem Saum zwischen Dielen und Licht ----------
  // Von unten sieht man nur, welche Fugen dunkel werden: vier lange Finger, an den Rändern türkis.
  const hand = new T.Group();
  hand.position.set(0, yO + 0.012, 0);
  hand.scale.set(1.3, 1, 1.3);   // der Schatten ist größer als die Hand (Lampe oben im Zimmer)
  hand.visible = false;
  gruppe.add(hand);
  const saumMat = new T.MeshStandardMaterial({ color: '#000000', emissive: new T.Color('#9FD8D2'), emissiveIntensity: 0, roughness: 1, side: T.DoubleSide });
  const spitzenMat = new T.MeshStandardMaterial({ color: '#000000', emissive: new T.Color('#c8fff8'), emissiveIntensity: 0, roughness: 1, side: T.DoubleSide });
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
  // Review Teil 3 (zu Teil 2, „Ready?“): Die Säume (je 12 cm um 7 cm breite Finger) überlappten sich und füllten
  // die Lücken zwischen den Fingern kalt aus: durch die Fugen sah man ein türkises Gitter statt vier Finger.
  // Mit saum: false (Finger-Ereignis) bleiben nur die dunklen Finger und die glimmenden Spitzen.
  const saeume = [];
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
    saeume.push(s);
    // glimmende Fingerspitze (wie die Nägel des Monsters): kaltes Licht, das durch die Fuge sickert.
    // Review Teil 2: eigenes, helleres Material und länger (16 cm), damit jede Spitze in einer Fuge als
    // kalter Punkt erscheint: vier Punkte in einer Reihe lesen sich als Fingerspitzen
    const spitze = new T.Mesh(new T.PlaneGeometry(0.16, 0.085), spitzenMat);
    spitze.rotation.x = -Math.PI / 2;
    spitze.position.set(-laenge - 0.06, -0.004, 0);
    g.add(spitze);
    finger.push(g);
  }

  // ---------- Schatten unter den Füßen (Sätze 42–46) ----------
  // Mister Hundred steht als echte Figur oben auf den Dielen. Seine hellen Sohlen würden aber von Elis
  // Lampe durch die Fugen angestrahlt und sähen aus wie Licht; deshalb liegen dunkle Sohlenflächen knapp
  // über den Dielen, unter den Füßen. Von unten werden die Lichtstreifen dort dunkel (Ereignis "fuesse").
  // Review Teil 2: Die Füße stehen QUER zu den Fugen (Monster mit blick 0 oder 180), so schneidet jede Sohle
  // 6–8 Lichtstreifen, und vorn zeigen vier Zehen mit Lücken: in der vordersten Fuge als gestrichelte Linie.
  // Ursprung der Gruppe = Standpunkt des Monsters (Ereignis mitte [x, z]), lokal +z = Zehen, drehung = blick.
  const fuesse = new T.Group();
  fuesse.visible = false;
  gruppe.add(fuesse);
  const fl = (b, l, x, zz) => {
    const m = new T.Mesh(new T.PlaneGeometry(b, l), schwarz);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0, zz);
    fuesse.add(m);
  };
  for (const sx of [-1, 1]) {
    const x = sx * 0.15;
    fl(0.24, 0.62, x, 0.17);                               // Ferse bis Ballen
    fl(0.27, 0.12, x, 0.5);                                // Ballen etwas breiter
    // vier Zehen, lang und knochig, mit 2-cm-Lücken
    [0.13, 0.15, 0.13, 0.11].forEach((zl, i) => fl(0.045, zl, x + sx * (-0.095 + i * 0.065), 0.56 + zl / 2));
  }
  schattenWerfen(fuesse);
  // die Hand des Fingerschattens wirft ebenfalls Schatten
  schattenWerfen(hand);

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
  // Review Teil 2: Der Kegel war unsichtbar (0,1). Im dunklen Keller ist die Taschenlampe das Hauptlicht.
  // Review Teil 3: Der Kegel schnitt als halbtransparente Fläche mit harter Kante (Keil, haarfeine Linie)
  // durch Bretter und Gesichter. Ursache: MeshStandardMaterial glänzt auch in Schwarz (4 % Spiegelung);
  // das Punktlicht der Lampe spiegelte sich auf der Kegelfläche, additiv, mit der harten Silhouette des
  // Kegels. Jetzt Lambert (ohne Glanz, wie die Turmlampe) und weich: Rand und Nähe zur Linse blenden aus
  // (weicherKegel). Weil der weiche Kegel im Mittel etwa halb so hell ist, steigt er von 0,22 auf 0,3.
  const kegelMat = new T.MeshLambertMaterial({ color: '#000000', emissive: new T.Color('#ffe4b8'), emissiveIntensity: params.kegel ?? 0.3, emissiveMap: kegelTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
  kegelMat.fog = false;
  weicherKegel(kegelMat);
  const kegel = new T.Mesh(new T.CylinderGeometry(0.3, 0.05, kegelLaenge, 24, 1, true), kegelMat);
  kegel.position.set(0, 0.06 + kegelLaenge / 2, 0);
  kegel.userData.einzeln = true;
  lampeKoerper.add(kegel);
  // Lichtfleck unter den Dielen
  // Lichtfleck ebenfalls ohne Glanz (Review Teil 3, siehe Kegel)
  const fleckMat = lichtPfuetzeMat(ctx, '#ffd9a0', 0.32, { ohneGlanz: true });
  const fleck = new T.Mesh(new T.PlaneGeometry(1.4, 1.4), fleckMat);
  fleck.rotation.x = Math.PI / 2;
  fleck.position.set(kegelZiel.x, yU - 0.004, kegelZiel.z);
  fleck.userData.einzeln = true;
  gruppe.add(fleck);
  const lampeLicht = new T.PointLight('#fff0d8', params.taschenlampe === false ? 0 : (params.lampe_staerke ?? 2.4), 5.0, 1.5);
  lampeLicht.position.copy(lampePos.clone().add(richtung.clone().multiplyScalar(0.25)));
  gruppe.add(lampeLicht);
  if (params.taschenlampe === false) { lampe.visible = false; kegel.visible = false; fleck.visible = false; }

  // ===================== Teil 3 (Finale) =====================
  // Alles hier entsteht nur, wenn die Episode es braucht (params.teil3 bzw. Ereignisse); Teil 2 bleibt gleich.

  // ---------- Finger durch die Fuge (Satz 25–26): ein echter, langer weißer Finger ----------
  // Drei Glieder (0,55 / 0,45 / 0,35 m), kalkweiß mit kalter Kante, dunkler Nagel. Er kommt senkrecht durch
  // eine Fuge, krümmt sich zum Boden und tastet mit der Spitze über die Erde (Richtung = drehung).
  // Ereignisse: finger_durch { stelle [x, z], drehung (Grad, Std −90 = Spitze nach +x), start, dauer },
  //             finger_tasten { start, dauer, weite (rad, Std 0.16) }, finger_zurueck { start, dauer }
  const fingerDurchEv = (params.ereignisse ?? []).filter((e) => e.was === 'finger_durch');
  const F3 = { glieder: [0.55, 0.45, 0.35], dicke: 0.088 };
  const finger3 = new T.Group(); finger3.visible = false; gruppe.add(finger3);
  const fingerKetten = [];
  if (fingerDurchEv.length) {
    const fingerHaut = ctx.mat('#DAD6CC', { rauheit: 0.6, kante: { farbe: '#bfe6e2', staerke: 0.9, exponent: 2.0 } });
    const nagel = ctx.mat('#4a4e55', { rauheit: 0.35 });
    let eltern = finger3;
    F3.glieder.forEach((l, i) => {
      const g = new T.Group();
      g.position.y = i === 0 ? 0 : -F3.glieder[i - 1];
      eltern.add(g);
      const d = F3.dicke * (1 - i * 0.12);
      // Glied hängt nach −y; Knöchel als dickere Kugel
      const m = new T.Mesh(new T.CylinderGeometry(d * 0.5, d * 0.47, l, 10), fingerHaut);
      m.position.y = -l / 2; m.castShadow = true; g.add(m);
      const kn = new T.Mesh(new T.SphereGeometry(d * 0.58, 10, 8), fingerHaut); kn.castShadow = true; g.add(kn);
      if (i === 2) {
        // Nagel an der Außenseite der Spitze (Seite +x lokal = in Krümmungsrichtung außen)
        const n = new T.Mesh(new T.BoxGeometry(d * 0.75, 0.07, d * 0.32), nagel);
        n.position.set(0, -l + 0.045, -d * 0.36); g.add(n);
      }
      fingerKetten.push(g);
      eltern = g;
    });
  }

  // ---------- Kaltes Lukenlicht (Satz 38): Lichtgruppe keller.lukenlicht ----------
  // Additiver kalter Lichtkeil aus der offenen Luke schräg in den Keller, kalte Fläche in der Öffnung, ein
  // Punktlicht. Startet AN (wie jede Lichtgruppe): die Episode schaltet es im ersten Kellerbild aus
  // (lampen_einzeln) und auf „opened“ mit einem Lichtereignis an.
  const lukenlichtMats = [], lukenlichtLichter = [];
  if (params.lukenlicht) {
    const keilTex = ctx.zeichenTextur((g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.55, '#4a4a4a'); gr.addColorStop(1, '#000000');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }, 8, 128);
    const keilMat = new T.MeshLambertMaterial({ color: '#000000', emissive: new T.Color('#9fc4ff'), emissiveIntensity: 0.32, emissiveMap: keilTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
    keilMat.fog = false;
    const keil = new T.Mesh(new T.BoxGeometry(L.x1 - L.x0, 1.05, L.z1 - L.z0), keilMat);
    // oben an der Öffnung, unten schräg zum Kopfende (−x): das Licht fällt auf Eli
    keil.position.set((L.x0 + L.x1) / 2 - 0.18, yU - 0.5, 0);
    keil.rotation.z = -0.32;
    keil.userData.einzeln = true;
    gruppe.add(keil);
    const oeffnungMat = new T.MeshLambertMaterial({ color: '#000000', emissive: new T.Color('#b8d6ff'), emissiveIntensity: 1.6, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
    const oeffnung = new T.Mesh(new T.PlaneGeometry(L.x1 - L.x0, L.z1 - L.z0), oeffnungMat);
    oeffnung.rotation.x = Math.PI / 2; oeffnung.position.set((L.x0 + L.x1) / 2, yO + 0.06, 0);
    oeffnung.userData.einzeln = true;
    gruppe.add(oeffnung);
    const pl = new T.PointLight('#a9c8ff', params.lukenlicht_staerke ?? 3.2, 4.5, 1.6);
    pl.position.set((L.x0 + L.x1) / 2, yU - 0.05, 0);
    gruppe.add(pl);
    lukenlichtMats.push(keilMat, oeffnungMat); lukenlichtLichter.push(pl);
  }

  // ---------- Morgen (Satz 55): rosa Licht durchs Gitter, Lichtgruppe keller.gitter_morgen ----------
  const morgenMats = [];
  if (params.morgen) {
    const gm = ctx.leuchtMat('#ffb6a8', 2.4);
    const gmPlatte = new T.Mesh(new T.PlaneGeometry(gx1 - gx0, gy1 - gy0), gm);
    gmPlatte.position.set((gx0 + gx1) / 2, (gy0 + gy1) / 2, K.z1 + 0.27); gmPlatte.rotation.y = Math.PI;
    gmPlatte.userData.einzeln = true; gruppe.add(gmPlatte);
    // Lichtbahn: additiv, vom Gitter flach in den Raum (Staub im Morgenlicht)
    const bahnTex = ctx.zeichenTextur((g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#000000'); gr.addColorStop(0.6, '#3a3a3a'); gr.addColorStop(1, '#ffffff');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }, 8, 128);
    const bahnMat = new T.MeshLambertMaterial({ color: '#000000', emissive: new T.Color('#ffc0b0'), emissiveIntensity: 0.3, emissiveMap: bahnTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
    bahnMat.fog = false;
    const bahn = new T.Mesh(new T.CylinderGeometry(0.75, 0.2, 3.4, 16, 1, true), bahnMat);
    // Zylinder-Achse von der Wand (+z) schräg nach unten in den Raum
    bahn.position.set((gx0 + gx1) / 2 + 0.6, 0.42, K.z1 - 1.55);
    bahn.rotation.set(-Math.PI / 2 - 0.12, 0, -0.33);
    bahn.userData.einzeln = true; gruppe.add(bahn);
    morgenMats.push(gm, bahnMat);
  }

  // ---------- Lichtpuls der Fugen je Zahl (Satz 49, 51) ----------
  // Additive warme Fläche zwischen Dielen und „Zimmer“: pulsiert im Takt (Ereignis puls { start, dauer, takt, staerke })
  const pulsMat = new T.MeshLambertMaterial({ color: '#000000', emissive: new T.Color('#ffd7a0'), emissiveIntensity: 0, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
  const pulsFl = new T.Mesh(new T.PlaneGeometry(K.x1 - K.x0, K.z1 - K.z0), pulsMat);
  pulsFl.rotation.x = Math.PI / 2; pulsFl.position.set(0, yO + 0.2, 0); pulsFl.visible = false;
  pulsFl.userData.einzeln = true; gruppe.add(pulsFl);

  // ---------- Etwas legt sich der Länge nach auf die Dielen (Satz 33–34) ----------
  // Ereignis liegen { start, dauer, mitte [x, z], laenge (Std 2.6), breite (Std 0.62), drehung }: eine lange
  // dunkle Fläche schiebt sich über die Fugen, eine Fuge nach der anderen wird dunkel.
  const liegeFl = new T.Group(); liegeFl.visible = false; gruppe.add(liegeFl);
  const liegeKoerper = new T.Mesh(new T.PlaneGeometry(1, 1), schwarz);
  liegeKoerper.rotation.x = -Math.PI / 2; liegeKoerper.castShadow = true; liegeFl.add(liegeKoerper);

  verschmelze(statisch);

  // ---------- Ereignisse aus params (Biegen, Finger, Glut): nur aus t ----------
  const ev = (was) => (params.ereignisse ?? []).filter((e) => e.was === was).sort((a, b) => a.start - b.start);
  const biegen = ev('biegen'), fingerEv = ev('finger'), glutEv = ev('glut'), fuesseEv = ev('fuesse');
  const fDurch = ev('finger_durch'), fTasten = ev('finger_tasten'), fZurueck = ev('finger_zurueck');
  const pulsEv = ev('puls'), liegenEv = ev('liegen');
  const anteil = (e, t) => glatt((t - e.start) / Math.max(1e-3, e.dauer ?? 0.6));
  let biegeAlt = -1;

  return {
    gruppe,
    lichter: {
      oben: { lichter: [], materialien: [obenMat] },
      lukenrand: { lichter: [], materialien: [randMat] },
      lampe: { lichter: [lampeLicht], materialien: [linseMat, kegelMat, fleckMat] },
      gitter: { lichter: [], materialien: [gitterMat] },
      ...(params.lukenlicht ? { lukenlicht: { lichter: lukenlichtLichter, materialien: lukenlichtMats } } : {}),
      ...(params.morgen ? { gitter_morgen: { lichter: [], materialien: morgenMats } } : {}),
    },
    anker: {
      luke: [(L.x0 + L.x1) / 2, yU, 0],
      luke_angel: [(L.x0 + L.x1) / 2, yO, L.z0 + 0.01],   // Requisite "luke" (groesse [0.8, 0.8]) hier, blick 0
      dielen_mitte: [-0.45, yU, 0.1],                     // über Elis Gesicht
      fuesse: [-0.45, yO, -0.45],                         // hier steht Mister Hundred oben (Satz 42–46, blick 0)
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
      // Mehrere Biege-Ereignisse mischen vom aktuellen Stand zur neuen Tiefe (Teil 3: tiefe 0 = Dielen
      // richten sich wieder auf, Satz 11). Mit einem Ereignis wie bisher: Tiefe × Anteil.
      let b = 0;
      let mitte = [-0.35, 0.15], radius = 0.75, tiefe = 0.045, stand = 0;
      for (const e of biegen) if (t >= e.start) {
        const ziel = e.tiefe ?? 0.045;
        stand = stand + (ziel - stand) * anteil(e, t);
        mitte = e.mitte ?? mitte; radius = e.radius ?? radius;
      }
      tiefe = Math.max(stand, 1e-6); b = stand > 1e-6 ? 1 : 0;
      const schluessel = Math.round(stand * 1e5);
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
      // fuesse.bis (Teil 3, Satz 11): ab dieser Zeit ist das Gewicht weg, die Sohlen verschwinden
      const fe = fuesseEv.filter((e) => t >= e.start && !(e.bis !== undefined && t >= e.bis)).at(-1);
      fuesse.visible = !!fe && !fe.aus;   // aus: true (Teil 3) = das Gewicht ist weg
      if (fuesse.visible) {
        const m = fe.mitte ?? [-0.45, -0.45];
        // Höhe: auf der (ggf. gebogenen) Diele, knapp darüber
        fuesse.position.set(m[0], yO + 0.004 - (fe.mit_biegung === false ? 0 : 0), m[1]);
        fuesse.rotation.y = ((fe.drehung ?? 0) * Math.PI) / 180;
      }
      // Fingerschatten: gleitet herein, dann spreizen sich die Finger
      // aus: true (Teil 3) = der Fingerschatten ist fort
      const fRoh = fingerEv.filter((e) => t >= e.start).at(-1);
      const f = fRoh && !fRoh.aus ? fRoh : null;
      hand.visible = !!f;
      if (f) {
        const u = glatt((t - f.start) / Math.max(1e-3, f.dauer ?? 0.35));
        const von = f.von ?? [0.3, 0.45], nach = f.nach ?? [-0.05, 0.2];
        hand.position.x = von[0] + (nach[0] - von[0]) * Math.min(1, u * 1.6);
        hand.position.z = von[1] + (nach[1] - von[1]) * Math.min(1, u * 1.6);
        hand.rotation.y = ((f.drehung ?? 0) * Math.PI) / 180;
        hand.scale.set(f.skala ?? 1.3, 1, f.skala ?? 1.3);
        // spreizen erst, wenn die Hand liegt (Review Teil 2: in etwa 0,2 s, deutlich sichtbar)
        const sp = ((f.spreizen ?? 22) * Math.PI) / 180 * glatt((t - f.start - (f.dauer ?? 0.35) * 0.62) / (f.spreiz_dauer ?? 0.2));
        finger.forEach((g, i) => { g.rotation.y = (i - 1.5) * sp * 0.66; });
        for (const sm of saeume) sm.visible = f.saum !== false;
        handflaeche.children[1].visible = f.saum !== false;
      }
      // kalter Saum: leuchtet mit dem Finger-Ereignis oder einem eigenen Glut-Ereignis auf
      // f.glut (Review Teil 3): schwächere Spitzen, sonst blühen sie im dunklen Keller zur Lichtwolke auf
      let glut = f ? (f.glut ?? 0.9) * glatt((t - f.start) / 0.25) : 0;
      for (const e of glutEv) if (t >= e.start) glut = Math.max(glut, (e.staerke ?? 1) * anteil(e, t));
      // Review Teil 2: der breite Saum flutete den Keller türkis; nur noch ein schmaler kalter Rand,
      // die Spitzen leuchten hell
      saumMat.emissiveIntensity = 1.1 * glut;
      spitzenMat.emissiveIntensity = 3.5 * glut;

      // ---------- Teil 3: Finger durch die Fuge ----------
      const fd = fDurch.filter((e) => t >= e.start).at(-1);
      const fz = fd ? fZurueck.filter((e) => e.start >= fd.start && t >= e.start).at(-1) : null;
      const fzEnde = fz ? fz.start + (fz.dauer ?? 0.5) : Infinity;
      finger3.visible = !!fd && t < fzEnde;
      if (finger3.visible) {
        const u = glatt((t - fd.start) / Math.max(1e-3, fd.dauer ?? 0.8));
        // Haltung: gerade (hängt) -> gekrümmt zum Boden (Spitze an der Erde)
        const krumm = glatt((u - 0.35) / 0.65);
        // gleichmäßiger Bogen statt Knick (Probe: mit 0,7 / 0,65 las er sich wie ein Rohr mit Knie)
        let a1 = 0.18 * krumm, a2 = 0.5 * krumm, a3 = 0.62 * krumm;
        // Tasten: die Spitze schabt hin und her und rückt näher (weite in rad)
        const ft = fTasten.filter((e) => e.start >= fd.start && t >= e.start).at(-1);
        if (ft) {
          const tl = Math.min(t - ft.start, ft.dauer ?? 1.2);
          const v = glatt(tl / (ft.dauer ?? 1.2));
          a1 += (ft.weite ?? 0.16) * v;
          a3 += 0.07 * Math.sin(tl * 2 * Math.PI * 2.2) * Math.sin(Math.PI * Math.min(1, tl / (ft.dauer ?? 1.2)));
        }
        // Zurückziehen: wieder gerade und nach oben
        let hoch = 1.0 + F3.glieder.reduce((s, x) => s + x, 0) * (1 - u);
        if (fz) {
          const z2 = glatt((t - fz.start) / (fz.dauer ?? 0.5));
          a1 *= 1 - z2; a2 *= 1 - z2; a3 *= 1 - z2;
          hoch += 1.4 * z2;
        }
        const st = fd.stelle ?? [-1.25, -0.505];
        // Wurzel in der Fuge (y ≥ Unterkante der Dielen); die Glieder hängen nach −y und krümmen sich um die lokale x-Achse
        finger3.position.set(st[0], hoch, st[1]);
        finger3.rotation.set(0, ((fd.drehung ?? -90) * Math.PI) / 180, 0);
        // Krümmung: rotation.x positiv kippt das hängende Glied nach −z (lokal); drehung −90 macht daraus +x
        fingerKetten[0].rotation.x = a1; fingerKetten[1].rotation.x = a2; fingerKetten[2].rotation.x = a3;
      }

      // ---------- Teil 3: Lichtpuls der Fugen ----------
      let puls = 0;
      for (const e of pulsEv) {
        const d = t - e.start;
        if (d < 0 || d > (e.dauer ?? 4)) continue;
        const k = (d / (e.takt ?? 0.7)) % 1;
        puls = Math.max(puls, (e.staerke ?? 1) * (k < 0.15 ? k / 0.15 : Math.exp(-(k - 0.15) / 0.25)));
      }
      pulsFl.visible = puls > 0.002;
      pulsMat.emissiveIntensity = 1.2 * puls;

      // ---------- Teil 3: etwas legt sich auf die Dielen ----------
      const le = liegenEv.filter((e) => t >= e.start && !(e.bis !== undefined && t >= e.bis)).at(-1);
      liegeFl.visible = !!le && !le.aus;
      if (liegeFl.visible) {
        const u = glatt((t - le.start) / Math.max(1e-3, le.dauer ?? 1.5));
        const lang = (le.laenge ?? 2.6) * Math.max(0.02, u), breit = le.breite ?? 0.62;
        const m = le.mitte ?? [-0.6, -0.1];
        liegeFl.position.set(m[0], yO + 0.006, m[1]);
        liegeFl.rotation.y = ((le.drehung ?? 0) * Math.PI) / 180;
        // wächst von einem Ende her (lokal +x -> −x)
        liegeKoerper.scale.set(lang, breit, 1);
        liegeKoerper.position.x = ((le.laenge ?? 2.6) - lang) / 2;
      }
    },
  };
}
