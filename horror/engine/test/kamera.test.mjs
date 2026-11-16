// Prüft die Kamera-Bausteine gegen die Zielwerte aus horror/docs/bewegungs-spec.md.
// Läuft ohne Browser: node --test test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { baueFahrt, fovSkaliert } from '../src/kamera.js';
import { profil, STANDARD_VORLAUF } from '../src/ease.js';
import { Zeitplan } from '../src/zeitplan.js';

const fps = 30;
// Kontext mit festen Ankern; "laeufer" bewegt sich mit 1 m/s entlang −z.
function kontext(start, ende) {
  const anker = {
    held: (t) => new THREE.Vector3(0, 1.5, 0),
    fuss: () => new THREE.Vector3(0, 0, -5),
    kopf: () => new THREE.Vector3(0, 3.3, -5),
    links: () => new THREE.Vector3(-5, 1.5, 0),
    laeufer: (t) => new THREE.Vector3(0, 1.2, -t),
  };
  return {
    start, ende, fps, seitenverhaeltnis: 9 / 16, seed: 1,
    anker: (n, t) => anker[n](t),
    ausrichtung: () => Math.PI, // Läufer schaut nach −z
  };
}

// Bildgröße des Ziels ~ 1 / Abstand (Dolly). Vergrößerung zwischen zwei Zeiten:
const vergroesserung = (f, ta, tb) => {
  const a = f.zustand(ta), b = f.zustand(tb);
  return a.pos.distanceTo(a.ziel) / b.pos.distanceTo(b.ziel);
};

test('push_in: 7 %/s, linear, ohne Halt am Schnitt', () => {
  const f = baueFahrt({ baustein: 'push_in', ziel: 'held', blick: { abstand: 4 } }, kontext(0, 1.5));
  const v = vergroesserung(f, 0, 1.5);
  assert.ok(Math.abs(v - Math.exp(0.07 * 1.5)) < 1e-9, `Vergrößerung ${v}`);
  assert.ok(v >= 1.07 && v <= 1.12, 'Spec: ×1,07–1,12 je Einstellung');
  // Tempo im ersten und im letzten Bild gleich (linear, schon im ersten Bild in Fahrt)
  const anfang = vergroesserung(f, 0, 1 / fps), ende = vergroesserung(f, 1.5 - 1 / fps, 1.5);
  assert.ok(Math.abs(anfang - ende) < 1e-9);
  assert.ok(anfang > 1);
});

test('ease_in_out mit Vorlauf: Starttempo 0,4–0,7 der Spitze, Spitze bei 40–60 %', () => {
  const n = 1000;
  const v = [];
  for (let i = 0; i < n; i++) v.push(profil('ease_in_out', (i + 1) / n, STANDARD_VORLAUF) - profil('ease_in_out', i / n, STANDARD_VORLAUF));
  const spitze = Math.max(...v);
  const lage = v.indexOf(spitze) / n;
  assert.ok(v[0] / spitze >= 0.4 && v[0] / spitze <= 0.7, `Starttempo ${(v[0] / spitze).toFixed(2)}`);
  assert.ok(lage >= 0.4 && lage <= 0.6, `Spitze bei ${lage}`);
  assert.equal(profil('ease_in_out', 0, STANDARD_VORLAUF), 0);
  assert.ok(Math.abs(profil('ease_in_out', 1, STANDARD_VORLAUF) - 1) < 1e-12);
});

test('dolly_out vergrößert den Abstand', () => {
  const f = baueFahrt({ baustein: 'dolly_out', ziel: 'held', blick: { abstand: 3 } }, kontext(0, 2));
  assert.ok(vergroesserung(f, 0, 2) < 1);
});

