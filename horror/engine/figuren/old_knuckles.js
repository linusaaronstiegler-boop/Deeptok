// Old Knuckles: das Wesen unter dem Eis (Rules of Kindly Folge 1, Bibel §5, §10.2, §10.7). Eigene Figur.
// Eine gestreckte, bleiche Gestalt liegt rücklings unter dem Eis, etwa 7 m lang (länger als eine Fischerhütte),
// die Arme nach oben gebeugt, zwei Faustklötze mit je vier Knöchelwürfeln drücken von unten gegen das Eis.
// Das flache Gesicht ist ein tauschbarer Aufkleber: glatt (sein eigenes, fast leer) oder das Gesicht dessen, den
// es kopiert (Lund, Bear, Gus, ein Fischer) – neutral, Augen offen, normale Hautfarbe: eine Kopie, keine
// Wasserleiche (Bibel §6, erste 7 s). Kaltes Kantenlicht #9FD8D2 löst die Haut vom Wasser.
//
// Lage: Ursprung = Mitte des Körpers (Set see: Anker "see.wesen", blick 0). Die Figur liegt fertig gebaut auf dem
// Rücken: Gesicht nach oben (+y), Kopf nach −z, Füße nach +z. Kameras aus Süden sehen den Kopf oben im Bild.
// Die Fäuste reichen immer bis unter das Eis: Der Unterarm wird je Bild so lang, dass die Knöchel bei
// params.eis_y (Weltkoordinate der Eis-Unterseite, Std −0,02) liegen, egal wie tief der Körper liegt. So kann eine
// Einstellung das Wesen tiefer legen (Untersicht: bleicher Körper, die Arme lang nach oben, S1, S10–11) und eine
// andere flacher (Gesicht dicht unter dem Eis, S13–15) – per stellung.position am Schnitt.
//
// params: groesse (Std 1), eis_y (Std −0,02), kopf_hoehe (Std 0: Kopf in Ruhe; > 0 hebt ihn dauerhaft),
//         haut (Std '#b9beb5'), kante (Std 0,75: Stärke des Kantenlichts), leuchten (Std 0,35: Eigenleuchten des Gesichts)
// Gesichter: glatt (Std), lund, bear, gus, fischer; mit Lippenformen zusammengesetzt, z. B. "bear/lippen_u".
// Eigene Animationen:
//   klopfen_unten  Std 1,2 s: die Fäuste holen aus und schlagen dreimal von unten gegen das Eis (S1, S31, S54).
//                  params: schlaege (3), seite ("beide" | "l" | "r"), tiefe (Std 0,22 m). Aufprall k bei (k + 0,75) / n.
//   andruecken     Std 0,8 s: der Kopf steigt und drückt das Gesicht von unten flach ans Eis (S13–15, S34–35, S58–60).
//                  params: hoehe (Std: bis das Gesicht 1 cm unter dem Eis liegt), halten (Std true)
//   sinken         Std 1,0 s: Kopf und Fäuste sinken zurück (nach andruecken / klopfen)
//   lippen_gus     Std 0,8 s: die Lippen formen stumm „Gus“ (g – u – s – zu), S61–62. Mit Gesicht "bear".
// Anker: kopf, gesicht, mund, augen, ueber_kopf (über dem Scheitel, Richtung −z), brust, huefte, knie, haende,
//        hand_l, hand_r, faust_l, faust_r, fuss_l, fuss_r, fuss, mitte
import * as THREE from 'three';
import { rundeKiste, trapezKiste } from '../src/klotzfigur.js';
import { zeichneGesicht } from '../src/gesichter.js';

// Gesichtsstile der Kopien (Hautton und Augen wie die Figurenmodule; Haare, Bart und Schnurrbart werden auf
// den flachen Aufkleber gemalt, weil das Wesen keine Haar-Klötze hat)
const STILE = {
  lund: { stil: { haut: '#E3BFA0', iris: '#3a4a5a', brauen: '#b8b3aa', falten: true, augenGroesse: 0.9, augenHoehe: 0.5, mundHoehe: 0.8 }, extra: 'schnurrbart' },
  bear: { stil: { haut: '#E6C3A0', iris: '#3A2618', brauen: '#2E2018', augenHoehe: 0.52, mundHoehe: 0.78 }, extra: 'pony' },
  gus: { stil: { haut: '#DDB592', iris: '#2c1d14', brauen: '#4a3020', augenHoehe: 0.48, mundHoehe: 0.7, augenGroesse: 0.94 }, extra: 'bart' },
  fischer: { stil: { haut: '#E3BC98', iris: '#2e2016', brauen: '#3a2a1e', augenHoehe: 0.5, mundHoehe: 0.78 }, extra: 'muetze' },
};

