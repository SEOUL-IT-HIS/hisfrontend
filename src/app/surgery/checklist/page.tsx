import NotReadyNotice from "@/components/surgery/common/NotReadyNotice";

/**
 * 수술 안전 체크리스트 관리 (SL2-4)
 * 경로: /surgery/checklist — 사이드바 메뉴가 가리키는 주소
 *
 * <p>백엔드는 SignIn→TimeOut→SignOut 순서 검증까지 구현돼 있으나
 * 프론트에 features/surgery/checklist(api·slice·saga·types)가 아직 없다.</p>
 */
export default function Page() {
  return (
    <NotReadyNotice
      title="수술 안전 체크리스트 관리"
      jira="SL2-4 · SL2-35 조회 / SL2-46 SignIn / SL2-47 TimeOut / SL2-48 SignOut / SL2-49 수정"
      reason="백엔드는 완성돼 있고 단계 순서 검증(SignIn → TimeOut → SignOut)까지 동작합니다. 프론트 상태 관리(api·slice·saga)를 만들어야 화면을 붙일 수 있습니다."
      apis={[
        "GET   /api/surgery/{surgeryId}/checklist",
        "POST  /api/surgery/{surgeryId}/checklist",
        "PATCH /api/surgery/checklist/{checklistId}",
      ]}
    />
  );
}
