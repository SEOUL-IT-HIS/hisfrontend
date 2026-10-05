"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchControlledDrugRecordsRequest } from "@/features/pharmacy/slice";
import type { RootState } from "@/store/store";
import { DataTable, PageHeader, Panel, Select } from "@/components/common";
import type { DataTableColumn, SelectOption } from "@/components/common";
import type { ControlledDrugRecordDto } from "@/features/pharmacy/types";

const TX_TYPE_OPTIONS: SelectOption[] = [
  { value: "01", label: "Receipt" },
  { value: "02", label: "Issuance" },
  { value: "03", label: "Disposal" },
];

const columns: DataTableColumn<ControlledDrugRecordDto>[] = [
  { key: "controlledTxCd", header: "Type", render: (row) => row.controlledTxCd },
  { key: "movementQty", header: "Qty", render: (row) => row.movementQty },
  { key: "staffId", header: "Staff ID", render: (row) => row.staffId },
  {
    key: "witnessStaffIds",
    header: "Witnesses",
    render: (row) => row.witnessStaffIds.join(", "),
  },
  { key: "inventoryMovementId", header: "Movement ID", render: (row) => row.inventoryMovementId },
];

/**
 * 특수약품 기록 조회(HL2-11) / 마약류 입고 조회(HL2-13) / 마약류 출고 조회(HL2-15) 공용 화면.
 * 유형 필터를 안 고르면 전체(특수약품 기록 조회), 입고/출고를 고르면 그 조회가 된다.
 * 마약류 폐기는 조회 유즈케이스가 원래 없어 이 화면에서도 필터로만 볼 수 있다.
 */
export default function ControlledDrugRecordList() {
  const dispatch = useDispatch();
  const [controlledTxCd, setControlledTxCd] = useState("");
  const recordList = useSelector(
    (state: RootState) => state.pharmacy.controlledDrugRecordList
  );
  const loading = useSelector(
    (state: RootState) => state.pharmacy.controlledDrugRecordLoading
  );
  const error = useSelector(
    (state: RootState) => state.pharmacy.controlledDrugRecordError
  );

  useEffect(() => {
    dispatch(fetchControlledDrugRecordsRequest(controlledTxCd || undefined));
  }, [dispatch, controlledTxCd]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        title="Controlled Drug Records"
        description="Controlled drug transaction records. Filter by type for receipt/issuance inquiries."
      />
      <Panel className="max-w-xs p-4">
        <Select
          options={TX_TYPE_OPTIONS}
          placeholder="All types"
          value={controlledTxCd}
          onChange={(e) => setControlledTxCd(e.target.value)}
        />
      </Panel>
      <Panel className="min-h-0 flex-1 p-4">
        <DataTable
          columns={columns}
          rows={recordList}
          rowKey={(row) => row.controlledDrugRecordId}
          loading={loading}
          loadingMessage="Loading..."
          emptyMessage={error ?? "No controlled drug records."}
        />
      </Panel>
    </div>
  );
}
