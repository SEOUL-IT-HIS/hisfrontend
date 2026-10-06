"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "next/navigation";
import type { AppDispatch, RootState } from "@/store/store";
import {
  fetchAdmissionsRequest,
  selectAdmissionListStatus,
  selectAdmissions,
} from "@/features/inpatient/admissiondischarge/slice";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";
import { formatDateTime } from "@/features/inpatient/dateLimits";
import { formatSexAge } from "@/features/inpatient/displayFormat";
import { Button, PageHeader, Panel } from "@/components/common";
import AdmissionPickerPanel from "@/components/inpatient/common/AdmissionPickerPanel";
import PrescriptionList from "@/components/inpatient/medicationmanagement/prescription/list";
import PrescriptionDetail from "@/components/inpatient/medicationmanagement/prescription/detail";
import PrescriptionRegisterForm from "@/components/inpatient/medicationmanagement/prescription/registerForm";

// 처방 요청은 입원 중(ADMITTED)인 환자에게만 보낼 수 있음 (입원 대기/퇴원신청/퇴원완료 건은 목록에서 제외)
// 퇴원신청(DISCHARGE_REQUESTED) 이후는 수납 청구가 이미 시작돼서 새 처방이 정산과 어긋날 수 있으므로 제외
// (간호기록은 퇴원신청 환자도 포함 — 기준이 다름)
const REQUESTABLE_STATUSES = ["ADMITTED"];

const STATUS_LABEL: Record<string, string> = {
  ADMITTED: "Admitted",
  DISCHARGE_REQUESTED: "Discharge Requested",
};

// 오른쪽 패널에 무엇을 보여줄지 — 처방 상세 or 새 요청 폼 (없으면 목록만)
type SidePanel = { type: "detail"; prescriptionId: string } | { type: "register" } | null;

/**
 * 처방 요청 화면 (병동 → 외래 처방코어로 처방을 "요청"하는 화면, 처방을 직접 내리는 화면이 아님)
 * - 왼쪽: 입원 중인 환자 목록에서 입원 건 선택
 * - 오른쪽: 선택한 입원 건의 처방 요청 목록 + 상세 / 새 요청 폼
 * - 입원 상세의 "Request Prescription" 링크로 들어오면 ?admissionId= 로 해당 입원 건이 미리 선택됨
 */
const PrescriptionRequestHome = () => {
  const dispatch = useDispatch<AppDispatch>();
  const searchParams = useSearchParams();
  const admissions = useSelector(selectAdmissions);
  const admissionListStatus = useSelector(selectAdmissionListStatus);
  const patients = useSelector((state: RootState) => state.patient.patients);
  const patientListLoading = useSelector((state: RootState) => state.patient.listLoading);

  const [selectedAdmissionId, setSelectedAdmissionId] = useState<string | null>(searchParams.get("admissionId"));
  const [panel, setPanel] = useState<SidePanel>(null);

  useEffect(() => {
    dispatch(fetchAdmissionsRequest());
    dispatch(fetchPatientListRequest({}));
  }, [dispatch]);

  const patientNameById = useMemo(
    () => new Map(patients.map((patient) => [patient.patientId, patient.patientName])),
    [patients],
  );
  // 성별/나이 ("F / 34") — 입원 ID · 환자 ID 대신 화면에 보여줄 값
  const sexAgeLabel = (patientId: string) => {
    const patient = patients.find((p) => p.patientId === patientId);
    return patient ? formatSexAge(patient.genderCd, patient.birthDate) : "-";
  };
  const patientLabel = (patientId: string) =>
    patientNameById.get(patientId) ?? (patientListLoading ? "Loading..." : "Unknown");

  const requestableAdmissions = useMemo(
    () => admissions.filter((a) => REQUESTABLE_STATUSES.includes(a.status)),
    [admissions],
  );
  const selectedAdmission = admissions.find((a) => a.admissionId === selectedAdmissionId) ?? null;

  const selectAdmission = (admissionId: string) => {
    setSelectedAdmissionId(admissionId);
    setPanel(null); // 다른 환자를 고르면 이전 환자의 상세/폼은 닫음
  };

  return (
    // 응급 화면처럼 왼쪽 목록·오른쪽 내용이 화면 아래까지 꽉 차고, 각자 안에서 스크롤
    <div className="mx-auto flex h-full w-full max-w-[1800px] flex-col gap-4 p-6">
      <PageHeader
        title="Prescription Requests"
        description="Select an admitted patient to view and send prescription requests to the outpatient prescription core."
      />

      <div className="grid min-h-[560px] flex-1 grid-cols-[minmax(320px,1fr)_3fr] grid-rows-[minmax(0,1fr)] gap-4">
        {/* 왼쪽: 입원 중인 환자 목록 */}
        <AdmissionPickerPanel
          title="Admitted Patients"
          admissions={requestableAdmissions}
          loading={admissionListStatus.loading}
          error={admissionListStatus.error}
          selectedAdmissionId={selectedAdmissionId}
          onSelect={selectAdmission}
          patientLabel={patientLabel}
          statusLabel={STATUS_LABEL}
        />

        {/* 오른쪽: 선택한 입원 건의 처방 요청 */}
        <div className="flex min-h-0 min-w-0 flex-col gap-3">
          {!selectedAdmissionId ? (
            <Panel dashed className="flex-1 items-center justify-center px-4 py-10 text-center text-sm text-slate-500">
              Select a patient on the left to see prescription requests.
            </Panel>
          ) : (
            <>
              {selectedAdmission && (
                <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                  <span className="font-semibold text-slate-800">{patientLabel(selectedAdmission.patientId)}</span>
                  <span className="ml-2 text-slate-500">
                    {sexAgeLabel(selectedAdmission.patientId)} · Admitted {formatDateTime(selectedAdmission.admissionDate)}
                  </span>
                </div>
              )}

              {/* 처방 목록 + 상세/폼 — 이 영역 안에서만 스크롤 */}
              <div className="flex min-h-0 flex-1 items-start gap-4 overflow-y-auto">
                <div className="min-w-0 flex-1">
                  <PrescriptionList
                    admissionId={selectedAdmissionId}
                    selectedPrescriptionId={panel?.type === "detail" ? panel.prescriptionId : null}
                    onSelectPrescription={(prescriptionId) => setPanel({ type: "detail", prescriptionId })}
                    onRegisterClick={() => setPanel({ type: "register" })}
                  />
                </div>

                {panel?.type === "detail" && (
                  <div className="w-[480px] shrink-0">
                    <div className="mb-2 flex justify-end">
                      <Button variant="secondary" onClick={() => setPanel(null)} className="!h-8 !px-3">
                        Deselect
                      </Button>
                    </div>
                    {/* key: 다른 처방을 고르면 상세를 새로 그려서 취소 사유 입력값 등이 초기화되게 함 */}
                    <PrescriptionDetail key={panel.prescriptionId} prescriptionId={panel.prescriptionId} />
                  </div>
                )}

                {panel?.type === "register" && (
                  <div className="w-[560px] shrink-0">
                    {/* key: 환자를 바꾸면 폼 입력값도 새로 시작 */}
                    <PrescriptionRegisterForm
                      key={selectedAdmissionId}
                      admissionId={selectedAdmissionId}
                      onSuccess={() => setPanel(null)}
                      onCancel={() => setPanel(null)}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionRequestHome;
