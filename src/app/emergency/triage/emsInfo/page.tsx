import EmsInfoPanelPreview from "@/components/emergency/tirage/emsInfo/EmsInfoPanelPreview";

/**
 * EMS(119) 사전정보 패널 미리보기 (UC-TRI-01 / Jira UD2-8, UD2-47)
 * 경로: /emergency/emsInfo
 *
 * 실제 배치 위치는 KTAS 분류 화면(UD2-9) 안이다. 그 화면이 구현되기 전까지
 * 개발/QA 가 <EmsInfoPanel> 을 확인할 수 있도록 미리보기 하네스를 둔다.
 */
export default function Page() {
  return (
    <div className="mx-auto h-full w-full max-w-2xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">EMS 사전정보 패널 미리보기</h1>
      <EmsInfoPanelPreview />
    </div>
  );
}
