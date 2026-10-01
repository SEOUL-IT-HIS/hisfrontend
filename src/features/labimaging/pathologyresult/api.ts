import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/labimaging/types";
import type { LabResultConfirmRequest } from "@/features/labimaging/labresult/types";
import {
  FINDINGS_SECTIONS,
  type FindingsSections,
  type PathologyResultCreateRequest,
  type PathologyResultSummary,
  type PathologyResultUpdateRequest,
} from "@/features/labimaging/pathologyresult/types";

/**
 * 병리검사결과 API — UC-RST-03 (ZP2-15). 백엔드 PathologyResultController 와 1:1.
 *
 * ⚠ 등록·수정은 multipart 다. "request" 파트에 JSON 을 application/json Blob 으로, "file" 파트에 첨부(선택).
 *   소견이 긴 서술형이라 폼 필드 대신 JSON 파트로 보낸다(줄바꿈·특수문자 안전).
 * ⚠ Content-Type 을 undefined 로 둬야 브라우저가 boundary 를 붙인다(영상 업로드 api 와 같은 처리).
 */
const PATHOLOGY_RESULT_PATH = "/api/lab-imaging/pathology-results";

function toMultipart(json: object, file?: File | null): FormData {
  const form = new FormData();
  form.append("request", new Blob([JSON.stringify(json)], { type: "application/json" }));
  if (file) form.append("file", file);
  return form;
}

export async function fetchPathologyResults(receptionNo: string): Promise<PathologyResultSummary[]> {
  const { data } = await apiClient.get<ApiResponse<PathologyResultSummary[]>>(
    `${PATHOLOGY_RESULT_PATH}/receptions/${encodeURIComponent(receptionNo)}`,
  );
  return data.data;
}

export async function createPathologyResult(
  request: PathologyResultCreateRequest,
  file?: File | null,
): Promise<PathologyResultSummary> {
  const { data } = await apiClient.post<ApiResponse<PathologyResultSummary>>(
    PATHOLOGY_RESULT_PATH,
    toMultipart(request, file),
    { headers: { "Content-Type": undefined } },
  );
  return data.data;
}

export async function updatePathologyResult(
  pathologyResultId: string,
  request: PathologyResultUpdateRequest,
  file?: File | null,
): Promise<PathologyResultSummary> {
  const { data } = await apiClient.put<ApiResponse<PathologyResultSummary>>(
    `${PATHOLOGY_RESULT_PATH}/${encodeURIComponent(pathologyResultId)}`,
    toMultipart(request, file),
    { headers: { "Content-Type": undefined } },
  );
  return data.data;
}

export async function confirmPathologyResult(
  pathologyResultId: string,
  request: LabResultConfirmRequest,
): Promise<PathologyResultSummary> {
  const { data } = await apiClient.post<ApiResponse<PathologyResultSummary>>(
    `${PATHOLOGY_RESULT_PATH}/${encodeURIComponent(pathologyResultId)}/confirm`,
    request,
  );
  return data.data;
}

/**
 * 첨부 미리보기용 Blob (ZP2-98). 화면에서 URL.createObjectURL 로 썸네일·PDF 를 연다.
 * ⚠ <img src="/api/..."> 로 바로 걸지 않는 이유 — 공통 axios 인터셉터(세션 만료 처리)를 거치게 하려고.
 */
export async function fetchPathologyAttachment(pathologyResultId: string): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(
    `${PATHOLOGY_RESULT_PATH}/${encodeURIComponent(pathologyResultId)}/attachment`,
    { responseType: "blob" },
  );
  return data;
}

// ---------------------------------------------------------------- 소견 구획 합치기/나누기 (D6)

/** 구획 → 저장 문자열. 빈 구획은 제목째 뺀다. */
export function joinFindings(sections: FindingsSections): string {
  return FINDINGS_SECTIONS.filter(({ key }) => sections[key].trim() !== "")
    .map(({ key, title }) => `${title}\n${sections[key].trim()}`)
    .join("\n\n");
}

/**
 * 저장 문자열 → 구획. 제목이 하나도 없는 옛 형식(또는 API 로 직접 넣은 값)은 통째로 진단 구획에 넣는다.
 */
export function splitFindings(findings: string): FindingsSections {
  const result: FindingsSections = { gross: "", microscopic: "", diagnosis: "" };
  const titles = FINDINGS_SECTIONS.map((s) => s.title);
  if (!titles.some((t) => findings.includes(t))) {
    result.diagnosis = findings;
    return result;
  }
  FINDINGS_SECTIONS.forEach(({ key, title }) => {
    const start = findings.indexOf(title);
    if (start < 0) return;
    const bodyStart = start + title.length;
    const nextStarts = titles
      .map((t) => findings.indexOf(t, bodyStart))
      .filter((i) => i >= 0);
    const end = nextStarts.length ? Math.min(...nextStarts) : findings.length;
    result[key] = findings.slice(bodyStart, end).trim();
  });
  return result;
}
