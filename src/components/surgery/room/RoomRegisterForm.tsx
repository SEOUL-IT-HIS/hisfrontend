"use client";

import { useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
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

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-sky-400 disabled:bg-slate-50";

/**
 * 수술실 등록 폼 (SL2-7)
 *
 * <p>입력·검증만 담당하고 제출 시 slice 액션만 dispatch 한다(§10.3).
 * roomCode 는 서버가 채번하지 않고 사용자가 지정하는 마스터 코드다.</p>
 */
export default function RoomRegisterForm() {
  const dispatch = useDispatch<AppDispatch>();
  const saving = useSelector(selectRoomSaving);
  const error = useSelector(selectRoomError);

  const [roomCode, setRoomCode] = useState("");
  const [roomName, setRoomName] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

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
      <div className="flex flex-col gap-1">
        <label htmlFor="roomCode" className="text-sm text-slate-700">
          수술실 코드
        </label>
        <input
          id="roomCode"
          className={inputClass}
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          disabled={saving}
        />
        {errors.roomCode && (
          <p className="text-xs text-red-600">{errors.roomCode}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="roomName" className="text-sm text-slate-700">
          수술실명
        </label>
        <input
          id="roomName"
          className={inputClass}
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          disabled={saving}
        />
        {errors.roomName && (
          <p className="text-xs text-red-600">{errors.roomName}</p>
        )}
      </div>

      {/* 서버 통신 결과. 공통 Toast 는 리더 관리 공통 컴포넌트라 도입 전까지 인라인으로 둔다(§15.3) */}
      {error && (
        <p className="text-sm text-red-600">{resolveSurgeryMessage(error)}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="h-10 rounded-lg bg-sky-500 px-4 text-white disabled:bg-slate-300"
      >
        {saving ? "등록 중…" : "등록"}
      </button>
    </form>
  );
}
