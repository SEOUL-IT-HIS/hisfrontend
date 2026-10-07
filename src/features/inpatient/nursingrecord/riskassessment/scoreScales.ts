/**
 * 위험도 평가 유형별 점수 체계 — 점수 입력칸의 범위·예시·안내에 씀
 * - 코드에는 유형(FALL/PRESSURE_ULCER/PAIN)만 있고 어떤 평가 도구를 쓰는지는 없어서,
 *   가장 널리 쓰는 도구(낙상 Morse, 욕창 Braden, 통증 NRS)의 범위로 잡은 제안값
 *   → 병동에서 다른 도구를 쓰면 여기만 고치면 됨 (입력 범위가 곧 도구의 점수 범위라 틀리면 정상 점수가 막힘)
 * - 서버(RiskAssessmentDTO.score)는 정수이고 범위 검증은 아직 없음
 */
export type ScoreScale = {
  name: string;
  min: number;
  max: number;
  example: string;
  /** 점수 방향 — 욕창(Braden)은 낮을수록 위험해서 헷갈리기 쉬움 */
  direction: string;
};

export const RISK_SCORE_SCALES: Record<string, ScoreScale> = {
  FALL: { name: "Morse Fall Scale", min: 0, max: 125, example: "45", direction: "Higher score = higher risk" },
  PRESSURE_ULCER: { name: "Braden Scale", min: 6, max: 23, example: "15", direction: "Lower score = higher risk" },
  PAIN: { name: "Pain NRS", min: 0, max: 10, example: "5", direction: "Higher score = more pain" },
};

/** 유형을 아직 고르지 않았을 때의 입력 범위 — 모든 유형을 포함하는 바깥 범위 */
export const DEFAULT_SCORE_LIMIT = { min: 0, max: 125 };

export const getScoreScale = (assessmentTypeCd: string): ScoreScale | null =>
  RISK_SCORE_SCALES[assessmentTypeCd] ?? null;
