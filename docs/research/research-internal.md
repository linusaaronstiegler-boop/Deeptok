# Audit: probe video "Opportunitätskosten"

Sources: `build/*.py`, `compositions/*.html`, `REVIEW.md`, `docs/PLAN.md`, `CLAUDE.md`, the beat and phone sheets in `.hyperframes/artifacts/snapshots/30174cd3…/` (newest folder), and the frames in `/tmp/fr/f_*.png`. `/tmp/fr/sheet.png` did not exist, so I made one at `/tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/scratchpad/sheet.png`.

## 1. Critique against Veritasium and Simplicissimus

**Verdict:** the teaching structure is already at Veritasium level. It goes concrete case → prediction → named misconception → term → rule → takeaway, which is the structure Muller's misconception research supports. The visual layer is the problem: it is a slide deck.

1. **Words are the picture.** 5 of 8 scenes are type only. The only visuals that aren't text are the contract bar, the fork and the curve. There is no face, no club colours, no place, and the money never appears as an object. Frame 0, which becomes the feed thumbnail, is just a name in serif type. In Simplicissimus every frame is an illustrated scene (characters, props, maps) and words are the exception.
2. **Slide rhythm.** Every scene runs the same way: hard cut to empty navy, elements fade in from top to bottom, hold, hard cut. Nothing animates out, no object survives a cut, there is no camera, and one static gradient sits under all 52 s. The reference channels keep one world: the camera travels across it and the same objects (the player, the money) move and change through match cuts.
3. **The motion carries no meaning.** Almost every tween uses one of two presets (`BLUR_IN` and `RISE_IN`). Only the draining bar and the moving dot express the concept. The 45 Mio. should fly from Barcelona to Munich, and the contract should burn down like a fuse.
4. **Text is redundant.** The frage, begriff, irrtum and satz scenes print the narrated sentence word for word, so viewers read and hear the same thing at once, which the redundancy principle warns against. In the hook, a caption repeats "Sommer 2022" while it is already on screen.
5. **Layout:**
   - All 36 y-positions are set by hand.
   - Content sits between y = 330 and 1100, so the bottom ~30 % of the frame is always empty. That is a TikTok safe zone, but this is our own player.
   - At 4.0 s the stamp over the dimmed name leaves ghost text you can't read.
   - At 8.3 s the per-word reveal makes "Warum" appear alone at the left edge.
6. **The curve scene:**
   - The Manim clip sits in a bordered box (a video inside a slide), and its background doesn't match the gradient.
   - Axis labels are about 22 px at 1080 width, which is too small on a phone.
   - The clip is pre-timed at 4.9 s and does not follow "mehr vom einen … weniger vom anderen". It gets 4.8 s on screen.
7. **Sound, which was Linus's main complaint and is justified:**
   - Piper thorsten-high outputs 22.05 kHz mono. It is encoded as AAC at about 85 kb/s with no EQ, compression or de-essing.
   - Each sentence is synthesised on its own, so the intonation restarts every sentence.
   - Every gap is exactly 0.22 s or 0.40 s, so the rhythm sounds like a metronome. Nothing stresses "nichts", "null" or "falsch".
   - The voice is the biggest single lever. Synthesise whole scenes with Chirp 3 HD (as the plan says), use ElevenLabs only for hero videos, or run a local model on the 5070 Ti. Take word times from the faster-whisper pass instead of splitting sentences by length.
   - Keep music and sound effects out. Moreno & Mayer found both hurt learning.
8. **Keep:** the palette, typography, prediction pause, misconception beat and the "Satz fürs Gespräch".

## 2. Handwork vs reusable

| Part | Status |
|---|---|
| `voice.py` | Reusable: it doesn't depend on the scenes. Change the engine and take word times from alignment. |
| `script.py` format | Reusable. Replace `Shown\|Spoken` with a shared pronunciation lexicon plus a German number normaliser. |
| `compose.py` helpers, captions, index assembly (lines 1–87 and 333–429) | About 43 %, reusable. |
| `compose.py` scenes (lines 88–332, 245 lines) | All per-video work: pixel layout and font sizes, plus 21 cues addressed as (sentence, word) indices that shift silently when a word changes. |
| `NO_CAP` set | Per-video. It should come from the scene type. |
| `kurve_manim.py` | Per-video, not tied to cue words, duration hard-coded. |
| Pronunciation, fact check, frame review | Manual. |

