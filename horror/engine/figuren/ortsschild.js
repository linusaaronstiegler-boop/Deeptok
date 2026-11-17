// Requisite „ortsschild“: das Ortsschild von Kindly (Rules of Kindly, Bibel §2, §3.2, §6). Emaillegrüne Tafel
// #2F4A3A mit cremefarbener Schrift #EDE6D3: WELCOME TO / KINDLY / KINDLY MIND THE RULES / POP. und darunter
// zwei Zeilen für die von Hand weiß gemalte Einwohnerzahl über sichtbaren alten Farbschichten.
// Endkarte jeder Folge (1,5 s): Odells Hand mit Pinsel streicht die alte Zahl durch und malt die neue darunter
// (Aktion "umschreiben", F1: 1,204 → 1,203), oder sie hebt den Pinsel und lässt ihn sinken ("pinsel_sinken").
//
// Lage: Ursprung = Boden in der Mitte zwischen den beiden Pfosten; die Schrift zeigt nach +z (im Set stadtrand:
// Anker "rand.ortsschild", blick 180). Tafel 2,4 × 1,7 m, Mitte in 1,75 m Höhe.
// Lesbarkeit (Bibel §3.2): Ziffern 0,32 m hoch. Für ≥ 120 px im fertigen Bild darf das Bild an der Tafel höchstens
// 2,9 m breit sein (Kamera näher als im Kamerapunkt rand.endkarte, z. B. rand.schild oder rand.zahl).
//
// params: zahl (Std "1,204": die Zahl in Zeile 1), neu (Std "1,203": was "umschreiben" in Zeile 2 malt),
//         schichten (alte Zahlen unter der Farbe, Std ["1,207", "1,205", "1,206"]), hand (Std true: Odells Hand mit
//         Pinsel ist da und kommt zur Aktion ins Bild), schnee (Std true: Schnee auf der Oberkante)
// Animationen:
//   umschreiben  Std 1,0 s. Hand kommt von links unten (0–0,38 s; die alte Zahl bleibt frei lesbar), Strich durch
//                Zeile 1 (0,40–0,52 s), neue Zahl in Zeile 2 von links nach rechts (0,55–0,78 s), Hand zieht nach
//                unten weg (0,8–1,0 s). Mit Start auf dem ersten Bild der Endkarte steht die neue Zahl 0,72 s fertig.
//   pinsel_sinken Std 1,2 s. Der Pinsel hebt sich vor Zeile 2, hält, sinkt wieder (keine Änderung, Stille).
// Anker: mitte (Tafel), zahl (Zeile 1), neu (Zeile 2), pinsel (Pinselspitze), pop
import { ladeSchriften, SCHILD } from '../src/kindly_requisiten.js';
import { rundeKiste } from '../src/klotzfigur.js';

const B = 2.4, H = 1.7, MITTE_Y = 1.75, PXM = 800;
const GRUEN = '#2F4A3A', CREME = '#EDE6D3', WEISS = '#F4F1EA';
const ZEILE1 = 1.55, ZEILE2 = 1.12, ZIFFER = 0.32;       // Höhen (Welt, m) und Ziffernhöhe

// Text mit fester Versalhöhe (Archivo Black: Versalhöhe ≈ 0,72 em), zentriert bei cx
function schildText(g, text, cx, grundlinie, versal, farbe, sperren = 0) {
  const px = versal / 0.72;
  g.font = `${px}px ${SCHILD}`;
  g.fillStyle = farbe;
  g.textBaseline = 'alphabetic';
  const zeichen = [...text];
  const breiten = zeichen.map((c) => g.measureText(c).width);
  const gesamt = breiten.reduce((a, b) => a + b, 0) + sperren * (zeichen.length - 1);
  let x = cx - gesamt / 2;
  zeichen.forEach((c, i) => { g.fillText(c, x, grundlinie); x += breiten[i] + sperren; });
  return gesamt;
}

