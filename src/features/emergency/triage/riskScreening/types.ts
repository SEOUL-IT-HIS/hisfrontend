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
  { value: "SEPSIS", label: "패혈증" },
  { value: "STROKE", label: "뇌졸중" },
];

export const SCREEN_RESULT_OPTIONS: ReadonlyArray<{ value: "NEGATIVE" | "POSITIVE" | "INCONCLUSIVE"; label: string }> = [
  { value: "NEGATIVE", label: "음성" },
  { value: "POSITIVE", label: "양성" },
  { value: "INCONCLUSIVE", label: "판정보류" },
];

export interface RiskScreeningState {
  items: RiskScreening[];
  loading: boolean;
  error: string;
  searched: boolean;
  submitting: boolean;
  submitError: string;
}
