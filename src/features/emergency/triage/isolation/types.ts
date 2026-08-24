/**
 * 감염병 격리 관리 — UC-TRI-05 (Jira UD2-11)
 * 백엔드 IsolationAssessmentDto 미러링.
 */
export interface IsolationAssessment {
  id: string;
  receptionNo: string;
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

/** 격리 유형 옵션. TODO: ADM commonCodes 연동 전까지 임시 상수 (요구사항 명시된 4종) */
export const ISOLATION_TYPE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "CONTACT", label: "접촉주의" },
  { value: "DROPLET", label: "비말주의" },
  { value: "AIRBORNE", label: "공기주의" },
  { value: "PROTECTIVE", label: "역격리(보호격리)" },
];

export interface IsolationState {
  items: IsolationAssessment[];
  loading: boolean;
  error: string;
  searched: boolean;
  submitting: boolean;
  submitError: string;
}
