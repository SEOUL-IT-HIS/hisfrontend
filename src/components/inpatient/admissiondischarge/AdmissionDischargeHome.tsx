"use client";

import { useState } from "react";
import AdmissionList from "@/components/inpatient/admissiondischarge/admission/list";
import DischargeTargetList from "@/components/inpatient/admissiondischarge/discharge/DischargeTargetList";

const TABS = [
  { key: "admission", label: "입원요청" },
  { key: "discharge", label: "퇴원요청" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const AdmissionDischargeHome = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("admission");

  return (
    <div className="mx-auto w-full max-w-[1800px] p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-800">입퇴원관리</h1>
        <p className="mt-1 text-sm text-slate-500">입원 요청과 퇴원 요청을 한 화면에서 확인합니다.</p>
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

      {activeTab === "admission" && <AdmissionList embedded />}
      {activeTab === "discharge" && <DischargeTargetList embedded />}
    </div>
  );
};

export default AdmissionDischargeHome;
