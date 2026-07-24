"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  fetchAdmissionsRequest,
  selectAdmissions,
  selectAdmissionListStatus,
} from "@/features/inpatient/admissiondischarge/slice";

const AdmissionList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const admissions = useSelector(selectAdmissions);
  const listStatus = useSelector(selectAdmissionListStatus);

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
              <th>입원경로</th>
              <th>입원날짜</th>
              <th>환자ID</th>
              <th>의사ID</th>
              <th>상태</th>
              <th>생성일시</th>
              <th>수정일시</th>
            </tr>
          </thead>
          <tbody>
            {admissions.map((admission) => (
              <tr key={admission.admissionId}>
                <td>{admission.admissionId}</td>
                <td>{admission.admissionDeptId}</td>
                <td>{admission.admissionRoute}</td>
                <td>{admission.admissionDate}</td>
                <td>{admission.patientId}</td>
                <td>{admission.doctorId}</td>
                <td>{admission.status}</td>
                <td>{admission.createdAt}</td>
                <td>{admission.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdmissionList;
