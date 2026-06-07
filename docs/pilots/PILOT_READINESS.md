# EstateIQ Pilot Readiness

EstateIQ is close to a real customer pilot. The current focus should be stability, clarity, mobile usability, clean reporting, and a polished demo experience.

## Current Pilot Goal

Show a luxury home watch/operator workflow that proves the product can support:

- property onboarding
- field inspections
- photo documentation
- maintenance issue tracking
- vendor/schedule coordination
- owner-facing updates
- luxury homeowner PDF reports
- separate Admin, Inspector, and Homeowner views
- safe customer demo mode

Do not add large new features before the first pilot unless they directly reduce risk or improve the demo/customer workflow.

## What Works Now

### Demo Mode

EstateIQ has a polished demo mode with one luxury sample property:

- Property: Cielo Vista Estate
- Sample homeowner profile
- Sample inspection
- Sample exterior/interior/pool photos
- Sample maintenance issue
- Sample vendors
- Sample schedule items
- Sample owner update
- Demo report route: /reports/demo-inspection-home-watch
- Demo PDF route: /api/reports/demo-inspection-home-watch

Demo mode supports:

- Demo Admin
- Demo Inspector
- Demo Homeowner

Demo mode actions are designed to stay local during presentation workflows and avoid writing sample actions into real customer records.

### Onboarding

The login/onboarding screen supports role selection:

- Admin Command Center
- Inspector Field App
- Homeowner Portal

The first-property flow guides a new admin into creating the first homeowner/property profile before the rest of the app unlocks.

### Mobile Inspection Workflow

The inspection workflow is mobile-first and includes:

- inspection type templates
- a simplified Inspector > Visit type > Capture > Checklist > Review & Finish flow
- mobile checklist sections that open one at a time
- Mark Section / Reset Section controls
- Mark All / Reset checklist progress controls
- Exterior, Interior, and Issues photo categories
- photo preview thumbnails with category badges
- inspector name
- interior temperature
- dictated or typed observations
- issue suggestions from captured observations
- urgent issue flag
- suggested owner-ready summary
- report generation

Recent hardening added clearer validation before generating a report:

- property must exist
- inspector name required
- realistic interior temperature required
- at least one checklist item required
- readiness notes explain missing items before report generation
- clearer photo-processing errors
- safer save error handling

### PDF Reports

The PDF report is branded, luxury styled, homeowner-ready, and currently condensed to 3 pages:

1. Luxury cover page
2. Executive summary/status/metrics
3. Inspection record with checklist, notes, and photo strip

This is the right length for a pilot demo.

### Architecture

The project now has a clearer structure:

- services
- utils
- reports
- inspections
- properties
- auth
- ai
- dashboard
- hooks
- components/ui

Core documentation exists:

- docs/architecture/PROJECT_STRUCTURE.md
- docs/product/DESIGN_SYSTEM.md
- AGENTS.md
- docs/product/AI_OPERATING_MANUAL.md
- docs/pilots/MANUAL_TESTING_CHECKLIST.md

## What Needs Testing Before Real Customers

Run docs/pilots/MANUAL_TESTING_CHECKLIST.md before each customer-facing pilot session.

Priority test areas:

- Demo mode after refresh
- Demo mode after Vercel deploy
- Mobile inspection completion on iPhone Safari
- Photo upload speed and reliability on mobile
- PDF export on iPhone and desktop
- Property save with Supabase RLS enabled
- Maintenance issue save with photos
- Vendor and schedule saves
- Homeowner role visibility/read-only behavior
- PWA add-to-home-screen behavior

## Security and Privacy Review

### Current Risks

- Local test data may exist in data/db.json. Review before committing or demoing.
- Supabase row-level security must be verified before live customer data.
- Demo data must never include real gate codes, alarm codes, lockbox codes, owner contact details, or access instructions.
- Owner portal is currently role-view based, not a full production authentication/authorization system.
- AI features are not production-connected yet and should remain human-reviewed when added.

### Completed Privacy Improvements

- Demo access notes were sanitized to remove realistic gate/alarm details.
- Demo homeowner email uses sample data.
- PWA service worker no longer caches /_next runtime files or /api responses, reducing stale app bundle errors after deploy.

### Before Real Customer Data

Complete these before entering live client information:

- Verify Supabase RLS policies for all customer tables.
- Confirm storage bucket permissions for inspection and maintenance photos.
- Add real authentication and role-based authorization.
- Confirm owner portal cannot access other owners' properties.
- Confirm reports cannot be guessed by ID or shared publicly unless intended.
- Add a data deletion/export plan.
- Add backups or recovery process for production data.

## What Should Wait Until After Customer Feedback

Avoid these until the first pilot feedback cycle is complete:

- Full billing/subscriptions
- Complex multi-company/team management
- Advanced calendar integrations
- AI prediction/scoring
- Full vendor portal
- Complex analytics dashboards
- Heavy report customization
- Deep workflow automation
- Native mobile app rebuild

These may be valuable later, but the pilot should prove the core inspection/report/owner-trust loop first.

## Recommended Pilot Scope

Pilot with 1-3 friendly customers/properties.

Use the app for:

- onboarding one property
- completing a real inspection
- uploading real photos
- logging one maintenance issue if applicable
- generating a homeowner report
- reviewing owner feedback

Track feedback on:

- Was the inspection flow fast enough?
- Did the report feel professional enough to share?
- Did the homeowner understand the property condition quickly?
- Were any fields confusing?
- What did the operator still do outside the app?

## Definition of Pilot Ready

EstateIQ is pilot-ready when:

- Demo mode works after refresh and deploy.
- Admin, Inspector, and Homeowner views load reliably.
- A property can be saved.
- A mobile inspection can be completed in the field.
- Photos upload and display clearly.
- Maintenance issues can be saved with photos.
- PDF reports export reliably.
- No real/private demo data is exposed.
- Manual checklist passes.

## Current Recommendation

EstateIQ is ready for controlled demos and close to a small real customer pilot. Before entering real customer data, prioritize Supabase RLS/auth review and one full iPhone field test from property creation through PDF export.
