"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch , RootState } from "@/store/store";
import {
  fetchBedReservationsRequest,
  updateBedReservationRequest,
  deleteBedReservationRequest,
  selectBedReservations,
  selectBedReservationListStatus,
} from "@/features/inpatient/bedmanagement/bedreservation/slice";
import BedReservationDetail from "@/components/inpatient/bedmanagement/bedreservation/detail";
import { formatDateTime } from "@/features/inpatient/dateLimits";
import { formatBedLabel, formatSexAge } from "@/features/inpatient/displayFormat";
import { Alert, ConfirmDialog, PageHeader } from "@/components/common";
import type { SwipeAction } from "@/components/inpatient/common/SwipeRow";
import SwipeListRow from "@/components/inpatient/common/SwipeListRow";
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

// 상태 컬럼 + 한 줄 레이아웃 — 머리글과 각 행이 같은 칸 비율을 씀 (표(table)가 아니라 행 카드 목록이라 직접 맞춤)
const ROW_GRID = "grid w-full grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_96px] items-center gap-3";

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

type BedReservationListProps = {
  /** 병상관리 홈 탭 안에 끼워 넣을 때 true — 자체 제목/여백을 생략 */
  embedded?: boolean;
};

const BedReservationList = ({ embedded = false }: BedReservationListProps = {}) => {
  const dispatch = useDispatch<AppDispatch>();
  const bedReservations = useSelector(selectBedReservations);
  const listStatus = useSelector(selectBedReservationListStatus);
  const patients = useSelector((state: RootState) => state.patient.patients);
  const updateStatus = useSelector((state: RootState) => state.inpatient.bedreservation.updateStatus);
  const deleteStatus = useSelector((state: RootState) => state.inpatient.bedreservation.deleteStatus);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // 밀어서 연 "Delete" → 확인창에 띄울 예약 (null이면 확인창 닫힘)
  const [deleteTarget, setDeleteTarget] = useState<BedReservationDTO | null>(null);

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

  // 예약 확정(REQUESTED → RESERVED) — 상세 화면의 Confirm Reservation 과 같은 요청
  const confirmReservation = (r: BedReservationDTO) => {
    dispatch(updateBedReservationRequest({
      bedReservationId: r.bedReservationId,
      bedId: r.bedId,
      patientId: r.patientId,
      reserveAt: r.reserveAt,
      expectedAdmissionAt: r.expectedAdmissionAt,
      reservationStatusCd: "RESERVED",
    }));
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    dispatch(deleteBedReservationRequest(deleteTarget.bedReservationId));
    if (selectedId === deleteTarget.bedReservationId) setSelectedId(null);
    setDeleteTarget(null);
  };

  // 행을 밀었을 때 나오는 동작 — 맨 바깥(첫 번째)이 Delete, 안쪽이 Confirm (확정 대기 건에만)
  // Delete는 dismiss:false — 확인창에서 취소하면 행이 접혀 사라지지 않고 그대로 남아야 해서
  const actionsFor = (r: BedReservationDTO): SwipeAction[] => {
    const actions: SwipeAction[] = [
      { id: "delete", label: "Delete", dismiss: false, onSelect: () => setDeleteTarget(r) },
    ];
    if (r.reservationStatusCd === "REQUESTED") {
      actions.push({ id: "confirm", label: "Confirm", icon: <CheckIcon />, color: "#0284c7", onSelect: () => confirmReservation(r) });
    }
    return actions;
  };

  return (
    // 화면 아래까지 꽉 채움 — 목록과 상세 패널이 각자 안에서 스크롤 (홈 탭 안에서는 남은 높이를, 단독 페이지에서는 화면 높이를 채움)
    <div className={`flex min-h-0 flex-col gap-4 ${embedded ? "w-full flex-1" : "mx-auto h-full w-full max-w-[1800px] p-6"}`}>
      {!embedded && (
        <PageHeader title="Bed Reservation List" description="Current status of registered bed reservations." />
      )}

      <Toolbar actions={<LinkButton href="/inpatient/bedmanagement/bedreservation/create">Register Reservation</LinkButton>}>
        <span className="text-sm text-slate-500">{bedReservations.length} reservations</span>
        {/* 밀어서 여는 동작은 눈에 잘 안 띄어서 안내 문구를 둠 (같은 동작이 상세 패널에도 있음) */}
        <span className="text-xs text-slate-400">Swipe a row left to confirm or delete</span>
      </Toolbar>

      {listStatus.error && <Alert>{listStatus.error}</Alert>}
      {updateStatus.error && <Alert>{updateStatus.error}</Alert>}
      {deleteStatus.error && <Alert>{deleteStatus.error}</Alert>}

      {!listStatus.error && (
        <div className="flex min-h-[480px] flex-1 gap-4">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            {/* 머리글 — 아래 행들과 같은 칸 비율 */}
            <div className={`${ROW_GRID} rounded-xl bg-slate-50/95 px-[17px] py-2.5 text-xs font-medium uppercase tracking-wide text-slate-400`}>
              <span>Patient (Gender / Age)</span>
              <span>Bed</span>
              <span>Reserved At</span>
              <span>Expected Admission At</span>
              <span>Status</span>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-1">
              {listStatus.loading && <p className="py-16 text-center text-sm text-slate-400">Loading...</p>}
              {!listStatus.loading && bedReservations.length === 0 && (
                <p className="py-16 text-center text-sm text-slate-400">No reservation data available.</p>
              )}
              {!listStatus.loading &&
                bedReservations.map((r) => {
                  const selected = r.bedReservationId === selectedId;
                  const patientName = r.patientId ? patientNameById.get(r.patientId) ?? "Loading..." : "None";
                  return (
                    <SwipeListRow
                      key={r.bedReservationId}
                      label={`Reservation for ${patientName}`}
                      selected={selected}
                      actions={actionsFor(r)}
                      onSelect={() => setSelectedId(r.bedReservationId)}
                    >
                      <div className={ROW_GRID}>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">{patientName}</p>
                          <p className="truncate text-xs text-slate-400">
                            {r.patientId ? sexAgeByPatientId.get(r.patientId) ?? "-" : "-"}
                          </p>
                        </div>
                        <span className="truncate text-sm text-slate-600">{formatBedLabel(r.bedId)}</span>
                        <span className="truncate text-sm text-slate-600">{formatDateTime(r.reserveAt)}</span>
                        <span className="truncate text-sm text-slate-600">{formatDateTime(r.expectedAdmissionAt)}</span>
                        <span>
                          <span
                            className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                              STATUS_BADGE[r.reservationStatusCd] ?? "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                            }`}
                          >
                            {STATUS_LABEL[r.reservationStatusCd] ?? r.reservationStatusCd}
                          </span>
                        </span>
                      </div>
                    </SwipeListRow>
                  );
                })}
            </div>
          </div>

          {selectedId !== null && (
            <div className="min-h-0 w-[420px] shrink-0 overflow-y-auto">
              <BedReservationDetail bedReservationId={selectedId} onClose={() => setSelectedId(null)} />
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete reservation"
        message={
          deleteTarget
            ? `Delete the reservation for ${deleteTarget.patientId ? patientNameById.get(deleteTarget.patientId) ?? "this patient" : "this patient"} (${formatBedLabel(deleteTarget.bedId)})?`
            : ""
        }
        confirmLabel="Delete"
        danger
        submitting={deleteStatus.loading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default BedReservationList;
