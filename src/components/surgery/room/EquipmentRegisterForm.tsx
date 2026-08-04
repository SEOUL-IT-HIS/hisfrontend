"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
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

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-sky-400 disabled:bg-slate-50";

/**
 * 수술장비 등록 폼 (SL2-10)
 *
 * <p>소속 수술실은 목록에서 선택한다. room_code 는 DDL 상 NOT NULL 이라 필수다.
 * 여기서는 전체 수술실을 보여준다 — 점검중인 방에도 장비는 배치될 수 있기 때문이다.</p>
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
      <div className="flex flex-col gap-1">
        <label htmlFor="equipmentId" className="text-sm text-slate-700">
          장비 ID
        </label>
        <input
          id="equipmentId"
          className={inputClass}
          value={equipmentId}
          onChange={(e) => setEquipmentId(e.target.value)}
          disabled={saving}
        />
        {errors.equipmentId && (
          <p className="text-xs text-red-600">{errors.equipmentId}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="equipmentName" className="text-sm text-slate-700">
          장비명
        </label>
        <input
          id="equipmentName"
          className={inputClass}
          value={equipmentName}
          onChange={(e) => setEquipmentName(e.target.value)}
          disabled={saving}
        />
        {errors.equipmentName && (
          <p className="text-xs text-red-600">{errors.equipmentName}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="equipmentRoomCode" className="text-sm text-slate-700">
          소속 수술실
        </label>
        <select
          id="equipmentRoomCode"
          className={inputClass}
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          disabled={saving}
        >
          <option value="">수술실 선택</option>
          {(rooms?.items ?? []).map((room) => (
            <option key={room.roomCode} value={room.roomCode}>
              {room.roomName}
            </option>
          ))}
        </select>
        {errors.roomCode && (
          <p className="text-xs text-red-600">{errors.roomCode}</p>
        )}
      </div>

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
