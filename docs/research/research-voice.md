# German narration voice for DeepTok: research results (as of 2026-10-26)

## Bottom line
- **Quality leader:** ElevenLabs **Eleven v4 Turbo** (`eleven_v4_turbo`, $40/1M chars). It is #1 overall on the Artificial Analysis provider-voice board (Elo 1335). A search snippet of an Artificial Analysis post from about 2026-10-06 says it is also #1 in **German** (Controlled Voice). [partly unverified: X was blocked, so I only saw the snippet]
- **Cheapest good default: Inworld Realtime TTS-2** (`inworld-tts-2`, about $10–25/month for us). German is one of its Tier-1 languages. It was #2 on the German board (Elo 1261) when that board launched. It gives word timestamps, can be steered in plain language and has pronunciation dictionaries. I found no clause in its terms against users under 18.
- **Lowest price in dollars: Gemini 3.8 Flash TTS**, about $6–12/month. But Google's terms forbid it, and Google Cloud's terms likely do too, for any service "likely to be accessed by individuals under 18". Linus' 15-year-old brother uses the app.
- **Under-18 rules are a real blocker for some providers.** ElevenLabs bans apps "directed at individuals under 18" unless ElevenLabs approves them in writing. Google bans them outright. Azure only asks for disclosure to parents. Cartesia only bans harmful content aimed at minors.
- **Timestamps are not decisive.** faster-whisper is already in the container for the Hör-Check and can return word timestamps for any provider. So `timing.json` keeps working no matter which voice we pick.
- **No effect on the Claude quota.** All of this is plain HTTP calls from `voice.py`. All provider APIs answered from the container (401/403/404 = API reached, key missing), so no network change is needed.

## Evidence by provider
Cost basis: the probe has 744 characters in 52.5 s, about 850 characters per minute. 15–30 min/day is therefore about **0.4–0.8M characters per month**.

| Provider / model | Elo (AA, mostly English) | German evidence | Delivery control | Timestamps | Pronunciation control | Cost for 15–30 min/day | Under-18 terms |
|---|---|---|---|---|---|---|---|
| **ElevenLabs v4 Turbo / v4** | 1335 / 1331 | #1 German Controlled Voice [snippet only] | Audio tags, stability. No speed or style slider. No SSML | Character-level (`/with-timestamps`) | Alias dictionaries (max 3 per request), `previous_text` for continuity. Phoneme tags only on `eleven_flash_v2`. v4 inline IPA [unverified, third-party claim] | Turbo: $15–31 on API rates. Creator $22/mo includes 275k v4 characters (about 10 min/day) | Banned unless approved in writing |
| **Inworld TTS-2** | 1269 | German Tier 1; #2 German at 1261 | Plain-language steering; STABLE/BALANCED/CREATIVE modes | Word level (`timestampType: WORD`) | Inline + dictionaries | $25/1M on demand ($10–19). Creator $25/mo at $20/1M covers 30 min/day | Account holder must be 18. No clause about apps for minors (AUP not checked) |
| **Gemini 3.8 Flash TTS** | 1278 | German supported, not on the German board results | Style prompt, ~40 tags, voice design | None documented | Prompt only, no SSML | $9/1M audio tokens at 25 tokens/s = $0.0135/min, so $6–12/mo. Doubles from 2027-01-01. Batch costs half | Banned. In the EEA, unpaid quota may not be used for apps |
| **Cartesia Sonic 3.6** | 1290 | #1 German at launch (about 1283) | Speed 0.6–1.5; emotion tags English only | Word level | IPA dictionaries `<<…>>` | About 1 credit per character. Startup $49/mo for 1.25M credits | Only harmful content aimed at minors is banned |
| Azure `de-DE-Florian:DragonHDLatestNeural`, `de-DE-Seraphina:DragonHDLatestNeural`, `de-DE-Conrad:DragonHDOmniLatestNeural` | 1144 (HD 2.5) | No German score found | Omni voices: `express-as` styles | Omni voices only: WordBoundary events | DragonHD: SSML `<phoneme>`, `<sub>`, lexicon alias, `<break>` | $22/1M = $9–17. Free F0 tier is 0.5M Neural characters; HD appears not included | Disclosure to parents only |
| Google Chirp 3 HD (`de-DE-Chirp3-HD-Charon` etc.) | 1062 | de-DE supported | Speaking rate 0.25–2, `[pause]` markup | Not documented | SSML `<phoneme>` (IPA / X-SAMPA), `<sub>` | **$0** (first 1M characters per month free), then $30/1M | Probably covered by the Google Cloud generative-AI under-18 clause [unclear] |
| Fish Audio Drama 3 (API) | 1245 | German supported | – | – | – | $15/1M = $6–12 | Not checked |
| Voxtral 3 TTS (Mistral) | 1223 | German not confirmed | Tags | – | – | $13/1M | Not checked |
| MiniMax Speech 2.8 HD / Hume Octave 2 | 1175 / 1059 | – | – | – | – | $100 / $87.5 per 1M | Too expensive for the quality |
| OpenAI gpt-4o-mini-tts | – | "voices optimized for English" | – | – | – | – | **Shuts down 2027-01-06**, excluded |

