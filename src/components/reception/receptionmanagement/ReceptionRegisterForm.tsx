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
  fetchDepartmentsRequest,
  registerReceptionRequest,
  selectDepartments,
  selectRegisterLoading,
  selectRegisterError,
  selectRegisterSuccessCount,
} from "@/features/reception/receptionmanagement/slice";
import type {
  ReceptionType,
  DepartmentOption,
} from "@/features/reception/receptionmanagement/types";
import type { PatientSearchItem } from "@/features/reception/patientmanagement/types";
import type { AppDispatch } from "@/store/store";

const RECEPTION_TYPE_OPTIONS = [
  { value: "INITIAL", label: "Initial Visit" },
  { value: "REVISIT", label: "Follow-up Visit" },
];

type FieldErrors = {
  patient?: string;
  deptId?: string;
};

type ReceptionRegisterFormProps = {
  selectedPatient: PatientSearchItem | null;
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

  return <ReceptionRegisterFormFields key={resetSignal} {...props} />;
}

function ReceptionRegisterFormFields({
  selectedPatient,
  onOpenPatientSearch,
  onOpenPatientRegister,
  onClearPatient,
}: ReceptionRegisterFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const departments = useSelector(selectDepartments);
  const registerLoading = useSelector(selectRegisterLoading);
  const registerError = useSelector(selectRegisterError);

  const [deptId, setDeptId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [receptionType, setReceptionType] =
    useState<ReceptionType>("INITIAL");
  const [memo, setMemo] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    dispatch(fetchDepartmentsRequest());
  }, [dispatch]);

  function handleReset() {
    setDeptId("");
    setDoctorId("");
    setReceptionType("INITIAL");
    setMemo("");
    setErrors({});
    onClearPatient();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nextErrors: FieldErrors = {};
    if (!selectedPatient) nextErrors.patient = "Please search for and select a patient.";
    if (!deptId) nextErrors.deptId = "Please select a department.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !selectedPatient) return;

    dispatch(
      registerReceptionRequest({
        patientId: selectedPatient.patientId,
        deptId,
        doctorId,
        receptionType,
        memo: memo.trim(),
      }),
    );
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
                  ? `${selectedPatient.patientName} (${selectedPatient.patientId})`
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

        <FormField label="Department" required htmlFor="deptId">
          <Select
            id="deptId"
            value={deptId}
            placeholder="Select"
            onChange={(e) => setDeptId(e.target.value)}
            options={departments.map((d: DepartmentOption) => ({
              value: d.deptId,
              label: d.deptName,
            }))}
          />
          {errors.deptId && (
            <p className="text-xs text-rose-600">{errors.deptId}</p>
          )}
        </FormField>

        {/* admin-service에 의사 role이 아직 없어 목록 조회가 안 되는 동안은 직접 입력 */}
        <FormField label="Doctor" htmlFor="doctorId">
          <Input
            id="doctorId"
            value={doctorId}
            placeholder="Enter doctor ID"
            onChange={(e) => setDoctorId(e.target.value)}
          />
        </FormField>

        <FormField label="Reception Type" required htmlFor="receptionType">
          <Select
            id="receptionType"
            value={receptionType}
            onChange={(e) =>
              setReceptionType(e.target.value as ReceptionType)
            }
            options={RECEPTION_TYPE_OPTIONS}
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
        />
      </form>
    </div>
  );
}
