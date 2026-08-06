import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { PageParams, PageResponse } from "@/features/surgery/types";
import {
  changeEquipmentInout,
  changeEquipmentStatus,
  changeRoomStatus,
  changeRoomTurnover,
  createEquipment,
  createRoom,
  getAvailableRooms,
  getEquipment,
  getEquipments,
  getRoom,
  getRooms,
  updateEquipment,
  updateRoom,
} from "@/features/surgery/room/api";
import {
  changeEquipmentInoutRequest,
  changeEquipmentStatusRequest,
  changeRoomStatusRequest,
  changeRoomTurnoverRequest,
  createEquipmentRequest,
  createRoomRequest,
  equipmentMutationFailure,
  equipmentMutationSuccess,
  fetchAvailableRoomsFailure,
  fetchAvailableRoomsRequest,
  fetchAvailableRoomsSuccess,
  fetchEquipmentFailure,
  fetchEquipmentRequest,
  fetchEquipmentSuccess,
  fetchEquipmentsFailure,
  fetchEquipmentsRequest,
  fetchEquipmentsSuccess,
  fetchRoomFailure,
  fetchRoomRequest,
  fetchRoomSuccess,
  fetchRoomsFailure,
  fetchRoomsRequest,
  fetchRoomsSuccess,
  roomMutationFailure,
  roomMutationSuccess,
  updateEquipmentRequest,
  updateRoomRequest,
} from "@/features/surgery/room/slice";
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
import { getSurgeryErrorMessage } from "@/features/surgery/errorMessage";

/**
 * 수술실/수술장비 saga (SL2-1)
 *
 * <p>API 호출은 여기서만 한다(§10.3). 실패 시 Error.message(백엔드 message = SUR### 코드
 * 또는 문구)를 그대로 실어 보내고, 사용자 노출 문구 변환은 컴포넌트에서
 * resolveSurgeryMessage 로 처리한다(§15.1).</p>
 *
 * <p>등록·수정·상태전이는 성공 후 목록을 다시 불러와 화면을 최신 상태로 맞춘다.</p>
 */

// ----- 수술실 조회 -----

function* fetchRoomsSaga(action: PayloadAction<PageParams | undefined>) {
  try {
    const response: PageResponse<SurgeryRoom> = yield call(
      getRooms,
      action.payload,
    );
    yield put(fetchRoomsSuccess(response));
  } catch (err) {
    yield put(
      fetchRoomsFailure(
        getSurgeryErrorMessage(err, "수술실 목록 조회에 실패했습니다."),
      ),
    );
  }
}

function* fetchAvailableRoomsSaga() {
  try {
    const response: SurgeryRoom[] = yield call(getAvailableRooms);
    yield put(fetchAvailableRoomsSuccess(response));
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "사용 가능한 수술실 조회에 실패했습니다.";
    yield put(fetchAvailableRoomsFailure(message));
  }
}

function* fetchRoomSaga(action: PayloadAction<string>) {
  try {
    const response: SurgeryRoom = yield call(getRoom, action.payload);
    yield put(fetchRoomSuccess(response));
  } catch (err) {
    yield put(
      fetchRoomFailure(
        getSurgeryErrorMessage(err, "수술실 조회에 실패했습니다."),
      ),
    );
  }
}

// ----- 수술실 변경 -----

function* createRoomSaga(action: PayloadAction<CreateRoomRequest>) {
  try {
    yield call(createRoom, action.payload);
    yield put(roomMutationSuccess());
    yield put(fetchRoomsRequest());
  } catch (err) {
    yield put(
      roomMutationFailure(
        getSurgeryErrorMessage(err, "수술실 등록에 실패했습니다."),
      ),
    );
  }
}

function* updateRoomSaga(
  action: PayloadAction<{ roomCode: string; request: UpdateRoomRequest }>,
) {
  try {
    const { roomCode, request } = action.payload;
    yield call(updateRoom, roomCode, request);
    yield put(roomMutationSuccess());
    yield put(fetchRoomsRequest());
  } catch (err) {
    yield put(
      roomMutationFailure(
        getSurgeryErrorMessage(err, "수술실 수정에 실패했습니다."),
      ),
    );
  }
}

function* changeRoomStatusSaga(
  action: PayloadAction<{ roomCode: string; request: ChangeRoomStatusRequest }>,
) {
  try {
    const { roomCode, request } = action.payload;
    yield call(changeRoomStatus, roomCode, request);
    yield put(roomMutationSuccess());
    yield put(fetchRoomsRequest());
  } catch (err) {
    yield put(
      roomMutationFailure(
        getSurgeryErrorMessage(err, "수술실 상태 변경에 실패했습니다."),
      ),
    );
  }
}

