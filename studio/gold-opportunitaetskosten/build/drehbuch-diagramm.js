// ---- Drehbuch der Diagramm-Bühne (Beats 9-12) ----
// Erwartet im selben Gültigkeitsbereich: tl, ZEIT, DATEN, BUEHNEN (von build/bauen.mjs).
// Die Bühne beginnt mit dem harten Schnitt auf "Waage". Ihre Zeitachse zählt ab dort:
// lokale Zeit = absolute Zeit - T0.
//
// Runde 1 (Kritik): Die Kosten-Schale zeigt die Pointe als Bild. Links das Gold-Fach
// "aufgegeben" (dort landet der Lohn), rechts die Rechnung "bezahlt: 0 €" (die Kinokarte war
// geschenkt).
//
// Runde 2 (Kritik):
//   - Nach dem Schnitt steht nur die leere Waage. Jede Kategorie kommt mit ihrem Beispiel
//     (Beispiel vor Regel, Prüfung 2): die Rechnung FÄLLT auf "geschenkt" (schon mit "0 €"),
//     das Gold-Fach "aufgegeben" rastet auf "Genau dann" ein.
//   - Schrift auf Gegenständen >= 48 px, Fach und Tüte deckend (Prüfung 1 und 3).
//   - Auf "Gratis" treten Gestell und Nutzen-Seite zurück, die Welt fährt groß an die
//     Kosten-Schale (Prüfung 1: vorher 13 s dieselbe Totale). Auf "nicht" zuckt die Lohntüte
//     neben der Rechnung "0 €": Das Bild sagt "nicht gratis" (statt "geschenkt ≠ gratis").
//   - Im Satz liegen die Marker am Helden: Gold unter "aufgegeben", Navy unter "Rechnung".
const Z = ZEIT;
const T0 = BUEHNEN.diagramm.beginn;
const L = (name) => Z[name] - T0;
const PH = DATEN.physik;
const N = DATEN.waage.neigung;
const NAH = DATEN.nah;

const plan = {
  // Nachfahrt ab "Gratis": Die Mitte der Kosten-Schale (fx, fy) wandert in die Bildmitte (zx, zy)
  // und wird r-mal so groß (DESIGN.md §7 Diagramm: "Details per Zoom-in").
  nah: [
    Object.assign({}, NAH, { t: 0, r: 1, zx: NAH.fx, zy: NAH.fy }),
    Object.assign({}, NAH, { t: L("nahSatz"), r: 1, zx: NAH.fx, zy: NAH.fy }),
    Object.assign({}, NAH, { t: L("nahSatzEnde"), ease: "power2.inOut" }),
  ],
  spuren: {
    // Die Waage bleibt im Transfer am Ende WAAGERECHT: Die Wahl bleibt offen, kein Rat.
    // Die Rechnung (0 €) wiegt nichts: Sie ändert die Neigung nicht.
    neigung: [
      { t: 0, v: 0 },
      { t: L("neigungKarte"), v: 0 },
      { t: L("neigungKarte") + 0.8, v: N, ease: "back.out(1.6)" }, // Kinokarte: Nutzen
      { t: L("lohnLandet"), v: N },
      { t: L("lohnLandet") + 0.9, v: 0, ease: "back.out(2.2)" }, // Lohn im Gold-Fach: waagerecht
    ],
  },
  akteure: {
    karte: [{ ab: L("karteFall"), bis: L("karteFall") + PH.fallzeit, nach: "schale:rechts:0", art: "fall", hoehe: 420 }],
    lohn: [
      // Die Tüte zeichnet sich über dem Gold-Fach (neben "Nachhilfe, heute Abend") ...
      // Groß (1,4-fach), solange sie allein steht: Sie ist der Gold-Held des Transfers.
      { ab: L("lohnZeichnen"), bis: L("lohnZeichnen"), nach: "bild:188:552", art: "sofort", skala: 1.4 },
      // ... und fällt auf "Lohn" senkrecht hinein (Mitte des Fachs: 104 px links der Schalenmitte).
      { ab: L("lohnFall"), bis: L("lohnLandet"), nach: "schale:links:-104:-8", art: "sturz", skala: 1 },
    ],
  },
};

