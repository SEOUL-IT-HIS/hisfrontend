import IsolationPanelPreview from "@/components/emergency/isolation/IsolationPanelPreview";

/**
 * 감염병 격리 관리 패널 미리보기 (UC-TRI-05 / Jira UD2-11)
 * 경로: /emergency/isolation
 */
export default function Page() {
  return (
    <div className="mx-auto h-full w-full max-w-2xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">감염병 격리 관리 패널 미리보기</h1>
      <IsolationPanelPreview />
    </div>
  );
}
