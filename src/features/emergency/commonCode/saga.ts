import { call, delay, put, takeLeading } from "redux-saga/effects";
import { getAllCommonCodes } from "@/features/emergency/commonCode/api";
import {
  fetchAllCommonCodesFailure,
  fetchAllCommonCodesRequest,
  fetchAllCommonCodesSuccess,
} from "@/features/emergency/commonCode/slice";
import type { CommonCodeByGroup } from "@/features/emergency/commonCode/types";

/** 공통코드 조회 최대 시도 횟수와 재시도 간격(시도 순번만큼 늘어난다: 1초, 2초) */
export const COMMON_CODE_MAX_ATTEMPTS = 3;
export const COMMON_CODE_RETRY_DELAY_MS = 1000;

/**
 * 공통코드를 조회한다. 서버가 막 켜져서 적재 중이거나(502·빈 응답) 순간적으로 실패하면 잠시 뒤 다시 시도한다.
 * 한 번 실패로 확정하면 화면이 새로고침할 때까지 우선순위가 STAT 하나만 보이고 진료과·병동 선택칸이 입력칸으로 바뀐다.
 * 끝까지 실패하면 Failure 로 알리고(loaded 로 표시되어 더 요청하지 않는다) 화면은 코드 안의 기본 선택지를 쓴다.
 */
export function* fetchAllCommonCodesSaga() {
  let lastMessage = "Failed to load common codes.";
  for (let attempt = 1; attempt <= COMMON_CODE_MAX_ATTEMPTS; attempt += 1) {
    try {
      const byGroupCode: CommonCodeByGroup = yield call(getAllCommonCodes);
      if (byGroupCode && Object.keys(byGroupCode).length > 0) {
        yield put(fetchAllCommonCodesSuccess(byGroupCode));
        return;
      }
      // 서버가 아직 코드를 적재하지 못해 빈 목록을 준 경우
      lastMessage = "Common codes are not ready yet.";
    } catch (err) {
      // 공통코드 조회에 실패했습니다.
      lastMessage = err instanceof Error ? err.message : "Failed to load common codes.";
    }
    if (attempt < COMMON_CODE_MAX_ATTEMPTS) {
      yield delay(COMMON_CODE_RETRY_DELAY_MS * attempt);
    }
  }
  yield put(fetchAllCommonCodesFailure(lastMessage));
}

export default function* commonCodeSaga() {
  // 여러 패널이 한꺼번에 요청해도(각자 "아직 안 받았으면 요청") 진행 중인 조회가 끝날 때까지 나머지는 무시한다 → 요청은 한 번만 나간다
  yield takeLeading(fetchAllCommonCodesRequest.type, fetchAllCommonCodesSaga);
}
