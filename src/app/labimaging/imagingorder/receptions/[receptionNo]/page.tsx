import ImageReceptionDetail from "@/components/labimaging/imagingorder/ImageReceptionDetail";

/**
 * 영상 접수 단건 상세 화면
 * 경로: /labimaging/imagingorder/receptions/{receptionNo}
 */
export default function Page() {
  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">영상 접수 상세</h1>
      <ImageReceptionDetail />
    </div>
  );
}
