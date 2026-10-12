"use client";

import { useEffect, useRef, useState } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { Alert, Button, ConfirmDialog, FormField, Select } from "@/components/common";
import { useEmpNames } from "@/features/emp/hooks/useEmpNames";
import {
    createAdmissionRequestRequest,
    dispatchAdmissionRequestRequest,
    fetchAdmissionRequestListRequest,
} from "@/features/outpatient/admissionrequest/slice";
import {
    ADMISSION_REQUEST_STATUS,
    ADMISSION_SEND_STATUS,
    type AdmissionRequestDto,
} from "@/features/outpatient/admissionrequest/types";
import { useOutpatientCommonCodeOptions } from "@/features/outpatient/commonCode/useOutpatientCommonCodeOptions";
import type { EncounterDto } from "@/features/outpatient/encounter/types";
import type { AppDispatch, RootState } from "@/store/store";
import {
    ADMISSION_DEFAULT_BADGE_CLASS,
    ADMISSION_STATUS_BADGE_CLASS,
    ADMISSION_STATUS_LABEL,
} from "./AdmissionRequestStatusBadge";

type AdmissionRequestPanelProps = {
    encounter: EncounterDto;
    // 목록 기준 최신 진료 상태 (WAITING/PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
    encounterStatus: string;
};

// 병동 회신(병상 배정/거부)은 Kafka 로 비동기 도착하므로, 회신을 기다리는 동안 주기적으로 다시 조회한다
const REFRESH_INTERVAL_MS = 10_000;

// 요청 메모 최대 길이 (백엔드 NOTE_MAX_LENGTH 와 동일)
const NOTE_MAX_LENGTH = 500;

const formatDateTime = (value?: string | null) => (value ? value.replace("T", " ").slice(0, 19) : "-");

// 병동으로 요청을 보낼 수 있는 진료 상태: 진료 완료(진료기록 저장 후)만.
// 백엔드는 진료 중(IN_PROGRESS)도 받지만, 진찰·검사 처방을 마친 뒤에 입원을 요청하도록 화면에서 더 좁게 제한한다.
const isRequestableStatus = (status: string) => status === "COMPLETED";

