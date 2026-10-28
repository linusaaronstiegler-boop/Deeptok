// Bau-Skript des Goldstandards "Opportunitätskosten" (Bauweise A+ aus dem Bühnen-Spike).
//
//   node build/bauen.mjs                 (aus studio/gold-opportunitaetskosten/)
//   node build/bauen.mjs --ohne-messen   (ohne die Textbreiten-Prüfung im Browser)
//
// Was es tut, in dieser Reihenfolge:
//   1. ZEITEN: liest assets/timing.json (geschrieben von build/voice.py). Jeder Cue ist der
//      Anfang eines gesprochenen Worts. Das Bild setzt 2 Bilder (67 ms) davor ein
//      (DESIGN.md §9 "Titel-Timing"). Daraus leitet ableiten() alle weiteren Zeiten ab.
//      pruefeZeiten() bricht ab, wenn eine Haltezeit oder Reihenfolge nicht stimmt.
//   2. DATEIEN: lädt Karte (Natural Earth 1:50m), Schriften und GSAP nach build/cache/, prüft
//      jede per SHA-256 und kopiert Schriften und GSAP nach assets/. Das Video lädt zur
//      Laufzeit nichts aus dem Netz.
//   3. KARTE: projiziert Europa (Lambert konform-konisch) in feste Weltkoordinaten.
//   4. EINSETZEN: setzt Blöcke (Welt, Bibliotheken, Daten, Drehbuch) zwischen Marken wie
//      <!-- @atlas:anfang --> ... <!-- @atlas:ende --> in die Kompositionen ein.
//   5. ZEITEN INS HTML: schreibt data-start/data-duration jedes Clips aus data-cue. Keine
//      Zeit steht von Hand im HTML.
//   6. MESSEN: öffnet jede HUD-Szene im Browser (Schriften geladen) und prüft, dass jede
//      Textzeile ins Lesefenster passt (x 108-972, y 168-1330, DESIGN.md §2). Texte in der Welt
//      (Etiketten an der Waage) misst build/messen-bild.mjs im laufenden Player, Bild für Bild.
//
// Runde 1 (Kritik): Tonspur per SHA-256 an timing.json gebunden, Zeiten auf ganze ms so
// gerundet, dass Clip-Ende und Szenen-Ende exakt gleich sind (sonst fehlte an einer Naht ein
// Bild), und ein Tor für die Cue-Abweichung (Text erscheint höchstens 150 ms neben seinem Wort).

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { geoConicConformal, geoPath, geoGraticule } from "d3-geo";
import { feature, mesh, merge } from "topojson-client";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const PROJEKT = path.resolve(HIER, "..");
const BREITE = 1080;
const HOEHE = 1920;
const FPS = 30;

// ---------------------------------------------------------------------------
// 1) ZEITEN aus der Stimme
// ---------------------------------------------------------------------------
const TIMING = JSON.parse(fs.readFileSync(path.join(PROJEKT, "assets/timing.json"), "utf8"));
// Gehören Wortzeiten und Tonspur zusammen? voice.py schreibt die SHA-256 der m4a in timing.json.
// Wer nur eine der beiden Dateien tauscht (oder eine alte m4a liegen lässt), bekäme ein Video,
// in dem jedes Bild am falschen Wort landet. Darum hier abbrechen.
{
  const ist = crypto.createHash("sha256").update(fs.readFileSync(path.join(PROJEKT, "assets/voice.m4a"))).digest("hex");
  if (!TIMING.audio || TIMING.audio.sha256 !== ist) {
    throw new Error(`assets/timing.json gehört nicht zu assets/voice.m4a (SHA-256 ${ist.slice(0, 12)}… ` +
      `statt ${(TIMING.audio?.sha256 || "fehlt").slice(0, 12)}…). Neu vertonen: python build/voice.py`);
  }
}
const VORLAUF = 2 / FPS; // Bild kommt 2 Bilder vor dem Wort (DESIGN.md §9, vorläufig)
const bild = (t) => Math.round(t * FPS) / FPS; // auf ganze Bilder runden: Player und Render gleich

// WORTE: Cue-Name -> Sekunde, auf der das Bild einsetzt (Wortanfang minus Vorlauf)
export const WORTE = {};
for (const [name, cue] of Object.entries(TIMING.cues)) WORTE[name] = bild(cue.start - VORLAUF);
// Szenenanfänge: erstes Wort jeder Szene (für HUD-Szenen und den Satz "Nur sein Gehalt?")
const SZENEN_WORT = Object.fromEntries(TIMING.scenes.map((s) => [s.id, bild(s.start - VORLAUF)]));
const SZENEN_ENDE = Object.fromEntries(TIMING.scenes.map((s) => [s.id, s.end]));
const DENKPAUSE = TIMING.pausen.find((p) => p.art === "denkpause");
// Wortanfang (ohne Vorlauf) jedes Cues: für das Tor "Cue-Abweichung" unten
const WORTANFANG = Object.fromEntries(Object.entries(TIMING.cues).map(([n, c]) => [n, c.start]));

// Physik der Darsteller (Bildpixel und Sekunden), DESIGN.md §5 "Eintritte je Identität".
// Konstanten des Moduls, nie Felder der Spec.
const PHYSIK = {
  fallhoehe: 560, // aus dieser Höhe fällt ein Darsteller auf seinen Platz
  fallzeit: 0.42,
  flughoehe: 130, // Reiseflughöhe über der Karte
  steigzeit: 0.45,
  sinkzeit: 0.5,
  flugzeit: 1.7, // Abflug bis Landung
  schrittzeit: 0.5, // vom Boden auf die Schale
};
// Kamerafahrt zwischen zwei Lese-Bildern: gemessen an den Vorbildern 0,4-0,7 s, Median 0,45 s
// (DESIGN.md §5/§9, docs/research/referenz-destillation.md §3.10). Der lange Schwenk von
// München nach Barcelona nimmt die Obergrenze.
const FAHRT = 0.6;
// Fassung v2: 0,6 statt 0,7 s (gemessene Spanne 0,4-0,7 s). Mit der neuen Stimme liegen "nichts" und
// "45" nur 2,4 s auseinander; Stempel (1,7 s), Schwenk und Ankunft vor dem Geld passen sonst nicht.
const SCHWENK = 0.6;
const HALTEN = 1.2; // nach jeder Landung mindestens so lange ruhen
const MARKER = { kreis: 0.5, linie: 0.35, strich: 0.3, klammer: 0.5 };
const NAH_FAHRT = 0.5; // Nachfahrt (Detail): DESIGN.md §5 Zoom-in 0,5 s
const NAH_FAHRT_KURZ = 0.45; // Diagramm, Fassung v2: Median der gemessenen Übergangsfahrten (0,45 s)
const DREH_FAHRT = 0.6; // Drehung der Waage (Behalten -> Verkaufen)
const STAND = 1.7; // Standdauer eines Textes (DESIGN.md §5)