test('tilt_up kommt genau zur Ankunftszeit am Ziel an', () => {
  const f = baueFahrt({ baustein: 'tilt_up', von_ziel: 'fuss', ziel: 'kopf', blick: { abstand: 3, hoehe: -5 }, start: 0.2, ankunft: 1.1 }, kontext(0, 2));
  assert.ok(f.zustand(0.2).ziel.distanceTo(new THREE.Vector3(0, 0, -5)) < 1e-6);
  assert.ok(f.zustand(1.1).ziel.distanceTo(new THREE.Vector3(0, 3.3, -5)) < 1e-6);
  // nach der Ankunft fährt die Kamera weiter (nie eingefroren)
  assert.ok(f.zustand(1.5).pos.distanceTo(f.zustand(1.6).pos) > 0);
});

test('crane_down_tilt: startet hoch, endet in der Endposition', () => {
  const f = baueFahrt({ baustein: 'crane_down_tilt', ziel: 'held', blick: { abstand: 4, hoehe: 5 }, hoehe: 6 }, kontext(0, 2));
  assert.ok(f.zustand(0).pos.y > f.zustand(2).pos.y + 5);
  assert.ok(f.zustand(0).pos.distanceTo(f.zustand(1 / fps).pos) > 0.05, 'ease_out: schon im ersten Bild schnell');
});

test('track_follow hält den Abstand zur bewegten Figur', () => {
  const f = baueFahrt({ baustein: 'track_follow', folge: 'laeufer' }, kontext(0, 2));
  const a = f.zustand(0), b = f.zustand(2);
  const ankerA = new THREE.Vector3(0, 1.2, 0), ankerB = new THREE.Vector3(0, 1.2, -2);
  assert.ok(Math.abs(a.pos.distanceTo(ankerA) - b.pos.distanceTo(ankerB)) < 1e-9);
  assert.ok(b.pos.z < a.pos.z - 1.9, 'Kamera ist mitgefahren');
  // Versatz [0.5, 0.4, -3] lokal: hinter der nach −z schauenden Figur liegt +z
  assert.ok(a.pos.z > 2.5);
});

test('truck_side: Vordergrund-Objekt liegt zur Wischzeit mittig vor der Kamera', () => {
  const f = baueFahrt({ baustein: 'truck_side', ziel: 'held', blick: { abstand: 4 }, strecke: 1.5, vordergrund: { zeit: 0.6, abstand: 0.9 } }, kontext(0, 1.6));
  assert.equal(f.vordergrund.length, 1);
  const z = f.zustand(0.6);
  const vg = new THREE.Vector3(...f.vordergrund[0].position).setY(z.pos.y);
  const blick = z.ziel.clone().sub(z.pos).setY(0).normalize();
  const zumObjekt = vg.clone().sub(z.pos).setY(0).normalize();
  assert.ok(blick.dot(zumObjekt) > 0.9999, 'Objekt in Bildmitte');
  // seitliche Bewegung, kein Vor/Zurück
  const a = f.zustand(0), b = f.zustand(1.6);
  assert.ok(Math.abs(a.pos.distanceTo(b.pos) - 1.5) < 1e-9);
});

test('orbit: 20 °/s um das Ziel', () => {
  const f = baueFahrt({ baustein: 'orbit', ziel: 'held', blick: { abstand: 5, hoehe: 20 } }, kontext(0, 1.5));
  const a = f.zustand(0).pos.clone().sub(new THREE.Vector3(0, 1.5, 0)).setY(0);
  const b = f.zustand(1.5).pos.clone().sub(new THREE.Vector3(0, 1.5, 0)).setY(0);
  const grad = (a.angleTo(b) * 180) / Math.PI;
  assert.ok(Math.abs(grad - 30) < 1e-6, `${grad}°`);
});

