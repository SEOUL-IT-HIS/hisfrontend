"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, DataTable, Panel } from "@/components/common";
import { usePatientNames } from "@/features/labimaging/common/hooks/usePatientNames";
import type { DataTableColumn } from "@/components/common";
import { resolveImageOrderMessage } from "@/features/labimaging/imagingorder/messages";
import {
  fetchImageReceptionsRequest,
  selectImageReceptions,
  selectImageReceptionsError,
  selectImageReceptionsLoading,
} from "@/features/labimaging/imagingorder/slice";
import type { ImageReceptionSummary } from "@/features/labimaging/imagingorder/types";
import ConsentWorkPanel from "@/components/labimaging/imagingacquisition/ConsentWorkPanel";

/**
 * 영상 동의 화면 — 왼쪽 영상오더 목록 + 오른쪽 동의 작업 (마스터-디테일).
 * 대응 유스케이스: UC-IMG-05 조영제/침습검사 동의 등록 (Jira ZP2-28 / ZP2-82)
 *
 * ── 설계 메모
 * 1. 목록은 검사 워크리스트와 같은 좌우 구조를 쓴다. 담당자가 여러 건을 연속 처리할 때
 *    화면 이동이 없어야 하고, 두 화면의 조작 방식이 다르면 학습 비용만 늘어난다.
 * 2. 다만 행 단위는 "접수"가 아니라 사실상 "오더"다. 동의가 IMAGE_ORDER 에 붙기 때문이다.
 *    접수 목록을 그대로 쓰되 선택 시 imageOrderId 를 넘긴다.
 *    (같은 오더로 접수가 2건 생기면 목록에 2줄이 보이지만 동의 이력은 동일하게 나온다.
 *     영상 워크리스트가 생기면 그쪽으로 흡수하면서 정리할 부분이다)
 * 3. 필터는 두지 않았다. 어떤 촬영항목이 동의를 필요로 하는지 기준이 아직 없어
 *    "동의 필요 대상"을 서버가 골라줄 수 없다. 지금은 전체를 보여주고 담당자가 고른다.
 */
export default function ConsentScreen() {
  const dispatch = useDispatch<AppDispatch>();

  const receptions = useSelector(selectImageReceptions);
  // 환자번호를 화면에서 뺐으므로 환자 식별은 이름으로 한다.
  const { names: patientNames } = usePatientNames(receptions.map((r) => r.patientId));
  const loading = useSelector(selectImageReceptionsLoading);
  const error = useSelector(selectImageReceptionsError);

  const [selectedOrderId, setSelectedOrderId] = useState<string>("");

  useEffect(() => {
    dispatch(fetchImageReceptionsRequest("ALL"));
  }, [dispatch]);

  const selected =
    receptions.find((r) => r.imageOrderId === selectedOrderId) ?? null;

  const columns: DataTableColumn<ImageReceptionSummary>[] = [
    {
      key: "imageOrderNo",
      header: "오더 / 환자",
      render: (r) => (
        // 행 선택은 오더번호 클릭으로 한다. (공통 DataTable 은 행 클릭을 지원하지 않는다)
        <button
          type="button"
          onClick={() => setSelectedOrderId(r.imageOrderId)}
          className={
            r.imageOrderId === selectedOrderId
              ? "text-left font-semibold text-sky-600 underline underline-offset-2"
              : "text-left font-semibold text-slate-700 hover:text-sky-600"
          }
        >
          {r.imageOrderNo}
          {/* 환자번호는 화면에서 쓰지 않는다. 식별은 이름으로. (2026-08-25) */}
          <span className="ml-2 font-normal text-slate-400">
            {patientNames[r.patientId] ?? "미상"}
          </span>
        </button>
      ),
    },
    {
      key: "receptionNo",
      header: "접수번호",
      render: (r) => <span className="text-slate-500">{r.receptionNo}</span>,
    },
    {
      key: "scheduledAt",
      header: "촬영예정",
      render: (r) => (
        <span className="text-slate-500">
          {r.scheduledAt ? r.scheduledAt.replace("T", " ").slice(0, 16) : "미정"}
        </span>
      ),
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 gap-4">
      {/* ================= 왼쪽: 영상오더 목록 ================= */}
      <div className="flex min-h-0 w-[46%] min-w-[440px] flex-col gap-3">
        <div className="flex justify-end">
          <Button
            variant="secondary"
            onClick={() => dispatch(fetchImageReceptionsRequest("ALL"))}
            disabled={loading}
          >
            새로고침
          </Button>
        </div>

        {error ? <Alert>{resolveImageOrderMessage(error)}</Alert> : null}

        <DataTable
          columns={columns}
          rows={receptions}
          rowKey={(r) => r.imageReceptionId}
          loading={loading}
          minWidthClassName="min-w-[420px]"
          emptyMessage="접수된 영상오더가 없습니다."
        />
      </div>

      {/* ================= 오른쪽: 동의 작업 영역 ================= */}
      <Panel className="min-h-0 flex-1 p-5">
        {selected === null ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            왼쪽 목록에서 오더번호를 클릭하세요.
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="border-b border-slate-100 pb-3">
              <p className="text-base font-semibold text-slate-800">
                {selected.imageOrderNo}
              </p>
              <p className="text-sm text-slate-500">
                환자 {patientNames[selected.patientId] ?? "미상"} · 접수{" "}
                {selected.receptionNo}
              </p>
            </div>
            {/*
              key 를 오더ID 로 준다. 다른 오더를 고르면 폼 상태(입력값·검증오류)가
              남지 않고 컴포넌트가 새로 마운트된다.
            */}
            <ConsentWorkPanel key={selected.imageOrderId} reception={selected} />
          </div>
        )}
      </Panel>
    </div>
  );
}
