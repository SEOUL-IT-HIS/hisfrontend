"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchWardBedStatusApi, fetchWardCodesApi } from "@/features/inpatient/bedmanagement/bedstatus/api";
import type { WardBedStatusDTO } from "@/features/inpatient/bedmanagement/types";
import { Alert, Button } from "@/components/common";
import Toolbar from "@/components/inpatient/common/Toolbar";

type WardSummary = {
  wardCd: string;
  wardName: string;
  status: WardBedStatusDTO | null; // null이면 그 병동 조회 실패
};

type BedDashboardProps = {
  /** 병동 카드 클릭 시 — 병상현황 탭으로 넘어가 해당 병동을 필터해서 보여줌 */
  onSelectWard?: (wardCd: string) => void;
};

// 막대/범례 색상 — 가용(빈) 병상이 가장 눈에 띄도록 emerald, 나머지는 병상현황 배지 색과 맞춤
const SEGMENTS = [
  { key: "emptyCnt", label: "Available", bar: "bg-emerald-500", dot: "bg-emerald-500" },
  { key: "reservedCnt", label: "Reserved", bar: "bg-amber-400", dot: "bg-amber-400" },
  { key: "occupiedCnt", label: "Occupied", bar: "bg-sky-500", dot: "bg-sky-500" },
  { key: "maintenanceCnt", label: "Maintenance", bar: "bg-slate-300", dot: "bg-slate-300" },
] as const;

const occupancyRate = (status: WardBedStatusDTO) =>
  status.totalCnt > 0 ? Math.round((status.occupiedCnt / status.totalCnt) * 100) : 0;

