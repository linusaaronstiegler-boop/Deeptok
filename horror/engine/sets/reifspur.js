// Set "reifspur": Reif auf dem Rasen der Marshs und die Spur von Mister Hundred (Teil 2, Sätze 4–5).
// Mit position [0, 0, 0] laden (Weltkoordinaten wie hauptstrasse / marsh_haus) und in den Außen-
// Einstellungen der Dämmerung dazu zeigen: "set": ["strasse", "marsh", "spur"].
//
// Die Spur führt von Junes Seitenfenster (Erdgeschoss, Hauswand links bei z = +5) an der Hauswand
// entlang um die Ecke in den Vorgarten, bis zu der Stelle, an der der Riese am Ende von Teil 1 stand
// ([−8, 0, 2,6] vor Elis Fenster). Wichtig für die Geschichte (serie.md, Hinweis fürs Wiederansehen):
// Die Zehen zeigen VOM Fenster WEG. Es kam aus Junes Fenster, der Erzähler liest „stopped at“.
//
// Technik: eine Fläche knapp über dem Boden mit einer Leinwand-Textur: weißblauer Reif mit Rauschen,
// die Abdrücke sind ausgespart (dort sieht man das dunkle Gras). Abdruck: 0,95 m lang, 0,26 m breit,
// vier lange Zehen (Maße der Figur mister_hundred), ein heller Rand aus zusammengeschobenem Reif.
// Kein eigenes Licht.
// Anker: spur_fenster (letzter Abdruck unter Junes Fenster), spur_ecke, spur_garten, june_fenster
//        (Mitte von Junes Seitenfenster außen), abdruck_<n>
// Kamerapunkte: draufsicht (über den Abdrücken an der Ecke), entlang (flach an der Spur), fenster
import * as THREE from 'three';

// Fläche des Reifs (Welt): x −21,6 … −5,9 (Zaun), z −5,6 … 10,1
const X0 = -21.6, X1 = -5.9, Z0 = -5.6, Z1 = 10.1; // quadratisch wie die Leinwand
const PX = 2048; // Pixel je Kante

// Spur: Schrittpunkte [x, z] in Gehrichtung (vom Fenster weg). Abwechselnd links/rechts.
const WEG = [[-18.9, 5.85], [-16.8, 5.95], [-14.7, 6.0], [-12.6, 5.85], [-10.7, 5.2], [-9.2, 4.1], [-8.15, 2.95]];

export function abdruecke() {
  const liste = [];
  for (let i = 0; i < WEG.length; i++) {
    const a = WEG[Math.max(0, i - 1)], b = WEG[Math.min(WEG.length - 1, i + 1)];
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const l = Math.hypot(dx, dz) || 1;
    const seite = i % 2 ? 1 : -1;                 // rechts/links der Gehlinie
    const nx = -dz / l, nz = dx / l;
    liste.push({ x: WEG[i][0] + nx * 0.17 * seite, z: WEG[i][1] + nz * 0.17 * seite, winkel: Math.atan2(dz, dx), seite });
  }
  // am Ende: beide Füße nebeneinander, zum Haus gedreht (dort stand es, blick −90 = schaut nach −x)
  liste.push({ x: -8.0, z: 2.38, winkel: Math.PI, seite: 1 });
  liste.push({ x: -8.0, z: 2.82, winkel: Math.PI, seite: -1 });
  return liste;
}

