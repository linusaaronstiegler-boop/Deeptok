# Production throughput and rendering for DeepTok (2026-10-26)

## TL;DR
- **No MP4 needed for in-app playback.** The probe plays live in `<hyperframes-player>` 0.8.206 with no network access. A video is 5 to 10 times smaller than its MP4. Render MP4 only when someone shares a video.
- **CPU is not the bottleneck.** A 60 s video takes about 2.2 min of CPU without MP4. A 4-hour window fits about 110 videos in one lane, or about 150 in two. The binding limits are agent time and weekly quota.
- **Use templates.** Build one HTML template per scene type and fill it from JSON at build time. Do not use HyperFrames runtime variables for this; they broke in my test (see section 5).
- **Two problems in the current setup.** `--workers auto` picks 1 worker on this machine, which nearly doubles render time. The Hör-Check crashes with the installed PyAV version.

## 1. Measured stage times (this container, probe 53.3 s = 1,599 frames)

I ran everything on a copy in the scratchpad; the repo is unchanged.

| Stage | Wall time | Notes |
|---|---|---|
| Piper TTS, 19 sentences | **32 s** | about 0.6× real time |
| Manim `-q h`, 4.9 s clip at 1080p60 | **16.5 s** | |
| `compose.py` | 0.04 s | |
| `hyperframes check` | **27 s** | |
| `snapshot --review` | **28 s** | 18 beats, 7 seams, phone sheet |
| faster-whisper `small` int8 (Hör-Check) | **20.5 s** | only with the workaround in section 6 |
| Render, draft quality, workers auto | 104 s | auto chose **1 worker** plus 15 s calibration |
| Render, draft, `--workers 2` / `3` / `4` | 68 s / **57 s** / 60 s | |
| Render, looks quality (CRF 16), auto / `--workers 4` | 127 s / **76 s** | |
| 2 draft renders in parallel, `--workers 2` each | 96.6 s for both | **1.4×** the throughput of running them one after another |

- Every render also has a fixed audio stage of about 10.5 s.
- MP4 sizes: draft 3.5 MB, looks 5.2 MB.
- Each Chrome worker uses about 256 MB of RAM (`preview-render.md`).
- Quality presets: draft is CRF 28 ultrafast; looks is CRF 16, the default (`render --help`).

## 2. Render flags that matter (from the local references and `--help`)

- **Workers:** set `--workers 3` explicitly. `auto` resolves to 1 on this 4-vCPU box. The docs claim 4 workers is usually best, but 3 was fastest here.
- **Quality:** `--quality draft|looks|delivery`, or `--crf` / `--video-bitrate`. `--format hls` gives streaming segments.
- **`--low-memory-mode`** turns on automatically at ≤8 GB RAM, so not here.
- **`--experimental-fast-capture`** (about 2× faster) only engages on macOS with a hardware GPU, so it is off here.
- **`--gpu`** (NVENC encoding) and `--browser-gpu` would apply on Linus' PC. I did not measure the speedup there.
- **Batch:** `render --batch rows.json --batch-concurrency 1 --strict-variables --json` writes a `manifest.json`.
  - Variables can never change the root `data-duration`, and batch rows set only the root's variables (`format.md`, `compare-and-batch.md`).
  - So batch only fits **fixed-length formats**, for example a 20 s "Zahl des Tages".
- **Cloud options:**
  - HeyGen cloud: pay per credit, 200 MB upload limit, and `--asset-id` re-renders without re-uploading (`cloud.md`).
  - AWS Lambda: needs AWS, SAM and bun (`lambda.md`). Cloud Run: needs GCP.
  - None is worth it for 20 or fewer MP4s per day.

## 3. Can DeepTok skip MP4 for in-app playback? Yes, with five fixes

