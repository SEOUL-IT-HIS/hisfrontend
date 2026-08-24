"use client";

import { useEffect, useMemo } from "react";
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

const BedAssignmentList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const bedAssignments = useSelector(selectBedAssignments);
  const listStatus = useSelector(selectBedAssignmentListStatus);
  const admissions = useSelector(selectAdmissions);
  const patients = useSelector((state: RootState) => state.patient.patients);
  
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
    dispatch(fetchPatientListRequest());
  }, [dispatch]);

  return (
    <div>
      {listStatus.loading && <p>로딩중...</p>}
      {listStatus.error && <p>{listStatus.error}</p>}
      {!listStatus.loading && !listStatus.error && (
        <>
        <Link href="/inpatient/bedmanagement/bedassignment/create">배정 등록</Link>
        <table>
          <thead>
            <tr>
              <th>환자명</th>
              <th>배정ID</th>
              <th>병상ID</th>
              <th>입원ID</th>
              <th>배정시각</th>
              <th>퇴상시각</th>
            </tr>
          </thead>
          <tbody>
            {bedAssignments.map((bedAssignment) => (
              <tr key={bedAssignment.assignmentId}>
                <td>{patientNameById.get(patientIdByAdmissionId.get(bedAssignment.admissionId) ?? "") ?? "Unknown"}</td>
                <td>
                <Link href={`/inpatient/bedmanagement/bedassignment/${bedAssignment.assignmentId}`}>
                    {bedAssignment.assignmentId}
                </Link>
                </td>
                
                <td>{bedAssignment.bedId}</td>
                <td>{bedAssignment.admissionId}</td>
                <td>{bedAssignment.assignedAt}</td>
                <td>{bedAssignment.releasedAt ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </>
      )}
    </div>
  );
};

export default BedAssignmentList;
