"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, Panel } from "@/components/common";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import type { CommonCodeOption } from "@/features/commonCode/hooks/useCommonCodeOptions";
import {
  fetchLabReceptionByNoRequest,
  selectLabReceptionDetail,
  selectLabReceptionLoading,
  selectLabReceptionError,
  selectLabReception,
} from "@/features/labimaging/laborder/slice";
import {
  ORDER_STATUS_LABELS,
  RECEPTION_STATUS_LABELS,
  toStatusLabel,
} from "@/features/labimaging/laborder/types";

/** 공통코드값 → 코드명. 아직 못 불러왔거나 사전에 없는 값이면 코드값을 그대로 보여준다. */
function toCodeLabel(options: CommonCodeOption[], code?: string) {
  if (!code) return "-";
  return options.find((opt) => opt.value === code)?.label ?? code;
}

/** ISO 문자열 → "YYYY-MM-DD HH:mm" */
function formatDateTime(value?: string) {
  if (!value) return "-";
  return value.replace("T", " ").slice(0, 16);
}

/**
 * 검사 접수 단건 상세 — 경로변수 receptionNo 로 조회.
 * (page.tsx 는 얇은 래퍼, 파라미터는 useParams 로 읽는 프로젝트 패턴)
 *
 * 화면에는 "이 접수가 어떤 검사인가"를 알 수 있는 값만 둔다.
 * UUID(접수ID/오더ID)와 연계시스템코드는 담당자에게 의미가 없어 응답에서도 뺐다.
 *
 * ⚠ 코드값 변환이 두 갈래다.
 *   - 진료구분/검사항목: admin 공통코드 → useCommonCodeOptions 로 코드명 조회
 *   - 오더상태/접수상태: 서비스 내부 Enum → types.ts 의 라벨 사전
 */
export default function LabReceptionDetail() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useParams<{ receptionNo: string }>();
  const receptionNo = params?.receptionNo ? decodeURIComponent(params.receptionNo) : "";

  const reception = useSelector(selectLabReceptionDetail);
  const loading = useSelector(selectLabReceptionLoading);
  const error = useSelector(selectLabReceptionError);

  const treatTypes = useCommonCodeOptions("RCPT_TYPE_CD");
  const testTypes = useCommonCodeOptions("TEST_TYPE_CD");

  useEffect(() => {
    if (receptionNo) dispatch(fetchLabReceptionByNoRequest(receptionNo));
  }, [dispatch, receptionNo]);

  if (loading) return <p className="text-sm text-slate-400">불러오는 중…</p>;
  if (error) return <Alert>{error}</Alert>;
  if (!reception) return <p className="text-sm text-slate-400">접수 정보가 없습니다.</p>;

  const labItems = reception.labItemCodes
    .map((code) => toCodeLabel(testTypes.options, code))
    .join(", ");

  const rows: Array<[string, string]> = [
    ["접수번호", reception.receptionNo],
    ["오더번호", reception.labOrderNo],
    ["진료구분", toCodeLabel(treatTypes.options, reception.treatTypeCode)],
    ["긴급여부", reception.urgencyYn === "Y" ? "긴급" : "일반"],
    ["환자번호", reception.patientNo],
    ["처방의번호", reception.physicianNo || "-"],
    ["검사항목", labItems || "-"],
    ["접수일시", formatDateTime(reception.receivedAt)],
    ["검사 예정일시", reception.scheduledAt ? formatDateTime(reception.scheduledAt) : "미등록"],
    ["오더상태", toStatusLabel(ORDER_STATUS_LABELS, reception.orderStatusCode)],
    ["접수상태", toStatusLabel(RECEPTION_STATUS_LABELS, reception.receptionStatusCode)],
    ["접수담당자", reception.receivedById],
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
            // 일정 화면이 쓸 컨텍스트만 넘긴다. (LabReceptionContext)
            dispatch(selectLabReception(reception));
            router.push(`/labimaging/labschedule/register/${reception.labReceptionId}`);
          }}
        >
          {reception.scheduledAt ? "일정 재등록" : "일정 등록"}
        </Button>
      </div>
    </div>
  );
}
