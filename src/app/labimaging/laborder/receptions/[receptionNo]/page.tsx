import PageHeader from "@/components/common/PageHeader";
import LabReceptionDetail from "@/components/labimaging/laborder/LabReceptionDetail";

/**
 * 검사 접수 단건 상세 화면
 * 경로: /labimaging/laborder/receptions/{receptionNo}
 */
export default function Page() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
      <PageHeader title="검사 접수 상세" description="접수 정보와 확정된 검사 예정일시를 확인합니다." />
      <LabReceptionDetail />
    </div>
  );
}
