"""Baut index.html und alle Szenen aus assets/timing.json.

Jede Szene erscheint zu dem Wort, das sie nennt: die Zeiten kommen aus den Wortmarken
von voice.py, nicht aus Hand-Schätzungen. Ändert sich das Skript, reicht
`python build/voice.py && python build/compose.py`.
"""
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
T = json.loads((ROOT / "assets" / "timing.json").read_text())
SC = {s["id"]: s for s in T["scenes"]}
ORDER = [s["id"] for s in T["scenes"]]
W, H = 1080, 1920
DUR = round(T["duration"] + 0.05, 2)

NAVY, PANEL, GOLD, CREME, ROT = "#0E1726", "#1F3864", "#C9A84C", "#F5F0E8", "#E07A5F"

# Szenen-Slots: Schnitt 0,15 s bevor die Stimme die neue Szene beginnt.
HOST = {}
for i, sid in enumerate(ORDER):
    start = 0.0 if i == 0 else round(SC[sid]["start"] - 0.15, 3)
    HOST[sid] = start
SLOT = {}
for i, sid in enumerate(ORDER):
    end = DUR if i == len(ORDER) - 1 else HOST[ORDER[i + 1]]
    SLOT[sid] = round(end - HOST[sid], 3)


def word(sid, si, wi):
    """Lokale Szenenzeit (s) des Wortanfangs."""
    return round(SC[sid]["sentences"][si]["words"][wi]["start"] - HOST[sid], 3)


def sent(sid, si, key="start"):
    return round(SC[sid]["sentences"][si][key] - HOST[sid], 3)


def scene_file(sid, css, body, js):
    slot = SLOT[sid]
    return f"""<template>
  <style>
    #root {{ position: absolute; inset: 0; font-family: "Inter", sans-serif; color: {CREME}; }}
    #root .clip {{ position: absolute; left: 0; width: 100%; text-align: center; }}
    #root .serif {{ font-family: "Playfair Display", serif; font-variant-numeric: lining-nums; font-feature-settings: "lnum" 1; }}
{css}
  </style>
  <div id="root" data-composition-id="{sid}" data-width="{W}" data-height="{H}">
{body}
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
    const D = {slot};
{js}
    window.__timelines["{sid}"] = tl;
  </script>
</template>
"""


def clip(cid, top, inner, cls="", extra=""):
    return (f'    <div id="{cid}" class="clip {cls}" data-start="0" data-duration="{{D}}" '
            f'style="top:{top}px" {extra}>{inner}</div>')


def words_spans(prefix, text, gold=()):
    out = []
    for i, w in enumerate(text.split()):
        style = f' style="color:{GOLD}"' if i in gold else ""
        out.append(f'<span class="w" id="{prefix}-{i}"{style}>{html.escape(w)}</span>')
    return " ".join(out)


# Gemeinsamer Wort-Auftritt: Unschärfe weg, Deckkraft rein, keine Verschiebung (motion.md „per word“).
BLUR_IN = 'tl.fromTo("{sel}", {{opacity: 0, filter: "blur(6px)"}}, {{opacity: 1, filter: "blur(0px)", duration: 0.16, ease: "power2.out"}}, {t});'
RISE_IN = 'tl.fromTo("{sel}", {{opacity: 0, y: 26}}, {{opacity: 1, y: 0, duration: 0.5, ease: "expo.out"}}, {t});'


def per_word(prefix, sid, si, n, offset=0):
    return "\n".join("    " + BLUR_IN.format(sel=f"#{prefix}-{i}", t=word(sid, si, i + offset)) for i in range(n))


def finalize(text, slot):
    return text.replace("{D}", str(slot))


scenes = {}

