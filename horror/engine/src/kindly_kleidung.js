// Winterkleidung für die Figuren von „Rules of Kindly“ (Folge 1 am See, später F3, F7): Karostoff,
// Fellrand an der Kapuze, Mütze mit Ohrenklappen, Mantel- und Parkaschöße, Schal.
// Alles im Hausstil (src/klotzfigur.js): Klötze mit runden Kanten, Muster als Textur, keine fremden Assets.
// Die Funktionen bekommen das "teile"-Objekt aus baueKlotzfigur(o.schmuck): { ctx, gelenke, masse, mat, rundeKiste }.
import * as THREE from 'three';

// Fester Zufall für Texturen (nie Math.random, Regel 1 der Modul-Autoren)
function quelle(name) {
  let s = [...name].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

const cache = new WeakMap();
function merke(ctx, k, bauen) {
  let m = cache.get(ctx);
  if (!m) { m = new Map(); cache.set(ctx, m); }
  if (!m.has(k)) m.set(k, bauen());
  return m.get(k);
}

// Holzfäller-Karo (Buffalo Check): rote Fläche, schwarze Streifen längs und quer, an den Kreuzungen fast
// schwarz; dazu feine Wollkörnung. kacheln = Karos je Meter (Std 5,5: ein Karo ≈ 18 cm, in der Halbtotalen
// lesbar). Für jede Fläche mit eigener Größe eine eigene Kopie (gleiche Karogröße auf Rumpf und Ärmeln).
export function karoTextur(ctx, rot = '#9E2B25', schwarz = '#1E1F22', breiteM = 0.5, hoeheM = 0.5, kacheln = 5.5) {
  const basis = merke(ctx, `karo|${rot}|${schwarz}`, () => {
    const z = quelle('karo');
    const t = ctx.zeichenTextur((g, w, h) => {
      g.fillStyle = rot; g.fillRect(0, 0, w, h);
      g.fillStyle = schwarz;
      g.globalAlpha = 0.78; g.fillRect(0, 0, w / 2, h);
      g.fillRect(0, 0, w, h / 2);
      g.globalAlpha = 1; g.fillRect(0, 0, w / 2, h / 2);
      // Wollkörnung und Fadenlinien
      for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(${z() < 0.5 ? '0,0,0' : '255,220,200'},${0.03 + z() * 0.06})`; g.fillRect(z() * w, z() * h, 1 + z() * 2, 1); }
      g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 1;
      for (let x = 0; x < w; x += 4) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, h); g.stroke(); }
    }, 64, 64);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  });
  const t = basis.clone();
  t.repeat.set(breiteM * kacheln, hoeheM * kacheln);
  t.needsUpdate = true;
  return t;
}

// Kunstfell (Kapuzenrand, Mützenfutter): helle Grundfarbe mit kurzen dunklen und hellen Härchen
export function fellTextur(ctx, farbe = '#CDBFA6') {
  return merke(ctx, `fell|${farbe}`, () => {
    const z = quelle('fell' + farbe);
    const t = ctx.zeichenTextur((g, w, h) => {
      g.fillStyle = farbe; g.fillRect(0, 0, w, h);
      g.lineCap = 'round';
      for (let i = 0; i < 900; i++) {
        const x = z() * w, y = z() * h, l = 2 + z() * 5, a = -Math.PI / 2 + (z() - 0.5) * 1.4;
        g.strokeStyle = z() < 0.5 ? `rgba(60,45,30,${0.12 + z() * 0.18})` : `rgba(255,250,240,${0.15 + z() * 0.2})`;
        g.lineWidth = 1 + z();
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
      }
    }, 64, 64);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  });
}

// Kapuze im Nacken mit Fellrand (Bear: Petrol-Parka). Der Rand ist ein Kranz aus kleinen, unregelmäßigen
// Fellklötzen rund um die Kapuzenöffnung; er liest sich in der Halbtotalen als heller Kragen.
export function kapuzeMitFell({ ctx, gelenke, masse: m, mat, rundeKiste }, { farbe, fell = '#CDBFA6' }) {
  const r = gelenke.rumpf;
  const stoff = mat(farbe, { rauheit: 0.85 });
  const fellM = ctx.mat('#ffffff', { rauheit: 1, karte: fellTextur(ctx, fell), kante: { farbe: '#fff4e0', staerke: 0.35, exponent: 2 } });
  const kapuze = rundeKiste(m.rumpfOben * 0.82, 0.2, 0.2, stoff, 0.07);
  kapuze.position.set(0, m.rumpfH + 0.03, -m.rumpfT / 2 - 0.04);
  kapuze.rotation.x = 0.3;
  r.add(kapuze);
  const z = quelle('kapuzenfell');
  // Kranz: hinten über die Kapuze, seitlich am Hals vorbei nach vorn bis zum Kragen; dicke Büschel,
  // damit der Rand von vorn und von hinten in der Halbtotalen als heller Kragen zu sehen ist
  for (let i = 0; i <= 14; i++) {
    const w = Math.PI * (i / 14);                         // 0 = links vorn, π = rechts vorn, π/2 = hinten
    const x = Math.cos(w) * (m.rumpfOben * 0.4);
    const y = m.rumpfH + 0.07 + Math.sin(w) * 0.1;
    const zz = -Math.sin(w) * (m.rumpfT * 0.55 + 0.08) + 0.06 * (1 - Math.sin(w));
    const b = 0.13 + z() * 0.06;
    const f = rundeKiste(b, 0.11 + z() * 0.05, b, fellM, 0.05, false);
    f.position.set(x, y, zz);
    f.rotation.set((z() - 0.5) * 0.5, z() * 3, (z() - 0.5) * 0.5);
    r.add(f);
  }
  return kapuze;
}

// Mütze mit Ohrenklappen (Gus): Kappe aus dickem Stoff, vorn ein hochgeklappter Schirm mit Fell, an den
// Seiten Ohrenklappen bis unter das Ohr (Erkennungsmerkmal in der Halbtotalen), oben ein Knopf.
export function ohrenklappenMuetze({ ctx, gelenke, masse: m, mat, rundeKiste }, { farbe = '#4B3A2A', fell = '#D8CBB3' } = {}) {
  const k = gelenke.kopf;
  const stoff = mat(farbe, { rauheit: 0.9, kante: { farbe: '#e8d8c0', staerke: 0.3, exponent: 2.4 } });
  const fellM = ctx.mat('#ffffff', { rauheit: 1, karte: fellTextur(ctx, fell), kante: { farbe: '#fff4e0', staerke: 0.3, exponent: 2 } });
  const kappe = rundeKiste(m.kopfB + 0.06, 0.2, m.kopfT + 0.06, stoff, 0.08);
  kappe.position.set(0, m.kopfH + 0.02, 0);
  k.add(kappe);
  const rand = rundeKiste(m.kopfB + 0.08, 0.07, m.kopfT + 0.08, fellM, 0.03);
  rand.position.set(0, m.kopfH - 0.08, 0);
  k.add(rand);
  const schirm = rundeKiste(m.kopfB * 0.8, 0.12, 0.06, fellM, 0.03);
  schirm.position.set(0, m.kopfH - 0.02, m.kopfT / 2 + 0.05);
  schirm.rotation.x = -0.35;
  k.add(schirm);
  for (const sx of [-1, 1]) {
    const klappe = rundeKiste(0.07, 0.3, 0.24, stoff, 0.04);
    klappe.position.set(sx * (m.kopfB / 2 + 0.035), m.kopfH * 0.52, -0.02);
    k.add(klappe);
    const futter = rundeKiste(0.03, 0.26, 0.2, fellM, 0.012, false);
    futter.position.set(sx * (m.kopfB / 2 + 0.005), m.kopfH * 0.53, -0.02);
    k.add(futter);
    // Bändel unter der Klappe
    const band = rundeKiste(0.02, 0.1, 0.02, stoff, 0.006, false);
    band.position.set(sx * (m.kopfB / 2 + 0.035), m.kopfH * 0.22, 0.02);
    k.add(band);
  }
  const knopf = rundeKiste(0.07, 0.04, 0.07, stoff, 0.02);
  knopf.position.set(0, m.kopfH + 0.13, 0);
  k.add(knopf);
}

// Schöße eines Mantels oder Parkas auf den Oberschenkeln (gehen mit den Beinen mit) und ein Gürtelstück
// über dem Becken. laenge: Anteil des Oberschenkels (Parka 0,55, Mantel 1,1).
export function schoesse({ gelenke, masse: m, rundeKiste }, material, { laenge = 0.6, dicke = 1 } = {}) {
  const hoehe = m.oberschenkel * laenge + 0.08;
  for (const [bein, sx] of [[gelenke.beinL, 1], [gelenke.beinR, -1]]) {
    const schoss = rundeKiste(m.beinD + 0.11 * dicke, hoehe, m.rumpfT * 0.98, material, 0.035);
    schoss.position.set(sx * 0.03, -hoehe / 2 + 0.04, 0);
    bein.add(schoss);
  }
  const ueber = rundeKiste(m.beckenB + 0.09 * dicke, m.beckenH + 0.05, m.rumpfT * 1.0, material, 0.035);
  ueber.position.y = m.beckenH / 2 - 0.05;
  gelenke.huefte.add(ueber);
}

// Schal: Ring um den Hals plus ein herabhängendes Ende vorn
export function schal({ gelenke, masse: m, mat, rundeKiste }, farbe) {
  const s = mat(farbe, { rauheit: 0.95 });
  const ring = rundeKiste(m.rumpfOben * 0.62, 0.11, m.rumpfT * 0.95, s, 0.05);
  ring.position.set(0, m.rumpfH + 0.02, 0);
  gelenke.rumpf.add(ring);
  const ende = rundeKiste(0.12, 0.28, 0.05, s, 0.02);
  ende.position.set(m.rumpfOben * 0.16, m.rumpfH - 0.16, m.rumpfT / 2 + 0.03);
  ende.rotation.z = 0.06;
  gelenke.rumpf.add(ende);
}
