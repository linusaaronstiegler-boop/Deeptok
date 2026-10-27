// ---- Drehbuch der Atlas-Bühne (Beats 1-8) ----
// Erwartet im selben Gültigkeitsbereich: tl (GSAP-Zeitachse), ZEIT, DATEN (von build/bauen.mjs).
//
// Das ist die ÜBERSETZUNGSSCHICHT zwischen Drehbuch und Spuren. drehbuch.md nennt nur
// benannte Einstellungen und Cue-Namen ("totale:europa", "Geld fällt auf Barcelona auf 45").
// Hier wird daraus ein Plan aus Schlüsselbild-Spuren; WIE das gemalt wird, steht in lib/buehne.js.
//
// Richtung: Ein Darsteller fährt in die Richtung dessen, was er bedeutet. Das Geld ist die
// Ablöse: Barcelona zahlt an Bayern, also fliegt es von Barcelona nach München. Der Spieler
// wechselt nach Barcelona, also fliegt er von München nach Barcelona.
const Z = ZEIT;
const K = DATEN.kamera;
const PH = DATEN.physik;
const N = DATEN.waage.neigung;
const kam = (t, e, extra) => Object.assign({ t: t }, e, extra || {});

const plan = {
  // Kamera: Zwischen zwei gleichen Einstellungen steht sie (Lesezeit). "bogen" lässt sie auf
  // dem langen Weg München <-> Barcelona heraus- und wieder hineinfahren (Flug über die Karte).
  kamera: [
    kam(0, K.totale),
    kam(Z.zoomIn, K.totale),
    kam(Z.zoomInEnde, K.muenchen, { ease: "power2.inOut" }), // Zoom-in = Detail: hier wird entschieden
    kam(Z.fahrtBarcelona, K.muenchen),
    kam(Z.fahrtBarcelonaEnde, K.barcelona, { ease: "power2.inOut", bogen: 0.75 }), // zum Angebot
    kam(Z.fahrtMuenchen, K.barcelona),
    kam(Z.fahrtMuenchenEnde, K.muenchen, { ease: "power2.inOut", bogen: 0.75 }), // folgt dem Geld
  ],
  spuren: {
    // Genau eine Region leuchtet: Deutschland (Bayern entscheidet). Nah dran füllt sie mehr
    // als das halbe Bild, darum nur noch 50 % (DESIGN.md §7 Atlas).
    hlDe: [
      { t: 0, v: 1 },
      { t: Z.zoomIn, v: 1 },
      { t: Z.zoomInEnde, v: 0.5, ease: "power2.inOut" },
    ],
    // Weg des Spielers: zeichnet sich auf "verkaufen" von München nach Barcelona.
    routeU: [
      { t: 0, v: 0 },
      { t: Z.verkaufen, v: 0 },
      { t: Z.routeAus, v: 1, ease: "power1.inOut" },
    ],
    // Neigung der Waage in Grad (positiv = rechts unten). Nur drei Lagen: rechts, waagerecht,
    // links. Sie zeigt eine Richtung, nie ein Verhältnis (drehbuch.md "Warum eine Waage").
    neigung: [
      { t: 0, v: 0 },
      { t: Z.neigungRechts, v: 0 },
      { t: Z.neigungRechts + 0.8, v: N, ease: "back.out(1.6)" }, // "Dafür schießt er Tore"
      { t: Z.landung, v: N },
      { t: Z.landung + 0.9, v: 0, ease: "back.out(2.2)" }, // Geld landet: waagerecht, federt aus
      { t: Z.neigungLinks, v: 0 },
      { t: Z.neigungLinks + 0.8, v: -N, ease: "back.out(1.6)" }, // "Im Juli nimmt Bayern das Geld"
    ],
  },
  // Darsteller als Abschnitte: ab..bis bewegt er sich auf "nach" (fall, schritt, flug).
  akteure: {
    spieler: [
      { ab: Z.spielerFall, bis: Z.spielerFall + PH.fallzeit, nach: "ort:muenchen", art: "fall" },
      { ab: Z.spielerHopp, bis: Z.spielerHopp + PH.schrittzeit, nach: "schale:rechts:0", art: "schritt", hoehe: 140 },
      // Abflug auf "Opportunitätskosten": Er verlässt die Schale, die Landung in Barcelona
      // liegt außerhalb des Bildes (REVIEW.md, Abweichung 3).
      { ab: Z.abflugSpieler, bis: Z.landungSpieler, nach: "ort:barcelona", art: "flug", bogen: -0.08 },
    ],
    beleg: [{ ab: Z.belegFall, bis: Z.belegFall + PH.fallzeit, nach: "schale:links:70", art: "fall" }],
    geld: [
      // Der Stapel steht 50 px rechts vom Punkt: links davon steht der Name "Barcelona".
      { ab: Z.geldFall, bis: Z.geldFall + PH.fallzeit, nach: "ort:barcelona:50:0", art: "fall" },
      { ab: Z.abflugGeld, bis: Z.landung, nach: "schale:links:-100", art: "flug", bogen: 0.1 },
    ],
  },
};

