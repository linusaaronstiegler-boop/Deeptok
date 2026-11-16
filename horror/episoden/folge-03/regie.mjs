// Regie für „Hiding Night“, Teil 3 (Finale): WIE jede Einstellung gezeigt wird.
// WAS sie zeigt und WO geschnitten wird, steht in bildideen.json (Satz + Teilbilder "ab_wort").
// Der Compiler engine/shotliste.mjs setzt beides mit den Wortzeiten aus timing.json zusammen.
// Aufbau und Felder wie in ../folge-02/regie.mjs. Neu im Finale:
//   - keine Endkarte (endkarte: false): harter Schnitt nach „It helps.“, die App spielt in Schleife weiter
//   - Mister Hundred kopfüber durch die Luke (Pose/Aktion „kopfueber“), Junes gedehntes Gesicht
//     („june_gedehnt“, „june_bricht“), zitternde Hände („zittern“)
//   - Kriechkeller: echter Finger durch die Fuge (finger_durch/_tasten/_zurueck), kaltes Lukenlicht
//     (keller.lukenlicht), Morgenlicht durchs Gitter (Licht kriechkeller-morgen, keller.gitter_morgen),
//     Lichtpuls je Zahl (puls), etwas legt sich auf die Dielen (liegen)
//   - Requisiten: wandschatten (Junes zu großer Schatten), taschenlampe (Dads Lampe), armbanduhr (3:00)
//   - Glockenstube: Glockenseil (seil) und Tess' Taschenlampe (strasse.turm_lampe)
//
// Lehren aus den REVIEW.md von Teil 1 und 2, hier eingehalten:
//   - hell genug (Nacht mit Füll-Licht, Kriechkeller ≥ 22 je Einstellung), keine Objekte vor der Linse
//     (alle Seitenfahrten mit vordergrund: false), Gesichter an Schlüsselstellen von vorn
//   - liegende Gesichter mit Rollung −90 (Kopf-oben-Regel), Monster mit kalter Kante
//   - die drei Lichtereignisse des Teils: Satz 19 (Taschenlampe aus), 38 (Lukenlicht an), 52 (Junes Lampe aus)
//
// Koordinaten wie in Teil 2: 1 m, y oben. Der Kriechkeller steht bei x = 300 (lokal + [300, 0, 0]).

const SO = 0.6, OG = 3.8;  // Erdgeschossboden und Boden des Obergeschosses im Marsh-Haus
const KX = 300;
const kw = (x, y, z) => [KX + x, y, z];
const TZ = -63;            // Turm der Kirche (z der Turmmitte)

const ORT = {
  kellerEli: kw(1.3, 0, -0.35),          // Eli liegt im Kriechkeller (Füße hier, blick 90: Kopf bei x ≈ −0,5)
  kellerMonster: kw(-0.45, 1.032, -0.45), // Mister Hundred steht oben auf den Dielen über Elis Gesicht
  kellerLuke: kw(0.45, 1.016, -0.40),    // Requisite luke_k an Anker keller.luke_angel
  // kopfüber durch die Luke: die Füße hoch über dem Zimmer, der Kopf hängt im Keller über Elis Brust,
  // das Gesicht schaut nach −x zu Eli (blick 90, neigung 180)
  monsterKopfueber: kw(0.42, 7.18, 0.0),
  luke: [-19.25, SO, 2.0],               // Requisite luke in Junes Zimmer (blick 90)
  lukeMitte: [-18.8, SO, 2.0],
  juneBett: [-18.85, 1.0, 4.2],          // June liegt im Bett (pose liegen, blick 90: Kopf zum Kissen bei −x)
  eliBett: [-15.75, 4.3, 3.0],           // Eli liegt in seinem Bett (blick 180: Kopf zum Kissen bei +z)
  juneFensterAussen: [-18.6, 0, 6.2],    // vor Junes Seitenfenster (Fenster außen bei z 5,05)
  monsterJuneFenster: [-18.6, 0.37, 8.65],
  pikeEinfahrt: [8.6, 0, -12.6],
  turmBoden: 12.75,                      // Boden der Glockenstube
};
const BEUGEN_FENSTER = { winkel: 100, kopf_ausgleich: 88, knie: 60 };

export const titel = 'Hiding Night – Teil 3 (Finale)';
export const seed = 3613;
export const monster = ['mh', 'mh_turm'];
// harter Schnitt 0,14 s nach „It helps.“; keine Endkarte (Empfehlung der Kritik, Linus entscheidet)
export const nachlauf = 0.14;
export const endkarte = false;

export const look = { licht: 'nacht', belichtung: 1.08, bloom: { staerke: 0.55, radius: 0.55, schwelle: 1.0 }, vignette: 0.32, korn: 0.025, toene: 'aces' };

export const sets = [
  // Turmuhr: 11:00 bis zur Nacht, 3:00 im Lockruf (Satz 31), Sonnenaufgang 6:10
  { id: 'strasse', modul: 'hauptstrasse', params: { uhr: { zeit: '11:58', spruenge: [] }, licht_an: 0.8,
    glocke: { offen: true, seil: true, lampe: { pos: [0.45, 13.55, TZ + 1.25], richtung: [-0.12, -0.3, 1], kegel: 0.5, laenge: 7 } } } },
  { id: 'marsh', modul: 'marsh_haus' },
  { id: 'haus', modul: 'marsh_innen', params: { kuchen: false, luke: 'figur', taschenlampe: false } },
  { id: 'spur', modul: 'reifspur' },
  { id: 'keller', modul: 'kriechkeller', position: [KX, 0, 0], params: { lukenlicht: true, morgen: true } },
];

const MH_PARAMS = { ellbogen_pol: [1, 0.05, 0.1], ellbogen_spitze: 0.5, spitzen_glut: 0.3, naegel: '#6c7075', mantel: { farbe: '#34363f', saum: '#3d3f4a', kante: 0.7, exponent: 2.8 } };
export const figuren = [
  { id: 'eli', modul: 'eli', gesicht: 'neutral' },
  { id: 'june', modul: 'june', params: { barfuss: true }, gesicht: 'zaehlt_a' },
  { id: 'june18', modul: 'june', params: { rueckblende: true, barfuss: true }, gesicht: 'besorgt' },   // Rückblende: June mit 18, barfuß
  { id: 'dad', modul: 'dad', gesicht: 'entschlossen' },
  { id: 'tess', modul: 'tess', gesicht: 'nervoes' },
  { id: 'odell', modul: 'odell', gesicht: 'muede' },
  { id: 'mh', modul: 'mister_hundred', gesicht: 'glatt', blinzeln: false, params: MH_PARAMS },
  // „taller than anyone knew“: am Turm ist es doppelt so groß (etwa 14 m), der Kopf an der Schallluke
  { id: 'mh_turm', modul: 'mister_hundred', gesicht: 'glatt', blinzeln: false, params: { ...MH_PARAMS, groesse: 2.0 } },
  // Requisiten
  { id: 'luke_k', modul: 'luke', params: { teppich: false, groesse: [0.8, 0.8] } },
  { id: 'luke_tp', modul: 'luke', params: { teppich: true } },
  { id: 'pk2', modul: 'pickup', params: { stiefel: true, scheinwerfer: false } },
  { id: 'sp_june', modul: 'schuhpaar', params: { art: 'june' } },
  { id: 'sp_eli', modul: 'schuhpaar', params: { art: 'eli' } },
  { id: 'sp_tess', modul: 'schuhpaar', params: { art: 'tess' } },
  { id: 'sp_f1', modul: 'schuhpaar', params: { art: 'dad', ordnung: 'schief' } },
  { id: 'sp_f2', modul: 'schuhpaar', params: { art: 'nachbar', ordnung: 'getreten' } },
  { id: 'sch_june', modul: 'wandschatten', params: { form: 'raute', breite: 1.5, hoehe: 2.45, deckkraft: 0 } },
  { id: 'sch_rolle', modul: 'wandschatten', params: { form: 'eingerollt', breite: 2.3, hoehe: 1.5, deckkraft: 0.55 } },
  { id: 'sch_bett', modul: 'wandschatten', params: { form: 'fenster', breite: 1.3, hoehe: 1.6, deckkraft: 0, liegend: true } },
  { id: 'sch_w1', modul: 'wandschatten', params: { form: 'fenster', breite: 3.2, hoehe: 3.4, deckkraft: 0.62 } },
  { id: 'sch_w2', modul: 'wandschatten', params: { form: 'fenster', breite: 3.2, hoehe: 3.4, deckkraft: 0.62 } },
  { id: 'lampe_dad', modul: 'taschenlampe', params: { an: true, kegel: 0.3 } },
  { id: 'lampe_alt', modul: 'taschenlampe', params: { an: false, staubig: true } },
  { id: 'uhr', modul: 'armbanduhr', params: { zeit: '2:59', groesse: 1.6 }, gesicht: '2_59', blinzeln: false, atmen: false },
];

