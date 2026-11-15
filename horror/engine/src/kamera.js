// Kamera-Bausteine: Jeder Baustein ist eine Funktion (Parameter, Kontext) -> Fahrt.
// Eine Fahrt hat zustand(t) -> { pos, ziel, fov, roll } für jede Zeit t (Sekunden der Episode).
// Alles ist rein zeitabhängig: kein Zustand zwischen Bildern, keine Uhr, kein Math.random.
// Zielwerte und Begriffe aus horror/docs/bewegungs-spec.md (1.3 Kamera, 2.3 Kamera-Bausteine).
//
// Koordinaten: 1 Einheit = 1 m, y zeigt nach oben. Figuren schauen bei blick=0 nach +z.
// "blick" setzt die Kamera relativ zu einem Punkt: azimut 0 = Kamera auf der +z-Seite
// (sieht also das Gesicht einer Figur mit blick=0), hoehe = Erhebungswinkel in Grad.
//
// Kontext k (kommt von der Engine, im Test von Hand gebaut):
//   k.start, k.ende       Einstellung in Sekunden
//   k.fps                 Bilder pro Sekunde
//   k.seitenverhaeltnis   Breite / Höhe (9/16)
//   k.anker(name, t)      -> THREE.Vector3 (Weltposition eines Ankers zur Zeit t)
//   k.ausrichtung(name,t) -> Drehung (rad, um y) der Figur, zu der der Anker gehört
//   k.kamerapunkt(name)   -> { pos, ziel, fov } aus einem Set (optional)
//   k.seed                Seed der Einstellung (für Wackeln)

import * as THREE from 'three';
import { profil, easeFunktion, STANDARD_VORLAUF, begrenzen } from './ease.js';
import { rauschen, hash } from './zufall.js';

const GRAD = Math.PI / 180;
const ACHSE_Y = new THREE.Vector3(0, 1, 0);

// ---------- Hilfen ----------

function vek(a) {
  return new THREE.Vector3(a[0], a[1], a[2]);
}

// Punkt-Angabe auflösen: [x,y,z] | "figur.anker" | { anker: "...", versatz: [x,y,z] }
export function punkt(spec, t, k) {
  if (Array.isArray(spec)) return vek(spec);
  if (typeof spec === 'string') return k.anker(spec, t).clone();
  if (spec && typeof spec === 'object') {
    const basis = spec.anker ? k.anker(spec.anker, t).clone() : new THREE.Vector3();
    if (spec.versatz) basis.add(vek(spec.versatz));
    return basis;
  }
  throw new Error(`Punkt-Angabe nicht lesbar: ${JSON.stringify(spec)}`);
}

// Kugelkoordinaten -> Versatz. azimut 0 = +z, 90 = +x.
export function kugel(azimut, hoehe, abstand) {
  const a = azimut * GRAD, e = hoehe * GRAD;
  return new THREE.Vector3(Math.sin(a) * Math.cos(e) * abstand, Math.sin(e) * abstand, Math.cos(a) * Math.cos(e) * abstand);
}

// Vergrößerung s als Brennweitenänderung: fov' = 2·atan(tan(fov/2) / s).
export function fovSkaliert(fov, s) {
  return (2 * Math.atan(Math.tan((fov * GRAD) / 2) / s)) / GRAD;
}

// Grundlage fast aller Bausteine: Zielpunkt (zeitabhängig) und Startposition der Kamera.
function grundlage(p, k, zielSchluessel = 'ziel') {
  const kp = p.punkt && k.kamerapunkt ? k.kamerapunkt(p.punkt) : null;
  const zielSpec = p[zielSchluessel] ?? kp?.ziel ?? [0, 1.5, 0];
  const zielVersatz = p.ziel_versatz ? vek(p.ziel_versatz) : new THREE.Vector3();
  const zielBei = (t) => punkt(zielSpec, t, k).add(zielVersatz);
  const Z0 = zielBei(k.start);
  let P0;
  if (p.pos) P0 = punkt(p.pos, k.start, k);
  else if (!p.blick && kp?.pos) P0 = punkt(kp.pos, k.start, k);
  else {
    const b = { azimut: 0, hoehe: 8, abstand: 4, ...(p.blick || {}) };
    const bezug = b.bezug ? punkt(b.bezug, k.start, k).add(zielVersatz) : Z0.clone();
    P0 = bezug.add(kugel(b.azimut, b.hoehe, b.abstand));
  }
  return { zielBei, Z0, P0, fov: p.fov ?? kp?.fov ?? 50, roll: p.roll ?? 0 };
}

