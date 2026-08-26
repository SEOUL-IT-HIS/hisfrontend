"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { fetchPrescriptionListRequest } from "@/features/pharmacy/slice";
import type { RootState } from "@/store/store";
import { DataTable, PageHeader, Panel } from "@/components/common";
import type { DataTableColumn } from "@/components/common";
import type { PrescriptionListItem } from "@/features/pharmacy/types";

const columns: DataTableColumn<PrescriptionListItem>[] = [
  {
    key: "prescriptionLinkId",
    header: "처방전링크ID",
    render: (row) => (
      <Link
        href={`/pharmacy/prescription/${row.prescriptionLinkId}`}
        className="text-sky-600 hover:underline"
      >
        {row.prescriptionLinkId}
      </Link>
    ),
  },
  { key: "prescriptionId", header: "처방전ID", render: (row) => row.prescriptionId },
  { key: "patientId", header: "환자ID", render: (row) => row.patientId },
  { key: "physicianId", header: "의사ID", render: (row) => row.physicianId },
  { key: "departmentId", header: "진료과ID", render: (row) => row.departmentId },
  { key: "createdAt", header: "등록일시", render: (row) => row.createdAt },
];

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

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader title="처방전 목록조회" description="약제로 넘어온 처방전 목록입니다." />
      <Panel className="min-h-0 flex-1 p-4">
        <DataTable
          columns={columns}
          rows={prescriptionList}
          rowKey={(row) => row.prescriptionLinkId}
          loading={loading}
          emptyMessage={error ?? "조회된 처방전이 없습니다."}
        />
      </Panel>
    </div>
  );
}
