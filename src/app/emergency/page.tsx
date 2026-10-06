import TriagePanelHost from "@/components/emergency/common/TriagePanelHost";

/**
 * 응급관리 메인 화면 — 환자 선택 후 탭(사전평가·자원·진료·퇴실)으로 전환하는 화면
 * (UC-TRI / UC-RES / UC-CARE / UC-DISP, Jira UD2-8~41)
 * 경로: /emergency  (사이드바의 "Emergency" 메뉴가 이 경로로 연결된다)
 */
export default function EmergencyPage() {
  return (
    <div className="h-full w-full p-6">
      {/* 응급관리 */}
      <h1 className="mb-6 text-lg font-semibold text-slate-800">Emergency</h1>
      <TriagePanelHost />
    </div>
  );
}
