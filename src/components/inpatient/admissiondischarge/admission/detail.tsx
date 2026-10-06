"use client";

import { fetchAdmissionDetailRequest, changeStatusRequest, changeDoctorRequest, selectAdmissionChangeDoctorStatus } from "@/features/inpatient/admissiondischarge/slice";
import { fetchBedAssignmentsRequest, selectBedAssignments } from "@/features/inpatient/bedmanagement/bedassignment/slice";
import { fetchBedRequest, selectBed } from "@/features/inpatient/bedmanagement/bedstatus/slice";
import { calculateAdmissionDays } from "@/features/inpatient/admissiondischarge/utils";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { useDoctorOptions } from "@/features/inpatient/admissiondischarge/useDoctorOptions";
import { useDepartmentNames } from "@/features/commonCode/hooks/useDepartmentNames";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";
import { formatDateTime } from "@/features/inpatient/dateLimits";
import { formatSexAge } from "@/features/inpatient/displayFormat";

import { RootState } from "@/store/store";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FIELD } from "@/components/inpatient/common/styles";
import { Alert, Button, PageHeader } from "@/components/common";
import LinkButton from "@/components/inpatient/common/LinkButton";
import { InfoRow } from "@/components/inpatient/common/SectionCard";
import type { AdmissionDTO } from "@/features/inpatient/admissiondischarge/types";

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



