"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import { useRouter } from "next/navigation";
import { Alert, Button, Input, PageHeader, Pagination, Panel, Select } from "@/components/common";
import type { SwipeAction } from "@/components/inpatient/common/SwipeRow";
import SwipeListRow from "@/components/inpatient/common/SwipeListRow";
import LinkButton from "@/components/inpatient/common/LinkButton";
import Toolbar from "@/components/inpatient/common/Toolbar";
import { fetchBedRequest, selectBed, selectBedListStatus } from "@/features/inpatient/bedmanagement/bedstatus/slice";
import { fetchWardCodesApi } from "@/features/inpatient/bedmanagement/bedstatus/api";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";
import BedStatusDetail from "@/components/inpatient/bedmanagement/bedstatus/detail";
import type { CommonCodeItem } from "@/features/commonCode/types/commonCodeItemTypes";
import { formatSexAge } from "@/features/inpatient/displayFormat";
import type { BedDTO } from "@/features/inpatient/bedmanagement/types";

// 병실 유형 코드(admin ROOM_TYPE_CD) → 표시 라벨
const ROOM_TYPE_LABEL: Record<string, string> = { "01": "Single", "02": "Multi", "03": "Isolation", "04": "VIP" };

// 병상 상태 코드(bedStatus) → 배지 색상
const STATUS_BADGE: Record<string, string> = {
  EMPTY: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
  OCCUPIED: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  RESERVED: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
};

// 병상 상태 코드 → 화면에 보여줄 한글 라벨
const STATUS_LABEL: Record<string, string> = {
  EMPTY: "Empty",
  OCCUPIED: "Occupied",
  RESERVED: "Reserved",
};

// 머리글과 각 행이 같은 칸 비율을 씀 (표(table)가 아니라 행 카드 목록이라 직접 맞춤)
const ROW_GRID = "grid w-full grid-cols-[40px_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1.2fr)_96px] items-center gap-3";

// 한 페이지에 보여줄 병상 수 — 목록이 끝없이 스크롤되지 않도록 끊어서 보여줌
const PAGE_SIZE = 10;

const AssignIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

type BedStatusListProps = {
  /** 병상관리 홈 탭 안에 끼워 넣을 때 true — 자체 제목/여백을 생략 */
  embedded?: boolean;
  /** 처음 열 때 걸어둘 병동 필터 — 대시보드에서 병동 카드를 눌러 들어올 때 사용 */
  initialWard?: string;
};