// Teilstück der Route bis zum Anteil u (Weltkoordinaten; die Kamera-Gruppe skaliert sie).
const routeEl = document.getElementById("w-route");
function routeBis(u) {
  const pts = DATEN.route;
  if (u <= 0.001) return "";
  const n = pts.length - 1;
  const bis = u * n;
  const i = Math.floor(bis);
  let d = "M" + pts[0][0] + " " + pts[0][1];
  for (let k = 1; k <= i; k++) d += " L" + pts[k][0] + " " + pts[k][1];
  if (i < n) {
    const f = bis - i;
    const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f;
    const y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f;
    d += " L" + x.toFixed(1) + " " + y.toFixed(1);
  }
  return d;
}

const buehne = window.DeepTokBuehne.erstelle({
  wurzel: document.getElementById("w-buehne").parentElement,
  daten: DATEN,
  plan: plan,
  praefix: "w",
  vorRender: function (e) {
    routeEl.setAttribute("d", routeBis(e.spuren.routeU));
  },
});
window.__deeptokAtlas = buehne; // für Tests: berechne(t) ist das Orakel

// ---------------------------------------------------------------------------
// Kinder der Hüllen: Punkte, Namen, Schilder, Etiketten, Stauchen. Nur fromTo (seek-sicher).
// Ab dem zweiten Tween auf dieselbe Eigenschaft: immediateRender: false.
// ---------------------------------------------------------------------------
const rein = (sel, t, extra) =>
  tl.fromTo(sel, { opacity: 0, filter: "blur(8px)" }, Object.assign({ opacity: 1, filter: "blur(0px)", duration: 0.2, ease: "power2.out" }, extra || {}), t);
const raus = (sel, t, extra) =>
  tl.fromTo(sel, { opacity: 1, filter: "blur(0px)" },
    Object.assign({ opacity: 0, filter: "blur(8px)", duration: 0.18, ease: "power2.in", immediateRender: false }, extra || {}), t);
// Morph (DESIGN.md §5): dasselbe verwandelt. Alt wächst und verschwimmt, neu kommt aus der Unschärfe.
function morph(alt, neu, t) {
  tl.fromTo(alt, { opacity: 1, filter: "blur(0px)", scale: 1 },
    { opacity: 0, filter: "blur(10px)", scale: 1.3, duration: 0.18, ease: "power2.in", immediateRender: false, transformOrigin: "0% 50%" }, t);
  tl.fromTo(neu, { opacity: 0, filter: "blur(10px)", scale: 0.72, transformOrigin: "0% 50%" },
    { opacity: 1, filter: "blur(0px)", scale: 1, duration: 0.32, ease: "expo.out" }, t + 0.06);
}
// Aufprall: Stauchen am Boden (Ursprung unten), dann zurückfedern.
function aufprall(sel, t, staerke, erst) {
  tl.fromTo(sel, { scaleY: 1, transformOrigin: "50% 100%" }, { scaleY: staerke, duration: 0.07, ease: "power1.out", immediateRender: erst }, t);
  tl.fromTo(sel, { scaleY: staerke }, { scaleY: 1, duration: 0.3, ease: "back.out(3)", immediateRender: false }, t + 0.07);
}

// Ort setzen (Atlas): Punkt rastet ein, Name kommt 0,12 s später aus der Unschärfe.
tl.fromTo("#w-punkt-barcelona", { scale: 0 }, { scale: 1, duration: 0.35, ease: "back.out(2.2)" }, Z.bcn);
rein("#w-name-barcelona", Z.bcn + 0.12);

// Beat 1: Spieler fällt auf München, Name, Kreis, Preisschilder
aufprall("#a-spieler-bild", Z.spielerFall + PH.fallzeit, 0.86, true);
rein("#a-spieler-name", Z.nameSpieler);
const M = window.DeepTokMarker;
// "verkaufen oder behalten": Auf "behalten" tritt der Weg nach Barcelona zurück (Abdunkeln,
// DESIGN.md §6), die Figur bleibt hell. Höchstens 1 Kreis je Video: Der steht beim Begriff.
tl.fromTo("#w-route", { opacity: 1 }, { opacity: 0.35, duration: 0.3, ease: "power2.inOut" }, Z.behalten);
tl.fromTo("#w-route", { opacity: 0.35 }, { opacity: 1, duration: 0.3, ease: "power2.inOut", immediateRender: false }, Z.hookAus);
// Preisschilder hängen sich nacheinander ein: Faden erscheint, Schild pendelt um sein Loch aus.
[1, 2, 3].forEach(function (i) {
  const t = Z.optionen + (i - 1) * 0.16;
  tl.fromTo("#a-faden-" + i, { opacity: 0 }, { opacity: 1, duration: 0.12, ease: "none" }, t);
  tl.fromTo("#a-schild-" + i, { opacity: 0 }, { opacity: 1, duration: 0.1, ease: "none" }, t);
  tl.fromTo("#a-schild-" + i, { rotation: 16 }, { rotation: 0, duration: 0.7, ease: "back.out(2.6)" }, t);
});
// Beat 3: Schilder, Name treten ab (vor dem Zoom), Waage richtet sich auf, Spieler hüpft auf die Schale
raus(["#a-schild-1", "#a-schild-2", "#a-schild-3", "#a-faden-1", "#a-faden-2", "#a-faden-3", "#a-spieler-name"], Z.hookAus, { stagger: 0.03 });
tl.fromTo("#w-saeule-auf", { scaleY: 0, transformOrigin: "50% 100%" }, { scaleY: 1, duration: 0.35, ease: "expo.out" }, Z.waageAuf);
tl.fromTo("#w-oben", { opacity: 0, scale: 0.86, transformOrigin: "50% 0%" },
  { opacity: 1, scale: 1, duration: 0.35, ease: "expo.out" }, Z.waageAuf + 0.12);
