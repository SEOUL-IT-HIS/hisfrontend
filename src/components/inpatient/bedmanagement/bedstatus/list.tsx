"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import Link from "next/link";
import { fetchBedRequest, selectBed, selectBedListStatus } from "@/features/inpatient/bedmanagement/bedstatus/slice";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";
import BedStatusDetail from "@/components/inpatient/bedmanagement/bedstatus/detail";

const STATUS_BADGE: Record<string, string> = {
  EMPTY: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
  OCCUPIED: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  RESERVED: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  MAINTENANCE: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
};

const STATUS_LABEL: Record<string, string> = {
  EMPTY: "빈 병상",
  OCCUPIED: "사용중",
  RESERVED: "예약됨",
  MAINTENANCE: "유지보수",
};

const BedStatusList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const bedAssignments = useSelector(selectBed);
  const listStatus = useSelector(selectBedListStatus);
  const patients = useSelector((state: RootState) => state.patient.patients);
  const patientNameById = useMemo(
    () => new Map(patients.map((patient) => [patient.patientId, patient.patientName])),
    [patients],
  );

  const items=[
    {id:1, name: 'EMPTY', description: '빈 병상'},
    {id:2, name: 'OCCUPIED', description: '사용중인 병상'},
    {id:3, name: 'RESERVED', description: '예약된 병상'},
    {id:4, name: 'MAINTENANCE', description: '유지보수 중인 병상'},
  ];


  const [searchStatus, setSearchStatus] = React.useState<string>('');
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const filteredBeds = useMemo(() => {
  // searchStatus가 빈 문자열이면 bedAssignments 그대로 return
  if (!searchStatus) {
    return bedAssignments;
  }
  // 아니면 bedAssignments.filter(...)로 bedStatus 일치하는 것만 return
  return bedAssignments.filter(bed => bed.bedStatus === searchStatus);
}, [bedAssignments, searchStatus]);

  useEffect(() => {
    dispatch(fetchBedRequest());
    dispatch(fetchPatientListRequest({}));
  }, [dispatch]);

  return (
    <div className="mx-auto w-full max-w-[1800px] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">병상 현황</h1>
          <p className="mt-1 text-sm text-slate-500">전체 병상의 실시간 사용 현황입니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={searchStatus}
            onChange={(e) => setSearchStatus(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">전체</option>
            {items.map((item) => (
              <option key={item.id} value={item.name}>
                {item.description}
              </option>
            ))}
          </select>
          <Link
            href="/inpatient/bedmanagement/bedassignment/create"
            className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            배정 등록
          </Link>
        </div>
      </div>

      {listStatus.loading && <p className="text-sm text-slate-500">로딩중...</p>}
      {listStatus.error && <p className="text-sm text-red-600">{listStatus.error}</p>}

      {!listStatus.loading && !listStatus.error && (
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="whitespace-nowrap px-4 py-3">환자명</th>
                  <th className="whitespace-nowrap px-4 py-3">환자ID</th>
                  <th className="whitespace-nowrap px-4 py-3">병상ID</th>
                  <th className="whitespace-nowrap px-4 py-3">병실번호</th>
                  <th className="whitespace-nowrap px-4 py-3">병상번호</th>
                  <th className="whitespace-nowrap px-4 py-3">병상상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBeds.map((bed) => (
                  <tr
                    key={bed.bedId}
                    onClick={() => setSelectedBedId(bed.bedId)}
                    className={`cursor-pointer hover:bg-slate-50 ${selectedBedId === bed.bedId ? "bg-sky-50" : ""}`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-slate-800">
                      {bed.patientId ? (patientNameById.get(bed.patientId) ?? '조회중...') : '없음'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{bed.patientId ?? '없음'}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-sky-700">{bed.bedId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{bed.roomNo}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{bed.bedNo}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                          STATUS_BADGE[bed.bedStatus] ?? "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                        }`}
                      >
                        {STATUS_LABEL[bed.bedStatus] ?? bed.bedStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredBeds.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-500">병상 데이터가 없습니다.</p>
            )}
          </div>

          {selectedBedId && (
            <div className="w-[420px] shrink-0">
              <BedStatusDetail bedId={selectedBedId} onClose={() => setSelectedBedId(null)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BedStatusList;
