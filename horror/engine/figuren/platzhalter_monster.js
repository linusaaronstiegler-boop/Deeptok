// Platzhalter-Monster zum Testen (eigene Gestalt, kein bekanntes Monster):
// sehr groß und dürr, lange Arme, schmaler Kopf ohne Mund, zwei glühende Augen.
// Gesichter: "ruhig" (Augen glimmen) und "starr" (Augen hell).
// params: farbe, augen (Farbe), groesse (Std 1 = 3,4 m)
import { baueRig } from '../src/rig.js';

export default async function baue(ctx, params = {}) {
  const T = ctx.THREE;
  const haut = ctx.mat(params.farbe ?? '#3c404c', { rauheit: 0.95 });
  const rig = baueRig(ctx, {
    beinLaenge: 1.55, beinBreite: 0.18, beinAbstand: 0.34,
    rumpfBreite: 0.5, rumpfHoehe: 1.05, rumpfTiefe: 0.26,
    armLaenge: 1.55, armBreite: 0.13, schulterAbstand: 0.68,
    kopfBreite: 0.3, kopfHoehe: 0.62, kopfTiefe: 0.34, hals: 0.12,
    rund: 0.03, rundKopf: 0.06, armRuhe: 0.04,
    mat: { rumpf: haut, arm: haut, bein: haut, kopf: haut },
  });
  // Grundhaltung: leicht gebeugt, Kopf vorgeschoben (wird in grundpose wieder gesetzt).
  const grundpose0 = rig.grundpose;
  const grundpose = () => {
    grundpose0();
    rig.gelenke.rumpf.rotation.x = 0.12;
    rig.gelenke.kopf.rotation.x = -0.1;
  };
  const augenMat = ctx.leuchtMat(params.augen ?? '#f2f6ff', 2.5);
  for (const sx of [-1, 1]) {
    const auge = new T.Mesh(new T.CircleGeometry(0.035, 12), augenMat);
    auge.position.set(sx * 0.075, 0.42, 0.172);
    rig.gelenke.kopf.add(auge);
  }
  const s = params.groesse ?? 1;
  rig.gruppe.scale.setScalar(s);
  grundpose();
  return {
    ...rig,
    grundpose,
    gesichter: ['ruhig', 'starr'],
    hoehe: 3.4 * s,
    setzeGesicht(name) { augenMat.emissiveIntensity = name === 'starr' ? 7 : 2.5; },
    // Monster atmet langsamer und tiefer.
    atmen(t, staerke = 1, seed = 0) { rig.atmen(t * 0.7, staerke * 1.4, seed); },
  };
}
