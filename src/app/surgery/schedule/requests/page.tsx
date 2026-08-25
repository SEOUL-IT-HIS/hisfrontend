import Link from "next/link";
import SurgeryRequestList from "@/components/surgery/schedule/SurgeryRequestList";

/**
 * 수술 요청 대기 목록 화면
 * 경로: /surgery/schedule/requests (§8.1 list)
 */
export default function Page() {
  return (
    <div className="mx-auto w-full max-w-5xl p-6">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800">수술 요청 대기</h1>
        <Link
          href="/surgery/schedule"
          className="text-sm text-sky-600 underline"
        >
          수술 일정
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
