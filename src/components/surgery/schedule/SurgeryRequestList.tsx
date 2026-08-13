"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  Alert,
  Button,
  DataTable,
  StatusBadge,
  type DataTableColumn,
} from "@/components/common";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import type { Surgery } from "@/features/surgery/schedule/types";
import {
  cancelSurgeryRequest,
  fetchSurgeryRequestsRequest,
  selectScheduleError,
  selectScheduleLoading,
  selectScheduleSaving,
  selectSurgeryRequests,
} from "@/features/surgery/schedule/slice";

/**
 * 수술 요청 대기 목록 (요청접수 00)
 *
 * <p>진료(일반)와 응급실(응급)에서 올라온 요청 중 아직 수술실이 잡히지 않은 건이다.
 * 수술실 담당자가 배정하면 예약(01)이 되어 이 목록에서 빠진다. 응급 건이 위로 오도록
 * 백엔드가 정렬해 내려주므로 화면에서 다시 정렬하지 않는다.</p>
 *
 * <p>환자명·집도의명을 표시하지 않는 이유 — 환자·직원 서비스가 소유한 데이터라 수술이
 * 저장하지 않으며(§14.1), 표시하려면 각 서비스 API 를 호출해야 한다(§21.9).</p>
 *
 * <p>여기서의 취소는 업무상 '반려'다. 행을 지우지 않고 취소(04) 상태로 전이시킨다(§21.6).</p>
 *
 * <p>표·배지·버튼은 components/common 을 쓴다(§12.1). 응급 구분은 직접 만든 뱃지 대신
 * StatusBadge 를 쓴다 — 색과 모양이 다른 서비스 목록과 같아진다.</p>
 */
export default function SurgeryRequestList() {
  const dispatch = useDispatch<AppDispatch>();
  const requests = useSelector(selectSurgeryRequests);
  const loading = useSelector(selectScheduleLoading);
  const saving = useSelector(selectScheduleSaving);
  const error = useSelector(selectScheduleError);

  useEffect(() => {
    dispatch(fetchSurgeryRequestsRequest());
  }, [dispatch]);

  const columns: DataTableColumn<Surgery>[] = [
    {
      key: "emergencyYn",
      header: "구분",
      render: (s) => (
        <StatusBadge
          value={s.emergencyYn}
          activeLabel="응급"
          inactiveLabel="일반"
        />
      ),
    },
    { key: "surgeryDt", header: "희망 수술일", render: (s) => s.surgeryDt },
    { key: "surgeryName", header: "수술명", render: (s) => s.surgeryName ?? "-" },
    { key: "patientId", header: "환자ID", render: (s) => s.patientId },
    { key: "surgeonId", header: "집도의ID", render: (s) => s.surgeonId },
    {
      key: "roomCode",
      header: "희망 수술실",
      // 진료가 희망 수술실을 지정했더라도 확정은 배정 단계에서 한다
      render: (s) => s.roomCode ?? "-",
    },
    {
      key: "createdAt",
      header: "요청일시",
      render: (s) => s.createdAt?.slice(0, 10) ?? "-",
    },
    {
      key: "actions",
      header: "처리",
      render: (s) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/surgery/schedule/assign/${s.surgeryId}`}
            className="text-sky-600 underline"
          >
            배정
          </Link>
          <Button
            variant="ghost"
            disabled={saving}
            className="h-8 px-2"
            onClick={() => {
              // 사유 코드는 SURGERY_CANCEL_CD 등록 후 선택 UI 로 교체한다
              dispatch(cancelSurgeryRequest(s.surgeryId));
            }}
          >
            반려
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {error ? <Alert>{resolveSurgeryMessage(error)}</Alert> : null}

      <DataTable
        columns={columns}
        rows={requests}
        rowKey={(s) => s.surgeryId}
        loading={loading}
        emptyMessage="배정 대기 중인 요청이 없습니다."
        minWidthClassName="min-w-[920px]"
      />
    </div>
  );
}
