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
import { usePatientNames } from "@/features/surgery/common/usePatientNames";
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
   * 배정이 끝났을 때 할 일. 대기 목록 화면이 마스터-디테일이 되면서 생겼다.
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
 * <p><b>배정이 곧 수락이다</b> — 담당자가 하는 일은 수술실을 정하는 것이고,
 * 수술실이 정해지는 순간 요청이 받아들여진 것이므로 오더가 수락으로 바뀌고 그때
 * 수술이 만들어진다. 그래서 이 화면 이전에는 수술이 존재하지 않는다.</p>
 *
 * <p>환자와 집도의는 진료·응급실이 확정한 값이라 읽기 전용으로만 보여준다 — 배정
 * 단계에서 바꾸면 요청 자체가 뒤바뀐다.</p>
 *
 * <p>수술실 목록은 사용가능(01) 상태만 받아온다. 점검중·폐쇄 수술실은 백엔드도
 * 배정을 거부하므로(SUR045) 선택지에 올리지 않는다.</p>
 *
 * <h3>여기서 배정이 끝난다</h3>
 *
 * <p>예전에는 수술실만 정하고 <b>"나중에 배정"</b>으로 마취의·간호사를 비워 둘 수
 * 있었다. 나중에 배정 상세 화면에서 채우면 된다는 전제였는데, 그 결과 수술실만 잡힌
 * 건과 팀까지 다 잡힌 건이 목록에서 똑같이 "예약"으로 보였다 — 배정이 끝났는지
 * 아닌지를 아무도 알 수 없었다.</p>
 *
 * <p>이제 <b>이 폼을 넘기는 순간 배정이 확정</b>되고 그 뒤로는 바꿀 수 없다.
 * 개별 배정 API 는 SUR059 로 거절한다. 그래서 여기서 전부 고르게 한다.</p>
 *
 * <p><b>마취 여부를 묻는 이유</b> — 마취의를 무조건 필수로 걸면 무마취 시술
 * (단순 봉합, 표재성 종물 제거 등)이 배정 자체가 안 된다. 그렇다고 계속 선택값으로
 * 두면 "마취의를 넣는 걸 잊은 것"과 "원래 마취가 없는 것"을 구분할 수 없다.
 * 그래서 마취 여부를 먼저 선언하게 하고, 시행(Y)일 때만 마취의를 요구한다.</p>
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
  // 마취 여부는 기본값을 두지 않는다 — 고르지 않고 지나칠 수 있으면 물어보는 의미가 없다
  const [anesthesiaYn, setAnesthesiaYn] = useState<"" | "Y" | "N">("");
  const [anesthesiologistId, setAnesthesiologistId] = useState("");
  const [nurseId, setNurseId] = useState("");
  const [surgeryDt, setSurgeryDt] = useState("");
  const [boundOrderId, setBoundOrderId] = useState<string | null>(null);
  /** 필드별 오류 문구. 비어 있으면 통과다 */
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
          err instanceof Error ? err.message : "Failed to load the employee list.",
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

  // 배정 담당자가 누구를 배정하는지 알아야 한다 — UUID 로는 확인할 수 없다
  const { names: patientNames } = usePatientNames(
    order ? [order.patientId] : [],
  );

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

  /*
    백엔드도 같은 규칙을 본다(@NotBlank 와 requireAnesthesiologistWhenAnesthetized).
    여기서 먼저 막는 이유는 한 번에 어디가 비었는지 보여주기 위해서다 — 서버는 첫
    위반에서 멈추고 SUR038 하나만 돌려준다(§15.3).
  */
  function validate() {
    const errors: Record<string, string> = {};
    if (!roomCode) errors.roomCode = "Please select an operating room.";
    if (!anesthesiaYn) errors.anesthesiaYn = "Please select whether anesthesia is used.";
    if (anesthesiaYn === "Y" && !anesthesiologistId) {
      errors.anesthesiologistId =
        "A surgery under anesthesia requires an anesthesiologist.";
    }
    if (!nurseId) errors.nurseId = "Please select a nurse.";
    return errors;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    submitted.current = true;
    dispatch(
      assignOrderRequest(orderId, {
        roomCode,
        surgeryDt: surgeryDt || undefined,
        // 위 검증을 통과했으므로 빈 값이 아니다
        anesthesiaYn: anesthesiaYn as "Y" | "N",
        // 무마취면 마취의를 보내지 않는다. 화면에서 고를 수도 없다.
        anesthesiologistId:
          anesthesiaYn === "Y" ? anesthesiologistId : null,
        nurseId,
      }),
    );
  }

  if (!order) {
    return (
      <p className="p-4 text-sm text-slate-500">
        This order is no longer waiting for assignment. It may already have been
        processed — please pick another one from the list.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* 진료·응급실이 확정한 값 — 읽기 전용 */}
      <Panel className="p-3">
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-slate-500">Patient</dt>
          <dd>{patientNames[order.patientId] ?? order.patientId}</dd>
          <dt className="text-slate-500">Surgeon ID</dt>
          <dd>{order.surgeonId}</dd>
          <dt className="text-slate-500">Surgery</dt>
          <dd>{order.surgeryName ?? "-"}</dd>
          <dt className="text-slate-500">Requested date</dt>
          <dd>{order.requestedDt}</dd>
          <dt className="text-slate-500">Type</dt>
          <dd>{order.emergencyYn === "Y" ? "Emergency" : "Routine"}</dd>
          <dt className="text-slate-500">Visit ID</dt>
          <dd>{order.visitId ?? "-"}</dd>
        </dl>
      </Panel>

      <Alert variant="info">
        An assignment cannot be changed once confirmed. Correcting a mistake means
        cancelling the surgery and having it requested again, so please check before
        you submit.
      </Alert>

      <FormField
        label="Room"
        required
        htmlFor="roomCode"
        hint="Rooms under maintenance or closed are not listed."
      >
        <Select
          id="roomCode"
          placeholder="Select an operating room"
          options={roomOptions}
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          disabled={saving}
        />
        {fieldErrors.roomCode ? (
          <span className="text-xs text-rose-600">{fieldErrors.roomCode}</span>
        ) : null}
      </FormField>

      <FormField
        label="Scheduled date"
        htmlFor="surgeryDt"
        hint="Leave blank to keep the requested date."
      >
        <Input
          id="surgeryDt"
          type="date"
          lang="en"
          value={surgeryDt}
          onChange={(e) => setSurgeryDt(e.target.value)}
          disabled={saving}
        />
      </FormField>

      <FormField
        label="Anesthesia"
        required
        htmlFor="anesthesiaYn"
        hint="Choose None for procedures without an anesthesiologist, such as simple suturing."
      >
        <Select
          id="anesthesiaYn"
          placeholder="Select"
          options={[
            { value: "Y", label: "Used — anesthesiologist required" },
            { value: "N", label: "None — procedure without anesthesia" },
          ]}
          value={anesthesiaYn}
          onChange={(e) => {
            const next = e.target.value as "" | "Y" | "N";
            setAnesthesiaYn(next);
            // 미시행으로 바꾸면 이미 고른 마취의를 지운다 —
            // 화면에서 사라진 값이 그대로 실려 나가지 않게 한다
            if (next !== "Y") setAnesthesiologistId("");
          }}
          disabled={saving}
        />
        {fieldErrors.anesthesiaYn ? (
          <span className="text-xs text-rose-600">
            {fieldErrors.anesthesiaYn}
          </span>
        ) : null}
      </FormField>

      {/* 마취의는 시행(Y)일 때만 묻는다 — 무마취인데 칸이 남아 있으면 채워야 하나 헷갈린다 */}
      {anesthesiaYn === "Y" ? (
        <FormField label="Anesthesiologist" required htmlFor="anesthesiologistId">
          <Select
            id="anesthesiologistId"
            placeholder="Select an anesthesiologist"
            options={employeeOptions}
            value={anesthesiologistId}
            onChange={(e) => setAnesthesiologistId(e.target.value)}
            disabled={saving}
          />
          {fieldErrors.anesthesiologistId ? (
            <span className="text-xs text-rose-600">
              {fieldErrors.anesthesiologistId}
            </span>
          ) : null}
        </FormField>
      ) : null}

      <FormField
        label="Nurse"
        required
        htmlFor="nurseId"
        hint="Even without anesthesia, someone must verify instrument and sponge counts."
      >
        <Select
          id="nurseId"
          placeholder="Select a nurse"
          options={employeeOptions}
          value={nurseId}
          onChange={(e) => setNurseId(e.target.value)}
          disabled={saving}
        />
        {fieldErrors.nurseId ? (
          <span className="text-xs text-rose-600">{fieldErrors.nurseId}</span>
        ) : null}
      </FormField>

      {employeeLoadError ? (
        <span className="text-xs text-rose-600">{employeeLoadError}</span>
      ) : null}

      {error ? <Alert>{resolveSurgeryMessage(error)}</Alert> : null}

      <FormActions
        onCancel={
          onCancel ?? (() => router.push("/surgery/schedule/requests"))
        }
        cancelLabel={onCancel ? "Clear selection" : "Pending orders"}
        submitLabel="Confirm assignment"
        loading={saving}
        loadingLabel="Assigning…"
      />
    </form>
  );
}
