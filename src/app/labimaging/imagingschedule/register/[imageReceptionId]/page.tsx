import PageHeader from "@/components/common/PageHeader";
import ImageScheduleRegisterForm from "@/components/labimaging/imagingschedule/ImageScheduleRegisterForm";

/**
 * 영상 일정 등록/재등록 화면
 * 경로: /labimaging/imagingschedule/register/{imageReceptionId}
 *
 * 한 화면에서 신규 등록과 재등록을 모두 처리한다(폼 상단 토글).
 */
export default function Page() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <PageHeader
        title="Imaging Schedule"
        description="Switch between new registration and rescheduling at the top of the form."
      />
      <ImageScheduleRegisterForm />
    </div>
  );
}
