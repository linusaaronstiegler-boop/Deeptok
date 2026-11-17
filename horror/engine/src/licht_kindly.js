// Licht-Presets für „Rules of Kindly“ (Kindly im Winter). Werden in src/licht.js zu PRESETS dazugelegt;
// der Aufbau ist derselbe (immer dieselben Lichter, Presets ändern nur Farben und Stärken).
// Richtungen zeigen ZUM Licht. Bibel §6: Nacht blau-violett, Schnee bläulich-weiß, Fenster warm-gelb.
//
// Lehren aus den Reviews von Hiding Night, die hier eingebaut sind:
//   - Helligkeit: Median ≥ 85, keine Einstellung < 35. Der Schnee hellt alles auf; die Füll-Lichter sind
//     trotzdem kräftig, weil Figuren vor hellem Schnee sonst als Scherenschnitt absaufen.
//   - Monster mit Kantenlicht: Jedes Preset hat ein kaltes Kantenlicht von hinten.
//   - Atemdampf (Bibel §10.7): Dampf liest sich vor DUNKLEM Grund (Kiefern, Nachthimmel, Hüttenwand).
//     Darum ist der Himmel am Horizont nachts nicht zu hell und der Nebel dünn (die Stadtlichter bleiben
//     sichtbar); das Gegenlicht kommt von der Laterne am Stegende (Punktlicht im Set "see").
export const KINDLY_PRESETS = {
  // Morgengrauen über dem See (S5–7, S21): vor Sonnenaufgang, kalter blauer Himmel mit rosa Saum,
  // flaches warmes Licht vom Horizont, Dunst über dem Eis.
  see_morgengrauen: {
    himmel: { zenit: '#26386a', horizont: '#e9b6ae', scheibe: { richtung: [0.62, 0.03, 0.78], farbe: '#ffc8a6', groesse: 3.2, staerke: 0.45, glanz: 0.3 }, sterne: 0.15 },
    nebel: { farbe: '#a7a6c4', dichte: 0.008 },
    hemi: { himmel: '#c8d0f0', boden: '#7e8199', staerke: 1.75 },
    haupt: { farbe: '#ffd0b4', staerke: 1.6, richtung: [0.62, 0.24, 0.75], weich: 3.5 },
    kante: { farbe: '#9fb4ff', staerke: 0.9, richtung: [-0.5, 0.45, -0.75] },
    belichtung: 1.0,
    grade: { saettigung: 1.04, kontrast: 1.08, faerbung: [0.99, 1.0, 1.04] },
  },
  // Dämmerung (S23 Klappstuhl, S41 Weg zur Hütte vor der Nacht): violett-rosa, Sonne hinter dem Südufer.
  see_daemmerung: {
    himmel: { zenit: '#2a2b62', horizont: '#efa39b', scheibe: { richtung: [-0.55, 0.05, 0.83], farbe: '#ffcfa0', groesse: 2.6, staerke: 3.5, glanz: 0.7 }, sterne: 0.05 },
    nebel: { farbe: '#9a86ad', dichte: 0.012 },
    hemi: { himmel: '#c6a9e2', boden: '#6a5868', staerke: 1.9 },
    haupt: { farbe: '#ffb48c', staerke: 1.9, richtung: [-0.55, 0.22, 0.8], weich: 3 },
    kante: { farbe: '#8c86ff', staerke: 0.75, richtung: [0.6, 0.5, -0.6] },
    belichtung: 1.05,
    grade: { saettigung: 1.02, kontrast: 1.03, faerbung: [1.02, 0.99, 1.01] },
  },
  // Nacht auf dem Eis (S29–36, S41, S64): Mond von hinten-oben, der Schnee leuchtet blau, die Laterne am
  // Stegende und die Hüttenfenster sind die warmen Punkte. Wie "nacht" nach dem Review, etwas weniger Nebel.
  see_nacht: {
    himmel: { zenit: '#0b1532', horizont: '#2f4479', scheibe: { richtung: [-0.4, 0.52, 0.75], farbe: '#e6eeff', groesse: 1.6, staerke: 6, glanz: 0.45 }, sterne: 0.8 },
    nebel: { farbe: '#24345e', dichte: 0.012 },
    hemi: { himmel: '#7d93d8', boden: '#3a4462', staerke: 2.4 },
    haupt: { farbe: '#b8c8ff', staerke: 2.3, richtung: [-0.4, 0.7, 0.6], weich: 3 },
    kante: { farbe: '#7d95ff', staerke: 1.3, richtung: [0.5, 0.45, -0.75] },
    belichtung: 1.5,
    grade: { saettigung: 1.04, kontrast: 1.05, faerbung: [0.97, 1.0, 1.07] },
  },
  // Unter dem Eis (S1, S10–11, S16, S31): türkises Wasser, Licht fällt von oben durch das Eis (die
  // Unterseite des Eises leuchtet selbst, siehe src/winter.js), dichter Wasser-Nebel, kaltes Kantenlicht
  // für das Wesen. Absichtlich hell (Bibel §10.3: „Untersicht hell genug“), unabhängig von der Tageszeit.
  see_unter: {
    himmel: { zenit: '#9fd6dc', horizont: '#3c7f88', sterne: 0 },
    nebel: { farbe: '#2b6a74', dichte: 0.075 },
    hemi: { himmel: '#c4eef2', boden: '#1d3d45', staerke: 2.0 },
    haupt: { farbe: '#d8f4ff', staerke: 1.6, richtung: [0.08, 1.0, 0.1], weich: 4 },
    kante: { farbe: '#9FD8D2', staerke: 1.1, richtung: [-0.3, 0.6, 0.75] },
    belichtung: 1.25,
    grade: { saettigung: 0.92, kontrast: 1.05, faerbung: [0.95, 1.01, 1.05] },
  },
  // Fischerhütte innen, nachts (S42–49, S54–63): eng und warm wie ein Keller, aber nicht kalt. Wenig Füll-
  // Licht; Ofenglut und Petroleumlampe des Sets (2 Punktlichter) zeichnen den Raum. Das Hauptlicht ist
  // kaltes Mondlicht, das nur durch das Frostfenster fällt (die Wände werfen Schatten).
  // Untergrenze wie kriechkeller: 22 je Einstellung (pruefen.py, DUNKLE_ORTE "huette-innen").
  huette: {
    himmel: { zenit: '#0c0a10', horizont: '#141018', sterne: 0 },
    nebel: { farbe: '#1a1210', dichte: 0.02 },
    hemi: { himmel: '#ffc890', boden: '#3c2a20', staerke: 0.95 },
    haupt: { farbe: '#b9c8ff', staerke: 1.1, richtung: [-0.9, 0.42, 0.1], weich: 2 },
    kante: { farbe: '#ffd2a0', staerke: 0.3, richtung: [0.5, 0.5, 0.7] },
    belichtung: 1.3,
    grade: { saettigung: 1.02, kontrast: 1.08, faerbung: [1.05, 0.99, 0.93] },
  },
};
