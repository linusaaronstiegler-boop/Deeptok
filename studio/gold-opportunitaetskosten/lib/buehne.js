/*
 * DeepTok Bühne (Goldstandard): Welt + Kamera + Waage + Darsteller
 *
 * Weiterentwicklung von studio/spike-buehne/lib/buehne.js. Neu gegenüber dem Spike:
 *   - mehrere Darsteller (Geld, Spieler, Beleg, Kinokarte ...), jeder mit eigener Spur
 *     aus Abschnitten ("fällt auf Barcelona", "fliegt in die linke Schale" ...),
 *   - eine Balkenwaage, deren Schalen Plätze für Darsteller sind,
 *   - Anker für Orte, Schalen und Darsteller (Marker und Etiketten kleben daran),
 *   - eine Kamerafahrt mit Bogen (beim Weg von München nach Barcelona fährt die Kamera
 *     kurz heraus und wieder hinein, wie ein Flug über die Karte).
 *
 * Grundidee wie im Spike: Alles, was sich in der Welt bewegt, ist ein ZUSTAND aus Zahlen.
 * Der Zustand kommt aus einem PLAN (Schlüsselbild-Spuren). Daraus folgt jedes Bild:
 *   berechne(t): Zeit t -> fertige Werte. Liest und schreibt kein DOM (testbar).
 *   render(t):   schreibt diese Werte ins DOM.
 * GSAP liefert nur die Uhr (onUpdate) und die Kurven (Eases).
 *
 * Wer besitzt was (damit sich nichts in die Quere kommt):
 *   render() besitzt die HÜLLEN: Kamera-Gruppe, Anker ([data-anker]), Darsteller-Hüllen
 *   (#a-<name>), ihre Schatten, die Teile der Waage (Balken, Schalen, Ketten).
 *   GSAP besitzt nur die KINDER darin (Deckkraft, Unschärfe, Stauchen) und den HUD-Text.
 *
 * Wird beim Bauen (build/bauen.mjs) zwischen @buehne:anfang/@buehne:ende eingesetzt.
 */
