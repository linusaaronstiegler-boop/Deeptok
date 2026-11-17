#!/usr/bin/env node
// Shotlisten-Compiler mit Messtor: Wortzeiten + Bildideen + Regie  ->  Episode-JSON für render.mjs.
//
//   node shotliste.mjs ../episoden/folge-01              baut episode.json (bricht bei Verstößen ab)
//   node shotliste.mjs ../episoden/folge-01 --entwurf    schreibt trotz Verstößen (nach horror/build/<folge>/)
//   node shotliste.mjs ../episoden/folge-01 --tabelle    zeigt die Shotliste als Tabelle
//
// Eingaben im Episoden-Ordner:
//   timing.json     Wortzeiten der fertigen Stimme (Sekunden ab Beginn von stimme.wav)
//   bildideen.json  Was jede Einstellung zeigt: Satz und Teilbilder ("ab_wort") legen die Schnitte fest,
//                   dazu Ort, Licht, Schlüsselwort, Reaktionsgesichter, Monster ja/nein
//   regie.mjs       Wie es gezeigt wird: Kamera, Figuren-Stellung, Hauptaktion je Einstellung (in Wörtern,
//                   nicht in Sekunden). Schlüssel je Einstellung: "<satz>" oder "<satz>:<ab_wort>"
//
// Grundregeln (horror/docs/bewegungs-spec.md 1.2–1.6, 3f; anhang-a-serienformat.md A4–A6):
//   - Geschnitten wird auf das Bild des Wortbeginns, 1 Bild davor (erlaubt: höchstens 2 Bilder davor).
//   - Jede Einstellung hat eine laufende Kamera (Standard: Push-in 7 %/s linear) und genau eine Hauptaktion,
//     die auf ihrem Schlüsselwort beginnt (lange Aktionen enden dort). Alles andere läuft "nebenbei".
//   - Gesichter tauschen auf Reaktionswörtern, Lichtereignisse liegen auf Verben.
//   - Nach dem letzten Wort harter Schnitt (≤ 0,2 s), dann 1,0 s Endkarte („PART 2“, „PART 3“ …) ohne Ton.
// Das Messtor am Ende prüft diese Regeln an der fertigen Episode und bricht bei Verstößen ab.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ENGINE = path.dirname(fileURLToPath(import.meta.url));
const FPS = 30;

// ---------- Grenzwerte des Messtors (Quelle in Klammern) ----------
export const REGELN = {
  schnittVorWort: [0, 2],          // Schnitt höchstens 2 Bilder vor dem Wortbeginn, nie danach (BEW 1.2 Regel 1)
  laenge: [0.7, 2.5],              // Einstellungslänge in s (Aufgabe; BEW 1.2: P10 ≥ 0,7, P90 ≤ 2,5)
  median: [1.4, 1.6],              // Median der Längen (BEW 1.2)
  proMinute: [38, 45],             // Einstellungen pro Minute (BEW 1.2, A4)
  pushRate: [0.04, 0.12],          // Push-in 4–12 %/s (BEW 1.3)
  bewegt: 0.9,                     // ≥ 90 % der Einstellungen mit Kamerabewegung ab Bild 1 (BEW 1.3)
  akzentMittel: [6, 10],           // Akzentfahrten alle 6–10 s im Mittel (BEW 1.3, A4)
  akzentLuecke: 10,                // und nie länger als 10 s ohne Akzentfahrt
  akzentAnkunft: 0.1,              // Ankunft einer Akzentfahrt aufs Wort ±0,1 s (BEW 1.3)
  aktionZumWort: 0.2,              // Hauptaktion beginnt (bzw. endet) auf dem Schlüsselwort ±0,2 s (BEW 1.4)
  gesichtZumWort: 0.3,             // Reaktionsgesicht ±0,3 s zum Reaktionswort (BEW 1.4 Regel 5)
  lichtZumWort: [-0.5, 0.2],       // Lichtereignis: Start bis 0,5 s vor dem Verb (gestaffelt 0,4 s vorher) (BEW 1.6)
  lichtAnzahl: [1, 3],             // 1–3 Lichtereignisse je Teil (BEW 1.6)
  snapZooms: [2, 3],               // 2–3 Snap-Zooms je Teil (A4)
  wackeln: 4,                      // höchstens 4-mal Wackeln je Teil (BEW 1.3, A4)
  monsterAnteil: [0.15, 0.25],     // Monster in 15–25 % der Einstellungen (A4)
  mundTakt: [0.1, 0.3],            // Mundformen bei wörtlicher Rede alle 0,1–0,3 s (BEW 1.4)
  endkarteAbstand: 0.2,            // harter Schnitt ≤ 0,2 s nach dem letzten Wort (A6)
  endkarteDauer: 1.0,              // Endkarte 1,0 s (A6)
  vordergrundMin: 1.5,             // Wisch-Objekte mindestens 1,5 m vor der Kamera (Review Folge 1)
};

// Akzentfahrten: Kamera-Bausteine mit Zweck (BEW 1.3 Regel 3). Snap-Zooms zählen extra (Regel 4).
const AKZENT = new Set(['tilt_up', 'crane_down_tilt', 'truck_side', 'track_follow', 'orbit', 'whip', 'dolly_out']);
const istAkzent = (k) => AKZENT.has(k.baustein) || (k.baustein === 'push_in' && /^ease_in/.test(k.profil ?? '') && (k.faktor ?? 1) >= 1.5);

// Standarddauern der Animationen (aus den Modulen in animationen/ und figuren/), damit der Compiler
// Aktionen mit Anker "ende" legen und das Bild für den Kontaktbogen wählen kann.
const DAUER = {
  arm_heben: 0.25, atem_anhalten: 0.25, aufstehen: 0.8, ducken: 0.4, erschrecken: 0.25, fallen: 0.6, gehen: 1.5,
  geste: 0.3, greifen: 0.4, idle_atmen: 0.3, kicken: 0.4, klopfen: 1.2, kopf_drehen: 0.2, mund_zuhalten: 0.4,
  ohren_zuhalten: 0.4, rennen: 1.5, schulterzucken: 0.7, sitzen: 0.8, tuer_oeffnen: 0.7, umarmen: 0.5, umdrehen: 0.3,
  umsehen: 1.4, vorbeugen: 1.4, zeigen: 0.25, zurueckweichen: 1.2,
  // Mister Hundred
  augen_zuhalten: 0.35, arme_senken: 0.3, liegen: 0.6, klettern: 0.8,
  zaehlen: 4, glimmen: 0.8, spaehen: 0.3, finger_spreizen: 0.3, finger_schliessen: 0.4, kopf_schief: 0.4,
  haende_weg: 0.6, haende_vor: 0.6, stapfen: 3.6,
  // Requisiten
  fahren: 2.0, tuer_auf: 0.5, tuer_zu: 0.3, oeffnen: 0.5, schliessen: 0.35,
  zuziehen: 0.25, aufziehen: 0.6, teppich_rollen: 0.8, leuchten: 0.4,
  // Rules of Kindly (README §20): Figuren, Old Knuckles, Odell, Requisiten
  stiefel_tippen: 1.2, tippen: 1.2, hauchen: 3.0, dampf: 0.01, gleiten: 1.5,
  klopfen_unten: 1.2, andruecken: 0.8, sinken: 1.0, lippen_gus: 0.8,
  brille_hoch: 0.5, beschlagen: 0.35, bleibt_klar: 0.8, abwischen: 1.2, aufsetzen: 0.9, brille_ab: 0.8, glocke_laeuten: 1.6,
  umschreiben: 1.0, pinsel_sinken: 1.2, blaettern: 0.55, laeuten: 1.6,
};

