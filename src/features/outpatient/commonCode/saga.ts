/**
 * [외래(OPD) 공통코드 로컬 캐시 Saga]
 *
 * admin-service API 에 로그인 세션 가드가 적용되어(IH2-110), 로그인 전 호출은 401 로 막힌다.
 * 그래서 fork 즉시 자동 실행하지 않고, loadAllCommonCodesRequest 가 dispatch 될 때만
 * (useOutpatientCommonCodeOptions 훅이 로그인 이후 외래 화면 진입 시 호출) 그룹 전체를
 * 조회하고, 그룹별 항목을 병렬로 받아 그룹코드 기준 맵으로 적재한다.
 *
 * API 호출은 features/commonCode/api 의 기존 함수를 그대로 재사용한다(수정 없음).
 */
import { all, call, put, takeLatest } from "redux-saga/effects";
import { fetchCommonCodeGroupApi } from "@/features/commonCode/api/commonCodeGroupApi";
import { fetchCommonCodeItemApi } from "@/features/commonCode/api/commonCodeItemApi";
import type { CommonCodeGroup } from "@/features/commonCode/types/commonCodeGroupTypes";
import type { CommonCodeItem } from "@/features/commonCode/types/commonCodeItemTypes";
import {
  loadAllCommonCodesFailure,
  loadAllCommonCodesRequest,
  loadAllCommonCodesSuccess,
} from "./slice";

function* loadAllCommonCodesSaga() {
  try {
    const groups: CommonCodeGroup[] = yield call(fetchCommonCodeGroupApi);
    const activeGroups = groups.filter((group) => group.useYn === "Y");

    const itemsByGroup: CommonCodeItem[][] = yield all(
      activeGroups.map((group) => call(fetchCommonCodeItemApi, group.groupId)),
    );

    const itemsByGroupCode: Record<string, CommonCodeItem[]> = {};
    activeGroups.forEach((group, index) => {
      itemsByGroupCode[group.groupCode] = itemsByGroup[index].filter(
        (item) => item.useYn === "Y",
      );
    });

    yield put(loadAllCommonCodesSuccess(itemsByGroupCode));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "공통코드 캐시 적재에 실패했습니다.";
    yield put(loadAllCommonCodesFailure(message));
  }
}

/** outpatientSaga 에서 fork. loadAllCommonCodesRequest dispatch 시에만 실행된다. */
export function* watchOutpatientCommonCodeSaga() {
  yield takeLatest(loadAllCommonCodesRequest.type, loadAllCommonCodesSaga);
}
