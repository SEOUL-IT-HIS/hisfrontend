"use client";

import { fetchAdmissionDetailRequest, changeStatusRequest } from "@/features/inpatient/admissiondischarge/slice";
import { fetchBedAssignmentsRequest, selectBedAssignments } from "@/features/inpatient/bedmanagement/bedassignment/slice";

import { RootState } from "@/store/store";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

// 입원 상태(admission.status) → 배지 색상
// 실제 상태값은 백엔드 AdmissionEntity.status(단순 문자열 필드)에서 옴 —
// REQUESTED(요청됨) → ADMITTED(입원중) → DISCHARGE_REQUESTED(퇴원신청) → DISCHARGED(퇴원완료)
// 순서로만 진행되고 되돌아가지 않는 단방향 흐름
const STATUS_BADGE: Record<string, string> = {
  REQUESTED: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200",
  ADMITTED: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  DISCHARGE_REQUESTED: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  DISCHARGED: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
};

// 입원 상태 → 화면에 보여줄 한글 라벨
const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Waiting for Admission",
  ADMITTED: "Admitted",
  DISCHARGE_REQUESTED: "Discharge Requested",
  DISCHARGED: "Discharged",
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
  // 목록 옆 마스터-디테일로 쓸 때는 prop(admissionIdProp)으로,
  // /admission/[admissionId] 단독 라우트로 열렸을 때는 URL 파라미터로 id를 받음 — prop이 우선
  const routeParams = useParams() as { admissionId?: string };
  const admissionId = admissionIdProp ?? routeParams.admissionId ?? "";
  const admission = useSelector((state: RootState) => state.inpatient.admissiondischarge.detail);
  const { loading, error } = useSelector((state: RootState) => state.inpatient.admissiondischarge.detailStatus);
  // "병상 배정하기" 버튼을 보여줄지 말지 판단하려면, 이 admissionId에 활성 배정이 있는지 알아야 해서 같이 불러옴
  const bedAssignments = useSelector(selectBedAssignments);

  useEffect(() => {
    if (!admissionId) return;
    dispatch(fetchAdmissionDetailRequest(admissionId));
    dispatch(fetchBedAssignmentsRequest());
  }, [admissionId]);

  // 이 입원건으로 걸린 배정 중, 아직 퇴상 처리 안 된(releasedAt === null) 것이 있는지 —
  // 있으면 이미 병상이 배정된 상태로 간주
  const hasActiveBedAssignment = bedAssignments.some(
    (ba) => ba.admissionId === admissionId && ba.releasedAt === null
  );

  return (
    <div className="w-full p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Admission Details</h1>
          <p className="mt-1 text-sm text-slate-500">Admission registration information and bed assignment progress.</p>
        </div>
        {/* 목록 옆에 끼워 넣었을 때(onClose가 전달된 경우)만 노출 */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Deselect
          </button>
        )}
      </div>

      {loading && <p className="text-sm text-slate-500">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && admission && (
        <div className="space-y-4">
          {/* 기본 정보 카드 */}
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
                <span className="text-slate-500">Admission Dept ID</span>
                <span className="text-slate-800">{admission.admissionDeptId}</span>
              </div>
              <div className={INFO_ROW}>
                <span className="text-slate-500">Admission Route</span>
                <span className="text-slate-800">{admission.admissionRoute}</span>
              </div>
              <div className={INFO_ROW}>
                <span className="text-slate-500">Admission Date</span>
                <span className="text-slate-800">{admission.admissionDate}</span>
              </div>
              <div className={INFO_ROW}>
                <span className="text-slate-500">Patient ID</span>
                <span className="text-slate-800">{admission.patientId}</span>
              </div>
              <div className={INFO_ROW}>
                <span className="text-slate-500">Doctor ID</span>
                <span className="text-slate-800">{admission.doctorId}</span>
              </div>
              <div className={INFO_ROW}>
                <span className="text-slate-500">Created At</span>
                <span className="text-slate-800">{admission.createdAt}</span>
              </div>
              <div className={INFO_ROW}>
                <span className="text-slate-500">Updated At</span>
                <span className="text-slate-800">{admission.updatedAt}</span>
              </div>
            </div>
          </div>

          {/* "다음 단계" 카드 — 이미 퇴원 완료된 건은 더 진행할 액션이 없으므로 카드 자체를 숨김 */}
          {admission.status !== "DISCHARGED" && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-sm font-medium text-slate-800">Next Step</p>
              <div className="flex flex-wrap gap-2">
                {/* REQUESTED 상태일 때만 "입원 확정" 노출. 병상이 배정된 건만 실제로 눌러서 ADMITTED로 전환 가능 —
                    배정 없이 입원중 상태만 먼저 되는 걸 막기 위해 hasActiveBedAssignment를 조건에 추가함.
                    이 상태 전환에 별도 백엔드 API가 있는 게 아니라, 기존 범용 상태변경 API를 그대로 재사용함 */}
                {admission.status === "REQUESTED" && (
                  hasActiveBedAssignment ? (
                    <button
                      onClick={() => dispatch(changeStatusRequest({ admissionId, status: "ADMITTED" }))}
                      className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
                    >
                      Confirm Admission
                    </button>
                  ) : (
                    <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500">
                      Assign a bed before confirming
                    </span>
                  )
                )}

                {/* 이미 배정됐으면 완료 텍스트만, 아니면 배정 등록 화면으로 이동하는 링크
                    (admissionId를 쿼리파라미터로 넘겨서 그 화면에서 다시 선택 안 해도 되게 함) */}
                {hasActiveBedAssignment ? (
                  <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500">
                    Bed Assigned
                  </span>
                ) : (
                  <Link
                    href={`/inpatient/bedmanagement/bedassignment/create?admissionId=${admissionId}`}
                    className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
                  >
                    Assign Bed
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