// Licht aus den Bildideen -> Preset der Engine, Anpassung und ob Lampen/Fenster leuchten.
const MORGEN = { haupt: { richtung: [0.8, 0.42, 0.25], farbe: '#ffe2c0' }, hemi: { himmel: '#e6ecf5' } };
const SONNENAUFGANG = {
  himmel: { zenit: '#3b4f8a', horizont: '#f6b27a', scheibe: { richtung: [0.08, 0.07, 0.99], farbe: '#ffd29a', groesse: 2.6, staerke: 6, glanz: 0.7 } },
  haupt: { richtung: [0.1, 0.25, 0.96], farbe: '#ffc08a', staerke: 2.3 }, nebel: { farbe: '#c9a49a', dichte: 0.014 },
};
// Kriechkeller (Teil 2): eigenes Preset in src/licht.js (fast dunkel, Taschenlampe, warme Streifen durch die
// Fugen). Review Teil 2: vorher innen_warm mit Füll-Licht 2,4, das las sich gemütlich statt bedrohlich.
const KELLER_LICHT = {};
// Kriechkeller am Morgen (Teil 3, Sätze 55–56): rosa Licht fällt flach durchs Lüftungsgitter (Rückwand bei
// lokal z = +2,6, Gitter bei x −2,25 … −1,75) und ist die Hauptquelle; das Füll-Licht ist wärmer und heller als
// nachts (Untergrenze der dunklen Orte: 22 je Einstellung). Taschenlampe und kaltes Lukenlicht sind dann aus.
const KELLER_MORGEN = {
  himmel: { zenit: '#2a2230', horizont: '#5a3c48', sterne: 0 },
  nebel: { farbe: '#3a2a30', dichte: 0.03 },
  hemi: { himmel: '#d9a8b4', boden: '#4a3630', staerke: 1.35 },
  haupt: { farbe: '#ffb4a6', staerke: 3.4, richtung: [-0.35, 0.32, 1.0], weich: 1.6 },
  kante: { farbe: '#ffd2c0', staerke: 0.35, richtung: [-0.3, 0.4, 0.85] },
  belichtung: 1.35,
  grade: { saettigung: 1.0, kontrast: 1.06, faerbung: [1.04, 0.99, 0.98] },
};
export const LICHT = {
  tag: { preset: 'tag', lampen: false },
  kriechkeller: { preset: 'kriechkeller', anpassung: KELLER_LICHT, lampen: false },
  'kriechkeller-morgen': { preset: 'kriechkeller', anpassung: KELLER_MORGEN, lampen: false },
  morgen: { preset: 'tag', anpassung: MORGEN, lampen: false },
  sonnenaufgang: { preset: 'daemmerung', anpassung: SONNENAUFGANG, lampen: false },
  daemmerung: { preset: 'daemmerung', lampen: true },
  nacht: { preset: 'nacht', lampen: true },
  'innen-nacht': { preset: 'innen_warm', lampen: true },
  'rueckblende-nacht': { preset: 'nacht', lampen: true },
  // Rules of Kindly (Winter; Presets in src/licht_kindly.js, Orte in README §19)
  'see-morgengrauen': { preset: 'see_morgengrauen', lampen: true },
  'see-daemmerung': { preset: 'see_daemmerung', lampen: true },
  'see-nacht': { preset: 'see_nacht', lampen: true },
  'see-unter': { preset: 'see_unter', lampen: false },
  huette: { preset: 'huette', lampen: true },
  rathaus: { preset: 'innen_warm', anpassung: { hemi: { staerke: 1.8 }, belichtung: 1.15 }, lampen: true },   // Prüfbild: Totale sonst Median 38
};
// Rückblenden sind entsättigt (Vergangenheit), damit man sie ohne Text erkennt.
const RUECKBLENDE = { grade: { saettigung: 0.62, kontrast: 1.04 } };
// Lampen, die der Compiler je Einstellung an- oder ausschaltet (Kerzen nicht: die bläst Eli aus).
// Kindly: see, huette, rathaus. Der Stadtrand ("rand") fehlt absichtlich: seine Laterne leuchtet das Ortsschild
// auf der Endkarte an. Es zählen nur Gruppen geladener Sets (lampenFuer), sonst bricht eine Folge ohne "haus" ab.
const LAMPEN = ['strasse.*', 'marsh.*', 'haus.kueche_lampe', 'haus.june_lampe', 'haus.eli_lampe', 'haus.flur_lampe', 'see.*', 'huette.*', 'rathaus.*'];
const lampenFuer = (sets) => LAMPEN.filter((z) => sets.some((s) => s.id === z.split('.')[0]));
// Orte der Bildideen -> sichtbare Sets (README 15.5)
const ORTE = {
  hauptstrasse: ['strasse', 'marsh'], 'marsh-innen': ['strasse', 'haus'], kriechkeller: ['keller'],
  // Rules of Kindly (Set-IDs in regie.sets: see, huette, rand, rathaus, schnee)
  see: ['see'], 'huette-innen': ['huette'], stadtrand: ['rand'], rathaus: ['rathaus'], 'hauptstrasse-schnee': ['strasse', 'marsh', 'schnee'],
};
// Tiefenunschärfe in Nah- und Detailaufnahmen (BEW 1.6)
const TIEFE_GROESSEN = new Set(['nah', 'gross', 'detail', 'ueber-schulter']);

// ---------- kleine Hilfen ----------
const r4 = (x) => +x.toFixed(4);
const norm = (s) => String(s).toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9']/g, '');
const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const fehler = (text) => { throw new Error(text); };

function argumente(argv) {
  const o = { entwurf: false, tabelle: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--entwurf') o.entwurf = true;
    else if (a === '--tabelle') o.tabelle = true;
    else if (a === '--aus') o.aus = argv[++i];
    else if (a.startsWith('--')) fehler(`Unbekannte Option ${a}`);
    else o.ordner = a;
  }
  if (!o.ordner) fehler('Aufruf: node shotliste.mjs <episoden-ordner> [--entwurf] [--tabelle] [--aus datei]');
  return o;
}

// ---------- 1. Einstellungen aus den Bildideen schneiden ----------
// Jeder Satz beginnt eine Einstellung (außer "neuer_schnitt": false), jedes Teilbild ab seinem "ab_wort".
function schneide(timing, ideen) {
  const W = timing.woerter;
  const roh = [];
  for (const s of timing.saetze) {
    const idee = ideen.saetze[String(s.nr)];
    if (!idee) fehler(`bildideen.json: Satz ${s.nr} fehlt`);
    const { teilbilder = [], ...satz } = idee;
    roh.push({ key: String(s.nr), satz: s.nr, ab: s.wort_von, idee: satz, neu: satz.neuer_schnitt !== false });
    let pos = s.wort_von;
    for (const tb of teilbilder) {
      const toks = tb.ab_wort.split(/\s+/).map(norm);
      let gef = -1;
      for (let j = pos + 1; j <= s.wort_bis && gef < 0; j++) {
        if (toks.every((t, k) => j + k <= s.wort_bis && norm(W[j + k].wort) === t)) gef = j;
      }
      if (gef < 0) fehler(`bildideen.json: Satz ${s.nr}, Teilbild ab "${tb.ab_wort}" nicht im Satz gefunden`);
      // Teilbilder erben vom Satz nur Block, Rückblende und Dialog; alles andere steht im Teilbild selbst.
      const erbe = { block: satz.block, ...(satz.rueckblende ? { rueckblende: true } : {}), ...(satz.dialog ? { dialog: satz.dialog } : {}) };
      roh.push({ key: `${s.nr}:${tb.ab_wort}`, satz: s.nr, ab: gef, idee: { ...erbe, ...tb }, neu: true });
      pos = gef;
    }
  }
  // Ohne Schnitt fortgesetzte Sätze hängen an der vorigen Einstellung.
  const einst = [];
  for (const r of roh) {
    if (r.neu || !einst.length) einst.push({ ...r, mit: [] });
    else einst.at(-1).mit.push(r);
  }
  einst.forEach((e, i) => { e.von = e.ab; e.bis = i + 1 < einst.length ? einst[i + 1].ab - 1 : W.length - 1; });
  return einst;
}

