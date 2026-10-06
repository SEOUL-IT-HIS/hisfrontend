"use client";

import { useEffect , useMemo, useState } from "react";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch , RootState } from "@/store/store";
import {
  fetchBedReservationsRequest,
  selectBedReservations,
  selectBedReservationListStatus,
} from "@/features/inpatient/bedmanagement/bedreservation/slice";
import BedReservationDetail from "@/components/inpatient/bedmanagement/bedreservation/detail";
import { formatDateTime } from "@/features/inpatient/dateLimits";
import { formatBedLabel, formatSexAge } from "@/features/inpatient/displayFormat";
import { Alert, DataTable, PageHeader, type DataTableColumn } from "@/components/common";
import Toolbar from "@/components/inpatient/common/Toolbar";
import type { BedReservationDTO } from "@/features/inpatient/bedmanagement/types";
import LinkButton from "@/components/inpatient/common/LinkButton";

const STATUS_BADGE: Record<string, string> = {
  REQUESTED: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  RESERVED: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  RELEASED: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
  ASSIGNED: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
};

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Pending",
  RESERVED: "Reserved",
  RELEASED: "Released",
  ASSIGNED: "Assigned",
};

type BedReservationListProps = {
  /** 병상관리 홈 탭 안에 끼워 넣을 때 true — 자체 제목/여백을 생략 */
  embedded?: boolean;
};

const BedReservationList = ({ embedded = false }: BedReservationListProps = {}) => {
  const dispatch = useDispatch<AppDispatch>();
  const bedReservations = useSelector(selectBedReservations);
  const listStatus = useSelector(selectBedReservationListStatus);
  const patients = useSelector((state: RootState) => state.patient.patients);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // patientId → 성별/나이 ("F / 34") — 환자 ID 대신 보여줄 값
  const sexAgeByPatientId = useMemo(
    () => new Map(patients.map((patient) => [patient.patientId, formatSexAge(patient.genderCd, patient.birthDate)])),
    [patients],
  );
  const patientNameById = useMemo(() => {
    return new Map(patients.map((patient) => [patient.patientId, patient.patientName]));
  }, [patients]);

  useEffect(() => {
    dispatch(fetchBedReservationsRequest());
    dispatch(fetchPatientListRequest({}));
  }, [dispatch]);

  const columns: DataTableColumn<BedReservationDTO>[] = [
    {
      key: "patient",
      header: "Patient Name",
      render: (r) => (
        <span className="font-medium text-slate-800">
          {r.patientId ? patientNameById.get(r.patientId) ?? "Loading..." : "None"}
        </span>
      ),
    },
    { key: "sexAge", header: "Sex / Age", render: (r) => (r.patientId ? sexAgeByPatientId.get(r.patientId) ?? "-" : "-") },
    { key: "bed", header: "Bed", render: (r) => formatBedLabel(r.bedId) },
    { key: "reserveAt", header: "Reserved At", render: (r) => formatDateTime(r.reserveAt) },
    { key: "expectedAdmissionAt", header: "Expected Admission At", render: (r) => formatDateTime(r.expectedAdmissionAt) },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <span
          className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
            STATUS_BADGE[r.reservationStatusCd] ?? "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
          }`}
        >
          {STATUS_LABEL[r.reservationStatusCd] ?? r.reservationStatusCd}
        </span>
      ),
    },
  ];

  return (
    // 화면 아래까지 꽉 채움 — 목록과 상세 패널이 각자 안에서 스크롤 (홈 탭 안에서는 남은 높이를, 단독 페이지에서는 화면 높이를 채움)
    <div className={`flex min-h-0 flex-col gap-4 ${embedded ? "w-full flex-1" : "mx-auto h-full w-full max-w-[1800px] p-6"}`}>
      {!embedded && (
        <PageHeader title="Bed Reservation List" description="Current status of registered bed reservations." />
      )}

      <Toolbar actions={<LinkButton href="/inpatient/bedmanagement/bedreservation/create">Register Reservation</LinkButton>}>
        <span className="text-sm text-slate-500">{bedReservations.length} reservations</span>
      </Toolbar>

      {listStatus.error && <Alert>{listStatus.error}</Alert>}

      {!listStatus.error && (
        <div className="flex min-h-[480px] flex-1 gap-4">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <DataTable
              columns={columns}
              rows={bedReservations}
              rowKey={(r) => r.bedReservationId}
              onRowClick={(r) => setSelectedId(r.bedReservationId)}
              isRowActive={(r) => r.bedReservationId === selectedId}
              loading={listStatus.loading}
              loadingMessage="Loading..."
              emptyMessage="No reservation data available."
            />
          </div>

          {selectedId !== null && (
            <div className="min-h-0 w-[420px] shrink-0 overflow-y-auto">
              <BedReservationDetail bedReservationId={selectedId} onClose={() => setSelectedId(null)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BedReservationList;
