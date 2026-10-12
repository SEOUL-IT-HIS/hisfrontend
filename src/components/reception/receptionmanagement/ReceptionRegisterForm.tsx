"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  FormActions,
  FormField,
  Input,
  Select,
} from "@/components/common";
import {
  registerReceptionRequest,
  selectRegisterLoading,
  selectRegisterError,
  selectRegisterSuccessCount,
} from "@/features/reception/receptionmanagement/slice";
import type { ReservationItem, VisitType } from "@/features/reception/receptionmanagement/types";
import type { PatientSearchItem } from "@/features/reception/patientmanagement/types";
import { getPatientDisplayName } from "@/features/patient/util/patientName";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { useDeptDoctorOptions } from "@/features/reception/receptionmanagement/useDeptDoctorOptions";
import type { AppDispatch } from "@/store/store";
import ReservationModal from "./ReservationModal";

const VISIT_TYPE_LABEL: Record<VisitType, string> = {
  INITIAL: "Initial Visit",
  REVISIT: "Follow-up Visit",
};

const VISIT_TYPE_OPTIONS = [
  { value: "INITIAL", label: VISIT_TYPE_LABEL.INITIAL },
  { value: "REVISIT", label: VISIT_TYPE_LABEL.REVISIT },
];

type FieldErrors = {
  patient?: string;
  deptId?: string;
  doctorId?: string;
  visitType?: string;
};

type ReceptionRegisterFormProps = {
  selectedPatient: PatientSearchItem | null;
  /** 환자를 어떤 버튼으로 넣었는지에 따라 부모가 정한다 (신규환자등록 → 초진, 환자검색 → 재진) */
  visitType: VisitType | null;
  /** 초진/재진을 접수 담당자가 직접 고를 수 있는 상태인지 — 외래 진료 이력으로 판정하지 못했을 때 true */
  visitTypeEditable: boolean;
  /** 외래 진료 이력으로 판정하는 중인지 */
  visitTypeLoading: boolean;
  onVisitTypeChange: (visitType: VisitType | null) => void;
  /** 예약 목록의 [Receive] 로 옮겨 온 예약 — 있으면 진료과/의사/방문목적이 미리 채워지고, 접수유형은 예약이 된다 */
  reservation: ReservationItem | null;
  /** 예약 등록이 끝났을 때 (예약 목록 갱신·화면 전환용) */
  onReserved: () => void;
  onOpenPatientSearch: () => void;
  onOpenPatientRegister: () => void;
  onClearPatient: () => void;
};

/**
 * 접수 등록 폼
 * - 등록 성공 시 registerSuccessCount 가 증가한다. 이 값을 내부 입력 폼의 key 로
 *   사용해 리마운트시켜 초기화한다 (effect 안에서 직접 setState 하지 않기 위함).
 */
export default function ReceptionRegisterForm(
  props: ReceptionRegisterFormProps,
) {
  const resetSignal = useSelector(selectRegisterSuccessCount);
  const { onClearPatient } = props;
  /**
   * onClearPatient 는 부모가 넘기는 인라인 함수라 렌더될 때마다 레퍼런스가 바뀐다.
   * resetSignal 을 deps 에 넣더라도 onClearPatient 레퍼런스 변경만으로 effect가 다시 돌면
   * (예: 두 번째 환자 선택으로 부모가 리렌더될 때) 방금 선택한 환자가 다시 초기화돼버린다.
   * 그래서 "resetSignal 값 자체가 실제로 바뀐 시점"만 ref 로 추적해서 그때만 호출한다.
   */
  const lastResetSignal = useRef(resetSignal);

  useEffect(() => {
    if (resetSignal === lastResetSignal.current) return;
    lastResetSignal.current = resetSignal;
    onClearPatient();
  }, [resetSignal, onClearPatient]);

  // 예약이 바뀌면 폼을 리마운트해서 그 예약의 값으로 다시 채운다.
  return (
    <ReceptionRegisterFormFields
      key={`${resetSignal}-${props.reservation?.reservationId ?? ""}`}
      {...props}
    />
  );
}