// ---------- 2. Episode bauen ----------
export async function kompiliere(ordner) {
  const lies = (n) => JSON.parse(fs.readFileSync(path.join(ordner, n), 'utf8'));
  const timing = lies('timing.json');
  const ideen = lies('bildideen.json');
  const regie = await import(pathToFileURL(path.join(ordner, 'regie.mjs')).href + `?t=${Date.now()}`);
  const W = timing.woerter;
  const einst = schneide(timing, ideen);
  const monsterIds = new Set(regie.monster ?? []);
  const figurIds = new Set(regie.figuren.map((f) => f.id));
  const R = regie.einstellungen;

  for (const k of Object.keys(R)) if (!einst.some((e) => e.key === k)) fehler(`regie.mjs: Einstellung "${k}" gibt es in den Bildideen nicht (Schlüssel: Satz oder Satz:ab_wort)`);

  // Schnittbilder: Wortbeginn minus 1 Bild (erste Einstellung ab Bild 0).
  const schnitt = einst.map((e, i) => (i === 0 ? 0 : Math.round(W[e.von].start * FPS) - 1));
  const letztesWort = W.at(-1);
  const nachlauf = regie.nachlauf ?? 0.14;
  const storyEnde = Math.round((letztesWort.ende + nachlauf) * FPS);
  const endkarteBilder = Math.round((regie.endkarte?.dauer ?? REGELN.endkarteDauer) * FPS);

  const sets = JSON.parse(JSON.stringify(regie.sets));
  const setParams = (id) => { const s = sets.find((x) => x.id === id); if (!s) fehler(`Set "${id}" fehlt in regie.sets`); return (s.params ??= {}); };
  // Ereignis an ein Set geben (params.ereignisse; das Set rechnet daraus in aktualisiere(t))
  const setEreignis = (id, ev) => { (setParams(id).ereignisse ??= []).push(ev); };
  const figuren = regie.figuren.map((f) => ({ position: [0, -40, 0], blick: 0, sichtbar: false, ...f }));
  const einstellungen = [];
  const lichtGlobal = [];
  let sichtbarVorher = new Set();

  for (const [i, e] of einst.entries()) {
    const r = R[e.key];
    if (!r) fehler(`regie.mjs: keine Regie für Einstellung "${e.key}" (${W.slice(e.von, e.bis + 1).map((w) => w.text).join(' ')})`);
    const idee = e.idee;
    const a = schnitt[i], b = i + 1 < einst.length ? schnitt[i + 1] : storyEnde;
    const start = r4(a / FPS), ende = r4(b / FPS);
    const woerter = W.slice(e.von, e.bis + 1);
    const text = woerter.map((w) => w.text).join(' ');
    const ctx = { key: e.key, von: e.von, bis: e.bis, start, ende };

    // Wort-Bezug: "town", "side#2" (zweites Vorkommen in der Einstellung) oder globaler Index.
    const wortIndex = (ref) => {
      if (typeof ref === 'number') return ref;
      const [txt, nr] = String(ref).split('#');
      let n = Number(nr ?? 1);
      for (let j = e.von; j <= e.bis; j++) if (norm(W[j].wort) === norm(txt) && --n === 0) return j;
      return fehler(`regie "${e.key}": Wort "${ref}" kommt in der Einstellung nicht vor („${text}“)`);
    };
    const zeit = (ref, versatz = 0) => r4(W[wortIndex(ref)].start + versatz);

    const aktionen = [];
    const lichtEreignisse = [];
    const partikel = [];
    const plan = { key: e.key, satz: e.satz, woerter: [e.von, e.bis], block: idee.block, groesse: idee.groesse, ort: idee.ort, modul: idee.modul };

    // --- Kamera: Wortbezüge in Sekunden umrechnen, Standard Push-in 7 %/s ---
    const k = JSON.parse(JSON.stringify({ baustein: 'push_in', ...(r.kamera ?? {}) }));
    if (['push_in', 'snap_zoom'].includes(k.baustein) && k.rate === undefined && k.faktor === undefined) k.rate = 0.07;
    if (k.ankunft_wort !== undefined) { k.ankunft = zeit(k.ankunft_wort, k.ankunft_versatz ?? 0); delete k.ankunft_wort; delete k.ankunft_versatz; }
    // Fahrten mit eigenem Start (Kran, Tilt) beginnen vor dem Schnitt, damit sie im ersten Bild schon fahren.
    if (['tilt_up', 'crane_down_tilt'].includes(k.baustein) && k.start === undefined) k.start = r4(start - (k.vorlauf_s ?? 0.25));
    delete k.vorlauf_s;
    if (k.zeit_wort !== undefined) { k.zeit = zeit(k.zeit_wort, k.zeit_versatz ?? 0); delete k.zeit_wort; delete k.zeit_versatz; }
    if (k.vordergrund?.wort !== undefined) { k.vordergrund.zeit = zeit(k.vordergrund.wort); delete k.vordergrund.wort; }
    for (const z of k.zusaetze ?? []) {
      if (z.baustein === 'shake' && z.wort !== undefined) { z.start = zeit(z.wort, z.versatz ?? 0.05); delete z.wort; delete z.versatz; }
      if (z.baustein === 'snap_zoom' && z.wort !== undefined) { z.zeit = zeit(z.wort, z.versatz ?? 0); delete z.wort; delete z.versatz; }
    }

    // --- Figuren: Neuanfang am Schnitt für alle sichtbaren, alle anderen ausblenden ---
    const stellung = {};
    const sichtbar = new Set(Object.keys(r.figuren ?? {}));
    for (const [id, st] of Object.entries(r.figuren ?? {})) {
      if (!figurIds.has(id)) fehler(`regie "${e.key}": Figur "${id}" fehlt in regie.figuren`);
      if (!Array.isArray(st.position) || st.position.length !== 3) fehler(`regie "${e.key}": Figur ${id} braucht position [x,y,z] (Zahlen)`);
      stellung[id] = { neu: true, sichtbar: true, ...st };
    }
    for (const id of sichtbarVorher) if (!sichtbar.has(id)) stellung[id] = { sichtbar: false };
    sichtbarVorher = sichtbar;

    // --- Hauptaktion: genau eine, auf ihrem Schlüsselwort ---
    const h = r.haupt ?? fehler(`regie "${e.key}": "haupt" fehlt (genau eine Hauptaktion je Einstellung)`);
    if (Array.isArray(h)) fehler(`regie "${e.key}": "haupt" ist eine Liste – genau eine Hauptaktion, weitere unter "neben"`);
    const hWi = wortIndex(h.wort ?? idee.schluesselwort);
    const hWort = W[hWi];
    const tw = r4(hWort.start + (h.versatz ?? 0));
    const art = h.art ?? 'aktion';
    let hStart = tw, hEnde = tw;
    if (art === 'aktion') {
      if (!sichtbar.has(h.wer)) fehler(`regie "${e.key}": Hauptaktion von "${h.wer}", die Figur ist in der Einstellung nicht sichtbar`);
      const dauer = h.dauer ?? DAUER[h.was] ?? fehler(`regie "${e.key}": Dauer für "${h.was}" unbekannt, bitte "dauer" angeben`);
      hStart = h.anker === 'ende' ? r4(tw - dauer) : tw;
      hEnde = r4(hStart + dauer);
      aktionen.push({ wer: h.wer, was: h.was, start: hStart, dauer, ...(h.ease ? { ease: h.ease } : {}), ...(h.params ? { params: h.params } : {}) });
    } else if (art === 'gesicht') {
      aktionen.push({ wer: h.wer, was: 'gesicht', start: tw, params: { name: h.name } });
    } else if (art === 'licht') {
      const { art: _a, wort: _w, versatz: _v, vorlauf = 0, licht_art: la, ...rest } = h;
      hStart = r4(tw - vorlauf);
      hEnde = r4(hStart + (rest.dauer ?? 0.4) + (rest.ziele ? (rest.ziele.length - 1) * (rest.versatz_ziele ?? 0) : 0));
      const ev = { art: la, start: hStart, ...rest };
      if (ev.versatz_ziele !== undefined) { ev.versatz = ev.versatz_ziele; delete ev.versatz_ziele; }
      lichtEreignisse.push(ev);
    } else if (art === 'set') {
      // Set-Ereignis: die Zeiger der Turmuhr springen (hauptstrasse params.uhr.spruenge) oder ein
      // Ereignis eines Sets mit params.ereignisse (kriechkeller: biegen, finger, glut). Anker "ende" wie bei Aktionen.
      if (h.was === 'uhr') {
        const p = setParams(h.set ?? 'strasse');
        p.uhr ??= { zeit: h.von ?? '11:58', spruenge: [] };
        p.uhr.spruenge.push({ start: tw, zeit: h.zeit });
      } else {
        const dauer = h.dauer ?? 0.6;
        hStart = h.anker === 'ende' ? r4(tw - dauer) : tw;
        hEnde = r4(hStart + dauer);
        setEreignis(h.set ?? fehler(`regie "${e.key}": Set-Ereignis "${h.was}" braucht "set"`), { was: h.was, start: hStart, dauer, ...(h.params ?? {}) });
      }
    } else if (art === 'partikel') {
      const { art: _a, wort: _w, versatz: _v, vorlauf = 0, partikel_art: pa, ueber_schnitt = false, ...rest } = h;
      hStart = r4(tw - vorlauf);
      // Review Teil 3: Der Atem aus E16 lief 0,6 s über den Schnitt und lag in E17 als unscharfer weißer Ball
      // vor der Linse (die nächste Kamera steht woanders). Partikel enden deshalb mit ihrer Einstellung,
      // außer die Regie sagt ausdrücklich ueber_schnitt: true.
      const pDauer = ueber_schnitt ? (rest.dauer ?? 1.5) : Math.min(rest.dauer ?? 1.5, ende - hStart);
      partikel.push({ art: pa, start: hStart, ...rest, dauer: r4(pDauer) });
      hEnde = r4(hStart + 0.5);
    } else if (art === 'kamera') {
      // Die Kamera selbst ist die Hauptaktion (Insert, Ergebnis-Bild, Enthüllung): ihr Schlüsselzeitpunkt
      // (Ankunft, Snap, Wisch) muss auf dem Wort liegen.
      hStart = tw; hEnde = tw;
    } else fehler(`regie "${e.key}": haupt.art "${art}" unbekannt (aktion, gesicht, licht, set, partikel, kamera)`);
    plan.haupt = { art, ...(h.wer ? { wer: h.wer } : {}), ...(h.was ? { was: h.was } : {}), ...(h.name ? { name: h.name } : {}), wort: hWort.wort, wort_i: hWi, wort_start: hWort.start, start: hStart, ende: hEnde, anker: h.anker ?? 'start', schluesselwort_idee: idee.schluesselwort ?? null };

    // --- Nebenaktionen (laufen mit, zählen nicht als Hauptaktion) ---
    for (const n of r.neben ?? []) {
      const s0 = n.ab === 'start' ? start : n.zeit !== undefined ? n.zeit : zeit(n.wort, n.versatz ?? 0);
      const dauer = n.dauer ?? DAUER[n.was];
      const st = n.anker === 'ende' && dauer ? r4(s0 - dauer) : r4(s0 + (n.ab === 'start' ? n.versatz ?? 0 : 0));
      const { wort: _w, versatz: _v, ab: _ab, anker: _an, zeit: _z, ...rest } = n;
      aktionen.push({ ...rest, start: st, ...(dauer !== undefined && !['gesicht', 'sichtbar'].includes(n.was) ? { dauer } : {}), nebenbei: true });
    }

    // --- weitere Set-Ereignisse (nebenbei, z. B. Glut der Fingerschatten, Dielen biegen weiter) ---
    for (const s of r.set_ereignisse ?? []) {
      const { set: sid, wort, versatz = 0, anker: an, dauer = 0.6, ...rest } = s;
      const t0 = wort !== undefined ? zeit(wort, versatz) : r4(start + versatz);
      setEreignis(sid, { ...rest, start: an === 'ende' ? r4(t0 - dauer) : t0, dauer });
    }

    // --- Reaktionsgesichter auf ihren Wörtern ---
    plan.gesichter = [];
    for (const g of r.gesichter ?? []) {
      const gi = wortIndex(g.wort);
      const t = r4(W[gi].start + (g.versatz ?? 0));
      aktionen.push({ wer: g.wer, was: 'gesicht', start: t, params: { name: g.name } });
      plan.gesichter.push({ wer: g.wer, name: g.name, wort: W[gi].wort, wort_start: W[gi].start, start: t });
    }

    // --- Mundformen bei wörtlicher Rede (je Wort ein Tausch, lange Wörter zweimal) oder stummes Zählen ---
    if (r.mund) {
      const { wer, miene, art: mArt = 'rede' } = r.mund;
      const takte = [];
      if (mArt === 'zaehlen') {
        // Lautlos bis hundert zählen: Mundformen zaehlt_a/b/c im festen Takt über die Einstellung
        const takt = r.mund.takt ?? 0.22;
        const ab = r.mund.wort !== undefined ? zeit(r.mund.wort, r.mund.versatz ?? 0) : start;
        const bis = r.mund.bis !== undefined ? zeit(r.mund.bis) : ende;
        const formen = ['zaehlt_a', 'zaehlt_b', 'zaehlt_c', 'zaehlt_b'];
        for (let t = ab, n = 0; t < bis - 0.02; t += takt, n++) takte.push([r4(t), formen[n % formen.length]]);
      } else {
        const formen = ['reden_a', 'reden_b', 'reden_c'];
        let n = 0;
        for (let j = e.von; j <= e.bis; j++) {
          const w = W[j];
          takte.push([w.start, `${miene}/${formen[n++ % 3]}`]);
          if (w.ende - w.start > 0.32) takte.push([r4((w.start + w.ende) / 2), `${miene}/${formen[n++ % 3]}`]);
          const naechst = j < e.bis ? W[j + 1].start : ende;
          if (naechst - w.ende > 0.12) takte.push([w.ende, miene]);
        }
      }
      for (const [t, name] of takte) aktionen.push({ wer, was: 'gesicht', start: t, params: { name } });
      plan.mund = { wer, art: mArt, wechsel: takte.length };
    }

    // --- weitere Lichtereignisse (auf Verben) und Partikel ---
    for (const l of r.licht_ereignisse ?? []) {
      const { wort, versatz: _v, vorlauf = 0, licht_art: la, versatz_ziele, ...rest } = l;
      lichtEreignisse.push({ art: la, start: r4(zeit(wort) - vorlauf), ...rest, ...(versatz_ziele !== undefined ? { versatz: versatz_ziele } : {}) });
    }
    for (const p of r.partikel ?? []) {
      const { wort, vorlauf = 0, bis, ...rest } = p;
      const s0 = wort !== undefined ? r4(zeit(wort) - vorlauf) : start;
      // Sichtbar nur in dieser Einstellung (Partikel-Fenster), wenn nichts anderes gesagt ist
      const s1 = bis !== undefined ? zeit(bis) : ende;
      partikel.push({ start: s0, dauer: r4(s1 - s0), ...rest });
    }
    // Turmuhr auf eine Uhrzeit stellen, sobald die Einstellung beginnt (Tag, Dämmerung)
    if (r.uhr) {
      const p = setParams('strasse');
      p.uhr ??= { zeit: r.uhr, spruenge: [] };
      // ein halbes Bild vor dem Schnitt: Schnittzeit und Bildzeit sind gerundet, sonst zeigt das erste
      // Bild der Einstellung noch die alte Uhrzeit (Review Folge 1: Blitzer bei 81,77 s)
      p.uhr.spruenge.push({ start: r4(start - 0.5 / FPS), zeit: r.uhr });
    }

    // --- Licht: Preset, Anpassung, Lampen an/aus am Schnitt ---
    const lichtName = r.licht ?? idee.licht;
    const L = LICHT[lichtName] ?? fehler(`Einstellung "${e.key}": Licht "${lichtName}" unbekannt (${Object.keys(LICHT).join(', ')})`);
    let anpassung = { ...(L.anpassung ?? {}) };
    if (idee.rueckblende) anpassung = tief(anpassung, RUECKBLENDE);
    if (r.licht_anpassung) anpassung = tief(anpassung, r.licht_anpassung);
    const lampen = r.lampen ?? L.lampen;
    for (const ziel of lampenFuer(sets)) lichtGlobal.push({ art: lampen ? 'an' : 'aus', ziel, start, dauer: 0, quelle: `auto:${e.key}` });
    lichtGlobal.push({ art: 'an', ziel: 'umgebung', start, dauer: 0, quelle: `auto:${e.key}` });
    for (const [ziel, an] of Object.entries(r.lampen_einzeln ?? {})) lichtGlobal.push({ art: an ? 'an' : 'aus', ziel, start, dauer: 0, quelle: `auto:${e.key}` });

    // --- Hauptsache (für Kompositionsprüfung und Tiefenunschärfe) ---
    const hauptsache = r.hauptsache ?? (typeof k.ziel === 'string' ? k.ziel : null);
    plan.hauptsache = hauptsache;
    let tiefe = r.tiefe;
    // Fokus auf die Hauptsache: Anker, Punkt [x, y, z] oder bei mehreren Ankern der erste
    const istPunkt = Array.isArray(hauptsache) && hauptsache.length === 3 && hauptsache.every((v) => typeof v === 'number');
    if (tiefe === undefined && TIEFE_GROESSEN.has(idee.groesse)) tiefe = { fokus: typeof hauptsache === 'string' || istPunkt ? hauptsache : [].concat(hauptsache ?? [])[0] ?? undefined, staerke: 0.8 };
    if (tiefe && tiefe.fokus === undefined) tiefe = true;

    // --- Bild für den Kontaktbogen: wenn das Gesagte zu sehen ist (nach Hauptaktion/Ankunft) ---
    let bz = (start + ende) / 2;
    if (art === 'aktion') bz = Math.max(hStart + 0.25, hEnde + 0.1);
    else if (art === 'kamera') bz = Math.max(k.ankunft ?? k.zeit ?? tw, tw) + 0.15;
    else if (art === 'licht') bz = hEnde + 0.1;
    else bz = tw + 0.2;
    if (r.bogen_wort !== undefined) bz = zeit(r.bogen_wort, r.bogen_versatz ?? 0);
    plan.bogen_zeit = r4(Math.min(ende - 2 / FPS, Math.max(start + 2 / FPS, bz)));
    plan.akzent = istAkzent(k);
    plan.monster = [...sichtbar].some((id) => monsterIds.has(id));
    plan.sichtbar = [...sichtbar];
    if (idee.rueckblende) plan.rueckblende = true;
    if (e.mit.length) plan.ohne_schnitt = e.mit.map((m) => m.key);

    const einstellung = {
      id: `E${String(i + 1).padStart(2, '0')}`, start, ende,
      set: r.set ?? ORTE[idee.ort] ?? fehler(`Einstellung "${e.key}": Ort "${idee.ort}" unbekannt`),
      licht: L.preset,
      ...(Object.keys(anpassung).length ? { licht_anpassung: anpassung } : {}),
      kamera: k,
      stellung,
      aktionen: aktionen.sort((x, y) => x.start - y.start),
      ...(lichtEreignisse.length ? { licht_ereignisse: lichtEreignisse } : {}),
      ...(partikel.length ? { partikel } : {}),
      ...(tiefe ? { tiefenunschaerfe: tiefe } : {}),
      ...(r.bewegungsunschaerfe ? { bewegungsunschaerfe: r.bewegungsunschaerfe } : {}),
      schatten_bereich: r.schatten_bereich ?? ({ 'marsh-innen': 16, kriechkeller: 10, 'huette-innen': 6, rathaus: 12 }[einst[i].idee.ort] ?? 24),
      ...(r.schatten_mitte ? { schatten_mitte: r.schatten_mitte } : {}),
      text,
      plan,
    };
    einstellungen.push(einstellung);
  }

  // --- Endkarte „PART n“ (Text aus regie.endkarte): harter Schnitt nach dem letzten Wort, 1,0 s, ohne Ton ---
  // regie.endkarte === false (Finale, Teil 3): keine Endkarte. Das Video endet hart nach dem letzten Wort
  // (Nachlauf ≤ 0,2 s) und läuft in der App als Schleife wieder in das erste Bild.
  const ohneEndkarte = regie.endkarte === false;
  for (const s of sets) s.params?.uhr?.spruenge?.sort((a, b) => a.start - b.start);
  if (ohneEndkarte) {
    const episode = {
      titel: regie.titel ?? 'Folge', fps: FPS, aufloesung: [1080, 1920], seed: regie.seed ?? 1,
      look: regie.look ?? {}, sets, figuren, einstellungen, licht_ereignisse: lichtGlobal, partikel: regie.partikel ?? [],
    };
    return { episode, einst, timing, ideen, regie, storyEnde, monsterIds, ohneEndkarte };
  }
  const ek = regie.endkarte ?? {};
  const ekStellung = {};
  for (const id of sichtbarVorher) ekStellung[id] = { sichtbar: false };
  // Rules of Kindly: Die Endkarte (Ortsschild) hat eigene Figuren und Aktionen (Odells Pinsel malt die Zahl um).
  // Zeiten der Aktionen und Partikel relativ zum ersten Bild der Endkarte ("ab", Std 0).
  for (const [id, st] of Object.entries(ek.figuren ?? {})) {
    if (!figurIds.has(id)) fehler(`regie.endkarte: Figur "${id}" fehlt in regie.figuren`);
    ekStellung[id] = { neu: true, sichtbar: true, ...st };
  }
  const ekStart = r4(storyEnde / FPS), ekEnde = r4((storyEnde + endkarteBilder) / FPS);
  const ekAktionen = (ek.aktionen ?? []).map(({ ab = 0, ...a }) => ({ ...a, start: r4(ekStart + ab) }));
  const ekPartikel = (ek.partikel ?? []).map(({ ab = 0, ...p }) => ({ start: r4(ekStart + ab), dauer: r4(ekEnde - ekStart - ab), ...p }));
  for (const ziel of lampenFuer(sets)) lichtGlobal.push({ art: 'aus', ziel, start: ekStart, dauer: 0, quelle: 'auto:endkarte' });
  lichtGlobal.push({ art: 'an', ziel: 'umgebung', start: ekStart, dauer: 0, quelle: 'auto:endkarte' });
  for (const [ziel, an] of Object.entries(ek.lampen_einzeln ?? {})) lichtGlobal.push({ art: an ? 'an' : 'aus', ziel, start: ekStart, dauer: 0, quelle: 'auto:endkarte' });
  einstellungen.push({
    id: 'END', start: ekStart, ende: ekEnde, set: ek.set ?? ['karte'], licht: ek.licht ?? 'nacht',
    licht_anpassung: ek.licht_anpassung ?? { nebel: { dichte: 0.0001 } },
    kamera: { baustein: 'push_in', rate: 0.07, ...(ek.kamera ?? { punkt: 'karte.karte' }) },
    stellung: ekStellung, aktionen: ekAktionen, ...(ekPartikel.length ? { partikel: ekPartikel } : {}), schatten_bereich: 12, text: ek.text ?? 'PART 2',
    plan: { key: 'endkarte', endkarte: true, bogen_zeit: r4(ekStart + (ek.bogen_ab ?? 0.5)), hauptsache: ek.hauptsache ?? 'karte.mitte', haupt: { art: 'kamera' }, sichtbar: Object.keys(ek.figuren ?? {}) },
  });

  for (const s of sets) s.params?.uhr?.spruenge?.sort((a, b) => a.start - b.start);
  const episode = {
    titel: regie.titel ?? 'Folge', fps: FPS, aufloesung: [1080, 1920], seed: regie.seed ?? 1,
    look: regie.look ?? {}, sets, figuren, einstellungen, licht_ereignisse: lichtGlobal, partikel: regie.partikel ?? [],
  };
  return { episode, einst, timing, ideen, regie, storyEnde, monsterIds };
}

