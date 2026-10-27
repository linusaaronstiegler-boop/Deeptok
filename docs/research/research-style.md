# Visual and sonic style research for DeepTok (as of 2026-10-26)

Legend: **[unv]** means I could not verify it from a source. Most of these are my own descriptions of each channel's look. Source numbers in brackets refer to the list at the end.

## 1. Reference breakdown

| Channel | Look and illustration | Motion and transitions | Hook and pacing | Voice | Music and SFX |
|---|---|---|---|---|---|
| **Veritasium** | Live action with Derek on camera, plus experiments, dramatisations and street interviews that surface misconceptions [4]. Growing share of 2D/3D animation [unv]. | Mostly documentary cutting. Animation is used to explain a mechanism [unv]. | Opens with a counter-intuitive demo or question ("most people think…") [unv]. Videos run about 20 min [unv]. | Male, conversational, medium pace, first person [unv]. | Sparse, cinematic bed. Often silent during demos [unv]. |
| **Simplicissimus** (DE, since 2015, about 2.5 M subscribers, team of 32 [5]) | Flat 2D vector art, muted palette with one accent, faceless simplified figures. Headlines and screenshots are cut out on a paper texture as evidence [unv]. | Parallax push-ins, map zooms, cut-out reveals [unv]. | Thesis or provocation within 10 s. Videos run 5–10 min [6]. | The founders narrate themselves and stay anonymous; a professional narrator only for some videos [6]. Calm, slightly ironic, German. | Low ambient bed under the whole video [unv]. |
| **Kurzgesagt** | Vector art in Illustrator, animated in After Effects. 2D flat plus 3D elements, "quirky, relatable" characters, saturated colour on dark backgrounds [7]. | Continuous camera through one illustrated world, morph transitions [unv]. | Script goes through about a dozen drafts [7]. Cosmic-scale hook [unv]. | Steve Taylor narrates every video: male, measured, warm [7]. | Custom score for each video by Epic Mountain (Munich) [7][8] and dense SFX. Music plays under the narration, which is entertainment-first and the opposite of our rule. |
| **Johnny Harris** | Maps made with GEOlayers in After Effects and Google Earth Studio [9]. Textured, grainy maps with marker callouts, mixed with archival material and the host on camera [unv]. | Fast map flights, mask reveals, hand-drawn circles. | Personal question as the hook ("I went to…") and fast cutting. He is criticised for oversimplification and factual errors [10], which is a warning for our fact gate. | Male, first person, excited [unv]. | Score by Tom Fox [10], fairly continuous [unv]. |
| **3Blue1Brown** | Manim [11]. Community reconstructions give a dark background `#1C1C1C`, blue `#58C4DD` and yellow; these are not official. | Continuous transformation of one object, almost no hard cuts inside a derivation [unv]. | Opens with a puzzle, then a slow build [unv]. | Grant Sanderson: male, calm, curious, slower pace [unv]. | Vincent Rubinetti composes; music is mostly at intros and chapter breaks [11] (placement [unv]). |
| **TED-Ed** | No house style. Each lesson is made by a different independent animator or studio from an educator's script [12]. Lessons run 3–10 min [12]. | Varies by animator. | Scenario or riddle hook [unv]. | Varies, professional voice actors [unv]. | Continuous score [unv]. |
| **Zack D. Films** (vertical) | Outsourced 3D shorts, reportedly made in Blender/UE5 [13]. Macro close-ups of the body or objects [unv]. | Fast, continuous camera, no text clutter [unv]. | A curiosity-gap line in the first second, 30–60 s total [13][unv]. | TTS-like male voice [unv]. | Music plus heavy SFX [unv]. |
| **Hank Green-style edu-TikTok** | Face to camera, green-screen of the paper or screenshot being discussed, burnt-in captions [unv]. | Jump cuts every 1–3 s [unv]. | Claim in the first sentence, one idea per clip [unv]. | Fast, high register [unv]. | Little or no music [unv]. |

### Derek Muller's research on misconceptions

His PhD was at the University of Sydney (2008), titled "Designing Effective Multimedia for Physics Education" [4]. Muller, Bewes, Sharma and Reimann (2008, JCAL 24(2):144–155) randomly assigned **364** first-year physics students to four multimedia versions [1]:

