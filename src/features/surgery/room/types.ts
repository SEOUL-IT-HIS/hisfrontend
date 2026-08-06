/**
 * 수술실/수술장비 마스터 관리 타입 (SL2-1)
 *
 * <p>백엔드 SurgeryRoomDto / SurgicalEquipmentDto 와 필드명을 camelCase 로 1:1 대응시킨다.
 * DB 컬럼은 lower_snake_case 지만 API 응답은 camelCase 다(§13).</p>
 */
import type { CodeValue, PageResponse } from "@/features/surgery/types";

/**
 * 수술실 (SURGERY_ROOM)
 *
 * <p>statusCd: OR_STATUS_CD(01사용가능/02사용중/03점검중/04폐쇄)
 * turnoverCd: 01정리중/02준비완료 (SL2-50)
 * 코드 카탈로그는 admin-service 소관이라 문자열로 둔다(§21.4).</p>
 */
export type SurgeryRoom = {
  roomCode: string;
  roomName: string;
  statusCd: CodeValue | null;
  turnoverCd: CodeValue | null;
  /** TIMESTAMP → ISO 문자열 (§14.2 `_at`) */
  createdAt: string;
  updatedAt: string;
};

/** 수술실 등록 (SL2-7) — roomCode 는 사용자가 지정하는 마스터 코드 */
export type CreateRoomRequest = {
  roomCode: string;
  roomName: string;
};

/** 수술실 정보 수정 (SL2-30) — 이름만 교체(PUT) */
export type UpdateRoomRequest = {
  roomName: string;
};

/** 수술실 상태 변경 (SL2-8) — 물리 삭제가 아닌 상태 전이로 "제거"를 표현한다(§21.6/§21.8) */
export type ChangeRoomStatusRequest = {
  statusCd: CodeValue;
};

/** 수술실 턴오버 상태 변경 (SL2-50) */
export type ChangeRoomTurnoverRequest = {
  turnoverCd: CodeValue;
};

/**
 * 수술장비 (SURGICAL_EQUIPMENT)
 *
 * <p>roomCode: 소속 수술실(NOT NULL) / statusCd: OR_EQUIP_STATUS_CD
 * inoutCd: EQUIP_INOUT_CD(01출고/02반입, SL2-12)</p>
 */
export type SurgicalEquipment = {
  equipmentId: string;
  roomCode: string;
  equipmentName: string;
  statusCd: CodeValue | null;
  inoutCd: CodeValue | null;
  createdAt: string;
  updatedAt: string;
};

/** 수술장비 등록 (SL2-10) */
export type CreateEquipmentRequest = {
  equipmentId: string;
  roomCode: string;
  equipmentName: string;
};

/** 수술장비 정보 수정 (SL2-31) — 장비명 교체 */
export type UpdateEquipmentRequest = {
  equipmentName: string;
};

/** 수술장비 상태 변경 (SL2-11) — 폐기도 상태 전이로 처리한다(§21.6) */
export type ChangeEquipmentStatusRequest = {
  statusCd: CodeValue;
};

/** 수술장비 출고/반입 (SL2-12) */
export type ChangeEquipmentInoutRequest = {
  inoutCd: CodeValue;
};

// ---------------------------------------------------------------------------
// Redux 상태
// ---------------------------------------------------------------------------

/**
 * 수술실/장비 화면 상태
 *
 * <p>등록·수정·상태전이는 성공 시 목록을 다시 불러오므로 별도 결과 객체를 두지 않고
 * saving 플래그만 관리한다.</p>
 */
export type RoomState = {
  rooms: PageResponse<SurgeryRoom> | null;
  /** 배정 화면의 선택 목록용(사용가능한 수술실만) */
  availableRooms: SurgeryRoom[];
  selectedRoom: SurgeryRoom | null;
  equipments: PageResponse<SurgicalEquipment> | null;
  selectedEquipment: SurgicalEquipment | null;
  loading: boolean;
  saving: boolean;
  /** SUR### 코드 또는 완성 문구 — 노출 직전 resolveSurgeryMessage 로 변환한다(§15.2) */
  error: string;
};
