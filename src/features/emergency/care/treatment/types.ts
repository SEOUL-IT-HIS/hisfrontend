/**
 * 응급 처치 기록 — UC-CARE-03 (Jira UD2-18)
 * 백엔드 TreatmentRecordDto / TreatmentCreateRequestDto 미러링. 처방 원장은 GR2, 여기서는 orderId 참조만 한다.
 */
export interface TreatmentRecord {
  id: string;
  receptionId: string;
  orderId: string;
  treatmentTypeCode: string;
  description: string | null;
  performedById: string;
  performedAt: string;
}

export interface TreatmentCreateRequest {
  encounterId: string;
  /** GR2 처방 ID(UUID 문자열, 필수 — CLAUDE.md 12장) */
  orderId: string;
  treatmentCode: string;
  description?: string;
  performedById: string;
}

/** 처치 종류 폴백 — 공통코드 ER_TREATMENT_TYPE_CD 와 같은 값(숫자 2자리) */
export const TREATMENT_TYPE_FALLBACK_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "01", label: "Airway" },
  { value: "02", label: "IV Access" },
  { value: "03", label: "Suture" },
  { value: "04", label: "Cast/Splint" },
  { value: "05", label: "Wound Care" },
  { value: "06", label: "Oxygen Therapy" },
  { value: "07", label: "Catheterization" },
  { value: "08", label: "Other" },
];

export interface TreatmentState {
  items: TreatmentRecord[];
  loading: boolean;
  error: string;
  submitting: boolean;
  submitError: string;
}
