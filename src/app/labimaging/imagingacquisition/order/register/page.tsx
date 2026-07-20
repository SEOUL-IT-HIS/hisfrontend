import ImageOrderReceptionForm from "@/components/labimaging/imagingacquisition/ImageOrderReceptionForm";

/**
 * 영상오더 접수 화면 (UC-IMG-01 / Jira ZP2-19)
 * 경로: /labimaging/imagingacquisition/order/register (요청서 2.1)
 *
 * 페이지는 진입점만 담당하고, 입력/상태 처리는 ImageOrderReceptionForm(client) 에 위임한다. (가이드 12.2)
 */
export default function Page() {
  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">영상오더 접수</h1>
      <ImageOrderReceptionForm />
    </div>
  );
}
