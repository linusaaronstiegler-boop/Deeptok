// Set "endkarte": die Karte „PART 2“ nach dem Cliffhanger (anhang-a-serienformat.md A6:
// harter Schnitt ≤ 0,2 s nach dem letzten Wort, dann 1,0 s Endkarte im Kanal-Look, ohne Ton).
//
// Schrift Archivo Black (wie die Untertitel, assets/schriften/, OFL). Farbe: das kalte Leuchten
// von Mister Hundred (#9FD8D2, serie.md), auf fast
// schwarzem Nachtblau. In der Episode weit weg von allen anderen Sets stellen
// ("position": [0, 0, -400]) und in ihrer Einstellung allein zeigen: "set": ["karte"].
// Anker und Kamerapunkt sind lokal; die Engine rechnet sie mit der Set-Position um.
//
// params: text (Std "PART"), zahl (Std "2"), farbe, hintergrund
// Kamerapunkt: karte (frontal); Anker: mitte, zahl.
import * as THREE from 'three';

export default async function baue(ctx, params = {}) {
  const gruppe = new THREE.Group();
  const farbe = params.farbe ?? '#9FD8D2';
  const hinten = ctx.mat(params.hintergrund ?? '#070a14', { rauheit: 1 });

  // Hintergrund: große dunkle Wand hinter der Schrift
  const wand = ctx.kiste(30, 40, 0.2, hinten, { schatten: false });
  wand.position.set(0, 2, -0.6);
  gruppe.add(wand);

  // Schrift: Archivo Black wie die Untertitel (Review Folge 1: die Klötzchen-Pixelschrift war eine
  // dritte Schrift). Gezeichnet auf eine Leinwand, als Leuchtkarte auf einer Fläche; Werte über 1
  // blühen im Bloom (türkises Glühen).
  const schrift = new FontFace('Archivo Black', `url(${ctx.engineUrl}assets/schriften/ArchivoBlack-Regular.ttf)`);
  await schrift.load();
  document.fonts.add(schrift);
  const text = params.text ?? 'PART', zahl = String(params.zahl ?? '2');
  const tex = ctx.zeichenTextur((g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.font = `${Math.round(h * 0.2)}px "Archivo Black"`;
    g.fillText(text, w / 2, h * 0.36);
    g.font = `${Math.round(h * 0.5)}px "Archivo Black"`;
    g.fillText(zahl, w / 2, h * 0.86);
  }, 1024, 1536);
  const schriftMat = new THREE.MeshStandardMaterial({ color: '#000000', emissive: new THREE.Color(farbe), emissiveIntensity: 1.1, emissiveMap: tex, transparent: true, alphaMap: tex, roughness: 1 });
  const breite = 3.0, hoehe = breite * 1.5;
  const flaeche = new THREE.Mesh(new THREE.PlaneGeometry(breite, hoehe), schriftMat);
  flaeche.position.set(0, 2.1, 0);
  gruppe.add(flaeche);

  return {
    gruppe,
    anker: { mitte: [0, 2.1, 0], zahl: [0, 1.25, 0] },
    // Frontal, Mitte der beiden Zeilen auf Bildmitte; Abstand so, dass "PART" etwa 70 % der Breite füllt
    kamerapunkte: { karte: { pos: [0, 2.1, 6.4], ziel: [0, 2.1, 0], fov: 50 } },
  };
}
