"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { fetchPrescriptionListRequest } from "@/features/pharmacy/slice";
import type { RootState } from "@/store/store";
import { DataTable, PageHeader, Pagination, Panel, Select } from "@/components/common";
import type { DataTableColumn, SelectOption } from "@/components/common";
import type { PrescriptionListItem, PrescriptionStage } from "@/features/pharmacy/types";
import { usePatientNames } from "@/features/labimaging/common/hooks/usePatientNames";
import { useEmpNames } from "@/features/emp/hooks/useEmpNames";
import { useDepartmentNames } from "@/features/commonCode/hooks/useDepartmentNames";

const STAGE_OPTIONS: SelectOption[] = [
  { value: "ALL", label: "All" },
  { value: "RECEIVED", label: "Received (awaiting dispensing)" },
  { value: "DISPENSED", label: "Dispensed (awaiting release)" },
  { value: "RELEASED", label: "Released" },
  { value: "RELEASE_CANCELLED", label: "Release cancelled" },
  { value: "REJECTED", label: "Rejected" },
];

/** 처리 상태 + 불출 상태를 한 줄로 — 조제완료 건은 불출 여부까지 같이 보여줘야 "할 일"이 남았는지 알 수 있다 */
function stageOf(row: PrescriptionListItem): { label: string; className: string } {
  if (row.status === "RECEIVED") return { label: "Received", className: "bg-sky-50 text-sky-700" };
  if (row.status === "REJECTED") return { label: "Rejected", className: "bg-rose-50 text-rose-600" };
  if (row.releaseStatusCd === "RELEASED") return { label: "Released", className: "bg-emerald-50 text-emerald-700" };
  if (row.releaseStatusCd === "CANCELLED") return { label: "Release cancelled", className: "bg-slate-100 text-slate-600" };
  return { label: "Dispensed - awaiting release", className: "bg-amber-50 text-amber-700" };
}

export default function PrescriptionList() {
  const dispatch = useDispatch();
  const prescriptionList = useSelector(
    (state: RootState) => state.pharmacy.prescriptionList
  );
  const totalPages = useSelector(
    (state: RootState) => state.pharmacy.prescriptionTotalPages
  );
  const totalElements = useSelector(
    (state: RootState) => state.pharmacy.prescriptionTotalElements
  );
  const loading = useSelector(
    (state: RootState) => state.pharmacy.prescriptionLoading
  );
  const error = useSelector(
    (state: RootState) => state.pharmacy.prescriptionError
  );

  const [stage, setStage] = useState<PrescriptionStage>("ALL");
  // 화면의 페이지 번호는 1부터, 서버 요청은 0부터
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchPrescriptionListRequest({ page: page - 1, stage }));
  }, [dispatch, page, stage]);

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
      {
        key: "createdAt",
        header: "Created At",
        render: (row) => row.createdAt.replace("T", " ").slice(0, 19),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => {
          const stageInfo = stageOf(row);
          return (
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${stageInfo.className}`}>
              {stageInfo.label}
            </span>
          );
        },
      },
    ],
    [patientNames, empNames, departmentNames]
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        title="Prescription List"
        description="Prescriptions forwarded to pharmacy. Open one to dispense, release, or process a return."
      />
      <Panel className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="w-full max-w-xs">
          <Select
            options={STAGE_OPTIONS}
            value={stage}
            onChange={(e) => {
              setStage(e.target.value as PrescriptionStage);
              setPage(1);
            }}
          />
        </div>
        <span className="text-sm text-slate-500">{totalElements} prescription(s)</span>
      </Panel>
      <Panel className="min-h-0 flex-1 p-4">
        <DataTable
          columns={columns}
          rows={prescriptionList}
          rowKey={(row) => row.prescriptionLinkId}
          loading={loading}
          loadingMessage="Loading..."
          emptyMessage={error ?? "No prescriptions found."}
          minWidthClassName="min-w-[640px]"
        />
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="mt-3"
          prevLabel="Prev"
          nextLabel="Next"
        />
      </Panel>
    </div>
  );
}
