// Set "endkarte": die Karte „PART 2“ nach dem Cliffhanger (anhang-a-serienformat.md A6:
// harter Schnitt ≤ 0,2 s nach dem letzten Wort, dann 1,0 s Endkarte im Kanal-Look, ohne Ton).
//
// Die Schrift ist aus Klötzchen gebaut (Raster 5 × 7 je Zeichen), also im Stil der Serie und ohne
// Schriftdatei. Farbe: das kalte Leuchten von Mister Hundred (#9FD8D2, serie.md), auf fast
// schwarzem Nachtblau. In der Episode weit weg von allen anderen Sets stellen
// ("position": [0, 0, -400]) und in ihrer Einstellung allein zeigen: "set": ["karte"].
// Anker und Kamerapunkt sind lokal; die Engine rechnet sie mit der Set-Position um.
//
// params: text (Std "PART"), zahl (Std "2"), farbe, hintergrund
// Kamerapunkt: karte (frontal); Anker: mitte, zahl.
import * as THREE from 'three';

// 5 × 7-Raster je Zeichen, von oben nach unten ("#" = Klotz)
const ZEICHEN = {
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  2: ['####.', '....#', '....#', '.###.', '#....', '#....', '#####'],
  3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
};

export default async function baue(ctx, params = {}) {
  const gruppe = new THREE.Group();
  const farbe = params.farbe ?? '#9FD8D2';
  const leucht = ctx.leuchtMat(farbe, 2.2);
  const hinten = ctx.mat(params.hintergrund ?? '#070a14', { rauheit: 1 });

  // Hintergrund: große dunkle Wand hinter der Schrift
  const wand = ctx.kiste(30, 40, 0.2, hinten, { schatten: false });
  wand.position.set(0, 2, -0.6);
  gruppe.add(wand);

  // Eine Zeile aus Klötzchen setzen. px = Kantenlänge eines Rasterpunkts in m.
  const zeile = (text, px, mitteY) => {
    const breite = text.length * 6 - 1; // 5 Spalten + 1 Abstand je Zeichen
    [...text].forEach((z, n) => {
      const raster = ZEICHEN[z];
      if (!raster) throw new Error(`endkarte: Zeichen "${z}" fehlt im Raster`);
      raster.forEach((reihe, r) => {
        [...reihe].forEach((c, s) => {
          if (c !== '#') return;
          const x = (n * 6 + s - (breite - 1) / 2) * px;
          const y = mitteY + (3 - r) * px;
          const k = ctx.kiste(px * 0.88, px * 0.88, px * 0.88, leucht, { rund: px * 0.12, schatten: false });
          k.position.set(x, y, 0);
          gruppe.add(k);
        });
      });
    });
  };
  zeile(params.text ?? 'PART', 0.1, 2.75);
  zeile(String(params.zahl ?? '2'), 0.24, 1.25);

  return {
    gruppe,
    anker: { mitte: [0, 2.1, 0], zahl: [0, 1.25, 0] },
    // Frontal, Mitte der beiden Zeilen auf Bildmitte; Abstand so, dass "PART" etwa 70 % der Breite füllt
    kamerapunkte: { karte: { pos: [0, 2.1, 6.4], ziel: [0, 2.1, 0], fov: 50 } },
  };
}
