"use client";

import { useEffect, useMemo } from "react";
import { ALL_IO_ROUTE_OPTIONS, IO_ROUTE_OPTIONS, IO_TYPE_OPTIONS, codeLabel } from "@/features/inpatient/nursingrecord/codes";
import { useNurseOptions } from "@/features/inpatient/admissiondischarge/useDoctorOptions";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import Link from "next/link";
import { fetchAdmissionsRequest, selectAdmissions } from "@/features/inpatient/admissiondischarge/slice";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";
import { fetchIandORecordsRequest, selectIandORecords, selectIandORecordListStatus } from "@/features/inpatient/nursingrecord/iandorecord/slice";
import { Alert, DataTable, PageHeader, type DataTableColumn } from "@/components/common";
import Toolbar from "@/components/inpatient/common/Toolbar";
import LinkButton from "@/components/inpatient/common/LinkButton";

type IandORecordListProps = {
  /** 간호기록관리 홈 탭 안에 끼워 넣을 때 true — 자체 제목/여백을 생략 */
  embedded?: boolean;
  /** 간호기록 홈에서 선택한 입원 건 — 있으면 그 입원 건 기록만 보여주고, 없으면(단독 목록 페이지) 전체 */
  admissionId?: string | null;
  /** 퇴원 완료된 입원 건이면 true — 기록 조회만 하고 등록 버튼은 숨김 */
  readOnly?: boolean;
};

const IandORecordList = ({ embedded = false, admissionId = null, readOnly = false }: IandORecordListProps = {}) => {
    // 기록자 직원 ID(empId) → 간호사 이름 (목록에 없는 예전 숫자 ID 등은 그대로 표시)
    const { nameById: nurseNameById } = useNurseOptions();
  const dispatch = useDispatch<AppDispatch>();
  const iandorecords = useSelector(selectIandORecords);
  const listStatus = useSelector(selectIandORecordListStatus);
  const admissions = useSelector(selectAdmissions);
  const patients = useSelector((state: RootState) => state.patient.patients);

  const patientIdByAdmissionId = useMemo(() => {
    return new Map(admissions.map((admission) => [admission.admissionId, admission.patientId]));
  }, [admissions]);

  const patientNameById = useMemo(() => {
    return new Map(patients.map((patient) => [patient.patientId, patient.patientName]));
  }, [patients]);

  // 지금은 백엔드가 전체 목록만 주므로 프론트에서 admissionId로 걸러냄 (백엔드에 입원 건별 조회 API가 생기면 이 filter는 제거)
  const visibleIandORecords = useMemo(
    () => (admissionId ? iandorecords.filter((iandorecord) => iandorecord.admissionId === admissionId) : iandorecords),
    [iandorecords, admissionId],
  );

  useEffect(() => {
    dispatch(fetchIandORecordsRequest());
    dispatch(fetchAdmissionsRequest());
    dispatch(fetchPatientListRequest({}));
  }, [dispatch]);

  // 입원 건 → 환자 이름 (기록에는 admissionId만 있어서 두 단계로 찾음)
  const patientNameOf = (recordAdmissionId: string) => {
    const patientId = patientIdByAdmissionId.get(recordAdmissionId);
    return patientId ? patientNameById.get(patientId) ?? "Loading..." : "None";
  };

  const columns: DataTableColumn<(typeof visibleIandORecords)[number]>[] = [
    { key: "patientname", header: "Patient Name", render: (iandorecord) => <span className="font-medium text-slate-800">{patientNameOf(iandorecord.admissionId)}</span> },
    { key: "details", header: "Details", render: (iandorecord) => <Link href={`/inpatient/nursingrecord/iandorecord/${iandorecord.intakeOutputId}`} className="font-medium text-sky-700 hover:underline">View</Link> },
    { key: "recordedat", header: "Recorded At", render: (iandorecord) => new Date(iandorecord.recordedAt).toLocaleString() },
    { key: "iotypecode", header: "I/O Type Code", render: (iandorecord) => codeLabel(IO_TYPE_OPTIONS, iandorecord.ioTypeCd) },
    { key: "routecode", header: "Route Code", render: (iandorecord) => codeLabel(ALL_IO_ROUTE_OPTIONS, iandorecord.routeCd) },
    { key: "amountml", header: "Amount (mL)", render: (iandorecord) => iandorecord.amountMl },
    { key: "recordedby", header: "Recorded By", render: (iandorecord) => iandorecord.recorderId ? nurseNameById.get(iandorecord.recorderId) ?? iandorecord.recorderId : "-" },
    { key: "createdat", header: "Created At", render: (iandorecord) => new Date(iandorecord.createdAt).toLocaleString() },
    { key: "updatedat", header: "Updated At", render: (iandorecord) => new Date(iandorecord.updatedAt).toLocaleString() },
  ];

  return (
    <div className={`flex flex-col gap-4 ${embedded ? "w-full" : "mx-auto w-full max-w-6xl p-6"}`}>
      {!embedded && <PageHeader title="Patient I&O Record List" description="Intake/output records by patient." />}

      <Toolbar
        actions={
          !readOnly && (
            <LinkButton href={`/inpatient/nursingrecord/iandorecord/create${admissionId ? `?admissionId=${admissionId}` : ""}`}>Register I&O Record</LinkButton>
          )
        }
      >
        <span className="text-sm text-slate-500">{visibleIandORecords.length} records</span>
      </Toolbar>

      {listStatus.error ? (
        <Alert>{listStatus.error}</Alert>
      ) : (
        <DataTable
          columns={columns}
          rows={visibleIandORecords}
          rowKey={(iandorecord) => iandorecord.intakeOutputId}
          loading={listStatus.loading}
          loadingMessage="Loading..."
          emptyMessage="No I&O record data available."
        />
      )}
    </div>
  );
};

export default IandORecordList;
