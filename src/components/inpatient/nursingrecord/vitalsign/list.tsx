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
};

const VitalSignList = ({ embedded = false }: VitalSignListProps = {}) => {
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
            <h1 className="text-lg font-semibold text-slate-800">활력징후 목록</h1>
            <p className="mt-1 text-sm text-slate-500">환자별 활력징후 측정 기록입니다.</p>
          </div>
        )}
        <Link
          href="/inpatient/nursingrecord/vitalsign/create"
          className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          활력징후 등록
        </Link>
      </div>

      {listStatus.loading && <p className="text-sm text-slate-500">로딩중...</p>}
      {listStatus.error && <p className="text-sm text-red-600">{listStatus.error}</p>}

      {!listStatus.loading && !listStatus.error && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="whitespace-nowrap px-4 py-3">환자명</th>
                <th className="whitespace-nowrap px-4 py-3">측정일시</th>
                <th className="whitespace-nowrap px-4 py-3">체온</th>
                <th className="whitespace-nowrap px-4 py-3">맥박</th>
                <th className="whitespace-nowrap px-4 py-3">호흡수</th>
                <th className="whitespace-nowrap px-4 py-3">혈압</th>
                <th className="whitespace-nowrap px-4 py-3">산소포화도</th>
                <th className="whitespace-nowrap px-4 py-3">측정자</th>
                <th className="whitespace-nowrap px-4 py-3">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vitalSigns.map((vitalSign) => {
                const patientId = patientIdByAdmissionId.get(vitalSign.admissionId);
                const patientName = patientId ? (patientNameById.get(patientId) ?? "조회중...") : "없음";
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
          {vitalSigns.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-500">활력징후 데이터가 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default VitalSignList;
