// Zeitplan: Einstellungen, Schnitte und Aktionen einer Episode.
// Regeln (horror/docs/bewegungs-spec.md 1.2, 1.4, 3f):
//  - Einstellungen schneiden hart aneinander. Jede Einstellung = eine Kamera + eine Hauptaktion.
//  - Alle Zeiten sind Sekunden der Episode (wie timing.json), nicht relativ zur Einstellung.
//  - Ein Schnitt liegt auf dem Bild round(start · fps). Einstellung k umfasst die Bilder
//    [startBild_k, startBild_k+1). So gibt es weder Lücken noch doppelte Bilder.
//  - Aktionen haben Start und Dauer; danach bleibt die Pose stehen (Fortschritt bleibt 1).

// Aktionen ohne eigene Bewegung: zählen nicht als Hauptaktion.
export const NEBEN_AKTIONEN = new Set(['gesicht', 'stellung', 'sichtbar', 'pose']);

export class Zeitplan {
  constructor(episode) {
    this.fps = episode.fps ?? 30;
    this.warnungen = [];
    const roh = episode.einstellungen;
    if (!Array.isArray(roh) || roh.length === 0) throw new Error('Episode ohne "einstellungen"');

    // Einstellungen nach Start sortieren und auf Bildgrenzen legen.
    this.einstellungen = roh
      .map((e, i) => ({ ...e, index: i, id: e.id ?? `E${i + 1}` }))
      .sort((a, b) => a.start - b.start);
    this.einstellungen.forEach((e, i) => {
      if (!(e.ende > e.start)) throw new Error(`Einstellung ${e.id}: ende muss nach start liegen`);
      if (!e.kamera?.baustein) throw new Error(`Einstellung ${e.id}: kamera.baustein fehlt`);
      e.index = i;
      e.startBild = Math.round(e.start * this.fps);
      e.endeBild = Math.round(e.ende * this.fps);
    });
    for (let i = 0; i + 1 < this.einstellungen.length; i++) {
      const a = this.einstellungen[i], b = this.einstellungen[i + 1];
      if (a.endeBild !== b.startBild) {
        throw new Error(`Schnitt zwischen ${a.id} und ${b.id}: ende ${a.ende} s und start ${b.start} s liegen nicht auf demselben Bild (${a.endeBild} ≠ ${b.startBild}). Einstellungen müssen lückenlos aneinanderstoßen.`);
      }
    }
    this.startBild = this.einstellungen[0].startBild;
    this.gesamtBilder = this.einstellungen.at(-1).endeBild;

    // Aktionen sammeln: global (episode.aktionen) und je Einstellung.
    // "stellung" einer Einstellung wird zu einer Sofort-Aktion am Einstellungsbeginn.
    const aktionen = [];
    let nr = 0;
    const neu = (a, quelle) => {
      if (!a.wer || !a.was) throw new Error(`Aktion ohne wer/was in ${quelle}: ${JSON.stringify(a)}`);
      if (typeof a.start !== 'number') throw new Error(`Aktion ${a.was} (${a.wer}) in ${quelle}: start (Sekunden) fehlt`);
      aktionen.push({ ...a, params: a.params ?? {}, quelle, nr: nr++ });
    };
    for (const a of episode.aktionen ?? []) neu(a, 'episode');
    for (const e of this.einstellungen) {
      for (const [wer, st] of Object.entries(e.stellung ?? {})) {
        neu({ wer, was: 'stellung', start: e.startBild / this.fps, dauer: 0, params: st }, e.id);
      }
      for (const a of e.aktionen ?? []) neu(a, e.id);
    }
    // Chronologisch, bei gleicher Startzeit "stellung" zuerst, sonst in Schreibreihenfolge.
    // "Gleich" heißt: bis auf 0,1 ms. Die Stellung liegt exakt auf dem Schnittbild (startBild / fps, z. B.
    // 58,23333…), der Shotlisten-Compiler schreibt Aktionen ab Einstellungsbeginn aber auf 4 Stellen gerundet
    // (58,2333). Ohne Toleranz sortierte die Aktion VOR die Stellung, und deren Neuanfang verwarf sie
    // (Neubau Teil 2: die Luke blieb in der Rückblende zu, June stieg durch den geschlossenen Deckel).
    const zeitTakt = (x) => Math.round(x * 1e4);
    aktionen.sort((a, b) => zeitTakt(a.start) - zeitTakt(b.start) || (a.was === 'stellung' ? -1 : 0) - (b.was === 'stellung' ? -1 : 0) || a.nr - b.nr);
    this.aktionen = aktionen;
    this.aktionenJeFigur = new Map();
    for (const a of aktionen) {
      if (!this.aktionenJeFigur.has(a.wer)) this.aktionenJeFigur.set(a.wer, []);
      this.aktionenJeFigur.get(a.wer).push(a);
    }

    // Licht-Ereignisse und Partikel: global und je Einstellung, Zeiten absolut.
    const sammle = (schluessel) => [
      ...(episode[schluessel] ?? []),
      ...this.einstellungen.flatMap((e) => (e[schluessel] ?? []).map((x) => ({ ...x, quelle: e.id }))),
    ];
    this.lichtEreignisse = sammle('licht_ereignisse').sort((a, b) => a.start - b.start);
    this.partikel = sammle('partikel');

    this.pruefen();
  }

  // Einstellung zu einer Bildnummer (binäre Suche über die Schnittbilder).
  einstellungFuer(bild) {
    const es = this.einstellungen;
    if (bild < es[0].startBild || bild >= this.gesamtBilder) throw new Error(`Bild ${bild} liegt außerhalb der Episode (${es[0].startBild}–${this.gesamtBilder - 1})`);
    let lo = 0, hi = es.length - 1;
    while (lo < hi) {
      const mitte = (lo + hi + 1) >> 1;
      if (es[mitte].startBild <= bild) lo = mitte; else hi = mitte - 1;
    }
    return es[lo];
  }

  // Prüfregeln vor dem Render (bewegungs-spec.md 3f). Verstöße sind Warnungen, kein Abbruch,
  // damit Testszenen und Sonderfälle rendern dürfen.
  pruefen() {
    const w = this.warnungen;
    let statisch = 0;
    for (const e of this.einstellungen) {
      const dauer = (e.endeBild - e.startBild) / this.fps;
      if (dauer < 0.7 || dauer > 4.0) w.push(`${e.id}: Länge ${dauer.toFixed(2)} s außerhalb 0,7–4 s`);
      if (e.kamera.baustein === 'statisch' && !(e.kamera.rate > 0)) statisch++;
      const haupt = (e.aktionen ?? []).filter((a) => !NEBEN_AKTIONEN.has(a.was) && !a.nebenbei);
      if (haupt.length > 1) w.push(`${e.id}: ${haupt.length} Hauptaktionen (${haupt.map((a) => `${a.wer}.${a.was}`).join(', ')}), Regel: höchstens eine pro Einstellung (sonst "nebenbei": true)`);
    }
    const anteil = 1 - statisch / this.einstellungen.length;
    if (anteil < 0.9) w.push(`Nur ${(anteil * 100).toFixed(0)} % der Einstellungen mit Kamerabewegung (Ziel ≥ 90 %)`);
  }
}