function zeichneZusatz(g, w, h, art) {
  if (art === 'schnurrbart') {
    g.fillStyle = '#A9A49C';
    g.beginPath(); g.roundRect(w * 0.3, h * 0.66, w * 0.4, h * 0.07, h * 0.03); g.fill();
    g.fillRect(w * 0.27, h * 0.68, w * 0.05, h * 0.07); g.fillRect(w * 0.68, h * 0.68, w * 0.05, h * 0.07);
    // grauer Haarkranz an den Schläfen
    g.fillStyle = '#C9C5BD'; g.fillRect(0, h * 0.18, w * 0.05, h * 0.3); g.fillRect(w * 0.95, h * 0.18, w * 0.05, h * 0.3);
  } else if (art === 'pony') {
    g.fillStyle = '#4E3726';
    g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(w, h * 0.12);
    for (let i = 10; i >= 0; i--) g.lineTo((w * i) / 10, h * (0.13 + 0.05 * ((i * 7) % 3) / 2 + (i > 6 ? 0.03 : 0)));
    g.closePath(); g.fill();
  } else if (art === 'bart') {
    g.fillStyle = '#8A5634';
    g.beginPath(); g.moveTo(w * 0.04, h * 0.5); g.lineTo(w * 0.12, h * 0.98); g.lineTo(w * 0.88, h * 0.98); g.lineTo(w * 0.96, h * 0.5);
    g.lineTo(w * 0.8, h * 0.62); g.lineTo(w * 0.62, h * 0.66); g.lineTo(w * 0.62, h * 0.78); g.lineTo(w * 0.38, h * 0.78); g.lineTo(w * 0.38, h * 0.66); g.lineTo(w * 0.2, h * 0.62); g.closePath(); g.fill();
  } else if (art === 'muetze') {
    g.fillStyle = '#2f5f73'; g.fillRect(0, 0, w, h * 0.12);
  }
}

