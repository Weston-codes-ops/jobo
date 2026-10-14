-- DESTRUCTIVE: removes Jobo documents, folders, versions, and legacy job-board
-- tables, then recreates the current Jobo database schema.
-- Preserves Supabase Auth users, project settings, and Storage bucket contents
-- and policies. Delete uploaded files from Storage before running this script.
begin;

drop table if exists public.applications;
drop table if exists public.saved_opportunities;
drop table if exists public.opportunities;
drop table if exists public.job_sources;
drop table if exists public.user_documents;
drop table if exists public.user_document_folders;

create extension if not exists pgcrypto;

create table public.user_document_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null check (document_type in ('resume', 'qualification', 'certificate', 'cover_letter', 'other')),
  name text not null check (char_length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (id, user_id, document_type)
);

create unique index user_document_folders_name_idx
  on public.user_document_folders (user_id, document_type, lower(name));

create table public.user_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_group_id uuid not null default gen_random_uuid(),
  version_number integer not null default 1 check (version_number > 0),
  title text not null,
  document_type text not null check (document_type in ('resume', 'qualification', 'certificate', 'cover_letter', 'other')),
  folder_id uuid,
  content text not null default '',
  file_path text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint user_documents_folder_owner_type_fkey
    foreign key (folder_id, user_id, document_type)
    references public.user_document_folders (id, user_id, document_type)
);

create unique index user_documents_group_version_idx
  on public.user_documents (document_group_id, version_number);

alter table public.user_documents enable row level security;
alter table public.user_document_folders enable row level security;

create policy "Users manage their own documents" on public.user_documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own document folders" on public.user_document_folders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

commit;
