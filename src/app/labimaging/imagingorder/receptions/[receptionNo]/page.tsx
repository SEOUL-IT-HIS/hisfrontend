import PageHeader from "@/components/common/PageHeader";
import ImageReceptionDetail from "@/components/labimaging/imagingorder/ImageReceptionDetail";

/**
 * 영상 접수 단건 상세 화면
 * 경로: /labimaging/imagingorder/receptions/{receptionNo}
 */
export default function Page() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
      <PageHeader title="영상 접수 상세" description="접수 정보와 확정된 촬영 예정일시를 확인합니다." />
      <ImageReceptionDetail />
    </div>
  );
}
