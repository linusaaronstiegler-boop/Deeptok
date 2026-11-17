// Belege der Figuren, des Monsters und der Requisiten von „Rules of Kindly“ Folge 1 (Bibel §10.2, §10.4, §10.7).
// Wird von test/belege.mjs eingehängt (gleiche episode()-Hilfe, 3 Bilder je Einstellung, der Bogen nimmt das mittlere).
//   node test/belege.mjs kindly-bear kindly-gus kindly-lunds kindly-fischer kindly-odell kindly-requisiten kindly-monster
// Bühne: Fahrbahn vor dem Marsh-Haus (wie die Hiding-Night-Belege); Nacht-Einstellungen zeigen den Atemdampf.
const BUEHNE = [1.6, 0.04, 3.2];
const MITTE = 1 / 30;

const ganz = (id, hoehe, azimut = 0, { blick = 90, hoehenwinkel = 6, fov = 36, faktor = 2.35 } = {}) => ({
  baustein: 'statisch', ziel: { anker: `${id}.fuss`, versatz: [0, hoehe * 0.5, 0] },
  blick: { azimut: blick + azimut, hoehe: hoehenwinkel, abstand: hoehe * faktor, bezug: { anker: `${id}.fuss`, versatz: [0, hoehe * 0.5, 0] } }, fov,
});
const gesichtKamera = (id, azimut = 12, blick = 90, abstand = 2.0) => ({
  baustein: 'statisch', ziel: `${id}.kopf`, blick: { azimut: blick + azimut, hoehe: 3, abstand, bezug: `${id}.kopf` }, fov: 30,
});
// Profil von links (Figur schaut nach +x): Bildmitte 0,25 m vor dem Gesicht, dort hängt die Atemwolke
const profilKamera = (id, abstand = 2.2) => ({ baustein: 'statisch', ziel: { anker: `${id}.mund`, versatz: [0.14, 0, 0] }, blick: { azimut: 180, hoehe: 3, abstand, bezug: { anker: `${id}.mund`, versatz: [0.14, 0, 0] } }, fov: 34 });
const nah = (anker, azimut, hoehe, abstand, fov = 34, blick = 90) => ({ baustein: 'statisch', ziel: anker, blick: { azimut: blick + azimut, hoehe, abstand, bezug: anker }, fov });

// Figuren-Bogen im Stil von belege.mjs: 5 Ansichten, Gesichter, Posen; dazu zwei Nachtbilder mit Atemdampf
function figurBogen(episode, name, modul, { params = {}, hoehe = 1.8, gesichter = [], posen = [] } = {}) {
  const f = (k, mehr = {}) => ({ id: `${name}${k}`, modul, params, position: BUEHNE, blick: 90, ...mehr });
  const e = [];
  for (const [k, az] of [[0, 0], [1, 35], [2, 90], [3, 180], [4, -140]]) e.push({ figur: f(`_a${k}`), kamera: ganz(`${name}_a${k}`, hoehe, az), gesicht: 'neutral' });
  ['neutral', 'angst', 'schock', 'ernst', 'augen_zu', ...gesichter].forEach((g, k) => e.push({ figur: f(`_g${k}`), kamera: gesichtKamera(`${name}_g${k}`), gesicht: g, tiefenunschaerfe: { fokus: `${name}_g${k}.kopf`, staerke: 0.8 } }));
  posen.forEach((p, k) => {
    const { figur, azimut, gesicht, kamera, licht, ...aktion } = p;
    const id = `${name}_p${k}`;
    e.push({ figur: f(`_p${k}`, figur ? { params: { ...params, ...(figur.params ?? {}) } } : {}), kamera: kamera ? kamera(id) : ganz(id, hoehe, azimut ?? 30), gesicht, licht, aktion: aktion.was ? aktion : undefined });
  });
  // Atemdampf bei Nacht: Halbtotale im Dreiviertelprofil und Gesicht im Profil
  e.push({ figur: f('_d0'), kamera: ganz(`${name}_d0`, hoehe, 30, { faktor: 1.8 }), licht: 'nacht', gesicht: 'neutral' });
  e.push({ figur: f('_d1'), kamera: profilKamera(`${name}_d1`), licht: 'nacht', gesicht: 'neutral' });
  return episode(`Beleg Kindly ${name}`, e);
}

