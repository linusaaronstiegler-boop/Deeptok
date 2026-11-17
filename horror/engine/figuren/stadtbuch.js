// Requisite „stadtbuch“: Mr. Odells Buch der Regeln (Rules of Kindly, Bibel §2 „Das Stadtbuch“, §3.1, F1 S22, S25–26).
// Aufgeschlagen ganz vorn: links das Vorsatzpapier mit Odells Exlibris, rechts RULE 3 („IF THE ICE KNOCKS, NEVER
// KNOCK BACK.“) mit durchgestrichenen Namen (zuletzt LUND, frische Tinte). Auf der rechten Seite liegt am Falz der
// Stummel der herausgerissenen ersten Seite: „0 IF“, ein Punkt unter der 0 (Rule-Zero-Wort 1, Positionsmarke).
// Ein loses Blatt kann umgeblättert werden; auf seiner Vorderseite steht RULE 18 (Ei für Hiding Night).
//
// Lage: Ursprung = Mitte unter dem Buch (Rückendeckel liegt auf y = 0). Der Falz läuft längs z, Kopf der Seiten
// bei −z: Wer von +z (Kamera vor dem Pult) auf das Buch schaut, liest die Schrift aufrecht. Seite 0,30 × 0,42 m.
// Lesbarkeit (Bibel §3.1): Versalhöhe „0 IF“ 2,3 cm. Für ≥ 72 px im fertigen Bild darf die Bildbreite (1080 px)
// höchstens 0,34 m des Buches zeigen; Anker "stummel" in die sichere Zone x 120–860, y 260–1040 legen.
//
// params: neigung (Grad, Std 0: Buch liegt flach; > 0 hebt den Kopf der Seiten, für ein schräges Pult),
//         blatt ("links" Std: das lose Blatt liegt schon links | "rechts": es liegt auf RULE 3 und zeigt RULE 18 |
//         false: kein loses Blatt), nachtrag (Std false; ab F2 true: „3b. NOR FIRST.“ in frischer Tinte),
//         groesse (Std 1)
// Animation: blaettern (Std 0,55 s): das lose Blatt dreht von rechts nach links um den Falz (params.zurueck: von
//            links nach rechts). In der ersten Hälfte ist RULE 18 zu sehen, dann liegt RULE 3 frei.
// Anker: mitte, falz, stummel (Mitte von „0 IF“), regel (Überschrift RULE 3), zeile (Anfang „NEVER KNOCK BACK.“),
//        zeile_ende (nach „BACK.“), namen (Mitte der Namensliste), lund (die Streichung LUND), blatt (loses Blatt)
import { ladeSchriften, federText, federStrich, FEDER } from '../src/kindly_requisiten.js';

const PB = 0.3, PH = 0.42;              // Seite in m
const W = 1024, H = Math.round(1024 * PH / PB);   // Textur in px (3413 px/m)
const PXM = W / PB;
const PAPIER = '#EFE6CF', TINTE = '#1E1C1A';

