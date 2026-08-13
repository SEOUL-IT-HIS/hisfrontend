"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, Panel } from "@/components/common";
import {
  fetchLabReceptionByNoRequest,
  selectSelectedLabReception,
  selectLabReceptionLoading,
  selectLabReceptionError,
  selectLabReception,
} from "@/features/labimaging/laborder/slice";

/**
 * 검사 접수 단건 상세 — 경로변수 receptionNo 로 조회.
 * (page.tsx 는 얇은 래퍼, 파라미터는 useParams 로 읽는 프로젝트 패턴)
 */
export default function LabReceptionDetail() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useParams<{ receptionNo: string }>();
  const receptionNo = params?.receptionNo ? decodeURIComponent(params.receptionNo) : "";

  const reception = useSelector(selectSelectedLabReception);
  const loading = useSelector(selectLabReceptionLoading);
  const error = useSelector(selectLabReceptionError);

  useEffect(() => {
    if (receptionNo) dispatch(fetchLabReceptionByNoRequest(receptionNo));
  }, [dispatch, receptionNo]);

  if (loading) return <p className="text-sm text-slate-400">불러오는 중…</p>;
  if (error) return <Alert>{error}</Alert>;
  if (!reception) return <p className="text-sm text-slate-400">접수 정보가 없습니다.</p>;

  const rows: Array<[string, string]> = [
    ["접수번호", reception.receptionNo],
    ["접수ID", reception.labReceptionId],
    ["오더번호", reception.labOrderNo],
    ["오더ID", reception.labOrderId],
    ["환자번호", reception.patientNo],
    ["오더상태코드", reception.orderStatusCode],
    ["접수상태코드", reception.receptionStatusCode],
  ];

  return (
    <div className="space-y-4">
      <Panel>
        <dl className="divide-y divide-slate-100">
          {rows.map(([label, value]) => (
            <div key={label} className="flex px-4 py-2.5 text-sm">
              <dt className="w-32 shrink-0 text-slate-400">{label}</dt>
              <dd className="text-slate-700">{value}</dd>
            </div>
          ))}
        </dl>
      </Panel>
      <div className="flex justify-end gap-2">
        <Link
          href="/labimaging/laborder/receptions"
          className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          목록
        </Link>
        <Button
          onClick={() => {
            dispatch(selectLabReception(reception));
            router.push(`/labimaging/labschedule/register/${reception.labReceptionId}`);
          }}
        >
          일정 등록
        </Button>
      </div>
    </div>
  );
}
