// Requisite „armbanduhr“ (Teil 3, Satz 27 „Nothing, until three in the morning“): Elis Digitaluhr am
// Handgelenk, liegt im Lichtstreifen der Dielen. Die Anzeige leuchtet schwach grünlich; die Ziffern sind
// Gesichter der Requisite (Tausch in 1 Bild): Aktion { was: "gesicht", params: { name: "3_00" } }.
// Ursprung = Mitte des Gehäuses, Anzeige nach +y, 12 Uhr nach −z. params: zeit (Std "2:59"), groesse (Std 1)
export default async function baue(ctx, params = {}) {
  const T = ctx.THREE;
  const s = params.groesse ?? 1;
  const gruppe = new T.Group();
  const band = ctx.mat('#2b2e33', { rauheit: 0.8 });
  const gehaeuse = ctx.mat('#3d4148', { metall: 0.4, rauheit: 0.45, kante: { farbe: '#d8e8ff', staerke: 0.3 } });
  // Handgelenk (Jackenärmel grün wie Elis Kapuzenjacke) und Band
  const arm = new T.Mesh(new T.CylinderGeometry(0.045, 0.05, 0.42, 14), ctx.mat('#5B7B4A', { rauheit: 0.9 }));
  arm.rotation.x = Math.PI / 2; arm.position.set(0, -0.012, 0.2); gruppe.add(arm);
  const haut = new T.Mesh(new T.CylinderGeometry(0.036, 0.038, 0.12, 14), ctx.mat('#E8C9A8', { rauheit: 0.7 }));
  haut.rotation.x = Math.PI / 2; haut.position.set(0, -0.012, -0.02); gruppe.add(haut);
  const ring = new T.Mesh(new T.TorusGeometry(0.04, 0.009, 8, 20), band); ring.position.set(0, -0.012, 0); gruppe.add(ring);
  const kasten = new T.Mesh(new T.BoxGeometry(0.05, 0.016, 0.044), gehaeuse); kasten.position.y = 0.03; gruppe.add(kasten);
  const zeiten = ['2_59', '3_00'];
  const karten = {};
  const karte = (name) => karten[name] ??= ctx.zeichenTextur((g, w, h) => {
    g.fillStyle = '#16251f'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#9ff2c8';
    g.font = `bold ${Math.round(h * 0.62)}px monospace`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(name.replace('_', ':'), w / 2, h * 0.54);
  }, 256, 200);
  const anzeigeMat = new T.MeshStandardMaterial({ color: '#000000', emissive: new T.Color('#ffffff'), emissiveIntensity: 1.1, emissiveMap: karte(params.zeit?.replace(':', '_') ?? '2_59'), roughness: 0.4 });
  const anzeige = new T.Mesh(new T.PlaneGeometry(0.04, 0.032), anzeigeMat);
  anzeige.rotation.x = -Math.PI / 2; anzeige.position.y = 0.0385; gruppe.add(anzeige);
  gruppe.scale.setScalar(s);
  const mitte = new T.Object3D(); mitte.position.y = 0.035 * s; gruppe.add(mitte);
  const start = params.zeit?.replace(':', '_') ?? '2_59';
  return {
    gruppe, gelenke: {}, anker: { mitte, anzeige: mitte },
    gesichter: zeiten,
    grundpose() {},
    setzeGesicht(name) {
      if (!zeiten.includes(name)) throw new Error(`armbanduhr: Anzeige "${name}" unbekannt (${zeiten.join(', ')})`);
      anzeigeMat.emissiveMap = karte(name); anzeigeMat.needsUpdate = true;
    },
    _start: start,
  };
}
