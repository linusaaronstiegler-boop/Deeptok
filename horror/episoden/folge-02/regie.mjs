// Regie für „Hiding Night“, Teil 2: WIE jede Einstellung gezeigt wird.
// WAS sie zeigt und WO geschnitten wird, steht in bildideen.json (Satz + Teilbilder "ab_wort").
// Der Compiler engine/shotliste.mjs setzt beides mit den Wortzeiten aus timing.json zusammen.
// Aufbau und Felder wie in ../folge-01/regie.mjs (dort ausführlich erklärt). Neu in Teil 2:
//   set_ereignisse  Ereignisse eines Sets auf einem Wort (Glocke schwingt, Dielen biegen, Fingerschatten)
//   haupt { art: 'set', set, was, wort }   ein Set-Ereignis als Hauptaktion (kriechkeller: biegen, finger)
//
// Lehren aus dem Review von Teil 1 (folge-01/REVIEW.md), hier eingehalten:
//   - hell genug: Nacht und Kriechkeller mit Füll-Licht, Bild-Median ≥ 85, keine Einstellung unter 35
//   - keine Wisch-Objekte vor der Linse: alle Seitenfahrten mit vordergrund: false
//   - Gesichter an Schlüsselstellen von vorn (Eli am Vorhang, Junes Sätze, Eli steigt in die Luke)
//   - Monster mit Kantenlicht (im Modul), Leitmotiv-Requisiten (Schuhe, Luke, Fußspuren) groß und lesbar
//
// Koordinaten: 1 m, y oben. Straße entlang z (Platz im Norden bei z < −42, Nebel im Süden bei z > 44),
// Hausfronten bei x = ±12. Das Marsh-Haus steht bei x −12 … −21, z −5 … +5 (Front zur Straße, +x).
// Figuren schauen bei blick 0 nach +z; Kamera-blick: azimut 0 = Kamera auf der +z-Seite des Ziels.

const SO = 0.6, OG = 3.8; // Erdgeschossboden und Boden des Obergeschosses im Marsh-Haus
const KX = 300;           // der Kriechkeller steht als eigenes Set bei x = 300 (lokal + [300, 0, 0])
const kw = (x, y, z) => [KX + x, y, z];

const ORT = {
  monsterGarten: [-8.0, 0, 2.6],        // dort stand Mister Hundred am Ende von Teil 1 (vor Elis Fenster)
  eliFenster: [-12.75, OG, 2.6],        // Eli innen am Fenster (blick 90 = schaut hinaus)
  vorhang: [-12.28, 6.43, 2.6],         // Requisite vorhang an Elis Fenster (marsh_innen Anker vorhang_stange)
  juneTuer: [-17.125, SO, 0],           // Requisite tuer: Junes Tür (marsh_innen Anker june_tuer_angel)
  luke: [-19.25, SO, 2.0],              // Requisite luke in Junes Zimmer (blick 90)
  lukeMitte: [-18.8, SO, 2.0],
  juneBett: [-18.85, 1.0, 4.2],         // June liegt im Bett (pose liegen, blick 90: Kopf zum Kissen bei −x)
  monsterPlatz: [2.5, 0, -54],          // dort steht und zählt es sonst (Platzende vor der Kirche)
  odell: [1.2, 0, -57.4],               // Mr. Odell vor den Kirchenstufen
  pikeEinfahrt: [8.6, 0, -12.6],
  kellerEli: kw(1.3, 0, -0.35),         // Eli liegt im Kriechkeller (Füße hier, blick 90: Kopf bei x ≈ −0,5)
  // Mister Hundred steht oben auf den Dielen über Elis Gesicht, QUER zu den Fugen (blick 0): so schneidet jede
  // Sohle viele Lichtstreifen (Review Teil 2: längs der Fugen las sich nichts)
  kellerMonster: kw(-0.45, 1.032, -0.45),
  kellerLuke: kw(0.45, 1.016, -0.40),   // Requisite luke_k an Anker keller.luke_angel
};

export const titel = 'Hiding Night – Teil 2';
export const seed = 2612;
export const monster = ['mh'];
export const nachlauf = 0.14;

// wie Teil 1 (belichtung 1.08: Ziel Bild-Median ≥ 85 von 255, pruefen.py)
export const look = { licht: 'nacht', belichtung: 1.08, bloom: { staerke: 0.55, radius: 0.55, schwelle: 1.0 }, vignette: 0.32, korn: 0.025, toene: 'aces' };

export const sets = [
  // glocke.offen: Schallluke zur Straße offen, die Glocke ist zu sehen (Review Teil 2: man hörte sie nur)
  { id: 'strasse', modul: 'hauptstrasse', params: { uhr: { zeit: '11:00', spruenge: [] }, licht_an: 0.8, glocke: { offen: true } } },
  { id: 'marsh', modul: 'marsh_haus' },
  // Kuchen bleibt vom Geburtstag stehen (Satz 1), Luke und Junes Tür und Elis Vorhang sind Requisiten
  { id: 'haus', modul: 'marsh_innen', params: { kuchen: true, luke: 'figur', taschenlampe: true, vorhang_als_figur: true, tueren_als_figur: ['june'] } },
  { id: 'spur', modul: 'reifspur' },
  { id: 'keller', modul: 'kriechkeller', position: [KX, 0, 0] },
  { id: 'karte', modul: 'endkarte', position: [0, 0, -400], params: { zahl: '3' } },
];

// Alle Figuren (nur Erwachsene, Inhaltsregeln A7). Sichtbar nur, wo eine Einstellung sie stellt.
export const figuren = [
  { id: 'eli', modul: 'eli', gesicht: 'neutral' },
  { id: 'eli2', modul: 'eli', params: { rucksack: true }, gesicht: 'entschlossen' },   // mit Rucksack (Sätze 26, 29)
  { id: 'june', modul: 'june', params: { barfuss: true }, gesicht: 'neutral' },        // zu Hause: barfuß (Hinweis fürs Wiederansehen)
  { id: 'june2', modul: 'june', gesicht: 'besorgt' },                                  // auf dem Platz, mit Schuhen
  { id: 'tess', modul: 'tess', gesicht: 'grinsen' },
  { id: 'odell', modul: 'odell', gesicht: 'streng' },
  // Review Teil 2: Ellbogen etwas tiefer und kürzere Spitzen (in der Untersicht lasen sich Ellbogen und
  // Spitzen als „Jubeln“ mit Pfeilen), dunkler Mantel mit schmaler kalter Kante in jedem Licht,
  // Fingerspitzen gedämpft (lasen sich wie Kerzen)
  { id: 'mh', modul: 'mister_hundred', gesicht: 'glatt', blinzeln: false,
    params: { ellbogen_pol: [1, 0.05, 0.1], ellbogen_spitze: 0.5, spitzen_glut: 0.3, naegel: '#6c7075', mantel: { farbe: '#34363f', saum: '#3d3f4a', kante: 0.7, exponent: 2.8 } } },
  { id: 'nb_ohren', modul: 'nachbar', params: { variante: 'muetze', alter: 'mittel' }, gesicht: 'besorgt' },
  { id: 'nb_mantel', modul: 'nachbar', params: { variante: 'brille', alter: 'mittel', kleidung: 'mantel' }, gesicht: 'besorgt' },
  { id: 'nb_frau', modul: 'nachbar', params: { variante: 'kopftuch', alter: 'mittel' }, gesicht: 'besorgt' },
  { id: 'nb_jung', modul: 'nachbar', params: { variante: 'muetze', alter: 'jung', farbe: '#5E6B3A' }, gesicht: 'nervoes' },
  { id: 'nb_jungfrau', modul: 'nachbar', params: { variante: 'brille', alter: 'jung', farbe: '#7A3B36' }, gesicht: 'nervoes' },
  { id: 'nb_alt', modul: 'nachbar', params: { variante: 'kopftuch', alter: 'alt' }, gesicht: 'besorgt' },
  { id: 'nb_passant', modul: 'nachbar', params: { variante: 'glatze', alter: 'mittel' }, gesicht: 'ernst' },
  { id: 'nb_alt2', modul: 'nachbar', params: { variante: 'glatze', alter: 'alt', kleidung: 'mantel', farbe: '#6A5038' }, gesicht: 'besorgt' },
  // Review Teil 2: die Menge war dünn (zwei Nachbarn bei „Nobody laughed“); fünf weitere Erwachsene
  { id: 'nb_6', modul: 'nachbar', params: { variante: 'muetze', alter: 'alt', farbe: '#7A7D80', kleidung: 'mantel' }, gesicht: 'besorgt' },
  { id: 'nb_7', modul: 'nachbar', params: { variante: 'kopftuch', alter: 'jung', farbe: '#5E6B3A' }, gesicht: 'ernst' },
  { id: 'nb_8', modul: 'nachbar', params: { variante: 'brille', alter: 'alt', farbe: '#6A5038', kleidung: 'pullover' }, gesicht: 'besorgt' },
  { id: 'nb_9', modul: 'nachbar', params: { variante: 'glatze', alter: 'mittel', farbe: '#7A3B36', kleidung: 'jacke' }, gesicht: 'ernst' },
  { id: 'nb_10', modul: 'nachbar', params: { variante: 'muetze', alter: 'mittel', farbe: '#2f3e5c', kleidung: 'pullover' }, gesicht: 'besorgt' },
  // Requisiten
  { id: 'vorhang', modul: 'vorhang' },
  { id: 'tuer_june', modul: 'tuer', params: { breite: 0.95, hoehe: 2.12, farbe: '#ece6da', rahmenFarbe: '#d8d0c0', anschlag: 'links' } },
  { id: 'luke_tp', modul: 'luke', params: { teppich: true } },
  { id: 'luke_k', modul: 'luke', params: { teppich: false, groesse: [0.8, 0.8] } },
  { id: 'pk2', modul: 'pickup', params: { stiefel: true, scheinwerfer: true } },
  { id: 'sp_eli_a', modul: 'schuhpaar', params: { art: 'eli' } },
  { id: 'sp_eli_b', modul: 'schuhpaar', params: { art: 'eli', ordnung: 'schief' } },
  { id: 'sp_eli_c', modul: 'schuhpaar', params: { art: 'eli' } },                    // das Omen: nebeneinander
  { id: 'sp_v1', modul: 'schuhpaar', params: { art: 'nachbar', ordnung: 'schief' } },
  { id: 'sp_v2', modul: 'schuhpaar', params: { art: 'june', ordnung: 'getreten' } },   // Review: klar auseinander
  { id: 'sp_v3', modul: 'schuhpaar', params: { art: 'dad', ordnung: 'schief' } },
  { id: 'sp_grau', modul: 'schuhpaar', params: { art: 'grau' } },
  { id: 'sp_dad', modul: 'schuhpaar', params: { art: 'dad' } },
];

