import type { CongestionLevel } from "@/features/emergency/resource/congestion/types";

/**
 * 응급실 종합 현황판 — UC-MON-01 (Jira UD2-36)
 * 백엔드 DashboardDto / LosAlertDto 미러링.
 */
export interface LosAlert {
  id: string;
  receptionId: string;
  thresholdMinutes: number | null;
  triggeredAt: string;
  acknowledgedById: string | null;
  acknowledgedAt: string | null;
}

/** 백엔드 LosAlertAcknowledgeRequestDto 미러링 */
export interface LosAlertAcknowledgeRequest {
  acknowledgedById: string;
}

export interface Dashboard {
  /** 재실 환자 = 접수 중 퇴실 결정이 아직 없는 건 */
  currentPatients: number;
  occupiedBeds: number;
  availableBeds: number;
  congestionRate: number | null;
  congestionLevel: CongestionLevel;
  openLosAlerts: number;
  recentLosAlerts: LosAlert[];
}

export interface DashboardState {
  data: Dashboard | null;
  loading: boolean;
  error: string;
  /** 마지막으로 성공한 조회 시각 (프론트 기준) */
  fetchedAt: string | null;
  acknowledging: boolean;
  acknowledgeError: string;
}

export const DASHBOARD_POLL_INTERVAL_MS = 30_000;
