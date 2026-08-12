"use client";

import { useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, FormActions, FormField, Input } from "@/components/common";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import {
  createRoomRequest,
  selectRoomError,
  selectRoomSaving,
} from "@/features/surgery/room/slice";

/** 필드별 인라인 검증 메시지 (§15.3: 검증은 필드 하단 인라인, Toast 는 서버 결과에만) */
type FieldErrors = {
  roomCode?: string;
  roomName?: string;
};

/**
 * 수술실 등록 폼 (SL2-7)
 *
 * <p>입력·검증만 담당하고 제출 시 slice 액션만 dispatch 한다(§10.3).
 * roomCode 는 서버가 채번하지 않고 사용자가 지정하는 마스터 코드다.</p>
 *
 * <p>라벨·입력·버튼은 components/common 을 쓴다(§12.1). 검증 문구는 FormField 의
 * {@code hint} 가 아니라 별도 문단으로 둔다 — hint 는 회색 안내문이라 오류로 읽히지 않는다.</p>
 */
export default function RoomRegisterForm() {
  const dispatch = useDispatch<AppDispatch>();
  const saving = useSelector(selectRoomSaving);
  const error = useSelector(selectRoomError);

  const [roomCode, setRoomCode] = useState("");
  const [roomName, setRoomName] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  function reset() {
    setRoomCode("");
    setRoomName("");
    setErrors({});
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // 백엔드도 @NotBlank 로 검증하지만(SUR038), 왕복 전에 화면에서 먼저 막는다
    const nextErrors: FieldErrors = {};
    if (!roomCode.trim()) nextErrors.roomCode = "수술실 코드를 입력해주세요.";
    if (!roomName.trim()) nextErrors.roomName = "수술실명을 입력해주세요.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    dispatch(
      createRoomRequest({
        roomCode: roomCode.trim(),
        roomName: roomName.trim(),
      }),
    );
    setRoomCode("");
    setRoomName("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label="수술실 코드" required htmlFor="roomCode">
        <Input
          id="roomCode"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          disabled={saving}
        />
        {errors.roomCode ? (
          <span className="text-xs text-rose-600">{errors.roomCode}</span>
        ) : null}
      </FormField>

      <FormField label="수술실명" required htmlFor="roomName">
        <Input
          id="roomName"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          disabled={saving}
        />
        {errors.roomName ? (
          <span className="text-xs text-rose-600">{errors.roomName}</span>
        ) : null}
      </FormField>

      {/* 서버 통신 결과. 공통 Toast 는 리더 관리 공통 컴포넌트라 도입 전까지 인라인으로 둔다(§15.3) */}
      {error ? <Alert>{resolveSurgeryMessage(error)}</Alert> : null}

      {/* 등록 화면이라 '취소'로 돌아갈 곳이 없어 초기화로 둔다 */}
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