// ---------------------------------------------------------------------------
// ZEITEN, Teil 2: abgeleitet. Kein Wort, sondern Wort + Versatz. Ändern sich die
// Wortzeiten (andere Stimme), wandern diese Zeiten mit.
// ---------------------------------------------------------------------------
function ableiten(w) {
  const z = { anfang: 0, ...w };
  for (const [id, t] of Object.entries(SZENEN_WORT)) z["s_" + id] = t;
  z.ende = bild(TIMING.duration);
  z.pause = DENKPAUSE.start; // Ende der Frage = Anfang der Denkpause
  z.pauseEnde = DENKPAUSE.end;

  // Beat 1-2: Frage. Fassung v2.1 (Kritik 28.10.: kein echter Foto-Moment): Bild 0 zeigt die
  // Spielszene als großen Abzug auf der Karte (Vorschaubild mit Held und Frage). Auf "Lewandowski"
  // kommt sein Name neben den Abzug. Auf "Bayern" wird das Foto zum Darsteller: Der Grund des
  // Abzugs blendet aus, die Figur steigt nach München und schrumpft auf Darsteller-Größe (0,55 s),
  // dann verliert sie die Farbe (Überblendung Farbe -> Duoton am Ziel, 0,25 s).
  z.nameSpieler = w.lewa;
  // Die Bewegung beginnt im Atem vor "Bayern" und ist da, wenn "Bayern" fällt (Bayern = München).
  z.morph = w.bayern - 0.25;
  z.morphEnde = z.morph + 0.55;
  z.entfaerben = z.morphEnde;
  z.entfaerbtEnde = z.entfaerben + 0.25;
  z.nameAtlas = z.morphEnde; // der Name wandert an den Darsteller (Morph des Etiketts)
  z.routeAus = w.verkaufen + 0.8; // Route ist gezeichnet
  // "verkaufen oder BEHALTEN": Route und Barcelona treten zurück (Abdunkeln). So liest man
  // "Barcelona" in der Denkpause nicht mehr als Teil des untersten Schilds (Prüfung 1).
  z.dimBcn = w.behalten;
  z.schilder = w.frage + 0.1; // Nebenbewegung zur Unterstreichung, 100 ms später
  // Beat 3: Schilder und Titel treten ab, dann Zoom, dann richtet sich die Waage auf
  // Runde 2: Austritt 0,1 s nach "Naheliegend", Zoom 0,3 s danach (die Denkpause ist mit der
  // neuen Aufnahme 0,1 s kürzer; so stehen die Schilder weiter 3,8 s).
  z.hookAus = w.waage + 0.1;
  z.zoomIn = w.waage + 0.3;
  z.zoomInEnde = z.zoomIn + FAHRT;
  z.waageAuf = z.zoomInEnde - 0.15; // Nebenbewegung: die Waage wächst, als die Kamera ankommt
  z.behauptung = w.nur; // "Nur sein Gehalt" oben links, sobald es gesprochen wird
  // Runde 2 (Prüfung 2): Die Waage neigt sich nur, wenn etwas aufsetzt. Der Beleg landet auf
  // "Kosten" -> links; der Spieler steigt erst auf "schießt" auf "Nutzen" -> rechts.
  z.belegFall = w.gehalt;
  z.neigungKosten = w.gehalt + PHYSIK.fallzeit;
  z.stempel = w.bezahlt;
  z.spielerHopp = w.schiesst;
  z.neigungRechts = w.schiesst + PHYSIK.schrittzeit; // er landet, die Waage kippt
  z.toreText = w.tore + 0.12;
  // Beat 4: Vertrag als Blatt, die Zeitleiste ist darauf gedruckt (Runde 2, Prüfung 1). Die
  // Behauptung tritt auf "Doch" ab (Prüfung 2) und kommt mit "Nur sein Gehalt?" zurück. Die Waage
  // tritt zurück (Abdunkeln 35 %): Held ist jetzt das Blatt.
  z.behauptungAus = z.s_vertrag - 0.35; // vor dem Ende der HUD-Szene "naheliegend"
  z.vertragFall = w.vertrag;
  z.dimWaage = w.vertrag;
  // Fassung v2 (Standdauer, DESIGN.md §5): "Tore" geht mit der Naht (Fahrt nach Barcelona), nicht
  // mitten in der Einstellung. Auf "Vertrag" tritt es mit der Waage auf 35 % zurück.
  z.band = w.saison;
  z.bandEnde = z.band + 0.7;
  // "Danach": Die Welt fährt näher an das Blatt (Detail: was nach dem Vertrag kommt).
  z.nahVertrag = w.danach;
  z.nahVertragEnde = w.danach + NAH_FAHRT;
  z.nullEuro = w.nichts; // Stempel "0 €" auf "Bayern bekommt NICHTS"
  // Beat 5: Angebot. Die Kamera fährt nach Barcelona (und zugleich aus der Nachfahrt zurück). Sie
  // steht, bevor der Stapel auf "45" fällt. Fassung v2: Das Blatt geht MIT der Naht (Beginn der
  // Fahrt), nicht davor; die Fahrt endet spätestens 50 ms vor "45".
  z.fahrtBarcelonaEnde = Math.min(w.bietet + 0.2 + SCHWENK, w.zahl - 0.05);
  z.fahrtBarcelona = z.fahrtBarcelonaEnde - SCHWENK;
  z.vertragAus = z.fahrtBarcelona;
  z.toreAus = z.fahrtBarcelona;
  // Fassung v2.1: Camp Nou ist entfernt (Schriftzug am Handy unlesbar, Kritik 28.10.).
  z.routeHell = z.fahrtBarcelona; // auf dem Weg nach Barcelona zeigt die Route wieder den Weg
  z.hellWaage = z.fahrtBarcelonaEnde; // die Waage ist jetzt außer Sicht: wieder volle Deckkraft
  z.geldFall = w.zahl;
  z.geldLandetBcn = w.zahl + PHYSIK.fallzeit;
  z.zahlText = w.zahl;
  // Beat 6a: Widerlegung. Ein GEIST (Umriss) des Stapels fliegt nach München.
  z.widerlegung = z.s_widerlegung;
  z.abflugGeist = w.landung - PHYSIK.flugzeit;
  z.fahrtMuenchen = Math.max(z.abflugGeist + 0.25, w.falsch + MARKER.strich + HALTEN);
  z.fahrtMuenchenEnde = w.landung - 0.15;
  z.behauptungDunkel = z.fahrtMuenchen - 0.2; // widerlegt: tritt zurück, bevor der Geist durchfliegt
  // Fassung v2: "45 Mio. €" geht MIT der Naht (Fahrt nach München), nicht schon beim Abflug des
  // Geistes 0,25 s davor. Der Geist steigt nach oben, die Zahl steht darunter: Sie kreuzen sich nicht.
  z.zahlTextAus = z.fahrtMuenchen;
  z.geldEtikett = w.landung + 0.12; // "45 Mio. €" unter der Kosten-Schale, im Geist-Stil
  z.routeDunkel = w.landung + 0.3;
  z.nullBehalten = w.cent; // "Behalten keinen CENT": Stempel "0 €" am Schild "Behalten"
  // Beat 6b: Auf "genauso" bekommt der Geist Gewicht: Waage waagerecht, "45 Mio. €" wird fest.
  z.etikettEntgangen = w.entgangen;
  z.waagerecht = w.gewicht;
  // Beat 7: Begriff. Kreis um den Geist, Beleg und Figur treten zurück; danach eine leichte
  // Nachfahrt. Auf "Alternative" wird aus "entgangen" "beste Alternative" (Morph am Geist).
  z.nullBehaltenAus = w.begriff;
  z.nahRein = w.begriff + 0.85;
  z.nahReinEnde = z.nahRein + NAH_FAHRT;
  z.etikettAlternative = w.alternative;
  // In der Atempause nach der Definition: Begriff, Kreis, Etiketten und Beleg treten ab, die Welt
  // fährt zurück. "Im Juli nimmt Bayern das Geld" steht dann in der Totale der Waage (Prüfung 1).
  z.julAus = SZENEN_ENDE.begriff + 0.05;
  z.nahRaus = z.julAus;
  z.nahRausEnde = z.nahRaus + NAH_FAHRT;
  // Beat 8: Auflösung. Neigung auf "nimmt" (Kamera steht). In der Atempause nach "Geld." beginnt
  // die Drehung; das Schild kippt GENAU auf "Verkaufen" (Mitte der Drehung = Cue). Der Geist wird
  // erst echt, wenn er auf der Nutzen-Seite angekommen ist (Prüfung 1 und 2).
  z.datumJuli = w.juli + 0.12;
  z.neigungLinks = w.nimmt;
  z.drehStart = w.dreh - DREH_FAHRT / 2;
  z.drehEnde = w.dreh + DREH_FAHRT / 2;
  // Fassung v2: Das Geld wird auf "Verkaufen" echt, sobald die Drehung die Mitte überschritten hat
  // (der Stapel ist auf der Nutzen-Seite); Morph 0,38 s, also fertig kurz nach der Drehung.
  z.massiv = w.dreh;
  const atem = TIMING.pausen.find((p) => p.art === "atem" && p.nach === "verkauf");
  z.atemVerkauf = atem.start; // Atempause nach "Geld." (script.py: atem_s)
  z.atemVerkaufEnde = atem.end;
  z.okEtikett = w.ok_verkauf;
  z.geldDunkel = w.ok_verkauf; // Gold-Etikett unter "Kosten": das Geld tritt zurück (ein Gold-Ding)
  // Fassung v2.1 (Kritik 28.10.: der Umriss lag 0,4 s über dem stehenden Foto, dann rutschte ein
  // starres Foto hinaus wie ein Pappaufsteller; DFL-Auflage: keine videoähnliche Verwertung): Das
  // Foto geht mit einem Unschärfe-Austritt (0,22 s, leicht nach Südwesten, DESIGN.md §5), der
  // Umriss kommt erst, wenn es fast weg ist.
  z.abflugSpieler = w.abflug_spieler;
  z.spielerWeg = w.abflug_spieler + 0.25;
  z.umriss = w.abflug_spieler + 0.18;
  z.saisonText = w.ok_saison;
  // Beat 9-12: Diagramm. Jede Kategorie kommt mit ihrem Beispiel (Prüfung 2): die Rechnung auf
  // "geschenkt", das Gold-Fach "aufgegeben" auf "Genau dann".
  z.schnitt = w.modell;
  z.karteFall = w.karte;
  z.schildKino = w.karte + 0.12;
  z.neigungKarte = w.karte + PHYSIK.fallzeit;
  z.rechnungFall = w.geschenkt;
  z.fach = w.genau;
  z.lohnZeichnen = w.lohn_da;
  z.lohnFall = w.lohn;
  z.lohnLandet = w.lohn + PHYSIK.fallzeit;
  z.nachhilfeAus = w.lohn; // "Nachhilfe, heute Abend" gehen mit der Tüte (Prüfung 1: schwebte sonst)
  // Fassung v2 (Abnahme: Diagramm 11,5 s ohne Fahrt): Auf "Genau dann ..." fährt die Welt 1,2-fach an
  // die linke Seite, an die ALTERNATIVE (Nachhilfe, Lohn, Gold-Fach, Kosten-Schale); die Nutzen-Seite
  // tritt dafür zurück. Erst wenn Rechnung und "aufgegeben" gelesen sind. Nachhilfe rastet in den
  // letzten Bildern der Fahrt ein und landet, wenn die Kamera steht.
  z.nahAlt = Math.max(w.genau + 0.12 + 0.8, w.geschenkt + PHYSIK.fallzeit + 1.4);
  z.nahAltEnde = z.nahAlt + NAH_FAHRT_KURZ;
  // Auf "Das kann es wert sein" zurück in die Totale: Ob es das wert ist, wiegt BEIDE Seiten. Erst
  // wenn die Gleichung (HUD) gelesen ist (0,5 + 0,3 x 5 = 2,0 s).
  z.nahZurueck = w.gleichung + 2.0;
  z.nahZurueckEnde = z.nahZurueck + NAH_FAHRT_KURZ;
  // "Gratis ist es nicht": Gleichung tritt ab, die Nutzen-Seite tritt zurück, die Welt fährt an die
  // Kosten-Schale. Auf "nicht" zuckt die Lohntüte neben der Rechnung "0 €".
  z.gleichungAus = w.gratis;
  z.dimRest = w.gratis;
  z.nahSatz = w.gratis + 0.2;
  z.nahSatzEnde = z.nahSatz + 0.6;
  z.puls = Math.max(w.gratis_nicht, z.nahSatzEnde); // erst zucken, wenn die Welt steht
  // Abspann (v2.1): Im stehenden Schlussbild (hold_s) stehen Bildnachweis und Lizenz des Videos.
  z.abspann = bild(SZENEN_ENDE.satz);
  return z;
}
export const ZEIT = ableiten(WORTE);

