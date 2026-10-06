"use client";

import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import { fetchAdmissionsRequest, selectAdmissions } from "@/features/inpatient/admissiondischarge/slice";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";
import { formatDateTime } from "@/features/inpatient/dateLimits";

type AdmissionSelectProps = {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  className: string;
  /** 간호기록 홈에서 환자를 고르고 들어온 경우 — 바꿀 수 없게 고정 표시 */
  locked?: boolean;
};

// 간호기록을 쓸 수 있는 입원 건 (퇴원신청 후에도 정산 전까지는 병동에 있으므로 포함 — 서버 규칙과 같음)
const RECORDABLE_STATUSES = ["ADMITTED", "DISCHARGE_REQUESTED"];

/**
 * 간호기록 등록 폼의 입원 건 선택 — 입원 ID를 직접 입력하는 대신 "환자명 · 입원일"로 고름
 */
const AdmissionSelect = ({ id, name, value, onChange, className, locked = false }: AdmissionSelectProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const admissions = useSelector(selectAdmissions);
  const patients = useSelector((state: RootState) => state.patient.patients);

  // 다른 화면에서 이미 불러왔으면 다시 부르지 않음
  useEffect(() => {
    if (admissions.length === 0) dispatch(fetchAdmissionsRequest());
    if (patients.length === 0) dispatch(fetchPatientListRequest({}));
  }, [dispatch, admissions.length, patients.length]);

  const patientNameById = useMemo(() => new Map(patients.map((p) => [p.patientId, p.patientName])), [patients]);
  const labelOf = (admission: (typeof admissions)[number]) =>
    `${patientNameById.get(admission.patientId) ?? "Unknown patient"} · admitted ${formatDateTime(admission.admissionDate).slice(0, 10)}`;

  const recordable = admissions.filter((a) => RECORDABLE_STATUSES.includes(a.status));
  const selected = admissions.find((a) => a.admissionId === value) ?? null;

  if (locked) {
    // FIELD의 흰 배경을 회색으로 바꿔 "수정 불가" 칸처럼 보이게 함 (bg-white와 bg-slate-50을 같이 두면 어느 쪽이 적용될지 불확실)
    return <div className={`${className.replace("bg-white", "bg-slate-50")} text-slate-600`}>{selected ? labelOf(selected) : "Loading..."}</div>;
  }

  return (
    <select id={id} name={name} value={value} onChange={onChange} required className={className}>
      <option value="">Select</option>
      {recordable.map((admission) => (
        <option key={admission.admissionId} value={admission.admissionId}>
          {labelOf(admission)}
        </option>
      ))}
    </select>
  );
};

export default AdmissionSelect;