- The **refutation** version (states the misconception, then refutes it) gave an effect size of **0.79** over plain exposition.
- The **dialogue** version (student and tutor) gave **0.83**.
- Students with low prior knowledge gained the most, and students with high prior knowledge were not harmed [1].

Students rated the clear expository video as clear but learned little from it. In the misconception-based condition, post-test scores roughly doubled, even though students called that version "confusing" [3]. The mechanism is that misconceptions create a "false sense of knowing" that lowers effort, and exposing them helps "even in non-interactive settings" [2].

**Consequence for us:** never optimise for "felt clear". The beat structure for every video:

1. Hook: state the misconception in its plausible form ("Die meisten denken…").
2. Tap to predict.
3. Show the conflicting evidence.
4. Explicit refutation: "Das stimmt nicht, weil…"
5. Give the correct model.
6. Transfer question.

For the dialogue format: a two-voice "Schüler/Tutor" version is worth an A/B test for the brother's content.

## 2. Three visual identities for 9:16 (one DESIGN.md each)

HyperFrames reads `frame.md`, `design.md` or `DESIGN.md` from the project root, and its frontmatter values are binding (local: `.claude/skills/hyperframes/references/look.md`). So create `studio/_identities/{atlas,editorial,diagramm}/DESIGN.md` and have `compose.py` copy the right one into each project. All three keep the brand palette and fonts from CLAUDE.md.

**A. "Atlas" (documentary and illustrated)**
- **Channels:** Geopolitik & Geschichte, morning briefing, Wirtschaft stories.
- **Base:** navy `#0E1726` ground, map land in cream `#F5F0E8`, gold `#C9A84C` for the one subject of the sentence, red `#E07A5F` only for conflict or loss. Film grain at about 3%.
- **Maps:** Natural Earth (public domain [20]) through d3-geo SVG.
- **Archival images:** duotone navy/cream, each with a source and date tag.
- **Callouts:** marker circles and arrows.
- **Camera:** slow push-ins (2–4% scale per beat) and map flights between places.
- **Borrowed from Simplicissimus and Harris:** headline cut-outs as on-screen evidence.

**B. "Editorial" (kinetic type)**
- **Channels:** Rhetorik & Charisma, Philosophie, Bücher, Disziplin, Style.
- **Base:** cream ground with ink and gold.
- **Type:** big Playfair headlines, word-level emphasis timed to the word timestamps, quote cards with attribution.
- **Motion:** one held sentence with a rolling slot word.
- **Starting point:** the `cartesian` preset already uses Playfair Display plus Inter and documents a 9:16 layout (local FRAME.md, lines 140–249). Adapt its hairline grid and rings to our palette.

**C. "Diagramm" (science, after 3Blue1Brown)**
- **Channels:** Naturwissenschaft, Mathe and Wirtschaft models for the school-transfer videos.
- **Tools:** navy ground, Manim plus SVG.
- **Motion rule:** no hard cut inside a derivation; one object transforms.
- **Fixed colour meaning:** gold is the quantity of interest, cream is what is given, red is the misconception.
- **Misconception split:** "Irrtum | Modell" as a split screen with a before/after wipe.

**Rules for all three in 9:16:**
- Content stays between y = 168 and 1330, captions below that.
- The hook appears as text and voice together within 1.5 s.
- At most about 7 words per line, body text at 48 px or larger.
- A visual change every 2–4 s, but only when it carries content.
- In the live HTML player, a **prediction freeze**: the timeline pauses on the question card until the viewer taps. This is the pretest inside the video.
- Most feeds autoplay muted, so the captions must carry the content.

## 3. Illustrations without decorative clutter

