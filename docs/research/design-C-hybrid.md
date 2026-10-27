# DeepTok video factory: hybrid by tier

## 0. Core idea
All videos share one scene library and are built in three tiers:
- **L (library, about 85%):** a JSON spec rendered through fixed scene modules.
- **L+ (about 12%):** a library video plus one bespoke scene.
- **H (hero, 2 per week):** studio-style, built by Opus.

Heroes invent new visual vocabulary. Whatever works there gets promoted into the library, so the cheap tier improves every week.

Orchestration is **Python code calling the Claude API**, paid from the $100/month API credits that come with Max 5x. Linus suggested an Opus supervisor running Sonnet agents; I'm not proposing that, because multi-agent setups use about 15× the tokens of a chat. Opus only decides where taste matters.

## 1. Architecture in words
```
INPUTS  news (tagesschau-API, Dlf, DW, BBC, Guardian, GDELT)
        priming digest "Vorlernen morgen" (only subject, key idea and priming questions; no names, no grades)
        evergreen queue topics/<channel>/<series>.yaml
        feedback: FSRS forgetting stats + Linus' reason-menu ratings
   │
SLATE (Opus): N briefs, each with tier, channel, identity and series
   │
LANE per video: script → fact-check → spec.json → lint → voice (per scene) → align
   → compose (template instances made at build time) → hyperframes check → DOM gates
   → contact sheet → critic → publish to public/cards/<id>/ {index.html, voice.m4a, timing.json, quiz.json, lib@x.y}
   │
HERO LOOP: storyboard stills → bespoke scenes → fresh-eyes review → publish → PROMOTE into library/
```
Repo pieces:
- `factory/nightly.py`: the orchestrator. Every stage writes a file with a content hash, so a rerun skips finished stages.
- `library/scenes/<type>.js`: a pure module, `(params, cues, actors) → DOM + GSAP timeline`. Each has a JSON schema, text limits per slot, a demo spec and a reference snapshot. The same module runs in the app player and in the HyperFrames export.
- `library/identities/*/DESIGN.md`: one per visual identity (section 5).
- `lexicon.json`: the shared pronunciation list.

## 2. Roles and models
| Role | Model / effort | Mode | Tokens in/out per video |
|---|---|---|---|
| Orchestrator | none (Python) | – | – |
| Scheduled-task wrapper (starts the script, reads `report.json`, commits) | Sonnet 5.5 low | Claude Code task | about 30k per night |
| Editor-in-chief: slate and tier choice | Opus 5.5 medium | 1 call per night | 3k / 0.7k |
| News researcher | Sonnet 5.5 low + at most 5 web searches | standard calls | 25k / 2k |
| Script plus beat outline (scene types, `{cue}` marks) | Opus 5.5 medium | Batch | 12k (8k cached) / 3k |
| Fact-checker, separate context | Sonnet 5.5 medium; disputed claims go to Opus | Batch + web search | 10k / 1.5k |
| Spec filler (params) | Sonnet 5.5 low, structured outputs | Batch | 15k (10k cached) / 4k |
| Lint and pronunciation | regex + Haiku 5.5 low | Batch | 6k / 0.8k |
| Bespoke scene (L+) | Sonnet 5.5 medium, tool loop with `check` | Agent SDK | about 150k mostly cached / 10k |
| Visual critic | Sonnet 5.5 low; Opus low for chart-heavy videos | standard calls | 2 × 7k / 0.8k |
| Hero director | Opus 5.5 high (xhigh for a new device) | Agent SDK on the API | about 2M mostly cached / 40k |
| Promoter / weekly reviewer | Opus 5.5 high / low | Agent SDK / 1 call | – |

Fable 5.1 is not used: as scriptwriter it would add about $0.20 per video with no clear gain.

## 3. Data flow
- **22:07, evergreen and transfer videos:**
  - The slate is built first.
  - Scripts, fact-checks, specs and lint each run as one batch across all videos.
  - The CPU lane starts on each video as soon as its spec arrives.
  - Critic and repair rounds use standard calls so they finish by about 02:30.
