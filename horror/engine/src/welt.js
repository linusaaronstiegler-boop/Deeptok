// Welt: lädt Set- und Figurenmodule, setzt den Zustand aller Figuren für eine Zeit t
// und löst Anker auf ("held.kopf", "strasse.tuer").
//
// Kernidee (deterministisch, ohne Zustand zwischen Bildern):
//   Für jedes Bild wird jede Figur auf ihre Grundpose zurückgesetzt, dann werden ALLE Aktionen
//   mit start <= t der Reihe nach angewendet. Eine fertige Aktion steht mit Fortschritt 1 da,
//   ihre Pose bleibt also gehalten. Eine Aktion mischt immer vom aktuellen Wert (Ergebnis der
//   vorigen Aktionen) zu ihrem Ziel. So kann man jedes Bild einzeln und in jeder Reihenfolge rendern.

import * as THREE from 'three';
import { easeFunktion, fortschritt, mischen } from './ease.js';
import { wert, hash } from './zufall.js';

const GRAD = Math.PI / 180;

// Winkel mischen über den kürzeren Weg (für Drehungen um y).
export function mischeWinkel(a, b, p) {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return a + d * p;
}

export class Welt {
  constructor({ szene, episode, zeitplan, werkzeug, engineUrl, basisUrl, seed }) {
    this.szene = szene;
    this.episode = episode;
    this.zeitplan = zeitplan;
    this.ctx = werkzeug;
    this.engineUrl = engineUrl;
    this.basisUrl = basisUrl;
    this.seed = seed;
    this.sets = new Map();
    this.figuren = new Map();
    this.animationen = new Map(); // gemeinsame Animationsmodule aus engine/animationen/
    this.tAktuell = null;
    this.ankerCache = new Map();
    this.kameraPos = new THREE.Vector3(0, 1.6, 5); // Kamera am Einstellungsbeginn (für "zu": "kamera")
  }

  // Modul-Pfad: "name" -> engine/<ordner>/name.js; "./x.js" oder "pfad/x.js" -> relativ zur Episode.
  modulUrl(ordner, name) {
    if (name.endsWith('.js') || name.includes('/')) return new URL(name, this.basisUrl).href;
    return `${this.engineUrl}${ordner}/${name}.js`;
  }