// von Hand gemalte Zahl: weiße Farbe mit Pinselstruktur (helle und dunklere Längsstriche), Ränder leicht unruhig.
// Gezeichnet auf einer eigenen Leinwand (sonst träfen die Pinselstriche auch das Grün um die Ziffern) und dann
// auf die Tafel gelegt.
function gemalteZahl(g, text, cx, grundlinie, versal, { farbe = WEISS, alpha = 1, seed = 1, struktur = true } = {}) {
  let s = seed * 131 + 7; const z = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const bw = Math.ceil(versal * 5.2), bh = Math.ceil(versal * 1.5);
  const c = document.createElement('canvas'); c.width = bw; c.height = bh;
  const h = c.getContext('2d');
  const gx = bw / 2, gy = bh - versal * 0.25;
  for (let i = 0; i < 3; i++) schildText(h, text, gx + (z() - 0.5) * versal * 0.03, gy + (z() - 0.5) * versal * 0.03, versal, farbe, versal * 0.06);
  if (struktur) {
    h.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 260; i++) {
      h.strokeStyle = z() < 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(150,150,140,0.22)';
      h.lineWidth = 1 + z() * 3;
      const x = z() * bw, y = gy - z() * versal;
      h.beginPath(); h.moveTo(x, y); h.lineTo(x + (z() - 0.5) * 6, y - versal * (0.2 + z() * 0.4)); h.stroke();
    }
  }
  g.save(); g.globalAlpha = alpha; g.drawImage(c, cx - gx, grundlinie - gy); g.restore();
}

