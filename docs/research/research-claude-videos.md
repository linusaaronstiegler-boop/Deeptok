# How the most impressive Claude-made explainer videos are produced (state of 26 Oct 2026)

## 1. Landscape

- **HyperFrames** (HeyGen, Apache-2.0, 73.0k stars as of 2026-10-26, https://github.com/heygen-com/hyperframes): you write HTML and GSAP, and it renders deterministically in headless Chrome. It covers GSAP, Three.js, Lottie and Anime.js, and has a `<hyperframes-player>` web component for live playback. Its official prompting guide sets the order: storyboard, then build, then edit, then `check`, then render (https://hyperframes.heygen.com/llms.txt, accessed 2026-10-26). The locally installed skill (v0.8.206) holds the most concrete craft rules I found anywhere: `/home/user/Deeptok/.claude/skills/hyperframes/references/{motion,spec,story,review,film}.md` and `types/explainer.md`.
- **Remotion and Claude Code**: installed with `npx skills add remotion-dev/skills`. It includes skills for markup, captions and maps (CesiumJS) (https://www.remotion.dev/docs/ai/skills). It went viral around January 2026; the reported "6M views in 48 h" is [unverified]. The founder posted a beginner guide on 2026-01-26 (https://x.com/JNYBGR/status/2015708193167479209). The prompt tips that recur are: "every element enters with `spring({damping:200})`, no linear motion", clamp `interpolate()`, and give `<Sequence from>` offsets (https://www.sabrina.dev/p/5-insane-claude-code-video-prompts, undated).
- **Claude Motion** (2026-10-08): Claude writes code instead of using a video model. You call it with `/motion` and export MP4. It is a beta for **Team and Enterprise only** and the framework is not named (https://claude.com/resources/articles/dashboards-and-motion, 2026-10-08). That means it is not available on Max or Pro, and I found no API for overnight automation [unverified]. Anthropic's own advice: animate the one chart that matters, not every bullet (https://www.eesel.ai/blog/claude-motion, 2026-10-08).
- **Manim with an LLM** (research):
  - TheoremExplainAgent splits a planner from a coder and retries up to 5 times. Its layout score is only 0.59 (https://arxiv.org/pdf/2502.19400, Feb 2025).
  - Code2Video uses three agents: Planner, Coder and Critic. The Critic places elements on a **6×6 grid of anchor points**, which scored 65.6 for aesthetics against 54.7 without anchors. Repairs escalate from the error line to the block to the whole section. Sections are built in parallel: 15.4 min against 86.6 min sequential. With Claude Opus 4.1 it took 13.8 min and 43.1K tokens per topic and scored 86.0 on TeachQuiz, against 97.1 for 3Blue1Brown (https://arxiv.org/html/2510.01174, 2025-10-01).
  - ALGOGEN has the LLM output a JSON trace, which **fixed templates** then render. That reached 99.8% success against 82.5% for end-to-end code (https://arxiv.org/abs/2605.12159, 2026-05-12).
  - SGA checks layout geometrically without rendering. Raters preferred it over the raw baseline 84.4% of the time and over a VLM critic 65.0% of the time (https://arxiv.org/abs/2607.18116, 2026-07-20).
  - LLM2Manim used templates and a symbol ledger. With n=100 students it scored 83% against 78% for slides, d=0.67 (https://arxiv.org/abs/2604.05266, 2026-04-07).
- **Showcases**:
  - *I'm Upping My P(doom)*: Opus 5.5 with p5.js and p5.brush in a watercolour look. Opus wrote its own storyboard and a guide for subagents, then built **9 chapter files in parallel**. No image model was used (https://github.com/JohnHeibel/PDoomVideo, undated). The pipeline became the ClaudeAnimationBase starter kit, where higher reasoning effort produced more elaborate scenes (https://github.com/JohnHeibel/ClaudeAnimationBase, undated).
  - The HyperFrames capstone film. Two builds passed `check` but "felt like a slideshow". A "cinematography contract" in the prompt fixed it: one unbroken camera move and a persistent "wire" element that becomes a chart baseline, a map arc, a waveform and a 3D coil (https://hyperframes.heygen.com/prompting/capstone.md, accessed 2026-10-26).

## 2. Techniques that separate "wow" from generic

1. **Numbers instead of adjectives.** "Replacing every adjective with a number" was the single biggest gain in one practitioner's write-up (https://dev.to/arqamwd/how-i-make-motion-videos-with-claude-opus-55-the-full-setup-prompts-and-numbers-2g09, 2026-10-26). The HyperFrames `spec.md` table does the same thing: "modern" becomes a 30-frame push on one ease plus a display face at 9% of frame height and −2% tracking. Quote the on-screen copy exactly, because unquoted copy gets paraphrased (https://hyperframes.heygen.com/prompting/overview.md).
2. **Ban the defaults by name.** HyperFrames lists "BANNED by default": a dark navy void with floating elements, glow and particles, a cream paper ground with a serif display, everything fading and sliding up, three cards in a row. The list grows after every render. **DeepTok's current navy, cream and Playfair look matches two of these items** (`spec.md` §BANNED). The fix is to define the look as the rules of one medium, for example riso: paper, ink A, ink B (`look.md`, `spec.md`).
3. **Plan the storyboard before the frames.** Fix a message, an arc, an audience and a mood. Then a direction block every frame inherits: two-colour discipline, reveals paced to the voiceover, holds that stay still, exactly one breather, and a negative list. Each frame gets a type, a focal point, roles, and a callback motif (https://hyperframes.heygen.com/prompting/design-systems.md). Approve the plan as **rendered stills** before anything moves (`storyboard.md`; the animate skill does the same with story, look and storyboard check-ins, https://github.com/cth9191/animate).
4. **Explainer devices** (`types/explainer.md`):
   - Start from a situation the viewer already knows.
   - Make the object itself the explanation.
   - Grow one diagram, adding a part each time it is named.
   - Morph each step out of the last.
   - Carry one worked example through every step.
   - For misconceptions, use the "myth turned over" shape: the wrong idea struck through, the right one printed over it. This matches Muller's thesis behind Veritasium, that videos which confront misconceptions beat clear lectures (https://downes.ca/post/58505/rd; secondary source).
5. **The voice is the clock.** Text-to-speech reads about 2.2 words per second, so keep a scene to about 19 words. Reveal each element when it is named, in the back half of the scene. Never stretch motion to fill audio (`film.md`).
6. **Motion grammar** (https://hyperframes.heygen.com/prompting/motion.md):
   - Land, then hold.
   - Overlap entrances instead of queuing them.
   - One idea per move.
   - Overshoot only physical objects, never numbers.
   - Get depth from speed: slower background layers, plus one blurred foreground object.
   - Camera moves must travel somewhere.
7. **Transitions with a cause.** Use 3–5 kinds per film, each caused by something on screen: zoom through an object, an object that becomes the world, a morph, a colour flood. At most a third of seams should be hard cuts. Never fade out and then fade in. "It feels like slides" is fixed by entering the next scene through an on-screen object (`motion.md`).
8. **Reference matching.** Transcribe the reference frame by frame, correct toward **absolute** targets (relative nudges oscillate), then distil the converged constants back into the prompt. Text-only prompting reached roughly 90%; the distilled prompt gets 80–90% of converged quality on a fresh build (https://hyperframes.heygen.com/prompting/recreating-references.md). `snapshot --against ref.mp4` puts your frames next to the reference (`look.md`). Simplicissimus is a 32-person team producing "aufwendig produzierte Videoessays" (https://de.wikipedia.org/wiki/Simplicissimus_(YouTube-Kanal), 2026-08-27), so match its *grammar* (shot lengths, title behaviour, maps), not its manual effort.
9. **Review that measures first, then looks.**
   - `check` warns on `line_unread`, `dead_stretch` (more than 3 s with no change), `text_below_floor` and `first_frame_empty`.
   - `snapshot --review` produces sheets for beats, for ±0.2 s around every cut, and a 360 px phone sheet.
   - Notes take the form "t · where · problem → exact change", ranked P0/P1. "Never score the film out of 10." A fresh-eyes subagent sees only the storyboard and the sheets (`review.md`).
   - Counterexample: the DEV author does score a 7-criterion rubric until every item reaches 8+.
   - Errors that only show in the rendered frames need parallel reviewer agents on overlapping stretches of about 40 s (https://github.com/JohnHeibel/ClaudeAnimationBase/issues/9, 2026-10-14).
10. **3D and illustration.** For real depth use Three.js through the adapter, because CSS perspective reads flat. Use one hero object and fly into it ("one dive is worth ten turns"), with a warm key and a cool rim (`types/3d.md`). Illustration is code's weak spot. The hybrid approach generates still art with an image model on a magenta background with "lots of negative space", keys it out with ffmpeg `colorkey`, and animates in code layers on top (https://hyperframes.heygen.com/prompting/color-grading.md).

## 3. Speed tricks (with numbers)

- **Subagents per scene are slower for short films.** Five scenes took about 9 min in one context against about 21 min split across subagents. Beyond six scenes, give each worker 2–3 scenes and start them all at once (`film.md`). Code2Video and P(doom) benefit from parallelism because they are long.
- **Templates and variables.** Author once, declare typed variables, and render once per data row; `--strict-variables` catches typos (https://hyperframes.heygen.com/prompting/design-systems.md). The registry has about 450 blocks. A JSON spec rendered through templates is the most reliable route in the research (ALGOGEN, above).
- **Stills and contact sheets before full renders**, with `--quality draft` for review renders (https://hyperframes.heygen.com/guides/performance.md). One run's model time was only about 99.5 s of an 8:56 session, for a 12 s clip at $1.00 API price (https://www.wireflow.ai/blog/claude-motion-graphics, 2026-10-14).
- **Render cost is in CSS.** One CSS declaration took the same render from 25.0 s to 9.8 s. Large `blur`/`backdrop-filter` layers and oversized images are expensive (performance.md). Software GL in a CPU-only container is slow for heavy WebGL; ClaudeAnimationBase measures seconds per frame for its watercolour fills without a GPU.
- **Fonts are cached** in `~/.cache/hyperframes/fonts` (`format.md`). Lambda and Cloud Run render in parallel chunks (`hyperframes-cli/references/lambda.md`).
- **Bespoke "wow" work is expensive.** One Vox-style piece took 5 h 28 min and about $90 at API prices. A watercolour short took 163 model calls and about 7 h. The best one-prompt briefs ran 9.5–19k characters (DEV post above, figures [unverified]). The same post says `/fast` costs $8/$40 per million tokens against $4/$20 standard [unverified].
- **Model split.** I found no public data on Opus supervising Sonnet for video [unverified]. The practice I did find is effort tiers: medium for fixes, xhigh for new pieces (DEV).

## 4. Ranked: 10 techniques DeepTok should adopt

1. **Build a series kit once, with Opus at high effort, and reuse it everywhere.** The kit is a `frame.md` and spec with numeric tokens, a motion preamble, a palette of 3–5 transitions, and a growing BANNED list. Redesign the look as the rules of one medium, because navy void plus cream serif is on the banned list.
2. **Generate JSON specs, not free code.** Sonnet or Haiku fills a per-video JSON scene spec. Fixed parametric scene templates render it: myth turned over, number that lands, one diagram that grows, before/after, map route, worked example. Bespoke code is the exception. This is the only route compatible with 10–20 videos a day and the quota limits.
3. **Explainer devices as template types.** Every video starts from a known situation, has an object that is the explanation, and ends on one idea in one line. The misconception card comes first for the brother.
4. **The voice is the clock.** At most about 19 words per scene, reveals on the named word in the back half of the scene. Keep the existing `timing.json` mechanism.
5. **One continuous world.** A persistent element carries across scenes, and each transition is caused by something on screen. This is the cinematography contract from the capstone film, written into the template.
6. **Numbers instead of adjectives in every prompt and spec.** Absolute targets only.
7. **Gate in order:** `check` metrics and deterministic overlap checks, then `snapshot --review` sheets, then one fresh-eyes subagent writing P0/P1 notes. At most 2 fix rounds; P0s are fixed automatically and remaining P1s are logged.
8. **Distil references once.** Transcribe 2–3 Simplicissimus or Veritasium sequences (shot length, title behaviour, map moves) into constants in the kit, never per video.
9. **Throughput hygiene:**
   - Play in the app through `<hyperframes-player>`; render MP4 only for sharing, in draft quality for review.
   - Approve with stills first.
   - Parallelize across videos, not across scenes.
   - Avoid blur and glass effects.
10. **A hero visual tier for about 1 in 5 videos:** a hybrid illustration (keyed image-model stills animated in code layers), a baked map, or a Three.js dive, ideally rendered overnight on the RTX 5070 Ti because the cloud container has no GPU [inference].