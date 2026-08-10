"use client";

import SurgeryScopedPanel from "@/components/surgery/common/SurgeryScopedPanel";
import AnesthesiaRecordPanel from "@/components/surgery/anesthesia/AnesthesiaRecordPanel";

/**
 * 마취 관리 (SL2-3)
 * 경로: /surgery/anesthesia — 사이드바 메뉴가 가리키는 주소
 *
 * <p>마취기록은 특정 수술에 종속된 기록이라 수술을 먼저 고른다.
 * 활력징후는 덧붙이기만 하고 이미 적힌 내용은 지우지 않는다.</p>
 */
export default function Page() {
  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">마취 관리</h1>
      <SurgeryScopedPanel description="수술을 선택하면 마취기록을 등록하고 활력징후를 시간순으로 쌓을 수 있습니다.">
        {(surgeryId) => <AnesthesiaRecordPanel surgeryId={surgeryId} />}
      </SurgeryScopedPanel>
    </div>
  );
}
