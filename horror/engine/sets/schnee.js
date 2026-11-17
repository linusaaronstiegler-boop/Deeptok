// Set "schnee": Winter über der Hauptstraße von Kindly (Rules of Kindly F1 S17: Haustür der Lunds; auch
// F3 und F7). Eine Überlagerung in Weltkoordinaten wie "hauptstrasse"/"marsh_haus": mit position [0, 0, 0]
// laden und in Außen-Einstellungen dazu zeigen: "set": ["strasse", "marsh", "schnee"].
// Das Set ändert die Hauptstraße nicht (Hiding Night bleibt, wie es ist); es legt nur Schnee darüber:
//   - Schneedecke auf Wiesen und Vorgärten, festgefahrener Schnee mit Reifenspuren auf der Fahrbahn
//     (auch der Feldweg am Straßenende), Schnee auf den Gehwegen, Pflugwälle an den Bordsteinen.
//     Die Plattenwege zu den Häusern bleiben frei (geräumt: Alltagsregel F3 „jede Familie fegt ihren Weg“).
//   - Schneedecken auf allen Dächern und Verandadächern (Maße wie hauptstrasse/bauteile.baueHaus),
//     Hauben auf Zäunen, Büschen, Blumenkästen, Vorgartenbäumen und geparkten Autos.
// Haustür der Lunds (S17): das Haus der Marshs mit marsh_haus { tuer_als_figur: true } (die Tür geht auf,
// Requisite "tuer" am Anker marsh.tuer_angel, blick 90). Anker und Kamerapunkte lund_* unten.
// Grenzen: Platz vor der Kirche und Hintergrund-Bäume bleiben ohne Schnee (Kamera dort nicht weit öffnen);
// Laubbäume tragen nur Schneehauben über dem Laub.
import * as THREE from 'three';
import { k, verschmelze, MARSH } from '../src/bauteile.js';
import { schneeMat, schneeHaufen, schneeFlaeche, schneeStrasse } from '../src/winter.js';

// Häuser wie in sets/hauptstrasse.js (hausListe): [id, seite, z-Mitte, breite, dach, veranda]
// Bei Änderungen dort hier mitziehen (nur Lage und Maße zählen).
const HAEUSER = [
  ['w1', -1, -31, 10, 'giebel', true], ['w2', -1, -17, 9.5, 'quer', true], ['w4', -1, 17, 10, 'quer', true], ['w5', -1, 31, 9, 'giebel', false],
  ['o1', 1, -34, 9.5, 'quer', true], ['o2', 1, -21, 10, 'giebel', true], ['pike', 1, -7, 10, 'quer', true],
  ['o3', 1, 7, 9.5, 'giebel', true], ['o4', 1, 21, 10, 'quer', true], ['o5', 1, 35, 9, 'quer', false],
];
const AUTOS = [[2.4, 15, 1.5, -0.2], [-2.5, -9.5, 1.47, 0.15], [-2.5, 23.5, 1.47, 0.15], [-2.5, 37.5, 1.47, 0.15], [-2.5, -27.5, 1.47, 0.15]];

