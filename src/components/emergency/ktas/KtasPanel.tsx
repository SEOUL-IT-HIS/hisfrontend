"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, FormField, Input, Select } from "@/components/common";
import { resolveEmergencyMessage } from "@/features/emergency/messages";
import {
  createKtasRequest,
  fetchKtasHistoryRequest,
  reassessKtasRequest,
  selectKtasError,
  selectKtasItems,
  selectKtasLoading,
  selectKtasSubmitError,
  selectKtasSubmitting,
} from "@/features/emergency/ktas/slice";
import { KTAS_LEVEL_FALLBACK_OPTIONS } from "@/features/emergency/ktas/types";
import {
  fetchAllCommonCodesRequest,
  selectCommonCodeLoaded,
  selectCommonCodesByGroup,
} from "@/features/emergency/commonCode/slice";
import { formatDateTime } from "@/features/emergency/utils";

type KtasPanelProps = {
  receptionNo: string;
  className?: string;
};

const initialForm = { ktasScore: "", reason: "", assessedById: "" };

/**
 * KTAS 등급 분류/재평가 패널 (UC-TRI-02/03 / Jira UD2-9, UD2-43)
 * - 최초 분류(INITIAL)가 없으면 분류 등록 폼을, 있으면 재평가 폼을 보여준다.
 * - 재평가는 신규 이력 행으로 저장되므로(백엔드 UD2-59 결정), 최신 항목을 직전 항목과 비교 표시한다.
 */
export default function KtasPanel({ receptionNo, className = "" }: KtasPanelProps) {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectKtasItems);
  const loading = useSelector(selectKtasLoading);
  const error = useSelector(selectKtasError);
  const submitting = useSelector(selectKtasSubmitting);
  const submitError = useSelector(selectKtasSubmitError);
  const commonCodeLoaded = useSelector(selectCommonCodeLoaded);
  const ktasLevelCodes = useSelector(selectCommonCodesByGroup("KTAS_LEVEL"));

  const [form, setForm] = useState(initialForm);
  const [lastCount, setLastCount] = useState(0);

  useEffect(() => {
    if (receptionNo) {
      dispatch(fetchKtasHistoryRequest(receptionNo));
    }
  }, [dispatch, receptionNo]);

  // 공통코드 전체를 앱에서 한 번만 받아오면 되므로, 이미 받아왔으면 다시 요청하지 않는다.
  useEffect(() => {
    if (!commonCodeLoaded) {
      dispatch(fetchAllCommonCodesRequest());
    }
  }, [dispatch, commonCodeLoaded]);

  // 공통코드 캐시에서 받아온 값이 있으면 그걸 쓰고, 없으면(admin 미연동/실패) 폴백 상수를 쓴다.
  const levelOptions =
    ktasLevelCodes.length > 0
      ? ktasLevelCodes
          .filter((code) => code.useYn !== "N")
          .map((code) => ({ value: code.codeValue, label: code.codeName }))
      : [...KTAS_LEVEL_FALLBACK_OPTIONS];

  // 등록/재평가 성공(items 길이 증가) 시 입력값 초기화
  if (items.length > lastCount) {
    setLastCount(items.length);
    if (!submitting && !submitError) {
      setForm(initialForm);
    }
  }

  const hasInitial = items.some((item) => item.assessmentTypeCode === "INITIAL");
  const latest = items.length > 0 ? items[items.length - 1] : null;
  const previous = items.length > 1 ? items[items.length - 2] : null;

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit() {
    if (!form.ktasScore) return;
    if (!hasInitial) {
      dispatch(
        createKtasRequest({
          encounterId: receptionNo,
          ktasScore: form.ktasScore,
          assessmentTypeCode: "INITIAL",
          reason: form.reason || undefined,
          assessedById: form.assessedById || undefined,
        }),
      );
    } else if (latest) {
      dispatch(
        reassessKtasRequest(latest.id, {
          ktasScore: form.ktasScore,
          reason: form.reason || undefined,
          assessedById: form.assessedById || undefined,
        }),
      );
    }
  }

  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      <h3 className="mb-3 text-sm font-semibold text-slate-800">KTAS 등급 분류/재평가</h3>

      {loading ? (
        <p className="py-4 text-center text-sm text-slate-400">KTAS 이력을 불러오는 중입니다...</p>
      ) : error ? (
        <Alert variant="error">{resolveEmergencyMessage(error)}</Alert>
      ) : (
        <>
          {latest ? (
            <div className="mb-4 flex items-center gap-3 rounded-lg bg-slate-50 p-3">
              {previous ? (
                <>
                  <span className="text-sm text-slate-400 line-through">{previous.ktasLevelCode}단계</span>
                  <span className="text-slate-400">→</span>
                </>
              ) : null}
              <span className="text-lg font-semibold text-sky-600">{latest.ktasLevelCode}단계</span>
              <span className="text-xs text-slate-500">
                ({latest.assessmentTypeCode === "INITIAL" ? "최초 분류" : "재평가"} · {formatDateTime(latest.assessedAt)})
              </span>
            </div>
          ) : (
            <p className="mb-4 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-400">
              아직 KTAS 분류가 등록되지 않았습니다.
            </p>
          )}

          {items.length > 0 ? (
            <ul className="mb-4 space-y-1 text-xs text-slate-500">
              {items.map((item) => (
                <li key={item.id} className="flex gap-2">
                  <span className="w-16 shrink-0 font-medium text-slate-600">
                    {item.assessmentTypeCode === "INITIAL" ? "최초분류" : "재평가"}
                  </span>
                  <span className="w-10 shrink-0">{item.ktasLevelCode}단계</span>
                  <span className="shrink-0">{formatDateTime(item.assessedAt)}</span>
                  <span className="truncate text-slate-400">{item.reason}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {submitError ? <Alert variant="error">{resolveEmergencyMessage(submitError)}</Alert> : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FormField label={hasInitial ? "변경 등급" : "최초 등급"} required>
              <Select
                name="ktasScore"
                value={form.ktasScore}
                onChange={handleChange}
                options={levelOptions}
                placeholder="선택"
                disabled={submitting}
              />
            </FormField>
            <FormField label="사유" className="sm:col-span-2">
              <Input name="reason" value={form.reason} onChange={handleChange} disabled={submitting} maxLength={200} />
            </FormField>
            <FormField label="분류자ID">
              <Input
                name="assessedById"
                value={form.assessedById}
                onChange={handleChange}
                disabled={submitting}
                maxLength={36}
              />
            </FormField>
          </div>
          <div className="mt-3 flex justify-end">
            <Button type="button" onClick={handleSubmit} disabled={submitting || !form.ktasScore}>
              {submitting ? "저장 중..." : hasInitial ? "재평가 저장" : "최초 분류 등록"}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
