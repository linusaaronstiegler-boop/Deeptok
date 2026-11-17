import fs from 'node:fs';
// Set-Belege der Orte von „Rules of Kindly“ Folge 1 (see, huette_innen, stadtrand, rathaus, schnee).
// Wird von test/belege-sets.mjs eingehängt (gleiche episode()-Hilfe, 3 Bilder je Einstellung).
//   node test/belege.mjs set-see set-huette set-stadtrand set-rathaus set-schnee
// Volle Auflösung einzelner Einstellungen: render.mjs ../build/belege/beleg-set-see.json --einzelbild <s>
// (Einstellung i beginnt bei i · 0,1 s; das mittlere Bild liegt bei i · 0,1 + 0,0333 s).
const kp = (punkt, mehr = {}) => ({ baustein: 'statisch', punkt, ...mehr });
// Sets weit auseinander (wie in einer Folge): see bei z = 1000, Hütte bei x = 600, Stadtrand bei x = −600,
// Rathaus bei x = 900, Schnee liegt über der Hauptstraße (Ursprung).
const SEE = [0, 0, 1000];
const HUETTE = [600, 0, 0];
const RAND = [-600, 0, 0];
const RATHAUS = [900, 0, 0];
const plus = (a, b) => a.map((v, i) => v + b[i]);
// Requisiten der Figuren-Werkstatt, sobald es sie gibt (sonst Stellvertreter bzw. leer)
const gibt = (modul) => fs.existsSync(new URL(`../figuren/${modul}.js`, import.meta.url));
// Atemdampf als Stellvertreter, bis das Atem-Modul fertig ist: dichter als die Hiding-Night-Vorgabe
const atem = (wer) => ({ art: 'atem', ort: `${wer}.mund`, periode: 2.6, anzahl: 60, groesse: 0.07, deckkraft: 0.38, farbe: '#eef2f8', seed: wer });

