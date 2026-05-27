select
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  has_table_privilege('anon', format('%I.%I', schemaname, tablename), 'select') as anon_can_select,
  has_table_privilege('authenticated', format('%I.%I', schemaname, tablename), 'select') as authenticated_can_select,
  has_table_privilege('service_role', format('%I.%I', schemaname, tablename), 'select') as service_role_can_select,
  has_table_privilege('service_role', format('%I.%I', schemaname, tablename), 'insert') as service_role_can_insert,
  has_table_privilege('service_role', format('%I.%I', schemaname, tablename), 'update') as service_role_can_update,
  has_table_privilege('service_role', format('%I.%I', schemaname, tablename), 'delete') as service_role_can_delete
from pg_tables
where schemaname = 'public'
  and tablename in (
    'properties',
    'inspections',
    'inspection_photos',
    'maintenance_issues',
    'maintenance_issue_photos',
    'vendors',
    'schedule_tasks',
    'owner_updates'
  )
order by tablename;

select
  id,
  name,
  public as bucket_is_public
from storage.buckets
where id = 'inspection-photos';