# 1 · Hook: Name steht schon in Bild 0 (Vorschaubild), dann Stempel und Zähler.
sid = "hook"
css = f"""
    #h-year {{ font-size: 44px; font-weight: 600; letter-spacing: 0.04em; opacity: 0.75; }}
    #h-name {{ font-size: 112px; font-weight: 700; line-height: 1.02; }}
    #h-club {{ font-size: 38px; font-weight: 600; color: {GOLD}; letter-spacing: 0.06em; }}
    #h-stamp {{ display: flex; justify-content: center; }}
    #h-stamp span {{ display: inline-block; font-size: 92px; font-weight: 900; letter-spacing: 0.08em;
      color: {GOLD}; border: 7px solid {GOLD}; padding: 6px 34px 10px; border-radius: 10px;
      background: rgba(14,23,38,0.88); }}
    #h-count {{ font-size: 260px; font-weight: 700; line-height: 1; color: {GOLD}; }}
    #h-label {{ font-size: 54px; font-weight: 600; }}
"""
body = "\n".join([
    clip("h-year", 360, "Sommer 2022"),
    clip("h-name", 440, "Robert<br>Lewandowski", "serif"),
    clip("h-club", 690, "FC BAYERN · 2014–2022"),
    clip("h-stamp", 500, '<span id="h-stamp-in">VERKAUFT</span>', "", "data-layout-allow-overlap"),
    clip("h-count", 800, '<span id="h-num">0</span>', "serif"),
    clip("h-label", 1085, "Tore in 8 Jahren"),
])
t_sold, t_num, t_tore = word(sid, 1, 2), word(sid, 2, 0), word(sid, 2, 1)
js = f"""
    tl.fromTo("#h-name", {{opacity: 1}}, {{opacity: 0.35, duration: 0.3, ease: "power2.out"}}, {t_sold});
    tl.fromTo("#h-stamp-in", {{opacity: 0, scale: 1.7, rotation: -14}}, {{opacity: 1, scale: 1, rotation: -8, duration: 0.32, ease: "expo.out"}}, {t_sold});
    tl.fromTo("#h-count", {{opacity: 0}}, {{opacity: 1, duration: 0.2, ease: "power2.out"}}, {t_num});
    const n = {{v: 0}};
    const el = document.querySelector("#h-num");
    tl.fromTo(n, {{v: 0}}, {{v: 344, duration: 1.0, ease: "power3.out", onUpdate: () => {{ el.textContent = Math.round(n.v); }}}}, {t_num});
    {RISE_IN.format(sel="#h-label", t=t_tore)}
"""
scenes[sid] = scene_file(sid, css, finalize(body, SLOT[sid]), js)

# 2 · Frage: erst raten, dann sehen. Die Pause nach der Frage ist der Tipp-Moment.
sid = "frage"
q_end = sent(sid, 1, "end")
pause = round(SLOT[sid] - q_end, 2)
css = f"""
    #f-warum {{ font-size: 46px; font-weight: 600; opacity: 0.8; padding: 0 40px; }}
    #f-q {{ font-size: 96px; font-weight: 700; line-height: 1.08; padding: 0 70px; }}
    .chip {{ left: 160px !important; width: 760px !important; text-align: left !important;
      font-size: 52px; font-weight: 600; background: {PANEL}; border: 3px solid rgba(201,168,76,0.45);
      border-radius: 28px; padding: 22px 34px; box-sizing: border-box; }}
    .chip b {{ display: inline-block; width: 64px; color: {GOLD}; font-weight: 800; }}
    #f-tipp {{ font-size: 40px; font-weight: 700; color: {GOLD}; letter-spacing: 0.04em; }}
    #f-ring {{ display: flex; justify-content: center; }}
"""
body = "\n".join([
    clip("f-warum", 330, words_spans("fw", "Warum gibt man so einen Stürmer ab?")),
    clip("f-q", 450, words_spans("fq", "Und was hätte es gekostet, ihn zu behalten?", gold=(7,))),
    clip("f-c0", 800, "<b>A</b>Nichts", "chip"),
    clip("f-c1", 930, "<b>B</b>Sein Gehalt", "chip"),
    clip("f-c2", 1060, "<b>C</b>45 Mio. €", "chip"),
    clip("f-tipp", 1215, "Tipp zuerst. Dann weiter.", "", "data-layout-allow-caption-zone"),
])
js = "\n".join([
    per_word("fw", sid, 0, 7),
    per_word("fq", sid, 1, 8),
    *[f'    tl.fromTo("#f-c{i}", {{opacity: 0, x: 60}}, {{opacity: 1, x: 0, duration: 0.45, ease: "expo.out"}}, {round(q_end + 0.05 + i * 0.08, 3)});' for i in range(3)],
    f'    tl.fromTo("#f-tipp", {{opacity: 0}}, {{opacity: 1, duration: 0.25}}, {round(q_end + 0.3, 3)});',
    f'    tl.to("#f-tipp", {{opacity: 0.35, duration: {round(pause - 0.5, 2)}, ease: "none"}}, {round(q_end + 0.55, 3)});',
])
scenes[sid] = scene_file(sid, css, finalize(body, SLOT[sid]), js)

