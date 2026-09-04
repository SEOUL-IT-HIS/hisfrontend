import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  acceptSpecimen,
  createSpecimen,
  fetchSpecimenByBarcode,
  fetchSpecimensByReceptionNo,
} from "@/features/labimaging/labspecimen/api";
import {
  fetchSpecimensRequest,
  fetchSpecimensSuccess,
  fetchSpecimensFailure,
  createSpecimenRequest,
  createSpecimenSuccess,
  createSpecimenFailure,
  acceptSpecimenRequest,
  acceptSpecimenSuccess,
  acceptSpecimenFailure,
  lookupSpecimenByBarcodeRequest,
  lookupSpecimenByBarcodeSuccess,
  lookupSpecimenByBarcodeFailure,
} from "@/features/labimaging/labspecimen/slice";
import type {
  SpecimenAcceptanceRequest,
  SpecimenAcceptanceSummary,
  SpecimenCreateRequest,
  SpecimenSummary,
} from "@/features/labimaging/labspecimen/types";

/**
 * labspecimen saga — API 호출은 여기서만 (가이드 10.3).
 * 실패 시 Error.message(백엔드 message)를 그대로 실어 보내고, 문구 변환은 컴포넌트에서 처리.
 */
function* fetchSpecimensSaga(action: PayloadAction<string>) {
  try {
    const list: SpecimenSummary[] = yield call(
      fetchSpecimensByReceptionNo,
      action.payload,
    );
    yield put(fetchSpecimensSuccess(list));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load specimen list.";
    yield put(fetchSpecimensFailure(message));
  }
}

/**
 * 등록에 성공하면 그 접수의 검체 목록을 다시 불러온다.
 * 방금 등록한 검체가 아래 목록에 바로 보여야 담당자가 결과를 확인할 수 있다.
 */
function* createSpecimenSaga(
  action: PayloadAction<{ request: SpecimenCreateRequest; receptionNo: string }>,
) {
  const { request, receptionNo } = action.payload;
  try {
    const created: SpecimenSummary = yield call(createSpecimen, request);
    yield put(createSpecimenSuccess(created));
    yield put(fetchSpecimensRequest(receptionNo));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to register specimen.";
    yield put(createSpecimenFailure(message));
  }
}

/**
 * 판정에 성공하면 그 접수의 검체 목록을 다시 불러온다.
 * 방금 판정한 검체의 적합성 컬럼이 "미판정"에서 바로 바뀌어야 결과를 확인할 수 있다.
 */
function* acceptSpecimenSaga(
  action: PayloadAction<{
    specimenId: string;
    request: SpecimenAcceptanceRequest;
    receptionNo: string;
  }>,
) {
  const { specimenId, request, receptionNo } = action.payload;
  try {
    const accepted: SpecimenAcceptanceSummary = yield call(
      acceptSpecimen,
      specimenId,
      request,
    );
    yield put(acceptSpecimenSuccess(accepted));
    yield put(fetchSpecimensRequest(receptionNo));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to submit fitness assessment.";
    yield put(acceptSpecimenFailure(message));
  }
}

/**
 * 바코드로 검체를 찾는다. (ZP2-75)
 *
 * ⚠ 조회만 하고 끝난다. 목록을 다시 부르지 않는다.
 *   찾은 검체가 이 접수 것이라면 이미 목록에 들어 있고(목록은 접수번호로 받아온다),
 *   이 접수 것이 아니라면 목록에 넣어서도 안 되는 검체다.
 *
 * ⚠ 없는 바코드(LAB020)의 문구는 서버가 내려준 것을 그대로 싣는다.
 *   그 문구에 입력한 바코드가 들어 있어 담당자가 오타를 바로 확인할 수 있다.
 */
function* lookupSpecimenByBarcodeSaga(action: PayloadAction<string>) {
  try {
    const specimen: SpecimenSummary = yield call(
      fetchSpecimenByBarcode,
      action.payload,
    );
    yield put(lookupSpecimenByBarcodeSuccess(specimen));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to look up barcode.";
    yield put(lookupSpecimenByBarcodeFailure(message));
  }
}

export default function* labSpecimenSaga() {
  yield takeLatest(fetchSpecimensRequest.type, fetchSpecimensSaga);
  yield takeLatest(createSpecimenRequest.type, createSpecimenSaga);
  yield takeLatest(acceptSpecimenRequest.type, acceptSpecimenSaga);
  yield takeLatest(lookupSpecimenByBarcodeRequest.type, lookupSpecimenByBarcodeSaga);
}