const buehne = window.DeepTokBuehne.erstelle({
  wurzel: document.getElementById("d-buehne").parentElement,
  daten: DATEN,
  plan: plan,
  praefix: "d",
});
window.__deeptokDiagramm = buehne;

const rein = (sel, t, extra) =>
  tl.fromTo(sel, { opacity: 0, filter: "blur(8px)" }, Object.assign({ opacity: 1, filter: "blur(0px)", duration: 0.2, ease: "power2.out" }, extra || {}), t);
const raus = (sel, t, extra) =>
  tl.fromTo(sel, { opacity: 1, filter: "blur(0px)" },
    Object.assign({ opacity: 0, filter: "blur(8px)", duration: 0.18, ease: "power2.in", immediateRender: false }, extra || {}), t);
// "Zeichnen" (DESIGN.md §5 Diagramm): Strich-Offset L -> 0, ca. 1000 px/s. Die Fläche kommt MIT
// dem Strich (Deckkraft der Füllung 0 -> 1 in derselben Zeit): Vorher stand sie schon vor dem
// Strich als dunkles Loch im Raster (Prüfung 1).
function zeichnen(sel, t) {
  const el = document.querySelector(sel);
  const laenge = el.getTotalLength ? el.getTotalLength() : 1000;
  const dauer = Math.max(0.3, laenge / 1000);
  el.setAttribute("stroke-dasharray", laenge.toFixed(1) + " " + (laenge + 20).toFixed(1));
  tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.001, ease: "none" }, t);
  tl.fromTo(el, { strokeDashoffset: laenge + 10 }, { strokeDashoffset: 0, duration: dauer, ease: "power1.inOut" }, t);
  tl.fromTo(el, { fillOpacity: 0 }, { fillOpacity: 1, duration: dauer, ease: "power1.in" }, t);
}
// "Einrasten": Maßstab klein -> 1 mit Feder, Unschärfe weg.
function einrasten(sel, t, ursprung) {
  tl.fromTo(sel, { opacity: 0, scale: 0.6, filter: "blur(8px)", transformOrigin: ursprung || "0% 50%" },
    { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.35, ease: "back.out(2.2)" }, t);
}
// Aufprall: Stauchen am Boden (Ursprung unten), dann zurückfedern.
function aufprall(sel, t, staerke, erst) {
  tl.fromTo(sel, { scaleY: 1, transformOrigin: "50% 100%" }, { scaleY: staerke, duration: 0.07, ease: "power1.out", immediateRender: erst !== false }, t);
  tl.fromTo(sel, { scaleY: staerke }, { scaleY: 1, duration: 0.3, ease: "back.out(3)", immediateRender: false }, t + 0.07);
}
// Abdunkeln (DESIGN.md §6): auf 35 %
const dunkel = (sel, t) => tl.fromTo(sel, { opacity: 1 }, { opacity: 0.35, duration: 0.3, ease: "power2.inOut" }, t);

