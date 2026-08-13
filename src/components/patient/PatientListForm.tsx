"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  DataTable,
  Input,
  PageHeader,
  SearchBar,
  Select,
  type DataTableColumn,
} from "@/components/common";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";
import { getGenderLabel } from "@/features/patient/util/genderCode";
import type {
  PatientListItem,
  PatientSearchCondition,
  PatientStatus,
} from "@/features/patient/type/patientType";
import type { AppDispatch, RootState } from "@/store/store";

const initialSearchCondition: PatientSearchCondition = {
  patientName: "",
  birthDate: "",
  statusCd: undefined,
};

const formatDateTime = (value: string) => value.replace("T", " ").slice(0, 19);

const columns: DataTableColumn<PatientListItem>[] = [
  {
    key: "patientName",
    header: "환자명",
    render: (patient) => (
      <Link
        href={`/reception/patientmanagement/${patient.patientId}`}
        className="font-medium text-blue-600 hover:underline"
      >
        {patient.patientName}
      </Link>
    ),
  },
  {
    key: "residentRegNo",
    header: "주민등록번호",
    render: (patient) => patient.residentRegNo,
  },
  {
    key: "genderCd",
    header: "성별",
    render: (patient) => getGenderLabel(patient.genderCd),
  },
  {
    key: "birthDate",
    header: "생년월일",
    render: (patient) => patient.birthDate,
  },
  {
    key: "statusCd",
    header: "환자관리상태코드",
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
  const [searchCondition, setSearchCondition] =
    useState<PatientSearchCondition>(initialSearchCondition);
  const { patients, listLoading, listError } = useSelector(
    (state: RootState) => state.patient,
  );

  useEffect(() => {
    dispatch(fetchPatientListRequest({}));
  }, [dispatch]);

  const handleSearch = () => {
    dispatch(fetchPatientListRequest(searchCondition));
  };

  const handleReset = () => {
    setSearchCondition(initialSearchCondition);
    dispatch(fetchPatientListRequest({}));
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3">
      <PageHeader
        title="환자관리"
        actions={
          <Link href="/reception/patientmanagement/register">
            <Button variant="primary">환자등록</Button>
          </Link>
        }
      />

      <SearchBar
        onSearch={handleSearch}
        onReset={handleReset}
        searchLabel="검색"
        resetLabel="초기화"
      >
        <div className="w-52">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            환자명
          </label>

          <Input
            value={searchCondition.patientName ?? ""}
            placeholder="환자명 입력"
            onChange={(event) =>
              setSearchCondition((previous) => ({
                ...previous,
                patientName: event.target.value,
              }))
            }
          />
        </div>

        <div className="w-44">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            생년월일
          </label>

          <Input
            type="date"
            value={searchCondition.birthDate ?? ""}
            onChange={(event) =>
              setSearchCondition((previous) => ({
                ...previous,
                birthDate: event.target.value,
              }))
            }
          />
        </div>

        <div className="w-36">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            환자 상태
          </label>

          <Select
            value={searchCondition.statusCd ?? ""}
            placeholder="전체"
            options={[
              { value: "ACTIVE", label: "활성" },
              { value: "INACTIVE", label: "비활성" },
            ]}
            onChange={(event) =>
              setSearchCondition((previous) => ({
                ...previous,
                statusCd:
                  event.target.value === ""
                    ? undefined
                    : (event.target.value as PatientStatus),
              }))
            }
          />
        </div>
      </SearchBar>

      {registeredPatientId ? (
        <Alert variant="success">
          환자 등록이 완료되었습니다. 환자 ID: {registeredPatientId}
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
