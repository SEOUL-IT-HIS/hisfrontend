"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/common";
import InpatientTabs from "@/components/inpatient/common/InpatientTabs";
import BedStatusList from "@/components/inpatient/bedmanagement/bedstatus/list";
import BedAssignmentList from "@/components/inpatient/bedmanagement/bedassignment/list";
import BedReservationList from "@/components/inpatient/bedmanagement/bedreservation/list";
import BedDashboard from "@/components/inpatient/bedmanagement/beddashboard/BedDashboard";

const TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "status", label: "Bed Status" },
  { key: "assignment", label: "Bed Assignment" },
  { key: "reservation", label: "Bed Reservation" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const BedManagementHome = () => {
  // ?tab=assignment 처럼 들어오면 그 탭부터 엶 (병상배정 등록 후 원래 보던 탭으로 돌아올 때 사용)
  const tabParam = useSearchParams().get("tab");
  const [activeTab, setActiveTab] = useState<TabKey>(
    TABS.some((tab) => tab.key === tabParam) ? (tabParam as TabKey) : "dashboard",
  );
  // 대시보드에서 병동 카드를 눌렀을 때 병상현황 탭에 걸어줄 병동 필터
  const [statusWard, setStatusWard] = useState("");

  const openWardStatus = (wardCd: string) => {
    setStatusWard(wardCd);
    setActiveTab("status");
  };

  return (
    <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-4 p-6">
      <PageHeader
        title="Bed Management"
        description="View bed status, assignments, and reservations in one screen."
      />
      <InpatientTabs
        tabs={TABS}
        active={activeTab}
        onChange={(key) => {
          // 탭을 직접 눌러 병상현황으로 갈 때는 대시보드에서 걸었던 병동 필터를 풀어줌
          if (key === "status") setStatusWard("");
          setActiveTab(key);
        }}
      />

      {activeTab === "dashboard" && <BedDashboard onSelectWard={openWardStatus} />}
      {/* key에 병동을 넣어서, 다른 병동 카드로 들어오면 필터가 새 병동으로 다시 초기화되게 함 */}
      {activeTab === "status" && <BedStatusList key={statusWard} embedded initialWard={statusWard} />}
      {activeTab === "assignment" && <BedAssignmentList embedded />}
      {activeTab === "reservation" && <BedReservationList embedded />}
    </div>
  );
};

export default BedManagementHome;
