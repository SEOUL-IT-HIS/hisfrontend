"use client";

import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import Link from "next/link";
import { fetchAdmissionsRequest, selectAdmissions } from "@/features/inpatient/admissiondischarge/slice";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";
import { fetchRestraintsRequest, selectRestraints, selectRestraintListStatus } from "@/features/inpatient/nursingrecord/restraint/slice";

type RestraintListProps = {
  /** 간호기록관리 홈 탭 안에 끼워 넣을 때 true — 자체 제목/여백을 생략 */
  embedded?: boolean;
};

const RestraintList = ({ embedded = false }: RestraintListProps = {}) => {
  const dispatch = useDispatch<AppDispatch>();
  const restraints = useSelector(selectRestraints);
  const listStatus = useSelector(selectRestraintListStatus);
  const admissions = useSelector(selectAdmissions);
  const patients = useSelector((state: RootState) => state.patient.patients);

  const patientIdByAdmissionId = useMemo(() => {
    return new Map(admissions.map((admission) => [admission.admissionId, admission.patientId]));
  }, [admissions]);

  const patientNameById = useMemo(() => {
    return new Map(patients.map((patient) => [patient.patientId, patient.patientName]));
  }, [patients]);

  useEffect(() => {
    dispatch(fetchRestraintsRequest());
    dispatch(fetchAdmissionsRequest());
    dispatch(fetchPatientListRequest({}));
  }, [dispatch]);

  return (
    <div className={embedded ? "w-full" : "mx-auto w-full max-w-6xl p-6"}>
      <div className="mb-6 flex items-center justify-between">
        {embedded ? (
          <div />
        ) : (
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Patient Restraint List</h1>
            <p className="mt-1 text-sm text-slate-500">Restraint records by patient.</p>
          </div>
        )}
        <Link
          href="/inpatient/nursingrecord/restraint/create"
          className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Register Restraint
        </Link>
      </div>

      {listStatus.loading && <p className="text-sm text-slate-500">Loading...</p>}
      {listStatus.error && <p className="text-sm text-red-600">{listStatus.error}</p>}

      {!listStatus.loading && !listStatus.error && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="whitespace-nowrap px-4 py-3">Patient Name</th>
                <th className="whitespace-nowrap px-4 py-3">Restraint ID</th>
                <th className="whitespace-nowrap px-4 py-3">Admission ID</th>
                <th className="whitespace-nowrap px-4 py-3">Restraint Type Code</th>
                <th className="whitespace-nowrap px-4 py-3">Applied At</th>
                <th className="whitespace-nowrap px-4 py-3">Reason</th>
                <th className="whitespace-nowrap px-4 py-3">Doctor Order ID</th>
                <th className="whitespace-nowrap px-4 py-3">Evaluator ID</th>
                <th className="whitespace-nowrap px-4 py-3">Created At</th>
                <th className="whitespace-nowrap px-4 py-3">Updated At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {restraints.map((restraint) => {
                const patientId = patientIdByAdmissionId.get(restraint.admissionId);
                const patientName = patientId ? (patientNameById.get(patientId) ?? "Loading...") : "None";
                return (
                  <tr key={restraint.restraintId} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-800">{patientName}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">
                      <Link
                        href={`/inpatient/nursingrecord/restraint/${restraint.restraintId}`}
                        className="text-sky-700 hover:underline"
                      >
                        {restraint.restraintId}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{restraint.admissionId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{restraint.restraintTypeCd}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{new Date(restraint.appliedAt).toLocaleString()}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{restraint.reason}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{restraint.doctorOrderId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{restraint.evaluatorId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{new Date(restraint.createdAt).toLocaleString()}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{new Date(restraint.updatedAt).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {restraints.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-500">No restraint data available.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default RestraintList;
