"use client";

import { useState } from "react";
import BedStatusList from "@/components/inpatient/bedmanagement/bedstatus/list";
import BedAssignmentList from "@/components/inpatient/bedmanagement/bedassignment/list";
import BedReservationList from "@/components/inpatient/bedmanagement/bedreservation/list";

const TABS = [
  { key: "status", label: "Bed Status" },
  { key: "assignment", label: "Bed Assignment" },
  { key: "reservation", label: "Bed Reservation" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const BedManagementHome = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("status");

  return (
    <div className="mx-auto w-full max-w-[1800px] p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-800">Bed Management</h1>
        <p className="mt-1 text-sm text-slate-500">View bed status, assignments, and reservations in one screen.</p>
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
