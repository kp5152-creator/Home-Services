# EstateIQ Architecture

EstateIQ is currently a Next.js application that supports a luxury home watch workflow: admin dashboard, mobile inspector flow, homeowner portal, property profiles, inspections, maintenance issues, vendors, scheduling, owner updates, photo uploads, and PDF report generation.

This document explains the current architecture and the recommended production SaaS path.

## Current Application Architecture

EstateIQ is a single Next.js codebase.

Current structure:

- `app/`: Next.js App Router pages, app shell, landing page, demo page, and web report page.
- `pages/api/`: API routes for properties, inspections, photos, maintenance issues, vendors, schedules, owner updates, analytics, feedback, health checks, and PDF reports.
- `components/`: Main application UI and shared screen-level components.
- `components/ui/`: Reusable design-system components.
- `services/`: Database access, Supabase client, analytics, feedback, and pilot helpers.
- `utils/`: Shared types, checklists, design tokens, and pure helpers.
- `reports/`: Demo report data and PDF report generation.
- `auth/`: Reserved for future authentication and authorization logic.
- `ai/`: Reserved for future AI feature logic.
- `data/`: Local JSON storage for early local/demo workflows.
- `public/`: Static assets, demo images, logo, PWA assets, and local upload output.

Runtime modes:

- Local/demo mode can use `data/db.json` and local uploads.
- Production mode is intended to use Supabase Postgres and Supabase Storage.
- Demo views are role-based UI flows for Admin, Inspector, and Homeowner.
- API routes are server-side and currently act as the main access layer.

Current deployment shape:

```text
Browser / PWA
  -> Next.js app routes and React UI
  -> Next.js API routes
  -> services/database.ts
  -> Supabase Postgres and Supabase Storage, or local JSON in local mode
```

## Database Structure

The current production database target is Supabase Postgres. The schema lives in `supabase/schema.sql`.

Current tables:

- `properties`
  - Core property profile.
  - Fields include property name, owner, address, phone, email, access notes, reference photo URL, and status.

- `inspections`
  - Home watch / inspection visit record.
  - Linked to `properties`.
  - Fields include timestamp, inspector name, interior temperature, checklist items, executive summary, notes, and urgent flag.

- `inspection_photos`
  - Metadata for photos attached to inspection reports.
  - Linked to `inspections`.
  - Stores file name, storage path, MIME type, and size.

- `maintenance_issues`
  - Property issues and maintenance items.
  - Linked to `properties`.
  - Fields include title, description, priority, status, vendor, and next step.

- `maintenance_issue_photos`
  - Metadata for photos attached to maintenance issues.
  - Linked to `maintenance_issues`.

- `vendors`
  - Vendor/service-provider contacts tied to a property.
  - Fields include vendor name, type, contact name, phone, email, and notes.

- `schedule_tasks`
  - Upcoming visits, cleaner appointments, vendor visits, and arrival/departure prep tasks.
  - Linked to `properties`.

- `owner_updates`
  - Homeowner-facing notes and updates.
  - Linked to `properties`.
  - Supports Draft, Shared, and Archived-style workflow.

Current relationships:

```text
properties
  -> inspections
    -> inspection_photos
  -> maintenance_issues
    -> maintenance_issue_photos
  -> vendors
  -> schedule_tasks
  -> owner_updates
```

Important current limitation:

The current schema does not yet include true SaaS tenant objects such as `organizations`, `users`, `roles`, `memberships`, or `property_access`. For production SaaS, those should be added before storing real customer data at scale.

Recommended production SaaS tables to add:

- `organizations`
  - One row per customer account, property management company, concierge team, or estate office.

- `organization_members`
  - Links authenticated users to organizations.
  - Stores role such as owner, admin, inspector, vendor, cleaner, or read-only.

- `property_members`
  - Optional property-level access control.
  - Useful when one homeowner owns multiple properties or one vendor should only see assigned properties.

- `audit_events`
  - Tracks sensitive activity: logins, report views, PDF downloads, photo uploads, property changes, owner update sharing, and permission changes.

- `report_shares`
  - Signed or expiring report links for homeowner/vendor sharing.

- `notification_events`
  - Email/SMS/push notification records and delivery status.

## Authentication System

Current state:

- Live app access can be protected by HTTP Basic Auth using `APP_USERNAME` and `APP_PASSWORD` in `middleware.ts`.
- Role selection in demo mode is UI-level only.
- Supabase is currently accessed from server-side API routes using `SUPABASE_SERVICE_ROLE_KEY`.
- Browser clients do not currently use full Supabase Auth sessions.
- The schema enables row level security and revokes direct table access from `anon` and `authenticated`.

This is acceptable for controlled demos and early internal testing, but it is not enough for production SaaS.

Production recommendation:

