#!/usr/bin/env node
// Prüfbilder (Kontaktbögen) für Figuren, Monster, Requisiten, Animationen und Sets.
// Erzeugt je Beleg eine kleine Episode (jede Einstellung nur 3 Bilder lang, der Bogen nimmt das
// mittlere), rendert sie mit render.mjs und legt den Bogen verkleinert als JPG nach engine/belege/.
// Episoden und Einzelbilder bleiben in horror/build/belege/ (nicht im Repo).
//
//   node test/belege.mjs                  alle Belege
//   node test/belege.mjs eli monster      nur diese
//   node test/belege.mjs --skala 0.5      Auflösung (Std 0.5333 = 576×1024)
//   node test/belege.mjs --liste          Namen der Belege zeigen
//
// Posen und Animationsphasen: Jede Einstellung zeigt eine eigene Instanz der Figur (nur in ihrer
// Einstellung sichtbar), deren Aktion so liegt, dass das mittlere Bild die gewünschte Phase zeigt.
// So stört keine gehaltene Pose die nächste Einstellung.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SET_BELEGE } from './belege-sets.mjs';
import { KINDLY_FIGUREN_BELEGE } from './belege-kindly-figuren.mjs';

const ENGINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = path.resolve(ENGINE, '..', 'build', 'belege');
const BELEGE = path.join(ENGINE, 'belege');
const FPS = 30;
const DAUER = 0.1; // 3 Bilder je Einstellung
const MITTE = 1 / FPS; // mittleres der 3 Bilder liegt 1 Bild nach dem Einstellungsbeginn

const args = process.argv.slice(2);
let skala = 0.5333;
const auswahl = [];
let liste = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--skala') skala = parseFloat(args[++i]);
  else if (args[i] === '--liste') liste = true;
  else auswahl.push(args[i]);
}

const PLATZHALTER = !!process.env.BELEG_PLATZHALTER;
export const LOOK = { licht: 'daemmerung', bloom: { staerke: 0.55, radius: 0.55, schwelle: 1.0 }, vignette: 0.3, korn: 0.02, toene: 'aces' };
export const ALLE_SETS = [
  { id: 'strasse', modul: 'hauptstrasse' },
  { id: 'marsh', modul: 'marsh_haus' },
  { id: 'haus', modul: 'marsh_innen' },
];
const AUSSEN = ['strasse', 'marsh'];
// Bühne für Figuren-Belege: Vorgarten der Marshs, Figur schaut zur Straße (+x)
const BUEHNE = PLATZHALTER ? [0, 0, 2.6] : [1.6, 0.04, 3.2]; // auf der Fahrbahn vor dem Marsh-Haus

// Tag-Einstellungen: Laternen und Fenster aus (die Sets leuchten sonst wie nachts).
export function lichtFuer(licht, start, sets = ['strasse', 'marsh', 'haus']) {
  const aus = ['tag'].includes(licht);
  return sets.map((s) => ({ art: aus ? 'aus' : 'an', ziel: `${s}.*`, start, dauer: 0 }));
}

