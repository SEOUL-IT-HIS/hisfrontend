"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  Alert,
  Button,
  DataTable,
  FormField,
  Input,
  Pagination,
  Panel,
  Select,
  type DataTableColumn,
} from "@/components/common";
import AnesthesiaRecordPanel from "@/components/surgery/anesthesia/AnesthesiaRecordPanel";
import ChecklistPanel from "@/components/surgery/checklist/ChecklistPanel";
import ConsentPanel from "@/components/surgery/consent/ConsentPanel";
import OperativeRecordPanel from "@/components/surgery/operativeRecord/OperativeRecordPanel";
import PlannedItemsPanel from "@/components/surgery/planneditem/PlannedItemsPanel";
import { useSearchParams } from "next/navigation";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import {
  fetchChecklistRequest,
  selectChecklistItems,
} from "@/features/surgery/checklist/slice";
import {
  getPatientDisplayName,
  usePatientNames,
} from "@/features/surgery/common/usePatientNames";
import { useEmpNames } from "@/features/emp/hooks/useEmpNames";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import {
  SURGERY_STATUS,
  type Surgery,
  type SurgerySearchParams,
} from "@/features/surgery/schedule/types";
import {
  cancelSurgeryRequest,
  endSurgeryRequest,
  searchSurgeriesRequest,
  selectScheduleError,
  selectScheduleLoading,
  selectScheduleSaving,
  selectSurgerySearchParams,
  selectSurgerySearchResult,
  startSurgeryRequest,
} from "@/features/surgery/schedule/slice";

/**
 * 수술 업무 화면 — 마스터-디테일
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
 * 이유는 동의서가 없으면 백엔드가 수술 시작을 막기 때문이다(SL2-217, 400 SUR047).</p>
 *
 * <p>이 문장은 한동안 사실이 아니었다 — 주석에는 그렇게 적혀 있었지만 {@code startSurgery}
 * 에 동의서 검사가 없었고, 마취기록만 마취 동의서를 요구했다. 2026-08-26 실제로 붙였다.</p>
 *
 * <h3>취소된 수술을 기본 목록에서 빼는 이유</h3>
 *
 * <p>기록을 쓸 대상이 아니다. 다만 지난 기록을 볼 일은 있어서 "전체"로 넘길 수 있게 뒀다.
 * 완료 건은 남긴다 — 수술기록지는 끝난 뒤에 쓰는 경우가 많다.</p>
 *
 * <h3>상태 전이가 여기로 왔다</h3>
 *
 * <p>시작·종료·취소 버튼은 배정 상세({@code /surgery/schedule/detail})에 있었다.
 * 8/25 에 기록 패널을 이 화면으로 넘기면서 상태 버튼만 그대로 두어 생긴 어긋남이다.
 * 배정 화면은 <b>누가 어디서 할지</b>를 정하는 곳이고, 수술이 <b>실제로 벌어지는</b>
 * 동안의 조작은 이 화면 몫이다.</p>
 *
 * <p>붙여 놓고 보니 순서도 맞는다 — 동의서가 없으면 시작이 막히는데(SL2-217),
 * 그 동의서를 쓰는 탭이 바로 옆에 있다. 예전에는 동의서를 쓰고 배정 화면으로 건너가
 * 시작을 눌러야 했다.</p>
 *
 * <p><b>취소도 함께 옮겼다.</b> 취소는 예약 상태에서만 되고 오더까지 03 으로 되돌리므로
 * 배정 쪽 판단으로 볼 여지가 있었다. 다만 상태를 바꾸는 조작이 두 화면에 흩어지면
 * "어디서 하는 거였지"를 다시 묻게 된다. 상태는 전부 여기, 배정은 전부 저기로 갈랐다.</p>
 */

type Tab = "consent" | "checklist" | "plannedItems" | "anesthesia" | "record";

