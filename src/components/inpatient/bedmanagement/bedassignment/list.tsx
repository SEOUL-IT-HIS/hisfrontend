"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  fetchBedAssignmentsRequest,
  selectBedAssignments,
  selectBedAssignmentListStatus,
} from "@/features/inpatient/bedmanagement/bedassignment/slice";
import Link from "next/link";

const BedAssignmentList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const bedAssignments = useSelector(selectBedAssignments);
  const listStatus = useSelector(selectBedAssignmentListStatus);

  useEffect(() => {
    dispatch(fetchBedAssignmentsRequest());
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