// Prüfungen: Lieber beim Bau abbrechen als ein Video mit zu kurzen Haltezeiten rendern.
// Kommt eine schnellere Stimme (Casting-Sieger), fallen Engpässe hier auf, vor dem Rendern.
function pruefeZeiten(z) {
  const fehler = [];
  const mindestens = (was, ist, soll) => {
    if (ist < soll - 1e-6) fehler.push(`${was}: ${ist.toFixed(2)} s < ${soll} s`);
  };
  mindestens("Frage steht in den ersten 8 s (8 - Ende der Frage)", 8 - z.pause, 0);
  // Fassung v2.1: der Foto-Moment im Hook
  mindestens("Abzug (echtes Foto) steht, bevor er zum Darsteller wird", z.morph, 2.0);
  mindestens("Name am Abzug gelesen (0,5 + 0,3 × 1 Wort)", z.morph - z.nameSpieler, 0.8);
  mindestens("Darsteller steht in Farbe und Duoton fertig, bevor die Route läuft", z.verkaufen - z.entfaerbtEnde, 0);
  mindestens("Denkpause", z.pauseEnde - z.pause, 1.5);
  mindestens("Schilder stehen vor dem Austritt (Lesezeit 0,5 + 0,3 × 11 Wörter)", z.hookAus - z.schilder, 3.8);
  mindestens("Zoom endet, bevor der Beleg fällt", z.belegFall - z.zoomInEnde, 0);
  mindestens("Waage steht nach dem Beleg, bevor der Spieler aufsteigt", z.spielerHopp - (z.neigungKosten + 0.8), 0.6);
  mindestens("Behauptung steht", z.behauptungAus - z.behauptung, STAND);
  mindestens("Vertrag liegt, bevor die Zeitleiste läuft", z.band - (z.vertragFall + PHYSIK.fallzeit), 0.3);
  mindestens("Zeitleiste steht, bevor die Verlängerung kommt", z.verlaengern_an - z.bandEnde, 0);
  mindestens("Blatt ist gelesen, bevor die Welt näher fährt (0,5 + 0,3 × 4)", z.nahVertrag - (z.vertragFall + PHYSIK.fallzeit), 1.7);
  mindestens("Nachfahrt auf das Blatt endet vor dem Stempel", z.frei - z.nahVertragEnde, 0);
  mindestens("Stempel '0 €' steht vor der Kamerafahrt", z.vertragAus - z.nullEuro, STAND);
  mindestens("Stempel 'ablösefrei' steht vor der Kamerafahrt", z.vertragAus - z.frei, STAND);
  mindestens("Kamera steht in Barcelona, bevor das Geld fällt", z.geldFall - z.fahrtBarcelonaEnde, 0);
  mindestens("Geld ruht in Barcelona (Halten)", z.abflugGeist - z.geldLandetBcn, HALTEN);
  mindestens("Durchstrich steht, bevor die Kamera fährt", z.fahrtMuenchen - (z.falsch + MARKER.strich), HALTEN);
  mindestens("Kamerafahrt nach München dauert", z.fahrtMuenchenEnde - z.fahrtMuenchen, 0.9);
  mindestens("Geist ruht auf der Schale, bevor er Gewicht bekommt", z.waagerecht - z.landung, HALTEN);
  mindestens("'entgangen' steht vor der Korrektur", z.korrektur - z.entgangen, HALTEN);
  mindestens("Korrigierte Behauptung steht vor dem Begriff", z.begriff - z.korrektur, HALTEN);
  mindestens("Stempel '0 €' am Schild steht", z.nullBehaltenAus - z.nullBehalten, STAND);
  mindestens("Nachfahrt erst nach der Lesezeit des Begriffs", z.nahRein - (z.begriff + 0.8), 0);
  mindestens("Nachfahrt endet vor 'beste Alternative'", z.alternative - z.nahReinEnde, 0);
  mindestens("Kreis um den Geist steht fertig", z.julAus - (z.begriff + MARKER.kreis), HALTEN);
  mindestens("Welt ist zurückgefahren, bevor die Waage kippt", z.neigungLinks - z.nahRausEnde, 0);
  mindestens("Waage steht gekippt, bevor sie sich dreht", z.drehStart - (z.neigungLinks + 0.8), 0.5);
  mindestens("Etikett 'Opportunitätskosten' erst nach der Drehung", z.okEtikett - z.drehEnde, 0);
  // Fassung v2, Beat 8 entzerrt: Die Atempause ist Luft (die Neigung auf "nimmt" ist ausgeschwungen,
  // bevor sie beginnt), und das Etikett kommt erst, wenn das Geld schon echt ist.
  mindestens("Neigung auf 'nimmt' ausgeschwungen vor der Atempause", z.atemVerkauf - (z.neigungLinks + 0.8), 0);
  mindestens("Drehung beginnt nicht vor dem Ende der Atempause (- 0,2 s)", z.drehStart - (z.atemVerkaufEnde - 0.2), 0);
  mindestens("Etikett erst 0,3 s nach dem Echtwerden des Geldes", z.okEtikett - (z.massiv + 0.38), 0.3);
  mindestens("Waage steht nach der Drehung, bevor der Spieler abfliegt", z.abflugSpieler - z.drehEnde, HALTEN);
  mindestens("Ganze Waage steht vor dem Passschnitt", z.schnitt - (z.spielerWeg), HALTEN);
  mindestens("Kinokarte ruht vor der Rechnung", z.rechnungFall - (z.karteFall + PHYSIK.fallzeit), 0.6);
  mindestens("Rechnung ruht vor dem Gold-Fach", z.fach - (z.rechnungFall + PHYSIK.fallzeit), 0.5);
  mindestens("Lohntüte steht gezeichnet, bevor sie fällt", z.lohnFall - (z.lohnZeichnen + 0.6), HALTEN);
  mindestens("Gleichung steht (0,5 + 0,3 × 5)", z.gleichungAus - z.gleichung, 2.0);
  // 1,0 s statt HALTEN: Das Ausschwingen (0,9 s) ist schon Teil der Ruhe, sichtbar steht sie ab +0,6 s.
  mindestens("Waage steht waagerecht, bevor die Welt näher fährt", z.nahSatz - (z.lohnLandet + 0.9), 1.0);
  mindestens("Fahrt zur Alternative endet, bevor 'Nachhilfe' gelandet ist", (z.nachhilfe + 0.35) - z.nahAltEnde, 0);
  mindestens("Fahrt zur Alternative erst nach der Lesezeit von 'aufgegeben'", z.nahAlt - (z.fach + 0.12 + 0.8), 0);
  mindestens("Kamera steht, solange die Gleichung gelesen wird", z.nahZurueck - (z.gleichung + 2.0), 0);
  mindestens("Totale steht vor der Nachfahrt auf 'Gratis'", z.nahSatz - z.nahZurueckEnde, HALTEN);
  mindestens("Nachfahrt endet vor dem Zucken der Tüte", z.puls - z.nahSatzEnde, 0);
  mindestens("Zucken auf 'nicht' (Toleranz 150 ms)", 0.15 - (z.puls - z.gratis_nicht), 0);
  mindestens("Nachfahrt endet vor der Unterstreichung", z.aufgeben - z.nahSatzEnde, 0);
  mindestens("Letzte Zeile hält", z.ende - z.rechnung, 2.0);
  // Standdauer eines Textes >= 1,7 s (DESIGN.md §5, gemessen an den Vorbildern)
  mindestens("Text 'Tore' steht", z.toreAus - z.toreText, STAND);
  mindestens("Etikett '45 Mio. €' steht", z.julAus - z.geldEtikett, STAND);
  mindestens("Etikett 'entgangen' steht", z.etikettAlternative - z.etikettEntgangen, STAND);
  mindestens("Etikett 'beste Alternative' steht", z.julAus - z.etikettAlternative, STAND);
  mindestens("'verlängern' steht (danach abgedunkelt bis zum Austritt)", z.vertragAus - z.verlaengern_an, STAND);
  mindestens("Text '1 Saison' steht", z.schnitt - z.saisonText, STAND);
  mindestens("Etikett 'Opportunitätskosten' steht", z.schnitt - z.okEtikett, 2.0);
  mindestens("'Nachhilfe' steht", z.nachhilfeAus - z.nachhilfe, STAND);
  mindestens("'aufgegeben' am Gold-Fach steht", z.ende - z.fach, STAND);
  if (fehler.length) throw new Error("Zeiten verletzen das Kit:\n  " + fehler.join("\n  "));
}
pruefeZeiten(ZEIT);

