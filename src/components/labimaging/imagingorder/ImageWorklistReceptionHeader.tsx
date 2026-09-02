"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Button } from "@/components/common";
import { usePatientNames } from "@/features/labimaging/common/hooks/usePatientNames";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import type { CommonCodeOption } from "@/features/commonCode/hooks/useCommonCodeOptions";
import {
  clearImageWorklistSelection,
  fetchImageReceptionByNoRequest,
  selectImageReceptionDetail,
} from "@/features/labimaging/imagingorder/slice";
import type { ImageReceptionSummary } from "@/features/labimaging/imagingorder/types";

/**
 * 영상 워크리스트 오른쪽 패널의 대상 접수 머리말.
 * (검사 쪽 laborder/WorklistReceptionHeader 와 같은 자리, 같은 구조)
 *
 * ⚠ 목록 응답에 없는 값은 접수 단건 조회로 따로 가져온다.
 *   ImageOrderSummaryDto 에는 촬영항목·진료구분·처방의는 물론 접수일시·긴급여부도 없다.
 *   촬영항목은 IMAGE_ORDER_ITEM 지연 컬렉션이라 목록에 넣으면 행마다 쿼리가 나간다(N+1).
 *   한 건만 보는 지금 시점에는 한 번 더 부르는 편이 싸다.
 *
 * ⚠ 무슨 촬영인지를 가장 크게 둔다. 동의서 유형과 촬영실·장비를 고르는 판단 근거다.
 *   (검사 쪽에서 검사항목을 크게 둔 것과 같은 이유)
 */

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

export default function ImageWorklistReceptionHeader({
  reception,
}: {
  reception: ImageReceptionSummary;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const detail = useSelector(selectImageReceptionDetail);

  // 선택한 접수 1건이라 배열에 하나만 담아 넘긴다. 훅은 목록/단건을 같은 방식으로 다룬다.
  const { names: patientNames } = usePatientNames([reception.patientId]);
  const patientName = patientNames[reception.patientId];

  const treatTypes = useCommonCodeOptions("RCPT_TYPE_CD");
  const imageItems = useCommonCodeOptions("IMG_ITEM_CD");

  useEffect(() => {
    dispatch(fetchImageReceptionByNoRequest(reception.receptionNo));
  }, [dispatch, reception.receptionNo]);

  /*
   * 다른 접수를 고른 직후에는 store 에 이전 접수의 상세가 잠깐 남아 있다.
   * 접수번호가 일치할 때만 쓰지 않으면 엉뚱한 촬영항목이 스쳐 보인다.
   */
  const matched = detail && detail.receptionNo === reception.receptionNo ? detail : null;

  const itemLabels = matched
    ? matched.imageItemCodes.map((code) => toCodeLabel(imageItems.options, code)).join(", ")
    : "";

  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
      <div className="min-w-0">
        <p className="text-base font-semibold text-slate-800">
          {reception.receptionNo}
          <span className="ml-2 text-sm font-normal text-slate-500">
            {patientName ?? "Unknown patient"}
          </span>
          {/* 긴급여부는 목록 응답에 없어 상세를 받은 뒤에야 뜬다. */}
          {matched?.urgencyYn === "Y" ? (
            <span className="ml-2 rounded bg-rose-50 px-1.5 py-0.5 text-xs font-medium text-rose-600">
              Urgent
            </span>
          ) : null}
        </p>

        {/* 무슨 촬영인지 — 동의서 유형·촬영실·장비를 고르는 판단 근거라 가장 눈에 띄게 둔다. */}
        <p className="mt-2 text-sm">
          <span className="text-slate-400">Imaging Items </span>
          <span className="font-semibold text-slate-800">
            {itemLabels || (matched ? "-" : "Loading…")}
          </span>
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Order {reception.imageOrderNo}
          {matched ? (
            <>
              {" · "}
              {toCodeLabel(treatTypes.options, matched.treatTypeCode)}
              {matched.physicianNo ? ` · Physician ${matched.physicianNo}` : null}
            </>
          ) : null}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          {matched ? `Received ${formatDateTime(matched.receivedAt)}` : "Received —"}
          {reception.scheduledAt
            ? ` · Scheduled ${formatDateTime(reception.scheduledAt)}`
            : " · Not scheduled"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Link
          href={`/labimaging/imagingorder/receptions/${encodeURIComponent(reception.receptionNo)}`}
          className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          Full Detail
        </Link>
        <Button variant="ghost" onClick={() => dispatch(clearImageWorklistSelection())}>
          Clear Selection
        </Button>
      </div>
    </div>
  );
}
