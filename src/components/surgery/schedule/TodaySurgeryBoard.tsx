"use client";

import { useSelector } from "react-redux";
import {
  Alert,
  Button,
  DataTable,
  StatusBadge,
  type DataTableColumn,
} from "@/components/common";
import { usePatientNames } from "@/features/surgery/common/usePatientNames";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import type { Surgery } from "@/features/surgery/schedule/types";
import { SURGERY_STATUS } from "@/features/surgery/schedule/types";
import type { SurgeryOrder } from "@/features/surgery/order/types";
import {
  selectScheduleError,
  selectScheduleLoading,
  selectTodaySurgeries,
} from "@/features/surgery/schedule/slice";
import { selectSurgeryOrders } from "@/features/surgery/order/slice";

type Props = {
  /** 배정 대기 오더의 Assign 을 눌렀을 때. 홈이 배정 폼을 띄운다 */
  onAssign: (orderId: string) => void;
  /** 배정된 수술을 눌렀을 때. 홈이 수술 업무로 넘긴다 */
  onOpen: (surgeryId: string) => void;
};

/**
 * 금일 수술 현황 + 배정 대기 (SL2-40)
 *
 * <h3>두 목록을 한 표에 세운 이유</h3>
 *
 * <p>배정 대기 건수는 홈 맨 위 카드에 있었고, 그 내역으로 가려면 사이드바나
 * 바로가기를 눌러 다른 화면으로 나가야 했다. 금일 수술은 이 표에 있었다.
 * 그래서 <b>"오늘 뭘 해야 하나"를 보려면 두 군데를 봐야 했다</b> — 숫자는 여기,
 * 내역은 저기.</p>
 *
 * <p>이제 한 표다. 아직 배정 안 된 요청이 위에 오고 그 아래 오늘 잡힌 수술이
 * 온다. 할 일이 남은 것부터 보이는 순서다.</p>
 *
 * <h3>오더와 수술을 섞는 것에 대해</h3>
 *
 * <p>둘은 다른 것이다 — 오더는 진료가 보낸 <b>요청</b>이고, 수술은 그 요청을 받아
 * 만들어진 <b>일정</b>이다. 타입도 다르고 갖는 필드도 다르다.</p>
 *
 * <p>그래도 한 표에 세운 것은 사용자가 보는 단위가 "오늘 이 환자에게 할 일"
 * 하나이기 때문이다. 대신 코드에서는 {@link Row} 로 한 겹 덮어 둘을 같은 모양으로
 * 만들고, 원본은 {@code kind} 로 구분한다. 표가 오더인지 수술인지 몰라도 되게 한다.</p>
 *
 * <p>Action 칸이 둘을 가르는 유일한 자리다 — 대기 건은 Assign(배정 폼을 연다),
 * 배정된 건은 Open(수술 업무로 넘어간다).</p>
 */

/** 표 한 줄. 오더와 수술을 같은 모양으로 덮어 둔다 */
type Row = {
  /** DataTable 의 rowKey. 오더와 수술의 ID 가 겹칠 일은 없지만 접두어로 확실히 갈라둔다 */
  key: string;
  kind: "order" | "surgery";
  /** 배정 폼·수술 업무로 넘길 때 쓰는 원본 식별자 */
  id: string;
  patientId: string;
  surgeryName: string | null;
  /** 오더는 희망일, 수술은 확정일 */
  date: string;
  roomCode: string | null;
  emergencyYn: string;
  statusLabel: string;
  actualStartDt: string | null;
  actualEndDt: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  [SURGERY_STATUS.SCHEDULED]: "Scheduled",
  [SURGERY_STATUS.IN_PROGRESS]: "In progress",
  [SURGERY_STATUS.COMPLETED]: "Completed",
  [SURGERY_STATUS.CANCELLED]: "Cancelled",
};

