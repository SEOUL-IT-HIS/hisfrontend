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
      title="수술 간호 기록 관리"
      jira="SL2-52 · SL2-58 작성 / SL2-59 물품카운트 / SL2-60 검체관리 / SL2-61 조회"
      reason="백엔드는 작성·조회가 동작합니다. 물품 수량 확인과 검체 정보가 한 서식에 담기는 구조라, 화면 설계를 먼저 정한 뒤 프론트 상태 관리를 만들 예정입니다."
      apis={[
        "GET  /api/surgery/{surgeryId}/nursing-records",
        "POST /api/surgery/{surgeryId}/nursing-records",
      ]}
    />
  );
}
