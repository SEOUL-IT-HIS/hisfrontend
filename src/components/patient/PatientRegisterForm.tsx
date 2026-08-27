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

type PatientRegisterFormState = Omit<PatientRegisterRequest, "genderCd"> & {
  genderCd: GenderCd | "";
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

const initialForm: PatientRegisterFormState = {
  patientName: "",
  birthDate: "",
  residentRegNo: "",
  genderCd: "",
  tempPatientYn: "N",
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

  const residentRegNoError =
    form.residentRegNo.length === 0
      ? null
      : form.residentRegNo.length < 13
        ? "주민등록번호 13자리를 입력해 주세요."
        : getBirthDateFromResidentRegNo(form.residentRegNo) === null
          ? "올바른 주민등록번호 형식이 아닙니다."
          : null;

  const registrationDisabledReason = registerLoading
    ? null
    : duplicateCheckLoading
      ? "주민등록번호 중복 확인 중입니다."
      : !form.patientName.trim() ||
        !form.residentRegNo ||
        !form.birthDate ||
        !form.genderCd
        ? "필수 항목을 모두 입력해 주세요."
        : form.patientName.trim().length < 2 ||
          form.patientName.trim().length > 100
          ? "환자명은 2자 이상 100자 이하로 입력해 주세요."
          : residentRegNoError
            ? residentRegNoError
            : duplicated === null
              ? "등록하려면 주민등록번호 중복확인을 완료해 주세요."
              : duplicated
                ? "이미 등록된 주민등록번호입니다."
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
      setValidationError("주민등록번호 13자리를 입력해 주세요.");
      return;
    }

    if (getBirthDateFromResidentRegNo(form.residentRegNo) === null) {
      setValidationError("올바른 주민등록번호 형식이 아닙니다.");
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

    if (
      !form.patientName.trim() ||
      !form.birthDate ||
      !form.residentRegNo.trim() ||
      !form.genderCd
    ) {
      setValidationError("모든 필수 항목을 입력해 주세요.");
      return;
    }

    if (
      form.patientName.trim().length < 2 ||
      form.patientName.trim().length > 100
    ) {
      setPatientNameTouched(true);
      setValidationError("환자명은 2자 이상 100자 이하로 입력해 주세요.");
      return;
    }

    if (form.zipCode && !/^\d{5}$/.test(form.zipCode)) {
      setValidationError("우편번호는 숫자 5자리로 입력해 주세요.");
      return;
    }

    const normalizedPhoneNo = form.phoneNo.replace(/[^0-9]/g, "");

    if (normalizedPhoneNo && !/^\d{9,11}$/.test(normalizedPhoneNo)) {
      setValidationError("연락처는 숫자 9~11자리로 입력해 주세요.");
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
        genderCd: form.genderCd as GenderCd,
        tempPatientYn: form.tempPatientYn,
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
      form.zipCode !== "" ||
      form.address.trim() !== "" ||
      form.addressDetail.trim() !== "" ||
      form.phoneNo !== "";

    if (
      hasUnsavedChanges &&
      !window.confirm("작성 중인 내용이 사라집니다. 이동하시겠습니까?")
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
      form.zipCode !== "" ||
      form.address.trim() !== "" ||
      form.addressDetail.trim() !== "" ||
      form.phoneNo !== "";

    if (
      hasUnsavedChanges &&
      !window.confirm("입력한 내용을 모두 초기화하시겠습니까?")
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
          환자 등록이 완료되었습니다. 환자 ID : {registeredPatient.patientId}
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
              onBlur={() => setPatientNameTouched(true)}
              disabled={registerLoading}
              autoComplete="name"
            />

            {patientNameTouched && !form.patientName.trim() ? (
              <p className="text-sm text-red-600">환자명을 입력해 주세요.</p>
            ) : patientNameTouched &&
              (form.patientName.trim().length < 2 ||
                form.patientName.trim().length > 100) ? (
              <p className="text-sm text-red-600">
                환자명은 2자 이상 100자 이하로 입력해 주세요.
              </p>
            ) : null}
          </FormField>

          <FormField label="주민등록번호" required htmlFor="residentRegNo">
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
                placeholder="앞 6자리"
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
                placeholder="뒤 7자리"
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
                {duplicateCheckLoading ? "확인 중…" : "중복 확인"}
              </Button>
            </div>
            {residentRegNoError ? (
              <span className="text-xs text-rose-600" role="alert">
                {residentRegNoError}
              </span>
            ) : null}
          </FormField>

          <FormField
            label="생년월일"
            required
            htmlFor="birthDate"
            hint={
              form.birthDate
                ? "주민등록번호에서 자동으로 계산되었습니다."
                : "주민등록번호를 입력하면 자동으로 계산됩니다."
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

          <FormField label="성별" required>
            <Select
              name="genderCd"
              value={form.genderCd}
              onChange={(event) =>
                updateForm("genderCd", event.target.value as GenderCd | "")
              }
              options={genderCodes.options}
              placeholder="성별 선택"
              disabled={registerLoading || genderCodes.loading}
            />
            {genderCodes.error ? (
              <span className="text-xs text-rose-500">{genderCodes.error}</span>
            ) : null}
          </FormField>

          <FormField label="환자 구분">
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
              임시환자로 등록
            </label>

            <p className="mt-1 text-xs text-slate-500">
              신원 확인 전 임시 등록이 필요한 환자에게 사용합니다.
            </p>
          </FormField>

          <div className="border-t border-slate-200 pt-4">
            <h2 className="mb-4 text-base font-semibold text-slate-800">
              주소 및 연락처
            </h2>

            <div className="space-y-4">
              <FormField label="주소" htmlFor="zipCode">
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
                      placeholder="우편번호"
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
                    placeholder="기본주소"
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
                    placeholder="상세주소를 입력하세요 (예: 101동 202호)"
                    autoComplete="address-line2"
                  />
                  <p className="text-xs text-slate-400">
                    우편번호는 숫자 5자리로 입력해 주세요.
                  </p>
                </div>
              </FormField>

              <FormField
                label="연락처"
                htmlFor="phoneNo"
                hint="010-1234-5678 형식으로 입력해 주세요."
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
              취소
            </Button>

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
              disabled={isRegistrationDisabled}
            >
              {registerLoading ? "등록 중…" : "등록"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
