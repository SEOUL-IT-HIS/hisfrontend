"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "next/navigation";
import { fetchPrescriptionDetailRequest } from "@/features/pharmacy/slice";
import type { RootState } from "@/store/store";
import { DataTable, PageHeader, Panel } from "@/components/common";
import type { DataTableColumn } from "@/components/common";
import type { PrescriptionItem } from "@/features/pharmacy/types";
import { usePatientNames } from "@/features/labimaging/common/hooks/usePatientNames";
import { useEmpNames } from "@/features/emp/hooks/useEmpNames";
import { useDepartmentNames } from "@/features/commonCode/hooks/useDepartmentNames";

const itemColumns: DataTableColumn<PrescriptionItem>[] = [
  { key: "medicationId", header: "Medication ID", render: (row) => row.medicationId },
  { key: "dosageQty", header: "Dosage", render: (row) => row.dosageQty },
  { key: "dosageFormCd", header: "Dosage Form Code", render: (row) => row.dosageFormCd },
];

export default function PrescriptionDetail() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const detail = useSelector((state: RootState) => state.pharmacy.prescriptionDetail);
  const loading = useSelector(
    (state: RootState) => state.pharmacy.prescriptionDetailLoading
  );
  const error = useSelector(
    (state: RootState) => state.pharmacy.prescriptionDetailError
  );

  useEffect(() => {
    if (!id) return;
    dispatch(fetchPrescriptionDetailRequest(id));
  }, [id, dispatch]);

  // 목록 화면과 동일하게, ID는 표시하지 않고 이름으로만 보여준다.
  const { names: patientNames } = usePatientNames(detail ? [detail.patientId] : []);
  const { names: empNames } = useEmpNames();
  const { names: departmentNames } = useDepartmentNames();

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader title="Prescription Details" description="Details of a prescription forwarded to pharmacy." />

      {loading && <p className="text-sm text-slate-400">Loading...</p>}
      {error && <p className="text-sm text-rose-500">{error}</p>}

      {!loading && detail && (
        <>
          <Panel className="p-5">
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-slate-400">Patient</dt>
                <dd className="text-slate-700">
                  {patientNames[detail.patientId] ?? detail.patientId}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Doctor</dt>
                <dd className="text-slate-700">
                  {empNames[detail.physicianId] ?? detail.physicianId}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Department</dt>
                <dd className="text-slate-700">
                  {departmentNames[detail.departmentId] ?? detail.departmentId}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Created At</dt>
                <dd className="text-slate-700">{detail.createdAt}</dd>
              </div>
            </dl>
          </Panel>

          <Panel className="min-h-0 flex-1 p-4">
            <DataTable
              columns={itemColumns}
              rows={detail.items}
              rowKey={(row) => row.prescriptionItemLinkId}
              emptyMessage="No prescription items."
            />
          </Panel>
        </>
      )}
    </div>
  );
}
