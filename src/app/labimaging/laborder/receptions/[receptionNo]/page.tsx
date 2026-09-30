import PageHeader from "@/components/common/PageHeader";
import LabReceptionDetail from "@/components/labimaging/laborder/LabReceptionDetail";

/**
 * 검사 접수 단건 상세 화면
 * 경로: /labimaging/laborder/receptions/{receptionNo}
 */
export default function Page() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
      <PageHeader title="Lab Reception Detail" description="Review the reception details and the confirmed test date and time." />
      <LabReceptionDetail />
    </div>
  );
}
