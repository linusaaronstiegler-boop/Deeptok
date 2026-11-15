// Standard-Rig für Klötzchenfiguren. Figurenmodule KÖNNEN es benutzen, müssen aber nicht;
// Pflicht ist nur die Schnittstelle (siehe README, "Figurenmodul"). Wer es benutzt, bekommt
// alle gemeinsamen Animationen aus engine/animationen/ ohne Anpassung.
//
// Aufbau (Drehpunkte liegen in den Gelenken):
//   gruppe (Wurzel, Füße auf y=0, schaut nach +z)
//    └ huefte (Höhe = Beinlänge)
//       ├ rumpf ─┬ kopf
//       │        ├ armL (+x = linke Seite der Figur)
//       │        └ armR (−x)
//       ├ beinL
//       └ beinR
// Konventionen: Arme und Beine hängen entlang −y. rotation.x negativ = nach vorn (+z).
// Kopf: rotation.y positiv = zur linken Seite, rotation.x positiv = nach unten nicken.
//
// Proportionen sind frei wählbar und sollen KEIN R6/R15 nachbilden (Plan: andere Proportionen,
// eigene Gesichter, abgerundete Kanten).

import * as THREE from 'three';

export function baueRig(ctx, m) {
  // m: Maße in Metern und Materialien
  //   beinLaenge, beinBreite, beinAbstand, rumpfBreite, rumpfHoehe, rumpfTiefe,
  //   armLaenge, armBreite, schulterAbstand, kopfBreite, kopfHoehe, kopfTiefe, hals,
  //   rund (Kantenradius), mat: { rumpf, arm, bein, kopf, hand? }
  const gruppe = new THREE.Group();
  const huefte = new THREE.Group();
  huefte.position.y = m.beinLaenge;
  gruppe.add(huefte);

  const rumpf = new THREE.Group();
  huefte.add(rumpf);
  const rumpfMesh = ctx.kiste(m.rumpfBreite, m.rumpfHoehe, m.rumpfTiefe, m.mat.rumpf, { rund: m.rund });
  rumpfMesh.position.y = m.rumpfHoehe / 2;
  rumpf.add(rumpfMesh);

  const kopf = new THREE.Group();
  kopf.position.y = m.rumpfHoehe + (m.hals ?? 0.02);
  rumpf.add(kopf);
  const kopfMesh = ctx.kiste(m.kopfBreite, m.kopfHoehe, m.kopfTiefe, m.mat.kopf, { rund: m.rundKopf ?? m.rund * 1.6 });
  kopfMesh.position.y = m.kopfHoehe / 2;
  kopf.add(kopfMesh);

  const glied = (eltern, x, y, laenge, breite, material, name) => {
    const g = new THREE.Group();
    g.name = name;
    g.position.set(x, y, 0);
    eltern.add(g);
    const mesh = ctx.kiste(breite, laenge, breite, material, { rund: m.rund });
    mesh.position.y = -laenge / 2;
    g.add(mesh);
    const ende = new THREE.Object3D();
    ende.position.y = -laenge;
    g.add(ende);
    return { g, ende, mesh };
  };
  const armY = m.rumpfHoehe - m.armBreite * 0.55;
  const aL = glied(rumpf, m.schulterAbstand / 2, armY, m.armLaenge, m.armBreite, m.mat.arm, 'armL');
  const aR = glied(rumpf, -m.schulterAbstand / 2, armY, m.armLaenge, m.armBreite, m.mat.arm, 'armR');
  const bL = glied(huefte, m.beinAbstand / 2, 0, m.beinLaenge, m.beinBreite, m.mat.bein, 'beinL');
  const bR = glied(huefte, -m.beinAbstand / 2, 0, m.beinLaenge, m.beinBreite, m.mat.bein, 'beinR');
  if (m.mat.hand) {
    for (const a of [aL, aR]) {
      const h = ctx.kiste(m.armBreite * 0.92, m.armBreite * 0.7, m.armBreite * 0.92, m.mat.hand, { rund: m.rund });
      h.position.y = -m.armLaenge + m.armBreite * 0.3;
      a.g.add(h);
    }
  }

  // Anker: benannte Punkte, auf die Kamera, Blicke und Partikel zielen.
  const punkt = (eltern, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); eltern.add(o); return o; };
  const anker = {
    kopf: punkt(kopf, 0, m.kopfHoehe * 0.5, 0),
    augen: punkt(kopf, 0, m.kopfHoehe * 0.58, m.kopfTiefe / 2),
    mund: punkt(kopf, 0, m.kopfHoehe * 0.28, m.kopfTiefe / 2 + 0.02),
    ueber_kopf: punkt(kopf, 0, m.kopfHoehe + 0.15, 0),
    brust: punkt(rumpf, 0, m.rumpfHoehe * 0.6, m.rumpfTiefe / 2),
    huefte: punkt(huefte, 0, 0, 0),
    hand_l: aL.ende, hand_r: aR.ende,
    fuss_l: bL.ende, fuss_r: bR.ende,
    fuss: punkt(gruppe, 0, 0, 0),
  };

  const gelenke = { huefte, rumpf, kopf, armL: aL.g, armR: aR.g, beinL: bL.g, beinR: bR.g };

  // Vor jedem Bild: alles auf Ruhe. Arme leicht vom Körper weg, damit die Silhouette lesbar bleibt.
  const armRuhe = m.armRuhe ?? 0.06;
  function grundpose() {
    for (const g of Object.values(gelenke)) { g.rotation.set(0, 0, 0); }
    huefte.position.set(0, m.beinLaenge, 0);
    rumpf.scale.set(1, 1, 1);
    kopf.position.set(0, m.rumpfHoehe + (m.hals ?? 0.02), 0);
    gelenke.armL.rotation.z = armRuhe;
    gelenke.armR.rotation.z = -armRuhe;
  }

  // Leerlauf-Atmen: Brustkorb hebt sich, Arme pendeln minimal (Periode ~3,6 s).
  function atmen(t, staerke = 1, seed = 0) {
    const phase = (seed % 1000) / 159.2;
    const s = Math.sin((2 * Math.PI * t) / 3.6 + phase) * staerke;
    rumpf.scale.y *= 1 + 0.012 * s;
    kopf.position.y += 0.006 * s;
    gelenke.armL.rotation.z += 0.012 * s;
    gelenke.armR.rotation.z -= 0.012 * s;
    huefte.rotation.z += 0.004 * Math.sin((2 * Math.PI * t) / 5.1 + phase) * staerke;
  }

  grundpose();
  return { gruppe, gelenke, anker, grundpose, atmen, kopfMesh, rumpfMesh, huefteHoehe: m.beinLaenge, beinDicke: m.beinBreite, masse: m };
}
