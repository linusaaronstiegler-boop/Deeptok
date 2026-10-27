# DeepTok video factory: template-first proposal

**Core idea:** design work is done once, in the scene library. The nightly runs only fill it in. Opus designs the scene types, the three looks and the series plans in interactive sessions, never inside the nightly run. At night, a Python script runs the stages. Sonnet and Haiku write a ~3 KB JSON spec per video, and fixed templates turn that spec into HyperFrames scenes that play live in the app. Nothing in the nightly loop sets pixels, seconds or GSAP code, apart from one capped exception.

## 1. Architecture

```
22:07 evergreen / 04:15 news + school transfer (Europe/Berlin)
└ scheduled task, cheapest model allowed (Haiku 5.5, else Sonnet 5.5 low)
  runs factory/nightly.py in the background (≤2 h chunks, resumable)
  INPUTS: news APIs · "Vorlernen morgen" priming digest · series plans + backlog queue · in-app ratings + 7-day recall
  1 slate      Opus 5.5            → slate.json (briefs, look, series part)
  2 spec       Sonnet 5.5          → spec.json (VideoSpec, structured output)  ┐ Batches API,
  3 lint       code + Haiku 5.5                                                │ cached prefixes
  4 factcheck  Sonnet 5.5 + web search, separate context                       ┘
  5 voice      TTS API per scene → mastering → word alignment → ASR Hör-Check
  6 compose    library modules → index.html + compositions/
  7 checks     hyperframes check --json · DOM timing probe · snapshot --review
  8 critic     Sonnet 5.5 vision on a contact sheet → ≤2 repairs as spec patches
  OUTPUT: content/videos/<id>/{index.html, voice.m4a, timing.json, spec.json}
          + prediction card + 0–2 FSRS quiz items → report.json → preview branch → Vercel
```

The priming digest is read as input only. Lint blocks Vault names, mails and grades from reaching any spec.

## 2. Roles and models

| Role | Model, effort | Frequency |
|---|---|---|
| Library architect: scene types, looks, banned-pattern list, weekly sample review | Opus 5.5 high (xhigh for a new look) | Interactive, weekly, never 6–13 Nov |
| Series plan: 6–8 parts, one running example, misconceptions, recall goals | Opus 5.5 medium | Once per series |
| Editor: nightly slate | Opus 5.5 medium | Once per night |
| Spec writer: script, scenes, retrieval items | Sonnet 5.5 medium | Per video |
| Researcher (news only, ≤5 searches) | Sonnet 5.5 low | Per news item |
| Fact-checker | Sonnet 5.5 medium + web; disputed claims go to Opus 5.5 low | Per video |
| Pedagogy lint, pronunciation respellings | Haiku 5.5 low | Per video |
| Custom scene (≤1 per video, ≤20% of videos) | Sonnet 5.5 medium, tool loop with `check` | Rare |
| Visual critic | Sonnet 5.5 low (Opus 5.5 low for chart-heavy videos) | Per video |

Fable stays out of the nightly loop. The orchestrator is code, because multi-agent supervision costs about 15× the tokens.

## 3. Scene library and spec

- **One module per scene type:** `(params, cues, stage) → DOM + GSAP timeline`. Each module ships with a Zod schema, fixed layout slots (hero, top, bottom, split), a character limit per slot, a demo spec and a reference snapshot.
- **One module, two uses:** it plays live in the app and is written into HyperFrames HTML at build time (copy, substitute, unique ids). HyperFrames runtime variables are not used because they broke when a scene was mounted twice.
- **Core types, version 1 (8):** hook-number, hook-portrait, prediction-chips with reveal, misconception-strike, term-definition, fork/comparison-split, chart-line/function-plot (SVG; Manim only via `engine:"manim"`), quote-card ("Satz fürs Gespräch").
- **Version 2:** map-route, timeline, process-steps, unit-viz, briefing-card, archival-photo.
- **Version 3:** character-beat (a one-time CC0 SVG rig), equation-build, rhetoric-device.
- **Three layers that stop the slideshow feel:**
  - **stage:** one world per video, a plane three screens wide and three tall. The camera travels across it, and each scene is a place on it.
  - **actors:** objects survive cuts via GSAP Flip, so the "45 Mio." chip actually flies from Barcelona to Munich.
  - **captions:** switched off automatically when the scene already prints the sentence.
- **Timing comes from `{cue}` markers** in the narration, resolved from word timestamps.
- **The templates enforce:**
  - an element appears on the word that names it, in the back half of the scene;
  - at most 19 words per scene;
  - 3–5 transition types per look, each caused by something on screen, with at most a third hard cuts;
  - every visual has a `zeigt:` link to a sentence.
