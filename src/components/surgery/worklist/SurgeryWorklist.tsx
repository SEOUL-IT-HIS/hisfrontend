"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  Alert,
  Button,
  DataTable,
  Panel,
  StatusBadge,
  type DataTableColumn,
} from "@/components/common";
import AnesthesiaRecordPanel from "@/components/surgery/anesthesia/AnesthesiaRecordPanel";
import ChecklistPanel from "@/components/surgery/checklist/ChecklistPanel";
import ConsentPanel from "@/components/surgery/consent/ConsentPanel";
import OperativeRecordPanel from "@/components/surgery/operativeRecord/OperativeRecordPanel";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import { SURGERY_STATUS, type Surgery } from "@/features/surgery/schedule/types";
import {
  fetchSurgeriesRequest,
  selectScheduleError,
  selectScheduleLoading,
  selectSurgeries,
} from "@/features/surgery/schedule/slice";

/**
 * 수술 업무 화면 — 마스터-디테일 (2026-08-24)
 *
 * <h3>왜 만들었나</h3>
 *
 * <p>동의서·체크리스트·마취기록·수술기록지는 모두 <b>한 수술에 종속된 기록</b>인데,
 * 화면이 넷으로 나뉘어 있었다. 사이드바에서 각 화면으로 들어가면 수술이 정해지지 않은
 * 상태라 {@code SurgeryScopedPanel} 이 매번 수술을 다시 고르게 했다. 동의서를 쓰고
 * 마취기록을 쓰려면 화면을 옮기고 <b>같은 수술을 또 골라야</b> 했다.</p>
 *
 * <p>여기서는 왼쪽에서 수술을 <b>한 번</b> 고르면 오른쪽 탭이 전부 그 수술을 따라간다.
 * 검사·영상의 워크리스트({@code LabWorklist})가 같은 문제를 그렇게 풀었고, 구조만
 * 가져왔다.</p>
 *
 * <h3>탭 순서에 뜻이 있다</h3>
 *
 * <p>동의서 → 체크리스트 → 마취 → 기록지. 수술이 진행되는 순서다. 동의서를 맨 앞에 두는
 * 이유는 미확인이면 백엔드가 수술 시작을 막기 때문이다(SUR047).</p>
 *
 * <h3>취소된 수술을 기본 목록에서 빼는 이유</h3>
 *
 * <p>기록을 쓸 대상이 아니다. 다만 지난 기록을 볼 일은 있어서 "전체"로 넘길 수 있게 뒀다.
 * 완료 건은 남긴다 — 수술기록지는 끝난 뒤에 쓰는 경우가 많다.</p>
 */

type Tab = "consent" | "checklist" | "anesthesia" | "record";

const TABS: { key: Tab; label: string }[] = [
  { key: "consent", label: "동의서" },
  { key: "checklist", label: "체크리스트" },
  { key: "anesthesia", label: "마취기록" },
  { key: "record", label: "수술기록지" },
];

/** 기록 작업 대상 — 취소는 뺀다 */
const WORKABLE: string[] = [
  SURGERY_STATUS.SCHEDULED,
  SURGERY_STATUS.IN_PROGRESS,
  SURGERY_STATUS.COMPLETED,
];

const STATUS_LABEL: Record<string, string> = {
  [SURGERY_STATUS.SCHEDULED]: "예약",
  [SURGERY_STATUS.IN_PROGRESS]: "진행중",
  [SURGERY_STATUS.COMPLETED]: "완료",
  [SURGERY_STATUS.CANCELLED]: "취소",
};