function dauerVon(k) {
  const T = k.ende - k.start;
  if (!(T > 0)) throw new Error(`Einstellung ohne Dauer (${k.start}–${k.ende})`);
  return T;
}

// Standard-Vorlauf: linear braucht keinen, Ease-Profile über die ganze Einstellung schon.
function vorlaufFuer(p, pr) {
  if (p.vorlauf !== undefined) return p.vorlauf;
  return pr === 'linear' ? 0 : STANDARD_VORLAUF;
}

// ---------- Bausteine ----------

// Push-in: Dolly auf das Ziel zu. Standard 7 %/s Vergrößerung, linear, ohne Halt am Schnitt
// (die Kamera fährt schon im ersten Bild mit vollem Tempo).
// Parameter: ziel, pos|blick|punkt, rate (1/s, Standard 0.07) ODER faktor (Gesamtvergrößerung),
//            profil (linear | ease_in_out | ease_in …), vorlauf, art (dolly | zoom), fov, roll.
// Sturz-/Tauchfahrt = push_in mit profil "ease_in" und faktor 1.9–5.
export function push_in(p, k, standardRate = 0.07) {
  const g = grundlage(p, k);
  const T = dauerVon(k);
  const pr = p.profil ?? 'linear';
  const vl = vorlaufFuer(p, pr);
  // Vergrößerung exponentiell: 7 %/s heißt s(t) = e^(0,07·t), also konstantes Zoom-Tempo pro Bild.
  const logGesamt = p.faktor ? Math.log(p.faktor) : (p.rate ?? standardRate) * T;
  const versatz = g.P0.clone().sub(g.Z0);
  const zoom = p.art === 'zoom';
  return {
    zustand(t) {
      const s = Math.exp(logGesamt * profil(pr, (t - k.start) / T, vl));
      const pos = zoom ? g.P0.clone() : g.Z0.clone().add(versatz.clone().divideScalar(s));
      return { pos, ziel: g.zielBei(t), fov: zoom ? fovSkaliert(g.fov, s) : g.fov, roll: g.roll };
    },
    schnell: () => false,
  };
}

// Dolly-out / Pull-out: Größe zeigen. Standard −6 %/s.
export function dolly_out(p, k) {
  return push_in(p, k, -0.06);
}

// Statisch: nur für Inserts oder große Figurenaktion (Spec: höchstens 8 % der Einstellungen).
// Optional rate für einen kaum sichtbaren Push.
export function statisch(p, k) {
  return push_in({ rate: 0, ...p }, k, 0);
}

// Kranabstieg mit Tilt (Eröffnung): Kamera startet hoch über der Endposition, sinkt mit
// Ease-out ab und kippt dabei vom Blick nach unten auf Augenhöhe. Nach der Ankunft fährt
// sie mit nachlauf_rate weiter, damit nichts einfriert.
// Parameter: ziel, pos|blick (Endposition), hoehe (m über Endposition, Std 6), rueck (m weiter
//            weg am Start, Std 2), start, ankunft (Sekunden der Episode), profil (Std ease_out),
//            ziel_start (Blickpunkt am Start, optional), nachlauf_rate (Std 0.03), fov.
export function crane_down_tilt(p, k) {
  const g = grundlage(p, k);
  const start = p.start ?? k.start;
  const ankunft = p.ankunft ?? k.ende;
  const pr = p.profil ?? 'ease_out';
  const weg = g.P0.clone().sub(g.Z0).setY(0);
  if (weg.lengthSq() < 1e-6) weg.set(0, 0, 1);
  weg.normalize();
  const Pstart = g.P0.clone().add(new THREE.Vector3(0, p.hoehe ?? 6, 0)).add(weg.multiplyScalar(p.rueck ?? 2));
  const nachlauf = p.nachlauf_rate ?? 0.03;
  return {
    zustand(t) {
      const Z = g.zielBei(t);
      const ZS = p.ziel_start ? punkt(p.ziel_start, start, k) : Z;
      if (t <= ankunft) {
        const e = profil(pr, (t - start) / Math.max(1e-6, ankunft - start));
        return { pos: Pstart.clone().lerp(g.P0, e), ziel: ZS.clone().lerp(Z, e), fov: g.fov, roll: g.roll };
      }
      const s = Math.exp(nachlauf * (t - ankunft));
      return { pos: Z.clone().add(g.P0.clone().sub(Z).divideScalar(s)), ziel: Z, fov: g.fov, roll: g.roll };
    },
    schnell: () => false,
  };
}

