# EstateIQ Founder Guide

This guide explains EstateIQ in plain English for a non-technical founder or CEO.

The goal is to help you understand how the product works, how it should be operated, what can break, what needs monitoring, and how the company can scale from demo/pilot mode into a real production SaaS platform.

## The Simple Version

EstateIQ is a luxury property operations platform.

It helps a property manager, inspector, concierge team, or homeowner:

1. Create a property profile.
2. Add homeowner and access details.
3. Upload a reference photo of the home.
4. Perform inspections.
5. Record issues.
6. Add vendors.
7. Schedule future visits.
8. Generate homeowner-ready reports.
9. Share owner updates.
10. Build a long-term service history for each property.

The product should feel like a trusted estate manager: calm, polished, accurate, and discreet.

## How EstateIQ Works From Start To Finish

A normal EstateIQ workflow looks like this:

1. A property is created.
   - Name
   - Address
   - Homeowner
   - Phone
   - Email
   - Access notes
   - Reference photo

2. The property appears on the Home screen.
   - The operator can quickly see the properties being managed.
   - The property photo helps confirm the correct home.

3. The operator opens the selected property.
   - This shows the property profile.
   - It includes contact buttons, status, access notes, saved visits, and open items.

4. The inspector starts an inspection.
   - Selects inspection type.
   - Enters inspector name.
   - Enters interior temperature.
   - Completes checklist.
   - Adds notes and photos.
   - Marks urgent if needed.

5. EstateIQ saves the inspection.
   - The visit record is stored in the database.
   - Photos are stored separately in file storage.
   - Photo references are linked back to the inspection.

6. EstateIQ generates a report.
   - Web report is available in the app.
   - PDF report can be downloaded.
   - The report is designed for homeowner review.

7. Issues are managed.
   - Open issues can be added.
   - Priority and status can be tracked.
   - Vendor and next step can be assigned.

8. Future visits are scheduled.
   - Home watch visits
   - Vendor visits
   - Cleaner visits
   - Arrival prep
   - Checkout follow-up

9. Owner updates are created.
   - Admin or operator can draft a homeowner note.
   - Updates can remain draft or be shared.
   - The Owner tab stays simple for the homeowner.

10. Over time, EstateIQ becomes the service record for the home.
    - Inspection history
    - Reports
    - Photos
    - Issues
    - Vendor notes
    - Owner updates
    - Schedule history

## How Users Are Created

Current state:

EstateIQ does not yet have full production user accounts.

Today, the app uses:

- Demo role selection for Admin, Inspector, and Homeowner views.
- Basic password protection for the live app if `APP_PASSWORD` is set.
- Server-side access to the database using a private Supabase service key.

What this means:

- The current setup is good for demos and controlled pilots.
- It is not the final customer login system.
- Before real scale, EstateIQ needs true user accounts, roles, and permissions.

Production version:

Users should be created through an authentication system such as Supabase Auth or Clerk.

Future user types:

- EstateIQ platform admin
- Company admin
- Property manager
- Inspector
- Homeowner
- Vendor
- Cleaner
- Read-only viewer

In production, each user should belong to an organization or property.

Example:

```text
Acme Property Management
  -> Admin user
  -> Inspector users
  -> Vendor users
  -> Properties
  -> Homeowner users
```

The CEO-level takeaway:

Do not treat the current demo roles as production security. Real customer accounts and permissions are a required production step.

## How Inspections Are Stored

When an inspection is completed, EstateIQ stores the inspection record in the database.

An inspection includes:

- Property
- Date and time
- Inspector name
- Interior temperature
- Inspection type
- Completed checklist items
- Notes
- Executive summary
- Urgent issue flag
- Attached photos

The inspection itself is stored as structured data.

The photos are not stored directly inside the inspection record. Instead:

- Photo files go into storage.
- Photo metadata goes into the database.
- The inspection record points to those photos.

This is the right approach because photos can be large and databases should not be overloaded with raw image files.

## How Reports Are Generated

EstateIQ currently supports two report experiences:

