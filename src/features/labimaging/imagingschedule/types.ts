/**
 * 영상 촬영 일정 타입 — 백엔드 ImageSchedule*Dto 미러링.
 * (kr.co.seoulit.his.labimagingservice.imagingschedule.dto)
 * 검사(labschedule)와 달리 촬영실/장비/금기확인 필드를 가진다.
 */

export interface ImageScheduleCreateRequest {
  imageReceptionId: string;
  /**
   * 일정을 잡을 촬영항목. (2026-09-03 — 일정이 접수 단위에서 항목 단위로 바뀜)
   * ⚠ CT·MRI·초음파는 서로 다른 방·장비를 쓰고 같은 시각에 할 수 없어, 접수ID 만으로는 정할 수 없다.
   */
  imageOrderItemId: string;
  roomCode: string;
  equipmentCode: string;
  scheduledAt: string;
  reservationYn: "Y" | "N";
  contraindicationCheckCode: string;
  contraindicationNote?: string;
  confirmedById: string;
}

export interface ImageScheduleRescheduleRequest {
  /** 재조정할 촬영항목. 대상 접수는 경로변수, 항목은 본문으로 보낸다. */
  imageOrderItemId: string;
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
  imageOrderItemId: string;
  /** 촬영항목코드 (공통코드 IMG_ITEM_CD) */
  imageItemCode: string;
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

/**
 * 촬영항목 1건 + 그 항목의 최종 일정 — 백엔드 ImageScheduleItemDto
 *
 * ⚠ schedule 이 없으면(undefined) 아직 일정이 잡히지 않은 항목이다. 그게 등록 대상이다.
 *   (검사결과 화면의 LabResultItem 과 같은 규약)
 */
export interface ImageScheduleItem {
  /** 일정 등록 요청에 담는 값 */
  imageOrderItemId: string;
  /** 촬영항목코드 (공통코드 IMG_ITEM_CD) */
  imageItemCode: string;
  schedule?: ImageScheduleResponse;
}

export interface ImageScheduleState {
  creating: boolean;
  createError: string;
  lastCreated: ImageScheduleResponse | null;

  /** 선택한 접수의 촬영항목 + 일정 목록 */
  items: ImageScheduleItem[];
  itemsLoading: boolean;
  itemsError: string;
}

export const RESERVATION_YN_OPTIONS: ReadonlyArray<{ value: "Y" | "N"; label: string }> = [
  { value: "N", label: "Walk-in" },
  { value: "Y", label: "Appointment" },
];
