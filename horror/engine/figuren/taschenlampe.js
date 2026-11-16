// Requisite „taschenlampe“ (Teil 3): Dads alte Taschenlampe. Satz 43: sie fällt in den Staub, der
// Lichtkegel kippt weg. Satz 55: sie liegt seit sechs Jahren neben Eli im Kriechkeller (aus, verstaubt).
// Ursprung = Mitte des Gehäuses am Boden; die Lampe zeigt nach +z.
// params: an (Std true: Linse leuchtet, Kegel sichtbar), kegel (Std 0.25, Helligkeit des Kegels),
//         laenge (Std 0.3), staubig (Std false: matt grau statt rot lackiert)
// Animationen: kippen { winkel (Grad, Std 80), rollen (Grad, Std 40) } – fällt auf die Seite, der Kegel
//              schwenkt mit (0,35 s); aus (Linse und Kegel gehen aus, 0,1 s)
import { weicherKegel } from '../src/bauteile.js';

export default async function baue(ctx, params = {}) {
  const T = ctx.THREE;
  const L = params.laenge ?? 0.3;
  const gruppe = new T.Group();
  const koerper = new T.Group(); koerper.position.y = 0.045; gruppe.add(koerper);
  const lack = ctx.mat(params.staubig ? '#7d746a' : '#8a2f26', { rauheit: params.staubig ? 0.95 : 0.45, kante: { farbe: '#ffe8c8', staerke: 0.3 } });
  const chrom = ctx.mat(params.staubig ? '#8f8c86' : '#c9c4b8', { metall: 0.7, rauheit: params.staubig ? 0.8 : 0.3 });
  const rohr = new T.Mesh(new T.CylinderGeometry(0.032, 0.032, L, 14), lack); rohr.rotation.x = Math.PI / 2; rohr.castShadow = true; koerper.add(rohr);
  const kopf = new T.Mesh(new T.CylinderGeometry(0.05, 0.036, 0.08, 16), chrom); kopf.rotation.x = Math.PI / 2; kopf.position.z = L / 2 + 0.03; kopf.castShadow = true; koerper.add(kopf);
  const schalter = new T.Mesh(new T.BoxGeometry(0.02, 0.012, 0.04), chrom); schalter.position.set(0, 0.034, 0); koerper.add(schalter);
  const an = params.an !== false;
  const linseMat = ctx.leuchtMat('#fff1d0', an ? 3.0 : 0.0001, { eigenes: true });
  const linse = new T.Mesh(new T.CircleGeometry(0.046, 16), linseMat); linse.position.z = L / 2 + 0.071; koerper.add(linse);
  // Kegel: additiv, hell an der Lampe, dunkel am Ende (wie die Taschenlampe im Kriechkeller)
  const kegelTex = ctx.zeichenTextur((g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#000000'); gr.addColorStop(0.55, '#4d4d4d'); gr.addColorStop(1, '#ffffff');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }, 8, 128);
  const kegelMat = new T.MeshLambertMaterial({ color: '#000000', emissive: new T.Color('#ffe4b8'), emissiveIntensity: an ? (params.kegel ?? 0.25) : 0, emissiveMap: kegelTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
  kegelMat.fog = false;
  weicherKegel(kegelMat);   // Review Teil 3: keine harte Kegelkante
  const kegelL = 1.6;
  const kegel = new T.Mesh(new T.CylinderGeometry(0.42, 0.05, kegelL, 20, 1, true), kegelMat);
  kegel.rotation.x = Math.PI / 2; kegel.position.z = L / 2 + 0.07 + kegelL / 2; kegel.userData.einzeln = true;
  kegel.visible = an;
  koerper.add(kegel);
  const mitte = new T.Object3D(); mitte.position.y = 0.045; gruppe.add(mitte);
  const kopfAnker = new T.Object3D(); kopfAnker.position.z = L / 2 + 0.07; koerper.add(kopfAnker);
  const grundLinse = an ? 3.0 : 0.0001, grundKegel = an ? (params.kegel ?? 0.25) : 0;
  return {
    gruppe, gelenke: { koerper }, anker: { mitte, kopf: kopfAnker },
    grundpose() { koerper.rotation.set(0, 0, 0); koerper.position.set(0, 0.045, 0); linseMat.emissiveIntensity = grundLinse; kegelMat.emissiveIntensity = grundKegel; },
    animationen: {
      kippen: {
        dauer: 0.35, ease: 'ease_in',
        anwenden(f, p, prm, c) {
          koerper.rotation.z = c.mischen(koerper.rotation.z, (prm.rollen ?? 40) * c.GRAD, p);
          koerper.rotation.y = c.mischen(koerper.rotation.y, (prm.winkel ?? 80) * c.GRAD, p);
          koerper.position.y = 0.045 + 0.25 * (1 - p) * (prm.hoehe ?? 0);
        },
      },
      aus: { dauer: 0.1, ease: 'linear', anwenden(f, p) { linseMat.emissiveIntensity *= 1 - p; kegelMat.emissiveIntensity *= 1 - p; } },
    },
  };
}