1. Web report
   - Opens in the browser.
   - Good for quick viewing.

2. PDF report
   - Downloadable.
   - Better for homeowner sharing, records, and professional presentation.

The report is generated from:

- Property profile
- Inspection details
- Checklist
- Notes
- Photos
- Urgent flag
- Executive summary

The PDF report is generated on the server.

The report should remain:

- concise
- homeowner-friendly
- polished
- calm
- not overloaded

CEO-level rule:

Reports are one of the most important trust signals in EstateIQ. They should feel like something a luxury estate manager would confidently send to an affluent homeowner.

## Where Photos Are Stored

Current production target:

- Supabase Storage

Current bucket:

```text
inspection-photos
```

The bucket is private.

Photo categories:

- Property reference photos
- Inspection photos
- Maintenance issue photos

How it works:

1. User uploads a photo.
2. EstateIQ sends the photo to storage.
3. EstateIQ stores photo metadata in the database.
4. Reports and screens load the photo through controlled app routes.

Production recommendation:

Photos should stay private.

Future storage should be organized by:

```text
Customer / Organization
  -> Property
    -> Inspection or Issue
      -> Photos
```

CEO-level risk:

Photos may show private homes, vehicles, addresses, personal belongings, security systems, gates, or access points. Treat photos as sensitive customer data.

## How AI Summaries Work

Current state:

EstateIQ has AI-like summary drafting concepts, but it does not yet rely on a live AI provider for core operation.

This is good for demo reliability.

The codebase now has a server-side AI provider boundary, but it stays off unless `ESTATEIQ_AI_ENABLED=true` and a valid `OPENAI_API_KEY` are intentionally configured.

Future AI should help with:

- inspection summaries
- maintenance recommendations
- homeowner update drafts
- report language
- issue prioritization

AI should never replace the inspector or property manager.

AI should draft. Humans approve.

Good AI behavior:

- concise
- calm
- accurate
- homeowner-ready
- based only on verified facts

Bad AI behavior:

- making things up
- sounding robotic
- overpromising
- hiding urgent issues
- exposing private access details

Sensitive information that should not be sent to AI:

- gate codes
- alarm codes
- lockbox codes
- private access notes
- unnecessary homeowner personal details
- sensitive security observations

CEO-level takeaway:

AI should make EstateIQ feel more premium and professional, not more automated or risky.

## How Authentication Works

Current state:

EstateIQ currently has basic app-level protection.

If `APP_PASSWORD` is set, the app asks for a username and password before allowing access.

This is simple protection, not full SaaS authentication.

Production authentication should include:

- real user accounts
- email/password or magic links
- password reset
- organization membership
- role permissions
- property-level access
- session management
- audit logs

Important distinction:

Authentication means:

```text
Who are you?
```

Authorization means:

```text
What are you allowed to see or change?
```

EstateIQ needs both before real customer scale.

## How Data Is Backed Up

Current production target:

- Supabase database
- Supabase storage
- GitHub code repository

Supabase Pro includes daily backups with retention.

What should be backed up:

- database records
- uploaded photos
- report metadata
- customer/property data
- app source code
- environment variable documentation

Recommended backup process:

- Keep code in GitHub.
- Use Supabase automatic backups.
- Export database before major migrations.
- Test restores quarterly.
- Keep storage bucket inventory.
- Document how to rotate keys.
- Document how to recover from accidental deletion.

CEO-level takeaway:

A backup does not count unless the team has tested restoring it.

## How The Platform Scales

EstateIQ scales in layers.

At small size:

- One Next.js app
- One Supabase project
- One storage bucket
- One Vercel deployment

At medium size:

- Real auth
- Organization accounts
- Role-based access
- Better monitoring
- Better photo optimization
- More structured database indexes

At larger size:

- Background jobs
- Dedicated report generation queue
- Better image compression
- Advanced audit logs
- More formal backup process
- Stronger compliance posture
- Possibly Supabase Team or Enterprise

What will drive scale cost:

