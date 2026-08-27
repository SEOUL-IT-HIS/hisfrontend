"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  Alert,
  FormActions,
  FormField,
  Input,
  Panel,
  Select,
} from "@/components/common";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import {
  fetchAvailableRoomsRequest,
  selectAvailableRooms,
} from "@/features/surgery/room/slice";
import {
  assignOrderRequest,
  fetchOrdersRequest,
  selectOrderError,
  selectOrderSaving,
  selectSurgeryOrders,
} from "@/features/surgery/order/slice";
import { ORDER_STATUS } from "@/features/surgery/order/types";
import { fetchEmpApi } from "@/features/emp/api/empApi";
import type { Emp } from "@/features/emp/types/empTypes";

type Props = {
  orderId: string;
  /**
   * 배정이 끝났을 때 할 일. 대기 목록 화면이 마스터-디테일이 되면서 생겼다(2026-08-27).
   *
   * <p>주지 않으면 예전처럼 {@code /surgery/schedule/requests} 로 이동한다 —
   * {@code /surgery/schedule/assign/[orderId]} 로 직접 들어온 경우다. 대기 목록 안에
   * 끼워 쓸 때는 이동할 곳이 없으므로(이미 그 화면이다) 선택만 놓으면 된다.</p>
   */
  onAssigned?: () => void;
  /** 취소를 눌렀을 때. 주지 않으면 대기 목록으로 이동한다 */
  onCancel?: () => void;
};

/**
 * 배정 등록 화면 (오더 접수 00 → 수락 01)
 *
 * <p><b>배정이 곧 수락이다</b>(2026-08-13) — 담당자가 하는 일은 수술실을 정하는 것이고,
 * 수술실이 정해지는 순간 요청이 받아들여진 것이므로 오더가 수락으로 바뀌고 그때
 * 수술이 만들어진다. 그래서 이 화면 이전에는 수술이 존재하지 않는다.</p>
 *
 * <p>환자와 집도의는 진료·응급실이 확정한 값이라 읽기 전용으로만 보여준다 — 배정
 * 단계에서 바꾸면 요청 자체가 뒤바뀐다. 집도의 변경이 필요하면 배정 후 수술 쪽
 * 개별 배정 API 로 처리한다.</p>
 *
 * <p>수술실 목록은 사용가능(01) 상태만 받아온다. 점검중·폐쇄 수술실은 백엔드도
 * 배정을 거부하므로(SUR045) 선택지에 올리지 않는다.</p>
 */
