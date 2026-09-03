"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
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
  selectScheduleError,
  selectScheduleLoading,
  selectTodaySurgeries,
} from "@/features/surgery/schedule/slice";

/**
 * 금일 수술 현황 대시보드 (SL2-40)
 *
 * <p>백엔드 {@code GET /api/surgery/schedule/today} 가 오늘 날짜의 수술을 돌려준다.
 * 상태별로 나눠 보여줘, 지금 무엇이 밀려 있고 무엇이 진행 중인지 한눈에 보이게 한다.</p>
 *
 * <p><b>보기 전용이다</b>. 예전에는 시작·종료 버튼을 여기 뒀는데 —
 * "당일에 가장 자주 하는 조작이라 상세까지 들어가지 않아도 되게" 한다는 이유였다 —
 * 배정 상세도 같은 전이를 갖고 있어 한 동작이 두 화면에 흩어져 있었다.
 * 상태를 바꾸는 곳은 그 수술의 상세 하나로 모았다.</p>
 *
 * <p>표·버튼·배지는 components/common 을 쓴다(§12.1).</p>
 *
 * <h3>상태별 건수를 여기서 빼냈다</h3>
 *
 * <p>이 컴포넌트는 이제 수술 홈({@code /surgery}) 안에 들어간다. 홈이 이미
 * 배정 대기·금일 예약·진행중·완료 건수를 카드로 보여주고 있어서, 여기서 또 세면
 * 같은 숫자가 한 화면에 두 번 뜬다. 여기는 <b>목록만</b> 맡는다.</p>
 *
 * <p>취소 건수 카드는 그 과정에서 사라졌다. 취소된 수술은 표에 그대로 남아 있고,
 * 홈에서 세어 보여줄 만큼 자주 보는 숫자는 아니라고 봤다.</p>
 */
export default function TodaySurgeryBoard() {
  const surgeries = useSelector(selectTodaySurgeries);
  const loading = useSelector(selectScheduleLoading);
  const error = useSelector(selectScheduleError);

  /*
    조회는 부모(SurgeryHome)가 한다.

    이 컴포넌트가 직접 부르면 홈이 이미 보낸 것과 같은 요청이 한 번 더 나간다 —
    홈이 같은 selectTodaySurgeries 로 상태별 건수를 세기 때문이다. 단독 화면이던
    시절에는 스스로 받아와야 했지만, 지금은 홈 안에서만 쓰인다.
  */

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
        상태를 바꾸는 버튼(시작·종료)을 걷어냈다.

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
