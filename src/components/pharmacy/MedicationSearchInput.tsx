"use client";

import { useEffect, useId } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Input } from "@/components/common";
import { fetchMedicationListRequest } from "@/features/pharmacy/slice";
import type { RootState } from "@/store/store";

type MedicationSearchInputProps = {
  value: string;
  onChange: (medicationId: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

/**
 * 약품 ID를 직접 입력하는 대신 "이름(EDI코드)"으로 검색해서 고르는 입력칸.
 * labimaging의 CodeSearchInput과 같은 방식(브라우저 기본 datalist)을 그대로 따른다 — 약품이
 * 100여 건이라 Select로도 되지만, 이름/코드 어느 쪽으로 쳐도 찾아지는 게 더 편해서 이 방식을 썼다.
 * 목록에 없는 값을 쳐도 입력은 되므로(datalist의 한계) "Unknown medication ID"로만 표시하고,
 * 최종 검증은 서버(약품마스터 existsById)가 한다.
 */
export default function MedicationSearchInput({
  value,
  onChange,
  disabled,
  placeholder,
}: MedicationSearchInputProps) {
  const dispatch = useDispatch();
  const listId = useId();
  const medications = useSelector((state: RootState) => state.pharmacy.medicationList);
  const loading = useSelector((state: RootState) => state.pharmacy.loading);

  // 다른 화면(약품 목록 등)에서 이미 불러왔으면 다시 부르지 않는다.
  useEffect(() => {
    if (medications.length === 0) {
      dispatch(fetchMedicationListRequest());
    }
  }, [dispatch, medications.length]);

  const matched = medications.find((m) => String(m.medicationId) === value);

  return (
    <div className="flex flex-col gap-1">
      <Input
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
        disabled={disabled}
        placeholder={placeholder ?? (loading ? "Loading medications..." : "Search by name or EDI code")}
        autoComplete="off"
      />
      <datalist id={listId}>
        {medications.map((medication) => (
          <option
            key={medication.medicationId}
            value={String(medication.medicationId)}
            label={
              medication.ediCode
                ? `${medication.medicationName} (${medication.ediCode})`
                : medication.medicationName
            }
          />
        ))}
      </datalist>
      {value ? (
        <span className={`text-xs ${matched ? "text-slate-500" : "text-rose-500"}`}>
          {matched ? matched.medicationName : "Unknown medication ID"}
        </span>
      ) : null}
    </div>
  );
}
