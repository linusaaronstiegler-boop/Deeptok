// Mister Hundred: das Monster der Serie "Hiding Night" (eigene Figur, kein bekanntes Monster).
// serie.md: etwa 7 m hoch, dünn wie ein Zaunpfahl, langer dunkelgrauer Mantel bis zum Schienbein
// mit stufig ausgefranstem Saum, barfuß mit langen kalkweißen Füßen, übergroße kalkweiße Hände mit
// je 4 langen Fingern (3 Glieder) IMMER vor dem glatten Würfelkopf. Die Ellbogen stehen spitz zur
// Seite: Hände, Unterarme, Oberarme und Kopf bilden eine Raute, die auch als Schattenriss im Nebel
// lesbar ist. Farben: Mantel #2A2B30, Saum #3A3B42, Haut #DAD6CC, Nägel #8C8F94.
//
// Technik: Die Hände sitzen per IK (src/ik.js) vor dem Gesicht, gerechnet im System des Kopfes.
// Neigt sich der Kopf oder beugt sich der Rumpf, bleiben die Hände vor dem Gesicht. Die IK läuft
// als Nachlauf, nachdem alle Aktionen eines Bildes angewendet sind (die Welt ruft setzeGesicht und
// atmen nach den Aktionen auf). Animationen schreiben deshalb nur in fig.zustand:
//   weg     0..1  Hände vom Gesicht genommen (1 = gesenkt, Handflächen nach außen)
//   spreizL/R 0..1  Mittel- und Ringfinger auseinander (Spalt)
//   druck   0..1  Finger fester geschlossen
//   auge    0..1  bernsteinfarbenes Auge hinter dem Spalt geöffnet
//   glut    0..1  kaltes Leuchten hinter den Händen (Zählpuls, Leitgeräusch-Effekt)
//
// Gesichter (Tausch in 1 Bild): glatt (Std), auge (Auge offen), june_gross und june_mund (Teil 4).
// Eigene Animationen: zaehlen, spaehen, finger_spreizen, finger_schliessen, kopf_schief,
// haende_weg, haende_vor, vorbeugen, stapfen (auch als "gehen"), glimmen.
// params: groesse (Std 1 = etwa 7 m)
import { rundeKiste, trapezKiste, aufkleber } from '../src/klotzfigur.js';
import { zweiGlied, richteAus } from '../src/ik.js';
import { zeichneGesicht } from '../src/gesichter.js';
import { knopfleiste, naht } from '../src/kleidung.js';

// Review Folge 1: Glieder kräftiger (Arme 0,15 -> 0,24 m), Hände größer und knochiger mit Daumen,
// damit die Figur keine Strichfigur ist und sich klar von Slender Man unterscheidet (A7.3).
const M = {
  fussL: 0.95, fussB: 0.26, fussH: 0.13,
  oberschenkel: 1.6, unterschenkel: 1.6, beinD: 0.22, beinAbstand: 0.3,
  rumpfH: 2.45, rumpfOben: 0.98, rumpfUnten: 0.56, rumpfT: 0.44,
  hals: 0.4, kopfB: 0.6, kopfH: 0.66, kopfT: 0.56,
  oberarm: 1.25, unterarm: 1.15, armD: 0.24,
  handB: 0.42, handH: 0.36, handT: 0.1, finger: [0.33, 0.28, 0.23], fingerD: 0.078,
  saumY: 1.05, // Höhe der Mantelkante über dem Boden
};

const glatt01 = (x) => { const u = Math.min(1, Math.max(0, x)); return u * u * (3 - 2 * u); };

