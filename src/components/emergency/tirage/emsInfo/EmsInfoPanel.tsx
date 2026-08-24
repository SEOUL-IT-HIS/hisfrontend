"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button } from "@/components/common";
import { resolveEmergencyMessage } from "@/features/emergency/messages";
import {
  fetchEmsInfoRequest,
  selectEmsInfoError,
  selectEmsInfoItems,
  selectEmsInfoLoading,
  selectEmsInfoSearched,
} from "@/features/emergency/triage/emsInfo/slice";
import { formatDateTime } from "@/features/emergency/utils";

type EmsInfoPanelProps = {
  /** 조회 대상 접수번호 — Triage 분류 화면에서 선택된 접수 건 */
  receptionNo: string;
  className?: string;
};

/**
 * Triage EMS 사전정보 패널 (UC-TRI-01 / Jira UD2-8, UD2-47)
 * - KTAS 분류 화면(UD2-9) 등 접수 건 상세 화면에 끼워 넣는 카드형 패널.
 * - 접수번호(receptionNo)를 prop 으로 받아 진입 시 자동 조회한다. (검색 UI 아님)
 * - EMS(119) 실연동 없이 EMS_REFERRAL Mock/시드 데이터를 "연동된 것처럼" 표시한다.
 */
export default function EmsInfoPanel({ receptionNo, className = "" }: EmsInfoPanelProps) {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectEmsInfoItems);
  const loading = useSelector(selectEmsInfoLoading);
  const error = useSelector(selectEmsInfoError);
  const searched = useSelector(selectEmsInfoSearched);

  useEffect(() => {
    if (receptionNo) {
      dispatch(fetchEmsInfoRequest(receptionNo));
    }
  }, [dispatch, receptionNo]);

  function handleRetry() {
    dispatch(fetchEmsInfoRequest(receptionNo));
  }

  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}
      aria-label="EMS 사전정보"
    >
      <h3 className="mb-3 text-sm font-semibold text-slate-800">EMS(119) 사전정보</h3>

      {loading ? (
        <p className="py-6 text-center text-sm text-slate-400">EMS 사전정보를 불러오는 중입니다...</p>
      ) : error ? (
        <div className="space-y-2">
          <Alert variant="error">{resolveEmergencyMessage(error)}</Alert>
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={handleRetry}>
              재시도
            </Button>
          </div>
        </div>
      ) : !searched || items.length === 0 ? (
        <p className="rounded-lg bg-slate-50 px-3 py-6 text-center text-sm text-slate-400">
          EMS 사전정보가 없습니다. 도보/직접 내원 등 119 이송이 아닌 접수 건일 수 있습니다.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <dl key={item.id} className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">이송기관</dt>
                <dd className="text-sm text-slate-800">{item.emsAgencyName || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">전송일시</dt>
                <dd className="text-sm text-slate-800">{formatDateTime(item.transmittedAt)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-slate-500">현장 활력징후</dt>
                <dd className="text-sm text-slate-800">{item.vitalsOnScene || "-"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-slate-500">병원 전 처치내용</dt>
                <dd className="text-sm text-slate-800">{item.prehospitalTreatment || "-"}</dd>
              </div>
            </dl>
          ))}
        </div>
      )}
    </section>
  );
}