- **Gate:** every visual node in `script.py` gets a `zeigt:` field naming the sentence or word it illustrates. QA rejects any image that is not linked to a sentence.
- **Icons:** Phosphor (MIT), Lucide (ISC) or Tabler (MIT), through Iconify. Pick one set for consistent stroke weight. These licences are well known; I did not re-check them for this report.
- **Characters:** Open Peeps is CC0 [23]. Humaaans' licence is disputed between sources [23]; check before use. **Avoid unDraw**: its licence reportedly forbids programmatic embedding and aggregation [23], which is exactly what our pipeline does.
- **Archival:** Wikimedia Commons, where each file has its own licence. Bundesarchiv images there are **CC BY-SA 3.0 DE**, which requires attribution and share-alike [21]. Library of Congress and Smithsonian Open Access (CC0) also work. Always show the credit on screen.
- **AI images**, only for illustrated scenes with a locked style prompt. Never use them for real people or as news evidence, and label them "Illustration":
  - **Local:** FLUX.2 [klein] 4B is Apache 2.0 and needs about 13 GB VRAM [17]. It fits on Linus' RTX 5070 Ti overnight at near-zero marginal cost. The 9B variant is non-commercial [17].
  - **Recraft V4.1 Vector** (real SVG output): $0.08 per image, Pro tier $0.30 [18].
  - **Nano Banana 2.1:** about $0.034 per 1K image, half that in batch [19] (third-party figure).
  - **Daily cost at 15 videos × 6 images:** about $3 with Nano Banana, about $7 with Recraft vector, about $0 locally.
  - mflux, the media-use skill's local FLUX path, is MLX, i.e. Apple Silicon only, so it does not apply in our Linux container [unv].

## 4. Sound

**Evidence:**
- Moreno & Mayer (2000): adding music and sounds to a narrated animation led to "far worse" retention and transfer [14].
- Amato (2026, single author, 13 reports): music raised engagement strongly (g = 1.06). The memory cost appeared only on tests that compete with concurrent narration (g = −0.46) and was near zero otherwise (−0.13). The author's summary is "placement, not avoidance" [15]. This is a weak but recent source.

**Policy:**
- **Music only** in the 0–1.5 s hook or ident, in transitions of 2 s or less, during prediction freezes and think pauses, and in the outro.
- **No music under narration** by default. A bed ducked to −30 dB or lower can run only as an A/B experiment on Atlas, measured by 7-day retention.
- **SFX only on visible actions** (signalling): pop when a number lands, whoosh on a cut, marker scratch on a circle, tick on a map pin. Each hit sits 3–6 dB above the bed and peaks one frame after the picture. Rotate 2–3 takes. No synthesised chimes (local `hyperframes/references/sound.md`).
- **Sourcing:** Openverse, CC0 or CC BY only, with a CREDITS.md. If Openverse is offline, use the 21 bundled sounds (local `media-use/audio/references/sfx.md`).
- **Loudness:** −16 to −14 LUFS, true peak −1 dBTP or lower.
- **Voice target** (the actual fix for "Stimme kacke"): a calm, warm, conversational register like Taylor or Sanderson. The voice is the clock for everything else.

## 5. Inspiration tools

| Tool | Verdict |
|---|---|
| **UXKIN** (`claude plugin marketplace add uxkin/agent && claude plugin install uxkin@uxkin`) | The skills `design-md`, `no-ui-slop`, `ui-from-screenshot` are free. Searching the 15k+ website design systems with DESIGN.md needs a paid plan, and it has no video or motion coverage [16]. **Install for the PWA UI; minor value for video.** |
| **`npx hyperframes capture <url> --json`** | Free. Writes `tokens.json`, `design-styles.json` and screenshots; a run that writes `BLOCKED.md` failed. Use it to pull tokens from editorial graphics sites. **Use instead of design-mirror.** |
| **Frame presets** (13) | These are slide-deck looks. `cartesian` matches our fonts and documents 9:16; `cobalt-grid`, `editorial-forest` and `broadside` are useful references only. |
| **Registry blocks** (448 in total) | **Maps (8):** world-map (D3 Natural Earth with globe inset), north-korea-locked-down (zoom with red scribble), nyc-paris-flight, spain-map, us-* (no Europe or Germany block, so we need to build one). **Charts (6):** chart-story, mk-line-graph, bar-chart-race, decline-chart, data-chart. **Title (1):** weight-wave. **Also useful:** hw-callout-circle, hw-arrow, marker-highlight, mk-callout-highlight, count-up, number-wheel, grain-overlay, comparison-split / before-after-wipe (Irrtum vs Modell), kinetic-type-swap, caption-editorial-emphasis, focus-rack. **Skip** the roughly 40 WebGPU shader blocks: decorative and slow to render. |
| **Bright Data design-mirror** | Needs `BRIGHTDATA_API_KEY` plus a paid Unlocker zone, and only covers website to codebase (local SKILL.md). Duplicates `capture`. **Skip.** |
| **Style from reference videos** | Built in: `snapshot --against ref.mp4` (look.md). Third-party skills: reference-to-motion (contact sheets, colour and grain sampling, style guide; Remotion), cth9191/animate (measures palette, line weight, cut rhythm), claude-style-motion-skill (writes style.json, uses fal.ai) [22]. **Better:** a one-off ffmpeg scene-detect plus contact sheet per reference, with the grammar written into DESIGN.md. |

