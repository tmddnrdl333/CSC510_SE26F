# D5 — Qwen 3.6 27B assessment for the cross-model comparison

Qwen was used for the report's previously empty third-model slot. It must be
labelled **Qwen 3.6 27B**, not Gemini: the transcript identifies the model as
`qwen/qwen3.6-27b` (`llama-results.md:3`). The run used prompt-specific,
size-limited snapshots because Groq's free tier rejected the full tree.

Full transcript: `proj1a-report/llama-results.md`.

## Prompt × model table — Qwen column

| Keeper | Qwen 3.6 27B result | Judgment / evidence |
|---|---|---|
| KP1 | Identified the React/TypeScript client, Node/Express server, Firestore, roles, and ordering flow, but stopped mid-sentence inside `<think>` and never produced the requested sections. | **Partial, unusable as submitted.** Most orientation facts were sound, but format compliance and completion were 0%. |
| KP2 | Noticed the duplicated `axios` key, broken inherited test import, and Firebase/Gemini dependencies, but never produced the required cited table. | **Partial with unsupported claims.** The duplicate is real (`server/package.json:12,21`) and the missing test dependency is documented (`LOCAL_SETUP.md:22–24`); package/model currency claims were not established from repository evidence. |
| KP3 | Guessed that missing emulator setup caused the failure and assigned setup high confidence, although the prompt contained only `<paste the FirebaseAppError stack trace>`. | **Incorrect method.** The defensible classification was UNVERIFIED until the trace was supplied. The suggested setup steps match `LOCAL_SETUP.md:7–10`, but do not prove the cause of an absent error. |
| KP4 | Reconstructed speech → `/voice/classify` → Gemini → action and reached **Partial** because the five actions cannot add food or place an order; it stopped before the requested final structure. | **Substantively correct, formally incomplete.** Confirmed by `server/routes/voice.js:6–12` and `client/src/features/voice/utils/performAction.ts:11–27`. |
| KP5 | Reached `NONE FOUND` / missing coverage and proposed edge cases, but stopped before issuing the requested answer. | **Core verdict correct, edge-case quality mixed.** No assertion covers `/api/voice`; confidence-threshold and role-permission cases were not derived from the actual contract. |
| KP6 | Chose a plausible Supertest/axios-mock approach, then ended at `const express = require` without completing a test or “This proves ...” line. | **Fail/incomplete.** No runnable test or reproducible artifact was produced. |
| KP7 | Correctly selected “network timeout/failure” from KP5, but produced no test code and speculated that a timeout could leave the microphone active indefinitely. | **Fail/incomplete.** Recognition stops after the final transcript (`useSpeechToText.ts:136–140`) before classification is awaited (`VoiceCommandManager.tsx:129`). |
| KP8 | Leaned toward cutting the features and correctly noted that voice is navigation rather than ordering, but claimed donations had no client integration or documentation. | **Material factual error.** Donations are documented (`README.md:68,104`; `docs/API.md:308–343`) and displayed by the client (`HomePage.tsx:11–15,86–102`). |

## Caught errors

| Model | Wrong output | How we caught it |
|---|---|---|
| Qwen 3.6 27B | KP3 inferred a Firebase root cause even though no stack trace was supplied. | The keeper prompt contains a literal placeholder and explicitly forbids guessing. |
| Qwen 3.6 27B | KP2 suggested `gemini-2.5-flash` might not exist or might be deprecated. | `server/routes/voice.js:44` proves only the configured name; the repository contains no availability/deprecation evidence. |
| Qwen 3.6 27B | KP7 claimed an API timeout may leave the microphone active indefinitely. | `useSpeechToText.ts:136–140` dispatches the transcript and immediately stops recognition. |
| Qwen 3.6 27B | KP8 said donations had no documentation and no client integration. | `README.md:68,104`, `docs/API.md:308–343`, and `HomePage.tsx:11–15,86–102` directly contradict it. |

## Per-model strengths/weaknesses — Qwen addition

- **Qwen 3.6 27B:** It oriented itself quickly and found several important
  facts: voice is navigation rather than ordering, voice tests are missing, the
  inherited test import is broken, and `server/package.json` has a duplicate
  `axios` key. Its main weakness was severe completion failure: all eight
  responses exposed `<think>` text and hit the output cap before the requested
  final format. KP6 and KP7 supplied no test code. It also guessed when evidence
  was absent (KP3) and missed directly available donation evidence (KP8).
  Overall: **useful as a lead generator, unreliable as a final report writer in
  this run**.

## Short replacement text for the PDF

### Section 5.1 — Qwen caught errors

**Qwen 3.6 27B — incomplete outputs and two material hallucinations.** All eight
runs ended inside exposed `<think>` reasoning before the requested answer. KP3
guessed a setup root cause although the stack trace was absent. KP8 said the
donation service had no docs or client integration, contradicted by
`README.md:68,104`, `docs/API.md:308–343`, and `HomePage.tsx:11–15,86–102`.

### Section 5.4 — Qwen strengths and weaknesses

**Qwen 3.6 27B:** Fast orientation and some valuable leads: it correctly found
that voice “ordering” only exposes five navigation/utility actions
(`voice.js:6–12`), that voice tests are absent, and that `axios` is duplicated in
`server/package.json:12,21`. But none of its eight responses reached the required
final format; KP6/KP7 produced no test, KP3 guessed without the missing trace,
and KP8 overlooked explicit donation docs and UI usage. We therefore treated it
as a lead generator, not an authoritative result.
