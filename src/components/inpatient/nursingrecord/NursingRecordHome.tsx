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
import RiskAssessmentList from "@/components/inpatient/nursingrecord/riskassessment/list";
import VitalSignList from "@/components/inpatient/nursingrecord/vitalsign/list";
import RestraintList from "@/components/inpatient/nursingrecord/restraint/list";
import NursingAssessmentList from "@/components/inpatient/nursingrecord/nursingassessment/list";
import IandORecordList from "@/components/inpatient/nursingrecord/iandorecord/list";

const TABS = [
  { key: "vitalsign", label: "Vital Sign" },
  { key: "riskassessment", label: "Risk Assessment" },
  { key: "restraint", label: "Restraint" },
  { key: "nursingassessment", label: "Nursing Assessment" },
  { key: "iandorecord", label: "I&O Record" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// 간호기록은 퇴원신청 후에도 병동에 있는 동안 계속 작성하므로 DISCHARGE_REQUESTED도 포함 (처방요청과 기준이 다름)
const RECORDABLE_STATUSES = ["ADMITTED", "DISCHARGE_REQUESTED"];

const STATUS_LABEL: Record<string, string> = {
  ADMITTED: "Admitted",
  DISCHARGE_REQUESTED: "Discharge Requested",
  DISCHARGED: "Discharged · Read only",
};

/**
 * 간호기록관리 홈
 * - 왼쪽: 입원 중인 환자 목록에서 입원 건 선택
 * - 오른쪽: 탭별 간호기록 — 선택한 입원 건의 기록만 표시
 * - ?admissionId= 로 들어오면 해당 입원 건이 미리 선택되고, ?tab= 으로 탭도 지정 가능
 *   (입원 상세의 "Nursing Records" 링크, 등록 후 돌아오는 경로에서 사용)
 */
const NursingRecordHome = () => {
  const dispatch = useDispatch<AppDispatch>();
  const searchParams = useSearchParams();
  const admissions = useSelector(selectAdmissions);
  const admissionListStatus = useSelector(selectAdmissionListStatus);
  const patients = useSelector((state: RootState) => state.patient.patients);
  const patientListLoading = useSelector((state: RootState) => state.patient.listLoading);

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TabKey>(
    TABS.some((tab) => tab.key === tabParam) ? (tabParam as TabKey) : "vitalsign",
  );
  const [selectedAdmissionId, setSelectedAdmissionId] = useState<string | null>(searchParams.get("admissionId"));
  // 퇴원 완료 환자도 목록에 보이기 — 간호기록은 보존 의무가 있는 의료 기록이라 퇴원 후에도 조회는 가능해야 함 (작성은 불가)
  const [showDischarged, setShowDischarged] = useState(false);

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

  const recordableAdmissions = useMemo(
    () =>
      admissions.filter(
        (a) => RECORDABLE_STATUSES.includes(a.status) || (showDischarged && a.status === "DISCHARGED"),
      ),
    [admissions, showDischarged],
  );
  const selectedAdmission = admissions.find((a) => a.admissionId === selectedAdmissionId) ?? null;
  // 퇴원 완료된 입원 건은 조회만 — 탭 목록의 등록 버튼을 숨김 (서버에서도 작성을 거절함)
  const readOnly = selectedAdmission?.status === "DISCHARGED";

  return (
    <div className="mx-auto w-full max-w-[1800px] p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-800">Nursing Record Management</h1>
        <p className="mt-1 text-sm text-slate-500">Select an admitted patient to view vital signs, risk assessments, restraints, nursing assessments, and I&O records.</p>
      </div>

      <div className="flex items-start gap-4">
        {/* 왼쪽: 입원 중인 환자 목록 */}
        <div className="w-72 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Admitted Patients</span>
            <label className="flex items-center gap-1.5 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={showDischarged}
                onChange={(e) => setShowDischarged(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300"
              />
              Show discharged
            </label>
          </div>
          {admissionListStatus.loading && <p className="px-4 py-6 text-sm text-slate-500">Loading...</p>}
          {admissionListStatus.error && <p className="px-4 py-6 text-sm text-red-600">{admissionListStatus.error}</p>}
          {!admissionListStatus.loading && !admissionListStatus.error && (
            <ul className="divide-y divide-slate-100">
              {recordableAdmissions.map((admission) => (
                <li key={admission.admissionId}>
                  <button
                    type="button"
                    onClick={() => setSelectedAdmissionId(admission.admissionId)}
                    className={`flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left text-sm hover:bg-slate-50 ${
                      selectedAdmissionId === admission.admissionId ? "bg-sky-50" : ""
                    }`}
                  >
                    <span className={`font-medium ${admission.status === "DISCHARGED" ? "text-slate-500" : "text-slate-800"}`}>
                      {patientLabel(admission.patientId)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {admission.admissionId} · {STATUS_LABEL[admission.status] ?? admission.status}
                    </span>
                  </button>
                </li>
              ))}
              {recordableAdmissions.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-slate-500">No admitted patients.</li>
              )}
            </ul>
          )}
        </div>

        {/* 오른쪽: 선택한 입원 건의 간호기록 탭 */}
        <div className="min-w-0 flex-1">
          {!selectedAdmissionId ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
              Select a patient on the left to see nursing records.
            </p>
          ) : (
            <>
              {selectedAdmission && (
                <p className="mb-4 text-sm text-slate-600">
                  <span className="font-medium text-slate-800">{patientLabel(selectedAdmission.patientId)}</span>
                  <span className="ml-2 text-slate-500">
                    {selectedAdmission.admissionId} · Patient ID {selectedAdmission.patientId}
                  </span>
                </p>
              )}

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

              {/* 모든 탭 목록에 선택한 입원 건을 넘겨서 그 환자 기록만 표시 */}
              {activeTab === "vitalsign" && <VitalSignList embedded admissionId={selectedAdmissionId} readOnly={readOnly} />}
              {activeTab === "riskassessment" && <RiskAssessmentList embedded admissionId={selectedAdmissionId} readOnly={readOnly} />}
              {activeTab === "restraint" && <RestraintList embedded admissionId={selectedAdmissionId} readOnly={readOnly} />}
              {activeTab === "nursingassessment" && <NursingAssessmentList embedded admissionId={selectedAdmissionId} readOnly={readOnly} />}
              {activeTab === "iandorecord" && <IandORecordList embedded admissionId={selectedAdmissionId} readOnly={readOnly} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NursingRecordHome;
