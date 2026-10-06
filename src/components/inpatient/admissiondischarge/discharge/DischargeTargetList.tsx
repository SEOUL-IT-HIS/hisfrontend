"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import {
  fetchAdmissionsRequest,
  selectAdmissions,
  selectAdmissionListStatus,
} from "@/features/inpatient/admissiondischarge/slice";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";
import DischargeRequestDetail from "@/components/inpatient/admissiondischarge/discharge/DischargeRequestDetail";
import { useDepartmentNames } from "@/features/commonCode/hooks/useDepartmentNames";
import { formatDateTime } from "@/features/inpatient/dateLimits";
import { formatSexAge } from "@/features/inpatient/displayFormat";
import { Alert, DataTable, PageHeader, type DataTableColumn } from "@/components/common";
import type { AdmissionDTO } from "@/features/inpatient/admissiondischarge/types";

type DischargeTargetListProps = {
  /** 입퇴원관리 홈 탭 안에 끼워 넣을 때 true — 자체 제목/여백을 생략 */
  embedded?: boolean;
};

const DischargeTargetList = ({ embedded = false }: DischargeTargetListProps = {}) => {
  const dispatch = useDispatch<AppDispatch>();
  const admissions = useSelector(selectAdmissions);
  const listStatus = useSelector(selectAdmissionListStatus);
  const patients = useSelector((state: RootState) => state.patient.patients);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const dischargeTargets = useMemo(
    () => admissions.filter((admission) => admission.status === "ADMITTED"),
    [admissions],
  );

  const patientNameById = useMemo(
    () => new Map(patients.map((patient) => [patient.patientId, patient.patientName])),
    [patients],
  );
  // patientId → 성별/나이, 진료과 코드 → 진료과명 (ID 대신 화면에 보여줄 값)
  const sexAgeByPatientId = useMemo(
    () => new Map(patients.map((patient) => [patient.patientId, formatSexAge(patient.genderCd, patient.birthDate)])),
    [patients],
  );
  const { names: deptNames } = useDepartmentNames();

  useEffect(() => {
    dispatch(fetchAdmissionsRequest());
    dispatch(fetchPatientListRequest({}));
  }, [dispatch]);

  const columns: DataTableColumn<AdmissionDTO>[] = [
    { key: "patient", header: "Patient Name", render: (a) => <span className="font-medium text-slate-800">{patientNameById.get(a.patientId) ?? "Looking up..."}</span> },
    { key: "sexAge", header: "Sex / Age", render: (a) => sexAgeByPatientId.get(a.patientId) ?? "-" },
    { key: "dept", header: "Admission Dept", render: (a) => (a.admissionDeptId ? deptNames[a.admissionDeptId] ?? a.admissionDeptId : "-") },
    { key: "admissionDate", header: "Admission Date", render: (a) => formatDateTime(a.admissionDate) },
    {
      key: "status",
      header: "Status",
      render: () => (
        <span className="inline-flex items-center whitespace-nowrap rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-200">
          Admitted
        </span>
      ),
    },
  ];

  return (
    <div className={`flex flex-col gap-4 ${embedded ? "w-full" : "mx-auto w-full max-w-[1800px] p-6"}`}>
      {!embedded && (
        <PageHeader title="Discharge Target List" description="List of currently admitted patients eligible for discharge processing." />
      )}

      {listStatus.error && <Alert>{listStatus.error}</Alert>}

      {!listStatus.error && (
        <div className="flex items-start gap-4">
          <div className="flex min-w-0 flex-1 flex-col">
            <DataTable
              columns={columns}
              rows={dischargeTargets}
              rowKey={(a) => a.admissionId}
              onRowClick={(a) => setSelectedId(a.admissionId)}
              isRowActive={(a) => a.admissionId === selectedId}
              loading={listStatus.loading}
              loadingMessage="Loading..."
              emptyMessage="No patients eligible for discharge."
            />
          </div>

          {selectedId && (
            <div className="w-[420px] shrink-0">
              <DischargeRequestDetail admissionId={selectedId} onClose={() => setSelectedId(null)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DischargeTargetList;
