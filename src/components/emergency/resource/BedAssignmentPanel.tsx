"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, FormField, Input, Select } from "@/components/common";
import { resolveEmergencyMessage } from "@/features/emergency/messages";
import {
  assignBedRequest,
  fetchBedsRequest,
  resetCurrentAssignment,
  selectBeds,
  selectBedsError,
  selectBedsLoading,
  selectBedSubmitError,
  selectBedSubmitting,
  selectCurrentBedAssignment,
} from "@/features/emergency/resource/bed/slice";
import { BED_ZONE_OPTIONS } from "@/features/emergency/resource/bed/types";
import { formatDateTime } from "@/features/emergency/utils";

type BedAssignmentPanelProps = {
  receptionNo: string;
  className?: string;
};

const initialForm = { bedId: "", assignedById: "" };

function zoneLabel(zoneCode: string): string {
  return BED_ZONE_OPTIONS.find((o) => o.value === zoneCode)?.label ?? zoneCode;
}

/**
 * 병상 배정 패널 (UC-RES-02)
 * - 병상 목록(getBeds)은 접수 건과 무관하게 응급실 전체 현황을 보여준다.
 * - 배정(assignBed)만 이 접수 건(receptionNo)에 연결된다.
 * - 백엔드에 "환자별 배정 이력 조회" API가 없어서, 방금 배정한 결과만
 *   세션 메모리(currentAssignment)로 보여준다. 새로고침하거나 환자를
 *   바꿨다가 돌아오면 다시 알 수 없다(알려진 한계, 위 대화에서 확인함).
 */
export default function BedAssignmentPanel({ receptionNo, className = "" }: BedAssignmentPanelProps) {
  const dispatch = useDispatch<AppDispatch>();
  const beds = useSelector(selectBeds);
  const loading = useSelector(selectBedsLoading);
  const error = useSelector(selectBedsError);
  const currentAssignment = useSelector(selectCurrentBedAssignment);
  const submitting = useSelector(selectBedSubmitting);
  const submitError = useSelector(selectBedSubmitError);

  const [form, setForm] = useState(initialForm);
  const [lastReceptionNo, setLastReceptionNo] = useState(receptionNo);

  useEffect(() => {
    dispatch(fetchBedsRequest());
  }, [dispatch]);

  // 환자가 바뀌면 이전 환자의 "방금 배정한 병상" 표시를 지운다.
  useEffect(() => {
    dispatch(resetCurrentAssignment());
  }, [dispatch, receptionNo]);

  // 폼 입력값 초기화는 렌더 중 비교로 처리한다 (다른 패널들과 동일한 패턴).
  if (receptionNo !== lastReceptionNo) {
    setLastReceptionNo(receptionNo);
    setForm(initialForm);
  }

  const emptyBedOptions = beds
    .filter((bed) => bed.bedStatusCode === "EMPTY")
    .map((bed) => ({ value: bed.id, label: `${bed.bedNo} (${zoneLabel(bed.zoneCode)})` }));

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleAssign() {
    if (!form.bedId) return;
    dispatch(
      assignBedRequest({
        encounterId: receptionNo,
        bedId: form.bedId,
        assignedById: form.assignedById || undefined,
      }),
    );
  }

  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      {/* 병상 배정 */}
      <h3 className="mb-3 text-sm font-semibold text-slate-800">Bed Assignment</h3>

      {loading ? (
        // 병상 목록을 불러오는 중입니다...
        <p className="py-4 text-center text-sm text-slate-400">Loading bed list...</p>
      ) : error ? (
        <Alert variant="error">{resolveEmergencyMessage(error)}</Alert>
      ) : (
        <>
          {currentAssignment ? (
            <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {/* 이 환자에게 배정된 병상: {bedNo} ({구역}) · {일시} */}
              Assigned bed: {currentAssignment.bedNo} ({zoneLabel(currentAssignment.zoneCode)}) ·{" "}
              {formatDateTime(currentAssignment.assignedAt)}
            </p>
          ) : null}

          {/* 전체 병상 현황 */}
          <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {beds.map((bed) => {
              const empty = bed.bedStatusCode === "EMPTY";
              return (
                <div
                  key={bed.id}
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    empty
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-50 text-slate-500"
                  }`}
                >
                  <div className="text-sm font-semibold">{bed.bedNo}</div>
                  <div>{zoneLabel(bed.zoneCode)}</div>
                  {/* 사용중 / 빈 병상 */}
                  <div>{empty ? "Empty" : "Occupied"}</div>
                </div>
              );
            })}
          </div>

          {submitError ? <Alert variant="error">{resolveEmergencyMessage(submitError)}</Alert> : null}

          <div className="flex flex-wrap gap-3">
            {/* 병상 */}
            <FormField label="Bed" required className="w-[220px]">
              <Select
                name="bedId"
                value={form.bedId}
                onChange={handleChange}
                options={emptyBedOptions}
                // 선택 / 빈 병상 없음
                placeholder={emptyBedOptions.length > 0 ? "Select" : "No empty beds"}
                disabled={submitting || emptyBedOptions.length === 0}
              />
            </FormField>
            {/* 배정자ID */}
            <FormField label="Assigned By ID" className="w-[180px]">
              <Input name="assignedById" value={form.assignedById} onChange={handleChange} disabled={submitting} maxLength={36} />
            </FormField>
          </div>
          <div className="mt-3 flex justify-end">
            <Button type="button" onClick={handleAssign} disabled={submitting || !form.bedId}>
              {/* 배정 중... / 병상 배정 */}
              {submitting ? "Assigning..." : "Assign Bed"}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
