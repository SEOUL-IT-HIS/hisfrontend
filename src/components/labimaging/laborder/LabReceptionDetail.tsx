"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, Panel } from "@/components/common";
import { usePatientNames } from "@/features/labimaging/common/hooks/usePatientNames";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import type { CommonCodeOption } from "@/features/commonCode/hooks/useCommonCodeOptions";
import {
  fetchLabReceptionByNoRequest,
  selectLabReceptionDetail,
  selectLabReceptionLoading,
  selectLabReceptionError,
  selectWorklistReception,
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
  /*
   * ⚠ 훅은 조건부로 부를 수 없어서 reception 이 없을 때도 호출된다.
   *   그래서 아래 early return 보다 위에 둔다. 빈 배열이면 요청을 보내지 않는다.
   */
  const { names: patientNames } = usePatientNames(
    reception?.patientId ? [reception.patientId] : [],
  );

  useEffect(() => {
    if (receptionNo) dispatch(fetchLabReceptionByNoRequest(receptionNo));
  }, [dispatch, receptionNo]);

  if (loading) return <p className="text-sm text-slate-400">Loading…</p>;
  if (error) return <Alert>{error}</Alert>;
  if (!reception) return <p className="text-sm text-slate-400">No reception found.</p>;

  const labItems = reception.labItemCodes
    .map((code) => toCodeLabel(testTypes.options, code))
    .join(", ");

  const rows: Array<[string, string]> = [
    ["Reception No.", reception.receptionNo],
    ["Order No.", reception.labOrderNo],
    ["Treatment Type", toCodeLabel(treatTypes.options, reception.treatTypeCode)],
    ["Urgency", reception.urgencyYn === "Y" ? "Urgent" : "Routine"],
    // 환자번호는 화면에서 쓰지 않기로 해서 이름만 둔다. (2026-08-25)
    ["Patient Name", patientNames[reception.patientId] || "Unknown"],
    ["Physician No.", reception.physicianNo || "-"],
    ["Test Items", labItems || "-"],
    ["Received At", formatDateTime(reception.receivedAt)],
    ["Scheduled Test", reception.scheduledAt ? formatDateTime(reception.scheduledAt) : "Not scheduled"],
    ["Order Status", toStatusLabel(ORDER_STATUS_LABELS, reception.orderStatusCode)],
    ["Reception Status", toStatusLabel(RECEPTION_STATUS_LABELS, reception.receptionStatusCode)],
    ["Received By", reception.receivedById],
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
          href="/labimaging/laborder/worklist"
          className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          Worklist
        </Link>
        {/*
          ⚠ 단독 일정 페이지는 없앴다. (2026-09-03 — 워크리스트 Schedule 탭이 같은 일을 한다)
            워크리스트로 보내면서 이 접수를 선택 상태로 만들어, 도착하자마자 일정 폼이 열리게 한다.
            그냥 보내면 담당자가 목록에서 방금 보던 접수를 다시 찾아야 한다.
        */}
        <Button
          onClick={() => {
            dispatch(selectWorklistReception(reception.receptionNo));
            router.push("/labimaging/laborder/worklist");
          }}
        >
          {reception.scheduledAt ? "Reschedule" : "Schedule"}
        </Button>
      </div>
    </div>
  );
}