// ---------------------------------------------------------------------------
// Tor "Cue-Abweichung" (DESIGN.md §5 "Cue", Kritik Prüfung 3): Jeder Text, der ein gesprochenes
// Wort benennt, erscheint höchstens 150 ms neben dessen Anfang (Startwert: 2 Bilder davor).
// Ausnahmen nur mit Grund. So fällt beim Stimmtausch auf, wenn ein abgeleiteter Cue wegdriftet.
// ---------------------------------------------------------------------------
const TEXT_CUES = [
  ["Unterstreichung 'kostet'", "frage", "frage"],
  ["Name 'Lewandowski' (am Abzug)", "nameSpieler", "lewa"],
  ["Behauptung 'Nur sein Gehalt'", "behauptung", "nur"],
  ["Beleg 'Gehalt'", "belegFall", "gehalt"],
  ["Stempel 'bezahlt'", "stempel", "bezahlt"],
  ["'Tore'", "toreText", "tore"],
  ["Vertrag (Blatt)", "vertragFall", "vertrag"],
  ["Zeitleiste '1 Saison'", "band", "saison"],
  ["'verlängern'", "verlaengern_an", "verlaengern_an"],
  ["Stempel 'ablösefrei'", "frei", "frei"],
  ["Stempel '0 €' (nichts)", "nullEuro", "nichts"],
  ["'45 Mio. €' (D1)", "zahlText", "zahl"],
  ["Durchstrich auf 'Nur'", "falsch", "falsch"],
  ["Stempel '0 €' am Schild", "nullBehalten", "cent"],
  ["'entgangen'", "etikettEntgangen", "entgangen"],
  ["'+ Barças Geld'", "korrektur", "korrektur"],
  ["'Opportunitätskosten' (D2)", "begriff", "begriff"],
  ["'beste Alternative'", "etikettAlternative", "alternative"],
  ["Credit 'Wechsel … 19.07.2022'", "datumJuli", "juli"],
  ["Schild 'Verkaufen' (Mitte der Drehung)", "dreh", "dreh"],
  ["'Opportunitätskosten' (Etikett)", "okEtikett", "ok_verkauf"],
  ["'1 Saison'", "saisonText", "ok_saison"],
  ["Waage (Schnitt)", "schnitt", "modell"],
  ["Kinokarte", "karteFall", "karte"],
  ["Rechnung 'bezahlt 0 €'", "rechnungFall", "geschenkt"],
  ["Gold-Fach 'aufgegeben'", "fach", "genau"],
  ["'Nachhilfe'", "nachhilfe", "nachhilfe"],
  ["Lohntüte", "lohnZeichnen", "lohn_da"],
  ["Gleichung", "gleichung", "gleichung"],
  ["Lohntüte fällt", "lohnFall", "lohn"],
  ["Unterstreichung 'aufgegeben'", "aufgeben", "aufgeben"],
  ["Unterstreichung 'Rechnung'", "rechnung", "rechnung"],
];
// Bewusste Ausnahme (mit Grund): "45 Mio. €" unter der Kosten-Schale kommt mit dem Aufprall des
// Geistes auf "Ablöse" (+0,12 s); die Zahl selbst wurde schon auf "45" gezeigt.
export const CUE_ABWEICHUNG = TEXT_CUES.map(([was, zeit, wort]) => ({
  was, ms: Math.round((ZEIT[zeit] - WORTANFANG[wort]) * 1000),
}));
{
  const schlecht = CUE_ABWEICHUNG.filter((c) => Math.abs(c.ms) > 150);
  if (schlecht.length) {
    throw new Error("Cue-Abweichung > 150 ms (DESIGN.md §5):\n  " + schlecht.map((c) => `${c.was}: ${c.ms} ms`).join("\n  "));
  }
  const max = Math.max(...CUE_ABWEICHUNG.map((c) => Math.abs(c.ms)));
  console.log(`Cue-Abweichung: ${CUE_ABWEICHUNG.length} Texte, max ${max} ms (Ziel ≤ 150)`);
}

// HUD-Szenen: eine Sub-Komposition je Szene des Skripts. Grenze = erstes Wort der Szene
// minus 0,15 s, damit Eintritte mit Vorlauf (2 Bilder) noch in ihrer Szene liegen.
// Ausnahmen: "naheliegend" beginnt erst, wenn Schlagzeile und Schilder abgetreten sind
// (sie treten auf "Naheliegend" ab), "modell" beginnt mit dem harten Schnitt auf "Waage".
const SZENEN_IDS = TIMING.scenes.map((s) => s.id);
const AUSNAHMEN = { naheliegend: ZEIT.hookAus + 0.3, modell: ZEIT.schnitt };
const anfangVon = (id, i) => (i === 0 ? 0 : id in AUSNAHMEN ? bild(AUSNAHMEN[id]) : bild(SZENEN_WORT[id] - 0.15));
export const SZENEN = SZENEN_IDS.map((id, i) => ({ id, beginn: anfangVon(id, i) })).map((s, i, a) => ({
  ...s,
  ende: i + 1 < a.length ? a[i + 1].beginn : ZEIT.ende,
}));
// Die Atlas-Bühne endet mit dem Schnitt, die Diagramm-Bühne beginnt dort.
const BUEHNEN = { atlas: { beginn: 0, ende: ZEIT.schnitt }, diagramm: { beginn: ZEIT.schnitt, ende: ZEIT.ende } };

// ---------------------------------------------------------------------------
// 2) DATEIEN laden (nur beim Bau), mit Prüfsumme.
//    In .tmp schreiben, prüfen, umbenennen: Sonst bliebe eine abgeschnittene Datei
//    (Abbruch beim Schreiben) für immer im Cache.
// ---------------------------------------------------------------------------
const CACHE = path.join(HIER, "cache");
const JSDELIVR = "https://cdn.jsdelivr.net/npm";
const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