// ---------- Episode zusammensetzen ----------
// einst: [{ figur?: {id, modul, params, position, blick, gesicht, pose}, aktion?: {was, params, dauer, phase},
//           gesicht?, kamera, set?, licht?, licht_anpassung?, tiefenunschaerfe?, extra?: [weitere sichtbare Figuren-IDs] }]
export function episode(titel, einst, { figurenFest = [], partnerFiguren = [], partikel = [], look = {}, sets = ALLE_SETS, lichtGruppen = ['strasse', 'marsh', 'haus'] } = {}) {
  const figuren = [...figurenFest.map((f) => ({ blinzeln: false, atmen: false, ...f })), ...partnerFiguren];
  const einstellungen = [];
  const lichtEreignisse = [];
  let t = 0;
  einst.forEach((e, i) => {
    const start = +t.toFixed(4), ende = +(t + DAUER).toFixed(4);
    t += DAUER;
    const r = { id: `B${String(i + 1).padStart(2, '0')}`, start, ende, kamera: e.kamera, licht: e.licht ?? 'daemmerung', aktionen: [], stellung: {} };
    if (!PLATZHALTER && e.set !== null) r.set = e.set ?? AUSSEN;
    if (e.licht_anpassung) r.licht_anpassung = e.licht_anpassung;
    if (e.tiefenunschaerfe) r.tiefenunschaerfe = e.tiefenunschaerfe;
    if (e.schatten_bereich) r.schatten_bereich = e.schatten_bereich;
    if (!PLATZHALTER) lichtEreignisse.push(...lichtFuer(r.licht, start, lichtGruppen), ...(e.licht_ereignisse ?? []).map((x) => ({ ...x, start: start + (x.ab ?? 0), ab: undefined })));
    if (e.figur) {
      const id = e.figur.id ?? `f${i + 1}`;
      figuren.push({ blinzeln: false, atmen: false, gesicht: 'neutral', ...e.figur, id, sichtbar: false });
      e.figurId = id;
    }
    if (e.gesicht && e.figurId) r.aktionen.push({ wer: e.figurId, was: 'gesicht', start, params: { name: e.gesicht } });
    for (const a of [].concat(e.aktion ?? [])) {
      // phase 0..1: Fortschritt der Aktion im mittleren Bild der Einstellung
      const dauer = a.dauer ?? 0.4;
      const startA = +(start + MITTE - (a.phase ?? 1) * dauer - (a.phase === undefined ? 0.02 : 0)).toFixed(4);
      r.aktionen.push({ wer: a.wer ?? e.figurId, was: a.was, start: startA, dauer, ...(a.ease ? { ease: a.ease } : {}), params: a.params ?? {}, nebenbei: true });
    }
    einstellungen.push({ r, e });
  });
  // Sichtbarkeit: in jeder Einstellung nur ihre Figur (plus "extra"), feste Figuren immer
  const fest = new Set(figurenFest.map((f) => f.id));
  for (const { r, e } of einstellungen) {
    for (const f of figuren) {
      if (fest.has(f.id)) continue;
      r.stellung[f.id] = { sichtbar: f.id === e.figurId || (e.extra ?? []).includes(f.id) };
    }
  }
  const s = PLATZHALTER ? [{ id: 'strasse', modul: 'platzhalter_strasse' }] : sets;
  return { titel, fps: FPS, aufloesung: [1080, 1920], seed: 11, look: { ...LOOK, ...look }, sets: s, figuren, einstellungen: einstellungen.map((x) => x.r), licht_ereignisse: lichtEreignisse, partikel };
}

// Kamera auf eine Figur: Ganzkörper (Anteil der Höhe) und Gesicht
const ganz = (id, hoehe, azimut = 0, { blick = 90, hoehenwinkel = 6, fov = 36, faktor = 2.35 } = {}) => ({
  baustein: 'statisch', ziel: { anker: `${id}.fuss`, versatz: [0, hoehe * 0.5, 0] },
  blick: { azimut: blick + azimut, hoehe: hoehenwinkel, abstand: hoehe * faktor, bezug: { anker: `${id}.fuss`, versatz: [0, hoehe * 0.5, 0] } }, fov,
});
const gesichtKamera = (id, azimut = 12, blick = 90) => ({
  baustein: 'statisch', ziel: `${id}.kopf`, blick: { azimut: blick + azimut, hoehe: 3, abstand: 2.0, bezug: `${id}.kopf` }, fov: 30,
});

// ---------- Figuren-Bogen ----------
function figurBogen(name, modul, { params = {}, hoehe = 1.8, extra = [], posen = [] } = {}) {
  const f = (k, mehr = {}) => ({ id: `${name}${k}`, modul, params, position: BUEHNE, blick: 90, ...mehr });
  const e = [];
  for (const [k, az] of [[0, 0], [1, 35], [2, 90], [3, 180], [4, -140]]) e.push({ figur: f(`_a${k}`), kamera: ganz(`${name}_a${k}`, hoehe, az), gesicht: k === 1 ? 'laecheln' : 'neutral' });
  const gesichter = ['neutral', 'angst', 'schock', 'laecheln', 'ernst', 'augen_zu', 'blinzeln', ...extra];
  gesichter.forEach((g, k) => e.push({ figur: f(`_g${k}`), kamera: gesichtKamera(`${name}_g${k}`), gesicht: g, tiefenunschaerfe: { fokus: `${name}_g${k}.kopf`, staerke: 0.8 } }));
  posen.forEach((p, k) => {
    const { figur, azimut, gesicht, ...aktion } = p;
    e.push({ figur: f(`_p${k}`, figur ? { params: { ...params, ...(figur.params ?? {}) } } : {}), kamera: ganz(`${name}_p${k}`, hoehe, azimut ?? 30), gesicht, aktion });
  });
  return episode(`Beleg Figur ${name}`, e);
}