1. Add real user authentication.
   - Recommended: Supabase Auth or Clerk.
   - Supabase Auth is the simplest fit because the database and auth can share JWT claims and row level security.
   - Clerk is also strong if polished B2B organization management and user invitations are a priority.

2. Add role-based authorization.
   - Platform admin
   - Organization admin
   - Property manager
   - Inspector
   - Homeowner
   - Vendor
   - Cleaner
   - Read-only viewer

3. Enforce authorization server-side.
   - Every API route should verify the authenticated user.
   - Every write should verify the user can access the organization and property.
   - Do not rely on UI tabs or hidden buttons for security.

4. Add tenant isolation.
   - Every production business table should include `organization_id`.
   - Most property-specific tables should include both `organization_id` and `property_id`.

5. Use RLS policies.
   - The current service-role-only model is safe from browser exposure, but it centralizes authorization in API code.
   - Long-term, use Supabase RLS policies with authenticated users and organization/property claims.
   - Keep service role restricted to trusted server-only maintenance jobs.

## File and Photo Storage

Current state:

- Supabase Storage bucket: `inspection-photos`.
- Bucket is private.
- Inspection photos and maintenance issue photos are uploaded to Supabase Storage when Supabase is configured.
- Metadata is stored in `inspection_photos` and `maintenance_issue_photos`.
- Local development can use local uploaded files under `public/uploads`.
- Photo download endpoints proxy access through server-side API routes.

Current storage paths:

- Inspection photos are stored under inspection-specific folders.
- Maintenance photos are stored under maintenance issue folders.

Production recommendations:

- Keep buckets private.
- Serve photos through authenticated API routes or short-lived signed URLs.
- Add storage paths that include `organization_id` and `property_id`.
- Add maximum file size rules.
- Compress large uploads before storing.
- Generate thumbnails for UI views.
- Keep original images for reports and audit records.
- Strip image metadata if it may contain location or device information.
- Add lifecycle policies for archived customers.
- Add virus/malware scanning if vendors or homeowners can upload files.

Recommended future bucket structure:

```text
inspection-photos/
  organization_id/
    property_id/
      inspection_id/
        original/
        thumbnails/

maintenance-photos/
  organization_id/
    property_id/
      issue_id/
        original/
        thumbnails/

property-photos/
  organization_id/
    property_id/
      reference/
```

## AI Architecture

Current state:

- EstateIQ currently has AI-like drafting behavior in the UI, but no required live AI provider dependency.
- The `ai/` folder is reserved for future AI logic.
- `docs/product/AI_OPERATING_MANUAL.md` defines the product rules.
- AI output must be human-reviewed before becoming homeowner-facing.

Recommended AI roadmap:

1. Inspection summaries
   - Input: verified inspection facts.
   - Output: short homeowner-ready summary.

2. Maintenance recommendations
   - Input: issue title, description, priority, vendor type, photos metadata, and property context.
   - Output: suggested next step and vendor category.

3. Owner report drafting
   - Input: completed report and issue state.
   - Output: polished homeowner-facing note.

4. Issue prediction and scoring
   - Input: inspection history, recurring issues, seasonal patterns, property type, and unresolved items.
   - Output: stable, monitor, attention recommended, or urgent review.

Recommended technical shape:

```text
UI action
  -> API route
  -> services/aiClient.ts
  -> prompt builder with sanitized facts
  -> AI provider
  -> response validator
  -> draft saved as Draft
  -> human reviews and shares
```

Important AI rules:

- Do not send gate codes, alarm codes, lockbox codes, private access notes, or unnecessary personal data to AI providers.
- Do not let AI write directly to homeowner-facing Shared status.
- Do not allow AI to invent repairs, inspections, or property condition.
- Store AI drafts and approval status for auditability.
- Avoid homeowner-facing labels like "AI generated."
- AI should feel like a discreet estate manager, not a chatbot.

Recommended initial AI provider setup:

- Use OpenAI through server-side API routes only.
- Start with a cost-efficient model for summaries and drafting.
- Keep prompts short and fact-based.
- Add logging for token usage, but do not log sensitive input text unnecessarily.
- Add a feature flag so AI can be turned off during demos or incidents.

## Hosting Recommendations

Recommended production stack:

- Vercel for Next.js hosting.
- Supabase Pro for Postgres, Storage, Auth, and backups.
- Supabase Auth or Clerk for authentication.
- Resend or Postmark for transactional email.
- Sentry for error monitoring.
- Vercel Analytics or privacy-friendly analytics for product usage.
- OpenAI API for future AI summaries and drafting.
- Optional: Upstash Redis for rate limiting and background job coordination.

Why Vercel:

- Best fit for Next.js.
- Simple GitHub deployment flow.
- Preview deployments for reviewing UI changes.
- Good fit for early SaaS velocity.

