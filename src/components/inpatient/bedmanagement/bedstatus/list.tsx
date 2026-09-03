"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import Link from "next/link";
import { fetchBedRequest, selectBed, selectBedListStatus } from "@/features/inpatient/bedmanagement/bedstatus/slice";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";
import BedStatusDetail from "@/components/inpatient/bedmanagement/bedstatus/detail";

// 병상 상태 코드(bedStatus) → 배지 색상
const STATUS_BADGE: Record<string, string> = {
  EMPTY: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
  OCCUPIED: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  RESERVED: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  MAINTENANCE: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
};

// 병상 상태 코드 → 화면에 보여줄 한글 라벨
const STATUS_LABEL: Record<string, string> = {
  EMPTY: "빈 병상",
  OCCUPIED: "사용중",
  RESERVED: "예약됨",
  MAINTENANCE: "유지보수",
};

type BedStatusListProps = {
  /** 병상관리 홈 탭 안에 끼워 넣을 때 true — 자체 제목/여백을 생략 */
  embedded?: boolean;
};

const BedStatusList = ({ embedded = false }: BedStatusListProps = {}) => {
  const dispatch = useDispatch<AppDispatch>();
  // 이름은 bedAssignments지만 selectBed가 반환하는 건 "병상(BED) 목록" 그 자체임 —
  // BED 테이블에 patientId가 이미 들어있어서(배정 시 markBedOccupied가 채워줌),
  // 다른 화면(bedassignment/list.tsx)처럼 admissionId를 거칠 필요 없이 patientId → 이름 1단계면 됨
  const bedAssignments = useSelector(selectBed);
  const listStatus = useSelector(selectBedListStatus);
  const patients = useSelector((state: RootState) => state.patient.patients);
  // patientId → patientName 변환용 Map (환자 목록을 매번 배열 순회로 찾지 않도록 캐싱)
  const patientNameById = useMemo(
    () => new Map(patients.map((patient) => [patient.patientId, patient.patientName])),
    [patients],
  );
  // 여기서 Map을 쓰는 이유: 병상 목록에서 환자 이름을 표시할 때, 병상마다 patientId를 이용해 환자 이름을 찾는데, 배열 순회로 찾으면 O(n^2) 복잡도가 되므로 Map으로 캐싱하여 O(n)으로 줄임

  // 상태 필터 드롭다운에 들어갈 선택지(코드값 + 한글 설명)
  const items=[
    {id:1, name: 'EMPTY', description: '빈 병상'},
    {id:2, name: 'OCCUPIED', description: '사용중인 병상'},
    {id:3, name: 'RESERVED', description: '예약된 병상'},
    {id:4, name: 'MAINTENANCE', description: '유지보수 중인 병상'},
  ];


  const [searchStatus, setSearchStatus] = React.useState<string>('');
  // 목록에서 클릭한 병상ID — 값이 있으면 오른쪽에 상세 패널을 띄움(마스터-디테일)
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  // list(테이블 한 줄씩) / room(병실별로 묶어서) 두 가지 보기 모드
  const [viewMode, setViewMode] = useState<"list" | "room">("list");
  // useMemo를 쓰면 searchStatus가 바뀔 때만 필터링이 다시 계산됨. 아니면 매 렌더링마다 filter가 실행되어 성능 저하 가능
  const filteredBeds = useMemo(() => {
  // searchStatus가 빈 문자열이면 bedAssignments 그대로 return
  if (!searchStatus) {
    return bedAssignments;
  }
  // 아니면 bedAssignments.filter(...)로 bedStatus 일치하는 것만 return
  return bedAssignments.filter(bed => bed.bedStatus === searchStatus);
}, [bedAssignments, searchStatus]);

  // 병실번호(roomNo) 기준으로 병상들을 묶음 — 병실별 보기 모드에서 사용
  const bedsByRoom = useMemo(() => {
    const map = new Map<string, typeof filteredBeds>();
    filteredBeds.forEach((bed) => {
      const roomBeds = map.get(bed.roomNo) ?? [];
      roomBeds.push(bed);
      map.set(bed.roomNo, roomBeds);
    });
    return map;
  }, [filteredBeds]);

  useEffect(() => {
    dispatch(fetchBedRequest());
    dispatch(fetchPatientListRequest({}));
  }, [dispatch]);

  return (
    <div className={embedded ? "w-full" : "mx-auto w-full max-w-[1800px] p-6"}>
      <div className="mb-6 flex items-center justify-between">
        {/* 병상관리 홈 탭 안에 끼워졌을 때(embedded)는 탭 컴포넌트가 이미 상단 제목을 보여주므로 생략 */}
        {embedded ? (
          <div />
        ) : (
          <div>
            <h1 className="text-lg font-semibold text-slate-800">병상 현황</h1>
            <p className="mt-1 text-sm text-slate-500">전체 병상의 실시간 사용 현황입니다.</p>
          </div>
        )}
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
          {/* list ↔ room 보기 전환 */}
          <button
            type="button"
            onClick={() => setViewMode((v) => (v === "list" ? "room" : "list"))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            {viewMode === "list" ? "병실별 보기" : "목록으로 보기"}
          </button>
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
        // flex로 좌: 목록, 우: 상세 패널을 나란히 배치 (selectedBedId 없으면 오른쪽은 안 그려짐)
        <div className="flex items-start gap-4">
          {viewMode === "list" ? (
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
                        {/* patientId가 없으면(빈 병상) "없음", 있으면 Map에서 이름 조회(아직 patients 로딩 전이면 "조회중...") */}
                        {bed.patientId ? (patientNameById.get(bed.patientId) ?? '조회중...') : '없음'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{bed.patientId ?? '없음'}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-sky-700">{bed.bedId}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{bed.roomNo}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{bed.bedNo}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {/* STATUS_BADGE/LABEL에 없는 값이 와도 깨지지 않도록 기본(회색) 스타일로 대체 */}
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
          ) : (
            <div className="min-w-0 flex-1 space-y-4">
              {/* 병실번호 순으로 카드 하나씩, 카드 안에 그 병실 소속 병상들을 나열 */}
              {Array.from(bedsByRoom.entries()).map(([roomNo, beds]) => (
                <div key={roomNo} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="mb-3 text-sm font-medium text-slate-800">{roomNo}호</p>
                  <div className="flex flex-wrap gap-2">
                    {beds.map((bed) => (
                      <button
                        key={bed.bedId}
                        type="button"
                        onClick={() => setSelectedBedId(bed.bedId)}
                        className={`flex w-32 flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left text-xs ring-1 ring-inset ${
                          STATUS_BADGE[bed.bedStatus] ?? "bg-slate-100 text-slate-600 ring-slate-200"
                        } ${selectedBedId === bed.bedId ? "outline outline-2 outline-offset-1 outline-sky-500" : ""}`}
                      >
                        <span className="font-medium">{bed.bedNo}번</span>
                        <span>{STATUS_LABEL[bed.bedStatus] ?? bed.bedStatus}</span>
                        {bed.patientId && (
                          <span className="truncate">{patientNameById.get(bed.patientId) ?? "조회중..."}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {bedsByRoom.size === 0 && (
                <p className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
                  병상 데이터가 없습니다.
                </p>
              )}
            </div>
          )}

          {/* 병상을 클릭했을 때만 오른쪽에 상세 패널 표시. onClose로 선택 해제하면 다시 목록만 남음 */}
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