async function hole(datei, url, soll, inAssets) {
  // Runde 2 (Prüfung 3): GSAP und Schriften liegen schon getrackt in assets/. Stimmt dort die
  // Prüfsumme, braucht der Bau aus einem frischen Klon für sie kein Netz (nur noch die Karte).
  if (inAssets) {
    const a = path.join(PROJEKT, "assets", inAssets);
    if (fs.existsSync(a) && sha256(fs.readFileSync(a)) === soll) return a;
  }
  const ziel = path.join(CACHE, datei);
  fs.mkdirSync(path.dirname(ziel), { recursive: true });
  if (fs.existsSync(ziel)) {
    if (sha256(fs.readFileSync(ziel)) === soll) return ziel;
    console.log(`Cache-Datei ${datei}: Prüfsumme falsch (abgeschnitten oder alt), lade neu`);
  }
  console.log("lade", url);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Nicht geladen (${r.status}): ${url}`);
  const buf = Buffer.from(await r.arrayBuffer());
  const ist = sha256(buf);
  if (ist !== soll) {
    throw new Error(`Prüfsumme falsch für ${url}\n  erwartet ${soll}\n  bekommen ${ist}\n` +
      `Die Quelle hat sich geändert. Neue Version ansehen und die Prüfsumme in build/bauen.mjs anpassen.`);
  }
  fs.writeFileSync(ziel + ".tmp", buf);
  fs.renameSync(ziel + ".tmp", ziel);
  return ziel;
}

// Kopiert eine geprüfte Datei nach assets/ und prüft die Kopie noch einmal: Liegt dort eine
// veränderte Datei (von Hand bearbeitet, halb geschrieben), fällt es hier auf.
function kopiereNachAssets(quelle, ziel, soll) {
  const z = path.join(PROJEKT, "assets", ziel);
  if (path.resolve(quelle) === path.resolve(z)) return; // liegt schon geprüft in assets/
  fs.mkdirSync(path.dirname(z), { recursive: true });
  if (!fs.existsSync(z) || sha256(fs.readFileSync(z)) !== soll) fs.copyFileSync(quelle, z);
  if (sha256(fs.readFileSync(z)) !== soll) throw new Error(`assets/${ziel}: Prüfsumme falsch nach dem Kopieren`);
}

const KARTE_SHA = "04342cdc1e3016bcd7db1630de95684d67b79fe3c8c460321e87aef469502394";
const KARTE_DATEI = await hole("countries-50m.json", `${JSDELIVR}/world-atlas@2.0.2/countries-50m.json`, KARTE_SHA);

// GSAP lokal statt vom CDN: Die App spielt das Video auch offline (VIDEO-PIPELINE §7).
const GSAP = { datei: "gsap.min.js", url: `${JSDELIVR}/gsap@3.14.2/dist/gsap.min.js`,
  sha: "c174bfce53a729418d57a8ad8625e7247c793a22fef8e2851e3cfa3de9cd8280" };
kopiereNachAssets(await hole(GSAP.datei, GSAP.url, GSAP.sha, "gsap.min.js"), "gsap.min.js", GSAP.sha);

// Schriften lokal (OFL). Eigene Familiennamen ("DT ..."): Der Live-Player lädt keine
// fremden Schriften (Spike, Befund 1); so ist klar, welche Datei gemeint ist.
const SCHRIFTEN = [
  { familie: "DT Playfair", gewicht: 900, datei: "playfair-display-latin-900-normal.woff2", paket: "playfair-display@5.1.0",
    sha: "10795faaa4bd86f12f542b9451ed24b2948f7a4117328adcd068fcd8190f48b4" },
  { familie: "DT Inter", gewicht: 400, datei: "inter-latin-400-normal.woff2", paket: "inter@5.1.0",
    sha: "dd05e326cf8eac3b55acecf29c842ed73e6e6dd06491cf47f7e8800680ab3e33" },
  { familie: "DT Inter", gewicht: 600, datei: "inter-latin-600-normal.woff2", paket: "inter@5.1.0",
    sha: "62553d159189834af73c9a6264704be5b2bee9a08da66a14768d8e5c6ffd2cdb" },
];
const LIZENZEN = [
  { datei: "LICENSE-playfair.txt", paket: "playfair-display@5.1.0", sha: "4d4c865ff8d7ebfa445add31a5447e94bc146b63eaaa8cccb0bd3ef3c16229b3" },
  { datei: "LICENSE-inter.txt", paket: "inter@5.1.0", sha: "8c8fa881d9091ee315d2c80d207bb73afd4e90a66c9782ca445c5642f25db6dc" },
];
for (const f of SCHRIFTEN) {
  kopiereNachAssets(await hole(`fonts/${f.datei}`, `${JSDELIVR}/@fontsource/${f.paket}/files/${f.datei}`, f.sha, `fonts/${f.datei}`), `fonts/${f.datei}`, f.sha);
}
for (const f of LIZENZEN) {
  kopiereNachAssets(await hole(`fonts/${f.datei}`, `${JSDELIVR}/@fontsource/${f.paket}/LICENSE`, f.sha, `fonts/${f.datei}`), `fonts/${f.datei}`, f.sha);
}
const schriftenCss = SCHRIFTEN.map(
  (f) => `@font-face { font-family: "${f.familie}"; src: url("assets/fonts/${f.datei}") format("woff2"); font-weight: ${f.gewicht}; font-style: normal; font-display: block; }`,
).join("\n");

// ---------------------------------------------------------------------------
// 3) KARTE: 1 Welteinheit = 1 Bildpixel bei Zoom 1. Lambert konform-konisch mit
//    Standardparallelen 40° und 56° N, Mitte 9° O / 47° N (wie amtliche EU-Karten).
//    50m-Daten: Der Zoom bleibt <= 2,4 (DESIGN.md §7: 10m erst ab Zoom 2,5).
// ---------------------------------------------------------------------------
const welt = JSON.parse(fs.readFileSync(KARTE_DATEI, "utf8"));
const laender = welt.objects.countries;
const basisProjektion = () => geoConicConformal().parallels([40, 56]).rotate([-9, 0]).center([0, 47]).scale(2800).translate([0, 0]);
// Alles außerhalb dieses Rechtecks sieht die Kamera nie: weg damit (kleinere Datei).
const projektion = basisProjektion().clipExtent([[-900, -1250], [800, 1500]]);

// Eigener "Zeichenkontext" für d3-geo: sammelt die Pfade als SVG-Text, rundet auf 0,1 und
// lässt Punkte weg, die näher als 0,8 Einheiten am vorigen liegen (bei Zoom 2,4 knapp 2 px).
function sammler(minAbstand = 0.8) {
  let teile = [];
  let lx = 0;
  let ly = 0;
  const r = (v) => Math.round(v * 10) / 10;
  return {
    moveTo(x, y) {
      x = r(x);
      y = r(y);
      teile.push(`M${x} ${y}`);
      lx = x;
      ly = y;
    },
    lineTo(x, y) {
      x = r(x);
      y = r(y);
      if (Math.hypot(x - lx, y - ly) < minAbstand) return;
      // relative Befehle sind kürzer; gerechnet wird mit gerundeten Absolutwerten
      teile.push(`l${r(x - lx)} ${r(y - ly)}`);
      lx = x;
      ly = y;
    },
    closePath() {
      teile.push("z");
    },
    arc() {},
    nimm() {
      const s = teile.join("").replace(/ -/g, "-");
      teile = [];
      return s;
    },
  };
}
const ctx = sammler();
const zeichner = geoPath(projektion, ctx);
function pfad(geo) {
  zeichner(geo);
  return ctx.nimm();
}
const nachId = (id) => {
  const g = laender.geometries.find((x) => x.id === id);
  if (!g) throw new Error("Land fehlt in der Karte: " + id);
  return g;
};
const landPfad = pfad(merge(welt, laender.geometries));
const grenzenPfad = pfad(mesh(welt, laender, (a, b) => a !== b));
const netzPfad = pfad(geoGraticule().step([5, 5])());
const deutschlandPfad = pfad(feature(welt, nachId("276"))); // ISO 3166 numerisch: 276 = DE

// Die Küste ist der Rand der Landfläche: #w-land bekommt Füllung UND Strich.
// data-strich: render() setzt die Strichbreite jedes Bild auf Breite / Zoom (bildschirmkonstant).
const karte = [
  `<path id="w-land" data-strich="1.5" d="${landPfad}"/>`,
  `<path id="w-netz" data-strich="1" d="${netzPfad}"/>`,
  `<path id="w-grenzen" data-strich="1.1" d="${grenzenPfad}"/>`,
  `<g id="w-hl-de" class="w-hl" data-spur="hlDe"><path class="w-hl-flaeche" d="${deutschlandPfad}"/>` +
    `<path class="w-hl-schein" data-strich="14" d="${deutschlandPfad}"/><path class="w-hl-rand" data-strich="2" d="${deutschlandPfad}"/></g>`,
  `<path id="w-route" data-strich="5" data-strich-muster="2 16" d=""/>`,
].join("\n        ");

// ---------------------------------------------------------------------------
// ORTE, ROUTE, KAMERA
// ---------------------------------------------------------------------------
const roh = basisProjektion();
const rund = (p) => p.map((v) => Math.round(v * 10) / 10);
const STAEDTE = { muenchen: [11.576, 48.137], barcelona: [2.17, 41.387] };
// Ländernamen: Ort des Schriftzugs (Länge, Breite), von Hand in freie Kartenteile gelegt
// Runde 1: keine Ländernamen mehr. Sie trugen im Hook-Bild nur Orientierung, kosteten aber
// eines von elf Textelementen (Kritik Prüfung 1). München und Barcelona sind benannt.
const LAENDER = {};
const orte = {};
for (const [id, lage] of Object.entries(STAEDTE)) orte[id] = rund(roh(lage));
for (const [id, l] of Object.entries(LAENDER)) orte[id] = rund(roh(l.lage));
const laenderHtml = Object.entries(LAENDER)
  .map(([id, l]) => `<div id="w-land-${id}" class="w-anker" data-anker="ort:${id}"><div class="w-rand w-mitte" data-bis-zoom="1.9"><div class="w-land-name">${l.name}</div></div></div>`)
  .join("\n  ");

// Route München -> Barcelona als leichter Bogen (Weg des Spielers; das Geld fliegt sie
// rückwärts). Als Punktliste in Weltkoordinaten, damit render() ein Teilstück zeichnen kann.
function routePunkte(p0, p2, bogen, n) {
  const mitte = [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2];
  const dx = p2[0] - p0[0];
  const dy = p2[1] - p0[1];
  const c = [mitte[0] - dy * bogen, mitte[1] + dx * bogen];
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    pts.push(rund([(1 - s) ** 2 * p0[0] + 2 * (1 - s) * s * c[0] + s * s * p2[0], (1 - s) ** 2 * p0[1] + 2 * (1 - s) * s * c[1] + s * s * p2[1]]));
  }
  return pts;
}
const route = routePunkte(orte.muenchen, orte.barcelona, -0.12, 60);

// Kamera-Einstellung: "Ort P soll bei Zoom Z an Bildpunkt (bx, by) stehen". Daraus folgt der
// Weltpunkt in der Bildmitte. So spricht der Kamera-Vertrag: benannte Einstellungen.
function einstellung(p, bx, by, zoom) {
  return { kx: Math.round((p[0] - (bx - BREITE / 2) / zoom) * 10) / 10, ky: Math.round((p[1] - (by - HOEHE / 2) / zoom) * 10) / 10, zoom };
}
// Fußpunkt der Waage im Bild (Atlas: dort steht München; Diagramm: fest). Runde 1: 80 px tiefer
// als zuvor, damit über dem Balken Platz für Vertrag, Schlagzeile und Lohntüte ist und das
// Schlussbild nicht kopflastig wird (Kritik Prüfung 1). Tiefer geht nicht: darunter beginnen
// die Credits (y >= 1178).
// Runde 2: noch einmal 30 px höher (Fuß y = 1130). So sitzen die Credits (ab y 1178) nicht mehr
// auf dem Schatten des Waagenfußes (Prüfung 1).
const FUSS = [540, 1130];
const TOTALE_MUENCHEN = [820, 748]; // Bildpunkt von München in der Totale (Hook): dort landet der Morph
const kamera = {
  // totale:europa: München oben rechts (Figur neben der Schlagzeile), Barcelona links unten
  // Fassung v2: München 30 px weiter rechts und tiefer (vorher 790/700). Das Foto ist höher als die
  // Spielfigur (380 statt 300 px); seine ausgestreckte Hand stand sonst am "?" des Titels.
  // Fassung v2.1: 18 px tiefer (730 -> 748). Mit Ball ist der Darsteller 275 statt 191 px breit; sein
  // Rahmen reichte sonst in die Zeile "kostet" der Schlagzeile (messen-bild.mjs, Rahmen gegen Rahmen).
  totale: einstellung(orte.muenchen, ...TOTALE_MUENCHEN, 1.15),
  // nah:muenchen: Fuß der Waage auf München, Waage füllt das Lesefenster
  muenchen: einstellung(orte.muenchen, FUSS[0], FUSS[1], 2.4),
  // nah:barcelona: der Stapel fällt auf Barcelona, darüber Platz für "45 Mio. €"
  // München liegt dann oberhalb des Bildes: Die Waage ragt nicht ins Bild (Befund 1. Runde).
  barcelona: einstellung(orte.barcelona, 420, 820, 2.4),
};

// Waage: Maße in Bildpixeln relativ zum Fuß. Gleiche Maße in Atlas und Diagramm, damit der
// harte Schnitt (Beat 9) ein Passschnitt ist: dieselbe Waage, andere Zeichnung.
const WAAGE = {
  saeule: 500, // Fuß bis Drehpunkt
  arm: 270, // Drehpunkt bis Haken
  kette: 360, // Haken bis Schalenrand
  // Breite der Schale. Runde 2: 400 statt 340. Auf der Kosten-Schale stehen zwei Dinge
  // nebeneinander (Geist + Beleg, im Diagramm Gold-Fach + Rechnung), und ihre Schrift muss
  // >= 48 px sein (DESIGN.md §3): "Rechnung" ist in 48 px 232 px breit (gemessen).
  schale: 400,
  front: 66, // Höhe der Schalen-Vorderseite (trägt "Kosten" / "Nutzen")
  neigung: 7, // Grad: es gibt nur rechts, waagerecht, links (drehbuch.md "Warum eine Waage")
  schildY: -438, // Schild an der Säule ("Behalten" / "Verkaufen" / "Kino"), Mitte relativ zum Fuß
};

// Nachfahrten (Detail-Zoom der ganzen Welt). Ein Bildpunkt (fx, fy) wird um den Faktor r
// vergrößert und landet bei (zx, zy); ohne zx/zy bleibt er stehen.
//   vertrag: auf das Vertragsblatt (Beat 4, auf "Danach"), Mitte des Blatts bleibt stehen.
//   begriff: leichte Nachfahrt beim Begriff. Runde 2 (Prüfung 1): Bei 1,25 lag die Nutzen-Schale
//            halb am Rand. Mit 1,1 bleibt die ganze Waage im Bild, und der Kreis um den Geist
//            bleibt rechts von x = 108 (fx = 108 genau: dort steht die Zeile unter der Schale).
//   satz:    Diagramm, auf die Kosten-Schale (Gold-Fach, Rechnung, "aufgegeben"), ab "Gratis".
//            Die Mitte dieser Gruppe (290, 940) wandert nach (540, 760): Die Schale steht groß in
//            der Bildmitte. Die Säule bliebe am rechten Rand stehen, darum tritt sie vorher zurück.
const NAH = {
  // vertrag: 1,12, nicht mehr: Sonst rutschte die (abgedunkelte) Nutzen-Schale unter die Credits.
  atlas: { vertrag: { r: 1.12, fx: 540, fy: 400 }, begriff: { r: 1.1, fx: 108, fy: 1100 } },
  diagramm: { r: 1.9, fx: 290, fy: 940, zx: 540, zy: 760 },
  // Fassung v2: Nachfahrt an die Alternative. Der Brennpunkt (108, 300) bleibt stehen: links hält
  // "aufgegeben" die Kante x = 108, oben bleibt die Lohntüte unter der Gleichung (HUD, y 195-255),
  // unten endet "aufgegeben" bei y 1260 (Lesefenster bis 1330). 1,2 statt 1,25: Beim Nachschwingen
  // der Waage (Lohn landet) lag "aufgegeben" mit 1,25 eine Probe lang unter y 1330 (messen-bild.mjs).
  // Die Nutzen-Seite ragt rechts hinaus und ist dafür abgedunkelt (DESIGN.md §5 Nachfahrt).
  diagrammAlt: { r: 1.2, fx: 108, fy: 300 },
};
const DATEN_ATLAS = { orte, route, kamera, breite: BREITE, hoehe: HOEHE, physik: PHYSIK, marker: MARKER,
  waage: { ...WAAGE, ort: "muenchen" }, nah: NAH.atlas }; // .abzug kommt unten (nach foto-lewandowski.json)
const DATEN_DIAGRAMM = { orte: {}, breite: BREITE, hoehe: HOEHE, physik: PHYSIK, marker: MARKER,
  waage: { ...WAAGE, fuss: FUSS }, nah: NAH.diagramm, nahAlt: NAH.diagrammAlt };

// ---------------------------------------------------------------------------
// Darsteller-Grafiken (SVG). Licht nur über Deckkraft von Palettenfarben: Grundton,
// darüber Navy als Schatten und Creme als Licht. So entsteht kein Ton außerhalb von
// DESIGN.md §4, und die Gegenstände sehen trotzdem beleuchtet aus.
// ---------------------------------------------------------------------------
// Maße des Münzstapels (auch für seinen Umriss): 10 Münzen, Fuß bei (0,0), 288 px hoch
const STAPEL = { versatz: [0, 3, -2, 4, -3, 2, -1, 3, -2, 1], rx: 64, ry: 20, dicke: 24.8 };

function muenzen(id) {
  // 10 Münzen, leicht versetzt wie von Hand gestapelt. "id" macht die Verlaufs-IDs eindeutig:
  // Der Stapel kommt zweimal ins Dokument (echtes Geld in Barcelona, Geld in München).
  const { versatz, rx, ry, dicke } = STAPEL;
  const teile = [
    `<defs>`,
    `<linearGradient id="${id}-rand" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0E1726" stop-opacity="0.55"/>` +
      `<stop offset="0.35" stop-color="#0E1726" stop-opacity="0"/><stop offset="0.5" stop-color="#F5F0E8" stop-opacity="0.18"/>` +
      `<stop offset="0.8" stop-color="#0E1726" stop-opacity="0.3"/><stop offset="1" stop-color="#0E1726" stop-opacity="0.65"/></linearGradient>`,
    `<radialGradient id="${id}-oben" cx="0.35" cy="0.3" r="0.85"><stop offset="0" stop-color="#F5F0E8" stop-opacity="0.55"/>` +
      `<stop offset="0.5" stop-color="#F5F0E8" stop-opacity="0.08"/><stop offset="1" stop-color="#0E1726" stop-opacity="0.25"/></radialGradient>`,
    `</defs>`,
  ];
  for (let i = 0; i < versatz.length; i++) {
    const cx = versatz[i];
    const cy = -ry - dicke - i * dicke; // Oberseite der Münze i
    const randPfad = `M${cx - rx} ${cy} v${dicke} a${rx} ${ry} 0 0 0 ${2 * rx} 0 v${-dicke} z`;
    teile.push(
      `<path d="${randPfad}" fill="#C9A84C"/><path d="${randPfad}" fill="url(#${id}-rand)"/>`,
      // Riffelung am Rand: kurze senkrechte Striche (Navy, halb durchsichtig)
      ...Array.from({ length: 11 }, (_, k) => {
        const a = Math.PI * (0.1 + (k / 10) * 0.8);
        const x = cx - Math.cos(a) * rx;
        const y = cy + Math.sin(a) * ry;
        return `<path d="M${x.toFixed(1)} ${(y + 3).toFixed(1)} v${(dicke - 6).toFixed(1)}" stroke="#0E1726" stroke-opacity="0.32" stroke-width="2" stroke-linecap="round"/>`;
      }),
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#C9A84C"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id}-oben)"/>`,
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#0E1726" stroke-opacity="0.35" stroke-width="1.5"/>`,
      // Lichtkante oben links auf jeder Münze
      `<path d="M${cx - rx + 7} ${cy - 3} q ${rx * 0.5} ${-ry * 0.95} ${rx * 1.15} ${-ry * 0.9}" fill="none" stroke="#F5F0E8" stroke-opacity="0.7" stroke-width="2" stroke-linecap="round"/>`,
    );
  }
  // oberste Münze: Prägung (Ring + €-Zeichen, Navy halb durchsichtig)
  const cx = versatz[versatz.length - 1];
  const cy = -ry - dicke - (versatz.length - 1) * dicke;
  teile.push(
    `<ellipse cx="${cx}" cy="${cy}" rx="46" ry="14" fill="none" stroke="#0E1726" stroke-opacity="0.35" stroke-width="2.5"/>`,
    // Das €-Zeichen ist GEZEICHNET (Bogen + zwei Striche), kein Text: Als Schrift war es effektiv
    // 26 px groß und damit unter jeder Schriftstufe (Prüfung 3). Als Prägung ist es eine Form.
    `<path d="M10 -11 A15 15 0 1 0 10 11 M-22 -4 L5 -4 M-22 4 L5 4" fill="none" stroke="#0E1726" stroke-opacity="0.42" stroke-width="4" stroke-linecap="round" transform="translate(${cx} ${cy}) scale(1 0.5)"/>`,
  );
  return teile.join("");
}