// Tilt-up (Enthüllung): Blick wandert von von_ziel (z. B. Füße) zu ziel (Kopf) und kommt genau
// zur Zeit "ankunft" an (das Nomen). Mit kran > 0 steigt die Kamera dabei mit (Kran-Enthüllung).
// Vor dem Start und nach der Ankunft läuft ein langsamer Push weiter (nachlauf_rate).
// Parameter: von_ziel, ziel, pos|blick (blick bezieht sich auf ziel, außer blick.bezug),
//            start, ankunft, profil (Std ease_in_out), kran (m), nachlauf_rate (Std 0.03), fov.
export function tilt_up(p, k) {
  const g = grundlage(p, k);
  const T = dauerVon(k);
  const start = p.start ?? k.start;
  const ankunft = p.ankunft ?? k.start + 0.8 * T;
  const pr = p.profil ?? 'ease_in_out';
  const kran = p.kran ?? 0;
  const nachlauf = p.nachlauf_rate ?? 0.03;
  if (!p.von_ziel) throw new Error('tilt_up braucht von_ziel (z. B. "monster.fuss")');
  return {
    zustand(t) {
      const VZ = punkt(p.von_ziel, t, k);
      const Z = g.zielBei(t);
      const e = profil(pr, (t - start) / Math.max(1e-6, ankunft - start));
      const blick = VZ.clone().lerp(Z, e);
      let pos = g.P0.clone().add(new THREE.Vector3(0, kran * e, 0));
      if (t < start) {
        const s = Math.exp(nachlauf * (t - start));
        pos = blick.clone().add(pos.sub(blick).divideScalar(s));
      } else if (t > ankunft) {
        const s = Math.exp(nachlauf * (t - ankunft));
        pos = blick.clone().add(pos.sub(blick).divideScalar(s));
      }
      return { pos, ziel: blick, fov: g.fov, roll: g.roll };
    },
    schnell: () => false,
  };
}

// Folgefahrt: Kamera hält festen Abstand zu einem (bewegten) Anker, z. B. hinter der gehenden Figur.
// Parameter: folge (Anker, z. B. "held.brust"), versatz [x,y,z] (Std hinter der Figur
//            [0.5, 0.4, -3]), ziel_versatz (Blickpunkt relativ zum Anker, Std [0, 0, 2]),
//            lokal ("start" = Ausrichtung der Figur am Einstellungsbeginn, "live", false = Welt),
//            rate (zusätzliches Heranfahren, Std 0), fov.
// "Neben der Figur" = versatz [2.5, 0.2, 0.3], ziel_versatz [0, 0, 0.5].
export function track_follow(p, k) {
  if (!p.folge) throw new Error('track_follow braucht folge (Anker der Figur)');
  const versatz = vek(p.versatz ?? [0.5, 0.4, -3]);
  const zielVersatz = vek(p.ziel_versatz ?? [0, 0, 2]);
  const lokal = p.lokal ?? 'start';
  const yaw0 = lokal ? k.ausrichtung(p.folge, k.start) : 0;
  const rate = p.rate ?? 0;
  const fov = p.fov ?? 50;
  return {
    zustand(t) {
      const A = k.anker(p.folge, t).clone();
      const yaw = lokal === 'live' ? k.ausrichtung(p.folge, t) : yaw0;
      const s = Math.exp(rate * (t - k.start));
      const v = versatz.clone().applyAxisAngle(ACHSE_Y, yaw).divideScalar(s);
      const z = zielVersatz.clone().applyAxisAngle(ACHSE_Y, yaw);
      return { pos: A.clone().add(v), ziel: A.add(z), fov, roll: p.roll ?? 0 };
    },
    schnell: () => false,
  };
}