1. Number of photos.
2. Number of properties.
3. Number of reports generated.
4. Number of active users.
5. AI usage.
6. Traffic to reports/photos.

EstateIQ is not likely to be database-heavy at first. It is more likely to become photo-storage-heavy.

## How Deployments Work

Current deployment model:

1. Code is edited locally.
2. Changes are committed to Git.
3. Code is pushed to GitHub.
4. Vercel detects the change.
5. Vercel builds and deploys the app.
6. The live site updates.

Recommended production flow:

```text
Local development
  -> Git commit
  -> GitHub branch
  -> Vercel preview deployment
  -> review
  -> merge to main
  -> production deployment
```

Before deploying:

- Run TypeScript check.
- Run production build.
- Review main workflows.
- Confirm reports still generate.
- Confirm photos still upload.
- Confirm `/api/health` is healthy.

CEO-level rule:

Never deploy major workflow changes right before an important demo without testing the demo path.

## What Could Break

Common things that could break:

- App will not load.
- Login/password protection misconfigured.
- Supabase environment variables missing.
- Storage bucket missing or misnamed.
- Photo uploads fail.
- PDF report generation fails.
- Report links show 404.
- API route has a permission or data error.
- Demo mode accidentally writes to real data.
- Mobile layout becomes cluttered.
- Service worker caches an old app version.
- AI output is wrong or too confident.
- Database migration changes a table unexpectedly.

High-impact things:

- Real customer data exposed.
- Photos accessible without permission.
- Reports shared with the wrong homeowner.
- Access notes leaked.
- Database deleted or corrupted.
- Production deployment breaks inspections during field use.

## What Needs Monitoring

EstateIQ should monitor:

- App uptime
- API errors
- Failed logins
- Photo upload failures
- PDF generation failures
- Database connection errors
- Supabase storage errors
- Report download errors
- Slow pages
- AI request failures
- Unusual traffic
- Storage growth
- Database growth
- Monthly infrastructure cost

Recommended tools:

- Vercel dashboard
- Supabase dashboard
- Sentry or similar error monitoring
- Uptime monitoring
- Basic analytics
- Monthly cost review

CEO-level dashboard should answer:

- Is the app up?
- Are customers able to log in?
- Are inspections being saved?
- Are photos uploading?
- Are reports generating?
- Are costs normal?
- Are there security alerts?

## How New Customers Are Onboarded

Current manual onboarding process:

1. Create or identify the customer account.
2. Add their properties.
3. Add homeowner contact details.
4. Add property reference photos.
5. Add access notes carefully.
6. Add vendors if known.
7. Add upcoming scheduled visits.
8. Invite users once auth exists.
9. Run a test inspection.
10. Generate a sample report.
11. Review the homeowner portal.
12. Confirm the customer approves the workflow.

Future SaaS onboarding:

1. Customer signs up.
2. Customer creates organization.
3. Customer adds team members.
4. Customer adds properties.
5. Customer invites homeowners.
6. Customer uploads property photos.
7. Customer sets inspection schedule.
8. EstateIQ guides first inspection.
9. Customer generates first report.
10. Customer activates billing.

White-glove onboarding option:

For luxury customers, EstateIQ should offer done-for-you setup.

This could include:

- importing property list
- uploading property photos
- adding vendors
- configuring inspection templates
- training inspectors
- reviewing first homeowner report

CEO-level note:

For this market, onboarding is part of the product experience. It should feel concierge-level, not self-serve chaos.

## How Payments Will Eventually Be Collected

Current state:

Payments are not yet built into the application.

Recommended payment provider:

- Stripe

Possible pricing models:

1. Per property per month
   - Simple and aligned with customer value.

2. Per organization plus property tiers
   - Good for property managers and concierge firms.

3. Premium concierge plan
   - Higher price for white-glove onboarding, custom reports, and dedicated support.

4. Usage-based add-ons
   - Extra photo storage
   - Extra AI usage
   - Extra report volume
   - SMS notifications

Suggested early pricing structure:

```text
Starter:  up to 5 properties
Growth:   up to 25 properties
Pro:      up to 100 properties
Custom:   larger property managers and concierge teams
```

