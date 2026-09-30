/**
 * 혼잡도 지표 조회 — UC-RES-01 (Jira UD2-13)
 * 백엔드 CongestionDto / CongestionMetricDto 미러링.
 * 집계 규칙(백엔드 ResourceServiceImpl.getCongestion):
 *   가용 = EMPTY, 운영 병상 = 전체 - OUT_OF_SERVICE,
 *   혼잡도(%) = (운영 - 가용) / 운영 x 100, 운영 병상 0이면 null + NO_BEDS
 */
export type CongestionLevel = "NO_BEDS" | "LOW" | "MODERATE" | "HIGH" | "SATURATED";

export interface CongestionMetric {
  /** 전체 합계면 null, 구역 미지정 병상은 "UNASSIGNED" */
  zoneCode: string | null;
  totalBeds: number;
  operationalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  cleaningBeds: number;
  outOfServiceBeds: number;
  unknownStatusBeds: number;
  congestionRate: number | null;
  congestionLevel: CongestionLevel;
}

export interface Congestion {
  total: CongestionMetric;
  zones: CongestionMetric[];
  calculatedAt: string;
}

export interface CongestionState {
  data: Congestion | null;
  loading: boolean;
  error: string;
}

/** 자동 갱신 주기 (UD2-83) */
export const CONGESTION_POLL_INTERVAL_MS = 30_000;

/** 등급 구간(UD2-83): 여유 <50, 보통 50~75 미만, 혼잡 75~90 미만, 포화 90 이상 — 백엔드와 동일 */
export const CONGESTION_LEVEL_META: Record<
  CongestionLevel,
  { label: string; badgeClass: string; barClass: string }
> = {
  // 병상 없음
  NO_BEDS: { label: "No Beds", badgeClass: "bg-slate-100 text-slate-500", barClass: "bg-slate-300" },
  // 여유
  LOW: { label: "Low", badgeClass: "bg-emerald-50 text-emerald-700", barClass: "bg-emerald-500" },
  // 보통
  MODERATE: { label: "Moderate", badgeClass: "bg-amber-50 text-amber-700", barClass: "bg-amber-500" },
  // 혼잡
  HIGH: { label: "Crowded", badgeClass: "bg-orange-50 text-orange-700", barClass: "bg-orange-500" },
  // 포화
  SATURATED: { label: "Saturated", badgeClass: "bg-rose-50 text-rose-700", barClass: "bg-rose-500" },
};
