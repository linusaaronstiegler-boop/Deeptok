/*
 * DeepTok Marker-Ebene (Goldstandard; aus studio/spike-buehne/lib/marker.js kopiert und erweitert)
 *
 * Handgezeichnete Markierungen, die sich genau auf ein Wort zeichnen:
 * Kreis (um einen Ort oder eine Zahl), Unterstreichung (unter einer Zahl),
 * Durchstrich (über dem Irrtum, nur Rot) und Klammer (fasst einen Teil zusammen).
 * Maße und Farben: studio/DESIGN.md §6.
 * Vorbild: Simplicissimus (rote Kreise auf Karten) und Veritasium
 * (Unterstreichung unter der Schlagzeile). Angelehnt an die Registry-Bausteine
 * `marker-highlight` und `hw-boil`, aber ohne Laufzeit-Variablen, damit das
 * Stück beim Bauen in jede Szene kopiert werden kann (siehe docs/VIDEO-PIPELINE.md §5).
 *
 * Drei Regeln machen das Modul "seek-sicher", also richtig an jedem Zeitpunkt,
 * auch wenn der Player rückwärts oder mitten hinein springt:
 *   1. Kein Math.random(): Das "Zittern" der Hand kommt aus einer festen
 *      Hash-Funktion mit Startwert (seed). Gleicher seed = gleiche Linie.
 *   2. Nur fromTo-Tweens mit beiden Endpunkten. Ein `from` liest seinen
 *      ENDwert beim Erstellen aus dem DOM. Allein ist das harmlos. Bewegen aber
 *      mehrere Tweens dieselbe Eigenschaft, liest der zweite den Startwert des
 *      ersten als "Endwert" und steht nach einem Sprung falsch. fromTo legt
 *      beide Endpunkte fest; ab dem zweiten Tween auf derselben Eigenschaft
 *      kommt immediateRender: false dazu.
 *   3. Bis zum Cue ist der Strich unsichtbar (opacity 0). Sonst malt die runde
 *      Linienkappe schon vorher einen Punkt an den Anfang.
 *
 * Wird beim Bauen (build/bauen.mjs) zwischen die Marken @marker:anfang/@marker:ende
 * eingesetzt. Doppelt eingesetzt ist harmlos: der Wächter unten bricht ab.
 */
