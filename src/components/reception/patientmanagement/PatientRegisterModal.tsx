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
  PatientStatus,
} from "@/features/patient/type/patientType";
import type { AppDispatch, RootState } from "@/store/store";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";

/**
 * 접수관리 전용 환자 등록 모달
 * - src/components/patient/PatientRegisterForm.tsx (환자관리 서비스 소유) 는 건드리지 않는다.
 * - 등록/중복확인은 그 화면과 같은 features/patient 의 Redux 액션을 그대로 재사용하고,
 *   등록 성공 후 동작(페이지 이동 대신 콜백 호출)만 다르게 구현한 별도 컴포넌트다.
 */

const patientStatusOptions = [
  { value: "ACTIVE", label: "활성(ACTIVE)" },
  { value: "INACTIVE", label: "비활성(INACTIVE)" },
];

type PatientRegisterFormState = Omit<PatientRegisterRequest, "genderCd"> & {
  genderCd: GenderCd | "";
};

const initialForm: PatientRegisterFormState = {
  patientName: "",
  birthDate: "",
  residentRegNo: "",
  genderCd: "",
  statusCd: "ACTIVE",
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
          !form.genderCd ||
          !form.statusCd
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
      setValidationError("주민등록번호 13자리를 입력해 주세요.");
      return;
    }
    if (getBirthDateFromResidentRegNo(form.residentRegNo) === null) {
      setValidationError("올바른 주민등록번호 형식이 아닙니다.");
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
      !form.genderCd ||
      !form.statusCd.trim()
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
        statusCd: form.statusCd,
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
        !window.confirm("작성 중인 내용이 사라집니다. 닫으시겠습니까?"))
    ) {
      return;
    }

    dispatch(resetPatientRegistration());
    onClose();
  }

  return (
    <Modal
      open={open}
      title="환자 등록"
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
          <Alert variant="success">등록 가능한 주민등록번호입니다.</Alert>
        </div>
      ) : null}
      {duplicated === true ? (
        <div className="mb-3">
          <Alert variant="error">이미 등록된 주민등록번호입니다.</Alert>
        </div>
      ) : null}

      <form onSubmit={submitPatient} className="space-y-4">
        <FormField label="환자명" required htmlFor="modalPatientName">
          <Input
            id="modalPatientName"
            value={form.patientName}
            onChange={(event) => updateForm("patientName", event.target.value)}
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

        <FormField label="주민등록번호" required htmlFor="modalResidentRegNo">
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
              placeholder="앞 6자리"
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
          htmlFor="modalBirthDate"
          hint={
            form.birthDate
              ? "주민등록번호에서 자동으로 계산되었습니다."
              : "주민등록번호를 입력하면 자동으로 계산됩니다."
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
        </FormField>

        <FormField label="환자상태관리코드" required htmlFor="modalStatusCd">
          <Select
            id="modalStatusCd"
            value={form.statusCd}
            options={patientStatusOptions}
            onChange={(event) =>
              updateForm("statusCd", event.target.value as PatientStatus)
            }
            disabled={registerLoading}
          />
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
            취소
          </Button>
          <Button type="submit" variant="primary" disabled={isRegistrationDisabled}>
            {registerLoading ? "등록 중…" : "등록"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
