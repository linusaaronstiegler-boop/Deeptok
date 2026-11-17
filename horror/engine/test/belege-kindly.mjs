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
        { id: 'odell', modul: 'odell', position: plus(SEE, [-0.1, 0.85, -48.2]), blick: 0, gesicht: 'streng' },
        { id: 'bear', modul: 'nachbar', params: { variante: 'muetze', alter: 'jung', farbe: '#2E6E7E' }, position: plus(SEE, [0, 0.85, -47.35]), blick: 180, gesicht: 'neutral' },
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
};
