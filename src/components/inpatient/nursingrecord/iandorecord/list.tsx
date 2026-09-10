"use client";

import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import Link from "next/link";
import { fetchAdmissionsRequest, selectAdmissions } from "@/features/inpatient/admissiondischarge/slice";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";
import { fetchIandORecordsRequest, selectIandORecords, selectIandORecordListStatus } from "@/features/inpatient/nursingrecord/iandorecord/slice";

type IandORecordListProps = {
  /** 간호기록관리 홈 탭 안에 끼워 넣을 때 true — 자체 제목/여백을 생략 */
  embedded?: boolean;
};

const IandORecordList = ({ embedded = false }: IandORecordListProps = {}) => {
  const dispatch = useDispatch<AppDispatch>();
  const iandorecords = useSelector(selectIandORecords);
  const listStatus = useSelector(selectIandORecordListStatus);
  const admissions = useSelector(selectAdmissions);
  const patients = useSelector((state: RootState) => state.patient.patients);

  const patientIdByAdmissionId = useMemo(() => {
    return new Map(admissions.map((admission) => [admission.admissionId, admission.patientId]));
  }, [admissions]);

  const patientNameById = useMemo(() => {
    return new Map(patients.map((patient) => [patient.patientId, patient.patientName]));
  }, [patients]);

  useEffect(() => {
    dispatch(fetchIandORecordsRequest());
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
            <h1 className="text-lg font-semibold text-slate-800">Patient I&O Record List</h1>
            <p className="mt-1 text-sm text-slate-500">Intake/output records by patient.</p>
          </div>
        )}
        <Link
          href="/inpatient/nursingrecord/iandorecord/create"
          className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Register I&O Record
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
                <th className="whitespace-nowrap px-4 py-3">Intake/Output ID</th>
                <th className="whitespace-nowrap px-4 py-3">Admission ID</th>
                <th className="whitespace-nowrap px-4 py-3">Recorded At</th>
                <th className="whitespace-nowrap px-4 py-3">I/O Type Code</th>
                <th className="whitespace-nowrap px-4 py-3">Route Code</th>
                <th className="whitespace-nowrap px-4 py-3">Amount (mL)</th>
                <th className="whitespace-nowrap px-4 py-3">Recorder ID</th>
                <th className="whitespace-nowrap px-4 py-3">Created At</th>
                <th className="whitespace-nowrap px-4 py-3">Updated At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {iandorecords.map((iandorecord) => {
                const patientId = patientIdByAdmissionId.get(iandorecord.admissionId);
                const patientName = patientId ? (patientNameById.get(patientId) ?? "Loading...") : "None";
                return (
                  <tr key={iandorecord.intakeOutputId} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-800">{patientName}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">
                      <Link
                        href={`/inpatient/nursingrecord/iandorecord/${iandorecord.intakeOutputId}`}
                        className="text-sky-700 hover:underline"
                      >
                        {iandorecord.intakeOutputId}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{iandorecord.admissionId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{new Date(iandorecord.recordedAt).toLocaleString()}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{iandorecord.ioTypeCd}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{iandorecord.routeCd}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{iandorecord.amountMl}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{iandorecord.recorderId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{new Date(iandorecord.createdAt).toLocaleString()}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{new Date(iandorecord.updatedAt).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {iandorecords.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-500">No I&O record data available.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default IandORecordList;
