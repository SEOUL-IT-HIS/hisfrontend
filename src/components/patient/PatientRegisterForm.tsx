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
  Select,
} from "@/components/common";
import {
  checkPatientDuplicateRequest,
  registerPatientRequest,
  resetPatientRegistration,
} from "@/features/patient/slice/patientSlice";
import type {
  GenderCd,
  PatientRegisterRequest,
} from "@/features/patient/type/patientType";
import type { AppDispatch, RootState } from "@/store/store";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import PostcodeSearchButton from "./PostcodeSearchButton";

type PatientRegisterFormState = Omit<
  PatientRegisterRequest,
  "genderCd" | "zipCode" | "address" | "addressDetail" | "phoneNo"
> & {
  genderCd: GenderCd | "";
  zipCode: string;
  address: string;
  addressDetail: string;
  phoneNo: string;
};
// Omit은 기존 타입에서 특정 속성을 제외하는 TypeScript 유틸리티 타입
// &는 교차 타입(Intersection Type) : 두 타입 합치기
// |는 유니온 타입(Union Type) : 둘 중 하나 허용

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
  // /^\d{13}$/ : 정규표현식(Regular Expression)
  // : 문자열의 처음부터 끝까지 숫자로만 이루어져 있고, 그 숫자가 정확히 13개인가?
  // ^ : 문자열의 시작, \d : 숫자 0~9, {13} : 앞의 숫자가 정확히 13개, $ : 문자열의 끝
  // test()는 문자열이 정규표현식 조건에 맞는지 검사하는 함수, 결과는 boolean

  const yearPart = Number(residentRegNo.slice(0, 2));
  const month = Number(residentRegNo.slice(2, 4));
  const day = Number(residentRegNo.slice(4, 6));
  const typeCode = residentRegNo.charAt(6);
  // slice(시작위치, 끝위치) : 문자열의 일부분을 잘라내는 함수(시작위치는 포함, 끝위치는 포함 X)
  // charAt() : 문자열의 특정 위치에 있는 문자 하나를 가져오는 함수
  // 차례대로 출생년도, 출생월, 출생일, 출생 세기 판정코드

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
  // Record : 객체의 key와 value가 어떤 타입인지 지정하는 TypeScript 유틸리티 타입

  const century = centuryByTypeCode[typeCode];

  if (century === undefined) {
    return null;
  }

  const year = century + yearPart;
  const date = new Date(year, month - 1, day);
  // year 예시 : 1900 + 99, 2000 + 00
  // date 예시 : 2000 , 8 - 1, 13 , 이때 -1을 하는 이유는 Date는 1월이 0부터 시작이기 때문

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  // 실제로 생성된 날짜의 연도가 원래 계산한 연도와 다른가?
  // || : OR(또는) 연산자
  // getDate() : 몇 일인지와 getDay() : 요일을 가져오는 함수

  return [
    year,
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

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

export default function PatientRegisterForm() {
  const genderCodes = useCommonCodeOptions("GENDER_CD");
  const [form, setForm] = useState<PatientRegisterFormState>(initialForm);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [patientNameTouched, setPatientNameTouched] = useState(false);
  const router = useRouter();
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

  useEffect(() => {
    dispatch(resetPatientRegistration());
  }, [dispatch]);

  useEffect(() => {
    if (form.residentRegNo.length === 6) {
      document.getElementById("residentRegNoBack")?.focus();
    }
  }, [form.residentRegNo]);

  useEffect(() => {
    if (submitted && registeredPatient) {
      dispatch(resetPatientRegistration());
      router.push(
        `/reception/patientmanagement?registeredPatientId=${registeredPatient.patientId}`,
      );
    }
  }, [dispatch, registeredPatient, router, submitted]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const hasUnsavedChanges =
        form.patientName.trim() !== "" ||
        form.residentRegNo !== "" ||
        form.birthDate !== "" ||
        form.genderCd !== "" ||
        form.tempPatientYn !== initialForm.tempPatientYn ||
        Boolean(form.tempRegisterReason?.trim()) ||
        form.zipCode !== "" ||
        form.address.trim() !== "" ||
        form.addressDetail.trim() !== "" ||
        form.phoneNo !== "";

      if (!hasUnsavedChanges || submitted) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [form, submitted]);

  const updateForm = <K extends keyof PatientRegisterFormState>(
    field: K,
    value: PatientRegisterFormState[K],
  ) => {
    setForm((previous) => {
      if (field === "residentRegNo") {
        const residentRegNo = value as string;
        const birthDate = getBirthDateFromResidentRegNo(residentRegNo) ?? "";

        return {
          ...previous,
          residentRegNo,
          birthDate,
        };
      }
      // 환자 등록 폼에서 특정 입력값이 변경되었을 때 form 상태를 업데이트하는 함수
      // residentRegNo가 변경되면 주민등록번호를 저장하는 동시에 생년월일도 자동으로 계산해서 birthDate에 저장
      // keyof : 해당 타입이 가지고 있는 속성 이름들을 타입으로 가져오는 TypeScript 연산자
      // K는 제네릭 타입 변수
      // extends : K는 반드시 PatientRegisterFormState의 속성 이름 중 하나여야 한다라고 제한
      // field는 어떤 입력 항목을 변경할 것인지 나타내는 값
      // value는 해당 필드에 새로 저장할 값
      // PatientRegisterFormState[K] : K에 해당하는 PatientRegisterFormState 속성의 타입을 사용
      // previous : 변경하기 전의 기존 form 상태
      // 주민등록번호만 별도로 처리하는 이유는 주민등록번호가 변경되면 birthDate도 같이 변경해야 하기 때문
      // value as string : value를 string 타입으로 취급
      // getBirthDateFromResidentRegNo(residentRegNo) : 주민등록번호를 전달해서 생년월일을 계산
      // ?? : Nullish Coalescing Operator, Null 병합 연산자 : null 또는 undefined이면 오른쪽 값을 사용
      // ...previous : Spread 문법 : 기존 form의 모든 속성을 새로운 객체에 복사
      // 주민등록번호 하나를 입력했는데 residentRegNo와 birthDate 두 상태가 동시에 업데이트되는 것

      return {
        ...previous,
        [field]: value,
      };
    });

    setValidationError(null);

    if (field === "residentRegNo") {
      dispatch(resetPatientRegistration());
    }
  };

  const updateResidentRegNoFront = (value: string) => {
    const front = value.replace(/[^0-9]/g, "").slice(0, 6);

    updateForm("residentRegNo", front);
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
      checkPatientDuplicateRequest({
        residentRegNo: form.residentRegNo,
      }),
    );
  };

  const submitPatient = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.genderCd) {
      setValidationError("Please complete all required fields.");
      return;
    }

    if (
      isTemporaryPatient &&
      !form.tempRegisterReason?.trim()
    ) {
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
        zipCode: form.zipCode.trim(),
        address: form.address.trim(),
        addressDetail: form.addressDetail.trim(),
        phoneNo: normalizedPhoneNo,
      }),
    );
  };

  const cancelForm = () => {
    const hasUnsavedChanges =
      form.patientName.trim() !== "" ||
      form.residentRegNo !== "" ||
      form.birthDate !== "" ||
      form.genderCd !== "" ||
      form.tempPatientYn !== initialForm.tempPatientYn ||
      Boolean(form.tempRegisterReason?.trim()) ||
      form.zipCode !== "" ||
      form.address.trim() !== "" ||
      form.addressDetail.trim() !== "" ||
      form.phoneNo !== "";

    if (
      hasUnsavedChanges &&
      !window.confirm("Your unsaved changes will be lost. Do you want to leave this page?")
    ) {
      return;
    }

    router.push("/reception/patientmanagement");
  };

  const resetForm = () => {
    const hasUnsavedChanges =
      form.patientName.trim() !== "" ||
      form.residentRegNo !== "" ||
      form.birthDate !== "" ||
      form.genderCd !== "" ||
      form.tempPatientYn !== initialForm.tempPatientYn ||
      Boolean(form.tempRegisterReason?.trim()) ||
      form.zipCode !== "" ||
      form.address.trim() !== "" ||
      form.addressDetail.trim() !== "" ||
      form.phoneNo !== "";

    if (
      hasUnsavedChanges &&
      !window.confirm("Do you want to reset all entered information?")
    ) {
      return;
    }

    setForm(initialForm);
    setPatientNameTouched(false);
    setValidationError(null);
    setSubmitted(false);
    dispatch(resetPatientRegistration());
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3">
      <PageHeader title="Register Patient" />

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
      {registeredPatient ? (
        <Alert variant="success">
          Patient registration completed. Patient ID: {registeredPatient.patientId}
        </Alert>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
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
              htmlFor="tempRegisterReason"
            >
              <Input
                id="tempRegisterReason"
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
            htmlFor="patientName"
            hint={isTemporaryPatient ? "A temporary patient name will be generated if left blank." : undefined}
          >
            <Input
              id="patientName"
              value={form.patientName}
              onChange={(event) =>
                updateForm("patientName", event.target.value)
              }
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
            htmlFor="residentRegNo"
          >
            <div className="flex gap-2">
              <Input
                id="residentRegNo"
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
                id="residentRegNoBack"
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
            htmlFor="birthDate"
            hint={
              form.birthDate
                ? "Calculated automatically from the resident registration number."
                : "Enter the resident registration number to calculate automatically."
            }
          >
            <Input
              id="birthDate"
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
              <FormField label="Address" htmlFor="zipCode">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      id="zipCode"
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
                          () => document.getElementById("addressDetail")?.focus(),
                          0,
                        );
                      }}
                    />
                  </div>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(event) => updateForm("address", event.target.value)}
                    disabled={registerLoading}
                    maxLength={300}
                    placeholder="Address"
                    autoComplete="street-address"
                  />
                  <Input
                    id="addressDetail"
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
                htmlFor="phoneNo"
                hint="Enter in 010-1234-5678 format."
              >
                <Input
                  id="phoneNo"
                  value={form.phoneNo}
                  onChange={(event) =>
                    updateForm(
                      "phoneNo",
                      formatPhoneNo(event.target.value),
                    )
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
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={cancelForm}
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
            <Button
              type="submit"
              variant="primary"
              disabled={isRegistrationDisabled}
            >
              {registerLoading ? "Registering..." : "Register"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