// GEIST = gestrichelter Gold-Umriss eines Gegenstands: eine MÖGLICHKEIT, kein echtes Ding
// (Runde 1). Er steht für Geld, das man nicht bekommt, und für den Spieler, den man abgibt,
// also genau für die Opportunitätskosten. Gleiche Bildsprache wie das gestrichelte Gold-Fach
// "aufgegeben" im Diagramm. Technik: Die Umrisslinie ist doppelt so breit wie gewollt; eine
// Maske schneidet die innere Hälfte weg. So bleibt nur der äußere Rand der VEREINIGUNG aller
// Teile stehen (keine Linien, wo sich Kopf, Arme und Körper überlappen).
function geist(id, formen, { breite = 5, fuellung = 0.14 } = {}) {
  const alle = formen.join("");
  const gefuellt = alle.replace(/<(path|ellipse|circle|rect)\b/g, '<$1 fill="#000"');
  return [
    `<defs><mask id="${id}-maske" maskUnits="userSpaceOnUse" x="-200" y="-400" width="400" height="460">`,
    `<rect x="-200" y="-400" width="400" height="460" fill="#fff"/>${gefuellt}</mask></defs>`,
    // Fläche: Gold 14 %, als Gruppe (Überlappungen werden nicht dunkler)
    `<g opacity="${fuellung}" fill="#C9A84C">${alle}</g>`,
    `<g mask="url(#${id}-maske)" fill="none" stroke="#C9A84C" stroke-width="${2 * breite}" stroke-dasharray="16 11" stroke-linejoin="round">${alle}</g>`,
  ].join("");
}

function stapelFormen() {
  const { versatz, rx, ry, dicke } = STAPEL;
  const oben = -ry - dicke - (versatz.length - 1) * dicke;
  // Zylinder: Seiten und unterer Bogen, darüber die oberste Münze
  return [
    `<path d="M${-rx - 2} ${oben} L${-rx - 2} ${-ry} A${rx + 2} ${ry} 0 0 0 ${rx + 3} ${-ry} L${rx + 3} ${oben} Z"/>`,
    `<ellipse cx="0.5" cy="${oben}" rx="${rx + 2.5}" ry="${ry}"/>`,
  ];
}
function geistStapel(id) {
  const { versatz, rx, ry, dicke } = STAPEL;
  // Drei Münzfugen als feine Linien im Umriss: Man erkennt den Stapel, aber er ist nicht da.
  const fugen = [3, 6].map((i) => {
    const cy = -ry - dicke - i * dicke + dicke;
    return `<path d="M${-rx} ${cy} A${rx} ${ry} 0 0 0 ${rx} ${cy}" fill="none" stroke="#C9A84C" stroke-opacity="0.55" stroke-width="3" stroke-dasharray="10 9"/>`;
  });
  return geist(id, stapelFormen()) + fugen.join("") + `<ellipse cx="0.5" cy="${-ry - dicke - (versatz.length - 1) * dicke}" rx="44" ry="13" fill="none" stroke="#C9A84C" stroke-opacity="0.55" stroke-width="3" stroke-dasharray="10 9"/>`;
}

