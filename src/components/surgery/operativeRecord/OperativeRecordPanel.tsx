"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  Alert,
  DataTable,
  FormActions,
  FormField,
  Input,
  Panel,
  type DataTableColumn,
} from "@/components/common";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import {
  createOperativeRecordRequest,
  fetchOperativeRecordsRequest,
  selectOperativeRecordError,
  selectOperativeRecordLoading,
  selectOperativeRecordSaving,
  selectOperativeRecords,
} from "@/features/surgery/operativeRecord/slice";

type Props = {
  surgeryId: string;
};

/** OP_STATUS_CD 02 = 확정 — 확정 후에는 수정할 수 없다(백엔드 SUR043) */
const STATUS_FIXED = "02";

/**
 * 수술기록지 패널 (SL2-57 조회 / SL2-55 작성)
 *
 * <p>확정(02) 상태 기록은 수정 버튼을 노출하지 않는다. 수납이 확정 건을 신뢰해 조회하기
 * 때문이며, 시도하면 백엔드가 SUR043 으로 거부한다.</p>
 *
 * <p><b>컴포넌트가 하는 일</b> — 상태를 읽고 액션을 던지는 것뿐이다.
 * API 주소도, 성공하면 무엇을 해야 하는지도 모른다. 그건 saga 의 몫이다.</p>
 * <pre>
 *   useSelector(...)      slice 에 담긴 상태를 읽는다
 *   dispatch(...Request)  "이걸 해달라"고 알린다. 실제 호출은 saga 가 한다
 *   useEffect(...)        화면이 처음 뜰 때 조회 액션을 한 번 던진다
 *   disabled={saving}     저장 중 중복 클릭을 막는다. saving 도 slice 가 관리한다
 * </pre>
 *
 * <p><b>화면에서도 입력값을 검사하는 이유</b> — 백엔드에도 @Valid 가 걸려 있지만,
 * 서버까지 갔다 와야 알 수 있다. 뻔한 실수는 화면에서 먼저 잡아 왕복을 줄인다(§15.3).
 * 화면 검사는 사용자 편의고, <b>진짜 방어선은 백엔드</b>다 — API 를 직접 호출하면
 * 화면 검사는 건너뛰어지기 때문이다.</p>
 */
export default function OperativeRecordPanel({ surgeryId }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const records = useSelector(selectOperativeRecords);
  const loading = useSelector(selectOperativeRecordLoading);
  const saving = useSelector(selectOperativeRecordSaving);
  const error = useSelector(selectOperativeRecordError);

  const [procedureName, setProcedureName] = useState("");
  const [procedureCd, setProcedureCd] = useState("");
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    dispatch(fetchOperativeRecordsRequest(surgeryId));
  }, [dispatch, surgeryId]);

  const columns: DataTableColumn<(typeof records)[number]>[] = [
    { key: "procedureName", header: "Procedure", render: (r) => r.procedureName },
    { key: "procedureCd", header: "Procedure code", render: (r) => r.procedureCd ?? "-" },
    {
      key: "opStatusCd",
      header: "Status",
      render: (r) =>
        r.opStatusCd === STATUS_FIXED ? "Finalized" : (r.opStatusCd ?? "Draft"),
    },
  ];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // procedure_name 은 DDL 상 NOT NULL — 백엔드도 거부하지만 왕복 전에 막는다
    if (!procedureName.trim()) {
      setNameError("Please enter the procedure name.");
      return;
    }
    setNameError("");

    dispatch(
      createOperativeRecordRequest(surgeryId, {
        procedureName: procedureName.trim(),
        procedureCd: procedureCd.trim() || null,
      }),
    );
    setProcedureName("");
    setProcedureCd("");
  }

  return (
    <div className="flex flex-col gap-6">
      <Panel className="p-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-slate-700">New operative record</h3>

          <FormField label="Procedure" required htmlFor="procedureName">
            <Input
              id="procedureName"
              value={procedureName}
              onChange={(e) => setProcedureName(e.target.value)}
              disabled={saving}
            />
            {nameError ? (
              <span className="text-xs text-rose-600">{nameError}</span>
            ) : null}
          </FormField>

          <FormField label="Procedure code" htmlFor="procedureCd" hint="Optional.">
            <Input
              id="procedureCd"
              value={procedureCd}
              onChange={(e) => setProcedureCd(e.target.value)}
              disabled={saving}
            />
          </FormField>

          <FormActions
            onCancel={() => {
              setProcedureName("");
              setProcedureCd("");
              setNameError("");
            }}
            cancelLabel="Reset"
            submitLabel="Save"
            loading={saving}
            loadingLabel="Saving…"
          />
        </form>
      </Panel>

      {error ? <Alert>{resolveSurgeryMessage(error)}</Alert> : null}

      <DataTable
        columns={columns}
        rows={records}
        rowKey={(r) => r.recordId}
        loading={loading}
        emptyMessage="No operative records yet."
        minWidthClassName="min-w-[480px]"
      />
    </div>
  );
}
