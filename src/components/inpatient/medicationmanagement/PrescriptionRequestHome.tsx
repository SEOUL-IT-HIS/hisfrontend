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
import PrescriptionList from "@/components/inpatient/medicationmanagement/prescription/list";
import PrescriptionDetail from "@/components/inpatient/medicationmanagement/prescription/detail";
import PrescriptionRegisterForm from "@/components/inpatient/medicationmanagement/prescription/registerForm";

// 처방 요청은 입원 중인 환자에게만 보낼 수 있음 (입원 대기/퇴원완료 건은 목록에서 제외)
// 퇴원신청(DISCHARGE_REQUESTED) 상태도 아직 병동에 있는 환자라 포함
const REQUESTABLE_STATUSES = ["ADMITTED", "DISCHARGE_REQUESTED"];

const STATUS_LABEL: Record<string, string> = {
  ADMITTED: "Admitted",
  DISCHARGE_REQUESTED: "Discharge Requested",
};

// 오른쪽 패널에 무엇을 보여줄지 — 처방 상세 or 새 요청 폼 (없으면 목록만)
type Panel = { type: "detail"; prescriptionId: string } | { type: "register" } | null;

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
  const [panel, setPanel] = useState<Panel>(null);

  useEffect(() => {
    dispatch(fetchAdmissionsRequest());
    dispatch(fetchPatientListRequest({}));
  }, [dispatch]);

  const patientNameById = useMemo(
    () => new Map(patients.map((patient) => [patient.patientId, patient.patientName])),
    [patients],
  );
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
    <div className="mx-auto w-full max-w-[1800px] p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-800">Prescription Requests</h1>
        <p className="mt-1 text-sm text-slate-500">
          Select an admitted patient to view and send prescription requests to the outpatient prescription core.
        </p>
      </div>

      <div className="flex items-start gap-4">
        {/* 왼쪽: 입원 중인 환자 목록 */}
        <div className="w-72 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
            Admitted Patients
          </div>
          {admissionListStatus.loading && <p className="px-4 py-6 text-sm text-slate-500">Loading...</p>}
          {admissionListStatus.error && <p className="px-4 py-6 text-sm text-red-600">{admissionListStatus.error}</p>}
          {!admissionListStatus.loading && !admissionListStatus.error && (
            <ul className="divide-y divide-slate-100">
              {requestableAdmissions.map((admission) => (
                <li key={admission.admissionId}>
                  <button
                    type="button"
                    onClick={() => selectAdmission(admission.admissionId)}
                    className={`flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left text-sm hover:bg-slate-50 ${
                      selectedAdmissionId === admission.admissionId ? "bg-sky-50" : ""
                    }`}
                  >
                    <span className="font-medium text-slate-800">{patientLabel(admission.patientId)}</span>
                    <span className="text-xs text-slate-500">
                      {admission.admissionId} · {STATUS_LABEL[admission.status] ?? admission.status}
                    </span>
                  </button>
                </li>
              ))}
              {requestableAdmissions.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-slate-500">No admitted patients.</li>
              )}
            </ul>
          )}
        </div>

        {/* 오른쪽: 선택한 입원 건의 처방 요청 */}
        <div className="min-w-0 flex-1">
          {!selectedAdmissionId ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
              Select a patient on the left to see prescription requests.
            </p>
          ) : (
            <div className="space-y-4">
              {selectedAdmission && (
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-800">{patientLabel(selectedAdmission.patientId)}</span>
                  <span className="ml-2 text-slate-500">
                    {selectedAdmission.admissionId} · Patient ID {selectedAdmission.patientId}
                  </span>
                </p>
              )}

              <div className="flex items-start gap-4">
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
                      <button
                        type="button"
                        onClick={() => setPanel(null)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                      >
                        Deselect
                      </button>
                    </div>
                    <PrescriptionDetail prescriptionId={panel.prescriptionId} />
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionRequestHome;