function ReceptionRegisterFormFields({
  selectedPatient,
  visitType,
  visitTypeEditable,
  visitTypeLoading,
  onVisitTypeChange,
  reservation,
  onReserved,
  onOpenPatientSearch,
  onOpenPatientRegister,
  onClearPatient,
}: ReceptionRegisterFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  // ER 접수폼과 동일한 방식: reception-service를 거치지 않고 admin-service 공통코드를 직접 조회한다.
  // (reception-service의 CommonCodeCache는 기동 시 한 번만 채워져, admin-service가 그 순간
  //  불통이면 재시작 전까지 비어있을 수 있다 — 이 방식은 그 영향을 받지 않는다)
  const departments = useCommonCodeOptions("DEPT_CD");
  const registerLoading = useSelector(selectRegisterLoading);
  const registerError = useSelector(selectRegisterError);

  // 예약에서 옮겨 온 경우 그 예약의 값으로 시작한다 (key 리마운트 때마다 새로 채워진다).
  const [deptId, setDeptId] = useState(reservation?.deptId ?? "");
  const [doctorId, setDoctorId] = useState(reservation?.doctorId ?? "");
  const doctors = useDeptDoctorOptions(deptId);
  const [memo, setMemo] = useState(reservation?.memo ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [reservationModalOpen, setReservationModalOpen] = useState(false);

  /** 접수유형은 고르지 않는다: 예약에서 옮겨 왔으면 예약, 직접 입력하면 당일 */
  const receptionTypeLabel = reservation ? "Reservation" : "Walk-in (Same Day)";

  function handleReset() {
    setDeptId("");
    setDoctorId("");
    setMemo("");
    setErrors({});
    onClearPatient();
  }

  /** 접수·예약 공통 입력 검증 — 통과하면 true */
  function validate(): boolean {
    const nextErrors: FieldErrors = {};
    if (!selectedPatient) nextErrors.patient = "Please search for and select a patient.";
    if (!deptId) nextErrors.deptId = "Please select a department.";
    // 외래(OPD)는 접수 이벤트의 doctorId 가 비어 있으면 저장에 실패하므로 필수
    if (!doctorId) nextErrors.doctorId = "Please select a doctor.";
    // 환자를 골랐는데 초진/재진이 비어 있으면 (외래 이력으로 판정하지 못한 경우) 직접 고르게 한다
    if (selectedPatient && !visitType) {
      nextErrors.visitType = visitTypeLoading
        ? "Checking outpatient records. Please wait a moment."
        : "Please select a visit type.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0 && !!selectedPatient && !!visitType;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !selectedPatient || !visitType) return;

    dispatch(
      registerReceptionRequest({
        patientId: selectedPatient.patientId,
        deptId,
        doctorId,
        visitType,
        reservationId: reservation?.reservationId,
        memo: memo.trim(),
      }),
    );
  }

  function handleOpenReservation() {
    if (validate()) setReservationModalOpen(true);
  }

  function handleReserved() {
    setReservationModalOpen(false);
    handleReset();
    onReserved();
  }

  return (
    <div className="space-y-4">
      {registerError ? <Alert variant="error">{registerError}</Alert> : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Patient" required>
          <div className="flex gap-2">
            <Input
              readOnly
              value={
                selectedPatient
                  ? getPatientDisplayName(
                      selectedPatient.patientName,
                      selectedPatient.tempPatientNo,
                      selectedPatient.tempPatientYn,
                    )
                  : ""
              }
              placeholder="Select a patient using the Search Patient button"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={onOpenPatientSearch}
            >
              Search Patient
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onOpenPatientRegister}
            >
              Register Patient
            </Button>
          </div>
          {errors.patient && (
            <p className="text-xs text-rose-600">{errors.patient}</p>
          )}
        </FormField>

        {/* 자동 판정: Register Patient → 초진, Search Patient → 외래 진료 기록 없음 초진 / 있음 재진.
            외래 서비스가 응답하지 않아 판정하지 못했을 때만 직접 고른다 (재진으로 간주하지 않는다). */}
        <FormField label="Visit Type" htmlFor="visitType">
          {visitTypeEditable ? (
            <>
              <Select
                id="visitType"
                value={visitType ?? ""}
                placeholder="Select"
                onChange={(e) =>
                  onVisitTypeChange(e.target.value ? (e.target.value as VisitType) : null)
                }
                options={VISIT_TYPE_OPTIONS}
              />
              <span className="text-xs text-slate-500">
                Could not be verified from outpatient records. Please select it manually.
              </span>
            </>
          ) : (
            <Input
              id="visitType"
              readOnly
              value={
                visitTypeLoading
                  ? "Checking outpatient records..."
                  : visitType
                    ? VISIT_TYPE_LABEL[visitType]
                    : ""
              }
              placeholder="Set automatically when a patient is selected"
            />
          )}
          {errors.visitType && (
            <p className="text-xs text-rose-600">{errors.visitType}</p>
          )}
        </FormField>

        <FormField label="Department" required htmlFor="deptId">
          <Select
            id="deptId"
            value={deptId}
            placeholder={departments.loading ? "Loading..." : "Select"}
            onChange={(e) => {
              setDeptId(e.target.value);
              // 진료과가 바뀌면 이전 과의 의사 선택은 무효
              setDoctorId("");
            }}
            options={departments.options}
            disabled={departments.loading}
          />
          {departments.error ? (
            <span className="text-xs text-rose-500">{departments.error}</span>
          ) : null}
          {errors.deptId && (
            <p className="text-xs text-rose-600">{errors.deptId}</p>
          )}
        </FormField>

        {/* 진료과를 고르면 그 과 소속 의사(ADM 직원 중 의사 역할)만 보여준다. 저장 값은 EMP_ID */}
        <FormField label="Doctor" required htmlFor="doctorId">
          <Select
            id="doctorId"
            value={doctorId}
            placeholder={
              !deptId
                ? "Select a department first"
                : doctors.loading
                  ? "Loading..."
                  : doctors.options.length === 0
                    ? "No doctors in this department"
                    : "Select"
            }
            onChange={(e) => setDoctorId(e.target.value)}
            options={doctors.options}
            disabled={!deptId || doctors.loading}
          />
          {doctors.error ? (
            <span className="text-xs text-rose-500">{doctors.error}</span>
          ) : null}
          {errors.doctorId && (
            <p className="text-xs text-rose-600">{errors.doctorId}</p>
          )}
        </FormField>

        <FormField label="Reception Type" htmlFor="receptionType">
          <Input
            id="receptionType"
            readOnly
            value={receptionTypeLabel}
          />
        </FormField>

        <FormField label="Memo" htmlFor="memo">
          <Input
            id="memo"
            value={memo}
            placeholder="Enter a memo"
            onChange={(e) => setMemo(e.target.value)}
          />
        </FormField>

        <FormActions
          onCancel={handleReset}
          cancelLabel="Reset"
          submitLabel="Register Reception"
          loadingLabel="Registering…"
          loading={registerLoading}
        >
          {/* 예약에서 옮겨 온 접수는 이미 예약이므로 다시 예약할 수 없다 */}
          <Button
            type="button"
            variant="secondary"
            disabled={registerLoading || reservation !== null}
            onClick={handleOpenReservation}
          >
            Reserve
          </Button>
        </FormActions>
      </form>

      <ReservationModal
        open={reservationModalOpen}
        base={
          selectedPatient && visitType
            ? {
                patientId: selectedPatient.patientId,
                deptId,
                doctorId,
                visitType,
                memo: memo.trim(),
              }
            : null
        }
        onClose={() => setReservationModalOpen(false)}
        onReserved={handleReserved}
      />
    </div>
  );
}