## Local options (RTX 5070 Ti, 16 GB)

| Model | Licence | German | Notes |
|---|---|---|---|
| Higgs Audio V3 4B | Research / non-commercial | Best open-weight model in German | About 9.3 GB of weights, should fit [unverified] |
| Chatterbox Multilingual | MIT | `de` listed | Elo 1025 |
| Qwen3-TTS 1.7B | Apache-2.0 | Yes | Alibaba's hosted Qwen3 TTS scores only Elo 931 |
| Kartoffel-Orpheus 3B | Llama 3.2 licence | German only | Supports emotions |
| Kokoro-de (Thorsten-Voice) | Apache-2.0 | Yes | Same Thorsten speaker Linus rejected |
| F5-TTS-German | CC-BY-NC-4.0 | Yes | – |
| Fish S2 Pro, Breeze TTS 2 | Non-commercial | – | – |
| Fish Drama 3 int4 | – | – | Needs 20.8 GB, does not fit |

All local options share one problem: the PC has to be on, and the GPU-less cloud routine needs a way to receive the audio files. That makes local a fallback or emergency option, not the default.

## Ranked casting shortlist (same 20-second script, blind A/B, 2 takes each)
Test script (about 270 characters, contains the known trouble spots):
> „Sommer 2022. Bayern München verkauft Robert Lewandowski – 344 Tore in acht Jahren. Barcelona zahlt 45 Millionen Euro. Ein gutes Geschäft? Ökonomen fragen anders: Was gibt der Verein dafür auf? Das sind die Opportunitätskosten."

Score it on (a) blind ratings from Linus and his brother and (b) the faster-whisper word error rate and name hits.

1. **ElevenLabs Eleven v4 Turbo** (cast against v4 once). Voices from Linus' account library (read-only listing on 2026-10-26):
   - "Johannes Dokumentarfilm" `r8MyP4qUsq5WFFSkPdfV`
   - "Helmut – Deep Warm Narrator" `JiW03c2Gt43XNUQAumRP`
   - "Christian Plasa – Warm Voice" `NBqeXKdZHweef6y0B67V`
   
   Whether these library clones run on v4 at full quality is [unverified].
   **Setup:** existing account → create an API key with TTS and Voices-read permissions → add the voices to "My Voices" → store the key as the cloud environment secret `ELEVENLABS_API_KEY`. Creator only covers about 10 min/day of v4; for 30 min/day of v4 he needs Pro at $99. Turbo roughly doubles the allowance [inferred from the pricing page]. Before using it for his brother's content, email ElevenLabs for written approval.
2. **Inworld Realtime TTS-2.** Choose or design a calm German narrator in the playground. Exact German voice names are [unverified].
   **Setup:** account at platform.inworld.ai → API key (Basic auth) → secret `INWORLD_API_KEY`. On-Demand includes about 70 minutes of TTS, enough for the casting.
3. **Gemini 3.8 Flash TTS.** Voices: Charon (Informative), Sadaltager (Knowledgeable), Gacrux (Mature, female). Style prompt: „ruhiger, warmer Dokumentar-Erzähler, souverän, natürliche Pausen".
   **Setup:** the casting can run free in the AI Studio UI. Production needs an API key with Cloud billing enabled (paid tier, because of the EEA rule) as `GEMINI_API_KEY`. Use it only if Linus accepts the under-18 clause, or only for Linus' own channels.
4. **Cartesia Sonic 3.6** with a German library voice (`locale: de-DE`).
   **Setup:** play.cartesia.ai → Pro plan ($5/mo for 100k credits) → secret `CARTESIA_API_KEY`.

