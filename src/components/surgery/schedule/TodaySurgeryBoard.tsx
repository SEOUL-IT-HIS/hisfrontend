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
  fetchTodaySurgeriesRequest,
  selectScheduleError,
  selectScheduleLoading,
  selectTodaySurgeries,
} from "@/features/surgery/schedule/slice";
import { SURGERY_STATUS } from "@/features/surgery/schedule/types";

/**
 * 금일 수술 현황 대시보드 (SL2-40)
 *
 * <p>백엔드 {@code GET /api/surgery/schedule/today} 가 오늘 날짜의 수술을 돌려준다.
 * 상태별로 나눠 보여줘, 지금 무엇이 밀려 있고 무엇이 진행 중인지 한눈에 보이게 한다.</p>
 *
 * <p><b>보기 전용이다</b>(2026-08-26). 예전에는 시작·종료 버튼을 여기 뒀는데 —
 * "당일에 가장 자주 하는 조작이라 상세까지 들어가지 않아도 되게" 한다는 이유였다 —
 * 배정 상세도 같은 전이를 갖고 있어 한 동작이 두 화면에 흩어져 있었다.
 * 상태를 바꾸는 곳은 그 수술의 상세 하나로 모았다.</p>
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
      key: "detail",
      header: "처리",
      /*
        상태를 바꾸는 버튼(시작·종료)을 걷어냈다(2026-08-26).

        모니터링은 "지금 수술실이 어떻게 돌아가는지 보는" 화면인데 상태 전이까지
        갖고 있어서 배정 상세와 같은 일을 두 곳에서 하고 있었다. 둘 다
        startSurgeryRequest·endSurgeryRequest 를 dispatch 했다.

        더 곤란한 것은 SL2-217 이후다 — 동의서가 없으면 시작이 400 으로 막히는데,
        여기서 누르면 왜 막혔는지 알 수 없다. 동의서는 수술 업무 화면에 있다.
        상태를 바꿀 곳은 그 수술의 상세 한 곳으로 모은다.
      */
      render: (s) => (
        <Link href={`/surgery/schedule/detail/${s.surgeryId}`}>
          <Button variant="secondary" className="h-8 px-3 text-xs">
            상세 · 처리
          </Button>
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
