
export interface LabScheduleRescheduleRequest {

  scheduledAt: string;
  reservationYn: "Y" | "N";
  guidanceNote?: string;
  confirmedById: string;

}


export interface LabScheduleCreateRequest {

  labReceptionId: string;
  scheduledAt: string;
  reservationYn: "Y" | "N";
  guidanceNote?: string;
  confirmedById: string;

}

export interface LabScheduleResponse {

    labScheduleId: string;
    labReceptionId: string;
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

export const RESERVATION_YN_OPTIONS: ReadonlyArray<{ value: "Y" | "N"; label: string }> = [
  { value: "N", label: "Walk-in" },
  { value: "Y", label: "Appointment" },
];