export default async function baue(ctx, params = {}) {
  const T = ctx.THREE;
  // Kantenlicht (Fresnel, src/werkzeug.js): Haut und Mantel setzen sich gegen den Himmel ab.
  // Kalt-türkis wie das Leuchten hinter den Händen (#9FD8D2), damit die Akzentfarbe zum Monster gehört.
  const haut = ctx.mat('#DAD6CC', { rauheit: 0.6, kante: { farbe: '#bfe6e2', staerke: 0.35, exponent: 2.2 } });
  const naegel = ctx.mat('#8C8F94', { rauheit: 0.4 });
  // Fingerspitzen glimmen kalt (Leuchten zwischen und an den Fingern, Review Folge 1)
  // params.spitzen_glut (Std 1.6): Review Teil 2 – zu helle Spitzen lasen sich im Hook wie Kerzenflammen
  // params.naegel: Farbe der Nägel (Std hell #a9c9c6); dunkle Nägel nehmen den Fingern die „Kerzendocht“-Spitze
  const fingerNaegel = ctx.mat(params.naegel ?? '#a9c9c6', { rauheit: 0.4, leuchten: '#9FD8D2', leuchtStaerke: params.spitzen_glut ?? 1.6 });
  const mantelTex = ctx.zeichenTextur((g, w, h) => {
    // grober Wollstoff: feine Körnung, damit der Mantel nicht wie Plastik wirkt
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    const z = ctx.zufall('mantel');
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${0.04 + z() * 0.08})`; g.fillRect(z() * w, z() * h, 1 + z() * 2, 1 + z() * 3); }
  }, 128, 128);
  mantelTex.wrapS = mantelTex.wrapT = T.RepeatWrapping;
  mantelTex.repeat.set(3, 3);
  // Mantel dunkelgrau statt fast schwarz, mit Stofftextur und kaltem Kantenlicht (Review Folge 1:
  // der Körper las sich als flache schwarze Strichfigur)
  // params.mantel { farbe, saum, kante, exponent }: Review Teil 2 – im Dämmer- und Nachtlicht wirkte der Mantel
  // weiß bis türkis, die Farbe sprang zwischen den Einstellungen. Dunkler Stoff mit schmaler Kante hält ihn
  // in jeder Lichtstimmung als dunkle Gestalt; nur der Rand leuchtet kalt.
  const mp = params.mantel ?? {};
  const mantel = ctx.mat(mp.farbe ?? '#5B5E6C', { rauheit: 0.85, karte: mantelTex, kante: { farbe: '#9FD8D2', staerke: mp.kante ?? 0.9, exponent: mp.exponent ?? 2.2 } });
  const saumMat = ctx.mat(mp.saum ?? '#6A6D7B', { rauheit: 0.85, karte: mantelTex, kante: { farbe: '#9FD8D2', staerke: (mp.kante ?? 0.9) * 0.83, exponent: mp.exponent ?? 2.2 } });

  const grundglut = params.grundglut ?? 0.55;
  const gruppe = new T.Group();
  const huefteHoehe = M.fussH + M.oberschenkel + M.unterschenkel;
  const huefte = new T.Group();
  huefte.position.y = huefteHoehe;
  gruppe.add(huefte);

  // ---------- Rumpf: der Mantel ----------
  const rumpf = new T.Group();
  rumpf.position.y = 0.05;
  huefte.add(rumpf);
  const rumpfMesh = trapezKiste(M.rumpfOben, M.rumpfUnten, M.rumpfH, M.rumpfT, mantel, 0.06);
  rumpfMesh.position.y = M.rumpfH / 2;
  rumpf.add(rumpfMesh);
  const vorne = aufkleber(ctx, M.rumpfOben, M.rumpfH, (g, w, h) => {
    // Revers und Knopfleiste (Knöpfe dunkler als der Stoff)
    g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = w * 0.02;
    g.beginPath(); g.moveTo(w * 0.3, 0); g.lineTo(w * 0.47, h * 0.2); g.lineTo(w * 0.52, h * 1.0); g.stroke();
    g.beginPath(); g.moveTo(w * 0.7, 0); g.lineTo(w * 0.53, h * 0.2); g.stroke();
    knopfleiste(g, w, h, { farbe: '#15161a', anzahl: 5, von: 0.25, bis: 0.92, x: 0.56 });
    naht(g, w, w * 0.25, h * 0.55, w * 0.42, h * 0.55, 'rgba(0,0,0,0.4)');
  }, 300);
  vorne.position.set(0, M.rumpfH / 2, M.rumpfT / 2 + 0.004);
  rumpf.add(vorne);
  // spitze, hochgezogene Schultern (Mantelpolster)
  for (const sx of [-1, 1]) {
    const schulter = rundeKiste(0.34, 0.16, M.rumpfT * 1.05, mantel, 0.05);
    schulter.position.set(sx * (M.rumpfOben / 2 - 0.08), M.rumpfH + 0.02, 0);
    schulter.rotation.z = sx * 0.28;
    rumpf.add(schulter);
  }
  // hoher Stehkragen um den Hals
  const kragen = rundeKiste(0.44, 0.34, 0.38, mantel, 0.06);
  kragen.position.set(0, M.rumpfH + 0.08, -0.02);
  rumpf.add(kragen);
  const hals = rundeKiste(0.14, M.hals + 0.1, 0.14, haut, 0.04, false);
  hals.position.y = M.rumpfH + M.hals / 2;
  rumpf.add(hals);

  // ---------- Kopf: glatter Würfel, vorne Gesichtsfläche, Auge und Glutplatte ----------
  const kopf = new T.Group();
  kopf.position.y = M.rumpfH + M.hals;
  rumpf.add(kopf);
  const kopfMesh = rundeKiste(M.kopfB, M.kopfH, M.kopfT, haut, 0.09);
  kopfMesh.position.y = M.kopfH / 2;
  kopf.add(kopfMesh);
  const gb = M.kopfB - 0.15, gh = M.kopfH - 0.15;
  const stilJune = { haut: '#DAD6CC', iris: '#E3A33B', tinte: '#141012', augenAbstand: 0.22, augenGroesse: 1.5, augenHoehe: 0.45, mundHoehe: 0.8, mundBreite: 1.5 };
  // Teil 3 (Finale, Satz 40–45): Junes eigenes Gesicht auf dem Würfelkopf, viel zu groß gedehnt, mit ihren
  // Brauen, Wangen und Sommersprossen, bernsteinfarbenen Augen und einem Lächeln eine Spur zu breit.
  // june_gedehnt (Std), june_bricht (das Lächeln bricht, die Brauen sinken); Mundformen für Junes Rede als
  // zusammengesetzter Name: "june_gedehnt/reden_a" usw.
  // Review Teil 3: Das Gesicht wirkte hell, pastellig und freundlich (Lichtpunkte in den Augen, rosa Wangen,
  // dünner Lächelbogen). Jetzt: Haut fahler, keine Wangen, Augen eine Spur zu weit auseinander und leer
  // (ohne Lichtpunkt), ein Grinsen fast über die ganze Breite mit Zähnen (Ausdruck „gedehnt“).
  const stilJuneDehn = { haut: '#D8C3AE', iris: '#E3A33B', tinte: '#141012', brauen: '#5E2219', sommersprossen: true,
    augenAbstand: 0.255, augenGroesse: 1.32, augenHoehe: 0.43, mundHoehe: 0.79, mundBreite: 1.45 };
  // june_muede (Satz 52): die Lider sinken, wenn sie beim Zählen einschläft
  const JUNE_DEHN = { june_gedehnt: 'gedehnt', june_bricht: 'gedehnt_bricht', june_muede: 'gedehnt_muede', june_schlaeft: 'gedehnt_schlaeft' };
  const gesichtKarten = {};
  const karte = (name) => gesichtKarten[name] ??= ctx.zeichenTextur((g, w, h) => {
    const [basis, ...mund] = name.split('/');
    if (JUNE_DEHN[basis]) {
      const miene = mund.length ? `${JUNE_DEHN[basis].split('/')[0]}/${mund.join('/')}` : JUNE_DEHN[basis];
      zeichneGesicht(g, w, h, miene, stilJuneDehn);
      // Junes roter Haaransatz am oberen Rand (ihr Zopf): so liest sich das Gesicht als ihres
      g.fillStyle = '#9c3a22';
      g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(w, h * 0.07);
      for (let i = 8; i >= 0; i--) g.lineTo((w * i) / 8, h * (0.07 + 0.035 * Math.sin(i * 1.9)));
      g.closePath(); g.fill();
    } else if (name === 'june_gross') zeichneGesicht(g, w, h, 'zu_breit', stilJune);
    else if (name === 'june_mund') zeichneGesicht(g, w, h, 'leer/schrei', stilJune);
    else {
      // glatt: keine Züge, nur eine kaum sichtbare Wölbung
      g.fillStyle = '#DAD6CC'; g.fillRect(0, 0, w, h);
      const gr = g.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, w * 0.6);
      gr.addColorStop(0, 'rgba(255,255,255,0.06)'); gr.addColorStop(1, 'rgba(0,0,0,0.06)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }
  }, 512, Math.round(512 * gh / gb));
  const gesichtMat = new T.MeshStandardMaterial({ map: karte('glatt'), roughness: 0.6 });
  const gesicht = new T.Mesh(new T.PlaneGeometry(gb, gh), gesichtMat);
  gesicht.position.set(0, M.kopfH / 2, M.kopfT / 2 + 0.002);
  kopf.add(gesicht);
  // Glutplatte: Grundfarbe wie die Haut, leuchtet nur beim Zählen (sichtbar durch die Fingerspalten)
  const glutMat = new T.MeshStandardMaterial({ color: '#DAD6CC', roughness: 0.6, emissive: new T.Color('#9FD8D2'), emissiveIntensity: 0 });
  const glut = new T.Mesh(new T.PlaneGeometry(gb * 0.72, gh * 0.5), glutMat);
  glut.position.set(0, M.kopfH * 0.62, M.kopfT / 2 + 0.004);
  kopf.add(glut);
  // Bernsteinfarbenes Auge hinter dem Spalt zwischen Mittel- und Ringfinger der rechten Hand
  const augePos = new T.Vector3(-0.2, 0.52, M.kopfT / 2 + 0.008);
  const augeGruppe = new T.Group();
  augeGruppe.position.copy(augePos);
  kopf.add(augeGruppe);
  const augeMat = ctx.leuchtMat('#E3A33B', 2.4);
  const iris = new T.Mesh(new T.CircleGeometry(0.045, 20), augeMat);
  iris.scale.set(0.85, 1.15, 1);
  augeGruppe.add(iris);
  const pupille = new T.Mesh(new T.CircleGeometry(0.013, 12), ctx.mat('#120c08', { rauheit: 0.3 }));
  pupille.scale.set(0.7, 2.2, 1);
  pupille.position.z = 0.001;
  augeGruppe.add(pupille);

  // ---------- Arme mit Händen (je 4 Finger zu 3 Gliedern) ----------
  const gelenke = { huefte, rumpf, kopf };
  const fingerGelenke = { L: [], R: [] };
  const baueArm = (S) => {
    const sx = S === 'L' ? 1 : -1;
    const arm = new T.Group();
    arm.position.set(sx * (M.rumpfOben / 2 + 0.02), M.rumpfH - 0.12, 0);
    rumpf.add(arm);
    const ober = rundeKiste(M.armD, M.oberarm + 0.1, M.armD, mantel, 0.04);
    ober.position.y = -M.oberarm / 2 + 0.05;
    arm.add(ober);
    const unter = new T.Group();
    unter.position.y = -M.oberarm;
    arm.add(unter);
    const unterMesh = rundeKiste(M.armD * 0.92, M.unterarm * 0.82, M.armD * 0.92, mantel, 0.035);
    unterMesh.position.y = -M.unterarm * 0.41;
    unter.add(unterMesh);
    // spitzer Ellbogen: ein Stoffkeil, der nach hinten-außen absteht (Spitze der Raute)
    // params.ellbogen_spitze (Std 1): Review Teil 2 – in der Untersicht lasen sich lange Spitzen als Pfeile
    const es = params.ellbogen_spitze ?? 1;
    const ellbogen = new T.Mesh(new T.ConeGeometry(0.15 * Math.max(es, 0.6), 0.44 * es, 4), mantel);
    ellbogen.position.set(0, 0.06, -0.12);
    ellbogen.rotation.x = -Math.PI / 2 - 0.5;
    ellbogen.castShadow = true;
    unter.add(ellbogen);
    // ausgefranster Ärmelsaum, darunter das weiße Handgelenk
    for (let i = 0; i < 3; i++) {
      const f = rundeKiste(M.armD * 0.5, 0.08 + i * 0.05, M.armD * 1.02, saumMat, 0.015);
      f.position.set((i - 1) * M.armD * 0.32, -M.unterarm * 0.82 - 0.02 - i * 0.02, 0);
      unter.add(f);
    }
    const gelenk = rundeKiste(0.15, M.unterarm * 0.25, 0.15, haut, 0.04);
    gelenk.position.y = -M.unterarm * 0.88;
    unter.add(gelenk);
    const hand = new T.Group();
    hand.position.y = -M.unterarm;
    unter.add(hand);
    // Hand-System: +y zu den Fingerspitzen, −z = Handfläche (zum Gesicht), +z = Handrücken
    const flaeche = rundeKiste(M.handB, M.handH, M.handT, haut, 0.035);
    flaeche.position.set(0, M.handH / 2, 0);
    hand.add(flaeche);
    const knoechel = rundeKiste(M.handB * 0.96, 0.06, M.handT * 1.15, haut, 0.025);
    knoechel.position.set(0, M.handH - 0.02, 0.01);
    hand.add(knoechel);
    for (let i = 0; i < 4; i++) {
      const basis = new T.Group();
      basis.position.set(sx * (-0.36 + 0.24 * i) * M.handB, M.handH, 0);
      hand.add(basis);
      const kette = [basis];
      let eltern = basis;
      const laengen = M.finger.map((l) => l * (i === 0 || i === 3 ? 0.88 : 1)); // äußere Finger kürzer
      laengen.forEach((l, k) => {
        const d = M.fingerD * (1 - k * 0.1);
        const seg = rundeKiste(d * 0.86, l - 0.012, d * 0.86, haut, 0.02);
        seg.position.y = l / 2;
        eltern.add(seg);
        // knochiger Gelenkknubbel am Anfang jedes Glieds
        const knubbel = rundeKiste(d * 1.08, 0.045, d * 1.05, haut, 0.018);
        knubbel.position.y = 0.012;
        eltern.add(knubbel);
        if (k === 2) {
          // spitzer, grauer Nagel auf der Außenseite der Fingerspitze
          const nagel = rundeKiste(d * 0.66, 0.085, 0.014, fingerNaegel, 0.006, false);
          nagel.position.set(0, l * 0.66, d * 0.42);
          eltern.add(nagel);
          const spitzeN = rundeKiste(d * 0.36, 0.04, 0.012, fingerNaegel, 0.004, false);
          spitzeN.position.set(0, l + 0.01, d * 0.36);
          eltern.add(spitzeN);
        }
        if (k < 2) {
          const naechstes = new T.Group();
          naechstes.position.y = l;
          eltern.add(naechstes);
          kette.push(naechstes);
          eltern = naechstes;
        }
      });
      const spitze = new T.Object3D();
      spitze.position.y = laengen[2];
      eltern.add(spitze);
      fingerGelenke[S].push({ kette, spitze });
      kette.forEach((g, k) => { gelenke[`finger${S}${i}_${k}`] = g; });
    }
    // Daumen (Review Folge 1: "Hand größer und knochiger mit sichtbarem Daumen"): zwei Glieder,
    // setzt an der Innenkante unten an und zeigt schräg nach oben-innen, mit Knubbeln und Nagel.
    const daumen = new T.Group();
    daumen.position.set(sx * -M.handB * 0.5, M.handH * 0.28, -0.01);
    daumen.rotation.set(-0.25, 0, sx * 0.75);
    hand.add(daumen);
    const dD = M.fingerD * 1.15;
    const d1 = rundeKiste(dD, 0.2, dD, haut, 0.022);
    d1.position.y = 0.1;
    daumen.add(d1);
    const dk = rundeKiste(dD * 1.15, 0.05, dD * 1.1, haut, 0.02);
    dk.position.y = 0.2;
    daumen.add(dk);
    const d2 = new T.Group();
    d2.position.y = 0.2;
    d2.rotation.z = sx * -0.35;
    daumen.add(d2);
    const d2m = rundeKiste(dD * 0.9, 0.17, dD * 0.9, haut, 0.02);
    d2m.position.y = 0.085;
    d2.add(d2m);
    const dn = rundeKiste(dD * 0.62, 0.07, 0.014, fingerNaegel, 0.006, false);
    dn.position.set(0, 0.13, dD * 0.45);
    d2.add(dn);
    const mitte = new T.Object3D();
    mitte.position.set(0, M.handH * 0.5, 0);
    hand.add(mitte);
    gelenke[`arm${S}`] = arm; gelenke[`unterarm${S}`] = unter; gelenke[`hand${S}`] = hand;
    return { mitte };
  };
  const aL = baueArm('L'), aR = baueArm('R');

  // ---------- Beine, Mantelschöße mit Saum, lange nackte Füße ----------
  const saumTeile = [];
  const baueBein = (S) => {
    const sx = S === 'L' ? 1 : -1;
    const bein = new T.Group();
    bein.position.set(sx * M.beinAbstand / 2, 0, 0);
    huefte.add(bein);
    const ober = rundeKiste(M.beinD, M.oberschenkel + 0.1, M.beinD, haut, 0.04);
    ober.position.y = -M.oberschenkel / 2;
    bein.add(ober);
    // Mantelschoß: reicht von der Hüfte bis zum Schienbein, geht mit dem Oberschenkel mit
    const schossLaenge = huefteHoehe - M.saumY;
    // A-Linie: oben schmal, unten weiter (Trapez mit breiterer Unterkante)
    const schoss = trapezKiste(0.3, 0.64, schossLaenge, M.rumpfT * 1.1, mantel, 0.04);
    schoss.position.set(sx * 0.07, -schossLaenge / 2 + 0.06, 0);
    bein.add(schoss);
    // stufig ausgefranster Saum: Stoffzungen unterschiedlicher Länge, bewegen sich im Wind
    const laengen = [0.16, 0.3, 0.1, 0.24];
    laengen.forEach((l, i) => {
      const zunge = new T.Group();
      zunge.position.set(sx * (0.07 - 0.23 + 0.115 * i + 0.0575), -schossLaenge + 0.08, (i % 2 ? 0.02 : -0.02));
      bein.add(zunge);
      const stoff = rundeKiste(0.11, l, M.rumpfT * (0.95 + 0.1 * (i % 2)), saumMat, 0.02);
      stoff.position.y = -l / 2;
      zunge.add(stoff);
      saumTeile.push({ zunge, i: i + (sx > 0 ? 0 : 4) });
      gelenke[`saum${S}${i}`] = zunge;
    });
    const unter = new T.Group();
    unter.position.y = -M.oberschenkel;
    bein.add(unter);
    const unterMesh = rundeKiste(M.beinD * 0.92, M.unterschenkel + 0.06, M.beinD * 0.92, haut, 0.04);
    unterMesh.position.y = -M.unterschenkel / 2;
    unter.add(unterMesh);
    const fuss = new T.Group();
    fuss.position.y = -M.unterschenkel;
    unter.add(fuss);
    const ferse = rundeKiste(M.fussB, M.fussH, M.fussL * 0.72, haut, 0.04);
    ferse.position.set(0, -M.fussH / 2, M.fussL * 0.22);
    fuss.add(ferse);
    for (let i = 0; i < 4; i++) {
      const zeh = rundeKiste(0.05, 0.07, 0.2 - Math.abs(i - 1.2) * 0.03, haut, 0.02);
      zeh.position.set(sx * (-0.075 + i * 0.05), -M.fussH + 0.035, M.fussL * 0.58 + 0.08);
      fuss.add(zeh);
      const nagel = rundeKiste(0.035, 0.012, 0.04, naegel, 0.004, false);
      nagel.position.set(sx * (-0.075 + i * 0.05), -M.fussH + 0.075, M.fussL * 0.58 + 0.15);
      fuss.add(nagel);
    }
    const sohle = new T.Object3D();
    sohle.position.set(0, -M.fussH, M.fussL * 0.25);
    fuss.add(sohle);
    gelenke[`bein${S}`] = bein; gelenke[`unterbein${S}`] = unter; gelenke[`fuss${S}`] = fuss;
    return { sohle };
  };
  const bL = baueBein('L'), bR = baueBein('R');

  const punkt = (eltern, x, y, z) => { const p = new T.Object3D(); p.position.set(x, y, z); eltern.add(p); return p; };
  const anker = {
    kopf: punkt(kopf, 0, M.kopfH / 2, 0),
    augen: punkt(kopf, 0, M.kopfH * 0.55, M.kopfT / 2),
    mund: punkt(kopf, 0, M.kopfH * 0.22, M.kopfT / 2 + 0.25),
    auge: punkt(kopf, augePos.x, augePos.y, augePos.z),
    ueber_kopf: punkt(kopf, 0, M.kopfH + 0.6, 0),
    haende: punkt(kopf, 0, M.kopfH * 0.6, M.kopfT / 2 + 0.12),
    brust: punkt(rumpf, 0, M.rumpfH * 0.75, M.rumpfT / 2),
    ruecken: punkt(rumpf, 0, M.rumpfH * 0.75, -M.rumpfT / 2),
    huefte: punkt(huefte, 0, 0, 0),
    knie: punkt(huefte, 0, -M.oberschenkel, 0.2),
    hand_l: aL.mitte, hand_r: aR.mitte,
    fuss_l: bL.sohle, fuss_r: bR.sohle,
    fuss: punkt(gruppe, 0, 0, 0),
  };

  // ---------- Zustand, Grundpose, Nachlauf (Hand-IK) ----------
  const ausgang = Object.values(gelenke).map((g) => [g, g.position.clone(), g.quaternion.clone()]);
  const rumpfScale = rumpfMesh.scale.clone();
  const zustand = {};
  let gesichtName = 'glatt';
  const fig = {
    gruppe, gelenke, anker, zustand, kopfMesh, rumpfMesh,
    huefteHoehe, beinDicke: M.beinD, masse: M,
    glieder: { arm: [M.oberarm, M.unterarm], bein: [M.oberschenkel, M.unterschenkel] },
    hoehe: huefteHoehe + 0.05 + M.rumpfH + M.hals + M.kopfH,
    gesichter: ['glatt', 'auge', 'june_gross', 'june_mund', 'june_gedehnt', 'june_bricht', 'june_muede', 'june_schlaeft'],
  };

  fig.grundpose = () => {
    for (const [g, p, q] of ausgang) { g.position.copy(p); g.quaternion.copy(q); g.scale.set(1, 1, 1); }
    rumpfMesh.scale.copy(rumpfScale);
    Object.assign(zustand, { weg: 0, spreizL: 0, spreizR: 0, druck: 0, auge: 0, glut: 0, zittern: 0, zitterT: 0 });
    // Grundhaltung: Rumpf minimal vor, Kopf leicht gesenkt, als lausche er
    rumpf.rotation.x = 0.05;
    kopf.rotation.x = 0.06;
  };

  const qTmp = new T.Quaternion(), qKopf = new T.Quaternion(), e = new T.Euler();
  fig.nachlauf = () => {
    const z = zustand;
    const w = glatt01(z.weg);
    kopf.updateWorldMatrix(true, false);
    kopf.getWorldQuaternion(qKopf);
    for (const S of ['L', 'R']) {
      const sx = S === 'L' ? 1 : -1;
      // Handgelenk-Ziel im Kopf-System: vor dem Gesicht (deck) bzw. seitlich gesenkt (weg)
      const deck = new T.Vector3(sx * 0.2, 0.06 - 0.025 * z.druck, M.kopfT / 2 + 0.085 - 0.025 * z.druck);
      // Teil 3 (Satz 46): die riesigen Hände zittern (zustand.zittern, Phase aus der Episodenzeit)
      if (z.zittern > 0) {
        const ph = z.zitterT * 2 * Math.PI;
        deck.x += z.zittern * 0.022 * Math.sin(ph * 11 + sx);
        deck.y += z.zittern * 0.018 * Math.sin(ph * 13.7 + 2 * sx);
        deck.z += z.zittern * 0.012 * Math.sin(ph * 9.3);
      }
      const weg = new T.Vector3(sx * 1.0, -0.95, 0.55);
      const ziel = kopf.localToWorld(deck.lerp(weg, w));
      // Pol nach außen und etwas nach oben: Ellbogen auf Kopfhöhe, Arme und Hände bilden die Raute
      // params.ellbogen_pol: Review Teil 2 – hochgestellte Ellbogen lasen sich in der Totalen als Strecken
      // oder Jubeln. Gesenkt und nach vorn ist es die Haltung beim Zählen im Versteckspiel.
      const pol = params.ellbogen_pol ?? [1, 0.32, -0.25];
      zweiGlied(fig, S, ziel, 1, { pol: [pol[0], pol[1] - 0.8 * w, pol[2]] });
      // Ausrichtung: Handflächen zum Gesicht, Finger leicht nach innen geneigt; gesenkt nach außen gedreht
      e.set(0, sx * 1.5 * w, sx * 0.06 * (1 - w) - sx * 0.55 * w);
      qTmp.setFromEuler(e);
      richteAus(gelenke[`hand${S}`], qKopf.clone().multiply(qTmp), 1);
      // Finger: geschlossen, fester gedrückt, Spalt zwischen Mittel- und Ringfinger, gespreizt beim Senken
      const spreiz = S === 'L' ? z.spreizL : z.spreizR;
      fingerGelenke[S].forEach(({ kette }, i) => {
        const innen = -sx; // Richtung zur Kopfmitte
        // rotation.z positiv kippt die Fingerspitze nach −x. Innere Finger kippen zur Mitte.
        // gefächert statt parallel (Review Folge 1: die Hände lasen sich wie ein Kamm oder eine Krone)
        let rz = -(i - 1.5) * 0.075 * sx * (1 - 0.5 * z.druck);
        if (i === 1) rz += -innen * 0.15 * spreiz; // Mittelfinger zur Mitte
        if (i === 2) rz += innen * 0.15 * spreiz; // Ringfinger nach außen
        rz += -(i - 1.5) * 0.22 * sx * w;
        // Glieder zum Gesicht gekrümmt: die Finger umgreifen Stirn und Schädel
        kette[0].rotation.set(-0.16 - 0.12 * z.druck - 0.25 * w, 0, rz);
        kette[1].rotation.set(-0.3 - 0.22 * z.druck - 0.3 * w, 0, 0);
        kette[2].rotation.set(-0.34 - 0.25 * z.druck - 0.3 * w, 0, 0);
      });
    }
    const offen = Math.max(z.auge, gesichtName === 'auge' ? 1 : 0);
    augeGruppe.visible = offen > 0.01;
    augeGruppe.scale.set(1, Math.max(0.01, offen), 1);
    // Grundglut (Review Folge 1): Auch ohne Zählen dringt ein schwaches kaltes Licht durch die
    // Fingerspalten. Nur beim glatten Gesicht, sonst verdeckt die Platte die Gesichter aus Teil 4.
    const grund = gesichtName === 'glatt' || gesichtName === 'auge' ? grundglut : 0;
    const gl = Math.max(z.glut, grund);
    glutMat.emissiveIntensity = 2.2 * gl;
    glut.visible = gl > 0.001;
  };

  fig.setzeGesicht = (name) => {
    // zusammengesetzte Namen (Mundformen) nur für Junes Gesichter: "june_gedehnt/reden_a"
    if (!fig.gesichter.includes(name) && !(JUNE_DEHN[name.split('/')[0]] && name.includes('/'))) throw new Error(`Mister Hundred: Gesicht "${name}" unbekannt (${fig.gesichter.join(', ')})`);
    gesichtName = name;
    gesichtMat.map = karte(name === 'auge' ? 'glatt' : name);
    fig.nachlauf();
  };

  // Atmen: sehr langsam und flach; der Mantelsaum bewegt sich im Wind (Satz 2: "nur der Mantelsaum").
  fig.atmen = (t, staerke = 1, seed = 0) => {
    const phase = (seed % 1000) / 159.2;
    const s = Math.sin((2 * Math.PI * t) / 6.2 + phase) * staerke;
    rumpfMesh.scale.x *= 1 + 0.006 * s;
    kopf.position.y += 0.012 * s;
    for (const { zunge, i } of saumTeile) {
      const wind = Math.sin(t * 1.9 + i * 1.7) * 0.5 + Math.sin(t * 3.1 + i * 0.6) * 0.3 + Math.sin(t * 0.7 + i) * 0.4;
      zunge.rotation.x += 0.09 * wind * staerke;
      zunge.rotation.z += 0.04 * Math.sin(t * 2.3 + i * 2.1) * staerke;
    }
    fig.nachlauf();
  };

  // ---------- Eigene Animationen (haben Vorrang vor engine/animationen/) ----------
  const mischen = (a, b, p) => a + (b - a) * p;
  fig.animationen = {
    // Zählen bis hundert: je Zahl ein Puls (Kopf nickt, Finger drücken, kaltes Leuchten).
    // params: takt (s je Zahl, Std 0.85 = "slow and deep"), staerke (Std 1)
    zaehlen: {
      dauer: 4, ease: 'linear',
      anwenden(f, p, prm, c) {
        const takt = prm.takt ?? 0.85, st = prm.staerke ?? 1;
        const u = c.tLokal / takt;
        const k = u - Math.floor(u); // Phase innerhalb der Zahl
        const puls = (k < 0.12 ? k / 0.12 : Math.exp(-(k - 0.12) / 0.22)) * (c.tLokal < c.dauer ? 1 : 0);
        f.zustand.glut = Math.max(f.zustand.glut, puls * st);
        f.zustand.druck = Math.max(f.zustand.druck, 0.35 * puls * st);
        f.gelenke.kopf.rotation.x += 0.05 * puls * st;
        f.gelenke.rumpf.rotation.x += 0.015 * puls * st;
      },
    },
    // Glühen mit etwa 5 Hz bei Geräuschwörtern (Spec 1.5). params: frequenz (5), staerke (1)
    glimmen: {
      dauer: 0.8, ease: 'linear',
      anwenden(f, p, prm, c) {
        if (c.tLokal >= c.dauer) return;
        const v = 0.5 + 0.5 * Math.sin(2 * Math.PI * (prm.frequenz ?? 5) * c.tLokal);
        f.zustand.glut = Math.max(f.zustand.glut, v * (prm.staerke ?? 1) * Math.sin(Math.PI * c.roh));
      },
    },
    // Kaltes Licht bricht hinter den Händen hervor und bleibt (Satz 7, "takes its hands away":
    // das Gesicht wird nie gezeigt, nur das Licht). params: staerke (Std 1.6)
    leuchten: {
      dauer: 0.4, ease: 'ease_in',
      anwenden(f, p, prm) { f.zustand.glut = Math.max(f.zustand.glut, (prm.staerke ?? 1.6) * p); },
    },
    // Späht durch die Finger: Spalt öffnet sich, dahinter das bernsteinfarbene Auge (Satz 36).
    spaehen: {
      dauer: 0.3, ease: 'ease_out',
      anwenden(f, p, prm) {
        const S = (prm.seite ?? 'r').toUpperCase();
        f.zustand[`spreiz${S}`] = mischen(f.zustand[`spreiz${S}`], prm.staerke ?? 1, p);
        f.zustand.auge = mischen(f.zustand.auge, 1, Math.min(1, p * 1.3));
      },
    },
    // Finger spreizen ohne Auge (Spec: 0,3 s). params: seite 'r' | 'l' | 'beide', staerke
    finger_spreizen: {
      dauer: 0.3, ease: 'ease_out',
      anwenden(f, p, prm) {
        const seiten = (prm.seite ?? 'r') === 'beide' ? ['L', 'R'] : [(prm.seite ?? 'r').toUpperCase()];
        for (const S of seiten) f.zustand[`spreiz${S}`] = mischen(f.zustand[`spreiz${S}`], prm.staerke ?? 1, p);
      },
    },
    // Finger schließen sich fester (Satz 3 "keeps both hands over its face"). 0,4 s.
    finger_schliessen: {
      dauer: 0.4, ease: 'ease_in_out',
      anwenden(f, p, prm) {
        f.zustand.druck = mischen(f.zustand.druck, prm.staerke ?? 1, p);
        f.zustand.spreizL = mischen(f.zustand.spreizL, 0, p);
        f.zustand.spreizR = mischen(f.zustand.spreizR, 0, p);
      },
    },
    // Kopf schief legen wie fragend ("Ready?"), 0,4 s. params: winkel (Grad, Std 24; + = zur linken Schulter)
    kopf_schief: {
      dauer: 0.4, ease: 'ease_in_out',
      anwenden(f, p, prm, c) {
        const k = f.gelenke.kopf;
        k.rotation.z = mischen(k.rotation.z, (prm.winkel ?? 24) * c.GRAD, p);
        k.rotation.x = mischen(k.rotation.x, k.rotation.x + 0.08, p);
      },
    },
    // Hände vom Gesicht nehmen (findet jemanden). Spec: nur von hinten zeigen, harter Schnitt vorher.
    haende_weg: {
      dauer: 0.6, ease: 'ease_in_out',
      anwenden(f, p, prm) { f.zustand.weg = mischen(f.zustand.weg, prm.staerke ?? 1, p); },
    },
    haende_vor: {
      dauer: 0.6, ease: 'ease_in_out',
      anwenden(f, p) { f.zustand.weg = mischen(f.zustand.weg, 0, p); },
    },
    // Teil 3 (Satz 46): Die Hände zittern während der Dauer (an- und abschwellend). params: staerke (Std 1)
    zittern: {
      dauer: 0.8, ease: 'linear',
      anwenden(f, p, prm, c) {
        if (c.tLokal >= c.dauer) return;
        f.zustand.zittern = Math.max(f.zustand.zittern, (prm.staerke ?? 1) * Math.sin(Math.PI * c.roh));
        f.zustand.zitterT = c.t;
      },
    },
    // Teil 3 (Satz 39–52): kopfüber durch die Luke in den Kriechkeller. Die ganze Figur kippt um ihre Füße
    // (Reihenfolge YXZ wie bei „liegen“): neigung 180 = senkrecht kopfüber, 135 = schräg. nicken dreht den Kopf
    // (negativ = in den Nacken), damit das Gesicht nach unten zu Eli schaut; die Hände folgen dem Kopf.
    // Als Pose oder als Aktion (Baustein P2: faltet sich herein). params: neigung (Std 150), nicken (Std −30),
    // senken (m, die Füße sinken mit, Std 0)
    kopfueber: {
      dauer: 1.2, ease: 'ease_in_out',
      anwenden(f, p, prm, c) {
        const g = f.gruppe;
        g.rotation.order = 'YXZ';
        g.rotation.x = mischen(g.rotation.x, (prm.neigung ?? 150) * c.GRAD, p);
        g.position.y -= (prm.senken ?? 0) * p;
        f.gelenke.kopf.rotation.x = mischen(f.gelenke.kopf.rotation.x, (prm.nicken ?? -30) * c.GRAD, p);
      },
    },
    // Vorbeugen 60–70° gleichmäßig über die Einstellung (Spec 1.5, ~1,4 s). Die Hände bleiben vor dem Gesicht.
    // params: winkel (Std 65), kopf_ausgleich (Std 20), knie (Std 8: Knie geben etwas nach)
    vorbeugen: {
      dauer: 1.4, ease: 'linear',
      anwenden(f, p, prm, c) {
        const G = f.gelenke;
        G.rumpf.rotation.x = mischen(G.rumpf.rotation.x, (prm.winkel ?? 65) * c.GRAD, p);
        G.kopf.rotation.x = mischen(G.kopf.rotation.x, -(prm.kopf_ausgleich ?? 20) * c.GRAD, p);
        const knie = (prm.knie ?? 8) * c.GRAD;
        G.beinL.rotation.x = mischen(G.beinL.rotation.x, -knie * 0.5, p);
        G.beinR.rotation.x = mischen(G.beinR.rotation.x, -knie * 0.5, p);
        G.unterbeinL.rotation.x = mischen(G.unterbeinL.rotation.x, knie, p);
        G.unterbeinR.rotation.x = mischen(G.unterbeinR.rotation.x, knie, p);
        G.huefte.position.y -= (1 - Math.cos(knie)) * M.oberschenkel * p;
        G.huefte.position.z -= Math.sin((prm.winkel ?? 65) * c.GRAD) * 0.25 * p; // Gewicht nach hinten
      },
    },
    // Stapfen: langsam und schwer, Körper sackt bei jedem Auftritt ein (Spec 2.2).
    // params: nach ([x,z] | Anker), von, schritt (s je Schritt, Std 0.9), schwung (Grad, Std 13),
    //         halt_im_schritt (true: endet mitten im Schritt, ein Fuß vorn – Satz 7)
    stapfen: null, // unten gesetzt (auch als "gehen")
  };
  fig.animationen.stapfen = {
    dauer: 3.6, ease: 'linear',
    anwenden(f, p, prm, c) {
      const g = f.gruppe, G = f.gelenke;
      const ziel = Array.isArray(prm.nach) ? { x: prm.nach[0], z: prm.nach[prm.nach.length - 1] }
        : prm.nach ? (() => { const v = c.zielPunkt(prm.nach); return { x: v.x, z: v.z }; })() : null;
      const von = prm.von ? { x: prm.von[0], z: prm.von[1] } : { x: g.position.x, z: g.position.z };
      const schritt = prm.schritt ?? 0.9;
      const halt = !!prm.halt_im_schritt;
      if (ziel) {
        g.position.x = mischen(von.x, ziel.x, p);
        g.position.z = mischen(von.z, ziel.z, p);
        if (prm.drehen !== false && (ziel.x !== von.x || ziel.z !== von.z)) {
          g.rotation.y = c.mischeWinkel(g.rotation.y, Math.atan2(ziel.x - von.x, ziel.z - von.z), Math.min(1, c.tLokal / 0.4));
        }
      }
      const anteil = halt ? Math.min(1, c.tLokal / 0.3) : Math.min(1, c.tLokal / 0.3, Math.max(0, c.dauer - c.tLokal) / 0.4);
      const amp = anteil * (prm.schwung ?? 13) * c.GRAD;
      const phase = (c.tLokal / schritt) * Math.PI;
      const s = Math.sin(phase);
      G.beinL.rotation.x += s * amp;
      G.beinR.rotation.x -= s * amp;
      G.unterbeinL.rotation.x += Math.max(0, -s) * amp * 1.3;
      G.unterbeinR.rotation.x += Math.max(0, s) * amp * 1.3;
      // schwer: beim Auftreten sackt die Hüfte ab, der Körper wiegt seitlich
      const auftritt = Math.pow(Math.abs(Math.cos(phase)), 6);
      G.huefte.position.y -= 0.07 * auftritt * anteil;
      G.huefte.rotation.z += 0.025 * s * anteil;
      G.rumpf.rotation.z -= 0.02 * s * anteil;
      G.kopf.rotation.x += 0.03 * auftritt * anteil;
    },
  };
  fig.animationen.gehen = fig.animationen.stapfen;

  fig.grundpose();
  fig.nachlauf();
  const s = params.groesse ?? 1;
  if (s !== 1) { gruppe.scale.setScalar(s); fig.hoehe *= s; }
  return fig;
}
