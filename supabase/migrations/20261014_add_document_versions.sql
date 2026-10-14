-- Add grouped document revisions and qualification records for existing Jobo
-- databases. Existing documents become version 1 in their own group.
alter table public.user_documents
  add column if not exists document_group_id uuid;

alter table public.user_documents
  add column if not exists version_number integer not null default 1;

update public.user_documents
set document_group_id = id
where document_group_id is null;

alter table public.user_documents
  alter column document_group_id set default gen_random_uuid(),
  alter column document_group_id set not null;

alter table public.user_documents
  drop constraint if exists user_documents_document_type_check;

alter table public.user_documents
  add constraint user_documents_document_type_check
  check (document_type in ('resume', 'qualification', 'certificate', 'cover_letter', 'other'));

create unique index if not exists user_documents_group_version_idx
  on public.user_documents (document_group_id, version_number);
