// Ease-Profile: u läuft von 0 bis 1, der Rückgabewert ist der Weg-Anteil (0..1).
// Grundlage: horror/docs/bewegungs-spec.md, Abschnitt 1.3.
//   linear       = gleiches Tempo vom Schnitt bis zum Schnitt (r5, ref)
//   ease_in_out  = weich an- und abfahren (r1, r2); für Fahrten über eine ganze
//                  Einstellung liegen die Keys VOR und HINTER den Schnitten (Vorlauf),
//                  damit die Kamera am Schnitt schon fährt und nie aus dem Stand anläuft.

const begrenzen = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

export const EASES = {
  linear: (u) => u,
  // Smoothstep: so verhält sich ein Bezier-Key mit automatischen Henkeln (Blender-Standard).
  ease_in_out: (u) => u * u * (3 - 2 * u),
  ease_in: (u) => u * u,
  ease_out: (u) => 1 - (1 - u) * (1 - u),
  ease_in_kubisch: (u) => u * u * u,
  ease_out_kubisch: (u) => 1 - Math.pow(1 - u, 3),
  // Hart beschleunigen und bremsen: für Whips und Snap-Bewegungen.
  ease_in_out_stark: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
  // Leichtes Überschwingen am Ende (Erschrecken mit Nachwippen, Pop).
  nachwippen: (u) => {
    const c1 = 1.2, c3 = c1 + 1;
    return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
  },
  // Sofort am Ziel (Pose setzen, Gesicht tauschen).
  sprung: (u) => (u > 0 ? 1 : 0),
};

// Standard-Vorlauf für Fahrten über eine ganze Einstellung.
// Spec: Keys „etwa 15 %“ vor/hinter den Schnittgrenzen. Mit 18 % beträgt das Starttempo
// 0,46 der Spitze (mit 15 %: 0,41) und liegt damit sicher im Zielband 0,4–0,7.
export const STANDARD_VORLAUF = 0.18;

export function easeFunktion(name) {
  const f = EASES[name || 'linear'];
  if (!f) throw new Error(`Unbekanntes Ease-Profil "${name}". Erlaubt: ${Object.keys(EASES).join(', ')}`);
  return f;
}

// Profil mit Vorlauf: Die Kurve wird über das Fenster [-vorlauf, 1+vorlauf] gelegt
// und dann auf 0..1 normiert. Ergebnis: Bei u=0 ist das Tempo schon > 0.
export function profil(name, u, vorlauf = 0) {
  const f = easeFunktion(name);
  const x = begrenzen(u);
  if (!vorlauf || name === 'linear') return f(x);
  const fenster = 1 + 2 * vorlauf;
  const a = f(vorlauf / fenster);
  const b = f((1 + vorlauf) / fenster);
  return (f((x + vorlauf) / fenster) - a) / (b - a);
}

// Fortschritt einer Aktion zur Zeit t: 0 vor dem Start, 1 nach dem Ende (Pose wird gehalten).
export function fortschritt(t, start, dauer) {
  if (dauer <= 0) return t >= start ? 1 : 0;
  return begrenzen((t - start) / dauer);
}

export { begrenzen };
export const mischen = (a, b, p) => a + (b - a) * p;