## 3. Scene library

Each scene type is one JS module: `(params, cues, actors) → DOM + GSAP timeline`. The same module runs live in the app player and writes HyperFrames HTML for MP4 export and `check`. Layout uses fixed slots (hero, top, bottom, split), so the LLM never sets pixels. Each type comes with a Zod schema, text-length limits, default cue mapping, a demo spec and a reference snapshot. Three layers run across all scenes:
- **stage:** a grain or parallax background world with camera pan and zoom.
- **actors:** objects that persist across scenes and move between them via GSAP Flip.
- **captions:** switched off automatically when the scene type already shows the sentence.

| Type | Purpose | Key params | Animation |
|---|---|---|---|
| hook-portrait | Person intro, thumbnail frame | name, sub, actor, stamp, stat | Ken Burns on a duotone portrait or illustration, stamp lands on its cue |
| hook-number | Surprising number | value, unit, label, compare | Counts up on its cue, then a "≈" comparison |
| prediction-chips | Question before the answer | question, options[2–4], correct, confidence | Chips appear one after another. In the app the timeline waits for a tap; in the MP4 a ring counts down. |
| reveal-answer | Resolve the prediction | correct, whyAt | Wrong answers struck through, right one lit, then it turns into the next object |
| misconception-strike | Name and refute | myth, correction | Red strike and "FALSCH" on cue, correction replaces the myth |
| term-definition | New term | term, definition, keyWords | Term lands on cue, definition builds phrase by phrase |
| fork-decision | Choice and its outcomes | root, branches[label, value, tone] | Paths draw, values pop on their cues, the branch not taken fades |
| comparison-split | A vs B ledger | rows, totals | Rows alternate in, totals add up |
| timeline-bar | Time running out | from, to, end | Bar drains, end value pops |
| timeline | Order in history | events[date, label] | Camera travels along the axis |
| map-route | Geography, flows | places[lat, lon], route, token | d3-geo, camera flies in, arc draws, a token travels |
| map-choropleth | Regional data | regions, values, source | Regions fill one by one, zoom to the focus |
| chart-line | Trend | series, annotations, source | Line draws, notes pin on their cues |
| chart-bar | Ranking | bars, highlight | Bars grow, optional reorder |
| function-plot | Curves in maths and economics | f, axes, point path | Native SVG, point follows cues. `engine:"manim"` only for hard maths. |
| equation-build | What a formula means | colour-coded terms | KaTeX terms assemble, each linked to its meaning |
| process-steps | Cause chain or cycle | steps, layout | One node and arrow per cue |
| unit-viz | Make sizes tangible | total, unit, icon | Icon grid fills up |
| character-beat | The Simplicissimus ingredient | character, pose, prop, bubble | Cut-out SVG rig: pose swap, blink, walk |
| archival-photo | Real evidence | asset query, focus, credit | Duotone image, slow push in, credit and date shown |
| quote-card | Quote or Satz fürs Gespräch | text, gold, sammlung | Karaoke grey to cream |
| briefing-card | News | what, why, next, source, date | Three rows build, source is required |
| rhetoric-device | Rhetoric channel | text, device, spans | Brackets show the pattern |

## 4. Video-spec schema

The LLM writes only this file. All times are cue names and the renderer resolves them; the LLM never writes seconds.

```ts
type VideoSpec = {
  id: string; channel: string; profiles: ("linus"|"bruder")[];
  series: { id: string; part: number }; voice: string;      // voices/<id>.json
  lexicon?: Record<string,string>;                          // added to the global lexicon
  facts: { id: string; claim: string; src: string; date: string }[];
  actors?: { id: string; kind: "portrait"|"chip"|"icon"|"character"; [k: string]: unknown }[];
  scenes: {
    type: SceneType;
    narration: string;          // "{cue}" right before a word marks its time
    params: object;             // validated by that type's Zod schema
    facts?: string[]; actor?: string;
    camera?: "static"|"push"|{ pan: string };
    transition?: "cut"|"push"|{ match: string };            // match cut on an actor
    interaction?: "pause_for_answer";
    captions?: "auto"|"off"; hold?: number;
  }[];
  retrieval: { q: string; options: string[]; answer: number }[];   // 0–2 FSRS items
};
```

