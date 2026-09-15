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
            return "Unable to connect to the server. Please try again later.";
        }

        if (error.response.status === 404) {
            return "Patient or address and contact information was not found.";
        }

        if (error.response.status === 409) {
            return "Check the primary address and contact information or active status.";
        }

        if (error.response.status === 400) {
            return "Check the address and contact information you entered.";
        }
    }

    return "Unable to complete the request. Please try again later.";
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