export default function TodaySurgeryBoard({ onAssign, onOpen }: Props) {
  const surgeries = useSelector(selectTodaySurgeries);
  const orders = useSelector(selectSurgeryOrders);
  const loading = useSelector(selectScheduleLoading);
  const error = useSelector(selectScheduleError);

  /*
    조회는 부모(SurgeryHome)가 한다 — 금일 수술과 배정 대기 오더 둘 다.

    이 컴포넌트가 직접 부르면 홈이 이미 보낸 것과 같은 요청이 한 번 더 나간다.
    홈은 같은 두 목록으로 상단 건수 카드를 센다.
  */

  const orderRows: Row[] = orders.map((o: SurgeryOrder) => ({
    key: `order:${o.orderId}`,
    kind: "order",
    id: o.orderId,
    patientId: o.patientId,
    surgeryName: o.surgeryName,
    date: o.requestedDt,
    roomCode: null,
    emergencyYn: o.emergencyYn,
    statusLabel: "Awaiting assignment",
    actualStartDt: null,
    actualEndDt: null,
  }));

  const surgeryRows: Row[] = surgeries.map((s: Surgery) => ({
    key: `surgery:${s.surgeryId}`,
    kind: "surgery",
    id: s.surgeryId,
    patientId: s.patientId,
    surgeryName: s.surgeryName,
    date: s.surgeryDt,
    roomCode: s.roomCode,
    emergencyYn: s.emergencyYn,
    statusLabel: STATUS_LABEL[s.statusCd ?? ""] ?? (s.statusCd ?? "-"),
    actualStartDt: s.actualStartDt,
    actualEndDt: s.actualEndDt,
  }));

  // 아직 손대지 않은 요청이 먼저 온다 — 오늘 처리해야 할 것부터 보인다
  const rows = [...orderRows, ...surgeryRows];

  const { names: patientNames } = usePatientNames(rows.map((r) => r.patientId));

  const columns: DataTableColumn<Row>[] = [
    { key: "surgeryName", header: "Surgery", render: (r) => r.surgeryName ?? "-" },
    // 환자는 이름으로 보여준다 — 두 테이블 다 patient_id 만 갖고 있어서(§14.1)
    // 예전에는 UUID 가 그대로 떴다. 못 불러오면 ID 로 되돌아간다.
    {
      key: "patientId",
      header: "Patient",
      render: (r) => patientNames[r.patientId] ?? r.patientId,
    },
    { key: "date", header: "Date", render: (r) => r.date },
    { key: "roomCode", header: "Room", render: (r) => r.roomCode ?? "Unassigned" },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <span
          className={
            r.kind === "order" ? "text-xs text-amber-700" : "text-xs text-slate-600"
          }
        >
          {r.statusLabel}
        </span>
      ),
    },
    {
      key: "emergencyYn",
      header: "Emergency",
      render: (r) => (
        <StatusBadge
          value={r.emergencyYn}
          activeLabel="Emergency"
          inactiveLabel="Routine"
        />
      ),
    },
    { key: "actualStartDt", header: "Start", render: (r) => r.actualStartDt ?? "-" },
    { key: "actualEndDt", header: "End", render: (r) => r.actualEndDt ?? "-" },
    {
      key: "action",
      header: "Action",
      /*
        상태를 바꾸는 버튼(시작·종료)은 여기 두지 않는다.

        이 표는 "지금 어떻게 돌아가는지 보는" 자리인데 상태 전이까지 갖고 있으면
        수술 업무 화면과 같은 일을 두 곳에서 하게 된다. 게다가 동의서가 없으면
        시작이 400 으로 막히는데(SL2-217) 여기서는 왜 막혔는지 알 수 없다 —
        동의서는 수술 업무 화면에 있다.

        그래서 이 칸은 "어디로 갈지"만 정한다.
      */
      render: (r) =>
        r.kind === "order" ? (
          <Button
            variant="primary"
            className="h-8 px-3 text-xs"
            onClick={() => onAssign(r.id)}
          >
            Assign
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="h-8 px-3 text-xs"
            onClick={() => onOpen(r.id)}
          >
            Open
          </Button>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {error ? <Alert>{resolveSurgeryMessage(error)}</Alert> : null}

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.key}
        loading={loading}
        emptyMessage="Nothing waiting for assignment, and no surgeries scheduled for today."
        minWidthClassName="min-w-[1040px]"
      />
    </div>
  );
}
