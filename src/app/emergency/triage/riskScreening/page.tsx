import RiskScreeningPanelPreview from "@/components/emergency/tirage/riskScreening/RiskScreeningPanelPreview";

/**
 * 패혈증-뇌졸중 위험도 스크리닝 패널 미리보기 (UC-TRI-06 / Jira UD2-12)
 * 경로: /emergency/riskScreening
 */
export default function Page() {
  return (
    <div className="mx-auto h-full w-full max-w-2xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">패혈증-뇌졸중 위험도 스크리닝 패널 미리보기</h1>
      <RiskScreeningPanelPreview />
    </div>
  );
}
