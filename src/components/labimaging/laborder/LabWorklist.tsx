"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, DataTable, Panel } from "@/components/common";
import type { DataTableColumn } from "@/components/common";
import { resolveLabOrderMessage } from "@/features/labimaging/laborder/messages";
import {
  clearWorklistSelection,
  excludeReceptionRequest,
  fetchLabWorklistRequest,
  restoreReceptionRequest,
  selectExclusionError,
  selectExclusionSubmitting,
  selectLabWorklist,
  selectLabWorklistError,
  selectLabWorklistLoading,
  selectSelectedReceptionNo,
  selectWorklistReception,
} from "@/features/labimaging/laborder/slice";
import {
  WORKLIST_FILTER_OPTIONS,
  WORKLIST_STEP_LABELS,
  type LabWorklistItem,
  type WorklistStatusFilter,
} from "@/features/labimaging/laborder/types";
import { selectLastCreatedLabSchedule } from "@/features/labimaging/labschedule/slice";
import {
  selectLastAcceptedSpecimen,
  selectLastCreatedSpecimen,
} from "@/features/labimaging/labspecimen/slice";
import ReceptionExcludeDialog from "@/components/labimaging/laborder/ReceptionExcludeDialog";
import WorklistProgress from "@/components/labimaging/laborder/WorklistProgress";
import WorklistReceptionHeader from "@/components/labimaging/laborder/WorklistReceptionHeader";
import LabScheduleRegisterForm from "@/components/labimaging/labschedule/LabScheduleRegisterForm";
import SpecimenWorkPanel from "@/components/labimaging/labspecimen/SpecimenWorkPanel";
import SpecimenAcceptancePanel from "@/components/labimaging/labspecimen/SpecimenAcceptancePanel";

/**
 * 검사 워크리스트 — 왼쪽 접수 목록 + 오른쪽 작업 폼 (마스터-디테일).
 *
 * ── 설계 원칙
 * 1. 목록의 행 단위는 언제나 "접수" 하나다.
 *    검체는 접수 1건에 여러 건 달릴 수 있는데(1:N), 단계마다 행 단위를 바꾸면
 *    같은 접수가 여러 줄로 쪼개지고 표가 통째로 바뀐다. 검체 단위 작업은 오른쪽에서 한다.
 * 2. 결과가 등록되기 전까지 접수는 목록에 남는다.
 *    일정·검체·판정을 다 끝내도 사라지지 않는다. 담당자가 바뀌어도 진행 상태만 보면
 *    다음에 뭘 해야 하는지 알 수 있어야 하기 때문이다.
 * 3. 목록에서 빼는 건 담당자 판단이다.
 *    기간이 지났다고 자동으로 숨기면, 실제로는 처리해야 하는데 누락된 건까지 같이 사라진다.
 * 4. 정렬은 접수일시 오름차순이다. 오래 대기한 건이 위, 새 오더는 아래에 붙는다. (서버가 정렬)
 *
 * ── 아직 없는 것
 * 적합성 판정·결과 등록 화면은 미구현이라 오른쪽 탭에서 비활성으로 표시된다.
 * 일정 등록은 기존 화면이 있어 링크로 연결한다. (다음 단계에서 이 패널 안으로 들여올 예정)
 */

/** 백엔드가 ISO 문자열로 준다. 초 단위는 화면에서 의미가 없어 분까지만 보여준다. */
function formatDateTime(value?: string) {
  if (!value) return "-";
  return value.replace("T", " ").slice(0, 16);
}

type WorkTab = "schedule" | "specimen" | "acceptance" | "result";

const WORK_TABS: ReadonlyArray<{ value: WorkTab; label: string; enabled: boolean }> = [
  { value: "schedule", label: "일정", enabled: true },
  { value: "specimen", label: "검체", enabled: true },
  { value: "acceptance", label: "적합성 판정", enabled: true },
  { value: "result", label: "결과", enabled: false },
];

