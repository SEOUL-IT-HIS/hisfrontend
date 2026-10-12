import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/emergency/types";
import type { ReferenceDocument, ReferenceDocumentUploadPayload } from "@/features/emergency/reference/types";

const REFERENCE_PATH = "/api/emergency/reference-documents";

/** 업로드는 파일이 커서 공통 axios 의 기본 15초보다 넉넉히 기다린다 */
const UPLOAD_TIMEOUT_MS = 60_000;

/** 참고 문서 목록을 조회한다(삭제되지 않은 문서, 올린 시각 최신순). */
export async function getReferenceDocuments(): Promise<ReferenceDocument[]> {
  const { data } = await apiClient.get<ApiResponse<ReferenceDocument[]>>(REFERENCE_PATH);
  return data.data;
}

/**
 * 참고 문서를 올린다. POST /api/emergency/reference-documents (multipart/form-data)
 *
 * ⚠ 공통 axios 의 기본 Content-Type 이 application/json 이라, FormData 를 보낼 때는 이 요청에서만
 *   Content-Type 을 비워야 브라우저가 boundary 를 붙인 multipart 로 채운다
 *   (labimaging 의 영상 업로드와 같은 방식 — features/labimaging/imagingacquisition/api.ts 참고).
 */
export async function uploadReferenceDocument(payload: ReferenceDocumentUploadPayload): Promise<ReferenceDocument> {
  const form = new FormData();
  form.append("file", payload.file);
  if (payload.title) form.append("title", payload.title);
  if (payload.category) form.append("category", payload.category);
  form.append("uploadedById", payload.uploadedById);

  const { data } = await apiClient.post<ApiResponse<ReferenceDocument>>(REFERENCE_PATH, form, {
    headers: { "Content-Type": undefined },
    timeout: UPLOAD_TIMEOUT_MS,
  });
  return data.data;
}

/** 참고 문서를 목록에서 뺀다(상태 변경 — 서버가 저장소의 파일 본문도 지운다). */
export async function deleteReferenceDocument(id: string, deletedById: string): Promise<void> {
  await apiClient.delete<ApiResponse<null>>(`${REFERENCE_PATH}/${encodeURIComponent(id)}`, {
    params: { deletedById },
  });
}

/** 파일 본문 주소 — 새 탭에서 열거나 내려받는다(pdf·이미지는 바로 열리고 나머지는 내려받는다). */
export function referenceDocumentFileUrl(id: string): string {
  return `${REFERENCE_PATH}/${encodeURIComponent(id)}/file`;
}
