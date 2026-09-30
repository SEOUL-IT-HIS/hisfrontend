"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  Alert,
  Button,
  ConfirmDialog,
  DataTable,
  FormField,
  Input,
  Modal,
  Pagination,
  SearchBar,
  Select,
  type DataTableColumn,
} from "@/components/common";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { resolveInterfaceSendLogMessage } from "@/features/labimaging/interfacelog/messages";
import {
  clearInterfaceSendLogDetail,
  fetchInterfaceSendLogDetailRequest,
  fetchInterfaceSendLogsRequest,
  resendInterfaceSendLogRequest,
  selectInterfaceSendLogDetail,
  selectInterfaceSendLogDetailError,
  selectInterfaceSendLogDetailLoading,
  selectInterfaceSendLogList,
  selectInterfaceSendLogLoadError,
  selectInterfaceSendLogLoading,
  selectInterfaceSendLogResendError,
  selectInterfaceSendLogResending,
  selectInterfaceSendLogSearch,
  selectLastResentInterfaceSendLogId,
} from "@/features/labimaging/interfacelog/slice";
import {
  SEND_STATUS,
  type InterfaceSendLog,
  type InterfaceSendLogSearch,
} from "@/features/labimaging/interfacelog/types";

/**
 * 연계 발신 이력 화면 — UC-RST-06 결과전송 이력(ZP2-120) + UC-COM-03 청구 발행 이력(ZP2-124) (5차 Phase 6)
 *
 * 흐름: 유형·상태·기간으로 조회 → 행 클릭 → 상세(원문 JSON) → 실패/대기 건 수동 재전송
 *
 * ⚠ 결과전송과 청구는 서버에서 한 테이블(INTERFACE_SEND_LOG)이라 화면도 유형 필터 하나로 본다.
 * ⚠ 재전송은 같은 event_id·같은 원문으로 다시 발행한다(수신측 멱등). 완료(02) 건과 원문이 없는 건
 *   (예: 수가코드 매핑 없음)은 서버가 LAB092 로 막으므로 화면에서도 버튼을 잠근다.
 * ⚠ 재전송 성공 여부는 Kafka 콜백이 나중에 기록한다. 버튼을 누른 직후에는 "요청됨"만 알 수 있다.
 */
