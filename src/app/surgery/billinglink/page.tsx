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
      title="Surgery estimate and billing link"
      jira="SL2-64 · SL2-65 planned items / SL2-66 read / SL2-67 link status / SL2-68 update / SL2-72 billing push"
      reason="The backend is on hold too. The API contract, idempotency and failure policy have to be settled with the Billing team first. Entities and DTOs are ready, and a draft of the service logic is left in comments."
      apis={[
        "(not implemented) GET  /api/surgery/{surgeryId}/planned-items",
        "(not implemented) POST /api/surgery/{surgeryId}/planned-items",
        "(not implemented) GET  /api/surgery/{surgeryId}/estimate-link",
      ]}
    />
  );
}
