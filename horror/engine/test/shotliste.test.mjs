// Tests für den Shotlisten-Compiler und sein Messtor (node --test).
// Grundlage ist Folge 1 (episoden/folge-01). Fehlen deren Eingaben (timing.json, bildideen.json,
// regie.mjs), werden die Tests übersprungen.
// Geprüft wird: die echte Folge besteht das Messtor, und absichtlich eingebaute Fehler werden erkannt.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { kompiliere, messtor } from '../shotliste.mjs';

const ORDNER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../episoden/folge-01');
const da = ['timing.json', 'bildideen.json', 'regie.mjs'].every((n) => fs.existsSync(path.join(ORDNER, n)));
const opt = { skip: da ? false : 'Folge 1 fehlt (timing.json, bildideen.json, regie.mjs)' };

// Frisch kompilieren und eine tiefe Kopie zum Verändern liefern
async function frisch() {
  const erg = await kompiliere(ORDNER);
  return { ...erg, episode: JSON.parse(JSON.stringify(erg.episode)) };
}
const hat = (tor, praefix) => tor.verstoesse.some((v) => v.startsWith(praefix));

test('Folge 1 besteht das Messtor', opt, async () => {
  const tor = messtor(await frisch());
  assert.deepEqual(tor.verstoesse, []);
  const k = tor.kennzahlen;
  assert.ok(k.median_s >= 1.4 && k.median_s <= 1.6, `Median ${k.median_s}`);
  assert.ok(k.pro_minute >= 38 && k.pro_minute <= 45, `${k.pro_minute}/min`);
  assert.equal(k.endkarte_dauer_s, 1);
});

test('Schnitte liegen auf Bildgrenzen, lückenlos, 1 Bild vor dem Wortbeginn', opt, async () => {
  const { episode, timing } = await frisch();
  const es = episode.einstellungen;
  for (let i = 1; i < es.length; i++) assert.equal(es[i].start, es[i - 1].ende, `${es[i].id} schließt nicht an`);
  for (const e of es.filter((x) => !x.plan.endkarte).slice(1)) {
    const w = timing.woerter[e.plan.woerter[0]];
    const vor = Math.round(w.start * 30) - Math.round(e.start * 30);
    assert.ok(vor >= 0 && vor <= 2, `${e.id}: ${vor} Bilder vor „${w.wort}“`);
  }
});

test('Messtor erkennt einen Schnitt nach dem Wortbeginn', opt, async () => {
  const erg = await frisch();
  const es = erg.episode.einstellungen;
  es[5].start += 3 / 30; es[4].ende = es[5].start;   // Schnitt 3 Bilder zu spät
  assert.ok(hat(messtor(erg), 'M1'));
});

test('Messtor erkennt eine zweite Hauptaktion und eine verrutschte Aktion', opt, async () => {
  const erg = await frisch();
  const e = erg.episode.einstellungen.find((x) => x.plan.haupt.art === 'aktion');
  const a = e.aktionen.find((x) => x.was === e.plan.haupt.was);
  e.aktionen.push({ ...a, start: a.start + 0.1 });            // zweite Hauptaktion
  e.plan.haupt.start += 0.4;                                  // 0,4 s neben dem Schlüsselwort
  const tor = messtor(erg);
  assert.ok(tor.verstoesse.some((v) => v.startsWith(`M5 ${e.id}`) && v.includes('Hauptaktionen')));
  assert.ok(tor.verstoesse.some((v) => v.startsWith(`M5 ${e.id}`) && v.includes('neben')));
});

test('Messtor erkennt stehende Kamera, zu viele Lichtereignisse und fehlende Endkarte', opt, async () => {
  const erg = await frisch();
  const es = erg.episode.einstellungen;
  for (const e of es.slice(0, 8)) e.kamera = { baustein: 'statisch', ziel: [0, 1, 0] };
  for (const e of es.slice(10, 14)) e.licht_ereignisse = [{ art: 'aus', ziel: 'umgebung', start: e.start + 0.1, dauer: 0.3 }];
  es.pop();
  const tor = messtor(erg);
  for (const m of ['M3', 'M7', 'M8', 'M11']) assert.ok(hat(tor, m), `${m} nicht erkannt: ${tor.verstoesse.join(' | ')}`);
});

test('Messtor erkennt zu lange Einstellungen und Kamera auf unsichtbare Figur', opt, async () => {
  const erg = await frisch();
  const es = erg.episode.einstellungen;
  es[2].ende = es[3].ende; es.splice(3, 1);                    // zwei Einstellungen zu einer
  es[6].kamera.ziel = 'june.kopf';
  const tor = messtor(erg);
  assert.ok(hat(tor, 'M2'));
  assert.ok(hat(tor, 'M12'));
});

test('Messtor erkennt ein Wisch-Objekt direkt vor der Linse (M13)', opt, async () => {
  const erg = await frisch();
  const e = erg.episode.einstellungen.find((x) => x.kamera.baustein === 'truck_side');
  e.kamera.vordergrund = { zeit: e.start + 0.3, abstand: 1.0, art: 'pfosten' };
  assert.ok(hat(messtor(erg), 'M13'));
  delete e.kamera.vordergrund;                                  // ohne Angabe stellt truck_side 0,9 m vor die Linse
  assert.ok(hat(messtor(erg), 'M13'));
});