// Kalte Dämmerung wie am Ende von Teil 1 (Anschluss): dunkleres Abendrot, Gegenlicht der tiefen Sonne,
// kaltes blaues Füll- und Kantenlicht, mehr Kontrast.
const KALT = {
  himmel: { zenit: '#161b44', horizont: '#c45a52' },
  nebel: { farbe: '#5a4f7e', dichte: 0.012 },
  hemi: { himmel: '#8790dc', boden: '#2e2a44', staerke: 1.9 },
  haupt: { farbe: '#ff9466', staerke: 3.2 },
  kante: { farbe: '#7f9cff', staerke: 1.3 },
  grade: { saettigung: 1.08, kontrast: 1.14, faerbung: [0.95, 0.98, 1.1] },
  belichtung: 1.15,
};
// innen in der Dämmerung: dasselbe kalte Licht, im Haus mehr Füll-Licht (sonst unter dem Helligkeits-Tor)
const KALT_INNEN = { ...KALT, hemi: { himmel: '#9aa2e0', boden: '#4a4058', staerke: 2.6 }, belichtung: 1.45 };
const NACHT_HELL = { hemi: { staerke: 2.9 }, kante: { staerke: 1.6 }, belichtung: 1.7 };

// Eli liegt auf dem Rücken, der Kopf zeigt nach −x: ohne Rollung stünde sein Gesicht im Bild quer.
// Review Teil 2 (P0): +70° war die falsche Richtung, das Gesicht stand auf dem Kopf (Haare unten, der
// Schreckmund als Punkt auf der Stirn, die Brauen als Lächeln). Die Kompositionsprüfung misst jetzt je
// Gesicht die Neigung (Kopf-oben-Regel, ≤ 30°); die Werte unten sind dort nachgemessen.
const ROLL_LIEGEN = -90;
const MH = (position, blick, mehr = {}) => ({ mh: { position, blick, gesicht: 'glatt', ...mehr } });
const AUSSEN_DAEMMERUNG = ['strasse', 'marsh', 'spur'];
// gehen über die ganze Einstellung (Laternenzug): Ziel = Start + (dx, dz)
const geh = (wer, von, dz, dauer, dx = 0) => ({ wer, was: 'gehen', ab: 'start', dauer, ease: 'linear', params: { nach: [von[0] + dx, von[2] + dz] } });

export const endkarte = { dauer: 1.0, kamera: { punkt: 'karte.karte', rate: 0.07 }, hauptsache: 'karte.mitte', text: 'PART 3' };

