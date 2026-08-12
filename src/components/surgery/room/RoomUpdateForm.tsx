"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, FormActions, FormField, Input } from "@/components/common";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import {
  fetchRoomRequest,
  selectRoomError,
  selectRoomLoading,
  selectRoomSaving,
  selectSelectedRoom,
  updateRoomRequest,
} from "@/features/surgery/room/slice";

type Props = {
  roomCode: string;
};

/**
 * 수술실 정보 수정 폼 (SL2-30)
 *
 * <p>진입 시 단건 조회로 기존 값을 폼 초기값에 바인딩한다(SL2-115).
 * 백엔드 PUT /rooms/{roomCode} 는 이름만 교체하므로 코드는 읽기 전용으로 보여준다.</p>
 *
 * <p>취소가 &lt;Link&gt; 에서 router.push 로 바뀌었다 — FormActions 가 onCancel 콜백을
 * 받는 형태라서다. 이동 대상은 그대로 목록이다(§12.1).</p>
 */
export default function RoomUpdateForm({ roomCode }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const room = useSelector(selectSelectedRoom);
  const loading = useSelector(selectRoomLoading);
  const saving = useSelector(selectRoomSaving);
  const error = useSelector(selectRoomError);

  const [roomName, setRoomName] = useState("");
  const [boundCode, setBoundCode] = useState<string | null>(null);
  const [nameError, setNameError] = useState("");
  const submitted = useRef(false);

  useEffect(() => {
    dispatch(fetchRoomRequest(roomCode));
  }, [dispatch, roomCode]);

  // 수정 성공 시 목록으로 돌아간다(실패면 error 가 채워지므로 머문다)
  useEffect(() => {
    if (submitted.current && !saving && !error) {
      submitted.current = false;
      router.push("/surgery/room/list");
    }
    if (!saving && error) submitted.current = false;
  }, [saving, error, router]);

  // 조회 결과가 도착하면 초기값을 한 번만 채운다.
  // (effect 대신 렌더 중 처리 — 사용자가 수정 중인 값을 덮어쓰지 않도록 코드가 바뀔 때만 반영)
  if (room && room.roomCode !== boundCode) {
    setBoundCode(room.roomCode);
    setRoomName(room.roomName);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!roomName.trim()) {
      setNameError("수술실명을 입력해주세요.");
      return;
    }
    setNameError("");
    submitted.current = true;
    dispatch(updateRoomRequest(roomCode, { roomName: roomName.trim() }));
  }

  if (loading && !room) {
    return <p className="text-sm text-slate-500">불러오는 중입니다…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label="수술실 코드" hint="코드는 수정할 수 없습니다.">
        {/* PK 라 수정 대상이 아니다 */}
        <Input value={roomCode} readOnly disabled />
      </FormField>

      <FormField label="수술실명" required htmlFor="roomName">
        <Input
          id="roomName"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          disabled={saving}
        />
        {nameError ? (
          <span className="text-xs text-rose-600">{nameError}</span>
        ) : null}
      </FormField>

      {error ? <Alert>{resolveSurgeryMessage(error)}</Alert> : null}

      <FormActions
        onCancel={() => router.push("/surgery/room/list")}
        cancelLabel="목록"
        submitLabel="수정"
        loading={saving}
        loadingLabel="저장 중…"
      />
    </form>
  );
}
