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
import {
  formatPhoneNo,
  getBirthDateFromResidentRegNo,
  normalizePhoneNo,
  validatePatientName,
  validatePhoneNo,
  validateZipCode,
} from "@/features/patient/util/patientUtils";
import type { AppDispatch, RootState } from "@/store/store";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import PostcodeSearchButton from "./PostcodeSearchButton";

type PatientRegisterFormState = Omit<PatientRegisterRequest, "genderCd"> & {
  genderCd: GenderCd | "";
};

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
    registerError,
    duplicateCheckError,
  } = useSelector((state: RootState) => state.patient);

  const hasUnsavedChanges =
    form.patientName.trim() !== "" ||
    form.residentRegNo !== "" ||
    form.genderCd !== "" ||
    form.tempPatientYn !== initialForm.tempPatientYn ||
    form.zipCode !== "" ||
    form.address.trim() !== "" ||
    form.addressDetail.trim() !== "" ||
    form.phoneNo !== "";

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
  }, [hasUnsavedChanges, submitted]);

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

    const patientNameError = validatePatientName(form.patientName);
    if (patientNameError) {
      setPatientNameTouched(true);
      setValidationError(patientNameError);
      return;
    }

    const zipCodeError = validateZipCode(form.zipCode);
    if (zipCodeError) {
      setValidationError(zipCodeError);
      return;
    }

    const phoneNoError = validatePhoneNo(form.phoneNo);
    if (phoneNoError) {
      setValidationError(phoneNoError);
      return;
    }

    const normalizedPhoneNo = normalizePhoneNo(form.phoneNo);

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
    if (
      hasUnsavedChanges &&
      !window.confirm("작성 중인 내용이 사라집니다. 이동하시겠습니까?")
    ) {
      return;
    }

    router.push("/reception/patientmanagement");
  };

  const resetForm = () => {
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
      {registerError ? <Alert variant="error">{registerError}</Alert> : null}
      {duplicateCheckError ? (
        <Alert variant="error">{duplicateCheckError}</Alert>
      ) : null}
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
