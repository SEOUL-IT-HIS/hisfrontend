"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  FormField,
  Input,
  PageHeader,
  Panel,
  Select,
  StatusBadge,
} from "@/components/common";
import {
  deactivatePatientRequest,
  fetchPatientDetailRequest,
  resetPatientDeactivation,
  resetPatientDeathUpdate,
  resetPatientUpdate,
  updatePatientDeathRequest,
  updatePatientRequest,
} from "@/features/patient/slice/patientSlice";
import {
  formatPatientDateTime,
  formatPhoneNo,
  getGenderLabel,
  normalizePhoneNo,
  validatePatientName,
  validatePhoneNo,
  validateZipCode,
} from "@/features/patient/util/patientUtils";
import type { PatientDetail, Yn } from "@/features/patient/type/patientType";
import type { AppDispatch, RootState } from "@/store/store";
import PostcodeSearchButton from "./PostcodeSearchButton";

type PatientDetailFormProps = {
  patientId: string;
};

type PatientEditForm = {
  patientName: string;
  zipCode: string;
  address: string;
  addressDetail: string;
  phoneNo: string;
};

type PatientDeathForm = {
  deathYn: Yn;
  deathDtm: string;
};

const emptyEditForm: PatientEditForm = {
  patientName: "",
  zipCode: "",
  address: "",
  addressDetail: "",
  phoneNo: "",
};

const emptyDeathForm: PatientDeathForm = {
  deathYn: "N",
  deathDtm: "",
};

function createEditForm(patient: PatientDetail): PatientEditForm {
  return {
    patientName: patient.patientName,
    zipCode: patient.zipCode ?? "",
    address: patient.address ?? "",
    addressDetail: patient.addressDetail ?? "",
    phoneNo: formatPhoneNo(patient.phoneNo ?? ""),
  };
}

