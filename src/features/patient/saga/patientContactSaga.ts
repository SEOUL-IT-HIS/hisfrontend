import { isAxiosError } from "axios";
import {
    all,
    call,
    put,
    race,
    select,
    take,
    takeEvery,
    takeLatest,
} from "redux-saga/effects";
import type { RootState } from "@/store/store";
import {
    createPatientContactApi,
    deactivatePatientContactApi,
    fetchPatientContactListApi,
    setPrimaryPatientContactApi,
    updatePatientContactApi,
} from "../api/patientContactApi";
import {
    fetchPatientContactListFailure,
    fetchPatientContactListRequest,
    fetchPatientContactListSuccess,
    mutatePatientContactFailure,
    mutatePatientContactRequest,
    mutatePatientContactSuccess,
    resetPatientContact,
} from "../slice/patientContactSlice";
import type { PatientContact } from "../type/patientContactType";

function getErrorMessage(error: unknown): string {
    if (isAxiosError(error)) {
        if (!error.response) {
            return "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.";
        }

        if (error.response.status === 404) {
            return "환자 또는 주소·연락처 정보를 찾을 수 없습니다.";
        }

        if (error.response.status === 409) {
            return "대표 주소·연락처 또는 활성 상태를 확인해 주세요.";
        }

        if (error.response.status === 400) {
            return "입력한 주소·연락처 정보를 확인해 주세요.";
        }
    }

    return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

function* fetchPatientContactListSaga(
    action: ReturnType<typeof fetchPatientContactListRequest>,
) {
    const request = action.payload;

    try {
        const result: {
            items?: PatientContact[];
            reset?: ReturnType<typeof resetPatientContact>;
        } = yield race({
            items: call(fetchPatientContactListApi, request),
            reset: take(resetPatientContact.type),
        });

        if (result.reset || result.items === undefined) {
            return;
        }

        yield put(
            fetchPatientContactListSuccess({
                ...request,
                items: result.items,
            }),
        );
    } catch (error: unknown) {
        yield put(
            fetchPatientContactListFailure({
                ...request,
                message: getErrorMessage(error),
            }),
        );
    }
}

const selectPatientContact = (state: RootState) => state.patientContact;

function* mutatePatientContactSaga(
    action: ReturnType<typeof mutatePatientContactRequest>,
) {
    const request = action.payload;
    const current: ReturnType<typeof selectPatientContact> = yield select(
        selectPatientContact,
    );

    // slice에서 무시된 중복 요청은 API까지 호출하지 않습니다.
    if (current.mutationId !== request.requestId) return;

    try {
        if (request.kind === "create") {
            yield call(createPatientContactApi, request);
        } else if (request.kind === "update") {
            yield call(updatePatientContactApi, request);
        } else if (request.kind === "setPrimary") {
            yield call(setPrimaryPatientContactApi, request);
        } else {
            yield call(deactivatePatientContactApi, request);
        }

        const latest: ReturnType<typeof selectPatientContact> = yield select(
            selectPatientContact,
        );

        if (
            latest.mutationId !== request.requestId ||
            latest.patientId !== request.patientId
        ) {
            return;
        }

        yield put(
            mutatePatientContactSuccess({
                requestId: request.requestId,
            }),
        );

        yield put(
            fetchPatientContactListRequest({
                patientId: request.patientId,
                includeInactive: latest.includeInactive,
            }),
        );
    } catch (error: unknown) {
        yield put(
            mutatePatientContactFailure({
                requestId: request.requestId,
                message: getErrorMessage(error),
            }),
        );
    }
}

export default function* watchPatientContactSaga() {
    yield all([
        takeLatest(
            fetchPatientContactListRequest.type,
            fetchPatientContactListSaga,
        ),
        takeEvery(
            mutatePatientContactRequest.type,
            mutatePatientContactSaga,
        ),
    ]);
}