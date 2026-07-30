
export interface LabScheduleRescheduleRequest {

  scheduledAt: string;
  reservationYn: "Y" | "N";
  guidanceNote?: string;
  confirmedById: string;

}


export interface LabScheduleCreateRequest {

  labReceptionId: string;
  scheduleTypeCode: string;
  scheduledAt: string;
  reservationYn: "Y" | "N";
  guidanceNote?: string;
  confirmedById: string;

}

export interface LabScheduleResponse {

    labScheduleId: string;
    labReceptionId: string;
    scheduleTypeCode: string;
    scheduledAt: string;
    reservationYn: "Y" | "N";
    guidanceNote?: string;
    confirmedById: string;
    latestYn: "Y" | "N";
    createdAt: string;
    updatedAt: string;
}

export interface LabScheduleState {

  creating: boolean;
  createError: string;
  lastCreated: LabScheduleResponse | null;
}

export const SCHEDULE_TYPE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "GENERAL", label: "일반" },
  { value: "RESERVATION", label: "예약" },
];

export const RESERVATION_YN_OPTIONS: ReadonlyArray<{ value: "Y" | "N"; label: string }> = [
  { value: "N", label: "비예약검사" },
  { value: "Y", label: "예약검사" },
];

