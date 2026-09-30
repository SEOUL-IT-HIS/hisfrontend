import PageHeader from "@/components/common/PageHeader";
import InterfaceSendLogPage from "@/components/labimaging/interfacelog/InterfaceSendLogPage";

/**
 * 연계 발신 이력 화면 — 검사결과 전송(ZP2-120) / 청구 발행(ZP2-124)
 * 경로: /labimaging/interfacelog/send
 *
 * ⚠ 사이드바 메뉴(admin MenuEntity.menu_url)에는 아직 등록돼 있지 않다.
 *   메뉴 등록은 admin 영역이라 별도 요청이 필요하다. (5차 신규 화면 — 다른 labimaging 화면은 이미 등록돼 있다. 05_프론트리더_등록요청 참고)
 */
export default function Page() {
  return (
    <div className="flex h-full w-full flex-col gap-4 p-6">
      <PageHeader
        title="Interface Send History"
        description="Review lab result and billing messages sent to other services, check failures, and resend when needed."
      />
      <InterfaceSendLogPage />
    </div>
  );
}
