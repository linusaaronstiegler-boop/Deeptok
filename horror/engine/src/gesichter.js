// Gesichter im Hausstil: flache Aufkleber, die als Textur getauscht werden (Tausch in 1 Bild).
// Hausstil laut episoden/folge-01/serie.md: Augen als stehende Ovale mit Lichtpunkt, Brauen als
// dünne Balken, Mund als einfache Form, keine Nase. Kein gelber Kopf, kein bekanntes Spiel-Lächeln.
//
// Ein Ausdruck ist eine Beschreibung aus drei Teilen: augen, brauen, mund (dazu optional blick).
// Namen dürfen zusammengesetzt werden: "laecheln/reden_b" = Ausdruck "laecheln" mit der
// Mundform "reden_b" (für wörtliche Rede: Mundformen wechseln alle 0,1–0,3 s, Spec 1.4).
// Jeder Ausdruck gibt es auch mit geschlossenen Augen (Blinzeln wählt diese Fassung).

export const AUSDRUECKE = {
  // Pflichtsatz jeder Figur (Aufgabe): neutral, Angst, Schock mit offenem Mund, Lächeln, ernst, Augen zu, Blinzeln
  neutral: { augen: 'offen', brauen: 'ruhig', mund: 'linie' },
  angst: { augen: 'weit', brauen: 'sorge_hoch', mund: 'klein_offen' },
  schock: { augen: 'weit', brauen: 'hoch', mund: 'o' },
  laecheln: { augen: 'offen', brauen: 'ruhig', mund: 'laecheln' },
  ernst: { augen: 'offen', brauen: 'tief', mund: 'linie' },
  augen_zu: { augen: 'zu', brauen: 'ruhig', mund: 'linie' },
  blinzeln: { augen: 'halb', brauen: 'ruhig', mund: 'linie' },
  // Weitere Ausdrücke aus serie.md (je Figur werden nur einige gebraucht)
  besorgt: { augen: 'offen', brauen: 'sorge', mund: 'welle' },
  schrei: { augen: 'weit', brauen: 'sorge_hoch', mund: 'schrei' },
  grinsen: { augen: 'offen', brauen: 'schief', mund: 'grinsen' },
  entschlossen: { augen: 'schmal', brauen: 'boese', mund: 'fest' },
  verschlafen: { augen: 'halb', brauen: 'muede', mund: 'klein' },
  muede: { augen: 'halb', brauen: 'muede', mund: 'linie' },
  streng: { augen: 'schmal', brauen: 'tief', mund: 'fest' },
  warnend: { augen: 'offen', brauen: 'boese', mund: 'warn' },
  nervoes: { augen: 'offen', brauen: 'sorge', mund: 'zickzack', blick: [0.3, 0] },
  blick_gesenkt: { augen: 'unten', brauen: 'sorge', mund: 'linie' },
  leer: { augen: 'leer', brauen: 'keine', mund: 'linie' },
  zu_breit: { augen: 'leer', brauen: 'keine', mund: 'zu_breit' },
  // Teil 3 (Review): Junes gedehntes Gesicht auf dem Monster. Ihre Brauen (ruhig), aber leere Augen ohne
  // Lichtpunkt und ein Grinsen, das zu breit ist und Zähne zeigt – unheimlich statt freundlich.
  gedehnt: { augen: 'leer', brauen: 'ruhig', mund: 'riss' },
  gedehnt_bricht: { augen: 'leer', brauen: 'sorge', mund: 'riss_bricht' },
  gedehnt_muede: { augen: 'halb', brauen: 'muede', mund: 'linie' },
  gedehnt_schlaeft: { augen: 'zu', brauen: 'muede', mund: 'linie' },
  zaehlt_a: { augen: 'zu', brauen: 'ruhig', mund: 'reden_a' },
  zaehlt_b: { augen: 'zu', brauen: 'ruhig', mund: 'reden_b' },
  zaehlt_c: { augen: 'zu', brauen: 'ruhig', mund: 'reden_c' },
  reden_a: { augen: 'offen', brauen: 'ruhig', mund: 'reden_a' },
  reden_b: { augen: 'offen', brauen: 'ruhig', mund: 'reden_b' },
  reden_c: { augen: 'offen', brauen: 'ruhig', mund: 'reden_c' },
};

