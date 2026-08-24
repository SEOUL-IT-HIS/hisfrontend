import PageHeader from "@/components/common/PageHeader";
import LabScheduleRegisterForm from "@/components/labimaging/labschedule/LabScheduleRegisterForm";

/**
 * 검사 일정 등록/재등록 화면
 * 경로: /labimaging/labschedule/register/{labReceptionId}
 *
 * 한 화면에서 신규 등록과 재등록을 모두 처리한다(폼 상단 토글).
 * 목록에서 "일정 등록됨" 접수를 고르고 들어오면 재등록 모드를 쓰게 된다.
 */
export default function Page() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <PageHeader
        title="검사 일정 등록 / 재등록"
        description="신규 등록과 재등록을 폼 상단에서 전환합니다."
      />
      <LabScheduleRegisterForm />
    </div>
  );
}
