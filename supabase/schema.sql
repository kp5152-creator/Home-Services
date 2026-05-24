create table if not exists public.properties (
  id text primary key,
  created_at timestamptz not null default now(),
  name text not null,
  owner text not null,
  address text not null,
  phone text,
  email text,
  access_notes text,
  status text not null default 'Active'
);

create table if not exists public.inspections (
  id text primary key,
  created_at timestamptz not null default now(),
  property_id text not null references public.properties(id) on delete cascade,
  timestamp timestamptz not null,
  inspector_name text not null,
  interior_temperature text not null,
  checklist text[] not null default '{}',
  notes text not null default '',
  urgent text not null default 'No'
);

create table if not exists public.inspection_photos (
  id text primary key,
  created_at timestamptz not null default now(),
  inspection_id text not null references public.inspections(id) on delete cascade,
  name text not null,
  storage_path text not null,
  mime_type text not null default 'image/jpeg',
  size integer not null default 0
);

create table if not exists public.maintenance_issues (
  id text primary key,
  created_at timestamptz not null default now(),
  property_id text not null references public.properties(id) on delete cascade,
  title text not null,
  description text not null default '',
  priority text not null default 'Medium',
  status text not null default 'Open',
  vendor text not null default '',
  next_step text not null default ''
);

create table if not exists public.maintenance_issue_photos (
  id text primary key,
  created_at timestamptz not null default now(),
  issue_id text not null references public.maintenance_issues(id) on delete cascade,
  name text not null,
  storage_path text not null,
  mime_type text not null default 'image/jpeg',
  size integer not null default 0
);

insert into storage.buckets (id, name, public)
values ('inspection-photos', 'inspection-photos', false)
on conflict (id) do nothing;

alter table public.properties enable row level security;
alter table public.inspections enable row level security;
alter table public.inspection_photos enable row level security;
alter table public.maintenance_issues enable row level security;
alter table public.maintenance_issue_photos enable row level security;

-- The app uses SUPABASE_SERVICE_ROLE_KEY from server-side API routes.
-- No public browser access policies are required for this first version.
