"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  fetchPrescriptionsRequest,
  selectPrescriptions,
  selectPrescriptionListStatus,
} from "@/features/inpatient/medicationmanagement/prescription/slice";
import { useDoctorOptions } from "@/features/inpatient/admissiondischarge/useDoctorOptions";
import { Alert, Button, DataTable, type DataTableColumn } from "@/components/common";
import Toolbar from "@/components/inpatient/common/Toolbar";
import type { PrescriptionDTO } from "@/features/inpatient/medicationmanagement/types";

type PrescriptionListProps = {
  admissionId: string;
  /** 지금 선택된(상세가 열린) 처방 — 해당 행을 강조 표시 */
  selectedPrescriptionId?: string | null;
  onSelectPrescription?: (prescriptionId: string) => void;
  onRegisterClick?: () => void;
};

const PrescriptionList = ({ admissionId, selectedPrescriptionId, onSelectPrescription, onRegisterClick }: PrescriptionListProps) => {
  // 처방의사 ID(empId) → 의사 이름
  const { nameById: doctorNameById } = useDoctorOptions();
  const dispatch = useDispatch<AppDispatch>();
  const prescriptions = useSelector(selectPrescriptions);
  const listStatus = useSelector(selectPrescriptionListStatus);

  useEffect(() => {
    if (!admissionId) return;
    dispatch(fetchPrescriptionsRequest(admissionId));
  }, [dispatch, admissionId]);

  const columns: DataTableColumn<PrescriptionDTO>[] = [
    { key: "serviceType", header: "Service Type", render: (p) => <span className="font-medium text-slate-800">{p.serviceType}</span> },
    { key: "status", header: "Status", render: (p) => p.status },
    { key: "itemCount", header: "Item Count", render: (p) => p.items?.length ?? 0 },
    { key: "prescribedAt", header: "Prescribed At", render: (p) => (p.prescribedAt ? new Date(p.prescribedAt).toLocaleString() : "-") },
    { key: "prescribedBy", header: "Prescribed By", render: (p) => (p.prescribedBy ? doctorNameById.get(p.prescribedBy) ?? p.prescribedBy : "-") },
  ];

  return (
    <div className="flex w-full flex-col gap-3">
      <Toolbar actions={onRegisterClick && <Button onClick={onRegisterClick}>New Request</Button>}>
        <h2 className="text-sm font-semibold text-slate-800">Prescription Requests</h2>
      </Toolbar>

      {listStatus.error ? (
        <Alert>{listStatus.error}</Alert>
      ) : (
        <DataTable
          columns={columns}
          rows={prescriptions}
          rowKey={(p) => p.prescriptionId}
          onRowClick={(p) => onSelectPrescription?.(p.prescriptionId)}
          isRowActive={(p) => p.prescriptionId === selectedPrescriptionId}
          loading={listStatus.loading}
          loadingMessage="Loading..."
          emptyMessage="No prescription requests for this admission."
          minWidthClassName="min-w-[560px]"
        />
      )}
    </div>
  );
};

export default PrescriptionList;