Payment workflow eventually:

1. Customer signs up.
2. Customer chooses plan.
3. Stripe creates subscription.
4. EstateIQ stores subscription status.
5. App limits or unlocks features based on plan.
6. Failed payment triggers email warning.
7. Long unpaid accounts are paused, not deleted.

CEO-level rule:

Do not build complex billing too early. Start simple, but make sure every customer is attached to an organization and subscription status.

## Monthly Infrastructure Costs To Expect

These are planning estimates. Actual cost depends mostly on photos, traffic, users, AI usage, and support tools.

### 10 Customers

Expected range:

```text
$60-$150/month
```

Likely tools:

- Vercel Pro
- Supabase Pro
- Basic email
- Light monitoring
- Light AI

Founder interpretation:

This is pilot/early customer territory. Costs should be manageable.

### 50 Customers

Expected range:

```text
$150-$400/month
```

Likely tools:

- Vercel Pro
- Supabase Pro
- Transactional email
- Error monitoring
- Moderate photo storage
- Light-to-moderate AI

Founder interpretation:

This is where monitoring and real auth should already be in place.

### 100 Customers

Expected range:

```text
$300-$900/month
```

Likely tools:

- Vercel Pro
- Supabase Pro with possible storage/compute add-ons
- Monitoring
- Email
- AI budget controls
- Backup review process

Founder interpretation:

At this stage, the business should track gross margin per customer and photo storage per property.

### 500 Customers

Expected range:

```text
$1,200-$4,500+/month
```

Likely tools:

- Vercel Pro or Enterprise
- Supabase Team or upgraded Pro
- More storage
- More monitoring/logging
- Background jobs
- Higher AI usage
- Stronger support tooling

Founder interpretation:

At this stage, infrastructure is still likely affordable if pricing is healthy, but photo storage, report traffic, and support expectations must be managed carefully.

## CEO Operating Checklist

Daily:

- Confirm app is live.
- Confirm no critical errors.
- Confirm inspections and reports are working.

Weekly:

- Review customer feedback.
- Review failed uploads or report errors.
- Review product usage.
- Review support issues.
- Review demo mode.

Monthly:

- Review infrastructure spend.
- Review storage growth.
- Review active customers and properties.
- Review churn risk.
- Review backup status.
- Review security posture.

Before every major demo:

- Start demo fresh.
- Confirm demo mode loads.
- Confirm reports open.
- Confirm PDF downloads.
- Confirm mobile view.
- Do not rely on untested new features.

Before onboarding real customers:

- Confirm real authentication.
- Confirm customer data separation.
- Confirm photo security.
- Confirm backups.
- Confirm report privacy.
- Confirm support process.

## The Most Important Founder Decisions

1. Choose the first real customer type.
   - Homeowners?
   - Property managers?
   - Concierge teams?
   - Short-term rental operators?

2. Choose the pricing model.
   - Per property is likely easiest to understand.

3. Decide how white-glove onboarding should be.
   - EstateIQ’s brand suggests onboarding should be high-touch.

4. Decide how much AI should be visible.
   - Keep AI behind the scenes.
   - Sell trust, not automation.

5. Decide when the product is production-ready.
   - Real auth and data security should come before broad customer data.

## Plain-English Summary

EstateIQ works by turning property visits into organized, homeowner-ready records.

The inspector captures the facts. EstateIQ stores the data, organizes photos, tracks issues, schedules next steps, and generates reports. The homeowner gets a calm, professional view instead of operational noise.

The current product is strong for demos and controlled pilots. To become a production SaaS company, the next major step is not more visual polish. It is real authentication, customer accounts, data separation, protected reports, protected photos, monitoring, backups, and eventually billing.

The company should scale carefully:

```text
First: trusted workflow
Then: secure customer accounts
Then: repeatable onboarding
Then: paid subscriptions
Then: AI assistance
Then: larger property operations platform
```

EstateIQ should always feel like a trusted estate manager, not generic software.
