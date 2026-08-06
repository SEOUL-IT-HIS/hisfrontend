import KtasPanelPreview from "@/components/emergency/ktas/KtasPanelPreview";

/**
 * KTAS 등급 분류/재평가 패널 미리보기 (UC-TRI-02/03 / Jira UD2-9, UD2-43)
 * 경로: /emergency/ktas
 */
export default function Page() {
  return (
    <div className="mx-auto h-full w-full max-w-2xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">KTAS 분류/재평가 패널 미리보기</h1>
      <KtasPanelPreview />
    </div>
  );
}