export const KINDLY_BELEGE = {
  'set-see': ({ episode }) => {
    const e = [];
    const s = (punkt, licht, mehr = {}) => e.push({ kamera: kp(`see.${punkt}`), licht, set: ['see'], ...mehr });
    s('totale', 'see_morgengrauen');
    s('steg_totale', 'see_morgengrauen');
    s('steg_ende', 'see_morgengrauen');
    s('steg_seite', 'see_nacht');
    s('ufer', 'see_morgengrauen');
    s('draufsicht', 'see_morgengrauen');
    s('gesicht_oben', 'see_nacht');
    s('eis_detail', 'see_daemmerung');
    s('unter_eis', 'see_unter');
    s('unter_seite', 'see_unter');
    s('unter_gegenschuss', 'see_unter');
    s('weg_totale', 'see_morgengrauen');
    s('weg_totale', 'see_nacht');
    s('huette_tuer', 'see_nacht');
    s('huetten', 'see_nacht');
    s('stuhl', 'see_daemmerung');
    s('see_weit', 'see_nacht');
    s('heimweg', 'see_nacht');
    // Ereignisse: klare Stelle über dem Kopf ab 0,6 s (Einstellung 7 sieht sie offen), Risse ab 0,8 s
    return episode('Beleg Set see', e, {
      sets: [{ id: 'see', modul: 'see', position: SEE, params: { ereignisse: [
        { was: 'klar', start: 0.6, dauer: 0.001, mitte: [2, -31.5], radius: 1.4 },
        { was: 'risse', start: 0.8, dauer: 0.001, mitte: [2.6, -24.5], radius: 1.8 },
      ] } }],
      lichtGruppen: ['see'],
      figurenFest: [
        // Odell am Stegende, Bear an der Kante (S37), drei Männer am Ufer (S3–4), Bear über dem Kopf (S34)
        { id: 'odell', modul: 'odell', position: plus(SEE, [0.35, 0.85, -48.2]), blick: 0, gesicht: 'streng' },
        { id: 'bear', modul: 'nachbar', params: { variante: 'muetze', alter: 'jung', farbe: '#2E6E7E' }, position: plus(SEE, [-0.2, 0.85, -47.35]), blick: 180, gesicht: 'neutral' },
        { id: 'u1', modul: 'nachbar', params: { variante: 'muetze' }, position: plus(SEE, [-7.0, 0.5, -64.4]), blick: 0, gesicht: 'neutral' },
        { id: 'u2', modul: 'nachbar', params: { variante: 'glatze' }, position: plus(SEE, [-6.0, 0.5, -64.6]), blick: 0, gesicht: 'neutral' },
        { id: 'u3', modul: 'nachbar', params: { variante: 'brille', alter: 'alt' }, position: plus(SEE, [-5.0, 0.5, -64.4]), blick: 0, gesicht: 'neutral' },
        { id: 'eis1', modul: 'nachbar', params: { variante: 'kopftuch' }, position: plus(SEE, [2, 0, -32.5]), blick: 0, gesicht: 'neutral' },
        { id: 'eis2', modul: 'nachbar', params: { variante: 'muetze', farbe: '#9E2B25' }, position: plus(SEE, [7.2, 0, -30.8]), blick: 160, gesicht: 'neutral' },
        // Gesicht unter dem Eis (Stellvertreter für das Wesen/die Kopie): liegt rücklings, Kopf nach −z
        { id: 'unten', modul: 'nachbar', params: { variante: 'glatze', alter: 'alt' }, position: plus(SEE, [2, -0.62, -29.7]), blick: 0, pose: 'liegen', gesicht: 'neutral' },
      ],
      partikel: ['odell', 'u1', 'u3', 'eis1', 'eis2'].map(atem),
    });
  },
  'set-huette': ({ episode }) => {
    const e = [];
    const s = (punkt) => e.push({ kamera: kp(`huette.${punkt}`), licht: 'huette', set: ['huette'], schatten_bereich: 6 });
    // 0 totale, 1 ofen, 2 loch (Frost), 3 loch (klar), 4 loch_nah, 5 tuer (Riegel zu), 6 fenster (Hauch),
    // 7 fenster_gesicht, 8 bank, 9 totale (Deckel drauf), 10 loch (Deckel drauf)
    for (const p of ['totale', 'ofen', 'loch', 'loch', 'loch_nah', 'tuer', 'fenster', 'fenster_gesicht', 'bank', 'totale', 'loch']) s(p);
    return episode('Beleg Set huette_innen', e, {
      sets: [{ id: 'huette', modul: 'huette_innen', position: HUETTE, params: { ereignisse: [
        { was: 'klar', start: 0.3, dauer: 0.001 },
        { was: 'riegel_zu', start: 0.5, dauer: 0.001 },
        { was: 'hauch', start: 0.38, dauer: 1.6 },
        { was: 'deckel_drauf', start: 0.9, dauer: 0.001 },
      ] } }],
      lichtGruppen: ['huette'],
      figurenFest: [
        { id: 'bear', modul: 'nachbar', params: { variante: 'muetze', alter: 'jung', farbe: '#2E6E7E' }, position: plus(HUETTE, [0.3, 0, -0.2]), blick: 90, gesicht: 'neutral' },
        { id: 'gus', modul: 'nachbar', params: { variante: 'muetze', farbe: '#9E2B25' }, position: plus(HUETTE, [-0.2, 0, -0.4]), blick: -145, gesicht: 'ernst' },
        // Gesicht unter der Eishaut im Loch (Stellvertreter): liegt rücklings, Kopf nach −z unter der Lochmitte
        { id: 'unten', modul: 'nachbar', params: { variante: 'muetze', alter: 'jung' }, position: plus(HUETTE, [-0.25, -0.8, 1.95]), blick: 0, pose: 'liegen', gesicht: 'neutral' },
      ],
    });
  },
  'set-stadtrand': ({ episode }) => {
    const e = [];
    const nacht = (punkt) => e.push({ kamera: kp(`rand.${punkt}`), licht: 'nacht', set: ['rand'] });
    const tag = (punkt) => e.push({ kamera: kp(`rand.${punkt}`), licht: 'tag', set: ['rand'] });
    for (const p of ['totale', 'schild', 'zahl', 'dead_end', 'strasse']) tag(p);
    for (const p of ['totale', 'schild', 'zahl', 'endkarte']) nacht(p);
    const schild = gibt('ortsschild');
    return episode('Beleg Set stadtrand', e, {
      sets: [{ id: 'rand', modul: 'stadtrand', position: RAND, params: { platzhalter_schild: !schild } }],
      lichtGruppen: ['rand'],
      figurenFest: schild ? [{ id: 'schild', modul: 'ortsschild', position: plus(RAND, [5.7, 0, -4.6]), blick: 180 }] : [],
      // Schneefall um das Schild, nicht bis an die Linse (nichts vor der Linse)
      partikel: [{ art: 'schnee', ort: plus(RAND, [4.5, 4, -2]), bereich: [14, 9, 10], anzahl: 600 }],
    });
  },
  'set-rathaus': ({ episode }) => {
    const e = [];
    for (const [p, licht] of [['totale', 'innen_warm'], ['pult_detail', 'innen_warm'], ['pult_nah', 'innen_warm'], ['pult_halbnah', 'innen_warm'], ['seite', 'tag'], ['totale', 'tag']]) e.push({ kamera: kp(`rathaus.${p}`), licht, set: ['rathaus'], schatten_bereich: 12, ...(licht === 'innen_warm' ? { licht_anpassung: { hemi: { staerke: 1.8 }, belichtung: 1.15 } } : {}) });   // wie LICHT.rathaus im Compiler
    const buch = gibt('stadtbuch');
    return episode('Beleg Set rathaus', e, {
      sets: [{ id: 'rathaus', modul: 'rathaus', position: RATHAUS }],
      lichtGruppen: ['rathaus'],
      figurenFest: [
        { id: 'gus', modul: 'nachbar', params: { variante: 'muetze', farbe: '#9E2B25' }, position: plus(RATHAUS, [0, 0, 0.62]), blick: 180, gesicht: 'ernst' },
        ...(buch ? [{ id: 'buch', modul: 'stadtbuch', position: plus(RATHAUS, [0, 1.05, 0]), blick: 0 }] : []),
      ],
    });
  },
  'set-schnee': ({ episode }) => {
    const e = [];
    const aussen = ['strasse', 'marsh', 'schnee'];
    e.push({ kamera: kp('schnee.lund_halbnah'), licht: 'nacht', set: aussen });
    e.push({ kamera: kp('schnee.lund_gegen'), licht: 'nacht', set: aussen });
    e.push({ kamera: kp('schnee.lund_totale'), licht: 'nacht', set: aussen });
    e.push({ kamera: kp('schnee.strasse_schnee'), licht: 'nacht', set: aussen });
    e.push({ kamera: kp('schnee.lund_totale'), licht: 'tag', set: aussen });
    e.push({ kamera: kp('strasse.haeuser_totale'), licht: 'tag', set: aussen });
    e.push({ kamera: kp('strasse.ende_halbtotale'), licht: 'daemmerung', set: aussen });
    return episode('Beleg Set schnee', e, {
      sets: [{ id: 'strasse', modul: 'hauptstrasse' }, { id: 'marsh', modul: 'marsh_haus', params: { tuer_als_figur: true } }, { id: 'schnee', modul: 'schnee' }],
      lichtGruppen: ['strasse', 'marsh'],
      figurenFest: [
        { id: 'tuer', modul: 'tuer', position: [-11.98, 0.6, -1.175], blick: 90 },
        { id: 'mann', modul: 'nachbar', params: { variante: 'glatze', alter: 'alt', farbe: '#2b3a5a' }, position: [-10.75, 0.6, -1.7], blick: -90, gesicht: 'neutral' },
        { id: 'frau', modul: 'nachbar', params: { variante: 'kopftuch', alter: 'alt', farbe: '#3f5a3c' }, position: [-12.65, 0.6, -1.7], blick: 90, gesicht: 'ernst' },
      ],
      partikel: [{ art: 'schnee', ort: [-8, 5, 0], bereich: [20, 10, 20], anzahl: 700 }, atem('frau')],
    });
  },
};
