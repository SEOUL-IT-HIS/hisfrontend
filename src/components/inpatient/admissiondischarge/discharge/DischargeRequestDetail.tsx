"use client";

import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "next/navigation";
import type { AppDispatch, RootState } from "@/store/store";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";
import { useDepartmentNames } from "@/features/commonCode/hooks/useDepartmentNames";
import { formatDateTime } from "@/features/inpatient/dateLimits";
import { formatSexAge } from "@/features/inpatient/displayFormat";
import { calculateAdmissionDays } from "@/features/inpatient/admissiondischarge/utils";
import {
  fetchAdmissionDetailRequest,
  changeStatusRequest,
  selectAdmissionDetail,
  selectAdmissionDetailStatus,
  selectAdmissionChangeStatusStatus,
} from "@/features/inpatient/admissiondischarge/slice";

import { fetchBedAssignmentsRequest, selectBedAssignments } from "@/features/inpatient/bedmanagement/bedassignment/slice";
import { fetchBedRequest, selectBed } from "@/features/inpatient/bedmanagement/bedstatus/slice";
import {
  fetchPrescriptionsRequest,
  selectPrescriptionListStatus,
  selectPrescriptions,
} from "@/features/inpatient/medicationmanagement/prescription/slice";
import { PRESCRIPTION_STATUS_CANCELLED, PRESCRIPTION_TYPE_LAB } from "@/features/inpatient/medicationmanagement/types";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { useDoctorOptions } from "@/features/inpatient/admissiondischarge/useDoctorOptions";
import { Alert, Button, PageHeader } from "@/components/common";
import { InfoRow } from "@/components/inpatient/common/SectionCard";

const STATUS_BADGE: Record<string, string> = {
  ADMITTED: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  DISCHARGE_REQUESTED: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  DISCHARGED: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
};