// Tiefes Mischen für Licht-Anpassungen
function tief(a, b) {
  const r = { ...a };
  for (const [k, v] of Object.entries(b)) r[k] = v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' ? tief(a[k], v) : v;
  return r;
}

// ---------- 3. Messtor ----------
// Prüft die fertige Episode gegen die Regeln. Liefert Kennzahlen und eine Liste der Verstöße.
export function messtor({ episode, einst, timing, monsterIds, ohneEndkarte = false, regie = {} }) {
  const W = timing.woerter;
  const V = [];
  const kz = {};
  const story = episode.einstellungen.filter((e) => !e.plan?.endkarte);
  const endkarte = episode.einstellungen.find((e) => e.plan?.endkarte);
  const bild = (s) => Math.round(s * FPS);

  // M1 Schnitt auf Wortbeginn: Bild des Wortbeginns, höchstens 2 Bilder davor
  let imFenster = 0;
  story.forEach((e, i) => {
    if (i === 0) { if (bild(e.start) !== 0) V.push(`M1 ${e.id}: erste Einstellung beginnt nicht bei Bild 0`); return; }
    const w = W[e.plan.woerter[0]];
    const vor = Math.round(w.start * FPS) - bild(e.start); // Bilder vor dem Wortbeginn
    if (vor < REGELN.schnittVorWort[0] || vor > REGELN.schnittVorWort[1]) V.push(`M1 ${e.id}: Schnitt ${vor} Bilder vor „${w.wort}“ (erlaubt ${REGELN.schnittVorWort.join('–')})`);
    if (Math.abs(e.start - w.start) <= 0.15) imFenster++;
  });
  kz.schnitte_im_fenster_015 = +(imFenster / Math.max(1, story.length - 1)).toFixed(3);

  // M2 Längen, Median, Takt
  const laengen = story.map((e) => (bild(e.ende) - bild(e.start)) / FPS);
  story.forEach((e, i) => {
    if (laengen[i] < REGELN.laenge[0] - 1e-6 || laengen[i] > REGELN.laenge[1] + 1e-6) V.push(`M2 ${e.id} (${e.plan.key}): Länge ${laengen[i].toFixed(2)} s außerhalb ${REGELN.laenge.join('–')} s`);
  });
  const storyDauer = story.at(-1).ende - story[0].start;
  kz.einstellungen = story.length;
  kz.median_s = +median(laengen).toFixed(3);
  kz.pro_minute = +((story.length / storyDauer) * 60).toFixed(1);
  kz.kuerzeste_s = +Math.min(...laengen).toFixed(2);
  kz.laengste_s = +Math.max(...laengen).toFixed(2);
  if (kz.median_s < REGELN.median[0] || kz.median_s > REGELN.median[1]) V.push(`M2 Median ${kz.median_s} s außerhalb ${REGELN.median.join('–')} s`);
  if (kz.pro_minute < REGELN.proMinute[0] || kz.pro_minute > REGELN.proMinute[1]) V.push(`M2 ${kz.pro_minute} Einstellungen/min außerhalb ${REGELN.proMinute.join('–')}`);

  // M3 Kamera läuft in jeder Einstellung; Push-in-Tempo 4–12 %/s
  let bewegt = 0;
  for (const e of story) {
    const k = e.kamera;
    const steht = k.baustein === 'statisch' && !(k.rate > 0);
    if (!steht) bewegt++;
    if (k.baustein === 'push_in' && k.rate !== undefined && !(Math.abs(k.rate) >= REGELN.pushRate[0] - 1e-9 && Math.abs(k.rate) <= REGELN.pushRate[1] + 1e-9)) V.push(`M3 ${e.id}: Push-in ${Math.round(k.rate * 100)} %/s außerhalb ${REGELN.pushRate.map((x) => x * 100).join('–')} %/s`);
    if (k.profil && k.profil !== 'linear' && k.vorlauf === 0 && !['tilt_up', 'crane_down_tilt', 'whip'].includes(k.baustein)) V.push(`M3 ${e.id}: Ease-Profil ohne Vorlauf fährt aus dem Stand an`);
    if (['tilt_up', 'crane_down_tilt'].includes(k.baustein) && !(k.start < e.start)) V.push(`M3 ${e.id}: ${k.baustein} startet nicht vor dem Schnitt (steht im ersten Bild)`);
  }
  kz.bewegt = +(bewegt / story.length).toFixed(3);
  if (kz.bewegt < REGELN.bewegt) V.push(`M3 nur ${(kz.bewegt * 100).toFixed(0)} % der Einstellungen bewegt (≥ 90 %)`);

  // M4 Akzentfahrten alle 6–10 s, Ankunft aufs Wort ±0,1 s
  const akzente = story.filter((e) => e.plan.akzent);
  const zeiten = [story[0].start, ...akzente.map((e) => e.start), story.at(-1).ende];
  const luecken = zeiten.slice(1).map((t, i) => t - zeiten[i]);
  kz.akzentfahrten = akzente.length;
  kz.akzent_mittel_s = +(storyDauer / Math.max(1, akzente.length)).toFixed(2);
  kz.akzent_groesste_luecke_s = +Math.max(...luecken).toFixed(2);
  if (kz.akzent_mittel_s < REGELN.akzentMittel[0] || kz.akzent_mittel_s > REGELN.akzentMittel[1]) V.push(`M4 Akzentfahrten im Mittel alle ${kz.akzent_mittel_s} s (Ziel ${REGELN.akzentMittel.join('–')} s)`);
  if (kz.akzent_groesste_luecke_s > REGELN.akzentLuecke) V.push(`M4 ${kz.akzent_groesste_luecke_s} s ohne Akzentfahrt (höchstens ${REGELN.akzentLuecke} s)`);

  // M5 Genau eine Hauptaktion je Einstellung, auf dem Schlüsselwort
  let koerper = 0;
  for (const e of story) {
    const h = e.plan.haupt;
    if (!h) { V.push(`M5 ${e.id}: keine Hauptaktion`); continue; }
    const figAktionen = e.aktionen.filter((a) => !['gesicht', 'stellung', 'sichtbar', 'pose'].includes(a.was) && !a.nebenbei);
    if (figAktionen.length > 1) V.push(`M5 ${e.id}: ${figAktionen.length} Hauptaktionen (${figAktionen.map((a) => `${a.wer}.${a.was}`).join(', ')})`);
    if (h.art === 'aktion') {
      koerper++;
      const d = h.anker === 'ende' ? h.ende - h.wort_start : h.start - h.wort_start;
      if (Math.abs(d) > REGELN.aktionZumWort + 1e-6) V.push(`M5 ${e.id}: Hauptaktion ${h.wer}.${h.was} ${h.anker === 'ende' ? 'endet' : 'beginnt'} ${d.toFixed(2)} s neben „${h.wort}“`);
    }
    if (h.art === 'licht' && (h.start - h.wort_start < REGELN.lichtZumWort[0] - 1e-6 || h.start - h.wort_start > REGELN.lichtZumWort[1] + 1e-6)) V.push(`M5 ${e.id}: Lichtereignis ${(h.start - h.wort_start).toFixed(2)} s neben „${h.wort}“`);
    if (h.art === 'kamera') {
      const k = e.kamera;
      // Schlüsselzeit der Kamera: Ankunft (Kran, Tilt), Snap, Ende des Whips, Wisch des Vordergrunds
      const schluessel = k.ankunft ?? (k.baustein === 'whip' ? k.zeit + (k.dauer ?? 0.3) : k.zeit) ?? k.vordergrund?.zeit ?? (k.zusaetze ?? []).find((z) => z.baustein === 'snap_zoom')?.zeit;
      if (schluessel !== undefined && Math.abs(schluessel - h.wort_start) > REGELN.akzentAnkunft + 1e-6) V.push(`M5 ${e.id}: Kamera-Schlüsselzeit ${schluessel} s liegt ${(schluessel - h.wort_start).toFixed(2)} s neben „${h.wort}“ (±${REGELN.akzentAnkunft} s)`);
      if (schluessel === undefined && !istAkzent(k) && k.baustein === 'push_in' && (k.rate ?? 0.07) < 0.07) V.push(`M5 ${e.id}: Kamera als Hauptaktion ohne Schlüsselzeit braucht mindestens einen Push von 7 %/s`);
    }
    // Schlüsselwort der Bildidee und Wort der Hauptaktion stimmen überein (Bildideen bleiben die Doku)
    if (h.schluesselwort_idee && norm(h.schluesselwort_idee) !== norm(h.wort)) V.push(`M5 ${e.id} (${e.plan.key}): Hauptaktion auf „${h.wort}“, Bildidee nennt „${h.schluesselwort_idee}“`);
    if (h.wort_start < e.start - 0.07 || h.wort_start >= e.ende) V.push(`M5 ${e.id}: Schlüsselwort „${h.wort}“ liegt nicht in der Einstellung`);
  }
  kz.koerperaktion_anteil = +(koerper / story.length).toFixed(3);

  // M6 Gesichtstausch auf Reaktionswörtern; Gesichter aus den Bildideen sind zu sehen; Mundformen bei Rede
  const FIG = { 'mister-hundred': [...monsterIds], 'old-knuckles': [...monsterIds] };
  for (const [i, e] of story.entries()) {
    for (const g of e.plan.gesichter ?? []) {
      if (Math.abs(g.start - g.wort_start) > REGELN.gesichtZumWort + 1e-6) V.push(`M6 ${e.id}: Gesicht ${g.wer} „${g.name}“ ${(g.start - g.wort_start).toFixed(2)} s neben „${g.wort}“`);
    }
    const idee = einst[i].idee;
    for (const [figur, name] of Object.entries(idee.gesicht ?? {})) {
      // Figurnamen der Bildideen -> IDs der Regie: "june" trifft auch "june18" (Rückblende), "nachbarn" alle nb_*
      // Bindestrich in den Bildideen = Unterstrich in der Regie ("mrs-lund" -> mrs_lund)
      const fid = figur.replace(/-/g, '_');
      const ids = FIG[figur] ?? (figur === 'nachbarn' ? e.plan.sichtbar.filter((x) => /^nb_|^nachbar/.test(x)) : e.plan.sichtbar.filter((x) => x === fid || (x.startsWith(fid) && /^\d+$/.test(x.slice(fid.length)))));
      const soll = norm(name.replace(/-/g, '_'));
      const hat = ids.some((id) => {
        const st = e.stellung[id];
        const namen = [st?.gesicht, ...e.aktionen.filter((a) => a.wer === id && a.was === 'gesicht').map((a) => a.params.name)].filter(Boolean).map((n) => norm(n.split('/')[0].replace(/_a$|_b$|_c$/, '')));
        return namen.includes(soll) || namen.includes(norm(ALIAS_GESICHT[name] ?? name));
      });
      if (!hat) V.push(`M6 ${e.id} (${e.plan.key}): Bildidee verlangt Gesicht ${figur} „${name}“, die Einstellung zeigt es nicht`);
    }
    if (idee.dialog && e.plan.sichtbar.includes(idee.dialog) && !e.plan.mund) V.push(`M6 ${e.id}: wörtliche Rede von ${idee.dialog} ohne Mundformen`);
    if (e.plan.mund?.art === 'rede') {
      const t = e.aktionen.filter((a) => a.wer === e.plan.mund.wer && a.was === 'gesicht').map((a) => a.start);
      const abst = t.slice(1).map((x, k) => x - t[k]).filter((d) => d > 0.001);
      const zuLang = abst.filter((d) => d > REGELN.mundTakt[1] + 0.12);
      if (zuLang.length) V.push(`M6 ${e.id}: Mundformen stehen bis ${Math.max(...zuLang).toFixed(2)} s still (Takt 0,1–0,3 s)`);
    }
  }

  // M7 Lichtereignisse: 1–3 je Teil, jedes auf einem Wort (Verb) seiner Einstellung
  const lichter = story.flatMap((e) => (e.licht_ereignisse ?? []).map((l) => ({ ...l, e })));
  kz.lichtereignisse = lichter.length;
  if (lichter.length < REGELN.lichtAnzahl[0] || lichter.length > REGELN.lichtAnzahl[1]) V.push(`M7 ${lichter.length} Lichtereignisse (Ziel ${REGELN.lichtAnzahl.join('–')})`);
  for (const l of lichter) if (l.start < l.e.start - 0.5 || l.start >= l.e.ende) V.push(`M7 ${l.e.id}: Lichtereignis bei ${l.start} s liegt außerhalb seiner Einstellung`);

  // M8 Hook: ab Bild 1 Bewegung auf das stärkste Motiv (das Monster)
  const h0 = story[0];
  const k0 = h0.kamera;
  if (!h0.plan.monster) V.push('M8 Hook: das Monster ist im ersten Bild nicht zu sehen');
  if (![].concat(h0.plan.hauptsache ?? []).some((a) => [...monsterIds].some((m) => String(a).startsWith(`${m}.`) || a === m))) V.push('M8 Hook: Hauptsache des ersten Bildes ist nicht das Monster');
  if (k0.baustein === 'statisch' || (k0.profil && k0.profil !== 'linear' && k0.vorlauf === 0)) V.push('M8 Hook: Kamera steht im ersten Bild');
  if (k0.baustein === 'push_in' && (k0.rate ?? 0) < 0.07 && !(k0.zusaetze ?? []).some((z) => z.baustein === 'snap_zoom')) V.push('M8 Hook: Push-in langsamer als 7 %/s ohne Snap');

  // M9 Akzent-Zooms und Wackeln
  kz.snap_zooms = story.filter((e) => e.kamera.baustein === 'snap_zoom' || (e.kamera.zusaetze ?? []).some((z) => z.baustein === 'snap_zoom')).length;
  kz.wackeln = story.reduce((s, e) => s + (e.kamera.zusaetze ?? []).filter((z) => z.baustein === 'shake').length, 0);
  if (kz.snap_zooms < REGELN.snapZooms[0] || kz.snap_zooms > REGELN.snapZooms[1]) V.push(`M9 ${kz.snap_zooms} Snap-Zooms (Ziel ${REGELN.snapZooms.join('–')})`);
  if (kz.wackeln > REGELN.wackeln) V.push(`M9 ${kz.wackeln}-mal Wackeln (höchstens ${REGELN.wackeln})`);

  // M10 Monster-Anteil
  kz.monster_anteil = +(story.filter((e) => e.plan.monster).length / story.length).toFixed(3);
  if (kz.monster_anteil < REGELN.monsterAnteil[0] || kz.monster_anteil > REGELN.monsterAnteil[1]) V.push(`M10 Monster in ${(kz.monster_anteil * 100).toFixed(0)} % der Einstellungen (Ziel ${REGELN.monsterAnteil.map((x) => x * 100).join('–')} %)`);

  // M11 Endkarte: harter Schnitt ≤ 0,2 s nach dem letzten Wort, 1,0 s lang
  const lw = W.at(-1);
  if (ohneEndkarte) {
    // Finale ohne Endkarte: harter Schnitt (Ende des letzten Bildes) ≤ 0,2 s nach dem letzten Wort
    kz.endkarte = 'keine';
    kz.ende_nach_letztem_wort_s = +(story.at(-1).ende - lw.ende).toFixed(3);
    if (endkarte) V.push('M11 Endkarte vorhanden, obwohl regie.endkarte = false');
    if (kz.ende_nach_letztem_wort_s < 0 || kz.ende_nach_letztem_wort_s > REGELN.endkarteAbstand + 1e-6) V.push(`M11 Ende ${kz.ende_nach_letztem_wort_s} s nach dem letzten Wort (0–${REGELN.endkarteAbstand} s)`);
  } else if (!endkarte) V.push('M11 Endkarte fehlt');
  else {
    kz.endkarte_nach_letztem_wort_s = +(endkarte.start - lw.ende).toFixed(3);
    kz.endkarte_dauer_s = +((bild(endkarte.ende) - bild(endkarte.start)) / FPS).toFixed(3);
    if (kz.endkarte_nach_letztem_wort_s < 0 || kz.endkarte_nach_letztem_wort_s > REGELN.endkarteAbstand + 1e-6) V.push(`M11 Endkarte ${kz.endkarte_nach_letztem_wort_s} s nach dem letzten Wort (0–${REGELN.endkarteAbstand} s)`);
    // Rules of Kindly: Endkarte 1,5 s (Bibel §14 Nr. 2), Länge aus regie.endkarte.dauer
    const ekSoll = regie.endkarte?.dauer ?? REGELN.endkarteDauer;
    if (Math.abs(kz.endkarte_dauer_s - ekSoll) > 0.5 / FPS) V.push(`M11 Endkarte ${kz.endkarte_dauer_s} s lang (${ekSoll} s)`);
  }
  kz.gesamt_s = +episode.einstellungen.at(-1).ende.toFixed(3);

  // M12 Bezüge: Kameraziele und Aktionen nur auf sichtbare Figuren
  for (const e of story) {
    const ids = new Set(episode.figuren.map((f) => f.id));
    const refs = [e.kamera.ziel, e.kamera.von_ziel, e.kamera.folge, e.kamera.blick?.bezug, ...[].concat(e.plan.hauptsache ?? [])]
      .map((x) => (typeof x === 'string' ? x : x?.anker)).filter((x) => typeof x === 'string');
    for (const ref of refs) {
      const id = ref.split('.')[0];
      if (ids.has(id) && !e.plan.sichtbar.includes(id)) V.push(`M12 ${e.id}: Kamera/Hauptsache zeigt auf „${ref}“, ${id} ist aber nicht sichtbar`);
    }
    for (const a of e.aktionen) if (!e.plan.sichtbar.includes(a.wer)) V.push(`M12 ${e.id}: Aktion ${a.was} für unsichtbare Figur ${a.wer}`);
  }

  // M13 Nichts direkt vor der Linse (Review Folge 1): Ein Wisch-Objekt näher als 1,5 m rendert als
  // unbeleuchteter schwarzer Balken über bis zu einem Drittel der Bildbreite und liest sich wie ein
  // Renderfehler. Seitenfahrten fahren deshalb ohne Pfosten oder mit Abstand ≥ 1,5 m.
  for (const e of story) {
    // truck_side stellt ohne "vordergrund: false" einen Pfosten 0,9 m vor die Kamera (src/kamera.js)
    const vg = e.kamera.baustein === 'truck_side' && e.kamera.vordergrund !== false ? (e.kamera.vordergrund ?? {}) : null;
    if (vg && (vg.abstand ?? 0.9) < REGELN.vordergrundMin) V.push(`M13 ${e.id}: Vordergrund-Objekt ${vg.abstand ?? 0.9} m vor der Kamera (mindestens ${REGELN.vordergrundMin} m)`);
  }
  return { kennzahlen: kz, verstoesse: V, laengen };
}

