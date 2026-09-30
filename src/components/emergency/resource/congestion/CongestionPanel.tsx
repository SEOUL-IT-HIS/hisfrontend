"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button } from "@/components/common";
import { resolveEmergencyMessage } from "@/features/emergency/messages";
import {
  fetchCongestionRequest,
  selectCongestion,
  selectCongestionError,
  selectCongestionLoading,
} from "@/features/emergency/resource/congestion/slice";
import {
  CONGESTION_LEVEL_META,
  CONGESTION_POLL_INTERVAL_MS,
  type CongestionMetric,
} from "@/features/emergency/resource/congestion/types";
import { BED_ZONE_OPTIONS, ZONE_GROUP_CODE } from "@/features/emergency/resource/bed/types";
import {
  fetchAllCommonCodesRequest,
  selectCommonCodeLoaded,
  selectCommonCodesByGroup,
} from "@/features/emergency/commonCode/slice";

type CongestionPanelProps = {
  className?: string;
  pollIntervalMs?: number;
};

function formatTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function RateBar({ metric }: { metric: CongestionMetric }) {
  const meta = CONGESTION_LEVEL_META[metric.congestionLevel] ?? CONGESTION_LEVEL_META.NO_BEDS;
  const width = metric.congestionRate === null ? 0 : Math.min(Math.max(metric.congestionRate, 0), 100);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${meta.barClass}`} style={{ width: `${width}%` }} />
    </div>
  );
}

function LevelBadge({ metric }: { metric: CongestionMetric }) {
  const meta = CONGESTION_LEVEL_META[metric.congestionLevel] ?? CONGESTION_LEVEL_META.NO_BEDS;
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${meta.badgeClass}`}>
      {meta.label}
      {metric.congestionRate !== null ? ` ${metric.congestionRate}%` : ""}
    </span>
  );
}

/** 운영에 영향 주는 예외 상태(청소중/사용불가/상태미정)가 있을 때만 보여준다. */
function ExceptionCounts({ metric }: { metric: CongestionMetric }) {
  const parts: string[] = [];
  // 청소중
  if (metric.cleaningBeds > 0) parts.push(`Cleaning ${metric.cleaningBeds}`);
  // 사용불가
  if (metric.outOfServiceBeds > 0) parts.push(`Out of service ${metric.outOfServiceBeds}`);
  // 상태 미정
  if (metric.unknownStatusBeds > 0) parts.push(`Unknown status ${metric.unknownStatusBeds}`);
  if (parts.length === 0) return null;
  return <p className="mt-1 text-xs text-amber-700">{parts.join(" · ")}</p>;
}

/**
 * 혼잡도 지표 패널 (UC-RES-01, Jira UD2-13 / 하위 UD2-81~86)
 * - 구역별 운영/점유/가용 병상과 혼잡도 등급을 카드+게이지로 표시한다.
 * - 30초마다 자동 갱신 + 수동 새로고침, 병상 배정/해제 직후에도 즉시 재집계된다(saga).
 * - 조회 실패 시 직전 값은 유지하고 오류와 재시도 버튼을 보여준다.
 */
export default function CongestionPanel({
  className = "",
  pollIntervalMs = CONGESTION_POLL_INTERVAL_MS,
}: CongestionPanelProps) {
  const dispatch = useDispatch<AppDispatch>();
  const congestion = useSelector(selectCongestion);
  const loading = useSelector(selectCongestionLoading);
  const error = useSelector(selectCongestionError);
  const commonCodeLoaded = useSelector(selectCommonCodeLoaded);
  const zoneCodes = useSelector(selectCommonCodesByGroup(ZONE_GROUP_CODE));

  useEffect(() => {
    dispatch(fetchCongestionRequest());
    const timer = setInterval(() => dispatch(fetchCongestionRequest()), pollIntervalMs);
    return () => clearInterval(timer);
  }, [dispatch, pollIntervalMs]);

  useEffect(() => {
    if (!commonCodeLoaded) {
      dispatch(fetchAllCommonCodesRequest());
    }
  }, [dispatch, commonCodeLoaded]);

  function zoneLabel(zoneCode: string | null): string {
    if (!zoneCode) return "-";
    // 구역 미지정
    if (zoneCode === "UNASSIGNED") return "Unassigned";
    const fromCode = zoneCodes.find((code) => code.codeValue === zoneCode)?.codeName;
    return fromCode ?? BED_ZONE_OPTIONS.find((o) => o.value === zoneCode)?.label ?? zoneCode;
  }

  function handleRefresh() {
    dispatch(fetchCongestionRequest());
  }

  const total = congestion?.total;

  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* 응급실 혼잡도 */}
          <h3 className="text-sm font-semibold text-slate-800">ER Congestion</h3>
          {total ? <LevelBadge metric={total} /> : null}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {/* 마지막 갱신 */}
          <span>Last updated {formatTime(congestion?.calculatedAt)}</span>
          <Button type="button" variant="secondary" className="h-7 px-3 text-xs" onClick={handleRefresh} disabled={loading}>
            {/* 갱신 중... / 새로고침 */}
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Alert variant="error" className="flex-1">
            {/* 혼잡도 조회에 실패했습니다. (직전 값을 표시 중) */}
            {resolveEmergencyMessage(error)}
            {congestion ? " (showing last successful result)" : ""}
          </Alert>
          <Button type="button" variant="secondary" onClick={handleRefresh} disabled={loading}>
            {/* 재시도 */}
            Retry
          </Button>
        </div>
      ) : null}

      {!congestion ? (
        loading ? (
          // 혼잡도 지표를 불러오는 중입니다...
          <p className="py-4 text-center text-sm text-slate-400">Loading congestion indicators...</p>
        ) : error ? null : (
          // 표시할 혼잡도 데이터가 없습니다.
          <p className="py-4 text-center text-sm text-slate-400">No congestion data.</p>
        )
      ) : (
        <>
          {total ? (
            <div className="mb-4 rounded-lg bg-slate-50 p-3">
              <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                {/* 운영 병상 / 사용 중 / 가용 */}
                <span>Operational beds <b className="text-slate-800">{total.operationalBeds}</b></span>
                <span>Occupied <b className="text-slate-800">{total.occupiedBeds}</b></span>
                <span>Available <b className="text-emerald-700">{total.availableBeds}</b></span>
              </div>
              <RateBar metric={total} />
              <ExceptionCounts metric={total} />
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {congestion.zones.map((zone) => (
              <div key={zone.zoneCode ?? "total"} className="rounded-lg border border-slate-200 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-700">{zoneLabel(zone.zoneCode)}</span>
                  <LevelBadge metric={zone} />
                </div>
                {zone.congestionLevel === "NO_BEDS" ? (
                  <p className="text-xs text-slate-400">
                    {/* 운영 중인 병상이 없습니다. */}
                    {zone.totalBeds === 0 ? "No beds registered." : "No beds in service."}
                  </p>
                ) : (
                  <>
                    <RateBar metric={zone} />
                    <p className="mt-2 text-xs text-slate-500">
                      {/* 사용 {n} / 운영 {n} · 가용 {n} */}
                      Occupied {zone.occupiedBeds} / {zone.operationalBeds} · Available {zone.availableBeds}
                    </p>
                  </>
                )}
                <ExceptionCounts metric={zone} />
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
