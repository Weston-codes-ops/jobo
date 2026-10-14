import { ExternalLink, FileText, History, MoreHorizontal, Trash2, Upload } from "lucide-react";
import type { ChangeEvent } from "react";
import { formatDate, labelForType, type DocumentGroup, type DocumentRecord } from "@/lib/documents";
import { FolderIllustration } from "@/ui/folder-illustration";

type DocumentCardProps = {
  group: DocumentGroup;
  busy: boolean;
  onOpen: (document: DocumentRecord) => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>, group: DocumentGroup) => void;
  onDelete: (document: DocumentRecord) => void;
};

export function DocumentCard({ group, busy, onOpen, onUpload, onDelete }: DocumentCardProps) {
  return (
    <article className="group/file relative flex min-w-0 flex-col items-center">
      <button
        className="flex min-h-[126px] w-full flex-col items-center rounded-lg px-2 py-3 text-center transition duration-200 hover:-translate-y-0.5 hover:bg-green-soft active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-green"
        onClick={() => onOpen(group.latest)}
        title={`${group.title} · ${labelForType(group.document_type)} · version ${group.latest.version_number}`}
        aria-label={`${group.latest.file_path ? "Open" : "Edit"} ${group.title}, ${labelForType(group.document_type)}, version ${group.latest.version_number}`}
      >
        <FolderIllustration className="mb-1 h-[72px] w-[82px] drop-shadow-[0_5px_5px_rgba(49,94,70,0.14)] transition-transform duration-200 group-hover/file:scale-[1.06] sm:h-[78px] sm:w-[90px]" />
        <span className="line-clamp-2 w-full break-words text-[12px] font-medium leading-snug text-[#39463d] sm:text-[13px]">{group.title}</span>
      </button>

      <details className="absolute right-0 top-0 z-10">
        <summary
          className="grid size-9 cursor-pointer list-none place-items-center rounded-full text-[#53675a] opacity-100 transition-colors hover:bg-[#e8eee9] focus-visible:outline-2 focus-visible:outline-green [&::-webkit-details-marker]:hidden sm:opacity-0 sm:group-hover/file:opacity-100 sm:group-focus-within/file:opacity-100"
          aria-label={`More actions for ${group.title}`}
          title="More actions"
        >
          <MoreHorizontal size={19} />
        </summary>
        <div className="absolute right-0 top-10 w-52 rounded-xl border border-[#e2e9e3] bg-white p-1.5 text-left shadow-[0_12px_32px_rgba(30,45,34,0.16)]">
          <label className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2.5 text-xs font-medium text-[#39463d] hover:bg-[#f2f6f2] ${busy ? "pointer-events-none opacity-50" : ""}`}>
            <Upload size={15} /> Upload a new version
            <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={(event) => onUpload(event, group)} hidden disabled={busy} />
          </label>
          {group.versions.length > 1 && (
            <details className="group/history">
              <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-lg px-2.5 text-xs font-medium text-[#39463d] hover:bg-[#f2f6f2] [&::-webkit-details-marker]:hidden">
                <History size={15} /> Version history
                <span className="ml-auto text-[#7b867e]">{group.versions.length}</span>
              </summary>
              <div className="max-h-52 overflow-y-auto border-t border-[#edf0ed] py-1">
                {group.versions.map((version) => (
                  <div className="flex items-center gap-1 px-1 py-1" key={version.id}>
                    <button
                      className="min-h-9 min-w-0 flex-1 truncate rounded-md px-1.5 text-left text-[11px] text-[#526158] hover:bg-[#f2f6f2] focus-visible:outline-2 focus-visible:outline-green"
                      onClick={() => onOpen(version)}
                      title={`${version.file_path ? "Open" : "Edit"} version ${version.version_number} from ${formatDate(version.created_at)}`}
                    >
                      {version.id === group.latest.id ? "Latest · " : ""}v{version.version_number} · {formatDate(version.created_at)}
                    </button>
                    <button
                      className="grid size-8 shrink-0 place-items-center rounded-md text-[#89938d] hover:bg-[#f8eeee] hover:text-[#9c5c53] focus-visible:outline-2 focus-visible:outline-green disabled:opacity-45"
                      onClick={() => onDelete(version)}
                      title={`Delete version ${version.version_number}`}
                      aria-label={`Delete ${group.title}, version ${version.version_number}`}
                      disabled={busy}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </details>
          )}
          <button
            className="flex min-h-10 w-full items-center gap-2 rounded-lg px-2.5 text-xs font-medium text-[#9c5c53] hover:bg-[#f8eeee] focus-visible:outline-2 focus-visible:outline-[#9c5c53] disabled:opacity-45"
            onClick={() => onDelete(group.latest)}
            disabled={busy}
          >
            <Trash2 size={15} /> Delete latest version
          </button>
        </div>
      </details>
    </article>
  );
}
