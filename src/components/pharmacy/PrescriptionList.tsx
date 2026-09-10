"use client";

import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { fetchPrescriptionListRequest } from "@/features/pharmacy/slice";
import type { RootState } from "@/store/store";
import { DataTable, PageHeader, Panel } from "@/components/common";
import type { DataTableColumn } from "@/components/common";
import type { PrescriptionListItem } from "@/features/pharmacy/types";
import { usePatientNames } from "@/features/labimaging/common/hooks/usePatientNames";
import { useEmpNames } from "@/features/emp/hooks/useEmpNames";
import { useDepartmentNames } from "@/features/commonCode/hooks/useDepartmentNames";

export default function PrescriptionList() {
  const dispatch = useDispatch();
  const prescriptionList = useSelector(
    (state: RootState) => state.pharmacy.prescriptionList
  );
  const loading = useSelector(
    (state: RootState) => state.pharmacy.prescriptionLoading
  );
  const error = useSelector(
    (state: RootState) => state.pharmacy.prescriptionError
  );

  useEffect(() => {
    dispatch(fetchPrescriptionListRequest());
  }, [dispatch]);

  // 환자명/의사명/진료과명은 각 서비스에 ID로만 저장돼 있어(약제 백엔드도 patientId/physicianId/
  // departmentId만 갖고 있음 — MSA 원칙상 다른 서비스 데이터를 직접 조인하지 않음), 화면에서
  // ID → 이름으로 붙여서 보여준다. 표시 전용이라 이름 조회가 실패해도 목록 자체는 그대로 동작한다.
  //
  // ⚠ patientId는 배치 조회(POST /api/patient/batch)라 UUID 아닌 값이 하나라도 섞이면
  //   요청 전체가 실패해 진짜 환자 이름까지 다 못 받아온다. 테스트용 더미 ID(TEST-PATIENT-001 등)를
  //   걸러내고 UUID 형식만 보낸다.
  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const { names: patientNames } = usePatientNames(
    prescriptionList
      .map((row) => row.patientId)
      .filter((id) => UUID_PATTERN.test(id))
  );
  const { names: empNames } = useEmpNames();
  const { names: departmentNames } = useDepartmentNames();

  const columns: DataTableColumn<PrescriptionListItem>[] = useMemo(
    () => [
      {
        key: "patientId",
        header: "Patient",
        render: (row) => (
          <Link
            href={`/pharmacy/prescription/${row.prescriptionLinkId}`}
            className="text-sky-600 hover:underline"
          >
            {patientNames[row.patientId] ?? row.patientId}
          </Link>
        ),
      },
      {
        key: "physicianId",
        header: "Doctor",
        render: (row) => empNames[row.physicianId] ?? row.physicianId,
      },
      {
        key: "departmentId",
        header: "Department",
        render: (row) => departmentNames[row.departmentId] ?? row.departmentId,
      },
      { key: "createdAt", header: "Created At", render: (row) => row.createdAt },
    ],
    [patientNames, empNames, departmentNames]
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader title="Prescription List" description="Prescriptions forwarded to pharmacy." />
      <Panel className="min-h-0 flex-1 p-4">
        <DataTable
          columns={columns}
          rows={prescriptionList}
          rowKey={(row) => row.prescriptionLinkId}
          loading={loading}
          loadingMessage="Loading..."
          emptyMessage={error ?? "No prescriptions found."}
        />
      </Panel>
    </div>
  );
}
