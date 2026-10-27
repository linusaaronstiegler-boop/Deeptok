// ---- Drehbuch der Diagramm-Bühne (Beats 9-12) ----
// Erwartet im selben Gültigkeitsbereich: tl, ZEIT, DATEN, BUEHNEN (von build/bauen.mjs).
// Die Bühne beginnt mit dem harten Schnitt auf "Waage". Ihre Zeitachse zählt ab dort:
// lokale Zeit = absolute Zeit - T0.
const Z = ZEIT;
const T0 = BUEHNEN.diagramm.beginn;
const L = (name) => Z[name] - T0;
const PH = DATEN.physik;
const N = DATEN.waage.neigung;

const plan = {
  spuren: {
    // Die Waage bleibt im Transfer am Ende WAAGERECHT: Die Wahl bleibt offen, kein Rat.
    neigung: [
      { t: 0, v: 0 },
      { t: L("neigungKarte"), v: 0 },
      { t: L("neigungKarte") + 0.8, v: N, ease: "back.out(1.6)" }, // Kinokarte: Nutzen
      { t: L("lohnFlugEnde"), v: N },
      { t: L("lohnFlugEnde") + 0.9, v: 0, ease: "back.out(2.2)" }, // Lohn im Gold-Fach: waagerecht
    ],
  },
  akteure: {
    karte: [{ ab: L("karteFall"), bis: L("karteFall") + PH.fallzeit, nach: "schale:rechts:0", art: "fall", hoehe: 420 }],
    lohn: [
      { ab: L("lohnZeichnen"), bis: L("lohnZeichnen"), nach: "bild:240:1306", art: "sofort" },
      // In das Gold-Fach (über dem Fach "bezahlt"): kleiner, damit es hineinpasst.
      { ab: L("lohnFlug"), bis: L("lohnFlugEnde"), nach: "schale:links:66:-170", art: "schritt", hoehe: 160, skala: 0.42 },
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
// "Zeichnen" (DESIGN.md §5 Diagramm): Strich-Offset L -> 0, ca. 1000 px/s.
function zeichnen(sel, t) {
  const el = document.querySelector(sel);
  const laenge = el.getTotalLength ? el.getTotalLength() : 1000;
  el.setAttribute("stroke-dasharray", laenge.toFixed(1) + " " + (laenge + 20).toFixed(1));
  tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.001, ease: "none" }, t);
  tl.fromTo(el, { strokeDashoffset: laenge + 10 }, { strokeDashoffset: 0, duration: Math.max(0.3, laenge / 1000), ease: "power1.inOut" }, t);
}
// "Einrasten": Maßstab 0 -> 1 mit Feder, Beschriftung 0,12 s später aus der Unschärfe.
function einrasten(sel, t) {
  tl.fromTo(sel, { opacity: 0, scale: 0.6, filter: "blur(8px)", transformOrigin: "0% 50%" },
    { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.35, ease: "back.out(2.2)" }, t);
}

// Beat 9: Die Fächer der Kosten-Schale bauen sich kurz nach dem Schnitt auf.
zeichnen("#d-kasten-bezahlt", L("kaesten"));
tl.fromTo("#d-kasten-aufgegeben", { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" }, L("kaesten") + 0.25);
rein("#d-fach-bezahlt", L("kaesten") + 0.12);
rein("#d-fach-aufgegeben", L("kaesten") + 0.37);
// Beat 10: Kinokarte fällt auf "Kinokarte" (render), "geschenkt" im leeren Fach "bezahlt"
rein("#d-fach-geschenkt", L("geschenkt"));
einrasten("#d-nachhilfe", L("nachhilfe"));
einrasten("#d-abend", L("nachhilfe") + 0.12);
// Lohntüte zeichnet sich auf "Geld"
zeichnen("#d-lohn-umriss", L("lohnZeichnen"));
zeichnen("#d-lohn-klappe", L("lohnZeichnen") + 0.35);
rein("#d-lohn-text", L("lohnZeichnen") + 0.5);
// Im Fach wird die Tüte klein; ihr Aufdruck wäre dort unter 28 px (unlesbar). Er tritt ab,
// das Fach "aufgegeben" benennt sie jetzt.
raus("#d-lohn-text", L("lohnFlug"));
// Beat 11: Die Tüte wandert ins Gold-Fach, die Waage schwingt auf waagerecht. Kein Kreis:
// höchstens 1 Kreis je Video (DESIGN.md §6), die Bewegung ist hier das Zeichen.
const M = window.DeepTokMarker;
raus(["#d-nachhilfe", "#d-abend"], L("nachhilfeAus"), { stagger: 0.05 });
// Beat 12: Klammer "Rechnung" umfasst nur das Fach "bezahlt"; das Gold-Fach liegt außerhalb.
const g = DATEN.waage;
const randY = g.fuss[1] - g.saeule + g.kette; // Schalenrand bei waagerechter Waage
M.marker(tl, document.getElementById("m-rechnung"), "klammer",
  { x: g.fuss[0] - g.arm - 152, y0: randY - 160, y1: randY, yEtikett: 1030 },
  { farbe: "#F5F0E8", breite: 6, seed: 3, beginn: L("rechnung"), dauer: DATEN.marker.klammer, id: "m-klammer" });
rein("#d-rechnung", L("rechnung") + 0.3);

tl.to({}, { duration: BUEHNEN.diagramm.ende - T0 }, 0);
tl.eventCallback("onUpdate", function () {
  buehne.render(tl.time());
});
buehne.render(0);
