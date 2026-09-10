"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchReceiptListRequest } from "@/features/pharmacy/slice";
import type { RootState } from "@/store/store";
import { DataTable, PageHeader, Panel } from "@/components/common";
import type { DataTableColumn } from "@/components/common";
import type { ReceiptDto } from "@/features/pharmacy/types";

const columns: DataTableColumn<ReceiptDto>[] = [
  { key: "medicationId", header: "Medication ID", render: (row) => row.medicationId },
  { key: "medicationName", header: "Medication Name", render: (row) => row.medicationName ?? "-" },
  { key: "lotNo", header: "Lot No.", render: (row) => row.lotNo },
  { key: "quantity", header: "Receipt Qty", render: (row) => row.quantity },
  { key: "unitPrice", header: "Unit Price", render: (row) => row.unitPrice ?? "-" },
  { key: "receiptDt", header: "Receipt Date", render: (row) => row.receiptDt },
  { key: "expirationDt", header: "Expiration Date", render: (row) => row.expirationDt ?? "-" },
  { key: "storageLocationId", header: "Storage Location", render: (row) => row.storageLocationId },
  { key: "supplierId", header: "Supplier", render: (row) => row.supplierId },
];

export default function ReceiptList() {
  const dispatch = useDispatch();
  const receiptList = useSelector((state: RootState) => state.pharmacy.receiptList);
  const loading = useSelector((state: RootState) => state.pharmacy.receiptLoading);
  const error = useSelector((state: RootState) => state.pharmacy.receiptError);

  useEffect(() => {
    dispatch(fetchReceiptListRequest());
  }, [dispatch]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader title="Receipt History" description="Medication receipt history." />
      <Panel className="min-h-0 flex-1 p-4">
        <DataTable
          columns={columns}
          rows={receiptList}
          rowKey={(row) => `${row.medicationId}-${row.lotNo}-${row.receiptDt}-${row.quantity}`}
          loading={loading}
          loadingMessage="Loading..."
          emptyMessage={error ?? "No receipt records."}
        />
      </Panel>
    </div>
  );
}
