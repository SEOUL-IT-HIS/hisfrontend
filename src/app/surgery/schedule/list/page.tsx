import ScheduleList from "@/components/surgery/schedule/ScheduleList";

/**
 * 수술 일정 조회 화면 (SL2-25)
 * 경로: /surgery/schedule/list (§8.1)
 */
export default function Page() {
  return (
    <div className="mx-auto w-full max-w-5xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">수술 일정</h1>
      <ScheduleList />
    </div>
  );
}