// Beat 9: Schnitt auf "Waage": nur die leere Waage ("Kosten" / "Nutzen"). Rechnung und Gold-Fach
// sind noch nicht da (Kategorie erst mit Beispiel).
// Beat 10: Kinokarte fällt auf "Kinokarte" (render), das Schild sagt, was gewogen wird: "Kino".
aufprall("#a-karte-bild", L("karteFall") + PH.fallzeit, 0.9);
tl.fromTo("#d-schild-inhalt", { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" }, L("schildKino"));
// "geschenkt": Die Rechnung FÄLLT auf die Kosten-Schale (volle Deckkraft, Fallen wie im Atlas,
// kein graues Einblenden), auf ihr steht schon "0 €"; nach dem Aufprall der Stempel "bezahlt".
// Sie wiegt nichts: Die Waage bleibt, wie sie ist.
tl.fromTo("#d-rechnung", { opacity: 0 }, { opacity: 1, duration: 0.04, ease: "none" }, L("rechnungFall"));
tl.fromTo("#d-rechnung", { y: -420 }, { y: 0, duration: PH.fallzeit, ease: "power2.in" }, L("rechnungFall"));
aufprall("#d-rechnung", L("rechnungFall") + PH.fallzeit, 0.92, false);
tl.fromTo("#d-rechnung-stempel", { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.28, ease: "back.out(2.2)" }, L("rechnungFall") + PH.fallzeit + 0.15);
// "Genau dann": Das gestrichelte Gold-Fach rastet neben der Rechnung ein, darunter "aufgegeben".
einrasten("#d-fach-svg", L("fach"), "50% 100%");
rein("#d-aufgegeben", L("fach") + 0.12);
// "Nachhilfe": oben links, mit derselben Zeitmarke "heute Abend" (beides zugleich geht nicht)
einrasten("#d-nachhilfe", L("nachhilfe"));
einrasten("#d-abend", L("nachhilfe") + 0.12);
// "Geld": Die Lohntüte zeichnet sich neben "Nachhilfe"
zeichnen("#d-lohn-umriss", L("lohnZeichnen"));
zeichnen("#d-lohn-klappe", L("lohnZeichnen") + 0.3);
rein("#d-lohn-text", L("lohnZeichnen") + 0.45);
// Beat 11: Auf "Lohn" fällt die Tüte ins Gold-Fach (render). "Nachhilfe, heute Abend" gehen mit
// ihr (sonst schwebten sie ohne Gegenstand, Prüfung 1). Beim Aufprall staucht die Tüte.
raus(["#d-nachhilfe", "#d-abend"], L("nachhilfeAus"), { stagger: 0.05 });
aufprall("#a-lohn-bild", L("lohnLandet"), 0.9);
// "Gratis": Gestell, Nutzen-Seite und Kinokarte treten zurück; die Welt fährt an die Kosten-Schale.
dunkel(["#d-gestell", "#d-rechts", "#a-karte-bild"], L("dimRest"));
raus("#d-gestell-unten", L("dimRest"), { duration: 0.3 });
// "nicht" (gratis): Die Tüte zuckt neben der Rechnung "0 €" (Maßstab 1 -> 1,12 -> 1).
tl.fromTo("#a-lohn-bild", { scale: 1, transformOrigin: "50% 100%" },
  { scale: 1.12, duration: 0.16, ease: "power2.out", immediateRender: false }, L("puls"));
tl.fromTo("#a-lohn-bild", { scale: 1.12 }, { scale: 1, duration: 0.32, ease: "back.out(2.5)", immediateRender: false }, L("puls") + 0.16);
// Beat 12: "Auch was du AUFGIBST": Gold-Unterstreichung unter "aufgegeben" (am Gold-Fach).
// "Es steht nur auf keiner RECHNUNG": Navy-Unterstreichung unter dem Kopf der Rechnung, in der
// Tinte des Stempels (Creme auf Creme-Papier wäre unsichtbar). Der Lohn daneben steht auf keiner.
const M = window.DeepTokMarker;
const etikett = document.getElementById("d-aufgegeben");
M.marker(tl, document.getElementById("d-marker-reihe"), "linie",
  { x0: etikett.offsetLeft - 6, x1: etikett.offsetLeft + etikett.offsetWidth + 14, y: etikett.offsetTop + 58 },
  { farbe: "#C9A84C", breite: 10, seed: 6, beginn: L("aufgeben"), dauer: DATEN.marker.linie, id: "d-linie-aufgegeben" });
M.marker(tl, document.getElementById("d-marker-kosten"), "linie",
  { x0: -2, x1: 220, y: -170 },
  { farbe: "#1F3864", breite: 8, seed: 3, beginn: L("rechnung"), dauer: DATEN.marker.linie, id: "d-linie-rechnung", anstieg: -8, bogen: 4 });

tl.to({}, { duration: BUEHNEN.diagramm.ende - T0 }, 0);
tl.eventCallback("onUpdate", function () {
  buehne.render(tl.time());
});
buehne.render(0);
