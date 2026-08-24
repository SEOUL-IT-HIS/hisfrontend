import VitalsPanelPreview from "@/components/emergency/tirage/vitals/VitalsPanelPreview";

/**
 * 초기 환자상태 평가(활력징후) 패널 미리보기 (UC-TRI-04 / Jira UD2-10)
 * 경로: /emergency/vitals
 */
export default function Page() {
  return (
    <div className="mx-auto h-full w-full max-w-2xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">초기 환자상태 평가(활력징후) 패널 미리보기</h1>
      <VitalsPanelPreview />
    </div>
  );
}
