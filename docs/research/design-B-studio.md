# DeepTok video factory: Quality-first studio (proposal, 26 Oct 2026)

**Thesis.** The wow factor comes from three things:
1. **A director** who designs script and picture together.
2. **A kit** that turns the Simplicissimus and Veritasium film grammar into numbers.
3. **Bespoke hero scenes**, built only where the library runs out.

Everything else is deterministic code. The "supervisor" is a Python script, not an Opus agent reading transcripts. Research puts multi-agent setups at about 15× the tokens of a single chat.

## 1. Architecture

```
INPUTS: news RSS (05:00) · priming digest (brother's subjects tomorrow) · evergreen series queue
 → SLATE      Opus 5.5 medium, 1 call/night → briefs.json (channel, series/part, profile)
 → RESEARCH   Sonnet 5.5 low + ≤5 web searches (news only) → fact sheet with sources and dates
 → DIRECTOR   Opus 5.5 high (Batch) → VideoSpec JSON: narration with {cue}s, scene types + params,
              cinematography contract, ≤2 bespoke briefs, 0–2 retrieval items
 → FACTCHECK  Sonnet 5.5 medium, fresh context → pass / fix list / block
 → LINT       regex + Haiku 5.5 low
 → VOICE      TTS per scene → mastering → faster-whisper alignment + Hör-Check → timing.json
 → BUILD   ┬─ compose v2: library scenes instantiated at build time
           └─ ANIMATOR  Sonnet 5.5 medium (Agent SDK tool loop): bespoke scenes
 → GATES      check --json → DOM metrics → snapshot --review → VISION CRITIC ↺ ≤2 rounds
 → PUBLISH    cards/<id>/{index.html, voice.m4a, assets, card.json}
```

- **Output card.** `card.json` holds the quiz and FSRS items, the sources, and the prediction freeze. The freeze uses `range-end` and shows native answer cards outside the iframe.
- **Playback.** Videos play live in a pinned, vendored `<hyperframes-player>`. MP4 is rendered only when someone shares a video.
- **Launcher.** A scheduled task (Sonnet 5.5 low) runs `factory/nightly.py` and commits `report.json` to the preview branch.
- **Billing.** All model calls go through the `anthropic` SDK and are paid from the Max 5x API credit ($100/month), not from Claude Code quota.

## 2. Roles and models

| Role | Model / effort |
|---|---|
| Slate | Opus 5.5 medium, once a night |
| Director, evergreen | Opus 5.5 high, Batch. Script and storyboard in one context. |
| Director, news | Sonnet 5.5 medium, library scenes only |
| Fact-checker | Sonnet 5.5 medium; disputed claims go to Opus 5.5 medium |
| Animator | Sonnet 5.5 medium. Caps: 6 tool iterations, 40k output tokens, 15 min |
| Lexicon proposals, lint | Haiku 5.5 low |
| Vision critic | Sonnet 5.5 low; Opus 5.5 low for chart-heavy videos. Sees final frames only. |
| Kit author | Opus 5.5 xhigh in interactive Claude Code, before 6 Nov only |
| Weekly review | Opus 5.5 medium via API, on a 10% sample |

Fable 5.1 is not used.

**Parallelise across videos, not across scenes.** In the HyperFrames film notes, five scenes took 9 min in one context against 21 min split across subagents. So two animator lanes run while the CPU lane voices and checks the next video.

## 3. Voice

**Blind casting by 1 Nov.**
- Same 20 s Lewandowski script, 2 takes per candidate.
- Candidates: ElevenLabs v4 Turbo (voices Johannes, Helmut, Christian Plasa), Inworld TTS-2, Cartesia Sonic 3.6, Azure Florian DragonHD.
- Linus and his brother rate blind; word error rate and name hits are scored automatically.
- Gemini is excluded because its terms bar services likely used by under-18s.

**Decision rules.**
- **Inworld TTS-2 is the default.** German is a Tier-1 language, it returns word timestamps, I found no clause against minors, and it costs about $25/month.
- **ElevenLabs v4 replaces it only if** it wins clearly *and* ElevenLabs approves the brother's use in writing. Until then it is used only for Linus-only hero videos.
- One narrator for all channels, as a brand voice in the register of Taylor or Sanderson.
- A second voice for an A/B test of a student/tutor dialogue format. Muller measured an effect size of 0.83 for dialogue.

**Pipeline.**
- Synthesize per scene, passing the previous text for continuity.
- Mastering: high-pass at 80 Hz, de-ess, 2:1 compression, loudnorm to −16 LUFS and −1 dBTP.
- Word times come from the provider and are verified with faster-whisper. The current PyAV crash is fixed by decoding with ffmpeg first.
- Pronunciation: a shared lexicon plus the `Anzeige|Gesprochen` respellings. Haiku proposes new entries from the ASR diff.
- A character-budget check before each night prevents a repeat of the 21–23 Oct credit outage. Fallback chain: Inworld, then Azure.

