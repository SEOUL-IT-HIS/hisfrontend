"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMedicationListRequest,
  importMedicationsRequest,
} from "@/features/pharmacy/slice";
import type { RootState } from "@/store/store";
import { Button, DataTable, Modal, Panel, PageHeader } from "@/components/common";
import type { DataTableColumn } from "@/components/common";
import type { MedicationDto } from "@/features/pharmacy/types";

/** admin 공통코드 DOSAGE_FORM_CD 라벨 — 코드값만 보여주면 알아보기 어려워 표시용으로만 둔다 */
const DOSAGE_FORM_LABELS: Record<string, string> = {
  "01": "Tablet/Capsule",
  "02": "IV Fluid",
  "03": "Injection",
};

function dosageFormLabel(code: string | null): string {
  return code ? DOSAGE_FORM_LABELS[code] ?? code : "-";
}

// 목록에는 핵심 4개만 보여주고(한 화면에 다 들어오게), 나머지 부가 정보는 행을 눌렀을 때 뜨는 모달에서 본다.
const columns: DataTableColumn<MedicationDto>[] = [
  {
    key: "medicationName",
    header: "Product Name",
    render: (row) => <span className="text-sky-700">{row.medicationName}</span>,
  },
  { key: "entpName", header: "Company", render: (row) => row.entpName ?? "-" },
  {
    key: "dosageFormCd",
    header: "Dosage Form Category",
    render: (row) => dosageFormLabel(row.dosageFormCd),
  },
  { key: "ediCode", header: "EDI Code", render: (row) => row.ediCode ?? "-" },
];

type DetailRow = { label: string; value: string };

function detailRows(medication: MedicationDto): DetailRow[] {
  return [
    { label: "Medication ID", value: String(medication.medicationId) },
    { label: "Product Name", value: medication.medicationName },
    { label: "Product Eng. Name", value: medication.itemEngName ?? "-" },
    { label: "Item Seq", value: medication.itemSeq ?? "-" },
    { label: "Company", value: medication.entpName ?? "-" },
    { label: "Rx/OTC", value: medication.etcOtcName ?? "-" },
    { label: "Class No.", value: medication.classNo ?? "-" },
    { label: "Class Name", value: medication.className ?? "-" },
    { label: "Dosage Form Category", value: dosageFormLabel(medication.dosageFormCd) },
    { label: "Form (detail)", value: medication.formCodeName ?? "-" },
    { label: "Appearance", value: medication.chart ?? "-" },
    { label: "Permit Date", value: medication.itemPermitDate ?? "-" },
    { label: "EDI Code", value: medication.ediCode ?? "-" },
    { label: "Standard Code", value: medication.stdCd ?? "-" },
  ];
}

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

  const [selected, setSelected] = useState<MedicationDto | null>(null);

  useEffect(() => {
    dispatch(fetchMedicationListRequest());
  }, [dispatch]);

  const handleImport = () => {
    dispatch(importMedicationsRequest());
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        title="Medication List"
        description="Registered medication master list. Click a medication to see its details."
      />

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
          minWidthClassName="min-w-[520px]"
          onRowClick={(row) => setSelected(row)}
        />
      </Panel>

      <Modal
        open={selected !== null}
        title={selected?.medicationName ?? "Medication Details"}
        onClose={() => setSelected(null)}
        maxWidthClassName="max-w-2xl"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setSelected(null)}>
              Close
            </Button>
            {/* 재고가 한 번도 없는 새 약품은 재고/이력 목록에 안 나와서, 첫 입고를 하려면 여기서 워크스페이스로 들어가야 한다. */}
            {selected && (
              <Link
                href={`/pharmacy/medication/${selected.medicationId}`}
                className="inline-flex h-10 items-center rounded-xl bg-sky-600 px-4 text-sm font-medium text-white transition-colors hover:bg-sky-700"
              >
                Open Workspace
              </Link>
            )}
          </>
        }
      >
        {selected && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {detailRows(selected).map((row) => (
              <div key={row.label}>
                <dt className="text-xs text-slate-400">{row.label}</dt>
                <dd className="break-words text-slate-700">{row.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>
    </div>
  );
}
