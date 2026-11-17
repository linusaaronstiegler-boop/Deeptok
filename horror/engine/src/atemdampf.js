// Atemdampf je Figur (Rules of Kindly, Bibel §2 und §10.7): eine dichte, stehende Wolke vor dem Mund
// statt dünner Partikel. In Kindly dampft draußen jeder Atem, immer und bei allen; wer NICHT dampft, ist
// die Kopie. Das Suchbild trägt die ganze Wendung von Folge 1, also muss der Dampf auch nach der
// Kompression der Plattformen in unter 1 s auffallen (Tor: test/atem-probe.mjs).
//
// Aufbau: Jeder Atemzug ist eine "Generation" aus 7 weichen Wolkenflecken (three.js-Sprites, schauen immer
// zur Kamera). Eine Generation beginnt am Mund, wird in 0,6 s zur Wolke von etwa Kopfgröße, bleibt vor dem
// Gesicht stehen, steigt langsam und löst sich bis 3,4 s auf. Alle 2,9 s (± 0,25 s, aus dem Seed) beginnt
// die nächste, also hängt fast immer eine Wolke vor dem Mund. Alles ist eine Formel aus t (kein Zustand
// zwischen Bildern, Regel 2 der Modul-Autoren): Bild i sieht in jedem Prozess gleich aus.
//
// Licht: Sprites sind unbeleuchtet. Die Helligkeit rechnet onBeforeRender aus den Lichtern der Szene:
//   Grund   = Himmel-/Bodenlicht + Hauptlicht (wie ein heller, matter Stoff),
//   Gegenlicht = Punktlichter in der Nähe (Laterne am Steg), stark nach vorn gestreut, wenn das Licht
//   HINTER der Wolke steht (Blick Kamera→Wolke zeigt zum Licht). So leuchtet der Dampf im Gegenlicht auf.
// Nah an der Linse blendet die Wolke aus (Review Teil 2: der Atem lag als weißer Ball vor der Kamera).
//
// Schalten (alles optional, in figuren[].params):
//   dampf          true | false (Std true): Atemdampf überhaupt
//   dampf_aus_ab   Sekunden: ab hier keine neuen Atemzüge mehr (die Kopie, Bibel S34; die letzte Wolke
//                  löst sich natürlich auf: Dampf verschwindet nie schlagartig)
//   dampf_aus      [[von, bis], …]: in diesen Fenstern kein Dampf, auch keine Reste (drinnen, Hütte)
//   dampf_staerke  Deckkraft-Faktor (Std 1), dampf_groesse (Std 1), dampf_periode (Std 2.9 s),
//   dampf_hell     Helligkeits-Faktor (Std 1), dampf_farbe (Std '#eef3fa')
// Aktion (animationen/dampf.js): { "was": "dampf", "params": { "wert": false } } schaltet ab dem Start
// sofort aus (true wieder an), "staerke" und "hell" ändern Deckkraft und Helligkeit für diese Einstellung.
// Atem anhalten (Aktion atem_anhalten, idle_atmen staerke 0): keine neuen Atemzüge, solange angehalten.
import * as THREE from 'three';
import { wert, hash } from './zufall.js';

const glatt = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
const LEBEN = 3.4;          // s, bis eine Wolke ganz aufgelöst ist
const FLECKEN = 7;          // Sprites je Atemzug
const PLAETZE = 3;          // Plätze für Atemzüge: zwei im Wechsel (Periode 2,9 s < Leben 3,4 s), einer für den Hauch

// Weiche Wolken-Textur: viele überlagerte Gauß-Flecken, nach außen ausfransend (nicht nur eine Scheibe,
// sonst sieht der Dampf aus wie ein Lichtpunkt). Drei Varianten, Zufall mit festem Seed.
const texturen = new WeakMap();
function wolkenTexturen(ctx) {
  if (texturen.has(ctx)) return texturen.get(ctx);
  const liste = [0, 1, 2].map((v) => {
    let s = 977 + v * 131;
    const z = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const tex = ctx.zeichenTextur((g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.globalCompositeOperation = 'lighter';
      // dichter Kern, darum lockere Ballen
      const ballen = [[0.5, 0.52, 0.3, 0.5]];
      for (let i = 0; i < 9; i++) {
        const wnk = z() * Math.PI * 2, r = 0.1 + z() * 0.17;
        ballen.push([0.5 + Math.cos(wnk) * r, 0.52 + Math.sin(wnk) * r * 0.8, 0.12 + z() * 0.12, 0.16 + z() * 0.16]);
      }
      for (const [x, y, r, a] of ballen) {
        const gr = g.createRadialGradient(x * w, y * h, 0, x * w, y * h, r * w);
        gr.addColorStop(0, `rgba(255,255,255,${a})`);
        gr.addColorStop(0.55, `rgba(255,255,255,${a * 0.55})`);
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
      }
      g.globalCompositeOperation = 'source-over';
    }, 128, 128);
    tex.colorSpace = THREE.NoColorSpace;
    return tex;
  });
  texturen.set(ctx, liste);
  return liste;
}

