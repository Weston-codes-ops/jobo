create table if not exists public.user_document_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null check (document_type in ('resume', 'qualification', 'certificate', 'cover_letter', 'other')),
  name text not null check (char_length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (id, user_id, document_type)
);

create unique index if not exists user_document_folders_name_idx
  on public.user_document_folders (user_id, document_type, lower(name));

alter table public.user_documents
  add column if not exists folder_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_documents_folder_owner_type_fkey'
      and conrelid = 'public.user_documents'::regclass
  ) then
    alter table public.user_documents
      add constraint user_documents_folder_owner_type_fkey
      foreign key (folder_id, user_id, document_type)
      references public.user_document_folders (id, user_id, document_type);
  end if;
end
$$;

alter table public.user_document_folders enable row level security;

drop policy if exists "Users manage their own document folders" on public.user_document_folders;
create policy "Users manage their own document folders" on public.user_document_folders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
