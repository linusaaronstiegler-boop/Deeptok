// ---- Drehbuch der Welt (gemeinsam für Variante A und B) ----
// Erwartet im selben Gültigkeitsbereich: tl (GSAP-Zeitachse), ZEIT, DATEN.
//
// Das ist die ÜBERSETZUNGSSCHICHT zwischen Spec und Spuren. Eine Spec (§5)
// nennt nur benannte Einstellungen und Cue-Namen, nie Pixel oder Sekunden:
//   camera.path = ["totale:europa", "nah:barcelona", "schnitt:flug", "nah:muenchen"]
//   moves       = geld: ort:barcelona @zahlt -> ort:muenchen @muenchen -> hud:zahl @zahl
// Hier wird daraus ein Plan aus Schlüsselbild-Spuren: die Einstellungen kommen
// aus DATEN.kamera (bauen.mjs, einstellung()), die Zeiten aus ZEIT (Wort-Cues
// plus abgeleitete Zeiten), die Physik des Darstellers aus DATEN.geld.
// WIE das gemalt wird, steht in lib/buehne.js.
//
// Richtung: Ein Darsteller fährt in die Richtung dessen, was er bedeutet.
// Das Geld ist die Ablöse: Barcelona zahlt an Bayern, also fliegt es von
// Barcelona nach München (nicht umgekehrt, wie der Satz "Bayern verkauft
// nach Barcelona" zuerst nahelegt).
const Z = ZEIT;
const K = DATEN.kamera;

// Physik des Darstellers (Fallhöhe, Flughöhe, Steig- und Sinkzeit) steht in
// bauen.mjs (DARSTELLER), damit der Bau die Haltezeiten vorab prüfen kann.
const GELD = DATEN.geld;

const plan = {
  // Kamera: Liste von Einstellungen. Zwischen zwei Einstellungen fährt sie mit
  // der Ease der späteren; "schnitt: true" springt hart. Wo zwei gleiche
  // Einstellungen aufeinander folgen, steht die Kamera (Lesefenster).
  kamera: [
    Object.assign({ t: 0 }, K.europa),
    Object.assign({ t: Z.fahrt }, K.europa), // steht, solange die Schlagzeile gelesen wird
    Object.assign({ t: Z.barcelona, ease: "power2.inOut" }, K.barcelona), // steht, wenn das Wort fällt
    Object.assign({ t: Z.schnitt, schnitt: true }, K.flug), // harter Schnitt (Testschnitt, siehe REVIEW.md)
    Object.assign({ t: Z.kameraSteht, ease: "power2.inOut" }, K.muenchen), // folgt dem Geld
  ],
  // Darsteller: Anteil der Route (0 = Barcelona, 1 = München)
  u: [
    { t: Z.abflug, v: 0 },
    { t: Z.landung, v: 1, ease: "power1.inOut" },
  ],
  // Flughöhe in Bildpixeln: fällt auf Barcelona, hebt ab, landet in München
  hoehe: [
    { t: Z.geld, v: GELD.fallhoehe },
    { t: Z.geld + GELD.fallzeit, v: 0, ease: "power2.in" },
    { t: Z.abflug, v: 0 }, // ruht >= 1,2 s (bauen.mjs prüft das)
    { t: Z.abflug + GELD.steigzeit, v: GELD.flughoehe, ease: "power2.out" },
    { t: Z.landung - GELD.sinkzeit, v: GELD.flughoehe },
    { t: Z.landung, v: 0, ease: "power2.in" },
  ],
  sicht: [
    { t: Z.geld, v: 0 },
    { t: Z.geld + 0.08, v: 1, ease: "none" },
  ],
  // Andocken: vom Kartenpunkt München zum festen Platz der Zahl
  dock: [
    { t: Z.andocken, v: 0 }, // ruht davor >= 1,2 s in München
    { t: Z.andocken + GELD.dockzeit, v: 1, ease: "power3.inOut" },
  ],
  // Spur des Geldes: verblasst, sobald die Zahl steht (sonst kreuzt sie den Text)
  spurSicht: [
    { t: Z.andocken, v: 1 },
    { t: Z.andocken + 0.5, v: 0, ease: "power1.inOut" },
  ],
  // Hervorgehobene Region: Es leuchtet immer nur eine. Erst Deutschland
  // (Verkäufer), dann Spanien (Käufer), am Ende wieder Deutschland (Empfänger).
  hlDe: [
    { t: 0, v: 0.55 }, // ab Bild 0 sichtbar: das Vorschaubild zeigt schon die Region
    { t: Z.bayern, v: 0.55 },
    { t: Z.bayern + 0.6, v: 1, ease: "power2.out" },
    { t: Z.fahrt, v: 1 },
    { t: Z.barcelona, v: 0, ease: "power2.inOut" },
    { t: Z.landung - 0.6, v: 0 },
    { t: Z.landung + 0.4, v: 0.5, ease: "power2.out" }, // nah: nur angedeutet, die Fläche füllt sonst das halbe Bild
  ],
  hlEs: [
    { t: Z.fahrt, v: 0 },
    { t: Z.barcelona, v: 1, ease: "power2.out" },
    { t: Z.abflug, v: 1 },
    { t: Z.landung - 0.6, v: 0, ease: "power1.inOut" },
  ],
};
// Die Wurzel ist das Element, das Welt und Marker-Anker enthält.
const buehne = window.DeepTokBuehne.erstelle({
  wurzel: document.getElementById("w-buehne").parentElement,
  daten: DATEN,
  plan: plan,
  flughoehe: GELD.flughoehe,
});
// Für den Seek-Test: Er vergleicht das DOM mit buehne.berechne(zeit()).
buehne.zeit = function () {
  return tl.time();
};
window.__deeptokBuehne = buehne;

