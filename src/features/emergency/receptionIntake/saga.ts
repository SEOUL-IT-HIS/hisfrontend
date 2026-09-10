import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createReceptionIntake } from "@/features/emergency/receptionIntake/api";
import {
  createReceptionIntakeFailure,
  createReceptionIntakeRequest,
  createReceptionIntakeSuccess,
} from "@/features/emergency/receptionIntake/slice";
import type {
  ReceptionIntake,
  ReceptionIntakeCreateRequest,
} from "@/features/emergency/receptionIntake/types";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function* createReceptionIntakeSaga(action: PayloadAction<ReceptionIntakeCreateRequest>) {
  try {
    const intake: ReceptionIntake = yield call(createReceptionIntake, action.payload);
    yield put(createReceptionIntakeSuccess(intake));
  } catch (err) {
    // 접수 정보 등록에 실패했습니다.
    yield put(createReceptionIntakeFailure(errorMessage(err, "Failed to register reception intake.")));
  }
}

export default function* receptionIntakeSaga() {
  yield takeLatest(createReceptionIntakeRequest.type, createReceptionIntakeSaga);
}
