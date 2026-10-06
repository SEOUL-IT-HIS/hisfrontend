"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import {
  fetchMedicationListRequest,
  importMedicationsRequest,
} from "@/features/pharmacy/slice";
import type { RootState } from "@/store/store";
import { Button, DataTable, Panel, PageHeader } from "@/components/common";
import type { DataTableColumn } from "@/components/common";
import type { MedicationDto } from "@/features/pharmacy/types";

/** admin 공통코드 DOSAGE_FORM_CD 라벨 — 코드값만 보여주면 알아보기 어려워 표시용으로만 둔다 */
const DOSAGE_FORM_LABELS: Record<string, string> = {
  "01": "Tablet/Capsule",
  "02": "IV Fluid",
  "03": "Injection",
};

const columns: DataTableColumn<MedicationDto>[] = [
  { key: "medicationId", header: "Medication ID", render: (row) => row.medicationId },
  {
    key: "medicationName",
    header: "Product Name",
    render: (row) => (
      <Link href={`/pharmacy/medication/${row.medicationId}`} className="text-sky-700 underline">
        {row.medicationName}
      </Link>
    ),
  },
  { key: "itemSeq", header: "Item Seq", render: (row) => row.itemSeq ?? "-" },
  { key: "itemEngName", header: "Product Eng. Name", render: (row) => row.itemEngName ?? "-" },
  { key: "entpName", header: "Company", render: (row) => row.entpName ?? "-" },
  { key: "etcOtcName", header: "Rx/OTC", render: (row) => row.etcOtcName ?? "-" },
  { key: "classNo", header: "Class No.", render: (row) => row.classNo ?? "-" },
  { key: "className", header: "Class Name", render: (row) => row.className ?? "-" },
  { key: "formCodeName", header: "Form (detail)", render: (row) => row.formCodeName ?? "-" },
  {
    key: "dosageFormCd",
    header: "Dosage Form Category",
    render: (row) =>
      row.dosageFormCd ? DOSAGE_FORM_LABELS[row.dosageFormCd] ?? row.dosageFormCd : "-",
  },
  { key: "chart", header: "Appearance", render: (row) => row.chart ?? "-" },
  { key: "itemPermitDate", header: "Permit Date", render: (row) => row.itemPermitDate ?? "-" },
  { key: "ediCode", header: "EDI Code", render: (row) => row.ediCode ?? "-" },
  { key: "stdCd", header: "Standard Code", render: (row) => row.stdCd ?? "-" },
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
      <PageHeader title="Medication List" description="Registered medication master list." />

      <Panel className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-3">
          <Button type="button" onClick={handleImport} disabled={importLoading}>
            {importLoading ? "Importing..." : "Import from Public API"}
          </Button>
          {importCount !== null && !importError && (
            <span className="text-sm text-emerald-600">
              Saved {importCount} record(s).
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
          loadingMessage="Loading..."
          emptyMessage={error ?? "No medications registered."}
        />
      </Panel>
    </div>
  );
}
