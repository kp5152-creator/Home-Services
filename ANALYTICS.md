# EstateIQ Pilot Analytics

EstateIQ now includes lightweight, privacy-safe analytics for founder learning during demos and early pilots.

## What It Tracks

- Screen views: which app areas people visit.
- Clicks: buttons and links used across the main workspace.
- Workflow steps: demo mode starts, role selection, inspection report creation, maintenance issue creation, AI concierge summary drafting, PDF actions.
- Stuck signals: when a user sits on the same screen without activity for more than 75 seconds.
- Ignored features: inferred by comparing screen views against click and workflow activity.

## What It Does Not Track

- Homeowner names typed into forms.
- Access notes, gate codes, alarm details, or private property notes.
- Photo contents.
- Freeform notes or inspection descriptions.
- Passwords or authentication secrets.

## Current Storage

For the pilot MVP, events are stored locally in:

`data/analytics.json`

The local API endpoint is:

`/api/analytics`

Use `GET /api/analytics` locally to review the latest events.

## Event Examples

- `screen_view`: user opened Dashboard, Inspection, Maintenance, Reports, or Owner Portal.
- `click`: user clicked a visible button or link.
- `workflow_step`: user completed an important business action.
- `stuck_signal`: user may be confused, waiting, or unsure what to do next.

## Production Recommendation

Before live customer scale, move analytics storage from local JSON to Supabase or a dedicated privacy-friendly analytics service. Keep the same event names so founder learning stays consistent.

Recommended future table:

- `id`
- `created_at`
- `session_id`
- `role`
- `screen`
- `workflow`
- `target`
- `event_name`
- `demo_mode`
- `metadata`

## Founder Questions This Supports

- Are inspectors starting and completing inspection reports?
- Are homeowners opening reports and downloading PDFs?
- Are users getting stuck on property setup, inspection, maintenance, or reports?
- Which role experience gets used most in demos?
- Which premium features are being ignored?
