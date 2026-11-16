// Requisite: Bodenluke in Junes Zimmer (Dielen-Deckel mit Eisenring, optional Teppich darüber).
// Satz 23: Dad reißt die Luke auf. Satz 24: June klettert heraus. Satz 30: unter dem Teppich zeichnet
// sich der Ring ab. Das Set marsh_innen hat an dieser Stelle die Öffnung und den dunklen Schacht;
// mit "luke_als_figur": true lässt es den festen Deckel weg (Anker "luke" = Mitte der Öffnung).
// Ursprung = Mitte der Angelkante (hinten, −z), Deckel liegt in +z, Oberseite bei y = 0.
// params: teppich (Std false), groesse ([0.9, 0.9])
// Animationen: oeffnen { winkel (Std 105) }, schliessen, teppich_rollen { rest }; Anker: ring, mitte, schacht
export default async function baue(ctx, params = {}) {
  const T = ctx.THREE;
  const [b, t] = params.groesse ?? [0.9, 0.9];
  const gruppe = new T.Group();
  const deckel = new T.Group();
  gruppe.add(deckel);
  const holz = ctx.mat('#8a6446', { rauheit: 0.8 });
  const fuge = ctx.mat('#5a3f2b', { rauheit: 0.9 });
  for (let i = 0; i < 5; i++) {
    const brett = ctx.kiste(b / 5 - 0.008, 0.05, t, i % 2 ? holz : ctx.mat('#94704f', { rauheit: 0.8 }), { rund: 0.004 });
    brett.position.set(-b / 2 + (i + 0.5) * b / 5, -0.025, t / 2);
    deckel.add(brett);
  }
  for (const zq of [0.18, 0.82]) {
    const leiste = ctx.kiste(b * 0.96, 0.03, 0.08, fuge);
    leiste.position.set(0, -0.06, t * zq);
    deckel.add(leiste);
  }
  const eisen = ctx.mat('#3a3a3c', { rauheit: 0.45, metall: 0.7 });
  const ring = new T.Mesh(new T.TorusGeometry(0.07, 0.012, 6, 18), eisen);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 0.012, t * 0.78);
  ring.castShadow = true;
  deckel.add(ring);
  const ringAnker = new T.Object3D(); ringAnker.position.copy(ring.position); deckel.add(ringAnker);
  // Teppich: liegt über der geschlossenen Luke, der Ring drückt sich als Wulst ab
  let teppich = null, rolle = null, teppichFern = 0;
  if (params.teppich) {
    teppich = new T.Group();
    gruppe.add(teppich);
    const tex = ctx.zeichenTextur((g, w, h) => {
      g.fillStyle = '#7a3b36'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#d8b46a'; g.lineWidth = w * 0.03; g.strokeRect(w * 0.06, h * 0.06, w * 0.88, h * 0.88);
      g.strokeStyle = '#2f3e5c'; g.lineWidth = w * 0.05; g.strokeRect(w * 0.14, h * 0.14, w * 0.72, h * 0.72);
      g.fillStyle = '#d8b46a';
      for (let i = 0; i < 5; i++) { g.save(); g.translate(w / 2, h / 2); g.rotate(Math.PI / 4); g.fillRect(-w * 0.04 * (5 - i), -w * 0.04 * (5 - i), w * 0.08 * (5 - i), w * 0.08 * (5 - i)); g.restore(); g.fillStyle = i % 2 ? '#d8b46a' : '#7a3b36'; }
    }, 256, 256);
    const tmat = ctx.mat('#ffffff', { rauheit: 1, karte: tex });
    // Drehpunkt an der fernen Kante (+z), damit sich der Teppich dorthin aufrollen lässt (Teil 2, Satz 32)
    const fern = t / 2 + 1.25 / 2;
    teppich.position.z = fern;
    const flaeche = ctx.kiste(1.7, 0.012, 1.25, tmat, { schatten: false });
    flaeche.position.set(0, 0.006, t / 2 - fern);
    teppich.add(flaeche);
    const wulst = new T.Mesh(new T.TorusGeometry(0.07, 0.014, 6, 18), ctx.mat('#6e3530', { rauheit: 1 }));
    wulst.rotation.x = Math.PI / 2;
    wulst.scale.set(1, 1, 0.6);
    wulst.position.set(0, 0.014, t * 0.78 - fern);
    teppich.add(wulst);
    // Rolle an der wandernden Kante (wächst beim Aufrollen)
    rolle = new T.Mesh(new T.CylinderGeometry(1, 1, 1.7, 14), tmat);
    rolle.rotation.z = Math.PI / 2;
    rolle.castShadow = true;
    rolle.visible = false;
    gruppe.add(rolle);
    teppichFern = fern;
  }
  const mitte = new T.Object3D(); mitte.position.set(0, 0, t / 2); gruppe.add(mitte);
  const schacht = new T.Object3D(); schacht.position.set(0, -0.6, t / 2); gruppe.add(schacht);
  return {
    gruppe, gelenke: { deckel },
    grundpose() {
      deckel.rotation.set(0, 0, 0);
      if (teppich) { teppich.scale.set(1, 1, 1); rolle.visible = false; }
    },
    anker: { ring: ringAnker, mitte, schacht },
    hoehe: 0.05,
    animationen: {
      oeffnen: {
        dauer: 0.5, ease: 'ease_out',
        anwenden(f, p, prm, c) { deckel.rotation.x = c.mischen(deckel.rotation.x, -(prm.winkel ?? 105) * c.GRAD, p); },
      },
      schliessen: {
        dauer: 0.35, ease: 'ease_in',
        anwenden(f, p, prm, c) { deckel.rotation.x = c.mischen(deckel.rotation.x, 0, p); },
      },
      // Teppich zur fernen Kante aufrollen (Teil 2, Satz 32: „She rolled back the rug“); rest = Anteil, der liegen bleibt
      teppich_rollen: {
        dauer: 0.8, ease: 'ease_in_out',
        anwenden(f, p, prm, c) {
          if (!teppich) return;
          const sz = c.mischen(teppich.scale.z, prm.rest ?? 0.08, p);
          teppich.scale.z = sz;
          const r = 0.02 + 0.07 * (1 - sz);
          rolle.visible = sz < 0.985;
          rolle.scale.set(r, 1, r);
          rolle.position.set(0, r, teppichFern - 1.25 * sz);
        },
      },
    },
  };
}
