// Set "hauptstrasse": Hauptstraße und Platz der Kleinstadt (serie.md, Ort 1). Teil 1–4.
// Module (jeweils mit eigenen Kamerapunkten <modul>_totale/_halbtotale/_nah/_detail/_untersicht):
//   platz       Kirche mit Glockenturm und Uhr, Kopfsteinpflaster, Bänke, 6 Laternen, Kirchenstufen
//   haeuser     Häuserzeile: zweistöckige Holzhäuser mit oberen Fenstern und Veranden auf beiden Seiten
//   marsh       Vorgarten der Marshs (Rasen, Zaun mit Tor, Weg, Briefkasten). Das Haus selbst ist das
//               Set "marsh_haus", innen "marsh_innen" (alle drei mit position [0,0,0] laden).
//   pike        Pike-Haus mit Einfahrt (Owens Pick-up: Requisite figuren/pickup.js)
//   ende        Straßenende: Kiefernwald mit Nebelbank
//
// Lage (Welt): Straße entlang z, Fahrbahn x −3,5…3,5, Gehwege bis ±5,6, Vorgärten bis ±12,
// Hausfronten bei x = ±12. Platz im Norden (z < −42), Straßenende im Süden (z > 44).
// Das Marsh-Haus steht westlich (x < 0) bei z = 0, das Pike-Haus östlich bei z = −8.
//
// params:
//   uhr: { zeit: "11:58", spruenge: [{ start: s, zeit: "12:00" }] }   Turmuhr (Zeiger springen zur Zeit)
//   glocke: { schlaege: [s, …] }   die Glocke schwingt nach jedem Schlag (Teil 2); ebenso
//   ereignisse: [{ was: "glocke", start }] aus regie.mjs (set_ereignisse)
//   licht_an: Anteil erleuchteter Fenster (Std 0.55)
//   punktlichter: Std true (2 echte Punktlichter: Laterne am Marsh-Garten, Laterne an den Kirchenstufen)
// Lichtgruppen (Ereignisse "strasse.<name>", alle: "strasse.*"):
//   laterne_marsh, laterne_platz (mit Punktlicht), platz_2 … platz_6, strasse_2 … strasse_7,
//   fenster_<haus>_oben / fenster_<haus>_unten (Häuser w1, w2, w4, w5, o1 … o5, pike), kirche
import * as THREE from 'three';
import {
  k, flaeche, zyl, verschmelze, tmat, baueHaus, fensterLichtMat, zaun, laterne, lichtPfuetzeMat,
  laubbaum, kiefer, busch, briefkasten, bank, nebelKarte, giebel, MARSH,
} from '../src/bauteile.js';

