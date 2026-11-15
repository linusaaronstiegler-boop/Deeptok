// Regie für „Hiding Night“, Teil 1: WIE jede Einstellung gezeigt wird.
// WAS sie zeigt und WO geschnitten wird, steht in bildideen.json (Satz + Teilbilder "ab_wort").
// Der Compiler engine/shotliste.mjs setzt beides mit den Wortzeiten aus timing.json zusammen.
//
// Je Einstellung (Schlüssel "<satz>" oder "<satz>:<ab_wort>"):
//   figuren   sichtbare Figuren mit Stellung am Schnitt (Position in Metern, Blick in Grad); alle anderen
//             blendet der Compiler aus. Jede Stellung ist ein Neuanfang: frühere Posen gelten nicht mehr.
//   kamera    Kamera-Baustein (engine/README.md Abschnitt 5). Zeiten als Wörter: ankunft_wort, zeit_wort,
//             vordergrund.wort, zusaetze[].wort. Ohne Angabe: Push-in 7 %/s.
//   haupt     GENAU EINE Hauptaktion, beginnt auf ihrem Wort (anker "ende": endet dort):
//             { wer, was, wort, dauer?, params? } | { art: 'gesicht' | 'licht' | 'set' | 'partikel' | 'kamera', … }
//   neben     Nebenbewegungen (zählen nicht als Hauptaktion)
//   gesichter Reaktionsgesichter auf ihrem Wort; mund: Mundformen bei wörtlicher Rede oder stummem Zählen
//   hauptsache Anker, der im mittleren Drittel liegen muss (Kompositionsprüfung im Kontaktbogen)
//
// Koordinaten: 1 m, y oben. Straße entlang z (Platz im Norden bei z < −42, Nebel im Süden bei z > 44),
// Hausfronten bei x = ±12. Figuren schauen bei blick 0 nach +z; ihre linke Seite liegt dann bei +x.
// Kamera-blick: azimut 0 = Kamera auf der +z-Seite des Ziels, hoehe = Erhebung in Grad.

// Marsh-Haus-System -> Welt (wie src/bauteile.js marshWelt): Haus bei x = −12, Front zeigt zur Straße (+x)
const mw = (x, y, z) => [-12 + z, y, -x];
const SO = 0.6, OG = 3.8; // Sockel (Erdgeschossboden) und Boden des Obergeschosses im Marsh-Haus

// Feste Orte (aus den Sets, siehe engine/README.md 15.5)
const ORT = {
  monsterPlatz: [2.5, 0, -54],          // Mister Hundred am Platzende vor der Kirche
  odell: [1.2, 0, -57.6],               // Mr. Odell vor den Kirchenstufen
  monsterHaus: [9.3, 0, 3.0],           // Mister Hundred vor Haus o3 (obere Fenster bei x = 12, z ≈ 4,2)
  fensterO3: [12, 5.1, 4.15],
  eliFenster: [-12.75, OG, 2.6],        // Eli innen am Fenster (schaut hinaus: blick 90)
  monsterGarten: [-8.0, 0, 2.6],        // Mister Hundred im Vorgarten vor Elis Fenster
  luke: [-19.25, SO, 2.0],              // Requisite Bodenluke in Junes Zimmer (blick 90)
  lukeMitte: [-18.8, SO, 2.0],
  pikeEinfahrt: [8.6, 0, -12.6],
};

export const titel = 'Hiding Night – Teil 1';
export const seed = 2611;
export const monster = ['mh'];
export const nachlauf = 0.14;   // Bild bleibt nach dem letzten Wort noch 0,14 s (Ende der Stimme), dann Endkarte

// belichtung 1.08 (Review Folge 1): hebt alle Einstellungen leicht an; Ziel Bild-Median ≥ 85 von 255 (pruefen.py)
export const look = { licht: 'nacht', belichtung: 1.08, bloom: { staerke: 0.55, radius: 0.55, schwelle: 1.0 }, vignette: 0.32, korn: 0.025, toene: 'aces' };

export const sets = [
  // licht_an 0.8: mehr warme Fenster als Akzente in der Nacht (Review Folge 1, Std 0.55)
  { id: 'strasse', modul: 'hauptstrasse', params: { uhr: { zeit: '11:59', spruenge: [] }, licht_an: 0.8 } },
  { id: 'marsh', modul: 'marsh_haus' },
  { id: 'haus', modul: 'marsh_innen', params: { kuchen: true, luke: 'figur', taschenlampe: true } },
  { id: 'karte', modul: 'endkarte', position: [0, 0, -400] },  // weit weg: in ihrer Einstellung allein
];

// Alle Figuren der Folge (nur Erwachsene, Inhaltsregeln A7). Sichtbar nur, wo eine Einstellung sie stellt.
export const figuren = [
  { id: 'eli', modul: 'eli', gesicht: 'neutral' },
  { id: 'june', modul: 'june', gesicht: 'neutral' },
  { id: 'june18', modul: 'june', params: { rueckblende: true }, gesicht: 'neutral' },  // June mit 18 (Rückblende)
  { id: 'dad', modul: 'dad', gesicht: 'entschlossen' },
  { id: 'owen', modul: 'owen', gesicht: 'entschlossen' },
  { id: 'odell', modul: 'odell', gesicht: 'streng' },
  { id: 'mh', modul: 'mister_hundred', gesicht: 'glatt', blinzeln: false },
  { id: 'nb_ohren', modul: 'nachbar', params: { variante: 'muetze', alter: 'mittel' }, gesicht: 'angst' },
  { id: 'nb_mantel', modul: 'nachbar', params: { variante: 'brille', alter: 'mittel', kleidung: 'mantel' }, gesicht: 'besorgt' },
  { id: 'nb_frau', modul: 'nachbar', params: { variante: 'kopftuch', alter: 'mittel' }, gesicht: 'angst' },
  { id: 'nb_jung', modul: 'nachbar', params: { variante: 'muetze', alter: 'jung', farbe: '#5E6B3A' }, gesicht: 'grinsen' },
  { id: 'nb_jungfrau', modul: 'nachbar', params: { variante: 'brille', alter: 'jung', farbe: '#7A3B36' }, gesicht: 'nervoes' },
  { id: 'nb_alt', modul: 'nachbar', params: { variante: 'kopftuch', alter: 'alt' }, gesicht: 'besorgt' },
  { id: 'nb_passant', modul: 'nachbar', params: { variante: 'glatze', alter: 'mittel' }, gesicht: 'neutral' },
  // Requisiten (als Figuren, damit die Episode sie stellt und bewegt)
  { id: 'pk', modul: 'pickup', params: { scheinwerfer: true } },
  { id: 'pk2', modul: 'pickup', params: { stiefel: true, scheinwerfer: true } },
  { id: 'sp_strasse', modul: 'schuhpaar', params: { art: 'grau' } },
  { id: 'sp_v1', modul: 'schuhpaar', params: { art: 'nachbar' } },
  { id: 'sp_v2', modul: 'schuhpaar', params: { art: 'grau' } },
  { id: 'sp_dad', modul: 'schuhpaar', params: { art: 'dad' } },
  { id: 'sp_eli_a', modul: 'schuhpaar', params: { art: 'eli' } },
  { id: 'sp_eli_b', modul: 'schuhpaar', params: { art: 'eli', ordnung: 'schief' } },
  { id: 'luke_rb', modul: 'luke', params: { teppich: false } },  // Rückblende: Luke ohne Teppich
  { id: 'luke_tp', modul: 'luke', params: { teppich: true } },   // heute: Teppich über der Luke
];