# 3 · Vertrag: Auflösung. Der Balken läuft leer, am Ende steht 0 €.
sid = "vertrag"
css = f"""
    #v-meist {{ font-size: 48px; font-weight: 600; opacity: 0.75; }}
    #v-nichts {{ font-size: 150px; font-weight: 700; }}
    #v-bar-label {{ font-size: 40px; font-weight: 700; color: {GOLD}; letter-spacing: 0.06em; }}
    #v-track {{ left: 110px !important; width: 860px !important; height: 34px; border-radius: 17px;
      background: rgba(245,240,232,0.14); overflow: hidden; }}
    #v-fill {{ width: 100%; height: 100%; background: {GOLD}; border-radius: 17px; transform-origin: right center; }}
    #v-dates {{ left: 110px !important; width: 860px !important; display: flex; justify-content: space-between;
      font-size: 36px; font-weight: 600; opacity: 0.8; }}
    #v-frei {{ font-size: 54px; font-weight: 600; }}
    #v-null {{ font-size: 200px; font-weight: 700; color: {GOLD}; line-height: 1; }}
"""
body = "\n".join([
    clip("v-meist", 340, "Die meisten sagen:"),
    clip("v-nichts", 400, "nichts.", "serif"),
    clip("v-bar-label", 690, "VERTRAG"),
    clip("v-track", 760, '<div id="v-fill"></div>'),
    clip("v-dates", 815, "<span>Juli 2022</span><span>Juni 2023</span>"),
    clip("v-frei", 920, "danach ablösefrei:"),
    clip("v-null", 990, "0 €", "serif"),
])
s2, s3 = sent(sid, 1), sent(sid, 2)
js = f"""
    {RISE_IN.format(sel="#v-meist", t=word(sid, 0, 0))}
    {BLUR_IN.format(sel="#v-nichts", t=word(sid, 0, 3))}
    tl.to("#v-nichts", {{opacity: 0.4, duration: 0.3}}, {s2});
    tl.to("#v-meist", {{opacity: 0.3, duration: 0.3}}, {s2});
    tl.fromTo(["#v-bar-label", "#v-track", "#v-dates"], {{opacity: 0, y: 20}}, {{opacity: 1, y: 0, duration: 0.45, ease: "expo.out", stagger: 0.06}}, {s2});
    tl.fromTo("#v-fill", {{scaleX: 1}}, {{scaleX: 0, duration: 1.6, ease: "power1.inOut"}}, {word(sid, 1, 4)});
    {RISE_IN.format(sel="#v-frei", t=word(sid, 2, 3))}
    tl.fromTo("#v-null", {{opacity: 0, scale: 1.5}}, {{opacity: 1, scale: 1, duration: 0.4, ease: "expo.out"}}, {word(sid, 2, 7)});
"""
scenes[sid] = scene_file(sid, css, finalize(body, SLOT[sid]), js)