  async laden() {
    for (const s of this.episode.sets ?? []) {
      if (!s.id || !s.modul) throw new Error(`Set braucht id und modul: ${JSON.stringify(s)}`);
      const mod = await import(this.modulUrl('sets', s.modul));
      if (typeof mod.default !== 'function') throw new Error(`Set-Modul ${s.modul} exportiert keine Standard-Funktion`);
      const inst = await mod.default({ ...this.ctx, zufall: (...t) => this.ctx.zufall('set', s.id, ...t) }, s.params ?? {});
      if (!inst?.gruppe) throw new Error(`Set-Modul ${s.modul} liefert keine gruppe`);
      inst.gruppe.position.set(...(s.position ?? [0, 0, 0]));
      inst.gruppe.rotation.y = (s.drehung ?? 0) * GRAD;
      inst.gruppe.name = `set:${s.id}`;
      this.szene.add(inst.gruppe);
      this.sets.set(s.id, { spec: s, inst });
    }
    for (const f of this.episode.figuren ?? []) {
      if (!f.id || !f.modul) throw new Error(`Figur braucht id und modul: ${JSON.stringify(f)}`);
      const mod = await import(this.modulUrl('figuren', f.modul));
      if (typeof mod.default !== 'function') throw new Error(`Figuren-Modul ${f.modul} exportiert keine Standard-Funktion`);
      const inst = await mod.default({ ...this.ctx, zufall: (...t) => this.ctx.zufall('figur', f.id, ...t) }, f.params ?? {});
      for (const pflicht of ['gruppe', 'gelenke', 'grundpose']) {
        if (!inst?.[pflicht]) throw new Error(`Figuren-Modul ${f.modul} liefert kein "${pflicht}"`);
      }
      inst.gruppe.name = `figur:${f.id}`;
      this.szene.add(inst.gruppe);
      this.figuren.set(f.id, { spec: f, inst, aktionen: this.zeitplan.aktionenJeFigur.get(f.id) ?? [] });
    }
    // Alle benutzten Animationen vorab laden (eigene der Figur haben Vorrang). Dazu zählen auch
    // Posen: "pose" einer Figur und "pose" in einer Stellung (werden mit Fortschritt 1 angewendet).
    const benutzt = [];
    for (const [id, f] of this.figuren) if (f.spec.pose) benutzt.push({ wer: id, was: f.spec.pose });
    for (const a of this.zeitplan.aktionen) {
      benutzt.push(a);
      if (a.was === 'stellung' && a.params?.pose) benutzt.push({ wer: a.wer, was: a.params.pose });
    }
    for (const a of benutzt) {
      const fig = this.figuren.get(a.wer);
      if (!fig) throw new Error(`Aktion ${a.was}: Figur "${a.wer}" gibt es nicht`);
      if (['gesicht', 'stellung', 'sichtbar'].includes(a.was) || fig.inst.animationen?.[a.was]) continue;
      if (!this.animationen.has(a.was)) {
        try {
          const mod = await import(this.modulUrl('animationen', a.was));
          this.animationen.set(a.was, mod.default);
        } catch (e) {
          throw new Error(`Animation "${a.was}" (Figur ${a.wer}) nicht gefunden: weder in der Figur noch als engine/animationen/${a.was}.js (${e.message})`);
        }
      }
    }
  }

  animation(fig, was) {
    return fig.inst.animationen?.[was] ?? this.animationen.get(was);
  }

  // Sichtbare Sets je Einstellung: einstellung.set = "id" oder ["id", …]; ohne Angabe alle.
  setzeSichtbareSets(einstellung) {
    const liste = einstellung.set === undefined ? null : [].concat(einstellung.set);
    for (const [id, s] of this.sets) s.inst.gruppe.visible = !liste || liste.includes(id);
  }

  // Blinzeln: alle 1–2 s für 0,1 s (3 Bilder), Zeitpunkte aus dem Seed der Figur.
  blinzelt(id, t) {
    const seed = hash(`${this.seed}|blinzeln|${id}`);
    let z = 0.4 + wert(seed, 0) * 1.0;
    for (let i = 1; z <= t; i++) {
      if (t < z + 0.1) return true;
      z += 1.0 + wert(seed, i) * 1.0;
    }
    return false;
  }

  // Zustand aller Figuren und animierten Sets für die Zeit t setzen.
  zustandSetzen(t) {
    // Reihenfolge-unabhängig: Schaut eine Figur auf eine andere ("zu": "monster.kopf"), wird die
    // andere zuerst auf dieselbe Zeit gesetzt (siehe _zielPunkt). Sonst hinge das Bild davon ab,
    // welche Zeit vorher berechnet wurde, und parallele Prozesse lieferten andere Bilder.
    this._durchgang = { t, fertig: new Set(), inArbeit: new Set() };
    for (const [id, fig] of this.figuren) {
      if (!this._durchgang.fertig.has(id)) this._figurSetzen(id, fig, t);
    }
    this._durchgang = null;
    for (const [, s] of this.sets) s.inst.aktualisiere?.(t);
    this.szene.updateMatrixWorld(true);
    this.tAktuell = t;
  }

