"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { ChangeEvent } from "react";
import { ExternalLink, FileText, LoaderCircle, Maximize2, Upload, X } from "lucide-react";
import {
  documentTypeDescriptions,
  documentTypeFromSlug,
  documentTypePath,
  formatDate,
  getGroupsForFolder,
  groupDocuments,
  labelForType,
  type DocumentFolder,
  type DocumentRecord,
  type DocumentType,
} from "@/lib/documents";
import { getSupabase } from "@/lib/supabase";

function CategoryPageContent() {
  const params = useParams<{ category: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const documentType = documentTypeFromSlug(params.category);
  const folderId = searchParams.get("folder");
  const supabase = getSupabase();

  const [userId, setUserId] = useState<string | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [previewAttempt, setPreviewAttempt] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadFailed, setUploadFailed] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setAuthResolved(true);
      setLoading(false);
      return;
    }

    let active = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setErrorMessage("Could not check your sign-in. Return to Jobo and try again.");
      setUserId(data.session?.user.id ?? null);
      setAuthResolved(true);
    }).catch(() => {
      if (!active) return;
      setErrorMessage("Could not connect to your account. Check your connection and try again.");
      setAuthResolved(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setAuthResolved(true);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!documentType || !userId || !supabase) {
      setDocuments([]);
      setFolders([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setErrorMessage("");
    void Promise.all([
      supabase.from("user_documents").select("*")
        .eq("user_id", userId)
        .eq("document_type", documentType)
        .order("created_at", { ascending: false }),
      supabase.from("user_document_folders").select("id,name,document_type,created_at")
        .eq("user_id", userId)
        .eq("document_type", documentType)
        .order("name", { ascending: true }),
    ]).then(([documentResult, folderResult]) => {
      if (!active) return;
      if (documentResult.error || folderResult.error) {
        setErrorMessage("This library could not be loaded. Check that the Jobo Supabase schema and folder migration are applied.");
      } else {
        setDocuments((documentResult.data ?? []) as DocumentRecord[]);
        setFolders((folderResult.data ?? []) as DocumentFolder[]);
      }
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setErrorMessage("This library could not be loaded. Check your connection and try again.");
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [documentType, userId, supabase]);

  const groups = useMemo(() => groupDocuments(documents), [documents]);
  const visibleGroups = useMemo(
    () => documentType ? getGroupsForFolder(groups, documentType, folderId) : [],
    [documentType, folderId, groups],
  );
  const selectedGroup = visibleGroups.find((group) =>
    group.versions.some((version) => version.id === selectedDocumentId)
  ) ?? visibleGroups[0] ?? null;
  const selectedDocument = selectedGroup?.versions.find(
    (version) => version.id === selectedDocumentId,
  ) ?? selectedGroup?.latest ?? null;
  const selectedFolder = folders.find((folder) => folder.id === folderId) ?? null;
  const fileCanPreview = Boolean(
    selectedDocument?.file_path && /\.(pdf|txt)$/i.test(selectedDocument.file_path),
  );
  const previewSource = previewUrl && selectedDocument?.file_path && /\.pdf$/i.test(selectedDocument.file_path)
    ? `${previewUrl}#zoom=page-fit`
    : previewUrl;

  useEffect(() => {
    if (!isPreviewOpen) return;

    const previousOverflow = document.body.style.overflow;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsPreviewOpen(false);
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isPreviewOpen]);

  useEffect(() => {
    if (!visibleGroups.length) {
      setSelectedDocumentId(null);
      return;
    }
    if (!visibleGroups.some((group) =>
      group.versions.some((version) => version.id === selectedDocumentId)
    )) {
      setSelectedDocumentId(visibleGroups[0].latest.id);
    }
  }, [selectedDocumentId, visibleGroups]);

  useEffect(() => {
    if (!selectedDocument?.file_path) {
      setPreviewUrl(null);
      setPreviewLoading(false);
      setPreviewError("");
      return;
    }
    if (!supabase) {
      setPreviewError("Connect Jobo to Supabase to preview this private file.");
      setPreviewLoading(false);
      return;
    }

    let active = true;
    setPreviewUrl(null);
    setPreviewLoading(true);
    setPreviewError("");
    void supabase.storage.from("user-documents")
      .createSignedUrl(selectedDocument.file_path, 300)
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data?.signedUrl) {
          setPreviewError("This file preview could not be loaded. Check your connection and try again.");
        } else {
          setPreviewUrl(data.signedUrl);
        }
        setPreviewLoading(false);
      }).catch(() => {
        if (!active) return;
        setPreviewError("This file preview could not be loaded. Check your connection and try again.");
        setPreviewLoading(false);
      });
    return () => {
      active = false;
    };
  }, [previewAttempt, selectedDocument?.file_path, selectedDocument?.id, supabase]);

  function navigateToFolder(nextFolderId: string) {
    if (!documentType) return;
    const path = documentTypePath(documentType);
    router.push(nextFolderId ? `${path}?folder=${encodeURIComponent(nextFolderId)}` : path);
  }

  async function uploadDocument(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file || !supabase || !userId || !documentType) return;

    if (!/\.(pdf|doc|docx|txt)$/i.test(file.name)) {
      setUploadFailed(true);
      setUploadMessage("Choose a PDF, Word, or TXT file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadFailed(true);
      setUploadMessage("Files must be 10 MB or smaller.");
      return;
    }

    setUploading(true);
    setUploadMessage("");
    try {
      const path = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const storedFile = await supabase.storage.from("user-documents").upload(path, file, { upsert: false });
      if (storedFile.error) {
        setUploadFailed(true);
        setUploadMessage("Upload failed. Check the private storage bucket configuration and try again.");
        return;
      }

      const title = file.name.replace(/\.[^.]+$/, "");
      const result = await supabase.from("user_documents").insert({
        user_id: userId,
        document_group_id: crypto.randomUUID(),
        version_number: 1,
        title,
        document_type: documentType,
        folder_id: selectedFolder?.id ?? null,
        content: "",
        file_path: path,
      }).select("*").single();

      if (result.error) {
        const cleanup = await supabase.storage.from("user-documents").remove([path]);
        setUploadFailed(true);
        setUploadMessage(cleanup.error
          ? "The document record could not be saved, and the uploaded file could not be removed. Contact support."
          : "The file uploaded, but its document record could not be saved.");
        return;
      }

      const uploadedDocument = result.data as DocumentRecord;
      setDocuments((current) => [uploadedDocument, ...current]);
      setSelectedDocumentId(uploadedDocument.id);
      setUploadFailed(false);
      setUploadMessage(`“${uploadedDocument.title}” was uploaded.`);
    } catch {
      setUploadFailed(true);
      setUploadMessage("The file could not be uploaded. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  if (!documentType) {
    return (
      <main className="grid min-h-screen place-items-center bg-canvas px-5 text-center text-ink">
        <div>
          <h1 className="text-xl font-semibold">That document category isn’t available.</h1>
          <a className="mt-3 inline-flex text-sm font-semibold text-green hover:underline" href="/">Back to Jobo</a>
        </div>
      </main>
    );
  }

  const categoryLabel = labelForType(documentType);

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-canvas text-ink">
      <header className="mx-auto flex h-[68px] w-[min(100%-2rem,76rem)] shrink-0 items-center justify-between border-b border-line sm:h-[72px] sm:w-[min(100%-3rem,76rem)]">
        <a className="rounded-md text-[22px] font-bold tracking-[-1.2px] focus-visible:outline-2 focus-visible:outline-green" href="/" aria-label="Back to Jobo home">
          jobo<span className="text-[#76a17c]">.</span>
        </a>
        <a className="bg-white px-3 py-2 text-xs font-semibold text-[#5d7562] transition-colors hover:bg-green-soft focus-visible:outline-2 focus-visible:outline-green" href="/">
          All documents
        </a>
      </header>

      <section className="mx-auto flex min-h-0 w-[min(100%-2rem,76rem)] flex-1 flex-col py-3 sm:w-[min(100%-3rem,76rem)] sm:py-4">
        <nav aria-label="Breadcrumb" className="mb-3 shrink-0 text-xs text-muted">
          <a href="/" className="rounded hover:text-green focus-visible:outline-2 focus-visible:outline-green">Your documents</a>
          <span className="mx-2 text-[#a0aaa2]" aria-hidden="true">/</span>
          <span className="font-medium text-[#405047]">{categoryLabel}</span>
          {selectedFolder && (
            <>
              <span className="mx-2 text-[#a0aaa2]" aria-hidden="true">/</span>
              <span className="font-medium text-[#405047]">{selectedFolder.name}</span>
            </>
          )}

        </nav>

        <div className="mb-3 flex shrink-0 flex-wrap items-end justify-between gap-3">
          {folders.length > 0 && (
            <label className="grid gap-1 text-[10px] font-semibold text-[#738078]">
              <span>Folder</span>
              <select
                className="min-h-10 min-w-[180px] rounded-lg border border-line bg-white px-3 text-xs font-medium text-[#405047] outline-none focus:border-[#7da187] focus:ring-4 focus:ring-green-soft"
                value={folderId ?? ""}
                onChange={(event) => navigateToFolder(event.target.value)}
              >
                <option value="">All {categoryLabel.toLowerCase()}</option>
                {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
              </select>
            </label>
          )}
          <label className={`inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 border border-[#dce4dd] bg-white px-3 text-xs font-semibold text-[#35473a] transition-colors hover:border-[#cbd9ce] hover:bg-[#fbfdfb] ${(!userId || !supabase || loading || uploading) ? "cursor-not-allowed opacity-55" : ""}`}>
            {uploading ? <LoaderCircle size={15} className="animate-spin" aria-hidden="true" /> : <Upload size={15} aria-hidden="true" />}
            {uploading ? "Uploading…" : "Upload file"}
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={uploadDocument}
              hidden
              disabled={!userId || !supabase || loading || uploading}
            />
          </label>
        </div>

        {!authResolved || loading ? (
          <div className="grid min-h-0 flex-1 place-items-center border border-line bg-white text-sm text-muted" role="status">
            <span className="inline-flex items-center gap-2"><LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" /> Loading your documents…</span>
          </div>
        ) : !supabase ? (
          <div className="grid min-h-0 flex-1 place-items-center border border-line bg-white px-6 text-center">
            <p className="mb-0 max-w-sm text-sm leading-relaxed text-[#765b52]" role="alert">
               Documents loading failed. No database connection to view your private documents.
            </p>
          </div>
        ) : !userId ? (
          <div className="grid min-h-0 flex-1 place-items-center border border-line bg-white px-6 text-center">
            <div>
              <p className="mb-1 text-sm font-semibold text-[#36443a]">Sign in to view your private documents.</p>
              <a href="/" className="text-xs font-semibold text-green hover:underline">Return to Jobo to sign in</a>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="grid min-h-0 flex-1 place-items-center border border-line bg-white px-6 text-center text-sm text-[#765b52]" role="alert">{errorMessage}</div>
        ) : (
          <div className="mx-auto my-auto grid h-full max-h-[42rem] min-h-0 w-full max-w-[64rem] grid-cols-1 grid-rows-[minmax(90px,0.28fr)_minmax(0,1fr)] overflow-hidden border border-line bg-white shadow-[0_8px_30px_rgba(36,52,40,0.06)] lg:grid-cols-[minmax(230px,0.7fr)_minmax(0,1.7fr)] lg:grid-rows-1">
            <aside className="flex min-h-0 min-w-0 flex-col overflow-hidden border-b border-line bg-[#f8faf8] lg:border-b-0 lg:border-r" aria-label={`${categoryLabel} document list`}>
              <div className="flex min-h-[50px] shrink-0 items-center justify-between border-b border-line px-4 sm:px-5">
                <h2 className="m-0 text-[13px] font-semibold text-[#36443a]">Documents</h2>
              </div>
              {visibleGroups.length ? (
                <ul className="m-0 min-h-0 flex-1 list-none space-y-2 overflow-y-auto overflow-x-hidden px-4 py-3">
                  {visibleGroups.map((group) => (
                    <li key={group.id}>
                      <button
                        className={`flex min-w-0 hover:cursor-pointer w-full items-center gap-2 truncate py-1 text-left text-[13px] transition-colors duration-150 hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-green ${selectedGroup?.id === group.id ? "font-semibold text-[#2f4d37]" : "text-[#46534a]"}`}
                        onClick={() => setSelectedDocumentId(group.latest.id)}
                        aria-pressed={selectedGroup?.id === group.id}
                      >
                        <FileText size={15} className="shrink-0" aria-hidden="true" />
                        <span className="truncate">{group.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-8 text-center">
                  <p className="mb-0 text-xs leading-relaxed text-muted">No documents in this {selectedFolder ? "folder" : "category"} yet.</p>
                </div>
              )}
            </aside>

            <section className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-[#f8faf8]" aria-label="Document preview">
              {selectedDocument ? (
                <>
                  <div className="flex min-h-[50px] shrink-0 items-center justify-between gap-3 border-b border-[#e3e9e4] bg-white px-4 sm:px-6">
                    <div className="min-w-0">
                      <h2 className="m-0 truncate text-[13px] font-semibold text-[#36443a]">{selectedDocument.title}</h2>
                    </div>
                    <button
                      className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#dce4dd] bg-white px-3 text-[11px] font-semibold text-green transition-colors hover:bg-green-soft focus-visible:outline-2 focus-visible:outline-green"
                      onClick={() => setIsPreviewOpen(true)}
                    >
                      <Maximize2 size={14} aria-hidden="true" />
                      View full
                    </button>
                  </div>
                  {selectedDocument.file_path ? (
                    previewLoading ? (
                      <div className="grid min-h-0 flex-1 place-items-center bg-[#f7f9f7] text-xs text-muted" role="status">
                        <span className="inline-flex items-center gap-2"><LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" /> Loading preview…</span>
                      </div>
                    ) : previewError ? (
                      <div className="grid min-h-0 flex-1 place-items-center bg-[#f7f9f7] px-6 text-center">
                        <div>
                          <p className="mb-3 text-xs text-[#765b52]" role="alert">{previewError}</p>
                          <button className="border border-line bg-white px-3 py-2 text-xs font-semibold text-green hover:bg-green-soft" onClick={() => setPreviewAttempt((attempt) => attempt + 1)}>Try again</button>
                        </div>
                      </div>
                    ) : fileCanPreview && previewUrl ? (
                      <iframe
                        key={previewUrl}
                        className="min-h-0 w-full flex-1 bg-white"
                        src={previewSource ?? undefined}
                        title={`Preview of ${selectedDocument.title}`}
                      />
                    ) : (
                      <div className="grid min-h-0 flex-1 place-items-center bg-[#f7f9f7] px-6 text-center">
                        <div>
                          <FileText size={28} className="mx-auto mb-3 text-[#75877a]" />
                          <p className="mb-3 text-xs text-muted">Preview is unavailable for this file type.</p>
                          <a className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-green px-4 text-xs font-semibold text-white hover:bg-green-hover" href={previewUrl ?? undefined} target="_blank" rel="noreferrer" aria-disabled={!previewUrl}>
                            <ExternalLink size={14} /> Open file
                          </a>
                        </div>
                      </div>
                    )
                  ) : (
                    <article className="min-h-0 flex-1 overflow-y-auto bg-white px-6 py-8 sm:px-10">
                      <pre className="m-0 whitespace-pre-wrap break-words font-[inherit] text-[13px] leading-[1.85] text-[#39463d]">
                        {selectedDocument.content || "This document has no text content yet."}
                      </pre>
                    </article>
                  )}
                </>
              ) : (
                <div className="grid min-h-0 flex-1 place-items-center px-6 text-center">
                  <p className="mb-0 text-xs text-muted">Select a document to preview it here.</p>
                </div>
              )}
            </section>
          </div>
        )}
      </section>
      {uploadMessage && (
        <div
          className="fixed bottom-4 left-1/2 z-20 max-w-[min(540px,calc(100%-2rem))] -translate-x-1/2 rounded-lg border border-line bg-white px-4 py-3 text-xs text-[#46554a] shadow-lg"
          role={uploadFailed ? "alert" : "status"}
        >
          {uploadMessage}
          <button className="ml-3 font-semibold text-green hover:underline" onClick={() => setUploadMessage("")}>Dismiss</button>
        </div>
      )}
      {isPreviewOpen && selectedDocument && (
        <div
          className="fixed inset-0 z-30 grid place-items-center bg-[rgba(18,27,20,0.68)] p-2 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsPreviewOpen(false);
          }}
        >
          <section
            className="flex h-[calc(100dvh-1rem)] max-h-[64rem] w-full max-w-[80rem] min-h-0 flex-col overflow-hidden rounded-xl border border-white/20 bg-[#f8faf8] shadow-2xl sm:h-[calc(100dvh-2.5rem)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="full-preview-heading"
          >
            <header className="flex min-h-[56px] shrink-0 items-center justify-between gap-3 border-b border-line bg-white px-4 sm:px-6">
              <h2 id="full-preview-heading" className="m-0 min-w-0 truncate text-sm font-semibold text-[#36443a]">
                {selectedDocument.title}
              </h2>
              <button
                autoFocus
                className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-[#526258] transition-colors hover:bg-[#f2f6f2] focus-visible:outline-2 focus-visible:outline-green"
                onClick={() => setIsPreviewOpen(false)}
                aria-label="Close full document preview"
              >
                <X size={16} aria-hidden="true" />
                Close
              </button>
            </header>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {selectedDocument.file_path ? (
                previewLoading ? (
                  <div className="grid min-h-0 flex-1 place-items-center text-xs text-muted" role="status">
                    <span className="inline-flex items-center gap-2"><LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" /> Loading preview…</span>
                  </div>
                ) : previewError ? (
                  <div className="grid min-h-0 flex-1 place-items-center px-6 text-center">
                    <p className="mb-0 max-w-sm text-xs leading-relaxed text-[#765b52]" role="alert">{previewError}</p>
                  </div>
                ) : fileCanPreview && previewUrl ? (
                  <iframe
                    key={`${previewUrl}-full`}
                    className="min-h-0 w-full flex-1 bg-white"
                    src={previewSource ?? undefined}
                    title={`Full preview of ${selectedDocument.title}`}
                  />
                ) : (
                  <div className="grid min-h-0 flex-1 place-items-center px-6 text-center">
                    <div>
                      <FileText size={32} className="mx-auto mb-3 text-[#75877a]" aria-hidden="true" />
                      <p className="mb-4 text-sm text-muted">Preview is unavailable for this file type.</p>
                      <a className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-green px-4 text-xs font-semibold text-white hover:bg-green-hover" href={previewUrl ?? undefined} target="_blank" rel="noreferrer" aria-disabled={!previewUrl}>
                        <ExternalLink size={14} aria-hidden="true" /> Open file
                      </a>
                    </div>
                  </div>
                )
              ) : (
                <article className="min-h-0 flex-1 overflow-y-auto bg-white px-6 py-8 sm:px-12 sm:py-10">
                  <pre className="mx-auto my-0 max-w-4xl whitespace-pre-wrap break-words font-[inherit] text-sm leading-[1.85] text-[#39463d]">
                    {selectedDocument.content || "This document has no text content yet."}
                  </pre>
                </article>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={
      <main className="grid h-dvh place-items-center overflow-hidden bg-canvas text-sm text-muted">
        Loading document folder…
      </main>
    }>
      <CategoryPageContent />
    </Suspense>
  );
}
