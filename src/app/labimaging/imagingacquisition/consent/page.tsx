import PageHeader from "@/components/common/PageHeader";
import ConsentScreen from "@/components/labimaging/imagingacquisition/ConsentScreen";

/**
 * 영상 동의 화면 (조영제/침습검사)
 * 경로: /labimaging/imagingacquisition/consent
 * 대응 유스케이스: UC-IMG-05 (Jira ZP2-28 / ZP2-82 화면·라우터 연동)
 *
 * 왼쪽 영상오더 목록에서 건을 고르면 오른쪽에서 동의를 등록하고 이력을 확인한다.
 *
 * ⚠ 사이드바 메뉴(admin MenuEntity.menu_url)에는 아직 등록돼 있지 않다.
 *   등록 요청은 project_file/공통관리/사이드바메뉴_변경요청_검사영상.md 참고
 *   (IMG_CONSENT / 영상 동의서 / 이 경로). 반영 전까지는 주소창 직접 입력으로 확인한다.
 */
export default function Page() {
  return (
    <div className="flex h-full w-full flex-col gap-4 p-6">
      <PageHeader
        title="영상 동의서"
        description="조영제·침습검사 동의를 등록하고 오더별 동의 이력을 확인합니다."
      />
      <ConsentScreen />
    </div>
  );
}