# 4 · Angebot: zwei Wege. Rechts das Geld, links der unsichtbare Preis.
sid = "angebot"
css = f"""
    #a-top {{ display: flex; justify-content: center; }}
    #a-top span {{ font-size: 50px; font-weight: 700; background: {PANEL}; border-radius: 26px; padding: 16px 40px; }}
    #a-lines {{ display: flex; justify-content: center; }}
    .a-node {{ width: 440px !important; font-size: 56px; font-weight: 700; }}
    #a-l {{ left: 50px !important; }}
    #a-r {{ left: 590px !important; color: {GOLD}; }}
    #a-geld {{ left: 590px !important; width: 440px !important; font-size: 104px; font-weight: 700; color: {GOLD}; line-height: 1.05; }}
    #a-preis {{ left: 50px !important; width: 440px !important; font-size: 50px; font-weight: 800; color: {ROT}; line-height: 1.15; }}
    #a-hint {{ left: 50px !important; width: 440px !important; font-size: 34px; font-weight: 500; opacity: 0.75; line-height: 1.25; }}
"""
svg = (f'<svg width="1080" height="260" viewBox="0 0 1080 260"><path id="a-pl" d="M540 0 C540 120 270 110 270 250" '
       f'stroke="{CREME}" stroke-opacity="0.5" stroke-width="5" fill="none" stroke-dasharray="400" stroke-dashoffset="400"/>'
       f'<path id="a-pr" d="M540 0 C540 120 810 110 810 250" stroke="{GOLD}" stroke-width="6" fill="none" '
       f'stroke-dasharray="400" stroke-dashoffset="400"/></svg>')
body = "\n".join([
    clip("a-top", 340, "<span>Lewandowski</span>"),
    clip("a-lines", 440, svg),
    clip("a-l", 720, "Behalten", "a-node"),
    clip("a-r", 720, "Verkaufen", "a-node"),
    clip("a-geld", 830, "+45<br>Mio. €", "serif"),
    clip("a-preis", 840, "kostet<br>45 Mio. €"),
    clip("a-hint", 1000, "steht auf keiner Rechnung"),
])
js = f"""
    {RISE_IN.format(sel="#a-top", t=0.05)}
    tl.fromTo(["#a-pl", "#a-pr"], {{strokeDashoffset: 400}}, {{strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut", stagger: 0.08}}, 0.25);
    tl.fromTo(["#a-l", "#a-r"], {{opacity: 0, y: 20}}, {{opacity: 1, y: 0, duration: 0.45, ease: "expo.out", stagger: 0.08}}, 0.7);
    tl.fromTo("#a-geld", {{opacity: 0, scale: 1.3}}, {{opacity: 1, scale: 1, duration: 0.4, ease: "expo.out"}}, {word(sid, 0, 2)});
    tl.fromTo("#a-preis", {{opacity: 0, y: 24}}, {{opacity: 1, y: 0, duration: 0.45, ease: "expo.out"}}, {word(sid, 1, 2)});
    tl.fromTo("#a-hint", {{opacity: 0}}, {{opacity: 0.75, duration: 0.4}}, {round(word(sid, 1, 2) + 0.15, 3)});
"""
scenes[sid] = scene_file(sid, css, finalize(body, SLOT[sid]), js)

# 5 · Begriff: der Fachbegriff landet auf seinem Wort, die Definition baut sich Wort für Wort.
sid = "begriff"
defin = "der Wert der besten Alternative, die du aufgibst."
css = f"""
    #b-pre {{ font-size: 48px; font-weight: 600; opacity: 0.75; }}
    #b-word {{ font-size: 132px; font-weight: 700; line-height: 1.02; }}
    #b-word em {{ font-style: normal; color: {GOLD}; }}
    #b-rule {{ display: flex; justify-content: center; }}
    #b-rule div {{ width: 140px; height: 5px; background: {GOLD}; border-radius: 3px; }}
    #b-def {{ font-size: 64px; font-weight: 600; line-height: 1.22; padding: 0 90px; }}
"""
body = "\n".join([
    clip("b-pre", 380, "Genau das sind"),
    clip("b-word", 460, "Opportunitäts-<br><em>kosten</em>", "serif"),
    clip("b-rule", 770, "<div></div>"),
    clip("b-def", 830, words_spans("bd", defin, gold=(3, 4))),
])
js = "\n".join([
    "    " + RISE_IN.format(sel="#b-pre", t=word(sid, 0, 0)),
    f'    tl.fromTo("#b-word", {{opacity: 0, filter: "blur(10px)", scale: 1.06}}, {{opacity: 1, filter: "blur(0px)", scale: 1, duration: 0.35, ease: "expo.out"}}, {word(sid, 0, 3)});',
    f'    tl.fromTo("#b-rule div", {{scaleX: 0}}, {{scaleX: 1, duration: 0.4, ease: "expo.out"}}, {round(word(sid, 0, 3) + 0.2, 3)});',
    per_word("bd", sid, 1, 8),
])
scenes[sid] = scene_file(sid, css, finalize(body, SLOT[sid]), js)