Outside the casting, **Azure Florian DragonHD** is the fallback with the fewest terms problems (Azure account + Speech resource → `AZURE_SPEECH_KEY` and region). **Chirp 3 HD** is a free baseline.

**Cheapest high-quality default:** Inworld TTS-2 at about $25/month flat, if it ties with v4 Turbo in the casting. Otherwise ElevenLabs v4 Turbo (about $22–99/month) once ElevenLabs has approved in writing.

## Pipeline consequences
- **Synthesize per scene, not per sentence.** LLM-based voices lose prosody when every sentence is generated alone. For ElevenLabs, also pass `previous_text`.
- **Word times:** take them from the provider's alignment where it exists, otherwise from faster-whisper `word_timestamps=True`.
- **Pronunciation:** keep the `Anzeige|Gesprochen` respelling as the layer that works with every provider. Add each provider's lexicon on top (SSML phoneme, IPA dictionary or alias).
- **Quality gate:** fail a clip if the Hör-Check finds a name error or the word error rate is above a threshold.

## Unverified
- Eleven v4 Turbo being #1 in German (only a search snippet).
- Eleven v4 inline IPA.
- Turbo character allowances on the plans.
- Inworld's AUP on minors.
- Chirp 3 HD timepoints.
- Whether Chirp 3 HD counts as a "Generative AI Service" under Google Cloud terms.
- Higgs V3 VRAM use and whether the family app counts as non-commercial.
- German support in Voxtral 3.

## Sources (all accessed 2026-10-26 unless dated otherwise)
- AA provider-voice board: https://artificialanalysis.ai/text-to-speech/leaderboard
- AA open-weights board: https://artificialanalysis.ai/text-to-speech/leaderboard/provider-voice/open-weights
- German board launch (2026-09-22): https://alphasignal.ai/news/cartesia-s-sonic-3-6-dominates-eight-of-nine-global-voice-ai-leaderboards
- AA post on v4 Turbo (about 2026-10-06, snippet only): https://x.com/ArtificialAnlys/status/2107267465604649164
- ElevenLabs API pricing: https://elevenlabs.io/pricing/api
- Eleven v4 docs: https://elevenlabs.io/docs/overview/capabilities/text-to-speech/eleven-v4
- Eleven v4 launch (2026-09-29): https://the-decoder.com/elevenlabs-new-v4-speech-model-makes-ai-voices-more-expressive-and-consistent/
- ElevenLabs controls / pronunciation: https://elevenlabs.io/docs/best-practices/prompting/controls
- ElevenLabs timestamps endpoint: https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps.md
- ElevenLabs use policy: https://elevenlabs.io/use-policy
- Gemini API pricing: https://ai.google.dev/gemini-api/docs/pricing
- Gemini speech generation: https://ai.google.dev/gemini-api/docs/speech-generation
- Gemini API terms: https://ai.google.dev/gemini-api/terms
- Google Cloud TTS pricing: https://cloud.google.com/text-to-speech/pricing
- Chirp 3 HD docs: https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd
- Google Cloud service terms (§20d): https://cloud.google.com/terms/service-terms
- Azure HD voices: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/high-definition-voices
- Azure language support: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts
- Azure retail price API (Neural HD $22, effective 2026-09-01): https://prices.azure.com/api/retail/prices
- Azure TTS transparency note: https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/speech-service/text-to-speech/transparency-note
- Inworld docs: https://docs.inworld.ai/llms-full.txt
- Inworld pricing: https://inworld.ai/pricing
- Inworld terms: https://inworld.ai/terms
- Cartesia docs: https://docs.cartesia.ai/llms-full.txt
- Cartesia terms: https://cartesia.ai/legal/terms
- OpenAI TTS guide: https://developers.openai.com/api/docs/guides/text-to-speech
- Hugging Face model cards:
  - https://huggingface.co/ResembleAI/chatterbox
  - https://huggingface.co/bosonai/higgs-audio-v3-tts-4b
  - https://huggingface.co/fishaudio/drama-3-int4
  - https://huggingface.co/BreezeBlue/Breeze-TTS-2
  - https://huggingface.co/SebastianBodza/Kartoffel_Orpheus-3B_german_natural-v0.1
  - https://huggingface.co/aihpi/F5-TTS-German
  - https://huggingface.co/Thorsten-Voice/Kokoro
- Higgs weights size: https://localaimaster.com/blog/higgs-tts-3-licence-and-vram