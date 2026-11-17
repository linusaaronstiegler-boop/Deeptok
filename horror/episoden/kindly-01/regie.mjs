// Regie für „Rules of Kindly“, Folge 1 „His Breath Didn't Fog“ (Regel 3): WIE jede Einstellung gezeigt wird.
// WAS sie zeigt und WO geschnitten wird, steht in bildideen.json (Satz + Teilbilder "ab_wort").
// Der Compiler engine/shotliste.mjs setzt beides mit den Wortzeiten der echten Stimme (timing.json) zusammen.
// Aufbau und Felder wie in ../folge-03/regie.mjs; Bausteine der Serie: engine/README.md §19 (Orte) und §20 (Figuren).
//
// Lehren aus den REVIEW.md von Hiding Night, hier eingehalten:
//   - hell genug (Morgengrauen/Dämmerung statt Nacht, wo die Geschichte es erlaubt; Hütte mit Untergrenze 22)
//   - Gesichter an Schlüsselstellen im Dreiviertelprofil von vorn (Bibel §10.4), Kopf oben, Mund über dem Untertitel
//   - nichts vor der Linse (Seitenfahrten ohne Vordergrund, Stegpfosten und Hüttenwände außerhalb)
//   - das Wesen mit kaltem Kantenlicht (Modul old_knuckles), Untersichten mit Preset see_unter (hell)
// Atemregel (Bibel §2): Draußen dampft jeder Atem; Bear ab S34 nie mehr (figuren.bear.params.dampf_aus_ab);
// drinnen (Hütte, Rathaus) dampft niemand (Aktion "dampf" mit wert false am Schnitt, siehe DRINNEN).
// Odell (Bibel §3.3): getragene Gläser spiegeln weiß; ohne Brille nie von vorn, seine Augen nie im Bild.
//
// Koordinaten: 1 m, y oben. Die Sets stehen weit auseinander (README §19.1): see bei z + 1000, Hütte bei x + 600,
// Stadtrand bei x − 600, Rathaus bei x + 900, Hauptstraße mit Schnee am Ursprung.

const L = (x, y, z) => [x, y, 1000 + z];        // Set see (lokal → Welt)
const HU = (x, y, z) => [600 + x, y, z];        // Hütte innen
const RA = (x, y, z) => [900 + x, y, z];        // Rathaus
const RD = (x, y, z) => [-600 + x, y, z];       // Stadtrand

// ---------- feste Orte ----------
// Das Wesen liegt rücklings, Kopf nach −z (Norden). Kopfmitte 3,12 m vor der Körpermitte (old_knuckles bei groesse 1);
// die Fäuste stehen an den Schultern 2,25 m vor der Mitte, 0,7 m seitlich, und reichen immer bis unter das Eis.
const OK_TIEF = L(2, -1.15, -28.35);            // Untersicht: Körper tief, lange Arme nach oben (Hook, S10–11)
const OK_FLACH = L(2, -0.55, -28.35);           // Gesicht dicht unter dem Eis, Kopf unter see.stelle (z −31,5)
const OK_DRUNTER = L(2, -0.95, -28.4);          // S34: Gesicht noch tief, steigt in S35 herauf
const OK_UNTER_BEAR = L(2, -1.15, -30.0);       // S31: die Fäuste genau unter Bears Stiefeln (z −32,25)
const STELLE = [2, -31.55];                     // klare Stelle über dem Kopf (Set see, lokal x/z)
// Wer über dem Kopf steht, steht nördlich davon: Die Kameras schauen von Süden auf das Gesicht (Kopf oben im Bild),
// die Stiefel liegen dann am oberen Bildrand und nicht zwischen Kamera und Gesicht.
const UEBER_KOPF = L(2, 0, -32.25);
const STEG = { odell: L(0.25, 0.85, -48.5), bear: L(0.22, 0.85, -47.3), gus: L(-0.62, 0.85, -47.05), kante: L(-0.2, 0.85, -47.35) };
// Gus neben Bear auf dem Eis (S30–S33): Gus schaut zu Bear (blick 127), Bear zu Gus (blick −53)
const GUS_EIS = L(0.75, 0, -31.3);
// drei Männer am Ufer, Lund vorn in der Mitte, die beiden anderen versetzt dahinter (9:16 ist schmal)
const UFER = { links: L(-6.62, 0.5, -65.15), mitte: L(-6, 0.5, -64.45), rechts: L(-5.38, 0.5, -65.15) };
const SCHILD = RD(5.7, 0, -4.6);
// Fischerhütte innen (README §19.4): Loch bei x −0,25, z 0,35; Eishaut bei y −0,15
const LOCH = HU(-0.25, 0, 0.35);
// Old Knuckles im Eisloch: kleiner (Kopf 0,5 m passt ins 0,7-m-Loch), Kopf unter der Lochmitte
const OK2_GROESSE = 0.75;
const OK2_TIEF = HU(-0.25, -0.62, 0.35 + 3.12 * OK2_GROESSE);

export const titel = "Rules of Kindly – Folge 1: His Breath Didn't Fog";
export const seed = 1203;
export const monster = ['ok', 'ok2'];
export const nachlauf = 0.14;

// Endkarte 1,5 s (Bibel §3.2, §14 Nr. 2): das Ortsschild bei Nacht mit Schneefall, Odells Pinsel streicht 1,204 und malt
// 1,203. Kamera wie in der Endkarten-Probe (engine/test/atem-probe.mjs --endkarte): 6,6 m vor der Tafel, Blick auf
// 1,15 m; die Ziffern (0,32 m) kommen auf etwa 128 px und liegen in der sicheren Zone. Der Glockenschlag kommt im Ton.
const plus = (a, b) => a.map((v, i) => +(v + b[i]).toFixed(4));
export const endkarte = {
  dauer: 1.5, set: ['rand'], licht: 'nacht', text: 'KINDLY · POP. 1,204 → 1,203',
  licht_anpassung: { nebel: { dichte: 0.0001 } },
  kamera: { baustein: 'push_in', pos: plus(SCHILD, [-0.35, 1.3, -6.6]), ziel: plus(SCHILD, [0, 1.15, 0]), fov: 40, rate: 0.03 },
  figuren: { schild: { position: SCHILD, blick: 180 } },
  aktionen: [{ wer: 'schild', was: 'umschreiben', ab: 0, dauer: 1.0 }],
  partikel: [{ art: 'schnee', ort: plus(SCHILD, [0, 3.5, -3.5]), bereich: [7, 7, 5], anzahl: 360, groesse: 0.03 }],
  lampen_einzeln: { 'rand.laterne': true },
  hauptsache: 'schild.zahl', bogen_ab: 1.0,
};

export const look = { licht: 'see_morgengrauen', bloom: { staerke: 0.55, radius: 0.55, schwelle: 1.0 }, vignette: 0.3, korn: 0.025, toene: 'aces' };

export const sets = [
  { id: 'see', modul: 'see', position: [0, 0, 1000], params: {} },
  // Lampe gedämpft: unter der Bloom-Schwelle, sonst brannten Gesichter in 0,5–1 m Abstand aus (Schnellbogen 1)
  { id: 'huette', modul: 'huette_innen', position: [600, 0, 0], params: { lampe: 0.45 } },
  { id: 'rand', modul: 'stadtrand', position: [-600, 0, 0] },
  { id: 'rathaus', modul: 'rathaus', position: [900, 0, 0] },
  { id: 'strasse', modul: 'hauptstrasse', params: { licht_an: 0.7 } },
  { id: 'marsh', modul: 'marsh_haus', params: { tuer_als_figur: true } },
  { id: 'schnee', modul: 'schnee' },
];

export const figuren = [
  // Bear (19), Erzähler; ab S34 die Kopie: kein neuer Atemzug mehr (überlebt jeden Schnitt)
  { id: 'bear', modul: 'bear', params: { dampf_aus_ab: 82.76 }, gesicht: 'neutral' },
  { id: 'gus', modul: 'gus', gesicht: 'ernst' },
  // Odell mit Brille auf der Nase (Gläser weiß), Laterne und Handglocke
  { id: 'odell', modul: 'odell', params: { glaeser: 'weiss', links: 'laterne', rechts: 'glocke', dampf: true }, gesicht: 'streng' },
  // Odell mit der Brille in der Hand (klar, beschlägt): nie von vorn
  { id: 'odell2', modul: 'odell', params: { glaeser: 'weiss', brille: 'hand', links: 'laterne', dampf: true }, gesicht: 'streng' },
  { id: 'lund', modul: 'lund', gesicht: 'neutral' },                                   // der echte Mr. Lund (Rückblende)
  { id: 'lund2', modul: 'lund', params: { dampf: false }, gesicht: 'leer' },           // die Kopie
  { id: 'mrs_lund', modul: 'mrs_lund', gesicht: 'ernst' },
  // Fischer (nur Erwachsene): Ufer links/rechts, der am Steg haucht, „du“ in der Regel-Erklärung, Menge
  { id: 'f1', modul: 'fischer', params: { variante: 'kapuze' }, gesicht: 'neutral' },
  { id: 'f2', modul: 'fischer', params: { variante: 'schapka', alter: 'alt' }, gesicht: 'neutral' },
  { id: 'f3', modul: 'fischer', params: { variante: 'schirm' }, gesicht: 'neutral' },
  { id: 'f4', modul: 'fischer', params: { variante: 'muetze' }, gesicht: 'neutral' },
  { id: 'f5', modul: 'fischer', params: { variante: 'kappe', angel: true }, gesicht: 'neutral' },
  { id: 'f6', modul: 'fischer', params: { variante: 'kapuze', alter: 'jung', farbe: '#7A3B36', haut: '#E3BC98' }, gesicht: 'neutral' },
  // das Wesen: auf dem See und (kleiner) im Eisloch der Hütte
  { id: 'ok', modul: 'old_knuckles', gesicht: 'glatt', blinzeln: false },
  { id: 'ok2', modul: 'old_knuckles', params: { groesse: OK2_GROESSE, eis_y: -0.17 }, gesicht: 'bear', blinzeln: false },
  // Requisiten
  { id: 'schild', modul: 'ortsschild', atmen: false, blinzeln: false },
  { id: 'buch', modul: 'stadtbuch', params: { blatt: 'rechts' }, atmen: false, blinzeln: false },
  { id: 'buch2', modul: 'stadtbuch', params: { blatt: 'links' }, atmen: false, blinzeln: false },
  { id: 'brille', modul: 'brille_hand', atmen: false, blinzeln: false },
  { id: 'tuer', modul: 'tuer', atmen: false, blinzeln: false },
  { id: 'stiefel', modul: 'schuhpaar', params: { art: 'dad', ordnung: 'getreten' }, atmen: false, blinzeln: false },
];

