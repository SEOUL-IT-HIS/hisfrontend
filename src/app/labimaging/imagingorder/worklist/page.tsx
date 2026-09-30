import PageHeader from "@/components/common/PageHeader";
import ImageWorklist from "@/components/labimaging/imagingorder/ImageWorklist";

/**
 * 영상 업무 화면 (워크리스트)
 * 경로: /labimaging/imagingorder/worklist
 *
 * 왼쪽 접수 목록에서 건을 고르면 오른쪽에서 바로 처리하는 마스터-디테일 구조다.
 * 단계마다 화면을 옮겨 다니지 않고 한 화면에서 일정 → 동의 → 촬영 → 판독으로 이어간다.
 * (검사 업무 화면 /labimaging/laborder/worklist 와 같은 구조)
 *
 * 사이드바 메뉴: admin MENU 테이블에 등록돼 있다 (Ancillary > Lab & Imaging, 2026-09-29 확인).
 */
export default function Page() {
  return (
    <div className="flex h-full w-full flex-col gap-4 p-6">
      <PageHeader
        title="Imaging Worklist"
        description="Select a reception to continue with scheduling, consent, image acquisition and reading on the right."
      />
      <ImageWorklist />
    </div>
  );
}
