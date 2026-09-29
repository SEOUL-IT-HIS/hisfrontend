"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  fetchPrescriptionDetailRequest,
  selectPrescriptionDetail,
  selectPrescriptionDetailStatus,
} from "@/features/inpatient/medicationmanagement/prescription/slice";

const INFO_ROW = "flex justify-between border-b border-slate-100 px-4 py-3 text-sm last:border-b-0";

type PrescriptionDetailProps = {
  prescriptionId: string;
};

const PrescriptionDetail = ({ prescriptionId }: PrescriptionDetailProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const prescription = useSelector(selectPrescriptionDetail);
  const { loading, error } = useSelector(selectPrescriptionDetailStatus);

  useEffect(() => {
    if (!prescriptionId) return;
    dispatch(fetchPrescriptionDetailRequest(prescriptionId));
  }, [dispatch, prescriptionId]);

  return (
    <div className="w-full">
      {loading && <p className="text-sm text-slate-500">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && prescription && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <span className="text-sm font-medium text-slate-800">Prescription Info</span>
            </div>
            <div>
              <div className={INFO_ROW}>
                <span className="text-slate-500">Prescription ID</span>
                <span className="text-slate-800">{prescription.prescriptionId}</span>
              </div>
              <div className={INFO_ROW}>
                <span className="text-slate-500">Service Type</span>
                <span className="text-slate-800">{prescription.serviceType}</span>
              </div>
              <div className={INFO_ROW}>
                <span className="text-slate-500">Status</span>
                <span className="text-slate-800">{prescription.status}</span>
              </div>
              <div className={INFO_ROW}>
                <span className="text-slate-500">Order Method</span>
                <span className="text-slate-800">{prescription.orderMethod}</span>
              </div>
              <div className={INFO_ROW}>
                <span className="text-slate-500">Priority Code</span>
                <span className="text-slate-800">{prescription.priorityCode}</span>
              </div>
              <div className={INFO_ROW}>
                <span className="text-slate-500">Timing Code</span>
                <span className="text-slate-800">{prescription.timingCode}</span>
              </div>
              <div className={INFO_ROW}>
                <span className="text-slate-500">Prescribed At</span>
                <span className="text-slate-800">
                  {prescription.prescribedAt ? new Date(prescription.prescribedAt).toLocaleString() : "-"}
                </span>
              </div>
              <div className={INFO_ROW}>
                <span className="text-slate-500">Prescribed By</span>
                <span className="text-slate-800">{prescription.prescribedBy}</span>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <span className="text-sm font-medium text-slate-800">Prescription Items</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="whitespace-nowrap px-4 py-3">Type</th>
                    <th className="whitespace-nowrap px-4 py-3">Code</th>
                    <th className="whitespace-nowrap px-4 py-3">Item Name</th>
                    <th className="whitespace-nowrap px-4 py-3">Dosage</th>
                    <th className="whitespace-nowrap px-4 py-3">Frequency</th>
                    <th className="whitespace-nowrap px-4 py-3">Duration Days</th>
                    <th className="whitespace-nowrap px-4 py-3">Send Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prescription.items?.map((item) => (
                    <tr key={item.itemId}>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.prescriptionType}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.itemCode}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.itemName}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.dosage}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.frequency}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.durationDays}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.sendStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!prescription.items || prescription.items.length === 0) && (
                <p className="px-4 py-6 text-center text-sm text-slate-500">No items available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionDetail;
