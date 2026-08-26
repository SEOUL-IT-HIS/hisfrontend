"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { AppDispatch } from "@/store/store";
import {
  fetchAdmissionDetailRequest,
  changeStatusRequest,
  selectAdmissionDetail,
  selectAdmissionDetailStatus,
  selectAdmissionChangeStatusStatus,
} from "@/features/inpatient/admissiondischarge/slice";

const STATUS_BADGE: Record<string, string> = {
  ADMITTED: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  DISCHARGE_REQUESTED: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  DISCHARGED: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
};

const STATUS_LABEL: Record<string, string> = {
  ADMITTED: "입원중",
  DISCHARGE_REQUESTED: "퇴원 신청",
  DISCHARGED: "퇴원 완료",
};

const INFO_ROW = "flex justify-between border-b border-slate-100 px-4 py-3 text-sm last:border-b-0";

type DischargeRequestDetailProps = {
  /** 목록 옆에 끼워 넣을 때 라우트 파라미터 대신 직접 전달 */
  admissionId?: string;
  /** 목록 옆에 끼워 넣었을 때만 표시되는 "선택 해제" 버튼 */
  onClose?: () => void;
};

const DischargeRequestDetail = ({ admissionId: admissionIdProp, onClose }: DischargeRequestDetailProps = {}) => {
  const dispatch = useDispatch<AppDispatch>();
  const routeParams = useParams() as { admissionId?: string };
  const admissionId = admissionIdProp ?? routeParams.admissionId ?? "";
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
    <div className="w-full p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">퇴원 처리</h1>
          <p className="mt-1 text-sm text-slate-500">퇴원 신청 및 완료 처리를 진행합니다.</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            선택 해제
          </button>
        )}
      </div>

      {loading && <p className="text-sm text-slate-500">로딩중...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && admission && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className="text-sm font-medium text-slate-800">{admission.admissionId}</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                  STATUS_BADGE[admission.status] ?? "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                }`}
              >
                {STATUS_LABEL[admission.status] ?? admission.status}
              </span>
            </div>
            <div>
              <div className={INFO_ROW}>
                <span className="text-slate-500">환자ID</span>
                <span className="text-slate-800">{admission.patientId}</span>
              </div>
              <div className={INFO_ROW}>
                <span className="text-slate-500">입원과ID</span>
                <span className="text-slate-800">{admission.admissionDeptId}</span>
              </div>
              <div className={INFO_ROW}>
                <span className="text-slate-500">입원날짜</span>
                <span className="text-slate-800">{admission.admissionDate}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-sm font-medium text-slate-800">다음 단계</p>
            <div className="flex flex-wrap items-center gap-2">
              {admission.status === "ADMITTED" && (
                <button
                  onClick={handleRequestDischarge}
                  disabled={changeStatusStatus.loading}
                  className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
                >
                  {changeStatusStatus.loading ? "처리중..." : "퇴원 신청"}
                </button>
              )}
              {admission.status === "DISCHARGE_REQUESTED" && (
                <>
                  <span className="text-sm text-slate-600">퇴원 신청 완료 — 처리 대기 중</span>
                  <button
                    onClick={handleCompleteDischarge}
                    disabled={changeStatusStatus.loading}
                    className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
                  >
                    {changeStatusStatus.loading ? "처리중..." : "퇴원 완료 처리"}
                  </button>
                </>
              )}
              {admission.status === "DISCHARGED" && (
                <>
                  <span className="text-sm text-slate-600">퇴원 완료됨</span>
                  <Link
                    href={`/inpatient/admissiondischarge/discharge/settlement/${admissionId}`}
                    className="inline-flex items-center rounded-lg border border-sky-600 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
                  >
                    정산 확인하기
                  </Link>
                </>
              )}
            </div>
            {changeStatusStatus.error && <p className="mt-2 text-sm text-red-600">{changeStatusStatus.error}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default DischargeRequestDetail;
