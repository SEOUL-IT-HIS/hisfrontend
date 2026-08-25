"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "next/navigation";
import type { AppDispatch } from "@/store/store";
import {
  fetchAdmissionDetailRequest,
  changeStatusRequest,
  selectAdmissionDetail,
  selectAdmissionDetailStatus,
  selectAdmissionChangeStatusStatus,
} from "@/features/inpatient/admissiondischarge/slice";

const DischargeRequestDetail = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { admissionId }: { admissionId: string } = useParams();
  const admission = useSelector(selectAdmissionDetail);
  const { loading, error } = useSelector(selectAdmissionDetailStatus);
  const changeStatusStatus = useSelector(selectAdmissionChangeStatusStatus);

  useEffect(() => {
    if (!admissionId) return;
    dispatch(fetchAdmissionDetailRequest(admissionId));
  }, [admissionId, dispatch]);

  useEffect(() => {
    if (changeStatusStatus.success && admissionId) {
      dispatch(fetchAdmissionDetailRequest(admissionId));
    }
  }, [changeStatusStatus.success, admissionId, dispatch]);

  const handleRequestDischarge = () => {
    if (!admissionId) return;
    dispatch(changeStatusRequest({ admissionId, status: "DISCHARGE_REQUESTED" }));
  };

  const handleCompleteDischarge = () => {
    if (!admissionId) return;
    dispatch(changeStatusRequest({ admissionId, status: "DISCHARGED" }));
};

  return (
    <div>
      {loading && <p>로딩중...</p>}
      {error && <p>{error}</p>}
      {!loading && admission && (
        <div>
          <p>입원ID: {admission.admissionId}</p>
          <p>환자ID: {admission.patientId}</p>
          <p>입원과ID: {admission.admissionDeptId}</p>
          <p>입원날짜: {admission.admissionDate}</p>
          <p>현재 상태: {admission.status}</p>

          {admission.status === "ADMITTED" && (
            <button onClick={handleRequestDischarge} disabled={changeStatusStatus.loading}>
              {changeStatusStatus.loading ? "처리중..." : "퇴원 신청"}
            </button>
          )}
          {admission.status === "DISCHARGE_REQUESTED" && <p>퇴원 신청 완료 — 처리 대기 중</p>}
          {admission.status === "DISCHARGE_REQUESTED" && (
        <button onClick={handleCompleteDischarge} disabled={changeStatusStatus.loading}>
          {changeStatusStatus.loading ? "처리중..." : "퇴원 완료 처리"}
        </button>
        )}
          {admission.status === "DISCHARGED" && <p>퇴원 완료됨</p>}

          {changeStatusStatus.error && <p>{changeStatusStatus.error}</p>}
        </div>
      )}
    </div>
  );
};

export default DischargeRequestDetail;
