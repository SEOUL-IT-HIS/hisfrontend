/**
 * 패혈증-뇌졸중 위험도 스크리닝 — UC-TRI-06 (Jira UD2-12)
 * 백엔드 RiskScreeningDto 미러링.
 */
export interface RiskScreening {
  id: string;
  receptionId: string;
  screeningTypeCode: string;
  score: number | null;
  resultCode: string | null;
  screenedById: string;
  screenedAt: string;
}

/** 백엔드 RiskScreeningCreateRequestDto 미러링 */
export interface RiskScreeningCreateRequest {
  encounterId: string;
  screenType: string;
  score?: number;
  resultCode?: string;
  screenedById?: string;
}

export const SCREEN_TYPE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  // 패혈증
  { value: "01", label: "Sepsis" },
  // 뇌졸중
  { value: "02", label: "Stroke" },
];

export const SCREEN_RESULT_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  // 음성
  { value: "01", label: "Negative" },
  // 양성
  { value: "02", label: "Positive" },
  // 판정보류
  { value: "03", label: "Inconclusive" },
];

export interface RiskScreeningState {
  items: RiskScreening[];
  loading: boolean;
  error: string;
  searched: boolean;
  submitting: boolean;
  submitError: string;
}