// Seitenfahrt (Truck) mit Vordergrund-Wisch: Kamera gleitet quer zur Blickrichtung.
// pos/blick beschreibt die Position in der MITTE der Einstellung. Ein Vordergrund-Objekt
// (Pfosten, Baum) wird so gestellt, dass es zur Zeit vordergrund.zeit genau durch die Bildmitte wischt.
// Parameter: ziel, pos|blick, richtung ("rechts" | "links"), strecke (m, Std 1.2),
//            profil (Std linear), mitschwenken (Std false: Blick fährt parallel mit),
//            vordergrund: { zeit, abstand (m vor der Kamera, Std 0.9), art ("pfosten" | "baum" |
//            "wand" | Name eines Set-Prefabs), breite, hoehe, farbe } oder false.
// Tempo laut Spec: langsam 20–120 px/s, schnell 560–1600 px/s.
export function truck_side(p, k) {
  const g = grundlage(p, k);
  const T = dauerVon(k);
  const pr = p.profil ?? 'linear';
  const vl = vorlaufFuer(p, pr);
  const vorwaerts = g.Z0.clone().sub(g.P0);
  const rechts = vorwaerts.clone().cross(ACHSE_Y).normalize();
  const vz = p.richtung === 'links' ? -1 : 1;
  const strecke = p.strecke ?? 1.2;
  const versatzBei = (t) => rechts.clone().multiplyScalar(vz * strecke * (profil(pr, (t - k.start) / T, vl) - 0.5));
  const fahrt = {
    zustand(t) {
      const v = versatzBei(t);
      const pos = g.P0.clone().add(v);
      const ziel = p.mitschwenken ? g.zielBei(t) : g.zielBei(t).add(v);
      return { pos, ziel, fov: g.fov, roll: g.roll };
    },
    schnell: () => false,
    vordergrund: [],
  };
  if (p.vordergrund !== false) {
    const vg = p.vordergrund || {};
    const tw = vg.zeit ?? k.start + T / 2;
    const zw = fahrt.zustand(tw);
    const richtung = zw.ziel.clone().sub(zw.pos).setY(0).normalize();
    const ort = zw.pos.clone().add(richtung.clone().multiplyScalar(vg.abstand ?? 0.9));
    ort.y = 0;
    fahrt.vordergrund.push({
      art: vg.art ?? 'pfosten',
      position: [ort.x, ort.y, ort.z],
      drehung: Math.atan2(richtung.x, richtung.z),
      breite: vg.breite ?? 0.32,
      hoehe: vg.hoehe ?? 5,
      farbe: vg.farbe ?? '#101318',
      zeit: tw,
    });
  }
  return fahrt;
}

// Orbit / Bogenfahrt um das Ziel. Spec: 5–25 °/s, Überblick aus der Aufsicht mit 20–25 °/s.
// Parameter: ziel, blick (oder pos), grad_pro_s (Std 20), richtung (+1 gegen den Uhrzeigersinn
//            von oben gesehen, −1 mit), profil (Std linear), hoehe_aenderung (Grad über die
//            Einstellung), abstand_faktor (Abstand am Ende relativ zum Start, Std 1), fov.
export function orbit(p, k) {
  const g = grundlage(p, k);
  const T = dauerVon(k);
  const pr = p.profil ?? 'linear';
  const vl = vorlaufFuer(p, pr);
  const rel = g.P0.clone().sub(g.Z0);
  const abstand0 = rel.length();
  const az0 = Math.atan2(rel.x, rel.z) / GRAD;
  const el0 = Math.asin(begrenzen(rel.y / abstand0, -1, 1)) / GRAD;
  const gesamt = (p.grad_pro_s ?? 20) * T * (p.richtung === -1 ? -1 : 1);
  return {
    zustand(t) {
      const e = profil(pr, (t - k.start) / T, vl);
      const Z = g.zielBei(t);
      const d = abstand0 * (1 + ((p.abstand_faktor ?? 1) - 1) * e);
      const pos = Z.clone().add(kugel(az0 + gesamt * e, el0 + (p.hoehe_aenderung ?? 0) * e, d));
      return { pos, ziel: Z, fov: g.fov, roll: g.roll };
    },
    schnell: () => false,
  };
}