# 6 · Kurve: Manim-Clip, quadratisch, mittig.
sid = "kurve"
css = f"""
    #k-title {{ font-size: 44px; font-weight: 700; color: {GOLD}; letter-spacing: 0.08em; }}
    #k-card {{ position: absolute; left: 110px; top: 320px; width: 860px; height: 860px; border-radius: 40px;
      overflow: hidden; border: 2px solid rgba(201,168,76,0.35); background: #0E1726; }}
    #k-vid {{ position: absolute; left: 0; top: 0; width: 860px; height: 860px; }}
"""
body = "\n".join([
    clip("k-title", 250, "DIE TAUSCHKURVE"),
    f'    <div id="k-card"><video id="k-vid" class="clip" src="assets/kurve.mp4" muted playsinline data-start="0" '
    f'data-duration="{min(4.9, SLOT[sid])}" data-track-index="1"></video></div>',
])
js = f"""
    tl.fromTo("#k-title", {{opacity: 0}}, {{opacity: 1, duration: 0.3}}, 0.05);
"""
scenes[sid] = scene_file(sid, css.replace("left: 0; width: 100%;", ""), finalize(body, SLOT[sid]), js)

# 7 · Irrtum: Man denkt X. Falsch, weil Y.
sid = "irrtum"
css = f"""
    #i-pre {{ font-size: 50px; font-weight: 600; opacity: 0.75; }}
    #i-myth {{ font-size: 104px; font-weight: 700; line-height: 1.08; padding: 0 60px; }}
    #i-gratis {{ position: relative; display: inline-block; }}
    #i-strike {{ position: absolute; left: -4%; top: 52%; width: 108%; height: 12px; background: {ROT};
      border-radius: 6px; transform-origin: left center; }}
    #i-falsch {{ display: flex; justify-content: center; }}
    #i-falsch span {{ font-size: 64px; font-weight: 900; color: {ROT}; letter-spacing: 0.1em;
      border: 6px solid {ROT}; border-radius: 10px; padding: 4px 26px 8px; }}
    #i-wahr {{ font-size: 104px; font-weight: 700; line-height: 1.08; color: {GOLD}; padding: 0 60px; }}
"""
myth_words = "Was nichts kostet, ist".split()
myth = " ".join(f'<span class="w" id="im-{i}">{w}</span>' for i, w in enumerate(myth_words))
myth += ' <span class="w" id="im-4"><span id="i-gratis">gratis.<span id="i-strike"></span></span></span>'
body = "\n".join([
    clip("i-pre", 360, "Man denkt:"),
    clip("i-myth", 440, myth, "serif", "data-layout-allow-overlap"),
    clip("i-falsch", 720, "<span>FALSCH</span>"),
    clip("i-wahr", 850, words_spans("iw", "Auch Behalten hat einen Preis.", gold=()), "serif"),
])
js = "\n".join([
    "    " + RISE_IN.format(sel="#i-pre", t=word(sid, 0, 0)),
    per_word("im", sid, 0, 5, offset=2),
    f'    tl.fromTo("#i-strike", {{scaleX: 0}}, {{scaleX: 1, duration: 0.3, ease: "power3.out"}}, {word(sid, 1, 0)});',
    f'    tl.fromTo("#i-falsch span", {{opacity: 0, scale: 1.6, rotation: -10}}, {{opacity: 1, scale: 1, rotation: -5, duration: 0.3, ease: "expo.out"}}, {word(sid, 1, 0)});',
    f'    tl.fromTo("#i-myth", {{opacity: 1}}, {{opacity: 0.45, duration: 0.3}}, {round(word(sid, 1, 0) + 0.35, 3)});',
    per_word("iw", sid, 1, 5, offset=1),
])
scenes[sid] = scene_file(sid, css, finalize(body, SLOT[sid]), js)

