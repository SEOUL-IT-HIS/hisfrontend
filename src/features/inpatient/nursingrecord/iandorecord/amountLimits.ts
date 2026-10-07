/**
 * I&O 기록 수량(mL) 입력 기준 — 수량 입력칸의 범위·예시·안내에 씀
 * - 한 번의 기록(1건)당 양이라 0 이하는 의미가 없고, 상한은 오타(예: 500 → 5000000)만 막는 넓은 값
 * - 상한 5000mL 는 일반적인 제안값 — 병동 기준이 따로 있으면 여기만 고치면 됨
 * - 서버(IandORecordDTO.amountMl)는 정수(Integer)이고 범위 검증은 아직 없음
 */
export const IO_AMOUNT_LIMIT = { min: 1, max: 5000 };

/** 경로별 예시값 — 칸의 placeholder. 경로를 아직 고르지 않았으면 기본 예시 */
export const IO_AMOUNT_EXAMPLE: Record<string, string> = {
  ORAL: "200",
  IV: "500",
  TUBE: "250",
  URINE: "300",
  STOOL: "150",
  VOMIT: "100",
  DRAIN: "50",
};
export const DEFAULT_IO_AMOUNT_EXAMPLE = "200";
