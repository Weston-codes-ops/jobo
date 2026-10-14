"use client";

import { FolderPlus, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { labelForType, type DocumentType } from "@/lib/documents";

type CreateFolderDialogProps = {
  documentType: DocumentType;
  busy: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<string | null>;
};

export function CreateFolderDialog({ documentType, busy, onClose, onCreate }: CreateFolderDialogProps) {
  const [name, setName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = await onCreate(name.trim());
    if (error) {
      setErrorMessage(error);
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-20 grid place-items-center overflow-y-auto bg-[rgba(24,36,27,0.48)] p-5 backdrop-blur-sm max-[600px]:items-end max-[600px]:p-[9px]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="jobo-enter relative w-full max-w-[420px] rounded-2xl border border-[#e6ebe6] bg-white p-5 shadow-[0_24px_80px_rgba(15,24,15,0.2)] sm:p-7 max-[600px]:pb-[max(1.25rem,env(safe-area-inset-bottom))]" role="dialog" aria-modal="true" aria-labelledby="folder-heading">
        <button className="absolute right-4 top-4 grid size-9 place-items-center rounded-lg text-[#77837a] hover:bg-[#f2f5f2] focus-visible:outline-2 focus-visible:outline-green" onClick={onClose} aria-label="Close create folder">
          <X size={18} />
        </button>
        <span className="mb-4 grid size-11 place-items-center rounded-xl bg-green-soft text-green"><FolderPlus size={21} /></span>
        <h2 id="folder-heading" className="mb-1 text-lg font-semibold text-[#2e3b32]">Create a purpose folder</h2>
        <p className="mb-5 text-[13px] text-muted">This folder will be inside <strong className="font-semibold text-[#46554a]">{labelForType(documentType)}</strong>.</p>
        <form onSubmit={handleSubmit}>
          <label className="mb-4 grid gap-1.5 text-xs font-semibold text-[#58655c]">
            Folder name
            <input
              autoFocus
              required
              maxLength={80}
              value={name}
              onChange={(event) => { setName(event.target.value); setErrorMessage(""); }}
              placeholder="e.g. Graduate applications"
              className="h-[42px] w-full rounded-lg border border-[#dce4dd] bg-white px-3 text-[13px] font-normal text-[#29352d] outline-none focus:border-[#7da187] focus:ring-4 focus:ring-[#eaf2eb]"
            />
          </label>
          {errorMessage && <p className="mb-3 text-xs text-[#a74738]" role="alert">{errorMessage}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-lg border border-[#dce4dd] px-4 py-2.5 text-[13px] font-semibold text-[#526158] hover:bg-[#f8faf8]" onClick={onClose}>Cancel</button>
            <button disabled={busy || !name.trim()} className="rounded-lg bg-green px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-green-hover disabled:cursor-not-allowed disabled:opacity-55">
              {busy ? "Creating…" : "Create folder"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