Example for this video. The `src` values are placeholders; the fact-check gate fills them in or blocks the video.

```json
{"id":"wr-opportunitaetskosten-01","channel":"wirtschaft-maerkte","profiles":["bruder","linus"],
 "series":{"id":"opportunitaetskosten","part":1},"voice":"narrator-de","lexicon":{"Barcelona":"Barsselona"},
 "facts":[{"id":"abl","claim":"Ablöse 45 Mio. € + bis zu 5 Mio. € Bonus","src":"https://…","date":"2022-07"},
          {"id":"vtr","claim":"Vertrag bis Sommer 2023","src":"https://…","date":"2022-07"},
          {"id":"tore","claim":"344 Tore in 375 Spielen","src":"https://…","date":"2022-07"}],
 "actors":[{"id":"lewa","kind":"portrait","asset":{"from":"wikimedia","query":"Robert Lewandowski FC Bayern","treat":"duotone"}},
           {"id":"geld","kind":"chip","text":"45 Mio. €","tone":"gold"}],
 "scenes":[
  {"type":"hook-portrait","actor":"lewa","facts":["tore"],
   "narration":"Sommer 2022. Bayern München {sold}verkauft Robert Lewandowski. {n}344 Tore in acht Jahren.",
   "params":{"name":"Robert Lewandowski","sub":"FC Bayern · 2014–2022","stamp":{"text":"VERKAUFT","at":"sold"},"stat":{"value":344,"label":"Tore","at":"n"}}},
  {"type":"prediction-chips","interaction":"pause_for_answer",
   "narration":"Warum gibt man so einen Stürmer ab? Und was hätte es gekostet, ihn zu behalten?",
   "params":{"question":"Was kostet Behalten?","options":["Nichts","Sein Gehalt","45 Mio. €"],"correct":2,"confidence":true}},
  {"type":"timeline-bar","facts":["vtr"],"transition":{"match":"lewa"},
   "narration":"Die meisten sagen: {myth}nichts. Er war ja schon da. Doch sein Vertrag lief nur noch {drain}ein Jahr. Danach hätte er ablösefrei gehen können. Für {zero}null Euro.",
   "params":{"label":"Vertrag","from":"Juli 2022","to":"Juni 2023","myth":{"text":"nichts","at":"myth"},"drainAt":"drain","end":{"text":"0 €","at":"zero"}}},
  {"type":"map-route","facts":["abl"],
   "narration":"{bcn}Barcelona zahlte {pay}45 Millionen Euro.",
   "params":{"places":[{"id":"muc","lat":48.14,"lon":11.58},{"id":"bcn","lat":41.39,"lon":2.17}],
             "route":{"from":"muc","to":"bcn","token":"lewa","at":"bcn"},"back":{"actor":"geld","to":"muc","at":"pay"}}},
  {"type":"fork-decision","narration":"Wer {keep}behält, verzichtet auf {lost}dieses Geld.",
   "params":{"root":"lewa","focus":{"branch":0,"at":"keep"},"branches":[
     {"label":"Behalten","value":"kostet 45 Mio. €","tone":"loss","note":"steht auf keiner Rechnung","at":"lost"},
     {"label":"Verkaufen","value":"+45 Mio. €","tone":"gain","actor":"geld"}]}},
  {"type":"term-definition",
   "narration":"Genau das sind {term}Opportunitätskosten: der Wert der besten Alternative, die du aufgibst.",
   "params":{"term":"Opportunitätskosten","at":"term","definition":"Wert der besten aufgegebenen Alternative","keyWords":["besten","Alternative"]}},
  {"type":"function-plot",
   "narration":"Ökonomen zeichnen das als {curve}Kurve. Mehr vom {move}einen heißt immer {less}weniger vom anderen.",
   "params":{"curve":"quarter-circle","x":"Erfolg diese Saison","y":"Geld für morgen","drawAt":"curve","point":{"from":0.92,"to":0.52,"at":"move"},"braces":{"at":"less"}}},
  {"type":"misconception-strike",
   "narration":"Man denkt: Was nichts kostet, ist {strike}gratis. Falsch. Auch Behalten hat einen Preis.",
   "params":{"myth":"Was nichts kostet, ist gratis.","strikeAt":"strike","correction":"Auch Behalten hat einen Preis."}},
  {"type":"quote-card","hold":2.2,"captions":"off",
   "narration":"Satz fürs Gespräch: Die wahren Kosten stehen nicht auf der Rechnung, sondern in der Alternative, die du aufgibst.",
   "params":{"label":"Satz fürs Gespräch","gold":"Alternative, die du aufgibst","sammlung":true}}],
 "retrieval":[{"q":"Was hätte es Bayern gekostet, Lewandowski zu behalten?","options":["Nichts, er war schon da","45 Mio. € entgangene Ablöse","Nur sein Jahresgehalt"],"answer":1}]}
```

