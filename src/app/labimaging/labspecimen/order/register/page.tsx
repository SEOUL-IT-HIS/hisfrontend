import LabOrderReceptionForm from "@/components/labimaging/labspecimen/LabOrderReceptionForm";

/**
 * 검사오더 접수 화면 (UC-SPC-01 / Jira ZP2-12)
 * 경로: /labimaging/labspecimen/order/register (요청서 2.1)
 *
 * 페이지는 진입점만 담당하고, 입력/상태 처리는 LabOrderReceptionForm(client) 에 위임한다. (가이드 12.2)
 */
export default function Page() {
  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">검사오더 접수</h1>
      <LabOrderReceptionForm />
    </div>
  );
}
