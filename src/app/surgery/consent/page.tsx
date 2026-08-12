"use client";

import SurgeryScopedPanel from "@/components/surgery/common/SurgeryScopedPanel";
import ConsentPanel from "@/components/surgery/consent/ConsentPanel";

/**
 * 수술 동의서 관리 (SL2-42)
 * 경로: /surgery/consent — 사이드바 메뉴가 가리키는 주소
 *
 * <p>동의서는 특정 수술에 종속된 기록이라 수술을 먼저 고른다.
 * 수술 상세 화면에서는 마취기록·수술기록지와 함께 볼 수 있다.</p>
 *
 * <p>이 페이지가 클라이언트 컴포넌트인 이유 — SurgeryScopedPanel 에 <b>함수를 넘기기</b>
 * 때문이다. 서버 컴포넌트는 클라이언트로 함수를 직렬화해 보낼 수 없다
 * ("Functions are not valid as a child of Client Components").</p>
 */
export default function Page() {
  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">
        수술 동의서 관리
      </h1>
      <SurgeryScopedPanel description="수술을 선택하면 해당 수술의 동의서를 확인하고 기록할 수 있습니다. 동의서가 없으면 수술을 시작할 수 없습니다.">
        {(surgeryId) => <ConsentPanel surgeryId={surgeryId} />}
      </SurgeryScopedPanel>
    </div>
  );
}
