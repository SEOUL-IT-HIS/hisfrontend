import ImageScheduleRegisterForm from "@/components/labimaging/imagingschedule/ImageScheduleRegisterForm";

/**
 * 영상 일정 등록/재등록 화면
 * 경로: /labimaging/imagingschedule/register/{imageReceptionId}
 */
export default function Page() {
  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">영상 일정 등록</h1>
      <ImageScheduleRegisterForm />
    </div>
  );
}