// Andere Namen aus serie.md und bildideen.json für dieselben Ausdrücke.
export const ALIAS = {
  erschrocken: 'schock',
  froh: 'laecheln',
  warmes_laecheln: 'laecheln',
  trotzig: 'grinsen',
  frech: 'grinsen',
  angespannt: 'besorgt',
  zaehlt: 'zaehlt_a',
  leerer_blick: 'leer',
};

export const PFLICHT = ['neutral', 'angst', 'schock', 'laecheln', 'ernst', 'augen_zu', 'blinzeln'];
const MUENDER = new Set(['linie', 'klein', 'fest', 'welle', 'laecheln', 'grinsen', 'zu_breit', 'riss', 'riss_bricht', 'klein_offen', 'o', 'schrei', 'warn', 'zickzack', 'reden_a', 'reden_b', 'reden_c']);

// "laecheln/reden_b" -> { augen, brauen, mund, blick }. Unbekannte Namen: Fehler mit Liste.
export function ausdruck(name) {
  const [basisRoh, ...extras] = String(name).split('/');
  const basis = ALIAS[basisRoh] ?? basisRoh;
  const a = AUSDRUECKE[basis];
  if (!a) throw new Error(`Gesicht "${name}" unbekannt. Vorhanden: ${[...Object.keys(AUSDRUECKE), ...Object.keys(ALIAS)].join(', ')}`);
  const e = { blick: [0, 0], ...a };
  for (const x of extras) {
    const y = ALIAS[x] ?? x;
    if (AUSDRUECKE[y]) e.mund = AUSDRUECKE[y].mund;
    else if (MUENDER.has(y)) e.mund = y;
    else throw new Error(`Gesicht "${name}": Zusatz "${x}" ist weder Ausdruck noch Mundform (${[...MUENDER].join(', ')})`);
  }
  return e;
}

function hell(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
}

