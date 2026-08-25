"use client";

import { useEffect, useState } from "react";
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
  fetchDoctorsRequest,
  clearDoctors,
  registerReceptionRequest,
  selectDepartments,
  selectDoctors,
  selectDoctorsLoading,
  selectRegisterLoading,
  selectRegisterError,
  selectRegisterSuccessCount,
} from "@/features/reception/receptionmanagement/slice";
import type {
  ReceptionType,
  DepartmentOption,
  DoctorOption,
} from "@/features/reception/receptionmanagement/types";
import type { PatientSearchItem } from "@/features/reception/patientmanagement/types";
import type { AppDispatch } from "@/store/store";

const RECEPTION_TYPE_OPTIONS = [
  { value: "INITIAL", label: "초진" },
  { value: "REVISIT", label: "재진" },
];

type FieldErrors = {
  patient?: string;
  deptId?: string;
  doctorId?: string;
};

type ReceptionRegisterFormProps = {
  selectedPatient: PatientSearchItem | null;
  onOpenPatientSearch: () => void;
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

  useEffect(() => {
    if (resetSignal === 0) return;
    onClearPatient();
  }, [resetSignal, onClearPatient]);

  return <ReceptionRegisterFormFields key={resetSignal} {...props} />;
}

function ReceptionRegisterFormFields({
  selectedPatient,
  onOpenPatientSearch,
  onClearPatient,
}: ReceptionRegisterFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const departments = useSelector(selectDepartments);
  const doctors = useSelector(selectDoctors);
  const doctorsLoading = useSelector(selectDoctorsLoading);
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

  useEffect(() => {
    if (!deptId) {
      dispatch(clearDoctors());
      return;
    }
    dispatch(fetchDoctorsRequest(deptId));
  }, [deptId, dispatch]);

  function handleDeptChange(value: string) {
    setDeptId(value);
    setDoctorId("");
  }

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
    if (!selectedPatient) nextErrors.patient = "환자를 검색하여 선택해주세요.";
    if (!deptId) nextErrors.deptId = "진료과를 선택해주세요.";
    if (!doctorId) nextErrors.doctorId = "의사를 선택해주세요.";
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
        <FormField label="환자" required>
          <div className="flex gap-2">
            <Input
              readOnly
              value={
                selectedPatient
                  ? `${selectedPatient.patientName} (${selectedPatient.patientId})`
                  : ""
              }
              placeholder="환자검색 버튼으로 환자를 선택하세요"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={onOpenPatientSearch}
            >
              환자검색
            </Button>
          </div>
          {errors.patient && (
            <p className="text-xs text-rose-600">{errors.patient}</p>
          )}
        </FormField>

        <FormField label="진료과" required htmlFor="deptId">
          <Select
            id="deptId"
            value={deptId}
            placeholder="선택"
            onChange={(e) => handleDeptChange(e.target.value)}
            options={departments.map((d: DepartmentOption) => ({
              value: d.deptId,
              label: d.deptName,
            }))}
          />
          {errors.deptId && (
            <p className="text-xs text-rose-600">{errors.deptId}</p>
          )}
        </FormField>

        <FormField label="의사" required htmlFor="doctorId">
          <Select
            id="doctorId"
            value={doctorId}
            placeholder={doctorsLoading ? "불러오는 중..." : "선택"}
            disabled={!deptId || doctorsLoading}
            onChange={(e) => setDoctorId(e.target.value)}
            options={doctors.map((d: DoctorOption) => ({
              value: d.doctorId,
              label: d.doctorName,
            }))}
          />
          {errors.doctorId && (
            <p className="text-xs text-rose-600">{errors.doctorId}</p>
          )}
        </FormField>

        <FormField label="접수구분" required htmlFor="receptionType">
          <Select
            id="receptionType"
            value={receptionType}
            onChange={(e) =>
              setReceptionType(e.target.value as ReceptionType)
            }
            options={RECEPTION_TYPE_OPTIONS}
          />
        </FormField>

        <FormField label="메모" htmlFor="memo">
          <Input
            id="memo"
            value={memo}
            placeholder="메모를 입력하세요"
            onChange={(e) => setMemo(e.target.value)}
          />
        </FormField>

        <FormActions
          onCancel={handleReset}
          cancelLabel="초기화"
          submitLabel="접수등록"
          loading={registerLoading}
        />
      </form>
    </div>
  );
}
