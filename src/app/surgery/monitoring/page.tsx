import Link from "next/link";
import TodaySurgeryBoard from "@/components/surgery/schedule/TodaySurgeryBoard";

/**
 * 수술 현황 모니터링 (SL2-5 / SL2-40 금일 대시보드)
 * 경로: /surgery/monitoring — 사이드바 메뉴가 가리키는 주소
 *
 * <p>오늘 날짜의 수술만 보여준다. 전체 일정은 수술 스케줄링 화면에서 본다.</p>
 */
export default function Page() {
  return (
    <div className="mx-auto w-full max-w-5xl p-6">
      <h1 className="mb-1 text-lg font-semibold text-slate-800">
        수술 현황 모니터링
      </h1>
      <p className="mb-6 text-sm text-slate-600">
        오늘 예정·진행 중인 수술입니다. 예약 건은 시작을, 진행 중인 건은 종료를
        여기서 바로 처리할 수 있습니다.
      </p>

      <TodaySurgeryBoard />

      <p className="mt-10 text-xs text-slate-500">
        전체 일정은{" "}
        <Link href="/surgery/schedule" className="text-sky-600 underline">
          수술 배정 관리
        </Link>{" "}
        에서 볼 수 있습니다.
      </p>
    </div>
  );
}