const BedStatusList = ({ embedded = false, initialWard = "" }: BedStatusListProps = {}) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  // 이름은 bedAssignments지만 selectBed가 반환하는 건 "병상(BED) 목록" 그 자체임 —
  // BED 테이블에 patientId가 이미 들어있어서(배정 시 markBedOccupied가 채워줌),
  // 다른 화면(bedassignment/list.tsx)처럼 admissionId를 거칠 필요 없이 patientId → 이름 1단계면 됨
  const bedAssignments = useSelector(selectBed);
  const listStatus = useSelector(selectBedListStatus);
  const patients = useSelector((state: RootState) => state.patient.patients);
  const patientListLoading = useSelector((state: RootState) => state.patient.listLoading);
  // patientId → patientName 변환용 Map (환자 목록을 매번 배열 순회로 찾지 않도록 캐싱)
  const patientNameById = useMemo(
    () => new Map(patients.map((patient) => [patient.patientId, patient.patientName])),
    [patients],
  );
  // patientId → 성별/나이 ("F / 34") — 환자 ID 대신 보여줄 값
  const sexAgeByPatientId = useMemo(
    () => new Map(patients.map((patient) => [patient.patientId, formatSexAge(patient.genderCd, patient.birthDate)])),
    [patients],
  );
  // 병상의 환자 이름 표시 — "Loading..."은 환자 목록을 실제로 불러오는 중일 때만 보여줌.
  // 목록을 다 불러왔는데도 없으면 patient-service에 없는 환자(삭제됐거나 잘못 들어간 patientId)라서
  // 계속 "Loading..."으로 남지 않도록 "Unknown"으로 구분해서 표시
  const patientLabel = (patientId: string | null) => {
    if (!patientId) return "None";
    const name = patientNameById.get(patientId);
    if (name) return name;
    return patientListLoading ? "Loading..." : "Unknown";
  };
  // 여기서 Map을 쓰는 이유: 병상 목록에서 환자 이름을 표시할 때, 병상마다 patientId를 이용해 환자 이름을 찾는데, 배열 순회로 찾으면 O(n^2) 복잡도가 되므로 Map으로 캐싱하여 O(n)으로 줄임

  // 상태 필터 드롭다운에 들어갈 선택지(코드값 + 한글 설명)
  const items=[
    {id:1, name: 'EMPTY', description: 'Empty Bed'},
    {id:2, name: 'OCCUPIED', description: 'Occupied Bed'},
    {id:3, name: 'RESERVED', description: 'Reserved Bed'},
  ];


  const [searchStatus, setSearchStatus] = React.useState<string>('');
  // 병동(WARD_CD) 필터 — 빈 문자열이면 전체 병동
  const [searchWard, setSearchWard] = React.useState<string>(initialWard);
  // 환자 이름 검색어 — 몇 병동 몇 호 몇 번 베드에 있는지 바로 찾기 위함 (부분 일치)
  const [searchName, setSearchName] = React.useState<string>('');
  const [wardCodes, setWardCodes] = React.useState<CommonCodeItem[]>([]);
  // 목록에서 클릭한 병상ID — 값이 있으면 오른쪽에 상세 패널을 띄움(마스터-디테일)
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  // 목록 보기의 현재 페이지(1부터) — 필터가 바뀌면 1페이지로 되돌림
  const [page, setPage] = useState(1);
  // wardCd → 병동명 (필터 드롭다운용으로 불러온 wardCodes 재사용). 공통코드를 못 불러오면 코드값 그대로 표시
  const wardNameByCd = useMemo(
    () => new Map(wardCodes.map((ward) => [ward.codeValue, ward.codeName])),
    [wardCodes],
  );
  const wardLabel = (wardCd: string | null) => (wardCd ? wardNameByCd.get(wardCd) ?? wardCd : "-");
  // 필터 드롭다운에는 실제 병상이 있는 병동만 표시 — 공통코드에는 ICU·응급 관찰실처럼 병상이 없는 병동도 있어서
  // 고르면 항상 빈 화면이 되던 문제 방지 (병상이 추가되면 자동으로 목록에 나타남)
  const wardsWithBeds = useMemo(() => {
    const wardCdsWithBeds = new Set(bedAssignments.map((bed) => bed.wardCd).filter(Boolean));
    return wardCodes.filter((ward) => wardCdsWithBeds.has(ward.codeValue));
  }, [wardCodes, bedAssignments]);
  // list(테이블 한 줄씩) / room(병실별로 묶어서) 두 가지 보기 모드
  const [viewMode, setViewMode] = useState<"list" | "room">("list");
  // useMemo를 쓰면 searchStatus/searchWard가 바뀔 때만 필터링이 다시 계산됨. 아니면 매 렌더링마다 filter가 실행되어 성능 저하 가능
  // 이름 검색 — 병상의 patientId로 이름을 찾아 부분 일치 비교 (환자가 없는 병상은 검색 시 제외)
  const filterBeds = (keyword: string) => {
    const normalized = keyword.trim().toLowerCase();
    return bedAssignments.filter((bed) => {
      if (searchStatus && bed.bedStatus !== searchStatus) return false;
      if (searchWard && bed.wardCd !== searchWard) return false;
      if (normalized) {
        const name = bed.patientId ? patientNameById.get(bed.patientId) ?? "" : "";
        if (!name.toLowerCase().includes(normalized)) return false;
      }
      return true;
    });
  };
  // useMemo를 쓰면 필터 조건이 바뀔 때만 필터링이 다시 계산됨. 아니면 매 렌더링마다 filter가 실행되어 성능 저하 가능
  // eslint-disable-next-line react-hooks/exhaustive-deps -- filterBeds는 아래 deps 값들만 사용
  const filteredBeds = useMemo(() => filterBeds(searchName), [bedAssignments, searchStatus, searchWard, searchName, patientNameById]);

  // 이름 검색 결과가 딱 1건이면 상세 패널을 자동으로 열어 병동/호실/베드를 바로 보여줌
  // 현재 페이지에 보여줄 병상 — 병상이 줄어 페이지 수를 넘어가면(예: 새로고침 후) 마지막 페이지로 맞춤
  const totalPages = Math.max(Math.ceil(filteredBeds.length / PAGE_SIZE), 1);
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedBeds = filteredBeds.slice(pageStart, pageStart + PAGE_SIZE);

  const handleSearchNameChange = (value: string) => {
    setPage(1);
    setSearchName(value);
    const matches = value.trim() ? filterBeds(value) : [];
    if (matches.length === 1) setSelectedBedId(matches[0].bedId);
  };

  // 병동(wardCd) + 병실번호(roomNo) 기준으로 병상들을 묶음 — 병실별 보기 모드에서 사용
  // roomNo만으로 묶으면 다른 병동의 같은 호실(예: 내과 101호, 외과 101호)이 한 카드로 합쳐지므로 병동까지 키에 포함
  const bedsByRoom = useMemo(() => {
    const map = new Map<string, { wardCd: string | null; roomNo: string; beds: typeof filteredBeds }>();
    filteredBeds.forEach((bed) => {
      const key = `${bed.wardCd ?? ""}|${bed.roomNo}`;
      const room = map.get(key) ?? { wardCd: bed.wardCd, roomNo: bed.roomNo, beds: [] };
      room.beds.push(bed);
      map.set(key, room);
    });
    // 병동코드 → 병실번호 순으로 정렬 (API가 준 순서가 아니라 화면에서 찾기 쉬운 순서로)
    return Array.from(map.values()).sort(
      (a, b) =>
        (a.wardCd ?? "").localeCompare(b.wardCd ?? "") ||
        a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true }),
    );
  }, [filteredBeds]);

  useEffect(() => {
    dispatch(fetchBedRequest());
    dispatch(fetchPatientListRequest({}));
  }, [dispatch]);

  useEffect(() => {
    fetchWardCodesApi()
      .then((codes) => setWardCodes(codes ?? []))
      .catch(() => setWardCodes([]));
  }, []);

  // 빈 병상에만 "Assign"을 열어 줌 — 병상배정 등록 화면으로 이동하고 그 병상이 미리 선택돼 있음
  const actionsFor = (bed: BedDTO): SwipeAction[] =>
    bed.bedStatus === "EMPTY"
      ? [
          {
            id: "assign",
            label: "Assign",
            icon: <AssignIcon />,
            dismiss: false,
            onSelect: () => router.push(`/inpatient/bedmanagement/bedassignment/create?from=status&bedId=${bed.bedId}`),
          },
        ]
      : [];

  return (
    // 화면 아래까지 꽉 채움 — 목록과 상세 패널이 각자 안에서 스크롤 (홈 탭 안에서는 남은 높이를, 단독 페이지에서는 화면 높이를 채움)
    <div className={`flex min-h-0 flex-col gap-4 ${embedded ? "w-full flex-1" : "mx-auto h-full w-full max-w-[1800px] p-6"}`}>
      {/* 병상관리 홈 탭 안에 끼워졌을 때(embedded)는 홈이 이미 상단 제목을 보여주므로 생략 */}
      {!embedded && <PageHeader title="Bed Status" description="Real-time usage status of all beds." />}

      <Toolbar
        actions={
          <>
            {/* list ↔ room 보기 전환 */}
            <Button variant="secondary" onClick={() => setViewMode((v) => (v === "list" ? "room" : "list"))}>
              {viewMode === "list" ? "View by Room" : "View as List"}
            </Button>
            <LinkButton href="/inpatient/bedmanagement/bedassignment/create?from=status">Register Assignment</LinkButton>
          </>
        }
      >
        <Input
          value={searchName}
          onChange={(e) => handleSearchNameChange(e.target.value)}
          placeholder="Search patient name"
          className="max-w-[200px]"
        />
        <Select
          value={searchWard}
          onChange={(e) => {
            setSearchWard(e.target.value);
            setPage(1);
          }}
          placeholder="All Wards"
          options={wardsWithBeds.map((ward) => ({ value: ward.codeValue, label: ward.codeName }))}
          className="max-w-[180px]"
        />
        <Select
          value={searchStatus}
          onChange={(e) => {
            setSearchStatus(e.target.value);
            setPage(1);
          }}
          placeholder="All"
          options={items.map((item) => ({ value: item.name, label: item.description }))}
          className="max-w-[160px]"
        />
        {/* 밀어서 여는 동작은 눈에 잘 안 띄어서 안내 문구를 둠 (목록 보기에서만) */}
        {viewMode === "list" && <span className="text-xs text-slate-400">Swipe an empty bed left to assign a patient</span>}
      </Toolbar>

      {listStatus.error && <Alert>{listStatus.error}</Alert>}

      {!listStatus.error && (
        // flex로 좌: 목록, 우: 상세 패널을 나란히 배치 (selectedBedId 없으면 오른쪽은 안 그려짐)
        <div className="flex min-h-[480px] flex-1 gap-4">
          {viewMode === "list" ? (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
              {/* 머리글 — 아래 행들과 같은 칸 비율 */}
              <div className={`${ROW_GRID} rounded-xl bg-slate-50/95 px-[17px] py-2.5 text-xs font-medium uppercase tracking-wide text-slate-400`}>
                <span>No.</span>
                <span>Patient (Gender / Age)</span>
                <span>Ward</span>
                <span>Room Type</span>
                <span>Room / Bed</span>
                <span>Bed Status</span>
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-1">
                {listStatus.loading && <p className="py-16 text-center text-sm text-slate-400">Loading...</p>}
                {!listStatus.loading && filteredBeds.length === 0 && (
                  <p className="py-16 text-center text-sm text-slate-400">No bed data available.</p>
                )}
                {!listStatus.loading &&
                  pagedBeds.map((bed, index) => (
                    <SwipeListRow
                      key={bed.bedId}
                      label={`Room ${bed.roomNo} Bed ${bed.bedNo}`}
                      selected={bed.bedId === selectedBedId}
                      actions={actionsFor(bed)}
                      actionColor="#0284c7"
                      onSelect={() => setSelectedBedId(bed.bedId)}
                    >
                      <div className={ROW_GRID}>
                        {/* 페이지가 바뀌어도 이어지는 번호 (2페이지는 11번부터) */}
                        <span className="text-xs tabular-nums text-slate-400">{pageStart + index + 1}</span>
                        <div className="min-w-0">
                          {/* patientId가 없으면(빈 병상) "None", 있으면 Map에서 이름 조회 (patientLabel 참고) */}
                          <p className="truncate text-sm font-medium text-slate-800">{patientLabel(bed.patientId)}</p>
                          <p className="truncate text-xs text-slate-400">
                            {bed.patientId ? sexAgeByPatientId.get(bed.patientId) ?? "-" : "-"}
                          </p>
                        </div>
                        <span className="truncate text-sm text-slate-600">{wardLabel(bed.wardCd)}</span>
                        <span className="truncate text-sm text-slate-600">
                          {bed.roomTypeCode ? ROOM_TYPE_LABEL[bed.roomTypeCode] ?? bed.roomTypeCode : "-"}
                        </span>
                        <span className="truncate text-sm text-slate-600">
                          Room {bed.roomNo} · Bed {bed.bedNo}
                        </span>
                        <span>
                          {/* STATUS_BADGE/LABEL에 없는 값이 와도 깨지지 않도록 기본(회색) 스타일로 대체 */}
                          <span
                            className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                              STATUS_BADGE[bed.bedStatus] ?? "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                            }`}
                          >
                            {STATUS_LABEL[bed.bedStatus] ?? bed.bedStatus}
                          </span>
                        </span>
                      </div>
                    </SwipeListRow>
                  ))}
              </div>

              {/* 페이지 이동 — 목록은 이 안에서만 스크롤하고, 페이지 막대는 아래에 고정 */}
              {!listStatus.loading && filteredBeds.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {pageStart + 1}–{pageStart + pagedBeds.length} of {filteredBeds.length} beds
                  </span>
                  <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} prevLabel="Prev" nextLabel="Next" />
                </div>
              )}
            </div>
          ) : (
            <div className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto">
              {listStatus.loading && <p className="text-sm text-slate-400">Loading...</p>}
              {/* 병동 → 병실번호 순으로 카드 하나씩, 카드 안에 그 병실 소속 병상들을 나열 */}
              {bedsByRoom.map(({ wardCd, roomNo, beds }) => (
                <Panel key={`${wardCd ?? ""}|${roomNo}`} className="p-4">
                  <p className="mb-3 text-sm font-semibold text-slate-800">
                    Room {roomNo}
                    <span className="ml-2 text-xs font-normal text-slate-400">{wardLabel(wardCd)}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {beds.map((bed) => (
                      <button
                        key={bed.bedId}
                        type="button"
                        onClick={() => setSelectedBedId(bed.bedId)}
                        className={`flex w-32 flex-col items-start gap-0.5 rounded-xl px-3 py-2 text-left text-xs ring-1 ring-inset ${
                          STATUS_BADGE[bed.bedStatus] ?? "bg-slate-100 text-slate-600 ring-slate-200"
                        } ${selectedBedId === bed.bedId ? "outline outline-2 outline-offset-1 outline-sky-500" : ""}`}
                      >
                        <span className="font-medium">Bed {bed.bedNo}</span>
                        <span>{STATUS_LABEL[bed.bedStatus] ?? bed.bedStatus}</span>
                        {bed.patientId && <span className="truncate">{patientLabel(bed.patientId)}</span>}
                      </button>
                    ))}
                  </div>
                </Panel>
              ))}
              {!listStatus.loading && bedsByRoom.length === 0 && (
                <Panel className="px-4 py-16 text-center text-sm text-slate-400">No bed data available.</Panel>
              )}
            </div>
          )}

          {/* 병상을 클릭했을 때만 오른쪽에 상세 패널 표시. onClose로 선택 해제하면 다시 목록만 남음 */}
          {selectedBedId && (
            <div className="min-h-0 w-[420px] shrink-0 overflow-y-auto">
              <BedStatusDetail bedId={selectedBedId} onClose={() => setSelectedBedId(null)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BedStatusList;
