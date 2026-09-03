import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  createImageOrder,
  fetchImageReceptions,
  fetchImageReceptionByNo,
  fetchImageWorklist,
  excludeImageReception,
  restoreImageReception,
} from "@/features/labimaging/imagingorder/api";
import {
  createImageOrderFailure,
  createImageOrderRequest,
  createImageOrderSuccess,
  fetchImageReceptionsRequest,
  fetchImageReceptionsSuccess,
  fetchImageReceptionsFailure,
  fetchImageReceptionByNoRequest,
  fetchImageReceptionByNoSuccess,
  fetchImageReceptionByNoFailure,
  fetchImageWorklistRequest,
  fetchImageWorklistSuccess,
  fetchImageWorklistFailure,
  excludeImageReceptionRequest,
  restoreImageReceptionRequest,
  imageExclusionSuccess,
  imageExclusionFailure,
} from "@/features/labimaging/imagingorder/slice";
import type {
  ImageOrderCreateRequest,
  ImageOrderCreateResponse,
  ImageReceptionDetail,
  ImageReceptionSummary,
  ImageWorklistItem,
  ImageWorklistStatusFilter,
  ReceptionScheduledFilter,
} from "@/features/labimaging/imagingorder/types";

/** imagingOrder saga (laborder 과 동일 패턴) — API 호출은 여기서만 (가이드 10.3). */
function* createImageOrderSaga(action: PayloadAction<ImageOrderCreateRequest>) {
  try {
    const response: ImageOrderCreateResponse = yield call(
      createImageOrder,
      action.payload,
    );
    yield put(createImageOrderSuccess(response));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create imaging reception.";
    yield put(createImageOrderFailure(message));
  }
}

function* fetchImageReceptionsSaga(
  action: PayloadAction<ReceptionScheduledFilter | undefined>,
) {
  try {
    // "ALL"(또는 미지정)이면 파라미터를 보내지 않아 백엔드가 전체를 반환한다.
    const filter = action.payload;
    const scheduledYn = filter && filter !== "ALL" ? filter : undefined;

    const list: ImageReceptionSummary[] = yield call(fetchImageReceptions, scheduledYn);
    yield put(fetchImageReceptionsSuccess(list));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load reception list.";
    yield put(fetchImageReceptionsFailure(message));
  }
}

function* fetchImageReceptionByNoSaga(action: PayloadAction<string>) {
  try {
    const reception: ImageReceptionDetail = yield call(
      fetchImageReceptionByNo,
      action.payload,
    );
    yield put(fetchImageReceptionByNoSuccess(reception));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load reception.";
    yield put(fetchImageReceptionByNoFailure(message));
  }
}

/**
 * 영상 워크리스트 조회. (진행 상태 포함)
 *
 * ⚠ "ALL" 은 파라미터를 보내지 않는다. 백엔드가 값이 없으면 전체를 반환한다.
 *   문자열 "ALL" 을 그대로 넘기면 서버가 모르는 상태코드로 받아 전체를 주긴 하지만,
 *   계약에 없는 값을 흘리는 셈이라 화면에서 걸러 보낸다. (검사 워크리스트와 같은 처리)
 */
function* fetchImageWorklistSaga(
  action: PayloadAction<ImageWorklistStatusFilter | undefined>,
) {
  try {
    const filter = action.payload;
    const list: ImageWorklistItem[] = yield call(
      fetchImageWorklist,
      filter && filter !== "ALL" ? filter : undefined,
    );
    yield put(fetchImageWorklistSuccess(list));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load worklist.";
    yield put(fetchImageWorklistFailure(message));
  }
}

/**
 * 제외·복구는 성공해도 응답 본문이 없다. 목록을 다시 불러와야 화면이 바뀐다.
 * 어느 필터로 보고 있었는지는 payload 로 받아 그대로 다시 조회한다.
 */
function* excludeImageReceptionSaga(
  action: PayloadAction<{
    receptionNo: string;
    exclusionReason: string;
    filter: ImageWorklistStatusFilter;
  }>,
) {
  const { receptionNo, exclusionReason, filter } = action.payload;
  try {
    yield call(excludeImageReception, receptionNo, { exclusionReason });
    yield put(imageExclusionSuccess());
    yield put(fetchImageWorklistRequest(filter));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to exclude reception.";
    yield put(imageExclusionFailure(message));
  }
}

function* restoreImageReceptionSaga(
  action: PayloadAction<{ receptionNo: string; filter: ImageWorklistStatusFilter }>,
) {
  const { receptionNo, filter } = action.payload;
  try {
    yield call(restoreImageReception, receptionNo);
    yield put(imageExclusionSuccess());
    yield put(fetchImageWorklistRequest(filter));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to restore reception.";
    yield put(imageExclusionFailure(message));
  }
}

export default function* imageOrderSaga() {
  yield takeLatest(createImageOrderRequest.type, createImageOrderSaga);
  yield takeLatest(fetchImageReceptionsRequest.type, fetchImageReceptionsSaga);
  yield takeLatest(
    fetchImageReceptionByNoRequest.type,
    fetchImageReceptionByNoSaga,
  );
  yield takeLatest(fetchImageWorklistRequest.type, fetchImageWorklistSaga);
  yield takeLatest(excludeImageReceptionRequest.type, excludeImageReceptionSaga);
  yield takeLatest(restoreImageReceptionRequest.type, restoreImageReceptionSaga);
}
