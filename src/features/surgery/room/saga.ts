/**
 * 수술실·수술장비 마스터 saga (SL2-1)
 *
 * <p>saga 는 <b>순서가 있는 부수효과</b>를 맡는다. reducer 는 순수 함수여야 해서 API 호출을
 * 넣을 수 없고, 컴포넌트에 넣으면 화면마다 같은 코드를 반복하게 된다. 그래서 중간층을 둔다 —
 * 백엔드에서 컨트롤러가 아니라 서비스에 업무 규칙을 두는 것과 같은 이유다.</p>
 *
 * <p><b>기본 골격</b> — 이 파일의 사가는 전부 같은 모양이다.</p>
 * <pre>
 *   try {
 *     yield call(api함수, 인자)     // 응답이 올 때까지 기다린다
 *     yield put(성공액션(결과))      // slice 에 결과를 넣는다
 *     yield put(재조회액션())        // (변경 작업일 때) 목록을 다시 불러온다
 *   } catch (err) {
 *     yield put(실패액션(getSurgeryErrorMessage(err, "기본 문구")))
 *   }
 * </pre>
 *
 * <p><b>call / put</b> — call 은 함수를 부르고 끝날 때까지 기다린다. put 은 액션을 흘려보낸다
 * (컴포넌트의 dispatch 와 같다). api.ts 안에서는 async/await 를 쓰지만 saga 안에서는 yield 를
 * 쓴다. 하는 일은 같고, 제너레이터 함수라 문법이 다를 뿐이다.</p>
 *
 * <p><b>takeLatest 를 쓰는 이유</b> — 같은 액션이 연달아 오면 <b>이전 것을 취소하고 마지막만</b>
 * 처리한다. 사용자가 버튼을 빠르게 두 번 눌러도 응답이 뒤섞이지 않는다.
 * 모두 처리해야 하는 경우에는 takeEvery 를 쓰지만, 조회·저장에는 takeLatest 가 맞다.</p>
 *
 * <p><b>변경 후 목록을 다시 부르는 이유</b> — 서버가 최종 상태를 갖고 있어서다. 화면에서
 * 짐작해 상태를 고치면 다른 사람이 동시에 바꾼 내용과 어긋난다. 한 번 더 조회하는 편이 안전하다.</p>
 *
 * <p>맨 아래 default export 가 이 도메인의 watcher 다. features/surgery/saga.ts 가 이들을
 * 묶고, store/rootSaga.ts 는 수술 전체를 한 줄로만 등록한다(§5.4 공용 파일 최소 수정).</p>
 */
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
