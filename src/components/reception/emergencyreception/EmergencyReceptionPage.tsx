"use client";

import { useState } from "react";
import { PageHeader, Panel } from "@/components/common";
import EmergencyReceptionForm from "./EmergencyReceptionForm";
import EmergencyReceptionListSection from "./EmergencyReceptionListSection";
import PatientSearchModal from "@/components/reception/patientmanagement/PatientSearchModal";
import ReceptionDetailModal from "@/components/reception/receptionmanagement/ReceptionDetailModal";
import type { PatientSearchItem } from "@/features/reception/patientmanagement/types";

/**
 * 응급 접수 화면 (/emergency/reception)
 * - 환자 검색은 reception 도메인의 PatientSearchModal 을 그대로 재사용한다 (수정 없음).
 * - 등록 API는 reception-service 의 POST /api/reception/emergency 를 사용한다.
 * - 우측 목록/상세 조회는 reception 홈(ReceptionManagementPage)과 동일한 패턴으로,
 *   접수관리 도메인의 목록·상세 조회를 그대로 재사용한다 (신규 API 없음).
 */
export default function EmergencyReceptionPage() {
  const [selectedPatient, setSelectedPatient] =
    useState<PatientSearchItem | null>(null);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [selectedReceptionId, setSelectedReceptionId] = useState<
    string | null
  >(null);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3">
      <PageHeader
        title="Emergency Reception"
        description="Search for an ER patient to register an emergency reception."
      />

      <div className="flex min-h-0 flex-1 gap-3">
        <Panel className="w-[420px] shrink-0 overflow-y-auto p-4">
          <EmergencyReceptionForm
            selectedPatient={selectedPatient}
            onOpenPatientSearch={() => setPatientSearchOpen(true)}
            onClearPatient={() => setSelectedPatient(null)}
          />
        </Panel>

        <div className="flex min-h-0 flex-1 flex-col">
          <EmergencyReceptionListSection
            onSelectReception={setSelectedReceptionId}
          />
        </div>
      </div>

      <PatientSearchModal
        open={patientSearchOpen}
        onClose={() => setPatientSearchOpen(false)}
        onSelect={(patient) => setSelectedPatient(patient)}
      />

      <ReceptionDetailModal
        receptionId={selectedReceptionId}
        onClose={() => setSelectedReceptionId(null)}
      />
    </div>
  );
}
