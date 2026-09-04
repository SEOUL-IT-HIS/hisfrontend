import PageHeader from "@/components/common/PageHeader";
import ImageReceptionDetail from "@/components/labimaging/imagingorder/ImageReceptionDetail";

/**
 * 영상 접수 단건 상세 화면
 * 경로: /labimaging/imagingorder/receptions/{receptionNo}
 */
export default function Page() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
      <PageHeader title="Imaging Reception Detail" description="Review the reception details and the confirmed imaging date and time." />
      <ImageReceptionDetail />
    </div>
  );
}