// ---------- Animations-Bogen: je Animation einige Phasen ----------
function animBogen(name, eintraege) {
  const e = [];
  const partnerFiguren = [];
  for (const a of eintraege) {
    (a.phasen ?? [0.5, 1]).forEach((ph, k) => {
      const id = `${a.was}_${e.length}`;
      const figur = { id, modul: a.modul ?? 'eli', params: a.figParams ?? {}, position: a.position ?? BUEHNE, blick: a.blick ?? 90, ...(a.pose ? { pose: a.pose } : {}) };
      let params = a.params ?? {};
      const aktionen = [];
      const extra = [];
      if (a.partner) {
        // zweite Figur (Tür, Umarmte) bekommt je Phase eine eigene Instanz
        const pid = `${id}_partner`;
        partnerFiguren.push({ blinzeln: false, atmen: false, gesicht: a.partner.gesicht ?? 'neutral', ...a.partner, id: pid, sichtbar: false });
        extra.push(pid);
        for (const pa of a.partnerAktionen ?? []) aktionen.push({ ...pa, wer: pid, phase: ph });
        if (params.zu === '$partner') params = { ...params, zu: pid };
        else if (typeof params.zu === 'string' && params.zu.startsWith('$partner.')) params = { ...params, zu: pid + params.zu.slice(8) };
      }
      aktionen.unshift({ was: a.was, dauer: a.dauer ?? 0.4, phase: ph, params, ease: a.ease });
      e.push({ figur, aktion: aktionen, gesicht: a.gesicht, extra, kamera: ganz(id, a.hoehe ?? 1.8, a.azimut ?? 35, { faktor: a.faktor ?? 2.6 }) });
    });
  }
  return episode(`Beleg Animationen ${name}`, e, { partnerFiguren });
}