Why Supabase:

- Managed Postgres.
- Integrated storage.
- Auth support.
- Easy local-to-production migration path.
- Strong enough for MVP and early production scale.

When to consider alternatives:

- If PDF generation becomes heavy, move report generation to background jobs.
- If photo volume becomes large, consider dedicated object storage/CDN strategy.
- If enterprise compliance becomes required, evaluate Supabase Team/Enterprise, AWS, or a managed HIPAA/SOC2 posture.

## Production Deployment Plan

Phase 1: Stabilize current SaaS foundation

- Keep Vercel + Supabase.
- Confirm `/api/health` returns healthy.
- Confirm Supabase schema and grants are current.
- Confirm private storage bucket is reachable.
- Keep `APP_PASSWORD` until real auth is in place.
- Keep demo mode protected and free of real customer data.

Phase 2: Add production authentication

- Choose Supabase Auth or Clerk.
- Add users and organizations.
- Add roles and property-level permissions.
- Protect every API route with authenticated identity.
- Remove reliance on Basic Auth as the main security layer.

Phase 3: Add tenant-aware schema

- Add `organizations`.
- Add `organization_members`.
- Add `organization_id` to production tables.
- Backfill existing data into a default organization.
- Add RLS policies.
- Add audit logs.

Phase 4: Harden storage and reports

- Add signed URLs or authenticated media proxy rules.
- Add thumbnails.
- Protect report pages and PDF endpoints.
- Add expiring report share links.
- Add PDF generation logging.

Phase 5: Add operations reliability

- Error monitoring.
- Uptime monitoring.
- Database backups and restore tests.
- Rate limiting.
- Email notifications.
- Admin audit trail.

Phase 6: Add AI carefully

- Add server-side AI client.
- Add summary drafting endpoint.
- Save AI output as Draft only.
- Add human approval workflow.
- Add redaction/sanitization of sensitive fields.

## Backup Strategy

Current baseline:

- Supabase Pro includes daily backups retained for 7 days.
- Local JSON files are useful for development only and should not be treated as production backup.

Recommended production backup plan:

Database:

- Use Supabase automated daily backups.
- Add weekly manual backup exports.
- Test restore process quarterly.
- Export critical tables before major migrations.
- Keep migration files in Git.

Photos and files:

- Supabase Storage should be private and backed by the provider.
- Add periodic storage inventory export.
- Consider replicating storage to another bucket/provider once real customer photo volume grows.
- Keep database photo metadata and storage paths consistent.

Application code:

- GitHub is the source of truth.
- Use protected branches once real customers are live.
- Keep production deployments tagged or associated with Git commits.

Operational recovery:

- Document how to restore database.
- Document how to rotate service keys.
- Document how to disable AI.
- Document how to disable public report links.
- Document how to put the app into read-only mode if needed.

Recommended recovery targets:

- MVP / early pilot: restore within 24 hours.
- Paid production: restore within 4-8 hours.
- Enterprise: restore within 1-4 hours with formal SLA.

## Security Considerations

Current strengths:

- Supabase tables have RLS enabled.
- Direct `anon` and `authenticated` table access is revoked.
- Service role key is only intended for server-side API routes.
- Storage bucket is private.
- Basic Auth can protect the app while real auth is not finished.

Current risks before production SaaS:

- Role switching is currently UI-level in demo mode.
- Basic Auth is not a true customer account system.
- API routes need authenticated user and permission checks.
- Tables do not yet include `organization_id`.
- Report URLs should be protected by auth or signed links.
- Photo access needs property-level authorization.
- Access notes may contain sensitive security information.
- AI should not receive sensitive property access data.

Required before real customer scale:

- Add real authentication.
- Add tenant isolation.
- Add role and property-level authorization.
- Add RLS policies that match the SaaS model.
- Protect reports and photos.
- Add audit logs.
- Add rate limiting on write endpoints and auth endpoints.
- Add monitoring for failed login attempts.
- Add secure secret rotation process.
- Add data retention policy.
- Add privacy policy and terms of service.
- Add incident response checklist.

Sensitive data policy:

- Treat addresses, owner contact details, access notes, photos, schedules, vendor contacts, and reports as private customer data.
- Do not commit real customer data to Git.
- Do not include real access codes in demo data.
- Do not send access codes to AI providers.

## Estimated Monthly Infrastructure Costs

These are planning estimates, not guaranteed bills. Pricing changes over time and usage patterns matter.

Pricing assumptions as of May 2026:

