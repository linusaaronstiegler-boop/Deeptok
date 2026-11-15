// Zufall mit Seed. Die Engine darf nie Math.random() oder die Uhr benutzen:
// Jedes Bild muss eine reine Funktion von (Episode, Bildnummer) sein, sonst
// sehen zwei parallele Render-Prozesse oder ein Neu-Render anders aus.

// FNV-1a: macht aus einem Text eine 32-Bit-Zahl (z. B. "held" -> Seed für die Figur).
export function hash(text) {
  let h = 0x811c9dc5;
  const s = String(text);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// mulberry32: kleiner, schneller Generator. Gleicher Seed -> gleiche Folge.
export function generator(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generator für einen benannten Teil der Episode: zufallFuer(seed, "set", "strasse").
export function zufallFuer(seed, ...teile) {
  return generator(hash([seed, ...teile].join('|')));
}

// Zustandsloser Zufallswert für eine ganze Zahl i (für Rauschen, Partikel, Blinzeln).
export function wert(seed, i) {
  let h = Math.imul((seed >>> 0) ^ Math.imul(i | 0, 0x9e3779b1), 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// Glattes 1D-Rauschen in [-1, 1]: Stützwerte an ganzen x, dazwischen weich verbunden.
// Für Wackeln (Keys alle 2 Bilder = 15 Hz) und Leerlauf-Bewegung.
export function rauschen(seed, x) {
  const i = Math.floor(x);
  const f = x - i;
  const a = wert(seed, i) * 2 - 1;
  const b = wert(seed, i + 1) * 2 - 1;
  const s = f * f * (3 - 2 * f);
  return a + (b - a) * s;
}
