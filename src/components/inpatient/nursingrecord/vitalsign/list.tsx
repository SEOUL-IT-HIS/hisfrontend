"use client";

import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import { fetchVitalSignsRequest, selectVitalSignListStatus, selectVitalSigns } from "@/features/inpatient/nursingrecord/vitalsign/slice";
import Link from "next/link";
import { fetchAdmissionsRequest, selectAdmissions } from "@/features/inpatient/admissiondischarge/slice";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";

type VitalSignListProps = {
  /** 간호기록관리 홈 탭 안에 끼워 넣을 때 true — 자체 제목/여백을 생략 */
  embedded?: boolean;
  /** 간호기록 홈에서 선택한 입원 건 — 있으면 그 입원 건 기록만 보여주고, 없으면(단독 목록 페이지) 전체 */
  admissionId?: string | null;
};

const VitalSignList = ({ embedded = false, admissionId = null }: VitalSignListProps = {}) => {
  const dispatch = useDispatch<AppDispatch>();
  const vitalSigns = useSelector(selectVitalSigns);
  const listStatus = useSelector(selectVitalSignListStatus);
  const admissions = useSelector(selectAdmissions);
  const patients = useSelector((state: RootState) => state.patient.patients);

  const patientIdByAdmissionId = useMemo(() => {
    return new Map(admissions.map((admission) => [admission.admissionId, admission.patientId]));
  }, [admissions]);

  const patientNameById = useMemo(() => {
    return new Map(patients.map((patient) => [patient.patientId, patient.patientName]));
  }, [patients]);

  // 지금은 백엔드가 전체 목록만 주므로 프론트에서 admissionId로 걸러냄 (백엔드에 입원 건별 조회 API가 생기면 이 filter는 제거)
  const visibleVitalSigns = useMemo(
    () => (admissionId ? vitalSigns.filter((vitalSign) => vitalSign.admissionId === admissionId) : vitalSigns),
    [vitalSigns, admissionId],
  );

  useEffect(() => {
    dispatch(fetchVitalSignsRequest());
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
            <h1 className="text-lg font-semibold text-slate-800">Vital Signs List</h1>
            <p className="mt-1 text-sm text-slate-500">Vital sign measurement records by patient.</p>
          </div>
        )}
        <Link
          href={`/inpatient/nursingrecord/vitalsign/create${admissionId ? `?admissionId=${admissionId}` : ""}`}
          className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Register Vital Signs
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
                <th className="whitespace-nowrap px-4 py-3">Measured At</th>
                <th className="whitespace-nowrap px-4 py-3">Temperature</th>
                <th className="whitespace-nowrap px-4 py-3">Pulse</th>
                <th className="whitespace-nowrap px-4 py-3">Respiration Rate</th>
                <th className="whitespace-nowrap px-4 py-3">Blood Pressure</th>
                <th className="whitespace-nowrap px-4 py-3">SpO2</th>
                <th className="whitespace-nowrap px-4 py-3">Recorded By</th>
                <th className="whitespace-nowrap px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleVitalSigns.map((vitalSign) => {
                const patientId = patientIdByAdmissionId.get(vitalSign.admissionId);
                const patientName = patientId ? (patientNameById.get(patientId) ?? "Loading...") : "None";
                return (
                  <tr key={vitalSign.vitalSignId} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-800">{patientName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{new Date(vitalSign.measuredAt).toLocaleString()}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{vitalSign.temperature}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{vitalSign.pulse}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{vitalSign.respiration}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{vitalSign.bpSystolic}/{vitalSign.bpDiastolic}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{vitalSign.spo2}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{vitalSign.recorderId}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">
                      <Link href={`/inpatient/nursingrecord/vitalsign/${vitalSign.vitalSignId}`} className="text-sky-700 hover:underline">
                        {vitalSign.vitalSignId}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visibleVitalSigns.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-500">No vital signs data available.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default VitalSignList;