const TABS: { key: Tab; label: string }[] = [
  { key: "consent", label: "Consent" },
  { key: "checklist", label: "Checklist" },
  { key: "plannedItems", label: "Planned items" },
  { key: "anesthesia", label: "Anesthesia" },
  { key: "record", label: "Operative record" },
];

/** 기록 작업 대상 — 취소는 뺀다 */
const WORKABLE: string[] = [
  SURGERY_STATUS.SCHEDULED,
  SURGERY_STATUS.IN_PROGRESS,
  SURGERY_STATUS.COMPLETED,
];

const STATUS_LABEL: Record<string, string> = {
  [SURGERY_STATUS.SCHEDULED]: "Scheduled",
  [SURGERY_STATUS.IN_PROGRESS]: "In progress",
  [SURGERY_STATUS.COMPLETED]: "Completed",
  [SURGERY_STATUS.CANCELLED]: "Cancelled",
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  [SURGERY_STATUS.SCHEDULED]: "bg-sky-100 text-sky-700",
  [SURGERY_STATUS.IN_PROGRESS]: "bg-emerald-100 text-emerald-700",
  [SURGERY_STATUS.COMPLETED]: "bg-blue-100 text-blue-700",
  [SURGERY_STATUS.CANCELLED]: "bg-rose-100 text-rose-700",
};

/**
 * 검색 입력칸의 초기값. "조건 없음"을 빈 문자열로 표현한다.
 *
 * <p><b>환자·집도의 검색칸을 걷어냈다.</b> 둘 다 식별자(UUID)로만 찾을 수 있었는데,
 * 화면에서는 이름으로 보여 사용자가 입력할 값을 알 수 없는 검색칸이었다.
 * 백엔드 {@code patientId}·{@code surgeonId} 파라미터는 그대로 살아 있으니
 * 이름으로 찾는 방법이 생기면 그때 다시 붙이면 된다.</p>
 */
const EMPTY_FORM = {
  roomCode: "",
  fromDt: "",
  toDt: "",
};