export default function LabWorklist() {
  const dispatch = useDispatch<AppDispatch>();

  const worklist = useSelector(selectLabWorklist);
  const loading = useSelector(selectLabWorklistLoading);
  const error = useSelector(selectLabWorklistError);
  const selectedReceptionNo = useSelector(selectSelectedReceptionNo);
  const exclusionSubmitting = useSelector(selectExclusionSubmitting);
  const exclusionError = useSelector(selectExclusionError);

  const [filter, setFilter] = useState<WorklistStatusFilter>("ACCEPTED");
  const [tab, setTab] = useState<WorkTab>("specimen");
  /** 제외 다이얼로그를 띄운 대상 접수번호. null 이면 닫힌 상태 */
  const [excludeTarget, setExcludeTarget] = useState<string | null>(null);

  /*
   * 일정/검체/판정 결과. 값 자체는 쓰지 않고 "방금 뭔가 저장됐다"는 신호로만 본다.
   * 저장은 오른쪽 폼이 하는데 그 결과로 진행 뱃지(일정·검체 수·판정 n/m)가 달라지므로,
   * 목록을 쥐고 있는 이쪽이 알아야 한다.
   *
   * ⚠ 판정은 검체 1건당 1건뿐이라 specimenId 가 판정 건을 그대로 가리킨다.
   *   (판정 PK 를 응답에 담지 않기로 해서 이 값을 쓴다)
   */
  const lastScheduleId = useSelector(selectLastCreatedLabSchedule)?.labScheduleId ?? null;
  const lastSpecimenId = useSelector(selectLastCreatedSpecimen)?.specimenId ?? null;
  const lastAcceptedId = useSelector(selectLastAcceptedSpecimen)?.specimenId ?? null;

  /*
   * 목록을 다시 부르는 지점은 이 효과 하나로 모은다.
   *   - 필터를 바꿨을 때
   *   - 일정·검체·판정이 저장돼 진행 상태가 달라졌을 때
   * 효과를 나눠 두면 필터를 바꿀 때 양쪽이 같이 돌아 같은 요청이 두 번 나간다.
   */
  useEffect(() => {
    dispatch(fetchLabWorklistRequest(filter));
  }, [dispatch, filter, lastScheduleId, lastSpecimenId, lastAcceptedId]);

  const selected =
    worklist.find((item) => item.receptionNo === selectedReceptionNo) ?? null;

  function handleExclude(exclusionReason: string) {
    if (!excludeTarget) return;
    dispatch(excludeReceptionRequest(excludeTarget, exclusionReason, filter));
    setExcludeTarget(null);
  }

  const columns: DataTableColumn<LabWorklistItem>[] = [
    {
      key: "receivedAt",
      header: "접수시각",
      render: (r) => (
        <span className="text-slate-500">{formatDateTime(r.receivedAt)}</span>
      ),
    },
    {
      key: "receptionNo",
      header: "접수 / 환자",
      render: (r) => (
        // 행 선택은 접수번호 클릭으로 한다. (공통 DataTable 은 행 클릭을 지원하지 않는다)
        <button
          type="button"
          onClick={() => dispatch(selectWorklistReception(r.receptionNo))}
          className={
            r.receptionNo === selectedReceptionNo
              ? "text-left font-semibold text-sky-600 underline underline-offset-2"
              : "text-left font-semibold text-slate-700 hover:text-sky-600"
          }
        >
          {r.receptionNo}
          {/* 환자번호는 발급 주체가 없어 연계 수신 건에는 값이 없다. (2026-08-25) */}
          <span className="ml-2 font-normal text-slate-400">
            {r.patientNo ?? "환자번호 미발급"}
          </span>
          {r.urgencyYn === "Y" ? (
            <span className="ml-2 rounded bg-rose-50 px-1.5 py-0.5 text-xs font-medium text-rose-600">
              긴급
            </span>
          ) : null}
        </button>
      ),
    },
    {
      key: "progress",
      header: "진행",
      render: (r) => <WorklistProgress item={r} />,
    },
    {
      key: "nextStep",
      header: "다음 할 일",
      render: (r) =>
        r.receptionStatusCode === "EXCLUDED" ? (
          <span className="text-slate-400" title={r.exclusionReason}>
            제외됨
          </span>
        ) : (
          <span className="font-medium text-slate-700">
            {WORKLIST_STEP_LABELS[r.nextStep]}
          </span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) =>
        r.receptionStatusCode === "EXCLUDED" ? (
          <Button
            variant="secondary"
            onClick={() => dispatch(restoreReceptionRequest(r.receptionNo, filter))}
            disabled={exclusionSubmitting}
          >
            복구
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={() => setExcludeTarget(r.receptionNo)}
            disabled={exclusionSubmitting}
          >
            제외
          </Button>
        ),
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 gap-4">
      {/* ================= 왼쪽: 접수 워크리스트 ================= */}
      <div className="flex min-h-0 w-[54%] min-w-[520px] flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            {WORKLIST_FILTER_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={filter === opt.value ? "primary" : "secondary"}
                onClick={() => setFilter(opt.value)}
                disabled={loading}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <Button
            variant="secondary"
            onClick={() => dispatch(fetchLabWorklistRequest(filter))}
            disabled={loading}
          >
            새로고침
          </Button>
        </div>

        {error ? <Alert>{resolveLabOrderMessage(error)}</Alert> : null}
        {exclusionError ? <Alert>{resolveLabOrderMessage(exclusionError)}</Alert> : null}

        <DataTable
          columns={columns}
          rows={worklist}
          rowKey={(r) => r.labReceptionId}
          loading={loading}
          minWidthClassName="min-w-[680px]"
          emptyMessage={
            filter === "EXCLUDED"
              ? "제외된 접수가 없습니다."
              : "처리할 접수가 없습니다."
          }
        />
      </div>

      {/* ================= 오른쪽: 작업 영역 ================= */}
      <Panel className="min-h-0 flex-1 p-5">
        {selected === null ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            왼쪽 목록에서 접수번호를 클릭하세요.
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <WorklistReceptionHeader reception={selected} />

            {/* 작업 탭 — 담당자가 직접 고른다.
                진행 상태만 보고 자동으로 정하면 일정 재조정처럼 되돌아가는 작업을 할 수 없다. */}
            <div className="flex gap-2">
              {WORK_TABS.map((t) => (
                <Button
                  key={t.value}
                  variant={tab === t.value ? "primary" : "secondary"}
                  onClick={() => setTab(t.value)}
                  disabled={!t.enabled}
                  title={t.enabled ? undefined : "아직 구현되지 않은 단계입니다."}
                >
                  {t.label}
                </Button>
              ))}
            </div>

            {tab === "specimen" ? (
              <SpecimenWorkPanel reception={selected} />
            ) : tab === "acceptance" ? (
              // key 로 접수마다 새로 마운트해 이전 접수의 검체 선택·입력값이 남지 않게 한다.
              <SpecimenAcceptancePanel
                key={selected.labReceptionId}
                reception={selected}
              />
            ) : tab === "schedule" ? (
              /*
               * key 로 접수마다 새로 마운트시킨다.
               * defaultMode 는 useState 초기값이라 첫 렌더에만 반영되는데,
               * 같은 탭에 머문 채 다른 접수를 고르면 이전 접수의 모드·입력값이 그대로 남는다.
               * 일정이 있는 접수에 "신규 등록"이 걸린 채로 저장하면 DB 제약(latest_yn UNIQUE)에 걸린다.
               */
              <LabScheduleRegisterForm
                key={selected.labReceptionId}
                labReceptionId={selected.labReceptionId}
                defaultMode={selected.scheduledAt ? "reschedule" : "create"}
                showReceptionSummary={false}
                onCancel={() => dispatch(clearWorklistSelection())}
              />
            ) : (
              <div className="text-sm text-slate-400">
                아직 구현되지 않은 단계입니다.
              </div>
            )}
          </div>
        )}
      </Panel>

      <ReceptionExcludeDialog
        open={excludeTarget !== null}
        receptionNo={excludeTarget ?? ""}
        submitting={exclusionSubmitting}
        onConfirm={handleExclude}
        onCancel={() => setExcludeTarget(null)}
      />
    </div>
  );
}
