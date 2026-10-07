import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { getEmergencyReceptionList, registerEmergencyReception } from "./api";
import {
  fetchEmergencyReceptionListRequest,
  fetchEmergencyReceptionListSuccess,
  fetchEmergencyReceptionListFailure,
  registerEmergencyReceptionRequest,
  registerEmergencyReceptionSuccess,
  registerEmergencyReceptionFailure,
} from "./slice";
import type {
  EmergencyReceptionListItem,
  EmergencyReceptionRequest,
} from "./types";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function* fetchEmergencyReceptionListSaga() {
  try {
    const items: EmergencyReceptionListItem[] = yield call(
      getEmergencyReceptionList,
    );
    yield put(fetchEmergencyReceptionListSuccess(items));
  } catch (err) {
    yield put(
      fetchEmergencyReceptionListFailure(
        errorMessage(err, "Failed to load the emergency reception list."),
      ),
    );
  }
}

function* registerEmergencyReceptionSaga(
  action: PayloadAction<EmergencyReceptionRequest>,
) {
  try {
    yield call(registerEmergencyReception, action.payload);
    yield put(registerEmergencyReceptionSuccess());
    yield put(fetchEmergencyReceptionListRequest());
  } catch (err) {
    yield put(
      registerEmergencyReceptionFailure(
        errorMessage(err, "Failed to register the emergency reception."),
      ),
    );
  }
}

export default function* emergencyReceptionSaga() {
  yield takeLatest(
    fetchEmergencyReceptionListRequest.type,
    fetchEmergencyReceptionListSaga,
  );
  yield takeLatest(
    registerEmergencyReceptionRequest.type,
    registerEmergencyReceptionSaga,
  );
}
