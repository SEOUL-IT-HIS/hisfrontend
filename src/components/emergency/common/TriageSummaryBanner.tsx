"use client";

import { useSelector } from "react-redux";
import KtasLevelBadge from "@/components/emergency/receptionList/KtasLevelBadge";
import { selectKtasItems } from "@/features/emergency/triage/ktas/slice";
import { selectVitalsItems } from "@/features/emergency/triage/vitals/slice";
import { selectIsolationItems } from "@/features/emergency/triage/isolation/slice";
import { selectRiskScreeningItems } from "@/features/emergency/triage/riskScreening/slice";
import { formatVitalDisplay, latestByTime } from "@/features/emergency/utils";

type TriageSummaryBannerProps = {
  receptionNo: string;
};

const VITAL_KEYS = ["systolicBp", "heartRate", "temperature", "spo2", "gcs"] as const;

/**
 * 현재 선택된 접수 건의 상태를 한눈에 보여주는 읽기 전용 요약 배너.
 * - 저장 로직은 각 패널이 그대로 담당하고, 이 배너는 이미 로드된 Redux 상태만 조합해서 보여준다.
 */
export default function TriageSummaryBanner({ receptionNo: _receptionNo }: TriageSummaryBannerProps) {
  const ktasItems = useSelector(selectKtasItems);
  const vitalsItems = useSelector(selectVitalsItems);
  const isolationItems = useSelector(selectIsolationItems);
  const riskItems = useSelector(selectRiskScreeningItems);

  const latestKtas = latestByTime(ktasItems, (i) => i.assessedAt);
  const latestVitals = latestByTime(vitalsItems, (i) => i.measuredAt);
  const activeIsolation = isolationItems.find((i) => !i.releasedAt);
  const latestRisk = latestByTime(riskItems, (i) => i.screenedAt);

  const vitalFlags = latestVitals
    ? VITAL_KEYS.map((key) => formatVitalDisplay(key, latestVitals[key])).filter((s) => s.includes("("))
    : [];

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <span className="text-xs font-semibold text-slate-500">요약</span>

      {activeIsolation ? (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
          격리중
        </span>
      ) : null}

      {vitalFlags.length > 0 ? (
          vitalFlags.map((flag) => (
              <span key={flag} className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600">
            {flag}
          </span>
          ))
      ) : latestVitals ? (
          <span className="text-xs text-slate-400">활력징후 정상범위</span>
      ) : null}


      {latestKtas ? (
        <KtasLevelBadge level={latestKtas.ktasLevelCode} />
      ) : (
        <span className="text-xs text-slate-400">KTAS 미분류</span>
      )}

      
      {latestRisk?.resultCode === "POSITIVE" ? (
        <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600">
          {latestRisk.screeningTypeCode === "SEPSIS" ? "패혈증 고위험" : "뇌졸중 의심"}
        </span>
      ) : null}
    </div>
  );
}
