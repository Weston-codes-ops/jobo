-- Permanently remove the paused job-discovery and application-tracking data.
-- This does not affect Supabase Auth users, user_documents, or the private
-- user-documents Storage bucket.
drop table if exists public.applications;
drop table if exists public.saved_opportunities;
drop table if exists public.opportunities;
drop table if exists public.job_sources;
