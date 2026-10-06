import { all, call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  confirmMicrobiologyResult,
  createMicrobiologyResult,
  fetchMicrobiologyResults,
  updateMicrobiologyResult,
} from "@/features/labimaging/microbiologyresult/api";
import { fetchSpecimensByReceptionNo } from "@/features/labimaging/labspecimen/api";
import {
  fetchMicrobiologyResultsRequest,
  fetchMicrobiologyResultsSuccess,
  fetchMicrobiologyResultsFailure,
  createMicrobiologyResultRequest,
  updateMicrobiologyResultRequest,
  confirmMicrobiologyResultRequest,
  submitMicrobiologyResultSuccess,
  submitMicrobiologyResultFailure,
} from "@/features/labimaging/microbiologyresult/slice";
import type {
  MicrobiologyResultCreateRequest,
  MicrobiologyResultSummary,
  MicrobiologyResultUpdateRequest,
} from "@/features/labimaging/microbiologyresult/types";
import type { LabResultConfirmRequest } from "@/features/labimaging/labresult/types";
import type { SpecimenSummary } from "@/features/labimaging/labspecimen/types";

/**
 * 미생물검사결과 saga — UC-RST-02 (5차 Phase 3)
 *
 * ⚠ 결과와 검체를 한 번에 불러온다. 결과를 붙일 검체(적합 판정된 것)를 폼에서 골라야 하는데,
 *   검체 목록은 labspecimen API 를 재사용한다(같은 접수번호 조회). slice 를 따로 묶지 않은 이유 —
 *   검체 탭의 slice 를 건드리면 검체 탭 화면이 이 패널 때문에 다시 그려진다.
 */
function* fetchSaga(action: PayloadAction<string>) {
  try {
    const [results, specimens]: [MicrobiologyResultSummary[], SpecimenSummary[]] = yield all([
      call(fetchMicrobiologyResults, action.payload),
      call(fetchSpecimensByReceptionNo, action.payload),
    ]);
    yield put(fetchMicrobiologyResultsSuccess({ results, specimens }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load microbiology results.";
    yield put(fetchMicrobiologyResultsFailure(message));
  }
}

function* createSaga(action: PayloadAction<{ request: MicrobiologyResultCreateRequest; receptionNo: string }>) {
  const { request, receptionNo } = action.payload;
  try {
    const saved: MicrobiologyResultSummary = yield call(createMicrobiologyResult, request);
    yield put(submitMicrobiologyResultSuccess(saved));
    yield put(fetchMicrobiologyResultsRequest(receptionNo));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to register microbiology result.";
    yield put(submitMicrobiologyResultFailure(message));
  }
}

function* updateSaga(
  action: PayloadAction<{ microbiologyResultId: string; request: MicrobiologyResultUpdateRequest; receptionNo: string }>,
) {
  const { microbiologyResultId, request, receptionNo } = action.payload;
  try {
    const saved: MicrobiologyResultSummary = yield call(updateMicrobiologyResult, microbiologyResultId, request);
    yield put(submitMicrobiologyResultSuccess(saved));
    yield put(fetchMicrobiologyResultsRequest(receptionNo));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update microbiology result.";
    yield put(submitMicrobiologyResultFailure(message));
  }
}

function* confirmSaga(
  action: PayloadAction<{ microbiologyResultId: string; request: LabResultConfirmRequest; receptionNo: string }>,
) {
  const { microbiologyResultId, request, receptionNo } = action.payload;
  try {
    const saved: MicrobiologyResultSummary = yield call(confirmMicrobiologyResult, microbiologyResultId, request);
    yield put(submitMicrobiologyResultSuccess(saved));
    yield put(fetchMicrobiologyResultsRequest(receptionNo));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to confirm microbiology result.";
    yield put(submitMicrobiologyResultFailure(message));
  }
}

export default function* microbiologyResultSaga() {
  yield takeLatest(fetchMicrobiologyResultsRequest.type, fetchSaga);
  yield takeLatest(createMicrobiologyResultRequest.type, createSaga);
  yield takeLatest(updateMicrobiologyResultRequest.type, updateSaga);
  yield takeLatest(confirmMicrobiologyResultRequest.type, confirmSaga);
}
