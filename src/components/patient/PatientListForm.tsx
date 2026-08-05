"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  DataTable,
  PageHeader,
  type DataTableColumn,
} from "@/components/common";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";
import type { PatientListItem } from "@/features/patient/type/patientType";
import type { AppDispatch, RootState } from "@/store/store";

const formatDateTime = (value: string) =>
  value.replace("T", " ").slice(0, 19);

const columns: DataTableColumn<PatientListItem>[] = [
  {
    key: "patientName",
    header: "환자명",
    render: (patient) => patient.patientName,
  },
  {
    key: "residentRegNo",
    header: "주민등록번호",
    render: (patient) => patient.residentRegNo,
  },
  {
    key: "birthDate",
    header: "생년월일",
    render: (patient) => patient.birthDate,
  },
  {
    key: "statusCd",
    header: "상태",
    render: (patient) => patient.statusCd,
  },
  {
    key: "createdAt",
    header: "등록일시",
    render: (patient) => formatDateTime(patient.createdAt),
  },
  {
    key: "updatedAt",
    header: "수정일시",
    render: (patient) => formatDateTime(patient.updatedAt),
  },
];

export default function PatientListForm() {
  const searchParams = useSearchParams();
  const registeredPatientId = searchParams.get("registeredPatientId");
  const dispatch = useDispatch<AppDispatch>();
  const { patients, listLoading, listError } = useSelector(
    (state: RootState) => state.patient,
  );

  useEffect(() => {
    dispatch(fetchPatientListRequest());
  }, [dispatch]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3">
      <PageHeader
        title="환자관리"
        actions={
          <Link href="/patient/register">
            <Button variant="primary">환자등록</Button>
          </Link>
        }
      />

      {registeredPatientId ? (
      <Alert variant="success">
       환자 등록이 완료되었습니다. 환자번호: {registeredPatientId}
      </Alert>
      ) : null}

      {listError ? <Alert variant="error">{listError}</Alert> : null}

      <DataTable
        columns={columns}
        rows={patients}
        rowKey={(patient) => patient.patientId}
        loading={listLoading}
        loadingMessage="환자 목록을 불러오는 중입니다..."
        emptyMessage="조회된 환자가 없습니다."
        equalColumns
      />
    </div>
  );
}