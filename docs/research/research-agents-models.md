# Video factory: agent roles, model choice and cost (state on 2026-10-26)

## Bottom line

1. **Run the nightly factory on the Claude API, not on the subscription.** Max 5x includes **$100 a month of API credits**. They cover the Claude API, Managed Agents and the Agent SDK. They do not cover Claude Code, and Pro gets none ([platform docs, accessed 2026-10-26](https://platform.claude.com/docs/en/about-claude/api-credits-for-subscribers); launched 2026-10-07 per [release notes](https://support.claude.com/en/articles/12138966-release-notes)). A cheap scheduled task only launches `python factory/nightly.py`, which calls the Messages and Batches APIs through the `anthropic` SDK. That keeps the Pro test week target of about 20% of the weekly quota realistic.
2. **The orchestrator should be code, not an Opus model watching transcripts.** Anthropic measured multi-agent setups at about 15× the tokens of a chat ([Anthropic, 2025-06-13](https://www.anthropic.com/engineering/multi-agent-research-system)). Opus should only make the decisions that need taste: the nightly slate, the scripts, and the final call on borderline videos.
3. **Write a spec first, then render it deterministically.** The flow is script → JSON storyboard → about 25 fixed DeepTok components in HyperFrames → cheap checks → a vision critic last. Models write free GSAP code only for scenes the library cannot cover.
4. **Model mix.** Opus 5.5 for scripts and the slate. Sonnet 5.5 at low or medium effort for storyboards, fact-checks, bespoke animation and visual QA. Haiku 5.5 for pronunciation and lint. Fable 5.1 stays out of the nightly loop.
5. **Estimated cost: about $0.30 per video** with Batch and caching. That is about $90 a month at 10 videos a day, or $135 at 15 a day. **Break-even:** once API spend passes about $80 a month (roughly 9 videos a day), staying on Max 5x costs less than Pro plus paying for the API.

## Model facts (from the claude-api skill, cached 2026-10-06, and the [pricing page](https://platform.claude.com/docs/en/about-claude/pricing), accessed 2026-10-26)

| Model (ID) | $/MTok in / out | Batch in / out | Cache read | Notes for this pipeline |
|---|---|---|---|---|
| Fable 5.1 (`claude-fable-5-1`) | 10 / 50 | 5 / 25 | 0.25 | Thinking always on. On Max it has its own weekly limit ([support](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)). On Pro it runs only on usage credits [third-party, unverified] |
| Opus 5.5 (`claude-opus-5-5`) | 4 / 20 | 2 / 10 | 0.20 | Effort defaults to `medium`; thinking cannot be turned off. Much less likely to state a figure or cite a source the inputs don't support. At `low` it reads charts better than Opus 5 at maximum effort, with about a tenth of the output. Responds well to explicit lists of design patterns to avoid |
| Sonnet 5.5 (`claude-sonnet-5-5`) | 2 / 10 | 1 / 5 | 0.10 | Default `high`. Recommended `medium` for agentic coding and `low` for content generation or extraction. Reads dense charts better when it has crop or zoom tools |
| Haiku 5.5 (`claude-haiku-5-5`) | 0.10 / 0.50 (prompt ≤100K) | 0.05 / 0.25 | 0.01 | No server-side fallback when it refuses |

- All four have a 1M-token context and a 512-token minimum for caching.
- Batch jobs mostly finish in under an hour and expire after 24 hours. Batches support vision and server tools (web search costs $10 per 1,000 searches). Use the 1-hour cache in batches ([batch docs](https://platform.claude.com/docs/en/build-with-claude/batch-processing)).
- Image cost is ⌈w/28⌉×⌈h/28⌉ tokens, so one 1080×1920 frame is about 2,691 tokens ([vision docs](https://platform.claude.com/docs/en/build-with-claude/vision)).
- Opus 5.5 and Sonnet 5.5 can refuse requests through safety classifiers (`stop_reason: "refusal"`). Opus 5.5 includes a biology classifier. Turn on `fallbacks: "default"` for both.

## What the 2025–26 research supports

- **Planner → coder → vision critic beats a single prompt.**
  - Code2Video reports +40% over direct code generation ([arXiv 2510.01174, 2025-10-01](https://arxiv.org/abs/2510.01174)). Its README says the best Manim code came from Claude-4-Opus, with Gemini as the critic ([README](https://raw.githubusercontent.com/showlab/Code2Video/main/README.md)).
  - TheoremExplainAgent reached 93.8% success, but most of its videos had small layout faults ([arXiv 2502.19400](https://arxiv.org/abs/2502.19400)).
- **The typical failures are known.** DATAREEL (HTML/D3 animation, plan-code-verify agents beat direct prompting) lists static charts, subtitles out of sync with the animation, unstable layouts and weak style adherence. Open-weight models failed to execute up to 39.8% of the time ([arXiv 2604.25220, v2 2026-08-06](https://arxiv.org/abs/2604.25220)). Our gates should target exactly these.
- **JSON spec plus deterministic rendering plus a vision critic works, but critique rounds hit a ceiling.** GameUIAgent found that the critic helps less the better the first draft already is (r = −0.96). Partly rendered output made the vision critic's judgement worse, so it should only see final frames ([arXiv 2603.14724, 2026-03-16](https://arxiv.org/abs/2603.14724)). **Cap repair at 2 rounds.**
- **Editing proven templates beats generating from scratch** ([PPTAgent, EMNLP 2025](https://arxiv.org/abs/2501.03936)). That argues for building on the probe video and the ~450 registry blocks.
- **How to brief and judge agents.** Each subagent needs an objective, an output format, its allowed tools and clear boundaries. A single judge call that returns 0–1 scores was the most consistent with human ratings ([Anthropic, 2025-06-13](https://www.anthropic.com/engineering/multi-agent-research-system)).
- **Free deterministic check already in the repo.** `npx hyperframes check --json` checks layout (text overflow, overlap, occlusion), WCAG contrast and motion before any model looks at the video (`.claude/skills/hyperframes-cli/references/lint-validate-inspect.md`).

## Roles, models and estimated tokens per 60-second video

These are my own estimates, not measurements. The prefixes that repeat across videos are cached: the style guide, the 2–3 hand-polished example videos and the component catalogue.

| Role | Model and effort | Input tokens | Output tokens incl. thinking | Why this model |
|---|---|---|---|---|
| Editor-in-chief: one nightly slate of 15 briefs (series, transfer topics), per-video share | Opus 5.5, medium | 3k | 0.7k | Judgement on what to make; runs once a night |
| Researcher (news only) | Sonnet 5.5 low + web search (≤5 searches) / web fetch | 25k | 2k | Volume work; dates and sources go into the brief |
| Scriptwriter (question first, misconception refuted, `Shown\|Spoken` tokens) | Opus 5.5, medium | 12k (8k cached) | 3k | The script is the most important part; costs about $0.10 |
| Fact-checker, separate context from the writer | Sonnet 5.5, medium; disputed claims go to Opus | 10k | 1.5k | Every claim needs a source and a date |
| Storyboarder → JSON (component ID, parameters, anchor word) | Sonnet 5.5 low with structured outputs; compare Haiku 5.5 | 15k (10k cached) | 4k | The schema stops it from breaking the house style |
| Scene animator (bespoke GSAP, ~25% of videos) | Sonnet 5.5 medium, tool loop with lint and check | ~150k, mostly cache reads | 10k | Strongest for agentic coding per token. Build new library components with Opus |
| Pronunciation fixer: the ASR diff is done in code, the model proposes respellings into a shared lexicon | Haiku 5.5, low | 2k | 0.3k | Nearly free; each name only needs fixing once |
| Pedagogy and style lint: regex for banned words plus a model check | Haiku 5.5 | 4k | 0.5k | Rules such as no praise and no "natürlich" |
| Visual critic: 6-frame contact sheet at 540×960, rubric scored 0–1, at most 2 passes | Sonnet 5.5 low; Opus 5.5 low for chart-heavy videos | 2×7k | 2×0.8k | Runs only after `hyperframes check` passes |

**Totals per video:**
- Opus: about 15k in and 4k out.
- Sonnet: about 100k in (about 60% cache reads) and 12k out.
- Haiku: about 6k in.
- Cost: about $0.35 at standard prices, about $0.23 with Batch for the single-shot stages, about $0.30 with a 30% retry allowance.
- A backlog of 300 videos would cost about $90 once.
- Fable as scriptwriter would add about $0.20 per video; that is not worth it.
- Using the local RTX 5070 Ti for any of these model roles saves almost nothing, because the Haiku roles cost about $0.001 per video.

## Claude Code mechanics

- **Subagents.**
  - The `model:` field in the subagent file takes `sonnet`, `opus`, `haiku`, `fable`, a full model ID, or `inherit`.
  - A model passed for a single call wins over that field. `CLAUDE_CODE_SUBAGENT_MODEL` sets a default.
  - Each subagent has its own context, and all of them count against the same usage limits. Default concurrency is 20 ([sub-agents docs](https://code.claude.com/docs/en/sub-agents)).
- **Workflows.**
  - A workflow is a JavaScript script built from `agent()`, `pipeline()` and `parallel()`. A model the script names for a stage counts as that per-call model.
  - An `agent()` call with a `schema` is retried up to 5 times if its output fails validation. Default concurrency is 16 agents, fewer in a CPU-limited container such as our 4 vCPU one. A run can have at most 1,000 agents.
  - Runs can be resumed in the same session. They pause for a usage limit only in interactive sessions.
  - Typing `ultracode` does **not** start a workflow from a scheduled-task prompt.
  - On Pro, workflows have to be switched on in `/config`, and the default size guideline is "small" (fewer than 5 agents). A warning appears above 25 agents or 1.5M tokens ([workflows docs](https://code.claude.com/docs/en/workflows)).
- **Scheduled tasks (formerly routines).**
  - They are in research preview and use subscription quota just like interactive sessions. The model is chosen per task.
  - Limits: at most 100 scheduled runs per hour per account, with at least one hour between runs of a task. Runs start in auto mode ([routines docs](https://code.claude.com/docs/en/routines)).
  - Older third-party claims of daily caps (5 on Pro, 15 on Max) are no longer in the docs.
- **Usage limits.**
  - Both Pro and Max have a 5-hour window and a weekly limit.
  - Max 5x gives 5× Pro's usage per 5-hour session. Anthropic does not publish a weekly multiple or hour counts ([Max FAQ](https://support.claude.com/en/articles/11049741-what-is-the-max-plan), accessed 2026-10-26).
  - So "20% of Max 5x ≈ Pro" is an approximation [unverified].

## Plan for the Pro test week (06–13 Nov)

1. Before 6 Nov: link a Console org to claim the credits. Store the API key as a network secret in the cloud environment.
2. Create a scheduled task with Sonnet 5.5 at low effort, cron `CRON_TZ=Europe/Berlin 7 22 * * *`. Its prompt: run `factory/nightly.py`, read `report.json`, commit to the preview branch.
3. **Evergreen videos:** staged batches from 22:00 (script → storyboard → critic, each stage typically under 1 hour).
4. **News for the morning briefing:** a second task around 05:07 using standard (non-batch) calls.
5. Read the weekly meter at claude.ai/settings/usage every day. If you insist on running the factory entirely inside Claude Code, calibrate first: build 3 videos as a workflow and measure how many percentage points of the weekly quota each video costs.
6. **Decision on 16 Nov:**
   - Max costs $100 plus any API spend beyond the $100 credit.
   - Pro costs $20 plus all API spend.
   - So Pro is cheaper only while API spend stays under about $80 a month.
   - After a downgrade, new credits stop; credits already received stay usable until they expire at the end of the billing cycle.

## Handling failures

- **Stages are idempotent.** Each one writes its file (`spec.json`, `timing.json`, `check.json`) with a content hash, so a rerun skips finished stages.
- **Gates run cheapest first:**
  - JSON schema
  - text lint (banned words, a source and date for every fact, 30–90 s estimated from word count)
  - voice synthesis, then ASR word-error rate under a threshold
  - `hyperframes check` with zero errors
  - critic score ≥ 0.8
- **When a gate fails:**
  - Up to 2 repair rounds, each given the exact finding (for example a check finding with its suggested colour).
  - Then one escalation from Sonnet to Opus.
  - Then the video goes to a "needs human" queue, and the feed gets a quiz or comparison card instead.
  - News with an unresolved fact-check is never published.
- **API specifics.** Check `stop_reason` for refusals on every call. Key batch results by `custom_id`, and resubmit requests that errored or expired.

## Not verified

- How cache reads count against the subscription meter.
- Whether a scheduled-task prompt can start a saved `/workflow` without someone approving it.
- Whether `api.anthropic.com` is on the cloud environment's default network allowlist.
- How good Haiku 5.5 is as a visual critic.
- The per-agent overhead of 20–40k tokens in Claude Code (my estimate).
- Plan prices in EUR.

No files were written.