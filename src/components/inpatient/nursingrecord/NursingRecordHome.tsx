"use client";

import { useState } from "react";
import RiskAssessmentList from "@/components/inpatient/nursingrecord/riskassessment/list";
import VitalSignList from "@/components/inpatient/nursingrecord/vitalsign/list";

const TABS = [
  { key: "riskassessment", label: "위험도 평가" },
  { key: "vitalsign", label: "간호기록" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const NursingRecordHome = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("riskassessment");

  return (
    <div className="mx-auto w-full max-w-[1800px] p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-800">간호기록관리</h1>
        <p className="mt-1 text-sm text-slate-500">위험도 평가와 활력징후 기록을 한 화면에서 확인합니다.</p>
      </div>

      <div className="mb-6 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-sky-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "riskassessment" && <RiskAssessmentList embedded />}
      {activeTab === "vitalsign" && <VitalSignList embedded />}
    </div>
  );
};

export default NursingRecordHome;