- **04:15, news** (the time `PLAN.md` already uses): standard calls, 3–5 briefing cards, done by about 05:15.
- **What each video produces:**
  - A live-playable card with the prediction built in (`pause_for_answer`): the player stops at `range-end` and native answer chips appear.
  - 0–2 FSRS retrieval items.
  - A sibling quiz card.
- **MP4** only on a share request, in draft quality.

## 4. Voice (the biggest single lever)
**Casting, finished by 1 Nov.** The same 20 s test script, blind, 2 takes per voice:
- ElevenLabs v4 Turbo with three voices from Linus' library ("Johannes Dokumentarfilm", "Helmut", "Christian Plasa")
- Inworld TTS-2
- Cartesia Sonic 3.6
- Azure Florian DragonHD
- Chirp 3 HD as the free baseline

Scoring: blind ratings from both brothers, plus faster-whisper word error rate and correct names.

**Decision rule:**
- If Inworld scores within 0.5 points of ElevenLabs on a 5-point scale, Inworld becomes the default for everything. It costs about $25/month, gives word timestamps, and I found no clause against apps used by under-18s.
- If ElevenLabs is clearly better, use it now for Linus' channels and the heroes. Use it for the brother's content only after ElevenLabs gives written approval, which its terms require for apps aimed at under-18s.
- Google voices (Gemini, and probably Chirp) are out for the brother's content because of the same kind of under-18 clause. This changes the Chirp default in `PLAN.md`.
- Fallback is Azure DragonHD. Piper is retired.

**How synthesis works:**
- Synthesize per scene, passing `previous_text` where the provider supports it.
- Word times come from the provider's alignment, otherwise from faster-whisper (with the PyAV workaround: decode through ffmpeg into a float32 array).
- Master with ffmpeg to −16 LUFS, true peak −1 dBTP, 48 kHz.
- One narrator per series.
- No music under narration. Short sound effects only on visible actions; music only in idents of 1.5 s or less and during prediction freezes.

## 5. Visual identity: how to reach Veritasium or Simplicissimus level
**Escape the banned defaults.** The HyperFrames skill bans "navy void with floating elements" and "cream paper with a serif display", and the probe matches both. The palette stays, but each identity becomes the rules of one printed medium:
- **Atlas** (Geopolitik, briefings, Wirtschaft stories), a printed atlas:
  - Navy is printed ink, not a void; land is cream with a halftone edge.
  - Gold marks the subject of the sentence; red only conflict or loss.
  - 3% grain, a 2–4% push-in per beat, map flights between places.
  - Headline cut-outs as evidence, each with source and date.
- **Editorial** (Rhetorik, Philosophie, Bücher, Disziplin, Style), a broadsheet:
  - Cream newsprint, navy ink, gold as a second ink offset by 2 px.
  - Playfair at 9% of frame height with −2% tracking, a rolling slot word, quote cards.
- **Diagramm** (Wissenschaft and the maths/physics transfer videos), a plotter:
  - Navy ground with the 6×6 anchor grid visible at 6% opacity.
  - Cream strokes draw themselves in; gold is the quantity of interest.
  - No hard cut inside a derivation.

**Every video has three layers:**
- **Stage:** one world with a camera.
- **Actors:** objects that survive cuts through match cuts (GSAP Flip).
- **Captions:** switched off automatically when the scene already prints the sentence.

**Transitions:** 3–5 kinds per identity, each caused by something on screen. At most a third of seams are hard cuts, and never fade-out then fade-in.

**What we take from each reference:**
- **Veritasium is the structure, and the schema enforces it:** misconception hook → tap to predict → conflicting evidence → "Das stimmt nicht, weil…" → correct model → transfer.
- **Simplicissimus is the grammar:**
  - Distil 2–3 reference sequences once (ffmpeg scene-detect plus contact sheets, frames not committed) into constants: shot length, push-in %, title behaviour, map moves.
  - For characters, one faceless SVG rig (Open Peeps, CC0) is built in a hero and then promoted into the library.

