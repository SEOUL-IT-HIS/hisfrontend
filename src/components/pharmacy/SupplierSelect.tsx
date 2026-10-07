"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { fetchSupplierListRequest } from "@/features/pharmacy/slice";
import { Select } from "@/components/common";
import type { RootState } from "@/store/store";

type SupplierSelectProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
};

/**
 * 공급처 ID를 자유 텍스트로 입력받지 않고, 실제 등록된 공급처 중에서만 고르게 한다.
 * 목록이 비어 있으면(아직 하나도 등록 안 됐으면) 자유텍스트로 되돌리지 않고 등록 화면으로
 * 안내만 한다 — 자유텍스트를 막는 게 이 피커를 만든 목적 자체라서다.
 */
export default function SupplierSelect({ value, onChange, disabled }: SupplierSelectProps) {
  const dispatch = useDispatch();
  const suppliers = useSelector((state: RootState) => state.pharmacy.supplierList);
  const loading = useSelector((state: RootState) => state.pharmacy.supplierLoading);

  useEffect(() => {
    if (suppliers.length === 0) {
      dispatch(fetchSupplierListRequest());
    }
  }, [dispatch, suppliers.length]);

  if (!loading && suppliers.length === 0) {
    return (
      <p className="text-sm text-rose-500">
        No suppliers registered yet.{" "}
        <Link href="/pharmacy/suppliers/register" className="underline">
          Register a supplier
        </Link>{" "}
        first.
      </p>
    );
  }

  const options = suppliers.map((supplier) => ({
    value: supplier.supplierId,
    label: supplier.contactPhone
      ? `${supplier.supplierName} (${supplier.contactPhone})`
      : supplier.supplierName,
  }));

  return (
    <Select
      placeholder={loading ? "Loading suppliers..." : "Select supplier"}
      options={options}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
