-- Fix: Submit tab fails with "violates row-level security policy"
-- Cause: INSERT worked but .select('id') after insert needs SELECT permission too.

-- Allow reading submissions (needed for insert...returning from the app)
drop policy if exists "Public can read submissions" on public.event_submissions;
create policy "Public can read submissions"
  on public.event_submissions for select
  using (true);

-- Re-assert insert policy in case it was missing
drop policy if exists "Public can submit events" on public.event_submissions;
create policy "Public can submit events"
  on public.event_submissions for insert
  with check (true);
