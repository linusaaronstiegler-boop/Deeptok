// Set-Belege: je Set alle Kamerapunkte in passenden Lichtstimmungen, dazu Figuren zum Größenvergleich.
// Wird von test/belege.mjs geladen (gleiche episode()-Hilfe, 3 Bilder je Einstellung).
const SETS_MIT = (innen = {}) => [
  { id: 'strasse', modul: 'hauptstrasse' },
  { id: 'marsh', modul: 'marsh_haus' },
  { id: 'haus', modul: 'marsh_innen', params: innen },
];
const kp = (punkt) => ({ baustein: 'statisch', punkt });
const AUSSEN = ['strasse', 'marsh'];
const INNEN = ['strasse', 'haus'];
// Marsh-Haus-System -> Welt (wie src/bauteile.js marshWelt, Haus bei [-12,0,0], 90° gedreht)
const mw = (x, y, z) => [-12 + z, y, -x];
const MORGEN = { haupt: { richtung: [0.8, 0.42, 0.25] } }; // tiefe Sonne von der Straßenseite (Ost)

export const SET_BELEGE = {
  'set-hauptstrasse': ({ episode }) => {
    const e = [];
    const modul = (m, licht, punkte = ['totale', 'halbtotale', 'nah', 'detail', 'untersicht']) => punkte.forEach((p) => e.push({ kamera: kp(`strasse.${m}_${p}`), licht, set: AUSSEN }));
    modul('platz', 'nacht');
    modul('haeuser', 'daemmerung');
    modul('marsh', 'daemmerung');
    modul('pike', 'nacht');
    modul('ende', 'tag', ['totale', 'halbtotale', 'nah', 'detail', 'untersicht']);
    e.push({ kamera: kp('strasse.platz_totale'), licht: 'tag', set: AUSSEN });
    e.push({ kamera: kp('strasse.haeuser_totale'), licht: 'nacht', set: AUSSEN });
    e.push({ kamera: kp('strasse.ende_totale'), licht: 'nacht', set: AUSSEN });
    // Satz 5: Lichter in den oberen Fenstern gehen nacheinander aus (gestaffelt, Ende der Staffel im Bild)
    e.push({ kamera: kp('strasse.haeuser_untersicht'), licht: 'nacht', set: AUSSEN, licht_ereignisse: [{ art: 'aus', ziele: ['strasse.fenster_o1_oben', 'strasse.fenster_o2_oben', 'strasse.fenster_pike_oben', 'strasse.laterne_marsh'], versatz: 0.0, start: -1, ab: 0.001, dauer: 0.001 }] });
    return episode('Beleg Set hauptstrasse', e, {
      sets: SETS_MIT(),
      figurenFest: [
        { id: 'mh', modul: 'mister_hundred', position: [2.5, 0, -54], blick: 0, gesicht: 'glatt' },
        { id: 'nb', modul: 'nachbar', params: { variante: 'muetze' }, position: [10.5, 0.6, 9.2], blick: -90, gesicht: 'besorgt' },
        { id: 'eli', modul: 'eli', position: [4.4, 0.14, 13], blick: 200, gesicht: 'neutral' },
        { id: 'pk', modul: 'pickup', position: [8.6, 0, -12.6], blick: -90 },
        { id: 'sp', modul: 'schuhpaar', params: { art: 'grau' }, position: [0.3, 0.04, 56], blick: 180 },
      ],
      partikel: [{ art: 'schweben', ort: [0, 2, 62], bereich: [14, 4, 6], anzahl: 120, farbe: '#dfe6ee', groesse: 0.06, deckkraft: 0.5 }],
    });
  },
  'set-marsh-haus': ({ episode }) => {
    const e = [];
    for (const p of ['totale', 'halbtotale', 'nah', 'detail', 'untersicht', 'daemmerung']) e.push({ kamera: kp(`marsh.${p}`), licht: 'daemmerung', set: AUSSEN });
    e.push({ kamera: kp('marsh.totale'), licht: 'nacht', set: AUSSEN });
    e.push({ kamera: kp('marsh.halbtotale'), licht: 'tag', set: AUSSEN });
    e.push({ kamera: kp('marsh.detail'), licht: 'tag', set: AUSSEN, licht_anpassung: MORGEN });
    e.push({ kamera: kp('marsh.untersicht'), licht: 'nacht', set: AUSSEN });
    return episode('Beleg Set marsh_haus', e, {
      sets: SETS_MIT(),
      figurenFest: [
        { id: 'mh', modul: 'mister_hundred', position: [-8.0, 0, 2.5], blick: 90, gesicht: 'glatt' },
        { id: 'st', modul: 'schuhpaar', params: { art: 'dad' }, position: mw(2.8, 0.6, 1.1), blick: 90 },
      ],
    });
  },
  'set-marsh-innen': ({ episode }) => {
    const e = [];
    const raum = (r, licht, anpassung) => ['totale', 'halbtotale', 'nah', 'detail', 'untersicht'].forEach((p) => e.push({ kamera: kp(`haus.${r}_${p}`), licht, set: INNEN, licht_anpassung: anpassung, schatten_bereich: 16 }));
    raum('kueche', 'tag', MORGEN);
    raum('flur', 'innen_warm');
    raum('eli', 'daemmerung');
    raum('june', 'innen_warm');
    e.push({ kamera: kp('haus.eli_fenster_schulter'), licht: 'daemmerung', set: INNEN, schatten_bereich: 20 });
    e.push({ kamera: kp('haus.kueche_totale'), licht: 'innen_warm', set: INNEN, schatten_bereich: 16 });
    e.push({ kamera: kp('haus.june_detail'), licht: 'nacht', set: INNEN, schatten_bereich: 16 });
    return episode('Beleg Set marsh_innen', e, {
      sets: SETS_MIT({ kuchen: true }),
      figurenFest: [
        { id: 'eli', modul: 'eli', position: mw(-2.6, 3.8, -0.75), blick: 90, gesicht: 'angst' },
        { id: 'june', modul: 'june', position: mw(-3.75, 0.6, -2.5), blick: 90 + 90, pose: 'sitzen', gesicht: 'laecheln' },
        { id: 'mh', modul: 'mister_hundred', position: [-8.0, 0, 2.5], blick: 90, gesicht: 'glatt' },
      ],
    });
  },
};