const BELEGLISTE = {
  eli: () => figurBogen('eli', 'eli', { extra: ['besorgt', 'entschlossen', 'schrei'], posen: [{ was: 'zeigen', params: { zu: [-3, 2.5, 8] }, dauer: 0.25 }, { was: 'mund_zuhalten', gesicht: 'angst', azimut: 20 }] }),
  june: () => figurBogen('june', 'june', { hoehe: 1.65, extra: ['verschlafen', 'zaehlt_b', 'leer', 'laecheln/reden_b'], posen: [{ was: 'schulterzucken', dauer: 0.7, phase: 0.45, gesicht: 'grinsen' }, { figur: { params: { rueckblende: true } }, was: 'idle_atmen', gesicht: 'laecheln', azimut: -30 }] }),
  dad: () => figurBogen('dad', 'dad', { extra: ['besorgt', 'entschlossen'], posen: [{ was: 'zeigen', params: { zu: [-3, 0.5, 6] }, dauer: 0.25, gesicht: 'entschlossen' }] }),
  owen: () => figurBogen('owen', 'owen', { hoehe: 1.75, extra: ['grinsen', 'besorgt'], posen: [{ was: 'rennen', dauer: 1.5, phase: 0.3, params: {}, gesicht: 'angst', azimut: 90 }] }),
  tess: () => figurBogen('tess', 'tess', { hoehe: 1.7, extra: ['grinsen', 'nervoes', 'schrei'], posen: [{ was: 'geste', params: { art: 'winken' }, dauer: 0.8, phase: 0.3, gesicht: 'grinsen' }] }),
  odell: () => figurBogen('odell', 'odell', { hoehe: 1.72, extra: ['streng', 'muede', 'besorgt', 'warnend'], posen: [{ was: 'geste', params: { art: 'finger_heben' }, dauer: 0.3, gesicht: 'streng' }, { was: 'geste', params: { art: 'finger_auf_lippen' }, dauer: 0.3, gesicht: 'warnend' }] }),
  nachbarn: () => {
    const varianten = [
      { variante: 'muetze' }, { variante: 'kopftuch' }, { variante: 'brille' }, { variante: 'glatze' },
      { variante: 'muetze', alter: 'alt', farbe: '#7A7D80' }, { variante: 'brille', alter: 'jung', farbe: '#7A3B36' },
      { variante: 'glatze', alter: 'jung', farbe: '#5E6B3A', haut: '#E3BC98' }, { variante: 'kopftuch', alter: 'alt', farbe: '#6A5038' },
    ];
    const e = [];
    varianten.forEach((p, k) => e.push({ figur: { id: `n${k}`, modul: 'nachbar', params: p, position: BUEHNE, blick: 90 }, kamera: ganz(`n${k}`, 1.75, 25), gesicht: ['neutral', 'besorgt', 'blick_gesenkt', 'ernst'][k % 4] }));
    varianten.slice(0, 4).forEach((p, k) => e.push({ figur: { id: `ng${k}`, modul: 'nachbar', params: p, position: BUEHNE, blick: 90 }, kamera: gesichtKamera(`ng${k}`), gesicht: ['neutral', 'besorgt', 'blick_gesenkt', 'angst'][k] }));
    e.push({ figur: { id: 'nohr', modul: 'nachbar', params: { variante: 'glatze' }, position: BUEHNE, blick: 90 }, kamera: ganz('nohr', 1.75, 20), gesicht: 'angst', aktion: { was: 'ohren_zuhalten', dauer: 0.4 } });
    return episode('Beleg Nachbarn', e);
  },
  monster: () => {
    const pos = PLATZHALTER ? [0, 0, -2] : [-8.4, 0, 1.6];
    const m = (k, mehr = {}) => ({ id: `mh${k}`, modul: 'mister_hundred', position: pos, blick: 90, gesicht: 'glatt', ...mehr });
    const weit = (id, az, { hoehe = 4, faktor = 2.4, fov = 40, versatz = 3.6 } = {}) => ({
      baustein: 'statisch', ziel: { anker: `${id}.fuss`, versatz: [0, versatz, 0] },
      blick: { azimut: 90 + az, hoehe, abstand: 7 * faktor, bezug: { anker: `${id}.fuss`, versatz: [0, versatz, 0] } }, fov,
    });
    const kopfNah = (id, az = 8, abstand = 2.6, hoehe = -4) => ({ baustein: 'statisch', ziel: `${id}.haende`, blick: { azimut: 90 + az, hoehe, abstand, bezug: `${id}.haende` }, fov: 34 });
    const e = [
      { figur: m(0), kamera: weit('mh0', 0) },
      { figur: m(1), kamera: weit('mh1', 35, { hoehe: -6, faktor: 1.6, fov: 52 }) },
      { figur: m(2), kamera: weit('mh2', 90) },
      { figur: m(3), kamera: weit('mh3', 180) },
      { figur: m(4), kamera: weit('mh4', 25, { hoehe: 2, faktor: 2.2 }), licht: 'nacht' },
      { figur: m(5), kamera: kopfNah('mh5'), licht: 'nacht', aktion: { was: 'zaehlen', dauer: 2, phase: 0.06, params: { takt: 0.85 } } },
      { figur: m(6), kamera: kopfNah('mh6', 0, 1.8, 0), aktion: { was: 'spaehen', dauer: 0.3, params: { seite: 'r' } } },
      { figur: m(7), kamera: kopfNah('mh7', 20, 3.2), aktion: { was: 'kopf_schief', dauer: 0.4 } },
      { figur: m(8), kamera: kopfNah('mh8', 40, 3.4), aktion: { was: 'kopf_drehen', dauer: 0.45, ease: 'ease_in', params: { winkel: 45 } } },
      { figur: m(9), kamera: kopfNah('mh9', 0, 2.2), aktion: { was: 'finger_schliessen', dauer: 0.4 } },
      { figur: m(10), kamera: weit('mh10', 165, { hoehe: 8, faktor: 1.2, versatz: 5 }), licht: 'nacht', aktion: { was: 'haende_weg', dauer: 0.6, phase: 0.8 } },
      { figur: m(11), kamera: weit('mh11', -90, { hoehe: 3 }), aktion: { was: 'vorbeugen', dauer: 1.4, params: { winkel: 65 } } },
      { figur: m(12), kamera: weit('mh12', 60), aktion: { was: 'stapfen', dauer: 3.6, phase: 0.18, params: { nach: [pos[0] + 2, pos[2]] } } },
      { figur: m(13), kamera: weit('mh13', 60), aktion: { was: 'stapfen', dauer: 3.6, phase: 1, params: { nach: [pos[0] + 2, pos[2]], halt_im_schritt: true } } },
      { figur: m(14), kamera: { baustein: 'statisch', ziel: 'mh14.fuss_r', blick: { azimut: 90 + 20, hoehe: 4, abstand: 2.2, bezug: 'mh14.fuss_r' }, fov: 40 }, licht: 'nacht' },
      { figur: m(15, { gesicht: 'june_gross' }), kamera: kopfNah('mh15', 0, 2.6), licht: 'nacht', aktion: { was: 'haende_weg', dauer: 0.6 } },
    ];
    return episode('Beleg Mister Hundred', e, { partikel: [{ art: 'atem', ort: 'mh5.mund', start: 0, dauer: 9 }] });
  },
  requisiten: () => {
    const e = [];
    const pk = (k, mehr = {}) => ({ id: `pk${k}`, modul: 'pickup', position: [5.5, 0, 9], blick: 180, ...mehr });
    e.push({ figur: pk(0), kamera: { baustein: 'statisch', ziel: 'pk0.mitte', blick: { azimut: 180 + 35, hoehe: 10, abstand: 8, bezug: 'pk0.mitte' }, fov: 40 } });
    e.push({ figur: pk(1, { params: { stiefel: true } }), aktion: { was: 'tuer_auf', dauer: 0.5 }, kamera: { baustein: 'statisch', ziel: 'pk1.sitz', blick: { azimut: 180 - 75, hoehe: 22, abstand: 2.2, bezug: 'pk1.sitz' }, fov: 42 } });
    const arten = ['eli', 'june', 'dad', 'owen', 'tess', 'grau'];
    arten.forEach((a, k) => e.push({ figur: { id: `sp${k}`, modul: 'schuhpaar', params: { art: a }, position: [-3, 0.16, 4], blick: 90 }, kamera: { baustein: 'statisch', ziel: `sp${k}.mitte`, blick: { azimut: 90 + 20, hoehe: 22, abstand: 1.3, bezug: `sp${k}.mitte` }, fov: 36 } }));
    e.push({ figur: { id: 'spx', modul: 'schuhpaar', params: { art: 'grau', ordnung: 'schief' }, position: [-3, 0.16, 4], blick: 90 }, kamera: { baustein: 'statisch', ziel: 'spx.mitte', blick: { azimut: 90 + 20, hoehe: 30, abstand: 1.5, bezug: 'spx.mitte' }, fov: 36 } });
    e.push({ figur: { id: 'tu0', modul: 'tuer', position: [-3, 0.16, 4], blick: 90, params: { fenster: true } }, aktion: { was: 'oeffnen', dauer: 0.5, phase: 0.6 }, kamera: { baustein: 'statisch', ziel: 'tu0.mitte', blick: { azimut: 90 + 30, hoehe: 5, abstand: 3.4, bezug: 'tu0.mitte' }, fov: 40 } });
    e.push({ figur: { id: 'lu0', modul: 'luke', position: [-3, 0.18, 4], blick: 90, params: { teppich: true } }, kamera: { baustein: 'statisch', ziel: 'lu0.mitte', blick: { azimut: 90 + 30, hoehe: 40, abstand: 2.2, bezug: 'lu0.mitte' }, fov: 40 } });
    e.push({ figur: { id: 'lu1', modul: 'luke', position: [-3, 0.18, 4], blick: 90 }, aktion: { was: 'oeffnen', dauer: 0.5 }, kamera: { baustein: 'statisch', ziel: 'lu1.mitte', blick: { azimut: 90 + 30, hoehe: 35, abstand: 2.4, bezug: 'lu1.mitte' }, fov: 40 } });
    return episode('Beleg Requisiten', e);
  },
  'animationen-a': () => animBogen('a', [
    { was: 'gehen', dauer: 1.5, phasen: [0.2, 0.4, 0.6], params: { nach: [BUEHNE[0] + 1.5, BUEHNE[2]] }, azimut: 70 },
    { was: 'rennen', dauer: 1.5, phasen: [0.2, 0.32, 0.44], params: { nach: [BUEHNE[0] + 4, BUEHNE[2]] }, azimut: 80, gesicht: 'angst' },
    { was: 'umdrehen', dauer: 0.3, phasen: [0.5, 1], params: { winkel: 180 } },
    { was: 'kopf_drehen', dauer: 0.2, phasen: [1], params: { winkel: 60 } },
    { was: 'umsehen', dauer: 1.4, phasen: [0.3, 0.72], gesicht: 'besorgt' },
    { was: 'zeigen', dauer: 0.25, phasen: [1], params: { zu: [BUEHNE[0] + 5, 2.6, BUEHNE[2] + 3] } },
    { was: 'erschrecken', dauer: 0.25, phasen: [0.6, 1], gesicht: 'schock' },
    { was: 'zurueckweichen', dauer: 1.2, phasen: [0.3, 0.7], gesicht: 'angst' },
    { was: 'ducken', dauer: 0.4, phasen: [0.5, 1], gesicht: 'angst' },
    { was: 'fallen', dauer: 0.6, phasen: [0.25, 0.45, 1], azimut: 80 },
  ]),
  'animationen-b': () => animBogen('b', [
    { was: 'sitzen', dauer: 0.8, phasen: [1] },
    { was: 'aufstehen', dauer: 0.8, phasen: [0.4, 1], pose: 'sitzen', azimut: 70 },
    { was: 'klopfen', dauer: 1.2, phasen: [0.3, 0.5] },
    { was: 'tuer_oeffnen', dauer: 0.7, phasen: [0.35, 1], params: { zu: '$partner.griff_vorn', seite: 'r' },
      partner: { modul: 'tuer', position: [BUEHNE[0] + 0.48, BUEHNE[1], BUEHNE[2] - 0.55], blick: -90 }, partnerAktionen: [{ was: 'oeffnen', dauer: 0.7, params: { winkel: -70 } }], azimut: -75 },
    { was: 'mund_zuhalten', dauer: 0.4, phasen: [1], gesicht: 'angst' },
    { was: 'mund_zuhalten', dauer: 0.4, phasen: [1], params: { seite: 'beide' }, gesicht: 'angst' },
    { was: 'ohren_zuhalten', dauer: 0.4, phasen: [1], gesicht: 'angst' },
    { was: 'umarmen', dauer: 0.5, phasen: [0.5, 1], params: { zu: '$partner' }, gesicht: 'augen_zu',
      partner: { modul: 'june', position: [BUEHNE[0] + 0.62, 0, BUEHNE[2]], blick: -90, gesicht: 'laecheln' }, azimut: 0 },
    { was: 'greifen', dauer: 0.4, phasen: [1], params: { zu: [BUEHNE[0] + 0.6, 0.9, BUEHNE[2] - 0.3] } },
    { was: 'schulterzucken', dauer: 0.7, phasen: [0.45], modul: 'june', gesicht: 'grinsen' },
    { was: 'kicken', dauer: 0.4, phasen: [0.5], azimut: 80 },
    { was: 'geste', dauer: 0.3, phasen: [1], params: { art: 'finger_heben' }, modul: 'odell' },
    { was: 'geste', dauer: 0.3, phasen: [1], params: { art: 'stopp' }, modul: 'odell' },
    { was: 'atem_anhalten', dauer: 0.25, phasen: [1], gesicht: 'angst' },
  ]),
  ...SET_BELEGE,
  ...KINDLY_FIGUREN_BELEGE,
};