// 가용 병상 수에 따라 카드 강조 — 0이면 만실(빨강), 2개 이하면 여유 적음(주황)
const availabilityTone = (emptyCnt: number) => {
  if (emptyCnt === 0) return { text: "text-rose-600", badge: "bg-rose-50 text-rose-700 ring-rose-200", label: "Full" };
  if (emptyCnt <= 2) return { text: "text-amber-600", badge: "bg-amber-50 text-amber-700 ring-amber-200", label: "Few left" };
  return { text: "text-emerald-600", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", label: "Available" };
};

const StatusBar = ({ status }: { status: WardBedStatusDTO }) => (
  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
    {status.totalCnt > 0 &&
      SEGMENTS.map((seg) => {
        const count = status[seg.key];
        if (count === 0) return null;
        return <div key={seg.key} className={seg.bar} style={{ width: `${(count / status.totalCnt) * 100}%` }} />;
      })}
  </div>
);

// 대시보드 API가 병동 1개 단위라서: 병동 공통코드 → 병동마다 집계 호출(병렬)
// 한 병동이 실패해도 나머지는 보이도록 allSettled 사용
const fetchWardSummaries = async (): Promise<WardSummary[]> => {
  const wardCodes = (await fetchWardCodesApi()) ?? [];
  const results = await Promise.allSettled(wardCodes.map((ward) => fetchWardBedStatusApi(ward.codeValue)));
  return (
    wardCodes
      .map((ward, i) => {
        const result = results[i];
        return {
          wardCd: ward.codeValue,
          wardName: ward.codeName,
          status: result.status === "fulfilled" ? result.value : null,
        };
      })
      // 병상이 없는 병동(ICU·응급 관찰실 등 공통코드에만 있는 병동)은 제외 — 조회 실패한 병동은 남겨서 알 수 있게 함
      .filter((ward) => ward.status === null || ward.status.totalCnt > 0)
  );
};

const BedDashboard = ({ onSelectWard }: BedDashboardProps) => {
  const [wards, setWards] = useState<WardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  // 조회 결과 반영 — setState는 Promise 콜백 안에서만 호출 (effect 안에서 동기 setState 하지 않도록)
  const applyResult = useCallback((request: Promise<WardSummary[]>) => {
    request
      .then((summaries) => {
        setWards(summaries);
        setUpdatedAt(new Date());
        setError(null);
      })
      .catch(() => setError("Failed to load ward list."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    applyResult(fetchWardSummaries());
  }, [applyResult]);

  const refresh = () => {
    setLoading(true);
    applyResult(fetchWardSummaries());
  };

  // 전체 병동 합계
  const total = useMemo(() => {
    const sum = { totalCnt: 0, emptyCnt: 0, occupiedCnt: 0, reservedCnt: 0, maintenanceCnt: 0, beds: [] } as WardBedStatusDTO;
    wards.forEach(({ status }) => {
      if (!status) return;
      sum.totalCnt += status.totalCnt;
      sum.emptyCnt += status.emptyCnt;
      sum.occupiedCnt += status.occupiedCnt;
      sum.reservedCnt += status.reservedCnt;
      sum.maintenanceCnt += status.maintenanceCnt;
    });
    return sum;
  }, [wards]);

  return (
    <div className="flex w-full flex-col gap-4">
      <Toolbar
        actions={
          <>
            {updatedAt && (
              <span className="text-xs text-slate-400">
                Updated {updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
            <Button variant="secondary" onClick={refresh} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-500">Available beds by ward. Click a ward to see its beds.</p>
      </Toolbar>

      {error && <Alert>{error}</Alert>}

      {!error && (
        <>
          {/* 전체 합계 — 가용 병상을 가장 크게 */}
          <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="col-span-2 rounded-2xl border border-emerald-200/80 bg-emerald-50 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:col-span-1">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Available Beds</p>
              <p className="mt-2 text-4xl font-bold text-emerald-600">
                {total.emptyCnt}
                <span className="ml-1 text-base font-medium text-emerald-700/70">/ {total.totalCnt}</span>
              </p>
            </div>
            <SummaryTile label="Occupied" value={total.occupiedCnt} dot="bg-sky-500" />
            <SummaryTile label="Reserved" value={total.reservedCnt} dot="bg-amber-400" />
            <SummaryTile label="Maintenance" value={total.maintenanceCnt} dot="bg-slate-300" />
            <SummaryTile label="Occupancy" value={`${occupancyRate(total)}%`} />
          </div>

          {loading && wards.length === 0 && <p className="text-sm text-slate-500">Loading...</p>}
          {!loading && wards.length === 0 && <p className="text-sm text-slate-500">No wards with beds.</p>}

          {/* 병동별 카드 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {wards.map(({ wardCd, wardName, status }) => {
              if (!status) {
                return (
                  <div key={wardCd} className="rounded-2xl border border-rose-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <p className="font-semibold text-slate-800">{wardName}</p>
                    <p className="mt-2 text-sm text-rose-600">Failed to load this ward.</p>
                  </div>
                );
              }
              const tone = availabilityTone(status.emptyCnt);
              return (
                <button
                  key={wardCd}
                  type="button"
                  onClick={() => onSelectWard?.(wardCd)}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-sky-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <p className="font-semibold text-slate-800">{wardName}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tone.badge}`}>
                      {tone.label}
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className={`text-3xl font-bold ${tone.text}`}>{status.emptyCnt}</span>
                    <span className="text-sm text-slate-500">/ {status.totalCnt} available</span>
                  </div>
                  <div className="mt-3">
                    <StatusBar status={status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                    {SEGMENTS.map((seg) => (
                      <span key={seg.key} className="inline-flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${seg.dot}`} />
                        {seg.label} {status[seg.key]}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-slate-400">Occupancy {occupancyRate(status)}%</p>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

const SummaryTile = ({ label, value, dot }: { label: string; value: number | string; dot?: string }) => (
  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
    <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
      {dot && <span className={`h-2 w-2 rounded-full ${dot}`} />}
      {label}
    </p>
    <p className="mt-2 text-2xl font-semibold text-slate-800">{value}</p>
  </div>
);

export default BedDashboard;
