"use client";

import { useState } from "react";
import EmsInfoPanel from "@/components/emergency/tirage/emsInfo/EmsInfoPanel";
import IsolationPanel from "@/components/emergency/tirage/isolation/IsolationPanel";
import KtasPanel from "@/components/emergency/tirage/ktas/KtasPanel";
import RiskScreeningPanel from "@/components/emergency/tirage/riskScreening/RiskScreeningPanel";
import VitalsPanel from "@/components/emergency/tirage/vitals/VitalsPanel";
import ReceptionListPanel from "@/components/emergency/receptionList/ReceptionListPanel";
import TriageSummaryBanner from "@/components/emergency/common/TriageSummaryBanner";

/**
 * ER-TRIAGE 상태평가 화면 (UC-TRI-01~06 / Jira UD2-8,9,10,11,12,43)
 *
 * 접수 건(receptionNo) 하나를 기준으로 EMS 사전정보 · KTAS 분류/재평가 ·
 * 활력징후 · 격리 · 위험 스크리닝 패널을 한 영역에 모아 보여준다 (세로 스크롤).
 * 실제로는 접수/환자 선택 화면에서 receptionNo 를 넘겨받아 진입하지만,
 * 그 상위 화면이 아직 없어 이 화면 자체에 조회용 입력을 둔다.
 */
export default function TriagePanelHost() {
  const [active, setActive] = useState("");

  return (
    <div className="grid grid-cols-[minmax(320px,1fr)_2fr] gap-4">
      <ReceptionListPanel onSelect={setActive} activeReceptionNo={active} />

      {/* 오른쪽: 선택된 환자의 Triage 패널 (5개 모두, 세로 스크롤) */}
      <div className="flex h-[calc(100vh-180px)] min-w-0 flex-col gap-3">
        {active ? (
          <>
          <TriageSummaryBanner receptionNo={active} />
          <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-4">
              <EmsInfoPanel receptionNo={active} />
              <IsolationPanel receptionNo={active} />
              <VitalsPanel receptionNo={active} />
              <KtasPanel receptionNo={active} />
              <RiskScreeningPanel receptionNo={active} />
            </div>
          </div>
          </>
        ) : (
          <div className="flex h-full min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-400">
            왼쪽 목록에서 환자를 선택하세요.
          </div>
        )}
      </div>
    </div>
  );
}
