"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import {
  fetchAdmissionsRequest,
  selectAdmissions,
  selectAdmissionListStatus,
} from "@/features/inpatient/admissiondischarge/slice";
import { fetchBedAssignmentsRequest, selectBedAssignments } from "@/features/inpatient/bedmanagement/bedassignment/slice";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";
import AdmissionDetail from "@/components/inpatient/admissiondischarge/admission/detail";
import Link from "next/link";

const STATUS_BADGE: Record<string, string> = {
  REQUESTED: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200",
  ADMITTED: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  DISCHARGE_REQUESTED: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  DISCHARGED: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
};

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "요청됨",
  ADMITTED: "입원중",
  DISCHARGE_REQUESTED: "퇴원 신청",
  DISCHARGED: "퇴원 완료",
};

const AdmissionList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const admissions = useSelector(selectAdmissions);
  const listStatus = useSelector(selectAdmissionListStatus);
  const bedAssignments = useSelector(selectBedAssignments);
  const patients = useSelector((state: RootState) => state.patient.patients);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const patientNameById = useMemo(
    () => new Map(patients.map((patient) => [patient.patientId, patient.patientName])),
    [patients],
  );

  useEffect(() => {
    dispatch(fetchAdmissionsRequest());
    dispatch(fetchBedAssignmentsRequest());
    dispatch(fetchPatientListRequest({}));
  }, [dispatch]);

  const isBedAssigned = (admissionId: string) =>
    bedAssignments.some((ba) => ba.admissionId === admissionId && ba.releasedAt === null);

  return (
    <div className="mx-auto w-full max-w-[1800px] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">입원 목록</h1>
          <p className="mt-1 text-sm text-slate-500">입원 접수된 환자 목록입니다.</p>
        </div>
        <Link
          href="/inpatient/admissiondischarge/admission/create"
          className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          입원 요청 등록
        </Link>
      </div>

      {listStatus.loading && <p className="text-sm text-slate-500">로딩중...</p>}
      {listStatus.error && <p className="text-sm text-red-600">{listStatus.error}</p>}

      {!listStatus.loading && !listStatus.error && (
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="whitespace-nowrap px-4 py-3">입원ID</th>
                  <th className="whitespace-nowrap px-4 py-3">환자명</th>
                  <th className="whitespace-nowrap px-4 py-3">입원과ID</th>
                  <th className="whitespace-nowrap px-4 py-3">입원경로</th>
                  <th className="whitespace-nowrap px-4 py-3">입원날짜</th>
                  <th className="whitespace-nowrap px-4 py-3">환자ID</th>
                  <th className="whitespace-nowrap px-4 py-3">의사ID</th>
                  <th className="whitespace-nowrap px-4 py-3">상태</th>
                  <th className="whitespace-nowrap px-4 py-3">병상배정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admissions.map((admission) => (
                  <tr
                    key={admission.admissionId}
                    onClick={() => setSelectedId(admission.admissionId)}
                    className={`cursor-pointer hover:bg-slate-50 ${
                      selectedId === admission.admissionId ? "bg-sky-50" : ""
                    }`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-sky-700">{admission.admissionId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-800">
                      {patientNameById.get(admission.patientId) ?? "조회중..."}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{admission.admissionDeptId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{admission.admissionRoute}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{admission.admissionDate}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{admission.patientId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{admission.doctorId}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                          STATUS_BADGE[admission.status] ?? "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                        }`}
                      >
                        {STATUS_LABEL[admission.status] ?? admission.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {isBedAssigned(admission.admissionId) ? (
                        <span className="inline-flex items-center whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                          배정완료
                        </span>
                      ) : (
                        <span className="inline-flex items-center whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
                          미배정
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {admissions.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-500">입원 데이터가 없습니다.</p>
            )}
          </div>

          {selectedId && (
            <div className="w-[420px] shrink-0">
              <AdmissionDetail admissionId={selectedId} onClose={() => setSelectedId(null)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdmissionList;
