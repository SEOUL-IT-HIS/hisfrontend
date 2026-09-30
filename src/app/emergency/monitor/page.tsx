import DashboardSummary from "@/components/emergency/monitor/DashboardSummary";
import CongestionPanel from "@/components/emergency/resource/congestion/CongestionPanel";

/**
 * ER-MONITOR 응급실 종합 현황판 (UC-MON-01, UC-RES-01 / Jira UD2-36, UD2-13)
 * 경로: /emergency/monitor
 * 사이드바 메뉴는 admin 메뉴관리에서 이 경로를 등록해야 노출된다.
 */
export default function Page() {
  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-y-auto p-6">
      {/* 응급실 종합 현황판 */}
      <h1 className="text-lg font-semibold text-slate-800">ER Dashboard</h1>
      <DashboardSummary />
      <CongestionPanel />
    </div>
  );
}