export default function PatientDetailForm({
  patientId,
}: PatientDetailFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<PatientEditForm>(emptyEditForm);
  const [deathEditing, setDeathEditing] = useState(false);
  const [deathForm, setDeathForm] =
    useState<PatientDeathForm>(emptyDeathForm);
  const [validationError, setValidationError] = useState<string | null>(null);
  const {
    patientDetail,
    detailLoading,
    detailError,
    updateLoading,
    updateError,
    updateSuccess,
    deactivateLoading,
    deactivateError,
    deactivateSuccess,
    deathUpdateLoading,
    deathUpdateError,
    deathUpdateSuccess,
  } = useSelector((state: RootState) => state.patient);

  const isEditing = editing && !updateSuccess;

  const updateEditForm = <K extends keyof PatientEditForm>(
    field: K,
    value: PatientEditForm[K],
  ) => {
    setEditForm((previous) => ({ ...previous, [field]: value }));
    setValidationError(null);
  };

  useEffect(() => {
    dispatch(resetPatientUpdate());
    dispatch(resetPatientDeactivation());
    dispatch(resetPatientDeathUpdate());
    dispatch(fetchPatientDetailRequest(patientId));
  }, [dispatch, patientId]);

  const startEditing = () => {
    if (!patientDetail) {
      return;
    }

    setEditForm(createEditForm(patientDetail));
    setValidationError(null);
    dispatch(resetPatientUpdate());
    dispatch(resetPatientDeactivation());
    setEditing(true);
  };

  const cancelEditing = () => {
    if (!patientDetail) {
      return;
    }

    setEditForm(createEditForm(patientDetail));
    setValidationError(null);
    dispatch(resetPatientUpdate());
    setEditing(false);
  };

  const startDeathEditing = () => {
    if (!patientDetail) {
      return;
    }

    setDeathForm({
      deathYn: patientDetail.deathYn,
      deathDtm: patientDetail.deathDtm
        ? patientDetail.deathDtm.slice(0, 16)
        : "",
    });

    dispatch(resetPatientDeathUpdate());
    setDeathEditing(true);
  };

  const cancelDeathEditing = () => {
    setDeathEditing(false);
    dispatch(resetPatientDeathUpdate());
  };

  const deactivatePatient = () => {
    if (
      !patientDetail ||
      patientDetail.statusCd === "INACTIVE" ||
      deactivateLoading
    ) {
      return;
    }

    const confirmed = window.confirm(
      "환자를 비활성화하시겠습니까?\n비활성화된 환자는 신규 접수에 사용할 수 없습니다.",
    );

    if (!confirmed) {
      return;
    }

    dispatch(resetPatientUpdate());
    dispatch(resetPatientDeactivation());

    dispatch(
      deactivatePatientRequest({
        patientId,
      }),
    );
  };

  const submitUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedPatientName = editForm.patientName.trim();
    const normalizedZipCode = editForm.zipCode.trim();
    const normalizedAddress = editForm.address.trim();
    const normalizedAddressDetail = editForm.addressDetail.trim();
    const normalizedPhoneNo = normalizePhoneNo(editForm.phoneNo);

    const patientNameError = validatePatientName(normalizedPatientName);
    if (patientNameError) {
      setValidationError(patientNameError);
      return;
    }

    const zipCodeError = validateZipCode(normalizedZipCode);
    if (zipCodeError) {
      setValidationError(zipCodeError);
      return;
    }

    const phoneNoError = validatePhoneNo(normalizedPhoneNo);
    if (phoneNoError) {
      setValidationError(phoneNoError);
      return;
    }

    const hasChanges =
      patientDetail &&
      (normalizedPatientName !== patientDetail.patientName ||
        normalizedZipCode !== (patientDetail.zipCode ?? "") ||
        normalizedAddress !== (patientDetail.address ?? "") ||
        normalizedAddressDetail !== (patientDetail.addressDetail ?? "") ||
        normalizedPhoneNo !== (patientDetail.phoneNo ?? ""));

    if (!hasChanges) {
      setValidationError("변경된 환자 정보가 없습니다.");
      return;
    }

    setValidationError(null);

    dispatch(
      updatePatientRequest({
        patientId,
        patientName: normalizedPatientName,
        zipCode: normalizedZipCode,
        address: normalizedAddress,
        addressDetail: normalizedAddressDetail,
        phoneNo: normalizedPhoneNo,
      }),
    );
  };

  const submitDeathUpdate = () => {
    if (deathForm.deathYn === "Y" && !deathForm.deathDtm) {
      window.alert("사망일시를 입력해 주세요.");
      return;
    }

    if (
      deathForm.deathYn === "Y" &&
      new Date(deathForm.deathDtm).getTime() > Date.now()
    ) {
      window.alert("사망일시는 미래일 수 없습니다.");
      return;
    }

    const confirmed = window.confirm(
      deathForm.deathYn === "Y"
        ? "사망 정보를 등록하시겠습니까?"
        : "등록된 사망 정보를 해제하시겠습니까?",
    );

    if (!confirmed) {
      return;
    }

    dispatch(
      updatePatientDeathRequest({
        patientId,
        deathYn: deathForm.deathYn,
        deathDtm:
          deathForm.deathYn === "Y" ? `${deathForm.deathDtm}:00` : null,
      }),
    );
    setDeathEditing(false);
  };

  return (
    <div className="flex min-h-full flex-col gap-3 p-3">
      <PageHeader
        title="환자 상세"
        actions={
          <Link href="/reception/patientmanagement">
            <Button>목록으로</Button>
          </Link>
        }
      />

      {detailLoading ? <Alert>환자 정보를 불러오는 중입니다...</Alert> : null}

      {detailError ? <Alert variant="error">{detailError}</Alert> : null}

      {validationError ? (
        <Alert variant="error">{validationError}</Alert>
      ) : null}

      {updateError ? <Alert variant="error">{updateError}</Alert> : null}

      {updateSuccess ? (
        <Alert variant="success">환자 정보가 수정되었습니다.</Alert>
      ) : null}

      {deactivateError ? (
        <Alert variant="error">{deactivateError}</Alert>
      ) : null}

      {deactivateSuccess ? (
        <Alert variant="success">환자가 비활성화되었습니다.</Alert>
      ) : null}

      {deathUpdateError ? (
        <Alert variant="error">{deathUpdateError}</Alert>
      ) : null}

      {deathUpdateSuccess ? (
        <Alert variant="success">사망정보가 수정되었습니다.</Alert>
      ) : null}

      {patientDetail ? (
        <Panel>
          <form onSubmit={submitUpdate}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-800">
                {patientDetail.patientName} 환자 정보
              </h2>

              {!isEditing ? (
                <div className="flex gap-2">
                  {patientDetail.statusCd === "ACTIVE" ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={deactivatePatient}
                      disabled={deactivateLoading}
                    >
                      {deactivateLoading ? "처리 중..." : "비활성화"}
                    </Button>
                  ) : null}

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={startEditing}
                    disabled={deactivateLoading}
                  >
                    수정
                  </Button>
                </div>
              ) : null}
            </div>

            <dl className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem
                label="환자 ID"
                value={String(patientDetail.patientId)}
              />

              {isEditing ? (
                <div>
                  <dt className="text-xs font-medium text-slate-400">환자명</dt>

                  <dd className="mt-1">
                    <Input
                      id="patientName"
                      value={editForm.patientName}
                      onChange={(event) =>
                        updateEditForm("patientName", event.target.value)
                      }
                      minLength={2}
                      maxLength={100}
                      disabled={updateLoading}
                      autoFocus
                      autoComplete="name"
                    />
                  </dd>
                </div>
              ) : (
                <DetailItem label="환자명" value={patientDetail.patientName} />
              )}

              <div>
                <dt className="text-xs font-medium text-slate-400">
                  환자관리상태코드
                </dt>

                <dd className="mt-1">
                  <StatusBadge
                    value={
                      patientDetail.statusCd === "ACTIVE"
                        ? "active"
                        : "inactive"
                    }
                    activeLabel="활성"
                    inactiveLabel="비활성"
                  />
                </dd>
              </div>

              <DetailItem
                label="사망 여부"
                value={patientDetail.deathYn === "Y" ? "사망" : "사망정보 없음"}
              />

              {patientDetail.deathYn === "Y" ? (
                <DetailItem
                  label="사망일시"
                  value={
                    patientDetail.deathDtm
                      ? formatPatientDateTime(patientDetail.deathDtm)
                      : "-"
                  }
                />
              ) : null}

              <DetailItem
                label="주민등록번호"
                value={patientDetail.residentRegNo}
              />

              <DetailItem
                label="성별"
                value={getGenderLabel(patientDetail.genderCd)}
              />

              <DetailItem label="생년월일" value={patientDetail.birthDate} />

              {isEditing ? (
                <div className="sm:col-span-2 lg:col-span-3">
                  <FormField label="주소" htmlFor="zipCode">
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          id="zipCode"
                          value={editForm.zipCode}
                          onChange={(event) =>
                            updateEditForm(
                              "zipCode",
                              event.target.value
                                .replace(/[^0-9]/g, "")
                                .slice(0, 5),
                            )
                          }
                          disabled={updateLoading}
                          inputMode="numeric"
                          maxLength={5}
                          placeholder="우편번호"
                          autoComplete="postal-code"
                        />
                        <PostcodeSearchButton
                          disabled={updateLoading}
                          onSelect={(result) => {
                            setEditForm((previous) => ({
                              ...previous,
                              zipCode: result.zipCode,
                              address: result.address,
                            }));
                            setValidationError(null);
                            window.setTimeout(
                              () =>
                                document
                                  .getElementById("addressDetail")
                                  ?.focus(),
                              0,
                            );
                          }}
                        />
                      </div>
                      <Input
                        id="address"
                        value={editForm.address}
                        onChange={(event) =>
                          updateEditForm("address", event.target.value)
                        }
                        disabled={updateLoading}
                        maxLength={300}
                        placeholder="기본주소"
                        autoComplete="street-address"
                      />
                      <Input
                        id="addressDetail"
                        value={editForm.addressDetail}
                        onChange={(event) =>
                          updateEditForm("addressDetail", event.target.value)
                        }
                        disabled={updateLoading}
                        maxLength={300}
                        placeholder="상세주소를 입력하세요 (예: 101동 202호)"
                        autoComplete="address-line2"
                      />
                      <p className="text-xs text-slate-400">
                        우편번호는 숫자 5자리로 입력해 주세요.
                      </p>
                    </div>
                  </FormField>
                </div>
              ) : (
                <>
                  <DetailItem label="우편번호" value={patientDetail.zipCode ?? "-"} />
                  <DetailItem label="기본주소" value={patientDetail.address ?? "-"} />
                  <DetailItem
                    label="상세주소"
                    value={patientDetail.addressDetail ?? "-"}
                  />
                </>
              )}

              {isEditing ? (
                <div>
                  <dt className="text-xs font-medium text-slate-400">연락처</dt>
                  <dd className="mt-1">
                    <Input
                      id="phoneNo"
                      value={editForm.phoneNo}
                      onChange={(event) =>
                        updateEditForm(
                          "phoneNo",
                          formatPhoneNo(event.target.value),
                        )
                      }
                      disabled={updateLoading}
                      inputMode="tel"
                      maxLength={13}
                      placeholder="010-1234-5678"
                      autoComplete="tel"
                    />
                  </dd>
                </div>
              ) : (
                <DetailItem
                  label="연락처"
                  value={
                    patientDetail.phoneNo
                      ? formatPhoneNo(patientDetail.phoneNo)
                      : "-"
                  }
                />
              )}

              <DetailItem
                label="등록일시"
                value={formatPatientDateTime(patientDetail.createdAt)}
              />

              <DetailItem
                label="수정일시"
                value={formatPatientDateTime(patientDetail.updatedAt)}
              />
            </dl>

            {isEditing ? (
              <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cancelEditing}
                  disabled={updateLoading}
                >
                  취소
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={updateLoading}
                >
                  {updateLoading ? "저장 중..." : "저장"}
                </Button>
              </div>
            ) : null}
          </form>

          <div className="border-t border-slate-200">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-base font-semibold text-slate-800">
                사망정보 관리
              </h2>

              {!deathEditing ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={startDeathEditing}
                  disabled={deathUpdateLoading}
                >
                  사망정보 수정
                </Button>
              ) : null}
            </div>

            <div className="grid gap-4 border-t border-slate-100 p-5 sm:grid-cols-2">
              {deathEditing ? (
                <>
                  <FormField label="사망 여부" required>
                    <Select
                      value={deathForm.deathYn}
                      options={[
                        { value: "N", label: "사망정보 없음" },
                        { value: "Y", label: "사망" },
                      ]}
                      onChange={(event) => {
                        const value = event.target.value as "Y" | "N";

                        setDeathForm((previous) => ({
                          ...previous,
                          deathYn: value,
                          deathDtm: value === "N" ? "" : previous.deathDtm,
                        }));
                      }}
                      disabled={deathUpdateLoading}
                    />
                  </FormField>

                  <FormField
                    label="사망일시"
                    required={deathForm.deathYn === "Y"}
                  >
                    <Input
                      type="datetime-local"
                      value={deathForm.deathDtm}
                      onChange={(event) =>
                        setDeathForm((previous) => ({
                          ...previous,
                          deathDtm: event.target.value,
                        }))
                      }
                      disabled={
                        deathForm.deathYn === "N" || deathUpdateLoading
                      }
                    />
                  </FormField>

                  <div className="flex justify-end gap-2 sm:col-span-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={cancelDeathEditing}
                      disabled={deathUpdateLoading}
                    >
                      취소
                    </Button>

                    <Button
                      type="button"
                      variant="primary"
                      onClick={submitDeathUpdate}
                      disabled={deathUpdateLoading}
                    >
                      {deathUpdateLoading ? "저장 중..." : "저장"}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <DetailItem
                    label="사망 여부"
                    value={
                      patientDetail.deathYn === "Y" ? "사망" : "사망정보 없음"
                    }
                  />

                  <DetailItem
                    label="사망일시"
                    value={
                      patientDetail.deathDtm
                        ? formatPatientDateTime(patientDetail.deathDtm)
                        : "-"
                    }
                  />
                </>
              )}
            </div>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

type DetailItemProps = {
  label: string;
  value: string;
};

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-400">{label}</dt>

      <dd className="mt-1 text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}
