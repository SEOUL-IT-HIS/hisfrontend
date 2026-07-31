"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import {
  fetchEquipmentRequest,
  selectRoomError,
  selectRoomLoading,
  selectRoomSaving,
  selectSelectedEquipment,
  updateEquipmentRequest,
} from "@/features/surgery/room/slice";

type Props = {
  equipmentId: string;
};

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-sky-400 disabled:bg-slate-50";

/**
 * 수술장비 정보 수정 폼 (SL2-31)
 *
 * <p>진입 시 단건 조회로 초기값을 바인딩한다(SL2-139).
 * 백엔드 PUT /equipment/{id} 는 장비명만 교체한다 — 소속 수술실 변경은 수술실 쪽
 * assignEquipments(SL2-141), 상태·출고반입은 각각 전용 PATCH 가 담당한다.</p>
 */
export default function EquipmentUpdateForm({ equipmentId }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const equipment = useSelector(selectSelectedEquipment);
  const loading = useSelector(selectRoomLoading);
  const saving = useSelector(selectRoomSaving);
  const error = useSelector(selectRoomError);

  const [equipmentName, setEquipmentName] = useState("");
  const [boundId, setBoundId] = useState<string | null>(null);
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    dispatch(fetchEquipmentRequest(equipmentId));
  }, [dispatch, equipmentId]);

  if (equipment && equipment.equipmentId !== boundId) {
    setBoundId(equipment.equipmentId);
    setEquipmentName(equipment.equipmentName);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!equipmentName.trim()) {
      setNameError("장비명을 입력해주세요.");
      return;
    }
    setNameError("");
    dispatch(
      updateEquipmentRequest(equipmentId, {
        equipmentName: equipmentName.trim(),
      }),
    );
  }

  if (loading && !equipment) {
    return <p className="text-sm text-slate-500">불러오는 중입니다…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm text-slate-700">장비 ID</label>
        <input className={inputClass} value={equipmentId} readOnly disabled />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-slate-700">소속 수술실</label>
        {/* 변경은 수술실 쪽 보유장비 배정(SL2-141)에서 처리한다 */}
        <input
          className={inputClass}
          value={equipment?.roomCode ?? ""}
          readOnly
          disabled
        />
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
        {nameError && <p className="text-xs text-red-600">{nameError}</p>}
      </div>

      {error && (
        <p className="text-sm text-red-600">{resolveSurgeryMessage(error)}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="h-10 rounded-lg bg-sky-500 px-4 text-white disabled:bg-slate-300"
      >
        {saving ? "저장 중…" : "수정"}
      </button>
    </form>
  );
}