// Gesichtsnamen der Bildideen, die in der Bibliothek anders heißen (src/gesichter.js ALIAS)
const ALIAS_GESICHT = { erschrocken: 'angst', 'augen-zu': 'augen_zu', zaehlt: 'zaehlt_a', trotzig: 'entschlossen', froh: 'laecheln' };

// ---------- Tabelle zum Ansehen ----------
function tabelle(episode) {
  const z = [];
  for (const e of episode.einstellungen) {
    const h = e.plan.haupt ?? {};
    const was = h.art === 'aktion' ? `${h.wer}.${h.was}` : h.art === 'gesicht' ? `${h.wer}:${h.name}` : h.art ?? '';
    z.push(`${e.id} ${e.start.toFixed(2).padStart(6)}–${e.ende.toFixed(2).padStart(6)} ${(e.ende - e.start).toFixed(2)}s ${String(e.plan.key).padEnd(18)} ${e.kamera.baustein.padEnd(15)} ${e.plan.akzent ? 'A' : ' '}${e.plan.monster ? 'M' : ' '} ${was.padEnd(26)} @${h.wort ?? ''}  | ${e.text}`);
  }
  return z.join('\n');
}

// ---------- Schema prüfen (Python-jsonschema der Umgebung, falls vorhanden) ----------
function schemaPruefen(datei) {
  const py = ['/opt/deeptok/venv/bin/python', 'python3'].find((p) => p === 'python3' || fs.existsSync(p));
  const r = spawnSync(py, ['-c', 'import json,sys,jsonschema; jsonschema.validate(json.load(open(sys.argv[1])), json.load(open(sys.argv[2]))); print("ok")', datei, path.join(ENGINE, 'episode.schema.json')], { encoding: 'utf8' });
  if (r.status === 0) return null;
  if (/No module named/.test(r.stderr)) return 'übersprungen (jsonschema fehlt)';
  return r.stderr.trim().split('\n').slice(-3).join(' ');
}

