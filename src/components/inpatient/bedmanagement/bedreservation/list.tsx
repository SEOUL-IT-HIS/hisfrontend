"use client";

import { useEffect , useMemo, useState } from "react";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch , RootState } from "@/store/store";
import {
  fetchBedReservationsRequest,
  selectBedReservations,
  selectBedReservationListStatus,
} from "@/features/inpatient/bedmanagement/bedreservation/slice";
import Link from "next/link";
import BedReservationDetail from "@/components/inpatient/bedmanagement/bedreservation/detail";

const STATUS_BADGE: Record<string, string> = {
  REQUESTED: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  RESERVED: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  RELEASED: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
};

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Pending",
  RESERVED: "Reserved",
  RELEASED: "Released",
};

type BedReservationListProps = {
  /** 병상관리 홈 탭 안에 끼워 넣을 때 true — 자체 제목/여백을 생략 */
  embedded?: boolean;
};

const BedReservationList = ({ embedded = false }: BedReservationListProps = {}) => {
  const dispatch = useDispatch<AppDispatch>();
  const bedReservations = useSelector(selectBedReservations);
  const listStatus = useSelector(selectBedReservationListStatus);
  const patients = useSelector((state: RootState) => state.patient.patients);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const patientNameById = useMemo(() => {
    return new Map(patients.map((patient) => [patient.patientId, patient.patientName]));
  }, [patients]);

  useEffect(() => {
    dispatch(fetchBedReservationsRequest());
    dispatch(fetchPatientListRequest({}));
  }, [dispatch]);

  return (
    <div className={embedded ? "w-full" : "mx-auto w-full max-w-[1800px] p-6"}>
      <div className="mb-6 flex items-center justify-between">
        {embedded ? (
          <div />
        ) : (
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Bed Reservation List</h1>
            <p className="mt-1 text-sm text-slate-500">Current status of registered bed reservations.</p>
          </div>
        )}
        <Link
          href="/inpatient/bedmanagement/bedreservation/create"
          className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Register Reservation
        </Link>
      </div>

      {listStatus.loading && <p className="text-sm text-slate-500">Loading...</p>}
      {listStatus.error && <p className="text-sm text-red-600">{listStatus.error}</p>}

      {!listStatus.loading && !listStatus.error && (
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="whitespace-nowrap px-4 py-3">Patient Name</th>
                  <th className="whitespace-nowrap px-4 py-3">Reservation ID</th>
                  <th className="whitespace-nowrap px-4 py-3">Bed ID</th>
                  <th className="whitespace-nowrap px-4 py-3">Patient ID</th>
                  <th className="whitespace-nowrap px-4 py-3">Reserved At</th>
                  <th className="whitespace-nowrap px-4 py-3">Expected Admission At</th>
                  <th className="whitespace-nowrap px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bedReservations.map((bedReservation) => (
                  <tr
                    key={bedReservation.bedReservationId}
                    onClick={() => setSelectedId(bedReservation.bedReservationId)}
                    className={`cursor-pointer hover:bg-slate-50 ${
                      selectedId === bedReservation.bedReservationId ? "bg-sky-50" : ""
                    }`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-slate-800">
                      {bedReservation.patientId
                        ? (patientNameById.get(bedReservation.patientId) ?? "Loading...")
                        : "None"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-sky-700">
                      {bedReservation.bedReservationId}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{bedReservation.bedId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{bedReservation.patientId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{bedReservation.reserveAt}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{bedReservation.expectedAdmissionAt}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                          STATUS_BADGE[bedReservation.reservationStatusCd] ?? "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                        }`}
                      >
                        {STATUS_LABEL[bedReservation.reservationStatusCd] ?? bedReservation.reservationStatusCd}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bedReservations.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-500">No reservation data available.</p>
            )}
          </div>

          {selectedId !== null && (
            <div className="w-[420px] shrink-0">
              <BedReservationDetail bedReservationId={selectedId} onClose={() => setSelectedId(null)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BedReservationList;
