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
  StatusBadge,
  type DataTableColumn,
} from "@/components/common";
import AnesthesiaRecordPanel from "@/components/surgery/anesthesia/AnesthesiaRecordPanel";
import ChecklistPanel from "@/components/surgery/checklist/ChecklistPanel";
import ConsentPanel from "@/components/surgery/consent/ConsentPanel";
import OperativeRecordPanel from "@/components/surgery/operativeRecord/OperativeRecordPanel";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
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
 * <h3>상태 전이가 여기로 왔다 (2026-08-27)</h3>
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

/** 검색 입력칸의 초기값. "조건 없음"을 빈 문자열로 표현한다 */
const EMPTY_FORM = {
  patientId: "",
  surgeonId: "",
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

  const [selectedId, setSelectedId] = useState<string | null>(null);
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
    if (form.patientId.trim()) params.patientId = form.patientId.trim();
    if (form.surgeonId.trim()) params.surgeonId = form.surgeonId.trim();
    if (form.roomCode.trim()) params.roomCode = form.roomCode.trim();
    if (form.fromDt) params.fromDt = form.fromDt;
    if (form.toDt) params.toDt = form.toDt;
    return params;
  };

  useEffect(() => {
    // 첫 진입은 조건 없이 1페이지
    dispatch(searchSurgeriesRequest({ page: 0, size: 20 }));
  }, [dispatch]);

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

  // 목록이 바뀌어 고른 수술이 사라졌으면 선택을 놓는다(필터를 좁혔을 때 생긴다)
  const selected = rows.find((s) => s.surgeryId === selectedId) ?? null;
  if (selectedId && !selected) {
    setSelectedId(null);
  }

  const isScheduled = selected?.statusCd === SURGERY_STATUS.SCHEDULED;
  const isInProgress = selected?.statusCd === SURGERY_STATUS.IN_PROGRESS;

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
        {/*
          검색 조건 (SL2-312·314 기록지 조회 / SL2-333·334 간호기록 조회)
          환자·집도의는 이름이 아니라 식별자로 찾는다 — 이름은 다른 서비스가 갖고 있어
          우리 DB 에 없다(§21.9). 그래서 부분일치가 아니라 정확일치다.
        */}
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 p-3">
          <FormField label="환자 ID" htmlFor="q-patient">
            <Input
              id="q-patient"
              value={form.patientId}
              onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              placeholder="정확히 일치"
            />
          </FormField>
          <FormField label="집도의 ID" htmlFor="q-surgeon">
            <Input
              id="q-surgeon"
              value={form.surgeonId}
              onChange={(e) => setForm({ ...form, surgeonId: e.target.value })}
              placeholder="정확히 일치"
            />
          </FormField>
          <FormField label="수술실" htmlFor="q-room">
            <Input
              id="q-room"
              value={form.roomCode}
              onChange={(e) => setForm({ ...form, roomCode: e.target.value })}
              placeholder="수술실 코드"
            />
          </FormField>
          <FormField label="수술일" htmlFor="q-from">
            <div className="flex items-center gap-1">
              <Input
                id="q-from"
                type="date"
                value={form.fromDt}
                onChange={(e) => setForm({ ...form, fromDt: e.target.value })}
              />
              <span className="text-xs text-slate-400">~</span>
              <Input
                type="date"
                value={form.toDt}
                onChange={(e) => setForm({ ...form, toDt: e.target.value })}
              />
            </div>
          </FormField>
          <div className="col-span-2 flex justify-end gap-2">
            <Button onClick={handleReset}>초기화</Button>
            <Button onClick={handleSearch}>검색</Button>
          </div>
        </div>

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
              ? "조건에 맞는 수술이 없습니다."
              : "기록을 작성할 수술이 없습니다. 수술 요청을 배정해야 목록에 나타납니다."
          }
          minWidthClassName="min-w-[560px]"
        />

        {result ? (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              전체 {result.totalElements}건
              {!showAll && rows.length !== result.items.length
                ? ` (작업 대상 ${rows.length}건 표시)`
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
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            왼쪽에서 수술을 선택하세요.
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {selected.surgeryName ?? "수술명 미입력"}
                  <span className="ml-2 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-700">
                    {STATUS_LABEL[selected.statusCd ?? ""] ?? selected.statusCd}
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  환자 {selected.patientId} · {selected.surgeryDt}
                  {selected.roomCode ? ` · ${selected.roomCode}` : ""}
                </p>
              </div>

              {/*
                상태 전이 (2026-08-27 배정 상세에서 이관)
                예약 → 진행중 → 완료 한 방향으로만 간다. 취소는 예약에서만.
                백엔드가 같은 규칙으로 막지만(400), 눌러도 오류만 뜨는 버튼을
                열어두면 사용자는 왜 안 되는지 모른 채 헤맨다.
              */}
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  disabled={saving || !isScheduled}
                  onClick={() => dispatch(startSurgeryRequest(selected.surgeryId))}
                >
                  수술 시작
                </Button>
                <Button
                  disabled={saving || !isInProgress}
                  onClick={() => dispatch(endSurgeryRequest(selected.surgeryId))}
                >
                  수술 종료
                </Button>

                {/*
                  취소 사유는 필수다(SL2-178) — 고르지 않으면 버튼이 잠긴다.
                  백엔드 @NotBlank 가 400 으로 막으므로 화면에서 먼저 거른다.
                */}
                {/* Select 자체가 w-full 이라 폭은 감싸는 쪽에서 준다 */}
                <div className="w-36">
                  <Select
                    aria-label="취소 사유"
                    placeholder="취소 사유"
                    options={cancelOptions}
                    value={cancelReasonCd}
                    disabled={saving || !isScheduled}
                    onChange={(e) => setCancelReasonCd(e.target.value)}
                  />
                </div>
                <Button
                  disabled={saving || !isScheduled || !cancelReasonCd}
                  onClick={() =>
                    dispatch(
                      cancelSurgeryRequest(selected.surgeryId, { cancelReasonCd }),
                    )
                  }
                >
                  수술 취소
                </Button>
              </div>
            </div>

            {isScheduled && cancelOptions.length === 0 ? (
              <p className="text-xs text-amber-600">
                취소 사유 코드를 불러오지 못했습니다. admin 서비스를 확인하세요.
              </p>
            ) : null}

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
