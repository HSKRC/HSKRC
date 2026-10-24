alter table public.people_submissions
  add column if not exists country text,
  add column if not exists affiliation text,
  add column if not exists alternate_names text[] not null default '{}',
  add column if not exists service_areas text[] not null default '{}';

grant insert (country, affiliation, alternate_names, service_areas)
  on public.people_submissions to anon;
grant select (country, affiliation, alternate_names, service_areas)
  on public.people_submissions to authenticated;
grant update (country, affiliation, alternate_names, service_areas)
  on public.people_submissions to authenticated;

drop policy if exists "Public view approved people directory" on public.people_submissions;
create policy "Public view approved people directory"
  on public.people_submissions for select to anon, authenticated
  using (status = 'approved');

create or replace view public.people_directory_public
with (security_invoker = true)
as
select id, full_name, alternate_names, category, life_dates, country, region,
       affiliation, service_areas, short_bio, why_notable, sources, created_at
from public.people_submissions
where status = 'approved';

grant select on public.people_directory_public to anon, authenticated;
grant select (id, full_name, alternate_names, category, life_dates, country, region,
              affiliation, service_areas, short_bio, why_notable, sources, created_at)
  on public.people_submissions to anon, authenticated;