# 8 · Satz fürs Gespräch: das, was hängen bleiben soll. Wort für Wort von grau zu creme.
sid = "satz"
z1 = "Die wahren Kosten stehen nicht auf der Rechnung,"
z2 = "sondern in der Alternative, die du aufgibst."
css = f"""
    #s-label {{ font-size: 36px; font-weight: 800; color: {GOLD}; letter-spacing: 0.22em; }}
    #s-rule {{ display: flex; justify-content: center; }}
    #s-rule div {{ width: 120px; height: 4px; background: {GOLD}; border-radius: 2px; }}
    #s-quote {{ font-size: 82px; font-style: italic; font-weight: 500; line-height: 1.2; padding: 0 80px; }}
    #s-quote .w {{ color: rgba(245,240,232,0.22); }}
    #s-foot {{ font-size: 34px; font-weight: 600; opacity: 0.7; letter-spacing: 0.04em; }}
"""
q = words_spans("sq", z1 + " " + z2)
body = "\n".join([
    clip("s-label", 380, "SATZ FÜRS GESPRÄCH"),
    clip("s-rule", 445, "<div></div>"),
    clip("s-quote", 500, q, "serif"),
    clip("s-foot", 1130, "Opportunitätskosten · Wirtschaft &amp; Recht 10"),
])
n1, n2 = len(z1.split()), len(z2.split())
lines = [
    "    " + RISE_IN.format(sel="#s-label", t=word(sid, 0, 0)),
    f'    tl.fromTo("#s-rule div", {{scaleX: 0}}, {{scaleX: 1, duration: 0.4, ease: "expo.out"}}, {round(word(sid, 0, 0) + 0.15, 3)});',
]
gold_idx = set(range(n1 + 3, n1 + n2))  # „Alternative, die du aufgibst.“
for i in range(n1 + n2):
    si, wi = (1, i) if i < n1 else (2, i - n1)
    color = GOLD if i in gold_idx else CREME
    lines.append(f'    tl.fromTo("#sq-{i}", {{color: "rgba(245,240,232,0.22)"}}, {{color: "{color}", duration: 0.12, ease: "none"}}, {word(sid, si, wi)});')
lines.append(f'    tl.fromTo("#s-foot", {{opacity: 0}}, {{opacity: 0.7, duration: 0.5}}, {round(sent(sid, 2, "start") + 0.6, 3)});')
scenes[sid] = scene_file(sid, css, finalize(body, SLOT[sid]), "\n".join(lines))

# Untertitel: 3–4 Wörter je Gruppe, aktives Wort gold. Wo der Text schon groß im Bild steht,
# gibt es keine Untertitel (sonst liest man denselben Satz zweimal).
NO_CAP = {("frage", 0), ("frage", 1), ("begriff", 0), ("begriff", 1), ("irrtum", 0), ("irrtum", 1),
          ("satz", 0), ("satz", 1), ("satz", 2)}
groups = []
for sc in T["scenes"]:
    for si, se in enumerate(sc["sentences"]):
        if (sc["id"], si) in NO_CAP:
            continue
        cur = []
        for w in se["words"]:
            if cur and (len(" ".join(x["text"] for x in cur + [w])) > 24 or len(cur) == 4):
                groups.append({"sentence": (sc["id"], si), "words": cur})
                cur = []
            cur.append(w)
        if cur:
            groups.append({"sentence": (sc["id"], si), "words": cur})