function* changeRoomTurnoverSaga(
  action: PayloadAction<{
    roomCode: string;
    request: ChangeRoomTurnoverRequest;
  }>,
) {
  try {
    const { roomCode, request } = action.payload;
    yield call(changeRoomTurnover, roomCode, request);
    yield put(roomMutationSuccess());
    yield put(fetchRoomsRequest());
  } catch (err) {
    yield put(
      roomMutationFailure(
        getSurgeryErrorMessage(err, "턴오버 상태 변경에 실패했습니다."),
      ),
    );
  }
}

// ----- 수술장비 조회 -----

function* fetchEquipmentsSaga(action: PayloadAction<PageParams | undefined>) {
  try {
    const response: PageResponse<SurgicalEquipment> = yield call(
      getEquipments,
      action.payload,
    );
    yield put(fetchEquipmentsSuccess(response));
  } catch (err) {
    yield put(
      fetchEquipmentsFailure(
        getSurgeryErrorMessage(err, "장비 목록 조회에 실패했습니다."),
      ),
    );
  }
}

function* fetchEquipmentSaga(action: PayloadAction<string>) {
  try {
    const response: SurgicalEquipment = yield call(
      getEquipment,
      action.payload,
    );
    yield put(fetchEquipmentSuccess(response));
  } catch (err) {
    yield put(
      fetchEquipmentFailure(
        getSurgeryErrorMessage(err, "장비 조회에 실패했습니다."),
      ),
    );
  }
}

// ----- 수술장비 변경 -----

function* createEquipmentSaga(action: PayloadAction<CreateEquipmentRequest>) {
  try {
    yield call(createEquipment, action.payload);
    yield put(equipmentMutationSuccess());
    yield put(fetchEquipmentsRequest());
  } catch (err) {
    yield put(
      equipmentMutationFailure(
        getSurgeryErrorMessage(err, "장비 등록에 실패했습니다."),
      ),
    );
  }
}

function* updateEquipmentSaga(
  action: PayloadAction<{
    equipmentId: string;
    request: UpdateEquipmentRequest;
  }>,
) {
  try {
    const { equipmentId, request } = action.payload;
    yield call(updateEquipment, equipmentId, request);
    yield put(equipmentMutationSuccess());
    yield put(fetchEquipmentsRequest());
  } catch (err) {
    yield put(
      equipmentMutationFailure(
        getSurgeryErrorMessage(err, "장비 수정에 실패했습니다."),
      ),
    );
  }
}

function* changeEquipmentStatusSaga(
  action: PayloadAction<{
    equipmentId: string;
    request: ChangeEquipmentStatusRequest;
  }>,
) {
  try {
    const { equipmentId, request } = action.payload;
    yield call(changeEquipmentStatus, equipmentId, request);
    yield put(equipmentMutationSuccess());
    yield put(fetchEquipmentsRequest());
  } catch (err) {
    yield put(
      equipmentMutationFailure(
        getSurgeryErrorMessage(err, "장비 상태 변경에 실패했습니다."),
      ),
    );
  }
}

function* changeEquipmentInoutSaga(
  action: PayloadAction<{
    equipmentId: string;
    request: ChangeEquipmentInoutRequest;
  }>,
) {
  try {
    const { equipmentId, request } = action.payload;
    yield call(changeEquipmentInout, equipmentId, request);
    yield put(equipmentMutationSuccess());
    yield put(fetchEquipmentsRequest());
  } catch (err) {
    yield put(
      equipmentMutationFailure(
        getSurgeryErrorMessage(err, "출고/반입 처리에 실패했습니다."),
      ),
    );
  }
}

/** 수술실/장비 관련 요청을 감시한다(최신 요청만 처리) */
export default function* roomSaga() {
  yield takeLatest(fetchRoomsRequest.type, fetchRoomsSaga);
  yield takeLatest(fetchAvailableRoomsRequest.type, fetchAvailableRoomsSaga);
  yield takeLatest(fetchRoomRequest.type, fetchRoomSaga);
  yield takeLatest(createRoomRequest.type, createRoomSaga);
  yield takeLatest(updateRoomRequest.type, updateRoomSaga);
  yield takeLatest(changeRoomStatusRequest.type, changeRoomStatusSaga);
  yield takeLatest(changeRoomTurnoverRequest.type, changeRoomTurnoverSaga);
  yield takeLatest(fetchEquipmentsRequest.type, fetchEquipmentsSaga);
  yield takeLatest(fetchEquipmentRequest.type, fetchEquipmentSaga);
  yield takeLatest(createEquipmentRequest.type, createEquipmentSaga);
  yield takeLatest(updateEquipmentRequest.type, updateEquipmentSaga);
  yield takeLatest(
    changeEquipmentStatusRequest.type,
    changeEquipmentStatusSaga,
  );
  yield takeLatest(changeEquipmentInoutRequest.type, changeEquipmentInoutSaga);
}