## 5. LLM work per video

These are estimates; nothing was measured.

| | Now (probe) | With the library |
|---|---|---|
| What the LLM produces | Script, ~245 lines of scene code, 77 lines of Manim, debugging, reading snapshots | One spec (~2–3k output tokens), facts, one critique call |
| Calls | An agent loop of 20–40 tool rounds, probably 1–3M context tokens, Opus | 3–5 calls, about 25–45k tokens, Sonnet; a cheap model for rubric checks |
| Steps that use no LLM | Few | TTS, alignment, render, `check`, snapshots, ASR |

That is roughly 30–60× less LLM work. Ten specs per session share one cached library prompt. At steady state (15 videos a day) that is about 0.4–0.7M tokens a day. Opus is needed only to design the library (about 3–6 sessions, scheduled before 6 Nov or after 13 Nov) and for a weekly review of a sample. Before the Pro week, measure the real quota use over 3 test nights.

## 6. Quality gates (all automatic)

1. **Spec:**
   - Zod validation per scene type, with text-length limits per layout slot.
   - Every `{cue}` exists, every number on screen matches the narration, and the prediction comes before the reveal.
   - For the brother's videos: the example comes before the rule and a misconception scene is present.
   - Blocklist: praise, "natürlich", "offensichtlich", "Leichtsinnsfehler", mindset phrases.
   - Retrieval distractors are about the same length.
2. **Fact check:** a second agent with web access checks every `facts[]` entry against a source and date. No source means the video is not published.
3. **Audio:**
   - faster-whisper `small`, `de` with word timestamps does two jobs: the real word times, and the hearing check (word error rate after number normalisation must be under 5 %).
   - Misheard words become lexicon proposals.
   - Loudness −16 ±1 LUFS, true peak ≤ −1 dBTP, no unplanned silence over 1.2 s.
4. **Render:** `npx hyperframes check` with 0 errors (lint, runtime, layout, motion, contrast).
5. **Layout and timing, measured in the DOM:**
   - Everything stays inside the safe area; nothing overlaps unless the spec allows it; minimum font 34 px.
   - Each element starts within ±150 ms of its cue.
   - Text stays visible at least its reading time (words ÷ 3.5 + 0.5 s).
   - The picture changes at least every 3 s, except declared pauses.
6. **Vision critique:** one beat contact sheet plus the spec goes to a fixed JSON rubric: legibility, does the picture match the narration, clutter, ghost text, empty frames. Below the threshold the video gets one repair attempt, then goes to a human queue. Calibrate the rubric on known good and bad frames.
7. **Regression:** reference snapshots for each scene type, so library changes can't break old videos.
8. **Human sample:** Linus rates about 1 in 10 in the app by choosing from a reason menu, and that feeds back to the editorial runs.

**Build order:**
1. Voice, alignment and a mastering chain.
2. Eight core scene types: hook, prediction, term, misconception, fork, comparison, quote, chart.
3. Stage, actors and transitions.
4. Maps, photos, characters (characters need a one-time SVG asset set).