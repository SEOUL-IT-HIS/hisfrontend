"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  FormField,
  Input,
  Modal,
  Select,
} from "@/components/common";
import {
  checkPatientDuplicateRequest,
  registerPatientRequest,
  resetPatientRegistration,
} from "@/features/patient/slice/patientSlice";
import type {
  GenderCd,
  Patient,
  PatientRegisterRequest,
} from "@/features/patient/type/patientType";
import type { AppDispatch, RootState } from "@/store/store";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";

/**
 * 접수관리 전용 환자 등록 모달
 * - src/components/patient/PatientRegisterForm.tsx (환자관리 서비스 소유) 는 건드리지 않는다.
 * - 등록/중복확인은 그 화면과 같은 features/patient 의 Redux 액션을 그대로 재사용하고,
 *   등록 성공 후 동작(페이지 이동 대신 콜백 호출)만 다르게 구현한 별도 컴포넌트다.
 */

type PatientRegisterFormState = Omit<PatientRegisterRequest, "genderCd"> & {
  genderCd: GenderCd | "";
};

const initialForm: PatientRegisterFormState = {
  patientName: "",
  birthDate: "",
  residentRegNo: "",
  genderCd: "",
  tempPatientYn: "N",
};

function getBirthDateFromResidentRegNo(residentRegNo: string): string | null {
  if (!/^\d{13}$/.test(residentRegNo)) {
    return null;
  }

  const yearPart = Number(residentRegNo.slice(0, 2));
  const month = Number(residentRegNo.slice(2, 4));
  const day = Number(residentRegNo.slice(4, 6));
  const typeCode = residentRegNo.charAt(6);

  const centuryByTypeCode: Record<string, number> = {
    "1": 1900,
    "2": 1900,
    "3": 2000,
    "4": 2000,
    "5": 1900,
    "6": 1900,
    "7": 2000,
    "8": 2000,
  };

  const century = centuryByTypeCode[typeCode];
  if (century === undefined) {
    return null;
  }

  const year = century + yearPart;
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return [
    year,
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

type PatientRegisterModalProps = {
  open: boolean;
  onClose: () => void;
  onRegistered: (patient: Patient) => void;
};

export default function PatientRegisterModal({
  open,
  onClose,
  onRegistered,
}: PatientRegisterModalProps) {
  const genderCodes = useCommonCodeOptions("GENDER_CD");
  const [form, setForm] = useState<PatientRegisterFormState>(initialForm);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [patientNameTouched, setPatientNameTouched] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const {
    registeredPatient,
    duplicated,
    registerLoading,
    duplicateCheckLoading,
    error,
  } = useSelector((state: RootState) => state.patient);

  const residentRegNoError =
    form.residentRegNo.length === 0
      ? null
      : form.residentRegNo.length < 13
        ? "Please enter all 13 digits of the resident registration number."
        : getBirthDateFromResidentRegNo(form.residentRegNo) === null
          ? "Invalid resident registration number format."
          : null;

  const registrationDisabledReason = registerLoading
    ? null
    : duplicateCheckLoading
      ? "Checking for duplicate resident registration number…"
      : !form.patientName.trim() ||
          !form.residentRegNo ||
          !form.birthDate ||
          !form.genderCd
        ? "Please fill in all required fields."
        : form.patientName.trim().length < 2 ||
            form.patientName.trim().length > 100
          ? "Patient name must be between 2 and 100 characters."
          : residentRegNoError
            ? residentRegNoError
            : duplicated === null
              ? "Please complete the duplicate check before registering."
              : duplicated
                ? "This resident registration number is already registered."
                : null;

  const isRegistrationDisabled =
    registerLoading || registrationDisabledReason !== null;

  /** 모달을 열 때마다 이전 시도의 상태/입력값을 깨끗이 비운다 */
  useEffect(() => {
    if (!open) return;
    dispatch(resetPatientRegistration());
    setForm(initialForm);
    setValidationError(null);
    setSubmitted(false);
    setPatientNameTouched(false);
  }, [open, dispatch]);

  useEffect(() => {
    if (form.residentRegNo.length === 6) {
      document.getElementById("modalResidentRegNoBack")?.focus();
    }
  }, [form.residentRegNo]);

  useEffect(() => {
    if (submitted && registeredPatient) {
      dispatch(resetPatientRegistration());
      onRegistered(registeredPatient);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, registeredPatient, submitted]);

  const updateForm = <K extends keyof PatientRegisterFormState>(
    field: K,
    value: PatientRegisterFormState[K],
  ) => {
    setForm((previous) => {
      if (field === "residentRegNo") {
        const residentRegNo = value as string;
        const birthDate = getBirthDateFromResidentRegNo(residentRegNo) ?? "";
        return { ...previous, residentRegNo, birthDate };
      }
      return { ...previous, [field]: value };
    });

    setValidationError(null);

    if (field === "residentRegNo") {
      dispatch(resetPatientRegistration());
    }
  };

  const updateResidentRegNoFront = (value: string) => {
    updateForm("residentRegNo", value.replace(/[^0-9]/g, "").slice(0, 6));
  };

  const updateResidentRegNoBack = (value: string) => {
    const front = form.residentRegNo.slice(0, 6);
    const back = value.replace(/[^0-9]/g, "").slice(0, 7);
    updateForm("residentRegNo", `${front}${back}`);
  };

  const checkDuplicate = () => {
    if (form.residentRegNo.length !== 13) {
      setValidationError("Please enter all 13 digits of the resident registration number.");
      return;
    }
    if (getBirthDateFromResidentRegNo(form.residentRegNo) === null) {
      setValidationError("Invalid resident registration number format.");
      return;
    }
    dispatch(
      checkPatientDuplicateRequest({ residentRegNo: form.residentRegNo }),
    );
  };

  const submitPatient = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !form.patientName.trim() ||
      !form.birthDate ||
      !form.residentRegNo.trim() ||
      !form.genderCd
    ) {
      setValidationError("Please fill in all required fields.");
      return;
    }
    if (
      form.patientName.trim().length < 2 ||
      form.patientName.trim().length > 100
    ) {
      setPatientNameTouched(true);
      setValidationError("Patient name must be between 2 and 100 characters.");
      return;
    }
    if (duplicated === null) {
      setValidationError("Please check for duplicate resident registration number first.");
      return;
    }
    if (duplicated) {
      setValidationError("This resident registration number is already registered.");
      return;
    }

    setValidationError(null);
    setSubmitted(true);
    dispatch(
      registerPatientRequest({
        patientName: form.patientName.trim(),
        birthDate: form.birthDate,
        residentRegNo: form.residentRegNo.trim(),
        genderCd: form.genderCd as GenderCd,
        tempPatientYn: form.tempPatientYn,
      }),
    );
  };

  function handleClose() {
    const hasUnsavedChanges =
      form.patientName.trim() !== "" ||
      form.residentRegNo !== "" ||
      form.genderCd !== "";

    if (
      registerLoading ||
      (hasUnsavedChanges &&
        !window.confirm("Unsaved changes will be lost. Close anyway?"))
    ) {
      return;
    }

    dispatch(resetPatientRegistration());
    onClose();
  }

  return (
    <Modal
      open={open}
      title="Register Patient"
      closeDisabled={registerLoading}
      onClose={handleClose}
      maxWidthClassName="max-w-lg"
    >
      {validationError ? (
        <div className="mb-3">
          <Alert variant="error">{validationError}</Alert>
        </div>
      ) : null}
      {error ? (
        <div className="mb-3">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}
      {duplicated === false ? (
        <div className="mb-3">
          <Alert variant="success">This resident registration number is available.</Alert>
        </div>
      ) : null}
      {duplicated === true ? (
        <div className="mb-3">
          <Alert variant="error">This resident registration number is already registered.</Alert>
        </div>
      ) : null}

      <form onSubmit={submitPatient} className="space-y-4">
        <FormField label="Patient Name" required htmlFor="modalPatientName">
          <Input
            id="modalPatientName"
            value={form.patientName}
            onChange={(event) => updateForm("patientName", event.target.value)}
            onBlur={() => setPatientNameTouched(true)}
            disabled={registerLoading}
            autoComplete="name"
          />
          {patientNameTouched && !form.patientName.trim() ? (
            <p className="text-sm text-red-600">Please enter the patient&apos;s name.</p>
          ) : patientNameTouched &&
            (form.patientName.trim().length < 2 ||
              form.patientName.trim().length > 100) ? (
            <p className="text-sm text-red-600">
              Patient name must be between 2 and 100 characters.
            </p>
          ) : null}
        </FormField>

        <FormField label="Resident Registration Number" required htmlFor="modalResidentRegNo">
          <div className="flex gap-2">
            <Input
              id="modalResidentRegNo"
              value={form.residentRegNo.slice(0, 6)}
              onChange={(event) =>
                updateResidentRegNoFront(event.target.value)
              }
              disabled={duplicateCheckLoading || registerLoading}
              inputMode="numeric"
              maxLength={6}
              placeholder="First 6 digits"
              autoComplete="off"
              className="min-w-0"
            />
            <span className="self-center text-slate-400">-</span>
            <Input
              id="modalResidentRegNoBack"
              value={form.residentRegNo.slice(6)}
              onChange={(event) =>
                updateResidentRegNoBack(event.target.value)
              }
              disabled={
                form.residentRegNo.length < 6 ||
                duplicateCheckLoading ||
                registerLoading
              }
              type="password"
              inputMode="numeric"
              maxLength={7}
              placeholder="Last 7 digits"
              autoComplete="off"
              className="min-w-0"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={checkDuplicate}
              disabled={
                getBirthDateFromResidentRegNo(form.residentRegNo) === null ||
                duplicateCheckLoading ||
                registerLoading
              }
              className="shrink-0"
            >
              {duplicateCheckLoading ? "Checking…" : "Check Duplicate"}
            </Button>
          </div>
          {residentRegNoError ? (
            <span className="text-xs text-rose-600" role="alert">
              {residentRegNoError}
            </span>
          ) : null}
        </FormField>

        <FormField
          label="Date of Birth"
          required
          htmlFor="modalBirthDate"
          hint={
            form.birthDate
              ? "Automatically calculated from the resident registration number."
              : "It will be calculated automatically once you enter the resident registration number."
          }
        >
          <Input
            id="modalBirthDate"
            type="date"
            value={form.birthDate}
            readOnly
            disabled={registerLoading}
          />
        </FormField>

        <FormField label="Gender" required>
          <Select
            name="genderCd"
            value={form.genderCd}
            onChange={(event) =>
              updateForm("genderCd", event.target.value as GenderCd | "")
            }
            options={genderCodes.options}
            placeholder="Select gender"
            disabled={registerLoading || genderCodes.loading}
          />
          {genderCodes.error ? (
            <span className="text-xs text-rose-500">{genderCodes.error}</span>
          ) : null}
        </FormField>

        <FormField label="Patient Type">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.tempPatientYn === "Y"}
              onChange={(event) =>
                updateForm("tempPatientYn", event.target.checked ? "Y" : "N")
              }
              disabled={registerLoading}
              className="h-4 w-4 rounded border-slate-300"
            />
            Register as temporary patient
          </label>
        </FormField>

        {registrationDisabledReason ? (
          <p className="text-right text-xs text-slate-500" role="status">
            {registrationDisabledReason}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={registerLoading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isRegistrationDisabled}>
            {registerLoading ? "Registering…" : "Register"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