- **Escape hatch:** `type:"custom"` lets Sonnet write GSAP inside the stage rules. If the same custom need shows up 3 times in a week, Opus turns it into a library type.

## 4. Visual identity

Keep the CLAUDE.md palette and fonts, but change the medium: the current "navy void plus cream serif" look is on HyperFrames' banned-pattern list. Each look gets a DESIGN.md with numeric values:

- **Atlas** (Geopolitik & Geschichte, morning briefing, economy stories): printed-map look.
  - Natural Earth maps through d3-geo; gold for the subject of the sentence, red only for loss.
  - 3% paper grain.
  - Cut-out headlines as on-screen evidence, each with source and date (Simplicissimus grammar).
  - Camera push of 2–4% per beat, plus map flights.
- **Editorial** (Rhetorik, Philosophie, Bücher, Disziplin, Style): cream paper, ink plus gold, type treated as an object, word-level emphasis.
- **Diagramm** (Naturwissenschaft, Mathe, school-transfer economics): one object transforms with no cut inside a derivation. Fixed colour meaning: gold is the quantity of interest, cream is what is given, red is the misconception.

**Reference distillation, once, in week 1:** run ffmpeg scene detection on 2–3 Simplicissimus and Veritasium sequences and make contact sheets (never committed). Write the measured median shot length, title timings and map-move durations into DESIGN.md as numbers, not adjectives.

**Hero tier, at most 1 video in 5:** keyed FLUX.2 [klein] 4B stills made on the RTX PC, or duotone archival images, animated in code layers.

## 5. Voice (the biggest single lever)

- **Blind casting on 27–28 Oct.** Same 270-character test script, 2 takes per voice:
  - ElevenLabs v4 Turbo with Johannes, Helmut and Christian Plasa
  - Inworld TTS-2
  - Cartesia Sonic 3.6
  - Azure Florian DragonHD
  - Chirp 3 HD as the free baseline
- **Scoring:** Linus and his brother rate blind; word error rate and correct names are measured.
- **Excluded:** Gemini TTS, because Google's terms forbid apps likely used by under-18s.
- **Decision rule:**
  - Pick Inworld TTS-2 if it is within one rating point of the winner. It costs about $10–25 a month, gives word timestamps, and its terms show no ban on apps for minors (its use policy is not yet checked).
  - Otherwise pick ElevenLabs v4 Turbo, but only after ElevenLabs approves under-18 use in writing. Email them on 27 Oct.
- **Production:**
  - Synthesise per scene, passing `previous_text`, so the intonation no longer restarts every sentence.
  - Pronunciation: a global lexicon, a German number normaliser, and `Anzeige|Gesprochen` respellings.
  - Mastering: 80 Hz high-pass, de-esser, 2:1 compression, loudnorm −16 LUFS / −1 dBTP, AAC m4a.
  - No music under narration.

## 6. Quality gates (cheapest first, all automatic)

| Gate | What it checks |
|---|---|
| G0 | Zod schema, every cue exists, slot character limits |
| G1 (code) | Banned words; every fact has source and date; every number on screen appears in `facts[]`; prediction before reveal; for the brother, example before rule and a misconception scene; 30–90 s estimated from word count |
| G2 | Haiku pedagogy check |
| G3 | Fact-check. News with an unresolved claim is never published |
| G4 | Word error rate under 5% after number normalisation; every name correct; loudness; no silence over 1.2 s |
| G5 | `check --json` with 0 errors |
| G6 (DOM) | Element within ±150 ms of its cue; reading time; picture changes at least every 3 s; content between y = 168 and 1330 |
| G7 | Critic on a 6-frame sheet at 540×960 plus the spec: JSON rubric 0–1, pass at 0.8 or higher |

On top of that: reference snapshots per scene type in CI, a weekly Playwright-WebKit smoke test, and Linus rating 1 video in 10 in the app.

## 7. Time and cost per 60 s video (estimates)

- **API time:** about 3–4 min.
- **CPU:** about 2.2 min (TTS 15 s, ASR 23 s, check 27 s, snapshot 28 s, DOM probe about 15 s). No MP4.
- **Wall time:** about 4–5 min per video per lane with overlap, against about 25 min for the free-form probe.
- **Tokens:** Opus about 2k in and 1k out (amortised); Sonnet about 60k in (60% cached) and 9k out; Haiku about 6k.
- **Money:**
  - About $0.15–0.25 per video with Batch and caching.
  - About $70–110 a month at 15 videos a day.
  - The 300-video backlog costs about $50–75 once.
  - Voice adds $10–30 a month.

## 8. Capacity

