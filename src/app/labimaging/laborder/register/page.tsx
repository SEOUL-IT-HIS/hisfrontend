import PageHeader from "@/components/common/PageHeader";
import LabOrderReceptionForm from "@/components/labimaging/laborder/LabOrderReceptionForm";

/**
 * 검사오더 접수 화면 (UC-SPC-01 / Jira ZP2-12)
 * 경로: /labimaging/laborder/register (요청서 2.1)
 *
 * 페이지는 진입점만 담당하고, 입력/상태 처리는 LabOrderReceptionForm(client) 에 위임한다. (가이드 12.2)
 */
export default function Page() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <PageHeader title="Lab Order Reception" description="Receive lab orders raised by external systems." />
      <LabOrderReceptionForm />
    </div>
  );
}
