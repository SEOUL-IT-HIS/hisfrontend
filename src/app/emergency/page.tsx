import Link from "next/link";
import TriagePanelHost from "@/components/emergency/common/TriagePanelHost";

/**
 * 응급관리 메인 화면 — 환자 선택 후 탭(사전평가·자원·진료·퇴실)으로 전환하는 화면
 * (UC-TRI / UC-RES / UC-CARE / UC-DISP, Jira UD2-8~41)
 * 경로: /emergency  (사이드바의 "Emergency" 메뉴가 이 경로로 연결된다)
 */
export default function EmergencyPage() {
  return (
    <div className="h-full w-full p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        {/* 응급관리 */}
        <h1 className="text-lg font-semibold text-slate-800">Emergency</h1>
        {/* 프로토콜·지침·서식 파일 라이브러리(환자와 무관) */}
        <Link
          href="/emergency/reference"
          className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          Reference Documents
        </Link>
      </div>
      <TriagePanelHost />
    </div>
  );
}
