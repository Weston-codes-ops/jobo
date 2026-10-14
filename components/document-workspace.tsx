"use client";

import { useEffect, useState } from "react";
import { ExternalLink, FileText, History, LoaderCircle, Trash2, Upload } from "lucide-react";
import type { ChangeEvent } from "react";
import { FolderIllustration } from "@/ui/folder-illustration";
import { formatDate, labelForType, type DocumentGroup, type DocumentRecord, type DocumentType } from "@/lib/documents";
import { getSupabase } from "@/lib/supabase";

type DocumentWorkspaceProps = {
  documentType: DocumentType;
  groups: DocumentGroup[];
  busy: boolean;
  onOpen: (document: DocumentRecord) => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>, group: DocumentGroup) => void;
  onDelete: (document: DocumentRecord) => void;
};

export function DocumentWorkspace({
  documentType,
  groups,
  busy,
  onOpen,
  onUpload,
  onDelete,
}: DocumentWorkspaceProps) {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    groups[0]?.latest.id ?? null,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewRetry, setPreviewRetry] = useState(0);

  const selectedGroup = groups.find((group) =>
    group.versions.some((version) => version.id === selectedDocumentId)
  ) ?? groups[0] ?? null;
  const selectedDocument = selectedGroup?.versions.find(
    (version) => version.id === selectedDocumentId,
  ) ?? selectedGroup?.latest ?? null;
  const supabase = getSupabase();

  useEffect(() => {
    if (!selectedDocument?.file_path) {
      setPreviewUrl(null);
      setPreviewLoading(false);
      setPreviewError("");
      return;
    }
    if (!supabase) {
      setPreviewUrl(null);
      setPreviewLoading(false);
      setPreviewError("Connect Jobo to Supabase to preview this private file.");
      return;
    }

    let active = true;
    setPreviewUrl(null);
    setPreviewLoading(true);
    setPreviewError("");

    supabase.storage.from("user-documents")
      .createSignedUrl(selectedDocument.file_path, 300)
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data?.signedUrl) {
          setPreviewError("This file preview could not be loaded. Check your connection and try again.");
          setPreviewLoading(false);
          return;
        }
        setPreviewUrl(data.signedUrl);
        setPreviewLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setPreviewError("This file preview could not be loaded. Check your connection and try again.");
        setPreviewLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedDocument?.id, selectedDocument?.file_path, previewRetry, supabase]);

  const fileCanPreview = Boolean(
    selectedDocument?.file_path && /\.(pdf|txt)$/i.test(selectedDocument.file_path),
  );

  return (
    <div className="grid overflow-hidden rounded-2xl border border-line bg-white shadow-[0_8px_30px_rgba(36,52,40,0.045)] lg:min-h-[560px] lg:grid-cols-[minmax(230px,0.72fr)_minmax(0,1.6fr)]">
      <aside className="border-b border-line bg-[#f8faf8] lg:border-b-0 lg:border-r" aria-label={`${labelForType(documentType)} document list`}>
        <div className="flex min-h-[62px] items-center justify-between border-b border-line px-4 sm:px-5">
          <div>
            <h3 className="m-0 text-[13px] font-semibold text-[#36443a]">Documents</h3>
            <p className="mb-0 mt-0.5 text-[11px] text-muted">{groups.length} {groups.length === 1 ? "item" : "items"}</p>
          </div>
          <span className="text-[11px] font-medium text-[#79867d]">{labelForType(documentType)}</span>
        </div>

        {groups.length ? (
          <ul className="m-0 max-h-[300px] list-none space-y-1 overflow-y-auto p-2 lg:max-h-[490px]">
            {groups.map((group) => {
              const isSelected = selectedGroup?.id === group.id;
              return (
                <li key={group.id}>
                  <button
                    className={`flex min-h-[62px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-green ${isSelected ? "bg-green-soft text-[#2f4d37]" : "text-[#46534a] hover:bg-white"}`}
                    onClick={() => setSelectedDocumentId(group.latest.id)}
                    aria-pressed={isSelected}
                  >
                    <FolderIllustration className="h-8 w-9 shrink-0 drop-shadow-[0_2px_3px_rgba(49,94,70,0.1)]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-semibold">{group.title}</span>
                      <span className="mt-1 block text-[10px] text-[#7b867e]">
                        v{group.latest.version_number} · {formatDate(group.latest.created_at)}
                      </span>
                    </span>
                    {isSelected && <span className="size-1.5 shrink-0 rounded-full bg-green" aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex min-h-[160px] items-center justify-center px-6 py-8 text-center lg:min-h-[490px]">
            <div>
              <FolderIllustration className="mx-auto mb-3 h-12 w-14 opacity-70" />
              <p className="mb-0 text-xs leading-relaxed text-muted">Your documents will appear here. Add one using the actions above.</p>
            </div>
          </div>
        )}
      </aside>

      <section className="min-w-0" aria-label="Document preview" aria-live="polite">
        {selectedDocument && selectedGroup ? (
          <>
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-4 sm:px-6">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-green-soft text-green">
                  <FileText size={19} />
                </span>
                <div className="min-w-0">
                  <h3 className="mb-1 truncate text-sm font-semibold text-[#2e3b32] sm:text-[15px]">{selectedDocument.title}</h3>
                  <p className="mb-0 text-[11px] text-muted">
                    {labelForType(selectedDocument.document_type)} · Version {selectedDocument.version_number} · {formatDate(selectedDocument.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {selectedDocument.file_path && (
                  <a
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold text-green transition-colors hover:bg-green-soft focus-visible:outline-2 focus-visible:outline-green"
                    href={previewUrl ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    aria-disabled={!previewUrl}
                    onClick={(event) => { if (!previewUrl) event.preventDefault(); }}
                  >
                    <ExternalLink size={14} /> Open file
                  </a>
                )}
                <label className={`grid size-9 cursor-pointer place-items-center rounded-lg text-[#607466] transition-colors hover:bg-green-soft hover:text-green ${busy ? "pointer-events-none opacity-50" : ""}`} title="Upload a new version" aria-label={`Upload a new version of ${selectedGroup.title}`}>
                  <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={(event) => onUpload(event, selectedGroup)} hidden disabled={busy} />
                  <Upload size={16} />
                </label>
                <button
                  className="grid size-9 place-items-center rounded-lg text-[#89938d] transition-colors hover:bg-[#f8eeee] hover:text-[#9c5c53] focus-visible:outline-2 focus-visible:outline-[#9c5c53] disabled:opacity-45"
                  onClick={() => onDelete(selectedDocument)}
                  title="Delete selected version"
                  aria-label={`Delete ${selectedDocument.title}, version ${selectedDocument.version_number}`}
                  disabled={busy}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </header>

            {selectedGroup.versions.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto border-b border-line px-4 py-2 sm:px-6">
                <History size={14} className="shrink-0 text-[#738078]" />
                {selectedGroup.versions.map((version) => (
                  <button
                    key={version.id}
                    className={`min-h-8 shrink-0 rounded-lg px-2.5 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-green ${version.id === selectedDocument.id ? "bg-green-soft text-green" : "text-[#657168] hover:bg-[#f3f6f3]"}`}
                    onClick={() => setSelectedDocumentId(version.id)}
                    aria-pressed={version.id === selectedDocument.id}
                  >
                    v{version.version_number}{version.id === selectedGroup.latest.id ? " · Latest" : ""}
                  </button>
                ))}
              </div>
            )}

            <div className="min-h-[340px] bg-[#f8faf8] p-3 sm:min-h-[440px] sm:p-5">
              {selectedDocument.file_path ? (
                previewLoading ? (
                  <div className="flex min-h-[320px] items-center justify-center gap-2 text-xs text-muted" role="status">
                    <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" />
                    Preparing your private preview…
                  </div>
                ) : previewError ? (
                  <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
                    <p className="mb-0 max-w-sm text-xs leading-relaxed text-[#765b52]" role="alert">{previewError}</p>
                    <button className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-[#506b57] hover:bg-green-soft" onClick={() => setPreviewRetry((current) => current + 1)}>
                      Try again
                    </button>
                  </div>
                ) : fileCanPreview && previewUrl ? (
                  <iframe
                    key={previewUrl}
                    className="h-[65vh] min-h-[320px] w-full rounded-lg border border-[#e3e9e4] bg-white sm:h-[72vh] sm:min-h-[420px]"
                    src={previewUrl}
                    title={`Preview of ${selectedDocument.title}`}
                  />
                ) : (
                  <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                    <FileText size={36} className="mb-3 text-[#6e8173]" />
                    <h4 className="mb-1 text-sm font-semibold text-[#36443a]">Preview isn’t available for this file type.</h4>
                    <p className="mb-4 max-w-sm text-xs leading-relaxed text-muted">Open the file to view it in your browser or download it to your device.</p>
                    <a className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-green px-4 text-xs font-semibold text-white hover:bg-green-hover" href={previewUrl ?? undefined} target="_blank" rel="noreferrer">
                      <ExternalLink size={15} /> Open file
                    </a>
                  </div>
                )
              ) : (
                <article className="mx-auto min-h-[320px] max-w-[760px] rounded-lg border border-[#e7ebe7] bg-white px-5 py-6 shadow-sm sm:min-h-[420px] sm:px-8 sm:py-8">
                  <div className="mb-5 flex items-center justify-between gap-3 border-b border-[#edf0ed] pb-4">
                    <span className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[#718078]">Document preview</span>
                    <button className="rounded-lg px-3 py-2 text-[11px] font-semibold text-green hover:bg-green-soft" onClick={() => onOpen(selectedDocument)}>
                      Create new version
                    </button>
                  </div>
                  <pre className="m-0 whitespace-pre-wrap break-words font-[inherit] text-[13px] leading-[1.85] text-[#39463d]">
                    {selectedDocument.content || "This document has no text content yet."}
                  </pre>
                </article>
              )}
            </div>
          </>
        ) : (
          <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-10 text-center lg:min-h-[560px]">
            <FileText size={30} className="mb-3 text-[#a1aea3]" />
            <h3 className="mb-1 text-sm font-semibold text-[#36443a]">Your preview will appear here</h3>
            <p className="mb-0 max-w-sm text-xs leading-relaxed text-muted">Add a document to this {groups.length === 0 ? "category" : "folder"}, then select it to view.</p>
          </div>
        )}
      </section>
    </div>
  );
}