// Kinder der Hüllen: Punkte, Namen, Münzen, Zahl. Nur fromTo (seek-sicher).
function punktUndName(ort, t) {
  tl.fromTo("#w-punkt-" + ort, { scale: 0 }, { scale: 1, duration: 0.35, ease: "back.out(2.2)" }, t);
  tl.fromTo(
    "#w-name-" + ort,
    { opacity: 0, filter: "blur(8px)" },
    { opacity: 1, filter: "blur(0px)", duration: 0.2, ease: "power2.out" },
    t + 0.12,
  );
}
punktUndName("muenchen", Z.muenchenPunkt);
punktUndName("barcelona", Z.barcelona);

// Aufprall: der Stapel staucht sich kurz (Ursprung unten), dann federt er zurück.
// Mehrere Tweens auf scaleY: ab dem zweiten immediateRender: false.
function aufprall(t, staerke, erst) {
  tl.fromTo("#d-muenzen", { scaleY: 1, transformOrigin: "50% 87%" },
    { scaleY: staerke, duration: 0.07, ease: "power1.out", immediateRender: erst }, t);
  tl.fromTo("#d-muenzen", { scaleY: staerke }, { scaleY: 1, duration: 0.3, ease: "back.out(3)", immediateRender: false }, t + 0.07);
}
aufprall(Z.geld + GELD.fallzeit, 0.84, true);
aufprall(Z.landung, 0.9, false);

// Verwandlung (Morph = dasselbe verwandelt): derselbe Darsteller wechselt die
// Form (Münzen -> Zahl), mitten im Andocken. Er bedeutet dasselbe: die Ablöse.
tl.fromTo(
  "#d-muenzen",
  { opacity: 1, filter: "blur(0px)", scale: 1 },
  { opacity: 0, filter: "blur(10px)", scale: 1.3, duration: 0.18, ease: "power2.in", immediateRender: false },
  Z.zahl,
);
tl.fromTo(
  "#d-zahl",
  { opacity: 0, filter: "blur(10px)", scale: 0.72, transformOrigin: "0% 50%" },
  { opacity: 1, filter: "blur(0px)", scale: 1, duration: 0.32, ease: "expo.out" },
  Z.zahl + 0.06,
);

// Die Uhr: Die Zeitachse ruft bei jedem Bild render(t) auf.
// Der leere Tween gibt der Zeitachse ihre volle Länge.
tl.to({}, { duration: Z.ende }, 0);
tl.eventCallback("onUpdate", function () {
  buehne.render(tl.time());
});
buehne.render(0);
