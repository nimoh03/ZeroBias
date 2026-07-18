-- Run this against your Supabase project (SQL editor or `supabase db push`).
-- Adds job-level default interview time/link slots (so Nova can offer the
-- same set of times to every candidate who qualifies, without the recruiter
-- re-scheduling one-by-one on the candidates page) and formalizes "paused"
-- as a job status.

-- 1. Job-level default interview slots. Same shape as candidates.interview_slots
--    ({id, time, link}[]) minus the id — ids are minted per-candidate the
--    moment they qualify, so re-editing the template later never mutates a
--    slot a candidate already booked.
alter table public.jobs
  add column if not exists interview_slots_template jsonb not null default '[]'::jsonb;

-- 2. jobs.status was always a free-text column with no CHECK constraint, so
--    'paused' works with zero migration risk. This just documents/enforces
--    the allowed values going forward. Drop + recreate so re-running this
--    file is safe.
alter table public.jobs
  drop constraint if exists jobs_status_check;

alter table public.jobs
  add constraint jobs_status_check check (status = any (array['active'::text, 'paused'::text]));