export const KINDLY_FIGUREN_BELEGE = {
  'kindly-bear': ({ episode }) => figurBogen(episode, 'bear', 'bear', {
    hoehe: 1.85, gesichter: ['besorgt', 'leer', 'ruhig'],
    posen: [
      { was: 'stiefel_tippen', dauer: 1.2, phase: 0.42, azimut: 70, gesicht: 'besorgt' },
      { was: 'atem_anhalten', dauer: 0.25, gesicht: 'augen_zu' },
    ],
  }),
  'kindly-gus': ({ episode }) => figurBogen(episode, 'gus', 'gus', {
    hoehe: 1.85, gesichter: ['warnend', 'entschlossen', 'nass', 'leer'],
    posen: [
      { was: 'tippen', dauer: 1.2, phase: 0.26, azimut: 75, gesicht: 'ernst' },
      { was: 'tippen', dauer: 1.2, phase: 0.385, azimut: 75, gesicht: 'ernst' },
      { was: 'tippen', dauer: 1.2, phase: 0.385, azimut: 25, gesicht: 'ernst' },
      { was: 'zeigen', dauer: 0.25, params: { zu: [BUEHNE[0] + 3, 1.0, BUEHNE[2] + 1] }, gesicht: 'warnend' },
    ],
  }),
  'kindly-lunds': ({ episode }) => {
    const e = [];
    const mk = (id, modul, mehr = {}) => ({ id, modul, position: BUEHNE, blick: 90, ...mehr });
    for (const [k, az] of [[0, 0], [1, 35], [2, 90], [3, 180]]) e.push({ figur: mk(`l_a${k}`, 'lund'), kamera: ganz(`l_a${k}`, 1.75, az), gesicht: 'neutral' });
    ['neutral', 'lachend', 'leer', 'ernst'].forEach((g, k) => e.push({ figur: mk(`l_g${k}`, 'lund'), kamera: gesichtKamera(`l_g${k}`), gesicht: g }));
    for (const [k, az] of [[0, 0], [1, 35], [2, 90], [3, 180]]) e.push({ figur: mk(`m_a${k}`, 'mrs_lund'), kamera: ganz(`m_a${k}`, 1.6, az), gesicht: 'neutral' });
    ['neutral', 'gefasst', 'ernst', 'besorgt'].forEach((g, k) => e.push({ figur: mk(`m_g${k}`, 'mrs_lund'), kamera: gesichtKamera(`m_g${k}`), gesicht: g }));
    // Nacht: sie dampft, er (die Kopie) nicht
    e.push({ figur: mk('paar_m', 'mrs_lund', { position: [BUEHNE[0], BUEHNE[1], BUEHNE[2] + 0.45] }), extra: ['paar_l'], kamera: { baustein: 'statisch', ziel: [BUEHNE[0], 1.45, BUEHNE[2] + 0.2], blick: { azimut: 150, hoehe: 4, abstand: 3.0, bezug: [BUEHNE[0], 1.45, BUEHNE[2] + 0.2] }, fov: 36 }, licht: 'nacht', gesicht: 'gefasst' });
    return episode('Beleg Kindly Lunds', e, { partnerFiguren: [{ id: 'paar_l', modul: 'lund', params: { dampf: false }, position: [BUEHNE[0], BUEHNE[1], BUEHNE[2] - 0.35], blick: 90, gesicht: 'leer', sichtbar: false, blinzeln: false, atmen: false }] });
  },
  'kindly-fischer': ({ episode }) => {
    const e = [];
    const varianten = [
      { variante: 'kapuze' }, { variante: 'muetze' }, { variante: 'schirm' }, { variante: 'schapka' }, { variante: 'kappe' },
      { variante: 'muetze', alter: 'alt', farbe: '#5E6B3A' }, { variante: 'kapuze', alter: 'jung', farbe: '#7A3B36', haut: '#E3BC98' }, { variante: 'schirm', alter: 'alt', angel: true },
    ];
    varianten.forEach((p, k) => e.push({ figur: { id: `fi${k}`, modul: 'fischer', params: p, position: BUEHNE, blick: 90 }, kamera: ganz(`fi${k}`, 1.8, 25), gesicht: ['neutral', 'ernst', 'besorgt', 'neutral'][k % 4] }));
    varianten.slice(0, 5).forEach((p, k) => e.push({ figur: { id: `fg${k}`, modul: 'fischer', params: p, position: BUEHNE, blick: 90 }, kamera: gesichtKamera(`fg${k}`), gesicht: 'neutral' }));
    e.push({ figur: { id: 'fn', modul: 'fischer', params: { variante: 'kapuze' }, position: BUEHNE, blick: 90 }, kamera: profilKamera('fn'), licht: 'nacht', gesicht: 'neutral' });
    return episode('Beleg Kindly Fischer', e);
  },
  // Odell in Kindly: weiße Gläser, Brille in der Hand (hochhalten, beschlagen, klar, abwischen, aufsetzen),
  // Handglocke, Laterne, Atemdampf bei Nacht
  'kindly-odell': ({ episode }) => {
    const e = [];
    const o = (id, params, mehr = {}) => ({ id, modul: 'odell', params: { glaeser: 'weiss', dampf: true, ...params }, position: BUEHNE, blick: 90, ...mehr });
    e.push({ figur: o('o0', { links: 'laterne', rechts: 'glocke' }), kamera: ganz('o0', 1.72, 25), gesicht: 'streng' });
    e.push({ figur: o('o1', {}), kamera: gesichtKamera('o1', 15), gesicht: 'streng' });
    e.push({ figur: o('o2', {}), kamera: gesichtKamera('o2', 35), gesicht: 'pruefend' });
    e.push({ figur: o('o3', {}), kamera: gesichtKamera('o3', -20), gesicht: 'muede' });
    e.push({ figur: o('o3b', {}), kamera: gesichtKamera('o3b', 10), gesicht: 'streng/reden_b' });
    // Brille in der Hand: hochhalten, beschlagen, klar bleiben, abwischen, aufsetzen (Kamera über die Schulter)
    // über Odells rechte Schulter (er schaut nach +x, rechts ist +z): Kamera hinter-rechts, etwas höher
    const schulter = (id) => ({ baustein: 'statisch', ziel: `${id}.brille`, blick: { azimut: 305, hoehe: 14, abstand: 1.25, bezug: `${id}.brille` }, fov: 36 });
    const vorn = (id) => ({ baustein: 'statisch', ziel: `${id}.brille`, blick: { azimut: 90 + 10, hoehe: 5, abstand: 0.7, bezug: `${id}.brille` }, fov: 34 });
    e.push({ figur: o('o4', { brille: 'hand', links: 'laterne' }), kamera: ganz('o4', 1.72, 40), aktion: { was: 'brille_hoch', dauer: 0.5 }, gesicht: 'streng' });
    e.push({ figur: o('o5', { brille: 'hand' }), kamera: schulter('o5'), aktion: [{ was: 'brille_hoch', dauer: 0.01 }, { was: 'beschlagen', dauer: 0.35 }] });
    e.push({ figur: o('o6', { brille: 'hand' }), kamera: vorn('o6'), aktion: [{ was: 'brille_hoch', dauer: 0.01 }, { was: 'beschlagen', dauer: 0.35 }] });
    e.push({ figur: o('o7', { brille: 'hand' }), kamera: vorn('o7'), aktion: [{ was: 'brille_hoch', dauer: 0.01 }, { was: 'bleibt_klar', dauer: 0.8, phase: 0.5 }] });
    e.push({ figur: o('o8', { brille: 'hand' }), kamera: ganz('o8', 1.72, 40, { faktor: 1.5 }), aktion: [{ was: 'brille_hoch', dauer: 0.01 }, { was: 'beschlagen', dauer: 0.01 }, { was: 'abwischen', dauer: 1.2, phase: 0.45 }] });
    e.push({ figur: o('o9', { brille: 'hand' }), kamera: gesichtKamera('o9', 20), aktion: [{ was: 'brille_hoch', dauer: 0.01 }, { was: 'aufsetzen', dauer: 0.9, phase: 0.6 }], gesicht: 'streng' });
    e.push({ figur: o('o10', { brille: 'hand' }), kamera: gesichtKamera('o10', 20), aktion: [{ was: 'brille_hoch', dauer: 0.01 }, { was: 'aufsetzen', dauer: 0.9, phase: 1 }], gesicht: 'streng' });
    e.push({ figur: o('o11', { rechts: 'glocke' }), kamera: ganz('o11', 1.72, 30, { faktor: 1.5 }), aktion: { was: 'glocke_laeuten', dauer: 1.6, phase: 0.2 }, gesicht: 'streng' });
    e.push({ figur: o('o12', { links: 'laterne' }), kamera: ganz('o12', 1.72, 30), licht: 'nacht', gesicht: 'streng' });
    e.push({ figur: o('o13', {}), kamera: profilKamera('o13'), licht: 'nacht', gesicht: 'streng' });
    return episode('Beleg Kindly Odell', e);
  },
  'kindly-requisiten': ({ episode }) => {
    const e = [];
    const B = [BUEHNE[0], 1.4, BUEHNE[2]];
    const naheKam = (id, az, hoehe, abstand, fov = 34, ziel = 'mitte') => ({ baustein: 'statisch', ziel: `${id}.${ziel}`, blick: { azimut: az, hoehe, abstand, bezug: `${id}.${ziel}` }, fov });
    e.push({ figur: { id: 'br0', modul: 'brille_hand', position: B, blick: 90 }, kamera: naheKam('br0', 90, 5, 0.6) });
    e.push({ figur: { id: 'br1', modul: 'brille_hand', params: { beschlag: 1 }, position: B, blick: 90 }, kamera: naheKam('br1', 90, 5, 0.6) });
    e.push({ figur: { id: 'br2', modul: 'brille_hand', position: B, blick: 90 }, kamera: naheKam('br2', 90, 5, 0.6), aktion: { was: 'bleibt_klar', dauer: 0.8, phase: 0.5 }, licht: 'nacht' });
    e.push({ figur: { id: 'gl0', modul: 'handglocke', params: { hand: true }, position: B, blick: 90 }, kamera: naheKam('gl0', 110, 5, 0.7) });
    e.push({ figur: { id: 'gl1', modul: 'handglocke', params: { hand: true }, position: B, blick: 90 }, kamera: naheKam('gl1', 110, 5, 0.7), aktion: { was: 'laeuten', dauer: 1.6, phase: 0.2 } });
    e.push({ figur: { id: 'la0', modul: 'laterne', position: [BUEHNE[0], 0.04, BUEHNE[2]], blick: 90 }, kamera: naheKam('la0', 120, 10, 1.2, 36, 'glas'), licht: 'nacht' });
    // Stadtbuch auf dem Pult des Rathauses (Set rathaus der Orte-Werkstatt bei x 900)
    const R = [900, 1.05, 0];
    const buch = (id, params = {}) => ({ id, modul: 'stadtbuch', params, position: R, blick: 0 });
    // Pendellampe über dem Pult aus: ihr additiver Lichtkegel lag in der Draufsicht zwischen Kamera und Buch
    const lampeAus = [{ art: 'aus', ziel: 'rathaus.lampe', dauer: 0 }];
    const draufsicht = (id, ziel = 'mitte', abstand = 0.75, fov = 46) => ({ baustein: 'statisch', ziel: `${id}.${ziel}`, blick: { azimut: 0, hoehe: 62, abstand, bezug: `${id}.${ziel}` }, fov });
    e.push({ figur: buch('sb0'), kamera: draufsicht('sb0', 'mitte', 1.0), set: ['rathaus'], licht: 'innen_warm', licht_ereignisse: lampeAus });
    e.push({ figur: buch('sb1'), kamera: draufsicht('sb1', 'stummel', 0.32, 40), set: ['rathaus'], licht: 'innen_warm', licht_ereignisse: lampeAus });
    e.push({ figur: buch('sb2'), kamera: draufsicht('sb2', 'regel', 0.45, 40), set: ['rathaus'], licht: 'innen_warm', licht_ereignisse: lampeAus });
    e.push({ figur: buch('sb3', { blatt: 'rechts' }), kamera: draufsicht('sb3', 'mitte', 1.0), set: ['rathaus'], licht: 'innen_warm', licht_ereignisse: lampeAus });
    e.push({ figur: buch('sb4', { blatt: 'rechts' }), kamera: draufsicht('sb4', 'mitte', 1.0), set: ['rathaus'], licht: 'innen_warm', licht_ereignisse: lampeAus, aktion: { was: 'blaettern', dauer: 0.55, phase: 0.3 } });
    e.push({ figur: buch('sb5', { nachtrag: true }), kamera: draufsicht('sb5', 'regel', 0.55, 40), set: ['rathaus'], licht: 'innen_warm', licht_ereignisse: lampeAus });
    // Ortsschild am Stadtrand (Set stadtrand bei x −600, Anker [5,7, 0, −4,6], blick 180), Nacht mit Laterne
    const S = [-600 + 5.7, 0, -4.6];
    const schild = (id, params = {}) => ({ id, modul: 'ortsschild', params, position: S, blick: 180 });
    const schildKam = (id, ziel = 'mitte', abstand = 4.2, fov = 40) => ({ baustein: 'statisch', ziel: `${id}.${ziel}`, blick: { azimut: 180 - 8, hoehe: 2, abstand, bezug: `${id}.${ziel}` }, fov });
    e.push({ figur: schild('os0'), kamera: schildKam('os0'), set: ['rand'], licht: 'tag' });
    e.push({ figur: schild('os1'), kamera: schildKam('os1', 'mitte', 4.6), set: ['rand'], licht: 'nacht' });
    e.push({ figur: schild('os2'), kamera: schildKam('os2', 'zahl', 2.6, 40), set: ['rand'], licht: 'nacht', aktion: { was: 'umschreiben', dauer: 1.0, phase: 0.3 } });
    e.push({ figur: schild('os3'), kamera: schildKam('os3', 'zahl', 2.6, 40), set: ['rand'], licht: 'nacht', aktion: { was: 'umschreiben', dauer: 1.0, phase: 0.47 } });
    e.push({ figur: schild('os4'), kamera: schildKam('os4', 'zahl', 2.6, 40), set: ['rand'], licht: 'nacht', aktion: { was: 'umschreiben', dauer: 1.0, phase: 0.68 } });
    e.push({ figur: schild('os5'), kamera: schildKam('os5', 'mitte', 4.6), set: ['rand'], licht: 'nacht', aktion: { was: 'umschreiben', dauer: 1.0, phase: 0.9 } });
    e.push({ figur: schild('os6'), kamera: schildKam('os6', 'zahl', 2.6, 40), set: ['rand'], licht: 'nacht', aktion: { was: 'pinsel_sinken', dauer: 1.2, phase: 0.5 } });
    return episode('Beleg Kindly Requisiten', e, {
      sets: [{ id: 'strasse', modul: 'hauptstrasse' }, { id: 'marsh', modul: 'marsh_haus' }, { id: 'rathaus', modul: 'rathaus', position: [900, 0, 0] }, { id: 'rand', modul: 'stadtrand', position: [-600, 0, 0] }],
      lichtGruppen: ['strasse', 'marsh', 'rathaus', 'rand'],
    });
  },
  // Old Knuckles: auf der Straße (Form und Gesichter bei Tag) und im Set see unter dem Eis
  'kindly-monster': ({ episode }) => {
    const e = [];
    const P = [BUEHNE[0] + 2, 0.55, BUEHNE[2]];
    const ok = (id, mehr = {}) => ({ id, modul: 'old_knuckles', position: P, blick: 0, gesicht: 'glatt', params: { eis_y: P[1] + 0.53 }, ...mehr });
    const kam = (id, ziel, az, hoehe, abstand, fov = 44) => ({ baustein: 'statisch', ziel: `${id}.${ziel}`, blick: { azimut: az, hoehe, abstand, bezug: `${id}.${ziel}` }, fov });
    e.push({ figur: ok('k0'), kamera: kam('k0', 'mitte', 20, 70, 9.5, 50), licht: 'tag' });
    e.push({ figur: ok('k1'), kamera: kam('k1', 'mitte', 90, 12, 8, 50), licht: 'tag' });
    e.push({ figur: ok('k2'), kamera: kam('k2', 'brust', 30, 25, 4.2), licht: 'tag' });
    e.push({ figur: ok('k3'), kamera: kam('k3', 'gesicht', 0, 55, 1.6, 40), licht: 'tag' });
    e.push({ figur: ok('k4', { gesicht: 'lund' }), kamera: kam('k4', 'gesicht', 0, 60, 1.4, 40), licht: 'tag' });
    e.push({ figur: ok('k5', { gesicht: 'bear' }), kamera: kam('k5', 'gesicht', 0, 60, 1.4, 40), licht: 'tag' });
    e.push({ figur: ok('k6', { gesicht: 'bear' }), kamera: kam('k6', 'mund', 0, 70, 0.6, 36), licht: 'tag', aktion: { was: 'lippen_gus', dauer: 0.8, phase: 0.45 } });
    e.push({ figur: ok('k7', { gesicht: 'gus' }), kamera: kam('k7', 'gesicht', 0, 60, 1.4, 40), licht: 'tag' });
    e.push({ figur: ok('k8'), kamera: kam('k8', 'haende', 30, 20, 2.6), licht: 'tag', aktion: { was: 'klopfen_unten', dauer: 1.2, phase: 0.2 } });
    e.push({ figur: ok('k9', { gesicht: 'lund' }), kamera: kam('k9', 'kopf', 80, 8, 2.6), licht: 'tag', aktion: { was: 'andruecken', dauer: 0.8 } });
    // unter dem Eis im Set see (Anker wesen [2, −0,55, −26]), Untersicht und Draufsicht durchs klare Eis
    const SEE = [0, 0, 1000];
    // Kopf unter der Stelle „see.stelle“ (z −31,5): Mitte 3,15 m dahinter
    const W = [2, -0.55, 1000 - 31.5 + 3.15];
    const tief = [W[0], -1.15, W[2]];
    e.push({ figur: ok('u0', { position: tief, params: {} }), kamera: { baustein: 'statisch', punkt: 'see.unter_eis' }, set: ['see'], licht: 'see_unter' });
    e.push({ figur: ok('u1', { position: tief, params: {} }), kamera: { baustein: 'statisch', punkt: 'see.draufsicht' }, set: ['see'], licht: 'see_morgengrauen' });
    e.push({ figur: ok('u2', { position: W, params: {}, gesicht: 'lund' }), kamera: { baustein: 'statisch', punkt: 'see.gesicht_oben' }, set: ['see'], licht: 'see_nacht', aktion: { was: 'andruecken', dauer: 0.8 } });
    e.push({ figur: ok('u3', { position: tief, params: {} }), kamera: { baustein: 'statisch', punkt: 'see.unter_seite' }, set: ['see'], licht: 'see_unter', aktion: { was: 'klopfen_unten', dauer: 1.2, phase: 0.25 } });
    // Untersicht schräg von unten-seitlich: der ganze Körper, die Arme lang nach oben, Fäuste am Eis (Hook S1)
    e.push({ figur: ok('u4', { position: tief, params: {} }), kamera: { baustein: 'statisch', pos: [6.5, -2.6, 1000 - 26], ziel: [2, -0.7, 1000 - 28.5], fov: 58 }, set: ['see'], licht: 'see_unter' });
    void SEE;
    return episode('Beleg Kindly Old Knuckles', e, {
      sets: [{ id: 'strasse', modul: 'hauptstrasse' }, { id: 'marsh', modul: 'marsh_haus' },
        { id: 'see', modul: 'see', position: [0, 0, 1000], params: { ereignisse: [{ was: 'klar', start: 0, dauer: 0.001, mitte: [2, -31.5], radius: 1.4 }] } }],
      lichtGruppen: ['strasse', 'marsh', 'see'],
    });
  },
};

export { BUEHNE, MITTE, ganz, gesichtKamera, profilKamera, nah };
