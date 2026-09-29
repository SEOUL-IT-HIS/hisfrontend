"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  fetchPrescriptionsRequest,
  selectPrescriptions,
  selectPrescriptionListStatus,
} from "@/features/inpatient/medicationmanagement/prescription/slice";

type PrescriptionListProps = {
  admissionId: string;
  onSelectPrescription?: (prescriptionId: string) => void;
  onRegisterClick?: () => void;
};

const PrescriptionList = ({ admissionId, onSelectPrescription, onRegisterClick }: PrescriptionListProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const prescriptions = useSelector(selectPrescriptions);
  const listStatus = useSelector(selectPrescriptionListStatus);

  useEffect(() => {
    if (!admissionId) return;
    dispatch(fetchPrescriptionsRequest(admissionId));
  }, [dispatch, admissionId]);

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">Prescription List</h2>
        {onRegisterClick && (
          <button
            onClick={onRegisterClick}
            className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Register Prescription
          </button>
        )}
      </div>

      {listStatus.loading && <p className="text-sm text-slate-500">Loading...</p>}
      {listStatus.error && <p className="text-sm text-red-600">{listStatus.error}</p>}

      {!listStatus.loading && !listStatus.error && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="whitespace-nowrap px-4 py-3">Prescription ID</th>
                <th className="whitespace-nowrap px-4 py-3">Service Type</th>
                <th className="whitespace-nowrap px-4 py-3">Status</th>
                <th className="whitespace-nowrap px-4 py-3">Item Count</th>
                <th className="whitespace-nowrap px-4 py-3">Prescribed At</th>
                <th className="whitespace-nowrap px-4 py-3">Prescribed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prescriptions.map((prescription) => (
                <tr
                  key={prescription.prescriptionId}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => onSelectPrescription?.(prescription.prescriptionId)}
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-sky-700">{prescription.prescriptionId}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{prescription.serviceType}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{prescription.status}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{prescription.items?.length ?? 0}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {prescription.prescribedAt ? new Date(prescription.prescribedAt).toLocaleString() : "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{prescription.prescribedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {prescriptions.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-500">No prescription data available.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PrescriptionList;
