/*
 * DeepTok Bühne (Spike-Version): Welt + Kamera + Darsteller
 *
 * Idee: Alles, was sich in der Welt bewegt, ist ein Zahlen-ZUSTAND (z). Der
 * Zustand kommt aus einem PLAN: pro Größe eine Liste von Schlüsselbildern
 * ("bei Sekunde 3,9 steht die Kamera auf Barcelona, Zoom 3,2"). Daraus folgt
 * jedes Bild in zwei Schritten:
 *   berechne(t): Zeit t -> Zustand -> fertige Werte (Strings). Rein: liest
 *                kein DOM, schreibt kein DOM. Darum kann ein Test sie aufrufen
 *                und mit dem vergleichen, was im DOM steht (build/seek-test.mjs).
 *   render(t):   schreibt diese Werte ins DOM.
 * GSAP liefert nur die Uhr (onUpdate) und die Kurven (Eases).
 *
 * Warum so und nicht "GSAP bewegt die Elemente direkt"?
 *   - Die Kamera skaliert die Welt. Der Darsteller und die Beschriftungen sollen
 *     aber auf dem Bildschirm gleich groß bleiben und trotzdem an ihrem Weltort
 *     kleben. Das geht nur, wenn eine Stelle Kamera UND Weltort kennt: render().
 *   - render(t) hängt nur von t ab. Springt der Player auf Sekunde 9, rechnet
 *     render(9) genau dieses Bild aus, egal was vorher lief (seek-sicher).
 *   - Ob GSAP-Tweens auf ein Zustandsobjekt dasselbe leisten, steht in REVIEW.md
 *     (Gegenprobe). Die Spuren hier sind eine Entwurfsentscheidung.
 *
 * Arbeitsteilung, damit sich nichts in die Quere kommt:
 *   render() besitzt die Hüllen (Kamera-Gruppe, Anker, .w-rand, Darsteller-Hülle,
 *   Schatten, Hervorhebungen). GSAP besitzt nur deren Kinder (Deckkraft,
 *   Unschärfe, Maßstab) und die HUD-Texte.
 *
 * Wird beim Bauen (build/bauen.mjs) zwischen @buehne:anfang/@buehne:ende eingesetzt.
 */
