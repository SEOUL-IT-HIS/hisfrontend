"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  Alert,
  FormActions,
  FormField,
  Input,
  Select,
} from "@/components/common";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import {
  createEquipmentRequest,
  fetchRoomsRequest,
  selectRoomError,
  selectRoomSaving,
  selectRooms,
} from "@/features/surgery/room/slice";

type FieldErrors = {
  equipmentId?: string;
  roomCode?: string;
  equipmentName?: string;
};

/**
 * 수술장비 등록 폼 (SL2-10)
 *
 * <p>소속 수술실은 목록에서 선택한다. room_code 는 DDL 상 NOT NULL 이라 필수다.
 * 여기서는 전체 수술실을 보여준다 — 점검중인 방에도 장비는 배치될 수 있기 때문이다.</p>
 *
 * <p><b>컴포넌트가 하는 일</b> — 상태를 읽고 액션을 던지는 것뿐이다.
 * API 주소도, 성공하면 무엇을 해야 하는지도 모른다. 그건 saga 의 몫이다.</p>
 * <pre>
 *   useSelector(...)      slice 에 담긴 상태를 읽는다
 *   dispatch(...Request)  "이걸 해달라"고 알린다. 실제 호출은 saga 가 한다
 *   useEffect(...)        화면이 처음 뜰 때 조회 액션을 한 번 던진다
 *   disabled={saving}     저장 중 중복 클릭을 막는다. saving 도 slice 가 관리한다
 * </pre>
 *
 * <p><b>화면에서도 입력값을 검사하는 이유</b> — 백엔드에도 @Valid 가 걸려 있지만,
 * 서버까지 갔다 와야 알 수 있다. 뻔한 실수는 화면에서 먼저 잡아 왕복을 줄인다(§15.3).
 * 화면 검사는 사용자 편의고, <b>진짜 방어선은 백엔드</b>다 — API 를 직접 호출하면
 * 화면 검사는 건너뛰어지기 때문이다.</p>
 *
 * <p>입력·셀렉트·버튼은 components/common 을 쓴다(§12.1). 수술실 선택지는 공통코드가
 * 아니라 우리가 소유한 마스터라 useCommonCodeOptions 가 아니라 목록 조회 결과를 쓴다.</p>
 */
export default function EquipmentRegisterForm() {
  const dispatch = useDispatch<AppDispatch>();
  const saving = useSelector(selectRoomSaving);
  const error = useSelector(selectRoomError);
  const rooms = useSelector(selectRooms);

  const [equipmentId, setEquipmentId] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [equipmentName, setEquipmentName] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    dispatch(fetchRoomsRequest());
  }, [dispatch]);

  const roomOptions = (rooms?.items ?? []).map((room) => ({
    value: room.roomCode,
    label: room.roomName,
  }));

  function reset() {
    setEquipmentId("");
    setEquipmentName("");
    setRoomCode("");
    setErrors({});
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // 폼 기본 동작(페이지 새로고침)을 막는다. 없으면 화면이 통째로 다시 뜬다.
    event.preventDefault();

    // 오류를 모아서 한 번에 보여준다 — 첫 항목에서 멈추면 사용자가 여러 번 시도하게 된다.
    const nextErrors: FieldErrors = {};
    if (!equipmentId.trim()) nextErrors.equipmentId = "장비 ID를 입력해주세요.";
    if (!roomCode) nextErrors.roomCode = "소속 수술실을 선택해주세요.";
    if (!equipmentName.trim())
      nextErrors.equipmentName = "장비명을 입력해주세요.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    dispatch(
      createEquipmentRequest({
        equipmentId: equipmentId.trim(),
        roomCode,
        equipmentName: equipmentName.trim(),
      }),
    );
    setEquipmentId("");
    setEquipmentName("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label="장비 ID" required htmlFor="equipmentId">
        <Input
          id="equipmentId"
          value={equipmentId}
          onChange={(e) => setEquipmentId(e.target.value)}
          disabled={saving}
        />
        {errors.equipmentId ? (
          <span className="text-xs text-rose-600">{errors.equipmentId}</span>
        ) : null}
      </FormField>

      <FormField label="장비명" required htmlFor="equipmentName">
        <Input
          id="equipmentName"
          value={equipmentName}
          onChange={(e) => setEquipmentName(e.target.value)}
          disabled={saving}
        />
        {errors.equipmentName ? (
          <span className="text-xs text-rose-600">{errors.equipmentName}</span>
        ) : null}
      </FormField>

      <FormField label="소속 수술실" required htmlFor="equipmentRoomCode">
        <Select
          id="equipmentRoomCode"
          placeholder="수술실 선택"
          options={roomOptions}
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          disabled={saving}
        />
        {errors.roomCode ? (
          <span className="text-xs text-rose-600">{errors.roomCode}</span>
        ) : null}
      </FormField>

      {error ? <Alert>{resolveSurgeryMessage(error)}</Alert> : null}

      <FormActions
        onCancel={reset}
        cancelLabel="초기화"
        submitLabel="등록"
        loading={saving}
        loadingLabel="등록 중…"
      />
    </form>
  );
}
