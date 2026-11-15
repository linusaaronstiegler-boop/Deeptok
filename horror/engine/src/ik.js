// Zwei-Glied-IK für Arme und Beine (Schulter–Ellbogen–Hand, Hüfte–Knie–Knöchel).
// Wird von Animationen benutzt, die eine Hand an einen Punkt bringen: Mund zuhalten, klopfen,
// Tür öffnen, greifen, umarmen. Rein aus der aktuellen Pose gerechnet, kein Zustand.
//
// Rechnung im Koordinatensystem des Elterngelenks (Rumpf bzw. Hüfte):
//   1. Abstand Schulter–Ziel d, Gliedlängen L1, L2 → Winkel am Ellbogen (Kosinussatz)
//   2. Die Ebene des Knicks legt ein Polvektor fest ("wohin zeigt der Ellbogen")
//   3. Oberarm: lokale −y-Achse zeigt zum Ellbogen, lokale +z-Achse in Knickrichtung
//   4. Unterarm: Drehung um die lokale x-Achse (Arm: negativ = nach vorn, Bein: positiv)

import * as THREE from 'three';

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _qa = new THREE.Quaternion();

// fig: Figur-Instanz; seite 'L' | 'R'; ziel: THREE.Vector3 in Weltkoordinaten (Handmitte);
// p: Mischanteil 0..1 (vom aktuellen Zustand zum IK-Ergebnis);
// opt.pol: Richtung des Ellbogens im Rumpf-System (Std: nach außen-unten-hinten);
// opt.glied: 'arm' | 'bein'.
export function zweiGlied(fig, seite, ziel, p = 1, opt = {}) {
  const glied = opt.glied ?? 'arm';
  const S = seite.toUpperCase();
  const s = S === 'L' ? 1 : -1;
  const G = fig.gelenke;
  const oben = glied === 'arm' ? G[`arm${S}`] : G[`bein${S}`];
  const unten = glied === 'arm' ? G[`unterarm${S}`] : G[`unterbein${S}`];
  if (!oben || !unten) return;
  const [L1, L2] = fig.glieder?.[glied] ?? [0.3, 0.3];
  const eltern = oben.parent;
  eltern.updateWorldMatrix(true, false);
  const T = eltern.worldToLocal(ziel.clone());
  const S0 = oben.position.clone();
  const d = T.clone().sub(S0);
  const abstand = THREE.MathUtils.clamp(d.length(), Math.abs(L1 - L2) + 1e-3, L1 + L2 - 1e-3);
  const dh = d.lengthSq() > 1e-10 ? d.normalize() : new THREE.Vector3(0, -1, 0);

  // Polvektor: Arm-Ellbogen zeigen nach außen und hinten, Knie nach vorn
  const pol = (opt.pol ? new THREE.Vector3(...opt.pol) : (glied === 'arm' ? new THREE.Vector3(s * 0.7, -0.35, -0.6) : new THREE.Vector3(0, 0, 1)));
  if (opt.pol && glied === 'arm' && opt.polSpiegeln !== false) pol.x *= s;
  const ph = pol.sub(dh.clone().multiplyScalar(pol.dot(dh)));
  if (ph.lengthSq() < 1e-8) {
    // Ziel liegt genau in Polrichtung: irgendeine Senkrechte nehmen
    ph.set(1, 0, 0).sub(dh.clone().multiplyScalar(dh.x));
    if (ph.lengthSq() < 1e-8) ph.set(0, 0, 1).sub(dh.clone().multiplyScalar(dh.z));
  }
  ph.normalize();

  const cosB = THREE.MathUtils.clamp((L1 * L1 + abstand * abstand - L2 * L2) / (2 * L1 * abstand), -1, 1);
  const sinB = Math.sqrt(1 - cosB * cosB);
  const u = dh.clone().multiplyScalar(cosB).add(ph.clone().multiplyScalar(sinB)); // Oberarm-Richtung
  const E = S0.clone().add(u.clone().multiplyScalar(L1));
  const Tz = S0.clone().add(dh.clone().multiplyScalar(abstand));
  const v = Tz.sub(E).normalize(); // Unterarm-Richtung
  const knick = Math.acos(THREE.MathUtils.clamp(u.dot(v), -1, 1));

  // Basis des Obergelenks: y = −u, z = Knickrichtung (Arm) bzw. Gegenrichtung (Bein)
  const w = v.clone().sub(u.clone().multiplyScalar(u.dot(v)));
  if (w.lengthSq() < 1e-8) w.copy(ph); // gestreckt: Knickebene aus dem Pol
  w.normalize();
  if (glied === 'bein') w.negate();
  const y = u.clone().negate();
  const x = new THREE.Vector3().crossVectors(y, w).normalize();
  const z = new THREE.Vector3().crossVectors(x, y).normalize();
  _m.makeBasis(x, y, z);
  _q.setFromRotationMatrix(_m);
  _qa.copy(oben.quaternion);
  oben.quaternion.copy(_qa.slerp(_q, p));
  const zielKnick = glied === 'arm' ? -knick : knick;
  unten.rotation.x = unten.rotation.x + (zielKnick - unten.rotation.x) * p;
  unten.rotation.y *= 1 - p;
  unten.rotation.z *= 1 - p;
}