(function () {
  "use strict";
  if (window.DeepTokBuehne) return;

  // Quadratische Bézier-Kurve: Punkt bei Parameter s (0..1)
  function bezier(r, s) {
    var a = (1 - s) * (1 - s);
    var b = 2 * (1 - s) * s;
    var c = s * s;
    return [a * r.p0[0] + b * r.c[0] + c * r.p2[0], a * r.p0[1] + b * r.c[1] + c * r.p2[1]];
  }

  /*
   * Längen-Tabelle der Route: Damit u = 0,5 wirklich "halbe Strecke" heißt
   * (und nicht halber Kurvenparameter), wird die Kurve einmal abgetastet.
   */
  function routenTabelle(r, n) {
    var pts = [];
    var laengen = [0];
    for (var i = 0; i <= n; i++) pts.push(bezier(r, i / n));
    for (var j = 1; j <= n; j++) {
      laengen.push(laengen[j - 1] + Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]));
    }
    return { pts: pts, laengen: laengen, gesamt: laengen[n] };
  }

  function routenPunkt(tab, u) {
    u = Math.max(0, Math.min(1, u));
    var ziel = u * tab.gesamt;
    var lo = 0;
    var hi = tab.laengen.length - 1;
    while (hi - lo > 1) {
      var mid = (lo + hi) >> 1;
      if (tab.laengen[mid] <= ziel) lo = mid;
      else hi = mid;
    }
    var span = tab.laengen[hi] - tab.laengen[lo] || 1e-9;
    var f = (ziel - tab.laengen[lo]) / span;
    var a = tab.pts[lo];
    var b = tab.pts[hi];
    return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, index: lo, f: f };
  }

  /*
   * pruefeSpur(name, spur, felder): bricht mit klarer Meldung ab, wenn eine
   * Spur leer ist, ein Feld keine Zahl ist oder die Zeiten rückwärts laufen.
   * Ohne diese Prüfung ergäbe eine unsortierte Spur still eine falsche
   * Bewegung (z. B. wenn Cues aus Wortzeiten kommen und sich überholen).
   * Gleiche Zeiten sind erlaubt: Das ist ein Sprung genau an dieser Stelle.
   */
  function pruefeSpur(name, spur, felder) {
    if (!Array.isArray(spur) || spur.length === 0) throw new Error("Bühne: Spur '" + name + "' ist leer");
    for (var i = 0; i < spur.length; i++) {
      var k = spur[i];
      if (typeof k.t !== "number" || !isFinite(k.t)) throw new Error("Bühne: Spur '" + name + "', Schlüsselbild " + i + ": t fehlt");
      for (var j = 0; j < felder.length; j++) {
        if (typeof k[felder[j]] !== "number" || !isFinite(k[felder[j]])) {
          throw new Error("Bühne: Spur '" + name + "' bei t=" + k.t + ": '" + felder[j] + "' ist keine Zahl");
        }
      }
      if (i > 0 && k.t < spur[i - 1].t) {
        throw new Error("Bühne: Spur '" + name + "' läuft rückwärts: t=" + k.t + " nach t=" + spur[i - 1].t);
      }
    }
  }

  /*
   * wert(spur, t): Wert einer Schlüsselbild-Liste zur Zeit t.
   * Eine Spur ist eine Liste [{t, v, ease}, ...] (bei der Kamera {t, kx, ky, zoom}).
   *   - vor dem ersten Schlüsselbild gilt das erste,
   *   - zwischen zwei Schlüsselbildern wird mit der Ease des späteren übergeblendet,
   *   - hat das spätere "schnitt: true", springt der Wert genau dort (harter Schnitt),
   *   - nach dem letzten gilt das letzte.
   */
  var easeCache = {};
  function easeFn(name) {
    name = name || "power2.inOut";
    if (!easeCache[name]) easeCache[name] = gsap.parseEase(name);
    return easeCache[name];
  }
  function abschnitt(spur, t) {
    if (t <= spur[0].t) return { a: spur[0], b: spur[0], f: 0 };
    for (var i = 1; i < spur.length; i++) {
      var b = spur[i];
      if (t < b.t) {
        var a = spur[i - 1];
        if (b.schnitt) return { a: a, b: a, f: 0 };
        var f = (t - a.t) / (b.t - a.t || 1e-9);
        return { a: a, b: b, f: easeFn(b.ease)(f) };
      }
    }
    var l = spur[spur.length - 1];
    return { a: l, b: l, f: 0 };
  }
  function wert(spur, t) {
    var s = abschnitt(spur, t);
    return s.a.v + (s.b.v - s.a.v) * s.f;
  }
  // Kamera: Mittelpunkt linear, Zoom logarithmisch (gleichmäßig wirkendes Heranfahren)
  function kameraBei(spur, t) {
    var s = abschnitt(spur, t);
    var lz = Math.log(s.a.zoom) + (Math.log(s.b.zoom) - Math.log(s.a.zoom)) * s.f;
    return { kx: s.a.kx + (s.b.kx - s.a.kx) * s.f, ky: s.a.ky + (s.b.ky - s.a.ky) * s.f, zoom: Math.exp(lz) };
  }

  var klemme = function (v) {
    return Math.max(0, Math.min(1, v));
  };

  /*
   * erstelle({ wurzel, daten, plan, breite, hoehe, flughoehe })
   *   wurzel : das Element, das die Welt (#w-buehne) und alle Anker-Gruppen
   *            ([data-anker], auch die der Marker-Ebene) enthält. Nur darin wird
   *            gesucht. Die IDs (#w-kamera, #d-huelle, ...) müssen trotzdem im
   *            ganzen Dokument eindeutig sein, weil HyperFrames alle
   *            Kompositionen in ein Dokument setzt.
   *   daten  : von build/bauen.mjs berechnet: Orte, Route, Kamera-Einstellungen
   *   plan   : Schlüsselbild-Spuren {kamera, u, hoehe, dock, hlDe, hlEs, sicht, spurSicht}
   * Gibt { z, plan, berechne, render, welt2bild, routenPunkt } zurück.
   */
  var SPUREN = ["u", "hoehe", "dock", "hlDe", "hlEs", "sicht", "spurSicht"];
  function erstelle(opts) {
    var w = opts.wurzel;
    if (!w || typeof w.querySelector !== "function") throw new Error("Bühne: 'wurzel' ist kein Element");
    var D = opts.daten;
    var plan = opts.plan;
    var B = opts.breite || 1080;
    var H = opts.hoehe || 1920;
    var FLUGHOEHE = opts.flughoehe || 90; // nur für die Neigung im Flug
    var q = function (sel) {
      var el = w.querySelector(sel);
      if (!el) throw new Error("Bühne: " + sel + " fehlt in der Wurzel");
      return el;
    };

    // Plan prüfen, bevor irgendetwas gemalt wird.
    pruefeSpur("kamera", plan.kamera, ["kx", "ky", "zoom"]);
    SPUREN.forEach(function (name) {
      if (plan[name] !== undefined) pruefeSpur(name, plan[name], ["v"]);
    });

    // ---- Zustand: nur Zahlen, in jedem Bild neu aus dem Plan berechnet ----
    var z = {
      kx: 0, // Weltpunkt in der Bildmitte (x)
      ky: 0, // Weltpunkt in der Bildmitte (y)
      zoom: 1, // 1 = Europa-Totale, 3 = nah
      hlDe: 0, // Hervorhebung Deutschland 0..1
      hlEs: 0, // Hervorhebung Spanien 0..1
      u: 0, // Darsteller: Anteil der Route (0 = Start, 1 = Ziel)
      hoehe: 0, // Darsteller: Flughöhe über der Karte in Bildpixeln
      dock: 0, // 0 = steht auf der Karte, 1 = an den Platz der Zahl angedockt
      sicht: 1, // Darsteller sichtbar (0..1)
      spurSicht: 1, // gestrichelte Spur sichtbar (0..1)
    };

    var tab = routenTabelle(D.route, 120);

    var kamera = q("#w-kamera");
    var land = q("#w-land");
    var grenzen = q("#w-grenzen");
    var netz = w.querySelector("#w-netz");
    var hl = [
      { el: q("#w-hl-de"), name: "hlDe" },
      { el: q("#w-hl-es"), name: "hlEs" },
    ];
    hl.forEach(function (h) {
      h.rand = h.el.querySelector(".w-hl-rand");
      h.schein = h.el.querySelector(".w-hl-schein");
    });
    var spur = q("#w-spur");
    var huelle = q("#d-huelle");
    var figur = q("#d-figur");
    var schatten = q("#d-schatten");
    var anker = Array.prototype.slice.call(w.querySelectorAll("[data-anker]")).map(function (el) {
      var ort = D.orte[el.getAttribute("data-anker")];
      if (!ort) throw new Error("Bühne: unbekannter Ort '" + el.getAttribute("data-anker") + "'");
      var rand = el.querySelector(".w-rand");
      var name = rand ? rand.firstElementChild : null;
      return {
        el: el,
        ort: ort,
        rand: rand,
        // Box des Namens relativ zum Anker, EINMAL gemessen (nicht in jedem Bild:
        // Messen im onUpdate kann bei einem kalten Render andere Werte liefern).
        // Darum ruft das Drehbuch erstelle() erst auf, wenn die Schriften geladen sind.
        // offsetLeft/offsetWidth hängen nicht von Transforms ab, also nicht von t.
        box: name ? { l: name.offsetLeft, b: name.offsetWidth, o: name.offsetTop, h: name.offsetHeight } : null,
        bisZoom: rand && rand.hasAttribute("data-bis-zoom") ? Number(rand.getAttribute("data-bis-zoom")) : 0,
      };
    });

    // Welt -> Bild: Weltpunkt (x, y) auf Bildschirm-Pixel bei Kamera k.
    function welt2bild(x, y, k) {
      k = k || z;
      return { x: (x - k.kx) * k.zoom + B / 2, y: (y - k.ky) * k.zoom + H / 2 };
    }

    var GRUNDWERT = { sicht: 1, spurSicht: 1 };
    function zustandBei(t) {
      var k = kameraBei(plan.kamera, t);
      z.kx = k.kx;
      z.ky = k.ky;
      z.zoom = k.zoom;
      // Fehlt eine Spur im Plan, gilt ihr Grundwert (sicht: 1 = sichtbar, sonst 0).
      SPUREN.forEach(function (name) {
        z[name] = plan[name] ? wert(plan[name], t) : GRUNDWERT[name] || 0;
      });
      return z;
    }

    /*
     * berechne(t): alle Werte eines Bildes als fertige Strings, ohne DOM.
     * Auf zwei Stellen gerundet, damit Player und Render dieselben Strings bauen.
     */
    function berechne(t) {
      zustandBei(t || 0);
      var s = z.zoom;
      var e = {};

      // 1) Kamera: eine SVG-Transformation auf der Welt-Gruppe. SVG statt
      //    CSS-transform, damit Chrome die Vektoren bei jedem Zoom scharf neu zeichnet.
      e.kamera = "translate(" + (B / 2 - z.kx * s).toFixed(2) + " " + (H / 2 - z.ky * s).toFixed(2) + ") scale(" + s.toFixed(4) + ")";

      // 2) Gestrichelte Spur des Geldes: Teilstück der Route bis zum Darsteller.
      var bis = routenPunkt(tab, z.u);
      var d = "";
      if (z.u > 0.001) {
        d = "M" + tab.pts[0][0].toFixed(1) + " " + tab.pts[0][1].toFixed(1);
        for (var i = 1; i <= bis.index; i++) d += " L" + tab.pts[i][0].toFixed(1) + " " + tab.pts[i][1].toFixed(1);
        d += " L" + bis.x.toFixed(1) + " " + bis.y.toFixed(1);
      }
      e.spur = d;

      // 3) Anker: Bildschirmposition jedes Weltorts.
      e.anker = anker.map(function (a) {
        var p = welt2bild(a.ort[0], a.ort[1]);
        return { x: p.x, y: p.y, transform: "translate(" + p.x.toFixed(1) + "px, " + p.y.toFixed(1) + "px)" };
      });

      // 4) Darsteller: Bodenpunkt auf der Route, darüber in "hoehe" schwebend,
      //    beim Andocken auf dem Weg zum festen Platz der Zahl (HUD).
      var boden = welt2bild(bis.x, bis.y);
      var slot = D.slot;
      var dx = boden.x + (slot[0] - boden.x) * z.dock;
      var dy = boden.y - z.hoehe + (slot[1] - (boden.y - z.hoehe)) * z.dock;
      e.darsteller = "translate(" + dx.toFixed(1) + "px, " + dy.toFixed(1) + "px)";
      // Neigung im Flug: in Flugrichtung gelehnt, am stärksten in der Mitte der Strecke
      var flug = Math.min(1, z.hoehe / FLUGHOEHE);
      var richtung = D.route.p2[0] > D.route.p0[0] ? 1 : -1; // fliegt nach rechts: im Uhrzeigersinn neigen
      e.figur = "rotate(" + (richtung * 9 * flug * Math.sin(Math.PI * z.u)).toFixed(2) + "deg)";
      // Schatten bleibt am Boden; je höher, desto kleiner und blasser.
      var hs = Math.max(0, 1 - z.hoehe / 260);
      e.schatten = "translate(" + boden.x.toFixed(1) + "px, " + boden.y.toFixed(1) + "px) scale(" + (0.55 + 0.45 * hs).toFixed(3) + ")";
      e.schattenDeck = (0.75 * (0.35 + 0.65 * hs) * (1 - z.dock) * z.sicht).toFixed(3);
      return e;
    }

    // Aktionsrand: 5 % je Seite (90-%-Box). Namen verblassen auf den letzten
    // 70 px davor, statt halb abgeschnitten im Bild zu stehen.
    var RAND_X = B * 0.05;
    var RAND_Y = H * 0.05;
    var RAMPE = 70;

    function render(t) {
      var e = berechne(t);
      var s = z.zoom;

      kamera.setAttribute("transform", e.kamera);
      // Linien sollen auf dem Bildschirm gleich dick bleiben: Breite / Zoom.
      land.setAttribute("stroke-width", (1.5 / s).toFixed(3));
      grenzen.setAttribute("stroke-width", (1.1 / s).toFixed(3));
      if (netz) netz.setAttribute("stroke-width", (1 / s).toFixed(3));
      // Hervorgehobene Region: leiser Rand (2 px) plus weicher Schein (14 px)
      hl.forEach(function (h) {
        var v = z[h.name];
        h.el.style.opacity = v.toFixed(3);
        h.el.style.display = v > 0.001 ? "" : "none"; // unsichtbar = gar nicht malen (spart Renderzeit)
        h.rand.setAttribute("stroke-width", (2 / s).toFixed(3));
        h.schein.setAttribute("stroke-width", (14 / s).toFixed(3));
      });

      spur.setAttribute("d", e.spur);
      spur.style.opacity = (0.9 * z.spurSicht).toFixed(3);
      spur.setAttribute("stroke-width", (5 / s).toFixed(3));
      spur.setAttribute("stroke-dasharray", (2 / s).toFixed(2) + " " + (16 / s).toFixed(2));

      // Anker: Punkte und Beschriftungen kleben an ihrem Weltort, bleiben aber
      // bildschirmgroß. Namen verblassen vor dem Aktionsrand und, wenn sie
      // data-bis-zoom tragen (Ländernamen), beim Heranfahren.
      for (var k = 0; k < anker.length; k++) {
        var a = anker[k];
        var p = e.anker[k];
        a.el.style.transform = p.transform;
        if (!a.rand || !a.box) continue;
        var bx = a.box;
        var abstand = Math.min(
          p.x + bx.l - RAND_X,
          B - RAND_X - (p.x + bx.l + bx.b),
          p.y + bx.o - RAND_Y,
          H - RAND_Y - (p.y + bx.o + bx.h),
        );
        var sicht = klemme(abstand / RAMPE);
        if (a.bisZoom) sicht *= klemme((a.bisZoom - s) / 0.6);
        a.rand.style.opacity = sicht.toFixed(3);
      }

      huelle.style.transform = e.darsteller;
      huelle.style.opacity = z.sicht.toFixed(3);
      figur.style.transform = e.figur;
      schatten.style.transform = e.schatten;
      schatten.style.opacity = e.schattenDeck;
    }

    return {
      z: z,
      plan: plan,
      berechne: berechne,
      render: render,
      zustandBei: zustandBei,
      welt2bild: welt2bild,
      routenPunkt: function (u) {
        return routenPunkt(tab, u);
      },
    };
  }

  /*
   * nachSchriften(liste, baue): ruft baue() auf, sobald die Schriften geladen
   * sind (z. B. '600 48px "DT Inter"'). Erst dann stimmen gemessene Breiten.
   * Wer so baut, registriert seine Zeitachse am ENDE von baue(), nicht vorher.
   * Scheitert das Laden, wird trotzdem gebaut (mit Ersatzschrift-Breiten).
   */
  function nachSchriften(liste, baue) {
    var laden = Promise.all(
      liste.map(function (f) {
        return document.fonts.load(f);
      }),
    );
    return laden.catch(function () {}).then(function () {
      baue();
    });
  }

  window.DeepTokBuehne = { erstelle: erstelle, wert: wert, kameraBei: kameraBei, pruefeSpur: pruefeSpur, nachSchriften: nachSchriften };
})();
