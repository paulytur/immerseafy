-- Seed coach availability: run AFTER migration 008
-- Safe to re-run — skips duplicates

insert into public.coach_availability (coach_id, date)
select c.id, d.date
from public.coaches c
cross join (
  values
    ('2026-07-11'::date),
    ('2026-07-12'::date),
    ('2026-07-19'::date),
    ('2026-07-20'::date),
    ('2026-07-26'::date),
    ('2026-07-27'::date)
) as d(date)
where c.slug in ('paul-yturzaita', 'dominic-rivera', 'j-lyn-guevarra')
on conflict (coach_id, date) do nothing;

-- Extra certification weekend — Paul only
insert into public.coach_availability (coach_id, date)
select c.id, d.date
from public.coaches c
cross join (values ('2026-08-01'::date), ('2026-08-15'::date)) as d(date)
where c.slug = 'paul-yturzaita'
on conflict (coach_id, date) do nothing;
