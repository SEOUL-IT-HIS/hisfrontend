"use client";

import { useRef, useState } from "react";
import { Button, PageHeader, Panel } from "@/components/common";
import ReceptionRegisterForm from "./ReceptionRegisterForm";
import ReceptionListSection from "./ReceptionListSection";
import ReceptionDetailModal from "./ReceptionDetailModal";
import ReservationListSection from "./ReservationListSection";
import PatientSearchModal from "@/components/reception/patientmanagement/PatientSearchModal";
import PatientRegisterModal from "@/components/reception/patientmanagement/PatientRegisterModal";
import type { PatientSearchItem } from "@/features/reception/patientmanagement/types";
import type { Patient } from "@/features/patient/type/patientType";
import { getVisitType } from "@/features/reception/receptionmanagement/api";
import type {
  ReservationItem,
  VisitType,
} from "@/features/reception/receptionmanagement/types";

type ListTab = "receptions" | "reservations";

/**
 * 접수관리 화면
 * 흐름: 환자검색 → 환자목록 모달 → 환자 선택 → 접수등록 폼(진료과/의사 선택)
 *       → 접수등록 → 접수목록 갱신 → [상세] 로 접수 상세 조회
 * 예약: 접수 폼의 [Reserve] 로 예약을 만들면 예약 목록에 쌓이고, 예약 목록의 [Receive] 를 누르면
 *       그 예약의 값이 접수 폼에 채워진다. [Register Reception] 을 누르면 접수유형이 예약인 접수가 만들어진다.
 *       (폼에 직접 입력해 등록한 접수는 당일)
 */
