"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePathname, useRouter } from "next/navigation";
import type { AppDispatch } from "@/store/store";
import { Alert, Input } from "@/components/common";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import type { CommonCodeOption } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { usePatientNames } from "@/features/labimaging/common/hooks/usePatientNames";
import { resolveImageReadingMessage } from "@/features/labimaging/imaginginterpretation/messages";
import {
  fetchReadingWorklistRequest,
  selectReadingWorklist,
  selectReadingWorklistError,
  selectReadingWorklistLoading,
} from "@/features/labimaging/imaginginterpretation/slice";
import { READING_STATUS_LABELS } from "@/features/labimaging/imaginginterpretation/types";

/**
 * 단독 판독 화면(ImageReadingPage)에 imageOrderItemId 가 없을 때 보여주는 검색 UI. (2026-10-01)
 *
 * ⚠ 새 조회 API 를 만들지 않는다. 이미 판독 워크리스트가 쓰는 GET /image-readings/worklist
 *   (영상파일이 1건 이상 등록된 촬영항목 전체, ImageReadingWorkPanel 참고)를 그대로 불러와
 *   화면에서 환자명·ID로 걸러 보여준다 — 그래서 아직 영상 파일이 하나도 없는 촬영항목은
 *   검색해도 나오지 않는다(워크리스트 자체의 한계, ZP2-125).
 *
 * ⚠ 환자명으로만 찾을 수 있고 접수번호·오더번호로는 못 찾는다 — 판독 워크리스트 응답
 *   (ImageReadingSummaryDto)에 그 값들이 없다(imageOrderId/imageOrderItemId/imageReadingId
 *   뿐이다). 필요해지면 그 값들을 응답에 추가하는 백엔드 변경이 먼저 필요하다.
 *
 * ⚠ 고르면 URL 을 `?imageOrderItemId=...`로 바꾼다(router.push). 그래야 이 상태를 북마크·
 *   공유할 수 있고, ImageReadingPage 가 그 쿼리스트링을 읽어 평소처럼 ImageReadingDetail 을 띄운다.
 */

const MAX_RESULTS = 20;

/** 공통코드값 → 코드명. 아직 못 불러왔거나 사전에 없는 값이면 코드값을 그대로 보여준다. */
function toCodeLabel(options: CommonCodeOption[], code?: string) {
  if (!code) return "-";
  return options.find((opt) => opt.value === code)?.label ?? code;
}

export default function ImageReadingLookup() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();

  const worklist = useSelector(selectReadingWorklist);
  const loading = useSelector(selectReadingWorklistLoading);
  const error = useSelector(selectReadingWorklistError);

  const imageItemTypes = useCommonCodeOptions("IMG_ITEM_CD");
  const { names: patientNames } = usePatientNames(worklist.map((item) => item.patientId));

  const [query, setQuery] = useState("");

  useEffect(() => {
    dispatch(fetchReadingWorklistRequest());
  }, [dispatch]);

  const trimmedQuery = query.trim().toLowerCase();
  const matches = trimmedQuery
    ? worklist.filter((item) => {
        const patientName = (patientNames[item.patientId] ?? "").toLowerCase();
        return (
          patientName.includes(trimmedQuery) ||
          item.imageOrderItemId.toLowerCase().includes(trimmedQuery) ||
          item.imageReadingId.toLowerCase().includes(trimmedQuery)
        );
      })
    : [];
  const visibleMatches = matches.slice(0, MAX_RESULTS);

  function handleSelect(imageOrderItemId: string) {
    router.push(`${pathname}?imageOrderItemId=${encodeURIComponent(imageOrderItemId)}`);
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? <Alert>{resolveImageReadingMessage(error)}</Alert> : null}

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by patient name, or paste an item/reading ID"
        autoComplete="off"
      />

      {loading ? (
        <p className="text-sm text-slate-400">Loading reading worklist...</p>
      ) : !trimmedQuery ? (
        <p className="text-sm text-slate-400">
          Type a patient name to find a reading, or open this page with{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5">?imageOrderItemId=&lt;id&gt;</code>{" "}
          directly. Only items with at least one uploaded image appear here.
        </p>
      ) : visibleMatches.length === 0 ? (
        <p className="text-sm text-slate-400">No matching reading found.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {visibleMatches.map((item) => (
            <li key={item.imageOrderItemId}>
              <button
                type="button"
                onClick={() => handleSelect(item.imageOrderItemId)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-sky-50"
              >
                <span className="w-32 shrink-0 font-semibold text-slate-700">
                  {patientNames[item.patientId] ?? "Unknown"}
                </span>
                <span className="w-28 shrink-0 text-slate-500">
                  {toCodeLabel(imageItemTypes.options, item.imageItemCode)}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {READING_STATUS_LABELS[item.readingStatusCode] ?? item.readingStatusCode}
                </span>
                {item.urgencyYn === "Y" ? (
                  <span className="rounded bg-rose-50 px-1.5 py-0.5 text-xs font-medium text-rose-600">
                    Urgent
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
      {matches.length > MAX_RESULTS ? (
        <p className="text-xs text-slate-400">
          {matches.length - MAX_RESULTS} more match{matches.length - MAX_RESULTS === 1 ? "" : "es"} —
          refine your search to narrow the list.
        </p>
      ) : null}
    </div>
  );
}
