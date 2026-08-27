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
 * 수술 배정 관리 — 마스터-디테일 (2026-08-27)
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

/** 검색 입력칸의 초기값. "조건 없음"을 빈 문자열로 표현한다 */
const EMPTY_FORM = {
  patientId: "",
  surgeonId: "",
  roomCode: "",
  fromDt: "",
  toDt: "",
};

const STATUS_LABEL: Record<string, string> = {
  [SURGERY_STATUS.SCHEDULED]: "예약",
  [SURGERY_STATUS.IN_PROGRESS]: "진행중",
  [SURGERY_STATUS.COMPLETED]: "완료",
  [SURGERY_STATUS.CANCELLED]: "취소",
};

const STATUS_OPTIONS = [
  { value: SURGERY_STATUS.SCHEDULED, label: "예약" },
  { value: SURGERY_STATUS.IN_PROGRESS, label: "진행중" },
  { value: SURGERY_STATUS.COMPLETED, label: "완료" },
  { value: SURGERY_STATUS.CANCELLED, label: "취소" },
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
    if (form.patientId.trim()) params.patientId = form.patientId.trim();
    if (form.surgeonId.trim()) params.surgeonId = form.surgeonId.trim();
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

  const columns: DataTableColumn<Surgery>[] = [
    { key: "surgeryDt", header: "수술일", render: (s) => s.surgeryDt },
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
    { key: "surgeryName", header: "수술명", render: (s) => s.surgeryName ?? "-" },
    {
      key: "roomCode",
      header: "수술실",
      // 배정 화면이므로 미배정을 눈에 띄게 둔다 — 여기서 채워야 할 값이다
      render: (s) =>
        s.roomCode ?? <span className="text-amber-600">미배정</span>,
    },
    {
      key: "statusCd",
      header: "상태",
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
      <div className="flex min-h-0 w-[46%] min-w-[440px] flex-col gap-3">
        {/*
          환자·집도의는 이름이 아니라 식별자로 찾는다 — 이름은 다른 서비스가 갖고 있어
          우리 DB 에 없다(§21.9). 그래서 부분일치가 아니라 정확일치다.
        */}
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 p-3">
          <FormField label="환자 ID" htmlFor="s-patient">
            <Input
              id="s-patient"
              value={form.patientId}
              onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              placeholder="정확히 일치"
            />
          </FormField>
          <FormField label="집도의 ID" htmlFor="s-surgeon">
            <Input
              id="s-surgeon"
              value={form.surgeonId}
              onChange={(e) => setForm({ ...form, surgeonId: e.target.value })}
              placeholder="정확히 일치"
            />
          </FormField>
          <FormField label="수술실" htmlFor="s-room">
            <Input
              id="s-room"
              value={form.roomCode}
              onChange={(e) => setForm({ ...form, roomCode: e.target.value })}
              placeholder="수술실 코드"
            />
          </FormField>
          <FormField label="상태" htmlFor="s-status">
            <Select
              id="s-status"
              placeholder="전체"
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
          <FormField label="수술일" htmlFor="s-from">
            <div className="flex items-center gap-1">
              <Input
                id="s-from"
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

        <p className="text-xs text-slate-500">
          수술을 고르면 오른쪽에서 배정을 이어서 처리합니다.
        </p>

        {error ? <Alert>{resolveSurgeryMessage(error)}</Alert> : null}

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(s) => s.surgeryId}
          loading={loading}
          emptyMessage={
            statusCd === SURGERY_STATUS.SCHEDULED
              ? "예약 상태인 수술이 없습니다. 배정 대기 목록에서 요청을 배정해야 나타납니다."
              : "조건에 맞는 수술이 없습니다."
          }
          minWidthClassName="min-w-[560px]"
        />

        {result ? (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {statusCd ? `${STATUS_LABEL[statusCd]} ` : "전체 "}
              {result.totalElements}건
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
            왼쪽에서 수술을 선택하세요.
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
