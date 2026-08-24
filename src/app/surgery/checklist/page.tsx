"use client";

import ChecklistPanel from "@/components/surgery/checklist/ChecklistPanel";
import SurgeryScopedPanel from "@/components/surgery/common/SurgeryScopedPanel";

/**
 * 수술 안전 체크리스트 관리 (SL2-4)
 * 경로: /surgery/checklist — 사이드바 메뉴가 가리키는 주소
 *
 * <p>체크리스트는 특정 수술에 종속된 기록이라 수술을 먼저 고른다.
 * WHO 권고에 따라 Sign In → Time Out → Sign Out 세 시점에 확인하며,
 * 앞 단계를 마쳐야 다음 단계를 시작할 수 있다.</p>
 *
 * <p>이 페이지가 클라이언트 컴포넌트인 이유 — SurgeryScopedPanel 에 <b>함수를 넘기기</b>
 * 때문이다. 서버 컴포넌트는 클라이언트로 함수를 직렬화해 보낼 수 없다
 * ("Functions are not valid as a child of Client Components").</p>
 */
export default function Page() {
  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">
        수술 안전 체크리스트 관리
      </h1>
      <SurgeryScopedPanel description="수술을 선택하면 단계별 안전 확인을 기록할 수 있습니다. Sign In → Time Out → Sign Out 순서로 진행하며, 앞 단계를 완료해야 다음 단계가 열립니다.">
        {(surgeryId) => <ChecklistPanel surgeryId={surgeryId} />}
      </SurgeryScopedPanel>
    </div>
  );
}
