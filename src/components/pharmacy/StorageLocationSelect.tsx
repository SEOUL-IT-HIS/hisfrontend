"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { fetchStorageLocationListRequest } from "@/features/pharmacy/slice";
import { Select } from "@/components/common";
import type { RootState } from "@/store/store";

type StorageLocationSelectProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
};

/**
 * 보관위치 ID를 자유 텍스트로 입력받지 않고, 실제 등록된 보관위치 중에서만 고르게 한다.
 * 목록이 비어 있으면 자유텍스트로 되돌리지 않고 등록 화면으로 안내만 한다.
 */
export default function StorageLocationSelect({
  value,
  onChange,
  disabled,
}: StorageLocationSelectProps) {
  const dispatch = useDispatch();
  const locations = useSelector((state: RootState) => state.pharmacy.storageLocationList);
  const loading = useSelector((state: RootState) => state.pharmacy.storageLocationLoading);

  useEffect(() => {
    if (locations.length === 0) {
      dispatch(fetchStorageLocationListRequest());
    }
  }, [dispatch, locations.length]);

  if (!loading && locations.length === 0) {
    return (
      <p className="text-sm text-rose-500">
        No storage locations registered yet.{" "}
        <Link href="/pharmacy/storage-locations/register" className="underline">
          Register a storage location
        </Link>{" "}
        first.
      </p>
    );
  }

  const options = locations.map((location) => ({
    value: location.storageLocationId,
    label: location.locationName,
  }));

  return (
    <Select
      placeholder={loading ? "Loading storage locations..." : "Select storage location"}
      options={options}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