// Lichter der Szene einmal einsammeln (die Zahl der Lichter ist fest, licht.js); Stärken liest jedes Bild neu.
const lichterJeSzene = new WeakMap();
function lichter(szene) {
  if (lichterJeSzene.has(szene)) return lichterJeSzene.get(szene);
  const l = { hemi: null, richtung: [], punkte: [] };
  szene.traverse((o) => {
    if (o.isHemisphereLight && !l.hemi) l.hemi = o;
    else if (o.isDirectionalLight) l.richtung.push(o);
    else if (o.isPointLight) l.punkte.push(o);
  });
  lichterJeSzene.set(szene, l);
  return l;
}
const hellig = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
function sichtbarBisOben(o) { for (let x = o; x; x = x.parent) if (!x.visible) return false; return true; }

// fig: Figur-Instanz (gruppe, anker.mund, gelenke.kopf). opt: siehe Kopf der Datei (Namen ohne "dampf_").
export function baueAtemdampf(ctx, fig, opt = {}) {
  const gruppe = new THREE.Group();
  gruppe.name = 'atemdampf';
  fig.gruppe.add(gruppe);
  const farbe = new THREE.Color(opt.farbe ?? '#eef3fa');
  const periode = opt.periode ?? 2.9;
  const groesse = opt.groesse ?? 1;
  const deck = opt.staerke ?? 1;
  const hell = opt.hell ?? 1;
  const seed = hash(`dampf|${opt.seed ?? 'figur'}`);
  const phase0 = wert(seed, 999) * periode;
  const aus = (opt.aus ?? []).map(([a, b]) => [a, b ?? Infinity]);
  const ausAb = opt.aus_ab ?? Infinity;
  const an = opt.an !== false;
  const tex = wolkenTexturen(ctx);

  const sprites = [];
  for (let i = 0; i < PLAETZE * FLECKEN; i++) {
    const m = new THREE.SpriteMaterial({ map: tex[i % 3], color: farbe.clone(), transparent: true, depthWrite: false, opacity: 0 });
    m.toneMapped = true;
    const s = new THREE.Sprite(m);
    s.visible = false;
    s.renderOrder = 2;
    s.userData = { deck: 0 };
    // Helligkeit und Linsen-Abstand erst beim Zeichnen: dann sind Kamera und Lichter dieses Bildes bekannt
    s.onBeforeRender = (renderer, szene, kamera) => {
      const p = s.getWorldPosition(new THREE.Vector3());
      const l = lichter(szene);
      let grund = 0;
      if (l.hemi) grund += l.hemi.intensity * (hellig(l.hemi.color) * 0.7 + hellig(l.hemi.groundColor) * 0.3);
      for (const d of l.richtung) grund += d.intensity * hellig(d.color) * (d.castShadow ? 0.45 : 0.2);
      // Gegenlicht: Vorwärtsstreuung an Punktlichtern (Laterne) in Reichweite
      const blick = p.clone().sub(kamera.position).normalize();
      let streu = 0;
      for (const pl of l.punkte) {
        if (!(pl.intensity > 0) || !sichtbarBisOben(pl)) continue;
        const lp = pl.getWorldPosition(new THREE.Vector3());
        const zuLicht = lp.sub(p);
        const d = zuLicht.length();
        const reichweite = pl.distance > 0 ? pl.distance : 12;
        if (d > reichweite) continue;
        const abfall = (1 - d / reichweite) ** 2;
        const vorn = Math.max(0, blick.dot(zuLicht.normalize()));
        streu += pl.intensity * hellig(pl.color) * abfall * (0.3 + 2.6 * vorn ** 4);
      }
      const f = (grund / Math.PI) * 1.15 * hell * s.userData.hell + streu * 0.16 * hell * s.userData.hell;
      m.color.copy(farbe).multiplyScalar(f);
      // nah an der Linse ausblenden (unter 0,35 m weg, ab 0,9 m voll)
      const abstand = p.distanceTo(kamera.position);
      m.opacity = s.userData.deck * glatt(0.35, 0.9, abstand);
    };
    gruppe.add(s);
    sprites.push(s);
  }

  // Zustand je Bild: wird in grundpose() zurückgesetzt und von den Aktionen "dampf" und "hauchen" geändert.
  // hauch = { start, ziel (Weltpunkt oder null), staerke }: ein gezielter, kräftiger Atemzug (auf Odells Brille)
  const zustand = { wert: null, staerke: 1, hell: 1, hauch: null };
  const aktivBei = (t) => an && t < ausAb && !aus.some(([a, b]) => t >= a && t < b);
  const imFenster = (t) => aus.some(([a, b]) => t >= a && t < b);
  const _mund = new THREE.Vector3(), _vor = new THREE.Vector3(), _q = new THREE.Quaternion();

  // Ein Atemzug in Platz "platz": nr = Zufallsnummer, alter in s, vorH/seite = Richtungen im Figurensystem,
  // weite = Faktor auf die Strecke nach vorn, dicht = Faktor auf die Deckkraft
  function zug(platz, nr, alter, vorH, seite, { weite = 1, dicht = 1, unten = 1 } = {}) {
    const huelle = glatt(0, 0.2, alter) * (1 - glatt(1.1, LEBEN, alter)) ** 1.15;
    // vorn: schnell aus dem Mund (0,35 s), dann bremst die Wolke und bleibt etwa 0,3 m vor dem Mund stehen.
    // Höhe: unter dem Mund (vor Kinn und Kragen), so bleiben Augen und Mund in Vorderansichten frei.
    const weg = (0.26 * weite * (1 - Math.exp(-alter / 0.28)) + 0.03 * alter) * groesse;
    // erst schräg nach unten (Atem aus Nase und Mund), dann steigt die Wolke langsam auf Mundhöhe
    const steigen = (-0.11 * unten * (1 - Math.exp(-alter / 0.3)) + 0.03 * alter) * groesse;
    const drift = (wert(seed, nr * 7 + 3) - 0.5) * 0.12 * groesse;   // jeder Atemzug weht etwas anders
    for (let j = 0; j < FLECKEN; j++) {
      const s = sprites[platz * FLECKEN + j];
      const r = (n) => wert(seed, nr * 97 + j * 11 + n);
      const ausbreitung = (0.35 + 1.0 * glatt(0, 1.8, alter)) * groesse;
      const versatz = new THREE.Vector3()
        .addScaledVector(seite, (r(1) - 0.5) * 0.18 * ausbreitung + drift * alter)
        .addScaledVector(vorH, weg * (0.75 + 0.5 * r(2)) + (r(3) - 0.5) * 0.08 * ausbreitung);
      versatz.y += steigen + (r(4) - 0.5) * 0.08 * ausbreitung;
      s.position.copy(_mund).add(versatz);
      // Fleckgröße: nach der ersten Atem-Probe 20 % größer (in Feed-Größe 270 × 480 war die Wolke nur ~25 px breit)
      const d = (0.07 + 0.24 * (1 - Math.exp(-alter / 0.5))) * (0.75 + 0.5 * r(5)) * groesse;
      s.scale.set(d, d, 1);
      s.material.rotation = r(6) * Math.PI * 2 + alter * (r(7) - 0.5) * 0.6;
      // Kernflecken dichter als die äußeren
      s.userData.deck = Math.min(0.95, huelle * (j < 3 ? 0.85 : 0.6) * (0.8 + 0.4 * r(8)) * deck * zustand.staerke * dicht);
      s.userData.hell = zustand.hell;
      s.visible = s.userData.deck > 0.003;
    }
  }

  function aktualisiere(t) {
    for (const s of sprites) s.visible = false;
    if (!an || zustand.wert === false || imFenster(t)) return;
    // Mund und Blickrichtung des Kopfes im System der Figur (gruppe dreht nur um y, Dampf steigt senkrecht)
    fig.gruppe.updateMatrixWorld(true);
    fig.anker.mund.getWorldPosition(_mund);
    fig.gruppe.worldToLocal(_mund);
    fig.gelenke.kopf.getWorldQuaternion(_q);
    const gq = fig.gruppe.getWorldQuaternion(new THREE.Quaternion());
    _vor.set(0, 0, 1).applyQuaternion(gq.invert().multiply(_q));
    const vorH = new THREE.Vector3(_vor.x, Math.min(_vor.y, 0.25), _vor.z);
    if (vorH.lengthSq() < 1e-4) vorH.set(0, 0, 1);
    vorH.normalize();
    const seite = new THREE.Vector3(vorH.z, 0, -vorH.x).normalize();
    const angehalten = (fig.atemFaktor ?? 1) < 0.5;
    const h = zustand.hauch;
    const k0 = Math.floor((t - phase0) / periode);
    for (let k = k0 - 1; k <= k0; k++) {
      const tk = phase0 + k * periode + (wert(seed, k) - 0.5) * 0.5;
      const alter = t - tk;
      if (alter < 0 || alter >= LEBEN) continue;
      if (!aktivBei(tk)) continue;                     // nach dem Abschalten: kein neuer Atemzug
      if (angehalten && alter < 0.5) continue;         // Luft angehalten: der begonnene Zug bleibt aus
      if (h && tk > h.start - 1.2 && tk < h.start + 1.6) continue;   // rund um den Hauch kein normaler Zug
      zug(((k % 2) + 2) % 2, k, alter, vorH, seite);
    }
    // Gezielter Hauch (Aktion "hauchen"): kräftig, weiter nach vorn zum Ziel, kaum nach unten
    if (h && aktivBei(h.start) && t >= h.start && t - h.start < LEBEN) {
      let richtung = vorH, seiteH = seite;
      if (h.ziel) {
        const z = fig.gruppe.worldToLocal(h.ziel.clone()).sub(_mund);
        if (z.lengthSq() > 1e-4) { richtung = z.normalize(); seiteH = new THREE.Vector3(richtung.z, 0, -richtung.x).normalize(); }
      }
      zug(2, 5000 + Math.round(h.start * 30), t - h.start, richtung, seiteH, { weite: 1.6 * h.staerke, dicht: 1.25 * h.staerke, unten: 0.25 });
    }
  }

  return {
    gruppe,
    zustand,
    zuruecksetzen() { zustand.wert = null; zustand.staerke = 1; zustand.hell = 1; zustand.hauch = null; },
    aktualisiere,
  };
}

