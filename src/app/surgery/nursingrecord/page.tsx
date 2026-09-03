import NotReadyNotice from "@/components/surgery/common/NotReadyNotice";

/**
 * 수술 간호 기록 관리 (SL2-52)
 * 경로: /surgery/nursingrecord — 사이드바 메뉴가 가리키는 주소
 *
 * <p>백엔드는 작성·조회가 구현돼 있으나 프론트 상태 관리가 아직 없다.</p>
 */
export default function Page() {
  return (
    <NotReadyNotice
      title="Perioperative nursing records"
      jira="SL2-52 · SL2-58 create / SL2-59 item count / SL2-60 specimens / SL2-61 read"
      reason="Create and read already work on the backend. Item counts and specimen details share one form, so the screen layout has to be settled before the front-end state management is built."
      apis={[
        "GET  /api/surgery/{surgeryId}/nursing-records",
        "POST /api/surgery/{surgeryId}/nursing-records",
      ]}
    />
  );
}
