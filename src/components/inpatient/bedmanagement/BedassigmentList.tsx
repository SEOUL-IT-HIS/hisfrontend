"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  fetchBedAssignmentsRequest,
  selectBedAssignments,
  selectBedAssignmentListStatus,
} from "@/features/inpatient/bedmanagement/slice";

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
                <td>{bedAssignment.assignmentId}</td>
                <td>{bedAssignment.bedId}</td>
                <td>{bedAssignment.admissionId}</td>
                <td>{bedAssignment.assignedAt}</td>
                <td>{bedAssignment.releasedAt ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BedAssignmentList;