const AdmissionRequestPanel = ({ encounter, encounterStatus }: AdmissionRequestPanelProps) => {
    const dispatch = useDispatch<AppDispatch>();

    // encounterId 가 없으면 receptionId 를 대신 쓴다 (진료 저장/시작과 같은 안전장치)
    const encounterId = encounter.encounterId || encounter.receptionId;

    // 요청 의사 empId -> 이름 (조회 실패 시 ID 그대로 표시)
    const { names: empNames } = useEmpNames();

    // 진료과 select 옵션 (ADM 공통코드 DEPT_CD) — 서버가 이름을 못 채워 준 경우의 폴백으로도 쓴다
    const { options: deptOptions, loading: deptLoading } = useOutpatientCommonCodeOptions("DEPT_CD");
    // 배정 병동 이름 폴백 (ADM 공통코드 WARD_CD) — 이미 적재된 공통코드 캐시에서 읽기만 한다
    const wardItems = useSelector(
        (state: RootState) => state.outpatient.commonCode.itemsByGroupCode["WARD_CD"]
    );

    const { encounterIdOfList, list, listLoading, listError, createLoading, createError, dispatchStatus } =
        useSelector(
            (state: RootState) => ({
                encounterIdOfList: state.outpatient.admissionrequest.encounterId,
                list: state.outpatient.admissionrequest.list,
                listLoading: state.outpatient.admissionrequest.listStatus.loading,
                listError: state.outpatient.admissionrequest.listStatus.error,
                createLoading: state.outpatient.admissionrequest.createStatus.loading,
                createError: state.outpatient.admissionrequest.createStatus.error,
                dispatchStatus: state.outpatient.admissionrequest.dispatchStatus,
            }),
            shallowEqual
        );

    // 선택한 진료의 목록이 아직 도착하기 전에는 비어 있는 것으로 본다 (이전 환자의 요청을 보여주지 않는다)
    const requests: AdmissionRequestDto[] = encounterIdOfList === encounterId ? list : [];
    const listReady = encounterIdOfList === encounterId && !listLoading;

    // 입력 폼 상태 — 진료과를 비우면 진료를 본 진료과로 요청한다
    const [deptCode, setDeptCode] = useState("");
    const [requestNote, setRequestNote] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);
    // 방금 이 화면에서 등록했는지 (등록 직후 결과 안내를 한 번 보여주기 위함)
    const [justCreated, setJustCreated] = useState(false);

    // 진행 중인 요청: 병동 회신 대기(01)와 병상 배정(02). 거부(03)된 요청만 같은 진료에서 다시 요청할 수 있다
    const activeRequest = requests.find(
        (item) =>
            item.requestStatus === ADMISSION_REQUEST_STATUS.REQUESTED ||
            item.requestStatus === ADMISSION_REQUEST_STATUS.BED_ASSIGNED
    );
    const waitingForWard = requests.some((item) => item.requestStatus === ADMISSION_REQUEST_STATUS.REQUESTED);
    const requestable = isRequestableStatus(encounterStatus);
    const canRequest = requestable && listReady && !activeRequest;

    // 화면이 열리거나 진료가 바뀌면 해당 진료의 요청을 조회 (입력 내용은 부모가 key 로 초기화한다)
    useEffect(() => {
        dispatch(fetchAdmissionRequestListRequest({ encounterId }));
    }, [dispatch, encounterId]);

    // 병동 회신을 기다리는 동안에만 주기적으로 재조회 (화면이 보일 때만, 다시 보이는 순간 한 번 바로 조회)
    useEffect(() => {
        if (!waitingForWard) return;
        const refresh = () => {
            if (document.visibilityState === "visible") {
                dispatch(fetchAdmissionRequestListRequest({ encounterId, silent: true }));
            }
        };
        const timer = setInterval(refresh, REFRESH_INTERVAL_MS);
        document.addEventListener("visibilitychange", refresh);
        return () => {
            clearInterval(timer);
            document.removeEventListener("visibilitychange", refresh);
        };
    }, [dispatch, encounterId, waitingForWard]);

    // 등록 요청(loading true -> false) 에러가 없으면 성공으로 보고 입력을 비움
    const prevCreateLoading = useRef(false);
    useEffect(() => {
        if (prevCreateLoading.current && !createLoading && !createError) {
            setDeptCode("");
            setRequestNote("");
            setJustCreated(true);
        }
        prevCreateLoading.current = createLoading;
    }, [createLoading, createError]);

    const handleSend = () => {
        setConfirmOpen(false);
        setJustCreated(false);
        dispatch(
            createAdmissionRequestRequest({
                encounterId,
                payload: {
                    admissionDeptCode: deptCode || undefined,
                    requestNote: requestNote.trim() || undefined,
                },
            })
        );
    };

    const handleResend = (admissionRequestId: string) => {
        setJustCreated(false);
        dispatch(dispatchAdmissionRequestRequest(admissionRequestId));
    };

    const deptLabel = (item: AdmissionRequestDto) =>
        item.admissionDeptName ??
        deptOptions.find((option) => option.value === item.admissionDeptCode)?.label ??
        item.admissionDeptCode;
    const wardLabel = (item: AdmissionRequestDto) =>
        item.assignedWardName ??
        wardItems?.find((ward) => ward.codeValue === item.assignedWardCode)?.codeName ??
        item.assignedWardCode ??
        "-";

    // 진료과 select 옵션 앞에 "진료를 본 진료과(기본)" 를 보여준다
    const defaultDeptName = encounter.departmentName ?? encounter.departmentCode ?? "-";

    // 병동 전송 상태 안내 (병동 회신을 기다리는 요청에만 의미가 있다)
    const renderDelivery = (item: AdmissionRequestDto) => {
        if (item.requestStatus !== ADMISSION_REQUEST_STATUS.REQUESTED) return null;
        if (item.sendStatus === ADMISSION_SEND_STATUS.SENT) {
            return (
                <p className="text-xs text-slate-500">
                    {/* 병동으로 전송되었습니다. 병동 회신을 기다리는 중입니다. */}
                    Sent to the ward ({formatDateTime(item.sentAt)}). Waiting for the ward&apos;s reply.
                </p>
            );
        }
        const resending =
            dispatchStatus.loading && dispatchStatus.admissionRequestId === item.admissionRequestId;
        return (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-xs text-amber-700">
                    {/* 아직 병동으로 전송되지 않았습니다. 다시 전송해 주세요. */}
                    {item.sendStatus === ADMISSION_SEND_STATUS.FAILED
                        ? "Sending to the ward failed. Please resend the request."
                        : "This request has not been sent to the ward yet. Please resend it."}
                </p>
                <Button
                    variant="secondary"
                    onClick={() => handleResend(item.admissionRequestId)}
                    disabled={dispatchStatus.loading}
                >
                    {/* 재전송 중... / 재전송 */}
                    {resending ? "Resending..." : "Resend"}
                </Button>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    {/* 입원 요청 */}
                    <h3 className="text-base font-semibold text-slate-800">Admission Request</h3>
                    {/* 병동으로 입원을 요청합니다. 병동이 병상 배정 또는 거부로 회신합니다. */}
                    <p className="mt-0.5 text-xs text-slate-500">
                        Request admission to the ward. The ward replies with a bed assignment or a rejection.
                    </p>
                </div>
                <Button
                    variant="secondary"
                    onClick={() => dispatch(fetchAdmissionRequestListRequest({ encounterId }))}
                    disabled={listLoading}
                >
                    {/* 새로고침 */}
                    Refresh
                </Button>
            </div>

            {listError && <Alert variant="error">{listError}</Alert>}

            {/* 입원 요청 작성 */}
            {!requestable ? (
                <Alert variant="info">
                    {encounterStatus === "CANCELLED"
                        ? // 접수가 취소되어 입원을 요청할 수 없습니다.
                          "This reception was cancelled. An admission cannot be requested."
                        : // 진료를 마친 뒤(진료기록 저장 후)에 입원을 요청할 수 있습니다.
                          "An admission can be requested after the consultation is completed. Please save the medical record first."}
                </Alert>
            ) : activeRequest ? (
                <Alert variant="info">
                    {/* 이미 진행 중인 입원 요청이 있습니다. 병동이 거부한 경우에만 다시 요청할 수 있습니다. */}
                    An admission request is already in progress. You can request again only if the ward rejects it.
                </Alert>
            ) : (
                <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <FormField
                        label="Admission Department"
                        // 선택하지 않으면 진료를 본 진료과로 요청합니다.
                        hint="If left empty, the request is sent to the department that saw the patient."
                    >
                        <Select
                            options={deptOptions}
                            value={deptCode}
                            placeholder={`${defaultDeptName} (consultation department)`}
                            onChange={(e) => setDeptCode(e.target.value)}
                            disabled={createLoading || deptLoading}
                        />
                    </FormField>

                    <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="admission-note">
                            {/* 요청 메모 (병동에 전달) */}
                            Note
                        </label>
                        <textarea
                            id="admission-note"
                            value={requestNote}
                            maxLength={NOTE_MAX_LENGTH}
                            onChange={(e) => setRequestNote(e.target.value)}
                            disabled={createLoading}
                            // 병동에 전달할 요청 사유나 참고사항을 작성해 주세요. (선택)
                            placeholder="Enter the reason for admission or anything the ward should know. (optional)"
                            className="min-h-[96px] w-full rounded-md border border-slate-300 p-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-500"
                        />
                        <p className="mt-1 text-right text-xs text-slate-400">
                            {requestNote.length} / {NOTE_MAX_LENGTH}
                        </p>
                    </div>

                    {createError && <Alert variant="error">{createError}</Alert>}

                    <div className="flex justify-end">
                        <Button variant="primary" onClick={() => setConfirmOpen(true)} disabled={!canRequest || createLoading}>
                            {/* 전송 중... / 입원 요청 */}
                            {createLoading ? "Sending..." : "Request Admission"}
                        </Button>
                    </div>
                </div>
            )}

            {/* 방금 등록한 요청이 병동으로 전송됐을 때 (전송 실패는 아래 이력 카드에서 재전송 안내) */}
            {justCreated && requests[0]?.sendStatus === ADMISSION_SEND_STATUS.SENT && (
                // 입원 요청을 병동으로 전송했습니다.
                <Alert variant="success">The admission request was sent to the ward.</Alert>
            )}
            {dispatchStatus.error && <Alert variant="error">{dispatchStatus.error}</Alert>}

            {/* 요청 이력 (최근 요청이 먼저) */}
            <div className="flex flex-col gap-3">
                <h4 className="text-sm font-semibold text-slate-700">Request History</h4>
                {!listReady && requests.length === 0 ? (
                    // 입원 요청을 불러오는 중입니다...
                    <p className="p-4 text-center text-sm text-slate-500">Loading admission requests...</p>
                ) : requests.length === 0 ? (
                    // 등록된 입원 요청이 없습니다.
                    <p className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                        No admission requests yet.
                    </p>
                ) : (
                    requests.map((item) => (
                        <div
                            key={item.admissionRequestId}
                            className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`rounded-full border px-2 py-0.5 text-xs ${
                                            ADMISSION_STATUS_BADGE_CLASS[item.requestStatus] ?? ADMISSION_DEFAULT_BADGE_CLASS
                                        }`}
                                    >
                                        {ADMISSION_STATUS_LABEL[item.requestStatus] ?? item.requestStatusName ?? item.requestStatus}
                                    </span>
                                    <span className="text-sm font-medium text-slate-800">{deptLabel(item)}</span>
                                </div>
                                <span className="text-xs text-slate-500">
                                    {formatDateTime(item.requestedAt)} ·{" "}
                                    {empNames[item.requestedBy] ?? item.requestedBy}
                                </span>
                            </div>

                            {item.requestNote && (
                                <p className="whitespace-pre-wrap text-sm text-slate-700">{item.requestNote}</p>
                            )}

                            {item.requestStatus === ADMISSION_REQUEST_STATUS.BED_ASSIGNED && (
                                <p className="text-sm text-emerald-700">
                                    {/* 배정 병동 / 회신 일시 */}
                                    Assigned ward: <span className="font-semibold">{wardLabel(item)}</span> · Replied{" "}
                                    {formatDateTime(item.respondedAt)}
                                </p>
                            )}
                            {item.requestStatus === ADMISSION_REQUEST_STATUS.REJECTED && (
                                <p className="text-sm text-red-600">
                                    {/* 거부 사유 / 회신 일시 */}
                                    Rejected: {item.rejectReason || "No reason provided"} · Replied{" "}
                                    {formatDateTime(item.respondedAt)}
                                </p>
                            )}

                            {renderDelivery(item)}
                        </div>
                    ))
                )}
            </div>

            <ConfirmDialog
                open={confirmOpen}
                // 입원 요청
                title="Request Admission"
                // 병동으로 입원 요청을 전송합니다. 전송한 요청은 취소할 수 없습니다.
                message={`Send an admission request for ${encounter.patientName ?? "this patient"} to the ward? A sent request cannot be cancelled.`}
                confirmLabel="Send"
                cancelLabel="Cancel"
                onConfirm={handleSend}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
};

export default AdmissionRequestPanel;
