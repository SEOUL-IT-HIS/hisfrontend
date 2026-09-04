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
  fetchImageReceptionByNoRequest,
  selectImageReceptionDetail,
  selectImageReceptionLoading,
  selectImageReceptionError,
  selectImageReception,
} from "@/features/labimaging/imagingorder/slice";
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
 * 영상 접수 단건 상세 — 경로변수 receptionNo 로 조회. (laborder 상세와 동일 패턴)
 *
 * ⚠ 상태코드 라벨 사전은 laborder/types.ts 것을 그대로 쓴다.
 *   오더상태/접수상태는 common/status 의 같은 Enum 을 검사·영상이 공유하기 때문이다.
 */
export default function ImageReceptionDetail() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useParams<{ receptionNo: string }>();
  const receptionNo = params?.receptionNo ? decodeURIComponent(params.receptionNo) : "";

  const reception = useSelector(selectImageReceptionDetail);
  const loading = useSelector(selectImageReceptionLoading);
  const error = useSelector(selectImageReceptionError);

  /*
   * ⚠ 훅은 조건부로 부를 수 없어 reception 이 없을 때도 호출된다.
   *   빈 배열이면 요청을 보내지 않으므로 early return 보다 위에 두어도 안전하다.
   */
  const { names: patientNames } = usePatientNames(
    reception?.patientId ? [reception.patientId] : [],
  );

  const treatTypes = useCommonCodeOptions("RCPT_TYPE_CD");
  const imageItems = useCommonCodeOptions("IMG_ITEM_CD");

  useEffect(() => {
    if (receptionNo) dispatch(fetchImageReceptionByNoRequest(receptionNo));
  }, [dispatch, receptionNo]);

  if (loading) return <p className="text-sm text-slate-400">Loading…</p>;
  if (error) return <Alert>{error}</Alert>;
  if (!reception) return <p className="text-sm text-slate-400">No reception found.</p>;

  const items = reception.imageItemCodes
    .map((code) => toCodeLabel(imageItems.options, code))
    .join(", ");

  const rows: Array<[string, string]> = [
    ["Reception No.", reception.receptionNo],
    ["Order No.", reception.imageOrderNo],
    ["Treatment Type", toCodeLabel(treatTypes.options, reception.treatTypeCode)],
    ["Urgency", reception.urgencyYn === "Y" ? "Urgent" : "Routine"],
    // 환자번호는 화면에서 쓰지 않기로 해서 이름만 둔다. (2026-08-25)
    ["Patient Name", patientNames[reception.patientId] || "Unknown"],
    ["Physician No.", reception.physicianNo || "-"],
    ["Imaging Items", items || "-"],
    ["Received At", formatDateTime(reception.receivedAt)],
    ["Scheduled Imaging", reception.scheduledAt ? formatDateTime(reception.scheduledAt) : "Not scheduled"],
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
          href="/labimaging/imagingorder/receptions"
          className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          List
        </Link>
        <Button
          onClick={() => {
            // 일정 화면이 쓸 컨텍스트만 넘긴다. (ImageReceptionContext)
            dispatch(selectImageReception(reception));
            router.push(`/labimaging/imagingschedule/register/${reception.imageReceptionId}`);
          }}
        >
          {reception.scheduledAt ? "Reschedule" : "Schedule"}
        </Button>
      </div>
    </div>
  );
}