(function () {
  "use strict";
  if (window.DeepTokBuehne) return;

  var klemme = function (v, a, b) {
    return Math.max(a === undefined ? 0 : a, Math.min(b === undefined ? 1 : b, v));
  };

  // ---------------------------------------------------------------------------
  // Spuren: Listen von Schlüsselbildern [{t, v, ease}] (Kamera: {t, kx, ky, zoom})
  // ---------------------------------------------------------------------------
  var easeCache = {};
  function easeFn(name) {
    name = name || "power2.inOut";
    if (!easeCache[name]) easeCache[name] = gsap.parseEase(name);
    return easeCache[name];
  }

  /*
   * pruefeSpur: bricht mit klarer Meldung ab, wenn eine Spur leer ist, ein Feld keine
   * Zahl ist oder die Zeiten rückwärts laufen. Kommen die Zeiten aus der Stimme, können
   * sich zwei Cues überholen; ohne diese Prüfung gäbe das still eine falsche Bewegung.
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
      if (i > 0 && k.t < spur[i - 1].t - 1e-9) {
        throw new Error("Bühne: Spur '" + name + "' läuft rückwärts: t=" + k.t + " nach t=" + spur[i - 1].t);
      }
    }
  }

  // Abschnitt einer Spur zur Zeit t: zwei Schlüsselbilder und der (geglättete) Anteil f.
  // Hat das spätere Schlüsselbild "schnitt: true", springt der Wert genau dort (harter Schnitt).
  function abschnitt(spur, t) {
    if (t <= spur[0].t) return { a: spur[0], b: spur[0], f: 0, roh: 0 };
    for (var i = 1; i < spur.length; i++) {
      var b = spur[i];
      if (t < b.t) {
        var a = spur[i - 1];
        if (b.schnitt) return { a: a, b: a, f: 0, roh: 0 };
        var roh = (t - a.t) / (b.t - a.t || 1e-9);
        return { a: a, b: b, f: easeFn(b.ease)(roh), roh: roh };
      }
    }
    var l = spur[spur.length - 1];
    return { a: l, b: l, f: 0, roh: 0 };
  }
  function wert(spur, t) {
    var s = abschnitt(spur, t);
    return s.a.v + (s.b.v - s.a.v) * s.f;
  }

  /*
   * Kamera: Mittelpunkt linear, Zoom logarithmisch (wirkt gleichmäßig). "bogen" am
   * Ziel-Schlüsselbild senkt den Zoom in der Mitte der Fahrt (Faktor e^-bogen): Die Kamera
   * fährt heraus, über die Karte und wieder hinein, statt flach über eine nahe Karte zu wischen.
   */
  function kameraBei(spur, t) {
    var s = abschnitt(spur, t);
    var lz = Math.log(s.a.zoom) + (Math.log(s.b.zoom) - Math.log(s.a.zoom)) * s.f;
    if (s.b.bogen) lz -= s.b.bogen * Math.sin(Math.PI * s.f);
    return { kx: s.a.kx + (s.b.kx - s.a.kx) * s.f, ky: s.a.ky + (s.b.ky - s.a.ky) * s.f, zoom: Math.exp(lz) };
  }

  // ---------------------------------------------------------------------------
  // Waage: Geometrie in Bildpixeln, relativ zum Fußpunkt. Gleiche Funktion für die
  // Atlas-Waage (Fläche) und die Diagramm-Waage (Strich), damit der Schnitt passt.
  //   W = {saeule, arm, kette, schale, ...}, theta in Grad (positiv = rechts unten)
  // ---------------------------------------------------------------------------
  function waageGeometrie(W, theta) {
    var r = (theta * Math.PI) / 180;
    var dx = Math.cos(r) * W.arm;
    var dy = Math.sin(r) * W.arm;
    var py = -W.saeule;
    return {
      drehpunkt: { x: 0, y: py },
      hakenL: { x: -dx, y: py - dy },
      hakenR: { x: dx, y: py + dy },
      // Schalen hängen senkrecht unter den Haken (Pendel), egal wie der Balken steht.
      schaleL: { x: -dx, y: py - dy + W.kette },
      schaleR: { x: dx, y: py + dy + W.kette },
    };
  }

  // ---------------------------------------------------------------------------
  // Bühne erstellen
  // ---------------------------------------------------------------------------
  /*
   * erstelle({ wurzel, daten, plan, praefix })
   *   wurzel : Element, das Welt, Waage, Darsteller und alle [data-anker] enthält
   *   daten  : von build/bauen.mjs berechnet (Orte, Kamera, Waage-Maße, Physik)
   *   plan   : { kamera, spuren: {name: [...]}, akteure: {name: [...]} }
   *   praefix: ID-Präfix dieser Bühne (zwei Bühnen liegen im selben Dokument)
   */
  function erstelle(opts) {
    var w = opts.wurzel;
    if (!w || typeof w.querySelector !== "function") throw new Error("Bühne: 'wurzel' ist kein Element");
    var D = opts.daten;
    var plan = opts.plan;
    var P = opts.praefix || "w";
    var B = D.breite || 1080;
    var H = D.hoehe || 1920;
    var q = function (sel, muss) {
      var el = w.querySelector(sel);
      if (!el && muss !== false) throw new Error("Bühne: " + sel + " fehlt in der Wurzel");
      return el;
    };

    // ---- Plan prüfen, bevor irgendetwas gemalt wird ----
    if (plan.kamera) pruefeSpur("kamera", plan.kamera, ["kx", "ky", "zoom"]);
    var spuren = plan.spuren || {};
    Object.keys(spuren).forEach(function (n) {
      pruefeSpur(n, spuren[n], ["v"]);
    });
    var akteure = plan.akteure || {};
    Object.keys(akteure).forEach(function (n) {
      var liste = akteure[n];
      liste.forEach(function (s, i) {
        if (!(s.bis >= s.ab)) throw new Error("Bühne: Darsteller '" + n + "', Abschnitt " + i + ": bis < ab");
        if (i > 0 && s.ab < liste[i - 1].bis - 1e-9) {
          throw new Error("Bühne: Darsteller '" + n + "' beginnt Abschnitt " + i + " (" + s.ab.toFixed(2) + " s), bevor " + (i - 1) + " endet (" + liste[i - 1].bis.toFixed(2) + " s)");
        }
      });
    });

    var KAMERA_FEST = { kx: 0, ky: 0, zoom: 1 };
    var kamera = plan.kamera ? q("#" + P + "-kamera") : null;
    var striche = Array.prototype.slice.call(w.querySelectorAll("[data-strich]")).map(function (el) {
      var muster = el.getAttribute("data-strich-muster");
      return { el: el, breite: Number(el.getAttribute("data-strich")), muster: muster ? muster.split(/\s+/).map(Number) : null };
    });

    // Welt -> Bild bei Kamera k
    function welt2bild(x, y, k) {
      return { x: (x - k.kx) * k.zoom + B / 2, y: (y - k.ky) * k.zoom + H / 2 };
    }

    // ---- Waage ----
    var W = D.waage || null;
    var waage = W
      ? {
          fuss: q("#" + P + "-waage"),
          balken: q("#" + P + "-balken"),
          schaleL: q("#" + P + "-schale-l"),
          schaleR: q("#" + P + "-schale-r"),
          ketteL: q("#" + P + "-kette-l"),
          ketteR: q("#" + P + "-kette-r"),
        }
      : null;

    // Fußpunkt der Waage in Bildpixeln: an einem Weltort (Atlas) oder fest (Diagramm)
    function waageFuss(k) {
      if (!W) return null;
      if (W.ort) {
        var o = D.orte[W.ort];
        return welt2bild(o[0], o[1], k);
      }
      return { x: W.fuss[0], y: W.fuss[1] };
    }

    // ---- Plätze: "ort:barcelona", "schale:links:-90", "bild:540:900" ----
    function platz(name, k, g, fuss) {
      var teile = name.split(":");
      if (teile[0] === "ort") {
        var o = D.orte[teile[1]];
        if (!o) throw new Error("Bühne: unbekannter Ort '" + teile[1] + "'");
        var p = welt2bild(o[0], o[1], k);
        return { x: p.x + Number(teile[2] || 0), y: p.y + Number(teile[3] || 0), schale: false };
      }
      if (teile[0] === "schale") {
        var s = teile[1] === "links" ? g.schaleL : g.schaleR;
        return { x: fuss.x + s.x + Number(teile[2] || 0), y: fuss.y + s.y, schale: true };
      }
      if (teile[0] === "bild") return { x: Number(teile[1]), y: Number(teile[2]), schale: false };
      throw new Error("Bühne: unbekannter Platz '" + name + "'");
    }

    // ---- Darsteller: Hülle, Figur (für Neigung), Schatten ----
    var PHYSIK = D.physik || {};
    var namen = Object.keys(akteure);
    var aEl = {};
    namen.forEach(function (n) {
      aEl[n] = {
        huelle: q("#a-" + n),
        figur: q("#a-" + n + "-figur"),
        schatten: q("#a-" + n + "-schatten", false),
      };
    });

    // Zustand eines Darstellers zur Zeit t (rein rechnerisch)
    function darsteller(n, t, k, g, fuss) {
      var liste = akteure[n];
      if (!liste.length || t < liste[0].ab) return { sicht: 0, x: -999, y: -999, h: 0, gx: -999, gy: -999, neigung: 0, schatten: 0 };
      var i = 0;
      while (i + 1 < liste.length && liste[i + 1].ab <= t) i++;
      var s = liste[i];
      var ziel = platz(s.nach, k, g, fuss);
      var sicht = i === 0 ? klemme((t - s.ab) / 0.08) : 1;
      if (s.sicht !== undefined && t >= s.ab) sicht = s.sicht; // z. B. 0 = verschwindet am Ziel
      if (t >= s.bis || s.art === "sofort") {
        return { sicht: sicht, x: ziel.x, y: ziel.y, h: 0, gx: ziel.x, gy: ziel.y, neigung: 0, schatten: ziel.schale ? 0 : 1 };
      }
      var u = (t - s.ab) / (s.bis - s.ab || 1e-9);
      if (s.art === "fall") {
        var hoehe = (s.hoehe || PHYSIK.fallhoehe || 560) * (1 - easeFn("power2.in")(u));
        return { sicht: sicht, x: ziel.x, y: ziel.y - hoehe, h: hoehe, gx: ziel.x, gy: ziel.y, neigung: 0, schatten: ziel.schale ? 0 : u };
      }
      var von = platz(liste[i - 1] ? liste[i - 1].nach : s.von, k, g, fuss);
      if (s.art === "schritt") {
        var f = easeFn("power2.inOut")(u);
        var hs = (s.hoehe || 90) * Math.sin(Math.PI * u);
        var gx = von.x + (ziel.x - von.x) * f;
        var gy = von.y + (ziel.y - von.y) * f;
        return { sicht: sicht, x: gx, y: gy - hs, h: hs, gx: gx, gy: gy, neigung: 0, schatten: ziel.schale ? 1 - u : u };
      }
      // Flug: Bodenpunkt auf einem Bogen von "von" nach "ziel", darüber die Flughöhe.
      // steigen (power2.out), reisen, sinken (power2.in) wie DESIGN.md §5 "Flug".
      var dauer = s.bis - s.ab;
      var tt = t - s.ab;
      var H0 = s.hoehe || PHYSIK.flughoehe || 120;
      var steig = PHYSIK.steigzeit || 0.45;
      var sink = PHYSIK.sinkzeit || 0.5;
      var h;
      if (tt < steig) h = H0 * easeFn("power2.out")(tt / steig);
      else if (tt > dauer - sink) h = H0 * (1 - easeFn("power2.in")((tt - (dauer - sink)) / sink));
      else h = H0;
      var fu = easeFn("power1.inOut")(u);
      var mx = (von.x + ziel.x) / 2;
      var my = (von.y + ziel.y) / 2;
      var lx = ziel.x - von.x;
      var ly = ziel.y - von.y;
      var bogen = s.bogen === undefined ? 0.18 : s.bogen; // seitliche Ausbuchtung (Anteil der Strecke)
      var cx = mx + -ly * bogen;
      var cy = my + lx * bogen;
      var a = (1 - fu) * (1 - fu);
      var b = 2 * (1 - fu) * fu;
      var c = fu * fu;
      var gx2 = a * von.x + b * cx + c * ziel.x;
      var gy2 = a * von.y + b * cy + c * ziel.y;
      // Neigung in Flugrichtung, am stärksten in der Mitte (wie ein geworfener Gegenstand)
      var richtung = ziel.x >= von.x ? 1 : -1;
      var neigung = richtung * 9 * (h / H0) * Math.sin(Math.PI * u);
      // Schatten nur über der Karte: von oder nach einer Schale blendet er aus/ein.
      var sch = 1;
      if (von.schale) sch = Math.min(sch, klemme(u / 0.35));
      if (ziel.schale) sch = Math.min(sch, klemme((1 - u) / 0.35));
      return { sicht: sicht, x: gx2, y: gy2 - h, h: h, gx: gx2, gy: gy2, neigung: neigung, schatten: sch };
    }

    // ---- Anker: Orte, Schalen, Darsteller ----
    var anker = Array.prototype.slice.call(w.querySelectorAll("[data-anker]")).map(function (el) {
      var rand = el.querySelector(".w-rand");
      var name = rand ? rand.firstElementChild : null;
      return {
        el: el,
        ziel: el.getAttribute("data-anker"),
        dx: Number(el.getAttribute("data-anker-dx") || 0),
        dy: Number(el.getAttribute("data-anker-dy") || 0),
        rand: rand,
        // Box des Namens EINMAL messen (nicht in jedem Bild): Messen im onUpdate kann bei
        // einem kalten Render andere Werte liefern. Darum wird erst nach den Schriften gebaut.
        box: name ? { l: name.offsetLeft, b: name.offsetWidth, o: name.offsetTop, h: name.offsetHeight } : null,
        bisZoom: rand && rand.hasAttribute("data-bis-zoom") ? Number(rand.getAttribute("data-bis-zoom")) : 0,
      };
    });

    /*
     * berechne(t): alle Werte eines Bildes, ohne DOM. Auf zwei Stellen gerundet,
     * damit Player und Render dieselben Zeichenketten bauen.
     */
    function berechne(t) {
      t = t || 0;
      var k = plan.kamera ? kameraBei(plan.kamera, t) : KAMERA_FEST;
      var e = { k: k, spuren: {} };
      Object.keys(spuren).forEach(function (n) {
        e.spuren[n] = wert(spuren[n], t);
      });
      e.kamera = "translate(" + (B / 2 - k.kx * k.zoom).toFixed(2) + " " + (H / 2 - k.ky * k.zoom).toFixed(2) + ") scale(" + k.zoom.toFixed(4) + ")";
      var theta = e.spuren.neigung || 0;
      var g = W ? waageGeometrie(W, theta) : null;
      var fuss = W ? waageFuss(k) : null;
      e.waage = W ? { g: g, fuss: fuss, theta: theta } : null;
      e.akteure = {};
      namen.forEach(function (n) {
        e.akteure[n] = darsteller(n, t, k, g, fuss);
      });
      e.anker = anker.map(function (a) {
        var p;
        var teile = a.ziel.split(":");
        if (teile[0] === "akteur") {
          var d = e.akteure[teile[1]];
          p = { x: d.x, y: d.y };
        } else {
          p = platz(a.ziel, k, g, fuss);
        }
        return { x: p.x + a.dx, y: p.y + a.dy };
      });
      return e;
    }

    // Aktionsrand: 5 % je Seite. Namen verblassen auf den letzten 70 px davor,
    // statt halb abgeschnitten im Bild zu stehen (Spike-Befund "Münc").
    var RAND_X = B * 0.05;
    var RAND_Y = H * 0.05;
    var RAMPE = 70;

    function render(t) {
      var e = berechne(t);
      var s = e.k.zoom;
      if (kamera) kamera.setAttribute("transform", e.kamera);
      // Linien bleiben auf dem Bildschirm gleich dick: Breite / Zoom (auch Strichmuster).
      for (var i = 0; i < striche.length; i++) {
        var st = striche[i];
        st.el.setAttribute("stroke-width", (st.breite / s).toFixed(3));
        if (st.muster) st.el.setAttribute("stroke-dasharray", st.muster.map(function (m) { return (m / s).toFixed(2); }).join(" "));
      }
      // Spuren mit fester Bedeutung (Deckkraft von Elementen mit data-spur="name")
      if (!render.spurEls) render.spurEls = Array.prototype.slice.call(w.querySelectorAll("[data-spur]"));
      render.spurEls.forEach(function (el) {
        var v = e.spuren[el.getAttribute("data-spur")];
        el.style.opacity = v.toFixed(3);
        el.style.display = v > 0.001 ? "" : "none"; // unsichtbar = gar nicht malen (spart Renderzeit)
      });
      if (opts.vorRender) opts.vorRender(e, t);

      // Waage: Fuß am Ort, Balken dreht um den Drehpunkt, Schalen hängen senkrecht.
      if (waage) {
        var g = e.waage.g;
        waage.fuss.style.transform = "translate(" + e.waage.fuss.x.toFixed(1) + "px, " + e.waage.fuss.y.toFixed(1) + "px)";
        waage.balken.setAttribute("transform", "rotate(" + e.waage.theta.toFixed(3) + " 0 " + (-W.saeule) + ")");
        waage.schaleL.setAttribute("transform", "translate(" + g.schaleL.x.toFixed(1) + " " + g.schaleL.y.toFixed(1) + ")");
        waage.schaleR.setAttribute("transform", "translate(" + g.schaleR.x.toFixed(1) + " " + g.schaleR.y.toFixed(1) + ")");
        // Ketten: vom Haken zu beiden Rändern der Schale (zwei Linien je Seite)
        var halb = W.schale / 2 - 8;
        var kette = function (h, sch) {
          return "M" + h.x.toFixed(1) + " " + h.y.toFixed(1) + " L" + (sch.x - halb).toFixed(1) + " " + sch.y.toFixed(1) +
            " M" + h.x.toFixed(1) + " " + h.y.toFixed(1) + " L" + (sch.x + halb).toFixed(1) + " " + sch.y.toFixed(1);
        };
        waage.ketteL.setAttribute("d", kette(g.hakenL, g.schaleL));
        waage.ketteR.setAttribute("d", kette(g.hakenR, g.schaleR));
      }

      // Darsteller
      namen.forEach(function (n) {
        var d = e.akteure[n];
        var el = aEl[n];
        el.huelle.style.transform = "translate(" + d.x.toFixed(1) + "px, " + d.y.toFixed(1) + "px)";
        el.huelle.style.opacity = d.sicht.toFixed(3);
        el.huelle.style.visibility = d.sicht > 0.001 ? "visible" : "hidden";
        el.figur.style.transform = "rotate(" + d.neigung.toFixed(2) + "deg)";
        if (el.schatten) {
          var hs = Math.max(0, 1 - d.h / 260); // je höher, desto kleiner und blasser
          el.schatten.style.transform = "translate(" + d.gx.toFixed(1) + "px, " + d.gy.toFixed(1) + "px) scale(" + (0.55 + 0.45 * hs).toFixed(3) + ")";
          el.schatten.style.opacity = (0.75 * (0.35 + 0.65 * hs) * d.schatten * d.sicht).toFixed(3);
        }
      });

      // Anker: kleben am Ort, bleiben bildschirmgroß. Namen verblassen vor dem Rand
      // und, wenn sie data-bis-zoom tragen (Ländernamen), beim Heranfahren.
      for (var j = 0; j < anker.length; j++) {
        var a = anker[j];
        var p = e.anker[j];
        a.el.style.transform = "translate(" + p.x.toFixed(1) + "px, " + p.y.toFixed(1) + "px)";
        if (!a.rand || !a.box) continue;
        var bx = a.box;
        var abstand = Math.min(p.x + bx.l - RAND_X, B - RAND_X - (p.x + bx.l + bx.b), p.y + bx.o - RAND_Y, H - RAND_Y - (p.y + bx.o + bx.h));
        var sicht = klemme(abstand / RAMPE);
        if (a.bisZoom) sicht *= klemme((a.bisZoom - s) / 0.6);
        a.rand.style.opacity = sicht.toFixed(3);
      }
    }

    return { plan: plan, berechne: berechne, render: render, welt2bild: welt2bild, waageGeometrie: waageGeometrie };
  }

  /*
   * nachSchriften(liste, baue): ruft baue() auf, sobald die Schriften geladen sind
   * (z. B. '600 48px "DT Inter"'). Erst dann stimmen gemessene Breiten.
   * Wer so baut, registriert seine Zeitachse am ENDE von baue(), nicht vorher.
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

  window.DeepTokBuehne = {
    erstelle: erstelle,
    wert: wert,
    kameraBei: kameraBei,
    pruefeSpur: pruefeSpur,
    waageGeometrie: waageGeometrie,
    nachSchriften: nachSchriften,
  };
})();