if (liste) { console.log(Object.keys(BELEGLISTE).join('\n')); process.exit(0); }
fs.mkdirSync(BUILD, { recursive: true });
fs.mkdirSync(BELEGE, { recursive: true });
const namen = auswahl.length ? auswahl : Object.keys(BELEGLISTE);
for (const name of namen) {
  if (!BELEGLISTE[name]) { console.error(`Unbekannter Beleg ${name}. Vorhanden: ${Object.keys(BELEGLISTE).join(', ')}`); process.exit(1); }
  const ep = BELEGLISTE[name]({ episode, lichtFuer, LOOK, ALLE_SETS });
  const datei = path.join(BUILD, `beleg-${name}.json`);
  fs.writeFileSync(datei, JSON.stringify(ep, null, 1));
  const aus = path.join(BUILD, name);
  fs.rmSync(path.join(aus, 'bilder'), { recursive: true, force: true });
  const r = spawnSync('node', [path.join(ENGINE, 'render.mjs'), datei, '--prozesse', '2', '--format', 'jpg', '--qualitaet', '0.9', '--skala', String(skala), '--nur-bilder', '--aus', aus], { stdio: ['ignore', 'inherit', 'pipe'] });
  const fehler = r.stderr?.toString() ?? '';
  const ohneWarnungen = fehler.split('\n').filter((z) => z && !z.startsWith('Warnung:')).join('\n');
  if (ohneWarnungen) console.error(ohneWarnungen);
  if (r.status !== 0) { console.error(`Render von ${name} fehlgeschlagen`); process.exit(1); }
  const bogen = path.join(aus, `beleg-${name}-bogen.jpg`);
  const ziel = path.join(BELEGE, `${name}.jpg`);
  // verkleinert und stärker komprimiert: Belege bleiben deutlich unter 1 MB
  spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', bogen, '-vf', 'scale=1240:-2', '-q:v', '6', ziel], { stdio: 'inherit' });
  console.log(`Beleg ${name}: ${ziel} (${(fs.statSync(ziel).size / 1024).toFixed(0)} KB)`);
}
