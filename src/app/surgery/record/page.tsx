"use client";

import SurgeryScopedPanel from "@/components/surgery/common/SurgeryScopedPanel";
import OperativeRecordPanel from "@/components/surgery/operativeRecord/OperativeRecordPanel";

/**
 * 수술 기록 관리 (SL2-51)
 * 경로: /surgery/record — 사이드바 메뉴가 가리키는 주소
 *
 * <p>수술기록지는 특정 수술에 종속된 기록이라 수술을 먼저 고른다.
 * 확정(02) 상태 기록은 수정할 수 없다 — 수납이 확정 건을 신뢰해 조회하기 때문이다.</p>
 */
export default function Page() {
  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">
        수술 기록 관리
      </h1>
      <SurgeryScopedPanel description="수술을 선택하면 수술기록지를 작성하고 조회할 수 있습니다. 초안으로 남긴 뒤 다듬어 확정합니다.">
        {(surgeryId) => <OperativeRecordPanel surgeryId={surgeryId} />}
      </SurgeryScopedPanel>
    </div>
  );
}