// Für Figurenmodule: Dampf aus den params lesen (dampf, dampf_aus_ab, dampf_aus, dampf_staerke, …),
// an die Figur hängen, grundpose() erweitern und fig.aktualisiere(t) setzen (welt.js ruft es nach allen
// Aktionen auf). std: Vorgaben des Moduls (z. B. { an: false } für Odell in Hiding Night).
const opt0 = (g) => g ?? 1;
export function dampfFuerFigur(ctx, fig, params = {}, std = {}) {
  const an = params.dampf ?? std.an ?? true;
  const d = baueAtemdampf(ctx, fig, {
    an,
    aus_ab: params.dampf_aus_ab ?? std.aus_ab,
    aus: params.dampf_aus ?? std.aus,
    staerke: params.dampf_staerke ?? std.staerke,
    groesse: params.dampf_groesse ?? std.groesse,
    periode: params.dampf_periode ?? std.periode,
    hell: params.dampf_hell ?? std.hell,
    farbe: params.dampf_farbe ?? std.farbe,
    // eigener Takt je Figur (Seed aus Episode + Figuren-ID), sonst atmen alle im Gleichschritt
    seed: params.dampf_seed ?? std.seed ?? Math.floor(ctx.zufall('dampf')() * 1e9),
  });
  fig.dampf = d;
  // Anker "dampf": wo die stehende Wolke hängt (0,25 m vor dem Mund, 8 cm tiefer; dreht mit dem Kopf).
  // Für Kameras und für die Messung der Atem-Probe (test/atem-probe.mjs).
  if (fig.anker?.mund?.parent && !fig.anker.dampf) {
    const m = fig.anker.mund.position;
    const a = new THREE.Object3D();
    a.position.set(m.x, m.y - 0.08 * (opt0(params.dampf_groesse)), m.z + 0.25 * (opt0(params.dampf_groesse)));
    fig.anker.mund.parent.add(a);
    fig.anker.dampf = a;
  }
  const gp = fig.grundpose;
  fig.grundpose = () => { gp(); d.zuruecksetzen(); };
  const vorher = fig.aktualisiere;
  fig.aktualisiere = (t) => { vorher?.(t); d.aktualisiere(t); };
  return d;
}