// ---------- Licht ----------
const NACHT_HELL = { hemi: { staerke: 2.9 }, kante: { staerke: 1.6 }, belichtung: 1.7 };
const ROLL_LIEGEN = -90;
// Eli liegt im Keller (Review Teil 2: Kopf 30–38° zur Kamera gedreht, Rollung −90 für ein aufrechtes Gesicht)
const ELI_K = (gesicht = 'besorgt', kopf = 36, mehr = {}) => ({ eli: { position: ORT.kellerEli, blick: 90, pose: 'liegen', pose_params: { kopf }, gesicht, ...mehr } });
// Eli von vorn (liegend): Ziel auf die Augen, damit sie nicht im Untertitel-Streifen liegen
const ELI_NAH = (abstand = 1.0, azimut = 192, hoehe = 22, rate = 0.07, fov = 46) => ({ ziel: { anker: 'eli.augen', versatz: [0, 0.02, 0] }, blick: { azimut, hoehe, abstand }, fov, roll: ROLL_LIEGEN, rate });
// Mister Hundred oben auf den Dielen (unsichtbar über der Leuchtfläche; nur seine Sohlen sind zu sehen)
const MH_OBEN = { mh: { position: ORT.kellerMonster, blick: 0, gesicht: 'glatt' } };
// Mister Hundred kopfüber im Keller; mehr = Gesicht, Hände
const MH_KOPF = (gesicht = 'glatt', mehr = {}) => ({ mh: { position: ORT.monsterKopfueber, blick: 90, pose: 'kopfueber', pose_params: { neigung: 180, nicken: 0 }, gesicht, ...mehr } });
// Großaufnahme aus Elis Blick: von −x auf das Gesicht, Rollung 180 (der Kopf hängt kopfüber)
const MH_GROSS = (abstand = 0.8, hoehe = -8, fov = 50, rate = 0.07, versatz = [0, 0, 0]) => ({ ziel: { anker: 'mh.kopf', versatz }, blick: { azimut: -90, hoehe, abstand }, fov, roll: 180, rate });
const HAENDE_WEG = { wer: 'mh', was: 'haende_weg', ab: 'start', dauer: 0.01 };
// Junes Gesicht im Keller ausleuchten: Schnellbogen zeigte es blau und zu dunkel (Gegenlicht aus der Luke)
const MH_LICHT = { hemi: { himmel: '#c8d4ff', boden: '#6a5040', staerke: 2.4 }, belichtung: 1.55 };
const KELLER_AUS_MORGEN = { 'keller.gitter_morgen': false };
// nach Satz 19 ist Tess' Lampe aus; der Compiler schaltet strasse.* an jedem Nacht-Schnitt an
const TURM_AUS = { 'strasse.turm_lampe': false };
const MORGEN_INNEN = { belichtung: 1.15 };