- Supabase Pro starts at about `$25/month`, includes 8 GB database disk, 100 GB file storage, 250 GB egress, and 7-day daily backups.
- Supabase Team starts around `$599/month` and adds stronger team/security/compliance controls.
- Vercel Pro is commonly planned at about `$20/month per seat`, with usage-based overages possible.
- OpenAI API costs depend on selected model and token usage. For lightweight summary drafting, budget can start small, but should be tracked.
- Email, monitoring, and backup add-ons are included as estimated ranges.

Sources for current pricing references:

- Supabase pricing: https://supabase.com/pricing
- Vercel pricing: https://vercel.com/pricing
- OpenAI API model pricing: https://platform.openai.com/docs/models

Assumed customer profile:

- One customer may be a homeowner, property manager, or concierge operator.
- Average 3-10 properties per customer in early SaaS.
- Photos are the main scaling cost.
- AI usage is optional and human-reviewed.

### 10 Customers

Recommended stack:

- Vercel Pro
- Supabase Pro
- Basic monitoring
- Basic transactional email
- Light AI usage

Estimated monthly cost:

```text
Low:  $60/month
High: $150/month
```

Likely breakdown:

- Vercel: `$20-$40`
- Supabase: `$25-$50`
- Email: `$0-$20`
- Monitoring: `$0-$30`
- AI: `$5-$20`
- Miscellaneous: `$10-$30`

Notes:

- Supabase Pro should be enough.
- File storage should remain comfortably within included limits unless photos are very large.
- This is a good pilot/early paid customer tier.

### 50 Customers

Recommended stack:

- Vercel Pro with team seats as needed.
- Supabase Pro.
- Sentry or equivalent monitoring.
- Transactional email provider.
- Light-to-moderate AI usage.

Estimated monthly cost:

```text
Low:  $150/month
High: $400/month
```

Likely breakdown:

- Vercel: `$40-$100`
- Supabase: `$25-$125`
- Email: `$10-$50`
- Monitoring: `$25-$80`
- AI: `$20-$75`
- Miscellaneous/backups: `$30-$75`

Notes:

- Supabase Pro likely still works.
- Watch photo storage and egress.
- Add better observability by this stage.
- Strong auth and tenant separation should already be complete.

### 100 Customers

Recommended stack:

- Vercel Pro.
- Supabase Pro with possible compute/storage upgrades.
- Sentry or equivalent.
- Transactional email.
- AI budget controls.
- Optional background job provider.

Estimated monthly cost:

```text
Low:  $300/month
High: $900/month
```

Likely breakdown:

- Vercel: `$80-$200`
- Supabase: `$75-$300`
- Email: `$25-$100`
- Monitoring/logging: `$50-$150`
- AI: `$50-$200`
- Background jobs/backups/miscellaneous: `$50-$150`

Notes:

- This is where usage patterns start to matter.
- Optimize image sizes and thumbnails.
- Monitor database query performance.
- Add indexes around `organization_id`, `property_id`, timestamps, and statuses.
- Consider customer-facing uptime expectations.

### 500 Customers

Recommended stack:

- Vercel Pro or Enterprise depending on contract/security needs.
- Supabase Team or Enterprise if compliance, SSO, SLAs, or stronger support are needed.
- Dedicated monitoring/logging.
- Background job queue.
- More formal backup/restore process.
- AI usage controls and monthly caps.

Estimated monthly cost:

```text
Low:  $1,200/month
High: $4,500+/month
```

Likely breakdown:

- Vercel: `$250-$1,000+`
- Supabase: `$300-$1,500+`
- Email/SMS: `$100-$500`
- Monitoring/logging: `$150-$600`
- AI: `$200-$1,000+`
- Backups/background jobs/security tools: `$200-$900`

Notes:

- Supabase Team may be justified for security controls and longer log retention.
- If large photo volume is common, storage and egress can become the main cost.
- Consider separating media storage/CDN from application database.
- Add formal SLA, support, incident response, and disaster recovery plans.
- Consider enterprise auth/SSO for property management companies.

## Production Readiness Checklist

Before storing real production customer data at scale:

- Real auth is implemented.
- Tenant-aware schema is implemented.
- RLS policies are tested.
- API routes verify user permissions.
- Reports are protected by auth or signed links.
- Photos are private and access-controlled.
- Audit logging exists.
- Backups are tested.
- Error monitoring is active.
- Secrets are rotated and documented.
- Demo mode cannot leak real customer data.
- AI cannot access sensitive access notes.
- Terms, privacy policy, and customer data retention policy are ready.

## Recommended Near-Term Next Steps

1. Add `organizations` and `organization_members`.
2. Add `organization_id` to every production table.
3. Choose Supabase Auth or Clerk.
4. Protect every API route with real authorization.
5. Protect report and photo routes.
6. Add audit logging.
7. Add image thumbnail generation and upload limits.
8. Add Sentry or equivalent monitoring.
9. Add a first AI summary endpoint only after auth and data protection are in place.