// ---------- Hilfen ----------
// Drinnen dampft niemand: am Schnitt für die sichtbaren Figuren ausschalten
const DRINNEN = (...wer) => wer.map((w) => ({ wer: w, was: 'dampf', ab: 'start', dauer: 0.01, params: { wert: false } }));
// Dialog von vorn: Wolke halb so dicht (deckt sonst Kinn und Kragen)
const DIALOG_DAMPF = (wer, staerke = 0.5) => ({ wer, was: 'dampf', ab: 'start', dauer: 0.01, params: { staerke } });
// Kamera auf einen Kopf (azimut/hoehe in Grad um die Kopfmitte, abstand in m). 9:16 ist schmal: Bildbreite =
// 2 · abstand · tan(fov/2) · 0,5625. Für Kopf und Schultern (≈ 1 m breit) heißt das bei fov 34 etwa 2,7 m Abstand.
// Das Ziel liegt 0,2 m unter der Kopfmitte: der Mund steht dann über dem Untertitel-Streifen (y 1080–1320).
const KOPF = (wer, azimut, hoehe = 3, abstand = 2.7, fov = 34, rate = 0.07, versatz = [0, -0.2, 0]) => ({ ziel: { anker: `${wer}.kopf`, versatz }, blick: { azimut, hoehe, abstand, bezug: `${wer}.kopf` }, fov, rate });
// in der engen Hütte (2,2 × 2,8 m): weiter Winkel statt Abstand
const KOPF_INNEN = (wer, azimut, hoehe = 2, abstand = 1.45, fov = 58, rate = 0.07) => KOPF(wer, azimut, hoehe, abstand, fov, rate, [0, -0.16, 0]);
// Set-Ereignis "klar" der Stelle zufrieren lassen (staerke 0), damit die nächste Klar-Stelle neu beginnt
const ZUFRIEREN = (versatz = 0) => ({ set: 'see', was: 'klar', versatz, dauer: 0.01, mitte: STELLE, staerke: 0, radius: 1.4 });
// Risse der vorigen Szene verschwinden (neues Eis): sonst lagen die Hook-Risse über jedem späteren Gesicht
const RISSE_WEG = (versatz = 0) => ({ set: 'see', was: 'risse_weg', versatz, dauer: 0.01 });
const STEGLATERNE_AUS = { 'see.laterne': false };   // bei Tag und für Odells Gesicht: sonst brennt es aus (Laterne 1 m vor ihm)
const BUCH_LICHT = { 'rathaus.lampe': false };      // additiver Lampenkegel lag in Draufsichten über den Seiten (README §20.4)
const SCHNEE = (ort, bereich = [12, 8, 12], anzahl = 500) => ({ art: 'schnee', ort, bereich, anzahl, groesse: 0.03 });
// Hütte: mehr Füll-Licht, weil die Lampe gedämpft ist (Untergrenze 22 je Einstellung)
const HUETTE_LICHT = { hemi: { staerke: 1.4 } };
const FENSTER_LICHT = { hemi: { staerke: 1.75 } };
const LAMPE_AUS = { 'huette.lampe': false };
// Gus steht in der Hütte an der Tür und schaut zum Ofen (die Lampe bleibt so außerhalb der Gesichts-Einstellungen)
const GUS_HUETTE = HU(-0.4, 0, 1.0);

