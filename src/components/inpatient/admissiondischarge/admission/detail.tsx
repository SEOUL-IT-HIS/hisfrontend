"use client";

import { fetchAdmissionDetailRequest, changeStatusRequest } from "@/features/inpatient/admissiondischarge/slice";
import { fetchBedAssignmentsRequest, selectBedAssignments } from "@/features/inpatient/bedmanagement/bedassignment/slice";

import { RootState } from "@/store/store";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

const STATUS_BADGE: Record<string, string> = {
  REQUESTED: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200",
  ADMITTED: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  DISCHARGE_REQUESTED: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  DISCHARGED: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
};

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "입원대기",
  ADMITTED: "입원중",
  DISCHARGE_REQUESTED: "퇴원 신청",
  DISCHARGED: "퇴원 완료",
};

const INFO_ROW = "flex justify-between border-b border-slate-100 px-4 py-3 text-sm last:border-b-0";

type AdmissionDetailProps = {
  /** 목록 옆에 끼워 넣을 때 라우트 파라미터 대신 직접 전달 */
  admissionId?: string;
  /** 목록 옆에 끼워 넣었을 때만 표시되는 "선택 해제" 버튼 */
  onClose?: () => void;
};

const AdmissionDetail = ({ admissionId: admissionIdProp, onClose }: AdmissionDetailProps = {}) => {
  const dispatch = useDispatch();
  const routeParams = useParams() as { admissionId?: string };
  const admissionId = admissionIdProp ?? routeParams.admissionId ?? "";
  const admission = useSelector((state: RootState) => state.inpatient.admissiondischarge.detail);
  const { loading, error } = useSelector((state: RootState) => state.inpatient.admissiondischarge.detailStatus);
  const bedAssignments = useSelector(selectBedAssignments);

  useEffect(() => {
    if (!admissionId) return;
    dispatch(fetchAdmissionDetailRequest(admissionId));  
    dispatch(fetchBedAssignmentsRequest());
  }, [admissionId]);  


  const hasActiveBedAssignment = bedAssignments.some(
    (ba) => ba.admissionId === admissionId && ba.releasedAt === null
  );

  return (
    <div className="w-full p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">입원 상세</h1>
          <p className="mt-1 text-sm text-slate-500">입원 접수 정보와 병상 배정 진행 상태입니다.</p>
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
                <span className="text-slate-500">입원과ID</span>
                <span className="text-slate-800">{admission.admissionDeptId}</span>
              </div>
              <div className={INFO_ROW}>
                <span className="text-slate-500">입원경로</span>
                <span className="text-slate-800">{admission.admissionRoute}</span>
              </div>
              <div className={INFO_ROW}>
                <span className="text-slate-500">입원날짜</span>
                <span className="text-slate-800">{admission.admissionDate}</span>
              </div>
              <div className={INFO_ROW}>
                <span className="text-slate-500">환자ID</span>
                <span className="text-slate-800">{admission.patientId}</span>
              </div>
              <div className={INFO_ROW}>
                <span className="text-slate-500">의사ID</span>
                <span className="text-slate-800">{admission.doctorId}</span>
              </div>
              <div className={INFO_ROW}>
                <span className="text-slate-500">생성일시</span>
                <span className="text-slate-800">{admission.createdAt}</span>
              </div>
              <div className={INFO_ROW}>
                <span className="text-slate-500">수정일시</span>
                <span className="text-slate-800">{admission.updatedAt}</span>
              </div>
            </div>
          </div>

          {admission.status !== "DISCHARGED" && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-sm font-medium text-slate-800">다음 단계</p>
              <div className="flex flex-wrap gap-2">
                {admission.status === "REQUESTED" && (
                  <button
                    onClick={() => dispatch(changeStatusRequest({ admissionId, status: "ADMITTED" }))}
                    className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
                  >
                    입원 확정
                  </button>
                )}

                {hasActiveBedAssignment ? (
                  <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500">
                    병상 배정 완료됨
                  </span>
                ) : (
                  <Link
                    href={`/inpatient/bedmanagement/bedassignment/create?admissionId=${admissionId}`}
                    className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
                  >
                    병상 배정하기
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdmissionDetail;
