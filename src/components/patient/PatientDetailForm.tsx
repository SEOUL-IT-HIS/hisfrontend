"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/common";
import { fetchPatientDetailRequest } from "@/features/patient/slice/patientSlice";
import type { AppDispatch, RootState } from "@/store/store";

type PatientDetailFormProps = {
  patientId: number;
};

const formatDateTime = (value: string) =>
  value.replace("T", " ").slice(0, 19);

export default function PatientDetailForm({
  patientId,
}: PatientDetailFormProps) {
  const dispatch = useDispatch<AppDispatch>();

  const {
    patientDetail,
    detailLoading,
    detailError,
  } = useSelector((state: RootState) => state.patient);

  useEffect(() => {
    dispatch(fetchPatientDetailRequest(patientId));
  }, [dispatch, patientId]);

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

      {patientDetail ? (
        <Panel>
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-800">
              {patientDetail.patientName} 환자 정보
            </h2>
          </div>

          <dl className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem
              label="환자번호"
              value={String(patientDetail.patientId)}
            />

            <DetailItem
              label="환자명"
              value={patientDetail.patientName}
            />

            <div>
              <dt className="text-xs font-medium text-slate-400">
                상태
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