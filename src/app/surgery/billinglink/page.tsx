import NotReadyNotice from "@/components/surgery/common/NotReadyNotice";

/**
 * 수술 견적/청구 연계 관리 (SL2-64)
 * 경로: /surgery/billinglink — 사이드바 메뉴가 가리키는 주소
 *
 * <p>이쪽은 백엔드도 보류 중이다. 수납(Billing) 팀과 API 계약이 정해지지 않았다.</p>
 */
export default function Page() {
  return (
    <NotReadyNotice
      title="수술 견적/청구 연계 관리"
      jira="SL2-64 · SL2-65 자원목록 등록 / SL2-66 조회 / SL2-67 연계상태 조회 / SL2-68 변경 / SL2-72 청구 Push"
      reason="백엔드도 보류 중입니다. 수납(Billing) 팀과 API 계약·멱등성·실패 정책이 정해져야 구현할 수 있습니다. 엔티티와 DTO 는 준비돼 있고, 서비스 로직은 초안을 주석으로 남겨두었습니다."
      apis={[
        "(미구현) GET  /api/surgery/{surgeryId}/planned-items",
        "(미구현) POST /api/surgery/{surgeryId}/planned-items",
        "(미구현) GET  /api/surgery/{surgeryId}/estimate-link",
      ]}
    />
  );
}
