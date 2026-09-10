"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchIssuanceListRequest } from "@/features/pharmacy/slice";
import type { RootState } from "@/store/store";
import { DataTable, PageHeader, Panel } from "@/components/common";
import type { DataTableColumn } from "@/components/common";
import type { IssuanceDto } from "@/features/pharmacy/types";

const columns: DataTableColumn<IssuanceDto>[] = [
  { key: "medicationId", header: "Medication ID", render: (row) => row.medicationId },
  { key: "medicationName", header: "Medication Name", render: (row) => row.medicationName ?? "-" },
  { key: "lotNo", header: "Lot No.", render: (row) => row.lotNo },
  { key: "quantity", header: "Issued Qty", render: (row) => row.quantity },
  { key: "storageLocationId", header: "Storage Location", render: (row) => row.storageLocationId },
  { key: "issuedAt", header: "Issued At", render: (row) => row.issuedAt },
];

export default function IssuanceList() {
  const dispatch = useDispatch();
  const issuanceList = useSelector((state: RootState) => state.pharmacy.issuanceList);
  const loading = useSelector((state: RootState) => state.pharmacy.issuanceLoading);
  const error = useSelector((state: RootState) => state.pharmacy.issuanceError);

  useEffect(() => {
    dispatch(fetchIssuanceListRequest());
  }, [dispatch]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader title="Issuance History" description="Medication issuance history." />
      <Panel className="min-h-0 flex-1 p-4">
        <DataTable
          columns={columns}
          rows={issuanceList}
          rowKey={(row) => `${row.medicationId}-${row.lotNo}-${row.issuedAt}`}
          loading={loading}
          loadingMessage="Loading..."
          emptyMessage={error ?? "No issuance records."}
        />
      </Panel>
    </div>
  );
}
