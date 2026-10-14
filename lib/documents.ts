export type DocumentType =
  | "resume"
  | "qualification"
  | "certificate"
  | "cover_letter"
  | "other";

export type DocumentRecord = {
  id: string;
  document_group_id: string;
  version_number: number;
  title: string;
  document_type: DocumentType;
  folder_id: string | null;
  content: string;
  file_path: string | null;
  updated_at: string;
  created_at: string;
};

export type DocumentFolder = {
  id: string;
  name: string;
  document_type: DocumentType;
  created_at: string;
};

export type DocumentGroup = {
  id: string;
  title: string;
  document_type: DocumentType;
  latest: DocumentRecord;
  versions: DocumentRecord[];
};

export const documentTypes: DocumentType[] = ["resume", "qualification", "certificate", "cover_letter", "other"];

const documentTypeSlugs: Record<DocumentType, string> = {
  resume: "cv-resume",
  qualification: "qualifications",
  certificate: "certificates",
  cover_letter: "cover-letters",
  other: "other-documents",
};

export const documentTypeDescriptions: Record<DocumentType, string> = {
  resume: "CVs and resumes",
  qualification: "Degrees and qualifications",
  certificate: "Certificates and licenses",
  cover_letter: "Cover letters",
  other: "Other career documents",
};

export function documentTypePath(type: DocumentType): string {
  return `/${documentTypeSlugs[type]}`;
}

export function documentTypeFromSlug(slug: string): DocumentType | null {
  return documentTypes.find((type) => documentTypeSlugs[type] === slug) ?? null;
}

export function groupDocuments(documents: DocumentRecord[]): DocumentGroup[] {
  const grouped = new Map<string, DocumentGroup>();
  for (const document of documents) {
    const current = grouped.get(document.document_group_id);
    if (current) {
      current.versions.push(document);
      if (new Date(document.created_at).getTime() > new Date(current.latest.created_at).getTime()) {
        current.latest = document;
        current.title = document.title;
      }
    } else {
      grouped.set(document.document_group_id, {
        id: document.document_group_id,
        title: document.title,
        document_type: document.document_type,
        latest: document,
        versions: [document],
      });
    }
  }
  return Array.from(grouped.values()).map((group) => ({
    ...group,
    versions: group.versions.sort(
      (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    ),
  }));
}

export function getGroupsForFolder(
  groups: DocumentGroup[],
  documentType: DocumentType,
  folderId: string | null,
): DocumentGroup[] {
  return groups
    .map((group) => {
      const versions = group.versions.filter((version) =>
        version.document_type === documentType && version.folder_id === folderId
      );
      if (versions.length === 0) return null;
      return {
        ...group,
        title: versions[0].title,
        document_type: documentType,
        latest: versions[0],
        versions,
      };
    })
    .filter((group): group is DocumentGroup => group !== null);
}

export function labelForType(type: DocumentType): string {
  return {
    resume: "CVs / Resumes",
    qualification: "Qualifications",
    certificate: "Certificates",
    cover_letter: "Cover letters",
    other: "Other documents",
  }[type];
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