## 4. Visual identity

**Define the look as rules of a medium, not as "navy void".** The current navy-void and cream-serif look matches two items on HyperFrames' BANNED list. Three DESIGN.md identities, all on the brand palette:
- **Atlas-Druck** (geopolitics, economy, briefing): cream paper with 3% grain, navy ink linework, gold for the one subject, red only for loss or error.
- **Editorial** (rhetoric, philosophy, books): kinetic type.
- **Diagramm** (science, school transfer): navy ground with chalk lines; one object transforms, no hard cuts inside a derivation.

**Every scene is a place** (a map, a desk, a diagram world), never empty space with floating elements.

**Cinematography contract, written by the Director per video:**
- One large world canvas and one camera path.
- One persistent actor that changes role, e.g. the money chip becomes a bar, then a map token.
- 3–5 transition kinds, each caused by something on screen. At most ⅓ hard cuts, never fade-out then fade-in.

**Kit constants (numbers instead of adjectives):**

| Constant | Value |
|---|---|
| Display type | 9% of frame height, −2% tracking |
| Entrances | 18–24 frames, `power3.out` |
| Hold after landing | ≥ 1.2 s |
| Camera push | 2–4% scale per beat |
| Visual change | every 2–4 s |
| Line length | ≤ 7 words |
| Body text | ≥ 48 px |
| Reveal timing | on the named word, in the back half of the scene |

**Text.** On screen go objects, numbers and keywords, never the narrated sentence. Captions sit in a band below y = 1330.

**Reference distillation, done once.**
- Take 2–3 Simplicissimus and Veritasium sequences.
- Run ffmpeg scene-detect and make contact sheets.
- Write shot lengths, title behaviour and map moves into the kit as constants.
- Commit no frames to the repo.

**Illustration tier:**
- Open Peeps (CC0) as SVG character rigs.
- Natural Earth maps through d3-geo.
- Duotone archival images from Wikimedia or the Library of Congress, each with credit and date.
- FLUX.2 klein 4B stills (Apache 2.0) rendered on the RTX PC, keyed out on magenta and animated in code layers, labelled "Illustration".

## 5. Scene library and bespoke scenes

**Kit.** 12 core modules first, 23 eventually: hook-number, prediction-chips, reveal-answer, misconception-strike, term-definition, fork, comparison-split, timeline-bar, chart-line, function-plot (SVG), map-route, quote-card.
- Each module is `(params, cues, actors) → DOM + GSAP`, with a JSON schema, text limits per layout slot, and a reference snapshot.
- Shared layers: stage (camera and grain), actors (carried across cuts with GSAP Flip), captions.
- The same module runs live in the app and in HyperFrames.
- Instances are created at build time, because HyperFrames runtime variables broke in testing.

**Bespoke scenes.**
- At most 2 per evergreen video, in about 40% of evergreen videos.
- The Director's brief gives: the on-screen copy quoted exactly, the focal point, the entry and exit actor, the cue words, and a list of things to avoid.
- The Animator implements the same module interface, so it gets the stage, actor and caption layers for free.
- Its loop: write → `check --json` → 3 stills at cue times → fix.
- If a cap is hit, the scene falls back to the nearest library type.

**Graduation.** The weekly review promotes bespoke scenes with a critic score of 0.9 or more into the library. The share of bespoke work, and its cost, falls over time.

## 6. Quality gates (cheapest first)

- **G0, spec:**
  - Schema valid, every `{cue}` exists, text fits its slot.
  - Prediction comes before the reveal.
  - For the brother: example before rule, and a misconception scene is present.
  - No banned words; quiz distractors of similar length.
- **G1, facts:** every `facts[]` entry has a source and date, and every number on screen matches a fact. News with an unresolved fact is never published.
- **G2, audio:** word error rate under 5% after number normalisation, all names correct, loudness in range, no silence over 1.2 s.
- **G3, render:**
  - `hyperframes check` with 0 errors.
  - DOM checks: content between y = 168 and 1330, font ≥ 34 px, each element within ±150 ms of its cue, enough reading time, no stretch over 3 s without change.
- **G4, vision critic:**
  - Input: a 9-frame beat sheet at 540×960 plus the spec.
  - JSON rubric scored 0–1: legibility, picture matches the spoken word, one focal point, is each cut caused by an object, ghost text and clutter.
  - Pass threshold 0.8. Notes as P0/P1 lines in the form "t · where · problem → change".
  - At most 2 repair rounds.
- **G5, Safari:** Playwright WebKit smoke test: player reaches ready, plays, and pauses at `range-end`.
- **G6, human sample:** Linus rates about 1 in 10 videos in the app, choosing a reason from a menu. His ratings extend the BANNED list and recalibrate the critic.

## 7. Time, usage and capacity (estimates)

