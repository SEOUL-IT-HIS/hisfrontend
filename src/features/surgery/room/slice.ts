import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PageParams, PageResponse } from "@/features/surgery/types";
import type {
  ChangeEquipmentInoutRequest,
  ChangeEquipmentStatusRequest,
  ChangeRoomStatusRequest,
  ChangeRoomTurnoverRequest,
  CreateEquipmentRequest,
  CreateRoomRequest,
  RoomState,
  SurgeryRoom,
  SurgicalEquipment,
  UpdateEquipmentRequest,
  UpdateRoomRequest,
} from "@/features/surgery/room/types";

/**
 * 수술실/수술장비 마스터 slice (SL2-1)
 *
 * <p>상태만 관리하고 API 호출은 하지 않는다 → saga 가 담당한다(§10.3).
 * Action prefix 는 서비스 단위로 "surgery/" 를 유지한다(§10.2).
 * createSlice name = "surgery/room" → action type 예: "surgery/room/fetchRoomsRequest"</p>
 */
const initialState: RoomState = {
  rooms: null,
  availableRooms: [],
  selectedRoom: null,
  equipments: null,
  selectedEquipment: null,
  loading: false,
  saving: false,
  error: "",
};

const roomSlice = createSlice({
  name: "surgery/room",
  initialState,
  reducers: {
    // ----- 수술실 조회 (SL2-6) -----
    fetchRoomsRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(params?: PageParams) {
        return { payload: params };
      },
    },
    fetchRoomsSuccess(state, action: PayloadAction<PageResponse<SurgeryRoom>>) {
      state.loading = false;
      state.rooms = action.payload;
    },
    fetchRoomsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    /** 배정 화면 선택 목록용 — 사용가능한 수술실만 */
    fetchAvailableRoomsRequest(state) {
      state.loading = true;
      state.error = "";
    },
    fetchAvailableRoomsSuccess(state, action: PayloadAction<SurgeryRoom[]>) {
      state.loading = false;
      state.availableRooms = action.payload;
    },
    fetchAvailableRoomsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    /** 수정 화면 초기값 바인딩용 단건 조회 */
    fetchRoomRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(roomCode: string) {
        return { payload: roomCode };
      },
    },
    fetchRoomSuccess(state, action: PayloadAction<SurgeryRoom>) {
      state.loading = false;
      state.selectedRoom = action.payload;
    },
    fetchRoomFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // ----- 수술실 변경 (SL2-7 등록 / SL2-30 수정 / SL2-8 상태 / SL2-50 턴오버) -----
    createRoomRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(request: CreateRoomRequest) {
        return { payload: request };
      },
    },
    updateRoomRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(roomCode: string, request: UpdateRoomRequest) {
        return { payload: { roomCode, request } };
      },
    },
    /** SL2-8 — 물리 삭제가 아닌 상태 전이로 "제거"를 표현한다(§21.6) */
    changeRoomStatusRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(roomCode: string, request: ChangeRoomStatusRequest) {
        return { payload: { roomCode, request } };
      },
    },
    changeRoomTurnoverRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(roomCode: string, request: ChangeRoomTurnoverRequest) {
        return { payload: { roomCode, request } };
      },
    },
    /** 등록·수정·상태전이 공통 성공 — saga 가 목록을 다시 불러온다 */
    roomMutationSuccess(state) {
      state.saving = false;
      state.error = "";
    },
    roomMutationFailure(state, action: PayloadAction<string>) {
      state.saving = false;
      state.error = action.payload;
    },

    // ----- 수술장비 조회 (SL2-9) -----
    fetchEquipmentsRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(params?: PageParams) {
        return { payload: params };
      },
    },
    fetchEquipmentsSuccess(
      state,
      action: PayloadAction<PageResponse<SurgicalEquipment>>,
    ) {
      state.loading = false;
      state.equipments = action.payload;
    },
    fetchEquipmentsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    fetchEquipmentRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(equipmentId: string) {
        return { payload: equipmentId };
      },
    },
    fetchEquipmentSuccess(state, action: PayloadAction<SurgicalEquipment>) {
      state.loading = false;
      state.selectedEquipment = action.payload;
    },
    fetchEquipmentFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // ----- 수술장비 변경 (SL2-10 등록 / SL2-31 수정 / SL2-11 제거 / SL2-12 출고반입) -----
    createEquipmentRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(request: CreateEquipmentRequest) {
        return { payload: request };
      },
    },
    updateEquipmentRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(equipmentId: string, request: UpdateEquipmentRequest) {
        return { payload: { equipmentId, request } };
      },
    },
    /** SL2-11 — 폐기도 상태 전이로 처리한다(§21.6). DELETE 는 백엔드에 없다. */
    changeEquipmentStatusRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(equipmentId: string, request: ChangeEquipmentStatusRequest) {
        return { payload: { equipmentId, request } };
      },
    },
    changeEquipmentInoutRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(equipmentId: string, request: ChangeEquipmentInoutRequest) {
        return { payload: { equipmentId, request } };
      },
    },
    equipmentMutationSuccess(state) {
      state.saving = false;
      state.error = "";
    },
    equipmentMutationFailure(state, action: PayloadAction<string>) {
      state.saving = false;
      state.error = action.payload;
    },

    /** 화면 이탈 시 초기화 */
    resetRoomState() {
      return initialState;
    },
  },
});

export const {
  fetchRoomsRequest,
  fetchRoomsSuccess,
  fetchRoomsFailure,
  fetchAvailableRoomsRequest,
  fetchAvailableRoomsSuccess,
  fetchAvailableRoomsFailure,
  fetchRoomRequest,
  fetchRoomSuccess,
  fetchRoomFailure,
  createRoomRequest,
  updateRoomRequest,
  changeRoomStatusRequest,
  changeRoomTurnoverRequest,
  roomMutationSuccess,
  roomMutationFailure,
  fetchEquipmentsRequest,
  fetchEquipmentsSuccess,
  fetchEquipmentsFailure,
  fetchEquipmentRequest,
  fetchEquipmentSuccess,
  fetchEquipmentFailure,
  createEquipmentRequest,
  updateEquipmentRequest,
  changeEquipmentStatusRequest,
  changeEquipmentInoutRequest,
  equipmentMutationSuccess,
  equipmentMutationFailure,
  resetRoomState,
} = roomSlice.actions;

export default roomSlice.reducer;

// ----- Selector (§10.4: 컴포넌트에서 state.xxx.yyy 깊은 접근 금지) -----
// 등록 전제: rootReducer 에 surgery: combineReducers({ room, schedule, ... })
// rootReducer 등록은 프론트 리더 소관이므로 별도 요청이 필요하다(§5.1/§7).
type RoomRoot = { surgery: { room: RoomState } };

export const selectRooms = (state: RoomRoot) => state.surgery.room.rooms;
export const selectAvailableRooms = (state: RoomRoot) =>
  state.surgery.room.availableRooms;
export const selectSelectedRoom = (state: RoomRoot) =>
  state.surgery.room.selectedRoom;
export const selectEquipments = (state: RoomRoot) =>
  state.surgery.room.equipments;
export const selectSelectedEquipment = (state: RoomRoot) =>
  state.surgery.room.selectedEquipment;
export const selectRoomLoading = (state: RoomRoot) =>
  state.surgery.room.loading;
export const selectRoomSaving = (state: RoomRoot) => state.surgery.room.saving;
export const selectRoomError = (state: RoomRoot) => state.surgery.room.error;
