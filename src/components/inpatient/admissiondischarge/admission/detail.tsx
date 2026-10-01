"use client";

import { fetchAdmissionDetailRequest, changeStatusRequest, changeDoctorRequest, selectAdmissionChangeDoctorStatus } from "@/features/inpatient/admissiondischarge/slice";
import { fetchBedAssignmentsRequest, selectBedAssignments } from "@/features/inpatient/bedmanagement/bedassignment/slice";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { useDoctorOptions } from "@/features/inpatient/admissiondischarge/useDoctorOptions";

import { RootState } from "@/store/store";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

// 담당의(주치의) 표시 + 지정/변경
// - 처방요청 시 이 값이 처방의사(prescribedBy)로 외래에 전달되므로, 비어 있으면 빨간색으로 강조
// - 부모가 key={admissionId + doctorId}로 그려서, 저장이 끝나 값이 바뀌면 이 컴포넌트가 새로 그려지며 입력 상태가 초기화됨
const DoctorRow = ({ admissionId, doctorId, editable }: { admissionId: string; doctorId: string | null; editable: boolean }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(selectAdmissionChangeDoctorStatus);
  // admin에 등록된 의사(역할이 의사인 직원) 목록 — 값은 empId, 화면에는 이름
  const { doctors, nameById, loading: doctorsLoading } = useDoctorOptions();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(doctorId ?? "");
  // 의사 목록을 못 불러오면(로그인 세션 문제, 의사 역할 미등록 등) 직접 입력으로 대체
  const useManualInput = !doctorsLoading && doctors.length === 0;
  const doctorLabel = doctorId ? nameById.get(doctorId) ?? doctorId : null; // 예전 값(D22 등)은 그대로 표시

  const onSave = () => {
    if (!value.trim()) return;
    dispatch(changeDoctorRequest({ admissionId, doctorId: value.trim() }));
  };

  return (
    <div className="border-b border-slate-100 px-4 py-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-slate-500">Doctor ID</span>
        {!editing && (
          <span className="flex items-center gap-2">
            {doctorLabel ? (
              <span className="text-slate-800">{doctorLabel}</span>
            ) : (
              <span className="font-medium text-rose-600">Not assigned</span>
            )}
            {editable && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-md border border-slate-200 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50"
              >
                {doctorId ? "Change" : "Assign"}
              </button>
            )}
          </span>
        )}
      </div>
      {editing && (
        <div className="mt-2 flex gap-2">
          {useManualInput ? (
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Doctor ID (doctor list unavailable)"
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          ) : (
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">{doctorsLoading ? "Loading doctors..." : "Select doctor"}</option>
              {doctors.map((d) => (
                <option key={d.empId} value={d.empId}>
                  {d.empName} ({d.empNo}{d.deptCode ? ` · ${d.deptCode}` : ""})
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={loading || !value.trim()}
            className="shrink-0 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      )}
      {editing && error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {!doctorId && !editing && editable && (
        <p className="mt-1 text-xs text-rose-600">Assign an attending doctor before requesting prescriptions.</p>
      )}
    </div>
  );
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

  // 응급 요청의 희망 병동(WARD_CD 코드값) → 병동명. 공통코드를 못 불러오면 코드값 그대로 표시
  const { options: wardOptions } = useCommonCodeOptions("WARD_CD");
  const wardNameByCd = useMemo(
    () => new Map(wardOptions.map((opt) => [opt.value, opt.label])),
    [wardOptions],
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
              <DoctorRow
                key={`${admission.admissionId}-${admission.doctorId ?? ""}`}
                admissionId={admission.admissionId}
                doctorId={admission.doctorId}
                editable={admission.status !== "DISCHARGED"}
              />
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

          {/* 응급 입원요청 정보 카드 — 응급(Kafka)에서 들어온 건(dispositionId 있음)만 표시
              병상 배정 전에 보고 판단하도록 Next Step 카드보다 위에 둠
              (배정하면 그 병동/병상이 응급으로 바로 회신되므로, 격리·희망 병동을 먼저 확인해야 함) */}
          {admission.dispositionId && (
            <div className="overflow-hidden rounded-xl border border-rose-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50 px-4 py-3">
                <span className="text-sm font-medium text-rose-800">Emergency Request</span>
                {admission.isolationYn === "Y" && (
                  <span className="inline-flex items-center rounded-full bg-rose-600 px-2.5 py-1 text-xs font-medium text-white">
                    Isolation Required
                  </span>
                )}
              </div>
              <div>
                <div className={INFO_ROW}>
                  <span className="text-slate-500">Isolation</span>
                  <span className={admission.isolationYn === "Y" ? "font-medium text-rose-700" : "text-slate-800"}>
                    {admission.isolationYn === "Y" ? "Required" : "Not required"}
                  </span>
                </div>
                <div className={INFO_ROW}>
                  <span className="text-slate-500">Preferred Ward</span>
                  <span className="text-slate-800">
                    {admission.wardPref ? wardNameByCd.get(admission.wardPref) ?? admission.wardPref : "-"}
                  </span>
                </div>
                <div className={INFO_ROW}>
                  <span className="text-slate-500">Requested By</span>
                  <span className="text-slate-800">{admission.requestedBy ?? "-"}</span>
                </div>
                <div className={INFO_ROW}>
                  <span className="text-slate-500">ER Encounter ID</span>
                  <span className="text-slate-800">{admission.encounterId ?? "-"}</span>
                </div>
                {admission.note && (
                  <div className="border-b border-slate-100 px-4 py-3 text-sm last:border-b-0">
                    <p className="mb-1 text-slate-500">Note</p>
                    <p className="whitespace-pre-wrap text-slate-800">{admission.note}</p>
                  </div>
                )}
              </div>
            </div>
          )}

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

                {/* 입원 중(ADMITTED)인 환자만 처방 요청 화면으로 이동 — 퇴원신청 이후는 처방요청 대상이 아님
                    admissionId를 넘겨 해당 환자가 미리 선택된 채 열림 */}
                {admission.status === "ADMITTED" && (
                  <Link
                    href={`/inpatient/medicationmanagement?admissionId=${admissionId}`}
                    className="inline-flex items-center rounded-lg border border-sky-300 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
                  >
                    Request Prescription
                  </Link>
                )}

                {/* 입원 중(퇴원신청 포함)인 환자의 간호기록 화면으로 이동 — admissionId를 넘겨 해당 환자가 미리 선택된 채 열림 */}
                {(admission.status === "ADMITTED" || admission.status === "DISCHARGE_REQUESTED") && (
                  <Link
                    href={`/inpatient/nursingrecord?admissionId=${admissionId}`}
                    className="inline-flex items-center rounded-lg border border-sky-300 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
                  >
                    Nursing Records
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
