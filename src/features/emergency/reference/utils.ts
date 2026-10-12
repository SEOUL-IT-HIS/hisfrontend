import {
  REFERENCE_DOCUMENT_EXTENSIONS,
  REFERENCE_DOCUMENT_MAX_BYTES,
  type ReferenceDocument,
} from "@/features/emergency/reference/types";

/** 파일 크기를 "512 B" / "48.3 KB" / "2.1 MB" 로 표시한다. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** 확장자(소문자). 없으면 빈 문자열. 경로 구분자 앞은 버린다 */
export function fileExtension(fileName: string): string {
  const name = fileName.replace(/\\/g, "/").split("/").pop() ?? "";
  const dot = name.lastIndexOf(".");
  return dot < 0 || dot === name.length - 1 ? "" : name.slice(dot + 1).toLowerCase();
}

/**
 * 올리기 전에 고른 파일을 확인한다. 문제가 있으면 안내 문구를, 괜찮으면 빈 문자열을 돌려준다.
 * 서버가 같은 규칙으로 다시 확인한다(여기는 빨리 알려주기 위한 것이다).
 */
export function validateReferenceFile(file: File): string {
  if (file.size === 0) {
    // 빈 파일은 올릴 수 없습니다.
    return "An empty file cannot be uploaded.";
  }
  if (file.size > REFERENCE_DOCUMENT_MAX_BYTES) {
    // 파일은 10MB 이하여야 합니다.
    return `The file must be ${REFERENCE_DOCUMENT_MAX_BYTES / (1024 * 1024)} MB or smaller.`;
  }
  const extension = fileExtension(file.name);
  if (!REFERENCE_DOCUMENT_EXTENSIONS.includes(extension)) {
    // 올릴 수 없는 파일 형식입니다.
    return `This file type is not allowed. Allowed: ${REFERENCE_DOCUMENT_EXTENSIONS.join(", ")}.`;
  }
  return "";
}

/** 브라우저에서 바로 열리는 형식(pdf·이미지)인지 — 아니면 내려받는다 */
export function opensInBrowser(item: Pick<ReferenceDocument, "contentType">): boolean {
  return item.contentType === "application/pdf" || item.contentType.startsWith("image/");
}

/** 목록에 있는 분류를 중복 없이 이름순으로 */
export function categoriesOf(items: ReadonlyArray<ReferenceDocument>): string[] {
  return [...new Set(items.map((item) => item.category).filter((c): c is string => !!c))].sort((a, b) => a.localeCompare(b));
}

/** 제목·분류·파일 이름에 검색어가 들어 있고(대소문자 무시), 분류를 골랐다면 그 분류인 문서만 */
export function filterReferenceDocuments(
  items: ReadonlyArray<ReferenceDocument>,
  keyword: string,
  category: string,
): ReferenceDocument[] {
  const needle = keyword.trim().toLowerCase();
  return items.filter((item) => {
    if (category && item.category !== category) return false;
    if (!needle) return true;
    return [item.title, item.category ?? "", item.fileName].some((value) => value.toLowerCase().includes(needle));
  });
}
