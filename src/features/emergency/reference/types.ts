/**
 * 응급 참고 문서 — 응급 직원이 찾아 보는 프로토콜·지침·서식 파일 (환자와 무관)
 * 백엔드 ReferenceDocumentDto 미러링. 파일 본문은 SeaweedFS 에 있고 여기에는 목록 정보만 온다.
 */
export interface ReferenceDocument {
  id: string;
  title: string;
  category: string | null;
  fileName: string;
  contentType: string;
  fileSize: number;
  uploadedById: string;
  uploadedAt: string;
}

/** saga 로 넘기는 업로드 요청 — File 은 액션에 싣지 않고 uploadHold 에 두고 키만 넘긴다 */
export interface ReferenceDocumentUploadRequest {
  fileKey: string;
  title?: string;
  category?: string;
  uploadedById: string;
}

/** api.ts 가 FormData 로 만드는 실제 전송 값 */
export interface ReferenceDocumentUploadPayload {
  file: File;
  title?: string;
  category?: string;
  uploadedById: string;
}

export interface ReferenceDocumentDeleteRequest {
  id: string;
  deletedById: string;
}

export interface ReferenceDocumentState {
  items: ReferenceDocument[];
  loading: boolean;
  error: string;
  uploading: boolean;
  uploadError: string;
  /** 삭제 요청 중인 문서 ID */
  deletingId: string;
  deleteError: string;
}

/** 파일 크기 상한(서버 app.reference-doc.max-file-size-mb 와 같다) */
export const REFERENCE_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

/** 올릴 수 있는 확장자(서버 허용 목록과 같다 — 서버가 최종 판단한다) */
export const REFERENCE_DOCUMENT_EXTENSIONS: ReadonlyArray<string> = [
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "txt",
  "csv",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "hwp",
  "hwpx",
];

/** 파일 선택창의 accept 값 */
export const REFERENCE_DOCUMENT_ACCEPT = REFERENCE_DOCUMENT_EXTENSIONS.map((ext) => `.${ext}`).join(",");

/** 제목·분류 글자 수 상한(서버와 같다) */
export const REFERENCE_DOCUMENT_TITLE_MAX = 200;
export const REFERENCE_DOCUMENT_CATEGORY_MAX = 50;
