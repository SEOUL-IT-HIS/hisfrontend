/**
 * KTAS 등급 분류/재평가 — UC-TRI-02/03 (Jira UD2-9, UD2-43)
 * 백엔드 TriageAssessmentDto 미러링.
 */
export interface TriageAssessment {
  id: string;
  receptionNo: string;
  ktasLevelCode: string;
  /** "INITIAL" | "REASSESS" */
  assessmentTypeCode: string;
  assessedById: string;
  assessedAt: string;
  reason: string;
}

/** 백엔드 KtasCreateRequestDto 미러링 */
export interface KtasCreateRequest {
  patientId?: string;
  encounterId: string;
  ktasScore: string;
  assessmentTypeCode?: string;
  assessedById?: string;
  reason?: string;
}

/** 백엔드 KtasUpdateRequestDto 미러링 — PUT /ktas/{id} (재평가, 이력 신규 행으로 저장됨) */
export interface KtasUpdateRequest {
  ktasScore?: string;
  assessedById?: string;
  reason?: string;
}

/** KTAS 등급 선택 옵션. TODO: ADM commonCodes KTAS_LEVEL 연동 전까지 임시 상수 */
export const KTAS_LEVEL_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "1", label: "1단계 (소생)" },
  { value: "2", label: "2단계 (긴급)" },
  { value: "3", label: "3단계 (응급)" },
  { value: "4", label: "4단계 (준응급)" },
  { value: "5", label: "5단계 (비응급)" },
];

export interface KtasState {
  items: TriageAssessment[];
  loading: boolean;
  error: string;
  searched: boolean;
  submitting: boolean;
  submitError: string;
}
