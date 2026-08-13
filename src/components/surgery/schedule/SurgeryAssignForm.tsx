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
  assignSurgeryRequest,
  fetchSurgeryRequest,
  selectScheduleError,
  selectScheduleSaving,
  selectSelectedSurgery,
} from "@/features/surgery/schedule/slice";
import { fetchEmpApi } from "@/features/emp/api/empApi";
import type { Emp } from "@/features/emp/types/empTypes";

type Props = { surgeryId: string };

/**
 * 수술 배정 폼 (요청접수 00 → 예약 01)
 *
 * <p>진료가 올린 요청에 수술실·마취의·간호사를 채워 확정한다. 환자와 집도의는 진료가
 * 결정한 값이라 읽기 전용으로만 보여주고 전송하지 않는다 — 배정 단계에서 바꾸면 요청
 * 자체가 뒤바뀐다. 집도의 변경이 필요하면 배정 후 수정(PUT) 화면에서 처리한다.</p>
 *
 * <p>수술실 목록은 사용가능(01) 상태만 받아온다. 점검중·폐쇄 수술실은 백엔드도
 * 배정을 거부하므로(SUR045) 선택지에 올리지 않는다.</p>
 *
 * <p>입력·셀렉트·버튼·패널은 components/common 을 쓴다(§12.1).</p>
 */
export default function SurgeryAssignForm({ surgeryId }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const surgery = useSelector(selectSelectedSurgery);
  const saving = useSelector(selectScheduleSaving);
  const error = useSelector(selectScheduleError);
  const availableRooms = useSelector(selectAvailableRooms);

  const [roomCode, setRoomCode] = useState("");
  const [anesthesiologistId, setAnesthesiologistId] = useState("");
  const [nurseId, setNurseId] = useState("");
  const [surgeryDt, setSurgeryDt] = useState("");
  // 희망일을 이미 채워 넣은 수술의 식별자. 같은 수술이면 두 번 채우지 않는다.
  const [boundSurgeryId, setBoundSurgeryId] = useState<string | null>(null);
  const [roomError, setRoomError] = useState("");
  const [employees, setEmployees] = useState<Emp[]>([]);
  const [employeeLoadError, setEmployeeLoadError] = useState("");
  // 저장 완료를 감지해 목록으로 되돌리기 위한 플래그
  const submitted = useRef(false);

  useEffect(() => {
    dispatch(fetchSurgeryRequest(surgeryId));
    dispatch(fetchAvailableRoomsRequest());
  }, [dispatch, surgeryId]);

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
      router.push("/surgery/schedule/requests");
    }
    if (!saving && error) submitted.current = false;
  }, [saving, error, router]);

  // 진료가 올린 희망일을 초기값으로 채운다. 수술실 사정에 맞춰 바꿀 수 있다.
  //
  // effect 가 아니라 렌더 중에 처리하는 이유는 두 가지다.
  //   1) effect 안에서 setState 를 부르면 렌더가 한 번 더 도는 연쇄가 생긴다
  //      (react-hooks/set-state-in-effect).
  //   2) 더 중요한 것 — 예전 코드는 surgery 가 바뀔 때마다 무조건 덮어써서,
  //      사용자가 날짜를 고쳐둔 뒤 조회 응답이 늦게 도착하면 입력값이 되돌아갔다.
  //      "아직 안 채운 수술일 때만" 채우도록 조건을 바꿔 그 사고를 막는다.
  //
  // 같은 폴더의 RoomUpdateForm·EquipmentUpdateForm 이 쓰는 방식과 같다.
  if (
    surgery?.surgeryId === surgeryId &&
    surgery.surgeryId !== boundSurgeryId
  ) {
    setBoundSurgeryId(surgery.surgeryId);
    setSurgeryDt(surgery.surgeryDt ?? "");
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
      assignSurgeryRequest(surgeryId, {
        roomCode,
        anesthesiologistId: anesthesiologistId || null,
        nurseId: nurseId || null,
        surgeryDt: surgeryDt || undefined,
      }),
    );
  }

  if (!surgery || surgery.surgeryId !== surgeryId) {
    return <p className="p-4 text-sm text-slate-500">불러오는 중입니다…</p>;
  }

  // 이미 배정된 건은 백엔드도 거부한다(SUR039). 화면에서 먼저 안내한다.
  if (surgery.statusCd !== "00") {
    return (
      <p className="p-4 text-sm text-slate-500">
        이미 배정이 끝난 수술입니다. 수정은 상세 화면에서 진행해주세요.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* 진료가 확정한 값 — 읽기 전용 */}
      <Panel className="p-3">
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-slate-500">환자ID</dt>
          <dd>{surgery.patientId}</dd>
          <dt className="text-slate-500">집도의ID</dt>
          <dd>{surgery.surgeonId}</dd>
          <dt className="text-slate-500">수술명</dt>
          <dd>{surgery.surgeryName ?? "-"}</dd>
          <dt className="text-slate-500">희망 수술일</dt>
          <dd>{surgery.surgeryDt}</dd>
        </dl>
      </Panel>

      <FormField label="수술실" required htmlFor="roomCode">
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

      <FormField label="확정 수술일" htmlFor="surgeryDt">
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
        onCancel={() => router.push("/surgery/schedule/requests")}
        cancelLabel="대기 목록"
        submitLabel="배정 확정"
        loading={saving}
        loadingLabel="배정 중…"
      />
    </form>
  );
}