// Whip innerhalb der Einstellung: Die Kamera reißt in 0,2–0,5 s von von_ziel nach ziel herum.
// Die Position bleibt, gedreht wird über Gier- und Nickwinkel (auch 180° möglich).
// Während des Whips rendert die Engine mit Bewegungsunschärfe (Unterbilder).
// Parameter: von_ziel, ziel, pos|blick (blick bezieht sich auf von_ziel, außer blick.bezug),
//            zeit (Beginn, Sekunden der Episode, Std 40 % der Einstellung), dauer (Std 0.3),
//            profil (Std ease_in_out_stark), ueber ("kurz" | "links" | "rechts"),
//            rate (digitaler Push vor/nach dem Whip, Std 0.05), fov.
export function whip(p, k) {
  if (!p.von_ziel) throw new Error('whip braucht von_ziel und ziel');
  const g = grundlage({ ...p, ziel: p.von_ziel }, k);
  const T = dauerVon(k);
  const zeit = p.zeit ?? k.start + 0.4 * T;
  const dauer = Math.min(0.5, Math.max(0.2, p.dauer ?? 0.3));
  const ease = easeFunktion(p.profil ?? 'ease_in_out_stark');
  const rate = p.rate ?? 0.05;
  const winkel = (v) => ({ gier: Math.atan2(v.x, v.z), nick: Math.atan2(v.y, Math.hypot(v.x, v.z)), d: v.length() });
  return {
    zustand(t) {
      const A = winkel(punkt(p.von_ziel, t, k).sub(g.P0));
      const B = winkel(punkt(p.ziel, t, k).sub(g.P0));
      let dg = B.gier - A.gier;
      while (dg > Math.PI) dg -= 2 * Math.PI;
      while (dg <= -Math.PI) dg += 2 * Math.PI;
      if (p.ueber === 'links' && dg < 0) dg += 2 * Math.PI;
      if (p.ueber === 'rechts' && dg > 0) dg -= 2 * Math.PI;
      const e = ease(begrenzen((t - zeit) / dauer));
      const gier = A.gier + dg * e, nick = A.nick + (B.nick - A.nick) * e, d = A.d + (B.d - A.d) * e;
      const richtung = new THREE.Vector3(Math.sin(gier) * Math.cos(nick), Math.sin(nick), Math.cos(gier) * Math.cos(nick));
      const s = Math.exp(rate * (t - k.start));
      return { pos: g.P0.clone(), ziel: g.P0.clone().add(richtung.multiplyScalar(d)), fov: fovSkaliert(g.fov, s), roll: g.roll };
    },
    schnell: (t) => p.unschaerfe !== false && t >= zeit - 1 / k.fps && t <= zeit + dauer + 1 / k.fps,
  };
}

// Snap-Zoom: +13–21 % in 1–2 Bildern (Standard 1,18 in 2 Bildern), danach läuft ein Push weiter.
// Punch-in zur Geste: faktor 1.5, bilder 3–6.
// Parameter: wie push_in, dazu zeit (Std Einstellungsbeginn), faktor, bilder.
export function snap_zoom(p, k) {
  const snap = zusatz_snap({ zeit: p.zeit ?? k.start, faktor: p.faktor ?? 1.18, bilder: p.bilder ?? 2 }, k);
  const pBasis = { ...p };
  delete pBasis.faktor; // faktor gehört hier zum Snap, nicht zum Push danach
  const push = push_in(pBasis, k);
  return {
    zustand(t) {
      const z = push.zustand(t);
      snap.anwenden(z, t);
      return z;
    },
    schnell: (t) => snap.schnell(t),
  };
}

export const BAUSTEINE = { push_in, dolly_out, statisch, crane_down_tilt, tilt_up, track_follow, truck_side, orbit, whip, snap_zoom };

// ---------- Zusätze (liegen über dem Baustein, mehrere pro Einstellung möglich) ----------

// Snap als Zusatz: ändert nur das fov.
function zusatz_snap(p, k) {
  const zeit = p.zeit ?? k.start;
  const bilder = Math.max(1, p.bilder ?? 2);
  const logF = Math.log(p.faktor ?? 1.18);
  const ease = easeFunktion('ease_out');
  return {
    anwenden(z, t) {
      const n = begrenzen(((t - zeit) * k.fps) / bilder);
      z.fov = fovSkaliert(z.fov, Math.exp(logF * ease(n)));
    },
    schnell: (t) => t >= zeit && t <= zeit + bilder / k.fps,
  };
}