export const einstellungen = {
  // ───────── Hook (0–4,6 s): Anschluss an das letzte Bild von Teil 1 ─────────
  // "Mister Hundred takes you at" – das bernsteinfarbene Auge im Fingerspalt, die Kamera fährt zurück.
  // Review Teil 2: Das Auge war eine schmale Sichel, die Spitzen lasen sich wie Kerzen. Jetzt beginnt das
  // Bild ganz nah am offenen Auge (≥ 15 % der Bildbreite) und zieht in 1 s auf Kopf, Hände und Mantel auf.
  '1': {
    set: AUSSEN_DAEMMERUNG,
    figuren: MH(ORT.monsterGarten, -90, { gesicht: 'auge', pose: 'spaehen', pose_params: { staerke: 2.2 } }),
    // Rückfahrt höchstens bis 3 m: dahinter steht das Haus (bei 4 m war die Kamera in der Wand)
    kamera: { baustein: 'dolly_out', ziel: 'mh.auge', blick: { azimut: -90, hoehe: -4, abstand: 0.6, bezug: 'mh.auge' }, fov: 38, faktor: 0.2, profil: 'ease_out' },
    neben: [{ wer: 'mh', was: 'kopf_drehen', ab: 'start', dauer: 0.03, params: { nicken: 12 } }],
    licht_anpassung: KALT,
    haupt: { art: 'kamera', wort: 'Hundred' },
    hauptsache: 'mh.auge',
  },
  // "eighteen," – die ausgeblasenen Zahlenkerzen 1 und 8, ein dünner Rauchfaden
  '1:eighteen': {
    kamera: { punkt: 'haus.kueche_detail', rate: 0.12 },
    lampen_einzeln: { 'haus.kueche_lampe': false, 'haus.kerzen': false },
    licht_anpassung: { ...KALT_INNEN, belichtung: 1.3 },
    haupt: { art: 'kamera', wort: 'eighteen' },
    partikel: [{ art: 'atem', ort: [-14.48, 1.62, 2.6], periode: 1.6, richtung: [0, 1, 0], groesse: 0.05, deckkraft: 0.55 }],
    hauptsache: 'haus.kuchen',
  },
  // "and it came early," – der Riese im Vorgarten, Kopf auf Höhe von Elis Fenster
  '1:and it came': {
    set: AUSSEN_DAEMMERUNG,
    figuren: MH(ORT.monsterGarten, -90),
    // Review Teil 2: groß im Vordergrund statt in der Totalen, von vorn (zwischen Haus und Riese, flach
    // vom Rasen): Hände vor dem Gesicht, Mantel, dahinter Straße und Abendhimmel
    kamera: { pos: [-11.3, 0.9, 5.4], ziel: [-8.0, 4.4, 2.6], fov: 60, rate: 0.08 },
    licht_anpassung: KALT,
    haupt: { art: 'kamera', wort: 'early' },
    hauptsache: 'mh.haende',
  },
  // "like it knew where I'd hide." – Untersicht: der Kopf hinter den Händen dreht sich zur Hausecke
  '1:like': {
    set: AUSSEN_DAEMMERUNG,
    figuren: MH(ORT.monsterGarten, -90),
    // steil von unten zwischen Haus und Riese: Hände und Kopf gegen den Abendhimmel; der Kopf dreht sich zur Kamera
    // Review Teil 2: weniger steil (−55° las sich als Jubeln), die Raute aus Händen und Ellbogen von vorn
    // von der Seite (vorn steht das Haus zu nah): der Kopf dreht sich im Profil zur Hausecke
    kamera: { ziel: { anker: 'mh.haende', versatz: [0, -0.6, 0] }, blick: { azimut: 180, hoehe: -26, abstand: 8.5 }, fov: 54, rate: 0.08 },
    // gegen den dunklen Abendhimmel heller (Prüfung: Mittel 31 < 35): mehr Füll- und Kantenlicht
    licht_anpassung: { ...KALT, hemi: { himmel: '#9aa2e0', boden: '#4a4058', staerke: 2.8 }, kante: { farbe: '#9fb4ff', staerke: 2.0 }, belichtung: 1.75 },
    haupt: { wer: 'mh', was: 'kopf_drehen', wort: 'hide', anker: 'ende', dauer: 0.6, ease: 'ease_in', params: { winkel: 38 } },
    hauptsache: 'mh.haende',
  },

  // ───────── Regelbruch: der Vorhang, die Spur ─────────
  // "I yanked the curtain shut." – über Elis Schulter: draußen die Hände, der Vorhang fliegt zu
  '2': {
    set: ['strasse', 'haus', 'spur'],
    figuren: { eli: { position: ORT.eliFenster, blick: 90, gesicht: 'angst' }, vorhang: { position: ORT.vorhang, blick: -90 }, ...MH(ORT.monsterGarten, -90) },
    // Review Teil 2: nach dem Zuziehen sah man 1 s nur Vorhang; jetzt steht Eli mit Schulter und Hand vorn im Bild
    kamera: { ziel: { anker: 'mh.haende', versatz: [0, -0.6, 0] }, pos: [-13.3, 5.55, 3.05], fov: 52, rate: 0.07, zusaetze: [{ baustein: 'shake', wort: 'yanked', staerke: 1 }] },
    licht_anpassung: KALT_INNEN,
    neben: [{ wer: 'eli', was: 'greifen', ab: 'start', dauer: 0.12, params: { zu: 'vorhang.griff_r', seite: 'r', form: 'faust' } }],
    haupt: { wer: 'vorhang', was: 'zuziehen', wort: 'yanked' },
    hauptsache: 'eli.kopf',
  },
  // "When I looked again," – Eli zieht den Vorhang einen Spalt auf, Dreiviertel von vorn
  '3': {
    set: ['strasse', 'haus', 'spur'],
    figuren: { eli: { position: [-12.8, OG, 2.45], blick: 52, gesicht: 'besorgt' }, vorhang: { position: ORT.vorhang, blick: -90, pose: 'zuziehen' } },
    kamera: { ziel: { anker: 'eli.kopf', versatz: [0.05, -0.12, 0] }, pos: [-12.45, 5.3, 3.95], fov: 44, rate: 0.07 },
    licht_anpassung: KALT_INNEN,
    neben: [{ wer: 'eli', was: 'greifen', ab: 'start', dauer: 0.2, params: { zu: 'vorhang.griff_l', seite: 'l' } }],
    haupt: { wer: 'vorhang', was: 'aufziehen', wort: 'looked', dauer: 0.5, params: { spalt: 0.24, seite: 'l' } },
    hauptsache: 'eli.kopf',
  },
  // "the yard was empty." – über Elis Schulter durch den Spalt: der Vorgarten ist leer, Reif auf dem Rasen
  '3:the yard': {
    set: ['strasse', 'haus', 'spur'],
    // Elis Blick aus dem Fenster steil hinunter in den Vorgarten (Reif, Spur); der Fensterrahmen rahmt das Bild
    kamera: { pos: [-12.62, 5.62, 2.45], ziel: [-8.6, 1.2, 2.95], fov: 50, rate: 0.07 },
    licht_anpassung: KALT_INNEN,
    haupt: { art: 'kamera', wort: 'empty' },
    hauptsache: [-8.6, 0.5, 3.0],
  },
  // "Just footprints in the frost," – Sturzfahrt auf die Abdrücke im Reif
  '4': {
    set: AUSSEN_DAEMMERUNG,
    kamera: { baustein: 'push_in', pos: [-8.3, 4.4, 5.6], ziel: [-8.5, 0, 3.15], fov: 48, profil: 'ease_in', faktor: 1.6, vorlauf: 0.18 },
    licht_anpassung: { ...KALT, belichtung: 1.3 },
    haupt: { art: 'kamera', wort: 'footprints' },
    hauptsache: [-8.5, 0, 3.2],
  },
  // "long and bare." – flach an der Spur entlang zur Hausecke
  '4:long': {
    set: AUSSEN_DAEMMERUNG,
    kamera: { punkt: 'spur.entlang', rate: 0.08 },
    licht_anpassung: { ...KALT, belichtung: 1.3 },
    haupt: { art: 'kamera', wort: 'bare' },
    hauptsache: 'spur.spur_ecke',
  },
  // "They stopped at June's window." – an der Hauswand: die Spur endet unter Junes dunklem Seitenfenster
  '5': {
    set: AUSSEN_DAEMMERUNG,
    kamera: { punkt: 'spur.fenster', rate: 0.08 },
    licht_anpassung: { ...KALT, belichtung: 1.35 },
    haupt: { art: 'kamera', wort: 'window' },
    hauptsache: 'spur.june_fenster',
  },
  // "The one room it never looks in." – Junes Zimmer in der Dämmerung, nichts bewegt sich
  '6': {
    figuren: { luke_tp: { position: ORT.luke, blick: 90 } },
    kamera: { punkt: 'haus.june_totale', rate: 0.07 },
    licht_anpassung: KALT_INNEN,
    haupt: { art: 'kamera', wort: 'never' },
    hauptsache: 'haus.june_bett',
  },

  // ───────── Falsche Sicherheit: June ─────────
  // "I ran downstairs." – Folgefahrt hinter Eli die Treppe hinunter
  '7': {
    figuren: { eli: { position: [-16.25, OG, -4.32], blick: 90, gesicht: 'angst' } },
    kamera: { baustein: 'dolly_out', ziel: { anker: 'eli.kopf', versatz: [0, -0.2, 0] }, pos: [-12.7, 2.35, -4.35], fov: 54, rate: -0.07 },
    // Review Teil 2: die grüne Jacke war auf der Treppe reines Schwarz -> Füll-Licht von vorn (Treppenfenster)
    licht_anpassung: { ...KALT_INNEN, hemi: { himmel: '#b4bcf0', boden: '#6a5a70', staerke: 3.8 }, haupt: { farbe: '#ffb08a', staerke: 3.0, richtung: [0.9, 0.35, 0.1] }, belichtung: 1.7 },
    // rennt bis auf die fünfte Stufe (Stufenhöhe dort 1,93 m: klettern −1,87)
    haupt: { wer: 'eli', was: 'rennen', wort: 'ran', dauer: 0.95, ease: 'linear', params: { nach: [-14.2, -4.32] } },
    neben: [{ wer: 'eli', was: 'klettern', wort: 'ran', dauer: 0.95, ease: 'linear', params: { hoehe: -1.87, arme: false } }],
    hauptsache: 'eli.kopf',
  },
  // "June opened her door," – über Elis Schulter: Junes Tür geht auf, June steht im Zimmer
  '8': {
    figuren: {
      eli: { position: [-17.2, SO, -1.5], blick: -10, gesicht: 'besorgt' },
      june: { position: [-17.65, SO, 0.85], blick: 180, gesicht: 'besorgt' },
      tuer_june: { position: ORT.juneTuer, blick: 180 },
      luke_tp: { position: ORT.luke, blick: 90 },
    },
    // Flurlampe (Konsole neben Junes Tür) aus: sie stand im ersten Bogen hell vor der Linse
    lampen_einzeln: { 'haus.flur_lampe': false },
    kamera: { ziel: [-17.65, 1.5, 0.75], pos: [-17.9, 1.75, -2.85], fov: 46, rate: 0.07 },
    licht_anpassung: KALT_INNEN,
    haupt: { wer: 'tuer_june', was: 'oeffnen', wort: 'opened', params: { winkel: -82 } },
    hauptsache: 'june.kopf',
  },
  // "barefoot," – Junes nackte Füße auf den Dielen
  '8:barefoot': {
    figuren: { june: { position: [-17.65, SO, 0.55], blick: 180, gesicht: 'besorgt' }, tuer_june: { position: ORT.juneTuer, blick: 180, pose: 'oeffnen', pose_params: { winkel: -82 } } },
    lampen_einzeln: { 'haus.flur_lampe': false },
    kamera: { ziel: { anker: 'june.fuss', versatz: [0, 0.1, 0] }, blick: { azimut: 196, hoehe: 16, abstand: 1.05 }, fov: 38, rate: 0.07 },
    licht_anpassung: KALT_INNEN,
    haupt: { art: 'kamera', wort: 'barefoot' },
    hauptsache: 'june.fuss',
  },
  // "Her hands were ice cold." – June ist in den Flur getreten und greift Elis Handgelenk, er zuckt zusammen
  // (beide im Profil, mitten im Flur: an Junes Tür standen Konsole, Lampe und Türrahmen vor der Linse)
  '9': {
    figuren: {
      june: { position: [-16.3, SO, -2.0], blick: -90, gesicht: 'besorgt' },
      eli: { position: [-17.25, SO, -2.0], blick: 90, gesicht: 'besorgt' },
    },
    lampen_einzeln: { 'haus.flur_lampe': false },
    // Review Teil 2: las sich als Händeschütteln, das Zucken warf die Arme aus dem Bild. Jetzt halbnah mit
    // beiden Gesichtern, June greift von oben ums Handgelenk, Eli zuckt klein, sein Atem wird weiß
    kamera: { ziel: [-16.78, 1.9, -2.0], pos: [-16.72, 2.05, 0.15], fov: 52, rate: 0.07 },
    licht_anpassung: KALT_INNEN,
    neben: [
      { wer: 'eli', was: 'arm_heben', ab: 'start', dauer: 0.2, params: { seite: 'r', vorn: 40 } },
      { wer: 'june', was: 'greifen', wort: 'hands', dauer: 0.35, params: { zu: { anker: 'eli.hand_r', versatz: [-0.09, 0.06, 0] }, seite: 'l', form: 'faust', lehnen: false } },
    ],
    haupt: { wer: 'eli', was: 'erschrecken', wort: 'cold', params: { staerke: 0.35 } },
    gesichter: [{ wer: 'eli', name: 'angst', wort: 'cold' }],
    partikel: [{ art: 'atem', ort: 'eli.mund', wort: 'cold', periode: 1.3, groesse: 0.06, deckkraft: 0.6 }],
    hauptsache: 'june.hand_l',
  },
  // "It can't touch you before midnight." – June leise, Mundformen
  '10': {
    figuren: { june: { position: [-16.3, SO, -2.0], blick: -90, gesicht: 'laecheln' } },
    lampen_einzeln: { 'haus.flur_lampe': false },
    kamera: { ziel: { anker: 'june.kopf', versatz: [0, -0.14, 0] }, blick: { azimut: -70, hoehe: 2, abstand: 1.9 }, fov: 38, rate: 0.07 },
    licht_anpassung: KALT_INNEN,
    haupt: { wer: 'june', was: 'kopf_drehen', wort: 'midnight', dauer: 0.3, params: { winkel: -8, nicken: 7 } },
    mund: { wer: 'june', miene: 'laecheln' },
    hauptsache: 'june.kopf',
  },

  // ───────── Die Stadt um elf ─────────
  // "At eleven, the town walked me and" – Seitenfahrt am Laternenzug entlang
  '11': {
    uhr: '11:00',
    figuren: {
      eli: { position: [0.4, 0, -19.0], blick: 180, gesicht: 'besorgt' },
      june2: { position: [-0.5, 0, -19.4], blick: 180, gesicht: 'besorgt' },
      tess: { position: [1.4, 0, -18.5], blick: 180, gesicht: 'grinsen' },
      nb_ohren: { position: [-1.7, 0, -17.6], blick: 180 }, nb_mantel: { position: [2.3, 0, -20.6], blick: 180 },
      nb_frau: { position: [-1.1, 0, -21.5], blick: 180 }, nb_alt: { position: [1.4, 0, -22.4], blick: 180 },
      nb_passant: { position: [-2.4, 0, -19.9], blick: 180 }, nb_alt2: { position: [0.2, 0, -16.9], blick: 180 },
    },
    kamera: { baustein: 'truck_side', pos: [4.4, 1.7, -25.2], ziel: [0.2, 1.3, -19.8], fov: 50, richtung: 'rechts', strecke: 2.0, vordergrund: false },
    licht_anpassung: NACHT_HELL,
    neben: [
      geh('eli', [0.4, 0, -19.0], -2.1, 1.6), geh('june2', [-0.5, 0, -19.4], -2.1, 1.6), geh('tess', [1.4, 0, -18.5], -2.2, 1.6),
      geh('nb_ohren', [-1.7, 0, -17.6], -2.0, 1.6), geh('nb_mantel', [2.3, 0, -20.6], -2.0, 1.6), geh('nb_frau', [-1.1, 0, -21.5], -2.1, 1.6),
      geh('nb_alt', [1.4, 0, -22.4], -1.8, 1.6), geh('nb_passant', [-2.4, 0, -19.9], -2.0, 1.6), geh('nb_alt2', [0.2, 0, -16.9], -2.1, 1.6),
    ],
    haupt: { art: 'kamera', wort: 'town' },
    hauptsache: 'eli.kopf',
  },
  // "Tess Lowry to the square." – Tess im Zug, sie schaut grinsend zu Eli
  '11:Tess': {
    uhr: '11:00',
    figuren: {
      tess: { position: [1.4, 0, -20.7], blick: 180, gesicht: 'grinsen' },
      eli: { position: [0.4, 0, -21.1], blick: 180, gesicht: 'besorgt' },
      nb_frau: { position: [-0.6, 0, -19.6], blick: 180 },
    },
    kamera: { ziel: { anker: 'tess.kopf', versatz: [0, -0.12, 0] }, pos: [2.6, 1.6, -24.9], fov: 42, rate: 0.07 },
    licht_anpassung: NACHT_HELL,
    neben: [geh('tess', [1.4, 0, -20.7], -1.5, 1.6), geh('eli', [0.4, 0, -21.1], -1.5, 1.6), geh('nb_frau', [-0.6, 0, -19.6], -1.5, 1.6)],
    haupt: { wer: 'tess', was: 'kopf_drehen', wort: 'Tess', dauer: 0.3, params: { winkel: 42 } },
    hauptsache: 'tess.kopf',
  },
  // "On every porch," – Seitenfahrt an den Veranden: überall liegen die Schuhe kreuz und quer
  '12': {
    figuren: {
      sp_v1: { position: [-10.6, SO, -16.1], blick: 70 },
      sp_v2: { position: [-10.5, SO, -18.9], blick: 110 },
      sp_v3: { position: [-10.7, SO, -14.2], blick: 40 },
    },
    kamera: { baustein: 'truck_side', pos: [-10.3, 1.5, -14.5], ziel: [-10.65, 0.62, -17.2], fov: 50, richtung: 'rechts', strecke: 1.0, vordergrund: false },
    licht_anpassung: NACHT_HELL,
    haupt: { art: 'kamera', wort: 'porch' },
    hauptsache: 'sp_v1.mitte',
  },
  // "the shoes were kicked apart." – ein Paar liegt auseinandergetreten auf dem Verandaboden
  '12:the shoes': {
    figuren: { sp_v2: { position: [-10.7, SO, -18.9], blick: 110 } },
    kamera: { ziel: { anker: 'sp_v2.mitte', versatz: [0, -0.05, 0] }, blick: { azimut: 100, hoehe: 48, abstand: 2.5 }, fov: 44, rate: 0.07 },
    licht_anpassung: { ...NACHT_HELL, belichtung: 1.8 },
    haupt: { art: 'kamera', wort: 'apart' },
    hauptsache: 'sp_v2.mitte',
  },
  // "Side by side is all it leaves." – am Morgen: ein graues Paar nebeneinander auf einer leeren Veranda
  '13': {
    figuren: { sp_grau: { position: [10.9, SO, 8.0], blick: -90 } },
    kamera: { ziel: 'sp_grau.mitte', blick: { azimut: -55, hoehe: 20, abstand: 1.3 }, fov: 38, rate: 0.07 },
    licht_anpassung: { belichtung: 1.25 },
    haupt: { art: 'kamera', wort: 'Side' },
    hauptsache: 'sp_grau.mitte',
  },
  // "Mr. Odell rings the midnight bell," – Odell vor der Kirche schaut zum Turm, oben schwingt die Glocke
  '14': {
    uhr: '11:00',
    figuren: { odell: { position: ORT.odell, blick: 0, gesicht: 'streng' } },
    kamera: { ziel: { anker: 'odell.kopf', versatz: [0, -0.3, 0] }, pos: [2.7, 1.25, -54.4], fov: 46, rate: 0.07 },
    licht_anpassung: NACHT_HELL,
    haupt: { wer: 'odell', was: 'kopf_drehen', wort: 'Odell', dauer: 0.4, params: { winkel: 12, nicken: -45 } },
    set_ereignisse: [{ set: 'strasse', was: 'glocke', wort: 'bell' }],
    hauptsache: 'odell.kopf',
  },
  // "and it starts counting." – Rückgriff auf Teil 1: am Platzende zählt es, kaltes Licht durch die Finger
  '14:and it starts': {
    figuren: MH(ORT.monsterPlatz, 0),
    kamera: { ziel: { anker: 'mh.brust', versatz: [0, 0.6, 0] }, pos: [-6.0, 1.3, -44.0], fov: 48, rate: 0.07 },
    // Review Teil 2: als „so ist es jedes Jahr“ erkennbar machen (entsättigt wie die Rückblenden), sonst
    // glaubt man bei 30 s, Mitternacht sei schon gewesen; Mantel dunkel, nur die Kante hell
    licht_anpassung: { haupt: { richtung: [-0.45, 0.55, 0.7], staerke: 2.4 }, belichtung: 1.6, grade: { saettigung: 0.6, kontrast: 1.06 } },
    haupt: { wer: 'mh', was: 'zaehlen', wort: 'counting', dauer: 0.8, params: { takt: 0.4 } },
    hauptsache: 'mh.haende',
  },
  // "Only the sunrise bell" – im ersten Morgenlicht am Kirchturm hinauf bis zur Glocke
  '15': {
    uhr: '6:10',
    kamera: { baustein: 'tilt_up', von_ziel: 'strasse.kirche_tuer', ziel: 'strasse.glocke', pos: [3.6, 1.6, -46.5], ankunft_wort: 'bell', kran: 1.2, fov: 56 },
    licht_anpassung: { belichtung: 1.2 },
    set_ereignisse: [{ set: 'strasse', was: 'glocke', wort: 'bell' }],
    haupt: { art: 'kamera', wort: 'bell' },
    hauptsache: 'strasse.glocke',
  },
  // "ends Hiding Night." – von hinten: der Riese stapft gegen die aufgehende Sonne in den Nebel
  '15:ends': {
    figuren: MH([0.4, 0, 48.5], 0),
    kamera: { ziel: { anker: 'mh.brust', versatz: [0, -0.6, 0] }, pos: [1.7, 0.7, 37.0], fov: 52, rate: 0.07 },
    licht_anpassung: { kante: { staerke: 1.8, farbe: '#ffc8a0' }, belichtung: 1.2 },
    haupt: { wer: 'mh', was: 'stapfen', wort: 'ends', dauer: 1.5, params: { nach: [0.4, 53.5], schritt: 0.9 } },
    hauptsache: 'mh.brust',
  },

  // ───────── Odell und June ─────────
  // "Mr. Odell turned to June." – Odell dreht sich von Eli weg zu June
  '16': {
    uhr: '11:00',
    figuren: {
      odell: { position: [1.2, 0, -57.0], blick: 25, gesicht: 'streng' },
      june2: { position: [-0.85, 0, -56.3], blick: 110, gesicht: 'besorgt' },
      eli: { position: [1.5, 0, -55.4], blick: 190, gesicht: 'besorgt' },
    },
    // Review Teil 2: June war nur eine gelbe Schulter am Rand. Jetzt über Odells Schulter auf Junes Gesicht
    kamera: { ziel: { anker: 'june2.kopf', versatz: [0, -0.1, 0] }, pos: [1.9, 1.75, -58.1], fov: 40, rate: 0.07 },
    licht_anpassung: NACHT_HELL,
    haupt: { wer: 'odell', was: 'umdrehen', wort: 'June', anker: 'ende', dauer: 0.45, params: { blick: -72 } },
    gesichter: [{ wer: 'odell', name: 'warnend', wort: 'June' }],
    hauptsache: 'june2.kopf',
  },
  // "It takes the helper too." – Odell zeigt auf June (Mundformen)
  '17': {
    uhr: '11:00',
    figuren: { odell: { position: [1.2, 0, -57.0], blick: -72, gesicht: 'warnend' }, june2: { position: [-0.85, 0, -56.3], blick: 110, gesicht: 'besorgt' } },
    kamera: { ziel: { anker: 'odell.kopf', versatz: [0, -0.2, 0] }, blick: { azimut: -50, hoehe: 3, abstand: 2.2 }, fov: 40, rate: 0.07 },
    licht_anpassung: NACHT_HELL,
    haupt: { wer: 'odell', was: 'zeigen', wort: 'helper', params: { zu: 'june2.kopf', seite: 'r' } },
    mund: { wer: 'odell', miene: 'warnend' },
    hauptsache: 'odell.kopf',
  },
  // "So why are you still here?" – Bogenfahrt über Odells Schulter auf June
  '18': {
    uhr: '11:00',
    figuren: { odell: { position: [1.2, 0, -57.0], blick: -72, gesicht: 'warnend', pose: 'zeigen', pose_params: { zu: [-0.85, 1.6, -56.3], seite: 'r' } }, june2: { position: [-0.85, 0, -56.3], blick: 110, gesicht: 'besorgt' } },
    kamera: { baustein: 'orbit', ziel: { anker: 'june2.kopf', versatz: [0, -0.15, 0] }, blick: { azimut: 68, hoehe: 4, abstand: 3.3 }, grad_pro_s: 18, fov: 40 },
    licht_anpassung: NACHT_HELL,
    haupt: { art: 'kamera', wort: 'still' },
    mund: { wer: 'odell', miene: 'warnend' },
    hauptsache: 'june2.kopf',
  },
  // "June didn't answer." – June hält seinem Blick stand
  '19': {
    uhr: '11:00',
    figuren: { june2: { position: [-0.85, 0, -56.3], blick: 110, gesicht: 'besorgt' } },
    kamera: { ziel: { anker: 'june2.kopf', versatz: [0, -0.15, 0] }, blick: { azimut: 118, hoehe: 2, abstand: 1.8 }, fov: 38, rate: 0.05 },
    licht_anpassung: NACHT_HELL,
    haupt: { art: 'gesicht', wer: 'june2', name: 'entschlossen', wort: 'answer' },
    hauptsache: 'june2.kopf',
  },
  // "Tess grinned." – Tess grinst in die Stille
  '20': {
    uhr: '11:00',
    figuren: { tess: { position: [2.1, 0, -55.4], blick: -40, gesicht: 'nervoes' } },
    kamera: { ziel: { anker: 'tess.kopf', versatz: [0, -0.15, 0] }, blick: { azimut: -25, hoehe: 3, abstand: 1.8 }, fov: 40, rate: 0.07 },
    licht_anpassung: NACHT_HELL,
    haupt: { art: 'gesicht', wer: 'tess', name: 'grinsen', wort: 'grinned' },
    hauptsache: 'tess.kopf',
  },
  // "Last game of hide and seek, huh?" – Tess hält sich zum Spaß die Hände vors Gesicht
  '21': {
    uhr: '11:00',
    figuren: { tess: { position: [2.1, 0, -55.4], blick: -40, gesicht: 'grinsen' }, nb_jung: { position: [3.5, 0, -54.1], blick: -100, gesicht: 'nervoes' } },
    kamera: { ziel: { anker: 'tess.kopf', versatz: [0.1, -0.3, 0] }, blick: { azimut: -18, hoehe: 4, abstand: 2.7 }, fov: 44, rate: 0.07 },
    licht_anpassung: NACHT_HELL,
    haupt: { wer: 'tess', was: 'augen_zuhalten', wort: 'seek', anker: 'ende' },
    mund: { wer: 'tess', miene: 'grinsen' },
    hauptsache: 'tess.kopf',
  },
  // "Nobody laughed." – die Menge starrt Tess an, die Blicke sinken
  '22': {
    uhr: '11:00',
    // Review Teil 2: 8–12 Erwachsene im Halbkreis, alle Blicke auf Tess (die Kamera steht an ihrer Stelle);
    // eng in drei Reihen, damit sie im schmalen Hochformat alle im Bild stehen
    figuren: {
      nb_frau: { position: [0.2, 0, -52.6], blick: 180, gesicht: 'besorgt' }, nb_mantel: { position: [-1.2, 0, -52.3], blick: 168, gesicht: 'besorgt' },
      nb_alt: { position: [1.5, 0, -52.2], blick: 192, gesicht: 'besorgt' }, odell: { position: [-0.6, 0, -53.4], blick: 175, gesicht: 'streng' },
      nb_ohren: { position: [2.3, 0, -51.2], blick: 198, gesicht: 'besorgt' }, nb_passant: { position: [-2.0, 0, -51.1], blick: 160, gesicht: 'ernst' },
      nb_6: { position: [-0.6, 0, -51.0], blick: 176, gesicht: 'besorgt' }, nb_7: { position: [0.9, 0, -50.8], blick: 186, gesicht: 'ernst' },
      nb_8: { position: [-1.5, 0, -49.8], blick: 170, gesicht: 'besorgt' }, nb_9: { position: [1.8, 0, -49.7], blick: 190, gesicht: 'ernst' },
      nb_10: { position: [0.2, 0, -49.5], blick: 180, gesicht: 'besorgt' }, nb_alt2: { position: [-2.6, 0, -50.0], blick: 165, gesicht: 'besorgt' },
    },
    kamera: { pos: [0.3, 1.75, -56.4], ziel: [0.1, 1.35, -51.2], fov: 58, rate: 0.06 },
    licht_anpassung: NACHT_HELL,
    haupt: { art: 'gesicht', wer: 'nb_frau', name: 'blick_gesenkt', wort: 'Nobody' },
    gesichter: [
      { wer: 'nb_mantel', name: 'blick_gesenkt', wort: 'laughed' },
      { wer: 'nb_alt', name: 'blick_gesenkt', wort: 'laughed', versatz: 0.1 },
    ],
    hauptsache: 'nb_frau.kopf',
  },
  // "She'd hide in the bell tower," – Tess steigt die Kirchenstufen hinauf zur Turmtür
  '23': {
    uhr: '11:00',
    figuren: { tess: { position: [0.3, 0, -57.4], blick: 180, gesicht: 'grinsen' }, odell: { position: [2.4, 0, -56.6], blick: -120, gesicht: 'streng' } },
    kamera: { ziel: { anker: 'tess.kopf', versatz: [0, -0.2, 0] }, pos: [2.2, 1.1, -53.6], fov: 48, rate: 0.07 },
    licht_anpassung: NACHT_HELL,
    haupt: { wer: 'tess', was: 'gehen', wort: 'tower', anker: 'ende', dauer: 0.74, ease: 'linear', params: { nach: [0.25, -59.2] } },
    neben: [{ wer: 'tess', was: 'klettern', wort: 'tower', anker: 'ende', dauer: 0.74, ease: 'linear', params: { hoehe: 0.8, arme: false } }],
    hauptsache: 'tess.kopf',
  },
  // "higher than any window." – Tilt am Turm hoch: die Schallluken über allen oberen Fenstern
  '23:higher': {
    uhr: '11:00',
    // Review Teil 2: das Straßenschild bei x −4,4 stand vor der Linse, und kein Haus gab den Größenvergleich.
    // Jetzt vom Gehweg vor der linken Häuserzeile: deren obere Fenster stehen im Bild, der Turm darüber
    kamera: { baustein: 'tilt_up', von_ziel: 'strasse.kirche_tuer', ziel: 'strasse.glocke', pos: [-8.6, 1.6, -30.5], ankunft_wort: 'window', kran: 1.6, fov: 60 },
    licht_anpassung: NACHT_HELL,
    haupt: { art: 'kamera', wort: 'window' },
    hauptsache: 'strasse.glocke',
  },

  // ───────── Omen ─────────
  // "At home, I kicked my" – Eli tritt im Flur die Turnschuhe auseinander
  '24': {
    figuren: {
      eli: { position: [-13.55, SO, -1.45], blick: -118, gesicht: 'entschlossen' },
      sp_eli_a: { position: [-13.82, SO, -1.62], blick: -118 },
      sp_eli_b: { position: [-14.25, SO, -1.95], blick: 160, sichtbar: false },
    },
    // aus dem hinteren Flur: Eli kommt zur Tür herein und tritt die Schuhe zur Kamera hin weg
    lampen_einzeln: { 'haus.flur_lampe': false },
    kamera: { ziel: { anker: 'eli.brust', versatz: [0, -0.2, 0] }, pos: [-16.3, 1.55, -2.35], fov: 50, rate: 0.07 },
    licht_anpassung: { belichtung: 1.25 },
    haupt: { wer: 'eli', was: 'kicken', wort: 'kicked', params: { seite: 'r' } },
    neben: [
      { wer: 'sp_eli_a', was: 'sichtbar', wort: 'kicked', versatz: 0.15, params: { wert: false } },
      { wer: 'sp_eli_b', was: 'sichtbar', wort: 'kicked', versatz: 0.15, params: { wert: true } },
    ],
    hauptsache: 'eli.brust',
  },
  // "sneakers apart in the hall." – Elis Turnschuhe liegen auseinander
  '24:sneakers': {
    figuren: { sp_eli_b: { position: [-14.25, SO, -1.95], blick: 160 } },
    kamera: { ziel: 'sp_eli_b.mitte', blick: { azimut: 60, hoehe: 40, abstand: 1.35 }, fov: 42, rate: 0.07 },
    licht_anpassung: { belichtung: 1.25 },
    haupt: { art: 'kamera', wort: 'apart' },
    hauptsache: 'sp_eli_b.mitte',
  },
  // "I packed for the woods." – Eli stopft die Taschenlampe in den Rucksack
  '25': {
    // Review Teil 2: die Kamera stand hinter Elis Kopf. Jetzt steht er am Bett und greift die Taschenlampe,
    // Dreiviertel von vorn (Kamera an der Fensterseite des Zimmers)
    figuren: { eli: { position: [-14.85, OG, 3.3], blick: -90, gesicht: 'entschlossen' } },
    kamera: { ziel: { anker: 'eli.kopf', versatz: [0, -0.4, 0] }, pos: [-15.55, OG + 1.5, 1.35], fov: 52, rate: 0.07 },
    licht_anpassung: { belichtung: 1.2 },
    haupt: { wer: 'eli', was: 'greifen', wort: 'woods', anker: 'ende', params: { zu: [-15.55, OG + 0.62, 3.35], seite: 'r', lehnen: false } },
    hauptsache: 'eli.kopf',
  },
  // "When I came back down," – Eli kommt mit dem Rucksack die Treppe herunter (Kamera fährt vor ihm)
  '26': {
    figuren: { eli2: { position: [-16.0, OG, -4.32], blick: 90, gesicht: 'entschlossen' } },
    kamera: { baustein: 'dolly_out', ziel: { anker: 'eli2.kopf', versatz: [0, -0.2, 0] }, pos: [-12.7, 1.55, -4.4], fov: 52, rate: -0.07 },
    licht_anpassung: { belichtung: 1.2 },
    haupt: { wer: 'eli2', was: 'gehen', wort: 'came', dauer: 1.05, ease: 'linear', params: { nach: [-13.2, -4.32] } },
    neben: [{ wer: 'eli2', was: 'klettern', wort: 'came', dauer: 1.05, ease: 'linear', params: { hoehe: -2.35, arme: false } }],
    hauptsache: 'eli2.kopf',
  },
  // "they were side by side." – Snap-Zoom: Elis Turnschuhe stehen genau nebeneinander, hinten Junes Tür einen Spalt offen
  '26:side': {
    figuren: {
      sp_eli_c: { position: [-13.35, SO, -1.95], blick: 100 },
      tuer_june: { position: ORT.juneTuer, blick: 180, pose: 'oeffnen', pose_params: { winkel: -14 } },
    },
    kamera: { baustein: 'snap_zoom', ziel: 'sp_eli_c.mitte', pos: [-12.55, 1.05, -2.75], fov: 42, zeit_wort: 'side', faktor: 1.18, bilder: 2 },
    licht_anpassung: { belichtung: 1.25 },
    tiefe: { fokus: 'sp_eli_c.mitte', staerke: 0.7 },
    haupt: { art: 'kamera', wort: 'side' },
    hauptsache: 'sp_eli_c.mitte',
  },

  // ───────── Entscheidung ─────────
  // "If I ran, I'd end up like Owen." – Rückgriff: Owens Pick-up am Morgen, Motor läuft, Tür offen
  '27': {
    figuren: { pk2: { position: ORT.pikeEinfahrt, blick: -90, pose: 'tuer_auf', pose_params: { winkel: 62 } } },
    // durch die offene Fahrertür: Owens Stiefel auf dem Sitz, nebeneinander (Bild aus Teil 1, Satz 16)
    // Review Teil 2: die Fahrt begann im Sitz bzw. in der Tür (0,8 s einfarbige Fläche). Jetzt aus der
    // Endkadrierung: feste Position vor der offenen Tür, nur ein kleiner Push
    kamera: { ziel: 'pk2.sitz', blick: { azimut: 10, hoehe: 32, abstand: 1.22 }, fov: 44, rate: 0.07 },
    licht_anpassung: { belichtung: 1.55, hemi: { staerke: 2.8 }, haupt: { staerke: 3.0 } },
    haupt: { art: 'kamera', wort: 'Owen' },
    hauptsache: 'pk2.sitz',
  },
  // "If June hid me, she'd end up like Dad." – Rückgriff: Dads Stiefel nebeneinander auf der Veranda
  '28': {
    figuren: { sp_dad: { position: [-10.9, SO, -2.8], blick: 90 } },
    kamera: { ziel: 'sp_dad.mitte', blick: { azimut: 38, hoehe: 20, abstand: 1.3 }, fov: 38, rate: 0.07 },
    licht_anpassung: { belichtung: 1.3 },
    haupt: { art: 'kamera', wort: 'Dad' },
    hauptsache: 'sp_dad.mitte',
  },
  // "June took my bag." – Bogenfahrt: June greift den Träger von Elis Rucksack und hält ihn fest
  '29': {
    figuren: {
      eli2: { position: [-14.3, SO, -2.55], blick: -90, gesicht: 'entschlossen' },
      june: { position: [-15.25, SO, -2.55], blick: 90, gesicht: 'entschlossen' },
      tuer_june: { position: ORT.juneTuer, blick: 180, pose: 'oeffnen', pose_params: { winkel: -14 } },
    },
    // beide im Profil (Kamera auf der Flurseite zu Junes Zimmer), June greift mit der rechten Hand den Träger
    // Review Teil 2: der Rucksack war nie im Bild, June beugte sich vor wie zur Verbeugung. Jetzt halbnah von
    // der Seite mit beiden Gesichtern und dem Träger; Junes Hand schließt sich um den Träger, ohne Vorbeugen
    kamera: { baustein: 'orbit', ziel: [-14.75, 1.85, -2.55], blick: { azimut: 6, hoehe: 6, abstand: 2.4 }, grad_pro_s: 14, fov: 58 },
    licht_anpassung: { belichtung: 1.2 },
    haupt: { wer: 'june', was: 'greifen', wort: 'bag', anker: 'ende', params: { zu: 'eli2.rucksack', seite: 'r', form: 'faust', lehnen: false } },
    hauptsache: ['june.kopf', 'eli2.rucksack'],
  },
  // "It never looks in my room, Rabbit." – June beugt sich vor und spricht leise
  '30': {
    figuren: { june: { position: [-15.2, SO, -2.5], blick: 90, gesicht: 'besorgt' } },
    kamera: { ziel: { anker: 'june.kopf', versatz: [0, -0.13, 0] }, blick: { azimut: 70, hoehe: 2, abstand: 2.0 }, fov: 38, rate: 0.07 },
    licht_anpassung: { belichtung: 1.2 },
    haupt: { wer: 'june', was: 'vorbeugen', wort: 'Rabbit', dauer: 0.5, params: { winkel: 14, kopf_ausgleich: 12 } },
    mund: { wer: 'june', miene: 'besorgt' },
    hauptsache: 'june.kopf',
  },
  // "That's why I'm still here." – June lächelt, die Kamera bleibt einen Tick zu lange auf ihr
  '31': {
    figuren: { june: { position: [-15.2, SO, -2.5], blick: 90, gesicht: 'besorgt' } },
    kamera: { ziel: { anker: 'june.kopf', versatz: [0, -0.1, 0] }, blick: { azimut: 82, hoehe: 1, abstand: 1.65 }, fov: 36, rate: 0.045 },
    licht_anpassung: { belichtung: 1.2 },
    haupt: { art: 'gesicht', wer: 'june', name: 'laecheln', wort: 'still' },
    mund: { wer: 'june', miene: 'laecheln' },
    hauptsache: 'june.kopf',
  },
  // "She rolled back the" – Kran von oben: June rollt den Teppich zurück, der Eisenring kommt hervor
  '32': {
    figuren: {
      june: { position: [-17.85, SO, 2.05], blick: -90, gesicht: 'entschlossen', pose: 'ducken', pose_params: { tiefe: 0.7, arme: 'knie' } },
      luke_tp: { position: ORT.luke, blick: 90 },
    },
    kamera: { baustein: 'crane_down_tilt', ziel: 'luke_tp.mitte', blick: { azimut: 25, hoehe: 56, abstand: 2.3 }, hoehe: 0.7, rueck: 0.3, ankunft_wort: 'back', fov: 54 },
    licht_anpassung: { belichtung: 1.3 },
    haupt: { wer: 'luke_tp', was: 'teppich_rollen', wort: 'rolled' },
    hauptsache: 'luke_tp.mitte',
  },
  // "rug and opened the hatch." – die Luke klappt auf, darunter der schwarze Schacht
  '32:rug': {
    figuren: {
      june: { position: [-17.85, SO, 1.45], blick: -60, gesicht: 'entschlossen', pose: 'ducken', pose_params: { tiefe: 0.7, arme: 'knie' } },
      luke_tp: { position: ORT.luke, blick: 90, pose: 'teppich_rollen' },
    },
    kamera: { ziel: { anker: 'luke_tp.mitte', versatz: [0, 0.2, 0] }, pos: [-17.5, 1.35, 3.4], fov: 50, rate: 0.07 },
    licht_anpassung: { belichtung: 1.3 },
    haupt: { wer: 'luke_tp', was: 'oeffnen', wort: 'opened', params: { winkel: 105 } },
    hauptsache: 'luke_tp.mitte',
  },
  // "I climbed in anyway." – Eli steigt in die Luke hinab, von vorn; hinter ihm steht June
  '33': {
    figuren: {
      eli: { position: ORT.lukeMitte, blick: 90, gesicht: 'entschlossen' },
      june: { position: [-20.1, SO, 1.3], blick: 55, gesicht: 'besorgt' },
      luke_tp: { position: ORT.luke, blick: 90, pose: 'teppich_rollen' },
    },
    kamera: { ziel: { anker: 'eli.kopf', versatz: [0, -0.2, 0] }, pos: [-17.05, 1.15, 2.3], fov: 50, rate: 0.07 },
    licht_anpassung: { belichtung: 1.3 },
    neben: [{ wer: 'luke_tp', was: 'oeffnen', ab: 'start', dauer: 0.03, params: { winkel: 105 } }],
    haupt: { wer: 'eli', was: 'klettern', wort: 'climbed', dauer: 0.8, params: { hoehe: -1.0, arme: false } },
    hauptsache: 'eli.kopf',
  },

  // ───────── Kriechkeller ─────────
  // "The hatch closed over me," – von unten: die Luke klappt über der Kamera zu
  '34': {
    figuren: { luke_k: { position: ORT.kellerLuke, blick: 0, pose: 'oeffnen' } },
    // nicht neben der Taschenlampe: dort stand die Kamera im Lichtkegel (weißes Bild)
    kamera: { pos: kw(0.25, 0.3, 0.62), ziel: kw(0.45, 1.2, -0.05), fov: 58, rate: 0.07 },
    haupt: { wer: 'luke_k', was: 'schliessen', wort: 'closed' },
    hauptsache: 'keller.luke',
  },
  // "then the rug." – die Lichtfugen am Lukenrand verschwinden, als der Teppich darüberfällt
  '34:then the rug': {
    figuren: { luke_k: { position: ORT.kellerLuke, blick: 0 } },
    kamera: { ziel: 'keller.luke', pos: kw(0.2, 0.4, 0.6), fov: 48, rate: 0.08 },
    haupt: { art: 'licht', licht_art: 'aus', ziel: 'keller.lukenrand', wort: 'rug', dauer: 0.25 },
    hauptsache: 'keller.luke',
  },
  // "Above me, June lay down and" – Eli liegt auf dem Erdboden, über ihm die Lichtstreifen der Dielen
  '35': {
    figuren: { eli: { position: ORT.kellerEli, blick: 90, pose: 'liegen', pose_params: { kopf: 30 }, gesicht: 'besorgt' }, luke_k: { position: ORT.kellerLuke, blick: 0 } },
    kamera: { ziel: { anker: 'eli.kopf', versatz: [0.25, 0.05, 0] }, blick: { azimut: 200, hoehe: 16, abstand: 1.6 }, fov: 54, roll: ROLL_LIEGEN, rate: 0.08 },
    haupt: { art: 'kamera', wort: 'Above' },
    hauptsache: 'eli.kopf',
  },
  // "counted, like every night." – Kran von oben: June im Bett, die Augen zu, die Lippen zählen
  '35:counted': {
    figuren: { june: { position: ORT.juneBett, blick: 90, pose: 'liegen', gesicht: 'augen_zu' }, luke_tp: { position: ORT.luke, blick: 90 } },
    // von der Fußseite des Betts: Junes Gesicht steht aufrecht im Bild (Kopf-oben-Regel)
    kamera: { baustein: 'crane_down_tilt', ziel: 'june.kopf', blick: { azimut: 92, hoehe: 52, abstand: 1.7 }, hoehe: 0.85, rueck: 0.4, ankunft_wort: 'counted', fov: 54 },
    licht_anpassung: { belichtung: 0.74 },
    haupt: { art: 'gesicht', wer: 'june', name: 'zaehlt_a', wort: 'counted' },
    mund: { wer: 'june', art: 'zaehlen', wort: 'counted', versatz: 0.22, takt: 0.22 },
    hauptsache: 'june.kopf',
  },
  // "Ninety-seven." – June zählt mit geschlossenen Augen
  '36': {
    figuren: { june: { position: ORT.juneBett, blick: 90, pose: 'liegen', gesicht: 'zaehlt_a' } },
    // Review Teil 2: das Gesicht war gedreht und angeschnitten (75 % beige Fläche). Jetzt ganz und aufrecht
    kamera: { ziel: { anker: 'june.kopf', versatz: [0, 0.04, 0] }, blick: { azimut: 92, hoehe: 50, abstand: 1.85 }, fov: 38, rate: 0.07 },
    licht_anpassung: { belichtung: 0.74 },
    haupt: { art: 'gesicht', wer: 'june', name: 'zaehlt_b', wort: 'Ninety-seven' },
    mund: { wer: 'june', art: 'zaehlen', wort: 'Ninety-seven', versatz: 0.12, takt: 0.17 },
    hauptsache: 'june.kopf',
  },
  // "Ninety-eight." – Eli hört zu, die Lichtstreifen der Dielen über ihm
  '37': {
    figuren: { eli: { position: ORT.kellerEli, blick: 90, pose: 'liegen', pose_params: { kopf: 38 }, gesicht: 'neutral' } },
    licht_anpassung: { belichtung: 0.95 },
    kamera: { ziel: 'eli.kopf', blick: { azimut: 186, hoehe: 24, abstand: 0.95 }, fov: 46, roll: ROLL_LIEGEN, rate: 0.07 },
    haupt: { art: 'gesicht', wer: 'eli', name: 'besorgt', wort: 'Ninety-eight' },
    hauptsache: 'eli.kopf',
  },
  // "Ninety-nine." "Then she stopped." – ganz nah: June zählt, dann stehen die Lippen still,
  // weißer Atem steigt auf (kalt: es ist nah). Letztes Bild von June in Teil 2.
  '38': {
    figuren: { june: { position: ORT.juneBett, blick: 90, pose: 'liegen', gesicht: 'zaehlt_a' } },
    // steiler von oben: der Atem steigt zur Kamera und bleibt über den Lippen
    kamera: { ziel: { anker: 'june.kopf', versatz: [0, 0.06, 0] }, blick: { azimut: 92, hoehe: 60, abstand: 1.6 }, fov: 36, rate: 0.06 },
    licht_anpassung: { belichtung: 0.74 },
    haupt: { art: 'gesicht', wer: 'june', name: 'zaehlt_b', wort: 'Ninety-nine' },
    mund: { wer: 'june', art: 'zaehlen', wort: 'Ninety-nine', versatz: 0.1, takt: 0.13, bis: 'Then' },
    gesichter: [{ wer: 'june', name: 'augen_zu', wort: 'Then' }],
    // Review Teil 2: der Atem auf „stopped“ fehlte (Vorbereitung für Teil 3). Größer, heller, ab „she“,
    // damit die Wolke vor dem Schnitt etwa 0,6 s über den Lippen steht
    partikel: [{ art: 'atem', ort: 'june.mund', wort: 'she', periode: 1.0, richtung: [0, 1, 0], groesse: 0.022, deckkraft: 0.85, ort: { anker: 'june.mund', versatz: [0.13, 0.02, 0] } }],
    hauptsache: 'june.kopf',
  },
  // "The bell struck midnight." – Turmuhr und Glocke: die Zeiger springen auf zwölf, die Glocke schwingt
  '40': {
    uhr: '11:59',
    // Review Teil 2: Uhr UND die schwingende Glocke hinter der offenen Schallluke
    kamera: { pos: [0.7, 9.4, -46.5], ziel: [0, 12.4, -62.4], fov: 28, rate: 0.06, zusaetze: [{ baustein: 'shake', wort: 'struck', staerke: 0.8 }] },
    licht_anpassung: NACHT_HELL,
    haupt: { art: 'set', was: 'uhr', wort: 'midnight', zeit: '12:00' },
    set_ereignisse: [{ set: 'strasse', was: 'glocke', wort: 'struck' }],
    hauptsache: 'strasse.glocke',
  },
  // "No counting came from the square." – Kran über dem Platz: alle halten Abstand zum leeren Fleck
  '41': {
    figuren: {
      odell: { position: [-0.6, 0, -50.2], blick: 160, gesicht: 'streng' },
      nb_mantel: { position: [-2.8, 0, -48.9], blick: 150, gesicht: 'angst' }, nb_frau: { position: [0.6, 0, -47.9], blick: 172, gesicht: 'angst' },
      nb_alt: { position: [3.2, 0, -47.6], blick: 182, gesicht: 'besorgt' }, nb_ohren: { position: [5.7, 0, -48.6], blick: 200, gesicht: 'angst' },
      nb_passant: { position: [7.2, 0, -50.8], blick: 225, gesicht: 'ernst' }, nb_alt2: { position: [-4.0, 0, -51.4], blick: 120, gesicht: 'besorgt' },
      nb_jungfrau: { position: [1.8, 0, -46.4], blick: 178, gesicht: 'nervoes' },
    },
    kamera: { baustein: 'crane_down_tilt', ziel: [2.2, 0.6, -53.0], blick: { azimut: 4, hoehe: 26, abstand: 17.0 }, hoehe: 5.0, rueck: 2.0, ankunft_wort: 'square', fov: 50 },
    licht_anpassung: NACHT_HELL,
    haupt: { art: 'kamera', wort: 'square' },
    hauptsache: [2.5, 0.5, -54],
  },
  // "The boards above my face bent down." – Review Teil 2: von unten senkrecht sah man nur Holz und Licht.
  // Jetzt schräg von Elis Brust aus, fast längs der Fugen: die Lichtlinien laufen in die Tiefe, die Sohlen
  // liegen quer darüber, auf „bent“ sackt die Mitte sichtbar durch (10 cm, mehr als zwei Fugen), feiner
  // Staub rieselt im Lampenkegel
  '42': {
    figuren: MH(ORT.kellerMonster, 0),
    kamera: { pos: kw(0.25, 0.3, 0.45), ziel: kw(-0.48, 1.0, -0.15), fov: 54, rate: 0.07, zusaetze: [{ baustein: 'shake', wort: 'bent', staerke: 0.9 }] },
    set_ereignisse: [{ set: 'keller', was: 'fuesse', versatz: 0, dauer: 0.01, mitte: [-0.45, -0.45], drehung: 0 }],
    haupt: { art: 'set', set: 'keller', was: 'biegen', wort: 'bent', dauer: 0.4, params: { tiefe: 0.1, mitte: [-0.45, -0.1], radius: 0.75 } },
    partikel: [{ art: 'staub', ort: kw(-0.45, 0.85, -0.2), wort: 'bent', farbe: '#e8dcc8', anzahl: 160, groesse: 0.0045, bereich: [0.35, 0.25, 0.3], deckkraft: 0.7, dauer: 1.6 }],
    hauptsache: 'keller.dielen_mitte',
  },
  // "My breath turned white." – Elis Atem wird weiß im Lampenkegel, er presst die Hand auf den Mund
  '43': {
    figuren: { eli: { position: ORT.kellerEli, blick: 90, pose: 'liegen', pose_params: { kopf: 38 }, gesicht: 'angst' }, ...MH(ORT.kellerMonster, 0) },
    licht_anpassung: { belichtung: 0.95 },
    // Ziel auf die Augen: sonst lagen sie im Untertitel-Streifen (Review Teil 2, „TURNED“ am Auge)
    kamera: { ziel: { anker: 'eli.augen', versatz: [0, 0.02, 0] }, blick: { azimut: 192, hoehe: 22, abstand: 1.0 }, fov: 46, roll: ROLL_LIEGEN, rate: 0.07 },
    haupt: { wer: 'eli', was: 'mund_zuhalten', wort: 'white', params: { seite: 'r' } },
    // Eli liegt auf dem Rücken: der Atem steigt nach oben (sonst ginge er in Blickrichtung der Figur)
    partikel: [{ art: 'atem', ort: 'eli.mund', wort: 'breath', periode: 1.1, richtung: [0, 1, 0.15], groesse: 0.1, deckkraft: 0.85 }],
    hauptsache: 'eli.kopf',
  },
  // "Something finished her count," – Eli knipst die Taschenlampe aus, nur noch die Lichtstreifen
  '44': {
    figuren: { eli: { position: ORT.kellerEli, blick: 90, pose: 'liegen', pose_params: { kopf: 38 }, gesicht: 'angst' } },
    // ohne Taschenlampe nur Fugenlicht: etwas mehr Belichtung, damit das Gesicht unter den Streifen lesbar bleibt
    licht_anpassung: { belichtung: 1.5, hemi: { staerke: 1.3 } },
    kamera: { ziel: { anker: 'eli.kopf', versatz: [0, 0.03, 0] }, blick: { azimut: 172, hoehe: 22, abstand: 0.9 }, fov: 46, roll: ROLL_LIEGEN, rate: 0.06 },
    haupt: { art: 'licht', licht_art: 'aus', ziel: 'keller.lampe', wort: 'Something', versatz: 0.12, dauer: 0.12 },
    gesichter: [{ wer: 'eli', name: 'augen_zu', wort: 'count' }],
    hauptsache: 'eli.kopf',
  },
  // "slow and deep," – Junes Zimmer auf Bodenhöhe: lange weiße Füße auf dem Teppich, Tilt zum Mantelsaum
  '44:slow': {
    figuren: { ...MH([-18.75, SO, 2.05], -129), luke_tp: { position: ORT.luke, blick: 90 } },
    kamera: { baustein: 'tilt_up', von_ziel: { anker: 'mh.fuss', versatz: [0, 0.1, 0] }, ziel: { anker: 'mh.fuss', versatz: [0, 1.25, 0] }, pos: [-20.35, 0.75, 0.75], ankunft_wort: 'deep', kran: 0.3, fov: 52 },
    licht_anpassung: { belichtung: 1.3 },
    haupt: { art: 'kamera', wort: 'deep' },
    hauptsache: 'mh.knie',
  },
  // "One hundred." "Ready?" – Untersicht aus Elis Augen: die Sohlen liegen quer über den Lichtfugen. Review
  // Teil 2: Die Finger lagen längs der Fugen und lasen sich als Glimmen. Jetzt kommen auf „Ready?“ vier lange
  // Fingerschatten von oben QUER über vier, fünf Fugen, die Spitzen glimmen kalt, in 0,2 s spreizen sie
  // sich (Snap-Zoom). Kein Finger kommt durch (das bleibt für Teil 3). Harter Schnitt, PART 3.
  '45': {
    figuren: MH(ORT.kellerMonster, 0),
    kamera: { punkt: 'keller.pov', rate: 0.05, zusaetze: [{ baustein: 'snap_zoom', wort: 'Ready', faktor: 1.18, bilder: 2 }] },
    // auf „One“ wird es oben dunkel (es steht über der Lampe): dann ist der kalte Saum der Finger das Licht
    haupt: { art: 'licht', licht_art: 'dimmen', ziel: 'keller.oben', faktor: 0.5, wort: 'One', dauer: 0.4 },
    set_ereignisse: [
      { set: 'keller', was: 'fuesse', versatz: 0, dauer: 0.01, mitte: [-0.45, -0.45], drehung: 0 },
      { set: 'keller', was: 'finger', wort: 'Ready', versatz: -0.08, dauer: 0.28, von: [-0.33, 1.72], nach: [-0.33, 1.384], drehung: -90, skala: 1.2, spreizen: 14, spreiz_dauer: 0.2 },
    ],
    hauptsache: 'keller.dielen_mitte',
  },
};
