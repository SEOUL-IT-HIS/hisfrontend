"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  Input,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/common";
import {
  fetchPatientDetailRequest,
  resetPatientUpdate,
  updatePatientRequest,
} from "@/features/patient/slice/patientSlice";
import { getGenderLabel } from "@/features/patient/util/genderCode";
import type { AppDispatch, RootState } from "@/store/store";

type PatientDetailFormProps = {
  patientId: string;
};

const formatDateTime = (value: string) =>
  value.replace("T", " ").slice(0, 19);

export default function PatientDetailForm({
  patientId,
}: PatientDetailFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [editing, setEditing] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [validationError, setValidationError] =
  useState<string | null>(null);
  const {
  patientDetail,
  detailLoading,
  detailError,
  updateLoading,
  updateError,
  updateSuccess,
} = useSelector((state: RootState) => state.patient);

const isEditing = editing && !updateSuccess;

useEffect(() => {
  dispatch(resetPatientUpdate());
  dispatch(fetchPatientDetailRequest(patientId));
}, [dispatch, patientId]);

const startEditing = () => {
  if (!patientDetail) {
    return;
  }

  setPatientName(patientDetail.patientName);
  setValidationError(null);
  dispatch(resetPatientUpdate());
  setEditing(true);
};

const cancelEditing = () => {
  if (!patientDetail) {
    return;
  }

  setPatientName(patientDetail.patientName);
  setValidationError(null);
  dispatch(resetPatientUpdate());
  setEditing(false);
};

const submitUpdate = (
  event: React.FormEvent<HTMLFormElement>,
) => {
  event.preventDefault();

  const normalizedPatientName = patientName.trim();

  if (
    normalizedPatientName.length < 2 ||
    normalizedPatientName.length > 100
  ) {
    setValidationError(
      "환자명은 2자 이상 100자 이하로 입력해 주세요.",
    );
    return;
  }

  if (
    patientDetail &&
    normalizedPatientName === patientDetail.patientName
  ) {
    setValidationError("변경된 환자명이 없습니다.");
    return;
  }

  setValidationError(null);

  dispatch(
    updatePatientRequest({
      patientId,
      patientName: normalizedPatientName,
    }),
  );
};

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3">
      <PageHeader
        title="환자 상세"
        actions={
          <Link href="/reception/patientmanagement">
            <Button>목록으로</Button>
          </Link>
        }
      />

      {detailLoading ? (
        <Alert>환자 정보를 불러오는 중입니다...</Alert>
      ) : null}

      {detailError ? (
        <Alert variant="error">{detailError}</Alert>
      ) : null}

      {validationError ? (
      <Alert variant="error">{validationError}</Alert>
      ) : null}

      {updateError ? (
      <Alert variant="error">{updateError}</Alert>
       ) : null}

      {updateSuccess ? (
     <Alert variant="success">
      환자 정보가 수정되었습니다.
     </Alert>
     ) : null}

      {patientDetail ? (
  <Panel>
    <form onSubmit={submitUpdate}>
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-800">
          {patientDetail.patientName} 환자 정보
        </h2>

        {!isEditing ? (
          <Button
            type="button"
            variant="secondary"
            onClick={startEditing}
          >
            수정
          </Button>
        ) : null}
      </div>

      <dl className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
        <DetailItem
          label="환자 ID"
          value={String(patientDetail.patientId)}
        />

        {isEditing ? (
          <div>
            <dt className="text-xs font-medium text-slate-400">
              환자명
            </dt>

            <dd className="mt-1">
              <Input
                id="patientName"
                value={patientName}
                onChange={(event) => {
                  setPatientName(event.target.value);
                  setValidationError(null);
                }}
                minLength={2}
                maxLength={100}
                disabled={updateLoading}
                autoFocus
                autoComplete="name"
              />
            </dd>
          </div>
        ) : (
          <DetailItem
            label="환자명"
            value={patientDetail.patientName}
          />
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
          label="주민등록번호"
          value={patientDetail.residentRegNo}
        />

        <DetailItem
          label="성별"
          value={getGenderLabel(patientDetail.genderCd)}
        />

        <DetailItem
          label="생년월일"
          value={patientDetail.birthDate}
        />

        <DetailItem
          label="등록일시"
          value={formatDateTime(patientDetail.createdAt)}
        />

        <DetailItem
          label="수정일시"
          value={formatDateTime(patientDetail.updatedAt)}
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
  </Panel>
) : null}
    </div>
  );
}

type DetailItemProps = {
  label: string;
  value: string;
};

function DetailItem({
  label,
  value,
}: DetailItemProps) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-400">
        {label}
      </dt>

      <dd className="mt-1 text-sm font-medium text-slate-800">
        {value}
      </dd>
    </div>
  );
}
