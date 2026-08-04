"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
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

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-sky-400 disabled:bg-slate-50";

/**
 * 수술실 정보 수정 폼 (SL2-30)
 *
 * <p>진입 시 단건 조회로 기존 값을 폼 초기값에 바인딩한다(SL2-115).
 * 백엔드 PUT /rooms/{roomCode} 는 이름만 교체하므로 코드는 읽기 전용으로 보여준다.</p>
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
      <div className="flex flex-col gap-1">
        <label className="text-sm text-slate-700">수술실 코드</label>
        {/* PK 라 수정 대상이 아니다 */}
        <input className={inputClass} value={roomCode} readOnly disabled />
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
        {nameError && <p className="text-xs text-red-600">{nameError}</p>}
      </div>

      {error && (
        <p className="text-sm text-red-600">{resolveSurgeryMessage(error)}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="h-10 rounded-lg bg-sky-500 px-4 text-white disabled:bg-slate-300"
        >
          {saving ? "저장 중…" : "수정"}
        </button>
        {/* 수정하지 않고 나갈 때 */}
        <Link
          href="/surgery/room/list"
          className="flex h-10 items-center rounded-lg border border-slate-200 px-4 text-slate-700"
        >
          목록
        </Link>
      </div>
    </form>
  );
}