// Spieler (Fassung v2): ein echtes Foto statt der Tipp-Kick-Figur. build/foto.py holt es von
// Wikimedia Commons (Lewandowski im Bundesligaspiel, Steffen Prößdorf, CC BY-SA 4.0), stellt es
// frei, färbt es Duoton und schreibt Maße, Umriss und Hand nach build/foto-lewandowski.json.
// Fuß der Hülle bei (0, 0), Figur waagerecht mittig. Credits: credits.json und die HUD-Szenen.
const FOTO = JSON.parse(fs.readFileSync(path.join(HIER, "foto-lewandowski.json"), "utf8"));
for (const datei of [FOTO.bild, FOTO.dunkel, FOTO.abzug.bild, FOTO.abzug.figur]) {
  if (!fs.existsSync(path.join(PROJEKT, datei))) throw new Error(`${datei} fehlt: erst build/foto.py laufen lassen`);
}
// v2.1: Hülle mit zwei deckenden Bildern. "dunkel" liegt unten, "hell" darüber; Zurücktreten =
// "hell" blendet aus (drehbuch-atlas.js). Sonst schien die Karte durch das Foto (Kritik 28.10.).
function spielfoto() {
  const b = FOTO.breite;
  const h = FOTO.hoehe;
  return `<div id="a-spieler-bild" class="a-foto" style="left: ${-b / 2}px; top: ${-h}px; width: ${b}px; height: ${h}px;">` +
    `<img id="a-spieler-dunkel" src="${FOTO.dunkel}" alt="" /><img id="a-spieler-hell" src="${FOTO.bild}" alt="" /></div>`;
}
// Abzug im Hook (v2.1): Lage auf dem Bild (Bildpixel, die Kamera steht im Hook). Rechts unter der
// Schlagzeile: oben frei für den Titel (y <= 486), links frei für Barcelona und den Namen, unten
// endet er vor der Untertitel-Zone (y 1350). 1,5 Grad gedreht wie ein hingelegter Abzug.
const ABZUG_LAGE = { x: 490, y: 489, rot: 0.6 };
const AB = (() => {
  const a = FOTO.abzug;
  const [k0, k1, k2, k3] = a.figur_kasten.map((v) => v * a.skala);
  const fuss = [(k0 + k2) / 2, k3]; // Fuß der Figur im Abzug (Mitte ihrer Unterkante)
  return { ...ABZUG_LAGE, w: a.breite, h: a.hoehe, figur: { x: k0, y: k1, w: k2 - k0, h: k3 - k1 }, fuss,
    // Ziel: Fuß auf München in der Totale (dort steht der Darsteller), Größe wie der Darsteller
    ziel: TOTALE_MUENCHEN, k: FOTO.hoehe / (k3 - k1) };
})();
DATEN_ATLAS.abzug = AB;
function fotoHook() {
  const r = (v) => Math.round(v * 10) / 10;
  return `<div id="fh-ebene" data-layout-ignore>` +
    `<div id="fh-abzug" style="left: ${AB.x}px; top: ${AB.y}px; width: ${r(AB.w)}px; height: ${r(AB.h)}px;">` +
    `<div id="fh-rahmen"><img id="fh-foto" src="${FOTO.abzug.bild}" alt="" style="width: ${r(AB.w)}px; height: ${r(AB.h)}px;" /></div>` +
    `<img id="fh-figur" src="${FOTO.abzug.figur}" alt="" style="left: ${r(AB.figur.x)}px; top: ${r(AB.figur.y)}px; width: ${r(AB.figur.w)}px; height: ${r(AB.figur.h)}px;" />` +
    // Name links neben dem Abzug auf Brusthöhe (24 % der Abzughöhe): auf Kopfhöhe stünde er direkt
    // unter der Schlagzeile und läse sich als ihre dritte Zeile.
    `<div id="fh-name" class="a-etikett" style="right: ${r(AB.w + 30)}px; top: ${r(0.24 * AB.h - 31)}px; font-size: 48px;">Lewandowski</div>` +
    `</div></div>`;
}
// Der GEIST des Spielers ist der Rand des Fotos (Randverfolgung in build/foto.py): Was nach dem
// Abflug auf der Kosten-Schale bleibt, ist wirklich sein Umriss.
function geistFigur(id) {
  return geist(id, [`<path d="${FOTO.umriss}"/>`]);
}

// ---------------------------------------------------------------------------
// 4) EINSETZEN. Für jede Zieldatei steht fest, welche Blöcke sie braucht. Fehlt eine
//    Marke (oder ist sie verschrieben), bricht der Bau ab.
// ---------------------------------------------------------------------------
const lies = (p) => fs.readFileSync(path.join(PROJEKT, p), "utf8");
function ersetzePlatzhalter(text, marke, inhalt, datei) {
  if (!text.includes(marke)) throw new Error(`Platzhalter ${marke} fehlt in ${datei}`);
  return text.replace(marke, () => inhalt);
}
const ohneKopfKommentar = (t) => t.replace(/^<!--[\s\S]*?-->\n/, ""); // Erklär-Kommentar nicht in jede Datei kopieren
let atlasFragment = ohneKopfKommentar(lies("lib/atlas.html"));
atlasFragment = ersetzePlatzhalter(atlasFragment, "<!-- @karte -->", karte, "lib/atlas.html");
atlasFragment = ersetzePlatzhalter(atlasFragment, "<!-- @laender -->", laenderHtml, "lib/atlas.html");
atlasFragment = ersetzePlatzhalter(atlasFragment, "<!-- @muenzen -->", muenzen("mz-bcn"), "lib/atlas.html");
atlasFragment = ersetzePlatzhalter(atlasFragment, "<!-- @muenzen-muenchen -->", muenzen("mz-mue"), "lib/atlas.html");
atlasFragment = ersetzePlatzhalter(atlasFragment, "<!-- @geist-stapel -->", geistStapel("gs"), "lib/atlas.html");
atlasFragment = ersetzePlatzhalter(atlasFragment, "<!-- @spielfoto -->", spielfoto(), "lib/atlas.html");
atlasFragment = ersetzePlatzhalter(atlasFragment, "<!-- @foto-hook -->", fotoHook(), "lib/atlas.html");
// Die drei Schnüre der Preisschilder beginnen an seiner Hand (aus dem Foto gemessen)
if (atlasFragment.split("M@hand ").length !== 4) throw new Error("lib/atlas.html: drei Schnüre mit M@hand erwartet");
atlasFragment = atlasFragment.replaceAll("M@hand ", `M${FOTO.hand[0]} ${FOTO.hand[1]} `);
atlasFragment = ersetzePlatzhalter(atlasFragment, "<!-- @geist-figur -->", geistFigur("gf"), "lib/atlas.html");
const diagrammFragment = ohneKopfKommentar(lies("lib/diagramm.html"));

const datenBlock = (name, daten) =>
  "// eingesetzt von build/bauen.mjs (nicht von Hand ändern)\n" +
  "// WORTE: Wort-Cues aus assets/timing.json (Bild 2 Bilder vor dem Wort). ZEIT: Cues plus abgeleitete Zeiten.\n" +
  `const WORTE = ${JSON.stringify(WORTE)};\n` +
  `const ZEIT = ${JSON.stringify(ZEIT)};\n` +
  `const SZENEN = ${JSON.stringify(SZENEN)};\n` +
  `const BUEHNEN = ${JSON.stringify(BUEHNEN)};\n` +
  (daten ? `const DATEN = ${JSON.stringify(daten)};\n` : "");

const BLOECKE = {
  atlas: { art: "html", inhalt: atlasFragment },
  diagramm: { art: "html", inhalt: diagrammFragment },
  schriften: { art: "js", inhalt: schriftenCss }, // CSS-Kommentar /* */ wie bei JS
  // Der lange Kopf-Kommentar (Seek-Regeln) steht in lib/marker.js; eingesetzt wird ein Verweis.
  // So bleiben die drei HUD-Szenen mit Marker unter 300 Zeilen (check: composition_file_too_large).
  marker: { art: "js", inhalt: lies("lib/marker.js").replace(/^\/\*[\s\S]*?\*\/\n/, "// DeepTok Marker-Ebene. Kommentierte Quelle mit den drei Seek-Regeln: lib/marker.js\n") },
  buehne: { art: "js", inhalt: lies("lib/buehne.js") },
  daten: { art: "js", inhalt: datenBlock("hud", null) },
  datenAtlas: { art: "js", inhalt: datenBlock("atlas", DATEN_ATLAS) },
  datenDiagramm: { art: "js", inhalt: datenBlock("diagramm", DATEN_DIAGRAMM) },
  drehbuchAtlas: { art: "js", inhalt: lies("build/drehbuch-atlas.js") },
  drehbuchDiagramm: { art: "js", inhalt: lies("build/drehbuch-diagramm.js") },
};

function setzeEin(text, datei, name) {
  const { art, inhalt } = BLOECKE[name];
  const [a, e] = art === "html" ? [`<!-- @${name}:anfang -->`, `<!-- @${name}:ende -->`] : [`/* @${name}:anfang */`, `/* @${name}:ende */`];
  const zaehle = (s) => text.split(s).length - 1;
  if (zaehle(a) !== 1 || zaehle(e) !== 1) {
    throw new Error(`${datei}: Marke ${a} oder ${e} fehlt oder steht mehrfach (gefunden: ${zaehle(a)}x / ${zaehle(e)}x)`);
  }
  const i = text.indexOf(a);
  const j = text.indexOf(e);
  if (j < i) throw new Error(`${datei}: ${e} steht vor ${a}`);
  return text.slice(0, i + a.length) + "\n" + inhalt + "\n" + text.slice(j);
}

// ---------------------------------------------------------------------------
// 5) ZEITEN INS HTML. Ein Clip trägt statt fester Zahlen
//      data-cue="vertrag"            Beginn = ZEIT.vertrag
//      data-cue-versatz="0.6"        (optional) Sekunden dazu
//      data-cue-bis="vertragAus"     (optional) Ende; sonst Ende der Szene
//    und der Bau schreibt data-start/data-duration (relativ zur Szene) dazu.
// ---------------------------------------------------------------------------
const r3 = (v) => String(Math.round(v * 1000) / 1000);
// Ganze Millisekunden. Beginn und Ende werden EINZELN gerundet, die Dauer ist ihre Differenz:
// So ist Beginn + Dauer genau das gerundete Ende. Vorher wurden Beginn und Dauer einzeln
// gerundet, ein Clip endete dadurch 1 ms vor seiner Szene, und an der Naht fehlte ein Bild
// (Bild 989, Kritik Prüfung 3).
const ms = (v) => Math.round(v * 1000);
const msText = (m) => String(m / 1000);
function setzeAttr(tag, name, wert, datei) {
  const re = new RegExp(`\\s${name}="[^"]*"`);
  if (!re.test(tag)) throw new Error(`${datei}: ${name} fehlt in ${tag.slice(0, 80)}…`);
  return tag.replace(re, ` ${name}="${wert}"`);
}
const attr = (tag, name) => (tag.match(new RegExp(`\\s${name}="([^"]*)"`)) || [])[1];
const zeitVon = (name, datei) => {
  if (!(name in ZEIT)) throw new Error(`${datei}: unbekannter Cue "${name}"`);
  return ZEIT[name];
};