  _figurSetzen(id, fig, t) {
    this._durchgang?.inArbeit.add(id);
    const { inst, spec } = fig;
    inst.grundpose();
    const g = inst.gruppe;
    g.position.set(...(spec.position ?? [0, 0, 0]));
    g.rotation.set(0, (spec.blick ?? 0) * GRAD, 0);
    g.visible = spec.sichtbar ?? true;
    let gesicht = spec.gesicht ?? inst.gesichter?.[0] ?? null;
    const anwenden = (was, p, params, a) => {
      const anim = this.animation(fig, was);
      if (!anim) throw new Error(`Animation "${was}" fehlt für Figur ${id}`);
      const dauer = a?.dauer ?? anim.dauer ?? 0;
      anim.anwenden(inst, p, params, {
        t, roh: a ? fortschritt(t, a.start, dauer) : 1, tLokal: a ? Math.min(Math.max(0, t - a.start), dauer) : 0, dauer,
        mischen, mischeWinkel, GRAD, welt: this, figurId: id, THREE,
        // Zielpunkt für Blick/Zeigen: "kamera" (Position am Einstellungsbeginn), [x,y,z] oder Anker
        // (andere Figuren werden dafür zuerst auf dieselbe Zeit gesetzt).
        zielPunkt: (z) => this._zielPunkt(z),
      });
    };
    if (spec.pose) anwenden(spec.pose, 1, spec.pose_params ?? {}, null);

    for (const a of fig.aktionen) {
      if (a.start > t) break;
      if (a.was === 'gesicht') { gesicht = a.params.name ?? a.gesicht; continue; }
      if (a.was === 'sichtbar') { g.visible = a.params.wert !== false; continue; }
      if (a.was === 'stellung') {
        const st = a.params;
        if (st.position) g.position.set(...st.position);
        if (st.blick !== undefined) g.rotation.y = st.blick * GRAD;
        if (st.gesicht) gesicht = st.gesicht;
        if (st.sichtbar !== undefined) g.visible = st.sichtbar;
        if (st.pose) anwenden(st.pose, 1, st.pose_params ?? {}, null);
        continue;
      }
      const anim = this.animation(fig, a.was);
      const dauer = a.dauer ?? anim.dauer ?? 0.3;
      const ease = easeFunktion(a.ease ?? anim.ease ?? 'ease_in_out');
      anwenden(a.was, ease(fortschritt(t, a.start, dauer)), a.params, { ...a, dauer });
    }

    if (inst.setzeGesicht && gesicht) {
      const zu = spec.blinzeln !== false && inst.setzeBlinzeln && this.blinzelt(id, t);
      inst.setzeGesicht(gesicht);
      inst.setzeBlinzeln?.(zu);
    }
    // Leerlauf-Atmen (Spec 1.8: an, 0,15–0,5 % der Bildbreite) – die Figur entscheidet, wie.
    if (spec.atmen !== false && inst.atmen) inst.atmen(t, spec.atmen_staerke ?? 1, hash(`${this.seed}|${id}`));
    if (this._durchgang) { this._durchgang.inArbeit.delete(id); this._durchgang.fertig.add(id); }
  }

  // Zielpunkt für Blick und Zeigen innerhalb eines Durchgangs.
  _zielPunkt(z) {
    if (z === 'kamera') return this.kameraPos.clone();
    if (Array.isArray(z)) return new THREE.Vector3(...z);
    const id = z.split('.')[0];
    const d = this._durchgang;
    const fig = this.figuren.get(id);
    // Andere Figur noch nicht auf diese Zeit gesetzt? Erst sie setzen (bei Zyklen: aktueller Stand).
    if (d && fig && !d.fertig.has(id) && !d.inArbeit.has(id)) this._figurSetzen(id, fig, d.t);
    return this._ankerJetzt(z);
  }

  // Anker zur Zeit t. Liegt t nicht beim aktuellen Zustand, wird kurz umgestellt und das
  // Ergebnis gemerkt (Kamera-Bausteine fragen oft nach dem Einstellungsbeginn).
  anker(name, t) {
    if (t === this.tAktuell) return this._ankerJetzt(name);
    const schluessel = `${name}@${t.toFixed(5)}`;
    if (this.ankerCache.has(schluessel)) return this.ankerCache.get(schluessel).clone();
    const vorher = this.tAktuell;
    this.zustandSetzen(t);
    const v = this._ankerJetzt(name);
    if (vorher !== null) this.zustandSetzen(vorher);
    this.ankerCache.set(schluessel, v.clone());
    return v;
  }