Every spec value is a number, not an adjective. The BANNED list grows from the critic's notes.

## 6. Library, bespoke scenes and promotion
**Core 8 types first:** hook (number or portrait), prediction-chips, reveal-answer, misconception-strike, term-definition, fork-decision, comparison-split, quote-card and chart (line and bar).

**Then:**
- timeline
- map-route: d3-geo with Natural Earth, plus a Europe/Germany block, which the registry lacks
- process-steps
- function-plot as SVG; Manim only for hard maths
- equation-build with KaTeX
- briefing-card, rhetoric-device, unit-viz, archival-photo, character-beat

Start from registry blocks: world-map, chart-story, count-up, before-after-wipe, hw-callout-circle, marker-highlight. Templates are instantiated at build time, because HyperFrames runtime variables broke in testing. The model never writes pixels or seconds, only slot contents and cue names.

**Promotion rule.** A bespoke scene is promoted when all three hold:
- the critic scores it 0.85 or higher
- Linus has not rated it negatively
- the slate expects to reuse it for at least 3 topics

Opus then generalizes it into a module with a schema and 2 demo specs with different content. Both must pass the gates, and a reference snapshot is added. The library version is bumped, and every card pins `lib@x.y`, so old cards never break. Target: 1–2 new types per week, so the L+ share keeps falling.

## 7. Quality gates (cheapest first)
1. **Schema:**
   - Text limits per slot, every cue exists, numbers on screen match the narration.
   - The prediction comes before the reveal.
   - For the brother: example before rule, and a misconception scene is present.
   - Distractors are about the same length.
2. **Lint:**
   - Blocklist: praise, „natürlich“, „offensichtlich“, „Leichtsinnsfehler“, mindset phrases.
   - Every fact has a source and a date.
   - At most 19 words per scene, 30–90 s in total.
3. **Fact-check:** news with an unresolved claim is never published.
4. **Audio:**
   - Word error rate under 5% after number normalization, all names correct.
   - −16 ±1 LUFS, no unplanned silence over 1.2 s.
5. **`hyperframes check --json`:** 0 errors.
6. **DOM measurements:**
   - Each element appears within ±150 ms of its cue.
   - Font at least 34 px; text stays up for its reading time.
   - The picture changes at least every 3 s.
7. **Critic:**
   - A 6-frame sheet at 540×960 and a 0–1 rubric. The rubric includes "slideshow?", which fails if no actor survives a cut.
   - Threshold 0.8, at most 2 repair rounds.
8. **Library changes only:** regression snapshots and a Playwright WebKit smoke test.
9. **Human sample:** Linus rates 1 in 10 videos through a reason menu.

## 8. Wall time and cost
| Tier | Model time | CPU (60 s video) | API cost |
|---|---|---|---|
| L | 3–6 min (each batch stage can queue up to about 1 h) | about 130 s; draft MP4 +64 s | about $0.25 |
| L+ | +10–15 min | +30 s | about $0.50 |
| H | 60–120 min | 5–10 min | $3–6, capped at $8, plus $1–2 for promotion |

**Monthly:**
- **Lean** (6 L + 1 L+ per day, 1 hero per week): about $80.
- **Target** (12 L + 3 L+ per day, 2 heroes per week): about $180.
- **Backlog of 300 videos:** about $80 once, spread over nights at 10 extra per night.
- **Voice:** $25–99 per month on top, depending on the provider.

## 9. Capacity
**Cloud container (4 vCPU, no GPU):**
- About 110 videos in a 4 h window with one lane, about 150 with two lanes (two Chrome jobs at `--workers 2` each).
- A single render uses `--workers 3`, never `auto`, which picks 1 worker here.
- 15 videos a day need about 35 min of CPU. The real limits are batch latency and budget.

**RTX PC (optional, never on the critical path):**
- Illustrated stills for heroes with FLUX.2 [klein] 4B: Apache 2.0, about 13 GB VRAM, magenta background keyed out, animated in code layers.
- NVENC encoding for shared MP4s.
- Local TTS for emergencies.
- It works through a `jobs/` branch: the PC polls it and pushes assets back. If the assets are missing at 03:30, the hero uses the library scene instead.