export default async function baue(ctx, params = {}) {
  const T = THREE;
  const z = ctx.zufall('schnee');
  const gruppe = new T.Group();
  const statisch = new T.Group(); gruppe.add(statisch);
  const schnee = schneeMat(ctx);
  const dachSchnee = schneeMat(ctx, '#eef3f9', { rauheit: 0.95 });

  // ---------- Boden ----------
  schneeFlaeche(ctx, statisch, 150, 240, 0, 0.012, 10);                 // Wiesen, Vorgärten (unter den Wegen)
  schneeStrasse(ctx, gruppe, 7, -44, 94, 0, 0.044);                    // Fahrbahn und Feldweg am Ende
  for (const sx of [-1, 1]) schneeFlaeche(ctx, statisch, 2.0, 108, sx * 4.6, 0.143, 10);   // Gehwege
  // Pflugwälle an den Bordsteinen (niedrig, unregelmäßig)
  for (let zz = -42; zz < 62; zz += 2.4) for (const sx of [-1, 1]) schneeHaufen(ctx, statisch, sx * (3.3 + z() * 0.15), 0.02, zz + z(), 0.55 + z() * 0.25, 0.22 + z() * 0.12, 1.4, z);

  // ---------- Dächer (Maße aus bauteile.baueHaus: Sockel 0,6, EG 3,0, Decke 0,2, OG 2,8, Neigung 34°) ----------
  const a = (34 * Math.PI) / 180, ueber = 0.45, wandH = 0.6 + 3.0 + 0.2 + 2.8;
  // Schneedecke über einer Dachfläche: gleiche Lage wie die Fläche, 0,14 m entlang ihrer Normalen versetzt
  const dachDecken = (g, b, t, dach) => {
    if (dach === 'quer') {
      const halb = t / 2, steig = halb * Math.tan(a), lang = (halb + ueber) / Math.cos(a);
      const yM = wandH + steig - ((halb + ueber) / 2) * Math.tan(a) + 0.09 / Math.cos(a);
      for (const s of [1, -1]) {
        const zM = -halb + (s * (halb + ueber)) / 2;
        k(g, b + 0.62, 0.12, lang - 0.12, dachSchnee, 0, yM + Math.cos(s * a) * 0.14, zM + Math.sin(s * a) * 0.14, { dreh: [s * a, 0, 0], rund: 0.05 });
      }
    } else {
      const halb = b / 2, steig = halb * Math.tan(a), lang = (halb + ueber) / Math.cos(a);
      const yM = wandH + steig - ((halb + ueber) / 2) * Math.tan(a) + 0.09 / Math.cos(a);
      for (const s of [1, -1]) {
        const xM = (s * (halb + ueber)) / 2;
        k(g, lang - 0.12, 0.12, t + 0.7, dachSchnee, xM + s * Math.sin(a) * 0.14, yM + Math.cos(a) * 0.14, -t / 2, { dreh: [0, 0, -s * a], rund: 0.05 });
      }
    }
  };
  // Verandadach (bauteile.veranda: Höhe Sockel + EG − 0,1, Neigung 0,12)
  const verandaDecke = (g, von, bis, tiefe, so = 0.6, eg = 3.0) => {
    const dachY = so + eg - 0.1;
    k(g, bis - von + 0.3, 0.1, tiefe + 0.25, dachSchnee, (von + bis) / 2, dachY + 0.18 + Math.cos(0.12) * 0.11, tiefe / 2 + 0.05 + Math.sin(0.12) * 0.11, { dreh: [0.12, 0, 0], rund: 0.04 });
  };
  const hausGruppe = (x, zz, drehY) => { const g = new T.Group(); g.position.set(x, 0, zz); g.rotation.y = drehY; statisch.add(g); return g; };

  HAEUSER.forEach(([id, seite, zc, breite, dach, mitVeranda], i) => {
    const g = hausGruppe(seite * 12, zc, -seite * Math.PI / 2);
    dachDecken(g, breite, 8.5, dach);
    if (mitVeranda) verandaDecke(g, -breite / 2 + 0.4, breite / 2 - 0.4, 2.2);
    // Blumenkästen unter den EG-Fenstern (Häuser mit gerader Nummer): Schnee statt Blüten
    const tuerX = (i % 2 ? 1 : -1) * breite * 0.22;
    if (i % 2 === 0) for (const x of [-breite * 0.32, breite * 0.05, breite * 0.33].filter((v) => Math.abs(v - tuerX) > 1.1)) k(g, 1.3, 0.1, 0.26, schnee, x, 0.6 + 0.9 - 0.04, 0.17, { rund: 0.04 });
    // Beete vor Häusern ohne Veranda: Schneewall davor
    if (!mitVeranda) schneeHaufen(ctx, g, 0, 0, 0.4, breite / 2 - 0.3, 0.45, 0.45, z);
    // Zaun: Schnee auf der oberen Latte und auf den Spitzen (Lücke am Tor)
    const tuerWeltZ = zc + (seite < 0 ? -tuerX : tuerX);
    const za = zc - breite / 2 - 1.2, ze = zc + breite / 2 + 1.2;
    for (const [z0, z1] of [[za, tuerWeltZ - 0.7], [tuerWeltZ + 0.7, ze]]) {
      k(statisch, 0.08, 0.045, z1 - z0, schnee, seite * 5.8 - 0.03, 0.95 * 0.72 + 0.05, (z0 + z1) / 2, { rund: 0.015, schatten: false });
      k(statisch, 0.07, 0.04, z1 - z0, schnee, seite * 5.8, 0.99, (z0 + z1) / 2, { rund: 0.015, schatten: false });
    }
    // Büsche und Vorgartenbaum: Schneehauben
    for (const [bz, s] of [[zc - breite * 0.35, 1.1], [zc + breite * 0.36, 1]]) schneeHaufen(ctx, statisch, seite * 11.2, 0.42 * s, bz, 0.62 * s, 0.26, 0.5 * s, z);
    if (i % 2 === 0) for (let j = 0; j < 3; j++) schneeHaufen(ctx, statisch, seite * 8.2 + (z() - 0.5) * 0.9, 3.5 + z() * 0.9, zc + breite * 0.4 + (z() - 0.5) * 0.9, 0.75, 0.22, 0.65, z);
  });

  // ---------- Haus der Marshs (S17: Haustür der Lunds) ----------
  {
    const M = MARSH;
    const g = hausGruppe(M.position[0], M.position[2], (M.drehung * Math.PI) / 180);
    dachDecken(g, M.breite, M.tiefe, 'quer');
    verandaDecke(g, M.veranda.von, M.veranda.bis, M.veranda.tiefe, M.sockel, M.eg);
    // Verandaboden: Schnee an den Rändern liegen geblieben, Laufweg zur Tür frei; Stufen geräumt
    k(g, M.veranda.bis - M.veranda.von - 0.3, 0.04, 0.3, schnee, (M.veranda.von + M.veranda.bis) / 2, M.sockel + 0.02, M.veranda.tiefe - 0.3, { rund: 0.015, schatten: false });
    for (const sx of [-1, 1]) schneeHaufen(ctx, g, M.tuer.x + sx * 0.95, 0, M.veranda.tiefe + 0.5, 0.35, 0.3, 0.45, z);
    const zc = M.position[2], tw = zc - M.tuer.x;
    for (const [z0, z1] of [[zc - 6.2, tw - 0.7], [tw + 0.7, zc + 6.2]]) {
      k(statisch, 0.08, 0.045, z1 - z0, schnee, -5.8 - 0.03, 0.95 * 0.72 + 0.05, (z0 + z1) / 2, { rund: 0.015, schatten: false });
      k(statisch, 0.07, 0.04, z1 - z0, schnee, -5.8, 0.99, (z0 + z1) / 2, { rund: 0.015, schatten: false });
    }
    for (const [bz, s] of [[zc + 4.2, 1.2], [zc - 4.6, 1.0]]) schneeHaufen(ctx, statisch, -11.2, 0.42 * s, bz, 0.62 * s, 0.26, 0.5 * s, z);
    for (let j = 0; j < 3; j++) schneeHaufen(ctx, statisch, -6.4 + (z() - 0.5) * 0.9, 3.6 + z() * 0.8, zc - 5.6 + (z() - 0.5) * 0.9, 0.8, 0.22, 0.7, z);
    // Briefkasten: Haube
    schneeHaufen(ctx, statisch, -6.2, 1.22, tw + 1.0, 0.16, 0.06, 0.26, z);
  }

  // ---------- Geparkte Autos: Schnee auf Dach und Motorhaube ----------
  for (const [x, zz, dachY, versatz] of AUTOS) {
    k(statisch, 1.45, 0.1, 1.9, schnee, x, dachY + 0.05, zz + versatz, { rund: 0.04 });
    k(statisch, 1.6, 0.06, 1.0, schnee, x, 0.98, zz + (versatz < 0 ? 1.55 : -1.55), { rund: 0.03 });
  }

  verschmelze(statisch);

  // Haustür der Lunds = Haustür der Marshs (Weltkoordinaten, README §15.5: Haus-System → Welt [−12 + z, y, −x])
  const tz = MARSH.position[2] - MARSH.tuer.x;   // −1,7
  return {
    gruppe,
    anker: {
      lund_tuer: [-12.0, 1.7, tz],         // Haustür (außen)
      lund_veranda: [-10.75, 0.6, tz],     // der Mann vor der Tür (blick −90: zur Tür)
      lund_flur: [-12.65, 0.6, tz],        // die Frau, die öffnet (blick 90: hinaus)
      lund_weg: [-7.4, 0.05, tz],          // Weg vom Gartentor zur Veranda
    },
    kamerapunkte: {
      lund_halbnah: { pos: [-7.9, 1.85, tz + 0.75], ziel: [-11.6, 1.6, tz], fov: 42 },   // durch die Lücke über den Stufen: Frau in der Tür von vorn, Mann von hinten; kein Verandapfosten im Bild
      lund_totale: { pos: [-1.6, 2.4, 4.2], ziel: [-10.4, 1.6, tz], fov: 46 },       // von der Straße: Haus im Schnee
      lund_gegen: { pos: [-11.95, 2.15, tz + 0.45], ziel: [-10.75, 1.95, tz], fov: 46 }, // von der Türschwelle auf den Mann (Gesicht von vorn, Großaufnahme)
      strasse_schnee: { pos: [0.8, 2.0, 30], ziel: [0, 1.6, -10], fov: 48 },
    },
  };
}
