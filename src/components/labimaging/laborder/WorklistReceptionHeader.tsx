"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Button } from "@/components/common";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import type { CommonCodeOption } from "@/features/commonCode/hooks/useCommonCodeOptions";
import {
  clearWorklistSelection,
  fetchLabReceptionByNoRequest,
  selectLabReceptionDetail,
} from "@/features/labimaging/laborder/slice";
import type { LabWorklistItem } from "@/features/labimaging/laborder/types";

/**
 * 워크리스트 오른쪽 패널의 대상 접수 머리말.
 *
 * ⚠ 목록 응답에 없는 값(검사항목·진료구분·처방의)은 접수 단건 조회로 따로 가져온다.
 *   검사항목은 LAB_ORDER_ITEM 지연 컬렉션이라 목록에 넣으면 행마다 쿼리가 나간다(N+1).
 *   한 건만 보는 지금 시점에는 한 번 더 부르는 편이 싸다.
 *
 * ⚠ 전체 항목(오더상태·접수상태·접수담당자 등)은 여기 두지 않는다.
 *   오른쪽은 읽는 화면이 아니라 작업하는 화면이라 폼이 주인공이고,
 *   워크리스트에 떠 있는 접수는 상태가 항상 "수신/접수완료"라 표시해도 정보량이 없다.
 *   전부 봐야 할 때는 [전체 상세] 로 기존 상세 화면을 연다.
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

export default function WorklistReceptionHeader({
  reception,
}: {
  reception: LabWorklistItem;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const detail = useSelector(selectLabReceptionDetail);

  const treatTypes = useCommonCodeOptions("RCPT_TYPE_CD");
  const testTypes = useCommonCodeOptions("TEST_TYPE_CD");

  useEffect(() => {
    dispatch(fetchLabReceptionByNoRequest(reception.receptionNo));
  }, [dispatch, reception.receptionNo]);

  /*
   * 다른 접수를 고른 직후에는 store 에 이전 접수의 상세가 잠깐 남아 있다.
   * 접수번호가 일치할 때만 쓰지 않으면 엉뚱한 검사항목이 스쳐 보인다.
   */
  const matched = detail && detail.receptionNo === reception.receptionNo ? detail : null;

  const labItems = matched
    ? matched.labItemCodes.map((code) => toCodeLabel(testTypes.options, code)).join(", ")
    : "";

  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
      <div className="min-w-0">
        <p className="text-base font-semibold text-slate-800">
          {reception.receptionNo}
          <span className="ml-2 text-sm font-normal text-slate-500">
            {reception.patientNo ? `환자 ${reception.patientNo}` : "환자번호 미발급"}
          </span>
          {reception.urgencyYn === "Y" ? (
            <span className="ml-2 rounded bg-rose-50 px-1.5 py-0.5 text-xs font-medium text-rose-600">
              긴급
            </span>
          ) : null}
        </p>

        {/* 무슨 검사인지 — 검체 종류·용기를 고르는 판단 근거라 가장 눈에 띄게 둔다. */}
        <p className="mt-2 text-sm">
          <span className="text-slate-400">검사항목 </span>
          <span className="font-semibold text-slate-800">
            {labItems || (matched ? "-" : "불러오는 중…")}
          </span>
        </p>

        <p className="mt-1 text-xs text-slate-400">
          오더 {reception.labOrderNo}
          {matched ? (
            <>
              {" · "}
              {toCodeLabel(treatTypes.options, matched.treatTypeCode)}
              {matched.physicianNo ? ` · 처방의 ${matched.physicianNo}` : null}
            </>
          ) : null}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          접수 {formatDateTime(reception.receivedAt)}
          {reception.scheduledAt
            ? ` · 검사예정 ${formatDateTime(reception.scheduledAt)}`
            : " · 일정 미등록"}
        </p>

        {reception.receptionStatusCode === "EXCLUDED" ? (
          <p className="mt-1 text-xs text-amber-600">
            제외됨 — {reception.exclusionReason}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Link
          href={`/labimaging/laborder/receptions/${encodeURIComponent(reception.receptionNo)}`}
          className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          전체 상세
        </Link>
        <Button variant="ghost" onClick={() => dispatch(clearWorklistSelection())}>
          선택 해제
        </Button>
      </div>
    </div>
  );
}
