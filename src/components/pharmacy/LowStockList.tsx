"use client";

import { useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLowStockRequest } from "@/features/pharmacy/slice";
import type { RootState } from "@/store/store";
import { Button, DataTable, FormField, Input, PageHeader, Panel } from "@/components/common";
import type { DataTableColumn } from "@/components/common";
import type { InventoryDto } from "@/features/pharmacy/types";

const columns: DataTableColumn<InventoryDto>[] = [
  { key: "medicationId", header: "Medication ID", render: (row) => row.medicationId },
  { key: "medicationName", header: "Medication Name", render: (row) => row.medicationName ?? "-" },
  { key: "lotNo", header: "Lot No.", render: (row) => row.lotNo },
  { key: "storageLocationId", header: "Storage Location", render: (row) => row.storageLocationId },
  { key: "currentQty", header: "Current Qty", render: (row) => row.currentQty },
];

/** 재고부족 조회 (GET /api/pharmacy/inventories/low-stock-list) — threshold 이하 재고만, 수량이 적은 순으로 */
export default function LowStockList() {
  const dispatch = useDispatch();
  const [threshold, setThreshold] = useState("100");
  const [submittedThreshold, setSubmittedThreshold] = useState<number | null>(null);

  const lowStockList = useSelector((state: RootState) => state.pharmacy.lowStockList);
  const loading = useSelector((state: RootState) => state.pharmacy.lowStockLoading);
  const error = useSelector((state: RootState) => state.pharmacy.lowStockError);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = Number(threshold);
    if (!threshold || value < 0) return;
    setSubmittedThreshold(value);
    dispatch(fetchLowStockRequest(value));
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        title="Low Stock"
        description="Find stock at or below a quantity threshold, lowest quantity first."
      />
      <Panel className="p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <FormField label="Threshold" required>
            <Input
              type="number"
              min={0}
              placeholder="e.g. 100"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
          </FormField>
          <Button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </form>
      </Panel>
      <Panel className="min-h-0 flex-1 p-4">
        <DataTable
          columns={columns}
          rows={lowStockList}
          rowKey={(row) => row.medicationStockId}
          loading={loading}
          loadingMessage="Loading..."
          emptyMessage={
            error ??
            (submittedThreshold === null
              ? "Enter a threshold and search."
              : `No stock at or below ${submittedThreshold}.`)
          }
        />
      </Panel>
    </div>
  );
}
