"use client";

import { useState } from "react";
import BedStatusList from "@/components/inpatient/bedmanagement/bedstatus/list";
import BedAssignmentList from "@/components/inpatient/bedmanagement/bedassignment/list";
import BedReservationList from "@/components/inpatient/bedmanagement/bedreservation/list";

const TABS = [
  { key: "status", label: "병상 현황" },
  { key: "assignment", label: "병상 배정" },
  { key: "reservation", label: "병상 예약" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const BedManagementHome = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("status");

  return (
    <div className="mx-auto w-full max-w-[1800px] p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-800">병상관리</h1>
        <p className="mt-1 text-sm text-slate-500">병상 현황, 배정, 예약을 한 화면에서 확인합니다.</p>
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

      {activeTab === "status" && <BedStatusList embedded />}
      {activeTab === "assignment" && <BedAssignmentList embedded />}
      {activeTab === "reservation" && <BedReservationList embedded />}
    </div>
  );
};

export default BedManagementHome;
