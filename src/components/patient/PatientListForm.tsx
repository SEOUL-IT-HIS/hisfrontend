"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  DataTable,
  Input,
  PageHeader,
  Pagination,
  SearchBar,
  Select,
  type DataTableColumn,
} from "@/components/common";
import { fetchPatientPageRequest } from "@/features/patient/slice/patientSlice";
import { getGenderLabel } from "@/features/patient/util/genderCode";
import { getPatientDisplayName } from "@/features/patient/util/patientName";
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

const getColumns = (returnTo: string): DataTableColumn<PatientListItem>[] => [
  {
    key: "patientName",
    header: "Patient Name",
    render: (patient) => (
      <Link
        href={`/reception/patientmanagement/${patient.patientId}?returnTo=${encodeURIComponent(returnTo)}`}
        className="font-medium text-blue-600 hover:underline"
      >
        {getPatientDisplayName(
          patient.patientName,
          patient.tempPatientNo,
          patient.tempPatientYn,
        )}
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const registeredPatientId = searchParams.get("registeredPatientId");
  const pageParam = Number(searchParams.get("page"));
  const currentPage = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const appliedCondition: PatientSearchCondition = {
    patientName: searchParams.get("patientName") ?? "",
    birthDate: searchParams.get("birthDate") ?? "",
    statusCd: (searchParams.get("statusCd") as PatientStatus | null) ?? undefined,
  };
  const currentQuery = searchParams.toString();
  const listReturnTo = `/reception/patientmanagement${currentQuery ? `?${currentQuery}` : ""}`;
  const dispatch = useDispatch<AppDispatch>();
  const [searchCondition, setSearchCondition] =
    useState<PatientSearchCondition>(initialSearchCondition);
  const { patientPage, pageLoading: listLoading, pageError: listError } = useSelector(
    (state: RootState) => state.patient,
  );

  useEffect(() => {
    setSearchCondition(appliedCondition);
  }, [appliedCondition.patientName, appliedCondition.birthDate, appliedCondition.statusCd]);

  useEffect(() => {
    dispatch(fetchPatientPageRequest({ ...appliedCondition, page: currentPage }));
  }, [dispatch, currentPage, appliedCondition.patientName, appliedCondition.birthDate, appliedCondition.statusCd]);

  const updateListUrl = (condition: PatientSearchCondition, page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    const patientName = condition.patientName?.trim() ?? "";

    if (patientName) params.set("patientName", patientName);
    else params.delete("patientName");

    if (condition.birthDate) params.set("birthDate", condition.birthDate);
    else params.delete("birthDate");

    if (condition.statusCd) params.set("statusCd", condition.statusCd);
    else params.delete("statusCd");

    if (page > 1) params.set("page", String(page));
    else params.delete("page");

    const query = params.toString();
    router.replace(
      query ? `/reception/patientmanagement?${query}` : "/reception/patientmanagement",
      { scroll: false },
    );
  };

  const handleSearch = () => {
    updateListUrl(searchCondition, 1);
  };

  const handleReset = () => {
    setSearchCondition(initialSearchCondition);
    updateListUrl(initialSearchCondition, 1);
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

      {listError ? <div className="space-y-2"><Alert variant="error">{listError}</Alert><Button variant="secondary" onClick={() => dispatch(fetchPatientPageRequest({ ...appliedCondition, page: currentPage }))}>Retry</Button></div> : null}

      <DataTable
        columns={getColumns(listReturnTo)}
        rows={listError ? [] : patientPage.items}
        rowKey={(patient) => patient.patientId}
        loading={listLoading}
        loadingMessage="Loading patients..."
        emptyMessage="No patients found."
        equalColumns
      />
      {!listLoading && !listError ? (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500" aria-live="polite">
            {patientPage.totalElements === 0 ? "0 patients" : `${(patientPage.page - 1) * 15 + 1}–${(patientPage.page - 1) * 15 + patientPage.items.length} of ${patientPage.totalElements} patients`} · 15 per page
          </p>
          <Pagination page={patientPage.page} totalPages={patientPage.totalPages} prevLabel="Previous" nextLabel="Next"
            onPageChange={(page) => updateListUrl(appliedCondition, page)} />
        </div>
      ) : null}
    </div>
  );
}