// ---------- Ablauf ----------
async function main() {
  const o = argumente(process.argv.slice(2));
  const ordner = path.resolve(o.ordner);
  const erg = await kompiliere(ordner);
  const tor = messtor(erg);
  if (o.tabelle) console.log(tabelle(erg.episode));
  console.log('Messtor – Kennzahlen:');
  for (const [k, v] of Object.entries(tor.kennzahlen)) console.log(`  ${k.padEnd(32)} ${v}`);
  const folge = path.basename(ordner);
  const ziel = o.aus ? path.resolve(o.aus) : tor.verstoesse.length && o.entwurf
    ? path.join(ENGINE, '..', 'build', folge, 'episode-entwurf.json')
    : path.join(ordner, 'episode.json');
  if (tor.verstoesse.length) {
    console.log(`Messtor: ${tor.verstoesse.length} Verstöße`);
    for (const v of tor.verstoesse) console.log(`  ✗ ${v}`);
    if (!o.entwurf) { console.log('Abbruch: episode.json wurde nicht geschrieben (Entwurf trotzdem: --entwurf).'); process.exit(1); }
  } else console.log('Messtor: alle Regeln erfüllt');
  fs.mkdirSync(path.dirname(ziel), { recursive: true });
  fs.writeFileSync(ziel, JSON.stringify(erg.episode, null, 1) + '\n');
  const schema = schemaPruefen(ziel);
  console.log(`Schema: ${schema ?? 'ok'}`);
  if (schema && !schema.startsWith('übersprungen')) process.exit(1);
  console.log(`Geschrieben: ${ziel} (${erg.episode.einstellungen.length} Einstellungen inkl. Endkarte, ${(erg.episode.einstellungen.at(-1).ende).toFixed(2)} s)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(`Fehler: ${e.message}`); process.exit(1); });
}
