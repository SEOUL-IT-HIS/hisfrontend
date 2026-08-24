import Link from "next/link";
import ScheduleList from "@/components/surgery/schedule/ScheduleList";

/**
 * 수술 스케줄링 관리 (SL2-2)
 * 경로: /surgery/schedule — 사이드바 메뉴가 가리키는 주소
 *
 * <p>수술 요청은 진료·응급실이 보낸다(§21.1). 이 화면에는 등록 폼이 없고,
 * 들어온 요청을 배정하고 진행을 관리하는 것까지가 수술의 몫이다.</p>
 */

const FLOW = [
  { code: "00", label: "요청접수", desc: "진료·응급실이 요청" },
  { code: "01", label: "예약", desc: "수술실 배정 완료" },
  { code: "02", label: "진행중", desc: "수술 시작" },
  { code: "03", label: "완료", desc: "수술 종료" },
];

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-5xl p-6">
      <h1 className="mb-1 text-lg font-semibold text-slate-800">
        수술 스케줄링 관리
      </h1>
      <p className="mb-6 text-sm text-slate-600">
        진료·응급실이 올린 수술 요청을 배정하고 진행 상태를 관리합니다.
      </p>

      {/* 상태 흐름을 먼저 보여준다 — 코드값만으로는 순서가 드러나지 않는다 */}
      <div className="mb-8 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-4">
        {FLOW.map((step, i) => (
          <span key={step.code} className="flex items-center gap-2">
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
              <b>{step.code}</b> {step.label}
              <span className="ml-1 text-slate-500">· {step.desc}</span>
            </span>
            {i < FLOW.length - 1 && (
              <span className="text-slate-400">→</span>
            )}
          </span>
        ))}
        <span className="ml-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
          <b>04</b> 취소
          <span className="ml-1 text-slate-500">· 요청접수·예약에서만</span>
        </span>
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          href="/surgery/schedule/requests"
          className="rounded-lg border border-slate-200 px-4 py-3 text-sm hover:border-sky-400"
        >
          <span className="font-medium text-slate-800">수술 요청 대기</span>
          <span className="ml-2 text-xs text-slate-500">배정 전 요청 목록</span>
        </Link>
        <Link
          href="/surgery/monitoring"
          className="rounded-lg border border-slate-200 px-4 py-3 text-sm hover:border-sky-400"
        >
          <span className="font-medium text-slate-800">금일 수술 현황</span>
          <span className="ml-2 text-xs text-slate-500">오늘 예정·진행 건</span>
        </Link>
      </div>

      <h2 className="mb-3 text-sm font-medium text-slate-700">전체 수술 일정</h2>
      <ScheduleList />
    </div>
  );
}
