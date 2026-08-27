"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchIssuanceListRequest } from "@/features/pharmacy/slice";
import type { RootState } from "@/store/store";
import { DataTable, PageHeader, Panel } from "@/components/common";
import type { DataTableColumn } from "@/components/common";
import type { IssuanceDto } from "@/features/pharmacy/types";

const columns: DataTableColumn<IssuanceDto>[] = [
  { key: "medicationId", header: "약품ID", render: (row) => row.medicationId },
  { key: "medicationName", header: "약품명", render: (row) => row.medicationName ?? "-" },
  { key: "lotNo", header: "로트번호", render: (row) => row.lotNo },
  { key: "quantity", header: "출고수량", render: (row) => row.quantity },
  { key: "storageLocationId", header: "보관위치", render: (row) => row.storageLocationId },
  { key: "issuedAt", header: "출고일시", render: (row) => row.issuedAt },
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
      <PageHeader title="약품 출고 조회" description="약품 출고 이력을 조회합니다." />
      <Panel className="min-h-0 flex-1 p-4">
        <DataTable
          columns={columns}
          rows={issuanceList}
          rowKey={(row) => `${row.medicationId}-${row.lotNo}-${row.issuedAt}`}
          loading={loading}
          emptyMessage={error ?? "등록된 출고 내역이 없습니다."}
        />
      </Panel>
    </div>
  );
}
