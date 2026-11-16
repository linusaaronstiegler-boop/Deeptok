// Requisite „wandschatten“ (Teil 3, Satz 6, 22, 44): ein Schatten als dunkle, weiche Fläche an einer Wand
// oder auf einem Bett. Kein echter Schattenwurf: Ein Schatten in der falschen Form (zu groß, mit der Raute
// aus Händen und Ellbogen) wäre mit einem Licht nicht zu bauen, und als Fläche bleibt er bitgleich.
// Als Figur gebaut, damit die Episode ihn hinstellt und mit "sichtbar" für 0,5 s ein- und ausblendet.
//
// params:
//   form: 'raute'      June, viel zu groß: schmaler Leib, spitze Ellbogen, die Hände als Raute vor dem Kopf (Satz 6)
//         'eingerollt' derselbe Riese, still zusammengerollt wie ein Schlafender (Satz 44)
//         'fenster'    nur Kopf und Raute, wie durchs Fenster geworfen, mit Fensterkreuz (Satz 22)
//   breite, hoehe (m, Std 1.6 × 2.4), deckkraft (Std 0.6), liegend (Std false: steht senkrecht, Vorderseite +z;
//   true: liegt flach, Oberseite +y), farbe (Std fast schwarz, leicht blau)
// Ursprung: Mitte der Unterkante (stehend) bzw. Mitte der Fläche (liegend).
// Animation: einblenden { deckkraft } (0,15 s; mit deckkraft 0 aus).
export default async function baue(ctx, params = {}) {
  const T = ctx.THREE;
  const form = params.form ?? 'raute';
  const B = params.breite ?? 1.6, H = params.hoehe ?? 2.4;
  const tex = ctx.zeichenTextur((g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#ffffff';
    g.filter = `blur(${Math.round(w * 0.012)}px)`;   // weiche Kante (die Lampe ist nah)
    const P = (x, y) => [x * w, (1 - y) * h];         // 0..1, y nach oben
    const poly = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => { const [px, py] = P(x, y); i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.closePath(); g.fill(); };
    const kopf = (x, y, r) => { const [px, py] = P(x, y); g.beginPath(); g.rect(px - r * w, py - r * w * 1.1, 2 * r * w, 2.2 * r * w); g.fill(); };
    const raute = (cx, cy, s) => {
      // Ellbogen spitz zur Seite, Unterarme zur Mitte, Hände vor dem Kopf mit gespreizten Fingern
      poly([[cx - 0.36 * s, cy - 0.05 * s], [cx - 0.1 * s, cy + 0.12 * s], [cx - 0.08 * s, cy + 0.05 * s], [cx - 0.3 * s, cy - 0.07 * s]]);
      poly([[cx + 0.36 * s, cy - 0.05 * s], [cx + 0.1 * s, cy + 0.12 * s], [cx + 0.08 * s, cy + 0.05 * s], [cx + 0.3 * s, cy - 0.07 * s]]);
      poly([[cx - 0.36 * s, cy - 0.05 * s], [cx - 0.2 * s, cy - 0.28 * s], [cx - 0.14 * s, cy - 0.25 * s], [cx - 0.29 * s, cy - 0.06 * s]]);
      poly([[cx + 0.36 * s, cy - 0.05 * s], [cx + 0.2 * s, cy - 0.28 * s], [cx + 0.14 * s, cy - 0.25 * s], [cx + 0.29 * s, cy - 0.06 * s]]);
      for (let i = 0; i < 4; i++) {
        const fx = cx - 0.075 * s + i * 0.05 * s;
        poly([[fx, cy + 0.08 * s], [fx + 0.03 * s, cy + 0.08 * s], [fx + 0.022 * s + (i - 1.5) * 0.01 * s, cy + 0.3 * s], [fx + 0.008 * s + (i - 1.5) * 0.01 * s, cy + 0.3 * s]]);
      }
    };
    if (form === 'raute') {
      poly([[0.43, 0], [0.57, 0], [0.55, 0.62], [0.45, 0.62]]);          // dünner langer Leib
      poly([[0.38, 0.55], [0.62, 0.55], [0.58, 0.66], [0.42, 0.66]]);    // Schultern
      kopf(0.5, 0.74, 0.055);
      raute(0.5, 0.7, 0.95);
    } else if (form === 'eingerollt') {
      // liegender, gekrümmter Rücken, Knie angezogen, der Kopf mit der Raute am rechten Ende
      g.beginPath(); const [ax, ay] = P(0.12, 0.18); g.moveTo(ax, ay);
      [[0.2, 0.48], [0.48, 0.6], [0.72, 0.52], [0.8, 0.3], [0.7, 0.12], [0.4, 0.08]].forEach(([x, y]) => { const [px, py] = P(x, y); g.lineTo(px, py); });
      g.closePath(); g.fill();
      kopf(0.82, 0.44, 0.05);
      raute(0.82, 0.42, 0.55);
    } else {
      kopf(0.5, 0.5, 0.09);
      raute(0.5, 0.46, 1.5);
      g.filter = 'none'; g.globalCompositeOperation = 'destination-out';   // Fensterkreuz bleibt hell
      g.fillRect(w * 0.485, 0, w * 0.03, h); g.fillRect(0, h * 0.42, w, h * 0.03);
    }
  }, 512, Math.round(512 * H / B));
  const mat = new T.MeshBasicMaterial({ color: params.farbe ?? '#05060a', alphaMap: tex, transparent: true, opacity: params.deckkraft ?? 0.6,
    depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const flaeche = new T.Mesh(new T.PlaneGeometry(B, H), mat);
  const gruppe = new T.Group();
  if (params.liegend) flaeche.rotation.x = -Math.PI / 2; else flaeche.position.y = H / 2;
  gruppe.add(flaeche);
  const mitte = new T.Object3D(); mitte.position.copy(flaeche.position); gruppe.add(mitte);
  const grund = params.deckkraft ?? 0.6;
  return {
    gruppe, gelenke: { flaeche }, anker: { mitte },
    grundpose() { mat.opacity = grund; },
    animationen: {
      einblenden: { dauer: 0.15, ease: 'ease_in_out', anwenden(f, p, prm) { mat.opacity = grund + ((prm.deckkraft ?? grund) - grund) * p; } },
    },
  };
}