export const einstellungen = {
  // ───────── Hook (0–4,2 s): Auslöser, Regel, endgültiger Preis ─────────
  // "In this town, if the ice" – Bild 1, das stärkste Bild zuerst: unter dem Eis liegt der lange bleiche Körper,
  // die Fäuste oben am Eis, darüber als Schatten ein Fischer, dessen Stiefel dreimal tippt (Kamera vom Kopfende, tief)
  '1': {
    figuren: {
      f4: { position: L(1.38, 0, -30.32), blick: 0, gesicht: 'neutral' },
      ok: { position: OK_TIEF, blick: 0, gesicht: 'glatt' },
    },
    kamera: { pos: L(2.0, -3.2, -34.3), ziel: L(2, -0.45, -29.4), fov: 56, rate: 0.09 },
    haupt: { wer: 'f4', was: 'stiefel_tippen', wort: 'town', dauer: 0.95, params: { seite: 'r', schlaege: 3 } },
    hauptsache: 'ok.brust',
  },
  // "knocks, never knock back," – von oben: unter dem Stiefel schlägt die Faust dreimal ans halb klare Eis, Risse, Wackeln
  '1:knocks': {
    figuren: {
      f4: { position: L(1.38, 0, -30.32), blick: 0, gesicht: 'neutral' },
      ok: { position: OK_TIEF, blick: 0, gesicht: 'glatt' },
    },
    kamera: { ziel: L(1.3, -0.12, -30.55), blick: { azimut: 150, hoehe: 46, abstand: 2.3 }, fov: 40, rate: 0.08, zusaetze: [{ baustein: 'shake', wort: 'knocks', versatz: 0.3 }] },
    set_ereignisse: [
      { set: 'see', was: 'klar', versatz: -0.3, dauer: 0.01, mitte: [1.3, -30.65], radius: 0.95, staerke: 0.95 },
      { set: 'see', was: 'risse', wort: 'knocks', versatz: 0.3, dauer: 0.12, mitte: [1.3, -30.55], radius: 1.5 },
    ],
    partikel: [{ art: 'staub', ort: L(1.3, 0.05, -30.55), wort: 'knocks', vorlauf: -0.3, farbe: '#f2f6fb', anzahl: 90, groesse: 0.025, bereich: [1.0, 0.4, 1.0], deckkraft: 0.9, dauer: 1.2 }],
    haupt: { wer: 'ok', was: 'klopfen_unten', wort: 'knocks', dauer: 1.2 },
    hauptsache: 'ok.faust_r',
  },
  // "or it comes home as you." – das Eis wird klar: Mr. Lunds Gesicht, neutral, Augen offen
  '1:or': {
    figuren: { ok: { position: OK_FLACH, blick: 0, gesicht: 'lund' } },
    kamera: { ziel: L(2, -0.3, -31.55), blick: { azimut: 0, hoehe: 58, abstand: 2.3 }, fov: 40, rate: 0.08 },
    set_ereignisse: [{ set: 'see', was: 'klar', versatz: 0, dauer: 0.01, mitte: [1.3, -30.55], radius: 0.95, staerke: 0 }, RISSE_WEG(0)],
    neben: [{ wer: 'ok', was: 'andruecken', wort: 'home', dauer: 0.8 }],
    haupt: { art: 'set', set: 'see', was: 'klar', wort: 'as', versatz: -0.2, dauer: 0.45, params: { mitte: STELLE, radius: 1.35 } },
    hauptsache: 'ok.gesicht',
  },

  // ───────── Regel, Name, Odell ─────────
  // "Here in Kindly, we call it" – Kran sinkt über das Eis auf Kindly zu
  '2': {
    figuren: { f5: { position: L(-4.8, 0, -31.2), blick: 200 }, f6: { position: L(5.0, 0, -24.0), blick: 160 } },
    kamera: { baustein: 'crane_down_tilt', pos: L(-5.5, 3.2, -14), ziel: L(0, 3.5, -66), fov: 46, hoehe: 7, rueck: 3, ankunft_wort: 'call' },
    set_ereignisse: [ZUFRIEREN(0)],
    haupt: { art: 'kamera', wort: 'call' },
    hauptsache: L(0, 3.5, -66),
  },
  // "Old Knuckles." – Snap-Zoom auf eine Faust: vier Knöchelwürfel von vorn am Eis
  '2:Old': {
    figuren: { ok: { position: OK_TIEF, blick: 0, gesicht: 'glatt' } },
    kamera: { baustein: 'snap_zoom', ziel: { anker: 'ok.faust_r', versatz: [0, 0.05, 0] }, blick: { azimut: 180, hoehe: -14, abstand: 1.7 }, fov: 44, zeit_wort: 'Knuckles', faktor: 1.2, bilder: 2 },
    haupt: { art: 'kamera', wort: 'Knuckles' },
    hauptsache: 'ok.faust_r',
  },
  // "When it comes home," – Ufer im Morgengrauen (entsättigt): drei Männer, Lund vorn in der Mitte
  '3': {
    figuren: {
      f1: { position: UFER.links, blick: 6 }, lund2: { position: UFER.mitte, blick: 0, gesicht: 'leer' }, f2: { position: UFER.rechts, blick: -6 },
    },
    kamera: { pos: L(-6, 1.85, -59.2), ziel: L(-6, 1.25, -64.8), fov: 42, rate: 0.07 },
    haupt: { wer: 'lund2', was: 'kopf_drehen', wort: 'home', dauer: 0.3, params: { winkel: -8, nicken: 4 } },
    hauptsache: 'lund2.kopf',
  },
  // "only one thing gives it away." – halbnah: zwei Wolken, Lund in der Mitte ohne
  '3:only': {
    figuren: {
      f1: { position: UFER.links, blick: 6 }, lund2: { position: UFER.mitte, blick: 0, gesicht: 'leer' }, f2: { position: UFER.rechts, blick: -6 },
    },
    kamera: { pos: L(-6, 2.0, -60.6), ziel: L(-6, 1.72, -64.8), fov: 40, rate: 0.07 },
    haupt: { art: 'kamera', wort: 'thing' },
    hauptsache: 'lund2.kopf',
  },
  // "Its breath doesn't fog." – nah: Lunds Gesicht, daneben quillt der Atem des anderen
  '4': {
    figuren: { lund2: { position: UFER.mitte, blick: 0, gesicht: 'neutral' }, f2: { position: UFER.rechts, blick: -6 } },
    kamera: KOPF('lund2', -16, 3, 2.6, 36, 0.08),
    haupt: { art: 'gesicht', wer: 'lund2', name: 'leer', wort: 'fog' },
    hauptsache: 'lund2.kopf',
  },
  // "So every winter, Mr." – Seitenfahrt am Steg entlang: am Ende die Laterne und eine kleine Gestalt
  '5': {
    figuren: { odell: { position: L(0.35, 0.85, -48.2), blick: 0 } },
    kamera: { baustein: 'truck_side', pos: L(-4.2, 1.6, -38.5), ziel: L(0, 1.9, -48.2), fov: 44, richtung: 'rechts', strecke: 1.6, vordergrund: false },
    lampen_einzeln: STEGLATERNE_AUS,
    haupt: { art: 'kamera', wort: 'winter' },
    hauptsache: 'odell.kopf',
  },
  // "Odell waits at the end of the pier." – Odell mit Brille und Laterne, ein Schlag der Handglocke
  '5:Odell': {
    figuren: { odell: { position: L(0.35, 0.85, -48.2), blick: 0, gesicht: 'streng' } },
    kamera: { ziel: { anker: 'odell.brust', versatz: [0, 0.05, 0] }, blick: { azimut: -28, hoehe: 6, abstand: 4.0, bezug: 'odell.brust' }, fov: 38, rate: 0.07 },
    lampen_einzeln: STEGLATERNE_AUS,
    haupt: { wer: 'odell', was: 'glocke_laeuten', wort: 'waits', dauer: 1.6 },
    hauptsache: 'odell.brust',
  },
  // "Everyone who comes off the ice" – ein Fischer kommt die letzten Schritte auf den Steg, Odell von hinten
  '6': {
    figuren: {
      odell2: { position: STEG.odell, blick: 0, gesicht: 'streng' },
      f3: { position: L(-0.15, 0.85, -46.15), blick: 180 },
    },
    kamera: { pos: L(-1.15, 2.5, -51.6), ziel: L(-0.1, 1.55, -46.9), fov: 42, rate: 0.07 },
    lampen_einzeln: STEGLATERNE_AUS,
    neben: [{ wer: 'odell2', was: 'brille_hoch', wort: 'ice', dauer: 0.5, params: { zu: 'f3.mund' } }],
    haupt: { wer: 'f3', was: 'gehen', wort: 'comes', dauer: 0.9, params: { nach: [-0.15, 1000 - 47.25] } },
    hauptsache: 'f3.kopf',
  },
  // "breathes on his glasses." – von der Seite: der Fischer haucht, die Gläser in Odells Hand beschlagen weiß
  '6:breathes': {
    figuren: {
      odell2: { position: STEG.odell, blick: 0, pose: 'brille_hoch', pose_params: { zu: 'f3.mund' } },
      f3: { position: L(-0.15, 0.85, -47.25), blick: 180 },
    },
    kamera: { pos: L(-3.8, 2.3, -47.85), ziel: L(0.05, 2.0, -47.85), fov: 50, rate: 0.07 },
    lampen_einzeln: STEGLATERNE_AUS,
    neben: [{ wer: 'odell2', was: 'beschlagen', wort: 'breathes', versatz: 0.3, dauer: 0.35 }],
    haupt: { wer: 'f3', was: 'hauchen', wort: 'breathes', dauer: 3.0, params: { zu: 'odell2.brille' } },
    hauptsache: 'odell2.brille',
  },
  // "If they fog," – Detail: die Gläser im Fäustling, ganz weiß beschlagen
  '7': {
    figuren: { brille: { position: L(0.1, 2.05, -48.05), blick: 180 } },
    kamera: { ziel: 'brille.mitte', blick: { azimut: 160, hoehe: 6, abstand: 0.75 }, fov: 36, rate: 0.08 },
    lampen_einzeln: STEGLATERNE_AUS,
    haupt: { wer: 'brille', was: 'beschlagen', wort: 'fog', dauer: 0.35 },
    hauptsache: 'brille.mitte',
  },
  // "he wipes them on his coat." – Bogen von der Seite: Odell wischt die Gläser am Mantel ab (Gesicht nicht von vorn)
  '7:he': {
    figuren: {
      odell2: { position: STEG.odell, blick: 0, pose: 'brille_hoch' },
      f3: { position: L(-0.15, 0.85, -47.25), blick: 180 },
    },
    kamera: { baustein: 'orbit', ziel: { anker: 'odell2.brust', versatz: [0, 0.05, 0] }, blick: { azimut: 115, hoehe: 8, abstand: 3.4 }, fov: 40, grad_pro_s: 14, richtung: 1 },
    lampen_einzeln: STEGLATERNE_AUS,
    neben: [{ wer: 'odell2', was: 'beschlagen', ab: 'start', dauer: 0.01 }],
    haupt: { wer: 'odell2', was: 'abwischen', wort: 'wipes', dauer: 1.2, params: { zurueck: false } },
    hauptsache: 'odell2.brust',
  },
  // "Kindly mind the rules." – Odell im Dreiviertelprofil, Brille auf, Gläser weiß, Mundformen
  '8': {
    figuren: { odell: { position: STEG.odell, blick: 0, gesicht: 'streng' } },
    kamera: KOPF('odell', -28, 4, 2.7, 34, 0.07),
    lampen_einzeln: STEGLATERNE_AUS,
    neben: [DIALOG_DAMPF('odell')],
    haupt: { art: 'gesicht', wer: 'odell', name: 'streng', wort: 'mind' },
    mund: { wer: 'odell', miene: 'streng' },
    hauptsache: 'odell.kopf',
  },
  // "It's on the town sign," – das Ortsschild neben DEAD END bei Tag
  '9': {
    figuren: { schild: { position: SCHILD, blick: 180 } },
    kamera: { punkt: 'rand.schild', rate: 0.07 },
    lampen_einzeln: { 'rand.laterne': false },
    partikel: [SCHNEE(RD(4.5, 4, -9), [10, 8, 8], 380)],
    haupt: { art: 'kamera', wort: 'sign' },
    hauptsache: 'schild.mitte',
  },
  // "right above the population." – Push-in auf die gemalte Zahl
  '9:right': {
    figuren: { schild: { position: SCHILD, blick: 180 } },
    kamera: { ziel: { anker: 'schild.zahl', versatz: [0, -0.15, 0] }, blick: { azimut: 172, hoehe: 2, abstand: 5.0, bezug: 'schild.zahl' }, fov: 40, rate: 0.1 },
    lampen_einzeln: { 'rand.laterne': false },
    haupt: { art: 'kamera', wort: 'population' },
    hauptsache: 'schild.zahl',
  },

  // ───────── Das Wesen, die Regel Schritt für Schritt ─────────
  // "Old Knuckles lies on its back under the ice," – Seitenfahrt unter dem Eis: Körper, Arme nach oben, Fäuste am Eis
  '10': {
    figuren: { ok: { position: OK_TIEF, blick: 0, gesicht: 'glatt' } },
    kamera: { baustein: 'truck_side', pos: L(2.0, -3.25, -22.4), ziel: L(2, -0.6, -29.6), fov: 56, richtung: 'rechts', strecke: 1.8, vordergrund: false },
    set_ereignisse: [RISSE_WEG(-0.1)],
    haupt: { art: 'kamera', wort: 'back' },
    hauptsache: 'ok.brust',
  },
  // "longer than a fishing hut." – Draufsicht: der Umriss, länger als die Hütte BEAR & GUS daneben
  '10:longer': {
    figuren: { ok: { position: OK_FLACH, blick: 0, gesicht: 'glatt' } },
    kamera: { pos: L(5.3, 13.5, -17.0), ziel: L(4.6, 0, -27.6), fov: 44, rate: 0.07 },
    haupt: { art: 'kamera', wort: 'hut' },
    hauptsache: 'ok.brust',
  },
  // "Its fists press up against the ice." – Untersicht von Süden unter dem Körper durch: beide Fäuste am Eis
  '11': {
    figuren: { ok: { position: OK_TIEF, blick: 0, gesicht: 'glatt' } },
    // schräg von vorn-unten auf die linke Faust: vier Knöchelwürfel gegen das Eis, dahinter die rechte (wie S2, andere Seite)
    kamera: { ziel: { anker: 'ok.faust_l', versatz: [-0.25, 0.0, 0] }, blick: { azimut: 205, hoehe: -10, abstand: 2.3 }, fov: 46, rate: 0.08 },
    neben: [{ wer: 'ok', was: 'klopfen_unten', wort: 'press', dauer: 0.9, params: { schlaege: 1, tiefe: 0.06 } }],
    haupt: { art: 'kamera', wort: 'press' },
    hauptsache: 'ok.haende',
  },
  // "Knock back, and it" – ein Fischer stampft zweimal zurück aufs Eis (halbnah von vorn)
  '12': {
    figuren: { f4: { position: L(-0.6, 0, -35.2), blick: 140, gesicht: 'entschlossen' } },
    kamera: { ziel: { anker: 'f4.huefte', versatz: [0, -0.15, 0] }, blick: { azimut: 160, hoehe: 10, abstand: 3.6, bezug: 'f4.huefte' }, fov: 42, rate: 0.08 },
    haupt: { wer: 'f4', was: 'stiefel_tippen', wort: 'Knock', dauer: 0.75, params: { seite: 'r', schlaege: 2, hoehe: 1.3 } },
    hauptsache: 'f4.kopf',
  },
  // "follows you under the ice," – steil von oben: der Fischer geht, darunter gleitet der Umriss mit
  '12:follows': {
    figuren: {
      f4: { position: L(-0.6, 0, -35.2), blick: 140 },
      ok: { position: L(-0.9, -0.6, -31.9), blick: 0, gesicht: 'glatt' },
    },
    kamera: { baustein: 'track_follow', folge: 'f4', versatz: [0.6, 7.5, 3.0], ziel_versatz: [0, 0, -0.6], lokal: false, fov: 46 },
    neben: [{ wer: 'ok', was: 'gleiten', ab: 'start', dauer: 2.8, params: { nach: [2, 1000 - 29.1] } }],
    haupt: { wer: 'f4', was: 'gehen', wort: 'follows', dauer: 2.6, params: { nach: [2, 1000 - 32.25] } },
    hauptsache: 'f4.kopf',
  },
  // "until it's right below you." – von oben: er bleibt stehen, der Umriss liegt genau unter ihm
  '12:until': {
    figuren: {
      f4: { position: L(0.9, 0, -33.3), blick: 135 },
      ok: { position: L(1.2, -0.6, -29.6), blick: 0, gesicht: 'glatt' },
    },
    kamera: { pos: L(2.9, 6.2, -27.8), ziel: L(2, 0, -31.0), fov: 48, rate: 0.07 },
    neben: [{ wer: 'f4', was: 'gehen', ab: 'start', dauer: 1.0, params: { nach: [2, 1000 - 32.25] } }],
    haupt: { wer: 'ok', was: 'gleiten', wort: 'below', anker: 'ende', dauer: 0.5, params: { nach: [2, 1000 - 28.4] } },
    hauptsache: L(2, 0, -31.0),
  },
  // "Then the ice turns clear," – um die Stiefel wird das Eis klar, darunter dunkles Wasser
  '13': {
    figuren: { f4: { position: UEBER_KOPF, blick: 0 } },
    kamera: { pos: L(3.5, 1.55, -29.2), ziel: L(2, -0.25, -31.75), fov: 48, rate: 0.07 },
    haupt: { art: 'set', set: 'see', was: 'klar', wort: 'turns', dauer: 0.8, params: { mitte: STELLE, radius: 1.35 } },
    hauptsache: L(2, -0.2, -31.55),
  },
  // "like a window." – vom Kopfende unter dem Eis: oben der Fischer auf dem klaren Fenster, unten Kopf und Fäuste
  // (erste Fassung von Süden unter dem Rumpf: der Hinterkopf füllte das ganze Bild, Render-Bogen 35,7 s)
  '13:like': {
    figuren: {
      f4: { position: UEBER_KOPF, blick: 0 },
      ok: { position: OK_FLACH, blick: 0, gesicht: 'glatt' },
    },
    kamera: { pos: L(2.4, -1.7, -34.9), ziel: L(2, 0.3, -32.0), fov: 56, rate: 0.07 },
    neben: [{ wer: 'ok', was: 'andruecken', ab: 'start', dauer: 0.9, params: { hoehe: 0.12 } }],
    haupt: { art: 'kamera', wort: 'window' },
    hauptsache: 'f4.fuss',
  },
  // "A face presses up against it." – durchs klare Eis von oben: ein Gesicht drückt sich flach ans Eis
  '14': {
    figuren: {
      f4: { position: UEBER_KOPF, blick: 0 },
      ok: { position: OK_FLACH, blick: 0, gesicht: 'fischer' },
    },
    kamera: { ziel: L(2, -0.3, -31.65), blick: { azimut: 0, hoehe: 58, abstand: 2.5 }, fov: 40, rate: 0.08 },
    haupt: { wer: 'ok', was: 'andruecken', wort: 'presses', dauer: 0.8 },
    hauptsache: 'ok.gesicht',
  },
  // "Yours." – Snap-Zoom: es ist das Gesicht des Fischers oben
  '15': {
    figuren: { ok: { position: OK_FLACH, blick: 0, gesicht: 'fischer' } },
    kamera: { baustein: 'snap_zoom', ziel: 'ok.gesicht', blick: { azimut: 0, hoehe: 62, abstand: 1.9 }, fov: 40, zeit_wort: 'Yours', faktor: 1.2, bilder: 2 },
    neben: [{ wer: 'ok', was: 'andruecken', ab: 'start', dauer: 0.01 }],
    haupt: { art: 'kamera', wort: 'Yours' },
    hauptsache: 'ok.gesicht',
  },
  // "And now it's you down there, looking up." – Gegenschuss von unten: der Fischer oben geht aus dem klaren Fenster
  '16': {
    figuren: { f4: { position: L(2, 0, -31.0), blick: 180 } },
    kamera: { baustein: 'dolly_out', pos: L(2, -2.0, -29.2), ziel: L(2, 0.7, -32.6), fov: 56, rate: -0.06 },
    haupt: { wer: 'f4', was: 'gehen', wort: 'now', dauer: 1.7, params: { nach: [2, 1000 - 34.4] } },
    hauptsache: 'f4.kopf',
    bogen_wort: 'it\'s',
  },
  // "It walks home with your face," – Kindly im Schnee: Lund (die Kopie) geht zu seiner Haustür
  '17': {
    figuren: {
      lund2: { position: [-6.3, 0.05, -1.7], blick: -90, gesicht: 'leer' },
      tuer: { position: [-11.98, 0.6, -1.175], blick: 90 },
    },
    kamera: { pos: [-5.2, 1.9, 2.6], ziel: [-8.6, 1.3, -1.7], fov: 44, rate: 0.07 },
    set_ereignisse: [ZUFRIEREN(0)],
    partikel: [SCHNEE([-8, 5, 0], [20, 10, 20], 700)],
    haupt: { wer: 'lund2', was: 'gehen', wort: 'walks', dauer: 1.5, params: { nach: [-9.0, -1.7] } },
    hauptsache: 'lund2.kopf',
  },
  // "your voice, and your memories." – von der Seite: die Frau öffnet, ihr Atem dampft im Türlicht, seiner nicht
  '17:your voice': {
    figuren: {
      lund2: { position: [-11.0, 0.6, -2.2], blick: -80, gesicht: 'leer' },
      mrs_lund: { position: [-12.05, 0.6, -1.65], blick: 100, gesicht: 'ernst' },
      tuer: { position: [-11.98, 0.6, -1.175], blick: 90 },
    },
    // durch die Lücke über den Stufen (Kamerapunkt schnee.lund_halbnah): sie in der Tür von vorn, er rechts von hinten
    kamera: { pos: [-7.9, 1.9, -0.95], ziel: [-11.7, 1.62, -1.75], fov: 40, rate: 0.07 },
    neben: [{ wer: 'tuer', was: 'oeffnen', ab: 'start', dauer: 0.6, params: { winkel: -85 } }],
    partikel: [SCHNEE([-9, 5, -1], [14, 9, 12], 500)],
    haupt: { art: 'gesicht', wer: 'mrs_lund', name: 'gefasst', wort: 'voice' },
    hauptsache: 'mrs_lund.kopf',
  },

  // ───────── Mr. und Mrs. Lund ─────────
  // "Mr. Lund knocked back once," – Rückblende: Lund stampft lachend zurück aufs Eis
  '18': {
    figuren: {
      lund: { position: L(-6.2, 0, -40.0), blick: 15, gesicht: 'lachend' },
      f1: { position: L(-5.0, 0, -40.7), blick: -40, gesicht: 'besorgt' },
    },
    kamera: { ziel: { anker: 'lund.brust', versatz: [0.35, -0.1, 0] }, blick: { azimut: 25, hoehe: 8, abstand: 4.4, bezug: 'lund.brust' }, fov: 40, rate: 0.07 },
    haupt: { wer: 'lund', was: 'stiefel_tippen', wort: 'knocked', dauer: 1.0, params: { seite: 'r', schlaege: 3, hoehe: 1.4 } },
    hauptsache: 'lund.kopf',
  },
  // "as a joke, and" – nah: Lund lacht, sein Atem dampft noch
  '18:as': {
    figuren: {
      lund: { position: L(-6.2, 0, -40.0), blick: 15, gesicht: 'lachend' },
      f1: { position: L(-5.0, 0, -40.7), blick: -40, gesicht: 'besorgt' },
    },
    kamera: KOPF('lund', 32, 4, 2.6, 34, 0.08),
    haupt: { wer: 'lund', was: 'kopf_drehen', wort: 'joke', dauer: 0.3, params: { nicken: -14 } },
    hauptsache: 'lund.kopf',
  },
  // "ran for the shore." – Folgefahrt von der Seite: er rennt übers Eis zum Ufer
  '18:ran': {
    figuren: { lund: { position: L(-6.2, 0, -41.0), blick: 180, gesicht: 'lachend' } },
    kamera: { baustein: 'track_follow', folge: 'lund', versatz: [4.2, 1.1, 1.2], ziel_versatz: [0, 0.75, -0.9], lokal: false, fov: 46 },
    haupt: { wer: 'lund', was: 'rennen', wort: 'ran', dauer: 1.2, params: { nach: [-6.2, 1000 - 48.5] } },
    hauptsache: 'lund.kopf',
  },
  // "He made it." – am Morgen: Lund steht am Ufer (wie S3–4), neben ihm dampft ein Fischer, er nicht
  '19': {
    figuren: {
      lund2: { position: UFER.mitte, blick: 0, gesicht: 'neutral' },
      f1: { position: UFER.links, blick: 6 },
    },
    kamera: { pos: L(-6.25, 1.95, -60.9), ziel: L(-6.25, 1.72, -64.8), fov: 40, rate: 0.08 },
    haupt: { wer: 'lund2', was: 'kopf_drehen', wort: 'made', dauer: 0.3, params: { winkel: 10 } },
    hauptsache: 'lund2.kopf',
  },
  // "His breath never fogged again." – nah: Lunds Gesicht, leer, kein Dampf
  '20': {
    figuren: { lund2: { position: UFER.mitte, blick: 0, gesicht: 'leer' }, f1: { position: UFER.links, blick: 6 } },
    kamera: KOPF('lund2', 14, 2, 2.4, 34, 0.09),
    haupt: { art: 'kamera', wort: 'fogged' },
    hauptsache: 'lund2.kopf',
  },
  // "Mrs. Lund walked him back onto the ice" – Totale von hinten (S41 wiederholt diese Kamera)
  '21': {
    figuren: {
      mrs_lund: { position: L(3.1, 0, -50.8), blick: 10, gesicht: 'gefasst' },
      lund2: { position: L(3.85, 0, -50.6), blick: 10, gesicht: 'leer' },
    },
    kamera: { punkt: 'see.weg_totale', rate: 0.05 },
    neben: [
      { wer: 'lund2', was: 'gehen', ab: 'start', dauer: 1.8, params: { nach: [5.3, 1000 - 44.6] } },
      { wer: 'mrs_lund', was: 'kopf_drehen', wort: 'him', dauer: 0.3, params: { zu: 'lund2.kopf' } },
    ],
    haupt: { wer: 'mrs_lund', was: 'gehen', wort: 'walked', dauer: 1.6, params: { nach: [4.5, 1000 - 44.8] } },
    hauptsache: 'mrs_lund.kopf',
  },
  // "herself." – gleiche Kamera: sie kommt allein zurück
  '21:herself': {
    figuren: { mrs_lund: { position: L(4.5, 0, -44.2), blick: 190, gesicht: 'gefasst' } },
    kamera: { punkt: 'see.weg_totale', rate: 0.05 },
    haupt: { wer: 'mrs_lund', was: 'gehen', wort: 'herself', dauer: 0.9, params: { nach: [4.2, 1000 - 46.0] } },
    hauptsache: 'mrs_lund.kopf',
  },

  // ───────── Lore: das Stadtbuch, Rule Zero ─────────
  // "Every rule is in Mr. Odell's" – Kran auf das Buch: ein loses Blatt dreht sich (RULE 18 blitzt auf), RULE 3
  '22': {
    figuren: { buch: { position: RA(0, 1.05, 0), blick: 0 } },
    lampen_einzeln: BUCH_LICHT,
    kamera: { baustein: 'crane_down_tilt', ziel: { anker: 'buch.mitte', versatz: [0.06, 0, 0.02] }, pos: RA(0.06, 2.12, 0.42), fov: 46, hoehe: 0.55, rueck: 0.35, ankunft_wort: "Odell's" },
    haupt: { wer: 'buch', was: 'blaettern', wort: 'rule', dauer: 0.55 },
    hauptsache: 'buch.mitte',
  },
  // "town book, except rule zero." – Draufsicht auf den Falz: „0 IF“ ≥ 2 s, ≥ 72 px, sichere Zone
  '22:town': {
    figuren: { buch: { position: RA(0, 1.05, 0), blick: 0, pose: 'blaettern' } },
    lampen_einzeln: BUCH_LICHT,
    kamera: { ziel: { anker: 'buch.stummel', versatz: [0.05, 0, 0.055] }, blick: { azimut: 0, hoehe: 64, abstand: 0.6, bezug: 'buch.stummel' }, fov: 40, rate: 0.07 },
    haupt: { art: 'kamera', wort: 'except' },
    hauptsache: 'buch.stummel',
  },

  // ───────── Gus, Gewohnheit, Wortlaut, Versprechen ─────────
  // "Since Mom went through the ice," – ein leerer Klappstuhl mit rotem Schal gegen die tiefe Sonne
  '23': {
    kamera: { punkt: 'see.stuhl', rate: 0.07 },
    haupt: { art: 'kamera', wort: 'Mom' },
    hauptsache: 'see.schal',
  },
  // "my brother Gus never lets me fish alone." – Folgefahrt: Gus und Bear gehen gemeinsam aufs Eis
  '23:my': {
    figuren: {
      gus: { position: L(-9.6, 0, -50.5), blick: -20, gesicht: 'ernst' },
      bear: { position: L(-8.75, 0, -50.85), blick: -20, gesicht: 'neutral' },
    },
    kamera: { baustein: 'track_follow', folge: 'gus', versatz: [1.6, 0.25, 3.3], ziel_versatz: [0.45, 0.85, 0], lokal: false, fov: 44 },
    neben: [
      { wer: 'gus', was: 'gehen', ab: 'start', dauer: 2.2, params: { nach: [-10.4, 1000 - 48.3] } },
      { wer: 'bear', was: 'gehen', ab: 'start', dauer: 2.2, params: { nach: [-9.55, 1000 - 48.65] } },
    ],
    haupt: { wer: 'gus', was: 'kopf_drehen', wort: 'Gus', dauer: 0.3, params: { zu: 'bear.kopf' } },
    hauptsache: 'gus.kopf',
  },
  // "Before every step," – Detail: Gus setzt den Stiefel vor
  '24': {
    figuren: { gus: { position: L(-10.4, 0, -48.3), blick: -20 } },
    kamera: { ziel: { anker: 'gus.fuss', versatz: [0, 0.35, 0] }, blick: { azimut: 70, hoehe: 12, abstand: 2.8 }, fov: 42, rate: 0.08 },
    haupt: { wer: 'gus', was: 'gehen', wort: 'step', dauer: 0.7, params: { nach: [-10.55, 1000 - 47.85] } },
    hauptsache: 'gus.fuss',
  },
  // "he taps the ice three times." – Detail: der Pickel tippt dreimal vor dem nächsten Schritt
  '24:he': {
    figuren: { gus: { position: L(-10.55, 0, -47.85), blick: -20 } },
    kamera: { ziel: { anker: 'gus.fuss', versatz: [0, 0.6, 0.25] }, blick: { azimut: 90, hoehe: 8, abstand: 3.1 }, fov: 42, rate: 0.07 },
    haupt: { wer: 'gus', was: 'tippen', wort: 'taps', dauer: 1.2, params: { zu: L(-10.72, 0, -47.38) } },
    hauptsache: 'gus.pickel_spitze',
  },
  // "Knocking first isn't against the rules." – Seitenfahrt über das Buch: Gus' Hand fährt die Zeile entlang
  '25': {
    figuren: { gus: { position: RA(0, 0, 0.62), blick: 180, gesicht: 'ernst' }, buch2: { position: RA(0, 1.05, 0), blick: 0 } },
    lampen_einzeln: BUCH_LICHT,
    kamera: { baustein: 'truck_side', pos: RA(0.55, 1.75, 0.15), ziel: { anker: 'buch2.zeile', versatz: [0.07, 0, 0] }, fov: 44, richtung: 'rechts', strecke: 0.18, vordergrund: false },
    neben: [...DRINNEN('gus'), { wer: 'gus', was: 'greifen', wort: 'rules', dauer: 0.45, params: { zu: 'buch2.zeile_ende', seite: 'r' } }],
    haupt: { wer: 'gus', was: 'greifen', wort: 'first', dauer: 0.4, params: { zu: 'buch2.zeile', seite: 'r' } },
    hauptsache: 'buch2.zeile',
  },
  // "Gus checked." – Gus am Pult von vorn, er nickt
  '26': {
    figuren: { gus: { position: RA(0, 0, 0.62), blick: 180, gesicht: 'ernst' }, buch2: { position: RA(0, 1.05, 0), blick: 0 } },
    lampen_einzeln: BUCH_LICHT,
    kamera: KOPF('gus', 160, 6, 2.8, 36, 0.07),
    neben: DRINNEN('gus'),
    haupt: { wer: 'gus', was: 'kopf_drehen', wort: 'checked', dauer: 0.3, params: { nicken: 14 } },
    hauptsache: 'gus.kopf',
  },
  // "If it sounds hollow, Bear, go back." – Gus auf dem Eis im Dreiviertelprofil, Mundformen
  '27': {
    figuren: {
      gus: { position: L(-9.0, 0, -46.0), blick: 20, gesicht: 'warnend' },
      bear: { position: L(-8.15, 0, -45.25), blick: 228, gesicht: 'neutral' },
    },
    kamera: KOPF('gus', -12, 4, 3.0, 36, 0.07),
    neben: [DIALOG_DAMPF('gus')],
    haupt: { art: 'gesicht', wer: 'gus', name: 'warnend', wort: 'hollow' },
    mund: { wer: 'gus', miene: 'warnend' },
    hauptsache: 'gus.kopf',
  },
  // "And wherever you are," – Gus näher, ruhig
  '28': {
    figuren: { gus: { position: L(-9.0, 0, -46.0), blick: 20, gesicht: 'ernst' } },
    kamera: KOPF('gus', 8, 3, 2.5, 34, 0.07),
    neben: [DIALOG_DAMPF('gus')],
    haupt: { art: 'gesicht', wer: 'gus', name: 'ernst', wort: 'wherever' },
    mund: { wer: 'gus', miene: 'ernst' },
    hauptsache: 'gus.kopf',
  },
  // "I'll hear you." – Gegenschnitt: Bear hört zu, sein Atem dampft
  "28:I'll": {
    figuren: { bear: { position: L(-8.15, 0, -45.25), blick: 228, gesicht: 'neutral' } },
    kamera: KOPF('bear', 205, 3, 2.5, 34, 0.07),
    haupt: { art: 'gesicht', wer: 'bear', name: 'laecheln', wort: 'hear' },
    hauptsache: 'bear.kopf',
  },
  // "Five winters," – Totale bei Nacht: zwei kleine Figuren auf dem weiten See, hinten Kindly
  '29': {
    figuren: { gus: { position: L(2.6, 0, -16), blick: 180 }, bear: { position: L(3.4, 0, -16.3), blick: 180 } },
    kamera: { baustein: 'dolly_out', punkt: 'see.see_weit', rate: -0.07 },
    haupt: { art: 'kamera', wort: 'winters' },
    hauptsache: 'gus.kopf',
  },
  // "and the ice never answered." – Nacht: Gus tippt mit dem Pickel, Bear daneben; beide dampfen, nichts antwortet
  '29:and': {
    figuren: {
      gus: { position: L(2.2, 0, -16.8), blick: -10, gesicht: 'ernst' },
      bear: { position: L(3.0, 0, -16.5), blick: -30, gesicht: 'neutral' },
    },
    kamera: { ziel: { anker: 'gus.huefte', versatz: [0.4, 0.1, 0] }, blick: { azimut: 15, hoehe: 10, abstand: 4.6, bezug: 'gus.huefte' }, fov: 42, rate: 0.07 },
    neben: [{ wer: 'gus', was: 'tippen', ab: 'start', dauer: 1.2, params: { zu: L(2.12, 0, -16.32) } }],
    haupt: { art: 'kamera', wort: 'answered' },
    hauptsache: 'gus.kopf',
  },

  // ───────── Vorfall ─────────
  // "On the first ice this year," – erstes Eis: Laternen, Hütten, Fischer, Gus und Bear mittendrin
  '30': {
    figuren: {
      f5: { position: L(5.6, 0, -25.1), blick: 200 }, f6: { position: L(-4.3, 0, -30.0), blick: 120 },
      f1: { position: L(-2.2, 0, -36.2), blick: 150 },
      gus: { position: GUS_EIS, blick: 127 }, bear: { position: UEBER_KOPF, blick: -53 },
    },
    kamera: { pos: L(-2.0, 2.3, -40.5), ziel: L(2.5, 0.9, -29.5), fov: 48, rate: 0.07 },
    set_ereignisse: [RISSE_WEG(0)],
    haupt: { art: 'kamera', wort: 'year' },
    hauptsache: 'bear.kopf',
  },
  // "I tapped three times, like Gus." – Bears Stiefel tippt dreimal (Detail, Unterschenkel und Eis)
  '30:I tapped': {
    figuren: { bear: { position: UEBER_KOPF, blick: -53 } },
    kamera: { ziel: { anker: 'bear.fuss', versatz: [0, 0.3, 0] }, blick: { azimut: 20, hoehe: 16, abstand: 2.8 }, fov: 42, rate: 0.07 },
    haupt: { wer: 'bear', was: 'stiefel_tippen', wort: 'tapped', dauer: 1.2, params: { seite: 'r', schlaege: 3 } },
    hauptsache: 'bear.fuss',
  },
  // "Under my boots," – Untersicht, Tilt hinauf: von den Fäusten zu Bears Stiefeln im Eis
  '31': {
    figuren: { bear: { position: UEBER_KOPF, blick: -53 }, ok: { position: OK_UNTER_BEAR, blick: 0, gesicht: 'glatt' } },
    kamera: { baustein: 'tilt_up', von_ziel: 'ok.brust', ziel: L(2, 0.05, -32.25), pos: L(2, -3.2, -37.2), fov: 56, ankunft_wort: 'boots' },
    haupt: { art: 'kamera', wort: 'boots' },
    hauptsache: 'ok.haende',
  },
  // "something tapped back, three times." – von oben: drei Schläge, Risse, Schnee springt, Laternen flackern, Wackeln
  '31:something': {
    figuren: {
      bear: { position: UEBER_KOPF, blick: -53, gesicht: 'besorgt' },
      gus: { position: GUS_EIS, blick: 127, gesicht: 'besorgt' },
      ok: { position: OK_UNTER_BEAR, blick: 0, gesicht: 'glatt' },
    },
    kamera: { ziel: { anker: 'bear.huefte', versatz: [-0.5, -0.1, 0.3] }, blick: { azimut: 200, hoehe: 22, abstand: 4.6, bezug: 'bear.huefte' }, fov: 46, rate: 0.07, zusaetze: [{ baustein: 'shake', wort: 'tapped', versatz: 0.3 }] },
    set_ereignisse: [{ set: 'see', was: 'risse', wort: 'tapped', versatz: 0.3, dauer: 0.12, mitte: [2, -32.25], radius: 1.6 }],
    partikel: [{ art: 'staub', ort: L(2, 0.06, -32.25), wort: 'tapped', vorlauf: -0.3, farbe: '#f2f6fb', anzahl: 120, groesse: 0.03, bereich: [1.4, 0.5, 1.4], deckkraft: 0.9, dauer: 1.4 }],
    licht_ereignisse: [{ licht_art: 'flackern', ziel: 'see.eislaternen', wort: 'tapped', dauer: 1.3, ende_faktor: 1 }],
    neben: [{ wer: 'bear', was: 'erschrecken', wort: 'tapped', versatz: 0.32, dauer: 0.25, params: { staerke: 0.6 } }],
    haupt: { wer: 'ok', was: 'klopfen_unten', wort: 'tapped', dauer: 1.2 },
    hauptsache: 'bear.kopf',
  },
  // "Bear, don't move." – Gus erstarrt, Hand ausgestreckt, Dreiviertel von vorn
  '32': {
    figuren: { gus: { position: GUS_EIS, blick: 127, gesicht: 'warnend' } },
    kamera: { ziel: { anker: 'gus.brust', versatz: [0, 0.1, 0] }, blick: { azimut: 150, hoehe: 4, abstand: 3.4, bezug: 'gus.brust' }, fov: 40, rate: 0.07 },
    neben: [DIALOG_DAMPF('gus', 0.6)],
    haupt: { wer: 'gus', was: 'geste', wort: 'move', dauer: 0.3, params: { art: 'stopp' } },
    mund: { wer: 'gus', miene: 'warnend' },
    hauptsache: 'gus.kopf',
  },
  // "Don't answer it." – Gus nah, flüsternd
  "32:Don't answer": {
    figuren: { gus: { position: GUS_EIS, blick: 127, gesicht: 'angst' } },
    kamera: KOPF('gus', 145, 3, 2.8, 34, 0.08),
    neben: [DIALOG_DAMPF('gus', 0.5)],
    haupt: { art: 'gesicht', wer: 'gus', name: 'angst', wort: 'answer' },
    mund: { wer: 'gus', miene: 'angst' },
    hauptsache: 'gus.kopf',
  },
  // "I didn't." – Bear hält den Atem an, Augen zu
  '33': {
    figuren: { bear: { position: UEBER_KOPF, blick: -53, gesicht: 'besorgt' } },
    kamera: KOPF('bear', -35, 3, 2.4, 34, 0.08),
    gesichter: [{ wer: 'bear', name: 'augen_zu', wort: "didn't" }],
    haupt: { wer: 'bear', was: 'atem_anhalten', wort: "didn't", dauer: 0.25 },
    hauptsache: 'bear.kopf',
  },
  // "The ice under me turned clear." – Kran auf Bears Stiefel: das Eis unter ihm wird klar (ab hier kein Dampf mehr)
  '34': {
    figuren: { bear: { position: UEBER_KOPF, blick: -53 } },
    kamera: { baustein: 'crane_down_tilt', pos: L(2.9, 1.6, -29.4), ziel: L(2, -0.25, -31.8), fov: 48, hoehe: 1.4, rueck: 0.8, ankunft_wort: 'clear' },
    set_ereignisse: [ZUFRIEREN(-0.3), RISSE_WEG(-0.3)],
    haupt: { art: 'set', set: 'see', was: 'klar', wort: 'turned', dauer: 0.8, params: { mitte: STELLE, radius: 1.35 } },
    hauptsache: L(2, -0.3, -31.6),
  },
  // "My own face was rising toward it," – Großaufnahme durchs klare Eis: Bears Gesicht steigt herauf
  '35': {
    figuren: { bear: { position: UEBER_KOPF, blick: -53 }, ok: { position: OK_DRUNTER, blick: 0, gesicht: 'bear' } },
    kamera: { ziel: 'ok.gesicht', blick: { azimut: 0, hoehe: 60, abstand: 2.4 }, fov: 40, rate: 0.07 },
    haupt: { wer: 'ok', was: 'andruecken', wort: 'rising', dauer: 1.4, params: { hoehe: 0.26 } },
    hauptsache: 'ok.gesicht',
  },
  // "looking up." – das Gesicht berührt das Eis 4 Bilder vor dem Schnitt (Suchbild)
  '35:looking': {
    figuren: { bear: { position: UEBER_KOPF, blick: -53 }, ok: { position: OK_DRUNTER, blick: 0, gesicht: 'bear' } },
    kamera: { ziel: 'ok.gesicht', blick: { azimut: 0, hoehe: 64, abstand: 1.85 }, fov: 38, rate: 0.08 },
    neben: [{ wer: 'ok', was: 'andruecken', ab: 'start', dauer: 0.01, params: { hoehe: 0.26 } }],
    haupt: { wer: 'ok', was: 'andruecken', wort: 'looking', versatz: 0.02, dauer: 0.6 },
    hauptsache: 'ok.gesicht',
  },
  // "Gus dragged me off the lake," – Folgefahrt: Gus reißt Bear am Kragen übers Eis Richtung Steg
  '36': {
    figuren: {
      gus: { position: L(1.5, 0, -32.95), blick: 180, gesicht: 'entschlossen' },
      bear: { position: L(2.05, 0, -32.45), blick: 180, gesicht: 'besorgt' },
    },
    kamera: { baustein: 'track_follow', folge: 'gus', versatz: [3.2, 1.0, -2.4], ziel_versatz: [0.35, 0.6, -0.2], lokal: false, fov: 46 },
    neben: [
      { wer: 'gus', was: 'greifen', ab: 'start', dauer: 0.2, params: { zu: 'bear.schulter_r', seite: 'l', form: 'faust', lehnen: false } },
      { wer: 'bear', was: 'gehen', ab: 'start', dauer: 1.45, params: { nach: [1.15, 1000 - 36.5], drehen: false } },
    ],
    haupt: { wer: 'gus', was: 'gehen', wort: 'dragged', dauer: 1.3, params: { nach: [0.6, 1000 - 37.0] } },
    hauptsache: 'gus.kopf',
  },
  // "just in time." – von oben: das Gesicht sinkt zurück, die klare Stelle friert wieder zu
  '36:just': {
    figuren: { ok: { position: OK_FLACH, blick: 0, gesicht: 'bear' } },
    kamera: { ziel: L(2, -0.35, -31.6), blick: { azimut: 0, hoehe: 60, abstand: 2.6 }, fov: 40, rate: 0.07 },
    neben: [{ wer: 'ok', was: 'andruecken', ab: 'start', dauer: 0.01 }, { wer: 'ok', was: 'sinken', wort: 'just', dauer: 1.0 }],
    haupt: { art: 'set', set: 'see', was: 'klar', wort: 'time', dauer: 0.5, params: { mitte: STELLE, radius: 1.35, staerke: 0 } },
    hauptsache: 'ok.gesicht',
  },

  // ───────── Steg: die Probe (Wendung im Bild bei 63–67 %) ─────────
  // "At the pier, I" – Steg bei Nacht: Odell mit Laterne am Ende, Gus und Bear kommen herauf
  '37': {
    figuren: {
      odell2: { position: STEG.odell, blick: 0 },
      gus: { position: L(-0.35, 0, -44.7), blick: 180 }, bear: { position: L(0.45, 0, -44.4), blick: 180 },
    },
    kamera: { punkt: 'see.steg_totale', rate: 0.07 },
    neben: [
      { wer: 'gus', was: 'gehen', ab: 'start', dauer: 1.0, params: { nach: [-0.35, 1000 - 45.4] } },
      { wer: 'bear', was: 'gehen', ab: 'start', dauer: 1.0, params: { nach: [0.4, 1000 - 45.15] } },
    ],
    haupt: { art: 'kamera', wort: 'pier' },
    hauptsache: 'odell2.kopf',
  },
  // "breathed on Mr. Odell's glasses." – Bear haucht auf die hochgehaltenen Gläser: es kommt nichts (wie die Atem-Probe)
  '37:breathed': {
    figuren: {
      odell2: { position: STEG.odell, blick: 0, pose: 'brille_hoch', pose_params: { zu: 'bear.mund' } },
      bear: { position: STEG.bear, blick: 212, gesicht: 'besorgt' },
      gus: { position: STEG.gus, blick: 203, gesicht: 'ernst' },
    },
    kamera: { pos: L(-2.9, 2.6, -51.1), ziel: L(-0.1, 2.05, -47.55), fov: 42, rate: 0.06 },
    haupt: { wer: 'bear', was: 'hauchen', wort: 'breathed', dauer: 3.0, params: { zu: 'odell2.brille' } },
    hauptsache: 'bear.kopf',
  },
  // "He looked at them for a long time," – über Odells Schulter: die Gläser bleiben klar, dahinter Bear
  // Aus Odells Blick (er selbst ist hier nicht im Bild): die Requisite hängt, wo er die Gläser hält; hinter den klaren
  // Gläsern steht Bear, vor seinem Mund keine Wolke.
  '38': {
    figuren: {
      brille: { position: L(0.24, 2.4, -48.05), blick: 0 },
      bear: { position: STEG.bear, blick: 212, gesicht: 'besorgt' },
    },
    kamera: { pos: L(0.3, 2.45, -49.05), ziel: L(0.22, 2.38, -47.4), fov: 40, rate: 0.06 },
    lampen_einzeln: STEGLATERNE_AUS,
    tiefe: { fokus: 'brille.mitte', staerke: 0.5 },
    haupt: { wer: 'brille', was: 'bleibt_klar', wort: 'looked', dauer: 0.8 },
    hauptsache: 'brille.mitte',
  },
  // "then at Gus." – Reißschwenk von den Gläsern zu Gus (Kamera seitlich hinter Odell)
  '38:then': {
    figuren: {
      odell2: { position: STEG.odell, blick: 0, pose: 'brille_hoch', pose_params: { zu: 'bear.mund' } },
      bear: { position: STEG.bear, blick: 212, gesicht: 'besorgt' },
      gus: { position: STEG.gus, blick: 203, gesicht: 'ernst' },
    },
    kamera: { baustein: 'whip', von_ziel: 'odell2.brille', ziel: { anker: 'gus.kopf', versatz: [0, -0.15, 0] }, pos: L(-1.35, 2.45, -50.4), fov: 40, zeit_wort: 'then', dauer: 0.3 },
    neben: [{ wer: 'odell2', was: 'kopf_drehen', wort: 'then', dauer: 0.4, params: { zu: 'gus.kopf' } }],
    haupt: { art: 'kamera', wort: 'Gus' },
    hauptsache: 'gus.kopf',
  },
  // "He's fine, Mr. Odell." – Gus im Dreiviertelprofil, Atem dicht, Untertitel gelb
  '39': {
    figuren: { gus: { position: STEG.gus, blick: 203, gesicht: 'entschlossen' }, bear: { position: STEG.bear, blick: 212 } },
    kamera: KOPF('gus', 178, 3, 2.6, 34, 0.07),
    neben: [DIALOG_DAMPF('gus', 0.65)],
    haupt: { art: 'gesicht', wer: 'gus', name: 'entschlossen', wort: 'fine' },
    mund: { wer: 'gus', miene: 'entschlossen' },
    hauptsache: 'gus.kopf',
  },
  // "Kindly mind the rules, Gus." – Odell setzt die Brille auf, ohne abzuwischen; die Gläser spiegeln wieder weiß.
  // Das Aufsetzen beginnt 0,7 s vor dem Schnitt (neu: false: Odell läuft aus 38:then weiter), damit seine Augen
  // nie ohne Gläser von vorn zu sehen sind; im ersten Bild sitzt die Brille schon fast auf der Nase.
  '40': {
    figuren: { odell2: { position: STEG.odell, blick: 0, neu: false, gesicht: 'streng' } },
    kamera: KOPF('odell2', -10, 3, 2.7, 34, 0.07),
    lampen_einzeln: STEGLATERNE_AUS,
    neben: [{ wer: 'odell2', was: 'aufsetzen', ab: 'start', versatz: -0.7, dauer: 0.9 }, DIALOG_DAMPF('odell2')],
    haupt: { art: 'gesicht', wer: 'odell2', name: 'streng', wort: 'mind' },
    mund: { wer: 'odell2', miene: 'streng' },
    hauptsache: 'odell2.kopf',
  },

  // ───────── Hütte: das Fenster, die Entscheidung ─────────
  // "That night, Gus walked me back out to" – Nacht, dieselbe Kamera wie S21: Gus führt Bear zur Hütte
  '41': {
    figuren: {
      gus: { position: L(3.15, 0, -48.4), blick: 10, gesicht: 'ernst' },
      bear: { position: L(3.9, 0, -48.2), blick: 10, gesicht: 'leer' },
    },
    kamera: { punkt: 'see.weg_totale', rate: 0.05 },
    neben: [
      { wer: 'bear', was: 'gehen', ab: 'start', dauer: 1.9, params: { nach: [5.3, 1000 - 43.4] } },
      { wer: 'gus', was: 'kopf_drehen', wort: 'me', dauer: 0.3, params: { zu: 'bear.kopf' } },
    ],
    haupt: { wer: 'gus', was: 'gehen', wort: 'walked', dauer: 1.8, params: { nach: [4.5, 1000 - 43.6] } },
    hauptsache: 'gus.kopf',
  },
  // "our hut on the ice." – Kran auf die Tür „BEAR & GUS“ unter der Türlampe, Gus und Bear rechts davon
  '41:our': {
    figuren: {
      gus: { position: L(9.85, 0, -29.5), blick: 215, gesicht: 'ernst' },
      bear: { position: L(10.5, 0, -29.95), blick: 215, gesicht: 'leer' },
    },
    kamera: { baustein: 'crane_down_tilt', pos: L(7.6, 1.65, -33.4), ziel: L(8.9, 1.25, -28.6), fov: 46, hoehe: 2.0, rueck: 1.2, ankunft_wort: 'hut' },
    haupt: { art: 'kamera', wort: 'hut' },
    hauptsache: 'see.huette_bg_tuer',
  },
  // "I breathed on the frozen" – Hütte innen: Bear haucht ans Fenster (die Kopie: nichts)
  '42': {
    licht_anpassung: FENSTER_LICHT,
    lampen_einzeln: LAMPE_AUS,
    figuren: { bear: { position: HU(-0.15, 0, -0.85), blick: 63, gesicht: 'leer' } },
    // Kamera neben dem Fenster (z −0,55): von HU(1,0, 1,6, 0,38) hing die Petroleumlampe (0,15 | 1,72 | −0,35)
    // genau in der Sichtlinie und lag als schwarzer Balken über Bears Stirn (Render-Bogen 102,2 s)
    kamera: { pos: HU(1.05, 1.5, -0.55), ziel: { anker: 'bear.kopf', versatz: [0, -0.12, 0] }, fov: 68, rate: 0.07 },   // 1,24 m Abstand: Weitwinkel
    neben: DRINNEN('bear'),
    haupt: { wer: 'bear', was: 'hauchen', wort: 'breathed', dauer: 3.0, params: { zu: 'huette.fenster' } },
    hauptsache: 'bear.kopf',
  },
  // "window. Nothing." – das Frostfenster: kein Fleck
  '42:window': {
    licht_anpassung: HUETTE_LICHT,
    kamera: { punkt: 'huette.fenster', rate: 0.07 },
    haupt: { art: 'kamera', wort: 'window' },
    hauptsache: 'huette.fenster',
  },
  // "I breathed again." – Bear näher, haucht noch einmal
  '44': {
    licht_anpassung: FENSTER_LICHT,
    lampen_einzeln: LAMPE_AUS,
    figuren: { bear: { position: HU(-0.15, 0, -0.85), blick: 63, gesicht: 'besorgt' } },
    kamera: { pos: HU(1.05, 1.5, -0.55), ziel: { anker: 'bear.kopf', versatz: [0, -0.12, 0] }, fov: 60, rate: 0.08 },   // wie S42: Lampe aus der Sichtlinie
    neben: DRINNEN('bear'),
    haupt: { wer: 'bear', was: 'hauchen', wort: 'breathed', dauer: 3.0, params: { zu: 'huette.fenster' } },
    hauptsache: 'bear.kopf',
  },
  // "Nothing." – das Fenster, näher: nichts
  '45': {
    licht_anpassung: HUETTE_LICHT,
    kamera: { punkt: 'huette.fenster', fov: 30, rate: 0.1 },
    haupt: { art: 'kamera', wort: 'Nothing' },
    hauptsache: 'huette.fenster',
  },
  // "Gus didn't look up from the stove." – Gus sitzt auf der Bank und schaut in die Glut, er sieht nicht auf
  '46': {
    licht_anpassung: HUETTE_LICHT,
    figuren: { gus: { position: GUS_HUETTE, blick: -171, gesicht: 'leer' } },
    kamera: KOPF_INNEN('gus', -168, 4, 2.15, 48, 0.06),
    gesichter: [{ wer: 'gus', name: 'leer', wort: 'Gus' }],
    neben: DRINNEN('gus'),
    haupt: { art: 'gesicht', wer: 'gus', name: 'leer', wort: 'look' },
    hauptsache: 'gus.kopf',
  },
  // "His glasses stayed" – Gus von vorn, die Augen nass
  '47': {
    licht_anpassung: HUETTE_LICHT,
    figuren: { gus: { position: GUS_HUETTE, blick: -171, gesicht: 'nass' } },
    kamera: KOPF_INNEN('gus', -155, 3, 1.55, 48, 0.08),
    neben: DRINNEN('gus'),
    haupt: { art: 'gesicht', wer: 'gus', name: 'nass', wort: 'glasses' },
    mund: { wer: 'gus', miene: 'nass' },
    hauptsache: 'gus.kopf',
  },
  // "clear, Bear." – Blitz-Rückblende: Odells klare Gläser in der Hand
  '47:clear': {
    figuren: { brille: { position: L(0.1, 2.05, -48.05), blick: 180 } },
    kamera: { ziel: 'brille.mitte', blick: { azimut: 165, hoehe: 5, abstand: 0.75 }, fov: 36, rate: 0.09 },
    haupt: { wer: 'brille', was: 'bleibt_klar', wort: 'clear', dauer: 0.8 },
    hauptsache: 'brille.mitte',
  },
  // "I already lost Mom to this lake." – Bogen um Gus, die Augen nass
  '48': {
    licht_anpassung: HUETTE_LICHT,
    figuren: { gus: { position: GUS_HUETTE, blick: -171, gesicht: 'nass' } },
    kamera: { baustein: 'orbit', ziel: { anker: 'gus.kopf', versatz: [0, -0.14, 0] }, blick: { azimut: -186, hoehe: 3, abstand: 1.45, bezug: 'gus.kopf' }, fov: 48, grad_pro_s: 12, richtung: 1 },
    neben: DRINNEN('gus'),
    haupt: { art: 'gesicht', wer: 'gus', name: 'nass', wort: 'Mom' },
    mund: { wer: 'gus', miene: 'nass' },
    hauptsache: 'gus.kopf',
  },
  // "I'm not losing you too." – Gus schiebt den Riegel der Hüttentür zu: sie bleiben
  '49': {
    licht_anpassung: HUETTE_LICHT,
    figuren: { gus: { position: HU(0.02, 0, 0.92), blick: -20, gesicht: 'nass' } },
    kamera: { pos: HU(-0.95, 1.45, 0.3), ziel: 'huette.riegel', fov: 52, rate: 0.07 },
    neben: [...DRINNEN('gus'), { wer: 'gus', was: 'greifen', wort: "I'm", dauer: 0.4, params: { zu: 'huette.riegel', seite: 'r', form: 'faust' } }],
    haupt: { art: 'set', set: 'huette', was: 'riegel_zu', wort: 'losing', dauer: 0.25 },
    mund: { wer: 'gus', miene: 'nass' },
    hauptsache: 'huette.riegel',
  },

  // ───────── Erklärung ─────────
  // "I never knocked back." – Rückblende: Gus' Hand auf „NEVER KNOCK BACK.“
  '50': {
    figuren: { gus: { position: RA(0, 0, 0.62), blick: 180 }, buch2: { position: RA(0, 1.05, 0), blick: 0 } },
    lampen_einzeln: BUCH_LICHT,
    kamera: { ziel: { anker: 'buch2.zeile', versatz: [0.08, 0, 0.0] }, blick: { azimut: 10, hoehe: 58, abstand: 0.75, bezug: 'buch2.zeile' }, fov: 42, rate: 0.08 },
    neben: [...DRINNEN('gus'), { wer: 'gus', was: 'greifen', ab: 'start', dauer: 0.01, params: { zu: 'buch2.zeile', seite: 'r' } }],
    haupt: { wer: 'gus', was: 'greifen', wort: 'knocked', dauer: 0.5, params: { zu: 'buch2.zeile_ende', seite: 'r' } },
    hauptsache: 'buch2.zeile',
  },
  // "I knocked first," – Rückblende: Bears Stiefel tippt dreimal
  '51': {
    figuren: { bear: { position: UEBER_KOPF, blick: -53 } },
    kamera: { ziel: { anker: 'bear.fuss', versatz: [0, 0.3, 0] }, blick: { azimut: 0, hoehe: 14, abstand: 2.7 }, fov: 42, rate: 0.08 },
    haupt: { wer: 'bear', was: 'stiefel_tippen', wort: 'knocked', dauer: 0.85, params: { seite: 'r', schlaege: 3 } },
    hauptsache: 'bear.fuss',
  },
  // "and it answered." – Rückblende: die Fäuste antworten von unten
  '51:and': {
    figuren: { ok: { position: OK_UNTER_BEAR, blick: 0, gesicht: 'glatt' }, bear: { position: UEBER_KOPF, blick: -53 } },
    kamera: { pos: L(2, -3.2, -37.0), ziel: L(2, -0.35, -31.8), fov: 56, rate: 0.08 },
    haupt: { wer: 'ok', was: 'klopfen_unten', wort: 'answered', dauer: 0.66 },
    hauptsache: 'ok.haende',
  },
  // "The face under the ice wasn't" – Rückblende: Tilt vom Mund zu den Augen des Gesichts unter dem Eis
  '52': {
    figuren: { ok: { position: OK_FLACH, blick: 0, gesicht: 'bear' } },
    kamera: { baustein: 'tilt_up', von_ziel: 'ok.mund', ziel: 'ok.augen', blick: { azimut: 0, hoehe: 62, abstand: 2.0 }, fov: 40, ankunft_wort: 'ice' },
    neben: [{ wer: 'ok', was: 'andruecken', ab: 'start', dauer: 0.01 }],
    haupt: { art: 'kamera', wort: 'ice' },
    hauptsache: 'ok.gesicht',
  },
  // "copying me." – Bear (die Kopie) auf der Bank in der Hütte, ruhig
  '52:copying': {
    licht_anpassung: HUETTE_LICHT,
    figuren: { bear: { position: HU(0.3, 0, 0.95), blick: 190, gesicht: 'ruhig' } },
    kamera: KOPF_INNEN('bear', 175, 2, 2.0, 46, 0.07),
    neben: DRINNEN('bear'),
    haupt: { art: 'gesicht', wer: 'bear', name: 'ruhig', wort: 'copying' },
    hauptsache: 'bear.kopf',
  },
  // "It was Bear," – Rückblende: das Gesicht unter dem Eis, die Augen offen
  '53': {
    figuren: { ok: { position: OK_FLACH, blick: 0, gesicht: 'bear' } },
    kamera: { ziel: 'ok.augen', blick: { azimut: 0, hoehe: 68, abstand: 1.5 }, fov: 38, rate: 0.09 },
    neben: [{ wer: 'ok', was: 'andruecken', ab: 'start', dauer: 0.01 }],
    haupt: { art: 'kamera', wort: 'Bear' },
    hauptsache: 'ok.gesicht',
  },
  // "down there, looking up." – Rückblende von unten (wie S16): oben zieht Gus die Kopie aus dem klaren Fenster
  '53:down': {
    figuren: {
      gus: { position: L(1.65, 0, -31.2), blick: 180 },
      bear: { position: L(2.2, 0, -30.9), blick: 180 },
    },
    kamera: { baustein: 'dolly_out', pos: L(2, -2.0, -29.2), ziel: L(2, 0.7, -32.6), fov: 56, rate: -0.06 },
    set_ereignisse: [{ set: 'see', was: 'klar', versatz: -0.05, dauer: 0.01, mitte: STELLE, radius: 1.35 }],
    neben: [{ wer: 'bear', was: 'gehen', ab: 'start', dauer: 1.5, params: { nach: [1.95, 1000 - 34.2] } }],
    haupt: { wer: 'gus', was: 'gehen', wort: 'down', dauer: 1.5, params: { nach: [1.4, 1000 - 34.5] } },
    hauptsache: 'gus.kopf',
    bogen_wort: 'down',
  },

  // ───────── Klopfen, Ritual, Deckel ─────────
  // "Then, from the fishing hole," – das Eisloch mit dem Deckel daneben; hinten Gus auf der Bank
  '54': {
    licht_anpassung: HUETTE_LICHT,
    figuren: {
      gus: { position: GUS_HUETTE, blick: -171, gesicht: 'leer' },
      stiefel: { position: HU(-0.85, 0, 0.75), blick: 20 },
    },
    kamera: { pos: HU(-0.1, 1.5, -1.2), ziel: HU(-0.3, 0.35, 0.55), fov: 58, rate: 0.07 },
    set_ereignisse: [{ set: 'see', was: 'klar', versatz: -0.05, dauer: 0.01, mitte: STELLE, radius: 1.35, staerke: 0 }],
    neben: DRINNEN('gus'),
    haupt: { art: 'kamera', wort: 'hole' },
    hauptsache: 'huette.loch',
  },
  // "came three taps." – das Wasser im Loch zittert dreimal, die Lampe flackert, Wackeln
  '54:came': {
    licht_anpassung: HUETTE_LICHT,
    kamera: { punkt: 'huette.loch', rate: 0.08, zusaetze: [{ baustein: 'shake', wort: 'three', versatz: 0.12 }] },
    licht_ereignisse: [{ licht_art: 'flackern', ziel: 'huette.lampe', wort: 'came', dauer: 1.0, ende_faktor: 1 }],
    haupt: { art: 'set', set: 'huette', was: 'zittern', wort: 'three', dauer: 1.0, params: { schlaege: 3, staerke: 1.4 } },
    hauptsache: 'huette.loch',
  },
  // "The way Gus taps." – Blitz-Rückblende: Gus' Pickel tippt dreimal
  '55': {
    figuren: { gus: { position: L(-10.55, 0, -47.85), blick: -20 } },
    kamera: { ziel: { anker: 'gus.fuss', versatz: [0, 0.6, 0.25] }, blick: { azimut: 90, hoehe: 8, abstand: 2.9 }, fov: 42, rate: 0.08 },
    haupt: { wer: 'gus', was: 'tippen', wort: 'taps', dauer: 0.85, params: { zu: L(-10.72, 0, -47.38) } },
    hauptsache: 'gus.pickel_spitze',
  },
  // "Wherever you are, he'd promised." – Gus' Gesicht von vorn: er hört es, schaut zum Loch
  '56': {
    licht_anpassung: HUETTE_LICHT,
    figuren: { gus: { position: GUS_HUETTE, blick: 167, gesicht: 'nass' } },
    kamera: KOPF_INNEN('gus', -172, 2, 1.6, 48, 0.07),
    neben: DRINNEN('gus'),
    haupt: { art: 'gesicht', wer: 'gus', name: 'nass', wort: 'promised' },
    hauptsache: 'gus.kopf',
  },
  // "He heard." – Gus groß, er senkt den Blick zum Loch
  '57': {
    licht_anpassung: HUETTE_LICHT,
    figuren: { gus: { position: GUS_HUETTE, blick: 167, gesicht: 'leer' } },
    kamera: KOPF_INNEN('gus', 178, 1, 1.65, 46, 0.08),
    neben: DRINNEN('gus'),
    haupt: { wer: 'gus', was: 'kopf_drehen', wort: 'heard', dauer: 0.3, params: { nicken: 22 } },
    hauptsache: 'gus.kopf',
  },
  // "The ice in the hole turned clear," – Kran auf das Loch: die Eishaut wird klar
  '58': {
    licht_anpassung: HUETTE_LICHT,
    kamera: { baustein: 'crane_down_tilt', punkt: 'huette.loch', hoehe: 0.45, rueck: 0.25, ankunft_wort: 'clear' },
    haupt: { art: 'set', set: 'huette', was: 'klar', wort: 'turned', dauer: 0.8 },
    hauptsache: 'huette.loch',
  },
  // "like a window." – klar wie ein Fenster: darunter steigt ein bleicher Umriss auf
  '58:like': {
    licht_anpassung: HUETTE_LICHT,
    figuren: { ok2: { position: OK2_TIEF, blick: 0, gesicht: 'bear' } },
    kamera: { punkt: 'huette.loch', rate: 0.08 },
    neben: [{ wer: 'ok2', was: 'andruecken', ab: 'start', dauer: 0.9, params: { hoehe: 0.12 } }],
    haupt: { art: 'kamera', wort: 'window' },
    hauptsache: 'ok2.gesicht',
  },
  // "A face pressed up against it." – Tilt vom Mund zu den Augen: Bears Gesicht drückt sich ans Eis
  '59': {
    licht_anpassung: HUETTE_LICHT,
    figuren: { ok2: { position: OK2_TIEF, blick: 0, gesicht: 'bear' } },
    kamera: { baustein: 'tilt_up', von_ziel: 'ok2.mund', ziel: 'ok2.augen', pos: HU(-0.25, 1.3, 0.95), fov: 46, ankunft_wort: 'against' },
    neben: [{ wer: 'ok2', was: 'andruecken', ab: 'start', dauer: 0.01, params: { hoehe: 0.12 } }],
    haupt: { wer: 'ok2', was: 'andruecken', wort: 'pressed', dauer: 0.6 },
    hauptsache: 'ok2.gesicht',
  },
  // "Mine." – Snap-Zoom auf das Gesicht
  '60': {
    licht_anpassung: HUETTE_LICHT,
    figuren: { ok2: { position: OK2_TIEF, blick: 0, gesicht: 'bear' } },
    kamera: { baustein: 'snap_zoom', ziel: 'ok2.gesicht', blick: { azimut: 0, hoehe: 74, abstand: 1.45 }, fov: 40, zeit_wort: 'Mine', faktor: 1.2, bilder: 2 },
    neben: [{ wer: 'ok2', was: 'andruecken', ab: 'start', dauer: 0.01 }],
    haupt: { art: 'kamera', wort: 'Mine' },
    hauptsache: 'ok2.gesicht',
  },
  // "Its lips made one word. Gus." – Großaufnahme des Mundes; auf „Gus“ formen die Lippen das Wort
  '61': {
    licht_anpassung: HUETTE_LICHT,
    figuren: { ok2: { position: OK2_TIEF, blick: 0, gesicht: 'bear' } },
    kamera: { ziel: { anker: 'ok2.mund', versatz: [0, 0, 0.1] }, blick: { azimut: 0, hoehe: 72, abstand: 1.0 }, fov: 40, rate: 0.07 },
    neben: [{ wer: 'ok2', was: 'andruecken', ab: 'start', dauer: 0.01 }, { wer: 'ok2', was: 'lippen_gus', wort: 'Gus', dauer: 0.6 }],
    haupt: { art: 'kamera', wort: 'lips' },
    hauptsache: 'ok2.mund',
  },
  // "Gus put the lid on the hole." – Gus kniet hinter dem Loch und legt den Deckel darauf
  '63': {
    licht_anpassung: HUETTE_LICHT,
    figuren: { gus: { position: HU(-0.25, 0, -0.42), blick: 0, gesicht: 'leer', pose: 'ducken', pose_params: { tiefe: 0.45 } } },
    kamera: { pos: HU(-0.2, 1.3, 1.3), ziel: HU(-0.25, 0.45, -0.05), fov: 56, rate: 0.07 },
    neben: [...DRINNEN('gus'), { wer: 'gus', was: 'greifen', wort: 'Gus', dauer: 0.4, params: { zu: 'huette.deckel', seite: 'r' } }],
    haupt: { art: 'set', set: 'huette', was: 'deckel_drauf', wort: 'put', dauer: 0.6 },
    hauptsache: 'huette.loch',
  },

  // ───────── Schluss ─────────
  // "Then he took my hand, and" – Gus nimmt Bears Hand (beide im Profil, der Deckel liegt auf dem Loch)
  '64': {
    licht_anpassung: HUETTE_LICHT,
    figuren: {
      gus: { position: HU(-0.3, 0, 1.0), blick: 90, gesicht: 'leer' },
      bear: { position: HU(0.3, 0, 1.0), blick: -90, gesicht: 'ruhig' },
    },
    kamera: { pos: HU(0.0, 1.2, -1.0), ziel: HU(0.0, 0.92, 0.95), fov: 50, rate: 0.07 },
    set_ereignisse: [{ set: 'huette', was: 'deckel_drauf', versatz: -0.1, dauer: 0.01 }],
    neben: DRINNEN('gus', 'bear'),
    haupt: { wer: 'gus', was: 'greifen', wort: 'took', dauer: 0.4, params: { zu: 'bear.hand_r', seite: 'l', lehnen: false } },
    hauptsache: 'gus.kopf',
  },
  // "we walked home across the ice." – Totale bei Nacht: zwei Figuren gehen zur Stadt; Gus dampft, Bear nicht
  '64:we': {
    figuren: {
      gus: { position: L(2.6, 0, -20.0), blick: 175 },
      bear: { position: L(3.35, 0, -19.8), blick: 175 },
    },
    kamera: { baustein: 'dolly_out', pos: L(2.7, 1.75, -27.2), ziel: L(2.7, 1.35, -21.8), fov: 40, rate: -0.06 },
    neben: [
      { wer: 'bear', was: 'gehen', ab: 'start', dauer: 1.75, params: { nach: [3.05, 1000 - 23.4] } },
      { wer: 'gus', was: 'kopf_drehen', ab: 'start', versatz: 0.3, dauer: 0.4, params: { zu: 'bear.kopf' } },
    ],
    haupt: { wer: 'gus', was: 'gehen', wort: 'walked', dauer: 1.4, params: { nach: [2.3, 1000 - 23.6] } },
    hauptsache: 'gus.kopf',
  },
  // "Gus doesn't tap the ice anymore." – Folgefahrt auf Gus' Stiefel: der Pickel hängt, er tippt nicht mehr
  '65': {
    figuren: { gus: { position: L(2.3, 0, -24.0), blick: 180 } },
    kamera: { baustein: 'track_follow', folge: 'gus', versatz: [1.7, 0.85, -0.6], ziel_versatz: [0, 0.55, -0.5], lokal: false, fov: 46 },
    haupt: { wer: 'gus', was: 'gehen', wort: 'Gus', dauer: 1.75, params: { nach: [2.3, 1000 - 26.8] } },
    hauptsache: 'gus.fuss',
  },
};
