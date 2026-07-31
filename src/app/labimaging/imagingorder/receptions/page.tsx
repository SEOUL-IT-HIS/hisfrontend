import ImageReceptionListForm from "@/components/labimaging/imagingorder/ImageReceptionListForm";

/**
 * 영상 접수 목록(미일정) 화면 — 일정 등록 대상 선택
 * 경로: /labimaging/imagingorder/receptions
 */
export default function Page() {
  return (
    <div className="mx-auto w-full max-w-5xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">영상 접수 목록</h1>
      <ImageReceptionListForm />
    </div>
  );
}
