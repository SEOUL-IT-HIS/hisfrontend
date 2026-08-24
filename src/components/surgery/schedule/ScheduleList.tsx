"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  Alert,
  DataTable,
  StatusBadge,
  type DataTableColumn,
} from "@/components/common";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import type { Surgery } from "@/features/surgery/schedule/types";
import {
  fetchSurgeriesRequest,
  selectScheduleError,
  selectScheduleLoading,
  selectSurgeries,
} from "@/features/surgery/schedule/slice";

/**
 * 수술 일정 목록 (SL2-25)
 *
 * <p>환자명·집도의명은 표시하지 않고 식별자만 보여준다. 이름은 수술 서비스가 소유하지
 * 않는 데이터라 저장하지 않으며(§14.1), 표시하려면 환자·직원 서비스 API 를 별도로
 * 호출해야 한다(§21.9). 해당 연동은 타 팀과 스펙 협의 후 붙인다.</p>
 *
 * <p>표는 components/common 의 DataTable 을 쓴다(§12.1). 로딩·빈 목록 문구도
 * DataTable 이 처리하므로 화면에서 조기 return 하지 않는다 — 그래야 목록이 비어도
 * 표 머리가 남아 어떤 항목을 보는 화면인지 알 수 있다.</p>
 */
export default function ScheduleList() {
  const dispatch = useDispatch<AppDispatch>();
  const surgeries = useSelector(selectSurgeries);
  const loading = useSelector(selectScheduleLoading);
  const error = useSelector(selectScheduleError);

  useEffect(() => {
    dispatch(fetchSurgeriesRequest());
  }, [dispatch]);

  const columns: DataTableColumn<Surgery>[] = [
    { key: "surgeryDt", header: "수술일", render: (s) => s.surgeryDt },
    { key: "surgeryName", header: "수술명", render: (s) => s.surgeryName ?? "-" },
    { key: "patientId", header: "환자ID", render: (s) => s.patientId },
    { key: "surgeonId", header: "집도의ID", render: (s) => s.surgeonId },
    { key: "roomCode", header: "수술실", render: (s) => s.roomCode ?? "-" },
    { key: "statusCd", header: "상태", render: (s) => s.statusCd },
    {
      key: "emergencyYn",
      header: "응급",
      // StatusBadge 는 Y/N 을 받아 색을 입힌다. 라벨만 업무 용어로 바꿔 쓴다.
      render: (s) => (
        <StatusBadge
          value={s.emergencyYn}
          activeLabel="응급"
          inactiveLabel="일반"
        />
      ),
    },
    {
      key: "actions",
      header: "기록",
      // 마취기록·수술기록지는 수술 상세 화면에서 다룬다
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
    <div className="flex flex-col gap-3">
      {error ? <Alert>{resolveSurgeryMessage(error)}</Alert> : null}

      <DataTable
        columns={columns}
        rows={surgeries}
        rowKey={(s) => s.surgeryId}
        loading={loading}
        emptyMessage="수술 일정이 없습니다."
        minWidthClassName="min-w-[880px]"
      />
    </div>
  );
}
