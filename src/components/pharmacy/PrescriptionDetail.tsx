"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "next/navigation";
import { fetchPrescriptionDetailRequest } from "@/features/pharmacy/slice";
import type { RootState } from "@/store/store";
import { DataTable, PageHeader, Panel } from "@/components/common";
import type { DataTableColumn } from "@/components/common";
import type { PrescriptionItem } from "@/features/pharmacy/types";

const itemColumns: DataTableColumn<PrescriptionItem>[] = [
  { key: "medicationId", header: "약품ID", render: (row) => row.medicationId },
  { key: "dosageQty", header: "용량", render: (row) => row.dosageQty },
  { key: "dosageFormCd", header: "제형코드", render: (row) => row.dosageFormCd },
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

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader title="처방전 상세조회" description={`처방전링크ID: ${id}`} />

      {loading && <p className="text-sm text-slate-400">로딩 중...</p>}
      {error && <p className="text-sm text-rose-500">{error}</p>}

      {!loading && detail && (
        <>
          <Panel className="p-5">
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-slate-400">처방전ID</dt>
                <dd className="text-slate-700">{detail.prescriptionId}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">환자ID</dt>
                <dd className="text-slate-700">{detail.patientId}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">의사ID</dt>
                <dd className="text-slate-700">{detail.physicianId}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">진료과ID</dt>
                <dd className="text-slate-700">{detail.departmentId}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">등록일시</dt>
                <dd className="text-slate-700">{detail.createdAt}</dd>
              </div>
            </dl>
          </Panel>

          <Panel className="min-h-0 flex-1 p-4">
            <DataTable
              columns={itemColumns}
              rows={detail.items}
              rowKey={(row) => row.prescriptionItemLinkId}
              emptyMessage="처방 항목이 없습니다."
            />
          </Panel>
        </>
      )}
    </div>
  );
}
