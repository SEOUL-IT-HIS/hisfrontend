"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMedicationListRequest,
  importMedicationsRequest,
} from "@/features/pharmacy/slice";
import type { RootState } from "@/store/store";
import { Button, DataTable, Panel, PageHeader } from "@/components/common";
import type { DataTableColumn } from "@/components/common";
import type { MedicationDto } from "@/features/pharmacy/types";

const columns: DataTableColumn<MedicationDto>[] = [
  { key: "medicationId", header: "약품ID", render: (row) => row.medicationId },
  { key: "medicationName", header: "제품명", render: (row) => row.medicationName },
  { key: "itemSeq", header: "품목기준코드", render: (row) => row.itemSeq ?? "-" },
  { key: "itemEngName", header: "제품영문명", render: (row) => row.itemEngName ?? "-" },
  { key: "entpName", header: "업체명", render: (row) => row.entpName ?? "-" },
  { key: "etcOtcName", header: "전문/일반", render: (row) => row.etcOtcName ?? "-" },
  { key: "classNo", header: "분류번호", render: (row) => row.classNo ?? "-" },
  { key: "className", header: "분류명", render: (row) => row.className ?? "-" },
  { key: "formCodeName", header: "제형", render: (row) => row.formCodeName ?? "-" },
  { key: "chart", header: "성상", render: (row) => row.chart ?? "-" },
  { key: "itemPermitDate", header: "허가일자", render: (row) => row.itemPermitDate ?? "-" },
  { key: "ediCode", header: "EDI코드", render: (row) => row.ediCode ?? "-" },
  { key: "stdCd", header: "표준코드", render: (row) => row.stdCd ?? "-" },
];

export default function MedicationList() {
  const dispatch = useDispatch();
  const medicationList = useSelector(
    (state: RootState) => state.pharmacy.medicationList
  );
  const loading = useSelector((state: RootState) => state.pharmacy.loading);
  const error = useSelector((state: RootState) => state.pharmacy.error);

  const importLoading = useSelector(
    (state: RootState) => state.pharmacy.importLoading
  );
  const importError = useSelector(
    (state: RootState) => state.pharmacy.importError
  );
  const importCount = useSelector(
    (state: RootState) => state.pharmacy.importCount
  );

  useEffect(() => {
    dispatch(fetchMedicationListRequest());
  }, [dispatch]);

  const handleImport = () => {
    dispatch(importMedicationsRequest());
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader title="약품 리스트 조회" description="등록된 약품 마스터 목록입니다." />

      <Panel className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-3">
          <Button type="button" onClick={handleImport} disabled={importLoading}>
            {importLoading ? "가져오는 중..." : "공공API에서 가져오기"}
          </Button>
          {importCount !== null && !importError && (
            <span className="text-sm text-emerald-600">
              {importCount}건 저장했습니다.
            </span>
          )}
          {importError && (
            <span className="text-sm text-rose-500">{importError}</span>
          )}
        </div>
      </Panel>

      <Panel className="min-h-0 flex-1 p-4">
        <DataTable
          columns={columns}
          rows={medicationList}
          rowKey={(row) => row.medicationId}
          loading={loading}
          emptyMessage={error ?? "등록된 약품이 없습니다."}
        />
      </Panel>
    </div>
  );
}