export default function ReceptionManagementPage() {
  const [selectedPatient, setSelectedPatient] =
    useState<PatientSearchItem | null>(null);
  // 초진/재진 — 신규환자등록으로 들어온 환자는 초진, 환자검색으로 고른 환자는 외래 진료 이력으로 판정한다
  // (기록 없음 → 초진, 있음 → 재진). 판정하지 못하면 접수 담당자가 직접 고른다.
  const [visitType, setVisitType] = useState<VisitType | null>(null);
  // true 면 자동으로 정해진 값이라 폼에서 바꾸지 못한다 (신규등록·예약·외래 이력 판정)
  const [visitTypeAuto, setVisitTypeAuto] = useState(false);
  const [visitTypeLoading, setVisitTypeLoading] = useState(false);
  // 환자를 빠르게 바꿔 고를 때 늦게 도착한 이전 환자의 판정 결과를 버리기 위한 요청 번호
  const visitTypeRequestId = useRef(0);
  // 예약 목록의 [Receive] 로 접수 폼에 옮겨 온 예약 — 있으면 접수유형이 예약이 된다
  const [reservation, setReservation] = useState<ReservationItem | null>(null);
  const [tab, setTab] = useState<ListTab>("receptions");
  // 예약 등록·접수 완료 직후 예약 목록을 다시 조회시키는 신호
  const [reservationRefreshKey, setReservationRefreshKey] = useState(0);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [patientRegisterOpen, setPatientRegisterOpen] = useState(false);
  const [selectedReceptionId, setSelectedReceptionId] = useState<
    string | null
  >(null);

  /** 환자검색으로 고른 환자 — 외래 진료 이력으로 초진/재진을 판정한다 */
  function handlePatientSearched(patient: PatientSearchItem) {
    const requestId = ++visitTypeRequestId.current;
    setSelectedPatient(patient);
    // 환자를 검색으로 새로 고르면 예약과의 연결은 끊는다 (예약의 환자와 달라질 수 있으므로)
    setReservation(null);
    setVisitType(null);
    setVisitTypeAuto(false);
    setVisitTypeLoading(true);
    getVisitType(patient.patientId)
      .then((result) => {
        if (requestId !== visitTypeRequestId.current) return;
        if (result.determined && result.visitType) {
          setVisitType(result.visitType);
          setVisitTypeAuto(true);
        }
      })
      .catch(() => {
        // 판정하지 못하면 그대로 두어 접수 담당자가 직접 고르게 한다 (재진으로 간주하지 않는다).
      })
      .finally(() => {
        if (requestId === visitTypeRequestId.current) setVisitTypeLoading(false);
      });
  }

  function handleReceiveReservation(item: ReservationItem) {
    visitTypeRequestId.current += 1;
    setVisitTypeLoading(false);
    setVisitTypeAuto(true);
    setReservation(item);
    setVisitType(item.visitType);
    setSelectedPatient({
      patientId: item.patientId,
      patientName: item.patientName,
      birthDate: "",
      genderCd: "",
    });
  }

  function handlePatientRegistered(patient: Patient) {
    setPatientRegisterOpen(false);
    // 다른 환자를 새로 넣으면 예약과의 연결은 끊는다 (예약의 환자와 달라지므로)
    setReservation(null);
    // 방금 새로 등록한 환자라 외래 진료 기록이 있을 수 없다 — 조회 없이 초진
    visitTypeRequestId.current += 1;
    setVisitTypeLoading(false);
    setVisitTypeAuto(true);
    setVisitType("INITIAL");
    setSelectedPatient({
      patientId: patient.patientId,
      patientName: patient.patientName,
      birthDate: patient.birthDate,
      genderCd: patient.genderCd,
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3">
      <PageHeader
        title="Reception Management"
        description="Search for a patient to register a reception and view the reception status."
      />

      <div className="flex min-h-0 flex-1 gap-3">
        <Panel className="w-[360px] shrink-0 p-4">
          <ReceptionRegisterForm
            selectedPatient={selectedPatient}
            visitType={visitType}
            visitTypeEditable={selectedPatient !== null && !visitTypeAuto && !visitTypeLoading}
            visitTypeLoading={visitTypeLoading}
            onVisitTypeChange={setVisitType}
            reservation={reservation}
            onReserved={() => {
              setReservationRefreshKey((key) => key + 1);
              setTab("reservations");
            }}
            onOpenPatientSearch={() => setPatientSearchOpen(true)}
            onOpenPatientRegister={() => setPatientRegisterOpen(true)}
            onClearPatient={() => {
              visitTypeRequestId.current += 1;
              setSelectedPatient(null);
              setVisitType(null);
              setVisitTypeAuto(false);
              setVisitTypeLoading(false);
              // 접수가 완료됐거나 폼을 리셋한 경우 — 예약 연결을 끊고 예약 목록을 갱신한다
              setReservation(null);
              setReservationRefreshKey((key) => key + 1);
            }}
          />
        </Panel>

        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex gap-1">
            <Button
              type="button"
              variant={tab === "receptions" ? "primary" : "secondary"}
              onClick={() => setTab("receptions")}
            >
              Receptions
            </Button>
            <Button
              type="button"
              variant={tab === "reservations" ? "primary" : "secondary"}
              onClick={() => setTab("reservations")}
            >
              Reservations
            </Button>
          </div>

          {tab === "receptions" ? (
            <ReceptionListSection onSelectReception={setSelectedReceptionId} />
          ) : (
            <ReservationListSection
              refreshKey={reservationRefreshKey}
              receivingReservationId={reservation?.reservationId ?? null}
              onReceive={handleReceiveReservation}
            />
          )}
        </div>
      </div>

      <PatientSearchModal
        open={patientSearchOpen}
        onClose={() => setPatientSearchOpen(false)}
        onSelect={handlePatientSearched}
      />

      <PatientRegisterModal
        open={patientRegisterOpen}
        onClose={() => setPatientRegisterOpen(false)}
        onRegistered={handlePatientRegistered}
      />

      <ReceptionDetailModal
        receptionId={selectedReceptionId}
        onClose={() => setSelectedReceptionId(null)}
      />
    </div>
  );
}
