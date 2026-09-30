/**
 * 병리검사결과(pathologyresult) 타입 — UC-RST-03 병리검사결과등록 (Jira ZP2-15, 5차 Phase 4)
 * 백엔드 labresult/pathology/dto 와 필드명을 맞춘다.
 */

/** 병리 결과 — 백엔드 PathologyResultSummaryDto */
export interface PathologyResultSummary {
  pathologyResultId: string;
  labOrderItemId: string;
  labItemCode: string;
  /** PATHOLOGY_TYPE_CD (01 조직 / 02 세포) */
  pathologyTypeCode: string;
  diagnosisCode?: string;
  /** 육안/현미경/진단 구획을 합친 소견 (D6 — FINDINGS_SECTIONS 참고) */
  findings: string;
  attachmentYn: "Y" | "N";
  attachmentFileName?: string;
  attachmentContentType?: string;
  /** 01 등록 / 02 확정 */
  resultStatusCode: string;
  recordedAt: string;
  recordedById: string;
  confirmedAt?: string;
  confirmedById?: string;
  updatedAt?: string;
}

/** 등록 요청의 JSON 파트 — 백엔드 PathologyResultCreateRequestDto (첨부는 별도 file 파트) */
export interface PathologyResultCreateRequest {
  labOrderItemId: string;
  pathologyTypeCode: string;
  diagnosisCode?: string;
  findings: string;
  recordedById: string;
}

/** 수정 요청의 JSON 파트 (확정 전만) — file 파트를 같이 보내면 첨부 교체 */
export type PathologyResultUpdateRequest = Omit<PathologyResultCreateRequest, "labOrderItemId" | "recordedById">;

/**
 * 소견 구획 (D6). 컬럼이 findings 하나뿐이라 화면에서 구획을 나눠 받고, 제목을 붙여 한 문자열로 합친다.
 * ⚠ 제목 문자열이 곧 저장 형식이다. 바꾸면 이미 저장된 소견을 구획으로 되돌려 읽지 못한다.
 */
export const FINDINGS_SECTIONS = [
  { key: "gross", title: "[Gross Findings]" },
  { key: "microscopic", title: "[Microscopic Findings]" },
  { key: "diagnosis", title: "[Diagnosis]" },
] as const;

export type FindingsSectionKey = (typeof FINDINGS_SECTIONS)[number]["key"];
export type FindingsSections = Record<FindingsSectionKey, string>;

export interface PathologyResultState {
  /** 이 접수의 병리 결과 (병리 항목마다 0~1건) */
  results: PathologyResultSummary[];
  loading: boolean;
  loadError: string;
  submitting: boolean;
  submitError: string;
  lastSubmitted: PathologyResultSummary | null;
}
