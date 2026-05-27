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
  executive_summary text not null default '',
  notes text not null default '',
  urgent text not null default 'No'
);

alter table public.inspections
add column if not exists executive_summary text not null default '';

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

create table if not exists public.vendors (
  id text primary key,
  created_at timestamptz not null default now(),
  property_id text not null references public.properties(id) on delete cascade,
  name text not null,
  type text not null default 'Other',
  contact_name text not null default '',
  phone text not null default '',
  email text not null default '',
  notes text not null default ''
);

create table if not exists public.schedule_tasks (
  id text primary key,
  created_at timestamptz not null default now(),
  property_id text not null references public.properties(id) on delete cascade,
  scheduled_for timestamptz not null,
  type text not null default 'Home Watch',
  title text not null,
  status text not null default 'Scheduled',
  assigned_to text not null default '',
  notes text not null default ''
);

create table if not exists public.owner_updates (
  id text primary key,
  created_at timestamptz not null default now(),
  property_id text not null references public.properties(id) on delete cascade,
  category text not null default 'General',
  title text not null,
  message text not null default '',
  status text not null default 'Draft'
);

insert into storage.buckets (id, name, public)
values ('inspection-photos', 'inspection-photos', false)
on conflict (id) do update set public = false;

alter table public.properties enable row level security;
alter table public.inspections enable row level security;
alter table public.inspection_photos enable row level security;
alter table public.maintenance_issues enable row level security;
alter table public.maintenance_issue_photos enable row level security;
alter table public.vendors enable row level security;
alter table public.schedule_tasks enable row level security;
alter table public.owner_updates enable row level security;

revoke all on table public.properties from anon, authenticated;
revoke all on table public.inspections from anon, authenticated;
revoke all on table public.inspection_photos from anon, authenticated;
revoke all on table public.maintenance_issues from anon, authenticated;
revoke all on table public.maintenance_issue_photos from anon, authenticated;
revoke all on table public.vendors from anon, authenticated;
revoke all on table public.schedule_tasks from anon, authenticated;
revoke all on table public.owner_updates from anon, authenticated;

grant usage on schema public to service_role;

grant select, insert, update, delete on table public.properties to service_role;
grant select, insert, update, delete on table public.inspections to service_role;
grant select, insert, update, delete on table public.inspection_photos to service_role;
grant select, insert, update, delete on table public.maintenance_issues to service_role;
grant select, insert, update, delete on table public.maintenance_issue_photos to service_role;
grant select, insert, update, delete on table public.vendors to service_role;
grant select, insert, update, delete on table public.schedule_tasks to service_role;
grant select, insert, update, delete on table public.owner_updates to service_role;

alter default privileges in schema public
grant select, insert, update, delete on tables to service_role;

alter default privileges in schema public
revoke all on tables from anon, authenticated;

-- EstateIQ uses SUPABASE_SERVICE_ROLE_KEY from server-side API routes.
-- Do not grant anon/authenticated table access until browser auth and RLS policies are designed.
