/**
 * 약물 투여 기록(MAR) — UC-CARE-04 (Jira UD2-19)
 * 백엔드 MarDto / MarCreateRequestDto 미러링. 처방 원장은 GR2 — 응급은 투여 사실만 기록하고 orderId 를 참조한다.
 */
export interface MedicationAdministration {
  id: string;
  receptionId: string;
  orderId: string;
  orderItemId: string | null;
  drugCode: string;
  dose: string;
  routeCode: string;
  administeredById: string;
  administeredAt: string;
}

export interface MedicationCreateRequest {
  encounterId: string;
  /** GR2 처방 ID(UUID 문자열, 필수) */
  orderId: string;
  orderItemId?: string;
  drugCode: string;
  dose: string;
  routeCode: string;
  administeredById: string;
  administeredAt: string;
}

/** 투여경로 폴백 — admin 기존 그룹 ADMIN_ROUTE_CD 와 같은 값 */
export const ADMIN_ROUTE_FALLBACK_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "01", label: "PO" },
  { value: "02", label: "IV" },
  { value: "03", label: "IM" },
  { value: "04", label: "SC" },
  { value: "05", label: "Topical" },
  { value: "06", label: "Other" },
];

export interface MedicationState {
  items: MedicationAdministration[];
  loading: boolean;
  error: string;
  submitting: boolean;
  submitError: string;
}