export default async function baue(ctx, params = {}) {
  const T = ctx.THREE;
  await ladeSchriften(ctx);
  const zahl = params.zahl ?? '1,204';
  const neu = params.neu ?? '1,203';
  const schichten = params.schichten ?? ['1,207', '1,205', '1,206'];
  const gruppe = new T.Group();
  const W = B * PXM, Hp = H * PXM;
  const yPx = (yWelt) => (MITTE_Y + H / 2 - yWelt) * PXM;   // Welt-Höhe → Pixelzeile der Tafel

  // ---------- Tafel (Email): Rand, Schrift, Zeile 1 mit Zahl, Zeile 2 mit alten Schichten ----------
  const tex = ctx.zeichenTextur((g, w, h) => {
    g.fillStyle = GRUEN; g.fillRect(0, 0, w, h);
    // Emaille: leichter Glanzverlauf, ein paar Abplatzer am Rand
    const v = g.createLinearGradient(0, 0, 0, h);
    v.addColorStop(0, 'rgba(255,255,255,0.06)'); v.addColorStop(1, 'rgba(0,0,0,0.12)');
    g.fillStyle = v; g.fillRect(0, 0, w, h);
    let s = 3; const z = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 14; i++) {
      const rand = z() < 0.5;
      const x = rand ? (z() < 0.5 ? 20 + z() * 40 : w - 60 + z() * 40) : z() * w, y = rand ? z() * h : (z() < 0.5 ? 20 + z() * 30 : h - 50 + z() * 30);
      g.fillStyle = 'rgba(30,26,22,0.55)'; g.beginPath(); g.ellipse(x, y, 6 + z() * 14, 4 + z() * 9, z() * 3, 0, Math.PI * 2); g.fill();
    }
    // doppelter cremefarbener Rand mit runden Ecken
    g.strokeStyle = CREME; g.lineWidth = 16;
    const r = 46;
    g.beginPath(); g.roundRect(34, 34, w - 68, h - 68, r); g.stroke();
    g.lineWidth = 5; g.beginPath(); g.roundRect(64, 64, w - 128, h - 128, r - 20); g.stroke();
    // Schrift
    schildText(g, 'WELCOME TO', w / 2, yPx(2.43), 0.09 * PXM, CREME, 0.02 * PXM);
    schildText(g, 'KINDLY', w / 2, yPx(2.11), 0.27 * PXM, CREME, 0.03 * PXM);
    schildText(g, 'KINDLY MIND THE RULES', w / 2, yPx(1.95), 0.075 * PXM, CREME, 0.012 * PXM);
    g.fillStyle = CREME; g.fillRect(w * 0.12, yPx(1.9), w * 0.76, 6);
    schildText(g, 'POP.', w * 0.13, yPx(1.69), 0.08 * PXM, CREME, 0.01 * PXM);
    // alte Farbschichten unter der Zahl: nur in Zeile 1, schwach und leicht versetzt (die Zahl wurde oft
    // übermalt). Zeile 2 ist eine übermalte Fläche in etwas anderem Grün, ohne lesbare Ziffern.
    schichten.forEach((alt, i) => {
      gemalteZahl(g, alt, w / 2 + (i - 1) * 14, yPx(ZEILE1 - ZIFFER / 2) + ((i % 3) - 1) * 10, ZIFFER * PXM * 0.98, { farbe: '#a9b9ae', alpha: 0.075, seed: 20 + i, struktur: false });
    });
    {
      const x0 = w * 0.2, x1 = w * 0.8, y0 = yPx(ZEILE2 + ZIFFER * 0.62), y1 = yPx(ZEILE2 - ZIFFER * 0.62);
      for (let i = 0; i < 40; i++) {
        g.fillStyle = `rgba(${i % 2 ? '58,88,70' : '40,66,52'},0.18)`;
        const yy = y0 + ((y1 - y0) * i) / 40;
        g.fillRect(x0 + (z() - 0.5) * 30, yy, x1 - x0 + (z() - 0.5) * 40, (y1 - y0) / 30);
      }
    }
    // Zeile 1: die aktuelle Zahl
    gemalteZahl(g, zahl, w / 2, yPx(ZEILE1 - ZIFFER / 2), ZIFFER * PXM, { seed: 1 });
  }, W, Hp);
  tex.anisotropy = 8;
  const tafelMat = new T.MeshStandardMaterial({ map: tex, roughness: 0.38, metalness: 0.05 });
  const tafel = new T.Mesh(new T.PlaneGeometry(B, H), tafelMat);
  tafel.position.set(0, MITTE_Y, 0.031);
  tafel.receiveShadow = true;
  tafel.userData.einzeln = true;
  gruppe.add(tafel);
  // Rückseite und Kante: dunkles Blech, Holzpfosten
  const blech = ctx.mat('#26352c', { rauheit: 0.5, metall: 0.3 });
  const platte = ctx.kiste(B + 0.03, H + 0.03, 0.05, blech, { rund: 0.01 });
  platte.position.set(0, MITTE_Y, 0);
  gruppe.add(platte);
  const holz = ctx.mat('#5a4636', { rauheit: 0.9, kante: { farbe: '#ffe0c0', staerke: 0.2 } });
  for (const sx of [-0.85, 0.85]) {
    const p = ctx.kiste(0.12, MITTE_Y + H / 2 + 0.08, 0.12, holz, { rund: 0.015 });
    p.position.set(sx, (MITTE_Y + H / 2 + 0.08) / 2, -0.09);
    gruppe.add(p);
  }
  if (params.schnee !== false) {
    const schnee = ctx.mat('#eef3f9', { rauheit: 0.95 });
    const haube = ctx.kiste(B + 0.06, 0.07, 0.16, schnee, { rund: 0.03 });
    haube.position.set(0, MITTE_Y + H / 2 + 0.05, 0);
    gruppe.add(haube);
    for (const sx of [-0.85, 0.85]) { const h = ctx.kiste(0.16, 0.06, 0.16, schnee, { rund: 0.03 }); h.position.set(sx, MITTE_Y + H / 2 + 0.11, -0.09); gruppe.add(h); }
  }

  // ---------- Strich durch Zeile 1 und neue Zahl in Zeile 2 (wachsen von links nach rechts) ----------
  const breiteZahl = (() => { const c = document.createElement('canvas').getContext('2d'); c.font = `${(ZIFFER * PXM) / 0.72}px ${SCHILD}`; return ([...zahl].reduce((a, ch) => a + c.measureText(ch).width, 0) + ZIFFER * PXM * 0.06 * (zahl.length - 1)) / PXM; })();
  const links = -breiteZahl / 2 - 0.08, rechts = breiteZahl / 2 + 0.08;
  // Strich: dunkle Pinselbahn (Odells Tinte #1E1C1A, wie die Streichungen im Stadtbuch), leicht ansteigend
  const strichTex = ctx.zeichenTextur((g, w, h) => {
    g.clearRect(0, 0, w, h);
    let s = 9; const z = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 9; i++) {
      g.strokeStyle = `rgba(30,28,26,${0.55 + z() * 0.4})`; g.lineWidth = h * (0.16 + z() * 0.12); g.lineCap = 'round';
      const y = h * (0.35 + z() * 0.3);
      g.beginPath(); g.moveTo(h * 0.3, y + (z() - 0.5) * 6); g.lineTo(w - h * 0.3, y + (z() - 0.5) * 6); g.stroke();
    }
  }, 512, 48);
  const strichMat = new T.MeshStandardMaterial({ map: strichTex, transparent: true, roughness: 0.3, depthWrite: false });
  const strichLaenge = rechts - links;
  const strich = new T.Mesh(new T.PlaneGeometry(1, 0.06), strichMat);
  strich.position.set(0, 0, 0);
  const strichHalter = new T.Group();
  strichHalter.position.set(links, ZEILE1 - ZIFFER * 0.02, 0.036);
  strichHalter.rotation.z = 0.05;
  strichHalter.add(strich);
  gruppe.add(strichHalter);
  const neuTex = ctx.zeichenTextur((g, w, h) => { g.clearRect(0, 0, w, h); gemalteZahl(g, neu, w / 2, h * 0.86, ZIFFER * PXM, { seed: 2 }); }, Math.round((breiteZahl + 0.3) * PXM), Math.round(ZIFFER * PXM * 1.2));
  const neuMat = new T.MeshStandardMaterial({ map: neuTex, transparent: true, roughness: 0.4, depthWrite: false });
  const neuB = breiteZahl + 0.3, neuH = ZIFFER * 1.2;
  const neuFlaeche = new T.Mesh(new T.PlaneGeometry(1, neuH), neuMat);
  const neuHalter = new T.Group();
  neuHalter.position.set(-neuB / 2, ZEILE2 - ZIFFER * 0.5 + neuH * 0.5 - ZIFFER * 0.14, 0.036);
  neuHalter.add(neuFlaeche);
  gruppe.add(neuHalter);
  // Sichtbarer Anteil 0..1: Fläche wächst vom linken Rand, die Textur wird mit abgeschnitten (kein Stauchen)
  const zeige = (mesh, karte, laenge, anteil) => {
    const a = Math.max(0.0001, Math.min(1, anteil));
    mesh.scale.x = laenge * a;
    mesh.position.x = (laenge * a) / 2;
    karte.repeat.x = a; karte.offset.x = 0;
    mesh.visible = anteil > 0.001;
  };

  // ---------- Odells Hand mit Pinsel ----------
  // Der Pinsel zeigt schräg von rechts unten auf die Tafel (von vorn gesehen ist er so ganz zu sehen); dahinter
  // Faust und brauner Mantelärmel. Ursprung der Gruppe = Pinselspitze.
  const hand = new T.Group();
  const haut = ctx.mat('#E2C2A4', { rauheit: 0.68, kante: { farbe: '#d6deff', staerke: 0.25, exponent: 3 } });
  const mantel = ctx.mat('#5B4433', { rauheit: 0.9, kante: { farbe: '#ffe2c8', staerke: 0.3, exponent: 2.6 } });
  const richtung = new T.Vector3(0.42, -0.62, 0.66).normalize();       // von der Spitze zur Hand
  const halter = new T.Group();
  halter.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), richtung);
  hand.add(halter);
  const borsten = rundeKiste(0.04, 0.06, 0.016, ctx.mat('#f2efe6', { rauheit: 0.9 }), 0.006, false);
  borsten.position.y = 0.03; halter.add(borsten);
  const zwinge = new T.Mesh(new T.CylinderGeometry(0.016, 0.018, 0.045, 8), ctx.mat('#b8b4aa', { metall: 0.6, rauheit: 0.35 }));
  zwinge.position.y = 0.08; halter.add(zwinge);
  const stiel = new T.Mesh(new T.CylinderGeometry(0.012, 0.016, 0.3, 8), ctx.mat('#8a5a32', { rauheit: 0.6 }));
  stiel.position.y = 0.25; halter.add(stiel);
  const faust = rundeKiste(0.11, 0.12, 0.12, haut, 0.035);
  faust.position.y = 0.36; halter.add(faust);
  const aermel = rundeKiste(0.17, 0.55, 0.17, mantel, 0.04);
  aermel.position.y = 0.68; halter.add(aermel);
  const spitze = new T.Object3D(); hand.add(spitze);
  hand.visible = false;
  gruppe.add(hand);
  // Pinselspitze an (x, y) auf der Tafel
  const handAn = (x, y) => { hand.position.set(x, y, 0.04); hand.visible = true; };

  const anker = {
    mitte: new T.Object3D(), zahl: new T.Object3D(), neu: new T.Object3D(), pop: new T.Object3D(), pinsel: spitze,
  };
  anker.mitte.position.set(0, MITTE_Y, 0.05);
  anker.zahl.position.set(0, ZEILE1, 0.05);
  anker.neu.position.set(0, ZEILE2, 0.05);
  anker.pop.position.set(-B * 0.37, 1.72, 0.05);
  for (const k of ['mitte', 'zahl', 'neu', 'pop']) gruppe.add(anker[k]);

  const glatt = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const zustand = { strich: 0, neu: 0 };
  const ruhe = () => { zustand.strich = 0; zustand.neu = 0; hand.visible = false; hand.position.set(0, 0, 0); };
  ruhe();
  return {
    gruppe, gelenke: { hand }, anker, hoehe: MITTE_Y + H / 2,
    grundpose: ruhe,
    aktualisiere() {
      zeige(strich, strichTex, strichLaenge, zustand.strich);
      zeige(neuFlaeche, neuTex, neuB, zustand.neu);
    },
    animationen: {
      umschreiben: {
        dauer: 1.0, ease: 'linear',
        anwenden(f, p, prm, c) {
          const t = c.roh;   // Zeitplan unten in Anteilen der Dauer (bei Std 1,0 s = Sekunden)
          const z1 = ZEILE1 - 0.01, z2 = ZEILE2 - 0.02;
          zustand.strich = glatt(0.40, 0.52, t);
          zustand.neu = glatt(0.55, 0.78, t);
          // Weg der Pinselspitze: von links unten heran, Strich nach rechts, hinunter und zurück an den Anfang von
          // Zeile 2, malen nach rechts (mit kleinen Auf-und-ab-Zügen), dann nach unten aus dem Bild
          let x, y;
          if (t < 0.38) { const u = glatt(0, 0.38, t); x = links - 0.9 * (1 - u); y = z1 - 1.3 * (1 - u); }
          else if (t < 0.53) { const u = glatt(0.40, 0.52, t); x = links + strichLaenge * u; y = z1 + 0.05 * u; }
          else if (t < 0.56) { const u = glatt(0.53, 0.56, t); x = rechts + (links - rechts) * u; y = z1 + (z2 - z1) * u; }
          else if (t < 0.8) { const u = glatt(0.55, 0.78, t); x = -neuB / 2 + 0.15 + (neuB - 0.3) * u; y = z2 + Math.sin(c.tLokal * 70) * ZIFFER * 0.35 * (u < 1 ? 1 : 0); }
          else { const u = glatt(0.8, 1.0, t); x = rechts - 0.2 + 0.4 * u; y = z2 - 1.4 * u; }
          handAn(x, y);
        },
      },
      pinsel_sinken: {
        dauer: 1.2, ease: 'linear',
        anwenden(f, p, prm, c) {
          const u = c.roh;
          const hoch = u < 0.35 ? glatt(0, 0.35, u) : u < 0.7 ? 1 : 1 - glatt(0.7, 1, u);
          handAn(0.1, ZEILE2 - 1.2 + 1.15 * hoch);
        },
      },
    },
  };
}
