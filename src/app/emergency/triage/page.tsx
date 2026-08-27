import TriagePanelHost from "@/components/emergency/common/TriagePanelHost";

/**
 * ER-TRIAGE 상태평가 화면 (UC-TRI-01~06 / Jira UD2-8,9,10,11,12,43)
 * 경로: /emergency/triage
 */
export default function Page() {
  return (
    <div className="h-full w-full p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">상태평가 (Triage)</h1>
      <TriagePanelHost />
    </div>
  );
}