// Wackeln als Ereignis (nie als Dauer-Handkamera): Einsatz 0–0,13 s nach dem Geräuschwort,
// Dauer 0,4–0,5 s, abklingend; Ausschlag etwa 1 % der Bildbreite (staerke 1).
// art "stoss": Rauschen mit Keys alle 2 Bilder (frequenz 15). art "sinus": waagerechter Sinus
// (Angst-Großaufnahme, Spec: 6 Hz, ±5 px bei 1080 Breite -> staerke_px 5).
function zusatz_shake(p, k) {
  const start = p.start ?? k.start;
  const dauer = p.dauer ?? 0.45;
  const art = p.art ?? 'stoss';
  const frequenz = p.frequenz ?? (art === 'sinus' ? 6 : 15);
  const abklingen = p.abklingen ?? 1.5;
  const seed = hash(`${k.seed}|shake|${start}`);
  return {
    winkel(t, fov) {
      if (t < start || t > start + dauer) return null;
      const u = (t - start) / dauer;
      const A = art === 'sinus' && p.abklingen === undefined ? 1 : Math.pow(1 - u, abklingen);
      let fx, fy, roll = 0;
      if (art === 'sinus') {
        fx = ((p.staerke_px ?? 5) / 1080) * Math.sin(2 * Math.PI * frequenz * (t - start)) * A;
        fy = 0;
      } else {
        const st = (p.staerke ?? 1) * 0.01;
        fx = st * rauschen(seed, t * frequenz) * A;
        fy = st * rauschen(seed + 7, t * frequenz) * A;
        roll = (p.staerke ?? 1) * 0.4 * GRAD * rauschen(seed + 13, t * frequenz) * A;
      }
      // Bruchteil der Bildbreite -> Winkel. hfov aus vfov und Seitenverhältnis.
      const vf = fov * GRAD;
      const hf = 2 * Math.atan(Math.tan(vf / 2) * k.seitenverhaeltnis);
      return { gier: fx * hf, nick: (fy * vf) / k.seitenverhaeltnis, roll };
    },
    schnell: () => false,
  };
}

// Rollen als langsame Drift (Kanal-Option, Spec: 0,5–2 °/s; Standard aus).
function zusatz_roll_drift(p, k) {
  return {
    winkel(t) {
      return { gier: 0, nick: 0, roll: (p.grad_pro_s ?? 1) * GRAD * (t - k.start) };
    },
    schnell: () => false,
  };
}

const ZUSAETZE = { shake: zusatz_shake, snap_zoom: zusatz_snap, roll_drift: zusatz_roll_drift };

// ---------- Einstieg für die Engine ----------

// Baut die Fahrt einer Einstellung inklusive Zusätzen.
// Rückgabe: { zustand(t) -> {pos, ziel, fov, roll, gier, nick}, schnell(t), vordergrund[] }
export function baueFahrt(kameraSpec, k) {
  const name = kameraSpec?.baustein;
  const fabrik = BAUSTEINE[name];
  if (!fabrik) throw new Error(`Unbekannter Kamera-Baustein "${name}". Erlaubt: ${Object.keys(BAUSTEINE).join(', ')}`);
  const fahrt = fabrik(kameraSpec, k);
  const zusaetze = (kameraSpec.zusaetze || []).map((z) => {
    const f = ZUSAETZE[z.baustein];
    if (!f) throw new Error(`Unbekannter Kamera-Zusatz "${z.baustein}". Erlaubt: ${Object.keys(ZUSAETZE).join(', ')}`);
    return f(z, k);
  });
  return {
    zustand(t) {
      const z = fahrt.zustand(t);
      z.gier = 0; z.nick = 0; z.roll = (z.roll || 0) * GRAD;
      for (const zs of zusaetze) {
        if (zs.anwenden) zs.anwenden(z, t);
        if (zs.winkel) {
          const w = zs.winkel(t, z.fov);
          if (w) { z.gier += w.gier; z.nick += w.nick; z.roll += w.roll; }
        }
      }
      return z;
    },
    schnell: (t) => fahrt.schnell(t) || zusaetze.some((zs) => zs.schnell(t)),
    vordergrund: fahrt.vordergrund || [],
  };
}

// Setzt eine THREE.PerspectiveCamera auf einen Zustand.
export function kameraSetzen(kamera, z) {
  kamera.position.copy(z.pos);
  kamera.up.set(0, 1, 0);
  kamera.lookAt(z.ziel);
  if (z.gier) kamera.rotateY(-z.gier);
  if (z.nick) kamera.rotateX(z.nick);
  if (z.roll) kamera.rotateZ(z.roll);
  if (kamera.fov !== z.fov) {
    kamera.fov = z.fov;
    kamera.updateProjectionMatrix();
  }
}
