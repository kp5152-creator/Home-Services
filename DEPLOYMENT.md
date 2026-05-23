# Deploying Desert Estate Watch

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
- private storage bucket: `inspection-photos`

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
```

Use the same values for Production, Preview, and Development.

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

1. Add a property.
2. Create an inspection.
3. Upload one or two photos.
4. Save the inspection.
5. Open Export Report.
6. Use Print / Save PDF.

If photos do not show, check that `SUPABASE_SERVICE_ROLE_KEY` is set correctly in Vercel.