export default function SurgeryWorklist() {
  const dispatch = useDispatch<AppDispatch>();
  const surgeries = useSelector(selectSurgeries);
  const loading = useSelector(selectScheduleLoading);
  const error = useSelector(selectScheduleError);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("consent");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    dispatch(fetchSurgeriesRequest());
  }, [dispatch]);

  const rows = (surgeries ?? []).filter(
    (s) => showAll || WORKABLE.includes(s.statusCd ?? ""),
  );

  // 목록이 바뀌어 고른 수술이 사라졌으면 선택을 놓는다(필터를 좁혔을 때 생긴다)
  const selected = rows.find((s) => s.surgeryId === selectedId) ?? null;
  if (selectedId && !selected) {
    setSelectedId(null);
  }

  const columns: DataTableColumn<Surgery>[] = [
    {
      key: "surgeryDt",
      header: "수술일",
      render: (s) => s.surgeryDt,
    },
    {
      key: "patientId",
      header: "환자",
      // 행 선택은 환자 클릭으로 한다 — 공통 DataTable 이 행 클릭을 지원하지 않는다
      render: (s) => (
        <button
          type="button"
          onClick={() => setSelectedId(s.surgeryId)}
          className={
            s.surgeryId === selectedId
              ? "text-left font-medium text-sky-600 underline underline-offset-2"
              : "text-left font-medium text-slate-700 hover:text-sky-600"
          }
        >
          {s.patientId}
        </button>
      ),
    },
    {
      key: "surgeryName",
      header: "수술명",
      render: (s) => s.surgeryName ?? "-",
    },
    {
      key: "roomCode",
      header: "수술실",
      render: (s) => s.roomCode ?? "-",
    },
    {
      key: "statusCd",
      header: "상태",
      // StatusBadge 는 Y/N 전용이라(사용·미사용) 상태 라벨에는 맞지 않는다.
      // 응급 여부만 Y/N 이라 배지를 쓰고, 상태는 글자로 둔다.
      render: (s) => (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600">
            {STATUS_LABEL[s.statusCd ?? ""] ?? s.statusCd}
          </span>
          {s.emergencyYn === "Y" ? (
            <StatusBadge value="Y" activeLabel="응급" />
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 gap-4">
      {/* ---- 왼쪽: 수술 목록 ---- */}
      <div className="flex min-h-0 w-[52%] min-w-[480px] flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            수술을 고르면 오른쪽에서 기록을 이어서 작성합니다.
          </p>
          <Button onClick={() => setShowAll((v) => !v)}>
            {showAll ? "작업 대상만" : "전체 보기"}
          </Button>
        </div>

        {error ? <Alert>{resolveSurgeryMessage(error)}</Alert> : null}

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(s) => s.surgeryId}
          loading={loading}
          emptyMessage={
            showAll
              ? "수술이 없습니다."
              : "기록을 작성할 수술이 없습니다. 요청 배정이 끝나야 목록에 나타납니다."
          }
          minWidthClassName="min-w-[560px]"
        />
      </div>

      {/* ---- 오른쪽: 고른 수술의 기록 ---- */}
      <Panel className="min-h-0 flex-1 p-5">
        {!selected ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            왼쪽에서 수술을 선택하세요.
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div>
              <p className="text-sm font-medium text-slate-800">
                {selected.surgeryName ?? "수술명 미입력"}
              </p>
              <p className="text-xs text-slate-500">
                환자 {selected.patientId} · {selected.surgeryDt}
                {selected.roomCode ? ` · ${selected.roomCode}` : ""}
              </p>
            </div>

            <div className="flex gap-2">
              {TABS.map((t) => (
                <Button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={
                    tab === t.key ? "border-sky-500 text-sky-600" : undefined
                  }
                >
                  {t.label}
                </Button>
              ))}
            </div>

            {/*
              key 로 수술마다 새로 마운트한다 — 이전 수술의 입력값이 남으면
              엉뚱한 수술에 기록이 저장될 수 있다. LabWorklist 와 같은 방식이다.
            */}
            <div className="min-h-0 flex-1 overflow-auto">
              {tab === "consent" ? (
                <ConsentPanel key={selected.surgeryId} surgeryId={selected.surgeryId} />
              ) : null}
              {tab === "checklist" ? (
                <ChecklistPanel key={selected.surgeryId} surgeryId={selected.surgeryId} />
              ) : null}
              {tab === "anesthesia" ? (
                <AnesthesiaRecordPanel
                  key={selected.surgeryId}
                  surgeryId={selected.surgeryId}
                />
              ) : null}
              {tab === "record" ? (
                <OperativeRecordPanel
                  key={selected.surgeryId}
                  surgeryId={selected.surgeryId}
                />
              ) : null}
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
