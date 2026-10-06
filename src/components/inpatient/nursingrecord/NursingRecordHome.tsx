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
import { PageHeader, Panel } from "@/components/common";
import AdmissionPickerPanel from "@/components/inpatient/common/AdmissionPickerPanel";
import InpatientTabs from "@/components/inpatient/common/InpatientTabs";
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
  // 성별/나이 ("F / 34") — 입원 ID · 환자 ID 대신 화면에 보여줄 값
  const sexAgeLabel = (patientId: string) => {
    const patient = patients.find((p) => p.patientId === patientId);
    return patient ? formatSexAge(patient.genderCd, patient.birthDate) : "-";
  };
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
    // 응급 화면처럼 왼쪽 목록·오른쪽 내용이 화면 아래까지 꽉 차고, 각자 안에서 스크롤
    <div className="mx-auto flex h-full w-full max-w-[1800px] flex-col gap-4 p-6">
      <PageHeader
        title="Nursing Record Management"
        description="Select an admitted patient to view vital signs, risk assessments, restraints, nursing assessments, and I&O records."
      />

      <div className="grid min-h-[560px] flex-1 grid-cols-[minmax(320px,1fr)_3fr] grid-rows-[minmax(0,1fr)] gap-4">
        {/* 왼쪽: 입원 중인 환자 목록 */}
        <AdmissionPickerPanel
          title="Admitted Patients"
          admissions={recordableAdmissions}
          loading={admissionListStatus.loading}
          error={admissionListStatus.error}
          selectedAdmissionId={selectedAdmissionId}
          onSelect={setSelectedAdmissionId}
          patientLabel={patientLabel}
          statusLabel={STATUS_LABEL}
          headerExtra={
            <label className="flex items-center gap-1.5 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={showDischarged}
                onChange={(e) => setShowDischarged(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 accent-sky-600"
              />
              Show discharged
            </label>
          }
        />

        {/* 오른쪽: 선택한 입원 건의 간호기록 탭 */}
        <div className="flex min-h-0 min-w-0 flex-col gap-3">
          {!selectedAdmissionId ? (
            <Panel dashed className="flex-1 items-center justify-center px-4 py-10 text-center text-sm text-slate-500">
              Select a patient on the left to see nursing records.
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

              <InpatientTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

              {/* 탭 내용 — 이 영역 안에서만 스크롤 */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                {/* 모든 탭 목록에 선택한 입원 건을 넘겨서 그 환자 기록만 표시 */}
                {activeTab === "vitalsign" && <VitalSignList embedded admissionId={selectedAdmissionId} readOnly={readOnly} />}
                {activeTab === "riskassessment" && <RiskAssessmentList embedded admissionId={selectedAdmissionId} readOnly={readOnly} />}
                {activeTab === "restraint" && <RestraintList embedded admissionId={selectedAdmissionId} readOnly={readOnly} />}
                {activeTab === "nursingassessment" && <NursingAssessmentList embedded admissionId={selectedAdmissionId} readOnly={readOnly} />}
                {activeTab === "iandorecord" && <IandORecordList embedded admissionId={selectedAdmissionId} readOnly={readOnly} />}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NursingRecordHome;
