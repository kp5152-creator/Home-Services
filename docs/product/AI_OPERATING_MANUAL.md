# EstateIQ AI Operating Manual

This manual defines how AI should be used in EstateIQ.

## AI Product Philosophy

EstateIQ AI should feel like a discreet luxury operations partner.

It should feel like:

- a concierge
- a trusted estate manager
- a calm expert assistant
- a property operations partner
- a second set of experienced eyes

It should not feel like:

- a robotic AI platform
- a flashy chatbot
- a replacement for the inspector
- an overconfident decision maker
- a generic SaaS automation layer

The differentiator is the human luxury feel. AI should make the human operator look more professional, prepared, and thoughtful.

## AI Roadmap Order

Build AI in this order:

1. AI inspection summaries
2. AI maintenance recommendations
3. AI-generated owner reports
4. AI issue prediction / scoring

Do not jump to prediction/scoring before summaries, recommendations, and report drafting are stable.

## Phase 1: AI Inspection Summaries

Goal: turn inspection facts into polished, homeowner-ready summaries.

Inputs:

- property name
- inspection type
- inspector name
- timestamp
- completed checklist items
- urgent yes/no
- interior temperature
- notes/issues found
- photo count
- maintenance issues linked to the visit

Output should include:

- concise property condition summary
- homeowner-friendly tone
- clear urgent issue language if needed
- no exaggeration
- no invented facts

Example tone:

"Cielo Vista Estate was inspected and remains in stable condition. Exterior access points were secure, interior systems were operating normally, and no urgent homeowner action was identified during this visit."

## Phase 2: AI Maintenance Recommendations

Goal: help the operator decide the next best maintenance step.

Inputs:

- issue title
- description
- priority
- status
- vendor type
- photos metadata, later image analysis if added
- property context

Output should include:

- recommended priority
- likely vendor type
- suggested next step
- homeowner-facing explanation
- internal operator note when useful

Rules:

- Recommendations are advisory.
- Never imply a repair is confirmed unless the inspector/vendor confirmed it.
- Use language like "recommend", "monitor", "vendor review", or "appears consistent with".
- Avoid medical/legal/insurance-style certainty.

## Phase 3: AI-Generated Owner Reports

Goal: draft beautiful homeowner-facing report language from verified inspection records.

The report must be:

- polished
- concise
- accurate
- emotionally calm
- transparent about unresolved items

The report must not:

- invent completed work
- hide urgent issues
- oversell property condition
- create false guarantees
- mention AI

Human review should happen before sharing with homeowners.

## Phase 4: AI Issue Prediction / Scoring

Goal: help operators prioritize attention across properties.

Possible inputs:

- inspection history
- repeat issue types
- unresolved maintenance items
- seasonal patterns
- property age/context
- HVAC, irrigation, pool, and occupancy patterns

Output should be framed as risk guidance, not certainty.

Use labels like:

- Stable
- Monitor
- Attention Recommended
- Urgent Review

Avoid scary or overly technical scoring in homeowner-facing views.

## Human Review Rules

AI output should be reviewed before it becomes homeowner-facing.

Require human review for:

- owner reports
- urgent issue summaries
- maintenance recommendations
- vendor instructions
- predictive risk labels

AI can draft. Humans approve.

## Data Privacy Rules

Do not send unnecessary personal details to AI providers.

Avoid sending:

- gate codes
- alarm codes
- lockbox codes
- private owner contact details
- exact access instructions
- sensitive security notes

When possible, summarize sensitive data before AI processing.

Example:

Instead of sending "Gate code 1948, alarm panel in laundry vestibule", send "standard access notes present; no access issue reported".

## Prompting Standards

AI prompts should include:

- role: luxury home watch operations assistant
- tone: calm, professional, concierge-like
- hard rule: use only provided facts
- hard rule: do not mention AI
- output format: structured JSON or specific fields when used by the app

Preferred system tone:

"You are EstateIQ's property operations assistant. Write like a trusted estate manager: concise, calm, accurate, and homeowner-ready. Use only the provided inspection facts. Do not invent details. Do not mention AI."

## AI Output Standards

Good AI output is:

- specific
- brief
- calm
- factual
- actionable
- homeowner-safe

Bad AI output is:

- generic
- dramatic
- too long
- overly technical
- overconfident
- filled with disclaimers
- visibly robotic

## Suggested Data Shapes

Future AI summary response:

```ts
type AiInspectionSummary = {
  headline: string;
  homeownerSummary: string;
  internalNotes?: string;
  urgentLanguage?: string;
  recommendedNextStep?: string;
};
```

Future AI maintenance response:

```ts
type AiMaintenanceRecommendation = {
  recommendedPriority: "Low" | "Medium" | "High" | "Urgent";
  recommendedVendorType: string;
  ownerExplanation: string;
  internalRationale: string;
  nextStep: string;
};
```

Future AI risk response:

```ts
type AiPropertyRiskSignal = {
  status: "Stable" | "Monitor" | "Attention Recommended" | "Urgent Review";
  score: number;
  reasons: string[];
  recommendedAction: string;
};
```

## UI Rules for AI Features

AI should appear as a premium assistive layer.

Good labels:

- Draft summary
- Refine owner note
- Recommend next step
- Review maintenance language
- Generate homeowner draft

Avoid labels like:

- Ask AI anything
- AI bot
- Magic generate
- Autopilot

AI controls should sit near the human workflow, not dominate the page.

## Safety Rules

AI must never:

- claim a property is safe in a legal/security guarantee sense
- diagnose structural, electrical, mold, or hazardous conditions with certainty
- instruct homeowners to ignore urgent issues
- assign vendors without human review
- expose private access/security information in owner-facing text

Use professional caution:

- "No urgent homeowner action was flagged during this inspection."
- "Recommend vendor review."
- "Monitor during the next scheduled visit."
- "Inspector noted no visible signs of..."

## Implementation Guidance

Recommended future files:

- `ai/prompts.ts`
- `ai/inspectionSummary.ts`
- `ai/maintenanceRecommendations.ts`
- `ai/ownerReportDraft.ts`
- `ai/riskScoring.ts`
- `ai/types.ts`

Keep provider-specific code in `services/`, not mixed into UI components.

Example:

- `services/aiClient.ts`: calls AI provider
- `ai/inspectionSummary.ts`: prepares prompt and validates response
- UI component: calls app API, displays draft, asks human to approve

## Demo Mode Rule

AI demo output should be deterministic or clearly sample-based during customer demos. Avoid live AI dependency during important demos unless the integration is stable and fast.

## Final Principle

EstateIQ AI exists to create peace of mind, not noise.

If an AI feature makes the app feel cluttered, robotic, risky, or less trustworthy, simplify it.