// Lichtkipp nach „My breath turned white“ (serie.md, Review Folge 1): dunkleres Abendrot, hartes
// Gegenlicht der tiefen Sonne, kaltes blaues Füll- und Kantenlicht, mehr Kontrast.
const KALT = {
  himmel: { zenit: '#161b44', horizont: '#c45a52' },
  nebel: { farbe: '#5a4f7e', dichte: 0.012 },
  hemi: { himmel: '#8790dc', boden: '#2e2a44', staerke: 1.9 },
  haupt: { farbe: '#ff9466', staerke: 3.2 },
  kante: { farbe: '#7f9cff', staerke: 1.3 },
  grade: { saettigung: 1.08, kontrast: 1.14, faerbung: [0.95, 0.98, 1.1] },
  belichtung: 1.15,
};

// Kurzformen für Stellungen
const MH = (position, blick, mehr = {}) => ({ mh: { position, blick, gesicht: 'glatt', ...mehr } });

export const endkarte = { dauer: 1.0, kamera: { punkt: 'karte.karte', rate: 0.07 }, hauptsache: 'karte.mitte', text: 'PART 2' };

export const einstellungen = {
  // ───────── Hook (0–4,8 s): ab Bild 1 Bewegung auf das Monster ─────────
  // "In this town, when you turn" – Mister Hundred groß und vom Mond angestrahlt vor Uhrturm und Mond,
  // Untersicht, Push-in 12 %/s. Review Folge 1: Das erste Bild war dunkel, das Monster nur 25 % hoch und
  // Eli ein schwarzer Klumpen im Vordergrund. Jetzt ≈ 60 % der Bildhöhe, die Hände klar vor dem Gesicht.
  '1': {
    figuren: MH(ORT.monsterPlatz, 0),
    kamera: { ziel: { anker: 'mh.haende', versatz: [0, -1.3, 0] }, pos: [1.2, 1.4, -43.2], fov: 48, rate: 0.12 },
    licht_anpassung: { haupt: { richtung: [-0.3, 0.55, 0.78], staerke: 3.2 }, kante: { staerke: 2.0 } },
    haupt: { art: 'kamera', wort: 'town' },
    hauptsache: 'mh.haende',
  },
  // "eighteen," – Zahlenkerzen 1 und 8 auf dem Kuchen (kurz: 0,8 s, schneller Push)
  '1:eighteen': {
    kamera: { punkt: 'haus.kueche_detail', rate: 0.12 },
    lampen_einzeln: { 'haus.kueche_lampe': false },
    licht_anpassung: { belichtung: 0.85 },
    haupt: { art: 'kamera', wort: 'eighteen' },
    hauptsache: 'haus.kuchen',
  },
  // "you hide until sunrise," – Eli duckt sich hinter das Verandageländer; Pfosten wischt durchs Bild
  '1:you hide': {
    figuren: { eli: { position: mw(3.4, SO, 1.75), blick: 90, gesicht: 'angst' } },
    kamera: { baustein: 'truck_side', ziel: { anker: 'eli.kopf', versatz: [0, -0.35, 0] }, pos: [-7.5, 1.15, -2.9], fov: 44, richtung: 'links', mitschwenken: true, strecke: 1.8, vordergrund: false },
    haupt: { wer: 'eli', was: 'ducken', wort: 'hide', params: { tiefe: 0.75, arme: 'kopf' } },
    hauptsache: 'eli.kopf',
  },
  // "or it finds you." – Kopf hinter den Händen dreht sich zur Kamera, Wackeln auf "it"
  '1:or': {
    figuren: MH(ORT.monsterPlatz, 0),
    kamera: { ziel: 'mh.haende', blick: { azimut: 16, hoehe: -32, abstand: 4.4 }, fov: 52, zusaetze: [{ baustein: 'shake', wort: 'it', staerke: 1 }] },
    neben: [{ wer: 'mh', was: 'kopf_drehen', ab: 'start', dauer: 0.03, params: { winkel: 50 } }],
    haupt: { wer: 'mh', was: 'kopf_drehen', wort: 'it', dauer: 0.3, ease: 'ease_in', params: { zu: 'kamera' } },
    hauptsache: 'mh.haende',
  },

  // ───────── Monster und Ritual ─────────
  // "We call it Mister Hundred." – Tilt von den Füßen zu den Händen, Ankunft auf "Hundred"
  '2': {
    figuren: MH(ORT.monsterPlatz, 0),
    kamera: { baustein: 'tilt_up', von_ziel: 'mh.fuss', ziel: 'mh.haende', pos: [0.6, 0.6, -46.6], ankunft_wort: 'Hundred', kran: 1.2, fov: 58 },
    haupt: { art: 'kamera', wort: 'Hundred' },
    hauptsache: 'mh.haende',
  },
  // "It's tall enough to look in upstairs windows," – neben Haus o3, Kopf auf Höhe der oberen Fenster
  '3': {
    figuren: MH(ORT.monsterHaus, 0),
    kamera: { baustein: 'dolly_out', ziel: { anker: 'mh.brust', versatz: [0.5, 0.6, 0] }, pos: [2.4, 1.6, 10.2], fov: 52, rate: -0.07 },
    licht_anpassung: { hemi: { staerke: 2.9 }, kante: { staerke: 1.6 }, belichtung: 1.8 },
    haupt: { wer: 'mh', was: 'kopf_drehen', wort: 'upstairs', dauer: 0.5, ease: 'ease_in', params: { zu: ORT.fensterO3 } },
    hauptsache: 'mh.kopf',
  },
  // "and it keeps both hands over its face." – Untersicht, die Finger schließen sich fester
  '3:and': {
    figuren: MH(ORT.monsterHaus, 0),
    kamera: { ziel: 'mh.haende', blick: { azimut: 18, hoehe: -24, abstand: 4.4 }, fov: 46 },
    haupt: { wer: 'mh', was: 'finger_schliessen', wort: 'hands' },
    hauptsache: 'mh.haende',
  },
  // "It never peeks." – Großaufnahme der geschlossenen Finger, Snap-Zoom auf "peeks"
  '4': {
    figuren: MH(ORT.monsterHaus, 0, { pose: 'finger_schliessen' }),
    kamera: { baustein: 'snap_zoom', ziel: 'mh.haende', blick: { azimut: 4, hoehe: -6, abstand: 2.0 }, fov: 40, zeit_wort: 'peeks', faktor: 1.18, bilder: 2 },
    haupt: { art: 'kamera', wort: 'peeks' },
    hauptsache: 'mh.haende',
  },
  // "At midnight," – die Zeiger der Turmuhr springen auf zwölf
  '5': {
    kamera: { punkt: 'strasse.platz_detail', rate: 0.1 },
    haupt: { art: 'set', was: 'uhr', wort: 'midnight', zeit: '12:00' },
    hauptsache: 'strasse.kirche_uhr',
  },
  // "it counts to one hundred," – Mister Hundred zählt, kaltes Licht durch die Fingerspalten
  '5:it counts': {
    figuren: MH(ORT.monsterPlatz, 0),
    kamera: { ziel: { anker: 'mh.brust', versatz: [0, 0.6, 0] }, pos: [-6.0, 1.3, -44.0], fov: 48 },
    licht_anpassung: { haupt: { richtung: [-0.45, 0.55, 0.7], staerke: 3.0 }, belichtung: 1.85 },
    haupt: { wer: 'mh', was: 'zaehlen', wort: 'counts', dauer: 1.3, params: { takt: 0.5 } },
    hauptsache: 'mh.haende',
  },
  // "slow and deep," – ein Nachbar auf seiner Veranda presst sich die Hände auf die Ohren
  '5:slow': {
    figuren: { nb_ohren: { position: [-10.7, SO, 15.2], blick: 90, gesicht: 'angst' } },
    kamera: { ziel: { anker: 'nb_ohren.kopf', versatz: [0, -0.22, 0] }, blick: { azimut: 118, hoehe: 4, abstand: 2.6 }, fov: 40 },
    haupt: { wer: 'nb_ohren', was: 'ohren_zuhalten', wort: 'deep' },
    hauptsache: 'nb_ohren.kopf',
  },
  // "and the whole town hears it." – Seitenfahrt, die oberen Fenster gehen nacheinander aus
  '5:and the whole': {
    kamera: { baustein: 'truck_side', pos: [-2.5, 1.8, 15.0], ziel: [11, 4.6, -5], fov: 48, richtung: 'rechts', strecke: 2.4, vordergrund: false },
    haupt: { art: 'licht', licht_art: 'aus', ziele: ['strasse.fenster_o3_oben', 'strasse.fenster_pike_oben', 'strasse.fenster_o2_oben', 'strasse.fenster_o1_oben'], versatz_ziele: 0.25, dauer: 0.3, wort: 'hears', vorlauf: 0.4 },
  },
  // "Your breath turns white when it's close." – Elis Atem wird weiß, Hand vor den Mund
  '6': {
    figuren: { eli: { position: [-7.4, 0, 3.6], blick: 90, gesicht: 'nervoes' } },
    kamera: { ziel: { anker: 'eli.kopf', versatz: [0, -0.1, 0] }, blick: { azimut: 112, hoehe: 3, abstand: 2.4 }, fov: 40 },
    haupt: { wer: 'eli', was: 'mund_zuhalten', wort: 'white' },
    gesichter: [{ wer: 'eli', name: 'angst', wort: 'close' }],
    partikel: [{ art: 'atem', ort: 'eli.mund', wort: 'breath', periode: 1.4, groesse: 0.1, deckkraft: 0.75 }],
    hauptsache: 'eli.kopf',
  },
  // "When it finds you," – aus dem Versteck unter einer Veranda: die Füße bleiben mitten im Schritt stehen
  '7': {
    figuren: MH([7.9, 0, 27.0], 180),
    // Review Folge 1: Unter der Veranda stand ein schwarzer Pfosten vor der Linse; jetzt flach im Vorgarten
    kamera: { pos: [6.9, 0.3, 20.8], ziel: { anker: 'mh.fuss', versatz: [0, 0.45, 0] }, fov: 58, rate: 0.06 },
    haupt: { wer: 'mh', was: 'stapfen', wort: 'finds', anker: 'ende', dauer: 1.8, params: { nach: [7.9, 24.0], schritt: 0.9, halt_im_schritt: true } },
    hauptsache: 'mh.fuss',
  },
  // "it bends down" – seitlich: beugt sich in einer gleichmäßigen Bewegung herab
  '7:it bends': {
    figuren: MH([7.9, 0, 24.0], 180),
    kamera: { ziel: { anker: 'mh.huefte', versatz: [0, 1.0, -1.8] }, blick: { azimut: 272, hoehe: 6, abstand: 12.5 }, fov: 50, rate: 0.04 },
    haupt: { wer: 'mh', was: 'vorbeugen', wort: 'bends', dauer: 0.8, params: { winkel: 65 } },
    hauptsache: 'mh.kopf',
  },
  // "takes its hands away from its face." – von schräg vorn unten auf die Hände: Sie lösen sich ein
  // Stück vom Gesicht, kaltes Licht bricht dazwischen hervor; harter Schnitt, bevor man ein Gesicht sieht.
  // Review Folge 1: Von hinten war die Schlüsselaktion im Dunkeln kaum zu sehen, der Kopf las sich als Karton.
  '7:takes': {
    figuren: MH([7.9, 0, 24.0], 180, { pose: 'vorbeugen', pose_params: { winkel: 65 } }),
    kamera: { ziel: 'mh.haende', blick: { azimut: 152, hoehe: -18, abstand: 3.6, bezug: 'mh.haende' }, fov: 52 },
    haupt: { wer: 'mh', was: 'haende_weg', wort: 'away', dauer: 0.5, params: { staerke: 0.3 } },
    neben: [{ wer: 'mh', was: 'leuchten', wort: 'away', dauer: 0.4, params: { staerke: 1.8 } }],
    hauptsache: 'mh.haende',
  },
  // "In the morning, all that's left are your" – Kranabstieg über der leeren Straße, Schuhe klein in der Mitte
  '8': {
    figuren: { sp_strasse: { position: [0.4, 0.02, 12.0], blick: 0 } },
    kamera: { baustein: 'crane_down_tilt', ziel: 'sp_strasse.mitte', pos: [1.2, 2.6, 21.0], hoehe: 9, rueck: 3, ankunft_wort: 'left', fov: 48 },
    licht_anpassung: { belichtung: 1.25 },
    haupt: { art: 'kamera', wort: 'left' },
    hauptsache: 'sp_strasse.mitte',
  },
  // "shoes, side by side." – die Schuhe, exakt nebeneinander, Spitzen zur Kamera
  '8:shoes': {
    figuren: { sp_strasse: { position: [0.4, 0.02, 12.0], blick: 0 } },
    kamera: { ziel: 'sp_strasse.mitte', blick: { azimut: 38, hoehe: 22, abstand: 1.25 }, fov: 36 },
    licht_anpassung: { belichtung: 1.45 },
    haupt: { art: 'kamera', wort: 'shoes' },
    hauptsache: 'sp_strasse.mitte',
  },

  // ───────── Das System der Stadt ─────────
  // "The town calls it Hiding Night." – Platz bei Tag von oben, Leute gehen, Mr. Odell vor der Kirche
  '9': {
    uhr: '10:20',
    figuren: {
      odell: { position: ORT.odell, blick: 0, gesicht: 'streng' },
      nb_passant: { position: [-6.5, 0, -53.0], blick: 90, gesicht: 'neutral' },
      nb_alt: { position: [6.5, 0, -52.0], blick: -100, gesicht: 'neutral' },
    },
    kamera: { pos: [-5.5, 8.5, -38], ziel: [0.4, 2.5, -56.5], fov: 50 },
    neben: [
      { wer: 'nb_passant', was: 'gehen', ab: 'start', dauer: 2.0, ease: 'linear', params: { nach: [-2.5, -53.0] } },
      { wer: 'nb_alt', was: 'gehen', ab: 'start', dauer: 2.0, ease: 'linear', params: { nach: [3.6, -52.6] } },
    ],
    haupt: { wer: 'odell', was: 'kopf_drehen', wort: 'Hiding', dauer: 0.3, params: { zu: 'kamera' } },
    hauptsache: 'odell.kopf',
  },
  // "There's only one rule." – Mr. Odell hebt einen Finger
  '10': {
    uhr: '10:20',
    figuren: { odell: { position: ORT.odell, blick: 0, gesicht: 'streng' } },
    kamera: { ziel: { anker: 'odell.kopf', versatz: [-0.1, -0.3, 0] }, blick: { azimut: -24, hoehe: 4, abstand: 2.9 }, fov: 40 },
    haupt: { wer: 'odell', was: 'geste', wort: 'one', params: { art: 'finger_heben' } },
    hauptsache: 'odell.kopf',
  },
  // "Nobody can help you hide." – ein Nachbar will einer jungen Frau seinen Mantel umlegen, Odell packt seinen Arm
  '11': {
    uhr: '10:20',
    figuren: {
      nb_mantel: { position: [-0.75, 0, -50.4], blick: 80, gesicht: 'besorgt' },
      nb_jungfrau: { position: [0.05, 0, -50.6], blick: -100, gesicht: 'nervoes' },
      odell: { position: [-1.25, 0, -49.75], blick: 125, gesicht: 'streng' },
    },
    kamera: { baustein: 'truck_side', ziel: [-0.6, 1.35, -50.2], blick: { azimut: 32, hoehe: 5, abstand: 4.6 }, fov: 46, richtung: 'rechts', mitschwenken: true, strecke: 1.8, vordergrund: false },
    neben: [{ wer: 'nb_mantel', was: 'arm_heben', ab: 'start', dauer: 0.35, params: { seite: 'r', vorn: 70, seitlich: 20 } }],
    haupt: { wer: 'odell', was: 'greifen', wort: 'help', params: { zu: 'nb_mantel.hand_r', seite: 'r' } },
    hauptsache: 'nb_mantel.kopf',
  },
  // "If they try," – nachts: eine Frau zieht einen jungen Mann an der Hand zu ihrer Haustür
  '12': {
    figuren: {
      nb_frau: { position: [-10.15, SO, -19.1], blick: 90, gesicht: 'angst' },
      nb_jung: { position: [-8.9, 0, -18.55], blick: -114, gesicht: 'angst' },
    },
    kamera: { ziel: [-9.5, 1.45, -18.9], pos: [-6.6, 1.6, -20.0], fov: 46 },
    licht_anpassung: { hemi: { staerke: 2.8 }, belichtung: 1.75 },
    neben: [{ wer: 'nb_jung', was: 'arm_heben', ab: 'start', dauer: 0.3, params: { seite: 'r', vorn: 55 } }],
    haupt: { wer: 'nb_frau', was: 'greifen', wort: 'try', params: { zu: 'nb_jung.hand_r', seite: 'r' } },
    hauptsache: 'nb_frau.hand_r',
  },
  // "it takes them too." – am Morgen stehen auf derselben Veranda zwei Paar Schuhe nebeneinander
  '12:it takes': {
    figuren: {
      sp_v1: { position: [-11.25, SO, -18.82], blick: 90 },
      sp_v2: { position: [-11.25, SO, -19.28], blick: 90 },
    },
    kamera: { baustein: 'snap_zoom', ziel: [-11.2, 0.7, -19.05], blick: { azimut: 108, hoehe: 26, abstand: 2.4 }, fov: 40, zeit_wort: 'too', faktor: 1.18, bilder: 2 },
    haupt: { art: 'kamera', wort: 'too' },
    hauptsache: [-11.25, 0.65, -19.05],
  },
  // "You can't run, either." – die Straße endet an Schranke und Schild in einer Nebelwand vor den Kiefern;
  // ein junger Mann rennt darauf zu und bleibt an der Schranke stehen (Review Folge 1: vorher leere Straße)
  '13': {
    figuren: { nb_jung: { position: [1.1, 0, 58.6], blick: -6, gesicht: 'angst' } },
    kamera: { pos: [1.6, 1.7, 51.5], ziel: [0.3, 1.5, 64], fov: 44, rate: 0.08 },
    haupt: { wer: 'nb_jung', was: 'rennen', wort: 'run', anker: 'ende', dauer: 0.36, params: { nach: [0.6, 62.4] } },
    hauptsache: 'nb_jung.kopf',
  },
  // "On his eighteenth birthday, Owen Pike" – Rückblende: Owen an seinem Pick-up, Blick trotzig in die Kamera
  '14': {
    figuren: {
      owen: { position: [7.6, 0, -11.25], blick: -90, gesicht: 'entschlossen' },
      pk: { position: ORT.pikeEinfahrt, blick: -90 },
    },
    kamera: { ziel: { anker: 'owen.kopf', versatz: [0, -0.1, 0] }, blick: { azimut: -68, hoehe: 4, abstand: 2.8 }, fov: 42 },
    licht_anpassung: { belichtung: 1.8 },
    neben: [{ wer: 'owen', was: 'kopf_drehen', ab: 'start', dauer: 0.03, params: { winkel: -65 } }],
    haupt: { wer: 'owen', was: 'kopf_drehen', wort: 'Owen', dauer: 0.25, params: { zu: 'kamera' } },
    hauptsache: 'owen.kopf',
  },
  // "drove all night." – Folgefahrt hinter dem Pick-up, der auf den Nebel zufährt
  '14:drove': {
    figuren: { pk: { position: [1.8, 0, -8.0], blick: 0 } },
    kamera: { baustein: 'track_follow', folge: 'pk.mitte', versatz: [0.6, 2.5, -8.0], ziel_versatz: [0, 0.3, 1.2], fov: 50 },
    haupt: { wer: 'pk', was: 'fahren', wort: 'drove', dauer: 3.0, ease: 'ease_in', params: { nach: [1.8, 40] } },
    hauptsache: 'pk.mitte',
  },
  // "At sunrise," – die Sonne steigt über den Kiefern am Straßenende auf
  '15': {
    kamera: { pos: [0.6, 1.6, 34], ziel: [0, 4.5, 75], fov: 50, rate: 0.08 },
    haupt: { art: 'kamera', wort: 'sunrise' },
  },
  // "his truck was back in front of his house," – der Pick-up steht wieder in der Einfahrt, die Fahrertür schwingt auf
  '15:his truck': {
    figuren: { pk2: { position: ORT.pikeEinfahrt, blick: -90, pose: 'tuer_auf', pose_params: { winkel: 25 } } },
    kamera: { ziel: { anker: 'pk2.mitte', versatz: [0, 0.3, 0.4] }, pos: [3.4, 1.3, -7.8], fov: 46 },
    licht_anpassung: { belichtung: 1.25 },
    haupt: { wer: 'pk2', was: 'tuer_auf', wort: 'back', dauer: 0.9, params: { winkel: 62 } },
    partikel: [{ art: 'atem', ort: 'pk2.auspuff', periode: 0.7, richtung: [1, 0.15, 0], groesse: 0.12, deckkraft: 0.6 }],
    hauptsache: 'pk2.mitte',
  },
  // "engine running," – der Auspuff stößt weißen Dampf aus
  '15:engine': {
    figuren: { pk2: { position: ORT.pikeEinfahrt, blick: -90, pose: 'tuer_auf', pose_params: { winkel: 62 } } },
    // Review Folge 1: fast schwarz, nur ein Wölkchen. Jetzt halbtotal von der Straße: Scheinwerfer an,
    // weißer Dampf steigt hinter dem Führerhaus auf (das Heck steht vor der Hauswand).
    kamera: { pos: [3.7, 1.0, -10.9], ziel: [8.4, 1.6, -12.6], fov: 46, rate: 0.08 },
    haupt: { art: 'partikel', partikel_art: 'atem', ort: 'pk2.auspuff', wort: 'engine', periode: 0.5, richtung: [0.2, 1, 0], groesse: 0.32, deckkraft: 0.85, dauer: 1.0 },
    hauptsache: 'pk2.mitte',
  },
  // "His shoes were on the seat, side by side." – durch die offene Fahrertür: Owens Stiefel auf dem Sitz
  '16': {
    figuren: { pk2: { position: ORT.pikeEinfahrt, blick: -90, pose: 'tuer_auf', pose_params: { winkel: 62 } } },
    kamera: { ziel: 'pk2.sitz', blick: { azimut: 10, hoehe: 30, abstand: 1.35 }, fov: 42 },
    licht_anpassung: { belichtung: 1.55, hemi: { staerke: 2.8 }, haupt: { staerke: 3.0 } },
    tiefe: { fokus: 'pk2.sitz', staerke: 0.5 },
    haupt: { art: 'kamera', wort: 'shoes' },
    hauptsache: 'pk2.sitz',
  },
  // "Nobody here plays hide and seek," – ein junger Mann hält sich zum Spaß die Hände vors Gesicht
  '17': {
    uhr: '10:20',
    figuren: {
      nb_jung: { position: [1.0, 0, -49.0], blick: 10, gesicht: 'grinsen' },
      nb_alt: { position: [2.3, 0, -48.4], blick: -70, gesicht: 'besorgt' },
    },
    kamera: { baustein: 'truck_side', ziel: { anker: 'nb_jung.kopf', versatz: [0.15, -0.2, 0] }, blick: { azimut: 18, hoehe: 4, abstand: 3.3 }, fov: 42, richtung: 'links', mitschwenken: true, strecke: 1.8, vordergrund: false },
    haupt: { wer: 'nb_jung', was: 'augen_zuhalten', wort: 'hide' },
    hauptsache: 'nb_jung.kopf',
  },
  // "not even for fun." – eine ältere Frau reißt ihm die Hände herunter
  '17:not': {
    uhr: '10:20',
    figuren: {
      nb_jung: { position: [1.0, 0, -49.0], blick: 10, gesicht: 'grinsen', pose: 'augen_zuhalten' },
      nb_alt: { position: [2.05, 0, -49.6], blick: -95, gesicht: 'besorgt' },
    },
    kamera: { ziel: { anker: 'nb_jung.kopf', versatz: [0.12, -0.25, -0.1] }, blick: { azimut: -8, hoehe: 4, abstand: 3.2 }, fov: 44 },
    haupt: { wer: 'nb_alt', was: 'greifen', wort: 'fun', params: { zu: 'nb_jung.hand_l', seite: 'r', form: 'faust' } },
    neben: [
      { wer: 'nb_jung', was: 'arme_senken', wort: 'fun', versatz: 0.12, dauer: 0.3 },
      { wer: 'nb_jung', was: 'gesicht', wort: 'fun', versatz: 0.12, params: { name: 'schock' } },
    ],
    hauptsache: 'nb_jung.kopf',
  },
  // "Nobody leaves their shoes" – Eli kickt seine Turnschuhe schief in den Schuhhaufen
  '18': {
    figuren: {
      eli: { position: [-13.75, SO, -2.0], blick: 133, gesicht: 'entschlossen' },
      sp_eli_a: { position: [-13.49, SO, -2.24], blick: 133 },
      sp_eli_b: { position: [-13.2, SO, -2.55], blick: 60, sichtbar: false },
    },
    kamera: { ziel: { anker: 'sp_eli_a.mitte', versatz: [-0.05, 0.1, 0.05] }, blick: { azimut: 150, hoehe: 38, abstand: 1.8 }, fov: 52 },
    licht_anpassung: { belichtung: 1.25 },
    haupt: { wer: 'eli', was: 'kicken', wort: 'leaves', params: { seite: 'r' } },
    neben: [
      { wer: 'sp_eli_a', was: 'sichtbar', wort: 'leaves', versatz: 0.15, params: { wert: false } },
      { wer: 'sp_eli_b', was: 'sichtbar', wort: 'leaves', versatz: 0.15, params: { wert: true } },
    ],
    hauptsache: 'sp_eli_a.mitte',
  },
  // "side by side." – der Schuhhaufen von oben: kein Paar steht nebeneinander
  '18:side': {
    figuren: { sp_eli_b: { position: [-13.2, SO, -2.55], blick: 60 } },
    kamera: { ziel: 'sp_eli_b.mitte', blick: { azimut: 60, hoehe: 52, abstand: 1.4 }, fov: 42 },
    haupt: { art: 'kamera', wort: 'side' },
    hauptsache: 'sp_eli_b.mitte',
  },
  // "And nobody ever says the word ready." – Mr. Odell legt den Finger auf die Lippen
  '19': {
    uhr: '10:20',
    figuren: { odell: { position: ORT.odell, blick: 0, gesicht: 'warnend' } },
    // Augen bei y ≈ 700, Mund ≈ 950: Untertitel (y 1150–1300) verdeckt weder Mund noch Finger (Review Folge 1)
    kamera: { ziel: { anker: 'odell.kopf', versatz: [0, -0.22, 0] }, blick: { azimut: 12, hoehe: 2, abstand: 2.2 }, fov: 38 },
    haupt: { wer: 'odell', was: 'geste', wort: 'ready', anker: 'ende', dauer: 0.3, params: { art: 'finger_auf_lippen' } },
    hauptsache: 'odell.kopf',
  },
  // "That's what it asks when it's done counting." – nachts, Untersicht, Bogenfahrt: der Kopf neigt sich fragend
  '20': {
    figuren: MH(ORT.monsterPlatz, 0),
    kamera: { baustein: 'orbit', ziel: 'mh.haende', blick: { azimut: -28, hoehe: -22, abstand: 6.6 }, grad_pro_s: 20, fov: 50 },
    // Review Folge 1: zwei Laternen mit Bloom unten rechts lasen sich wie Augen; hier aus
    licht_anpassung: { belichtung: 1.85 },
    lampen_einzeln: { 'strasse.laterne_platz': false, 'strasse.platz_2': false, 'strasse.platz_3': false, 'strasse.platz_4': false, 'strasse.platz_5': false, 'strasse.platz_6': false },
    haupt: { wer: 'mh', was: 'kopf_schief', wort: 'asks' },
    hauptsache: 'mh.haende',
  },

  // ───────── Persönlich: Eli und June ─────────
  // "On Friday, I turned eighteen." – Eli bläst die Kerzen aus, Rauchfäden steigen auf
  '21': {
    figuren: { eli: { position: [-13.65, SO, 2.6], blick: -90, pose: 'sitzen', gesicht: 'neutral' } },
    kamera: { ziel: [-14.05, 1.58, 2.6], blick: { azimut: -60, hoehe: 12, abstand: 2.7 }, fov: 58 },
    neben: [{ wer: 'eli', was: 'vorbeugen', wort: 'turned', versatz: -0.3, dauer: 0.35, params: { winkel: 16, kopf_ausgleich: 10 } }],
    haupt: { art: 'licht', licht_art: 'aus', ziel: 'haus.kerzen', wort: 'turned', dauer: 0.3 },
    partikel: [{ art: 'staub', ort: 'haus.kuchen', wort: 'eighteen', farbe: '#d8d8d8', anzahl: 24, groesse: 0.035, bereich: [0.25, 0.7, 0.25], deckkraft: 0.55 }],
    hauptsache: ['eli.kopf', 'haus.kuchen'],
  },
  // "My sister June is" – June dreht sich am Herd um und lächelt
  '22': {
    // Review Folge 1: Die Kamera stand im Hängeschrank (grüner Block über 35 % des Bildes), June von hinten.
    // Jetzt von der Tischseite, June beginnt im Dreiviertelprofil und dreht sich ganz zur Kamera.
    figuren: { june: { position: [-15.3, SO, 3.7], blick: 95, gesicht: 'neutral' } },
    kamera: { ziel: { anker: 'june.kopf', versatz: [0, -0.08, 0] }, blick: { azimut: 160, hoehe: 4, abstand: 2.4 }, fov: 42 },
    haupt: { wer: 'june', was: 'umdrehen', wort: 'June', params: { blick: 160 } },
    gesichter: [{ wer: 'june', name: 'laecheln', wort: 'June', versatz: 0.15 }],
    hauptsache: 'june.kopf',
  },
  // "the only one who ever made it to sunrise." – Rückblende: June mit 18 im ersten Sonnenlicht auf der Veranda
  '22:the only': {
    figuren: { june18: { position: mw(3.0, SO, 1.4), blick: 90, gesicht: 'leer' } },
    kamera: { ziel: 'june18.kopf', blick: { azimut: 125, hoehe: 4, abstand: 3.4 }, fov: 42 },
    haupt: { wer: 'june18', was: 'kopf_drehen', wort: 'sunrise', dauer: 0.4, params: { winkel: 25, nicken: -14 } },
    hauptsache: 'june18.kopf',
  },
  // "Six years ago, Dad" – Rückblende, Junes Zimmer nachts: die Bodenluke fliegt auf, als "Dad" fällt
  '23': {
    figuren: {
      dad: { position: [-19.55, SO, 1.45], blick: 40, gesicht: 'entschlossen' },
      june18: { position: [-20.15, SO, 2.75], blick: 100, gesicht: 'angst' },
      luke_rb: { position: ORT.luke, blick: 90 },
    },
    // Review Folge 1: Dads Kopf war an der Augenlinie abgeschnitten; weiterer Winkel, Blick etwas höher
    kamera: { ziel: { anker: 'luke_rb.mitte', versatz: [-0.3, 0.3, 0] }, pos: [-18.0, 2.4, 4.6], fov: 64 },
    licht_anpassung: { belichtung: 1.5, hemi: { staerke: 2.8 } },
    neben: [{ wer: 'dad', was: 'ducken', ab: 'start', dauer: 0.4, params: { tiefe: 0.5, arme: 'knie' } }],
    haupt: { wer: 'luke_rb', was: 'oeffnen', wort: 'Dad', anker: 'ende', dauer: 0.5 },
    hauptsache: 'luke_rb.mitte',
  },
  // "hid her in the crawl space under her room." – Draufsicht, Sturzfahrt: Dad klappt die Luke über June zu
  '23:hid': {
    figuren: {
      dad: { position: [-19.5, SO, 1.5], blick: 40, gesicht: 'entschlossen', pose: 'ducken', pose_params: { tiefe: 0.6, arme: 'knie' } },
      june18: { position: [-18.8, -1.05, 2.0], blick: 90, gesicht: 'angst' },
      luke_rb: { position: ORT.luke, blick: 90, pose: 'oeffnen' },
    },
    kamera: { baustein: 'push_in', ziel: 'luke_rb.mitte', pos: [-18.3, 3.35, 2.7], fov: 50, profil: 'ease_in', faktor: 1.9, vorlauf: 0.18 },
    licht_anpassung: { belichtung: 1.7, hemi: { staerke: 3.0 } },
    neben: [{ wer: 'june18', was: 'kopf_drehen', ab: 'start', dauer: 0.03, params: { nicken: -40 } }],
    haupt: { wer: 'luke_rb', was: 'schliessen', wort: 'hid', dauer: 1.0, ease: 'ease_in' },
    bogen_wort: 'crawl',
    hauptsache: 'luke_rb.mitte',
  },
  // "In the morning, she climbed out." – die Luke ist offen, June klettert heraus und blinzelt ins Licht
  '24': {
    figuren: {
      // June klettert zur Kamera hin heraus, der aufgeklappte Deckel steht hinter ihr (Review Folge 1:
      // von der Deckelseite verdeckte er sie fast die ganze Einstellung)
      june18: { position: [-18.8, -0.55, 2.0], blick: 90, gesicht: 'verschlafen' },
      luke_rb: { position: ORT.luke, blick: 90, pose: 'oeffnen' },
    },
    kamera: { ziel: { anker: 'june18.kopf', versatz: [0, -0.15, 0] }, pos: [-17.0, 2.0, 3.0], fov: 50 },
    licht_anpassung: { belichtung: 1.25 },
    haupt: { wer: 'june18', was: 'klettern', wort: 'climbed', dauer: 0.8, params: { hoehe: 1.15, vor: 0.2 } },
    hauptsache: 'june18.kopf',
  },
  // "Dad's shoes were on the porch." – Dads Arbeitsstiefel auf der Veranda, nebeneinander
  '25': {
    figuren: { sp_dad: { position: [-10.9, SO, -2.8], blick: 90 } },
    // Review Folge 1: von oben lasen sich die Stiefel wie Brotlaibe; jetzt schräg von der Seite
    kamera: { ziel: 'sp_dad.mitte', blick: { azimut: 38, hoehe: 20, abstand: 1.3 }, fov: 38, rate: 0.07 },
    haupt: { art: 'kamera', wort: 'shoes' },
    hauptsache: 'sp_dad.mitte',
  },
  // "Every night since, June counts to one hundred" – Draufsicht: June im Bett, Augen zu, die Lippen zählen
  '26': {
    figuren: { june: { position: [-18.85, 1.0, 4.2], blick: 90, pose: 'liegen', gesicht: 'augen_zu' }, luke_tp: { position: ORT.luke, blick: 90 } },
    kamera: { baustein: 'crane_down_tilt', ziel: 'june.kopf', blick: { azimut: 140, hoehe: 52, abstand: 1.7 }, hoehe: 0.85, rueck: 0.4, ankunft_wort: 'counts', fov: 54 },
    haupt: { art: 'gesicht', wer: 'june', name: 'zaehlt_a', wort: 'counts' },
    mund: { wer: 'june', art: 'zaehlen', wort: 'counts', versatz: 0.22, takt: 0.22 },
    hauptsache: 'june.kopf',
  },
  // "before she falls asleep." – June schläft ein: der Mund steht still, die Augen bleiben zu
  '26:before': {
    figuren: { june: { position: [-18.85, 1.0, 4.2], blick: 90, pose: 'liegen', gesicht: 'zaehlt_b' } },
    kamera: { ziel: 'june.kopf', blick: { azimut: 140, hoehe: 42, abstand: 1.5 }, fov: 40, rate: 0.06 },
    mund: { wer: 'june', art: 'zaehlen', takt: 0.22, bis: 'asleep' },
    haupt: { art: 'gesicht', wer: 'june', name: 'augen_zu', wort: 'asleep' },
    hauptsache: 'june.kopf',
  },
  // "She says it helps." – June zuckt mit den Schultern und lächelt schief
  '27': {
    figuren: { june: { position: [-15.0, SO, 3.5], blick: 180, gesicht: 'laecheln' } },
    kamera: { ziel: { anker: 'june.kopf', versatz: [0, -0.2, 0] }, blick: { azimut: 165, hoehe: 3, abstand: 2.4 }, fov: 40 },
    haupt: { wer: 'june', was: 'schulterzucken', wort: 'helps' },
    hauptsache: 'june.kopf',
  },
  // "At breakfast, she took my hand." – Kranabstieg über den Tisch, Junes Hand greift nach Elis Hand
  '28': {
    figuren: {
      june: { position: [-14.5, SO, 3.75], blick: 180, pose: 'sitzen', gesicht: 'besorgt' },
      eli: { position: [-13.65, SO, 2.6], blick: -90, pose: 'sitzen', gesicht: 'neutral' },
    },
    kamera: { baustein: 'crane_down_tilt', ziel: [-14.2, 1.3, 3.1], blick: { azimut: 35, hoehe: 50, abstand: 1.8 }, hoehe: 0.7, rueck: 0.3, ankunft_wort: 'took', fov: 54 },
    neben: [{ wer: 'eli', was: 'greifen', ab: 'start', dauer: 0.3, params: { zu: [-14.15, 1.32, 3.0], seite: 'l', lehnen: false } }],
    haupt: { wer: 'june', was: 'greifen', wort: 'took', params: { zu: 'eli.hand_l', seite: 'r' } },
    hauptsache: 'june.hand_r',
  },
  // "It never looks in my room, Rabbit." – June beugt sich vor und spricht leise (Mundformen)
  '29': {
    figuren: { june: { position: [-14.5, SO, 3.75], blick: 180, pose: 'sitzen', gesicht: 'besorgt' } },
    kamera: { ziel: { anker: 'june.kopf', versatz: [0, -0.13, 0] }, blick: { azimut: 200, hoehe: 2, abstand: 2.1 }, fov: 38 },
    haupt: { wer: 'june', was: 'vorbeugen', wort: 'Rabbit', dauer: 0.5, params: { winkel: 14, kopf_ausgleich: 12 } },
    mund: { wer: 'june', miene: 'besorgt' },
    hauptsache: 'june.kopf',
  },
  // "I'll hide you there." "I promise." – der Teppich neben Junes Bett, darunter zeichnet sich der Ring der Luke ab
  '30': {
    figuren: { luke_tp: { position: ORT.luke, blick: 90 } },
    kamera: { baustein: 'orbit', ziel: 'luke_tp.ring', pos: [-17.95, 1.65, 1.55], grad_pro_s: 20, fov: 40 },
    licht_anpassung: { belichtung: 1.7 },
    haupt: { art: 'kamera', wort: 'hide' },
    hauptsache: 'luke_tp.ring',
  },

  // "I promise." – June nickt am Frühstückstisch (Review Folge 1: sonst hört man das Versprechen
  // leicht als Satz des Erzählers; jetzt ist June im Bild, Mundformen, gelber Untertitel)
  '31': {
    figuren: { june: { position: [-14.5, SO, 3.75], blick: 180, pose: 'sitzen', gesicht: 'entschlossen' } },
    kamera: { ziel: { anker: 'june.kopf', versatz: [0, -0.2, 0] }, blick: { azimut: 165, hoehe: 2, abstand: 2.0 }, fov: 38, rate: 0.09 },
    haupt: { wer: 'june', was: 'kopf_drehen', wort: 'promise', dauer: 0.35, params: { nicken: 14 } },
    mund: { wer: 'june', miene: 'entschlossen' },
    hauptsache: 'june.kopf',
  },

  // ───────── Cliffhanger ─────────
  // "At sunset, I went upstairs" – Folgefahrt hinter Eli die Treppe hinauf
  '32': {
    figuren: { eli: { position: [-12.8, SO, -4.32], blick: -90, gesicht: 'neutral' } },
    // Review Folge 1: vorher nur Elis Hinterkopf. Jetzt schräg von vorn, er kommt die Treppe herauf.
    kamera: { ziel: { anker: 'eli.kopf', versatz: [0, -0.2, 0] }, pos: [-15.5, 3.7, -2.5], fov: 54 },
    haupt: { wer: 'eli', was: 'gehen', wort: 'upstairs', anker: 'ende', dauer: 1.35, ease: 'linear', params: { nach: [-14.8, -4.32] } },
    neben: [{ wer: 'eli', was: 'klettern', wort: 'upstairs', anker: 'ende', dauer: 1.35, ease: 'linear', params: { hoehe: 1.45, arme: false } }],
    hauptsache: 'eli.kopf',
  },
  // "to grab a flashlight." – Eli nimmt die Taschenlampe vom Bett
  '32:to grab': {
    figuren: { eli: { position: [-15.0, OG, 3.75], blick: -125, gesicht: 'neutral' } },
    kamera: { ziel: { anker: 'eli.kopf', versatz: [0, -0.2, 0] }, pos: [-15.9, 5.3, 1.6], fov: 50 },
    haupt: { wer: 'eli', was: 'greifen', wort: 'grab', params: { zu: 'haus.taschenlampe', seite: 'r' } },
    hauptsache: 'eli.kopf',
  },
  // "My breath turned white." – das Zimmer wird dunkler, Elis Atem wird weiß
  '33': {
    figuren: { eli: { position: [-13.3, OG, 2.6], blick: 60, gesicht: 'nervoes' } },
    // Review Folge 1: Der Atem erschien erst am rechten Rand. Eli steht jetzt links der Mitte mit
    // Blickraum nach rechts, der Dampf ist größer und kommt auf "white".
    kamera: { ziel: { anker: 'eli.kopf', versatz: [0.12, -0.1, 0] }, blick: { azimut: 0, hoehe: 3, abstand: 2.0 }, fov: 40 },
    haupt: { art: 'licht', licht_art: 'dimmen', ziel: 'umgebung', faktor: 0.6, dauer: 0.4, wort: 'turned' },
    gesichter: [{ wer: 'eli', name: 'angst', wort: 'white' }],
    partikel: [{ art: 'atem', ort: 'eli.mund', wort: 'white', vorlauf: 0.15, periode: 1.1, groesse: 0.15, deckkraft: 0.85 }],
    hauptsache: 'eli.kopf',
  },
  // "Mister Hundred was standing in our yard," – über Elis Schulter durchs Fenster: der Riese im Vorgarten
  '34': {
    figuren: { eli: { position: ORT.eliFenster, blick: 90, gesicht: 'angst' }, ...MH(ORT.monsterGarten, -90) },
    kamera: { ziel: 'mh.haende', pos: [-14.3, 5.45, 2.0], fov: 46, zusaetze: [{ baustein: 'shake', wort: 'Hundred', staerke: 1 }] },
    licht_anpassung: KALT,
    haupt: { wer: 'eli', was: 'erschrecken', wort: 'Hundred' },
    tiefe: { fokus: 'mh.haende', staerke: 0.7 },
    hauptsache: 'mh.haende',
  },
  // "six hours early." – die Turmuhr in der Dämmerung zeigt sechs, nicht Mitternacht
  '34:six': {
    uhr: '6:00',
    kamera: { baustein: 'dolly_out', punkt: 'strasse.platz_detail', rate: -0.08 },
    licht_anpassung: KALT,
    haupt: { art: 'kamera', wort: 'early' },
    hauptsache: 'strasse.kirche_uhr',
  },
  // "It wasn't counting." – Eli erstarrt am Fenster und hält den Atem an
  '35': {
    // Review Folge 1: vorher Elis Hinterkopf direkt vor dem Cliffhanger. Jetzt Dreiviertel von vorn,
    // sein Blick geht an der Kamera vorbei zum Fenster.
    figuren: { eli: { position: [-13.8, OG, 2.6], blick: 90, gesicht: 'angst' } },
    kamera: { ziel: { anker: 'eli.kopf', versatz: [0, -0.1, 0] }, blick: { azimut: 50, hoehe: 3, abstand: 2.0 }, fov: 44 },
    licht_anpassung: KALT,
    haupt: { wer: 'eli', was: 'atem_anhalten', wort: 'counting' },
    gesichter: [{ wer: 'eli', name: 'augen_zu', wort: 'counting' }],
    partikel: [{ art: 'atem', ort: 'eli.mund', periode: 1.0, groesse: 0.1, deckkraft: 0.7, bis: 'counting' }],
    hauptsache: 'eli.kopf',
  },
  // "It was looking at me," – aus Elis Fenster: die Finger öffnen einen Spalt, dahinter das Auge
  // Review Folge 1: kein Opfer im Bild. Jetzt Elis Schulter und der Fensterrahmen als Vordergrund.
  '36': {
    set: ['strasse', 'haus'],
    figuren: { ...MH(ORT.monsterGarten, -90), eli: { position: ORT.eliFenster, blick: 90, gesicht: 'angst' } },
    kamera: { ziel: 'mh.haende', pos: [-13.3, 5.55, 2.15], fov: 40 },
    tiefe: { fokus: 'mh.haende', staerke: 0.6 },
    licht_anpassung: KALT,
    neben: [{ wer: 'mh', was: 'kopf_drehen', ab: 'start', dauer: 0.03, params: { nicken: 12 } }],
    haupt: { wer: 'mh', was: 'spaehen', wort: 'looking' },
    hauptsache: 'mh.haende',
  },
  // "through its fingers." – Großaufnahme: das bernsteinfarbene Auge im Fingerspalt, Snap-Zoom auf "fingers"
  '36:through': {
    figuren: MH(ORT.monsterGarten, -90, { pose: 'spaehen', pose_params: { staerke: 0.6 } }),
    kamera: { baustein: 'snap_zoom', ziel: 'mh.auge', blick: { azimut: -90, hoehe: -4, abstand: 1.6, bezug: 'mh.auge' }, fov: 34, zeit_wort: 'fingers', faktor: 1.18, bilder: 2 },
    neben: [
      { wer: 'mh', was: 'kopf_drehen', ab: 'start', dauer: 0.03, params: { nicken: 12 } },
      // auf "fingers" spreizen sich die Finger weiter (serie.md Handpose, 0,3 s)
      { wer: 'mh', was: 'finger_spreizen', wort: 'fingers', dauer: 0.3, params: { seite: 'r', staerke: 1.5 } },
    ],
    licht_anpassung: KALT,
    haupt: { art: 'kamera', wort: 'fingers' },
    hauptsache: 'mh.auge',
  },
};