export default function InterfaceSendLogPage() {
  const dispatch = useDispatch<AppDispatch>();
  const lastSearch = useSelector(selectInterfaceSendLogSearch);
  const list = useSelector(selectInterfaceSendLogList);
  const loading = useSelector(selectInterfaceSendLogLoading);
  const loadError = useSelector(selectInterfaceSendLogLoadError);
  const detail = useSelector(selectInterfaceSendLogDetail);
  const detailLoading = useSelector(selectInterfaceSendLogDetailLoading);
  const detailError = useSelector(selectInterfaceSendLogDetailError);
  const resending = useSelector(selectInterfaceSendLogResending);
  const resendError = useSelector(selectInterfaceSendLogResendError);
  const lastResentId = useSelector(selectLastResentInterfaceSendLogId);

  const eventTypes = useCommonCodeOptions("SEND_EVENT_TYPE_CD");
  const statuses = useCommonCodeOptions("TRANSMIT_STATUS_CD");
  const systems = useCommonCodeOptions("SYSTEM_SOURCE_CD");

  // 입력 중인 조건 — 조회 버튼을 눌러야 반영된다(마지막 조회 조건은 slice 에 있다)
  const [form, setForm] = useState<InterfaceSendLogSearch>(lastSearch);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchInterfaceSendLogsRequest(lastSearch));
    // 첫 진입 1회만 — 이후 조회는 조회 버튼·페이지 이동이 한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const labelOf = useMemo(() => {
    const toMap = (options: { value: string; label: string }[]) =>
      new Map(options.map((o) => [o.value, o.label]));
    const eventMap = toMap(eventTypes.options);
    const statusMap = toMap(statuses.options);
    const systemMap = toMap(systems.options);
    // 공통코드를 못 불러오면 코드값을 그대로 보인다(빈칸보다 낫다)
    return {
      event: (code: string | null) => (code ? eventMap.get(code) ?? code : "-"),
      status: (code: string | null) => (code ? statusMap.get(code) ?? code : "-"),
      system: (code: string | null) => (code ? systemMap.get(code) ?? code : "-"),
    };
  }, [eventTypes.options, statuses.options, systems.options]);

  function search(page: number) {
    dispatch(fetchInterfaceSendLogsRequest({ ...form, page }));
  }

  function reset() {
    const cleared: InterfaceSendLogSearch = { ...form, eventTypeCode: "", sendStatusCode: "", from: "", to: "" };
    setForm(cleared);
    dispatch(fetchInterfaceSendLogsRequest({ ...cleared, page: 0 }));
  }

  function openDetail(row: InterfaceSendLog) {
    setSelectedId(row.interfaceSendLogId);
    dispatch(fetchInterfaceSendLogDetailRequest(row.interfaceSendLogId));
  }

  function closeDetail() {
    setSelectedId(null);
    dispatch(clearInterfaceSendLogDetail());
  }

  function resend() {
    if (!selectedId) return;
    setConfirmOpen(false);
    dispatch(resendInterfaceSendLogRequest(selectedId));
  }

  const columns: DataTableColumn<InterfaceSendLog>[] = [
    { key: "createdAt", header: "Created", render: (r) => formatDateTime(r.createdAt) },
    { key: "eventType", header: "Type", render: (r) => labelOf.event(r.eventTypeCode) },
    { key: "status", header: "Status", render: (r) => <SendStatusBadge code={r.sendStatusCode} label={labelOf.status(r.sendStatusCode)} /> },
    { key: "system", header: "Receiver", render: (r) => labelOf.system(r.systemCode) },
    { key: "reception", header: "Reception", render: (r) => r.receptionRef ?? "-" },
    { key: "item", header: "Item", render: (r) => r.itemCode ?? "-" },
    { key: "retry", header: "Retries", render: (r) => r.retryCount ?? 0 },
    { key: "sentAt", header: "Last Attempt", render: (r) => formatDateTime(r.sentAt) },
    {
      key: "error",
      header: "Error",
      className: "max-w-[240px]",
      render: (r) => <span className="block truncate text-rose-600" title={r.errorMessage ?? ""}>{r.errorMessage ?? ""}</span>,
    },
  ];

  const canResend =
    detail !== null && detail.sendStatusCode !== SEND_STATUS.SENT && detail.payload !== null && !resending;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <SearchBar onSearch={() => search(0)} onReset={reset} searchLabel="Search" resetLabel="Reset">
        <FormField label="Type" htmlFor="send-log-type">
          <Select
            id="send-log-type"
            options={eventTypes.options}
            placeholder="All"
            value={form.eventTypeCode}
            onChange={(e) => setForm({ ...form, eventTypeCode: e.target.value })}
          />
        </FormField>
        <FormField label="Status" htmlFor="send-log-status">
          <Select
            id="send-log-status"
            options={statuses.options}
            placeholder="All"
            value={form.sendStatusCode}
            onChange={(e) => setForm({ ...form, sendStatusCode: e.target.value })}
          />
        </FormField>
        <FormField label="From" htmlFor="send-log-from">
          <Input
            id="send-log-from"
            type="date"
            value={form.from}
            onChange={(e) => setForm({ ...form, from: e.target.value })}
          />
        </FormField>
        <FormField label="To" htmlFor="send-log-to">
          <Input
            id="send-log-to"
            type="date"
            value={form.to}
            onChange={(e) => setForm({ ...form, to: e.target.value })}
          />
        </FormField>
      </SearchBar>

      {loadError ? <Alert>{resolveInterfaceSendLogMessage(loadError)}</Alert> : null}

      <DataTable
        columns={columns}
        rows={list?.content ?? []}
        rowKey={(r) => r.interfaceSendLogId}
        loading={loading}
        loadingMessage="Loading send history..."
        emptyMessage="No send history found."
        minWidthClassName="min-w-[1040px]"
        onRowClick={openDetail}
        isRowActive={(r) => r.interfaceSendLogId === selectedId}
      />

      {/* 서버는 0부터, 공통 Pagination 은 1부터 센다 */}
      <Pagination
        page={(list?.page ?? 0) + 1}
        totalPages={list?.totalPages ?? 1}
        onPageChange={(p) => search(p - 1)}
        prevLabel="Prev"
        nextLabel="Next"
      />

      <Modal
        open={selectedId !== null}
        title="Send History Detail"
        onClose={closeDetail}
        closeDisabled={resending}
        maxWidthClassName="max-w-3xl"
        footer={
          <>
            <Button variant="secondary" onClick={closeDetail} disabled={resending}>
              Close
            </Button>
            <Button onClick={() => setConfirmOpen(true)} disabled={!canResend}>
              {resending ? "Resending..." : "Resend"}
            </Button>
          </>
        }
      >
        {detailError ? <Alert>{resolveInterfaceSendLogMessage(detailError)}</Alert> : null}
        {resendError ? <Alert>{resolveInterfaceSendLogMessage(resendError)}</Alert> : null}
        {lastResentId && lastResentId === selectedId ? (
          <p className="mb-3 rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-700">
            Resend requested. The result is recorded asynchronously — search again to see the final status.
          </p>
        ) : null}

        {detailLoading && !detail ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : detail ? (
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2 text-sm">
              <DetailRow label="Type" value={labelOf.event(detail.eventTypeCode)} />
              <DetailRow label="Status" value={labelOf.status(detail.sendStatusCode)} />
              <DetailRow label="Receiver" value={labelOf.system(detail.systemCode)} />
              <DetailRow label="Event ID" value={detail.eventId ?? "-"} />
              <DetailRow label="Reference ID" value={detail.referenceId} />
              <DetailRow label="Reception" value={detail.receptionRef ?? "-"} />
              <DetailRow label="Item" value={detail.itemCode ?? "-"} />
              <DetailRow label="Retries" value={String(detail.retryCount ?? 0)} />
              <DetailRow label="Created" value={formatDateTime(detail.createdAt)} />
              <DetailRow label="Last Attempt" value={formatDateTime(detail.sentAt)} />
              <DetailRow label="Error" value={detail.errorMessage ?? "-"} />
            </dl>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Payload</p>
              <pre className="max-h-80 overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">
                {formatPayload(detail.payload)}
              </pre>
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Resend"
        message="Publish this message again with the same event ID and payload?"
        confirmLabel="Resend"
        cancelLabel="Cancel"
        submitting={resending}
        onConfirm={resend}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

function SendStatusBadge({ code, label }: { code: string; label: string }) {
  const tone =
    code === SEND_STATUS.SENT
      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
      : code === SEND_STATUS.FAILED
        ? "bg-rose-50 text-rose-700 ring-rose-600/20"
        : "bg-amber-50 text-amber-700 ring-amber-600/20";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${tone}`}>{label}</span>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-slate-400">{label}</dt>
      <dd className="break-all text-slate-700">{value}</dd>
    </>
  );
}

function formatDateTime(value: string | null): string {
  return value ? value.replace("T", " ").slice(0, 19) : "-";
}

/** 원문은 JSON 문자열이다. 보기 좋게 들여쓰고, 깨진 원문은 그대로 보인다. */
function formatPayload(payload: string | null): string {
  if (!payload) return "(no payload)";
  try {
    return JSON.stringify(JSON.parse(payload), null, 2);
  } catch {
    return payload;
  }
}
