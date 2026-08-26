"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch,RootState } from "@/store/store";
import {
  fetchBedAssignmentsRequest,
  selectBedAssignments,
  selectBedAssignmentListStatus,
} from "@/features/inpatient/bedmanagement/bedassignment/slice";
import { fetchAdmissionsRequest, selectAdmissions } from "@/features/inpatient/admissiondischarge/slice";
import Link from "next/link";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";
import BedAssignmentDetail from "@/components/inpatient/bedmanagement/bedassignment/detail";

const BedAssignmentList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const bedAssignments = useSelector(selectBedAssignments);
  const listStatus = useSelector(selectBedAssignmentListStatus);
  const admissions = useSelector(selectAdmissions);
  const patients = useSelector((state: RootState) => state.patient.patients);
  const [selectedId, setSelectedId] = useState<number | null>(null);

// 1단계: admissionId → patientId
const patientIdByAdmissionId = useMemo(
  () => new Map(admissions.map((a) => [a.admissionId, a.patientId])),
  [admissions],
);

// 2단계: patientId → patientName
const patientNameById = useMemo(
  () => new Map(patients.map((p) => [p.patientId, p.patientName])),
  [patients],
);

  useEffect(() => {
    dispatch(fetchBedAssignmentsRequest());
    dispatch(fetchAdmissionsRequest());
    dispatch(fetchPatientListRequest({}));
  }, [dispatch]);

  return (
    <div className="mx-auto w-full max-w-[1800px] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">병상 배정 목록</h1>
          <p className="mt-1 text-sm text-slate-500">현재까지의 병상 배정/퇴상 기록입니다.</p>
        </div>
        <Link
          href="/inpatient/bedmanagement/bedassignment/create"
          className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          배정 등록
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
                  <th className="whitespace-nowrap px-4 py-3">환자명</th>
                  <th className="whitespace-nowrap px-4 py-3">배정ID</th>
                  <th className="whitespace-nowrap px-4 py-3">병상ID</th>
                  <th className="whitespace-nowrap px-4 py-3">입원ID</th>
                  <th className="whitespace-nowrap px-4 py-3">배정시각</th>
                  <th className="whitespace-nowrap px-4 py-3">퇴상시각</th>
                  <th className="whitespace-nowrap px-4 py-3">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bedAssignments.map((bedAssignment) => {
                  const isActive = bedAssignment.releasedAt === null;
                  return (
                    <tr
                      key={bedAssignment.assignmentId}
                      onClick={() => setSelectedId(bedAssignment.assignmentId)}
                      className={`cursor-pointer hover:bg-slate-50 ${
                        selectedId === bedAssignment.assignmentId ? "bg-sky-50" : ""
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-slate-800">
                        {patientNameById.get(patientIdByAdmissionId.get(bedAssignment.admissionId) ?? "") ?? "Unknown"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-sky-700">
                        {bedAssignment.assignmentId}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{bedAssignment.bedId}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{bedAssignment.admissionId}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{bedAssignment.assignedAt}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{bedAssignment.releasedAt ?? "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                            isActive
                              ? "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200"
                              : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                          }`}
                        >
                          {isActive ? "배정중" : "퇴상완료"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {bedAssignments.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-500">배정 데이터가 없습니다.</p>
            )}
          </div>

          {selectedId !== null && (
            <div className="w-[420px] shrink-0">
              <BedAssignmentDetail assignmentId={selectedId} onClose={() => setSelectedId(null)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BedAssignmentList;
