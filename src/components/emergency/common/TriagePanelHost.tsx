"use client";

import { useState } from "react";
import EmsInfoPanel from "@/components/emergency/tirage/emsInfo/EmsInfoPanel";
import IsolationPanel from "@/components/emergency/tirage/isolation/IsolationPanel";
import KtasPanel from "@/components/emergency/tirage/ktas/KtasPanel";
import RiskScreeningPanel from "@/components/emergency/tirage/riskScreening/RiskScreeningPanel";
import VitalsPanel from "@/components/emergency/tirage/vitals/VitalsPanel";
import ReceptionListPanel from "@/components/emergency/receptionList/ReceptionListPanel";
import ReceptionIntakeForm from "@/components/emergency/receptionList/ReceptionIntakeForm";
import TriageSummaryBanner from "@/components/emergency/common/TriageSummaryBanner";
import BedAssignmentPanel from "@/components/emergency/resource/BedAssignmentPanel";

type Tab = "triage" | "resource";

// 초기환자(Triage) / 자원관리(Resource Management) — 응급진료(Care)는 UD2-3 착수 시 여기에 탭 추가
const TABS: ReadonlyArray<{ key: Tab; label: string }> = [
  { key: "triage", label: "Triage" },
  { key: "resource", label: "Resource Management" },
];

/**
 * ER 환자 상세 화면 (Triage + 자원관리, 탭으로 구분)
 *
 * 접수 건(receptionNo) 하나를 고정해두고, 그 환자에 대한 여러 업무 화면을
 * 탭으로 전환한다 (환자를 다시 고를 필요 없이 탭만 이동).
 * - 초기환자(Triage, UC-TRI-01~06 / Jira UD2-8,9,10,11,12,43):
 *   EMS 사전정보 · 격리 · 활력징후 · KTAS 분류/재평가 · 위험 스크리닝
 * - 자원관리(Resource, UC-RES-02): 병상 배정 (장비/혼잡도는 추후)
 * 실제로는 접수/환자 선택 화면에서 receptionNo 를 넘겨받아 진입하지만,
 * 그 상위 화면이 아직 없어 이 화면 자체에 조회용 입력을 둔다.
 */
export default function TriagePanelHost() {
  const [active, setActive] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("triage");

  return (
    <div className="grid grid-cols-[minmax(320px,1fr)_2fr] gap-4">
      {/* 왼쪽: 접수 등록(RCP 임시 대체) + 접수목록 */}
      <div className="flex h-[calc(100vh-180px)] min-w-0 flex-col gap-3">
        <ReceptionIntakeForm />
        <div className="min-h-0 flex-1">
          <ReceptionListPanel onSelect={setActive} activeReceptionNo={active} />
        </div>
      </div>

      {/* 오른쪽: 선택된 환자의 탭별 패널 (세로 스크롤) */}
      <div className="flex h-[calc(100vh-180px)] min-w-0 flex-col gap-3">
        {active ? (
          <>
          <TriageSummaryBanner receptionNo={active} />

          <div className="flex gap-1 rounded-xl border border-slate-200/80 bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-sky-50 text-sky-700"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            {/*
              탭이 안 보인다고 언마운트하면 안 된다 — TriageSummaryBanner는 자체 조회 없이
              이 5개 패널이 각자 불러온 Redux 상태를 그대로 읽기만 한다. 조건부 렌더링으로
              숨겨서 언마운트해버리면 그 패널들의 조회 useEffect가 안 돌아서, 환자를 바꿔도
              배너가 이전 환자 데이터를 계속 보여주는 버그가 생긴다(실제로 겪음). 그래서
              항상 마운트해두고 CSS(hidden)로만 감춘다.
            */}
            <div className={`flex flex-col gap-4 ${activeTab === "triage" ? "" : "hidden"}`}>
              <EmsInfoPanel receptionNo={active} />
              <IsolationPanel receptionNo={active} />
              <VitalsPanel receptionNo={active} />
              <KtasPanel receptionNo={active} />
              <RiskScreeningPanel receptionNo={active} />
            </div>
            <div className={`flex flex-col gap-4 ${activeTab === "resource" ? "" : "hidden"}`}>
              <BedAssignmentPanel receptionNo={active} />
            </div>
          </div>
          </>
        ) : (
          <div className="flex h-full min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-400">
            {/* 왼쪽 목록에서 환자를 선택하세요. */}
            Select a patient from the list on the left.
          </div>
        )}
      </div>
    </div>
  );
}
