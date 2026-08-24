"use client";

import { useState, type ChangeEvent } from "react";
import { Button, FormField, Input } from "@/components/common";
import EmsInfoPanel from "@/components/emergency/tirage/emsInfo/EmsInfoPanel";
import IsolationPanel from "@/components/emergency/tirage/isolation/IsolationPanel";
import KtasPanel from "@/components/emergency/tirage/ktas/KtasPanel";
import RiskScreeningPanel from "@/components/emergency/tirage/riskScreening/RiskScreeningPanel";
import VitalsPanel from "@/components/emergency/tirage/vitals/VitalsPanel";

/**
 * ER-TRIAGE 상태평가 화면 (UC-TRI-01~06 / Jira UD2-8,9,10,11,12,43)
 *
 * 접수 건(receptionNo) 하나를 기준으로 EMS 사전정보 · KTAS 분류/재평가 ·
 * 활력징후 · 격리 · 위험 스크리닝 패널을 한 화면에 모아 보여준다.
 * 실제로는 접수/환자 선택 화면에서 receptionNo 를 넘겨받아 진입하지만,
 * 그 상위 화면이 아직 없어 이 화면 자체에 조회용 입력을 둔다.
 */
export default function TriagePanelHost() {
  const [receptionNo, setReceptionNo] = useState("");
  const [active, setActive] = useState("");

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setReceptionNo(e.target.value);
  }

  return (
    <div className="space-y-4">
      <FormField label="접수번호" hint="접수/환자 선택 화면 연동 전 확인용 입력입니다.">
        <div className="flex gap-2">
          <Input
            value={receptionNo}
            onChange={handleChange}
            maxLength={20}
            placeholder="예: ER-20260716-001"
            className="max-w-xs"
          />
          <Button type="button" onClick={() => setActive(receptionNo.trim())} disabled={!receptionNo.trim()}>
            조회
          </Button>
        </div>
      </FormField>

      {active ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <EmsInfoPanel receptionNo={active} />
          <KtasPanel receptionNo={active} />
          <VitalsPanel receptionNo={active} />
          <IsolationPanel receptionNo={active} />
          <RiskScreeningPanel receptionNo={active} className="lg:col-span-2" />
        </div>
      ) : null}
    </div>
  );
}