const STATUS_LABEL: Record<string, string> = {
  ADMITTED: "Admitted",
  DISCHARGE_REQUESTED: "Discharge Requested",
  DISCHARGED: "Discharged",
};

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
  // 환자 ID 대신 이름 · 성별/나이, 진료과 코드 대신 진료과명
  const patients = useSelector((state: RootState) => state.patient.patients);
  const patient = patients.find((p) => p.patientId === admission?.patientId) ?? null;
  const { names: deptNames } = useDepartmentNames();
  const { nameById: doctorNameById } = useDoctorOptions();
  const { options: wardOptions } = useCommonCodeOptions("WARD_CD");
  const bedAssignments = useSelector(selectBedAssignments);
  const beds = useSelector(selectBed);
  const prescriptions = useSelector(selectPrescriptions);
  const prescriptionListStatus = useSelector(selectPrescriptionListStatus);

  useEffect(() => {
    if (patients.length === 0) dispatch(fetchPatientListRequest({}));
  }, [dispatch, patients.length]);

  useEffect(() => {
    if (!admissionId) return;
    dispatch(fetchAdmissionDetailRequest(admissionId));
    // 퇴원 전 확인용 — 사용 중인 병상(배정 + 병상 목록)과 검사결과 수신 여부(처방 목록)
    dispatch(fetchBedAssignmentsRequest());
    dispatch(fetchBedRequest());
    dispatch(fetchPrescriptionsRequest(admissionId));
  }, [admissionId, dispatch]);

  // 이 입원 건의 병상 배정 — 사용 중인 배정이 우선, 없으면(이미 퇴상) 가장 최근 배정
  const assignment = useMemo(() => {
    const mine = bedAssignments.filter((a) => a.admissionId === admissionId);
    return (
      mine.find((a) => a.releasedAt === null) ??
      [...mine].sort((a, b) => b.assignedAt.localeCompare(a.assignedAt))[0] ??
      null
    );
  }, [bedAssignments, admissionId]);
  const bed = assignment ? beds.find((b) => b.bedId === assignment.bedId) ?? null : null;
  const wardName = bed?.wardCd ? wardOptions.find((w) => w.value === bed.wardCd)?.label ?? bed.wardCd : null;

  // 결과가 아직 안 온 검사 항목 — 취소되지 않은 처방의 "검사" 항목 중 최종 결과(FINAL)가 없는 것
  // (store의 처방 목록은 처방요청 화면과 같이 쓰므로 이 입원 건 것만 다시 거름)
  const pendingLabItems = useMemo(
    () =>
      prescriptions
        .filter((p) => p.admissionId === admissionId && p.status !== PRESCRIPTION_STATUS_CANCELLED)
        .flatMap((p) => p.items ?? [])
        .filter((item) => item.prescriptionType === PRESCRIPTION_TYPE_LAB && item.resultStatus !== "FINAL"),
    [prescriptions, admissionId],
  );

  useEffect(() => {
    if (changeStatusStatus.success && admissionId) {
      dispatch(fetchAdmissionDetailRequest(admissionId));
    }
  }, [changeStatusStatus.success, admissionId, dispatch]);

  const handleRequestDischarge = () => {
    if (!admissionId) return;
    dispatch(changeStatusRequest({ admissionId, status: "DISCHARGE_REQUESTED" }));
  };

  return (
    <div className={`flex w-full flex-col gap-4 ${onClose ? "" : "p-6"}`}>
      <PageHeader
        title="Discharge Processing"
        // 목록 옆 좁은 패널에서는 설명을 숨겨 제목과 Deselect가 한 줄에 들어가게 함
        description={onClose ? undefined : "Submit the discharge request and complete discharge processing."}
        actions={
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
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3">
              <span className="text-sm font-semibold text-slate-800">{patient?.patientName ?? "Loading..."}</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                  STATUS_BADGE[admission.status] ?? "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                }`}
              >
                {STATUS_LABEL[admission.status] ?? admission.status}
              </span>
            </div>
            <div>
              <InfoRow label="Sex / Age">{patient ? formatSexAge(patient.genderCd, patient.birthDate) : "-"}</InfoRow>
              <InfoRow label="Admission Dept">{admission.admissionDeptId ? deptNames[admission.admissionDeptId] ?? admission.admissionDeptId : "-"}</InfoRow>
              <InfoRow label="Attending Doctor">
                {admission.doctorId ? doctorNameById.get(admission.doctorId) ?? admission.doctorId : "-"}
              </InfoRow>
              <InfoRow label="Admission Date">{formatDateTime(admission.admissionDate)}</InfoRow>
              <InfoRow label="Length of Stay">
                {/* 퇴원신청 후에는 신청일까지만 셈 — 입원료가 그 일수로 청구됨 */}
                {calculateAdmissionDays(admission.admissionDate, admission.dischargeRequestedAt ?? admission.dischargedAt)} days
                {admission.dischargeRequestedAt && <span className="ml-1 text-xs text-slate-400">(billed)</span>}
              </InfoRow>
              {admission.dischargeRequestedAt && (
                <InfoRow label="Discharge Requested At">{formatDateTime(admission.dischargeRequestedAt)}</InfoRow>
              )}
              <InfoRow label="Bed">
                {bed ? `${wardName ?? "-"} · Room ${bed.roomNo}, Bed ${bed.bedNo}` : assignment ? "Loading..." : "Not assigned"}
              </InfoRow>
              <InfoRow label="Bed Assigned At">{assignment ? formatDateTime(assignment.assignedAt) : "-"}</InfoRow>
              {assignment?.releasedAt && <InfoRow label="Bed Released At">{formatDateTime(assignment.releasedAt)}</InfoRow>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <p className="mb-3 text-sm font-semibold text-slate-800">Next Step</p>
            <div className="flex flex-wrap items-center gap-2">
              {admission.status === "ADMITTED" && (
                <Button
                  onClick={handleRequestDischarge}
                  // 검사결과가 다 오기 전에는 퇴원신청을 막음 (서버에서도 같은 기준으로 한 번 더 검증해야 안전)
                  disabled={changeStatusStatus.loading || prescriptionListStatus.loading || pendingLabItems.length > 0}
                >
                  {changeStatusStatus.loading ? "Processing..." : "Request Discharge"}
                </Button>
              )}
              {admission.status === "DISCHARGE_REQUESTED" && (
                <span className="text-sm text-slate-600">
                  Waiting for payment completion — discharge will complete automatically once billing is finalized
                </span>
              )}
              {admission.status === "DISCHARGED" && (
                <span className="text-sm text-slate-600">Discharged</span>
              )}
            </div>
            {admission.status === "ADMITTED" && pendingLabItems.length > 0 && (
              <p className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {pendingLabItems.length} lab result{pendingLabItems.length > 1 ? "s" : ""} not received yet:{" "}
                {pendingLabItems.map((item) => item.itemName).join(", ")}. Discharge can be requested once all results arrive
                (or the prescription is cancelled).
              </p>
            )}
            {admission.status === "ADMITTED" && prescriptionListStatus.error && (
              <Alert className="mt-3">Could not check lab results: {prescriptionListStatus.error}</Alert>
            )}
            {changeStatusStatus.error && <Alert className="mt-3">{changeStatusStatus.error}</Alert>}
          </div>
        </div>
      )}
    </div>
  );
};

export default DischargeRequestDetail;
