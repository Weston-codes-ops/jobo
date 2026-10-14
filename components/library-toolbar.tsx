import { FolderPlus, Plus, Upload } from "lucide-react";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { documentTypes, labelForType, type DocumentFolder, type DocumentType } from "@/lib/documents";

type LibraryToolbarProps = {
  signedIn: boolean;
  busy: boolean;
  loading: boolean;
  documentCount: number;
  versionCount: number;
  documentType: DocumentType | null;
  selectedFolderId: string | null;
  folders: DocumentFolder[];
  folderName: string | null;
  onUpload: (
    event: ChangeEvent<HTMLInputElement>,
    destination?: { documentType: DocumentType; folderId: string | null },
  ) => void;
  onCreate: () => void;
  onCreateFolder: () => void;
};

export function LibraryToolbar({
  signedIn,
  busy,
  loading,
  documentCount,
  versionCount,
  documentType,
  selectedFolderId,
  folders,
  folderName,
  onUpload,
  onCreate,
  onCreateFolder,
}: LibraryToolbarProps) {
  const [uploadType, setUploadType] = useState<DocumentType | "">("");
  const [uploadFolderId, setUploadFolderId] = useState("");
  const targetType = documentType ?? uploadType;
  const targetFolderId = documentType ? selectedFolderId : uploadFolderId || null;
  const uploadFolders = folders.filter((folder) => folder.document_type === uploadType);

  return (
    <>
      <div className="jobo-enter flex flex-col items-start justify-between gap-6 pb-7 min-[860px]:flex-row min-[860px]:items-end">
        <div className="w-full min-[860px]:w-auto">
          <h1 className="mb-2 mt-0 max-w-[560px] text-[32px] font-semibold leading-[1.08] tracking-[-1.5px] text-[#26352b] sm:text-[42px] sm:tracking-[-2px]">
            Your career documents library
          </h1>
          <p className="mb-0 max-w-[490px] text-xs leading-[1.75] text-olive-900 sm:text-xs">
            Keep every CV, qualification, and certificate easy to find when an opportunity comes along.
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 min-[860px]:flex min-[860px]:w-auto min-[860px]:shrink-0 min-[860px]:items-end">
          {documentType && signedIn && (
            <button
              className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#dce4dd] bg-white px-3 text-xs font-semibold text-[#35473a] transition duration-200 hover:-translate-y-0.5 hover:border-[#cbd9ce] hover:bg-[#fbfdfb] active:translate-y-0 focus-visible:outline-2 focus-visible:outline-green min-[860px]:col-span-1 min-[860px]:px-4 min-[860px]:text-[13px]"
              onClick={onCreateFolder}
            >
              <FolderPlus size={17} /> New folder
            </button>
          )}
          {!documentType && signedIn && (
            <>
              <select
                className="col-span-2 min-h-10 rounded-lg border border-[#dce4dd] bg-white px-3 text-xs text-[#35473a] outline-none focus:border-[#7da187] focus:ring-4 focus:ring-green-soft min-[860px]:col-span-1"
                aria-label="Choose a category for the upload"
                value={uploadType}
                onChange={(event) => {
                  setUploadType(event.target.value as DocumentType | "");
                  setUploadFolderId("");
                }}
                disabled={busy}
              >
                <option value="">Choose a category</option>
                {documentTypes.map((type) => <option key={type} value={type}>{labelForType(type)}</option>)}
              </select>
              {uploadType && uploadFolders.length > 0 && (
                <select
                  className="col-span-2 min-h-10 rounded-lg border border-[#dce4dd] bg-white px-3 text-xs text-[#35473a] outline-none focus:border-[#7da187] focus:ring-4 focus:ring-green-soft min-[860px]:col-span-1"
                  aria-label="Choose an optional purpose folder"
                  value={uploadFolderId}
                  onChange={(event) => setUploadFolderId(event.target.value)}
                  disabled={busy}
                >
                  <option value="">No purpose folder</option>
                  {uploadFolders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
                </select>
              )}
            </>
          )}
          <label className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#dce4dd] bg-white px-3 text-xs font-semibold text-[#35473a] transition duration-200 hover:-translate-y-0.5 hover:border-[#cbd9ce] hover:bg-[#fbfdfb] active:translate-y-0 min-[860px]:px-4 min-[860px]:text-[13px] ${(!signedIn || busy || !targetType) ? "cursor-not-allowed opacity-55" : "cursor-pointer"}`}>
            <Upload size={17} /> Upload file
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(event) => onUpload(event, targetType ? { documentType: targetType, folderId: targetFolderId } : undefined)}
              hidden
              disabled={!signedIn || busy || !targetType}
            />
          </label>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 hover:cursor-pointer bg-green px-3 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(49,94,70,0.14)] transition duration-200 hover:-translate-y-0.5 hover:bg-green-hover hover:shadow-[0_7px_18px_rgba(49,94,70,0.2)] active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green disabled:cursor-not-allowed disabled:opacity-55 min-[860px]:px-4 min-[860px]:text-[13px]"
            onClick={onCreate}
          >
            <Plus size={17} /> New document
          </button>
          {folderName && (
            <span className="col-span-2 text-right text-xs text-[#718078] min-[860px]:col-span-1">
              Saving in <strong className="font-semibold text-[#46554a]">{folderName}</strong>
            </span>
          )}
        </div>
      </div>
    </>
  );
}