**Per 60 s video:**
- CPU: about 130 s for alignment, check and snapshot. A draft MP4 adds about 64 s.
- Agent wall time: about 5 min for a library-only video, 15–20 min with a hero scene.
- The Batch stages finish within about 1 h for the whole slate.

**API cost per video, including 30% retries:**

| Video type | Cost |
|---|---|
| News | about $0.30 |
| Evergreen, library only | about $0.25 |
| Evergreen with hero scene | about $0.65 (the Animator is about $0.28 of that) |

**Monthly totals:**
- 10 videos a day (3 news, 2 hero): about $105/month, which uses up the API credit.
- 15 a day with 4 heroes: about $165/month.
- A backlog of 300 at 30% heroes: about $110 once.
- TTS is extra, about $25/month.

**Capacity on the 4-vCPU container** (`--workers 3`, at most 2 Chrome jobs at once):
- The CPU alone could handle about 110 videos in 4 h. Two animator lanes add about 8 hero scenes per hour.
- A normal night: 12–15 videos from 22:07 to about 00:40.
- Backlog nights: about 50 videos, limited by budget rather than CPU.
- News run at 05:07, ready by about 05:45.

**RTX PC (optional):**
- FLUX stills are requested a night ahead: `illus_requests.json` → PC → committed as WebP.
- Share MP4s rendered with `--gpu`.
- Chatterbox as an emergency voice.
- Nothing time-critical depends on the PC.

## 8. Pro test week and downgrade

- **Quota use.** The factory touches subscription quota only through 2 short launcher sessions a night. Estimated at 5% or less of weekly quota for the whole week [unverified]; calibrate on 3 nights before 6 Nov.
- **Kit timing.** All Opus kit work happens 27 Oct–5 Nov, and the kit is frozen during the test week.
- **Zero-quota option.** A GitHub Actions cron could run the same script [check the repo's Actions minutes].
- **Downgrade math.** This design spends about $100–165/month on the API.
  - Max costs $100 including the $100 API credit.
  - Pro costs $20 plus all API spend.
  - Max is cheaper once API spend passes about $80/month.
  - **So stay on Max 5x** unless the factory is cut to 8 or fewer library-only videos a day.

## 9. Failure handling

- **Idempotent stages.** Each stage writes its output with a content hash, so a rerun resumes. If one session cannot stay up for about 2.5 h, split the night into a 22:07 and a 00:07 task.
- **Refusals and batches.** Handle `stop_reason: refusal` with `fallbacks: "default"`. Key batch results by `custom_id` and resubmit expired requests.
- **Gate failure escalation:**
  1. Up to 2 repairs, each given the exact finding.
  2. One escalation from Sonnet to Opus.
  3. The "needs human" queue; the feed shows a quiz or comparison card instead.
- **Budget guard.** $5 of API per night, plus a character budget per voice provider.
- **Morning report.** `report.json` with a Haiku summary.

## 10. Rollout (first 2 weeks)

- **27–28 Oct:** claim the API credit, store the key as a secret, test the network (api.anthropic.com and the TTS hosts), fix the Hör-Check crash, set `--workers 3`, render the casting takes.
- **29 Oct–1 Nov:**
  - Kit v1 with Opus xhigh: 3 DESIGN.md identities, BANNED list, motion preamble, transitions, reference constants, 8 core modules, stage and actor layers.
  - Remake the probe from a spec as the golden reference.
  - Voice decision, and the email to ElevenLabs.
- **2–5 Nov:**
  - `nightly.py`, the gates and the Animator loop.
  - 3 calibration nights to measure dollars and quota %.
  - Self-hosted fonts and runtime; iPhone audio-unlock and drift test; the PC FLUX script.
- **6–13 Nov:** fully automatic, ramping from 6 to 12 videos a night; Linus only rates. Midpoint report on 9 Nov.

## 11. Top 5 risks

1. **Bespoke cost or time explodes** (one Vox-style piece took 5.5 h). Mitigation: hard caps on the Animator, library fallback, the nightly budget guard, and graduation of good bespoke scenes into the library.
2. **It still looks like slides or generic AI video.** Mitigation: the cinematography contract, the critic's "is each cut caused by an object" item, the distilled reference constants, and a BANNED list that grows from Linus' reasons.
3. **Voice terms or credits fail.** ElevenLabs and Google restrict use by under-18s, and ElevenLabs credits ran out in October. Mitigation: Inworld as default, the provider fallback chain, the budget check before each night.
4. **Live playback on iOS breaks.** Risks are audio unlock on swipe, picture and voice drifting apart, missing fonts, and frame-rate throttling. Mitigation: a real-device test before 6 Nov, serving everything from the same origin, a vendored and pinned player, and as fallbacks an own player that uses the audio as the clock, or MP4.
5. **Wrong facts said with confidence.** Mitigation: a fact-checker in a separate context, the gate that matches every on-screen number to a sourced fact, no news without a source, and Opus for disputed claims.