// gealtertes Papier: cremefarben, Ränder dunkler, feine Fasern, ein paar Stockflecken
function papier(g, w, h, seed = 3) {
  let s = seed * 7919; const z = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  g.fillStyle = PAPIER; g.fillRect(0, 0, w, h);
  const r = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
  r.addColorStop(0, 'rgba(120,90,50,0)'); r.addColorStop(1, 'rgba(120,90,50,0.28)');
  g.fillStyle = r; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(110,85,50,${0.03 + z() * 0.05})`; g.fillRect(z() * w, z() * h, 1 + z() * 3, 1); }
  for (let i = 0; i < 6; i++) {
    const x = z() * w, y = z() * h, rr = 6 + z() * 18;
    const f = g.createRadialGradient(x, y, 0, x, y, rr);
    f.addColorStop(0, 'rgba(140,100,50,0.18)'); f.addColorStop(1, 'rgba(140,100,50,0)');
    g.fillStyle = f; g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  }
}

export default async function baue(ctx, params = {}) {
  const T = ctx.THREE;
  await ladeSchriften(ctx);
  const gruppe = new T.Group();
  const buch = new T.Group();          // kippt mit params.neigung um die Unterkante
  gruppe.add(buch);
  buch.rotation.x = -(params.neigung ?? 0) * Math.PI / 180;
  buch.position.z = 0;

  // ---------- Texturen ----------
  const anker = {};
  const ankerPunkte = {};

  // rechte Seite: RULE 3 mit Namen; Textanfang rechts vom Stummel (x ≥ 300 px)
  const rechtsTex = ctx.zeichenTextur((g, w, h) => {
    papier(g, w, h, 5);
    // Randlinie wie in einem Register
    g.strokeStyle = 'rgba(150,60,50,0.35)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(290, 60); g.lineTo(290, h - 60); g.stroke();
    const bTitel = federText(g, 'RULE 3', 0, -1000, 92, { seed: 31, fett: true });
    const xT = 320 + (w - 320 - bTitel) / 2;
    federText(g, 'RULE 3', xT, 250, 92, { seed: 31, fett: true });
    ankerPunkte.regel = [xT + bTitel / 2, 205];
    federStrich(g, xT - 10, 282, xT + bTitel + 10, 278, 5);
    federText(g, 'IF THE ICE KNOCKS,', 330, 420, 60, { seed: 32 });
    const bZeile = federText(g, 'NEVER KNOCK BACK.', 330, 520, 60, { seed: 33 });
    ankerPunkte.zeile = [330, 490];
    ankerPunkte.zeile_ende = [330 + bZeile, 490];
    // Namen der Toten an dieser Regel, jeder mit einem geraden Federstrich durchgestrichen
    const namen = ['OTTER', 'SLIM', 'DUCK', 'BIRCH', 'LUND'];
    namen.forEach((n, i) => {
      const y = 680 + i * 92;
      const frisch = n === 'LUND';
      const b = federText(g, n, 360, y, 50, { seed: 40 + i, farbe: frisch ? '#101010' : '#2c2622' });
      federStrich(g, 345, y - 22 + (i % 2) * 3, 360 + b + 18, y - 26 + (i % 3) * 2, frisch ? 7 : 5, frisch ? '#0c0c0c' : '#2c2622');
      if (frisch) ankerPunkte.lund = [360 + b / 2, y - 25];
    });
    ankerPunkte.namen = [470, 860];
    if (params.nachtrag) {
      // Nachtrag nach F1 in frischer, bläulich-schwarzer Tinte (ab F2 sichtbar)
      federText(g, '3b. NOR FIRST.', 330, 1230, 58, { seed: 77, farbe: '#141c34' });
    }
    // Seitenzahl unten
    federText(g, '3', w - 120, h - 70, 34, { seed: 9 });
  }, W, H);

  // linke Seite: Vorsatzpapier (marmoriert) mit Odells Exlibris
  const linksTex = ctx.zeichenTextur((g, w, h) => {
    g.fillStyle = '#2d3b33'; g.fillRect(0, 0, w, h);
    let s = 97; const z = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 160; i++) {
      g.strokeStyle = ['rgba(180,150,90,0.18)', 'rgba(120,40,40,0.2)', 'rgba(200,190,160,0.12)'][i % 3];
      g.lineWidth = 2 + z() * 6;
      g.beginPath();
      let x = z() * w, y = z() * h; g.moveTo(x, y);
      for (let k = 0; k < 6; k++) { x += (z() - 0.5) * 160; y += (z() - 0.3) * 120; g.quadraticCurveTo(x + 40, y - 30, x, y); }
      g.stroke();
    }
    // Exlibris-Schild
    g.fillStyle = '#EDE3C8'; g.fillRect(w * 0.22, h * 0.36, w * 0.56, h * 0.24);
    g.strokeStyle = '#5a4a30'; g.lineWidth = 4; g.strokeRect(w * 0.24, h * 0.375, w * 0.52, h * 0.21);
    const zeile = (t, y, gr, seed) => { const b = federText(g, t, 0, -999, gr, { seed }); federText(g, t, (w - b) / 2, y, gr, { seed }); };
    zeile('TOWN OF KINDLY', h * 0.44, 46, 61);
    zeile('BOOK OF RULES', h * 0.51, 40, 62);
    zeile('KEPT BY MR. ODELL', h * 0.565, 28, 63);
  }, W, H);

  // Stummel der ersten Seite: gerissener Streifen, oben breiter; „0“ mit einem Punkt darunter, dann „IF“
  const SW = 256;
  const stummelTex = ctx.zeichenTextur((g, w, h) => {
    g.clearRect(0, 0, w, h);
    let s = 211; const z = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const rand = [];
    for (let y = 0; y <= h; y += 24) {
      const basis = 250 - (y / h) * 160;            // 250 px oben, 90 px unten
      rand.push([basis + (z() - 0.5) * 26, y]);
    }
    g.save();
    g.beginPath(); g.moveTo(0, 0);
    for (const [x, y] of rand) g.lineTo(Math.min(w - 2, x), y);
    g.lineTo(0, h); g.closePath(); g.clip();
    papier(g, w, h, 11);
    // Rissrand heller (Fasern)
    g.strokeStyle = 'rgba(255,250,235,0.9)'; g.lineWidth = 5;
    g.beginPath(); rand.forEach(([x, y], i) => (i ? g.lineTo(x - 2, y) : g.moveTo(x - 2, y))); g.stroke();
    // „0 IF“: Versalhöhe 80 px = 2,3 cm
    // Die „0“ als hochovale Ziffer in voller Versalhöhe mit Querstrich, von Hand gezogen (Review Kindly F1: die
    // Mediävalziffer der Schrift stand in x-Höhe und las sich als „o“ oder Gradzeichen). Vorlage für F2–F8.
    const b0 = 50, mx = 22 + b0 / 2, my = 230 - 40;
    g.strokeStyle = TINTE; g.lineCap = 'round'; g.lineWidth = 11;
    g.beginPath(); g.ellipse(mx, my, 19, 37, 0.06, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 8; g.beginPath(); g.moveTo(mx - 13, my + 22); g.lineTo(mx + 13, my - 22); g.stroke();
    g.fillStyle = TINTE; g.beginPath(); g.arc(mx, 268, 12, 0, Math.PI * 2); g.fill();
    federText(g, 'IF', 22 + b0 + 34, 230, 80, { seed: 92, fett: true });
    // Rest der Zeile: abgerissen (nur Ansätze von Buchstaben am Rand)
    g.restore();
  }, SW, H);
  ankerPunkte.stummel = [100, 200];

  // loses Blatt: vorn RULE 18, hinten leer mit durchscheinender Schrift
  const blattVorn = ctx.zeichenTextur((g, w, h) => {
    papier(g, w, h, 21);
    const b = federText(g, 'RULE 18', 0, -999, 92, { seed: 18, fett: true });
    federText(g, 'RULE 18', (w - b) / 2, 250, 92, { seed: 18, fett: true });
    federText(g, 'WHEN YOU TURN EIGHTEEN,', 120, 420, 56, { seed: 19 });
    federText(g, 'YOU HIDE UNTIL SUNRISE.', 120, 515, 56, { seed: 20 });
    ['WREN', 'MOSS', 'HARE'].forEach((n, i) => {
      const y = 690 + i * 92;
      const bn = federText(g, n, 160, y, 50, { seed: 50 + i, farbe: '#2c2622' });
      federStrich(g, 145, y - 22, 160 + bn + 18, y - 25, 5, '#2c2622');
    });
    federText(g, '18', w - 140, h - 70, 34, { seed: 8 });
  }, W, H);
  const blattHinten = ctx.zeichenTextur((g, w, h) => {
    papier(g, w, h, 22);
    g.save(); g.globalAlpha = 0.08; g.translate(w, 0); g.scale(-1, 1);
    g.font = `140px ${FEDER}`; g.fillStyle = TINTE; g.fillText('RULE 18', 300, 250);
    g.restore();
  }, W, H);
  for (const t of [rechtsTex, linksTex, stummelTex, blattVorn, blattHinten]) { t.anisotropy = 8; }

  // ---------- Geometrie ----------
  const leder = ctx.mat('#4A2A20', { rauheit: 0.7, kante: { farbe: '#ffd9b0', staerke: 0.25, exponent: 2.4 } });
  const schnitt = ctx.mat('#E3D6B4', { rauheit: 0.95 });
  const deckel = ctx.kiste(PB * 2 + 0.03, 0.012, PH + 0.02, leder, { rund: 0.004 });
  deckel.position.y = 0.006;
  buch.add(deckel);
  const STAPEL = 0.026, KIPP = 0.06;     // Höhe der Seitenstapel; Seiten steigen zum Außenrand leicht an
  const seiteBauen = (seite, tex) => {
    const halb = new T.Group();
    halb.position.set(seite * 0.002, 0.012, 0);
    halb.rotation.z = seite * KIPP;
    buch.add(halb);
    const stapel = ctx.kiste(PB, STAPEL, PH, schnitt, { rund: 0.003 });
    stapel.position.set(seite * PB / 2, STAPEL / 2, 0);
    halb.add(stapel);
    const flaeche = new T.Mesh(new T.PlaneGeometry(PB, PH), new T.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
    flaeche.rotation.x = -Math.PI / 2;
    flaeche.position.set(seite * PB / 2, STAPEL + 0.0008, 0);
    flaeche.receiveShadow = true;
    halb.add(flaeche);
    return halb;
  };
  const links = seiteBauen(-1, linksTex);
  const rechts = seiteBauen(1, rechtsTex);
  // Stummel liegt lose auf der rechten Seite am Falz
  const stummel = new T.Mesh(new T.PlaneGeometry(SW / PXM, PH), new T.MeshStandardMaterial({ map: stummelTex, roughness: 0.9, alphaTest: 0.5, side: T.DoubleSide }));
  stummel.rotation.x = -Math.PI / 2;
  stummel.position.set(SW / PXM / 2 + 0.002, STAPEL + 0.0022, 0);
  stummel.rotation.z = 0.008;
  rechts.add(stummel);
  // Anker in den Seitenflächen (Pixel → Meter im System der Seitenhälfte)
  const punktAuf = (halb, xm, zm, y = STAPEL + 0.003) => { const o = new T.Object3D(); o.position.set(xm, y, zm); halb.add(o); return o; };
  const px = (p, seite = 1) => [seite > 0 ? p[0] / PXM : -PB + p[0] / PXM, p[1] / PXM - PH / 2];
  for (const k of ['regel', 'zeile', 'zeile_ende', 'namen', 'lund']) { const [x, z] = px(ankerPunkte[k]); anker[k] = punktAuf(rechts, x, z); }
  { const [x, z] = [ankerPunkte.stummel[0] / PXM + 0.002, ankerPunkte.stummel[1] / PXM - PH / 2]; anker.stummel = punktAuf(rechts, x, z, STAPEL + 0.004); }
  anker.mitte = punktAuf(buch, 0, 0, 0.04);
  anker.falz = punktAuf(buch, 0, -PH * 0.2, 0.04);

  // loses Blatt: Drehpunkt am Falz; rotation.z = 0 liegt rechts (Vorderseite oben), π liegt links
  const blatt = new T.Group();
  blatt.position.set(0, 0.012 + STAPEL + 0.004, 0);
  buch.add(blatt);
  const vorn = new T.Mesh(new T.PlaneGeometry(PB, PH), new T.MeshStandardMaterial({ map: blattVorn, roughness: 0.9 }));
  vorn.rotation.x = -Math.PI / 2; vorn.position.x = PB / 2;
  const hinten = new T.Mesh(new T.PlaneGeometry(PB, PH), new T.MeshStandardMaterial({ map: blattHinten, roughness: 0.9 }));
  hinten.rotation.x = Math.PI / 2; hinten.position.set(PB / 2, -0.0006, 0);
  hinten.rotation.z = Math.PI;
  blatt.add(vorn, hinten);
  anker.blatt = punktAuf(blatt, PB / 2, 0, 0.002);
  // Ruhelage passend zur leicht ansteigenden Seite: rechts KIPP, links π − KIPP
  const blattStart = params.blatt === 'rechts' ? KIPP + 0.004 : Math.PI - KIPP - 0.004;
  blatt.visible = params.blatt !== false;
  void links;

  gruppe.scale.setScalar(params.groesse ?? 1);
  return {
    gruppe, gelenke: { blatt }, anker, hoehe: 0.05,
    grundpose() { blatt.rotation.set(0, 0, blattStart); blatt.position.y = 0.012 + STAPEL + 0.004; },
    animationen: {
      blaettern: {
        dauer: 0.55, ease: 'ease_in_out',
        anwenden(f, p, prm, c) {
          const ziel = prm.zurueck ? KIPP + 0.004 : Math.PI - KIPP - 0.004;
          blatt.rotation.z = c.mischen(blatt.rotation.z, ziel, p);
          // das Blatt hebt sich in der Mitte der Drehung etwas (biegt sich nicht, Klötzchen-Stil)
          blatt.position.y += 0.02 * Math.sin(Math.PI * c.roh);
        },
      },
    },
  };
}
