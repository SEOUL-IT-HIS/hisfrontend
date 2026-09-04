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
import SurgeryScheduleDetail from "@/components/surgery/schedule/SurgeryScheduleDetail";
import { usePatientNames } from "@/features/surgery/common/usePatientNames";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import {
  SURGERY_STATUS,
  type Surgery,
  type SurgerySearchParams,
} from "@/features/surgery/schedule/types";
import {
  searchSurgeriesRequest,
  selectScheduleError,
  selectScheduleLoading,
  selectSurgerySearchParams,
  selectSurgerySearchResult,
} from "@/features/surgery/schedule/slice";

/**
 * 수술 배정 관리 — 마스터-디테일
 *
 * <h3>왜 구조를 바꿨나</h3>
 *
 * <p>예전에는 {@code /surgery/schedule} 이 <b>전체 일정 표</b>만 보여주고, 배정하려면
 * '상세' 링크를 눌러 {@code /surgery/schedule/detail/[surgeryId]} 로 <b>페이지를 옮겨야</b>
 * 했다. 수술실을 몇 건 연달아 배정하려면 목록 → 상세 → 뒤로 → 목록 을 반복하게 되고,
 * 뒤로 갈 때마다 스크롤 위치도 잃었다.</p>
 *
 * <p>수술 업무 화면({@code SurgeryWorklist})이 같은 문제를 마스터-디테일로 풀었다.
 * 왼쪽에서 고르면 오른쪽이 따라오고, 다음 건은 왼쪽에서 바로 고른다. 한 서비스 안에서
 * 목록-상세 구조가 화면마다 다를 이유가 없어 그쪽에 맞췄다.</p>
 *
 * <h3>오른쪽은 기존 상세를 그대로 쓴다</h3>
 *
 * <p>{@code SurgeryScheduleDetail} 을 복사하지 않고 그대로 끼운다. 배정 규칙(예약에서만
 * 수정, 집도의는 비울 수 없음)이 한 군데에만 있어야 두 경로가 갈라지지 않는다.
 * {@code /surgery/schedule/detail/[surgeryId]} 라우트도 그대로 둔다 — 다른 화면에서
 * 특정 수술로 바로 들어오는 길이고, 링크를 주고받을 수도 있다.</p>
 *
 * <h3>상태 기본값이 '예약'인 이유</h3>
 *
 * <p>배정을 고칠 수 있는 상태가 예약(01)뿐이다. 전체를 기본으로 두면 손댈 수 없는 행이
 * 대부분인 목록을 보게 된다. 지난 건을 확인할 일은 있어서 다른 상태로 넘길 수는 있다.</p>
 */

/**
 * 검색 입력칸의 초기값. "조건 없음"을 빈 문자열로 표현한다.
 *
 * <p><b>환자·집도의 칸을 걷어냈다</b>(수술 업무 화면과 같은 이유다). 둘 다
 * 식별자(UUID)로만 찾을 수 있었는데 그 식별자가 화면 어디에도 나오지 않는다 —
 * 목록의 환자 열은 이제 이름을 띄우고, 집도의는 애초에 열이 없다. 사용자가 넣을
 * 값을 알 수 없는 검색칸이었다.</p>
 *
 * <p>백엔드 {@code patientId}·{@code surgeonId} 파라미터는 그대로 살아 있으니,
 * 이름으로 찾는 방법이 생기면 그때 다시 붙이면 된다.</p>
 *
 * <p>상태(statusCd)는 남긴다 — 셀렉트라 고를 값이 화면에 다 보이고, 이 화면에서
 * 배정을 고칠 수 있는 상태가 예약(01)뿐이라 거르는 의미가 크다.</p>
 */
const EMPTY_FORM = {
  roomCode: "",
  fromDt: "",
  toDt: "",
};

const STATUS_LABEL: Record<string, string> = {
  [SURGERY_STATUS.SCHEDULED]: "Scheduled",
  [SURGERY_STATUS.IN_PROGRESS]: "In progress",
  [SURGERY_STATUS.COMPLETED]: "Completed",
  [SURGERY_STATUS.CANCELLED]: "Cancelled",
};

