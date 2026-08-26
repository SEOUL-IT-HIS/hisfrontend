"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchInventoryListRequest } from "@/features/pharmacy/slice";
import type { RootState } from "@/store/store";
import { DataTable, PageHeader, Panel } from "@/components/common";
import type { DataTableColumn } from "@/components/common";
import type { InventoryDto } from "@/features/pharmacy/types";

const columns: DataTableColumn<InventoryDto>[] = [
  { key: "medicationId", header: "약품ID", render: (row) => row.medicationId },
  { key: "medicationName", header: "약품명", render: (row) => row.medicationName ?? "-" },
  { key: "lotNo", header: "로트번호", render: (row) => row.lotNo },
  { key: "expirationDt", header: "유효기간", render: (row) => row.expirationDt ?? "-" },
  { key: "storageLocationId", header: "보관위치", render: (row) => row.storageLocationId },
  { key: "currentQty", header: "현재수량", render: (row) => row.currentQty },
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
      <PageHeader title="약품 재고 조회" description="약품 로트/보관위치별 현재 재고를 조회합니다." />
      <Panel className="min-h-0 flex-1 p-4">
        <DataTable
          columns={columns}
          rows={inventoryList}
          rowKey={(row) => row.medicationStockId}
          loading={loading}
          emptyMessage={error ?? "조회된 재고가 없습니다."}
        />
      </Panel>
    </div>
  );
}