export default async function baue(ctx, params = {}) {
  const T = THREE;
  const z = ctx.zufall('reifspur');
  const gruppe = new T.Group();
  const breite = X1 - X0, tiefe = Z1 - Z0;
  const proM = PX / Math.max(breite, tiefe);
  const zuPx = (x, zz) => [(x - X0) * proM, (zz - Z0) * proM];
  const liste = abdruecke();

  const tex = ctx.zeichenTextur((g, w, h) => {
    g.clearRect(0, 0, w, h);
    // Reif: weißblau, fleckig, zum Rand hin dünner (kein harter Rand auf dem Rasen)
    g.fillStyle = 'rgba(214,228,240,0.7)';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26000; i++) {
      const v = z();
      g.fillStyle = v < 0.55 ? `rgba(255,255,255,${0.1 + z() * 0.25})` : `rgba(120,140,150,${z() * 0.18})`;
      g.fillRect(z() * w, z() * h, 1 + z() * 3, 1 + z() * 3);
    }
    // Ränder ausblenden
    g.globalCompositeOperation = 'destination-out';
    const rand = 0.06 * w;
    const verlauf = (ax, ay, bx, by, rx, ry, rb, rh) => { const gr = g.createLinearGradient(ax, ay, bx, by); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(rx, ry, rb, rh); };
    verlauf(0, 0, rand, 0, 0, 0, rand, h);
    verlauf(w, 0, w - rand, 0, w - rand, 0, rand, h);
    verlauf(0, 0, 0, rand, 0, 0, w, rand);
    verlauf(0, h, 0, h - rand, 0, h - rand, w, rand);
    // Abdrücke aussparen: Ferse, Ballen, vier lange Zehen (Gras sichtbar)
    const fuss = (p) => {
      const [cx, cy] = zuPx(p.x, p.z);
      g.save();
      g.translate(cx, cy);
      // Leinwand-x = Welt-x, Leinwand-y = Welt-z: derselbe Winkel wie in der xz-Ebene
      g.rotate(p.winkel);
      const s = proM;
      const ell = (x, y, rx, ry) => { g.beginPath(); g.ellipse(x * s, y * s, rx * s, ry * s, 0, 0, Math.PI * 2); g.fill(); };
      // Fuß zeigt in +x (Zehen vorn): runde Ferse, schlanke Sohle, breiter Ballen, vier lange Zehen
      ell(-0.33, 0, 0.12, 0.1);         // Ferse
      ell(-0.1, 0.01 * p.seite, 0.2, 0.085);   // Mittelfuß
      ell(0.14, 0, 0.12, 0.125);        // Ballen
      for (let i = 0; i < 4; i++) {
        const y = (i - 1.5) * 0.062;
        const l = [0.17, 0.2, 0.19, 0.15][p.seite > 0 ? i : 3 - i];
        g.save(); g.translate(0.24 * s, y * s); g.rotate((i - 1.5) * 0.09);
        ell(l / 2 + 0.02, 0, l / 2, 0.024);
        g.restore();
      }
      g.restore();
    };
    // erst ein heller Rand (zusammengeschobener Reif), dann die Aussparung
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgba(250,252,255,0.9)';
    for (const p of liste) { g.save(); const [cx, cy] = zuPx(p.x, p.z); g.translate(cx, cy); g.scale(1.06, 1.12); g.translate(-cx, -cy); fuss(p); g.restore(); }
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = 'rgba(0,0,0,1)';
    for (const p of liste) fuss(p);
    g.globalCompositeOperation = 'source-over';
  }, PX, PX);
  tex.anisotropy = 8;
  const mat = new T.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const reif = new T.Mesh(new T.PlaneGeometry(breite, tiefe), mat);
  // flach legen: Fläche zeigt nach oben. Nach der Drehung um −90° um x liegt die oberste
  // Leinwand-Zeile (v = 1) bei Welt-z = Z0, die Zeilen wachsen mit Welt-z (passt zu zuPx)
  reif.rotation.x = -Math.PI / 2;
  reif.position.set((X0 + X1) / 2, 0.014, (Z0 + Z1) / 2);
  reif.receiveShadow = true;
  reif.renderOrder = 1;
  gruppe.add(reif);
  // Reif an den Büschen und auf dem Zaun deutet der Nebel an; keine weiteren Objekte (Kosten)

  const anker = {
    spur_fenster: [liste[0].x, 0, liste[0].z],
    spur_ecke: [-12.6, 0, 5.9],
    spur_garten: [-8.0, 0, 2.6],
    june_fenster: [-18.6, 2.2, 5.05],
  };
  liste.forEach((p, i) => { anker[`abdruck_${i}`] = [p.x, 0, p.z]; });
  return {
    gruppe,
    anker,
    kamerapunkte: {
      draufsicht: { pos: [-13.6, 5.2, 7.6], ziel: [-13.4, 0, 5.9], fov: 46 },
      entlang: { pos: [-8.4, 1.1, 7.6], ziel: [-15.5, 0.4, 5.9], fov: 50 },
      fenster: { pos: [-15.2, 1.4, 8.4], ziel: [-18.6, 1.4, 5.2], fov: 50 },
    },
  };
}