**Legal limits:** copy the grammar (shot length, palette roles, type scale), never the content. That means no Kurzgesagt birds, no Simplicissimus figures, no logos (the Veritasium logo is a registered trademark [4]) and no music. Do not commit downloaded YouTube frames to the repo.

## Sources (accessed 2026-10-26 unless a date is given)

[1] https://ixdf.org/literature/author/j-bewes (DOI 10.1111/j.1365-2729.2007.00248.x)
[2] https://openjournals.library.sydney.edu.au/IISME/article/view/6345 (2012-10-08)
[3] https://thejournal.com/articles/2015/05/05/watching-videos-does-not-necessarily-lead-to-learning.aspx (2015-05-05)
[4] https://en.wikipedia.org/wiki/Derek_Muller
[5] https://de.wikipedia.org/wiki/Simplicissimus_(YouTube-Kanal)
[6] https://www.youtube.com/post/UgzO4nOF5K3sHWdCdwp4AaABCQ ; https://www.tincon.org/speaker/simplicissimus
[7] https://kurzgesagt.org/youtube/
[8] https://epicmountainmusic.bandcamp.com/
[9] https://aescripts.com/learn/making-maps-for-johnny-harris---volcanoes/ ; https://www.premiumbeat.com/blog/making-maps-for-johnny-harris/
[10] https://en.wikipedia.org/wiki/Johnny_Harris_(journalist)
[11] https://www.3blue1brown.com/faq/ ; https://www.3blue1brown.com/about
[12] https://www.ofcom.org.uk/siteassets/resources/documents/tv-radio-and-on-demand/broadcast-guidance/psb/psb3/10._ted-ed.pdf (2014) ; https://www.animafest.hr/en/2016/side_event_pro/read/ted_ed_where_education_meets_animation_gerta_xhelo (2016)
[13] https://linkedin.com/company/animasterstudio ; https://www.twine.net/N8ladd (self-reported)
[14] https://tecfa.unige.ch/tecfa/teaching/methodo/Moreno_Mayer00.pdf (2000)
[15] https://culturaesaude.med.br/en/background-music-increases-viewer-engagement-a-systematic-review-and-meta-analysis/ (2026-08-01)
[16] https://github.com/uxkin/agent
[17] https://huggingface.co/black-forest-labs/FLUX.2-klein-4B ; https://bfl.ai/blog/flux2-klein-towards-interactive-visual-intelligence
[18] https://openrouter.ai/recraft/recraft-v4.1-vector ; https://techpilot.ai/tools/recraft/ (2026-10-07)
[19] https://benchlm.ai/media-pricing/nano-banana
[20] https://www.naturalearthdata.com/about/terms-of-use/
[21] https://commons.wikimedia.org/wiki/Commons:Bundesarchiv
[22] https://github.com/nicolleadduci/reference-to-motion ; https://github.com/cth9191/animate ; https://github.com/ArtimindStudio/claude-style-motion-skill
[23] https://allsvgicons.com/cc0-illustrations/ ; https://toolfolio.io/productive-value/free-open-source-illustrations-library ; https://rigorousthemes.com/blog/best-humaaans-alternatives/

Local files used:
- `/home/user/Deeptok/.claude/skills/hyperframes/references/look.md`
- `/home/user/Deeptok/.claude/skills/hyperframes/references/sound.md`
- `/home/user/Deeptok/.claude/skills/media-use/audio/references/sfx.md`
- `/home/user/Deeptok/.claude/skills/hyperframes/assets/frame-presets/cartesian/FRAME.md`
- Catalog output from `npx hyperframes catalog --json`, run in `/home/user/Deeptok/studio/probe-opportunitaetskosten`