test('whip: 0,3 s, schnelle Phase markiert, Ziel erreicht', () => {
  const f = baueFahrt({ baustein: 'whip', von_ziel: 'held', ziel: 'links', pos: [0, 1.5, 4], zeit: 0.6, dauer: 0.3, rate: 0 }, kontext(0, 1.5));
  const richtung = (t) => { const z = f.zustand(t); return z.ziel.clone().sub(z.pos).normalize(); };
  assert.ok(richtung(0.5).distanceTo(new THREE.Vector3(0, 0, -1)) < 1e-9);
  const zuLinks = new THREE.Vector3(-5, 0, -4).normalize();
  assert.ok(richtung(0.9).distanceTo(zuLinks) < 1e-9);
  assert.equal(f.schnell(0.75), true);
  assert.equal(f.schnell(0.2), false);
});

test('snap_zoom: +18 % in 2 Bildern, danach Push', () => {
  const f = baueFahrt({ baustein: 'snap_zoom', ziel: 'held', blick: { abstand: 4 }, fov: 50, faktor: 1.18, bilder: 2, rate: 0 }, kontext(0, 1.5));
  assert.equal(f.zustand(0).fov, 50);
  assert.ok(Math.abs(f.zustand(2 / fps).fov - fovSkaliert(50, 1.18)) < 1e-9);
  assert.ok(Math.abs(f.zustand(1).fov - fovSkaliert(50, 1.18)) < 1e-9);
});

test('shake: nur im Ereignisfenster, abklingend, ~1 % Bildbreite', () => {
  const f = baueFahrt({ baustein: 'push_in', ziel: 'held', blick: { abstand: 4 }, zusaetze: [{ baustein: 'shake', start: 0.5, dauer: 0.45 }] }, kontext(0, 1.5));
  assert.equal(f.zustand(0.4).gier, 0);
  assert.equal(f.zustand(1.0).gier, 0);
  let max = 0;
  for (let t = 0.5; t < 0.95; t += 1 / 120) max = Math.max(max, Math.abs(f.zustand(t).gier));
  const hfov = 2 * Math.atan(Math.tan((50 * Math.PI) / 360) * (9 / 16));
  assert.ok(max > 0 && max <= 0.011 * hfov, `max ${(max / hfov * 100).toFixed(2)} % der Bildbreite`);
});

test('Zeitplan: Schnitte auf Bildgrenzen, Lücken werden abgelehnt', () => {
  const ep = {
    einstellungen: [
      { id: 'A', start: 0, ende: 1.5, kamera: { baustein: 'push_in' } },
      { id: 'B', start: 1.5, ende: 3.2, kamera: { baustein: 'push_in' }, aktionen: [{ wer: 'x', was: 'gehen', start: 1.6 }, { wer: 'x', was: 'kopf_drehen', start: 2 }] },
    ],
  };
  const z = new Zeitplan(ep);
  assert.equal(z.gesamtBilder, 96);
  assert.equal(z.einstellungFuer(44).id, 'A');
  assert.equal(z.einstellungFuer(45).id, 'B');
  assert.ok(z.warnungen.some((w) => w.includes('Hauptaktionen')));
  assert.throws(() => new Zeitplan({ einstellungen: [{ start: 0, ende: 1, kamera: { baustein: 'push_in' } }, { start: 1.2, ende: 2, kamera: { baustein: 'push_in' } }] }), /lückenlos/);
});

test('Zeitplan: Aktion am Einstellungsbeginn (auf 4 Stellen gerundet) kommt nach der Stellung', () => {
  // Schnitt auf Bild 1747 = 58,23333… s; der Compiler schreibt die Aktion mit 58.2333
  const ep = {
    einstellungen: [
      { id: 'A', start: 0, ende: 58.2333, kamera: { baustein: 'push_in' } },
      { id: 'B', start: 58.2333, ende: 59.7333, kamera: { baustein: 'push_in' },
        stellung: { luke: { neu: true, position: [0, 0, 0] } },
        aktionen: [{ wer: 'luke', was: 'oeffnen', start: 58.2333, dauer: 0.03 }] },
    ],
  };
  const reihe = new Zeitplan(ep).aktionenJeFigur.get('luke').map((a) => a.was);
  assert.deepEqual(reihe, ['stellung', 'oeffnen']);
});