// Ein Gelenk in Weltkoordinaten ausrichten (z. B. Handfläche zum Gesicht).
// weltQuat: gewünschte Welt-Drehung des Gelenks; p: Mischanteil.
export function richteAus(gelenk, weltQuat, p = 1) {
  gelenk.parent.updateWorldMatrix(true, false);
  const elternQ = new THREE.Quaternion();
  gelenk.parent.getWorldQuaternion(elternQ);
  const ziel = elternQ.invert().multiply(weltQuat);
  gelenk.quaternion.slerp(ziel, p);
}

// Punkt im Koordinatensystem eines Objekts (z. B. Kopf) → Weltkoordinaten.
export function lokalZuWelt(obj, x, y, z) {
  obj.updateWorldMatrix(true, false);
  return obj.localToWorld(new THREE.Vector3(x, y, z));
}

// Weiche Hüllkurve für Aktionen, die hin und zurück gehen: 0 → 1 (rein), halten, 1 → 0 (raus).
// u = Fortschritt ohne Ease (ctx.roh), rein/raus = Anteile der Dauer.
export function huelle(u, rein = 0.25, raus = 0.25) {
  const glatt = (x) => x * x * (3 - 2 * x);
  if (u <= 0) return 0;
  if (u < rein) return glatt(u / rein);
  if (raus > 0 && u > 1 - raus) return glatt(Math.max(0, (1 - u) / raus));
  return 1;
}

// Keyframe-Kurve: keys = [[u0, w0], [u1, w1], …] mit u aufsteigend in 0..1.
// Zwischen zwei Keys wird weich (Smoothstep) gemischt; davor/danach gilt der erste/letzte Wert.
export function kurve(u, keys) {
  if (u <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [u1, w1] = keys[i];
    if (u <= u1) {
      const [u0, w0] = keys[i - 1];
      const x = (u - u0) / Math.max(1e-6, u1 - u0);
      return w0 + (w1 - w0) * x * x * (3 - 2 * x);
    }
  }
  return keys[keys.length - 1][1];
}

// Welt-Drehung einer Fäustlingshand aus Fingerrichtung und Handflächen-Normale (beide Welt, Einheitsvektoren).
// Klötzchenhand: Finger zeigen entlang −y, Handfläche zeigt nach −x (linke Hand) bzw. +x (rechte Hand).
export function handDrehung(seite, finger, flaeche) {
  const sx = seite.toUpperCase() === 'L' ? 1 : -1;
  const y = finger.clone().negate().normalize();
  const x = flaeche.clone().multiplyScalar(-sx);
  x.sub(y.clone().multiplyScalar(x.dot(y)));
  if (x.lengthSq() < 1e-8) x.set(1, 0, 0).sub(y.clone().multiplyScalar(y.x));
  x.normalize();
  const z = new THREE.Vector3().crossVectors(x, y).normalize();
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}

// Richtung im System eines Objekts (z. B. Kopf) → Weltrichtung.
export function richtungZuWelt(obj, x, y, z) {
  const q = new THREE.Quaternion();
  obj.getWorldQuaternion(q);
  return new THREE.Vector3(x, y, z).applyQuaternion(q).normalize();
}

// Höhe der Klötzchenhüfte, wenn Oberschenkel um alpha nach vorn und Knie um beta gebeugt sind.
// Liefert { hoehe, vor }: Hüfthöhe über dem Boden und wie weit die Füße vor der Hüfte stehen.
export function beinGeometrie(fig, alpha, beta) {
  const [L1, L2] = fig.glieder?.bein ?? [0.3, 0.3];
  const schuh = fig.masse?.schuh?.h ?? 0.1;
  return {
    hoehe: L1 * Math.cos(alpha) + L2 * Math.cos(beta - alpha) + schuh,
    vor: L1 * Math.sin(alpha) - L2 * Math.sin(beta - alpha),
  };
}
