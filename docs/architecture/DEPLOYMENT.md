# Deploying EstateIQ

This app can run two ways:

- Local testing: uses `data/db.json` and local uploaded files.
- Deployed: uses Supabase database and Supabase Storage.

## 1. Supabase Setup

1. Open Supabase.
2. Open your project.
3. Go to SQL Editor.
4. Paste the contents of `supabase/schema.sql`.
5. Run it.

This creates:

- `properties`
- `inspections`
- `inspection_photos`
- `maintenance_issues`
- `maintenance_issue_photos`
- `vendors`
- `schedule_tasks`
- `owner_updates`
- private storage bucket: `inspection-photos`

The schema also enables row level security and grants Data API access to `service_role` only. EstateIQ currently talks to Supabase through server-side API routes using `SUPABASE_SERVICE_ROLE_KEY`, so `anon` and `authenticated` table access should stay locked down until browser auth and RLS policies are intentionally designed.

Supabase is changing new `public` table behavior so Data API access requires explicit grants. Keep future table migrations aligned with the grant block at the bottom of `supabase/schema.sql`.

After running the schema, you can paste `supabase/security-audit.sql` into the SQL Editor to confirm:

- RLS is enabled on EstateIQ tables.
- `service_role` can select, insert, update, and delete.
- `anon` and `authenticated` cannot select these tables yet.
- The `inspection-photos` storage bucket is not public.

## 2. Supabase Environment Values

In Supabase, go to Project Settings, then API.

Copy:

- Project URL
- service_role key

Keep the service role key private. Do not put it in browser code.

## 3. Vercel Environment Variables

In Vercel, open your project, then Settings, then Environment Variables.

Add:

```text
SUPABASE_URL=your Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=your Supabase service role key
SUPABASE_STORAGE_BUCKET=inspection-photos
APP_USERNAME=admin
APP_PASSWORD=choose-a-strong-password
```

Use the same values for Production, Preview, and Development.

`APP_PASSWORD` turns on password protection for the live app. Choose something private before adding real homeowner data.

Optional future AI variables:

```text
ESTATEIQ_AI_ENABLED=false
OPENAI_API_KEY=leave blank until live AI is intentionally enabled
```

EstateIQ's current Co-Pilot and maintenance recommendation helpers are rules-assisted and do not require these variables. Keep `ESTATEIQ_AI_ENABLED=false` during pilots unless live provider-backed AI has been intentionally connected, tested, and budgeted.

## 4. Deploy

1. Push the project to GitHub.
2. Import the GitHub repo into Vercel.
3. Vercel should detect Next.js automatically.
4. Click Deploy.

After deployment, Vercel will give you a URL like:

```text
https://your-project-name.vercel.app
```

## 5. First Live Test

On the live URL:

1. Open `/api/health` and confirm `ok` is `true`.
   - During pilots, `ai.enabled` should normally be `false`.
2. Add a property.
3. Create an inspection.
4. Upload one or two photos.
5. Save the inspection.
6. Open the report.
7. Download the PDF.
8. Add an issue, vendor, schedule item, and owner update.

If photos do not show, check that `SUPABASE_SERVICE_ROLE_KEY` is set correctly in Vercel.

Route safety checks:

- Slow landing, app, or report loads should show branded EstateIQ loading screens.
- App or report route failures should show branded EstateIQ recovery screens with Try Again, App/Home, and Health actions.
- Bad links should show the branded EstateIQ not-found page, not a generic framework page.
