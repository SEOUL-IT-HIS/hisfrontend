"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStorageLocationListRequest,
  registerStorageLocationRequest,
} from "@/features/pharmacy/slice";
import { DataTable, FormActions, FormField, Input, PageHeader, Panel } from "@/components/common";
import type { DataTableColumn } from "@/components/common";
import type { RootState } from "@/store/store";
import type { StorageLocationDto } from "@/features/pharmacy/types";

const columns: DataTableColumn<StorageLocationDto>[] = [
  { key: "locationName", header: "Location Name", render: (row) => row.locationName },
];

/**
 * 보관위치 등록 — 등록한 뒤 다른 화면으로 넘어가지 않고 이 화면에서 목록에 바로 추가된 것을 보며
 * 이어서 다음 위치를 등록할 수 있다.
 */
export default function StorageLocationRegisterForm() {
  const dispatch = useDispatch();
  const [locationName, setLocationName] = useState("");
  const locationList = useSelector((state: RootState) => state.pharmacy.storageLocationList);
  const listLoading = useSelector((state: RootState) => state.pharmacy.storageLocationLoading);
  const listError = useSelector((state: RootState) => state.pharmacy.storageLocationError);
  const registerLoading = useSelector(
    (state: RootState) => state.pharmacy.storageLocationRegisterLoading
  );
  const registerError = useSelector(
    (state: RootState) => state.pharmacy.storageLocationRegisterError
  );
  const wasRegistering = useRef(false);

  useEffect(() => {
    dispatch(fetchStorageLocationListRequest());
  }, [dispatch]);

  // 등록이 끝났고 에러가 없으면 입력칸을 비운다(saga가 목록도 다시 불러온다).
  useEffect(() => {
    if (wasRegistering.current && !registerLoading && !registerError) {
      setLocationName("");
    }
    wasRegistering.current = registerLoading;
  }, [registerLoading, registerError]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!locationName.trim()) return;
    dispatch(registerStorageLocationRequest({ locationName }));
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <PageHeader
        title="Storage Locations"
        description="Register a storage location so it can be selected when registering a receipt."
      />
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <Panel className="p-5">
          {registerError && <p className="mb-3 text-sm text-rose-500">{registerError}</p>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormField label="Location Name" required>
              <Input
                type="text"
                placeholder="e.g. Pharmacy Warehouse A"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
              />
            </FormField>
            <FormActions
              submitLabel="Register"
              loading={registerLoading}
              cancelLabel="Reset"
              onCancel={() => setLocationName("")}
            />
          </form>
        </Panel>
        <Panel className="p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Registered Locations</h3>
          <DataTable
            columns={columns}
            rows={locationList}
            rowKey={(row) => row.storageLocationId}
            loading={listLoading}
            loadingMessage="Loading..."
            emptyMessage={listError ?? "No storage locations registered yet."}
          />
        </Panel>
      </div>
    </div>
  );
}
