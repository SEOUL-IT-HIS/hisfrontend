import ScheduleRegisterForm from "@/components/surgery/schedule/ScheduleRegisterForm";

/**
 * 수술 스케줄 등록 화면 (SL2-36)
 * 경로: /surgery/schedule/register (§8.1)
 */
export default function Page() {
  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">
        수술 스케줄 등록
      </h1>
      <ScheduleRegisterForm />
    </div>
  );
}
