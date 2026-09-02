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
 * ⚠ 사이드바 메뉴(admin MenuEntity.menu_url)에는 아직 등록돼 있지 않다.
 *   주소창에 직접 입력해 확인한다. 메뉴 등록은 타 팀(admin) 영역이라 별도 요청이 필요하다.
 */
export default function Page() {
  return (
    <div className="flex h-full w-full flex-col gap-4 p-6">
      <PageHeader
        title="Imaging Worklist"
        description="Select a reception to continue with scheduling and consent work on the right. Acquisition and reading are not implemented yet."
      />
      <ImageWorklist />
    </div>
  );
}
