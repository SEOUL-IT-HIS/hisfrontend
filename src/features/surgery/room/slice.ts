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
 *
 * <p><b>액션 패턴</b> — 조회·등록·수정이 모두 세 개 한 벌이다.</p>
 * <pre>
 *   Request  →  loading(또는 saving)=true, error 비움.  saga 가 이 액션을 받아 API 를 호출한다
 *   Success  →  로딩 해제 + 상태 반영
 *   Failure  →  로딩 해제 + error 에 문구 저장
 * </pre>
 * <p>컴포넌트는 <b>Request 만 dispatch</b> 하면 된다. Success/Failure 는 saga 가 흘려보낸다.
 * 화면은 API 주소도, 성공 후 무엇을 해야 하는지도 알 필요가 없다.</p>
 *
 * <p><b>loading 과 saving 을 나눈 이유</b> — 읽기와 쓰기는 화면에서 쓰임이 다르다.
 * loading 은 "불러오는 중…" 문구에, saving 은 버튼·입력칸 비활성화(disabled)에 쓴다.
 * 하나로 묶으면 저장 중에 목록이 통째로 사라진다.</p>
 *
 * <p><b>error 를 null 이 아니라 "" 로 둔 이유</b> — 화면에서 {@code error && <p>...</p>} 로
 * 바로 쓰기 위해서다. 노출 직전 resolveSurgeryMessage 로 SUR### 코드를 문구로 바꾼다(§15.2).</p>
 *
 * <p><b>reducer 안에서 state 를 직접 바꿔도 되는 이유</b> — Redux Toolkit 이 내부적으로
 * Immer 를 쓴다. {@code state.loading = true} 처럼 적어도 실제로는 새 객체를 만드는
 * 코드로 변환되므로, 읽기 쉬운 문법을 쓰면서 불변성 규칙은 지켜진다.</p>
 *
 * <p><b>prepare 가 붙은 액션이 있는 이유</b> — reducer 는 인자를 action 하나만 받는데,
 * "어느 대상을 어떻게 바꿀지"처럼 값이 둘 이상 필요한 경우가 있다. prepare 가 둘을 하나의
 * payload 로 묶어주므로, 컴포넌트에서는 {@code dispatch(액션(id, request))} 처럼 자연스럽게 부른다.</p>
 *
 * <p>수술실과 장비를 한 slice 에 담았다. 두 마스터가 같은 화면 흐름을 쓰고 서로를 참조해서다.
 * 다만 loading·saving 을 공유하므로, 장비 저장 중에 수술실 셀렉트도 함께 비활성화된다.
 * 지금은 화면이 분리돼 문제가 없지만, 한 화면에 둘을 같이 놓게 되면 플래그를 나눠야 한다.</p>
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
