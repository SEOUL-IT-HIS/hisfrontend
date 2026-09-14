"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert } from "@/components/common";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import type { CommonCodeOption } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { resolveImageReadingMessage } from "@/features/labimaging/imaginginterpretation/messages";
import {
  fetchReadingWorklistRequest,
  selectReadingWorklist,
  selectReadingWorklistError,
  selectReadingWorklistLoading,
} from "@/features/labimaging/imaginginterpretation/slice";
import {
  READING_STATUS,
  READING_STATUS_LABELS,
} from "@/features/labimaging/imaginginterpretation/types";
import type { ImageWorklistItem } from "@/features/labimaging/imagingorder/types";
import ImageReadingDetail from "@/components/labimaging/imaginginterpretation/ImageReadingDetail";

/**
 * 선택한 접수의 오더에 속한 촬영항목별 판독 상태 목록 + 상세(펼치기).
 * 대응 유스케이스: UC-IMG-04 영상판독처리 (Jira ZP2-23)
 *
 * ⚠ 판독 워크리스트 API(GET /image-readings/worklist)는 접수·오더 단위 조회가 아니다.
 *   "영상파일이 1건 이상 등록된 촬영항목 전체"를 응급 우선으로 내려준다(findOrCreate, ZP2-125).
 *   그래서 이 패널은 그 전체 목록을 불러온 뒤 이 접수의 오더(imageOrderId)에 속한 것만
 *   화면에서 걸러 보여준다 — 오더 단위 조회를 새로 만들지 않는다.
 *   (ImageAcquisitionWorkPanel 이 imagingschedule 의 항목 목록을 재사용하는 것과 같은 절약)
 *
 * ⚠ 입력 단위는 "촬영항목"이라 접수보다 한 단계 아래다. 항목을 고르면 목록 아래에 상세
 *   (ImageReadingDetail)가 펼쳐진다. 별도 페이지로 이동시키지 않는 이유는, 같은 오더에
 *   촬영항목이 여러 건이라 워크리스트를 벗어나지 않고 여러 항목을 오가며 판독해야 하기
 *   때문이다. app/labimaging/imaginginterpretation/page.tsx 의 단독 페이지는 이 워크리스트를
 *   거치지 않고 바로 들어오는 경로(예: 알림 링크)를 위한 것이다.
 */

/** 공통코드값 → 코드명. 아직 못 불러왔거나 사전에 없는 값이면 코드값을 그대로 보여준다. */
function toCodeLabel(options: CommonCodeOption[], code?: string) {
  if (!code) return "-";
  return options.find((opt) => opt.value === code)?.label ?? code;
}

function statusToneClass(code: string) {
  if (code === READING_STATUS.CONFIRMED) return "text-emerald-600";
  if (code === READING_STATUS.IN_PROGRESS) return "text-sky-600";
  return "text-slate-500";
}

export default function ImageReadingWorkPanel({
  reception,
}: {
  reception: ImageWorklistItem;
}) {
  const dispatch = useDispatch<AppDispatch>();

  const worklist = useSelector(selectReadingWorklist);
  const loading = useSelector(selectReadingWorklistLoading);
  const error = useSelector(selectReadingWorklistError);

  // 촬영항목코드는 admin 공통코드다. (ImageAcquisitionWorkPanel 과 동일 그룹)
  const imageItemTypes = useCommonCodeOptions("IMG_ITEM_CD");

  const [selectedItemId, setSelectedItemId] = useState<string>("");

  useEffect(() => {
    dispatch(fetchReadingWorklistRequest());
  }, [dispatch, reception.imageOrderId]);

  const items = worklist.filter((r) => r.imageOrderId === reception.imageOrderId);

  function handleSelectItem(imageOrderItemId: string) {
    setSelectedItemId((prev) => (prev === imageOrderItemId ? "" : imageOrderItemId));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {error ? <Alert>{resolveImageReadingMessage(error)}</Alert> : null}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-slate-700">Imaging Items</p>

        {loading ? (
          <p className="text-sm text-slate-400">Loading reading worklist...</p>
        ) : items.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
            No imaging items are ready for reading yet. An item appears here once at
            least one image file has been uploaded (see the Acquisition tab).
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {items.map((item) => {
              const isSelected = item.imageOrderItemId === selectedItemId;
              return (
                <li key={item.imageOrderItemId}>
                  <button
                    type="button"
                    onClick={() => handleSelectItem(item.imageOrderItemId)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm ${
                      isSelected ? "bg-sky-50" : ""
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        isSelected ? "bg-sky-500" : "bg-slate-200"
                      }`}
                    />
                    <span className="w-40 shrink-0 font-semibold text-slate-700">
                      {toCodeLabel(imageItemTypes.options, item.imageItemCode)}
                    </span>
                    <span
                      className={`text-xs font-medium ${statusToneClass(item.readingStatusCode)}`}
                    >
                      {READING_STATUS_LABELS[item.readingStatusCode] ?? item.readingStatusCode}
                    </span>
                    {item.assignedToId ? (
                      <span className="ml-auto text-xs text-slate-400">
                        Assigned to {item.assignedToId}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selectedItemId ? (
        // key 로 항목마다 새로 마운트해 이전 항목의 입력값·상세가 남지 않게 한다.
        <ImageReadingDetail key={selectedItemId} imageOrderItemId={selectedItemId} />
      ) : (
        <p className="text-sm text-slate-400">
          Select an imaging item from the list above to read it.
        </p>
      )}
    </div>
  );
}