export default async function baue(ctx, params = {}) {
  const T = THREE;
  const z = ctx.zufall('hauptstrasse');
  const gruppe = new T.Group();
  const lichter = {};
  const anker = {};
  const kamerapunkte = {};
  const module = {}; // je Modul eine Gruppe, die getrennt verschmolzen wird (Sichtbarkeitsprüfung bleibt wirksam)
  for (const n of ['boden', 'platz', 'haeuser', 'marsh', 'pike', 'ende', 'hintergrund']) { module[n] = new T.Group(); module[n].name = n; gruppe.add(module[n]); }
  const zier = ctx.mat('#F2EFE7', { rauheit: 0.6 });
  const anteilLicht = params.licht_an ?? 0.55;
  const pfuetzeMatFuer = () => lichtPfuetzeMat(ctx, '#ffb874', 0.5);

  // ---------- Boden: Wiese, Fahrbahn, Gehwege, Bordsteine, Mittellinie ----------
  const B = module.boden;
  const wiese = tmat(ctx, '#56703f', 'gras', { rauheit: 1 });
  const bodenFlaeche = flaeche(gruppe, 420, 420, wiese, 0, 0, 0, [-Math.PI / 2, 0, 0], { welt: true });
  bodenFlaeche.userData.einzeln = true;
  // Welt-UV für die große Wiese direkt setzen (sie wird nicht verschmolzen)
  { const uv = bodenFlaeche.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) - 0.5) * 420, (uv.getY(i) - 0.5) * 420); }
  const asphalt = tmat(ctx, '#3b3d43', 'asphalt', { rauheit: 0.95 });
  const platten = tmat(ctx, '#a9a59d', 'platten', { rauheit: 0.9 });
  const bord = ctx.mat('#8e8a82', { rauheit: 0.9 });
  k(B, 7, 0.04, 108, asphalt, 0, 0.02, 10);
  for (let i = -10; i < 15; i++) k(B, 0.14, 0.012, 1.8, ctx.mat('#d8d2bf', { rauheit: 0.8 }), 0, 0.045, i * 4.2 + 1, { schatten: false });
  for (const sx of [-1, 1]) {
    k(B, 2.0, 0.14, 108, platten, sx * 4.6, 0.07, 10);
    k(B, 0.18, 0.18, 108, bord, sx * 3.58, 0.09, 10, { rund: 0.02 });
    // Querwege zu den Häusern werden je Haus gelegt
  }

  // ---------- Häuser beider Seiten ----------
  const H = module.haeuser;
  const farben = ['#C9B8A3', '#9FB0C4', '#C49D9A', '#A8B697', '#D5C7AC', '#B7A3C2', '#C7B07E', '#8FA9A8'];
  const dachFarben = ['#4a3f3c', '#3d4450', '#5a3c34', '#3f4a3c'];
  const hausListe = [
    // [id, seite (−1 = West, 1 = Ost), z-Mitte, breite, dach, veranda]
    ['w1', -1, -31, 10, 'giebel', true], ['w2', -1, -17, 9.5, 'quer', true], ['w4', -1, 17, 10, 'quer', true], ['w5', -1, 31, 9, 'giebel', false],
    ['o1', 1, -34, 9.5, 'quer', true], ['o2', 1, -21, 10, 'giebel', true], ['pike', 1, -7, 10, 'quer', true],
    ['o3', 1, 7, 9.5, 'giebel', true], ['o4', 1, 21, 10, 'quer', true], ['o5', 1, 35, 9, 'quer', false],
  ];
  const hausGruppen = {};
  hausListe.forEach(([id, seite, zc, breite, dach, mitVeranda], i) => {
    const ziel = id === 'pike' ? module.pike : H;
    const fenster = [];
    const licht = {};
    // Jede Etage jedes Hauses ist eine Lichtgruppe (stabile Namen); welche Fenster leuchten, entscheidet der Seed.
    for (const etage of ['oben', 'unten']) {
      const m = fensterLichtMat(ctx);
      licht[etage] = m;
      lichter[`fenster_${id}_${etage}`] = { lichter: [], materialien: [m] };
    }
    // Türlampe gehört zur Lichtgruppe des Erdgeschosses
    const tuerLampe = ctx.leuchtMat('#ffd9a0', 3);
    lichter[`fenster_${id}_unten`].materialien.push(tuerLampe);
    const tuerX = (i % 2 ? 1 : -1) * breite * 0.22;
    const fx = [-breite * 0.32, breite * 0.05, breite * 0.33].filter((x) => Math.abs(x - tuerX) > 1.1);
    for (const x of fx) fenster.push({ x, etage: 0, b: 1.2, h: 1.5, unten: 0.9, licht: z() < anteilLicht ? licht.unten : null });
    for (const x of [-breite * 0.3, 0, breite * 0.3]) fenster.push({ x, etage: 1, b: 1.1, h: 1.35, unten: 0.85, licht: z() < anteilLicht ? licht.oben : null });
    const haus = baueHaus(ctx, {
      breite, tiefe: 8.5, dach, farbe: farben[i % farben.length], dachFarbe: dachFarben[i % dachFarben.length],
      fenster, tuer: { x: tuerX, b: 1.0, h: 2.2 }, tuerFarbe: ['#7A3B36', '#2f3e5c', '#3f5a3c', '#5a4030'][i % 4],
      veranda: mitVeranda ? { von: -breite / 2 + 0.4, bis: breite / 2 - 0.4, tiefe: 2.2, stufenX: tuerX } : null,
      laeden: i % 3 === 0 ? ['#3f5a3c', '#2f3e5c', '#5a3030'][i % 3] : null, kaesten: i % 2 === 0,
      schornstein: i % 2 ? [breite * 0.25, -5.5] : null,
      seitenFenster: [{ seite: 'links', z: -3, etage: 0 }, { seite: 'rechts', z: -4.5, etage: 1, licht: z() < 0.5 ? licht.oben : null }],
      tuerLampe, beete: true, verandaMoebel: true, zufall: z,
    });
    haus.gruppe.position.set(seite * 12, 0, zc);
    haus.gruppe.rotation.y = -seite * Math.PI / 2;
    ziel.add(haus.gruppe);
    hausGruppen[id] = haus;
    // Vorgarten: Weg, Zaun mit Tor, Briefkasten, Büsche, Baum
    const gx = seite * 5.8;
    const wegZ = zc + -seite * tuerX * -1 * -1; // Tür liegt im Haus-System bei x = tuerX (gedreht)
    const tuerWeltZ = zc + (seite < 0 ? -tuerX : tuerX);
    k(ziel, 6.2, 0.05, 1.2, platten, seite * 8.9, 0.025, tuerWeltZ);
    const zg = new T.Group(); zg.position.set(gx, 0, zc); zg.rotation.y = Math.PI / 2; ziel.add(zg);
    zaun(ctx, zg, -breite / 2 - 1.2, breite / 2 + 1.2, 0, { luecke: [-(tuerWeltZ - zc) - 0.7, -(tuerWeltZ - zc) + 0.7] });
    briefkasten(ctx, ziel, gx + seite * 0.4, tuerWeltZ + 1.0, ['#2f3e5c', '#5a3030', '#3f5a3c'][i % 3], seite * Math.PI / 2);
    busch(ctx, ziel, seite * 11.2, zc - breite * 0.35, z, '#4a6e3a', 1.1);
    busch(ctx, ziel, seite * 11.2, zc + breite * 0.36, z, '#557a40', 1);
    if (i % 2 === 0) laubbaum(ctx, ziel, seite * 8.2, zc + breite * 0.4, z, { groesse: 1.05 });
    anker[`haus_${id}_tuer`] = haus.anker.tuer;
    if (haus.anker.veranda) anker[`haus_${id}_veranda`] = haus.anker.veranda;
    void wegZ;
  });

  // ---------- Vorgarten der Marshs (Haus: Set marsh_haus) ----------
  const Mg = module.marsh;
  {
    const zc = MARSH.position[2];
    const tuerWeltZ = zc - MARSH.tuer.x; // Haus-x zeigt nach Welt −z
    k(Mg, 6.2, 0.05, 1.2, platten, -8.9, 0.025, tuerWeltZ);
    const zg = new T.Group(); zg.position.set(-5.8, 0, zc); zg.rotation.y = Math.PI / 2; Mg.add(zg);
    zaun(ctx, zg, -6.2, 6.2, 0, { luecke: [-(tuerWeltZ - zc) - 0.7, -(tuerWeltZ - zc) + 0.7] });
    briefkasten(ctx, Mg, -6.2, tuerWeltZ + 1.0, '#7A3B36', -Math.PI / 2);
    busch(ctx, Mg, -11.2, zc + 4.2, z, '#4a6e3a', 1.2);
    busch(ctx, Mg, -11.2, zc - 4.6, z, '#557a40', 1.0);
    laubbaum(ctx, Mg, -6.4, zc - 5.6, z, { groesse: 1.1 });
    anker.marsh_garten = [-8.2, 0, zc + 1.6];   // hier steht Mister Hundred im Vorgarten (Satz 34)
    anker.marsh_tor = [-5.8, 0, tuerWeltZ];
    anker.marsh_weg = [-8.5, 0, tuerWeltZ];
    anker.marsh_briefkasten = [-6.2, 1.1, tuerWeltZ + 1.0];
  }

  // ---------- Laternen der Straße ----------
  const strassenLaternen = [[-4.9, 6, 'laterne_marsh', true], [4.9, -6, 'strasse_2'], [-4.9, -20, 'strasse_3'], [4.9, -34, 'strasse_4'], [4.9, 20, 'strasse_5'], [-4.9, 34, 'strasse_6'], [4.9, 46, 'strasse_7']];
  for (const [lx, lz, name, punkt] of strassenLaternen) {
    const l = laterne(ctx, module.haeuser, lx, lz, { richtung: -Math.sign(lx), pfuetzeMat: pfuetzeMatFuer() });
    const gr = { lichter: [], materialien: [l.leucht, l.pfuetze.material] };
    if (punkt && params.punktlichter !== false) {
      const pl = new T.PointLight('#ffb36b', 16, 14, 1.7);
      pl.position.set(lx - Math.sign(lx) * 0.62, 3.9, lz);
      gruppe.add(pl);
      gr.lichter.push(pl);
    }
    lichter[name] = gr;
  }
  anker.laterne_marsh = [-4.3, 4.1, 6];

  // ---------- Platz mit Kirche ----------
  const P = module.platz;
  const pflaster = tmat(ctx, '#a39d92', 'pflaster', { rauheit: 0.95 });
  k(P, 34, 0.06, 32, pflaster, 0, 0.03, -58);
  for (const sx of [-1, 1]) k(P, 0.3, 0.4, 32, tmat(ctx, '#9a948a', 'stein'), sx * 17, 0.2, -58);
  // Kirche: weißer Holzbau, steiles Dach, Turm vorn mit Uhr und Schallluken
  const weiss = tmat(ctx, '#ECE8DE', 'verkleidung', { rauheit: 0.8 });
  const kirchenDach = tmat(ctx, '#3d4450', 'schindeln', { rauheit: 0.9 });
  const kz = -80; // Rückwand
  k(P, 11, 8, 16, weiss, 0, 4.6, kz + 8);
  k(P, 11.6, 1.2, 16.6, tmat(ctx, '#9a948a', 'stein'), 0, 0.6, kz + 8);
  const aD = 0.82;
  for (const s of [1, -1]) k(P, 7.8, 0.2, 17.2, kirchenDach, s * 2.85, 8.6 + 2.3, kz + 8, { dreh: [0, 0, -s * aD] });
  giebel(P, 11, 5.15, weiss, 0, 8.6, kz + 16, 0);
  giebel(P, 11, 5.15, weiss, 0, 8.6, kz, Math.PI);
  const kircheLicht = fensterLichtMat(ctx, '#ffcf8a', 1.6);
  lichter.kirche = { lichter: [], materialien: [kircheLicht] };
  for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) {
    const g = new T.Group(); g.position.set(sx * 5.5, 0, kz + 3 + i * 3.4); g.rotation.y = sx * Math.PI / 2; P.add(g);
    k(g, 1.1, 3.2, 0.05, i % 2 ? kircheLicht : ctx.mat('#2a3242', { rauheit: 0.25 }), 0, 4.6, 0.02, { schatten: false });
    k(g, 1.3, 0.12, 0.12, zier, 0, 2.95, 0.06); k(g, 1.3, 0.12, 0.12, zier, 0, 6.25, 0.06);
    giebel(g, 1.3, 0.55, zier, 0, 6.31, 0.07); // spitzer Fensterabschluss
  }
  // Turm
  const tz = kz + 17;
  if (params.glocke?.offen) {
    // offene Glockenstube (Review Teil 2): Turm bis unter die Schallluken massiv, darüber Wände mit einer
    // Öffnung zur Straße und dunkler Innenwand, damit die Glocke als Form vor dem Dunkel steht
    k(P, 4.4, 12.75, 4.4, weiss, 0, 6.375, tz);
    k(P, 4.4, 2.3, 0.2, weiss, 0, 13.9, tz - 2.1);                        // Rückseite
    for (const sx of [-1, 1]) {
      k(P, 0.2, 2.3, 4.4, weiss, sx * 2.1, 13.9, tz);                     // Seiten
      k(P, 1.35, 2.3, 0.2, weiss, sx * 1.525, 13.9, tz + 2.1);            // Vorderseite links und rechts der Luke
    }
    k(P, 4.0, 2.3, 0.05, ctx.mat('#15161c', { rauheit: 1 }), 0, 13.9, tz - 1.95);   // dunkle Innenwand
    k(P, 4.4, 0.3, 4.4, weiss, 0, 15.0, tz);
  } else k(P, 4.4, 15, 4.4, weiss, 0, 7.5, tz);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k(P, 0.25, 15, 0.25, zier, sx * 2.2, 7.5, tz + sz * 2.2);
  k(P, 4.8, 0.3, 4.8, zier, 0, 12.2, tz);
  // Glockenstube mit Schallluken (Lamellen) auf allen vier Seiten
  const lamelle = ctx.mat('#4a4e58', { rauheit: 0.8 });
  for (let s = 0; s < 4; s++) {
    const g = new T.Group(); g.position.set(0, 0, tz); g.rotation.y = (s * Math.PI) / 2; P.add(g);
    // Review Teil 2: Die Glocke war nie zu sehen. params.glocke.offen: die Schallluke zur Straße (Seite 0)
    // ohne Lamellen, dahinter hängt die Glocke im Mondlicht
    if (!(s === 0 && params.glocke?.offen)) for (let i = 0; i < 6; i++) k(g, 1.6, 0.08, 0.3, lamelle, 0, 12.9 + i * 0.32, 2.15, { dreh: [0.5, 0, 0], schatten: false });
    k(g, 0.3, 2.3, 0.3, zier, -1.0, 13.7, 2.2); k(g, 0.3, 2.3, 0.3, zier, 1.0, 13.7, 2.2);
  }
  // Glocke an einem Drehpunkt unter dem Joch (eigenes Objekt, nicht verschmolzen): schwingt nach jedem
  // Schlag aus params.glocke.schlaege (Teil 2, Satz 40 „The bell struck midnight“)
  const glockeDreh = new T.Group(); glockeDreh.position.set(0, 14.15, tz); glockeDreh.userData.einzeln = true; P.add(glockeDreh);
  const glocke = zyl(glockeDreh, 0.45, 0.85, 1.1, ctx.mat('#7a5a2a', { metall: 0.7, rauheit: 0.35, kante: params.glocke?.offen ? { farbe: '#ffd9a0', staerke: 0.8, exponent: 2.0 } : undefined }), 0, -0.65, 0, { segmente: 14 });
  glocke.userData.einzeln = true;
  const kloeppel = zyl(glockeDreh, 0.08, 0.08, 0.9, ctx.mat('#3a3a3c', { metall: 0.7, rauheit: 0.4 }), 0, -0.85, 0, { segmente: 8 });
  kloeppel.userData.einzeln = true;
  k(P, 5, 0.3, 5, zier, 0, 15.05, tz);
  const spitze = new T.Mesh(new T.ConeGeometry(3.3, 8, 4), kirchenDach);
  spitze.rotation.y = Math.PI / 4; spitze.position.set(0, 19.2, tz); spitze.castShadow = true; P.add(spitze);
  k(P, 0.12, 1.6, 0.12, ctx.mat('#c9a85a', { metall: 0.8, rauheit: 0.3 }), 0, 23.8, tz);
  k(P, 0.7, 0.12, 0.12, ctx.mat('#c9a85a', { metall: 0.8, rauheit: 0.3 }), 0, 23.9, tz);
  // Turmuhr: Zifferblatt mit Strichen, Zeiger als eigene Objekte (params.uhr)
  const blatt = ctx.zeichenTextur((g, w, h) => {
    g.fillStyle = '#f4efe2'; g.beginPath(); g.arc(w / 2, h / 2, w / 2, 0, 2 * Math.PI); g.fill();
    g.strokeStyle = '#1f1f22'; g.lineWidth = w * 0.035; g.beginPath(); g.arc(w / 2, h / 2, w * 0.47, 0, 2 * Math.PI); g.stroke();
    for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; g.lineWidth = i % 3 ? w * 0.02 : w * 0.045; g.beginPath(); g.moveTo(w / 2 + Math.sin(a) * w * 0.33, h / 2 - Math.cos(a) * h * 0.33); g.lineTo(w / 2 + Math.sin(a) * w * 0.42, h / 2 - Math.cos(a) * h * 0.42); g.stroke(); }
  }, 256, 256);
  const uhrMat = new T.MeshStandardMaterial({ map: blatt, roughness: 0.6, transparent: true, alphaTest: 0.5 });
  const uhr = new T.Group(); uhr.position.set(0, 10.4, tz + 2.24); P.add(uhr);
  const scheibe = new T.Mesh(new T.CircleGeometry(1.1, 32), uhrMat); scheibe.userData.einzeln = true; uhr.add(scheibe);
  const ring = new T.Mesh(new T.TorusGeometry(1.12, 0.07, 6, 32), zier); ring.userData.einzeln = true; uhr.add(ring);
  const zeigerMat = ctx.mat('#141416', { rauheit: 0.4 });
  const stunde = new T.Group(); stunde.position.z = 0.03; uhr.add(stunde);
  const minute = new T.Group(); minute.position.z = 0.05; uhr.add(minute);
  const zs = k(stunde, 0.1, 0.62, 0.03, zeigerMat, 0, 0.24, 0, { schatten: false }); zs.userData.einzeln = true;
  const zm = k(minute, 0.07, 0.9, 0.03, zeigerMat, 0, 0.38, 0, { schatten: false }); zm.userData.einzeln = true;
  const zeitZuWinkel = (zeit) => { const [hh, mm] = zeit.split(':').map(Number); return { m: -(mm / 60) * 2 * Math.PI, h: -(((hh % 12) + mm / 60) / 12) * 2 * Math.PI }; };
  const uhrSpec = params.uhr ?? { zeit: '11:58' };
  // Kirchentür, Stufen, Bänke, Anschlagtafel, Gedenkstein, Bäume
  const stufen = tmat(ctx, '#b3ada2', 'stein');
  for (let i = 0; i < 5; i++) k(P, 5.4 - i * 0.2, 0.18, 0.4, stufen, 0, 0.09 + i * 0.18, tz + 2.2 + 2.0 - i * 0.4);
  k(P, 2.2, 3.2, 0.12, ctx.mat('#7A3B36', { rauheit: 0.6 }), 0, 0.9 + 1.6, tz + 2.24);
  k(P, 0.06, 3.2, 0.16, ctx.mat('#4a2420'), 0, 2.5, tz + 2.26);
  k(P, 2.7, 0.3, 0.2, zier, 0, 4.25, tz + 2.26);
  giebel(P, 3.0, 0.9, zier, 0, 4.4, tz + 2.37); // Ziergiebel über der Tür
  bank(ctx, P, -7, -52, Math.PI / 2); bank(ctx, P, 7, -52, -Math.PI / 2);
  k(P, 1.6, 1.1, 0.12, tmat(ctx, '#6a4a32', 'holz'), -10, 1.6, -45, { rund: 0.02 });
  k(P, 0.1, 1.6, 0.1, ctx.mat('#4a3426'), -10.7, 0.8, -45); k(P, 0.1, 1.6, 0.1, ctx.mat('#4a3426'), -9.3, 0.8, -45);
  for (let i = 0; i < 5; i++) k(P, 0.3, 0.22, 0.02, ctx.mat(['#e8e0c8', '#d8c8a8', '#f0e8d8'][i % 3]), -10.5 + i * 0.25, 1.65 + (i % 2) * 0.3, -44.93, { schatten: false });
  k(P, 1.2, 2.4, 0.6, tmat(ctx, '#8a857c', 'stein'), 10, 1.2, -46);
  k(P, 1.6, 0.3, 1.0, tmat(ctx, '#7a756c', 'stein'), 10, 0.15, -46);
  for (const [bx, bz] of [[-13, -46], [13, -50], [-13, -70], [13, -70], [-13, -58]]) laubbaum(ctx, P, bx, bz, z, { groesse: 1.25 });
  // 6 Laternen um den Platz; die an den Kirchenstufen hat ein echtes Punktlicht
  const platzLaternen = [[-3.6, -56, 'laterne_platz', true], [3.6, -56, 'platz_2'], [-9, -48, 'platz_3'], [9, -48, 'platz_4'], [-9, -64, 'platz_5'], [9, -64, 'platz_6']];
  for (const [lx, lz, name, punkt] of platzLaternen) {
    const l = laterne(ctx, P, lx, lz, { richtung: Math.sign(lx), pfuetzeMat: pfuetzeMatFuer() });
    const gr = { lichter: [], materialien: [l.leucht, l.pfuetze.material] };
    if (punkt && params.punktlichter !== false) {
      const pl = new T.PointLight('#ffb36b', 18, 15, 1.7);
      pl.position.set(lx + Math.sign(lx) * 0.62, 3.9, lz);
      gruppe.add(pl); gr.lichter.push(pl);
    }
    lichter[name] = gr;
  }
  anker.platz_mitte = [0, 0, -54];
  anker.kirche_tuer = [0, 1.8, tz + 2.4];
  anker.kirche_stufen = [0, 0.9, tz + 4.4];
  anker.kirche_uhr = [0, 10.4, tz + 2.3];
  anker.glocke = [0, 13.5, tz];
  anker.turm_spitze = [0, 23, tz];
  anker.monster_platz = [2.5, 0, -54];    // Platzende im Nebel, vor der Kirche (Satz 1, 2, 20)
  anker.bank = [-7, 0.45, -52];

  // ---------- Pike-Haus: Einfahrt ----------
  const Pk = module.pike;
  k(Pk, 6.6, 0.05, 3.4, asphalt, 8.9, 0.026, -12.6);
  k(Pk, 0.4, 0.5, 0.4, ctx.mat('#b8392f', { rauheit: 0.5 }), 5.3, 0.25, -14.5, { rund: 0.08 }); // Hydrant
  k(Pk, 0.25, 0.15, 0.25, ctx.mat('#b8392f'), 5.3, 0.55, -14.5, { rund: 0.06 });
  for (let i = 0; i < 2; i++) { zyl(Pk, 0.32, 0.28, 1.0, ctx.mat(i ? '#3f5a3c' : '#2f3e5c', { rauheit: 0.6 }), 11.2, 0.5, -11.0 - i * 0.75, { segmente: 10 }); }
  anker.pike_einfahrt = [8.6, 0, -12.6];  // Stellplatz für den Pick-up (Front zur Straße: blick −90)
  anker.pike_tuer = hausGruppen.pike.anker.tuer;
  anker.pike_veranda = hausGruppen.pike.anker.veranda;

  // ---------- Straßenende: Kiefernwald mit Nebelbank ----------
  const E = module.ende;
  k(E, 7, 0.04, 30, tmat(ctx, '#6a5a48', 'erde', { rauheit: 1 }), 0, 0.02, 79);
  for (let i = 0; i < 2; i++) k(E, 4.5, 0.6, 0.15, ctx.mat(i ? '#ECE8DE' : '#b8392f', { rauheit: 0.6 }), 0, 0.85 + i * 0.01, 63.9 + i * 0.02);
  for (const sx of [-2, 2]) k(E, 0.15, 1.1, 0.15, ctx.mat('#ECE8DE'), sx, 0.55, 64);
  for (let i = 0; i < 9; i++) k(E, i % 2 ? 0.55 : 0.5, 0.12, 0.02, ctx.mat(i % 2 ? '#b8392f' : '#ECE8DE'), -2.25 + i * 0.5 + 0.25, 0.85, 64.02, { schatten: false });
  for (let r = 0; r < 7; r++) {
    for (let i = 0; i < 22; i++) {
      const x = -44 + i * 4 + (z() - 0.5) * 2.5 + (r % 2) * 2;
      if (Math.abs(x) < 4.5 && r < 6) continue; // Schneise für den Feldweg
      kiefer(ctx, E, x, 66 + r * 5 + (z() - 0.5) * 2, z, { groesse: 1.1 + r * 0.08 });
    }
  }
  for (let i = 0; i < 4; i++) nebelKarte(ctx, E, (i - 1.5) * 16, 4, 64 + i * 3, 30, 9, Math.PI + (z() - 0.5) * 0.2, 0.4);
  for (let i = 0; i < 3; i++) nebelKarte(ctx, gruppe, (i - 1) * 14, 3, -78 - i * 4, 26, 8, 0, 0.3);
  anker.ende_nebel = [0, 1.5, 66];
  anker.ende_schranke = [0, 0.9, 64];

  // ---------- Hintergrund: Bäume hinter den Häusern, Strommasten ----------
  const Hg = module.hintergrund;
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 18; i++) {
      const zz = -60 + i * 7 + (z() - 0.5) * 3;
      if (z() < 0.55) kiefer(ctx, Hg, sx * (25 + z() * 8), zz, z, { groesse: 1.2 });
      else laubbaum(ctx, Hg, sx * (24 + z() * 6), zz, z, { groesse: 1.4 });
    }
  }
  const holzMast = ctx.mat('#5a4636', { rauheit: 0.9 });
  const draht = ctx.mat('#1a1a1c', { rauheit: 0.6 });
  const masten = [];
  // Holzmasten mit Querträger, dazwischen zwei Leitungen (Silhouetten gegen den Himmel)
  for (let zz = -36; zz <= 56; zz += 23) { zyl(Hg, 0.13, 0.16, 9, holzMast, 6.4, 4.5, zz, { segmente: 7 }); k(Hg, 2.2, 0.12, 0.12, holzMast, 6.4, 8.4, zz); masten.push(zz); }
  for (let i = 0; i + 1 < masten.length; i++) for (const dx of [-0.9, 0.9]) k(Hg, 0.025, 0.025, 20, draht, 6.4 + dx, 8.52, masten[i] + 10, { schatten: false });
  // geparktes Auto (gedecktes Rot) und Mülltonnen
  const auto = new T.Group(); auto.position.set(2.4, 0, 15); Hg.add(auto);
  const lack = ctx.mat('#7a3b36', { rauheit: 0.4, metall: 0.2 });
  k(auto, 1.8, 0.7, 4.3, lack, 0, 0.6, 0, { rund: 0.12 });
  k(auto, 1.6, 0.6, 2.2, lack, 0, 1.2, -0.2, { rund: 0.12 });
  k(auto, 1.62, 0.45, 2.0, ctx.mat('#1d2633', { rauheit: 0.15, metall: 0.2 }), 0, 1.22, -0.2, { rund: 0.06 });
  for (const [ax, az] of [[-0.85, 1.35], [0.85, 1.35], [-0.85, -1.35], [0.85, -1.35]]) zyl(auto, 0.34, 0.34, 0.22, ctx.mat('#1b1c1f'), ax, 0.34, az, { dreh: [0, 0, Math.PI / 2], segmente: 14 });

  // Weitere geparkte Autos auf der Westseite (Review Folge 1: die Straße war zu leer, Kantendichte
  // 9 % gegen 16 % bei r2). Die Ostspur bleibt frei für Owens Pick-up.
  for (const [ax, az, farbe] of [[-2.5, -9.5, '#2f4f6a'], [-2.5, 23.5, '#4f5f3e'], [-2.5, 37.5, '#8a7656'], [-2.5, -27.5, '#5c5f66']]) {
    const g = new T.Group(); g.position.set(ax, 0, az); Hg.add(g);
    const l2 = ctx.mat(farbe, { rauheit: 0.4, metall: 0.2 });
    k(g, 1.8, 0.7, 4.2, l2, 0, 0.6, 0, { rund: 0.12 });
    k(g, 1.6, 0.58, 2.1, l2, 0, 1.18, 0.15, { rund: 0.12 });
    k(g, 1.62, 0.42, 1.9, ctx.mat('#1d2633', { rauheit: 0.15, metall: 0.2 }), 0, 1.2, 0.15, { rund: 0.06 });
    for (const [rx, rz] of [[-0.85, 1.3], [0.85, 1.3], [-0.85, -1.3], [0.85, -1.3]]) zyl(g, 0.34, 0.34, 0.22, ctx.mat('#1b1c1f'), rx, 0.34, rz, { dreh: [0, 0, Math.PI / 2], segmente: 14 });
    for (const sx of [-0.6, 0.6]) k(g, 0.3, 0.12, 0.04, ctx.mat('#c43a2e', { leuchten: '#c43a2e', leuchtStaerke: 0.6 }), sx, 0.75, -2.11, { schatten: false });
  }
  // Schild am Straßenende: gelbe Raute "DEAD END" (Satz 13 "You can't run, either")
  {
    const schildTex = ctx.zeichenTextur((g, w, h) => {
      g.fillStyle = '#e8b830'; g.beginPath(); g.moveTo(w / 2, 4); g.lineTo(w - 4, h / 2); g.lineTo(w / 2, h - 4); g.lineTo(4, h / 2); g.closePath(); g.fill();
      g.strokeStyle = '#141414'; g.lineWidth = 10; g.beginPath(); g.moveTo(w / 2, 22); g.lineTo(w - 22, h / 2); g.lineTo(w / 2, h - 22); g.lineTo(22, h / 2); g.closePath(); g.stroke();
      g.fillStyle = '#141414'; g.textAlign = 'center'; g.font = 'bold 54px sans-serif';
      g.fillText('DEAD', w / 2, h / 2 - 6); g.fillText('END', w / 2, h / 2 + 50);
    }, 256, 256);
    const schild = new T.Mesh(new T.PlaneGeometry(1.0, 1.0), new T.MeshStandardMaterial({ map: schildTex, transparent: true, alphaTest: 0.5, roughness: 0.5 }));
    schild.position.set(2.9, 2.3, 61.0); schild.rotation.y = Math.PI + 0.25; schild.castShadow = true;
    module.ende.add(schild);
    zyl(module.ende, 0.04, 0.04, 2.3, ctx.mat('#8a8e94', { metall: 0.6, rauheit: 0.4 }), 2.9, 1.15, 61.05, { segmente: 8 });
  }

  // ---------- Straßenmöbel: Fahrräder an Vorgartenzäunen, Mülltonnen, Straßenschild, Bank ----------
  const fahrrad = (x, zz, dreh, farbe) => {
    const g = new T.Group(); g.position.set(x, 0, zz); g.rotation.set(0, dreh, 0.08); module.haeuser.add(g);
    const rahmen = ctx.mat(farbe, { rauheit: 0.5, metall: 0.3 }), reifen = ctx.mat('#1b1c1f', { rauheit: 0.8 });
    for (const rz of [-0.5, 0.5]) { const r = new T.Mesh(new T.TorusGeometry(0.32, 0.035, 6, 18), reifen); r.position.set(0, 0.34, rz); r.rotation.y = Math.PI / 2; r.castShadow = true; g.add(r); }
    k(g, 0.04, 0.04, 0.9, rahmen, 0, 0.62, 0, { dreh: [0.25, 0, 0] });
    k(g, 0.04, 0.5, 0.04, rahmen, 0, 0.55, -0.15, { dreh: [-0.3, 0, 0] });
    k(g, 0.04, 0.45, 0.04, rahmen, 0, 0.6, 0.42, { dreh: [0.2, 0, 0] });
    k(g, 0.1, 0.04, 0.22, ctx.mat('#2a2a2c'), 0, 0.84, -0.22);
    k(g, 0.46, 0.04, 0.04, rahmen, 0, 0.86, 0.48);
  };
  fahrrad(6.2, 3.0, 0.1, '#c0392b');
  fahrrad(-6.2, -22.6, -0.1, '#2f6b9a');
  fahrrad(6.2, 25.5, 0.05, '#4f7a3a');
  for (const [tx, tz] of [[5.3, 2.0], [5.3, 2.7], [-5.3, -12.5], [-5.3, 20.6], [5.3, 30.4]]) {
    zyl(module.haeuser, 0.3, 0.27, 0.95, ctx.mat(tz > 0 ? '#3f5a3c' : '#2f3e5c', { rauheit: 0.6 }), tx, 0.62, tz, { segmente: 10 });
    zyl(module.haeuser, 0.33, 0.33, 0.06, ctx.mat('#2a2a2c', { rauheit: 0.6 }), tx, 1.12, tz, { segmente: 10 });
  }
  zyl(module.haeuser, 0.04, 0.04, 2.8, ctx.mat('#7a7d80', { metall: 0.6 }), -4.4, 1.54, -40, { segmente: 6 });
  k(module.haeuser, 0.05, 0.25, 1.2, ctx.mat('#3f5a3c', { rauheit: 0.5 }), -4.4, 2.85, -40);
  k(module.haeuser, 0.05, 0.25, 1.0, ctx.mat('#3f5a3c', { rauheit: 0.5 }), -4.4, 2.55, -40, { dreh: [0, Math.PI / 2, 0] });
  bank(ctx, module.haeuser, 5.2, -27, -Math.PI / 2);

  // ---------- Verschmelzen je Modul (spart Zeichenaufrufe, Module bleiben einzeln sichtbar) ----------
  for (const g of Object.values(module)) verschmelze(g);

  // ---------- Kamerapunkte (je Modul 5: totale, halbtotale, nah, detail, untersicht) ----------
  Object.assign(kamerapunkte, {
    platz_totale: { pos: [-7, 8.5, -32], ziel: [0, 5, -60], fov: 52 },
    platz_halbtotale: { pos: [4, 1.7, -44], ziel: [0, 2.5, -60], fov: 46 },
    platz_nah: { pos: [2.2, 1.6, -54], ziel: [0, 1.6, -60], fov: 40 },
    platz_detail: { pos: [0, 10.2, -55.5], ziel: [0, 10.4, -60.7], fov: 30 },
    platz_untersicht: { pos: [1.5, 0.4, -50], ziel: [0, 9, -63], fov: 58 },
    haeuser_totale: { pos: [1.5, 11, 32], ziel: [0, 2, -6], fov: 52 },
    haeuser_halbtotale: { pos: [3.2, 1.6, 18], ziel: [6, 3, 2], fov: 48 },
    haeuser_nah: { pos: [6.8, 1.5, 12.5], ziel: [9.6, 1.4, 7], fov: 42 },
    haeuser_detail: { pos: [9.3, 1.75, 9.15], ziel: [10.9, 0.62, 7.9], fov: 40 },  // Verandaboden (Satz 12: Schuhe)
    haeuser_untersicht: { pos: [3, 0.35, -14], ziel: [12, 5.5, -19], fov: 56 },
    marsh_totale: { pos: [6, 6.5, 14], ziel: [-9, 3, -1], fov: 50 },
    marsh_halbtotale: { pos: [-1.5, 1.6, 6], ziel: [-9, 2.5, -1], fov: 46 },
    marsh_nah: { pos: [-5.0, 1.4, 1.8], ziel: [-8.2, 1.3, 0.4], fov: 42 },
    marsh_detail: { pos: [-4.6, 1.3, -1.4], ziel: [-6.2, 1.0, -0.7], fov: 38 },
    marsh_untersicht: { pos: [-7.0, 0.35, 3.6], ziel: [-12, 5.4, 2.6], fov: 58 },
    pike_totale: { pos: [-2, 6.5, 2], ziel: [10, 2, -10], fov: 50 },
    pike_halbtotale: { pos: [2, 1.6, -4], ziel: [9, 1.2, -12], fov: 46 },
    pike_nah: { pos: [6.4, 1.6, -16.4], ziel: [8.6, 1.2, -12.6], fov: 44 },
    pike_detail: { pos: [8.3, 1.9, -15.0], ziel: [8.6, 1.25, -12.9], fov: 36 },
    pike_untersicht: { pos: [4.2, 0.35, -9], ziel: [12, 5, -8], fov: 56 },
    ende_totale: { pos: [0, 8, 32], ziel: [0, 2, 70], fov: 48 },
    ende_halbtotale: { pos: [1.2, 1.6, 48], ziel: [0, 2, 70], fov: 44 },
    ende_nah: { pos: [1.6, 1.5, 54], ziel: [0, 1.4, 66], fov: 42 },
    ende_detail: { pos: [1.3, 0.75, 53.2], ziel: [0.3, 0.15, 56], fov: 36 },
    ende_untersicht: { pos: [0.8, 0.3, 52], ziel: [0, 6, 72], fov: 56 },
  });

  let uhrAlt = null;
  // Glockenschläge: params.glocke.schlaege oder Set-Ereignisse { was: "glocke", start } des Shotlisten-Compilers
  const glockenSchlaege = [...(params.glocke?.schlaege ?? []), ...(params.ereignisse ?? []).filter((e) => e.was === 'glocke').map((e) => e.start)];
  return {
    gruppe, anker, lichter, kamerapunkte,
    vordergrund: {
      // Lattenzaun als Wisch-Objekt für Seitenfahrten ("art": "zaun")
      zaun: (v) => { const g = new T.Group(); zaun(ctx, g, -0.8, 0.8, 0, { hoehe: v.hoehe && v.hoehe < 2 ? v.hoehe : 0.95 }); return g; },
    },
    // Turmuhr: Zeiger springen zu den Zeiten aus params.uhr.spruenge (nur von t abhängig)
    aktualisiere(t) {
      // Glocke: gedämpftes Pendeln nach jedem Schlag (nur aus t gerechnet)
      let w = 0;
      for (const s0 of glockenSchlaege) {
        const d = t - s0;
        if (d >= 0) w += 0.42 * Math.sin(d * 2 * Math.PI * 0.55) * Math.exp(-d * 0.45) * Math.min(1, d / 0.12);
      }
      glockeDreh.rotation.x = w;
      let zeit = uhrSpec.zeit ?? '11:58';
      for (const s of uhrSpec.spruenge ?? []) if (t >= s.start) zeit = s.zeit;
      if (zeit === uhrAlt) return;
      const zw = zeitZuWinkel(zeit);
      minute.rotation.z = zw.m; stunde.rotation.z = zw.h;
      uhrAlt = zeit;
    },
  };
}
