"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchInventoryListRequest } from "@/features/pharmacy/slice";
import type { RootState } from "@/store/store";
import { DataTable, PageHeader, Panel } from "@/components/common";
import type { DataTableColumn } from "@/components/common";
import type { InventoryDto } from "@/features/pharmacy/types";

const columns: DataTableColumn<InventoryDto>[] = [
  { key: "medicationId", header: "Medication ID", render: (row) => row.medicationId },
  { key: "medicationName", header: "Medication Name", render: (row) => row.medicationName ?? "-" },
  { key: "lotNo", header: "Lot No.", render: (row) => row.lotNo },
  { key: "expirationDt", header: "Expiration Date", render: (row) => row.expirationDt ?? "-" },
  { key: "storageLocationId", header: "Storage Location", render: (row) => row.storageLocationId },
  { key: "currentQty", header: "Current Qty", render: (row) => row.currentQty },
];

export default function InventoryList() {
  const dispatch = useDispatch();
  const inventoryList = useSelector((state: RootState) => state.pharmacy.inventoryList);
  const loading = useSelector((state: RootState) => state.pharmacy.inventoryLoading);
  const error = useSelector((state: RootState) => state.pharmacy.inventoryError);

  useEffect(() => {
    dispatch(fetchInventoryListRequest());
  }, [dispatch]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader title="Inventory" description="Current stock by medication lot and storage location." />
      <Panel className="min-h-0 flex-1 p-4">
        <DataTable
          columns={columns}
          rows={inventoryList}
          rowKey={(row) => row.medicationStockId}
          loading={loading}
          loadingMessage="Loading..."
          emptyMessage={error ?? "No inventory found."}
        />
      </Panel>
    </div>
  );
}