tl.fromTo("#w-waage", { opacity: 0 }, { opacity: 1, duration: 0.05, ease: "none" }, Z.waageAuf);
aufprall("#a-spieler-bild", Z.spielerHopp + PH.schrittzeit, 0.9, false);
// Beleg fällt in die Kosten-Schale; Stempel "bezahlt" auf "bezahlt"
aufprall("#a-beleg-papier", Z.belegFall + PH.fallzeit, 0.9, true);
tl.fromTo("#a-beleg-stempel", { opacity: 0 }, { opacity: 1, duration: 0.06, ease: "none" }, Z.stempel);
tl.fromTo("#a-beleg-stempel", { scale: 1.6, rotation: -14 }, { scale: 1, rotation: -8, duration: 0.28, ease: "back.out(2.2)" }, Z.stempel);
// "Tore" an der Figur; tritt ab, wenn der Vertrag kommt
rein("#w-tore", Z.toreText);
raus("#w-tore", Z.vertragAus);

// Beat 5: Geld fällt auf Barcelona (auf "45"), staucht beim Aufprall
aufprall("#a-geld-bild", Z.geldLandetBcn, 0.84, true);
aufprall("#a-geld-bild", Z.landung, 0.9, false);
// Beat 6a/6b/7: Etikett unter dem Stapel verwandelt sich mit dem Gesagten
rein("#w-reihe-zahl", Z.geldEtikett);
morph("#w-reihe-zahl", "#w-reihe-entgangen", Z.etikettEntgangen);
morph("#w-reihe-entgangen", "#w-reihe-aufgegeben", Z.etikettAufgegeben);
// Kreis Gold um den Stapel, wenn der Begriff fällt (Gold = gesuchte Größe)
const kreisGeld = M.marker(tl, document.getElementById("m-anker-geld"), "kreis",
  { cx: 0, cy: -6, rx: 100, ry: 160 },
  { farbe: "#C9A84C", breite: 10, seed: 7, beginn: Z.begriff, dauer: DATEN.marker.kreis, id: "m-kreis-geld" });
// Abdunkeln (DESIGN.md §6): Solange der Begriff am Stapel steht, treten Beleg und Figur auf 35 %
// zurück. So ist der Gold-Kreis im Umfeld das einzige helle Zeichen.
tl.fromTo(["#a-beleg-papier", "#a-spieler-bild"], { opacity: 1 }, { opacity: 0.35, duration: 0.3, ease: "power2.inOut" }, Z.begriff);
tl.fromTo(["#a-beleg-papier", "#a-spieler-bild"], { opacity: 0.35 }, { opacity: 1, duration: 0.3, ease: "power2.inOut", immediateRender: false }, Z.neigungLinks);
// Beat 8: Bayern nimmt das Geld. Danach ist es Einnahme, nicht mehr "aufgegeben".
raus(["#w-reihe-aufgegeben", kreisGeld], Z.neigungLinks, { stagger: 0.05 });
// "Auch Verkaufen hat Opportunitätskosten": Etikett an der leeren Nutzen-Schale, dann "1 Saison"
tl.fromTo("#w-ok", { opacity: 0, filter: "blur(8px)", scale: 0.9, transformOrigin: "50% 100%" },
  { opacity: 1, filter: "blur(0px)", scale: 1, duration: 0.35, ease: "expo.out" }, Z.okEtikett);
rein("#w-saison", Z.saisonText);

// Die Uhr: Die Zeitachse ruft bei jedem Bild render(t) auf. Der leere Tween gibt ihr die volle Länge.
tl.to({}, { duration: BUEHNEN.atlas.ende - BUEHNEN.atlas.beginn }, 0);
tl.eventCallback("onUpdate", function () {
  buehne.render(tl.time());
});
buehne.render(0);
