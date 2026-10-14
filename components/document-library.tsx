import {
  ChevronLeft,
  FileText,
  ShieldCheck,
} from "lucide-react";
import type { ChangeEvent } from "react";
import {
  documentTypeDescriptions,
  documentTypes,
  getGroupsForFolder,
  labelForType,
  type DocumentFolder,
  type DocumentGroup,
  type DocumentRecord,
  type DocumentType,
} from "@/lib/documents";
import { DocumentWorkspace } from "@/components/document-workspace";
import { FolderIllustration } from "@/ui/folder-illustration";

type DocumentLibraryProps = {
  signedIn: boolean;
  loading: boolean;
  busy: boolean;
  groups: DocumentGroup[];
  folders: DocumentFolder[];
  selectedType: DocumentType | null;
  selectedFolderId: string | null;
  onSelectType: (type: DocumentType | null) => void;
  onSelectFolder: (folderId: string | null) => void;
  onOpen: (document: DocumentRecord) => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>, group: DocumentGroup) => void;
  onDelete: (document: DocumentRecord) => void;
  onCreateAccount: () => void;
};

export function DocumentLibrary({
  signedIn,
  loading,
  busy,
  groups,
  folders,
  selectedType,
  selectedFolderId,
  onSelectType,
  onSelectFolder,
  onOpen,
  onUpload,
  onDelete,
  onCreateAccount,
}: DocumentLibraryProps) {
  if (!signedIn) {
    return (
      <div className="jobo-enter flex min-h-[260px] flex-col items-center justify-center border border-dashed border-[#dce5dd] bg-white/70 px-6 py-9 text-center sm:min-h-[300px]">
        <span className="mb-[15px] grid size-12 place-items-center rounded-[14px] bg-green-soft text-green"><ShieldCheck size={22} /></span>
        <h2 className="mb-2 text-[17px] font-semibold text-[#2e3b32]">Sign in to open your private library.</h2>
        <p className="mb-[18px] max-w-[440px] text-[13px] leading-relaxed text-muted">
          Create an account to keep your CVs, qualifications, certificates, and their versions together.
        </p>
        <button className="min-h-11 rounded-lg bg-green px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(49,94,70,0.14)] transition duration-200 hover:-translate-y-0.5 hover:bg-green-hover hover:shadow-[0_7px_18px_rgba(49,94,70,0.2)] active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green" onClick={onCreateAccount}>
          Create an account
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[170px] items-center justify-center gap-[11px] text-[13px] text-muted" role="status">
        <span className="size-[17px] animate-spin rounded-full border-2 border-[#dce7de] border-t-green motion-reduce:animate-none" />
        Loading your folders and documents…
      </div>
    );
  }

  if (!selectedType) {
    return (
      <section aria-labelledby="category-heading" className="jobo-enter pt-7 sm:pt-8">
        <div className="mb-4">
          <h2 id="category-heading" className="mb-1 text-lg font-semibold text-[#2e3b32]">Browse by category</h2>
          <p className="mb-0 text-[13px] text-muted">Choose a category to see its documents and create purpose folders.</p>
        </div>
        <div className="jobo-stagger grid grid-cols-2 gap-x-5 gap-y-4 min-[460px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-x-7 sm:gap-y-5">
          {documentTypes.map((type) => {
            const count = groups.filter((group) => group.document_type === type).length;
            const folderCount = folders.filter((folder) => folder.document_type === type).length;
            return (
              <button
                key={type}
                className="group flex min-h-[162px] flex-col items-center rounded-lg px-2 py-3 text-center transition duration-200 hover:-translate-y-0.5 hover:bg-green-soft active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green sm:min-h-[178px] sm:px-3"
                onClick={() => onSelectType(type)}
              >
                <FolderIllustration className="mb-2 h-[66px] w-[76px] drop-shadow-[0_5px_5px_rgba(49,94,70,0.14)] transition-transform duration-200 group-hover:scale-[1.06] sm:h-[76px] sm:w-[88px]" />
                <span className="block w-full truncate text-[14px] font-semibold text-[#2c392f]">{labelForType(type)}</span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  const categoryFolders = folders.filter((folder) => folder.document_type === selectedType);
  const visibleGroups = getGroupsForFolder(groups, selectedType, selectedFolderId);
  const selectedFolder = categoryFolders.find((folder) => folder.id === selectedFolderId);
  return (
    <section key={`${selectedType}-${selectedFolderId ?? "root"}`} className="jobo-enter pt-6" aria-labelledby="selected-category-heading">
      <button
        className="mb-4 inline-flex items-center gap-1 rounded-md py-1 text-xs font-semibold text-[#55725c] hover:text-green focus-visible:outline-2 focus-visible:outline-green"
        onClick={() => onSelectType(null)}
      >
        <ChevronLeft size={15} /> All categories
      </button>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FolderIllustration className="h-10 w-12 shrink-0 drop-shadow-[0_3px_3px_rgba(49,94,70,0.14)]" />
          <div>
            <h2 id="selected-category-heading" className="mb-0 text-lg font-semibold text-[#2e3b32]">
              {selectedFolder?.name ?? labelForType(selectedType)}
            </h2>
            <p className="mb-0 mt-1 text-xs text-muted">
              {selectedFolder ? `In ${labelForType(selectedType)}` : documentTypeDescriptions[selectedType]}
            </p>
          </div>
        </div>
        {selectedFolder && (
          <button
            className="rounded-lg border border-[#dce4dd] bg-white px-3 py-2 text-xs font-semibold text-[#55725c] hover:bg-[#fbfdfb]"
            onClick={() => onSelectFolder(null)}
          >
            View category
          </button>
        )}
      </div>

      {!selectedFolderId && (
        <div className="mb-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#76847a]">Purpose folders</h3>
          {categoryFolders.length ? (
            <div className="jobo-stagger grid grid-cols-2 gap-3 min-[460px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {categoryFolders.map((folder) => {
                const count = groups.reduce(
                  (total, group) => total + group.versions.filter((version) => version.folder_id === folder.id).length,
                  0,
                );
                return (
                  <button
                    key={folder.id}
                    className="group flex min-h-[126px] flex-col items-center rounded-lg px-2 py-3 text-center transition duration-200 hover:-translate-y-0.5 hover:bg-green-soft active:translate-y-0 focus-visible:outline-2 focus-visible:outline-green"
                    onClick={() => onSelectFolder(folder.id)}
                  >
                    <FolderIllustration className="mb-1 h-[58px] w-[68px] drop-shadow-[0_4px_4px_rgba(49,94,70,0.14)] transition-transform duration-200 group-hover:scale-[1.05]" />
                    <span className="block w-full truncate text-[12px] font-medium text-[#36443a]">{folder.name}</span>
                    <span className="mt-1 block text-[11px] text-muted">{count} {count === 1 ? "file" : "files"}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mb-0 rounded-lg border border-dashed border-[#dce5dd] bg-white/60 px-4 py-3 text-xs text-muted">
              No purpose folders yet. Create one for a specific goal, such as “Graduate applications”.
            </p>
          )}
        </div>
      )}

      <DocumentWorkspace
        key={`${selectedType}-${selectedFolderId ?? "root"}`}
        documentType={selectedType}
        groups={visibleGroups}
        busy={busy}
        onOpen={onOpen}
        onUpload={onUpload}
        onDelete={onDelete}
      />
    </section>
  );
}
