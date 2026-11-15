// Set "marsh_haus": das Haus der Familie Marsh von außen (serie.md, Ort 1, Modul marsh-aussen).
// Gehört zur Hauptstraße (Vorgarten, Zaun und Weg baut "hauptstrasse"); innen: Set "marsh_innen".
// Alle drei Sets mit position [0,0,0] und drehung 0 laden; Maße in src/bauteile.js (MARSH).
// Für Innenaufnahmen dieses Set ausblenden ("set": ["strasse", "haus"]), sonst verdeckt die Außenhülle
// den Innenraum.
//
// Erkennungsmerkmale: salbeigrüne Holzverkleidung, rote Haustür, Veranda mit 3 Stufen und Geländer,
// Elis Fenster oben links (von der Straße aus), Küchenfenster unten links.
// params: verandalicht (Std true: echtes Punktlicht an der Veranda), tuer_als_figur (Std false: Türblatt
//         weglassen, Requisite "tuer" an Anker "tuer_angel" mit blick 90 stellen)
// Lichtgruppen: marsh.veranda (Lampe + Punktlicht), marsh.eli_fenster, marsh.kueche_fenster, marsh.fenster
import * as THREE from 'three';
import { k, verschmelze, baueHaus, fensterLichtMat, MARSH, marshWelt, tmat, busch } from '../src/bauteile.js';

