/**
 * 감염병 격리 관리 — UC-TRI-05 (Jira UD2-11)
 * 백엔드 IsolationAssessmentDto 미러링.
 */
export interface IsolationAssessment {
  id: string;
  receptionId: string;
  isolationTypeCode: string;
  requiredYn: string;
  decidedById: string;
  decidedAt: string;
  releasedAt: string | null;
}

/** 백엔드 IsolationCreateRequestDto 미러링 */
export interface IsolationCreateRequest {
  patientId?: string;
  encounterId: string;
  isolationTypeCode: string;
  requiredYn?: "Y" | "N";
  decidedById?: string;
}

/** 격리 유형 옵션(공통코드 ER_ISOLATION_TYPE_CD 와 같은 값, 숫자 2자리) */
export const ISOLATION_TYPE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  // 접촉주의
  { value: "01", label: "Contact Precautions" },
  // 비말주의
  { value: "02", label: "Droplet Precautions" },
  // 공기주의
  { value: "03", label: "Airborne Precautions" },
  // 역격리(보호격리)
  { value: "04", label: "Protective Isolation" },
];

export interface IsolationState {
  items: IsolationAssessment[];
  loading: boolean;
  error: string;
  searched: boolean;
  submitting: boolean;
  submitError: string;
}