- **Container:** about 110 videos in a 4-hour window with one lane, about 150 with two.
  - At most 2 Chrome jobs at once, `--workers 2` each, never `auto`.
  - MP4 only when a video is shared: draft quality, `--workers 3`.
- **Actual load:** 15 videos a day use about 35 min of CPU. The backlog is limited by budget, not CPU: at 40 a night, 300 videos take about 8 nights.
- **RTX PC (optional):** a `jobs/gpu/` queue picked up by a Windows scheduled task, for hero stills, NVENC MP4s and a local backup voice. It is never on the critical path.

## 9. Pro test week and downgrade

- **Where the money comes from:** model calls go through the Anthropic API, paid from the $100 monthly API credits that come with Max 5x.
- **Verify on 27 Oct:**
  - the credits are claimed;
  - the API key is stored as a cloud secret;
  - `api.anthropic.com` is reachable from the cloud container.
- **Subscription meter:** it should only see the scheduled task that starts the script, a few thousand tokens a night, well under 5% of the weekly quota.
- **Calibration nights 2–4 Nov:** read claude.ai/settings/usage before and after each night, and take $ per video from the Console.
- **6–13 Nov:**
  - no Opus build sessions;
  - the factory runs hands-off;
  - `nightly.py` has a hard cap of $4 a night and sets the video count from that budget.
- **Decision on 16 Nov:**
  - If measured API spend is above about $80 a month, stay on Max 5x. Otherwise switch to Pro and pay for the API.
  - If no API is available at all, run the same stages as a Claude Code workflow on Sonnet low, at about 5 videos a night, and build the backlog before the downgrade.

## 10. Failure handling

- **Stages are idempotent and content-hashed**, so a rerun skips finished work.
- **API specifics:**
  - Batch results are keyed by `custom_id`; errored or expired requests are resubmitted.
  - Every call checks for `stop_reason:"refusal"`, with `fallbacks:"default"` turned on.
- **When a gate fails:**
  1. Up to 2 repair rounds as spec patches, each given the exact finding.
  2. One escalation to Opus.
  3. Then the `needs-human/` queue. The feed slot still gets the spec's prediction and quiz cards.
- **Voice outage:** primary provider, then secondary, then Chirp (news only, flagged).
- **News deadline 06:15:** whatever is not finished ships as a text briefing card.
- **Library changes:** each video pins its `lib` version, so changes cannot break published videos.

## 11. Rollout, 27 Oct – 9 Nov

- **27–28 Oct:**
  - API credits, keys and secrets;
  - voice casting and the ElevenLabs email;
  - fix the Hör-Check PyAV crash by decoding with ffmpeg;
  - mastering chain.
- **28–31 Oct (Opus high):**
  - Editorial and Diagramm DESIGN.md, reference distillation, banned-pattern list;
  - the three layers and the 8 core types;
  - vendored player: pinned 0.8.206, local GSAP, woff2 fonts, `runtime-src`.
  - Rebuild the probe as a spec, and Linus approves stills next to the old version.
- **31 Oct–2 Nov:** `nightly.py`, gates G0–G7, batching, `report.json`, 3 videos run by hand.
- **2–4 Nov:**
  - calibration nights, 10 videos each;
  - real iPhone and iPad test: audio unlock on swipe, drift over a 90 s video, frame-rate throttling;
  - Atlas look, map-route and briefing-card, and the 04:15 news lane.
- **5 Nov:** freeze library v1.
- **6–9 Nov:** hands-off production of 10–15 videos a night. Findings wait for the Opus review on 14 Nov.

## 12. Top 5 risks

1. **The templates still look the same ("slideshow 2.0").**
   - Stage, actors and caused transitions are built into every template.
   - Variety rules: no scene type twice in a row, rotating transitions.
   - The banned-pattern list keeps growing, Opus reviews a sample weekly, and the hero tier adds variety.
2. **Voice terms of service** (ElevenLabs approval for minors, Gemini ban). `voice.py` stays provider-independent, and the casting picks two finalists.
3. **iOS live playback** (audio on swipe, drift, throttling, fonts, frequent player releases).
   - Same-origin serving and a pinned, vendored player.
   - One tap at session start to unlock audio.
   - Fallback 1: an audio-as-clock player that drives the same modules. Fallback 2: MP4 for devices that fail.
4. **Factual errors at volume.**
   - `facts[]` is mandatory, the checker runs in a separate context, and numbers on screen must match `facts[]`.
   - News never ships with an unresolved claim; a correction is a spec version bump.
5. **Unverified cost and quota assumptions** (whether the credits cover this, how cache reads are metered, the network allowlist).
   - Verify on day 1 and run the calibration nights.
   - Hard nightly cap plus a Console spend limit.
   - Workflow fallback if there is no API.