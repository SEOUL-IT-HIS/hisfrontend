"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button } from "@/components/common";
import ActorField from "@/components/emergency/common/ActorField";
import { useActorId } from "@/features/emergency/common/staff";
import { resolveEmergencyMessage } from "@/features/emergency/messages";
import {
  acknowledgeLosAlertRequest,
  fetchDashboardRequest,
  selectDashboard,
  selectDashboardError,
  selectDashboardFetchedAt,
  selectDashboardLoading,
  selectLosAlertAcknowledgeError,
  selectLosAlertAcknowledging,
} from "@/features/emergency/monitor/slice";
import { DASHBOARD_POLL_INTERVAL_MS } from "@/features/emergency/monitor/types";
import { CONGESTION_LEVEL_META } from "@/features/emergency/resource/congestion/types";
import { formatDateTime } from "@/features/emergency/utils";

type DashboardSummaryProps = {
  className?: string;
  pollIntervalMs?: number;
};

function StatTile({ label, value, tone = "text-slate-800" }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function formatMinutes(minutes: number | null): string {
  if (minutes === null) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/**
 * 응급실 종합 현황판 요약 (UC-MON-01, Jira UD2-36)
 * - 재실 환자 / 병상(사용·가용) / 전체 혼잡도 / 미확인 장기체류 알림을 타일로 보여준다.
 * - 30초 자동 갱신 + 새로고침. 실패 시 직전 값 유지 + 재시도.
 */
export default function DashboardSummary({
  className = "",
  pollIntervalMs = DASHBOARD_POLL_INTERVAL_MS,
}: DashboardSummaryProps) {
  const dispatch = useDispatch<AppDispatch>();
  const dashboard = useSelector(selectDashboard);
  const loading = useSelector(selectDashboardLoading);
  const error = useSelector(selectDashboardError);
  const fetchedAt = useSelector(selectDashboardFetchedAt);
  const acknowledging = useSelector(selectLosAlertAcknowledging);
  const acknowledgeError = useSelector(selectLosAlertAcknowledgeError);
  const [typedAcknowledgedById, setTypedAcknowledgedById] = useState("");
  // 확인자는 기본이 로그인한 사람이고, 실제로 확인한 사람이 다르면 고른다.
  const acknowledgedById = useActorId(typedAcknowledgedById, "STAFF");

  useEffect(() => {
    dispatch(fetchDashboardRequest());
    const timer = setInterval(() => dispatch(fetchDashboardRequest()), pollIntervalMs);
    return () => clearInterval(timer);
  }, [dispatch, pollIntervalMs]);

  function handleRefresh() {
    dispatch(fetchDashboardRequest());
  }

  function handleAcknowledge(alertId: string) {
    if (!acknowledgedById) return;
    dispatch(acknowledgeLosAlertRequest(alertId, { acknowledgedById }));
  }

  const levelMeta = dashboard
    ? (CONGESTION_LEVEL_META[dashboard.congestionLevel] ?? CONGESTION_LEVEL_META.NO_BEDS)
    : null;

  return (
    <section className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* 응급실 현황 */}
        <h3 className="text-sm font-semibold text-slate-800">ER Status</h3>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {/* 마지막 갱신 */}
          <span>Last updated {formatDateTime(fetchedAt)}</span>
          <Button type="button" variant="secondary" className="h-7 px-3 text-xs" onClick={handleRefresh} disabled={loading}>
            {/* 갱신 중... / 새로고침 */}
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="flex flex-wrap items-center gap-2">
          <Alert variant="error" className="flex-1">
            {resolveEmergencyMessage(error)}
            {dashboard ? " (showing last successful result)" : ""}
          </Alert>
          <Button type="button" variant="secondary" onClick={handleRefresh} disabled={loading}>
            {/* 재시도 */}
            Retry
          </Button>
        </div>
      ) : null}

      {!dashboard ? (
        loading ? (
          // 현황판을 불러오는 중입니다...
          <p className="py-4 text-center text-sm text-slate-400">Loading ER status...</p>
        ) : null
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {/* 재실 환자 */}
            <StatTile label="Current Patients" value={dashboard.currentPatients} />
            {/* 사용 중 병상 */}
            <StatTile label="Occupied Beds" value={dashboard.occupiedBeds} />
            {/* 가용 병상 */}
            <StatTile label="Available Beds" value={dashboard.availableBeds} tone="text-emerald-700" />
            {/* 혼잡도 */}
            <StatTile
              label="Congestion"
              value={
                <span className={`rounded-full px-2 py-0.5 text-base ${levelMeta?.badgeClass ?? ""}`}>
                  {levelMeta?.label}
                  {dashboard.congestionRate !== null ? ` ${dashboard.congestionRate}%` : ""}
                </span>
              }
            />
            {/* 미확인 장기체류 알림 */}
            <StatTile
              label="Open Long-Stay Alerts"
              value={dashboard.openLosAlerts}
              tone={dashboard.openLosAlerts > 0 ? "text-rose-600" : "text-slate-800"}
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              {/* 미확인 장기체류 알림 (UC-MON-02, Jira UD2-37) */}
              <h4 className="text-sm font-semibold text-slate-700">Open Long-Stay Alerts</h4>
              {dashboard.recentLosAlerts.length > 0 ? (
                // 확인자
                <ActorField
                  label="Acknowledged By"
                  role="STAFF"
                  value={typedAcknowledgedById}
                  onChange={setTypedAcknowledgedById}
                  disabled={acknowledging}
                  className="w-[240px]"
                />
              ) : null}
            </div>
            {acknowledgeError ? (
              <Alert variant="error" className="mb-2">{resolveEmergencyMessage(acknowledgeError)}</Alert>
            ) : null}
            {dashboard.recentLosAlerts.length === 0 ? (
              // 확인이 필요한 장기체류 알림이 없습니다.
              <p className="text-sm text-slate-400">No open long-stay alerts.</p>
            ) : (
              <ul className="space-y-2 text-sm text-slate-600">
                {dashboard.recentLosAlerts.map((alert) => (
                  <li key={alert.id} className="flex flex-wrap items-center gap-3">
                    <span className="font-medium text-slate-700">{alert.patientName ?? alert.receptionId}</span>
                    {/* 기준 */}
                    <span>Threshold {formatMinutes(alert.thresholdMinutes)}</span>
                    {/* 발생 */}
                    <span className="text-slate-400">Triggered {formatDateTime(alert.triggeredAt)}</span>
                    <Button
                      type="button"
                      variant="secondary"
                      className="ml-auto h-7 px-3 text-xs"
                      onClick={() => handleAcknowledge(alert.id)}
                      disabled={acknowledging || !acknowledgedById}
                    >
                      {/* 확인 */}
                      Acknowledge
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
