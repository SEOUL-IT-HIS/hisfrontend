"use client";

import { useState } from "react";
import { PageHeader, Panel } from "@/components/common";
import ReceptionRegisterForm from "./ReceptionRegisterForm";
import ReceptionListSection from "./ReceptionListSection";
import ReceptionDetailModal from "./ReceptionDetailModal";
import PatientSearchModal from "@/components/reception/patientmanagement/PatientSearchModal";
import PatientRegisterModal from "@/components/reception/patientmanagement/PatientRegisterModal";
import type { PatientSearchItem } from "@/features/reception/patientmanagement/types";
import type { Patient } from "@/features/patient/type/patientType";

/**
 * 접수관리 화면
 * 흐름: 환자검색 → 환자목록 모달 → 환자 선택 → 접수등록 폼(진료과/의사 선택)
 *       → 접수등록 → 접수목록 갱신 → [상세] 로 접수 상세 조회
 */
export default function ReceptionManagementPage() {
  const [selectedPatient, setSelectedPatient] =
    useState<PatientSearchItem | null>(null);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [patientRegisterOpen, setPatientRegisterOpen] = useState(false);
  const [selectedReceptionId, setSelectedReceptionId] = useState<
    string | null
  >(null);

  function handlePatientRegistered(patient: Patient) {
    setPatientRegisterOpen(false);
    setSelectedPatient({
      patientId: patient.patientId,
      patientName: patient.patientName,
      birthDate: patient.birthDate,
      genderCd: patient.genderCd,
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3">
      <PageHeader
        title="Reception Management"
        description="Search for a patient to register a reception and view the reception status."
      />

      <div className="flex min-h-0 flex-1 gap-3">
        <Panel className="w-[360px] shrink-0 p-4">
          <ReceptionRegisterForm
            selectedPatient={selectedPatient}
            onOpenPatientSearch={() => setPatientSearchOpen(true)}
            onOpenPatientRegister={() => setPatientRegisterOpen(true)}
            onClearPatient={() => setSelectedPatient(null)}
          />
        </Panel>

        <div className="flex min-h-0 flex-1 flex-col">
          <ReceptionListSection onSelectReception={setSelectedReceptionId} />
        </div>
      </div>

      <PatientSearchModal
        open={patientSearchOpen}
        onClose={() => setPatientSearchOpen(false)}
        onSelect={(patient) => setSelectedPatient(patient)}
      />

      <PatientRegisterModal
        open={patientRegisterOpen}
        onClose={() => setPatientRegisterOpen(false)}
        onRegistered={handlePatientRegistered}
      />

      <ReceptionDetailModal
        receptionId={selectedReceptionId}
        onClose={() => setSelectedReceptionId(null)}
      />
    </div>
  );
}
