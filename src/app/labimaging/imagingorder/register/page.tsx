import PageHeader from "@/components/common/PageHeader";
import ImageOrderReceptionForm from "@/components/labimaging/imagingorder/ImageOrderReceptionForm";

/**
 * 영상오더 접수 화면 (UC-IMG-01 / Jira ZP2-19)
 * 경로: /labimaging/imagingorder/register (요청서 2.1)
 *
 * 페이지는 진입점만 담당하고, 입력/상태 처리는 ImageOrderReceptionForm(client) 에 위임한다. (가이드 12.2)
 */
export default function Page() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <PageHeader title="Imaging Order Reception" description="Receive imaging orders raised by external systems." />
      <ImageOrderReceptionForm />
    </div>
  );
}
