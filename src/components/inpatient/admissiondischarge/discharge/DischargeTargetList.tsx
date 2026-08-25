"use client";

import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  fetchAdmissionsRequest,
  selectAdmissions,
  selectAdmissionListStatus,
} from "@/features/inpatient/admissiondischarge/slice";
import Link from "next/link";

const DischargeTargetList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const admissions = useSelector(selectAdmissions);
  const listStatus = useSelector(selectAdmissionListStatus);

  const dischargeTargets = useMemo(
    () => admissions.filter((admission) => admission.status === "ADMITTED"),
    [admissions],
  );

  useEffect(() => {
    dispatch(fetchAdmissionsRequest());
  }, [dispatch]);

  return (
    <div>
      {listStatus.loading && <p>로딩중...</p>}
      {listStatus.error && <p>{listStatus.error}</p>}
      {!listStatus.loading && !listStatus.error && (
        <table>
          <thead>
            <tr>
              <th>입원ID</th>
              <th>입원과ID</th>
              <th>환자ID</th>
              <th>입원날짜</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {dischargeTargets.map((admission) => (
              <tr key={admission.admissionId}>
                <td>
                  <Link href={`/inpatient/admissiondischarge/discharge/${admission.admissionId}`}>
                    {admission.admissionId}
                  </Link>
                </td>
                <td>{admission.admissionDeptId}</td>
                <td>{admission.patientId}</td>
                <td>{admission.admissionDate}</td>
                <td>{admission.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DischargeTargetList;
