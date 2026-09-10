/**
 * 패혈증-뇌졸중 위험도 스크리닝 — UC-TRI-06 (Jira UD2-12)
 * 백엔드 RiskScreeningDto 미러링.
 */
export interface RiskScreening {
  id: string;
  receptionNo: string;
  screeningTypeCode: string;
  score: number | null;
  resultCode: string | null;
  screenedById: string;
  screenedAt: string;
}

/** 백엔드 RiskScreeningCreateRequestDto 미러링 */
export interface RiskScreeningCreateRequest {
  encounterId: string;
  screenType: "SEPSIS" | "STROKE";
  score?: number;
  resultCode?: "NEGATIVE" | "POSITIVE" | "INCONCLUSIVE";
  screenedById?: string;
}

export const SCREEN_TYPE_OPTIONS: ReadonlyArray<{ value: "SEPSIS" | "STROKE"; label: string }> = [
  // 패혈증
  { value: "SEPSIS", label: "Sepsis" },
  // 뇌졸중
  { value: "STROKE", label: "Stroke" },
];

export const SCREEN_RESULT_OPTIONS: ReadonlyArray<{ value: "NEGATIVE" | "POSITIVE" | "INCONCLUSIVE"; label: string }> = [
  // 음성
  { value: "NEGATIVE", label: "Negative" },
  // 양성
  { value: "POSITIVE", label: "Positive" },
  // 판정보류
  { value: "INCONCLUSIVE", label: "Inconclusive" },
];

export interface RiskScreeningState {
  items: RiskScreening[];
  loading: boolean;
  error: string;
  searched: boolean;
  submitting: boolean;
  submitError: string;
}