(function () {
  "use strict";
  if (window.DeepTokMarker) return;

  // Fester Pseudo-Zufall: gleiche Eingabe -> gleiche Zahl zwischen -1 und 1.
  function hash(n, seed) {
    var x = Math.sin(n * 127.1 + (seed || 1) * 311.7) * 43758.5453;
    return (x - Math.floor(x)) * 2 - 1;
  }

  // Punkte -> glatter Pfad (quadratische Kurven durch die Mittelpunkte).
  // So entstehen weiche Bögen statt Ecken, wie bei einem Filzstift.
  function glatt(punkte) {
    var d = "M" + punkte[0][0].toFixed(1) + " " + punkte[0][1].toFixed(1);
    for (var i = 1; i < punkte.length - 1; i++) {
      var p = punkte[i];
      var q = punkte[i + 1];
      var mx = (p[0] + q[0]) / 2;
      var my = (p[1] + q[1]) / 2;
      d += " Q" + p[0].toFixed(1) + " " + p[1].toFixed(1) + " " + mx.toFixed(1) + " " + my.toFixed(1);
    }
    var l = punkte[punkte.length - 1];
    d += " L" + l[0].toFixed(1) + " " + l[1].toFixed(1);
    return d;
  }

  function polylinienLaenge(punkte) {
    var s = 0;
    for (var i = 1; i < punkte.length; i++) {
      s += Math.hypot(punkte[i][0] - punkte[i - 1][0], punkte[i][1] - punkte[i - 1][1]);
    }
    return s;
  }

  /*
   * Handgezeichneter Kreis um (cx, cy).
   * Eine Hand schließt einen Kreis nie genau: Der Strich läuft etwa 1,15-mal
   * herum, der Radius wächst dabei leicht (Spirale), und die Ellipse ist ein
   * wenig gekippt. Ergebnis: Anfang und Ende überlappen versetzt.
   */
  function kreisPunkte(cx, cy, rx, ry, seed, opts) {
    opts = opts || {};
    var umlauf = opts.umlauf || 1.15; // wie oft der Stift herumfährt
    var start = opts.startWinkel !== undefined ? opts.startWinkel : -2.2; // oben links beginnen
    var kipp = (opts.kippen !== undefined ? opts.kippen : -0.12) + hash(3, seed) * 0.05;
    var n = 26;
    var pts = [];
    for (var i = 0; i <= n; i++) {
      var f = i / n;
      var a = start + f * umlauf * Math.PI * 2;
      // Radius: leichtes Wachsen über den Umlauf + kleines Handzittern
      var wachs = 1 - 0.06 + f * 0.12;
      var zitter = 1 + hash(i * 7 + 11, seed) * 0.025;
      var x = Math.cos(a) * rx * wachs * zitter;
      var y = Math.sin(a) * ry * wachs * zitter;
      // kippen (Drehung um den Mittelpunkt)
      pts.push([cx + x * Math.cos(kipp) - y * Math.sin(kipp), cy + x * Math.sin(kipp) + y * Math.cos(kipp)]);
    }
    return pts;
  }

  /*
   * Rahmen um ein hohes oder breites Ziel (DESIGN.md §6, wie rahmen() in studio/looks/werkzeug/probe_basis.py):
   * Superellipse |x/a|^4 + |y/b|^4 = 1 mit flachen Seiten und runden Ecken. Eine Ellipse hält die Luft an
   * den Ecken des Ziels nicht (Goldstandard, Bild-Kritik: sie lief über die Kante des Geists).
   *   hw, hh : halbe Breite und Höhe des Ziels (mit dessen Strich)
   *   luft   : Abstand vom Ziel bis zum INNEREN Rand des Markerstrichs (Standard 24 px)
   * Die Halbachsen a, b werden so gewählt, dass jeder Punkt der Kurve (minus halbe Strichbreite und
   * minus das Wachsen) mindestens `luft` von der Zielecke entfernt ist; geprüft wird an 400 Punkten.
   * Der Stift fährt 1,1-mal herum, der Rahmen wächst dabei um 6 px (nicht 12 %), leicht gekippt.
   */
  function rahmenPunkte(cx, cy, hw, hh, luft, breite, seed) {
    var n = 4;
    var achsen = rahmenAchsen(hw, hh, luft, breite);
    var a = achsen[0], b = achsen[1];
    var kipp = -0.03 + hash(3, seed) * 0.02;
    var start = -2.2;
    var umlauf = 1.1;
    var k = 34;
    var pts = [];
    for (var j = 0; j <= k; j++) {
      var f = j / k;
      var w = start + f * umlauf * Math.PI * 2;
      var wachs = -3 + f * 6 + hash(j * 7 + 11, seed) * 1.2; // 6 px über den Umlauf, kleines Zittern
      var c = Math.cos(w), s = Math.sin(w);
      var x = (a + wachs) * Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
      var y = (b + wachs) * Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
      pts.push([cx + x * Math.cos(kipp) - y * Math.sin(kipp), cy + x * Math.sin(kipp) + y * Math.cos(kipp)]);
    }
    return pts;
  }

  /*
   * Fassung final, Politur (Abnahme P2: der Gold-Rahmen um den Geist lief durch das Etikett „Kosten“ auf
   * der Schalenfront). Eine GLOCKE ist der Rahmen nur über dem Boden: dieselbe Superellipse mit derselben
   * Luft an Seiten und Oberkante, aber unten offen. Beide Enden stehen auf `boden` (Abstand der
   * Standfläche von der Mitte des Ziels, nach unten positiv), hier dem Rand der Schale. Darunter liegt
   * fremder Text (die Schalenfront), den kein Strich kreuzen darf (DESIGN.md §6 „Ruhe im Umfeld“).
   * Der Stift fährt von rechts unten über die Oberkante nach links unten, ohne Überlappung (die Enden
   * stehen ja auf dem Boden); er wächst dabei um 4 px, leicht gekippt.
   */
  function glockePunkte(cx, cy, hw, hh, luft, breite, boden, seed) {
    var n = 4;
    var achsen = rahmenAchsen(hw, hh, luft, breite);
    var a = achsen[0], b = achsen[1];
    var kipp = -0.02 + hash(3, seed) * 0.015;
    // Winkel, an dem die Kurve die Höhe `boden` erreicht: |sin w|^(2/n) = boden / b
    var w0 = Math.asin(Math.min(1, Math.pow(Math.max(0, boden) / b, n / 2)));
    var k = 30;
    var pts = [];
    for (var j = 0; j <= k; j++) {
      var f = j / k;
      var w = w0 - f * (Math.PI + 2 * w0); // rechts unten -> oben -> links unten
      var wachs = -2 + f * 4 + hash(j * 7 + 11, seed) * 1.0;
      var c = Math.cos(w), s = Math.sin(w);
      var x = (a + wachs) * Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
      var y = (b + wachs) * Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
      // Die Enden stehen genau auf dem Boden (das Wachsen darf sie nicht unter ihn schieben)
      if (y > boden) y = boden;
      pts.push([cx + x * Math.cos(kipp) - y * Math.sin(kipp), cy + x * Math.sin(kipp) + y * Math.cos(kipp)]);
    }
    return pts;
  }

  // Halbachsen der Superellipse, so dass jeder Punkt `luft` (ab Strichrand) vom Zielrechteck hält.
  function rahmenAchsen(hw, hh, luft, breite) {
    var n = 4;
    var halbStrich = (breite || 10) / 2;
    var a = hw + luft + halbStrich;
    var b = hh + luft + halbStrich;
    // Abstand der Ecke (hw, hh) zur Kurve: so lange vergrößern, bis die Luft überall hält
    var abstand = function (a, b) {
      var best = 1e9;
      for (var i = 0; i <= 400; i++) {
        var w = (i / 400) * (Math.PI / 2);
        var x = a * Math.pow(Math.cos(w), 2 / n);
        var y = b * Math.pow(Math.sin(w), 2 / n);
        var dx = Math.max(0, x - hw), dy = Math.max(0, y - hh);
        // Punkte innerhalb des Zielrechtecks gäbe es nicht; außen zählt der Abstand zum Rechteck
        var d = x <= hw ? y - hh : y <= hh ? x - hw : Math.sqrt(dx * dx + dy * dy);
        if (d < best) best = d;
      }
      return best;
    };
    var schritte = 0;
    while (abstand(a - 3, b - 3) - halbStrich < luft && schritte++ < 200) {
      a += 1;
      b += 1;
    }
    return [a, b];
  }

  /*
   * Unterstreichung von x0 bis x1 auf Höhe y.
   * Leicht ansteigend, mit kleinem Bogen und einem Auslauf am Ende,
   * so wie ein schneller Strich mit dem Marker.
   */
  function linienPunkte(x0, y, x1, seed, opts) {
    opts = opts || {};
    var anstieg = opts.anstieg !== undefined ? opts.anstieg : -10; // Ende etwas höher
    var bogen = opts.bogen !== undefined ? opts.bogen : 7;
    var n = 9;
    var pts = [];
    for (var i = 0; i <= n; i++) {
      var f = i / n;
      var x = x0 + (x1 - x0) * f;
      var yy = y + anstieg * f + Math.sin(f * Math.PI) * bogen + hash(i * 5 + 2, seed) * 1.6;
      pts.push([x, yy]);
    }
    return pts;
  }

  /*
   * Durchstrich von x0 bis x1 auf Höhe y (DESIGN.md §6: ein Strich, -4°, 12 px Überstand).
   * Leicht durchgebogen, damit er nicht wie eine CSS-Linie aussieht.
   */
  function strichPunkte(x0, y, x1, seed, rechts) {
    // Fassung final (Bild-Kritik): Rechts höchstens die Hälfte des Wortzwischenraums (rechts), sonst
    // berührte das Strichende das nächste Wort („s“ von „sein“), das richtig bleibt.
    var ueberRechts = rechts === undefined ? 12 : Math.min(12, rechts);
    var n = 7;
    var pts = [];
    var neigung = Math.tan((-4 * Math.PI) / 180);
    for (var i = 0; i <= n; i++) {
      var f = i / n;
      var x = x0 - 12 + (x1 - x0 + 12 + ueberRechts) * f;
      var yy = y + neigung * (x - x0) - Math.sin(f * Math.PI) * 3 + hash(i * 3 + 5, seed) * 1.2;
      pts.push([x, yy]);
    }
    return pts;
  }

  /*
   * Klammer an der linken Seite eines Kastens (oben y0, unten y1, Kante bei x),
   * die unten in einen Bogen zum Etikett ausläuft (bis yEtikett). Wie mit dem Stift:
   * kurzer Haken oben, senkrechter Strich, Bogen unten.
   */
  function klammerPunkte(x, y0, y1, yEtikett, seed) {
    var pts = [[x + 22, y0 + hash(1, seed)], [x + 4, y0 + 4]];
    var n = 8;
    for (var i = 1; i <= n; i++) {
      var f = i / n;
      pts.push([x - 6 + Math.sin(f * Math.PI) * -3 + hash(i + 9, seed) * 1.2, y0 + (yEtikett - y0) * f]);
    }
    pts.push([x + 6, yEtikett + 14]);
    pts.push([x + 26, yEtikett + 18]);
    return pts;
  }

  /*
   * Zeichnet einen Pfad seek-sicher auf die Zeitachse.
   *   pfad   : SVG-<path> mit fertigem d, der schon im DOM hängt. Nur dann
   *            kann getTotalLength() messen; sonst gilt die Ersatzlänge.
   *   beginn : Sekunde auf der Zeitachse (lokal zur Komposition) = Cue-Wort
   *   dauer  : wie lange der Stift braucht (Kreis ca. 0,6 s, Linie ca. 0,35 s)
   *   laenge : Ersatzlänge, falls getTotalLength() noch 0 liefert
   */
  function zeichne(tl, pfad, beginn, dauer, laenge, opts) {
    opts = opts || {};
    var L = 0;
    try {
      L = pfad.getTotalLength();
    } catch (e) {
      L = 0;
    }
    if (!(L > 0)) L = laenge || 1000;
    // Strich-Muster: ein Strich so lang wie der Pfad, danach eine etwas
    // längere Lücke. Bei Offset L+10 sieht man nur Lücke, bei 0 den ganzen Strich.
    pfad.setAttribute("stroke-dasharray", L.toFixed(1) + " " + (L + 20).toFixed(1));
    var ease = opts.ease || "power1.inOut";
    // Unsichtbar bis zum Cue (gegen den Punkt der runden Linienkappe).
    tl.fromTo(pfad, { opacity: 0 }, { opacity: 1, duration: 0.001, ease: "none" }, beginn);
    tl.fromTo(
      pfad,
      { strokeDashoffset: L + 10 },
      { strokeDashoffset: 0, duration: dauer, ease: ease },
      beginn,
    );
    return L;
  }

  /*
   * Bequeme Hülle: legt den Pfad an, setzt d und zeichnet ihn.
   *   svg   : das SVG, in das der Marker kommt (Marker-Ebene)
   *   art   : "kreis" | "linie"
   *   p     : {cx, cy, rx, ry} für Kreis, {x0, x1, y} für Linie
   *   stil  : {farbe, breite, seed, beginn, dauer, id}
   */
  function marker(tl, svg, art, p, stil) {
    var ns = "http://www.w3.org/2000/svg";
    var seed = stil.seed || 1;
    var pts =
      art === "kreis"
        ? kreisPunkte(p.cx, p.cy, p.rx, p.ry, seed, stil)
        : art === "rahmen"
          ? rahmenPunkte(p.cx, p.cy, p.hw, p.hh, p.luft === undefined ? 24 : p.luft, stil.breite, seed)
        : art === "glocke"
          ? glockePunkte(p.cx, p.cy, p.hw, p.hh, p.luft === undefined ? 24 : p.luft, stil.breite, p.boden, seed)
        : art === "strich"
          ? strichPunkte(p.x0, p.y, p.x1, seed, p.rechts)
          : art === "klammer"
            ? klammerPunkte(p.x, p.y0, p.y1, p.yEtikett, seed)
            : linienPunkte(p.x0, p.y, p.x1, seed, stil);
    var g = document.createElementNS(ns, "g");
    if (stil.id) g.setAttribute("id", stil.id);
    // Politur: Jeder Marker sagt, was er ist und was er markieren darf. build/messen-bild.mjs prüft daran,
    // dass kein Strich über FREMDEN Text läuft (data-ziel: ids der Texte, die er markiert; Durchstrich und
    // Unterstreichung liegen absichtlich auf oder an ihrem Wort).
    g.setAttribute("data-marker", art);
    if (stil.ziel) g.setAttribute("data-ziel", stil.ziel);
    // Erst einhängen, dann zeichnen: zeichne() misst die Pfadlänge im DOM.
    svg.appendChild(g);
    // Hauptstrich und eine dünne zweite Spur (trockener Filzstift):
    // beide zeichnen sich gleichzeitig, die Spur ist leicht versetzt.
    var spuren = [
      { dx: 0, dy: 0, breite: stil.breite || 8, deckkraft: 1 },
      { dx: 1.5, dy: -2, breite: (stil.breite || 8) * 0.35, deckkraft: 0.45 },
    ];
    var laenge = polylinienLaenge(pts);
    spuren.forEach(function (s, i) {
      var path = document.createElementNS(ns, "path");
      path.setAttribute("d", glatt(pts));
      path.setAttribute("fill", "none");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      path.setAttribute("stroke-width", String(s.breite));
      path.setAttribute("transform", "translate(" + s.dx + " " + s.dy + ")");
      path.style.stroke = stil.farbe || "#F5F0E8";
      path.style.strokeOpacity = String(s.deckkraft);
      g.appendChild(path);
      var standard = { kreis: 0.5, rahmen: 0.5, glocke: 0.5, strich: 0.3, klammer: 0.5 }[art] || 0.35;
      zeichne(tl, path, stil.beginn, stil.dauer || standard, laenge, stil);
    });
    return g;
  }

  window.DeepTokMarker = {
    hash: hash,
    kreisPunkte: kreisPunkte,
    rahmenPunkte: rahmenPunkte,
    glockePunkte: glockePunkte,
    linienPunkte: linienPunkte,
    strichPunkte: strichPunkte,
    klammerPunkte: klammerPunkte,
    glatt: glatt,
    zeichne: zeichne,
    marker: marker,
  };
})();
