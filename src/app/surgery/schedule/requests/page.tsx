import Link from "next/link";
import SurgeryRequestList from "@/components/surgery/schedule/SurgeryRequestList";

/**
 * 배정 대기 목록 화면
 * 경로: /surgery/schedule/requests (§8.1 list)
 *
 * <p>사이드바 '수술 배정 관리' 아래에 있는 화면이라 이름을 '배정'으로 맞췄다(2026-08-26).
 * 예전에는 '수술 요청 대기'였는데, 상위 메뉴가 '수술 스케줄링 관리'여서 오가는 동안
 * 부르는 말이 계속 바뀌었다.</p>
 */
export default function Page() {
  return (
    <div className="mx-auto w-full max-w-5xl p-6">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800">배정 대기 목록</h1>
        <Link
          href="/surgery/schedule"
          className="text-sm text-sky-600 underline"
        >
          수술 배정 관리
        </Link>
      </div>
      <p className="mb-6 text-sm text-slate-500">
        진료·응급실에서 올라온 수술 요청입니다. 수술실을 배정하면 예약으로 확정됩니다.
        응급 건이 먼저 표시됩니다.
      </p>
      <SurgeryRequestList />
    </div>
  );
}
