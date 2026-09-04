"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchReceiptListRequest } from "@/features/pharmacy/slice";
import type { RootState } from "@/store/store";
import { DataTable, PageHeader, Panel } from "@/components/common";
import type { DataTableColumn } from "@/components/common";
import type { ReceiptDto } from "@/features/pharmacy/types";

const columns: DataTableColumn<ReceiptDto>[] = [
  { key: "medicationId", header: "약품ID", render: (row) => row.medicationId },
  { key: "medicationName", header: "약품명", render: (row) => row.medicationName ?? "-" },
  { key: "lotNo", header: "로트번호", render: (row) => row.lotNo },
  { key: "quantity", header: "입고수량", render: (row) => row.quantity },
  { key: "unitPrice", header: "단가", render: (row) => row.unitPrice ?? "-" },
  { key: "receiptDt", header: "입고일자", render: (row) => row.receiptDt },
  { key: "expirationDt", header: "유효기간", render: (row) => row.expirationDt ?? "-" },
  { key: "storageLocationId", header: "보관위치", render: (row) => row.storageLocationId },
  { key: "supplierId", header: "공급업체", render: (row) => row.supplierId },
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
      <PageHeader title="약품 입고 조회" description="약품 입고 이력을 조회합니다." />
      <Panel className="min-h-0 flex-1 p-4">
        <DataTable
          columns={columns}
          rows={receiptList}
          rowKey={(row) => `${row.medicationId}-${row.lotNo}-${row.receiptDt}-${row.quantity}`}
          loading={loading}
          emptyMessage={error ?? "등록된 입고 내역이 없습니다."}
        />
      </Panel>
    </div>
  );
}
