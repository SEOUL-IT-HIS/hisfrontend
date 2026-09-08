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
    header: "Patient Name",
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
    header: "Resident Registration Number",
    render: (patient) => patient.residentRegNo,
  },
  {
    key: "genderCd",
    header: "Gender",
    render: (patient) => getGenderLabel(patient.genderCd),
  },
  {
    key: "birthDate",
    header: "Date of Birth",
    render: (patient) => patient.birthDate ?? "-",
  },

  {
    key: "statusCd",
    header: "Patient Status",
    render: (patient) =>
      patient.statusCd === "ACTIVE" ? "Active" : "Inactive",
  },
  {
    key: "tempPatientYn",
    header: "Patient Type",
    render: (patient) => (
      <div className="flex flex-wrap gap-1">
        {patient.tempPatientYn === "Y" ? (
          <span className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
            Temporary
          </span>
        ) : null}
        {patient.deathYn === "Y" ? (
          <span className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
            Deceased
          </span>
        ) : null}
        {patient.tempPatientYn !== "Y" && patient.deathYn !== "Y"
          ? "-"
          : null}
      </div>
    ),
  },
  {
    key: "createdAt",
    header: "Registered At",
    render: (patient) => formatDateTime(patient.createdAt),
  },
  {
    key: "updatedAt",
    header: "Updated At",
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
        title="Patient Management"
        actions={
          <Link href="/reception/patientmanagement/register">
            <Button variant="primary">Register Patient</Button>
          </Link>
        }
      />

      <SearchBar
        onSearch={handleSearch}
        onReset={handleReset}
        searchLabel="Search"
        resetLabel="Reset"
      >
        <div className="w-52">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Patient Name
          </label>

          <Input
            value={searchCondition.patientName ?? ""}
            placeholder="Enter patient name"
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
            Date of Birth
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
            Patient Status
          </label>

          <Select
            value={searchCondition.statusCd ?? ""}
            placeholder="All"
            options={[
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
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
          Patient registration completed. Patient ID: {registeredPatientId}
        </Alert>
      ) : null}

      {listError ? <Alert variant="error">{listError}</Alert> : null}

      <DataTable
        columns={columns}
        rows={patients}
        rowKey={(patient) => patient.patientId}
        loading={listLoading}
        loadingMessage="Loading patients..."
        emptyMessage="No patients found."
        equalColumns
      />
    </div>
  );
}
