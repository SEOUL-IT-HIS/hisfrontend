/**
 * 영상 촬영 일정 타입 — 백엔드 ImageSchedule*Dto 미러링.
 * (kr.co.seoulit.his.labimagingservice.imagingschedule.dto)
 * 검사(labschedule)와 달리 촬영실/장비/금기확인 필드를 가진다.
 */

export interface ImageScheduleCreateRequest {
  imageReceptionId: string;
  roomCode: string;
  equipmentCode: string;
  scheduledAt: string;
  reservationYn: "Y" | "N";
  contraindicationCheckCode: string;
  contraindicationNote?: string;
  confirmedById: string;
}

export interface ImageScheduleRescheduleRequest {
  scheduledAt: string;
  roomCode: string;
  equipmentCode: string;
  reservationYn: "Y" | "N";
  contraindicationCheckCode: string;
  contraindicationNote?: string;
  confirmedById: string;
}

export interface ImageScheduleResponse {
  imageScheduleId: string;
  imageReceptionId: string;
  roomCode: string;
  equipmentCode: string;
  scheduledAt: string;
  reservationYn: "Y" | "N";
  contraindicationCheckCode: string;
  contraindicationNote?: string;
  confirmedById: string;
  latestYn: "Y" | "N";
  createdAt: string;
  updatedAt: string;
}

export interface ImageScheduleState {
  creating: boolean;
  createError: string;
  lastCreated: ImageScheduleResponse | null;
}

export const RESERVATION_YN_OPTIONS: ReadonlyArray<{ value: "Y" | "N"; label: string }> = [
  { value: "N", label: "비예약검사" },
  { value: "Y", label: "예약검사" },
];
