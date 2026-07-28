import { call, put, takeLatest } from "redux-saga/effects";
import {fetchCommonCodeItemApi, fetchCommonCodeItemRegisterApi} from "../api/commonCodeItemApi";
import {
    fetchCommonCodeItemFailure,
    fetchCommonCodeItemRegisterFailure, fetchCommonCodeItemRegisterRequest, fetchCommonCodeItemRegisterSuccess,
    fetchCommonCodeItemRequest,
    fetchCommonCodeItemSuccess,
} from "../slice/commonCodeItemSlice";
import type { CommonCodeItem } from "../types/commonCodeItemTypes";



function* fetchCommonCodeItemSaga(action : ReturnType<typeof fetchCommonCodeItemRequest>) {
    try {
        const items: CommonCodeItem[] = yield call(fetchCommonCodeItemApi, action.payload);
        yield put(fetchCommonCodeItemSuccess(items));
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "공통코드 아이템 조회에 실패했습니다.";
        yield put(fetchCommonCodeItemFailure(message));
    }
}

function* fetchCommonCodeItemRegisterSaga(action: ReturnType<typeof fetchCommonCodeItemRegisterRequest>) {
    try {
        const newItem: CommonCodeItem = yield call(fetchCommonCodeItemRegisterApi, action.payload);
        yield put(fetchCommonCodeItemRegisterSuccess(newItem));
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "공통코드 아이템 등록에 실패했습니다.";
        yield put(fetchCommonCodeItemRegisterFailure(message));
    }
}


export default function* commonCodeSaga() {
    yield takeLatest(fetchCommonCodeItemRequest.type, fetchCommonCodeItemSaga);
    yield takeLatest(fetchCommonCodeItemRegisterRequest.type, fetchCommonCodeItemRegisterSaga);
}