**What I verified** (headless Chromium, no external network):
- The probe in `<hyperframes-player>` reached `ready` in **0.45 s** from localhost.
- Playback advanced normally (3.8 s after 4 s).
- The frame at 12 s matches the rendered MP4.
- There were **0 external requests** once I self-hosted GSAP and pointed the undocumented `runtime-src` attribute at a local runtime file. I found the attribute in the bundle; it only accepts same-origin or localhost URLs.
- Without that, the player loads the runtime from jsDelivr ([README](https://hyperframes.heygen.com/packages/player), fetched 2026-10-26).

**Sizes:**
- One-time, cached by the service worker (all gzipped, measured): player 31 KB, runtime 191 KB (599 KB raw), GSAP 28 KB, plus fonts.
- Per video: HTML 7 KB, voice 566 KB at 86 kbps (about 210 KB at 32 kbps, my estimate), Manim clip 152 KB. That is **0.4–0.7 MB versus 3.5–5.2 MB for the MP4**.
- iOS Home-Screen web apps get "up to 60% of the total disk space" per origin ([WebKit, 2023-08-10](https://webkit.org/blog/14403/updates-to-storage-policy/)).
- They also "have their own counter of days of use", so Safari's 7-day storage wipe does not apply to them ([WebKit, 2020-03-24](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)).

**Question pause:** use `range-end` at the question, show the native answer cards outside the iframe, then play again from `range-start`. Both stop on an exact frame (README in the npm tarball).

**What has to be fixed:**
1. **Fonts.** The renderer bundles Inter and Playfair Display (`format.md`), so the compositions have no `@font-face`. iPhones do not ship these fonts (my inference; not tested on a device), so live playback needs self-hosted woff2 files. My container test hides the problem because Inter is installed system-wide here.
2. **Audio and the swipe gesture.** The player copies timed `<audio>` into the parent frame so that `play()` runs inside the user's tap. A scroll-snap swipe is not necessarily a gesture. Planned approach: one tap at session start, then reuse the unlocked element. That reuse is [unverified on iOS 26]; the only evidence is anecdotal ([atomisystems forum](https://talk.atomisystems.com/t/ipad-sound-issue-when-changing-scenes/2310)).
3. **Clock drift.** The README says audio and the GSAP timeline "free-run — no active sync needed". If iOS stalls the audio, picture and voice can drift. `docs/PLAN.md`'s own-player idea (audio as the clock) is more robust here. Test 90 s videos on a real device.
4. **Throttling.** iOS throttles `requestAnimationFrame` to about 30 fps in cross-origin iframes and in Low Power Mode ([popmotion 2018](https://popmotion.io/blog/20180104-when-ios-throttles-requestanimationframe), [motion.dev 2020](https://motion.dev/blog/when-browsers-throttle-requestanimationframe)). Serving compositions from the same origin avoids the first case. Whether either still applies today is [unverified].
5. **No Safari check in the pipeline.** `check` and `snapshot` only run Chromium. Add a WebKit smoke test with Playwright WebKit; I have not tried installing it here.

**Version churn:** the player has had 537 npm versions since 2026-04-10, 106 of them in October 2026. Pin an exact version and vendor the files.

## 4. Alternatives for live playback

| | How it plays | JS size (gzipped) | MP4 rendering | Fit for DeepTok |
|---|---|---|---|---|
| HyperFrames player | Web component, iframe | 31 + 191 + 28 KB | Local, 57–76 s per 53 s video | Already in use; HTML/GSAP, which agents write well |
| Remotion Player | React, same document | 110 KB ([bundlephobia](https://bundlephobia.com/package/@remotion/player@4.0.539)) plus React | Lambda compute for a 1-min video: **$0.017** ([cost example](https://www.remotion.dev/docs/lambda/cost-example)) | Means rewriting everything in React |
| Motion Canvas | `<motion-canvas-player>`, canvas | core 43 KB | none | Dormant; Revideo fork 0.11.0 has only a React player |
| Own GSAP player (`docs/PLAN.md`) | Audio as the clock | about 30 KB [estimate] | none | Loses `check` and `snapshot` unless the same templates also run in HyperFrames |

- **Remotion's licence** is free "for individuals and companies of up to 3 people"; companies above that pay $0.01 per render with a $100/month minimum ([remotion.pro](https://www.remotion.pro/license), fetched 2026-10-26).
- **Remotion's mobile audio** is handled: pre-mounted shared audio tags, and passing the tap event to `play()` ([docs](https://www.remotion.dev/docs/player/autoplay)).
- **Remotion's in-browser renderer** `@remotion/web-renderer` is an experimental alpha and needs Safari 26 or later ([docs](https://www.remotion.dev/docs/web-renderer/)).
- **Motion Canvas:** its last release, 3.17.2, was published 2025-02-16 (npm). It is called "abandoned" on [HN](https://news.ycombinator.com/item?id=47191103). The Revideo fork released 0.11.0 on 2026-07-10 (npm).

**Verdict:** stay with HyperFrames and fix the five points above. Keep the own player as a fallback if iOS sync fails.

## 5. Templates filled by JSON versus free-form HTML per video

**Free-form (the probe):**
- 72 KB of hand-authored code: 49 KB of scene HTML plus 22.5 KB of `compose.py`.
- Roughly 20k output tokens [estimate], plus reading 108 KB of HyperFrames skill references.
- About **25 min of agent wall time**, judging by file timestamps (project created 22:40, rendered 23:06).

**Templates:**
- One-time work: 10–12 scene types × 3–5 KB (40–60 KB), plus a generalised `compose.py`.
- Example scene types: number hook, question cards, comparison, timeline, map, chart, misconception→refutation, "Satz fürs Gespräch".
- Per video: a 3–4 KB JSON spec, about **1k output tokens**. The script alone is 1.8 KB today.
- That is roughly **15–20× fewer output tokens**, and an estimated 3–6 min of agent time per video.
- Deterministic layouts mean fewer repair loops. The runtime exposes a `fitTextFontSize` helper that could prevent text overflow; I have not tested what it does.
- Live payload shrinks too: shared templates are cached once, and each video adds only its own `index.html` and audio.

**Runtime variables broke in my test.** I mounted the same `<template>` scene file twice, each with its own `data-variable-values`:
- Every mount showed the values of the one host whose id equalled the scene's root id. Mounts with other ids showed the defaults.
- This happened in both the player and the CLI snapshot.
- Fix: **instantiate at build time.** The compose step copies the template, substitutes the values and gives each copy a unique id. HyperFrames batch stays for fixed-length news cards only.

**Quality split:** daily news 100% templates. Evergreen series about 90% templates plus at most one bespoke "hero" scene, written by Opus.

## 6. Nightly capacity and what to parallelise

**Per 60 s video** (probe times scaled ×1.13): TTS 36 s, one Manim clip 17 s, check 27 s, snapshot 28 s, ASR 23 s. Total **about 130 s without MP4**. Adding MP4 costs about 64 s (draft, 3 workers) or about 86 s (looks, 4 workers).

| 4 h window (14,400 s) | No MP4 | With draft MP4 |
|---|---|---|
| 1 lane | about 110 | about 74 |
| 2 lanes (×1.4, from the parallel render test) | about 150 | about 100 |
| 90 s videos, 1 lane | about 70 | about 50 |

The 2-lane row assumes the whole pipeline scales like the render test did; I only measured parallel renders. **10–20 videos a day need 20–45 min of CPU. A backlog of 300 needs about 3 nights.** What actually limits throughput is agent time per video: about 25 min free-form versus an estimated 3–6 min with templates.

**What to parallelise:**
1. Overlap the agent and the CPU: the agent writes video N+1 while video N's TTS, check and snapshot run in the background.
2. Within one video, run TTS alongside Manim, and `check` alongside `snapshot`. I have not measured that pairing.
3. Run at most 2 Chrome-heavy jobs at once, each with `--workers 2`. Never use `auto` here.
4. Draw charts as SVG/GSAP templates instead of Manim where possible. That saves about 17 s per clip and gives crisper output in the live player.

**Hör-Check bug:** with PyAV 19.0.2 and faster-whisper 1.2.1, `decode_audio` throws `TypeError: … 'metadata_errors'` for both `.m4a` and `.wav`.
- Workaround: decode with `ffmpeg -ar 16000 -f s16le` and pass a float32 numpy array. That gave the 20.5 s in the table.
- `npx hyperframes transcribe` (whisper.cpp or Parakeet, word timestamps) could replace both this check and the proportional word timing. I have not tried it.

Test files are in /tmp/claude-0/-home-user-Deeptok/1c35efe9-205d-5858-bd54-e9b1dc5eaddd/scratchpad/ (`bench/`, `live/`, `scripts/`).