cap_css = f"""
    #root {{ position: absolute; inset: 0; }}
    .cg {{ position: absolute; left: 0; top: 1215px; width: 100%; text-align: center; opacity: 0; }}
    .pill {{ display: inline-block; background: rgba(31,56,100,0.92); border-radius: 22px; padding: 14px 34px 18px;
      font-family: "Inter", sans-serif; font-size: 54px; font-weight: 700; color: rgba(245,240,232,0.6); }}
    .pill span {{ margin: 0 6px; }}
"""
cap_body, cap_js = [], []
for gi, g in enumerate(groups):
    ws = g["words"]
    start = max(0.1, ws[0]["start"] - 0.06)
    nxt = groups[gi + 1]["words"][0]["start"] - 0.06 if gi + 1 < len(groups) else DUR
    end = min(ws[-1]["end"] + 0.25, nxt)
    spans = "".join(f'<span id="cw{gi}-{wi}">{html.escape(w["text"])}</span>' for wi, w in enumerate(ws))
    cap_body.append(f'    <div id="cg{gi}" class="cg clip" data-start="0" data-duration="{DUR}" data-layout-allow-caption-zone>'
                    f'<span class="pill">{spans}</span></div>')
    cap_js.append(f'    tl.fromTo("#cg{gi}", {{opacity: 0}}, {{opacity: 1, duration: 0.08}}, {round(start, 3)});')
    cap_js.append(f'    tl.to("#cg{gi}", {{opacity: 0, duration: 0.08}}, {round(end - 0.08, 3)});')
    for wi, w in enumerate(ws):
        cap_js.append(f'    tl.fromTo("#cw{gi}-{wi}", {{color: "rgba(245,240,232,0.6)"}}, {{color: "{GOLD}", duration: 0.05}}, {round(w["start"], 3)});')
        cap_js.append(f'    tl.to("#cw{gi}-{wi}", {{color: "{CREME}", duration: 0.05}}, {round(w["end"], 3)});')
captions = f"""<template>
  <style>{cap_css}
  </style>
  <div id="root" data-composition-id="captions" data-width="{W}" data-height="{H}">
{chr(10).join(cap_body)}
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
{chr(10).join(cap_js)}
    window.__timelines["captions"] = tl;
  </script>
</template>
"""

hosts = []
for i, sid in enumerate(ORDER):
    hosts.append(f'      <div id="{sid}" data-composition-id="{sid}" data-composition-src="compositions/{sid}.html" '
                 f'data-start="{HOST[sid]}" data-duration="{SLOT[sid]}" data-track-index="1" data-track-kind="graphics" '
                 f'data-width="{W}" data-height="{H}" style="z-index:2"></div>')
index = f"""<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={W}, height={H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: {W}px; height: {H}px; overflow: hidden; background: {NAVY}; }}
      #bg {{ position: absolute; inset: 0; background: radial-gradient(120% 70% at 50% 35%, #15233A 0%, {NAVY} 70%); }}
      #badge {{ position: absolute; left: 0; top: 182px; width: 100%; text-align: center; z-index: 6;
        font-family: "Inter", sans-serif; font-size: 30px; font-weight: 700; letter-spacing: 0.2em; color: {GOLD}; }}
      #badge span {{ color: rgba(245,240,232,0.55); font-weight: 600; letter-spacing: 0.12em; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="{W}" data-height="{H}">
      <div id="bg"></div>
      <div id="badge" class="clip" data-start="0" data-duration="{DUR}" data-track-index="3">WIRTSCHAFT &amp; MÄRKTE <span>· DEEPTOK</span></div>
{chr(10).join(hosts)}
      <div id="captions" data-composition-id="captions" data-composition-src="compositions/captions.html" data-start="0"
        data-duration="{DUR}" data-track-index="2" data-track-kind="captions" data-width="{W}" data-height="{H}" style="z-index:5"></div>
      <audio id="voice" class="clip" src="assets/voice.m4a" data-start="0" data-duration="{DUR}" data-track-index="4" data-volume="1"></audio>
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
"""

out = ROOT / "compositions"
out.mkdir(exist_ok=True)
for sid, src in scenes.items():
    (out / f"{sid}.html").write_text(src)
(out / "captions.html").write_text(captions)
(ROOT / "index.html").write_text(index)
print("Szenen:", ", ".join(f"{s} {HOST[s]}+{SLOT[s]}" for s in ORDER))
print("Untertitel-Gruppen:", len(groups), "· Dauer", DUR)