export const einstellungen = {
  // ───────── Hook: Anschluss an das letzte Bild von Teil 2 ─────────
  // "Mister Hundred takes you at eighteen" – vier Fingerschatten quer über den Fugen, kalte Spitzen
  '1': {
    figuren: MH_OBEN,
    lampen_einzeln: { 'keller.lukenlicht': false, ...KELLER_AUS_MORGEN },
    kamera: { baustein: 'crane_down_tilt', ziel: kw(-0.33, 1.0, 0.3), blick: { azimut: 180, hoehe: -76, abstand: 0.72 }, hoehe: 0.18, rueck: 0.05, ankunft_wort: 'Hundred', fov: 62 },
    licht_anpassung: { belichtung: 0.65 },
    set_ereignisse: [
      { set: 'keller', was: 'fuesse', versatz: -0.5, dauer: 0.01, mitte: [-0.45, -0.45], drehung: 0 },
      { set: 'keller', was: 'finger', versatz: -0.6, dauer: 0.3, von: [-0.33, 1.1], nach: [-0.33, 1.05], drehung: -90, skala: 1.25, spreizen: 14, spreiz_dauer: 0.2 },
      { set: 'keller', was: 'biegen', versatz: -0.5, dauer: 0.01, tiefe: 0.05, mitte: [-0.45, -0.1], radius: 0.75 },
    ],
    haupt: { art: 'kamera', wort: 'Hundred' },
    hauptsache: 'mh.fuss',
  },
  // "if it finds you, and it" – Elis Gesicht, die Fingerschatten liegen über seinen Augen
  '1:if': {
    figuren: ELI_K('besorgt', 30),
    kamera: ELI_NAH(0.95, 186, 40, 0.08),
    haupt: { art: 'gesicht', wer: 'eli', name: 'angst', wort: 'finds' },
    hauptsache: 'eli.kopf',
  },
  // "called to me in my sister's voice." – Untersicht auf den Lichtspalt um die geschlossene Luke
  '1:called': {
    figuren: { luke_k: { position: ORT.kellerLuke, blick: 0 } },
    kamera: { pos: kw(0.15, 0.28, -0.95), ziel: kw(0.45, 1.0, -0.05), fov: 54, rate: 0.07 },
    partikel: [{ art: 'schweben', ort: kw(0.45, 0.8, -0.1), bereich: [0.9, 0.4, 0.9], anzahl: 90, groesse: 0.004, farbe: '#ffe0b0', deckkraft: 0.6 }],
    haupt: { art: 'kamera', wort: "sister's" },
    hauptsache: 'keller.luke',
  },

  // ───────── Neu pflanzen: die Regel, Junes Versprechen ─────────
  // "Nobody can help you hide." – Eli von vorn, die Fingerschatten wandern langsam über sein Gesicht
  '2': {
    figuren: ELI_K('neutral', 36),
    kamera: ELI_NAH(1.05, 194, 24, 0.07),
    set_ereignisse: [{ set: 'keller', was: 'finger', versatz: 0, dauer: 1.6, von: [-0.2, 1.2], nach: [-0.45, 0.95], drehung: -100, skala: 1.2, spreizen: 10, spreiz_dauer: 0.6 }],
    haupt: { art: 'gesicht', wer: 'eli', name: 'besorgt', wort: 'help' },
    hauptsache: 'eli.kopf',
  },
  // "If they try, it takes them too." – Staub rieselt aus einer Fuge, die Diele gibt 1 cm nach
  '3': {
    kamera: { baustein: 'crane_down_tilt', ziel: kw(-0.6, 0.55, 0.0), blick: { azimut: 160, hoehe: 12, abstand: 1.3 }, hoehe: 0.35, rueck: 0.1, ankunft_wort: 'takes', fov: 52 },
    licht_anpassung: { hemi: { staerke: 1.0 }, belichtung: 1.45 },
    haupt: { art: 'set', set: 'keller', was: 'biegen', wort: 'takes', dauer: 0.3, params: { tiefe: 0.065, mitte: [-0.45, -0.1], radius: 0.75 } },
    partikel: [{ art: 'staub', ort: kw(-0.55, 0.9, 0.0), wort: 'takes', farbe: '#e8dcc8', anzahl: 140, groesse: 0.0045, bereich: [0.3, 0.25, 0.3], deckkraft: 0.75, dauer: 1.6 }],
    hauptsache: kw(-0.55, 0.6, 0.0),
  },
  // "My sister June hid me anyway," – Elis Auge groß, ein Lichtstreifen quer darüber; es zuckt zur Luke
  '4': {
    figuren: ELI_K('besorgt', 34),
    kamera: { ziel: { anker: 'eli.augen', versatz: [0, 0.02, 0.05] }, blick: { azimut: 196, hoehe: 26, abstand: 0.55 }, fov: 40, roll: ROLL_LIEGEN, rate: 0.07 },
    haupt: { wer: 'eli', was: 'kopf_drehen', wort: 'June', dauer: 0.25, params: { winkel: -12, nicken: -6 } },
    hauptsache: 'eli.augen',
  },
  // "under her room." – Untersicht: die geschlossene Luke mit dem Eisenring
  '4:under': {
    figuren: { luke_k: { position: ORT.kellerLuke, blick: 0 } },
    kamera: { punkt: 'keller.luke_unten', rate: 0.09 },
    haupt: { art: 'kamera', wort: 'room' },
    hauptsache: 'keller.luke',
  },
  // "It never looks in my room, Rabbit." – Eli blickt zum Lichtspalt der Luke; Junes Satz als Erinnerung
  '5': {
    figuren: ELI_K('besorgt', 34),
    kamera: ELI_NAH(1.05, 192, 22, 0.06),
    haupt: { wer: 'eli', was: 'kopf_drehen', wort: 'looks', dauer: 0.3, params: { winkel: -18 } },
    hauptsache: 'eli.kopf',
  },
  // "Every night, she counts to one hundred" – Erinnerung (nicht entsättigt): June zählt im Bett
  '6': {
    figuren: { june: { position: ORT.juneBett, blick: 90, pose: 'liegen', gesicht: 'zaehlt_a' } },
    kamera: { ziel: { anker: 'june.kopf', versatz: [0, 0.04, 0] }, blick: { azimut: 92, hoehe: 50, abstand: 1.7 }, fov: 40, rate: 0.07 },
    licht_anpassung: { belichtung: 0.8 },
    haupt: { art: 'gesicht', wer: 'june', name: 'zaehlt_b', wort: 'counts' },
    mund: { wer: 'june', art: 'zaehlen', takt: 0.24 },
    hauptsache: 'june.kopf',
  },
  // "before she falls asleep." – Rückfahrt bis zur Wand: auf „asleep“ steht Junes Schatten dort 0,5 s
  // viel zu groß, mit spitzen Ellbogen und der Raute vor dem Kopf (Suchbild, ohne Ton, ohne Zoom)
  '6:before': {
    figuren: {
      june: { position: ORT.juneBett, blick: 90, pose: 'liegen', gesicht: 'zaehlt_a' },
      sch_june: { position: [-20.76, SO + 0.45, 4.2], blick: 90 },
    },
    kamera: { baustein: 'dolly_out', ziel: [-20.3, 1.55, 4.2], pos: [-17.6, 2.45, 4.0], fov: 58, rate: -0.07 },
    licht_anpassung: { belichtung: 0.85 },
    haupt: { wer: 'sch_june', was: 'einblenden', wort: 'asleep', dauer: 0.12, params: { deckkraft: 0.62 } },
    neben: [{ wer: 'sch_june', was: 'einblenden', wort: 'asleep', versatz: 0.5, dauer: 0.12, params: { deckkraft: 0 } }],
    mund: { wer: 'june', art: 'zaehlen', takt: 0.26 },
    hauptsache: 'june.kopf',
  },
  // "She says it helps." – June nah, sie lächelt im Halbschlaf; der Schatten ist wieder normal
  '7': {
    figuren: { june: { position: ORT.juneBett, blick: 90, pose: 'liegen', gesicht: 'zaehlt_a' } },
    kamera: { ziel: { anker: 'june.kopf', versatz: [0, 0.05, 0] }, blick: { azimut: 96, hoehe: 58, abstand: 1.35 }, fov: 38, rate: 0.06 },
    licht_anpassung: { belichtung: 0.8 },
    haupt: { art: 'gesicht', wer: 'june', name: 'verschlafen/laecheln', wort: 'helps' },
    mund: { wer: 'june', art: 'zaehlen', takt: 0.3, bis: 'helps' },
    hauptsache: 'june.kopf',
  },

  // ───────── Nach „Ready?“: heute Nacht ─────────
  // "Tonight, something above me" – Seitenfahrt unter den Fugen: lange Sohlen verdunkeln das Licht
  '8': {
    kamera: { baustein: 'truck_side', pos: kw(-0.2, 0.3, -0.2), ziel: kw(-0.45, 1.0, -0.4), fov: 62, richtung: 'links', strecke: 0.6, vordergrund: false },
    set_ereignisse: [
      { set: 'keller', was: 'fuesse', versatz: -0.02, dauer: 0.01, mitte: [-0.45, -0.45], drehung: 0 },
      { set: 'keller', was: 'biegen', wort: 'something', dauer: 0.5, tiefe: 0.06, mitte: [-0.45, -0.1], radius: 0.75 },
    ],
    haupt: { art: 'kamera', wort: 'something' },
    hauptsache: 'keller.fuesse',
  },
  // "finished her count, and" – Eli von vorn, Augen weit, Zehenschatten über seiner Stirn
  '8:finished': {
    figuren: ELI_K('besorgt', 36),
    kamera: ELI_NAH(0.9, 190, 30, 0.08),
    haupt: { art: 'gesicht', wer: 'eli', name: 'angst', wort: 'count' },
    hauptsache: 'eli.kopf',
  },
  // "asked if I was ready." – die vier Fingerschatten legen sich über die Fugen und spreizen sich
  '8:asked': {
    kamera: { punkt: 'keller.pov', rate: 0.06 },
    licht_anpassung: { belichtung: 0.65 },
    haupt: { art: 'set', set: 'keller', was: 'finger', wort: 'ready', versatz: -0.1, dauer: 0.3, params: { von: [-0.33, 1.3], nach: [-0.33, 1.05], drehung: -90, skala: 1.25, spreizen: 14, spreiz_dauer: 0.2 } },
    hauptsache: 'keller.dielen_mitte',
  },
  // "I held my breath." – Eli presst die Hand auf den Mund
  '9': {
    figuren: ELI_K('angst', 36),
    kamera: ELI_NAH(1.0, 192, 22, 0.07),
    haupt: { wer: 'eli', was: 'mund_zuhalten', wort: 'breath', anker: 'ende', params: { seite: 'r' } },
    hauptsache: 'eli.kopf',
  },
  // "It still came out white." – weißer Atem quillt zwischen seinen Fingern hervor
  '10': {
    figuren: ELI_K('angst', 36, { }),
    kamera: ELI_NAH(0.7, 194, 26, 0.08, 42),
    neben: [{ wer: 'eli', was: 'mund_zuhalten', ab: 'start', dauer: 0.01, params: { seite: 'r' } }],
    haupt: { art: 'partikel', partikel_art: 'atem', wort: 'white', ort: 'eli.mund', periode: 1.0, richtung: [0, 1, 0.15], groesse: 0.1, deckkraft: 0.9, dauer: 1.3 },
    hauptsache: 'eli.kopf',
  },
  // "Then the weight lifted off the boards." – die Dielen richten sich auf, die Fugen werden hell, Staub
  '11': {
    figuren: ELI_K('angst', 34),
    kamera: { baustein: 'dolly_out', ziel: { anker: 'eli.kopf', versatz: [0.2, 0.3, 0] }, blick: { azimut: 170, hoehe: 18, abstand: 1.0 }, fov: 58, roll: ROLL_LIEGEN, rate: -0.08 },
    haupt: { art: 'set', set: 'keller', was: 'biegen', wort: 'lifted', dauer: 0.45, params: { tiefe: 0, mitte: [-0.45, -0.1], radius: 0.75 } },
    set_ereignisse: [
      { set: 'keller', was: 'fuesse', wort: 'lifted', dauer: 0.01, aus: true },
      { set: 'keller', was: 'finger', wort: 'lifted', dauer: 0.01, aus: true },
    ],
    partikel: [{ art: 'staub', ort: kw(-0.45, 0.9, -0.2), wort: 'lifted', farbe: '#e8dcc8', anzahl: 160, groesse: 0.0045, bereich: [0.4, 0.25, 0.35], deckkraft: 0.7, dauer: 1.6 }],
    hauptsache: 'eli.kopf',
  },
  // "Through a crack, I saw" – Eli dreht das Auge zu einer Fuge über seiner Schulter
  '12': {
    figuren: ELI_K('besorgt', 30),
    kamera: ELI_NAH(0.85, 205, 18, 0.07),
    haupt: { wer: 'eli', was: 'kopf_drehen', wort: 'crack', dauer: 0.3, params: { winkel: 14, nicken: -8 } },
    hauptsache: 'eli.kopf',
  },
  // "June's red sneakers by her bed," – auf Bodenhöhe durch Junes Zimmer zu ihren roten Turnschuhen
  '12:June\'s': {
    figuren: { sp_june: { position: [-19.15, SO, 3.25], blick: 180 }, luke_tp: { position: ORT.luke, blick: 90 } },
    kamera: { baustein: 'truck_side', pos: [-18.05, 0.78, 2.35], ziel: [-19.15, 0.66, 3.25], fov: 50, richtung: 'rechts', strecke: 0.7, vordergrund: false },
    licht_anpassung: { belichtung: 1.05 },
    haupt: { art: 'kamera', wort: 'sneakers' },
    hauptsache: 'sp_june.mitte',
  },
  // "side by side." – Snap-Zoom: die roten Turnschuhe nebeneinander, ganz gerade
  '12:side': {
    figuren: { sp_june: { position: [-19.15, SO, 3.25], blick: 180 } },
    kamera: { baustein: 'snap_zoom', ziel: 'sp_june.mitte', blick: { azimut: 150, hoehe: 24, abstand: 0.9 }, fov: 40, zeit_wort: 'side', faktor: 1.18, bilder: 2 },
    licht_anpassung: { belichtung: 1.05 },
    haupt: { art: 'kamera', wort: 'side' },
    hauptsache: 'sp_june.mitte',
  },
  // "Side by side is all it leaves." – die Schuhe von der Seite, dahinter das leere Bett im Lampenlicht
  '13': {
    figuren: { sp_june: { position: [-19.15, SO, 3.25], blick: 180 } },
    kamera: { ziel: { anker: 'sp_june.mitte', versatz: [-0.2, 0.1, 0.2] }, blick: { azimut: 80, hoehe: 6, abstand: 1.3 }, fov: 44, rate: 0.07 },
    licht_anpassung: { belichtung: 1.0 },
    haupt: { art: 'kamera', wort: 'leaves' },
    hauptsache: 'sp_june.mitte',
  },
  // "It took her, I thought, because she helped me." – Eli von vorn, er schließt kurz die Augen
  '14': {
    figuren: ELI_K('besorgt', 36),
    kamera: ELI_NAH(1.0, 188, 24, 0.05),
    haupt: { art: 'gesicht', wer: 'eli', name: 'augen_zu', wort: 'helped' },
    hauptsache: 'eli.kopf',
  },
  // "It left through her window." – außen an Junes Fenster: ein langer kalkweißer Fuß tritt in den Reif
  '15': {
    set: ['strasse', 'marsh', 'spur'],
    figuren: { mh: { position: ORT.juneFensterAussen, blick: 0, gesicht: 'glatt' } },
    kamera: { baustein: 'crane_down_tilt', ziel: [-18.45, 0.35, 6.9], blick: { azimut: 70, hoehe: 12, abstand: 2.6 }, hoehe: 2.2, rueck: 0.6, ankunft_wort: 'window', fov: 54 },
    licht_anpassung: NACHT_HELL,
    haupt: { wer: 'mh', was: 'stapfen', wort: 'window', anker: 'ende', dauer: 1.0, params: { nach: [-18.6, 7.4], schritt: 0.9, halt_im_schritt: true } },
    hauptsache: 'mh.fuss_r',
  },

  // ───────── Spiegelszene: der Turm ─────────
  // "Through the vent, I saw the" – Eli dreht den Kopf zum Gitter, Mondlicht auf dem Gesicht
  '16': {
    figuren: ELI_K('besorgt', 30),
    kamera: ELI_NAH(1.0, 210, 22, 0.07),
    haupt: { wer: 'eli', was: 'kopf_drehen', wort: 'vent', dauer: 0.3, params: { winkel: 20 } },
    hauptsache: 'eli.kopf',
  },
  // "bell tower," – der Kirchturm über die Dächer, vom Fuß des Marsh-Hauses aus (Elis Blick durchs Gitter)
  '16:bell': {
    kamera: { pos: [-9.6, 0.45, 4.2], ziel: [0, 13.0, TZ], fov: 20, rate: 0.08 },
    licht_anpassung: NACHT_HELL,
    haupt: { art: 'kamera', wort: 'tower' },
    hauptsache: 'strasse.glocke',
  },
  // "where Tess Lowry was hiding," – die offene Schallluke: Taschenlampenkegel, Tess' weißer Bob
  '16:where': {
    figuren: { tess: { position: [0.42, ORT.turmBoden, TZ + 1.55], blick: 15, gesicht: 'nervoes' } },
    kamera: { pos: [2.2, 13.6, TZ + 7.5], ziel: [0.5, 13.7, TZ + 1.0], fov: 30, rate: 0.07 },
    licht_anpassung: NACHT_HELL,
    haupt: { wer: 'tess', was: 'kopf_drehen', wort: 'Tess', dauer: 0.3, params: { winkel: 28 } },
    hauptsache: 'tess.kopf',
  },
  // "higher than any window." – von der Schallluke hinab: die oberen Fenster liegen tief darunter
  '16:higher': {
    kamera: { pos: [2.6, 14.4, TZ + 3.2], ziel: [-6.5, 4.5, -34], fov: 52, rate: 0.07 },
    licht_anpassung: NACHT_HELL,
    haupt: { art: 'kamera', wort: 'higher' },
    hauptsache: [-12, 5, -31],
  },
  // "It stood up straight," – einzige Totale: es richtet sich neben dem Turm auf, von hinten, die Kamera steigt mit
  '17': {
    figuren: { mh_turm: { position: [-1.4, 0, -55.6], blick: 180, gesicht: 'glatt', pose: 'vorbeugen', pose_params: { winkel: 55, kopf_ausgleich: 30, knie: 30 } } },
    kamera: { baustein: 'tilt_up', von_ziel: { anker: 'mh_turm.huefte' }, ziel: { anker: 'mh_turm.kopf', versatz: [0, 0.6, 0] }, pos: [-3.6, 2.2, -40.5], ankunft_wort: 'straight', kran: 2.0, fov: 58 },
    licht_anpassung: { ...NACHT_HELL, kante: { staerke: 2.0 } },
    haupt: { wer: 'mh_turm', was: 'vorbeugen', wort: 'straight', anker: 'ende', dauer: 0.9, params: { winkel: 12, kopf_ausgleich: 4, knie: 0 } },
    hauptsache: 'mh_turm.kopf',
  },
  // "taller than anyone knew." – Untersicht vom Turmfuß: der Kopf in der Raute auf Höhe der Schallluke
  '17:taller': {
    figuren: { mh_turm: { position: [-1.4, 0, -55.6], blick: 180, gesicht: 'glatt', pose: 'vorbeugen', pose_params: { winkel: 12, kopf_ausgleich: 4, knie: 0 } } },
    kamera: { pos: [-6.5, 0.9, -49.0], ziel: { anker: 'mh_turm.haende', versatz: [0, -1.2, 0] }, fov: 58, rate: 0.07 },
    licht_anpassung: { ...NACHT_HELL, kante: { staerke: 2.0 } },
    haupt: { art: 'kamera', wort: 'knew' },
    hauptsache: 'mh_turm.haende',
  },
  // "Then it took its hands away from its face." – von hinten: die Raute löst sich, die Hände sinken
  '18': {
    figuren: { mh_turm: { position: [-1.4, 0, -55.6], blick: 180, gesicht: 'glatt', pose: 'vorbeugen', pose_params: { winkel: 12, kopf_ausgleich: 4, knie: 0 } } },
    kamera: { pos: [-2.6, 10.5, -44.5], ziel: { anker: 'mh_turm.kopf', versatz: [0, -1.0, 0] }, fov: 50, rate: 0.07 },
    licht_anpassung: { ...NACHT_HELL, kante: { staerke: 2.0 } },
    haupt: { wer: 'mh_turm', was: 'haende_weg', wort: 'hands', dauer: 1.0 },
    hauptsache: 'mh_turm.kopf',
  },
  // "Her flashlight went out." – die Schallluke nah: der Kegel geht aus (Lichtereignis 1 von 3)
  '19': {
    kamera: { baustein: 'statisch', pos: [1.8, 13.5, TZ + 6.8], ziel: [0.3, 13.6, TZ + 1.0], fov: 32 },
    licht_anpassung: NACHT_HELL,
    haupt: { art: 'licht', licht_art: 'aus', ziel: 'strasse.turm_lampe', wort: 'out', vorlauf: 0.05, dauer: 0.1 },
    hauptsache: [0.3, 13.6, TZ + 1.0],
  },
  // "The bell rope swung once," – in der dunklen Schallluke schwingt das Glockenseil einmal
  '20': {
    kamera: { pos: [1.5, 13.3, TZ + 5.6], ziel: [0.5, 13.2, TZ + 0.4], fov: 30, rate: 0.06 },
    licht_anpassung: NACHT_HELL,
    lampen_einzeln: TURM_AUS,
    haupt: { art: 'set', set: 'strasse', was: 'seil', wort: 'swung', dauer: 1.4 },
    hauptsache: [0.62, 13.2, TZ + 0.35],
  },
  // "without a sound." – Eli am Gitter, Mondlicht auf dem Gesicht, er hält den Atem an
  '20:without': {
    figuren: ELI_K('angst', 30),
    kamera: ELI_NAH(0.9, 194, 22, 0.07),
    haupt: { wer: 'eli', was: 'atem_anhalten', wort: 'sound' },
    hauptsache: 'eli.kopf',
  },

  // ───────── Die Straße, der Finger ─────────
  // "Then it came down Main Street," – Seitenfahrt auf Bodenhöhe: Saum und lange nackte Füße
  '21': {
    figuren: { mh: { position: [-5.4, 0, -27.0], blick: 0, gesicht: 'glatt' } },
    kamera: { baustein: 'truck_side', pos: [-1.6, 0.5, -23.6], ziel: [-5.4, 0.9, -24.6], fov: 54, richtung: 'links', strecke: 1.2, vordergrund: false },
    licht_anpassung: NACHT_HELL,
    lampen_einzeln: TURM_AUS,
    haupt: { wer: 'mh', was: 'stapfen', wort: 'Main', dauer: 1.3, params: { nach: [-5.4, -23.5], schritt: 0.9 } },
    hauptsache: 'mh.knie',
  },
  // "looking in every upstairs window." – obere Fenster von außen, der Schatten der Raute legt sich auf jedes
  '21:looking': {
    figuren: {
      sch_w2: { position: [-11.55, 3.6, -17.0], blick: 90 },
      sch_w1: { position: [-11.55, 3.6, -31.0], blick: 90, sichtbar: false },
    },
    kamera: { pos: [3.2, 3.4, -9.5], ziel: [-11.5, 5.2, -24.0], fov: 46, rate: 0.07 },
    licht_anpassung: NACHT_HELL,
    lampen_einzeln: TURM_AUS,
    haupt: { wer: 'sch_w1', was: 'sichtbar', wort: 'window', params: { wert: true }, dauer: 0.01 },
    neben: [{ wer: 'sch_w2', was: 'sichtbar', wort: 'upstairs', params: { wert: false } }],
    hauptsache: [-11.9, 5.0, -24.0],
  },
  // "It stopped at mine," – Elis leeres Zimmer: der Schatten der Raute fällt durchs Fenster auf sein Bett
  '22': {
    figuren: { sch_bett: { position: [-15.7, 4.36, 3.75], blick: 90 } },
    kamera: { pos: [-14.0, OG + 1.9, 1.3], ziel: [-15.7, OG + 0.5, 3.7], fov: 54, rate: 0.07 },
    licht_anpassung: { belichtung: 1.05 },
    lampen_einzeln: { 'haus.eli_lampe': false },
    haupt: { wer: 'sch_bett', was: 'einblenden', wort: 'mine', dauer: 0.25, params: { deckkraft: 0.66 } },
    hauptsache: [-15.7, OG + 0.5, 3.7],
  },
  // "then bent down to June's." – außen: es beugt sich 60–70° vor Junes Fenster im Erdgeschoss
  '22:then': {
    set: ['strasse', 'marsh', 'spur'],
    figuren: { mh: { position: ORT.monsterJuneFenster, blick: 180, gesicht: 'glatt', pose: 'vorbeugen', pose_params: { winkel: 30, kopf_ausgleich: 20, knie: 10 } } },
    // über die Schulter (Hausrückseite) wie in Teil 2: von der Seite las sich der waagrecht gebeugte Mantel als Kranarm
    kamera: { baustein: 'crane_down_tilt', ziel: [-18.6, 2.3, 5.1], blick: { azimut: -13, hoehe: 13, abstand: 4.9 }, hoehe: 1.5, rueck: 0.4, ankunft_wort: 'bent', fov: 50 },
    licht_anpassung: NACHT_HELL,
    lampen_einzeln: TURM_AUS,
    haupt: { wer: 'mh', was: 'vorbeugen', wort: 'bent', dauer: 0.9, params: BEUGEN_FENSTER },
    hauptsache: 'mh.haende',
  },
  // "I wanted to run, but" – Eli stemmt sich auf, als wolle er zur Luke, und erstarrt
  '23': {
    figuren: ELI_K('angst', 34),
    kamera: ELI_NAH(1.2, 186, 26, 0.08),
    haupt: { wer: 'eli', was: 'erschrecken', wort: 'run', params: { staerke: 0.6 } },
    gesichter: [{ wer: 'eli', name: 'entschlossen', wort: 'run' }],
    hauptsache: 'eli.kopf',
  },
  // "Owen Pike ran, and only his" – entsättigt: Owens Pick-up mit laufendem Motor, der Auspuff dampft
  '23:Owen': {
    figuren: { pk2: { position: ORT.pikeEinfahrt, blick: -90, pose: 'tuer_auf', pose_params: { winkel: 62 } } },
    kamera: { pos: [3.0, 2.6, -6.4], ziel: [8.6, 1.1, -12.4], fov: 46, rate: 0.07 },
    licht_anpassung: { belichtung: 1.3 },
    partikel: [{ art: 'atem', ort: 'pk2.auspuff', periode: 0.55, richtung: [0.2, 1, 0], groesse: 0.28, deckkraft: 0.8 }],
    haupt: { art: 'kamera', wort: 'ran' },
    hauptsache: 'pk2.mitte',
  },
  // "shoes came home." – Owens Stiefel auf dem Sitz, nebeneinander
  '23:shoes': {
    figuren: { pk2: { position: ORT.pikeEinfahrt, blick: -90, pose: 'tuer_auf', pose_params: { winkel: 62 } } },
    kamera: { ziel: 'pk2.sitz', blick: { azimut: 10, hoehe: 32, abstand: 1.22 }, fov: 44, rate: 0.07 },
    licht_anpassung: { belichtung: 1.55, hemi: { staerke: 2.8 }, haupt: { staerke: 3.0 } },
    haupt: { art: 'kamera', wort: 'home' },
    hauptsache: 'pk2.sitz',
  },
  // "The boards above me groaned." – die Dielen biegen sich tief durch, Staub fällt in sein Gesicht
  '24': {
    figuren: ELI_K('angst', 34),
    kamera: { ziel: { anker: 'eli.kopf', versatz: [0.15, 0.35, 0] }, blick: { azimut: 176, hoehe: 30, abstand: 1.15 }, fov: 58, roll: ROLL_LIEGEN, rate: 0.07, zusaetze: [{ baustein: 'shake', wort: 'groaned', staerke: 0.9, dauer: 0.3 }] },
    licht_anpassung: { hemi: { staerke: 1.0 }, belichtung: 1.45 },
    set_ereignisse: [{ set: 'keller', was: 'fuesse', versatz: 0, dauer: 0.01, mitte: [-0.45, -0.45], drehung: 0 }],
    haupt: { art: 'set', set: 'keller', was: 'biegen', wort: 'groaned', dauer: 0.4, params: { tiefe: 0.1, mitte: [-0.45, -0.1], radius: 0.75 } },
    partikel: [{ art: 'staub', ort: kw(-0.5, 0.85, -0.25), wort: 'groaned', farbe: '#e8dcc8', anzahl: 170, groesse: 0.0045, bereich: [0.35, 0.3, 0.3], deckkraft: 0.75, dauer: 1.4 }],
    hauptsache: 'eli.kopf',
  },
  // "A long white finger slid through the crack" – der Finger schiebt sich durch die Fuge, die Kamera folgt
  '25': {
    figuren: MH_OBEN,
    kamera: { baustein: 'crane_down_tilt', ziel: kw(-0.95, 0.45, -0.5), blick: { azimut: 40, hoehe: 8, abstand: 1.3 }, hoehe: 0.3, rueck: 0.1, ankunft_wort: 'crack', fov: 54 },
    haupt: { art: 'set', set: 'keller', was: 'finger_durch', wort: 'finger', dauer: 1.0, params: { stelle: [-1.25, -0.505], drehung: -90 } },
    hauptsache: kw(-1.0, 0.45, -0.5),
  },
  // "and felt along the dirt, inches" – Eli von vorn, seine Augen folgen dem Schaben am Boden
  '25:and felt': {
    figuren: ELI_K('angst', 30),
    kamera: ELI_NAH(0.95, 192, 22, 0.08),
    haupt: { wer: 'eli', was: 'kopf_drehen', wort: 'dirt', dauer: 0.35, params: { winkel: -10, nicken: 8 } },
    set_ereignisse: [{ set: 'keller', was: 'finger_tasten', wort: 'felt', dauer: 1.4, weite: 0.16 }],
    hauptsache: 'eli.kopf',
  },
  // "from my face. Then it pulled back." – Snap-Zoom: die Fingerspitze neben Elis Wange; sie zieht sich zurück
  '25:from': {
    figuren: { ...ELI_K('angst', 30), ...MH_OBEN },
    kamera: { baustein: 'snap_zoom', ziel: kw(-0.68, 0.3, -0.45), pos: kw(-0.45, 0.62, 0.35), fov: 52, zeit_wort: 'face', faktor: 1.18, bilder: 2, roll: 0 },
    // Prüfung: im Mittel 17,6 von 255 (dunkle Orte ≥ 22) – mehr Füll-Licht und Belichtung
    licht_anpassung: { hemi: { staerke: 1.4 }, belichtung: 1.9 },
    set_ereignisse: [
      { set: 'keller', was: 'finger_zurueck', wort: 'pulled', dauer: 0.45 },
      { set: 'keller', was: 'biegen', wort: 'pulled', dauer: 0.4, tiefe: 0, mitte: [-0.45, -0.1], radius: 0.75 },
      { set: 'keller', was: 'fuesse', wort: 'pulled', dauer: 0.01, aus: true },
    ],
    haupt: { art: 'kamera', wort: 'face' },
    hauptsache: kw(-0.68, 0.3, -0.45),
  },
  // "Nothing, until three in the" – Elis Armbanduhr im Lichtstreifen springt auf 3:00
  '27': {
    figuren: { uhr: { position: kw(1.05, 0.06, 0.05), blick: 20, gesicht: '2_59' } },
    kamera: { ziel: { anker: 'uhr.mitte' }, blick: { azimut: 20, hoehe: 58, abstand: 0.42 }, fov: 40, rate: 0.07 },
    haupt: { art: 'gesicht', wer: 'uhr', name: '3_00', wort: 'three' },
    hauptsache: 'uhr.mitte',
  },
  // "morning. [Klopfer] Rabbit?" – die Kamera fährt von der Luke zurück: drei Klopfer, Staub aus dem Spalt
  '27:morning': {
    figuren: { luke_k: { position: ORT.kellerLuke, blick: 0 } },
    kamera: { baustein: 'dolly_out', pos: kw(0.3, 0.4, -0.85), ziel: kw(0.45, 1.0, -0.05), fov: 54, rate: -0.07 },
    partikel: [
      { art: 'staub', ort: kw(0.45, 0.95, -0.4), wort: 'morning', vorlauf: -0.52, farbe: '#e8dcc8', anzahl: 70, groesse: 0.004, bereich: [0.5, 0.2, 0.05], deckkraft: 0.75, dauer: 1.2 },
      { art: 'staub', ort: kw(0.1, 0.95, 0.0), wort: 'morning', vorlauf: -0.97, farbe: '#e8dcc8', anzahl: 70, groesse: 0.004, bereich: [0.05, 0.2, 0.5], deckkraft: 0.75, dauer: 1.2 },
    ],
    haupt: { art: 'partikel', partikel_art: 'staub', wort: 'Rabbit', vorlauf: 0.32, ort: kw(0.8, 0.95, 0.38), farbe: '#e8dcc8', anzahl: 70, groesse: 0.004, bereich: [0.4, 0.2, 0.05], deckkraft: 0.75, dauer: 1.2 },
    hauptsache: 'keller.luke',
  },
  // "You can come out now." – der Lichtspalt am Lukenrand, oben bewegt sich ein Schatten
  '29': {
    figuren: { luke_k: { position: ORT.kellerLuke, blick: 0 } },
    kamera: { pos: kw(0.35, 0.55, -0.7), ziel: kw(0.5, 1.0, -0.42), fov: 46, rate: 0.09 },
    haupt: { art: 'kamera', wort: 'come' },
    hauptsache: kw(0.5, 1.0, -0.42),
  },
  // "It's gone." – Eli von vorn, die Hand noch auf dem Mund, er rührt sich nicht
  '30': {
    figuren: ELI_K('angst', 36),
    kamera: ELI_NAH(0.9, 190, 22, 0.07),
    neben: [{ wer: 'eli', was: 'mund_zuhalten', ab: 'start', dauer: 0.01, params: { seite: 'r' } }],
    haupt: { art: 'gesicht', wer: 'eli', name: 'schock', wort: 'gone' },
    gesichter: [{ wer: 'eli', name: 'angst', wort: 'gone', versatz: 0.25 }],
    hauptsache: 'eli.kopf',
  },

  // ───────── Der Lockruf ─────────
  // "It was June's voice," – Eli von vorn, die Augen weit
  '31': {
    figuren: ELI_K('angst', 36),
    kamera: ELI_NAH(0.8, 194, 24, 0.08, 42),
    haupt: { art: 'gesicht', wer: 'eli', name: 'besorgt', wort: 'voice' },
    hauptsache: 'eli.kopf',
  },
  // "three hours before sunrise." – Elis Blick hinaus: der Himmel ist noch schwarz, die Turmuhr zeigt drei
  '31:three': {
    // Bildidee: Blick durchs Gitter; gebaut als Blick vom Fuß des Marsh-Hauses (Straßen-Set, Nacht)
    set: ['strasse', 'marsh'],
    licht: 'nacht',
    uhr: '3:00',
    kamera: { pos: [-9.6, 0.45, 4.2], ziel: [0, 10.4, TZ + 2.3], fov: 18, rate: 0.07 },
    licht_anpassung: { ...NACHT_HELL, belichtung: 1.5 },
    lampen_einzeln: TURM_AUS,
    haupt: { art: 'kamera', wort: 'sunrise' },
    hauptsache: 'strasse.kirche_uhr',
  },
  // "I didn't answer." – Eli presst die Lippen zusammen
  '32': {
    figuren: ELI_K('angst', 36),
    kamera: ELI_NAH(0.85, 188, 22, 0.07),
    haupt: { art: 'gesicht', wer: 'eli', name: 'entschlossen', wort: 'answer' },
    hauptsache: 'eli.kopf',
  },
  // "Then the voice started counting, like every night." – Untersicht: eine Fuge nach der anderen wird
  // dunkel, etwas legt sich der Länge nach auf die Dielen, wie June jeden Abend
  '33': {
    kamera: { baustein: 'truck_side', pos: kw(-0.5, 0.28, 0.1), ziel: kw(-0.5, 1.0, 0.25), fov: 62, richtung: 'rechts', strecke: 0.7, vordergrund: false },
    licht_anpassung: { belichtung: 0.6 },
    haupt: { art: 'set', set: 'keller', was: 'liegen', wort: 'counting', dauer: 1.6, params: { mitte: [-0.7, 0.15], laenge: 2.6, breite: 0.62, drehung: 0 } },
    hauptsache: kw(-0.6, 1.0, 0.2),
  },
  // "Ninety-nine." "One hundred." – die Fugen bleiben dunkel; auf „One hundred“ wird auch der letzte Streifen dunkel
  '34': {
    kamera: { punkt: 'keller.pov', rate: 0.05 },
    licht_anpassung: { belichtung: 0.6 },
    set_ereignisse: [{ set: 'keller', was: 'liegen', versatz: 0, dauer: 0.01, mitte: [-0.7, 0.15], laenge: 2.6, breite: 0.62, drehung: 0 }],
    haupt: { art: 'set', set: 'keller', was: 'liegen', wort: 'Ninety-nine', versatz: 0.9, dauer: 0.25, params: { mitte: [-0.6, 0.2], laenge: 2.6, breite: 0.95, drehung: 0 } },
    hauptsache: 'keller.dielen_mitte',
  },
  // "Ready, Rabbit?" – die vier Fingerschatten legen sich wieder quer über die Fugen und spreizen sich
  '36': {
    kamera: { punkt: 'keller.pov', rate: 0.07 },
    licht_anpassung: { belichtung: 0.65 },
    set_ereignisse: [{ set: 'keller', was: 'liegen', versatz: 0, dauer: 0.01, aus: true }],
    haupt: { art: 'set', set: 'keller', was: 'finger', wort: 'Ready', versatz: -0.08, dauer: 0.28, params: { von: [-0.33, 1.3], nach: [-0.33, 1.05], drehung: -90, skala: 1.25, spreizen: 14, spreiz_dauer: 0.2 } },
    hauptsache: 'keller.dielen_mitte',
  },

  // ───────── Wendung ─────────
  // "I didn't answer." – Eli kneift die Augen zu
  '37': {
    figuren: ELI_K('angst', 36),
    kamera: ELI_NAH(0.8, 192, 24, 0.08),
    haupt: { art: 'gesicht', wer: 'eli', name: 'augen_zu', wort: 'answer' },
    hauptsache: 'eli.kopf',
  },
  // "The hatch opened anyway." – die Luke klappt auf, kaltes blaues Licht fällt schräg herein (Lichtereignis 2 von 3)
  '38': {
    figuren: { luke_k: { position: ORT.kellerLuke, blick: 0 } },
    kamera: { baustein: 'statisch', pos: kw(2.5, 0.55, 1.6), ziel: kw(0.2, 0.5, -0.3), fov: 58 },
    haupt: { wer: 'luke_k', was: 'oeffnen', wort: 'opened', dauer: 0.45, params: { winkel: 105 } },
    licht_ereignisse: [{ licht_art: 'an', ziel: 'keller.lukenlicht', wort: 'opened', dauer: 0.3 }],
    set_ereignisse: [
      { set: 'keller', was: 'liegen', wort: 'opened', dauer: 0.01, aus: true },
      { set: 'keller', was: 'finger', wort: 'opened', dauer: 0.01, aus: true },
    ],
    partikel: [{ art: 'staub', ort: kw(0.45, 0.85, 0.0), wort: 'opened', farbe: '#dfe8f4', anzahl: 200, groesse: 0.005, bereich: [0.5, 0.35, 0.5], deckkraft: 0.75, dauer: 1.6 }],
    hauptsache: 'luke_k.mitte',
  },
  // "Mister Hundred folded itself" – Baustein P2: kopfüber faltet es sich durch die Luke herein
  '39': {
    figuren: { luke_k: { position: ORT.kellerLuke, blick: 0, pose: 'oeffnen' }, mh: { position: [ORT.monsterKopfueber[0], ORT.monsterKopfueber[1] + 1.1, 0], blick: 90, pose: 'kopfueber', pose_params: { neigung: 180, nicken: 0 }, gesicht: 'glatt' } },
    kamera: { baustein: 'tilt_up', von_ziel: kw(0.2, 0.25, -0.3), ziel: kw(0.3, 0.75, 0.0), pos: kw(2.2, 0.35, 1.3), ankunft_wort: 'itself', kran: 0.15, fov: 58 },
    haupt: { wer: 'mh', was: 'kopfueber', wort: 'folded', dauer: 1.05, ease: 'ease_out', params: { neigung: 180, nicken: 0, senken: 1.1 } },
    hauptsache: 'mh.haende',
  },
  // "into the crawl space," – Eli von vorn, kaltes Licht auf dem Gesicht, sein Atem wird weiß
  '39:into': {
    figuren: ELI_K('augen_zu', 32),
    kamera: ELI_NAH(0.9, 196, 24, 0.07),
    haupt: { art: 'partikel', partikel_art: 'atem', wort: 'crawl', ort: 'eli.mund', periode: 1.1, richtung: [0, 1, 0.15], groesse: 0.09, deckkraft: 0.85, dauer: 1.1 },
    hauptsache: 'eli.kopf',
  },
  // "bent down, and" – Untersicht von Elis Platz: die Raute senkt sich über ihn, die Spitzen glimmen
  '39:bent': {
    figuren: { mh: { position: [ORT.monsterKopfueber[0], ORT.monsterKopfueber[1] + 0.25, 0], blick: 90, pose: 'kopfueber', pose_params: { neigung: 180, nicken: 0 }, gesicht: 'glatt' } },
    kamera: { pos: kw(-0.5, 0.3, -0.3), ziel: { anker: 'mh.haende' }, fov: 64, roll: 180, rate: 0.07 },
    haupt: { wer: 'mh', was: 'kopfueber', wort: 'bent', dauer: 0.7, params: { neigung: 180, nicken: 0, senken: 0.25 } },
    hauptsache: 'mh.haende',
  },
  // "took its hands away from its face." – die Hände öffnen sich langsam zur Seite wie eine Tür
  '39:took': {
    figuren: MH_KOPF('glatt'),
    kamera: MH_GROSS(1.3, -8, 54, 0.06),
    licht_anpassung: MH_LICHT,
    haupt: { wer: 'mh', was: 'haende_weg', wort: 'hands', dauer: 1.1 },
    hauptsache: 'mh.kopf',
  },
  // "It had June's face, far too big." – Großaufnahme: Junes Gesicht auf dem Würfelkopf, zu groß gedehnt
  '40': {
    figuren: MH_KOPF('june_gedehnt'),
    kamera: MH_GROSS(1.2, -8, 52, 0.08),
    licht_anpassung: MH_LICHT,
    neben: [HAENDE_WEG],
    haupt: { art: 'kamera', wort: 'face' },
    hauptsache: 'mh.kopf',
  },
  // "The eye I saw between its fingers was hers." – Detail: das bernsteinfarbene Auge in Junes Gesicht
  '41': {
    figuren: MH_KOPF('june_gedehnt'),
    kamera: { ziel: { anker: 'mh.augen', versatz: [0, -0.04, 0.12] }, blick: { azimut: -90, hoehe: -4, abstand: 0.55 }, fov: 40, roll: 180, rate: 0.07 },
    licht_anpassung: MH_LICHT,
    neben: [HAENDE_WEG],
    haupt: { art: 'kamera', wort: 'eye' },
    hauptsache: 'mh.augen',
  },

  // ───────── Junes Geständnis ─────────
  // "It found me six years ago, Rabbit." – entsättigt: June mit 18 liegt im selben Keller
  '42': {
    licht: 'kriechkeller',
    figuren: { june18: { position: ORT.kellerEli, blick: 90, pose: 'liegen', pose_params: { kopf: 34 }, gesicht: 'besorgt' } },
    kamera: { baustein: 'crane_down_tilt', ziel: { anker: 'june18.augen', versatz: [0, 0.02, 0] }, blick: { azimut: 192, hoehe: 26, abstand: 1.0 }, hoehe: 0.25, rueck: 0.15, ankunft_wort: 'years', fov: 46, roll: ROLL_LIEGEN },
    lampen_einzeln: { 'keller.lukenlicht': false },
    haupt: { art: 'kamera', wort: 'years' },
    hauptsache: 'june18.kopf',
  },
  // "Dad hid me down here, so it took him," – entsättigt: Dad schließt die Luke über June; seine Lampe fällt
  '43': {
    licht: 'innen-nacht',
    figuren: {
      dad: { position: [-19.55, SO, 1.45], blick: 40, gesicht: 'entschlossen', pose: 'ducken', pose_params: { tiefe: 0.5, arme: 'knie' } },
      luke_tp: { position: ORT.luke, blick: 90, pose: 'offen' },
      lampe_dad: { position: [-18.15, SO, 1.3], blick: -60 },
    },
    kamera: { ziel: [-19.1, 1.2, 1.75], pos: [-17.4, 1.75, 0.35], fov: 54, rate: 0.07 },
    licht_anpassung: { belichtung: 1.35, grade: { saettigung: 0.62, kontrast: 1.04 } },
    neben: [
      { wer: 'dad', was: 'greifen', ab: 'start', dauer: 0.25, params: { zu: 'luke_tp.ring', seite: 'r', lehnen: false } },
      { wer: 'lampe_dad', was: 'kippen', wort: 'took', params: { winkel: 120, rollen: 50 } },
    ],
    haupt: { wer: 'luke_tp', was: 'schliessen', wort: 'Dad', dauer: 0.6 },
    hauptsache: 'dad.kopf',
  },
  // "and kept me." – bei Sonnenaufgang steigt June barfuß aus der Luke; unter ihr glimmen die weißen Hände
  '43:and kept': {
    figuren: {
      june18: { position: [-18.8, SO - 0.75, 2.0], blick: 90, gesicht: 'leerer_blick' },
      luke_tp: { position: ORT.luke, blick: 90, pose: 'offen' },
      mh: { position: [-18.6, -6.05, 2.25], blick: 90, gesicht: 'glatt' },
    },
    kamera: { baustein: 'statisch', rate: 0.04, ziel: [-18.8, 1.45, 2.0], pos: [-16.9, 1.95, 2.7], fov: 54 },
    licht_anpassung: { belichtung: 1.3 },
    haupt: { wer: 'june18', was: 'klettern', wort: 'kept', dauer: 0.5, params: { hoehe: 0.75, arme: false } },
    hauptsache: 'june18.kopf',
  },
  // "When I count, it sleeps." – June zählt im Bett; an der Wand der riesige Schatten, still zusammengerollt
  '44': {
    figuren: {
      june: { position: ORT.juneBett, blick: 90, pose: 'liegen', gesicht: 'zaehlt_a' },
      sch_rolle: { position: [-20.76, SO + 0.95, 4.2], blick: 90 },
    },
    kamera: { pos: [-17.6, 2.45, 4.0], ziel: [-20.3, 1.55, 4.2], fov: 58, rate: 0.06 },
    licht_anpassung: { belichtung: 0.85 },
    haupt: { art: 'gesicht', wer: 'june', name: 'zaehlt_c', wort: 'sleeps' },
    mund: { wer: 'june', art: 'zaehlen', takt: 0.26 },
    hauptsache: 'june.kopf',
  },
  // "I thought it would never look" – Junes gedehntes Gesicht: das Lächeln bricht, die Brauen sinken
  '45': {
    figuren: MH_KOPF('june_gedehnt'),
    lampen_einzeln: { 'keller.lukenlicht': true },
    kamera: MH_GROSS(1.2, -8, 50, 0.07),
    licht_anpassung: MH_LICHT,
    neben: [HAENDE_WEG],
    haupt: { art: 'gesicht', wer: 'mh', name: 'june_bricht', wort: 'never' },
    hauptsache: 'mh.kopf',
  },
  // "under its own bed." – Kran auf Junes Bett, davor die Luke, der Teppich halb zurückgerollt
  '45:under': {
    figuren: { luke_tp: { position: ORT.luke, blick: 90, pose: 'teppich_rollen' } },
    kamera: { baustein: 'crane_down_tilt', ziel: [-19.2, 0.75, 2.7], blick: { azimut: 60, hoehe: 52, abstand: 3.0 }, hoehe: 0.8, rueck: 0.3, ankunft_wort: 'bed', fov: 56 },
    licht_anpassung: { belichtung: 0.95 },
    haupt: { art: 'kamera', wort: 'bed' },
    hauptsache: [-19.2, 0.8, 3.0],
  },

  // ───────── Höhepunkt: das Ritual ─────────
  // "Then the huge hands shook," – die riesigen Hände zittern über Eli
  '46': {
    figuren: MH_KOPF('june_bricht'),
    kamera: { pos: kw(-0.6, 0.32, -0.32), ziel: { anker: 'mh.haende' }, fov: 66, roll: 180, rate: 0.07 },
    neben: [HAENDE_WEG, { wer: 'mh', was: 'haende_vor', wort: 'shook', versatz: 0.5, dauer: 0.7 }],
    haupt: { wer: 'mh', was: 'zittern', wort: 'shook', dauer: 1.0, params: { staerke: 1.2 } },
    hauptsache: 'mh.haende',
  },
  // "and June pulled them back over her own face." – Eli: der Schatten der Hände legt sich über sein Gesicht
  '46:and June': {
    figuren: ELI_K('angst', 34),
    kamera: ELI_NAH(0.95, 192, 26, 0.07),
    haupt: { art: 'gesicht', wer: 'eli', name: 'schock', wort: 'pulled' },
    gesichter: [{ wer: 'eli', name: 'angst', wort: 'own' }],
    hauptsache: 'eli.kopf',
  },
  // "Close your eyes, Rabbit." "Count with me." – Eli schließt langsam die Augen
  '47': {
    figuren: ELI_K('angst', 36),
    kamera: ELI_NAH(0.85, 190, 24, 0.05),
    haupt: { art: 'gesicht', wer: 'eli', name: 'augen_zu', wort: 'eyes' },
    hauptsache: 'eli.kopf',
  },
  // "She counted out loud," – Untersicht: die geschlossene Raute hebt und senkt sich wie Atem
  '49': {
    figuren: MH_KOPF('glatt'),
    kamera: MH_GROSS(1.6, -18, 54, 0.06),
    licht_anpassung: MH_LICHT,
    haupt: { wer: 'mh', was: 'zaehlen', wort: 'counted', dauer: 1.1, params: { takt: 0.55, staerke: 0.8 } },
    hauptsache: 'mh.haende',
  },
  // "and it counted with her, slow and deep." – Seitenfahrt über Eli, die Lichtstreifen pulsieren je Zahl
  '49:and it': {
    figuren: ELI_K('augen_zu', 34),
    kamera: { baustein: 'truck_side', ziel: { anker: 'eli.augen', versatz: [0, 0.02, 0] }, blick: { azimut: 192, hoehe: 24, abstand: 1.15 }, fov: 50, roll: ROLL_LIEGEN, richtung: 'rechts', strecke: 0.35, vordergrund: false },
    set_ereignisse: [{ set: 'keller', was: 'puls', versatz: 0, dauer: 2.3, takt: 0.7, staerke: 1 }],
    mund: { wer: 'eli', art: 'zaehlen', takt: 0.35 },
    haupt: { art: 'kamera', wort: 'deep' },
    hauptsache: 'eli.kopf',
  },
  // "I counted without a sound." – Eli, Augen zu, seine Lippen bewegen sich ohne Ton
  '50': {
    figuren: ELI_K('augen_zu', 36),
    kamera: ELI_NAH(0.85, 194, 24, 0.06),
    set_ereignisse: [{ set: 'keller', was: 'puls', versatz: 0, dauer: 1.6, takt: 0.7, staerke: 0.8 }],
    mund: { wer: 'eli', art: 'zaehlen', takt: 0.3, bis: 'sound' },
    haupt: { art: 'gesicht', wer: 'eli', name: 'augen_zu', wort: 'sound' },
    hauptsache: 'eli.kopf',
  },
  // "Every time they reached one hundred," – bei „one hundred“ öffnet sich ein Spalt (0,3 s), kein Auge
  '51': {
    figuren: MH_KOPF('glatt'),
    kamera: MH_GROSS(1.6, -18, 54, 0.06),
    licht_anpassung: MH_LICHT,
    haupt: { wer: 'mh', was: 'finger_spreizen', wort: 'hundred', dauer: 0.15, params: { seite: 'r', staerke: 1 } },
    neben: [{ wer: 'mh', was: 'finger_schliessen', wort: 'hundred', versatz: 0.3, dauer: 0.25, params: { staerke: 0.4 } }],
    hauptsache: 'mh.haende',
  },
  // "she started over, before it could ask." – vom Gitter zurück: draußen wird es dunkelblau, die Streifen pulsieren
  '51:she started': {
    figuren: ELI_K('augen_zu', 36),
    kamera: { baustein: 'dolly_out', ziel: 'keller.gitter', pos: kw(-1.1, 0.5, 0.7), fov: 54, rate: -0.07 },
    set_ereignisse: [{ set: 'keller', was: 'puls', versatz: 0, dauer: 2.2, takt: 0.7, staerke: 0.9 }],
    haupt: { art: 'kamera', wort: 'over' },
    hauptsache: 'keller.gitter',
  },
  // "Near dawn, her voice grew faint," – die Hände sinken ein Stück, das Glimmen wird schwächer
  '52': {
    figuren: MH_KOPF('glatt'),
    kamera: MH_GROSS(1.5, -16, 54, 0.05),
    licht_anpassung: MH_LICHT,
    haupt: { wer: 'mh', was: 'haende_weg', wort: 'faint', dauer: 0.8, params: { staerke: 0.22 } },
    hauptsache: 'mh.kopf',
  },
  // "like she was falling asleep." – June im Bett schläft ein, die Nachttischlampe geht aus (Lichtereignis 3 von 3)
  '52:like': {
    figuren: { june: { position: ORT.juneBett, blick: 90, pose: 'liegen', gesicht: 'verschlafen' } },
    kamera: { ziel: { anker: 'june.kopf', versatz: [0, 0.04, 0] }, blick: { azimut: 92, hoehe: 52, abstand: 1.5 }, fov: 40, rate: 0.06 },
    licht_anpassung: { belichtung: 0.85 },
    haupt: { art: 'licht', licht_art: 'aus', ziel: 'haus.june_lampe', wort: 'asleep', vorlauf: 0.1, dauer: 0.4 },
    mund: { wer: 'june', art: 'zaehlen', takt: 0.32, bis: 'asleep' },
    gesichter: [{ wer: 'june', name: 'augen_zu', wort: 'asleep' }],
    hauptsache: 'june.kopf',
  },
  // "At ninety-nine, she stopped." – Eli, Augen zu; auf „stopped“ Stille, nur sein Atem
  '53': {
    figuren: ELI_K('augen_zu', 36),
    kamera: { ...ELI_NAH(0.8, 190, 24, 0), baustein: 'statisch' },
    mund: { wer: 'eli', art: 'zaehlen', takt: 0.3, bis: 'stopped' },
    haupt: { art: 'partikel', partikel_art: 'atem', wort: 'stopped', ort: 'eli.mund', periode: 1.2, richtung: [0, 1, 0.15], groesse: 0.08, deckkraft: 0.8, dauer: 1.2 },
    hauptsache: 'eli.kopf',
  },
  // "Instead of one hundred," – außen: die Kamera steigt am Turm hinauf im rosa Morgenlicht
  '54': {
    uhr: '6:10',
    figuren: { sp_tess: { position: [-0.25, ORT.turmBoden, TZ + 2.05], blick: 0 } },
    kamera: { baustein: 'tilt_up', von_ziel: 'strasse.kirche_tuer', ziel: 'strasse.glocke', pos: [3.6, 1.6, -45.5], ankunft_wort: 'hundred', kran: 1.4, fov: 56 },
    licht_anpassung: { belichtung: 1.2 },
    haupt: { art: 'kamera', wort: 'hundred' },
    hauptsache: 'strasse.glocke',
  },
  // "the sunrise bell rang." – die Schallluke: Mr. Odell zieht am Seil, die Glocke schwingt; auf dem Sims
  // stehen Tess' lila High-Tops nebeneinander
  '54:the': {
    uhr: '6:10',
    figuren: {
      odell: { position: [-0.55, ORT.turmBoden, TZ + 0.75], blick: 120, gesicht: 'muede' },
      sp_tess: { position: [-0.25, ORT.turmBoden, TZ + 2.05], blick: 0 },
    },
    kamera: { pos: [0.9, 13.4, TZ + 6.2], ziel: [0.0, 13.35, TZ + 1.2], fov: 36, rate: 0.07 },
    licht_anpassung: { belichtung: 1.25, hemi: { staerke: 2.4 } },
    neben: [{ wer: 'odell', was: 'arm_heben', ab: 'start', dauer: 0.3, params: { seite: 'r', zu: [0.62, 13.0, TZ + 0.35] } }],
    set_ereignisse: [{ set: 'strasse', was: 'glocke', wort: 'rang' }],
    haupt: { art: 'set', set: 'strasse', was: 'glocke', wort: 'bell' },
    hauptsache: [0, 13.3, TZ + 1.5],
  },

  // ───────── Schluss ─────────
  // "When I opened my eyes," – Eli öffnet die Augen, rosa Licht durchs Gitter
  '55': {
    figuren: { ...ELI_K('augen_zu', 34), luke_k: { position: ORT.kellerLuke, blick: 0, pose: 'oeffnen' } },
    kamera: ELI_NAH(0.9, 200, 22, 0.07),
    lampen_einzeln: { 'keller.lampe': false, 'keller.lukenlicht': false, 'keller.gitter': false, 'keller.gitter_morgen': true },
    haupt: { art: 'gesicht', wer: 'eli', name: 'besorgt', wort: 'opened' },
    hauptsache: 'eli.kopf',
  },
  // "Hiding Night was over," – Rückfahrt: der Keller in rosa Licht, niemand mehr da, nur die offene Luke
  '55:Hiding': {
    figuren: { ...ELI_K('besorgt', 34), luke_k: { position: ORT.kellerLuke, blick: 0, pose: 'oeffnen' } },
    kamera: { baustein: 'dolly_out', ziel: { anker: 'eli.augen', versatz: [0.3, 0.05, 0] }, blick: { azimut: 192, hoehe: 16, abstand: 1.3 }, fov: 60, roll: ROLL_LIEGEN, rate: -0.08 },
    haupt: { art: 'kamera', wort: 'over' },
    hauptsache: 'eli.kopf',
  },
  // "and I was alone." – neben ihm im Staub: Dads alte Taschenlampe
  '55:and I': {
    figuren: { lampe_alt: { position: kw(-0.9, 0.0, -1.05), blick: 70 } },
    kamera: { ziel: { anker: 'lampe_alt.mitte' }, blick: { azimut: 160, hoehe: 30, abstand: 0.75 }, fov: 40, rate: 0.07 },
    haupt: { art: 'kamera', wort: 'alone' },
    hauptsache: 'lampe_alt.mitte',
  },
  // "I climbed out." – Eli steigt aus der Luke, dieselbe Kadrierung wie June in Satz 43
  '56': {
    figuren: { eli: { position: [-18.8, SO - 0.75, 2.0], blick: 90, gesicht: 'neutral' }, luke_tp: { position: ORT.luke, blick: 90, pose: 'offen' } },
    kamera: { baustein: 'statisch', rate: 0.04, ziel: [-18.8, 1.45, 2.0], pos: [-16.9, 1.95, 2.7], fov: 54 },
    licht_anpassung: MORGEN_INNEN,
    haupt: { wer: 'eli', was: 'klettern', wort: 'climbed', dauer: 0.6, params: { hoehe: 0.75, arme: false } },
    hauptsache: 'eli.kopf',
  },
  // "June's red sneakers still stood by her bed," – Seitenfahrt durch Junes Zimmer im Morgenlicht
  '57': {
    figuren: { sp_june: { position: [-19.15, SO, 3.25], blick: 180 }, luke_tp: { position: ORT.luke, blick: 90, pose: 'offen' } },
    kamera: { baustein: 'truck_side', pos: [-17.6, 1.35, 1.6], ziel: [-19.3, 0.7, 3.6], fov: 54, richtung: 'rechts', strecke: 0.9, vordergrund: false },
    licht_anpassung: MORGEN_INNEN,
    haupt: { art: 'kamera', wort: 'sneakers' },
    hauptsache: 'sp_june.mitte',
  },
  // "side by side." – Snap-Zoom: die roten Turnschuhe im Sonnenstreifen
  '57:side': {
    figuren: { sp_june: { position: [-19.15, SO, 3.25], blick: 180 } },
    kamera: { baustein: 'snap_zoom', ziel: 'sp_june.mitte', blick: { azimut: 140, hoehe: 28, abstand: 0.85 }, fov: 40, zeit_wort: 'side', faktor: 1.18, bilder: 2 },
    licht_anpassung: MORGEN_INNEN,
    haupt: { art: 'kamera', wort: 'side' },
    hauptsache: 'sp_june.mitte',
  },
  // "In the hall, my" – der Flur im Morgenlicht, der Schuhhaufen kreuz und quer
  '58': {
    figuren: {
      sp_f1: { position: [-13.6, SO, -1.7], blick: 70 }, sp_f2: { position: [-14.1, SO, -2.2], blick: 150 },
      sp_eli: { position: [-13.35, SO, -2.4], blick: 100 },
    },
    kamera: { pos: [-15.9, 1.55, -0.6], ziel: [-13.7, 0.5, -2.0], fov: 50, rate: 0.07 },
    licht_anpassung: MORGEN_INNEN,
    haupt: { art: 'kamera', wort: 'hall' },
    hauptsache: [-13.7, 0.7, -2.0],
  },
  // "sneakers still stood side by side." – nur Elis weiße Turnschuhe mit grünen Senkeln stehen gerade nebeneinander
  '58:sneakers': {
    figuren: { sp_eli: { position: [-13.35, SO, -2.4], blick: 100 }, sp_f1: { position: [-13.6, SO, -1.7], blick: 70 } },
    kamera: { ziel: 'sp_eli.mitte', blick: { azimut: 60, hoehe: 36, abstand: 1.1 }, fov: 42, rate: 0.07 },
    licht_anpassung: MORGEN_INNEN,
    haupt: { art: 'kamera', wort: 'side' },
    hauptsache: 'sp_eli.mitte',
  },
  // "Every night since, I count to one" – Nacht, Elis Zimmer: die Kamera senkt sich auf Eli, der im Bett zählt
  '59': {
    figuren: { eli: { position: ORT.eliBett, blick: 180, pose: 'liegen', gesicht: 'augen_zu' } },
    kamera: { baustein: 'crane_down_tilt', ziel: { anker: 'eli.kopf', versatz: [0, 0.05, 0] }, blick: { azimut: 180, hoehe: 52, abstand: 1.9 }, hoehe: 0.8, rueck: 0.4, ankunft_wort: 'count', fov: 50 },
    licht_anpassung: { belichtung: 0.85 },
    mund: { wer: 'eli', art: 'zaehlen', takt: 0.26 },
    haupt: { art: 'kamera', wort: 'count' },
    hauptsache: 'eli.kopf',
  },
  // "hundred before I fall asleep. It helps." – Eli nah, die Lippen zählen; auf „helps“ steigt weißer Atem auf
  '59:hundred': {
    figuren: { eli: { position: ORT.eliBett, blick: 180, pose: 'liegen', gesicht: 'augen_zu' } },
    kamera: { ziel: { anker: 'eli.kopf', versatz: [0, 0.05, 0] }, blick: { azimut: 180, hoehe: 60, abstand: 1.15 }, fov: 40, rate: 0.06 },
    licht_anpassung: { belichtung: 0.85 },
    mund: { wer: 'eli', art: 'zaehlen', takt: 0.28, bis: 'It' },
    haupt: { art: 'gesicht', wer: 'eli', name: 'augen_zu', wort: 'asleep' },
    partikel: [{ art: 'atem', ort: { anker: 'eli.mund', versatz: [0, 0.03, 0.08] }, wort: 'helps', periode: 1.0, richtung: [0, 1, 0], groesse: 0.03, deckkraft: 0.85 }],
    hauptsache: 'eli.kopf',
  },
};
