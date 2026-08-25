import PageHeader from "@/components/common/PageHeader";
import LabWorklist from "@/components/labimaging/laborder/LabWorklist";

/**
 * 검사 업무 화면 (워크리스트)
 * 경로: /labimaging/laborder/worklist
 *
 * 왼쪽 접수 목록에서 건을 고르면 오른쪽에서 바로 처리하는 마스터-디테일 구조다.
 * 단계마다 화면을 옮겨 다니지 않고 한 화면에서 일정 → 검체 → 판정으로 이어간다.
 *
 * ⚠ 사이드바 메뉴(admin MenuEntity.menu_url)에는 아직 등록돼 있지 않다.
 *   주소창에 직접 입력해 확인한다. 메뉴 등록은 타 팀(admin) 영역이라 별도 요청이 필요하다.
 */
export default function Page() {
  return (
    <div className="flex h-full w-full flex-col gap-4 p-6">
      <PageHeader
        title="검사 업무"
        description="접수를 고르면 오른쪽에서 일정·검체 작업을 이어서 처리합니다. 결과가 등록되기 전까지 접수는 목록에 남습니다."
      />
      <LabWorklist />
    </div>
  );
}