function setzeZeiten(text, datei, basis) {
  let anzahl = 0;
  text = text.replace(/<[a-z][^>]*\sdata-cue="[^"]*"[^>]*>/g, (tag) => {
    const beginn = Math.max(basis.beginn, zeitVon(attr(tag, "data-cue"), datei) + Number(attr(tag, "data-cue-versatz") || 0));
    const bis = attr(tag, "data-cue-bis");
    const ende = Math.min(bis ? zeitVon(bis, datei) + Number(attr(tag, "data-cue-bis-versatz") || 0) : basis.ende, basis.ende);
    if (ende - beginn <= 0) {
      throw new Error(`${datei}: Clip ${attr(tag, "id")} liegt außerhalb der Szene (${beginn.toFixed(2)}–${ende.toFixed(2)} s, Szene ${basis.beginn.toFixed(2)}–${basis.ende.toFixed(2)})`);
    }
    anzahl++;
    // Erst die absoluten Zeiten auf ms runden, dann abziehen: genau wie bei den Hosts (unten).
    // So endet ein Clip, der bis zum Szenenende läuft, auf die ms genau mit seinem Host.
    const a = ms(beginn) - ms(basis.beginn);
    const e = ms(ende) - ms(basis.beginn);
    tag = setzeAttr(tag, "data-start", msText(a), datei);
    return setzeAttr(tag, "data-duration", msText(e - a), datei);
  });
  // Hosts (nur in index.html): HUD-Szenen aus SZENEN, Bühnen aus BUEHNEN
  text = text.replace(/<div[^>]*\sdata-composition-src="[^"]*"[^>]*>/g, (tag) => {
    const id = attr(tag, "data-composition-id");
    const s = SZENEN.find((x) => x.id === id) || BUEHNEN[id];
    if (!s) throw new Error(`${datei}: Host ${id} hat keine Zeiten`);
    anzahl++;
    tag = setzeAttr(tag, "data-start", msText(ms(s.beginn)), datei);
    return setzeAttr(tag, "data-duration", msText(ms(s.ende) - ms(s.beginn)), datei);
  });
  text = text.replace(/<div[^>]*\sdata-composition-id="main"[^>]*>/, (tag) => {
    anzahl++;
    return setzeAttr(tag, "data-duration", r3(ZEIT.ende), datei);
  });
  // Die Tonspur läuft über die ganze Länge
  text = text.replace(/<audio[^>]*\sid="stimme"[^>]*>/, (tag) => {
    anzahl++;
    return setzeAttr(tag, "data-duration", r3(ZEIT.ende), datei);
  });
  return { text, anzahl };
}

const GANZ = { beginn: 0, ende: ZEIT.ende };
const ZIELE = {
  "index.html": { bloecke: [], basis: GANZ },
  "compositions/atlas.html": { bloecke: ["atlas", "schriften", "marker", "buehne", "datenAtlas", "drehbuchAtlas"], basis: BUEHNEN.atlas },
  "compositions/diagramm.html": { bloecke: ["diagramm", "schriften", "marker", "buehne", "datenDiagramm", "drehbuchDiagramm"], basis: BUEHNEN.diagramm },
};
// Tor "Credit-Zeilen" (Fassung v2.1, Kritik 28.10.: im Bild stand eine andere Zeile als in
// credits.json): Jede Foto-Zeile, jeder Kurzlink und die Lizenz-Zeile im Bild stehen WÖRTLICH so
// in credits.json. Ob die Zeile auch dann zu sehen ist, wenn das Foto zu sehen ist, misst
// build/messen-bild.mjs im Player (Tor "Foto ohne Credit").
{
  const CREDITS = JSON.parse(lies("credits.json"));
  const erlaubt = new Set([...CREDITS.quellen.flatMap((q) => q.credit_zeilen_im_bild), CREDITS.lizenz_video.zeile_im_bild]);
  const fehler = [];
  let zahl = 0;
  for (const s of SZENEN) {
    for (const m of lies(`compositions/${s.id}.html`).matchAll(/class="clip credit[^"]*"[^>]*>([^<]*)</g)) {
      const zeile = m[1].replace(/&nbsp;/g, " ").trim();
      if (!/^(Foto|Video):|curid=/.test(zeile)) continue;
      zahl++;
      if (!erlaubt.has(zeile)) fehler.push(`${s.id}: "${zeile}"`);
    }
  }
  if (fehler.length) throw new Error("Credit-Zeile im Bild steht so nicht in credits.json:\n  " + fehler.join("\n  "));
  console.log(`Credit-Zeilen: ${zahl} Foto-/Lizenz-Zeilen im Bild, alle wörtlich in credits.json`);
}
for (const s of SZENEN) {
  const datei = `compositions/${s.id}.html`;
  const text = lies(datei);
  const bloecke = ["schriften", "daten"];
  if (text.includes("/* @marker:anfang */")) bloecke.push("marker");
  ZIELE[datei] = { bloecke, basis: s };
}
for (const [ziel, { bloecke, basis }] of Object.entries(ZIELE)) {
  const datei = path.join(PROJEKT, ziel);
  if (!fs.existsSync(datei)) throw new Error("Zieldatei fehlt: " + ziel);
  let t = fs.readFileSync(datei, "utf8");
  for (const name of bloecke) t = setzeEin(t, ziel, name); // Reihenfolge: Welt vor Schriften (die Welt bringt die Schrift-Marke mit)
  const z = setzeZeiten(t, ziel, basis);
  fs.writeFileSync(datei, z.text);
  console.log("geschrieben:", ziel.padEnd(32), String(Math.round(z.text.length / 1024)).padStart(4) + " KB,", bloecke.length, "Blöcke,", z.anzahl, "Zeiten");
}

console.log("Szenen:", SZENEN.map((s) => `${s.id} ${s.beginn.toFixed(2)}-${s.ende.toFixed(2)}`).join(" | "));
console.log("Karte:", Math.round(karte.length / 1024) + " KB SVG-Pfade; Orte:", JSON.stringify(orte));
console.log("Kamera:", JSON.stringify(kamera));

// ---------------------------------------------------------------------------
// 6) MESSEN: Passt jede Textzeile der HUD-Szenen ins Lesefenster? Gemessen im Browser mit
//    geladenen Schriften (DESIGN.md §3 "Breite messen, nicht schätzen").
// ---------------------------------------------------------------------------
if (!process.argv.includes("--ohne-messen")) await messeHud();

async function messeHud() {
  // puppeteer-core liegt in der HyperFrames-Installation (kein eigener Download nötig).
  let puppeteer;
  const orte_ = [path.join(HIER, "node_modules"), path.join(process.env.NPM_CONFIG_PREFIX || "/opt/deeptok/node", "lib/node_modules/hyperframes")];
  for (const o of orte_) {
    try {
      puppeteer = createRequire(path.join(o, "package.json"))("puppeteer-core");
      break;
    } catch {
      /* nächster Ort */
    }
  }
  const chrome = process.env.HYPERFRAMES_BROWSER_PATH;
  if (!puppeteer || !chrome) {
    console.log("MESSEN übersprungen: puppeteer-core oder HYPERFRAMES_BROWSER_PATH fehlt (vorher . /opt/deeptok/env.sh)");
    return;
  }
  const browser = await puppeteer.launch({ executablePath: chrome, args: ["--no-sandbox", "--allow-file-access-from-files"] });
  const fehler = [];
  try {
    const seite = await browser.newPage();
    await seite.setViewport({ width: BREITE, height: HOEHE });
    for (const s of SZENEN) {
      const vorlage = lies(`compositions/${s.id}.html`);
      const inhalt = vorlage.replace(/^[\s\S]*?<template>/, "").replace(/<\/template>[\s\S]*$/, "").replace(/<script>[\s\S]*?<\/script>/g, "");
      const html = `<!doctype html><html><head><meta charset="utf-8"><base href="file://${PROJEKT}/"><style>body{margin:0;width:1080px;height:1920px;position:relative;background:#0E1726}</style></head><body>${inhalt}</body></html>`;
      const tmp = path.join(CACHE, "messen.html");
      fs.writeFileSync(tmp, html);
      await seite.goto("file://" + tmp);
      const boxen = await seite.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(['900 124px "DT Playfair"', '600 52px "DT Inter"', '400 34px "DT Inter"'].map((f) => document.fonts.load(f)));
        // Jedes Element mit Text, das selbst ein Clip ist oder in einem Clip liegt
        return Array.from(document.querySelectorAll(".clip, .clip *"))
          .filter((el) => el.childNodes.length && Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim()))
          .filter((el) => !el.closest("[data-mess-frei]"))
          .map((el) => {
            const r = el.getBoundingClientRect();
            return { id: el.id || el.closest("[id]")?.id, text: el.textContent.trim().slice(0, 40), l: r.left, r: r.right, o: r.top, u: r.bottom };
          });
      });
      for (const b of boxen) {
        const fehlt = [];
        if (b.l < 108 - 0.5) fehlt.push(`links ${b.l.toFixed(0)} < 108`);
        if (b.r > 972 + 0.5) fehlt.push(`rechts ${b.r.toFixed(0)} > 972`);
        if (b.o < 168 - 0.5) fehlt.push(`oben ${b.o.toFixed(0)} < 168`);
        if (b.u > 1330 + 0.5) fehlt.push(`unten ${b.u.toFixed(0)} > 1330`);
        if (fehlt.length) fehler.push(`${s.id} #${b.id} "${b.text}": ${fehlt.join(", ")}`);
      }
    }
  } finally {
    await browser.close();
  }
  if (fehler.length) throw new Error("Text außerhalb des Lesefensters (DESIGN.md §2):\n  " + fehler.join("\n  "));
  console.log("Messen: alle HUD-Texte im Lesefenster (x 108-972, y 168-1330)");
}
