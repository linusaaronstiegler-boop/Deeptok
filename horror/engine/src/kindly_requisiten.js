// Bauteile für Odells Requisiten in „Rules of Kindly“ (Bibel §3.3, §4, §10.7): runde Brille (getragen weiß
// spiegelnd, in der Hand klar und beschlagbar), Handglocke, Sturmlaterne. Gebraucht von figuren/odell.js
// (in der Hand) und von den eigenständigen Requisiten brille_hand, handglocke, laterne (für Inserts).
// Alles aus Grundformen und Canvas-Texturen, keine fremden Assets.
import * as THREE from 'three';

// Maße der Brille wie im Modul odell (Ringradius 0,058 m, Rohr 0,009 m, Abstand der Gläser 0,145 m)
export const BRILLE = { r: 0.058, rohr: 0.009, abstand: 0.1444, glas: 0.051 };

const cache = new WeakMap();
function merke(ctx, k, bauen) {
  let m = cache.get(ctx);
  if (!m) { m = new Map(); cache.set(ctx, m); }
  if (!m.has(k)) m.set(k, bauen());
  return m.get(k);
}

// Getragene Gläser: immer weiß spiegelnd (Bibel §3.3, gilt für alle Kindly-Folgen bis F8). Weiß mit sanftem
// Verlauf von oben (heller) nach unten und einem schrägen Glanzstreifen; leicht selbstleuchtend, damit sie bei
// Nacht und in der Hütte als zwei weiße Kreise lesbar bleiben, aber unter der Bloom-Schwelle (kein Glühen).
export function glasWeissMat(ctx) {
  return merke(ctx, 'glas:weiss', () => {
    const tex = ctx.zeichenTextur((g, w, h) => {
      const v = g.createLinearGradient(0, 0, 0, h);
      v.addColorStop(0, '#ffffff'); v.addColorStop(0.55, '#eef3f8'); v.addColorStop(1, '#c9d3dd');
      g.fillStyle = v; g.fillRect(0, 0, w, h);
      // schräger Glanzstreifen (Spiegelung)
      g.save(); g.translate(w * 0.5, h * 0.5); g.rotate(-0.7);
      const s = g.createLinearGradient(-w * 0.2, 0, w * 0.2, 0);
      s.addColorStop(0, 'rgba(255,255,255,0)'); s.addColorStop(0.5, 'rgba(255,255,255,1)'); s.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = s; g.fillRect(-w * 0.12, -h, w * 0.16, h * 2);
      g.restore();
    }, 64, 64);
    const m = new THREE.MeshStandardMaterial({ color: '#f4f7fa', map: tex, roughness: 0.25, metalness: 0, emissive: new THREE.Color('#e8eef5'), emissiveMap: tex, emissiveIntensity: 0.62 });
    return m;
  });
}

