/**
 * 수술실/수술장비 마스터 API (SL2-1)
 *
 * <p>백엔드 SurgeryRoomController(@RequestMapping("/api/surgery/rooms")) /
 * SurgicalEquipmentController(@RequestMapping("/api/surgery/equipment")) 와 1:1 대응.
 * 하드코딩 전체 URL 은 쓰지 않고 상대 경로 상수로 둔다(§11.1).
 * "/api/*" 로 시작하므로 next.config rewrite 가 BE(같은 출처)로 프록시한다.</p>
 *
 * <p>함수 네이밍은 get/create/update/delete 규칙을 따른다(§11.1).
 * 상태 전이는 삭제가 아니므로 change* 로 둔다(§21.8 "삭제: 상태 변경 권장").</p>
 */
import apiClient from "@/lib/axios";
import type {
  ApiResponse,
  PageParams,
  PageResponse,
} from "@/features/surgery/types";
import type {
  ChangeEquipmentInoutRequest,
  ChangeEquipmentStatusRequest,
  ChangeRoomStatusRequest,
  ChangeRoomTurnoverRequest,
  CreateEquipmentRequest,
  CreateRoomRequest,
  SurgeryRoom,
  SurgicalEquipment,
  UpdateEquipmentRequest,
  UpdateRoomRequest,
} from "@/features/surgery/room/types";

const ROOM_PATH = "/api/surgery/rooms";
const EQUIPMENT_PATH = "/api/surgery/equipment";

// ---------------------------------------------------------------------------
// 수술실 (SL2-6 조회 / SL2-7 등록 / SL2-30 수정 / SL2-8 상태변경 / SL2-50 턴오버)
// ---------------------------------------------------------------------------

/** 수술실 목록을 페이지 단위로 조회한다. */
export async function getRooms(
  params?: PageParams,
): Promise<PageResponse<SurgeryRoom>> {
  const { data } = await apiClient.get<ApiResponse<PageResponse<SurgeryRoom>>>(
    ROOM_PATH,
    { params },
  );
  return data.data;
}

/** 사용 가능한 수술실만 조회한다(배정 화면의 선택 목록용). */
export async function getAvailableRooms(): Promise<SurgeryRoom[]> {
  const { data } =
    await apiClient.get<ApiResponse<SurgeryRoom[]>>(`${ROOM_PATH}/available`);
  return data.data;
}

/** 수술실 단건을 조회한다(수정 화면 초기값 바인딩 등). */
export async function getRoom(roomCode: string): Promise<SurgeryRoom> {
  const { data } = await apiClient.get<ApiResponse<SurgeryRoom>>(
    `${ROOM_PATH}/${roomCode}`,
  );
  return data.data;
}

export async function createRoom(
  request: CreateRoomRequest,
): Promise<SurgeryRoom> {
  const { data } = await apiClient.post<ApiResponse<SurgeryRoom>>(
    ROOM_PATH,
    request,
  );
  return data.data;
}

export async function updateRoom(
  roomCode: string,
  request: UpdateRoomRequest,
): Promise<SurgeryRoom> {
  const { data } = await apiClient.put<ApiResponse<SurgeryRoom>>(
    `${ROOM_PATH}/${roomCode}`,
    request,
  );
  return data.data;
}

/**
 * 수술실 상태를 전이시킨다. (SL2-8)
 *
 * <p>"제거"는 행을 지우지 않고 폐쇄 상태로 전이시켜 표현한다(§21.6 이력 보존).</p>
 */
export async function changeRoomStatus(
  roomCode: string,
  request: ChangeRoomStatusRequest,
): Promise<SurgeryRoom> {
  const { data } = await apiClient.patch<ApiResponse<SurgeryRoom>>(
    `${ROOM_PATH}/${roomCode}/status`,
    request,
  );
  return data.data;
}

/** 수술실 턴오버 상태를 변경한다. (SL2-50) */
export async function changeRoomTurnover(
  roomCode: string,
  request: ChangeRoomTurnoverRequest,
): Promise<SurgeryRoom> {
  const { data } = await apiClient.patch<ApiResponse<SurgeryRoom>>(
    `${ROOM_PATH}/${roomCode}/turnover`,
    request,
  );
  return data.data;
}

// ---------------------------------------------------------------------------
// 수술장비 (SL2-9 조회 / SL2-10 등록 / SL2-31 수정 / SL2-11 제거 / SL2-12 출고반입)
// ---------------------------------------------------------------------------

export async function getEquipments(
  params?: PageParams,
): Promise<PageResponse<SurgicalEquipment>> {
  const { data } = await apiClient.get<
    ApiResponse<PageResponse<SurgicalEquipment>>
  >(EQUIPMENT_PATH, { params });
  return data.data;
}

export async function getEquipment(
  equipmentId: string,
): Promise<SurgicalEquipment> {
  const { data } = await apiClient.get<ApiResponse<SurgicalEquipment>>(
    `${EQUIPMENT_PATH}/${equipmentId}`,
  );
  return data.data;
}

export async function createEquipment(
  request: CreateEquipmentRequest,
): Promise<SurgicalEquipment> {
  const { data } = await apiClient.post<ApiResponse<SurgicalEquipment>>(
    EQUIPMENT_PATH,
    request,
  );
  return data.data;
}

export async function updateEquipment(
  equipmentId: string,
  request: UpdateEquipmentRequest,
): Promise<SurgicalEquipment> {
  const { data } = await apiClient.put<ApiResponse<SurgicalEquipment>>(
    `${EQUIPMENT_PATH}/${equipmentId}`,
    request,
  );
  return data.data;
}

/**
 * 수술장비 상태를 전이시킨다. (SL2-11 제거)
 *
 * <p>과거 수술기록이 장비를 참조하므로 행을 지우면 이력이 깨진다. 폐기도 상태 전이로
 * 표현한다(§21.6/§21.8). 백엔드에 DELETE 엔드포인트는 없다.</p>
 */
export async function changeEquipmentStatus(
  equipmentId: string,
  request: ChangeEquipmentStatusRequest,
): Promise<SurgicalEquipment> {
  const { data } = await apiClient.patch<ApiResponse<SurgicalEquipment>>(
    `${EQUIPMENT_PATH}/${equipmentId}/status`,
    request,
  );
  return data.data;
}

/** 수술장비 출고/반입 상태를 변경한다. (SL2-12) */
export async function changeEquipmentInout(
  equipmentId: string,
  request: ChangeEquipmentInoutRequest,
): Promise<SurgicalEquipment> {
  const { data } = await apiClient.patch<ApiResponse<SurgicalEquipment>>(
    `${EQUIPMENT_PATH}/${equipmentId}/inout`,
    request,
  );
  return data.data;
}
