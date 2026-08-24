/**
 * [외래(OPD) 공통코드 로컬 캐시 Saga]
 *
 * outpatientSaga 에 fork 되는 즉시(=앱 구동 시) 그룹 전체를 조회하고, 그룹별 항목을
 * 병렬로 받아 그룹코드 기준 맵으로 한 번만 적재한다. 이후 별도 재조회는 하지 않는다.
 *
 * API 호출은 features/commonCode/api 의 기존 함수를 그대로 재사용한다(수정 없음).
 */
import { all, call, put } from "redux-saga/effects";
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

/** outpatientSaga 에서 fork. 앱 구동 시 1회만 자동 실행된다(외부 dispatch 불필요). */
export function* watchOutpatientCommonCodeSaga() {
  yield put(loadAllCommonCodesRequest());
  yield call(loadAllCommonCodesSaga);
}
