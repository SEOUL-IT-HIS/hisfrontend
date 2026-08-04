"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  FormField,
  Input,
  PageHeader,
} from "@/components/common";
import {
  checkPatientDuplicateRequest,
  registerPatientRequest,
  resetPatientRegistration,
} from "@/features/patient/slice/patientSlice";
import type { PatientRegisterRequest } from "@/features/patient/type/patientType";
import type { AppDispatch, RootState } from "@/store/store";

const initialForm: PatientRegisterRequest = {
  patientName: "",
  birthDate: "",
  residentRegNo: "",
  statusCd: "",
};

export default function PatientRegisterForm() {
  const [form, setForm] = useState<PatientRegisterRequest>(initialForm);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const {
    registeredPatient,
    duplicated,
    registerLoading,
    duplicateCheckLoading,
    error,
  } = useSelector((state: RootState) => state.patient);

  useEffect(() => {
    dispatch(resetPatientRegistration());
  }, [dispatch]);

  useEffect(() => {
    if (submitted && registeredPatient) {
      dispatch(resetPatientRegistration());
      router.push("/reception/patientmanagement");
    }
  }, [dispatch, registeredPatient, router, submitted]);

  const updateForm = (
    field: keyof PatientRegisterRequest,
    value: string,
  ) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setValidationError(null);

    if (field === "residentRegNo") {
      dispatch(resetPatientRegistration());
    }
  };

  const checkDuplicate = () => {
    if (!form.residentRegNo.trim()) {
      setValidationError("주민등록번호를 입력해 주세요.");
      return;
    }

    dispatch(
      checkPatientDuplicateRequest({
        residentRegNo: form.residentRegNo.trim(),
      }),
    );
  };

  const submitPatient = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !form.patientName.trim() ||
      !form.birthDate ||
      !form.residentRegNo.trim() ||
      !form.statusCd.trim()
    ) {
      setValidationError("모든 필수 항목을 입력해 주세요.");
      return;
    }

    if (duplicated === null) {
      setValidationError("주민등록번호 중복 확인을 먼저 진행해 주세요.");
      return;
    }

    if (duplicated) {
      setValidationError("이미 등록된 주민등록번호입니다.");
      return;
    }

    setValidationError(null);
    setSubmitted(true);
    dispatch(
      registerPatientRequest({
        patientName: form.patientName.trim(),
        birthDate: form.birthDate,
        residentRegNo: form.residentRegNo.trim(),
        statusCd: form.statusCd.trim(),
      }),
    );
  };

  const resetForm = () => {
    setForm(initialForm);
    setValidationError(null);
    setSubmitted(false);
    dispatch(resetPatientRegistration());
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3">
      <PageHeader title="환자 등록" />

      {validationError ? (
        <Alert variant="error">{validationError}</Alert>
      ) : null}
      {error ? <Alert variant="error">{error}</Alert> : null}
      {duplicated === false ? (
        <Alert variant="success">등록 가능한 주민등록번호입니다.</Alert>
      ) : null}
      {duplicated === true ? (
        <Alert variant="error">이미 등록된 주민등록번호입니다.</Alert>
      ) : null}
      {registeredPatient ? (
        <Alert variant="success">
          환자 등록이 완료되었습니다. 환자번호: {registeredPatient.patientId}
        </Alert>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <form onSubmit={submitPatient} className="space-y-4">
          <FormField label="환자명" required htmlFor="patientName">
            <Input
              id="patientName"
              value={form.patientName}
              onChange={(event) =>
                updateForm("patientName", event.target.value)
              }
              disabled={registerLoading}
              autoComplete="name"
            />
          </FormField>

          <FormField label="생년월일" required htmlFor="birthDate">
            <Input
              id="birthDate"
              type="date"
              value={form.birthDate}
              onChange={(event) => updateForm("birthDate", event.target.value)}
              disabled={registerLoading}
            />
          </FormField>

          <FormField label="주민등록번호" required htmlFor="residentRegNo">
            <div className="flex gap-2">
              <Input
                id="residentRegNo"
                value={form.residentRegNo}
                onChange={(event) =>
                  updateForm(
                    "residentRegNo",
                    event.target.value.replace(/[^0-9]/g, "").slice(0, 13),
                  )
                }
                disabled={duplicateCheckLoading || registerLoading}
                inputMode="numeric"
                maxLength={13}
                placeholder="'-' 없이 숫자만 입력"
                autoComplete="off"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={checkDuplicate}
                disabled={duplicateCheckLoading || registerLoading}
                className="shrink-0"
              >
                {duplicateCheckLoading ? "확인 중…" : "중복 확인"}
              </Button>
            </div>
          </FormField>

          <FormField label="환자 상태 코드" required htmlFor="statusCd">
            <Input
              id="statusCd"
              value={form.statusCd}
              onChange={(event) => updateForm("statusCd", event.target.value)}
              disabled={registerLoading}
              placeholder="환자 상태 코드를 입력"
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={resetForm}
              disabled={registerLoading || duplicateCheckLoading}
            >
              초기화
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={
                registerLoading ||
                duplicateCheckLoading ||
                duplicated !== false
              }
            >
              {registerLoading ? "등록 중…" : "등록"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