## 10. Pro test week and the downgrade
- **What uses the subscription:** the factory runs on API credits. Subscription quota only pays for the two wrapper tasks per night, which should cost at most 1% per night, so about 8% per week. That leaves about 12% for Linus' own sessions.
- **When the expensive work happens:** all Opus-heavy design work (kit, library, first hero) runs 27 Oct–5 Nov. The pipeline is frozen 6–13 Nov, and heroes run only through the Agent SDK on the API.
- **Calibration:** read the usage meter before and after each of the 3 nights, 30 Oct–1 Nov.
- **Downgrade decision on 16 Nov:**
  - Pro gets no API credits. Max costs $100 plus any API spend above $100; Pro costs $20 plus all API spend.
  - Pro is cheaper only while API spend stays under $80 a month, which is lean mode.
  - Target mode means staying on Max.
  - Decide from the spend projection in `report.json`.

## 11. Failure handling
- **Repairs:** a stage that fails gets 2 repair rounds, each given the exact finding. Then one escalation from Sonnet to Opus, then the "needs human" queue. Meanwhile the feed shows a quiz or comparison card from the same series.
- **News:** a failed fact-check turns the briefing into a text card with sources.
- **Voice:**
  - The run checks the provider balance and a per-night character budget first (the ElevenLabs credits ran out on 21–23 Oct).
  - If the provider fails, news switches to the fallback voice, but evergreen videos wait rather than change narrator mid-series.
- **API:**
  - `fallbacks: "default"` and a `stop_reason` check on every call.
  - Batch requests that errored or expired are resubmitted by `custom_id`.
- **Spend caps:** $1.50 per L or L+ video, $8 per night, and a monthly cap.
- **Reporting:** `report.json` goes to the preview branch and a status card appears in the app.

## 12. First 2 weeks
| Dates | Work |
|---|---|
| 26–27 Oct | Link a Console org to claim the credits; store the API key as a secret; **check that `api.anthropic.com` is reachable from the cloud environment**. Fix the PyAV bug, set `--workers 3`. Generate the casting files and send the approval request to ElevenLabs. |
| 28–30 Oct (Opus high, Claude Code) | The three identities and the BANNED list; distil the references. Harden the player: pinned and vendored, local `runtime-src`, woff2 fonts, the answer pause, audio unlock. Build the 8 core types. **Acceptance test:** the probe rebuilt as a spec, and Linus must rate it clearly better. |
| 31 Oct–1 Nov | `nightly.py` with gates 1–7. Three calibration nights at 5 videos each. Voice decision. |
| 2–5 Nov | First hero (an Atlas map story) and the first promotion. News task at 04:15, transfer videos from the digest. Real-iPhone test: 90 s audio sync and audio unlock. Scale to 10 per night. |
| from 6 Nov | Pro test week on the frozen pipeline. |

## 13. Top 5 risks and mitigations
1. **The API can't be reached from the cloud environment, or the credits don't apply.** Check on day 1. Fallback: run `nightly.py` on the RTX PC under WSL.
2. **The library still looks like slides.** Use medium rules, actors that survive cuts, transitions with a cause, the critic's "slideshow" check, and a weekly Opus review of 10 contact sheets that updates the BANNED list. Heroes keep feeding new devices.
3. **iOS live playback** (audio unlock on swipe, picture drifting from voice). Test on a real device before 6 Nov. Fallback: our own player with the audio as the clock, running the same modules, or an MP4 for the cards affected.
4. **Voice terms and credits** (under-18 clauses, running out mid-month). Default to Inworld or Azure, get written approval from ElevenLabs, enforce the character budget, and pin one voice per series.
5. **Cost and quota creep** (agent loops, retries, heroes growing in scope). The orchestrator is code, repairs stop at 2 rounds, there are caps per video, night, hero and month, spend is shown every morning, and the 16 Nov decision follows the $80 rule.