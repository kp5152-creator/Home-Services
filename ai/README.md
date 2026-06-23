# AI

AI summary, recommendation, owner-report, and scoring helpers live here.

Start with the rules in `../docs/product/AI_OPERATING_MANUAL.md`.

Core principle: AI should feel like a concierge and trusted estate manager, not a robotic AI platform.

## Current Co-Pilot Helpers

`inspectionCoPilot.ts` contains the first production-shaped AI assist layer for the inspection workflow.

It currently handles:

- inspection evidence readiness
- visit summary drafting
- owner update drafting
- checklist suggestions from notes/narration
- maintenance issue suggestions from notes/narration

`maintenanceRecommendations.ts` contains the first Phase 2 maintenance recommendation helper.

It currently handles:

- likely vendor type from issue title/description
- recommended priority
- suggested next step
- homeowner-facing explanation

`types.ts` contains shared AI-facing contracts for Co-Pilot evidence, draft summaries, issue suggestions, and maintenance recommendations.

`prompts.ts` contains provider-neutral EstateIQ voice, privacy, and human-review rules for future AI-provider calls.

`services/aiClient.ts` contains the feature-flagged provider client. `/api/ai/inspection-summary` uses it for live summary drafting when enabled, and the inspection UI falls back to the rules-assisted draft when live AI is disabled or unavailable.

`index.ts` is the public entry point for AI helpers and shared AI types. Prefer importing AI helpers through `@/ai` from UI and service code.

Keep these helpers pure when possible. They should accept inspection facts and return draft text, readiness states, or suggestions. UI state, API calls, file uploads, and navigation should stay in the calling screen or service layer.

## Guardrails

- AI drafts must stay editable.
- Suggested issues must require human review before saving.
- Do not claim photo or video analysis happened unless a real AI service processed the media.
- Do not send sensitive owner details, gate codes, alarm codes, or private access instructions to AI providers.
- Keep homeowner-facing language calm, concise, accurate, and concierge-like.
