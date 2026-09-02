import PageHeader from "@/components/common/PageHeader";
import ImageReceptionListForm from "@/components/labimaging/imagingorder/ImageReceptionListForm";

/**
 * 영상 접수 목록 화면 — 일정 등록/재조정 대상 선택
 * 경로: /labimaging/imagingorder/receptions
 *
 * 목록은 "일정 미등록 / 일정 등록됨 / 전체" 필터로 나눠 본다.
 */
export default function Page() {
  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-4 p-6">
      <PageHeader
        title="Imaging Receptions"
        description="Select a reception to schedule, or to reschedule an existing appointment."
      />
      <ImageReceptionListForm />
    </div>
  );
}