// Brille aus zwei Ringen, Steg und Bügeln. opt.buegel: 'offen' (getragen/hochgehalten) | 'zu' (gefaltet);
// opt.glas: 'weiss' (getragen) | 'klar' (in der Hand: durchsichtig, kann beschlagen) | null (nur Ringe).
// Ursprung: Mitte zwischen den Gläsern, Gläser schauen nach +z. Rückgabe { gruppe, setzeBeschlag(0..1), setzeGlanz(0..1) }.
export function baueBrille(ctx, opt = {}) {
  const g = new THREE.Group();
  g.name = 'brille';
  const fassung = ctx.mat('#2A2A2A', { rauheit: 0.4, metall: 0.3 });
  const ring = new THREE.TorusGeometry(BRILLE.r, BRILLE.rohr, 6, 24);
  const glaeser = [];
  // Beschlag: milchig-weiße Schicht, die Deckkraft trägt den Zustand (0 klar … 1 ganz beschlagen).
  // Eigene Materialien je Brille (eigenes: true), weil Aktionen sie ändern.
  let beschlagMat = null, glanzMat = null;
  if (opt.glas === 'klar') {
    const nebel = merke(ctx, 'tex:beschlag', () => ctx.zeichenTextur((c, w, h) => {
      const r = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.75, 'rgba(255,255,255,0.92)'); r.addColorStop(1, 'rgba(255,255,255,0.55)');
      c.fillStyle = r; c.fillRect(0, 0, w, h);
      // feine Tröpfchen-Körnung
      let s = 4711; const z = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
      for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(200,210,220,${0.2 + z() * 0.3})`; c.fillRect(z() * w, z() * h, 1.5, 1.5); }
    }, 64, 64));
    beschlagMat = new THREE.MeshStandardMaterial({ color: '#f2f5f8', map: nebel, alphaMap: nebel, transparent: true, opacity: 0, roughness: 0.9, emissive: new THREE.Color('#e6ecf2'), emissiveIntensity: 0.85, depthWrite: false });
    // klares Glas: nur ein schwacher Spiegel-Glanz, damit man sieht, dass Glas da ist
    const glanz = merke(ctx, 'tex:glanz', () => ctx.zeichenTextur((c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.save(); c.translate(w * 0.5, h * 0.5); c.rotate(-0.7);
      const s = c.createLinearGradient(-w * 0.25, 0, w * 0.25, 0);
      s.addColorStop(0, 'rgba(255,255,255,0)'); s.addColorStop(0.5, 'rgba(255,255,255,1)'); s.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = s; c.fillRect(-w * 0.1, -h, w * 0.12, h * 2);
      c.fillRect(w * 0.08, -h, w * 0.05, h * 2);
      c.restore();
    }, 64, 64));
    glanzMat = new THREE.MeshBasicMaterial({ color: '#ffffff', map: glanz, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending });
  }
  for (const sx of [-1, 1]) {
    const x = sx * BRILLE.abstand / 2;
    const r = new THREE.Mesh(ring, fassung);
    r.position.set(x, 0, 0);
    r.castShadow = true;
    g.add(r);
    if (opt.glas === 'weiss') {
      const scheibe = new THREE.Mesh(new THREE.CircleGeometry(BRILLE.glas, 24), glasWeissMat(ctx));
      scheibe.position.set(x, 0, 0.002);
      g.add(scheibe);
      glaeser.push(scheibe);
    } else if (opt.glas === 'klar') {
      const b = new THREE.Mesh(new THREE.CircleGeometry(BRILLE.glas, 24), beschlagMat);
      b.position.set(x, 0, 0.001);
      b.renderOrder = 3;
      g.add(b);
      const gl = new THREE.Mesh(new THREE.CircleGeometry(BRILLE.glas, 24), glanzMat);
      gl.position.set(x, 0, 0.0025);
      gl.renderOrder = 4;
      g.add(gl);
      // Rückseite (wer von hinten auf die Gläser schaut, sieht denselben Beschlag)
      const b2 = b.clone(); b2.rotation.y = Math.PI; b2.position.z = -0.001; g.add(b2);
      glaeser.push(b, b2);
    }
  }
  const steg = new THREE.Mesh(new THREE.BoxGeometry(BRILLE.abstand - 2 * BRILLE.r, 0.012, 0.012), fassung);
  steg.position.y = 0.006;
  g.add(steg);
  for (const sx of [-1, 1]) {
    const buegel = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.24), fassung);
    if (opt.buegel === 'zu') {
      buegel.rotation.y = Math.PI / 2;
      buegel.position.set(sx * 0.02, -0.01, -0.012);
    } else {
      buegel.position.set(sx * (BRILLE.abstand / 2 + BRILLE.r), 0.004, -0.12);
    }
    g.add(buegel);
  }
  return {
    gruppe: g,
    setzeBeschlag(x) { if (beschlagMat) beschlagMat.opacity = Math.min(0.97, Math.max(0, x)); },
    setzeGlanz(x) { if (glanzMat) glanzMat.opacity = Math.max(0, x); },
  };
}

// Handglocke (Odells Erkennungslaut, F1: S5): Holzgriff oben, Messingglocke darunter, Klöppel innen.
// Ursprung = Mitte des Griffs (dort liegt die Faust), Glocke hängt nach −y. Rückgabe { gruppe, pendel }
// (pendel: Object3D am Griff-Ende; rotation.z/x = Ausschlag der Glocke, rotation.x des Klöppels separat).
export function baueGlocke(ctx) {
  const g = new THREE.Group();
  g.name = 'handglocke';
  const holz = ctx.mat('#5a3a22', { rauheit: 0.6, kante: { farbe: '#ffe0b8', staerke: 0.25 } });
  const messing = ctx.mat('#c9a24a', { rauheit: 0.32, metall: 0.75, kante: { farbe: '#fff0c0', staerke: 0.5, exponent: 2.2 } });
  const griff = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.11, 10), holz);
  griff.castShadow = true;
  g.add(griff);
  const knauf = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), holz);
  knauf.position.y = 0.06;
  g.add(knauf);
  // Die Glocke selbst ist fest am Griff; geschwungen wird die ganze Glocke um den Griff (in der Faust)
  const pendel = new THREE.Group();
  pendel.position.y = -0.05;
  g.add(pendel);
  const profil = [[0.004, 0], [0.026, -0.006], [0.034, -0.03], [0.04, -0.07], [0.052, -0.095], [0.056, -0.1], [0.05, -0.1]].map(([x, y]) => new THREE.Vector2(x, y));
  const glocke = new THREE.Mesh(new THREE.LatheGeometry(profil, 24), messing);
  glocke.castShadow = true;
  pendel.add(glocke);
  // Innenseite als dunkle Scheibe tief in der Glocke (bei −0,098 lag sie am Rand und las sich mit dem Klöppel
  // als zwei „Augen“), Klöppel klein und nur knapp über dem Rand
  const innen = new THREE.Mesh(new THREE.CircleGeometry(0.036, 20), ctx.mat('#4a3a20', { rauheit: 0.8 }));
  innen.rotation.x = Math.PI / 2; innen.position.y = -0.04;
  pendel.add(innen);
  const kloeppel = new THREE.Group();
  kloeppel.position.y = -0.01;
  pendel.add(kloeppel);
  const kugel = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), ctx.mat('#8a7a50', { metall: 0.6, rauheit: 0.4 }));
  kugel.position.y = -0.088;
  kloeppel.add(kugel);
  const anker = new THREE.Object3D(); anker.position.y = -0.06; pendel.add(anker);
  return { gruppe: g, pendel, kloeppel, anker };
}

// Ausschlag der Glocke nach einem Schlag: kurzer Ruck, dann gedämpftes Pendeln (ein Schlag, kleines Pendeln).
// u = Sekunden seit dem Schlag. Rückgabe: Winkel in rad (Glocke), Klöppel schwingt gegenläufig nach.
export function glockenPendel(u) {
  if (u <= 0) return { glocke: 0, kloeppel: 0 };
  const glocke = 0.42 * Math.exp(-u * 2.6) * Math.sin(u * 2 * Math.PI * 2.2);
  const kloeppel = -0.55 * Math.exp(-u * 2.0) * Math.sin(u * 2 * Math.PI * 2.2 + 0.6);
  return { glocke, kloeppel };
}

// Sturmlaterne (Odell am Stegende, S5): Bodenwanne, Glaszylinder mit Flamme, Drahtkorb, Kappe, Bügel.
// Ursprung = oberes Ende des Bügels (dort greift die Hand), Laterne hängt nach −y (etwa 0,34 m).
// opt.an (Std true), opt.staerke (Std 2.4: Leuchten des Glases, > 1 blüht), opt.schein (Std true: weicher
// Lichtschein als additive Scheibe; kein echtes Punktlicht, die Zahl der Lichter bleibt fest).
// Rückgabe { gruppe, setzeLicht(faktor), anker: { glas, griff } }.
export function baueLaterne(ctx, opt = {}) {
  const g = new THREE.Group();
  g.name = 'laterne';
  const blech = ctx.mat('#3d4a44', { rauheit: 0.5, metall: 0.5, kante: { farbe: '#ffe2b0', staerke: 0.3 } });
  const draht = ctx.mat('#2b302e', { rauheit: 0.5, metall: 0.5 });
  const staerke = opt.staerke ?? 2.4;
  const an = opt.an !== false;
  const korpus = new THREE.Group();
  korpus.position.y = -0.11;
  g.add(korpus);
  // Bügel: Halbring über der Kappe
  const buegel = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.005, 6, 20, Math.PI), draht);
  buegel.position.y = 0.035;
  korpus.add(buegel);
  const kappe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.075, 0.05, 16), blech);
  kappe.position.y = -0.0;
  kappe.castShadow = true;
  korpus.add(kappe);
  const glasMat = new THREE.MeshStandardMaterial({ color: '#2a1c0c', emissive: new THREE.Color('#ffc46e'), emissiveIntensity: an ? staerke : 0, roughness: 0.2, transparent: true, opacity: 0.9 });
  const glas = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.058, 0.13, 18), glasMat);
  glas.position.y = -0.095;
  glas.userData.einzeln = true;
  korpus.add(glas);
  const flammeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff2c0').multiplyScalar(an ? 3.2 : 0) });
  const flamme = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.045, 8), flammeMat);
  flamme.position.y = -0.1;
  korpus.add(flamme);
  for (let i = 0; i < 4; i++) {
    const w = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const stab = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.14, 4), draht);
    stab.position.set(Math.cos(w) * 0.064, -0.095, Math.sin(w) * 0.064);
    korpus.add(stab);
  }
  const wanne = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.05, 16), blech);
  wanne.position.y = -0.185;
  wanne.castShadow = true;
  korpus.add(wanne);
  // weicher Lichtschein (additive Kamera-Scheibe, nimmt mit dem Licht ab)
  let schein = null;
  if (opt.schein !== false) {
    const tex = merke(ctx, 'tex:laternenschein', () => ctx.zeichenTextur((c, w, h) => {
      const r = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      r.addColorStop(0, 'rgba(255,220,160,0.9)'); r.addColorStop(0.25, 'rgba(255,190,120,0.35)'); r.addColorStop(1, 'rgba(255,170,90,0)');
      c.fillStyle = r; c.fillRect(0, 0, w, h);
    }, 64, 64));
    schein = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: '#ffffff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: an ? 0.55 : 0 }));
    schein.scale.set(0.75, 0.75, 1);
    schein.position.y = -0.095;
    korpus.add(schein);
  }
  const glasAnker = new THREE.Object3D(); glasAnker.position.y = -0.095; korpus.add(glasAnker);
  const griff = new THREE.Object3D(); g.add(griff);
  return {
    gruppe: g,
    korpus,
    anker: { glas: glasAnker, griff },
    setzeLicht(f) {
      glasMat.emissiveIntensity = staerke * f;
      flammeMat.color.set('#fff2c0').multiplyScalar(3.2 * f);
      if (schein) schein.material.opacity = 0.55 * f;
    },
  };
}


// ---------- Schrift: Odells Feder (Stadtbuch, Rule-Zero-Wörter) und die Schildschrift ----------
// Odells Handschrift: Großbuchstaben in EB Garamond (Systemschrift, SIL OFL; in der Cloud-Umgebung
// installiert, sonst fällt der Browser auf eine Serifenschrift zurück), Buchstabe für Buchstabe leicht
// gedreht und versetzt, Tinte mit wechselnder Deckkraft: wirkt wie mit der Feder geschrieben.
// Schildschrift: Archivo Black aus engine/assets/schriften (wie die Untertitel).
export async function ladeSchriften(ctx) {
  return merke(ctx, 'schriften', async () => {
    try {
      const archivo = new FontFace('Archivo Black', `url(${ctx.engineUrl}assets/schriften/ArchivoBlack-Regular.ttf)`);
      await archivo.load();
      document.fonts.add(archivo);
    } catch (e) { /* Schrift fehlt: Fallback sans-serif */ }
    try { await document.fonts.load('80px "EB Garamond"'); } catch (e) { /* Fallback serif */ }
    return true;
  });
}
export const FEDER = '"EB Garamond", "DejaVu Serif", serif';
export const SCHILD = '"Archivo Black", "DejaVu Sans", sans-serif';

// Text mit der Feder: x, y = linke Grundlinie; groesse = Versalhöhe in px (die Schrift wird so skaliert,
// dass ein „H“ diese Höhe hat). Rückgabe: Breite in px. seed: fester Zufall je Zeile.
export function federText(g, text, x, y, groesse, { farbe = '#1E1C1A', seed = 1, sperren = 0.06, fett = false } = {}) {
  let s = seed * 9301 + 49297;
  const z = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const px = groesse / 0.66;            // EB Garamond: Versalhöhe ≈ 0,66 em
  g.font = `${fett ? '600 ' : ''}${px}px ${FEDER}`;
  g.textBaseline = 'alphabetic';
  let cx = x;
  for (const ch of text) {
    const w = g.measureText(ch).width;
    if (ch !== ' ') {
      g.save();
      g.translate(cx + w / 2, y + (z() - 0.5) * groesse * 0.05);
      g.rotate((z() - 0.5) * 0.06);
      g.globalAlpha = 0.82 + z() * 0.18;
      g.fillStyle = farbe;
      g.fillText(ch, -w / 2, 0);
      // zweiter, leicht versetzter Zug: die Feder setzt etwas Tinte nach (dickere Striche)
      g.globalAlpha *= 0.35;
      g.fillText(ch, -w / 2 + groesse * 0.012, groesse * 0.006);
      g.restore();
    }
    cx += w + groesse * sperren;
  }
  return cx - x;
}

// Federstrich (Streichung): gerade, leicht ansteigend, an den Enden dünner
export function federStrich(g, x0, y0, x1, y1, dicke, farbe = '#1E1C1A') {
  g.save();
  g.strokeStyle = farbe; g.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    g.globalAlpha = i === 1 ? 0.95 : 0.45;
    g.lineWidth = dicke * (i === 1 ? 1 : 0.6);
    g.beginPath(); g.moveTo(x0 + i * 2, y0 + (i - 1) * dicke * 0.15); g.lineTo(x1, y1 + (i - 1) * dicke * 0.2); g.stroke();
  }
  g.restore();
}
