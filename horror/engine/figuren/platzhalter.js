// Platzhalter-Figur zum Testen der Engine (wird durch echte Figurenmodule ersetzt).
// Eigene Proportionen (großer, runder Kopf, kurzer Rumpf, schmale Glieder), eigenes Gesicht.
// params: rumpf, hose, haut, haare (Farben), groesse (Skalierung, Std 1)
import { baueRig } from '../src/rig.js';

// Gesicht zeichnen: Augen als hohe, abgerundete Formen mit Glanzpunkt, Brauen, Mund je Ausdruck.
function zeichneGesicht(g, w, h, ausdruck, zu) {
  g.clearRect(0, 0, w, h);
  const ink = '#1b1612';
  g.fillStyle = ink; g.strokeStyle = ink; g.lineCap = 'round';
  const weit = ausdruck === 'erschrocken' || ausdruck === 'schrei';
  const augeH = weit ? 0.22 : 0.16, augeB = weit ? 0.1 : 0.085;
  for (const sx of [-1, 1]) {
    const cx = w * (0.5 + sx * 0.17), cy = h * 0.47;
    if (zu) {
      g.lineWidth = w * 0.03;
      g.beginPath(); g.arc(cx, cy - h * 0.01, w * 0.055, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
    } else {
      if (weit) { g.fillStyle = '#f4f1ea'; g.beginPath(); g.ellipse(cx, cy, w * augeB * 0.95, h * augeH * 0.6, 0, 0, 2 * Math.PI); g.fill(); g.fillStyle = ink; }
      g.beginPath(); g.ellipse(cx, cy, w * augeB / 2, h * augeH / 2, 0, 0, 2 * Math.PI); g.fill();
      g.fillStyle = '#ffffff';
      g.beginPath(); g.arc(cx + w * 0.015, cy - h * 0.035, w * 0.016, 0, 2 * Math.PI); g.fill();
      g.fillStyle = ink;
    }
    // Brauen: besorgt = innen hoch, entschlossen = innen tief, erschrocken = hoch
    g.lineWidth = w * 0.028;
    const innen = cx - sx * w * 0.06, aussen = cx + sx * w * 0.06;
    let yi = h * 0.3, ya = h * 0.3;
    if (ausdruck === 'besorgt') { yi = h * 0.27; ya = h * 0.31; }
    if (ausdruck === 'entschlossen') { yi = h * 0.33; ya = h * 0.28; }
    if (weit) { yi = h * 0.23; ya = h * 0.24; }
    g.beginPath(); g.moveTo(innen, yi); g.lineTo(aussen, ya); g.stroke();
  }
  // Mund
  const mx = w * 0.5, my = h * 0.74;
  g.lineWidth = w * 0.03;
  if (ausdruck === 'neutral' || ausdruck === 'entschlossen') {
    g.beginPath(); g.moveTo(mx - w * 0.07, my); g.lineTo(mx + w * 0.07, my); g.stroke();
  } else if (ausdruck === 'besorgt') {
    g.beginPath(); g.moveTo(mx - w * 0.07, my + h * 0.01);
    g.bezierCurveTo(mx - w * 0.03, my - h * 0.025, mx + w * 0.03, my + h * 0.03, mx + w * 0.07, my - h * 0.005); g.stroke();
  } else if (ausdruck === 'erschrocken') {
    g.beginPath(); g.ellipse(mx, my, w * 0.035, h * 0.045, 0, 0, 2 * Math.PI); g.fill();
  } else if (ausdruck === 'schrei') {
    g.beginPath(); g.ellipse(mx, my + h * 0.02, w * 0.075, h * 0.1, 0, 0, 2 * Math.PI); g.fill();
    g.fillStyle = '#7a2a2a'; g.beginPath(); g.ellipse(mx, my + h * 0.08, w * 0.045, h * 0.03, 0, 0, 2 * Math.PI); g.fill();
  }
}

export const AUSDRUECKE = ['neutral', 'besorgt', 'erschrocken', 'schrei', 'entschlossen'];

export default async function baue(ctx, params = {}) {
  const T = ctx.THREE;
  const haut = ctx.mat(params.haut ?? '#e8c39a', { rauheit: 0.8 });
  const rig = baueRig(ctx, {
    beinLaenge: 0.66, beinBreite: 0.2, beinAbstand: 0.24,
    rumpfBreite: 0.56, rumpfHoehe: 0.58, rumpfTiefe: 0.3,
    armLaenge: 0.6, armBreite: 0.16, schulterAbstand: 0.74,
    kopfBreite: 0.5, kopfHoehe: 0.46, kopfTiefe: 0.46, hals: 0.03,
    rund: 0.035, rundKopf: 0.09,
    mat: { rumpf: ctx.mat(params.rumpf ?? '#c8553d'), arm: ctx.mat(params.rumpf ?? '#c8553d'), bein: ctx.mat(params.hose ?? '#2f3e5c'), kopf: haut, hand: haut },
  });
  // Haare als flache Kappe, damit man die Kopfdrehung gut sieht.
  const haare = ctx.kiste(0.53, 0.12, 0.5, ctx.mat(params.haare ?? '#3a2618'), { rund: 0.05 });
  haare.position.set(0, 0.47, -0.01);
  rig.gelenke.kopf.add(haare);

  // Gesichtssatz: jeder Ausdruck offen und mit geschlossenen Augen (Blinzeln = Tausch in 1 Bild).
  const zeichnungen = {};
  for (const a of AUSDRUECKE) {
    zeichnungen[a] = (g, w, h) => zeichneGesicht(g, w, h, a, false);
    zeichnungen[`${a}_zu`] = (g, w, h) => zeichneGesicht(g, w, h, a, true);
  }
  const satz = ctx.gesichtsSatz(zeichnungen, { groesse: 256 });
  satz.material.transparent = true;
  satz.material.alphaTest = 0.4;
  const gesicht = new T.Mesh(new T.PlaneGeometry(0.42, 0.4), satz.material);
  gesicht.position.set(0, 0.23, 0.231);
  rig.gelenke.kopf.add(gesicht);

  const s = params.groesse ?? 1;
  rig.gruppe.scale.setScalar(s);

  let ausdruck = 'neutral', zu = false;
  const anwenden = () => satz.setze(zu ? `${ausdruck}_zu` : ausdruck);
  return {
    ...rig,
    gesichter: AUSDRUECKE,
    hoehe: 1.73 * s,
    setzeGesicht(name) { ausdruck = name; anwenden(); },
    setzeBlinzeln(z) { zu = z; anwenden(); },
  };
}
