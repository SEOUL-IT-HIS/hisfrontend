import Link from "next/link";
import SurgeryRequestList from "@/components/surgery/schedule/SurgeryRequestList";

/**
 * 배정 대기 목록 화면
 * 경로: /surgery/schedule/requests (§8.1 list)
 *
 * <p>사이드바 '수술 배정 관리' 아래에 있는 화면이라 이름을 '배정'으로 맞췄다(2026-08-26).
 * 예전에는 '수술 요청 대기'였는데, 상위 메뉴가 '수술 스케줄링 관리'여서 오가는 동안
 * 부르는 말이 계속 바뀌었다.</p>
 *
 * <p><b>구조를 수술 업무 화면에 맞췄다</b>(2026-08-27) — 표가 화면을 꽉 채우고
 * 배정은 다른 페이지에서 했다. 이제 좌측 대기 목록·우측 배정 폼의 마스터-디테일이라
 * 한 화면에서 연달아 처리한다.</p>
 */
export default function Page() {
  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1800px] flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">배정 대기 목록</h1>
          <p className="mt-1 text-sm text-slate-500">
            진료·응급실에서 올라온 수술 요청입니다. 수술실을 배정하면 예약으로
            확정됩니다. 응급 건이 먼저 표시됩니다.
          </p>
        </div>
        <Link
          href="/surgery/schedule"
          className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:border-sky-400 hover:text-sky-600"
        >
          수술 배정 관리
        </Link>
      </div>
      <SurgeryRequestList />
    </div>
  );
}