export default function SurgeryAssignForm({
  orderId,
  onAssigned,
  onCancel,
}: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const orders = useSelector(selectSurgeryOrders);
  const saving = useSelector(selectOrderSaving);
  const error = useSelector(selectOrderError);
  const availableRooms = useSelector(selectAvailableRooms);

  const [roomCode, setRoomCode] = useState("");
  const [anesthesiologistId, setAnesthesiologistId] = useState("");
  const [nurseId, setNurseId] = useState("");
  const [surgeryDt, setSurgeryDt] = useState("");
  const [boundOrderId, setBoundOrderId] = useState<string | null>(null);
  const [roomError, setRoomError] = useState("");
  const [employees, setEmployees] = useState<Emp[]>([]);
  const [employeeLoadError, setEmployeeLoadError] = useState("");
  // 저장 완료를 감지해 대기 목록으로 되돌리기 위한 플래그
  const submitted = useRef(false);

  useEffect(() => {
    // 목록에서 대상 오더를 찾는다. 단건 조회 액션을 따로 두지 않은 이유 —
    //   이 화면은 대기 목록에서만 들어오므로 목록이 이미 채워져 있다.
    //   주소로 직접 들어온 경우를 위해 한 번 더 읽는다.
    dispatch(fetchOrdersRequest({ orderStatusCd: ORDER_STATUS.RECEIVED }));
    dispatch(fetchAvailableRoomsRequest());
  }, [dispatch]);

  // 마취의·간호사 선택 목록 — admin-service 직원 조회(§2.1 프론트가 직접 호출)
  useEffect(() => {
    let ignore = false;
    fetchEmpApi()
      .then((list) => {
        if (!ignore) setEmployees(list);
      })
      .catch((err: unknown) => {
        if (ignore) return;
        setEmployeeLoadError(
          err instanceof Error ? err.message : "직원 목록 조회에 실패했습니다.",
        );
      });
    return () => {
      ignore = true;
    };
  }, []);

  // 배정 성공 시 대기 목록으로 돌아간다(실패면 error 가 채워지므로 머문다)
  useEffect(() => {
    if (submitted.current && !saving && !error) {
      submitted.current = false;
      if (onAssigned) onAssigned();
      else router.push("/surgery/schedule/requests");
    }
    if (!saving && error) submitted.current = false;
  }, [saving, error, router, onAssigned]);

  const order = orders.find((o) => o.orderId === orderId);

  // 진료가 올린 희망일을 초기값으로 채운다. 아직 안 채운 오더일 때만 넣어,
  //   사용자가 고쳐둔 값을 뒤늦게 도착한 응답이 덮어쓰지 않게 한다.
  if (order && order.orderId !== boundOrderId) {
    setBoundOrderId(order.orderId);
    setSurgeryDt(order.requestedDt ?? "");
  }

  const roomOptions = availableRooms.map((room) => ({
    value: room.roomCode,
    label: `${room.roomName} (${room.roomCode})`,
  }));

  // admin-service 는 empId 가 number, 수술은 VARCHAR2(36) 문자열이라 변환해 보낸다
  const employeeOptions = employees.map((employee) => ({
    value: String(employee.empId),
    label: `${employee.empName} (${employee.empNo})`,
  }));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!roomCode) {
      setRoomError("수술실을 선택해주세요.");
      return;
    }
    setRoomError("");
    submitted.current = true;
    dispatch(
      assignOrderRequest(orderId, {
        roomCode,
        surgeryDt: surgeryDt || undefined,
        anesthesiologistId: anesthesiologistId || null,
        nurseId: nurseId || null,
      }),
    );
  }

  if (!order) {
    return (
      <p className="p-4 text-sm text-slate-500">
        배정 대기 중인 요청이 아닙니다. 이미 처리되었거나 목록에서 다시 선택해
        주세요.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* 진료·응급실이 확정한 값 — 읽기 전용 */}
      <Panel className="p-3">
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-slate-500">환자ID</dt>
          <dd>{order.patientId}</dd>
          <dt className="text-slate-500">집도의ID</dt>
          <dd>{order.surgeonId}</dd>
          <dt className="text-slate-500">수술명</dt>
          <dd>{order.surgeryName ?? "-"}</dd>
          <dt className="text-slate-500">희망 수술일</dt>
          <dd>{order.requestedDt}</dd>
          <dt className="text-slate-500">구분</dt>
          <dd>{order.emergencyYn === "Y" ? "응급" : "일반"}</dd>
          <dt className="text-slate-500">내원ID</dt>
          <dd>{order.visitId ?? "-"}</dd>
        </dl>
      </Panel>

      <FormField
        label="수술실"
        required
        htmlFor="roomCode"
        hint="수술실이 정해지면 요청이 수락되고 수술이 만들어집니다."
      >
        <Select
          id="roomCode"
          placeholder="수술실 선택"
          options={roomOptions}
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          disabled={saving}
        />
        {roomError ? (
          <span className="text-xs text-rose-600">{roomError}</span>
        ) : null}
      </FormField>

      <FormField
        label="확정 수술일"
        htmlFor="surgeryDt"
        hint="비우면 희망일을 그대로 씁니다."
      >
        <Input
          id="surgeryDt"
          type="date"
          value={surgeryDt}
          onChange={(e) => setSurgeryDt(e.target.value)}
          disabled={saving}
        />
      </FormField>

      <FormField label="마취의" htmlFor="anesthesiologistId">
        <Select
          id="anesthesiologistId"
          placeholder="나중에 배정"
          options={employeeOptions}
          value={anesthesiologistId}
          onChange={(e) => setAnesthesiologistId(e.target.value)}
          disabled={saving}
        />
        {employeeLoadError ? (
          <span className="text-xs text-rose-600">{employeeLoadError}</span>
        ) : null}
      </FormField>

      <FormField label="간호사" htmlFor="nurseId">
        <Select
          id="nurseId"
          placeholder="나중에 배정"
          options={employeeOptions}
          value={nurseId}
          onChange={(e) => setNurseId(e.target.value)}
          disabled={saving}
        />
      </FormField>

      {error ? <Alert>{resolveSurgeryMessage(error)}</Alert> : null}

      <FormActions
        onCancel={
          onCancel ?? (() => router.push("/surgery/schedule/requests"))
        }
        cancelLabel={onCancel ? "선택 해제" : "대기 목록"}
        submitLabel="배정 확정"
        loading={saving}
        loadingLabel="배정 중…"
      />
    </form>
  );
}