export default function SurgeryWorklist() {
  const dispatch = useDispatch<AppDispatch>();
  const result = useSelector(selectSurgerySearchResult);
  const lastParams = useSelector(selectSurgerySearchParams);
  const loading = useSelector(selectScheduleLoading);
  const saving = useSelector(selectScheduleSaving);
  const error = useSelector(selectScheduleError);

  /**
   * 주소로 넘어온 수술 — 홈에서 배정을 마쳤거나 Open 을 누른 경우다.
   *
   * <p>{@code /surgery/worklist?surgeryId=...} 로 들어오면 그 수술을 바로 선택한다.
   * 배정만 하고 끝나는 일이 거의 없어서(동의서·체크리스트·시작이 다 여기 있다)
   * 넘어오자마자 그 환자 화면이 열려 있어야 한다.</p>
   */
  const surgeryIdFromUrl = useSearchParams().get("surgeryId");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** 이미 반영한 주소 값. 사용자가 다른 수술을 고른 뒤 되돌아가지 않게 한다 */
  const [boundUrlId, setBoundUrlId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("consent");
  const [showAll, setShowAll] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [cancelReasonCd, setCancelReasonCd] = useState("");

  const { options: cancelOptions } = useCommonCodeOptions("SURGERY_CANCEL_CD");

  // 공통 Pagination 은 1-base, 백엔드 Pageable 은 0-base 다(§14.2 와 무관한 라이브러리 차이).
  const [page, setPage] = useState(1);

  /** 폼 + 페이지를 검색 파라미터로 만든다. 빈 칸은 아예 빼서 조건 없음으로 둔다 */
  const buildParams = (p: number): SurgerySearchParams => {
    const params: SurgerySearchParams = { page: p - 1, size: 20 };
    if (form.roomCode.trim()) params.roomCode = form.roomCode.trim();
    if (form.fromDt) params.fromDt = form.fromDt;
    if (form.toDt) params.toDt = form.toDt;
    return params;
  };

  useEffect(() => {
    // 첫 진입은 조건 없이 1페이지
    dispatch(searchSurgeriesRequest({ page: 0, size: 20 }));
  }, [dispatch]);

  /*
    주소로 온 수술을 선택한다. effect 가 아니라 렌더 중에 처리하는 이유 —
    effect 로 하면 첫 렌더가 "선택 없음"으로 한 번 그려진 뒤 다시 그려진다.
    배정 폼(SurgeryAssignForm)이 오더를 물릴 때 쓰는 것과 같은 방식이다.

    boundUrlId 로 "이미 반영했다"를 기억한다 — 안 그러면 사용자가 목록에서 다른
    수술을 골라도 매 렌더마다 주소의 값으로 되돌아간다.
  */
  if (surgeryIdFromUrl && surgeryIdFromUrl !== boundUrlId) {
    setBoundUrlId(surgeryIdFromUrl);
    setSelectedId(surgeryIdFromUrl);
  }

  function handleSearch() {
    setPage(1);
    setSelectedId(null);
    dispatch(searchSurgeriesRequest(buildParams(1)));
  }

  function handleReset() {
    setForm(EMPTY_FORM);
    setPage(1);
    setSelectedId(null);
    dispatch(searchSurgeriesRequest({ page: 0, size: 20 }));
  }

  function handlePage(next: number) {
    setPage(next);
    setSelectedId(null);
    // 마지막 조건을 그대로 쓴다 — 폼을 고치다 만 상태여도 보고 있던 결과가 유지된다
    dispatch(searchSurgeriesRequest({ ...lastParams, page: next - 1 }));
  }

  const rows = (result?.items ?? []).filter(
    (s) => showAll || WORKABLE.includes(s.statusCd ?? ""),
  );

  /*
    목록이 바뀌어 고른 수술이 사라졌으면 선택을 놓는다(필터를 좁혔을 때 생긴다).

    단 주소로 넘어온 건은 놓지 않는다. 조회가 끝나기 전에는 rows 가 비어 있어
    "없다"로 판정되는데, 여기서 선택을 지우면 목록이 도착해도 이미 null 이라
    아무것도 안 열린다. 아래에서 목록이 다 온 뒤에도 못 찾은 경우만 안내한다.
  */
  const selected = rows.find((s) => s.surgeryId === selectedId) ?? null;
  if (selectedId && !selected && selectedId !== surgeryIdFromUrl) {
    setSelectedId(null);
  }

  /** 주소로 지정된 수술이 지금 목록에 없다 — 뒤 페이지에 있거나 필터 밖이다 */
  const urlSurgeryMissing =
    Boolean(surgeryIdFromUrl) && !loading && selectedId === surgeryIdFromUrl && !selected;

  const isScheduled = selected?.statusCd === SURGERY_STATUS.SCHEDULED;
  const isInProgress = selected?.statusCd === SURGERY_STATUS.IN_PROGRESS;

  /*
    Sign Out 이 끝나야 수술을 종료할 수 있다(SUR060).

    백엔드가 막지만 버튼을 눌러 400 을 받고 나서야 알면 늦다 — 시작을 동의서로
    막는 것과 같은 이유로 화면에서 먼저 알린다(§15.3).

    체크리스트는 옆 탭이 이미 읽고 있지만, 다른 탭을 보고 있으면 아직 없을 수
    있어 여기서도 한 번 부른다. 같은 액션이라 slice 가 덮어쓸 뿐이다.
  */
  const checklistItems = useSelector(selectChecklistItems);
  const signOutDone = checklistItems.some(
    (i) => i.phaseCd === "03" && i.completedYn === "Y",
  );

  useEffect(() => {
    if (selected) dispatch(fetchChecklistRequest(selected.surgeryId));
  }, [dispatch, selected]);

  // 지금 보이는 행들의 환자명. rows 가 바뀔 때만 다시 부른다(훅 안에서 키로 거른다).
  const { names: patientNames } = usePatientNames(rows.map((s) => s.patientId));
  const { names: employeeNames } = useEmpNames();

  const columns: DataTableColumn<Surgery>[] = [
    {
      key: "surgeryDt",
      header: "Date",
      render: (s) => s.surgeryDt,
    },
    {
      key: "patientId",
      header: "Patient",
      /*
        행 선택은 환자 클릭으로 한다 — 공통 DataTable 이 행 클릭을 지원하지 않는다.

        표시는 이름이다. SURGERY 테이블은 patient_id 만 갖고 있어서(§14.1 스냅샷 금지)
        예전에는 UUID 를 그대로 띄웠는데, 사람이 알아볼 수 없는 값이라 목록으로서
        의미가 없었다. 이름은 patient-service 에 매번 물어본다.

        못 불러오면 안내 문구를 표시한다 — 이름은 표시용이라, patient-service 가
        죽어도 수술 업무는 계속돼야 한다.
      */
      render: (s) => (
        <button
          type="button"
          onClick={() => {
            setSelectedId(s.surgeryId);
            // 고른 수술이 바뀌면 사유를 비운다 — 안 그러면 A 에 고른 취소 사유가
            // B 를 골랐을 때 남아 있어, 잘못 눌러도 버튼이 열려 있다
            setCancelReasonCd("");
          }}
          className={
            s.surgeryId === selectedId
              ? "text-left font-medium text-sky-600 underline underline-offset-2"
              : "text-left font-medium text-slate-700 hover:text-sky-600"
          }
        >
          {getPatientDisplayName(s.patientId, patientNames)}
        </button>
      ),
    },
    {
      key: "surgeryName",
      header: "Surgery",
      render: (s) => s.surgeryName ?? "-",
    },
    {
      key: "roomCode",
      header: "Room",
      render: (s) => s.roomCode ?? "-",
    },
    {
      key: "surgeonId",
      header: "Status",
      className: "w-32",
      render: (s) => employeeNames[s.surgeonId]?.trim() || "Surgeon name unavailable",
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 gap-4">
      {/* ---- 왼쪽: 수술 목록 ---- */}
      <div className="flex min-h-0 w-[52%] min-w-[480px] flex-col gap-3">
        {/*
          수술실과 날짜 조건으로 수술 목록을 좁힌다.

          수술실과 날짜만 받는다. 환자·집도의 칸이 있었지만 식별자(UUID)로만 찾을 수
          있었고, 그 식별자는 화면에 나오지 않아 입력할 방법이 없었다.

          날짜 입력에 lang="en" 을 준 이유 — <input type="date"> 는 브라우저·OS 로캘을
          따라 '2026. 09. 03.' 처럼 그리는데, lang 을 명시하면 Chrome 이 그 언어의
          표기(yyyy-mm-dd)를 쓴다. 화면 문자열을 영어로 맞춘 것과 같은 맥락이다(§12.4).
          브라우저가 만드는 UI 라 우리가 완전히 통제하지는 못한다.
        */}
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 p-3">
          <FormField label="Room" htmlFor="q-room">
            <Input
              id="q-room"
              value={form.roomCode}
              onChange={(e) => setForm({ ...form, roomCode: e.target.value })}
              placeholder="Room code"
            />
          </FormField>
          <FormField label="Date" htmlFor="q-from">
            <div className="flex items-center gap-1">
              <Input
                id="q-from"
                type="date"
                lang="en"
                value={form.fromDt}
                onChange={(e) => setForm({ ...form, fromDt: e.target.value })}
              />
              <span className="text-xs text-slate-400">~</span>
              <Input
                type="date"
                lang="en"
                value={form.toDt}
                onChange={(e) => setForm({ ...form, toDt: e.target.value })}
              />
            </div>
          </FormField>
          <div className="col-span-2 flex justify-end gap-2">
            <Button onClick={handleReset}>Reset</Button>
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Pick a surgery to document it on the right.
          </p>
          <Button onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Actionable only" : "Show all"}
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
              ? "No surgeries match these conditions."
              : "No surgeries to document. A surgery appears here once an order is assigned."
          }
          minWidthClassName="min-w-[560px]"
        />

        {result ? (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {result.totalElements} total
              {!showAll && rows.length !== result.items.length
                ? ` (showing ${rows.length} actionable)`
                : ""}
            </p>
            <Pagination
              page={page}
              totalPages={result.totalPages}
              onPageChange={handlePage}
            />
          </div>
        ) : null}
      </div>

      {/* ---- 오른쪽: 고른 수술의 기록 ---- */}
      <Panel className="min-h-0 flex-1 p-5">
        {!selected ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-400">
            {urlSurgeryMissing
              ? // 방금 배정한 수술은 목록 첫 페이지에 없을 수 있다 — 수술일 기준
                // 정렬이라 오늘 만든 건이 뒤로 밀린다. 조용히 빈 화면을 보여주면
                // 이동이 실패한 것처럼 보이므로 사유를 밝힌다.
                "That surgery is not on this page. Search by its date or room, or turn on Show all."
              : "Select a surgery on the left."}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="flex items-start justify-between gap-4 py-3">
                <div className="flex flex-1 flex-col items-center gap-2 text-center">
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                    {selected.surgeryName ?? "No surgery name"}
                  </h2>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                      STATUS_BADGE_CLASS[selected.statusCd ?? ""] ??
                      "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {STATUS_LABEL[selected.statusCd ?? ""] ?? selected.statusCd}
                  </span>
                  <p className="mt-2 text-base font-medium text-slate-700">
                    Patient {getPatientDisplayName(selected.patientId, patientNames)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {selected.surgeryDt}
                    {selected.roomCode ? ` · ${selected.roomCode}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    disabled={saving || !isScheduled}
                    onClick={() => dispatch(startSurgeryRequest(selected.surgeryId))}
                  >
                    Start surgery
                  </Button>
                  <Button
                    disabled={saving || !isInProgress || !signOutDone}
                    onClick={() => dispatch(endSurgeryRequest(selected.surgeryId))}
                  >
                    End surgery
                  </Button>
                </div>
              </div>

              {isScheduled && cancelOptions.length === 0 ? (
                <p className="text-center text-xs text-amber-600">
                  Failed to load cancellation reason codes. Please check the admin service.
                </p>
              ) : null}

              {/*
                진행중인데 Sign Out 이 안 끝났으면 종료 버튼이 잠겨 있다.
                왜 잠겼는지 적어 두지 않으면 버튼이 고장난 것으로 보인다.
              */}
              {isInProgress && !signOutDone ? (
                <p className="text-center text-xs text-amber-700">
                  Complete the Sign Out checklist before ending the surgery.
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
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
                {tab === "plannedItems" ? (
                  <PlannedItemsPanel
                    key={selected.surgeryId}
                    surgeryId={selected.surgeryId}
                  />
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

            <div className="grid shrink-0 gap-2 border-t border-slate-200 pt-4">
              <Select
                aria-label="Cancellation reason"
                placeholder="Cancellation reason"
                options={cancelOptions}
                value={cancelReasonCd}
                disabled={saving || !isScheduled}
                onChange={(e) => setCancelReasonCd(e.target.value)}
              />
              <Button
                variant="danger"
                disabled={saving || !isScheduled || !cancelReasonCd}
                onClick={() =>
                  dispatch(
                    cancelSurgeryRequest(selected.surgeryId, { cancelReasonCd }),
                  )
                }
                className="w-full"
              >
                <svg
                  aria-hidden="true"
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="9" strokeWidth="2" />
                  <path
                    d="m9 9 6 6m0-6-6 6"
                    strokeLinecap="round"
                    strokeWidth="2"
                  />
                </svg>
                Cancel surgery
              </Button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
