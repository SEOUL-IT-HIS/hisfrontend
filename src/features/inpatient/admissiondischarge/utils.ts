/**
 * 재원일수 — 서버 입원료 청구(AdmissionServiceImpl.buildRoomFeeEvent)와 같은 기준
 * - 시각이 아니라 날짜(자정) 차이로 셈: 10/01 23:00 입원 → 10/02 = 1일
 * - 당일 입·퇴원도 최소 1일
 * - until: 퇴원신청 시각(청구 기준일). 없으면(아직 신청 전) 오늘까지
 */
export function calculateAdmissionDays(admissionDate: string, until?: string | null): number {
  const dayOf = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const start = new Date(admissionDate);
  const end = until ? new Date(until) : new Date();
  return Math.max(1, Math.round((dayOf(end) - dayOf(start)) / (1000 * 60 * 60 * 24)));
}
