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
import PostcodeSearchButton from "@/components/patient/PostcodeSearchButton";
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
 * 접수관리/응급접수 전용 환자 등록 모달
 * - src/components/patient/PatientRegisterForm.tsx (환자관리 서비스 소유) 는 건드리지 않는다.
 * - 입력 양식(항목·순서·검증·문구)은 그 화면과 동일하게 맞추고,
 *   등록/중복확인은 같은 features/patient 의 Redux 액션을 그대로 재사용한다.
 * - 등록 성공 후 동작(페이지 이동 대신 onRegistered 콜백 호출)만 다르다.
 */

type PatientRegisterFormState = Omit<PatientRegisterRequest, "genderCd"> & {
  genderCd: GenderCd | "";
  zipCode: string;
  address: string;
  addressDetail: string;
  phoneNo: string;
};

const initialForm: PatientRegisterFormState = {
  patientName: "",
  birthDate: "",
  residentRegNo: "",
  genderCd: "",
  tempPatientYn: "N",
  tempRegisterReason: "",
  zipCode: "",
  address: "",
  addressDetail: "",
  phoneNo: "",
};

function formatPhoneNo(value: string): string {
  const digits = value.replace(/[^0-9]/g, "").slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

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

function hasUnsavedChanges(form: PatientRegisterFormState): boolean {
  return (
    form.patientName.trim() !== "" ||
    form.residentRegNo !== "" ||
    form.birthDate !== "" ||
    form.genderCd !== "" ||
    form.tempPatientYn !== initialForm.tempPatientYn ||
    Boolean(form.tempRegisterReason?.trim()) ||
    form.zipCode !== "" ||
    form.address.trim() !== "" ||
    form.addressDetail.trim() !== "" ||
    form.phoneNo !== ""
  );
}

type PatientRegisterModalProps = {
  open: boolean;
  onClose: () => void;
  onRegistered: (patient: Patient) => void;
};

/** 열 때마다 내부 폼을 새로 마운트해서 이전 입력값/상태가 남지 않게 한다 */
export default function PatientRegisterModal(props: PatientRegisterModalProps) {
  if (!props.open) return null;
  return <PatientRegisterModalContent {...props} />;
}

function PatientRegisterModalContent({
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

  const isTemporaryPatient = form.tempPatientYn === "Y";

  const residentRegNoError =
    form.residentRegNo.length === 0
      ? null
      : form.residentRegNo.length < 13
        ? "Please enter all 13 digits of the resident registration number."
        : getBirthDateFromResidentRegNo(form.residentRegNo) === null
          ? "Please enter a valid resident registration number."
          : null;

  const registrationDisabledReason = registerLoading
    ? null
    : duplicateCheckLoading
      ? "Checking the resident registration number..."
      : !form.genderCd ||
        (isTemporaryPatient
          ? !form.tempRegisterReason?.trim()
          : !form.patientName.trim() ||
            !form.residentRegNo ||
            !form.birthDate)
        ? "Please complete all required fields."
        : form.patientName.trim() &&
            (form.patientName.trim().length < 2 ||
              form.patientName.trim().length > 100)
          ? "Patient name must be between 2 and 100 characters."
          : residentRegNoError
            ? residentRegNoError
            : form.residentRegNo && duplicated === null
              ? "Please check the resident registration number before registering."
              : form.residentRegNo && duplicated
                ? "This resident registration number is already registered."
                : null;

  const isRegistrationDisabled =
    registerLoading || registrationDisabledReason !== null;

  /** 이전 시도의 중복확인/등록 결과(Redux)를 비운다 */
  useEffect(() => {
    dispatch(resetPatientRegistration());
  }, [dispatch]);

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
      setValidationError("Please enter a valid resident registration number.");
      return;
    }
    dispatch(
      checkPatientDuplicateRequest({ residentRegNo: form.residentRegNo }),
    );
  };

  const submitPatient = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.genderCd) {
      setValidationError("Please complete all required fields.");
      return;
    }

    if (isTemporaryPatient && !form.tempRegisterReason?.trim()) {
      setValidationError("Please enter a temporary registration reason.");
      return;
    }

    if (
      !isTemporaryPatient &&
      (!form.patientName.trim() ||
        !form.birthDate ||
        !form.residentRegNo.trim())
    ) {
      setValidationError("Please complete all required fields.");
      return;
    }

    if (
      form.patientName.trim() &&
      (form.patientName.trim().length < 2 ||
        form.patientName.trim().length > 100)
    ) {
      setPatientNameTouched(true);
      setValidationError("Patient name must be between 2 and 100 characters.");
      return;
    }

    if (form.zipCode && !/^\d{5}$/.test(form.zipCode)) {
      setValidationError("Postal code must contain exactly 5 digits.");
      return;
    }

    const normalizedPhoneNo = form.phoneNo.replace(/[^0-9]/g, "");

    if (normalizedPhoneNo && !/^\d{9,11}$/.test(normalizedPhoneNo)) {
      setValidationError("Phone number must contain 9 to 11 digits.");
      return;
    }

    if (form.residentRegNo && duplicated === null) {
      setValidationError("Please check the resident registration number first.");
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
        tempRegisterReason: isTemporaryPatient
          ? form.tempRegisterReason?.trim()
          : undefined,
      }),
    );
  };

  function handleClose() {
    if (
      registerLoading ||
      (hasUnsavedChanges(form) &&
        !window.confirm("Your unsaved changes will be lost. Do you want to close this window?"))
    ) {
      return;
    }

    dispatch(resetPatientRegistration());
    onClose();
  }

  function resetForm() {
    if (
      hasUnsavedChanges(form) &&
      !window.confirm("Do you want to reset all entered information?")
    ) {
      return;
    }

    setForm(initialForm);
    setPatientNameTouched(false);
    setValidationError(null);
    setSubmitted(false);
    dispatch(resetPatientRegistration());
  }

  return (
    <Modal
      open={open}
      title="Register Patient"
      closeDisabled={registerLoading}
      onClose={handleClose}
      maxWidthClassName="max-w-xl"
    >
      <div className="mb-3 space-y-2 empty:hidden">
        {validationError ? (
          <Alert variant="error">{validationError}</Alert>
        ) : null}
        {error ? <Alert variant="error">{error}</Alert> : null}
        {duplicated === false ? (
          <Alert variant="success">This resident registration number is available.</Alert>
        ) : null}
        {duplicated === true ? (
          <Alert variant="error">This resident registration number is already registered.</Alert>
        ) : null}
      </div>

      <form onSubmit={submitPatient} className="space-y-4">
        <FormField label="Patient Type">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isTemporaryPatient}
              onChange={(event) => {
                const temporary = event.target.checked;
                setForm((previous) => ({
                  ...previous,
                  tempPatientYn: temporary ? "Y" : "N",
                  genderCd:
                    temporary && !previous.genderCd
                      ? "03"
                      : previous.genderCd,
                  tempRegisterReason: temporary
                    ? previous.tempRegisterReason
                    : "",
                }));
                setValidationError(null);
                dispatch(resetPatientRegistration());
              }}
              disabled={registerLoading}
              className="h-4 w-4 rounded border-slate-300"
            />
            Register as Temporary Patient
          </label>
          <p className="mt-1 text-xs text-slate-500">
            Use this option to register a patient with minimal information before identity confirmation.
          </p>
        </FormField>

        {isTemporaryPatient ? (
          <FormField
            label="Temporary Registration Reason"
            required
            htmlFor="modalTempRegisterReason"
          >
            <Input
              id="modalTempRegisterReason"
              value={form.tempRegisterReason ?? ""}
              onChange={(event) =>
                updateForm("tempRegisterReason", event.target.value)
              }
              disabled={registerLoading}
              maxLength={200}
              placeholder="Enter the reason (e.g., identity unknown)"
            />
          </FormField>
        ) : null}

        <FormField
          label="Patient Name"
          required={!isTemporaryPatient}
          htmlFor="modalPatientName"
          hint={isTemporaryPatient ? "A temporary patient name will be generated if left blank." : undefined}
        >
          <Input
            id="modalPatientName"
            value={form.patientName}
            onChange={(event) => updateForm("patientName", event.target.value)}
            onBlur={() => setPatientNameTouched(true)}
            disabled={registerLoading}
            autoComplete="name"
          />
          {patientNameTouched && !isTemporaryPatient && !form.patientName.trim() ? (
            <p className="text-sm text-red-600">Please enter the patient name.</p>
          ) : patientNameTouched &&
            form.patientName.trim() &&
            (form.patientName.trim().length < 2 ||
              form.patientName.trim().length > 100) ? (
            <p className="text-sm text-red-600">
              Patient name must be between 2 and 100 characters.
            </p>
          ) : null}
        </FormField>

        <FormField
          label="Resident Registration Number"
          required={!isTemporaryPatient}
          htmlFor="modalResidentRegNo"
        >
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
              {duplicateCheckLoading ? "Checking..." : "Check Duplicate"}
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
          required={!isTemporaryPatient}
          htmlFor="modalBirthDate"
          hint={
            form.birthDate
              ? "Calculated automatically from the resident registration number."
              : "Enter the resident registration number to calculate automatically."
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

        <div className="border-t border-slate-200 pt-4">
          <h2 className="mb-4 text-base font-semibold text-slate-800">
            Address and Contact Information
          </h2>

          <div className="space-y-4">
            <FormField label="Address" htmlFor="modalZipCode">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    id="modalZipCode"
                    value={form.zipCode}
                    onChange={(event) =>
                      updateForm(
                        "zipCode",
                        event.target.value.replace(/[^0-9]/g, "").slice(0, 5),
                      )
                    }
                    disabled={registerLoading}
                    inputMode="numeric"
                    maxLength={5}
                    placeholder="Postal code"
                    autoComplete="postal-code"
                  />
                  <PostcodeSearchButton
                    disabled={registerLoading}
                    onSelect={(result) => {
                      updateForm("zipCode", result.zipCode);
                      updateForm("address", result.address);
                      window.setTimeout(
                        () => document.getElementById("modalAddressDetail")?.focus(),
                        0,
                      );
                    }}
                  />
                </div>
                <Input
                  id="modalAddress"
                  value={form.address}
                  onChange={(event) => updateForm("address", event.target.value)}
                  disabled={registerLoading}
                  maxLength={300}
                  placeholder="Address"
                  autoComplete="street-address"
                />
                <Input
                  id="modalAddressDetail"
                  value={form.addressDetail}
                  onChange={(event) =>
                    updateForm("addressDetail", event.target.value)
                  }
                  disabled={registerLoading}
                  maxLength={300}
                  placeholder="Enter address details"
                  autoComplete="address-line2"
                />
                <p className="text-xs text-slate-400">
                  Postal code must contain exactly 5 digits.
                </p>
              </div>
            </FormField>

            <FormField
              label="Phone Number"
              htmlFor="modalPhoneNo"
              hint="Enter in 010-1234-5678 format."
            >
              <Input
                id="modalPhoneNo"
                value={form.phoneNo}
                onChange={(event) =>
                  updateForm("phoneNo", formatPhoneNo(event.target.value))
                }
                disabled={registerLoading}
                inputMode="tel"
                maxLength={13}
                placeholder="010-1234-5678"
                autoComplete="tel"
              />
            </FormField>
          </div>
        </div>

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
          <Button
            type="button"
            variant="secondary"
            onClick={resetForm}
            disabled={registerLoading || duplicateCheckLoading}
          >
            Reset
          </Button>
          <Button type="submit" variant="primary" disabled={isRegistrationDisabled}>
            {registerLoading ? "Registering..." : "Register"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
