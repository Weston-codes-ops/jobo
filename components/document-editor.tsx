import { ArrowRight, X } from "lucide-react";
import type { FormEvent } from "react";
import { documentTypes, labelForType, type DocumentFolder, type DocumentRecord, type DocumentType } from "@/lib/documents";

type DocumentEditorProps = {
  document: DocumentRecord | null;
  busy: boolean;
  title: string;
  content: string;
  type: DocumentType;
  folderId: string | null;
  folders: DocumentFolder[];
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onTypeChange: (value: DocumentType) => void;
  onFolderChange: (value: string | null) => void;
  onClose: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
};

const fieldClassName = "w-full rounded-lg border border-[#dce4dd] bg-white px-3 py-2.5 text-[13px] font-normal text-[#29352d] outline-none focus:border-[#7da187] focus:ring-4 focus:ring-[#eaf2eb]";
const labelClassName = "mb-4 grid gap-1.5 text-xs font-semibold text-[#58655c]";

export function DocumentEditor({
  document,
  busy,
  title,
  content,
  type,
  folderId,
  folders,
  onTitleChange,
  onContentChange,
  onTypeChange,
  onFolderChange,
  onClose,
  onSave,
}: DocumentEditorProps) {
  return (
    <form onSubmit={onSave} className="jobo-enter border border-[#dfe7e0] bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <span className="text-[11px] font-bold tracking-[1.15px] text-[#718277]">
            {document ? `NEW VERSION · CURRENTLY V${document.version_number}` : "PRIVATE DOCUMENT"}
          </span>
          <h2 className="mb-0 mt-2 text-lg font-semibold text-[#2e3b32]">
            {document ? "Save a new version" : "Write a document"}
          </h2>
        </div>
        <button type="button" className="grid size-9 place-items-center rounded-lg text-[#77837a] hover:bg-[#f2f5f2] focus-visible:outline-2 focus-visible:outline-green" onClick={onClose} aria-label="Close editor">
          <X size={18} />
        </button>
      </div>

      <div className="grid gap-x-4 sm:grid-cols-2">
        <label className={`${labelClassName} sm:col-span-2`}>Document name
          <input required className={fieldClassName} value={title} onChange={(event) => onTitleChange(event.target.value)} placeholder="e.g. Product design CV" />
        </label>
        <label className={labelClassName}>Type
          <select className={fieldClassName} value={type} onChange={(event) => onTypeChange(event.target.value as DocumentType)}>
            {documentTypes.map((option) => <option key={option} value={option}>{labelForType(option)}</option>)}
          </select>
        </label>
        <label className={labelClassName}>Folder
          <select className={fieldClassName} value={folderId ?? ""} onChange={(event) => onFolderChange(event.target.value || null)}>
            <option value="">Category folder</option>
            {folders.filter((folder) => folder.document_type === type).map((folder) => (
              <option key={folder.id} value={folder.id}>{folder.name}</option>
            ))}
          </select>
        </label>
        <label className={`${labelClassName} sm:col-span-2`}>Content
          <textarea className={`${fieldClassName} min-h-[180px] resize-y leading-relaxed`} rows={9} value={content} onChange={(event) => onContentChange(event.target.value)} placeholder="Write or paste your reusable career information here." />
        </label>
      </div>

      <div className="flex flex-col items-start justify-between gap-3 pt-1 sm:flex-row sm:items-center">
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green px-4 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(49,94,70,0.14)] transition duration-200 hover:-translate-y-0.5 hover:bg-green-hover hover:shadow-[0_7px_18px_rgba(49,94,70,0.2)] active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green disabled:cursor-not-allowed disabled:opacity-55" disabled={busy}>
          {busy ? "Saving…" : document ? "Save new version" : "Save document"} <ArrowRight size={15} />
        </button>
      </div>
    </form>
  );
}
