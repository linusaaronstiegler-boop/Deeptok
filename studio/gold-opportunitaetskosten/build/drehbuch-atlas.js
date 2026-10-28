// ---- Drehbuch der Atlas-Bühne (Beats 1-8) ----
// Erwartet im selben Gültigkeitsbereich: tl (GSAP-Zeitachse), ZEIT, DATEN (von build/bauen.mjs).
//
// Das ist die ÜBERSETZUNGSSCHICHT zwischen Drehbuch und Spuren. drehbuch.md nennt nur
// benannte Einstellungen und Cue-Namen ("totale:europa", "Geld fällt auf Barcelona auf 45").
// Hier wird daraus ein Plan aus Schlüsselbild-Spuren; WIE das gemalt wird, steht in lib/buehne.js.
//
// Richtung: Ein Darsteller fährt in die Richtung dessen, was er bedeutet. Das Geld ist die
// Ablöse: Barcelona zahlt an Bayern, also fliegt es von Barcelona nach München. Der Spieler
// wechselt nach Barcelona, also fliegt er nach Westen aus dem Bild.
//
// Runde 1 (Kritik), die drei wichtigsten Änderungen:
//   1. Nach München fliegt nur ein GEIST des Geldes (gestrichelter Umriss): Solange Bayern
//      behält, ist das Geld nur eine Möglichkeit. "Behalten keinen Cent" widerspricht dem Bild
//      nicht mehr. Erst auf "Bayern nimmt das Geld" wird es echt.
//   2. Auf "Verkaufen" dreht sich die Waage um (Schild "Behalten" -> "Verkaufen"). Danach liegt
//      das Geld auf "Nutzen" und der Spieler auf "Kosten"; er fliegt ab, sein Umriss bleibt.
//      Opportunitätskosten liegen damit in JEDEM Bild links auf "Kosten".
//   3. Eine Nachfahrt auf den Geist beim Begriff und zurück vor dem Schnitt: Die Kamera steht
//      nicht mehr 20 s auf demselben Ausschnitt.
//
// Runde 2 (Kritik), die wichtigsten Änderungen:
//   1. Die Waage neigt sich nur, wenn etwas aufsetzt: Beleg -> links, Spieler (erst auf
//      "schießt") -> rechts, Geist bekommt Gewicht -> waagerecht, Bayern entscheidet -> links.
//   2. Beat 4: Die Waage tritt zurück (35 %), Held ist das Vertragsblatt; auf "Danach" fährt die
//      Welt näher an das Blatt, mit der Fahrt nach Barcelona wieder zurück.
//   3. Beat 8: Rückfahrt schon in der Atempause nach der Definition; "nimmt" in der Totale; die
//      Drehung in der Atempause nach "Geld", das Schild kippt auf "Verkaufen"; der Geist wird erst
//      auf der Nutzen-Seite echt. Der Spieler fliegt nach Südwesten (Richtung Barcelona) hinaus.
//
// Fassung v2.1 (Kritik 28.10.), die wichtigsten Änderungen:
//   1. Foto-Moment: Der Hook öffnet auf der echten Spielszene (Abzug in Farbe). Auf "Bayern" wird
//      sie zum Darsteller ("Foto wird Darsteller"): Grund aus, Figur nach München, Farbe weg.
//   2. Zurücktreten des Fotos über eine dunkle, DECKENDE Fassung statt 35 % Deckkraft.
//   3. Abgang: Unschärfe-Austritt statt Laufen aus dem Bild; der Umriss kommt erst danach.
//   4. Der Beleg "Gehalt" bleibt (abgedunkelt) auf "Kosten", bis die Waage sich auf "Verkaufen" dreht:
//      Erst dann hat er eine sichtbare Ursache zu gehen (wer verkauft, zahlt kein Gehalt mehr).
//   5. Camp Nou ist entfernt.
const Z = ZEIT;
const K = DATEN.kamera;
const PH = DATEN.physik;
const N = DATEN.waage.neigung;
const NV = DATEN.nah.vertrag;
const NB = DATEN.nah.begriff;
const kam = (t, e, extra) => Object.assign({ t: t }, e, extra || {});
// Schlüsselbild der Nachfahrt: Einstellung e (Brennpunkt), Faktor r
const nah = (t, e, r, ease) => Object.assign({}, e, { t: t, r: r }, ease ? { ease: ease } : {});

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
    kam(Z.fahrtMuenchenEnde, K.muenchen, { ease: "power2.inOut", bogen: 0.75 }), // folgt dem Geist
  ],
  // Nachfahrten (Detail): 1. auf das Vertragsblatt ab "Danach", zurück mit der Fahrt nach
  // Barcelona (eine Bewegung: heraus und hinüber). 2. leicht auf Geist und Kreis beim Begriff,
  // zurück in der Atempause nach der Definition. Bei r = 1 ist der Brennpunkt egal: Dort wird er
  // vom Vertrag auf den Begriff umgestellt.
  nah: [
    nah(0, NV, 1),
    nah(Z.nahVertrag, NV, 1),
    nah(Z.nahVertragEnde, NV, NV.r, "power2.inOut"),
    nah(Z.fahrtBarcelona, NV, NV.r),
    nah(Z.fahrtBarcelonaEnde, NV, 1, "power2.inOut"),
    nah(Z.nahRein, NB, 1),
    nah(Z.nahReinEnde, NB, NB.r, "power2.inOut"),
    nah(Z.nahRaus, NB, NB.r),
    nah(Z.nahRausEnde, NB, 1, "power2.inOut"),
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
    // Neigung der Waage in Grad (positiv = rechts unten). Nur drei Lagen: links, waagerecht,
    // rechts. Sie zeigt eine Richtung, nie ein Verhältnis (drehbuch.md "Warum eine Waage").
    // Runde 2: Jede Neigung hat eine Ursache, die man sieht (Prüfung 2: "Neigung = Gewicht").
    neigung: [
      { t: 0, v: 0 },
      { t: Z.neigungKosten, v: 0 },
      { t: Z.neigungKosten + 0.8, v: -N, ease: "back.out(1.6)" }, // Beleg landet auf "Kosten"
      { t: Z.neigungRechts, v: -N },
      { t: Z.neigungRechts + 0.8, v: N, ease: "back.out(1.6)" }, // Spieler landet: "Dafür schießt er Tore"
      { t: Z.waagerecht, v: N },
      { t: Z.waagerecht + 0.9, v: 0, ease: "back.out(2.2)" }, // "fehlt GENAUSO": der Geist wiegt
      { t: Z.neigungLinks, v: 0 },
      // "Im Juli NIMMT Bayern das Geld": Behalten kostet mehr, als es bringt. Nach der Drehung
      // hängt dieselbe Schale rechts: Beim Verkaufen wiegt der Nutzen mehr.
      { t: Z.neigungLinks + 0.8, v: -N, ease: "back.out(1.6)" },
    ],
    // Drehung um die Säule: 0 = Seite "Behalten", 1 = Seite "Verkaufen" (lib/buehne.js).
    // Mitte der Drehung (Schild steht auf der Kante und wechselt) = Wort "Verkaufen".
    dreh: [
      { t: 0, v: 0 },
      { t: Z.drehStart, v: 0 },
      { t: Z.drehEnde, v: 1, ease: "power2.inOut" },
    ],
  },
  // Darsteller als Abschnitte: ab..bis bewegt er sich auf "nach" (fall, schritt, flug, abflug).
  // "schale:links/rechts" = physische Schale (fährt bei der Drehung mit).
  akteure: {
    spieler: [
      // Steht schon in Bild 0 auf München: Das Vorschaubild hat einen Helden (Prüfung 3).
      { ab: -1, bis: -1, nach: "ort:muenchen", art: "sofort" },
      // Steigt erst auf "schießt" auf die Nutzen-Schale (vorher stand er am Fuß der Waage).
      { ab: Z.spielerHopp, bis: Z.spielerHopp + PH.schrittzeit, nach: "schale:rechts:0", art: "schritt", hoehe: 140 },
      // Abgang: Fassung v2.1 kein Weg mehr aus dem Bild (unten: Unschärfe-Austritt am Ort). Ein
      // starres Foto, das hinausrutscht, wirkte wie ein Pappaufsteller (Kritik 28.10.).
    ],
    // Der Beleg steht rechts auf der Kosten-Schale, der Geist links daneben (ohne Überlappung).
    // Fallhöhe 420: So kreuzt er die Behauptung oben links nicht (Prüfung 3).
    beleg: [{ ab: Z.belegFall, bis: Z.belegFall + PH.fallzeit, nach: "schale:links:104", art: "fall", hoehe: 420 }],
    // Der Vertrag: ein großes Blatt über der Waage (feste Bildstelle; die Kamera steht in Beat 4).
    vertrag: [{ ab: Z.vertragFall, bis: Z.vertragFall + PH.fallzeit, nach: "bild:540:575", art: "fall", hoehe: 420 }],
    // Das echte Geld bleibt in Barcelona. Der Stapel steht 50 px rechts vom Punkt (Name links).
    geld: [{ ab: Z.geldFall, bis: Z.geldFall + PH.fallzeit, nach: "ort:barcelona:50:0", art: "fall" }],
    // Der Geist löst sich vom echten Stapel und fliegt auf die Kosten-Schale (links vom Beleg).
    geist: [
      { ab: Z.abflugGeist, bis: Z.abflugGeist, nach: "ort:barcelona:50:0", art: "sofort" },
      { ab: Z.abflugGeist, bis: Z.landung, nach: "schale:links:-74", art: "flug", bogen: 0.1 },
    ],
    // Umriss des Spielers: entsteht dort, wo er stand (physische Schale B, nach der Drehung links).
    umriss: [{ ab: Z.umriss, bis: Z.umriss, nach: "schale:rechts:0", art: "sofort" }],
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
// Stempel: fällt groß und schräg auf das Papier und federt in seine Lage.
function stempel(sel, t, winkel) {
  tl.fromTo(sel, { opacity: 0 }, { opacity: 1, duration: 0.06, ease: "none" }, t);
  tl.fromTo(sel, { scale: 1.6, rotation: winkel - 6 }, { scale: 1, rotation: winkel, duration: 0.28, ease: "back.out(2.2)" }, t);
}

// Ort setzen (Atlas): Punkt rastet ein, Name kommt 0,12 s später aus der Unschärfe.
tl.fromTo("#w-punkt-barcelona", { scale: 0 }, { scale: 1, duration: 0.35, ease: "back.out(2.2)" }, Z.bcn);
rein("#w-name-barcelona", Z.bcn + 0.12);
// Abdunkeln (DESIGN.md §6): Liste von Elementen von a auf b, ab dem zweiten Mal ohne immediateRender.
const dunkel = (sel, t, von, nach, erst) =>
  tl.fromTo(sel, { opacity: von }, { opacity: nach, duration: 0.3, ease: "power2.inOut", immediateRender: !!erst }, t);

// Beat 1 (Fassung v2.1): Bild 0 zeigt die echte Spielszene als Abzug. Auf "Lewandowski" kommt sein
// Name neben den Abzug. Auf "Bayern" wird das Foto zum Darsteller ("Foto wird Darsteller"):
//   1. Der Rahmen (Creme-Rand, Rasen, Publikum) blendet aus, die freigestellte Figur in Farbe bleibt.
//   2. Die Figur fährt mit dem Abzug nach München, dreht sich gerade und schrumpft auf Darsteller-
//      größe (Ursprung der Bewegung ist ihr Fuß; er landet genau auf dem Fuß des Darstellers).
//   3. Am Ziel liegt der Duoton-Darsteller schon deckend darunter; die Farbe blendet darüber aus.
// Der Darsteller (#a-spieler-bild) steht in der Welt seit Bild 0 auf München, aber unsichtbar.
const AB = DATEN.abzug;
const zielX = AB.ziel[0] - (AB.x + AB.fuss[0]);
const zielY = AB.ziel[1] - (AB.y + AB.fuss[1]);
tl.fromTo("#fh-abzug", { x: 0, y: 0, rotation: AB.rot, scale: 1, transformOrigin: AB.fuss[0] + "px " + AB.fuss[1] + "px" },
  { x: zielX, y: zielY, rotation: 0, scale: AB.k, duration: Z.morphEnde - Z.morph, ease: "power2.inOut" }, Z.morph);
tl.fromTo("#fh-rahmen", { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "power2.in" }, Z.morph);
rein("#fh-name", Z.nameSpieler);
raus("#fh-name", Z.morph);
// Erster Tween auf #a-spieler-bild: setzt ab Bild 0 auch Unschärfe und Versatz auf ihre Ruhewerte.
// Der Austritt (unten) beginnt bei denselben Werten; so ist der Zustand nach jedem Sprung derselbe
// (seek-test.mjs vergleicht auch die Inline-Stile).
tl.fromTo("#a-spieler-bild", { opacity: 0, filter: "blur(0px)", x: 0, y: 0 },
  { opacity: 1, filter: "blur(0px)", x: 0, y: 0, duration: 0.06, ease: "none" }, Z.entfaerben);
tl.fromTo("#fh-figur", { opacity: 1 }, { opacity: 0, duration: Z.entfaerbtEnde - Z.entfaerben, ease: "power1.inOut" }, Z.entfaerben + 0.03);
// Der Name wandert mit: am Abzug aus, am Darsteller ein (DESIGN.md §5 Morph: dasselbe Etikett).
rein("#a-spieler-name", Z.nameAtlas);
// "München" liegt unter dem Abzug und kommt, wenn der Abzug geht (sonst lugte das "M" am Rand vor).
tl.fromTo("#w-name-muenchen", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" }, Z.morph + 0.15);
const M = window.DeepTokMarker;
// "verkaufen oder BEHALTEN": Route und Barcelona treten zurück. So liest man in der Denkpause
// "Barcelona" nicht als Teil des untersten Schilds (Runde 2, Prüfung 1). Die Route bleibt
// zurückgenommen, bis die Kamera nach Barcelona fährt (sonst sticht sie durch die Credits).
// Runde 2b: Wenn die Waage in München steht, hat die Route keine Aufgabe. Abgedunkelt (35 %) stach
// sie trotzdem durch die Credit-Zeilen ("Vertrag: …", "Ablöse: …", "Wechsel: …"; Prüfung 1). Darum
// geht sie mit dem Zoom ganz weg, kommt nur für die Fahrt nach Barcelona und den Flug des Geistes
// zurück und geht nach der Landung wieder.
dunkel("#w-route", Z.dimBcn, 1, 0.35, true);
dunkel("#w-route", Z.zoomIn, 0.35, 0);
dunkel("#w-route", Z.routeHell, 0, 1);
dunkel("#w-route", Z.routeDunkel, 1, 0);
// Den Punkt "München" gibt es seit v2.1 nicht mehr: Auf München steht immer jemand (lib/atlas.html).
dunkel(["#w-name-barcelona", "#w-punkt-barcelona"], Z.dimBcn, 1, 0.35);
dunkel(["#w-name-barcelona", "#w-punkt-barcelona"], Z.hookAus, 0.35, 1);
// Preisschilder hängen sich auf "kostet" nacheinander ein: Schnur erscheint, Schild pendelt
// kurz um sein Loch und steht (0,35 s; was gelesen wird, steht still).
[1, 2, 3].forEach(function (i) {
  const t = Z.schilder + (i - 1) * 0.12;
  tl.fromTo("#a-faden-" + i, { opacity: 0 }, { opacity: 1, duration: 0.12, ease: "none" }, t);
  tl.fromTo("#a-schild-" + i, { opacity: 0 }, { opacity: 1, duration: 0.1, ease: "none" }, t);
  tl.fromTo("#a-schild-" + i, { rotation: 10 }, { rotation: 0, duration: 0.35, ease: "back.out(1.4)" }, t);
});
// Beat 3: Schilder, Name treten ab (vor dem Zoom), die Waage richtet sich am Fuß der Figur auf.
raus(["#a-schild-1", "#a-schild-2", "#a-schild-3", "#a-faden-1", "#a-faden-2", "#a-faden-3", "#a-spieler-name"], Z.hookAus, { stagger: 0.03 });
tl.fromTo("#w-saeule-auf", { scaleY: 0, transformOrigin: "50% 100%" }, { scaleY: 1, duration: 0.35, ease: "expo.out" }, Z.waageAuf);
tl.fromTo("#w-oben", { opacity: 0, scale: 0.86, transformOrigin: "50% 0%" },
  { opacity: 1, scale: 1, duration: 0.35, ease: "expo.out" }, Z.waageAuf + 0.12);
tl.fromTo("#w-waage", { opacity: 0 }, { opacity: 1, duration: 0.05, ease: "none" }, Z.waageAuf);
// Beleg fällt in die Kosten-Schale (die Waage kippt links); Stempel "bezahlt" auf "bezahlt"
aufprall("#a-beleg-papier", Z.belegFall + PH.fallzeit, 0.9, true);
stempel("#a-beleg-stempel", Z.stempel, -8);
// Der Spieler landet auf der Nutzen-Schale (die Waage kippt rechts), "Tore" an der Figur
aufprall("#a-spieler-bild", Z.neigungRechts, 0.9, true);
rein("#w-tore", Z.toreText);
// Fassung v2: "Tore" tritt auf "Vertrag" mit der Waage zurück und geht erst mit der Naht (Fahrt
// nach Barcelona), statt mitten in der Einstellung zu verschwinden (DESIGN.md §5 Standdauer).
dunkel("#w-tore", Z.dimWaage, 1, 0.35);
tl.fromTo("#w-tore", { opacity: 0.35, filter: "blur(0px)" },
  { opacity: 0, filter: "blur(8px)", duration: 0.18, ease: "power2.in", immediateRender: false }, Z.toreAus);

// Beat 4: Die Waage tritt zurück (Held ist das Blatt). Vertrag fällt; die gedruckte Zeitleiste
// läuft auf "Saison"; die Verlängerung erscheint auf "Verlängern" und tritt auf "nicht" zurück
// (35 %, sie bleibt lesbar als verworfene Möglichkeit); Stempel "ablösefrei" und "0 €".
// v2.1: Das Foto tritt über seine dunkle, deckende Fassung zurück ("hell" blendet aus), nicht über
// Deckkraft: Mit 35 % liefen Grenzlinie und Waagenkette durch Gesicht und Brust (Kritik 28.10.).
const WAAGE_TEILE = ["#w-waage-svg", "#a-beleg-papier"];
dunkel(WAAGE_TEILE, Z.dimWaage, 1, 0.35, true);
dunkel("#a-spieler-hell", Z.dimWaage, 1, 0, true);
aufprall("#a-vertrag-papier", Z.vertragFall + PH.fallzeit, 0.92, true);
tl.fromTo("#zl-start", { opacity: 0, scaleY: 0 }, { opacity: 1, scaleY: 1, duration: 0.25, ease: "back.out(2.2)" }, Z.band);
// Das Band läuft gleichmäßig (linear: konstantes Tempo IST hier die Aussage) und steht dann.
tl.fromTo("#zl-band", { scaleX: 0 }, { scaleX: 1, duration: Z.bandEnde - Z.band, ease: "none" }, Z.band);
rein("#zl-saison", Z.band);
tl.fromTo("#zl-ende", { opacity: 0, scaleY: 0 }, { opacity: 1, scaleY: 1, duration: 0.25, ease: "back.out(2.2)" }, Z.bandEnde);
tl.fromTo(["#zl-verl", "#zl-verl-text"], { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" }, Z.verlaengern_an);
dunkel(["#zl-verl", "#zl-verl-text"], Z.verlaengern, 1, 0.35);
stempel("#a-vertrag-stempel", Z.frei, -7);
stempel("#a-vertrag-null", Z.nullEuro, 4);
raus("#a-vertrag-papier", Z.vertragAus);
// Die Kamera ist in Barcelona, die Waage außer Sicht: wieder volle Deckkraft.
dunkel(WAAGE_TEILE, Z.hellWaage, 0.35, 1);
dunkel("#a-spieler-hell", Z.hellWaage, 0, 1);

// Geld fällt auf Barcelona (auf "45"), staucht beim Aufprall
aufprall("#a-geld-bild", Z.geldLandetBcn, 0.84, true);
// Beat 6a: Der Geist löst sich vom Stapel (Umriss erscheint), fliegt, landet auf der Kosten-Schale.
tl.fromTo("#a-geist-umriss", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, Z.abflugGeist);
tl.fromTo("#a-geist-echt", { opacity: 0 }, { opacity: 0, duration: 0.01, ease: "none" }, 0);
aufprall("#a-geist-umriss", Z.landung, 0.92, true);
// "45 Mio. €" unter der Kosten-Schale im Geist-Stil (Zahl 60 %, gestrichelte Unterkante): eine
// Möglichkeit. "Behalten keinen CENT": Stempel "0 €" am Schild. Damit steht der Vergleich als
// Bildpaar da: Geist mit 45 Mio. € gegen Behalten 0 € (Prüfung 2).
rein("#w-reihe-zahl", Z.geldEtikett);
tl.fromTo("#w-null-behalten", { opacity: 0 }, { opacity: 1, duration: 0.06, ease: "none" }, Z.nullBehalten);
tl.fromTo("#w-null-behalten", { scale: 1.6, rotation: -12, svgOrigin: "0 0" }, { scale: 1, rotation: -6, duration: 0.28, ease: "back.out(2.2)" }, Z.nullBehalten);
// Beat 6b: "Entgangenes": Zeile 2 sagt, was der Geist ist.
rein("#w-reihe-entgangen", Z.etikettEntgangen);
// "fehlt GENAUSO wie bezahltes": Der Geist drückt die Schale (er hat Gewicht), die Waage schwingt,
// und die Zahl wird fest (volle Deckkraft, ohne Strichelung).
aufprall("#a-geist-umriss", Z.waagerecht, 0.9, false);
tl.fromTo("#w-zahl-text", { opacity: 0.6 }, { opacity: 1, duration: 0.3, ease: "power2.out" }, Z.waagerecht);
tl.fromTo("#w-zahl-strich", { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "power2.in" }, Z.waagerecht);
// Beat 7: Kreis Gold um den Geist, wenn der Begriff fällt (Gold = gesuchte Größe)
const kreisGeld = M.marker(tl, document.getElementById("m-anker-geld"), "kreis",
  { cx: 0, cy: -6, rx: 80, ry: 160 },
  { farbe: "#C9A84C", breite: 10, seed: 7, beginn: Z.begriff, dauer: DATEN.marker.kreis, id: "m-kreis-geld" });
// Abdunkeln: Solange der Begriff steht, treten Beleg und Figur auf 35 % zurück, der Stempel
// "0 €" geht. So ist der Gold-Kreis im Umfeld das einzige helle Zeichen.
dunkel("#a-beleg-papier", Z.begriff, 1, 0.35);
dunkel("#a-spieler-hell", Z.begriff, 1, 0);
tl.fromTo("#w-null-behalten", { opacity: 1 }, { opacity: 0, duration: 0.2, ease: "power2.in", immediateRender: false }, Z.nullBehaltenAus);
// "Wert der besten ALTERNATIVE": Zeile 2 verwandelt sich (Morph), das Etikett hängt am Geist.
morph("#w-reihe-entgangen", "#w-reihe-alternative", Z.etikettAlternative);
// Atempause nach der Definition: Begriff, Kreis und Etiketten treten ab, die Figur kommt zurück.
// v2.1 (Kritik 28.10.): Der Beleg BLEIBT abgedunkelt auf "Kosten". Gerade war gelehrt worden:
// Kosten = Gehalt + Barças Geld; auf "nimmt" wiegt die Waage beides gegen den Spieler.
raus(["#w-reihe-zahl", "#w-reihe-alternative", kreisGeld], Z.julAus, { stagger: 0.05 });
dunkel("#a-spieler-hell", Z.julAus, 0, 1);
// Beat 8: "nimmt" -> Neigung (Spur). Fassung v2 (Abnahme): Die Atempause nach "Geld." ist Luft, das
// Bild steht. Die Drehung beginnt an ihrem Ende; ihre Mitte (Schild auf der Kante) liegt auf
// "Verkaufen" (Vorrang: das Schild ist Text). Ab der Mitte liegt der Geist auf der Nutzen-Seite und
// wird echt (Morph, 0,38 s); das Etikett "Opportunitätskosten" folgt erst auf seinem Wort.
tl.fromTo("#a-geist-umriss", { opacity: 1, scale: 1, transformOrigin: "50% 100%" },
  { opacity: 0, scale: 1.06, duration: 0.2, ease: "power2.in", immediateRender: false }, Z.massiv);
// Der Beleg geht MIT der Drehung (erste Hälfte, bevor das Geld echt wird): In der Sicht "Verkaufen"
// zahlt Bayern kein Gehalt mehr. Die Drehung ist die sichtbare Ursache (DESIGN.md §5).
tl.fromTo("#a-beleg-papier", { opacity: 0.35, filter: "blur(0px)" },
  { opacity: 0, filter: "blur(8px)", duration: Z.massiv - Z.drehStart, ease: "power2.in", immediateRender: false }, Z.drehStart);
tl.fromTo("#a-geist-echt", { opacity: 0, scale: 0.9, transformOrigin: "50% 100%" },
  { opacity: 1, scale: 1, duration: 0.32, ease: "expo.out", immediateRender: false }, Z.massiv + 0.06);
// "Auch Verkaufen hat OPPORTUNITÄTSKOSTEN": Etikett unter der Kosten-Schale (jetzt mit dem Spieler).
// Das Geld tritt zurück (35 %): Gold heißt "gesucht", und gesucht ist jetzt die eine Saison.
rein("#w-ok", Z.okEtikett, { duration: 0.25 });
dunkel("#a-geist-echt", Z.geldDunkel, 1, 0.35);
// "eine Saison": Der Spieler geht (v2.1: Unschärfe-Austritt am Ort, leicht nach Südwesten, also
// Richtung Barcelona; DESIGN.md §5). Sein Umriss kommt, wenn das Foto fast weg ist, dann "1 Saison".
tl.fromTo("#a-spieler-bild", { opacity: 1, filter: "blur(0px)", x: 0, y: 0 },
  { opacity: 0, filter: "blur(10px)", x: -40, y: 20, duration: Z.spielerWeg - Z.abflugSpieler, ease: "power2.in", immediateRender: false }, Z.abflugSpieler);
tl.fromTo("#a-umriss-bild", { opacity: 0, filter: "blur(8px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.35, ease: "power2.out" }, Z.umriss);
rein("#w-saison", Z.saisonText);

// Die Uhr: Die Zeitachse ruft bei jedem Bild render(t) auf. Der leere Tween gibt ihr die volle Länge.
tl.to({}, { duration: BUEHNEN.atlas.ende - BUEHNEN.atlas.beginn }, 0);
tl.eventCallback("onUpdate", function () {
  buehne.render(tl.time());
});
buehne.render(0);
