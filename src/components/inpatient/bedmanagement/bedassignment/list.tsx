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
import { useSearchParams } from "next/navigation";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";
import BedAssignmentDetail from "@/components/inpatient/bedmanagement/bedassignment/detail";

type BedAssignmentListProps = {
  /** 병상관리 홈 탭 안에 끼워 넣을 때 true — 자체 제목/여백을 생략 */
  embedded?: boolean;
};

const BedAssignmentList = ({ embedded = false }: BedAssignmentListProps = {}) => {
  const dispatch = useDispatch<AppDispatch>();
  const bedAssignments = useSelector(selectBedAssignments);
  const listStatus = useSelector(selectBedAssignmentListStatus);
  const admissions = useSelector(selectAdmissions);
  const patients = useSelector((state: RootState) => state.patient.patients);
  const searchParams = useSearchParams();
  const highlightParam = searchParams.get("highlight");
  const [selectedId, setSelectedId] = useState<number | null>(
  highlightParam ? Number(highlightParam) : null
  );

  
// 1단계: admissionId → patientId
// BED_ASSIGNMENT와 ADMISSION은 같은 DB(inpatient-service)에 있는 테이블이라,
// 백엔드에서 SQL(MyBatis든 JPA의 @Query JOIN이든) 한 번으로 합쳐서 patientId까지
// 내려줄 수 있음 — 즉 이 1단계 Map과 admissions fetch는 백엔드가 JOIN해주면 없앨 수 있음.
// 지금은 BedAssignmentServiceImpl이 JpaRepository.findAll()만 쓰고 JOIN 쿼리를
// 직접 짜지 않아서(=단순 JPA 방식), 프론트가 admissionId → patientId를 대신 이어붙이는 것.
const patientIdByAdmissionId = useMemo(
  () => new Map(admissions.map((a) => [a.admissionId, a.patientId])),
  [admissions],
);  

// 2단계: patientId → patientName
// PATIENT는 다른 서비스(patient-service)의 별도 DB에 있어서, 이건 MyBatis로 바꿔도
// SQL JOIN으로는 절대 못 합침 — 백엔드가 patient-service를 HTTP로 호출해서
// 미리 합쳐주지 않는 한, 프론트가 따로 fetch해서 이어붙이는 이 방식이 유일한 방법.
const patientNameById = useMemo(
  () => new Map(patients.map((p) => [p.patientId, p.patientName])),
  [patients],
);

  // 지금 구조: bedAssignments/admissions/patients 세 가지를 각각 따로 fetch하고,
  // 위 두 Map으로 프론트에서 조립함(client-side join).
  // - bedAssignments + admissions → 백엔드가 JOIN 쿼리 하나로 합쳐주면 fetch 1번으로 줄일 수 있음
  // - patients(환자 이름) → 백엔드가 patient-service를 호출해서 미리 합쳐주지 않는 한 항상 별도 fetch 필요
  // 즉 "MyBatis를 쓰면 무조건 1번"이 아니라, "백엔드가 조합 로직을 갖고 있어야" 줄어드는 것
  useEffect(() => {
    dispatch(fetchBedAssignmentsRequest());
    dispatch(fetchAdmissionsRequest());
    dispatch(fetchPatientListRequest({}));
  }, [dispatch]);

  return (
    <div className={embedded ? "w-full" : "mx-auto w-full max-w-[1800px] p-6"}>
      <div className="mb-6 flex items-center justify-between">
        {embedded ? (
          <div />
        ) : (
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Bed Assignment List</h1>
          <p className="mt-1 text-sm text-slate-500">A record of bed assignments and releases to date.</p>
        </div>
        )}
        <Link
          href="/inpatient/bedmanagement/bedassignment/create"
          className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Register Assignment
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
                  <th className="whitespace-nowrap px-4 py-3">Assignment ID</th>
                  <th className="whitespace-nowrap px-4 py-3">Bed ID</th>
                  <th className="whitespace-nowrap px-4 py-3">Admission ID</th>
                  <th className="whitespace-nowrap px-4 py-3">Assigned At</th>
                  <th className="whitespace-nowrap px-4 py-3">Released At</th>
                  <th className="whitespace-nowrap px-4 py-3">Status</th>
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
                          {isActive ? "Assigned" : "Released"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {bedAssignments.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-500">No assignment data available.</p>
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
