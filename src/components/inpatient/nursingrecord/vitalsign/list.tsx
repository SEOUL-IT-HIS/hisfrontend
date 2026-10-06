"use client";

import { useEffect, useMemo } from "react";
import { useNurseOptions } from "@/features/inpatient/admissiondischarge/useDoctorOptions";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import { fetchVitalSignsRequest, selectVitalSignListStatus, selectVitalSigns } from "@/features/inpatient/nursingrecord/vitalsign/slice";
import Link from "next/link";
import { fetchAdmissionsRequest, selectAdmissions } from "@/features/inpatient/admissiondischarge/slice";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";
import { Alert, DataTable, PageHeader, type DataTableColumn } from "@/components/common";
import Toolbar from "@/components/inpatient/common/Toolbar";
import LinkButton from "@/components/inpatient/common/LinkButton";

type VitalSignListProps = {
  /** 간호기록관리 홈 탭 안에 끼워 넣을 때 true — 자체 제목/여백을 생략 */
  embedded?: boolean;
  /** 간호기록 홈에서 선택한 입원 건 — 있으면 그 입원 건 기록만 보여주고, 없으면(단독 목록 페이지) 전체 */
  admissionId?: string | null;
  /** 퇴원 완료된 입원 건이면 true — 기록 조회만 하고 등록 버튼은 숨김 */
  readOnly?: boolean;
};

const VitalSignList = ({ embedded = false, admissionId = null, readOnly = false }: VitalSignListProps = {}) => {
    // 기록자 직원 ID(empId) → 간호사 이름 (목록에 없는 예전 숫자 ID 등은 그대로 표시)
    const { nameById: nurseNameById } = useNurseOptions();
  const dispatch = useDispatch<AppDispatch>();
  const vitalSigns = useSelector(selectVitalSigns);
  const listStatus = useSelector(selectVitalSignListStatus);
  const admissions = useSelector(selectAdmissions);
  const patients = useSelector((state: RootState) => state.patient.patients);

  const patientIdByAdmissionId = useMemo(() => {
    return new Map(admissions.map((admission) => [admission.admissionId, admission.patientId]));
  }, [admissions]);

  const patientNameById = useMemo(() => {
    return new Map(patients.map((patient) => [patient.patientId, patient.patientName]));
  }, [patients]);

  // 지금은 백엔드가 전체 목록만 주므로 프론트에서 admissionId로 걸러냄 (백엔드에 입원 건별 조회 API가 생기면 이 filter는 제거)
  const visibleVitalSigns = useMemo(
    () => (admissionId ? vitalSigns.filter((vitalSign) => vitalSign.admissionId === admissionId) : vitalSigns),
    [vitalSigns, admissionId],
  );

  useEffect(() => {
    dispatch(fetchVitalSignsRequest());
    dispatch(fetchAdmissionsRequest());
    dispatch(fetchPatientListRequest({}));
  }, [dispatch]);

  // 입원 건 → 환자 이름 (기록에는 admissionId만 있어서 두 단계로 찾음)
  const patientNameOf = (recordAdmissionId: string) => {
    const patientId = patientIdByAdmissionId.get(recordAdmissionId);
    return patientId ? patientNameById.get(patientId) ?? "Loading..." : "None";
  };

  const columns: DataTableColumn<(typeof visibleVitalSigns)[number]>[] = [
    { key: "patientname", header: "Patient Name", render: (vitalSign) => <span className="font-medium text-slate-800">{patientNameOf(vitalSign.admissionId)}</span> },
    { key: "measuredat", header: "Measured At", render: (vitalSign) => new Date(vitalSign.measuredAt).toLocaleString() },
    { key: "temperature", header: "Temperature", render: (vitalSign) => vitalSign.temperature },
    { key: "pulse", header: "Pulse", render: (vitalSign) => vitalSign.pulse },
    { key: "respirationrate", header: "Respiration Rate", render: (vitalSign) => vitalSign.respiration },
    { key: "bloodpressure", header: "Blood Pressure", render: (vitalSign) => <>{vitalSign.bpSystolic}/{vitalSign.bpDiastolic}</> },
    { key: "spo2", header: "SpO2", render: (vitalSign) => vitalSign.spo2 },
    { key: "recordedby", header: "Recorded By", render: (vitalSign) => vitalSign.recorderId ? nurseNameById.get(vitalSign.recorderId) ?? vitalSign.recorderId : "-" },
    { key: "details", header: "Details", render: (vitalSign) => <Link href={`/inpatient/nursingrecord/vitalsign/${vitalSign.vitalSignId}`} className="font-medium text-sky-700 hover:underline">View</Link> },
  ];

  return (
    <div className={`flex flex-col gap-4 ${embedded ? "w-full" : "mx-auto w-full max-w-6xl p-6"}`}>
      {!embedded && <PageHeader title="Vital Signs List" description="Vital sign measurement records by patient." />}

      <Toolbar
        actions={
          !readOnly && (
            <LinkButton href={`/inpatient/nursingrecord/vitalsign/create${admissionId ? `?admissionId=${admissionId}` : ""}`}>Register Vital Signs</LinkButton>
          )
        }
      >
        <span className="text-sm text-slate-500">{visibleVitalSigns.length} records</span>
      </Toolbar>

      {listStatus.error ? (
        <Alert>{listStatus.error}</Alert>
      ) : (
        <DataTable
          columns={columns}
          rows={visibleVitalSigns}
          rowKey={(vitalSign) => vitalSign.vitalSignId}
          loading={listStatus.loading}
          loadingMessage="Loading..."
          emptyMessage="No vital signs data available."
        />
      )}
    </div>
  );
};

export default VitalSignList;
