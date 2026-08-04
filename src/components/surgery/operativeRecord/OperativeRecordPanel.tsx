"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
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

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-sky-400 disabled:bg-slate-50";

/** OP_STATUS_CD 02 = 확정 — 확정 후에는 수정할 수 없다(백엔드 SUR043) */
const STATUS_FIXED = "02";

/**
 * 수술기록지 패널 (SL2-57 조회 / SL2-55 작성)
 *
 * <p>확정(02) 상태 기록은 수정 버튼을 노출하지 않는다. 수납이 확정 건을 신뢰해 조회하기
 * 때문이며, 시도하면 백엔드가 SUR043 으로 거부한다.</p>
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // procedure_name 은 DDL 상 NOT NULL — 백엔드도 거부하지만 왕복 전에 막는다
    if (!procedureName.trim()) {
      setNameError("술식명을 입력해주세요.");
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
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4"
      >
        <h3 className="text-sm font-medium text-slate-700">수술기록지 작성</h3>

        <div className="flex flex-col gap-1">
          <label htmlFor="procedureName" className="text-xs text-slate-600">
            술식명
          </label>
          <input
            id="procedureName"
            className={inputClass}
            value={procedureName}
            onChange={(e) => setProcedureName(e.target.value)}
            disabled={saving}
          />
          {nameError && <p className="text-xs text-red-600">{nameError}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="procedureCd" className="text-xs text-slate-600">
            술식 코드 (선택)
          </label>
          <input
            id="procedureCd"
            className={inputClass}
            value={procedureCd}
            onChange={(e) => setProcedureCd(e.target.value)}
            disabled={saving}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="h-10 rounded-lg bg-sky-500 px-4 text-white disabled:bg-slate-300"
        >
          {saving ? "저장 중…" : "작성"}
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-600">{resolveSurgeryMessage(error)}</p>
      )}

      {loading && <p className="text-sm text-slate-500">불러오는 중입니다…</p>}

      {!loading && records.length === 0 && (
        <p className="text-sm text-slate-500">작성된 수술기록이 없습니다.</p>
      )}

      {records.length > 0 && (
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">술식명</th>
              <th className="px-3 py-2">술식 코드</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.recordId} className="border-t border-slate-100">
                <td className="px-3 py-2">{record.procedureName}</td>
                <td className="px-3 py-2">{record.procedureCd ?? "-"}</td>
                <td className="px-3 py-2">
                  {record.opStatusCd === STATUS_FIXED
                    ? "확정"
                    : (record.opStatusCd ?? "작성중")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