  ausrichtung(name, t) {
    const id = name.split('.')[0];
    const fig = this.figuren.get(id);
    if (!fig) return 0;
    if (t !== this.tAktuell) {
      const vorher = this.tAktuell;
      this.zustandSetzen(t);
      const y = fig.inst.gruppe.rotation.y;
      if (vorher !== null) this.zustandSetzen(vorher);
      return y;
    }
    return fig.inst.gruppe.rotation.y;
  }

  _ankerJetzt(name) {
    const [id, ...rest] = name.split('.');
    const teil = rest.join('.');
    const fig = this.figuren.get(id);
    if (fig) {
      if (!teil || teil === 'wurzel') return fig.inst.gruppe.getWorldPosition(new THREE.Vector3());
      const a = fig.inst.anker?.[teil] ?? fig.inst.gelenke?.[teil];
      if (!a) throw new Error(`Anker "${name}": Figur ${id} hat keinen Anker "${teil}". Vorhanden: ${Object.keys(fig.inst.anker ?? {}).join(', ')}`);
      return a.getWorldPosition(new THREE.Vector3());
    }
    const set = this.sets.get(id);
    if (set) {
      const a = set.inst.anker?.[teil];
      if (!a) throw new Error(`Anker "${name}": Set ${id} hat keinen Anker "${teil}". Vorhanden: ${Object.keys(set.inst.anker ?? {}).join(', ')}`);
      if (Array.isArray(a)) return set.inst.gruppe.localToWorld(new THREE.Vector3(...a));
      return a.getWorldPosition(new THREE.Vector3());
    }
    throw new Error(`Anker "${name}": weder Figur noch Set "${id}"`);
  }

  // Kamerapunkt aus einem Set: "strasse.totale" -> { pos, ziel, fov } in Weltkoordinaten.
  kamerapunkt(name) {
    const [id, teil] = name.split('.');
    const set = this.sets.get(id);
    const kp = set?.inst.kamerapunkte?.[teil];
    if (!kp) throw new Error(`Kamerapunkt "${name}" unbekannt`);
    const welt = (v) => (Array.isArray(v) ? set.inst.gruppe.localToWorld(new THREE.Vector3(...v)).toArray() : v);
    return { pos: welt(kp.pos), ziel: welt(kp.ziel), fov: kp.fov };
  }

  // Vordergrund-Objekt für Seitenfahrten (Wisch). Ein Set kann eigene Prefabs liefern.
  baueVordergrund(v) {
    for (const [, s] of this.sets) {
      const prefab = s.inst.vordergrund?.[v.art];
      if (prefab) return prefab(v);
    }
    const c = this.ctx;
    const m = c.mat(v.farbe, { rauheit: 0.95 });
    const g = new THREE.Group();
    if (v.art === 'baum') {
      g.add(c.setze(c.zylinder(v.breite * 0.45, v.breite * 0.55, v.hoehe, m, { segmente: 7 }), null, 0, v.hoehe / 2, 0));
    } else if (v.art === 'wand') {
      g.add(c.setze(c.kiste(1.6, v.hoehe, 0.2, m), null, 0, v.hoehe / 2, 0));
    } else if (v.art === 'pfosten') {
      g.add(c.setze(c.kiste(v.breite, v.hoehe, v.breite, m, { rund: 0.03 }), null, 0, v.hoehe / 2, 0));
    } else {
      throw new Error(`Vordergrund-Art "${v.art}" unbekannt (pfosten, baum, wand oder Set-Prefab)`);
    }
    return g;
  }
}
