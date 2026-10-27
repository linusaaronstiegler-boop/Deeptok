{
 "scores": [
  {
   "key": "A-library",
   "quality": 6,
   "speed": 9,
   "usage_efficiency": 9,
   "robustness_overnight": 8,
   "learning_fit": 8,
   "maintainability": 8,
   "rationale": "Best fit for a 4-vCPU box, a quota-limited owner and unattended nights. The orchestrator is plain code and the models only fill in JSON, so per-video behaviour is bounded. The '<=2 h resumable chunks' line matches the real 2 h cap on background commands, which B and C ignore. The cost math checks out against current list prices: Sonnet 5.5 is $2/$10 with $0.20 cache reads, so 60k input (60% cached) plus 9k output is about $0.15 at standard rates and roughly half that batched. That makes $0.15-0.25 per video credible. It also has idempotent content-hashed stages, a pinned lib version per video, a 06:15 news fallback to a text card, Opus series plans (coherence), and 7-day recall plus ratings as inputs. Weaknesses. (1) Lowest visual ceiling: 8 template types can easily read as 'slideshow 2.0', which is what Linus already called only 'okay'. (2) Sonnet medium writes the script, which is the biggest learning lever, while C puts Opus there for about $0.04 more. (3) The custom-scene escape hatch has no iteration, token or time cap. (4) The $4/night cap contradicts '40 a night' for the backlog, which costs $6-10 at its own per-video price. (5) The launcher's 'few thousand tokens a night' is unrealistic: a Claude Code session's system prompt plus CLAUDE.md and skills alone is tens of thousands of tokens, and the session is woken again when the job exits. (6) It runs news through Batches, despite the 06:15 deadline. (7) It uses `fallbacks:\"default\"` 'on every call', but that is rejected on the Batches API and unavailable for Haiku 5.5. (8) It excludes Gemini for the under-18 clause yet keeps Google Chirp as a fallback. (9) The rollout crams Atlas, maps, briefing-card, the news lane, calibration and the iPhone tests into 2-4 Nov and then freezes on 5 Nov."
  },
  {
   "key": "B-studio",
   "quality": 8,
   "speed": 5,
   "usage_efficiency": 4,
   "robustness_overnight": 6,
   "learning_fit": 6,
   "maintainability": 5,
   "rationale": "Highest visual ceiling. Opus high writes script and storyboard in one context, each video has a cinematography contract, and the kit constants are numbers (9% display type, 18-24 frame entrances, hold >=1.2 s, <=7 words per line, >=48 px). The 'parallelise across videos, not scenes' claim is correct: film.md says 9 min in one context vs 21 min split across sub-agents. The worst choice for this owner, though. Opus 5.5 high per evergreen video ($20/MTok output, $10 batched) with thinking output makes the '$0.25 per library-only evergreen including retries' figure look optimistic. It admits $105-165/month plus about $25 TTS, which already exceeds the assumed $100 credit before any downgrade. About 40% of evergreen videos get bespoke Animator loops. That is per-video generated GSAP with no regression snapshots, which rots as the player and library change, and it means 15-20 min per hero video. The '~2.5 h' single session exceeds the 2 h background cap, and the split is only mentioned as a maybe. It has no series-plan role, and nothing feeds 7-day recall back in: it tunes to Linus' taste (rating 1 in 10), not to the north-star metric. The illustration tier (Open Peeps, FLUX stills, archival duotones) is pushed hardest here and risks the decorative images CLAUDE.md bans. It also uses `fallbacks:\"default\"` with Batch. Good ideas: Animator caps with fallback to the library, a character-budget preflight per voice provider, Haiku lexicon proposals from the ASR diff, the dialogue A/B test, the GitHub Actions launcher with zero quota use, and P0/P1 critic notes."
  },
  {
   "key": "C-hybrid",
   "quality": 7,
   "speed": 7,
   "usage_efficiency": 6,
   "robustness_overnight": 7,
   "learning_fit": 8,
   "maintainability": 6,
   "rationale": "Best ideas for learning. The schema enforces the Veritasium arc (misconception hook, predict, conflicting evidence, 'Das stimmt nicht, weil…', model, transfer). FSRS forgetting stats are an input, there is a sibling quiz card, and the narrator stays fixed per series: evergreen videos wait for the voice rather than switch it mid-series. The model split is smart: Opus medium in Batch writes script and beats for about $0.04 per video, and Sonnet low fills the params. It is the most grounded: all six registry blocks it names exist in the 448-block catalog (world-map, count-up, before-after-wipe, marker-highlight; chart-story and hw-callout-circle are present too). Its quota estimate is honest (about 30k tokens a night, about 8% a week), it flags that Chirp may fall under the same Google under-18 clause, and it has an RTX-PC/WSL fallback runner if the API is unreachable. It is weaker for overnight work. It has three tiers, hero Agent SDK loops (about 2M tokens, 60-120 min), a promotion pipeline and a PC jobs branch: the most moving parts to break unattended. The $8 hero cap equals the $8 nightly cap, so a hero night can starve the whole library lane. 'Target' mode is $180/month plus $25-99 for voice, well past the credit. The 22:07-02:30 run in one session exceeds the 2 h background cap. It uses `fallbacks:\"default\"` on every call, including Batch and Haiku, where that is rejected or unavailable. It also adds sound effects, plus music in idents and during prediction freezes. That contradicts CLAUDE.md's 'keine Musik' and adds extraneous load at exactly the moment the learner should be thinking."
  }
 ],
 "winner": "A-library",
 "grafts": [
  "From C: split the writing. Opus 5.5 medium in Batch writes script plus beat outline with {cue} marks (about 12k input, 8k of it cached, and 3k output: roughly $0.04 per video). Sonnet 5.5 low only fills slot params through structured outputs. Script quality is the learning lever and costs pennies.",
  "From C: enforce the Veritasium arc in the VideoSpec schema (G0): misconception hook, tap-to-predict, conflicting evidence, 'Das stimmt nicht, weil…', correct model, transfer. For the brother, also require example-before-rule order.",
  "From C: use the promotion rule (critic >=0.85, no negative rating from Linus, slate expects >=3 reuse topics). Generalise to a module with 2 demo specs that both pass the gates, add a reference snapshot and bump the lib version. This replaces A's looser 'same custom need 3 times a week'.",
  "From C: voice continuity. One narrator per series. On a provider outage, evergreen videos wait and only news switches to the fallback voice.",
  "From C: run news on standard calls, never Batch. A failed fact-check turns the item into a text card with sources.",
  "From C: if api.anthropic.com is unreachable or the credits do not apply, run nightly.py on the RTX PC under WSL instead of A's quota-burning 'Claude Code workflow on Sonnet low'. Give the PC jobs branch a hard deadline (03:30) with fallback to the library.",
  "From C: start the 8 core types from existing registry blocks (world-map, count-up, before-after-wipe, marker-highlight, hw-callout-circle, chart-story; all verified in the 448-block catalog). Build only the Europe/Germany map block from scratch.",
  "From C: caps per video ($1.50) and per month, on top of the nightly cap, with spend projection in report.json and a status card in the app.",
  "From B: Animator caps for A's custom scene: 6 tool iterations, 40k output tokens, 15 min wall time, then fall back to the nearest library type.",
  "From B: the numeric kit constants table (display 9% of frame height and -2% tracking, entrances 18-24 frames power3.out, hold >=1.2 s, visual change every 2-4 s, <=7 words per line, body >=48 px), written into each DESIGN.md and checked by the DOM gate.",
  "From B: cinematography contract as spec fields: one world canvas, one camera path, one persistent actor that changes role, 3-5 transition kinds that each have an on-screen cause.",
  "From B: critic output as P0/P1 lines ('t · where · problem → change') that map 1:1 to spec patches. Recalibrate the critic threshold from Linus' reason-menu ratings.",
  "From B and C: a character and balance budget check per voice provider before each night (the ElevenLabs credits ran out on 21-23 Oct). Haiku proposes lexicon entries from the ASR diff.",
  "From B: freeze for the prediction at `range-end`, with native answer chips outside the iframe, so taps never depend on player internals.",
  "From B: a second voice for an A/B test of a dialogue format on misconception videos, judged on 7-day recall rather than ratings.",
  "From B: a zero-quota launcher via GitHub Actions cron as an option for the Pro week. Check first whether the repo is private: free Actions minutes (about 2000 a month) will not cover 2 h a night."
 ],
 "must_fix": [
  "`fallbacks:\"default\"` 'on every call' will break. The claude-api docs say server-side fallbacks are rejected on the Batches API, and Haiku 5.5 has no server-side fallback. Send it only on standard Opus and Sonnet calls with the `server-side-fallback-2026-07-01` beta. For Batch and Haiku, branch on `stop_reason:\"refusal\"` and resubmit the item as a standard call.",
  "The budget contradicts itself: a hard cap of $4/night vs 'at 40 a night, 300 videos take about 8 nights' at $0.15-0.25 each ($6-10/night). Either raise the cap on backlog nights before 6 Nov or plan the backlog at 15-20 per night. Also note that $4 × 30 = $120 is already above the assumed $100 credit.",
  "The whole cost model rests on an unverified '$100 monthly API credit with Max 5x'. Make 27 Oct a go/no-go: credit visible in the Console, key stored as a cloud secret, api.anthropic.com plus the TTS hosts reachable through the container proxy. The current fallback ('Claude Code workflow on Sonnet low, about 5 videos a night') would eat the Pro-week quota. Replace it with C's RTX-PC/WSL runner.",
  "The custom-scene escape hatch is uncapped. Add a hard limit of iterations, output tokens and wall time per custom scene, plus automatic fallback to a library type. Otherwise one bad loop can burn the night's budget and stall the lane.",
  "Sonnet medium writes the narration, which is the main determinant of 7-day retention. Move script plus beat outline to Opus 5.5 medium in Batch (about +$0.04 per video) and keep Sonnet low for param filling only.",
  "News must not go through the Batches API: batch latency is unbounded in the worst case and the deadline is 06:15. Use standard calls for the 04:15 lane, and start no later than 04:15 with a hard stop at 05:50.",
  "The overnight session model is underspecified. Say how chunk 2 starts after a 2 h background job ends (re-invocation, `send_later`, or a second scheduled task). Add a global lock file so the 22:07 and 04:15 runs and any manual run never overlap. Use a CPU semaphore so 2 Chrome jobs and faster-whisper (pin `cpu_threads`) do not oversubscribe 4 vCPUs.",
  "The quota estimate for the launcher ('a few thousand tokens a night') is wrong by an order of magnitude. A Claude Code session's system prompt, CLAUDE.md, skill index and wake-up turns come to about 20-40k tokens a night. Calibrate on 2-4 Nov and keep the launcher prompt minimal (no skills loaded, a single bash call, a single report read).",
  "The voice policy is inconsistent: Gemini is excluded for the under-18 clause, but Google Chirp stays as the last-resort fallback. Check Google Cloud TTS terms before using it in any feed the brother sees, or use Azure as the final fallback. Add a character and balance preflight per provider before each night.",
  "The Veritasium and brother structure is only checked as 'example before rule plus a misconception scene exists'. Encode the full arc (hook misconception, predict, conflicting evidence, refutation, model, transfer) as an ordered schema constraint in G0, not just as presence checks.",
  "The rollout is too compressed. The Atlas look, map-route, briefing-card, news lane, calibration nights and iPhone and iPad tests all fall on 2-4 Nov, followed by a freeze on 5 Nov. Freeze v1 with Editorial and Diagramm only, ship news as briefing cards, and move Atlas and maps to after the 16 Nov decision.",
  "The critic is Sonnet low on 6 stills at 540×960. It cannot see motion, so it will pass 'slideshow' videos. Add a 'did an actor survive a cut' check from the DOM probe and the 'slideshow?' rubric item. Calibrate the 0.8 threshold against Linus' first 20 ratings before trusting it unattended.",
  "Hero-tier FLUX stills and archival photos have no gate for 'image carries content'. Add a G1 rule that every image must have a `zeigt:` link to a sentence naming its content, or it is dropped (CLAUDE.md: no decoration)."
 ]
}