const STATUS_OPTIONS = [
  { value: SURGERY_STATUS.SCHEDULED, label: "Scheduled" },
  { value: SURGERY_STATUS.IN_PROGRESS, label: "In progress" },
  { value: SURGERY_STATUS.COMPLETED, label: "Completed" },
  { value: SURGERY_STATUS.CANCELLED, label: "Cancelled" },
];

export default function SurgeryAssignmentBoard() {
  const dispatch = useDispatch<AppDispatch>();
  const result = useSelector(selectSurgerySearchResult);
  const lastParams = useSelector(selectSurgerySearchParams);
  const loading = useSelector(selectScheduleLoading);
  const error = useSelector(selectScheduleError);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [statusCd, setStatusCd] = useState<string>(SURGERY_STATUS.SCHEDULED);

  // 공통 Pagination 은 1-base, 백엔드 Pageable 은 0-base 다
  const [page, setPage] = useState(1);

  /** 폼 + 페이지를 검색 파라미터로 만든다. 빈 칸은 아예 빼서 조건 없음으로 둔다 */
  const buildParams = (p: number): SurgerySearchParams => {
    const params: SurgerySearchParams = { page: p - 1, size: 20 };
    if (form.roomCode.trim()) params.roomCode = form.roomCode.trim();
    if (statusCd) params.statusCd = statusCd;
    if (form.fromDt) params.fromDt = form.fromDt;
    if (form.toDt) params.toDt = form.toDt;
    return params;
  };

  useEffect(() => {
    // 첫 진입은 예약(01) 건만 — 배정을 고칠 수 있는 상태다
    dispatch(
      searchSurgeriesRequest({
        page: 0,
        size: 20,
        statusCd: SURGERY_STATUS.SCHEDULED,
      }),
    );
  }, [dispatch]);

  function handleSearch() {
    setPage(1);
    setSelectedId(null);
    dispatch(searchSurgeriesRequest(buildParams(1)));
  }

  function handleReset() {
    setForm(EMPTY_FORM);
    setStatusCd(SURGERY_STATUS.SCHEDULED);
    setPage(1);
    setSelectedId(null);
    dispatch(
      searchSurgeriesRequest({
        page: 0,
        size: 20,
        statusCd: SURGERY_STATUS.SCHEDULED,
      }),
    );
  }

  function handlePage(next: number) {
    setPage(next);
    setSelectedId(null);
    // 마지막 조건을 그대로 쓴다 — 폼을 고치다 만 상태여도 보고 있던 결과가 유지된다
    dispatch(searchSurgeriesRequest({ ...lastParams, page: next - 1 }));
  }

  /**
   * 상태는 <b>서버가</b> 거른다.
   *
   * <p>{@code GET /assignments} 가 statusCd 파라미터를 받는다. 화면에서 거르면 한
   * 페이지(20건) 안에서만 걸러져 "전체 40건인데 예약은 3건"처럼 페이지마다 표시 수가
   * 들쭉날쭉해지고, 총 건수도 맞지 않는다.</p>
   */
  const rows = result?.items ?? [];

  // 목록이 바뀌어 고른 수술이 사라졌으면 선택을 놓는다
  const selected = rows.find((s) => s.surgeryId === selectedId) ?? null;
  if (selectedId && !selected) {
    setSelectedId(null);
  }

  // 지금 보이는 행들의 환자명. rows 가 바뀔 때만 다시 부른다(훅 안에서 키로 거른다).
  const { names: patientNames } = usePatientNames(rows.map((s) => s.patientId));

  const columns: DataTableColumn<Surgery>[] = [
    { key: "surgeryDt", header: "Date", render: (s) => s.surgeryDt },
    {
      key: "patientId",
      header: "Patient",
      /*
        행 선택은 환자 클릭으로 한다 — 공통 DataTable 이 행 클릭을 지원하지 않는다.

        표시는 이름이다. SURGERY 테이블은 patient_id 만 갖고 있어서(§14.1 스냅샷 금지)
        예전에는 UUID 를 그대로 띄웠는데, 사람이 알아볼 수 없는 값이라 목록으로서
        의미가 없었다. 못 불러오면 ID 로 되돌아간다 — 이름은 표시용이라
        patient-service 가 죽어도 배정 업무는 계속돼야 한다.
      */
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
          {patientNames[s.patientId] ?? s.patientId}
        </button>
      ),
    },
    { key: "surgeryName", header: "Surgery", render: (s) => s.surgeryName ?? "-" },
    {
      key: "roomCode",
      header: "Room",
      // 배정 화면이므로 미배정을 눈에 띄게 둔다 — 여기서 채워야 할 값이다
      render: (s) =>
        s.roomCode ?? <span className="text-amber-600">Unassigned</span>,
    },
    {
      key: "statusCd",
      header: "Status",
      render: (s) => (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600">
            {STATUS_LABEL[s.statusCd ?? ""] ?? s.statusCd}
          </span>
          {s.emergencyYn === "Y" ? (
            <StatusBadge value="Y" activeLabel="Emergency" />
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 gap-4">
      {/* ---- 왼쪽: 수술 목록 ---- */}
      <div className="flex min-h-0 w-[46%] min-w-[440px] flex-col gap-3">
        {/*
          수술실·상태·날짜만 받는다. 환자·집도의 칸이 있었지만 식별자(UUID)로만 찾을 수
          있었고, 그 식별자는 화면 어디에도 나오지 않아 입력할 방법이 없었다.

          날짜 입력에 lang="en" 을 준 이유 — <input type="date"> 는 브라우저·OS 로캘을
          따라 '2026. 09. 03.' 처럼 그리는데, lang 을 명시하면 Chrome 이 그 언어의
          표기(yyyy-mm-dd)를 쓴다. 브라우저가 만드는 UI 라 완전히 통제하지는 못한다.
        */}
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 p-3">
          <FormField label="Room" htmlFor="s-room">
            <Input
              id="s-room"
              value={form.roomCode}
              onChange={(e) => setForm({ ...form, roomCode: e.target.value })}
              placeholder="Room code"
            />
          </FormField>
          <FormField label="Status" htmlFor="s-status">
            <Select
              id="s-status"
              placeholder="All"
              options={STATUS_OPTIONS}
              value={statusCd}
              onChange={(e) => {
                // 상태는 고르는 즉시 다시 읽는다 — 다른 조건과 달리 "검색" 을 또
                // 누르게 하면, 목록은 그대로인데 셀렉트만 바뀌어 있어 헷갈린다.
                const next = e.target.value;
                setStatusCd(next);
                setSelectedId(null);
                setPage(1);
                dispatch(
                  searchSurgeriesRequest({
                    ...buildParams(1),
                    statusCd: next || undefined,
                  }),
                );
              }}
            />
          </FormField>
          <FormField label="Date" htmlFor="s-from">
            <div className="flex items-center gap-1">
              <Input
                id="s-from"
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

        <p className="text-xs text-slate-500">
          Pick a surgery to work on its assignment on the right.
        </p>

        {error ? <Alert>{resolveSurgeryMessage(error)}</Alert> : null}

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(s) => s.surgeryId}
          loading={loading}
          emptyMessage={
            statusCd === SURGERY_STATUS.SCHEDULED
              ? "No scheduled surgeries. A surgery appears here once a pending order is assigned."
              : "No surgeries match these conditions."
          }
          minWidthClassName="min-w-[560px]"
        />

        {result ? (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {statusCd ? `${STATUS_LABEL[statusCd]} ` : "All "}
              {result.totalElements} total
            </p>
            <Pagination
              page={page}
              totalPages={result.totalPages}
              onPageChange={handlePage}
            />
          </div>
        ) : null}
      </div>

      {/* ---- 오른쪽: 고른 수술의 배정 ---- */}
      <Panel className="min-h-0 flex-1 overflow-auto p-5">
        {!selected ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Select a surgery on the left.
          </div>
        ) : (
          // key 로 수술마다 새로 마운트한다 — 상세가 들고 있는 배정 입력값이
          // 이전 수술 것으로 남으면 엉뚱한 수술에 저장될 수 있다
          <SurgeryScheduleDetail
            key={selected.surgeryId}
            surgeryId={selected.surgeryId}
          />
        )}
      </Panel>
    </div>
  );
}
