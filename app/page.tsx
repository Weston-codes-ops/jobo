"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { AuthModal } from "@/components/auth-modal";
import { CreateFolderDialog } from "@/components/create-folder-dialog";
import { DocumentEditor } from "@/components/document-editor";
import { DocumentLibrary } from "@/components/document-library";
import { LibraryToolbar } from "@/components/library-toolbar";
import {
  type DocumentFolder,
  type DocumentGroup,
  type DocumentRecord,
  type DocumentType,
  documentTypePath,
  groupDocuments,
} from "@/lib/documents";
import { getSupabase } from "@/lib/supabase";

type AuthMode = "sign-in" | "sign-up";

export default function Home() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<AuthMode>("sign-in");
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentRecord | null>(null);
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [docType, setDocType] = useState<DocumentType>("resume");
  const [docFolderId, setDocFolderId] = useState<string | null>(null);

  const supabase = getSupabase();
  const router = useRouter();

  const documentGroups = useMemo(() => groupDocuments(documents), [documents]);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setStatusMessage("Could not restore your session. Please sign in again.");
        return;
      }
      setUser(data.session?.user ?? null);
    }).catch(() => {
      if (active) setStatusMessage("Could not connect to your account. Check your connection and try again.");
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!user || !supabase) {
      setDocuments([]);
      setFolders([]);
      setLoadingDocuments(false);
      return;
    }

    let active = true;
    const loadDocuments = async () => {
      setLoadingDocuments(true);
      try {
        const [documentResult, folderResult] = await Promise.all([
          supabase.from("user_documents").select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase.from("user_document_folders").select("id,name,document_type,created_at")
            .eq("user_id", user.id)
            .order("name", { ascending: true }),
        ]);
        if (!active) return;
        if (documentResult.error || folderResult.error) {
          setStatusMessage("Your library could not be loaded. Apply the document-version and document-folder migrations, then try again.");
          setLoadingDocuments(false);
          return;
        }
        setDocuments((documentResult.data ?? []) as DocumentRecord[]);
        setFolders((folderResult.data ?? []) as DocumentFolder[]);
        setLoadingDocuments(false);
      } catch {
        if (active) {
          setStatusMessage("Your documents could not be loaded. Check your connection and try again.");
          setLoadingDocuments(false);
        }
      }
    };
    void loadDocuments();
    return () => {
      active = false;
    };
  }, [user, supabase]);

  function openAuth(mode: AuthMode = "sign-in") {
    setAuthInitialMode(mode);
    setAuthOpen(true);
  }

  function startNewDocument() {
    if (!user) {
      openAuth();
      return;
    }
    setEditingDoc(null);
    setIsCreatingDoc(true);
    setDocTitle("");
    setDocContent("");
    setDocType(selectedType ?? "resume");
    setDocFolderId(selectedFolderId);
  }

  async function handleAuth(mode: AuthMode, email: string, password: string): Promise<string | null> {
    if (!supabase) return "Add your Supabase URL and public key to enable accounts.";

    setBusy(true);
    const result = mode === "sign-up"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) return result.error.message;
    if (mode === "sign-up" && !result.data.session) {
      return "Check your inbox to confirm your email, then sign in.";
    }
    return null;
  }

  async function saveDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user || !docTitle.trim()) return;

    setBusy(true);
    const groupId = editingDoc?.document_group_id ?? crypto.randomUUID();
    const nextVersion = editingDoc
      ? Math.max(...documents
          .filter((document) => document.document_group_id === groupId)
          .map((document) => document.version_number)) + 1
      : 1;
    const result = await supabase.from("user_documents").insert({
      user_id: user.id,
      document_group_id: groupId,
      version_number: nextVersion,
      title: docTitle.trim(),
      document_type: docType,
      folder_id: docFolderId,
      content: docContent,
    }).select("*").single();
    setBusy(false);
    if (result.error) {
      setStatusMessage("Could not save this document version. Please try again.");
      return;
    }
    setDocuments((current) => [result.data as DocumentRecord, ...current]);
    setEditingDoc(null);
    setIsCreatingDoc(false);
    setDocTitle("");
    setDocContent("");
    setDocFolderId(null);
    setStatusMessage(`Saved version ${nextVersion} of “${docTitle.trim()}”.`);
  }

  async function uploadDocument(
    event: ChangeEvent<HTMLInputElement>,
    group?: DocumentGroup,
    destination?: { documentType: DocumentType; folderId: string | null },
  ) {
    const file = event.target.files?.[0];
    if (!file || !supabase || !user) return;
    const targetType = group?.document_type ?? destination?.documentType ?? selectedType;
    const targetFolderId = group
      ? group.latest.folder_id
      : destination?.folderId ?? selectedFolderId;
    if (!targetType) {
      setStatusMessage("Choose a category before uploading a file.");
      event.target.value = "";
      return;
    }
    if (!/\.(pdf|doc|docx|txt)$/i.test(file.name)) {
      setStatusMessage("Choose a PDF, Word, or TXT file.");
      event.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatusMessage("Files must be 10 MB or smaller.");
      event.target.value = "";
      return;
    }

    setBusy(true);
    const groupId = group?.id ?? crypto.randomUUID();
    const nextVersion = group
      ? Math.max(...group.versions.map((version) => version.version_number)) + 1
      : 1;
    const path = `${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    try {
      const upload = await supabase.storage.from("user-documents").upload(path, file, { upsert: false });
      if (upload.error) {
        setStatusMessage("Upload failed. Check the private storage bucket configuration.");
        return;
      }

      const result = await supabase.from("user_documents").insert({
        user_id: user.id,
        document_group_id: groupId,
        version_number: nextVersion,
        title: group?.title ?? file.name.replace(/\.[^.]+$/, ""),
        document_type: targetType,
        folder_id: targetFolderId,
        content: "",
        file_path: path,
      }).select("*").single();
      if (result.error) {
        const cleanup = await supabase.storage.from("user-documents").remove([path]);
        setStatusMessage(cleanup.error
          ? "The upload record failed and the stored file could not be removed. Contact support with the time of this upload."
          : "The file uploaded but its record could not be saved.");
        return;
      }
      setDocuments((current) => [result.data as DocumentRecord, ...current]);
      setStatusMessage(group
        ? `Added version ${nextVersion} of “${group.title}”.`
        : `“${result.data.title}” was added to your document library.`);
    } catch {
      setStatusMessage("The file could not be uploaded. Check your connection and try again.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  async function createFolder(name: string): Promise<string | null> {
    if (!supabase || !user || !selectedType) return "Select a category before creating a folder.";
    setBusy(true);
    const result = await supabase.from("user_document_folders").insert({
      user_id: user.id,
      document_type: selectedType,
      name,
    }).select("id,name,document_type,created_at").single();
    setBusy(false);
    if (result.error) {
      return result.error.code === "23505"
        ? "A folder with this name already exists in this category."
        : "The folder could not be created. Please try again.";
    }
    const folder = result.data as DocumentFolder;
    setFolders((current) => [...current, folder].sort((a, b) => a.name.localeCompare(b.name)));
    setSelectedFolderId(folder.id);
    setStatusMessage(`Created “${folder.name}” in ${folder.document_type.replace("_", " ")}.`);
    return null;
  }

  async function openDocument(document: DocumentRecord) {
    if (document.file_path && supabase) {
      const { data, error } = await supabase.storage.from("user-documents")
        .createSignedUrl(document.file_path, 60);
      if (error || !data?.signedUrl) {
        setStatusMessage("Could not open this private file. Please try again.");
        return;
      }
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setIsCreatingDoc(false);
    setEditingDoc(document);
    setDocTitle(document.title);
    setDocContent(document.content);
    setDocType(document.document_type);
    setDocFolderId(document.folder_id);
  }

  async function removeDocument(document: DocumentRecord) {
    if (!supabase || !user) return;
    setBusy(true);
    if (document.file_path) {
      const removedFile = await supabase.storage.from("user-documents").remove([document.file_path]);
      if (removedFile.error) {
        setBusy(false);
        setStatusMessage("Could not remove the private file. The document record was left unchanged.");
        return;
      }
    }
    const result = await supabase.from("user_documents").delete()
      .eq("id", document.id).eq("user_id", user.id);
    setBusy(false);
    if (result.error) {
      setStatusMessage("The file was removed, but its document record could not be deleted. Refresh and try again.");
      return;
    }
    setDocuments((current) => current.filter((item) => item.id !== document.id));
    setStatusMessage(`Removed version ${document.version_number}.`);
  }

  return (
    <main className="flex min-h-screen flex-col bg-canvas text-ink">
      <AppHeader
        userEmail={user?.email}
        onSignIn={() => openAuth()}
        onSignOut={async () => { await supabase?.auth.signOut(); }}
      />

      <section className="mx-auto w-[min(100%-2rem,62.5rem)] flex-1 px-0 pb-[50px] pt-[38px] sm:w-[min(100%-3rem,62.5rem)] sm:pb-[72px] sm:pt-[58px]">
        <LibraryToolbar
          signedIn={Boolean(user)}
          busy={busy}
          loading={loadingDocuments}
          documentCount={documentGroups.length}
          versionCount={documents.length}
          documentType={selectedType}
          selectedFolderId={selectedFolderId}
          folders={folders}
          folderName={folders.find((folder) => folder.id === selectedFolderId)?.name ?? null}
          onUpload={(event, destination) => uploadDocument(event, undefined, destination)}
          onCreate={startNewDocument}
          onCreateFolder={() => setFolderDialogOpen(true)}
        />

        <div className="grid gap-3 pt-[18px]">
          {(isCreatingDoc || editingDoc) && (
            <DocumentEditor
              document={editingDoc}
              busy={busy}
              title={docTitle}
              content={docContent}
              type={docType}
              folderId={docFolderId}
              folders={folders}
              onTitleChange={setDocTitle}
              onContentChange={setDocContent}
              onTypeChange={(type) => {
                setDocType(type);
                if (docFolderId && folders.find((folder) => folder.id === docFolderId)?.document_type !== type) {
                  setDocFolderId(null);
                }
              }}
              onFolderChange={setDocFolderId}
              onClose={() => { setEditingDoc(null); setIsCreatingDoc(false); setDocFolderId(null); }}
              onSave={saveDocument}
            />
          )}

          <DocumentLibrary
            signedIn={Boolean(user)}
            loading={loadingDocuments}
            busy={busy}
            groups={documentGroups}
            folders={folders}
            selectedType={selectedType}
            selectedFolderId={selectedFolderId}
            onSelectType={(type) => {
              if (type) {
                router.push(documentTypePath(type));
                return;
              }
              setSelectedType(null);
              setSelectedFolderId(null);
            }}
            onSelectFolder={setSelectedFolderId}
            onOpen={openDocument}
            onUpload={uploadDocument}
            onDelete={removeDocument}
            onCreateAccount={() => openAuth("sign-up")}
          />
        </div>
      </section>

      <footer className="mx-auto flex min-h-[70px] w-[min(100%-2rem,70rem)] items-center justify-between gap-4 border-t border-line text-xs text-[#818c84] sm:w-[min(100%-3rem,70rem)]">
        <span className="hidden sm:inline">Your career documents, organized.</span>
        <span>© Jobo 2026</span>
      </footer>

      {statusMessage && (
        <div className="jobo-enter fixed bottom-[max(22px,env(safe-area-inset-bottom))] left-1/2 z-[25] flex max-w-[min(600px,calc(100%-32px))] -translate-x-1/2 items-center gap-[15px] rounded-[10px] border border-[#dfe7e0] bg-white px-4 py-3 text-[13px] text-[#46554a] shadow-lg" role="status">
          <span>{statusMessage}</span>
          <button className="grid place-items-center text-[#78857c]" onClick={() => setStatusMessage("")} aria-label="Dismiss"><X size={15} /></button>
        </div>
      )}

      {authOpen && (
        <AuthModal
          key={authInitialMode}
          busy={busy}
          supabaseReady={Boolean(supabase)}
          initialMode={authInitialMode}
          onClose={() => setAuthOpen(false)}
          onAuthenticate={handleAuth}
        />
      )}

      {folderDialogOpen && selectedType && (
        <CreateFolderDialog
          documentType={selectedType}
          busy={busy}
          onClose={() => setFolderDialogOpen(false)}
          onCreate={createFolder}
        />
      )}
    </main>
  );
}
