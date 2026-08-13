"use client";

import { useEffect } from "react";
import Link from "next/link";
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
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import type { Surgery } from "@/features/surgery/schedule/types";
import {
  endSurgeryRequest,
  fetchTodaySurgeriesRequest,
  selectScheduleError,
  selectScheduleLoading,
  selectScheduleSaving,
  selectTodaySurgeries,
  startSurgeryRequest,
} from "@/features/surgery/schedule/slice";
import { SURGERY_STATUS } from "@/features/surgery/schedule/types";

/**
 * 금일 수술 현황 대시보드 (SL2-40)
 *
 * <p>백엔드 {@code GET /api/surgery/schedule/today} 가 오늘 날짜의 수술을 돌려준다.
 * 상태별로 나눠 보여줘, 지금 무엇이 밀려 있고 무엇이 진행 중인지 한눈에 보이게 한다.</p>
 *
 * <p>여기서 시작·종료 버튼을 두는 이유 — 수술 당일에 가장 자주 하는 조작이라
 * 상세 화면까지 들어가지 않고 바로 누를 수 있어야 한다. 상태 전이 규칙은
 * 백엔드가 검증하므로 잘못된 순서로 눌러도 안전하다(SL2-281 전이 검증).</p>
 *
 * <p>표·패널·버튼·배지는 components/common 을 쓴다(§12.1).</p>
 *
 * <p><b>건수를 화면에서 세는 것에 대해</b> — 백엔드에
 * {@code GET /api/surgery/monitoring/status/today} 가 생겨 같은 집계를 서버가 내려준다.
 * 다만 이 화면은 목록을 어차피 받아오므로 지금은 받은 것을 센다. 집계 규칙(취소 포함
 * 여부 등)이 화면마다 갈라지기 시작하면 그때 서버 값으로 바꾼다.</p>
 */
export default function TodaySurgeryBoard() {
  const dispatch = useDispatch<AppDispatch>();
  const surgeries = useSelector(selectTodaySurgeries);
  const loading = useSelector(selectScheduleLoading);
  const saving = useSelector(selectScheduleSaving);
  const error = useSelector(selectScheduleError);

  useEffect(() => {
    dispatch(fetchTodaySurgeriesRequest());
  }, [dispatch]);

  // 상태별 건수 — 코드값을 직접 세지 않고 상수를 쓴다(오타를 컴파일러가 잡도록)
  const countOf = (status: string) =>
    surgeries.filter((s) => s.statusCd === status).length;

  const summary = [
    { label: "예약", code: SURGERY_STATUS.SCHEDULED },
    { label: "진행중", code: SURGERY_STATUS.IN_PROGRESS },
    { label: "완료", code: SURGERY_STATUS.COMPLETED },
    { label: "취소", code: SURGERY_STATUS.CANCELLED },
  ];

  const columns: DataTableColumn<Surgery>[] = [
    { key: "surgeryName", header: "수술명", render: (s) => s.surgeryName ?? "-" },
    { key: "patientId", header: "환자ID", render: (s) => s.patientId },
    { key: "roomCode", header: "수술실", render: (s) => s.roomCode ?? "미배정" },
    { key: "statusCd", header: "상태", render: (s) => s.statusCd },
    {
      key: "emergencyYn",
      header: "응급",
      render: (s) => (
        <StatusBadge
          value={s.emergencyYn}
          activeLabel="응급"
          inactiveLabel="일반"
        />
      ),
    },
    { key: "actualStartDt", header: "시작", render: (s) => s.actualStartDt ?? "-" },
    { key: "actualEndDt", header: "종료", render: (s) => s.actualEndDt ?? "-" },
    {
      key: "actions",
      header: "조작",
      // 예약(01)이면 시작, 진행중(02)이면 종료만 노출한다
      render: (s) => {
        if (s.statusCd === SURGERY_STATUS.SCHEDULED) {
          return (
            <Button
              disabled={saving}
              className="h-8 px-3 text-xs"
              onClick={() => dispatch(startSurgeryRequest(s.surgeryId))}
            >
              시작
            </Button>
          );
        }
        if (s.statusCd === SURGERY_STATUS.IN_PROGRESS) {
          return (
            <Button
              variant="secondary"
              disabled={saving}
              className="h-8 px-3 text-xs"
              onClick={() => dispatch(endSurgeryRequest(s.surgeryId))}
            >
              종료
            </Button>
          );
        }
        return <span className="text-xs text-slate-400">-</span>;
      },
    },
    {
      key: "detail",
      header: "상세",
      render: (s) => (
        <Link
          href={`/surgery/schedule/detail/${s.surgeryId}`}
          className="text-sky-600 underline"
        >
          상세
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {error ? <Alert>{resolveSurgeryMessage(error)}</Alert> : null}

      <div className="flex flex-wrap gap-3">
        {summary.map((s) => (
          <Panel key={s.code} className="px-4 py-3 text-center">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="text-lg font-semibold text-slate-800">
              {countOf(s.code)}
            </p>
          </Panel>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={surgeries}
        rowKey={(s) => s.surgeryId}
        loading={loading}
        emptyMessage="금일 예정된 수술이 없습니다."
        minWidthClassName="min-w-[960px]"
      />
    </div>
  );
}