// 진료과 코드(DEPT_CD) → 진료과명. 공통코드를 못 불러오면 코드값 그대로 표시
const toDeptLabel = (deptNames: Record<string, string>, deptCode: string | null) =>
  deptCode ? deptNames[deptCode] ?? deptCode : "No Department";

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
  const { names: deptNames } = useDepartmentNames();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(doctorId ?? "");
  // 의사 목록을 못 불러오면(로그인 세션 문제, 의사 역할 미등록 등) 직접 입력으로 대체
  const useManualInput = !doctorsLoading && doctors.length === 0;
  // 지정된 담당의 표시 — 이름 옆에 진료과 (목록에 없는 예전 값 D22 등은 그대로 표시)
  const assignedDoctor = doctors.find((d) => d.empId === doctorId);
  const doctorLabel = !doctorId
    ? null
    : assignedDoctor
      ? `${assignedDoctor.empName} (${toDeptLabel(deptNames, assignedDoctor.deptCode)})`
      : nameById.get(doctorId) ?? doctorId;

  // 의사를 진료과별로 묶음 (진료과명 순, 진료과 없는 의사는 맨 뒤) → 드롭다운에서 <optgroup>으로 구분
  const doctorsByDept = useMemo(() => {
    const groups = new Map<string, typeof doctors>();
    doctors.forEach((d) => {
      const key = d.deptCode ?? "";
      groups.set(key, [...(groups.get(key) ?? []), d]);
    });
    return Array.from(groups.entries())
      .map(([deptCode, list]) => ({ deptCode: deptCode || null, doctors: list }))
      .sort((a, b) => {
        if (!a.deptCode) return 1;
        if (!b.deptCode) return -1;
        return toDeptLabel(deptNames, a.deptCode).localeCompare(toDeptLabel(deptNames, b.deptCode));
      });
  }, [doctors, deptNames]);

  const onSave = () => {
    if (!value.trim()) return;
    dispatch(changeDoctorRequest({ admissionId, doctorId: value.trim() }));
  };

  return (
    <div className="border-b border-slate-100 px-5 py-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-slate-500">Doctor</span>
        {!editing && (
          <span className="flex items-center gap-2">
            {doctorLabel ? (
              <span className="text-slate-800">{doctorLabel}</span>
            ) : (
              <span className="font-medium text-rose-600">Not assigned</span>
            )}
            {editable && (
              <Button variant="secondary" className="!h-7 !rounded-lg !px-2 !text-xs"
                onClick={() => setEditing(true)}
              >
                {doctorId ? "Change" : "Assign"}
              </Button>
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
              className={FIELD}
            />
          ) : (
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={FIELD}
            >
              <option value="">{doctorsLoading ? "Loading doctors..." : "Select doctor"}</option>
              {doctorsByDept.map(({ deptCode, doctors: deptDoctors }) => (
                <optgroup key={deptCode ?? "none"} label={toDeptLabel(deptNames, deptCode)}>
                  {deptDoctors.map((d) => (
                    <option key={d.empId} value={d.empId}>
                      {d.empName} · {toDeptLabel(deptNames, d.deptCode)} ({d.empNo})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          )}
          <Button className="!h-8 shrink-0 !px-3"
            onClick={onSave}
            disabled={loading || !value.trim()}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
          <Button variant="secondary" className="!h-8 shrink-0 !px-3"
            onClick={() => setEditing(false)}
          >
            Cancel
          </Button>
        </div>
      )}
      {editing && error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      {!doctorId && !editing && editable && (
        <p className="mt-1 text-xs text-rose-600">Assign an attending doctor before requesting prescriptions.</p>
      )}
    </div>
  );
};

type EmergencyRequestCardProps = {
  admission: AdmissionDTO;
  /** true면 입원 확정 이후 — 이력 확인용 작은 회색 카드 */
  compact: boolean;
  wardName: string | null;
  requestedByName: string | null;
};

/**
 * 응급 입원요청 정보 카드 — 응급(Kafka)에서 들어온 건(dispositionId 있음)만 표시
 * - 배정 전(REQUESTED): 격리·희망 병동을 보고 병상을 골라야 하므로 눈에 띄는 빨간 카드
 * - 입원 확정 이후: 배정이 끝나 판단용 정보가 아니므로 회색 카드로 이력만 보여줌
 *   (격리 여부는 계속 중요해서 상단 환자 이름 옆 배지로 따로 표시)
 */
const EmergencyRequestCard = ({ admission, compact, wardName, requestedByName }: EmergencyRequestCardProps) => {
  const isolation = admission.isolationYn === "Y";
  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${
        compact ? "border-slate-200/80" : "border-rose-200/80"
      }`}
    >
      <div
        className={`flex items-center justify-between border-b px-5 py-3 ${
          compact ? "border-slate-100 bg-slate-50/60" : "border-rose-100 bg-rose-50"
        }`}
      >
        <span className={`text-sm font-semibold ${compact ? "text-slate-600" : "text-rose-800"}`}>
          {compact ? "Admitted via Emergency" : "Emergency Request"}
        </span>
        {!compact && isolation && (
          <span className="inline-flex items-center rounded-full bg-rose-600 px-2.5 py-1 text-xs font-medium text-white">
            Isolation Required
          </span>
        )}
      </div>
      <div>
        <InfoRow label="Isolation">
          <span className={isolation ? "font-medium text-rose-700" : ""}>{isolation ? "Required" : "Not required"}</span>
        </InfoRow>
        <InfoRow label="Preferred Ward">{wardName ?? "-"}</InfoRow>
        {/* 응급이 요청 의사 ID를 안 보내는 경우가 있어서, 값이 없으면 줄 자체를 숨김 */}
        {requestedByName && <InfoRow label="Requested By">{requestedByName}</InfoRow>}
        {admission.note && (
          <div className="border-b border-slate-100 px-5 py-3 text-sm last:border-b-0">
            <p className="mb-1 text-slate-400">Note</p>
            <p className="whitespace-pre-wrap text-slate-800">{admission.note}</p>
          </div>
        )}
      </div>
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
  // 배정된 병상의 병동·호실·베드 번호를 보여주기 위해 병상 목록도 같이 씀
  const beds = useSelector(selectBed);
  // 환자 ID 대신 이름 · 성별/나이를 보여주기 위해 환자 목록을 같이 씀 (목록 화면에서 이미 불러왔으면 다시 안 부름)
  const patients = useSelector((state: RootState) => state.patient.patients);
  const patient = patients.find((p) => p.patientId === admission?.patientId) ?? null;
  // 진료과 코드 → 진료과명, 응급 요청 의사 ID → 이름 (목록에 없는 값은 그대로 표시)
  const { names: deptNames } = useDepartmentNames();
  const { nameById: doctorNameById } = useDoctorOptions();

  useEffect(() => {
    if (!admissionId) return;
    dispatch(fetchAdmissionDetailRequest(admissionId));
    dispatch(fetchBedAssignmentsRequest());
    dispatch(fetchBedRequest());
  }, [admissionId]);

  useEffect(() => {
    if (patients.length === 0) dispatch(fetchPatientListRequest({}));
  }, [dispatch, patients.length]);

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

  // 이 입원 건의 병상 배정 — 사용 중인 배정이 우선, 없으면(이미 퇴상) 가장 최근 배정
  const assignment = useMemo(() => {
    const mine = bedAssignments.filter((ba) => ba.admissionId === admissionId);
    return (
      mine.find((ba) => ba.releasedAt === null) ??
      [...mine].sort((a, b) => b.assignedAt.localeCompare(a.assignedAt))[0] ??
      null
    );
  }, [bedAssignments, admissionId]);
  const assignedBed = assignment ? beds.find((b) => b.bedId === assignment.bedId) ?? null : null;

  // 응급 입원요청 건만 카드를 그림 (단계에 따라 크게 / 작게)
  const emergencyCard =
    admission?.dispositionId
      ? (compact: boolean) => (
          <EmergencyRequestCard
            admission={admission}
            compact={compact}
            wardName={admission.wardPref ? wardNameByCd.get(admission.wardPref) ?? admission.wardPref : null}
            requestedByName={admission.requestedBy ? doctorNameById.get(admission.requestedBy) ?? admission.requestedBy : null}
          />
        )
      : null;

  return (
    // 목록 옆에 끼워 넣을 때(onClose 있음)는 여백 없이, 단독 화면일 때만 페이지 여백
    <div className={`flex w-full flex-col gap-4 ${onClose ? "" : "p-6"}`}>
      <PageHeader
        title="Admission Details"
        // 목록 옆 좁은 패널에서는 설명을 숨겨 제목과 Deselect가 한 줄에 들어가게 함
        description={onClose ? undefined : "Admission registration information and bed assignment progress."}
        actions={
          // 목록 옆에 끼워 넣었을 때(onClose가 전달된 경우)만 노출
          onClose && (
            <Button variant="secondary" className="!h-8 !px-3" onClick={onClose}>
              Deselect
            </Button>
          )
        }
      />

      {loading && <p className="text-sm text-slate-400">Loading...</p>}
      {error && <Alert>{error}</Alert>}

      {!loading && admission && (
        <div className="space-y-4">
          {/* 기본 정보 카드 */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                {patient?.patientName ?? "Loading..."}
                {/* 격리 필요 환자는 단계와 상관없이 항상 표시 (감염관리 — 간호 중에도 알아야 함) */}
                {admission.isolationYn === "Y" && (
                  <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
                    Isolation
                  </span>
                )}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                  STATUS_BADGE[admission.status] ?? "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                }`}
              >
                {STATUS_LABEL[admission.status] ?? admission.status}
              </span>
            </div>
            <div>
              <InfoRow label="Admission Dept">{admission.admissionDeptId ? deptNames[admission.admissionDeptId] ?? admission.admissionDeptId : "-"}</InfoRow>
              <InfoRow label="Admission Route">{admission.admissionRoute}</InfoRow>
              <InfoRow label="Admission Date">{formatDateTime(admission.admissionDate)}</InfoRow>
              <InfoRow label="Gender / Age">{patient ? formatSexAge(patient.genderCd, patient.birthDate) : "-"}</InfoRow>
              <DoctorRow
                key={`${admission.admissionId}-${admission.doctorId ?? ""}`}
                admissionId={admission.admissionId}
                doctorId={admission.doctorId}
                editable={admission.status !== "DISCHARGED"}
              />
              {/* 재원일수는 입원 확정 이후에만 의미가 있음 */}
              {admission.status !== "REQUESTED" && (
                <InfoRow label="Length of Stay">
                  {/* 퇴원신청 후에는 신청일까지만 셈 — 입원료가 그 일수로 청구됨 */}
                  {calculateAdmissionDays(admission.admissionDate, admission.dischargeRequestedAt ?? admission.dischargedAt)} days
                  {admission.dischargeRequestedAt && <span className="ml-1 text-xs text-slate-400">(billed)</span>}
                </InfoRow>
              )}
              {admission.dischargeRequestedAt && (
                <InfoRow label="Discharge Requested At">{formatDateTime(admission.dischargeRequestedAt)}</InfoRow>
              )}
              <InfoRow label="Bed">
                {assignedBed
                  ? `${assignedBed.wardCd ? wardNameByCd.get(assignedBed.wardCd) ?? assignedBed.wardCd : "-"} · Room ${assignedBed.roomNo}, Bed ${assignedBed.bedNo}`
                  : assignment
                    ? "Loading..."
                    : "Not assigned"}
              </InfoRow>
              {assignment && <InfoRow label="Bed Assigned At">{formatDateTime(assignment.assignedAt)}</InfoRow>}
              {assignment?.releasedAt && <InfoRow label="Bed Released At">{formatDateTime(assignment.releasedAt)}</InfoRow>}
              <InfoRow label="Updated At">{formatDateTime(admission.updatedAt)}</InfoRow>
            </div>
          </div>

          {/* 응급 입원요청 카드 — 배정 전에 보고 판단하도록 Next Step 카드보다 위에 둠
              (배정하면 그 병동/병상이 응급으로 바로 회신되므로, 격리·희망 병동을 먼저 확인해야 함) */}
          {emergencyCard && admission.status === "REQUESTED" && emergencyCard(false)}

          {/* "다음 단계" 카드 — 이미 퇴원 완료된 건은 더 진행할 액션이 없으므로 카드 자체를 숨김 */}
          {admission.status !== "DISCHARGED" && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <p className="mb-3 text-sm font-semibold text-slate-800">Next Step</p>
              <div className="flex flex-wrap gap-2">
                {/* REQUESTED 상태일 때만 "입원 확정" 노출. 병상이 배정된 건만 실제로 눌러서 ADMITTED로 전환 가능 —
                    배정 없이 입원중 상태만 먼저 되는 걸 막기 위해 hasActiveBedAssignment를 조건에 추가함.
                    이 상태 전환에 별도 백엔드 API가 있는 게 아니라, 기존 범용 상태변경 API를 그대로 재사용함 */}
                {admission.status === "REQUESTED" && (
                  hasActiveBedAssignment ? (
                    <Button
                      onClick={() => dispatch(changeStatusRequest({ admissionId, status: "ADMITTED" }))}
                    >
                      Confirm Admission
                    </Button>
                  ) : (
                    <span className="inline-flex h-9 items-center rounded-xl bg-slate-100 px-4 text-sm text-slate-500">
                      Assign a bed before confirming
                    </span>
                  )
                )}

                {/* 이미 배정됐으면 완료 텍스트만, 아니면 배정 등록 화면으로 이동하는 링크
                    (admissionId를 쿼리파라미터로 넘겨서 그 화면에서 다시 선택 안 해도 되게 함) */}
                {hasActiveBedAssignment ? (
                  <span className="inline-flex h-9 items-center rounded-xl bg-slate-100 px-4 text-sm text-slate-500">
                    Bed Assigned
                  </span>
                ) : (
                  <LinkButton
                    href={`/inpatient/bedmanagement/bedassignment/create?admissionId=${admissionId}`}
                  >
                    Assign Bed
                  </LinkButton>
                )}

                {/* 입원 중(ADMITTED)인 환자만 처방 요청 화면으로 이동 — 퇴원신청 이후는 처방요청 대상이 아님
                    admissionId를 넘겨 해당 환자가 미리 선택된 채 열림 */}
                {admission.status === "ADMITTED" && (
                  <LinkButton variant="secondary"
                    href={`/inpatient/medicationmanagement?admissionId=${admissionId}`}
                  >
                    Request Prescription
                  </LinkButton>
                )}

                {/* 입원 중(퇴원신청 포함)인 환자의 간호기록 화면으로 이동 — admissionId를 넘겨 해당 환자가 미리 선택된 채 열림 */}
                {(admission.status === "ADMITTED" || admission.status === "DISCHARGE_REQUESTED") && (
                  <LinkButton variant="secondary"
                    href={`/inpatient/nursingrecord?admissionId=${admissionId}`}
                  >
                    Nursing Records
                  </LinkButton>
                )}
              </div>
            </div>
          )}

          {/* 입원 확정 이후에는 응급 요청 정보를 이력으로만 — Next Step 아래 작은 카드 */}
          {emergencyCard && admission.status !== "REQUESTED" && emergencyCard(true)}
        </div>
      )}
    </div>
  );
};

export default AdmissionDetail;
