"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common";
import InpatientTabs from "@/components/inpatient/common/InpatientTabs";
import AdmissionList from "@/components/inpatient/admissiondischarge/admission/list";
import DischargeTargetList from "@/components/inpatient/admissiondischarge/discharge/DischargeTargetList";

const TABS = [
  { key: "admission", label: "Admission Requests" },
  { key: "discharge", label: "Discharge Requests" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const AdmissionDischargeHome = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("admission");

  return (
    // 화면 높이를 채우고, 아래 탭 내용(목록 + 상세)이 남은 높이를 차지
    <div className="mx-auto flex h-full w-full max-w-[1800px] flex-col gap-4 p-6">
      <PageHeader
        title="Admission & Discharge Management"
        description="View admission requests and discharge requests in a single screen."
      />
      <InpatientTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === "admission" && <AdmissionList embedded />}
      {activeTab === "discharge" && <DischargeTargetList embedded />}
    </div>
  );
};

export default AdmissionDischargeHome;