export default async function baue(ctx, params = {}) {
  const T = THREE;
  const kanteStaerke = params.kante ?? 0.75;
  // bleiche Haut mit feiner, kalter Fleckung (kein Plastik), Kantenlicht türkis wie das Leitlicht der Serie
  const hautTex = ctx.zeichenTextur((g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    const z = ctx.zufall('haut');
    for (let i = 0; i < 260; i++) {
      const x = z() * w, y = z() * h, r = 3 + z() * 10;
      g.fillStyle = `rgba(${z() < 0.5 ? '90,120,125' : '150,140,130'},${0.015 + z() * 0.03})`;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
  }, 128, 128);
  hautTex.wrapS = hautTex.wrapT = T.RepeatWrapping;
  hautTex.repeat.set(2, 2);
  // bleich, aber nicht weiß (REVIEW-Lehre): grau-grünliches Hautgrau, schwach selbstleuchtend, damit der Körper
  // unter dem Eis auch bei Nacht als heller Umriss zu lesen ist
  const haut = ctx.mat(params.haut ?? '#b9beb5', { rauheit: 0.62, karte: hautTex, leuchten: '#5d6b68', leuchtStaerke: 0.25, kante: { farbe: '#9FD8D2', staerke: kanteStaerke, exponent: 2.2 } });
  const haut2 = ctx.mat('#a4aba3', { rauheit: 0.7, karte: hautTex, leuchten: '#4f5c5a', leuchtStaerke: 0.25, kante: { farbe: '#9FD8D2', staerke: kanteStaerke, exponent: 2.2 } });

  const gruppe = new T.Group();
  const koerper = new T.Group();          // alles, was beim Klopfen mitruckt
  gruppe.add(koerper);
  const box = (b, h, t, m, x, y, z, r = 0.05, eltern = koerper) => { const k = rundeKiste(b, h, t, m, r); k.position.set(x, y, z); eltern.add(k); return k; };

  // ---------- Rumpf, Becken, Beine (liegend: Länge entlang z, Dicke entlang y) ----------
  const rumpf = trapezKiste(1.4, 0.95, 2.3, 0.62, haut, 0.14);   // Trapez in seiner x-y-Ebene: oben = Schultern
  rumpf.rotation.x = -Math.PI / 2;                                  // y (Länge) → −z (Schultern zum Kopf)
  rumpf.position.set(0, 0, -1.35);
  koerper.add(rumpf);
  box(0.95, 0.56, 0.5, haut2, 0, -0.01, -0.02, 0.12);             // Becken
  const beine = [];
  for (const sx of [-1, 1]) {
    const bein = new T.Group();
    bein.position.set(sx * 0.25, 0, 0.15);
    koerper.add(bein);
    box(0.34, 0.34, 1.4, haut, 0, 0, 0.7, 0.08, bein);            // Oberschenkel
    box(0.29, 0.29, 1.4, haut2, 0, -0.01, 2.08, 0.07, bein);      // Unterschenkel
    box(0.3, 0.42, 0.2, haut, 0, 0.14, 2.86, 0.07, bein);         // Fuß, Zehen nach oben
    const fuss = new T.Object3D(); fuss.position.set(0, 0.12, 2.9); bein.add(fuss);
    const knie = new T.Object3D(); knie.position.set(0, 0.12, 1.4); bein.add(knie);
    beine.push({ fuss, knie });
  }

  // ---------- Hals und Kopf; das Gesicht liegt oben (+y), Scheitel nach −z ----------
  const hals = new T.Group();
  hals.position.set(0, 0.0, -2.5);
  koerper.add(hals);
  box(0.32, 0.3, 0.55, haut2, 0, 0, -0.2, 0.07, hals);
  const kopf = new T.Group();
  kopf.position.set(0, 0.04, -0.62);
  hals.add(kopf);
  const KB = 0.66, KT = 0.5, KL = 0.7;                            // Breite, Dicke, Länge (Scheitel–Kinn)
  box(KB, KT, KL, haut, 0, 0, 0, 0.11, kopf);
  // flaches Gesicht als Aufkleber auf der Oberseite: Textur-Oben (v = 1) zeigt nach −z (Scheitel)
  const gb = KB - 0.16, gh = KL - 0.16;
  const karten = new Map();
  const faceW = 512, faceH = Math.round(512 * gh / gb);
  const karte = (name) => {
    if (!karten.has(name)) {
      karten.set(name, ctx.zeichenTextur((g, w, h) => {
        const [basis, ...mund] = name.split('/');
        if (basis === 'glatt') {
          // sein eigenes Gesicht: fast leer, zwei flache Mulden statt Augen, ein Strich als Mund
          g.fillStyle = '#d2d6ce'; g.fillRect(0, 0, w, h);
          g.fillStyle = 'rgba(70,95,100,0.22)';
          for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(w * (0.5 + sx * 0.19), h * 0.48, w * 0.07, h * 0.05, 0, 0, Math.PI * 2); g.fill(); }
          g.strokeStyle = 'rgba(70,95,100,0.35)'; g.lineWidth = w * 0.012;
          g.beginPath(); g.moveTo(w * 0.4, h * 0.76); g.lineTo(w * 0.6, h * 0.76); g.stroke();
          return;
        }
        const s = STILE[basis];
        if (!s) throw new Error(`old_knuckles: Gesicht "${name}" unbekannt (glatt, ${Object.keys(STILE).join(', ')})`);
        const miene = mund.length ? `neutral/${mund.join('/')}` : 'neutral';
        zeichneGesicht(g, w, h, miene, s.stil);
        zeichneZusatz(g, w, h, s.extra);
      }, faceW, faceH));
    }
    return karten.get(name);
  };
  // Das Gesicht leuchtet schwach aus sich (params.leuchten, Std 0,35): durch klares Eis über dunklem Wasser war es bei
  // Nacht sonst nicht zu sehen. Farben bleiben normal (keine Wasserleiche).
  const gesichtMat = new T.MeshStandardMaterial({ map: karte('glatt'), roughness: 0.66, emissive: new T.Color('#ffffff'), emissiveMap: karte('glatt'), emissiveIntensity: params.leuchten ?? 0.35 });
  const gesicht = new T.Mesh(new T.PlaneGeometry(gb, gh), gesichtMat);
  gesicht.rotation.x = -Math.PI / 2;
  gesicht.position.set(0, KT / 2 + 0.003, 0);
  gesicht.receiveShadow = true;
  kopf.add(gesicht);
  const punkt = (eltern, x, y, z) => { const o = new T.Object3D(); o.position.set(x, y, z); eltern.add(o); return o; };
  // Lage im Gesicht: Augen bei 50 % (von oben = −z), Mund bei 78 %
  const ankerKopf = {
    kopf: punkt(kopf, 0, 0, 0),
    gesicht: punkt(kopf, 0, KT / 2 + 0.01, 0),
    augen: punkt(kopf, 0, KT / 2 + 0.01, -gh / 2 + gh * 0.5),
    mund: punkt(kopf, 0, KT / 2 + 0.02, -gh / 2 + gh * 0.78),
    ueber_kopf: punkt(kopf, 0, KT / 2, -KL / 2 - 0.3),
  };

  // ---------- Arme: Oberarm schräg nach außen-oben, Unterarm senkrecht, Faustklotz mit vier Knöcheln ----------
  const eisY = params.eis_y ?? -0.02;
  const faustHoehe = 0.53;                              // Bau-Maß (Ruhe-Reichweite), je Bild angepasst
  const arme = {};
  for (const [S, sx] of [['L', 1], ['R', -1]]) {
    const schulter = new T.Group();
    schulter.position.set(sx * 0.7, 0.05, -2.25);
    koerper.add(schulter);
    const ober = box(0.3, 0.44, 0.3, haut, sx * 0.12, 0.17, 0.05, 0.08, schulter);
    ober.rotation.z = -sx * 0.55;
    const unter = new T.Group();                        // Unterarm + Faust: beim Klopfen bewegt sich diese Gruppe
    unter.position.set(sx * 0.28, 0, 0.12);
    schulter.add(unter);
    const faustY = faustHoehe - 0.05 - 0.185;           // Mitte des Faustklotzes: Knöchel-Oberkante = faust_hoehe
    // Unterarm als Säule mit Länge 1 (je Bild auf die nötige Länge skaliert)
    const saeule = new T.Group(); unter.add(saeule);
    box(0.27, 1, 0.27, haut2, 0, 0.5, 0, 0.06, saeule);
    saeule.position.y = 0.02;
    const faust = new T.Group();
    faust.position.set(0, faustY, 0);
    unter.add(faust);
    box(0.46, 0.27, 0.38, haut, 0, 0, 0, 0.07, faust);
    // vier Knöchelwürfel oben in einer Reihe quer zur Faust (das Erkennungsmerkmal von unten)
    for (let i = 0; i < 4; i++) box(0.095, 0.075, 0.12, haut2, (i - 1.5) * 0.106, 0.15, -0.07, 0.02, faust);
    // Daumen seitlich zur Körpermitte
    box(0.12, 0.15, 0.13, haut2, -sx * 0.25, 0.02, 0.07, 0.035, faust);
    const oben = punkt(faust, 0, 0.18, 0);
    arme[S] = { schulter, unter, faust, oben, saeule };
  }
  const anker = {
    ...ankerKopf,
    brust: punkt(koerper, 0, 0.24, -1.7),
    huefte: punkt(koerper, 0, 0.22, 0),
    knie: beine[0].knie,
    hand_l: arme.L.oben, hand_r: arme.R.oben, faust_l: arme.L.faust, faust_r: arme.R.faust,
    haende: punkt(koerper, 0, 0.5, -2.12),
    fuss_l: beine[0].fuss, fuss_r: beine[1].fuss,
    fuss: punkt(koerper, 0, 0.12, 2.95),
    mitte: punkt(koerper, 0, 0, 0),
  };

  // Grundhöhe des Kopfes: Gesicht liegt etwa 0,27 m tiefer als die Knöchel; andruecken hebt es bis unters Eis
  const kopfRuhe = params.kopf_hoehe ?? 0;
  const gesichtY0 = 0.04 + KT / 2;                      // Gesicht über dem Ursprung in Ruhe
  const zustand = { mund: null };
  let gesichtName = 'glatt';
  const fig = {
    gruppe, anker, hoehe: 0.8,
    gelenke: { koerper, hals, kopf, schulterL: arme.L.schulter, schulterR: arme.R.schulter, unterarmL: arme.L.unter, unterarmR: arme.R.unter },
    gesichter: ['glatt', ...Object.keys(STILE)],
    zustand,
    grundpose() {
      koerper.position.set(0, 0, 0); koerper.rotation.set(0, 0, 0);
      hals.position.set(0, 0, -2.5); hals.rotation.set(0, 0, 0);
      kopf.position.set(0, 0.04 + kopfRuhe, -0.62); kopf.rotation.set(0, 0, 0); kopf.scale.set(1, 1, 1);
      for (const a of Object.values(arme)) { a.unter.position.y = 0; a.schulter.rotation.set(0, 0, 0); a.faust.position.y = faustHoehe - 0.235; }
      zustand.mund = null;
    },
    setzeGesicht(name) {
      gesichtName = name;
      const voll = zustand.mund && !name.includes('/') ? `${name}/${zustand.mund}` : name;
      const k = karte(name === 'glatt' ? 'glatt' : voll);
      if (gesichtMat.map !== k) { gesichtMat.map = k; gesichtMat.emissiveMap = k; gesichtMat.needsUpdate = true; }
    },
    // Nachlauf je Bild (welt.js): Unterarme so lang, dass die Knöchel an der Eis-Unterseite liegen; das Klopfen
    // (unter.position.y < 0) zieht die Fäuste davon weg nach unten
    aktualisiere() {
      gruppe.updateMatrixWorld(true);
      const s = gruppe.scale.y || 1;
      for (const a of Object.values(arme)) {
        const schulterY = a.schulter.getWorldPosition(new T.Vector3()).y;
        const reich = Math.max(0.12, (eisY - schulterY) / s - 0.185);      // Faustmitte über der Schulter
        a.faust.position.y = reich;
        a.saeule.scale.y = Math.max(0.05, reich - 0.07);
      }
      anker.haende.position.y = 0.05 + arme.L.faust.position.y + arme.L.unter.position.y;
    },
    // leises Atmen unter Wasser: der Brustkorb hebt sich kaum (nur damit nichts eingefroren wirkt)
    atmen(t, staerke = 1) { koerper.position.y += 0.01 * Math.sin((2 * Math.PI * t) / 5.5) * staerke; },
    animationen: {
      klopfen_unten: {
        dauer: 1.2, ease: 'linear',
        anwenden(f, p, prm, c) {
          const n = prm.schlaege ?? 3;
          const x = Math.min(0.9999, c.roh) * n;
          const fr = x - Math.floor(x);
          // ausholen (0–60 %: Fäuste sinken), zuschlagen (60–75 %), am Eis (75–100 %)
          const h = fr < 0.6 ? Math.sin((Math.PI / 2) * (fr / 0.6)) : fr < 0.75 ? Math.cos((Math.PI / 2) * ((fr - 0.6) / 0.15)) : 0;
          const tiefe = prm.tiefe ?? 0.22;
          const seiten = (prm.seite ?? 'beide') === 'beide' ? ['L', 'R'] : [prm.seite.toUpperCase()];
          for (const S of seiten) { arme[S].unter.position.y -= tiefe * h; arme[S].schulter.rotation.x += 0.08 * h; }
          // Aufprall: der ganze Körper ruckt kurz mit
          const stoss = fr >= 0.75 && fr < 0.85 ? Math.sin(Math.PI * (fr - 0.75) / 0.1) : 0;
          koerper.position.y += 0.025 * stoss;
        },
      },
      andruecken: {
        dauer: 0.8, ease: 'ease_in_out',
        anwenden(f, p, prm, c) {
          // Ziel: Gesicht 1 cm unter dem Eis (eis_y); gerechnet aus der Lage der Figur in der Welt
          const s = gruppe.scale.y || 1;
          const basisY = gruppe.getWorldPosition(new T.Vector3()).y + koerper.position.y * s;
          const hub = prm.hoehe ?? ((eisY - 0.01 - basisY) / s - gesichtY0 - kopfRuhe);
          // Hals hebt sich und kippt den Kopf nach oben; der Kopf bleibt waagerecht (Gesicht parallel zum Eis)
          hals.position.y = c.mischen(hals.position.y, hub * 0.55, p);
          hals.rotation.x = c.mischen(hals.rotation.x, Math.atan2(hub * 0.45, 0.62), p);
          kopf.rotation.x = -hals.rotation.x;
          // am Ende presst sich das Gesicht flach (leicht gestaucht), solange es hält
          if (prm.halten !== false && c.roh > 0.85) kopf.scale.y = 1 - 0.05 * Math.min(1, (c.roh - 0.85) / 0.15);
        },
      },
      sinken: {
        dauer: 1.0, ease: 'ease_in_out',
        anwenden(f, p, prm, c) {
          hals.position.y = c.mischen(hals.position.y, 0, p);
          hals.rotation.x = c.mischen(hals.rotation.x, 0, p);
          kopf.rotation.x = -hals.rotation.x;
          kopf.scale.y = c.mischen(kopf.scale.y, 1, p);
          for (const a of Object.values(arme)) a.unter.position.y = c.mischen(a.unter.position.y, -0.25, p);
        },
      },
      lippen_gus: {
        dauer: 0.8, ease: 'linear',
        anwenden(f, p, prm, c) {
          const u = c.roh;
          zustand.mund = u < 0.25 ? 'lippen_g' : u < 0.6 ? 'lippen_u' : u < 0.9 ? 'lippen_s' : 'lippen_zu';
        },
      },
    },
  };
  void gesichtName;
  gruppe.scale.setScalar(params.groesse ?? 1);
  return fig;
}