export default async function baue(ctx, params = {}) {
  const T = THREE;
  const gruppe = new T.Group();
  const haus = new T.Group();
  haus.position.set(...MARSH.position);
  haus.rotation.y = (MARSH.drehung * Math.PI) / 180;
  gruppe.add(haus);
  const zier = ctx.mat(MARSH.zier, { rauheit: 0.6 });

  // Lichtgruppen der Fenster (je eigenes Leuchtmaterial)
  const eliLicht = fensterLichtMat(ctx, '#ffc47a', 2.6);
  const kuecheLicht = fensterLichtMat(ctx, '#ffd08a', 2.2);
  const sonstLicht = fensterLichtMat(ctx, '#ffc47a', 2.0);
  const glasDunkel = ctx.mat('#1e2836', { rauheit: 0.2, metall: 0.35 });
  const F = MARSH.fenster;
  const vorn = [];
  const seiten = [];
  for (const [name, f] of Object.entries(F)) {
    const licht = name === 'eli' ? eliLicht : name === 'kueche' || name === 'kueche_seite' ? kuecheLicht : name.startsWith('june') ? glasDunkel : sonstLicht;
    if (f.seite === 'vorn') vorn.push({ x: f.x, etage: f.etage, b: f.b, h: f.h, unten: f.unten, licht });
    else seiten.push({ seite: f.seite, x: f.x, z: f.z, etage: f.etage, b: f.b, h: f.h, unten: f.unten, licht });
  }
  const h = baueHaus(ctx, {
    breite: MARSH.breite, tiefe: MARSH.tiefe, sockel: MARSH.sockel, eg: MARSH.eg, decke: MARSH.decke, og: MARSH.og,
    dach: 'quer', dachNeigung: MARSH.dachNeigung, farbe: MARSH.farbe, zier: MARSH.zier, dachFarbe: MARSH.dachFarbe,
    fenster: vorn, seitenFenster: seiten,
    tuer: { x: MARSH.tuer.x, b: MARSH.tuer.b, h: MARSH.tuer.h, blatt: params.tuer_als_figur ? false : undefined }, tuerFarbe: MARSH.tuerFarbe,
    veranda: { von: MARSH.veranda.von, bis: MARSH.veranda.bis, tiefe: MARSH.veranda.tiefe, stufenX: MARSH.tuer.x, stufenB: 1.4, pfosten: [3.25] },
    laeden: '#3f5446', kaesten: true, schornstein: [-3.2, -6.2], giebelFenster: true, beete: true, zufall: ctx.zufall('beete'),
  });
  haus.add(h.gruppe);

  // Verandaleuchte neben der Tür: Wandlampe (Leuchtmaterial) plus ein Punktlicht
  const lampeMat = ctx.leuchtMat('#ffd9a0', 4);
  const so = MARSH.sockel;
  const lampe = k(haus, 0.16, 0.24, 0.14, lampeMat, MARSH.tuer.x + 0.85, so + 2.0, 0.12, { rund: 0.03, schatten: false });
  lampe.userData.einzeln = true;
  k(haus, 0.2, 0.06, 0.2, ctx.mat('#24262b', { metall: 0.5, rauheit: 0.5 }), MARSH.tuer.x + 0.85, so + 2.15, 0.12);
  const veranda = { lichter: [], materialien: [lampeMat] };
  if (params.verandalicht !== false) {
    const pl = new T.PointLight('#ffb36b', 7, 8, 1.8);
    pl.position.set(MARSH.tuer.x + 0.85, so + 1.9, 0.6);
    haus.add(pl);
    veranda.lichter.push(pl);
  }

  // Veranda-Möbel: zwei Stühle, Pflanzkübel, Fußmatte, Holzbank unter dem Küchenfenster
  const holz = tmat(ctx, '#7a5a3a', 'holz', { rauheit: 0.8 });
  const stuhl = (x, z, dreh) => {
    const g = new T.Group(); g.position.set(x, so, z); g.rotation.y = dreh; haus.add(g);
    k(g, 0.55, 0.06, 0.5, holz, 0, 0.42, 0, { rund: 0.01 });
    for (const sx of [-0.22, 0.22]) for (const sz of [-0.2, 0.2]) k(g, 0.05, 0.42, 0.05, holz, sx, 0.21, sz);
    for (let i = 0; i < 4; i++) k(g, 0.06, 0.55, 0.03, holz, -0.2 + i * 0.13, 0.75, -0.24, { dreh: [-0.15, 0, 0] });
  };
  stuhl(4.2, 1.0, -0.4);
  stuhl(3.6, 1.6, -0.9);
  k(haus, 0.9, 0.02, 0.6, ctx.mat('#5a3a2a', { rauheit: 1 }), MARSH.tuer.x, so + 0.01, 0.5, { schatten: false });
  for (const x of [0.6, 4.6]) {
    k(haus, 0.4, 0.4, 0.4, ctx.mat('#a0583a', { rauheit: 0.8 }), x, so + 0.2, MARSH.veranda.tiefe - 0.45, { rund: 0.04 });
    const kuebel = new T.Group(); kuebel.position.set(x, so + 0.36, MARSH.veranda.tiefe - 0.45); haus.add(kuebel);
    busch(ctx, kuebel, 0, 0, ctx.zufall('pflanze', x), '#4f7a3a', 0.55);
  }
  // Hausnummernschild (ohne Zahl: keine echten Adressen), Fußabtreter
  k(haus, 0.3, 0.2, 0.03, ctx.mat('#2f3e5c'), MARSH.tuer.x - 0.85, so + 2.0, 0.08, { rund: 0.01 });
  void zier;
  verschmelze(haus);

  const W = (x, y, z) => marshWelt(x, y, z);
  return {
    gruppe,
    lichter: {
      veranda,
      eli_fenster: { lichter: [], materialien: [eliLicht] },
      kueche_fenster: { lichter: [], materialien: [kuecheLicht] },
      fenster: { lichter: [], materialien: [sonstLicht] },
    },
    anker: {
      tuer: W(MARSH.tuer.x, so + 1.1, 0.15),
      tuer_angel: W(MARSH.tuer.x - MARSH.tuer.b / 2, so, 0.02),  // Requisite "tuer": position hier, blick 90
      veranda: W(2.6, so, 1.2),
      veranda_schuhe: W(2.8, so, 1.1),    // Satz 25: Dads Stiefel stehen auf der Veranda
      stufen: W(MARSH.tuer.x, 0.3, MARSH.veranda.tiefe + 0.5),
      eli_fenster: W(F.eli.x, so + MARSH.eg + MARSH.decke + F.eli.unten + F.eli.h / 2, 0.1),
      kueche_fenster: W(F.kueche.x, so + F.kueche.unten + F.kueche.h / 2, 0.1),
      garten: W(-1.6, 0, 3.8),            // Vorgarten: Platz für Mister Hundred (Satz 34, 36)
      dachfirst: W(0, 9.2, -MARSH.tiefe / 2),
    },
    kamerapunkte: {
      totale: { pos: W(1.5, 4.5, 21), ziel: W(0, 4.2, -2), fov: 50 },
      halbtotale: { pos: W(3.2, 1.7, 10.5), ziel: W(0.5, 3.0, 0), fov: 46 },
      nah: { pos: W(2.4, 1.7, 4.2), ziel: W(MARSH.tuer.x, so + 1.3, 0.3), fov: 42 },
      detail: { pos: W(2.9, so + 0.75, 2.0), ziel: W(2.8, so + 0.1, 1.1), fov: 34 },
      untersicht: { pos: W(-1.2, 0.4, 5.2), ziel: W(F.eli.x, 5.6, 0), fov: 56 },
      daemmerung: { pos: W(4.5, 2.2, 15), ziel: W(-1.2, 4.6, 0), fov: 48 },    // Satz 34: Haus mit Riese im Garten
    },
  };
}
