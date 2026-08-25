"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, FormActions, FormField, Input } from "@/components/common";
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
  /** 저장에 성공했거나 사용자가 취소했을 때. 모달을 닫는 쪽이 넘긴다 */
  onDone: () => void;
};

/**
 * 수술장비 정보 수정 폼 (SL2-31)
 *
 * <p>진입 시 단건 조회로 초기값을 바인딩한다(SL2-139).
 * 백엔드 PUT /equipment/{id} 는 장비명만 교체한다 — 소속 수술실 변경은 수술실 쪽
 * assignEquipments(SL2-141), 상태·출고반입은 각각 전용 PATCH 가 담당한다.</p>
 *
 * <p>입력·버튼은 components/common 을 쓴다(§12.1).</p>
 *
 * <p><b>페이지가 아니라 모달 안에서 쓴다</b>(2026-08-24) — 장비명 한 칸 고치자고 목록을
 * 떠났다가 돌아오는 이동이 잦았다. {@code router.push} 대신 {@code onDone} 콜백을 받아
 * 닫는 방식을 호출부가 정한다. 수술실 수정 폼과 같은 모양이다.</p>
 */
export default function EquipmentUpdateForm({ equipmentId, onDone }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const equipment = useSelector(selectSelectedEquipment);
  const loading = useSelector(selectRoomLoading);
  const saving = useSelector(selectRoomSaving);
  const error = useSelector(selectRoomError);

  const [equipmentName, setEquipmentName] = useState("");
  const [boundId, setBoundId] = useState<string | null>(null);
  const [nameError, setNameError] = useState("");
  const submitted = useRef(false);

  useEffect(() => {
    dispatch(fetchEquipmentRequest(equipmentId));
  }, [dispatch, equipmentId]);

  // 수정 성공 시 닫는다(실패면 error 가 채워지므로 열린 채로 머문다)
  useEffect(() => {
    if (submitted.current && !saving && !error) {
      submitted.current = false;
      onDone();
    }
    if (!saving && error) submitted.current = false;
  }, [saving, error, onDone]);

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
    submitted.current = true;
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
      <FormField label="장비 ID" hint="ID 는 수정할 수 없습니다.">
        <Input value={equipmentId} readOnly disabled />
      </FormField>

      <FormField
        label="소속 수술실"
        hint="변경은 수술실의 보유장비 배정에서 처리합니다."
      >
        {/* 변경은 수술실 쪽 보유장비 배정(SL2-141)에서 처리한다 */}
        <Input value={equipment?.roomCode ?? ""} readOnly disabled />
      </FormField>

      <FormField label="장비명" required htmlFor="equipmentName">
        <Input
          id="equipmentName"
          value={equipmentName}
          onChange={(e) => setEquipmentName(e.target.value)}
          disabled={saving}
        />
        {nameError ? (
          <span className="text-xs text-rose-600">{nameError}</span>
        ) : null}
      </FormField>

      {error ? <Alert>{resolveSurgeryMessage(error)}</Alert> : null}

      <FormActions
        onCancel={onDone}
        cancelLabel="취소"
        submitLabel="수정"
        loading={saving}
        loadingLabel="저장 중…"
      />
    </form>
  );
}