// Gesicht zeichnen. stil: { haut, iris, tinte, brauen, wangen, falten, sommersprossen,
// augenAbstand (Std 0.17), augenHoehe (0.5), mundHoehe (0.75), augenGroesse (1), mundBreite (1) }
// zu = true: dieselbe Miene mit geschlossenen Augen (Blinzeln).
export function zeichneGesicht(g, W, H, name, stil = {}, zu = false) {
  const e = ausdruck(name);
  const s = {
    haut: '#e8c9a8', iris: '#2b1d14', tinte: '#23170f', brauen: null,
    augenAbstand: 0.19, augenHoehe: 0.48, mundHoehe: 0.76, augenGroesse: 1, mundBreite: 1, ...stil,
  };
  const brauenFarbe = s.brauen ?? s.tinte;
  g.fillStyle = s.haut;
  g.fillRect(0, 0, W, H);
  g.lineCap = 'round';
  g.lineJoin = 'round';

  // Augen groß genug, dass die Miene auch am Handy in der Halbtotalen lesbar ist
  const rx = W * 0.066 * s.augenGroesse, ry = H * 0.118 * s.augenGroesse;
  const ey = H * s.augenHoehe;
  const augenArt = zu && !['zu'].includes(e.augen) ? 'zu' : e.augen;
  const [bx, by] = e.blick;

  // Wangen, Falten, Sommersprossen liegen unter den Augen
  if (s.wangen) {
    for (const sx of [-1, 1]) {
      const cx = W * (0.5 + sx * (s.augenAbstand + 0.03)), cy = ey + ry * 1.75;
      const gr = g.createRadialGradient(cx, cy, 0, cx, cy, W * 0.07);
      gr.addColorStop(0, s.wangen + '66');
      gr.addColorStop(1, s.wangen + '00');
      g.fillStyle = gr;
      g.fillRect(cx - W * 0.08, cy - W * 0.08, W * 0.16, W * 0.16);
    }
  }
  if (s.sommersprossen) {
    g.fillStyle = 'rgba(150,80,50,0.35)';
    const punkte = [[-0.19, 0.08], [-0.15, 0.1], [-0.22, 0.11], [0.19, 0.08], [0.15, 0.1], [0.22, 0.11], [-0.17, 0.13], [0.17, 0.13]];
    for (const [px, py] of punkte) { g.beginPath(); g.arc(W * (0.5 + px), ey + H * py, W * 0.006, 0, 2 * Math.PI); g.fill(); }
  }
  if (s.falten) {
    g.strokeStyle = 'rgba(90,55,40,0.32)';
    g.lineWidth = W * 0.007;
    for (const sx of [-1, 1]) {
      const cx = W * (0.5 + sx * s.augenAbstand);
      g.beginPath(); g.moveTo(cx - rx * 1.1, ey + ry * 1.25); g.quadraticCurveTo(cx, ey + ry * 1.55, cx + rx * 1.1, ey + ry * 1.25); g.stroke();
    }
    for (const fy of [0.16, 0.21]) { g.beginPath(); g.moveTo(W * 0.36, H * fy); g.quadraticCurveTo(W * 0.5, H * (fy - 0.015), W * 0.64, H * fy); g.stroke(); }
  }

  // ---------- Augen ----------
  const irisHell = hell(s.iris) > 0.22;
  const auge = (cx, art) => {
    // Blickrichtung verschiebt Iris, Pupille und Lichtpunkt; "unten" schaut nach unten.
    const [bxx, byy] = art === 'unten' ? [bx, 0.6] : [bx, by];
    const ox = bxx * rx * 0.45, oy = byy * ry * 0.4;
    const voll = (sk = 1, mitGlanz = true, farbe = s.iris) => {
      g.fillStyle = farbe;
      g.beginPath(); g.ellipse(cx + ox, ey + oy, rx * sk, ry * sk, 0, 0, 2 * Math.PI); g.fill();
      g.strokeStyle = s.tinte; g.lineWidth = W * 0.008; g.stroke();
      if (irisHell) {
        g.fillStyle = s.tinte;
        g.beginPath(); g.ellipse(cx + ox * 1.3, ey + oy * 1.3, rx * sk * 0.5, ry * sk * 0.52, 0, 0, 2 * Math.PI); g.fill();
      }
      if (mitGlanz) {
        g.fillStyle = '#ffffff';
        g.beginPath(); g.arc(cx + ox + rx * sk * 0.36, ey + oy - ry * sk * 0.42, rx * sk * 0.36, 0, 2 * Math.PI); g.fill();
        g.beginPath(); g.arc(cx + ox - rx * sk * 0.3, ey + oy + ry * sk * 0.42, rx * sk * 0.15, 0, 2 * Math.PI); g.fill();
      }
    };
    const lid = (anteil) => {
      // obere Lidkante bei "anteil" der Augenhöhe: darüber Haut, darunter Auge
      const kante = ey - ry + 2 * ry * anteil;
      g.save();
      g.beginPath(); g.rect(cx - rx * 3, kante, rx * 6, ry * 3); g.clip();
      voll();
      g.restore();
      g.strokeStyle = s.tinte; g.lineWidth = W * 0.014;
      g.beginPath(); g.moveTo(cx - rx * 1.15, kante + ry * 0.05); g.quadraticCurveTo(cx, kante - ry * 0.12, cx + rx * 1.15, kante + ry * 0.05); g.stroke();
    };
    if (art === 'offen') voll();
    else if (art === 'weit') {
      g.fillStyle = '#f6f3ec';
      g.beginPath(); g.ellipse(cx, ey, rx * 1.5, ry * 1.32, 0, 0, 2 * Math.PI); g.fill();
      g.strokeStyle = s.tinte; g.lineWidth = W * 0.009; g.stroke();
      voll(0.62);
    } else if (art === 'schmal') lid(0.38);
    else if (art === 'halb') lid(0.56);
    else if (art === 'unten') lid(0.3);
    else if (art === 'leer') {
      // leerer Blick: kein Lichtpunkt, stumpfe Farbe, winzige Pupille
      g.fillStyle = s.iris;
      g.globalAlpha = 0.75;
      g.beginPath(); g.ellipse(cx, ey, rx * 1.08, ry * 1.08, 0, 0, 2 * Math.PI); g.fill();
      g.globalAlpha = 1;
      g.strokeStyle = s.tinte; g.lineWidth = W * 0.006; g.stroke();
      g.fillStyle = s.tinte; g.beginPath(); g.arc(cx, ey, rx * 0.22, 0, 2 * Math.PI); g.fill();
    } else {
      // geschlossen: nach unten gebogene Lidlinie
      g.strokeStyle = s.tinte; g.lineWidth = W * 0.016;
      g.beginPath(); g.moveTo(cx - rx * 1.15, ey + ry * 0.05); g.quadraticCurveTo(cx, ey + ry * 0.55, cx + rx * 1.15, ey + ry * 0.05); g.stroke();
    }
  };
  for (const sx of [-1, 1]) auge(W * (0.5 + sx * s.augenAbstand), augenArt);

  // ---------- Brauen ----------
  const brauen = {
    ruhig: [0, 0.4], sorge: [-3, 1], sorge_hoch: [-5.5, -1.2], hoch: [-4.2, -3.8],
    tief: [2.4, 2.4], boese: [3.4, -1.2], schief: null, muede: [-1, 2.6], keine: null,
  };
  if (e.brauen !== 'keine') {
    g.strokeStyle = brauenFarbe; g.lineWidth = W * 0.036;
    const basisY = ey - ry - H * 0.06;
    const bw = rx * 2.7;
    for (const sx of [-1, 1]) {
      const cx = W * (0.5 + sx * s.augenAbstand);
      let [di, da] = brauen[e.brauen] ?? [0, 0];
      if (e.brauen === 'schief') [di, da] = sx > 0 ? [-3.6, -4.4] : [0.8, 0.8];
      const innen = cx - sx * bw / 2, aussen = cx + sx * bw / 2;
      const yi = basisY + H * 0.01 * di, ya = basisY + H * 0.01 * da;
      g.beginPath(); g.moveTo(innen, yi); g.quadraticCurveTo(cx, Math.min(yi, ya) - H * 0.012, aussen, ya); g.stroke();
    }
  }

  // ---------- Mund ----------
  const mx = W / 2, my = H * s.mundHoehe, mw = W * 0.12 * s.mundBreite;
  const dunkel = '#3a1a1c', zunge = '#b5545a', zaehne = '#f4f1ea';
  g.strokeStyle = s.tinte; g.fillStyle = dunkel; g.lineWidth = W * 0.026;
  const oval = (rxm, rym, mitZunge, mitZaehnen) => {
    g.save();
    g.fillStyle = dunkel;
    g.beginPath(); g.ellipse(mx, my, rxm, rym, 0, 0, 2 * Math.PI); g.fill();
    g.clip();
    if (mitZunge) { g.fillStyle = zunge; g.beginPath(); g.ellipse(mx, my + rym * 0.85, rxm * 0.7, rym * 0.55, 0, 0, 2 * Math.PI); g.fill(); }
    if (mitZaehnen) { g.fillStyle = zaehne; g.fillRect(mx - rxm, my - rym, rxm * 2, rym * 0.32); }
    g.restore();
  };
  switch (e.mund) {
    case 'linie': g.beginPath(); g.moveTo(mx - mw * 0.8, my); g.lineTo(mx + mw * 0.8, my); g.stroke(); break;
    case 'klein': g.beginPath(); g.moveTo(mx - mw * 0.4, my); g.lineTo(mx + mw * 0.4, my); g.stroke(); break;
    case 'fest': g.lineWidth = W * 0.023; g.beginPath(); g.moveTo(mx - mw * 0.75, my + H * 0.004); g.lineTo(mx + mw * 0.75, my + H * 0.004); g.stroke(); break;
    case 'welle':
      g.beginPath(); g.moveTo(mx - mw * 0.85, my + H * 0.008);
      g.bezierCurveTo(mx - mw * 0.35, my - H * 0.02, mx + mw * 0.3, my + H * 0.025, mx + mw * 0.85, my - H * 0.004); g.stroke(); break;
    case 'laecheln':
      g.beginPath(); g.moveTo(mx - mw, my - H * 0.012); g.quadraticCurveTo(mx, my + H * 0.055, mx + mw, my - H * 0.012); g.stroke(); break;
    case 'grinsen':
      g.beginPath(); g.moveTo(mx - mw * 0.85, my + H * 0.006); g.quadraticCurveTo(mx + mw * 0.25, my + H * 0.035, mx + mw * 1.05, my - H * 0.03); g.stroke(); break;
    case 'zu_breit':
      g.lineWidth = W * 0.012;
      g.beginPath(); g.moveTo(mx - mw * 2.4, my - H * 0.045); g.quadraticCurveTo(mx, my + H * 0.07, mx + mw * 2.4, my - H * 0.045); g.stroke();
      break;
    case 'riss':
    case 'riss_bricht': {
      // Grinsen fast über die ganze Breite: dunkler Spalt mit einer Reihe kleiner Zähne, Mundwinkel hoch
      // gezogen. riss_bricht: die Mundwinkel sacken, eine Seite tiefer (das Lächeln bricht).
      const b = mw * 2.6, hoch = e.mund === 'riss' ? H * 0.075 : H * 0.005, schief = e.mund === 'riss' ? 0 : H * 0.035;
      const pfad = () => {
        g.beginPath();
        g.moveTo(mx - b, my - hoch);
        g.quadraticCurveTo(mx, my + H * 0.13, mx + b, my - hoch + schief);
        g.quadraticCurveTo(mx, my + H * 0.01, mx - b, my - hoch);
        g.closePath();
      };
      g.save(); pfad(); g.fillStyle = dunkel; g.fill(); g.clip();
      g.fillStyle = zaehne;
      for (let i = -11; i <= 11; i++) {
        const x = mx + (i / 11.5) * b;
        g.fillRect(x - W * 0.009, my - H * 0.08, W * 0.017, H * 0.115);
      }
      g.restore();
      g.lineWidth = W * 0.01; g.strokeStyle = s.tinte; pfad(); g.stroke();
      break;
    }
    case 'klein_offen': oval(mw * 0.36, H * 0.026, false, false); break;
    case 'o': oval(mw * 0.46, H * 0.05, true, false); break;
    case 'schrei': oval(mw * 0.85, H * 0.09, true, true); break;
    case 'warn': oval(mw * 0.62, H * 0.028, false, true); break;
    case 'zickzack': {
      g.lineWidth = W * 0.014;
      g.beginPath(); g.moveTo(mx - mw * 0.85, my);
      for (let i = 1; i <= 6; i++) g.lineTo(mx - mw * 0.85 + (i * mw * 1.7) / 6, my + (i % 2 ? -1 : 1) * H * 0.012);
      g.stroke(); break;
    }
    case 'reden_a': oval(mw * 0.45, H * 0.02, false, false); break;
    case 'reden_b': oval(mw * 0.6, H * 0.042, true, true); break;
    case 'reden_c': oval(mw * 0.3, H * 0.032, false, false); break;
    default: break;
  }
}
